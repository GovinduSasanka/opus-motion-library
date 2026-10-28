/**
 * r2-mg1-kit — shared helpers for the MG1 group (techniques from the mg-styles-15 films: 05 cel-boil, 03 isometric,
 * 01 flat-vector, 02 line-art, 04 3d-render, 08 morph, 19 paperclip, 22 hud).
 *
 * Parts of this file are adapted from mg-styles-15 (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md:
 *  - ink engine (spline / resample / boil / outline / inkW / inkLoop / hatch) after demos/05-cel-boil/js/engine.js
 *  - exposure sheet after demos/05-cel-boil/js/scene.js (SCHED / drawing)
 * Everything is rewritten as pure, frame-driven TypeScript that returns SVG path strings (no canvas, no Math.random).
 */
import React from 'react';
import {noise3D} from '@remotion/noise';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useVideoConfig} from 'remotion';
import {loadFont as fredoka} from '@remotion/google-fonts/Fredoka';
import {loadFont as unbounded} from '@remotion/google-fonts/Unbounded';
import {loadFont as outfit} from '@remotion/google-fonts/Outfit';
import {loadFont as chakra} from '@remotion/google-fonts/ChakraPetch';
import {loadFont as dmSans} from '@remotion/google-fonts/DMSans';

/** extra font roles for this group (loaded once) */
export const mg1Fonts = {
  /** rounded geometric display (flat-vector logotypes, candy type) */
  rounded: fredoka('normal', {weights: ['500', '600', '700'], subsets: ['latin']}).fontFamily,
  /** extra-bold wide display for iso titles */
  wide: unbounded('normal', {weights: ['700', '800'], subsets: ['latin']}).fontFamily,
  /** clean geometric sans (morph wordmarks) */
  geo: outfit('normal', {weights: ['400', '600', '700'], subsets: ['latin']}).fontFamily,
  /** squared tech display (HUD numerals, banners) */
  tech: chakra('normal', {weights: ['500', '600', '700'], subsets: ['latin']}).fontFamily,
  /** tracked tagline sans */
  dm: dmSans('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily,
};

// =================================================================================================================
// small maths
// =================================================================================================================
export type IP = [number, number, number?]; // point with optional corner flag
export type P2 = [number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => clamp01((x - a) / (b - a));
export const sstep = (a: number, b: number, x: number) => {
  const t = inv(a, b, x);
  return t * t * (3 - 2 * t);
};
/** FNV-style hash of numbers -> [0,1) */
export const hs = (...a: number[]) => {
  let h = 2166136261 >>> 0;
  for (const v of a) {
    h = Math.imul(h ^ ((Math.round(v * 997) | 0) >>> 0), 16777619) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995) >>> 0;
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};
export const hr = (a: number, b: number, ...s: number[]) => a + (b - a) * hs(...s);
export const E = {
  out2: (t: number) => 1 - (1 - t) * (1 - t),
  out3: (t: number) => 1 - Math.pow(1 - t, 3),
  in2: (t: number) => t * t,
  io2: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  io3: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t: number, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
/** piecewise keys [[t, v, ease?]] (ease applies to the segment ending at that key) */
export const K = (t: number, keys: [number, number, ((u: number) => number)?][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const u = (t - t0) / Math.max(1e-9, t1 - t0);
      return v0 + (v1 - v0) * (e ?? E.io2)(u);
    }
  }
  return keys[keys.length - 1][1];
};
/** damped spring 0 -> 1 (f Hz, zeta) at time t seconds; pinned to 1 after `pin` s */
export const springT = (t: number, f = 2.4, z = 0.42, pin = 99) => {
  if (t <= 0) return 0;
  if (t >= pin) return 1;
  const w = 2 * Math.PI * f;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
};
export const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = clamp01(t);
  const c = (i: number) => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0');
  return `#${c(0)}${c(1)}${c(2)}`;
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${clamp01(a)})`;
};

// =================================================================================================================
// INK ENGINE (05 cel-boil) — tapered, pressure-varying, boiling brush ink as filled SVG polygons
// Work in "design units" (1 du = 1 px at 1080p short side) and scale the group by u.
// =================================================================================================================
const crp = (p0: IP, p1: IP, p2: IP, p3: IP, t: number): P2 => {
  const d = (p: IP, q: IP) => Math.sqrt(Math.hypot(q[0] - p[0], q[1] - p[1])) + 1e-4;
  const t0 = 0;
  const t1 = d(p0, p1);
  const t2 = t1 + d(p1, p2);
  const t3 = t2 + d(p2, p3);
  const tt = t1 + (t2 - t1) * t;
  const L = (a: P2 | IP, b: P2 | IP, ta: number, tb: number): P2 => {
    const w = (tt - ta) / (tb - ta);
    return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
  };
  const A1 = L(p0, p1, t0, t1);
  const A2 = L(p1, p2, t1, t2);
  const A3 = L(p2, p3, t2, t3);
  const B1 = L(A1, A2, t0, t2);
  const B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
};
/** centripetal Catmull-Rom through control points (corner flag at index 2 = sharp corner) */
export const spline = (P: IP[], closed = false, step = 5): P2[] => {
  const n = P.length;
  if (n < 2) return P.map((p) => [p[0], p[1]]);
  const out: P2[] = [];
  const segN = closed ? n : n - 1;
  for (let i = 0; i < segN; i++) {
    const p1 = P[i];
    const p2 = P[(i + 1) % n];
    let p0 = closed ? P[(i - 1 + n) % n] : i - 1 < 0 ? p1 : P[i - 1];
    let p3 = closed ? P[(i + 2) % n] : i + 2 >= n ? p2 : P[i + 2];
    if (p1[2]) p0 = p1;
    if (p2[2]) p3 = p2;
    const dd = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const m = Math.max(1, Math.ceil(dd / step));
    for (let k = 0; k < m; k++) out.push(crp(p0, p1, p2, p3, k / m));
  }
  if (!closed) out.push([P[n - 1][0], P[n - 1][1]]);
  return out;
};
export const arclen = (pts: P2[], closed = false) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  if (closed && pts.length > 1) L.push(L[L.length - 1] + Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]));
  return L;
};
export const resample = (pts: P2[], step = 3.5, closed = false): P2[] => {
  const src = closed ? [...pts, pts[0]] : pts;
  const L = arclen(src);
  const tot = L[L.length - 1];
  if (tot < 1e-6) return [[src[0][0], src[0][1]]];
  const n = Math.max(2, Math.round(tot / step));
  const out: P2[] = [];
  let j = 1;
  const N = closed ? n : n + 1;
  for (let i = 0; i < N; i++) {
    const s = (tot * i) / n;
    while (j < L.length - 1 && L[j] < s) j++;
    const a = src[j - 1];
    const b = src[j];
    const u = (s - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1]);
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
};
/** prefix of an open polyline by fraction of its length */
export const prefix = (pts: P2[], frac: number): P2[] => {
  if (frac >= 1) return pts;
  const L = arclen(pts);
  const s = L[L.length - 1] * Math.max(0, frac);
  const out: P2[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= s) {
      out.push(pts[i]);
      continue;
    }
    const u = (s - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]);
    out.push([lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]);
    break;
  }
  return out;
};
/** affine: scale about origin, shear kx, rotate r, translate */
export const xf = (P: IP[], o: {x?: number; y?: number; r?: number; sx?: number; sy?: number; kx?: number}): IP[] => {
  const {x = 0, y = 0, r = 0, sx = 1, sy = 1, kx = 0} = o;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return P.map((p) => {
    let px = p[0] * sx;
    const py = p[1] * sy;
    px += kx * -py;
    return [x + px * c - py * s, y + px * s + py * c, p[2]];
  });
};
export const circlePts = (cx: number, cy: number, r: number, n = 0, rx: number | null = null): IP[] => {
  n = n || Math.max(10, Math.round((2 * Math.PI * r) / 5));
  const out: IP[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([cx + (rx ?? r) * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
};
/** densify a polygon (straight edges) for boiling */
export const dens = (P: P2[], step = 6, closed = true): P2[] => {
  const out: P2[] = [];
  const n = P.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = P[i];
    const b = P[(i + 1) % n];
    const m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < m; k++) out.push([lerp(a[0], b[0], k / m), lerp(a[1], b[1], k / m)]);
  }
  if (!closed) out.push(P[n - 1]);
  return out;
};

/** world-space simplex boil, re-rolled by seed (neighbours wobble coherently) */
export const boilPts = (pts: P2[], seed: number, amp = 2.4, scale = 70): P2[] => {
  if (!amp) return pts.map((p) => [p[0], p[1]]);
  const z = seed * 2.371 + 0.5;
  return pts.map(([x, y]) => [x + amp * noise3D('mg1ink', x / scale, y / scale, z), y + amp * noise3D('mg1ink', x / scale + 41.3, y / scale - 17.9, z)]);
};

type WFn = (u: number, s: number, i: number, tx: number, ty: number) => number;
/** variable-width outline polygon with round caps */
export const outline = (pts: P2[], wfn: WFn, caps = true): P2[] => {
  const n = pts.length;
  if (n < 2) return [];
  const L = arclen(pts);
  const tot = L[n - 1] || 1;
  const Lp: P2[] = [];
  const Rp: P2[] = [];
  let w0 = 0;
  let wN = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const w = Math.max(0, wfn(L[i] / tot, L[i], i, tx, ty)) / 2;
    if (i === 0) w0 = w;
    if (i === n - 1) wN = w;
    Lp.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
    Rp.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }
  const poly: P2[] = [...Lp];
  const cap = (c: P2, a0: number, w: number) => {
    if (w < 0.6 || !caps) return;
    for (let k = 1; k < 8; k++) {
      const a = a0 - (Math.PI * k) / 8;
      poly.push([c[0] + Math.cos(a) * w, c[1] + Math.sin(a) * w]);
    }
  };
  {
    const a = pts[n - 2];
    const b = pts[n - 1];
    cap(b, Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2, wN);
  }
  for (let i = n - 1; i >= 0; i--) poly.push(Rp[i]);
  {
    const a = pts[0];
    const b = pts[1];
    cap(a, Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2, w0);
  }
  return poly;
};
export const polyD = (poly: P2[], close = true) =>
  poly.length ? 'M' + poly.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + (close ? 'Z' : '') : '';

export type InkOpts = {
  w?: number;
  seed?: number;
  t0?: number;
  t1?: number;
  jit?: number;
  min?: number;
  heavy?: number;
  lx?: number;
  ly?: number;
  amp?: number;
  scale?: number;
  step?: number;
  dense?: boolean;
  caps?: boolean;
  taper?: boolean;
  /** 0..1 draw-on fraction */
  draw?: number;
};
/** hand-ink width profile: taper in/out + pressure noise + heavier on the light's shadow side */
export const inkW = (o: InkOpts & {tot?: number}): WFn => {
  const {w = 6, seed = 1, t0 = 14, t1 = 26, jit = 0.35, min = 0.25, heavy = 0.35, lx = 0.55, ly = 0.83, tot, taper = true} = o;
  return (_u, s, _i, tx, ty) => {
    let k = 1 + jit * noise3D('mg1w', s / 60, seed * 1.37, 3.1);
    k *= 1 + heavy * Math.max(0, ty * lx + -tx * ly);
    if (taper && tot) {
      const a = sstep(0, t0, s);
      const b = sstep(0, t1, tot - s);
      k *= min + (1 - min) * Math.min(a, b);
    }
    return w * k;
  };
};
/** open ink stroke from control points -> filled outline d */
export const inkStroke = (P: IP[], o: InkOpts = {}): string => {
  const {seed = 1, amp = 2.2, scale = 70, step = 5, dense = false, draw = 1} = o;
  if (draw <= 0) return '';
  let pts: P2[] = dense ? (P as P2[]) : spline(P, false, step);
  pts = resample(pts, 3.2);
  if (draw < 1) pts = prefix(pts, draw);
  if (pts.length < 2) return '';
  pts = boilPts(pts, seed, amp, scale);
  const tot = arclen(pts)[pts.length - 1];
  return polyD(outline(pts, inkW({...o, tot}), o.caps ?? true));
};
/** closed loop inked as 1–2 overlapping tapered pen strokes -> list of d */
export const inkLoop = (dense: P2[], o: InkOpts & {splits?: number; overlap?: number; overshoot?: number} = {}): string[] => {
  const {seed = 1, amp = 2.2, scale = 70, splits = 1, overlap = 0.05, overshoot = 2.5, draw = 1} = o;
  const pts = boilPts(resample(dense, 3.2, true), seed, amp, scale);
  const n = pts.length;
  if (n < 6 || draw <= 0) return [];
  let A = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    A += p[0] * q[1] - q[0] * p[1];
  }
  const sgn = A > 0 ? 1 : -1;
  const s0 = Math.floor(hs(seed, 7) * n);
  const cuts: number[] = [];
  for (let k = 0; k < splits; k++) cuts.push(Math.floor(s0 + (n * k) / splits + (hs(seed, 9, k) - 0.5) * n * 0.15));
  const out: string[] = [];
  for (let k = 0; k < splits; k++) {
    const a = cuts[k];
    const b = k + 1 < splits ? cuts[k + 1] : cuts[0] + n;
    const ext = Math.max(2, Math.floor(n * overlap));
    let seg: P2[] = [];
    for (let j = a; j <= b + ext; j++) {
      const p = pts[((j % n) + n) % n];
      if (j > b) {
        const q = pts[(((j + 1) % n) + n) % n];
        const r0 = pts[(((j - 1) % n) + n) % n];
        let tx = q[0] - r0[0];
        let ty = q[1] - r0[1];
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl;
        ty /= tl;
        const off = ((j - b) / ext) * overshoot * sgn;
        seg.push([p[0] - ty * off, p[1] + tx * off]);
      } else seg.push(p);
    }
    if (draw < 1) {
      // draw-on: strokes fill in sequence
      const local = clamp01(draw * splits - k);
      if (local <= 0) continue;
      seg = prefix(seg, local);
      if (seg.length < 2) continue;
    }
    const tot = arclen(seg)[seg.length - 1];
    const wf = inkW({...o, seed: seed + k * 13, tot, t0: o.t0 ?? 10, t1: o.t1 ?? 22});
    const wf2: WFn = sgn > 0 ? wf : (u, s, i, tx, ty) => wf(u, s, i, -tx, -ty);
    out.push(polyD(outline(seg, wf2)));
  }
  return out;
};
/** flat fill of a closed shape, boiled independently and off-register */
export const fillShape = (dense: P2[], o: {seed?: number; amp?: number; scale?: number; dx?: number; dy?: number} = {}): string => {
  const {seed = 1, amp = 2.2, scale = 70, dx = 0, dy = 0} = o;
  let pts = boilPts(dense, seed + 0.5, amp, scale);
  if (dx || dy) pts = pts.map((p) => [p[0] + dx, p[1] + dy]);
  return polyD(pts);
};
/** hatch strokes across a polygon's bbox (clip them with the polygon in SVG) */
export const hatchStrokes = (clipPoly: P2[], o: {seed?: number; gap?: number; ang?: number; w?: number; amp?: number; jitter?: number} = {}): string[] => {
  const {seed = 1, gap = 14, ang = -0.9, w = 2.2, amp = 1.6, jitter = 0.35} = o;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  let bx0 = Infinity;
  let by0 = Infinity;
  let bx1 = -Infinity;
  let by1 = -Infinity;
  for (const p of clipPoly) {
    bx0 = Math.min(bx0, p[0]);
    by0 = Math.min(by0, p[1]);
    bx1 = Math.max(bx1, p[0]);
    by1 = Math.max(by1, p[1]);
  }
  const R = Math.hypot(bx1 - bx0, by1 - by0) / 2 + 10;
  const mx = (bx0 + bx1) / 2;
  const my = (by0 + by1) / 2;
  const out: string[] = [];
  let k = 0;
  for (let d = -R; d <= R; d += gap, k++) {
    const off = d + (hs(seed, k) - 0.5) * gap * jitter;
    const px = mx - s * off;
    const py = my + c * off;
    out.push(
      inkStroke(
        [
          [px - c * R * 1.1, py - s * R * 1.1],
          [px + c * R * 1.1, py + s * R * 1.1],
        ],
        {seed: seed * 31 + k, amp, w: w * (0.8 + 0.4 * hs(seed, k, 2)), t0: 8, t1: 8, jit: 0.3, heavy: 0},
      ),
    );
  }
  return out;
};

// =================================================================================================================
// EXPOSURE SHEET (ones / twos / threes) — `[fromFrame, toFrame, step]` rows at 30 fps
// =================================================================================================================
export type ExpRow = [number, number, number];
/** quantised frame `fq` (feed every curve with it), drawing id (seed the boil with it), current step */
export const exposure = (f: number, sched: ExpRow[], fallbackStep = 2) => {
  let id = 0;
  for (const [a, b, step] of sched) {
    if (f < b) {
      if (f < a) break;
      const k = Math.floor((f - a) / step);
      return {fq: a + k * step, id: id + k, step};
    }
    id += Math.ceil((b - a) / step);
  }
  const last = sched.length ? sched[sched.length - 1][1] : 0;
  const k = Math.floor((f - last) / fallbackStep);
  return {fq: f < last ? f : last + k * fallbackStep, id: id + Math.max(0, k), step: fallbackStep};
};

// =================================================================================================================
// CEL LOOK: paper, stepped light pool, slate labels, sparkle, speed lines
// =================================================================================================================
export const CEL = {
  ink: '#1C1613',
  red: '#E5402B',
  yel: '#FFC425',
  cream: '#F4E9D0',
  hi: '#FFF6E2',
  pencil: '#D9573F',
  pool: '#F7E4A6',
  pool2: '#F1D98E',
  dark: '#2A1E1A',
};
/** paper sheet: cream base + fibre tooth re-seeded per drawing (every cel is a new sheet) */
export const CelPaper: React.FC<{w: number; h: number; color: string; drawing: number; id: string; tooth?: number}> = ({w, h, color, drawing, id, tooth = 0.5}) => {
  const seed = (drawing % 4) + 3;
  const fid = `${id}-tooth${seed}`;
  return (
    <g>
      <rect width={w} height={h} fill={color} />
      <filter id={fid} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={0.75} numOctaves={3} seed={seed} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.22  0 0 0 -1.6 1.05" />
      </filter>
      <rect width={w} height={h} filter={`url(#${fid})`} opacity={tooth * 0.55} style={{mixBlendMode: 'multiply'}} />
      <filter id={`${fid}b`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={0.012} numOctaves={2} seed={seed + 11} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0.9 -0.35" />
      </filter>
      <rect width={w} height={h} filter={`url(#${fid}b)`} opacity={tooth * 0.5} style={{mixBlendMode: 'multiply'}} />
    </g>
  );
};
/** stepped (not gradient) glow pool with scalloped, boiling edge */
export const LightPool: React.FC<{x: number; y: number; r: number; seed: number; colors?: [string, string]; amp?: number}> = ({x, y, r, seed, colors = [CEL.pool2, CEL.pool], amp = 6}) => {
  const ring = (rr: number, k: number) => {
    const P: P2[] = [];
    const n = 64;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const sc = 1 + 0.025 * Math.sin(a * 9 + k) + 0.015 * Math.sin(a * 5 + seed);
      P.push([x + Math.cos(a) * rr * sc, y + Math.sin(a) * rr * sc]);
    }
    return fillShape(P, {seed: seed + k * 7, amp, scale: 120});
  };
  return (
    <g>
      <path d={ring(r * 1.18, 1)} fill={colors[1]} opacity={0.55} />
      <path d={ring(r, 2)} fill={colors[0]} opacity={0.7} />
    </g>
  );
};
/** four-point twinkle (ink rim + highlight fill) */
export const Twinkle: React.FC<{x: number; y: number; R: number; seed: number; fill?: string; ink?: string; lw?: number}> = ({x, y, R, seed, fill = CEL.yel, ink = CEL.ink, lw = 2.6}) => {
  const P: IP[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? R * 0.28 : R * (i % 4 === 0 ? 1 : 0.8);
    P.push([x + Math.cos(a) * r, y + Math.sin(a) * r, i % 2 ? 0 : 1]);
  }
  const d = spline(P, true, 2);
  return (
    <g>
      <path d={fillShape(d, {seed, amp: 0.8})} fill={fill} />
      {inkLoop(d, {seed: seed + 1, w: lw, amp: 0.8, t0: 3, t1: 6}).map((dd, i) => (
        <path key={i} d={dd} fill={ink} />
      ))}
    </g>
  );
};
/** ink speed lines (tapered dashes) along a direction; returns d list */
export const speedLineDs = (x: number, y: number, dir: number, n: number, len: number, spread: number, seed: number, w = 4.2) => {
  const out: string[] = [];
  const c = Math.cos(dir);
  const s = Math.sin(dir);
  for (let k = 0; k < n; k++) {
    const off = (k - (n - 1) / 2) * (spread / Math.max(1, n - 1)) + (hs(seed, k) - 0.5) * spread * 0.15;
    const L = len * (0.6 + 0.5 * hs(seed, k, 3));
    const back = len * 0.15 * hs(seed, k, 2);
    const x0 = x - s * off - c * back;
    const y0 = y + c * off - s * back;
    out.push(
      inkStroke(
        [
          [x0 - c * L, y0 - s * L],
          [x0, y0],
        ],
        {seed: seed + 50 + k, w, t0: L * 0.6, t1: 8, min: 0.05, amp: 1.2, heavy: 0},
      ),
    );
  }
  return out;
};

