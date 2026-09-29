import type { Metadata } from "next";
import { Timeline } from "@/components/experience/timeline";
import { PageTransition } from "@/components/motion/page-transition";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getCareerStats, getExperience } from "@/server/data/experience";
import { getSiteSettings } from "@/server/data/settings";

export const metadata: Metadata = {
  title: "Experience",
  description: "Career timeline — roles, responsibilities, technologies and the projects each one produced.",
  alternates: { canonical: "/experience" },
};

export default async function ExperiencePage() {
  const [items, stats, settings] = await Promise.all([getExperience(), getCareerStats(), getSiteSettings()]);
  const companies = new Set(items.filter((item) => item.employmentType !== "EDUCATION").map((item) => item.company)).size;

  return (
    <PageTransition>
      <header className="container-page pt-16 pb-16 md:pt-24">
        <p className="label mb-8">Experience</p>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <h1 className="display text-display-m animate-rise lg:col-span-8">
            Where I&rsquo;ve
            <br />
            <span className="text-ink-3">done the work.</span>
          </h1>
          <dl className="grid grid-cols-3 gap-4 border-y border-line py-4 lg:col-span-4">
            <div>
              <dt className="label">Years</dt>
              <dd className="display mt-1 text-3xl tabular-nums">{stats.years ?? "—"}</dd>
            </div>
            <div>
              <dt className="label">Roles</dt>
              <dd className="display mt-1 text-3xl tabular-nums">{stats.roles}</dd>
            </div>
            <div>
              <dt className="label">Teams</dt>
              <dd className="display mt-1 text-3xl tabular-nums">{companies}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="container-page">
        {items.length ? (
          <Timeline items={items} />
        ) : (
          <EmptyState eyebrow="Timeline empty" title="No experience entries yet.">
            Add roles from the admin dashboard to build the timeline.
          </EmptyState>
        )}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-8">
          <ButtonLink href="/projects" variant="secondary" trailingIcon="arrow-right">
            See the projects
          </ButtonLink>
          {settings.resumeUrl ? (
            <ButtonLink href={settings.resumeUrl} external variant="ghost" icon="file">
              Résumé
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
