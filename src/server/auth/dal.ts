import "server-only";
import { redirect } from "next/navigation";
import { getSession, type Session } from "./session";

/**
 * Data Access Layer guard. This — not the proxy — is the security boundary:
 * every admin page, Server Action and admin route handler calls it.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return session;
}

/** For route handlers: returns null instead of redirecting. */
export async function getAdminOrNull(): Promise<Session | null> {
  const session = await getSession();
  return session?.user.role === "ADMIN" ? session : null;
}
