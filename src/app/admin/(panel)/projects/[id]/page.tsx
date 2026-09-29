import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { AdminHeader, AdminLinkButton, ConfirmDelete, SavedNotice } from "@/components/admin/ui";
import { deleteProject, updateProject } from "@/server/actions/admin/projects";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { mediaRefSelect, pickerValue, technologyOptions } from "@/server/admin/queries";
import { featureSchema, highlightSchema, parseJsonList } from "@/lib/json-fields";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Edit project" };

export default async function EditProjectPage({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [project, technologies] = await Promise.all([
    db.project.findUnique({
      where: { id },
      include: {
        thumbnail: mediaRefSelect,
        previewVideo: mediaRefSelect,
        gallery: { orderBy: { order: "asc" }, include: { media: mediaRefSelect } },
        technologies: { orderBy: { order: "asc" }, select: { technologyId: true } },
        links: { orderBy: { order: "asc" }, select: { label: true, url: true } },
      },
    }),
    technologyOptions(),
  ]);
  if (!project) notFound();

  return (
    <>
      <AdminHeader
        title={project.title}
        back={{ href: "/admin/projects", label: "Projects" }}
        description={project.published ? `Live at /projects/${project.slug}` : "Draft — not visible publicly."}
        actions={
          <>
            {project.published ? (
              <AdminLinkButton href={`/projects/${project.slug}`} variant="secondary" icon="external">
                View
              </AdminLinkButton>
            ) : null}
            <ConfirmDelete action={deleteProject.bind(null, project.id)} subject={project.title} />
          </>
        }
      />
      <SavedNotice show={query.saved === "1"}>Project created.</SavedNotice>
      <ProjectForm
        action={updateProject.bind(null, project.id)}
        technologies={technologies}
        values={{
          ...project,
          features: parseJsonList(featureSchema, project.features),
          highlights: parseJsonList(highlightSchema, project.highlights),
          thumbnail: pickerValue(project.thumbnail),
          previewVideo: pickerValue(project.previewVideo),
          gallery: project.gallery.flatMap((item) => pickerValue(item.media) ?? []),
          technologies: project.technologies.map((t) => t.technologyId),
          links: project.links,
        }}
      />
    </>
  );
}
