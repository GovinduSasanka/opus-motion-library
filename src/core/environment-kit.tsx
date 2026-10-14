import React from 'react';
import {n2} from './random';

/**
 * Shared helpers for the environment/ family (weather, light, skies).
 * Every environment motion works both as a full scene (procedural backdrop) and as a
 * transparent overlay: pass `background: 'transparent'` (the backdrop is then skipped too)
 * or `backdrop: false` to keep a flat background colour without the painted scenery.
 */

export const TAU = Math.PI * 2;

/** positive modulo */
export const wrap = (v: number, m: number) => ((v % m) + m) % m;

/** particle-count multiplier relative to a 1920x1080 frame (keeps density constant across formats) */
export const areaK = (w: number, h: number) => (w * h) / (1920 * 1080);

/** true when the motion should render as an overlay (no painted backdrop) */
export const isTransparent = (bg: string | undefined) => !bg || bg === 'transparent' || bg === 'none';

/** fast integer hash -> 0..1, stable for any list of integers */
export const hash01 = (...n: number[]) => {
  let h = 2166136261 >>> 0;
  for (const v of n) {
    h = Math.imul(h ^ (Math.floor(v) | 0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};

/** string -> integer seed */
export const seedNum = (s: string | number) =>
  typeof s === 'number' ? s : [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703);

/** hex colour -> rgba() string */
export const rgba = (hex: string, a: number) => {
  const m = hex.replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m.padEnd(6, '0');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

/** mix two hex colours */
export const mixHex = (a: string, b: string, t: number) => {
  const p = (hex: string) => {
    const m = hex.replace('#', '');
    const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  };
  const A = p(a);
  const B = p(b);
  return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0')).join('');
};

/**
 * Silhouette ridge (mountains / hills / tree line) as a closed path down to `bottom`.
 * `ridged` gives sharp peaks (mountains), otherwise rolling hills.
 */
export const ridgePath = (
  seed: string,
  x0: number,
  x1: number,
  baseY: number,
  amp: number,
  wavelength: number,
  bottom: number,
  {ridged = false, octaves = 3, step = 6, phase = 0}: {ridged?: boolean; octaves?: number; step?: number; phase?: number} = {},
) => {
  const pts: string[] = [];
  for (let x = x0; x <= x1 + step; x += step) {
    let v = 0;
    let a = 1;
    let f = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      const n = n2(seed + o, ((x + phase) / wavelength) * f, o * 7.3);
      v += a * (ridged ? 1 - Math.abs(n) * 1.6 : n);
      norm += a;
      a *= 0.45;
      f *= 2.1;
    }
    v /= norm;
    pts.push(`${x.toFixed(1)},${(baseY - v * amp).toFixed(1)}`);
  }
  return `M ${x0},${bottom} L ${pts.join(' L ')} L ${x1 + step},${bottom} Z`;
};

/** linear gradient def from a list of stops (offset 0..1, colour, opacity) */
export const LinGrad: React.FC<{id: string; stops: [number, string, number?][]; x1?: number; y1?: number; x2?: number; y2?: number; units?: 'objectBoundingBox' | 'userSpaceOnUse'}> = ({
  id,
  stops,
  x1 = 0,
  y1 = 0,
  x2 = 0,
  y2 = 1,
  units = 'objectBoundingBox',
}) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits={units}>
    {stops.map(([o, c, a], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
    ))}
  </linearGradient>
);

/** Gaussian blur filter def with a generous region */
export const BlurFilter: React.FC<{id: string; std: number}> = ({id, std}) => (
  <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation={std} />
  </filter>
);

/**
 * Pixel-art look (video21): samples the source every `size` px and blows each sample up to a
 * size x size block; optional posterize (`levels`) and 2x2 ordered checker dither (`dither`,
 * only use on opaque content — it adds faint alpha on transparent areas).
 */
export const PixelateFilter: React.FC<{id: string; size: number; w: number; h: number; levels?: number; dither?: number}> = ({id, size, w, h, levels = 0, dither = 0}) => {
  const s = Math.max(2, Math.round(size));
  const half = Math.floor(s / 2);
  const table = levels > 1 ? Array.from({length: levels}, (_, i) => (i / (levels - 1)).toFixed(3)).join(' ') : '';
  return (
    <filter id={id} x={0} y={0} width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
      <feFlood x={half} y={half} width={1} height={1} floodColor="#000" floodOpacity={1} result="dot" />
      <feComposite in="dot" in2="dot" operator="over" x={0} y={0} width={s} height={s} result="cell" />
      <feTile in="cell" result="grid" />
      <feComposite in="SourceGraphic" in2="grid" operator="in" result="samp" />
      <feMorphology in="samp" operator="dilate" radius={half} result="pix" />
      {dither > 0 && (
        <>
          <feFlood x={0} y={0} width={s} height={s} floodColor="#fff" result="c1" />
          <feFlood x={s} y={s} width={s} height={s} floodColor="#fff" result="c2" />
          <feMerge result="c12">
            <feMergeNode in="c1" />
            <feMergeNode in="c2" />
          </feMerge>
          <feTile in="c12" result="checker" />
          <feComposite in="pix" in2="checker" operator="arithmetic" k1={0} k2={1} k3={dither} k4={-dither * 0.25} result="pix" />
        </>
      )}
      {levels > 1 && (
        <feComponentTransfer in="pix">
          <feFuncR type="discrete" tableValues={table} />
          <feFuncG type="discrete" tableValues={table} />
          <feFuncB type="discrete" tableValues={table} />
        </feComponentTransfer>
      )}
    </filter>
  );
};

type StarProps = {
  count: number;
  seed: number;
  w: number;
  h: number;
  u: number;
  t: number;
  color?: string;
  /** fractions of the frame [x0, y0, x1, y1] */
  area?: [number, number, number, number];
  size?: [number, number];
  opacity?: [number, number];
  twinkle?: number;
  /** 0..1 overall fade */
  fade?: number;
  square?: boolean;
  /** fraction of stars that get a soft glow + cross glint */
  glints?: number;
};

/** twinkling star dots (video15 starfield, video21 pixel stars) */
export const StarField: React.FC<StarProps> = ({count, seed, w, h, u, t, color = '#fdf3db', area = [0, 0, 1, 1], size = [1, 2.5], opacity = [0.3, 0.9], twinkle = 0.3, fade = 1, square = false, glints = 0.04}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const rx = hash01(seed, i, 1);
    const ry = hash01(seed, i, 2);
    const x = (area[0] + (area[2] - area[0]) * rx) * w;
    // bias stars toward the top of their area
    const y = (area[1] + (area[3] - area[1]) * Math.pow(ry, 1.25)) * h;
    const r = (size[0] + (size[1] - size[0]) * Math.pow(hash01(seed, i, 3), 2.2)) * u;
    const period = 1.5 + 1.5 * hash01(seed, i, 4);
    const ph = hash01(seed, i, 5) * TAU;
    const base = opacity[0] + (opacity[1] - opacity[0]) * hash01(seed, i, 6);
    const o = Math.max(0, Math.min(1, base + twinkle * Math.sin((TAU * t) / period + ph))) * fade;
    if (o < 0.02) continue;
    if (square) {
      const s = Math.max(2, Math.round(r * 2));
      out.push(<rect key={i} x={Math.round(x)} y={Math.round(y)} width={s} height={s} fill={color} opacity={o} />);
    } else {
      out.push(<circle key={i} cx={x} cy={y} r={r} fill={color} opacity={o} />);
    }
    if (!square && hash01(seed, i, 7) < glints) {
      const L = r * 7;
      out.push(
        <g key={`g${i}`} opacity={o * 0.7}>
          <circle cx={x} cy={y} r={r * 3.5} fill={color} opacity={0.12} />
          <path d={`M ${x - L} ${y} L ${x + L} ${y} M ${x} ${y - L} L ${x} ${y + L}`} stroke={color} strokeWidth={0.6 * u} strokeLinecap="round" opacity={0.6} />
        </g>,
      );
    }
  }
  return <g>{out}</g>;
};

/** default 3-layer rain (video16 rain-overlay): far / mid / near at 1080p pixel units */
export const RAIN_LAYERS = [
  {count: 600, speed: 1200, length: 35, opacity: 0.12, width: 1},
  {count: 300, speed: 1800, length: 70, opacity: 0.22, width: 1.4},
  {count: 150, speed: 2600, length: 120, opacity: 0.32, width: 1.7},
];

type RainProps = {
  t: number;
  w: number;
  h: number;
  u: number;
  seed?: number;
  /** count multiplier */
  density?: number;
  /** speed multiplier */
  speed?: number;
  /** degrees from vertical; positive = falls toward the right */
  angle?: number;
  color?: string;
  /** 1..3 parallax layers (far first) */
  layers?: number;
  lengthScale?: number;
  opacityScale?: number;
  clipPath?: string;
};

/**
 * Slanted rain streaks, 3 parallax layers. Each layer is drawn as 3 path elements (opacity
 * buckets) of many `M L` segments, so 1000+ streaks cost only ~9 DOM nodes.
 * y = (y0 + v·t) mod (H + L); x = x0 + y·tan(angle).
 */
export const RainField: React.FC<RainProps> = ({t, w, h, u, seed = 1, density = 1, speed = 1, angle = 8, color = '#c8d6e5', layers = 3, lengthScale = 1, opacityScale = 1, clipPath}) => {
  const k = areaK(w, h) * density;
  const tan = Math.tan((angle * Math.PI) / 180);
  const sin = Math.sin((angle * Math.PI) / 180);
  const cos = Math.cos((angle * Math.PI) / 180);
  const use = RAIN_LAYERS.slice(3 - Math.max(1, Math.min(3, Math.round(layers))));
  return (
    <g clipPath={clipPath} strokeLinecap="round" fill="none">
      {use.map((L, li) => {
        const n = Math.round(L.count * k);
        const len = L.length * u * lengthScale;
        const v = L.speed * u * speed;
        const span = h + len * 2;
        const xMin = -Math.max(0, tan) * h - len;
        const xMax = w - Math.min(0, tan) * h + len;
        const buckets = ['', '', ''];
        for (let i = 0; i < n; i++) {
          const r1 = hash01(seed, li, i, 1);
          const r2 = hash01(seed, li, i, 2);
          const r3 = hash01(seed, li, i, 3);
          const vv = v * (0.85 + 0.3 * r3);
          const y = wrap(r2 * span + vv * t, span) - len;
          const x = xMin + r1 * (xMax - xMin) + y * tan;
          const l = len * (0.7 + 0.6 * hash01(seed, li, i, 4));
          if (x < -len || x > w + len) continue;
          const b = Math.floor(hash01(seed, li, i, 5) * 3);
          buckets[b] += `M${x.toFixed(1)} ${y.toFixed(1)}l${(-l * sin).toFixed(1)} ${(-l * cos).toFixed(1)}`;
        }
        return buckets.map((d, bi) => (d ? <path key={`${li}-${bi}`} d={d} stroke={color} strokeWidth={L.width * u} opacity={Math.min(1, L.opacity * opacityScale * (0.65 + bi * 0.35))} /> : null));
      })}
    </g>
  );
};

/** flat cartoon cloud made of overlapping circles on a flat base (video1 / video6 skies) */
export const CloudPuff: React.FC<{x: number; y: number; s: number; color?: string; shade?: string; seed?: number; opacity?: number}> = ({x, y, s, color = '#ffffff', shade = '#dfe8ef', seed = 1, opacity = 1}) => {
  const n = 5;
  const circles: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const fx = (i / (n - 1) - 0.5) * 2;
    const r = s * (0.32 + 0.28 * (1 - Math.abs(fx)) + 0.12 * hash01(seed, i));
    circles.push([x + fx * s * 0.75, y - r * 0.55, r]);
  }
  return (
    <g opacity={opacity}>
      <ellipse cx={x} cy={y + s * 0.04} rx={s * 1.05} ry={s * 0.16} fill={shade} />
      {circles.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={color} />
      ))}
      <rect x={x - s * 1.05} y={y - s * 0.16} width={s * 2.1} height={s * 0.2} rx={s * 0.1} fill={color} />
    </g>
  );
};
