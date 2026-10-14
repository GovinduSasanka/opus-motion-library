import React from 'react';
import {interpolateColors} from 'remotion';
import {clamp, ease} from './ease';
import {rng, range} from './random';

/**
 * Shared building blocks for the environment "worlds" motions (grass-field, sun-rise-set, topdown-terrain,
 * parallax-landscape, city-skyline, depth-descent, flock, fish-school, insect-flight, fireworks, time-of-day-grade).
 */

// ---------------------------------------------------------------- colour

export const hexRgb = (hex: string): [number, number, number] => {
  if (hex.startsWith('rgb')) {
    const v = hex.slice(hex.indexOf('(') + 1, hex.indexOf(')')).split(',').map((x) => parseFloat(x));
    return [v[0] || 0, v[1] || 0, v[2] || 0];
  }
  const m = hex.replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m.slice(0, 6);
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');

/** mix two hex colours (t = 0 -> a, 1 -> b) */
export const mix = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = clamp(t);
  return toHex(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k);
};
/** darken (k < 0) or lighten (k > 0) a hex colour */
export const shade = (hex: string, k: number) => (k < 0 ? mix(hex, '#000000', -k) : mix(hex, '#ffffff', k));

/** colour along keyframed stops (stops in any monotonic unit) */
export const ramp = (v: number, stops: number[], colors: string[]) =>
  interpolateColors(clamp(v, stops[0], stops[stops.length - 1]), stops, colors);

// ---------------------------------------------------------------- geometry batching

