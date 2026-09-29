import type { ActionState } from "@/server/admin/form";
import { AdminForm, Checkbox, DateInput, MultiSelect, Panel, Select, TextArea, TextInput } from "./form-kit";
import { MarkdownField } from "./markdown-field";
import { MediaPicker } from "./media-picker";

export type PostFormValues = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  status?: string;
  publishedAt?: Date | null;
  featured?: boolean;
  categoryId?: string | null;
  cover?: { id: string; url: string; alt: string } | null;
  tags?: string[];
  projects?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
};

export function PostForm({
  action,
  values = {},
  categories,
  projects,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  values?: PostFormValues;
  categories: Array<{ value: string; label: string }>;
  projects: Array<{ value: string; label: string }>;
}) {
  return (
    <AdminForm action={action}>
      <Panel title="Article">
        <TextInput label="Title" name="title" defaultValue={values.title} full maxLength={160} required />
        <TextInput label="Slug" name="slug" defaultValue={values.slug} mono hint="URL: /blog/slug — generated from the title if empty." />
        <Select label="Category" name="categoryId" defaultValue={values.categoryId} options={categories} allowEmpty="— None —" />
        <TextArea label="Excerpt" name="excerpt" defaultValue={values.excerpt} rows={2} maxLength={400} hint="Shown in lists, feeds and search results." />
        <MarkdownField label="Content" name="content" defaultValue={values.content} rows={22} />
      </Panel>

      <Panel title="Publishing" description="Published + a future date = scheduled; it goes live automatically at that time.">
        <Select
          label="Status"
          name="status"
          defaultValue={values.status ?? "DRAFT"}
          options={[
            { value: "DRAFT", label: "Draft — private" },
            { value: "PUBLISHED", label: "Published / scheduled" },
          ]}
        />
        <DateInput label="Publish date" name="publishedAt" mode="datetime" defaultValue={values.publishedAt} clearable="Now" hint="Leave empty to publish immediately." />
        <Checkbox label="Featured" name="featured" defaultChecked={values.featured} hint="Highlighted at the top of /blog." />
        <MediaPicker label="Cover image" name="coverId" defaultValue={values.cover} />
        <TextInput label="Tags" name="tags" defaultValue={values.tags?.join(", ")} full hint="Comma-separated. New tags are created automatically." />
        <MultiSelect label="Related projects" name="projects" options={projects} defaultValue={values.projects} />
      </Panel>

      <Panel title="SEO">
        <TextInput label="SEO title" name="seoTitle" defaultValue={values.seoTitle} maxLength={70} full />
        <TextArea label="SEO description" name="seoDescription" defaultValue={values.seoDescription} rows={2} maxLength={200} />
        <TextInput label="Canonical URL" name="canonicalUrl" type="url" defaultValue={values.canonicalUrl} full hint="Only if this article was first published elsewhere." />
      </Panel>
    </AdminForm>
  );
}
