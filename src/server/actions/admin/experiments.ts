"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ExperimentKind, ExperimentStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/dal";
import { invalidate, TAG } from "@/server/cache";
import { db } from "@/server/db";
import { bool, int, invalid, list, optStr, optionalText, optionalUrl, requiredText, slugSchema, str, uniqueViolation, type ActionState } from "@/server/admin/form";
import { SKETCH_KEYS } from "@/lib/sketches";
import { slugify } from "@/lib/utils";

const schema = z.object({
  title: requiredText(120),
  slug: slugSchema,
  summary: requiredText(400),
  description: optionalText(20_000),
  status: z.enum(ExperimentStatus),
  kind: z.enum(ExperimentKind),
  year: z.number({ error: "Enter a year." }).int().min(1990).max(2100),
  sketch: z.enum(SKETCH_KEYS).nullable(),
  url: optionalUrl,
  repoUrl: optionalUrl,
  thumbnailId: z.string().nullable(),
  published: z.boolean(),
  featured: z.boolean(),
  order: z.number().int().min(0).max(1000),
  technologies: z.array(z.string()).max(20),
});

function read(formData: FormData) {
  const title = str(formData, "title");
  return {
    title,
    slug: str(formData, "slug") || slugify(title),
    summary: str(formData, "summary"),
    description: optStr(formData, "description"),
    status: str(formData, "status"),
    kind: str(formData, "kind"),
    year: int(formData, "year") ?? undefined,
    sketch: optStr(formData, "sketch"),
    url: optStr(formData, "url"),
    repoUrl: optStr(formData, "repoUrl"),
    thumbnailId: optStr(formData, "thumbnailId"),
    published: bool(formData, "published"),
    featured: bool(formData, "featured"),
    order: int(formData, "order") ?? 0,
    technologies: list(formData, "technologies"),
  };
}

export async function createExperiment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { technologies, ...data } = parsed.data;
  let id: string;
  try {
    id = (await db.experiment.create({ data: { ...data, technologies: { connect: technologies.map((t) => ({ id: t })) } }, select: { id: true } })).id;
  } catch (error) {
    return uniqueViolation(error, "slug", "Another experiment already uses this slug.") ?? { status: "error", message: "Could not create it." };
  }
  invalidate(TAG.experiments);
  redirect(`/admin/experiments/${id}?saved=1`);
}

export async function updateExperiment(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { technologies, ...data } = parsed.data;
  try {
    await db.experiment.update({
      where: { id },
      data: { ...data, isSample: false, technologies: { set: technologies.map((t) => ({ id: t })) } },
    });
  } catch (error) {
    return uniqueViolation(error, "slug", "Another experiment already uses this slug.") ?? { status: "error", message: "Could not save it." };
  }
  invalidate(TAG.experiments);
  return { status: "success", message: "Experiment saved." };
}

export async function deleteExperiment(id: string): Promise<void> {
  await requireAdmin();
  await db.experiment.delete({ where: { id } }).catch(() => null);
  invalidate(TAG.experiments);
  redirect("/admin/experiments");
}