/** many circles as ONE path (cheap to render: one DOM node per colour) */
export const circlesD = (cs: {x: number; y: number; r: number}[]) =>
  cs
    .map(({x, y, r}) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0Z`)
    .join('');

/** many polygons as ONE path */
export const polysD = (ps: [number, number][][]) =>
  ps.map((p) => 'M' + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z').join('');

/** periodic 1-D ridge noise in -1..1: integer-frequency sines over period P, so it tiles seamlessly */
export const makeRidge = (seed: string | number, P: number, freqs = [1, 2, 3, 5, 8, 13], falloff = 0.6) => {
  const r = rng(seed);
  const terms = freqs.map((k, i) => ({k, a: Math.pow(falloff, i) * (0.6 + 0.4 * r()), ph: r() * Math.PI * 2}));
  const norm = terms.reduce((s, t) => s + t.a, 0);
  return (x: number) => terms.reduce((s, t) => s + t.a * Math.sin((2 * Math.PI * t.k * x) / P + t.ph), 0) / norm;
};

/** closed silhouette path for a ridge line y = baseY - amp*f(x) over [x0, x1], filled down to `bottom` */
export const ridgePath = (f: (x: number) => number, x0: number, x1: number, baseY: number, amp: number, bottom: number, step = 8) => {
  let d = `M${x0.toFixed(1)} ${bottom.toFixed(1)}`;
  for (let x = x0; x <= x1 + step; x += step) d += `L${x.toFixed(1)} ${(baseY - amp * f(x)).toFixed(1)}`;
  return d + `L${(x1 + step).toFixed(1)} ${bottom.toFixed(1)}Z`;
};

// ---------------------------------------------------------------- sky bits

export const Stars: React.FC<{w: number; h: number; u: number; frame: number; count?: number; seed?: string; color?: string; opacity?: number; maxY?: number}> = ({
  w,
  h,
  u,
  frame,
  count = 90,
  seed = 'stars',
  color = '#fdf3db',
  opacity = 1,
  maxY = 0.7,
}) => {
  const r = rng(seed);
  const stars = Array.from({length: count}, () => ({x: r() * w, y: r() * h * maxY, s: range(r, 0.8, 2.4), p: r() * 6.28, sp: range(r, 0.05, 0.16)}));
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s * u} fill={color} opacity={0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * s.sp + s.p))} />
      ))}
    </g>
  );
};

/** crescent moon (cut by an offset disc through a mask) */
export const Moon: React.FC<{x: number; y: number; r: number; id: string; color?: string; phase?: number; glow?: number; opacity?: number}> = ({x, y, r, id, color = '#fdf3db', phase = 0.42, glow = 0.35, opacity = 1}) => (
  <g opacity={opacity}>
    <defs>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={x - r * 2} y={y - r * 2} width={r * 4} height={r * 4}>
        <circle cx={x} cy={y} r={r} fill="#fff" />
        <circle cx={x + r * phase * 1.25} cy={y - r * phase * 0.55} r={r * 0.95} fill="#000" />
      </mask>
      <radialGradient id={`${id}-g`}>
        <stop offset="0%" stopColor={color} stopOpacity={glow} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * 3} fill={`url(#${id}-g)`} />
    <circle cx={x} cy={y} r={r} fill={color} mask={`url(#${id}-m)`} />
  </g>
);

// ---------------------------------------------------------------- grass (video15 grass-blade-field)

export type GrassRow = {
  /** blade spacing in u */
  spacing: number;
  hMin: number;
  hMax: number;
  wMin: number;
  wMax: number;
  base: string;
  tip: string;
  opacity?: number;
  /** 'blade' = thin tapered teal blade, 'leaf' = fat pointed oval with midrib (golden leaves) */
  kind?: 'blade' | 'leaf';
  /** extra y offset of the row baseline (u, + = lower) */
  dy?: number;
  /** x offset of the row as a fraction of spacing (staggered leaf rows) */
  xOff?: number;
  /** spacing jitter 0..1 */
  jitter?: number;
  /** grow-up start (frames) and spread window (frames) */
  growAt?: number;
  growSpread?: number;
};

/** teal blade rows back -> front (video15 palette #253a43/#2b4b53 -> #3f7f86) */
export const tealRows = (k = 1): GrassRow[] => [
  {spacing: 30, hMin: 130 * k, hMax: 260 * k, wMin: 18, wMax: 30, base: '#101d24', tip: '#2b5a62', dy: -18, jitter: 0.9},
  {spacing: 27, hMin: 160 * k, hMax: 330 * k, wMin: 20, wMax: 34, base: '#17282f', tip: '#356c73', dy: 0, jitter: 0.9},
  {spacing: 24, hMin: 170 * k, hMax: 370 * k, wMin: 22, wMax: 36, base: '#1c2f37', tip: '#3f7f86', dy: 14, jitter: 0.9},
];

/** staggered rows of golden pointed leaves (video15 #74461d / #85542c / #b07a35), drawn back -> front */
export const goldenRows = (k = 1, growAt = 30, rows = 4): GrassRow[] =>
  Array.from({length: rows}, (_, i) => ({
    spacing: 96 * k,
    hMin: 140 * k,
    hMax: 160 * k,
    wMin: 84 * k,
    wMax: 94 * k,
    base: i % 2 ? '#5e3816' : '#6a3f1a',
    tip: i % 2 ? '#a8742f' : '#b8843a',
    kind: 'leaf' as const,
    dy: -150 * k + i * 56 * k,
    xOff: i % 2 ? 0.5 : 0,
    jitter: 0.08,
    growAt: growAt + i * 3,
    growSpread: 16,
  }));

type Blade = {x: number; h: number; bw: number; lean: number; curve: number; delay: number; ph: number; tone: number; v: number; dy: number};

const makeRow = (row: GrassRow, seed: string, x0: number, x1: number, u: number): Blade[] => {
  const r = rng(seed);
  const out: Blade[] = [];
  const step = row.spacing * u;
  const leaf = row.kind === 'leaf';
  const jit = row.jitter ?? 0.6;
  let x = x0 + (row.xOff ?? r()) * step - step;
  while (x < x1 + step) {
    out.push({
      x: x + (leaf ? range(r, -0.05, 0.05) * step : 0),
      h: range(r, row.hMin, row.hMax) * u,
      bw: range(r, row.wMin, row.wMax) * u,
      lean: leaf ? range(r, -4, 4) : range(r, -16, 16),
      curve: range(r, -0.12, 0.12),
      delay: r(),
      ph: r() * 6.28,
      tone: r(),
      v: Math.floor(r() * 3),
      dy: leaf ? range(r, -4, 4) * u : range(r, -6, 10) * u,
    });
    x += step * (1 + range(r, -jit, jit) * 0.5);
  }
  return out;
};

/** wind sway in degrees: base sine (2.5 s period, phase along x) + travelling gusts */
export const windAngle = (x: number, frame: number, w: number, u: number, amp = 2, gust = 6, windSpeed = 1) => {
  const t = (frame / 30) * windSpeed;
  const base = amp * Math.sin(2 * Math.PI * (t / 2.5) + (x / u) * 0.01);
  // gust front travelling left -> right every ~3.2 s
  const period = 3.2;
  const gp = (t / period) % 1;
  const gx = -0.3 * w + gp * 1.6 * w;
  const g = Math.exp(-Math.pow((x - gx) / (0.22 * w), 2));
  return base + gust * g * Math.sin(Math.PI * Math.min(1, gp * 3));
};

/**
 * Procedural tapered grass blades / golden leaves with staggered grow-up and wind sway.
 * Rows are drawn back to front in the given order.
 */
export const GrassField: React.FC<{
  id: string;
  rows: GrassRow[];
  baseY: number;
  x0: number;
  x1: number;
  u: number;
  w: number;
  frame: number;
  seed?: string;
  swayAmp?: number;
  gust?: number;
  windSpeed?: number;
  /** grow-up: start frame & window for rows without their own growAt; <0 = already grown */
  growAt?: number;
  growSpread?: number;
  /** extra lean (deg) applied to every blade, e.g. bent by speed */
  bend?: number;
}> = ({id, rows, baseY, x0, x1, u, w, frame, seed = 'grass', swayAmp = 2, gust = 6, windSpeed = 1, growAt = -1, growSpread = 18, bend = 0}) => {
  const data = rows.map((row, i) => makeRow(row, `${seed}-${i}`, x0, x1, u));
  return (
    <g>
      <defs>
        {rows.map((row, i) =>
          [0, 1, 2].map((v) => (
            <linearGradient key={`${i}-${v}`} id={`${id}-g${i}-${v}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={row.base} />
              <stop offset="100%" stopColor={v === 0 ? row.tip : v === 1 ? shade(row.tip, -0.22) : shade(row.tip, 0.1)} />
            </linearGradient>
          )),
        )}
      </defs>
      {rows.map((row, i) => {
        const ga = row.growAt ?? growAt;
        const gs = row.growSpread ?? growSpread;
        const leaf = row.kind === 'leaf';
        return (
          <g key={i} opacity={row.opacity ?? 1}>
            {data[i].map((b, j) => {
              let g = 1;
              if (ga >= 0) {
                const st = ga + b.delay * gs;
                const p = clamp((frame - st) / 8);
                g = p <= 0 ? 0 : ease.back(p);
              }
              if (g <= 0.001) return null;
              const rot = b.lean + windAngle(b.x, frame, w, u, swayAmp, gust, windSpeed) * (leaf ? 0.45 : 1) + bend * (leaf ? 0.3 : 1);
              const hh = b.h;
              const bw = b.bw;
              const c = b.curve * hh;
              const d = leaf
                ? `M0 0C${(bw * 0.62).toFixed(1)} ${(-hh * 0.18).toFixed(1)} ${(bw * 0.5).toFixed(1)} ${(-hh * 0.7).toFixed(1)} 0 ${(-hh).toFixed(1)}C${(-bw * 0.5).toFixed(1)} ${(-hh * 0.7).toFixed(1)} ${(-bw * 0.62).toFixed(1)} ${(-hh * 0.18).toFixed(1)} 0 0Z`
                : `M${(-bw / 2).toFixed(1)} 0Q${(-bw * 0.28 + c * 0.3).toFixed(1)} ${(-hh * 0.5).toFixed(1)} ${c.toFixed(1)} ${(-hh).toFixed(1)}Q${(bw * 0.24 + c * 0.3).toFixed(1)} ${(-hh * 0.45).toFixed(1)} ${(bw / 2).toFixed(1)} 0Z`;
              return (
                <g key={j} transform={`translate(${b.x.toFixed(1)},${(baseY + (row.dy ?? 0) * u + b.dy).toFixed(1)}) rotate(${rot.toFixed(2)}) scale(1,${g.toFixed(3)})`}>
                  <path d={d} fill={`url(#${id}-g${i}-${b.v})`} opacity={leaf ? 1 : 0.82 + b.tone * 0.18} />
                  {leaf && <path d={`M0 0C${(bw * 0.62).toFixed(1)} ${(-hh * 0.18).toFixed(1)} ${(bw * 0.5).toFixed(1)} ${(-hh * 0.7).toFixed(1)} 0 ${(-hh).toFixed(1)}Z`} fill="#000" opacity={0.08 + b.tone * 0.06} />}
                  {leaf && <path d={`M0 ${(-hh * 0.06).toFixed(1)}L0 ${(-hh * 0.86).toFixed(1)}`} stroke={shade(row.base, -0.3)} strokeWidth={1.2 * u} opacity={0.35} />}
                  {!leaf && <path d={`M${(c * 0.02).toFixed(1)} 0Q${(c * 0.3).toFixed(1)} ${(-hh * 0.5).toFixed(1)} ${c.toFixed(1)} ${(-hh).toFixed(1)}L${(bw / 2).toFixed(1)} 0Z`} fill="#000" opacity={0.12} />}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- paper crane (video1)

export const PAPER = {lit: '#e6decd', shade: '#d1c9bb', deep: '#c4bba9', top: '#efebe3', crease: '#bdb6a8', ink: '#2a2630'};

/**
 * Side-view origami crane facing LEFT, flapping (wings rotate about the body axis).
 * `flap` is the wing angle in degrees (+ up, - down). Size = half body length.
 */
export const PaperCraneSide: React.FC<{x: number; y: number; size: number; flap: number; u: number; tint?: number; rotate?: number; flip?: boolean}> = ({x, y, size: s, flap, u, tint = 0, rotate = 0, flip = false}) => {
  const P = (px: number, py: number) => `${(px * s).toFixed(1)},${(py * s).toFixed(1)}`;
  const a = (flap * Math.PI) / 180;
  const sinA = Math.sin(a);
  const lit = mix(PAPER.lit, '#8d94a3', tint);
  const sh = mix(PAPER.shade, '#7d8493', tint);
  const deep = mix(PAPER.deep, '#6c7382', tint);
  const ink = PAPER.ink;
  const sw = 1.6 * u;
  // wing tip (near) projected: span 1.05 s, lying slightly back
  const tipNear: [number, number] = [0.12 + 0.25 * (1 - Math.abs(sinA)), -0.02 - 1.05 * sinA];
  const tipFar: [number, number] = [0.22 + 0.2 * (1 - Math.abs(sinA)), -0.1 - 0.95 * sinA];
  const nearUnder = sinA < 0;
  return (
    <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rotate}) scale(${flip ? -1 : 1},1)`} strokeLinejoin="round">
      {/* far wing */}
      <polygon points={`${P(-0.18, -0.08)} ${P(0.22, -0.08)} ${P(tipFar[0], tipFar[1])}`} fill={deep} stroke={ink} strokeWidth={sw} />
      {/* tail */}
      <polygon points={`${P(0.1, 0.06)} ${P(0.34, 0.02)} ${P(0.78, -0.5)}`} fill={sh} stroke={ink} strokeWidth={sw} />
      {/* neck + head */}
      <polygon points={`${P(-0.1, 0.06)} ${P(-0.34, 0.02)} ${P(-0.7, -0.52)}`} fill={lit} stroke={ink} strokeWidth={sw} />
      <polygon points={`${P(-0.7, -0.52)} ${P(-0.66, -0.47)} ${P(-0.86, -0.42)}`} fill={sh} stroke={ink} strokeWidth={sw} />
      {/* body (keel) */}
      <polygon points={`${P(-0.36, 0.02)} ${P(0, -0.08)} ${P(0.36, 0.02)} ${P(0, 0.24)}`} fill={sh} stroke={ink} strokeWidth={sw} />
      <polygon points={`${P(-0.36, 0.02)} ${P(0, -0.08)} ${P(0, 0.24)}`} fill={lit} stroke={ink} strokeWidth={sw * 0.8} />
      <line x1={0} y1={-0.08 * s} x2={0} y2={0.24 * s} stroke={PAPER.crease} strokeWidth={u} />
      {/* near wing */}
      <polygon points={`${P(-0.22, -0.04)} ${P(0.2, -0.04)} ${P(tipNear[0], tipNear[1])}`} fill={nearUnder ? sh : lit} stroke={ink} strokeWidth={sw} />
      <line x1={0} y1={-0.04 * s} x2={tipNear[0] * s * 0.8} y2={tipNear[1] * s * 0.8} stroke={PAPER.crease} strokeWidth={u} opacity={0.8} />
    </g>
  );
};

/** top-down origami crane heading toward local -y; `spread` 0.8..1 = wing foreshortening during a flap */
export const PaperCraneTop: React.FC<{size: number; spread: number; u: number; fill?: string; shadeFill?: string; ink?: string; stroke?: boolean}> = ({size: s, spread, u, fill, shadeFill, ink = PAPER.ink, stroke = true}) => {
  const P = (px: number, py: number) => `${(px * s).toFixed(1)},${(py * s).toFixed(1)}`;
  const sw = stroke ? 1.6 * u : 0;
  const st = stroke ? ink : 'none';
  const lit = fill ?? PAPER.top;
  const sh = shadeFill ?? PAPER.shade;
  return (
    <g strokeLinejoin="round">
      {/* wings */}
      <polygon points={`${P(0, -0.44)} ${P(0, 0.26)} ${P(-1.05 * spread, 0.22)}`} fill={sh} stroke={st} strokeWidth={sw} />
      <polygon points={`${P(0, -0.44)} ${P(0, 0.26)} ${P(1.05 * spread, 0.22)}`} fill={lit} stroke={st} strokeWidth={sw} />
      {stroke && <line x1={0} y1={-0.1 * s} x2={-0.8 * spread * s} y2={0.2 * s} stroke={PAPER.crease} strokeWidth={u} opacity={0.7} />}
      {/* neck & head */}
      <polygon points={`${P(-0.07, -0.18)} ${P(0.07, -0.18)} ${P(0.0, -0.92)}`} fill={lit} stroke={st} strokeWidth={sw} />
      <polygon points={`${P(0.0, -0.92)} ${P(0.03, -0.84)} ${P(0.11, -0.96)}`} fill={sh} stroke={st} strokeWidth={sw} />
      {/* tail */}
      <polygon points={`${P(-0.07, 0.2)} ${P(0.07, 0.2)} ${P(0.0, 0.86)}`} fill={sh} stroke={st} strokeWidth={sw} />
      {/* body ridge */}
      <polygon points={`${P(0, -0.42)} ${P(0.14, 0.02)} ${P(0, 0.4)} ${P(-0.14, 0.02)}`} fill={lit} stroke={st} strokeWidth={sw} />
      {stroke && <line x1={0} y1={-0.42 * s} x2={0} y2={0.4 * s} stroke={PAPER.crease} strokeWidth={u} />}
      {stroke && <line x1={0} y1={-0.1 * s} x2={0.8 * spread * s} y2={0.2 * s} stroke={PAPER.crease} strokeWidth={u} opacity={0.7} />}
    </g>
  );
};

// ---------------------------------------------------------------- sea life (video23 sprite-swim-cycle)

/** stylised fish facing +x; tail wiggle in degrees */
export const Fish: React.FC<{len: number; wiggle: number; body?: string; belly?: string; fin?: string; eye?: boolean; id: string}> = ({len: L, wiggle, body = '#3d6f86', belly = '#b8dbe2', fin, eye = true, id}) => {
  const H = L * 0.36;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={body} />
          <stop offset="55%" stopColor={mix(body, belly, 0.55)} />
          <stop offset="100%" stopColor={belly} />
        </linearGradient>
      </defs>
      <g transform={`translate(${(-L * 0.36).toFixed(1)},0) rotate(${wiggle.toFixed(2)})`}>
        <path d={`M0 0L${(-L * 0.24).toFixed(1)} ${(-H * 0.62).toFixed(1)}Q${(-L * 0.17).toFixed(1)} 0 ${(-L * 0.24).toFixed(1)} ${(H * 0.62).toFixed(1)}Z`} fill={fin ?? shade(body, -0.15)} />
      </g>
      <path
        d={`M${(L * 0.5).toFixed(1)} 0C${(L * 0.38).toFixed(1)} ${(-H * 0.62).toFixed(1)} ${(-L * 0.12).toFixed(1)} ${(-H * 0.62).toFixed(1)} ${(-L * 0.38).toFixed(1)} ${(wiggle * 0.004 * L).toFixed(1)}C${(-L * 0.12).toFixed(1)} ${(H * 0.62).toFixed(1)} ${(L * 0.38).toFixed(1)} ${(H * 0.55).toFixed(1)} ${(L * 0.5).toFixed(1)} 0Z`}
        fill={`url(#${id})`}
      />
      <path d={`M${(L * 0.05).toFixed(1)} ${(-H * 0.45).toFixed(1)}L${(-L * 0.14).toFixed(1)} ${(-H * 0.78).toFixed(1)}L${(-L * 0.18).toFixed(1)} ${(-H * 0.38).toFixed(1)}Z`} fill={fin ?? shade(body, -0.15)} opacity={0.9} />
      {eye && <circle cx={L * 0.32} cy={-H * 0.08} r={L * 0.04} fill="#0b1620" />}
      {eye && <circle cx={L * 0.33} cy={-H * 0.11} r={L * 0.015} fill="#fff" opacity={0.8} />}
    </g>
  );
};

/** pulsing jellyfish; `pulse` 0..1 contraction (bell squashes), tentacles lag */
export const Jellyfish: React.FC<{r: number; pulse: number; lag: number; color?: string; glow?: string; id: string; frame: number; seed?: number}> = ({r, pulse, lag, color = '#c7b8ff', glow = '#8a7cff', id, frame, seed = 0}) => {
  const sy = 1 - 0.15 * pulse;
  const sx = 1 + 0.08 * pulse;
  const tent = Array.from({length: 7}, (_, i) => i);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-b`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.85} />
          <stop offset="45%" stopColor={color} stopOpacity={0.65} />
          <stop offset="100%" stopColor={glow} stopOpacity={0.25} />
        </radialGradient>
        <radialGradient id={`${id}-h`}>
          <stop offset="0%" stopColor={glow} stopOpacity={0.45} />
          <stop offset="100%" stopColor={glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={0} cy={r * 0.4} r={r * 2.6} fill={`url(#${id}-h)`} />
      {tent.map((i) => {
        const x0 = (i / 6 - 0.5) * r * 1.4 * sx;
        const sway = Math.sin(frame * 0.09 + i * 0.9 + seed) * r * 0.25 + lag * r * 0.6 * (i % 2 ? 1 : -1) * 0.3;
        const len = r * (2.2 + (i % 3) * 0.5);
        return (
          <path
            key={i}
            d={`M${x0.toFixed(1)} ${(r * 0.15).toFixed(1)}C${(x0 + sway).toFixed(1)} ${(r * 0.8 + len * 0.2).toFixed(1)} ${(x0 - sway).toFixed(1)} ${(len * 0.6).toFixed(1)} ${(x0 + sway * 0.6).toFixed(1)} ${len.toFixed(1)}`}
            stroke={color}
            strokeWidth={Math.max(0.8, r * 0.05)}
            fill="none"
            opacity={0.6}
          />
        );
      })}
      <g transform={`scale(${sx.toFixed(3)},${sy.toFixed(3)})`}>
        <path d={`M${-r} ${r * 0.18}C${-r} ${-r * 1.15} ${r} ${-r * 1.15} ${r} ${r * 0.18}Q${r * 0.5} ${r * 0.05} 0 ${r * 0.22}Q${-r * 0.5} ${r * 0.05} ${-r} ${r * 0.18}Z`} fill={`url(#${id}-b)`} />
        <path d={`M${-r * 0.55} ${-r * 0.1}C${-r * 0.4} ${-r * 0.65} ${r * 0.4} ${-r * 0.65} ${r * 0.55} ${-r * 0.1}`} stroke="#fff" strokeWidth={r * 0.06} fill="none" opacity={0.35} />
      </g>
    </g>
  );
};
