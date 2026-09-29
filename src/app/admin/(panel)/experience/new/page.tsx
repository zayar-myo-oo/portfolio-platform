import { ExperienceForm } from "@/components/admin/entity-forms";
import { AdminHeader } from "@/components/admin/ui";
import { createExperience } from "@/server/actions/admin/experience";
import { requireAdmin } from "@/server/auth/dal";
import { projectOptions, technologyOptions } from "@/server/admin/queries";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "New experience" };

export default async function NewExperiencePage() {
  await requireAdmin();
  const [technologies, projects] = await Promise.all([technologyOptions(), projectOptions()]);
  return (
    <>
      <AdminHeader title="New experience entry" back={{ href: "/admin/experience", label: "Experience" }} />
      <ExperienceForm action={createExperience} technologies={technologies} projects={projects} />
    </>
  );
}
