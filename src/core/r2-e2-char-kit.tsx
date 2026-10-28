import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from './ease';
import {fonts} from './fonts';
import {rng} from './random';
import {Svg, useStage} from './stage';

/**
 * Round-2 group E2: crowd-bob mode 'beans' — toy bean contestants drop from the sky one per half-beat onto a floor
 * band, then hop on the beat (neighbours on the off-beat) and shout on accents. Original bean design; timing idea
 * from lemo-opuscar styles/game-show (MIT) — see THIRD_PARTY_NOTICES.md.
 */

const BEAN_COLORS = ['#F2B94B', '#E9697A', '#6CC7B1', '#7DA7F2', '#B58BE0', '#F29A5B', '#8CCB6A', '#F08AB8'];
const NAMES = ['Ava', 'Bo', 'Cleo', 'Dex', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivo', 'Juno', 'Kit', 'Lia'];
const ACCS = ['antenna', 'heart', 'question', 'bolt', 'sprout', 'beret'] as const;

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (sh: number) => Math.max(0, Math.min(255, Math.round(((n >> sh) & 255) * k)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

const Accessory: React.FC<{kind: (typeof ACCS)[number]; s: number; color: string}> = ({kind, s, color}) => {
  const top = -86 * s;
  switch (kind) {
    case 'antenna':
      return (
        <g>
          <line x1={0} y1={top + 4 * s} x2={0} y2={top - 22 * s} stroke="#2A2430" strokeWidth={4 * s} strokeLinecap="round" />
          <circle cx={0} cy={top - 28 * s} r={9 * s} fill="#FF5C7A" stroke="#2A2430" strokeWidth={3 * s} />
        </g>
      );
    case 'heart':
      return <path transform={`translate(0 ${top - 14 * s}) scale(${s})`} d="M0 10 C-22 -6 -12 -24 0 -12 C12 -24 22 -6 0 10Z" fill="#FF5C7A" stroke="#2A2430" strokeWidth={3} strokeLinejoin="round" />;
    case 'question':
      return (
        <text x={0} y={top - 8 * s} textAnchor="middle" fontFamily={fonts.display} fontSize={40 * s} fill="#fff" stroke="#2A2430" strokeWidth={4 * s} paintOrder="stroke">
          ?
        </text>
      );
    case 'bolt':
      return <path transform={`translate(0 ${top - 16 * s}) scale(${s})`} d="M4 -18 L-10 4 L-1 4 L-5 20 L12 -4 L2 -4Z" fill="#FFD84A" stroke="#2A2430" strokeWidth={3} strokeLinejoin="round" />;
    case 'sprout':
      return (
        <g transform={`translate(0 ${top + 4 * s}) scale(${s})`}>
          <path d="M0 0 Q0 -18 2 -26" stroke="#2F7A3A" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M2 -26 Q-18 -34 -20 -16 Q-4 -14 2 -26Z" fill="#7BCB5A" stroke="#2A2430" strokeWidth={3} />
          <path d="M2 -26 Q22 -36 24 -18 Q8 -14 2 -26Z" fill="#7BCB5A" stroke="#2A2430" strokeWidth={3} />
        </g>
      );
    default:
      return <ellipse cx={4 * s} cy={top + 6 * s} rx={30 * s} ry={11 * s} fill={color} stroke="#2A2430" strokeWidth={3 * s} transform={`rotate(-8 0 ${top})`} />;
  }
};

const Bean: React.FC<{color: string; s: number; shout: number; blink: boolean; acc: (typeof ACCS)[number]; name: string; sq: number}> = ({color, s, shout, blink, acc, name, sq}) => {
  const ink = '#2A2430';
  return (
    <g>
      <ellipse cx={0} cy={2 * s} rx={62 * s} ry={9 * s} fill="#000" opacity={0.18} />
      <g transform={`scale(${1 / sq} ${sq})`}>
        {/* arms: mitten hands, up when shouting */}
        {[-1, 1].map((d) => (
          <g key={d}>
            <path d={`M${d * 58 * s} ${-52 * s} Q${d * (84 + 10 * shout) * s} ${(-42 - 50 * shout) * s} ${d * (82 + 6 * shout) * s} ${(-30 - 84 * shout) * s}`} stroke={ink} strokeWidth={14 * s} strokeLinecap="round" fill="none" />
            <path d={`M${d * 58 * s} ${-52 * s} Q${d * (84 + 10 * shout) * s} ${(-42 - 50 * shout) * s} ${d * (82 + 6 * shout) * s} ${(-30 - 84 * shout) * s}`} stroke={color} strokeWidth={9 * s} strokeLinecap="round" fill="none" />
            <circle cx={d * (82 + 6 * shout) * s} cy={(-30 - 84 * shout) * s} r={14 * s} fill="#fff" stroke={ink} strokeWidth={4 * s} />
          </g>
        ))}
        <path d={`M${-56 * s} 0 C${-70 * s} ${-60 * s} ${-52 * s} ${-170 * s} 0 ${-172 * s} C${52 * s} ${-170 * s} ${70 * s} ${-60 * s} ${56 * s} 0 Z`} fill={color} stroke={ink} strokeWidth={5 * s} strokeLinejoin="round" />
        <ellipse cx={0} cy={-38 * s} rx={34 * s} ry={30 * s} fill={shade(color, 1.12)} opacity={0.75} />
        <Accessory kind={acc} s={s} color={shade(color, 0.7)} />
        {/* face */}
        {[-1, 1].map((d) => (
          <g key={d}>
            <ellipse cx={d * 20 * s} cy={-118 * s} rx={9 * s} ry={blink ? 1.5 * s : 14 * s} fill={ink} />
            {!blink && <circle cx={d * 20 * s + 3 * s} cy={-123 * s} r={3.4 * s} fill="#fff" />}
            <ellipse cx={d * 38 * s} cy={-96 * s} rx={9 * s} ry={5.5 * s} fill="#FF7E8F" opacity={0.55} />
          </g>
        ))}
        {shout > 0.3 ? (
          <ellipse cx={0} cy={-90 * s} rx={11 * s} ry={(8 + 8 * shout) * s} fill={ink} />
        ) : (
          <path d={`M${-9 * s} ${-92 * s} Q0 ${-84 * s} ${9 * s} ${-92 * s}`} stroke={ink} strokeWidth={4 * s} fill="none" strokeLinecap="round" />
        )}
      </g>
      {name && (
        <g transform={`translate(0 ${22 * s})`}>
          <rect x={-(name.length * 8.2 + 16) * s / 2} y={-11 * s} width={(name.length * 8.2 + 16) * s} height={22 * s} rx={11 * s} fill="#fff" stroke={ink} strokeWidth={3 * s} />
          <text textAnchor="middle" y={5.5 * s} fontFamily={fonts.sans} fontWeight={800} fontSize={14 * s} fill={ink}>
            {name}
          </text>
        </g>
      )}
    </g>
  );
};

export const BeanStage: React.FC<{count: number; bpm: number; startAt: number; names: string[]; background: string; hop: number; shoutEvery: number; seed: number}> = ({count, bpm, startAt, names, background, hop, shoutEvery, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const beat = (30 * 60) / Math.max(60, bpm);
  const n = Math.max(2, Math.min(24, Math.round(count)));
  const rows = portrait ? 3 : 2;
  const r = rng(seed);
  const items = Array.from({length: n}, (_, i) => {
    const row = i % rows;
    const inRow = Math.floor(i / rows);
    const perRow = Math.ceil(n / rows);
    const x = ((inRow + 0.5 + (row % 2 ? 0.35 : 0)) / (perRow + 0.4)) * w + (r() - 0.5) * 14 * u;
    return {row, x, color: BEAN_COLORS[i % BEAN_COLORS.length], acc: ACCS[(i * 5 + 1) % ACCS.length], name: names[i % names.length] ?? NAMES[i % NAMES.length], blinkAt: Math.floor(r() * 50)};
  });
  const floorY0 = h * (portrait ? 0.46 : 0.55);
  const bandH = h - floorY0;
  const order = items.map((_, i) => i).sort((a, b) => items[a].row - items[b].row || a - b);
  const shoutBeat = Math.floor((frame - startAt) / beat);
  const shoutNow = shoutEvery > 0 && shoutBeat >= 0 && shoutBeat % shoutEvery === shoutEvery - 1 ? 1 - clamp(((frame - startAt) % beat) / (beat * 0.7)) : 0;
  return (
    <AbsoluteFill style={{background: background || 'linear-gradient(180deg, #FFE9B8 0%, #FFD0A0 46%, #FFB783 100%)'}}>
      <Svg>
        <rect y={floorY0} width={w} height={bandH} fill="#9A5FD6" />
        <rect y={floorY0} width={w} height={8 * u} fill="#B98CF0" />
        {Array.from({length: 18}, (_, i) => (
          <rect key={i} x={((i * 2.6) % 1) * w * 1.0 + (i % 3) * w * 0.3 - w * 0.05} y={floorY0 + 14 * u + (i % 4) * (bandH / 4.4)} width={w * 0.07} height={5 * u} rx={2.5 * u} fill="#ffffff" opacity={0.12} />
        ))}
        {order.map((i) => {
          const it = items[i];
          const t0 = startAt + i * (beat / 2);
          const a = frame - t0;
          if (a < 0) return null;
          const baseS = (portrait ? 0.95 : 1.15) * u * (it.row === 0 ? 0.88 : it.row === 1 ? 1 : 1.1);
          const rowY = floorY0 + bandH * (0.28 + 0.3 * (it.row / Math.max(1, rows - 1)));
          const fall = 0.28 * 30;
          const k = clamp(a / fall);
          const dropY = -(rowY + 200 * u) * (1 - ease.in(k));
          // landing squash then hop on the beat (neighbours on the off-beat)
          const since = Math.max(0, a - fall);
          const sq = k < 1 ? 1 + 0.08 * k : 1 - 0.18 * Math.exp(-since * 0.4) * Math.cos(since * 0.8);
          const ph = (((frame - t0 + (i % 2) * (beat / 2)) % beat) + beat) % beat;
          const hopY = k >= 1 && since > 6 ? Math.abs(Math.sin((ph / beat) * Math.PI)) * hop * 24 * u : 0;
          const blink = (frame + it.blinkAt) % 56 < 3;
          return (
            <g key={i} transform={`translate(${it.x} ${rowY + dropY - hopY})`}>
              <Bean color={it.color} s={baseS} shout={k >= 1 ? shoutNow : 0} blink={blink} acc={it.acc} name={it.name} sq={Math.max(0.6, sq)} />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};
