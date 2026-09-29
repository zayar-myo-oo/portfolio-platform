import { z } from "zod";

/**
 * Shapes of JSON columns. Used to validate admin input on write and to parse
 * defensively on read (bad rows degrade to empty lists, never crash a page).
 */

const text = (max: number) => z.string().trim().min(1).max(max);

export const featureSchema = z.object({ title: text(80), description: z.string().trim().max(400).default("") });
export const highlightSchema = z.object({ label: text(40), value: text(40) });
export const socialSchema = z.object({ label: text(40), url: z.url({ protocol: /^https?$|^mailto$/ }) });
export const principleSchema = z.object({ title: text(80), body: z.string().trim().max(600).default("") });
export const journeySchema = z.object({ period: text(40), title: text(100), body: z.string().trim().max(600).default("") });

export type Feature = z.infer<typeof featureSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
export type Social = z.infer<typeof socialSchema>;
export type Principle = z.infer<typeof principleSchema>;
export type JourneyStep = z.infer<typeof journeySchema>;

export function parseJsonList<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}
