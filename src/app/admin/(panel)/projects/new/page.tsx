import { ProjectForm } from "@/components/admin/project-form";
import { AdminHeader } from "@/components/admin/ui";
import { createProject } from "@/server/actions/admin/projects";
import { requireAdmin } from "@/server/auth/dal";
import { technologyOptions } from "@/server/admin/queries";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const technologies = await technologyOptions();
  return (
    <>
      <AdminHeader title="New project" back={{ href: "/admin/projects", label: "Projects" }} />
      <ProjectForm action={createProject} technologies={technologies} values={{ published: false, showInPortal: true }} />
    </>
  );
}
