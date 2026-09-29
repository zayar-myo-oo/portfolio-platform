#!/usr/bin/env node
/**
 * Runs first in `vercel-build`. Fails fast with an actionable message instead
 * of a cryptic Prisma/Next error when the database isn't connected yet.
 */
const problems = [];

if (!process.env.DATABASE_URL) {
  problems.push(
    "DATABASE_URL is missing. In Vercel: Project → Storage → Create Database → Neon (free) → connect it to this project, then redeploy.",
  );
}
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.warn(
    "⚠ ADMIN_EMAIL / ADMIN_PASSWORD are not set — the site will deploy, but no admin account is created. Add them in Project → Settings → Environment Variables and redeploy.",
  );
} else if (process.env.ADMIN_PASSWORD.length < 12) {
  problems.push("ADMIN_PASSWORD must be at least 12 characters.");
}

if (problems.length) {
  console.error(`\n✖ Deployment configuration incomplete:\n  - ${problems.join("\n  - ")}\n`);
  process.exit(1);
}
console.log("✓ Deployment environment looks good.");
