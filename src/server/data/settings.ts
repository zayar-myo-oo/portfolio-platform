import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAG } from "@/server/cache";
import { renderMarkdown } from "@/server/markdown/render";
import { journeySchema, parseJsonList, principleSchema, socialSchema } from "@/lib/json-fields";
import type { SiteSettings } from "@/lib/types";
import { mediaSelect, toMedia } from "./mappers";

/** Used only when the settings row has not been created yet (fresh database). */
const FALLBACK: Omit<SiteSettings, "aboutIntroHtml" | "philosophyHtml"> = {
  ownerName: "Your Name",
  role: "Software Engineer",
  headline: ["Software", "engineer."],
  statement: "Configure this site from the admin dashboard.",
  currentFocus: null,
  currentlyBuilding: null,
  currentlyBuildingProject: null,
  location: null,
  timezone: "UTC",
  isAvailable: false,
  availability: null,
  email: null,
  githubUsername: null,
  socials: [],
  resumeUrl: null,
  principles: [],
  interests: [],
  likesBuilding: [],
  journey: [],
  portrait: null,
  siteTitle: "Portfolio",
  siteDescription: "Software engineering portfolio.",
  ogImage: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag(TAG.settings);

  const row = await db.siteSetting.findUnique({
    where: { id: "site" },
    include: {
      portrait: { select: mediaSelect },
      ogImage: { select: mediaSelect },
      currentlyBuildingProject: {
        select: { slug: true, title: true, year: true, status: true, updatedAt: true, published: true },
      },
    },
  });

  if (!row) return { ...FALLBACK, aboutIntroHtml: "", philosophyHtml: "" };

  const [intro, philosophy] = await Promise.all([renderMarkdown(row.aboutIntro), renderMarkdown(row.philosophy)]);
  const project = row.currentlyBuildingProject;

  return {
    ownerName: row.ownerName,
    role: row.role,
    headline: row.headline.length ? row.headline : FALLBACK.headline,
    statement: row.statement,
    currentFocus: row.currentFocus,
    currentlyBuilding: row.currentlyBuilding,
    currentlyBuildingProject:
      project && project.published
        ? { slug: project.slug, title: project.title, year: project.year, status: project.status, updatedAt: project.updatedAt }
        : null,
    location: row.location,
    timezone: row.timezone,
    isAvailable: row.isAvailable,
    availability: row.availability,
    email: row.email,
    githubUsername: row.githubUsername,
    socials: parseJsonList(socialSchema, row.socials),
    resumeUrl: row.resumeUrl,
    aboutIntroHtml: intro.html,
    philosophyHtml: philosophy.html,
    principles: parseJsonList(principleSchema, row.principles),
    interests: row.interests,
    likesBuilding: row.likesBuilding,
    journey: parseJsonList(journeySchema, row.journey),
    portrait: toMedia(row.portrait),
    siteTitle: row.siteTitle,
    siteDescription: row.siteDescription,
    ogImage: toMedia(row.ogImage),
  };
}
