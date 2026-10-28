// Shared helpers for round-2 batch LB3-1 (marker-ring-arrow, perspective-flatten, toy-town-traffic, long-exposure-trails,
// woodblock-print-reveal, frame-breakout, print-wave, wash-arrival, evidence-board).
// Concepts adapted from lemo-opuscar styles/{telestrator,tilt-shift,ukiyoe,urban-sketch} (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {n2} from './random';

/* ───────────── numeric ───────────── */
export const TAU = Math.PI * 2;
export const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (v: number, a: number, b: number) => (b === a ? (v >= b ? 1 : 0) : cl((v - a) / (b - a)));
export const sm = (t: number) => {
  const x = cl(t);
  return x * x * (3 - 2 * x);
};
export const sstep = (a: number, b: number, v: number) => sm((v - a) / (b - a || 1e-9));
export const eo3 = (t: number) => 1 - Math.pow(1 - cl(t), 3);
export const eio3 = (t: number) => {
  const x = cl(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const backOut = (t: number, s = 1.70158) => {
  const x = cl(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** hold the frame for `hz` updates per second (fps = 30 default) */
export const stepFrame = (frame: number, hz: number, fps = 30) => Math.floor((frame * hz) / fps) * (fps / hz);
export const useUid = (prefix: string) => prefix + React.useId().replace(/[^a-zA-Z0-9]/g, '');

/** keyframes [[x, y], …] sampled linearly (x ascending) */
export const keys = (k: [number, number][], x: number) => {
  if (!k.length) return 0;
  if (x <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (x <= k[i][0]) {
      const t = (x - k[i - 1][0]) / (k[i][0] - k[i - 1][0] || 1);
      return lerp(k[i - 1][1], k[i][1], sm(t));
    }
  }
  return k[k.length - 1][1];
};

/* ───────────── colour ───────────── */
export const hex3 = (s: string): [number, number, number] => {
  let h = s.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgbHex = (c: number[]) => '#' + c.map((v) => Math.round(cl(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mixC = (a: string, b: string, t: number) => {
  const x = hex3(a);
  const y = hex3(b);
  return rgbHex([lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)]);
};
export const shade = (c: string, k: number) => {
  const x = hex3(c);
  return rgbHex(x.map((v) => v * k));
};

/* ───────────── polylines ───────────── */
export type Pt = [number, number];
export const polyLen = (pts: Pt[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};
/** cumulative arc length table */
export const polyTable = (pts: Pt[]) => {
  const t = [0];
  for (let i = 1; i < pts.length; i++) t.push(t[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return t;
};
/** point + tangent angle at fraction s (0..1) of a polyline with a precomputed table */
export const polyAt = (pts: Pt[], tab: number[], s: number): {x: number; y: number; a: number} => {
  const L = tab[tab.length - 1] || 1;
  const d = cl(s) * L;
  let i = 1;
  while (i < tab.length - 1 && tab[i] < d) i++;
  const a = pts[i - 1];
  const b = pts[i];
  const segL = tab[i] - tab[i - 1] || 1;
  const t = cl((d - tab[i - 1]) / segL);
  return {x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t), a: Math.atan2(b[1] - a[1], b[0] - a[0])};
};
/** polyline truncated at fraction s */
export const polyPart = (pts: Pt[], tab: number[], s: number): Pt[] => {
  if (s >= 1) return pts;
  const L = tab[tab.length - 1];
  const d = cl(s) * L;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (tab[i] <= d) out.push(pts[i]);
    else {
      const t = (d - tab[i - 1]) / (tab[i] - tab[i - 1] || 1);
      out.push([lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)]);
      break;
    }
  }
  return out;
};
export const ptsD = (pts: Pt[], close = false) =>
  pts.length ? 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + (close ? 'Z' : '') : '';
/** Catmull-Rom resample of control points → smooth polyline */
export const catmull = (c: Pt[], per = 10): Pt[] => {
  if (c.length < 3) return c;
  const out: Pt[] = [];
  for (let i = 0; i < c.length - 1; i++) {
    const p0 = c[Math.max(0, i - 1)];
    const p1 = c[i];
    const p2 = c[i + 1];
    const p3 = c[Math.min(c.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(c[c.length - 1]);
  return out;
};
/** variable-width ribbon polygon along a centreline; half(i/(n-1)) is the half-width in px */
export const taperPoly = (c: Pt[], half: (t: number) => number): string => {
  const n = c.length;
  if (n < 2) return '';
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const m = Math.hypot(dx, dy) || 1;
    dx /= m;
    dy /= m;
    const hw = half(i / (n - 1));
    L.push([c[i][0] - dy * hw, c[i][1] + dx * hw]);
    R.push([c[i][0] + dy * hw, c[i][1] - dx * hw]);
  }
  return ptsD(L.concat(R.reverse()), true);
};

/* ───────────── homography ───────────── */
export type M3 = number[]; // row-major 3x3
export const m3mul = (a: M3, b: M3): M3 => {
  const o = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
  return o;
};
export const m3inv = (m: M3): M3 => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C || 1e-12;
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det);
};
export const m3apply = (m: M3, x: number, y: number): Pt => {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
};
const norm3 = (pts: Pt[]): M3 => {
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p[0], 0) / n;
  const cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const md = pts.reduce((s, p) => s + Math.hypot(p[0] - cx, p[1] - cy), 0) / n || 1;
  const k = Math.SQRT2 / md;
  return [k, 0, -k * cx, 0, k, -k * cy, 0, 0, 1];
};
/** least-squares DLT homography mapping src[i] → dst[i] (≥ 4 pairs), returned row-major with h33 = 1 */
export const fitHomography = (src: Pt[], dst: Pt[]): M3 => {
  const Ts = norm3(src);
  const Td = norm3(dst);
  const S = src.map((p) => m3apply(Ts, p[0], p[1]));
  const D = dst.map((p) => m3apply(Td, p[0], p[1]));
  const N = 8;
  const AtA: number[][] = Array.from({length: N}, () => new Array(N + 1).fill(0));
  const addRow = (r: number[], b: number) => {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) AtA[i][j] += r[i] * r[j];
      AtA[i][N] += r[i] * b;
    }
  };
  for (let i = 0; i < S.length; i++) {
    const [x, y] = S[i];
    const [X, Y] = D[i];
    addRow([x, y, 1, 0, 0, 0, -x * X, -y * X], X);
    addRow([0, 0, 0, x, y, 1, -x * Y, -y * Y], Y);
  }
  for (let c = 0; c < N; c++) {
    let p = c;
    for (let r = c + 1; r < N; r++) if (Math.abs(AtA[r][c]) > Math.abs(AtA[p][c])) p = r;
    [AtA[c], AtA[p]] = [AtA[p], AtA[c]];
    const d = AtA[c][c] || 1e-12;
    for (let j = c; j <= N; j++) AtA[c][j] /= d;
    for (let r = 0; r < N; r++) {
      if (r === c) continue;
      const f = AtA[r][c];
      if (f) for (let j = c; j <= N; j++) AtA[r][j] -= f * AtA[c][j];
    }
  }
  const hn: M3 = [...AtA.map((r) => r[N]), 1];
  const H = m3mul(m3inv(Td), m3mul(hn, Ts));
  return H.map((v) => v / H[8]);
};
/** CSS matrix3d() for a 2D homography (transform-origin must be 0 0) */
export const matrix3dCss = (m: M3) => {
  const [a, b, c, d, e, f, g, h] = m.map((v) => v / m[8]);
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
};

/* ───────────── tilt-shift band blur (SVG) ───────────── */
/**
 * Renders `children` sharp inside a (tilted) horizontal band and increasingly blurred above/below it.
 * Discrete CoC approximation: 4 blurred copies each revealed through a stepped gradient mask. Must be placed
 * inside an <svg>. bandY, halfW, fall are fractions of the height; tilt is the vertical shift across the full width.
 */
export const TiltBand: React.FC<{
  id: string;
  w: number;
  h: number;
  bandY: number;
  halfW?: number;
  fall?: number;
  amp: number;
  pow?: number;
  tilt?: number;
  levels?: number;
  children: React.ReactNode;
}> = ({id, w, h, bandY, halfW = 0.07, fall = 0.3, amp, pow = 1.25, tilt = 0, levels = 4, children}) => {
  const th = Math.atan((tilt * h) / w);
  const cx = w / 2;
  const cy = bandY * h;
  const L = h * 0.9 + (w / 2) * Math.abs(Math.sin(th));
  const nx = -Math.sin(th);
  const ny = Math.cos(th);
  const N = 33;
  return (
    <>
      <defs>
        <g id={`${id}-world`}>{children}</g>
        {Array.from({length: levels}, (_, i) => (
          <React.Fragment key={i}>
            <filter id={`${id}-b${i}`} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={(amp * (i + 1)) / levels / 2} edgeMode="duplicate" />
            </filter>
            <linearGradient id={`${id}-g${i}`} gradientUnits="userSpaceOnUse" x1={cx - nx * L} y1={cy - ny * L} x2={cx + nx * L} y2={cy + ny * L}>
              {Array.from({length: N}, (_, k) => {
                const d = (k / (N - 1) - 0.5) * 2 * L;
                const a0 = halfW * h + fall * h * Math.pow(i / levels, 1 / pow);
                const a1 = halfW * h + fall * h * Math.pow((i + 1) / levels, 1 / pow);
                return <stop key={k} offset={k / (N - 1)} stopColor="#fff" stopOpacity={sstep(a0, a1, Math.abs(d))} />;
              })}
            </linearGradient>
            <mask id={`${id}-m${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
              <rect width={w} height={h} fill={`url(#${id}-g${i})`} />
            </mask>
          </React.Fragment>
        ))}
      </defs>
      <use href={`#${id}-world`} />
      {Array.from({length: levels}, (_, i) => (
        <g key={i} mask={`url(#${id}-m${i})`}>
          <use href={`#${id}-world`} filter={`url(#${id}-b${i})`} />
        </g>
      ))}
    </>
  );
};

/* ───────────── noise helpers ───────────── */
/** smooth 1-D value noise in -1..1 keyed by string */
export const nz = (seed: string, x: number, y = 0) => n2(seed, x, y);

/* ───────────── paper / grain defs (SVG) ───────────── */
/** cream paper fibres; place inside <svg>. */
export const PaperFibreRect: React.FC<{id: string; w: number; h: number; paper: string; fibre?: number; seed?: number; mottle?: number}> = ({id, w, h, paper, fibre = 0.1, seed = 5, mottle = 0.05}) => (
  <>
    <defs>
      <filter id={`${id}-fib`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves={2} seed={seed} />
        <feColorMatrix type="matrix" values={`0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.25  0 0 0 ${fibre * 5} ${-fibre * 2.2}`} />
      </filter>
      <filter id={`${id}-mot`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.0022" numOctaves={3} seed={seed + 3} />
        <feColorMatrix type="matrix" values={`0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.28  0 0 0 ${mottle * 3} ${-mottle * 1.2}`} />
      </filter>
    </defs>
    <rect width={w} height={h} fill={paper} />
    <rect width={w} height={h} filter={`url(#${id}-mot)`} />
    <rect width={w} height={h} filter={`url(#${id}-fib)`} />
  </>
);
