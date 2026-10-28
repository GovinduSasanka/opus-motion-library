/**
 * r2-la2-kit — shared helpers for the LA2 group (techniques ported from lemo-opuscar styles, MIT © LemoLab —
 * see THIRD_PARTY_NOTICES.md): city-symphony, countdown, crayon-book, dark-keynote, data-physical, dataviz,
 * engraving, game-show, glass-product, halftone-dossier.
 * Everything is a pure function of the frame; no Math.random, no timers.
 * Parallel sub-agents edit ONLY their own section below (between the ==== markers).
 */
import {loadFont as michroma} from '@remotion/google-fonts/Michroma';
import {loadFont as barlowCond} from '@remotion/google-fonts/BarlowCondensed';
import {loadFont as barlow} from '@remotion/google-fonts/Barlow';
import {loadFont as plexMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as fredoka} from '@remotion/google-fonts/Fredoka';
import {loadFont as bagel} from '@remotion/google-fonts/BagelFatOne';
import {loadFont as bodoni} from '@remotion/google-fonts/BodoniModa';
import {loadFont as pinyon} from '@remotion/google-fonts/PinyonScript';
import {loadFont as patrick} from '@remotion/google-fonts/PatrickHand';
import {loadFont as gaegu} from '@remotion/google-fonts/Gaegu';
import {loadFont as newsreader} from '@remotion/google-fonts/Newsreader';
import {loadFont as interTight} from '@remotion/google-fonts/InterTight';
import {loadFont as alfaSlab} from '@remotion/google-fonts/AlfaSlabOne';
import {loadFont as jbm} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as caveat} from '@remotion/google-fonts/Caveat';
import {loadFont as inter} from '@remotion/google-fonts/Inter';

bodoni('italic', {weights: ['400'], subsets: ['latin']});

/** font roles for this group (loaded once) */
export const la2Fonts = {
  /** city-symphony: wide techno caps for numbers and tracked Latin lines */
  michroma: michroma('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** countdown clock: condensed semi-bold digits in fixed slots */
  barlowCond: barlowCond('normal', {weights: ['500', '600', '700'], subsets: ['latin']}).fontFamily,
  barlow: barlow('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']}).fontFamily,
  /** labels / codes / ticks */
  plex: plexMono('normal', {weights: ['400', '500', '600'], subsets: ['latin']}).fontFamily,
  /** game-show display */
  fredoka: fredoka('normal', {weights: ['500', '600', '700'], subsets: ['latin']}).fontFamily,
  /** halftone-dossier fat numerals / names */
  bagel: bagel('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** engraving roman caps (use fontStyle italic for Latin names) */
  bodoni: bodoni('normal', {weights: ['400', '500', '700'], subsets: ['latin']}).fontFamily,
  /** engraving script notes */
  pinyon: pinyon('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** crayon-book printed words */
  patrick: patrick('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** crayon-book hand-lettered titles */
  gaegu: gaegu('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily,
  /** dataviz headline serif */
  newsreader: newsreader('normal', {weights: ['400', '500', '600'], subsets: ['latin']}).fontFamily,
  /** glass-product / dark-keynote thin & tight grotesk */
  tight: interTight('normal', {weights: ['200', '300', '400', '600'], subsets: ['latin']}).fontFamily,
  /** dossier slab headline */
  slab: alfaSlab('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** heavy mono (case numbers, rulers) */
  monoHeavy: jbm('normal', {weights: ['400', '500', '700', '800'], subsets: ['latin']}).fontFamily,
  /** dataviz handwriting */
  caveat: caveat('normal', {weights: ['400', '600', '700'], subsets: ['latin']}).fontFamily,
  /** UI sans (keynote, data-physical light numbers) */
  inter: inter('normal', {weights: ['200', '300', '400', '500', '600', '700'], subsets: ['latin']}).fontFamily,
};

// ==== common =================================================================================================

export const TAU = Math.PI * 2;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
/** normalised segment progress (unclamped input) */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1e-9, b - a));
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const sstep = (a: number, b: number, v: number) => smooth((v - a) / (b - a));
export const eo = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const ei = (t: number) => Math.pow(clamp01(t), 3);
export const eio = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** back ease-out with overshoot s (1.70158 classic, 1.35 keynote, 1.9 dossier) */
export const backOut = (t: number, s = 1.70158) => {
  const x = clamp01(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** quintic ease-out */
export const eo5 = (t: number) => 1 - Math.pow(1 - clamp01(t), 5);

/** integer hash -> 0..1 (deterministic, cheap) */
export const h01 = (a: number, b = 0, c = 0) => {
  let x = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35) ^ Math.imul((c | 0) + 0x27d4eb2f, 0x165667b1);
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d);
  x ^= x >>> 12;
  x = Math.imul(x, 0x297a2d39);
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
};
/** string seed -> int */
export const seedOf = (s: string | number) => (typeof s === 'number' ? s | 0 : [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261));

export const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s.slice(0, 6);
  return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0];
};
/** mix two hex colours -> #rrggbb */
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = clamp01(t);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${clamp01(a)})`;
};
/** lighten (k>0) / darken (k<0) */
export const shadeHex = (hex: string, k: number) => (k >= 0 ? mixHex(hex, '#ffffff', k) : mixHex(hex, '#000000', -k));
export const isClear = (bg: string | undefined) => !bg || bg === 'transparent' || bg === 'none';

/** piecewise-linear keyframes [[x, y], ...] (clamped) */
export const keyLerp = (keys: [number, number][], x: number) => {
  if (!keys.length) return 0;
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i][0]) {
      const [x0, y0] = keys[i - 1];
      const [x1, y1] = keys[i];
      return y0 + (y1 - y0) * ((x - x0) / Math.max(1e-9, x1 - x0));
    }
  }
  return keys[keys.length - 1][1];
};

/**
 * monotone cubic keyframe track (Fritsch–Carlson) — port of lemo-opuscar core/lib.js `monotone`/`track` (MIT).
 * keys [[x, y], ...] sorted by x; returns y(x) without overshoot.
 */
export const monotoneTrack = (keys: [number, number][]) => {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
  if (n > 1) {
    m[0] = d[0];
    m[n - 1] = d[n - 2];
  }
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (n === 0) return 0;
    if (n === 1 || x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const hh = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / hh;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * hh * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * hh * m[i + 1];
  };
};

/** polyline -> SVG path d */
export const polyD = (pts: [number, number][], closed = false) =>
  pts.length ? 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + (closed ? ' Z' : '') : '';

/** average glyph advance per em for a few fonts (no DOM measuring) */
export const advance = (text: string, size: number, perEm = 0.6, tracking = 0) => [...text].length * size * (perEm + tracking);

// ==== /common ================================================================================================

// ==== A: city-symphony / countdown / dataviz / halftone-dossier ==============================================
// Adapted from lemo-opuscar styles/city-symphony/demo/tools/render.py, styles/countdown/demo/index.html,
// styles/dataviz/demo/engine.js, styles/halftone-dossier/demo/index.html (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import type {FC as FCA, ReactNode as RNA} from 'react';
import {useId as useIdA0} from 'react';
import {noise2D as noiseA} from '@remotion/noise';

/** unique, url-safe id per component instance (for <defs>) */
export const useIdA = (prefix: string) => prefix + useIdA0().replace(/[^a-zA-Z0-9]/g, '');

// ---- city-symphony ----------------------------------------------------------------------------------------
export const CS = {sodium: '#D9772F', ink: '#ECE9E4', dim: '#A8A39C', plate: '#3F3D3A', matte: '#000000'};

/**
 * lock digits (render.py lock_digits): k = floor((t − t0)/step); digit j < k shows its final value, the others a
 * seeded random digit that changes every frame. Non-digits (commas, dots) always show.
 */
export const lockDigits = (final: string, frame: number, start: number, step: number, seed = 1) => {
  const k = Math.floor((frame - start) / Math.max(0.01, step));
  let j = 0;
  let out = '';
  for (const ch of final) {
    if (/[0-9]/.test(ch)) {
      out += j < k ? ch : String(Math.floor(h01(frame, j, seed) * 10));
      j++;
    } else out += ch;
  }
  return {text: out, done: k >= j, digits: j};
};

/** release-print finish: soft vignette, mid-tone grain and (landscape only) a 1.85:1 matte */
export const CsFinish: FCA<{w: number; h: number; frame: number; matte?: boolean; grain?: number; vignette?: number; id: string}> = ({w, h, frame, matte = true, grain = 0.1, vignette = 0.5, id}) => {
  const seedG = (frame * 7) % 10;
  const bar = matte && w / h > 1.6 ? Math.max(0, (h - w / 1.85) / 2) : 0;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <radialGradient id={`${id}v`} cx="50%" cy="50%" r="72%">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={vignette} />
        </radialGradient>
        <filter id={`${id}g${seedG}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={seedG + 1} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}v)`} />
      {grain > 0 && <rect width={w} height={h} filter={`url(#${id}g${seedG})`} opacity={grain} style={{mixBlendMode: 'overlay'}} />}
      {bar > 0.5 && (
        <>
          <rect width={w} height={bar} fill={CS.matte} />
          <rect y={h - bar} width={w} height={bar} fill={CS.matte} />
        </>
      )}
    </svg>
  );
};

/** small thin 24-hour ring (render.py draw_dial): ticks, 3-hour arc ending at the hand, orange dot, 00/06/12/18 */
export const DayDial: FCA<{cx: number; cy: number; r: number; hour: number; alpha?: number; accent?: string; dim?: string; u: number; font?: string; labels?: boolean; arcHours?: number; readout?: string}> = ({
  cx,
  cy,
  r,
  hour,
  alpha = 1,
  accent = CS.sodium,
  dim = CS.dim,
  u,
  font = la2Fonts.michroma,
  labels = true,
  arcHours = 3,
  readout,
}) => {
  const ang = (hh: number) => (hh * 15 - 90) * (Math.PI / 180);
  const a1 = ang(hour);
  const a0 = ang(hour - arcHours);
  const P = (a: number, rr: number) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;
  const [x0, y0] = P(a0, r);
  const [x1, y1] = P(a1, r);
  const large = arcHours * 15 > 180 ? 1 : 0;
  const ticks: RNA[] = [];
  for (let k = 0; k < 24; k++) {
    const a = ang(k);
    const r0 = r - (k % 6 === 0 ? 0.16 : 0.08) * r;
    const [ax, ay] = P(a, r0);
    const [bx, by] = P(a, r);
    ticks.push(<line key={k} x1={ax} y1={ay} x2={bx} y2={by} stroke={dim} strokeWidth={Math.max(1, 1.1 * u)} opacity={0.75} />);
  }
  const fs = Math.max(9, r * 0.28);
  return (
    <g opacity={alpha}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={dim} strokeWidth={Math.max(1, 1.1 * u)} opacity={0.6} />
      {ticks}
      <path d={`M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`} fill="none" stroke={accent} strokeWidth={Math.max(2, r * 0.075)} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.cos(a1) * r * 0.78} y2={cy + Math.sin(a1) * r * 0.78} stroke={accent} strokeWidth={Math.max(1.2, r * 0.035)} strokeLinecap="round" opacity={0.9} />
      <circle cx={cx} cy={cy} r={Math.max(1.5, r * 0.045)} fill={accent} />
      <circle cx={x1} cy={y1} r={Math.max(3, r * 0.1)} fill={accent} />
      {labels &&
        [0, 6, 12, 18].map((k) => {
          const [lx, ly] = P(ang(k), r + fs * 1.15);
          return (
            <text key={k} x={lx} y={ly + fs * 0.36} fontFamily={font} fontSize={fs} fill={dim} textAnchor="middle" opacity={0.9}>
              {String(k).padStart(2, '0')}
            </text>
          );
        })}
      {readout && (
        <text x={cx} y={cy + r + fs * 3.1} fontFamily={font} fontSize={fs * 1.05} fill={dim} textAnchor="middle" letterSpacing={fs * 0.12}>
          {readout}
        </text>
      )}
    </g>
  );
};

