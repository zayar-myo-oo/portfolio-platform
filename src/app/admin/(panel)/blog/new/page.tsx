import { PostForm } from "@/components/admin/post-form";
import { AdminHeader } from "@/components/admin/ui";
import { createPost } from "@/server/actions/admin/posts";
import { requireAdmin } from "@/server/auth/dal";
import { categoryOptions, projectOptions } from "@/server/admin/queries";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireAdmin();
  const [categories, projects] = await Promise.all([categoryOptions(), projectOptions()]);
  return (
    <>
      <AdminHeader title="New post" back={{ href: "/admin/blog", label: "Blog" }} />
      <PostForm action={createPost} categories={categories} projects={projects} />
    </>
  );
}
