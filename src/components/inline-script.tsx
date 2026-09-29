/**
 * Inline script that runs synchronously during HTML parsing (before paint).
 * Rendered as text/plain on the client so React doesn't warn about <script>
 * during client renders; `suppressHydrationWarning` accepts the difference.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Applies an explicit theme choice before first paint (system = CSS media query). */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;
