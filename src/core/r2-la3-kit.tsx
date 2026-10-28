/**
 * Shared helpers for build group LA3 (round 2). Several looks share engines here:
 *  - common: fonts, hashing, colour maths, curves
 *  - holo:   tiny perspective projector + wireframe model (hologram-hud: target-lock-box, spec-chip-rail, holo-solid-ignite)
 *  - iso:    true-isometric flat engine (iso-infographic: iso-diorama-board, iso-cutaway, focus-desaturate, tilt-shift-diorama)
 *  - kino:   ink/paper print grade + slam/shake (kino-montage: diagonal-band-title, document-marker-highlight, photomontage-tower)
 *  - pixel:  HD-2D pixel sprites, Bayer dither, selout outline (lit-pixel-sprite, practical-light-shadow-jump)
 *  - knife:  palette-knife stroke plates (impasto: knife-paint-plate, knife-colour-relay, overhead-trail-mandala)
 *  - ink:    sumi brush engine + rice paper (ink-wash: ink-brush-stroke, handscroll-reveal)
 *  - relief: raking-lit survey surface (lidar-survey: hairline-feature-trace, section-profile-chart)
 *  - screen: UI window + pixel mascot actor (living-screencast)
 *  - toon:   hard-shadow flat toon parts (microgame: fuse-beat-timer, lives-counter, crayon-pressure-pass)
 * Ideas and formulas adapted from lemo-opuscar styles/* (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md.
 * Everything is a pure function of the frame and seeds.
 */
import React from 'react';
import {loadFont as loadRajdhani} from '@remotion/google-fonts/Rajdhani';
import {loadFont as loadShareTech} from '@remotion/google-fonts/ShareTechMono';
import {loadFont as loadOswald} from '@remotion/google-fonts/Oswald';
import {loadFont as loadSpaceMono} from '@remotion/google-fonts/SpaceMono';
import {loadFont as loadJost} from '@remotion/google-fonts/Jost';
import {loadFont as loadBarlowC} from '@remotion/google-fonts/BarlowCondensed';
import {loadFont as loadPlex} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as loadTitan} from '@remotion/google-fonts/TitanOne';
import {loadFont as loadLilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as loadCinzel} from '@remotion/google-fonts/Cinzel';
import {loadFont as loadJosefin} from '@remotion/google-fonts/JosefinSans';
import {loadFont as loadNewsreader} from '@remotion/google-fonts/Newsreader';
import {loadFont as loadCormorantSC} from '@remotion/google-fonts/CormorantSC';
import {loadFont as loadCormorant} from '@remotion/google-fonts/CormorantGaramond';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadJBM} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';

