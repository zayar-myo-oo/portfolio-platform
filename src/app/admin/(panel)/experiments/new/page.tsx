import { ExperimentForm } from "@/components/admin/entity-forms";
import { AdminHeader } from "@/components/admin/ui";
import { createExperiment } from "@/server/actions/admin/experiments";
import { requireAdmin } from "@/server/auth/dal";
import { technologyOptions } from "@/server/admin/queries";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "New experiment" };

export default async function NewExperimentPage() {
  await requireAdmin();
  const technologies = await technologyOptions();
  return (
    <>
      <AdminHeader title="New experiment" back={{ href: "/admin/experiments", label: "Experiments" }} />
      <ExperimentForm action={createExperiment} technologies={technologies} />
    </>
  );
}
