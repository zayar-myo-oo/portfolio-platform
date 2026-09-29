import { ViewTransition, type ReactNode } from "react";

/**
 * Page-level enter/exit (fade + slight rise, see `.page` in globals.css).
 * Lives in each page rather than a layout — layouts persist across
 * navigations, so enter/exit would never fire there.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
