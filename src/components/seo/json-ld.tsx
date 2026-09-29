import type { PostDetail, ProjectDetail, SiteSettings } from "@/lib/types";
import { absoluteUrl, siteUrl } from "@/lib/site";

type JsonLdObject = Record<string, unknown>;

/** Structured data. `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function personJsonLd(settings: SiteSettings): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl()}/#person`,
    name: settings.ownerName,
    jobTitle: settings.role,
    url: siteUrl(),
    description: settings.statement,
    sameAs: settings.socials.filter((social) => social.url.startsWith("http")).map((social) => social.url),
    ...(settings.portrait ? { image: absoluteUrl(settings.portrait.url) } : {}),
  };
}

export function websiteJsonLd(settings: SiteSettings): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: settings.siteTitle,
    description: settings.siteDescription,
    url: siteUrl(),
    author: { "@id": `${siteUrl()}/#person` },
  };
}

export function articleJsonLd(post: PostDetail, settings: SiteSettings): JsonLdObject {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription ?? post.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: settings.ownerName, url: siteUrl() },
    // The generated OG card lives at a hashed URL (emitted in <meta og:image>), so only cite real covers here.
    ...(post.cover ? { image: absoluteUrl(post.cover.url) } : {}),
    articleSection: post.category?.name,
    keywords: post.tags.map((tag) => tag.name).join(", "),
    timeRequired: `PT${post.readingMinutes}M`,
  };
}

export function projectJsonLd(project: ProjectDetail, settings: SiteSettings): JsonLdObject {
  const url = absoluteUrl(`/projects/${project.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": project.repoUrl ? "SoftwareSourceCode" : "CreativeWork",
    name: project.title,
    description: project.seoDescription ?? project.summary,
    url,
    dateCreated: String(project.year),
    dateModified: project.updatedAt.toISOString(),
    creator: { "@type": "Person", name: settings.ownerName, url: siteUrl() },
    keywords: project.technologies.map((tech) => tech.name).join(", "),
    ...(project.repoUrl ? { codeRepository: project.repoUrl, programmingLanguage: project.technologies.filter((t) => t.category === "LANGUAGE").map((t) => t.name) } : {}),
    ...(project.liveUrl ? { sameAs: project.liveUrl } : {}),
    ...(project.thumbnail ? { image: absoluteUrl(project.thumbnail.url) } : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
