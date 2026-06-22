// LiquidImage.js
//
// A single-image GPU "drag-field" distortion + in-frame parallax engine.
//
// Two effects layered on one full-frame textured quad:
//
//   1. PARALLAX REVEAL  — the visible crop of the cover-fit image pans
//      vertically based on the frame's position in the viewport. The face
//      resolves to centre as the frame reaches the middle of the screen, so
//      scrolling "moves into" the person.
//
//   2. LIQUID HOVER  — a low-res ping-pong velocity field. While the pointer
//      is over the frame we splat its motion into the field (Gaussian blobs of
//      velocity); the field decays every frame. The display pass samples the
//      image with UVs displaced by that field + a velocity-driven RGB split,
//      so the image melts/drags under the cursor and slowly recovers on leave.
//
// Same fluid-cursor family as the hero (PaintInvert) but stripped to a decaying
// drag map — no pressure solve needed for a displacement look, so it's cheap
// enough to run several instances at once.

import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
`;

const SPLAT_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTarget;
  uniform float uAspect;
  uniform float uRadius;
  uniform vec2  uPoint;
  uniform vec3  uColor;   // velocity (xy)
  varying vec2 vUv;
  void main(){
    vec2 d = vUv - uPoint;
    d.x *= uAspect;
    float blob = exp(-dot(d, d) / max(uRadius, 1e-5));
    vec3 base = texture2D(uTarget, vUv).xyz;
    // clamp so a dwelling cursor can't build an unbounded (un-recoverable) melt
    vec3 next = clamp(base + blob * uColor, -1.2, 1.2);
    gl_FragColor = vec4(next, 1.0);
  }
`;

const DECAY_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uDissipation;
  varying vec2 vUv;
  void main(){
    gl_FragColor = vec4(texture2D(uTexture, vUv).xyz * uDissipation, 1.0);
  }
`;

const DISPLAY_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uImage;
  uniform sampler2D uFlow;
  uniform vec2  uResolution;
  uniform vec2  uImageRes;
  uniform float uZoom;
  uniform float uParallax;
  uniform float uDisp;
  uniform float uCA;     // kept for uniform compat, intentionally unused
  uniform float uTime;
  uniform float uHover;  // 0 = idle, 1 = fully hovered (smooth lerp in JS)
  varying vec2 vUv;

  vec2 cover(vec2 uv){
    float ra = uResolution.x / uResolution.y;
    float ia = uImageRes.x / uImageRes.y;
    vec2 s = (ra > ia)
      ? vec2(uZoom, (ra / ia) * uZoom)
      : vec2((ia / ra) * uZoom, uZoom);
    vec2 c = (uv - 0.5) / s + 0.5;
    c.y += uParallax;
    return c;
  }

  void main(){
    vec2 flow   = texture2D(uFlow, vUv).xy;
    float mag   = length(flow);

    vec2 baseUv = cover(vUv);
    // Tiny UV shift keeps the fluid motion tactile without warping the face
    vec2 disp   = flow * uDisp;
    vec4 img    = texture2D(uImage, baseUv + disp);

    // ── Shadow-fluid hover state ─────────────────────────────────────────
    // 1. Desaturate + dim the whole frame (the "veil" that rolls in on entry)
    float luma  = dot(img.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3  moody = img.rgb * 0.22 + vec3(luma * 0.035);  // near-dark, faint colour

    // 2. Where the cursor has moved, push to deep near-black ink
    //    The flow field decays slowly so the trails persist like wet ink
    vec3  ink   = vec3(0.018, 0.012, 0.028);  // near-black with a purple warmth
    float trail = smoothstep(0.0, 0.45, mag);
    vec3  hov   = mix(moody, ink, trail * 0.92);

    // 3. Cross-fade: full colour ↔ shadow state, driven by uHover lerp
    vec3  result = mix(img.rgb, hov, uHover);

    gl_FragColor = vec4(result, 1.0);
  }
`;

export class LiquidImage {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = {
      flowResolution: 196,
      dissipation: 0.965,  // slow decay → trails linger like wet ink
      force: 20.0,         // strong injection → dramatic swirls
      splatRadius: 0.030,  // wider gaussian blobs → painterly strokes
      disp: 0.04,          // tiny UV shift — feels fluid without warping face
      ca: 0.0,
      zoom: 1.16,
      parallaxAmount: 0.12,
      parallaxDir: 1,
      pointerEase: 0.14,
      ...config,
    };

    this._raf = 0;
    this._disposed = false;
    this._inView = true;

