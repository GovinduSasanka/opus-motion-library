/**
 * r2-pr3-kit — shared helpers for the PR-3 batch (prompt-corpus techniques): function-plot, atom-model,
 * explosion-burst, fire-flames, physics-pile, audio-spectrum, logo-assemble, notification-stack.
 * Everything is a pure function of the frame (no timers, no Math.random, no requestAnimationFrame).
 *
 *  - colour helpers + hashed noise
 *  - compileExpr(): a tiny safe expression parser ("sin(x) + x^2/4") -> (x) => number
 *  - simulatePile(): deterministic 2D rigid-body sim (rounded boxes / triangles / circles as circle clusters),
 *    pre-simulated once at 120 Hz, sampled per frame, with collision events for SFX
 *  - audio: useAudioReactive() (real file via @remotion/media-utils, or a synthetic beat when no src),
 *    useAudioEnergy() to drive other motions, log-spaced bands, smoothing + peak hold
 *  - useInkGrid(): ink coverage of a text run (for shard / stencil work), delayRender-guarded
 *  - NotifIcon: small original glyph set for notification cards
 */
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {useAudioData, visualizeAudio, visualizeAudioWaveform} from '@remotion/media-utils';
import {resolveSrc} from './asset';
import {clamp} from './ease';
import {rng} from './random';

// =================================================================================================================
// colour + hash helpers
// =================================================================================================================
export const rgb3 = (hex: string): [number, number, number] => {
  let h = (hex || '#808080').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgbaStr = (hex: string, a: number) => {
  const [r, g, b] = rgb3(hex);
  return `rgba(${r},${g},${b},${a})`;
};
export const mix = (a: string, b: string, t: number) => {
  const A = rgb3(a);
  const B = rgb3(b);
  const k = clamp(t);
  return '#' + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')).join('');
};
export const lighten = (hex: string, k: number) => (k >= 0 ? mix(hex, '#ffffff', k) : mix(hex, '#000000', -k));
/** colour ramp: stops [[t, hex], ...] sorted by t */
export const ramp = (stops: [number, string][], t: number) => {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      return mix(c0, c1, (t - t0) / Math.max(1e-6, t1 - t0));
    }
  }
  return stops[stops.length - 1][1];
};
/** stable hash -> 0..1 */
export const h01 = (a: number, b = 0, c = 0) => {
  let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
/** smooth 1D value noise, ~ -1..1 */
export const vn1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  return (h01(i, seed) * (1 - s) + h01(i + 1, seed) * s) * 2 - 1;
};

// =================================================================================================================
// compileExpr — recursive-descent expression parser (no eval)
// =================================================================================================================
type Fn = (x: number) => number;
const FUNCS: Record<string, (v: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10,
  log2: Math.log2, sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round,
  sign: Math.sign, sq: (v) => v * v, cbrt: Math.cbrt,
};
const CONSTS: Record<string, number> = {pi: Math.PI, tau: Math.PI * 2, e: Math.E, phi: 1.618033988749895};

