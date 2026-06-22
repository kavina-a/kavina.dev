const MYPICS = [
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
    tags: ["JKH · Sysco LABS · Brandix", "Aug 2024"],
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
  eyebrow: ["(THE) PERSON", "BEHIND THE PIXELS"],
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

// ─── Projects ──────────────────────────────────────────────────────────────
export const PROJECTS = [
  {
    id: "voice-ai",
    title: "VOICE AI AGENTS",
    subtitle: "Agents that actually pick up",
    year: "2025",
    category: "Voice × AI",
    description:
      "Sub-200ms latency — fast enough to feel human. Scheduled the calls, scored the voices, and shipped to prod with logs that actually tell you something went wrong.",
    tech: ["Python", "LangChain", "OpenAI Realtime", "FastAPI", "WebRTC"],
    github: "https://github.com/kavina-a",
    live: null,
    img: M(2),
    accent: "#6affb4",
  },
  {
    id: "multi-agent",
    title: "MULTI-AGENT SYSTEMS",
    subtitle: "Agents that hand things off",
    year: "2025",
    category: "Agent Platform",
    description:
      "Agents that plan, sub-delegate, and recover when they're wrong. Built on LangGraph with state machines that know when to ask for help instead of hallucinating an answer.",
    tech: ["LangGraph", "Python", "Redis", "Docker", "GPT-4o"],
    github: "https://github.com/kavina-a",
    live: null,
    img: M(5),
    accent: "#a78bfa",
  },
  {
    id: "emotional-npc",
    title: "EMOTIONAL NPC AI",
    subtitle: "NPCs with memory and moods",
    year: "2026",
    category: "Game × Research",
    description:
      "Characters that remember your choices and react like it. Episodic memory plus emotional state so they feel like people in a world, not dialogue trees in a database.",
    tech: ["Python", "Godot", "LLM", "Chroma DB", "RLHF"],
    github: "https://github.com/kavina-a",
    live: null,
    img: M(7),
    accent: "#ff6b6b",
  },
  {
    id: "mathease",
    title: "MATHEASE PLATFORM",
    subtitle: "Tutoring that meets you where you are",
    year: "2024",
    category: "EdTech · Product",
    description:
      "Problem trees built from what you already know, not what a curriculum assumed you would. Adaptive in the actual sense — it changes path when you get it wrong, not just when you ask.",
    tech: ["Next.js", "TypeScript", "PostgreSQL", "AWS", "Tailwind"],
    github: "https://github.com/kavina-a",
    live: null,
    img: M(3),
    accent: "#fbbf24",
  },
];

export const CONTACT_EMAIL = "hi@kavina.me";

export const CONTACT_STEPS = [
  { id: "name", label: "Hi, my name is", type: "text", placeholder: "your name" },
  { id: "email", label: "You can email me at", type: "email", placeholder: "you@email.com" },
  {
    id: "project", label: "My project is a", type: "chips",
    options: ["website development", "mobile app", "e-commerce", "2D / 3D", "product design", "immersive experience", "brand & visual identity", "motion design", "installation / activation"],
  },
  {
    id: "budget", label: "My budget range is between", type: "chips",
    options: ["up to 5k", "5k to 20k", "20 to 50k", "50k to 100k", "over 100k"],
  },
  { id: "notes", label: "Additional note", type: "textarea", placeholder: "tell me more…" },
];
