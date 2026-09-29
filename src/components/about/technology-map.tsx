"use client";

import Link from "next/link";
import { useState } from "react";
import { SampleBadge } from "@/components/ui/badge";
import { PROFICIENCY, TECH_CATEGORY, TECH_CATEGORY_ORDER } from "@/lib/constants";
import type { TechnologyItem } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";

/**
 * Technologies grouped by layer. Each entry states evidence — years of use,
 * proficiency category and how many published projects use it. Hover/focus
 * reveals relationships (technologies used alongside it) across groups;
 * activating an entry lists the projects that use it.
 */
export function TechnologyMap({ technologies, currentYear }: { technologies: TechnologyItem[]; currentYear: number }) {
  const [focus, setFocus] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const active = technologies.find((tech) => tech.slug === (focus ?? selected));
  const related = new Set(active?.related.map((r) => r.slug) ?? []);
  const groups = TECH_CATEGORY_ORDER.map((category) => ({
    category,
    items: technologies.filter((tech) => tech.category === category),
  })).filter((group) => group.items.length);
  const hasSample = technologies.some((tech) => tech.isSample);

  return (
    <div>
      {hasSample ? (
        <p className="label mb-6 flex items-center gap-2">
          <SampleBadge /> Proficiency levels shown are sample data until edited in the admin.
        </p>
      ) : null}
      <div
        className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
        onPointerLeave={() => setFocus(null)}
      >
        {groups.map((group) => (
          <section key={group.category} className="bg-surface p-5" aria-labelledby={`cat-${group.category}`}>
            <h3 id={`cat-${group.category}`} className="label mb-4">
              {TECH_CATEGORY[group.category]}
            </h3>
            <ul className="space-y-1">
              {group.items.map((tech) => {
                const isActive = active?.slug === tech.slug;
                const isRelated = related.has(tech.slug);
                const dimmed = active && !isActive && !isRelated;
                const years = tech.since ? Math.max(1, currentYear - tech.since) : null;
                return (
                  <li key={tech.slug} id={`tech-${tech.slug}`} className="scroll-mt-28">
                    <button
                      type="button"
                      onPointerEnter={() => setFocus(tech.slug)}
                      onFocus={() => setFocus(tech.slug)}
                      onBlur={() => setFocus(null)}
                      onClick={() => setSelected(selected === tech.slug ? null : tech.slug)}
                      aria-expanded={selected === tech.slug}
                      className={cn(
                        "-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between gap-3 rounded-sm px-2 py-1.5 text-left transition-[opacity,background-color] duration-300",
                        isActive && "bg-ink text-ink-inverse",
                        isRelated && "bg-accent-soft",
                        dimmed && "opacity-35",
                      )}
                    >
                      <span className="font-medium">{tech.name}</span>
                      <span className={cn("font-mono text-[0.625rem] tracking-wide uppercase", isActive ? "text-ink-inverse/70" : "text-ink-3")}>
                        {PROFICIENCY[tech.proficiency].label}
                        {years ? ` · ${years}y` : ""}
                      </span>
                    </button>
                    {selected === tech.slug ? (
                      <div className="mt-2 mb-3 border-l border-accent pl-3 text-sm">
                        <p className="text-ink-2">
                          {tech.projectCount ? `Used in ${pluralize(tech.projectCount, "project")}` : "Not yet linked to a published project"}
                          {tech.since ? ` · since ${tech.since}` : ""}
                        </p>
                        {tech.description ? <p className="mt-1 text-ink-3">{tech.description}</p> : null}
                        {tech.projects.length ? (
                          <ul className="mt-2 space-y-1">
                            {tech.projects.map((project) => (
                              <li key={project.slug}>
                                <Link href={`/projects/${project.slug}`} className="text-ink hover:text-accent-ink">
                                  {project.title} →
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="label mt-4 min-h-4" aria-live="polite">
        {active
          ? `${active.name}: ${active.projectCount ? pluralize(active.projectCount, "project") : "no linked projects"}${
              active.related.length ? ` · often with ${active.related.map((r) => r.name).join(", ")}` : ""
            }`
          : "Hover or focus a technology to see what it's used with. Select it to list projects."}
      </p>
    </div>
  );
}
