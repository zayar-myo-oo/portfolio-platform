import { PROJECT_CATEGORY, PROJECT_CATEGORY_ORDER, PROJECT_STATUS, PROJECT_STATUS_ORDER } from "@/lib/constants";
import type { Feature, Highlight } from "@/lib/json-fields";
import type { ActionState } from "@/server/admin/form";
import { ArchitectureField } from "./architecture-field";
import { AdminForm, Checkbox, MultiSelect, ObjectList, Panel, Select, TextArea, TextInput } from "./form-kit";
import { MarkdownField } from "./markdown-field";
import { GalleryField, MediaPicker } from "./media-picker";

type Media = { id: string; url: string; alt: string } | null;

export type ProjectFormValues = {
  title?: string;
  slug?: string;
  tagline?: string | null;
  summary?: string;
  description?: string | null;
  role?: string | null;
  year?: number;
  duration?: string | null;
  status?: string;
  categories?: string[];
  typeLabel?: string | null;
  problem?: string | null;
  context?: string | null;
  goals?: string | null;
  solution?: string | null;
  architecture?: string | null;
  architectureDiagram?: string | null;
  implementation?: string | null;
  challenges?: string | null;
  decisions?: string | null;
  performance?: string | null;
  security?: string | null;
  results?: string | null;
  lessonsLearned?: string | null;
  features?: Feature[];
  highlights?: Highlight[];
  liveUrl?: string | null;
  repoUrl?: string | null;
  demoUrl?: string | null;
  hosting?: string | null;
  thumbnail?: Media;
  previewVideo?: Media;
  gallery?: Array<{ id: string; url: string; alt: string }>;
  accent?: string | null;
  published?: boolean;
  featured?: boolean;
  showInPortal?: boolean;
  allowEmbed?: boolean;
  portalOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  technologies?: string[];
  links?: Array<{ label: string; url: string }>;
};

const CASE_STUDY: Array<{ name: keyof ProjectFormValues; label: string }> = [
  { name: "problem", label: "Problem" },
  { name: "context", label: "Context" },
  { name: "goals", label: "Goals" },
  { name: "solution", label: "Solution" },
  { name: "architecture", label: "Architecture (narrative)" },
  { name: "implementation", label: "Implementation" },
  { name: "challenges", label: "Engineering challenges" },
  { name: "decisions", label: "Important decisions" },
  { name: "performance", label: "Performance" },
  { name: "security", label: "Security" },
  { name: "results", label: "Results" },
  { name: "lessonsLearned", label: "Lessons learned" },
];

