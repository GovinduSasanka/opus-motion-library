/**
 * r2-x58-kit — shared helpers for the X58 group (techniques reverse-engineered from attached videos x5–x8).
 * x5 paper-cut diorama journey · x6 Klein-blue terminal + painted isometric battle · x7 arcade fighting-game
 * launch spot · x8 isometric drafting-paper hardware tutorial.
 * All designs here are original (paper critter, fighters, avatars, dev board); copy is neutral.
 * Everything is a pure function of the frame: no Math.random, no timers.
 */
import React from 'react';
import {loadFont as jacquard} from '@remotion/google-fonts/Jacquard24';
import {loadFont as plexMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as rajdhani} from '@remotion/google-fonts/Rajdhani';
import {loadFont as lilita} from '@remotion/google-fonts/LilitaOne';
import {loadFont as bangers} from '@remotion/google-fonts/Bangers';
import {loadFont as barlowSC} from '@remotion/google-fonts/BarlowSemiCondensed';
import {loadFont as barlow} from '@remotion/google-fonts/Barlow';
import {loadFont as fraunces} from '@remotion/google-fonts/Fraunces';
import {n2, rng} from './random';

/** 1-D noise helper */
export const n2Safe = (seed: string, x: number) => n2(seed, x, 0);

// ============================================================================================================
// fonts + colour
// ============================================================================================================

