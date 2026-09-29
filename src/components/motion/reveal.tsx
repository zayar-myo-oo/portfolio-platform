"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Scroll reveal. Content is visible by default (no-JS, crawlers, reduced
 * motion). On mount, only elements that start *below* the fold are opted
 * into the hidden state, then revealed as they enter — so nothing already
 * on screen ever flickers.
 */
export function Reveal({
  as: Tag = "div",
  index = 0,
  id,
  className,
  children,
  style,
}: {
  as?: "div" | "li" | "section" | "article";
  index?: number;
  id?: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // All allowed tags share HTMLElement behaviour; typing them as "div" keeps props checkable.
  const Component = Tag as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return;

    el.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "shown";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Component ref={ref} id={id} className={className} style={{ ...style, "--reveal-index": index } as CSSProperties}>
      {children}
    </Component>
  );
}
