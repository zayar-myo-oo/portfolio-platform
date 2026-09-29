import { getPostBySlug, getPublishedPostSlugs } from "@/server/data/posts";
import { getSiteSettings } from "@/server/data/settings";
import { OG_SIZE, renderOgImage } from "@/server/og";

export const alt = "Engineering note";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__none__" }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);
  return renderOgImage({
    eyebrow: post ? `Notes · ${post.category?.name ?? "Engineering"} · ${post.readingMinutes} min` : "Notes",
    title: post?.title ?? "Note not found",
    subtitle: post?.excerpt,
    footer: settings.ownerName,
  });
}
