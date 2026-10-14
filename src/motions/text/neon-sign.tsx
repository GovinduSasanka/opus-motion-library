import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, tween} from '../../core/ease';
import {rng} from '../../core/random';
import {FilmGrain, useStage} from '../../core/stage';
import {TFont, estWidth, hash01, tfonts} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Neon sign ignition (video20 neon-sign-ignite "NOODLES"): dark plum plate, rounded tube lettering
 * with a white-pink core and a 12–20 px outer glow. Each letter strikes with a seeded on/off/on
 * flicker, then the sign hums (±3 % brightness) and one faulty letter stutters now and then. The
 * glow spills onto a brick wall; the camera pulls back from the plate after ignition.
 */

type NeonLine = {text: string; color?: string; glow?: string; font?: TFont; size?: number};
type Props = {
  lines: NeonLine[];
  igniteAt: number;
  igniteSpread: number;
  faultyLetter: number;
  plateColor: string;
  wallColor: string;
  color: string;
  glow: string;
  font: TFont;
  tracking: number;
  pullBack: boolean;
  seed: number;
};

const FLICK = [1, 0, 0, 0.35, 1, 0.15, 1];

const brightness = (frame: number, at: number, faulty: boolean, seed: string) => {
  const l = frame - at;
  if (l < 0) return 0;
  if (l < FLICK.length) return FLICK[l];
  let b = 0.96 + 0.03 * Math.sin(frame * 1.9 + at) + 0.015 * Math.sin(frame * 7.3);
  if (faulty) {
    const win = Math.floor(frame / 9);
    const r = rng(`${seed}-f${win}`);
    if (r() < 0.28) {
      const off = Math.floor(r() * 7);
      const k = frame - win * 9;
      if (k === off || k === off + 1) b = 0.12;
      if (k === off + 3) b = 0.5;
    }
  }
  return b;
};

