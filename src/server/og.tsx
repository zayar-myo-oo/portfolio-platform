import "server-only";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Shared social card: graphite ground, hairline grid, accent rule, mono
 * eyebrow and a large title — the site's editorial voice at 1200×630.
 */
export function renderOgImage({
  eyebrow,
  title,
  subtitle,
  footer,
  accent,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  footer: string;
  accent?: string | null;
}) {
  const color = accent && HEX.test(accent) ? accent : "#ff6a2b";
  const size = title.length > 60 ? 64 : title.length > 36 ? 80 : 104;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0d0e0f",
          backgroundImage:
            "linear-gradient(to right, rgba(236,233,226,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(236,233,226,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          color: "#ece9e2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: color }} />
          <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: "#8f8b83" }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: size, lineHeight: 1, letterSpacing: -3, fontWeight: 700, maxWidth: 1000 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 30, lineHeight: 1.35, color: "#b4b0a7", maxWidth: 940 }}>{subtitle}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 26, color: "#ece9e2" }}>{footer}</div>
          <div style={{ width: 220, height: 6, background: color }} />
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
