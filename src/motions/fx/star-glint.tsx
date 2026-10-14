import React from 'react';
import {Easing} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {FxRoot, isClear, sparkle4Path, useFx} from '../../core/fx-kit';
import {n2, rng} from '../../core/random';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video5 star-glint-flare: white core + soft bloom (r ~6 % H) with 6 spikes — two long diagonals
 * in an X (+-45 deg, ~15 % H each side), one vertical (~10 % H) and short secondary rays. Ramps in
 * over 3 f (easeOutQuad), holds ~1.6 s with shimmer (length +-8 %, rotation +-3 deg at ~6 Hz noise),
 * peaks +20 % at ~1.4 s, decays over 0.6 s (easeInQuad) leaving a light glow.
 * video2 zipper-slide-glint: small 4-point star scale 0->1->0 over 6 f (easeOutBack), repeatable.
 * Optional travel: the glint slides along an edge to `to` during the hold.
 */
type Props = {
  background: string;
  x: number;
  y: number;
  delay: number;
  style: 'flare' | 'twinkle';
  size: number;
  hold: number;
  inFrames: number;
  outFrames: number;
  color: string;
  bloomColor: string;
  spikeAngles: number[];
  shimmer: number;
  to: number[];
  repeat: number;
  every: number;
  showSubject: boolean;
  ink: string;
  seed: number;
};

const quadOut = Easing.out(Easing.quad);
const quadIn = Easing.in(Easing.quad);

/** the 6-spike specular flare, centred on 0,0 */
const Flare: React.FC<{u: number; s: number; k: number; rot: number; jit: number[]; color: string; bloomColor: string; spikes: number[]; id: string}> = ({u, s, k, rot, jit, color, bloomColor, spikes, id}) => {
  const lens = (L: number, wd: number) => `M0 ${-L} Q${wd} 0 0 ${L} Q${-wd} 0 0 ${-L} Z`;
  // primary rays from the source: diagonals 165u, vertical 105u, then short secondaries
  const rays = spikes.map((a, i) => {
    const primary = i < 2;
    const m = ((a % 180) + 180) % 180;
    const vert = (m < 1 || m > 179) && !primary;
    const L = (primary ? 165 : vert ? 105 : 58) * u * s;
    return {a, L: L * (1 + (jit[i % jit.length] ?? 0)), w: (primary ? 7 : vert ? 6 : 4) * u * s};
  });
  return (
    <g transform={`rotate(${rot})`}>
      <defs>
        <radialGradient id={`${id}-bl`}>
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="30%" stopColor={bloomColor} stopOpacity={0.75} />
          <stop offset="65%" stopColor={bloomColor} stopOpacity={0.22} />
          <stop offset="100%" stopColor={bloomColor} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-sp`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0} />
          <stop offset="38%" stopColor={color} stopOpacity={0.75} />
          <stop offset="50%" stopColor={color} stopOpacity={1} />
          <stop offset="62%" stopColor={color} stopOpacity={0.75} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-bf`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2 * u * s} />
        </filter>
        <filter id={`${id}-hf`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={10 * u * s} />
        </filter>
      </defs>
      <circle r={260 * u * s * (0.6 + 0.4 * k)} fill={`url(#${id}-bl)`} opacity={0.55 * k} />
      <circle r={68 * u * s * (0.5 + 0.5 * k)} fill={`url(#${id}-bl)`} opacity={k} />
      <g filter={`url(#${id}-hf)`} opacity={0.6 * k}>
        {rays.slice(0, 3).map((r, i) => (
          <path key={i} d={lens(r.L * k, r.w * 3)} fill={bloomColor} transform={`rotate(${r.a})`} />
        ))}
      </g>
      <g filter={`url(#${id}-bf)`} opacity={k}>
        {rays.map((r, i) => (
          <path key={i} d={lens(r.L * (0.45 + 0.55 * k), r.w)} fill={`url(#${id}-sp)`} transform={`rotate(${r.a})`} />
        ))}
      </g>
      <circle r={12 * u * s * k} fill={color} />
    </g>
  );
};

