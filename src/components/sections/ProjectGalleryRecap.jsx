import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";

const TRAIL_DEPTH = 4;
const INTERVAL_MS = 2000;

const TRAIL_POSES = [
  { x: 0, y: 0, rot: 0, scale: 1, opacity: 1, filter: "saturate(0.72) brightness(0.72)" },
  { x: -34, y: 16, rot: -5, scale: 0.92, opacity: 0.5, filter: "saturate(0.48) brightness(0.52)" },
  { x: -62, y: 28, rot: -8, scale: 0.85, opacity: 0.26, filter: "saturate(0.38) brightness(0.42) blur(0.5px)" },
  { x: -84, y: 38, rot: -10, scale: 0.78, opacity: 0.1, filter: "saturate(0.32) brightness(0.36) blur(1.5px)" },
];

const ENTER_POSE = {
  x: 58,
  y: -12,
  rot: 6,
  scale: 1.08,
  opacity: 0,
  filter: "saturate(0.8) brightness(0.78)",
};

export default function ProjectGalleryRecap({ images = [], alt = "", interval = INTERVAL_MS }) {
  const rootRef = useRef(null);
  const slotsRef = useRef([]);
  const headRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    const slots = slotsRef.current.filter(Boolean);
    if (!root || images.length <= 1 || slots.length < TRAIL_DEPTH) return;

    headRef.current = 0;

    const imageAt = (offset) =>
      images[(headRef.current - offset + images.length * 16) % images.length];

    const paintSlot = (slotIdx, offset) => {
      const slot = slots[slotIdx];
      const img = slot?.querySelector("img");
      if (img) img.src = images[imageAt(offset)];
    };

    const moveSlot = (slotIdx, pose, fromEnter = false) => {
      const slot = slots[slotIdx];
      if (!slot) return;
      gsap.killTweensOf(slot);
      if (fromEnter) {
        gsap.set(slot, {
          x: ENTER_POSE.x,
          y: ENTER_POSE.y,
          rotation: ENTER_POSE.rot,
          scale: ENTER_POSE.scale,
          opacity: ENTER_POSE.opacity,
          filter: ENTER_POSE.filter,
        });
      }
      gsap.to(slot, {
        x: pose.x,
        y: pose.y,
        rotation: pose.rot,
        scale: pose.scale,
        opacity: pose.opacity,
        filter: pose.filter,
        duration: fromEnter ? 1.05 : 0.92,
        ease: "power3.out",
        overwrite: true,
      });
    };

    const layout = (animateFront = false) => {
      for (let s = 0; s < TRAIL_DEPTH; s++) {
        paintSlot(s, s);
        moveSlot(s, TRAIL_POSES[s], animateFront && s === 0);
      }
    };

    layout(false);

    const advance = () => {
      headRef.current = (headRef.current + 1) % images.length;
      for (let s = 0; s < TRAIL_DEPTH; s++) {
        paintSlot(s, s);
        moveSlot(s, TRAIL_POSES[s], s === 0);
      }
    };

    let timer;
    const io = new IntersectionObserver(
      ([entry]) => {
        clearInterval(timer);
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          timer = setInterval(advance, interval);
        }
      },
      { threshold: [0, 0.2, 0.45] }
    );
    io.observe(root);

    return () => {
      clearInterval(timer);
      io.disconnect();
      slots.forEach((slot) => gsap.killTweensOf(slot));
    };
  }, [images, interval]);

  if (!images.length) return null;

  return (
    <div className="ps__recap" ref={rootRef}>
      {Array.from({ length: TRAIL_DEPTH }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            slotsRef.current[i] = el;
          }}
          className="ps__recap-layer"
          style={{ zIndex: TRAIL_DEPTH - i }}
        >
          <img src={images[i % images.length]} alt={i === 0 ? alt : ""} draggable="false" />
        </div>
      ))}
    </div>
  );
}
