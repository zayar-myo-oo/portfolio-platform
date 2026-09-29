# Deploying for free — Vercel + Neon

The frontend and backend are one Next.js app, so there is a single deployment. Everything below fits the
free tiers: **Vercel Hobby** (app, CDN, image optimisation) and **Neon Free** (PostgreSQL), connected from
the Vercel dashboard. Uploaded media is stored in the database on Vercel (`MEDIA_STORAGE=database` is the
default there), so no extra storage service is needed.

## One-time setup

1. **Push the code to GitHub** (a private repository is fine).
2. **Import it in Vercel:** <https://vercel.com/new> → select the repository → *Deploy*.
   The first build stops with *“DATABASE_URL is missing”* — that's expected.
3. **Add the database:** Project → **Storage** → *Create Database* → **Neon** → Free plan → connect it to
   the project (all environments). This injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
4. **Add environment variables:** Project → **Settings → Environment Variables**:

   | Name | Value |
   | --- | --- |
   | `ADMIN_EMAIL` | the email you'll sign in with |
   | `ADMIN_PASSWORD` | a long, unique password (12+ characters) |
   | `NEXT_PUBLIC_SITE_URL` | optional — your final URL, e.g. `https://your-name.vercel.app` or a custom domain |

5. **Redeploy:** Deployments → ⋯ → *Redeploy*.

Each build runs `scripts/check-deploy-env.mjs → prisma migrate deploy → prisma db seed → next build`.
Migrations apply automatically; the seed is idempotent (it creates your profile, experience, projects and
sample articles once, and never overwrites anything edited in the CMS).

## After the first deploy

- Sign in at `/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then change the password in **Admin → Profile**
  if you like — later deploys won't reset it (set `ADMIN_RESET_PASSWORD=1` for one deploy to force a reset).
- Every `git push` to the default branch redeploys; pull requests get preview URLs.
- A custom domain can be added under Project → Settings → Domains (free on Hobby; the domain itself isn't).

## Limits worth knowing

| Area | Limit | Notes |
| --- | --- | --- |
| Uploads | 4 MB per file | Vercel caps request bodies at ~4.5 MB. Export WebP images / short MP4s. |
| Database | Neon Free storage quota | Media bytes live in Postgres; portfolio screenshots are small. Move to S3/R2 if you outgrow it (add a driver in `src/server/storage.ts`). |
| Cold starts | Neon scales to zero when idle | The first request after inactivity is slightly slower. |
| Usage | Vercel Hobby is for personal, non-commercial use | A personal portfolio qualifies. |

## Self-hosting instead

Any Node 22 host with a persistent disk works: set `DATABASE_URL`, run `npm run db:deploy`,
`npm run db:seed`, `npm run build`, `npm run start`. Uploads default to the filesystem (`UPLOAD_DIR`).
