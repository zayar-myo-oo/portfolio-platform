import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SketchHost } from "@/components/experiments/sketch-host";
import { PageTransition } from "@/components/motion/page-transition";
import { Prose } from "@/components/projects/case-study";
import { SampleBadge, TechTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Cover } from "@/components/ui/media";
import { Datasheet } from "@/components/ui/section";
import { getExperimentBySlug, getExperiments } from "@/server/data/experiments";
import { EXPERIMENT_KIND, EXPERIMENT_STATUS } from "@/lib/constants";
import { isSketchKey } from "@/lib/sketches";

export async function generateStaticParams() {
  const experiments = await getExperiments();
  return experiments.length ? experiments.map((e) => ({ slug: e.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/experiments/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const experiment = await getExperimentBySlug(slug);
  if (!experiment) return { title: "Experiment not found", robots: { index: false } };
  return {
    title: experiment.title,
    description: experiment.summary,
    alternates: { canonical: `/experiments/${experiment.slug}` },
  };
}

export default function ExperimentPage({ params }: PageProps<"/experiments/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page pt-16"><div className="skeleton aspect-[16/9]" /></div>}>
      <Experiment params={params} />
    </Suspense>
  );
}

async function Experiment({ params }: Pick<PageProps<"/experiments/[slug]">, "params">) {
  const { slug } = await params;
  const experiment = await getExperimentBySlug(slug);
  if (!experiment) notFound();
  const playable = isSketchKey(experiment.sketch);

  return (
    <PageTransition>
      <div className="container-page pt-10 md:pt-14">
        <nav aria-label="Breadcrumb" className="label mb-8 flex items-center gap-2">
          <Link href="/experiments" className="inline-flex items-center gap-1.5 hover:text-ink">
            <Icon name="arrow-left" size={12} /> Lab
          </Link>
          <Icon name="chevron-right" size={12} />
          <span className="text-ink-2" aria-current="page">
            {experiment.title}
          </span>
        </nav>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="label rounded-full border border-line px-2.5 py-1">{EXPERIMENT_KIND[experiment.kind]}</span>
              <span className="label">{EXPERIMENT_STATUS[experiment.status]}</span>
              {experiment.isSample ? <SampleBadge /> : null}
            </div>
            <h1 className="display text-display-s animate-rise">{experiment.title}</h1>
          </div>
          <p className="max-w-md text-ink-2">{experiment.summary}</p>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-paper-sunken sm:aspect-[16/10] lg:aspect-[21/10]">
          {playable ? (
            <SketchHost sketch={experiment.sketch!} title={experiment.title} seed={experiment.slug} />
          ) : (
            <Cover media={experiment.thumbnail} seed={experiment.slug} title={experiment.title} sizes="100vw" className="absolute inset-0" />
          )}
        </div>
        {playable ? <p className="label mt-3">Interactive · move your pointer or use the controls</p> : null}

        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {experiment.descriptionHtml ? <Prose html={experiment.descriptionHtml} /> : <p className="text-ink-2">{experiment.summary}</p>}
          </div>
          <aside className="flex flex-col gap-6 lg:col-span-4 lg:col-start-9">
            <Datasheet
              rows={[
                { label: "Status", value: EXPERIMENT_STATUS[experiment.status] },
                { label: "Kind", value: EXPERIMENT_KIND[experiment.kind] },
                { label: "Year", value: experiment.year },
              ]}
            />
            {experiment.technologies.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {experiment.technologies.map((tech) => (
                  <li key={tech.slug}>
                    <TechTag>{tech.name}</TechTag>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {experiment.url ? (
                <ButtonLink href={experiment.url} external variant="accent">
                  Open experiment
                </ButtonLink>
              ) : null}
              {experiment.repoUrl ? (
                <ButtonLink href={experiment.repoUrl} external variant="secondary" icon="github">
                  Source
                </ButtonLink>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}