// ================================================================================================ fonts
loadCormorant('italic', {weights: ['500', '600'], subsets: ['latin']});
export const lf = {
  rajdhani: loadRajdhani('normal', {weights: ['300', '500', '600', '700'], subsets: ['latin']}).fontFamily,
  techMono: loadShareTech('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  oswald: loadOswald('normal', {weights: ['500', '600', '700'], subsets: ['latin']}).fontFamily,
  spaceMono: loadSpaceMono('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily,
  jost: loadJost('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']}).fontFamily,
  barlowC: loadBarlowC('normal', {weights: ['300', '400', '500', '600'], subsets: ['latin']}).fontFamily,
  plex: loadPlex('normal', {weights: ['400', '500'], subsets: ['latin']}).fontFamily,
  titan: loadTitan('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  lilita: loadLilita('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  cinzel: loadCinzel('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily,
  josefin: loadJosefin('normal', {weights: ['300', '600'], subsets: ['latin']}).fontFamily,
  newsreader: loadNewsreader('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  cormorantSC: loadCormorantSC('normal', {weights: ['500', '600'], subsets: ['latin']}).fontFamily,
  cormorant: loadCormorant('normal', {weights: ['500', '600'], subsets: ['latin']}).fontFamily,
  inter: loadInter('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']}).fontFamily,
  jbm: loadJBM('normal', {weights: ['400', '600'], subsets: ['latin']}).fontFamily,
  caveat: loadCaveat('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily,
};

// ================================================================================================ maths
export const TAU = Math.PI * 2;
export const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (v: number, a: number, b: number) => cl((v - a) / (b - a));
export const sstep = (a: number, b: number, v: number) => {
  const t = cl((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const eo3 = (t: number) => 1 - Math.pow(1 - cl(t), 3);
export const ei3 = (t: number) => Math.pow(cl(t), 3);
export const eio3 = (t: number) => {
  const x = cl(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** back ease-out with overshoot s (2.2 = iso-infographic isotype pop) */
export const backOut = (t: number, s = 1.70158) => {
  const x = cl(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** lowpoly-island "pop": 1 − e^(−9s)·cos(17s) (s in seconds) */
export const popCurve = (s: number) => (s <= 0 ? 0 : 1 - Math.exp(-9 * s) * Math.cos(17 * s));
/** lowpoly-island rise-from-water overshoot sin(13s)·e^(−7s) */
export const riseWobble = (s: number) => (s <= 0 ? 0 : Math.sin(13 * s) * Math.exp(-7 * s));
/** deterministic hash -> 0..1 */
export const h1 = (a: number, b = 0, c = 0) => {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453123;
  return s - Math.floor(s);
};
/** mulberry32 */
export const mul32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** 1-D value noise, smooth, 0..1 */
export const vnoise = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = h1(i, seed);
  const b = h1(i + 1, seed);
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
};
/** 2-D value noise 0..1 */
export const vnoise2 = (x: number, y: number, seed = 0) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = h1(ix, iy, seed);
  const b = h1(ix + 1, iy, seed);
  const c = h1(ix, iy + 1, seed);
  const d = h1(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
};
export const fbm2 = (x: number, y: number, seed = 0, oct = 4) => {
  let v = 0;
  let a = 0.5;
  let f = 1;
  let n = 0;
  for (let o = 0; o < oct; o++) {
    v += a * vnoise2(x * f, y * f, seed + o * 13);
    n += a;
    a *= 0.5;
    f *= 2;
  }
  return v / n;
};

// ================================================================================================ colour
export type RGB3 = [number, number, number];
export const hex3 = (s: string): RGB3 => {
  let h = s.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgbHex = (c: RGB3) => '#' + c.map((v) => Math.round(cl(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mixC = (a: string, b: string, t: number) => {
  const A = hex3(a);
  const B = hex3(b);
  return rgbHex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]);
};
export const rgbaC = (hex: string, a: number) => {
  const c = hex3(hex);
  return `rgba(${c[0]},${c[1]},${c[2]},${cl(a).toFixed(3)})`;
};
export const lumaOf = (hex: string) => {
  const c = hex3(hex);
  return (0.3 * c[0] + 0.55 * c[1] + 0.15 * c[2]) / 255;
};
/** multiply two hex colours (light tint) with gain */
export const mulC = (a: string, b: string, gain = 1) => {
  const A = hex3(a);
  const B = hex3(b);
  return rgbHex([(A[0] * B[0] * gain) / 255, (A[1] * B[1] * gain) / 255, (A[2] * B[2] * gain) / 255]);
};
/** hsl -> hex */
export const hsl = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbHex([f(0) * 255, f(8) * 255, f(4) * 255]);
};

export const pathOf = (pts: [number, number][], close = false) =>
  pts.length ? 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + (close ? 'Z' : '') : '';

/** text width estimate (em multiples) for a few families used here */
export const textW = (text: string, size: number, perEm = 0.56, tracking = 0) => [...text].reduce((s, c) => s + (c === ' ' ? 0.3 : /[.,:;'!|il1·]/.test(c) ? 0.3 : /[MW@%]/.test(c) ? 0.85 : perEm), 0) * size + tracking * text.length;
export const fitText = (text: string, size: number, maxW: number, perEm = 0.56, trackingEm = 0) => {
  const w = textW(text, size, perEm, trackingEm * size);
  return w > maxW ? (size * maxW) / w : size;
};

// ================================================================================================ HOLO
// Projector + wireframe model in the spirit of lemo-opuscar styles/hologram-hud/demo/engine/holo.js (MIT).
export type V3 = [number, number, number];
export type HoloCam = {yaw: number; pitch: number; dist: number; f: number; cx: number; cy: number};
export const holoProject = (cam: HoloCam, p: V3): [number, number, number] => {
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const x1 = p[0] * cy - p[2] * sy;
  const z1 = p[0] * sy + p[2] * cy;
  const y2 = p[1] * cp - z1 * sp;
  const z2 = p[1] * sp + z1 * cp;
  const d = cam.dist - z2;
  return [cam.cx + (cam.f * x1) / d, cam.cy - (cam.f * y2) / d, d];
};

export type HoloPiece = {lines: V3[][]; faces: V3[][]; axis: V3; hot?: boolean};
export type HoloPart = {name: string; label: string; pieces: HoloPiece[]; spin?: {c: V3; speed: number}};

const ringPts = (c: V3, r: number, axis: 'x' | 'y' | 'z', n = 40, a0 = 0, a1 = TAU): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const u = Math.cos(a) * r;
    const v = Math.sin(a) * r;
    out.push(axis === 'y' ? [c[0] + u, c[1], c[2] + v] : axis === 'x' ? [c[0], c[1] + u, c[2] + v] : [c[0] + u, c[1] + v, c[2]]);
  }
  return out;
};
/** vertical cylinder (axis y): rings + verticals + side faces */
export const holoCyl = (c: V3, r: number, h: number, segs = 16, rings = 3): {lines: V3[][]; faces: V3[][]} => {
  const lines: V3[][] = [];
  const faces: V3[][] = [];
  for (let k = 0; k < rings; k++) lines.push(ringPts([c[0], c[1] + (h * k) / (rings - 1), c[2]], r, 'y', segs * 2));
  for (let i = 0; i < segs; i += 2) {
    const a = (i / segs) * TAU;
    lines.push([
      [c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r],
      [c[0] + Math.cos(a) * r, c[1] + h, c[2] + Math.sin(a) * r],
    ]);
  }
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * TAU;
    const b = ((i + 1) / segs) * TAU;
    const p = (ang: number, y: number): V3 => [c[0] + Math.cos(ang) * r, y, c[2] + Math.sin(ang) * r];
    faces.push([p(a, c[1]), p(b, c[1]), p(b, c[1] + h), p(a, c[1] + h)]);
  }
  // caps as fans
  const top: V3[] = ringPts([c[0], c[1] + h, c[2]], r, 'y', segs).slice(0, segs);
  faces.push(top);
  return {lines, faces};
};
/** tube between two points */
export const holoTube = (a: V3, b: V3, r: number, segs = 8, rings = 4): {lines: V3[][]; faces: V3[][]} => {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(...d) || 1;
  const n: V3 = [d[0] / L, d[1] / L, d[2] / L];
  const ref: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const cross = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  let u = cross(n, ref);
  const ul = Math.hypot(...u);
  u = [u[0] / ul, u[1] / ul, u[2] / ul];
  const v = cross(n, u);
  const at = (t: number, ang: number): V3 => [
    a[0] + d[0] * t + (u[0] * Math.cos(ang) + v[0] * Math.sin(ang)) * r,
    a[1] + d[1] * t + (u[1] * Math.cos(ang) + v[1] * Math.sin(ang)) * r,
    a[2] + d[2] * t + (u[2] * Math.cos(ang) + v[2] * Math.sin(ang)) * r,
  ];
  const lines: V3[][] = [];
  const faces: V3[][] = [];
  for (let k = 0; k < rings; k++) {
    const t = k / (rings - 1);
    lines.push(Array.from({length: segs + 1}, (_, i) => at(t, (i / segs) * TAU)));
  }
  for (let i = 0; i < segs; i += 2) lines.push([at(0, (i / segs) * TAU), at(1, (i / segs) * TAU)]);
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * TAU;
    const a1 = ((i + 1) / segs) * TAU;
    faces.push([at(0, a0), at(0, a1), at(1, a1), at(1, a0)]);
  }
  return {lines, faces};
};
/** axis-aligned box with subdivided edges */
export const holoBox = (c: V3, s: V3, div = 2): {lines: V3[][]; faces: V3[][]} => {
  const [x0, y0, z0] = [c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2];
  const [x1, y1, z1] = [c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2];
  const P = (i: number): V3 => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
  const E = [
    [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const lines: V3[][] = E.map(([a, b]) => [P(a), P(b)]);
  // belt lines
  for (let k = 1; k < div; k++) {
    const y = lerp(y0, y1, k / div);
    lines.push([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]]);
  }
  const F = [
    [0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5],
  ];
  return {lines, faces: F.map((f) => f.map(P))};
};
/** two-blade propeller lines (spins about c) */
export const holoProp = (c: V3, r: number, ang: number): V3[][] => {
  const out: V3[][] = [];
  for (let b = 0; b < 2; b++) {
    const a = ang + b * Math.PI;
    const pts: V3[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const w = Math.sin(t * Math.PI) * r * 0.12;
      pts.push([c[0] + Math.cos(a) * r * t - Math.sin(a) * w, c[1], c[2] + Math.sin(a) * r * t + Math.cos(a) * w]);
    }
    for (let i = 8; i >= 0; i--) {
      const t = i / 8;
      const w = Math.sin(t * Math.PI) * r * 0.12;
      pts.push([c[0] + Math.cos(a) * r * t + Math.sin(a) * w * 0.4, c[1], c[2] + Math.sin(a) * r * t - Math.cos(a) * w * 0.4]);
    }
    out.push(pts);
  }
  return out;
};

/** the default holo subject: an original compact quad-copter (units: ~2.4 wide) */
export const buildDrone = (propAngle: number): HoloPart[] => {
  const parts: HoloPart[] = [];
  const body = holoBox([0, 0, 0], [0.9, 0.26, 1.15], 3);
  const shell = holoBox([0, 0.2, -0.05], [0.7, 0.14, 0.8], 1);
  const bat = holoBox([0, 0.33, -0.05], [0.42, 0.12, 0.55], 1);
  parts.push({name: 'body', label: 'AIRFRAME', pieces: [{...body, axis: [0, 0, 0]}, {...shell, axis: [0, 0.35, 0]}]});
  parts.push({name: 'battery', label: 'BATTERY', pieces: [{...bat, axis: [0, 0.7, 0], hot: true}]});
  const arms: [string, number, number][] = [
    ['rotorFL', -1, 1],
    ['rotorFR', 1, 1],
    ['rotorBL', -1, -1],
    ['rotorBR', 1, -1],
  ];
  for (const [name, sx, sz] of arms) {
    const tip: V3 = [sx * 1.05, 0.02, sz * 0.95];
    const arm = holoTube([sx * 0.38, 0, sz * 0.42], tip, 0.055, 8, 3);
    const motor = holoCyl([tip[0], 0.04, tip[2]], 0.11, 0.16, 12, 3);
    const guard = holoCyl([tip[0], 0.06, tip[2]], 0.46, 0.08, 28, 2);
    const props = holoProp([tip[0], 0.23, tip[2]], 0.4, propAngle * (sx * sz > 0 ? 1 : -1));
    const leg = holoTube([tip[0] * 0.85, -0.02, tip[2] * 0.85], [tip[0] * 0.92, -0.42, tip[2] * 0.92], 0.025, 6, 2);
    parts.push({
      name,
      label: 'ROTOR ' + (sz > 0 ? 'F' : 'R') + (sx < 0 ? 'L' : 'R'),
      pieces: [
        {...arm, axis: [sx * 0.15, 0, sz * 0.15]},
        {...motor, axis: [sx * 0.3, 0.1, sz * 0.3], hot: true},
        {lines: guard.lines, faces: guard.faces, axis: [sx * 0.45, 0.25, sz * 0.45]},
        {lines: props, faces: [], axis: [sx * 0.3, 0.55, sz * 0.3]},
        {...leg, axis: [sx * 0.1, -0.25, sz * 0.1]},
      ],
    });
  }
  // camera gimbal under the nose
  const gimbal: V3[][] = [];
  const gf: V3[][] = [];
  const gc: V3 = [0, -0.26, 0.5];
  for (let k = -2; k <= 2; k++) {
    const y = gc[1] + (k / 3) * 0.14;
    const r = Math.sqrt(Math.max(0, 0.15 * 0.15 - ((k / 3) * 0.14) ** 2));
    gimbal.push(ringPts([gc[0], y, gc[2]], r, 'y', 28));
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    gimbal.push(Array.from({length: 17}, (_, j): V3 => {
      const b = (j / 16) * TAU;
      return [gc[0] + Math.cos(a) * Math.cos(b) * 0.15, gc[1] + Math.sin(b) * 0.15, gc[2] + Math.sin(a) * Math.cos(b) * 0.15];
    }));
  }
  const lens = ringPts([gc[0], gc[1], gc[2] + 0.16], 0.07, 'z', 20);
  gimbal.push(lens);
  const mount = holoBox([0, -0.16, 0.45], [0.18, 0.08, 0.14], 1);
  gf.push(...mount.faces);
  parts.push({name: 'camera', label: 'GIMBAL CAM', pieces: [{lines: [...gimbal, ...mount.lines], faces: gf, axis: [0, -0.25, 0.35], hot: true}]});
  return parts;
};

export type HoloTheme = {stage: string; lift: string; line: string; dim: string; hot: string; accent: string; plate: string; plateBorder: string};
export const holoTheme = (hue = 188, accent = 38): HoloTheme => ({
  stage: hsl(hue + 12, 0.7, 0.024),
  lift: hsl(hue + 6, 0.65, 0.075),
  line: hsl(hue, 1, 0.72),
  dim: hsl(hue, 0.7, 0.52),
  hot: hsl(hue, 0.6, 0.93),
  accent: hsl(accent, 1, 0.64),
  plate: 'rgba(1,8,12,0.72)',
  plateBorder: rgbaC(hsl(hue, 1, 0.72), 0.28),
});

export type HoloRenderOpts = {
  cam: HoloCam;
  explode?: Record<string, number> | number;
  /** world y of the scan front (lines above it are not yet built); Infinity = all */
  scanY?: number;
  hotBand?: number;
  /** per-part hot flag (turn near-white) */
  hotParts?: string[];
  levels?: number;
  /** depth range for fog */
  near?: number;
  far?: number;
  widthMul?: number;
  dimOthers?: string[];
};

/** projects every line of the model and buckets segments into depth-fog alpha levels -> few big paths */
export const holoPaths = (parts: HoloPart[], o: HoloRenderOpts) => {
  const levels = o.levels ?? 7;
  const buckets: string[] = Array.from({length: levels}, () => '');
  let hot = '';
  const near = o.near ?? o.cam.dist - 1.6;
  const far = o.far ?? o.cam.dist + 1.6;
  const scanY = o.scanY ?? Infinity;
  const band = o.hotBand ?? 0.07;
  const bbox: Record<string, [number, number, number, number]> = {};
  for (const part of parts) {
    const ex = typeof o.explode === 'number' ? o.explode : o.explode?.[part.name] ?? 0;
    const partHot = o.hotParts?.includes(part.name);
    let bx0 = Infinity;
    let by0 = Infinity;
    let bx1 = -Infinity;
    let by1 = -Infinity;
    for (const pc of part.pieces) {
      const off: V3 = [pc.axis[0] * ex, pc.axis[1] * ex, pc.axis[2] * ex];
      const pieceHot = partHot || (pc.hot && ex > 0.05);
      for (const ln of pc.lines) {
        for (let i = 0; i < ln.length - 1; i++) {
          let A: V3 = [ln[i][0] + off[0], ln[i][1] + off[1], ln[i][2] + off[2]];
          let B: V3 = [ln[i + 1][0] + off[0], ln[i + 1][1] + off[1], ln[i + 1][2] + off[2]];
          // scan clip (world y below scanY is built)
          if (A[1] > scanY && B[1] > scanY) continue;
          if (A[1] > scanY || B[1] > scanY) {
            const t = (scanY - A[1]) / (B[1] - A[1]);
            const M: V3 = [lerp(A[0], B[0], t), scanY, lerp(A[2], B[2], t)];
            if (A[1] > scanY) A = M;
            else B = M;
          }
          const pa = holoProject(o.cam, A);
          const pb = holoProject(o.cam, B);
          const seg = `M${pa[0].toFixed(1)} ${pa[1].toFixed(1)}L${pb[0].toFixed(1)} ${pb[1].toFixed(1)}`;
          bx0 = Math.min(bx0, pa[0], pb[0]);
          bx1 = Math.max(bx1, pa[0], pb[0]);
          by0 = Math.min(by0, pa[1], pb[1]);
          by1 = Math.max(by1, pa[1], pb[1]);
          const nearScan = scanY < 50 && Math.abs((A[1] + B[1]) / 2 - scanY) < band;
          if (nearScan || pieceHot) {
            hot += seg;
            continue;
          }
          const d = (pa[2] + pb[2]) / 2;
          const k = Math.round(cl((d - near) / (far - near)) * (levels - 1));
          buckets[k] += seg;
        }
      }
    }
    bbox[part.name] = [bx0, by0, bx1, by1];
  }
  return {buckets, hot, bbox};
};

/** additive glow filter used by holo looks (two blur passes added back) */
export const HoloGlowDef: React.FC<{id: string; u: number; strength?: number}> = ({id, u, strength = 1}) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation={3 * u} result="b1" />
    <feGaussianBlur in="SourceGraphic" stdDeviation={9 * u} result="b2" />
    <feComponentTransfer in="b1" result="b1s">
      <feFuncA type="linear" slope={0.85 * strength} />
    </feComponentTransfer>
    <feComponentTransfer in="b2" result="b2s">
      <feFuncA type="linear" slope={0.7 * strength} />
    </feComponentTransfer>
    <feMerge>
      <feMergeNode in="b2s" />
      <feMergeNode in="b1s" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

/** draws the bucketed wireframe */
export const HoloWire: React.FC<{paths: ReturnType<typeof holoPaths>; theme: HoloTheme; u: number; width?: number; glowId: string; opacity?: number}> = ({paths, theme, u, width = 1.3, glowId, opacity = 1}) => {
  const n = paths.buckets.length;
  return (
    <g filter={`url(#${glowId})`} opacity={opacity} style={{mixBlendMode: 'screen'}}>
      {paths.buckets.map((d, i) =>
        d ? <path key={i} d={d} stroke={theme.line} strokeOpacity={lerp(1, 0.25, i / (n - 1))} strokeWidth={width * u} fill="none" strokeLinecap="round" /> : null,
      )}
      {paths.hot && <path d={paths.hot} stroke={theme.hot} strokeWidth={width * 1.25 * u} fill="none" strokeLinecap="round" />}
    </g>
  );
};

/** perspective projector pad: concentric rings (one bright, one dashed), ticks, faint rays; slowly rotating */
export const HoloPad: React.FC<{cam: HoloCam; y: number; r: number; theme: HoloTheme; u: number; rot: number; on?: number}> = ({cam, y, r, theme, u, rot, on = 1}) => {
  const ring = (rr: number, n = 96) => pathOf(Array.from({length: n + 1}, (_, i) => {
    const a = (i / n) * TAU;
    const p = holoProject(cam, [Math.cos(a) * rr, y, Math.sin(a) * rr]);
    return [p[0], p[1]] as [number, number];
  }));
  const ticks: string[] = [];
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * TAU + rot;
    const l = i % 10 === 0 ? 0.09 : 0.04;
    const p0 = holoProject(cam, [Math.cos(a) * r * 1.02, y, Math.sin(a) * r * 1.02]);
    const p1 = holoProject(cam, [Math.cos(a) * (r * 1.02 + l), y, Math.sin(a) * (r * 1.02 + l)]);
    ticks.push(`M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`);
  }
  const rays: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU - rot * 0.5;
    const p0 = holoProject(cam, [Math.cos(a) * r * 0.25, y, Math.sin(a) * r * 0.25]);
    const p1 = holoProject(cam, [Math.cos(a) * r * 1.5, y, Math.sin(a) * r * 1.5]);
    rays.push(`M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`);
  }
  // filled disc
  const disc = ring(r, 96) + 'Z';
  return (
    <g opacity={on}>
      <path d={disc} fill={rgbaC(theme.line, 0.05)} />
      <path d={rays.join('')} stroke={theme.dim} strokeOpacity={0.12} strokeWidth={1 * u} />
      <path d={ring(r)} stroke={theme.line} strokeOpacity={0.55} strokeWidth={1.4 * u} fill="none" />
      <path d={ring(r * 0.72)} stroke={theme.dim} strokeOpacity={0.4} strokeWidth={1 * u} fill="none" strokeDasharray={`${6 * u} ${8 * u}`} />
      <path d={ring(r * 0.4)} stroke={theme.dim} strokeOpacity={0.25} strokeWidth={1 * u} fill="none" />
      <path d={ring(r * 1.25)} stroke={theme.dim} strokeOpacity={0.18} strokeWidth={1 * u} fill="none" />
      <path d={ticks.join('')} stroke={theme.line} strokeOpacity={0.35} strokeWidth={1 * u} />
    </g>
  );
};

/** stage: near-black ground with a radial lift, 48px dot grid (parallax) and vignette */
export const HoloStage: React.FC<{theme: HoloTheme; w: number; h: number; u: number; px?: number; py?: number; id: string}> = ({theme, w, h, u, px = 0, py = 0, id}) => {
  const g = 48 * u;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 60% at 55% 50%, ${theme.lift} 0%, ${theme.stage} 75%)`}} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id={id} width={g} height={g} patternUnits="userSpaceOnUse" x={(px * 0.2) % g} y={(py * 0.2) % g}>
            <circle cx={g / 2} cy={g / 2} r={1.1 * u} fill={theme.dim} opacity={0.22} />
          </pattern>
        </defs>
        <rect width={w} height={h} fill={`url(#${id})`} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)'}} />
    </>
  );
};

/** rollText from hologram-hud hud.js: lock right-to-left; unlocked chars cycle through glyphs every frame */
export const rollText = (str: string, k: number, frame: number, seed = 1) => {
  const n = str.length;
  const DIG = '0123456789';
  const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = str[i];
    const lockAt = 0.25 + ((n - 1 - i) / Math.max(1, n)) * 0.7;
    if (k >= lockAt || /[\s.,:·/-]/.test(c)) {
      out += c;
      continue;
    }
    const r = h1(frame * 13.7 + i * 7.1 + seed);
    if (/[0-9]/.test(c)) out += DIG[Math.floor(r * DIG.length)];
    else if (/[a-z]/.test(c)) out += LET[Math.floor(r * LET.length)].toLowerCase();
    else out += LET[Math.floor(r * LET.length)];
  }
  return out;
};

/** dark text plate with four corner ticks (hologram-hud plate()) */
export const HoloPlate: React.FC<{x: number; y: number; w: number; h: number; theme: HoloTheme; u: number; opacity?: number; tick?: number}> = ({x, y, w, h, theme, u, opacity = 1, tick = 14}) => {
  const t = tick * u;
  const d = `M${x} ${y + t}V${y}H${x + t}M${x + w - t} ${y}H${x + w}V${y + t}M${x + w} ${y + h - t}V${y + h}H${x + w - t}M${x + t} ${y + h}H${x}V${y + h - t}`;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} fill={theme.plate} stroke={theme.plateBorder} strokeWidth={1 * u} />
      <path d={d} stroke={theme.line} strokeWidth={1.6 * u} fill="none" opacity={0.85} />
    </g>
  );
};

/** HUD chrome: corner brackets + mono header / footer readouts */
export const HoloChrome: React.FC<{w: number; h: number; u: number; theme: HoloTheme; tl: string; tr: string; bl: string; br: string; on?: number}> = ({w, h, u, theme, tl, tr, bl, br, on = 1}) => {
  const m = 40 * u;
  const a = 46 * u;
  const fs = 19 * u;
  const st: React.CSSProperties = {position: 'absolute', fontFamily: lf.techMono, fontSize: fs, color: theme.dim, letterSpacing: 2 * u, whiteSpace: 'nowrap', opacity: on};
  return (
    <>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: on * 0.7}}>
        <path
          d={`M${m} ${m + a}V${m}H${m + a}M${w - m - a} ${m}H${w - m}V${m + a}M${w - m} ${h - m - a}V${h - m}H${w - m - a}M${m + a} ${h - m}H${m}V${h - m - a}`}
          stroke={theme.dim}
          strokeWidth={1.5 * u}
          fill="none"
        />
      </svg>
      <div style={{...st, left: m + 22 * u, top: m + 14 * u}}>{tl}</div>
      <div style={{...st, right: m + 22 * u, top: m + 14 * u}}>{tr}</div>
      <div style={{...st, left: m + 22 * u, bottom: m + 12 * u}}>{bl}</div>
      <div style={{...st, right: m + 22 * u, bottom: m + 12 * u}}>{br}</div>
    </>
  );
};

// ================================================================================================ KINO (constructivist montage) + DOSSIER print
export const KINO = {red: '#D52B1E', ink: '#141210', paper: '#EDE4D0'};
export const DOSSIER = {paper: '#F4ECDD', navy: '#1D2340', blue: '#2E55D6', pink: '#FF5A87', yellow: '#FFC628', red: '#E8384F'};

/** seeded paper fibre multiplied over everything (kino α .5) */
export const PaperFibre: React.FC<{w: number; h: number; id: string; opacity?: number; seed?: number; freq?: number; tint?: string}> = ({w, h, id, opacity = 0.5, seed = 7, freq = 0.9, tint = '#8a7a5a'}) => (
  <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity, pointerEvents: 'none'}}>
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency={`${freq} ${freq * 0.35}`} numOctaves={3} seed={seed} result="f" />
      <feColorMatrix in="f" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.6 0 0 0 1.0" />
    </filter>
    <rect width={w} height={h} fill={tint} filter={`url(#${id})`} opacity={0.4} />
  </svg>
);

