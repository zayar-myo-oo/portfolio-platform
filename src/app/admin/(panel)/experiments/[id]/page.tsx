import { notFound } from "next/navigation";
import { ExperimentForm } from "@/components/admin/entity-forms";
import { AdminHeader, AdminLinkButton, ConfirmDelete, SavedNotice } from "@/components/admin/ui";
import { deleteExperiment, updateExperiment } from "@/server/actions/admin/experiments";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { mediaRefSelect, pickerValue, technologyOptions } from "@/server/admin/queries";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Edit experiment" };

export default async function EditExperimentPage({ params, searchParams }: PageProps<"/admin/experiments/[id]">) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [item, technologies] = await Promise.all([
    db.experiment.findUnique({ where: { id }, include: { thumbnail: mediaRefSelect, technologies: { select: { id: true } } } }),
    technologyOptions(),
  ]);
  if (!item) notFound();

  return (
    <>
      <AdminHeader
        title={item.title}
        back={{ href: "/admin/experiments", label: "Experiments" }}
        actions={
          <>
            {item.published ? (
              <AdminLinkButton href={`/experiments/${item.slug}`} variant="secondary" icon="external">
                View
              </AdminLinkButton>
            ) : null}
            <ConfirmDelete action={deleteExperiment.bind(null, item.id)} subject={item.title} />
          </>
        }
      />
      <SavedNotice show={query.saved === "1"}>Experiment created.</SavedNotice>
      <ExperimentForm
        action={updateExperiment.bind(null, item.id)}
        technologies={technologies}
        values={{ ...item, thumbnail: pickerValue(item.thumbnail), technologies: item.technologies.map((t) => t.id) }}
      />
    </>
  );
}
