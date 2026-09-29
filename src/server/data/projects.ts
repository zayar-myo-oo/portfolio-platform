import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAG } from "@/server/cache";
import { renderFields, renderMarkdown } from "@/server/markdown/render";
import { parseArchitecture } from "@/lib/architecture";
import { featureSchema, highlightSchema, parseJsonList } from "@/lib/json-fields";
import type { ProjectCard, ProjectDetail } from "@/lib/types";
import { mediaSelect, projectCardSelect, toMedia, toProjectCard } from "./mappers";

/** All published projects, featured first, then newest. */
export async function getPublishedProjects(): Promise<ProjectCard[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.projects);

  const rows = await db.project.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { year: "desc" }, { updatedAt: "desc" }],
    select: projectCardSelect,
  });
  return rows.map(toProjectCard);
}

/** Portal dataset: published + visible in portal, in the admin-defined order. */
export async function getPortalProjects(): Promise<ProjectCard[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.projects);

  const rows = await db.project.findMany({
    where: { published: true, showInPortal: true },
    orderBy: [{ portalOrder: "asc" }, { year: "desc" }],
    select: projectCardSelect,
  });
  return rows.map(toProjectCard);
}

export async function getFeaturedProjects(limit = 4): Promise<ProjectCard[]> {
  const projects = await getPublishedProjects();
  const featured = projects.filter((project) => project.featured);
  return (featured.length ? featured : projects).slice(0, limit);
}

export async function getPublishedProjectSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.projects);

  const rows = await db.project.findMany({ where: { published: true }, select: { slug: true } });
  return rows.map((row) => row.slug);
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.projects);

  const row = await db.project.findFirst({
    where: { slug, published: true },
    select: {
      ...projectCardSelect,
      role: true,
      duration: true,
      description: true,
      problem: true,
      context: true,
      goals: true,
      solution: true,
      architecture: true,
      architectureDiagram: true,
      implementation: true,
      challenges: true,
      decisions: true,
      performance: true,
      security: true,
      results: true,
      lessonsLearned: true,
      features: true,
      highlights: true,
      seoTitle: true,
      seoDescription: true,
      gallery: { orderBy: { order: "asc" }, select: { caption: true, media: { select: mediaSelect } } },
      links: { orderBy: { order: "asc" }, select: { id: true, label: true, url: true, kind: true } },
      posts: {
        where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, title: true, excerpt: true, publishedAt: true, readingMinutes: true },
      },
      experiences: { where: { published: true }, select: { id: true, company: true, role: true } },
    },
  });
  if (!row) return null;

  const [description, sections, neighbours] = await Promise.all([
    renderMarkdown(row.description),
    renderFields({
      problem: row.problem,
      context: row.context,
      goals: row.goals,
      solution: row.solution,
      architecture: row.architecture,
      implementation: row.implementation,
      challenges: row.challenges,
      decisions: row.decisions,
      performance: row.performance,
      security: row.security,
      results: row.results,
      lessonsLearned: row.lessonsLearned,
    }),
    getNeighbours(row.slug),
  ]);

  const diagram = row.architectureDiagram ? parseArchitecture(row.architectureDiagram) : null;

  return {
    ...toProjectCard(row),
    role: row.role,
    duration: row.duration,
    descriptionHtml: description.html,
    sections,
    diagram: diagram && diagram.layers.length ? diagram : null,
    features: parseJsonList(featureSchema, row.features),
    highlights: parseJsonList(highlightSchema, row.highlights),
    gallery: row.gallery.flatMap((item) => {
      const media = toMedia(item.media);
      return media ? [{ media, caption: item.caption }] : [];
    }),
    links: row.links,
    posts: row.posts,
    experiences: row.experiences,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    neighbours,
  };
}

async function getNeighbours(slug: string): Promise<ProjectDetail["neighbours"]> {
  const projects = await getPublishedProjects();
  const index = projects.findIndex((project) => project.slug === slug);
  const pick = (i: number) => {
    const project = projects[(i + projects.length) % projects.length];
    return project && project.slug !== slug ? { slug: project.slug, title: project.title, year: project.year } : null;
  };
  if (index === -1 || projects.length < 2) return { previous: null, next: null };
  return { previous: pick(index - 1), next: pick(index + 1) };
}
