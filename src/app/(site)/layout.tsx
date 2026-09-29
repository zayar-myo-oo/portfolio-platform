import { ContextCursor } from "@/components/motion/context-cursor";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PageViewTracker } from "@/components/site/track";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[var(--z-toast)] rounded-md bg-ink px-4 py-2 text-ink-inverse focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div id="top" />
      <SiteHeader />
      <main id="main" className="pt-[var(--header-h)]">
        {children}
      </main>
      <SiteFooter />
      <ContextCursor />
      <PageViewTracker />
    </>
  );
}
