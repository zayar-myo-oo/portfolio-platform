"use client";

import Link from "next/link";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { Cover } from "@/components/ui/media";
import { RelativeTime } from "@/components/ui/relative-time";
import { track } from "@/lib/analytics-client";
import type { MediaAsset } from "@/lib/types";
import { displayUrl, hostOf } from "@/lib/url";
import { cn } from "@/lib/utils";

type Status =
  | { phase: "idle" | "checking" }
  | {
      phase: "done";
      state: "up" | "degraded" | "down" | "blocked" | "none";
      httpStatus?: number | null;
      latencyMs?: number | null;
      checkedAt: string;
      embeddable: boolean | null;
      embedReason: string | null;
    }
  | { phase: "error" };

/** Never throws: network or server failures become an "error" status. */
async function fetchStatus(slug: string): Promise<Status> {
  try {
    const response = await fetch(`/api/portal/${slug}/status`, { cache: "no-store" });
    if (!response.ok) return { phase: "error" };
    return { phase: "done", ...(await response.json()) };
  } catch {
    return { phase: "error" };
  }
}

export type LaunchProject = {
  slug: string;
  title: string;
  accent: string | null;
  typeLabel: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  hostingName: string | null;
  thumbnail: MediaAsset | null;
  hasCaseStudy: boolean;
};

/**
 * The launch experience. Deployments are *always* opened at their real
 * address in a new tab — this page never pretends to host them. An in-page
 * preview is offered only when the owner allowed it AND the deployment's
 * headers permit framing (checked server-side before the button enables).
 */
