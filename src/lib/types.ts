import type {
  EmploymentType,
  ExperimentKind,
  ExperimentStatus,
  LinkKind,
  MediaKind,
  Proficiency,
  ProjectCategory,
  ProjectStatus,
  TechCategory,
} from "@/generated/prisma/enums";
import type { ArchDiagram } from "@/lib/architecture";
import type { Feature, Highlight, JourneyStep, Principle, Social } from "@/lib/json-fields";
import type { HostingProvider } from "@/lib/url";

/*
 * Data-transfer objects returned by the public data layer. UI components
 * depend on these shapes, never on Prisma models directly, so the database
 * can evolve without rippling through presentation code — and nothing
 * unintended (drafts, internal fields) leaks to the client.
 */

export type MediaAsset = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  kind: MediaKind;
};

export type TechRef = { name: string; slug: string; category: TechCategory };

export type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  summary: string;
  year: number;
  status: ProjectStatus;
  categories: ProjectCategory[];
  typeLabel: string | null;
  featured: boolean;
  isSample: boolean;
  accent: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  hosting: HostingProvider | null;
  allowEmbed: boolean;
  showInPortal: boolean;
  portalOrder: number;
  thumbnail: MediaAsset | null;
  previewVideo: MediaAsset | null;
  technologies: TechRef[];
  updatedAt: Date;
  publishedAt: Date | null;
};

export type CaseStudySectionKey =
  | "problem"
  | "context"
  | "goals"
  | "solution"
  | "architecture"
  | "implementation"
  | "challenges"
  | "decisions"
  | "performance"
  | "security"
  | "results"
  | "lessonsLearned";

export type ProjectDetail = ProjectCard & {
  role: string | null;
  duration: string | null;
  descriptionHtml: string;
  sections: Record<CaseStudySectionKey, string>;
  diagram: ArchDiagram | null;
  features: Feature[];
  highlights: Highlight[];
  gallery: Array<{ media: MediaAsset; caption: string | null }>;
  links: Array<{ id: string; label: string; url: string; kind: LinkKind }>;
  posts: PostRef[];
  experiences: Array<{ id: string; company: string; role: string }>;
  seoTitle: string | null;
  seoDescription: string | null;
  neighbours: { previous: ProjectRef | null; next: ProjectRef | null };
};

export type ProjectRef = { slug: string; title: string; year: number };

export type PostRef = { slug: string; title: string; excerpt: string; publishedAt: Date | null; readingMinutes: number };

export type PostCard = PostRef & {
  id: string;
  featured: boolean;
  isSample: boolean;
  updatedAt: Date;
  cover: MediaAsset | null;
  category: { name: string; slug: string } | null;
  tags: Array<{ name: string; slug: string }>;
};

export type PostDetail = PostCard & {
  html: string;
  toc: Array<{ id: string; text: string; depth: 2 | 3 }>;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  projects: ProjectRef[];
  related: PostCard[];
};

export type ExperienceItem = {
  id: string;
  company: string;
  companyUrl: string | null;
  role: string;
  location: string | null;
  employmentType: EmploymentType;
  startDate: Date;
  endDate: Date | null;
  summary: string;
  descriptionHtml: string;
  responsibilities: string[];
  achievements: string[];
  isSample: boolean;
  technologies: TechRef[];
  projects: ProjectRef[];
};

export type TechnologyItem = TechRef & {
  id: string;
  proficiency: Proficiency;
  since: number | null;
  description: string | null;
  url: string | null;
  featured: boolean;
  isSample: boolean;
  projectCount: number;
  projects: ProjectRef[];
  /** Technologies most often used alongside this one (derived from projects). */
  related: Array<{ slug: string; name: string; weight: number }>;
};

export type ExperimentCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: ExperimentStatus;
  kind: ExperimentKind;
  year: number;
  sketch: string | null;
  url: string | null;
  repoUrl: string | null;
  featured: boolean;
  isSample: boolean;
  thumbnail: MediaAsset | null;
  technologies: TechRef[];
};

export type ExperimentDetail = ExperimentCard & { descriptionHtml: string };

export type SiteSettings = {
  ownerName: string;
  role: string;
  headline: string[];
  statement: string;
  currentFocus: string | null;
  currentlyBuilding: string | null;
  currentlyBuildingProject: (ProjectRef & { status: ProjectStatus; updatedAt: Date }) | null;
  location: string | null;
  timezone: string;
  isAvailable: boolean;
  availability: string | null;
  email: string | null;
  githubUsername: string | null;
  socials: Social[];
  resumeUrl: string | null;
  aboutIntroHtml: string;
  philosophyHtml: string;
  principles: Principle[];
  interests: string[];
  likesBuilding: string[];
  journey: JourneyStep[];
  portrait: MediaAsset | null;
  siteTitle: string;
  siteDescription: string;
  ogImage: MediaAsset | null;
};

export type GithubActivity = {
  username: string;
  profileUrl: string;
  /** Oldest → newest, one entry per day for the window. */
  days: Array<{ date: string; count: number }>;
  totalEvents: number;
  lastPushedRepo: { name: string; url: string; at: string } | null;
};
