"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { SampleBadge, StatusBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Cover } from "@/components/ui/media";
import { track } from "@/lib/analytics-client";
import { PROJECT_CATEGORY } from "@/lib/constants";
import type { ProjectCard } from "@/lib/types";
import { hostOf } from "@/lib/url";
import { cn } from "@/lib/utils";

/**
 * Portal tile: a launcher, not just a card. The whole tile opens the launch
 * page (stretched link); quick actions launch the live deployment or the
 * repository directly. Nested controls sit above the stretched link.
 */
export function PortalCard({ project, className }: { project: ProjectCard; className?: string }) {
  const host = hostOf(project.liveUrl);
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-lg border border-line bg-surface p-2.5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between px-1.5 pt-1 pb-2.5">
        <StatusBadge status={project.status} bare />
        <span className="label">
          {project.categories[0] ? PROJECT_CATEGORY[project.categories[0]] : "Project"} · {project.year}
        </span>
      </div>

      <ViewTransition name={`portal-preview-${project.slug}`} share="morph" default="none">
        <Cover
          media={project.thumbnail}
          seed={project.slug}
          title={project.title}
          accent={project.accent}
          label={project.typeLabel ?? undefined}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 100vw"
          className="aspect-[16/10] rounded-md"
          imageClassName="transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
        />
      </ViewTransition>

      <div className="flex flex-1 flex-col px-1.5 pt-4">
        <h3 className="flex items-center gap-2">
          <Link
            href={`/portal/${project.slug}`}
            data-cursor="view"
            className="display text-xl after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
          >
            {project.title}
          </Link>
          {project.isSample ? <SampleBadge /> : null}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-2">{project.summary}</p>
        {project.technologies.length ? (
          <p className="mt-3 truncate font-mono text-[0.6875rem] text-ink-3">
            {project.technologies.map((tech) => tech.name).join(" · ")}
          </p>
        ) : null}

        <div className="relative z-10 mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 mt-4">
          <span className="label truncate">
            {host ?? (project.hosting ? `${project.hosting.name} · link pending` : project.repoUrl ? "Source only" : "No public deployment")}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("github_click", { entityType: "project", entityId: project.slug })}
                className="inline-flex size-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink"
                aria-label={`${project.title} repository (opens in a new tab)`}
                data-cursor="open"
              >
                <Icon name="github" size={15} />
              </a>
            ) : null}
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("project_live_launch", { entityType: "project", entityId: project.slug })}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-medium text-ink-inverse transition-colors hover:bg-accent hover:text-on-accent"
                aria-label={`Launch ${project.title} (opens in a new tab)`}
                data-cursor="launch"
              >
                Launch <Icon name="arrow-up-right" size={13} />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