/** Compile "sin(x) + x^2/4" (+ - * / ^, unary minus, implicit multiplication "2x", constants pi/e/tau) to a function of x. */
export const compileExpr = (src: string): Fn => {
  const s = (src || '').toLowerCase().replace(/\s+/g, '').replace(/×/g, '*').replace(/·/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi');
  let i = 0;
  const peek = () => s[i];
  const isDigit = (c?: string) => !!c && /[0-9.]/.test(c);
  const isAlpha = (c?: string) => !!c && /[a-z_]/.test(c);

  const expr = (): Fn => {
    let l = term();
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      const r = term();
      const a = l;
      l = op === '+' ? (x) => a(x) + r(x) : (x) => a(x) - r(x);
    }
    return l;
  };
  const term = (): Fn => {
    let l = unary();
    for (;;) {
      const c = peek();
      if (c === '*' || c === '/') {
        i++;
        const r = unary();
        const a = l;
        l = c === '*' ? (x) => a(x) * r(x) : (x) => a(x) / r(x);
      } else if (isDigit(c) || isAlpha(c) || c === '(') {
        const r = unary();
        const a = l;
        l = (x) => a(x) * r(x);
      } else return l;
    }
  };
  const unary = (): Fn => {
    if (peek() === '-') {
      i++;
      const a = unary();
      return (x) => -a(x);
    }
    if (peek() === '+') {
      i++;
      return unary();
    }
    return power();
  };
  const power = (): Fn => {
    const b = atom();
    if (peek() === '^') {
      i++;
      const e = unary();
      return (x) => Math.pow(b(x), e(x));
    }
    return b;
  };
  const atom = (): Fn => {
    const c = peek();
    if (c === '(') {
      i++;
      const e = expr();
      if (peek() === ')') i++;
      return e;
    }
    if (isDigit(c)) {
      const st = i;
      while (isDigit(peek())) i++;
      const v = parseFloat(s.slice(st, i));
      return () => v;
    }
    if (isAlpha(c)) {
      const st = i;
      while (isAlpha(peek()) || /[0-9]/.test(peek() ?? '')) i++;
      const id = s.slice(st, i);
      if (id === 'x' || id === 't') return (x) => x;
      if (id in CONSTS) {
        const v = CONSTS[id];
        return () => v;
      }
      const f = FUNCS[id];
      if (f) {
        const arg = peek() === '(' ? atom() : unary();
        return (x) => f(arg(x));
      }
      return () => NaN;
    }
    i++; // skip junk
    return () => NaN;
  };
  try {
    const f = expr();
    return (x) => {
      const v = f(x);
      return Number.isFinite(v) ? v : NaN;
    };
  } catch {
    return () => NaN;
  }
};

// =================================================================================================================
// simulatePile — deterministic 2D rigid bodies built from circle clusters
// =================================================================================================================
export type PileKind = 'circle' | 'box' | 'tri';
export type PileBody = {
  kind: PileKind;
  /** width (circle: diameter) */
  w: number;
  /** height */
  h: number;
  /** frame at which the body enters the sim */
  spawn: number;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  spin: number;
  /** density multiplier */
  density?: number;
};
export type PileSeg = [number, number, number, number];
export type PileEvent = {frame: number; x: number; y: number; strength: number; body: number};
export type PileResult = {
  frames: number;
  count: number;
  /** x, y, angle per body per frame; NaN before spawn */
  data: Float32Array;
  events: PileEvent[];
  /** collision radius (visual corner radius) per body */
  radius: number[];
};

type Sim = {
  b: PileBody;
  pts: [number, number][];
  r: number;
  R: number;
  invM: number;
  invI: number;
  x: number;
  y: number;
  a: number;
  vx: number;
  vy: number;
  w: number;
  cool: number;
};

/** circle cluster for a body. Returns local sample points + sample radius (also the visual corner radius). */
export const pileSamples = (kind: PileKind, w: number, h: number): {pts: [number, number][]; r: number; verts: [number, number][]} => {
  if (kind === 'circle') return {pts: [[0, 0]], r: w / 2, verts: []};
  if (kind === 'box') {
    const r = clamp(Math.min(w, h) * 0.24, 3, 14);
    const iw = w / 2 - r;
    const ih = h / 2 - r;
    const nx = Math.max(1, Math.ceil((iw * 2) / (r * 1.5)));
    const ny = Math.max(1, Math.ceil((ih * 2) / (r * 1.5)));
    const pts: [number, number][] = [];
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) pts.push([-iw + (2 * iw * i) / nx, -ih + (2 * ih * j) / ny]);
    return {pts, r, verts: [[-iw, -ih], [iw, -ih], [iw, ih], [-iw, ih]]};
  }
  // isoceles triangle, apex up, centroid at origin
  const A: [number, number] = [0, (-2 * h) / 3];
  const B: [number, number] = [w / 2, h / 3];
  const C: [number, number] = [-w / 2, h / 3];
  const la = Math.hypot(B[0] - C[0], B[1] - C[1]);
  const lb = Math.hypot(A[0] - C[0], A[1] - C[1]);
  const lc = Math.hypot(A[0] - B[0], A[1] - B[1]);
  const per = la + lb + lc;
  const inc: [number, number] = [(la * A[0] + lb * B[0] + lc * C[0]) / per, (la * A[1] + lb * B[1] + lc * C[1]) / per];
  const inr = (w * h) / 2 / (per / 2);
  const r = clamp(inr * 0.45, 3, 12);
  const k = Math.max(0.05, (inr - r) / inr);
  const sh = (p: [number, number]): [number, number] => [inc[0] + (p[0] - inc[0]) * k, inc[1] + (p[1] - inc[1]) * k];
  const V = [sh(A), sh(B), sh(C)];
  const pts: [number, number][] = [...V];
  const n = 5;
  for (let i = 0; i <= n; i++)
    for (let j = 0; j <= n - i; j++) {
      const u = i / n;
      const v = j / n;
      const p: [number, number] = [V[0][0] * (1 - u - v) + V[1][0] * u + V[2][0] * v, V[0][1] * (1 - u - v) + V[1][1] * u + V[2][1] * v];
      pts.push(p);
    }
  return {pts, r, verts: V};
};

