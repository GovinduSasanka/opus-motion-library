/**
 * r2-lb1-kit — shared helpers for the LB1 group (after LemoLab lemo-opuscar styles: midcentury-toon, news-package,
 * newsreel, one-line, paper-lantern, paper-popup, papercut-red, pictogram-motion, pixel-rpg, risograph, rubber-hose).
 *
 * Toon geometry + ink ribbon adapted from lemo-opuscar/styles/midcentury-toon/demo/engine/toon.js and the pictogram
 * cell grid from lemo-opuscar/styles/pictogram-motion/demo/engine.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md.
 * Everything here is a pure function of the frame and seeds: no Math.random, no timers, no DOM measuring.
 */
import React from 'react';
import {loadFont as alfaSlab} from '@remotion/google-fonts/AlfaSlabOne';
import {loadFont as oleo} from '@remotion/google-fonts/OleoScript';
import {loadFont as jost} from '@remotion/google-fonts/Jost';
import {loadFont as barlow} from '@remotion/google-fonts/BarlowCondensed';
import {loadFont as plex} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as limelight} from '@remotion/google-fonts/Limelight';
import {loadFont as oswald} from '@remotion/google-fonts/Oswald';
import {loadFont as fraunces} from '@remotion/google-fonts/Fraunces';
import {loadFont as interTight} from '@remotion/google-fonts/InterTight';
import {loadFont as dmMono} from '@remotion/google-fonts/DMMono';
import {loadFont as pixelify} from '@remotion/google-fonts/PixelifySans';
import {loadFont as silkscreen} from '@remotion/google-fonts/Silkscreen';
import {loadFont as bricolage} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as shrikhand} from '@remotion/google-fonts/Shrikhand';
import {loadFont as fellSC} from '@remotion/google-fonts/IMFellEnglishSC';
import {loadFont as fredoka} from '@remotion/google-fonts/Fredoka';
import {loadFont as lilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as cormorant} from '@remotion/google-fonts/Cormorant';
import {loadFont as caveat} from '@remotion/google-fonts/Caveat';
import * as maShan from '@remotion/google-fonts/MaShanZheng';

// =============================================================================================== fonts (lazy)
// Fonts load on first use (inside render), so motions that never use a face never fetch it.
const L = (fn: () => {fontFamily: string}) => fn;
const FONT_LOADERS = {
  /** Alfa Slab One — mid-century slab titles */
  slab: L(() => alfaSlab('normal', {weights: ['400'], subsets: ['latin']})),
  /** Oleo Script 700 — mid-century kicker script */
  script: L(() => oleo('normal', {weights: ['400', '700'], subsets: ['latin']})),
  /** Jost — captions, spaced caps labels */
  jost: L(() => jost('normal', {weights: ['500', '600', '700'], subsets: ['latin']})),
  /** Barlow Condensed — news numbers, names, straps */
  barlow: L(() => barlow('normal', {weights: ['600', '800'], subsets: ['latin']})),
  /** IBM Plex Mono — datelines, sources */
  plex: L(() => plex('normal', {weights: ['500', '600'], subsets: ['latin']})),
  /** Limelight — Art Deco newsreel titles, period caps */
  deco: L(() => limelight('normal', {weights: ['400'], subsets: ['latin']})),
  /** Oswald — newsreel place cards */
  oswald: L(() => oswald('normal', {weights: ['400', '600'], subsets: ['latin']})),
  /** Fraunces — papercut titles */
  fraunces: L(() => fraunces('normal', {weights: ['600', '800'], subsets: ['latin']})),
  /** Inter Tight 900 — pictogram titles */
  tight: L(() => interTight('normal', {weights: ['700', '900'], subsets: ['latin']})),
  /** DM Mono — pictogram HUD */
  dmmono: L(() => dmMono('normal', {weights: ['500'], subsets: ['latin']})),
  /** Pixelify Sans — RPG dialog / body */
  pixel: L(() => pixelify('normal', {weights: ['400', '700'], subsets: ['latin']})),
  /** Silkscreen — RPG menu caps */
  silk: L(() => silkscreen('normal', {weights: ['400', '700'], subsets: ['latin']})),
  /** Bricolage Grotesque 800 — riso titles */
  brico: L(() => bricolage('normal', {weights: ['700', '800'], subsets: ['latin']})),
  /** Shrikhand — rubber-hose titles */
  shrik: L(() => shrikhand('normal', {weights: ['400'], subsets: ['latin']})),
  /** IM Fell English SC — period title cards */
  fell: L(() => fellSC('normal', {weights: ['400'], subsets: ['latin']})),
  /** Fredoka — pop-up book signs and bubbles */
  fredoka: L(() => fredoka('normal', {weights: ['500', '600', '700'], subsets: ['latin']})),
  /** Lilita One — pop-up book banners */
  lilita: L(() => lilita('normal', {weights: ['400'], subsets: ['latin']})),
  /** Cormorant — paper-lantern Latin serif */
  cormorant: L(() => cormorant('normal', {weights: ['500', '600', '700'], subsets: ['latin']})),
  /** Caveat — one-line written captions */
  caveat: L(() => caveat('normal', {weights: ['500', '700'], subsets: ['latin']})),
};
export type LbFont = keyof typeof FONT_LOADERS | 'brush';
const fontCache: Partial<Record<string, string>> = {};
/** font-family for a role (loads the face on first use) */
export const lbf = (role: LbFont): string => {
  if (role === 'brush') return brushFont('');
  return (fontCache[role] ??= FONT_LOADERS[role]().fontFamily);
};

/**
 * Ma Shan Zheng brush calligraphy. The CJK face ships as ~90 unicode-range chunks; we only load the chunks that
 * cover `text` (plus latin), so a poem costs a handful of requests instead of ninety.
 */
export const brushFont = (text: string): string => {
  const ns = maShan as unknown as {loadFont: (s: string, o: object) => {fontFamily: string}; getInfo?: () => {unicodeRanges: Record<string, string>}};
  const info = typeof ns.getInfo === 'function' ? ns.getInfo() : null;
  const subsets = new Set<string>(['latin']);
  if (info) {
    const cps = [...new Set([...text].map((c) => c.codePointAt(0) ?? 0))].filter((c) => c > 0x2e80);
    for (const [key, range] of Object.entries(info.unicodeRanges)) {
      if (!/^\[\d+\]$/.test(key)) continue;
      const parts = range.split(',').map((s) => s.trim().replace(/^U\+/i, ''));
      const hit = cps.some((cp) =>
        parts.some((pt) => {
          const [a, b] = pt.split('-');
          const lo = parseInt(a.replace(/\?/g, '0'), 16);
          const hi = b ? parseInt(b, 16) : parseInt(a.replace(/\?/g, 'f'), 16);
          return cp >= lo && cp <= hi;
        }),
      );
      if (hit) subsets.add(key);
    }
  }
  const key = 'brush:' + [...subsets].sort().join(',');
  return (fontCache[key] ??= ns.loadFont('normal', {weights: ['400'], subsets: [...subsets], ignoreTooManyRequestsWarning: true}).fontFamily);
};

