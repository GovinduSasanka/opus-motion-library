import React from 'react';
import {clamp, lerp} from './ease';

/** Shared helpers for the shape/ family (call-response, petal-bloom, line-draw-on, compass-construct, ...). */

export type Pt = [number, number];

/** dash props for a path drawn with pathLength=1: p=0 hidden, p=1 complete */
export const dash1 = (p: number) => ({
  pathLength: 1,
  strokeDasharray: '1 1',
  strokeDashoffset: 1 - clamp(p),
  opacity: p <= 0.001 ? 0 : 1,
});

/** lighten (amt>0) or darken (amt<0) a #rrggbb colour */
export const shade = (hex: string, amt: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)));
  return '#' + ch.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
};

/** mix two #rrggbb colours */
export const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.replace('#', ''), 16);
  const pb = parseInt(b.replace('#', ''), 16);
  const c = [16, 8, 0].map((s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp(t))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** circle-circle intersection points */
export const circleIntersections = (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): Pt[] => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6 || d > r0 + r1 || d < Math.abs(r0 - r1)) return [];
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, r0 * r0 - a * a));
  const mx = x0 + (a * dx) / d;
  const my = y0 + (a * dy) / d;
  return [
    [mx + (hh * dy) / d, my - (hh * dx) / d],
    [mx - (hh * dy) / d, my + (hh * dx) / d],
  ];
};

/** polyline path */
export const polyPath = (pts: Pt[], closed = false) =>
  pts.length ? 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + (closed ? ' Z' : '') : '';

/** sonar-ring radius / stroke / opacity at a given age (video4 sonar-ping-rings recipe) */
export const ringAt = (age: number, life: number, maxR: number, stroke0: number, index: number) => {
  if (age < 0 || age > life) return null;
  const t = clamp(age / life);
  const r = maxR * (1 - (1 - t) * (1 - t));
  const sw = lerp(stroke0 * Math.pow(0.7, index), stroke0 * 0.18, t);
  const op = 1 - clamp((t - 0.72) / 0.28);
  return {r, sw, op, t};
};

/**
 * Lotus flower (video4 lotus-bloom-pop). Petals are pointed lenses arranged round a centre and seen at an
 * angle: `squash` is the vertical foreshortening of the petal ring (1 = top-down, 0.3 = grazing),
 * `lift` tilts petals upward. `open` 0..1(+overshoot) unfolds each layer from closed-up to open.
 */
