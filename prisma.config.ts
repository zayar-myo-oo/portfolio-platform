import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Migrations need a direct (non-pooled) connection. Neon on Vercel provides
 * DATABASE_URL (pooled, used by the app at runtime) and DATABASE_URL_UNPOOLED;
 * locally they are the same database. The URL is optional here so that
 * `prisma generate` (postinstall) works on machines without a database.
 */
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(url ? { datasource: { url } } : {}),
});
