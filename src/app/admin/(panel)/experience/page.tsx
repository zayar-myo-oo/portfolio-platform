import Link from "next/link";
import { AdminHeader, AdminLinkButton, Table } from "@/components/admin/ui";
import { SampleBadge } from "@/components/ui/badge";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { EMPLOYMENT_TYPE } from "@/lib/constants";
import { formatMonthYear } from "@/lib/utils";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Experience" };

export default async function AdminExperiencePage() {
  await requireAdmin();
  const items = await db.experience.findMany({ orderBy: [{ startDate: "desc" }, { order: "asc" }] });

  return (
    <>
      <AdminHeader
        title="Experience"
        description="Roles and education on the /experience timeline and the home dashboard."
        actions={<AdminLinkButton href="/admin/experience/new" icon="plus">Add entry</AdminLinkButton>}
      />
      <Table head={["Role", "Type", "Period", ""]} empty={items.length ? null : <p className="p-6 text-sm text-ink-3">No entries yet.</p>}>
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-ink/[0.02]">
            <td className="px-4 py-3">
              <Link href={`/admin/experience/${item.id}`} className="flex items-center gap-2 font-medium hover:text-accent-ink">
                {item.role}
                {item.isSample ? <SampleBadge /> : null}
                {!item.published ? <span className="text-xs text-beta">Hidden</span> : null}
              </Link>
              <span className="text-xs text-ink-3">{item.company}</span>
            </td>
            <td className="px-4 py-3 text-xs text-ink-2">{EMPLOYMENT_TYPE[item.employmentType]}</td>
            <td className="px-4 py-3 font-mono text-xs text-ink-2">
              {formatMonthYear(item.startDate)} — {item.endDate ? formatMonthYear(item.endDate) : "Present"}
            </td>
            <td className="px-4 py-3 text-right text-xs">
              <Link href={`/admin/experience/${item.id}`} className="font-medium hover:text-accent-ink">
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
