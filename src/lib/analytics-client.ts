import type { AnalyticsEventType } from "@/lib/constants";

/**
 * Fire-and-forget analytics. Sends only the event name, path and the entity
 * it concerns — no identifiers, no cookies, no fingerprinting.
 */
export function track(type: AnalyticsEventType, data: { entityType?: string; entityId?: string; path?: string } = {}) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    type,
    path: data.path ?? window.location.pathname,
    entityType: data.entityType,
    entityId: data.entityId,
    referrer: document.referrer || undefined,
  });
  try {
    const sent = navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }));
    if (!sent) void fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    /* analytics must never break the page */
  }
}