export const x58Fonts = {
  /** pixel blackletter display (x6 titles, wrapped in [ ]) */
  blackletter: jacquard('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** terminal / HUD body (x6, x8 code) */
  mono: plexMono('normal', {weights: ['400', '500', '600'], subsets: ['latin']}).fontFamily,
  /** light/bold geometric caps (x6 announcements, x7 sub-labels) */
  rajdhani: rajdhani('normal', {weights: ['300', '500', '700'], subsets: ['latin']}).fontFamily,
  /** heavy rounded caps (x7 names, banners) */
  lilita: lilita('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** comic exclamations (x7 FIGHT!) */
  bangers: bangers('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** semi-condensed grotesk caps (x8 labels) */
  barlowSC: barlowSC('normal', {weights: ['500', '600', '700'], subsets: ['latin']}).fontFamily,
  /** body (x8) */
  barlow: barlow('normal', {weights: ['400', '500', '600'], subsets: ['latin']}).fontFamily,
  /** soft serif for paper-world titles (x5 style) */
  fraunces: fraunces('normal', {weights: ['400', '600'], subsets: ['latin']}).fontFamily,
};

export const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s.slice(0, 6);
  const v = parseInt(f, 16);
  return Number.isFinite(v) ? [(v >> 16) & 255, (v >> 8) & 255, v & 255] : [128, 128, 128];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = Math.min(1, Math.max(0, t));
  const c = (i: number) => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0');
  return `#${c(0)}${c(1)}${c(2)}`;
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, a))})`;
};
/** lighten (t>0) or darken (t<0) a hex */
export const shadeHex = (h: string, t: number) => (t >= 0 ? mixHex(h, '#ffffff', t) : mixHex(h, '#000000', -t));
export const isTransparentBg = (bg: string | undefined) => !bg || bg === 'transparent' || bg === 'none';
export const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lin = (f: number, a: number, b: number) => cl((f - a) / Math.max(1e-6, b - a));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - cl(t), 3);
export const easeInCubic = (t: number) => Math.pow(cl(t), 3);
export const easeInOutCubic = (t: number) => {
  const x = cl(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * cl(t)) - 1) / 2;
export const easeOutQuad = (t: number) => 1 - (1 - cl(t)) * (1 - cl(t));
export const easeInQuad = (t: number) => cl(t) * cl(t);
export const easeInExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * cl(t) - 10));
export const easeOutBack = (t: number, s = 1.70158) => {
  const x = cl(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** keyframed value [[frame, value], …]; each change eases out over `ease` frames from its key frame */
export const tweenKeys = (frame: number, keys: number[][], easeF = 6) => {
  if (!keys.length) return 1;
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f, val] = keys[i];
    if (frame < f) break;
    v = v + (val - v) * easeOutCubic(lin(frame, f, f + easeF));
  }
  return v;
};
/** integer hash -> 0..1 */
export const h01 = (...n: number[]) => {
  let x = 2166136261;
  for (const v of n) {
    x ^= Math.floor(v * 1000) | 0;
    x = Math.imul(x, 16777619);
  }
  x ^= x >>> 13;
  x = Math.imul(x, 0x5bd1e995);
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
};
/** pop with overshoot: 0 -> peak -> 1 (spring-ish, deterministic) */
export const pop = (frame: number, start: number, dur = 6, peak = 1.12) => {
  const t = lin(frame, start, start + dur);
  if (t <= 0) return 0;
  if (t < 0.6) return (t / 0.6) * peak;
  return peak + (1 - peak) * easeOutCubic((t - 0.6) / 0.4);
};

// ============================================================================================================
// text helpers
// ============================================================================================================

const POOL = '[]{}|\\/#*&%@^<>!ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
/** scramble-decode: resolved prefix + flickering random glyphs (re-seeded every `every` frames) */
export const scramble = (text: string, frame: number, start: number, dur: number, seed = 1, every = 2) => {
  const n = text.length;
  if (frame < start) return '';
  const resolved = Math.floor(cl((frame - start) / Math.max(1, dur)) * n);
  const k = Math.floor(frame / every);
  return text
    .split('')
    .map((c, i) => (i < resolved || c === ' ' ? c : POOL[Math.floor(h01(i, k, seed) * POOL.length)]))
    .join('');
};
/** typed prefix at chars-per-second */
export const typedText = (text: string, frame: number, start: number, cps: number, fps = 30) => text.slice(0, Math.max(0, Math.floor(((frame - start) / fps) * cps)));
/** word wrap by an average char count */
export const wrap = (text: string, maxChars: number) => {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      out.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) out.push(line);
  return out;
};

// ============================================================================================================
// X5 — paper-cut diorama
// ============================================================================================================

export type PaperPalette = {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  glow: string;
  cloud: string;
  cloudShade: string;
  far: string;
  farShade: string;
  snow: string;
  near: string;
  nearShade: string;
  forest: string;
  meadow: string;
  meadow2: string;
  water: string;
  foam: string;
  rock: string;
  rim: string;
  star: string;
  night: boolean;
};

export const PAPER_PALETTES: Record<string, PaperPalette> = {
  sunset: {
    skyTop: '#3C4E8C', skyMid: '#967696', skyLow: '#D9A290', glow: '#EAC59C', cloud: '#E9B98F', cloudShade: '#B88AA8',
    far: '#7C83C0', farShade: '#4B579E', snow: '#EDD7DD', near: '#5E65A8', nearShade: '#354990', forest: '#2D4C36',
    meadow: '#AEA54C', meadow2: '#8E9440', water: '#6091D2', foam: '#D9DFE5', rock: '#5C5650', rim: '#F2E9E4', star: '#D6B65D', night: false,
  },
  moonlit: {
    skyTop: '#14212B', skyMid: '#182C4B', skyLow: '#2E4A72', glow: '#EDDE9D', cloud: '#3A4E72', cloudShade: '#25385A',
    far: '#3A4D7A', farShade: '#24345C', snow: '#B9C6DA', near: '#2B3B63', nearShade: '#1B2747', forest: '#16302A',
    meadow: '#3F5E3A', meadow2: '#2F4A30', water: '#3F6FA8', foam: '#AFC4DA', rock: '#3E4048', rim: '#C9D3E6', star: '#D6B65D', night: true,
  },
  dawn: {
    skyTop: '#6E8FC4', skyMid: '#E2B6A8', skyLow: '#F6D7A6', glow: '#FFF0C8', cloud: '#F7E2D2', cloudShade: '#D9B5B4',
    far: '#9AA6D2', farShade: '#7280B8', snow: '#F7EEF0', near: '#7D8CC0', nearShade: '#5867A0', forest: '#34603F',
    meadow: '#B9B356', meadow2: '#9AA34A', water: '#78A8DE', foam: '#E8EEF4', rock: '#6A625A', rim: '#FFF6EE', star: '#E2BE5E', night: false,
  },
};
export const paperPalette = (name: string) => PAPER_PALETTES[name] ?? PAPER_PALETTES.sunset;

/**
 * Paper filter: rough edge (displacement), fibre speckle, light rim on top edges, soft drop shadow onto the layer
 * behind. Use one per motion instance: <PaperFilter id=… />, then filter={`url(#${id})`} on each layer group.
 */
export const PaperFilter: React.FC<{id: string; u: number; h: number; rim?: string; shadow?: number; seed?: number; rough?: number}> = ({id, u, h, rim = '#F2E9E4', shadow = 0.4, seed = 4, rough = 1.6}) => (
  <filter id={id} x="-5%" y="-8%" width="110%" height="125%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency={0.9 / Math.max(0.5, u)} numOctaves={2} seed={seed} result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale={rough * u} xChannelSelector="R" yChannelSelector="G" result="rough" />
    <feOffset in="rough" dy={2.2 * u} result="down" />
    <feComposite in="rough" in2="down" operator="out" result="rimMask" />
    <feFlood floodColor={rim} floodOpacity={0.7} />
    <feComposite in2="rimMask" operator="in" result="rimC" />
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0 0 0 -0.18" result="speck" />
    <feComposite in="speck" in2="rough" operator="in" result="fibre" />
    <feGaussianBlur in="rough" stdDeviation={0.008 * h} result="sb" />
    <feOffset in="sb" dy={0.006 * h} result="so" />
    <feColorMatrix in="so" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${shadow} 0`} result="shadowC" />
    <feMerge>
      <feMergeNode in="shadowC" />
      <feMergeNode in="rough" />
      <feMergeNode in="fibre" />
      <feMergeNode in="rimC" />
    </feMerge>
  </filter>
);

/** a jagged ridge of faceted peaks -> {base, facets(lighter left faces), snow} paths */
export const mountainRange = (seed: number, x0: number, x1: number, baseY: number, minH: number, maxH: number, peaks: number, snowK = 0.28) => {
  const r = rng(seed);
  const step = (x1 - x0) / peaks;
  const pts: [number, number][] = [[x0, baseY]];
  const tops: [number, number, number, number][] = []; // peak x, y, left valley x, right valley x
  let vx = x0;
  for (let i = 0; i < peaks; i++) {
    const px = x0 + step * (i + 0.3 + r() * 0.4);
    const py = baseY - (minH + (maxH - minH) * r());
    const nx = x0 + step * (i + 1) + (r() - 0.5) * step * 0.2;
    const ny = baseY - (minH * (0.15 + r() * 0.35));
    pts.push([px, py], [nx, ny]);
    tops.push([px, py, vx, nx]);
    vx = nx;
  }
  pts.push([x1, baseY], [x1, baseY + 4000], [x0, baseY + 4000]);
  const base = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + 'Z';
  // shadow facet (right side of each peak)
  const shade = tops
    .map(([px, py, , rx]) => {
      const midY = baseY;
      const cx = px + (rx - px) * 0.25;
      return `M${px.toFixed(1)} ${py.toFixed(1)} L${rx.toFixed(1)} ${(baseY - (baseY - py) * 0.12).toFixed(1)} L${(rx - (rx - px) * 0.1).toFixed(1)} ${midY.toFixed(1)} L${cx.toFixed(1)} ${midY.toFixed(1)} Z`;
    })
    .join(' ');
  const snow = tops
    .map(([px, py, lx, rx]) => {
      const hgt = baseY - py;
      const sy = py + hgt * snowK;
      const lxx = px - (px - lx) * snowK * 0.95;
      const rxx = px + (rx - px) * snowK * 0.95;
      const mid = (a: number, b: number, k: number) => a + (b - a) * k;
      return `M${px.toFixed(1)} ${py.toFixed(1)} L${rxx.toFixed(1)} ${(sy).toFixed(1)} L${mid(px, rxx, 0.55).toFixed(1)} ${(sy - hgt * 0.06).toFixed(1)} L${mid(px, rxx, 0.25).toFixed(1)} ${(sy + hgt * 0.05).toFixed(1)} L${px.toFixed(1)} ${(sy - hgt * 0.04).toFixed(1)} L${mid(px, lxx, 0.4).toFixed(1)} ${(sy + hgt * 0.07).toFixed(1)} L${mid(px, lxx, 0.7).toFixed(1)} ${(sy - hgt * 0.02).toFixed(1)} L${lxx.toFixed(1)} ${(sy + hgt * 0.03).toFixed(1)} Z`;
    })
    .join(' ');
  return {base, shade, snow, tops};
};

/** scalloped cloud bank (union of circles) as one path */
export const cloudPath = (seed: number, cx: number, cy: number, wd: number, ht: number, lobes = 7) => {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < lobes; i++) {
    const t = i / (lobes - 1);
    const x = cx - wd / 2 + wd * t;
    const rr = ht * (0.35 + 0.45 * Math.sin(Math.PI * t) + r() * 0.15);
    const y = cy - rr * 0.35;
    d += `M${(x - rr).toFixed(1)} ${y.toFixed(1)} a${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(2 * rr).toFixed(1)} 0 a${rr.toFixed(1)} ${rr.toFixed(1)} 0 1 0 ${(-2 * rr).toFixed(1)} 0 `;
  }
  d += `M${(cx - wd / 2).toFixed(1)} ${cy.toFixed(1)} v${(ht * 0.25).toFixed(1)} h${wd.toFixed(1)} v${(-ht * 0.25).toFixed(1)}Z`;
  return d;
};

/** a row of paper pine trees along y (each a stacked-triangle silhouette) */
export const pineRow = (seed: number, x0: number, x1: number, y: number, hMin: number, hMax: number, n: number) => {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + r() * 0.8)) / n;
    const th = hMin + (hMax - hMin) * r();
    const yy = y + (r() - 0.5) * th * 0.15;
    const wd = th * 0.32;
    const tiers = 3;
    for (let k = 0; k < tiers; k++) {
      const ty = yy - th * (k / tiers) * 0.85;
      const tw = wd * (1 - k * 0.22);
      d += `M${(x - tw).toFixed(1)} ${ty.toFixed(1)} L${x.toFixed(1)} ${(ty - th * 0.5).toFixed(1)} L${(x + tw).toFixed(1)} ${ty.toFixed(1)}Z `;
    }
    d += `M${(x - wd * 0.08).toFixed(1)} ${yy.toFixed(1)} h${(wd * 0.16).toFixed(1)} v${(th * 0.1).toFixed(1)} h${(-wd * 0.16).toFixed(1)}Z `;
  }
  return d;
};

/** rolling hill: top edge from x0..x1 around y with amplitude, closed to bottom */
export const hillPath = (seed: number, x0: number, x1: number, y: number, amp: number, bottom: number, bumps = 2, tilt = 0) => {
  const n = 28;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const yy = y + tilt * (t - 0.5) - amp * Math.sin(Math.PI * t * bumps + seed) * 0.6 - amp * 0.4 * Math.sin(Math.PI * t) + n2('h' + seed, t * 3, 0) * amp * 0.25;
    pts.push(`${x.toFixed(1)} ${yy.toFixed(1)}`);
  }
  return `M${pts.join(' L')} L${x1.toFixed(1)} ${bottom.toFixed(1)} L${x0.toFixed(1)} ${bottom.toFixed(1)}Z`;
};

/** 4-point star (guide star / flare) centred on 0,0 */
export const star4 = (r: number, pinch = 0.18) => {
  const p = r * pinch;
  return `M0 ${-r} Q${p} ${-p} ${r} 0 Q${p} ${p} 0 ${r} Q${-p} ${p} ${-r} 0 Q${-p} ${-p} 0 ${-r}Z`;
};

export type CritterPose = 'walk' | 'sit' | 'stand' | 'look-up';
export type CritterColors = {body: string; shade: string; light: string; leg: string; ink: string};
export const CRITTER_SPECIES: Record<string, CritterColors> = {
  fox: {body: '#C95523', shade: '#A03813', light: '#DDCAB3', leg: '#2A1F15', ink: '#1E140D'},
  cat: {body: '#7C7570', shade: '#5A534F', light: '#E4DDD3', leg: '#2E2A28', ink: '#191615'},
  wolf: {body: '#7D8496', shade: '#5A6074', light: '#E2E4EA', leg: '#2C2F3A', ink: '#15171D'},
  hare: {body: '#B48A62', shade: '#8E6A49', light: '#EFE4D2', leg: '#5A4330', ink: '#22180F'},
};

/**
 * Original paper-cut critter (side view, facing +x), feet at (0,0), height H (ear tip to feet).
 * Built from cut-paper pieces: faceted body with overlapping scale "feathers", wedge head with tall ears,
 * a three-segment plume tail with a light tip, four tapered legs. Poses: walk / sit / stand / look-up.
 */
export const PaperCritter: React.FC<{
  id: string;
  x: number;
  y: number;
  H: number;
  frame: number;
  fps?: number;
  pose?: CritterPose;
  colors?: CritterColors;
  facing?: number;
  stride?: number;
  filter?: string;
  shadow?: boolean;
  earType?: 'tall' | 'short' | 'long';
}> = ({id, x, y, H, frame, fps = 30, pose = 'walk', colors = CRITTER_SPECIES.fox, facing = 1, stride = 0.9, filter, shadow = true, earType = 'tall'}) => {
  const t = frame / fps;
  const walking = pose === 'walk';
  const sitting = pose === 'sit' || pose === 'look-up';
  const ph = (t / stride) * Math.PI * 2;
  const bob = walking ? Math.abs(Math.sin(ph)) * 0.012 : Math.sin(t * Math.PI * 0.5) * 0.004;
  // tail swish ±8° at 0.4 Hz; head tilt every ~2.5 s
  const swish = Math.sin(t * Math.PI * 2 * 0.4) * (sitting ? 8 : 5) + (walking ? Math.sin(ph) * 3 : 0);
  const cyc = (t % 2.6) / 2.6;
  const tiltIdle = cyc < 0.25 ? Math.sin((cyc / 0.25) * Math.PI) : 0;
  const lookUp = pose === 'look-up' ? -22 - 4 * Math.sin(t * 1.3) : -8 * tiltIdle;
  const earFlick = h01(Math.floor(t / 1.7), 3) > 0.6 && (frame % Math.round(1.7 * fps)) < 2 ? -12 : 0;
  const c = colors;
  const s = H;
  // body pivot / tilt
  const bodyRot = sitting ? -42 : 0;
  const leg = (hipX: number, hipY: number, len: number, ang: number, w: number, col: string, key: string, knee = 0) => {
    const a = (ang * Math.PI) / 180;
    const kx = hipX + Math.sin(a) * len * 0.5;
    const ky = hipY + Math.cos(a) * len * 0.5;
    const a2 = a + (knee * Math.PI) / 180;
    const fx = kx + Math.sin(a2) * len * 0.5;
    const fy = ky + Math.cos(a2) * len * 0.5;
    return (
      <g key={key}>
        <path d={`M${hipX - w} ${hipY} L${kx - w * 0.6} ${ky} L${fx - w * 0.45} ${fy} L${fx + w * 0.9} ${fy} L${kx + w * 0.55} ${ky} L${hipX + w} ${hipY}Z`} fill={col} />
      </g>
    );
  };
  const legSwing = (o: number) => (walking ? Math.sin(ph + o) * 24 : 0);
  const legKnee = (o: number) => (walking ? Math.max(0, Math.sin(ph + o + 1.2)) * -28 : 0);
  // scale feathers on body: rows of overlapping arcs
  const feathers: React.ReactNode[] = [];
  for (let row = 0; row < 4; row++) {
    for (let k = 0; k < 9; k++) {
      const fx = -0.36 + k * 0.08 + (row % 2) * 0.04;
      const fy = -0.56 + row * 0.07;
      const rr = 0.05;
      feathers.push(
        <path
          key={`f${row}-${k}`}
          d={`M${(fx - rr) * s} ${fy * s} Q${fx * s} ${(fy + rr * 1.9) * s} ${(fx + rr) * s} ${fy * s}`}
          fill={(row + k) % 3 === 0 ? c.shade : shadeHex(c.body, 0.06)}
          stroke={c.shade}
          strokeWidth={0.004 * s}
          opacity={0.85}
        />,
      );
    }
  }
  const tail = (
    <g transform={sitting ? `translate(${-0.3 * s} ${-0.1 * s}) rotate(${swish * 0.6 - 6})` : `translate(${-0.36 * s} ${-0.44 * s}) rotate(${swish})`}>
      {/* three overlapping plume segments */}
      <path d={`M0 ${-0.06 * s} C${-0.18 * s} ${-0.14 * s} ${-0.34 * s} ${-0.06 * s} ${-0.42 * s} ${0.08 * s} C${-0.3 * s} ${0.12 * s} ${-0.14 * s} ${0.1 * s} 0 ${0.06 * s}Z`} fill={c.body} />
      <g transform={`rotate(${swish * 0.5} ${-0.2 * s} 0)`}>
        <path d={`M${-0.18 * s} ${-0.08 * s} C${-0.3 * s} ${-0.12 * s} ${-0.44 * s} ${-0.04 * s} ${-0.52 * s} ${0.12 * s} C${-0.4 * s} ${0.14 * s} ${-0.28 * s} ${0.1 * s} ${-0.16 * s} ${0.06 * s}Z`} fill={c.shade} />
        <g transform={`rotate(${swish * 0.6} ${-0.42 * s} ${0.05 * s})`}>
          <path d={`M${-0.38 * s} ${-0.02 * s} C${-0.48 * s} ${-0.04 * s} ${-0.58 * s} ${0.04 * s} ${-0.62 * s} ${0.16 * s} C${-0.52 * s} ${0.16 * s} ${-0.44 * s} ${0.12 * s} ${-0.36 * s} ${0.08 * s}Z`} fill={c.light} />
        </g>
      </g>
      {[0, 1, 2, 3, 4].map((k) => (
        <path key={k} d={`M${(-0.06 - k * 0.07) * s} ${(-0.07 + k * 0.012) * s} q${-0.03 * s} ${0.07 * s} ${-0.06 * s} ${0.08 * s}`} stroke={c.shade} strokeWidth={0.008 * s} fill="none" opacity={0.7} />
      ))}
    </g>
  );
  const earH = earType === 'long' ? 0.32 : earType === 'short' ? 0.14 : 0.2;
  const head = (
    <g transform={sitting ? `translate(${0.1 * s} ${-0.8 * s}) rotate(${lookUp})` : `translate(${0.3 * s} ${-0.6 * s}) rotate(${lookUp})`}>
      {/* back ear */}
      <path d={`M${-0.02 * s} ${-0.08 * s} L${0.0 * s} ${(-0.08 - earH) * s} L${0.08 * s} ${-0.1 * s}Z`} fill={c.leg} />
      {/* skull + snout wedge */}
      <path d={`M${-0.12 * s} ${0.02 * s} L${-0.06 * s} ${-0.1 * s} L${0.1 * s} ${-0.11 * s} L${0.18 * s} ${-0.04 * s} L${0.29 * s} ${0.02 * s} L${0.27 * s} ${0.045 * s} L${0.12 * s} ${0.08 * s} L${-0.04 * s} ${0.1 * s}Z`} fill={c.body} />
      <path d={`M${0.1 * s} ${-0.11 * s} L${0.18 * s} ${-0.04 * s} L${0.29 * s} ${0.02 * s} L${0.17 * s} ${0.0 * s}Z`} fill={shadeHex(c.body, 0.12)} />
      {/* cheek / muzzle light */}
      <path d={`M${-0.04 * s} ${0.1 * s} L${0.06 * s} ${0.02 * s} L${0.27 * s} ${0.045 * s} L${0.12 * s} ${0.085 * s}Z`} fill={c.light} />
      <circle cx={0.285 * s} cy={0.022 * s} r={0.018 * s} fill={c.ink} />
      {/* eye */}
      <path d={`M${0.09 * s} ${-0.035 * s} q${0.03 * s} ${-0.02 * s} ${0.055 * s} ${0.004 * s} q${-0.03 * s} ${0.012 * s} ${-0.055 * s} ${-0.004 * s}Z`} fill={c.ink} />
      {/* front ear */}
      <g transform={`rotate(${earFlick} ${0.04 * s} ${-0.1 * s})`}>
        <path d={`M${0.0 * s} ${-0.09 * s} L${0.05 * s} ${(-0.1 - earH) * s} L${0.11 * s} ${-0.1 * s}Z`} fill={c.body} />
        <path d={`M${0.03 * s} ${-0.1 * s} L${0.055 * s} ${(-0.1 - earH * 0.75) * s} L${0.085 * s} ${-0.1 * s}Z`} fill={c.leg} opacity={0.85} />
      </g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${facing} 1)`} filter={filter}>
      {shadow ? <ellipse cx={0} cy={0.005 * s} rx={0.42 * s} ry={0.035 * s} fill="#000" opacity={0.22} /> : null}
      <g transform={`translate(0 ${-bob * s})`}>
        {/* far legs */}
        {sitting ? null : leg(-0.26 * s, -0.36 * s, 0.36 * s, legSwing(Math.PI), 0.046 * s, shadeHex(c.leg, -0.2), 'lb', legKnee(Math.PI))}
        {leg(sitting ? 0.0 * s : 0.14 * s, sitting ? -0.55 * s : -0.36 * s, sitting ? 0.55 * s : 0.36 * s, sitting ? 2 : legSwing(0), (sitting ? 0.03 : 0.042) * s, shadeHex(c.leg, -0.2), 'fb', sitting ? 0 : legKnee(0))}
        {tail}
        <g transform={sitting ? `translate(${0.02 * s} ${0.2 * s}) rotate(${bodyRot} ${-0.32 * s} ${-0.4 * s})` : `translate(0 ${0.06 * s})`}>
          {/* body */}
          <path d={`M${-0.4 * s} ${-0.5 * s} C${-0.36 * s} ${-0.66 * s} ${0.08 * s} ${-0.68 * s} ${0.2 * s} ${-0.62 * s} L${0.32 * s} ${-0.56 * s} C${0.3 * s} ${-0.42 * s} ${0.16 * s} ${-0.34 * s} ${0.0 * s} ${-0.34 * s} C${-0.2 * s} ${-0.32 * s} ${-0.38 * s} ${-0.36 * s} ${-0.4 * s} ${-0.5 * s}Z`} fill={c.body} />
          <clipPath id={`${id}-bc`}>
            <path d={`M${-0.4 * s} ${-0.5 * s} C${-0.36 * s} ${-0.66 * s} ${0.08 * s} ${-0.68 * s} ${0.2 * s} ${-0.62 * s} L${0.32 * s} ${-0.56 * s} C${0.3 * s} ${-0.42 * s} ${0.16 * s} ${-0.34 * s} ${0.0 * s} ${-0.34 * s} C${-0.2 * s} ${-0.32 * s} ${-0.38 * s} ${-0.36 * s} ${-0.4 * s} ${-0.5 * s}Z`} />
          </clipPath>
          <g clipPath={`url(#${id}-bc)`}>{feathers}</g>
          <path d={`M${-0.38 * s} ${-0.42 * s} C${-0.2 * s} ${-0.33 * s} ${0.12 * s} ${-0.33 * s} ${0.26 * s} ${-0.46 * s} C${0.14 * s} ${-0.36 * s} ${-0.2 * s} ${-0.32 * s} ${-0.38 * s} ${-0.42 * s}Z`} fill={c.shade} opacity={0.6} />
          {/* chest ruff */}
          <path d={`M${0.18 * s} ${-0.62 * s} L${0.34 * s} ${-0.56 * s} L${0.3 * s} ${-0.44 * s} L${0.24 * s} ${-0.47 * s} L${0.2 * s} ${-0.38 * s} L${0.14 * s} ${-0.45 * s}Z`} fill={c.light} />
        </g>
        {/* near legs */}
        {sitting ? (
          <g>
            <ellipse cx={-0.16 * s} cy={-0.17 * s} rx={0.2 * s} ry={0.17 * s} fill={c.body} />
            <path d={`M${-0.3 * s} ${-0.24 * s} Q${-0.18 * s} ${-0.34 * s} ${-0.02 * s} ${-0.22 * s}`} stroke={c.shade} strokeWidth={0.02 * s} fill="none" />
            <ellipse cx={-0.02 * s} cy={-0.02 * s} rx={0.1 * s} ry={0.035 * s} fill={c.leg} />
          </g>
        ) : (
          leg(-0.3 * s, -0.36 * s, 0.36 * s, legSwing(0), 0.052 * s, c.leg, 'lf', legKnee(0))
        )}
        {leg(sitting ? 0.06 * s : 0.2 * s, sitting ? -0.55 * s : -0.36 * s, sitting ? 0.55 * s : 0.36 * s, sitting ? -1 : legSwing(Math.PI), (sitting ? 0.033 : 0.046) * s, c.leg, 'ff', sitting ? 0 : legKnee(Math.PI))}
        {head}
      </g>
    </g>
  );
};

