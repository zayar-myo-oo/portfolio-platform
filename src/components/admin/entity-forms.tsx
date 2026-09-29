import {
  EMPLOYMENT_TYPE,
  EXPERIMENT_KIND,
  EXPERIMENT_STATUS,
  PROFICIENCY,
  TECH_CATEGORY,
  TECH_CATEGORY_ORDER,
} from "@/lib/constants";
import { SKETCH_CATALOG, SKETCH_KEYS } from "@/lib/sketches";
import type { ActionState } from "@/server/admin/form";
import { AdminForm, Checkbox, DateInput, MultiSelect, Panel, Select, StringList, TextArea, TextInput } from "./form-kit";
import { MarkdownField } from "./markdown-field";
import { MediaPicker } from "./media-picker";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
type Options = Array<{ value: string; label: string; group?: string }>;
const entries = <K extends string>(record: Record<K, string>) =>
  (Object.entries(record) as Array<[K, string]>).map(([value, label]) => ({ value, label }));

/* ── Experience ─────────────────────────────────────────────────────────── */

export type ExperienceValues = {
  company?: string;
  companyUrl?: string | null;
  role?: string;
  location?: string | null;
  employmentType?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  summary?: string;
  description?: string | null;
  responsibilities?: string[];
  achievements?: string[];
  technologies?: string[];
  projects?: string[];
  order?: number;
  published?: boolean;
};

export function ExperienceForm({ action, values = {}, technologies, projects }: { action: Action; values?: ExperienceValues; technologies: Options; projects: Options }) {
  const current = values.startDate !== undefined && values.endDate === null;
  return (
    <AdminForm action={action}>
      <Panel title="Role">
        <TextInput label="Company / school" name="company" defaultValue={values.company} required maxLength={160} />
        <TextInput label="Role / programme" name="role" defaultValue={values.role} required maxLength={160} />
        <Select label="Type" name="employmentType" defaultValue={values.employmentType ?? "FULL_TIME"} options={entries(EMPLOYMENT_TYPE)} />
        <TextInput label="Location" name="location" defaultValue={values.location} placeholder="Remote, Yangon…" />
        <DateInput label="Start" name="startDate" mode="month" defaultValue={values.startDate} />
        <DateInput label="End" name="endDate" mode="month" defaultValue={values.endDate} hint="Ignored when “Current” is ticked." />
        <Checkbox label="Current position" name="current" defaultChecked={current} />
        <TextInput label="Company website" name="companyUrl" type="url" defaultValue={values.companyUrl} placeholder="https://" />
        <TextArea label="Summary" name="summary" defaultValue={values.summary} rows={2} maxLength={500} />
      </Panel>
      <Panel title="Details" description="Shown when the timeline entry is expanded.">
        <StringList label="Responsibilities" name="responsibilities" defaultValue={values.responsibilities} />
        <StringList label="Achievements" name="achievements" defaultValue={values.achievements} hint="Prefer concrete, verifiable outcomes." />
        <MarkdownField label="Description (optional)" name="description" defaultValue={values.description} rows={5} />
        <MultiSelect label="Technologies" name="technologies" options={technologies} defaultValue={values.technologies} />
        <MultiSelect label="Projects from this role" name="projects" options={projects} defaultValue={values.projects} />
      </Panel>
      <Panel title="Visibility">
        <Checkbox label="Published" name="published" defaultChecked={values.published ?? true} />
        <TextInput label="Order (tie-breaker)" name="order" type="number" defaultValue={values.order ?? 0} />
      </Panel>
    </AdminForm>
  );
}

/* ── Technology ─────────────────────────────────────────────────────────── */

export type TechnologyValues = {
  name?: string;
  slug?: string;
  category?: string;
  proficiency?: string;
  since?: number | null;
  description?: string | null;
  url?: string | null;
  featured?: boolean;
  order?: number;
};

