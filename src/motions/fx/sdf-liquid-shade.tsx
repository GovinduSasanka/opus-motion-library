// Adapted from mg-styles-15/demos/07-liquid/js/shaders.js (shadeLiquid, smooth union, env) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useSafeId} from '../../core/image-kit';
import {LiquidShade, hash} from '../../core/r2-mg2b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * The look under every liquid motion: 2D metaballs that read as thick glossy jelly. Coloured balls orbit and fuse with
 * smooth necks (blurred-alpha union that also blends their colours), and the merged height field is lit like a dome:
 * diffuse shading from a key light, a hard specular highlight, a broad softbox sheen, a saturated translucent rim and a
 * fading floor reflection. `LiquidShade` (src/core/r2-mg2b-kit.tsx) wraps any shapes in the same shading.
 */
type Props = {
  colors: string[];
  count: number;
  light: number;
  gloss: number;
  rim: number;
  reflection: number;
  speed: number;
  blur: number;
  seed: number;
  background: string;
};

const Balls: React.FC<{frame: number; w: number; h: number; u: number; colors: string[]; count: number; speed: number; seed: number}> = ({frame, w, h, u, colors, count, speed, seed}) => {
  const cx = w / 2;
  const portrait = h > w;
  const cy = h * (portrait ? 0.45 : 0.5);
  const rx = (portrait ? 0.2 : 0.2) * w;
  const ry = (portrait ? 0.15 : 0.2) * h;
  const k = portrait ? 1.3 : 1;
  return (
    <g>
      {Array.from({length: count}, (_, i) => {
        const ph = hash(seed * 13 + i) * 6.28;
        const om = (0.55 + hash(seed * 7 + i + 3) * 0.7) * speed * 0.035 * (i % 2 ? -1 : 1);
        const x = cx + rx * (0.45 + hash(i + seed) * 0.7) * Math.sin(frame * om + ph);
        const y = cy + ry * (0.45 + hash(i + seed + 9) * 0.7) * Math.cos(frame * om * 1.23 + ph * 1.7);
        const r = (125 + 85 * hash(seed + i * 5)) * u * k * (1 + 0.06 * Math.sin(frame * 0.09 + i));
        return <circle key={i} cx={x} cy={y} r={r} fill={colors[i % colors.length]} />;
      })}
    </g>
  );
};

const SdfLiquidShade: React.FC<Props> = ({colors, count, light, gloss, rim, reflection, speed, blur, seed, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = useSafeId('slq');
  const floorY = h * 0.8;
  const balls = <Balls frame={frame} w={w} h={h} u={u} colors={colors.length ? colors : ['#ff4d8d']} count={count} speed={speed} seed={seed} />;
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <radialGradient id={id + 'bg'} cx="50%" cy="38%" r="75%">
            <stop offset="0" stopColor="#4a3278" />
            <stop offset="0.6" stopColor="#21153f" />
            <stop offset="1" stopColor="#0d0820" />
          </radialGradient>
          <linearGradient id={id + 'fl'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.14} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={id + 'fade'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={reflection} />
            <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={id + 'm'} maskUnits="userSpaceOnUse" x={0} y={floorY} width={w} height={h - floorY}>
            <rect x={0} y={floorY} width={w} height={h - floorY} fill={`url(#${id}fade)`} />
          </mask>
          <clipPath id={id + 'c'}>
            <rect x={0} y={0} width={w} height={floorY} />
          </clipPath>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}bg)`} />
        <rect x={0} y={floorY} width={w} height={h - floorY} fill={`url(#${id}fl)`} />
        <rect x={0} y={floorY} width={w} height={1.5 * u} fill="#ffffff" opacity={0.18} />
        {reflection > 0 && (
          <g mask={`url(#${id}m)`}>
            <g transform={`translate(0,${2 * floorY}) scale(1,-1)`}>
              <LiquidShade id={id + 'r'} w={w} h={h} u={u} blur={blur} gloss={gloss * 0.6} rim={rim} light={light}>
                {balls}
              </LiquidShade>
            </g>
          </g>
        )}
        <LiquidShade id={id} w={w} h={h} u={u} blur={blur} gloss={gloss} rim={rim} light={light}>
          {balls}
        </LiquidShade>
      </Svg>
    </AbsoluteFill>
  );
};

export const sdfLiquidShade = defineMotion<Props>({
  id: 'sdf-liquid-shade',
  title: 'SDF liquid shade',
  category: 'fx',
  description:
    'Coloured metaballs orbit and fuse into thick glossy jelly: smooth necks that blend their colours, dome-shaped diffuse shading from a key light, a hard specular highlight, a broad softbox sheen, a saturated translucent rim and a fading floor reflection.',
  source: ['mg-styles-15 demos/07-liquid/js/shaders.js shadeLiquid / fadd (MIT)', 'video 07-liquid 0-10 s'],
  useFor: 'The shading look under liquid motions: drops, logo melts, blob loaders, liquid buttons and transitions; also a standalone glossy-goo background.',
  durationInFrames: 150,
  defaultProps: {
    colors: ['#ff4d8d', '#ffb02e', '#2ee6c8', '#7a5cff', '#ff6a3d', '#3aa0ff'],
    count: 5,
    light: 225,
    gloss: 1,
    rim: 0.55,
    reflection: 0.3,
    speed: 1,
    blur: 14,
    seed: 4,
    background: '#0d0820',
  },
  propDocs: {
    colors: 'ball colours (hex), cycled over the balls',
    count: 'number of balls',
    light: 'key light azimuth in degrees (225 = upper left)',
    gloss: 'specular strength',
    rim: 'saturated rim glow strength 0..1',
    reflection: 'floor reflection strength 0..1 (0 = none)',
    speed: 'orbit speed multiplier',
    blur: 'merge softness in px at 1080 (bigger = longer necks)',
    seed: 'seed for orbits and sizes',
    background: 'backdrop base colour',
  },
  component: SdfLiquidShade,
  tags: ['liquid', 'metaball', 'goo', 'jelly', 'glossy', 'gloss', 'shader', 'specular', 'rim', 'reflection', 'blob', 'fluid', 'sdf', 'lighting', 'background', 'loader'],
});