/** glowing 4-point guide star with a soft bloom (twinkles) */
export const GuideStar: React.FC<{id: string; x: number; y: number; r: number; color?: string; core?: string; k?: number; rot?: number}> = ({id, x, y, r, color = '#D6B65D', core = '#FFF3C4', k = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
    <defs>
      <radialGradient id={`${id}-g`}>
        <stop offset="0%" stopColor={core} stopOpacity={0.9} />
        <stop offset="40%" stopColor={color} stopOpacity={0.35} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle r={r * 2.4} fill={`url(#${id}-g)`} />
    <path d={star4(r, 0.16)} fill={color} />
    <path d={star4(r * 0.62, 0.2)} fill={core} />
  </g>
);

// ============================================================================================================
// X6 — Klein terminal + painted isometric battlefield
// ============================================================================================================

export type Faction = {name: string; color: string; unit: string; chip: string; chipText?: string; glyph?: string};
/** neutral placeholder agents (never real AI-company names) */
export const AGENTS: Faction[] = [
  {name: 'NOVA', color: '#E58682', unit: '#BE6E6C', chip: '#E58682', glyph: 'star'},
  {name: 'ATLAS', color: '#A9D9D0', unit: '#E7E9F1', chip: '#A9D9D0', glyph: 'ring'},
  {name: 'VEGA', color: '#B391F7', unit: '#6489D6', chip: '#CBB8F5', glyph: 'diamond'},
  {name: 'ONYX', color: '#8D8AB8', unit: '#545374', chip: '#141227', chipText: '#FFFFFF', glyph: 'bolt'},
];
export const KLEIN = {bg: '#1206A5', ghost: '#615DC9', frame: '#5C5BA0', title: '#FFF6E2', white: '#FFFFFF', red: '#E0503C', dark: '#030309'};

/** L-shaped corner brackets around a rect */
export const Brackets: React.FC<{x: number; y: number; w: number; h: number; len: number; color?: string; sw?: number; opacity?: number}> = ({x, y, w, h, len, color = '#fff', sw = 1.5, opacity = 1}) => (
  <g stroke={color} strokeWidth={sw} fill="none" opacity={opacity} strokeLinecap="square">
    <path d={`M${x} ${y + len} V${y} H${x + len}`} />
    <path d={`M${x + w - len} ${y} H${x + w} V${y + len}`} />
    <path d={`M${x + w} ${y + h - len} V${y + h} H${x + w - len}`} />
    <path d={`M${x + len} ${y + h} H${x} V${y + h - len}`} />
  </g>
);

/** banner glyph (abstract emblem, no logos) centred on 0,0 at radius r */
export const Emblem: React.FC<{kind?: string; r: number; color: string; sw?: number}> = ({kind = 'star', r, color, sw = 2}) => {
  if (kind === 'ring')
    return (
      <g fill="none" stroke={color} strokeWidth={sw}>
        <circle r={r * 0.7} />
        <circle r={r * 0.3} />
      </g>
    );
  if (kind === 'diamond') return <path d={`M0 ${-r} L${r * 0.6} 0 L0 ${r} L${-r * 0.6} 0Z M0 ${-r * 0.45} L${r * 0.27} 0 L0 ${r * 0.45} L${-r * 0.27} 0Z`} fill="none" stroke={color} strokeWidth={sw} />;
  if (kind === 'bolt') return <path d={`M${r * 0.15} ${-r} L${-r * 0.5} ${r * 0.1} L${0} ${r * 0.1} L${-r * 0.15} ${r} L${r * 0.5} ${-r * 0.15} L${0} ${-r * 0.15}Z`} fill={color} />;
  return <path d={star4(r, 0.2)} fill={color} />;
};

/** abstract generative portrait (no real people / brands): crystal, filament figure, orb, hooded sage */
export const AgentAvatar: React.FC<{id: string; kind: number; x: number; y: number; s: number; color: string; frame: number}> = ({id, kind, x, y, s, color, frame}) => {
  const k = ((kind % 4) + 4) % 4;
  const t = frame / 30;
  const cid = `${id}-clip`;
  let body: React.ReactNode;
  if (k === 0) {
    // faceted crystal
    const pts = Array.from({length: 7}, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + t * 0.3;
      return [s / 2 + Math.cos(a) * s * 0.34, s / 2 + Math.sin(a) * s * 0.34] as [number, number];
    });
    body = (
      <>
        <rect width={s} height={s} fill="#2A2E36" />
        {pts.map((p, i) => {
          const q = pts[(i + 1) % pts.length];
          return <path key={i} d={`M${s / 2} ${s / 2} L${p[0]} ${p[1]} L${q[0]} ${q[1]}Z`} fill={mixHex('#9AA3B4', '#3E4552', ((i * 37) % 7) / 7)} stroke="#D7DCE6" strokeWidth={s * 0.008} />;
        })}
        <circle cx={s * 0.42} cy={s * 0.42} r={s * 0.06} fill="#fff" opacity={0.5} />
      </>
    );
  } else if (k === 1) {
    // filament figure (glowing lines)
    body = (
      <>
        <rect width={s} height={s} fill="#14110F" />
        {Array.from({length: 9}, (_, i) => (
          <path
            key={i}
            d={`M${s * (0.42 + i * 0.02)} ${s * 0.2} C${s * (0.3 + i * 0.04)} ${s * 0.45} ${s * (0.62 - i * 0.02)} ${s * 0.6} ${s * (0.36 + i * 0.035)} ${s}`}
            stroke={mixHex('#F3D9A4', color, i / 9)}
            strokeWidth={s * 0.012}
            fill="none"
            opacity={0.55 + 0.4 * Math.sin(t * 2 + i)}
          />
        ))}
        <circle cx={s * 0.5} cy={s * 0.22} r={s * 0.09} fill="none" stroke="#F3D9A4" strokeWidth={s * 0.015} />
      </>
    );
  } else if (k === 2) {
    // nebula orb
    body = (
      <>
        <rect width={s} height={s} fill="#05070F" />
        <defs>
          <radialGradient id={`${id}-orb`}>
            <stop offset="0%" stopColor="#FFE9B0" />
            <stop offset="35%" stopColor={color} />
            <stop offset="100%" stopColor="#0B1430" />
          </radialGradient>
        </defs>
        <circle cx={s / 2} cy={s / 2} r={s * 0.4} fill={`url(#${id}-orb)`} />
        {Array.from({length: 14}, (_, i) => {
          const a = i * 2.39996 + t * 0.4;
          const rr = s * (0.1 + (i / 14) * 0.28);
          return <circle key={i} cx={s / 2 + Math.cos(a) * rr} cy={s / 2 + Math.sin(a) * rr} r={s * 0.012} fill="#DCEBFF" opacity={0.8} />;
        })}
      </>
    );
  } else {
    // hooded sage silhouette, sepia
    body = (
      <>
        <rect width={s} height={s} fill="#E9DCC0" />
        <path d={`M${s * 0.5} ${s * 0.16} C${s * 0.3} ${s * 0.16} ${s * 0.26} ${s * 0.42} ${s * 0.3} ${s * 0.55} L${s * 0.12} ${s} H${s * 0.88} L${s * 0.7} ${s * 0.55} C${s * 0.74} ${s * 0.42} ${s * 0.7} ${s * 0.16} ${s * 0.5} ${s * 0.16}Z`} fill="#6B5238" />
        <ellipse cx={s * 0.5} cy={s * 0.42} rx={s * 0.1} ry={s * 0.12} fill="#2F2217" />
        <path d={`M${s * 0.2} ${s * 0.95} L${s * 0.8} ${s * 0.95}`} stroke={color} strokeWidth={s * 0.04} />
      </>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={cid}>
          <rect width={s} height={s} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cid})`}>{body}</g>
    </g>
  );
};

/** 2:1 isometric projection of ground coords (gx, gy, gz) at scale k around (ox, oy) */
export const iso2 = (gx: number, gy: number, gz: number, k: number, ox = 0, oy = 0): [number, number] => [ox + (gx - gy) * k, oy + (gx + gy) * k * 0.5 - gz * k];

export type Unit = {gx: number; gy: number; type: number; row: number; ph: number};
/** a faction block of units in rows on the ground plane around its centre */
export const armyBlock = (seed: number, count: number, cols = 12): Unit[] => {
  const r = rng(seed);
  const out: Unit[] = [];
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const type = row < rows * 0.5 ? 0 : row < rows * 0.8 ? 1 : 2;
    out.push({gx: (col - cols / 2) * 0.42 + (r() - 0.5) * 0.12 + (row % 2) * 0.2, gy: (row - rows / 2) * 0.48 + (r() - 0.5) * 0.12, type, row, ph: r() * 6.28});
  }
  return out;
};
/** default ground positions of 4 armies (top, right, bottom, left on screen) */
export const ARMY_CENTERS: [number, number][] = [
  [-4.6, -4.6],
  [4.8, -3.6],
  [4.2, 4.6],
  [-4.4, 3.8],
];

/** tiny unit sprite (low-poly silhouette) at screen x,y (feet) with height hh */
export const UnitSprite: React.FC<{x: number; y: number; hh: number; type: number; color: string; dark: string}> = ({x, y, hh, type, color, dark}) => {
  if (type === 1) {
    // cloaked archer cone
    return (
      <g>
        <path d={`M${x} ${y - hh} L${x + hh * 0.32} ${y} L${x - hh * 0.32} ${y}Z`} fill={color} />
        <path d={`M${x} ${y - hh} L${x + hh * 0.32} ${y} L${x + hh * 0.05} ${y}Z`} fill={dark} opacity={0.55} />
      </g>
    );
  }
  if (type === 2) {
    // cavalry: horse body + rider
    return (
      <g>
        <rect x={x - hh * 0.45} y={y - hh * 0.62} width={hh * 0.9} height={hh * 0.32} rx={hh * 0.1} fill={dark} />
        <rect x={x - hh * 0.4} y={y - hh * 0.32} width={hh * 0.08} height={hh * 0.32} fill={dark} />
        <rect x={x + hh * 0.3} y={y - hh * 0.32} width={hh * 0.08} height={hh * 0.32} fill={dark} />
        <rect x={x - hh * 0.12} y={y - hh * 1.05} width={hh * 0.24} height={hh * 0.45} fill={color} />
      </g>
    );
  }
  // infantry block
  return (
    <g>
      <rect x={x - hh * 0.22} y={y - hh * 0.8} width={hh * 0.44} height={hh * 0.8} fill={color} />
      <rect x={x + hh * 0.02} y={y - hh * 0.8} width={hh * 0.2} height={hh * 0.8} fill={dark} opacity={0.45} />
      <circle cx={x} cy={y - hh * 0.92} r={hh * 0.16} fill={color} />
    </g>
  );
};

/** painterly isometric valley backdrop (plateau, cliffs, falls, tree clumps), procedural */
export const PaintedField: React.FC<{id: string; w: number; h: number; u: number; seed?: number; frame: number; grass?: string; dark?: string}> = ({id, w, h, u, seed = 3, frame, grass = '#7FA35A', dark = '#1C2928'}) => {
  const r = rng(seed);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const R = Math.max(w, h) * 0.42;
  const plateau = Array.from({length: 48}, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const k = 1 + 0.12 * n2('pl' + seed, Math.cos(a) * 1.4, Math.sin(a) * 1.4);
    return `${(cx + Math.cos(a) * R * k).toFixed(1)} ${(cy + Math.sin(a) * R * 0.55 * k).toFixed(1)}`;
  });
  const strokes = Array.from({length: 140}, () => ({x: r(), y: r(), l: 0.02 + r() * 0.06, a: r() * 0.4 - 0.2, c: r()}));
  const trees = Array.from({length: 70}, () => ({a: r() * Math.PI * 2, d: 0.95 + r() * 0.35, s: 0.5 + r()}));
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-pf`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={shadeHex(grass, 0.12)} />
          <stop offset="70%" stopColor={grass} />
          <stop offset="100%" stopColor={shadeHex(grass, -0.25)} />
        </radialGradient>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#355246" />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <filter id={`${id}-soft`}>
          <feGaussianBlur stdDeviation={1.2 * u} />
        </filter>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-bg)`} />
      {/* distant cliffs / forest masses */}
      {Array.from({length: 26}, (_, i) => {
        const x = (i / 26) * w * 1.1 - w * 0.05;
        const top = h * (0.05 + 0.12 * h01(i, seed));
        return <path key={i} d={`M${x} ${h} L${x} ${top} L${x + w * 0.05} ${top + h * 0.03} L${x + w * 0.06} ${h}Z`} fill={mixHex('#2A3F35', '#4B6650', h01(i, 7))} opacity={0.8} />;
      })}
      {/* waterfall + river */}
      <path d={`M${w * 0.74} ${h * 0.02} C${w * 0.76} ${h * 0.12} ${w * 0.7} ${h * 0.16} ${w * 0.73} ${h * 0.24}`} stroke="#7FD8F0" strokeWidth={6 * u} fill="none" opacity={0.6} />
      <rect x={w * 0.715} y={h * 0.18} width={10 * u} height={h * 0.14} fill="#D8F2F7" opacity={0.35 + 0.1 * Math.sin(frame * 0.6)} />
      {/* cliff skirt under the plateau */}
      <path d={`M${plateau.join(' L')}Z`} fill="#2E3E37" transform={`translate(0 ${h * 0.06})`} />
      <path d={`M${plateau.join(' L')}Z`} fill={`url(#${id}-pf)`} />
      {/* brush strokes */}
      <g filter={`url(#${id}-soft)`}>
        {strokes.map((s, i) => {
          const x = cx + (s.x - 0.5) * R * 1.6;
          const y = cy + (s.y - 0.5) * R * 0.85;
          return <ellipse key={i} cx={x} cy={y} rx={s.l * w * 0.5} ry={s.l * w * 0.08} transform={`rotate(${s.a * 40} ${x} ${y})`} fill={s.c > 0.5 ? shadeHex(grass, 0.18) : shadeHex(grass, -0.15)} opacity={0.35} />;
        })}
      </g>
      {/* tree clumps around the rim */}
      {trees.map((t, i) => {
        const x = cx + Math.cos(t.a) * R * t.d;
        const y = cy + Math.sin(t.a) * R * 0.55 * t.d;
        const s = 14 * u * t.s;
        return (
          <g key={i}>
            <path d={`M${x} ${y - s * 2.2} L${x + s * 0.7} ${y} L${x - s * 0.7} ${y}Z`} fill="#1E3528" />
            <path d={`M${x} ${y - s * 2.2} L${x + s * 0.7} ${y} L${x + s * 0.1} ${y}Z`} fill="#13241B" />
          </g>
        );
      })}
    </g>
  );
};