/** v5 scene: blue-ink etched sword blade rising into frame, etched helmet rows behind */
const BladeScene: React.FC<{tx: number; ty: number; w: number; h: number; u: number; ink: string; shine: number}> = ({tx, ty, w, h, u, ink, shine}) => {
  const bw = 74 * u;
  const bottom = h + 40 * u;
  const guardY = Math.min(h - 110 * u, ty + h * 0.6);
  const r = rng(77);
    return (
    <g>
      <defs>
        <linearGradient id="sg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BBC2D9" />
          <stop offset="55%" stopColor="#C5CCDF" />
          <stop offset="100%" stopColor="#B8BFDA" />
        </linearGradient>
        <pattern id="sg-hatch" patternUnits="userSpaceOnUse" width={7 * u} height={7 * u} patternTransform="rotate(35)">
          <line x1={0} y1={0} x2={0} y2={7 * u} stroke={ink} strokeWidth={1.2 * u} opacity={0.5} />
        </pattern>
        <linearGradient id="sg-blade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B9C1DD" />
          <stop offset="50%" stopColor={shine > 0 ? '#ffffff' : '#E6E9F3'} stopOpacity={1} />
          <stop offset="51%" stopColor="#9CA6CB" />
          <stop offset="100%" stopColor="#7E89B6" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="url(#sg-sky)" />
      {/* distant ridge */}
      <path d={`M0 ${h * 0.5} L${w * 0.12} ${h * 0.43} L${w * 0.25} ${h * 0.48} L${w * 0.4} ${h * 0.38} L${w * 0.55} ${h * 0.46} L${w * 0.72} ${h * 0.4} L${w * 0.88} ${h * 0.47} L${w} ${h * 0.42} L${w} ${h} L0 ${h} Z`} fill="#A9B1CF" stroke={ink} strokeWidth={1.5 * u} opacity={0.75} />
      {/* nearer ridge + snow plain, etched */}
      <path d={`M0 ${h * 0.66} L${w * 0.18} ${h * 0.58} L${w * 0.33} ${h * 0.64} L${w * 0.52} ${h * 0.55} L${w * 0.7} ${h * 0.63} L${w * 0.86} ${h * 0.57} L${w} ${h * 0.62} L${w} ${h} L0 ${h} Z`} fill="#9AA3C6" stroke={ink} strokeWidth={1.6 * u} />
      <path d={`M0 ${h * 0.66} L${w * 0.18} ${h * 0.58} L${w * 0.33} ${h * 0.64} L${w * 0.52} ${h * 0.55} L${w * 0.7} ${h * 0.63} L${w * 0.86} ${h * 0.57} L${w} ${h * 0.62} L${w} ${h} L0 ${h} Z`} fill="url(#sg-hatch)" opacity={0.7} />
      <path d={`M0 ${h * 0.8} Q${w * 0.5} ${h * 0.74} ${w} ${h * 0.8} L${w} ${h} L0 ${h} Z`} fill="#E1E5F1" stroke={ink} strokeWidth={1.6 * u} />
      {Array.from({length: 18}, (_, i) => {
        const yy = h * 0.82 + (i % 6) * h * 0.03;
        const xx = ((i * 0.37) % 1) * w;
        return <line key={i} x1={xx} y1={yy} x2={xx + 90 * u + r() * 80 * u} y2={yy} stroke={ink} strokeWidth={1.2 * u} opacity={0.35} />;
      })}
      {/* blade */}
      <path d={`M${tx} ${ty} L${tx + bw / 2} ${ty + bw * 1.4} L${tx + bw / 2} ${guardY} L${tx - bw / 2} ${guardY} L${tx - bw / 2} ${ty + bw * 1.4} Z`} fill="url(#sg-blade)" stroke={ink} strokeWidth={2.2 * u} strokeLinejoin="round" />
      <line x1={tx} y1={ty + 6 * u} x2={tx} y2={guardY} stroke={ink} strokeWidth={1.4 * u} opacity={0.6} />
      <rect x={tx - bw * 2.2} y={guardY} width={bw * 4.4} height={26 * u} rx={10 * u} fill="#6A74A2" stroke={ink} strokeWidth={2.2 * u} />
      <rect x={tx - bw * 0.36} y={guardY + 26 * u} width={bw * 0.72} height={bottom - guardY} fill="#4A5585" stroke={ink} strokeWidth={2.2 * u} />
      <rect x={tx - bw * 2.2} y={guardY} width={bw * 4.4} height={26 * u} rx={10 * u} fill="url(#sg-hatch)" opacity={0.6} />
      {shine > 0 && <path d={`M${tx} ${ty} L${tx + bw / 2} ${ty + bw * 1.4} L${tx + bw / 2} ${guardY} L${tx - bw / 2} ${guardY} L${tx - bw / 2} ${ty + bw * 1.4} Z`} fill="#fff" opacity={0.35 * shine} />}
    </g>
  );
};

