import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MYPICS } from "../data/site";
import "./Intro.css";

const FRAMES = MYPICS.map((src, i) => ({ src, alt: `Photo ${i + 1}` }));
const N = FRAMES.length;
const NAME = "KAVINA";
const ROLE = "AI / ML ENGINEER";
const SUBTITLE_LINES = [
  "I build voice agents that actually pick up,",
  "and NPCs that hold grudges. Let's talk.",
];

const FRAME_START = 0.2;
const FRAME_END = 0.055;
const shuffleEase = gsap.parseEase("power2.in");
const frameDuration = (i) =>
  gsap.utils.interpolate(FRAME_START, FRAME_END, shuffleEase(i / Math.max(N - 1, 1)));

function preloadImages(sources, onEach) {
  return Promise.all(
    sources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            onEach?.();
            resolve();
          };
          img.onload = img.onerror = done;
          img.src = src;
          if (img.decode) img.decode().then(done).catch(() => {});
        })
    )
  );
}

function layoutSvg(svg, clipText, strokeText, images) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const fs = Math.min(w * 0.155, h * 0.22, 248);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  [clipText, strokeText].forEach((t) => {
    t.setAttribute("x", String(w / 2));
    t.setAttribute("y", String(h * 0.49));
    t.setAttribute("font-size", String(fs));
  });
  images.forEach((img) => {
    img.setAttribute("x", "0");
    img.setAttribute("y", "0");
    img.setAttribute("width", String(w));
    img.setAttribute("height", String(h));
    img.setAttribute("preserveAspectRatio", "xMidYMid slice");
  });
  return { w, h, fs };
}