export function TechnologyForm({ action, values = {}, submitLabel }: { action: Action; values?: TechnologyValues; submitLabel?: string }) {
  return (
    <AdminForm action={action} submitLabel={submitLabel}>
      <Panel title="Technology" description="Usage counts are derived from published projects — no percentages.">
        <TextInput label="Name" name="name" defaultValue={values.name} required maxLength={60} />
        <TextInput label="Slug" name="slug" defaultValue={values.slug} mono hint="Generated from the name if empty." />
        <Select label="Category" name="category" defaultValue={values.category ?? "FRONTEND"} options={TECH_CATEGORY_ORDER.map((c) => ({ value: c, label: TECH_CATEGORY[c] }))} />
        <Select
          label="Proficiency"
          name="proficiency"
          defaultValue={values.proficiency ?? "PROFICIENT"}
          options={(Object.keys(PROFICIENCY) as Array<keyof typeof PROFICIENCY>).map((key) => ({ value: key, label: PROFICIENCY[key].label }))}
        />
        <TextInput label="Using since (year)" name="since" type="number" defaultValue={values.since} hint="Shows as “N years”. Leave empty if unsure." />
        <TextInput label="Order" name="order" type="number" defaultValue={values.order ?? 0} />
        <TextInput label="Official URL" name="url" type="url" defaultValue={values.url} full />
        <TextArea label="Notes" name="description" defaultValue={values.description} rows={2} maxLength={400} />
        <Checkbox label="Featured" name="featured" defaultChecked={values.featured} hint="Prioritised in the hero stack object." />
      </Panel>
    </AdminForm>
  );
}

/* ── Experiment ─────────────────────────────────────────────────────────── */

export type ExperimentValues = {
  title?: string;
  slug?: string;
  summary?: string;
  description?: string | null;
  status?: string;
  kind?: string;
  year?: number;
  sketch?: string | null;
  url?: string | null;
  repoUrl?: string | null;
  thumbnail?: { id: string; url: string; alt: string } | null;
  published?: boolean;
  featured?: boolean;
  order?: number;
  technologies?: string[];
};

export function ExperimentForm({ action, values = {}, technologies }: { action: Action; values?: ExperimentValues; technologies: Options }) {
  return (
    <AdminForm action={action}>
      <Panel title="Experiment">
        <TextInput label="Title" name="title" defaultValue={values.title} required maxLength={120} />
        <TextInput label="Slug" name="slug" defaultValue={values.slug} mono />
        <TextArea label="Summary" name="summary" defaultValue={values.summary} rows={2} maxLength={400} />
        <Select label="Status" name="status" defaultValue={values.status ?? "IN_PROGRESS"} options={entries(EXPERIMENT_STATUS)} />
        <Select label="Kind" name="kind" defaultValue={values.kind ?? "OTHER"} options={entries(EXPERIMENT_KIND)} />
        <TextInput label="Year" name="year" type="number" defaultValue={values.year ?? new Date().getFullYear()} />
        <Select
          label="Interactive sketch"
          name="sketch"
          defaultValue={values.sketch}
          allowEmpty="— None (static) —"
          options={SKETCH_KEYS.map((key) => ({ value: key, label: SKETCH_CATALOG[key].label }))}
          hint="Sketches are code components; this attaches one to the page."
        />
        <MarkdownField label="Description" name="description" defaultValue={values.description} rows={6} />
      </Panel>
      <Panel title="Links & media">
        <TextInput label="External URL" name="url" type="url" defaultValue={values.url} />
        <TextInput label="Repository" name="repoUrl" type="url" defaultValue={values.repoUrl} />
        <MediaPicker label="Thumbnail" name="thumbnailId" defaultValue={values.thumbnail} />
        <MultiSelect label="Technologies" name="technologies" options={technologies} defaultValue={values.technologies} />
      </Panel>
      <Panel title="Visibility">
        <Checkbox label="Published" name="published" defaultChecked={values.published} />
        <Checkbox label="Featured" name="featured" defaultChecked={values.featured} />
        <TextInput label="Order" name="order" type="number" defaultValue={values.order ?? 0} />
      </Panel>
    </AdminForm>
  );
}
