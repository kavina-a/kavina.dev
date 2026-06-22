// Classic GPU-Gems stable-fluids shader set.
// Key improvements over the verbatim reference:
//   - advection: Catmull-Rom bicubic source sampling (4 bilinear taps) to
//     avoid numerical diffusion blurring the ink edges each frame; separate
//     uSourceTexelSize so the dye (1024px) and velocity (128px) fields both
//     use their own correct texel size.
//   - splat: clean Gaussian only (no FBM distortion) — swirl comes from
//     vorticity physics, not noise.
//   - display: clean smoothstep edge (no FBM noise) — crisp, feathered ink.

const v = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position, 1.); }`;
const p = `precision highp float;`;
const s = `precision mediump sampler2D;`;

export default {
  splat: [
    v,
    `${p} ${s}
    uniform sampler2D uTarget;
    uniform float aspectRatio, radius;
    uniform vec3 color;
    uniform vec2 point;
    varying vec2 vUv;
    void main(){
      vec2 d = vUv - point;
      d.x *= aspectRatio;
      float blob = exp(-dot(d,d) / max(radius, 1e-5));
      gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + blob * color, 1.);
    }`,
  ],

  advection: [
    v,
    `${p} ${s}
    uniform sampler2D uVelocity, uSource;
    // texelSize       = 1/simSize  — for velocity field look-up
    // uSourceTexelSize = 1/simSize or 1/dyeSize — for source field look-up
    uniform vec2 texelSize, uSourceTexelSize;
    uniform float dt, dissipation;
    varying vec2 vUv;

    // Catmull-Rom bicubic: 4 bilinear taps, avoids the numerical-diffusion
    // blur that standard bilinear advection introduces each frame.
    vec4 bicubic(sampler2D tex, vec2 uv, vec2 txSz) {
      vec2 tc = uv / txSz - 0.5;
      vec2 i = floor(tc);
      vec2 f = tc - i;
      vec2 f2 = f*f, f3 = f2*f;
      vec2 w0 = -0.5*f3 +     f2 - 0.5*f;
      vec2 w1 =  1.5*f3 - 2.5*f2 + 1.0;
      vec2 w2 = -1.5*f3 + 2.0*f2 + 0.5*f;
      vec2 w3 =  0.5*f3 - 0.5*f2;
      vec2 g0 = w0 + w1;
      vec2 g1 = w2 + w3;
      // Safeguard against divide-by-zero at integer texel centres.
      vec2 h0 = (i - 0.5 + w1/max(g0, 1e-6)) * txSz;
      vec2 h1 = (i + 0.5 + w3/max(g1, 1e-6)) * txSz;
      return g0.x*g0.y * texture2D(tex, vec2(h0.x, h0.y))
           + g1.x*g0.y * texture2D(tex, vec2(h1.x, h0.y))
           + g0.x*g1.y * texture2D(tex, vec2(h0.x, h1.y))
           + g1.x*g1.y * texture2D(tex, vec2(h1.x, h1.y));
    }

    void main(){
      // Back-advect: step backwards along velocity to find where this texel
      // came from last frame, then sample the source there.
      vec2 vel = texture2D(uVelocity, vUv).xy;
      vec2 coord = vUv - dt * vel * texelSize;
      gl_FragColor = vec4(dissipation * bicubic(uSource, coord, uSourceTexelSize).rgb, 1.);
    }`,
  ],

  divergence: [
    v,
    `${p} ${s}
    uniform sampler2D uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    vec2 vel(vec2 uv){ vec2 e=vec2(1.); if(uv.x<0.){uv.x=0.;e.x=-1.;} if(uv.x>1.){uv.x=1.;e.x=-1.;} if(uv.y<0.){uv.y=0.;e.y=-1.;} if(uv.y>1.){uv.y=1.;e.y=-1.;} return e*texture2D(uVelocity,uv).xy; }
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); gl_FragColor=vec4(.5*(vel(R).x-vel(L).x+vel(T).y-vel(B).y),0.,0.,1.); }`,
  ],

  curl: [
    v,
    `${p} ${s}
    uniform sampler2D uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); gl_FragColor=vec4(texture2D(uVelocity,R).y-texture2D(uVelocity,L).y-texture2D(uVelocity,T).x+texture2D(uVelocity,B).x,0.,0.,1.); }`,
  ],

  vorticity: [
    v,
    `${p} ${s}
    uniform sampler2D uVelocity,uCurl; uniform vec2 texelSize; uniform float curlStrength,dt; varying vec2 vUv;
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); vec2 f=normalize(vec2(abs(texture2D(uCurl,T).x)-abs(texture2D(uCurl,B).x),abs(texture2D(uCurl,R).x)-abs(texture2D(uCurl,L).x))+.0001)*curlStrength*texture2D(uCurl,vUv).x; gl_FragColor=vec4(texture2D(uVelocity,vUv).xy+f*dt,0.,1.); }`,
  ],

  pressure: [
    v,
    `${p} ${s}
    uniform sampler2D uPressure,uDivergence; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ vec2 L=clamp(vUv-vec2(texelSize.x,0.),0.,1.),R=clamp(vUv+vec2(texelSize.x,0.),0.,1.),T=clamp(vUv+vec2(0.,texelSize.y),0.,1.),B=clamp(vUv-vec2(0.,texelSize.y),0.,1.); gl_FragColor=vec4((texture2D(uPressure,L).x+texture2D(uPressure,R).x+texture2D(uPressure,T).x+texture2D(uPressure,B).x-texture2D(uDivergence,vUv).x)*.25,0.,0.,1.); }`,
  ],

  gradientSubtract: [
    v,
    `${p} ${s}
    uniform sampler2D uPressure,uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ float pL=texture2D(uPressure,clamp(vUv-vec2(texelSize.x,0.),0.,1.)).x,pR=texture2D(uPressure,clamp(vUv+vec2(texelSize.x,0.),0.,1.)).x,pT=texture2D(uPressure,clamp(vUv+vec2(0.,texelSize.y),0.,1.)).x,pB=texture2D(uPressure,clamp(vUv-vec2(0.,texelSize.y),0.,1.)).x; gl_FragColor=vec4(texture2D(uVelocity,vUv).xy-vec2(pR-pL,pT-pB),0.,1.); }`,
  ],

  clear: [
    v,
    `${p} ${s}
    uniform sampler2D uTexture; uniform float value; varying vec2 vUv;
    void main(){ gl_FragColor=value*texture2D(uTexture,vUv); }`,
  ],

  display: [
    v,
    `${p}
    uniform sampler2D uTexture;
    uniform float threshold, edgeSoftness;
    uniform vec3 inkColor;
    varying vec2 vUv;
    void main(){
      float d = clamp(length(texture2D(uTexture, vUv).rgb), 0., 1.);
      // Clean smoothstep edge — no FBM roughness. The organic swirl comes
      // from curl vorticity physics, not noise on the display boundary.
      // Clamp lower bound > 0 so d=0 (empty page) maps to alpha=0 exactly.
      float lo = max(threshold - edgeSoftness * 0.5, edgeSoftness * 0.5 + 1e-4);
      float hi = lo + edgeSoftness;
      float a = smoothstep(lo, hi, d);
      gl_FragColor = vec4(inkColor, a);
    }`,
  ],
};
