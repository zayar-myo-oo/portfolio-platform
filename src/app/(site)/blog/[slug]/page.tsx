import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CodeCopyEnhancer,
  ReadingProgress,
  ShareActions,
  TableOfContents,
} from "@/components/blog/article-enhancer";
import { PostList } from "@/components/blog/post-list";
import { PageTransition } from "@/components/motion/page-transition";
import { articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { TrackView } from "@/components/site/track";
import { SampleBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media";
import { getPostBySlug, getPublishedPostSlugs } from "@/server/data/posts";
import { getSiteSettings } from "@/server/data/settings";
import { absoluteUrl } from "@/lib/site";
import { formatDate, toIsoDate } from "@/lib/utils";

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Note not found", robots: { index: false } };
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl ?? `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: toIsoDate(post.publishedAt),
      modifiedTime: toIsoDate(post.updatedAt),
      section: post.category?.name,
      tags: post.tags.map((tag) => tag.name),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <Article params={params} />
    </Suspense>
  );
}

async function Article({ params }: Pick<PageProps<"/blog/[slug]">, "params">) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);
  if (!post) notFound();

  const url = absoluteUrl(`/blog/${post.slug}`);
  const updated = post.publishedAt && post.updatedAt.getTime() - post.publishedAt.getTime() > 86_400_000;

  return (
    <PageTransition>
      <JsonLd
        data={[
          articleJsonLd(post, settings),
          breadcrumbJsonLd([
            { name: "Notes", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <TrackView type="blog_view" entityType="post" entityId={post.slug} />
      <ReadingProgress targetId="article-body" />
      <CodeCopyEnhancer rootId="article-body" />

      <article>
        <header className="container-page pt-12 md:pt-20">
          <nav aria-label="Breadcrumb" className="label mb-10 flex items-center gap-2">
            <Link href="/blog" className="inline-flex items-center gap-1.5 hover:text-ink">
              <Icon name="arrow-left" size={12} /> Notes
            </Link>
            {post.category ? (
              <>
                <Icon name="chevron-right" size={12} />
                <Link href={`/blog?category=${post.category.slug}`} className="hover:text-ink">
                  {post.category.name}
                </Link>
              </>
            ) : null}
          </nav>

          <div className="mx-auto max-w-4xl">
            {post.isSample ? <SampleBadge className="mb-5" /> : null}
            <h1 className="font-serif text-[clamp(2.25rem,1.5rem+3.4vw,4.5rem)] leading-[1.04] tracking-[-0.025em] text-balance animate-rise">
              {post.title}
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-2 animate-rise [animation-delay:100ms]">{post.excerpt}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-4">
              <p className="label">
                By <span className="text-ink">{settings.ownerName}</span>
              </p>
              <p className="label">
                <time dateTime={toIsoDate(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
              </p>
              {updated ? (
                <p className="label">
                  Updated <time dateTime={toIsoDate(post.updatedAt)}>{formatDate(post.updatedAt)}</time>
                </p>
              ) : null}
              <p className="label">{post.readingMinutes} min read</p>
            </div>
          </div>
        </header>

        {post.cover ? (
          <div className="container-page mt-12">
            <div className="relative mx-auto aspect-[21/9] max-w-6xl overflow-hidden rounded-lg border border-line">
              <MediaImage media={post.cover} sizes="(min-width: 1200px) 1150px, 100vw" priority />
            </div>
          </div>
        ) : null}

        <div className="container-page mt-14 grid gap-12 xl:grid-cols-[1fr_minmax(0,var(--reading-max))_1fr]">
          <div className="hidden xl:block">
            {post.toc.length > 1 ? (
              <div className="sticky top-24 ml-auto max-w-56">
                <TableOfContents items={post.toc} />
              </div>
            ) : null}
          </div>

          <div id="article-body" className="prose mx-auto w-full max-w-[var(--reading-max)]" dangerouslySetInnerHTML={{ __html: post.html }} />

          <aside className="hidden xl:block" aria-label="Article details">
            <div className="sticky top-24 space-y-8">
              {post.tags.length ? (
                <div>
                  <p className="label mb-3">Tags</p>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1">
                    {post.tags.map((tag) => (
                      <li key={tag.slug}>
                        <Link href={`/blog?tag=${tag.slug}`} className="font-mono text-xs text-ink-3 hover:text-ink">
                          #{tag.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {post.projects.length ? (
                <div>
                  <p className="label mb-3">Related projects</p>
                  <ul className="space-y-2">
                    {post.projects.map((project) => (
                      <li key={project.slug}>
                        <Link href={`/projects/${project.slug}`} className="text-sm text-ink-2 hover:text-ink">
                          {project.title} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <footer className="container-page mt-16">
          <div className="mx-auto flex max-w-[var(--reading-max)] flex-col gap-6 border-t border-line pt-8">
            <ShareActions title={post.title} url={url} slug={post.slug} />
            {post.projects.length ? (
              <p className="text-sm text-ink-2 xl:hidden">
                Related:{" "}
                {post.projects.map((project, i) => (
                  <span key={project.slug}>
                    {i ? ", " : ""}
                    <Link href={`/projects/${project.slug}`} className="link-underline text-ink">
                      {project.title}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </footer>
      </article>

      {post.related.length ? (
        <section aria-labelledby="related-heading" className="container-page mt-[var(--section-space)]">
          <h2 id="related-heading" className="label mb-6">
            Keep reading
          </h2>
          <PostList posts={post.related} />
        </section>
      ) : null}
    </PageTransition>
  );
}

function ArticleSkeleton() {
  return (
    <div className="container-page pt-20" aria-busy="true" aria-label="Loading article">
      <div className="mx-auto max-w-4xl">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton mt-10 h-20 w-full" />
        <div className="skeleton mt-6 h-6 w-2/3" />
        <div className="mt-16 space-y-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-4" style={{ width: `${70 + ((i * 13) % 30)}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
