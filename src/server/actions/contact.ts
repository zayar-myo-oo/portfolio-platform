"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { clientAddress, rateLimit } from "@/server/rate-limit";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
  values?: { name: string; email: string; subject: string; message: string };
};

const schema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(120),
  email: z.email("That email doesn't look right.").max(200),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, "A little more detail, please (10+ characters).").max(5000),
});

/**
 * Contact form → inbox (Admin → Messages). Protected by a honeypot field,
 * a per-address rate limit and server-side validation. No email service is
 * required; messages are stored and never rendered as HTML.
 */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  // Bots fill every field; humans never see this one.
  if (String(formData.get("website") ?? "").length > 0) {
    return { status: "success", message: "Thanks — your message is on its way." };
  }

  const parsed = schema.safeParse({ ...values, subject: values.subject || undefined });
  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["fieldErrors"]>;
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors, values };
  }

  const limit = await rateLimit("contact", await clientAddress(), 3, 10 * 60_000);
  if (!limit.ok) {
    return {
      status: "error",
      message: `You've sent a few messages already — please try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      values,
    };
  }

  try {
    await db.contactMessage.create({ data: parsed.data });
    await db.analyticsEvent.create({ data: { type: "contact_submit", path: "/contact" } });
  } catch {
    return { status: "error", message: "Something went wrong on our side. Please try again, or use email instead.", values };
  }

  return { status: "success", message: "Thanks — your message is on its way. I'll reply by email." };
}
