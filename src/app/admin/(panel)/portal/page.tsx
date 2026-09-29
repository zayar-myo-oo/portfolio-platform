import { PortalManager } from "@/components/admin/portal-manager";
import { AdminHeader, AdminLinkButton } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Portal" };

export default async function AdminPortalPage() {
  await requireAdmin();
  const projects = await db.project.findMany({
    orderBy: [{ portalOrder: "asc" }, { year: "desc" }],
    select: { id: true, slug: true, title: true, status: true, liveUrl: true, published: true, showInPortal: true, featured: true, allowEmbed: true },
  });

  return (
    <>
      <AdminHeader
        title="Portal"
        description="Order sets the portal's “Featured” sort. Only published projects marked “In portal” appear. Embedded previews are also checked against each site's framing headers."
        actions={
          <AdminLinkButton href="/portal" variant="secondary" icon="external">
            Open portal
          </AdminLinkButton>
        }
      />
      {projects.length ? <PortalManager initial={projects} /> : <p className="text-sm text-ink-3">Create a project first.</p>}
    </>
  );
}