/** hh:mm string for a fractional hour */
export const hhmm = (hour: number) => {
  const hh = ((Math.floor(hour) % 24) + 24) % 24;
  const mm = Math.floor((((hour % 1) + 1) % 1) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// ---- countdown --------------------------------------------------------------------------------------------
export const CD = {
  bg: '#06080A',
  panel: '#0B0E11',
  ink: '#F2F5F7',
  dim: '#7C878D',
  line: 'rgba(222,232,238,0.16)',
  org: '#FF5B1F',
  live: '#FF3B30',
  dark: '#0A0B0C',
  plate: 'rgba(6,8,10,0.84)',
};
/** est. advance per em: IBM Plex Mono .6, Barlow 600 .54, Barlow Condensed 600 .44 */
export const cdW = (s: string, size: number, kind: 'mono' | 'sans' | 'cond' = 'mono', tracking = 0) =>
  [...s].length * size * ((kind === 'mono' ? 0.6 : kind === 'sans' ? 0.54 : 0.44) + tracking);

/** camera chip (index.html chip): dark plate, square sync dot, CAM code, name, small mono sub */
export const chipWidth = (code: string, name: string, sub: string, s: number) => (14 + 10 + 12 + 10 + 14) * s + cdW(code, 15 * s) + cdW(name, 19 * s, 'sans') + (sub ? cdW(sub, 13 * s) : -10 * s);
export const CamChip: FCA<{x: number; y: number; code: string; name: string; sub?: string; synced?: boolean; s: number; reveal?: number; accent?: string}> = ({x, y, code, name, sub = '', synced = true, s, reveal = 1, accent = CD.org}) => {
  const w = chipWidth(code, name, sub, s);
  const w1 = cdW(code, 15 * s);
  const w2 = cdW(name, 19 * s, 'sans');
  const id = useIdA('chip');
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={w * clamp01(reveal)} height={32 * s} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={y} width={w} height={32 * s} fill={CD.plate} />
        <rect x={x + 12 * s} y={y + 12 * s} width={8 * s} height={8 * s} fill={synced ? accent : CD.dim} />
        <text x={x + 28 * s} y={y + 22 * s} fontFamily={la2Fonts.plex} fontWeight={600} fontSize={15 * s} fill={accent}>
          {code}
        </text>
        <text x={x + 40 * s + w1} y={y + 23 * s} fontFamily={la2Fonts.barlow} fontWeight={700} fontSize={19 * s} fill={CD.ink}>
          {name}
        </text>
        {sub && (
          <text x={x + 50 * s + w1 + w2} y={y + 22 * s} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={13 * s} fill={CD.dim}>
            {sub}
          </text>
        )}
      </g>
    </g>
  );
};

export type SyncKind = 'live' | 'window' | 'retimed';
export const SYNC_LABELS: Record<SyncKind, [string, string]> = {
  live: ['Live sync', 'LIVE SYNC'],
  window: ['Same window', 'NOT FRAME-SYNCED'],
  retimed: ['Real-time', 'RETIMED'],
};
export const badgeWidth = (kind: SyncKind, s: number, labels = SYNC_LABELS[kind]) => (12 + 12 + 8 + 12) * s + cdW(labels[0], 15 * s, 'sans') + cdW(labels[1], 12 * s);
/** sync badge, right-aligned to x1 (index.html syncBadge): ● live (orange) / ○ hatched grey "same window" */
export const SyncBadge: FCA<{x1: number; y: number; kind: SyncKind; s: number; labels?: [string, string]; accent?: string; alpha?: number}> = ({x1, y, kind, s, labels, accent = CD.org, alpha = 1}) => {
  const L = labels ?? SYNC_LABELS[kind];
  const w = badgeWidth(kind, s, L);
  const x = x1 - w;
  const id = useIdA('badge');
  const hh = 28 * s;
  const tw0 = cdW(L[0], 15 * s, 'sans');
  const hatch: RNA[] = [];
  if (kind === 'window') for (let k = -30 * s; k < w + 30 * s; k += 9 * s) hatch.push(<line key={k} x1={x + k} y1={y + hh} x2={x + k + hh} y2={y} stroke="rgba(124,135,141,0.28)" strokeWidth={2 * s} />);
  return (
    <g opacity={alpha}>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={w} height={hh} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={hh} fill={CD.plate} />
      {kind === 'window' && (
        <>
          <g clipPath={`url(#${id})`}>{hatch}</g>
          <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={hh - 1} fill="none" stroke={CD.dim} strokeWidth={1} />
        </>
      )}
      {kind === 'window' ? (
        <circle cx={x + 15 * s} cy={y + 14 * s} r={4.5 * s} fill="none" stroke={CD.dim} strokeWidth={1.5 * s} />
      ) : kind === 'live' ? (
        <circle cx={x + 15 * s} cy={y + 14 * s} r={4.5 * s} fill={accent} />
      ) : (
        <text x={x + 9 * s} y={y + 19 * s} fontFamily={la2Fonts.plex} fontWeight={600} fontSize={12 * s} fill={accent}>
          1×
        </text>
      )}
      <text x={x + 26 * s} y={y + 20 * s} fontFamily={la2Fonts.barlow} fontWeight={500} fontSize={15 * s} fill={CD.ink}>
        {L[0]}
      </text>
      <text x={x + 34 * s + tw0} y={y + 19 * s} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={12 * s} fill={kind === 'window' ? CD.dim : accent}>
        {L[1]}
      </text>
    </g>
  );
};

/** split T−mm:ss.t into parts for a value in seconds relative to zero (M<0 before zero) */
export const clockParts = (M: number) => {
  const a = Math.abs(M);
  const secs = Math.floor(a);
  const tenth = Math.floor((a % 1) * 10);
  return {neg: M < 0, mm: String(Math.floor(secs / 60)).padStart(2, '0'), ss: String(secs % 60).padStart(2, '0'), tenth, sub: a % 1, hh: String(Math.floor(secs / 3600)).padStart(2, '0')};
};

/**
 * mission clock block (index.html drawClock): T− in accent, fixed-slot condensed digits dropping 14 px on each new second,
 * grey tenths, a ten-segment bar draining each second; at zero it inverts (accent fill, dark ink) with a white flash.
 * `segments` = control strip labels; `activeSeg` index, `segK` 0..1 fill of the active segment.
 */
export const ClockBlock: FCA<{
  x: number;
  y: number;
  w: number;
  h: number;
  M: number;
  s: number;
  header?: [string, string];
  segments?: string[];
  activeSeg?: number;
  segK?: number;
  handFlash?: number;
  accent?: string;
  border?: boolean;
  invert?: boolean;
  fill?: string;
  hours?: boolean;
}> = ({x, y, w, h, M, s, header = ['COUNTDOWN', 'MISSION ELAPSED'], segments = [], activeSeg = 0, segK = 1, handFlash = 0, accent = CD.org, border = true, invert = true, fill = CD.panel, hours = false}) => {
  const P = clockParts(M);
  const inv = invert && !P.neg;
  const flash = inv ? Math.exp(-M * 6) : 0;
  const ink = inv ? CD.dark : CD.ink;
  const acc = inv ? CD.dark : accent;
  const dim = inv ? 'rgba(10,11,12,0.62)' : CD.dim;
  const id = useIdA('clk');
  const since = P.neg ? 1 - P.sub : P.sub;
  const fs = Math.min(132 * s, (h - 70 * s) * 0.92, w * (hours ? 0.15 : 0.2));
  const sym = fs * 0.85;
  const drop = (1 - eo(clamp01(since / 0.12))) * -14 * (fs / 132);
  const base = y + 44 * s + fs * 0.98 + Math.max(0, (h - 64 * s - fs * 1.05) * 0.45);
  const slotW = fs * 0.5;
  const colW = fs * 0.24;
  const tw0 = cdW('T−', sym, 'cond') * 1.08;
  const x0 = x + 20 * s;
  const dx = x0 + tw0 + 6 * s;
  const chars = (hours ? `${P.hh}:${String(Number(P.mm) % 60).padStart(2, '0')}:${P.ss}` : `${P.mm}:${P.ss}`).split('');
  let cxp = dx;
  const digitEls = chars.map((ch, i) => {
    const sw = ch === ':' ? colW : slotW;
    const el = (
      <text key={i} x={cxp + sw / 2} y={base + drop} fontFamily={la2Fonts.barlowCond} fontWeight={600} fontSize={fs} fill={ink} textAnchor="middle">
        {ch}
      </text>
    );
    cxp += sw;
    return el;
  });
  const n = 10;
  const bw = (w - 40 * s - (n - 1) * 4 * s) / n;
  const by = Math.min(base + 20 * s, y + h - 12 * s);
  // control strip
  const segFs = 14 * s;
  const segWs = segments.map((l) => cdW(l, segFs, 'sans') + 18 * s);
  const segTotal = segWs.reduce((a, b) => a + b + 4 * s, 0) - 4 * s;
  let sx = x + w - 20 * s - segTotal;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={base - fs * 0.95} width={w} height={fs * 1.05} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={inv ? accent : fill} />
      {flash > 0.01 && <rect x={x} y={y} width={w} height={h} fill="#FFFFFF" opacity={flash * 0.8} />}
      {border && <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} fill="none" stroke={inv ? accent : CD.line} strokeWidth={1} />}
      <text x={x + 20 * s} y={y + 30 * s} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={14 * s} fill={dim} letterSpacing={1.5 * s}>
        {inv ? header[1] : header[0]}
      </text>
      {segments.map((l, i) => {
        const act = i === activeSeg;
        const bx = sx;
        sx += segWs[i] + 4 * s;
        return (
          <g key={i}>
            <rect x={bx} y={y + 12 * s} width={act ? segWs[i] * clamp01(segK) : segWs[i]} height={26 * s} fill={act ? (inv ? CD.dark : accent) : inv ? 'rgba(10,11,12,0.12)' : 'rgba(255,255,255,0.06)'} />
            <text x={bx + 9 * s} y={y + 30 * s} fontFamily={la2Fonts.barlow} fontWeight={700} fontSize={segFs} fill={act ? (inv ? accent : CD.dark) : dim}>
              {l}
            </text>
          </g>
        );
      })}
      {handFlash > 0.01 && <rect x={x} y={y} width={w} height={h} fill="#FFF8EC" opacity={0.35 * handFlash} />}
      <text x={x0} y={base} fontFamily={la2Fonts.barlowCond} fontWeight={600} fontSize={sym} fill={acc}>
        {P.neg ? 'T−' : 'T+'}
      </text>
      <g clipPath={`url(#${id})`}>{digitEls}</g>
      <text x={cxp + 6 * s} y={base} fontFamily={la2Fonts.barlowCond} fontWeight={500} fontSize={fs * 0.41} fill={dim}>
        .{P.tenth}
      </text>
      {Array.from({length: n}, (_, i) => {
        const on = P.neg ? i < Math.ceil((1 - P.sub) * 10 - 1e-6) : i < Math.floor(P.sub * 10) + 1;
        return <rect key={i} x={x + 20 * s + i * (bw + 4 * s)} y={by} width={bw} height={6 * s} fill={on ? acc : inv ? 'rgba(10,11,12,0.18)' : 'rgba(255,255,255,0.10)'} />;
      })}
    </g>
  );
};

// ---- dataviz (pencil on cream chart paper) ----------------------------------------------------------------
export const DV = {paper: '#F6F3EC', dot: '#E4DDCF', ink: '#2B2723', inkSoft: '#6E665C', rule: '#DDD6C9', zero: '#BDB4A5', blue: '#2F5D8A', red: '#A8283A', graphite: '#3A3733', wood: '#E3C79C', spark: '#D97757'};
/** diverging warming-stripes ramp (ColorBrewer RdBu), u = (v − centre)/half */
export const DV_RAMP: [number, string][] = [
  [-1, '#2166AC'],
  [-0.72, '#4393C3'],
  [-0.45, '#92C5DE'],
  [-0.2, '#D1E5F0'],
  [0, '#F2EEE8'],
  [0.2, '#FDDBC7'],
  [0.45, '#F4A582'],
  [0.72, '#D6604D'],
  [1, '#B2182B'],
  [1.4, '#7A0F1E'],
];
export const rampHex = (u: number, ramp: [number, string][] = DV_RAMP) => {
  if (u <= ramp[0][0]) return ramp[0][1];
  for (let i = 0; i < ramp.length - 1; i++) {
    const [a, ca] = ramp[i];
    const [b, cb] = ramp[i + 1];
    if (u <= b) return mixHex(ca, cb, (u - a) / (b - a));
  }
  return ramp[ramp.length - 1][1];
};

/** cream chart paper with fibre tooth and a faint dot grid (engine.js drawPaper) */
export const DvPaper: FCA<{w: number; h: number; u: number; color?: string; dots?: number; pitch?: number; ox?: number; oy?: number}> = ({w, h, u, color = DV.paper, dots = 1, pitch = 24, ox = 0, oy = 0}) => {
  const id = useIdA('dvp');
  const p = pitch * u;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <defs>
        <pattern id={`${id}d`} width={p} height={p} patternUnits="userSpaceOnUse" x={ox % p} y={oy % p}>
          <rect x={p / 2 - 1.3 * u} y={p / 2 - 1.3 * u} width={2.6 * u} height={2.6 * u} fill={DV.dot} />
        </pattern>
        <filter id={`${id}f`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={3} seed={7} result="lo" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={3} result="hi" />
          <feComposite in="lo" in2="hi" operator="arithmetic" k1={0} k2={0.6} k3={0.4} k4={0} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.47  0 0 0 0 0.39  0 0 0 0 0.27  0 0 0 -1.2 0.66" />
        </filter>
      </defs>
      <rect width={w} height={h} fill={color} />
      <rect width={w} height={h} filter={`url(#${id}f)`} opacity={0.5} />
      {dots > 0 && <rect width={w} height={h} fill={`url(#${id}d)`} opacity={dots} />}
    </svg>
  );
};

export type PtA = [number, number];
/** resample a polyline every `step` px (engine.js resample) */
export const resampleA = (pts: PtA[], step = 3) => {
  const out: PtA[] = [pts[0]];
  const len = [0];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.ceil(d / step));
    for (let k = 1; k <= n; k++) {
      acc += d / n;
      out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
      len.push(acc);
    }
  }
  return {pts: out, len, total: acc};
};
/**
 * pencil stroke geometry (engine.js pencilStroke): resample, low-frequency wobble along the normal, cut by arc
 * length at `progress`. Returns the path d and the tip.
 */
export const pencilGeom = (pts: PtA[], o: {progress?: number; seed?: number; wobble?: number; width?: number; step?: number; offset?: number} = {}) => {
  const {progress = 1, seed = 1, wobble = 0.6, width = 2, step = 2.5, offset = 0} = o;
  if (pts.length < 2 || progress <= 0) return {d: '', tip: pts[0] ?? ([0, 0] as PtA), total: 0};
  const R = resampleA(pts, step);
  const n = R.pts.length;
  const end = R.total * clamp01(progress);
  const out: PtA[] = [];
  for (let i = 0; i < n; i++) {
    const a = R.pts[Math.max(0, i - 1)];
    const b = R.pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const wv = noiseA('pen' + seed, R.len[i] * 0.02, seed * 13.1) * wobble * width + offset;
    const p: PtA = [R.pts[i][0] - (dy / l) * wv, R.pts[i][1] + (dx / l) * wv];
    if (R.len[i] > end) {
      const q = out[out.length - 1];
      const k = (end - R.len[i - 1]) / Math.max(1e-6, R.len[i] - R.len[i - 1]);
      out.push([q[0] + (p[0] - q[0]) * k, q[1] + (p[1] - q[1]) * k]);
      break;
    }
    out.push(p);
  }
  return {d: polyD(out), tip: out[out.length - 1], total: R.total};
};
/** two-pass graphite stroke (core + offset lighter pass) */
export const PencilLine: FCA<{pts: PtA[]; progress?: number; color?: string; width: number; seed?: number; wobble?: number; alpha?: number; dash?: string}> = ({pts, progress = 1, color = DV.graphite, width, seed = 1, wobble = 0.6, alpha = 0.92, dash}) => {
  const a = pencilGeom(pts, {progress, seed, wobble, width});
  const b = pencilGeom(pts, {progress, seed: seed + 5, wobble, width, offset: width * 0.3});
  if (!a.d) return null;
  return (
    <g opacity={alpha} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d={a.d} strokeWidth={width} strokeDasharray={dash} />
      <path d={b.d} strokeWidth={width * 0.6} opacity={0.4} strokeDasharray={dash} />
    </g>
  );
};
export const quadPts = (a: PtA, c: PtA, b: PtA, n = 24): PtA[] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    const v = 1 - t;
    return [v * v * a[0] + 2 * v * t * c[0] + t * t * b[0], v * v * a[1] + 2 * v * t * c[1] + t * t * b[1]];
  });
/** curved leader from a to b with bend perpendicular to the chord */
export const leaderPts = (a: PtA, b: PtA, bend = 0.22) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return quadPts(a, [mx - dy * bend, my + dx * bend], b);
};
/** un-closed hand-drawn ring (engine.js ringPath) */
export const ringPts = (x: number, y: number, r: number, seed = 1, turns = 1.12, a0 = -2.2): PtA[] =>
  Array.from({length: 49}, (_, i) => {
    const t = i / 48;
    const a = a0 + t * turns * TAU;
    const rr = r * (1 + 0.08 * Math.sin(t * 5 + seed) + t * 0.06);
    return [x + Math.cos(a) * rr * 1.08, y + Math.sin(a) * rr];
  });

/** data dot with landing pop (×1.55) and ripple (engine.js dataDot); fresh = seconds since landing */
export const DataDot: FCA<{x: number; y: number; r: number; fill: string; fresh?: number; ring?: string; ringW?: number; alpha?: number; ripple?: boolean}> = ({x, y, r, fill, fresh = 9, ring = DV.ink, ringW = 1.5, alpha = 1, ripple = true}) => {
  if (fresh < 0) return null;
  const pop = fresh < 0.25 ? 1 + 0.55 * Math.sin(clamp01(fresh / 0.25) * Math.PI) * (1 - (fresh / 0.25) * 0.4) : 1;
  const k = fresh / 0.6;
  return (
    <g opacity={alpha}>
      {ripple && fresh < 0.6 && <circle cx={x} cy={y} r={r * (1.2 + k * 2.4)} fill="none" stroke={fill} strokeWidth={1.2} opacity={(1 - k) * 0.55} />}
      <circle cx={x} cy={y} r={r * pop} fill={fill} stroke={ring} strokeWidth={ringW} />
    </g>
  );
};

