// Shared helpers for the MG2-2 batch (chrome-title-slam, tape-stutter, pixel-platformer-scene, palette-lut-grade,
// pixel-logo-drop, pixel-reward-burst, sdf-liquid-shade, drop-splash-crown, blob-to-wordmark, hanazi-caption,
// sticker-cutout-burst).
// Adapted from mg-styles-15 demos 10-synthwave, 20-pixel, 07-liquid, 18-hanazi (MIT) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {Freeze, Img, useCurrentFrame} from 'remotion';
import {clamp} from './ease';
import {hexRgb} from './r2-s1-kit';
import {pngDataUri} from './r2-mg2a-kit';

export type RGB = [number, number, number];
export const sm01 = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
export const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixRgbN = (a: RGB, b: RGB, t: number): RGB => [mixN(a[0], b[0], t), mixN(a[1], b[1], t), mixN(a[2], b[2], t)];
export const hash = (n: number) => {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

/** analytic damped-spring step response 0 -> 1 (t in seconds); zeta < 1 overshoots */
export const spring2 = (t: number, zeta = 0.517, omega = 22) => {
  if (t <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
};

/* ------------------------------------------------------------------ tape remap */
export type TapeSeg = {from: number; to: number; mode: 'normal' | 'step' | 'reverse' | 'half'};
/** remapped scene frame for output frame `f`: step = hold every n-th frame, reverse = blip back, half = half speed */
export const tapeFrame = (f: number, segs: TapeSeg[], stepEvery = 2) => {
  const s = segs.find((g) => f >= g.from && f < g.to);
  if (!s || s.mode === 'normal') return f;
  const st = Math.floor(f / stepEvery) * stepEvery;
  if (s.mode === 'step') return st;
  if (s.mode === 'reverse') return Math.max(0, 2 * s.from - 1 - f);
  return s.from + (st - s.from) * 0.5;
};
/** wrap any motion: its children see the remapped frame (they are pure functions of useCurrentFrame) */
export const TapeRemap: React.FC<{segments: TapeSeg[]; stepEvery?: number; children: React.ReactNode}> = ({segments, stepEvery = 2, children}) => {
  const frame = useCurrentFrame();
  return <Freeze frame={Math.max(0, Math.round(tapeFrame(frame, segments, stepEvery)))}>{children}</Freeze>;
};

/* ------------------------------------------------------------------ pixel engine */
export const pixDims = (w: number, h: number, short = 180): [number, number] => {
  const long = Math.round((short * Math.max(w, h)) / Math.min(w, h));
  return h > w ? [short, long] : [long, short];
};
export const bayer4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bay = (x: number, y: number) => bayer4[((y & 3) << 2) | (x & 3)];

const G57: Record<string, string> = {
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
  B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.####/#..../#..../#..../#..../#..../.####',
  D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####',
  F: '#####/#..../#..../####./#..../#..../#....',
  G: '.####/#..../#..../#.###/#...#/#...#/.####',
  H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '#####/..#../..#../..#../..#../..#../#####',
  J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
  N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
  R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '#####/....#/...#./..#../.#.../#..../#####',
  '0': '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
  '1': '..#../.##../..#../..#../..#../..#../.###.',
  '2': '.###./#...#/....#/...#./..#../.#.../#####',
  '3': '####./....#/....#/.###./....#/....#/####.',
  '4': '...#./..##./.#.#./#..#./#####/...#./...#.',
  '5': '#####/#..../####./....#/....#/#...#/.###.',
  '6': '.###./#..../#..../####./#...#/#...#/.###.',
  '7': '#####/....#/...#./..#../.#.../.#.../.#...',
  '8': '.###./#...#/#...#/.###./#...#/#...#/.###.',
  '9': '.###./#...#/#...#/.####/....#/....#/.###.',
  '!': '..#../..#../..#../..#../..#../...../..#..',
  '?': '.###./#...#/....#/...#./..#../...../..#..',
  '-': '...../...../...../#####/...../...../.....',
  ':': '...../..#../...../...../...../..#../.....',
  '.': '...../...../...../...../...../..##./..##.',
  ',': '...../...../...../...../..##./..#../.#...',
  '+': '...../..#../..#../#####/..#../..#../.....',
  '>': '#..../##.../###../####./###../##.../#....',
  '*': '..#../#.#.#/.###./#####/.###./#.#.#/..#..',
  ' ': '...../...../...../...../...../...../.....',
};
export const FONT_H = 7;
export const textCells = (s: string) => s.length * 6 - 1;
/** rows of a glyph as booleans (7 rows x 5 cols) */
export const glyph = (ch: string): boolean[][] => (G57[ch.toUpperCase()] ?? G57[' ']).split('/').map((r) => [...r].map((c) => c === '#'));

/** palette-index pixel buffer; 255 = transparent */
export class Pix {
  d: Uint8Array;
  constructor(public w: number, public h: number, fill = 255) {
    this.d = new Uint8Array(w * h).fill(fill);
  }
  clone() {
    const p = new Pix(this.w, this.h);
    p.d.set(this.d);
    return p;
  }
  get(x: number, y: number) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? 255 : this.d[y * this.w + x];
  }
  px(x: number, y: number, c: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.floor(x + w));
    const y1 = Math.min(this.h, Math.floor(y + h));
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.d[j * this.w + i] = c;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: number) {
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      const dy = (y + 0.5 - cy) / Math.max(0.01, ry);
      if (Math.abs(dy) > 1) continue;
      const half = rx * Math.sqrt(1 - dy * dy);
      for (let x = Math.ceil(cx - half - 0.5); x <= Math.floor(cx + half - 0.5); x++) this.px(x, y, c);
    }
  }
  disc(cx: number, cy: number, r: number, c: number) {
    this.ellipse(cx, cy, r, r, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) this.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
  }
  tri(cx: number, top: number, hw: number, h: number, c: number) {
    for (let j = 0; j < h; j++) {
      const half = (hw * (j + 1)) / h;
      this.rect(cx - half, top + j, half * 2, 1, c);
    }
  }
  blit(s: Pix, ox: number, oy: number) {
    for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
      const v = s.d[j * s.w + i];
      if (v !== 255) this.px(ox + i, oy + j, v);
    }
  }
  /** nearest-neighbour scaled blit */
  blitScaled(s: Pix, x: number, y: number, dw: number, dh: number) {
    const w = Math.max(1, Math.round(dw));
    const h = Math.max(1, Math.round(dh));
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const v = s.get(Math.floor((i / w) * s.w), Math.floor((j / h) * s.h));
      if (v !== 255) this.px(x + i, y + j, v);
    }
  }
  /** 1-px outline around the opaque pixels of a layer */
  outlined(c: number) {
    const o = this.clone();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.d[y * this.w + x] !== 255) continue;
      if (this.get(x - 1, y) !== 255 || this.get(x + 1, y) !== 255 || this.get(x, y - 1) !== 255 || this.get(x, y + 1) !== 255) o.d[y * this.w + x] = c;
    }
    return o;
  }
  text(s: string, x: number, y: number, c: number, scale = 1) {
    let cx = x;
    for (const ch of s) {
      const g = glyph(ch);
      for (let j = 0; j < FONT_H; j++) for (let i = 0; i < 5; i++) if (g[j][i]) this.rect(cx + i * scale, y + j * scale, scale, scale, c);
      cx += 6 * scale;
    }
  }
}

