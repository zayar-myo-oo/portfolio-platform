import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { PortalExplorer } from "@/components/portal/portal-explorer";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { RelativeTime } from "@/components/ui/relative-time";
import { getPortalProjects } from "@/server/data/projects";
import type { ProjectStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Project Portal",
  description: "A launcher for everything built here — search, filter and open live deployments, repositories and case studies.",
  alternates: { canonical: "/portal" },
};

const SUMMARY: ProjectStatus[] = ["LIVE", "BETA", "DEVELOPMENT", "EXPERIMENTAL", "ARCHIVED"];

export default async function PortalPage() {
  const projects = await getPortalProjects();
  const lastUpdated = projects.reduce<Date | null>(
    (latest, project) => (!latest || project.updatedAt > latest ? project.updatedAt : latest),
    null,
  );

  return (
    <PageTransition>
      <div className="hairline-grid border-b border-line">
        <div className="container-page pt-16 pb-12 md:pt-24">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="label">02 — Project portal</p>
            {lastUpdated ? (
              <p className="label">
                Directory updated <RelativeTime date={lastUpdated} className="text-ink-2" />
              </p>
            ) : null}
          </div>
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <h1 className="display text-display-m animate-rise lg:col-span-8">
              Launch
              <br />
              <span className="text-ink-3">anything.</span>
            </h1>
            <div className="lg:col-span-4">
              <p className="text-lg text-ink-2">
                Every project in one place — open the real deployment, browse the source, or read how it was built.
              </p>
              <ul className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4 sm:grid-cols-5 lg:grid-cols-3">
                {SUMMARY.map((status) => {
                  const count = projects.filter((project) => project.status === status).length;
                  return (
                    <li key={status} className={count ? undefined : "opacity-40"}>
                      <p className="display text-2xl tabular-nums">{count}</p>
                      <StatusBadge status={status} bare className="mt-1" />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page">
        {projects.length === 0 ? (
          <EmptyState eyebrow="Empty directory" title="No projects in the portal yet." className="mt-12">
            Projects marked “show in portal” in the admin dashboard appear here.
          </EmptyState>
        ) : (
          <Suspense fallback={<PortalSkeleton />}>
            <PortalExplorer projects={projects} />
          </Suspense>
        )}
      </div>
    </PageTransition>
  );
}

function PortalSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton aspect-[4/5]" />
      ))}
    </div>
  );
}
