import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {n2} from './random';
import {useStage} from './stage';

/**
 * Shared helpers for the tutorial / screen-recording annotation overlays (hud/*): normalised 0-1 positions,
 * sketchy hand-drawn strokes, a neutral mock screen for previews, label chips and timing helpers.
 */

export type Pt = [number, number];
export type Rect = {x: number; y: number; w: number; h: number};

const f2 = (n: number) => Math.round(n * 100) / 100;

/** quadratic bezier samples */
export const quadPts = (a: Pt, c: Pt, b: Pt, n: number): Pt[] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    const m = 1 - t;
    return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]] as Pt;
  });

/** offset every point along its local normal (and a little along the tangent) with smooth deterministic noise */
export const jitter = (pts: Pt[], seed: string, amp: number, phase = 0, freq = 0.22): Pt[] =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const o = n2(seed + 'n', i * freq, phase) * amp;
    const t = n2(seed + 't', i * freq, phase + 7) * amp * 0.35;
    return [p[0] + nx * o + (dx / len) * t, p[1] + ny * o + (dy / len) * t] as Pt;
  });

/** Catmull-Rom spline through points as a cubic bezier path */
export const smoothD = (pts: Pt[]) => {
  if (pts.length < 2) return '';
  let d = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f2(p1[0] + (p2[0] - p0[0]) / 6)} ${f2(p1[1] + (p2[1] - p0[1]) / 6)} ${f2(p2[0] - (p3[0] - p1[0]) / 6)} ${f2(p2[1] - (p3[1] - p1[1]) / 6)} ${f2(p2[0])} ${f2(p2[1])}`;
  }
  return d;
};

/** straight-segment path (sharp corners) */
export const lineD = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f2(p[0])} ${f2(p[1])}`).join(' ');

/** points along a straight edge a->b */
export const edgePts = (a: Pt, b: Pt, n: number): Pt[] => Array.from({length: n + 1}, (_, i) => [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)] as Pt);

/**
 * A stroke that draws on (0..1) with a dark halo underneath so it reads on light and dark footage.
 * Uses pathLength=1 so any path length works.
 */
export const Stroke: React.FC<{d: string; color: string; width: number; t: number; halo?: number; opacity?: number; dash?: string; cap?: 'round' | 'butt'}> = ({d, color, width, t, halo = 0.4, opacity = 1, dash, cap = 'round'}) => {
  if (t <= 0.001 || opacity <= 0) return null;
  const dashProps = dash
    ? {strokeDasharray: dash}
    : {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - clamp(t)};
  const common = {d, fill: 'none', strokeLinecap: cap, strokeLinejoin: 'round' as const, ...dashProps};
  return (
    <g opacity={opacity}>
      {halo > 0 && <path {...common} stroke="rgba(6,8,14,1)" strokeOpacity={halo} strokeWidth={width + Math.max(2, width * 0.8)} />}
      <path {...common} stroke={color} strokeWidth={width} />
    </g>
  );
};

/** average glyph width estimate (em fraction) for width-aware layout */
export const textW = (s: string, fs: number, k = 0.56) => s.length * fs * k;

/** greedy word wrap using the average-glyph-width estimate */
export const wrapLines = (text: string, maxW: number, fs: number, k = 0.56): string[] => {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const next = cur ? `${cur} ${wd}` : wd;
    if (cur && textW(next, fs, k) > maxW) {
      lines.push(cur);
      cur = wd;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
};

/** m:ss.d from a frame count */
export const fmtTime = (frame: number, fps: number) => {
  const s = Math.max(0, frame) / fps;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`;
};

/** pop-in progress with overshoot (0 -> ~1.1 -> 1) */
export const pop = (frame: number, start: number, dur = 10) => prog(frame, start, start + dur, ease.back);

/** fade-out factor: 1 before exitAt, 0 after exitAt + dur. exitAt <= 0 means "14 frames before the end". */
export const useExit = (frame: number, exitAt: number, dur = 12) => {
  const {durationInFrames} = useStage();
  const at = exitAt > 0 ? exitAt : durationInFrames - dur - 2;
  return 1 - prog(frame, at, at + dur, ease.in);
};

/** simple rounded label chip (svg) */
export const Chip: React.FC<{x: number; y: number; text: string; fs: number; bg: string; ink: string; font: string; anchor?: 'start' | 'middle' | 'end'; k?: number; scale?: number; opacity?: number; weight?: number; padX?: number; padY?: number; border?: string}> = ({
  x, y, text, fs, bg, ink, font, anchor = 'start', k = 0.58, scale = 1, opacity = 1, weight = 700, padX, padY, border,
}) => {
  if (scale <= 0.01 || opacity <= 0) return null;
  const px = padX ?? fs * 0.7;
  const py = padY ?? fs * 0.45;
  const tw = textW(text, fs, k);
  const bw = tw + px * 2;
  const bh = fs + py * 2;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - bw / 2 : x - bw;
  return (
    <g opacity={opacity} transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(scale)}) translate(${f2(-x)} ${f2(-y)})`}>
      <rect x={x0} y={y - bh / 2} width={bw} height={bh} rx={bh * 0.32} fill={bg} stroke={border} strokeWidth={border ? 1.5 : 0} />
      <text x={x0 + bw / 2} y={y + fs * 0.35} textAnchor="middle" fill={ink} fontFamily={font} fontWeight={weight} fontSize={fs}>
        {text}
      </text>
    </g>
  );
};

