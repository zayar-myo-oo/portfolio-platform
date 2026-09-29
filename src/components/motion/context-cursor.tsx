"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Contextual cursor label. The native cursor is always kept (precision and
 * accessibility); this adds a small label that trails it over elements that
 * declare intent via `data-cursor`:
 *
 *   data-cursor="view" | "open" | "preview" | "read" | "launch" | "drag"
 *
 * Disabled on touch/coarse pointers and when reduced motion is requested.
 */
const LABELS: Record<string, string> = {
  view: "View",
  open: "Open ↗",
  preview: "Preview",
  read: "Read",
  launch: "Launch ↗",
  drag: "Drag",
};

export function ContextCursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduced.matches);
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const target = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let frame = 0;

    const loop = () => {
      current.x += (target.x - current.x) * 0.22;
      current.y += (target.y - current.y) * 0.22;
      if (node.current) node.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
    };
    const onOver = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      setLabel(el ? (LABELS[el.dataset.cursor ?? ""] ?? null) : null);
    };
    const onLeave = () => setLabel(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={node}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[var(--z-cursor)] will-change-transform"
    >
      <span
        className="ml-4 mt-4 inline-flex h-7 items-center rounded-full bg-ink px-3 font-mono text-[0.625rem] tracking-[0.12em] text-ink-inverse uppercase shadow-float transition-[opacity,scale] duration-300 ease-[var(--ease-out-expo)]"
        style={{ opacity: label ? 1 : 0, scale: label ? "1" : "0.6" }}
      >
        {label ?? ""}
      </span>
    </div>
  );
}
