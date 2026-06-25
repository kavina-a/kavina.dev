import { useEffect, useRef, useState } from "react";
import "./PhotoBurst.css";

// ─── Timing — edit freely ─────────────────────────────────────────────────
export const HOLD_MS    = 900;    // how long each photo stays on screen (ms)
export const WIPE_MS    = 140;    // wipe-in duration (ms) — keep ≤ 200 for burst feel
export const STAGGER_MS = [0, 340, 170]; // per-frame start offset so they cycle out of phase
// ─────────────────────────────────────────────────────────────────────────────

function BurstFrame({ images, start, stagger, className, ...rest }) {
  const [prev, setPrev] = useState(null);
  const [cur,  setCur]  = useState(start);
  const [rev,  setRev]  = useState(0);
  const idxRef   = useRef(start);
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const next = (idxRef.current + 1) % images.length;
      setPrev(idxRef.current);
      setCur(next);
      setRev(r => r + 1);
      idxRef.current = next;
      timerRef.current = setTimeout(tick, HOLD_MS);
    };

    timerRef.current = setTimeout(tick, stagger + HOLD_MS);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`burst-frame ${className}`} {...rest}>
      {/* stable layer: stays put while the incoming image wipes over it */}
      {prev !== null && (
        <img
          src={images[prev]}
          alt=""
          className="burst-frame__img"
          draggable={false}
        />
      )}
      {/* incoming layer: re-keyed each cycle to restart the CSS animation */}
      <img
        key={rev}
        src={images[cur]}
        alt=""
        className={`burst-frame__img${rev > 0 ? " burst-frame__img--in" : ""}`}
        draggable={false}
      />
    </div>
  );
}

export default function PhotoBurst({ images, className = "", ...rest }) {
  const step = Math.floor(images.length / STAGGER_MS.length);
  const names = ["left", "center", "right"];

  return (
    <div className={`photo-burst${className ? ` ${className}` : ""}`} {...rest}>
      {STAGGER_MS.map((stagger, i) => (
        <BurstFrame
          key={i}
          images={images}
          start={(i * step) % images.length}
          stagger={stagger}
          className={`burst-frame--${names[i]}`}
        />
      ))}
    </div>
  );
}