/** palette-index buffer -> RGBA; `fn` may override a pixel (return null to keep) */
export const pixRgba = (p: Pix, pal: RGB[], fn?: (x: number, y: number, c: number) => RGB | null) => {
  const out = new Uint8Array(p.w * p.h * 4);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const c = p.d[y * p.w + x];
    const i = (y * p.w + x) * 4;
    if (c === 255) continue;
    const o = fn ? fn(x, y, c) : null;
    const col = o ?? pal[c] ?? [255, 0, 255];
    out[i] = col[0];
    out[i + 1] = col[1];
    out[i + 2] = col[2];
    out[i + 3] = 255;
  }
  return out;
};
/** shows an RGBA pixel buffer crisp, filling the frame (nearest-neighbour upscale) */
export const PixelImg: React.FC<{w: number; h: number; rgba: Uint8Array; width: number; height: number}> = ({w, h, rgba, width, height}) => (
  <Img src={pngDataUri(w, h, rgba)} style={{position: 'absolute', left: 0, top: 0, width, height, imageRendering: 'pixelated', display: 'block'}} />
);

/* ------------------------------------------------------------------ pixel palette slots + day-to-night stages */
export const SL = {
  ink: 0, sky0: 1, sky1: 2, sky2: 3, sky3: 4, sky4: 5, sun: 6, cloud: 7, cloudSh: 8, mtn: 9, mtnHi: 10, forest: 11, forestHi: 12,
  grass: 13, grassHi: 14, dirt: 15, dirtDk: 16, wA: 17, wB: 18, wC: 19, wD: 20, wood: 21, suit: 22, suitDk: 23, skin: 24, hair: 25,
  coin: 26, coinDk: 27, slime: 28, slimeDk: 29, white: 30, star: 31, glow: 32, cabin: 33, cabinDk: 34, trunk: 35, hud: 36, roof: 37,
} as const;
export const SLOT_COUNT = 38;
export const SLOT_NAMES = Object.keys(SL);
export const DAY_PALETTE = [
  '#1b1530', '#4aa3f0', '#6bb8f5', '#8ccbf8', '#b0dcfa', '#d6ecfa', '#fff3a8', '#ffffff', '#cfe3f5', '#7f9fcf', '#a9c0e4', '#3b8a5a', '#58a96b',
  '#5fcf55', '#92ec6d', '#a8683b', '#7c4527', '#2f7fd8', '#4aa0ec', '#8bd0ff', '#4aa0ec', '#c98a4b', '#e8453c', '#a82a2a', '#ffd0a0', '#4a2a1c',
  '#ffd23a', '#c8901a', '#7a5ae0', '#4c3aa6', '#ffffff', '#fff6c0', '#e8c98a', '#b5703d', '#7d4425', '#6e4326', '#fff3c4', '#a8443a',
];
export const STAGES = ['day', 'afternoon', 'golden', 'sunset', 'dusk', 'night'];
const STAGE_SKY = [
  ['#4aa3f0', '#6bb8f5', '#8ccbf8', '#b0dcfa', '#d6ecfa'],
  ['#4b9cea', '#6fb2ef', '#97c6ee', '#c2d8ea', '#e8e2cc'],
  ['#5c8fd0', '#8aa7d0', '#d9b38c', '#f2b36b', '#ffd27a'],
  ['#3d3a8c', '#7a4a9a', '#c4507a', '#f07a55', '#ffb04a'],
  ['#1a1f5c', '#2d2a78', '#4e3a8c', '#7a4a8f', '#b85c86'],
  ['#080b24', '#0d1236', '#121a48', '#18225a', '#1f2c6a'],
];
const STAGE_TINT = ['#ffffff', '#fff1de', '#ffd9a8', '#f5a890', '#8f88c4', '#4f5da0'];
const STAGE_K = [0, 0.4, 0.6, 0.75, 0.9, 1];
const STAGE_SUN = ['#fff3a8', '#fff0a0', '#ffd860', '#ff9a4a', '#ffd0a0', '#e8eeff'];
const STAGE_GLOW = ['#e8c98a', '#e8c98a', '#ffd98a', '#ffd070', '#ffd878', '#ffe9a0'];
const EMISSIVE = new Set<number>([SL.ink, SL.sky0, SL.sky1, SL.sky2, SL.sky3, SL.sky4, SL.sun, SL.star, SL.glow, SL.white, SL.hud]);
const rgbOf = (h: string) => hexRgb(h) as RGB;
const stagePalInt = (i: number, base: string[]): RGB[] => {
  const tint = rgbOf(STAGE_TINT[i]);
  const k = STAGE_K[i];
  return base.map((hx, s) => {
    const b = rgbOf(hx);
    if (s >= SL.sky0 && s <= SL.sky4) return rgbOf(STAGE_SKY[i][s - SL.sky0]);
    if (s === SL.sun) return rgbOf(STAGE_SUN[i]);
    if (s === SL.glow) return rgbOf(STAGE_GLOW[i]);
    if (s === SL.star) return i >= 4 ? rgbOf(i === 4 ? '#c8c8f0' : '#fff6c0') : rgbOf(STAGE_SKY[i][0]);
    if (EMISSIVE.has(s)) return b;
    return [b[0] * mixN(1, tint[0] / 255, k), b[1] * mixN(1, tint[1] / 255, k), b[2] * mixN(1, tint[2] / 255, k)] as RGB;
  });
};
/** palette for a (fractional) stage index 0..5 built from the slot table (water colour-cycle applied by caller) */
export const stagePalette = (stage: number, base: string[] = DAY_PALETTE): RGB[] => {
  const a = Math.floor(clamp(stage, 0, 5));
  const b = Math.min(5, a + 1);
  const t = clamp(stage, 0, 5) - a;
  const pa = stagePalInt(a, base);
  if (t < 1e-4) return pa;
  const pb = stagePalInt(b, base);
  return pa.map((c, i) => mixRgbN(c, pb[i], t));
};
/** rotate the four water slots (palette colour-cycling) */
export const cycleWater = (pal: RGB[], step: number) => {
  const w = [pal[SL.wA], pal[SL.wB], pal[SL.wC], pal[SL.wD]];
  const o = pal.slice();
  for (let k = 0; k < 4; k++) o[SL.wA + k] = w[(k + step) & 3];
  return o;
};
/** warm re-lit version of a material (day colour pushed warm) used by local light pools */
export const litOf = (day: RGB): RGB => [Math.min(255, day[0] * 1.08), day[1] * 0.94, day[2] * 0.8];