/** average advance (em) for lower-case / caps+digits per role */
const ADV: Record<string, [number, number]> = {
  slab: [0.6, 0.74],
  script: [0.48, 0.62],
  jost: [0.5, 0.64],
  barlow: [0.42, 0.5],
  plex: [0.6, 0.6],
  deco: [0.56, 0.7],
  oswald: [0.44, 0.52],
  fraunces: [0.55, 0.7],
  tight: [0.56, 0.68],
  dmmono: [0.6, 0.6],
  pixel: [0.5, 0.6],
  silk: [0.72, 0.8],
  brico: [0.55, 0.68],
  shrik: [0.62, 0.74],
  fell: [0.6, 0.72],
  fredoka: [0.52, 0.62],
  lilita: [0.48, 0.56],
  cormorant: [0.44, 0.62],
  caveat: [0.4, 0.5],
  brush: [0.6, 0.7],
};
/** estimated width (px) of one line; tracking in em */
export const estW = (text: string, size: number, role: LbFont, tracking = 0) => {
  const [lo, up] = ADV[role] ?? [0.55, 0.68];
  let wsum = 0;
  for (const c of text) {
    const cp = c.codePointAt(0) ?? 0;
    if (c === ' ') wsum += 0.28;
    else if (cp > 0x2e80) wsum += 1.0;
    else if (/[A-Z0-9%&@#WM]/.test(c)) wsum += up;
    else if (/[.,:;'!|iIl]/.test(c)) wsum += lo * 0.5;
    else wsum += lo;
    wsum += tracking;
  }
  return wsum * size;
};
/** size that fits `text` in maxW */
export const fitW = (text: string, size: number, maxW: number, role: LbFont, tracking = 0) => {
  const wd = estW(text, size, role, tracking);
  return wd > maxW ? (size * maxW) / wd : size;
};

// =============================================================================================== math
export type P = [number, number];
export const TAU = Math.PI * 2;
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** normalised progress of t inside [a, b] */
export const seg = (t: number, a: number, b: number) => (b <= a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));
export const ss = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const eo = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const ei = (t: number) => Math.pow(clamp(t), 3);
export const eio = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** exponential ease-out / in-out (pictogram, news) */
export const oExp = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const ioExp = (t: number) => {
  const x = clamp(t);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
};
/** back ease-out with overshoot s (1.7 classic, 2+ springy) */
export const back = (t: number, s = 1.7) => {
  const x = clamp(t) - 1;
  return 1 + x * x * ((s + 1) * x + s);
};
/** deterministic hash 0..1 */
export const hash = (x: number, y = 0, z = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
/** smooth value noise 0..1 (seeded) */
export const vnoise = (x: number, y = 0, seed = 0) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const g = (a: number, b: number) => hash(a, b, seed);
  return (g(ix, iy) * (1 - u) + g(ix + 1, iy) * u) * (1 - v) + (g(ix, iy + 1) * (1 - u) + g(ix + 1, iy + 1) * u) * v;
};
/** damped spring wobble used for jolts: e^(-k·d)·sin(w·d) */
export const jolt = (d: number, k = 14, w = 70) => (d < 0 ? 0 : Math.exp(-k * d) * Math.sin(w * d));
/** on-twos time quantiser (frames) */
export const twosF = (frame: number, n = 2) => Math.floor(frame / n) * n;

// =============================================================================================== colour
export const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s.slice(0, 6);
  const n = parseInt(f, 16);
  return Number.isNaN(n) ? [128, 128, 128] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex2 = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
/** mix two hex colours -> hex */
export const mix = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = clamp(t);
  return '#' + hex2(A[0] + (B[0] - A[0]) * k) + hex2(A[1] + (B[1] - A[1]) * k) + hex2(A[2] + (B[2] - A[2]) * k);
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${clamp(a)})`;
};
/** five tones of one hue: t0 darkest … t4 lightest, t2 = base (pictogram system) */
export const toneSet = (hue: string): string[] => [mix(hue, '#000000', 0.25), mix(hue, '#000000', 0.12), hue, mix(hue, '#ffffff', 0.15), mix(hue, '#ffffff', 0.32)];
export const luma = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

// =============================================================================================== geometry
/** points -> SVG path */
export const pd = (pts: P[], closed = true) => {
  if (!pts.length) return '';
  let s = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) s += `L${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
  return closed ? s + 'Z' : s;
};
/** Catmull-Rom spline through points */
export const spline = (pts: P[], closed = true, n = 8): P[] => {
  const out: P[] = [];
  const N = pts.length;
  const get = (i: number) => (closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))]);
  const segs = closed ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(pts[N - 1]);
  return out;
};
export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, n = 48, a0 = 0, a1 = TAU, rot = 0): P[] => {
  const out: P[] = [];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
};
export const rrectPts = (x: number, y: number, w: number, h: number, r: number, n = 5): P[] => {
  const rr = Math.min(r, w / 2, h / 2);
  const out: P[] = [];
  const cs: [number, number, number][] = [
    [x + w - rr, y + rr, -Math.PI / 2],
    [x + w - rr, y + h - rr, 0],
    [x + rr, y + h - rr, Math.PI / 2],
    [x + rr, y + rr, Math.PI],
  ];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= n; i++) {
    const a = a0 + ((Math.PI / 2) * i) / n;
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return out;
};
export const movePts = (pts: P[], dx: number, dy: number): P[] => pts.map(([x, y]) => [x + dx, y + dy]);
/** rotate a, scale s (sy) then translate to (ox, oy) */
export const xform = (pts: P[], ox: number, oy: number, a = 0, s = 1, sy = s): P[] => {
  const c = Math.cos(a);
  const si = Math.sin(a);
  return pts.map(([x, y]) => [ox + c * x * s - si * y * sy, oy + si * x * s + c * y * sy]);
};
export const plen = (pts: P[]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
};
/** cumulative arc lengths */
export const cumLen = (pts: P[]) => {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return out;
};
/** first fraction u of an open polyline (by length) */
export const subpath = (pts: P[], u: number, cum?: number[]): P[] => {
  if (u >= 1) return pts;
  if (u <= 0 || pts.length < 2) return [pts[0]];
  const C = cum ?? cumLen(pts);
  const target = C[C.length - 1] * u;
  const out: P[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (C[i] >= target) {
      const k = (target - C[i - 1]) / Math.max(1e-6, C[i] - C[i - 1]);
      out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]);
      break;
    }
    out.push(pts[i]);
  }
  return out;
};
/** point + heading at arc length fraction u */
export const pointAt = (pts: P[], u: number, cum?: number[]) => {
  const s = subpath(pts, clamp(u, 0.0005, 1), cum);
  const a = s[s.length - 1];
  const b = s[Math.max(0, s.length - 2)];
  return {x: a[0], y: a[1], a: Math.atan2(a[1] - b[1], a[0] - b[0])};
};
/** resample a polyline every `step` px */
export const resample = (pts: P[], step: number): P[] => {
  const C = cumLen(pts);
  const total = C[C.length - 1];
  const n = Math.max(2, Math.ceil(total / step));
  const out: P[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const d = (total * i) / n;
    while (j < C.length - 2 && C[j + 1] < d) j++;
    const k = (d - C[j]) / Math.max(1e-6, C[j + 1] - C[j]);
    out.push([lerp(pts[j][0], pts[j + 1][0], k), lerp(pts[j][1], pts[j + 1][1], k)]);
  }
  return out;
};
export const bbox = (pts: P[]) => {
  let a = 1e9;
  let b = 1e9;
  let c = -1e9;
  let d = -1e9;
  for (const [x, y] of pts) {
    a = Math.min(a, x);
    b = Math.min(b, y);
    c = Math.max(c, x);
    d = Math.max(d, y);
  }
  return [a, b, c, d] as const;
};
/** n-point star (outer r, inner ratio) */
export const starPts = (cx: number, cy: number, r: number, n = 8, inner = 0.42, rot = 0): P[] => {
  const out: P[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return out;
};
/** thin concave 4-point "atomic" sparkle */
export const sparklePts = (cx: number, cy: number, r: number, rot = 0, pinch = 0.14): P[] => {
  const out: P[] = [];
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2 - Math.PI / 2;
    const b = a + Math.PI / 4;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    out.push([cx + Math.cos(b) * r * pinch, cy + Math.sin(b) * r * pinch]);
  }
  return out;
};
/** alternating sunburst wedges as one path */
export const raysD = (cx: number, cy: number, n: number, r: number, rot = 0, duty = 0.5, r0 = 0) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i * TAU) / n;
    const a1 = a0 + (TAU / n) * duty;
    d += `M${(cx + Math.cos(a0) * r0).toFixed(1)} ${(cy + Math.sin(a0) * r0).toFixed(1)}L${(cx + Math.cos(a0) * r).toFixed(1)} ${(cy + Math.sin(a0) * r).toFixed(1)}L${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)}L${(cx + Math.cos(a1) * r0).toFixed(1)} ${(cy + Math.sin(a1) * r0).toFixed(1)}Z`;
  }
  return d;
};

// =============================================================================================== toon (midcentury)
export const TOON = {
  paper: '#F4EAD5',
  paperD: '#E6D8BC',
  paperDD: '#D4C29F',
  ink: '#2B2420',
  coral: '#E4613F',
  coralD: '#B8452B',
  mustard: '#E8B43A',
  mustardD: '#C08A1E',
  mustardL: '#F3D37F',
  teal: '#3FA7A0',
  tealD: '#257A74',
  tealL: '#8ACFC6',
  blue: '#7F9CC0',
  blueD: '#5B789E',
  pink: '#F0B4A8',
  avocado: '#A7AE5B',
  kraft: '#C9955D',
  kraftD: '#A2713F',
  white: '#FBF6EA',
  cream: '#FBF1DC',
};

/** colour-cel register offset (px) for a frame: base offset + jitter re-rolled on twos */
export const toonReg = (frame: number, seed: number, u: number, k = 1, dx = 6, dy = 4, jit = 1.6): P => {
  const f = Math.floor(frame / 2);
  return [(dx + (hash(f, seed, 1) - 0.5) * 2 * jit) * u * k, (dy + (hash(f, seed, 2) - 0.5) * 2 * jit) * u * k];
};

/**
 * Pressure ribbon with breaks -> one filled path `d`. Width breathes with value noise along the path, optional
 * end taper, and gaps where a second noise dips below breaks/2 (the line never fully closes).
 */
