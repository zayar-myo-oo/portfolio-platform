import { PostList } from "@/components/blog/post-list";
import { HomeBento } from "@/components/home/bento";
import { buildStackLayers, Hero } from "@/components/home/hero";
import { WorkIndex } from "@/components/home/work-index";
import { PageTransition } from "@/components/motion/page-transition";
import { JsonLd, personJsonLd, websiteJsonLd } from "@/components/seo/json-ld";
import { Section, SectionHeader } from "@/components/ui/section";
import { getCareerStats, getExperience } from "@/server/data/experience";
import { getGithubActivity } from "@/server/data/github";
import { getLatestPosts } from "@/server/data/posts";
import { getFeaturedProjects, getPublishedProjects } from "@/server/data/projects";
import { getSiteSettings } from "@/server/data/settings";
import { getTechnologies } from "@/server/data/technologies";

export default async function HomePage() {
  const [settings, projects, featured, experience, technologies, posts, career] = await Promise.all([
    getSiteSettings(),
    getPublishedProjects(),
    getFeaturedProjects(4),
    getExperience(),
    getTechnologies(),
    getLatestPosts(3),
    getCareerStats(),
  ]);
  const github = await getGithubActivity(settings.githubUsername);
  const stats = { projects: projects.length, live: projects.filter((p) => p.status === "LIVE").length };

  return (
    <PageTransition>
      <JsonLd data={[websiteJsonLd(settings), personJsonLd(settings)]} />
      <Hero settings={settings} layers={buildStackLayers(technologies)} />

      <Section id="index" labelledBy="index-title" className="pt-16">
        <SectionHeader index="01" label="Index" title={<span id="index-title">At a glance</span>} className="mb-10" />
        <HomeBento
          settings={settings}
          featured={featured}
          stats={stats}
          experience={experience}
          technologies={technologies}
          latestPost={posts[0] ?? null}
          github={github}
          career={career}
        />
      </Section>

      {projects.length ? (
        <Section labelledBy="work-title">
          <SectionHeader
            index="02"
            label="Selected work"
            title={<span id="work-title">Things I&rsquo;ve built</span>}
            action={{ href: "/projects", label: `All ${projects.length} projects` }}
            className="mb-10"
          />
          <WorkIndex projects={projects.slice(0, 6)} />
        </Section>
      ) : null}

      {posts.length ? (
        <Section labelledBy="notes-title">
          <SectionHeader
            index="03"
            label="Engineering notes"
            title={<span id="notes-title">Writing</span>}
            action={{ href: "/blog", label: "All notes" }}
            className="mb-10"
          />
          <PostList posts={posts} />
        </Section>
      ) : null}
    </PageTransition>
  );
}
