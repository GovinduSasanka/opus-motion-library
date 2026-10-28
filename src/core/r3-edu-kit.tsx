import React from 'react';
import {sh} from './r2-s1-kit';

/** Shared helpers for the round-3 education / kids / language motions. */

/** rough advance width of a string in em (CJK / full-width glyphs ~1em, latin ~`base`em) */
export const textEm = (s: string, base = 0.58) => {
  let t = 0;
  for (const ch of String(s ?? '')) {
    const c = ch.codePointAt(0) ?? 0;
    if (c >= 0x2e80) t += 1;
    else if (ch === ' ') t += base * 0.5;
    else if ('ilI.,:;|!\'`'.includes(ch)) t += base * 0.5;
    else if ('mwMW'.includes(ch)) t += base * 1.3;
    else t += base;
  }
  return t;
};

/** points of an n-pointed star centred on (cx,cy) as an SVG polygon string */
export const starPoints = (cx: number, cy: number, r: number, inner = 0.46, n = 5, rot = -Math.PI / 2) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = rot + (i * Math.PI) / n;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return pts.join(' ');
};

/** rounded-corner star path (smooth, friendlier than a polygon) */
export const roundStarPath = (cx: number, cy: number, r: number, inner = 0.5, n = 5, round = 0.18) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = '';
  const m = pts.length;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i + m - 1) % m];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % m];
    const a = [p1[0] + (p0[0] - p1[0]) * round, p1[1] + (p0[1] - p1[1]) * round];
    const b = [p1[0] + (p2[0] - p1[0]) * round, p1[1] + (p2[1] - p1[1]) * round];
    d += (i === 0 ? 'M' : 'L') + `${a[0].toFixed(2)} ${a[1].toFixed(2)}Q${p1[0].toFixed(2)} ${p1[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  }
  return d + 'Z';
};

/** deterministic confetti / spark burst: `t` is 0..1 progress, pieces fly from (x,y) */
export const Burst: React.FC<{x: number; y: number; t: number; colors: string[]; n?: number; radius: number; seed?: number; size?: number}> = ({x, y, t, colors, n = 14, radius, seed = 1, size = 10}) => {
  if (t <= 0 || t >= 1) return null;
  const e = 1 - Math.pow(1 - t, 3);
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + sh(seed, i) * 0.6;
        const d = radius * (0.55 + 0.6 * sh(seed, i, 2)) * e;
        const fall = radius * 0.35 * t * t;
        const px = x + Math.cos(a) * d;
        const py = y + Math.sin(a) * d + fall;
        const s = size * (0.6 + 0.8 * sh(seed, i, 3)) * (1 - t * 0.7);
        const c = colors[i % colors.length];
        const rot = sh(seed, i, 4) * 360 + t * 360;
        return i % 3 === 0 ? (
          <circle key={i} cx={px} cy={py} r={s * 0.55} fill={c} opacity={1 - t * t} />
        ) : (
          <rect key={i} x={px - s / 2} y={py - s / 4} width={s} height={s / 2} rx={s * 0.15} fill={c} opacity={1 - t * t} transform={`rotate(${rot} ${px} ${py})`} />
        );
      })}
    </g>
  );
};

/** is a string/number prop usable as a list? returns the fallback if the prop is not a non-empty array */
export const list = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) && v.length ? (v as T[]) : fallback);