// =================================================================================================================
// FLAME SPIRIT (original design: plump three-tongue flame, dot eyes, rubber-hose arms, white gloves)
// =================================================================================================================
export type FlameEyes = 'open' | 'closed' | 'happy' | 'squeeze' | 'wink' | 'sleepy' | 'fierce';
export type FlameMouth = 'smile' | 'o' | 'grin' | 'flat' | 'none';
export type FlameFace = {eyes?: FlameEyes; mouth?: FlameMouth; look?: number; lookY?: number; cheeks?: boolean; pop?: number};
export type FlameArm = {ang: number; len?: number; bend?: number; big?: number};
export type FlameState = {
  x: number;
  y: number;
  H: number;
  sx?: number;
  sy?: number;
  kx?: number;
  curl?: number;
  r?: number;
  seed: number;
  wild?: number;
  lick?: number;
  face?: FlameFace | null;
  arms?: {L?: FlameArm; R?: FlameArm} | null;
  smearUp?: boolean;
  drops?: boolean;
};
export type FlameColors = {outer: string; inner: string; ink: string; hi: string; cheek: string};
export const FLAME_COLORS: FlameColors = {outer: CEL.red, inner: CEL.yel, ink: CEL.ink, hi: CEL.hi, cheek: '#F2766A'};

