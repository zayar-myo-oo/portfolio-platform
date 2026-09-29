"use client";

import Link from "next/link";
import { useState } from "react";
import { SampleBadge, StatusBadge, TechTag } from "@/components/ui/badge";
import { Cover } from "@/components/ui/media";
import type { ProjectCard } from "@/lib/types";
import { cn, indexLabel } from "@/lib/utils";

/**
 * Featured work switcher: hovering or focusing an entry in the list swaps
 * the large preview (crossfade + subtle scale). Keyboard and touch users
 * get the same behaviour through focus and taps on the list.
 */
export function FeaturedPreview({ projects }: { projects: ProjectCard[] }) {
  const [active, setActive] = useState(0);
  const project = projects[active] ?? projects[0];

  return (
    <div className="flex h-full flex-col gap-5 lg:flex-row">
      <Link
        href={`/projects/${project.slug}`}
        className="group/cover relative block aspect-[16/10] overflow-hidden rounded-md border border-line lg:aspect-auto lg:min-h-[22rem] lg:flex-[1.6]"
        data-cursor="view"
      >
        {projects.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-[opacity,scale] duration-700 ease-[var(--ease-out-expo)]",
              i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
            )}
            aria-hidden={i !== active}
          >
            <Cover
              media={item.thumbnail}
              seed={item.slug}
              title={item.title}
              accent={item.accent}
              label={item.typeLabel ?? undefined}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="size-full"
              imageClassName="transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover/cover:scale-[1.03]"
            />
          </div>
        ))}
        <span className="sr-only">Open case study: {project.title}</span>
      </Link>

      <div className="flex flex-col justify-between gap-6 lg:flex-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} bare />
            {project.isSample ? <SampleBadge /> : null}
          </div>
          <p className="display mt-3 text-3xl">{project.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{project.tagline ?? project.summary}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <TechTag key={tech.slug}>{tech.name}</TechTag>
            ))}
          </div>
        </div>

        {projects.length > 1 ? (
          <ol className="border-t border-line" aria-label="Featured projects">
            {projects.map((item, i) => (
              <li key={item.id} className="border-b border-line">
                <Link
                  href={`/projects/${item.slug}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={cn(
                    "flex items-baseline justify-between gap-3 py-2.5 text-sm transition-colors",
                    i === active ? "text-ink" : "text-ink-3 hover:text-ink-2",
                  )}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-2xs">{indexLabel(i + 1)}</span>
                    {item.title}
                  </span>
                  <span className="font-mono text-2xs">{item.year}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
