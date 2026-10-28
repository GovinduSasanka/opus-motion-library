import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {BlurFilter, StarField, TAU, areaK, hash01, isTransparent} from '../../core/environment-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Starfield night (video15 starfield-moon-night + grain-speckle-overlay).
 * Dark teal #0c1820 sky, ~80 cream (#fdf3db) stars r 1-2.5 px at 0.3-0.9 opacity twinkling ±0.3
 * (1.5-3 s periods), a grainy crescent moon (difference of two circles, r 38 px, inner offset
 * (+16, −10)) that fades + scales in over 0.5 s ease-out, teal grass swaying along the bottom
 * (#253a43 base -> #3f7f86 tips), an optional shooting star and a static print speckle.
 */
type Props = {
  background: string;
  backdrop: boolean;
  starCount: number;
  starColor: string;
  moon: boolean;
  moonPos: number[];
  moonSize: number;
  moonPhase: number;
  shootingStar: boolean;
  shootingAt: number;
  grass: boolean;
  grain: boolean;
  seed: number;
  /** a wave of brightened twinkles spreading from a point ({x, y} 0..1, at = frame) */
  ripple: {x: number; y: number; at: number} | null;
  rippleSpeed: number;
};

const Grass: React.FC<{t: number; seed: number}> = ({t, seed}) => {
  const {w, h, u, portrait} = useStage();
  const layers = [
    {top: portrait ? 0.86 : 0.8, len: [90, 210], step: 9, dark: '#18292F', tip: '#2B4B53'},
    {top: portrait ? 0.9 : 0.86, len: [60, 170], step: 7, dark: '#1E3239', tip: '#3F7F86'},
  ];
  return (
    <g>
      {layers.map((L, li) => {
        let d = '';
        const base = h + 4 * u;
        for (let x = -10 * u, i = 0; x < w + 10 * u; x += L.step * u * (0.6 + 0.8 * hash01(seed, li, i, 1)), i++) {
          const len = (L.len[0] + (L.len[1] - L.len[0]) * Math.pow(hash01(seed, li, i, 2), 1.5)) * u * (portrait ? 1.5 : 1);
          const bw = (5 + 5 * hash01(seed, li, i, 3)) * u;
          const lean = (hash01(seed, li, i, 4) - 0.5) * len * 0.35;
          const sway = (5 + 5 * (len / (150 * u))) * u * Math.sin(t * 1.3 + x * 0.006 + li) + 2 * u * Math.sin(t * 3.1 + i);
          const tx = x + lean + sway;
          const ty = base - len - (h - base) - (h * (1 - L.top) - 150 * u) * 0;
          d += `M${(x - bw / 2).toFixed(1)} ${base.toFixed(1)}Q${(x + lean * 0.3).toFixed(1)} ${(base - len * 0.6).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}Q${(x + lean * 0.35 + bw * 0.3).toFixed(1)} ${(base - len * 0.55).toFixed(1)} ${(x + bw / 2).toFixed(1)} ${base.toFixed(1)}Z`;
        }
        return (
          <g key={li}>
            <defs>
              <linearGradient id={`sfn-grass${li}`} x1={0} y1={h - 230 * u * (portrait ? 1.5 : 1)} x2={0} y2={h} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={L.tip} />
                <stop offset="1" stopColor={L.dark} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#sfn-grass${li})`} />
          </g>
        );
      })}
    </g>
  );
};

const StarfieldNight: React.FC<Props> = ({background, backdrop, starCount, starColor, moon, moonPos, moonSize, moonPhase, shootingStar, shootingAt, grass, grain, seed, ripple, rippleSpeed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames} = useStage();
  const t = frame / fps;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const starFade = prog(frame, 4, 28, ease.sine);
  const mIn = prog(frame, 0, 15, ease.out);
  const mx = (moonPos[0] ?? 0.7) * w;
  const my = (moonPos[1] ?? 0.22) * h + 6 * u * Math.sin(t * 0.25);
  const R = moonSize * u;
  const off = R * moonPhase;
  const moonD = `M ${mx - R} ${my} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z`;

  // shooting star: 0.7 s streak from upper-left heading down-right
  const s0 = Math.round(shootingAt * durationInFrames);
  const sp = (frame - s0) / (0.7 * fps);
  let shoot: React.ReactNode = null;
  if (shootingStar && sp > 0 && sp < 1.25) {
    const ang = (24 * Math.PI) / 180;
    const sx = w * 0.12 + w * 0.5 * hash01(seed, 91);
    const sy = h * 0.08 + h * 0.12 * hash01(seed, 92);
    const dist = Math.min(w, h) * 0.55;
    const p = ease.out(Math.min(1, sp));
    const hx = sx + Math.cos(ang) * dist * p;
    const hy = sy + Math.sin(ang) * dist * p;
    const tail = Math.min(w, h) * 0.2 * Math.sin(Math.min(1, sp) * Math.PI) + 2;
    const o = sp < 1 ? 1 : 1 - (sp - 1) / 0.25;
    shoot = (
      <g opacity={o}>
        <defs>
          <linearGradient id="sfn-shoot" x1={hx - Math.cos(ang) * tail} y1={hy - Math.sin(ang) * tail} x2={hx} y2={hy} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={starColor} stopOpacity={0} />
            <stop offset="1" stopColor={starColor} stopOpacity={1} />
          </linearGradient>
        </defs>
        <line x1={hx - Math.cos(ang) * tail} y1={hy - Math.sin(ang) * tail} x2={hx} y2={hy} stroke="url(#sfn-shoot)" strokeWidth={2.4 * u} strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={2.6 * u} fill="#fff" />
        <circle cx={hx} cy={hy} r={10 * u} fill={starColor} opacity={0.25} />
      </g>
    );
  }

  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      <Svg>
        <defs>
          <linearGradient id="sfn-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#081219" />
            <stop offset="0.6" stopColor={background.startsWith('#') ? background : '#0C1820'} />
            <stop offset="1" stopColor="#112430" />
          </linearGradient>
          <radialGradient id="sfn-halo">
            <stop offset="0" stopColor={starColor} stopOpacity={0.22} />
            <stop offset="0.5" stopColor={starColor} stopOpacity={0.06} />
            <stop offset="1" stopColor={starColor} stopOpacity={0} />
          </radialGradient>
          <mask id="sfn-crescent" maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <path d={moonD} fill="#fff" />
            <circle cx={mx + off} cy={my - off * 0.625} r={R} fill="#000" />
          </mask>
          <filter id="sfn-speck" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={1.1} numOctaves={2} seed={seed} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.36  9 0 0 0 -5.1" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id="sfn-print" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={1.2} numOctaves={1} seed={seed + 4} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.99  0 0 0 0 0.95  0 0 0 0 0.86  12 0 0 0 -7.6" />
          </filter>
          <BlurFilter id="sfn-b" std={1.2 * u} />
        </defs>
        {scene && <rect width={w} height={h} fill="url(#sfn-sky)" />}
        <StarField count={Math.round(starCount * areaK(w, h))} seed={seed} w={w} h={h} u={u} t={t} color={starColor} area={[0, 0, 1, grass && scene ? 0.85 : 1]} fade={starFade} glints={0.05} />
        {ripple && (() => {
          const nS = Math.round(starCount * areaK(w, h));
          const area = [0, 0, 1, grass && scene ? 0.85 : 1];
          const rx0 = ripple.x * w;
          const ry0 = ripple.y * h;
          const els: React.ReactNode[] = [];
          for (let i = 0; i < nS; i++) {
            const x = (area[0] + (area[2] - area[0]) * hash01(seed, i, 1)) * w;
            const y = (area[1] + (area[3] - area[1]) * Math.pow(hash01(seed, i, 2), 1.25)) * h;
            const r = (1 + 1.5 * Math.pow(hash01(seed, i, 3), 2.2)) * u;
            const a = t - ripple.at / fps - Math.hypot(x - rx0, y - ry0) / (rippleSpeed * u);
            if (a <= 0) continue;
            const boost = 1.3 * Math.exp(-5 * a) * Math.min(1, 25 * a);
            if (boost < 0.03) continue;
            els.push(
              <g key={i} opacity={Math.min(1, boost)}>
                <circle cx={x} cy={y} r={r * (1 + 1.4 * boost)} fill="#fff" />
                <circle cx={x} cy={y} r={r * (3 + 5 * boost)} fill={starColor} opacity={0.18} />
              </g>,
            );
          }
          return <g>{els}</g>;
        })()}
        {shoot}
        {moon && (
          <g opacity={mIn} transform={`translate(${mx} ${my}) scale(${0.85 + 0.15 * mIn}) translate(${-mx} ${-my})`}>
            <circle cx={mx} cy={my} r={R * 3.2} fill="url(#sfn-halo)" />
            <g mask="url(#sfn-crescent)">
              <path d={moonD} fill={starColor} />
              <path d={moonD} fill="#000" filter="url(#sfn-speck)" opacity={0.55} />
            </g>
          </g>
        )}
        {scene && grass && <Grass t={t} seed={seed} />}
        {scene && grain && <rect width={w} height={h} filter="url(#sfn-print)" opacity={0.06} />}
      </Svg>
    </AbsoluteFill>
  );
};

