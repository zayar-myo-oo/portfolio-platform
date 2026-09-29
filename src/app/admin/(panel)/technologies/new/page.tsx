import { TechnologyForm } from "@/components/admin/entity-forms";
import { AdminHeader } from "@/components/admin/ui";
import { createTechnology } from "@/server/actions/admin/technologies";
import { requireAdmin } from "@/server/auth/dal";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "New technology" };

export default async function NewTechnologyPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader title="New technology" back={{ href: "/admin/technologies", label: "Technologies" }} />
      <TechnologyForm action={createTechnology} submitLabel="Create technology" />
    </>
  );
}
