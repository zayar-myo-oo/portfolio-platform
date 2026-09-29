import { connection } from "next/server";
import { db } from "@/server/db";
import { checkDeployment } from "@/server/portal/deployment-status";
import { clientAddress, rateLimit } from "@/server/rate-limit";
import { parseHttpUrl } from "@/lib/url";

/**
 * Deployment health + framing policy for a project's live URL.
 * Only URLs stored on published projects can be checked — the endpoint never
 * accepts a URL from the request, so it cannot be used as an open proxy.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/portal/[slug]/status">) {
  await connection();
  const { slug } = await params;

  const limit = await rateLimit("portal-status", await clientAddress(), 60, 60_000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const project = await db.project.findFirst({
    where: { slug, published: true },
    select: { liveUrl: true, allowEmbed: true },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const url = parseHttpUrl(project.liveUrl);
  if (!url) {
    return Response.json({ state: "none", embeddable: false, embedReason: "No live deployment.", checkedAt: new Date().toISOString() });
  }

  const status = await checkDeployment(url.toString());
  const embeddable = project.allowEmbed ? status.embeddable : false;
  const embedReason = project.allowEmbed ? status.embedReason : "In-portal preview is disabled for this project.";

  return Response.json(
    { ...status, embeddable, embedReason },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