export const inkRibbon = (pts0: P[], w: number, o: {closed?: boolean; wob?: number; seed?: number; breaks?: number; taper?: boolean; upto?: number} = {}) => {
  const {closed = false, wob = 0.4, seed = 1, breaks = 0, taper = true, upto = 1} = o;
  let pts: P[] = closed ? [...pts0, pts0[0], pts0[1] ?? pts0[0]] : pts0;
  if (upto < 1) pts = subpath(pts, upto);
  if (pts.length < 2 || w <= 0) return '';
  const C = cumLen(pts);
  const total = C[C.length - 1];
  if (total <= 0.5) return '';
  const step = Math.max(1.5, Math.min(w * 0.7, total / 500));
  const n = Math.max(2, Math.ceil(total / step));
  const S: [number, number, number][] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const d = (total * i) / n;
    while (j < C.length - 2 && C[j + 1] < d) j++;
    const k = (d - C[j]) / Math.max(1e-6, C[j + 1] - C[j]);
    S.push([lerp(pts[j][0], pts[j + 1][0], k), lerp(pts[j][1], pts[j + 1][1], k), d]);
  }
  const sd = seed * 13 + 5;
  const wid = (d: number) => {
    let k = 1 + wob * (vnoise(d / (w * 16), 0.5, sd) - 0.5) * 2;
    if (taper && !closed) {
      const e = Math.min(d, total - d) / (w * 4);
      k *= Math.min(1, 0.3 + e * 0.7);
    }
    return Math.max(0.08, k) * w * 0.5;
  };
  const runs: [number, number, number][][] = [];
  let cur: [number, number, number][] = [];
  for (const s of S) {
    const gap = breaks > 0 && vnoise(s[2] / (w * 11), 7.3, sd) < breaks * 0.5;
    if (gap) {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    } else cur.push(s);
  }
  if (cur.length > 1) runs.push(cur);
  let d = '';
  for (const run of runs) {
    const left: P[] = [];
    const right: P[] = [];
    for (let i = 0; i < run.length; i++) {
      const a = run[Math.max(0, i - 1)];
      const b = run[Math.min(run.length - 1, i + 1)];
      let nx = -(b[1] - a[1]);
      let ny = b[0] - a[0];
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      const r = wid(run[i][2]);
      left.push([run[i][0] + nx * r, run[i][1] + ny * r]);
      right.push([run[i][0] - nx * r, run[i][1] - ny * r]);
    }
    d += pd([...left, ...right.reverse()]);
    const r0 = wid(run[0][2]);
    const r1 = wid(run[run.length - 1][2]);
    const c0 = run[0];
    const c1 = run[run.length - 1];
    d += `M${(c0[0] - r0).toFixed(1)} ${c0[1].toFixed(1)}a${r0.toFixed(1)} ${r0.toFixed(1)} 0 1 0 ${(2 * r0).toFixed(1)} 0a${r0.toFixed(1)} ${r0.toFixed(1)} 0 1 0 ${(-2 * r0).toFixed(1)} 0`;
    d += `M${(c1[0] - r1).toFixed(1)} ${c1[1].toFixed(1)}a${r1.toFixed(1)} ${r1.toFixed(1)} 0 1 0 ${(2 * r1).toFixed(1)} 0a${r1.toFixed(1)} ${r1.toFixed(1)} 0 1 0 ${(-2 * r1).toFixed(1)} 0`;
  }
  return d;
};

/** <defs> for the toon look: dry-brush tooth pattern + print holes. Use ids `${id}-tooth`, `${id}-holes`. */
export const ToonDefs: React.FC<{id: string; u: number; ink?: string}> = ({id, u, ink = '#28190F'}) => {
  const S = 256 * u;
  const flecks = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 260; i++) {
      const x = hash(i, 1, 41) * S;
      const y = hash(i, 2, 41) * S;
      const l = (2 + hash(i, 3, 41) * 9) * u;
      const a = (hash(i, 4, 41) - 0.5) * 0.35;
      out.push(<line key={i} x1={x} y1={y} x2={x + Math.cos(a) * l} y2={y + Math.sin(a) * l} stroke={ink} strokeOpacity={0.06 + hash(i, 5, 41) * 0.16} strokeWidth={(0.6 + hash(i, 6, 41) * 1.6) * u} />);
    }
    return out;
  }, [S, u, ink]);
  const holes = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 200; i++) {
      const x = hash(i, 7, 43) * S;
      const y = hash(i, 8, 43) * S;
      const r = (0.4 + hash(i, 9, 43) * 1.3) * u;
      out.push(<ellipse key={i} cx={x} cy={y} rx={r * 1.6} ry={r} fill="#FFFAEC" fillOpacity={0.1 + hash(i, 10, 43) * 0.32} />);
    }
    return out;
  }, [S, u]);
  return (
    <defs>
      <pattern id={`${id}-tooth`} patternUnits="userSpaceOnUse" width={S} height={S}>
        {flecks}
      </pattern>
      <pattern id={`${id}-holes`} patternUnits="userSpaceOnUse" width={S} height={S}>
        {holes}
      </pattern>
    </defs>
  );
};

export type ToonShapeProps = {
  pts: P[];
  frame: number;
  u: number;
  defsId: string;
  fill?: string | null;
  line?: number;
  lineColor?: string;
  breaks?: number;
  wob?: number;
  seed?: number;
  off?: P;
  regK?: number;
  tooth?: number;
  shadow?: string | null;
  shadowOff?: P;
  drawOn?: number;
  closed?: boolean;
  opacity?: number;
};
/**
 * The toon-cel primitive: off-register flat fill (jitter on twos) + dry-brush tooth + broken pressure ink ribbon.
 * line width is in u-units (3–5 typical).
 */
export const ToonShape: React.FC<ToonShapeProps> = ({pts, frame, u, defsId, fill = null, line = 4, lineColor = TOON.ink, breaks = 0.18, wob = 0.4, seed = 1, off, regK = 1, tooth = 0.35, shadow = null, shadowOff = [12, 12], drawOn = 1, closed = true, opacity = 1}) => {
  const o = off ? ([off[0] * u, off[1] * u] as P) : toonReg(frame, seed, u, regK);
  const fd = pd(movePts(pts, o[0], o[1]), closed);
  const fillOp = clamp(drawOn * 1.6 - 0.4);
  const ink = line > 0 ? inkRibbon(pts, line * u, {closed: closed && drawOn >= 1, wob, seed, breaks, taper: !closed || drawOn < 1, upto: drawOn}) : '';
  return (
    <g opacity={opacity}>
      {shadow && fill && <path d={pd(movePts(pts, shadowOff[0] * u, shadowOff[1] * u), closed)} fill={shadow} opacity={fillOp} />}
      {fill && (
        <g opacity={fillOp}>
          <path d={fd} fill={fill} />
          {tooth > 0 && <path d={fd} fill={`url(#${defsId}-tooth)`} opacity={tooth * 0.6} />}
          {tooth > 0 && <path d={fd} fill={`url(#${defsId}-holes)`} opacity={tooth * 0.9} />}
        </g>
      )}
      {ink && <path d={ink} fill={lineColor} />}
    </g>
  );
};

/** two-plate toon text: colour plate offset + jittering on twos, ink on top (SVG text) */
export const ToonText: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  frame: number;
  u: number;
  font: string;
  ink?: string;
  plate?: string;
  seed?: number;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  tracking?: number;
  regK?: number;
  opacity?: number;
  textLength?: number;
}> = ({text, x, y, size, frame, u, font, ink = TOON.ink, plate = TOON.coral, seed = 3, anchor = 'start', weight = 400, tracking = 0, regK = 1, opacity = 1, textLength}) => {
  const o = toonReg(frame, seed, u, regK * 0.9, 5, 4, 1.2);
  const common = {fontFamily: font, fontSize: size, fontWeight: weight, textAnchor: anchor, letterSpacing: tracking ? `${tracking}em` : undefined} as const;
  const tl = textLength ? {textLength, lengthAdjust: 'spacingAndGlyphs' as const} : {};
  return (
    <g opacity={opacity}>
      <text x={x + o[0]} y={y + o[1]} fill={plate} {...common} {...tl}>
        {text}
      </text>
      <text x={x} y={y} fill={ink} {...common} {...tl}>
        {text}
      </text>
    </g>
  );
};

/** procedural toon icon outlines in a unit box (−1..1), scaled to s around (cx, cy) */
export type ToonIcon = 'star' | 'heart' | 'kidney' | 'boomerang' | 'drop' | 'cloud' | 'house' | 'circle' | 'burst' | 'bulb' | 'leaf' | 'blob';
export const TOON_ICONS: ToonIcon[] = ['star', 'heart', 'kidney', 'boomerang', 'drop', 'cloud', 'house', 'circle', 'burst', 'bulb', 'leaf', 'blob'];
export const toonIconPts = (kind: string, cx: number, cy: number, s: number, rot = 0): P[] => {
  const X = (pts: P[], n = 10) => xform(spline(pts, true, n), cx, cy, rot, s);
  switch (kind) {
    case 'star':
      return xform(starPts(0, 0, 1, 5, 0.45, 0), cx, cy, rot, s);
    case 'burst':
      return xform(starPts(0, 0, 1, 12, 0.62, 0), cx, cy, rot, s);
    case 'heart': {
      const out: P[] = [];
      for (let i = 0; i < 72; i++) {
        const t = (i / 72) * TAU;
        out.push([(16 * Math.pow(Math.sin(t), 3)) / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 - 0.05]);
      }
      return xform(out, cx, cy, rot, s);
    }
    case 'kidney':
      return X([[-1, -0.1], [-0.6, -0.55], [0.1, -0.45], [0.35, -0.15], [0.8, -0.45], [1.05, 0.05], [0.6, 0.5], [-0.4, 0.5]]);
    case 'boomerang':
      return X([[-1, -0.25], [-0.2, -0.05], [0.15, -0.55], [0.95, -0.2], [0.35, 0.1], [0.1, 0.45], [-0.85, 0.35]]);
    case 'drop':
      return X([[0, -1], [0.45, -0.2], [0.62, 0.3], [0.35, 0.78], [0, 0.88], [-0.35, 0.78], [-0.62, 0.3], [-0.45, -0.2]], 8);
    case 'cloud':
      return X([[-0.95, 0.35], [-0.85, -0.05], [-0.45, -0.2], [-0.25, -0.6], [0.2, -0.65], [0.45, -0.3], [0.85, -0.25], [1, 0.2], [0.75, 0.45], [-0.6, 0.48]]);
    case 'house':
      return xform([[-0.75, 0.85], [-0.75, -0.15], [-0.95, -0.15], [0, -0.95], [0.95, -0.15], [0.75, -0.15], [0.75, 0.85]], cx, cy, rot, s);
    case 'bulb':
      return X([[0, -1], [0.58, -0.78], [0.72, -0.2], [0.42, 0.32], [0.32, 0.62], [0.3, 0.92], [-0.3, 0.92], [-0.32, 0.62], [-0.42, 0.32], [-0.72, -0.2], [-0.58, -0.78]], 6);
    case 'leaf':
      return X([[0, -1], [0.55, -0.45], [0.5, 0.35], [0, 1], [-0.5, 0.35], [-0.55, -0.45]], 8);
    case 'blob':
      return X([[0, -0.9], [0.7, -0.6], [0.95, 0.1], [0.5, 0.8], [-0.3, 0.85], [-0.9, 0.3], [-0.75, -0.5]], 8);
    default:
      return ellipsePts(cx, cy, s, s, 48, 0, TAU, rot);
  }
};