/* ------------------------------------------------------------------ neutral mock screen */

/** landmark rectangles (0-1) of the mock screen, so default annotations land on real "UI" in every aspect ratio */
export const DEMO = {
  search: {x: 0.1, y: 0.018, w: 0.42, h: 0.052},
  button: {x: 0.79, y: 0.016, w: 0.12, h: 0.056},
  avatar: {x: 0.93, y: 0.044},
  chart: {x: 0.1, y: 0.12, w: 0.5, h: 0.38},
  side: {x: 0.64, y: 0.12, w: 0.3, h: 0.38},
  stat1: {x: 0.1, y: 0.55, w: 0.25, h: 0.17},
  stat2: {x: 0.37, y: 0.55, w: 0.25, h: 0.17},
  stat3: {x: 0.64, y: 0.55, w: 0.3, h: 0.17},
  list: {x: 0.1, y: 0.77, w: 0.84, h: 0.19},
  save: {x: 0.79, y: 0.875, w: 0.13, h: 0.058},
} as const;

const TONES = {
  light: {bg: '#EEF0F5', rail: '#E1E4EC', card: '#FFFFFF', bar: '#D5D9E3', bar2: '#E6E9F0', accent: '#6E8EF5', dot: '#B7BECE', shadow: 'rgba(20,28,60,0.08)'},
  dark: {bg: '#12151C', rail: '#0D1016', card: '#1C212B', bar: '#2E3545', bar2: '#252B38', accent: '#5B8CFF', dot: '#465068', shadow: 'rgba(0,0,0,0.3)'},
};
export type DemoTone = keyof typeof TONES;