const simCache = new Map<string, PileResult>();

export const simulatePile = (
  key: string,
  bodies: PileBody[],
  walls: PileSeg[],
  opts: {frames: number; fps?: number; gravity?: number; restitution?: number; friction?: number; substeps?: number; iterations?: number; wallRadius?: number},
): PileResult => {
  const hit = simCache.get(key);
  if (hit) return hit;
  const fps = opts.fps ?? 30;
  const sub = opts.substeps ?? 4; // 120 Hz at 30 fps
  const iters = opts.iterations ?? 6;
  const dt = 1 / (fps * sub);
  const g = opts.gravity ?? 2400;
  const e0 = opts.restitution ?? 0.35;
  const mu = opts.friction ?? 0.5;
  const wr = opts.wallRadius ?? 0;
  const n = bodies.length;
  const sims: Sim[] = bodies.map((b) => {
    const s = pileSamples(b.kind, b.w, b.h);
    const area = b.kind === 'circle' ? Math.PI * (b.w / 2) ** 2 : b.kind === 'box' ? b.w * b.h : (b.w * b.h) / 2;
    const m = area * (b.density ?? 1) * 0.001;
    const I = b.kind === 'circle' ? (m * (b.w / 2) ** 2) / 2 : (m * (b.w * b.w + b.h * b.h)) / 12;
    let R = 0;
    for (const p of s.pts) R = Math.max(R, Math.hypot(p[0], p[1]) + s.r);
    return {b, pts: s.pts, r: s.r, R, invM: 1 / m, invI: 1 / I, x: b.x, y: b.y, a: b.angle, vx: b.vx, vy: b.vy, w: b.spin, cool: 0};
  });
  const data = new Float32Array(opts.frames * n * 3).fill(NaN);
  const events: PileEvent[] = [];
  type C = {a: number; bI: number; nx: number; ny: number; pen: number; px: number; py: number};
  for (let f = 0; f < opts.frames; f++) {
    for (let s = 0; s < sub; s++) {
      const act: number[] = [];
      for (let i = 0; i < n; i++) if (f >= sims[i].b.spawn) act.push(i);
      for (const i of act) {
        const S = sims[i];
        S.vy += g * dt;
        S.w *= 0.9992;
      }
      // contact generation
      const cs: C[] = [];
      const world: [number, number][][] = [];
      for (const i of act) {
        const S = sims[i];
        const c = Math.cos(S.a);
        const sn = Math.sin(S.a);
        world[i] = S.pts.map((p) => [S.x + p[0] * c - p[1] * sn, S.y + p[0] * sn + p[1] * c] as [number, number]);
      }
      for (let ai = 0; ai < act.length; ai++) {
        const i = act[ai];
        const A = sims[i];
        for (let bi = ai + 1; bi < act.length; bi++) {
          const j = act[bi];
          const B = sims[j];
          const dx0 = B.x - A.x;
          const dy0 = B.y - A.y;
          const lim = A.R + B.R;
          if (dx0 * dx0 + dy0 * dy0 > lim * lim) continue;
          const wa = world[i];
          const wb = world[j];
          let best: C | null = null;
          for (let p = 0; p < wa.length; p++)
            for (let q = 0; q < wb.length; q++) {
              const dx = wb[q][0] - wa[p][0];
              const dy = wb[q][1] - wa[p][1];
              const rr = A.r + B.r;
              const d2 = dx * dx + dy * dy;
              if (d2 >= rr * rr) continue;
              const d = Math.sqrt(d2) || 1e-4;
              const pen = rr - d;
              const nx = dx / d;
              const ny = dy / d;
              const c: C = {a: i, bI: j, nx, ny, pen, px: wa[p][0] + nx * A.r, py: wa[p][1] + ny * A.r};
              cs.push(c);
              if (!best || pen > best.pen) best = c;
            }
        }
        // walls
        const wa = world[i];
        for (let p = 0; p < wa.length; p++)
          for (const sg of walls) {
            const [x1, y1, x2, y2] = sg;
            const ex = x2 - x1;
            const ey = y2 - y1;
            const l2 = ex * ex + ey * ey || 1;
            const t = clamp(((wa[p][0] - x1) * ex + (wa[p][1] - y1) * ey) / l2);
            const cx = x1 + ex * t;
            const cy = y1 + ey * t;
            const dx = cx - wa[p][0];
            const dy = cy - wa[p][1];
            const d2 = dx * dx + dy * dy;
            const lim2 = (A.r + wr) * (A.r + wr);
            if (d2 >= lim2) continue;
            const d = Math.sqrt(d2) || 1e-4;
            // normal points from body to wall; if the sample is "behind" the wall, flip via the segment normal
            let nx = dx / d;
            let ny = dy / d;
            let pen = A.r + wr - d;
            if (d < 1e-3) {
              nx = ey / Math.sqrt(l2);
              ny = -ex / Math.sqrt(l2);
              pen = A.r + wr;
            }
            cs.push({a: i, bI: -1, nx, ny, pen, px: cx, py: cy});
          }
      }
      // sequential impulses
      for (let it = 0; it < iters; it++) {
        for (const c of cs) {
          const A = sims[c.a];
          const B = c.bI >= 0 ? sims[c.bI] : null;
          const rax = c.px - A.x;
          const ray = c.py - A.y;
          const rbx = B ? c.px - B.x : 0;
          const rby = B ? c.py - B.y : 0;
          const vax = A.vx - A.w * ray;
          const vay = A.vy + A.w * rax;
          const vbx = B ? B.vx - B.w * rby : 0;
          const vby = B ? B.vy + B.w * rbx : 0;
          const rvx = vbx - vax;
          const rvy = vby - vay;
          const vn = rvx * c.nx + rvy * c.ny;
          if (vn > 0) continue;
          const raN = rax * c.ny - ray * c.nx;
          const rbN = B ? rbx * c.ny - rby * c.nx : 0;
          const den = A.invM + (B ? B.invM : 0) + raN * raN * A.invI + (B ? rbN * rbN * B.invI : 0);
          const e = -vn > 260 ? e0 : 0;
          let j = (-(1 + e) * vn) / den;
          if (it === 0 && -vn > 220 && !(A.cool > 0)) {
            events.push({frame: f, x: c.px, y: c.py, strength: clamp((-vn - 220) / 1400), body: c.a});
            A.cool = 10 * sub;
          }
          A.vx -= c.nx * j * A.invM;
          A.vy -= c.ny * j * A.invM;
          A.w -= (rax * c.ny - ray * c.nx) * j * A.invI;
          if (B) {
            B.vx += c.nx * j * B.invM;
            B.vy += c.ny * j * B.invM;
            B.w += (rbx * c.ny - rby * c.nx) * j * B.invI;
          }
          // friction
          const vax2 = A.vx - A.w * ray;
          const vay2 = A.vy + A.w * rax;
          const vbx2 = B ? B.vx - B.w * rby : 0;
          const vby2 = B ? B.vy + B.w * rbx : 0;
          const rvx2 = vbx2 - vax2;
          const rvy2 = vby2 - vay2;
          const tx0 = -c.ny;
          const ty0 = c.nx;
          const vt = rvx2 * tx0 + rvy2 * ty0;
          const raT = rax * ty0 - ray * tx0;
          const rbT = B ? rbx * ty0 - rby * tx0 : 0;
          const denT = A.invM + (B ? B.invM : 0) + raT * raT * A.invI + (B ? rbT * rbT * B.invI : 0);
          let jt = -vt / denT;
          const maxF = Math.abs(j) * mu;
          jt = clamp(jt, -maxF, maxF);
          A.vx -= tx0 * jt * A.invM;
          A.vy -= ty0 * jt * A.invM;
          A.w -= raT * jt * A.invI;
          if (B) {
            B.vx += tx0 * jt * B.invM;
            B.vy += ty0 * jt * B.invM;
            B.w += rbT * jt * B.invI;
          }
          j = 0;
        }
      }
      // position correction + integrate
      for (const c of cs) {
        const A = sims[c.a];
        const B = c.bI >= 0 ? sims[c.bI] : null;
        const corr = Math.max(0, c.pen - 0.4) * 0.35;
        const tot = A.invM + (B ? B.invM : 0);
        A.x -= (c.nx * corr * A.invM) / tot;
        A.y -= (c.ny * corr * A.invM) / tot;
        if (B) {
          B.x += (c.nx * corr * B.invM) / tot;
          B.y += (c.ny * corr * B.invM) / tot;
        }
      }
      for (const i of act) {
        const S = sims[i];
        // quiet damping near rest so the final pile does not jitter
        const sp = Math.hypot(S.vx, S.vy);
        if (sp < 14 && Math.abs(S.w) < 0.35) {
          S.vx *= 0.9;
          S.vy *= 0.9;
          S.w *= 0.9;
        }
        S.x += S.vx * dt;
        S.y += S.vy * dt;
        S.a += S.w * dt;
        if (S.cool > 0) S.cool -= 1;
      }
    }
    for (let i = 0; i < n; i++) {
      if (f < sims[i].b.spawn) continue;
      const o = (f * n + i) * 3;
      data[o] = sims[i].x;
      data[o + 1] = sims[i].y;
      data[o + 2] = sims[i].a;
    }
  }
  const res: PileResult = {frames: opts.frames, count: n, data, events, radius: sims.map((s) => s.r)};
  simCache.set(key, res);
  return res;
};

