/**
 * r2-mg1b-kit — shared helpers for MG1 batch B (mg-styles-15 films 01 flat-vector, 02 line-art, 08 morph, 19 paperclip,
 * 22 hud). Adapted from mg-styles-15 (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md:
 *  - time remap clock after demos/02-line-art/film.js (CT / camClock)
 *  - outline sampling + cyclic-shift alignment after demos/08-morph/index.html (sampleD / resamplePoly / bestShift / alignTo)
 *  - van Wijk smooth zoom after d3.interpolateZoom (used by demos/19-paperclip/index.html cam())
 * Everything is pure / frame-driven.
 */
import {Easing} from 'remotion';

export type P2 = [number, number];

export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = cl((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** css-style cubic-bezier easing */
export const bez = (x1: number, y1: number, x2: number, y2: number) => Easing.bezier(x1, y1, x2, y2);

// =================================================================================================================
// TIME REMAP CLOCK — "punctuation holds": the clock eases to a stop on each hold, then runs up to ~2x to catch up
// =================================================================================================================
export type Hold = {at: number; dur?: number};
export type RemapOpts = {easeIn?: number; release?: number; total?: number};
const GRID = 600; // samples per second

/** v0 profile (no catch-up boost) around one hold, plus the boost window */
const holdWindows = (h: Required<Hold>, easeIn: number, release: number) => ({
  a: h.at - easeIn,
  b: h.at,
  c: h.at + h.dur,
  d: h.at + h.dur + release,
});

/**
 * Precompute clock[i] = ∫ v(t) dt on a 1/600 s grid (trapezoid). Each hold: ease-out over `easeIn` s down to v = 0,
 * v = 0 for `dur` s, then a smoothstep release over `release` s plus a sin² boost sized so the clock is exactly back on
 * the timeline when the release ends. Returns remap(tSeconds) -> remapped seconds (pure, deterministic).
 */
export const buildTimeRemap = (holds: Hold[], opts: RemapOpts = {}) => {
  const easeIn = opts.easeIn ?? 0.133;
  const release = opts.release ?? 0.7;
  const hs_ = holds
    .map((h) => ({at: h.at, dur: h.dur ?? 0.3}))
    .sort((p, q) => p.at - q.at);
  const last = hs_.length ? hs_[hs_.length - 1].at + hs_[hs_.length - 1].dur + release : 0;
  const total = opts.total ?? Math.max(last + 1, 10);
  const N = Math.ceil(total * GRID);
  const dt = 1 / GRID;
  // boost amplitude per hold = deficit / ∫sin²
  const base = (t: number, w: ReturnType<typeof holdWindows>, h: Required<Hold>) => {
    if (t < w.a || t >= w.d) return 1;
    if (t < w.b) {
      const x = (t - w.a) / easeIn;
      return (1 - x) * (1 - x);
    }
    if (t < w.c) return 0;
    return smooth(0, 1, (t - w.c) / release);
  };
  const win = hs_.map((h) => holdWindows(h, easeIn, release));
  const amp = hs_.map((h, i) => {
    let deficit = 0;
    const w = win[i];
    for (let k = 0; k < Math.ceil((w.d - w.a) * GRID); k++) deficit += (1 - base(w.a + (k + 0.5) * dt, w, h)) * dt;
    return deficit / (release * 0.5);
  });
  const v = (t: number) => {
    for (let i = 0; i < hs_.length; i++) {
      const w = win[i];
      if (t >= w.a && t < w.d) {
        let s = base(t, w, hs_[i]);
        if (t >= w.c) {
          const x = (t - w.c) / release;
          s += amp[i] * Math.sin(Math.PI * x) ** 2;
        }
        return s;
      }
    }
    return 1;
  };
  const clock = new Float64Array(N + 1);
  let prev = v(0);
  for (let i = 1; i <= N; i++) {
    const cur = v(i * dt);
    clock[i] = clock[i - 1] + ((prev + cur) / 2) * dt;
    prev = cur;
  }
  const remap = (t: number) => {
    if (t <= 0) return t;
    const f = t * GRID;
    const i = Math.floor(f);
    if (i >= N) return clock[N] + (t - N * dt);
    return mix(clock[i], clock[i + 1], f - i);
  };
  /** instantaneous speed (clock derivative) */
  const speed = (t: number) => v(Math.max(0, t));
  return {remap, speed, holds: hs_, windows: win};
};

// =================================================================================================================
// path parsing / sampling (so shapes can be given as plain SVG `d` strings; M L H V C S Q T Z, absolute + relative, A as line)
// =================================================================================================================
const NUM = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
/** flatten an SVG path `d` into subpaths of points */
export const flattenPath = (d: string, curveSteps = 14): {pts: P2[]; closed: boolean}[] => {
  const out: {pts: P2[]; closed: boolean}[] = [];
  const toks = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  let i = 0;
  let cur: P2 = [0, 0];
  let start: P2 = [0, 0];
  let cmd = '';
  let sub: P2[] = [];
  let lastC: P2 | null = null; // last cubic control for S
  let lastQ: P2 | null = null;
  const num = () => parseFloat(toks[i++]);
  const push = () => {
    if (sub.length > 1) out.push({pts: sub, closed: false});
    sub = [];
  };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? cur[0] : 0;
    const oy = rel ? cur[1] : 0;
    if (C === 'M') {
      push();
      cur = [num() + ox, num() + oy];
      start = cur;
      sub = [cur];
      cmd = rel ? 'l' : 'L';
      lastC = lastQ = null;
    } else if (C === 'L') {
      cur = [num() + ox, num() + oy];
      sub.push(cur);
      lastC = lastQ = null;
    } else if (C === 'H') {
      cur = [num() + ox, cur[1]];
      sub.push(cur);
      lastC = lastQ = null;
    } else if (C === 'V') {
      cur = [cur[0], num() + oy];
      sub.push(cur);
      lastC = lastQ = null;
    } else if (C === 'C' || C === 'S') {
      let p1: P2;
      if (C === 'C') p1 = [num() + ox, num() + oy];
      else p1 = lastC ? [2 * cur[0] - lastC[0], 2 * cur[1] - lastC[1]] : cur;
      const p2: P2 = [num() + ox, num() + oy];
      const p3: P2 = [num() + ox, num() + oy];
      for (let k = 1; k <= curveSteps; k++) {
        const t = k / curveSteps;
        const m = 1 - t;
        sub.push([
          m * m * m * cur[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
          m * m * m * cur[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1],
        ]);
      }
      cur = p3;
      lastC = p2;
      lastQ = null;
    } else if (C === 'Q' || C === 'T') {
      let p1: P2;
      if (C === 'Q') p1 = [num() + ox, num() + oy];
      else p1 = lastQ ? [2 * cur[0] - lastQ[0], 2 * cur[1] - lastQ[1]] : cur;
      const p2: P2 = [num() + ox, num() + oy];
      for (let k = 1; k <= curveSteps; k++) {
        const t = k / curveSteps;
        const m = 1 - t;
        sub.push([m * m * cur[0] + 2 * m * t * p1[0] + t * t * p2[0], m * m * cur[1] + 2 * m * t * p1[1] + t * t * p2[1]]);
      }
      cur = p2;
      lastQ = p1;
      lastC = null;
    } else if (C === 'A') {
      // elliptical arcs are approximated by a straight line to the end point (documented limitation)
      i += 5;
      cur = [num() + ox, num() + oy];
      sub.push(cur);
    } else if (C === 'Z') {
      if (sub.length > 1) out.push({pts: sub, closed: true});
      sub = [];
      cur = start;
    } else {
      i++;
    }
  }
  push();
  return out;
};

export const signedArea = (p: P2[]) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    a += p[i][0] * q[1] - q[0] * p[i][1];
  }
  return a / 2;
};
export const centroid = (p: P2[]): P2 => {
  let x = 0;
  let y = 0;
  for (const q of p) {
    x += q[0];
    y += q[1];
  }
  return [x / p.length, y / p.length];
};
/** n points equally spaced by arclength along a closed polygon (or open polyline) */
export const resampleN = (pts: P2[], n: number, closed = true): P2[] => {
  const src = closed ? [...pts, pts[0]] : pts;
  const L = [0];
  for (let i = 1; i < src.length; i++) L.push(L[i - 1] + Math.hypot(src[i][0] - src[i - 1][0], src[i][1] - src[i - 1][1]));
  const tot = L[L.length - 1];
  const out: P2[] = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const s = closed ? (tot * i) / n : (tot * i) / Math.max(1, n - 1);
    while (j < L.length - 1 && L[j] < s) j++;
    const a = src[j - 1];
    const b = src[j];
    const u = (s - L[j - 1]) / Math.max(1e-9, L[j] - L[j - 1]);
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
};
/** force counter-clockwise (positive signed area) so morph pairs share an orientation */
export const orient = (p: P2[]) => (signedArea(p) < 0 ? [...p].reverse() : p);
/** brute-force cyclic shift of B minimising Σ‖A_i − B_(i+s)‖² (step for speed) */
export const alignTo = (A: P2[], B: P2[], step = 2): P2[] => {
  const n = A.length;
  let best = 0;
  let bd = Infinity;
  for (let s = 0; s < n; s += step) {
    let d = 0;
    for (let i = 0; i < n; i++) {
      const b = B[(i + s) % n];
      const dx = A[i][0] - b[0];
      const dy = A[i][1] - b[1];
      d += dx * dx + dy * dy;
    }
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return B.map((_, i) => B[(i + best) % n]);
};
export const ptsToD = (p: P2[], close = true) => (p.length ? 'M' + p.map((q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join('L') + (close ? 'Z' : '') : '');

// =================================================================================================================
// van Wijk smooth zoom (d3.interpolateZoom): views are [cx, cy, visibleWidth]
// =================================================================================================================
export type View = [number, number, number];
export const zoomInterp = (a: View, b: View, rho = Math.SQRT2): ((t: number) => View) => {
  const [ux0, uy0, w0] = a;
  const [ux1, uy1, w1] = b;
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;
  if (d2 < 1e-9) {
    const S = Math.log(w1 / w0) / rho;
    return (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
  }
  const rho2 = rho * rho;
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + rho2 * rho2 * d2) / (2 * w0 * rho2 * d1);
  const b1 = (w1 * w1 - w0 * w0 - rho2 * rho2 * d2) / (2 * w1 * rho2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / rho;
  return (t) => {
    const s = t * S;
    const cr0 = Math.cosh(r0);
    const u = (w0 / (rho2 * d1)) * (cr0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
    return [ux0 + u * dx, uy0 + u * dy, (w0 * cr0) / Math.cosh(rho * s + r0)];
  };
};

/** Gaussian weight */
export const gauss = (x: number, sigma: number) => Math.exp(-0.5 * (x / sigma) * (x / sigma));
