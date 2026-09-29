import type { ProjectCategory, ProjectStatus } from "@/generated/prisma/enums";
import { PROJECT_CATEGORY, PROJECT_CATEGORY_ORDER, PROJECT_STATUS } from "@/lib/constants";
import type { ProjectCard } from "@/lib/types";

export type PortalSort = "featured" | "newest" | "oldest" | "updated";
export type PortalView = "grid" | "index" | "spatial";
export type PortalState = {
  query: string;
  category: ProjectCategory | "ALL";
  status: ProjectStatus | "ALL";
  sort: PortalSort;
  view: PortalView;
};

export const DEFAULT_PORTAL_STATE: PortalState = { query: "", category: "ALL", status: "ALL", sort: "featured", view: "grid" };

export const SORT_LABELS: Record<PortalSort, string> = {
  featured: "Featured",
  newest: "Newest",
  oldest: "Oldest",
  updated: "Recently updated",
};

function haystack(project: ProjectCard): string {
  return [
    project.title,
    project.tagline,
    project.summary,
    project.typeLabel,
    project.hosting?.name,
    PROJECT_STATUS[project.status].label,
    ...project.categories.map((c) => PROJECT_CATEGORY[c]),
    ...project.technologies.map((t) => t.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** All whitespace-separated terms must match (AND), in any field. */
export function matchesQuery(project: ProjectCard, query: string): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const text = haystack(project);
  return terms.every((term) => text.includes(term));
}

export function filterProjects(projects: ProjectCard[], state: PortalState): ProjectCard[] {
  const filtered = projects.filter(
    (project) =>
      (state.category === "ALL" || project.categories.includes(state.category)) &&
      (state.status === "ALL" || project.status === state.status) &&
      matchesQuery(project, state.query),
  );
  const time = (date: Date | null) => (date ? new Date(date).getTime() : 0);
  return filtered.sort((a, b) => {
    switch (state.sort) {
      case "newest":
        return b.year - a.year || time(b.publishedAt) - time(a.publishedAt);
      case "oldest":
        return a.year - b.year || time(a.publishedAt) - time(b.publishedAt);
      case "updated":
        return time(b.updatedAt) - time(a.updatedAt);
      default:
        return a.portalOrder - b.portalOrder || Number(b.featured) - Number(a.featured) || b.year - a.year;
    }
  });
}

/** Category counts for the *current* query/status, so chips show what you'd get. */
export function categoryCounts(projects: ProjectCard[], state: PortalState): Array<{ key: ProjectCategory | "ALL"; label: string; count: number }> {
  const base = projects.filter(
    (project) => (state.status === "ALL" || project.status === state.status) && matchesQuery(project, state.query),
  );
  return [
    { key: "ALL", label: "All", count: base.length },
    ...PROJECT_CATEGORY_ORDER.map((key) => ({
      key,
      label: PROJECT_CATEGORY[key],
      count: base.filter((project) => project.categories.includes(key)).length,
    })),
  ];
}

export function parsePortalState(search: string): PortalState {
  const params = new URLSearchParams(search);
  const category = params.get("category")?.toUpperCase();
  const status = params.get("status")?.toUpperCase();
  const sort = params.get("sort");
  const view = params.get("view");
  return {
    query: (params.get("q") ?? "").slice(0, 80),
    category: category && category in PROJECT_CATEGORY ? (category as ProjectCategory) : "ALL",
    status: status && status in PROJECT_STATUS ? (status as ProjectStatus) : "ALL",
    sort: sort && sort in SORT_LABELS ? (sort as PortalSort) : "featured",
    view: view === "index" || view === "spatial" ? view : "grid",
  };
}

export function serializePortalState(state: PortalState): string {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category !== "ALL") params.set("category", state.category.toLowerCase());
  if (state.status !== "ALL") params.set("status", state.status.toLowerCase());
  if (state.sort !== "featured") params.set("sort", state.sort);
  if (state.view !== "grid") params.set("view", state.view);
  const query = params.toString();
  return query ? `?${query}` : "";
}
