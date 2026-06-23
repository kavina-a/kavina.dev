import { useEffect, useRef } from "react";
import Reveal from "../ui/Reveal";
import FluidImage from "./liquid/FluidImage";
import { ABOUT } from "../../data/site";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import "./AboutMe.css";

// About Me — the hand-off from the black "Featured Work" world into a bright
// white stage holding three portraits of me.
//
//   • BACKGROUND  — a white sheet sits over the black base and scrubs from
//     opacity 0 → 1 as the section scrolls in. Halfway it reads grey, so the
//     page glides black → grey → white. Text colour follows the same curve.
//
//   • FRAMES      — the three frames drift up at slightly different speeds for
//     the layered "smooth" feel; the portrait *inside* each frame pans with
//     scroll (LiquidImage) so you scroll "into" the person and the face
//     resolves as the frame centres.
//
//   • HOVER       — LiquidImage adds the liquid drag distortion per frame.
const POSITIONS = ["aboutme__frame--left", "aboutme__frame--center", "aboutme__frame--right"];
const FRAME_DRIFT = [70, 0, 120]; // px of extra upward drift across the scroll

export default function AboutMe() {
  const sectionRef = useRef(null);
  const sheetRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // black → grey → white as the section enters the viewport
      gsap.fromTo(
        sheetRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top 18%",
            scrub: true,
          },
        }
      );

      // text colour fades from light (on black) to ink (on white) in lockstep
      gsap.fromTo(
        contentRef.current,
        { color: "#f4f4f2" },
        {
          color: "#0a0a0a",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top 30%",
            scrub: true,
          },
        }
      );

      // gentle per-frame parallax drift (the whole frame, on top of the
      // in-frame image pan handled by the shader)
      gsap.utils.toArray(".aboutme__gallery .fluid-image").forEach((el, i) => {
        const drift = FRAME_DRIFT[i] ?? 0;
        gsap.fromTo(
          el,
          { y: drift },
          {
            y: -drift,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section aboutme" id="about" ref={sectionRef}>
      <div className="aboutme__sheet" ref={sheetRef} aria-hidden />

      <div className="aboutme__content" ref={contentRef}>
        <div className="aboutme__eyebrow">
          {ABOUT.eyebrow.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>

        <Reveal as="words" className="aboutme__lead">
          {ABOUT.lead}
        </Reveal>

        <div className="aboutme__gallery">
          {ABOUT.images.map((img, i) => (
            <FluidImage
              key={img.src}
              src={img.src}
              alt={img.alt}
              className={POSITIONS[i] || ""}
              data-cursor
              options={{
                parallaxDir: img.parallaxDir,
                parallaxAmount: img.parallaxAmount,
                zoom: img.zoom,
              }}
            />
          ))}
        </div>

        <div className="aboutme__body">
          <Reveal>
            <p>{ABOUT.body}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