// =============================================================================================== news package
export const NEWS = {
  ink: '#121417',
  ink2: '#1B1E23',
  ink3: '#22262C',
  accent: '#F2CF1D',
  accentLight: '#F8DE4A',
  accentDark: '#D8B30C',
  gold: '#D4B064',
  paper: '#F4F1E8',
  olive: '#6E5A1E',
  alarm: '#FE6B3D',
  tileTop: '#2B3038',
  tileBot: '#262A31',
};

/** news studio backdrop: ink + radial lemon glow + slow diagonal light fins + scrolling dot grid */
export const NewsStudioBg: React.FC<{id: string; frame: number; w: number; h: number; u: number; ink?: string; accent?: string; paper?: string}> = ({id, frame, w, h, u, ink = NEWS.ink, accent = NEWS.accent, paper = NEWS.paper}) => {
  const t = frame / 30;
  const fins = Array.from({length: 7}, (_, i) => {
    const wd = (40 + hash(i, 1, 5) * 120) * u;
    const speed = (30 + hash(i, 2, 5) * 36) * u;
    const span = w + 900 * u;
    const x0 = ((hash(i, 3, 5) * span + t * speed) % span) - 450 * u;
    const slant = 500 * u * (h / (1080 * u));
    const a = 0.025 + hash(i, 4, 5) * 0.035;
    return <path key={i} d={`M${x0} ${-10}L${x0 + wd} ${-10}L${x0 + wd - slant} ${h + 10}L${x0 - slant} ${h + 10}Z`} fill={accent} opacity={a} />;
  });
  const g = 48 * u;
  const off = (t * 12 * u) % g;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-glow`} cx={w * 0.68} cy={h * 0.35} r={1100 * u} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={accent} stopOpacity={0.16} />
          <stop offset="1" stopColor={accent} stopOpacity={0} />
        </radialGradient>
        <pattern id={`${id}-dots`} patternUnits="userSpaceOnUse" width={g} height={g} patternTransform={`translate(${off} ${off * 0.5})`}>
          <circle cx={g / 2} cy={g / 2} r={1.1 * u} fill={paper} opacity={0.05 / 0.05} />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={ink} />
      <rect width={w} height={h} fill={`url(#${id}-glow)`} />
      {fins}
      <rect width={w} height={h} fill={`url(#${id}-dots)`} opacity={0.05} />
    </g>
  );
};

// =============================================================================================== old film / newsreel
/** gate weave offset (px) for the picture layer */
export const filmWeave = (frame: number, u: number, amp = 1) => ({
  x: (vnoise(frame * 0.21, 0, 11) - 0.5) * 3.2 * u * amp,
  y: (vnoise(frame * 0.17 + 9, 0, 12) - 0.5) * 4.4 * u * amp,
});

/**
 * Projector damage over a picture: flicker, short-lived vertical scratches, one-frame dust, hair, vignette, optional
 * rounded pillarbox gate (aspect 1.37 newsreel / 1.333 rubber-hose). Pure function of the frame. SVG overlay.
 */
export const OldFilm: React.FC<{
  id: string;
  frame: number;
  w: number;
  h: number;
  u: number;
  gate?: number;
  radius?: number;
  flicker?: number;
  scratches?: number;
  dust?: number;
  hair?: boolean;
  vignette?: number;
  light?: string;
  dark?: string;
  gateColor?: string;
}> = ({id, frame, w, h, u, gate = 0, radius = 26, flicker = 0.035, scratches = 3, dust = 4, hair = true, vignette = 0.6, light = '#F5F2E6', dark = '#0A0A08', gateColor = '#000'}) => {
  const f = frame;
  // gate rect
  let gx = 0;
  let gy = 0;
  let gw = w;
  let gh = h;
  if (gate > 0) {
    if (w / h > gate) {
      gw = h * gate;
      gx = (w - gw) / 2;
    } else {
      gh = w / gate;
      gy = (h - gh) / 2;
    }
  }
  const fl = (hash(f * 0.37, 3) - 0.5) * 2 * flicker + (vnoise(f / 10, 0, 4) - 0.5) * flicker;
  const sc: React.ReactNode[] = [];
  for (let k = 0; k < scratches; k++) {
    const sid = Math.floor((f + 5 * k) / 9) * 7 + k;
    if (hash(1.3 * sid) > 0.55) continue;
    const x = gx + hash(2.1 * sid) * gw + (hash(f, k, 3) - 0.5) * 6 * u;
    const y0 = gy + hash(3.3 * sid) * gh * 0.4;
    const y1 = gy + gh * (0.7 + hash(4.7 * sid) * 0.3);
    const lightS = hash(5.9 * sid) > 0.5;
    sc.push(<line key={'s' + k} x1={x} y1={y0} x2={x + (hash(sid, 9) - 0.5) * 8 * u} y2={y1} stroke={lightS ? light : dark} strokeOpacity={lightS ? 0.24 : 0.3} strokeWidth={(1 + hash(6.1 * sid) * 1.6) * u} />);
  }
  const ds: React.ReactNode[] = [];
  const nd = Math.floor(hash(f, 77) * (dust + 1));
  for (let k = 0; k < nd; k++) {
    const r = (1 + hash(f, k, 21) * 4) * u;
    ds.push(<ellipse key={'d' + k} cx={gx + hash(f, k, 22) * gw} cy={gy + hash(f, k, 23) * gh} rx={r} ry={r * (0.6 + hash(f, k, 24) * 0.5)} fill={hash(f, k, 25) < 0.55 ? dark : light} opacity={0.5} />);
  }
  const win = Math.floor(f / 20);
  const showHair = hair && hash(win, 31) < 0.18;
  let hairD = '';
  if (showHair) {
    const hx = gx + hash(win, 32) * gw;
    const hy = gy + hash(win, 33) * gh;
    const pts: P[] = [];
    for (let i = 0; i < 9; i++) pts.push([hx + i * 9 * u + Math.sin(i * 1.7 + win) * 6 * u, hy + i * 6 * u + Math.cos(i * 1.3 + win) * 8 * u]);
    hairD = pd(spline(pts, false, 4), false);
  }
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <radialGradient id={`${id}-vig`} cx={gx + gw / 2} cy={gy + gh / 2} r={Math.max(gw, gh) * 0.62} gradientUnits="userSpaceOnUse">
          <stop offset="0.45" stopColor="#000" stopOpacity={0} />
          <stop offset="0.8" stopColor="#000" stopOpacity={vignette * 0.3} />
          <stop offset="1" stopColor="#000" stopOpacity={vignette} />
        </radialGradient>
      </defs>
      <rect x={gx} y={gy} width={gw} height={gh} fill={fl > 0 ? '#fff' : '#000'} opacity={Math.abs(fl)} />
      {sc}
      {ds}
      {hairD && <path d={hairD} stroke={dark} strokeOpacity={0.55} strokeWidth={1.2 * u} fill="none" />}
      <rect x={gx} y={gy} width={gw} height={gh} fill={`url(#${id}-vig)`} />
      {gate > 0 && (
        <path
          fillRule="evenodd"
          fill={gateColor}
          d={`M-2 -2H${w + 2}V${h + 2}H-2Z ${pd(rrectPts(gx, gy, gw, gh, radius * u, 6))}`}
        />
      )}
    </svg>
  );
};

/** silver Art-Deco gradient defs (hard break at 48/52 %) */
export const SilverDefs: React.FC<{id: string; y0: number; y1: number; stops?: string[]}> = ({id, y0, y1, stops = ['#FFFFFF', '#D9D4CA', '#9E978A', '#EFEBE2']}) => (
  <linearGradient id={id} x1="0" y1={y0} x2="0" y2={y1} gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor={stops[0]} />
    <stop offset="0.48" stopColor={stops[1]} />
    <stop offset="0.52" stopColor={stops[2]} />
    <stop offset="1" stopColor={stops[3]} />
  </linearGradient>
);

