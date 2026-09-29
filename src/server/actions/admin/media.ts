"use server";

import { z } from "zod";
import { requireAdmin } from "@/server/auth/dal";
import { invalidate, TAG } from "@/server/cache";
import { db } from "@/server/db";
import { mediaUrl } from "@/server/data/mappers";
import { deleteUpload, storeUpload, UploadError } from "@/server/storage";
import type { ActionState } from "@/server/admin/form";

const MAX_FILES = 12;

async function saveFiles(files: File[]) {
  const saved = [];
  const errors: string[] = [];
  for (const file of files.slice(0, MAX_FILES)) {
    try {
      const stored = await storeUpload(file);
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 200);
      saved.push(await db.media.create({ data: { ...stored, originalName: file.name.slice(0, 200), alt } }));
    } catch (error) {
      errors.push(error instanceof UploadError ? error.message : `${file.name}: upload failed.`);
    }
  }
  if (files.length > MAX_FILES) errors.push(`Only the first ${MAX_FILES} files were uploaded.`);
  if (saved.length) invalidate(TAG.media);
  return { saved, errors };
}

function filesFrom(formData: FormData): File[] {
  return formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
}

/** Media library upload form. */
export async function uploadMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const files = filesFrom(formData);
  if (!files.length) return { status: "error", message: "Choose at least one file." };
  const { saved, errors } = await saveFiles(files);
  if (!saved.length) return { status: "error", message: errors.join(" ") };
  return {
    status: errors.length ? "error" : "success",
    message: `Uploaded ${saved.length} file${saved.length === 1 ? "" : "s"}.${errors.length ? ` ${errors.join(" ")}` : ""}`,
  };
}

/** Single upload from a MediaPicker dialog. */
export async function uploadMediaInline(formData: FormData): Promise<{ error?: string; media?: { id: string; url: string; alt: string } }> {
  await requireAdmin();
  const { saved, errors } = await saveFiles(filesFrom(formData).slice(0, 1));
  const media = saved[0];
  if (!media) return { error: errors[0] ?? "Upload failed." };
  return { media: { id: media.id, url: mediaUrl(media.key), alt: media.alt } };
}

const altSchema = z.object({ alt: z.string().trim().max(300) });

export async function updateMediaAlt(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = altSchema.safeParse({ alt: formData.get("alt") });
  if (!parsed.success) return { status: "error", message: "Alt text is too long." };
  await db.media.update({ where: { id }, data: { alt: parsed.data.alt } });
  invalidate(TAG.media);
  return { status: "success", message: "Saved." };
}

export async function deleteMedia(id: string): Promise<void> {
  await requireAdmin();
  const media = await db.media.delete({ where: { id } }).catch(() => null);
  if (media) {
    await deleteUpload(media.key).catch(() => {});
    invalidate(TAG.media);
  }
}