const flameOuter = (seed: number, wild = 0.15, lick = 1): IP[] => {
  const j = (k: number, a: number) => (hs(seed, k) - 0.5) * 2 * a;
  const L = (k: number, a: number) => j(k, a + wild * 0.3) * lick;
  return [
    [0, 0.02],
    [0.3, -0.015],
    [0.47, -0.17],
    [0.49, -0.38],
    [0.4 + L(1, 0.02), -0.56],
    [0.43 + L(2, 0.03), -0.78 + L(3, 0.04), 1],
    [0.22, -0.6 + j(4, 0.03)],
    [0.08 + L(5, 0.03), -1.0 + L(6, 0.04), 1],
    [-0.12, -0.68 + j(7, 0.03)],
    [-0.38 + L(8, 0.03), -0.72 + L(9, 0.04), 1],
    [-0.45, -0.5],
    [-0.5, -0.28],
    [-0.36, -0.05],
  ];
};
const flameInner = (seed: number, wild: number): IP[] => {
  const j = (k: number, a: number) => (hs(seed, k + 20) - 0.5) * 2 * a;
  return [
    [0, 0.0],
    [0.26, -0.05],
    [0.35, -0.2],
    [0.3, -0.38],
    [0.06 + j(1, 0.04 + wild * 0.1), -0.66 + j(2, 0.04), 1],
    [-0.28, -0.4],
    [-0.36, -0.2],
    [-0.25, -0.04],
  ];
};
/** unit space -> stage: shear + curl (top bends more) + squash/stretch about the base + rotation */
export const flameXf = (P: IP[], s: FlameState): IP[] => {
  const Hh = s.H;
  const c = Math.cos(s.r ?? 0);
  const sn = Math.sin(s.r ?? 0);
  return P.map(([x, y, cr]) => {
    const up = -y;
    let X = x * Hh * (s.sx ?? 1);
    const Y = y * Hh * (s.sy ?? 1);
    X += ((s.kx ?? 0) * up + (s.curl ?? 0) * up * up) * Hh;
    return [s.x + X * c - Y * sn, s.y + X * sn + Y * c, cr];
  });
};
const fpt = (s: FlameState, x: number, y: number) => flameXf([[x, y]], s)[0];

