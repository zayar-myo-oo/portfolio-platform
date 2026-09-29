import type { ReactNode } from "react";
import type { ProjectStatus } from "@/generated/prisma/enums";
import { PROJECT_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border border-line px-2.5 font-mono text-2xs tracking-[0.06em] uppercase text-ink-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<ProjectStatus, string> = {
  LIVE: "text-live",
  BETA: "text-beta",
  DEVELOPMENT: "text-development",
  ARCHIVED: "text-archived",
  PRIVATE: "text-private",
  EXPERIMENTAL: "text-experimental",
};

/** Status LED + label. "Live" pulses, the rest are steady. */
export function StatusBadge({ status, className, bare }: { status: ProjectStatus; className?: string; bare?: boolean }) {
  const tone = STATUS_TONE[status];
  const dot = (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full bg-current",
        status === "LIVE" && "animate-pulse-dot",
        status === "ARCHIVED" && "bg-transparent ring-1 ring-current",
      )}
    />
  );
  if (bare) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 font-mono text-2xs tracking-[0.08em] uppercase", tone, className)}>
        {dot}
        {PROJECT_STATUS[status].label}
      </span>
    );
  }
  return (
    <Badge className={cn(tone, "border-current/25", className)}>
      {dot}
      {PROJECT_STATUS[status].label}
    </Badge>
  );
}

/** Marks seeded placeholder content so it can never be mistaken for real work. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      title="Sample content — replace or delete it from the admin dashboard"
      className={cn(
        "inline-flex h-5 items-center rounded-xs border border-dashed border-accent-ink/60 px-1.5 font-mono text-[0.625rem] tracking-[0.1em] text-accent-ink uppercase",
        className,
      )}
    >
      Sample
    </span>
  );
}

export function TechTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-xs bg-ink/[0.045] px-2 font-mono text-[0.6875rem] tracking-[0.02em] text-ink-2",
        className,
      )}
    >
      {children}
    </span>
  );
}
