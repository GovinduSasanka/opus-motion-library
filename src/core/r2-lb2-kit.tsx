/**
 * r2-lb2-kit — shared helpers for the LB2 group (after LemoLab lemo-opuscar styles: satellite-briefing, scifi-toon,
 * shadow-puppet, silent-film, silkscreen-poster, spy-titles, stained-glass, swiss-motion, teardown, telestrator).
 *
 * Ideas and constants adapted from lemo-opuscar/styles/{shadow-puppet/demo/carve.js, silent-film/demo/engine/film.js,
 * silkscreen-poster/demo/engine/silk.js, spy-titles/demo/chars.js} (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md.
 * Everything here is a pure function of the frame and seeds: no Math.random, no timers.
 */
import React from 'react';
import {loadFont as bungee} from '@remotion/google-fonts/Bungee';
import {loadFont as baloo} from '@remotion/google-fonts/Baloo2';
import {loadFont as playfairSC} from '@remotion/google-fonts/PlayfairDisplaySC';
import {loadFont as oldStandard} from '@remotion/google-fonts/OldStandardTT';
import {loadFont as bigShoulders} from '@remotion/google-fonts/BigShoulders';
import {loadFont as leagueGothic} from '@remotion/google-fonts/LeagueGothic';
import {loadFont as outfit} from '@remotion/google-fonts/Outfit';
import {loadFont as archivo} from '@remotion/google-fonts/Archivo';
import {loadFont as barlowCond} from '@remotion/google-fonts/BarlowCondensed';
import {loadFont as plexMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as cormorantG} from '@remotion/google-fonts/CormorantGaramond';
import {loadFont as maShan} from '@remotion/google-fonts/MaShanZheng';
import {rng} from './random';

// =============================================================================================== fonts (lazy)
const FONT_LOADERS = {
  /** Bungee — atomic-age toon titles */
  bungee: () => bungee('normal', {weights: ['400'], subsets: ['latin']}),
  /** Baloo 2 ExtraBold — toon subtitles */
  baloo: () => baloo('normal', {weights: ['700', '800'], subsets: ['latin']}),
  /** Playfair Display SC — silent-film titles / shouts */
  playfair: () => playfairSC('normal', {weights: ['400', '700'], subsets: ['latin']}),
  /** Old Standard TT italic — silent-film narration */
  oldItalic: () => oldStandard('italic', {weights: ['400'], subsets: ['latin']}),
  /** Big Shoulders — screen-print names and values */
  shoulders: () => bigShoulders('normal', {weights: ['800', '900'], subsets: ['latin']}),
  /** League Gothic — spy-title cut-paper letters */
  gothic: () => leagueGothic('normal', {weights: ['400'], subsets: ['latin']}),
  /** Outfit — tracked labels */
  outfit: () => outfit('normal', {weights: ['500', '600', '700'], subsets: ['latin']}),
  /** Archivo — Swiss grid labels and type */
  archivo: () => archivo('normal', {weights: ['500', '700', '800'], subsets: ['latin']}),
  /** Barlow Condensed — analyst readings */
  barlow: () => barlowCond('normal', {weights: ['300', '500', '600'], subsets: ['latin']}),
  /** IBM Plex Mono — instruments, dates, readouts */
  plex: () => plexMono('normal', {weights: ['400', '500', '600'], subsets: ['latin']}),
  /** Cormorant Garamond — shadow-theatre plaques */
  cormorant: () => cormorantG('normal', {weights: ['500', '600', '700'], subsets: ['latin']}),
  /** Ma Shan Zheng — a single carved seal glyph */
  mashan: () => maShan('normal', {weights: ['400'], subsets: ['chinese-simplified'] as never}),
};
export type Lb2Font = keyof typeof FONT_LOADERS;
const fontCache: Partial<Record<Lb2Font, string>> = {};
/** font-family for a role (loads the face on first use) */
export const lf = (role: Lb2Font): string => {
  if (fontCache[role]) return fontCache[role]!;
  let fam = 'serif';
  try {
    fam = FONT_LOADERS[role]().fontFamily;
  } catch {
    fam = role === 'mashan' ? 'serif' : 'sans-serif';
  }
  fontCache[role] = fam;
  return fam;
};

// =============================================================================================== maths
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** seg(t,a,b) = clamp((t-a)/(b-a)) */
export const seg = (t: number, a: number, b: number) => (b <= a ? (t >= a ? 1 : 0) : clamp01((t - a) / (b - a)));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sstep = (a: number, b: number, v: number) => {
  const t = seg(v, a, b);
  return t * t * (3 - 2 * t);
};
/** back-ease-out with overshoot s */
export const back = (x: number, s = 1.7) => {
  const t = clamp01(x) - 1;
  return t * t * ((s + 1) * t + s) + 1;
};
export const eo3 = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const ei3 = (t: number) => Math.pow(clamp01(t), 3);
export const eio3 = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** cubic-bezier(.7,0,.2,1)-ish precise ease (Swiss snaps) */
export const precise = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2;
};
/** hash 0..1 */
export const h1 = (n: number, s = 0) => {
  const v = Math.sin(n * 127.1 + s * 311.7 + 0.123) * 43758.5453;
  return v - Math.floor(v);
};
/** 1D value noise 0..1 */
export const vn = (x: number, s = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(h1(i, s), h1(i + 1, s), u);
};
export const fx = (n: number, d = 1) => n.toFixed(d);

// =============================================================================================== colour
export const hexRgb = (s: string): [number, number, number] => {
  const m = s.replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m.slice(0, 6);
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp01(t))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
export const lum = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
export const contrast = (a: string, b: string) => {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
/** the candidate with the best WCAG contrast against `bg` */
export const bestInk = (bg: string, candidates: string[]) => candidates.reduce((best, c) => (contrast(c, bg) > contrast(best, bg) ? c : best), candidates[0]);

// =============================================================================================== geometry
export type Pt = [number, number];
export const pts = (p: Pt[]) => p.map(([x, y]) => `${fx(x)},${fx(y)}`).join(' ');
/** closed Catmull-Rom spline path */
export const catmullClosed = (p: Pt[]) => {
  const n = p.length;
  let d = `M${fx(p[0][0])},${fx(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fx(c1[0])},${fx(c1[1])} ${fx(c2[0])},${fx(c2[1])} ${fx(p2[0])},${fx(p2[1])}`;
  }
  return d + 'Z';
};
export const catmullOpen = (p: Pt[]) => {
  const n = p.length;
  if (n < 2) return '';
  let d = `M${fx(p[0][0])},${fx(p[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(n - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fx(c1[0])},${fx(c1[1])} ${fx(c2[0])},${fx(c2[1])} ${fx(p2[0])},${fx(p2[1])}`;
  }
  return d;
};
export const polyLen = (p: Pt[]) => {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
};
/** point at fraction t along a polyline + its angle */
export const alongPoly = (p: Pt[], t: number): {x: number; y: number; a: number} => {
  const L = polyLen(p);
  let d = clamp01(t) * L;
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (d <= l || i === p.length - 1) {
      const k = l > 0 ? Math.min(1, d / l) : 0;
      return {x: lerp(p[i - 1][0], p[i][0], k), y: lerp(p[i - 1][1], p[i][1], k), a: Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0])};
    }
    d -= l;
  }
  return {x: p[0][0], y: p[0][1], a: 0};
};
/** sample a closed blob (lumpy circle) as points */
export const blobPts = (cx: number, cy: number, rx: number, ry: number, n: number, seed: number, amp = 0.12, t = 0): Pt[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + amp * (2 * vn(i * 0.9 + t, seed) - 1) + amp * 0.5 * Math.sin(3 * a + seed);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as Pt;
  });