// =============================================================================================== grease pencil
/** a wobbly loop that overshoots past its start (newsreel grease pencil) */
export const greaseRing = (cx: number, cy: number, rx: number, ry: number, rot: number, seed: number, u: number, n = 64): P[] => {
  const out: P[] = [];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const a = -2.2 + (i / n) * 1.12 * TAU;
    const k = 1 + 0.05 * Math.sin(0.7 * i + seed) - 0.06 * (i / n);
    const x = Math.cos(a) * rx * k + (hash(i, seed, 1) - 0.5) * 1.6 * u;
    const y = Math.sin(a) * ry * k + (hash(i, seed, 2) - 0.5) * 1.6 * u;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
};
/** slightly wavy underline */
export const greaseUnderline = (x0: number, x1: number, y: number, seed: number, u: number): P[] => {
  const out: P[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    out.push([lerp(x0, x1, t), y + Math.sin(9 * t + seed) * 2 * u + t * 3 * u + (hash(i, seed, 3) - 0.5) * 1.2 * u]);
  }
  return out;
};
/** arrow: slightly bowed shaft + two barbs (returns [shaft, barb1, barb2]) */
export const greaseArrow = (from: P, to: P, seed: number, u: number): [P[], P[], P[]] => {
  const shaft: P[] = [];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const L0 = Math.hypot(dx, dy) || 1;
  const nx = -dy / L0;
  const ny = dx / L0;
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const bow = Math.sin(Math.PI * t) * L0 * 0.06 * (hash(seed, 4) > 0.5 ? 1 : -1);
    shaft.push([from[0] + dx * t + nx * bow + (hash(i, seed, 5) - 0.5) * u, from[1] + dy * t + ny * bow + (hash(i, seed, 6) - 0.5) * u]);
  }
  const a = Math.atan2(to[1] - shaft[16][1], to[0] - shaft[16][0]);
  const bl = Math.min(60 * u, L0 * 0.28);
  const b1: P[] = [to, [to[0] - Math.cos(a - 0.5) * bl, to[1] - Math.sin(a - 0.5) * bl]];
  const b2: P[] = [to, [to[0] - Math.cos(a + 0.5) * bl, to[1] - Math.sin(a + 0.5) * bl]];
  return [shaft, b1, b2];
};
/** waxy pencil stroke: main pass + thinner offset pass; p = drawn fraction */
export const PencilStroke: React.FC<{pts: P[]; p: number; color: string; width: number; u: number; double?: boolean; filter?: string; opacity?: number}> = ({pts, p, color, width, u, double = true, filter, opacity = 0.92}) => {
  if (p <= 0) return null;
  const sp = subpath(pts, p);
  if (sp.length < 2) return null;
  const d = pd(sp, false);
  return (
    <g filter={filter}>
      <path d={d} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {double && <path d={d} transform={`translate(${1.6 * u} ${-1.2 * u})`} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={width * 0.55} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
};
/** rough waxy edge filter for pencil marks */
export const WaxFilter: React.FC<{id: string; u: number}> = ({id, u}) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency={0.35 / u} numOctaves={2} seed={7} result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6 * u} xChannelSelector="R" yChannelSelector="G" />
  </filter>
);

// =============================================================================================== newspaper (procedural)
/**
 * A silver-toned broadsheet front page drawn in a W×H box at (0,0): masthead, dateline rules, a big condensed
 * headline, subhead, a photo box and ragged text columns. Returns key anchor points for annotations.
 */
export const newspaperLayout = (W: number, H: number) => ({
  headline: {x: W * 0.06, y: H * 0.205, w: W * 0.88, h: H * 0.115},
  photo: {x: W * 0.06, y: H * 0.39, w: W * 0.55, h: H * 0.3},
  pull: {x: W * 0.65, y: H * 0.39, w: W * 0.29, h: H * 0.3},
});
export const Newspaper: React.FC<{
  W: number;
  H: number;
  masthead: string;
  headline: string;
  subhead: string;
  dateline: string;
  seed?: number;
  paper?: string;
  ink?: string;
  serif: string;
  condensed: string;
  id: string;
}> = ({W, H, masthead, headline, subhead, dateline, seed = 3, paper = '#E9E4D6', ink = '#1C1A17', serif, condensed, id}) => {
  const Lr = newspaperLayout(W, H);
  const cols = 4;
  const colW = (W * 0.88 - (cols - 1) * W * 0.025) / cols;
  const lines: React.ReactNode[] = [];
  const lh = H * 0.0145;
  for (let c = 0; c < cols; c++) {
    const x = W * 0.06 + c * (colW + W * 0.025);
    const yStart = c < 2 ? H * 0.71 : c === 2 ? H * 0.71 : H * 0.71;
    for (let i = 0; i < 18; i++) {
      const y = yStart + i * lh * 1.55;
      if (y > H * 0.955) break;
      const isPara = hash(c, i, seed) < 0.1;
      const wl = isPara ? colW * (0.35 + hash(c, i, seed + 1) * 0.4) : colW * (0.9 + hash(c, i, seed + 2) * 0.1);
      lines.push(<rect key={c + '-' + i} x={x} y={y} width={wl} height={lh * 0.62} fill={ink} opacity={0.42} />);
    }
  }
  for (let i = 0; i < 9; i++) lines.push(<rect key={'p' + i} x={Lr.pull.x} y={Lr.pull.y + H * 0.06 + i * lh * 1.55} width={Lr.pull.w * (i === 8 ? 0.6 : 0.95)} height={lh * 0.62} fill={ink} opacity={0.42} />);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-ph`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B9B3A6" />
          <stop offset="0.55" stopColor="#7B766C" />
          <stop offset="1" stopColor="#3C3934" />
        </linearGradient>
        <filter id={`${id}-pp`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.012 * (1000 / W)} numOctaves={3} seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={paper} />
      <rect width={W} height={H} fill={paper} filter={`url(#${id}-pp)`} />
      <text x={W / 2} y={H * 0.085} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={H * 0.062} fill={ink} textLength={W * 0.84} lengthAdjust="spacingAndGlyphs">
        {masthead}
      </text>
      <rect x={W * 0.06} y={H * 0.105} width={W * 0.88} height={H * 0.004} fill={ink} />
      <text x={W * 0.06} y={H * 0.128} fontFamily={serif} fontWeight={500} fontSize={H * 0.016} fill={ink}>
        {dateline}
      </text>
      <text x={W * 0.94} y={H * 0.128} textAnchor="end" fontFamily={serif} fontWeight={500} fontSize={H * 0.016} fill={ink}>
        PRICE TWO CENTS
      </text>
      <rect x={W * 0.06} y={H * 0.138} width={W * 0.88} height={H * 0.0018} fill={ink} />
      <text x={W / 2} y={Lr.headline.y + Lr.headline.h * 0.86} textAnchor="middle" fontFamily={condensed} fontWeight={600} fontSize={Lr.headline.h * 1.02} fill={ink} textLength={Lr.headline.w} lengthAdjust="spacingAndGlyphs">
        {headline}
      </text>
      <text x={W / 2} y={H * 0.36} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={H * 0.026} fill={ink} textLength={Math.min(W * 0.8, subhead.length * H * 0.014)} lengthAdjust="spacingAndGlyphs">
        {subhead}
      </text>
      <rect x={Lr.photo.x} y={Lr.photo.y} width={Lr.photo.w} height={Lr.photo.h} fill={`url(#${id}-ph)`} />
      {/* skyline silhouette in the photo */}
      <path
        d={(() => {
          let d = `M${Lr.photo.x} ${Lr.photo.y + Lr.photo.h}`;
          let x = Lr.photo.x;
          let i = 0;
          while (x < Lr.photo.x + Lr.photo.w) {
            const bw = Lr.photo.w * (0.05 + hash(i, seed, 9) * 0.07);
            const bh = Lr.photo.h * (0.25 + hash(i, seed, 10) * 0.45);
            d += `L${x} ${Lr.photo.y + Lr.photo.h - bh}L${Math.min(x + bw, Lr.photo.x + Lr.photo.w)} ${Lr.photo.y + Lr.photo.h - bh}`;
            x += bw;
            i++;
          }
          return d + `L${Lr.photo.x + Lr.photo.w} ${Lr.photo.y + Lr.photo.h}Z`;
        })()}
        fill="#24221E"
      />
      <circle cx={Lr.photo.x + Lr.photo.w * 0.78} cy={Lr.photo.y + Lr.photo.h * 0.24} r={Lr.photo.h * 0.09} fill="#E8E3D6" opacity={0.85} />
      <rect x={Lr.photo.x} y={Lr.photo.y} width={Lr.photo.w} height={Lr.photo.h} fill="none" stroke={ink} strokeWidth={H * 0.002} />
      <rect x={Lr.pull.x} y={Lr.pull.y} width={Lr.pull.w} height={H * 0.04} fill={ink} />
      <text x={Lr.pull.x + Lr.pull.w / 2} y={Lr.pull.y + H * 0.028} textAnchor="middle" fontFamily={condensed} fontWeight={600} fontSize={H * 0.024} fill={paper}>
        LATE EDITION
      </text>
      {lines}
      <rect x={W * 0.06} y={H * 0.7} width={W * 0.88} height={H * 0.0018} fill={ink} />
    </g>
  );
};

// =============================================================================================== pen / one-line
/** variable-width ribbon (samples carry their own half-width) -> one filled path */
export const widthRibbon = (S: {x: number; y: number; r: number}[]) => {
  if (S.length < 2) return '';
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i < S.length; i++) {
    const a = S[Math.max(0, i - 1)];
    const b = S[Math.min(S.length - 1, i + 1)];
    let nx = -(b.y - a.y);
    let ny = b.x - a.x;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    left.push([S[i].x + nx * S[i].r, S[i].y + ny * S[i].r]);
    right.push([S[i].x - nx * S[i].r, S[i].y - ny * S[i].r]);
  }
  const e = S[S.length - 1];
  const s0 = S[0];
  return (
    pd([...left, ...right.reverse()]) +
    `M${(s0.x - s0.r).toFixed(1)} ${s0.y.toFixed(1)}a${s0.r.toFixed(2)} ${s0.r.toFixed(2)} 0 1 0 ${(2 * s0.r).toFixed(2)} 0a${s0.r.toFixed(2)} ${s0.r.toFixed(2)} 0 1 0 ${(-2 * s0.r).toFixed(2)} 0` +
    `M${(e.x - e.r).toFixed(1)} ${e.y.toFixed(1)}a${e.r.toFixed(2)} ${e.r.toFixed(2)} 0 1 0 ${(2 * e.r).toFixed(2)} 0a${e.r.toFixed(2)} ${e.r.toFixed(2)} 0 1 0 ${(-2 * e.r).toFixed(2)} 0`
  );
};

