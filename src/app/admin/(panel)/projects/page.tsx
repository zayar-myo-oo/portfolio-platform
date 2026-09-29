import Link from "next/link";
import { AdminHeader, AdminLinkButton, SavedNotice, Table } from "@/components/admin/ui";
import { SampleBadge, StatusBadge } from "@/components/ui/badge";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { formatDate } from "@/lib/utils";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Projects" };

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  await requireAdmin();
  const [projects, params] = await Promise.all([
    db.project.findMany({
      orderBy: [{ portalOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true, slug: true, title: true, status: true, year: true, published: true, featured: true, showInPortal: true, isSample: true, updatedAt: true, _count: { select: { technologies: true } } },
    }),
    searchParams,
  ]);

  return (
    <>
      <AdminHeader
        title="Projects"
        description="Everything here renders on /projects, the portal and the home page."
        actions={<AdminLinkButton href="/admin/projects/new" icon="plus">New project</AdminLinkButton>}
      />
      <SavedNotice show={params.deleted === "1"}>Project deleted.</SavedNotice>
      <Table head={["Project", "Status", "Visibility", "Updated", ""]} empty={projects.length ? null : <p className="p-6 text-sm text-ink-3">No projects yet.</p>}>
        {projects.map((project) => (
          <tr key={project.id} className="hover:bg-ink/[0.02]">
            <td className="px-4 py-3">
              <Link href={`/admin/projects/${project.id}`} className="flex items-center gap-2 font-medium hover:text-accent-ink">
                {project.title}
                {project.isSample ? <SampleBadge /> : null}
              </Link>
              <span className="font-mono text-xs text-ink-3">
                /{project.slug} · {project.year} · {project._count.technologies} tech
              </span>
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={project.status} bare />
            </td>
            <td className="px-4 py-3 text-xs text-ink-2">
              {project.published ? "Published" : <span className="text-beta">Draft</span>}
              {project.featured ? " · Featured" : ""}
              {project.showInPortal ? " · Portal" : ""}
            </td>
            <td className="px-4 py-3 text-xs text-ink-3">{formatDate(project.updatedAt)}</td>
            <td className="px-4 py-3 text-right">
              <div className="flex justify-end gap-3 text-xs">
                {project.published ? (
                  <Link href={`/projects/${project.slug}`} target="_blank" className="text-ink-3 hover:text-ink">
                    View ↗
                  </Link>
                ) : null}
                <Link href={`/admin/projects/${project.id}`} className="font-medium hover:text-accent-ink">
                  Edit
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