export const FlameSpirit: React.FC<{s: FlameState; colors?: Partial<FlameColors>; reg?: [number, number]; amp?: number}> = ({s, colors, reg = [-5, 4], amp = 1}) => {
  if (!s || s.H < 3) return null;
  const C = {...FLAME_COLORS, ...colors};
  const sd = s.seed;
  const wild = s.wild ?? 0.12;
  const out: React.ReactNode[] = [];
  let key = 0;
  const P = (d: string, fill: string, op = 1) => {
    if (d) out.push(<path key={key++} d={d} fill={fill} opacity={op} />);
  };
  const lw = Math.max(2.4, Math.min(7, s.H * 0.026));
  if (s.smearUp) {
    for (let k = 0; k < 5; k++) {
      const x = s.x + (k - 2) * s.H * 0.11 + (hs(sd, k) - 0.5) * 10;
      const y0 = s.y + 10 + hs(sd, k, 2) * 30;
      const Ln = s.H * (0.45 + 0.5 * hs(sd, k, 3));
      P(
        inkStroke(
          [
            [x, y0 + Ln],
            [x, y0],
          ],
          {seed: sd + 200 + k, w: 4.5, t0: 60, t1: 8, min: 0.05, amp, heavy: 0},
        ),
        C.ink,
      );
    }
  }
  const outer = spline(flameXf(flameOuter(sd, wild, s.lick ?? 1), s), true, 4);
  const inner = spline(flameXf(flameInner(sd, wild).map(([x, y, k]) => [x, y * 0.98 - 0.02, k] as IP), s), true, 4);
  // detached lick that rises and vanishes on a 3-drawing cycle
  const dph = Math.abs(Math.round(sd)) % 3;
  if (s.drops !== false && s.H > 100 && dph !== 2) {
    const k = dph * 0.8;
    const hx = (dph ? 0.12 : -0.1) + (hs(sd, 92) - 0.5) * 0.08;
    const up = 1.1 + k * 0.28;
    const sz = 1 - k * 0.6;
    const D: IP[] = (
      [
        [0, 0.06],
        [0.05, 0.0],
        [0, -0.13, 1],
        [-0.05, 0.0],
      ] as IP[]
    ).map(([x, y, cr]) => [hx + x * sz, -up + y * sz, cr]);
    const dd = spline(flameXf(D, s), true, 3);
    P(fillShape(dd, {seed: sd + 3, amp, dx: reg[0] * 0.5, dy: reg[1] * 0.5}), C.outer);
    inkLoop(dd, {seed: sd + 4, w: Math.min(3.2, s.H * 0.016), amp, t0: 3, t1: 6}).forEach((d) => P(d, C.ink));
  }
  P(fillShape(outer, {seed: sd * 2, amp: 1.8 * amp, dx: reg[0], dy: reg[1]}), C.outer);
  P(fillShape(inner, {seed: sd * 2 + 1, amp: 1.6 * amp, dx: reg[0], dy: reg[1]}), C.inner);
  if (s.H > 60) {
    const g = flameXf(
      [
        [-0.24, -0.15],
        [-0.27, -0.27],
        [-0.22, -0.39],
      ],
      s,
    );
    P(inkStroke(g, {seed: sd + 8, w: Math.max(3, s.H * 0.035), t0: 6, t1: 12, amp, heavy: 0}), C.hi);
  }
  inkLoop(outer, {seed: sd * 2 + 2, w: lw, amp: 1.8 * amp, splits: 2, heavy: 0.45, t0: 10, t1: 20}).forEach((d) => P(d, C.ink));
  // face
  const f = s.face;
  if (f) {
    const lx = (f.look ?? 0) * 0.05;
    const ly = (f.lookY ?? 0) * 0.03;
    const ex = 0.11;
    const ey = -0.36;
    const eyeRX = 0.045;
    const eyeRY = 0.074 * (f.pop ?? 1);
    for (const side of [-1, 1]) {
      const cx = side * ex + lx;
      const cy = ey + ly;
      const mode = f.eyes ?? 'open';
      const st = (pts: IP[], ww = lw * 0.9) => P(inkStroke(flameXf(pts, s), {seed: sd + 40 + side, w: ww, t0: 3, t1: 3, amp: 0.7 * amp, heavy: 0}), C.ink);
      if (mode === 'open' || mode === 'fierce' || (mode === 'wink' && side < 0)) {
        if (mode === 'fierce')
          st(
            [
              [cx + side * eyeRX * 1.6, cy - 0.12],
              [cx - side * eyeRX * 1.1, cy - 0.07],
            ],
            lw,
          );
        const d = spline(flameXf(circlePts(cx, cy, eyeRY, 18, eyeRX * (f.pop ?? 1)), s), true, 3);
        P(fillShape(d, {seed: sd + 30 + side, amp: 0.8 * amp}), C.ink);
        const g = fpt(s, cx - eyeRX * 0.35, cy - eyeRY * 0.45);
        out.push(<circle key={key++} cx={g[0]} cy={g[1]} r={Math.max(1.6, s.H * 0.013)} fill={C.hi} />);
      } else if (mode === 'closed' || mode === 'wink') {
        st([
          [cx - eyeRX * 1.1, cy + 0.01],
          [cx, cy + 0.025],
          [cx + eyeRX * 1.1, cy + 0.01],
        ]);
      } else if (mode === 'sleepy') {
        st([
          [cx - eyeRX * 1.2, cy + 0.02],
          [cx, cy + 0.045],
          [cx + eyeRX * 1.2, cy + 0.02],
        ]);
      } else if (mode === 'happy') {
        st([
          [cx - eyeRX * 1.2, cy + 0.02],
          [cx, cy - 0.04],
          [cx + eyeRX * 1.2, cy + 0.02],
        ]);
      } else if (mode === 'squeeze') {
        const k = side < 0 ? 1 : -1;
        st([
          [cx - eyeRX * k, cy - 0.035],
          [cx + eyeRX * k * 0.9, cy],
          [cx - eyeRX * k, cy + 0.035],
        ]);
      }
    }
    const m = f.mouth ?? 'smile';
    const my = -0.235 + ly * 0.6;
    const mx = lx * 0.8;
    if (m === 'smile') {
      P(
        inkStroke(
          flameXf(
            [
              [mx - 0.06, my - 0.01],
              [mx, my + 0.028],
              [mx + 0.06, my - 0.01],
            ],
            s,
          ),
          {seed: sd + 50, w: lw * 0.85, t0: 3, t1: 3, amp: 0.7 * amp, heavy: 0},
        ),
        C.ink,
      );
    } else if (m === 'flat') {
      P(
        inkStroke(
          flameXf(
            [
              [mx - 0.045, my],
              [mx + 0.045, my],
            ],
            s,
          ),
          {seed: sd + 54, w: lw * 0.8, t0: 3, t1: 3, amp: 0.6 * amp, heavy: 0},
        ),
        C.ink,
      );
    } else if (m === 'o' || m === 'grin') {
      const pts: IP[] =
        m === 'o'
          ? circlePts(mx, my + 0.005, 0.03, 14, 0.024)
          : [
              [mx - 0.075, my - 0.02],
              [mx + 0.075, my - 0.02],
              [mx + 0.05, my + 0.04],
              [mx, my + 0.06],
              [mx - 0.05, my + 0.04],
            ];
      P(fillShape(spline(flameXf(pts, s), true, 3), {seed: sd + 52, amp: 0.7 * amp}), C.ink);
      if (m === 'grin') P(fillShape(spline(flameXf(circlePts(mx + 0.01, my + 0.035, 0.016, 12, 0.026), s), true, 3), {seed: sd + 53, amp: 0.5 * amp}), C.outer);
    }
    if (f.cheeks) {
      for (const side of [-1, 1]) {
        const d = spline(flameXf(circlePts(side * 0.21 + lx, -0.27, 0.024, 12, 0.042), s), true, 3);
        P(fillShape(d, {seed: sd + 60 + side, amp: 0.5 * amp}), C.cheek);
      }
    }
  }
  // rubber-hose arms with white gloves
  const A = s.arms;
  if (A) {
    for (const side of [-1, 1]) {
      const a = side < 0 ? A.L : A.R;
      if (!a) continue;
      const sh: IP = [side * 0.42, -0.34];
      const ang = a.ang;
      const len = a.len ?? 0.42;
      const dx = side * Math.cos(ang);
      const dy = -Math.sin(ang);
      const bx = -dy * (a.bend ?? 0.3) * side;
      const by = dx * (a.bend ?? 0.3) * side;
      const mid: IP = [sh[0] + dx * len * 0.5 + bx * len * 0.35, sh[1] + dy * len * 0.5 + by * len * 0.35];
      const hand: IP = [sh[0] + dx * len, sh[1] + dy * len];
      const s2 = {...s, sx: ((s.sx ?? 1) + 1) / 2, sy: ((s.sy ?? 1) + 1) / 2};
      const AP = flameXf([sh, mid, hand], s2);
      P(inkStroke(AP, {seed: sd + 70 + side, w: lw * 1.05, t0: 4, t1: 2, min: 0.6, jit: 0.2, amp, heavy: 0}), C.ink);
      const hp = AP[2];
      const R = s.H * 0.08 * (a.big ?? 1);
      const g = circlePts(hp[0], hp[1], R, 16, R * 1.08) as P2[];
      P(fillShape(g, {seed: sd + 80 + side, amp, dx: reg[0] * 0.5, dy: reg[1] * 0.5}), C.hi);
      inkLoop(g, {seed: sd + 82 + side, w: lw * 0.9, amp, t0: 4, t1: 8}).forEach((d) => P(d, C.ink));
      const fa = Math.atan2(AP[2][1] - AP[1][1], AP[2][0] - AP[1][0]);
      for (const k of [-1, 1]) {
        const a0 = fa + k * 0.35;
        P(
          inkStroke(
            [
              [hp[0] + Math.cos(a0) * R * 0.2, hp[1] + Math.sin(a0) * R * 0.2],
              [hp[0] + Math.cos(a0) * R * 0.8, hp[1] + Math.sin(a0) * R * 0.8],
            ],
            {seed: sd + 90 + k + side * 3, w: lw * 0.55, t0: 2, t1: 3, amp: 0.5, heavy: 0},
          ),
          C.ink,
        );
      }
    }
  }
  return <g>{out}</g>;
};