/**
 * Ink blot teardrop at a pen stop (one-line ink.js drawBlots, re-derived): g = growth 0..1; the tip stays at the nib,
 * the belly sinks as it grows; irregular rim. Returns path d around (x, y). lineW and units in px.
 */
export const blotPath = (x: number, y: number, g: number, lineW: number, size: number, seed: number) => {
  const R = 0.7 * lineW + 9.5 * size * g;
  const sink = R * (0.25 + 0.9 * g);
  const pts: P[] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * TAU;
    let px = Math.cos(a);
    let py = Math.sin(a);
    const rim = 1 + (vnoise(i / 9, 0, seed) - 0.5) * 0.26 + (vnoise(i / 3.5, 2, seed) - 0.5) * 0.1;
    px *= rim;
    py *= rim;
    if (py < 0) {
      const up = Math.pow(-py, 1.6) * 0.9 * g;
      px *= 1 - 0.72 * up;
      py *= 1 + 0.95 * up;
    }
    pts.push([x + px * R, y + sink + py * R]);
  }
  return {d: pd(spline(pts, true, 2)), R, cy: y + sink};
};

// =============================================================================================== follow camera
export type CamKey = {f: number; x: number; y: number; z: number; roll?: number; follow?: number};
/**
 * Nib-follow camera (one-line cam.js, re-derived): keys interpolated with smoothstep (zoom in log space); the follow
 * point is a Gaussian-weighted mean of the nib over t−0.55 s … t+0.4 s; centre = lerp(key, follow, f); a soft clamp
 * keeps the nib inside ±0.36 W / ±0.33 H of the screen. Returns the world point at screen centre, scale and roll (deg).
 */
export const camAt = (frame: number, keys: CamKey[], posAt: (f: number) => P, viewW: number, viewH: number, fps = 30) => {
  const ks = [...keys].sort((a, b) => a.f - b.f);
  let k0 = ks[0];
  let k1 = ks[ks.length - 1];
  for (let i = 0; i < ks.length - 1; i++) if (frame >= ks[i].f && frame <= ks[i + 1].f) {
    k0 = ks[i];
    k1 = ks[i + 1];
    break;
  }
  if (frame < ks[0].f) k1 = k0;
  if (frame > ks[ks.length - 1].f) k0 = k1;
  const t = k1.f > k0.f ? ss((frame - k0.f) / (k1.f - k0.f)) : 0;
  const z = Math.exp(lerp(Math.log(k0.z), Math.log(k1.z), t));
  const kx = lerp(k0.x, k1.x, t);
  const ky = lerp(k0.y, k1.y, t);
  const fw = lerp(k0.follow ?? 0.7, k1.follow ?? 0.7, t);
  const roll = lerp(k0.roll ?? 0, k1.roll ?? 0, t);
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (let j = -11; j <= 8; j++) {
    const wgt = Math.exp(-((j + 1.5) * (j + 1.5)) / 40);
    const p = posAt(frame + j * 0.05 * fps);
    sx += p[0] * wgt;
    sy += p[1] * wgt;
    sw += wgt;
  }
  let cx = lerp(kx, sx / sw, fw);
  let cy = lerp(ky, sy / sw, fw);
  const nib = posAt(frame);
  const lx = (0.36 * viewW) / z;
  const ly = (0.33 * viewH) / z;
  const ex = nib[0] - cx;
  const ey = nib[1] - cy;
  if (Math.abs(ex) > lx) cx += ex - Math.sign(ex) * lx;
  if (Math.abs(ey) > ly) cy += ey - Math.sign(ey) * ly;
  return {cx, cy, z, roll};
};

// =============================================================================================== papercut rosette
/**
 * One 45° wedge of a D4 window flower (团花) of radius TR: scalloped outline + cut-motif holes (all in wedge-local
 * coordinates, angle 0…π/4 measured from +x, y down). Holes that straddle the wedge's edges are fine: neighbouring
 * wedges are mirror images, so they join into whole motifs.
 */
