"use client";

import { Icon } from "@/components/ui/icon";
import { cityFromTimezone, useLocalTime } from "@/components/site/local-clock";

export function LocalTimeCard({
  timezone,
  location,
  availability,
}: {
  timezone: string;
  location: string | null;
  availability: string | null;
}) {
  const time = useLocalTime(timezone);
  const hour = time ? Number(time.slice(0, 2)) : null;
  const daytime = hour !== null && hour >= 7 && hour < 19;

  return (
    <div className="mt-auto">
      <p className="display text-6xl leading-none tabular-nums" suppressHydrationWarning>
        {time ?? "--:--"}
      </p>
      <p className="mt-3 flex items-center gap-2 text-sm text-ink-2">
        {hour !== null ? <Icon name={daytime ? "sun" : "moon"} size={14} /> : null}
        {location || cityFromTimezone(timezone)}
      </p>
      {availability ? (
        <p className="mt-4 inline-flex items-center gap-2 font-mono text-2xs tracking-[0.08em] text-live uppercase">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-live" />
          {availability}
        </p>
      ) : null}
    </div>
  );
}
