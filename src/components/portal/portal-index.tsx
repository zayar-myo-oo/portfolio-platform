"use client";

import Link from "next/link";
import { SampleBadge, StatusBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { track } from "@/lib/analytics-client";
import type { ProjectCard } from "@/lib/types";
import { hostOf } from "@/lib/url";

/** Dense directory view — the "digital archive" reading of the portal. */
export function PortalIndex({ projects }: { projects: ProjectCard[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Projects</caption>
        <thead>
          <tr className="border-b border-line">
            {["Project", "Status", "Stack", "Year", "Host", ""].map((heading, i) => (
              <th key={i} scope="col" className="label px-4 py-3 font-normal">
                {heading || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="group border-b border-line last:border-0 hover:bg-ink/[0.025]">
              <th scope="row" className="px-4 py-3.5 font-normal">
                <Link href={`/portal/${project.slug}`} className="flex items-center gap-2 font-medium text-ink hover:text-accent-ink" data-cursor="view">
                  {project.title}
                  {project.isSample ? <SampleBadge /> : null}
                </Link>
                <span className="block text-xs text-ink-3">{project.typeLabel}</span>
              </th>
              <td className="px-4 py-3.5">
                <StatusBadge status={project.status} bare />
              </td>
              <td className="max-w-[16rem] truncate px-4 py-3.5 font-mono text-xs text-ink-2">
                {project.technologies.slice(0, 3).map((tech) => tech.name).join(" · ")}
              </td>
              <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-ink-2">{project.year}</td>
              <td className="px-4 py-3.5 font-mono text-xs text-ink-3">{hostOf(project.liveUrl) ?? "—"}</td>
              <td className="px-4 py-3.5">
                <div className="flex justify-end gap-1">
                  {project.repoUrl ? (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("github_click", { entityType: "project", entityId: project.slug })}
                      className="inline-flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
                      aria-label={`${project.title} repository (opens in a new tab)`}
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
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-line px-3 text-xs hover:border-ink"
                      aria-label={`Launch ${project.title} (opens in a new tab)`}
                    >
                      Launch <Icon name="arrow-up-right" size={12} />
                    </a>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
