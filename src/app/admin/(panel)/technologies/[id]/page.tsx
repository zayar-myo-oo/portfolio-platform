import { notFound } from "next/navigation";
import { TechnologyForm } from "@/components/admin/entity-forms";
import { AdminHeader, ConfirmDelete } from "@/components/admin/ui";
import { deleteTechnology, updateTechnology } from "@/server/actions/admin/technologies";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Edit technology" };

export default async function EditTechnologyPage({ params }: PageProps<"/admin/technologies/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const tech = await db.technology.findUnique({ where: { id }, include: { _count: { select: { projects: true } } } });
  if (!tech) notFound();

  return (
    <>
      <AdminHeader
        title={tech.name}
        description={`Linked to ${tech._count.projects} project${tech._count.projects === 1 ? "" : "s"}.`}
        back={{ href: "/admin/technologies", label: "Technologies" }}
        actions={<ConfirmDelete action={deleteTechnology.bind(null, tech.id)} subject={tech.name} />}
      />
      <TechnologyForm action={updateTechnology.bind(null, tech.id)} values={tech} />
    </>
  );
}
