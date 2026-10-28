/**
 * Shared helpers for build batch LA3-2 (round 2): hex-island-grow, faceted-sea, light-beam-ribbon (low-poly island world),
 * fuse-beat-timer, lives-counter (hard-shadow flat toon HUD), plus small bits for crayon / screen camera.
 * Ideas and formulas adapted from lemo-opuscar styles/lowpoly-island + styles/microgame (MIT, © LemoLab) —
 * see THIRD_PARTY_NOTICES.md. Everything is a pure function of the frame and seeds (no timers, no Math.random).
 */
import React from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useVideoConfig} from 'remotion';
import {TAU, cl, eo3, h1, lerp, mixC, popCurve, riseWobble, sstep} from './r2-la3-kit';

export {TAU, cl, lerp, h1, popCurve, riseWobble, eo3, sstep, mixC};

// ================================================================================================ toon (microgame home stage)
export const TOON = {
  ground: '#2A0F5C',
  night: '#170838',
  ink: '#1A1030',
  magenta: '#FF2E88',
  violet: '#6B2BD9',
  gold: '#FFC928',
  cyan: '#1FD1D1',
  orange: '#FF7A1A',
  cream: '#F6F1E4',
  green: '#3BDC5A',
  red: '#FF3B3B',
  rope: '#D9A85A',
};

/** rotating sunburst on the violet home-stage ground */
export const ToonStage: React.FC<{w: number; h: number; frame: number; ground?: string; ray?: string; id: string; rays?: number; speed?: number}> = ({
  w,
  h,
  frame,
  ground = TOON.ground,
  ray = '#3A1A78',
  id,
  rays = 18,
  speed = 0.22,
}) => {
  const R = Math.hypot(w, h);
  const cx = w / 2;
  const cy = h * 0.46;
  const rot = frame * speed;
  const wedges = Array.from({length: rays}, (_, i) => {
    const a0 = (i / rays) * TAU;
    const a1 = a0 + (TAU / rays) * 0.5;
    return `M${cx} ${cy}L${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R}L${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R}Z`;
  });
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-vg`} cx="50%" cy="46%" r="75%">
          <stop offset="0.35" stopColor={ground} stopOpacity="0" />
          <stop offset="1" stopColor={TOON.night} stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={ground} />
      <g transform={`rotate(${rot} ${cx} ${cy})`}>
        <path d={wedges.join('')} fill={ray} />
      </g>
      <rect width={w} height={h} fill={`url(#${id}-vg)`} />
    </g>
  );
};

