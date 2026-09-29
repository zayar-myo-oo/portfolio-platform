import { getPublishedPosts } from "@/server/data/posts";
import { getSiteSettings } from "@/server/data/settings";
import { absoluteUrl, siteUrl } from "@/lib/site";

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]!);
}

/** RSS 2.0 feed of published notes (prerendered; refreshed with the posts cache). */
export async function GET() {
  const [posts, settings] = await Promise.all([getPublishedPosts(), getSiteSettings()]);
  const items = posts
    .slice(0, 30)
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      ${post.publishedAt ? `<pubDate>${post.publishedAt.toUTCString()}</pubDate>` : ""}
      ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${settings.ownerName} — Notes`)}</title>
    <link>${siteUrl()}/blog</link>
    <description>${escapeXml(settings.siteDescription)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl("/blog/feed.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
