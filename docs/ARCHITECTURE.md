# Architecture

This document records how the platform is put together and **why**. It is the reference for anyone
(human or agent) changing the system.

## 1. Principles

1. **Content lives in the database.** UI components never contain content arrays. Public pages read a
   cached data layer; the admin CMS is the only writer.
2. **Server first.** Pages are React Server Components. Client components are islands for genuine
   interaction (portal filtering, timeline, cursor, editors, sketches).
3. **Honest launching.** The portal opens real deployments at their real addresses. An in-page preview
   is offered only when the owner allows it *and* the target's headers permit framing.
4. **Security by construction.** Every write path validates with Zod and authorises through a Data Access
   Layer; untrusted URLs are fetched only through an SSRF-safe client; rendered Markdown is sanitised.
5. **Motion with a purpose.** Every animation communicates hierarchy, state or continuity, and all of it
   yields to `prefers-reduced-motion`.

## 2. Data flow

```
PostgreSQL ──Prisma 7──▶ src/server/data/*  ("use cache" + cacheTag)  ──▶ Server Components ──▶ HTML
     ▲                                                   ▲
     │                                                   │ updateTag(tag) — read-your-writes
     └──── src/server/actions/admin/*  (requireAdmin → Zod → write) ◀── /admin forms
```

- **Cache Components** (`cacheComponents: true`) prerender public pages into static HTML. Data functions
  use `"use cache"`, a `cacheLife` profile and coarse tags (`projects`, `posts`, `settings`…).
- `src/server/cache.ts#invalidate()` knows dependent tags (a technology change refreshes projects,
  experience and experiments) and calls `updateTag`, so an editor sees their change on the next render.
- **Scheduled posts:** blog queries compute their own lifetime — the cache expires when the next
  scheduled post goes live (`expire` is kept ≥ 5 min so pages stay prerenderable).
- Dynamic routes use `generateStaticParams` for known slugs and await `params` inside `<Suspense>`, so
  new content added in the CMS renders on first request without a rebuild.
- DTOs (`src/lib/types.ts`) decouple UI from Prisma models and prevent leaking drafts or internal fields.

## 3. Routes

| Area | Routes |
| --- | --- |
| Public | `/`, `/projects`, `/projects/[slug]`, `/portal`, `/portal/[slug]`, `/blog`, `/blog/[slug]`, `/blog/feed.xml`, `/experience`, `/about`, `/experiments`, `/experiments/[slug]`, `/contact` |
| SEO | `/sitemap.xml`, `/robots.txt`, generated `opengraph-image` for site, projects and articles, JSON-LD (Person, WebSite, BlogPosting, SoftwareSourceCode/CreativeWork, BreadcrumbList) |
| Admin | `/admin/login`; `/admin` dashboard, projects, portal, blog, experience, technologies, experiments, media, messages, analytics, settings, profile |
| API | `POST /api/events` (analytics), `GET /api/portal/[slug]/status` (health + framing), `GET /media/[...key]` |

## 4. Content model

`SiteSetting` (singleton) · `Project` (+ `ProjectTechnology`, `ProjectLink`, `ProjectMedia`) ·
`Technology` · `Experience` · `BlogPost` (+ `Category`, `Tag`) · `Experiment` · `Media` ·
`ContactMessage` · `AnalyticsEvent` · `User` / `Session` / `RateLimit`.

- Case studies are twelve optional Markdown sections; empty ones are hidden, numbering adapts.
- **Technology proficiency is a category**, and "used in N projects" plus "often used with" are derived
  from project links — no self-reported percentages.
- `isSample` marks seeded placeholders: visibly badged, purgeable in one action, cleared when edited.

## 5. Authentication & authorisation

- Single-owner CMS with **database sessions**: 256-bit random token in an httpOnly, SameSite=Lax cookie
  (`__Host-` + Secure in production); only its SHA-256 hash is stored, so sessions are revocable and a
  leaked database can't be replayed. Password change signs out other sessions.