/** S-curve g = x + s·(x−.5)·(1−|2x−1|)·2 */
export const sCurve = (x: number, s: number) => cl(x + s * (x - 0.5) * (1 - Math.abs(2 * x - 1)) * 2);
/** SVG filter: luminance -> stretch -> S-curve -> ink..paper duotone (kino print grade) */
export const PrintGradeDef: React.FC<{id: string; ink?: string; paper?: string; s?: number; lo?: number; hi?: number; flicker?: number}> = ({id, ink = KINO.ink, paper = KINO.paper, s = 0.32, lo = 0.05, hi = 0.95, flicker = 0}) => {
  const I = hex3(ink);
  const Pp = hex3(paper);
  const N = 24;
  const tab = (c: number) =>
    Array.from({length: N + 1}, (_, i) => {
      const x = cl((i / N - lo) / (hi - lo));
      const g = cl(sCurve(x, s) * (1 + flicker));
      return ((I[c] + (Pp[c] - I[c]) * g) / 255).toFixed(4);
    }).join(' ');
  return (
    <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
      <feColorMatrix type="matrix" values="0.3 0.55 0.15 0 0  0.3 0.55 0.15 0 0  0.3 0.55 0.15 0 0  0 0 0 1 0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={tab(0)} />
        <feFuncG type="table" tableValues={tab(1)} />
        <feFuncB type="table" tableValues={tab(2)} />
      </feComponentTransfer>
    </filter>
  );
};