/** stable per-instance SVG id */
export const useUid = (prefix: string) => prefix + React.useId().replace(/[^a-zA-Z0-9]/g, '');

// =============================================================================================== text measuring
let mctx: CanvasRenderingContext2D | null = null;
/** width of `text` in px for a CSS font string (measured every call — fonts may load late) */
export const measure = (text: string, family: string, size: number, weight: number | string = 400, italic = false) => {
  try {
    if (!mctx && typeof document !== 'undefined') mctx = document.createElement('canvas').getContext('2d');
    if (mctx) {
      mctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
      return mctx.measureText(text).width;
    }
  } catch {
    // fall through
  }
  return text.length * size * 0.55;
};

// =============================================================================================== ragged squeegee front
/**
 * Ragged pull region (after silkscreen-poster silk.js wipeRegion): everything *behind* the blade.
 * box in px, p 0..1 linear progress, angle in degrees (0 = pull downward), tail = ragged depth, step = sample spacing.
 */
export const raggedPull = (box: {x: number; y: number; w: number; h: number}, p: number, angle = 0, tail = 28, step = 5, seed = 1) => {
  const th = (angle * Math.PI) / 180;
  const n: Pt = [-Math.sin(th), Math.cos(th)];
  const b: Pt = [Math.cos(th), Math.sin(th)];
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const corners: Pt[] = [
    [box.x, box.y],
    [box.x + box.w, box.y],
    [box.x + box.w, box.y + box.h],
    [box.x, box.y + box.h],
  ];
  const ts = corners.map(([x, y]) => (x - cx) * n[0] + (y - cy) * n[1]);
  const ss = corners.map(([x, y]) => (x - cx) * b[0] + (y - cy) * b[1]);
  const tmin = Math.min(...ts);
  const tmax = Math.max(...ts);
  const smin = Math.min(...ss) - step;
  const smax = Math.max(...ss) + step;
  const front = tmin - tail + clamp01(p) * (tmax - tmin + 2 * tail);
  const P = (s: number, t: number): Pt => [cx + s * b[0] + t * n[0], cy + s * b[1] + t * n[1]];
  const out: Pt[] = [P(smin, tmin - tail * 2), P(smax, tmin - tail * 2)];
  const N = Math.ceil((smax - smin) / step);
  for (let i = N; i >= 0; i--) {
    const s = smin + (i / N) * (smax - smin);
    const off = tail * (0.65 * h1(i, seed) + 0.35 * h1(Math.floor(i / 3), seed + 7));
    out.push(P(s, Math.max(tmin - tail * 2, front - off)));
  }
  return {poly: pts(out), front, frontPt: (s: number) => P(s, front), n, b, cx, cy, smin, smax};
};

// =============================================================================================== screen-print poster
export type PosterPalette = {sky1: string; sky2: string; far: string; mid: string; near: string; sun: string; glow?: string};
export const POSTER_PALETTES: Record<string, PosterPalette> = {
  dawn: {sky1: '#F6CD98', sky2: '#EE9A73', far: '#9A7FA8', mid: '#3E7079', near: '#1E3B3F', sun: '#FBE6B4'},
  noon: {sky1: '#E4EEDC', sky2: '#86BCD0', far: '#C2AE92', mid: '#4C8753', near: '#1D4331', sun: '#F2C14A'},
  golden: {sky1: '#F7D787', sky2: '#E9A94F', far: '#A57C68', mid: '#5E7A45', near: '#2B3A28', sun: '#FFF1C4'},
  dusk: {sky1: '#F4B461', sky2: '#D8613F', far: '#7C3E5F', mid: '#43325A', near: '#1B1B2F', sun: '#FBE3A6'},
  harbour: {sky1: '#E8F0F2', sky2: '#7FB3C8', far: '#D9C7A3', mid: '#2F6E8E', near: '#173247', sun: '#E8553D'},
  winter: {sky1: '#EEF1F4', sky2: '#B8C9D9', far: '#8B9BB0', mid: '#4A5D78', near: '#1F2A3C', sun: '#F2B134'},
};
export const resolvePalette = (p: string | PosterPalette | undefined, fallback = 'dusk'): PosterPalette =>
  typeof p === 'string' ? POSTER_PALETTES[p] ?? POSTER_PALETTES[fallback] : p ?? POSTER_PALETTES[fallback];

export const POSTER_W = 1000;
export const POSTER_H = 1500;
export const ART = {x: 26, y: 26, w: 948, h: 1114};
export const BAND = {x: 26, y: 1148, w: 948, h: 326};

export type PosterGeo = {
  bands: {y: number; h: number}[];
  sun: {x: number; y: number; r: number};
  far: string;
  farFacet: string;
  mid: string;
  near: string;
  glints: {x: number; y: number; w: number}[];
};

/** midpoint-displacement ridge across x0..x1 */
const ridge = (x0: number, x1: number, yL: number, yR: number, rough: number, depth: number, r: () => number): Pt[] => {
  let p: Pt[] = [
    [x0, yL],
    [x1, yR],
  ];
  let amp = rough;
  for (let d = 0; d < depth; d++) {
    const next: Pt[] = [];
    for (let i = 0; i < p.length - 1; i++) {
      next.push(p[i]);
      next.push([(p[i][0] + p[i + 1][0]) / 2 + (r() - 0.5) * amp * 0.3, (p[i][1] + p[i + 1][1]) / 2 + (r() - 0.5) * amp]);
    }
    next.push(p[p.length - 1]);
    p = next;
    amp *= 0.55;
  }
  return p;
};

