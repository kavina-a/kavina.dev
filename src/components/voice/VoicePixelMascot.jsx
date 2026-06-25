import { useEffect, useRef, useState } from "react";
import { PixelMotion } from "@ga1az/react-pixel-motion";
import gsap from "gsap";
import "./VoicePixelMascot.css";

const SPRITE = "/voice-agent/mascot.png";
const FRAME = 32;
const SCALE = 3.5;
const COLS = 6;
const ROWS = 4;

// ─── Wander timing — edit freely ───────────────────────────────────────────
export const WANDER_MIN_S = 1.4;   // min seconds to walk between spots
export const WANDER_MAX_S = 3.8;   // max seconds to walk between spots
export const PAUSE_MIN_S  = 0.6;   // min idle pause at each spot
export const PAUSE_MAX_S  = 2.2;   // max idle pause at each spot
// ─────────────────────────────────────────────────────────────────────────────

const ROW = { idle: 0, walk: 1, talk: 2, listen: 3 };

const CLIPS = {
  idle:   { row: ROW.idle,   fps: 5,  frames: 4 },
  walk:   { row: ROW.walk,   fps: 12, frames: 6 }, // wing-flap fly cycle
  talk:   { row: ROW.talk,   fps: 10, frames: 4 },
  listen: { row: ROW.listen, fps: 6,  frames: 4 },
};

export default function VoicePixelMascot({
  onClick,
  open,
  connected,
  connecting,
  isSpeaking,
}) {
  const wrapRef = useRef(null);
  const wanderRef = useRef(null);
  const pauseRef = useRef(null);
  const [facing, setFacing] = useState(1);
  const [locomotion, setLocomotion] = useState("idle");

  const clip = connected
    ? isSpeaking
      ? CLIPS.talk
      : CLIPS.listen
    : locomotion === "walk"
      ? CLIPS.walk
      : CLIPS.idle;

  const statusLabel = connecting
    ? "Bat is waking up…"
    : connected
      ? isSpeaking
        ? "Bat is speaking"
        : "Bat is listening"
      : open
        ? "Voice agent open"
        : "Talk to the bat";

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const stopWander = () => {
      wanderRef.current?.kill();
      wanderRef.current = null;
      pauseRef.current?.kill();
      pauseRef.current = null;
      gsap.killTweensOf(el);
    };

    if (connected || open || connecting) {
      stopWander();
      setLocomotion("idle");
      gsap.to(el, { x: 0, y: 0, duration: 0.35, ease: "power2.out" });
      return stopWander;
    }

    const zone = el.parentElement;
    if (!zone) return stopWander;

    const pickTarget = () => {
      const pad = 4;
      const maxX = Math.max(zone.clientWidth - FRAME * SCALE - pad, 0);
      const maxY = Math.max(zone.clientHeight - FRAME * SCALE - pad, 0);
      return {
        x: pad + Math.random() * maxX,
        y: pad + Math.random() * maxY,
      };
    };

    const step = () => {
      const currentX = Number(gsap.getProperty(el, "x")) || 0;
      const currentY = Number(gsap.getProperty(el, "y")) || 0;
      const target = pickTarget();
      const dx = target.x - currentX;
      const dy = target.y - currentY;
      const dist = Math.hypot(dx, dy);

      setFacing(dx >= 0 ? 1 : -1);
      setLocomotion("walk");

      const duration = gsap.utils.clamp(
        WANDER_MIN_S,
        WANDER_MAX_S,
        dist / 55
      );

      wanderRef.current = gsap.timeline({
        onComplete: () => {
          setLocomotion("idle");
          pauseRef.current = gsap.delayedCall(
            gsap.utils.random(PAUSE_MIN_S, PAUSE_MAX_S),
            step
          );
        },
      }).to(el, {
        x: target.x,
        y: target.y,
        duration,
        ease: "power1.inOut",
      });
    };

    gsap.set(el, { x: 0, y: 0 });
    pauseRef.current = gsap.delayedCall(0.8, step);

    return stopWander;
  }, [connected, open, connecting]);

  return (
    <div className="voice-agent__zone">
      <button
        type="button"
        ref={wrapRef}
        className={[
          "voice-agent__mascot",
          connected && "is-live",
          open && "is-open",
          connecting && "is-connecting",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
        aria-expanded={open}
        aria-label={open ? "Close voice agent" : "Talk to the bat agent"}
        data-cursor
      >
        <div
          className="voice-agent__mascot-sprite"
          style={{ transform: `scaleX(${facing})` }}
        >
          <PixelMotion
            key={`${clip.row}-${clip.frames}`}
            sprite={SPRITE}
            width={FRAME}
            height={FRAME}
            scale={SCALE}
            fps={clip.fps}
            frameCount={clip.frames}
            shouldAnimate
            loop
            direction="grid"
            gridOptions={{
              columns: COLS,
              rows: ROWS,
              rowIndex: clip.row,
            }}
          />
        </div>

        <span className="voice-agent__mascot-shadow" aria-hidden="true" />

        {connected && (
          <span className="voice-agent__mascot-badge" aria-hidden="true" />
        )}
      </button>

      <p className="voice-agent__mascot-label" aria-live="polite">
        {statusLabel}
      </p>
    </div>
  );
}
