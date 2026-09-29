import type { Prisma } from "../../src/generated/prisma/client";

/**
 * Content that is NOT from the owner's CV:
 *
 * - ARTICLES are technical write-ups about how this platform works. They are
 *   accurate, but ghost-written — kept with `isSample: true` (visible
 *   "Sample" badge) until the owner reviews, edits or deletes them.
 * - EXPERIMENTS are the two interactive sketches shipped with this codebase.
 *
 * RETIRED lists placeholder rows from the first seed; they are deleted on the
 * next seed run (only while still flagged `isSample`).
 */

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

export type ArticleSeed = Omit<Prisma.BlogPostCreateInput, "readingMinutes" | "category" | "tags" | "projects"> & {
  category: string;
  tags: string[];
  projects?: string[];
};

export const ARTICLES: ArticleSeed[] = [
  {
    slug: "caching-a-cms-driven-site-with-cache-components",
    title: "Caching a CMS-driven site with Cache Components",
    excerpt:
      "How this site serves prerendered pages from a database, shows admin edits instantly, and publishes scheduled posts on time — without a rebuild.",
    status: "PUBLISHED",
    publishedAt: daysFromNow(-9),
    featured: true,
    category: "architecture",
    tags: ["nextjs", "caching", "performance"],
    projects: ["portfolio-platform"],
    content: `Every public page on this site is rendered from PostgreSQL, yet most of them are served as static HTML. The trick is to cache **data**, not pages — and to treat the admin dashboard as the only thing allowed to invalidate it.

## Three rules for the data layer

1. Public queries live in one place and return plain data-transfer objects.
2. Each query is cached with \`"use cache"\` and tagged by content type.
3. Mutations never touch caches directly — they call one helper that knows which tags depend on each other.

\`\`\`ts title="server/data/projects.ts"
export async function getPublishedProjects() {
  "use cache";
  cacheLife("days");
  cacheTag("projects");

  return db.project.findMany({ where: { published: true } });
}
\`\`\`

:::note[Why coarse tags?]
A portfolio has little content but many cross-links: a technology appears on projects, on the timeline and on the home page. Invalidating a whole content type is cheap here, and much harder to get wrong than per-row tags.
:::

## Read-your-writes in the admin

Server Actions call \`updateTag()\` rather than \`revalidateTag()\`. The difference matters for an editor: \`updateTag\` expires the entry *and* refreshes it within the same request, so the page you are redirected to already shows your change.

| API | Semantics | Used for |
| --- | --- | --- |
| \`updateTag\` | expire + refresh now | admin edits |
| \`revalidateTag\` | stale-while-revalidate | background jobs |

## Scheduled posts without cron

A post is *scheduled* when it is published with a future date. Instead of polling, the blog query computes its own lifetime: the cache expires exactly when the next scheduled post goes live.

\`\`\`ts
const seconds = (next.publishedAt - now) / 1000;
cacheLife({ stale: 300, revalidate: Math.max(60, seconds), expire: seconds + 3600 });
\`\`\`

Keeping \`expire\` above five minutes matters: shorter lifetimes turn the query into a dynamic hole that can't be prerendered.`,
  },
  {
    slug: "launching-external-projects-safely",
    title: "Launching external projects safely",
    excerpt:
      "The project portal never pretends a deployment lives here. It checks health and framing policy server-side — and refuses to fetch private addresses.",
    status: "PUBLISHED",
    publishedAt: daysFromNow(-4),
    category: "security",
    tags: ["security", "iframes", "ssrf"],
    projects: ["portfolio-platform"],
    content: `The portal is a launcher, not a host. Every project opens its **real** deployment — Vercel, Railway, a custom domain — in a new tab. An optional in-page preview exists, but only when the target explicitly allows being framed.

## Asking before framing

Browsers enforce two headers that forbid framing: \`X-Frame-Options\` and the \`frame-ancestors\` directive of \`Content-Security-Policy\`. A blocked iframe fails *silently* in most browsers, so the check happens on the server before the preview is offered.

\`\`\`ts title="server/portal/deployment-status.ts"
const xfo = response.headers["x-frame-options"];
const frameAncestors = /frame-ancestors\\s+([^;]*)/i.exec(csp)?.[1];
// Either one forbidding our origin → no "Open in Portal" button
\`\`\`

:::warning[Never trust stored URLs]
Even admin-provided URLs are untrusted input. A URL like \`http://169.254.169.254/\` points at cloud metadata services; fetching it from the server is a classic SSRF.
:::

## The SSRF guard

Every resolved address is checked **inside the socket's DNS lookup**, so the address that was validated is the address that gets connected to — DNS rebinding can't swap it afterwards. Loopback, private, link-local and carrier-grade NAT ranges are refused, and redirects are followed manually so each hop is re-validated.

\`\`\`architecture
[Visitor]  Launch page
[Server]   Status route, SSRF guard
[Internet] Deployment
Launch page -> Status route : GET status
Status route -> SSRF guard : resolve + validate
SSRF guard -> Deployment : HEAD / GET
\`\`\`

## Designing the failure state

When a deployment is down, the page says so plainly and offers the useful next steps: try again, read the case study, or open the repository.`,
  },
  {
    slug: "a-tiny-dsl-for-architecture-diagrams",
    title: "A tiny DSL for architecture diagrams",
    excerpt:
      "Diagrams as text: a forgiving parser, a deterministic layout, and an accessible SVG — shared by case studies and articles.",
    status: "PUBLISHED",
    publishedAt: daysFromNow(-1),
    category: "software-engineering",
    tags: ["dsl", "svg", "accessibility"],
    content: `Dragging boxes around a canvas is slow and hard to diff. Engineers already describe systems in text, so the diagrams on this site are text too.

\`\`\`text
[Client]   Web App (Next.js)
[Services] API (Spring Boot), Worker
[Data]     PostgreSQL

Web App -> API : REST
API ~> Worker : queue
API <-> PostgreSQL : SQL
\`\`\`

## A parser that never throws

The admin editor previews diagrams as you type, so the parser must tolerate half-written input. It returns a diagram **and** a list of line-numbered errors; the UI renders whatever is valid and lists the rest.

:::tip
Returning errors as data rather than throwing makes a parser composable: the same function powers the editor, the case-study page and the Markdown renderer.
:::

## Deterministic layout

Layers become rows, nodes are centred within each row, and edges are cubic Béziers between node edges. There is no force simulation, so a diagram renders identically on the server and client — no layout shift, no hydration mismatch.

## Accessible by construction

Each diagram ships with a text list of connections, and on narrow screens the list *is* the diagram. Interactive nodes are focusable, and focusing one highlights its neighbours — the same behaviour as hovering.`,
  },
];

