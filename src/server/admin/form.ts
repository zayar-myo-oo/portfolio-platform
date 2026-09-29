import "server-only";
import { z } from "zod";
import { isHttpUrl } from "@/lib/url";

/** Result shape shared by every admin form (consumed by <AdminForm>). */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
};

export const idle: ActionState = { status: "idle" };

// ── FormData readers ───────────────────────────────────────────────────────

export function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optStr(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value.length ? value : null;
}

export function bool(form: FormData, key: string): boolean {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function int(form: FormData, key: string): number | null {
  const value = str(form, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

/** Repeated inputs with the same name → trimmed, non-empty strings. */
export function list(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function json(form: FormData, key: string): unknown {
  const value = str(form, key);
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return Symbol.for("invalid-json");
  }
}

// ── Zod building blocks ────────────────────────────────────────────────────

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Required.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only.");

export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .refine((value) => value === null || isHttpUrl(value), "Must be a full http(s) URL without credentials.");

export const requiredText = (max: number) => z.string().trim().min(1, "Required.").max(max);
export const optionalText = (max: number) => z.string().trim().max(max).nullable();

/** Zod issues → { "field": "message" } for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    errors[key] ??= issue.message;
  }
  return errors;
}

export function invalid(error: z.ZodError): ActionState {
  return { status: "error", message: "Please fix the highlighted fields.", errors: fieldErrors(error) };
}

/** Prisma unique-constraint failures → friendly field error. */
export function uniqueViolation(error: unknown, field: string, message: string): ActionState | null {
  if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002") {
    return { status: "error", message, errors: { [field]: message } };
  }
  return null;
}
