#!/usr/bin/env node
/**
 * Local PostgreSQL for development — no Docker or system install required.
 *
 * Uses `embedded-postgres`, which ships real PostgreSQL binaries per platform.
 * Data persists in ./.data/postgres. Keep this process running while you
 * develop (`npm run db:start`), and stop it with Ctrl+C.
 *
 * Prefer Docker? `docker compose up -d` uses the same credentials and port.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const DATABASE_DIR = path.resolve(".data/postgres");
const PORT = Number(process.env.DEV_DB_PORT ?? 54329);
const USER = "portfolio";
const PASSWORD = "portfolio";
const DATABASE = "portfolio";

const pg = new EmbeddedPostgres({
  databaseDir: DATABASE_DIR,
  port: PORT,
  user: USER,
  password: PASSWORD,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error("[postgres]", message),
});

async function main() {
  const firstRun = !existsSync(path.join(DATABASE_DIR, "PG_VERSION"));
  if (firstRun) {
    console.log("Initialising a new PostgreSQL cluster in .data/postgres …");
    await pg.initialise();
  }

  await pg.start();

  if (firstRun) {
    await pg.createDatabase(DATABASE);
  }

  console.log(
    `PostgreSQL ready → postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}`,
  );
}

async function shutdown() {
  console.log("\nStopping PostgreSQL …");
  await pg.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(async (error) => {
  console.error(error);
  await pg.stop().catch(() => {});
  process.exit(1);
});

// Keep the process alive; the cluster stops when this script exits.
setInterval(() => {}, 1 << 30);