/** hard-shadow toon part: shade fill -> clip -> refill shifted up-left in the light colour -> outline */
export const ToonPart: React.FC<{d: string; fill: string; shade?: string; sh?: number; ink?: string; sw?: number; id: string; drop?: number; transform?: string; opacity?: number}> = ({
  d,
  fill,
  shade,
  sh = 5,
  ink = TOON.ink,
  sw = 6,
  id,
  drop = 0,
  transform,
  opacity = 1,
}) => {
  const sd = shade ?? mixC(fill, '#1A0B40', 0.38);
  return (
    <g transform={transform} opacity={opacity}>
      {drop > 0 && <path d={d} transform={`translate(${drop} ${drop})`} fill={ink} stroke={ink} strokeWidth={sw} strokeLinejoin="round" opacity={0.45} />}
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={sd} />
      <g clipPath={`url(#${id})`}>
        <path d={d} fill={fill} transform={`translate(${-sh} ${-sh})`} />
      </g>
      <path d={d} fill="none" stroke={ink} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

/** outlined display text: thick ink stroke under the fill + offset drop copy */
export const ToonText: React.FC<{
  x: number;
  y: number;
  size: number;
  text: string;
  font: string;
  fill?: string;
  ink?: string;
  drop?: string;
  dropOff?: number;
  sw?: number;
  anchor?: 'start' | 'middle' | 'end';
  rotate?: number;
  scale?: number;
  opacity?: number;
  spacing?: number;
}> = ({x, y, size, text, font, fill = '#fff', ink = TOON.ink, drop, dropOff = 8, sw = 10, anchor = 'middle', rotate = 0, scale = 1, opacity = 1, spacing = 0}) => {
  const common = {fontFamily: font, fontSize: size, textAnchor: anchor, letterSpacing: spacing, strokeLinejoin: 'round' as const};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      {drop && (
        <text x={dropOff} y={dropOff} {...common} fill={drop} stroke={drop} strokeWidth={sw}>
          {text}
        </text>
      )}
      <text {...common} fill="none" stroke={ink} strokeWidth={sw}>
        {text}
      </text>
      <text {...common} fill={fill}>
        {text}
      </text>
    </g>
  );
};

/** 4-point toon star (sparks) */
export const toonStar = (r: number, pinch = 0.22) => {
  const p: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * pinch * 2.2;
    p.push(`${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return 'M' + p.join('L') + 'Z';
};

// ================================================================================================ low-poly: time of day
export type TodName = 'dawn' | 'day' | 'dusk' | 'night';
export type Tod = {
  zenith: string;
  horizon: string;
  deep: string;
  shallow: string;
  sun: string;
  sunI: number;
  amb: string;
  ambI: number;
  elev: number; // sun elevation, degrees
  az: number; // sun azimuth, degrees
  glow: number; // window / lamp glow 0..1
  stars: number; // star visibility 0..1
};
export const TOD: Record<TodName, Tod> = {
  dawn: {zenith: '#9FB6CF', horizon: '#F3D2C4', deep: '#4F8EA3', shallow: '#8FC9C4', sun: '#FFD9B8', sunI: 1.1, amb: '#FFEEDD', ambI: 1, elev: 14, az: 120, glow: 0.35, stars: 0.12},
  day: {zenith: '#88C8E8', horizon: '#EAF5F2', deep: '#38A5BC', shallow: '#86E2D4', sun: '#FFF6E0', sunI: 1.25, amb: '#FBF8FF', ambI: 1, elev: 52, az: 70, glow: 0, stars: 0},
  dusk: {zenith: '#6F6FA8', horizon: '#FFA888', deep: '#5A6A9E', shallow: '#B08AA6', sun: '#FF9A68', sunI: 1.05, amb: '#FFD7C8', ambI: 0.92, elev: 9, az: 245, glow: 0.8, stars: 0.3},
  night: {zenith: '#12163A', horizon: '#4A4478', deep: '#23264A', shallow: '#363A66', sun: '#A9B0E8', sunI: 0.7, amb: '#7C80C8', ambI: 0.78, elev: 38, az: 300, glow: 1, stars: 1},
};
export const todNames = Object.keys(TOD) as TodName[];
export const getTod = (n: string): Tod => TOD[(todNames as string[]).includes(n) ? (n as TodName) : 'day'];
export const todMix = (a: string, b: string, k: number): Tod => {
  const A = getTod(a);
  const B = getTod(b);
  const m = (x: string, y: string) => mixC(x, y, k);
  const n = (x: number, y: number) => lerp(x, y, k);
  return {
    zenith: m(A.zenith, B.zenith),
    horizon: m(A.horizon, B.horizon),
    deep: m(A.deep, B.deep),
    shallow: m(A.shallow, B.shallow),
    sun: m(A.sun, B.sun),
    sunI: n(A.sunI, B.sunI),
    amb: m(A.amb, B.amb),
    ambI: n(A.ambI, B.ambI),
    elev: n(A.elev, B.elev),
    az: n(A.az, B.az),
    glow: n(A.glow, B.glow),
    stars: n(A.stars, B.stars),
  };
};

// ================================================================================================ low-poly: curves + hex grid
/** water height (same function on the CPU for floating things) */
export const waterH = (x: number, z: number, t: number) =>
  0.075 * Math.sin(0.9 * x + 1.25 * t) + 0.06 * Math.sin(0.77 * z - 1.05 * t + 1.3) + 0.045 * Math.sin(1.6 * (x + z) + 2 * t) + 0.03 * Math.sin(2.3 * x - 1.9 * z + 2.6 * t);

/** tile rise: cubic ease over .5 s (k 0..1) and a damped overshoot (world units) afterwards */
export const lpRise = (s: number): {k: number; over: number} => {
  if (s <= 0) return {k: 0, over: 0};
  if (s < 0.5) return {k: eo3(s / 0.5), over: 0};
  const q = s - 0.5;
  return {k: 1, over: 0.18 * Math.sin(13 * q) * Math.exp(-7 * q)};
};
/** drop-and-stack: fast ease-in fall (fall = fraction of the drop height left), then bounce (world units) and volume-preserving squash */
export const lpDrop = (s: number, fall = 0.22): {vis: boolean; fall: number; bounce: number; sy: number} => {
  if (s <= 0) return {vis: false, fall: 1, bounce: 0, sy: 1};
  if (s < fall) return {vis: true, fall: 1 - (s / fall) * (s / fall), bounce: 0, sy: 1};
  const q = s - fall;
  return {vis: true, fall: 0, bounce: Math.abs(Math.sin(15 * q)) * Math.exp(-9 * q) * 0.22, sy: 1 - 0.16 * Math.exp(-12 * q) * Math.cos(26 * q)};
};

export const hexXZ = (q: number, r: number): [number, number] => [Math.sqrt(3) * (q + r / 2), 1.5 * r];
export const hexDisc = (R: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let r = -R; r <= R; r++)
    for (let q = -R; q <= R; q++) if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R) out.push([q, r]);
  return out;
};
export const hexDist = (q: number, r: number) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));

// ================================================================================================ low-poly: stage + camera
export const lpFrustum = (zoom: number, aspect: number) => zoom * Math.max(1, (16 / 9 / aspect) * 0.9);

/** orthographic, transparent, soft-shadowed canvas (sky is painted behind it) */
export const LpStage: React.FC<{children: React.ReactNode; shadows?: boolean}> = ({children, shadows = true}) => {
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} dpr={1} orthographic shadows={shadows ? 'soft' : false} flat gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} style={{position: 'absolute', inset: 0}}>
      {children}
    </ThreeCanvas>
  );
};

export const lpView = (az: number, el: number) => {
  const a = (az * Math.PI) / 180;
  const e = (el * Math.PI) / 180;
  return {
    pos: [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)] as [number, number, number],
    up: [-Math.sin(e) * Math.cos(a), Math.cos(e), -Math.sin(e) * Math.sin(a)] as [number, number, number],
    right: [-Math.sin(a), 0, Math.cos(a)] as [number, number, number],
  };
};

export const LpRig: React.FC<{target: [number, number, number]; az: number; el: number; fh: number; dist?: number}> = ({target, az, el, fh, dist = 70}) => {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  const key = [...target, az, el, fh, dist, size.width, size.height].join(',');
  React.useLayoutEffect(() => {
    const v = lpView(az, el);
    camera.position.set(target[0] + v.pos[0] * dist, target[1] + v.pos[1] * dist, target[2] + v.pos[2] * dist);
    camera.up.set(0, 1, 0);
    camera.lookAt(target[0], target[1], target[2]);
    const asp = size.width / size.height;
    camera.zoom = 1;
    camera.left = (-fh * asp) / 2;
    camera.right = (fh * asp) / 2;
    camera.top = fh / 2;
    camera.bottom = -fh / 2;
    camera.near = 0.1;
    camera.far = dist * 3;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, camera]);
  return null;
};

export const LpLights: React.FC<{tod: Tod; extent?: number; shadows?: boolean}> = ({tod, extent = 9, shadows = true}) => {
  const e = (tod.elev * Math.PI) / 180;
  const a = (tod.az * Math.PI) / 180;
  const d = 26;
  const pos: [number, number, number] = [Math.cos(e) * Math.cos(a) * d, Math.max(4, Math.sin(e) * d), Math.cos(e) * Math.sin(a) * d];
  return (
    <>
      <ambientLight color={tod.amb} intensity={1.15 * tod.ambI} />
      <hemisphereLight args={[tod.zenith, tod.deep, 0.35]} />
      <directionalLight
        position={pos}
        color={tod.sun}
        intensity={1.15 * tod.sunI}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={0.5}
        shadow-camera-far={70}
        shadow-bias={-0.0008}
        shadow-radius={4}
      />
    </>
  );
};

/** screen-space sky gradient + twinkling stars, painted behind the transparent canvas */
export const LpSky: React.FC<{tod: Tod; frame: number; w: number; h: number; u: number; seed?: number; band?: number}> = ({tod, frame, w, h, u, seed = 3, band = 0.34}) => {
  const stars = Array.from({length: 90}, (_, i) => ({x: h1(i, seed, 1) * w, y: Math.pow(h1(i, seed, 2), 1.5) * h * 0.5, r: (0.7 + h1(i, seed, 3) * 1.5) * u, ph: h1(i, seed, 4) * TAU}));
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tod.zenith} 0%, ${tod.horizon} ${band * 100}%, ${tod.horizon} 100%)`}} />
      {tod.stars > 0.01 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          {stars.map((s, i) => {
            const f = Math.max(0, 1 - s.y / (h * 0.42));
            const tw = 0.55 + 0.45 * Math.sin(frame * 0.12 + s.ph);
            return <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#E9ECFF" opacity={tod.stars * f * tw} />;
          })}
        </svg>
      )}
    </>
  );
};