export const rosetteWedge = (TR: number, motifs: string[] = ['saw', 'crescent', 'slit', 'coin', 'petal', 'dots']) => {
  const A = Math.PI / 4;
  const outline: P[] = [[0, 0]];
  for (let i = 0; i <= 40; i++) {
    const a = (A * i) / 40;
    const r = TR * (0.9 + 0.1 * Math.pow(Math.abs(Math.cos(8 * a)), 0.6));
    outline.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const P2 = (r: number, a: number): P => [Math.cos(a) * r, Math.sin(a) * r];
  const holes: string[] = [];
  const has = (m: string) => motifs.includes(m);
  // centre: small disc hole + 8 tapered petal slits
  holes.push(`M${0.05 * TR} 0A${0.05 * TR} ${0.05 * TR} 0 1 0 ${-0.05 * TR} 0A${0.05 * TR} ${0.05 * TR} 0 1 0 ${0.05 * TR} 0Z`);
  if (has('petal')) {
    // a petal (lens) centred on the wedge bisector
    const a = A / 2;
    const r0 = 0.09 * TR;
    const r1 = 0.24 * TR;
    const wdt = 0.05 * TR;
    const p0 = P2(r0, a);
    const p1 = P2(r1, a);
    const m = P2((r0 + r1) / 2, a);
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    holes.push(`M${p0[0]} ${p0[1]}Q${m[0] + nx * wdt * 2} ${m[1] + ny * wdt * 2} ${p1[0]} ${p1[1]}Q${m[0] - nx * wdt * 2} ${m[1] - ny * wdt * 2} ${p0[0]} ${p0[1]}Z`);
  }
  if (has('slit')) {
    // tapered radial slits on the wedge edges (become whole slits with the mirror)
    for (const [a, r0, r1] of [
      [0, 0.12, 0.26],
      [A, 0.12, 0.26],
    ] as [number, number, number][]) {
      const nx = -Math.sin(a);
      const ny = Math.cos(a);
      const wd = 0.018 * TR;
      const p0 = P2(r0 * TR, a);
      const p1 = P2(r1 * TR, a);
      holes.push(pd([p0, [((p0[0] + p1[0]) / 2) + nx * wd, ((p0[1] + p1[1]) / 2) + ny * wd], p1, [((p0[0] + p1[0]) / 2) - nx * wd, ((p0[1] + p1[1]) / 2) - ny * wd]]));
    }
  }
  if (has('crescent')) {
    // two crescents (difference of offset circles) across the ring 0.3–0.42
    for (const a of [A * 0.25, A * 0.75]) {
      const c = P2(0.36 * TR, a);
      const r = 0.055 * TR;
      const o = P2(0.385 * TR, a);
      const ro = 0.045 * TR;
      // crescent = circle minus offset circle, drawn as a single outline via arcs
      const ang = a;
      const tip1: P = [c[0] + Math.cos(ang + 1.9) * r, c[1] + Math.sin(ang + 1.9) * r];
      const tip2: P = [c[0] + Math.cos(ang - 1.9) * r, c[1] + Math.sin(ang - 1.9) * r];
      holes.push(`M${tip1[0]} ${tip1[1]}A${r} ${r} 0 1 0 ${tip2[0]} ${tip2[1]}A${ro} ${ro} 0 1 1 ${tip1[0]} ${tip1[1]}Z`);
      void o;
    }
  }
  if (has('saw')) {
    // sawtooth band: a row of triangles along an arc (teeth outward) at 0.46–0.52 and inward at 0.78–0.84
    const band = (rIn: number, rOut: number, n: number, outward: boolean) => {
      for (let i = 0; i < n; i++) {
        const a0 = (A * i) / n;
        const a1 = (A * (i + 1)) / n;
        const am = (a0 + a1) / 2;
        const base = outward ? rIn : rOut;
        const tip = outward ? rOut : rIn;
        holes.push(pd([P2(base * TR, a0 + 0.004), P2(tip * TR, am), P2(base * TR, a1 - 0.004)]));
      }
    };
    band(0.46, 0.53, 5, true);
    band(0.79, 0.85, 7, false);
    // thin ring slit under each saw band
    const ring = (r: number, wd: number) => {
      const a = P2((r - wd) * TR, 0);
      const b = P2((r + wd) * TR, 0);
      const c = P2((r + wd) * TR, A);
      const d = P2((r - wd) * TR, A);
      holes.push(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}A${(r + wd) * TR} ${(r + wd) * TR} 0 0 1 ${c[0]} ${c[1]}L${d[0]} ${d[1]}A${(r - wd) * TR} ${(r - wd) * TR} 0 0 0 ${a[0]} ${a[1]}Z`);
    };
    ring(0.44, 0.008);
    ring(0.87, 0.008);
  }
  if (has('coin')) {
    // coin: ring hole with a square island, on the bisector at r 0.64; plus half coins on the edges
    for (const [a, r, s] of [
      [A / 2, 0.64, 0.07],
      [0, 0.64, 0.05],
      [A, 0.64, 0.05],
    ] as [number, number, number][]) {
      const c = P2(r * TR, a);
      const R = s * TR;
      const q = R * 0.42;
      holes.push(
        `M${c[0] + R} ${c[1]}A${R} ${R} 0 1 0 ${c[0] - R} ${c[1]}A${R} ${R} 0 1 0 ${c[0] + R} ${c[1]}Z` +
          `M${c[0] - q} ${c[1] - q}L${c[0] - q} ${c[1] + q}L${c[0] + q} ${c[1] + q}L${c[0] + q} ${c[1] - q}Z`,
      );
    }
  }
  if (has('dots')) {
    for (let i = 0; i <= 4; i++) {
      const c = P2(0.935 * TR * (0.97 + 0.03 * Math.abs(Math.cos(8 * ((A * i) / 4)))), (A * i) / 4);
      const r = 0.012 * TR;
      holes.push(`M${c[0] + r} ${c[1]}A${r} ${r} 0 1 0 ${c[0] - r} ${c[1]}A${r} ${r} 0 1 0 ${c[0] + r} ${c[1]}Z`);
    }
    for (let i = 0; i < 3; i++) {
      const a = (A * (i + 0.5)) / 3;
      const c = P2(0.71 * TR, a);
      const r = 0.016 * TR;
      if (i === 1) continue;
      holes.push(`M${c[0] + r} ${c[1]}A${r} ${r} 0 1 0 ${c[0] - r} ${c[1]}A${r} ${r} 0 1 0 ${c[0] + r} ${c[1]}Z`);
    }
  }
  return {outline, holes};
};
/** the 8 D4 transforms (SVG transform strings) for a wedge at the origin */
export const D4 = ['rotate(0)', 'rotate(90)', 'rotate(180)', 'rotate(270)', 'matrix(0 1 1 0 0 0)', 'rotate(90) matrix(0 1 1 0 0 0)', 'rotate(180) matrix(0 1 1 0 0 0)', 'rotate(270) matrix(0 1 1 0 0 0)'];

/** a full rosette (8 masked wedges) centred at origin; fill can be a colour or url() */
export const Rosette: React.FC<{id: string; TR: number; fill: string; motifs?: string[]; holeFill?: string}> = ({id, TR, fill, motifs, holeFill}) => {
  const wedge = React.useMemo(() => rosetteWedge(TR, motifs), [TR, motifs]);
  return (
    <g>
      <defs>
        <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={-TR * 1.2} y={-TR * 1.2} width={TR * 2.4} height={TR * 2.4}>
          <path d={pd(wedge.outline)} fill="#fff" />
          {wedge.holes.map((h, i) => (
            <path key={i} d={h} fill="#000" fillRule="evenodd" />
          ))}
        </mask>
        <g id={`${id}-w`}>
          {holeFill && <path d={pd(wedge.outline)} fill={holeFill} />}
          <path d={pd(wedge.outline)} fill={fill} mask={`url(#${id}-wm)`} />
        </g>
      </defs>
      {D4.map((t, i) => (
        <use key={i} href={`#${id}-w`} transform={t} />
      ))}
    </g>
  );
};

// =============================================================================================== paper-lantern clouds
/** xiangyun (auspicious cloud): a flat base with three spiral-carved heads; returns {body d, spirals d} at (x,y), size r */
export const xiangyun = (x: number, y: number, r: number, flip = false) => {
  const heads: [number, number, number][] = [
    [-0.9, 0.05, 0.62],
    [0, -0.35, 0.85],
    [0.95, 0.02, 0.6],
  ];
  const s = flip ? -1 : 1;
  let body = '';
  let spir = '';
  for (const [hx, hy, hr] of heads) {
    const cx = x + hx * r * s;
    const cy = y + hy * r;
    const R = hr * r;
    body += `M${cx + R} ${cy}A${R} ${R} 0 1 0 ${cx - R} ${cy}A${R} ${R} 0 1 0 ${cx + R} ${cy}Z`;
    const pts: P[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = s * t * 1.7 * TAU + Math.PI * 0.5;
      const rr = R * (0.75 - 0.6 * t);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    spir += pd(pts, false);
  }
  // tail
  body += pd([
    [x - 1.6 * r * s, y + 0.62 * r],
    [x + 1.9 * r * s, y + 0.62 * r],
    [x + 1.5 * r * s, y + 0.42 * r],
    [x - 1.2 * r * s, y + 0.3 * r],
  ]);
  return {body, spir};
};

// =============================================================================================== sticker border
/**
 * Die-cut sticker finish as an SVG filter on SourceAlpha: rounded off-white border (blur + threshold, so corners
 * stay round), a grey cardboard edge peeking out below it, and a cut-out shaped soft shadow.
 */
export const StickerFilter: React.FC<{id: string; u: number; width?: number; color?: string; edge?: string; edgeWidth?: number; edgeOffset?: number; shadow?: number; shadowColor?: string; shadowBlur?: number; shadowOff?: P}> = ({
  id,
  u,
  width = 14,
  color = '#FFFDF7',
  edge = '#B9AD9C',
  edgeWidth = 2.5,
  edgeOffset = 1.5,
  shadow = 0.3,
  shadowColor = '#3A2A24',
  shadowBlur = 10,
  shadowOff = [6, 10],
}) => {
  const sb = (width * u) / 2.05;
  const se = ((width + edgeWidth) * u) / 2.05;
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation={se} result="eb" />
      <feComponentTransfer in="eb" result="ea">
        <feFuncA type="linear" slope={40} intercept={-0.8} />
      </feComponentTransfer>
      <feGaussianBlur in="SourceAlpha" stdDeviation={sb} result="bb" />
      <feComponentTransfer in="bb" result="ba">
        <feFuncA type="linear" slope={40} intercept={-0.8} />
      </feComponentTransfer>
      <feGaussianBlur in="ea" stdDeviation={shadowBlur * u} result="sb" />
      <feOffset in="sb" dx={shadowOff[0] * u} dy={shadowOff[1] * u} result="so" />
      <feFlood floodColor={shadowColor} floodOpacity={shadow} />
      <feComposite in2="so" operator="in" result="shadow" />
      <feOffset in="ea" dy={edgeOffset * u} result="eo" />
      <feFlood floodColor={edge} />
      <feComposite in2="eo" operator="in" result="edge" />
      <feFlood floodColor={color} />
      <feComposite in2="ba" operator="in" result="border" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="edge" />
        <feMergeNode in="border" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
};
/** paper fibre grain (multiply) filter for card art */
export const PaperGrainFilter: React.FC<{id: string; u: number; amount?: number; seed?: number}> = ({id, u, amount = 0.18, seed = 4}) => (
  <filter id={id} x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency={0.9 / u} numOctaves={2} seed={seed} result="n" />
    <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 ${amount * 1.6} 0`} result="g" />
    <feComposite in="g" in2="SourceGraphic" operator="in" result="gi" />
    <feMerge>
      <feMergeNode in="SourceGraphic" />
      <feMergeNode in="gi" />
    </feMerge>
  </filter>
);

// =============================================================================================== motif grid (pictogram)
export type MotifShape = {row: number; rows: number[]; el: React.ReactNode};
const MOTIF_KINDS = ['quarter', 'fish', 'dots', 'tri', 'sunset', 'arcs', 'wheel', 'checker', 'crescent', 'swave', 'gradq', 'bars', 'half', 'ring'] as const;
export type MotifKind = (typeof MOTIF_KINDS)[number];
export const ALL_MOTIFS: string[] = [...MOTIF_KINDS];

/** one motif in a cell at (x,y) side s, rotated k·90° about the cell centre */
const motifEl = (kind: string, x: number, y: number, s: number, k: number, a: string, b: string, key: string, cid: string): React.ReactNode => {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const T = `rotate(${k * 90} ${cx} ${cy})`;
  const inner = (() => {
    switch (kind) {
      case 'quarter':
        return <path d={`M${x} ${y}L${x + s} ${y}A${s} ${s} 0 0 1 ${x} ${y + s}Z`} fill={a} />;
      case 'fish': {
        const els: React.ReactNode[] = [];
        const n = 3;
        const r = s / n / 2;
        for (let j = 0; j < n + 1; j++)
          for (let i = 0; i < n; i++) {
            const ox = x + r + i * 2 * r + (j % 2 ? r : 0);
            const oy = y + j * r * 1.3;
            if (ox - r > x + s || oy > y + s) continue;
            els.push(<path key={i + '-' + j} d={`M${ox - r} ${oy}A${r} ${r} 0 0 0 ${ox + r} ${oy}`} fill="none" stroke={a} strokeWidth={r * 0.32} />);
          }
        return <g clipPath={`url(#${cid})`}>{els}</g>;
      }
      case 'dots': {
        const els: React.ReactNode[] = [];
        const n = 4;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) els.push(<circle key={i + '-' + j} cx={x + (i + 0.5) * (s / n)} cy={y + (j + 0.5) * (s / n)} r={s / n / 3.2} fill={(i + j) % 2 ? a : b} />);
        return <>{els}</>;
      }
      case 'tri': {
        const els: React.ReactNode[] = [];
        const n = 4;
        const tw = s / n;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) els.push(<path key={i + '-' + j} d={`M${x + i * tw} ${y + (j + 1) * tw}L${x + (i + 0.5) * tw} ${y + j * tw}L${x + (i + 1) * tw} ${y + (j + 1) * tw}Z`} fill={j % 2 ? a : b} />);
        return <>{els}</>;
      }
      case 'sunset': {
        const els: React.ReactNode[] = [<path key="h" d={`M${x} ${y + s}A${s / 2} ${s / 2} 0 0 1 ${x + s} ${y + s}Z`} fill={a} />];
        for (let i = 0; i < 4; i++) els.push(<rect key={i} x={x} y={y + s - (i + 1) * s * 0.11} width={s} height={s * 0.04} fill={b} />);
        return <g clipPath={`url(#${cid})`}>{els}</g>;
      }
      case 'arcs': {
        const els: React.ReactNode[] = [];
        for (let i = 4; i >= 1; i--) els.push(<path key={i} d={`M${x} ${y + s}L${x} ${y + s - (s * i) / 4}A${(s * i) / 4} ${(s * i) / 4} 0 0 1 ${x + (s * i) / 4} ${y + s}Z`} fill={i % 2 ? a : b} />);
        return <>{els}</>;
      }
      case 'wheel': {
        const els: React.ReactNode[] = [<circle key="c" cx={cx} cy={cy} r={s * 0.42} fill={a} />];
        for (let i = 0; i < 12; i++) {
          const an = (i / 12) * TAU;
          els.push(<path key={i} d={`M${cx} ${cy}L${cx + Math.cos(an) * s * 0.42} ${cy + Math.sin(an) * s * 0.42}L${cx + Math.cos(an + 0.22) * s * 0.42} ${cy + Math.sin(an + 0.22) * s * 0.42}Z`} fill={b} />);
        }
        els.push(<circle key="h" cx={cx} cy={cy} r={s * 0.12} fill={b} />);
        return <>{els}</>;
      }
      case 'checker': {
        const els: React.ReactNode[] = [];
        const n = 4;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if ((i + j) % 2) els.push(<rect key={i + '-' + j} x={x + (i * s) / n} y={y + (j * s) / n} width={s / n} height={s / n} fill={a} />);
        return <>{els}</>;
      }
      case 'crescent':
        return <path fillRule="evenodd" d={`M${cx + s * 0.4} ${cy}A${s * 0.4} ${s * 0.4} 0 1 0 ${cx - s * 0.4} ${cy}A${s * 0.4} ${s * 0.4} 0 1 0 ${cx + s * 0.4} ${cy}ZM${cx + s * 0.52} ${cy - s * 0.12}A${s * 0.34} ${s * 0.34} 0 1 0 ${cx - s * 0.16} ${cy - s * 0.12}A${s * 0.34} ${s * 0.34} 0 1 0 ${cx + s * 0.52} ${cy - s * 0.12}Z`} fill={a} />;
      case 'swave':
        return (
          <>
            <path d={`M${x} ${cy}A${s / 4} ${s / 4} 0 0 1 ${cx} ${cy}A${s / 4} ${s / 4} 0 0 0 ${x + s} ${cy}L${x + s} ${y + s}L${x} ${y + s}Z`} fill={a} />
          </>
        );
      case 'gradq': {
        const els: React.ReactNode[] = [];
        const cols = [a, mix(a, b, 0.5), b];
        for (let i = 3; i >= 1; i--) els.push(<path key={i} d={`M${x + s} ${y + s}L${x + s - (s * i) / 3} ${y + s}A${(s * i) / 3} ${(s * i) / 3} 0 0 1 ${x + s} ${y + s - (s * i) / 3}Z`} fill={cols[i - 1]} />);
        return <>{els}</>;
      }
      case 'bars': {
        const els: React.ReactNode[] = [];
        for (let i = 0; i < 6; i++) els.push(<rect key={i} x={x + (i * s) / 6} y={y} width={(s / 6) * (1 - i / 7)} height={s} fill={a} />);
        return <>{els}</>;
      }
      case 'half':
        return <path d={`M${x} ${y}A${s / 2} ${s / 2} 0 0 0 ${x + s} ${y}Z`} fill={a} />;
      case 'ring':
      default:
        return <path fillRule="evenodd" d={`M${cx + s * 0.42} ${cy}A${s * 0.42} ${s * 0.42} 0 1 0 ${cx - s * 0.42} ${cy}A${s * 0.42} ${s * 0.42} 0 1 0 ${cx + s * 0.42} ${cy}ZM${cx + s * 0.22} ${cy}A${s * 0.22} ${s * 0.22} 0 1 0 ${cx - s * 0.22} ${cy}A${s * 0.22} ${s * 0.22} 0 1 0 ${cx + s * 0.22} ${cy}Z`} fill={a} />;
    }
  })();
  return (
    <g key={key} transform={T}>
      {inner}
    </g>
  );
};