export function LaunchConsole({ project }: { project: LaunchProject }) {
  const [status, setStatus] = useState<Status>({ phase: project.liveUrl ? "checking" : "idle" });
  const [embedded, setEmbedded] = useState(false);
  const [frameState, setFrameState] = useState<"loading" | "loaded" | "slow">("loading");
  const [frameKey, setFrameKey] = useState(0);
  const [launching, setLaunching] = useState(false);
  const launchTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!project.liveUrl) return;
    let cancelled = false;
    fetchStatus(project.slug).then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, [project.slug, project.liveUrl]);

  const check = () => {
    setStatus({ phase: "checking" });
    void fetchStatus(project.slug).then(setStatus);
  };

  // If an allowed frame never loads (network, CSP change since the check), offer the exit.
  useEffect(() => {
    if (!embedded || frameState !== "loading") return;
    const id = window.setTimeout(() => setFrameState("slow"), 10_000);
    return () => window.clearTimeout(id);
  }, [embedded, frameState, frameKey]);

  useEffect(() => () => window.clearTimeout(launchTimer.current), []);

  const onLaunch = () => {
    track("project_live_launch", { entityType: "project", entityId: project.slug });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setLaunching(true);
    window.clearTimeout(launchTimer.current);
    launchTimer.current = window.setTimeout(() => setLaunching(false), 1400);
  };

  const done = status.phase === "done" ? status : null;
  const unavailable = status.phase === "error" || (done && (done.state === "down" || done.state === "blocked"));
  const canEmbed = done?.embeddable === true;
  const host = hostOf(project.liveUrl);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Viewport */}
      <div className="lg:col-span-7">
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <div className="flex h-11 items-center gap-3 border-b border-line px-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
            </span>
            <div className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md bg-paper-sunken px-3 font-mono text-[0.6875rem] text-ink-2">
              <Icon name={project.liveUrl?.startsWith("https") ? "lock" : "globe"} size={12} className="shrink-0 text-ink-3" />
              <span className="truncate">{project.liveUrl ? displayUrl(project.liveUrl) : "no public deployment"}</span>
            </div>
            {embedded ? (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setFrameState("loading");
                    setFrameKey((key) => key + 1);
                  }}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink-2 hover:bg-ink/[0.06]"
                  aria-label="Reload preview"
                >
                  <Icon name="refresh" size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedded(false)}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink-2 hover:bg-ink/[0.06]"
                  aria-label="Close preview"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative aspect-[16/10] bg-paper-sunken">
            {embedded && project.liveUrl ? (
              <>
                <iframe
                  key={frameKey}
                  src={project.liveUrl}
                  title={`${project.title} — live preview`}
                  className="absolute inset-0 size-full bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="fullscreen"
                  loading="lazy"
                  onLoad={() => setFrameState("loaded")}
                />
                {frameState !== "loaded" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper-sunken/95 text-center">
                    {frameState === "loading" ? (
                      <>
                        <span className="size-2 animate-ping rounded-full bg-accent" />
                        <p className="label">Loading {host}…</p>
                      </>
                    ) : (
                      <>
                        <p className="display text-2xl">The preview is taking a while.</p>
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={onLaunch}
                          className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-4 text-sm text-ink-inverse"
                        >
                          Open {host} instead <Icon name="arrow-up-right" />
                        </a>
                      </>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="absolute inset-0">
                <ViewTransition name={`portal-preview-${project.slug}`} share="morph" default="none">
                  <Cover
                    media={project.thumbnail}
                    seed={project.slug}
                    title={project.title}
                    accent={project.accent}
                    label={project.typeLabel ?? undefined}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    priority
                    className="size-full"
                  />
                </ViewTransition>
              </div>
            )}
          </div>
        </div>
        <p className="label mt-3">
          {embedded
            ? "Sandboxed preview · the deployment runs on its own origin"
            : project.hostingName
              ? `Deployed on ${project.hostingName} — opens at its real address`
              : "Preview image"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-6 lg:col-span-5">
        <StatusPanel status={status} hasLiveUrl={Boolean(project.liveUrl)} onRetry={check} />

        {unavailable ? (
          <div className="rounded-lg border border-dashed border-experimental/40 p-5" role="alert">
            <p className="label text-experimental">Live project currently unavailable</p>
            <p className="mt-2 text-ink-2">The project may be temporarily offline. You can try again, or explore it another way.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={check}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-4 text-sm text-ink-inverse"
              >
                <Icon name="refresh" /> Try again
              </button>
              {project.hasCaseStudy ? (
                <Link href={`/projects/${project.slug}`} className="inline-flex h-9 items-center rounded-md border border-line-strong px-4 text-sm hover:border-ink">
                  View case study
                </Link>
              ) : null}
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-4 text-sm hover:border-ink"
                >
                  <Icon name="github" /> View repository
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onLaunch}
              data-cursor="launch"
              className={cn(
                "group flex h-14 items-center justify-between rounded-md px-5 text-base font-medium transition-[background-color,filter]",
                unavailable ? "border border-line-strong text-ink-2" : "bg-accent text-on-accent hover:brightness-105",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon name="zap" size={18} />
                Open live project
              </span>
              <span className="flex items-center gap-2 font-mono text-xs opacity-80">
                {host}
                <Icon name="arrow-up-right" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </a>
          ) : null}

          {project.liveUrl ? (
            <button
              type="button"
              disabled={!canEmbed}
              onClick={() => {
                setFrameState("loading");
                setEmbedded(true);
                track("project_embed_open", { entityType: "project", entityId: project.slug });
              }}
              className="flex h-12 items-center justify-between rounded-md border border-line-strong px-5 text-sm transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong"
              aria-describedby="embed-reason"
            >
              <span className="flex items-center gap-3">
                <Icon name="maximize" /> Open in portal
              </span>
              <span className="label">{status.phase === "checking" ? "checking…" : canEmbed ? "preview" : "unavailable"}</span>
            </button>
          ) : null}
          {project.liveUrl && done && !canEmbed && done.embedReason ? (
            <p id="embed-reason" className="text-xs text-ink-3">
              {done.embedReason}
            </p>
          ) : null}

          <div className="mt-2 grid grid-cols-2 gap-2">
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("github_click", { entityType: "project", entityId: project.slug })}
                className="flex h-11 items-center justify-center gap-2 rounded-md border border-line text-sm text-ink-2 hover:border-line-strong hover:text-ink"
                data-cursor="open"
              >
                <Icon name="github" /> Repository
              </a>
            ) : null}
            {project.hasCaseStudy ? (
              <Link
                href={`/projects/${project.slug}`}
                className="flex h-11 items-center justify-center gap-2 rounded-md border border-line text-sm text-ink-2 hover:border-line-strong hover:text-ink"
              >
                <Icon name="file" /> Case study
              </Link>
            ) : null}
            {project.demoUrl ? (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-md border border-line text-sm text-ink-2 hover:border-line-strong hover:text-ink"
              >
                <Icon name="play" /> Watch demo
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Launch transition — plays over this page while the new tab opens */}
      {launching ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-paper/92 backdrop-blur-sm animate-[launch-fade_1.4s_var(--ease-out-expo)_both]"
        >
          <div className="text-center">
            <p className="label">Launching</p>
            <p className="display mt-3 text-display-s">{host}</p>
            <div className="mx-auto mt-6 h-px w-56 overflow-hidden bg-line-strong">
              <div className="h-full origin-left animate-[launch-progress_900ms_var(--ease-out-expo)_both] bg-accent" />
            </div>
            <p className="label mt-4">Opened in a new tab ↗</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusPanel({ status, hasLiveUrl, onRetry }: { status: Status; hasLiveUrl: boolean; onRetry: () => void }) {
  if (!hasLiveUrl) {
    return (
      <div className="rounded-lg border border-line p-5">
        <p className="label">Deployment</p>
        <p className="mt-2 text-ink-2">No public link has been added for this project yet. Read the case study for how it was built.</p>
      </div>
    );
  }

  const tone =
    status.phase === "done"
      ? status.state === "up"
        ? "text-live"
        : status.state === "degraded"
          ? "text-beta"
          : "text-experimental"
      : "text-ink-3";

  const headline = statusHeadline(status);

  return (
    <div className="rounded-lg border border-line p-5" aria-live="polite" aria-busy={status.phase === "checking"}>
      <div className="flex items-center justify-between">
        <p className="label">Live status</p>
        <button type="button" onClick={onRetry} className="label inline-flex items-center gap-1 hover:text-ink" aria-label="Re-check deployment status">
          <Icon name="refresh" size={12} className={status.phase === "checking" ? "animate-spin" : undefined} /> Re-check
        </button>
      </div>
      <p className={cn("mt-3 flex items-center gap-2.5 text-lg font-medium", tone)}>
        <span
          className={cn(
            "size-2 rounded-full bg-current",
            status.phase === "done" && status.state === "up" && "animate-pulse-dot",
            status.phase === "checking" && "animate-pulse",
          )}
        />
        {headline}
      </p>
      {status.phase === "done" && status.state !== "none" ? (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-ink-3">
          {status.httpStatus ? (
            <div className="flex gap-1.5">
              <dt>HTTP</dt>
              <dd className="text-ink-2">{status.httpStatus}</dd>
            </div>
          ) : null}
          {status.latencyMs ? (
            <div className="flex gap-1.5">
              <dt>Latency</dt>
              <dd className="text-ink-2">{status.latencyMs} ms</dd>
            </div>
          ) : null}
          <div className="flex gap-1.5">
            <dt>Checked</dt>
            <dd className="text-ink-2">
              <RelativeTime date={status.checkedAt} />
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

function statusHeadline(status: Status): string {
  if (status.phase === "done") {
    switch (status.state) {
      case "up":
        return "Operational";
      case "degraded":
        return "Responding with errors";
      case "blocked":
        return "Address not allowed";
      case "none":
        return "No deployment";
      default:
        return "Unreachable";
    }
  }
  return status.phase === "error" ? "Status check failed" : "Checking deployment…";
}