/** red–blue hex pencil prop (engine.js pencilBody), tip at (x,y), body extending along `ang` (rad) */
export const PencilProp: FCA<{x: number; y: number; s: number; ang?: number; lift?: number; end?: 'blue' | 'red'; alpha?: number}> = ({x, y, s, ang = 0.62, lift = 0, end = 'red', alpha = 1}) => {
  const Lg = 16;
  const Lw = 58;
  const Wd = 24;
  const len = 1400;
  const cA = end === 'red' ? DV.red : DV.blue;
  const cB = end === 'red' ? DV.blue : DV.red;
  const lz = 1 + lift * 0.35;
  const sh = (3 + lift * 70) * s;
  const scal: string[] = [];
  for (let i = 0; i <= 6; i++) scal.push(`${Lg + Lw + (i % 2 ? 5 : 0)} ${-Wd / 2 + (Wd * i) / 6}`);
  const body = (fillOverride?: string) => (
    <>
      <rect x={Lg + Lw - 2} y={-Wd / 2} width={len * 0.5} height={Wd} fill={fillOverride ?? cA} />
      <rect x={Lg + Lw - 2 + len * 0.5} y={-Wd / 2} width={len * 0.5} height={Wd} fill={fillOverride ?? cB} />
      {!fillOverride && <rect x={Lg + Lw - 2} y={-Wd / 2 + 3} width={len} height={5} fill="rgba(255,255,255,.18)" />}
      {!fillOverride && <rect x={Lg + Lw - 2} y={Wd / 2 - 6} width={len} height={6} fill="rgba(0,0,0,.16)" />}
      <path d={`M${Lg * 0.9} -3.2 L${Lg + Lw} ${-Wd / 2} L${scal.join(' L')} L${Lg * 0.9} 3.2 Z`} fill={fillOverride ?? DV.wood} />
      {!fillOverride && <path d={`M${Lg * 0.9} 1 L${Lg + Lw} ${Wd / 2 - 2} L${Lg + Lw} ${Wd / 2} L${Lg * 0.9} 3.2 Z`} fill="rgba(150,110,60,.25)" />}
      <path d={`M0 0 L${Lg} -3.6 L${Lg} 3.6 Z`} fill={fillOverride ?? (end === 'red' ? '#8E2232' : '#274E75')} />
    </>
  );
  const deg = (ang * 180) / Math.PI;
  return (
    <g opacity={alpha}>
      <g transform={`translate(${x + sh * 0.8} ${y + sh * 1.1}) rotate(${deg}) scale(${s * lz})`} opacity={0.2 - lift * 0.08} style={{filter: `blur(${(2 + lift * 16) * s}px)`}}>
        {body('rgb(70,50,30)')}
      </g>
      <g transform={`translate(${x} ${y}) rotate(${deg}) scale(${s * lz})`}>{body()}</g>
    </g>
  );
};

// ---- halftone dossier ---------------------------------------------------------------------------------------
export const HD = {paper: '#F4ECDD', navy: '#1D2340', blue: '#2E55D6', pink: '#FF5A87', yellow: '#FFC628', orange: '#F58A34', ored: '#D9621E', cream: '#FFF4E2', red: '#E8384F', mint: '#56C29E', paleP: '#FFD3DF'};
/** rotated Ben-Day lattice as one path (index.html halftone): r = f(x,y)·step·maxK, dots with f < .05 skipped */
export const halftoneD = (o: {x0?: number; y0?: number; w: number; h: number; step: number; angle?: number; maxK?: number; f: (x: number, y: number) => number}) => {
  const {x0 = 0, y0 = 0, w, h, step, angle = 15, maxK = 0.62, f} = o;
  const a = (angle * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const n = Math.ceil(Math.hypot(w, h) / step / 2) + 2;
  let d = '';
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const uu = i * step;
      const vv = j * step;
      const x = x0 + w / 2 + uu * ca - vv * sa;
      const y = y0 + h / 2 + uu * sa + vv * ca;
      if (x < x0 - step || x > x0 + w + step || y < y0 - step || y > y0 + h + step) continue;
      const s = clamp01(f(x, y));
      if (s < 0.05) continue;
      const r = s * step * maxK;
      d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
    }
  return d;
};
export const htRadial = (cx: number, cy: number, R: number, pw = 1.2) => (x: number, y: number) => Math.pow(clamp01(1 - Math.hypot(x - cx, y - cy) / R), pw);

/** archive paper: mottling + fine noise + warm vignette + centre fold + dust specks re-seeded every 2 frames; multiply it over everything */
export const DossierPaper: FCA<{w: number; h: number; frame: number; u: number; fold?: boolean; dust?: boolean}> = ({w, h, frame, u, fold = true, dust = true}) => {
  const id = useIdA('dpap');
  const ds = Math.floor(frame / 2);
  const specks: RNA[] = [];
  if (dust) {
    const n = Math.round(160 * ((w * h) / (1920 * 1080)));
    for (let i = 0; i < n; i++) {
      const x = h01(i, ds, 3) * w;
      const y = h01(i, ds, 4) * h;
      const r = (0.6 + h01(i, ds, 5) * 1.8) * u;
      specks.push(<circle key={i} cx={x} cy={y} r={r} fill={i % 6 === 0 ? HD.navy : '#FFFBF2'} opacity={i % 6 === 0 ? 0.35 : 0.75} />);
    }
  }
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <filter id={`${id}m`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={2} seed={3} result="lo" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={5} result="hi" />
          <feComposite in="lo" in2="hi" operator="arithmetic" k1={0} k2={0.7} k3={0.3} k4={0} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 -1.1 0.62" />
        </filter>
        <radialGradient id={`${id}v`} cx="50%" cy="50%" r="70%">
          <stop offset="0.45" stopColor="rgb(120,100,80)" stopOpacity={0} />
          <stop offset="1" stopColor="rgb(120,100,80)" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      <rect width={w} height={h} filter={`url(#${id}m)`} opacity={0.55} style={{mixBlendMode: 'multiply'}} />
      <rect width={w} height={h} fill={`url(#${id}v)`} style={{mixBlendMode: 'multiply'}} />
      {fold && <line x1={w / 2} y1={0} x2={w / 2 + 2} y2={h} stroke="rgba(140,120,100,0.18)" strokeWidth={3 * u} />}
      {specks}
    </svg>
  );
};

/** line-boil (re-seeded every `every` frames), ink-grain and rough stamp-ink filters with ids `${id}-boil|ink|stamp` */
export const DossierFilters: FCA<{id: string; frame: number; every?: number}> = ({id, frame, every = 3}) => {
  const seed = (Math.floor(frame / every) % 40) + 1;
  return (
    <defs>
      <filter id={`${id}-boil`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={seed} result="w" />
        <feDisplacementMap in="SourceGraphic" in2="w" scale={5} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={4} result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -22 15.2" result="gm" />
        <feComposite in="d" in2="gm" operator="in" />
      </filter>
      <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={9} result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -22 15.4" result="gm" />
        <feComposite in="SourceGraphic" in2="gm" operator="in" />
      </filter>
      <filter id={`${id}-stamp`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={3} seed={11} result="w" />
        <feDisplacementMap in="SourceGraphic" in2="w" scale={7} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={3} seed={21} result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -9 5.9" result="gm" />
        <feComposite in="d" in2="gm" operator="in" />
      </filter>
    </defs>
  );
};
/** measure a text run with a canvas at render time (fonts are loaded before frames render); falls back to an estimate */
let measureCanvasA: HTMLCanvasElement | null = null;
export const measureA = (text: string, size: number, family: string, weight: number | string = 400, perEm = 0.6) => {
  try {
    if (typeof document === 'undefined') return [...text].length * size * perEm;
    if (!measureCanvasA) measureCanvasA = document.createElement('canvas');
    const g = measureCanvasA.getContext('2d');
    if (!g) return [...text].length * size * perEm;
    g.font = `${weight} ${size}px ${family}`;
    return g.measureText(text).width;
  } catch {
    return [...text].length * size * perEm;
  }
};
/** damped squash for landings: sq = 1 − k·e^(−7a)·cos(21a) (a in seconds) */
export const squashA = (a: number, k = 0.25) => (a < 0 ? 1 : 1 - k * Math.exp(-7 * a) * Math.cos(21 * a));

// ==== /A =====================================================================================================

// ==== B: crayon-book / dark-keynote / engraving / game-show / comet ==========================================
// Adapted from lemo-opuscar styles/crayon-book/demo/crayon.js + gl.js, styles/engraving/demo/engine/burin.js,
// styles/dark-keynote/demo/engine.js, styles/game-show/demo/main_v1.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import type * as RB from 'react';

export type BPt = [number, number];

/** sin-hash as in the sources (0..1) */
export const shash = (a: number, b = 0) => {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
/** 1D value noise 0..1 */
export const vnoise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return shash(i, seed) * (1 - u) + shash(i + 1, seed) * u;
};
/** mulberry-style PRNG */
export const bRng = (seed = 1) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const fx = (v: number) => (Math.round(v * 10) / 10).toString();

// ---------------------------------------------------------------- geometry
export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, n = 48, rot = 0, a0 = 0, a1 = Math.PI * 2): BPt[] => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const out: BPt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
};
/** hand-drawn circle: lopsided, start/end overshoot */
export const handCircle = (cx: number, cy: number, r: number, seed = 1, over = 0.12, n = 56): BPt[] => {
  const out: BPt[] = [];
  const a0 = shash(seed) * 6.28;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = a0 + u * Math.PI * 2 * (1 + over);
    const rr = r * (1 + 0.035 * Math.sin(a * 2 + seed) + (u > 1 - over ? (0.04 * (u - (1 - over))) / over : 0));
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return out;
};
/** Catmull-Rom smoothing of control points */
export const smoothPts = (pts: BPt[], n = 8, closed = true): BPt[] => {
  const out: BPt[] = [];
  const m = pts.length;
  const N = closed ? m : m - 1;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + m) % m];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % m];
    const p3 = pts[(i + 2) % m];
    const P0 = closed || i > 0 ? p0 : p1;
    const P3 = closed || i + 2 < m ? p3 : p2;
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-P0[0] + p2[0]) * t + (2 * P0[0] - 5 * p1[0] + 4 * p2[0] - P3[0]) * t2 + (-P0[0] + 3 * p1[0] - 3 * p2[0] + P3[0]) * t3),
        0.5 * (2 * p1[1] + (-P0[1] + p2[1]) * t + (2 * P0[1] - 5 * p1[1] + 4 * p2[1] - P3[1]) * t2 + (-P0[1] + 3 * p1[1] - 3 * p2[1] + P3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(pts[m - 1]);
  else out.push(out[0]);
  return out;
};
export const xfPts = (pts: BPt[], x = 0, y = 0, s = 1, r = 0): BPt[] => {
  const c = Math.cos(r);
  const sn = Math.sin(r);
  return pts.map(([px, py]) => [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s]);
};
export const ptsD = (pts: BPt[], closed = false) =>
  pts.length ? 'M' + pts.map(([x, y]) => fx(x) + ' ' + fx(y)).join('L') + (closed ? 'Z' : '') : '';

// ---------------------------------------------------------------- crayon (crayon-book)
export const CRAYON = {
  paper: '#F4EFE3',
  ink: '#2D3263',
  yellow: '#F5C63C',
  orange: '#EC8A3C',
  red: '#D4483C',
  pink: '#EE8EA4',
  peach: '#F4C7A4',
  brown: '#7A4B31',
  ochre: '#E7B867',
  green: '#62A24C',
  sky: '#79ACD9',
  violet: '#6A5AA6',
  white: '#FBFAF4',
  wash: '#26306F',
};
/** boil step at 12 drawings per second (crayon-book "everything drawn steps at 12 fps") */
export const boilStep = (frame: number, fps = 12) => Math.floor((frame * fps) / 30);

const resampleOpen = (pts: BPt[], step: number, closed = false) => {
  const q = closed ? [...pts, pts[0]] : pts;
  const out: BPt[] = [[q[0][0], q[0][1]]];
  const L = [0];
  let acc = 0;
  let total = 0;
  for (let i = 1; i < q.length; i++) {
    const [ax, ay] = q[i - 1];
    const [bx, by] = q[i];
    const d = Math.hypot(bx - ax, by - ay);
    if (d < 1e-6) continue;
    let pos = step - acc;
    while (pos <= d) {
      const u = pos / d;
      out.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
      total += step;
      L.push(total);
      pos += step;
    }
    acc = d - (pos - step);
  }
  const last = q[q.length - 1];
  const lp = out[out.length - 1];
  const rem = Math.hypot(last[0] - lp[0], last[1] - lp[1]);
  if (rem > 0.3) {
    out.push([last[0], last[1]]);
    total += rem;
    L.push(total);
  }
  return {p: out, L, total};
};

export type CrayonLineOpts = {w?: number; p?: number; seed?: number; wob?: number; boil?: number; taper?: number; draw?: number; streak?: number; closed?: boolean};
/** crayon line → ribbon (band + core) polygons + streak polylines, port of crayon.js line() */
export const crayonLine = (pts: BPt[], o: CrayonLineOpts, step: number) => {
  const w = o.w ?? 6;
  const seed = o.seed ?? 1;
  const wob = o.wob ?? 1;
  const ba = o.boil ?? 1;
  const draw = o.draw ?? 1;
  const res = {band: '', core: '', streaks: [] as string[], w, tip: null as BPt | null};
  if (draw <= 0 || pts.length < 2) return res;
  const R = resampleOpen(pts, 3, o.closed);
  const n = R.p.length;
  if (n < 2) return res;
  const lim = R.total * draw;
  const n1 = (sd: number, x: number) => vnoise1(x + sd * 17.31) * 2 - 1;
  const jx = (shash(seed * 3.1 + step * 7.7) - 0.5) * 1.6 * ba;
  const jy = (shash(seed * 5.3 + step * 3.9) - 0.5) * 1.6 * ba;
  const P: [number, number, number, number][] = [];
  const Wd: number[] = [];
  const taper = o.taper ?? 0.25;
  const tl = Math.min(R.total * taper, 28);
  for (let i = 0; i < n; i++) {
    const s = R.L[i];
    if (s > lim) break;
    const a = R.p[Math.max(0, i - 1)];
    const b = R.p[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tn = Math.hypot(tx, ty) || 1;
    tx /= tn;
    ty /= tn;
    const off = n1(seed, s / 85) * 1.7 * wob + n1(seed + step * 1.37 + 11, s / 38) * 0.9 * ba;
    P.push([R.p[i][0] - ty * off + jx, R.p[i][1] + tx * off + jy, -ty, tx]);
    const e0 = o.closed ? 1 : Math.min(1, s / (tl + 1e-3));
    const e1 = o.closed ? 1 : Math.min(1, (Math.min(lim, R.total) - s) / (tl + 1e-3));
    Wd.push(w * (0.82 + 0.3 * n1(seed + 3, s / 55)) * (0.45 + 0.55 * Math.max(0, Math.min(e0, e1))));
  }
  if (P.length < 2) return res;
  const ribbon = (k: number) => {
    let d = '';
    for (let i = 0; i < P.length; i++) {
      const q = P[i];
      const dd = Wd[i] * 0.5 * k;
      d += (i ? 'L' : 'M') + fx(q[0] + q[2] * dd) + ' ' + fx(q[1] + q[3] * dd);
    }
    for (let i = P.length - 1; i >= 0; i--) {
      const q = P[i];
      const dd = Wd[i] * 0.5 * k;
      d += 'L' + fx(q[0] - q[2] * dd) + ' ' + fx(q[1] - q[3] * dd);
    }
    return d + 'Z';
  };
  res.band = ribbon(1);
  res.core = ribbon(0.5);
  const ns = o.streak ?? 2;
  for (let k = 0; k < ns; k++) {
    const side = (shash(seed + k * 9.1) - 0.5) * 0.9;
    let d = '';
    for (let i = 0; i < P.length; i++) {
      const q = P[i];
      const dd = side * Wd[i];
      d += (i ? 'L' : 'M') + fx(q[0] + q[2] * dd) + ' ' + fx(q[1] + q[3] * dd);
    }
    res.streaks.push(d);
  }
  const last = P[P.length - 1];
  res.tip = [last[0], last[1]];
  return res;
};

/** one crayon line as SVG (pressure lives in alpha; wrap in a group with the CrayonFilter) */
export const CrayonLine: RB.FC<{pts: BPt[]; color: string; step: number} & CrayonLineOpts> = ({pts, color, step, ...o}) => {
  const L = crayonLine(pts, o, step);
  if (!L.band) return null;
  const p = o.p ?? 0.8;
  return (
    <g>
      <path d={L.band} fill={color} fillOpacity={p * 0.5} />
      <path d={L.core} fill={color} fillOpacity={p * 0.34} />
      {L.streaks.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={Math.max(1, L.w * 0.22)} strokeOpacity={p * 0.3} strokeLinecap="round" />
      ))}
    </g>
  );
};

