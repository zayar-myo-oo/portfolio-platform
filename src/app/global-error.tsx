"use client";

/** Last-resort boundary (root layout failed). Must render its own <html>/<body>. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", background: "#0d0e0f", color: "#ece9e2" }}>
        <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>
          Unexpected error
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.04em", margin: "1rem 0" }}>The site couldn&rsquo;t load.</h1>
        <button
          type="button"
          onClick={reset}
          style={{ padding: "0.75rem 1.25rem", borderRadius: 8, border: "1px solid #444", background: "transparent", color: "inherit", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