- Passwords: Node's built-in **scrypt** (N=2¹⁵). Unknown accounts still run the KDF (no timing oracle).
- Login is rate-limited per address and per account (atomic Postgres upsert, hashed keys).
- `src/proxy.ts` is only an optimistic redirect. The security boundary is `requireAdmin()` in **every**
  admin page and Server Action. Server Actions also get Next's Origin check (CSRF).
- Why not Auth.js? No OAuth is needed; v5 is still beta; DB sessions give instant revocation with ~150
  lines of auditable code.

## 6. Rich content: Markdown, not MDX

Database-stored MDX compiles to JavaScript that runs on the server — a code-execution path if the admin
account were ever compromised. Articles use Markdown with a fixed vocabulary instead:

`remark-parse → gfm → directives → remark-rehype (raw HTML dropped) → rehype-sanitize → slug →
architecture diagrams → Shiki (dual theme) → code figures → figures/lazy images → safe external links → TOC`

Sanitising happens *before* trusted structure is added, and author-controlled `id`/`name` attributes are
never kept (heading ids come from `rehype-slug`).

## 7. The project portal

- `/portal` ships one cached dataset; search, category chips (with live counts), status filter, sort and
  grid / index / spatial views run client-side with URL-synced state. Layout reflow uses Motion.
- `/portal/[slug]` is a launch console. `GET /api/portal/[slug]/status` checks only URLs stored on
  published projects (never a URL from the request):
  - `src/server/net/safe-request.ts` validates every resolved address **inside the socket's DNS lookup**
    (defeats DNS rebinding), refuses private/loopback/link-local/CGNAT/documentation ranges, follows
    redirects manually with re-validation, and never reads bodies.
  - Framing is decided from `X-Frame-Options` and CSP `frame-ancestors` (plus mixed-content), then gated by
    the owner's `allowEmbed` flag. Previews run in a sandboxed iframe with a slow-load fallback.
- Offline deployments get an explicit "currently unavailable" state with retry / case study / repository.

## 8. Design system

- Tokens are CSS variables in `src/app/globals.css`, re-defined for dark mode (graphite layers, not an
  inversion) and mapped to Tailwind with `@theme inline`. Motion, radius, type scale, z-index and layout
  tokens live alongside.
- Type: Bricolage Grotesque (variable display: opsz/wdth/wght), Newsreader (long-form reading),
  JetBrains Mono (technical labels, code).
- Theme: `system → light → dark`, applied before paint by an inline script.

## 9. Motion & 3D

| Where | Technique |
| --- | --- |
| Page transitions | React `<ViewTransition>` (fade + rise); header anchored; covers morph list → detail |
| Scroll reveals | IntersectionObserver; content visible by default, only below-the-fold elements are hidden first |
| Hero | Kinetic variable-font headline (pointer lens) + CSS-3D "exploded stack" of real technologies |
| Portal | Motion layout animations; spatial view bends a native scroll-snap shelf in 3D |
| Experiments | React Three Fiber shader (lazy, DPR-capped, paused off-screen, WebGL detection + 2D fallback) |
| Cursor | Contextual label next to the native cursor (fine pointers only) |

Reduced motion disables animation, parallax and 3D motion; the content is identical.

## 10. Privacy-preserving analytics

`AnalyticsEvent` stores event type, path, entity and referring **host** only — no IPs, user agents,
cookies or visitor identifiers. Portal searches are only recorded when the query matches a known
technology or project type (never free text).

## 11. Operational notes

- Local dev database: `embedded-postgres` (`npm run db:start`) or `docker compose up -d`.
- Uploads use the local filesystem; replace `src/server/storage.ts` with S3/R2 for serverless hosting.
- Security headers (CSP without nonces to keep pages static, XFO DENY, nosniff, Referrer-Policy,
  Permissions-Policy, COOP, HSTS in production) are set in `next.config.ts`.