/** decaying hash shake (kino slam): amplitude·exp(−14·Δt) */
export const slamShake = (frame: number, t0: number, amp: number, seed = 1): [number, number] => {
  const dt = (frame - t0) / 30;
  if (dt < 0 || dt > 0.6) return [0, 0];
  const k = amp * Math.exp(-14 * dt);
  return [(h1(frame, seed, 1) * 2 - 1) * k, (h1(frame, seed, 2) * 2 - 1) * k];
};

/** procedural "archive photo" (grey scenes) standing in for footage; print-grade it with PrintGradeDef */
export type ArchiveKind = 'tower' | 'girder' | 'crowd' | 'street' | 'works';
export const ARCHIVE_KINDS: ArchiveKind[] = ['tower', 'girder', 'crowd', 'street', 'works'];
export const ArchivePhoto: React.FC<{kind: ArchiveKind; w: number; h: number; id: string; t?: number; seed?: number}> = ({kind, w, h, id, t = 0, seed = 1}) => {
  const r = mul32(seed * 31 + kind.length * 7);
  const els: React.ReactNode[] = [];
  const g = (v: number) => {
    const c = Math.round(cl(v, 0, 255));
    return `rgb(${c},${c},${c})`;
  };
  if (kind === 'tower' || kind === 'girder') {
    for (let i = 0; i < 40; i++) {
      const bx = (i / 40) * w * 1.1 - w * 0.05;
      const bh = h * (0.08 + r() * 0.16);
      els.push(<rect key={'c' + i} x={bx} y={h * 0.82 - bh} width={w / 40 + 2} height={bh + h * 0.2} fill={g(150 + r() * 40)} />);
    }
    if (kind === 'tower') {
      const tw = Math.min(w * 0.5, h * 0.5);
      const tx = w * 0.5 - tw / 2;
      [1, 0.82, 0.64, 0.46, 0.3].forEach((k, j) => {
        const ww = tw * k;
        els.push(<rect key={'t' + j} x={w / 2 - ww / 2} y={h * (0.95 - 0.15 * (j + 1)) - h * 0.08} width={ww} height={h} fill={j % 2 ? g(62) : g(76)} />);
      });
      for (let gy = 0; gy < 34; gy++)
        for (let gx = 0; gx < 8; gx++) {
          const yy = h * 0.3 + gy * h * 0.02;
          const xx = tx + tw * 0.08 + gx * tw * 0.11;
          if (yy > h) continue;
          const tiers = [1, 0.82, 0.64, 0.46, 0.3];
          let tw2 = 0;
          tiers.forEach((k, j) => {
            if (yy >= h * (0.95 - 0.15 * (j + 1)) - h * 0.08 + h * 0.01) tw2 = tw * k;
          });
          if (xx < w / 2 - tw2 / 2 + tw * 0.02 || xx + tw * 0.05 > w / 2 + tw2 / 2 - tw * 0.02) continue;
          els.push(<rect key={`w${gx}-${gy}`} x={xx} y={yy} width={tw * 0.05} height={h * 0.01} fill={r() > 0.4 ? g(190) : g(34)} opacity={0.8} />);
        }
      const fy = h * 0.1;
      for (let k = 0; k < 6; k++) els.push(<rect key={'fv' + k} x={w / 2 - tw * 0.12 + k * tw * 0.048} y={fy} width={Math.max(2, w * 0.004)} height={h * 0.16} fill={g(34)} />);
      for (let k = 0; k < 5; k++) els.push(<rect key={'fh' + k} x={w / 2 - tw * 0.12} y={fy + k * h * 0.04} width={tw * 0.24} height={Math.max(2, h * 0.004)} fill={g(34)} />);
      els.push(<rect key="spire" x={w / 2 - w * 0.004} y={h * 0.0} width={w * 0.008} height={h * 0.12} fill={g(40)} />);
    } else {
      const gy = h * 0.58;
      const fx = w * 0.42;
      const fy = gy - h * 0.005;
      els.push(
        <g key="gird" transform={`rotate(-6 ${w * 0.3} ${gy})`}>
          <rect x={-w * 0.1} y={gy} width={w * 0.85} height={h * 0.05} fill={g(28)} />
          {Array.from({length: 14}, (_, i) => (
            <circle key={i} cx={-w * 0.05 + i * w * 0.06} cy={gy + h * 0.025} r={h * 0.006} fill={g(90)} />
          ))}
          <g fill={g(20)}>
            <ellipse cx={fx} cy={fy - h * 0.27} rx={h * 0.026} ry={h * 0.032} />
            <path d={`M${fx - h * 0.042} ${fy - h * 0.23}L${fx + h * 0.042} ${fy - h * 0.23}L${fx + h * 0.032} ${fy - h * 0.12}L${fx - h * 0.032} ${fy - h * 0.12}Z`} />
            <path d={`M${fx - h * 0.032} ${fy - h * 0.12}L${fx - h * 0.055} ${fy}L${fx - h * 0.03} ${fy}L${fx} ${fy - h * 0.08}L${fx + h * 0.03} ${fy}L${fx + h * 0.055} ${fy}L${fx + h * 0.032} ${fy - h * 0.12}Z`} />
            <path d={`M${fx + h * 0.035} ${fy - h * 0.22}L${fx + h * 0.09} ${fy - h * 0.33}L${fx + h * 0.105} ${fy - h * 0.32}L${fx + h * 0.048} ${fy - h * 0.19}Z`} />
          </g>
          <path d={`M${fx + h * 0.1} ${fy - h * 0.33}Q${fx + h * 0.22} ${h * 0.12} ${fx + h * 0.18} ${-h * 0.2}`} stroke={g(30)} strokeWidth={Math.max(2, h * 0.006)} fill="none" />
        </g>,
      );
    }
  } else if (kind === 'crowd') {
    for (let row = 0; row < 7; row++) {
      const y0 = h * (0.28 + row * 0.11);
      const s = 0.5 + row * 0.18;
      const n = 22 - row * 2;
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * w + (r() - 0.5) * w * 0.02;
        const v = 70 + r() * 70 - row * 6;
        els.push(<rect key={`b${row}-${i}`} x={x - h * 0.05 * s} y={y0 + h * 0.03 * s} width={h * 0.1 * s} height={h * 0.3} rx={h * 0.03 * s} fill={g(v - 25)} />);
        els.push(<ellipse key={`h${row}-${i}`} cx={x} cy={y0} rx={h * 0.03 * s} ry={h * 0.036 * s} fill={g(v + 40)} />);
        if (r() > 0.55) els.push(<ellipse key={`hat${row}-${i}`} cx={x} cy={y0 - h * 0.025 * s} rx={h * 0.042 * s} ry={h * 0.013 * s} fill={g(30)} />);
      }
    }
  } else if (kind === 'street') {
    els.push(<rect key="road" y={h * 0.7} width={w} height={h * 0.3} fill={g(120)} />);
    for (let i = 0; i < 10; i++) {
      const bx = i * w * 0.12 - w * 0.05;
      const bh = h * (0.4 + r() * 0.35);
      els.push(<rect key={'s' + i} x={bx} y={h * 0.72 - bh} width={w * 0.12} height={bh} fill={g(70 + r() * 60)} />);
      for (let k = 0; k < 6; k++) els.push(<rect key={`sw${i}-${k}`} x={bx + w * 0.02} y={h * 0.72 - bh + h * 0.05 + k * h * 0.06} width={w * 0.08} height={h * 0.025} fill={g(205)} opacity={0.6} />);
    }
    const cx = ((t * 40) % (w * 1.4)) - w * 0.2;
    els.push(<rect key="car" x={cx} y={h * 0.74} width={w * 0.16} height={h * 0.07} rx={h * 0.02} fill={g(28)} />);
    els.push(<circle key="cw1" cx={cx + w * 0.03} cy={h * 0.815} r={h * 0.02} fill={g(15)} />);
    els.push(<circle key="cw2" cx={cx + w * 0.13} cy={h * 0.815} r={h * 0.02} fill={g(15)} />);
  } else {
    for (let i = 0; i < 5; i++) {
      const x = w * (0.1 + i * 0.18);
      els.push(<rect key={'ch' + i} x={x} y={h * (0.15 + r() * 0.2)} width={w * 0.035} height={h} fill={g(58)} />);
      els.push(<ellipse key={'sm' + i} cx={x + w * 0.02 + t * 3} cy={h * 0.12} rx={w * 0.08} ry={h * 0.05} fill={g(210)} opacity={0.6} />);
    }
    els.push(<rect key="hall" y={h * 0.6} width={w} height={h * 0.4} fill={g(46)} />);
    for (let i = 0; i < 12; i++) els.push(<path key={'saw' + i} d={`M${i * w * 0.09} ${h * 0.6}l${w * 0.09} ${-h * 0.08}v${h * 0.08}z`} fill={g(70)} />);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d8d8d" />
          <stop offset="1" stopColor="#e6e6e6" />
        </linearGradient>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-sky)`} />
      {els}
      <rect width={w} height={h} fill={`url(#${id}-vig)`} />
    </svg>
  );
};

