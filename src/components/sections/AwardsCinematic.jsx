import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { gsap } from "../../lib/gsap";
import { TECHSTACK } from "../../data/site";
import { StackIcon } from "./stackIcons";
import "./AwardsCinematic.css";

const {
  Engine,
  Runner,
  Bodies,
  Composite,
  Mouse,
  MouseConstraint,
  Body,
  Events,
  Query,
} = Matter;

const CHIP = 0x0001;
const WALL = 0x0002;

const CONFIG = {
  chipSize: 56,
  gravity: 1,
  restitution: 0.55,
  friction: 0.12,
  frictionAir: 0.02,
  dropStaggerMs: 68,
  wallThickness: 80,
  inset: 12,
};

function stripMatterMouseListeners(mouse) {
  const el = mouse.element;
  if (!el) return;
  el.removeEventListener("mousemove", mouse.mousemove);
  el.removeEventListener("mousedown", mouse.mousedown);
  el.removeEventListener("mouseup", mouse.mouseup);
  el.removeEventListener("wheel", mouse.mousewheel);
  el.removeEventListener("mousewheel", mouse.mousewheel);
  el.removeEventListener("DOMMouseScroll", mouse.mousewheel);
  el.removeEventListener("touchmove", mouse.mousemove);
  el.removeEventListener("touchstart", mouse.mousedown);
  el.removeEventListener("touchend", mouse.mouseup);
}

function syncMouseFromPointer(mouse, field, event) {
  const rect = field.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  // Mutate in place — MouseConstraint.pointA is a reference to this object.
  mouse.position.x = x;
  mouse.position.y = y;
  mouse.absolute.x = x;
  mouse.absolute.y = y;
}

function chipSizeForWidth(width) {
  if (width < 480) return 46;
  if (width < 720) return 50;
  return CONFIG.chipSize;
}

function scatterChip(i, n, W, H, size) {
  const cols = Math.min(8, Math.max(4, Math.ceil(n / 2)));
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x = 28 + col * ((W - 56) / cols) + (i % 3) * 6;
  const y = H - size - 20 - row * (size * 0.62) - (i % 2) * 8;
  const r = ((i % 5) - 2) * 7;
  return { x, y, r };
}