/** convenience: deterministic pile bodies from a seed (a mix of circles, rounded boxes and triangles) */
export const makePileBodies = (
  count: number,
  seed: number,
  area: {x0: number; x1: number; top: number},
  size: number,
  kinds: PileKind[],
  everyFrames: number,
  startFrame: number,
): PileBody[] => {
  const r = rng(seed);
  const out: PileBody[] = [];
  for (let i = 0; i < count; i++) {
    const kind = kinds[Math.floor(r() * kinds.length) % kinds.length];
    const s = size * (0.7 + r() * 0.6);
    const w = kind === 'box' ? s * (0.9 + r() * 0.5) : s;
    const h = kind === 'box' ? s * (0.6 + r() * 0.5) : kind === 'tri' ? s * 0.9 : s;
    out.push({
      kind,
      w,
      h,
      spawn: startFrame + Math.round(i * everyFrames + r() * 1.5),
      x: area.x0 + (area.x1 - area.x0) * (0.12 + 0.76 * r()),
      y: area.top - s,
      angle: r() * Math.PI * 2,
      vx: (r() - 0.5) * 160,
      vy: 80 + r() * 160,
      spin: (r() - 0.5) * 6,
    });
  }
  return out;
};

// =================================================================================================================
// audio
// =================================================================================================================
export type AudioReactive = {
  /** smoothed bands 0..1 (log frequency) */
  bands: number[];
  /** peak-hold per band 0..1 */
  peaks: number[];
  /** time-domain samples -1..1 */
  wave: number[];
  /** 0..1 average level, bass / mid / treble energy */
  level: number;
  bass: number;
  mid: number;
  treble: number;
  /** true when driven by a real audio file */
  real: boolean;
};

