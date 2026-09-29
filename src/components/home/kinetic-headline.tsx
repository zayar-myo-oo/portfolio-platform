"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Display headline with two layers of motion:
 * 1. line-mask reveal on load (CSS, see .mask-line)
 * 2. pointer proximity mapped to the variable font's weight/width axes —
 *    letters near the pointer grow heavier and narrower, like a lens.
 *
 * Screen readers get the plain text; the per-letter layer is aria-hidden.
 * (2) only runs for fine pointers without reduced-motion.
 */
export function KineticHeadline({ lines, className }: { lines: string[]; className?: string }) {
  const root = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const letters = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-letter]"));
    let centers: Array<{ x: number; y: number }> = [];
    const measure = () => {
      centers = letters.map((letter) => {
        const rect = letter.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
    };
    measure();

    const pointer = { x: -9999, y: -9999 };
    let frame = 0;
    let active = false;

    const render = () => {
      const radius = Math.max(160, window.innerWidth * 0.14);
      for (let i = 0; i < letters.length; i++) {
        const c = centers[i];
        const d = Math.hypot(pointer.x - c.x, pointer.y - c.y);
        const t = Math.max(0, 1 - d / radius);
        const eased = t * t * (3 - 2 * t);
        letters[i].style.fontVariationSettings = `"wght" ${Math.round(540 + eased * 260)}, "wdth" ${Math.round(100 - eased * 22)}, "opsz" 96`;
      }
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!active) {
        active = true;
        measure();
      }
      schedule();
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      active = false;
      schedule();
    };
    const onScrollOrResize = () => {
      if (active) {
        measure();
        schedule();
      }
    };

    el.parentElement?.addEventListener("pointermove", onMove, { passive: true });
    el.parentElement?.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      el.parentElement?.removeEventListener("pointermove", onMove);
      el.parentElement?.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <h1 ref={root} className={className}>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="mask-line" style={{ "--line-index": lineIndex } as CSSProperties}>
            <span className={lineIndex === lines.length - 1 ? "text-ink-3" : undefined}>
              {line.split(" ").map((word, wordIndex) => (
                // Words are unbreakable groups; the spaces between them are the only wrap points.
                <span key={wordIndex}>
                  {wordIndex > 0 ? " " : null}
                  <span className="inline-block whitespace-nowrap">
                    {Array.from(word).map((char, i) => (
                      <span key={i} data-letter className="inline-block transition-[font-variation-settings] duration-300 ease-out">
                        {char}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </h1>
  );
}