export const EXPERIMENTS: Prisma.ExperimentCreateInput[] = [
  {
    slug: "signal-field",
    title: "Signal Field",
    summary: "A GPU flow field rendered as a topographic map that bends toward the pointer. WebGL with a 2D fallback.",
    description:
      "A full-screen fragment shader renders domain-warped noise as contour lines; the pointer injects a soft attractor. Colours come from the site's design tokens and follow the theme. Quality scales down on small screens, and the sketch pauses when off-screen or when reduced motion is requested.",
    status: "PLAYABLE",
    kind: "WEBGL",
    year: 2026,
    sketch: "signal-field",
    published: true,
    featured: true,
    order: 0,
    technologies: { connect: [{ slug: "threejs" }, { slug: "typescript" }] },
  },
  {
    slug: "variable-type-lab",
    title: "Variable Type Lab",
    summary: "Kinetic typography driven by pointer distance across variable-font axes.",
    description:
      "Each glyph maps pointer proximity to the weight and width axes of the display face — no canvas, just CSS custom properties, so the text stays selectable and accessible. Sliders set the resting axes and the lens radius.",
    status: "PLAYABLE",
    kind: "TYPOGRAPHY",
    year: 2026,
    sketch: "type-lab",
    published: true,
    order: 1,
    technologies: { connect: [{ slug: "typescript" }, { slug: "react" }] },
  },
];

export const RETIRED = {
  projects: ["status-board", "event-ingestion-service", "cli-toolkit", "generative-type-study"],
  posts: ["sessions-without-jwts", "notes-on-scrypt-parameters"],
  experiments: ["sonic-grid"],
};