/** iso grid lines over a dark plane (tactical view) */
export const IsoGrid: React.FC<{w: number; h: number; k: number; ox: number; oy: number; color?: string; sw?: number; n?: number}> = ({w, h, k, ox, oy, color = '#1A1A2A', sw = 1, n = 30}) => {
  const lines: React.ReactNode[] = [];
  for (let i = -n; i <= n; i++) {
    const a = iso2(i, -n, 0, k, ox, oy);
    const b = iso2(i, n, 0, k, ox, oy);
    const c = iso2(-n, i, 0, k, ox, oy);
    const d = iso2(n, i, 0, k, ox, oy);
    lines.push(<line key={`a${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />, <line key={`b${i}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />);
  }
  void w;
  void h;
  return (
    <g stroke={color} strokeWidth={sw}>
      {lines}
    </g>
  );
};

/** simple outline line icons for the control bar (settings, mute, eye, info, pause) */
export const CtrlIcon: React.FC<{kind: string; x: number; y: number; s: number; color?: string; sw?: number}> = ({kind, x, y, s, color = '#fff', sw = 1.5}) => {
  const g = (c: React.ReactNode) => (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {c}
    </g>
  );
  if (kind === 'settings')
    return g(
      <>
        <path d={`M${-s * 0.5} ${-s * 0.25} H${s * 0.5} M${-s * 0.5} ${s * 0.25} H${s * 0.5}`} />
        <circle cx={-s * 0.15} cy={-s * 0.25} r={s * 0.1} fill="#000" />
        <circle cx={s * 0.2} cy={s * 0.25} r={s * 0.1} fill="#000" />
      </>,
    );
  if (kind === 'mute')
    return g(
      <>
        <path d={`M${-s * 0.45} ${-s * 0.15} H${-s * 0.2} L${s * 0.1} ${-s * 0.42} V${s * 0.42} L${-s * 0.2} ${s * 0.15} H${-s * 0.45}Z`} />
        <path d={`M${s * 0.25} ${-s * 0.2} Q${s * 0.4} 0 ${s * 0.25} ${s * 0.2}`} />
      </>,
    );
  if (kind === 'eye')
    return g(
      <>
        <path d={`M${-s * 0.5} 0 Q0 ${-s * 0.45} ${s * 0.5} 0`} />
        <circle r={s * 0.12} />
      </>,
    );
  if (kind === 'info')
    return g(
      <>
        <path d={`M${-s * 0.3} ${s * 0.45} L${-s * 0.1} ${-s * 0.1} Q0 ${-s * 0.5} ${s * 0.25} ${-s * 0.3} L${s * 0.1} ${s * 0.1} Z`} />
      </>,
    );
  return g(
    <>
      <path d={`M${-s * 0.15} ${-s * 0.4} V${s * 0.4} M${s * 0.15} ${-s * 0.4} V${s * 0.4}`} />
    </>,
  );
};

// ============================================================================================================
// X7 — arcade halftone fighters
// ============================================================================================================

export const ARCADE = {
  bg: '#100929',
  bg2: '#1C2154',
  ink: '#03011B',
  cream: '#FCFAE3',
  red: '#E66154',
  redShade: '#9E2C36',
  blue: '#3598F6',
  blueShade: '#1F69E7',
  pink: '#E54B8E',
  cyan: '#55C5F9',
  gold: '#F8CB61',
};

/** halftone dot pattern (use as fill over a masked area) */
export const HalftoneDef: React.FC<{id: string; size: number; color: string; r?: number; angle?: number}> = ({id, size, color, r = 0.32, angle = 45}) => (
  <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
    <circle cx={size / 2} cy={size / 2} r={size * r} fill={color} />
  </pattern>
);

/** heavy italic caps with cream fill, dark extrude and outline (fighting-game headline) */
export const ExtrudeText: React.FC<{
  x: number;
  y: number;
  size: number;
  text: string;
  font?: string;
  fill?: string;
  ink?: string;
  depth?: number;
  anchor?: 'start' | 'middle' | 'end';
  skew?: number;
  gradient?: [string, string, string];
  id?: string;
  letterSpacing?: number;
  outline?: number;
}> = ({x, y, size, text, font = x58Fonts.lilita, fill = '#FCFAE3', ink = '#0A0820', depth, anchor = 'middle', skew = -8, gradient, id, letterSpacing = 0, outline}) => {
  const d = depth ?? size * 0.07;
  const n = Math.max(2, Math.round(d / Math.max(1, size * 0.012)));
  const sw = outline ?? size * 0.05;
  const common = {fontFamily: font, fontSize: size, textAnchor: anchor, letterSpacing} as const;
  return (
    <g transform={`translate(${x} ${y}) skewX(${skew})`}>
      {gradient && id ? (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="55%" stopColor={gradient[1]} />
            <stop offset="100%" stopColor={gradient[2]} />
          </linearGradient>
        </defs>
      ) : null}
      {Array.from({length: n}, (_, i) => (
        <text key={i} x={(d * (n - i)) / n} y={(d * (n - i)) / n} {...common} fill={ink} stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          {text}
        </text>
      ))}
      <text x={0} y={0} {...common} fill={ink} stroke={ink} strokeWidth={sw} strokeLinejoin="round">
        {text}
      </text>
      <text x={0} y={0} {...common} fill={gradient && id ? `url(#${id})` : fill}>
        {text}
      </text>
    </g>
  );
};

export type EyeKind = 'oval' | 'ii' | 'x' | 'closed' | 'square' | 'angry';
const Eyes: React.FC<{kind: EyeKind; x: number; y: number; r: number; gap: number; color: string; dark?: string}> = ({kind, x, y, r, gap, color, dark = '#0B1A40'}) => {
  const one = (cx: number, flip: number, key: string) => {
    if (kind === 'x')
      return (
        <path key={key} d={`M${cx - r} ${y - r} L${cx + r} ${y + r} M${cx + r} ${y - r} L${cx - r} ${y + r}`} stroke={dark} strokeWidth={r * 0.45} strokeLinecap="round" />
      );
    if (kind === 'closed') return <path key={key} d={`M${cx - r} ${y} Q${cx} ${y + r * 0.7} ${cx + r} ${y}`} stroke={dark} strokeWidth={r * 0.4} fill="none" strokeLinecap="round" />;
    if (kind === 'ii') return <rect key={key} x={cx - r * 0.28} y={y - r * 1.1} width={r * 0.56} height={r * 2.2} rx={r * 0.28} fill={color} />;
    if (kind === 'square') return <rect key={key} x={cx - r * 0.8} y={y - r * 0.8} width={r * 1.6} height={r * 1.6} fill={dark} />;
    if (kind === 'angry') return <path key={key} d={`M${cx - r * flip} ${y - r * 0.9} L${cx + r * flip} ${y - r * 0.1} L${cx + r * flip} ${y + r * 0.7} L${cx - r * flip * 0.6} ${y + r * 0.7}Z`} fill={dark} />;
    // oval / teardrop eyes
    return <path key={key} d={`M${cx} ${y - r * 1.2} C${cx + r} ${y - r * 0.2} ${cx + r * 0.8} ${y + r} ${cx} ${y + r} C${cx - r * 0.8} ${y + r} ${cx - r} ${y - r * 0.2} ${cx} ${y - r * 1.2}Z`} fill={color} />;
  };
  return (
    <g>
      {one(x - gap / 2, -1, 'l')}
      {one(x + gap / 2, 1, 'r')}
    </g>
  );
};

/** glossy jelly slime with simple eyes, halftone shade side and chromatic rims. (x, y) = bottom centre */
export const SlimeOrb: React.FC<{id: string; x: number; y: number; r: number; sx?: number; sy?: number; color?: string; shade?: string; eyes?: EyeKind; rim?: boolean; look?: number; halftone?: boolean}> = ({
  id,
  x,
  y,
  r,
  sx = 1,
  sy = 1,
  color = ARCADE.blue,
  shade = ARCADE.blueShade,
  eyes = 'oval',
  rim = true,
  look = 0,
  halftone = true,
}) => {
  const rx = r * sx;
  const ry = r * sy * 0.92;
  const cy = y - ry;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-b`} cx="62%" cy="32%" r="75%">
          <stop offset="0%" stopColor={shadeHex(color, 0.35)} />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
        <HalftoneDef id={`${id}-ht`} size={r * 0.085} color={shadeHex(shade, -0.35)} r={0.3} />
        <linearGradient id={`${id}-hm`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.45" stopColor="#000" />
          <stop offset="0.85" stopColor="#fff" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-hm)`} />
        </mask>
      </defs>
      {rim ? (
        <>
          <ellipse cx={x - r * 0.05} cy={cy} rx={rx} ry={ry} fill={ARCADE.pink} opacity={0.85} />
          <ellipse cx={x + r * 0.05} cy={cy} rx={rx} ry={ry} fill={ARCADE.cyan} opacity={0.6} />
        </>
      ) : null}
      <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-b)`} />
      {halftone ? <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-ht)`} mask={`url(#${id}-m)`} opacity={0.6} /> : null}
      <ellipse cx={x + rx * 0.38} cy={cy - ry * 0.52} rx={rx * 0.16} ry={ry * 0.09} fill="#F7FAFB" transform={`rotate(-30 ${x + rx * 0.38} ${cy - ry * 0.52})`} />
      <circle cx={x + rx * 0.6} cy={cy - ry * 0.25} r={r * 0.045} fill="#F7FAFB" opacity={0.9} />
      <Eyes kind={eyes} x={x + look * rx * 0.25} y={cy - ry * 0.05} r={r * 0.12} gap={r * 0.5} color="#C8F2FF" dark="#0B1A40" />
    </g>
  );
};

/**
 * Original red fighter "spark critter": a rounded flame-drop body with a crest of three points, stubby feet and
 * slanted eyes (not a cube, not any existing mascot). (x, y) = feet centre.
 */