export default function AwardsCinematic() {
  const sectionRef = useRef(null);
  const fieldRef = useRef(null);
  const labelRef = useRef(null);
  const headingRef = useRef(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const section = sectionRef.current;
    const label = labelRef.current;
    const heading = headingRef.current;
    if (!section || !label || !heading) return;

    const words = heading.querySelectorAll(".ac-word");
    gsap.set(label, { y: 18, opacity: 0 });
    gsap.set(words, { yPercent: 110, opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      scrollTrigger: {
        trigger: section,
        start: "top 78%",
        toggleActions: "play none none none",
        once: true,
      },
    });

    tl.to(label, { y: 0, opacity: 1, duration: 0.55 }).to(
      words,
      { yPercent: 0, opacity: 1, stagger: 0.05, duration: 0.7 },
      0.12
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const chipEls = () => Array.from(field.querySelectorAll(".stack-chip"));

    let engine = null;
    let runner = null;
    let raf = 0;
    let bodies = [];
    let dropTimers = [];
    let started = false;
    let resizeTimer = 0;
    let size = CONFIG.chipSize;
    let inputAbort = null;

    const placeStatic = () => {
      const W = field.clientWidth;
      const H = field.clientHeight;
      size = chipSizeForWidth(W);
      chipEls().forEach((el, i) => {
        el.style.setProperty("--chip-size", `${size}px`);
        const p = scatterChip(i, TECHSTACK.length, W, H, size);
        el.style.visibility = "visible";
        el.style.pointerEvents = "auto";
        el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`;
      });
    };

    const teardown = () => {
      dropTimers.forEach(clearTimeout);
      dropTimers = [];
      inputAbort?.abort();
      inputAbort = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (runner) Runner.stop(runner);
      if (engine) {
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      }
      engine = null;
      runner = null;
      bodies = [];
      field.classList.remove("is-dragging");
      window.__lenis?.start();
    };

    const renderLoop = () => {
      if (!engine) return;
      chipEls().forEach((el, i) => {
        const b = bodies[i];
        if (!b || !Composite.get(engine.world, b.id, "body")) return;
        el.style.visibility = "visible";
        el.style.pointerEvents = "auto";
        el.style.transform = `translate(${b.position.x - size / 2}px, ${
          b.position.y - size / 2
        }px) rotate(${b.angle}rad)`;
      });
      raf = requestAnimationFrame(renderLoop);
    };

    const initPhysics = () => {
      teardown();

      const W = field.clientWidth;
      const H = field.clientHeight;
      if (W < 40 || H < 40) return;

      size = chipSizeForWidth(W);
      const t = CONFIG.wallThickness;
      const inset = CONFIG.inset;
      const els = chipEls();

      els.forEach((el) => {
        el.style.setProperty("--chip-size", `${size}px`);
        el.style.visibility = "hidden";
        el.style.pointerEvents = "none";
      });

      engine = Engine.create({ enableSleeping: false });
      engine.gravity.y = CONFIG.gravity;

      const wallFilter = { category: WALL, mask: 0xffffffff };
      const walls = [
        Bodies.rectangle(W / 2, H - inset + t / 2, W + t * 2, t, {
          isStatic: true,
          collisionFilter: wallFilter,
        }),
        Bodies.rectangle(-t / 2 + inset, H / 2, t, H * 4, {
          isStatic: true,
          collisionFilter: wallFilter,
        }),
        Bodies.rectangle(W + t / 2 - inset, H / 2, t, H * 4, {
          isStatic: true,
          collisionFilter: wallFilter,
        }),
      ];
      Composite.add(engine.world, walls);

      bodies = els.map((_, i) => {
        const x = size + Math.random() * Math.max(24, W - size * 2);
        const y = -70 - i * 44;
        const body = Bodies.rectangle(x, y, size, size, {
          chamfer: { radius: size * 0.24 },
          restitution: CONFIG.restitution,
          friction: CONFIG.friction,
          frictionAir: CONFIG.frictionAir,
          density: 0.002,
          angle: (Math.random() - 0.5) * 1.05,
          collisionFilter: { category: CHIP, mask: 0xffffffff },
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.14);
        return body;
      });

      bodies.forEach((body, i) => {
        dropTimers.push(
          setTimeout(() => {
            if (engine) Composite.add(engine.world, body);
          }, i * CONFIG.dropStaggerMs)
        );
      });

      const mouse = Mouse.create(field);
      mouse.pixelRatio = 1;
      stripMatterMouseListeners(mouse);

      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        collisionFilter: { category: CHIP, mask: CHIP },
        constraint: {
          stiffness: 0.2,
          damping: 0.05,
          angularStiffness: 0,
          render: { visible: false },
        },
      });
      Composite.add(engine.world, mouseConstraint);

      inputAbort = new AbortController();
      const { signal } = inputAbort;

      const onPointerDown = (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        syncMouseFromPointer(mouse, field, event);
        const hit = Query.point(bodies, mouse.position)[0];
        if (!hit) {
          mouse.button = -1;
          return;
        }
        mouse.button = 0;
        event.preventDefault();
        field.classList.add("is-dragging");
        window.__lenis?.stop();
        try {
          field.setPointerCapture(event.pointerId);
        } catch {
          /* capture is optional — window listeners still track the drag */
        }
        const idx = bodies.indexOf(hit);
        if (idx >= 0) setActive(TECHSTACK[idx].name);
      };

      const onPointerMove = (event) => {
        if (mouse.button !== 0) return;
        syncMouseFromPointer(mouse, field, event);
        event.preventDefault();
      };

      const onPointerUp = () => {
        if (mouse.button !== 0) return;
        mouse.button = -1;
        field.classList.remove("is-dragging");
        window.__lenis?.start();
      };

      field.addEventListener("pointerdown", onPointerDown, { signal });
      window.addEventListener("pointermove", onPointerMove, {
        signal,
        passive: false,
      });
      window.addEventListener("pointerup", onPointerUp, { signal });
      window.addEventListener("pointercancel", onPointerUp, { signal });
      field.addEventListener(
        "touchmove",
        (event) => {
          if (mouse.button === 0) event.preventDefault();
        },
        { signal, passive: false }
      );

      Events.on(mouseConstraint, "startdrag", (event) => {
        const idx = bodies.indexOf(event.body);
        if (idx >= 0) setActive(TECHSTACK[idx].name);
      });
      Events.on(mouseConstraint, "enddrag", () => {
        field.classList.remove("is-dragging");
        window.__lenis?.start();
      });

      runner = Runner.create();
      Runner.run(runner, engine);
      raf = requestAnimationFrame(renderLoop);
    };

    if (prefersReduced) {
      placeStatic();
      return () => {};
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          initPhysics();
        }
      },
      { threshold: 0.28 }
    );
    io.observe(field);

    const onResize = () => {
      if (!started) return;
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(initPhysics, 240);
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      teardown();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="stack"
      id="techstack"
      data-cursor-ink
    >
      <div className="stack__intro">
        <p ref={labelRef} className="stack__label">
          Tech Stack
        </p>
        <h2 ref={headingRef} className="stack__heading">
          <span className="ac-line">
            <span className="ac-word">The</span>{" "}
            <span className="ac-word">tools</span>{" "}
            <span className="ac-word">I</span>
          </span>
          <span className="ac-line">
            <span className="ac-word">actually</span>{" "}
            <span className="ac-word">reach</span>{" "}
            <span className="ac-word">for.</span>
          </span>
        </h2>
      </div>

      <figure className="stack__case">
        <div
          ref={fieldRef}
          className="stack__field"
          id="chipField"
          data-lenis-prevent
          aria-label="Interactive tech stack. Drag the tiles."
        >
          {TECHSTACK.map((item) => (
            <div
              key={item.slug}
              className="stack-chip"
              data-cursor
              data-fit={item.fit || undefined}
              onPointerEnter={() => setActive(item.name)}
              onPointerLeave={() => setActive(null)}
            >
              <StackIcon slug={item.slug} />
              <span className="sr-only">{item.name}</span>
            </div>
          ))}
        </div>
        <figcaption className="stack__plate">
          <span className="stack__plate-name">{active ?? "Drag a tile"}</span>
          <span className="stack__plate-count">{TECHSTACK.length}</span>
        </figcaption>
      </figure>
    </section>
  );
}