const bump = (x: number, c: number, wd: number) => Math.exp(-(((x - c) / wd) ** 2));

/** deterministic synthetic "music" spectrum (used when no soundtrack is given) */
export const synthBands = (frame: number, fps: number, bins: number, bpm: number, seed: number): number[] => {
  const t = frame / fps;
  const beat = (t * bpm) / 60;
  const p = beat - Math.floor(beat);
  const bar = Math.floor(beat) % 4;
  const kick = Math.exp(-p * 5.5) * (bar === 1 || bar === 3 ? 0.75 : 1);
  const snare = (bar === 1 || bar === 3 ? 1 : 0) * Math.exp(-p * 7);
  const p8 = (beat * 2) % 1;
  const hat = Math.exp(-p8 * 9) * 0.8;
  const out: number[] = [];
  const m1 = 0.35 + 0.3 * vn1(t * 0.9, seed);
  const m2 = 0.55 + 0.3 * vn1(t * 0.7 + 9, seed + 3);
  const swell = 0.55 + 0.45 * Math.sin(t * 0.8);
  for (let b = 0; b < bins; b++) {
    const x = b / Math.max(1, bins - 1);
    let v = kick * bump(x, 0.07, 0.1) * 1.05;
    v += 0.35 * bump(x, 0.14, 0.12) * (0.6 + 0.4 * Math.sin(t * 5.2));
    v += snare * (0.55 * bump(x, 0.42, 0.2) + 0.25 * bump(x, 0.7, 0.3));
    v += hat * 0.55 * bump(x, 0.86, 0.16);
    v += 0.4 * swell * (bump(x, m1, 0.06) + 0.7 * bump(x, m2, 0.05));
    v += 0.1 + 0.18 * (vn1(t * 6 + b * 0.7, seed + 11) * 0.5 + 0.5) * (1 - x * 0.5);
    v *= 1 - 0.25 * x;
    out.push(clamp(v));
  }
  return out;
};
const synthWave = (frame: number, fps: number, n: number, bands: number[]): number[] => {
  const t = frame / fps;
  const out: number[] = [];
  const K = Math.min(8, bands.length);
  for (let i = 0; i < n; i++) {
    const x = i / n;
    let v = 0;
    for (let k = 0; k < K; k++) {
      const amp = bands[Math.floor((k / K) * bands.length * 0.9)] * (1 - k / (K + 2));
      v += amp * Math.sin(2 * Math.PI * (k + 1.5) * x * 2 + t * (3 + k * 1.3) + k);
    }
    out.push(clamp(v / 3.2, -1, 1));
  }
  return out;
};

