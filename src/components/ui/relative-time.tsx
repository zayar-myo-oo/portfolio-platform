"use client";

import { useSyncExternalStore } from "react";
import { formatDate } from "@/lib/utils";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

function relative(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

const subscribe = (tick: () => void) => {
  const id = window.setInterval(tick, 60_000);
  return () => window.clearInterval(id);
};

/** "3 days ago" on the client; absolute date on the server (no time-dependent SSR). */
export function RelativeTime({ date, className }: { date: Date | string; className?: string }) {
  const value = new Date(date);
  const label = useSyncExternalStore(subscribe, () => relative(value), () => formatDate(value));
  return (
    <time dateTime={value.toISOString()} title={formatDate(value)} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}