// ================================================================================================ low-poly: faceted sea
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const rgbOf = (hex: string): [number, number, number] => {
  const s = hex.replace('#', '');
  return [parseInt(s.slice(0, 2), 16) / 255, parseInt(s.slice(2, 4), 16) / 255, parseInt(s.slice(4, 6), 16) / 255];
};

export type SeaBeam = {x: number; z: number; ang: number; bw: number; len: number; int: number; col: string};
export type SeaOpts = {
  t: number;
  size: number;
  seg: number;
  tod: Tod;
  az: number;
  el: number;
  fh: number;
  target: [number, number, number];
  land: number[]; // flattened x,z of land hex centres
  amp: number;
  sparkle: number;
  glint: number;
  foam: number;
  beam?: SeaBeam | null;
  haze: [number, number];
  band: number;
  seed: number;
};

export const makeSeaGeo = (seg: number) => {
  const g = new THREE.BufferGeometry();
  const n = seg * seg * 6;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  return g;
};

/** fills the non-indexed sea geometry: 4-sine waves, per-facet lighting/glints, shallow rim, foam, beam-lit band, haze to sky */
export const fillSea = (geo: THREE.BufferGeometry, o: SeaOpts) => {
  const {seg, size, t, tod} = o;
  const pos = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
  const col = (geo.attributes.color as THREE.BufferAttribute).array as Float32Array;
  const cx = o.target[0];
  const cz = o.target[2];
  const grid = new Float32Array((seg + 1) * (seg + 1));
  for (let j = 0; j <= seg; j++)
    for (let i = 0; i <= seg; i++) grid[j * (seg + 1) + i] = waterH(cx + (i / seg - 0.5) * size, cz + (j / seg - 0.5) * size, t) * o.amp;

  const deep = rgbOf(tod.deep);
  const shal = rgbOf(tod.shallow);
  const zen = rgbOf(tod.zenith);
  const hor = rgbOf(tod.horizon);
  const sunC = rgbOf(tod.sun);
  const ambC = rgbOf(tod.amb);
  const e = (tod.elev * Math.PI) / 180;
  const a = (tod.az * Math.PI) / 180;
  const L: [number, number, number] = [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
  const V = lpView(o.az, o.el);
  const Hh: [number, number, number] = [L[0] + V.pos[0], L[1] + V.pos[1], L[2] + V.pos[2]];
  const hl = Math.hypot(Hh[0], Hh[1], Hh[2]);
  Hh[0] /= hl;
  Hh[1] /= hl;
  Hh[2] /= hl;
  const beamC = o.beam ? rgbOf(o.beam.col) : [0, 0, 0];
  const land = o.land;
  const hw = o.fh / 2;
  const beamAt = (x: number, z: number, id: number) => {
    const b = o.beam!;
    const dx = x - b.x;
    const dz = z - b.z;
    const dist = Math.hypot(dx, dz);
    let da = Math.atan2(dz, dx) - b.ang;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    const across = (da * dist) / (b.bw + dist * 0.05);
    const along = Math.pow(Math.max(0, 1 - dist / b.len), 0.8) * sstep(0.6, 2.4, dist);
    const band = Math.exp(-across * across) * along;
    if (band < 0.004) return 0;
    const sp = h1(id, Math.floor(t * 8 + h1(id, 3) * 8), o.seed);
    return band * (0.5 + o.sparkle * sp * 1.1) * b.int;
  };

  let vi = 0;
  const tri = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx2: number, cy: number, cz2: number, id: number) => {
    // normal
    const e1x = bx - ax;
    const e1y = by - ay;
    const e1z = bz - az;
    const e2x = cx2 - ax;
    const e2y = cy - ay;
    const e2z = cz2 - az;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    const mx = (ax + bx + cx2) / 3;
    const my = (ay + by + cy) / 3;
    const mz = (az + bz + cz2) / 3;
    // screen y (up +), -1..1 over the frustum height
    const sy = ((mx - o.target[0]) * V.up[0] + (my - o.target[1]) * V.up[1] + (mz - o.target[2]) * V.up[2]) / hw;
    // land distance
    let ld = 99;
    for (let k = 0; k < land.length; k += 2) {
      const d = Math.hypot(mx - land[k], mz - land[k + 1]);
      if (d < ld) ld = d;
    }
    const edge = ld - 0.95;
    const shal01 = land.length ? 1 - sstep(0, 2.1, edge) : 0;
    const jit = (h1(id, o.seed, 5) - 0.5) * 0.07;
    const crest = cl((my / Math.max(0.05, o.amp)) * 0.5 + 0.5);
    const k0 = cl(shal01 * 0.92 + (crest - 0.5) * 0.12 + jit);
    let r = lerp(deep[0], shal[0], k0);
    let g = lerp(deep[1], shal[1], k0);
    let b = lerp(deep[2], shal[2], k0);
    const ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    const lr = ambC[0] * 0.8 * tod.ambI + sunC[0] * ndl * 0.2 * tod.sunI;
    const lg = ambC[1] * 0.8 * tod.ambI + sunC[1] * ndl * 0.2 * tod.sunI;
    const lb = ambC[2] * 0.8 * tod.ambI + sunC[2] * ndl * 0.2 * tod.sunI;
    r *= lr;
    g *= lg;
    b *= lb;
    const spec = Math.pow(Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 90) * o.glint * tod.sunI * (0.12 + 0.88 * sstep(10, 50, tod.elev));
    r += sunC[0] * spec;
    g += sunC[1] * spec;
    b += sunC[2] * spec;
    if (land.length && o.foam > 0) {
      const band = sstep(-0.05, 0.05, edge) * (1 - sstep(0.12, 0.5 + 0.12 * Math.sin(t * 1.7 + mx * 1.3 + mz), edge));
      const f = band * o.foam * (0.65 + 0.35 * Math.sin(t * 2.2 + edge * 7));
      r = lerp(r, 1, f * 0.85);
      g = lerp(g, 1, f * 0.85);
      b = lerp(b, 1, f * 0.9);
    }
    if (o.beam) {
      const bl = beamAt(mx, mz, id);
      r += beamC[0] * bl;
      g += beamC[1] * bl;
      b += beamC[2] * bl;
    }
    // haze into the screen-space sky gradient
    const hz = sstep(o.haze[0], o.haze[1], sy);
    if (hz > 0) {
      const f = cl((1 - sy) / 2);
      const kk = cl(f / o.band);
      r = lerp(r, lerp(zen[0], hor[0], kk), hz);
      g = lerp(g, lerp(zen[1], hor[1], kk), hz);
      b = lerp(b, lerp(zen[2], hor[2], kk), hz);
    }
    const R = toLin(cl(r));
    const G = toLin(cl(g));
    const B = toLin(cl(b));
    for (let q = 0; q < 3; q++) {
      col[vi * 3] = R;
      col[vi * 3 + 1] = G;
      col[vi * 3 + 2] = B;
      vi++;
    }
  };

  let p = 0;
  const put = (x: number, y: number, z: number) => {
    pos[p++] = x;
    pos[p++] = y;
    pos[p++] = z;
  };
  const cell = size / seg;
  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const x0 = cx + (i / seg - 0.5) * size;
      const z0 = cz + (j / seg - 0.5) * size;
      const x1 = x0 + cell;
      const z1 = z0 + cell;
      const y00 = grid[j * (seg + 1) + i];
      const y10 = grid[j * (seg + 1) + i + 1];
      const y01 = grid[(j + 1) * (seg + 1) + i];
      const y11 = grid[(j + 1) * (seg + 1) + i + 1];
      const id = j * seg + i;
      put(x0, y00, z0);
      put(x0, y01, z1);
      put(x1, y10, z0);
      tri(x0, y00, z0, x0, y01, z1, x1, y10, z0, id * 2);
      put(x1, y10, z0);
      put(x0, y01, z1);
      put(x1, y11, z1);
      tri(x1, y10, z0, x0, y01, z1, x1, y11, z1, id * 2 + 1);
    }
  }
  (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
};