export const SparkCritter: React.FC<{id: string; x: number; y: number; s: number; sx?: number; sy?: number; color?: string; shade?: string; eyes?: EyeKind; rim?: boolean; lean?: number; step?: number; facing?: number}> = ({
  id,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  color = ARCADE.red,
  shade = ARCADE.redShade,
  eyes = 'angry',
  rim = true,
  lean = 0,
  step = 0,
  facing = 1,
}) => {
  const body = `M${-0.42 * s} ${-0.2 * s} C${-0.5 * s} ${-0.6 * s} ${-0.3 * s} ${-0.82 * s} ${-0.18 * s} ${-0.86 * s} L${-0.1 * s} ${-1.05 * s} L${0.0 * s} ${-0.88 * s} L${0.12 * s} ${-1.12 * s} L${0.18 * s} ${-0.86 * s} L${0.32 * s} ${-0.98 * s} L${0.3 * s} ${-0.78 * s} C${0.5 * s} ${-0.62 * s} ${0.5 * s} ${-0.32 * s} ${0.42 * s} ${-0.2 * s} C${0.3 * s} ${-0.06 * s} ${-0.3 * s} ${-0.06 * s} ${-0.42 * s} ${-0.2 * s}Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * sx} ${sy}) rotate(${lean})`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shadeHex(color, 0.2)} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={shade} />
        </linearGradient>
        <HalftoneDef id={`${id}-ht`} size={s * 0.05} color={shadeHex(shade, -0.4)} r={0.3} />
        <linearGradient id={`${id}-hm`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.5" stopColor="#000" />
          <stop offset="0.9" stopColor="#fff" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <path d={body} fill={`url(#${id}-hm)`} />
        </mask>
      </defs>
      {/* feet */}
      <ellipse cx={-0.2 * s + step * 0.06 * s} cy={-0.06 * s} rx={0.12 * s} ry={0.07 * s} fill={shade} />
      <ellipse cx={0.2 * s - step * 0.06 * s} cy={-0.06 * s} rx={0.12 * s} ry={0.07 * s} fill={shade} />
      {rim ? (
        <>
          <path d={body} fill={ARCADE.cyan} transform={`translate(${0.035 * s} 0)`} opacity={0.75} />
          <path d={body} fill={ARCADE.pink} transform={`translate(${-0.03 * s} 0)`} opacity={0.6} />
        </>
      ) : null}
      <path d={body} fill={`url(#${id}-g)`} />
      <path d={body} fill={`url(#${id}-ht)`} mask={`url(#${id}-m)`} opacity={0.7} />
      {/* stub arms */}
      <ellipse cx={-0.46 * s} cy={-0.42 * s} rx={0.09 * s} ry={0.06 * s} fill={color} transform={`rotate(-20 ${-0.46 * s} ${-0.42 * s})`} />
      <ellipse cx={0.46 * s} cy={-0.42 * s} rx={0.09 * s} ry={0.06 * s} fill={shade} transform={`rotate(20 ${0.46 * s} ${-0.42 * s})`} />
      <Eyes kind={eyes} x={0.04 * s} y={-0.5 * s} r={0.07 * s} gap={0.3 * s} color="#2A0610" dark="#2A0610" />
      <path d={`M${-0.28 * s} ${-0.72 * s} Q${-0.1 * s} ${-0.8 * s} ${0.08 * s} ${-0.78 * s}`} stroke="#fff" strokeWidth={0.03 * s} opacity={0.5} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** neon arcade stage: dark gradient, magenta/cyan haze, focus rays, checker floor, halftone moon disc */
export const ArcadeStage: React.FC<{id: string; w: number; h: number; u: number; frame: number; floorY: number; rays?: boolean; moon?: boolean; ink?: string}> = ({id, w, h, u, frame, floorY, rays = true, moon = true}) => {
  const cx = w / 2;
  const vy = floorY - h * 0.22;
  const nRays = 44;
  const rot = frame * 0.15;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ARCADE.bg} />
          <stop offset="70%" stopColor={ARCADE.bg2} />
          <stop offset="100%" stopColor="#120B30" />
        </linearGradient>
        <radialGradient id={`${id}-hl`} cx="20%" cy="35%" r="45%">
          <stop offset="0%" stopColor="#58255C" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#58255C" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-hr`} cx="82%" cy="35%" r="45%">
          <stop offset="0%" stopColor="#1E4C7A" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#1E4C7A" stopOpacity={0} />
        </radialGradient>
        <HalftoneDef id={`${id}-mh`} size={9 * u} color="#9A93A8" r={0.28} />
        <linearGradient id={`${id}-fl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A2C6A" />
          <stop offset="100%" stopColor="#0B0A22" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-sky)`} />
      <rect width={w} height={h} fill={`url(#${id}-hl)`} />
      <rect width={w} height={h} fill={`url(#${id}-hr)`} />
      {moon ? (
        <g>
          <circle cx={cx + h * 0.05} cy={vy - h * 0.08} r={h * 0.3} fill="#221A44" />
          <circle cx={cx + h * 0.05} cy={vy - h * 0.08} r={h * 0.3} fill={`url(#${id}-mh)`} opacity={0.35} />
          <path d={`M${cx + h * 0.05} ${vy - h * 0.38} A${h * 0.3} ${h * 0.3} 0 0 1 ${cx + h * 0.05} ${vy + h * 0.22} A${h * 0.22} ${h * 0.3} 0 0 0 ${cx + h * 0.05} ${vy - h * 0.38}Z`} fill="#8C86A0" opacity={0.55} />
        </g>
      ) : null}
      {rays ? (
        <g transform={`rotate(${rot} ${cx} ${vy})`} opacity={0.5}>
          {Array.from({length: nRays}, (_, i) => {
            const a = (i / nRays) * Math.PI * 2;
            const r0 = h * (0.28 + 0.06 * h01(i, 2));
            const r1 = Math.max(w, h) * (0.6 + 0.3 * h01(i, 5));
            const col = i % 3 === 0 ? ARCADE.cyan : i % 3 === 1 ? ARCADE.gold : '#C5D6FF';
            return <line key={i} x1={cx + Math.cos(a) * r0} y1={vy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={vy + Math.sin(a) * r1} stroke={col} strokeWidth={(1.5 + 2 * h01(i, 9)) * u} opacity={0.6} />;
          })}
        </g>
      ) : null}
      {/* floor */}
      <rect x={0} y={floorY} width={w} height={h - floorY} fill={`url(#${id}-fl)`} />
      {Array.from({length: 12}, (_, row) => {
        const y0 = floorY + Math.pow(row / 12, 1.6) * (h - floorY);
        const y1 = floorY + Math.pow((row + 1) / 12, 1.6) * (h - floorY);
        return Array.from({length: 18}, (_, col) => {
          if ((row + col) % 2) return null;
          const spread = (yy: number) => 0.6 + ((yy - floorY) / (h - floorY)) * 1.4;
          const xa = cx + (col - 9) * (w / 18) * spread(y0);
          const xb = cx + (col - 8) * (w / 18) * spread(y0);
          const xc = cx + (col - 8) * (w / 18) * spread(y1);
          const xd = cx + (col - 9) * (w / 18) * spread(y1);
          return <path key={`${row}-${col}`} d={`M${xa} ${y0} L${xb} ${y0} L${xc} ${y1} L${xd} ${y1}Z`} fill="#3A3C86" opacity={0.35} />;
        });
      })}
      <rect x={0} y={floorY - 1.5 * u} width={w} height={3 * u} fill={ARCADE.cyan} opacity={0.35} />
    </g>
  );
};

/** seeded spray-grain speckle (white + tinted dots), re-seeded every 2 frames */
export const SprayGrain: React.FC<{w: number; h: number; u: number; frame: number; count?: number; seed?: number; opacity?: number}> = ({w, h, u, frame, count = 900, seed = 1, opacity = 0.5}) => {
  const k = Math.floor(frame / 2);
  const r = rng(seed * 997 + k);
  const cols = ['#FFFFFF', ARCADE.cyan, ARCADE.pink, '#FFE6A8'];
  return (
    <g opacity={opacity} style={{mixBlendMode: 'screen'}}>
      {Array.from({length: count}, (_, i) => (
        <rect key={i} x={r() * w} y={r() * h} width={(1 + r() * 1.5) * u} height={(1 + r() * 1.5) * u} fill={cols[i % 4]} opacity={0.25 + r() * 0.5} />
      ))}
    </g>
  );
};

// ============================================================================================================
// X8 — isometric drafting-paper workbench
// ============================================================================================================

export const ISO = {
  paper: '#F4ECDB',
  paper2: '#F7F2E4',
  grid: '#E8DCC6',
  ink: '#1C253B',
  text: '#232631',
  muted: '#8A8273',
  card: '#F5EFE1',
  border: '#D7CCBA',
  ornament: '#C9B79C',
  shadow: '#B8A58C',
  teal: '#21A69A',
  orange: '#E5A24C',
  board: '#4D588A',
  boardShade: '#313547',
  header: '#232631',
  silver: '#C6C1B8',
  brick: '#C56E60',
  wireRed: '#D63A33',
  wireYellow: '#E9A23B',
  wireGreen: '#3E9E4A',
  wireBlue: '#3F64B5',
  led: '#E0352C',
  servo: '#2D4FC0',
  car: '#E2423A',
  pill: '#181B30',
};

/** 2:1 iso: world (x right-down, y left-down, z up) in world units of `k` px */
export const isoPt = (x: number, y: number, z: number, k: number): [number, number] => [(x - y) * k, (x + y) * k * 0.5 - z * k];

/** outlined three-tone iso box: footprint (x,y,w,d) at z, height hgt */
export const IsoBox: React.FC<{x: number; y: number; z?: number; w: number; d: number; hgt: number; k: number; color: string; top?: string; right?: string; ink?: string; sw?: number; opacity?: number}> = ({
  x,
  y,
  z = 0,
  w,
  d,
  hgt,
  k,
  color,
  top,
  right,
  ink = ISO.ink,
  sw = 2,
  opacity = 1,
}) => {
  const P = (a: number, b: number, c: number) => isoPt(a, b, c, k).map((v) => v.toFixed(1)).join(' ');
  const z1 = z + hgt;
  const topC = top ?? shadeHex(color, 0.14);
  const rightC = right ?? shadeHex(color, -0.2);
  return (
    <g strokeLinejoin="round" stroke={ink} strokeWidth={sw} opacity={opacity}>
      <path d={`M${P(x, y + d, z1)} L${P(x + w, y + d, z1)} L${P(x + w, y + d, z)} L${P(x, y + d, z)}Z`} fill={color} />
      <path d={`M${P(x + w, y, z1)} L${P(x + w, y + d, z1)} L${P(x + w, y + d, z)} L${P(x + w, y, z)}Z`} fill={rightC} />
      <path d={`M${P(x, y, z1)} L${P(x + w, y, z1)} L${P(x + w, y + d, z1)} L${P(x, y + d, z1)}Z`} fill={topC} />
    </g>
  );
};

/** soft cast shadow of a footprint, offset down-right */
export const IsoShadow: React.FC<{x: number; y: number; w: number; d: number; k: number; u: number; opacity?: number; grow?: number}> = ({x, y, w, d, k, u, opacity = 0.45, grow = 0.15}) => {
  const P = (a: number, b: number) => isoPt(a, b, 0, k).map((v) => v.toFixed(1)).join(' ');
  return (
    <path
      d={`M${P(x - grow, y - grow)} L${P(x + w + grow, y - grow)} L${P(x + w + grow, y + d + grow)} L${P(x - grow, y + d + grow)}Z`}
      fill={ISO.shadow}
      opacity={opacity}
      transform={`translate(${6 * u} ${5 * u})`}
    />
  );
};

/** drafting paper: iso grid lines + PCB-trace margin ornaments */
export const DraftPaper: React.FC<{id: string; w: number; h: number; u: number; k: number; ox: number; oy: number; ornaments?: boolean}> = ({id, w, h, u, k, ox, oy, ornaments = true}) => {
  const lines: React.ReactNode[] = [];
  const step = k;
  const n = Math.ceil((w + h) / step) + 4;
  for (let i = -n; i <= n; i++) {
    // lines at +-26.57 deg (2:1)
    const y0 = oy + i * step;
    lines.push(<line key={`p${i}`} x1={-w} y1={y0 - (ox + w) * 0.5} x2={w * 2} y2={y0 + (w * 2 - ox) * 0.5} />);
    lines.push(<line key={`m${i}`} x1={-w} y1={y0 + (ox + w) * 0.5} x2={w * 2} y2={y0 - (w * 2 - ox) * 0.5} />);
  }
  const r = rng(11);
  const traces = ornaments
    ? Array.from({length: 10}, (_, i) => {
        const left = i % 2 === 0;
        const x0 = left ? r() * w * 0.08 : w - r() * w * 0.08;
        const y0 = r() * h;
        const dx = (left ? 1 : -1) * (40 + r() * 80) * u;
        const dy = (r() > 0.5 ? 1 : -1) * (30 + r() * 60) * u;
        return (
          <g key={i}>
            <path d={`M${x0} ${y0} h${dx} l${dy * Math.sign(dx)} ${dy} h${dx * 0.6}`} stroke={ISO.ornament} strokeWidth={1.5 * u} fill="none" />
            <circle cx={x0 + dx * 1.6 + dy * Math.sign(dx)} cy={y0 + dy} r={4 * u} stroke={ISO.ornament} strokeWidth={1.5 * u} fill={ISO.paper} />
          </g>
        );
      })
    : null;
  return (
    <g>
      <rect width={w} height={h} fill={ISO.paper} />
      <g stroke={ISO.grid} strokeWidth={1 * u} opacity={0.75}>
        {lines}
      </g>
      {traces}
      <rect width={w} height={h} fill="none" stroke="none" id={id} />
    </g>
  );
};

/** chunky cable: outline + colour + highlight, along a lifted cubic between two screen points; t = grow 0..1 */
export const Cable: React.FC<{a: [number, number]; b: [number, number]; lift: number; color: string; width: number; t?: number; ink?: string}> = ({a, b, lift, color, width, t = 1, ink = ISO.ink}) => {
  if (t <= 0) return null;
  const c1: [number, number] = [a[0] + (b[0] - a[0]) * 0.15, a[1] - lift];
  const c2: [number, number] = [a[0] + (b[0] - a[0]) * 0.85, b[1] - lift * 0.8];
  const d = `M${a[0]} ${a[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`;
  const dash = t >= 0.999 ? undefined : `${t} 2`;
  const common = {d, fill: 'none', strokeLinecap: 'round' as const, pathLength: 1, strokeDasharray: dash};
  return (
    <g>
      <path {...common} stroke={ink} strokeWidth={width * 1.45} />
      <path {...common} stroke={color} strokeWidth={width} />
      <path {...common} stroke="#fff" strokeWidth={width * 0.22} opacity={0.35} transform={`translate(0 ${-width * 0.22})`} />
    </g>
  );
};

/** navy value pill with white mono text, anchored at its left-middle */
export const ValuePill: React.FC<{x: number; y: number; text: string; size: number; bg?: string; color?: string; font?: string}> = ({x, y, text, size, bg = ISO.pill, color = '#fff', font = x58Fonts.mono}) => {
  const wd = text.length * size * 0.62 + size * 1.1;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={-size * 0.85} width={wd} height={size * 1.7} rx={size * 0.85} fill={bg} />
      <text x={wd / 2} y={size * 0.35} textAnchor="middle" fontFamily={font} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

export type IsoBounds = {x0: number; y0: number; x1: number; y1: number};
/** screen-space bounds of iso boxes (in world px, before camera) */
export const isoBounds = (boxes: {x: number; y: number; z?: number; w: number; d: number; hgt: number}[], k: number): IsoBounds => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const b of boxes) {
    for (const [a, c, zz] of [
      [b.x, b.y, b.z ?? 0],
      [b.x + b.w, b.y, b.z ?? 0],
      [b.x, b.y + b.d, b.z ?? 0],
      [b.x + b.w, b.y + b.d, b.z ?? 0],
      [b.x, b.y, (b.z ?? 0) + b.hgt],
      [b.x + b.w, b.y, (b.z ?? 0) + b.hgt],
      [b.x, b.y + b.d, (b.z ?? 0) + b.hgt],
      [b.x + b.w, b.y + b.d, (b.z ?? 0) + b.hgt],
    ] as [number, number, number][]) {
      const [sx, sy] = isoPt(a, c, zz, k);
      x0 = Math.min(x0, sx);
      y0 = Math.min(y0, sy);
      x1 = Math.max(x1, sx);
      y1 = Math.max(y1, sy);
    }
  }
  if (!Number.isFinite(x0)) return {x0: -1, y0: -1, x1: 1, y1: 1};
  return {x0, y0, x1, y1};
};

