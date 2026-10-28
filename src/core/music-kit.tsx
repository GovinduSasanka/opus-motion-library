/**
 * music-kit — small shared helpers for the R3 music / audio / podcast motions
 * (podcast-audiogram, now-playing-card, vinyl-spin-label, equalizer-bars-loop, beat-pulse-rings,
 *  tracklist-reveal, mixer-faders).
 *  - fmtTime / parseTime: "m:ss" formatting
 *  - wrapText: greedy word wrap by character budget
 *  - seededWave: deterministic speech-like waveform envelope (0..1) from a seed
 *  - ArtBox: cover art (public/ path or URL via <Img>) with a procedural gradient fallback
 *  - TransportIcon: play / pause / prev / next / shuffle / repeat / heart glyphs
 */
import React from 'react';
import {Img} from 'remotion';
import {resolveSrc} from './asset';
import {rng} from './random';
import {mix, rgbaStr} from './r2-pr3-kit';

export const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m % 60).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

/** "3:45" | "1:02:03" | 225 -> seconds */
export const parseTime = (v: string | number): number => {
  if (typeof v === 'number') return v;
  const p = String(v).split(':').map((x) => parseFloat(x) || 0);
  return p.reduce((a, b) => a * 60 + b, 0);
};

export const wrapText = (text: string, maxChars: number, maxLines = 99): string[] => {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    if (cur && (cur + ' ' + wd).length > maxChars) {
      lines.push(cur);
      cur = wd;
    } else cur = cur ? cur + ' ' + wd : wd;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    keep[maxLines - 1] = keep[maxLines - 1].replace(/[.,;:!?\s]+$/, '') + '…';
    return keep;
  }
  return lines;
};

/** deterministic speech/music-like amplitude envelope, n values in 0.08..1 */
export const seededWave = (n: number, seed: number): number[] => {
  const r = rng(seed * 7919 + 13);
  const ph1 = r() * 6.28;
  const ph2 = r() * 6.28;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const phrase = 0.55 + 0.45 * Math.sin(t * 9.5 + ph1) * Math.sin(t * 3.1 + ph2);
    const v = (0.25 + 0.75 * r()) * (0.45 + 0.55 * Math.abs(phrase));
    out.push(Math.min(1, Math.max(0.08, v * 1.15)));
  }
  return out;
};

/**
 * Cover art box. With `src` shows the picture (cover-fit); otherwise a procedural gradient sleeve (sun, bars, arcs)
 * built from `accent` / `accent2` and a seed. `children` are drawn on top.
 */
export const ArtBox: React.FC<{
  x: number;
  y: number;
  size: number;
  src?: string;
  accent: string;
  accent2: string;
  seed?: number;
  radius?: number;
  uid: string;
  rotate?: number;
  scale?: number;
  opacity?: number;
  shadow?: string;
  round?: boolean;
  children?: React.ReactNode;
}> = ({x, y, size, src, accent, accent2, seed = 1, radius = 0, uid, rotate = 0, scale = 1, opacity = 1, shadow, round, children}) => {
  const r = rng(seed * 101 + 7);
  const bars = Array.from({length: 7}, (_, i) => ({h: 18 + r() * 42, o: 0.12 + r() * 0.22, i}));
  const sunX = 30 + r() * 40;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: round ? '50%' : radius,
        overflow: 'hidden',
        transform: `rotate(${rotate}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
        opacity,
        boxShadow: shadow,
        background: mix(accent, accent2, 0.5),
      }}
    >
      {src ? (
        <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
      ) : (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{display: 'block'}}>
          <defs>
            <linearGradient id={`${uid}-art`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={accent} />
              <stop offset="1" stopColor={accent2} />
            </linearGradient>
            <radialGradient id={`${uid}-sun`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#${uid}-art)`} />
          <circle cx={sunX} cy="38" r="19" fill={`url(#${uid}-sun)`} />
          {bars.map((b) => (
            <rect key={b.i} x={b.i * 14.3} y={100 - b.h} width="9" height={b.h} fill="#000000" opacity={b.o} />
          ))}
          <path d="M-5 78 Q 30 56 60 74 T 110 62 L110 105 L-5 105Z" fill={rgbaStr('#000000', 0.28)} />
        </svg>
      )}
      {children}
    </div>
  );
};

export type TransportName = 'play' | 'pause' | 'next' | 'prev' | 'shuffle' | 'repeat' | 'heart';

/** SVG glyph centred on (cx, cy), fitting a `s` x `s` box */
export const TransportIcon: React.FC<{name: TransportName; cx: number; cy: number; s: number; color: string; fill?: boolean}> = ({name, cx, cy, s, color, fill = true}) => {
  const k = s / 24;
  const g = (d: React.ReactNode) => <g transform={`translate(${cx - 12 * k} ${cy - 12 * k}) scale(${k})`}>{d}</g>;
  const stroke = {fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  switch (name) {
    case 'play':
      return g(<path d="M7 4.5 L19.5 12 L7 19.5 Z" fill={color} stroke={color} strokeWidth="1.6" strokeLinejoin="round" />);
    case 'pause':
      return g(
        <>
          <rect x="6" y="4.5" width="4.2" height="15" rx="1.4" fill={color} />
          <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4" fill={color} />
        </>,
      );
    case 'next':
      return g(
        <>
          <path d="M5 5 L16 12 L5 19 Z" fill={color} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="17" y="5" width="2.8" height="14" rx="1.2" fill={color} />
        </>,
      );
    case 'prev':
      return g(
        <>
          <path d="M19 5 L8 12 L19 19 Z" fill={color} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="4.2" y="5" width="2.8" height="14" rx="1.2" fill={color} />
        </>,
      );
    case 'shuffle':
      return g(
        <g {...stroke}>
          <path d="M3 7h3.5c5 0 5 10 10 10H20" />
          <path d="M3 17h3.5c1.6 0 2.7-.8 3.6-1.9" />
          <path d="M13.9 8.9C14.8 7.8 15.1 7 17 7H20" />
          <path d="M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5" />
        </g>,
      );
    case 'repeat':
      return g(
        <g {...stroke}>
          <path d="M4 11V9.5A2.5 2.5 0 0 1 6.5 7H19" />
          <path d="M16.5 4.5L19 7l-2.5 2.5" />
          <path d="M20 13v1.5a2.5 2.5 0 0 1-2.5 2.5H5" />
          <path d="M7.5 19.5L5 17l2.5-2.5" />
        </g>,
      );
    default:
      return g(
        <path
          d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10Z"
          fill={fill ? color : 'none'}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />,
      );
  }
};