/** rough ink filter for stamps / bars (turbulence displacement + speckle mask) */
export const StampInkDef: React.FC<{id: string; u: number; scale?: number; seed?: number; speckle?: number}> = ({id, u, scale = 5, seed = 4, speckle = 1}) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency={0.04 / u} numOctaves={3} seed={seed} result="t" />
    <feDisplacementMap in="SourceGraphic" in2="t" scale={scale * u} xChannelSelector="R" yChannelSelector="G" result="d" />
    <feTurbulence type="fractalNoise" baseFrequency={0.55 / u} numOctaves={2} seed={seed + 9} result="g" />
    <feColorMatrix in="g" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${-9 * speckle} ${5.9 + (1 - speckle) * 4}`} result="m" />
    <feComposite in="d" in2="m" operator="in" />
  </filter>
);

// ================================================================================================ INK (sumi brush engine, SVG)
// Stroke model in the spirit of lemo-opuscar styles/ink-wash/demo/ink.js (MIT, © LemoLab):
// centreline + pressure -> bristle tracks across the width; ink runs out along the stroke so the
// dry tail breaks into flying white; the loaded side is darker (the stroke carries its own contour).
export type InkPoint = [number, number, number?]; // x, y, pressure (0..1, default 1)
export type InkProfileName = 'brush' | 'tip' | 'even' | 'lens' | 'fan' | 'rise';
const INK_PROFILES: Record<InkProfileName, (s: number) => number> = {
  brush: (s) => 0.35 + 0.95 * Math.sin(Math.min(1, s * 1.25) * Math.PI) ** 0.7 * (1 - s * 0.35),
  tip: (s) => Math.max(0.12, 1 - s) ** 1.2,
  even: () => 1,
  lens: (s) => 0.25 + 0.75 * Math.sin(s * Math.PI),
  fan: (s) => 0.2 + 0.8 * s,
  rise: (s) => (s < 0.15 ? s / 0.15 : 1 - (s - 0.15) * 0.55),
};

/** resample a polyline (with pressure) to n points; returns pts, normals, arc length */
export const resamplePath = (pts: InkPoint[], n = 72) => {
  const P = pts.map((p) => [p[0], p[1], p[2] ?? 1] as [number, number, number]);
  const segLen: number[] = [0];
  for (let i = 1; i < P.length; i++) segLen.push(segLen[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = segLen[segLen.length - 1] || 1;
  const out: {x: number; y: number; p: number; nx: number; ny: number; u: number}[] = [];
  for (let k = 0; k < n; k++) {
    const d = (k / (n - 1)) * L;
    let i = 1;
    while (i < segLen.length - 1 && segLen[i] < d) i++;
    const t = cl((d - segLen[i - 1]) / Math.max(1e-6, segLen[i] - segLen[i - 1]));
    const x = lerp(P[i - 1][0], P[i][0], t);
    const y = lerp(P[i - 1][1], P[i][1], t);
    const p = lerp(P[i - 1][2], P[i][2], t);
    const dx = P[i][0] - P[i - 1][0];
    const dy = P[i][1] - P[i - 1][1];
    const dl = Math.hypot(dx, dy) || 1;
    out.push({x, y, p, nx: -dy / dl, ny: dx / dl, u: k / (n - 1)});
  }
  // smooth normals
  for (let k = 1; k < n - 1; k++) {
    out[k].nx = (out[k - 1].nx + out[k].nx + out[k + 1].nx) / 3;
    out[k].ny = (out[k - 1].ny + out[k].ny + out[k + 1].ny) / 3;
  }
  return {pts: out, length: L};
};

export type BrushOpts = {
  path: InkPoint[];
  width: number;
  color?: string;
  tone?: number; // 0..1 target darkness
  dry?: number; // 0 wet .. .7 flying white
  bristles?: number;
  seed?: number;
  profile?: InkProfileName;
  /** -1 | 1: which side carries more ink (darker contour) ; 0 = even */
  darkSide?: number;
  /** draw progress 0..1 */
  t?: number;
  samples?: number;
};

export type BrushPath = {d: string; w: number; o: number};
/** returns body outline + bristle dashes for one stroke; everything clipped to draw progress t */
export const brushStroke = (o: BrushOpts): {body: string; bristles: BrushPath[]; tip: {x: number; y: number} | null} => {
  const {path, width} = o;
  const dry = o.dry ?? 0.3;
  const tone = o.tone ?? 0.85;
  const nB = Math.max(4, Math.min(40, o.bristles ?? Math.round(width / 3)));
  const seed = o.seed ?? 1;
  const prof = INK_PROFILES[o.profile ?? 'brush'];
  const t = cl(o.t ?? 1);
  const N = o.samples ?? 72;
  const {pts} = resamplePath(path, N);
  const kMax = Math.max(1, Math.floor((N - 1) * t));
  const wAt = (k: number) => {
    const s = pts[k].u;
    const rough = 1 + (dry * 0.5 + 0.08) * (vnoise(s * 9 + seed * 3, seed) * 2 - 1);
    return Math.max(width * 0.04, width * prof(s) * pts[k].p * rough) / 2;
  };
  // body outline (variable width ribbon)
  const Lh: string[] = [];
  const Rh: string[] = [];
  for (let k = 0; k <= kMax; k++) {
    const r = wAt(k);
    const p = pts[k];
    Lh.push(`${(p.x + p.nx * r).toFixed(1)} ${(p.y + p.ny * r).toFixed(1)}`);
    Rh.push(`${(p.x - p.nx * r).toFixed(1)} ${(p.y - p.ny * r).toFixed(1)}`);
  }
  const body = `M${Lh.join('L')}L${Rh.reverse().join('L')}Z`;
  // bristles
  const bristles: BrushPath[] = [];
  for (let b = 0; b < nB; b++) {
    const off = nB === 1 ? 0 : (b / (nB - 1)) * 2 - 1; // -1..1 across the width
    const edge = Math.abs(off);
    const sideK = o.darkSide ? cl(0.5 + 0.5 * off * (o.darkSide > 0 ? 1 : -1)) : 0.5;
    const load = 1 - dry * (0.15 + 0.85 * edge) * (0.5 + 0.7 * h1(b, seed));
    let d = '';
    let pen = false;
    for (let k = 0; k <= kMax; k++) {
      const p = pts[k];
      const r = wAt(k) * 0.92;
      const jx = (vnoise(k * 0.23 + b * 7.7, seed + 2) * 2 - 1) * dry * width * 0.04;
      const x = p.x + p.nx * r * off + jx;
      const y = p.y + p.ny * r * off + jx * 0.5;
      const ink = load - dry * (0.08 + 1.15 * Math.pow(p.u, 1.25)) + vnoise(p.u * 3 + b, seed + 5) * 0.9 * dry * 0.4 + vnoise(p.u * 14 + b * 3, seed + 8) * 0.25 * dry;
      const on = ink > 0.42 * dry + 0.02;
      if (on && !pen) {
        d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
        pen = true;
      } else if (on) {
        d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
      } else pen = false;
    }
    if (d) bristles.push({d, w: (width / nB) * 1.7, o: cl(tone * (0.5 + 0.7 * sideK) * (0.75 + 0.5 * h1(b, seed + 3)))});
  }
  const tip = kMax < N - 1 ? {x: pts[kMax].x, y: pts[kMax].y} : null;
  return {body, bristles, tip};
};

/** warm rice paper with cloud mottling and long fibres (ink-wash comp.js, SVG approximation) */
export const RicePaper: React.FC<{w: number; h: number; id: string; paper?: string; opacity?: number; seed?: number}> = ({w, h, id, paper = '#F2ECDE', opacity = 1, seed = 11}) => (
  <div style={{position: 'absolute', inset: 0, background: paper, opacity}}>
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <filter id={`${id}-m`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves={3} seed={seed} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.36  0.4 0 0 0 0" />
      </filter>
      <filter id={`${id}-f`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.002 0.09" numOctaves={2} seed={seed + 4} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.5  0 0 0 0 0.42  0.3 0 0 -0.18 0.05" />
      </filter>
      <rect width={w} height={h} filter={`url(#${id}-m)`} opacity={0.5} style={{mixBlendMode: 'multiply'}} />
      <rect width={w} height={h} filter={`url(#${id}-f)`} opacity={0.3} style={{mixBlendMode: 'multiply'}} />
    </svg>
  </div>
);

