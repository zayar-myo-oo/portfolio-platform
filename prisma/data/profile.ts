import type { Prisma } from "../../src/generated/prisma/client";

/**
 * Owner profile — sourced from the CV (Zayar-Myo-Oo.pdf) and the owner's own
 * notes. Editable later in Admin → Settings; the seed only writes this while
 * the settings row still holds the original placeholder identity.
 *
 * Deliberately NOT published: phone number and street address from the CV.
 */
export const PROFILE: Omit<Prisma.SiteSettingUncheckedCreateInput, "id"> = {
  ownerName: "Zayar Myo Oo",
  role: "Full-Stack Software Engineer",
  headline: ["Engineering", "for the web,", "tuned for music."],
  statement:
    "Full-stack developer building RESTful APIs and Vue + Java features at PI Insurance Technology — and, beyond the day job, software for musicians: a real-time guitar & bass practice app, a music-copyright platform and a karaoke app.",
  currentFocus: "Shipping MCM & Karaoke Crown",
  currentlyBuilding: "MCM · Karaoke Crown",
  location: "Yangon, Myanmar",
  timezone: "Asia/Yangon",
  isAvailable: false,
  availability: null,
  email: "zayarmyooo.dev@gmail.com",
  githubUsername: "zayar-myo-oo",
  socials: [{ label: "GitHub", url: "https://github.com/zayar-myo-oo" }],
  aboutIntro:
    "I'm a full-stack developer, currently a **Junior Software Engineer at PI Insurance Technology Singapore**, where I build RESTful APIs and web features with Vue and Java.\n\nI'm grateful for the opportunities I've had in the IT field, and I genuinely enjoy the work. Outside the day job I build software for musicians — tools I'd want to use myself.",
  philosophy:
    "Working across different projects has taught me to **adapt quickly** and to collaborate well — I value teamwork, and I can also work independently when a problem needs someone to own it end to end.\n\nI've learned to handle pressure and meet tight deadlines without cutting the corners that come back later. Above all I believe in continuous growth: stay humble, keep learning, and give credit to the people who make the work better.",
  principles: [
    { title: "Adapt quickly", body: "Every project has a new domain or stack. Learning it fast is part of the job." },
    { title: "Team first — own it when needed", body: "Collaboration by default; independent ownership when the work calls for it." },
    { title: "Calm under deadlines", body: "Pressure is normal. Shipping on time without cutting the corners that matter is the skill." },
    { title: "Stay humble, keep learning", body: "Continuous growth, and credit for the colleagues whose support makes the work better." },
  ],
  interests: [],
  likesBuilding: ["Full-stack web applications", "RESTful APIs", "Tools for musicians", "Automation & internal tools"],
  journey: [
    { period: "2020 – 2021", title: "OJT at ACE Inspiration", body: "First professional code: a RESTful API and a bulletin books management system." },
    { period: "2022 – 2023", title: "Mid-level Programmer, DIR-ACE Technology", body: "Mentored junior developers and built progress-tracking and automation tools in Python and shell." },
    { period: "2023", title: "Microverse · University of the People", body: "A full-time remote full-stack program, and the start of a BSc in Computer Science." },
    { period: "2023 – now", title: "Software engineer, PI Insurance Technology", body: "RESTful APIs and product features with Vue and Java." },
    { period: "2026", title: "Building for music", body: "Fretlight, MCM and Karaoke Crown — practice, copyright and karaoke." },
  ],
  siteTitle: "Zayar Myo Oo — Software Engineer",
  siteDescription:
    "Portfolio of Zayar Myo Oo, full-stack software engineer: projects and case studies, a live project portal, and engineering notes.",
};