/**
 * auto-frame camera: fit `bounds` into a viewport (vx, vy, vw, vh) with a margin, clamped zoom.
 * Returns {scale, tx, ty} so that screen = world * scale + (tx, ty).
 */
export const fitCamera = (b: IsoBounds, vx: number, vy: number, vw: number, vh: number, margin = 0.08, minScale = 0.4, maxScale = 3) => {
  const bw = Math.max(1, b.x1 - b.x0);
  const bh = Math.max(1, b.y1 - b.y0);
  const scale = cl(Math.min(vw / bw, vh / bh) * (1 - margin * 2), minScale, maxScale);
  const tx = vx + vw / 2 - ((b.x0 + b.x1) / 2) * scale;
  const ty = vy + vh / 2 - ((b.y0 + b.y1) / 2) * scale;
  return {scale, tx, ty};
};
export type Cam = {scale: number; tx: number; ty: number};
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({scale: a.scale + (b.scale - a.scale) * t, tx: a.tx + (b.tx - a.tx) * t, ty: a.ty + (b.ty - a.ty) * t});
/** camera for step-based scenes: interpolate fits between steps over `frames` starting at each step change */
export const autoFrameAt = (frame: number, stepAt: number[], camFor: (step: number) => Cam, frames = 21, delay = 0) => {
  let step = 0;
  for (let i = 0; i < stepAt.length; i++) if (frame >= stepAt[i]) step = i;
  const from = step > 0 ? camFor(step - 1) : camFor(0);
  const to = camFor(step);
  const t = easeInOutCubic(lin(frame, stepAt[step] + delay, stepAt[step] + delay + frames));
  return {cam: lerpCam(from, to, step > 0 ? t : 1), step};
};

// ============================================================================================================
// X5 — layered paper scene engine (paper-diorama, popup-layer-rise)
// ============================================================================================================

export type PaperLayerKey = 'sky' | 'clouds' | 'far' | 'near' | 'forest' | 'mid' | 'front' | 'fore';
export const PAPER_LAYERS: {key: PaperLayerKey; depth: number}[] = [
  {key: 'sky', depth: 0},
  {key: 'clouds', depth: 0.1},
  {key: 'far', depth: 0.2},
  {key: 'near', depth: 0.35},
  {key: 'forest', depth: 0.5},
  {key: 'mid', depth: 0.65},
  {key: 'front', depth: 0.85},
  {key: 'fore', depth: 1},
];

export type PaperSceneProps = {
  id: string;
  w: number;
  h: number;
  u: number;
  frame: number;
  fps: number;
  pal: PaperPalette;
  seed: number;
  /** per-layer vertical offset (px), opacity and vertical motion blur, by layer index (0 = sky) */
  offset?: (i: number, depth: number) => {dy: number; opacity?: number; blur?: number};
  rate: number;
  pan: number;
  focus: [number, number];
  hero: boolean;
  heroPose: CritterPose;
  species: string;
  heroX: number;
  ambient: string[];
  guideStar: boolean;
  starIgnite: number;
  starX: number;
  starY: number;
  dof: number;
  heroNode?: React.ReactNode;
};

export const PaperScene: React.FC<PaperSceneProps> = ({id, w, h, u, frame, fps, pal, seed, offset, rate, pan, focus, hero, heroPose, species, heroX, ambient, guideStar, starIgnite, starX, starY, dof, heroNode}) => {
  const t = frame / fps;
  const S = Math.min(h, w * 0.75);
  const fid = `${id}-paper`;
  const amb = new Set(ambient);
  const night = pal.night || amb.has('stars');
  const sunX = w * 0.84;
  const sunY = h * 0.4;
  const far = mountainRange(seed * 7 + 1, -w * 0.08, w * 1.08, h * 0.47, S * 0.1, S * 0.26, 6);
  const near = mountainRange(seed * 7 + 2, -w * 0.1, w * 1.1, h * 0.53, S * 0.05, S * 0.14, 8, 0.22);
  const heroH = 0.24 * S;
  const heroFeetY = h * 0.6;
  const layerTf = (i: number, depth: number) => {
    const sc = 1 + (rate / 100) * t * (0.4 + 0.6 * depth);
    const fx = focus[0] * w;
    const fy = focus[1] * h;
    const o = offset ? offset(i, depth) : {dy: 0};
    const px = -pan * u * t * depth;
    return {transform: `translate(${px.toFixed(2)} ${o.dy.toFixed(2)}) translate(${fx} ${fy}) scale(${sc.toFixed(5)}) translate(${-fx} ${-fy})`, opacity: o.opacity ?? 1, blur: o.blur ?? 0};
  };
  const streamPts = (k: number) =>
    Array.from({length: 12}, (_, i) => {
      const s = i / 11;
      return [w * (0.27 + 0.8 * s), h * (0.7 + 0.13 * Math.sin(s * 2.6 + 0.2)) + k] as [number, number];
    });
  const ribbon = (() => {
    const a = streamPts(-S * 0.035);
    const b = streamPts(S * 0.05).reverse();
    return 'M' + [...a, ...b].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + 'Z';
  })();
  const r = rng(seed * 31);
  const flowers = Array.from({length: 26}, () => ({x: r(), y: r(), s: r(), c: r()}));
  const rocks = Array.from({length: 7}, (_, i) => ({x: 0.4 + i * 0.09 + r() * 0.03, y: 0.78 + r() * 0.12, s: 0.6 + r() * 0.8}));
  const layer = (i: number, children: React.ReactNode, filtered = true) => {
    const L = PAPER_LAYERS[i];
    const tf = layerTf(i, L.depth);
    if (tf.opacity <= 0) return null;
    return (
      <g key={L.key} transform={tf.transform} opacity={tf.opacity}>
        <g filter={tf.blur > 0.3 ? `url(#${id}-mb${i})` : undefined}>
          <g filter={filtered ? `url(#${fid})` : undefined}>{children}</g>
        </g>
      </g>
    );
  };
  const flowerCols = ['#8C4FC9', '#E3E0D6', '#E9A531', '#D84F6E', '#5D5BC8'];
  const twinkle = 0.92 + 0.08 * Math.sin(t * Math.PI * 2 * 1.2);
  const starR = Math.min(w, h * 1.6) * 0.021;
  return (
    <g>
      <defs>
        <PaperFilter id={fid} u={u} h={h} rim={pal.rim} seed={seed} />
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal.skyTop} />
          <stop offset="45%" stopColor={pal.skyMid} />
          <stop offset="78%" stopColor={pal.skyLow} />
          <stop offset="100%" stopColor={pal.glow} />
        </linearGradient>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0%" stopColor={pal.glow} stopOpacity={0.95} />
          <stop offset="35%" stopColor={pal.glow} stopOpacity={0.45} />
          <stop offset="100%" stopColor={pal.glow} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={shadeHex(pal.water, -0.15)} />
          <stop offset="100%" stopColor={shadeHex(pal.water, 0.1)} />
        </linearGradient>
        <filter id={`${id}-dof`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={dof * u} />
        </filter>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={4 * u} />
        </filter>
        {PAPER_LAYERS.map((L, i) => {
          const b = offset ? offset(i, L.depth).blur ?? 0 : 0;
          return b > 0.3 ? (
            <filter key={i} id={`${id}-mb${i}`} x="-5%" y="-30%" width="110%" height="160%">
              <feGaussianBlur stdDeviation={`0 ${b.toFixed(2)}`} />
            </filter>
          ) : null;
        })}
      </defs>
      {/* 0 sky */}
      {layer(
        0,
        <g>
          <rect x={-w * 0.2} y={-h * 0.2} width={w * 1.4} height={h * 1.4} fill={`url(#${id}-sky)`} />
          {night ? (
            <g>
              <circle cx={w * 0.8} cy={h * 0.2} r={S * 0.16} fill={`url(#${id}-sun)`} />
              <circle cx={w * 0.8} cy={h * 0.2} r={S * 0.065} fill={pal.glow} opacity={0.95} />
            </g>
          ) : (
            <g>
              <circle cx={sunX} cy={sunY} r={S * 0.32} fill={`url(#${id}-sun)`} />
              <circle cx={sunX} cy={sunY} r={S * 0.08} fill={pal.glow} opacity={0.8} />
              {Array.from({length: 16}, (_, i) => {
                const a = Math.PI + (i / 15) * Math.PI;
                return <line key={i} x1={sunX + Math.cos(a) * S * 0.1} y1={sunY + Math.sin(a) * S * 0.1} x2={sunX + Math.cos(a) * S * 0.22} y2={sunY + Math.sin(a) * S * 0.22} stroke={pal.glow} strokeWidth={1.2 * u} opacity={0.35 + 0.15 * Math.sin(t * 2 + i)} />;
              })}
            </g>
          )}
          {night
            ? Array.from({length: 70}, (_, i) => {
                const x = h01(i, seed, 1) * w;
                const y = h01(i, seed, 2) * h * 0.45;
                const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (1 + h01(i, 3) * 2) + i));
                return <circle key={i} cx={x} cy={y} r={(0.8 + h01(i, 4) * 1.6) * u} fill="#FFF3D6" opacity={tw * 0.9} />;
              })
            : null}
        </g>,
        false,
      )}
      {/* 1 clouds */}
      {layer(
        1,
        <g>
          <path d={cloudPath(seed + 1, w * 0.3, h * 0.2, w * 0.36, S * 0.14, 8)} fill={pal.cloud} />
          <path d={cloudPath(seed + 2, w * 0.24, h * 0.27, w * 0.24, S * 0.09, 6)} fill={pal.cloudShade} />
          <path d={cloudPath(seed + 3, w * 0.95, h * 0.24, w * 0.16, S * 0.08, 5)} fill={pal.cloud} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${w * (0.62 + i * 0.07)} ${h * (0.1 + i * 0.05)} q${w * 0.06} ${-S * 0.02} ${w * 0.14} 0 q${-w * 0.07} ${S * 0.012} ${-w * 0.14} 0Z`} fill={shadeHex(pal.cloud, -0.08)} />
          ))}
        </g>,
      )}
      {/* 2 far range */}
      {layer(
        2,
        <g>
          <path d={far.base} fill={pal.far} />
          <path d={far.shade} fill={pal.farShade} opacity={0.75} />
          <path d={far.snow} fill={pal.snow} />
        </g>,
      )}
      {/* 3 near range + lake */}
      {layer(
        3,
        <g>
          <path d={near.base} fill={pal.near} />
          <path d={near.shade} fill={pal.nearShade} opacity={0.8} />
          <path d={near.snow} fill={pal.snow} opacity={0.85} />
          <rect x={w * 0.4} y={h * 0.535} width={w * 0.62} height={S * 0.05} fill={pal.water} />
          {Array.from({length: 6}, (_, i) => (
            <rect key={i} x={w * (0.5 + i * 0.07) + Math.sin(t + i) * 6 * u} y={h * 0.545 + (i % 3) * S * 0.012} width={w * 0.05} height={1.6 * u} fill={pal.glow} opacity={0.6} />
          ))}
        </g>,
      )}
      {/* 4 forest band */}
      {layer(
        4,
        <g>
          <path d={hillPath(seed + 4, w * 0.35, w * 1.1, h * 0.6, S * 0.06, h * 1.2, 1, -S * 0.04)} fill={pal.meadow2} />
          <path d={pineRow(seed + 5, w * 0.42, w * 1.05, h * 0.6, S * 0.06, S * 0.12, 26)} fill={pal.forest} />
          <path d={pineRow(seed + 6, w * 0.6, w * 1.05, h * 0.64, S * 0.05, S * 0.1, 16)} fill={shadeHex(pal.forest, -0.15)} />
          <path d={pineRow(seed + 7, -w * 0.02, w * 0.18, h * 0.52, S * 0.14, S * 0.3, 5)} fill={pal.forest} />
        </g>,
      )}
      {/* 5 mid meadow + hero + bridge */}
      {layer(
        5,
        <g>
          <path d={hillPath(seed + 8, -w * 0.1, w * 1.1, h * 0.64, S * 0.05, h * 1.2, 1, h * 0.12)} fill={pal.meadow} />
          {Array.from({length: 90}, (_, i) => (
            <path key={`g${i}`} d={`M${w * h01(i, 41)} ${h * (0.66 + 0.32 * h01(i, 42))} l${2 * u} ${-7 * u} l${2 * u} ${7 * u}`} stroke={shadeHex(pal.meadow, -0.18)} strokeWidth={1.4 * u} fill="none" />
          ))}
          {Array.from({length: 120}, (_, i) => (
            <circle key={i} cx={w * (0.02 + 0.96 * h01(i, 5))} cy={h * (0.68 + 0.3 * h01(i, 6))} r={2.4 * u} fill={flowerCols[i % 5]} opacity={0.85} />
          ))}
          <path
            fillRule="evenodd"
            d={`M${w * 0.16} ${heroFeetY} L${w * 0.47} ${heroFeetY} L${w * 0.46} ${heroFeetY + S * 0.13} L${w * 0.17} ${heroFeetY + S * 0.13}Z M${w * 0.2} ${heroFeetY + S * 0.13} Q${w * 0.2} ${heroFeetY + S * 0.035} ${w * 0.315} ${heroFeetY + S * 0.035} Q${w * 0.43} ${heroFeetY + S * 0.035} ${w * 0.43} ${heroFeetY + S * 0.13}Z`}
            fill="#80604A"
          />
          {Array.from({length: 3}, (_, row) =>
            Array.from({length: 16}, (_, i) => (
              <rect key={`st${row}-${i}`} x={w * (0.165 + i * 0.019 + (row % 2) * 0.009)} y={heroFeetY + S * (0.004 + row * 0.011)} width={w * 0.017} height={S * 0.009} fill={i % 3 ? '#8C6B53' : '#755640'} />
            )),
          )}
          <rect x={w * 0.155} y={heroFeetY - S * 0.008} width={w * 0.32} height={S * 0.012} fill="#9A7A5E" />
          <rect x={w * 0.155} y={heroFeetY - S * 0.03} width={w * 0.012} height={S * 0.03} fill="#80604A" />
          <rect x={w * 0.463} y={heroFeetY - S * 0.03} width={w * 0.012} height={S * 0.03} fill="#80604A" />
          {hero ? heroNode ?? <PaperCritter id={`${id}-hero`} x={w * heroX} y={heroFeetY} H={heroH} frame={frame} fps={fps} pose={heroPose} colors={CRITTER_SPECIES[species] ?? CRITTER_SPECIES.fox} /> : null}
        </g>,
      )}
      {/* 6 front: stream + rocks + flowers */}
      {layer(
        6,
        <g>
          <path d={ribbon} fill={`url(#${id}-water)`} />
          {Array.from({length: 18}, (_, i) => {
            const pts = streamPts(((i % 5) - 2) * S * 0.015);
            const s = (((i * 0.13 + t * 0.12) % 1) + 1) % 1;
            const k = Math.min(10, Math.floor(s * 10));
            const [x0, y0] = pts[k];
            const [x1, y1] = pts[k + 1];
            return <line key={i} x1={x0} y1={y0} x2={x0 + (x1 - x0) * 0.6} y2={y0 + (y1 - y0) * 0.6} stroke={pal.foam} strokeWidth={2.4 * u} strokeLinecap="round" opacity={0.7} />;
          })}
          {rocks.map((rk, i) => {
            const x = w * rk.x;
            const y = h * rk.y;
            const s = S * 0.05 * rk.s;
            return (
              <g key={i}>
                <path d={`M${x - s} ${y} L${x - s * 0.8} ${y - s * 0.7} L${x - s * 0.1} ${y - s} L${x + s * 0.8} ${y - s * 0.6} L${x + s} ${y}Z`} fill={pal.rock} />
                <path d={`M${x - s * 0.1} ${y - s} L${x + s * 0.8} ${y - s * 0.6} L${x + s} ${y} L${x + s * 0.2} ${y}Z`} fill={shadeHex(pal.rock, -0.25)} />
                <circle cx={x - s * 0.3} cy={y - s * 0.6} r={s * 0.12} fill="#8FA04A" opacity={0.8} />
              </g>
            );
          })}
          <path d={hillPath(seed + 9, w * 0.7, w * 1.1, h * 0.84, S * 0.05, h * 1.2, 1, -h * 0.1)} fill={pal.meadow2} />
          <path d={hillPath(seed + 10, -w * 0.05, w * 0.5, h * 0.92, S * 0.03, h * 1.2, 1, h * 0.04)} fill={shadeHex(pal.meadow, -0.08)} />
          {flowers.slice(0, 14).map((f, i) => (
            <circle key={i} cx={w * (0.8 + 0.2 * f.x)} cy={h * (0.84 + 0.14 * f.y)} r={(3 + 3 * f.s) * u} fill={flowerCols[Math.floor(f.c * 5)]} />
          ))}
        </g>,
      )}
      {/* 7 foreground prop (blurred, DOF) */}
      <g filter={dof > 0 ? `url(#${id}-dof)` : undefined}>
        {layer(
          7,
          <g>
            {Array.from({length: 7}, (_, i) => {
              const x = w * (0.0 + i * 0.045);
              const top = h * (0.66 + 0.08 * h01(i, 8));
              return <path key={`b${i}`} d={`M${x} ${h * 1.05} Q${x + w * 0.02} ${(top + h) / 2} ${x + w * 0.01} ${top} Q${x + w * 0.03} ${(top + h) / 2} ${x + w * 0.035} ${h * 1.05}Z`} fill={shadeHex(pal.forest, 0.1 + 0.1 * (i % 2))} />;
            })}
            {flowers.slice(14).map((f, i) => {
              const x = w * (0.02 + 0.26 * f.x);
              const y = h * (0.8 + 0.18 * f.y);
              const s = (22 + 30 * f.s) * (S / 1080);
              const col = flowerCols[Math.floor(f.c * 5)];
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  {Array.from({length: 8}, (_, k) => (
                    <ellipse key={k} cx={0} cy={-s * 0.55} rx={s * 0.22} ry={s * 0.55} fill={col} transform={`rotate(${k * 45})`} />
                  ))}
                  <circle r={s * 0.3} fill="#E9A531" />
                </g>
              );
            })}
            {[0.03, 0.08, 0.2].map((fx, i) => (
              <g key={`l${i}`}>
                {Array.from({length: 9}, (_, k) => (
                  <circle key={k} cx={w * fx + (k % 2 ? 4 : -4) * u} cy={h * (0.66 + i * 0.03) + k * 9 * (S / 1080)} r={(6 - k * 0.3) * (S / 1080) * 1.2} fill="#5D5BC8" />
                ))}
              </g>
            ))}
          </g>,
        )}
      </g>
      {/* ambient */}
      {amb.has('fireflies')
        ? Array.from({length: 46}, (_, i) => {
            const x = w * (0.05 + 0.9 * h01(i, 21)) + n2('ffx' + i, t * 0.3, i) * 60 * u;
            const y = h * (0.15 + 0.6 * h01(i, 22)) + n2('ffy' + i, t * 0.3, i) * 50 * u;
            const blink = 0.3 + 0.7 * Math.max(0, Math.sin((t * Math.PI * 2) / (1.5 + 1.5 * h01(i, 23)) + i));
            return (
              <g key={`ff${i}`}>
                <circle cx={x} cy={y} r={14 * u} fill="#F2B33D" opacity={0.25 * blink} filter={`url(#${id}-glow)`} />
                <circle cx={x} cy={y} r={3.2 * u} fill="#FFE08A" opacity={blink} />
              </g>
            );
          })
        : null}
      {amb.has('rain')
        ? Array.from({length: 120}, (_, i) => {
            const x = ((h01(i, 31) * w * 1.2 + t * 120 * u) % (w * 1.2)) - w * 0.1;
            const y = ((h01(i, 32) * h + t * 900 * u * (0.8 + 0.4 * h01(i, 33))) % (h * 1.1)) - h * 0.05;
            return <line key={`r${i}`} x1={x} y1={y} x2={x - 6 * u} y2={y + 30 * u} stroke="#D9E3EE" strokeWidth={1.4 * u} opacity={0.45} />;
          })
        : null}
      {/* guide star: bloom ignite + sparkle spray, then a trail of 6 tiny stars */}
      {guideStar && frame >= starIgnite
        ? (() => {
            const sx = starX * w;
            const sy = starY * h;
            const bloom = frame < starIgnite + 5 ? 1.45 * easeOutQuad(lin(frame, starIgnite, starIgnite + 3)) : 1.45 - 0.45 * easeOutQuad(lin(frame, starIgnite + 5, starIgnite + 10));
            return (
              <g>
                {Array.from({length: 10}, (_, i) => {
                  const a = (i / 10) * Math.PI * 2 + 0.3;
                  const p = lin(frame, starIgnite, starIgnite + 14);
                  if (p >= 1) return null;
                  const d = w * 0.03 * easeOutQuad(p);
                  return <circle key={i} cx={sx + Math.cos(a) * d} cy={sy + Math.sin(a) * d} r={1.8 * u} fill="#FFF3C4" opacity={1 - p} />;
                })}
                <GuideStar id={`${id}-star`} x={sx} y={sy} r={starR * bloom * twinkle} />
                {Array.from({length: 6}, (_, i) => {
                  const k = pop(frame, starIgnite + 10 + i * 2, 5, 1.25);
                  if (k <= 0) return null;
                  const dd = starR * 1.25 * (i + 1.6);
                  const x = sx - dd;
                  const y = sy + dd * 0.35 + i * i * 1.6 * u;
                  const sz = starR * (0.55 - i * 0.05) * k * (0.85 + 0.15 * Math.sin(t * 7 + i));
                  return <path key={i} d={star4(sz, 0.2)} transform={`translate(${x} ${y})`} fill="#F3D88A" />;
                })}
              </g>
            );
          })()
        : null}
    </g>
  );
};