const NeonSign: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const lines = p.lines.length ? p.lines : [{text: 'NEON'}];
  // plate geometry from the longest line
  const plateMaxW = w * (portrait ? 0.86 : 0.62);
  const baseFs = 170 * u;
  const lineFs = lines.map((l) => {
    const f = l.font ?? p.font;
    const fs0 = baseFs * (l.size ?? 1);
    const est = estWidth(l.text, fs0, f, f === p.font ? p.tracking : 0.02);
    return est > plateMaxW * 0.84 ? (fs0 * plateMaxW * 0.84) / est : fs0;
  });
  const plateW = Math.min(plateMaxW, Math.max(...lines.map((l, i) => estWidth(l.text, lineFs[i], l.font ?? p.font, (l.font ?? p.font) === p.font ? p.tracking : 0.02))) / 0.8);
  const plateH = lineFs.reduce((a, b) => a + b * 1.12, 0) + 110 * u;
  // letters (global index for ignition order)
  let gi = 0;
  const letterB: number[][] = lines.map((l) =>
    [...l.text].map(() => {
      const i = gi++;
      const at = p.igniteAt + Math.floor(hash01(i, p.seed) * p.igniteSpread);
      return brightness(frame, at, i === p.faultyLetter, `${p.seed}-${i}`);
    }),
  );
  const flat = letterB.flat();
  const total = flat.length ? flat.reduce((a, b) => a + b, 0) / flat.length : 0;
  // camera: start tight on the plate, pull back ~1.6x after ignition, then a slow drift
  const settle = p.igniteAt + p.igniteSpread + 10;
  const zoom = p.pullBack ? tween(frame, [settle, settle + 20], [Math.max(1, Math.min(1.55, (w * 0.94) / plateW)), 1], ease.inOut) * (1 + 0.0004 * Math.max(0, frame - settle)) : 1 + frame * 0.0003;
  const brickW = 120 * u;
  const brickH = 44 * u;
  const pid = 'neon-brick';
  const mainGlow = lines[0].glow ?? p.glow;
  return (
    <AbsoluteFill style={{background: p.wallColor, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <pattern id={pid} width={brickW} height={brickH * 2} patternUnits="userSpaceOnUse" x={w / 2} y={h / 2}>
              <rect width={brickW} height={brickH * 2} fill="#120c10" />
              <rect x={3 * u} y={3 * u} width={brickW - 6 * u} height={brickH - 6 * u} rx={3 * u} fill={p.wallColor} />
              <rect x={-brickW / 2 + 3 * u} y={brickH + 3 * u} width={brickW - 6 * u} height={brickH - 6 * u} rx={3 * u} fill={p.wallColor} />
              <rect x={brickW / 2 + 3 * u} y={brickH + 3 * u} width={brickW - 6 * u} height={brickH - 6 * u} rx={3 * u} fill={p.wallColor} />
            </pattern>
            <radialGradient id="neon-spill" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={mainGlow} stopOpacity={0.75} />
              <stop offset="0.5" stopColor={mainGlow} stopOpacity={0.22} />
              <stop offset="1" stopColor={mainGlow} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="neon-vig" cx="0.5" cy="0.5" r="0.75">
              <stop offset="0.4" stopColor="#000" stopOpacity={0} />
              <stop offset="1" stopColor="#000" stopOpacity={0.75} />
            </radialGradient>
            <linearGradient id="neon-plate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.plateColor} />
              <stop offset="1" stopColor="#24181f" />
            </linearGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${pid})`} />
          <ellipse cx={w / 2} cy={h / 2} rx={plateW * 1.25} ry={plateH * 2.1} fill="url(#neon-spill)" opacity={total * 0.9} style={{mixBlendMode: 'screen'}} />
          {/* mounting rods */}
          {[-0.36, 0.36].map((k, i) => (
            <rect key={i} x={w / 2 + k * plateW - 4 * u} y={h / 2 - plateH / 2 - 60 * u} width={8 * u} height={60 * u} fill="#3a2b33" />
          ))}
          <rect x={w / 2 - plateW / 2 + 10 * u} y={h / 2 - plateH / 2 + 16 * u} width={plateW} height={plateH} rx={20 * u} fill="#000" opacity={0.45} />
          <rect x={w / 2 - plateW / 2} y={h / 2 - plateH / 2} width={plateW} height={plateH} rx={20 * u} fill="url(#neon-plate)" stroke="#5c4452" strokeWidth={2 * u} />
          <rect x={w / 2 - plateW / 2} y={h / 2 - plateH / 2} width={plateW} height={plateH} rx={20 * u} fill={mainGlow} opacity={total * 0.12} />
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sy], i) => (
            <circle key={i} cx={w / 2 + sx * (plateW / 2 - 26 * u)} cy={h / 2 + sy * (plateH / 2 - 24 * u)} r={6 * u} fill="#6b5662" stroke="#20161b" strokeWidth={1.5 * u} />
          ))}
          <rect width={w} height={h} fill="url(#neon-vig)" />
        </svg>
        <div style={{position: 'absolute', left: 0, right: 0, top: h / 2, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {lines.map((l, li) => {
            const col = l.color ?? p.color;
            const gl = l.glow ?? p.glow;
            const fs = lineFs[li];
            const f = l.font ?? p.font;
            return (
              <div key={li} style={{fontFamily: tfonts[f], fontWeight: f === 'hand' ? 700 : 400, fontSize: fs, lineHeight: 1.12, letterSpacing: `${f === p.font ? p.tracking : 0.02}em`, whiteSpace: 'pre', paddingLeft: `${f === p.font ? p.tracking : 0}em`}}>
                {[...l.text].map((c, i) => {
                  const b = letterB[li][i];
                  const g = clamp(b);
                  return (
                    <span
                      key={i}
                      style={{
                        color: g > 0.05 ? mixToWhite(col, 0.55 * g) : '#4c3843',
                        opacity: 0.55 + 0.45 * Math.max(g, 0.2),
                        WebkitTextStroke: `${1.2 * u}px ${g > 0.05 ? col : '#5f4653'}`,
                        textShadow:
                          g > 0.05
                            ? `0 0 ${2 * u}px rgba(255,255,255,${0.9 * g}), 0 0 ${7 * u}px ${col}, 0 0 ${16 * u}px ${col}, 0 0 ${30 * u * g}px ${gl}, 0 0 ${60 * u * g}px ${gl}`
                            : `0 ${2 * u}px ${2 * u}px rgba(0,0,0,0.6)`,
                      }}
                    >
                      {c}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <FilmGrain opacity={0.07} />
    </AbsoluteFill>
  );
};

/** lighten a #rrggbb colour toward white */
const mixToWhite = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (sh: number) => Math.round(((n >> sh) & 255) + (255 - ((n >> sh) & 255)) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

export const neonSign = defineMotion<Props>({
  id: 'neon-sign',
  title: 'Neon sign ignite',
  category: 'text',
  description: 'Dark plum plate on a brick wall; rounded neon lettering strikes on letter by letter with flicker, then hums, with one faulty letter stuttering and glow spilling onto the wall.',
  source: ['video20 1:30.7-1:32.5'],
  useFor: 'Shop/venue names, nightlife or retro beats, "open" moments and glowing titles.',
  durationInFrames: 150,
  defaultProps: {
    lines: [
      {text: 'NOODLES', color: '#f59ac4', glow: '#be5b80'},
      {text: 'open late', color: '#8be9ff', glow: '#2f9fc9', font: 'hand', size: 0.5},
    ],
    igniteAt: 16,
    igniteSpread: 22,
    faultyLetter: 4,
    plateColor: '#45323e',
    wallColor: '#2a1c22',
    color: '#f59ac4',
    glow: '#be5b80',
    font: 'neon',
    tracking: 0.08,
    pullBack: true,
    seed: 5,
  },
  propDocs: {
    lines: '[{text, color?, glow?, font?, size?}] neon lines stacked on the plate (size is relative to the first line)',
    igniteAt: 'frame the first letters strike',
    igniteSpread: 'frames over which the letters strike in random order',
    faultyLetter: 'index (across all lines) of a letter that keeps stuttering; -1 = none',
    plateColor: 'sign plate colour',
    wallColor: 'brick colour',
    color: 'default tube colour',
    glow: 'default outer glow colour',
    font: 'font role for lines without their own (neon = Tilt Neon)',
    tracking: 'letter spacing in em for the main font',
    pullBack: 'start tight on the plate and pull back after ignition',
    seed: 'changes the ignition order and stutters',
  },
  component: NeonSign,
  tags: ['neon', 'sign', 'glow', 'flicker', 'title'],
});