/** the mock screen as a pure SVG at any pixel size (used full-frame and scaled inside zoom insets) */
export const DemoSvg: React.FC<{w: number; h: number; u: number; tone?: DemoTone}> = ({w, h, u, tone = 'light'}) => {
  const c = TONES[tone] ?? TONES.light;
  const R = (r: {x: number; y: number; w: number; h: number}, rx: number, fill: string, extra?: React.SVGProps<SVGRectElement>) => (
    <rect x={r.x * w} y={r.y * h} width={r.w * w} height={r.h * h} rx={rx * u} fill={fill} {...extra} />
  );
  const bars = [0.42, 0.62, 0.5, 0.78, 0.58, 0.9, 0.7, 0.84, 0.64, 0.96];
  const ch = DEMO.chart;
  const bx0 = (ch.x + 0.03) * w;
  const bw = ((ch.w - 0.06) * w) / bars.length;
  const by1 = (ch.y + ch.h - 0.04) * h;
  const bh = (ch.h - 0.14) * h;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0}}>
      <rect width={w} height={h} fill={c.bg} />
      {/* rail */}
      <rect width={0.075 * w} height={h} fill={c.rail} />
      {[0.05, 0.14, 0.22, 0.3, 0.38].map((y, i) => (
        <rect key={i} x={0.02 * w} y={y * h} width={0.035 * w} height={0.035 * w} rx={9 * u} fill={i === 1 ? c.accent : c.dot} opacity={i === 1 ? 1 : 0.75} />
      ))}
      {/* top bar */}
      {R(DEMO.search, 14, c.card)}
      <rect x={(DEMO.search.x + 0.02) * w} y={(DEMO.search.y + 0.021) * h} width={0.16 * w} height={0.01 * h} rx={5 * u} fill={c.bar} />
      {R(DEMO.button, 14, c.accent)}
      <rect x={(DEMO.button.x + 0.03) * w} y={(DEMO.button.y + 0.023) * h} width={0.06 * w} height={0.01 * h} rx={5 * u} fill="#fff" opacity={0.9} />
      <circle cx={DEMO.avatar.x * w + 0.02 * w} cy={DEMO.avatar.y * h} r={Math.min(0.025 * w, 0.03 * h) + 8 * u} fill={c.dot} />
      {/* chart card */}
      {R(DEMO.chart, 22, c.card)}
      <rect x={(ch.x + 0.03) * w} y={(ch.y + 0.04) * h} width={0.14 * w} height={0.014 * h} rx={6 * u} fill={c.bar} />
      {bars.map((v, i) => (
        <rect key={i} x={bx0 + i * bw + bw * 0.14} y={by1 - bh * v} width={bw * 0.72} height={bh * v} rx={7 * u} fill={i === 5 ? c.accent : c.bar2} />
      ))}
      {/* side card */}
      {R(DEMO.side, 22, c.card)}
      <circle cx={(DEMO.side.x + DEMO.side.w / 2) * w} cy={(DEMO.side.y + 0.17) * h} r={Math.min(0.1 * w, 0.12 * h)} fill="none" stroke={c.bar2} strokeWidth={18 * u} />
      <circle cx={(DEMO.side.x + DEMO.side.w / 2) * w} cy={(DEMO.side.y + 0.17) * h} r={Math.min(0.1 * w, 0.12 * h)} fill="none" stroke={c.accent} strokeWidth={18 * u} strokeDasharray={`${Math.min(0.1 * w, 0.12 * h) * 3.4} 999`} strokeLinecap="round" transform={`rotate(-90 ${(DEMO.side.x + DEMO.side.w / 2) * w} ${(DEMO.side.y + 0.17) * h})`} />
      {[0.31, 0.34].map((dy, i) => (
        <rect key={i} x={(DEMO.side.x + 0.03) * w} y={(DEMO.side.y + dy) * h} width={(i ? 0.14 : 0.2) * w} height={0.012 * h} rx={6 * u} fill={c.bar} />
      ))}
      {/* stat cards */}
      {[DEMO.stat1, DEMO.stat2, DEMO.stat3].map((r, i) => (
        <g key={i}>
          {R(r, 20, c.card)}
          <rect x={(r.x + 0.02) * w} y={(r.y + 0.03) * h} width={0.07 * w} height={0.012 * h} rx={6 * u} fill={c.bar} />
          <rect x={(r.x + 0.02) * w} y={(r.y + 0.075) * h} width={(i === 2 ? 0.16 : 0.11) * w} height={0.04 * h} rx={9 * u} fill={i === 1 ? c.accent : c.bar2} />
        </g>
      ))}
      {/* list / form */}
      {R(DEMO.list, 22, c.card)}
      {[0.03, 0.075, 0.12].map((dy, i) => (
        <g key={i}>
          <circle cx={(DEMO.list.x + 0.03) * w} cy={(DEMO.list.y + dy + 0.01) * h} r={9 * u} fill={c.dot} opacity={0.8} />
          <rect x={(DEMO.list.x + 0.055) * w} y={(DEMO.list.y + dy + 0.004) * h} width={(0.3 - i * 0.05) * w} height={0.012 * h} rx={6 * u} fill={c.bar} />
        </g>
      ))}
      <rect x={(DEMO.list.x + 0.69) * w} y={(DEMO.list.y + 0.032) * h} width={0.05 * w} height={0.024 * h + 8 * u} rx={14 * u} fill={c.accent} />
      {R(DEMO.save, 14, c.accent)}
      <rect x={(DEMO.save.x + 0.035) * w} y={(DEMO.save.y + 0.026) * h} width={0.06 * w} height={0.01 * h} rx={5 * u} fill="#fff" opacity={0.9} />
    </svg>
  );
};

/** full-frame mock screen, or nothing (transparent overlay) */
export const DemoScreen: React.FC<{show: boolean; tone?: DemoTone}> = ({show, tone}) => {
  const {w, h, u} = useStage();
  if (!show) return null;
  return (
    <AbsoluteFill>
      <DemoSvg w={w} h={h} u={u} tone={tone} />
    </AbsoluteFill>
  );
};

/** px helper */
export const useNorm = () => {
  const {w, h, u, fps, durationInFrames} = useStage();
  return {w, h, u, fps, durationInFrames, px: (x: number, y: number): Pt => [x * w, y * h]};
};

/** round every number in a default-props object to 3 decimals (keeps 0.1 + 0.02 from printing as 0.12000000000000001) */
export const tidy = <T,>(o: T): T => {
  if (typeof o === 'number') return (Math.round(o * 1000) / 1000) as unknown as T;
  if (Array.isArray(o)) return o.map(tidy) as unknown as T;
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o as Record<string, unknown>).map(([k, v]) => [k, tidy(v)])) as T;
  return o;
};
