import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy without nonces (keeps pages statically prerendered).
 * - scripts/styles only from this origin (+ inline, required by Next's runtime)
 * - frames allowed to any https origin, for opt-in "Open in Portal" previews
 * - this site itself can never be framed (frame-ancestors 'none')
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-src https:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  // Pin the workspace root (a stray lockfile in the home directory confuses inference).
  turbopack: { root: process.cwd() },
  images: {
    localPatterns: [{ pathname: "/media/**" }],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
  experimental: {
    serverActions: {
      // Media uploads go through Server Actions; files are validated server-side.
      bodySizeLimit: "4.5mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