const SILENT_DEPTH = 24;

/**
 * Audio-reactive data for a frame. `src` = a public/ path or URL; empty -> a synthetic beat at `bpm`.
 * Deterministic: smoothing and peak hold are computed from the previous frames, not from state.
 */
export const useAudioReactive = (
  src: string,
  frame: number,
  fps: number,
  o: {bins?: number; smoothing?: number; peakHold?: number; sensitivity?: number; bpm?: number; seed?: number; waveSamples?: number} = {},
): AudioReactive => {
  const bins = o.bins ?? 64;
  const smoothing = clamp(o.smoothing ?? 0.7, 0, 0.95);
  const hold = o.peakHold ?? 8;
  const sens = o.sensitivity ?? 1;
  const bpm = o.bpm ?? 118;
  const seed = o.seed ?? 3;
  const waveN = o.waveSamples ?? 256;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const audio = src ? useAudioData(resolveSrc(src)) : null;

  const raw = (f: number): number[] => {
    const ff = Math.max(0, f);
    if (!src || !audio) return synthBands(ff, fps, bins, bpm, seed);
    const N = 1024;
    const lin = visualizeAudio({audioData: audio, frame: ff, fps, numberOfSamples: N, optimizeFor: 'speed', smoothing: false});
    const out: number[] = [];
    const lo = 2;
    const hi = N * 0.5;
    for (let b = 0; b < bins; b++) {
      const k0 = lo * Math.pow(hi / lo, b / bins);
      const k1 = lo * Math.pow(hi / lo, (b + 1) / bins);
      const i0 = Math.floor(k0);
      const i1 = Math.max(i0 + 1, Math.ceil(k1));
      let sum = 0;
      for (let k = i0; k < i1; k++) sum = Math.max(sum, lin[k] ?? 0);
      const tilt = 1 + (b / bins) * 2.2;
      out.push(clamp(Math.pow(sum * tilt * 3.2 * sens, 0.55)));
    }
    return out;
  };

  const depth = SILENT_DEPTH;
  const hist: number[][] = [];
  for (let k = depth; k >= 0; k--) hist.push(raw(frame - k));
  // attack-instant / release-smoothed series
  const sm: number[][] = [];
  for (let k = 0; k <= depth; k++) {
    const cur = hist[k];
    const prev = k === 0 ? cur : sm[k - 1];
    sm.push(cur.map((v, i) => Math.max(v, prev[i] * smoothing)));
  }
  const bands = sm[depth];
  const peaks = bands.map((_, i) => {
    let p = 0;
    for (let k = 0; k <= hold + 8; k++) {
      const wgt = k <= hold ? 1 : 1 - (k - hold) / 9;
      p = Math.max(p, sm[depth - k]?.[i] * wgt || 0);
    }
    return Math.max(p, bands[i]);
  });
  let wave: number[];
  if (src && audio) {
    wave = visualizeAudioWaveform({audioData: audio, frame, fps, windowInSeconds: 0.04, numberOfSamples: waveN, normalize: false}).map((v) => clamp(v * 1.6 * sens, -1, 1));
  } else wave = synthWave(frame, fps, waveN, bands);
  const avg = (a: number, b: number) => {
    let s = 0;
    const i0 = Math.floor(bands.length * a);
    const i1 = Math.max(i0 + 1, Math.floor(bands.length * b));
    for (let i = i0; i < i1; i++) s += bands[i];
    return s / (i1 - i0);
  };
  return {bands, peaks, wave, level: avg(0, 1), bass: avg(0, 0.18), mid: avg(0.18, 0.55), treble: avg(0.55, 1), real: !!(src && audio)};
};

