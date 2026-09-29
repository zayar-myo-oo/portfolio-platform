"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { LinkKind, ProjectCategory, ProjectStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/dal";
import { invalidate, TAG } from "@/server/cache";
import { db } from "@/server/db";
import {
  bool,
  int,
  invalid,
  json,
  list,
  optStr,
  optionalText,
  optionalUrl,
  requiredText,
  slugSchema,
  str,
  uniqueViolation,
  type ActionState,
} from "@/server/admin/form";
import { parseArchitecture } from "@/lib/architecture";
import { isHttpUrl } from "@/lib/url";
import { featureSchema, highlightSchema } from "@/lib/json-fields";
import { slugify } from "@/lib/utils";

const CASE_FIELDS = [
  "problem",
  "context",
  "goals",
  "solution",
  "architecture",
  "implementation",
  "challenges",
  "decisions",
  "performance",
  "security",
  "results",
  "lessonsLearned",
] as const;

const caseText = optionalText(50_000);
const caseShape = {
  problem: caseText,
  context: caseText,
  goals: caseText,
  solution: caseText,
  architecture: caseText,
  implementation: caseText,
  challenges: caseText,
  decisions: caseText,
  performance: caseText,
  security: caseText,
  results: caseText,
  lessonsLearned: caseText,
} satisfies Record<(typeof CASE_FIELDS)[number], typeof caseText>;

const linkSchema = z.object({
  label: z.string().trim().min(1, "Each link needs a label.").max(60),
  url: z.string().trim().max(500).refine(isHttpUrl, "Each link needs a full http(s) URL."),
});

