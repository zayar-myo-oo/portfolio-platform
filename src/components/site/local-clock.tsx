"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Owner's local time — a small human signal ("it's 23:10 there").
 * The server renders a neutral placeholder; the client fills it in, so there
 * is no hydration mismatch and no time-dependent server render.
 */
function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 15_000);
  return () => window.clearInterval(id);
}

function formatter(timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone });
  } catch {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  }
}

export function cityFromTimezone(timezone: string): string {
  return timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
}

export function useLocalTime(timezone: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => formatter(timezone).format(new Date()),
    () => null,
  );
}

export function LocalClock({ timezone, location, className }: { timezone: string; location?: string | null; className?: string }) {
  const time = useLocalTime(timezone);
  const place = location || cityFromTimezone(timezone);
  return (
    <span className={cn("label inline-flex items-center gap-2 tabular-nums", className)}>
      <span className="text-ink-2">{place}</span>
      <span aria-hidden className="text-line-strong">/</span>
      <time suppressHydrationWarning className="min-w-[5ch] text-ink">
        {time ?? "--:--"}
      </time>
    </span>
  );
}
