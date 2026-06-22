import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";

// Lightweight scroll reveal: fades + rises children on enter. Splits a string
// into word spans when `as="words"` for a staggered line reveal.
export default function Reveal({
  children,
  as = "block",
  className = "",
  delay = 0,
  y = 28,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = as === "words" ? el.querySelectorAll(".rv-word") : el;

    const fromVars =
      as === "words"
        ? { yPercent: 110, opacity: 0 }
        : { y, opacity: 0 };
    const toVars =
      as === "words"
        ? { yPercent: 0, opacity: 1 }
        : { y: 0, opacity: 1 };

    const anim = gsap.fromTo(targets, fromVars, {
      ...toVars,
      duration: 0.9,
      delay,
      ease: "expo.out",
      stagger: as === "words" ? 0.04 : 0,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
        once: true,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, [as, delay, y]);

  if (as === "words" && typeof children === "string") {
    return (
      <div ref={ref} className={className} {...rest}>
        {children.split(" ").map((w, i) => (
          <span className="rv-line" key={i}>
            <span className="rv-word">{w}&nbsp;</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
