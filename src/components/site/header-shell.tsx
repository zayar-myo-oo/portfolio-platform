"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky header that tucks away while reading (scrolling down) and returns
 * on scroll up. It never hides while it contains keyboard focus.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Expose visibility so other sticky UI can sit flush under (or in place of) the header.
  useEffect(() => {
    document.documentElement.dataset.header = hidden ? "hidden" : "shown";
  }, [hidden]);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        setScrolled(y > 8);
        if (ref.current?.contains(document.activeElement)) setHidden(false);
        else if (y < 120) setHidden(false);
        else if (delta > 6) setHidden(true);
        else if (delta < -6) setHidden(false);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      ref={ref}
      onFocusCapture={() => setHidden(false)}
      style={{ viewTransitionName: "site-header" }}
      className={cn(
        "fixed inset-x-0 top-0 z-[var(--z-sticky)] transition-[transform,background-color,border-color] duration-500 ease-[var(--ease-out-expo)]",
        "border-b",
        scrolled ? "border-line bg-paper/75 backdrop-blur-xl backdrop-saturate-150" : "border-transparent",
        hidden && "-translate-y-full",
      )}
    >
      {children}
    </header>
  );
}
