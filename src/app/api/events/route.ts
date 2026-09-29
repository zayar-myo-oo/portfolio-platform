import { connection } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { clientAddress, rateLimit } from "@/server/rate-limit";
import { ANALYTICS_EVENTS } from "@/lib/constants";
import { siteUrl } from "@/lib/site";

/**
 * Privacy-preserving analytics sink. Stores only: event type, path, the
 * entity concerned and the referring *host*. No IPs, user agents, cookies or
 * visitor identifiers. The client address is used transiently (hashed) for
 * rate limiting only.
 */
const eventSchema = z.object({
  type: z.enum(ANALYTICS_EVENTS),
  path: z.string().max(300).startsWith("/").optional(),
  entityType: z.string().max(40).regex(/^[a-z_]+$/).optional(),
  entityId: z.string().max(120).optional(),
  referrer: z.string().max(500).optional(),
});

function referrerHost(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname;
    const own = new URL(siteUrl()).hostname;
    return host === own ? null : host.slice(0, 120);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  await connection();
  const limit = await rateLimit("events", await clientAddress(), 120, 60_000);
  if (!limit.ok) return new Response(null, { status: 429 });

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 2000) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });
  const event = parsed.data;
  if (event.path?.startsWith("/admin")) return new Response(null, { status: 204 });

  await db.analyticsEvent.create({
    data: {
      type: event.type,
      path: event.path?.split("?")[0] ?? null,
      entityType: event.entityType ?? null,
      entityId: event.entityId ?? null,
      referrerHost: referrerHost(event.referrer),
    },
  });
  return new Response(null, { status: 204 });
}