    this._setupRenderer();
    this._setupScene();
    this._setupTargets();
    this._setupMaterials();
    this._loadImage(config.src);
    this._setupInput();
    this._loop();
  }

  _size() {
    const c = this.canvas;
    return {
      w: c.clientWidth || 1,
      h: c.clientHeight || 1,
    };
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
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
      this._setupTargets();
      this.material.display.uniforms.uResolution.value.set(this.width, this.height);
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
    this._disposeTargets();
    const res = this.config.flowResolution;
    const aspect = this.width / this.height;
    const w = res;
    const h = Math.max(1, Math.round(res / aspect));

    const opts = {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    };
    const single = () => new THREE.WebGLRenderTarget(w, h, opts);
    this.flow = {
      read: single(),
      write: single(),
      swap() {
        const t = this.read;
        this.read = this.write;
        this.write = t;
      },
    };
    this.flowAspect = aspect;
  }

  _disposeTargets() {
    if (this.flow) {
      this.flow.read.dispose();
      this.flow.write.dispose();
    }
  }

  _setupMaterials() {
    const make = (frag, uniforms) =>
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms });

    this.material = {
      splat: make(SPLAT_FRAG, {
        uTarget: { value: null },
        uAspect: { value: 1 },
        uRadius: { value: this.config.splatRadius },
        uPoint: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Vector3() },
      }),
      decay: make(DECAY_FRAG, {
        uTexture: { value: null },
        uDissipation: { value: this.config.dissipation },
      }),
      display: make(DISPLAY_FRAG, {
        uImage: { value: null },
        uFlow: { value: null },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uImageRes: { value: new THREE.Vector2(1, 1) },
        uZoom: { value: this.config.zoom },
        uParallax: { value: 0 },
        uDisp: { value: this.config.disp },
        uCA: { value: this.config.ca },
        uTime: { value: 0 },
        uHover: { value: 0 },
      }),
    };
  }

  _loadImage(src) {
    if (!src) return;
    const loader = new THREE.TextureLoader();
    loader.load(src, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      this.texture = tex;
      const img = tex.image;
      this.material.display.uniforms.uImage.value = tex;
      this.material.display.uniforms.uImageRes.value.set(
        img?.width || 1,
        img?.height || 1
      );
    });
  }

  _setupInput() {
    this.pointer = { x: 0.5, y: 0.5 };
    this.smooth = { x: 0.5, y: 0.5, px: 0.5, py: 0.5 };
    this.hovering = false;
    this.hasMoved = false;
    this._hoverProgress = 0; // current lerped value sent to uHover
    this._hoverTarget   = 0; // target: 0 = idle, 1 = hovered

    const uvFromEvent = (clientX, clientY) => {
      const r = this.canvas.getBoundingClientRect();
      return {
        x: (clientX - r.left) / Math.max(r.width, 1),
        y: 1 - (clientY - r.top) / Math.max(r.height, 1),
      };
    };

    this._onEnter = () => {
      this.hovering      = true;
      this._hoverTarget  = 1;
    };
    this._onLeave = () => {
      this.hovering      = false;
      this.hasMoved      = false;
      this._hoverTarget  = 0;
    };
    this._onMove = (e) => {
      const { x, y } = uvFromEvent(e.clientX, e.clientY);
      this.pointer.x = x;
      this.pointer.y = y;
      if (!this.hasMoved) {
        this.smooth.x = this.smooth.px = x;
        this.smooth.y = this.smooth.py = y;
        this.hasMoved = true;
      }
    };

    this.canvas.addEventListener("pointerenter", this._onEnter);
    this.canvas.addEventListener("pointerleave", this._onLeave);
    this.canvas.addEventListener("pointermove", this._onMove);
  }

  setInView(v) {
    this._inView = v;
  }

  _pass(material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  _splat(x, y, vx, vy) {
    const m = this.material.splat;
    m.uniforms.uAspect.value = this.flowAspect;
    m.uniforms.uPoint.value.set(x, y);
    m.uniforms.uColor.value.set(vx, vy, 0);
    m.uniforms.uTarget.value = this.flow.read.texture;
    this._pass(m, this.flow.write);
    this.flow.swap();
  }

  _updateParallax() {
    // progress: 0 when the frame's centre is at the viewport bottom,
    // 1 when at the top. 0.5 == perfectly centred → face fully revealed.
    const r = this.canvas.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const center = r.top + r.height / 2;
    const p = 1 - center / vh; // 0 (bottom) .. 1 (top)
    const eased = Math.max(0, Math.min(1, p));
    const { parallaxAmount, parallaxDir } = this.config;
    this.material.display.uniforms.uParallax.value =
      (eased - 0.5) * parallaxAmount * parallaxDir;
  }

  _loop() {
    const animate = () => {
      if (this._disposed) return;
      this._raf = requestAnimationFrame(animate);
      if (!this._inView) return;

      const t = performance.now() * 0.001;
      this.material.display.uniforms.uTime.value = t;

      this._updateParallax();

      // Smooth hover veil transition (~1.2 s in, ~1.8 s out)
      const hEaseIn  = 0.045;
      const hEaseOut = 0.030;
      const hEase = this._hoverTarget > this._hoverProgress ? hEaseIn : hEaseOut;
      this._hoverProgress += (this._hoverTarget - this._hoverProgress) * hEase;
      this.material.display.uniforms.uHover.value = this._hoverProgress;

      // decay the drag field one step
      this.material.decay.uniforms.uTexture.value = this.flow.read.texture;
      this._pass(this.material.decay, this.flow.write);
      this.flow.swap();

      // splat pointer motion (only while actually hovering)
      if (this.hovering && this.hasMoved) {
        const ease = this.config.pointerEase;
        this.smooth.px = this.smooth.x;
        this.smooth.py = this.smooth.y;
        this.smooth.x += (this.pointer.x - this.smooth.x) * ease;
        this.smooth.y += (this.pointer.y - this.smooth.y) * ease;

        const dx = this.smooth.x - this.smooth.px;
        const dy = this.smooth.y - this.smooth.py;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.0008) {
          const force = this.config.force;
          const steps = Math.min(8, Math.max(1, Math.floor(dist / 0.01)));
          for (let i = 1; i <= steps; i++) {
            const f = i / steps;
            this._splat(
              this.smooth.px + dx * f,
              this.smooth.py + dy * f,
              dx * force,
              dy * force
            );
          }
        }
      }

      // composite to screen
      this.material.display.uniforms.uFlow.value = this.flow.read.texture;
      this._pass(this.material.display, null);
    };
    animate();
  }

  dispose() {
    this._disposed = true;
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    this.canvas.removeEventListener("pointerenter", this._onEnter);
    this.canvas.removeEventListener("pointerleave", this._onLeave);
    this.canvas.removeEventListener("pointermove", this._onMove);
    this._disposeTargets();
    Object.values(this.material || {}).forEach((m) => m.dispose());
    if (this.texture) this.texture.dispose();
    this.quad.geometry.dispose();
    this.renderer.dispose();
  }
}
