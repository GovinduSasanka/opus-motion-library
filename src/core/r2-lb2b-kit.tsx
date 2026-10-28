/**
 * r2-lb2b-kit — shared helpers for LB2-2 (palette-reink, registration-snap, glass-crack-mend, light-band-window,
 * type-architecture, diagonal-assemble-title, grid-score, grid-exception, knife-cut, exploded-stack, telestrator-freeze).
 * Ideas adapted from lemo-opuscar styles/{silkscreen-poster,stained-glass,spy-titles,swiss-motion,teardown,telestrator}
 * (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md. Pure functions of the frame; no timers, no Math.random.
 */
import React from 'react';
import {
  fx,
  PosterGeo,
  PosterInfo,
  PosterInfoInk,
  PosterLayer,
  PosterPalette,
  POSTER_LAYERS,
  POSTER_W,
  POSTER_H,
  h1,
  lerp,
  seg,
} from './r2-lb2-kit';

export * from './r2-lb2-kit';

/** the whole screen-print poster (paper + 7 ink layers + info) in poster units 1000×1500 */
export const PosterSheet: React.FC<{pal: PosterPalette; geo: PosterGeo; paper: string; info: PosterInfo; infoProg?: number[]; layers?: number}> = ({
  pal,
  geo,
  paper,
  info,
  infoProg,
  layers = POSTER_LAYERS,
}) => (
  <g>
    <rect x={0} y={0} width={POSTER_W} height={POSTER_H} fill={paper} />
    {Array.from({length: layers}, (_, k) => (
      <PosterLayer key={k} k={k} geo={geo} pal={pal} paper={paper} />
    ))}
    <PosterInfoInk info={info} pal={pal} paper={paper} prog={infoProg ?? Array.from({length: 4 + info.stats.length}, () => 1)} />
  </g>
);

/** smooth 0..1 .. 0 bump */
export const gauss = (x: number, s: number) => Math.exp(-(x * x) / (2 * s * s));

/** piecewise-linear key track [[frame,value],...] */
export const track = (frame: number, keys: number[][]) => {
  if (!keys.length) return 0;
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (frame <= keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], seg(frame, keys[i][0], keys[i + 1][0]));
  }
  return keys[keys.length - 1][1];
};

/** pointed (lancet) arch path, bottom-left origin box x,y,w,h; the apex height = rise */
export const lancetPath = (x: number, y: number, w: number, h: number, rise: number) => {
  const sy = y + rise;
  return `M${fx(x)},${fx(y + h)} L${fx(x)},${fx(sy)} Q${fx(x)},${fx(sy - rise * 0.62)} ${fx(x + w / 2)},${fx(y)} Q${fx(x + w)},${fx(sy - rise * 0.62)} ${fx(x + w)},${fx(sy)} L${fx(x + w)},${fx(y + h)} Z`;
};

/** dark ashlar wall with offset courses (deterministic) */
export const AshlarWall: React.FC<{w: number; h: number; course: number; base?: string; seed?: number; lit?: number}> = ({w, h, course, base = '#2b2a31', seed = 4, lit = 0}) => {
  const rows = Math.ceil(h / course) + 1;
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    let x = -((h1(r, seed) * course * 2) | 0);
    let i = 0;
    while (x < w) {
      const bw = course * (1.5 + h1(r * 41 + i, seed) * 1.6);
      const shade = 0.82 + h1(r * 17 + i, seed + 3) * 0.3;
      out.push(
        <rect key={`${r}-${i}`} x={x + 1} y={r * course + 1} width={bw - 2} height={course - 2} fill={base} opacity={shade} />,
      );
      x += bw;
      i++;
    }
  }
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill="#0e0d12" />
      {out}
      {lit > 0 && <rect x={0} y={0} width={w} height={h} fill="#fff" opacity={lit * 0.04} />}
    </g>
  );
};

/** a weld spark: n short rays + a core, `p` 0..1 */
export const WeldSpark: React.FC<{x: number; y: number; p: number; size: number; color?: string; seed?: number}> = ({x, y, p, size, color = '#ffe9b0', seed = 1}) => {
  if (p <= 0 || p >= 1) return null;
  const n = 9;
  const a = 1 - p;
  return (
    <g opacity={a} stroke={color} strokeLinecap="round">
      {Array.from({length: n}, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + h1(i, seed) * 0.5;
        const r0 = size * (0.15 + p * 0.6);
        const r1 = size * (0.45 + p * 1.5 + h1(i + 9, seed) * 0.5);
        return <line key={i} x1={x + Math.cos(ang) * r0} y1={y + Math.sin(ang) * r0} x2={x + Math.cos(ang) * r1} y2={y + Math.sin(ang) * r1} strokeWidth={size * 0.09} />;
      })}
      <circle cx={x} cy={y} r={size * 0.28 * a + 1} fill="#fff" stroke="none" />
    </g>
  );
};

/** rotated-frame helper: unit vectors for a cut that is `deg` from vertical */
export const diag = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return {d: [Math.sin(a), Math.cos(a)] as [number, number], n: [Math.cos(a), -Math.sin(a)] as [number, number]};
};

/** League Gothic advance widths (em) — fixed table so layout never depends on web-font load timing */
export const gothicAdvance = (ch: string) => {
  const t: Record<string, number> = {I: 0.2, J: 0.27, L: 0.31, T: 0.35, F: 0.32, E: 0.33, '1': 0.25, ' ': 0.18, W: 0.58, M: 0.5, '.': 0.15, '-': 0.25, ',': 0.15, ':': 0.15, '&': 0.42};
  return t[ch] ?? 0.385;
};
