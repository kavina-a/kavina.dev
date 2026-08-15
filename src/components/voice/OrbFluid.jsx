import { useEffect, useRef } from "react";
import { FluidSimulation } from "../paint/fluid/FluidSimulation.js";

/**
 * Homepage Navier–Stokes ink, clipped to KAI's circle.
 * Auto-splats so the fluid keeps moving without a pointer.
 */
export default function OrbFluid({ className, getIntensity }) {
  const canvasRef = useRef(null);
  const intensityRef = useRef(getIntensity);

  useEffect(() => {
    intensityRef.current = getIntensity;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sim = new FluidSimulation(canvas, {
      simResolution: 64,
      dyeResolution: 256,
      forceStrength: 6.2,
      splatRadius: 0.42,
      dyeAmount: 1.35,
      curl: 38,
      pressureIterations: 16,
      pressureDissipation: 0.8,
      velocityDissipation: 0.96,
      dyeDissipation: 0.955,
      threshold: 0.18,
      edgeSoftness: 0.10,
      pointerEase: 0.2,
      inkColor: "#0a0a0a",
      autoSplat: !reduced,
      autoSpeed: 1.35,
      autoIntensity: () => {
        const n = intensityRef.current?.();
        return Number.isFinite(n) ? n : 0.5;
      },
    });

    return () => sim.dispose();
  }, []);

  return (
    <span className={className}>
      <canvas ref={canvasRef} className="voice-orb__fluid" aria-hidden="true" />
    </span>
  );
}
