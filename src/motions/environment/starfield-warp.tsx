import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LinGrad, TAU, hash01, isTransparent, mixHex, rgba, wrap} from '../../core/environment-kit';
import {NATURE_DOCS, NatureText, cyc, sinc, useLoop} from '../../core/nature-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Hyperspace starfield: stars spawn at the vanishing point and accelerate outward as growing streaks (the
 * `warp` prop stretches them from dots to long light-speed lines), over a soft nebula and a bright core glow.
 * Each star completes a whole number of flights per loop, so it loops seamlessly. With background
 * "transparent" it is a pure star overlay (screen-blend friendly).
 */
type Props = {
  background: string;
  nebula: boolean;
  colors: string[];
  warp: number;
  count: number;
  swirl: number;
  centerX: number;
  centerY: number;
  coreGlow: number;
  pulse: number;
  speed: number;
  density: number;
  seed: number;
  title: string;
  subtitle: string;
  fontFamily: string;
  ink: string;
  titlePosition: string;
  titleSize: number;
};

const StarfieldWarp: React.FC<Props> = ({background, nebula, colors, warp, count, swirl, centerX, centerY, coreGlow, pulse, speed, density, seed, title, subtitle, fontFamily, ink, titlePosition, titleSize}) => {
  const {p} = useLoop();
  const {w, h, u} = useStage();
  const overlay = isTransparent(background);
  const cx = w * centerX;
  const cy = h * centerY;
  const Rmax = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.08;
  const pal = colors.length ? colors : ['#FFFFFF'];
  const n = Math.round(count * density);
  const flights = cyc(speed, 1);
  // breathing warp: stays whole-cycle
  const wp = Math.max(0, warp * (1 + 0.25 * pulse * sinc(1, p)));
  const rot = swirl * 0.35 * sinc(1, p);

  // bucket paths by colour index x brightness bucket (3) => few DOM nodes
  const buckets: string[][] = pal.map(() => ['', '', '']);
  const heads: string[][] = pal.map(() => ['', '', '']);
  for (let i = 0; i < n; i++) {
    const k = flights === 0 ? 0 : Math.max(1, Math.round(flights * (1 + Math.floor(hash01(seed, i, 1) * 2))));
    const s0 = hash01(seed, i, 2);
    const s = flights === 0 ? s0 : wrap(s0 + k * p, 1);
    const ang = hash01(seed, i, 3) * TAU;
    // radius grows non-linearly (perspective): slow near the centre, fast at the edge
    const r = Rmax * Math.pow(s, 2.3);
    const tailS = Math.max(0, s - (0.006 + 0.075 * wp) * (0.3 + s));
    const r0 = Rmax * Math.pow(tailS, 2.3);
    const a = ang + rot * (1 - s);
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    const x0 = cx + Math.cos(a) * r0;
    const y0 = cy + Math.sin(a) * r0;
    if (x1 < -50 || x1 > w + 50 || y1 < -50 || y1 > h + 50) continue;
    const b = Math.min(2, Math.floor(s * 3));
    const ci = Math.floor(hash01(seed, i, 4) * pal.length) % pal.length;
    const sz = (0.6 + 1.9 * hash01(seed, i, 5)) * u * (0.4 + 1.5 * s);
    buckets[ci][b] += `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`;
    if (sz > 2.1 * u) heads[ci][b] += `M${x1.toFixed(1)} ${y1.toFixed(1)}h0.01`;
  }

  const strokeW = (b: number) => (0.7 + b * 0.7) * u * (1 + 0.4 * Math.min(1, wp));
  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      <Svg>
        <defs>
          <radialGradient id="sfw-core" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={mixHex(pal[0], '#FFFFFF', 0.55)} stopOpacity={0.9} />
            <stop offset="0.25" stopColor={pal[0]} stopOpacity={0.35} />
            <stop offset="1" stopColor={pal[0]} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="sfw-neb1" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={pal[Math.min(1, pal.length - 1)]} stopOpacity={0.4} />
            <stop offset="1" stopColor={pal[Math.min(1, pal.length - 1)]} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="sfw-neb2" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={pal[Math.min(2, pal.length - 1)]} stopOpacity={0.32} />
            <stop offset="1" stopColor={pal[Math.min(2, pal.length - 1)]} stopOpacity={0} />
          </radialGradient>
          <LinGrad id="sfw-bg" y1={0} y2={1} stops={[[0, '#02030B'], [1, '#07091C']]} />
        </defs>
        {!overlay && background === '#02030B' ? <rect width={w} height={h} fill="url(#sfw-bg)" /> : null}
        {nebula ? (
          <g style={{mixBlendMode: 'screen'}}>
            <ellipse cx={w * 0.28} cy={h * 0.32} rx={w * 0.5} ry={h * 0.4} fill="url(#sfw-neb1)" transform={`rotate(${-20 + 6 * sinc(1, p)} ${w * 0.28} ${h * 0.32})`} />
            <ellipse cx={w * 0.76} cy={h * 0.7} rx={w * 0.55} ry={h * 0.42} fill="url(#sfw-neb2)" transform={`rotate(${25 - 6 * sinc(1, p)} ${w * 0.76} ${h * 0.7})`} />
          </g>
        ) : null}
        <g style={{mixBlendMode: overlay ? 'normal' : 'screen'}} fill="none" strokeLinecap="round">
          {pal.map((c, ci) =>
            [0, 1, 2].map((b) => (
              <g key={`${ci}-${b}`}>
                {buckets[ci][b] ? <path d={buckets[ci][b]} stroke={mixHex(c, '#FFFFFF', 0.35 + 0.15 * b)} strokeWidth={strokeW(b)} opacity={0.28 + 0.36 * b} /> : null}
                {heads[ci][b] ? <path d={heads[ci][b]} stroke="#FFFFFF" strokeWidth={strokeW(b) * 1.7} opacity={0.35 + 0.3 * b} /> : null}
              </g>
            )),
          )}
        </g>
        {coreGlow > 0 ? <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.34 * coreGlow} fill="url(#sfw-core)" opacity={(0.5 + 0.2 * pulse * sinc(1, p, 0.25)) * Math.min(1, 0.4 + wp)} style={{mixBlendMode: 'screen'}} /> : null}
      </Svg>
      <NatureText title={title} subtitle={subtitle} fontFamily={fontFamily} ink={ink || '#F2F6FF'} position={titlePosition} size={titleSize} shadow={rgba('#000010', 0.6)} />
    </AbsoluteFill>
  );
};

