import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from './fonts';
import {rng} from './random';
import {useStage} from './stage';

/**
 * "Scientific HUD world" of video11 (A life, in one breath): deep navy void with faint star dust and diagonal
 * streak particles, thin lavender reticles with tick marks, monospace lower-case labels typed with a block cursor.
 * Used by branch-grow and swimmers-converge.
 */
export const VK = {
  bg: '#020414',
  bgCentre: '#0A0D26',
  reticle: '#3C3D54',
  hud: '#A2A2C7',
  stroke: '#C8D0F5',
  membrane: '#D8DAF5',
  teal: '#A3EDE6',
  tealGlow: '#5FD6C8',
  magenta: '#C35CCB',
  cyan: '#62CAD8',
  gold: '#D3B761',
  pink: '#FDCCFB',
};

/** navy void + star dust + slow diagonal streak particles */
export const VoidBg: React.FC<{seed?: number; dust?: number; streaks?: number}> = ({seed = 1, dust = 140, streaks = 18}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const r = rng(seed);
  const stars = Array.from({length: dust}, () => ({x: r() * w, y: r() * h, s: 0.6 + r() * 1.4, o: 0.15 + r() * 0.45, tw: r() * 6}));
  const st = Array.from({length: streaks}, () => ({x: r() * w, y: r() * h, l: (30 + r() * 70) * u, v: (0.6 + r() * 1.4) * u, o: 0.08 + r() * 0.12}));
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, ${VK.bgCentre} 0%, ${VK.bg} 65%, #01000F 100%)`}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s * u} fill="#C9CBF2" opacity={s.o * (0.75 + 0.25 * Math.sin(frame * 0.15 + s.tw))} />
        ))}
        {st.map((s, i) => {
          const x = (((s.x + frame * s.v * 2) % (w + 200 * u)) + w + 200 * u) % (w + 200 * u) - 100 * u;
          const y = (((s.y + frame * s.v) % (h + 200 * u)) + h + 200 * u) % (h + 200 * u) - 100 * u;
          return <line key={`s${i}`} x1={x} y1={y} x2={x - s.l * 0.89} y2={y - s.l * 0.45} stroke="#AFB2EA" strokeWidth={1 * u} opacity={s.o} strokeLinecap="round" />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** thin reticle circle with tick marks (SVG fragment) */
export const Reticle: React.FC<{cx: number; cy: number; r: number; opacity?: number; ticks?: number; rotate?: number; draw?: number}> = ({cx, cy, r, opacity = 1, ticks = 72, rotate = 0, draw = 1}) => {
  const {u} = useStage();
  return (
    <g opacity={opacity} transform={`rotate(${rotate} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={VK.reticle} strokeWidth={1.2 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      {Array.from({length: Math.floor(ticks * draw)}, (_, i) => {
        const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
        const l = (i % 6 === 0 ? 12 : 5) * u;
        return <line key={i} x1={cx + Math.cos(a) * r} y1={cy + Math.sin(a) * r} x2={cx + Math.cos(a) * (r + l)} y2={cy + Math.sin(a) * (r + l)} stroke={VK.reticle} strokeWidth={1 * u} />;
      })}
    </g>
  );
};

/** lower-case mono label typed on with a block cursor (video11 typewriter-mono-label) */
export const TypedLabel: React.FC<{x: number; y: number; text: string; start: number; cps?: number; size?: number; color?: string; sub?: string; anchor?: 'left' | 'right' | 'center'}> = ({
  x,
  y,
  text,
  start,
  cps = 28,
  size = 26,
  color = VK.hud,
  sub,
  anchor = 'left',
}) => {
  const frame = useCurrentFrame();
  const {u} = useStage();
  if (frame < start) return null;
  const n = Math.floor(((frame - start) / 30) * cps);
  const shown = text.slice(0, n);
  const done = n >= text.length;
  const subN = Math.max(0, n - text.length - 4);
  const cursor = !done || Math.floor(frame / 8) % 2 === 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: anchor === 'right' ? 'translateX(-100%)' : anchor === 'center' ? 'translateX(-50%)' : undefined,
        textAlign: anchor,
        fontFamily: fonts.mono,
        fontSize: size * u,
        color,
        letterSpacing: '0.02em',
        whiteSpace: 'pre',
        lineHeight: 1.25,
      }}
    >
      {shown}
      <span style={{opacity: cursor ? 1 : 0}}>▊</span>
      {sub && subN > 0 && <div style={{fontSize: size * 0.74 * u, opacity: 0.7}}>{sub.slice(0, subN)}</div>}
    </div>
  );
};