/** ink bleed filter: domain-warped soft edge + darker edge pigment */
export const InkBleedDef: React.FC<{id: string; u: number; bleed?: number}> = ({id, u, bleed = 1}) => (
  <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency={0.012 / Math.max(0.5, u)} numOctaves={3} seed={7} result="t" />
    <feDisplacementMap in="SourceGraphic" in2="t" scale={6 * u * bleed} result="warp" />
    <feGaussianBlur in="warp" stdDeviation={2 * u * bleed} result="soft" />
    <feGaussianBlur in="warp" stdDeviation={6 * u * bleed} result="wide" />
    <feComposite in="soft" in2="wide" operator="arithmetic" k1={0} k2={1.35} k3={-0.45} k4={0} result="rim" />
    <feComponentTransfer in="rim" result="rimA">
      <feFuncA type="linear" slope={1.15} />
    </feComponentTransfer>
    <feMerge>
      <feMergeNode in="wide" />
      <feMergeNode in="rimA" />
    </feMerge>
  </filter>
);

/** five ink tones as opacities (jiao nong zhong dan qing) */
export const INK_TONES = {jiao: 0.96, nong: 0.82, zhong: 0.6, dan: 0.34, qing: 0.16};
export const INK = {paper: '#F2ECDE', ink: '#131110', pale: '#858c94', vermilion: '#B02E22'};

