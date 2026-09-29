"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/dal";
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "@/server/auth/password";
import { deleteAllSessionsForUser } from "@/server/auth/session";
import { invalidate, TAG } from "@/server/cache";
import { db } from "@/server/db";
import { bool, invalid, json, list, optStr, optionalText, optionalUrl, requiredText, str, type ActionState } from "@/server/admin/form";
import { journeySchema, principleSchema, socialSchema } from "@/lib/json-fields";

// ── Site settings ──────────────────────────────────────────────────────────

const settingsSchema = z.object({
  ownerName: requiredText(80),
  role: requiredText(80),
  headline: z.array(z.string().max(40)).min(1, "Add at least one headline line.").max(5),
  statement: requiredText(500),
  currentFocus: optionalText(120),
  currentlyBuilding: optionalText(120),
  currentlyBuildingProjectId: z.string().nullable(),
  location: optionalText(80),
  timezone: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Use an IANA timezone like Asia/Yangon."),
  isAvailable: z.boolean(),
  availability: optionalText(80),
  email: z.email().nullable(),
  githubUsername: z.string().regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, "Not a valid GitHub username.").nullable(),
  resumeUrl: optionalUrl,
  socials: z.array(socialSchema).max(10),
  aboutIntro: optionalText(10_000),
  philosophy: optionalText(10_000),
  principles: z.array(principleSchema).max(12),
  interests: z.array(z.string().max(60)).max(20),
  likesBuilding: z.array(z.string().max(80)).max(12),
  journey: z.array(journeySchema).max(20),
  portraitId: z.string().nullable(),
  ogImageId: z.string().nullable(),
  siteTitle: requiredText(80),
  siteDescription: requiredText(300),
});

export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    ownerName: str(formData, "ownerName"),
    role: str(formData, "role"),
    headline: list(formData, "headline"),
    statement: str(formData, "statement"),
    currentFocus: optStr(formData, "currentFocus"),
    currentlyBuilding: optStr(formData, "currentlyBuilding"),
    currentlyBuildingProjectId: optStr(formData, "currentlyBuildingProjectId"),
    location: optStr(formData, "location"),
    timezone: str(formData, "timezone") || "UTC",
    isAvailable: bool(formData, "isAvailable"),
    availability: optStr(formData, "availability"),
    email: optStr(formData, "email"),
    githubUsername: optStr(formData, "githubUsername"),
    resumeUrl: optStr(formData, "resumeUrl"),
    socials: json(formData, "socials"),
    aboutIntro: optStr(formData, "aboutIntro"),
    philosophy: optStr(formData, "philosophy"),
    principles: json(formData, "principles"),
    interests: list(formData, "interests"),
    likesBuilding: list(formData, "likesBuilding"),
    journey: json(formData, "journey"),
    portraitId: optStr(formData, "portraitId"),
    ogImageId: optStr(formData, "ogImageId"),
    siteTitle: str(formData, "siteTitle"),
    siteDescription: str(formData, "siteDescription"),
  });
  if (!parsed.success) return invalid(parsed.error);

  await db.siteSetting.upsert({ where: { id: "site" }, create: { id: "site", ...parsed.data }, update: parsed.data });
  invalidate(TAG.settings);
  return { status: "success", message: "Settings saved — every page is updated." };
}

// ── Profile & security ─────────────────────────────────────────────────────

const profileSchema = z.object({ name: requiredText(80), email: z.email().max(200) });

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = profileSchema.safeParse({ name: str(formData, "name"), email: str(formData, "email").toLowerCase() });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await db.user.update({ where: { id: session.user.id }, data: parsed.data });
  } catch {
    return { status: "error", message: "That email is already in use.", errors: { email: "That email is already in use." } };
  }
  return { status: "success", message: "Profile updated." };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`).max(200),
    confirm: z.string(),
  })
  .refine((data) => data.next === data.confirm, { path: ["confirm"], message: "Passwords don't match." });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = passwordSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("next") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return invalid(parsed.error);

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { status: "error", message: "Current password is incorrect.", errors: { current: "Current password is incorrect." } };
  }
  await db.user.update({ where: { id: session.user.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  // A password change signs out every other device.
  const revoked = await deleteAllSessionsForUser(session.user.id, session.id);
  return { status: "success", message: `Password changed.${revoked ? ` Signed out ${revoked} other session${revoked === 1 ? "" : "s"}.` : ""}` };
}

export async function signOutOtherSessions(): Promise<void> {
  const session = await requireAdmin();
  await deleteAllSessionsForUser(session.user.id, session.id);
  redirect("/admin/profile?signedOut=1");
}

// ── Inbox ──────────────────────────────────────────────────────────────────

export async function setMessageRead(id: string, read: boolean): Promise<void> {
  await requireAdmin();
  await db.contactMessage.update({ where: { id }, data: { readAt: read ? new Date() : null } }).catch(() => null);
  refresh();
}

export async function archiveMessage(id: string, archived: boolean): Promise<void> {
  await requireAdmin();
  await db.contactMessage.update({ where: { id }, data: { archived, readAt: new Date() } }).catch(() => null);
  refresh();
}

export async function deleteMessage(id: string): Promise<void> {
  await requireAdmin();
  await db.contactMessage.delete({ where: { id } }).catch(() => null);
  refresh();
}

// ── Sample content ─────────────────────────────────────────────────────────

/** Remove every row still flagged as sample content (never touches edited rows). */
export async function purgeSampleContent(): Promise<void> {
  await requireAdmin();
  await db.$transaction([
    db.blogPost.deleteMany({ where: { isSample: true } }),
    db.project.deleteMany({ where: { isSample: true } }),
    db.experience.deleteMany({ where: { isSample: true } }),
    db.experiment.deleteMany({ where: { isSample: true } }),
    db.technology.deleteMany({ where: { isSample: true } }),
  ]);
  invalidate(TAG.projects, TAG.posts, TAG.experience, TAG.experiments, TAG.technologies, TAG.settings);
  redirect("/admin?purged=1");
}
