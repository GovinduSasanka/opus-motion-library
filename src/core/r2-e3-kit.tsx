import React from 'react';
import {getLength, getPointAtLength} from '@remotion/paths';
import {noise2D} from '@remotion/noise';
import {clamp} from './ease';

/**
 * Shared helpers for round-2 "EXTENDS" group E3 (line-draw-on media / hand, handwrite-on marker + brush,
 * hud-chrome survey, ...). Pure functions of their arguments; no timers, no randomness other than seeded noise.
 */

export type P2 = [number, number];

/** resample an SVG path into points roughly `step` apart (path units) */
export const resamplePath = (d: string, step: number): P2[] => {
  let len = 0;
  try {
    len = getLength(d);
  } catch {
    len = 0;
  }
  if (!(len > 0)) return [];
  const n = Math.max(2, Math.ceil(len / Math.max(0.5, step)));
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const pt = getPointAtLength(d, (len * i) / n);
    out.push([pt?.x ?? 0, pt?.y ?? 0]);
  }
  return out;
};

/** offset a polyline along its normals with two octaves of seeded noise (hand wobble) */
export const wobblePolyline = (pts: P2[], seed: string, amp: number, freq = 0.018, boil = 0): P2[] => {
  if (pts.length < 2) return pts;
  let acc = 0;
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    if (i > 0) acc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    const k = noise2D(seed, acc * freq, boil) * 0.65 + noise2D(seed + 'b', acc * freq * 2.7, boil + 7) * 0.35;
    return [p[0] + (-dy / l) * k * amp, p[1] + (dx / l) * k * amp] as P2;
  });
};

/**
 * variable-width stroke as one filled polygon path.
 * `p` = fraction of the stroke drawn from the start, `from` = fraction erased from the tail (0..1),
 * `taper` = 0..1 how much both ends thin out, `noise` = width jitter 0..1.
 */
export const taperPolygon = (pts: P2[], width: number, p: number, from = 0, taper = 0.5, noise = 0.15, seed = 'tp'): string => {
  const n = pts.length;
  if (n < 2 || p <= from) return '';
  const i0 = Math.floor(from * (n - 1));
  const i1 = Math.max(i0 + 1, Math.ceil(p * (n - 1)));
  const left: P2[] = [];
  const right: P2[] = [];
  const total = Math.max(1, i1 - i0);
  for (let i = i0; i <= i1; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const t = (i - i0) / total;
    const edge = Math.pow(Math.sin(Math.PI * clamp(t * 0.96 + 0.02)), 0.4);
    const wMul = 1 - taper * (1 - edge);
    const jit = 1 + noise * noise2D(seed, i * 0.21, 3.3);
    const hw = (width * wMul * jit) / 2;
    const nx = (-dy / l) * hw;
    const ny = (dx / l) * hw;
    left.push([pts[i][0] + nx, pts[i][1] + ny]);
    right.push([pts[i][0] - nx, pts[i][1] - ny]);
  }
  const f = (q: P2) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
  return `M ${f(left[0])} L ${left.slice(1).map(f).join(' L ')} L ${right.reverse().map(f).join(' L ')} Z`;
};

/** dash array for a stroke split into pieces that each shrink around their own centre (cable retract) */
export const retractDash = (len: number, pieces: number, shrink: number, seed = 'rt'): {strokeDasharray: string; strokeDashoffset: number} => {
  const cuts: number[] = [0];
  for (let i = 1; i < pieces; i++) cuts.push((i + 0.35 * noise2D(seed, i * 1.7, 0.5)) / pieces);
  cuts.push(1);
  const parts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < pieces; i++) {
    const a = cuts[i] * len;
    const b = cuts[i + 1] * len;
    const mid = (a + b) / 2;
    const half = ((b - a) / 2) * clamp(1 - shrink);
    const s = mid - half;
    const e = mid + half;
    parts.push(Math.max(0, s - cursor), Math.max(0.0001, e - s));
    cursor = e;
  }
  parts.push(len * 2);
  return {strokeDasharray: parts.join(' '), strokeDashoffset: 0};
};

/** the hand + tool sprite for whiteboard / chalkboard / paper draw-ons; tip is at (0,0), up-left of the body */
export const HandTool: React.FC<{x: number; y: number; scale: number; tool: 'marker' | 'pen' | 'chalk'; color: string; lift: number; skin?: string}> = ({x, y, scale, tool, color, lift, skin = '#E8B994'}) => {
  const body = tool === 'chalk' ? '#F5F3EA' : tool === 'pen' ? '#2B2B33' : '#F2F2F4';
  const cap = tool === 'chalk' ? '#E4E1D4' : color;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={20 + lift * 18} cy={26 + lift * 18} rx={22} ry={6} fill="#000" opacity={0.18 * (1 - lift * 0.5)} transform={`translate(${lift * 8} ${lift * 6})`} />
      <g transform={`translate(${lift * 6} ${-lift * 8}) rotate(38)`}>
        {/* tool: tip at the origin, body running down-right (rotated) */}
        <path d="M 0 0 L -3.4 -14 L 3.4 -14 Z" fill={cap} />
        <rect x={-5} y={-86} width={10} height={72} rx={3.5} fill={body} stroke="#00000033" strokeWidth={0.8} />
        {tool === 'marker' && <rect x={-5.4} y={-30} width={10.8} height={11} rx={2} fill={color} />}
        {/* hand */}
        <path d="M -16 -58 C -34 -66 -40 -92 -22 -112 C -6 -128 24 -122 34 -98 C 40 -80 30 -58 14 -48 C 4 -42 -8 -44 -16 -58 Z" fill={skin} stroke="#00000022" strokeWidth={1} />
        <ellipse cx={-14} cy={-64} rx={6.5} ry={14} fill={skin} stroke="#00000022" strokeWidth={0.8} transform="rotate(-22 -14 -64)" />
        <ellipse cx={11} cy={-60} rx={6.5} ry={13} fill={skin} stroke="#00000022" strokeWidth={0.8} transform="rotate(18 11 -60)" />
        <path d="M -30 -112 C -46 -140 -40 -176 -18 -196 L 28 -196 C 34 -160 26 -130 12 -112 Z" fill="#C9D1E0" opacity={0.95} />
      </g>
    </g>
  );
};
