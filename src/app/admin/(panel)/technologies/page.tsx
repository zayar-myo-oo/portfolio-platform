import Link from "next/link";
import { AdminHeader, AdminLinkButton, SavedNotice, Table } from "@/components/admin/ui";
import { SampleBadge } from "@/components/ui/badge";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { PROFICIENCY, TECH_CATEGORY, TECH_CATEGORY_ORDER } from "@/lib/constants";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Technologies" };

export default async function AdminTechnologiesPage({ searchParams }: PageProps<"/admin/technologies">) {
  await requireAdmin();
  const [rows, query] = await Promise.all([
    db.technology.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { projects: true, experiences: true, experiments: true } } },
    }),
    searchParams,
  ]);
  const sorted = [...rows].sort((a, b) => TECH_CATEGORY_ORDER.indexOf(a.category) - TECH_CATEGORY_ORDER.indexOf(b.category));

  return (
    <>
      <AdminHeader
        title="Technologies"
        description="Levels are categories, never percentages. “Used in” counts come from project links."
        actions={<AdminLinkButton href="/admin/technologies/new" icon="plus">Add technology</AdminLinkButton>}
      />
      <SavedNotice show={query.saved === "1"} />
      <Table head={["Name", "Category", "Level", "Since", "Used in", ""]}>
        {sorted.map((tech) => (
          <tr key={tech.id} className="hover:bg-ink/[0.02]">
            <td className="px-4 py-2.5">
              <Link href={`/admin/technologies/${tech.id}`} className="flex items-center gap-2 font-medium hover:text-accent-ink">
                {tech.name}
                {tech.featured ? <span className="text-xs text-accent-ink">★</span> : null}
                {tech.isSample ? <SampleBadge /> : null}
              </Link>
            </td>
            <td className="px-4 py-2.5 text-xs text-ink-2">{TECH_CATEGORY[tech.category]}</td>
            <td className="px-4 py-2.5 text-xs text-ink-2">{PROFICIENCY[tech.proficiency].label}</td>
            <td className="px-4 py-2.5 font-mono text-xs text-ink-3">{tech.since ?? "—"}</td>
            <td className="px-4 py-2.5 text-xs text-ink-3">
              {tech._count.projects} proj · {tech._count.experiences} roles · {tech._count.experiments} exp
            </td>
            <td className="px-4 py-2.5 text-right text-xs">
              <Link href={`/admin/technologies/${tech.id}`} className="font-medium hover:text-accent-ink">
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
