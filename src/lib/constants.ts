import type {
  EmploymentType,
  ExperimentKind,
  ExperimentStatus,
  LinkKind,
  Proficiency,
  ProjectCategory,
  ProjectStatus,
  TechCategory,
} from "@/generated/prisma/enums";

/* Human labels for enums. Kept in one place so public UI, admin forms and
   filters all speak the same language. */

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; description: string }> = {
  LIVE: { label: "Live", description: "Deployed and publicly reachable" },
  BETA: { label: "Beta", description: "Usable, still being hardened" },
  DEVELOPMENT: { label: "In development", description: "Actively being built" },
  ARCHIVED: { label: "Archived", description: "No longer maintained" },
  PRIVATE: { label: "Private", description: "Not publicly accessible" },
  EXPERIMENTAL: { label: "Experimental", description: "Exploration, may change or break" },
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "LIVE",
  "BETA",
  "DEVELOPMENT",
  "EXPERIMENTAL",
  "PRIVATE",
  "ARCHIVED",
];

export const PROJECT_CATEGORY: Record<ProjectCategory, string> = {
  WEB: "Web",
  MOBILE: "Mobile",
  BACKEND: "Backend",
  AI: "AI",
  TOOL: "Tools",
  EXPERIMENT: "Experiments",
  OPEN_SOURCE: "Open Source",
  CLIENT: "Client",
};

export const PROJECT_CATEGORY_ORDER: ProjectCategory[] = [
  "WEB",
  "MOBILE",
  "BACKEND",
  "AI",
  "TOOL",
  "EXPERIMENT",
  "OPEN_SOURCE",
  "CLIENT",
];

export const TECH_CATEGORY: Record<TechCategory, string> = {
  LANGUAGE: "Languages",
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DATABASE: "Database",
  CLOUD: "Cloud",
  DEVOPS: "DevOps",
  TOOLS: "Tools",
  ARCHITECTURE: "Architecture",
};

export const TECH_CATEGORY_ORDER: TechCategory[] = [
  "LANGUAGE",
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "CLOUD",
  "DEVOPS",
  "ARCHITECTURE",
  "TOOLS",
];

export const PROFICIENCY: Record<Proficiency, { label: string; rank: number }> = {
  EXPERT: { label: "Expert", rank: 4 },
  PROFICIENT: { label: "Proficient", rank: 3 },
  FAMILIAR: { label: "Familiar", rank: 2 },
  LEARNING: { label: "Learning", rank: 1 },
};

export const EMPLOYMENT_TYPE: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
  INTERNSHIP: "Internship",
  EDUCATION: "Education",
  VOLUNTEER: "Volunteer",
};

export const EXPERIMENT_STATUS: Record<ExperimentStatus, string> = {
  CONCEPT: "Concept",
  IN_PROGRESS: "In progress",
  PLAYABLE: "Playable",
  ARCHIVED: "Archived",
};

export const EXPERIMENT_KIND: Record<ExperimentKind, string> = {
  UI: "UI",
  AI: "AI",
  THREE_D: "3D",
  WEBGL: "WebGL",
  CREATIVE_CODING: "Creative coding",
  AUDIO: "Audio",
  DEV_TOOL: "Developer tool",
  TYPOGRAPHY: "Typography",
  OTHER: "Other",
};

export const LINK_KIND: Record<LinkKind, string> = {
  LIVE: "Live",
  REPOSITORY: "Repository",
  DEMO: "Demo",
  DOCS: "Documentation",
  ARTICLE: "Article",
  VIDEO: "Video",
  DESIGN: "Design",
  OTHER: "Link",
};

/** Analytics event names accepted by /api/events. */
export const ANALYTICS_EVENTS = [
  "page_view",
  "project_view",
  "project_live_launch",
  "project_embed_open",
  "github_click",
  "blog_view",
  "blog_share",
  "portal_search",
  "contact_submit",
] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[number];
