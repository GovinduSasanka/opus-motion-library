// Adapted from lemo-opuscar/styles/one-line/demo/ink.js (drawBlots) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {blotPath, hexRgb, lbf, seg, ss} from '../../core/r2-lb1-kit';

/**
 * Ink-blot stop: where a pen pauses, ink slowly soaks into the paper as a teardrop — the tip stays at the nib while
 * the round belly sags downward as it grows, with an irregular rim and a darker tide line. Several blots with their
 * own timing; optional handwritten word under each. Transparent overlay by default — the "hesitation / loss /
 * signature" beat for any ink style.
 */

type Blot = {x: number; y: number; start: number; dur?: number; size?: number; label?: string};
type Props = {
  blots: Blot[];
  color: string;
  lineWidth: number;
  tideLine: number;
  labelColor: string;
  paper: string;
  seed: number;
  background: string;
};

const InkBlotStop: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'ink-blot-stop';
  const [r, g, b] = hexRgb(p.color);
  const transparent = p.background === 'transparent';
  return (
    <AbsoluteFill style={{background: transparent ? 'transparent' : p.background === 'paper' ? p.paper : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${id}-soak`} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency={0.06 / u} numOctaves={2} seed={p.seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={3.5 * u} />
            <feGaussianBlur stdDeviation={0.5 * u} />
          </filter>
        </defs>
        {p.blots.map((bl, i) => {
          const dur = bl.dur ?? 40;
          const uK = seg(frame, bl.start, bl.start + dur);
          if (uK <= 0) return null;
          const gK = 1 - Math.pow(1 - uK, 2.2);
          const size = (bl.size ?? 1) * 2.6 * u * (portrait ? 1.7 : 1);
          const bp = blotPath(bl.x * w, bl.y * h, gK, p.lineWidth * u, size, p.seed + i * 7);
          const rimId = `${id}-rim${i}`;
          const lk = bl.label ? ss(seg(frame, bl.start + dur * 0.7, bl.start + dur * 0.7 + 14)) : 0;
          return (
            <g key={i} filter={`url(#${id}-soak)`}>
              <defs>
                <radialGradient id={rimId} cx="0.5" cy="0.42" r="0.62">
                  <stop offset="0" stopColor={`rgba(${r},${g},${b},0.82)`} />
                  <stop offset="0.55" stopColor={`rgba(${r},${g},${b},0.66)`} />
                  <stop offset="0.88" stopColor={`rgba(${r},${g},${b},${0.66 + p.tideLine * 0.32})`} />
                  <stop offset="1" stopColor={`rgba(${r},${g},${b},0.7)`} />
                </radialGradient>
              </defs>
              <path d={bp.d} fill={`url(#${rimId})`} />
              {/* the contact dot at the original nib point stays darkest */}
              <circle cx={bl.x * w} cy={bl.y * h} r={Math.max(1.5 * u, p.lineWidth * 0.8 * u)} fill={p.color} />
              {lk > 0 && (
                <text x={bl.x * w} y={bp.cy + bp.R + 52 * u} textAnchor="middle" fontFamily={lbf('caveat')} fontWeight={500} fontSize={(portrait ? 58 : 42) * u} fill={p.labelColor} opacity={lk * 0.9} filter="none">
                  {bl.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const inkBlotStop = defineMotion<Props>({
  id: 'ink-blot-stop',
  title: 'Ink blot (pen stop)',
  category: 'fx',
  description:
    'Where the pen stops, ink soaks into the paper as a growing teardrop: the tip stays at the nib, the belly sags downward, the rim is irregular with a darker tide line; several blots with their own timing and optional handwritten words. Transparent overlay by default.',
  source: ['lemo-opuscar styles/one-line (MIT code, CC BY 4.0 docs, LemoLab) — demo/ink.js drawBlots'],
  useFor: 'A hesitation / loss / signature beat in ink, pencil, ink-wash or woodcut styles; punctuation in hand-drawn explainers.',
  durationInFrames: 120,
  defaultProps: {
    blots: [
      {x: 0.38, y: 0.42, start: 6, dur: 46, size: 3.2},
      {x: 0.6, y: 0.55, start: 40, dur: 40, size: 2, label: 'and then…'},
      {x: 0.47, y: 0.68, start: 74, dur: 36, size: 1.3},
    ],
    color: '#1D1A17',
    lineWidth: 5,
    tideLine: 0.9,
    labelColor: '#1D1A17',
    paper: '#F4EFE4',
    seed: 11,
    background: 'paper',
  },
  propDocs: {
    blots: 'blots [{x, y (0..1), start (frame), dur?, size? (1 = small), label?}]',
    color: 'ink colour',
    lineWidth: 'the stopped line\'s width in u (sets the initial dot)',
    tideLine: 'darker rim strength 0..1',
    labelColor: 'handwritten label colour',
    paper: 'paper colour when background is "paper"',
    seed: 'rim-noise seed',
    background: '"paper", "transparent" (overlay) or any colour',
  },
  component: InkBlotStop,
  tags: ['ink', 'blot', 'teardrop', 'soak', 'pen stop', 'hesitation', 'overlay', 'hand drawn', 'one line', 'stain', 'paper'],
});
