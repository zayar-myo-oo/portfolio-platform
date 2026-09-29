"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SampleBadge, TechTag } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { EMPLOYMENT_TYPE } from "@/lib/constants";
import type { ExperienceItem } from "@/lib/types";
import { cn, formatDuration, formatMonthYear } from "@/lib/utils";

const noop = () => () => {};
/** Current time on the client only — durations of ongoing roles never render time-dependent HTML on the server. */
function useNow(): Date | null {
  const now = useSyncExternalStore(noop, () => Math.floor(Date.now() / 86_400_000), () => null);
  return now === null ? null : new Date(now * 86_400_000);
}

/**
 * Career timeline. The rail fills as you scroll through it; each role
 * expands in place to show responsibilities, achievements and the projects
 * it produced (relationships appear on expand).
 */
export function Timeline({ items }: { items: ExperienceItem[] }) {
  const rail = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const now = useNow();

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const anchor = window.innerHeight * 0.55;
      setProgress(Math.min(1, Math.max(0, (anchor - rect.top) / rect.height)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ol ref={rail} className="relative">
      {/* Rail + progress */}
      <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-line md:left-[calc(12rem+7px)]" />
      <span
        aria-hidden
        className="absolute top-2 left-[7px] w-px origin-top bg-accent md:left-[calc(12rem+7px)]"
        style={{ height: "calc(100% - 1rem)", transform: `scaleY(${progress})` }}
      />

      {items.map((item) => {
        const expanded = open === item.id;
        const current = item.endDate === null;
        const period = `${formatMonthYear(item.startDate)} — ${current ? "Present" : formatMonthYear(item.endDate)}`;
        const duration = current ? (now ? formatDuration(item.startDate, null, now) : null) : formatDuration(item.startDate, item.endDate, item.endDate!);
        const panelId = `experience-${item.id}`;

        return (
          <li key={item.id} className="relative grid gap-3 pb-14 pl-10 md:grid-cols-[12rem_1fr] md:gap-10 md:pl-0">
            <div className="md:pr-10 md:text-right">
              <p className="font-mono text-xs text-ink-2 tabular-nums">{period}</p>
              {duration ? <p className="label mt-1">{duration}</p> : null}
            </div>

            <span
              aria-hidden
              className={cn(
                "absolute top-1 left-0 size-[15px] rounded-full border-2 bg-paper transition-colors duration-500 md:left-[12rem]",
                current ? "border-accent" : expanded ? "border-ink" : "border-line-strong",
              )}
            >
              {current ? <span className="absolute inset-[3px] animate-pulse rounded-full bg-accent" /> : null}
            </span>

            <div className="md:pl-10">
              <div
                className={cn(
                  "rounded-lg border transition-[border-color,background-color] duration-300",
                  expanded ? "border-line-strong bg-surface" : "border-transparent hover:border-line",
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : item.id)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  className="flex w-full items-start justify-between gap-6 p-5 text-left"
                >
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="display text-2xl md:text-3xl">{item.role}</span>
                      {item.isSample ? <SampleBadge /> : null}
                    </span>
                    <span className="mt-1.5 block text-ink-2">
                      {item.company}
                      <span className="text-ink-3">
                        {" "}
                        · {EMPLOYMENT_TYPE[item.employmentType]}
                        {item.location ? ` · ${item.location}` : ""}
                      </span>
                    </span>
                    <span className="mt-3 block max-w-2xl text-sm leading-relaxed text-ink-2">{item.summary}</span>
                  </span>
                  <Icon
                    name="plus"
                    size={18}
                    className={cn("mt-2 shrink-0 text-ink-3 transition-transform duration-500 ease-[var(--ease-out-expo)]", expanded && "rotate-45 text-ink")}
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-label={`${item.role} at ${item.company}`}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-expo)]",
                    expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                  inert={!expanded}
                >
                  <div className="overflow-hidden">
                    <div className="grid gap-8 border-t border-line p-5 lg:grid-cols-2">
                      {item.descriptionHtml ? (
                        <div className="prose text-base lg:col-span-2" dangerouslySetInnerHTML={{ __html: item.descriptionHtml }} />
                      ) : null}
                      {item.responsibilities.length ? (
                        <div>
                          <p className="label mb-3">Responsibilities</p>
                          <ul className="space-y-2 text-sm text-ink-2">
                            {item.responsibilities.map((line) => (
                              <li key={line} className="flex gap-3">
                                <span className="mt-2 h-px w-3 shrink-0 bg-ink-3" />
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {item.achievements.length ? (
                        <div>
                          <p className="label mb-3">Achievements</p>
                          <ul className="space-y-2 text-sm text-ink-2">
                            {item.achievements.map((line) => (
                              <li key={line} className="flex gap-3">
                                <Icon name="check" size={14} className="mt-0.5 shrink-0 text-live" />
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {item.technologies.length ? (
                        <div>
                          <p className="label mb-3">Technologies</p>
                          <ul className="flex flex-wrap gap-1.5">
                            {item.technologies.map((tech, i) => (
                              <li
                                key={tech.slug}
                                className={cn("transition-[opacity,transform] duration-500", expanded ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0")}
                                style={{ transitionDelay: expanded ? `${120 + i * 35}ms` : "0ms" }}
                              >
                                <TechTag>{tech.name}</TechTag>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {item.projects.length ? (
                        <div>
                          <p className="label mb-3">Projects from this role</p>
                          <ul className="space-y-1.5">
                            {item.projects.map((project) => (
                              <li key={project.slug}>
                                <Link href={`/projects/${project.slug}`} className="group inline-flex items-center gap-2 text-sm text-ink hover:text-accent-ink">
                                  <Icon name="arrow-right" size={13} className="transition-transform group-hover:translate-x-0.5" />
                                  {project.title}
                                  <span className="font-mono text-2xs text-ink-3">{project.year}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {item.companyUrl ? (
                        <a
                          href={item.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="label inline-flex items-center gap-1 hover:text-ink lg:col-span-2"
                        >
                          {item.company} website <Icon name="arrow-up-right" size={12} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
