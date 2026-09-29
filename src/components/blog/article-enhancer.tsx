"use client";

import { useEffect, useState } from "react";
import { useBrowserValue } from "@/hooks/use-media-query";
import { track } from "@/lib/analytics-client";
import { cn } from "@/lib/utils";

/** Reading progress along the top edge (scaleX, compositor-only). */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      setProgress(Math.min(1, Math.max(0, -rect.top / Math.max(1, total))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[calc(var(--z-sticky)+1)] h-0.5 origin-left bg-accent"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}

/** Table of contents with the current section highlighted. */
export function TableOfContents({ items }: { items: Array<{ id: string; text: string; depth: 2 | 3 }> }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const headings = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;
  return (
    <nav aria-label="Table of contents">
      <p className="label mb-4">On this page</p>
      <ol className="space-y-2 border-l border-line">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-0.5 text-sm leading-snug transition-colors",
                item.depth === 3 ? "pl-7" : "pl-4",
                active === item.id ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink-2",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Copy buttons for server-rendered code blocks (event delegation, no per-block JS). */
export function CodeCopyEnhancer({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const onClick = async (event: MouseEvent) => {
      const button = (event.target as Element).closest<HTMLButtonElement>("[data-copy]");
      if (!button) return;
      const code = button.closest("figure")?.querySelector("pre")?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
        button.dataset.copied = "";
      } catch {
        button.textContent = "Press ⌘C";
      }
      window.setTimeout(() => {
        button.textContent = "Copy";
        delete button.dataset.copied;
      }, 1600);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [rootId]);
  return null;
}

/** Share: native share sheet when available, otherwise copy link + intents. */
export function ShareActions({ title, url, slug }: { title: string; url: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = useBrowserValue(() => typeof navigator.share === "function", false);

  const record = () => track("blog_share", { entityType: "post", entityId: slug });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      record();
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; the URL is visible in the address bar */
    }
  };

  const linkClass = "label inline-flex h-8 items-center rounded-full border border-line px-3 hover:border-ink hover:text-ink";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label mr-1">Share</span>
      {canShare ? (
        <button
          type="button"
          className={linkClass}
          onClick={() => {
            record();
            void navigator.share({ title, url }).catch(() => {});
          }}
        >
          Share…
        </button>
      ) : null}
      <button type="button" onClick={copy} className={linkClass} aria-live="polite">
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a
        className={linkClass}
        href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={record}
      >
        X
      </a>
      <a
        className={linkClass}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={record}
      >
        LinkedIn
      </a>
    </div>
  );
}
