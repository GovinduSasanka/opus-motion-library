import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useVideoConfig} from 'remotion';

/**
 * Shared helpers for the 3d/ family (three.js via @remotion/three).
 * Rules: everything is a pure function of useCurrentFrame(); cameras are set explicitly every frame;
 * geometry is generated in useMemo keyed on props and mutated in useLayoutEffect (runs before
 * ThreeCanvas' manual frame advance).
 */

export type V3 = [number, number, number];

/** full-frame ThreeCanvas. `flat` = no tone mapping (palette-accurate clay looks). */
export const Stage3D: React.FC<{
  children: React.ReactNode;
  shadows?: boolean | 'soft' | 'basic' | 'percentage' | 'variance';
  flat?: boolean;
  exposure?: number;
  style?: React.CSSProperties;
  transparent?: boolean;
}> = ({children, shadows = false, flat = false, exposure = 1, style, transparent = true}) => {
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={1}
      shadows={shadows}
      flat={flat}
      gl={{antialias: true, alpha: transparent, preserveDrawingBuffer: true, toneMappingExposure: exposure}}
      style={{position: 'absolute', inset: 0, ...style}}
    >
      {children}
    </ThreeCanvas>
  );
};

/** Sets the default perspective camera every frame. */
export const CameraRig: React.FC<{position: V3; target: V3; fov?: number; up?: V3; near?: number; far?: number; roll?: number}> = ({
  position,
  target,
  fov = 40,
  up = [0, 1, 0],
  near = 0.1,
  far = 2000,
  roll = 0,
}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const key = [...position, ...target, fov, ...up, near, far, roll, size.width, size.height].join(',');
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.up.set(...up);
    camera.lookAt(...target);
    if (roll) camera.rotateZ(roll);
    camera.fov = fov;
    camera.near = near;
    camera.far = far;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, camera]);
  return null;
};

/** a JS-side camera with the same params, for projecting points (lens ghosts, labels) */
export const makeCamera = (position: V3, target: V3, fov: number, aspect: number, up: V3 = [0, 1, 0]) => {
  const c = new THREE.PerspectiveCamera(fov, aspect, 0.1, 2000);
  c.position.set(...position);
  c.up.set(...up);
  c.lookAt(...target);
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true);
  return c;
};

/** project a world point to pixel coords; z>1 or behind => visible false */
export const projectPx = (cam: THREE.PerspectiveCamera, p: V3, w: number, h: number) => {
  const v = new THREE.Vector3(...p).project(cam);
  const behind = new THREE.Vector3(...p).applyMatrix4(cam.matrixWorldInverse).z > 0;
  return {x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: !behind && v.z < 1};
};

/** linear-space THREE.Color from hex (ColorManagement converts sRGB -> linear) */
export const col = (hex: string) => new THREE.Color(hex);
export const mixCol = (a: string | THREE.Color, b: string | THREE.Color, t: number) => {
  const ca = typeof a === 'string' ? new THREE.Color(a) : a.clone();
  const cb = typeof b === 'string' ? new THREE.Color(b) : b;
  return ca.lerp(cb, Math.min(1, Math.max(0, t)));
};
export const hexOf = (c: THREE.Color) => '#' + c.getHexString();

export const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** centripetal-ish uniform Catmull-Rom through keys, t in 0..1 over the whole path */
export const catmull = (keys: V3[], t: number): V3 => {
  const n = keys.length - 1;
  const s = Math.min(0.99999, Math.max(0, t)) * n;
  const i = Math.floor(s);
  const f = s - i;
  const p0 = keys[Math.max(0, i - 1)];
  const p1 = keys[i];
  const p2 = keys[Math.min(n, i + 1)];
  const p3 = keys[Math.min(n, i + 2)];
  const out: V3 = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const a = p0[k];
    const b = p1[k];
    const c = p2[k];
    const d = p3[k];
    out[k] = 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
  }
  return out;
};

