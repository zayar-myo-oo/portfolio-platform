"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Cover } from "@/components/ui/media";
import type { ProjectCard } from "@/lib/types";

/**
 * Spatial view: projects on a curved shelf in 3D space. It is a native
 * horizontal scroll-snap container (touch, trackpad, keyboard and screen
 * readers all work) whose items are bent into an arc from scroll position.
 * Reduced motion → a flat, still shelf.
 */
export function PortalSpatial({ projects }: { projects: ProjectCard[] }) {
  const track = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = Array.from(el.children) as HTMLElement[];
    let frame = 0;

    const render = () => {
      frame = 0;
      const center = el.scrollLeft + el.clientWidth / 2;
      for (const item of items) {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const offset = (itemCenter - center) / item.offsetWidth; // -n … +n
        const clamped = Math.max(-2.5, Math.min(2.5, offset));
        const inner = item.firstElementChild as HTMLElement | null;
        if (!inner) continue;
        inner.style.transform = `rotateY(${clamped * -18}deg) translateZ(${-Math.abs(clamped) * 90}px)`;
        inner.style.opacity = String(1 - Math.min(0.55, Math.abs(clamped) * 0.22));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    render();
    el.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      el.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [projects]);

  return (
    <div className="relative -mx-[var(--gutter)]">
      <ul
        ref={track}
        className="scrollbar-none flex snap-x snap-mandatory gap-6 overflow-x-auto px-[calc(50%-10rem)] py-10 [perspective:1400px] sm:px-[calc(50%-12rem)]"
        aria-label="Projects, spatial view. Scroll horizontally."
        tabIndex={0}
      >
        {projects.map((project) => (
          <li key={project.id} className="w-80 shrink-0 snap-center sm:w-96">
            <div className="transition-[opacity] duration-200 will-change-transform [transform-style:preserve-3d]">
              <Link
                href={`/portal/${project.slug}`}
                data-cursor="view"
                className="block overflow-hidden rounded-xl border border-line bg-surface shadow-float"
              >
                <Cover
                  media={project.thumbnail}
                  seed={project.slug}
                  title={project.title}
                  accent={project.accent}
                  sizes="384px"
                  className="aspect-[4/3]"
                />
                <div className="flex items-center justify-between gap-3 p-4">
                  <span className="display text-xl">{project.title}</span>
                  <StatusBadge status={project.status} bare />
                </div>
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <p className="label text-center">Scroll, swipe or use arrow keys →</p>
    </div>
  );
}
