export const MYPICS = [
  "/mypics/binara.events-055 2.JPG",
  "/mypics/binara.events-111_Original 2.jpg",
  "/mypics/binara.events-114 3.JPG",
  "/mypics/binara.events-120 2.JPG",
  "/mypics/binara.events-641_Original 2.jpg",
  "/mypics/binara.events-771_Original 3.jpg",
  "/mypics/binara.events-883_Original 3.jpg",
  "/mypics/Screenshot 2026-05-13 at 19.40.43.png",
];
const M = (n) => MYPICS[(n - 1) % MYPICS.length];

export const FEATURED = [
  {
    id: "arimac-associate",
    title: "Associate Software Engineer (AI/ML)",
    tags: ["ARIMAC", "Mar 2026 — Present"],
    blurb: "Part of Arimac's Center of Intelligence Team ;) - Voice agents that actually pick up + workflow agents included.",
  },

  {
    id: "arimac-intern",
    title: "Intern AI/ML Engineer",
    tags: ["ARIMAC", "Feb 2025 — Aug 2025"],
    blurb: "Scheduled the calls, ranked the voices, fixed prod with better logs.",
  },
  {
    id: "aa-japan",
    title: "Software Engineer Intern",
    tags: ["AA JAPAN", "Sep 2025 — Mar 2026"],
    blurb: "ERP features - React up front, Spring Boot holding the fort.",
  },
  {
    id: "fast-track",
    title: "Fast Track Summer Intern",
    tags: ["Fast Track Summer Internship", "Aug 2024"],
    blurb: "Three companies, one summer, still finding my desk.",
  },
  {
    id: "tutopiya",
    title: "Mathematics Tutor",
    tags: ["TUTOPIYA", "Feb 2024 — Present"],
    blurb: "Making x equal something you can actually explain out loud.",
  },
];

export const SECONDARY = [
  { title: "Condomínio Praia de Guadalupe", year: "2025", tags: ["Website", "UI Design", "Dev"], img: M(6), desc: "A launch website for an exclusive beachfront development — fluid navigation and storytelling that drives qualified leads." },
  { title: "Corona Partners", year: "2023", tags: ["Front-End Dev", "WordPress"], img: M(3), desc: "A purpose-driven vision of real estate, translated into a modern digital presence about connection and human impact." },
  { title: "247", year: "2023", tags: ["Front-End Dev", "WordPress"], img: M(1), desc: "An experimental digital experience driven by high-end animations, embodying the brand's bold creativity." },
  { title: "Arculus", year: "2022", tags: ["Front-End Dev", "WordPress"], img: M(7), desc: "An immersive experience showcasing cutting-edge robotics and intralogistics automation." },
  { title: "Motrice", year: "2022", tags: ["Website", "UX/UI", "Full Stack"], img: M(5), desc: "From UX to full-stack build — high-performance, sustainable energy solutions made digital." },
  { title: "Our Today", year: "2022", tags: ["Website", "Custom CMS", "Mobile App"], img: M(4), desc: "A trusted digital news reference for the Caribbean, built to stand out quickly with credibility and scale." },
];

// ─── About Me ──────────────────────────────────────────────────────────────
// Swap `src` with your three real photos. `parallaxDir` flips which way the
// crop pans as the frame scrolls through the viewport; `parallaxAmount` is how
// far it travels (uv units). `zoom` is the cover zoom (gives the pan headroom).
export const ABOUT = {
  eyebrow: ["(AI/ML) ENGINEER"],
  lead:
  "Hi, I’m Kavina - An engineer with a simple goal: to build technology that gives people more time to be human.",
  images: [
    { src: M(1), alt: "On stage at a hackathon",   parallaxDir:  1, parallaxAmount: 0.08, zoom: 1.08 },
    { src: M(8), alt: "Portrait",                   parallaxDir: -1, parallaxAmount: 0.06, zoom: 1.06 },
    { src: M(3), alt: "Presenting at BuildaNow",    parallaxDir:  1, parallaxAmount: 0.08, zoom: 1.08 },
  ],
};

export const SERVICES = [
  {
    title: "Digital Experience",
    items: [
      "Product Development",
      "Websites & Platforms",
      "Mobile Applications",
      "Headless E-commerce",
      "Immersive Experience",
      "Installations & Activations",
    ],
  },
  {
    title: "Brand Strategy",
    items: [
      "Brand & Visual Identity",
      "Product Design (UX & UI)",
      "MVP Definition & Prototyping",
      "Design & Innovation Sprints",
      "Design Systems & Style Guides",
      "2D & 3D Motion Design",
    ],
  },
];

