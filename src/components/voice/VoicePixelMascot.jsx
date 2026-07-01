import { useEffect, useRef, useState } from "react";
import { PixelMotion } from "@ga1az/react-pixel-motion";
import gsap from "gsap";
import { KAI_DIALOGUES } from "../../data/voiceAgent";
import "./VoicePixelMascot.css";

const SPRITE = "/voice-agent/mascot.png";
const FRAME = 32;
const DESKTOP_SCALE = 3.5;
const MOBILE_BREAKPOINT = 720;

function getMascotScale() {
  return window.innerWidth <= MOBILE_BREAKPOINT ? DESKTOP_SCALE * 0.8 : DESKTOP_SCALE;
}

function getMascotSize() {
  const scale = getMascotScale();
  return { scale, w: FRAME * scale, h: FRAME * scale };
}

const COLS = 6;
const ROWS = 4;

export const WANDER_MIN_S = 3.2;
export const WANDER_MAX_S = 6.5;
export const PAUSE_MIN_S = 0.8;
export const PAUSE_MAX_S = 1.8;
export const DIALOGUE_INTERVAL_S = 10;
export const DIALOGUE_VISIBLE_S = 4.2;

const ROW = { idle: 0, walk: 1, talk: 2, listen: 3 };

const CLIPS = {
  idle: { row: ROW.idle, fps: 5, frames: 4 },
  walk: { row: ROW.walk, fps: 12, frames: 6 },
  talk: { row: ROW.talk, fps: 10, frames: 4 },
  listen: { row: ROW.listen, fps: 6, frames: 4 },
};

function getBounds() {
  const narrow = window.innerWidth <= 720;
  const pad = {
    x: narrow ? 12 : 20,
    top: narrow ? 96 : 88,
    bottom: narrow ? 88 : 28,
  };
  const { w: mascotW, h: mascotH } = getMascotSize();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    minX: pad.x,
    minY: pad.top,
    maxX: Math.max(vw - mascotW - pad.x, pad.x),
    maxY: Math.max(vh - mascotH - pad.bottom, pad.top),
  };
}

function getDockPosition(open) {
  const { maxX, maxY } = getBounds();
  const panelLift = open ? 240 : 0;
  return {
    x: maxX,
    y: Math.max(getBounds().minY, maxY - panelLift),
  };
}

function getCorners() {
  const { minX, minY, maxX, maxY } = getBounds();
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: maxY },
  ];
}

function pickTarget(currentX, currentY) {
  const corners = getCorners();
  const far = corners.filter(
    (corner) => Math.hypot(corner.x - currentX, corner.y - currentY) > 100
  );
  const pool = far.length
    ? far
    : corners.filter(
        (corner) =>
          Math.abs(corner.x - currentX) > 8 || Math.abs(corner.y - currentY) > 8
      );

  return pool[Math.floor(Math.random() * pool.length)] ?? corners[3];
}

function arcMidpoint(x1, y1, x2, y2) {
  const { minX, minY, maxX, maxY } = getBounds();
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const pull = 0.26;
  return {
    x: mx + (cx - mx) * pull,
    y: my + (cy - my) * pull,
  };
}