/** a plain hand-inked box stage (top face + front + band + hatched cast shadow). x,y = left-front-top corner */
export const InkBox: React.FC<{x: number; y: number; w: number; h: number; depth: number; seed: number; top?: string; front?: string; band?: string; ink?: string; amp?: number}> = ({
  x,
  y,
  w,
  h,
  depth,
  seed,
  top = CEL.red,
  front = CEL.yel,
  band = CEL.ink,
  ink = CEL.ink,
  amp = 1,
}) => {
  const dx = depth * 0.35;
  const T: P2[] = [
    [x, y],
    [x + w, y],
    [x + w + dx, y - depth],
    [x + dx, y - depth],
  ];
  const F: P2[] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  const S: P2[] = [
    [x + w, y],
    [x + w + dx, y - depth],
    [x + w + dx, y + h - depth],
    [x + w, y + h],
  ];
  const B: P2[] = [
    [x + w * 0.05, y + h * 0.3],
    [x + w * 0.95, y + h * 0.3],
    [x + w * 0.95, y + h * 0.78],
    [x + w * 0.05, y + h * 0.78],
  ];
  const sh: P2[] = [
    [x + w * 0.1, y + h],
    [x + w + dx * 1.6, y + h],
    [x + w + dx * 2.6, y + h + depth * 0.45],
    [x + w * 0.3, y + h + depth * 0.45],
  ];
  const cid = `mg1-inkbox-${seed}-${Math.round(x)}`;
  const reg: [number, number] = [-5, 4];
  const edges: [P2, P2][] = [
    [T[3], T[2]],
    [T[0], T[1]],
    [T[0], T[3]],
    [T[1], T[2]],
    [F[1], F[2]],
    [F[0], F[3]],
    [F[3], F[2]],
    [S[1], S[2]],
    [S[2], S[3]],
  ];
  return (
    <g>
      <clipPath id={cid}>
        <path d={polyD(sh)} />
      </clipPath>
      <g clipPath={`url(#${cid})`}>
        {hatchStrokes(sh, {seed: seed + 5, gap: 13, ang: -0.95, w: 2}).map((d, i) => (
          <path key={i} d={d} fill={ink} opacity={0.8} />
        ))}
      </g>
      <path d={fillShape(dens(F, 8), {seed, amp: 1.8 * amp, dx: reg[0], dy: reg[1]})} fill={front} />
      <path d={fillShape(dens(S, 8), {seed: seed + 1, amp: 1.8 * amp, dx: reg[0], dy: reg[1]})} fill={mixHex(top, '#000000', 0.12)} />
      <path d={fillShape(dens(T, 8), {seed: seed + 2, amp: 1.8 * amp, dx: reg[0], dy: reg[1]})} fill={top} />
      <path d={fillShape(dens(B, 8), {seed: seed + 3, amp: 1.4 * amp})} fill={band} />
      {Array.from({length: 26}, (_, i) => (
        <circle key={'sp' + i} cx={lerp(B[0][0] + 8, B[1][0] - 8, hs(seed, i, 1))} cy={lerp(B[0][1] + 6, B[2][1] - 6, hs(seed, i, 2))} r={1.3 + hs(seed, i, 3) * 1.4} fill={CEL.hi} opacity={0.75} />
      ))}
      {edges.map(([a, b], i) => (
        <path key={'e' + i} d={inkStroke([a, b], {seed: seed * 7 + i, w: 5.2, amp: 1.6 * amp, t0: 10, t1: 18})} fill={ink} />
      ))}
    </g>
  );
};

/** production slate: scene id top-left, exposure + drawing number bottom-right (red pencil) */
export const Slate: React.FC<{W: number; H: number; scene: string; drawing: number; step: number; color?: string; font: string; offset?: number}> = ({
  W,
  H,
  scene,
  drawing,
  step,
  color = CEL.pencil,
  font,
  offset = 0,
}) => (
  <g fontFamily={font} fill={color} fontWeight={700}>
    <text x={60} y={84} fontSize={32} opacity={0.85}>
      {scene}
    </text>
    <text x={W - 60} y={H - 92} fontSize={22} textAnchor="end" opacity={0.8}>
      on {step}s
    </text>
    <text x={W - 60} y={H - 56} fontSize={38} textAnchor="end" opacity={0.9}>
      No. {String(drawing + offset).padStart(3, '0')}
    </text>
  </g>
);

// =================================================================================================================
// ISO DIORAMA (03 isometric) — map-driven pastel miniature city in three.js with a true orthographic camera
// =================================================================================================================
export const ISO = {
  bg: ['#EEEAFC', '#DAD3F7', '#C4BAEF'],
  navy: '#2C2960',
  grass: '#94DFBD',
  plaza: '#F4F1FD',
  road: '#8781D0',
  water: '#8CC6FF',
  peach: '#FFC4AC',
  butter: '#FFE6A1',
  coral: '#FF9E86',
  lilac: '#D9D1FA',
  cyan: '#62F0F2',
  lit: '#FFF0C8',
  clay: '#F1EEFA',
  clayGrass: '#E6E2F2',
  clayRoad: '#CFCBE6',
  soil: '#B9ADEB',
  soil2: '#9C8FDB',
  tree: '#5FCF97',
  tree2: '#7FDDA8',
};
export const ISO_MAP = [
  'gtghgthggtgu',
  'grrrrrrrrrrg',
  'hrbbpbbpbbrw',
  'grbbpbbpbbrw',
  'trpppppppprw',
  'grbbpccpbbrw',
  'hrbbpccpbbrw',
  'grpppppppprg',
  'trbbpbbpbbrh',
  'grbbpbbpbbrg',
  'grrrrrrrrrrg',
  'uhgtgssgthgg',
];
export type IsoEl = {
  kind: 'tile' | 'bldg' | 'round' | 'house' | 'tree' | 'tower' | 'turbine' | 'solar';
  i: number;
  j: number;
  x: number;
  z: number;
  h: number;
  w: number;
  color: string;
  roof: string;
  ch: string; // map char under it
  seed: number;
  ring: number; // tile ring index from the centre
  ang: number; // angle around the centre (for ring stagger)
  sx: number; // screen-x key for sweep fronts
  dist: number; // world distance from the centre
};
const BLDG_COLS = ['#FFC4AC', '#FFE6A1', '#D9D1FA', '#A8E6CF', '#FF9E86', '#BFD9FF', '#FFFFFF'];
export const buildIsoCity = (map: string[], seed = 1): IsoEl[] => {
  const N = map.length;
  const M = Math.max(...map.map((r) => r.length));
  const els: IsoEl[] = [];
  const c0 = (N - 1) / 2;
  const c1 = (M - 1) / 2;
  let towerDone = false;
  for (let j = 0; j < N; j++)
    for (let i = 0; i < M; i++) {
      const ch = map[j][i] ?? 'g';
      const x = i - c1;
      const z = j - c0;
      const dist = Math.hypot(x, z);
      const base = {i, j, x, z, ch, seed: seed * 1000 + j * 31 + i, ring: Math.round(Math.max(Math.abs(x), Math.abs(z))), ang: Math.atan2(z, x), sx: (x - z) / Math.SQRT2, dist};
      const tileCol = ch === 'r' ? ISO.road : ch === 'w' ? ISO.water : ch === 'p' || ch === 'b' || ch === 'c' ? ISO.plaza : ISO.grass;
      els.push({...base, kind: 'tile', h: 0.22, w: 0.96, color: tileCol, roof: tileCol});
      const r = hs(seed, i, j);
      if (ch === 'b') {
        const h = 1.1 + (1 - Math.min(1, dist / 6.5)) * 2.6 + r * 1.2;
        const round = hs(seed, i, j, 7) < 0.18;
        els.push({...base, kind: round ? 'round' : 'bldg', h, w: round ? 0.82 : 0.84, color: BLDG_COLS[Math.floor(hs(seed, i, j, 3) * BLDG_COLS.length)], roof: hs(seed, i, j, 5) < 0.4 ? ISO.grass : '#FFFFFF'});
      } else if (ch === 'c' && !towerDone) {
        towerDone = true;
        els.push({...base, x: x + 0.5, z: z + 0.5, kind: 'tower', h: 6.4, w: 1.3, color: ISO.navy, roof: ISO.cyan, sx: (x - z) / Math.SQRT2, dist: 0});
      } else if (ch === 'h') {
        els.push({...base, kind: 'house', h: 0.5, w: 0.62, color: ['#FFFFFF', '#FFE6A1', '#BFD9FF'][Math.floor(r * 3)], roof: ['#FF9E86', '#8C9CF0', '#B7A6F2'][Math.floor(hs(seed, i, j, 2) * 3)]});
      } else if (ch === 't') {
        els.push({...base, kind: 'tree', h: 0.7 + r * 0.3, w: 0.36, color: r < 0.5 ? ISO.tree : ISO.tree2, roof: ISO.tree});
      } else if (ch === 'u') {
        els.push({...base, kind: 'turbine', h: 3.2, w: 0.1, color: '#FFFFFF', roof: '#FF9E86'});
      } else if (ch === 's') {
        els.push({...base, kind: 'solar', h: 0.2, w: 0.8, color: '#5B6BD8', roof: '#5B6BD8'});
      } else if (ch === 'g' && r < 0.22) {
        els.push({...base, kind: 'tree', h: 0.5 + r, w: 0.26, color: ISO.tree2, roof: ISO.tree2});
      }
    }
  return els;
};