/** Light-weight energy for driving other motions (scale / glow / shake). Pass the soundtrack path, or '' for the synthetic beat. */
export const useAudioEnergy = (src: string, frame: number, fps: number, bpm = 118) => {
  const a = useAudioReactive(src, frame, fps, {bins: 24, smoothing: 0.75, peakHold: 4, bpm});
  return {bass: a.bass, mid: a.mid, treble: a.treble, level: a.level, real: a.real};
};

// =================================================================================================================
// text ink coverage (shards / stencils)
// =================================================================================================================
export type InkGrid = {
  /** em units relative to the text origin (x start, y alphabetic baseline, y down) */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  has: (xEm: number, yEm: number) => boolean;
};
const inkCache = new Map<string, InkGrid>();

export const useInkGrid = (text: string, fontFamily: string, weight: string | number): InkGrid | null => {
  const key = `${text}|${fontFamily}|${weight}`;
  const [grid, setGrid] = useState<InkGrid | null>(() => inkCache.get(key) ?? null);
  const [handle] = useState<number | null>(() => (inkCache.has(key) ? null : delayRender(`ink grid ${text}`)));
  useEffect(() => {
    const cached = inkCache.get(key);
    if (cached) {
      setGrid(cached);
      if (handle !== null) continueRender(handle);
      return;
    }
    let done = false;
    const S = 200;
    const fontCss = `${weight} ${S}px ${fontFamily}`;
    const run = () => {
      if (done) return;
      done = true;
      const c = document.createElement('canvas');
      const g = c.getContext('2d', {willReadFrequently: true});
      if (!g) {
        if (handle !== null) continueRender(handle);
        return;
      }
      g.font = fontCss;
      const adv = Math.max(10, g.measureText(text).width);
      const padX = S * 0.4;
      c.width = Math.ceil(adv + padX * 2);
      c.height = Math.ceil(S * 2);
      const g2 = c.getContext('2d', {willReadFrequently: true})!;
      g2.font = fontCss;
      g2.fillStyle = '#fff';
      g2.textBaseline = 'alphabetic';
      const baseY = S * 1.3;
      g2.fillText(text, padX, baseY);
      const W = c.width;
      const H = c.height;
      const d = g2.getImageData(0, 0, W, H).data;
      const st = 3;
      const cols = Math.ceil(W / st);
      const rows = Math.ceil(H / st);
      const m = new Uint8Array(cols * rows);
      let x0 = 1e9;
      let x1 = -1e9;
      let y0 = 1e9;
      let y1 = -1e9;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const px = Math.min(W - 1, x * st + 1);
          const py = Math.min(H - 1, y * st + 1);
          if (d[(py * W + px) * 4 + 3] > 110) {
            m[y * cols + x] = 1;
            x0 = Math.min(x0, x * st);
            x1 = Math.max(x1, x * st + st);
            y0 = Math.min(y0, y * st);
            y1 = Math.max(y1, y * st + st);
          }
        }
      if (x1 < x0) {
        x0 = 0;
        x1 = adv;
        y0 = baseY - S * 0.7;
        y1 = baseY;
      }
      const res: InkGrid = {
        x0: (x0 - padX) / S,
        x1: (x1 - padX) / S,
        y0: (y0 - baseY) / S,
        y1: (y1 - baseY) / S,
        has: (xe, ye) => {
          const px = Math.floor((xe * S + padX) / st);
          const py = Math.floor((ye * S + baseY) / st);
          if (px < 0 || py < 0 || px >= cols || py >= rows) return false;
          return m[py * cols + px] === 1;
        },
      };
      inkCache.set(key, res);
      setGrid(res);
      if (handle !== null) continueRender(handle);
    };
    const fs = (document as Document & {fonts?: FontFaceSet}).fonts;
    if (fs && fs.load) fs.load(fontCss, text).then(run, run);
    else run();
  }, [key, text, fontFamily, weight, handle]);
  return grid;
};