/**
 * Pictogram "core graphic": square cells carrying big discs / half-discs straddling grid nodes and small geometric
 * motifs in five tones of one hue. Rows slide against each other (odd right, even left), breathing on a sine and
 * jumping a quarter cell on beats. Returns SVG (full frame). Tones: t0..t4, bg = t1.
 */
export const MotifGrid: React.FC<{
  id: string;
  frame: number;
  w: number;
  h: number;
  cell: number;
  tones: string[];
  spread?: number;
  density?: number;
  seed?: number;
  motifs?: string[];
  rowDrift?: number;
  bpm?: number;
  beatJump?: boolean;
  sweep?: boolean;
  background?: boolean;
}> = ({id, frame, w, h, cell, tones, spread = 0.42, density = 0.5, seed = 7, motifs = ALL_MOTIFS, rowDrift = 26, bpm = 150, beatJump = true, sweep = true, background = true}) => {
  const bg = tones[1];
  const T = tones.map((t) => mix(bg, t, spread));
  const rows = Math.ceil(h / cell) + 1;
  const cols = Math.ceil(w / cell) + 4;
  const x0 = -2 * cell;
  const built = React.useMemo(() => {
    const perRow: React.ReactNode[][] = Array.from({length: rows}, () => []);
    const R = (i: number, j: number, k: number) => hash(i + seed * 0.37, j + seed * 0.11, k);
    // big discs at grid nodes (span the two rows around the node)
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        const r = R(i, j, 1);
        const cxp = x0 + i * cell;
        const cyp = j * cell;
        let el: React.ReactNode = null;
        if (r < 0.34) {
          const tone = T[Math.floor(R(i, j, 2) * 4)];
          const half = R(i, j, 3) < 0.4;
          if (half) {
            const rot = Math.floor(R(i, j, 4) * 4) * 90;
            el = <path key={`d${i}-${j}`} d={`M${cxp - cell} ${cyp}A${cell} ${cell} 0 0 1 ${cxp + cell} ${cyp}Z`} fill={tone} transform={`rotate(${rot} ${cxp} ${cyp})`} />;
          } else el = <circle key={`d${i}-${j}`} cx={cxp} cy={cyp} r={cell} fill={tone} />;
        } else if (r < 0.5) {
          el = (
            <g key={`d${i}-${j}`}>
              <circle cx={cxp} cy={cyp} r={cell} fill={T[3]} />
              <circle cx={cxp} cy={cyp} r={cell / 2} fill={T[0]} />
            </g>
          );
        }
        if (el) {
          if (j - 1 >= 0 && j - 1 < rows) perRow[j - 1].push(el);
          if (j < rows) perRow[j].push(el);
        }
      }
    // motif cells
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        if (R(i, j, 5) > density) continue;
        const kind = motifs[Math.floor(R(i, j, 6) * motifs.length) % motifs.length];
        const ta = Math.floor(R(i, j, 7) * 5);
        const tb = (ta + 2 + Math.floor(R(i, j, 8) * 2)) % 5;
        const x = x0 + i * cell;
        const y = j * cell;
        const cid = `${id}-c${i}-${j}`;
        perRow[j].push(
          <g key={`m${i}-${j}`}>
            <defs>
              <clipPath id={cid}>
                <rect x={x} y={y} width={cell} height={cell} />
              </clipPath>
            </defs>
            <rect x={x} y={y} width={cell} height={cell} fill={T[(ta + 1) % 5]} opacity={R(i, j, 9) < 0.5 ? 1 : 0} />
            {motifEl(kind, x, y, cell, Math.floor(R(i, j, 10) * 4), T[ta], T[tb], `mm${i}-${j}`, cid)}
          </g>,
        );
      }
    return perRow;
  }, [rows, cols, cell, seed, density, motifs.join(','), T.join(','), id]);
  const t = frame / 30;
  const beat = (t * bpm) / 60;
  return (
    <g>
      <defs>
        {Array.from({length: rows}, (_, j) => (
          <clipPath key={j} id={`${id}-row${j}`}>
            <rect x={0} y={j * cell} width={w} height={cell + 0.5} />
          </clipPath>
        ))}
        <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.09} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      {background && <rect width={w} height={h} fill={bg} />}
      {built.map((els, j) => {
        const alt = j % 2 ? 1 : -1;
        let dx = clamp(alt * rowDrift * (cell / 180) * t + Math.sin(j * 1.7 + t * 0.6) * cell * 0.12, -cell * 1.4, cell * 1.4);
        if (beatJump) {
          const bi = Math.floor(beat);
          const fr = beat - bi;
          const c = (bi % 8) + oExp(fr * 2.5);
          const tri = c <= 4 ? c : 8 - c;
          dx += ((alt * cell) / 4) * tri - (alt * cell) / 2;
        }
        return (
          <g key={j} clipPath={`url(#${id}-row${j})`}>
            <g transform={`translate(${dx} 0)`}>{els}</g>
          </g>
        );
      })}
      {sweep && (
        <rect
          x={((t * 0.12) % 1.6 - 0.3) * w - w * 0.2}
          y={-h * 0.5}
          width={w * 0.4}
          height={h * 2}
          fill={`url(#${id}-sweep)`}
          transform={`rotate(18 ${w / 2} ${h / 2})`}
        />
      )}
    </g>
  );
};
