import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { TECHSTACK } from "../../data/site";
import "./AwardsCinematic.css";

// const GALLERY = "/techstack-gallery";
//
// const BASE = {
//   left: [
//     `${GALLERY}/techstack-01.png`,
//     `${GALLERY}/techstack-02.png`,
//     `${GALLERY}/techstack-03.png`,
//   ],
//   midTop: [
//     `${GALLERY}/techstack-04.png`,
//     `${GALLERY}/techstack-06.png`,
//   ],
//   midBot: [
//     `${GALLERY}/techstack-03.png`,
//     `${GALLERY}/techstack-07.png`,
//   ],
//   right: [
//     `${GALLERY}/techstack-08.png`,
//     `${GALLERY}/techstack-04.png`,
//     `${GALLERY}/techstack-02.png`,
//   ],
// };
//
// const COPIES = 3;
// const repeat = (arr, n) => Array.from({ length: n }, () => arr).flat();
// const IMGS = {
//   left:   repeat(BASE.left,   COPIES),
//   midTop: repeat(BASE.midTop, COPIES),
//   midBot: repeat(BASE.midBot, COPIES),
//   right:  repeat(BASE.right,  COPIES),
// };

export default function AwardsCinematic() {
  const sectionRef  = useRef(null);
  // const leftRef     = useRef(null);
  // const rightRef    = useRef(null);
  // const midTopRef   = useRef(null);
  // const midBotRef   = useRef(null);
  const revealBgRef = useRef(null);   // background fill — animates before text
  const labelRef    = useRef(null);   // "Tech Stack" eyebrow
  const headingRef  = useRef(null);   // word-split heading
  const ruleRef     = useRef(null);   // hairline — only during text reveal
  const listRef     = useRef(null);   // stacked tech items

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // const left     = leftRef.current;
    // const right    = rightRef.current;
    // const midTop   = midTopRef.current;
    // const midBot   = midBotRef.current;
    const revealBg = revealBgRef.current;
    const label    = labelRef.current;
    const heading  = headingRef.current;
    const rule     = ruleRef.current;
    const list     = listRef.current;
    const words    = heading.querySelectorAll(".ac-word");
    const items    = list.querySelectorAll("li");

    // gsap.set(left,   { y: 70,  x: -12, scale: 0.85, rotation: -2.4 });
    // gsap.set(right,  { y: 18,  x:  16, scale: 0.85, rotation:  2.8 });
    // gsap.set(midTop, { y: "-32vh",     scale: 0.88, rotation:  1.1 });
    // gsap.set(midBot, { y:  "32vh",     scale: 0.88, rotation: -1.6 });
    gsap.set(revealBg, { opacity: 1 });
    gsap.set(label,    { y: 24, opacity: 0 });
    gsap.set(words,    { yPercent: 110, opacity: 0 });
    gsap.set(rule,     { scaleX: 0 });
    gsap.set(items,    { y: 28, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // // Phase 1 — gather
    // tl
    //   .to(left,   { y: "+=50vh", x: 40,  scale: 1.32, rotation: -4.5, duration: 2.05 }, 0)
    //   .to(right,  { y: "+=64vh", x: -40, scale: 1.32, rotation:  4.2, duration: 2.05 }, 0)
    //   .to(midTop, { y:  "48vh",          scale: 1.22, rotation: -1.2, duration: 1.2 }, 0)
    //   .to(midBot, { y: "-48vh",          scale: 1.22, rotation:  1.6, duration: 1.2 }, 0)
    //
    // // Phase 2 — split
    //   .to(midTop, { y: "-85vh", scale: 1.38, rotation: -2.2, duration: 0.85 }, 1.2)
    //   .to(midBot, { y:  "85vh", scale: 1.38, rotation:  2.6, duration: 0.85 }, 1.2)
    //
    // // Phase 3 — sweep the prints aside
    //   .to(left,   { x: "-130vw", rotation: -18, ease: "power3.in", duration: 1.0 }, 2.05)
    //   .to(right,  { x:  "130vw", rotation:  16, ease: "power3.in", duration: 1.0 }, 2.05)
    //   .to(midTop, { y: "-360vh", x: "10vw", rotation: -9, ease: "power3.in", duration: 1.0 }, 2.05)
    //   .to(midBot, { y:  "360vh", x: "-8vw", rotation:  8, ease: "power3.in", duration: 1.0 }, 2.05)

    tl
      .to(label, { y: 0, opacity: 1, ease: "expo.out", duration: 0.55 }, 0)
      .to(words, {
        yPercent: 0,
        opacity: 1,
        stagger: 0.055,
        ease: "expo.out",
        duration: 0.75,
      }, 0.15)
      .to(rule, { scaleX: 1, ease: "power2.inOut", duration: 0.55 }, 0.45)
      .to(items, {
        y: 0,
        opacity: 1,
        stagger: 0.07,
        ease: "power3.out",
        duration: 0.6,
      }, 0.55);

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top 72%",
      end: "top 18%",
      scrub: 0.8,
      animation: tl,
    });

    return () => {
      st.kill();
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="awards-cinematic" id="techstack">
      <div className="awards-cinematic__stage">

        {/* ── Left column ──
        <div ref={leftRef} className="awards-col awards-col--left">
          {IMGS.left.map((src, i) => (
            <div className="awards-frame" key={i}>
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </div> */}

        {/* ── Middle column: two groups that split vertically ──
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
        </div> */}

        {/* ── Right column ──
        <div ref={rightRef} className="awards-col awards-col--right">
          {IMGS.right.map((src, i) => (
            <div className="awards-frame" key={i}>
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </div> */}

        {/* ── Reveal: background + content animated independently ── */}
        <div className="awards-cinematic__reveal">
          <div ref={revealBgRef} className="awards-cinematic__reveal-bg" />
          <div className="awards-cinematic__reveal-content">
            <p ref={labelRef} className="awards-cinematic__label">Tech Stack</p>
            <h2 ref={headingRef} className="awards-cinematic__heading">
              <span className="ac-line">
                <span className="ac-word">The</span>{" "}
                <span className="ac-word">tools</span>{" "}
                <span className="ac-word">I</span>
              </span>
              <span className="ac-line">
                <span className="ac-word">actually</span>{" "}
                <span className="ac-word">reach</span>{" "}
                <span className="ac-word">for.</span>
              </span>
            </h2>
            <div ref={ruleRef} className="awards-cinematic__rule" aria-hidden="true" />
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