export const starfieldNight = defineMotion<Props>({
  id: 'starfield-night',
  title: 'Starfield night',
  category: 'environment',
  description: 'Dark teal night sky with twinkling cream stars, a grainy crescent moon that fades in, swaying teal grass and a shooting star. Overlay-capable.',
  source: ['video15 0.0-0.35, 25.55-26.1'],
  useFor: 'Calm night / sleep / dream / wish beats, end cards and quiet intros; transparent overlay for stars over any sky.',
  durationInFrames: 180,
  defaultProps: {
    background: '#0C1820',
    backdrop: true,
    starCount: 90,
    starColor: '#FDF3DB',
    moon: true,
    moonPos: [0.7, 0.22],
    moonSize: 46,
    moonPhase: 0.42,
    shootingStar: true,
    shootingAt: 0.45,
    grass: true,
    grain: true,
    seed: 1,
    ripple: null,
    rippleSpeed: 1100,
  },
  propDocs: {
    background: 'CSS background; "transparent" = overlay (stars, moon, shooting star only)',
    backdrop: 'paint the teal sky gradient, grass and print grain',
    starCount: 'stars per 1080p frame (source ≈ 80)',
    starColor: 'star / moon colour',
    moon: 'show the crescent moon',
    moonPos: '[x, y] moon centre as fractions of the frame',
    moonSize: 'moon radius in px at 1080p',
    moonPhase: 'crescent thickness: inner-circle offset as a fraction of the radius (0.42 = source)',
    shootingStar: 'one shooting star streak',
    shootingAt: 'when the shooting star starts, as a fraction of the duration',
    grass: 'swaying teal grass silhouette along the bottom',
    grain: 'static print speckle over the frame',
    seed: 'random seed',
    ripple: '{x, y, at}: a wave of brightened twinkles spreads from that point (0..1 fractions) starting at that frame - a "star arriving home" / payoff accent; null = off',
    rippleSpeed: 'ripple speed in px/s at 1080p (1100)',
  },
  component: StarfieldNight,
  tags: ['sky', 'night', 'stars', 'moon', 'calm', 'overlay', 'ambience', 'twinkle-ripple', 'payoff', 'wave'],
});
