"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { track } from "@/lib/analytics-client";
import { PROJECT_STATUS, PROJECT_STATUS_ORDER } from "@/lib/constants";
import {
  categoryCounts,
  filterProjects,
  parsePortalState,
  serializePortalState,
  SORT_LABELS,
  type PortalSort,
  type PortalState,
  type PortalView,
} from "@/lib/portal";
import type { ProjectCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PortalCard } from "./portal-card";
import { PortalIndex } from "./portal-index";
import { PortalSpatial } from "./portal-spatial";

const VIEWS: Array<{ key: PortalView; label: string; icon: IconName }> = [
  { key: "grid", label: "Grid", icon: "grid" },
  { key: "index", label: "Index", icon: "list" },
  { key: "spatial", label: "Spatial", icon: "cube" },
];

/**
 * The portal's client shell: search, category chips (with live counts),
 * status filter, sort and view switching over a small cached dataset.
 * State lives in the URL (shareable, back-button friendly) without a
 * server round-trip.
 */
export function PortalExplorer({ projects }: { projects: ProjectCard[] }) {
  // Initial filters come from the URL (shareable links); changes are mirrored back.
  const searchParams = useSearchParams();
  const [state, setState] = useState<PortalState>(() => parsePortalState(searchParams.toString()));
  const deferredQuery = useDeferredValue(state.query);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = `${window.location.pathname}${serializePortalState(state)}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [state]);

  // "/" focuses search, Escape clears it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.closest("input, textarea, select, [contenteditable=true]");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Record searches, but only as known vocabulary (tech/category names) — never free text.
  useEffect(() => {
    const term = deferredQuery.trim().toLowerCase();
    if (term.length < 2) return;
    const id = window.setTimeout(() => {
      const known = projects
        .flatMap((project) => [...project.technologies.map((t) => t.name), project.typeLabel ?? ""])
        .find((name) => name.toLowerCase() === term);
      track("portal_search", { entityType: "portal", entityId: known });
    }, 1500);
    return () => window.clearTimeout(id);
  }, [deferredQuery, projects]);

  const view = useMemo(() => ({ ...state, query: deferredQuery }), [state, deferredQuery]);
  const results = useMemo(() => filterProjects(projects, view), [projects, view]);
  const counts = useMemo(() => categoryCounts(projects, view), [projects, view]);
  const update = (patch: Partial<PortalState>) => setState((prev) => ({ ...prev, ...patch }));
  const filtered = state.query || state.category !== "ALL" || state.status !== "ALL";

  return (
    <MotionConfig reducedMotion="user">
      {/* Control bar */}
      <div className="sticky-under-header z-[var(--z-raised)] -mx-[var(--gutter)] border-y border-line bg-paper/85 px-[var(--gutter)] py-3 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <label className="relative flex h-10 items-center md:w-72">
            <span className="sr-only">Search projects</span>
            <Icon name="search" className="pointer-events-none absolute left-3 text-ink-3" />
            <input
              ref={search}
              type="search"
              value={state.query}
              onChange={(event) => update({ query: event.target.value.slice(0, 80) })}
              onKeyDown={(event) => {
                if (event.key === "Escape") update({ query: "" });
              }}
              placeholder="Search name, stack, host…"
              className="h-full w-full rounded-md border border-line bg-surface pr-10 pl-9 text-sm placeholder:text-ink-3 focus:border-ink focus:outline-none"
              aria-describedby="portal-result-count"
            />
            <kbd className="pointer-events-none absolute right-2.5 hidden rounded-xs border border-line px-1.5 font-mono text-[0.625rem] text-ink-3 sm:block">
              /
            </kbd>
          </label>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 md:ml-auto md:flex">
            <label className="relative min-w-0">
              <span className="sr-only">Filter by status</span>
              <select
                value={state.status}
                onChange={(event) => update({ status: event.target.value as PortalState["status"] })}
                className="h-8 w-full appearance-none truncate rounded-md border border-line bg-surface pr-7 pl-2.5 text-sm text-ink-2 focus:border-ink focus:outline-none"
              >
                <option value="ALL">Any status</option>
                {PROJECT_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS[status].label}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={13} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-3" />
            </label>
            <label className="relative min-w-0">
              <span className="sr-only">Sort projects</span>
              <select
                value={state.sort}
                onChange={(event) => update({ sort: event.target.value as PortalSort })}
                className="h-8 w-full appearance-none truncate rounded-md border border-line bg-surface pr-7 pl-2.5 text-sm text-ink-2 focus:border-ink focus:outline-none"
              >
                {(Object.keys(SORT_LABELS) as PortalSort[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={13} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-3" />
            </label>
            <div className="flex rounded-md border border-line p-0.5 md:ml-auto" role="group" aria-label="View">
              {VIEWS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => update({ view: option.key })}
                  aria-pressed={state.view === option.key}
                  title={option.label}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-xs transition-colors",
                    state.view === option.key ? "bg-ink text-ink-inverse" : "text-ink-3 hover:text-ink",
                  )}
                >
                  <Icon name={option.icon} size={14} />
                  <span className="hidden xl:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="scrollbar-none -mx-[var(--gutter)] flex gap-1.5 overflow-x-auto px-[var(--gutter)] md:order-last md:mx-0 md:w-full md:px-0" role="group" aria-label="Filter by category">
            {counts.map((chip) => {
              const active = state.category === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => update({ category: chip.key })}
                  aria-pressed={active}
                  disabled={chip.count === 0 && !active}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors disabled:opacity-35",
                    active ? "border-ink bg-ink text-ink-inverse" : "border-line text-ink-2 hover:border-line-strong hover:text-ink",
                  )}
                >
                  {chip.label}
                  <span className={cn("font-mono text-[0.625rem] tabular-nums", active ? "text-ink-inverse/60" : "text-ink-3")}>
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Results */}
      <div className="mt-8 min-h-[40vh]">
        <p id="portal-result-count" className="label mb-5" aria-live="polite">
          {results.length} of {projects.length} projects
          {state.query ? <> matching “{state.query}”</> : null} · {SORT_LABELS[state.sort]}
        </p>

        {results.length === 0 ? (
          <div className="hairline-grid flex flex-col items-start gap-4 rounded-lg border border-dashed border-line-strong p-8 sm:p-12">
            <span className="label">No matches</span>
            <p className="display text-3xl">Nothing in the portal matches that.</p>
            <p className="text-ink-2">Try a technology (“react”), a type (“backend”) or clear the filters.</p>
            {filtered ? (
              <button
                type="button"
                onClick={() => update({ query: "", category: "ALL", status: "ALL" })}
                className="mt-2 inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-4 text-sm hover:border-ink"
              >
                <Icon name="refresh" /> Clear filters
              </button>
            ) : null}
          </div>
        ) : state.view === "index" ? (
          <PortalIndex projects={results} />
        ) : state.view === "spatial" ? (
          <PortalSpatial projects={results} />
        ) : (
          <LayoutGroup>
            <motion.ul layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {results.map((project) => (
                  <motion.li
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.8 }}
                  >
                    <PortalCard project={project} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          </LayoutGroup>
        )}
      </div>
    </MotionConfig>
  );
}