const pine = (x: number, base: number, hgt: number, wid: number) => {
  const tiers = 5;
  let d = `M${fx(x)},${fx(base - hgt)}`;
  const right: Pt[] = [];
  for (let k = 0; k < tiers; k++) {
    const ty = base - hgt + ((k + 1) / tiers) * hgt * 0.92;
    const tw = wid * (0.3 + 0.7 * ((k + 1) / tiers));
    right.push([x + tw * 0.55, ty - hgt * 0.06], [x + tw, ty + hgt * 0.02], [x + tw * 0.32, ty - hgt * 0.035]);
  }
  right.forEach(([px, py]) => (d += `L${fx(px)},${fx(py)}`));
  d += `L${fx(x + wid * 0.08)},${fx(base)}L${fx(x - wid * 0.08)},${fx(base)}`;
  [...right].reverse().forEach(([px, py]) => (d += `L${fx(2 * x - px)},${fx(py)}`));
  return d + 'Z';
};

/** deterministic poster scene (lake under mountains with pines) in poster units */
export const buildPoster = (seed = 3): PosterGeo => {
  const r = rng(seed * 97 + 11);
  const bands: {y: number; h: number}[] = [];
  // stepped bands from sky1 into sky2: stripes thin out toward the next colour (bandify)
  const n = 7;
  const top = 380;
  const cell = 46;
  for (let i = 0; i < n; i++) {
    const th = cell * (1 - (i + 0.5) / n) * 0.95 + 1.2;
    bands.push({y: top + i * cell + (cell - th), h: th});
  }
  const sun = {x: 640 + (r() - 0.5) * 120, y: 560, r: 92};
  const farPts = ridge(ART.x - 10, ART.x + ART.w + 10, 700 + (r() - 0.5) * 60, 690 + (r() - 0.5) * 60, 330, 6, r);
  const farPeak = farPts.reduce((m, p) => (p[1] < m[1] ? p : m), farPts[0]);
  const far = `M${pts(farPts).split(' ').join(' L')} L${ART.x + ART.w + 10},${ART.y + ART.h} L${ART.x - 10},${ART.y + ART.h} Z`;
  // lit facet: from the peak down the sun side in a jagged line
  const fp: Pt[] = [farPeak];
  let fxp = farPeak[0];
  let fyp = farPeak[1];
  for (let k = 0; k < 6; k++) {
    fxp += 18 + r() * 26;
    fyp += 22 + r() * 14;
    fp.push([fxp - (k % 2 ? 20 : 0), fyp]);
  }
  const ridgeRight = farPts.filter((p) => p[0] > farPeak[0] && p[0] < fxp + 40);
  const farFacet = `M${pts([...fp, ...ridgeRight.reverse()]).split(' ').join(' L')} Z`;
  const midPts: Pt[] = Array.from({length: 26}, (_, i) => {
    const x = ART.x - 10 + (i / 25) * (ART.w + 20);
    return [x, 860 + Math.sin(i * 0.55 + seed) * 34 + Math.sin(i * 1.3 + seed * 2) * 14] as Pt;
  });
  const mid = `${catmullOpen(midPts)} L${ART.x + ART.w + 10},${ART.y + ART.h} L${ART.x - 10},${ART.y + ART.h} Z`;
  // near: shore + pines (two clusters, left and right), lake between (paper-white glints)
  let near = `M${ART.x - 10},1040 C 200,1010 330,1060 470,1050 S 760,1030 ${ART.x + ART.w + 10},1056 L${ART.x + ART.w + 10},${ART.y + ART.h + 4} L${ART.x - 10},${ART.y + ART.h + 4} Z`;
  const pinesX = [60, 112, 170, 232, 300, 720, 790, 846, 910, 960];
  pinesX.forEach((x, i) => {
    const hgt = 240 + h1(i, seed) * 210 - (i === 2 || i === 7 ? -60 : 0);
    near += pine(x + (h1(i + 9, seed) - 0.5) * 20, 1060, hgt, 70 + h1(i + 3, seed) * 30);
  });
  const glints = Array.from({length: 9}, (_, i) => ({x: 360 + h1(i, seed + 4) * 300, y: 925 + i * 13, w: 30 + h1(i + 30, seed) * 110}));
  return {bands, sun, far, farFacet, mid, near, glints};
};

/** poster layers in print order: 0 sky1, 1 sky2 bands, 2 sun, 3 far, 4 mid, 5 near, 6 info band */
export const POSTER_LAYERS = 7;
export const PosterLayer: React.FC<{k: number; geo: PosterGeo; pal: PosterPalette; paper: string}> = ({k, geo, pal, paper}) => {
  const glow = pal.glow ?? mixHex(pal.sun, pal.sky1, 0.55);
  switch (k) {
    case 0:
      return <rect x={ART.x} y={ART.y} width={ART.w} height={ART.h} fill={pal.sky1} />;
    case 1:
      return (
        <g fill={pal.sky2}>
          {geo.bands.map((b, i) => (
            <rect key={i} x={ART.x} y={b.y} width={ART.w} height={b.h} />
          ))}
          <rect x={ART.x} y={geo.bands[geo.bands.length - 1].y + geo.bands[geo.bands.length - 1].h} width={ART.w} height={ART.y + ART.h - 700} />
        </g>
      );
    case 2:
      return (
        <g>
          <circle cx={geo.sun.x} cy={geo.sun.y} r={geo.sun.r * 1.75} fill="none" stroke={glow} strokeWidth={geo.sun.r * 0.32} />
          <circle cx={geo.sun.x} cy={geo.sun.y} r={geo.sun.r * 1.3} fill="none" stroke={glow} strokeWidth={geo.sun.r * 0.14} />
          <circle cx={geo.sun.x} cy={geo.sun.y} r={geo.sun.r} fill={pal.sun} />
        </g>
      );
    case 3:
      return (
        <g>
          <path d={geo.far} fill={pal.far} />
          <path d={geo.farFacet} fill={mixHex(pal.far, pal.sun, 0.35)} />
        </g>
      );
    case 4:
      return (
        <g>
          <path d={geo.mid} fill={pal.mid} />
          {geo.glints.map((g, i) => (
            <rect key={i} x={g.x} y={g.y} width={g.w} height={4} fill={paper} />
          ))}
        </g>
      );
    case 5:
      return <path d={geo.near} fill={pal.near} />;
    default:
      return <rect x={BAND.x} y={BAND.y} width={BAND.w} height={BAND.h} fill={pal.near} />;
  }
};