export type HatchSeg = {x1: number; y1: number; x2: number; y2: number; pr: number};
export type CrayonFillOpts = {p?: number; ang?: number; gap?: number; w?: number; over?: number; seed?: number; draw?: number; boil?: number};
/** zig-zag crayon hatch fill of a polygon (port of crayon.js fill()) → segments with per-pass pressure */
export const crayonFill = (poly: BPt[], o: CrayonFillOpts, step: number): {segs: HatchSeg[]; tip: BPt | null} => {
  const p = o.p ?? 0.62;
  const seed = o.seed ?? 1;
  const ba = o.boil ?? 1;
  const ang = (o.ang ?? 0.62) + (shash(seed + step * 1.9) - 0.5) * 0.035 * ba;
  const gap = o.gap ?? 10.5;
  const over = o.over ?? 7;
  const draw = o.draw ?? 1;
  if (draw <= 0 || poly.length < 3) return {segs: [], tip: null};
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const rp = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca] as BPt);
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const q of rp) {
    y0 = Math.min(y0, q[1]);
    y1 = Math.max(y1, q[1]);
  }
  const rows: {y: number; spans: BPt[]; r: number}[] = [];
  let y = y0 + gap * (0.35 + 0.3 * shash(seed + step * 0.7 * ba));
  let r = 0;
  while (y < y1) {
    const xs: number[] = [];
    for (let i = 0; i < rp.length; i++) {
      const a = rp[i];
      const b = rp[(i + 1) % rp.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((m, n) => m - n);
    const spans: BPt[] = [];
    for (let i = 0; i + 1 < xs.length; i += 2) spans.push([xs[i], xs[i + 1]]);
    rows.push({y, spans, r});
    r++;
    y += gap * (0.8 + 0.4 * shash(seed * 1.3 + r * 3.7));
  }
  const strokes: [BPt, number, number][][] = [];
  let curS: [BPt, number, number][] | null = null;
  let prev: BPt | null = null;
  for (const row of rows) {
    if (row.spans.length !== 1) {
      curS = null;
      prev = null;
      for (const s of row.spans) strokes.push([[s, row.y, row.r]]);
      continue;
    }
    const s = row.spans[0];
    if (curS && prev && s[0] < prev[1] && s[1] > prev[0]) curS.push([s, row.y, row.r]);
    else {
      curS = [[s, row.y, row.r]];
      strokes.push(curS);
    }
    prev = s;
  }
  const paths = strokes.map((S, si) => {
    const pts: BPt[] = [];
    S.forEach(([s, yy, rr], k) => {
      const oA = over * (shash(seed + rr * 5.1 + 0.3) * 1.1 - 0.15);
      const oB = over * (shash(seed + rr * 2.3 + 0.7) * 1.1 - 0.15);
      const yj = (shash(seed + rr * 1.7 + step * 0.31 * ba) - 0.5) * gap * 0.35 * Math.max(ba, 0.3);
      const a: BPt = [s[0] - oA, yy + yj];
      const b: BPt = [s[1] + oB, yy + yj + (shash(seed + rr) - 0.5) * gap * 0.6];
      if ((k + si) % 2 === 0) pts.push(a, b);
      else pts.push(b, a);
    });
    return pts.map(([x, yy]) => [x * ca - yy * sa, x * sa + yy * ca] as BPt);
  });
  let total = 0;
  const lens = paths.map((pp) => {
    let l = 0;
    for (let i = 1; i < pp.length; i++) l += Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1]);
    total += l;
    return l;
  });
  let budget = total * draw;
  const segs: HatchSeg[] = [];
  let tip: BPt | null = null;
  for (let k = 0; k < paths.length && budget > 0; k++) {
    const pp = paths[k];
    let acc = 0;
    for (let i = 1; i < pp.length; i++) {
      const d = Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1]);
      const pr = p * (0.72 + 0.42 * shash(seed * 0.37 + k * 13.1 + i * 0.71));
      if (acc + d >= budget) {
        const uu = (budget - acc) / Math.max(1e-6, d);
        const x2 = pp[i - 1][0] + (pp[i][0] - pp[i - 1][0]) * uu;
        const y2 = pp[i - 1][1] + (pp[i][1] - pp[i - 1][1]) * uu;
        segs.push({x1: pp[i - 1][0], y1: pp[i - 1][1], x2, y2, pr});
        tip = [x2, y2];
        acc = budget + 1;
        break;
      }
      segs.push({x1: pp[i - 1][0], y1: pp[i - 1][1], x2: pp[i][0], y2: pp[i][1], pr});
      acc += d;
      tip = [pp[i][0], pp[i][1]];
    }
    budget -= lens[k];
  }
  return {segs, tip};
};

/** hatch-fill segments as SVG (each pass drawn twice: wide at .62p, narrow at .30p) */
export const CrayonFill: RB.FC<{poly: BPt[]; color: string; step: number; cross?: boolean; crossAng?: number; crossP?: number} & CrayonFillOpts> = ({
  poly,
  color,
  step,
  cross,
  crossAng = 1.25,
  crossP = 0.7,
  ...o
}) => {
  const w = o.w ?? 11;
  const passes = [crayonFill(poly, o, step)];
  if (cross) passes.push(crayonFill(poly, {...o, ang: (o.ang ?? 0.62) + crossAng, seed: (o.seed ?? 1) + 101, p: (o.p ?? 0.62) * crossP}, step));
  return (
    <g strokeLinecap="round" fill="none" stroke={color}>
      {passes.map((F, j) =>
        F.segs.map((s, i) => (
          <g key={`${j}-${i}`}>
            <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={w} strokeOpacity={s.pr * 0.62} />
            <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={w * 0.42} strokeOpacity={s.pr * 0.3} />
          </g>
        )),
      )}
    </g>
  );
};

/**
 * SVG wax-adhesion filter (port of the crayon-book gl.js layer shader): the group's alpha is the crayon
 * pressure; paper tooth = 3-octave noise + horizontal fibre grooves; coverage = smoothstep around 1 − 1.22·p.
 * `scale` = tooth scale (px of the finest octave ≈ 1.35·scale). Anchored to user space (moves with the page).
 */
export const CrayonFilter: RB.FC<{id: string; scale?: number; soft?: number; seed?: number}> = ({id, scale = 1, soft = 0.14, seed = 7}) => {
  const k = 0.5 / Math.max(0.03, soft);
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={0.42 / scale} numOctaves={3} seed={seed} result="n1" />
      <feTurbulence type="fractalNoise" baseFrequency={`${0.05 / scale} ${0.42 / scale}`} numOctaves={2} seed={seed + 4} result="n2" />
      <feComposite in="n1" in2="n2" operator="arithmetic" k2={0.78} k3={0.32} k4={-0.04} result="tooth" />
      <feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.25 0 0 0 -0.12" result="toothA" />
      <feComposite in="toothA" in2="SourceAlpha" operator="arithmetic" k2={k} k3={1.22 * k} k4={-k + 0.5} result="cover" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 7 0" result="solid" />
      <feComposite in="solid" in2="cover" operator="in" />
    </filter>
  );
};

/** warm drawing paper with an embossed tooth lit from the top-left + soft warm vignette */
export const CrayonPaper: RB.FC<{id: string; w: number; h: number; color?: string; scale?: number; emboss?: number; seed?: number}> = ({
  id,
  w,
  h,
  color = CRAYON.paper,
  scale = 1,
  emboss = 0.5,
  seed = 7,
}) => (
  <g>
    <defs>
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={0.42 / scale} numOctaves={3} seed={seed} result="n1" />
        <feTurbulence type="fractalNoise" baseFrequency={`${0.05 / scale} ${0.42 / scale}`} numOctaves={2} seed={seed + 4} result="n2" />
        <feComposite in="n1" in2="n2" operator="arithmetic" k2={0.78} k3={0.32} k4={-0.04} result="tooth" />
        <feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="toothA" />
        <feDiffuseLighting in="toothA" surfaceScale={1.3 * emboss} diffuseConstant={1.05} lightingColor="#ffffff" result="lit">
          <feDistantLight azimuth={225} elevation={48} />
        </feDiffuseLighting>
        <feComposite in="lit" in2="SourceGraphic" operator="arithmetic" k1={1.27} k4={-0.012} />
      </filter>
      <radialGradient id={`${id}-vig`} cx="50%" cy="50%" r="75%">
        <stop offset="0.55" stopColor="#7a5a30" stopOpacity={0} />
        <stop offset="1" stopColor="#5a3d1c" stopOpacity={0.28} />
      </radialGradient>
    </defs>
    <rect width={w} height={h} fill={color} filter={`url(#${id})`} />
    <rect width={w} height={h} fill={`url(#${id}-vig)`} />
  </g>
);

// ---------------------------------------------------------------- engraving (burin engine)
const pInPoly = (polys: BPt[][], x: number, y: number) => {
  let ins = false;
  for (const p of polys)
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i];
      const [xj, yj] = p[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
  return ins;
};
export const inPolys = pInPoly;
export const bboxOfPts = (polys: BPt[][], pad = 0): [number, number, number, number] => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of polys)
    for (const [x, y] of p) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
};

