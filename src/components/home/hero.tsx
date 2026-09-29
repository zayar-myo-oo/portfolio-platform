import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { SiteSettings, TechnologyItem } from "@/lib/types";
import type { TechCategory } from "@/generated/prisma/enums";
import { KineticHeadline } from "./kinetic-headline";
import { StackObject, type StackLayer } from "./stack-object";

const LAYERS: Array<{ name: string; categories: TechCategory[] }> = [
  { name: "Interface", categories: ["FRONTEND"] },
  { name: "Services", categories: ["BACKEND", "LANGUAGE"] },
  { name: "Data", categories: ["DATABASE"] },
  { name: "Platform", categories: ["CLOUD", "DEVOPS"] },
];

/** Group the real technology list into architectural layers for the hero object. */
export function buildStackLayers(technologies: TechnologyItem[]): StackLayer[] {
  return LAYERS.map((layer) => ({
    name: layer.name,
    items: technologies
      .filter((tech) => layer.categories.includes(tech.category))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || b.projectCount - a.projectCount)
      .map((tech) => tech.name),
  })).filter((layer) => layer.items.length > 0);
}

export function Hero({ settings, layers }: { settings: SiteSettings; layers: StackLayer[] }) {
  return (
    <section
      aria-label="Introduction"
      className="container-page relative grid min-h-[calc(100svh-var(--header-h))] grid-rows-[auto_1fr_auto] gap-10 pt-8 pb-10 lg:pt-12"
    >
      {/* Meta rail */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-line pb-4 animate-fade">
        <p className="label">
          <span className="text-ink">{settings.ownerName}</span> — {settings.role}
        </p>
        {settings.currentFocus ? (
          <p className="label hidden md:block">
            Focus <span className="text-ink-2">/ {settings.currentFocus}</span>
          </p>
        ) : null}
        {settings.isAvailable && settings.availability ? (
          <p className="label inline-flex items-center gap-2 text-live">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-live" />
            {settings.availability}
          </p>
        ) : null}
      </div>

      {/* Headline + spatial object */}
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <KineticHeadline lines={settings.headline} className="display text-display-l" />
        </div>
        {layers.length >= 2 ? (
          <div className="hidden md:block lg:col-span-4">
            <StackObject layers={layers} className="animate-fade [animation-delay:400ms]" />
          </div>
        ) : null}
      </div>

      {/* Statement + calls to action */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <p className="max-w-xl text-lg leading-relaxed text-ink-2 animate-rise [animation-delay:500ms] lg:col-span-5 lg:text-xl">
          {settings.statement}
        </p>
        <div className="flex flex-wrap gap-3 animate-rise [animation-delay:620ms] lg:col-span-5 lg:col-start-7">
          <ButtonLink href="/projects" variant="primary" size="lg" trailingIcon="arrow-right">
            Explore projects
          </ButtonLink>
          <ButtonLink href="/portal" variant="accent" size="lg" icon="grid">
            Enter the portal
          </ButtonLink>
          <ButtonLink href="/blog" variant="ghost" size="lg">
            Engineering notes
          </ButtonLink>
        </div>
        <a
          href="#index"
          className="label hidden items-center gap-2 justify-self-end hover:text-ink lg:col-span-2 lg:inline-flex"
          aria-label="Scroll to content"
        >
          Scroll
          <span className="relative h-8 w-px overflow-hidden bg-line-strong">
            <span className="absolute inset-x-0 top-0 h-3 animate-[scroll-cue_1.8s_var(--ease-in-out-quart)_infinite] bg-ink" />
          </span>
          <Icon name="arrow-down" size={12} className="sr-only" />
        </a>
      </div>
    </section>
  );
}
