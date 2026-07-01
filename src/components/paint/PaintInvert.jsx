import { useEffect, useRef } from "react";
import { FluidSimulation } from "./fluid/FluidSimulation.js";
import "./PaintInvert.css";

// Fluid hero — GPU stable-fluids (Navier-Stokes) cursor trail.
// The display shader outputs black ink on transparent canvas over the white
// page. Headline uses mix-blend-mode: difference so it inverts under the ink.
export default function PaintInvert() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = new FluidSimulation(canvas, {
      simResolution: 128,
      dyeResolution: 1024,
      forceStrength: 5.0,
      splatRadius: 0.10,
      dyeAmount: 1.2,
      curl: 38,
      pressureIterations: 22,
      pressureDissipation: 0.8,
      velocityDissipation: 0.96,
      dyeDissipation: 0.955,
      threshold: 0.18,
      edgeSoftness: 0.10,
      pointerEase: 0.16,
      inkColor: "#0a0a0a",
    });

    return () => sim.dispose();
  }, []);

  return (
    <section className="hero">
      <div className="hero__viewport">
        <canvas ref={canvasRef} className="hero__canvas" />

        <div className="hero__content">
          <div className="hero__stack">
            <h1 className="hero__title">
              <span className="hero__line">KAVINA</span>
              <span className="hero__role">(AI/ML ENGINEER)</span>
              <span className="hero__line hero__line--surname">
                ALAHAP<br className="hero__break" aria-hidden="true" />
                PERUMA
              </span>
            </h1>

            <p className="hero__tag">
              the best way to predict the future is to implement it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