/** layered xieyi mountain range as an SVG group (far = pale flat, near = darker, faded ends) */
export const InkRange: React.FC<{w: number; h: number; y: number; amp: number; tone: number; seed: number; id: string; mist?: number}> = ({w, h, y, amp, tone, seed, id, mist = 0.35}) => {
  const pts: string[] = [];
  const N = Math.max(48, Math.round(w / 85));
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * w;
    const peak = Math.pow(Math.abs(fbm2(x * 0.0022 + seed * 7, seed, seed, 3)), 1.2) * amp;
    pts.push(`${x.toFixed(1)} ${(y - peak).toFixed(1)}`);
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={tone} />
          <stop offset={String(1 - mist)} stopColor="#000" stopOpacity={tone * 0.75} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-ends`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.12" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.88" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse">
          <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-ends)`} />
        </mask>
      </defs>
      <path d={`M${pts.join('L')}L${w} ${h}L0 ${h}Z`} fill={`url(#${id}-fade)`} mask={`url(#${id}-mask)`} />
    </g>
  );
};

// ================================================================================================ ISO (flat true-isometric 2D engine)
// Projection + tri shading in the spirit of lemo-opuscar styles/iso-infographic/demo/engine.js (MIT, © LemoLab):
// sx = (x − y)·cos30°·k, sy = ((x + y)/2 − z)·k; painter depth = x + y + z; three tones per hue.
export const ISO_COS30 = Math.cos(Math.PI / 6);
export const ISO = {
  ground: '#F2E6D0',
  boardTop: '#FBF4E6',
  boardSide: '#D9C8A9',
  sea: ['#5A9BCB', '#3C7FB1', '#2D6390'],
  leaf: ['#7BA75F', '#5E8C4A', '#476F37'],
  subject: ['#CF5140', '#B3352B', '#8C2620'],
  soil: ['#A77850', '#8A5B3A', '#6A432A'],
  mustard: ['#E9BE5C', '#D9A53A', '#B0832A'],
  ink: '#2E2522',
  desat: '#E9DFCB',
  shadowMix: '#231A2C',
};
/** three face tones from a base colour */
export const isoTri = (c: string) => ({top: mixC(c, '#FFF7E6', 0.2), left: c, right: mixC(c, ISO.shadowMix, 0.22)});

