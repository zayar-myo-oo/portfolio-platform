import { Icon } from "@/components/ui/icon";
import { RelativeTime } from "@/components/ui/relative-time";
import type { GithubActivity } from "@/lib/types";

/** 12-week contribution-style heatmap from public GitHub events (server-rendered). */
export function GithubHeatmap({ activity }: { activity: GithubActivity }) {
  const max = Math.max(1, ...activity.days.map((day) => day.count));
  const weeks: Array<typeof activity.days> = [];
  for (let i = 0; i < activity.days.length; i += 7) weeks.push(activity.days.slice(i, i + 7));
  const level = (count: number) => (count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)));
  const opacity = ["0.06", "0.3", "0.5", "0.75", "1"];

  return (
    <div className="mt-auto flex flex-col gap-4">
      <div className="flex gap-[3px] overflow-hidden" role="img" aria-label={`${activity.totalEvents} public GitHub events in the last 12 weeks`}>
        {weeks.map((week, w) => (
          <div key={w} className="flex flex-1 flex-col gap-[3px]">
            {week.map((day) => (
              <span
                key={day.date}
                title={`${day.date}: ${day.count}`}
                className="aspect-square w-full rounded-[2px]"
                style={{
                  background: level(day.count) ? "var(--accent)" : "var(--ink)",
                  opacity: opacity[level(day.count)],
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <a
          href={activity.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink"
          data-cursor="open"
        >
          <Icon name="github" size={15} /> @{activity.username}
        </a>
        {activity.lastPushedRepo ? (
          <span className="label">
            pushed to {activity.lastPushedRepo.name.split("/")[1]} <RelativeTime date={activity.lastPushedRepo.at} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
