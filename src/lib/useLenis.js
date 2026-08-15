import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

export function useLenis({ autoStart = true } = {}) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    ScrollTrigger.clearScrollMemory();
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !prefersReduced,
      syncTouch: false,
      touchMultiplier: 1.8,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;
    window.__lenis = lenis;
    lenis.scrollTo(0, { immediate: true });

    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    if (!autoStart) lenis.stop();

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      if (window.__lenis === lenis) window.__lenis = null;
      lenisRef.current = null;
    };
  }, [autoStart]);

  return lenisRef;
}
