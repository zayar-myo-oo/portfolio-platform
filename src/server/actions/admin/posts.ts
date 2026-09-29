"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { PostStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/dal";
import { invalidate, TAG } from "@/server/cache";
import { db } from "@/server/db";
import {
  bool,
  invalid,
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
import { readingMinutes, slugify } from "@/lib/utils";

const schema = z.object({
  title: requiredText(160),
  slug: slugSchema,
  excerpt: requiredText(400),
  content: z.string().max(200_000),
  status: z.enum(PostStatus),
  publishedAt: z.iso.datetime().nullable(),
  featured: z.boolean(),
  categoryId: z.string().nullable(),
  coverId: z.string().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  projects: z.array(z.string()).max(20),
  seoTitle: optionalText(70),
  seoDescription: optionalText(200),
  canonicalUrl: optionalUrl,
});

function read(formData: FormData) {
  const title = str(formData, "title");
  return {
    title,
    slug: str(formData, "slug") || slugify(title),
    excerpt: str(formData, "excerpt"),
    content: String(formData.get("content") ?? ""),
    status: str(formData, "status"),
    publishedAt: optStr(formData, "publishedAt"),
    featured: bool(formData, "featured"),
    categoryId: optStr(formData, "categoryId"),
    coverId: optStr(formData, "coverId"),
    tags: str(formData, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    projects: list(formData, "projects"),
    seoTitle: optStr(formData, "seoTitle"),
    seoDescription: optStr(formData, "seoDescription"),
    canonicalUrl: optStr(formData, "canonicalUrl"),
  };
}

/** Tags are typed as free text and created on demand. */
async function resolveTags(names: string[]) {
  const unique = [...new Map(names.map((name) => [slugify(name), name])).entries()].filter(([slug]) => slug);
  return Promise.all(
    unique.map(([slug, name]) => db.tag.upsert({ where: { slug }, create: { slug, name }, update: {}, select: { id: true } })),
  );
}

function postData(data: z.infer<typeof schema>) {
  // Publishing without a date means "now"; a future date means "scheduled".
  const publishedAt = data.status === "PUBLISHED" ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : data.publishedAt ? new Date(data.publishedAt) : null;
  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    status: data.status,
    publishedAt,
    featured: data.featured,
    categoryId: data.categoryId,
    coverId: data.coverId,
    readingMinutes: readingMinutes(data.content),
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    canonicalUrl: data.canonicalUrl,
    // Once edited in the CMS, a post is the owner's own content.
    isSample: false,
  };
}

export async function createPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const tags = await resolveTags(parsed.data.tags);

  let id: string;
  try {
    const post = await db.blogPost.create({
      data: {
        ...postData(parsed.data),
        tags: { connect: tags },
        projects: { connect: parsed.data.projects.map((projectId) => ({ id: projectId })) },
      },
      select: { id: true },
    });
    id = post.id;
  } catch (error) {
    return uniqueViolation(error, "slug", "Another post already uses this slug.") ?? { status: "error", message: "Could not create the post." };
  }
  invalidate(TAG.posts);
  redirect(`/admin/blog/${id}?saved=1`);
}

export async function updatePost(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(read(formData));
  if (!parsed.success) return invalid(parsed.error);
  const tags = await resolveTags(parsed.data.tags);

  try {
    await db.blogPost.update({
      where: { id },
      data: {
        ...postData(parsed.data),
        tags: { set: tags },
        projects: { set: parsed.data.projects.map((projectId) => ({ id: projectId })) },
      },
    });
  } catch (error) {
    return uniqueViolation(error, "slug", "Another post already uses this slug.") ?? { status: "error", message: "Could not save the post." };
  }
  invalidate(TAG.posts);
  const scheduled = parsed.data.status === "PUBLISHED" && parsed.data.publishedAt && new Date(parsed.data.publishedAt) > new Date();
  return {
    status: "success",
    message: scheduled ? "Saved — scheduled to publish automatically." : parsed.data.status === "DRAFT" ? "Draft saved (not public)." : "Published — the site is updated.",
  };
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  await db.blogPost.delete({ where: { id } }).catch(() => null);
  invalidate(TAG.posts);
  redirect("/admin/blog");
}

// ── Categories ─────────────────────────────────────────────────────────────

const categorySchema = z.object({ name: requiredText(60), slug: slugSchema, description: optionalText(300) });

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(formData, "name");
  const parsed = categorySchema.safeParse({ name, slug: str(formData, "slug") || slugify(name), description: optStr(formData, "description") });
  if (!parsed.success) return invalid(parsed.error);
  try {
    const order = await db.category.count();
    await db.category.create({ data: { ...parsed.data, order } });
  } catch (error) {
    return uniqueViolation(error, "name", "That category already exists.") ?? { status: "error", message: "Could not create the category." };
  }
  invalidate(TAG.posts);
  return { status: "success", message: `Category “${parsed.data.name}” created.` };
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  await db.category.delete({ where: { id } }).catch(() => null);
  invalidate(TAG.posts);
}
