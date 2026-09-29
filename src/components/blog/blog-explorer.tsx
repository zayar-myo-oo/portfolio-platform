"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { PostCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PostList } from "./post-list";

/**
 * Client-side search and category/tag filtering over the (small, cached)
 * list of published posts. Filters are mirrored into the URL.
 */
export function BlogExplorer({
  posts,
  categories,
  tags,
}: {
  posts: PostCard[];
  categories: Array<{ name: string; slug: string; count: number }>;
  tags: Array<{ name: string; slug: string; count: number }>;
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => (searchParams.get("q") ?? "").slice(0, 80));
  const [category, setCategory] = useState<string | null>(() => searchParams.get("category"));
  const [tag, setTag] = useState<string | null>(() => searchParams.get("tag"));

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [query, category, tag]);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter((post) => {
      if (category && post.category?.slug !== category) return false;
      if (tag && !post.tags.some((t) => t.slug === tag)) return false;
      if (!terms.length) return true;
      const text = `${post.title} ${post.excerpt} ${post.category?.name ?? ""} ${post.tags.map((t) => t.name).join(" ")}`.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
  }, [posts, query, category, tag]);

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
      active ? "border-ink bg-ink text-ink-inverse" : "border-line text-ink-2 hover:border-line-strong hover:text-ink",
    );

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
      <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
        <label className="relative flex h-10 items-center">
          <span className="sr-only">Search notes</span>
          <Icon name="search" className="pointer-events-none absolute left-3 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, 80))}
            placeholder="Search notes…"
            className="h-full w-full rounded-md border border-line bg-surface pr-3 pl-9 text-sm placeholder:text-ink-3 focus:border-ink focus:outline-none"
          />
        </label>
        <div>
          <p className="label mb-3">Categories</p>
          <div className="scrollbar-none -mx-[var(--gutter)] flex gap-1.5 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:flex-col lg:items-start lg:px-0">
            <button type="button" className={chip(category === null)} onClick={() => setCategory(null)} aria-pressed={category === null}>
              All <span className="font-mono text-[0.625rem] opacity-60">{posts.length}</span>
            </button>
            {categories.map((item) => (
              <button
                key={item.slug}
                type="button"
                className={chip(category === item.slug)}
                aria-pressed={category === item.slug}
                onClick={() => setCategory(category === item.slug ? null : item.slug)}
              >
                {item.name} <span className="font-mono text-[0.625rem] opacity-60">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
        {tags.length ? (
          <div className="hidden lg:block">
            <p className="label mb-3">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={tag === item.slug}
                  onClick={() => setTag(tag === item.slug ? null : item.slug)}
                  className={cn(
                    "font-mono text-xs transition-colors",
                    tag === item.slug ? "text-accent-ink" : "text-ink-3 hover:text-ink",
                  )}
                >
                  #{item.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </aside>

      <div>
        <p className="label mb-5" aria-live="polite">
          {results.length} {results.length === 1 ? "note" : "notes"}
          {tag ? ` tagged #${tag}` : ""}
          {query ? ` matching “${query}”` : ""}
        </p>
        {results.length ? (
          <PostList posts={results} />
        ) : (
          <div className="rounded-lg border border-dashed border-line-strong p-10">
            <p className="display text-2xl">No notes match.</p>
            <button
              type="button"
              className="mt-4 text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
              onClick={() => {
                setQuery("");
                setCategory(null);
                setTag(null);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