/** One form for create and edit. Empty case-study sections are hidden publicly. */
export function ProjectForm({
  action,
  values = {},
  technologies,
  secondary,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  values?: ProjectFormValues;
  technologies: Array<{ value: string; label: string; group?: string }>;
  secondary?: React.ReactNode;
}) {
  return (
    <AdminForm action={action} secondary={secondary}>
      <Panel title="Basics" description="What appears on cards, in the portal and in search results.">
        <TextInput label="Title" name="title" defaultValue={values.title} required maxLength={120} />
        <TextInput label="Slug" name="slug" defaultValue={values.slug} mono hint="URL: /projects/slug — leave empty to generate from the title." />
        <TextInput label="Tagline" name="tagline" defaultValue={values.tagline} full maxLength={160} hint="One line under the title." />
        <TextArea label="Summary" name="summary" defaultValue={values.summary} rows={3} maxLength={400} hint="Short description for cards (max 400)." />
        <TextInput label="Year" name="year" type="number" defaultValue={values.year ?? new Date().getFullYear()} />
        <TextInput label="Duration" name="duration" defaultValue={values.duration} placeholder="e.g. 3 months, Ongoing" />
        <Select
          label="Status"
          name="status"
          defaultValue={values.status ?? "DEVELOPMENT"}
          options={PROJECT_STATUS_ORDER.map((status) => ({ value: status, label: `${PROJECT_STATUS[status].label} — ${PROJECT_STATUS[status].description}` }))}
        />
        <TextInput label="Type label" name="typeLabel" defaultValue={values.typeLabel} placeholder="Web App, Developer Tool…" />
        <TextInput label="My role" name="role" defaultValue={values.role} full maxLength={200} />
        <MultiSelect
          label="Categories (portal filters)"
          name="categories"
          defaultValue={values.categories}
          options={PROJECT_CATEGORY_ORDER.map((category) => ({ value: category, label: PROJECT_CATEGORY[category] }))}
        />
      </Panel>

      <Panel title="Media" description="Without a thumbnail, a generated blueprint cover is used.">
        <MediaPicker label="Thumbnail" name="thumbnailId" defaultValue={values.thumbnail} />
        <MediaPicker label="Demo video" name="previewVideoId" kind="VIDEO" defaultValue={values.previewVideo} hint="MP4/WebM, shown in the Demo section." />
        <GalleryField label="Screenshots" name="gallery" defaultValue={values.gallery} />
        <TextInput label="Accent colour" name="accent" defaultValue={values.accent} mono placeholder="#ff5a1f" hint="Used by generated covers." />
      </Panel>

      <Panel title="Technology" description="Order matters — the first technologies show on cards.">
        <MultiSelect label="Tech stack" name="technologies" options={technologies} defaultValue={values.technologies} placeholder="Search technologies…" />
      </Panel>

      <Panel title="Links" description="Only full http(s) URLs. The portal checks live URLs server-side before offering an embedded preview.">
        <TextInput label="Live URL" name="liveUrl" type="url" defaultValue={values.liveUrl} placeholder="https://" />
        <TextInput label="Hosting label (optional)" name="hosting" defaultValue={values.hosting} placeholder="Detected from the URL" />
        <TextInput label="Repository URL" name="repoUrl" type="url" defaultValue={values.repoUrl} placeholder="https://github.com/…" />
        <TextInput label="Demo URL" name="demoUrl" type="url" defaultValue={values.demoUrl} placeholder="https://" />
        <ObjectList
          label="Other links"
          name="links"
          defaultValue={values.links}
          fields={[
            { key: "label", label: "Label" },
            { key: "url", label: "https://…" },
          ]}
        />
      </Panel>

      <Panel title="Case study" description="Markdown. Sections left empty don't appear on the page.">
        <MarkdownField label="Overview" name="description" defaultValue={values.description} rows={6} />
        {CASE_STUDY.map((section) => (
          <MarkdownField key={section.name} label={section.label} name={section.name} defaultValue={values[section.name] as string | null | undefined} rows={5} />
        ))}
        <ArchitectureField name="architectureDiagram" defaultValue={values.architectureDiagram} />
        <ObjectList
          label="Key features"
          name="features"
          defaultValue={values.features}
          fields={[
            { key: "title", label: "Feature" },
            { key: "description", label: "Description", multiline: true },
          ]}
        />
        <ObjectList
          label="Highlights"
          name="highlights"
          defaultValue={values.highlights}
          hint="Up to 8 facts shown under the hero (e.g. “Unit tests — 87”)."
          fields={[
            { key: "label", label: "Label" },
            { key: "value", label: "Value" },
          ]}
        />
      </Panel>

      <Panel title="Publishing & portal">
        <Checkbox label="Published" name="published" defaultChecked={values.published} hint="Visible on the public site." />
        <Checkbox label="Featured" name="featured" defaultChecked={values.featured} hint="Home page and top of lists." />
        <Checkbox label="Show in portal" name="showInPortal" defaultChecked={values.showInPortal ?? true} />
        <Checkbox label="Allow embedded preview" name="allowEmbed" defaultChecked={values.allowEmbed} hint="Still blocked if the site forbids framing." />
        <TextInput label="Portal order" name="portalOrder" type="number" defaultValue={values.portalOrder ?? 0} hint="Or drag in Admin → Portal." />
      </Panel>

      <Panel title="SEO" description="Falls back to title and summary when empty.">
        <TextInput label="SEO title" name="seoTitle" defaultValue={values.seoTitle} maxLength={70} full />
        <TextArea label="SEO description" name="seoDescription" defaultValue={values.seoDescription} rows={2} maxLength={200} />
      </Panel>
    </AdminForm>
  );
}