export default function Intro({ onDismiss }) {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const clipTextRef = useRef(null);
  const strokeTextRef = useRef(null);
  const imageRefs = useRef([]);
  const countRef = useRef(null);
  const countNumRef = useRef(null);
  const metaRef = useRef(null);
  const skipRef = useRef(null);

  const timelineRef = useRef(null);
  const dismissedRef = useRef(false);
  const autoTimerRef = useRef(null);
  const liveParallaxRef = useRef(false);
  const progressProxy = useRef({ n: 0 });
  const layoutRef = useRef({ w: 0, h: 0, fs: 0 });
  const clipId = `intro-name-clip-${useId().replace(/:/g, "")}`;
  const [loaded, setLoaded] = useState(0);

  const playOutro = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    liveParallaxRef.current = false;
    window.clearTimeout(autoTimerRef.current);
    timelineRef.current?.kill();
    gsap.killTweensOf(imageRefs.current.filter(Boolean));
    gsap.killTweensOf([clipTextRef.current, strokeTextRef.current]);

    const fs = layoutRef.current.fs || 200;
    gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        document.body.classList.remove("intro-active");
        onDismiss?.();
      },
    })
      .to(
        [countRef.current, metaRef.current, skipRef.current],
        { autoAlpha: 0, y: -10, duration: 0.32, ease: "power2.out" },
        0
      )
      .to(
        [clipTextRef.current, strokeTextRef.current],
        { attr: { "font-size": fs * 1.2 }, duration: 0.65, ease: "expo.in" },
        0
      )
      .to(
        rootRef.current,
        { yPercent: -100, duration: 0.95, ease: "expo.inOut" },
        0.22
      );
  };

  const paintCount = (n) => {
    if (!countNumRef.current) return;
    countNumRef.current.textContent = String(Math.round(n)).padStart(2, "0");
  };

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.body.classList.add("intro-active");

    const ctx = gsap.context(() => {
      const svg = svgRef.current;
      const clipText = clipTextRef.current;
      const strokeText = strokeTextRef.current;
      const images = imageRefs.current.filter(Boolean);
      const subtitleLines = metaRef.current.querySelectorAll(
        ".intro__subtitle-inner"
      );

      const layout = layoutSvg(svg, clipText, strokeText, images);
      layoutRef.current = layout;

      gsap.set(images, { autoAlpha: 0, scale: 1.04, transformOrigin: "50% 50%" });
      gsap.set(images[0], { autoAlpha: 1, scale: 1 });
      gsap.set(strokeText, { autoAlpha: 0 });
      gsap.set(metaRef.current, { autoAlpha: 0 });
      gsap.set(subtitleLines, { yPercent: 120, autoAlpha: 0 });
      gsap.set(countRef.current, {
        autoAlpha: 1,
        scale: 1,
        xPercent: -50,
        yPercent: -50,
        transformOrigin: "50% 50%",
      });

      if (prefersReduced) {
        gsap.set(strokeText, { autoAlpha: 1 });
        gsap.set(metaRef.current, { autoAlpha: 1 });
        gsap.set(subtitleLines, { yPercent: 0, autoAlpha: 1 });
        gsap.set(countRef.current, { autoAlpha: 0 });
        autoTimerRef.current = window.setTimeout(playOutro, 900);
        return;
      }

      clipText.setAttribute("font-size", String(layout.fs * 2.35));
      strokeText.setAttribute("font-size", String(layout.fs * 2.35));

      const tl = gsap.timeline({
        onComplete: () => {
          liveParallaxRef.current = true;
          autoTimerRef.current = window.setTimeout(playOutro, 1200);
        },
      });

      tl.addLabel("dive", 0);
      tl.to(
        countRef.current,
        {
          autoAlpha: 0,
          scale: 1.08,
          filter: "blur(18px)",
          duration: 0.45,
          ease: "power2.in",
        },
        "dive"
      );
      tl.to(
        [clipText, strokeText],
        { attr: { "font-size": layout.fs }, duration: 1.3, ease: "expo.out" },
        "dive"
      );
      tl.to(strokeText, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, "dive+=0.55");

      let cursor = 0;
      const riffleAt = 1.05;
      for (let i = 1; i < N; i++) {
        const dur = frameDuration(i);
        const at = `dive+=${riffleAt + cursor}`;
        tl.to(
          images[i - 1],
          { autoAlpha: 0, scale: 1.05, duration: dur * 0.45, ease: "power1.in" },
          at
        );
        tl.fromTo(
          images[i],
          { autoAlpha: 0, scale: 1.08 },
          { autoAlpha: 1, scale: 1, duration: dur * 0.75, ease: "power2.out" },
          at
        );
        cursor += dur;
      }

      const lockAt = riffleAt + cursor + 0.04;
      tl.add(() => {
        gsap.to(images[N - 1], { scale: 1.08, duration: 4, ease: "none" });
      }, `dive+=${lockAt}`);
      tl.to(metaRef.current, { autoAlpha: 1, duration: 0.01 }, `dive+=${lockAt}`);
      tl.fromTo(
        ".intro__role-inner",
        { yPercent: 110, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" },
        `dive+=${lockAt}`
      );
      tl.to(
        subtitleLines,
        { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "expo.out", stagger: 0.08 },
        `dive+=${lockAt}`
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

    const startedAt = performance.now();
    preloadImages(
      FRAMES.map((t) => t.src),
      () => {
        if (cancelled) return;
        setLoaded((n) => n + 1);
      }
    ).then(() => {
      if (cancelled) return;
      gsap.to(progressProxy.current, {
        n: 100,
        duration: 0.28,
        ease: "power2.out",
        onUpdate: () => paintCount(progressProxy.current.n),
      });
      const wait = Math.max(0, 380 - (performance.now() - startedAt));
      window.setTimeout(() => {
        if (cancelled) return;
        timelineRef.current?.play(0);
      }, wait);
    });

    return () => {
      cancelled = true;
      liveParallaxRef.current = false;
      ctx.revert();
      document.body.classList.remove("intro-active");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    gsap.to(progressProxy.current, {
      n: (loaded / N) * 100,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: () => paintCount(progressProxy.current.n),
    });
  }, [loaded]);

  useEffect(() => {
    const onWheel = (e) => e.deltaY > 0 && playOutro();
    const onKey = (e) =>
      ["ArrowDown", "PageDown", " ", "Enter", "Escape"].includes(e.key) &&
      playOutro();
    let touchStartY = 0;
    const onTouchStart = (e) => (touchStartY = e.touches[0].clientY);
    const onTouchMove = (e) =>
      touchStartY - e.touches[0].clientY > 24 && playOutro();

    const onMove = (e) => {
      if (!liveParallaxRef.current) return;
      const img = imageRefs.current[N - 1];
      if (!img) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      gsap.to(img, {
        x: nx * 28,
        y: ny * 18,
        duration: 0.9,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    const skip = skipRef.current;
    skip?.addEventListener("click", playOutro);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointermove", onMove);
      skip?.removeEventListener("click", playOutro);
      window.clearTimeout(autoTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="intro" ref={rootRef} aria-label="Intro">
      <div className="intro__hud">
        <span className="intro__brand">kavina.me</span>
        <button
          className="intro__skip"
          ref={skipRef}
          type="button"
          aria-label="Skip intro"
        >
          Skip
        </button>
      </div>

      <div className="intro__count" ref={countRef} aria-hidden="true">
        <span className="intro__count-num" ref={countNumRef}>
          00
        </span>
      </div>

      <svg className="intro__svg" ref={svgRef} aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <text
              ref={clipTextRef}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {NAME}
            </text>
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {FRAMES.map((frame, i) => (
            <image
              key={frame.src + i}
              ref={(el) => (imageRefs.current[i] = el)}
              href={frame.src}
            />
          ))}
        </g>
        <text
          className="intro__svg-stroke"
          ref={strokeTextRef}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {NAME}
        </text>
      </svg>
      <h1 className="intro__sr-only">{NAME}</h1>

      <div className="intro__meta" ref={metaRef}>
        <p className="intro__role">
          <span className="intro__role-inner">{ROLE}</span>
        </p>
        <p className="intro__subtitle">
          {SUBTITLE_LINES.map((line) => (
            <span className="intro__subtitle-line" key={line}>
              <span className="intro__subtitle-inner">{line}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
