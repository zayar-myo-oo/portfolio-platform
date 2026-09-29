import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAG } from "@/server/cache";
import { renderMarkdown } from "@/server/markdown/render";
import type { ExperienceItem } from "@/lib/types";
import { techRefSelect, toTechRef } from "./mappers";

export async function getExperience(): Promise<ExperienceItem[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.experience);

  const rows = await db.experience.findMany({
    where: { published: true },
    // Current roles first, then most recent start date; `order` breaks ties.
    orderBy: [{ startDate: "desc" }, { order: "asc" }],
    include: {
      technologies: { select: techRefSelect, orderBy: { name: "asc" } },
      projects: { where: { published: true }, select: { slug: true, title: true, year: true } },
    },
  });

  const items = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      company: row.company,
      companyUrl: row.companyUrl,
      role: row.role,
      location: row.location,
      employmentType: row.employmentType,
      startDate: row.startDate,
      endDate: row.endDate,
      summary: row.summary,
      descriptionHtml: (await renderMarkdown(row.description)).html,
      responsibilities: row.responsibilities,
      achievements: row.achievements,
      isSample: row.isSample,
      technologies: row.technologies.map(toTechRef),
      projects: row.projects,
    })),
  );

  return items.sort((a, b) => Number(b.endDate === null) - Number(a.endDate === null));
}

/** Years since the earliest non-education role started (derived, never typed in). */
export async function getCareerStats(): Promise<{ years: number | null; roles: number; since: number | null }> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.experience);

  const rows = await db.experience.findMany({
    where: { published: true, NOT: { employmentType: "EDUCATION" } },
    select: { startDate: true },
    orderBy: { startDate: "asc" },
  });
  if (!rows.length) return { years: null, roles: 0, since: null };
  const first = rows[0].startDate;
  const years = (Date.now() - first.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return { years: Math.max(0, Math.floor(years * 2) / 2), roles: rows.length, since: first.getUTCFullYear() };
}