export type IsoPoly = {pts: string; fill: string; depth: number; stroke?: string; sw?: number; alpha?: number};
export type IsoCtx = {k: number; cx: number; cy: number; polys: IsoPoly[]; desat?: number};

export const isoP = (ctx: IsoCtx, x: number, y: number, z: number): [number, number] => [ctx.cx + (x - y) * ISO_COS30 * ctx.k, ctx.cy + ((x + y) / 2 - z) * ctx.k];

const desatC = (c: string, amount: number) => {
  if (!amount) return c;
  const l = lumaOf(c) * 255;
  const grey = rgbHex([l, l, l]);
  return mixC(c, mixC(grey, ISO.desat, 0.45), amount);
};

/** push one polygon of world points */
export const isoPoly = (ctx: IsoCtx, pts: [number, number, number][], fill: string, opts: {bias?: number; stroke?: string; sw?: number; alpha?: number; keep?: boolean} = {}) => {
  const d = pts.reduce((s, p) => s + p[0] + p[1] + p[2], 0) / pts.length + (opts.bias ?? 0);
  ctx.polys.push({
    pts: pts.map((p) => isoP(ctx, p[0], p[1], p[2]).map((v) => v.toFixed(1)).join(',')).join(' '),
    fill: opts.keep ? fill : desatC(fill, ctx.desat ?? 0),
    depth: d,
    stroke: opts.stroke,
    sw: opts.sw,
    alpha: opts.alpha,
  });
};

/** axis-aligned box: x0..x1, y0..y1, z0..z1 (z up); draws top + the two camera-facing sides */
export const isoBox = (ctx: IsoCtx, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: string, opts: {bias?: number; keep?: boolean; rise?: number} = {}) => {
  const t = isoTri(c);
  const r = opts.rise ?? 0; // vertical screen offset for arrivals: handled by shifting z
  const zb = z0 + r;
  const zt = z1 + r;
  isoPoly(ctx, [[x0, y0, zt], [x1, y0, zt], [x1, y1, zt], [x0, y1, zt]], t.top, opts);
  isoPoly(ctx, [[x0, y1, zt], [x1, y1, zt], [x1, y1, zb], [x0, y1, zb]], t.left, opts); // +y face (left, lighter base)
  isoPoly(ctx, [[x1, y0, zt], [x1, y1, zt], [x1, y1, zb], [x1, y0, zb]], t.right, opts); // +x face (right, darker)
};

/** prism roof along y (gable at ±x) */
export const isoRoof = (ctx: IsoCtx, x0: number, y0: number, z: number, x1: number, y1: number, h: number, c: string, opts: {bias?: number; keep?: boolean; rise?: number} = {}) => {
  const t = isoTri(c);
  const r = opts.rise ?? 0;
  const zb = z + r;
  const zt = z + h + r;
  const mx = (x0 + x1) / 2;
  isoPoly(ctx, [[x0, y0, zb], [x1, y0, zb], [mx, y0, zt]], t.right, {...opts, bias: (opts.bias ?? 0) - 0.01});
  isoPoly(ctx, [[mx, y0, zt], [mx, y1, zt], [x1, y1, zb], [x1, y0, zb]], t.right, opts);
  isoPoly(ctx, [[mx, y0, zt], [mx, y1, zt], [x0, y1, zb], [x0, y0, zb]], t.top, opts);
};

/** simple tree: trunk box + 2 leaf boxes */
export const isoTree = (ctx: IsoCtx, x: number, y: number, s: number, opts: {bias?: number; keep?: boolean; rise?: number; pop?: number} = {}) => {
  const pop = opts.pop ?? 1;
  if (pop <= 0) return;
  const s1 = s * pop;
  isoBox(ctx, x - s * 0.08, y - s * 0.08, 0, x + s * 0.08, y + s * 0.08, s1 * 0.5, ISO.soil[1], opts);
  isoBox(ctx, x - s1 * 0.32, y - s1 * 0.32, s1 * 0.45, x + s1 * 0.32, y + s1 * 0.32, s1 * 1.05, ISO.leaf[1], {...opts, bias: (opts.bias ?? 0) + 0.02});
  isoBox(ctx, x - s1 * 0.18, y - s1 * 0.18, s1 * 1.05, x + s1 * 0.18, y + s1 * 0.18, s1 * 1.4, ISO.leaf[0], {...opts, bias: (opts.bias ?? 0) + 0.04});
};

export const IsoPolys: React.FC<{ctx: IsoCtx}> = ({ctx}) => (
  <>
    {ctx.polys
      .sort((a, b) => a.depth - b.depth)
      .map((p, i) => (
        <polygon key={i} points={p.pts} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} opacity={p.alpha} strokeLinejoin="round" />
      ))}
  </>
);

/** squash-landing curve: fast ease-in fall + damped bounce (lowpoly/iso arrivals); returns {rise, sy} */
export const dropIn = (lt: number, dur = 10, height = 6) => {
  if (lt < 0) return {rise: height, sy: 1, on: false};
  const s = lt / 30;
  const k = cl(lt / dur);
  const rise = height * (1 - ei3(k));
  const after = Math.max(0, s - dur / 30);
  const sy = lt < dur ? 1 : 1 - 0.16 * Math.exp(-12 * after) * Math.cos(26 * after);
  return {rise, sy, on: true};
};