export const starfieldWarp = defineMotion<Props>({
  id: 'starfield-warp',
  title: 'Starfield warp',
  category: 'environment',
  description:
    'Hyperspace flight: stars burst from a vanishing point and accelerate outward as growing light streaks over a soft nebula and bright core glow; the warp amount stretches dots into light-speed lines, with optional gentle swirl; loops seamlessly and can be a transparent star overlay.',
  source: ['original — round 3 nature backdrops'],
  useFor:
    'Space / sci-fi / tech intros and transitions, "launching" or "speed" moments, AI and startup hero backgrounds, game loading screens, countdowns; use background "transparent" to layer the stars over footage or a UI.',
  durationInFrames: 240,
  defaultProps: {
    background: '#02030B',
    nebula: true,
    colors: ['#9FC4FF', '#B58CFF', '#5ED3C7'],
    warp: 1,
    count: 520,
    swirl: 0,
    centerX: 0.5,
    centerY: 0.5,
    coreGlow: 1,
    pulse: 1,
    speed: 1,
    density: 1,
    seed: 8,
    title: '',
    subtitle: '',
    fontFamily: 'grotesk',
    ink: '',
    titlePosition: 'center',
    titleSize: 1,
  },
  propDocs: {
    background: 'CSS background; "transparent" = star overlay only (no sky, no nebula)',
    nebula: 'soft coloured nebula clouds behind the stars (not drawn on a transparent background)',
    colors: 'star / nebula / glow colours (hex list); first is the core glow, 2nd and 3rd tint the nebula',
    warp: 'streak length: 0 = round dots, 1 = default, 2-3 = long light-speed lines',
    count: 'stars at default density',
    swirl: 'gentle rotation of the flight direction (0 = straight out, try 1-3)',
    centerX: 'vanishing point x, 0 (left) – 1 (right)',
    centerY: 'vanishing point y, 0 (top) – 1 (bottom)',
    coreGlow: 'glow at the vanishing point (0 = none)',
    pulse: 'how much the warp and core glow breathe over the loop (0 = steady)',
    speed: NATURE_DOCS.speed,
    density: NATURE_DOCS.density,
    seed: NATURE_DOCS.seed,
    title: NATURE_DOCS.title,
    subtitle: NATURE_DOCS.subtitle,
    fontFamily: NATURE_DOCS.fontFamily,
    ink: NATURE_DOCS.ink,
    titlePosition: NATURE_DOCS.titlePosition,
    titleSize: NATURE_DOCS.titleSize,
  },
  component: StarfieldWarp,
  tags: ['stars', 'space', 'hyperspace', 'warp', 'speed', 'sci-fi', 'galaxy', 'nebula', 'overlay', 'loop', 'backdrop', 'intro', 'transition', 'tech', 'launch', 'particles'],
});
