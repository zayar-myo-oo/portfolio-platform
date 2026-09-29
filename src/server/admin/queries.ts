import "server-only";
import { db } from "@/server/db";
import { mediaUrl } from "@/server/data/mappers";
import { TECH_CATEGORY } from "@/lib/constants";

/* Admin reads are never cached — the CMS must always show the truth. */

export async function technologyOptions() {
  const rows = await db.technology.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }], select: { id: true, name: true, category: true } });
  return rows.map((row) => ({ value: row.id, label: row.name, group: TECH_CATEGORY[row.category] }));
}

export async function projectOptions() {
  const rows = await db.project.findMany({ orderBy: [{ year: "desc" }, { title: "asc" }], select: { id: true, title: true, year: true } });
  return rows.map((row) => ({ value: row.id, label: `${row.title} (${row.year})` }));
}

export async function categoryOptions() {
  const rows = await db.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  return rows.map((row) => ({ value: row.id, label: row.name }));
}

type MediaRef = { id: string; key: string; alt: string } | null;
export function pickerValue(media: MediaRef) {
  return media ? { id: media.id, url: mediaUrl(media.key), alt: media.alt } : null;
}

export const mediaRefSelect = { select: { id: true, key: true, alt: true } } as const;
