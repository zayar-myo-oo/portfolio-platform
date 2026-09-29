import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { TAG } from "@/server/cache";
import type { GithubActivity } from "@/lib/types";

const WINDOW_DAYS = 84; // 12 weeks
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

type GithubEvent = {
  type: string;
  created_at: string;
  repo?: { name?: string };
  payload?: { size?: number; commits?: unknown[] };
};

/**
 * Public GitHub activity (last 12 weeks) from the unauthenticated REST API.
 * Cached for hours, so the 60 req/h anonymous limit is never a concern.
 * Returns null on any failure — the UI hides the card rather than breaking.
 */
export async function getGithubActivity(username: string | null): Promise<GithubActivity | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG.settings);

  if (!username || !USERNAME_RE.test(username)) return null;

  const events: GithubEvent[] = [];
  try {
    for (let page = 1; page <= 3; page++) {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
        {
          headers: { Accept: "application/vnd.github+json", "User-Agent": "portfolio-platform" },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!response.ok) break;
      const batch = (await response.json()) as GithubEvent[];
      if (!Array.isArray(batch) || batch.length === 0) break;
      events.push(...batch);
      if (batch.length < 100) break;
    }
  } catch {
    return null;
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const counts = new Map<string, number>();
  for (const event of events) {
    const day = event.created_at.slice(0, 10);
    const weight = event.type === "PushEvent" ? Math.max(1, event.payload?.size ?? event.payload?.commits?.length ?? 1) : 1;
    counts.set(day, (counts.get(day) ?? 0) + weight);
  }

  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const date = new Date(today.getTime() - (WINDOW_DAYS - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });

  const lastPush = events.find((event) => event.type === "PushEvent" && event.repo?.name);
  return {
    username,
    profileUrl: `https://github.com/${username}`,
    days,
    totalEvents: events.length,
    lastPushedRepo: lastPush?.repo?.name
      ? { name: lastPush.repo.name, url: `https://github.com/${lastPush.repo.name}`, at: lastPush.created_at }
      : null,
  };
}
