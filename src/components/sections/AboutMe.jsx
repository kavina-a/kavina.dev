import { useEffect, useRef } from "react";
import Reveal from "../ui/Reveal";
import PhotoBurst from "./PhotoBurst";
import { ABOUT, MYPICS } from "../../data/site";
import { gsap } from "../../lib/gsap";
import "./AboutMe.css";

const LEAD_TOKENS = ABOUT.lead.split(/(\s+)/);

export default function AboutMe() {
  const sectionRef = useRef(null);
  const sheetRef = useRef(null);
  const eyebrowRef = useRef(null);
  const leadRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const lead = leadRef.current;
    if (!section || !lead) return;

    const ctx = gsap.context(() => {
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

      gsap.fromTo(
        eyebrowRef.current,
        { color: "#f4f4f2" },
        {
          color: "#0a0a0a",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top 18%",
            scrub: true,
          },
        }
      );

      const words = lead.querySelectorAll(".aboutme__ink");
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReduced) {
        gsap.set(words, { color: "#0a0a0a" });
        return;
      }

      gsap.set(words, { color: "rgba(10, 10, 10, 0.08)" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: lead,
          start: "top 78%",
          end: "bottom 42%",
          scrub: 0.35,
        },
      });

      tl.to(words, {
        color: "#0a0a0a",
        stagger: 0.06,
        ease: "none",
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section aboutme" id="about" ref={sectionRef}>
      <div className="aboutme__sheet" ref={sheetRef} aria-hidden />

      <div className="aboutme__content">
        <div className="aboutme__eyebrow" ref={eyebrowRef}>
          {ABOUT.eyebrow.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>

        <p className="aboutme__lead" ref={leadRef}>
          {LEAD_TOKENS.map((token, i) =>
            /^\s+$/.test(token) ? (
              token
            ) : (
              <span className="aboutme__ink" key={i}>
                {token}
              </span>
            )
          )}
        </p>

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
