import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { TAG } from "@/server/cache";
import { renderMarkdown } from "@/server/markdown/render";
import type { PostCard, PostDetail } from "@/lib/types";
import { mediaSelect, toMedia } from "./mappers";

const postCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  updatedAt: true,
  readingMinutes: true,
  featured: true,
  isSample: true,
  cover: { select: mediaSelect },
  category: { select: { name: true, slug: true } },
  tags: { select: { name: true, slug: true }, orderBy: { name: "asc" } },
} satisfies Prisma.BlogPostSelect;

type PostCardRow = Prisma.BlogPostGetPayload<{ select: typeof postCardSelect }>;

function toPostCard(row: PostCardRow): PostCard {
  return { ...row, cover: toMedia(row.cover) };
}

/**
 * Scheduled posts are PUBLISHED rows with a future `publishedAt`. Cached
 * results live until the next scheduled post goes live, so it appears on
 * time without polling — and never before.
 */
async function applyScheduleLifetime(now: Date): Promise<void> {
  const next = await db.blogPost.findFirst({
    where: { status: "PUBLISHED", publishedAt: { gt: now } },
    orderBy: { publishedAt: "asc" },
    select: { publishedAt: true },
  });
  if (!next?.publishedAt) {
    cacheLife("days");
    return;
  }
  const seconds = Math.ceil((next.publishedAt.getTime() - now.getTime()) / 1000);
  cacheLife({ stale: 300, revalidate: Math.max(60, seconds), expire: Math.max(3600, seconds + 3600) });
}

const publishedWhere = (now: Date): Prisma.BlogPostWhereInput => ({
  status: "PUBLISHED",
  publishedAt: { lte: now },
});

export async function getPublishedPosts(): Promise<PostCard[]> {
  "use cache";
  cacheTag(TAG.posts);
  const now = new Date();
  await applyScheduleLifetime(now);

  const rows = await db.blogPost.findMany({
    where: publishedWhere(now),
    orderBy: { publishedAt: "desc" },
    select: postCardSelect,
  });
  return rows.map(toPostCard);
}

export async function getLatestPosts(limit = 3): Promise<PostCard[]> {
  return (await getPublishedPosts()).slice(0, limit);
}

export async function getPublishedPostSlugs(): Promise<string[]> {
  return (await getPublishedPosts()).map((post) => post.slug);
}

export async function getBlogTaxonomy(): Promise<{
  categories: Array<{ name: string; slug: string; count: number }>;
  tags: Array<{ name: string; slug: string; count: number }>;
}> {
  const posts = await getPublishedPosts();
  const categories = new Map<string, { name: string; slug: string; count: number }>();
  const tags = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of posts) {
    if (post.category) {
      const entry = categories.get(post.category.slug) ?? { ...post.category, count: 0 };
      entry.count++;
      categories.set(post.category.slug, entry);
    }
    for (const tag of post.tags) {
      const entry = tags.get(tag.slug) ?? { ...tag, count: 0 };
      entry.count++;
      tags.set(tag.slug, entry);
    }
  }
  return {
    categories: [...categories.values()].sort((a, b) => b.count - a.count),
    tags: [...tags.values()].sort((a, b) => b.count - a.count),
  };
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheTag(TAG.posts);
  const now = new Date();
  await applyScheduleLifetime(now);

  const row = await db.blogPost.findFirst({
    where: { slug, ...publishedWhere(now) },
    select: {
      ...postCardSelect,
      content: true,
      seoTitle: true,
      seoDescription: true,
      canonicalUrl: true,
      categoryId: true,
      projects: { where: { published: true }, select: { slug: true, title: true, year: true } },
    },
  });
  if (!row) return null;

  const rendered = await renderMarkdown(row.content);
  const related = await getRelatedPosts(row.slug, row.categoryId, row.tags.map((tag) => tag.slug));

  return {
    ...toPostCard(row),
    html: rendered.html,
    toc: rendered.toc,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    projects: row.projects,
    related,
  };
}

/** Related = shared tags (weighted) + same category, newest as tie-breaker. */
async function getRelatedPosts(slug: string, categoryId: string | null, tagSlugs: string[]): Promise<PostCard[]> {
  const posts = await getPublishedPosts();
  const category = categoryId
    ? (await db.category.findUnique({ where: { id: categoryId }, select: { slug: true } }))?.slug
    : null;
  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score:
        post.tags.filter((tag) => tagSlugs.includes(tag.slug)).length * 2 + (category && post.category?.slug === category ? 1 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.post.publishedAt?.getTime() ?? 0) - (a.post.publishedAt?.getTime() ?? 0))
    .slice(0, 3)
    .map(({ post }) => post);
}
