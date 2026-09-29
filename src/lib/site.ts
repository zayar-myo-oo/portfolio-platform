/** Absolute site origin for canonical URLs, sitemap, OG and JSON-LD. */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export const PUBLIC_NAV = [
  { href: "/projects", label: "Work", index: "01" },
  { href: "/portal", label: "Portal", index: "02" },
  { href: "/blog", label: "Notes", index: "03" },
  { href: "/about", label: "About", index: "04" },
  { href: "/experiments", label: "Lab", index: "05" },
] as const;

export const SECONDARY_NAV = [
  { href: "/experience", label: "Experience" },
  { href: "/contact", label: "Contact" },
] as const;
