import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./Intro.css";

// Deck order = the order images cycle through in the slideshow AND the final
// column order, TOP -> BOTTOM. The first card (cube) starts on top of the pile
// during the slideshow; the LAST card shown (dino) sits on top of the physical
// stack and is dealt down to the BOTTOM of the final column.
const TILES = [
  { src: "/mypics/binara.events-055 2.JPG",          alt: "Photo 1" },
  { src: "/mypics/binara.events-111_Original 2.jpg", alt: "Photo 2" },
  { src: "/mypics/binara.events-114 3.JPG",           alt: "Photo 3" },
  { src: "/mypics/binara.events-120 2.JPG",           alt: "Photo 4" },
  { src: "/mypics/binara.events-641_Original 2.jpg", alt: "Photo 5" },
  { src: "/mypics/binara.events-771_Original 3.jpg", alt: "Photo 6" },
  { src: "/mypics/binara.events-883_Original 3.jpg", alt: "Photo 7" },
  { src: "/mypics/binara.events-055 2.JPG",          alt: "Photo 8" },
];

const SUBTITLE_LINES = [
  "A multi-awarded interactive digital studio crafting",
  "immersive & interactive experiences for global brands since 2006.",
];

const N = TILES.length;
const SLIDESHOW_LOOPS = 2; // how many times the deck cycles before stacking
const FRAME = 0.42; // seconds each slideshow image is shown

function preloadImages(sources) {
  return Promise.all(
    sources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = src;
          if (img.decode) img.decode().then(resolve).catch(() => {});
        })
    )
  );
}

