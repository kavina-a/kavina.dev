import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 550;

const uri = (path) => encodeURI(path);

export default function ProjectGalleryRecap({ images = [], alt = "", interval = INTERVAL_MS }) {
  const [index, setIndex] = useState(0);
  const rootRef = useRef(null);
  const pausedRef = useRef(false);
  const inViewRef = useRef(true);

  useEffect(() => {
    if (images.length <= 1) return;

    let timer;

    const tick = () => {
      if (!pausedRef.current) {
        setIndex((i) => (i + 1) % images.length);
      }
    };

    const syncTimer = () => {
      clearInterval(timer);
      if (inViewRef.current && !pausedRef.current) {
        timer = setInterval(tick, interval);
      }
    };

    syncTimer();

    const root = rootRef.current;
    const card = root?.closest(".ps__card-inner");

    const io = root
      ? new IntersectionObserver(
          ([entry]) => {
            inViewRef.current = entry.isIntersecting;
            syncTimer();
          },
          { threshold: 0.05 }
        )
      : null;
    if (root && io) io.observe(root);

    const onEnter = () => {
      pausedRef.current = true;
      syncTimer();
      root?.classList.add("is-paused");
    };

    const onLeave = () => {
      pausedRef.current = false;
      root?.classList.remove("is-paused");
      syncTimer();
    };

    card?.addEventListener("mouseenter", onEnter);
    card?.addEventListener("mouseleave", onLeave);

    return () => {
      clearInterval(timer);
      io?.disconnect();
      card?.removeEventListener("mouseenter", onEnter);
      card?.removeEventListener("mouseleave", onLeave);
    };
  }, [images, interval]);

  if (!images.length) return null;

  return (
    <div className="ps__recap" ref={rootRef}>
      <img
        src={uri(images[index])}
        alt={alt}
        className="ps__recap-img"
        draggable="false"
      />
    </div>
  );
}
