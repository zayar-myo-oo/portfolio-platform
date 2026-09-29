import Link from "next/link";
import { AdminHeader, AdminLinkButton, SavedNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { purgeSampleContent } from "@/server/actions/admin/site";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { formatDate } from "@/lib/utils";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Dashboard" };

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const session = await requireAdmin();
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

  const [projects, live, posts, drafts, scheduled, experiments, unread, views, launches, samples, recent, query] = await Promise.all([
    db.project.count({ where: { published: true } }),
    db.project.count({ where: { published: true, status: "LIVE" } }),
    db.blogPost.count({ where: { status: "PUBLISHED", publishedAt: { lte: now } } }),
    db.blogPost.count({ where: { status: "DRAFT" } }),
    db.blogPost.count({ where: { status: "PUBLISHED", publishedAt: { gt: now } } }),
    db.experiment.count({ where: { published: true } }),
    db.contactMessage.count({ where: { readAt: null, archived: false } }),
    db.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: monthAgo } } }),
    db.analyticsEvent.count({ where: { type: "project_live_launch", createdAt: { gte: monthAgo } } }),
    Promise.all([
      db.project.count({ where: { isSample: true } }),
      db.blogPost.count({ where: { isSample: true } }),
      db.experience.count({ where: { isSample: true } }),
      db.experiment.count({ where: { isSample: true } }),
      db.technology.count({ where: { isSample: true } }),
    ]).then((counts) => counts.reduce((a, b) => a + b, 0)),
    recentUpdates(),
    searchParams,
  ]);

  const stats: Array<{ label: string; value: number; href: string; icon: IconName; note?: string }> = [
    { label: "Published projects", value: projects, href: "/admin/projects", icon: "layers", note: `${live} live` },
    { label: "Articles", value: posts, href: "/admin/blog", icon: "file", note: `${drafts} drafts · ${scheduled} scheduled` },
    { label: "Experiments", value: experiments, href: "/admin/experiments", icon: "flask" },
    { label: "Unread messages", value: unread, href: "/admin/messages", icon: "inbox" },
    { label: "Page views (30d)", value: views, href: "/admin/analytics", icon: "chart" },
    { label: "Live launches (30d)", value: launches, href: "/admin/analytics", icon: "zap" },
  ];

  return (
    <>
      <AdminHeader
        title={`Hello, ${session.user.name.split(" ")[0]}`}
        description="Everything on the public site is edited here."
        actions={
          <>
            <AdminLinkButton href="/admin/projects/new" icon="plus">
              Project
            </AdminLinkButton>
            <AdminLinkButton href="/admin/blog/new" icon="plus" variant="secondary">
              Post
            </AdminLinkButton>
          </>
        }
      />
      <SavedNotice show={query.purged === "1"}>Sample content removed.</SavedNotice>

      {samples > 0 ? (
        <section className="mb-8 flex flex-col gap-4 rounded-lg border border-dashed border-accent-ink/50 bg-accent-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{samples} sample item{samples === 1 ? "" : "s"} still on the site</p>
            <p className="mt-1 text-sm text-ink-2">Marked with a “Sample” badge publicly. Edit them to make them yours, or remove them all.</p>
          </div>
          <form action={purgeSampleContent}>
            <Button type="submit" variant="danger" size="sm" icon="trash">
              Remove sample content
            </Button>
          </form>
        </section>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link href={stat.href} className="group flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-5 transition-colors hover:border-line-strong">
              <span className="flex items-center justify-between text-ink-3">
                <span className="label">{stat.label}</span>
                <Icon name={stat.icon} size={15} />
              </span>
              <span className="display text-4xl tabular-nums">{stat.value}</span>
              {stat.note ? <span className="text-xs text-ink-3">{stat.note}</span> : null}
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="mb-4 font-semibold">Recently updated</h2>
        <ol className="divide-y divide-line rounded-lg border border-line bg-surface">
          {recent.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <Link href={item.href} className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-ink/[0.02]">
                <span className="flex items-center gap-3">
                  <span className="label w-20">{item.kind}</span>
                  <span className="font-medium">{item.title}</span>
                </span>
                <span className="text-xs text-ink-3">{formatDate(item.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

async function recentUpdates() {
  const [projects, posts, experience, experiments] = await Promise.all([
    db.project.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, updatedAt: true } }),
    db.blogPost.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, updatedAt: true } }),
    db.experience.findMany({ orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, role: true, updatedAt: true } }),
    db.experiment.findMany({ orderBy: { updatedAt: "desc" }, take: 3, select: { id: true, title: true, updatedAt: true } }),
  ]);
  return [
    ...projects.map((p) => ({ kind: "Project", id: p.id, title: p.title, updatedAt: p.updatedAt, href: `/admin/projects/${p.id}` })),
    ...posts.map((p) => ({ kind: "Post", id: p.id, title: p.title, updatedAt: p.updatedAt, href: `/admin/blog/${p.id}` })),
    ...experience.map((e) => ({ kind: "Role", id: e.id, title: e.role, updatedAt: e.updatedAt, href: `/admin/experience/${e.id}` })),
    ...experiments.map((e) => ({ kind: "Lab", id: e.id, title: e.title, updatedAt: e.updatedAt, href: `/admin/experiments/${e.id}` })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);
}
