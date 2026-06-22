import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { TECHSTACK } from "../../data/site";
import "./AwardsCinematic.css";

const GALLERY = "/techstack-gallery";

const BASE = {
  left: [
    `${GALLERY}/techstack-01.png`,
    `${GALLERY}/techstack-02.png`,
    `${GALLERY}/techstack-03.png`,
  ],
  midTop: [
    `${GALLERY}/techstack-04.png`,
    `${GALLERY}/techstack-06.png`,
  ],
  midBot: [
    `${GALLERY}/techstack-03.png`,
    `${GALLERY}/techstack-07.png`,
  ],
  right: [
    `${GALLERY}/techstack-08.png`,
    `${GALLERY}/techstack-04.png`,
    `${GALLERY}/techstack-02.png`,
  ],
};

const COPIES = 3;
const repeat = (arr, n) => Array.from({ length: n }, () => arr).flat();
const IMGS = {
  left:   repeat(BASE.left,   COPIES),
  midTop: repeat(BASE.midTop, COPIES),
  midBot: repeat(BASE.midBot, COPIES),
  right:  repeat(BASE.right,  COPIES),
};

export default function AwardsCinematic() {
  const sectionRef  = useRef(null);
  const leftRef     = useRef(null);
  const rightRef    = useRef(null);
  const midTopRef   = useRef(null);
  const midBotRef   = useRef(null);
  const revealBgRef = useRef(null);   // background fill — animates before text
  const labelRef    = useRef(null);   // "Tech Stack" eyebrow
  const headingRef  = useRef(null);   // word-split heading
  const listRef     = useRef(null);   // stacked tech items

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const left     = leftRef.current;
    const right    = rightRef.current;
    const midTop   = midTopRef.current;
    const midBot   = midBotRef.current;
    const revealBg = revealBgRef.current;
    const label    = labelRef.current;
    const heading  = headingRef.current;
    const list     = listRef.current;
    const words    = heading.querySelectorAll(".ac-word");
    const items    = list.querySelectorAll("li");

    // ── Initial state ──────────────────────────────────────────────
    // Columns start at 0.85 scale — visually smaller, set away from
    // the edges by the stage padding + reduced size. Phase 1 zooms
    // them in to 1.35, closing the visual gap. The stage clips overflow
    // so the effect reads as a progressive camera push-in.
    gsap.set([left, right],    { y: 60,  scale: 0.85 });
    gsap.set([midTop, midBot], { y: -40, scale: 0.85 });
    gsap.set(revealBg, { opacity: 0 });
    gsap.set(label,    { y: 24, opacity: 0 });
    gsap.set(words,    { yPercent: 110, opacity: 0 });
    gsap.set(items,    { y: 28, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // Phase 1 — parallax drift + progressive zoom-in
    // Each column scrolls at its own vertical speed while all columns
    // uniformly scale from 0.85 → 1.35. The stage clips the overflow
    // so this reads as images zooming toward the viewer, closing the
    // gap between the columns as you scroll.
    tl
      .to(left,   { y: "+=55vh", scale: 1.35, duration: 1.6 }, 0)
      .to(right,  { y: "+=70vh", scale: 1.35, duration: 1.6 }, 0)
      .to(midTop, { y: "-=80vh", scale: 1.35, duration: 1.6 }, 0)
      .to(midBot, { y: "-=65vh", scale: 1.35, duration: 1.6 }, 0)

    // Phase 2 — slide-out at full scale
    // Left/right fly off screen horizontally.
    // midTop exits through the TOP  (-=350vh from its phase-1 position).
    // midBot exits through the BOTTOM (+=420vh from its phase-1 position).
    // Net from natural position: midTop ≈ -430vh, midBot ≈ +355vh.
    // Both clear the 100vh stage by a large margin before revealBg appears.
      .to(left,   { x: "-120vw", ease: "power3.in", duration: 1.0 }, 1.6)
      .to(right,  { x:  "120vw", ease: "power3.in", duration: 1.0 }, 1.6)
      .to(midTop, { y: "-=350vh", ease: "power3.in", duration: 1.0 }, 1.6)
      .to(midBot, { y:  "+=420vh", ease: "power3.in", duration: 1.0 }, 1.6)

    // Phase 3 — staggered text reveal
    // Background only starts AFTER slide-out ends (t=2.6 + buffer).
    // 3a: background wipes in
      .to(revealBg, { opacity: 1, ease: "none", duration: 0.25 }, 2.75)
    // 3b: eyebrow slides up
      .to(label, { y: 0, opacity: 1, ease: "expo.out", duration: 0.55 }, 2.95)
    // 3c: heading words clip up one by one
      .to(words, {
        yPercent: 0,
        opacity: 1,
        stagger: 0.055,
        ease: "expo.out",
        duration: 0.75,
      }, 3.15)
    // 3d: list rows stagger in
      .to(items, {
        y: 0,
        opacity: 1,
        stagger: 0.07,
        ease: "power3.out",
        duration: 0.6,
      }, 3.65);

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=460%",
      pin: true,
      scrub: 0.8,
      animation: tl,
      anticipatePin: 1,
    });

    return () => {
      st.kill();
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="awards-cinematic" id="techstack">
      <div className="awards-cinematic__stage">

        {/* ── Left column ── */}
        <div ref={leftRef} className="awards-col awards-col--left">
          {IMGS.left.map((src, i) => (
            <div className="awards-frame" key={i}>
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </div>

        {/* ── Middle column: two groups that split vertically ── */}
        <div className="awards-col awards-col--mid">
          <div ref={midTopRef} className="awards-col__group">
            {IMGS.midTop.map((src, i) => (
              <div className="awards-frame" key={i}>
                <img src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
          <div ref={midBotRef} className="awards-col__group">
            {IMGS.midBot.map((src, i) => (
              <div className="awards-frame" key={i}>
                <img src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ── */}
        <div ref={rightRef} className="awards-col awards-col--right">
          {IMGS.right.map((src, i) => (
            <div className="awards-frame" key={i}>
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </div>

        {/* ── Reveal: background + content animated independently ── */}
        <div className="awards-cinematic__reveal">
          <div ref={revealBgRef} className="awards-cinematic__reveal-bg" />
          <div className="awards-cinematic__reveal-content">
            <p ref={labelRef} className="awards-cinematic__label">Tech Stack</p>
            <h2 ref={headingRef} className="awards-cinematic__heading">
              <span className="ac-line">
                <span className="ac-word">The</span>{" "}
                <span className="ac-word">right</span>{" "}
                <span className="ac-word">tools,</span>{" "}
                <span className="ac-word">chosen</span>{" "}
                <span className="ac-word">with</span>
              </span>
              <span className="ac-line">
                <span className="ac-word">intent</span>{" "}
                <span className="ac-word">—</span>{" "}
                <span className="ac-word">not</span>{" "}
                <span className="ac-word">convention.</span>
              </span>
            </h2>
            <ul ref={listRef} className="awards-cinematic__list">
              {TECHSTACK.map((t) => (
                <li key={t.name} className="awards-cinematic__item">
                  <span className="awards-cinematic__name">{t.name}</span>
                  <span className="awards-cinematic__counts">
                    {t.lines.map((line) => (
                      <span key={line} className="awards-cinematic__badge">{line}</span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
