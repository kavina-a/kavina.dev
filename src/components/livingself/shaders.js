// Full-screen portrait reveal shader.
// Mixes a surface portrait with an "inside the mind" layer through an organic,
// noise-edged attention window that gravitates toward anatomical zones.

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uPortrait;
  uniform sampler2D uInside;
  uniform vec2  uResolution;   // canvas size (px)
  uniform vec2  uImageRes;     // portrait native size (px) for cover-fit
  uniform float uTime;

  uniform vec2  uPointer;      // smoothed attention point, uv space
  uniform float uReveal;       // 0..1 global reveal strength (lerped)
  uniform float uRadius;       // base reveal radius in uv
  uniform vec3  uZoneColor;    // active zone tint
  uniform float uZoneMix;      // how strongly to tint the inside layer

  uniform float uRipple;       // 0..1 ripple progress (GSAP)
  uniform vec2  uRipplePos;    // ripple origin uv
  uniform float uBreath;       // breathing phase value

  // ---- simplex-ish noise (Ashima) ----
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){
    const vec4 C=vec4(0.211324865,0.366025403,-0.577350269,0.024390243);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
    i=mod289(i);
    vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m=m*m; m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0;
    vec3 h=abs(x)-0.5;
    vec3 ox=floor(x+0.5);
    vec3 a0=x-ox;
    m*=1.79284291-0.85373472*(a0*a0+h*h);
    vec3 g;
    g.x=a0.x*x0.x+h.x*x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.0*dot(m,g);
  }
  float fbm(vec2 p){
    float s=0.0, a=0.5;
    for(int i=0;i<4;i++){ s+=a*snoise(p); p*=2.0; a*=0.5; }
    return s;
  }

  // cover-fit a texture sampled in screen uv given image + canvas aspect
  vec2 coverUv(vec2 uv, vec2 res, vec2 img){
    float ra = res.x/res.y;
    float ia = img.x/img.y;
    vec2 scale = (ra > ia) ? vec2(1.0, ia/ra) : vec2(ra/ia, 1.0);
    return (uv - 0.5) / scale + 0.5;
  }

  void main(){
    vec2 uv = vUv;

    // breathing: vertical micro-rise + tiny scale around chest
    float breath = uBreath;
    vec2 buv = uv;
    buv.y -= breath * 0.004;
    buv = (buv - vec2(0.5, 0.62)) * (1.0 - breath * 0.006) + vec2(0.5, 0.62);

    vec2 puv = coverUv(buv, uResolution, uImageRes);

    // aspect-correct distance to attention point
    float aspect = uResolution.x / uResolution.y;
    vec2 d = (uv - uPointer);
    d.x *= aspect;
    float dist = length(d);

    // organic, flowing mask edge
    float n = fbm(uv * 3.5 + uTime * 0.15) * 0.06;
    float edge = uRadius + n;
    float mask = smoothstep(edge, edge * 0.45, dist) * uReveal;

    // ripple ring (expanding) adds a momentary widening + glow
    vec2 rd = (uv - uRipplePos); rd.x *= aspect;
    float rdist = length(rd);
    float ring = smoothstep(0.02, 0.0, abs(rdist - uRipple * 0.6)) * (1.0 - uRipple);
    mask = clamp(mask + ring * 0.6, 0.0, 1.0);

    // depth-ish displacement: push inside-layer uvs along the gradient near edge
    float edgeBand = smoothstep(0.0, edge, dist) * (1.0 - smoothstep(edge, edge*1.4, dist));
    vec2 dir = normalize(d + 1e-5);
    vec2 disp = dir * edgeBand * 0.02 * uReveal;

    vec2 iuv = coverUv(buv + disp, uResolution, uImageRes);

    vec3 portrait = texture2D(uPortrait, puv).rgb;

    // chromatic aberration on the inside layer at the reveal edge
    float ca = edgeBand * 0.004;
    vec3 inside;
    inside.r = texture2D(uInside, iuv + dir*ca).r;
    inside.g = texture2D(uInside, iuv).g;
    inside.b = texture2D(uInside, iuv - dir*ca).b;

    // tint inside layer toward the active zone color
    inside = mix(inside, inside * (0.4 + uZoneColor), uZoneMix * 0.6);
    inside += uZoneColor * mask * 0.12; // glow bleed

    vec3 color = mix(portrait, inside, mask);

    // edge highlight line where surface "opens"
    float rim = smoothstep(edge*0.55, edge*0.45, dist) - smoothstep(edge*0.45, edge*0.3, dist);
    color += uZoneColor * rim * uReveal * 0.5;

    // idle vignette + film grain
    float vig = smoothstep(1.15, 0.35, length((uv-0.5)*vec2(aspect,1.0)));
    color *= 0.55 + 0.45 * vig;
    float grain = (fract(sin(dot(uv*uResolution + uTime, vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 0.04;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;