/** sets an orthographic camera looking along -dir at target every frame */
export const OrthoRig: React.FC<{target: [number, number, number]; zoom: number; dir?: [number, number, number]; dist?: number}> = ({target, zoom, dir = [1, 1, 1], dist = 60}) => {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  const key = [...target, zoom, ...dir, dist, size.width, size.height].join(',');
  React.useLayoutEffect(() => {
    const L = Math.hypot(dir[0], dir[1], dir[2]);
    camera.position.set(target[0] + (dir[0] / L) * dist, target[1] + (dir[1] / L) * dist, target[2] + (dir[2] / L) * dist);
    camera.up.set(0, 1, 0);
    camera.lookAt(target[0], target[1], target[2]);
    camera.zoom = zoom;
    camera.left = -size.width / 2;
    camera.right = size.width / 2;
    camera.top = size.height / 2;
    camera.bottom = -size.height / 2;
    camera.near = 0.1;
    camera.far = 400;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, camera]);
  return null;
};

/** full-frame orthographic ThreeCanvas with soft shadows */
export const IsoStage: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={1}
      orthographic
      shadows="soft"
      flat
      gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
      style={{position: 'absolute', inset: 0}}
    >
      {children}
    </ThreeCanvas>
  );
};

export const IsoLights: React.FC<{intensity?: number; extent?: number}> = ({intensity = 1, extent = 12}) => (
  <>
    <ambientLight intensity={1.45 * intensity} color="#fbf8ff" />
    <hemisphereLight args={['#ffffff', '#c9bdf0', 0.35 * intensity]} />
    <directionalLight
      position={[-6, 14, 9]}
      intensity={1.5 * intensity}
      color="#ffffff"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-extent}
      shadow-camera-right={extent}
      shadow-camera-top={extent}
      shadow-camera-bottom={-extent}
      shadow-camera-near={0.5}
      shadow-camera-far={60}
      shadow-bias={-0.0006}
      shadow-radius={5}
    />
  </>
);

/** per-element animation state the motion supplies */
export type IsoState = {
  /** growth 0..1+ (overshoot allowed), 0 = hidden */
  grow: number;
  /** y offset (drops) */
  lift?: number;
  /** rotation about x (tile spin / flip) */
  rot?: number;
  /** squash multiplier on y */
  sq?: number;
  /** colour climb: fraction of the height already coloured (1 = full colour, 0 = clay) */
  color?: number;
  /** rim / flash emissive 0..1 */
  flash?: number;
  /** window light 0..1 */
  lit?: number;
  /** roof cap growth 0..1 */
  roof?: number;
};

const Mat: React.FC<{color: string; emissive?: string; ei?: number}> = ({color, emissive = '#000000', ei = 0}) => <meshLambertMaterial color={color} emissive={emissive} emissiveIntensity={ei} />;

