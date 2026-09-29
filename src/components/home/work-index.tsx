"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SampleBadge, StatusBadge } from "@/components/ui/badge";
import { Cover } from "@/components/ui/media";
import type { ProjectCard } from "@/lib/types";
import { cn, indexLabel } from "@/lib/utils";

/**
 * Editorial project index. On desktop, a preview card follows the pointer
 * across rows (image scale + metadata reveal); on touch it's a clean list.
 * The preview is decorative — every row is a normal link with full text.
 */
export function WorkIndex({ projects }: { projects: ProjectCard[] }) {
  const [active, setActive] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [canPreview, setCanPreview] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const update = () => setCanPreview(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!canPreview) return;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loop = () => {
      const ease = reduced ? 1 : 0.14;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      if (preview.current) preview.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    const onMove = (event: PointerEvent) => {
      target.x = event.clientX + 28;
      target.y = event.clientY - 110;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [canPreview]);

  return (
    <div className="relative" onPointerLeave={() => setActive(null)}>
      <ol className="border-t border-line">
        {projects.map((project, i) => (
          <li key={project.id} className="border-b border-line">
            <Link
              href={`/projects/${project.slug}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              data-cursor="view"
              className={cn(
                "group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 gap-y-2 py-6 transition-colors duration-300 md:grid-cols-[4rem_1.3fr_1fr_6rem_8rem] md:py-8",
                active !== null && active !== i && "lg:text-ink-3",
              )}
            >
              <span className="font-mono text-2xs text-ink-3">{indexLabel(i + 1)}</span>
              <span className="flex items-center gap-3">
                <span className="display text-3xl transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-2 md:text-5xl">
                  {project.title}
                </span>
                {project.isSample ? (
                  <span className="hidden sm:inline">
                    <SampleBadge />
                  </span>
                ) : null}
              </span>
              <span className="col-start-2 text-sm text-ink-2 md:col-start-auto">{project.typeLabel ?? project.summary}</span>
              <span className="col-start-2 md:col-start-auto">
                <StatusBadge status={project.status} bare />
              </span>
              <span className="col-start-3 row-start-1 text-right font-mono text-2xs text-ink-3 md:col-start-auto md:row-start-auto">
                {project.year}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {canPreview ? (
        <div
          ref={preview}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-[var(--z-overlay)] w-[22rem]"
        >
          <div
            className={cn(
              "overflow-hidden rounded-lg border border-line bg-surface shadow-float transition-[opacity,scale,rotate] duration-500 ease-[var(--ease-out-expo)]",
              active === null ? "scale-90 -rotate-2 opacity-0" : "scale-100 rotate-0 opacity-100",
            )}
          >
            <div className="relative aspect-[16/10]">
              {projects.map((project, i) => (
                <div
                  key={project.id}
                  className={cn("absolute inset-0 transition-opacity duration-500", i === active ? "opacity-100" : "opacity-0")}
                >
                  <Cover
                    media={project.thumbnail}
                    seed={project.slug}
                    title={project.title}
                    accent={project.accent}
                    sizes="352px"
                    className="size-full"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 p-3">
              {active !== null
                ? projects[active].technologies.slice(0, 4).map((tech) => (
                    <span key={tech.slug} className="font-mono text-[0.625rem] text-ink-3 uppercase">
                      {tech.name}
                    </span>
                  ))
                : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
