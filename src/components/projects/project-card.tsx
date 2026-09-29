import Link from "next/link";
import { ViewTransition } from "react";
import { SampleBadge, StatusBadge, TechTag } from "@/components/ui/badge";
import { Cover } from "@/components/ui/media";
import type { ProjectCard as ProjectCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Project card. Hover choreography (CSS only): the cover scales slowly, the
 * title shifts, and the technology row slides up into view. The cover is a
 * shared view-transition element that morphs into the case-study hero.
 */
export function ProjectCard({
  project,
  size = "default",
  priority,
}: {
  project: ProjectCardData;
  size?: "default" | "large";
  priority?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      data-cursor="view"
      className="group flex h-full flex-col gap-4 rounded-lg focus-visible:outline-offset-8"
    >
      <ViewTransition name={`project-cover-${project.slug}`} share="morph" default="none">
        <Cover
          media={project.thumbnail}
          seed={project.slug}
          title={project.title}
          accent={project.accent}
          label={project.typeLabel ?? undefined}
          priority={priority}
          sizes={size === "large" ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"}
          className={cn("rounded-lg border border-line", size === "large" ? "aspect-[16/10]" : "aspect-[4/3]")}
          imageClassName="transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.035]"
        />
      </ViewTransition>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} bare />
            {project.isSample ? <SampleBadge /> : null}
          </div>
          <span className="font-mono text-2xs text-ink-3">{project.year}</span>
        </div>
        <h3
          className={cn(
            "display mt-3 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1",
            size === "large" ? "text-4xl" : "text-2xl",
          )}
        >
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-2">{project.summary}</p>
        <div className="relative mt-auto h-6 overflow-hidden pt-4 [box-sizing:content-box]">
          <div className="flex flex-wrap gap-1.5 transition-transform duration-500 ease-[var(--ease-out-expo)] md:translate-y-2 md:opacity-70 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            {project.technologies.slice(0, 4).map((tech) => (
              <TechTag key={tech.slug}>{tech.name}</TechTag>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
