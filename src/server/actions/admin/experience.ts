"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { EmploymentType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/dal";
import { invalidate, TAG } from "@/server/cache";
import { db } from "@/server/db";
import { bool, int, invalid, list, optStr, optionalText, optionalUrl, requiredText, str, type ActionState } from "@/server/admin/form";

const schema = z
  .object({
    company: requiredText(160),
    companyUrl: optionalUrl,
    role: requiredText(160),
    location: optionalText(120),
    employmentType: z.enum(EmploymentType),
    startDate: z.iso.datetime({ error: "Choose a start month." }),
    endDate: z.iso.datetime().nullable(),
    summary: requiredText(500),
    description: optionalText(20_000),
    responsibilities: z.array(z.string().max(300)).max(20),
    achievements: z.array(z.string().max(300)).max(20),
    technologies: z.array(z.string()).max(30),
    projects: z.array(z.string()).max(20),
    order: z.number().int().min(0).max(1000),
    published: z.boolean(),
  })
  .refine((data) => !data.endDate || new Date(data.endDate) >= new Date(data.startDate), {
    path: ["endDate"],
    message: "End date must be after the start date.",
  });

function read(formData: FormData) {
  return {
    company: str(formData, "company"),
    companyUrl: optStr(formData, "companyUrl"),
    role: str(formData, "role"),
    location: optStr(formData, "location"),
    employmentType: str(formData, "employmentType"),
    startDate: str(formData, "startDate"),
    endDate: bool(formData, "current") ? null : optStr(formData, "endDate"),
    summary: str(formData, "summary"),
    description: optStr(formData, "description"),
    responsibilities: list(formData, "responsibilities"),
    achievements: list(formData, "achievements"),
    technologies: list(formData, "technologies"),
    projects: list(formData, "projects"),
    order: int(formData, "order") ?? 0,
    published: bool(formData, "published"),
  };
}

function toData(data: z.infer<typeof schema>) {
  const { technologies, projects, startDate, endDate, ...rest } = data;
  return {
    ...rest,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    isSample: false,
    technologies: { set: technologies.map((id) => ({ id })) },
    projects: { set: projects.map((id) => ({ id })) },
  };
}

export async function createExperience(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { technologies, projects, ...rest } = toData(parsed.data);
  const created = await db.experience.create({
    data: { ...rest, technologies: { connect: technologies.set }, projects: { connect: projects.set } },
    select: { id: true },
  });
  invalidate(TAG.experience);
  redirect(`/admin/experience/${created.id}?saved=1`);
}

export async function updateExperience(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  await db.experience.update({ where: { id }, data: toData(parsed.data) });
  invalidate(TAG.experience);
  return { status: "success", message: "Experience saved — the timeline is updated." };
}

export async function deleteExperience(id: string): Promise<void> {
  await requireAdmin();
  await db.experience.delete({ where: { id } }).catch(() => null);
  invalidate(TAG.experience);
  redirect("/admin/experience");
}
