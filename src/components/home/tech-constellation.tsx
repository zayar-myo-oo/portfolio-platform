"use client";

import { useState } from "react";
import type { TechnologyItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Technology grid where hovering/focusing a technology lights up the ones
 * it is most often used with (co-occurrence in real projects). Counts are
 * evidence ("used in 3 projects"), not self-assessed percentages.
 */
export function TechConstellation({ technologies }: { technologies: TechnologyItem[] }) {
  const [focus, setFocus] = useState<string | null>(null);
  const active = technologies.find((tech) => tech.slug === focus);
  const related = new Set(active?.related.map((r) => r.slug) ?? []);

  return (
    <div className="mt-auto">
      <ul className="flex flex-wrap gap-1.5" onPointerLeave={() => setFocus(null)}>
        {technologies.map((tech) => {
          const isActive = tech.slug === focus;
          const isRelated = related.has(tech.slug);
          const dimmed = focus !== null && !isActive && !isRelated;
          return (
            <li key={tech.slug}>
              <button
                type="button"
                onPointerEnter={() => setFocus(tech.slug)}
                onFocus={() => setFocus(tech.slug)}
                onBlur={() => setFocus(null)}
                aria-describedby="tech-constellation-status"
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-all duration-300",
                  isActive && "border-ink bg-ink text-ink-inverse",
                  isRelated && "border-accent text-accent-ink",
                  !isActive && !isRelated && "border-line text-ink-2",
                  dimmed && "opacity-35",
                )}
              >
                {tech.name}
                {tech.projectCount > 0 ? (
                  <sup className={cn("font-mono text-[0.6rem]", isActive ? "text-ink-inverse/70" : "text-ink-3")}>{tech.projectCount}</sup>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p id="tech-constellation-status" className="label mt-4 min-h-4" aria-live="polite">
        {active
          ? active.projectCount
            ? `${active.name} · used in ${active.projectCount} project${active.projectCount === 1 ? "" : "s"}${
                active.related.length ? ` · often with ${active.related.slice(0, 2).map((r) => r.name).join(", ")}` : ""
              }`
            : `${active.name} · not yet linked to a published project`
          : "Superscript = number of published projects"}
      </p>
    </div>
  );
}