// ============================================================================================================
// X8 — isometric hardware parts (circuit-rebuild, iso-actuators, lesson-carousel, inspector-popover)
// Original generic designs (an unbranded dev board, breadboard, LED, sensor, servo…), world units, 2:1 iso.
// ============================================================================================================

export type PartKind = 'board' | 'breadboard' | 'resistor' | 'led' | 'button' | 'sensor' | 'wall' | 'motor' | 'servo' | 'light' | 'car' | 'ball';
export type PartDef = {fp: [number, number, number, number, number]; enter: 'slide' | 'drop' | 'grow'; pin?: [number, number, number]; cable?: string[]; label: string};

/** default footprints [x, y, w, d, height] in world units, entry style, cable target pin and colours */
export const PART_DEFS: Record<PartKind, PartDef> = {
  board: {fp: [0, 0, 6, 4, 0.25], enter: 'grow', label: 'Dev board'},
  breadboard: {fp: [7.4, -0.5, 4, 5.6, 0.55], enter: 'slide', label: 'Breadboard'},
  resistor: {fp: [8.2, 2.6, 1.3, 0.35, 0.35], enter: 'drop', label: 'Resistor'},
  led: {fp: [9.9, 2.5, 0.6, 0.6, 1.1], enter: 'drop', pin: [10.2, 2.8, 0.7], cable: ['#E9A23B'], label: 'LED'},
  button: {fp: [9.6, 0.6, 1.1, 1.1, 0.7], enter: 'drop', pin: [10.1, 1.1, 0.7], cable: ['#3F64B5', '#D63A33'], label: 'Button'},
  sensor: {fp: [8.0, 1.2, 3.2, 0.5, 1.5], enter: 'slide', pin: [9.6, 1.4, 1.2], cable: ['#E9A23B', '#3E9E4A', '#D63A33'], label: 'Distance sensor'},
  wall: {fp: [5.2, 6.4, 3.2, 0.6, 2.0], enter: 'grow', label: 'Brick wall'},
  motor: {fp: [8.3, 2.2, 1.8, 1.2, 1.1], enter: 'drop', pin: [9.2, 2.8, 1.1], cable: ['#E9A23B', '#232631'], label: 'DC motor'},
  servo: {fp: [8.4, 1.4, 1.6, 2.6, 1.6], enter: 'slide', pin: [9.2, 2.7, 1.6], cable: ['#D63A33', '#232631', '#E9A23B'], label: 'Servo'},
  light: {fp: [11.6, 1.6, 0.7, 0.7, 2.6], enter: 'grow', pin: [11.9, 1.9, 1.2], cable: ['#3E9E4A', '#3F64B5'], label: 'Traffic light'},
  car: {fp: [5.6, 6.6, 2.2, 1.2, 0.9], enter: 'grow', label: 'Toy car'},
  ball: {fp: [5.6, 6.6, 1.4, 1.4, 1.4], enter: 'grow', label: 'Beach ball'},
};
/** the board header pin cables start from */
export const BOARD_PIN: [number, number, number] = [5.2, 0.45, 0.62];

export type PartSignals = {led?: number; fan?: number; fanSpeed?: number; servo?: number; light?: 'green' | 'yellow' | 'red'; pressed?: number};

const dotGrid = (x: number, y: number, z: number, w: number, d: number, k: number, step: number, r: number, col: string) => {
  const out: React.ReactNode[] = [];
  for (let a = x + step / 2; a < x + w; a += step)
    for (let b = y + step / 2; b < y + d; b += step) {
      if (Math.abs(b - (y + d / 2)) < step * 0.6) continue;
      const [sx, sy] = isoPt(a, b, z, k);
      out.push(<rect key={`${a.toFixed(2)}-${b.toFixed(2)}`} x={sx - r} y={sy - r * 0.5} width={r * 2} height={r} fill={col} />);
    }
  return out;
};

