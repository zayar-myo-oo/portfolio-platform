import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="hairline-grid flex min-h-dvh items-center">
      <div className="container-page py-24">
        <p className="label">Error 404 · route not found</p>
        <h1 className="display mt-6 text-display-l">
          Signal
          <br />
          <span className="text-ink-3">lost.</span>
        </h1>
        <p className="mt-8 max-w-md text-lg text-ink-2">
          This page doesn&rsquo;t exist — or it was moved when the content changed. Everything that does exist is one step away.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="primary" icon="arrow-left">
            Home
          </ButtonLink>
          <ButtonLink href="/portal" variant="secondary" icon="grid">
            Project portal
          </ButtonLink>
          <Link href="/blog" className="inline-flex h-10 items-center px-4 text-sm text-ink-2 hover:text-ink">
            Notes
          </Link>
        </div>
      </div>
    </main>
  );
}
