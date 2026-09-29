import { getProjectBySlug, getPublishedProjectSlugs } from "@/server/data/projects";
import { getSiteSettings } from "@/server/data/settings";
import { OG_SIZE, renderOgImage } from "@/server/og";
import { PROJECT_STATUS } from "@/lib/constants";

export const alt = "Project case study";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__none__" }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()]);
  return renderOgImage({
    eyebrow: project ? `Case study · ${PROJECT_STATUS[project.status].label}` : "Project",
    title: project?.title ?? "Project not found",
    subtitle: project?.tagline ?? project?.summary,
    footer: settings.ownerName,
    accent: project?.accent,
  });
}