export type PosterInfo = {header: string; name: string; number: string; stats: {label: string; value: string}[]};
/** info items in print order: header, name, number, rule, stats… — each with a 0..1 print progress */
export const posterInfoCount = (info: PosterInfo) => 4 + info.stats.length;
export const PosterInfoInk: React.FC<{info: PosterInfo; pal: PosterPalette; paper: string; prog: number[]}> = ({info, pal, paper, prog}) => {
  const P = (i: number) => clamp01(prog[i] ?? 1);
  const fShoulders = lf('shoulders');
  const fOutfit = lf('outfit');
  const nameInk = bestInk(pal.near, [paper, pal.sun, pal.sky1]);
  const labelInk = bestInk(pal.near, [pal.sky2, pal.sky1, paper]);
  const headerInk = bestInk(pal.sky1, [pal.near, pal.mid, pal.far]);
  const nameSize = Math.max(60, Math.min(122, (700 / Math.max(1, measure(info.name.toUpperCase(), fShoulders, 100, 900))) * 100));
  // print = a fast left-to-right wipe (no fades)
  const wipe = (i: number, x: number, y: number, w: number, hh: number, child: React.ReactNode, key: string) => {
    const p = P(i);
    if (p <= 0) return null;
    return (
      <g key={key}>
        <clipPath id={key}>
          <rect x={x} y={y} width={w * p} height={hh} />
        </clipPath>
        <g clipPath={`url(#${key})`}>{child}</g>
      </g>
    );
  };
  const uid = useUid('pinfo');
  const statW = (BAND.w - 100) / Math.max(1, info.stats.length);
  return (
    <g>
      {wipe(
        0,
        ART.x,
        60,
        ART.w,
        90,
        <text x={POSTER_W / 2} y={118} textAnchor="middle" fontFamily={fOutfit} fontWeight={600} fontSize={40} letterSpacing={16} fill={headerInk}>
          {info.header.toUpperCase()}
        </text>,
        uid + 'h',
      )}
      {wipe(
        1,
        BAND.x,
        BAND.y + 10,
        760,
        150,
        <text x={BAND.x + 46} y={BAND.y + 40 + nameSize * 0.82} fontFamily={fShoulders} fontWeight={900} fontSize={nameSize} fill={nameInk}>
          {info.name.toUpperCase()}
        </text>,
        uid + 'n',
      )}
      {wipe(
        2,
        BAND.x + 760,
        BAND.y + 10,
        200,
        150,
        <text x={BAND.x + BAND.w - 46} y={BAND.y + 40 + 0.82 * 122} textAnchor="end" fontFamily={fShoulders} fontWeight={900} fontSize={122} fill={pal.sun}>
          {info.number}
        </text>,
        uid + 'u',
      )}
      {wipe(3, BAND.x + 46, BAND.y + 172, BAND.w - 92, 8, <rect x={BAND.x + 46} y={BAND.y + 172} width={BAND.w - 92} height={6} fill={pal.sun} />, uid + 'r')}
      {info.stats.map((s, i) =>
        wipe(
          4 + i,
          BAND.x + 46 + i * statW,
          BAND.y + 190,
          statW,
          130,
          <g>
            <text x={BAND.x + 50 + i * statW} y={BAND.y + 230} fontFamily={fOutfit} fontWeight={600} fontSize={26} letterSpacing={5} fill={labelInk}>
              {s.label.toUpperCase()}
            </text>
            <text x={BAND.x + 48 + i * statW} y={BAND.y + 296} fontFamily={fShoulders} fontWeight={800} fontSize={60} fill={nameInk}>
              {s.value}
            </text>
          </g>,
          uid + 's' + i,
        ),
      )}
    </g>
  );
};

/** squeegee blade drawn at a pull front (poster units). `len` = blade length, `ink` = bead colour */
export const Squeegee: React.FC<{x: number; y: number; len: number; angle?: number; ink: string; frame: number}> = ({x, y, len, angle = 0, ink, frame}) => (
  <g transform={`translate(${fx(x)},${fx(y)}) rotate(${angle})`}>
    {/* ink bead with lit half and dark underside */}
    <rect x={-len / 2} y={-14} width={len} height={16} rx={8} fill={ink} />
    <rect x={-len / 2 + 6} y={-12} width={len - 12} height={5} rx={2.5} fill="#fff" opacity={0.28} />
    {Array.from({length: 6}, (_, i) => (
      <circle key={i} cx={-len / 2 + ((i * 173 + frame * 9) % len)} cy={-9} r={2.2} fill="#fff" opacity={0.5} />
    ))}
    {/* rubber blade + aluminium holder + handle sliver */}
    <rect x={-len / 2 - 8} y={-30} width={len + 16} height={16} fill="#2b2b2b" />
    <rect x={-len / 2 - 8} y={-30} width={len + 16} height={3} fill="#9a9a9a" />
    <rect x={-len / 2 - 14} y={-68} width={len + 28} height={38} rx={6} fill="#b9b2a4" />
    <rect x={-len / 2 - 14} y={-68} width={len + 28} height={6} rx={3} fill="#e6e0d2" />
    <rect x={-len / 2 - 14} y={-38} width={len + 28} height={8} fill="#8b8477" />
  </g>
);

/** wood wall behind a poster (screen-print studio) */
export const PlankWall: React.FC<{w: number; h: number; u: number; base?: string}> = ({w, h, u, base = '#5e4433'}) => {
  const n = Math.ceil(w / (150 * u));
  return (
    <g>
      <rect width={w} height={h} fill={base} />
      {Array.from({length: n}, (_, i) => (
        <g key={i}>
          <rect x={i * 150 * u} y={0} width={150 * u} height={h} fill={i % 2 ? mixHex(base, '#000', 0.08) : mixHex(base, '#cea47d', 0.06)} />
          <rect x={i * 150 * u} y={0} width={3 * u} height={h} fill={mixHex(base, '#000', 0.35)} />
          <rect x={i * 150 * u + 3 * u} y={0} width={2 * u} height={h} fill={mixHex(base, '#cea47d', 0.25)} opacity={0.5} />
        </g>
      ))}
    </g>
  );
};

// =============================================================================================== shadow theatre
export type Lamp = {x: number; y: number; at?: number; intensity?: number};
/** lamp flicker after shadow-puppet main.js: ±6 % value noise at ~7 Hz plus a 23 Hz shimmer */
export const lampFlicker = (frame: number, i: number, fps = 30) => {
  const t = frame / fps;
  return 1 + 0.06 * (vn(7 * t + i * 13.1, i + 3) - 0.5) * 2 + 0.01 * Math.sin(2 * Math.PI * 23 * t + i);
};
/**
 * Back-lit cotton screen: warm dark ground + per-lamp broad and core Gaussian-like radial light, exposure
 * 1.75/√n, fine weave + blotches, warm vignette (never grey). `level[i]` = 0..1.5 ignition per lamp.
 */
