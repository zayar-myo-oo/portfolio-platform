import { AdminForm, Checkbox, ObjectList, Panel, Select, StringList, TextArea, TextInput } from "@/components/admin/form-kit";
import { MarkdownField } from "@/components/admin/markdown-field";
import { MediaPicker } from "@/components/admin/media-picker";
import { AdminHeader } from "@/components/admin/ui";
import { updateSettings } from "@/server/actions/admin/site";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { mediaRefSelect, pickerValue, projectOptions } from "@/server/admin/queries";
import { journeySchema, parseJsonList, principleSchema, socialSchema } from "@/lib/json-fields";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, projects] = await Promise.all([
    db.siteSetting.findUnique({ where: { id: "site" }, include: { portrait: mediaRefSelect, ogImage: mediaRefSelect } }),
    projectOptions(),
  ]);
  const s = settings;

  return (
    <>
      <AdminHeader title="Settings" description="Identity, hero, About page and SEO defaults. Changes apply to every page immediately." />
      <AdminForm action={updateSettings}>
        <Panel title="Identity">
          <TextInput label="Name" name="ownerName" defaultValue={s?.ownerName} required maxLength={80} />
          <TextInput label="Role" name="role" defaultValue={s?.role} required maxLength={80} />
          <TextInput label="Email (public)" name="email" type="email" defaultValue={s?.email} />
          <TextInput label="GitHub username" name="githubUsername" defaultValue={s?.githubUsername} hint="Powers the activity card (public events only)." />
          <TextInput label="Location" name="location" defaultValue={s?.location} />
          <TextInput label="Timezone" name="timezone" defaultValue={s?.timezone ?? "UTC"} mono hint="IANA name, e.g. Asia/Yangon or Asia/Bangkok." />
          <TextInput label="Résumé URL" name="resumeUrl" type="url" defaultValue={s?.resumeUrl} full />
          <ObjectList
            label="Social links"
            name="socials"
            defaultValue={parseJsonList(socialSchema, s?.socials)}
            fields={[
              { key: "label", label: "Label (GitHub, LinkedIn…)" },
              { key: "url", label: "https://…" },
            ]}
          />
        </Panel>

        <Panel title="Hero" description="The home page headline is split into lines; the last line is dimmed.">
          <StringList label="Headline lines" name="headline" defaultValue={s?.headline} hint="2–4 short lines work best." />
          <TextArea label="Statement" name="statement" defaultValue={s?.statement} rows={3} maxLength={500} />
          <TextInput label="Current focus" name="currentFocus" defaultValue={s?.currentFocus} />
          <TextInput label="Currently building (text)" name="currentlyBuilding" defaultValue={s?.currentlyBuilding} />
          <Select label="Currently building (project)" name="currentlyBuildingProjectId" defaultValue={s?.currentlyBuildingProjectId} options={projects} allowEmpty="— None —" />
          <Checkbox label="Available for work" name="isAvailable" defaultChecked={s?.isAvailable} hint="Shows a live status indicator." />
          <TextInput label="Availability message" name="availability" defaultValue={s?.availability} placeholder="Open to new roles" />
        </Panel>

        <Panel title="About page">
          <MediaPicker label="Portrait" name="portraitId" defaultValue={pickerValue(s?.portrait ?? null)} />
          <div />
          <MarkdownField label="Introduction" name="aboutIntro" defaultValue={s?.aboutIntro} rows={5} />
          <MarkdownField label="Engineering philosophy" name="philosophy" defaultValue={s?.philosophy} rows={5} />
          <ObjectList
            label="Principles"
            name="principles"
            defaultValue={parseJsonList(principleSchema, s?.principles)}
            fields={[
              { key: "title", label: "Principle" },
              { key: "body", label: "Explanation", multiline: true },
            ]}
          />
          <ObjectList
            label="Journey"
            name="journey"
            defaultValue={parseJsonList(journeySchema, s?.journey)}
            fields={[
              { key: "period", label: "Period (e.g. 2020 – 2021)" },
              { key: "title", label: "Milestone" },
              { key: "body", label: "Detail", multiline: true },
            ]}
          />
          <StringList label="What I like building" name="likesBuilding" defaultValue={s?.likesBuilding} />
          <StringList label="Interests" name="interests" defaultValue={s?.interests} />
        </Panel>

        <Panel title="SEO defaults">
          <TextInput label="Site title" name="siteTitle" defaultValue={s?.siteTitle} required full maxLength={80} />
          <TextArea label="Site description" name="siteDescription" defaultValue={s?.siteDescription} rows={2} maxLength={300} />
          <MediaPicker label="Default social image" name="ogImageId" defaultValue={pickerValue(s?.ogImage ?? null)} hint="Pages without their own image use a generated card." />
        </Panel>
      </AdminForm>
    </>
  );
}