/** gradient sky dome (zenith/horizon/ground + sun glow). Not affected by fog. */
export const SkyDome: React.FC<{zenith: string; horizon: string; ground?: string; sunDir?: V3; sunColor?: string; glow?: number; radius?: number; horizonSharp?: number}> = ({
  zenith,
  horizon,
  ground,
  sunDir = [0, 1, 0],
  sunColor = '#ffffff',
  glow = 0,
  radius = 900,
  horizonSharp = 4,
}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZen: {value: new THREE.Color()},
          uHor: {value: new THREE.Color()},
          uGnd: {value: new THREE.Color()},
          uSun: {value: new THREE.Vector3(0, 1, 0)},
          uSunCol: {value: new THREE.Color()},
          uGlow: {value: 0},
          uSharp: {value: 0.45},
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vDir = normalize(wp.xyz - cameraPosition);
            gl_Position = projectionMatrix * viewMatrix * wp;
            gl_Position.z = gl_Position.w; // at far plane
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uGnd; uniform vec3 uSun; uniform vec3 uSunCol;
          uniform float uGlow; uniform float uSharp;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float y = d.y;
            vec3 c = mix(uHor, uZen, 1.0 - exp(-max(y, 0.0) * uSharp));
            float s = max(dot(d, normalize(uSun)), 0.0);
            c += uSunCol * uGlow * (pow(s, 6.0) * 0.35 + pow(s, 60.0) * 0.8 + pow(s, 900.0) * 6.0);
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            // blend to the ground/fog colour the same way three applies fog (after colour-space conversion),
            // so fogged terrain meets the sky without a seam
            gl_FragColor.rgb = mix(linearToOutputTexel(vec4(uGnd, 1.0)).rgb, gl_FragColor.rgb, smoothstep(-0.005, 0.14, y));
          }`,
      }),
    [],
  );
  useLayoutEffect(() => {
    mat.uniforms.uZen.value.set(zenith);
    mat.uniforms.uHor.value.set(horizon);
    mat.uniforms.uGnd.value.set(ground ?? horizon);
    mat.uniforms.uSun.value.set(...sunDir);
    mat.uniforms.uSunCol.value.set(sunColor);
    mat.uniforms.uGlow.value = glow;
    mat.uniforms.uSharp.value = horizonSharp;
  }, [mat, zenith, horizon, ground, sunDir[0], sunDir[1], sunDir[2], sunColor, glow, horizonSharp]);
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[radius, 48, 24]} />
    </mesh>
  );
};

/** exponential fog attached to the scene, updated every frame */
export const SceneFog: React.FC<{color: string; density: number}> = ({color, density}) => {
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.FogExp2('#ffffff', 0), []);
  useLayoutEffect(() => {
    fog.color.set(color);
    fog.density = density;
    scene.fog = fog;
  }, [scene, fog, color, density]);
  return null;
};

/** scene background colour (when no sky dome / transparent canvas is not wanted) */
export const SceneBackground: React.FC<{color: string}> = ({color}) => {
  const scene = useThree((s) => s.scene);
  const c = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    c.set(color);
    scene.background = c;
  }, [scene, c, color]);
  return null;
};

/** greyscale value-noise DataTexture (mottled paper, cloud masks). Pure math, no canvas. */
export const noiseTexture = (size: number, fn: (x: number, y: number) => number, rgba?: (v: number) => [number, number, number, number]) => {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const v = Math.min(1, Math.max(0, fn(x / size, y / size)));
      const i = (y * size + x) * 4;
      const c = rgba ? rgba(v) : ([v, v, v, 1] as [number, number, number, number]);
      data[i] = c[0] * 255;
      data[i + 1] = c[1] * 255;
      data[i + 2] = c[2] * 255;
      data[i + 3] = c[3] * 255;
    }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
};

/** soft round sprite texture for THREE.Points */
export const discTexture = (size = 64, hard = 0.55) =>
  (() => {
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dx = (x + 0.5) / size - 0.5;
        const dy = (y + 0.5) / size - 0.5;
        const d = Math.sqrt(dx * dx + dy * dy) * 2;
        const a = d < hard ? 1 : Math.max(0, 1 - (d - hard) / (1 - hard));
        const i = (y * size + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = Math.round(a * a * 255);
      }
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  })();

/** GLSL 3D simplex noise (Ashima / Ian McEwan, MIT) for shader-side turbulence */
export const GLSL_NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/** typed text (time-boxed): returns visible char count with whitespace runs emitted instantly */
export const typedCount = (text: string, frame: number, start: number, dur: number) => {
  const t = Math.min(1, Math.max(0, (frame - start) / dur));
  if (t <= 0) return 0;
  // ease: near linear with a soft end
  const e = 1 - Math.pow(1 - t, 1.6);
  let n = Math.floor(text.length * e);
  while (n < text.length && /\s/.test(text[n])) n++;
  return n;
};

/** deterministic hash 0..1 */
export const h01 = (a: number, b = 0, c = 0) => {
  let x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453123;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------------------------------------
// fast seeded 2D simplex noise (unbounded per-seed cache; @remotion/noise only caches 10 seeds,
// which thrashes when a heightfield uses many octave seeds)
// ------------------------------------------------------------------------------------------------
const NOISE_CACHE = new Map<string, (x: number, y: number) => number>();
const GRAD2 = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1];
export const noise2 = (seed: string): ((x: number, y: number) => number) => {
  const hit = NOISE_CACHE.get(seed);
  if (hit) return hit;
  let a = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703);
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const fn = (xin: number, yin: number) => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      const g = (perm[ii + perm[jj]] & 7) * 2;
      t0 *= t0;
      n += t0 * t0 * (GRAD2[g] * x0 + GRAD2[g + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      const g = (perm[ii + i1 + perm[jj + j1]] & 7) * 2;
      t1 *= t1;
      n += t1 * t1 * (GRAD2[g] * x1 + GRAD2[g + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      const g = (perm[ii + 1 + perm[jj + 1]] & 7) * 2;
      t2 *= t2;
      n += t2 * t2 * (GRAD2[g] * x2 + GRAD2[g + 1] * y2);
    }
    return 70 * n;
  };
  NOISE_CACHE.set(seed, fn);
  return fn;
};
export const nz2 = (seed: string, x: number, y: number) => noise2(seed)(x, y);
export const fbm2 = (seed: string, x: number, y: number, octaves = 4) => {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    v += amp * noise2(seed + o)(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return v / (1 - Math.pow(0.5, octaves));
};