export const LampCloth: React.FC<{w: number; h: number; u: number; lamps: {x: number; y: number}[]; level: number[]; frame: number; id: string; weave?: number}> = ({
  w,
  h,
  u,
  lamps,
  level,
  frame,
  id,
  weave = 1,
}) => {
  const lit = level.reduce((s, v) => s + Math.min(1, Math.max(0, v)), 0);
  const expo = lit > 0 ? 1.75 / Math.sqrt(Math.max(1, lit)) : 0;
  const broad = 760 * u;
  const core = 220 * u;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}b`}>
          <stop offset="0" stopColor="#ffe2b0" stopOpacity={1} />
          <stop offset="0.35" stopColor="#ffc475" stopOpacity={0.78} />
          <stop offset="0.7" stopColor="#e29a52" stopOpacity={0.3} />
          <stop offset="1" stopColor="#b37840" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}c`}>
          <stop offset="0" stopColor="#fffaf0" stopOpacity={1} />
          <stop offset="0.5" stopColor="#ffe69e" stopOpacity={0.55} />
          <stop offset="1" stopColor="#ffe69e" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}w`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.42 / u} ${0.38 / u}`} numOctaves={1} seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0 0.15  0 0 0 0.9 -0.25" />
        </filter>
        <filter id={`${id}k`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.0045 / u} numOctaves={2} seed={9} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.32  0 0 0 0 0.16  0 0 0 1.4 -0.55" />
        </filter>
        <radialGradient id={`${id}v`} cx="50%" cy="48%" r="75%">
          <stop offset="0.5" stopColor="#7f4019" stopOpacity={0} />
          <stop offset="1" stopColor="#5a2a0e" stopOpacity={0.62} />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill="#6e3f1c" />
      <rect width={w} height={h} fill="#b37840" opacity={0.25 + 0.15 * Math.min(1, lit)} />
      <g style={{mixBlendMode: 'screen'}}>
        {lamps.map((l, i) => {
          const lv = Math.max(0, level[i] ?? 0);
          if (lv <= 0.001) return null;
          const f = lampFlicker(frame, i) * lv * expo * 0.62;
          return (
            <g key={i}>
              <ellipse cx={l.x} cy={l.y} rx={broad * 1.25} ry={broad} fill={`url(#${id}b)`} opacity={Math.min(1, f)} />
              <circle cx={l.x} cy={l.y} r={core} fill={`url(#${id}c)`} opacity={Math.min(1, f * 0.9)} />
              {f > 1 && <ellipse cx={l.x} cy={l.y} rx={broad * 1.4} ry={broad * 1.15} fill={`url(#${id}b)`} opacity={Math.min(1, f - 1)} />}
            </g>
          );
        })}
      </g>
      {weave > 0 && (
        <>
          <rect width={w} height={h} filter={`url(#${id}w)`} opacity={0.18 * weave} style={{mixBlendMode: 'multiply'}} />
          <rect width={w} height={h} filter={`url(#${id}k)`} opacity={0.28 * weave} style={{mixBlendMode: 'multiply'}} />
        </>
      )}
      <rect width={w} height={h} fill={`url(#${id}v)`} />
    </g>
  );
};

/** hand tremor (shadow-puppet): x ±1.5, y ±1.2 px, rot ±0.009 rad */
export const tremor = (frame: number, seed: number, k = 1, fps = 30) => {
  const t = frame / fps;
  return {
    x: (vn(2.1 * t, seed) - 0.5) * 3 * k,
    y: (vn(2.7 * t, seed + 5) - 0.5) * 2.4 * k,
    r: ((vn(1.7 * t, seed + 9) - 0.5) * 0.018 * k * 180) / Math.PI,
  };
};

/** press-on / lift-off (shadow-puppet): returns scale multiplier, blur px (at 1080), opacity */
export const pressLift = (frame: number, inAt: number, pressFrames: number, outAt: number | null, liftFrames: number, fromScale = 2.6, toScale = 1.9, maxBlur = 34) => {
  const pi = eo3(seg(frame, inAt, inAt + pressFrames));
  let scale = lerp(fromScale, 1, pi);
  let blur = lerp(maxBlur, 0, pi);
  let op = frame < inAt ? 0 : lerp(0.35, 1, pi);
  if (outAt !== null && frame > outAt) {
    const po = ei3(seg(frame, outAt, outAt + liftFrames));
    scale *= lerp(1, toScale, po);
    blur += maxBlur * 0.9 * po;
    op *= 1 - po;
  }
  return {scale, blur, op, pressed: pi >= 1};
};

