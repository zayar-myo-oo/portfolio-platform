import Link from "next/link";
import { AdminHeader, AdminLinkButton, Table } from "@/components/admin/ui";
import { SampleBadge } from "@/components/ui/badge";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { EXPERIMENT_KIND, EXPERIMENT_STATUS } from "@/lib/constants";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Experiments" };

export default async function AdminExperimentsPage() {
  await requireAdmin();
  const items = await db.experiment.findMany({ orderBy: [{ order: "asc" }, { year: "desc" }] });

  return (
    <>
      <AdminHeader
        title="Experiments"
        description="The Lab. Attach an interactive sketch to run it in the browser."
        actions={<AdminLinkButton href="/admin/experiments/new" icon="plus">New experiment</AdminLinkButton>}
      />
      <Table head={["Experiment", "Kind", "Status", "Sketch", ""]} empty={items.length ? null : <p className="p-6 text-sm text-ink-3">No experiments yet.</p>}>
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-ink/[0.02]">
            <td className="px-4 py-3">
              <Link href={`/admin/experiments/${item.id}`} className="flex items-center gap-2 font-medium hover:text-accent-ink">
                {item.title}
                {item.isSample ? <SampleBadge /> : null}
                {!item.published ? <span className="text-xs text-beta">Draft</span> : null}
              </Link>
            </td>
            <td className="px-4 py-3 text-xs text-ink-2">{EXPERIMENT_KIND[item.kind]}</td>
            <td className="px-4 py-3 text-xs text-ink-2">{EXPERIMENT_STATUS[item.status]}</td>
            <td className="px-4 py-3 font-mono text-xs text-ink-3">{item.sketch ?? "—"}</td>
            <td className="px-4 py-3 text-right text-xs">
              <Link href={`/admin/experiments/${item.id}`} className="font-medium hover:text-accent-ink">
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
