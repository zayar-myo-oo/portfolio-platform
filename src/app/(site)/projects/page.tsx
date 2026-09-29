import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { getPublishedProjects } from "@/server/data/projects";
import { cn, pluralize } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Work",
  description: "Projects and engineering case studies — problems, architecture, decisions and results.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  const live = projects.filter((project) => project.status === "LIVE").length;
  const years = projects.length ? `${Math.min(...projects.map((p) => p.year))}–${Math.max(...projects.map((p) => p.year))}` : "";

  return (
    <PageTransition>
      <div className="container-page pt-16 pb-12 md:pt-24">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="label mb-6">01 — Work</p>
            <h1 className="display text-display-m animate-rise">
              Projects &amp;
              <br />
              <span className="text-ink-3">case studies.</span>
            </h1>
          </div>
          <div className="flex flex-col justify-end gap-6 lg:col-span-4">
            <dl className="grid grid-cols-3 gap-4 border-y border-line py-4">
              <div>
                <dt className="label">Projects</dt>
                <dd className="display mt-1 text-3xl tabular-nums">{projects.length}</dd>
              </div>
              <div>
                <dt className="label">Live</dt>
                <dd className="display mt-1 text-3xl tabular-nums text-live">{live}</dd>
              </div>
              <div>
                <dt className="label">Span</dt>
                <dd className="mt-2 font-mono text-sm tabular-nums">{years || "—"}</dd>
              </div>
            </dl>
            <p className="text-ink-2">
              Each project is written up as an engineering case study. To search, filter or launch deployments, use the{" "}
              <Link href="/portal" className="link-underline text-ink">
                project portal
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="container-page">
        {projects.length === 0 ? (
          <EmptyState
            eyebrow="Nothing published yet"
            title="Projects will appear here."
            actions={<ButtonLink href="/admin/projects/new" variant="secondary">Add a project</ButtonLink>}
          >
            Published projects from the admin dashboard render automatically.
          </EmptyState>
        ) : (
          <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-12">
            {projects.map((project, i) => {
              // Editorial rhythm: first featured project spans wide, then alternate 7/5 and 5/7.
              const large = i === 0 && project.featured;
              const span = large ? "lg:col-span-12" : [0, 3].includes((i - (projects[0]?.featured ? 1 : 0)) % 4) ? "lg:col-span-7" : "lg:col-span-5";
              return (
                <Reveal as="li" key={project.id} index={i % 3} className={cn(large ? "md:col-span-2" : "", span)}>
                  <ProjectCard project={project} size={large ? "large" : "default"} priority={i < 2} />
                </Reveal>
              );
            })}
          </ul>
        )}
        {projects.length ? (
          <p className="label mt-16 text-center">{pluralize(projects.length, "project")} · updated from the CMS</p>
        ) : null}
      </div>
    </PageTransition>
  );
}
