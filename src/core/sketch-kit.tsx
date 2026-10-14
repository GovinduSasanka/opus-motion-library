import React from 'react';
import {AbsoluteFill} from 'remotion';
import {noise2D} from '@remotion/noise';
import {useStage} from './stage';

/**
 * Pencil-sketch look from video20 ("The Little Fix-It Box"): cream paper with fine grain + large blotches,
 * coloured-pencil hatching at -62°, thin ink lines that overshoot corners, and a torn deckle vignette frame.
 * Used by sprout-grow and heart-draw-fill.
 */
export const SK = {
  paper: '#DFD6C5',
  margin: '#E3DAC9',
  bleed: '#C4B9A8',
  ink: '#2E2A26',
  grass: '#C6C9A0',
  leaf: '#7CAE5E',
  stem: '#5F8F4E',
  soil: '#6E5A48',
  planter: '#D9C6B0',
  planterShade: '#C6B9A7',
  heart: '#E38C76',
  heartLine: '#C0403E',
  sparkles: ['#5FA55A', '#4A6FC2', '#E8B84A', '#D65A5A'],
};

/** diagonal coloured-pencil hatch pattern (angle -62° rising right, ~6 px spacing, streaky dashes) */
export const PencilHatch: React.FC<{id: string; color: string; gap?: number; width?: number; opacity?: number; angle?: number; seed?: number}> = ({
  id,
  color,
  gap = 6,
  width = 1.2,
  opacity = 0.5,
  angle = -62,
  seed = 1,
}) => {
  const {u} = useStage();
  const g = gap * u;
  const tile = g * 8;
  const lines = Array.from({length: 8}, (_, i) => {
    const d1 = 40 + ((i * 53 + seed * 17) % 140);
    const d2 = 3 + ((i * 29 + seed * 7) % 8);
    return <line key={i} x1={i * g + g / 2} x2={i * g + g / 2} y1={0} y2={tile} stroke={color} strokeWidth={width * u} strokeOpacity={opacity * (0.7 + ((i * 37) % 10) / 33)} strokeDasharray={`${d1 * u * 0.4} ${d2 * u}`} strokeDashoffset={(i * 23 * u) % tile} />;
  });
  return (
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width={tile} height={tile} patternTransform={`rotate(${angle + 90})`}>
        {lines}
      </pattern>
    </defs>
  );
};

/** cream paper: base colour, fine grain and large soft blotches */
export const SketchPaper: React.FC<{color?: string; seed?: number}> = ({color = SK.paper, seed = 5}) => {
  const {w, h} = useStage();
  return (
    <AbsoluteFill style={{background: color}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <filter id={`skp-grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={1} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <filter id={`skp-blot-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.004} numOctaves={3} seed={seed + 3} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 1.4 -0.5" />
        </filter>
        <rect width={w} height={h} filter={`url(#skp-grain-${seed})`} opacity={0.07} style={{mixBlendMode: 'multiply'}} />
        <rect width={w} height={h} filter={`url(#skp-blot-${seed})`} opacity={0.18} style={{mixBlendMode: 'multiply'}} />
      </svg>
    </AbsoluteFill>
  );
};

/** torn watercolour-paper frame (static); `tint` colours the soft inner bleed */
export const DeckleFrame: React.FC<{tint?: string; margin?: string; seed?: number; inset?: number}> = ({tint = SK.bleed, margin = SK.margin, seed = 2, inset = 0.04}) => {
  const {w, h, u} = useStage();
  const ix = Math.min(w, h) * inset * 1.2;
  const iy = Math.min(w, h) * inset;
  const amp = 16 * u;
  const pts: string[] = [];
  const step = 10 * u;
  const edge = (x0: number, y0: number, x1: number, y1: number, off: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.floor(L / step));
    const nx = -(y1 - y0) / L;
    const ny = (x1 - x0) / L;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const s = (t * L) / u;
      const d = (noise2D(`deckle${seed}`, s * 0.012 + off, 0) * 0.7 + noise2D(`deckle${seed}b`, s * 0.05 + off, 1) * 0.3) * amp;
      pts.push(`${(x0 + (x1 - x0) * t + nx * d).toFixed(1)},${(y0 + (y1 - y0) * t + ny * d).toFixed(1)}`);
    }
  };
  edge(ix, iy, w - ix, iy, 0);
  edge(w - ix, iy, w - ix, h - iy, 10);
  edge(w - ix, h - iy, ix, h - iy, 20);
  edge(ix, h - iy, ix, iy, 30);
  const poly = pts.join(' ');
  const id = `deckle-${seed}`;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <mask id={`${id}-m`}>
          <rect width={w} height={h} fill="#fff" />
          <polygon points={poly} fill="#000" />
        </mask>
        <filter id={`${id}-b`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={14 * u} />
        </filter>
        <filter id={`${id}-g`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={1} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <polygon points={poly} fill="none" stroke={tint} strokeWidth={46 * u} opacity={0.55} filter={`url(#${id}-b)`} style={{mixBlendMode: 'multiply'}} />
      <g mask={`url(#${id}-m)`}>
        <rect width={w} height={h} fill={margin} />
        <rect width={w} height={h} filter={`url(#${id}-g)`} opacity={0.06} style={{mixBlendMode: 'multiply'}} />
      </g>
      <polygon points={poly} fill="none" stroke={tint} strokeWidth={2 * u} opacity={0.35} />
    </svg>
  );
};

/** ink line extended past both ends (architect overshoot), with a tiny fixed perpendicular jitter */
export const InkLine: React.FC<{x1: number; y1: number; x2: number; y2: number; over?: number; width?: number; color?: string; seed?: number; opacity?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  over = 8,
  width = 2,
  color = SK.ink,
  seed = 0,
  opacity = 1,
}) => {
  const {u} = useStage();
  const L = Math.hypot(x2 - x1, y2 - y1) || 1;
  const dx = (x2 - x1) / L;
  const dy = (y2 - y1) / L;
  const o1 = (over * (0.6 + 0.8 * ((seed * 37) % 10) / 10)) * u;
  const o2 = (over * (0.6 + 0.8 * ((seed * 53 + 3) % 10) / 10)) * u;
  const j = (((seed * 71) % 7) / 7 - 0.5) * u;
  return <line x1={x1 - dx * o1 - dy * j} y1={y1 - dy * o1 + dx * j} x2={x2 + dx * o2 - dy * j} y2={y2 + dy * o2 + dx * j} stroke={color} strokeWidth={width * u} strokeLinecap="round" opacity={opacity} />;
};
