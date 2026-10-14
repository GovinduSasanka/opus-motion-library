import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {n2, rng} from './random';
import {smoothClosed, smoothOpen} from './shapes';
import {PaperTexture, useStage} from './stage';

/**
 * Shared helpers for the fx/ family (bursts & accents). Every fx motion:
 *  - takes `x`,`y` (0..1 of the frame) for its anchor point,
 *  - takes `delay` = local frame at which its key moment fires,
 *  - paints `background` unless it is 'transparent' (overlay mode), in which case
 *    scene-only props (subject drawings, paper) are skipped automatically.
 */

export const isClear = (bg: string | undefined) => !bg || bg === 'transparent' || bg === 'none';

/** stage + anchor point + local time (frames since `delay`) */
export const useFx = (x: number, y: number, delay: number) => {
  const frame = useCurrentFrame();
  const st = useStage();
  return {...st, frame, f: frame - delay, px: x * st.w, py: y * st.h};
};

/** full-frame root that paints the background (or nothing in overlay mode) */
export const FxRoot: React.FC<{background: string; paper?: boolean; paperTint?: string; children: React.ReactNode}> = ({background, paper, paperTint, children}) => {
  const clear = isClear(background);
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      {!clear && paper && <PaperTexture opacity={0.32} tint={paperTint} />}
      {children}
    </AbsoluteFill>
  );
};

/** weighted colour pick */
export const weightedPick = (r: () => number, items: string[], weights?: number[]) => {
  if (!weights || weights.length !== items.length) return items[Math.floor(r() * items.length) % items.length];
  const tot = weights.reduce((a, b) => a + b, 0);
  let v = r() * tot;
  for (let i = 0; i < items.length; i++) {
    v -= weights[i];
    if (v <= 0) return items[i];
  }
  return items[items.length - 1];
};

/** seed that changes every `every` frames (line-boil / regenerate look) */
export const boil = (frame: number, every = 2) => Math.floor(frame / Math.max(1, every));

/** wobbly hand-drawn loop (open ellipse, 330-380 deg sweep) — ink doodles, smoke circles, scribbles */
export const doodleLoop = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  a0: number,
  sweep: number,
  seed: string,
  wob = 0.07,
  n = 20,
) => {
  const pts: [number, number][] = [];
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const a = a0 + (sweep * i) / n;
    const k = 1 + n2(seed, i * 0.55, 0.3) * wob;
    const lx = Math.cos(a) * rx * k;
    const ly = Math.sin(a) * ry * k;
    pts.push([cx + lx * cr - ly * sr, cy + lx * sr + ly * cr]);
  }
  return smoothOpen(pts);
};

/** wobbly closed blob (clouds, dust) */
export const doodleBlob = (cx: number, cy: number, r: number, seed: string, lobes = 7, lobeDepth = 0.18, n = 42) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const lobe = Math.abs(Math.sin((a * lobes) / 2));
    const k = 1 - lobeDepth + lobeDepth * 2 * Math.pow(lobe, 0.6) + n2(seed, i * 0.4, 1) * 0.04;
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * 0.82]);
  }
  return smoothClosed(pts);
};

/** midpoint-displacement lightning polyline */
export const boltPoints = (x1: number, y1: number, x2: number, y2: number, r: () => number, levels = 5, disp = 0.25): [number, number][] => {
  let pts: [number, number][] = [
    [x1, y1],
    [x2, y2],
  ];
  for (let l = 0; l < levels; l++) {
    const next: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const off = (r() * 2 - 1) * disp * len;
      next.push([(ax + bx) / 2 + (-dy / len) * off, (ay + by) / 2 + (dx / len) * off]);
      next.push(pts[i + 1]);
    }
    pts = next;
  }
  return pts;
};

export const polyline = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');