export const Lotus: React.FC<{
  x: number;
  y: number;
  size: number;
  open: number[]; // per layer, outer first
  petals?: number;
  squash?: number;
  colors?: [string, string];
  center?: string;
  id: string;
  rotate?: number;
  shadow?: boolean;
  /** per-layer lightening (outer first), e.g. [0, 0.2, 0.4] for paler inner layers */
  layerLight?: number[];
}> = ({x, y, size, open, petals = 8, squash = 0.42, colors = ['#F8B6E6', '#E546AA'], center = '#F2B33D', id, rotate = 0, shadow = true, layerLight}) => {
  const layers = open.length;
  type P = {d: string; depth: number; layer: number; light: number};
  const items: P[] = [];
  for (let L = 0; L < layers; L++) {
    const s = Math.max(0, open[L]);
    if (s <= 0.001) continue;
    const n = petals;
    const lenK = 1 - L * (0.22 / Math.max(1, layers - 1)) * (layers > 1 ? 1 : 0);
    const len = size * lenK * lerp(0.35, 1, Math.min(s, 1.15));
    const lift = lerp(0.12, 0.62, L / Math.max(1, layers - 1 || 1));
    const wid = size * (0.2 - L * 0.025);
    for (let i = 0; i < n; i++) {
      const a = rotate + ((i + (L % 2) * 0.5) / n) * Math.PI * 2;
      // open direction (projected) vs closed (straight up)
      const ox = Math.cos(a) * (1 - lift);
      const oy = Math.sin(a) * (1 - lift) * squash - lift * Math.sqrt(1 - squash * squash);
      const cxv = Math.cos(a) * 0.12;
      const cyv = -1;
      const k = Math.min(1, s);
      // projected direction (not normalised: its length is the foreshortening)
      const dx = lerp(cxv, ox, k) + (s > 1 ? (ox - cxv) * (s - 1) : 0);
      const dy = lerp(cyv, oy, k) + (s > 1 ? (oy - cyv) * (s - 1) : 0);
      const m = Math.hypot(dx, dy) || 1;
      const tipX = x + dx * len;
      const tipY = y + dy * len;
      // perpendicular in screen space, width foreshortened when the petal points at the viewer
      const px = -dy / m;
      const py = dx / m;
      const ww = wid * lerp(0.45, 1, Math.min(1, s)) * (0.55 + 0.45 * Math.abs(Math.cos(a)));
      const mx1 = x + dx * len * 0.42 + px * ww;
      const my1 = y + dy * len * 0.42 + py * ww;
      const mx2 = x + dx * len * 0.42 - px * ww;
      const my2 = y + dy * len * 0.42 - py * ww;
      const d = `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${mx1.toFixed(1)} ${my1.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${mx2.toFixed(1)} ${my2.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} Z`;
      items.push({d, depth: Math.sin(a) - L * 0.6, layer: L, light: 0.5 + 0.5 * Math.cos(a + 0.8)});
    }
  }
  items.sort((p, q) => p.depth - q.depth);
  const cs = Math.max(0, Math.min(1.1, open[layers - 1] ?? 0));
  return (
    <g>
      <defs>
        {open.map((_, L) => (
          <linearGradient key={L} id={`${id}-pg${L}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={shade(colors[1], layerLight?.[L] ?? 0)} />
            <stop offset="100%" stopColor={shade(colors[0], layerLight?.[L] ?? 0)} />
          </linearGradient>
        ))}
        <radialGradient id={`${id}-cg`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFE9A6" />
          <stop offset="60%" stopColor={center} />
          <stop offset="100%" stopColor={shade(center, -0.35)} />
        </radialGradient>
        <filter id={`${id}-sh`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={size * 0.08} />
        </filter>
      </defs>
      {shadow && open[0] > 0.01 && (
        <ellipse cx={x + size * 0.18} cy={y + size * 0.12} rx={size * 0.95 * Math.min(1, open[0])} ry={size * 0.95 * squash * Math.min(1, open[0])} fill="#7a5a78" opacity={0.18} filter={`url(#${id}-sh)`} />
      )}
      {items.map((p, i) => (
        <g key={i}>
          <path d={p.d} fill={`url(#${id}-pg${p.layer})`} stroke={shade(colors[1], -0.25)} strokeWidth={Math.max(0.6, size * 0.008)} strokeOpacity={0.55} />
          <path d={p.d} fill={p.light > 0.5 ? '#ffffff' : '#3a0a2a'} opacity={Math.abs(p.light - 0.5) * 0.32} />
        </g>
      ))}
      {cs > 0.01 && (
        <g>
          <ellipse cx={x} cy={y - size * 0.04} rx={size * 0.16 * cs} ry={size * 0.16 * cs * Math.max(0.35, squash)} fill={`url(#${id}-cg)`} />
          {Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <circle key={i} cx={x + Math.cos(a) * size * 0.1 * cs} cy={y - size * 0.04 + Math.sin(a) * size * 0.1 * cs * Math.max(0.35, squash)} r={size * 0.018 * cs} fill="#FFF3C4" />;
          })}
        </g>
      )}
    </g>
  );
};

/** small bright tip dot with a glow (pen nib / compass lead / growing edge tip) */
export const TipDot: React.FC<{x: number; y: number; r: number; color?: string; glow?: string; opacity?: number}> = ({x, y, r, color = '#FFFFFF', glow, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 3} fill={glow ?? color} opacity={0.18} />
    <circle cx={x} cy={y} r={r * 1.7} fill={glow ?? color} opacity={0.3} />
    <circle cx={x} cy={y} r={r} fill={color} />
  </g>
);
