import { useEffect, useRef } from "react";
import Reveal from "../ui/Reveal";
import PhotoBurst from "./PhotoBurst";
import { ABOUT, MYPICS } from "../../data/site";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import "./AboutMe.css";

// About Me — hand-off from the black "Featured Work" world into a bright
// white stage. Three frames continuously cycle through all portrait photos.
export default function AboutMe() {
  const sectionRef = useRef(null);
  const sheetRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // black → grey → white as section enters viewport
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

      // text colour follows the background fade
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

        <PhotoBurst images={MYPICS} />

        <div className="aboutme__body">
          <Reveal>
            <p>{ABOUT.body}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
