import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";
import { Reveal } from "@/components/motion/reveal";
import { SampleBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Cover } from "@/components/ui/media";
import { EmptyState } from "@/components/ui/states";
import { getExperiments } from "@/server/data/experiments";
import { EXPERIMENT_KIND, EXPERIMENT_STATUS } from "@/lib/constants";
import { isSketchKey } from "@/lib/sketches";
import { cn, indexLabel } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lab",
  description: "Experiments — unfinished ideas, WebGL, creative coding, typography and tools in progress.",
  alternates: { canonical: "/experiments" },
};

export default async function ExperimentsPage() {
  const experiments = await getExperiments();

  return (
    <PageTransition>
      <header className="container-page relative overflow-hidden pt-16 pb-16 md:pt-24">
        <div className="flex items-center justify-between">
          <p className="label">05 — Lab</p>
          <p className="label hidden sm:block">Unfinished by design</p>
        </div>
        <h1
          className="display mt-6 text-[clamp(5rem,2rem+22vw,22rem)] leading-[0.78] tracking-[-0.07em] text-transparent [-webkit-text-stroke:1.5px_var(--ink)] animate-rise"
          aria-label="Lab"
        >
          Lab<span className="text-accent [-webkit-text-stroke:0]">.</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-ink-2">
          Where ideas are allowed to be half-built: shaders, type experiments, tools and prototypes. Some run right here in the
          browser.
        </p>
      </header>

      <div className="container-page">
        {experiments.length === 0 ? (
          <EmptyState eyebrow="Lab is quiet" title="No experiments published yet." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-6">
            {experiments.map((experiment, i) => {
              const playable = isSketchKey(experiment.sketch);
              const wide = i % 5 === 0;
              return (
                <Reveal
                  as="li"
                  key={experiment.id}
                  index={i % 3}
                  className={cn(wide ? "md:col-span-4" : "md:col-span-2", i % 5 === 3 && "md:col-span-3", i % 5 === 4 && "md:col-span-3")}
                >
                  <Link
                    href={`/experiments/${experiment.slug}`}
                    data-cursor={playable ? "launch" : "view"}
                    className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-[transform,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-rotate-[0.6deg] hover:border-line-strong"
                  >
                    <Cover
                      media={experiment.thumbnail}
                      seed={experiment.slug}
                      title={experiment.title}
                      label={EXPERIMENT_KIND[experiment.kind]}
                      sizes={wide ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
                      className={wide ? "aspect-[16/8]" : "aspect-[4/3]"}
                      imageClassName="transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-105"
                    />
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-center justify-between gap-3 font-mono text-2xs tracking-[0.08em] text-ink-3 uppercase">
                        <span>
                          EXP/{indexLabel(i + 1, 3)} · {EXPERIMENT_KIND[experiment.kind]}
                        </span>
                        <span>{experiment.year}</span>
                      </div>
                      <h2 className="display flex items-center gap-2 text-2xl">
                        {experiment.title}
                        {experiment.isSample ? <SampleBadge /> : null}
                      </h2>
                      <p className="text-sm leading-relaxed text-ink-2">{experiment.summary}</p>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <span className="label">{EXPERIMENT_STATUS[experiment.status]}</span>
                        {playable ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-2xs tracking-[0.08em] text-accent-ink uppercase">
                            <Icon name="play" size={11} /> Runs in browser
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        )}
      </div>
    </PageTransition>
  );
}
