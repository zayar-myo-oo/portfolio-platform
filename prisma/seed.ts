/**
 * Seed: the owner's real content (from the CV and project repositories) plus
 * a few clearly-badged sample articles.
 *
 * Safe to re-run:
 * - creates rows that don't exist yet; never overwrites content edited in
 *   the CMS (rows that are no longer flagged `isSample`)
 * - upgrades rows that are still placeholders to the real content
 * - deletes placeholder rows from the first seed, but only while they are
 *   still flagged `isSample`
 * - upserts the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../src/server/auth/password";
import { readingMinutes } from "../src/lib/utils";
import { EXPERIENCE } from "./data/experience";
import { PROFILE } from "./data/profile";
import { PROJECTS } from "./data/projects";
import { ARTICLES, EXPERIMENTS, RETIRED } from "./data/samples";
import { TECHNOLOGIES } from "./data/technologies";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const log = (message: string) => console.log(`• ${message}`);

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return log("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account.");
  if (password.length < PASSWORD_MIN_LENGTH) throw new Error(`ADMIN_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  // The seed runs on every deploy: create the admin once, never silently reset a
  // password changed in Admin → Profile (set ADMIN_RESET_PASSWORD=1 to force it).
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && process.env.ADMIN_RESET_PASSWORD !== "1") return log(`Admin account exists: ${email}`);
  const passwordHash = await hashPassword(password);
  await db.user.upsert({ where: { email }, create: { email, name: PROFILE.ownerName, passwordHash }, update: { passwordHash } });
  log(existing ? `Admin password reset: ${email}` : `Admin account created: ${email}`);
}

async function seedTaxonomy() {
  const categories = [
    "Backend", "Frontend", "Database", "Architecture", "DevOps",
    "Security", "Performance", "Software Engineering", "Learning Notes", "Experiments",
  ];
  for (const [order, name] of categories.entries()) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    await db.category.upsert({ where: { slug }, create: { name, slug, order }, update: {} });
  }
  for (const name of ["nextjs", "caching", "performance", "security", "iframes", "ssrf", "dsl", "svg", "accessibility"]) {
    await db.tag.upsert({ where: { slug: name }, create: { name, slug: name }, update: {} });
  }
}

async function seedTechnologies() {
  for (const tech of TECHNOLOGIES) {
    const existing = await db.technology.findUnique({ where: { slug: tech.slug } });
    if (!existing) await db.technology.create({ data: { ...tech, isSample: false } });
    else if (existing.isSample) await db.technology.update({ where: { slug: tech.slug }, data: { ...tech, isSample: false } });
  }
  const retired = await db.technology.deleteMany({ where: { isSample: true } });
  if (retired.count) log(`Removed ${retired.count} placeholder technologies.`);
}

async function seedProjects() {
  const techIds = new Map((await db.technology.findMany({ select: { id: true, slug: true } })).map((t) => [t.slug, t.id]));
  for (const { tech, ...project } of PROJECTS) {
    const technologies = tech.flatMap((slug, order) => {
      const id = techIds.get(slug);
      return id ? [{ order, technologyId: id }] : [];
    });
    const existing = await db.project.findUnique({ where: { slug: project.slug } });
    if (!existing) {
      await db.project.create({ data: { ...project, isSample: false, technologies: { create: technologies } } });
      log(`Project created: ${project.title}`);
    } else if (existing.isSample) {
      await db.project.update({
        where: { slug: project.slug },
        data: {
          ...project,
          lessonsLearned: null,
          isSample: false,
          technologies: { deleteMany: {}, create: technologies },
        },
      });
      log(`Project upgraded from placeholder: ${project.title}`);
    }
  }
  const retired = await db.project.deleteMany({ where: { slug: { in: RETIRED.projects }, isSample: true } });
  if (retired.count) log(`Removed ${retired.count} placeholder projects.`);
}

async function seedSettings() {
  const mcm = await db.project.findUnique({ where: { slug: "mcm" }, select: { id: true } });
  const data = { ...PROFILE, currentlyBuildingProjectId: mcm?.id ?? null };
  const existing = await db.siteSetting.findUnique({ where: { id: "site" } });
  if (!existing) {
    await db.siteSetting.create({ data: { id: "site", ...data } });
    log("Site settings created.");
  } else if (existing.ownerName === "Your Name") {
    await db.siteSetting.update({ where: { id: "site" }, data });
    log("Site settings upgraded from placeholder.");
  }
}

async function seedExperience() {
  const retired = await db.experience.deleteMany({ where: { isSample: true } });
  if (retired.count) log(`Removed ${retired.count} placeholder experience entries.`);
  if (await db.experience.count()) return;

  for (const { technologies, ...fields } of EXPERIENCE) {
    await db.experience.create({
      data: { ...fields, technologies: { connect: technologies.map((slug) => ({ slug })) } },
    });
  }
  log(`Experience created (${EXPERIENCE.length} entries).`);
}

async function seedArticles() {
  for (const { category, tags, projects, ...post } of ARTICLES) {
    if (await db.blogPost.findUnique({ where: { slug: post.slug } })) continue;
    await db.blogPost.create({
      data: {
        ...post,
        isSample: true,
        readingMinutes: readingMinutes(post.content),
        category: { connect: { slug: category } },
        tags: { connect: tags.map((slug) => ({ slug })) },
        projects: projects ? { connect: projects.map((slug) => ({ slug })) } : undefined,
      },
    });
  }
  const retired = await db.blogPost.deleteMany({ where: { slug: { in: RETIRED.posts }, isSample: true } });
  if (retired.count) log(`Removed ${retired.count} placeholder posts.`);
}

async function seedExperiments() {
  for (const experiment of EXPERIMENTS) {
    const existing = await db.experiment.findUnique({ where: { slug: experiment.slug } });
    if (!existing) await db.experiment.create({ data: experiment });
    else if (existing.isSample) await db.experiment.update({ where: { slug: experiment.slug }, data: { isSample: false } });
  }
  const retired = await db.experiment.deleteMany({ where: { slug: { in: RETIRED.experiments }, isSample: true } });
  if (retired.count) log(`Removed ${retired.count} placeholder experiments.`);
}

async function main() {
  await seedAdmin();
  await seedTaxonomy();
  await seedTechnologies();
  await seedProjects();
  await seedSettings();
  await seedExperience();
  await seedArticles();
  await seedExperiments();
  console.log("✓ Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
