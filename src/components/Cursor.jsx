import { useEffect, useRef } from "react";
import "./Cursor.css";

// Luminous lerp cursor: a tiny dot at the true position + a trailing ring.
// Grows on interactive elements ([data-cursor] / a / button).
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { ...pos };
    let raf;

    const onMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      const ink = Boolean(e.target?.closest?.("[data-cursor-ink]"));
      dot.classList.toggle("is-ink", ink);
      ring.classList.toggle("is-ink", ink);
    };

    const tick = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
      raf = requestAnimationFrame(tick);
    };

    const over = (e) => {
      if (e.target.closest("a, button, [data-cursor]")) {
        ring.classList.add("is-hover");
      }
    };
    const out = (e) => {
      if (e.target.closest("a, button, [data-cursor]")) {
        ring.classList.remove("is-hover");
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerover", over);
    window.addEventListener("pointerout", out);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerout", out);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden />
      <div className="cursor-ring" ref={ringRef} aria-hidden />
    </>
  );
}
