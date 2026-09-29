import "server-only";
import { updateTag } from "next/cache";

/**
 * Cache tags for the public data layer. Public queries are cached with
 * `"use cache"` + `cacheTag(TAG.x)`; admin mutations call `invalidate()` so
 * the next render reads fresh data (read-your-writes via `updateTag`).
 *
 * Tags are intentionally coarse: a portfolio has little content, and
 * cross-entity relations (a technology appears on projects, experience and
 * the home page) make fine-grained tags easy to get wrong.
 */
export const TAG = {
  settings: "settings",
  projects: "projects",
  posts: "posts",
  experience: "experience",
  technologies: "technologies",
  experiments: "experiments",
  media: "media",
} as const;

export type CacheTag = (typeof TAG)[keyof typeof TAG];

/** Content types that embed other entities and must be refreshed with them. */
const DEPENDENTS: Partial<Record<CacheTag, CacheTag[]>> = {
  technologies: ["projects", "experience", "experiments"],
  media: ["projects", "posts", "experiments", "settings"],
  projects: ["settings", "experience", "posts"],
};

export function invalidate(...tags: CacheTag[]): void {
  const all = new Set<CacheTag>();
  for (const tag of tags) {
    all.add(tag);
    for (const dependent of DEPENDENTS[tag] ?? []) all.add(dependent);
  }
  for (const tag of all) updateTag(tag);
}
