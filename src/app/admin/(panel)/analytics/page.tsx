import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth/dal";
import { analyticsSummary } from "@/server/admin/analytics";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Analytics" };

const METRICS: Array<{ type: string; label: string }> = [
  { type: "page_view", label: "Page views" },
  { type: "project_view", label: "Project views" },
  { type: "project_live_launch", label: "Live launches" },
  { type: "github_click", label: "Repo clicks" },
  { type: "blog_view", label: "Article reads" },
  { type: "blog_share", label: "Shares" },
  { type: "portal_search", label: "Portal searches" },
  { type: "contact_submit", label: "Messages" },
];

function Ranked({ title, rows, empty }: { title: string; rows: Array<{ id?: string; host?: string; count: number }>; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-3">{empty}</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row) => (
            <li key={row.id ?? row.host} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="truncate font-mono text-xs">{row.id ?? row.host}</span>
                <span className="tabular-nums text-ink-2">{row.count}</span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-ink/[0.06]">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(row.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const data = await analyticsSummary(30);
  const max = Math.max(1, ...data.series.map((day) => day.count));
  const total = data.series.reduce((sum, day) => sum + day.count, 0);

  return (
    <>
      <AdminHeader
        title="Analytics"
        description="Last 30 days. Only event counts are stored — no IP addresses, cookies, user agents or visitor IDs."
      />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {METRICS.map((metric) => (
          <div key={metric.type} className="bg-surface p-4">
            <dt className="label">{metric.label}</dt>
            <dd className="display mt-1 text-3xl tabular-nums">{data.counts[metric.type] ?? 0}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-6 rounded-lg border border-line bg-surface p-5" aria-labelledby="daily-views">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="daily-views" className="font-semibold">
            Daily page views
          </h2>
          <span className="label">{total} total</span>
        </div>
        <div className="flex h-40 items-end gap-[3px]" role="img" aria-label={`Daily page views over ${data.days} days, ${total} in total, peak ${max}.`}>
          {data.series.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count}`}
              className="flex-1 rounded-t-[2px] bg-ink/80 transition-colors hover:bg-accent"
              style={{ height: `${Math.max(2, (day.count / max) * 100)}%`, opacity: day.count ? 1 : 0.2 }}
            />
          ))}
        </div>
        <div className="label mt-2 flex justify-between">
          <span>{data.series[0]?.date}</span>
          <span>{data.series.at(-1)?.date}</span>
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Ranked title="Most viewed projects" rows={data.projectViews} empty="No project views yet." />
        <Ranked title="Most launched deployments" rows={data.launches} empty="No live launches yet." />
        <Ranked title="Most read articles" rows={data.postViews} empty="No article reads yet." />
        <Ranked title="Referring sites" rows={data.referrers} empty="No external referrers yet." />
      </div>
    </>
  );
}
