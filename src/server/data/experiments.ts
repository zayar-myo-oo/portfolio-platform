import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { TAG } from "@/server/cache";
import { renderMarkdown } from "@/server/markdown/render";
import type { ExperimentCard, ExperimentDetail } from "@/lib/types";
import { mediaSelect, techRefSelect, toMedia, toTechRef } from "./mappers";

const experimentSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  status: true,
  kind: true,
  year: true,
  sketch: true,
  url: true,
  repoUrl: true,
  featured: true,
  isSample: true,
  thumbnail: { select: mediaSelect },
  technologies: { select: techRefSelect, orderBy: { name: "asc" } },
} satisfies Prisma.ExperimentSelect;

type ExperimentRow = Prisma.ExperimentGetPayload<{ select: typeof experimentSelect }>;

function toCard(row: ExperimentRow): ExperimentCard {
  return { ...row, thumbnail: toMedia(row.thumbnail), technologies: row.technologies.map(toTechRef) };
}

export async function getExperiments(): Promise<ExperimentCard[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.experiments);

  const rows = await db.experiment.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { year: "desc" }],
    select: experimentSelect,
  });
  return rows.map(toCard);
}

export async function getExperimentBySlug(slug: string): Promise<ExperimentDetail | null> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.experiments);

  const row = await db.experiment.findFirst({
    where: { slug, published: true },
    select: { ...experimentSelect, description: true },
  });
  if (!row) return null;
  return { ...toCard(row), descriptionHtml: (await renderMarkdown(row.description)).html };
}
