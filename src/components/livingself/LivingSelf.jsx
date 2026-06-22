import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { vertexShader, fragmentShader } from "./shaders";
import { ZONES, ZONE_MAGNET } from "./zones";
import "./LivingSelf.css";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function PortraitPlane({ onZoneChange, onDiscover }) {
  const matRef = useRef();
  const { size, viewport } = useThree();
  const [portrait, inside] = useTexture([
    "/portrait/portrait.png",
    "/portrait/inside.png",
  ]);

  // smoothed state held in refs to avoid re-renders each frame
  const target = useRef({ x: 0.5, y: 0.5 });
  const smooth = useRef({ x: 0.5, y: 0.5 });
  const reveal = useRef(0);
  const zoneMix = useRef(0);
  const radius = useRef(0.12);
  const color = useRef(new THREE.Color(0.15, 0.85, 1.0));
  const activeZone = useRef(null);

  const uniforms = useMemo(
    () => ({
      uPortrait: { value: portrait },
      uInside: { value: inside },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uImageRes: {
        value: new THREE.Vector2(
          portrait.image?.width || 600,
          portrait.image?.height || 337
        ),
      },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uReveal: { value: 0 },
      uRadius: { value: 0.12 },
      uZoneColor: { value: new THREE.Vector3(0.15, 0.85, 1.0) },
      uZoneMix: { value: 0 },
      uRipple: { value: 1 },
      uRipplePos: { value: new THREE.Vector2(0.5, 0.5) },
      uBreath: { value: 0 },
    }),
    [portrait, inside, size.width, size.height]
  );

  // pointer -> target uv (origin bottom-left)
  useEffect(() => {
    const onMove = (e) => {
      target.current.x = e.clientX / window.innerWidth;
      target.current.y = 1 - e.clientY / window.innerHeight;
    };
    const onLeave = () => {
      target.current.x = 0.5;
      target.current.y = 0.5;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const fireRipple = (pos) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    u.uRipplePos.value.set(pos[0], pos[1]);
    gsap.fromTo(
      u.uRipple,
      { value: 0 },
      { value: 1, duration: 1.1, ease: "expo.out" }
    );
  };

  useFrame((state, dt) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    const t = state.clock.elapsedTime;

    // breathing (seamless sine)
    u.uBreath.value = Math.sin(t * 0.9) * 0.5 + 0.5;
    u.uTime.value = t;

    // find nearest zone with aspect-correct distance
    const aspect = size.width / size.height;
    let nearest = null;
    let best = Infinity;
    for (const z of ZONES) {
      const dx = (target.current.x - z.pos[0]) * aspect;
      const dy = target.current.y - z.pos[1];
      const d = Math.hypot(dx, dy);
      if (d < best) {
        best = d;
        nearest = z;
      }
    }

    const inZone = nearest && best < ZONE_MAGNET;
    // magnetic bias: pull attention toward the zone center as we approach
    let tx = target.current.x;
    let ty = target.current.y;
    if (inZone) {
      const pull = 1 - best / ZONE_MAGNET; // 0..1
      tx = lerp(tx, nearest.pos[0], pull * 0.45);
      ty = lerp(ty, nearest.pos[1], pull * 0.45);
    }

    // lerp the smoothed pointer (inertia / trailing attention)
    smooth.current.x = lerp(smooth.current.x, tx, 0.09);
    smooth.current.y = lerp(smooth.current.y, ty, 0.09);
    u.uPointer.value.set(smooth.current.x, smooth.current.y);

    // reveal + radius + tint respond to zone state
    const targetReveal = inZone ? 1 : 0.0;
    const targetRadius = inZone ? 0.17 : 0.1;
    const targetMix = inZone ? 1 : 0.0;
    reveal.current = lerp(reveal.current, targetReveal, 0.06);
    radius.current = lerp(radius.current, targetRadius, 0.06);
    zoneMix.current = lerp(zoneMix.current, targetMix, 0.06);
    u.uReveal.value = reveal.current;
    u.uRadius.value = radius.current;
    u.uZoneMix.value = zoneMix.current;

    if (inZone) {
      color.current.lerp(
        new THREE.Color(nearest.color[0], nearest.color[1], nearest.color[2]),
        0.08
      );
    }
    u.uZoneColor.value.set(color.current.r, color.current.g, color.current.b);

    // zone enter -> ripple + notify overlay
    const newId = inZone ? nearest.id : null;
    if (newId !== activeZone.current) {
      activeZone.current = newId;
      if (inZone) {
        fireRipple(nearest.pos);
        onDiscover?.(nearest.id);
      }
      onZoneChange?.(inZone ? nearest : null);
    }
  });

  // keep resolution uniform in sync
  useEffect(() => {
    const u = matRef.current?.uniforms;
    if (u) u.uResolution.value.set(size.width, size.height);
  }, [size]);

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function LivingSelf() {
  const [zone, setZone] = useState(null);
  const [discovered, setDiscovered] = useState(() => new Set());
  const allFound = discovered.size >= ZONES.length;

  const handleDiscover = (id) =>
    setDiscovered((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  return (
    <section className="living">
      <Canvas
        className="living__canvas"
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 1], fov: 50 }}
        orthographic={false}
      >
        <PortraitPlane onZoneChange={setZone} onDiscover={handleDiscover} />
      </Canvas>

      <div className="living__overlay">
        <p className="living__thesis">
          Made from everything I know, build, love &amp; chase.
        </p>

        <div className={`living__word ${zone ? "is-active" : ""}`}>
          <span key={zone?.id || "idle"}>{zone ? zone.word : ""}</span>
        </div>

        {zone && (
          <ul className="living__fragments" key={zone.id}>
            {zone.fragments.map((f, i) => (
              <li key={f} style={{ "--i": i }}>
                {f}
              </li>
            ))}
          </ul>
        )}

        {!zone && !allFound && (
          <p className="living__hint">Move to explore — eyes · mind · chest · hands</p>
        )}

        <div className="living__progress" aria-hidden>
          {ZONES.map((z) => (
            <span
              key={z.id}
              className={discovered.has(z.id) ? "is-found" : ""}
              style={{
                "--c": `rgb(${z.color.map((c) => c * 255).join(",")})`,
              }}
            />
          ))}
        </div>

        <div className={`living__continue ${allFound ? "is-on" : ""}`}>
          <span>You've seen the whole of me</span>
          <a href="#work" data-cursor>
            Scroll to enter ↓
          </a>
        </div>
      </div>
    </section>
  );
}
