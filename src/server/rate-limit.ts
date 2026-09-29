import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/server/db";

/**
 * Fixed-window rate limiter backed by Postgres (works across instances).
 * A single atomic upsert either starts a new window or increments the
 * current one. Keys are SHA-256 hashed — no raw IPs or emails are stored.
 */
export async function rateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number; retryAfterSeconds: number }> {
  const key = createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
  const resetAt = new Date(Date.now() + windowMs);

  const rows = await db.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"
  `;

  const row = rows[0];
  const count = Number(row?.count ?? 1);
  const retryAfterSeconds = Math.max(0, Math.ceil(((row?.resetAt ?? resetAt).getTime() - Date.now()) / 1000));
  return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds };
}

/** Best-effort client address for rate limiting only (never persisted raw). */
export async function clientAddress(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}
