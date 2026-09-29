import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BlogExplorer } from "@/components/blog/blog-explorer";
import { PostList } from "@/components/blog/post-list";
import { PageTransition } from "@/components/motion/page-transition";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getBlogTaxonomy, getPublishedPosts } from "@/server/data/posts";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Notes",
  description: "Technical writing on architecture, backend, frontend, security, performance and the craft of software engineering.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/feed.xml" } },
};

export default async function BlogPage() {
  const [posts, taxonomy] = await Promise.all([getPublishedPosts(), getBlogTaxonomy()]);
  const featured = posts.find((post) => post.featured) ?? posts[0];

  return (
    <PageTransition>
      <header className="container-page pt-16 pb-14 md:pt-24">
        <div className="flex items-center justify-between">
          <p className="label">03 — Engineering notes</p>
          <Link href="/blog/feed.xml" className="label hover:text-ink">
            RSS feed
          </Link>
        </div>
        <h1 className="display mt-8 text-display-m animate-rise">
          Notes on
          <br />
          <span className="font-serif font-normal tracking-tight text-ink-3 italic">building software.</span>
        </h1>
      </header>

      {posts.length === 0 ? (
        <div className="container-page">
          <EmptyState eyebrow="No notes yet" title="Writing will appear here.">
            Publish a post from the admin dashboard and it renders here automatically.
          </EmptyState>
        </div>
      ) : (
        <>
          {featured ? (
            <section aria-label="Featured note" className="container-page mb-20">
              <Link
                href={`/blog/${featured.slug}`}
                data-cursor="read"
                className="group grid gap-8 rounded-xl border border-line bg-surface p-6 transition-colors hover:border-line-strong sm:p-10 lg:grid-cols-12"
              >
                <div className="lg:col-span-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="label text-accent-ink">Featured</span>
                    {featured.category ? <span className="label">{featured.category.name}</span> : null}
                    {featured.isSample ? <SampleBadge /> : null}
                  </div>
                  <h2 className="mt-5 font-serif text-4xl leading-[1.08] tracking-tight text-balance transition-colors group-hover:text-accent-ink md:text-5xl">
                    {featured.title}
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">{featured.excerpt}</p>
                </div>
                <div className="flex flex-col justify-end gap-2 lg:col-span-4 lg:items-end">
                  <p className="label">{formatDate(featured.publishedAt)}</p>
                  <p className="label">{featured.readingMinutes} min read</p>
                </div>
              </Link>
            </section>
          ) : null}

          <section aria-label="All notes" className="container-page">
            <Suspense fallback={<PostList posts={posts} />}>
              <BlogExplorer posts={posts} categories={taxonomy.categories} tags={taxonomy.tags} />
            </Suspense>
          </section>
        </>
      )}
    </PageTransition>
  );
}