// =================================================================================================================
// notification icons (original glyphs, 24-unit grid, white on the app colour)
// =================================================================================================================
export type NotifIconName = 'bell' | 'chat' | 'mail' | 'cart' | 'heart' | 'check' | 'calendar' | 'card' | 'bolt' | 'user';
export const NotifIcon: React.FC<{name: string; size: number; color: string; bg?: string; radius?: number; glyph?: string}> = ({name, size, color, bg, radius, glyph = '#fff'}) => {
  const id = (name || 'bell') as NotifIconName;
  const r = radius ?? size * 0.24;
  const g = (() => {
    switch (id) {
      case 'chat':
        return <path d="M5 6h14a1.4 1.4 0 0 1 1.4 1.4v8A1.4 1.4 0 0 1 19 16.8h-7.2L8 20v-3.2H5a1.4 1.4 0 0 1-1.4-1.4v-8A1.4 1.4 0 0 1 5 6z" fill={glyph} />;
      case 'mail':
        return (
          <>
            <rect x="3.5" y="6" width="17" height="12" rx="2" fill={glyph} />
            <path d="M4.5 7.8L12 13.2l7.5-5.4" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case 'cart':
        return (
          <>
            <path d="M3.5 5h2.6l1.9 9.2h9.4l1.8-6.6H7" fill="none" stroke={glyph} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9.5" cy="18" r="1.5" fill={glyph} />
            <circle cx="16.5" cy="18" r="1.5" fill={glyph} />
          </>
        );
      case 'heart':
        return <path d="M12 19.5s-7-4.2-7-9.6a3.9 3.9 0 0 1 7-2.3 3.9 3.9 0 0 1 7 2.3c0 5.4-7 9.6-7 9.6z" fill={glyph} />;
      case 'check':
        return <path d="M5.5 12.6l4.3 4.3 8.7-9.6" fill="none" stroke={glyph} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'calendar':
        return (
          <>
            <rect x="4" y="5.5" width="16" height="14" rx="2.2" fill={glyph} />
            <rect x="4" y="5.5" width="16" height="4" rx="2" fill={glyph} opacity="0.55" />
            <rect x="8" y="3.5" width="2" height="4" rx="1" fill={glyph} />
            <rect x="14" y="3.5" width="2" height="4" rx="1" fill={glyph} />
            <rect x="7.5" y="12" width="3" height="3" rx="0.8" fill={color} />
          </>
        );
      case 'card':
        return (
          <>
            <rect x="3.5" y="6.5" width="17" height="11.5" rx="2.2" fill={glyph} />
            <rect x="3.5" y="9.4" width="17" height="2.4" fill={color} />
            <rect x="6" y="14.2" width="4.5" height="1.6" rx="0.8" fill={color} />
          </>
        );
      case 'bolt':
        return <path d="M13.4 3.5L6 13.4h5.2l-1 7.1 7.8-10.4h-5.4z" fill={glyph} />;
      case 'user':
        return (
          <>
            <circle cx="12" cy="8.6" r="3.6" fill={glyph} />
            <path d="M4.8 19.5c.7-3.6 3.5-5.4 7.2-5.4s6.5 1.8 7.2 5.4z" fill={glyph} />
          </>
        );
      case 'bell':
      default:
        return <path d="M12 3.6a5.6 5.6 0 0 0-5.6 5.6v3.2L4.6 15.6v1h14.8v-1l-1.8-3.2V9.2A5.6 5.6 0 0 0 12 3.6zm-2.1 14.4a2.1 2.1 0 0 0 4.2 0z" fill={glyph} />;
    }
  })();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flex: 'none'}}>
      <rect width="24" height="24" rx={(r / size) * 24} fill={bg ?? color} />
      {g}
    </svg>
  );
};
