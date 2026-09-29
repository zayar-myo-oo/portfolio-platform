import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Newsreader } from "next/font/google";
import { InlineScript, THEME_SCRIPT } from "@/components/inline-script";
import { getSiteSettings } from "@/server/data/settings";
import { siteUrl } from "@/lib/site";
import "./globals.css";

/* Three families, each with a job:
   display — variable grotesk for UI and kinetic headlines (opsz/wdth/wght)
   reading — variable serif for long-form articles
   code    — monospace for technical labels and code */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--nf-display",
  axes: ["opsz", "wdth"],
  display: "swap",
});
const reading = Newsreader({
  subsets: ["latin"],
  variable: "--nf-reading",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  preload: false,
});
const code = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--nf-code",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings.siteTitle, template: `%s — ${settings.ownerName}` },
    description: settings.siteDescription,
    applicationName: settings.siteTitle,
    authors: [{ name: settings.ownerName }],
    creator: settings.ownerName,
    openGraph: {
      type: "website",
      siteName: settings.siteTitle,
      title: settings.siteTitle,
      description: settings.siteDescription,
      locale: "en",
    },
    twitter: { card: "summary_large_image", title: settings.siteTitle, description: settings.siteDescription },
    alternates: {
      types: { "application/rss+xml": [{ url: "/blog/feed.xml", title: `${settings.ownerName} — Notes` }] },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e0f" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${reading.variable} ${code.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={THEME_SCRIPT} />
      </head>
      <body className="min-h-dvh bg-paper text-ink">{children}</body>
    </html>
  );
}
