import "server-only";
import { db } from "@/server/db";

/** Aggregates over the privacy-preserving event log (no per-visitor data exists). */
export async function analyticsSummary(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);

  const [byType, daily, projectViews, launches, postViews, referrers] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ["type"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "AnalyticsEvent"
      WHERE type = 'page_view' AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`,
    topEntities("project_view", since),
    topEntities("project_live_launch", since),
    topEntities("blog_view", since),
    db.analyticsEvent.groupBy({
      by: ["referrerHost"],
      where: { createdAt: { gte: since }, referrerHost: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrerHost: "desc" } },
      take: 8,
    }),
  ]);

  const counts = Object.fromEntries(byType.map((row) => [row.type, row._count._all])) as Record<string, number>;
  const dayMap = new Map(daily.map((row) => [row.day.toISOString().slice(0, 10), Number(row.count)]));
  const series = Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { date, count: dayMap.get(date) ?? 0 };
  });

  return {
    days,
    counts,
    series,
    projectViews,
    launches,
    postViews,
    referrers: referrers.map((row) => ({ host: row.referrerHost ?? "", count: row._count._all })),
  };
}

async function topEntities(type: string, since: Date) {
  const rows = await db.analyticsEvent.groupBy({
    by: ["entityId"],
    where: { type, createdAt: { gte: since }, entityId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { entityId: "desc" } },
    take: 8,
  });
  return rows.map((row) => ({ id: row.entityId ?? "", count: row._count._all }));
}
