import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { db } from "@/server/db";

/**
 * Database-backed sessions.
 *
 * - The cookie holds a 256-bit random token; the database stores only its
 *   SHA-256 hash, so a leaked database cannot be replayed as cookies.
 * - Cookies are httpOnly, SameSite=Lax, Secure + __Host- prefixed in
 *   production. Server Actions add Origin checks on top (CSRF).
 * - Sessions are revocable server-side (logout, "sign out everywhere").
 */

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-pf_session" : "pf_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

export type SessionUser = { id: string; email: string; name: string; role: "ADMIN" };
export type Session = { id: string; user: SessionUser; expiresAt: Date };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Resolve the current session (memoised per request). */
export const getSession = cache(async (): Promise<Session | null> => {
  // Sessions are strictly request-time: never part of a prerender or prefetch.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      lastUsedAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Sliding activity timestamp, written at most hourly.
  if (now - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date(now) } }).catch(() => {});
  }

  return { id: session.id, user: session.user, expiresAt: session.expiresAt };
});

export async function deleteCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function deleteAllSessionsForUser(userId: string, exceptSessionId?: string): Promise<number> {
  const result = await db.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { NOT: { id: exceptSessionId } } : {}) },
  });
  return result.count;
}
