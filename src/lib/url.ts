/**
 * URL helpers. Every URL that reaches the UI or a server-side fetch goes
 * through `parseHttpUrl` — only absolute http(s) URLs without embedded
 * credentials are accepted.
 */

export function parseHttpUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (!url.hostname) return null;
  return url;
}

export function isHttpUrl(value: string | null | undefined): boolean {
  return parseHttpUrl(value) !== null;
}

/** "https://www.example.com/path" → "example.com/path" */
export function displayUrl(value: string): string {
  const url = parseHttpUrl(value);
  if (!url) return value;
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.hostname.replace(/^www\./, "")}${path}`;
}

export function hostOf(value: string | null | undefined): string | null {
  return parseHttpUrl(value)?.hostname.replace(/^www\./, "") ?? null;
}

export type HostingProvider = {
  key: string;
  name: string;
};

const PROVIDERS: Array<{ test: RegExp; key: string; name: string }> = [
  { test: /\.vercel\.app$/, key: "vercel", name: "Vercel" },
  { test: /\.netlify\.app$/, key: "netlify", name: "Netlify" },
  { test: /\.pages\.dev$|\.workers\.dev$/, key: "cloudflare", name: "Cloudflare" },
  { test: /\.up\.railway\.app$|\.railway\.app$/, key: "railway", name: "Railway" },
  { test: /\.onrender\.com$/, key: "render", name: "Render" },
  { test: /\.fly\.dev$/, key: "fly", name: "Fly.io" },
  { test: /\.github\.io$/, key: "github-pages", name: "GitHub Pages" },
  { test: /\.herokuapp\.com$/, key: "heroku", name: "Heroku" },
  { test: /\.amplifyapp\.com$|\.cloudfront\.net$|\.amazonaws\.com$/, key: "aws", name: "AWS" },
  { test: /\.azurewebsites\.net$|\.azurestaticapps\.net$/, key: "azure", name: "Azure" },
  { test: /\.web\.app$|\.firebaseapp\.com$/, key: "firebase", name: "Firebase" },
];

/** Best-effort hosting detection from a deployment URL; manual override wins. */
export function detectHosting(liveUrl: string | null | undefined, override?: string | null): HostingProvider | null {
  if (override?.trim()) {
    return { key: override.trim().toLowerCase().replace(/\s+/g, "-"), name: override.trim() };
  }
  const url = parseHttpUrl(liveUrl);
  if (!url) return null;
  const match = PROVIDERS.find((provider) => provider.test.test(url.hostname));
  return match ? { key: match.key, name: match.name } : { key: "custom", name: "Custom domain" };
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
