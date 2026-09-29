import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAG } from "@/server/cache";
import { PROFICIENCY, TECH_CATEGORY_ORDER } from "@/lib/constants";
import type { TechnologyItem } from "@/lib/types";

/**
 * Technologies with *evidence*: usage counts and relationships are derived
 * from published projects, so "React — used in 8 projects" is always true.
 */
export async function getTechnologies(): Promise<TechnologyItem[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.technologies, TAG.projects);

  const rows = await db.technology.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      projects: {
        where: { project: { published: true } },
        select: {
          project: {
            select: {
              slug: true,
              title: true,
              year: true,
              technologies: { select: { technology: { select: { slug: true, name: true } } } },
            },
          },
        },
      },
    },
  });

  return rows
    .map((row) => {
      const cooccurrence = new Map<string, { slug: string; name: string; weight: number }>();
      for (const { project } of row.projects) {
        for (const { technology } of project.technologies) {
          if (technology.slug === row.slug) continue;
          const entry = cooccurrence.get(technology.slug) ?? { ...technology, weight: 0 };
          entry.weight++;
          cooccurrence.set(technology.slug, entry);
        }
      }
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        proficiency: row.proficiency,
        since: row.since,
        description: row.description,
        url: row.url,
        featured: row.featured,
        isSample: row.isSample,
        projectCount: row.projects.length,
        projects: row.projects.map(({ project }) => ({ slug: project.slug, title: project.title, year: project.year })),
        related: [...cooccurrence.values()].sort((a, b) => b.weight - a.weight).slice(0, 5),
      };
    })
    .sort(
      (a, b) =>
        TECH_CATEGORY_ORDER.indexOf(a.category) - TECH_CATEGORY_ORDER.indexOf(b.category) ||
        b.projectCount - a.projectCount ||
        PROFICIENCY[b.proficiency].rank - PROFICIENCY[a.proficiency].rank ||
        a.name.localeCompare(b.name),
    );
}