/** stage float from the frames at which stages 1..n start (each change in two 1/3 steps two frames apart) */
export const stageAtFrame = (frame: number, at: number[]) => {
  let s = 0;
  for (let i = 0; i < at.length; i++) {
    const d = frame - at[i];
    if (d < 0) break;
    s = d >= 4 ? i + 1 : d >= 2 ? i + 2 / 3 : i + 1 / 3;
  }
  return s;
};

/* ------------------------------------------------------------------ pixel landscape painter */
export type LandOpts = {frame: number; seed: number; horizon: number; scroll: number; stars: boolean; sunX: number; sunY: number; sunR: number};
export const paintSky = (p: Pix, o: LandOpts) => {
  for (let y = 0; y < o.horizon; y++) for (let x = 0; x < p.w; x++) {
    const f = (y / o.horizon) * 4.999;
    const k = Math.floor(f);
    const fr = clamp((f - k - 0.5) * 3 + 0.5);
    p.d[y * p.w + x] = SL.sky0 + (fr > bay(x, y) ? k + 1 : k);
  }
  if (o.stars) {
    for (let i = 0; i < 46; i++) {
      const sx = Math.floor(hash(o.seed * 31 + i) * p.w);
      const sy = Math.floor(hash(o.seed * 17 + i + 99) * o.horizon * 0.55);
      const tw = (Math.floor(o.frame / 4) + i) % 4;
      if (p.get(sx, sy) <= SL.sky2) p.px(sx, sy, tw === 0 ? SL.sky2 : SL.star);
      if (i % 9 === 0 && tw !== 0) {
        p.px(sx - 1, sy, SL.star);
        p.px(sx + 1, sy, SL.star);
        p.px(sx, sy - 1, SL.star);
        p.px(sx, sy + 1, SL.star);
      }
    }
  }
  // sun / moon with dithered halo
  for (let y = -o.sunR - 12; y <= o.sunR + 12; y++) for (let x = -o.sunR - 12; x <= o.sunR + 12; x++) {
    const d = Math.hypot(x, y);
    const X = Math.round(o.sunX + x);
    const Y = Math.round(o.sunY + y);
    if (d <= o.sunR) p.px(X, Y, SL.sun);
    else if (d < o.sunR + 11 && (1 - (d - o.sunR) / 11) * 0.55 > bay(X, Y) && p.get(X, Y) !== 255 && p.get(X, Y) <= SL.sky4) p.px(X, Y, SL.cloud);
  }
};
export const paintCloud = (p: Pix, cx: number, cy: number, s: number) => {
  const parts: [number, number, number][] = [[0, 0, 5], [-6, 2, 4], [7, 2, 4.5], [14, 3, 3], [-12, 3, 3]];
  for (const [dx, dy, r] of parts) p.ellipse(cx + dx * s, cy + (dy + 1.2) * s, r * s, r * s * 0.8, SL.cloudSh);
  for (const [dx, dy, r] of parts) p.ellipse(cx + dx * s, cy + dy * s, r * s, r * s * 0.8, SL.cloud);
};
export const paintClouds = (p: Pix, o: LandOpts, count = 4) => {
  for (let i = 0; i < count; i++) {
    const span = p.w + 70;
    const x0 = hash(o.seed + i * 7) * span;
    const x = ((((x0 - o.scroll * 0.06 - o.frame / 4) % span) + span) % span) - 35;
    paintCloud(p, x, o.horizon * (0.18 + 0.5 * hash(o.seed + i * 13)), 0.8 + hash(o.seed + i * 5) * 0.5);
  }
};
export const paintMountains = (p: Pix, o: LandOpts, factor = 0.125, hMul = 1) => {
  const sx = o.scroll * factor;
  const hh = (wx: number) => (Math.abs(Math.sin(wx * 0.013 + o.seed)) * 26 + Math.abs(Math.sin(wx * 0.031 + 1)) * 8 + 8) * hMul;
  for (let x = 0; x < p.w; x++) {
    const H = hh(x + sx);
    const H2 = hh(x + sx + 2);
    const top = Math.round(o.horizon - H);
    for (let y = top; y < o.horizon; y++) p.px(x, y, y - top < 2 + (H2 > H ? 3 : 0) ? SL.mtnHi : SL.mtn);
  }
};
export const paintHills = (p: Pix, o: LandOpts, factor = 0.3, trees = true) => {
  const sx = o.scroll * factor;
  for (let x = 0; x < p.w; x++) {
    const wx = x + sx;
    const top = Math.round(o.horizon - 5 - 9 * (0.5 + 0.5 * Math.sin(wx * 0.021 + o.seed * 2)) - 4 * Math.sin(wx * 0.06));
    for (let y = top; y < o.horizon + 2; y++) p.px(x, y, y - top < 1 ? SL.forestHi : SL.forest);
  }
  if (!trees) return;
  const stepW = 15;
  const i0 = Math.floor(sx / stepW) - 1;
  for (let i = i0; i < i0 + Math.ceil(p.w / stepW) + 3; i++) {
    if (hash(i * 3 + o.seed) < 0.35) continue;
    const wx = i * stepW + hash(i + 500) * 8;
    const x = Math.round(wx - sx);
    const base = Math.round(o.horizon - 3 - 6 * (0.5 + 0.5 * Math.sin(wx * 0.021 + o.seed * 2)));
    const hgt = 11 + Math.floor(hash(i + 71) * 6);
    p.rect(x, base - 1, 1, 2, SL.trunk);
    for (let t = 0; t < 3; t++) p.tri(x, base - hgt + t * 4, 2 + t * 1.5, 6, t % 2 ? SL.forestHi : SL.forest);
  }
};

