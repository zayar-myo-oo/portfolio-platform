import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { MediaImage } from "@/components/ui/media";
import { TECH_CATEGORY, TECH_CATEGORY_ORDER } from "@/lib/constants";
import type { CaseStudySectionKey, ProjectDetail } from "@/lib/types";
import { indexLabel } from "@/lib/utils";

/** Canonical case-study order. Sections without content are skipped. */
export const CASE_STUDY_SECTIONS: Array<{ key: CaseStudySectionKey; title: string }> = [
  { key: "problem", title: "Problem" },
  { key: "context", title: "Context" },
  { key: "goals", title: "Goals" },
  { key: "solution", title: "Solution" },
  { key: "architecture", title: "Architecture" },
  { key: "implementation", title: "Implementation" },
  { key: "challenges", title: "Engineering challenges" },
  { key: "decisions", title: "Important decisions" },
  { key: "performance", title: "Performance" },
  { key: "security", title: "Security" },
  { key: "results", title: "Results" },
  { key: "lessonsLearned", title: "Lessons learned" },
];

export type TocEntry = { id: string; title: string };

/** Build the ordered list of rendered sections (drives numbering + side nav). */
export function caseStudyOutline(project: ProjectDetail): TocEntry[] {
  const entries: TocEntry[] = [];
  if (project.descriptionHtml) entries.push({ id: "overview", title: "Overview" });
  if (project.role) entries.push({ id: "role", title: "My role" });
  for (const section of CASE_STUDY_SECTIONS) {
    if (project.sections[section.key] || (section.key === "architecture" && project.diagram)) {
      entries.push({ id: section.key, title: section.title });
    }
  }
  if (project.technologies.length) entries.push({ id: "stack", title: "Technology stack" });
  if (project.features.length) entries.push({ id: "features", title: "Key features" });
  if (project.gallery.length) entries.push({ id: "screenshots", title: "Screenshots" });
  if (project.previewVideo) entries.push({ id: "demo", title: "Demo" });
  if (project.posts.length) entries.push({ id: "articles", title: "Related articles" });
  return entries;
}

export function CaseSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal as="section" id={id} className="scroll-mt-28 border-t border-line pt-8 pb-16">
      <div className="grid gap-6 lg:grid-cols-[10rem_1fr]">
        <p className="label pt-2">{indexLabel(number)}</p>
        <div>
          <h2 id={`${id}-heading`} className="display mb-6 text-3xl md:text-4xl">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </Reveal>
  );
}

export function Prose({ html }: { html: string }) {
  return <div className="prose max-w-[var(--reading-max)]" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function TechStack({ technologies }: { technologies: ProjectDetail["technologies"] }) {
  const groups = TECH_CATEGORY_ORDER.map((category) => ({
    category,
    items: technologies.filter((tech) => tech.category === category),
  })).filter((group) => group.items.length);

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <div key={group.category} className="bg-surface p-5">
          <p className="label mb-3">{TECH_CATEGORY[group.category]}</p>
          <ul className="space-y-1.5">
            {group.items.map((tech) => (
              <li key={tech.slug}>
                <Link href={`/about#tech-${tech.slug}`} className="text-lg text-ink transition-colors hover:text-accent-ink">
                  {tech.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function FeatureGrid({ features }: { features: ProjectDetail["features"] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {features.map((feature, i) => (
        <Reveal as="li" index={i} key={feature.title} className="rounded-lg border border-line bg-surface p-5">
          <p className="font-mono text-2xs text-accent-ink">{indexLabel(i + 1)}</p>
          <p className="display mt-3 text-xl">{feature.title}</p>
          {feature.description ? <p className="mt-2 text-sm leading-relaxed text-ink-2">{feature.description}</p> : null}
        </Reveal>
      ))}
    </ol>
  );
}

export function Gallery({ items }: { items: ProjectDetail["gallery"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, i) => (
        <figure key={item.media.id} className={i % 3 === 0 ? "md:col-span-2" : undefined}>
          <a
            href={item.media.url}
            target="_blank"
            rel="noopener"
            data-cursor="preview"
            className="relative block aspect-[16/10] overflow-hidden rounded-lg border border-line bg-paper-sunken"
          >
            <MediaImage media={item.media} sizes={i % 3 === 0 ? "(min-width: 1024px) 70vw, 100vw" : "(min-width: 768px) 35vw, 100vw"} />
            <span className="sr-only">Open full-size image</span>
          </a>
          {item.caption ? <figcaption className="label mt-2">{item.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
