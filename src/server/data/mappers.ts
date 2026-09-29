import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { MediaAsset, ProjectCard, TechRef } from "@/lib/types";
import { detectHosting } from "@/lib/url";

export const mediaSelect = {
  id: true,
  key: true,
  alt: true,
  width: true,
  height: true,
  mimeType: true,
  kind: true,
} satisfies Prisma.MediaSelect;

type MediaRow = Prisma.MediaGetPayload<{ select: typeof mediaSelect }>;

export function mediaUrl(key: string): string {
  return `/media/${key}`;
}

export function toMedia(row: MediaRow | null | undefined): MediaAsset | null {
  if (!row) return null;
  return {
    id: row.id,
    url: mediaUrl(row.key),
    alt: row.alt,
    width: row.width,
    height: row.height,
    mimeType: row.mimeType,
    kind: row.kind,
  };
}

export const techRefSelect = { name: true, slug: true, category: true } satisfies Prisma.TechnologySelect;

export function toTechRef(row: TechRef): TechRef {
  return { name: row.name, slug: row.slug, category: row.category };
}

export const projectCardSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  summary: true,
  year: true,
  status: true,
  categories: true,
  typeLabel: true,
  featured: true,
  isSample: true,
  accent: true,
  liveUrl: true,
  repoUrl: true,
  demoUrl: true,
  hosting: true,
  allowEmbed: true,
  showInPortal: true,
  portalOrder: true,
  updatedAt: true,
  publishedAt: true,
  thumbnail: { select: mediaSelect },
  previewVideo: { select: mediaSelect },
  technologies: {
    orderBy: { order: "asc" },
    select: { technology: { select: techRefSelect } },
  },
} satisfies Prisma.ProjectSelect;

export type ProjectCardRow = Prisma.ProjectGetPayload<{ select: typeof projectCardSelect }>;

export function toProjectCard(row: ProjectCardRow): ProjectCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    summary: row.summary,
    year: row.year,
    status: row.status,
    categories: row.categories,
    typeLabel: row.typeLabel,
    featured: row.featured,
    isSample: row.isSample,
    accent: row.accent,
    liveUrl: row.liveUrl,
    repoUrl: row.repoUrl,
    demoUrl: row.demoUrl,
    hosting: detectHosting(row.liveUrl, row.hosting),
    allowEmbed: row.allowEmbed,
    showInPortal: row.showInPortal,
    portalOrder: row.portalOrder,
    thumbnail: toMedia(row.thumbnail),
    previewVideo: toMedia(row.previewVideo),
    technologies: row.technologies.map((entry) => toTechRef(entry.technology)),
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  };
}
