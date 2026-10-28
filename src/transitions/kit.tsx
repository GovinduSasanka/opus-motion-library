import React, {useId} from 'react';
import {AbsoluteFill, continueRender, delayRender, Easing, useVideoConfig} from 'remotion';
import type {TransitionPresentationComponentProps} from '@remotion/transitions';

/**
 * Shared helpers for the custom scene transitions (src/transitions.tsx and src/transitions/*.tsx):
 * frame size, SVG overlay / blur / luminance-mask wrappers, eases and the front-wipe axis maths.
 */
/** props every custom presentation receives (resolved from a TransitionSpec + DEFAULTS) */
export type P = {
  x: number;
  y: number;
  color: string;
  colors: string[];
  angle: number;
  bands: number;
  size: number;
  variant: string;
  seed: number;
  text: string;
  /** round-2 extension options (docs/TRANSITIONS.md) */
  shape: string;
  hold: number;
  holdRadius: number;
  feather: number;
  x2: number;
  y2: number;
  rim: number;
  mode: string;
};
export type C = React.FC<TransitionPresentationComponentProps<P>>;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const E = {
  inQuad: (t: number) => t * t,
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  inExpo: (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  tear: Easing.bezier(0.3, 0.1, 0.3, 1),
  slam: Easing.bezier(0.3, 0, 0.2, 1),
  sweep: Easing.bezier(0.45, 0, 0.55, 1),
};
export const gray = (v: number) => {
  const c = Math.round(clamp01(v) * 255);
  return `rgb(${c},${c},${c})`;
};
export const f1 = (v: number) => v.toFixed(1);
export const ptsStr = (pts: number[][]) => pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ');

export const useUid = (prefix: string) => prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
export const useFrameSize = () => {
  const {width: w, height: h} = useVideoConfig();
  return {w, h, u: Math.min(w, h) / 1080};
};

export const Overlay: React.FC<{w: number; h: number; children: React.ReactNode; style?: React.CSSProperties}> = ({w, h, children, style}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', ...style}}>
    {children}
  </svg>
);

export const BlurFilter: React.FC<{id: string; sd: number | string; w: number; h: number}> = ({id, sd, w, h}) => (
  <filter id={id} filterUnits="userSpaceOnUse" x={-w} y={-h} width={3 * w} height={3 * h} colorInterpolationFilters="sRGB">
    <feGaussianBlur stdDeviation={sd} />
  </filter>
);

/** children seen through an SVG luminance mask (white = visible). One render of children. */
export const Masked: React.FC<{id: string; w: number; h: number; mask: React.ReactNode; defs?: React.ReactNode; style?: React.CSSProperties; children: React.ReactNode}> = ({
  id,
  w,
  h,
  mask,
  defs,
  style,
  children,
}) => (
  <>
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <defs>
        {defs}
        <mask id={id} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={-w} y={-h} width={3 * w} height={3 * h}>
          {mask}
        </mask>
      </defs>
    </svg>
    <AbsoluteFill style={{mask: `url(#${id})`, WebkitMask: `url(#${id})`, ...style}}>{children}</AbsoluteFill>
  </>
);

export const Plain: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => <AbsoluteFill style={style}>{children}</AbsoluteFill>;
export const Hidden: React.FC<{children: React.ReactNode}> = ({children}) => <AbsoluteFill style={{opacity: 0}}>{children}</AbsoluteFill>;

/** frame axis for a travel direction: s = along travel, t = across */
export type Axis = {dx: number; dy: number; nx: number; ny: number; smin: number; smax: number; tmin: number; tmax: number; L: number; M: number};
export const axisFor = (angleDeg: number, w: number, h: number): Axis => {
  const a = (angleDeg * Math.PI) / 180;
  const r = (v: number) => (Math.abs(v) < 1e-9 ? 0 : v);
  const dx = r(Math.cos(a));
  const dy = r(Math.sin(a));
  const nx = -dy;
  const ny = dx;
  const cs = [[0, 0], [w, 0], [0, h], [w, h]];
  const ss = cs.map(([x, y]) => x * dx + y * dy);
  const ts = cs.map(([x, y]) => x * nx + y * ny);
  const smin = Math.min(...ss);
  const smax = Math.max(...ss);
  const tmin = Math.min(...ts);
  const tmax = Math.max(...ts);
  return {dx, dy, nx, ny, smin, smax, tmin, tmax, L: smax - smin, M: tmax - tmin};
};
export const at = (ax: Axis, s: number, t: number): [number, number] => [ax.dx * s + ax.nx * t, ax.dy * s + ax.ny * t];
export type Edge = [number, number][]; // [t, sOffset]
export const sampleEdge = (ax: Axis, fn: (t: number) => number, step: number, pad: number): Edge => {
  const out: Edge = [];
  const t1 = ax.tmax + pad;
  for (let t = ax.tmin - pad; t < t1 + step; t += step) out.push([Math.min(t, t1), fn(Math.min(t, t1))]);
  return out;
};
export const straight = (ax: Axis, pad = 20): Edge => [[ax.tmin - pad, 0], [ax.tmax + pad, 0]];
/** polygon of the region BEHIND a front at S (s < S + edge(t)) */
export const region = (ax: Axis, S: number, edge: Edge) => {
  const pts = edge.map(([t, ds]) => at(ax, S + ds, t));
  const back = ax.smin - ax.L * 2;
  pts.push(at(ax, back, edge[edge.length - 1][0]), at(ax, back, edge[0][0]));
  return ptsStr(pts);
};
export const frontLine = (ax: Axis, S: number, edge: Edge, off = 0) => ptsStr(edge.map(([t, ds]) => at(ax, S + ds + off, t)));

export const cornerR = (cx: number, cy: number, w: number, h: number) => Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));


/** 0..1 progress of v inside [a, b] */
export const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
/** deterministic hash -> 0..1 */
export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const hexRgb = (c: string): [number, number, number] => {
  let h = c.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [128, 128, 128];
};
/** mix two hex colours (t = 0 -> a, 1 -> b) */
export const mix = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * clamp01(t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
/** polygon between two fronts (band from s0+e0(t) to s1+e1(t)) */
export const bandPoly = (ax: Axis, s0: number, e0: Edge, s1: number, e1: Edge) => {
  const a = e0.map(([t, ds]) => at(ax, s0 + ds, t));
  const b = [...e1].reverse().map(([t, ds]) => at(ax, s1 + ds, t));
  return ptsStr([...a, ...b]);
};
/** polygon of the region AHEAD of a front at S (s > S + edge(t)) */
export const ahead = (ax: Axis, S: number, edge: Edge) => {
  const pts = edge.map(([t, ds]) => at(ax, S + ds, t));
  const fwd = ax.smax + ax.L * 2;
  pts.push(at(ax, fwd, edge[edge.length - 1][0]), at(ax, fwd, edge[0][0]));
  return ptsStr(pts);
};
/** full-frame white rect for masks */
export const FullRect: React.FC<{w: number; h: number; fill?: string}> = ({w, h, fill = 'white'}) => <rect x={-w} y={-h} width={3 * w} height={3 * h} fill={fill} />;
export {AbsoluteFill, Easing};

/** holds the render until a data-URI image (used by an SVG feImage) is decoded */
export const useDecoded = (url: string) => {
  const [handle] = React.useState(() => null as number | null);
  React.useLayoutEffect(() => {
    if (!url || typeof Image === 'undefined') return;
    const hd = delayRender('transition feImage');
    const img = new Image();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      continueRender(hd);
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = url;
    if (img.complete) finish();
    return finish;
  }, [url]);
  return handle;
};
