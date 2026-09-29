import type { Prisma } from "../../src/generated/prisma/client";

/**
 * Technologies from the CV skills list plus those used in the real projects
 * below. Proficiency defaults to PROFICIENT because the CV doesn't state
 * levels — adjust them in Admin → Technologies. `since` is left empty for the
 * same reason (the UI then shows no year count rather than a guessed one).
 */
type Tech = Omit<Prisma.TechnologyCreateInput, "isSample">;

export const TECHNOLOGIES: Tech[] = [
  // Languages
  { name: "TypeScript", slug: "typescript", category: "LANGUAGE", featured: true, order: 1 },
  { name: "JavaScript", slug: "javascript", category: "LANGUAGE", order: 2 },
  { name: "Java", slug: "java", category: "LANGUAGE", featured: true, order: 3 },
  { name: "PHP", slug: "php", category: "LANGUAGE", order: 4 },
  { name: "Python", slug: "python", category: "LANGUAGE", order: 5 },
  { name: "Dart", slug: "dart", category: "LANGUAGE", order: 6 },
  { name: "Shell scripting", slug: "shell", category: "LANGUAGE", order: 7 },
  // Frontend
  { name: "Vue.js", slug: "vuejs", category: "FRONTEND", featured: true, order: 1 },
  { name: "React", slug: "react", category: "FRONTEND", featured: true, order: 2 },
  { name: "Next.js", slug: "nextjs", category: "FRONTEND", order: 3 },
  { name: "Flutter", slug: "flutter", category: "FRONTEND", order: 4 },
  { name: "Tailwind CSS", slug: "tailwind-css", category: "FRONTEND", order: 5 },
  { name: "Bootstrap", slug: "bootstrap", category: "FRONTEND", order: 6 },
  { name: "Three.js", slug: "threejs", category: "FRONTEND", order: 7 },
  { name: "Web Audio API", slug: "web-audio", category: "FRONTEND", order: 8 },
  // Backend
  { name: "Node.js", slug: "nodejs", category: "BACKEND", featured: true, order: 1 },
  { name: "Express", slug: "express", category: "BACKEND", order: 2 },
  { name: "Laravel", slug: "laravel", category: "BACKEND", order: 3 },
  // Data
  { name: "MySQL", slug: "mysql", category: "DATABASE", order: 1 },
  { name: "PostgreSQL", slug: "postgresql", category: "DATABASE", order: 2 },
  { name: "MongoDB", slug: "mongodb", category: "DATABASE", order: 3 },
  { name: "Prisma", slug: "prisma", category: "DATABASE", order: 4 },
  // Cloud / platform
  { name: "Firebase", slug: "firebase", category: "CLOUD", order: 1 },
  { name: "Vercel", slug: "vercel", category: "CLOUD", order: 2 },
  // Architecture
  { name: "REST API design", slug: "rest-api-design", category: "ARCHITECTURE", order: 1 },
  // Tools
  { name: "Git & GitHub", slug: "git", category: "TOOLS", order: 1 },
  { name: "MediaPipe", slug: "mediapipe", category: "TOOLS", order: 2 },
];