/** one element (tile / building / tree …) at its animation state; `t` = seconds for spinning parts */
export const IsoPiece: React.FC<{el: IsoEl; st: IsoState; t: number; clay?: {base: string; grass: string; road: string}; scan?: string}> = ({el, st, t, clay, scan = ISO.cyan}) => {
  if (st.grow <= 0.001) return null;
  const g = st.grow;
  const lift = st.lift ?? 0;
  const cfrac = clamp01(st.color ?? 1);
  const clayCol = clay ? (el.kind === 'tile' ? (el.ch === 'r' ? clay.road : el.ch === 'g' || el.ch === 't' || el.ch === 'h' || el.ch === 'u' ? clay.grass : clay.base) : clay.base) : el.color;
  const col = cfrac >= 1 || !clay ? el.color : clayCol;
  const flash = st.flash ?? 0;
  const lit = st.lit ?? 0;
  if (el.kind === 'tile') {
    const flipped = (st.rot ?? 0) > Math.PI / 2;
    const tc = clay ? (cfrac > 0.5 || flipped ? el.color : clayCol) : el.color;
    const sq = st.sq ?? 1;
    return (
      <group position={[el.x, -0.11 + lift, el.z]} rotation={[st.rot ?? 0, 0, 0]} scale={[g * (2 - sq) * 0.5 + 0.5 * g, g * sq, g * (2 - sq) * 0.5 + 0.5 * g]}>
        <mesh receiveShadow castShadow={lift > 0.05}>
          <boxGeometry args={[0.95, 0.22, 0.95]} />
          <Mat color={tc} emissive={scan} ei={flash * 0.9} />
        </mesh>
        {el.ch === 'r' && cfrac > 0.5 && (
          <mesh position={[0, 0.112, 0]} rotation={[-Math.PI / 2, 0, el.i === 1 || el.i === 10 ? Math.PI / 2 : 0]}>
            <planeGeometry args={[0.08, 0.32]} />
            <meshBasicMaterial color="#E9E5FF" />
          </mesh>
        )}
      </group>
    );
  }
  if (el.kind === 'bldg' || el.kind === 'round') {
    const H = el.h * g;
    const ch = H * cfrac;
    const floors = Math.max(1, Math.floor(el.h / 0.32));
    const bands: React.ReactNode[] = [];
    for (let f = 0; f < floors; f++) {
      const y = 0.22 + f * 0.32;
      if (y + 0.12 > H - 0.08) break;
      const colored = y + 0.12 < ch;
      const lc = colored ? mixHex('#9AA6D8', ISO.lit, clamp01(lit * 1.4 - hs(el.seed, f) * 0.5)) : mixHex(clayCol, '#000000', 0.06);
      bands.push(
        el.kind === 'round' ? (
          <mesh key={f} position={[0, y + 0.06, 0]}>
            <cylinderGeometry args={[el.w / 2 + 0.012, el.w / 2 + 0.012, 0.12, 28]} />
            <Mat color={lc} emissive={colored ? ISO.lit : '#000000'} ei={colored ? lit * 0.6 : 0} />
          </mesh>
        ) : (
          <mesh key={f} position={[0, y + 0.06, 0]}>
            <boxGeometry args={[el.w + 0.02, 0.12, el.w * 0.7]} />
            <Mat color={lc} emissive={colored ? ISO.lit : '#000000'} ei={colored ? lit * 0.6 : 0} />
          </mesh>
        ),
      );
      if (el.kind === 'bldg')
        bands.push(
          <mesh key={'b' + f} position={[0, y + 0.06, 0]}>
            <boxGeometry args={[el.w * 0.7, 0.12, el.w + 0.02]} />
            <Mat color={lc} emissive={colored ? ISO.lit : '#000000'} ei={colored ? lit * 0.6 : 0} />
          </mesh>,
        );
    }
    const geo = (hh: number) => (el.kind === 'round' ? <cylinderGeometry args={[el.w / 2, el.w / 2, hh, 28]} /> : <boxGeometry args={[el.w, hh, el.w]} />);
    const roofG = clamp01(st.roof ?? 1);
    return (
      <group position={[el.x, lift, el.z]}>
        {ch > 0.001 && (
          <mesh position={[0, ch / 2, 0]} castShadow receiveShadow>
            {geo(ch)}
            <Mat color={el.color} />
          </mesh>
        )}
        {H - ch > 0.001 && (
          <mesh position={[0, ch + (H - ch) / 2, 0]} castShadow receiveShadow>
            {geo(H - ch)}
            <Mat color={clayCol} />
          </mesh>
        )}
        {clay && cfrac > 0 && cfrac < 1 && (
          <mesh position={[0, ch, 0]}>
            {el.kind === 'round' ? <cylinderGeometry args={[el.w / 2 + 0.02, el.w / 2 + 0.02, 0.05, 28]} /> : <boxGeometry args={[el.w + 0.04, 0.05, el.w + 0.04]} />}
            <meshBasicMaterial color={scan} />
          </mesh>
        )}
        {bands}
        {roofG > 0 && (
          <mesh position={[0, H + 0.06 * roofG, 0]} scale={[roofG, roofG, roofG]} castShadow>
            {el.kind === 'round' ? <cylinderGeometry args={[el.w / 2 - 0.08, el.w / 2 - 0.04, 0.12, 28]} /> : <boxGeometry args={[el.w - 0.14, 0.12, el.w - 0.14]} />}
            <Mat color={cfrac >= 1 ? el.roof : clayCol} />
          </mesh>
        )}
      </group>
    );
  }
  if (el.kind === 'house') {
    return (
      <group position={[el.x, lift, el.z]} scale={[g, g, g]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.62, 0.5, 0.5]} />
          <Mat color={col} />
        </mesh>
        <mesh position={[0, 0.66, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.52, 0.36, 4]} />
          <Mat color={cfrac >= 1 || !clay ? el.roof : clayCol} />
        </mesh>
      </group>
    );
  }
  if (el.kind === 'tree') {
    return (
      <group position={[el.x + (hs(el.seed, 1) - 0.5) * 0.3, lift, el.z + (hs(el.seed, 2) - 0.5) * 0.3]} scale={[g, g, g]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.3, 8]} />
          <Mat color={cfrac >= 1 || !clay ? '#B58E73' : clayCol} />
        </mesh>
        <mesh position={[0, 0.3 + el.h * 0.35, 0]} castShadow>
          <sphereGeometry args={[el.w, 16, 12]} />
          <Mat color={col} />
        </mesh>
      </group>
    );
  }
  if (el.kind === 'solar') {
    return (
      <group position={[el.x, lift, el.z]} scale={[g, g, g]}>
        {[-0.22, 0.22].map((dz, k) => (
          <mesh key={k} position={[0, 0.16, dz]} rotation={[-0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.8, 0.03, 0.32]} />
            <Mat color={col} />
          </mesh>
        ))}
      </group>
    );
  }
  if (el.kind === 'turbine') {
    const spin = t * 2.6 + el.seed;
    return (
      <group position={[el.x, lift, el.z]} scale={[g, g, g]}>
        <mesh position={[0, el.h / 2, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.07, el.h, 10]} />
          <Mat color="#FFFFFF" />
        </mesh>
        <group position={[0, el.h, 0]} rotation={[0, Math.PI / 4, 0]}>
          <mesh position={[0, 0, 0.08]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <Mat color={cfrac >= 1 || !clay ? el.roof : '#FFFFFF'} />
          </mesh>
          <group position={[0, 0, 0.14]} rotation={[0, 0, spin]}>
            {[0, 1, 2].map((k) => (
              <mesh key={k} rotation={[0, 0, (k * Math.PI * 2) / 3]} position={[Math.cos((k * Math.PI * 2) / 3 + Math.PI / 2) * 0.55, Math.sin((k * Math.PI * 2) / 3 + Math.PI / 2) * 0.55, 0]} castShadow>
                <boxGeometry args={[0.07, 1.1, 0.02]} />
                <Mat color="#FFFFFF" />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    );
  }
  return null;
};

/** the hero tower: navy segments with cyan light rings, antenna + glowing tip */
export const IsoTower: React.FC<{el: IsoEl; segs: number[]; antenna: number; glow: number; t: number; clayColor?: string; color?: number}> = ({el, segs, antenna, glow, t, clayColor, color = 1}) => {
  const SEG = el.h / 4.6;
  const radii = [0.95, 0.8, 0.68, 0.56];
  const nodes: React.ReactNode[] = [];
  let y = 0;
  const body = color >= 1 || !clayColor ? el.color : clayColor;
  segs.forEach((g, k) => {
    if (g <= 0.001) return;
    const r = radii[k] ?? 0.5;
    const hh = SEG * (k === 0 ? 1.2 : 1) * Math.min(1.15, g);
    nodes.push(
      <mesh key={'s' + k} position={[0, y + hh / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.92, r, hh, 40]} />
        <Mat color={body} />
      </mesh>,
    );
    const rings = 3;
    for (let q = 0; q < rings; q++) {
      const yy = y + (hh * (q + 0.6)) / (rings + 0.2);
      nodes.push(
        <mesh key={`r${k}-${q}`} position={[0, yy, 0]}>
          <cylinderGeometry args={[r * 0.95 + 0.014, r * 0.95 + 0.014, 0.075, 40]} />
          <meshBasicMaterial color={mixHex(color >= 1 ? '#3F4BA0' : '#E8E4F6', ISO.cyan, glow * (0.7 + 0.3 * Math.sin(t * 6 + q + k)))} />
        </mesh>,
      );
    }
    y += hh;
  });
  if (antenna > 0) {
    const ah = 1.1 * antenna;
    nodes.push(
      <mesh key="ant" position={[0, y + ah / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.05, ah, 8]} />
        <Mat color="#E9E6FA" />
      </mesh>,
    );
    nodes.push(
      <mesh key="tip" position={[0, y + ah + 0.06, 0]}>
        <sphereGeometry args={[0.1 + glow * 0.04, 14, 10]} />
        <meshBasicMaterial color={mixHex('#E9E6FA', ISO.cyan, glow)} />
      </mesh>,
    );
  }
  return <group position={[el.x, 0, el.z]}>{nodes}</group>;
};

/** soil slab under the island (two lilac layers) */
export const IsoSlab: React.FC<{n: number; m: number; grow: number; drop?: number}> = ({n, m, grow, drop = 0}) =>
  grow <= 0.001 ? null : (
    <group position={[0, -drop, 0]}>
      <mesh position={[0, -0.22 - 0.18 * grow, 0]} receiveShadow>
        <boxGeometry args={[m + 0.1, 0.36 * grow, n + 0.1]} />
        <Mat color={ISO.soil} />
      </mesh>
      <mesh position={[0, -0.22 - 0.36 * grow - 0.2 * grow, 0]}>
        <boxGeometry args={[m - 0.1, 0.4 * grow, n - 0.1]} />
        <Mat color={ISO.soil2} />
      </mesh>
    </group>
  );

/** puffy cloud (sphere cluster) */
export const IsoCloud: React.FC<{x: number; y: number; z: number; s: number}> = ({x, y, z, s}) => (
  <group position={[x, y, z]} scale={[s, s, s]}>
    {[
      [0, 0, 0, 0.6],
      [0.6, -0.1, 0.1, 0.45],
      [-0.6, -0.12, -0.05, 0.42],
      [0.25, 0.3, 0, 0.42],
    ].map(([a, b, c, r], i) => (
      <mesh key={i} position={[a, b, c]}>
        <sphereGeometry args={[r, 18, 14]} />
        <meshLambertMaterial color="#FFFFFF" emissive="#ffffff" emissiveIntensity={0.25} />
      </mesh>
    ))}
  </group>
);

/** iso tile drop: fall from h0 with spin that settles flat at contact, squash and two micro bounces (0.3 s fall) */
export const tileDrop = (tau: number) => {
  // tau seconds since the drop started
  const fall = 0.3;
  if (tau < 0) return {lift: 1.6, rot: 1.7, sq: 1, vis: false};
  if (tau < fall) {
    const uu = tau / fall;
    return {lift: 1.6 * (1 - uu * uu), rot: 1.7 * Math.pow(1 - uu, 2.2), sq: 1 + 0.06 * uu * uu, vis: true};
  }
  const t2 = tau - fall;
  let lift = 0;
  if (t2 < 0.16) lift = 0.07 * 4 * (t2 / 0.16) * (1 - t2 / 0.16);
  else if (t2 < 0.26) lift = 0.021 * 4 * ((t2 - 0.16) / 0.1) * (1 - (t2 - 0.16) / 0.1);
  const sq = 1 - 0.3 * Math.exp(-t2 / 0.05) * Math.cos(40 * t2);
  return {lift, rot: 0, sq, vis: true};
};

// =================================================================================================================
// SOFT 3D CANDY (04-3d-render) — capsule pin-bed fields, sweeps + ripple rings, candy studio light
// =================================================================================================================
export const CANDY = {
  cyc: '#F1E4EC',
  bg: '#F6E8F1',
  grade: '#EADCF2',
  gummy: '#FF5AA6',
  cap: '#EBDCCD',
  body: '#C6B9F3',
  chrome: '#F4F3F6',
  rim: '#FF6FAE',
  plum: '#2A1830',
  shadow: '#817971',
};
export type Sweep = {at: number; dir?: [number, number]; speed?: number; sigma?: number; amp?: number};
export type Ripple = {x: number; z: number; at: number; amp?: number; c?: number; lambda?: number; decay?: number};
/** height of the pill bed at (x,z,t): sweep bands + damped ripple packets (world units, t seconds) */
export const bedHeight = (x: number, z: number, t: number, sweeps: Sweep[], ripples: Ripple[]) => {
  let hgt = 0;
  for (const s of sweeps) {
    const dir = s.dir ?? [1, 0.25];
    const L = Math.hypot(dir[0], dir[1]) || 1;
    const u = (x * dir[0] + z * dir[1]) / L - (s.speed ?? 3.4) * (t - s.at);
    const g = u / (s.sigma ?? 0.8);
    hgt += (s.amp ?? 0.26) * Math.exp(-g * g);
  }
  for (const rp of ripples) {
    const tau = t - rp.at;
    if (tau <= 0) continue;
    const r = Math.hypot(x - rp.x, z - rp.z);
    const c = rp.c ?? 3.8;
    const lam = rp.lambda ?? 1.05;
    const rho = r - c * tau;
    const g = rho / (1.1 * lam);
    hgt += ((rp.amp ?? 0.5) * Math.exp(-g * g) * Math.cos((2 * Math.PI * rho) / lam) * Math.exp(-tau / (rp.decay ?? 0.95))) / Math.sqrt(1 + r / 0.6);
  }
  return hgt;
};

export type PillSample = {
  y: number;
  /** extra rotation about the x axis (radians) */
  rx?: number;
  rz?: number;
  /** 0 = cap colour up, 1 = flipped to body colour */
  flip?: number;
  /** hide (flung off) */
  hide?: boolean;
  /** scale */
  s?: number;
};
/** a dense bed of glossy capsules; `sample(x,z,sd)` is evaluated for every pill every frame */
export const PillField: React.FC<{
  cols: number;
  rows: number;
  spacing?: number;
  capColor: string;
  bodyColor: string;
  frame: number;
  sample: (x: number, z: number, sd: number) => PillSample;
  tiltFrom?: (x: number, z: number) => number; // height field for gradient tilt
  pillR?: number;
  pillLen?: number;
}> = ({cols, rows, spacing = 0.5, capColor, bodyColor, frame, sample, tiltFrom, pillR = 0.17, pillLen = 0.2}) => {
  const count = cols * rows;
  const geo = React.useMemo(() => new THREE.CapsuleGeometry(pillR, pillLen, 5, 12), [pillR, pillLen]);
  const mat = React.useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        roughness: 0.3,
        metalness: 0,
      }),
    [],
  );
  const mesh = React.useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.castShadow = true;
    m.receiveShadow = true;
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    return m;
  }, [geo, mat, count]);
  const cap = React.useMemo(() => new THREE.Color(capColor), [capColor]);
  const body = React.useMemo(() => new THREE.Color(bodyColor), [bodyColor]);
  const o = React.useMemo(() => new THREE.Object3D(), []);
  const c = React.useMemo(() => new THREE.Color(), []);
  React.useLayoutEffect(() => {
    let i = 0;
    const x0 = (-(cols - 1) / 2) * spacing;
    const z0 = (-(rows - 1) / 2) * spacing;
    for (let r = 0; r < rows; r++)
      for (let q = 0; q < cols; q++, i++) {
        const jx = (hs(q, r, 1) - 0.5) * spacing * 0.18;
        const jz = (hs(q, r, 2) - 0.5) * spacing * 0.18;
        const x = x0 + q * spacing + jx;
        const z = z0 + r * spacing + jz;
        const sd = hs(q, r, 3);
        const smp = sample(x, z, sd);
        if (smp.hide) {
          o.position.set(0, -50, 0);
          o.scale.setScalar(0.0001);
          o.rotation.set(0, 0, 0);
        } else {
          let rx = smp.rx ?? 0;
          let rz = smp.rz ?? 0;
          if (tiltFrom) {
            const e = 0.3;
            const gx = (tiltFrom(x + e, z) - tiltFrom(x - e, z)) / (2 * e);
            const gz = (tiltFrom(x, z + e) - tiltFrom(x, z - e)) / (2 * e);
            rz += -gx * 0.7;
            rx += gz * 0.7;
          }
          o.position.set(x, (pillR + pillLen / 2) * 0.9 + smp.y, z);
          o.rotation.set(rx + (hs(q, r, 4) - 0.5) * 0.14, hs(q, r, 5) * Math.PI, rz + (hs(q, r, 6) - 0.5) * 0.14);
          o.scale.setScalar((smp.s ?? 1) * (0.92 + 0.16 * hs(q, r, 7)));
        }
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        const f = clamp01(smp.flip ?? 0);
        c.copy(cap).lerp(body, f);
        mesh.setColorAt(i, c);
      }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesh, frame, cols, rows, spacing, sample, tiltFrom]);
  return <primitive object={mesh} />;
};