/* ------------------------------------------------------------------ liquid shading (SVG goo + lighting) */
/**
 * Draws its children (plain coloured blobs) as thick glossy jelly: goo merge, dome height field -> diffuse + specular
 * lighting, saturated rim, softbox sheen. Children must be un-filtered shapes in pixel coordinates.
 */
export const LiquidShade: React.FC<{
  id: string;
  w: number;
  h: number;
  u: number;
  blur?: number;
  gloss?: number;
  rim?: number;
  light?: number;
  children: React.ReactNode;
}> = ({id, w, h, u, blur = 14, gloss = 1, rim = 0.5, light = 225, children}) => {
  const s = blur * u;
  const hs = 30 * u;
  return (
    <>
      <defs>
        <filter id={id} x={0} y={0} width={w} height={h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={s} result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10.5" result="goo" />
          <feGaussianBlur in="goo" stdDeviation={hs} result="hf" />
          <feDiffuseLighting in="hf" surfaceScale={90 * u} diffuseConstant={1.15} lightingColor="#ffffff" result="dif">
            <feDistantLight azimuth={light} elevation={52} />
          </feDiffuseLighting>
          <feComposite in="goo" in2="dif" operator="arithmetic" k1={1.45} k2={0.08} k3={0} k4={0} result="sh0" />
          <feComposite in="sh0" in2="goo" operator="in" result="shaded" />
          <feSpecularLighting in="hf" surfaceScale={90 * u} specularConstant={1.0 * gloss} specularExponent={34} lightingColor="#ffffff" result="spec0">
            <feDistantLight azimuth={light} elevation={46} />
          </feSpecularLighting>
          <feComposite in="spec0" in2="goo" operator="in" result="spec" />
          <feSpecularLighting in="hf" surfaceScale={90 * u} specularConstant={0.5 * gloss} specularExponent={7} lightingColor="#dfe8ff" result="sheen0">
            <feDistantLight azimuth={light + 180} elevation={34} />
          </feSpecularLighting>
          <feComposite in="sheen0" in2="goo" operator="in" result="sheen" />
          <feMorphology in="goo" operator="erode" radius={Math.max(1, 6 * u)} result="er" />
          <feGaussianBlur in="er" stdDeviation={7 * u} result="erb" />
          <feComposite in="goo" in2="erb" operator="out" result="rimM" />
          <feColorMatrix in="rimM" type="matrix" values={`1.5 0 0 0 0.05  0 1.5 0 0 0.05  0 0 1.5 0 0.05  0 0 0 ${rim * 1.4} 0`} result="rimC" />
          <feMerge>
            <feMergeNode in="shaded" />
            <feMergeNode in="rimC" />
            <feMergeNode in="sheen" />
            <feMergeNode in="spec" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </>
  );
};
/** tapered capsule as a chain of circles (merged by the goo filter) */
export const taper = (x0: number, y0: number, x1: number, y1: number, r0: number, r1: number, n = 9) =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    return {x: mixN(x0, x1, t), y: mixN(y0, y1, t), r: mixN(r0, r1, t)};
  });

/* ------------------------------------------------------------------ text measure (CJK-safe) */
let _cv: CanvasRenderingContext2D | null | undefined;
export const textWidth = (s: string, fs: number, family: string, weight = 400) => {
  if (_cv === undefined) {
    try {
      _cv = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    } catch {
      _cv = null;
    }
  }
  if (_cv) {
    _cv.font = `${weight} ${fs}px ${family}`;
    const m = _cv.measureText(s).width;
    if (m > 0) return m;
  }
  return [...s].reduce((a, ch) => a + fs * (/[⺀-鿿＀-￯]/.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.62), 0);
};
