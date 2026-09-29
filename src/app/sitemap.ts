import type { MetadataRoute } from "next";
import { getExperiments } from "@/server/data/experiments";
import { getPublishedPosts } from "@/server/data/posts";
import { getPublishedProjects } from "@/server/data/projects";
import { absoluteUrl } from "@/lib/site";

/** Generated from the same cached data layer as the pages it lists. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, experiments] = await Promise.all([getPublishedProjects(), getPublishedPosts(), getExperiments()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/projects"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/portal"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/experience"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/experiments"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.4 },
  ];

  return [
    ...staticPages,
    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: project.featured ? 0.8 : 0.6,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...experiments.map((experiment) => ({
      url: absoluteUrl(`/experiments/${experiment.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ];
}
