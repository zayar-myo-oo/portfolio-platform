import type { Prisma } from "../../src/generated/prisma/client";

/**
 * Real projects. Sources: each project's README, architecture docs, package
 * manifests and git history. All repositories are private, so no repository
 * links are published. Fretlight is deployed on Vercel, but its public URL
 * still needs to be added (Admin → Projects → Fretlight → Live URL).
 */
export type ProjectSeed = Omit<Prisma.ProjectCreateInput, "technologies" | "isSample"> & { tech: string[] };

const FRETLIGHT_ARCHITECTURE = `# Everything in the real-time loop runs on the device
[Input]   Microphone, Audio interface, Camera
[Browser] AudioWorklet (framing), Web Worker (detection), MediaPipe (hand tracking)
[Core]    DSP (YIN + conditioning), Theory engine, Practice engine
[UI]      Next.js app (React 19), Store (Zustand)

Microphone -> AudioWorklet
Audio interface -> AudioWorklet
AudioWorklet -> Web Worker : frames (transferred)
Web Worker -> DSP
DSP -> Theory engine : note + cents
Theory engine -> Practice engine
Practice engine -> Next.js app : typed events
Camera -> MediaPipe
MediaPipe -> Next.js app : neck overlay
Next.js app -> Store`;

const MCM_ARCHITECTURE = `[Clients]  Public website (React + Vite), Admin CMS (React)
[API]      REST API (Express 5), Auth (JWT + bcrypt), Mailer (Nodemailer)
[Data]     PostgreSQL (Prisma 7)

Public website -> REST API : /api/v1
Admin CMS -> Auth : sign in
Auth -> REST API
REST API -> PostgreSQL : Prisma
REST API ~> Mailer : confirmation emails`;

const KARAOKE_ARCHITECTURE = `[App]      Flutter app (Riverpod), Player (just_audio)
[Services] Karaoke Crown API (NestJS), Realtime rooms (socket.io), Firebase Auth (Google)
[Data]     PostgreSQL (Prisma)

Flutter app -> Player : vocal / instrumental tracks
Flutter app -> Karaoke Crown API : REST (Dio) + JWT
Flutter app <-> Realtime rooms : Duo Challenge
Flutter app -> Firebase Auth : sign-in
Karaoke Crown API -> PostgreSQL`;

const PLATFORM_ARCHITECTURE = `# This platform, end to end
[Browser]  Public site (RSC), Portal (client filters), Admin CMS (forms)
[Next.js]  Proxy (auth gate), Server Actions (Zod + DAL), Data layer (use cache)
[Services] Markdown (sanitise + Shiki), Health check (SSRF-guarded)
[Storage]  PostgreSQL (Prisma 7), Media (local, S3-ready)

Public site -> Data layer : cached reads
Portal -> Health check : status + embed policy
Admin CMS -> Proxy : session cookie
Proxy -> Server Actions
Server Actions -> PostgreSQL : writes
Server Actions ~> Data layer : updateTag
Data layer -> Markdown
Data layer -> PostgreSQL : reads
Server Actions -> Media : uploads`;

