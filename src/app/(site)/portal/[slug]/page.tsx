import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { LaunchConsole } from "@/components/portal/launch-console";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { TrackView } from "@/components/site/track";
import { SampleBadge, StatusBadge, TechTag } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Datasheet } from "@/components/ui/section";
import { getPortalProjects, getProjectBySlug } from "@/server/data/projects";
import { PROJECT_CATEGORY, PROJECT_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  const projects = await getPortalProjects();
  return projects.length ? projects.map((project) => ({ slug: project.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/portal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Not found", robots: { index: false } };
  return {
    title: `Launch ${project.title}`,
    description: project.summary,
    alternates: { canonical: `/portal/${project.slug}` },
  };
}

export default function PortalProjectPage({ params }: PageProps<"/portal/[slug]">) {
  return (
    <Suspense fallback={<LaunchSkeleton />}>
      <PortalProject params={params} />
    </Suspense>
  );
}

async function PortalProject({ params }: Pick<PageProps<"/portal/[slug]">, "params">) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || !project.showInPortal) notFound();

  const hasCaseStudy = Boolean(project.descriptionHtml || Object.values(project.sections).some(Boolean) || project.diagram);

  return (
    <PageTransition>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Portal", path: "/portal" },
          { name: project.title, path: `/portal/${project.slug}` },
        ])}
      />
      <TrackView type="project_view" entityType="project" entityId={project.slug} />

      <div className="container-page pt-10 md:pt-14">
        <nav aria-label="Breadcrumb" className="label mb-8 flex items-center gap-2">
          <Link href="/portal" className="inline-flex items-center gap-1.5 hover:text-ink">
            <Icon name="arrow-left" size={12} /> Portal
          </Link>
          <Icon name="chevron-right" size={12} />
          <span className="text-ink-2" aria-current="page">
            {project.title}
          </span>
        </nav>

        <header className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              {project.isSample ? <SampleBadge /> : null}
            </div>
            <h1 className="display text-display-s animate-rise">{project.title}</h1>
          </div>
          <p className="text-lg leading-relaxed text-ink-2 lg:col-span-5">{project.tagline ?? project.summary}</p>
        </header>

        <LaunchConsole
          project={{
            slug: project.slug,
            title: project.title,
            accent: project.accent,
            typeLabel: project.typeLabel,
            liveUrl: project.liveUrl,
            repoUrl: project.repoUrl,
            demoUrl: project.demoUrl,
            hostingName: project.hosting?.name ?? null,
            thumbnail: project.thumbnail,
            hasCaseStudy,
          }}
        />

        <div className="mt-16 grid gap-10 border-t border-line pt-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label mb-4">About this project</p>
            <p className="max-w-2xl font-serif text-xl leading-relaxed text-ink-2">{project.summary}</p>
            {project.technologies.length ? (
              <div className="mt-8">
                <p className="label mb-3">Technology</p>
                <ul className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <li key={tech.slug}>
                      <TechTag className="h-7 px-2.5 text-xs">{tech.name}</TechTag>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-5">
            <Datasheet
              rows={[
                { label: "Status", value: PROJECT_STATUS[project.status].description },
                { label: "Type", value: project.typeLabel ?? project.categories.map((c) => PROJECT_CATEGORY[c]).join(", ") },
                { label: "Year", value: project.year },
                project.hosting ? { label: "Hosting", value: project.hosting.name } : null,
                { label: "Updated", value: formatDate(project.updatedAt) },
              ]}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function LaunchSkeleton() {
  return (
    <div className="container-page pt-14" aria-busy="true" aria-label="Loading project">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-8 h-16 w-1/2" />
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="skeleton aspect-[16/10] lg:col-span-7" />
        <div className="skeleton h-72 lg:col-span-5" />
      </div>
    </div>
  );
}
