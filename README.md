# Portfolio Platform — Zayar Myo Oo

A CMS-driven software-engineering portfolio: case studies, a **project portal** that launches real
deployments, a technical blog, an experience timeline, an experiments lab and a protected admin
dashboard. Every public page renders from PostgreSQL — adding a project, article, job, technology or
experiment is a content change, not a code change.

- **Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
  PostgreSQL + Prisma 7 · Zod · Motion · React Three Fiber (lazy, experiments only)
- **Architecture & decisions:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Getting started

Requires **Node 22 LTS** (or 20.19+ / 24+). Prisma 7 does not install on Node 23 — see `.nvmrc`.

```bash
npm install
cp .env.example .env         # then set ADMIN_EMAIL / ADMIN_PASSWORD (12+ characters)
npm run db:start             # local PostgreSQL (embedded, no Docker) — keep it running
npm run db:migrate           # in a second terminal: apply migrations
npm run db:seed              # profile, experience, projects, sample articles
npm run dev                  # http://localhost:3000 (use --port if 3000 is taken)
```

Prefer Docker for the database? `docker compose up -d` uses the same credentials and port.

Sign in at **/admin** with the account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` / `build` / `start` | Next.js development, production build, production server |
| `lint` / `typecheck` | ESLint (incl. React Compiler hook rules) and `tsc --noEmit` |
| `db:start` | Embedded PostgreSQL 18 in `.data/postgres` |
| `db:migrate` / `db:deploy` | Create/apply migrations (dev) · apply migrations (production) |
| `db:seed` | Idempotent seed — never overwrites content edited in the CMS |
| `db:studio` | Prisma Studio |

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Absolute origin for canonical URLs, sitemap, OG, JSON-LD |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for seeding | The seed upserts this admin account |
| `MEDIA_STORAGE` | no | `filesystem` (default locally) or `database` (default on Vercel) |
| `UPLOAD_DIR` | no | Directory for the filesystem driver (default `.data/uploads`) |
| `ADMIN_RESET_PASSWORD` | no | `1` for one seed run to reset the admin password from env |

## Content

Everything is edited in **/admin**:

| Area | What it controls |
| --- | --- |
| Settings | Name, role, hero headline & statement, availability, timezone, socials, About page, SEO defaults |
| Projects | Cards, case studies (12 optional Markdown sections, features, highlights, architecture diagram), media, links |
| Portal | Visibility, featured flag, embedded-preview opt-in and ordering (optimistic, keyboard-accessible) |
| Blog | Markdown articles, categories, tags, cover, related projects, drafts and **scheduled** publishing |
| Experience | Timeline entries: roles and education, responsibilities, achievements, technologies, projects |
| Technologies | Category, proficiency *category* (never percentages), “since” year; usage counts are derived |
| Experiments | Lab entries; attach a built-in interactive sketch (`signal-field`, `type-lab`) |
| Media | Uploads (type-checked by content), alt text, usage counts |
| Messages / Analytics | Contact-form inbox · privacy-preserving event counts |

Rows seeded as placeholders carry a visible **Sample** badge; *Dashboard → Remove sample content*
deletes whatever is still flagged.

### Markdown vocabulary (articles and case-study sections)

````md
:::note[Optional title]            callouts: note · tip · warning · important
Text
:::

```ts title="server/data.ts"       code with filename, syntax-highlighted (light/dark)
```

```architecture                    interactive-style system diagram (see below)
[Client]   Web App (Next.js)
[Services] API (Spring Boot), Worker
[Data]     PostgreSQL
Web App -> API : REST
API ~> Worker : queue               ~> async (dashed) · <-> bidirectional
```

![Alt text](/media/… "Caption")    figure with caption
````

Raw HTML in Markdown is dropped and everything is sanitised before rendering.

## Deployment

Free hosting on **Vercel (Hobby) + Neon (Free Postgres)** — step by step in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). On Vercel, uploads are stored in the database
(`MEDIA_STORAGE=database`), and each build runs migrations and the idempotent seed automatically
(`npm run vercel-build`). Self-hosting on any Node 22 host with a persistent disk also works.

## Project structure

```
prisma/                 schema, migrations, seed + seed data (prisma/data/*)
src/app/(site)/         public routes (home, projects, portal, blog, experience, about, experiments, contact)
src/app/admin/          login + protected CMS ((panel) layout guards every page)
src/app/api/            analytics sink, portal deployment-status checks
src/app/media/          uploaded media (validated keys, immutable caching, Range support)
src/components/         UI primitives, site chrome, feature components, admin kit
src/server/             data layer ("use cache"), auth, actions, markdown, storage, SSRF-safe requests
src/lib/                isomorphic utilities: architecture DSL, portal filtering, URL safety, types
```
