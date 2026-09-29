import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { SampleBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { PostRef } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export type PostListItem = PostRef & {
  id?: string;
  isSample?: boolean;
  category?: { name: string; slug: string } | null;
};

/** Editorial list of articles (used on home, project pages and related posts). */
export function PostList({ posts, compact }: { posts: PostListItem[]; compact?: boolean }) {
  return (
    <ol className="border-t border-line">
      {posts.map((post, i) => (
        <Reveal as="li" key={post.id ?? post.slug} index={i} className="border-b border-line">
          <Link
            href={`/blog/${post.slug}`}
            data-cursor="read"
            className="group grid gap-x-8 gap-y-2 py-6 md:grid-cols-[9rem_1fr_auto] md:items-baseline md:py-8"
          >
            <span className="label">{formatDate(post.publishedAt)}</span>
            <span>
              <span className="flex flex-wrap items-center gap-3">
                <span
                  className={
                    compact
                      ? "font-serif text-xl tracking-tight transition-colors group-hover:text-accent-ink"
                      : "font-serif text-2xl tracking-tight transition-colors group-hover:text-accent-ink md:text-3xl"
                  }
                >
                  {post.title}
                </span>
                {post.isSample ? <SampleBadge /> : null}
              </span>
              {!compact ? <span className="mt-2 block max-w-2xl text-ink-2">{post.excerpt}</span> : null}
            </span>
            <span className="flex items-center gap-3 md:justify-end">
              {post.category ? <span className="label text-ink-2">{post.category.name}</span> : null}
              <span className="label">{post.readingMinutes} min</span>
              <Icon
                name="arrow-right"
                className="text-ink-3 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink"
              />
            </span>
          </Link>
        </Reveal>
      ))}
    </ol>
  );
}