const StarGlint: React.FC<Props> = (p) => {
  const {background, x, y, delay, style, size, hold, inFrames, outFrames, color, bloomColor, spikeAngles, shimmer, to, repeat, every, showSubject, ink, seed} = p;
  const {f, frame, w, h, u, px, py} = useFx(x, y, delay);
  const clear = isClear(background);
  const id = `sg${seed}`;

  // travel along an edge during the hold
  const travel = to.length >= 2 ? ease.sine(prog(f, inFrames, inFrames + hold, ease.linear)) : 0;
  const gx = to.length >= 2 ? lerp(px, to[0] * w, travel) : px;
  const gy = to.length >= 2 ? lerp(py, to[1] * h, travel) : py;

  let glint: React.ReactNode = null;
  let shine = 0;
  if (style === 'twinkle') {
    const items: React.ReactNode[] = [];
    for (let k = 0; k < Math.max(1, repeat); k++) {
      const lf = f - k * every;
      if (lf < 0 || lf > 8) continue;
      const up = Easing.bezier(0.34, 1.56, 0.64, 1)(clamp(lf / 3));
      const sc = lf <= 3 ? up : 1 - quadIn(clamp((lf - 3) / 4));
      shine = Math.max(shine, sc);
      const r = 48 * u * size;
      items.push(
        <g key={k} transform={`translate(${gx} ${gy}) rotate(${lf * 6}) scale(${sc})`}>
          <circle r={r * 0.9} fill={`url(#${id}-tw)`} />
          <path d={sparkle4Path(r, 1.15, 0.1)} fill={color} style={{filter: `drop-shadow(0 0 ${8 * u}px ${bloomColor})`}} />
          <path d={sparkle4Path(r * 0.5, 1, 0.1)} fill={color} transform="rotate(45)" opacity={0.8} />
        </g>,
      );
    }
    glint = (
      <g>
        <defs>
          <radialGradient id={`${id}-tw`}>
            <stop offset="0%" stopColor={color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={bloomColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        {items}
      </g>
    );
  } else {
    const kin = quadOut(clamp(f / Math.max(1, inFrames)));
    const decay = quadIn(clamp((f - inFrames - hold) / Math.max(1, outFrames)));
    const peakAt = inFrames + hold * 0.875;
    const bump = 0.2 * Math.exp(-Math.pow((f - peakAt) / 6, 2));
    const k = f < 0 ? 0 : kin * (1 - decay * 0.88) * (1 + bump);
    shine = f >= -3 ? clamp((f + 3) / 3) * (1 - decay * 0.7) : 0;
    const t = f / 30;
    const jit = Array.from({length: 8}, (_, i) => n2(`sgj${seed}`, i * 3.1, t * 6) * 0.08 * shimmer);
    const rot = n2(`sgr${seed}`, 0.5, t * 6) * 3 * shimmer;
    glint =
      k > 0.001 ? (
        <g transform={`translate(${gx} ${gy})`} style={{mixBlendMode: clear ? 'normal' : 'screen'}}>
          <Flare u={u} s={size} k={k} rot={rot} jit={jit} color={color} bloomColor={bloomColor} spikes={spikeAngles} id={id} />
        </g>
      ) : null;
  }

  return (
    <FxRoot background={background}>
      <Svg>
        {showSubject && !clear && <BladeScene tx={px} ty={py} w={w} h={h} u={u} ink={ink} shine={shine} />}
        {glint}
      </Svg>
    </FxRoot>
  );
};

export const starGlint = defineMotion<Props>({
  id: 'star-glint',
  title: 'Star glint flare',
  category: 'fx',
  description:
    'A six-spike specular "ting" with soft bloom flashes on a blade tip, shimmers through a hold and slowly decays; can slide along an edge, or fire as a quick 4-point twinkle. Overlay-ready: background "transparent".',
  source: ['video5 0.60-2.90 star-glint-flare', 'video2 zipper-slide-glint'],
  useFor: 'Specular highlight on a logo, product edge, blade, badge or coin; "shiny / new / premium" accents.',
  durationInFrames: 90,
  defaultProps: {
    background: '#BBC2D9',
    x: 0.5,
    y: 0.3,
    delay: 14,
    style: 'flare',
    size: 1.7,
    hold: 48,
    inFrames: 3,
    outFrames: 18,
    color: '#FFFFFF',
    bloomColor: '#DDE6FF',
    spikeAngles: [45, 135, 0, 90, 22, 158],
    shimmer: 1,
    to: [],
    repeat: 3,
    every: 20,
    showSubject: true,
    ink: '#2D3A6F',
    seed: 1,
  },
  propDocs: {
    background: "scene colour (lavender sky); 'transparent' = overlay (no blade scene)",
    x: 'glint x (0..1)',
    y: 'glint y (0..1)',
    delay: 'frame the glint fires',
    style: 'flare (v5 6-spike flare with hold) | twinkle (v2 quick 4-point star, repeated)',
    size: 'flare size multiplier',
    hold: 'frames the flare holds with shimmer (v5 ~48)',
    inFrames: 'ramp-in frames (easeOutQuad)',
    outFrames: 'decay frames (easeInQuad)',
    color: 'core / spike colour',
    bloomColor: 'bloom tint',
    spikeAngles: 'spike angles in degrees; first two are the long X diagonals, a vertical (0) is mid-length, others short',
    shimmer: 'shimmer strength (spike length +-8 %, rotation +-3 deg)',
    to: '[x, y] (0..1) to slide the glint along an edge during the hold; [] = stays put',
    repeat: 'twinkle style: number of twinkles',
    every: 'twinkle style: frames between twinkles',
    showSubject: 'draw the etched sword-and-army scene (scene mode only)',
    ink: 'etching ink colour for the scene',
    seed: 'random seed',
  },
  component: StarGlint,
  tags: ['glint', 'flare', 'shine', 'sparkle', 'highlight', 'overlay', 'fx'],
});