// ----------------------------------------------------------------------------------------------- carve patterns
/** hide-carve vocabulary (after shadow-puppet carve.js). All return SVG path data; use as black (= cut) in a mask. */
export const carve = {
  /** rows of crescent fish-scale holes filling a box */
  scales: (x: number, y: number, w: number, h: number, r: number) => {
    let d = '';
    const dy = r * 1.15;
    for (let row = 0, yy = y + r; yy < y + h - r * 0.2; row++, yy += dy) {
      const off = row % 2 ? r : 0;
      for (let xx = x + r + off; xx < x + w - r * 0.6; xx += r * 2) {
        // crescent = outer arc minus inner arc, opening downward
        d += `M${fx(xx - r)},${fx(yy)} A${fx(r)},${fx(r)} 0 0 0 ${fx(xx + r)},${fx(yy)} A${fx(r * 1.05)},${fx(r * 0.78)} 0 0 1 ${fx(xx - r)},${fx(yy)} Z `;
      }
    }
    return d;
  },
  /** diamond lattice: holes between diagonal strips */
  lattice: (x: number, y: number, w: number, h: number, s: number, strip = 2.2) => {
    let d = '';
    const hs = s / 2 - strip * 0.75;
    for (let row = 0, yy = y + s / 2; yy < y + h; row++, yy += s / 2) {
      for (let xx = x + (row % 2 ? s / 2 : 0) + s / 2; xx < x + w; xx += s) {
        if (xx - hs < x || xx + hs > x + w || yy - hs < y || yy + hs > y + h) continue;
        d += `M${fx(xx)},${fx(yy - hs)} L${fx(xx + hs)},${fx(yy)} L${fx(xx)},${fx(yy + hs)} L${fx(xx - hs)},${fx(yy)} Z `;
      }
    }
    return d;
  },
  /** coin holes: round hole leaving a square of hide inside (use fill-rule evenodd) */
  coins: (centers: Pt[], r: number) =>
    centers
      .map(([cx, cy]) => {
        const q = r * 0.76 * 0.62;
        return `M${fx(cx - r)},${fx(cy)} A${fx(r)},${fx(r)} 0 1 0 ${fx(cx + r)},${fx(cy)} A${fx(r)},${fx(r)} 0 1 0 ${fx(cx - r)},${fx(cy)} Z M${fx(cx - q)},${fx(cy - q)} H${fx(cx + q)} V${fx(cy + q)} H${fx(cx - q)} Z `;
      })
      .join(''),
  /** cloud scroll: a spiral curl cut as a thin tapered slot (stroke this path, do not fill) */
  cloud: (cx: number, cy: number, r: number, dir = 1) => {
    const p: Pt[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = dir * (t * Math.PI * 3.2) + Math.PI;
      const rr = r * (1 - t * 0.8);
      p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return catmullOpen(p);
  },
  /** meander (key) band from x0 to x1 at y with step s — stroke it */
  meander: (x0: number, y: number, x1: number, s: number) => {
    let d = `M${fx(x0)},${fx(y + s)}`;
    for (let x = x0; x + 4 * s <= x1; x += 4 * s) {
      d += ` L${fx(x)},${fx(y - s)} L${fx(x + 3 * s)},${fx(y - s)} L${fx(x + 3 * s)},${fx(y + 0.4 * s)} L${fx(x + s)},${fx(y + 0.4 * s)} L${fx(x + s)},${fx(y - 0.2 * s)}`;
      d += ` M${fx(x + s)},${fx(y - 0.2 * s)} M${fx(x + 2 * s)},${fx(y - 0.2 * s)} L${fx(x + 2 * s)},${fx(y + s)} L${fx(x + 4 * s)},${fx(y + s)}`;
    }
    return d;
  },
  /** tapered slit along a polyline from width w0 to w1 (filled polygon) */
  taper: (line: Pt[], w0: number, w1: number) => {
    const L: Pt[] = [];
    const R: Pt[] = [];
    line.forEach((p, i) => {
      const q = line[Math.min(line.length - 1, i + 1)];
      const o = line[Math.max(0, i - 1)];
      const a = Math.atan2(q[1] - o[1], q[0] - o[0]) + Math.PI / 2;
      const ww = lerp(w0, w1, i / Math.max(1, line.length - 1)) / 2;
      L.push([p[0] + Math.cos(a) * ww, p[1] + Math.sin(a) * ww]);
      R.push([p[0] - Math.cos(a) * ww, p[1] - Math.sin(a) * ww]);
    });
    return `M${pts([...L, ...R.reverse()]).split(' ').join(' L')} Z`;
  },
  /** bead line: small round holes along a polyline */
  beads: (line: Pt[], r: number, gap: number) => {
    let d = '';
    const L = polyLen(line);
    const n = Math.max(1, Math.floor(L / gap));
    for (let i = 0; i <= n; i++) {
      const {x, y} = alongPoly(line, i / n);
      d += `M${fx(x - r)},${fx(y)} a${fx(r)},${fx(r)} 0 1 0 ${fx(2 * r)},0 a${fx(r)},${fx(r)} 0 1 0 ${fx(-2 * r)},0 Z `;
    }
    return d;
  },
};

// =============================================================================================== film print damage
/** projector weave after silent-film film.js weaveAt (px at 1080, scaled by u) */
export const weaveAt = (frame: number, k = 0.6, crank = 1) => {
  const f = frame * crank;
  let x = (0.6 * Math.sin(0.31 * f) + 0.8 * Math.sin(0.113 * f + 1.3) + 0.5 * (h1(f) - 0.5)) * 1.4 * k;
  let y = (0.7 * Math.sin(0.23 * f + 0.7) + 0.9 * Math.sin(0.071 * f + 2.1) + 0.6 * (h1(f + 99) - 0.5)) * 1.6 * k;
  if (h1(Math.floor(frame / 2) * 3.7, 5) < 0.025 * k) y += 4 * k;
  return {x, y};
};
export const flickerAt = (frame: number, k = 0.6, crank = 1) => {
  const f = frame * crank;
  return 1 + ((h1(frame, 2) - 0.5) * 0.09 + 0.025 * crank * Math.sin(1.9 * f) + 0.02 * Math.sin(0.37 * f)) * k;
};
/** scratches, dust, a hair, edge burn and flicker for a print gate rect */
export const FilmDamage: React.FC<{x: number; y: number; w: number; h: number; u: number; frame: number; k?: number; id: string; burn?: boolean}> = ({
  x,
  y,
  w,
  h,
  u,
  frame,
  k = 0.6,
  id,
  burn = true,
}) => {
  const fl = flickerAt(frame, k);
  const scratches: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const life = 5 + 3 * i;
    const epoch = Math.floor(frame / life);
    const on = h1(epoch * 7.3 + i, 11) > 1 - k * (0.55 - 0.1 * i);
    if (!on) continue;
    const sx = x + h1(epoch, i + 20) * w + Math.sin(frame * 0.7 + i) * 3 * u;
    const dark = h1(epoch, i + 40) < 0.38;
    const sw = (0.6 + h1(epoch, i + 50) * 1.4) * u;
    const y0 = y + h1(epoch, i + 60) * h * 0.4;
    const y1 = y0 + h * (0.3 + h1(epoch, i + 70) * 0.7);
    scratches.push(<rect key={'s' + i} x={sx} y={y0} width={sw} height={Math.min(y + h, y1) - y0} fill={dark ? '#000' : '#fff'} opacity={dark ? 0.45 : 0.55} strokeDasharray="1" />);
  }
  const dust: React.ReactNode[] = [];
  const nd = Math.floor(h1(frame, 31) * 6 * k + 1);
  for (let i = 0; i < nd; i++) {
    const dx = x + h1(frame * 3 + i, 32) * w;
    const dy = y + h1(frame * 5 + i, 33) * h;
    const r = (1 + h1(frame + i, 34) * 2.5) * u;
    dust.push(<ellipse key={'d' + i} cx={dx} cy={dy} rx={r} ry={r * (0.5 + h1(i, frame))} fill={h1(i + frame, 35) < 0.7 ? '#0c0a08' : '#f4efe4'} opacity={0.7} />);
  }
  // a hair that lives 8–20 frames
  const hairEpoch = Math.floor(frame / 40);
  const hairOn = h1(hairEpoch, 70) < 0.6 && frame % 40 < 8 + h1(hairEpoch, 71) * 12;
  const hx = x + (0.15 + 0.7 * h1(hairEpoch, 72)) * w;
  const hy = y + (0.15 + 0.7 * h1(hairEpoch, 73)) * h;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}burn`} cx="50%" cy="50%" r="72%">
          <stop offset="0.55" stopColor="#3a1d08" stopOpacity={0} />
          <stop offset="0.86" stopColor="#3a1d08" stopOpacity={0.35 * k} />
          <stop offset="1" stopColor="#1a0c02" stopOpacity={0.9 * k} />
        </radialGradient>
      </defs>
      {burn && <rect x={x} y={y} width={w} height={h} fill={`url(#${id}burn)`} />}
      <rect x={x} y={y} width={w} height={h} fill={fl > 1 ? '#fff' : '#000'} opacity={Math.min(0.25, Math.abs(fl - 1) * 2.2)} />
      {scratches}
      {dust}
      {hairOn && (
        <path
          d={`M${fx(hx)},${fx(hy)} c${fx(30 * u)},${fx(-20 * u)} ${fx(40 * u)},${fx(30 * u)} ${fx(70 * u)},${fx(10 * u)} s${fx(30 * u)},${fx(40 * u)} ${fx(10 * u)},${fx(60 * u)}`}
          fill="none"
          stroke="#0c0a08"
          strokeWidth={1.2 * u}
          opacity={0.75}
        />
      )}
    </g>
  );
};

