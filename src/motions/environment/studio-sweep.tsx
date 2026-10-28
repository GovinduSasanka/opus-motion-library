// Adapted from lemo-opuscar/styles/teardown/STYLE.md §2–3 + demo/src/main.js (sweep light) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {fx, lerp, mixHex, seg, useUid} from '../../core/r2-lb2b-kit';

/**
 * Dark graphite photographic seamless: a soft radial gradient with the floor implied only by a blurred contact shadow
 * under the subject, plus an optional slow light sweep — a narrow softbox gliding across at ~0.3 of the key's intensity.
 * Drop any alpha PNG (`src`) on it, or put a 3D motion over it (the default subject is a glossy demo object).
 */
type Props = {
  center: string;
  edge: string;
  centerAt: number[];
  radius: number;
  shadow: number;
  sweep: boolean;
  sweepFrames: number;
  sweepIntensity: number;
  subject: 'sphere' | 'slab' | 'none';
  subjectColor: string;
  src: string;
  focus: number[];
  scale: number;
};

const StudioSweep: React.FC<Props> = ({center, edge, centerAt, radius, shadow, sweep, sweepFrames, sweepIntensity, subject, subjectColor, src, focus, scale}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const uid = useUid('ssw');
  const enter = seg(frame, 0, 24);
  const e = enter * enter * (3 - 2 * enter);
  const float = Math.sin((frame / 90) * Math.PI * 2) * 4 * u;
  const fxp = focus[0] * w;
  const fyp = focus[1] * h + float - (1 - e) * 24 * u;
  const R = Math.min(w, h) * 0.3 * scale;
  const shadowY = focus[1] * h + R * (subject === 'slab' ? 0.72 : 1.0) + 18 * u;
  // sweep: one pass across the frame, intensity sin(pi u)^0.7
  const su = seg(frame % Math.max(1, durationInFrames), 12, 12 + sweepFrames);
  const sI = sweep ? Math.pow(Math.sin(Math.PI * su), 0.7) * sweepIntensity : 0;
  const sx = lerp(-0.2, 1.2, su) * w;
  const bandW = w * 0.12;
  const hi = mixHex(subjectColor, '#ffffff', 0.55);
  const lo = mixHex(subjectColor, '#000000', 0.45);
  const subjectEl =
    subject === 'none' && !src ? null : src ? (
      <image href={resolveSrc(src)} x={fxp - R * 1.4} y={fyp - R * 1.4} width={R * 2.8} height={R * 2.8} preserveAspectRatio="xMidYMid meet" />
    ) : subject === 'sphere' ? (
      <g>
        <circle cx={fxp} cy={fyp} r={R} fill={`url(#${uid}sph)`} />
        <circle cx={fxp} cy={fyp} r={R} fill="none" stroke={hi} strokeOpacity={0.25} strokeWidth={2 * u} />
        <g clipPath={`url(#${uid}clipS)`}>
          <rect x={sx - bandW / 2} y={fyp - R} width={bandW} height={R * 2} fill={`url(#${uid}band)`} opacity={sI * 2.2} transform={`skewX(-14) translate(${fx(fyp * 0.25)},0)`} />
        </g>
      </g>
    ) : (
      <g>
        <rect x={fxp - R * 0.62} y={fyp - R * 0.85} width={R * 1.24} height={R * 1.7} rx={R * 0.14} fill={`url(#${uid}slab)`} />
        <rect x={fxp - R * 0.62} y={fyp - R * 0.85} width={R * 1.24} height={R * 1.7} rx={R * 0.14} fill="none" stroke={hi} strokeOpacity={0.3} strokeWidth={2 * u} />
        <rect x={fxp - R * 0.55} y={fyp - R * 0.78} width={R * 1.1} height={R * 1.56} rx={R * 0.1} fill="#050607" />
        <g clipPath={`url(#${uid}clipB)`}>
          <rect x={sx - bandW / 2} y={fyp - R} width={bandW} height={R * 2} fill={`url(#${uid}band)`} opacity={sI * 2.2} transform={`skewX(-14) translate(${fx(fyp * 0.25)},0)`} />
        </g>
      </g>
    );
  return (
    <AbsoluteFill style={{background: edge}}>
      <Svg>
        <defs>
          <radialGradient id={`${uid}bg`} cx={centerAt[0]} cy={centerAt[1]} r={radius} gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor={center} />
            <stop offset="1" stopColor={edge} />
          </radialGradient>
          <radialGradient id={`${uid}sph`} cx="0.36" cy="0.3" r="0.8">
            <stop offset="0" stopColor={hi} />
            <stop offset="0.45" stopColor={subjectColor} />
            <stop offset="1" stopColor={lo} />
          </radialGradient>
          <linearGradient id={`${uid}slab`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={hi} />
            <stop offset="1" stopColor={lo} />
          </linearGradient>
          <linearGradient id={`${uid}band`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id={`${uid}blur`} x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation={w * 0.03} />
          </filter>
          <clipPath id={`${uid}clipS`}>
            <circle cx={fxp} cy={fyp} r={R} />
          </clipPath>
          <clipPath id={`${uid}clipB`}>
            <rect x={fxp - R * 0.55} y={fyp - R * 0.78} width={R * 1.1} height={R * 1.56} rx={R * 0.1} />
          </clipPath>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}bg)`} />
        {/* the room's softbox sweep across the seamless itself */}
        <rect x={sx - bandW * 1.6} y={0} width={bandW * 3.2} height={h} fill={`url(#${uid}band)`} opacity={sI * 0.5} style={{mixBlendMode: 'screen'}} transform={`skewX(-14) translate(${fx(h * 0.125)},0)`} />
        {/* contact shadow only — the floor is never drawn */}
        {(subject !== 'none' || src) && <ellipse cx={fxp} cy={shadowY} rx={R * 0.95 * (1 - 0.05 * (float / (4 * u || 1)))} ry={R * 0.14} fill="#000" opacity={shadow * e} filter={`url(#${uid}blur)`} />}
        <g opacity={e}>{subjectEl}</g>
      </Svg>
    </AbsoluteFill>
  );
};

export const studioSweep = defineMotion<Props>({
  id: 'studio-sweep',
  title: 'Studio sweep (graphite seamless backdrop)',
  category: 'environment',
  description:
    'A dark graphite photographic seamless: a soft radial gradient with the floor implied only by a blurred contact shadow beneath a glossy subject, and a slow narrow softbox light sweep gliding across the set.',
  source: ['lemo-opuscar styles/teardown STYLE.md §2–3, demo/src/main.js sweep light (MIT, LemoLab)'],
  useFor: 'Instant premium packshot background for product cut-outs (src PNG with alpha), logos and 3D motions; set `subject: "none"` for a bare backdrop.',
  durationInFrames: 180,
  defaultProps: {
    center: '#34363a',
    edge: '#0d0e10',
    centerAt: [0.5, 0.42],
    radius: 0.9,
    shadow: 0.38,
    sweep: true,
    sweepFrames: 126,
    sweepIntensity: 0.3,
    subject: 'sphere',
    subjectColor: '#8b9099',
    src: '',
    focus: [0.5, 0.46],
    scale: 1,
  },
  propDocs: {
    center: 'gradient centre colour',
    edge: 'gradient edge colour',
    centerAt: 'gradient centre as 0..1 [x, y]',
    radius: 'gradient radius as a fraction of the frame',
    shadow: 'contact shadow opacity',
    sweep: 'run the softbox sweep',
    sweepFrames: 'length of the sweep in frames (4.2 s default)',
    sweepIntensity: 'peak sweep strength (0.3 of key)',
    subject: "demo subject: 'sphere', 'slab' or 'none'",
    subjectColor: 'demo subject metal colour',
    src: 'optional alpha PNG (public path) shown instead of the demo subject',
    focus: 'subject position as 0..1 [x, y]',
    scale: 'subject size multiplier',
  },
  component: StudioSweep,
  tags: ['backdrop', 'studio', 'packshot', 'product', 'seamless', 'graphite', 'light sweep', 'softbox', 'contact shadow', 'background', 'overlay', 'premium'],
});
