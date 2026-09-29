import type { EmploymentType } from "../../src/generated/prisma/enums";

/**
 * Work history and education, from the CV. Bullet points are the CV's own
 * wording (lightly copy-edited). Education start months aren't in the CV, so
 * University of the People uses January as a placeholder month.
 */
export type ExperienceSeed = {
  company: string;
  role: string;
  employmentType: EmploymentType;
  startDate: Date;
  endDate: Date | null;
  summary: string;
  responsibilities: string[];
  achievements: string[];
  location?: string;
  technologies: string[];
  order: number;
};

const month = (year: number, m: number) => new Date(Date.UTC(year, m - 1, 1));

export const EXPERIENCE: ExperienceSeed[] = [
  {
    company: "PI Insurance Technology Singapore Pte. Ltd.",
    role: "Junior Software Engineer",
    employmentType: "FULL_TIME",
    startDate: month(2023, 8),
    endDate: null,
    summary: "Building RESTful APIs and product features for insurance technology with Vue and Java.",
    responsibilities: [
      "Developed RESTful APIs enabling communication between the website and back-end services",
      "Build product features with Vue and Java",
    ],
    achievements: [],
    technologies: ["vuejs", "java", "rest-api-design"],
    order: 0,
  },
  {
    company: "DIR-ACE Technology Ltd.",
    role: "Mid-level Programmer",
    employmentType: "FULL_TIME",
    startDate: month(2022, 12),
    endDate: month(2023, 8),
    summary: "Development, mentoring and automation: tracking tools for the team and scripts that removed manual work.",
    responsibilities: [
      "Coached and mentored junior team members to ensure their success",
      "Provided training and mentorship to develop juniors' professional skills",
      "Handled monitoring and automation tasks",
    ],
    achievements: [
      "Developed a system for tracking and monitoring software development progress",
      "Created internal tools using Python and shell scripts",
    ],
    technologies: ["python", "shell"],
    order: 1,
  },
  {
    company: "ACE Inspiration",
    role: "On-the-Job Trainee (OJT)",
    employmentType: "INTERNSHIP",
    startDate: month(2020, 6),
    endDate: month(2021, 12),
    summary: "First professional role: back-end APIs and an internal management system.",
    responsibilities: ["Developed a RESTful API to enable communication between the website and back-end services"],
    achievements: ["Built a bulletin books management system that let administrators manage tasks easily"],
    technologies: ["rest-api-design"],
    order: 2,
  },
  {
    company: "Microverse",
    role: "Remote Full Stack Web Development Program",
    employmentType: "EDUCATION",
    startDate: month(2023, 3),
    endDate: month(2023, 9),
    summary: "Full-time, remote full-stack web development program.",
    responsibilities: [],
    achievements: [],
    location: "Remote",
    technologies: [],
    order: 3,
  },
  {
    company: "University of the People",
    role: "Bachelor of Computer Science",
    employmentType: "EDUCATION",
    startDate: month(2023, 1),
    endDate: null,
    summary: "BSc Computer Science, in progress.",
    responsibilities: [],
    achievements: [],
    location: "Online",
    technologies: [],
    order: 4,
  },
];
