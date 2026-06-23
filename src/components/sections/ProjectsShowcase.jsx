/**
 * ProjectsShowcase — cinematic scroll-driven project gallery
 *
 * Architecture:
 *  - GSAP timeline scrubbed to a scroll-pinned trigger
 *  - Split layout: left title stack / right 3D card stage
 *  - Timeline has 4 "hold" segments + 3 transition segments
 *  - Mouse parallax via rAF lerp loop (CSS perspective + rotateX/Y)
 *  - Idle float on each card (paused for inactive ones)
 *  - Hover reveals description, tech stack, action links
 *  - CSS ambient atmosphere (no extra WebGL canvas)
 */
import { useRef, useEffect } from "react";
import {
  SiGithub,
  SiPython, SiLangchain, SiOpenai, SiFastapi, SiWebrtc,
  SiRedis, SiDocker, SiGodotengine,
  SiNextdotjs, SiTypescript, SiPostgresql, SiTailwindcss,
} from "react-icons/si";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { PROJECTS } from "../../data/site";
import ProjectGalleryRecap from "./ProjectGalleryRecap";
import "./ProjectsShowcase.css";

// ─── Tech icon map ─────────────────────────────────────────────────────────
// Brand colors from simpleicons.org; null icon falls back to a text monogram
const TECH_ICONS = {
  "Python":          { Icon: SiPython,      color: "#3776AB" },
  "LangChain":       { Icon: SiLangchain,   color: "#1C3C3C" },
  "LangGraph":       { Icon: SiLangchain,   color: "#1C3C3C" },
  "OpenAI Realtime": { Icon: SiOpenai,      color: "#412991" },
  "GPT-4o":          { Icon: SiOpenai,      color: "#412991" },
  "FastAPI":         { Icon: SiFastapi,     color: "#009688" },
  "WebRTC":          { Icon: SiWebrtc,      color: "#333333" },
  "Redis":           { Icon: SiRedis,       color: "#DC382D" },
  "Docker":          { Icon: SiDocker,      color: "#2496ED" },
  "Godot":           { Icon: SiGodotengine, color: "#478CBF" },
  "Next.js":         { Icon: SiNextdotjs,   color: "#ffffff" },
  "TypeScript":      { Icon: SiTypescript,  color: "#3178C6" },
  "PostgreSQL":      { Icon: SiPostgresql,  color: "#336791" },
  "Tailwind":        { Icon: SiTailwindcss, color: "#06B6D4" },
  // Fallbacks — shown as styled monograms
  "Chroma DB":       { Icon: null,          color: "#FF6B35" },
  "RLHF":            { Icon: null,          color: "#888888" },
  "AWS":             { Icon: null,          color: "#FF9900" },
};

function TechBadge({ name }) {
  const entry = TECH_ICONS[name] ?? { Icon: null, color: "#888" };
  const { Icon, color } = entry;

  return (
    <li className="ps__card-tech-item" style={{ "--tc": color }}>
      {Icon
        ? <Icon className="ps__tech-svg" aria-hidden="true" />
        : <span className="ps__tech-mono" aria-hidden="true">{name.slice(0, 3).toUpperCase()}</span>
      }
      <span className="ps__tech-label">{name}</span>
    </li>
  );
}

// ─── Timeline constants ────────────────────────────────────────────────────
const HOLD  = 1.5;  // timeline seconds each project is fully visible
const TRANS = 1.0;  // timeline seconds each transition takes
const N     = PROJECTS.length; // 4

const TOTAL_DURATION = N * HOLD + Math.max(0, N - 1) * TRANS;

const TS = Array.from({ length: Math.max(0, N - 1) }, (_, i) => HOLD + i * (HOLD + TRANS));

const THRESHOLDS = TS.map((t) => (t + TRANS * 0.5) / TOTAL_DURATION);

const getActiveIndex = (progress) => {
  if (N <= 1) return 0;
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (progress < THRESHOLDS[i]) return i;
  }
  return N - 1;
};

