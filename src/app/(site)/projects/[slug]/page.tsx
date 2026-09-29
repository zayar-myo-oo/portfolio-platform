import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { PostList } from "@/components/blog/post-list";
import { PageTransition } from "@/components/motion/page-transition";
import { ArchitectureDiagram } from "@/components/projects/architecture-diagram";
import {
  CASE_STUDY_SECTIONS,
  CaseSection,
  caseStudyOutline,
  FeatureGrid,
  Gallery,
  Prose,
  TechStack,
} from "@/components/projects/case-study";
import { breadcrumbJsonLd, JsonLd, projectJsonLd } from "@/components/seo/json-ld";
import { TrackView } from "@/components/site/track";
import { SampleBadge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Cover } from "@/components/ui/media";
import { Datasheet } from "@/components/ui/section";
import { getProjectBySlug, getPublishedProjectSlugs } from "@/server/data/projects";
import { getSiteSettings } from "@/server/data/settings";
import { PROJECT_CATEGORY } from "@/lib/constants";
import { displayUrl } from "@/lib/url";

export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs();
  // Cache Components requires at least one param to validate the route at build time.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };
  const title = project.seoTitle ?? project.title;
  const description = project.seoDescription ?? project.summary;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { type: "article", title, description, url: `/projects/${project.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<CaseStudySkeleton />}>
      <ProjectContent params={params} />
    </Suspense>
  );
}

async function ProjectContent({ params }: Pick<PageProps<"/projects/[slug]">, "params">) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()]);
  if (!project) notFound();

  const outline = caseStudyOutline(project);
  const number = (id: string) => outline.findIndex((entry) => entry.id === id) + 1;
  const hasLaunchTargets = project.liveUrl || project.repoUrl || project.demoUrl;

  return (
    <PageTransition>
      <JsonLd
        data={[
          projectJsonLd(project, settings),
          breadcrumbJsonLd([
            { name: "Work", path: "/projects" },
            { name: project.title, path: `/projects/${project.slug}` },
          ]),
        ]}
      />
      <TrackView type="project_view" entityType="project" entityId={project.slug} />

      <article>
        <header className="container-page pt-10 md:pt-16">
          <nav aria-label="Breadcrumb" className="label mb-10 flex items-center gap-2">
            <Link href="/projects" className="hover:text-ink">
              Work
            </Link>
            <Icon name="chevron-right" size={12} />
            <span className="text-ink-2" aria-current="page">
              {project.title}
            </span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <StatusBadge status={project.status} />
                {project.categories.map((category) => (
                  <span key={category} className="label rounded-full border border-line px-2.5 py-1">
                    {PROJECT_CATEGORY[category]}
                  </span>
                ))}
                {project.isSample ? <SampleBadge /> : null}
              </div>
              <h1 className="display text-display-m animate-rise">{project.title}</h1>
              {project.tagline ? (
                <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-2 animate-rise [animation-delay:120ms] md:text-2xl">
                  {project.tagline}
                </p>
              ) : null}
            </div>

            <aside className="flex flex-col gap-6 lg:col-span-4 lg:pt-12">
              <Datasheet
                rows={[
                  project.role ? { label: "Role", value: project.role } : null,
                  { label: "Year", value: project.year },
                  project.duration ? { label: "Duration", value: project.duration } : null,
                  project.typeLabel ? { label: "Type", value: project.typeLabel } : null,
                  project.hosting ? { label: "Hosting", value: project.hosting.name } : null,
                  project.liveUrl ? { label: "Domain", value: <span className="font-mono text-xs">{displayUrl(project.liveUrl)}</span> } : null,
                ]}
              />
              {hasLaunchTargets ? (
                <div className="flex flex-wrap gap-2">
                  {project.liveUrl ? (
                    <ButtonLink href={`/portal/${project.slug}`} variant="accent" icon="zap">
                      Launch project
                    </ButtonLink>
                  ) : null}
                  {project.repoUrl ? (
                    <ButtonLink href={project.repoUrl} external variant="secondary" icon="github">
                      Repository
                    </ButtonLink>
                  ) : null}
                  {project.demoUrl ? (
                    <ButtonLink href={project.demoUrl} external variant="ghost" icon="play">
                      Demo
                    </ButtonLink>
                  ) : null}
                </div>
              ) : null}
            </aside>
          </div>
        </header>

        <div className="container-page mt-12">
          <ViewTransition name={`project-cover-${project.slug}`} share="morph" default="none">
            <Cover
              media={project.thumbnail}
              seed={project.slug}
              title={project.title}
              accent={project.accent}
              label={project.typeLabel ?? undefined}
              priority
              sizes="100vw"
              className="aspect-[16/10] rounded-lg border border-line md:aspect-[21/9]"
            />
          </ViewTransition>
        </div>

        {project.highlights.length ? (
          <dl className="container-page mt-4">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
              {project.highlights.map((item) => (
                <div key={item.label} className="bg-surface p-5">
                  <dt className="label">{item.label}</dt>
                  <dd className="display mt-2 text-2xl">{item.value}</dd>
                </div>
              ))}
            </div>
          </dl>
        ) : null}

        <div className="container-page mt-20 grid gap-12 lg:grid-cols-[13rem_1fr]">
          {outline.length > 2 ? (
            <aside className="hidden lg:block">
              <nav aria-label="Case study contents" className="sticky top-24">
                <p className="label mb-4">Contents</p>
                <ol className="space-y-2 border-l border-line">
                  {outline.map((entry, i) => (
                    <li key={entry.id}>
                      <a href={`#${entry.id}`} className="-ml-px flex gap-3 border-l border-transparent pl-4 text-sm text-ink-3 transition-colors hover:border-ink hover:text-ink">
                        <span className="font-mono text-2xs">{String(i + 1).padStart(2, "0")}</span>
                        {entry.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          ) : null}

          <div className={outline.length > 2 ? undefined : "lg:col-span-2"}>
            {project.descriptionHtml ? (
              <CaseSection id="overview" number={number("overview")} title="Overview">
                <Prose html={project.descriptionHtml} />
              </CaseSection>
            ) : (
              <p className="mb-16 max-w-[var(--reading-max)] text-xl leading-relaxed text-ink-2">{project.summary}</p>
            )}

            {project.role ? (
              <CaseSection id="role" number={number("role")} title="My role">
                <p className="max-w-[var(--reading-max)] font-serif text-xl leading-relaxed text-ink-2">{project.role}</p>
                {project.experiences.length ? (
                  <p className="label mt-4">
                    Built at {project.experiences.map((experience) => experience.company).join(", ")}
                  </p>
                ) : null}
              </CaseSection>
            ) : null}

            {CASE_STUDY_SECTIONS.map((section) => {
              const html = project.sections[section.key];
              const diagram = section.key === "architecture" ? project.diagram : null;
              if (!html && !diagram) return null;
              return (
                <CaseSection key={section.key} id={section.key} number={number(section.key)} title={section.title}>
                  {html ? <Prose html={html} /> : null}
                  {diagram ? <ArchitectureDiagram diagram={diagram} className={html ? "mt-8" : undefined} /> : null}
                </CaseSection>
              );
            })}

            {project.technologies.length ? (
              <CaseSection id="stack" number={number("stack")} title="Technology stack">
                <TechStack technologies={project.technologies} />
              </CaseSection>
            ) : null}

            {project.features.length ? (
              <CaseSection id="features" number={number("features")} title="Key features">
                <FeatureGrid features={project.features} />
              </CaseSection>
            ) : null}

            {project.gallery.length ? (
              <CaseSection id="screenshots" number={number("screenshots")} title="Screenshots">
                <Gallery items={project.gallery} />
              </CaseSection>
            ) : null}

            {project.previewVideo ? (
              <CaseSection id="demo" number={number("demo")} title="Demo">
                <video
                  src={project.previewVideo.url}
                  controls
                  preload="metadata"
                  className="w-full rounded-lg border border-line bg-paper-sunken"
                  aria-label={project.previewVideo.alt || `${project.title} demo`}
                />
              </CaseSection>
            ) : null}

            {project.posts.length ? (
              <CaseSection id="articles" number={number("articles")} title="Related articles">
                <PostList compact posts={project.posts} />
              </CaseSection>
            ) : null}

            {hasLaunchTargets || project.links.length ? (
              <section className="mt-4 rounded-lg bg-surface-inverse p-6 text-ink-inverse sm:p-10" aria-labelledby="launch-heading">
                <p className="label text-ink-inverse/60">Live project &amp; source</p>
                <h2 id="launch-heading" className="display mt-3 text-3xl md:text-4xl">
                  {project.liveUrl ? "See it running." : "Explore the code."}
                </h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.liveUrl ? (
                    <ButtonLink href={`/portal/${project.slug}`} variant="accent" icon="zap">
                      Open in project portal
                    </ButtonLink>
                  ) : null}
                  {project.repoUrl ? (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="open"
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-ink-inverse/25 px-4 text-sm hover:border-ink-inverse"
                    >
                      <Icon name="github" /> View repository <Icon name="arrow-up-right" />
                    </a>
                  ) : null}
                  {project.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="open"
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-ink-inverse/25 px-4 text-sm hover:border-ink-inverse"
                    >
                      {link.label} <Icon name="arrow-up-right" />
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        {project.neighbours.next ? (
          <nav aria-label="More projects" className="container-page mt-[var(--section-space)]">
            <Link
              href={`/projects/${project.neighbours.next.slug}`}
              data-cursor="view"
              className="group block border-t border-line pt-8"
            >
              <span className="label">Next project</span>
              <span className="mt-4 flex items-end justify-between gap-6">
                <span className="display text-display-s text-ink-3 transition-colors duration-500 group-hover:text-ink">
                  {project.neighbours.next.title}
                </span>
                <Icon
                  name="arrow-right"
                  size={48}
                  strokeWidth={1.25}
                  className="mb-2 shrink-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-2"
                />
              </span>
            </Link>
          </nav>
        ) : null}
      </article>
    </PageTransition>
  );
}

function CaseStudySkeleton() {
  return (
    <div className="container-page pt-16" aria-busy="true" aria-label="Loading case study">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-10 h-24 w-3/4" />
      <div className="skeleton mt-6 h-6 w-1/2" />
      <div className="skeleton mt-12 aspect-[21/9] w-full" />
    </div>
  );
}