/** SVG path d → polylines ({pts, closed}); supports M L H V C S Q T Z (abs + rel) */
export const parsePathD = (d: string, step = 2): {pts: BPt[]; closed: boolean}[] => {
  const tok = d.match(/[MmLlHhVvCcSsQqTtZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const subs: {pts: BPt[]; closed: boolean}[] = [];
  let cur: {pts: BPt[]; closed: boolean} | null = null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cmd = '';
  let lcx = NaN;
  let lcy = 0;
  let lq: BPt | null = null;
  let i = 0;
  const num = () => +tok[i++];
  const push = (px: number, py: number) => cur && cur.pts.push([px, py]);
  const cubic = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    const L = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
    const n = Math.max(2, Math.ceil(L / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      push(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3);
    }
    lcx = x2;
    lcy = y2;
    x = x3;
    y = y3;
  };
  const quad = (x1: number, y1: number, x2: number, y2: number) => {
    const L = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(2, Math.ceil(L / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      push(u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2);
    }
    lq = [x1, y1];
    x = x2;
    y = y2;
  };
  const line = (x2: number, y2: number) => {
    const L = Math.hypot(x2 - x, y2 - y);
    const n = Math.max(1, Math.ceil(L / (step * 3)));
    for (let k = 1; k <= n; k++) push(x + ((x2 - x) * k) / n, y + ((y2 - y) * k) / n);
    x = x2;
    y = y2;
  };
  let guard = 0;
  while (i < tok.length && guard++ < 100000) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    if (C !== 'C' && C !== 'S') lcx = NaN;
    if (C !== 'Q' && C !== 'T') lq = null;
    switch (C) {
      case 'M': {
        x = num() + ox;
        y = num() + oy;
        sx = x;
        sy = y;
        cur = {pts: [[x, y]], closed: false};
        subs.push(cur);
        cmd = rel ? 'l' : 'L';
        break;
      }
      case 'L':
        line(num() + ox, num() + oy);
        break;
      case 'H':
        line(num() + ox, y);
        break;
      case 'V':
        line(x, num() + oy);
        break;
      case 'C': {
        const a = num() + ox;
        const b = num() + oy;
        const c = num() + ox;
        const dd = num() + oy;
        const e = num() + ox;
        const f = num() + oy;
        cubic(a, b, c, dd, e, f);
        break;
      }
      case 'S': {
        const a = isNaN(lcx) ? x : 2 * x - lcx;
        const b = isNaN(lcx) ? y : 2 * y - lcy;
        const c = num() + ox;
        const dd = num() + oy;
        const e = num() + ox;
        const f = num() + oy;
        cubic(a, b, c, dd, e, f);
        break;
      }
      case 'Q': {
        const a = num() + ox;
        const b = num() + oy;
        const c = num() + ox;
        const dd = num() + oy;
        quad(a, b, c, dd);
        break;
      }
      case 'T': {
        const a = lq ? 2 * x - lq[0] : x;
        const b = lq ? 2 * y - lq[1] : y;
        quad(a, b, num() + ox, num() + oy);
        break;
      }
      case 'Z': {
        if (Math.hypot(x - sx, y - sy) > 0.01) line(sx, sy);
        if (cur) {
          cur.closed = true;
          cur.pts.pop();
        }
        x = sx;
        y = sy;
        break;
      }
      default:
        i++;
    }
  }
  return subs.filter((s) => s.pts.length > 1);
};

const resampleE = (pts: BPt[], step: number): BPt[] => {
  const out: BPt[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const d = Math.hypot(bx - ax, by - ay);
    let t0 = 0;
    if (d < 1e-9) continue;
    while (acc + d * (1 - t0) >= step) {
      const need = step - acc;
      const t = t0 + need / d;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      t0 = t;
      acc = 0;
    }
    acc += d * (1 - t0);
  }
  const last = pts[pts.length - 1];
  const o = out[out.length - 1];
  if (Math.hypot(o[0] - last[0], o[1] - last[1]) > 0.5) out.push(last);
  return out;
};
const normalsE = (P: BPt[], closed: boolean): BPt[] => {
  const n = P.length;
  const N: BPt[] = [];
  for (let i = 0; i < n; i++) {
    const a = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = P[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    N.push([dy / L, -dx / L]);
  }
  return N;
};
const polyAreaE = (P: BPt[]) => {
  let s = 0;
  for (let i = 0; i < P.length; i++) {
    const [x1, y1] = P[i];
    const [x2, y2] = P[(i + 1) % P.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
};
const cl = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

export type ToneFn = ((x: number, y: number) => number) & {df?: (x: number, y: number) => number};
/** any closed shape + light → modelled tone 0 (lit) … 1 (turned away): distance-field pillow + Lambert (burin.js formTone) */
export const formTone = (polys: BPt[][], o: {light?: BPt; lz?: number; base?: number; k?: number; res?: number; rim?: number} = {}): ToneFn => {
  const {light = [-0.6, -0.7], lz = 0.55, base = 0.05, k = 1, res = 160, rim = 0.25} = o;
  const bb = bboxOfPts(polys, 2);
  const W = bb[2] - bb[0];
  const H = bb[3] - bb[1];
  const g = Math.max(W, H) / res;
  const nx = Math.ceil(W / g) + 1;
  const ny = Math.ceil(H / g) + 1;
  const D = new Float32Array(nx * ny);
  const INF = 1e9;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) D[j * nx + i] = pInPoly(polys, bb[0] + i * g, bb[1] + j * g) ? INF : 0;
  const a = 1;
  const b = 1.4142;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const id = j * nx + i;
      if (!D[id]) continue;
      let m = D[id];
      if (i > 0) m = Math.min(m, D[id - 1] + a);
      if (j > 0) m = Math.min(m, D[id - nx] + a);
      if (i > 0 && j > 0) m = Math.min(m, D[id - nx - 1] + b);
      if (i < nx - 1 && j > 0) m = Math.min(m, D[id - nx + 1] + b);
      D[id] = m;
    }
  for (let j = ny - 1; j >= 0; j--)
    for (let i = nx - 1; i >= 0; i--) {
      const id = j * nx + i;
      if (!D[id]) continue;
      let m = D[id];
      if (i < nx - 1) m = Math.min(m, D[id + 1] + a);
      if (j < ny - 1) m = Math.min(m, D[id + nx] + a);
      if (i < nx - 1 && j < ny - 1) m = Math.min(m, D[id + nx + 1] + b);
      if (i > 0 && j < ny - 1) m = Math.min(m, D[id + nx - 1] + b);
      D[id] = m;
    }
  let dmax = 0;
  for (const v of D) if (v > dmax) dmax = v;
  const R = dmax || 1;
  const Hh = new Float32Array(nx * ny);
  for (let i = 0; i < D.length; i++) {
    const u = Math.min(1, D[i] / R);
    Hh[i] = Math.sqrt(1 - (1 - u) * (1 - u)) * R;
  }
  // soften the medial-axis crease of the pillow (a few box-blur passes inside the shape)
  const tmp = new Float32Array(nx * ny);
  for (let pass = 0; pass < 5; pass++) {
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const id = j * nx + i;
        if (!D[id]) {
          tmp[id] = 0;
          continue;
        }
        let s = 0;
        let c = 0;
        for (let dj = -1; dj <= 1; dj++)
          for (let di = -1; di <= 1; di++) {
            const ii = i + di;
            const jj = j + dj;
            if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
            s += Hh[jj * nx + ii];
            c++;
          }
        tmp[id] = s / c;
      }
    Hh.set(tmp);
  }
  const Ll = Math.hypot(light[0], light[1], lz);
  const lx = light[0] / Ll;
  const ly = light[1] / Ll;
  const lzz = lz / Ll;
  const T = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const id = j * nx + i;
      if (!D[id]) continue;
      const hx = (Hh[j * nx + Math.min(nx - 1, i + 1)] - Hh[j * nx + Math.max(0, i - 1)]) / 2;
      const hy = (Hh[Math.min(ny - 1, j + 1) * nx + i] - Hh[Math.max(0, j - 1) * nx + i]) / 2;
      const L = Math.hypot(hx, hy, 1);
      const lam = cl((-hx / L) * lx + (-hy / L) * ly + (1 / L) * lzz);
      T[id] = cl(base + k * (1 - lam) * 0.95 + rim * Math.max(0, 1 - D[id] / (R * 0.18)) * 0.6);
    }
  const samp = (A: Float32Array) => (x: number, y: number) => {
    const fxx = (x - bb[0]) / g;
    const fyy = (y - bb[1]) / g;
    const i = Math.floor(fxx);
    const j = Math.floor(fyy);
    if (i < 0 || j < 0 || i >= nx - 1 || j >= ny - 1) return 0;
    const u = fxx - i;
    const v = fyy - j;
    const id = j * nx + i;
    return (A[id] * (1 - u) + A[id + 1] * u) * (1 - v) + (A[id + nx] * (1 - u) + A[id + nx + 1] * u) * v;
  };
  const f: ToneFn = samp(T);
  const dg = samp(D);
  f.df = (x, y) => dg(x, y) * g;
  return f;
};

type Stroke = {xy: Float32Array; ws: Float32Array; n: number; len: number; g: string; s0: number; s1: number};
const WB0 = 0.22;
const WBR = 1.13;
const NB = 34;
export const BUCKET_W = Array.from({length: NB}, (_, b) => WB0 * Math.pow(WBR, b));
const bucketOf = (w: number) => Math.max(0, Math.min(NB - 1, Math.round(Math.log(w / WB0) / Math.log(WBR))));

/** ordered burin strokes (variable width), scheduled in seconds, rendered as width-bucketed SVG paths */
export class Ink {
  S: Stroke[] = [];
  g = 'main';
  minW = 0.16;
  private sorted: Stroke[] | null = null;
  private chunkCache = new Map<number, Map<number, string>>();
  group(name: string) {
    this.g = name;
    return this;
  }
  add(pts: BPt[], w: number | number[]) {
    const n = pts.length;
    if (n < 2) return;
    const xy = new Float32Array(n * 2);
    const ws = new Float32Array(n);
    let len = 0;
    for (let i = 0; i < n; i++) {
      xy[2 * i] = pts[i][0];
      xy[2 * i + 1] = pts[i][1];
      ws[i] = typeof w === 'number' ? w : w[i];
      if (i) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    let any = false;
    for (let i = 0; i < n - 1; i++)
      if ((ws[i] + ws[i + 1]) * 0.5 > this.minW) {
        any = true;
        break;
      }
    if (!any) return;
    this.S.push({xy, ws, n, len, g: this.g, s0: 0, s1: 0});
    this.sorted = null;
  }
  dot(x: number, y: number, r: number) {
    this.add(
      [
        [x - r * 0.02, y],
        [x + r * 0.02, y],
      ],
      r * 2,
    );
  }
  /** cutting windows for a group inside [t0, t1] (s), time ∝ cumulative length, `conc` lines at once */
  schedule(group: string | string[], t0: number, t1: number, conc = 6, minDur = 0.06) {
    const gs = Array.isArray(group) ? group : [group];
    const L = this.S.filter((s) => gs.includes(s.g));
    const tot = L.reduce((a, s) => a + s.len, 0) || 1;
    const T = t1 - t0;
    const v = tot / (T * conc);
    let acc = 0;
    for (const s of L) {
      const d = Math.min(T, Math.max(minDur, s.len / v));
      let st = t0 + (acc / tot) * T;
      const en = Math.min(t1, st + d);
      if (en - st < minDur) st = en - minDur;
      s.s0 = st;
      s.s1 = en;
      acc += s.len;
    }
    this.sorted = null;
    this.chunkCache.clear();
    return this;
  }
  span(group: string): [number, number] {
    let a = Infinity;
    let b = -Infinity;
    for (const s of this.S)
      if (s.g === group) {
        a = Math.min(a, s.s0);
        b = Math.max(b, s.s1);
      }
    return [a, b];
  }
  private runs(s: Stroke, f: number, per: Map<number, string>) {
    const {xy, ws} = s;
    const last = Math.min(s.n - 1, f);
    let rb = -1;
    for (let i = 0; i < last; i++) {
      const sg = Math.min(1, last - i);
      if (sg <= 0) break;
      const w = (ws[i] + ws[i + 1]) * 0.5;
      if (!(w > this.minW)) {
        rb = -1;
        continue;
      }
      const b = bucketOf(w);
      let str = per.get(b) ?? '';
      if (b !== rb) {
        str += 'M' + fx(xy[2 * i]) + ' ' + fx(xy[2 * i + 1]);
        rb = b;
      }
      str += 'L' + fx(xy[2 * i] + (xy[2 * i + 2] - xy[2 * i]) * sg) + ' ' + fx(xy[2 * i + 1] + (xy[2 * i + 3] - xy[2 * i + 1]) * sg);
      per.set(b, str);
    }
  }
  /** everything cut by time t (s): [[width, d]] buckets + tips being cut ([x, y, w, dirx, diry]) + cut length */
  render(t: number, filter?: (g: string) => boolean): {paths: [number, string][]; tips: number[][]} {
    if (!this.sorted) this.sorted = this.S.slice().sort((a, b) => a.s1 - b.s1);
    const S = this.sorted;
    const per = new Map<number, string>();
    const tips: number[][] = [];
    const CH = 120;
    let k = 0;
    if (!filter) {
      // whole chunks already finished → cached strings
      for (; (k + 1) * CH <= S.length && S[(k + 1) * CH - 1].s1 <= t; k++) {
        let c = this.chunkCache.get(k);
        if (!c) {
          c = new Map();
          for (let i = k * CH; i < (k + 1) * CH; i++) this.runs(S[i], S[i].n - 1, c);
          this.chunkCache.set(k, c);
        }
        for (const [b, d] of c) per.set(b, (per.get(b) ?? '') + d);
      }
    }
    for (let i = k * CH; i < S.length; i++) {
      const s = S[i];
      if (filter && !filter(s.g)) continue;
      if (s.s0 >= t) continue;
      const f = s.s1 <= t ? s.n - 1 : (s.n - 1) * cl((t - s.s0) / (s.s1 - s.s0));
      this.runs(s, f, per);
      if (s.s1 > t) {
        const j = Math.min(s.n - 2, Math.floor(f));
        const u = f - j;
        const dx = s.xy[2 * j + 2] - s.xy[2 * j];
        const dy = s.xy[2 * j + 3] - s.xy[2 * j + 1];
        const dl = Math.hypot(dx, dy) || 1;
        tips.push([s.xy[2 * j] + dx * u, s.xy[2 * j + 1] + dy * u, s.ws[j], dx / dl, dy / dl]);
      }
    }
    return {paths: [...per.entries()].sort((a, b) => a[0] - b[0]).map(([b, d]) => [BUCKET_W[b], d]), tips};
  }
}

/** ink buckets → SVG paths */
export const InkPaths: RB.FC<{paths: [number, string][]; color: string; wScale?: number; dx?: number; dy?: number; opacity?: number}> = ({paths, color, wScale = 1, dx = 0, dy = 0, opacity = 1}) => (
  <g transform={dx || dy ? `translate(${dx} ${dy})` : undefined} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
    {paths.map(([w, d], i) => (
      <path key={i} d={d} strokeWidth={w * wScale} />
    ))}
  </g>
);

export type HatchOpts = {
  angle?: number;
  spacing?: number;
  bend?: number;
  tone?: (x: number, y: number) => number;
  thr?: number;
  wMin?: number;
  wMax?: number;
  gamma?: number;
  step?: number;
  taper?: number;
  jitter?: number;
  wobble?: number;
  seed?: number;
  excl?: BPt[][] | null;
  swell?: number;
  boustro?: boolean;
};
const spansE = (E: number[], b: number) => {
  const xs: number[] = [];
  for (let k = 0; k < E.length; k += 4) {
    const B1 = E[k + 1];
    const B2 = E[k + 3];
    if (B1 <= b !== B2 <= b) xs.push(E[k] + ((b - B1) / (B2 - B1)) * (E[k + 2] - E[k]));
  }
  xs.sort((p, q) => p - q);
  return xs;
};
const subtractE = (a: number[], e: number[]) => {
  if (!e.length) return a;
  const out: number[] = [];
  for (let i = 0; i < a.length; i += 2) {
    let s = a[i];
    const f = a[i + 1];
    for (let j = 0; j < e.length; j += 2) {
      if (e[j + 1] <= s || e[j] >= f) continue;
      if (e[j] > s) out.push(s, e[j]);
      s = Math.max(s, e[j + 1]);
      if (s >= f) break;
    }
    if (s < f) out.push(s, f);
  }
  return out;
};
/** one family of parallel swelling burin lines clipped to polys (burin.js hatch) */
export const engraveHatch = (ink: Ink, polys: BPt[][], o: HatchOpts = {}) => {
  const {angle = 0, spacing = 6, bend = 0, tone = () => 0.5, thr = 0.15, wMin = 0.18, wMax = 2.0, gamma = 1, step = 3, taper = 10, jitter = 0.12, wobble = 0.35, seed = 1, excl = null, swell = 0.8} = o;
  if (!polys.length) return;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const bb = bboxOfPts(polys);
  const O: BPt = [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];
  const tr = ([x, y]: BPt): BPt => {
    const dx = x - O[0];
    const dy = y - O[1];
    const A = dx * c + dy * s;
    return [A, -dx * s + dy * c - bend * A * A];
  };
  const edges = (pl: BPt[][]) => {
    const E: number[] = [];
    for (const p of pl)
      for (let i = 0; i < p.length; i++) {
        const [a1, b1] = tr(p[i]);
        const [a2, b2] = tr(p[(i + 1) % p.length]);
        E.push(a1, b1, a2, b2);
      }
    return E;
  };
  const E = edges(polys);
  const X = excl && excl.length ? excl.map((q) => edges([q])) : null;
  let bmin = Infinity;
  let bmax = -Infinity;
  for (let k = 1; k < E.length; k += 2) {
    bmin = Math.min(bmin, E[k]);
    bmax = Math.max(bmax, E[k]);
  }
  const R = bRng(seed);
  let li = 0;
  for (let b = bmin + spacing * (0.3 + 0.5 * R()); b < bmax; b += spacing * (1 + (R() - 0.5) * jitter), li++) {
    let iv = spansE(E, b);
    if (X)
      for (const xe of X) {
        const ev = spansE(xe, b);
        if (ev.length) iv = subtractE(iv, ev);
      }
    for (let k = 0; k + 1 < iv.length; k += 2) {
      const A0 = iv[k];
      const A1 = iv[k + 1];
      const L = A1 - A0;
      if (L < 1) continue;
      const n = Math.max(2, Math.ceil(L / step));
      const pts: BPt[] = [];
      const ws: number[] = [];
      for (let j = 0; j <= n; j++) {
        const A = A0 + (L * j) / n;
        const wob = (vnoise1(A * 0.015 + li * 3.7, seed) - 0.5) * wobble * 2;
        const B = b + bend * A * A + wob;
        const x = O[0] + A * c - B * s;
        const y = O[1] + A * s + B * c;
        const v = (tone(x, y) - thr) / (1 - thr);
        let w = 0;
        if (v > 0) w = wMin + (wMax - wMin) * Math.pow(Math.min(1, v * 1.25), gamma);
        const uu = (A - A0) / L;
        const tp = Math.max(taper, L * 0.22);
        const e = Math.min(A - A0, A1 - A);
        w *= 1 - swell + swell * Math.pow(Math.sin(Math.PI * uu), 0.7);
        if (e < tp) w *= Math.pow(e / tp, 0.8);
        pts.push([x, y]);
        ws.push(w);
      }
      if (o.boustro && li % 2 === 1) ink.add(pts.reverse(), ws.reverse());
      else ink.add(pts, ws);
    }
  }
};
/** swelling outline, heavier on the side turned from the light (burin.js outline) */
export const engraveOutline = (ink: Ink, pts: BPt[], o: {w?: number; closed?: boolean; light?: BPt; vary?: number; taper?: number; seed?: number; step?: number; grain?: number; run?: number; pinch?: number} = {}) => {
  const {w = 2, closed = true, light = [-0.6, -0.8], vary = 0.8, taper = 14, seed = 3, step = 2.5, grain = 0.2, run = 110, pinch = 0.55} = o;
  const P = resampleE(closed ? [...pts, pts[0]] : pts, step);
  if (closed) P.pop();
  const n = P.length;
  if (n < 2) return;
  const N = normalsE(P, closed);
  const sg = closed ? (polyAreaE(P) > 0 ? 1 : -1) : 1;
  const Lh = Math.hypot(light[0], light[1]);
  const lx = light[0] / Lh;
  const ly = light[1] / Lh;
  const ws: number[] = [];
  for (let i = 0; i < n; i++) {
    let wi = w;
    if (closed) {
      const sh = -(N[i][0] * sg * lx + N[i][1] * sg * ly);
      wi *= 1 - vary * 0.45 + vary * 0.9 * cl(sh * 0.5 + 0.5);
    }
    wi *= 1 + (vnoise1(i * step * 0.03, seed) - 0.5) * grain * 2;
    if (closed && run) {
      const ph = (i * step) / run + vnoise1(((i * step) / run) * 0.7, seed + 5) * 0.6;
      wi *= 1 - pinch + pinch * Math.pow(Math.abs(Math.sin(Math.PI * ph)), 0.55);
    }
    if (!closed) {
      const Lt = (n - 1) * step;
      const tp = Math.max(taper, Lt * 0.3);
      const e0 = i * step;
      const e1 = (n - 1 - i) * step;
      wi *= Math.pow(Math.min(1, e0 / tp), 0.75) * Math.pow(Math.min(1, e1 / tp), 0.75) * (0.75 + 0.25 * Math.sin((Math.PI * i) / (n - 1)));
    }
    ws.push(wi);
  }
  if (closed) {
    P.push(P[0]);
    ws.push(ws[0]);
  }
  ink.add(P, ws);
};
/** stipple dots whose density follows tone */
export const engraveStipple = (ink: Ink, polys: BPt[][], o: {density?: number; tone?: (x: number, y: number) => number; r?: number; seed?: number; thr?: number} = {}) => {
  const {density = 0.02, tone = () => 0.5, r = 0.7, seed = 5, thr = 0.2} = o;
  const bb = bboxOfPts(polys);
  const R = bRng(seed);
  const n = Math.floor((bb[2] - bb[0]) * (bb[3] - bb[1]) * density);
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const x = bb[0] + R() * (bb[2] - bb[0]);
    const y = bb[1] + R() * (bb[3] - bb[1]);
    if (!pInPoly(polys, x, y)) continue;
    const t = tone(x, y);
    if (R() < (t - thr) * 1.4) pts.push([x, y, r * (0.6 + t)]);
  }
  pts.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  for (const [x, y, rr] of pts) ink.dot(x, y, rr);
};
/** the engraver's three passes over a shape: outline + hatch + cross + lozenge (engraveShape in index.js) */
export const engraveShape = (
  ink: Ink,
  polys: BPt[][],
  lines: BPt[][],
  o: {g?: string; light?: BPt; spacing?: number; wMax?: number; outlineW?: number; angle?: number; bend?: number; seed?: number; base?: number; passes?: number; excl?: BPt[][] | null; stipple?: number} = {},
) => {
  const {g = '', light = [-0.6, -0.7], spacing = 4, wMax = 1.6, outlineW = 1.8, angle = -0.6, bend = 0, seed = 1, base = 0.05, passes = 3, excl = null, stipple = 0} = o;
  const tone = formTone(polys, {light, base});
  ink.group(g + 'ol');
  polys.forEach((p, i) => engraveOutline(ink, p, {w: outlineW, light, seed: seed + i}));
  for (const l of lines) engraveOutline(ink, l, {w: outlineW * 0.8, closed: false, taper: 16, grain: 0.15});
  ink.group(g + 'h1');
  engraveHatch(ink, polys, {angle, spacing, tone, thr: 0.12, wMax, seed, bend, excl});
  if (passes >= 2) {
    ink.group(g + 'h2');
    engraveHatch(ink, polys, {angle: angle + 1.05, spacing: spacing * 1.1, tone, thr: 0.5, wMax: wMax * 0.8, seed: seed + 11, bend: -bend * 0.6, excl});
  }
  if (passes >= 3) {
    ink.group(g + 'h3');
    engraveHatch(ink, polys, {angle: angle - 0.5, spacing: spacing * 1.25, tone, thr: 0.76, wMax: wMax * 0.6, seed: seed + 23, bend: bend * 0.3, excl});
  }
  if (stipple > 0) {
    ink.group(g + 'st');
    engraveStipple(ink, polys, {density: stipple, tone, seed: seed + 5, thr: 0.25});
  }
  return tone;
};

export const ENGRAVE = {paper: '#F1E8D2', plateTone: '#E8DDC2', ink: '#1C1510', foxing: '#9A6A34', amber: '#D9962A', ochre: '#A8743E', umber: '#8A6242', blueGrey: '#A9C3CF', green: '#7E9A52', rose: '#C8674A'};

/** laid paper sheet with plate tone, pressed plate mark and ruled border (plate.js drawSheet, SVG) */
export const EngravedSheet: RB.FC<{id: string; w: number; h: number; u: number; paper?: string; margin?: number; border?: boolean; plateTone?: number}> = ({
  id,
  w,
  h,
  u,
  paper = ENGRAVE.paper,
  margin = 0.035,
  border = true,
  plateTone = 0.55,
}) => {
  const m = Math.min(w, h) * margin;
  const x0 = m;
  const y0 = m;
  const x1 = w - m;
  const y1 = h - m;
  const b = 5 * u;
  const gap = 9 * u;
  const R = bRng(53);
  const fox = Array.from({length: 46}, () => {
    let x = R() * w;
    let y = R() * h;
    if (R() < 0.7) {
      if (R() < 0.5) x = R() < 0.5 ? R() * 120 * u : w - R() * 120 * u;
      else y = R() < 0.5 ? R() * 90 * u : h - R() * 90 * u;
    }
    return [x, y, (1 + R() * 5) * u, 0.05 + R() * 0.1];
  });
  return (
    <g>
      <defs>
        <filter id={`${id}-tex`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.5} numOctaves={3} seed={3} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.31  0 0 0 0 0.19  0 0 -0.9 0 0.55" />
        </filter>
        <filter id={`${id}-cloud`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.006} numOctaves={2} seed={9} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.2  0 0 -0.6 0 0.33" />
        </filter>
        <pattern id={`${id}-laid`} width={72 * u} height={4 * u} patternUnits="userSpaceOnUse">
          <rect width={72 * u} height={0.7 * u} fill="#6b5030" opacity={0.05} />
          <rect width={0.8 * u} height={4 * u} fill="#6b5030" opacity={0.05} />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={paper} />
      <rect width={w} height={h} filter={`url(#${id}-cloud)`} opacity={0.5} />
      <rect width={w} height={h} filter={`url(#${id}-tex)`} opacity={0.18} />
      <rect width={w} height={h} fill={`url(#${id}-laid)`} />
      {fox.map(([x, y, r, a], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={ENGRAVE.foxing} opacity={a} />
      ))}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={ENGRAVE.plateTone} opacity={plateTone} />
      <path d={`M${x0 - b} ${y0 - b}L${x1 + b} ${y0 - b}L${x1} ${y0}L${x0} ${y0}L${x0} ${y1}L${x0 - b} ${y1 + b}Z`} fill="rgba(96,70,40,0.42)" />
      <path d={`M${x1 + b} ${y0 - b}L${x1 + b} ${y1 + b}L${x0 - b} ${y1 + b}L${x0} ${y1}L${x1} ${y1}L${x1} ${y0}Z`} fill="rgba(255,251,240,0.95)" />
      {border && (
        <g fill="none" stroke={ENGRAVE.ink}>
          <rect x={x0 + 26 * u} y={y0 + 26 * u} width={x1 - x0 - 52 * u} height={y1 - y0 - 52 * u} strokeWidth={2.2 * u} />
          <rect x={x0 + 26 * u + gap} y={y0 + 26 * u + gap} width={x1 - x0 - 52 * u - 2 * gap} height={y1 - y0 - 52 * u - 2 * gap} strokeWidth={0.8 * u} />
        </g>
      )}
    </g>
  );
};

/** roman capitals cut glyph by glyph (each glyph wipes in from the left) — returns per-glyph tspans opacity via clip */
export const engravedReveal = (p: number, n: number, i: number) => cl(p * (n + 2) - i - 0.5, 0, 1.5) / 1.5;

/**
 * Original neutral engraving subject: a pear with a leaf and stem, authored in a 1000-unit box (centre 500,500).
 * Returns polygons (body, leaf) + open lines (stem, leaf veins) + named parts.
 */
export const pearSubject = () => {
  const body = smoothPts(
    [
      [500, 250],
      [548, 262],
      [574, 312],
      [586, 384],
      [640, 450],
      [690, 540],
      [700, 640],
      [660, 730],
      [580, 780],
      [500, 792],
      [420, 780],
      [340, 730],
      [300, 640],
      [312, 540],
      [362, 450],
      [414, 384],
      [428, 312],
      [452, 262],
    ],
    10,
  );
  body.pop();
  const leaf = smoothPts(
    [
      [528, 214],
      [580, 168],
      [650, 140],
      [728, 138],
      [780, 152],
      [742, 196],
      [676, 234],
      [604, 246],
      [552, 236],
    ],
    10,
  );
  leaf.pop();
  const stem: BPt[] = [
    [500, 256],
    [503, 226],
    [512, 196],
    [526, 170],
    [540, 152],
  ];
  const midrib: BPt[] = [
    [540, 228],
    [600, 200],
    [670, 172],
    [760, 152],
  ];
  const veins: BPt[][] = [0.2, 0.38, 0.56, 0.74].flatMap((t, i) => {
    const x = 540 + (760 - 540) * t;
    const y = 228 + (152 - 228) * t;
    return [
      [
        [x, y],
        [x + 26 - i * 3, y - 34 + i * 4],
      ] as BPt[],
      [
        [x, y],
        [x + 22 - i * 3, y + 22 - i * 3],
      ] as BPt[],
    ];
  });
  const shadow = ellipsePts(540, 806, 230, 34, 60);
  shadow.pop();
  return {body, leaf, stem, midrib, veins, shadow};
};

// ---------------------------------------------------------------- dark keynote UI kit (SVG)
export const KEY = {
  bg0: '#0A0B0F',
  bg1: '#151822',
  surf: '#12151C',
  surf2: '#1A1E28',
  surf3: '#222734',
  text: '#E8EAF0',
  dim: '#8A90A0',
  mute: '#5C6272',
  accent: '#B7F34A',
  red: '#FF5A5F',
  cool: '#3B4CCA',
};
const APP_ICONS = [
  {c: '#5B7CFA', g: 'bubble'},
  {c: '#8C6CF0', g: 'cal'},
  {c: '#2FB6A6', g: 'bell'},
  {c: '#E0A33A', g: 'star'},
  {c: '#4C9BE8', g: 'mail'},
  {c: '#D0668A', g: 'heart'},
  {c: '#6E7890', g: 'gear'},
];
export const APP_COLORS = APP_ICONS.map((a) => a.c);
const kmix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16);
  const B = parseInt(b.slice(1), 16);
  const c = (s: number) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};
