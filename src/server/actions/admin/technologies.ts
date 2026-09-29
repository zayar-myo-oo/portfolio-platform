"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Proficiency, TechCategory } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/dal";
import { invalidate, TAG } from "@/server/cache";
import { db } from "@/server/db";
import { bool, int, invalid, optStr, optionalText, optionalUrl, requiredText, slugSchema, str, uniqueViolation, type ActionState } from "@/server/admin/form";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: requiredText(60),
  slug: slugSchema,
  category: z.enum(TechCategory),
  proficiency: z.enum(Proficiency),
  since: z.number().int().min(1970).max(2100).nullable(),
  description: optionalText(400),
  url: optionalUrl,
  featured: z.boolean(),
  order: z.number().int().min(0).max(1000),
});

function read(formData: FormData) {
  const name = str(formData, "name");
  return {
    name,
    slug: str(formData, "slug") || slugify(name),
    category: str(formData, "category"),
    proficiency: str(formData, "proficiency"),
    since: int(formData, "since"),
    description: optStr(formData, "description"),
    url: optStr(formData, "url"),
    featured: bool(formData, "featured"),
    order: int(formData, "order") ?? 0,
  };
}

export async function createTechnology(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await db.technology.create({ data: parsed.data });
  } catch (error) {
    return uniqueViolation(error, "name", "A technology with this name or slug already exists.") ?? { status: "error", message: "Could not create it." };
  }
  invalidate(TAG.technologies);
  redirect("/admin/technologies?saved=1");
}

export async function updateTechnology(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await db.technology.update({ where: { id }, data: { ...parsed.data, isSample: false } });
  } catch (error) {
    return uniqueViolation(error, "name", "A technology with this name or slug already exists.") ?? { status: "error", message: "Could not save it." };
  }
  invalidate(TAG.technologies);
  return { status: "success", message: "Saved — usage counts and the stack views are updated." };
}

export async function deleteTechnology(id: string): Promise<void> {
  await requireAdmin();
  await db.technology.delete({ where: { id } }).catch(() => null);
  invalidate(TAG.technologies);
  redirect("/admin/technologies");
}
