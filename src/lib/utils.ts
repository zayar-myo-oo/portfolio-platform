/** Join class names, skipping falsy values. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Zero-padded index label used across the editorial layout: 1 → "01". */
export function indexLabel(index: number, width = 2): string {
  return String(index).padStart(width, "0");
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const monthYearFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  return dateFormatter.format(new Date(value));
}

export function formatMonthYear(value: Date | string | null | undefined): string {
  if (!value) return "";
  return monthYearFormatter.format(new Date(value));
}

export function toIsoDate(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

/** Duration between two dates as "2 yrs 3 mos" (end defaults to `now`). */
export function formatDuration(start: Date, end: Date | null, now: Date): string {
  const to = end ?? now;
  let months =
    (to.getUTCFullYear() - start.getUTCFullYear()) * 12 + (to.getUTCMonth() - start.getUTCMonth()) + 1;
  months = Math.max(1, months);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (rest) parts.push(`${rest} mo${rest === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/** Deterministic 32-bit FNV-1a hash — used for generative covers. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Small seeded PRNG (mulberry32) for deterministic visuals. */
export function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, (block) => " ".repeat(Math.ceil(block.length / 12)))
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}
