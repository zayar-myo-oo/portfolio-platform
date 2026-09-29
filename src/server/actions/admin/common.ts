"use server";

import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { renderMarkdown } from "@/server/markdown/render";
import { mediaUrl } from "@/server/data/mappers";

/** Server-side Markdown preview — the exact pipeline the public site uses. */
export async function previewMarkdown(markdown: string): Promise<string> {
  await requireAdmin();
  if (typeof markdown !== "string" || markdown.length > 200_000) return "";
  return (await renderMarkdown(markdown)).html;
}

export type MediaOption = { id: string; url: string; alt: string; kind: "IMAGE" | "VIDEO"; name: string };

export async function listMediaOptions(): Promise<MediaOption[]> {
  await requireAdmin();
  const rows = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, key: true, alt: true, kind: true, originalName: true },
  });
  return rows.map((row) => ({ id: row.id, url: mediaUrl(row.key), alt: row.alt, kind: row.kind, name: row.originalName }));
}