/** 5-point star path centred at 0,0 */
export const star5Path = (r: number, inner = 0.45) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)} `;
  }
  return d + 'Z';
};

/** concave 4-point sparkle centred at 0,0 (vertical arm `tall` x longer) */
export const sparkle4Path = (r: number, tall = 1.35, pinch = 0.16) => {
  const v = r * tall;
  const w = r * pinch;
  return `M0 ${-v} C${w} ${-w} ${w} ${-w} ${r} 0 C${w} ${w} ${w} ${w} 0 ${v} C${-w} ${w} ${-w} ${w} ${-r} 0 C${-w} ${-w} ${-w} ${-w} 0 ${-v} Z`;
};

/** jitter a list of points every `every` frames (line-boil, v2 / v20) */
export const boilPts = (pts: [number, number][], seed: string, frame: number, amp: number, every = 2): [number, number][] => {
  const b = boil(frame, every);
  return pts.map(([x, y], i) => [x + n2(seed + 'x', i * 0.71, b * 1.37) * amp, y + n2(seed + 'y', i * 0.71, b * 1.37) * amp]);
};

const INK = '#2e2a26';

export type BotFace = 'neutral' | 'happy' | 'squint' | 'worried' | 'angry' | 'wide';

/**
 * Doodle "box-bot" from video20: a coloured-pencil cube body with ink outline, two
 * black eyes with catch-lights and four stubby legs. Used as the scene subject for
 * emote-pop, scribble-ball and the cheer variant of sparkle-burst.
 * (x, y) = centre of the front face; s = front face width.
 */
export const BoxBot: React.FC<{
  x: number;
  y: number;
  s: number;
  face?: BotFace;
  blink?: number;
  look?: number;
  squashY?: number;
  frame: number;
  ink?: string;
  body?: string;
  shade?: string;
  top?: string;
  legs?: boolean;
  id: string;
}> = ({x, y, s, face = 'neutral', blink = 0, look = 0, squashY = 1, frame, ink = INK, body = '#cf8465', shade = '#b36a56', top = '#dd9d80', legs = true, id}) => {
  const hw = s / 2;
  const hh = (s * 0.78) / 2;
  const dx = s * 0.32;
  const dy = -s * 0.2;
  const amp = s * 0.004;
  const B = (pts: [number, number][], k: string) => boilPts(pts, id + k, frame, amp, 3);
  const front = B([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], 'f');
  const topF = B([[-hw, -hh], [-hw + dx, -hh + dy], [hw + dx, -hh + dy], [hw, -hh]], 't');
  const side = B([[hw, -hh], [hw + dx, -hh + dy], [hw + dx, hh + dy], [hw, hh]], 's');
  const P = (pts: [number, number][]) => 'M' + pts.map((p) => p.join(' ')).join(' L') + ' Z';
  const sw = Math.max(1.6, s * 0.012);
  const legW = s * 0.17;
  const legH = s * 0.3;
  const eyeW = s * 0.07;
  const eyeH = s * 0.14;
  const ex = s * 0.2;
  const ey = -s * 0.02;
  const eyeOpen = 1 - blink * 0.9;
  const eye = (sx: number) => {
    const cx = sx + look * s * 0.05;
    if (face === 'happy') return <path d={`M${cx - eyeW} ${ey + eyeH * 0.15} L${cx} ${ey - eyeH * 0.35} L${cx + eyeW} ${ey + eyeH * 0.15}`} fill="none" stroke={ink} strokeWidth={sw * 1.3} strokeLinecap="round" strokeLinejoin="round" />;
    if (face === 'squint') return <line x1={cx - eyeW} x2={cx + eyeW} y1={ey} y2={ey} stroke={ink} strokeWidth={sw * 1.5} strokeLinecap="round" />;
    const k = face === 'wide' ? 1.25 : 1;
    return (
      <g transform={`translate(${cx} ${ey}) scale(1 ${eyeOpen})`}>
        <rect x={(-eyeW / 2) * k} y={(-eyeH / 2) * k} width={eyeW * k} height={eyeH * k} rx={eyeW * 0.3} fill="#262021" />
        <circle cx={eyeW * 0.12} cy={-eyeH * 0.22} r={eyeW * 0.22 * k} fill="#fff" />
      </g>
    );
  };
  const brows =
    face === 'worried' || face === 'angry' ? (
      [-1, 1].map((sd) => {
        const by = ey - eyeH * 1.0;
        const inner = face === 'worried' ? -s * 0.045 : s * 0.035;
        const outer = face === 'worried' ? s * 0.01 : -s * 0.03;
        return <path key={sd} d={`M${sd * (ex + eyeW * 1.4)} ${by + outer} L${sd * (ex - eyeW * 1.2)} ${by + inner}`} stroke={ink} strokeWidth={sw * 1.2} strokeLinecap="round" fill="none" />;
      })
    ) : null;
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${squashY})`}>
      <ellipse cx={dx * 0.4} cy={hh + legH * 0.95} rx={s * 0.72} ry={s * 0.08} fill={ink} opacity={0.12} />
      {legs &&
        [-0.36, 0.28].map((lx, i) => (
          <g key={i}>
            <rect x={lx * s + dx * 0.55} y={hh + dy * 0.5 - legH * 0.1} width={legW * 0.9} height={legH} fill={shade} stroke={ink} strokeWidth={sw * 0.8} />
            <rect x={lx * s} y={hh - legH * 0.1} width={legW} height={legH} fill="#d29278" stroke={ink} strokeWidth={sw * 0.9} />
          </g>
        ))}
      <path d={P(side)} fill={shade} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={P(topF)} fill={top} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={P(front)} fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      <clipPath id={`${id}-fc`}>
        <rect x={-hw} y={-hh} width={s} height={hh * 2} />
      </clipPath>
      <g opacity={0.18} stroke="#8c4a35" strokeWidth={sw * 0.5} clipPath={`url(#${id}-fc)`}>
        {Array.from({length: 9}, (_, i) => {
          const t = (i + 0.5) / 9;
          return <line key={i} x1={-hw + t * s * 1.3} y1={-hh} x2={-hw + t * s * 1.3 - s * 0.35} y2={hh} />;
        })}
      </g>
      {brows}
      {eye(-ex)}
      {eye(ex)}
    </g>
  );
};

/** soft radial glow def */
export const GlowDef: React.FC<{id: string; color: string; inner?: number; mid?: number}> = ({id, color, inner = 1, mid = 0.35}) => (
  <radialGradient id={id}>
    <stop offset="0%" stopColor={color} stopOpacity={inner} />
    <stop offset="40%" stopColor={color} stopOpacity={mid} />
    <stop offset="100%" stopColor={color} stopOpacity={0} />
  </radialGradient>
);

/** deterministic per-instance random list helper */
export const seeded = (seed: number | string) => rng(seed);

/**
 * Scene-mode portrait fit: subject-based scenes (character + emote, machine + smoke...) are laid out
 * for landscape; in a vertical frame they are scaled up a little and lowered so the composition sits
 * in the middle instead of the top half. Overlay mode (transparent background) is never altered.
 */
export const portraitFit = (portrait: boolean, scene: boolean, h: number) => (portrait && scene ? {k: 1.2, dy: h * 0.075} : {k: 1, dy: 0});