export default function Intro({ onDismiss }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const tileRefs = useRef([]);
  const leftLabelRef = useRef(null);
  const rightLabelRef = useRef(null);
  const subtitleRef = useRef(null);
  const discoverRef = useRef(null);

  const timelineRef = useRef(null);
  const dismissedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.body.classList.add("intro-active");

    const ctx = gsap.context(() => {
      const tiles = tileRefs.current.filter(Boolean);

      // Derive layout metrics from the rendered tile size.
      const tileH = tiles[0].getBoundingClientRect().height;
      const gap = tileH * 0.2;
      const step = tileH + gap;
      // Final column: index 0 at top, index N-1 (dino) at bottom. Centered.
      const finalY = (i) => (i - (N - 1) / 2) * step;
      const peek = Math.max(7, tileH * 0.2); // how far stacked cards peek down

      const subtitleLines = subtitleRef.current.querySelectorAll(
        ".intro__subtitle-inner"
      );

      // ---- Base: all tiles centered, stacked, hidden ----
      gsap.set(tiles, {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        scale: 1,
        autoAlpha: 0,
        zIndex: (i) => i + 1, // cube lowest, dino highest (top of pile)
      });

      gsap.set([leftLabelRef.current, rightLabelRef.current], {
        yPercent: 130,
        autoAlpha: 0,
      });
      gsap.set(subtitleLines, { yPercent: 130, autoAlpha: 0 });
      gsap.set(discoverRef.current, { autoAlpha: 0, y: 12 });

      if (prefersReduced) {
        tiles.forEach((t, i) =>
          gsap.set(t, { y: finalY(i), autoAlpha: 1, zIndex: 1 })
        );
        gsap.set([leftLabelRef.current, rightLabelRef.current], {
          yPercent: 0,
          autoAlpha: 1,
        });
        gsap.set(subtitleLines, { yPercent: 0, autoAlpha: 1 });
        gsap.set(discoverRef.current, { autoAlpha: 1, y: 0 });
        setReady(true);
        return;
      }

      const tl = gsap.timeline({ onComplete: () => setReady(true) });

      // ===== PHASE 0 — frame the box: side labels + subtitle settle in =====
      tl.set(tiles[0], { autoAlpha: 1 }, 0);
      tl.to(
        [leftLabelRef.current, rightLabelRef.current],
        { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out", stagger: 0.07 },
        0.1
      );
      tl.to(
        subtitleLines,
        { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out", stagger: 0.08 },
        0.25
      );

      // ===== PHASE 1 — SLIDESHOW: one box flips through all 8, looping =====
      // Only the "current" card is visible; we hop visibility down the z-stack.
      const slideStart = 0.5;
      let cursor = slideStart;
      // Make sure everything except the first frame is hidden at slideshow start.
      tl.set(tiles.slice(1), { autoAlpha: 0 }, slideStart - 0.001);

      for (let loop = 0; loop < SLIDESHOW_LOOPS; loop++) {
        for (let i = 0; i < N; i++) {
          if (loop === 0 && i === 0) {
            cursor += FRAME; // first frame already visible
            continue;
          }
          const prev = (i - 1 + N) % N;
          tl.set(tiles[prev], { autoAlpha: 0 }, cursor);
          tl.set(tiles[i], { autoAlpha: 1 }, cursor);
          cursor += FRAME;
        }
      }

      // ===== PHASE 2 — STACK REVEAL: pile fans downward like a deck =====
      // The dino (top of pile) holds at center; the cards beneath it peek out
      // just slightly downward in a tight deck — exactly like a stack of cards.
      const stackAt = cursor + 0.05;
      tl.addLabel("stack", stackAt);
      // dino renders on top of the fan
      tl.set(tiles, { zIndex: (i) => i + 1 }, "stack");
      tiles.forEach((t, i) => {
        const depth = N - 1 - i; // dino:0 (top), cube:7 (deepest)
        tl.to(
          t,
          {
            autoAlpha: 1,
            y: depth * peek,
            scale: 1 - depth * 0.02,
            duration: 0.55,
            ease: "back.out(1.3)",
          },
          "stack"
        );
      });

      // ===== PHASE 3 — DEAL & EXPAND: cards spread into the column =====
      // After the pile holds for a beat, the top card (dino) travels DOWN to
      // the bottom slot; every other card rises to its slot above. Dealt
      // one-by-one from the top of the deck.
      tl.addLabel("expand", "stack+=0.95");
      tiles.forEach((t, i) => {
        const depth = N - 1 - i; // deal order: dino first, then upward
        tl.to(
          t,
          {
            y: finalY(i),
            scale: 1,
            autoAlpha: 1,
            duration: 1.0,
            ease: "expo.out",
          },
          `expand+=${depth * 0.09}`
        );
      });
      tl.set(tiles, { zIndex: 1 }, "expand+=1.3");

      // ===== PHASE 4 — DISCOVER =====
      tl.to(
        discoverRef.current,
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out" },
        "expand+=1.1"
      );

      timelineRef.current = tl;
      tl.pause(0);
    }, rootRef);

    let cancelled = false;
    if (prefersReduced) {
      return () => {
        cancelled = true;
        ctx.revert();
        document.body.classList.remove("intro-active");
      };
    }

    preloadImages(TILES.map((t) => t.src)).then(() => {
      if (cancelled) return;
      timelineRef.current?.play(0);
    });

    return () => {
      cancelled = true;
      ctx.revert();
      document.body.classList.remove("intro-active");
    };
  }, []);

  // ---- Outro ----
  useEffect(() => {
    if (!ready) return;

    const playOutro = () => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;

      const tiles = tileRefs.current.filter(Boolean);
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          document.body.classList.remove("intro-active");
          onDismiss?.();
        },
      });

      tl.to(
        [
          leftLabelRef.current,
          rightLabelRef.current,
          subtitleRef.current,
          discoverRef.current,
        ],
        { autoAlpha: 0, y: -8, duration: 0.45, ease: "power2.out" },
        0
      )
        .to(
          tiles,
          {
            autoAlpha: 0,
            scale: 0.9,
            duration: 0.6,
            ease: "power3.in",
            stagger: { each: 0.04, from: "edges" },
          },
          0.05
        )
        .to(
          rootRef.current,
          { yPercent: -100, duration: 1, ease: "expo.inOut" },
          0.45
        );
    };

    const onWheel = (e) => e.deltaY > 0 && playOutro();
    const onKey = (e) =>
      ["ArrowDown", "PageDown", " ", "Enter"].includes(e.key) && playOutro();
    let touchStartY = 0;
    const onTouchStart = (e) => (touchStartY = e.touches[0].clientY);
    const onTouchMove = (e) =>
      touchStartY - e.touches[0].clientY > 24 && playOutro();

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    const discover = discoverRef.current;
    discover?.addEventListener("click", playOutro);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      discover?.removeEventListener("click", playOutro);
    };
  }, [ready, onDismiss]);

  return (
    <section className="intro" ref={rootRef} aria-label="Intro">
      <span className="intro__label intro__label--left">
        <span className="intro__label-inner" ref={leftLabelRef}>
          HUMAN THINKERS
        </span>
      </span>

      <div className="intro__stage" ref={stageRef}>
        {TILES.map((tile, i) => (
          <div
            key={tile.src}
            className="intro__tile"
            ref={(el) => (tileRefs.current[i] = el)}
          >
            <img src={tile.src} alt={tile.alt} draggable="false" />
          </div>
        ))}
      </div>

      <span className="intro__label intro__label--right">
        <span className="intro__label-inner" ref={rightLabelRef}>
          DIGITAL MAKERS
        </span>
      </span>

      <p className="intro__subtitle" ref={subtitleRef}>
        {SUBTITLE_LINES.map((line) => (
          <span className="intro__subtitle-line" key={line}>
            <span className="intro__subtitle-inner">{line}</span>
          </span>
        ))}
      </p>

      <button className="intro__discover" ref={discoverRef} type="button">
        DISCOVER
      </button>
    </section>
  );
}
