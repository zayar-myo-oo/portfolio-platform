import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import { RelativeTime } from "@/components/ui/relative-time";
import type { ExperienceItem, GithubActivity, PostCard, ProjectCard, SiteSettings, TechnologyItem } from "@/lib/types";
import { cn, formatDate, pluralize } from "@/lib/utils";
import { FeaturedPreview } from "./featured-preview";
import { GithubHeatmap } from "./github-heatmap";
import { LocalTimeCard } from "./local-time-card";
import { TechConstellation } from "./tech-constellation";

/**
 * Home dashboard. A bento grid where each tile has its own behaviour —
 * preview switching, timeline, relationship highlighting, heatmap, clock —
 * rather than N identical cards. Tiles hide themselves when their data is
 * missing, and the grid is written so any subset still packs cleanly.
 */

function Tile({
  children,
  className,
  label,
  index,
  href,
  inverted,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  index: number;
  href?: string;
  inverted?: boolean;
}) {
  return (
    <Reveal
      index={index}
      className={cn(
        "group/tile relative flex min-h-56 flex-col overflow-hidden rounded-lg border p-5 sm:p-6",
        inverted ? "border-transparent bg-surface-inverse text-ink-inverse" : "border-line bg-surface",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className={cn("label", inverted && "text-ink-inverse/60")}>{label}</span>
        {href ? (
          <Link
            href={href}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full border transition-all duration-300 group-hover/tile:rotate-[-45deg]",
              inverted ? "border-ink-inverse/25 text-ink-inverse" : "border-line text-ink-2",
            )}
            aria-label={`Open ${label}`}
          >
            <Icon name="arrow-right" size={13} />
          </Link>
        ) : null}
      </div>
      {children}
    </Reveal>
  );
}

export function HomeBento({
  settings,
  featured,
  stats,
  experience,
  technologies,
  latestPost,
  github,
  career,
}: {
  settings: SiteSettings;
  featured: ProjectCard[];
  stats: { projects: number; live: number };
  experience: ExperienceItem[];
  technologies: TechnologyItem[];
  latestPost: PostCard | null;
  github: GithubActivity | null;
  career: { years: number | null; roles: number; since: number | null };
}) {
  const building = settings.currentlyBuildingProject;
  let index = 0;

  return (
    <div className="grid auto-rows-auto grid-cols-1 gap-3 md:grid-cols-6 lg:grid-cols-12">
      {featured.length ? (
        <Tile label="Selected project" index={index++} href="/projects" className="md:col-span-6 lg:col-span-8 lg:row-span-2">
          <FeaturedPreview projects={featured} />
        </Tile>
      ) : null}

      {settings.currentlyBuilding || building ? (
        <Tile label="Currently building" index={index++} className="md:col-span-3 lg:col-span-4">
          <div className="mt-auto">
            <div className="mb-4 flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              <span className="font-mono text-2xs tracking-[0.1em] text-accent-ink uppercase">In progress</span>
            </div>
            {building ? (
              <Link href={`/projects/${building.slug}`} className="group/link block">
                <p className="display text-3xl transition-colors group-hover/link:text-accent-ink">{building.title}</p>
              </Link>
            ) : (
              <p className="display text-3xl">{settings.currentlyBuilding}</p>
            )}
            {settings.currentFocus ? <p className="mt-2 text-sm text-ink-2">{settings.currentFocus}</p> : null}
            {building ? (
              <p className="label mt-4">
                Updated <RelativeTime date={building.updatedAt} className="text-ink-2" />
              </p>
            ) : null}
          </div>
        </Tile>
      ) : null}

      {experience.length ? (
        <Tile label="Experience" index={index++} href="/experience" className="md:col-span-3 lg:col-span-4">
          <ol className="relative mt-auto space-y-4 pl-5">
            <span
              aria-hidden
              className="absolute top-1.5 bottom-1.5 left-[3px] w-px origin-top bg-line-strong transition-transform duration-1000 ease-[var(--ease-out-expo)] in-data-[reveal=pending]:scale-y-0"
            />
            {experience.slice(0, 3).map((item) => (
              <li key={item.id} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1.5 -left-5 size-[7px] rounded-full border",
                    item.endDate ? "border-line-strong bg-surface" : "border-accent bg-accent",
                  )}
                />
                <p className="text-sm font-medium">{item.role}</p>
                <p className="text-sm text-ink-2">
                  {item.company}
                  <span className="text-ink-3">
                    {" "}
                    · {item.startDate.getUTCFullYear()}–{item.endDate ? item.endDate.getUTCFullYear() : "now"}
                  </span>
                </p>
              </li>
            ))}
          </ol>
        </Tile>
      ) : null}

      {technologies.length ? (
        <Tile label="Stack · hover to see relationships" index={index++} href="/about#stack" className="md:col-span-6 lg:col-span-5">
          <TechConstellation technologies={technologies.slice(0, 14)} />
        </Tile>
      ) : null}

      {latestPost ? (
        <Tile label="Latest note" index={index++} href="/blog" className="md:col-span-3 lg:col-span-4">
          <Link href={`/blog/${latestPost.slug}`} className="group/link mt-auto block" data-cursor="read">
            {latestPost.category ? <p className="label mb-3 text-accent-ink">{latestPost.category.name}</p> : null}
            <p className="font-serif text-2xl leading-snug tracking-tight text-balance transition-colors group-hover/link:text-accent-ink">
              {latestPost.title}
            </p>
            <p className="label mt-4">
              {formatDate(latestPost.publishedAt)} · {latestPost.readingMinutes} min read
            </p>
          </Link>
        </Tile>
      ) : null}

      <Tile label={career.years !== null ? "Career" : "Output"} index={index++} className="md:col-span-3 lg:col-span-3">
        <div className="mt-auto">
          {career.years !== null ? (
            <>
              <p className="display text-7xl leading-none tabular-nums">
                {career.years}
                <span className="text-accent">+</span>
              </p>
              <p className="mt-3 text-sm text-ink-2">
                years building software{career.since ? ` · since ${career.since}` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="display text-7xl leading-none tabular-nums">{stats.projects}</p>
              <p className="mt-3 text-sm text-ink-2">projects in the archive</p>
            </>
          )}
        </div>
      </Tile>

      {github ? (
        <Tile label="GitHub · last 12 weeks" index={index++} className="md:col-span-6 lg:col-span-6">
          <GithubHeatmap activity={github} />
        </Tile>
      ) : null}

      <Tile label="Local time" index={index++} className="md:col-span-3 lg:col-span-3">
        <LocalTimeCard timezone={settings.timezone} location={settings.location} availability={settings.isAvailable ? settings.availability : null} />
      </Tile>

      <Tile label="Project portal" index={index++} inverted className={cn("md:col-span-3", github ? "lg:col-span-3" : "lg:col-span-9")}>
        <Link href="/portal" className="group/link mt-auto block" data-cursor="view">
          <p className="display text-4xl leading-[0.95]">
            Enter the
            <br />
            portal
            <Icon
              name="arrow-up-right"
              size={30}
              className="ml-2 inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/link:translate-x-1 group-hover/link:-translate-y-1"
            />
          </p>
          <p className="mt-4 font-mono text-2xs tracking-[0.1em] text-ink-inverse/60 uppercase">
            {pluralize(stats.projects, "project")} · <span className="text-live">{stats.live} live</span>
          </p>
        </Link>
      </Tile>
    </div>
  );
}
