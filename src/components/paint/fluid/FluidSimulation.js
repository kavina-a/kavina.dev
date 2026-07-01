// FluidSimulation.js
//
// Three.js GPU stable-fluids (Navier-Stokes) solver — the Codegrid/Cappen
// fluid-cursor technique. Ported from the reconstructed reference with these
// hardenings over the original:
//   - sizes to the *canvas element* (not window), so it can be embedded;
//   - recreates render targets on resize (the original only resized the GL
//     viewport, leaving the sim at the old resolution);
//   - lerps the pointer so the trail glides smoothly and emits multiple
//     interpolated splats per frame (no gaps on fast movement);
//   - feeds uTime into the noise-enhanced splat/display shaders;
//   - exposes dispose() for clean React unmount.

import * as THREE from "three";
import shaders from "./shaders.js";

export class FluidSimulation {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = config;
    this._raf = 0;
    this._disposed = false;
    this._clock = new THREE.Clock();

    this._setupRenderer(canvas);
    this._setupScene();
    this._setupTargets();
    this._setupMaterials();
    this._setupInput();
    this._loop();
  }

  _size() {
    const c = this.canvas;
    const w = c.clientWidth || window.innerWidth;
    const h = c.clientHeight || window.innerHeight;
    return { w, h };
  }

  _setupRenderer(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.dpr);

    const { w, h } = this._size();
    this.renderer.setSize(w, h, false);
    this.width = w * this.dpr;
    this.height = h * this.dpr;

    this._onResize = () => {
      const { w, h } = this._size();
      this.renderer.setSize(w, h, false);
      this.width = w * this.dpr;
      this.height = h * this.dpr;
      this._setupTargets(); // recreate at the new aspect/resolution
    };
    window.addEventListener("resize", this._onResize);
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.scene.add(this.quad);
  }

  _setupTargets() {
    // free previous targets if we're resizing
    this._disposeTargets();

    const { simResolution: simRes, dyeResolution: dyeRes } = this.config;
    const aspect = this.width / this.height;
    const options = {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    };

    const single = (w, h) => new THREE.WebGLRenderTarget(w, h, options);
    const double = (w, h) => ({
      read: single(w, h),
      write: single(w, h),
      swap() {
        const t = this.read;
        this.read = this.write;
        this.write = t;
      },
    });

    this.simSize = { w: simRes, h: Math.max(1, Math.round(simRes / aspect)) };
    this.dyeSize = { w: dyeRes, h: Math.max(1, Math.round(dyeRes / aspect)) };

    this.velocity = double(this.simSize.w, this.simSize.h);
    this.dye = double(this.dyeSize.w, this.dyeSize.h);
    this.divergence = single(this.simSize.w, this.simSize.h);
    this.curl = single(this.simSize.w, this.simSize.h);
    this.pressure = double(this.simSize.w, this.simSize.h);
  }

  _disposeTargets() {
    const all = [this.velocity, this.dye, this.pressure];
    for (const d of all) {
      if (d) { d.read.dispose(); d.write.dispose(); }
    }
    if (this.divergence) this.divergence.dispose();
    if (this.curl) this.curl.dispose();
  }

  _setupMaterials() {
    const make = ([vert, frag], uniforms) =>
      new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms });
    const tex = () => ({ value: null });
    const num = (v = 0) => ({ value: v });
    const vec2 = () => ({ value: new THREE.Vector2() });

    this.material = {
      splat: make(shaders.splat, {
        uTarget: tex(),
        aspectRatio: num(),
        radius: num(),
        color: { value: new THREE.Vector3() },
        point: { value: new THREE.Vector2() },
      }),
      advection: make(shaders.advection, {
        uVelocity: tex(),
        uSource: tex(),
        texelSize: vec2(),        // velocity field texel size (1/simSize)
        uSourceTexelSize: vec2(), // source field texel size (1/simSize or 1/dyeSize)
        dt: num(),
        dissipation: num(1),
      }),
      divergence: make(shaders.divergence, { uVelocity: tex(), texelSize: vec2() }),
      curl: make(shaders.curl, { uVelocity: tex(), texelSize: vec2() }),
      vorticity: make(shaders.vorticity, {
        uVelocity: tex(),
        uCurl: tex(),
        texelSize: vec2(),
        curlStrength: num(),
        dt: num(),
      }),
      pressure: make(shaders.pressure, {
        uPressure: tex(),
        uDivergence: tex(),
        texelSize: vec2(),
      }),
      gradientSubtract: make(shaders.gradientSubtract, {
        uPressure: tex(),
        uVelocity: tex(),
        texelSize: vec2(),
      }),
      clear: make(shaders.clear, { uTexture: tex(), value: num() }),
      display: make(shaders.display, {
        uTexture: tex(),
        threshold: num(),
        edgeSoftness: num(),
        inkColor: { value: new THREE.Color() },
      }),
    };
  }

  _setupInput() {
    // raw pointer (target), smoothed pointer (lerped), and previous smoothed
    this.pointer = { x: 0, y: 0 };
    this.smooth = { x: 0, y: 0, prevX: 0, prevY: 0 };
    this.hasPointer = false;

    const rectXY = (clientX, clientY) => {
      const r = this.canvas.getBoundingClientRect();
      return { x: (clientX - r.left) * this.dpr, y: (clientY - r.top) * this.dpr };
    };

    this._onMove = (e) => {
      const { x, y } = rectXY(e.clientX, e.clientY);
      this.pointer.x = x;
      this.pointer.y = y;
      if (!this.hasPointer) {
        // first move: snap so we don't splat a line from (0,0)
        this.smooth.x = this.smooth.prevX = x;
        this.smooth.y = this.smooth.prevY = y;
        this.hasPointer = true;
      }
    };
    this._onTouch = (e) => {
      if (!e.touches[0]) return;
      const t = e.touches[0];
      const { x, y } = rectXY(t.clientX, t.clientY);
      this.pointer.x = x;
      this.pointer.y = y;
      if (!this.hasPointer) {
        this.smooth.x = this.smooth.prevX = x;
        this.smooth.y = this.smooth.prevY = y;
        this.hasPointer = true;
      }
    };
    window.addEventListener("mousemove", this._onMove);
    // Canvas-only, passive — never block native vertical scroll on mobile.
    this.canvas.addEventListener("touchstart", this._onTouch, { passive: true });
    this.canvas.addEventListener("touchmove", this._onTouch, { passive: true });
  }

  _set(material, uniforms) {
    for (const key in uniforms) {
      if (material.uniforms[key]) material.uniforms[key].value = uniforms[key];
    }
  }

  _pass(material, target = null) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  _splat(x, y, velocityX, velocityY) {
    const { material: m, velocity: vel, dye, width, height, config: c } = this;
    this._set(m.splat, {
      aspectRatio: width / height,
      point: new THREE.Vector2(x / width, 1 - y / height),
      radius: c.splatRadius / 100,
    });

    this._set(m.splat, {
      uTarget: vel.read.texture,
      color: new THREE.Vector3(velocityX, -velocityY, 0),
    });
    this._pass(m.splat, vel.write);
    vel.swap();

    const dyeAmt = c.dyeAmount ?? 3;
    this._set(m.splat, {
      uTarget: dye.read.texture,
      color: new THREE.Vector3(dyeAmt, dyeAmt, dyeAmt),
    });
    this._pass(m.splat, dye.write);
    dye.swap();
  }

  _loop() {
    const animate = () => {
      if (this._disposed) return;
      this._raf = requestAnimationFrame(animate);

      const { material: m, velocity: vel, dye, divergence, curl, pressure, config: c } = this;
      const texelSize = new THREE.Vector2(1 / this.simSize.w, 1 / this.simSize.h);
      const dyeTexelSize = new THREE.Vector2(1 / this.dyeSize.w, 1 / this.dyeSize.h);
      const dt = 0.016;

      // --- smooth (lerp) the pointer and emit interpolated splats ---
      if (this.hasPointer) {
        const ease = c.pointerEase ?? 0.18;
        this.smooth.prevX = this.smooth.x;
        this.smooth.prevY = this.smooth.y;
        this.smooth.x += (this.pointer.x - this.smooth.x) * ease;
        this.smooth.y += (this.pointer.y - this.smooth.y) * ease;

        const dx = this.smooth.x - this.smooth.prevX;
        const dy = this.smooth.y - this.smooth.prevY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.1) {
          const force = c.forceStrength ?? 6;
          // sub-step along the path so fast moves stay continuous
          const steps = Math.min(8, Math.max(1, Math.floor(dist / 8)));
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            this._splat(
              this.smooth.prevX + dx * t,
              this.smooth.prevY + dy * t,
              dx * force,
              dy * force,
            );
          }
        }
      }

      this._set(m.curl, { uVelocity: vel.read.texture, texelSize });
      this._pass(m.curl, curl);

      this._set(m.vorticity, {
        uVelocity: vel.read.texture,
        uCurl: curl.texture,
        texelSize,
        curlStrength: c.curl ?? 20,
        dt,
      });
      this._pass(m.vorticity, vel.write);
      vel.swap();

      this._set(m.divergence, { uVelocity: vel.read.texture, texelSize });
      this._pass(m.divergence, divergence);

      this._set(m.clear, {
        uTexture: pressure.read.texture,
        value: c.pressureDissipation ?? 0.8,
      });
      this._pass(m.clear, pressure.write);
      pressure.swap();

      for (let i = 0; i < (c.pressureIterations ?? 20); i++) {
        this._set(m.pressure, {
          uPressure: pressure.read.texture,
          uDivergence: divergence.texture,
          texelSize,
        });
        this._pass(m.pressure, pressure.write);
        pressure.swap();
      }

      this._set(m.gradientSubtract, {
        uPressure: pressure.read.texture,
        uVelocity: vel.read.texture,
        texelSize,
      });
      this._pass(m.gradientSubtract, vel.write);
      vel.swap();

      // Velocity self-advection — source and target are both at simSize.
      this._set(m.advection, {
        uVelocity: vel.read.texture,
        uSource: vel.read.texture,
        texelSize,
        uSourceTexelSize: texelSize, // same resolution as velocity
        dt,
        dissipation: c.velocityDissipation ?? 0.98,
      });
      this._pass(m.advection, vel.write);
      vel.swap();

      // Dye advection — source is at dyeSize (higher res), velocity at simSize.
      // Using the correct dyeTexelSize for the Catmull-Rom bicubic source lookup
      // avoids bilinear numerical diffusion blurring the ink each frame.
      this._set(m.advection, {
        uVelocity: vel.read.texture,
        uSource: dye.read.texture,
        texelSize,
        uSourceTexelSize: dyeTexelSize, // correct size for dye buffer
        dt,
        dissipation: c.dyeDissipation ?? 0.97,
      });
      this._pass(m.advection, dye.write);
      dye.swap();

      this._set(m.display, {
        uTexture: dye.read.texture,
        threshold: c.threshold ?? 0.05,
        edgeSoftness: c.edgeSoftness ?? 0.1,
        inkColor: new THREE.Color(c.inkColor ?? "#000000"),
      });
      this._pass(m.display, null);
    };
    animate();
  }

  dispose() {
    this._disposed = true;
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("mousemove", this._onMove);
    this.canvas.removeEventListener("touchstart", this._onTouch);
    this.canvas.removeEventListener("touchmove", this._onTouch);
    this._disposeTargets();
    Object.values(this.material || {}).forEach((mat) => mat.dispose());
    this.quad.geometry.dispose();
    this.renderer.dispose();
  }
}