export const FacetSea: React.FC<{opts: SeaOpts}> = ({opts}) => {
  const geo = React.useMemo(() => makeSeaGeo(opts.seg), [opts.seg]);
  const key = JSON.stringify([opts.t, opts.size, opts.tod, opts.az, opts.el, opts.fh, opts.target, opts.land.length, opts.amp, opts.sparkle, opts.glint, opts.foam, opts.beam, opts.haze, opts.seed]);
  React.useLayoutEffect(() => {
    fillSea(geo, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, key]);
  return (
    <mesh geometry={geo} frustumCulled={false}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
};

// ================================================================================================ low-poly: hex tile + beam ribbon
let _hexGeo: THREE.CylinderGeometry | null = null;
const hexGeo = () => {
  if (!_hexGeo) {
    _hexGeo = new THREE.CylinderGeometry(0.985, 0.985, 1, 6, 1);
    _hexGeo.translate(0, 0.5, 0);
  }
  return _hexGeo;
};

/** flat-shaded hex column: bottom sits at `bottom` (below the water), top at `top` */
export const HexTile: React.FC<{x: number; z: number; top: number; bottom?: number; topColor: string; sideColor: string; scale?: number}> = ({x, z, top, bottom = -1.4, topColor, sideColor, scale = 1}) => (
  <mesh geometry={hexGeo()} position={[x, bottom, z]} scale={[scale, Math.max(0.001, top - bottom), scale]} castShadow receiveShadow>
    <meshStandardMaterial attach="material-0" color={sideColor} roughness={0.9} flatShading />
    <meshStandardMaterial attach="material-1" color={topColor} roughness={0.9} flatShading />
    <meshStandardMaterial attach="material-2" color={sideColor} roughness={0.9} flatShading />
  </mesh>
);

const BEAM_VERT = /* glsl */ `
attribute float aS; attribute float aV;
varying float vS; varying float vV;
void main(){ vS=aS; vV=aV; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const BEAM_FRAG = /* glsl */ `
varying float vS; varying float vV;
uniform vec3 uColor; uniform float uAlpha; uniform float uSoft;
void main(){
  float s = clamp(vS, 0.0, 1.0);
  float core = pow(1.0 - s, 1.7) * 0.42 + exp(-10.0 * s) * 0.75;
  float a = exp(-vV * vV * uSoft) * core * uAlpha;
  gl_FragColor = vec4(uColor, a);
}`;

/** camera-facing additive ribbon (volumetric beam): Gaussian across-profile, root-bright core */
export const BeamRibbon: React.FC<{from: [number, number, number]; dir: [number, number, number]; len: number; w0: number; w1: number; view: [number, number, number]; color: string; alpha: number; soft: number}> = ({
  from,
  dir,
  len,
  w0,
  w1,
  view,
  color,
  alpha,
  soft,
}) => {
  const SEGS = 28;
  const geo = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEGS + 1) * 2 * 3), 3));
    g.setAttribute('aS', new THREE.BufferAttribute(new Float32Array((SEGS + 1) * 2), 1));
    g.setAttribute('aV', new THREE.BufferAttribute(new Float32Array((SEGS + 1) * 2), 1));
    const idx: number[] = [];
    for (let i = 0; i < SEGS; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    g.setIndex(idx);
    return g;
  }, []);
  const mat = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BEAM_VERT,
        fragmentShader: BEAM_FRAG,
        uniforms: {uColor: {value: new THREE.Color(1, 1, 1)}, uAlpha: {value: 1}, uSoft: {value: 6}},
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  const key = [...from, ...dir, len, w0, w1, ...view, color, alpha, soft].join(',');
  React.useLayoutEffect(() => {
    const d = new THREE.Vector3(...dir).normalize();
    const side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(...view)).normalize();
    const P = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const S = (geo.attributes.aS as THREE.BufferAttribute).array as Float32Array;
    const V = (geo.attributes.aV as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i <= SEGS; i++) {
      const s = i / SEGS;
      const hw = lerp(w0, w1, s);
      const cx = from[0] + d.x * len * s;
      const cy = from[1] + d.y * len * s;
      const cz = from[2] + d.z * len * s;
      for (let k = 0; k < 2; k++) {
        const sg = k === 0 ? -1 : 1;
        const o = (i * 2 + k) * 3;
        P[o] = cx + side.x * hw * sg;
        P[o + 1] = cy + side.y * hw * sg;
        P[o + 2] = cz + side.z * hw * sg;
        S[i * 2 + k] = s;
        V[i * 2 + k] = sg;
      }
    }
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.aS as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.aV as THREE.BufferAttribute).needsUpdate = true;
    const rgb = rgbOf(color);
    mat.uniforms.uColor.value.setRGB(rgb[0], rgb[1], rgb[2]);
    mat.uniforms.uAlpha.value = alpha;
    mat.uniforms.uSoft.value = soft;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, geo, mat]);
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />;
};

/** prism (gable roof) centred on the origin: width x (along x), height y, depth z */
export const prismGeo = (w: number, h: number, d: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: false});
  g.translate(0, 0, -d / 2);
  return g;
};

// ================================================================================================ low-poly: props
const mat = (c: string, extra: Record<string, unknown> = {}) => <meshStandardMaterial color={c} roughness={0.9} flatShading {...extra} />;

export const Pine: React.FC<{x: number; y: number; z: number; s?: number; pop?: number; c1?: string; c2?: string}> = ({x, y, z, s = 1, pop = 1, c1 = '#3F8A5A', c2 = '#4F9C63'}) => (
  <group position={[x, y, z]} scale={Math.max(0.001, s * pop)}>
    <mesh position={[0, 0.1, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.07, 0.2, 5]} />
      {mat('#8C6A4A')}
    </mesh>
    <mesh position={[0, 0.42, 0]} castShadow>
      <coneGeometry args={[0.3, 0.5, 6]} />
      {mat(c1)}
    </mesh>
    <mesh position={[0, 0.72, 0]} castShadow>
      <coneGeometry args={[0.22, 0.42, 6]} />
      {mat(c2)}
    </mesh>
  </group>
);

export const RoundTree: React.FC<{x: number; y: number; z: number; s?: number; pop?: number; c1?: string}> = ({x, y, z, s = 1, pop = 1, c1 = '#7FC36A'}) => (
  <group position={[x, y, z]} scale={Math.max(0.001, s * pop)}>
    <mesh position={[0, 0.14, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.065, 0.28, 5]} />
      {mat('#8C6A4A')}
    </mesh>
    <mesh position={[0, 0.5, 0]} castShadow>
      <icosahedronGeometry args={[0.3, 0]} />
      {mat(c1)}
    </mesh>
  </group>
);

/** a boat that bobs on the CPU copy of the water function */
export const Boat: React.FC<{x: number; z: number; t: number; amp?: number; heading: number; hull?: string; sail?: string; s?: number}> = ({x, z, t, amp = 1, heading, hull = '#D9644A', sail = '#FBF3E6', s = 1}) => {
  const y = waterH(x, z, t) * amp;
  const dx = (waterH(x + 0.3, z, t) - waterH(x - 0.3, z, t)) * amp;
  const dz = (waterH(x, z + 0.3, t) - waterH(x, z - 0.3, t)) * amp;
  const prism = React.useMemo(() => prismGeo(0.5, 0.78, 0.035), []);
  return (
    <group position={[x, y + 0.04, z]} rotation={[dz * 0.9, -heading, -dx * 0.9]} scale={s}>
      <mesh castShadow>
        <boxGeometry args={[0.82, 0.16, 0.3]} />
        {mat(hull)}
      </mesh>
      <mesh position={[0.46, 0.0, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.3]} />
        {mat(hull)}
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.84, 0.03, 0.32]} />
        {mat('#FBF3E6')}
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 4]} />
        {mat('#6B5A48')}
      </mesh>
      <mesh geometry={prism} position={[0.02, 0.2, 0]} rotation={[0, 0, 0]} castShadow>
        {mat(sail, {side: THREE.DoubleSide})}
      </mesh>
    </group>
  );
};
