import { useState } from "react";
import { SiGithub, SiPython, SiOpenai, SiNextdotjs, SiTypescript, SiReact, SiTailwindcss } from "react-icons/si";
import MarqueeStack from "./MarqueeStack";
import { PROJECTS } from "../../data/site";
import "./ProjectsShowcase.css";

const TECH_ICONS = {
  Python: { Icon: SiPython, color: "#3776AB" },
  OpenAI: { Icon: SiOpenai, color: "#412991" },
  Unity: { Icon: null, color: "#111111" },
  LLM: { Icon: null, color: "#5B4B8A" },
  "Chroma DB": { Icon: null, color: "#FF6B35" },
  "Next.js": { Icon: SiNextdotjs, color: "#111111" },
  TypeScript: { Icon: SiTypescript, color: "#3178C6" },
  React: { Icon: SiReact, color: "#61DAFB" },
  Tailwind: { Icon: SiTailwindcss, color: "#06B6D4" },
};

function TechBadge({ name }) {
  const entry = TECH_ICONS[name] ?? { Icon: null, color: "#6a6660" };
  const { Icon, color } = entry;

  return (
    <li className="stack-hero__tech-item" style={{ "--tc": color }}>
      {Icon ? (
        <Icon className="stack-hero__tech-svg" aria-hidden="true" />
      ) : (
        <span className="stack-hero__tech-mono" aria-hidden="true">
          {name.slice(0, 3).toUpperCase()}
        </span>
      )}
      <span>{name}</span>
    </li>
  );
}

export default function ProjectsShowcase() {
  const [index, setIndex] = useState(0);
  const n = PROJECTS.length;
  const project = PROJECTS[index];

  const go = (dir) => setIndex((i) => (i + dir + n) % n);

  return (
    <section className="stack-hero" id="lore" aria-label="Lore">
      <div className="stack-hero__inner">
        <div className="stack-hero__copy">
          <span className="stack-hero__eyebrow">Lore</span>

          <p className="stack-hero__meta" key={`meta-${project.id}`}>
            <span>{project.year}</span>
            <span aria-hidden="true">·</span>
            <span>{project.category}</span>
          </p>
          <h2 className="stack-hero__title" key={`title-${project.id}`}>
            {project.title}
          </h2>
          <p className="stack-hero__sub" key={`sub-${project.id}`}>
            {project.subtitle}
          </p>

          {project.description && (
            <p className="stack-hero__desc" key={`desc-${project.id}`}>
              {project.description}
            </p>
          )}

          {project.tech?.length > 0 && (
            <ul className="stack-hero__tech" key={`tech-${project.id}`}>
              {project.tech.map((name) => (
                <TechBadge key={name} name={name} />
              ))}
            </ul>
          )}

          {project.github && (
            <a
              className="stack-hero__git"
              href={project.github}
              target="_blank"
              rel="noreferrer"
              key={`git-${project.id}`}
            >
              <SiGithub aria-hidden="true" />
              GitHub
            </a>
          )}

          <div className="stack-hero__nav">
            <button
              type="button"
              className="stack-hero__arrow"
              onClick={() => go(-1)}
              aria-label="Previous story"
            >
              ←
            </button>

            <div
              className="stack-hero__dots"
              role="tablist"
              aria-label="Select lore"
            >
              {PROJECTS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={p.title}
                  className={`stack-hero__dot${i === index ? " is-active" : ""}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>

            <button
              type="button"
              className="stack-hero__arrow"
              onClick={() => go(1)}
              aria-label="Next story"
            >
              →
            </button>
          </div>
        </div>

        <div className="stack-hero__stage">
          <MarqueeStack key={project.id} photos={project.gallery} />
        </div>
      </div>
    </section>
  );
}