// =============================================================================================== cut-paper silhouette rig
/**
 * Spy-title cut-paper figures (after spy-titles chars.js ideas): flat black, sharp wedge hands, pointed shoes,
 * one red accent (tie / coat lining). Local coords: feet on y=0, facing +x; `H` = figure height in px.
 */
export type RigPose = {thF: number; shF: number; thB: number; shB: number; arF: number; foF: number; arB: number; foB: number; bob: number; lean: number};
// 8-drawing run cycle (radians from vertical; + = forward)
const RUN: number[][] = [
  // thF, shF(knee fold, negative), arF, foF
  [0.95, -0.35, -0.9, 1.5],
  [0.7, -0.15, -0.7, 1.4],
  [0.2, -0.25, -0.2, 1.3],
  [-0.35, -0.7, 0.3, 1.3],
  [-0.6, -1.5, 0.75, 1.5],
  [-0.25, -2.0, 0.95, 1.6],
  [0.35, -1.6, 0.6, 1.5],
  [0.8, -0.8, -0.3, 1.5],
];
const WALK: number[][] = [
  [0.4, -0.1, -0.35, 0.4],
  [0.25, -0.15, -0.2, 0.35],
  [0.0, -0.2, 0.0, 0.3],
  [-0.2, -0.3, 0.2, 0.35],
  [-0.35, -0.5, 0.35, 0.4],
  [-0.15, -0.8, 0.2, 0.4],
  [0.15, -0.6, -0.05, 0.35],
  [0.35, -0.25, -0.25, 0.4],
];
export const rigPose = (action: 'run' | 'walk' | 'leap' | 'stand' | 'flatten' | 'look', frame: number, phase = 0, onTwos = true, cycle = 16): RigPose => {
  const f = onTwos ? Math.floor(frame / 2) * 2 : frame;
  if (action === 'stand' || action === 'look')
    return {thF: 0.05, shF: -0.05, thB: -0.05, shB: -0.05, arF: 0.1, foF: 0.3, arB: -0.1, foB: 0.3, bob: 0, lean: action === 'look' ? -0.12 : 0.02};
  if (action === 'flatten') return {thF: 0.02, shF: 0, thB: -0.02, shB: 0, arF: -0.15, foF: 0.05, arB: -0.2, foB: 0.05, bob: 0, lean: -0.05};
  if (action === 'leap') return {thF: 1.2, shF: -0.6, thB: -0.75, shB: -1.4, arF: -1.3, foF: 0.6, arB: 1.4, foB: 0.8, bob: 0, lean: 0.35};
  const T = action === 'run' ? RUN : WALK;
  const k = Math.floor(((f / cycle) * 8 + phase * 8) % 8 + 8) % 8;
  const kb = (k + 4) % 8;
  const a = T[k];
  const b = T[kb];
  return {
    thF: a[0],
    shF: a[1],
    thB: b[0],
    shB: b[1],
    arF: b[2],
    foF: b[3],
    arB: a[2],
    foB: a[3],
    bob: action === 'run' ? Math.abs(Math.sin((k / 8) * Math.PI * 2)) * 0.02 : Math.abs(Math.sin((k / 8) * Math.PI * 2)) * 0.01,
    lean: action === 'run' ? 0.3 : 0.06,
  };
};

const limb = (x: number, y: number, a1: number, l1: number, a2: number, l2: number): {knee: Pt; end: Pt} => {
  const knee: Pt = [x + Math.sin(a1) * l1, y + Math.cos(a1) * l1];
  const end: Pt = [knee[0] + Math.sin(a1 + a2) * l2, knee[1] + Math.cos(a1 + a2) * l2];
  return {knee, end};
};

