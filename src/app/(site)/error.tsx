"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Route-level error boundary for the public site: explain, offer a retry, never a blank page. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-start justify-center py-24">
      <p className="label text-experimental">Something broke{error.digest ? ` · ref ${error.digest}` : ""}</p>
      <h1 className="display mt-6 text-display-s">This section failed to load.</h1>
      <p className="mt-6 max-w-md text-ink-2">It&rsquo;s probably temporary. Try again, or head somewhere else in the meantime.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset} icon="refresh">
          Try again
        </Button>
        <Link href="/" className="inline-flex h-10 items-center rounded-md border border-line-strong px-4 text-sm hover:border-ink">
          Go home
        </Link>
      </div>
    </div>
  );
}
