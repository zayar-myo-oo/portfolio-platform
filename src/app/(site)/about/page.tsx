import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { TechnologyMap } from "@/components/about/technology-map";
import { PageTransition } from "@/components/motion/page-transition";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd, personJsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media";
import { Section, SectionHeader } from "@/components/ui/section";
import { getSiteSettings } from "@/server/data/settings";
import { getTechnologies } from "@/server/data/technologies";
import { indexLabel } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "About",
    description: `${settings.ownerName} — ${settings.role}. Engineering philosophy, principles, journey and the technology behind the work.`,
    alternates: { canonical: "/about" },
  };
}

async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export default async function AboutPage() {
  const [settings, technologies, year] = await Promise.all([getSiteSettings(), getTechnologies(), currentYear()]);

  return (
    <PageTransition>
      <JsonLd data={personJsonLd(settings)} />

      {/* Introduction */}
      <header className="container-page pt-16 md:pt-24">
        <p className="label mb-8">04 — About</p>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1 className="display text-display-m animate-rise">
              {settings.ownerName}
              <span className="mt-2 block text-ink-3">{settings.role}.</span>
            </h1>
            {settings.aboutIntroHtml ? (
              <div
                className="prose mt-10 max-w-2xl text-[1.35rem] leading-relaxed animate-rise [animation-delay:150ms]"
                dangerouslySetInnerHTML={{ __html: settings.aboutIntroHtml }}
              />
            ) : null}
          </div>
          <aside className="flex flex-col gap-6 lg:col-span-4">
            {settings.portrait ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line grayscale transition-[filter] duration-700 hover:grayscale-0">
                <MediaImage media={settings.portrait} sizes="(min-width: 1024px) 30vw, 100vw" priority />
              </div>
            ) : null}
            <dl className="divide-y divide-line border-y border-line">
              {[
                settings.location ? { label: "Based in", value: settings.location } : null,
                settings.currentFocus ? { label: "Focus", value: settings.currentFocus } : null,
                settings.isAvailable && settings.availability ? { label: "Status", value: settings.availability } : null,
              ]
                .filter(Boolean)
                .map((row) => (
                  <div key={row!.label} className="grid grid-cols-[6rem_1fr] gap-4 py-3">
                    <dt className="label pt-0.5">{row!.label}</dt>
                    <dd className="text-sm">{row!.value}</dd>
                  </div>
                ))}
            </dl>
          </aside>
        </div>
      </header>

      {/* Philosophy */}
      {settings.philosophyHtml ? (
        <Section labelledBy="philosophy-title">
          <SectionHeader index="A" label="Engineering philosophy" title={<span id="philosophy-title">How I think about the work</span>} className="mb-10" />
          <div className="grid lg:grid-cols-12">
            <div className="prose lg:col-span-7 lg:col-start-4" dangerouslySetInnerHTML={{ __html: settings.philosophyHtml }} />
          </div>
        </Section>
      ) : null}

      {/* Principles */}
      {settings.principles.length ? (
        <Section labelledBy="principles-title" className="pt-0">
          <SectionHeader index="B" label="Principles" title={<span id="principles-title">What I hold to</span>} className="mb-10" />
          <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {settings.principles.map((principle, i) => (
              <Reveal as="li" key={principle.title} index={i} className="flex flex-col rounded-lg border border-line bg-surface p-6">
                <span className="font-mono text-2xs text-accent-ink">{indexLabel(i + 1)}</span>
                <p className="display mt-6 text-2xl">{principle.title}</p>
                {principle.body ? <p className="mt-3 text-sm leading-relaxed text-ink-2">{principle.body}</p> : null}
              </Reveal>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* Journey */}
      {settings.journey.length ? (
        <Section labelledBy="journey-title" className="pt-0">
          <SectionHeader
            index="C"
            label="Journey"
            title={<span id="journey-title">How I got here</span>}
            action={{ href: "/experience", label: "Full timeline" }}
            className="mb-10"
          />
          <ol className="border-t border-line">
            {settings.journey.map((step, i) => (
              <Reveal as="li" key={`${step.period}-${step.title}`} index={i} className="grid gap-4 border-b border-line py-8 md:grid-cols-12">
                <p className="label md:col-span-3">{step.period}</p>
                <p className="display text-2xl md:col-span-4">{step.title}</p>
                <p className="text-ink-2 md:col-span-5">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* Building + interests */}
      {settings.likesBuilding.length || settings.interests.length ? (
        <Section className="pt-0">
          <div className="grid gap-12 md:grid-cols-2">
            {settings.likesBuilding.length ? (
              <div>
                <p className="label mb-6">What I like building</p>
                <ul className="space-y-3">
                  {settings.likesBuilding.map((item) => (
                    <li key={item} className="display border-b border-line pb-3 text-3xl">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {settings.interests.length ? (
              <div>
                <p className="label mb-6">Outside the editor</p>
                <ul className="flex flex-wrap gap-2">
                  {settings.interests.map((interest) => (
                    <li key={interest} className="rounded-full border border-line px-4 py-2 text-ink-2">
                      {interest}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* Technology */}
      {technologies.length ? (
        <Section id="stack" labelledBy="stack-title" className="pt-0">
          <SectionHeader
            index="D"
            label="Technology"
            title={<span id="stack-title">Tools I reach for</span>}
            description="Grouped by layer. Levels are categories, not percentages; usage counts come from published projects."
            className="mb-10"
          />
          <TechnologyMap technologies={technologies} currentYear={year} />
        </Section>
      ) : null}

      <Section className="pt-0">
        <div className="flex flex-col items-start gap-6 rounded-xl bg-surface-inverse p-8 text-ink-inverse sm:p-12">
          <p className="label text-ink-inverse/60">Say hello</p>
          <p className="display max-w-[16ch] text-display-s">Have something worth building?</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/contact" variant="accent" trailingIcon="arrow-right">
              Get in touch
            </ButtonLink>
            <Link href="/projects" className="inline-flex h-10 items-center rounded-md border border-ink-inverse/25 px-4 text-sm hover:border-ink-inverse">
              Browse the work
            </Link>
          </div>
        </div>
      </Section>
    </PageTransition>
  );
}
