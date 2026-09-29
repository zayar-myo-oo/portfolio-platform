import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { AdminHeader, AdminLinkButton, ConfirmDelete, SavedNotice } from "@/components/admin/ui";
import { SampleBadge } from "@/components/ui/badge";
import { deletePost, updatePost } from "@/server/actions/admin/posts";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { postPublicState } from "@/server/admin/post-state";
import { categoryOptions, mediaRefSelect, pickerValue, projectOptions } from "@/server/admin/queries";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params, searchParams }: PageProps<"/admin/blog/[id]">) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [post, categories, projects] = await Promise.all([
    db.blogPost.findUnique({
      where: { id },
      include: { cover: mediaRefSelect, tags: { select: { name: true } }, projects: { select: { id: true } } },
    }),
    categoryOptions(),
    projectOptions(),
  ]);
  if (!post) notFound();
  const isLive = postPublicState(post) === "published";

  return (
    <>
      <AdminHeader
        title={post.title}
        back={{ href: "/admin/blog", label: "Blog" }}
        description={
          post.isSample ? (
            <span className="flex items-center gap-2">
              <SampleBadge /> Ghost-written sample — saving it here makes it your own content.
            </span>
          ) : undefined
        }
        actions={
          <>
            {isLive ? (
              <AdminLinkButton href={`/blog/${post.slug}`} variant="secondary" icon="external">
                View
              </AdminLinkButton>
            ) : null}
            <ConfirmDelete action={deletePost.bind(null, post.id)} subject={post.title} />
          </>
        }
      />
      <SavedNotice show={query.saved === "1"}>Post created.</SavedNotice>
      <PostForm
        action={updatePost.bind(null, post.id)}
        categories={categories}
        projects={projects}
        values={{
          ...post,
          cover: pickerValue(post.cover),
          tags: post.tags.map((tag) => tag.name),
          projects: post.projects.map((project) => project.id),
        }}
      />
    </>
  );
}
