import "server-only";
import type { IncomingHttpHeaders } from "node:http";
import { parseHttpUrl } from "@/lib/url";
import { siteUrl } from "@/lib/site";
import { BlockedAddressError, safeRequest } from "@/server/net/safe-request";

export type DeploymentStatus = {
  state: "up" | "degraded" | "down" | "blocked";
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string;
  /** null = could not be determined (site unreachable) */
  embeddable: boolean | null;
  embedReason: string | null;
  finalHost: string | null;
};

/**
 * Framing policy from response headers. Browsers enforce both
 * X-Frame-Options and CSP frame-ancestors; a blocked iframe fails silently,
 * so we decide *before* offering an in-portal preview.
 */
export function framingPolicy(headers: IncomingHttpHeaders, targetUrl: URL): { embeddable: boolean; reason: string | null } {
  const ourOrigin = parseHttpUrl(siteUrl());
  if (ourOrigin?.protocol === "https:" && targetUrl.protocol === "http:") {
    return { embeddable: false, reason: "The deployment is served over plain HTTP (mixed content)." };
  }

  const csp = [headers["content-security-policy"]].flat().filter(Boolean).join(";");
  const frameAncestors = /(?:^|;)\s*frame-ancestors\s+([^;]*)/i.exec(csp)?.[1]?.trim();
  if (frameAncestors !== undefined) {
    const sources = frameAncestors.split(/\s+/).filter(Boolean);
    const allowsUs =
      sources.includes("*") ||
      (ourOrigin &&
        sources.some((source) => {
          const cleaned = source.replace(/\/$/, "");
          if (cleaned === ourOrigin.origin) return true;
          const wildcard = /^(https?:\/\/)?\*\.(.+)$/.exec(cleaned);
          return wildcard ? ourOrigin.hostname.endsWith(`.${wildcard[2]}`) : false;
        }));
    return allowsUs
      ? { embeddable: true, reason: null }
      : { embeddable: false, reason: `The site restricts framing (CSP frame-ancestors ${frameAncestors || "'none'"}).` };
  }

  const xfo = String(headers["x-frame-options"] ?? "").trim().toUpperCase();
  if (xfo) {
    return { embeddable: false, reason: `The site forbids framing (X-Frame-Options: ${xfo}).` };
  }
  return { embeddable: true, reason: null };
}

// Small in-process cache so repeated visits don't hammer deployments.
const cache = new Map<string, { expires: number; value: DeploymentStatus }>();
const TTL_MS = 60_000;

export async function checkDeployment(liveUrl: string): Promise<DeploymentStatus> {
  const cached = cache.get(liveUrl);
  if (cached && cached.expires > Date.now()) return cached.value;

  const started = performance.now();
  let value: DeploymentStatus;
  try {
    const response = await safeRequest(liveUrl);
    const latencyMs = Math.round(performance.now() - started);
    const framing = framingPolicy(response.headers, response.finalUrl);
    value = {
      state: response.status >= 500 ? "degraded" : "up",
      httpStatus: response.status,
      latencyMs,
      checkedAt: new Date().toISOString(),
      embeddable: framing.embeddable,
      embedReason: framing.reason,
      finalHost: response.finalUrl.hostname,
    };
  } catch (error) {
    value = {
      state: error instanceof BlockedAddressError ? "blocked" : "down",
      httpStatus: null,
      latencyMs: null,
      checkedAt: new Date().toISOString(),
      embeddable: null,
      embedReason: error instanceof BlockedAddressError ? "This URL points to a non-public address." : null,
      finalHost: null,
    };
  }

  cache.set(liveUrl, { expires: Date.now() + TTL_MS, value });
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  return value;
}