// Organic float params per card (avoids mechanical uniformity)
const FLOAT_PARAMS = [
  { amt: 11, dur: 3.9 },
  { amt: 13, dur: 4.2 },
  { amt: 10, dur: 3.7 },
  { amt: 12, dur: 4.5 },
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function ProjectsShowcase() {
  const sectionRef      = useRef(null);
  const cardsRef        = useRef([]);
  const tiltsRef        = useRef([]);
  const floatsRef       = useRef([]);
  const titlesRef       = useRef([]);
  const counterRef      = useRef(null);
  const progressFillRef = useRef(null);
  const activeRef       = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards  = cardsRef.current.filter(Boolean);
    const tilts  = tiltsRef.current.filter(Boolean);
    const floats = floatsRef.current.filter(Boolean);
    const titles = titlesRef.current.filter(Boolean);
    const fill   = progressFillRef.current;
    const counter = counterRef.current;

    if (cards.length < N) return;

    // ── Initial visual states ────────────────────────────────────
    gsap.set(cards[0], { opacity: 1, scale: 1, pointerEvents: "auto"  });
    gsap.set(tilts[0], { rotateX: 0, rotateY: 0, z: 0, filter: "blur(0px)" });
    gsap.set(floats[0], { y: 0 });
    gsap.set(titles[0], { opacity: 1, scale: 1 });

    for (let i = 1; i < N; i++) {
      gsap.set(cards[i],  { opacity: 0, scale: 0.9, pointerEvents: "none" });
      gsap.set(tilts[i],  { rotateY: 9, rotateX: -5, z: 100, filter: "blur(8px)" });
      gsap.set(floats[i], { y: 0 });
      gsap.set(titles[i], { opacity: 0.13, scale: 0.85 });
    }

    if (fill)    gsap.set(fill,    { scaleX: 1, transformOrigin: "left center" });
    if (counter) gsap.set(counter, { innerText: 1 });

    // ── Idle float animations ────────────────────────────────────
    const floatTls = floats.map((el, i) => {
      const params = FLOAT_PARAMS[i % FLOAT_PARAMS.length];
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      tl.to(el, {
        y: -params.amt,
        duration: params.dur,
        ease: "sine.inOut",
      });
      if (i !== 0) tl.pause();
      return tl;
    });

    let st = null;
    let tl = null;

    if (N > 1) {
      // ── Master GSAP timeline (scrubbed by ScrollTrigger) ─────────
      tl = gsap.timeline({ defaults: { ease: "none" } });

      const buildTransition = (from, to, tStart) => {
      const isForward = to > from;
      const exitRY    = isForward ? -16 : 16;
      const exitRX    = isForward ?   7 : -7;
      const enterRY   = isForward ?  10 : -10;
      const enterRX   = isForward ?  -5 :   5;

      // ─ Exit
      tl
        .to(
          tilts[from],
          {
            rotateY: exitRY,
            rotateX: exitRX,
            z: -180,
            filter: "blur(5px)",
            ease: "power3.in",
            duration: TRANS * 0.55,
          },
          tStart
        )
        .to(
          cards[from],
          { opacity: 0, scale: 0.84, ease: "power3.in", duration: TRANS * 0.5 },
          tStart
        )

        // ─ Enter
        .to(
          tilts[to],
          {
            rotateY: 0,
            rotateX: 0,
            z: 0,
            filter: "blur(0px)",
            ease: "expo.out",
            duration: TRANS * 0.75,
          },
          tStart + TRANS * 0.28
        )
        .to(
          cards[to],
          {
            opacity: 1,
            scale: 1,
            pointerEvents: "auto",
            ease: "expo.out",
            duration: TRANS * 0.75,
          },
          tStart + TRANS * 0.28
        )

        // ─ Titles
        .to(
          titles[from],
          { opacity: 0.13, scale: 0.85, ease: "power2.out", duration: TRANS * 0.5 },
          tStart
        )
        .to(
          titles[to],
          { opacity: 1, scale: 1, ease: "power2.out", duration: TRANS * 0.55 },
          tStart + TRANS * 0.22
        );

      // ─ Progress fill + counter
      if (fill) {
        tl.to(
          fill,
          { scaleX: (to + 1) / N, ease: "expo.out", duration: TRANS * 0.5 },
          tStart + TRANS * 0.1
        );
      }
      if (counter) {
        tl.to(
          counter,
          { innerText: to + 1, snap: { innerText: 1 }, ease: "none", duration: TRANS * 0.3 },
          tStart + TRANS * 0.35
        );
      }
    };

      for (let i = 0; i < N - 1; i++) {
        buildTransition(i, i + 1, TS[i]);
      }

      const scrollEnd = `+=${Math.round(TOTAL_DURATION * 65)}%`;

      st = ScrollTrigger.create({
        trigger:      section,
        start:        "top top",
        end:          scrollEnd,
        pin:          true,
        anticipatePin: 1,
        scrub:        1.8,
        animation:    tl,
        onUpdate(self) {
          activeRef.current = getActiveIndex(self.progress);
          floatTls.forEach((ftl, i) => {
            if (i === activeRef.current) {
              if (ftl.paused()) ftl.resume();
            } else if (!ftl.paused()) {
              ftl.pause();
            }
          });
        },
      });
    } else {
      activeRef.current = 0;
      floatTls[0]?.resume();
    }

    // ── Mouse parallax (rAF lerp) ───────────────────────────────
    let mouseX = 0, mouseY = 0, lerpX = 0, lerpY = 0, rafId;
    const LERP_FACTOR = 0.055;
    const MAX_RX = 14, MAX_RY = 18;

    const tick = () => {
      lerpX += (mouseX - lerpX) * LERP_FACTOR;
      lerpY += (mouseY - lerpY) * LERP_FACTOR;

      const activeTilt = tiltsRef.current[activeRef.current];
      // Skip while a transition tween is in progress
      if (activeTilt && !gsap.isTweening(activeTilt)) {
        gsap.set(activeTilt, {
          rotateX: Math.max(-MAX_RX, Math.min(MAX_RX, lerpY * 0.014)),
          rotateY: Math.max(-MAX_RY, Math.min(MAX_RY, lerpX * 0.018)),
        });
      }
      rafId = requestAnimationFrame(tick);
    };

    const onMouseMove = (e) => {
      const r = section.getBoundingClientRect();
      mouseX = e.clientX - r.left  - r.width  * 0.5;
      mouseY = e.clientY - r.top   - r.height * 0.5;
    };

    const onMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
      const activeTilt = tiltsRef.current[activeRef.current];
      if (activeTilt) {
        gsap.to(activeTilt, {
          rotateX: 0,
          rotateY: 0,
          duration: 1.8,
          ease: "elastic.out(1, 0.4)",
        });
      }
    };

    section.addEventListener("mousemove", onMouseMove);
    section.addEventListener("mouseleave", onMouseLeave);
    rafId = requestAnimationFrame(tick);

    // ── Hover: reveal card details ───────────────────────────────
    cards.forEach((card, i) => {
      const subtitle = card.querySelector(".ps__card-subtitle");
      const details  = card.querySelector(".ps__card-details");
      const desc     = card.querySelector(".ps__card-desc");
      const techList = card.querySelectorAll(".ps__card-tech-item");
      const actions  = card.querySelector(".ps__card-actions");

      if (!details || !subtitle) return;

      const subtitleHeight = subtitle.offsetHeight;

      gsap.set(subtitle, { maxHeight: subtitleHeight, overflow: "hidden" });
      gsap.set(details, {
        opacity: 0,
        maxHeight: 0,
        marginTop: 0,
        pointerEvents: "none",
        overflow: "hidden",
      });

      const enterTl = gsap.timeline({ paused: true });

      enterTl
        .to(
          subtitle,
          {
            opacity: 0,
            maxHeight: 0,
            marginBottom: 0,
            duration: 0.26,
            ease: "power2.inOut",
          },
          0
        )
        .to(
          details,
          {
            opacity: 1,
            maxHeight: 320,
            marginTop: 14,
            pointerEvents: "auto",
            duration: 0.38,
            ease: "power2.out",
          },
          0.1
        )
        .fromTo(
          desc,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" },
          0.16
        )
        .fromTo(
          techList,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.28, ease: "power2.out" },
          0.26
        );

      if (actions) {
        enterTl.fromTo(
          actions,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.26, ease: "power2.out" },
          0.38
        );
      }

      const onEnter = () => {
        if (i === activeRef.current) enterTl.play();
      };
      const onLeave = () => enterTl.reverse();

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
    });

    // ── Cleanup ──────────────────────────────────────────────────
    return () => {
      section.removeEventListener("mousemove", onMouseMove);
      section.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafId);
      floatTls.forEach((t) => t.kill());
      st?.kill();
      tl?.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="ps" id="projects" aria-label="Selected Projects">
      {/* ── Ambient atmosphere ───────────────────────────────── */}
      <div className="ps__atmosphere" aria-hidden="true">
        <div className="ps__orb ps__orb--1" />
        <div className="ps__orb ps__orb--2" />
        <div className="ps__orb ps__orb--3" />
        <div className="ps__grain" />
      </div>

      {/* ── Left — title navigation ──────────────────────────── */}
      <div className="ps__left">
        <p className="ps__eyebrow">Selected Work</p>

        <nav className="ps__title-stack" aria-label="Project list">
          {PROJECTS.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => (titlesRef.current[i] = el)}
              className="ps__title"
            >
              <span className="ps__title-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="ps__title-text">{p.title}</span>
            </div>
          ))}
        </nav>

        <div className="ps__meta">
          {N > 1 && (
            <div className="ps__progress-track" aria-hidden="true">
              <div ref={progressFillRef} className="ps__progress-fill" />
            </div>
          )}
          <p className="ps__counter" aria-live="polite" aria-atomic="true">
            <span ref={counterRef} className="ps__counter-n">1</span>
            {N > 1 && <span className="ps__counter-sep"> / {N}</span>}
          </p>
        </div>
      </div>

      {/* ── Right — 3D card showcase ─────────────────────────── */}
      <div className="ps__right">
        <div className="ps__stage">
          {PROJECTS.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => (cardsRef.current[i] = el)}
              className="ps__card"
              style={{ "--accent": p.accent }}
            >
              {/* Float layer — y oscillation */}
              <div
                ref={(el) => (floatsRef.current[i] = el)}
                className="ps__card-float"
              >
                {/* Tilt layer — rotateX / rotateY / z (mouse + transitions) */}
                <div
                  ref={(el) => (tiltsRef.current[i] = el)}
                  className="ps__card-tilt"
                >
                  {/* Visual card surface */}
                  <div className="ps__card-inner">
                    {/* Background image */}
                    <div className="ps__card-media">
                      {p.gallery?.length > 1 ? (
                        <ProjectGalleryRecap images={p.gallery} alt={p.title} />
                      ) : (
                        <img src={p.img} alt={p.title} loading="lazy" draggable="false" />
                      )}
                    </div>

                    {/* Gradient veil */}
                    <div className="ps__card-veil" aria-hidden="true" />

                    {/* Glass shimmer */}
                    <div className="ps__card-shimmer" aria-hidden="true" />

                    {/* Top label row */}
                    <header className="ps__card-header">
                      <span className="ps__card-year">{p.year}</span>
                      {p.github && (
                        <a
                          href={p.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ps__card-github"
                          aria-label="View on GitHub"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SiGithub />
                        </a>
                      )}
                    </header>

                    {/* Bottom panel — subtitle, rule, and hover details stack */}
                    <div className="ps__card-footer">
                      <h3 className="ps__card-subtitle">{p.subtitle}</h3>
                      <div className="ps__card-rule" aria-hidden="true" />
                      <div
                        className="ps__card-details"
                        aria-label={`${p.title} details`}
                      >
                        <p className="ps__card-desc">{p.description}</p>

                        <ul
                          className="ps__card-tech"
                          aria-label="Technologies used"
                        >
                          {p.tech.map((t) => (
                            <TechBadge key={t} name={t} />
                          ))}
                        </ul>

                        {p.live && (
                          <div className="ps__card-actions">
                            <a
                              href={p.live}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ps__card-btn ps__card-btn--accent"
                            >
                              Live ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {N > 1 && (
          <p className="ps__hint" aria-hidden="true">
            <span className="ps__hint-arrow">↓</span> Scroll to explore
          </p>
        )}
      </div>
    </section>
  );
}
