import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import "./ClockRing.css";

// One project's gallery, arranged like numbers on a clock face.
// `dial` idles anticlockwise forever. Each card's own `.clock-counter`
// cancels the dial's live rotation every frame, so the image itself
// never visibly spins — only its position orbits.
const ROTATE_SECONDS = 46;

export default function ClockRing({ project }) {
  const rootRef = useRef(null);
  const dialRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const dial = dialRef.current;
    if (!root || !dial) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const cards = Array.from(root.querySelectorAll(".clock-card"));
    const counters = Array.from(root.querySelectorAll(".clock-counter"));

    let ring = null;
    let tick = null;

    if (!prefersReduced) {
      gsap.set(dial, { rotation: 0 });
      ring = gsap.to(dial, {
        rotation: "-=360",
        duration: ROTATE_SECONDS,
        repeat: -1,
        ease: "none",
      });

      tick = () => {
        const live = gsap.getProperty(dial, "rotation");
        gsap.set(counters, { rotation: -live });
      };
      gsap.ticker.add(tick);
    }

    const cleanups = [];

    cards.forEach((card, i) => {
      const onEnter = () => {
        root.classList.add("has-active");
        cards.forEach((c, j) => c.classList.toggle("is-active", j === i));
        ring?.pause();
        gsap.to(card, { scale: 1.18, duration: 0.4, ease: "power3.out" });
      };
      const onLeave = () => {
        root.classList.remove("has-active");
        card.classList.remove("is-active");
        gsap.to(card, { scale: 1, duration: 0.4, ease: "power3.out" });
        ring?.play();
      };

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
      if (tick) gsap.ticker.remove(tick);
      ring?.kill();
    };
  }, []);

  const gallery = project.gallery ?? [];
  const n = gallery.length;

  return (
    <div className="clock-ring" ref={rootRef}>
      <div className="clock-hairline" aria-hidden="true" />
      <div className="clock-dial" ref={dialRef}>
        {gallery.map((src, i) => {
          const angle = (360 / n) * i;
          return (
            <div
              key={`${project.id}-${i}`}
              className="clock-hub"
              style={{ "--angle": `${angle}deg` }}
            >
              <div className="clock-arm">
                <div className="clock-upright">
                  <div className="clock-counter">
                    <div className="clock-card" data-cursor>
                      <img
                        src={encodeURI(src)}
                        alt={`${project.title} ${i + 1}`}
                        loading={i === 0 ? "eager" : "lazy"}
                        draggable="false"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