/** candy studio: big soft key + fill + pink rim strip */
export const CandyLights: React.FC<{extent?: number; rim?: string; intensity?: number}> = ({extent = 14, rim = CANDY.rim, intensity = 1}) => (
  <>
    <ambientLight intensity={0.6 * intensity} color="#ffeef8" />
    <hemisphereLight args={['#fff0f6', '#b89ad6', 0.55 * intensity]} />
    <directionalLight
      position={[-7, 13, 8]}
      intensity={1.35 * intensity}
      color="#fff6ee"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-extent}
      shadow-camera-right={extent}
      shadow-camera-top={extent}
      shadow-camera-bottom={-extent}
      shadow-camera-near={0.5}
      shadow-camera-far={60}
      shadow-bias={-0.0006}
      shadow-radius={7}
    />
    <directionalLight position={[7, 3.5, -9]} intensity={1.7 * intensity} color={rim} />
  </>
);

/** jelly-letter vertical track: drop into a soft bed, sink, wobble, settle (precomputed ODE, pure) */
export const bedTrack = (drop: number, y0 = 5.5, opts: {g?: number; A?: number; lam?: number; Cd?: number; dur?: number} = {}) => {
  const {g = 28, A = 160, lam = 0.16, Cd = 7.5, dur = 6} = opts;
  const dt = 1 / 1200;
  const n = Math.ceil(dur / dt);
  const out = new Float32Array(Math.ceil(dur * 120) + 2);
  let y = y0;
  let v = 0;
  let contact = -1;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    let a = -g;
    if (y < 0) {
      const pen = -y;
      a += A * (Math.exp(pen / lam) - 1) - Cd * v * 10;
      if (contact < 0) contact = t;
    }
    v += a * dt;
    y += v * dt;
    const idx = Math.floor(t * 120);
    if (idx >= k) {
      out[idx] = y;
      k = idx + 1;
    }
  }
  return {
    contact: contact < 0 ? dur : contact,
    at: (tau: number) => {
      if (tau <= 0) return y0;
      const q = Math.min(out.length - 2, tau * 120);
      const i = Math.floor(q);
      return out[i] + (out[i + 1] - out[i]) * (q - i);
    },
  };
};
/** jelly squash after a contact: sy dips then overshoots, damped */
export const jellySquash = (tau: number, amt = 0.3) => {
  if (tau <= 0) return 1;
  return 1 - amt * Math.exp(-tau / 0.16) * Math.cos(2 * Math.PI * 4.2 * tau);
};
