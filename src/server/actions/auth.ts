"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDummyHash, verifyPassword } from "@/server/auth/password";
import { createSession, deleteCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { clientAddress, rateLimit } from "@/server/rate-limit";

export type LoginState = { error?: string; email?: string };

const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

/** Only same-site admin paths are valid post-login destinations (no open redirects). */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return /^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your email and password.", email };

  const address = await clientAddress();
  const [byAddress, byAccount] = await Promise.all([
    rateLimit("login-ip", address, 20, 15 * 60_000),
    rateLimit("login-account", email, 6, 15 * 60_000),
  ]);
  if (!byAddress.ok || !byAccount.ok) {
    const minutes = Math.ceil(Math.max(byAddress.retryAfterSeconds, byAccount.retryAfterSeconds) / 60);
    return { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, email };
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  // Always run the KDF so response time doesn't reveal whether the account exists.
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) return { error: "Incorrect email or password.", email };

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  await deleteCurrentSession();
  redirect("/admin/login");
}