export const PROJECTS: ProjectSeed[] = [
  {
    slug: "fretlight",
    title: "Fretlight",
    tagline: "A local-first practice companion for guitar and bass.",
    summary:
      "Play a real instrument; Fretlight listens, works out what you played and shows where you are on the neck — pitch detection, music theory and timing all computed on your device.",
    description:
      "An intelligent practice companion for guitar and bass. You play a real instrument; the app listens, works out *what* you played — pitch, octave, string and fret — and shows you where you are on the neck.\n\n**Not \"ChatGPT for guitar.\"** The intelligence is DSP, music theory and real-time interaction. No AI call sits anywhere in the practice loop, and everything works offline.",
    role: "Design & engineering",
    year: 2026,
    status: "LIVE",
    categories: ["WEB", "TOOL"],
    typeLabel: "Web App · PWA",
    hosting: "Vercel",
    problem:
      "Practice feedback is only useful if it is instant and correct. A note that lights up 200 ms after you played it is a replay, not feedback. Naive pitch detectors report bass notes an octave too high, flicker between readings, and happily \"hear\" notes when someone talks near the microphone.",
    goals:
      "- Keep the whole real-time loop on the device — no network hop, no model call\n- Treat bass as a first-class instrument, down to a 5-string's low B (30.87 Hz)\n- Report **string and fret**, not just a note name\n- Work offline and never upload audio or video",
    architecture:
      "A platform-free core package (`@fretlight/core`) holds the theory, fretboard geometry, DSP, timing and practice engines — with a hard rule of **no DOM, no Web Audio, no React, no fetch**. The Next.js app owns every browser API. Audio is framed on the audio thread by an AudioWorklet, moved (not copied) to a Web Worker for detection, and published to React through a typed event bus.",
    architectureDiagram: FRETLIGHT_ARCHITECTURE,
    implementation:
      "| Stage | What happens |\n| --- | --- |\n| Capture | Echo cancellation, noise suppression and AGC switched **off** — they are tuned for speech and destroy a bass fundamental |\n| Framing | AudioWorklet ring buffer; frame size derived from the instrument's lowest note |\n| Conditioning | DC blocker → high-pass → anti-alias low-pass, allocation-free |\n| Decimation | Two-stage downsampling — ~80× less work per frame |\n| Detection | YIN + parabolic interpolation + octave recovery, in a Web Worker |\n| Gating | Spectral flatness, harmonic ratio and pitch stability separate an instrument from a voice |\n| Display | A state machine commits slowly, holds ~700 ms and switches reluctantly — no flicker |",
    challenges:
      "**Telling an instrument from a person talking.** Speech overlaps a guitar in frequency, and a spoken vowel is periodic, so a clarity threshold isn't enough. What differs is behaviour over time: a fretted string holds pitch within a few cents, while speech slides continuously. The gate weights pitch stability most heavily, backed by spectral and harmonic checks.\n\n**Same waveform, different places.** An A2 on the low E string at the 5th fret and the open A string are physically identical signals. A position estimator infers the hand position from fretted notes (open strings deliberately don't move it) so a run up one string stays on that string.",
    decisions:
      "**No AI in the practice loop.** AI may later explain a scale or summarise a session, but it is never required to detect a note, tune a string or grade a run.\n\n**A platform-free core.** Keeping the engines free of browser APIs makes them testable under Node, lets the same detector run on the main thread, in a Worker or in an AudioWorklet, and lets a future React Native app import them unchanged.",
    performance:
      "Detection runs off both the audio and main threads. Frames are transferred rather than copied, decimation cuts per-frame work by roughly 80×, and React receives notifications coalesced onto an animation frame. The core's 87 unit tests — including DSP correctness on synthetic bass plucks — run in about 600 ms.",
    security:
      "Privacy by architecture: audio and video are processed on the device and never leave it. There is no backend, no analytics and no model call anywhere in the practice loop.",
    results:
      "Measured through the live microphone path against synthesised plucks with a deliberately weak fundamental:\n\n| String | Frequency | Reported |\n| --- | --- | --- |\n| B0 | 30.87 Hz | B0 +1¢ |\n| E1 | 41.20 Hz | E1 −1¢ |\n| A1 | 55.00 Hz | A1 −1¢ |\n| D2 | 73.42 Hz | D2 +0¢ |\n\nAgainst synthetic speech, fewer than 5% of frames are accepted and no notes reach the screen — while a guitar played *over* background speech is still detected.",
    features: [
      { title: "Tuner", description: "Chromatic tuner with ±0.1¢ resolution, cents meter and every position of the detected note." },
      { title: "Fretboard", description: "13 scales, 16 chord types, generated position boxes, degree labels and chords that fit the scale." },
      { title: "Metronome", description: "Audio-clock scheduling, subdivisions, odd meters, tap tempo and keyboard transport." },
      { title: "Practice drills", description: "Note, fret and interval drills with live grading, streaks, reaction time and saved history." },
      { title: "Live camera", description: "A fretboard overlay drawn onto your real neck in perspective, with hand tracking." },
      { title: "Guitar & bass", description: "6/7-string guitar and 4/5/6-string bass profiles across 15 tunings; installable and offline." },
    ],
    highlights: [
      { label: "Lowest note", value: "B0 · 30.87 Hz" },
      { label: "Unit tests", value: "87 in ~600 ms" },
      { label: "Network in loop", value: "None" },
      { label: "Scales · chords", value: "13 · 16" },
    ],
    published: true,
    publishedAt: new Date(Date.UTC(2026, 8, 28)),
    featured: true,
    showInPortal: true,
    portalOrder: 0,
    accent: "#2bb3a8",
    tech: ["nextjs", "react", "typescript", "tailwind-css", "web-audio", "threejs", "mediapipe", "vercel"],
  },
  {
    slug: "mcm",
    title: "MCM — Music Copyright Myanmar",
    tagline: "A platform for Myanmar's music copyright collective.",
    summary:
      "Public website, member and song registry, licensing requests and an admin CMS for Music Copyright Myanmar, the country's collective management organization. In active development.",
    description:
      "Music Copyright Myanmar (MCM) represents creators as Myanmar's collective management organization. The platform gives the public a way to find members and their songs, apply for membership and request licences — and gives the organization an admin CMS to run all of it.",
    role: "Full-stack development — web app and REST API",
    year: 2026,
    duration: "Ongoing",
    status: "DEVELOPMENT",
    categories: ["WEB", "BACKEND", "CLIENT"],
    typeLabel: "Web Platform · Client",
    goals:
      "- A public site for members, songs, news and activities\n- Self-service membership applications and song-licensing requests\n- An admin CMS so staff can manage content without developers",
    architecture:
      "A React + Vite front end (public site and admin CMS) talks to a versioned REST API (`/api/v1`) built with Express 5 and TypeScript. The API is organised into routes, controllers and services per domain — members, songs, news, activities, applications, licence requests, hero slides and analytics — with Prisma 7 over PostgreSQL.",
    architectureDiagram: MCM_ARCHITECTURE,
    security:
      "JWT authentication with bcrypt-hashed passwords, Helmet security headers, request validation with express-validator and rate limiting with express-rate-limit.",
    features: [
      { title: "Member & song registry", description: "Member profiles linked to their songs, with search across the catalogue." },
      { title: "Licence request wizard", description: "Multi-step licensing requests with confirmation emails." },
      { title: "Membership applications", description: "Online applications reviewed from the admin dashboard." },
      { title: "News CMS", description: "Rich-text article editor for news, plus activities and home-page hero slides." },
      { title: "Admin dashboard", description: "Overview, analytics and Excel import for bulk data." },
    ],
    published: true,
    publishedAt: new Date(Date.UTC(2026, 8, 28)),
    featured: true,
    showInPortal: true,
    portalOrder: 1,
    accent: "#c2410c",
    tech: ["react", "typescript", "tailwind-css", "nodejs", "express", "postgresql", "prisma", "rest-api-design"],
  },
  {
    slug: "karaoke-crown",
    title: "Karaoke Crown",
    tagline: "Sing, duel and get scored.",
    summary:
      "Flutter mobile app for the Karaoke Crown platform by Trinity Music: synced lyrics, solo and real-time Duo Challenge modes, AI performance scoring and mic-token payments. In active development.",
    description:
      "The customer-facing mobile client for **Karaoke Crown**. Listeners browse and play songs with timestamped lyrics; singers switch to the instrumental track to sing solo (*Sing for Fun*) or face someone live in a *Duo Challenge*, and every performance gets a 0–100 score with feedback.",
    role: "Mobile development (Flutter)",
    year: 2026,
    duration: "Ongoing",
    status: "DEVELOPMENT",
    categories: ["MOBILE", "CLIENT"],
    typeLabel: "Mobile App · Client",
    architecture:
      "A Flutter app with a feature-first clean architecture: Riverpod for state, go_router for navigation and Dio for HTTP. It talks to the Karaoke Crown REST API (NestJS, Prisma, PostgreSQL) and joins realtime Duo Challenge rooms over socket.io.",
    architectureDiagram: KARAOKE_ARCHITECTURE,
    security:
      "Email/password auth with OTP verification and Google sign-in via Firebase. The JWT is kept in the platform's secure key store, attached as a Bearer token and refreshed through the API.",
    features: [
      { title: "Song catalogue", description: "Categories, genres, artists and search, with discovery slides." },
      { title: "Lyrics player", description: "Timestamped lyrics with separate vocal (listen) and instrumental (karaoke) tracks." },
      { title: "Sing for Fun & Duo Challenge", description: "Solo singing, or a live head-to-head room in real time." },
      { title: "AI scoring", description: "A 0–100 score and feedback per performance, with history and a scoreboard." },
      { title: "Mic tokens", description: "Token balance and top-ups through a bank payment gateway; Duo entry fees." },
    ],
    published: true,
    publishedAt: new Date(Date.UTC(2026, 8, 29)),
    featured: true,
    showInPortal: true,
    portalOrder: 2,
    accent: "#d4a017",
    tech: ["flutter", "dart", "firebase", "rest-api-design"],
  },
  {
    slug: "portfolio-platform",
    title: "Portfolio Platform",
    tagline: "A CMS-driven portfolio with a live project portal.",
    summary:
      "This site: case studies, a project portal that launches real deployments, a technical blog and an admin CMS — every page rendered from PostgreSQL.",
    description:
      "A portfolio built like a product. Every page renders from PostgreSQL through a cached data layer, and a protected admin CMS edits all of it — projects, articles, experience, technologies, experiments and media.",
    role: "Design & engineering",
    year: 2026,
    duration: "Ongoing",
    status: "DEVELOPMENT",
    categories: ["WEB", "TOOL"],
    typeLabel: "Web Platform",
    problem:
      "Static portfolios go stale because every update is a code change. The goal was a site where adding a project, article, job or live demo is a content operation — not a deploy.",
    goals:
      "- Public pages render only from the database\n- Admin edits appear immediately, without rebuilding\n- External projects launch *honestly*: never pretend a deployment is hosted here\n- Fast, accessible and readable without JavaScript",
    architecture:
      "Reads go through a `\"use cache\"` data layer tagged per content type. Server Actions validate input with Zod, authorise through a Data Access Layer, write through Prisma, then call `updateTag()` so the next render is fresh.",
    architectureDiagram: PLATFORM_ARCHITECTURE,
    decisions:
      "**Markdown + directives instead of MDX.** Database-stored MDX executes JavaScript on the server. A sanitised Markdown pipeline with a fixed vocabulary (callouts, figures, architecture fences) keeps rich content without a code-execution path.\n\n**Database sessions instead of JWTs.** A single-owner CMS benefits more from instant revocation than from stateless tokens.",
    security:
      "Admin routes are gated twice: an optimistic proxy redirect, and an authoritative `requireAdmin()` in every page and action. The portal health check resolves DNS and refuses private address ranges before fetching any URL.",
    features: [
      { title: "Project portal", description: "Search, filter and launch every project; live status and embed checks." },
      { title: "Case studies", description: "Structured sections, interactive architecture diagrams, galleries." },
      { title: "Admin CMS", description: "CRUD for all content, media library, portal ordering, analytics." },
    ],
    highlights: [
      { label: "Rendering", value: "RSC + use cache" },
      { label: "Data", value: "PostgreSQL" },
      { label: "Client JS", value: "Islands only" },
    ],
    published: true,
    publishedAt: new Date(Date.UTC(2026, 8, 29)),
    featured: false,
    showInPortal: true,
    portalOrder: 3,
    accent: "#ff5a1f",
    tech: ["nextjs", "react", "typescript", "postgresql", "prisma", "tailwind-css", "threejs"],
  },
];