/** a cut-paper agent / villain silhouette */
export const CutFigure: React.FC<{
  kind: 'agent' | 'villain';
  pose: RigPose;
  H: number;
  ink?: string;
  accent?: string;
  ground?: string;
  object?: string;
  frame: number;
  running?: boolean;
}> = ({kind, pose, H, ink = '#111014', accent = '#d2261c', ground = '#c8321e', object = '#e0a526', frame, running = true}) => {
  const hh = H / 7;
  const villain = kind === 'villain';
  const hipY = -3.5 * hh - pose.bob * H;
  const leg = 1.75 * hh;
  const lw = (villain ? 0.4 : 0.44) * hh;
  const torso = 2.15 * hh;
  const legF = limb(0, hipY, pose.thF, leg, pose.shF, leg);
  const legB = limb(0, hipY, pose.thB, leg, pose.shB, leg);
  const shoe = (end: Pt) =>
    `M${fx(end[0] - lw * 0.55)},${fx(end[1] - lw * 0.55)} L${fx(end[0] + lw * 1.8)},${fx(end[1] + lw * 0.2)} L${fx(end[0] - lw * 0.6)},${fx(end[1] + lw * 0.4)} Z`;
  const legPath = (l: {knee: Pt; end: Pt}) => `M0,${fx(hipY)} L${fx(l.knee[0])},${fx(l.knee[1])} L${fx(l.end[0])},${fx(l.end[1])}`;
  const sh: Pt = [0.05 * hh, -torso];
  const arm = 1.3 * hh;
  const armF = limb(sh[0], sh[1], pose.arF, arm, pose.foF, arm * 0.95);
  const armB = limb(sh[0], sh[1], pose.arB, arm, pose.foB, arm * 0.95);
  const armPath = (l: {knee: Pt; end: Pt}) => `M${fx(sh[0])},${fx(sh[1])} L${fx(l.knee[0])},${fx(l.knee[1])} L${fx(l.end[0])},${fx(l.end[1])}`;
  const hand = (l: {knee: Pt; end: Pt}) => {
    const a = Math.atan2(l.end[1] - l.knee[1], l.end[0] - l.knee[0]);
    const tx = l.end[0] + Math.cos(a) * lw * 1.3;
    const ty = l.end[1] + Math.sin(a) * lw * 1.3;
    const px = -Math.sin(a) * lw * 0.42;
    const py = Math.cos(a) * lw * 0.42;
    return `M${fx(l.end[0] + px)},${fx(l.end[1] + py)} L${fx(tx)},${fx(ty)} L${fx(l.end[0] - px)},${fx(l.end[1] - py)} Z`;
  };
  const headR = 0.48 * hh;
  const headY = -torso - 0.72 * hh;
  const tie: Pt[] = [];
  const tlen = 1.9 * hh;
  const ta = running ? (65 * Math.PI) / 180 : 0.12;
  for (let i = 0; i <= 10; i++) {
    const s = i / 10;
    const wav = Math.sin(s * 5 - frame * 0.7) * 0.16 * hh * s;
    tie.push([-Math.sin(ta) * s * tlen + Math.cos(ta) * wav, -torso + 0.3 * hh + Math.cos(ta) * s * tlen + Math.sin(ta) * wav]);
  }
  const coatW = villain ? 0.62 * hh : 0.58 * hh;
  const hem = villain ? 1.15 * hh : 0.35 * hh;
  const flare = villain ? (running ? 0.85 * hh : 0.35 * hh) : 0.08 * hh;
  const slit = Math.max(1, 0.035 * hh);
  return (
    <g strokeLinejoin="round">
      <path d={legPath(legB)} stroke={ink} strokeWidth={lw} fill="none" strokeLinecap="round" />
      <path d={shoe(legB.end)} fill={ink} />
      <g transform={`translate(0 ${fx(hipY)}) rotate(${fx((pose.lean * 180) / Math.PI)})`}>
        <path d={armPath(armB)} stroke={ink} strokeWidth={lw * 0.85} fill="none" strokeLinecap="round" />
        <path d={hand(armB)} fill={ink} />
        {!villain && <path d={carve.taper(tie, 0.24 * hh, 0.08 * hh)} fill={accent} />}
        {villain && running && <path d={`M${fx(-coatW * 0.5)},${fx(-torso + 0.4 * hh)} L${fx(-coatW - flare * 1.15)},${fx(hem + 0.05 * hh)} L${fx(coatW * 0.1)},${fx(hem - 0.1 * hh)} Z`} fill={accent} />}
        <path
          d={`M${fx(-coatW)},${fx(-torso + 0.2 * hh)} Q${fx(0.05 * hh)},${fx(-torso - 0.28 * hh)} ${fx(coatW * 1.05)},${fx(-torso + 0.2 * hh)} L${fx(coatW + flare * 0.25)},${fx(hem)} L${fx(-coatW - flare)},${fx(hem)} Z`}
          fill={ink}
        />
        <rect x={-0.12 * hh} y={-torso - 0.4 * hh} width={0.32 * hh} height={0.5 * hh} fill={ink} />
        <circle cx={0.06 * hh} cy={headY} r={headR} fill={ink} />
        <path d={`M${fx(0.3 * hh)},${fx(headY + 0.1 * hh)} L${fx(0.62 * hh)},${fx(headY + 0.22 * hh)} L${fx(0.36 * hh)},${fx(headY + 0.36 * hh)} Z`} fill={ink} />
        <rect x={-(villain ? 1.0 : 0.62) * hh} y={headY - headR * 0.62} width={(villain ? 2.12 : 1.3) * hh} height={0.13 * hh} rx={0.06 * hh} fill={ink} />
        <path d={`M${fx(-0.42 * hh)},${fx(headY - headR * 0.55)} L${fx(-0.34 * hh)},${fx(headY - headR * 1.8)} Q${fx(0.04 * hh)},${fx(headY - headR * 2.1)} ${fx(0.42 * hh)},${fx(headY - headR * 1.8)} L${fx(0.48 * hh)},${fx(headY - headR * 0.55)} Z`} fill={ink} />
        <rect x={-0.4 * hh} y={headY - headR * 0.95} width={0.86 * hh} height={0.06 * hh} fill={ground} />
        <path d={`M${fx(-coatW * 0.4)},${fx(-torso + 0.6 * hh)} q${fx(0.3 * hh)},${fx(0.22 * hh)} ${fx(0.6 * hh)},0`} stroke={ground} strokeWidth={slit} fill="none" />
        <path d={`M${fx(-coatW * 0.9)},${fx(0.05 * hh)} L${fx(coatW * 0.9)},${fx(0.05 * hh)}`} stroke={ground} strokeWidth={slit} />
        <path d={armPath(armF)} stroke={ink} strokeWidth={lw * 0.85} fill="none" strokeLinecap="round" />
        <path d={hand(armF)} fill={ink} />
        <path d={`M${fx(armF.knee[0] - lw * 0.3)},${fx(armF.knee[1] - lw * 0.3)} l${fx(lw * 0.6)},${fx(lw * 0.6)}`} stroke={ground} strokeWidth={slit} />
        {villain && (
          <g transform={`translate(${fx(armF.end[0])},${fx(armF.end[1])})`}>
            <rect x={-0.6 * hh} y={-0.05 * hh} width={1.2 * hh} height={0.85 * hh} rx={0.08 * hh} fill={ink} />
            <rect x={-0.5 * hh} y={0.06 * hh} width={1.0 * hh} height={0.62 * hh} rx={0.06 * hh} fill={object} />
            <rect x={-0.22 * hh} y={-0.24 * hh} width={0.44 * hh} height={0.2 * hh} fill="none" stroke={ink} strokeWidth={0.08 * hh} />
          </g>
        )}
      </g>
      <path d={legPath(legF)} stroke={ink} strokeWidth={lw} fill="none" strokeLinecap="round" />
      <path d={shoe(legF.end)} fill={ink} />
      <path d={`M${fx(legF.knee[0] - lw * 0.45)},${fx(legF.knee[1] - lw * 0.1)} l${fx(lw * 0.9)},${fx(lw * 0.2)}`} stroke={ground} strokeWidth={slit} />
    </g>
  );
};

// =============================================================================================== misc
/** jagged crack polylines (stained-glass story.js idea): `n` cracks from an impact */
export const crackSet = (x: number, y: number, n: number, seed: number, scale: number) => {
  const r = rng(seed * 31 + 7);
  const out: {pts: Pt[]; delay: number; branch: boolean}[] = [];
  for (let i = 0; i < n; i++) {
    let a = (2 * Math.PI * i) / n + (r() - 0.5) * 0.5;
    const len = (70 + r() * 170) * scale;
    const p: Pt[] = [[x, y]];
    let cx = x;
    let cy = y;
    let L = 0;
    while (L < len) {
      a += (r() - 0.5) * 0.7;
      cx += Math.cos(a) * 14 * scale;
      cy += Math.sin(a) * 14 * scale;
      L += 14 * scale;
      p.push([cx, cy]);
    }
    const delay = r() * 0.12;
    out.push({pts: p, delay, branch: false});
    if (r() < 0.6) {
      const at = Math.floor(p.length * (0.3 + r() * 0.4));
      let ba = a + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.5);
      let bx = p[at][0];
      let by = p[at][1];
      const bp: Pt[] = [[bx, by]];
      for (let k = 0; k < 90 / 12; k++) {
        ba += (r() - 0.5) * 0.7;
        bx += Math.cos(ba) * 12 * scale;
        by += Math.sin(ba) * 12 * scale;
        bp.push([bx, by]);
      }
      out.push({pts: bp, delay: delay + (at / p.length) * 0.28, branch: true});
    }
  }
  return out;
};
export const polyD = (p: Pt[]) => `M${pts(p).split(' ').join(' L')}`;