/** near-black stage: radial lift, cool glow top-right, 48 px hairline grid, vignette */
export const KeynoteStage: RB.FC<{id: string; w: number; h: number; u: number; grid?: number; glow?: number; ox?: number; oy?: number; scale?: number}> = ({id, w, h, u, grid = 1, glow = 1, ox = 0, oy = 0, scale = 1}) => {
  const step = 48 * u * scale;
  const minor: string[] = [];
  const major: string[] = [];
  if (grid > 0 && step > 4) {
    const cx = w / 2 + ox;
    const cy = h / 2 + oy;
    const i0 = Math.floor(-cx / step);
    const i1 = Math.ceil((w - cx) / step);
    const j0 = Math.floor(-cy / step);
    const j1 = Math.ceil((h - cy) / step);
    for (let i = i0; i <= i1; i++) {
      const x = Math.round(cx + i * step) + 0.5;
      (i % 4 === 0 ? major : minor).push(`M${x} 0V${h}`);
    }
    for (let j = j0; j <= j1; j++) {
      const y = Math.round(cy + j * step) + 0.5;
      (j % 4 === 0 ? major : minor).push(`M0 ${y}H${w}`);
    }
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-lift`} cx={0.5} cy={0.34} r={0.75} gradientTransform={`translate(0.5 0.34) scale(1 ${w / h}) translate(-0.5 -0.34)`}>
          <stop offset="0" stopColor={KEY.bg1} stopOpacity={0.95} />
          <stop offset="1" stopColor={KEY.bg0} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-cool`}>
          <stop offset="0" stopColor={KEY.cool} stopOpacity={0.08 * glow} />
          <stop offset="0.45" stopColor={KEY.cool} stopOpacity={0.028 * glow} />
          <stop offset="1" stopColor={KEY.cool} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-vig`} cx={0.5} cy={0.5} r={0.75}>
          <stop offset="0.45" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={KEY.bg0} />
      <rect width={w} height={h} fill={`url(#${id}-lift)`} />
      <circle cx={w * 0.78} cy={h * 0.12} r={900 * u} fill={`url(#${id}-cool)`} />
      {grid > 0 && (
        <g fill="none" strokeWidth={1}>
          <path d={minor.join('')} stroke={`rgba(255,255,255,${0.032 * grid})`} />
          <path d={major.join('')} stroke={`rgba(255,255,255,${0.06 * grid})`} />
        </g>
      )}
      <rect width={w} height={h} fill={`url(#${id}-vig)`} />
    </g>
  );
};
/** rounded app icon glyph (centre x,y, size s) */
export const KAppIcon: RB.FC<{x: number; y: number; s: number; k: number}> = ({x, y, s, k}) => {
  const a = APP_ICONS[((k % APP_ICONS.length) + APP_ICONS.length) % APP_ICONS.length];
  const u = s * 0.22;
  const cx = x;
  const cy = y;
  const wl = Math.max(1, s * 0.08);
  let glyph: RB.ReactNode = null;
  const W = 'rgba(255,255,255,.92)';
  switch (a.g) {
    case 'bubble':
      glyph = <ellipse cx={cx} cy={cy - u * 0.1} rx={u * 1.2} ry={u * 0.9} fill={W} />;
      break;
    case 'cal':
      glyph = <path d={`M${cx - u} ${cy - u * 0.8}h${2 * u}v${1.8 * u}h${-2 * u}Z M${cx - u} ${cy - u * 0.2}h${2 * u}`} fill="none" stroke={W} strokeWidth={wl} />;
      break;
    case 'bell':
      glyph = <path d={`M${cx - u} ${cy}A${u} ${u} 0 0 1 ${cx + u} ${cy}L${cx + u * 1.2} ${cy + u * 0.7}L${cx - u * 1.2} ${cy + u * 0.7}Z`} fill={W} />;
      break;
    case 'star': {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? u * 0.5 : u * 1.2;
        const an = -Math.PI / 2 + (i * Math.PI) / 5;
        d += (i ? 'L' : 'M') + fx(cx + Math.cos(an) * r) + ' ' + fx(cy + Math.sin(an) * r);
      }
      glyph = <path d={d + 'Z'} fill={W} />;
      break;
    }
    case 'mail':
      glyph = <path d={`M${cx - u * 1.2} ${cy - u * 0.8}h${2.4 * u}v${1.6 * u}h${-2.4 * u}Z M${cx - u * 1.2} ${cy - u * 0.8}L${cx} ${cy + u * 0.1}L${cx + u * 1.2} ${cy - u * 0.8}`} fill="none" stroke={W} strokeWidth={wl} strokeLinejoin="round" />;
      break;
    case 'heart':
      glyph = <path d={`M${cx} ${cy + u}C${cx - u * 2} ${cy - u * 0.2} ${cx - u * 0.6} ${cy - u * 1.5} ${cx} ${cy - u * 0.4}C${cx + u * 0.6} ${cy - u * 1.5} ${cx + u * 2} ${cy - u * 0.2} ${cx} ${cy + u}Z`} fill={W} />;
      break;
    default:
      glyph = (
        <g>
          <circle cx={cx} cy={cy} r={u} fill="none" stroke={W} strokeWidth={wl} />
          <circle cx={cx} cy={cy} r={u * 0.35} fill={W} />
        </g>
      );
  }
  return (
    <g>
      <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx={s * 0.26} fill={a.c} />
      <rect x={x - s / 2} y={y - s / 2} width={s} height={s * 0.5} rx={s * 0.26} fill="#fff" opacity={0.12} />
      {glyph}
    </g>
  );
};
/** red count badge (centre) */
export const KBadge: RB.FC<{x: number; y: number; text: string; s: number; font: string}> = ({x, y, text, s, font}) => {
  const w = Math.max(20 * s, text.length * 7.5 * s + 12 * s);
  const h = 20 * s;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={KEY.red} />
      <text x={x} y={y + 4.6 * s} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={13 * s} fill="#fff">
        {text}
      </text>
    </g>
  );
};
/** notification card (top-left x,y, size w×h) */
export const KNotif: RB.FC<{x: number; y: number; w: number; h: number; app: number; title: string; body: string; time?: string; badge?: string; font: string}> = ({
  x,
  y,
  w,
  h,
  app,
  title,
  body,
  time = 'now',
  badge,
  font,
}) => {
  const s = h * 0.46;
  const tx = x + h * 0.22 + s + h * 0.18;
  return (
    <g>
      <rect x={x + 2} y={y + h * 0.06 + 4} width={w} height={h} rx={h * 0.24} fill="rgba(0,0,0,.35)" />
      <rect x={x} y={y} width={w} height={h} rx={h * 0.24} fill={KEY.surf2} stroke="rgba(255,255,255,.08)" strokeWidth={1} />
      <path d={`M${x + h * 0.24} ${y + 1.5}H${x + w - h * 0.24}`} stroke="rgba(255,255,255,.07)" strokeWidth={1} />
      <KAppIcon x={x + h * 0.22 + s / 2} y={y + h / 2} s={s} k={app} />
      <text x={tx} y={y + h * 0.42} fontFamily={font} fontWeight={600} fontSize={h * 0.2} fill={KEY.text}>
        {title}
      </text>
      <text x={tx} y={y + h * 0.7} fontFamily={font} fontWeight={400} fontSize={h * 0.18} fill={KEY.dim}>
        {body}
      </text>
      <text x={x + w - h * 0.2} y={y + h * 0.38} textAnchor="end" fontFamily={font} fontWeight={500} fontSize={h * 0.15} fill={KEY.mute}>
        {time}
      </text>
      {badge && <KBadge x={x + h * 0.22 + s} y={y + (h - s) / 2} text={badge} s={h / 76} font={font} />}
    </g>
  );
};
/** file icon (centre x,y; at s=1 44×56 + label) */
export const KFile: RB.FC<{x: number; y: number; s: number; ext: string; tint: string; name?: string; font: string; mono: string; id: string}> = ({x, y, s, ext, tint, name, font, mono, id}) => {
  const w = 44 * s;
  const h = 56 * s;
  const x0 = x - w / 2;
  const y0 = y - h / 2 - 8 * s;
  const f = 12 * s;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9ECF3" />
          <stop offset="1" stopColor="#B9BFCC" />
        </linearGradient>
      </defs>
      <rect x={x0 + 2 * s} y={y0 + 4 * s} width={w} height={h} rx={5 * s} fill="rgba(0,0,0,.35)" />
      <path d={`M${x0 + 5 * s} ${y0}H${x0 + w - f}L${x0 + w} ${y0 + f}V${y0 + h - 5 * s}Q${x0 + w} ${y0 + h} ${x0 + w - 5 * s} ${y0 + h}H${x0 + 5 * s}Q${x0} ${y0 + h} ${x0} ${y0 + h - 5 * s}V${y0 + 5 * s}Q${x0} ${y0} ${x0 + 5 * s} ${y0}Z`} fill={`url(#${id})`} />
      <path d={`M${x0 + w - f} ${y0}V${y0 + f}H${x0 + w}Z`} fill="#9EA5B4" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x0 + 8 * s} y={y0 + (14 + i * 6) * s} width={(w - 18 * s) * (i === 2 ? 0.6 : 1)} height={2 * s} fill="rgba(40,46,60,.28)" />
      ))}
      <rect x={x0 + 5 * s} y={y0 + h - 19 * s} width={w - 10 * s} height={12 * s} rx={3 * s} fill={tint} />
      <text x={x} y={y0 + h - 10 * s} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={8 * s} fill="#fff">
        {ext}
      </text>
      {name && (
        <text x={x} y={y0 + h + 14 * s} textAnchor="middle" fontFamily={mono} fontWeight={500} fontSize={9 * s} fill={KEY.text}>
          {name.length > 16 ? name.slice(0, 15) + '…' : name}
        </text>
      )}
    </g>
  );
};
const KSKY = [
  ['#F7B267', '#F4845F', '#7D4E88'],
  ['#8EC5FC', '#A7C7E7', '#E0C3FC'],
  ['#2B3A67', '#496A81', '#F2A65A'],
  ['#9BE3DE', '#BEEBE9', '#F4DADA'],
  ['#FFD194', '#D1913C', '#5C3D2E'],
  ['#3A1C71', '#D76D77', '#FFAF7B'],
];
/** procedural landscape photo tile (top-left x,y, w×h) */
export const KPhoto: RB.FC<{x: number; y: number; w: number; h: number; seed: number; id: string}> = ({x, y, w, h, seed, id}) => {
  const R = bRng(seed * 7919 + 13);
  const sky = KSKY[Math.floor(R() * KSKY.length)];
  const r = Math.min(w, h) * 0.08;
  const sun: [number, number, number] = [x + w * (0.2 + R() * 0.6), y + h * (0.25 + R() * 0.25), h * (0.07 + R() * 0.06)];
  const ridges = [0, 1, 2].map((L) => {
    const base = y + h * (0.55 + L * 0.15);
    let d = `M${fx(x)} ${fx(y + h)}L${fx(x)} ${fx(base)}`;
    let px = x;
    while (px < x + w) {
      px += w * (0.08 + R() * 0.16);
      d += `L${fx(Math.min(px, x + w))} ${fx(base - h * R() * 0.22)}`;
    }
    d += `L${fx(x + w)} ${fx(y + h)}Z`;
    return {d, fill: `rgba(${20 + L * 8},${24 + L * 6},${40 - L * 6},${0.35 + L * 0.25})`};
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="0.6" stopColor={sky[1]} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect x={x} y={y} width={w} height={h} rx={r} />
        </clipPath>
      </defs>
      <rect x={x + 3} y={y + 6} width={w} height={h} rx={r} fill="rgba(0,0,0,.4)" />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-s)`} />
        <circle cx={sun[0]} cy={sun[1]} r={sun[2]} fill="rgba(255,250,235,.85)" />
        {ridges.map((rg, i) => (
          <path key={i} d={rg.d} fill={rg.fill} />
        ))}
      </g>
      <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} rx={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={1} />
    </g>
  );
};
export const kmixHex = kmix;

// ---------------------------------------------------------------- game-show (candy sets + beat helpers)
export const CANDY = {
  ink: '#1B1B1B',
  white: '#FFFFFF',
  cream: '#FFF6E5',
  yellow: '#FFD23F',
  orange: '#FF8C42',
  red: '#FF5A5F',
  pink: '#FF8FB1',
  green: '#5BD68A',
  lime: '#C6F16D',
  sky: '#8ED1FC',
  blue: '#4D7CFE',
  purple: '#6B4FBB',
  purpleD: '#46318F',
  teal: '#3FB8AF',
  tealD: '#2B8F88',
  navy: '#26264A',
};
/** parabolic hop per beat (−h·4f(1−f)) */
export const hopY = (tSec: number, beat: number, h: number) => {
  const f = (((tSec / beat) % 1) + 1) % 1;
  return -h * 4 * f * (1 - f);
};
/** damped hit squash 1 − amt·e^(−14Δ)cos(30Δ) for .35 s */
export const hitSq = (tSec: number, t0: number, amt = 0.2) => (tSec >= t0 && tSec < t0 + 0.35 ? 1 - amt * Math.exp(-(tSec - t0) * 14) * Math.cos((tSec - t0) * 30) : 1);
/** beat-punch camera: sum a·(1 − Δt/.16)² over active punches, capped */
export const punchSum = (tSec: number, punches: [number, number][], decay = 0.16, cap = 0.06) => {
  let s = 0;
  for (const [t0, a] of punches) {
    const d = tSec - t0;
    if (d >= 0 && d < decay) s += a * (1 - d / decay) * (1 - d / decay);
  }
  return Math.min(cap, s);
};
/** 8-point star path (r outer, r2 inner) centred at 0 */
export const starPathN = (n: number, r1: number, r2: number) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? r2 : r1;
    d += (i ? 'L' : 'M') + fx(Math.cos(a) * r) + ' ' + fx(Math.sin(a) * r);
  }
  return d + 'Z';
};
export type CandyVariant = 'stripes' | 'dots' | 'rays';
/** full-bleed candy set: same-hue lighter pattern (scrolling stripes / offset dots / rotating sunburst) */
export const CandySet: RB.FC<{w: number; h: number; u: number; variant: CandyVariant; hue: string; pattern: string; tSec: number; speed?: number; rays?: number; cx?: number; cy?: number; stripeW?: number; dotStep?: number}> = ({
  w,
  h,
  u,
  variant,
  hue,
  pattern,
  tSec,
  speed = 1,
  rays = 20,
  cx,
  cy,
  stripeW = 60,
  dotStep = 70,
}) => {
  let el: RB.ReactNode = null;
  if (variant === 'stripes') {
    const sw = stripeW * u;
    const off = (((tSec * speed * sw * 2) / 1.6) % (sw * 2) + sw * 2) % (sw * 2);
    const R = Math.hypot(w, h);
    let d = '';
    for (let x = -R - sw * 2; x < R + sw * 2; x += sw * 2) d += `M${fx(x + off)} ${fx(-R)}h${fx(sw)}v${fx(2 * R)}h${fx(-sw)}Z`;
    el = <path d={d} fill={pattern} transform={`translate(${w / 2} ${h / 2}) rotate(-30)`} />;
  } else if (variant === 'dots') {
    const st = dotStep * u;
    const r = 10 * u;
    const oy = (((tSec * speed * st) / 1.6) % st + st) % st;
    let d = '';
    for (let y = -st; y < h + st; y += st) {
      const row = Math.round(y / st);
      for (let x = ((((row % 2) + 2) % 2) * st) / 2 - st; x < w + st; x += st) d += `M${fx(x - r)} ${fx(y + oy)}a${fx(r)} ${fx(r)} 0 1 0 ${fx(2 * r)} 0a${fx(r)} ${fx(r)} 0 1 0 ${fx(-2 * r)} 0`;
    }
    el = <path d={d} fill={pattern} />;
  } else {
    const R = Math.hypot(w, h);
    const rot = tSec * speed * 10;
    let d = '';
    for (let i = 0; i < rays; i += 2) {
      const a = (i / rays) * Math.PI * 2;
      const da = Math.PI / rays;
      d += `M0 0L${fx(Math.cos(a - da) * R)} ${fx(Math.sin(a - da) * R)}L${fx(Math.cos(a + da) * R)} ${fx(Math.sin(a + da) * R)}Z`;
    }
    el = <path d={d} fill={pattern} transform={`translate(${cx ?? w / 2} ${cy ?? h * 0.45}) rotate(${rot})`} />;
  }
  return (
    <g>
      <rect width={w} height={h} fill={hue} />
      {el}
    </g>
  );
};
/** game-show telop text: fill with an ink stroke ≈14 % of size painted under it */
export const Telop: RB.FC<{x: number; y: number; size: number; text: string; fill: string; ink?: string; font: string; weight?: number; anchor?: 'start' | 'middle' | 'end'; strokeRatio?: number; rotate?: number; letterSpacing?: number}> = ({
  x,
  y,
  size,
  text,
  fill,
  ink = CANDY.ink,
  font,
  weight = 700,
  anchor = 'middle',
  strokeRatio = 0.14,
  rotate = 0,
  letterSpacing = 0,
}) => (
  <text
    x={x}
    y={y}
    fontFamily={font}
    fontWeight={weight}
    fontSize={size}
    textAnchor={anchor}
    fill={fill}
    stroke={ink}
    strokeWidth={size * strokeRatio}
    strokeLinejoin="round"
    paintOrder="stroke"
    letterSpacing={letterSpacing}
    transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
  >
    {text}
  </text>
);

/** a polyline thickened into a closed ribbon (for stems as colour regions) */
export const thickenLine = (pts: BPt[], half: number): BPt[] => {
  const N = normalsE(pts, false);
  const a = pts.map((q, i) => [q[0] + N[i][0] * half, q[1] + N[i][1] * half] as BPt);
  const b = pts.map((q, i) => [q[0] - N[i][0] * half, q[1] - N[i][1] * half] as BPt).reverse();
  return [...a, ...b];
};
/**
 * The pear plate (original subject) engraved in screen space: `tr` maps the 1000-unit subject box to screen,
 * `s` = screen px per subject unit, `u` = stage unit. Groups: bol/bh1/bh2/bh3 (body), lol/lh1/lh2 (leaf),
 * st (stem + veins), sh (cast shadow). Returns the ink (unscheduled) + colour regions in screen space.
 */
export const buildPearPlate = (tr: (q: BPt) => BPt, s: number, u: number, o: {spacing?: number; wMax?: number; light?: BPt; shadow?: boolean} = {}) => {
  const {spacing = 3.4, wMax = 1.7, light = [-0.6, -0.7], shadow = true} = o;
  const P = pearSubject();
  const body = P.body.map(tr);
  const leaf = P.leaf.map(tr);
  const stem = P.stem.map(tr);
  const midrib = P.midrib.map(tr);
  const veins = P.veins.map((v) => v.map(tr));
  const sh = P.shadow.map(tr);
  const ink = new Ink();
  const k = s / 0.85; // the subject is authored at ~0.85 px per unit for a 1080 frame
  const sp = spacing * u;
  engraveShape(ink, [body], [], {g: 'b', light, spacing: sp, wMax: wMax * u, outlineW: 2.1 * u, angle: -0.62, seed: 5, passes: 3, bend: 0.00022 / u, stipple: 0.004 / (u * u)});
  engraveShape(ink, [leaf], [], {g: 'l', light, spacing: sp * 0.9, wMax: wMax * 0.9 * u, outlineW: 1.6 * u, angle: -0.35, seed: 9, passes: 2});
  ink.group('st');
  engraveOutline(ink, stem, {w: 3.4 * u, closed: false, taper: 6 * u, grain: 0.1});
  engraveOutline(ink, midrib, {w: 1.6 * u, closed: false, taper: 20 * u, grain: 0.1});
  for (const v of veins) engraveOutline(ink, v, {w: 1.0 * u, closed: false, taper: 8 * u, grain: 0.1});
  if (shadow) {
    ink.group('sh');
    const bb = bboxOfPts([sh]);
    const scx = (bb[0] + bb[2]) / 2;
    const rx = (bb[2] - bb[0]) / 2;
    engraveHatch(ink, [sh], {angle: 0, spacing: sp * 1.15, tone: (x, y) => 0.8 - Math.min(0.7, Math.hypot((x - scx) / rx, (y - (bb[1] + bb[3]) / 2) / ((bb[3] - bb[1]) / 2)) * 0.7), thr: 0.08, wMax: wMax * 0.85 * u, seed: 77, excl: [body]});
  }
  const bb = bboxOfPts([body]);
  const blush = ellipsePts(bb[0] + (bb[2] - bb[0]) * 0.66, bb[1] + (bb[3] - bb[1]) * 0.66, (bb[2] - bb[0]) * 0.22, (bb[3] - bb[1]) * 0.17, 40, -0.5);
  blush.pop();
  void k;
  return {ink, body, leaf, stem, stemPoly: thickenLine(stem, 5 * u), midrib, veins, shadow: sh, blush, bbox: bb};
};

/** a hand-colouring watercolour region (engraving wash.js): spill, misregister, uneven pigment, tide-line, backruns, granulation, blooming from the brush touch */
export const WashRegion: RB.FC<{id: string; poly: BPt[]; color: string; p: number; origin: BPt; u: number; alpha?: number; spill?: number; seed?: number; backruns?: number; tide?: boolean}> = ({
  id,
  poly,
  color,
  p,
  origin,
  u,
  alpha = 0.62,
  spill = 3.5,
  seed = 1,
  backruns = 2,
  tide = true,
}) => {
  if (p <= 0) return null;
  const bb = bboxOfPts([poly]);
  const far = Math.max(...[[bb[0], bb[1]], [bb[2], bb[1]], [bb[0], bb[3]], [bb[2], bb[3]]].map(([x, y]) => Math.hypot(x - origin[0], y - origin[1]))) + spill * 3 * u;
  const e = 1 - Math.pow(1 - Math.min(1, p), 2.2);
  const R = far * e * 1.08;
  const ring: BPt[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const rr = R * (0.86 + 0.28 * vnoise1(a * 2.2 + seed * 7, seed) + 0.06 * vnoise1(a * 9, seed + 3));
    ring.push([origin[0] + Math.cos(a) * rr, origin[1] + Math.sin(a) * rr]);
  }
  const ox = 2 * u;
  const oy = 1.5 * u;
  const d = ptsD(poly, true);
  const rb = bRng(seed * 31 + 5);
  const dark = (() => {
    const n = parseInt(color.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * 0.62));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  })();
  const area = (bb[2] - bb[0]) * (bb[3] - bb[1]);
  const blobs =
    area > 12000 * u * u
      ? Array.from({length: backruns}, (_, b) => {
          const bx = bb[0] + (0.25 + rb() * 0.5) * (bb[2] - bb[0]);
          const by = bb[1] + (0.25 + rb() * 0.5) * (bb[3] - bb[1]);
          const r = Math.min(bb[2] - bb[0], bb[3] - bb[1]) * (0.12 + rb() * 0.1);
          const pts: BPt[] = [];
          for (let i = 0; i < 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            const rr = r * (0.75 + 0.5 * vnoise1(a * 3 + b * 9, seed + b));
            pts.push([bx + Math.cos(a) * rr, by + Math.sin(a) * rr]);
          }
          return ptsD(pts, true);
        })
      : [];
  return (
    <g style={{mixBlendMode: 'multiply'}}>
      <defs>
        <clipPath id={`${id}-ring`}>
          <path d={ptsD(ring, true)} />
        </clipPath>
        <clipPath id={`${id}-shape`}>
          <path d={d} transform={`translate(${ox} ${oy})`} />
        </clipPath>
        <filter id={`${id}-lift`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={0.012 / u} numOctaves={2} seed={seed * 7 + 1} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.6 0 0 0 1.55" result="a" />
          <feTurbulence type="fractalNoise" baseFrequency={0.6 / u} numOctaves={2} seed={seed + 3} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.2 0 0 0 1.85" result="ga" />
          <feComposite in="a" in2="ga" operator="arithmetic" k1={1} result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
        <filter id={`${id}-soft`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={0.8 * u} />
        </filter>
      </defs>
      <g clipPath={p < 1 ? `url(#${id}-ring)` : undefined} opacity={alpha}>
        <g transform={`translate(${ox} ${oy})`} filter={`url(#${id}-lift)`}>
          <path d={d} fill={color} stroke={color} strokeWidth={spill * 2 * u} strokeLinejoin="round" />
          {blobs.map((bd, i) => (
            <g key={i} clipPath={`url(#${id}-shape)`} transform={`translate(${-ox} ${-oy})`}>
              <path d={bd} fill="#ffffff" opacity={0.3} />
              <path d={bd} fill="none" stroke={dark} strokeWidth={1.6 * u} opacity={0.45} />
            </g>
          ))}
        </g>
        {/* tide-line: pigment pooled at the dry edge */}
        {tide && <path d={d} transform={`translate(${ox} ${oy})`} fill="none" stroke={dark} strokeWidth={2.4 * u} opacity={0.55} filter={`url(#${id}-soft)`} strokeLinejoin="round" />}
      </g>
      {p < 1 && p > 0.02 && (
        <g clipPath={`url(#${id}-shape)`}>
          <path d={ptsD(ring, true)} fill="none" stroke={color} strokeWidth={5 * u} opacity={0.35 * (1 - p)} />
        </g>
      )}
    </g>
  );
};

// ---- keynote "chaos" world (dark-keynote world.js idea): seeded UI clutter shared by storm + snap-grid
export type KItemKind = 'file' | 'photo' | 'notif' | 'app' | 'badge';
export type KItem = {i: number; kind: KItemKind; x: number; y: number; z: number; rot: number; s: number; t: number; ext: string; tint: string; name: string; title: string; body: string; app: number; seed: number; spawn: 'drop' | 'fling' | 'slide' | 'pop'; from: number};
const K_FILES = ['final_v2.pdf', 'final_FINAL.pdf', 'notes (copy).txt', 'IMG_2041.jpg', 'Screenshot 09-12.png', 'budget_new.xlsx', 'deck_v7.key', 'todo.txt', 'todo (1).txt', 'scan0003.pdf', 'invoice(3).pdf', 'draft.docx', 'Untitled 38.txt', 'backup.zip', 'memo.m4a'];
const K_EXT: Record<string, [string, string]> = {pdf: ['PDF', '#E0575B'], txt: ['TXT', '#6E7890'], jpg: ['JPG', '#4C9BE8'], png: ['PNG', '#2FB6A6'], xlsx: ['XLS', '#3FA66B'], key: ['KEY', '#5B7CFA'], docx: ['DOC', '#4C7BE8'], zip: ['ZIP', '#9A7B4F'], m4a: ['M4A', '#C55FD0']};
const K_NOTIFS: [string, string][] = [
  ['Messages', '3 new messages'],
  ['Calendar', 'Standup in 5 min'],
  ['Reminders', 'Pay the invoice'],
  ['Updates', 'Restart to update'],
  ['Mail', '12 unread'],
  ['Photos', 'New memories'],
  ['Storage', 'Disk almost full'],
  ['Chat', '@you in #general'],
];
/** seeded clutter: n items over a (1+spread)× frame, spawn times accelerating (t = T·(i/n)^accel) */
export const keynoteWorld = (seed: number, n: number, w: number, h: number, T: number, accel = 0.55, mix: Partial<Record<KItemKind, number>> = {}) => {
  const R = bRng(seed * 977 + 3);
  const weights: [KItemKind, number][] = [
    ['file', mix.file ?? 0.3],
    ['photo', mix.photo ?? 0.25],
    ['notif', mix.notif ?? 0.22],
    ['app', mix.app ?? 0.13],
    ['badge', mix.badge ?? 0.1],
  ];
  const tot = weights.reduce((a, b) => a + b[1], 0);
  const out: KItem[] = [];
  for (let i = 0; i < n; i++) {
    let q = R() * tot;
    let kind: KItemKind = 'file';
    for (const [k, wt] of weights) {
      if (q < wt) {
        kind = k;
        break;
      }
      q -= wt;
    }
    const name = K_FILES[Math.floor(R() * K_FILES.length)];
    const [ext, tint] = K_EXT[name.split('.').pop() ?? 'txt'] ?? K_EXT.txt;
    const nt = K_NOTIFS[Math.floor(R() * K_NOTIFS.length)];
    const spawn = kind === 'photo' ? 'drop' : kind === 'file' ? 'fling' : kind === 'notif' ? 'slide' : 'pop';
    out.push({
      i,
      kind,
      x: (-0.06 + R() * 1.12) * w,
      y: (-0.06 + R() * 1.12) * h,
      z: 0.65 + R() * 0.7,
      rot: (R() - 0.5) * (kind === 'notif' ? 10 : 34),
      s: 0.85 + R() * 0.6,
      t: T * Math.pow(i / Math.max(1, n), accel),
      ext,
      tint,
      name,
      title: nt[0],
      body: nt[1],
      app: Math.floor(R() * 7),
      seed: Math.floor(R() * 9999),
      spawn,
      from: R() < 0.5 ? -1 : 1,
    });
  }
  return out;
};

// ==== /B =====================================================================================================

// ==== C: 3D studios (data-physical, glass-product) ===========================================================
// Adapted from lemo-opuscar styles/data-physical/demo/set.js + film.js and styles/glass-product/demo/studio.js
// + product.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactC, {useLayoutEffect as useLayoutEffectC, useMemo as useMemoC} from 'react';
import {useThree as useThreeC} from '@react-three/fiber';
import * as THREEC from 'three';

/** cylindrical coords -> V3 (azimuth, radius, height) — data-physical camera convention */
export const cylV3 = (a: number, r: number, y: number): [number, number, number] => [r * Math.sin(a), y, r * Math.cos(a)];

/** data-physical tiny damped landing bounce: 0.012·e^(−9b)·|sin(26b)| (b in seconds) */
export const settleBounce = (b: number) => (b <= 0 ? 0 : 0.012 * Math.exp(-b * 9) * Math.abs(Math.sin(b * 26)));

/** data-physical palette (set.js / STYLE.md) */
export const DP = {
  bg: '#d8cbbb',
  floor: '#bfb8ad',
  walnut: '#6a503a',
  walnutDark: '#4a3626',
  inlay: '#efe4cf',
  ink: '#1c1d20',
  ink2: 'rgba(28,29,32,.64)',
  accent: '#d4521c',
  alu: '#c8ccd1',
  brass: '#d2b07a',
  acrylic: '#9fd3d6',
  acrylicAtt: '#5fb3b8',
};

/** glass-product palette */
export const GP = {bg: '#000000', a: '#62dcff', b: '#a98bff', text: '#e9f1f6', dim: '#8a97a3'};

/** seeded walnut-ish wood canvas texture (deterministic; no asset files) */
export const woodCanvas = (seed = 3, size = 512, base = DP.walnut, dark = DP.walnutDark) => {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  let s = (seed * 2654435761) % 2147483647 || 7;
  const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // long grain streaks
  for (let i = 0; i < 260; i++) {
    const y = R() * size;
    const len = size * (0.3 + R() * 0.8);
    const x0 = R() * size - len * 0.3;
    const amp = 2 + R() * 6;
    const ph = R() * 6.28;
    g.strokeStyle = R() < 0.5 ? `rgba(28,18,10,${0.04 + R() * 0.1})` : `rgba(226,200,168,${0.03 + R() * 0.06})`;
    g.lineWidth = 0.6 + R() * 2.2;
    g.beginPath();
    for (let x = 0; x <= len; x += 8) g[x ? 'lineTo' : 'moveTo'](x0 + x, y + Math.sin(x * 0.012 + ph) * amp);
    g.stroke();
  }
  // a few darker knots
  for (let i = 0; i < 5; i++) {
    const x = R() * size;
    const y = R() * size;
    for (let k = 5; k > 0; k--) {
      g.strokeStyle = `rgba(30,18,10,${0.05 + 0.03 * k})`;
      g.lineWidth = 1.4;
      g.beginPath();
      g.ellipse(x, y, k * 4 + R() * 3, k * 2.4 + R() * 2, R(), 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.fillStyle = dark;
  g.globalAlpha = 0.0;
  g.globalAlpha = 1;
  const t = new THREEC.CanvasTexture(c);
  t.colorSpace = THREEC.SRGBColorSpace;
  t.wrapS = t.wrapT = THREEC.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};

export type PlateMatName = 'aluminium' | 'acrylic' | 'brass' | 'oak' | 'stone' | 'copper';
/** data-physical material presets (set.js values; metalness slightly below 1 so they read without an HDRI) */
export const plateMat = (name: PlateMatName): THREEC.Material => {
  switch (name) {
    case 'aluminium':
      return new THREEC.MeshStandardMaterial({color: DP.alu, metalness: 0.85, roughness: 0.32, envMapIntensity: 2.2});
    case 'brass':
      return new THREEC.MeshStandardMaterial({color: DP.brass, metalness: 0.88, roughness: 0.3, envMapIntensity: 2.2});
    case 'copper':
      return new THREEC.MeshStandardMaterial({color: '#c87f5a', metalness: 0.88, roughness: 0.32, envMapIntensity: 2.2});
    case 'oak':
      return new THREEC.MeshStandardMaterial({color: '#b08d5f', roughness: 0.82});
    case 'stone':
      return new THREEC.MeshStandardMaterial({color: '#9a948c', roughness: 0.9});
    case 'acrylic':
    default:
      return new THREEC.MeshPhysicalMaterial({
        color: DP.acrylic,
        roughness: 0.22,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        transmission: 0.55,
        thickness: 0.5,
        ior: 1.49,
        attenuationColor: new THREEC.Color(DP.acrylicAtt),
        attenuationDistance: 0.45,
      });
  }
};

/** sets renderer tone mapping (data-physical / glass-product use Neutral, exposure ~1.1) */
export const ToneMap: ReactC.FC<{exposure?: number; mode?: 'neutral' | 'aces' | 'none'}> = ({exposure = 1.08, mode = 'neutral'}) => {
  const gl = useThreeC((s) => s.gl);
  useLayoutEffectC(() => {
    gl.toneMapping = mode === 'neutral' ? THREEC.NeutralToneMapping : mode === 'aces' ? THREEC.ACESFilmicToneMapping : THREEC.NoToneMapping;
    gl.toneMappingExposure = exposure;
  }, [gl, exposure, mode]);
  return null;
};

/**
 * Environment baked from a tiny emissive-plane "light-strip studio" (glass-product studio.js).
 * `sweep` (x −1..1, i intensity) moves one vertical strip along an arc at azimuth `az + x·1.35` — pass the
 * camera azimuth + π so the highlight physically slides across the object. Baked with PMREM each frame the
 * inputs change (deterministic: scene is rebuilt from numbers only).
 */
export const StripEnv: ReactC.FC<{
  sweepX?: number;
  sweepI?: number;
  az?: number;
  key?: never;
  keyI?: number;
  sideI?: number;
  topI?: number;
  backI?: number;
  auraI?: number;
  auraColor?: string;
  bg?: string | null;
  /** 0 = pure dark-field (glass look); >0 adds a soft grey room shell so metals read everywhere */
  roomI?: number;
  roomColor?: string;
}> = ({sweepX = 0, sweepI = 0, az = Math.PI, keyI = 0, sideI = 1, topI = 1, backI = 1, auraI = 0, auraColor = GP.a, bg = null, roomI = 0, roomColor = '#8f8a82'}) => {
  const gl = useThreeC((s) => s.gl);
  const scene = useThreeC((s) => s.scene);
  const built = useMemoC(() => {
    const env = new THREEC.Scene();
    env.background = new THREEC.Color('#000000');
    const strip = (w: number, h: number, col: string) => {
      const m = new THREEC.Mesh(new THREEC.PlaneGeometry(w, h), new THREEC.MeshBasicMaterial({color: new THREEC.Color(col), side: THREEC.DoubleSide}));
      env.add(m);
      return m;
    };
    const face = (m: THREEC.Mesh, p: [number, number, number]) => {
      m.position.set(...p);
      m.lookAt(0, 0, 0);
    };
    const L = {
      left: strip(22, 170, '#f4f8ff'),
      right: strip(22, 170, '#fffaf2'),
      top: strip(160, 70, '#ffffff'),
      back: strip(260, 14, '#e8f0ff'),
      key: strip(150, 60, '#ffffff'),
      sweep: strip(26, 240, '#ffffff'),
      aura: strip(140, 140, auraColor),
    };
    face(L.left, [-150, 40, -60]);
    face(L.right, [150, 40, -70]);
    face(L.top, [0, 170, 10]);
    face(L.back, [0, 20, -190]);
    face(L.key, [0, 150, 120]);
    face(L.aura, [0, -60, 120]);
    const room = new THREEC.Mesh(new THREEC.BoxGeometry(620, 620, 620), new THREEC.MeshBasicMaterial({color: '#000000', side: THREEC.BackSide}));
    env.add(room);
    const pmrem = new THREEC.PMREMGenerator(gl);
    return {env, L, room, pmrem, rt: null as THREEC.WebGLRenderTarget | null};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);
  useLayoutEffectC(() => {
    const {env, L, room, pmrem} = built;
    room.visible = roomI > 0.001;
    (room.material as THREEC.MeshBasicMaterial).color.set(roomColor).multiplyScalar(roomI);
    const setI = (m: THREEC.Mesh, base: string, I: number) => {
      (m.material as THREEC.MeshBasicMaterial).color.set(base).multiplyScalar(I);
      m.visible = I > 0.001;
    };
    setI(L.left, '#f4f8ff', 3.2 * sideI);
    setI(L.right, '#fffaf2', 3.2 * sideI);
    setI(L.top, '#ffffff', 1.1 * topI);
    setI(L.back, '#e8f0ff', 1.4 * backI);
    setI(L.key, '#ffffff', 2.5 * keyI);
    setI(L.aura, auraColor, auraI);
    L.sweep.visible = sweepI > 0.001;
    if (L.sweep.visible) {
      const a = az + sweepX * 1.35;
      L.sweep.position.set(Math.sin(a) * 170, 30, Math.cos(a) * 170);
      L.sweep.lookAt(0, 0, 0);
      (L.sweep.material as THREEC.MeshBasicMaterial).color.setRGB(sweepI, sweepI, sweepI);
    }
    const rt = pmrem.fromScene(env, 0, 1, 1000);
    scene.environment = rt.texture;
    if (bg) scene.background = new THREEC.Color(bg);
    if (built.rt) built.rt.dispose();
    built.rt = rt;
  }, [built, scene, sweepX, sweepI, az, keyI, sideI, topI, backI, auraI, auraColor, bg, roomI, roomColor]);
  return null;
};

/** soft radial contact-shadow disc (tightens as `lift` rises) */
export const ContactShadow: ReactC.FC<{x?: number; z?: number; y?: number; r: number; lift?: number; opacity?: number}> = ({x = 0, z = 0, y = 0.001, r, lift = 0, opacity = 0.42}) => {
  const tex = useMemoC(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.55, 'rgba(0,0,0,.55)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return new THREEC.CanvasTexture(c);
  }, []);
  const k = 1 + lift * 0.9;
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[r * k, r * k, 1]}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity / (1 + lift * 1.6)} depthWrite={false} />
    </mesh>
  );
};

// ==== /C =====================================================================================================
