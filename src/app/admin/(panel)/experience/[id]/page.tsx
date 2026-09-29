import { notFound } from "next/navigation";
import { ExperienceForm } from "@/components/admin/entity-forms";
import { AdminHeader, ConfirmDelete, SavedNotice } from "@/components/admin/ui";
import { deleteExperience, updateExperience } from "@/server/actions/admin/experience";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { projectOptions, technologyOptions } from "@/server/admin/queries";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Edit experience" };

export default async function EditExperiencePage({ params, searchParams }: PageProps<"/admin/experience/[id]">) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [item, technologies, projects] = await Promise.all([
    db.experience.findUnique({ where: { id }, include: { technologies: { select: { id: true } }, projects: { select: { id: true } } } }),
    technologyOptions(),
    projectOptions(),
  ]);
  if (!item) notFound();

  return (
    <>
      <AdminHeader
        title={item.role}
        description={item.company}
        back={{ href: "/admin/experience", label: "Experience" }}
        actions={<ConfirmDelete action={deleteExperience.bind(null, item.id)} subject={`${item.role} — ${item.company}`} />}
      />
      <SavedNotice show={query.saved === "1"}>Entry created.</SavedNotice>
      <ExperienceForm
        action={updateExperience.bind(null, item.id)}
        technologies={technologies}
        projects={projects}
        values={{ ...item, technologies: item.technologies.map((t) => t.id), projects: item.projects.map((p) => p.id) }}
      />
    </>
  );
}
