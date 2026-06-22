import { useEffect, useRef } from "react";
import { LiquidImage } from "./LiquidImage";

// Wraps the LiquidImage WebGL engine in a frame element. The canvas fills the
// frame; the engine reads the frame's viewport position every rAF to drive the
// parallax crop, and the pointer to drive the liquid drag distortion.
//
// An IntersectionObserver pauses the render loop while the frame is off-screen.
export default function FluidImage({
  src,
  alt = "",
  className = "",
  options = {},
  ...rest
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new LiquidImage(canvas, { src, ...options });
    engineRef.current = engine;

    const io = new IntersectionObserver(
      ([entry]) => engine.setInView(entry.isIntersecting),
      { rootMargin: "10% 0px" }
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div className={`fluid-image ${className}`} {...rest}>
      <canvas ref={canvasRef} className="fluid-image__canvas" aria-label={alt} />
    </div>
  );
}