export const CLIENTS = [
  "Gatorade", "McDonald's", "Royal Caribbean", "Our Today", "Ministry of Supply",
  "Microsoft", "Amanda Braga", "Samsung", "Shopping Riomar", "Beach Park",
  "Grupo JCPM", "Iquine", "Pitú", "Salvador Shopping", "Alvoar",
  "Betânia Lácteos", "Rede D'Or", "Caoa", "Vivo", "MV Sistemas",
];

export const AWARDS = [
  { name: "Awwwards", lines: ["SOD 5x", "HM x13", "DOD 2x", "ME 1x"] },
  { name: "CSS Design Awards", lines: ["SOD x2", "DA x2"] },
  { name: "Design Rush", lines: ["SOD x1"] },
  { name: "The FWA", lines: ["SOD x3", "DOD x2"] },
  { name: "Orpetron", lines: ["SOD x2", "UI x2"] },
  { name: "GSAP", lines: ["SOW x1"] },
];

export const TECHSTACK = [
  { name: "Languages", lines: ["Python", "JavaScript", "TypeScript", "Java"] },
  { name: "AI / ML", lines: ["PyTorch", "LangChain", "OpenAI", "HuggingFace"] },
  { name: "Frontend", lines: ["React", "Next.js", "GSAP", "Tailwind"] },
  { name: "Backend", lines: ["Node.js", "Spring Boot", "FastAPI", "Express"] },
  { name: "Cloud & DevOps", lines: ["AWS", "Docker", "GCP", "Vercel"] },
  { name: "Data & Tools", lines: ["PostgreSQL", "MongoDB", "Redis", "Git"] },
];

// ─── Lore — the plots currently running ───────────────────────────────────
export const PROJECTS = [
  {
    id: "axis",
    title: "AXIS",
    subtitle: "NPCs that feel real, not just look real",
    year: "2026",
    category: "Game × Research",
    description:
      "While the industry focused on making characters look real, I focused on making them feel real. By combining neuropsychology, reinforcement learning, and generative AI, we created NPCs that can form relationships, hold grudges, adapt their personalities, and evolve through interaction.",
    tech: ["Python", "OpenAI", "LLM", "Chroma DB", "Unity"],
    github: "https://github.com/kavina-a",
    live: null,
    gallery: [
      "/projects/AXIS/image.png",
      "/projects/AXIS/image copy.png",
      "/projects/AXIS/image copy 2.png",
      "/projects/AXIS/image copy 3.png",
      "/projects/AXIS/THESIS  -0-1-.jpg",
    ],
  },
  {
    id: "mathease",
    title: "MathEase",
    subtitle: "The tutoring company, with the ops actually built",
    year: "2026",
    category: "EdTech × Teaching",
    description:
      "I tutor math. Then I got tired of running it out of a spreadsheet. MathEase is the product: teacher dashboard on one side (sessions, at-risk students, mark leaks, a question bank), student app on the other (Edexcel IGCSE path, spaced repetition, missions). If someone's slipping on fractions, the system says so before the exam does.",
    // tech: ["Next.js", "TypeScript", "React", "Tailwind"],
    github: null,
    live: null,
    gallery: [
      "/projects/matheasee/Screenshot 2026-08-20 at 18.18.44.png",
      "/projects/matheasee/Screenshot 2026-08-20 at 18.19.07.png",
      "/projects/matheasee/Screenshot 2026-08-15 at 19.47.10.png",
      "/projects/matheasee/Screenshot 2026-08-15 at 19.47.26.png",
      "/projects/matheasee/Screenshot 2026-08-15 at 19.48.17.png",
      "/projects/matheasee/Screenshot 2026-08-15 at 19.48.27.png",
      "/projects/matheasee/Screenshot 2026-08-15 at 19.48.49.png",
      "/projects/matheasee/Screenshot 2026-08-15 at 19.49.00.png",
    ],
  },
  {
    id: "cursor",
    title: "Cursor Community",
    subtitle: "Leading tech in Cursor Sri Lanka :)",
    year: "2026",
    category: "Community × Event",
    description:
      "I'm in the Cursor community, and I build for it.",
    // tech: ["Next.js", "TypeScript"],
    github: null,
    live: null,
    gallery: [
      "/projects/cursor/Screenshot 2026-08-20 at 18.16.20.png",
      "/projects/cursor/Screenshot 2026-08-20 at 18.16.52.png",
      "/projects/cursor/image.png",
      "/projects/cursor/Screenshot 2026-08-15 at 19.55.34.png",
      "/projects/cursor/Screenshot 2026-08-15 at 19.56.03.png",
    ],
  },
];

export const CONTACT_EMAIL = "hi@kavina.me";

export const CONTACT_STEPS = [
  { id: "name", label: "What's your name?", type: "text", placeholder: "your name" },
  { id: "email", label: "Where can I reply?", type: "email", placeholder: "you@email.com" },
  {
    id: "message",
    label: "What's this regarding?",
    type: "textarea",
    placeholder: "collab, a question, just saying hi…",
  },
];