/** draws one part at its footprint (offset by dx, dy, dz world units), in world px around the iso origin */
export const IsoPart: React.FC<{kind: PartKind; k: number; u: number; dx?: number; dy?: number; dz?: number; sig?: PartSignals; frame?: number; fp?: [number, number, number, number, number]}> = ({kind, k, u, dx = 0, dy = 0, dz = 0, sig = {}, frame = 0, fp}) => {
  const [x0, y0, w, d, hh] = fp ?? PART_DEFS[kind].fp;
  const x = x0 + dx;
  const y = y0 + dy;
  const z = dz;
  const sw = Math.max(1, k * 0.045);
  const P = (a: number, b: number, c: number) => isoPt(a, b, c, k);
  const shadow = <IsoShadow x={x} y={y} w={w} d={d} k={k} u={u} opacity={Math.max(0, 0.45 - z * 0.15)} />;
  if (kind === 'board') {
    return (
      <g>
        {shadow}
        <IsoBox x={x} y={y} z={z} w={w} d={d} hgt={hh} k={k} color={ISO.board} top="#56629A" right={ISO.boardShade} sw={sw} />
        {/* holes */}
        {[[0.3, 0.3], [5.7, 0.3], [0.3, 3.7], [5.7, 3.7]].map(([a, b], i) => {
          const [sx, sy] = P(x + a, y + b, z + hh);
          return <ellipse key={i} cx={sx} cy={sy} rx={k * 0.14} ry={k * 0.07} fill="#C8BFA8" stroke={ISO.ink} strokeWidth={sw * 0.6} />;
        })}
        {/* headers */}
        <IsoBox x={x + 2.2} y={y + 0.2} z={z + hh} w={3.4} d={0.4} hgt={0.35} k={k} color={ISO.header} sw={sw} />
        <IsoBox x={x + 2.8} y={y + 3.4} z={z + hh} w={2.8} d={0.4} hgt={0.35} k={k} color={ISO.header} sw={sw} />
        {/* usb + jack */}
        <IsoBox x={x - 0.3} y={y + 0.4} z={z + hh} w={1.3} d={1.1} hgt={0.9} k={k} color={ISO.silver} sw={sw} />
        <IsoBox x={x - 0.3} y={y + 2.6} z={z + hh} w={1.1} d={0.8} hgt={0.7} k={k} color={ISO.header} sw={sw} />
        {/* chip */}
        <IsoBox x={x + 2.4} y={y + 2.0} z={z + hh} w={2.8} d={0.7} hgt={0.22} k={k} color={ISO.header} sw={sw} />
        {/* caps */}
        {[1.4, 1.9].map((a, i) => {
          const [sx, sy] = P(x + a, y + 3.1, z + hh);
          return (
            <g key={i}>
              <rect x={sx - k * 0.2} y={sy - k * 0.5} width={k * 0.4} height={k * 0.5} fill="#D9D6CE" stroke={ISO.ink} strokeWidth={sw * 0.7} />
              <ellipse cx={sx} cy={sy - k * 0.5} rx={k * 0.2} ry={k * 0.1} fill="#EEECE6" stroke={ISO.ink} strokeWidth={sw * 0.7} />
            </g>
          );
        })}
        {/* power led + label */}
        {(() => {
          const [sx, sy] = P(x + 1.6, y + 0.6, z + hh);
          return <rect x={sx - k * 0.12} y={sy - k * 0.12} width={k * 0.24} height={k * 0.16} fill="#E0352C" stroke={ISO.ink} strokeWidth={sw * 0.5} />;
        })()}
      </g>
    );
  }
  if (kind === 'breadboard') {
    return (
      <g>
        {shadow}
        <IsoBox x={x} y={y} z={z} w={w} d={d} hgt={hh} k={k} color="#E9E2D2" top="#F4EFE4" right="#CFC6B3" sw={sw} />
        {dotGrid(x + 0.2, y + 0.2, z + hh, w - 0.4, d - 0.4, k, 0.38, k * 0.06, '#5B5446')}
        <path d={`M${P(x + 0.15, y + d / 2, z + hh).join(' ')} L${P(x + w - 0.15, y + d / 2, z + hh).join(' ')}`} stroke="#BDB39E" strokeWidth={sw * 1.4} />
      </g>
    );
  }
  if (kind === 'resistor') {
    const [ax, ay] = P(x, y + d / 2, z + 0.3);
    const [bx, by] = P(x + w, y + d / 2, z + 0.3);
    return (
      <g>
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#8D8A84" strokeWidth={sw * 1.2} />
        <IsoBox x={x + 0.3} y={y} z={z + 0.12} w={w - 0.6} d={d} hgt={hh} k={k} color="#D8BE92" sw={sw * 0.8} />
        {[0.45, 0.6, 0.75].map((a, i) => {
          const [sx, sy] = P(x + a, y + d, z + 0.3);
          return <line key={i} x1={sx} y1={sy - k * 0.12} x2={sx} y2={sy + k * 0.08} stroke={['#7A3A1A', '#1C253B', '#D63A33'][i]} strokeWidth={sw * 1.2} />;
        })}
      </g>
    );
  }
  if (kind === 'led') {
    const on = sig.led ?? 0;
    const [cx, cy] = P(x + w / 2, y + d / 2, z + hh * 0.55);
    return (
      <g>
        {[-0.12, 0.12].map((o, i) => {
          const [lx, ly] = P(x + w / 2 + o, y + d / 2, z);
          return <line key={i} x1={lx} y1={ly} x2={lx} y2={ly - k * 0.4} stroke="#8D8A84" strokeWidth={sw} />;
        })}
        {on > 0 ? <circle cx={cx} cy={cy - k * 0.2} r={k * 0.9 * on} fill="#FF5A4A" opacity={0.35 * on} /> : null}
        <rect x={cx - k * 0.28} y={cy - k * 0.55} width={k * 0.56} height={k * 0.55} fill={mixHex(ISO.led, '#FFB0A0', on * 0.6)} stroke={ISO.ink} strokeWidth={sw} />
        <path d={`M${cx - k * 0.28} ${cy - k * 0.55} A${k * 0.28} ${k * 0.32} 0 0 1 ${cx + k * 0.28} ${cy - k * 0.55}`} fill={mixHex(ISO.led, '#FFD0C8', on * 0.6)} stroke={ISO.ink} strokeWidth={sw} />
        <ellipse cx={cx} cy={cy} rx={k * 0.34} ry={k * 0.12} fill={shadeHex(ISO.led, -0.2)} stroke={ISO.ink} strokeWidth={sw} />
        <line x1={cx - k * 0.12} y1={cy - k * 0.7} x2={cx - k * 0.12} y2={cy - k * 0.45} stroke="#fff" strokeWidth={sw * 0.8} opacity={0.7} />
      </g>
    );
  }
  if (kind === 'button') {
    const pr = sig.pressed ?? 0;
    const [cx, cy] = P(x + w / 2, y + d / 2, z + hh);
    return (
      <g>
        {shadow}
        <IsoBox x={x} y={y} z={z} w={w} d={d} hgt={hh * 0.6} k={k} color="#2B2F3E" sw={sw} />
        <ellipse cx={cx} cy={cy - k * 0.05 + pr * k * 0.12} rx={k * 0.42} ry={k * 0.22} fill="#C83A32" stroke={ISO.ink} strokeWidth={sw} />
        <ellipse cx={cx} cy={cy - k * 0.22 + pr * k * 0.12} rx={k * 0.42} ry={k * 0.22} fill="#E2524A" stroke={ISO.ink} strokeWidth={sw} />
      </g>
    );
  }
  if (kind === 'sensor') {
    return (
      <g>
        {shadow}
        <IsoBox x={x} y={y} z={z} w={w} d={d} hgt={hh} k={k} color="#3549A8" top="#4A5DBD" right="#283A8A" sw={sw} />
        {[0.8, 2.4].map((a, i) => {
          const [sx, sy] = P(x + a, y + d, z + hh * 0.5);
          return (
            <g key={i}>
              <ellipse cx={sx - k * 0.25} cy={sy + k * 0.12} rx={k * 0.55} ry={k * 0.6} fill="#8E8C88" stroke={ISO.ink} strokeWidth={sw} />
              <ellipse cx={sx - k * 0.45} cy={sy + k * 0.22} rx={k * 0.5} ry={k * 0.55} fill={ISO.silver} stroke={ISO.ink} strokeWidth={sw} />
              <ellipse cx={sx - k * 0.45} cy={sy + k * 0.22} rx={k * 0.3} ry={k * 0.34} fill="#57534D" stroke={ISO.ink} strokeWidth={sw * 0.7} />
            </g>
          );
        })}
      </g>
    );
  }
  if (kind === 'wall') {
    const rows = 7;
    const lines: React.ReactNode[] = [];
    for (let r = 1; r < rows; r++) {
      const zz = z + (hh * r) / rows;
      lines.push(<path key={`r${r}`} d={`M${P(x, y + d, zz).join(' ')} L${P(x + w, y + d, zz).join(' ')}`} stroke="#8F4436" strokeWidth={sw * 0.7} />);
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= 5; c++) {
        const a = x + ((c + (r % 2) * 0.5) * w) / 5.5;
        if (a <= x || a >= x + w) continue;
        const z0 = z + (hh * r) / rows;
        const z1 = z + (hh * (r + 1)) / rows;
        lines.push(<path key={`c${r}-${c}`} d={`M${P(a, y + d, z0).join(' ')} L${P(a, y + d, z1).join(' ')}`} stroke="#8F4436" strokeWidth={sw * 0.7} />);
      }
    }
    return (
      <g>
        {shadow}
        <IsoBox x={x} y={y} z={z} w={w} d={d} hgt={hh} k={k} color={ISO.brick} top="#D3C0A1" right="#844437" sw={sw} />
        {lines}
      </g>
    );
  }
  if (kind === 'motor') {
    const ang = sig.fan ?? 0;
    const spd = sig.fanSpeed ?? 0;
    const [fx, fy] = P(x + w * 0.5, y + d + 0.15, z + hh * 0.55);
    return (
      <g>
        {shadow}
        <IsoBox x={x} y={y} z={z} w={w} d={d} hgt={hh} k={k} color={ISO.silver} top="#DAD6CF" right="#A9A49B" sw={sw} />
        <IsoBox x={x + w * 0.35} y={y + d} z={z + hh * 0.4} w={w * 0.3} d={0.15} hgt={hh * 0.3} k={k} color="#C6A266" sw={sw * 0.8} />
        {spd > 0.6 ? (
          <ellipse cx={fx - k * 0.2} cy={fy + k * 0.1} rx={k * 1.2} ry={k * 1.25} fill="#E5A24C" opacity={0.35} stroke="#B9742E" strokeWidth={sw * 0.6} />
        ) : null}
        <g transform={`translate(${fx - k * 0.2} ${fy + k * 0.1}) scale(0.8 1)`} opacity={spd > 0.6 ? 0.35 : 1}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M0 0 C${k * 0.4} ${-k * 0.2} ${k * 1.2} ${-k * 0.3} ${k * 1.25} 0 C${k * 1.1} ${k * 0.25} ${k * 0.4} ${k * 0.2} 0 0Z`} fill="#E5A24C" stroke={ISO.ink} strokeWidth={sw * 0.8} transform={`rotate(${ang + i * 120})`} />
          ))}
          <circle r={k * 0.14} fill="#B9742E" stroke={ISO.ink} strokeWidth={sw * 0.8} />
        </g>
      </g>
    );
  }
  if (kind === 'servo') {
    const a = sig.servo ?? 90;
    const [hx, hy] = P(x + w * 0.5, y + d * 0.3, z + hh);
    return (
      <g>
        {shadow}
        <IsoBox x={x} y={y} z={z} w={w} d={d} hgt={hh} k={k} color={ISO.servo} top="#3E62D6" right="#213C96" sw={sw} />
        <ellipse cx={hx} cy={hy} rx={k * 0.45} ry={k * 0.23} fill="#F4F2EC" stroke={ISO.ink} strokeWidth={sw} />
        {/* horn rotates in the top plane: rotate then squash */}
        <g transform={`translate(${hx} ${hy - k * 0.12}) scale(1 0.5) rotate(${a - 90})`}>
          <path d={`M${-k * 0.25} 0 L${-k * 0.12} ${-k * 1.6} Q0 ${-k * 1.78} ${k * 0.12} ${-k * 1.6} L${k * 0.25} 0 Q0 ${k * 0.3} ${-k * 0.25} 0Z`} fill="#FFFFFF" stroke={ISO.ink} strokeWidth={sw * 1.6} />
          <circle r={k * 0.12} fill="#C8C4BA" stroke={ISO.ink} strokeWidth={sw} />
        </g>
      </g>
    );
  }
  if (kind === 'light') {
    const st = sig.light ?? 'green';
    const [px, py] = P(x + w / 2, y + d / 2, z);
    const housingH = k * 1.6;
    const top = py - k * hh;
    return (
      <g>
        {shadow}
        <rect x={px - k * 0.08} y={top + housingH * 0.6} width={k * 0.16} height={py - top - housingH * 0.6} fill="#2B2F3E" stroke={ISO.ink} strokeWidth={sw} />
        <rect x={px - k * 0.38} y={top} width={k * 0.76} height={housingH} rx={k * 0.12} fill="#22263A" stroke={ISO.ink} strokeWidth={sw} />
        {(['red', 'yellow', 'green'] as const).map((c, i) => {
          const on = c === st;
          const col = c === 'red' ? '#E0352C' : c === 'yellow' ? '#F2C230' : '#3FBF5A';
          const cy = top + housingH * (0.2 + i * 0.3);
          return (
            <g key={c}>
              {on ? <circle cx={px} cy={cy} r={k * 0.5} fill={col} opacity={0.3} /> : null}
              <circle cx={px} cy={cy} r={k * 0.2} fill={on ? col : shadeHex(col, -0.6)} stroke={ISO.ink} strokeWidth={sw * 0.7} />
            </g>
          );
        })}
      </g>
    );
  }
  if (kind === 'car') {
    const wheel = (a: number, b: number, key: string) => {
      const [sx, sy] = P(a, b, z + 0.25);
      return <ellipse key={key} cx={sx} cy={sy} rx={k * 0.26} ry={k * 0.3} fill="#232631" stroke={ISO.ink} strokeWidth={sw} />;
    };
    return (
      <g>
        {shadow}
        {wheel(x + 0.5, y, 'w1')}
        {wheel(x + w - 0.5, y, 'w2')}
        <IsoBox x={x} y={y} z={z + 0.2} w={w} d={d} hgt={hh * 0.5} k={k} color={ISO.car} top="#EE6A5E" right="#B52F28" sw={sw} />
        <IsoBox x={x + 0.5} y={y + 0.1} z={z + 0.2 + hh * 0.5} w={w * 0.5} d={d - 0.2} hgt={hh * 0.45} k={k} color={ISO.car} top="#EE6A5E" right="#B52F28" sw={sw} />
        {wheel(x + 0.5, y + d, 'w3')}
        {wheel(x + w - 0.5, y + d, 'w4')}
      </g>
    );
  }
  // ball
  const [bx, by] = P(x + w / 2, y + d / 2, z + hh / 2);
  const r = k * 0.85;
  return (
    <g>
      {shadow}
      <circle cx={bx} cy={by} r={r} fill="#F6F3EC" stroke={ISO.ink} strokeWidth={sw} />
      {['#E2423A', '#F2C230', '#3F64B5'].map((c, i) => (
        <path key={i} d={`M${bx} ${by - r} Q${bx + r * (0.9 - i * 0.7)} ${by} ${bx} ${by + r} Q${bx + r * (0.5 - i * 0.7)} ${by} ${bx} ${by - r}Z`} fill={c} stroke={ISO.ink} strokeWidth={sw * 0.6} transform={`rotate(${frame * 2 + i * 60} ${bx} ${by})`} />
      ))}
      <circle cx={bx} cy={by} r={r} fill="none" stroke={ISO.ink} strokeWidth={sw} />
    </g>
  );
};

/** screen point of a world pin */
export const pinPt = (p: [number, number, number], k: number) => isoPt(p[0], p[1], p[2], k);
