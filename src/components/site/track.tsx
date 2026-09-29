"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics-client";
import type { AnalyticsEventType } from "@/lib/constants";

/** Records one page_view per client navigation. */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);
  return null;
}

/** Records an entity view (project_view, blog_view) once on mount. */
export function TrackView({ type, entityType, entityId }: { type: AnalyticsEventType; entityType: string; entityId: string }) {
  useEffect(() => {
    track(type, { entityType, entityId });
  }, [type, entityType, entityId]);
  return null;
}