export default function VoicePixelMascot({
  onClick,
  open,
  connected,
  connecting,
  isSpeaking,
}) {
  const wrapRef = useRef(null);
  const bobRef = useRef(null);
  const bubbleRef = useRef(null);
  const wanderRef = useRef(null);
  const pauseRef = useRef(null);
  const bobTweenRef = useRef(null);

  const [facing, setFacing] = useState(1);
  const [locomotion, setLocomotion] = useState("idle");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [dialogueVisible, setDialogueVisible] = useState(false);
  const [bubbleAbove, setBubbleAbove] = useState(true);
  const [mascotScale, setMascotScale] = useState(getMascotScale);

  const isDocked = connected || open || connecting;
  const showDialogue = dialogueVisible && !isDocked;

  const clip = connected
    ? isSpeaking
      ? CLIPS.talk
      : CLIPS.listen
    : showDialogue
      ? CLIPS.talk
      : locomotion === "walk"
        ? CLIPS.walk
        : CLIPS.idle;

  useEffect(() => {
    const bob = bobRef.current;
    if (!bob) return;

    bobTweenRef.current?.kill();
    bobTweenRef.current = gsap.to(bob, {
      y: -7,
      x: 3,
      rotation: 2.5,
      duration: gsap.utils.random(1.6, 2.4),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => bobTweenRef.current?.kill();
  }, []);

  useEffect(() => {
    const onResize = () => setMascotScale(getMascotScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const stopWander = () => {
      wanderRef.current?.kill();
      wanderRef.current = null;
      pauseRef.current?.kill();
      pauseRef.current = null;
      gsap.killTweensOf(el);
    };

    if (prefersReduced) {
      const dock = getDockPosition(open);
      gsap.set(el, { x: dock.x, y: dock.y });
      setLocomotion("idle");
      return stopWander;
    }

    if (isDocked) {
      stopWander();
      setLocomotion("idle");
      const dock = getDockPosition(open);
      gsap.to(el, { x: dock.x, y: dock.y, duration: 0.55, ease: "power2.inOut" });
      return stopWander;
    }

    const step = () => {
      const currentX = Number(gsap.getProperty(el, "x")) || 0;
      const currentY = Number(gsap.getProperty(el, "y")) || 0;
      const target = pickTarget(currentX, currentY);
      const mid = arcMidpoint(currentX, currentY, target.x, target.y);
      const dx = target.x - currentX;
      const dist = Math.hypot(dx, target.y - currentY);

      setFacing(dx >= 0 ? 1 : -1);
      setLocomotion("walk");

      const duration = gsap.utils.clamp(
        WANDER_MIN_S,
        WANDER_MAX_S,
        dist / 38
      );

      wanderRef.current = gsap
        .timeline({
          onComplete: () => {
            setLocomotion("idle");
            pauseRef.current = gsap.delayedCall(
              gsap.utils.random(PAUSE_MIN_S, PAUSE_MAX_S),
              step
            );
          },
        })
        .to(el, {
          x: mid.x,
          y: mid.y,
          duration: duration * 0.52,
          ease: "sine.inOut",
        })
        .to(el, {
          x: target.x,
          y: target.y,
          duration: duration * 0.48,
          ease: "sine.inOut",
        });
    };

    const { maxX, maxY } = getBounds();
    gsap.set(el, { x: maxX, y: maxY });
    pauseRef.current = gsap.delayedCall(1.2, step);

    const onResize = () => {
      if (isDocked) {
        const dock = getDockPosition(open);
        gsap.set(el, { x: dock.x, y: dock.y });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      stopWander();
    };
  }, [connected, open, connecting, isDocked]);

  useEffect(() => {
    setDialogueVisible(false);

    if (isDocked) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let index = 0;
    let hideTimeoutId = 0;
    let intervalId = 0;

    const reveal = () => {
      setDialogueIndex(index);
      index = (index + 1) % KAI_DIALOGUES.length;

      const el = wrapRef.current;
      if (el) {
        const y = Number(gsap.getProperty(el, "y")) || 0;
        const { minY, maxY } = getBounds();
        setBubbleAbove(y < minY + (maxY - minY) * 0.28);
      }

      setDialogueVisible(true);
      window.clearTimeout(hideTimeoutId);
      hideTimeoutId = window.setTimeout(
        () => setDialogueVisible(false),
        DIALOGUE_VISIBLE_S * 1000
      );
    };

    const initialId = window.setTimeout(() => {
      reveal();
      intervalId = window.setInterval(
        reveal,
        DIALOGUE_INTERVAL_S * 1000
      );
    }, 2500);

    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
      window.clearTimeout(hideTimeoutId);
    };
  }, [isDocked]);

  useEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;

    if (showDialogue) {
      gsap.fromTo(
        bubble,
        { autoAlpha: 0, y: 10, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)" }
      );
    } else {
      gsap.to(bubble, {
        autoAlpha: 0,
        y: -6,
        scale: 0.96,
        duration: 0.32,
        ease: "power2.in",
      });
    }
  }, [showDialogue, dialogueIndex]);

  return (
    <div className="voice-agent__zone" aria-hidden={false}>
      <button
        type="button"
        ref={wrapRef}
        className={[
          "voice-agent__mascot",
          connected && "is-live",
          open && "is-open",
          connecting && "is-connecting",
          showDialogue && "is-chatting",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
        aria-expanded={open}
        aria-label={open ? "Close voice agent" : "Talk to the voice agent"}
        data-cursor
      >
        <div
          ref={bubbleRef}
          className={[
            "voice-agent__bubble",
            bubbleAbove ? "is-above" : "is-below",
          ].join(" ")}
          aria-hidden={!showDialogue}
        >
          <p className="voice-agent__bubble-text">
            {KAI_DIALOGUES[dialogueIndex]}
          </p>
        </div>

        <div ref={bobRef} className="voice-agent__mascot-bob">
          <div
            className="voice-agent__mascot-sprite"
            style={{ transform: `scaleX(${facing})` }}
          >
            <PixelMotion
              key={`${clip.row}-${clip.frames}`}
              sprite={SPRITE}
              width={FRAME}
              height={FRAME}
              scale={mascotScale}
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
        </div>

        <span className="voice-agent__mascot-shadow" aria-hidden="true" />

        {connected && (
          <span className="voice-agent__mascot-badge" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
