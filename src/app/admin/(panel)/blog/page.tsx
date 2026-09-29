import Link from "next/link";
import { AdminForm, Panel, TextInput } from "@/components/admin/form-kit";
import { ActionButton, AdminHeader, AdminLinkButton, Table } from "@/components/admin/ui";
import { SampleBadge } from "@/components/ui/badge";
import { createCategory, deleteCategory } from "@/server/actions/admin/posts";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { POST_STATE_LABEL, postPublicState } from "@/server/admin/post-state";
import { formatDate } from "@/lib/utils";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  await requireAdmin();
  const [posts, categories] = await Promise.all([
    db.blogPost.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true, isSample: true, readingMinutes: true, category: { select: { name: true } } },
    }),
    db.category.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { posts: true } } } }),
  ]);

  return (
    <>
      <AdminHeader
        title="Blog"
        description="Markdown articles with callouts, code, diagrams and scheduling."
        actions={<AdminLinkButton href="/admin/blog/new" icon="plus">New post</AdminLinkButton>}
      />
      <Table head={["Title", "State", "Category", "Date", ""]} empty={posts.length ? null : <p className="p-6 text-sm text-ink-3">No posts yet.</p>}>
        {posts.map((post) => {
          const state = POST_STATE_LABEL[postPublicState(post)];
          return (
            <tr key={post.id} className="hover:bg-ink/[0.02]">
              <td className="px-4 py-3">
                <Link href={`/admin/blog/${post.id}`} className="flex items-center gap-2 font-medium hover:text-accent-ink">
                  {post.title}
                  {post.isSample ? <SampleBadge /> : null}
                </Link>
                <span className="font-mono text-xs text-ink-3">
                  /{post.slug} · {post.readingMinutes} min
                </span>
              </td>
              <td className={`px-4 py-3 text-xs font-medium ${state.tone}`}>{state.label}</td>
              <td className="px-4 py-3 text-xs text-ink-2">{post.category?.name ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-ink-3">{formatDate(post.publishedAt ?? post.updatedAt)}</td>
              <td className="px-4 py-3 text-right text-xs">
                <Link href={`/admin/blog/${post.id}`} className="font-medium hover:text-accent-ink">
                  Edit
                </Link>
              </td>
            </tr>
          );
        })}
      </Table>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="mb-4 font-semibold">Categories</h2>
          <ul className="divide-y divide-line">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {category.name} <span className="text-ink-3">· {category._count.posts}</span>
                </span>
                {category._count.posts === 0 ? (
                  <ActionButton action={deleteCategory.bind(null, category.id)} title="Delete unused category">
                    Remove
                  </ActionButton>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
        <AdminForm action={createCategory} submitLabel="Add category">
          <Panel title="New category">
            <TextInput label="Name" name="name" maxLength={60} />
            <TextInput label="Slug" name="slug" mono hint="Optional" />
          </Panel>
        </AdminForm>
      </div>
    </>
  );
}