const schema = z.object({
  title: requiredText(120),
  slug: slugSchema,
  tagline: optionalText(160),
  summary: requiredText(400),
  description: optionalText(50_000),
  role: optionalText(200),
  year: z.number({ error: "Enter a year." }).int().min(1990).max(2100),
  duration: optionalText(60),
  status: z.enum(ProjectStatus),
  categories: z.array(z.enum(ProjectCategory)).max(8),
  typeLabel: optionalText(60),
  ...caseShape,
  architectureDiagram: optionalText(10_000),
  features: z.array(featureSchema).max(24),
  highlights: z.array(highlightSchema).max(8),
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  demoUrl: optionalUrl,
  hosting: optionalText(60),
  thumbnailId: z.string().nullable(),
  previewVideoId: z.string().nullable(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #ff5a1f.").nullable(),
  published: z.boolean(),
  featured: z.boolean(),
  showInPortal: z.boolean(),
  allowEmbed: z.boolean(),
  portalOrder: z.number().int().min(0).max(10_000),
  seoTitle: optionalText(70),
  seoDescription: optionalText(200),
  technologies: z.array(z.string()).max(30),
  gallery: z.array(z.string()).max(30),
  links: z.array(linkSchema).max(12),
});

type ProjectInput = z.infer<typeof schema>;

function read(formData: FormData) {
  const title = str(formData, "title");
  return {
    title,
    slug: str(formData, "slug") || slugify(title),
    tagline: optStr(formData, "tagline"),
    summary: str(formData, "summary"),
    description: optStr(formData, "description"),
    role: optStr(formData, "role"),
    year: int(formData, "year") ?? undefined,
    duration: optStr(formData, "duration"),
    status: str(formData, "status"),
    categories: list(formData, "categories"),
    typeLabel: optStr(formData, "typeLabel"),
    ...Object.fromEntries(CASE_FIELDS.map((field) => [field, optStr(formData, field)])),
    architectureDiagram: optStr(formData, "architectureDiagram"),
    features: json(formData, "features"),
    highlights: json(formData, "highlights"),
    liveUrl: optStr(formData, "liveUrl"),
    repoUrl: optStr(formData, "repoUrl"),
    demoUrl: optStr(formData, "demoUrl"),
    hosting: optStr(formData, "hosting"),
    thumbnailId: optStr(formData, "thumbnailId"),
    previewVideoId: optStr(formData, "previewVideoId"),
    accent: optStr(formData, "accent"),
    published: bool(formData, "published"),
    featured: bool(formData, "featured"),
    showInPortal: bool(formData, "showInPortal"),
    allowEmbed: bool(formData, "allowEmbed"),
    portalOrder: int(formData, "portalOrder") ?? 0,
    seoTitle: optStr(formData, "seoTitle"),
    seoDescription: optStr(formData, "seoDescription"),
    technologies: list(formData, "technologies"),
    gallery: list(formData, "gallery"),
    links: json(formData, "links"),
  };
}

function validate(formData: FormData): { data: ProjectInput } | { state: ActionState } {
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return { state: invalid(parsed.error) };
  const diagram = parseArchitecture(parsed.data.architectureDiagram);
  if (diagram.errors.length) {
    const first = diagram.errors[0];
    const message = `Diagram line ${first.line}: ${first.message}`;
    return { state: { status: "error", message, errors: { architectureDiagram: message } } };
  }
  return { data: parsed.data };
}

function scalarData(data: ProjectInput) {
  const { technologies: _t, gallery: _g, links: _l, ...rest } = data;
  void _t;
  void _g;
  void _l;
  return rest;
}

function relations(data: ProjectInput) {
  return {
    technologies: data.technologies.map((technologyId, order) => ({ technologyId, order })),
    gallery: data.gallery.map((mediaId, order) => ({ mediaId, order })),
    links: data.links.map((link, order) => ({
      ...link,
      order,
      kind: /github\.com|gitlab\.com|bitbucket\.org/.test(link.url) ? LinkKind.REPOSITORY : LinkKind.OTHER,
    })),
  };
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const result = validate(formData);
  if ("state" in result) return result.state;
  const { data } = result;
  const rel = relations(data);

  let id: string;
  try {
    const project = await db.project.create({
      data: {
        ...scalarData(data),
        publishedAt: data.published ? new Date() : null,
        technologies: { create: rel.technologies },
        gallery: { create: rel.gallery },
        links: { create: rel.links },
      },
      select: { id: true },
    });
    id = project.id;
  } catch (error) {
    return uniqueViolation(error, "slug", "Another project already uses this slug.") ?? { status: "error", message: "Could not create the project." };
  }
  invalidate(TAG.projects);
  redirect(`/admin/projects/${id}?saved=1`);
}

export async function updateProject(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const result = validate(formData);
  if ("state" in result) return result.state;
  const { data } = result;
  const rel = relations(data);

  try {
    const existing = await db.project.findUniqueOrThrow({ where: { id }, select: { publishedAt: true } });
    await db.$transaction([
      db.projectTechnology.deleteMany({ where: { projectId: id } }),
      db.projectMedia.deleteMany({ where: { projectId: id } }),
      db.projectLink.deleteMany({ where: { projectId: id } }),
      db.project.update({
        where: { id },
        data: {
          ...scalarData(data),
          publishedAt: data.published ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
          technologies: { create: rel.technologies },
          gallery: { create: rel.gallery },
          links: { create: rel.links },
        },
      }),
    ]);
  } catch (error) {
    return uniqueViolation(error, "slug", "Another project already uses this slug.") ?? { status: "error", message: "Could not save the project." };
  }
  invalidate(TAG.projects);
  return { status: "success", message: "Project saved — the public site is updated." };
}

export async function deleteProject(id: string): Promise<void> {
  await requireAdmin();
  await db.project.delete({ where: { id } }).catch(() => null);
  invalidate(TAG.projects);
  redirect("/admin/projects");
}

// ── Portal management ──────────────────────────────────────────────────────

const flagSchema = z.enum(["showInPortal", "featured", "allowEmbed", "published"]);

export async function setProjectFlag(id: string, flag: string, value: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  const field = flagSchema.safeParse(flag);
  if (!field.success) return { ok: false };
  const data: Record<string, unknown> = { [field.data]: value };
  if (field.data === "published" && value) {
    const current = await db.project.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!current?.publishedAt) data.publishedAt = new Date();
  }
  await db.project.update({ where: { id }, data });
  invalidate(TAG.projects);
  return { ok: true };
}

export async function reorderPortal(ids: string[]): Promise<{ ok: boolean }> {
  await requireAdmin();
  const parsed = z.array(z.string().min(1).max(40)).max(500).safeParse(ids);
  if (!parsed.success) return { ok: false };
  await db.$transaction(parsed.data.map((id, portalOrder) => db.project.update({ where: { id }, data: { portalOrder } })));
  invalidate(TAG.projects);
  return { ok: true };
}
