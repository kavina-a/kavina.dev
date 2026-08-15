import { useEffect, useRef } from "react";
import "./MarqueeStack.css";

const ROT = [-5, 4, 3, -6, 5, -3, 2, -4];
const NUDGE = [4, -3, 2, -5, 3, -2, 5, -4];

export default function MarqueeStack({ photos = [] }) {
  const stackRef = useRef(null);
  const cards = photos.map((src, i) => ({
    src,
    rot: ROT[i % ROT.length],
    nudge: NUDGE[i % NUDGE.length],
  }));
  const doubled = cards.length ? [...cards, ...cards] : [];

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const nodes = Array.from(stack.querySelectorAll(".photo-card"));
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const layoutArc = () => {
      const stackRect = stack.getBoundingClientRect();
      const h = stackRect.height || 1;
      const cardW = nodes[0]?.getBoundingClientRect().width ?? 0;
      const amp = Math.max(0, stackRect.width - cardW - 12) * 0.78;

      for (const card of nodes) {
        const r = card.getBoundingClientRect();
        const t = (r.top + r.height / 2 - stackRect.top) / h;
        const x = -Math.sin(t * Math.PI) * amp;
        card.style.setProperty("--arc-x", `${x}px`);
      }
    };

    layoutArc();
    if (reduce) return;

    let raf = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      layoutArc();
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
      }
    });
    io.observe(stack);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [photos]);

  if (!doubled.length) return null;

  return (
    <div className="marquee-stack" ref={stackRef} aria-hidden="true">
      <div className="marquee-stack__track">
        {doubled.map((p, i) => (
          <div
            key={i}
            className="photo-card"
            style={{
              "--rot": `${p.rot}deg`,
              "--nudge": `${p.nudge}px`,
            }}
          >
            <img
              src={encodeURI(p.src)}
              alt=""
              loading={i < 6 ? "eager" : "lazy"}
              draggable="false"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
