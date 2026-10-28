import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BlurFilter, LinGrad, hash01, mixHex, rgba} from '../../core/environment-kit';
import {LoopStars, NATURE_DOCS, NatureText, cyc, makePalette, sinc, useLoop} from '../../core/nature-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Stylised layered ocean: a sky with sun / moon, a hazy horizon and 3-9 flat wave layers that heave and slide
 * on sums of sines with whole-cycle phases (so the clip loops seamlessly), foam on the front crests and a
 * glittering sun path on the water. Palette comes from timeOfDay, with brand-colour overrides.
 */
type Props = {
  timeOfDay: string;
  skyTop: string;
  skyBottom: string;
  accent: string;
  waterColor: string;
  layers: number;
  waveHeight: number;
  horizon: number;
  sunX: number;
  sunSize: number;
  foam: boolean;
  glints: boolean;
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

const OceanWavesLayers: React.FC<Props> = ({timeOfDay, skyTop, skyBottom, accent, waterColor, layers, waveHeight, horizon, sunX, sunSize, foam, glints, speed, density, seed, title, subtitle, fontFamily, ink, titlePosition, titleSize}) => {
  const {p} = useLoop();
  const {w, h, u, portrait} = useStage();
  const pal = makePalette(timeOfDay, {skyTop, skyBottom, accent, ink});
  const L = Math.max(2, Math.min(9, Math.round(layers)));
  const hy = h * horizon;
  const nearWater = waterColor || mixHex(pal.top, pal.night ? '#02101C' : '#06303F', 0.55);
  const farWater = mixHex(pal.mid, nearWater, pal.night ? 0.5 : 0.3);
  const sx = w * sunX;
  const sunR = sunSize * 120 * u * (portrait ? 1.1 : 1);
  const sunY = hy - sunR * (pal.night ? 2.2 : 1.25);
  const step = Math.max(8, 14 * u);

  const waves: React.ReactNode[] = [];
  for (let l = 0; l < L; l++) {
    const t = l / (L - 1);
    const base = hy + (h - hy) * (0.02 + 0.86 * Math.pow(t, 1.25));
    const amp = (6 + 40 * Math.pow(t, 1.1)) * u * waveHeight;
    const crests = (portrait ? 1.3 : 2.2) * (2.6 - 1.9 * t) * (0.85 + 0.3 * hash01(seed, l, 1));
    const dir = l % 2 === 0 ? 1 : -1;
    const c1 = cyc(speed, 1 + (l % 2)) * dir;
    const c2 = cyc(speed, 2 + (l % 3)) * -dir;
    const ph1 = hash01(seed, l, 2);
    const ph2 = hash01(seed, l, 3);
    let top = '';
    for (let x = -step; x <= w + step; x += step) {
      const k = x / w;
      const y = base + amp * (sinc(c1, p, ph1 + k * crests) + 0.5 * sinc(c2, p, ph2 + k * crests * 2.1 + 0.2) + 0.2 * sinc(cyc(speed, 3) * dir, p, k * crests * 4.3));
      top += `${top ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    const color = mixHex(farWater, nearWater, Math.pow(t, 0.8));
    const gid = `owl-g-${l}`;
    waves.push(
      <g key={l}>
        <defs>
          <LinGrad id={gid} y1={0} y2={1} stops={[[0, mixHex(color, pal.sun, pal.night ? 0.08 : 0.12)], [1, color]]} />
        </defs>
        <path d={`${top}L${w + step} ${h + 10}L${-step} ${h + 10}Z`} fill={`url(#${gid})`} />
        {foam && t > 0.25 ? (
          <path d={top} fill="none" stroke={rgba('#FFFFFF', 0.12 + 0.3 * t)} strokeWidth={(1.5 + 3 * t) * u} strokeLinecap="round" strokeDasharray={`${(30 + 50 * t) * u} ${(20 + 30 * (1 - t)) * u}`} />
        ) : null}
      </g>,
    );
  }

  // sun path glints on the water
  const gl: React.ReactNode[] = [];
  if (glints) {
    const n = Math.round(34 * density);
    for (let i = 0; i < n; i++) {
      const f = hash01(seed, i, 7);
      const y = hy + 6 * u + Math.pow(f, 1.7) * (h - hy) * 0.7;
      const spread = (30 + 230 * f) * u;
      const x = sx + (hash01(seed, i, 8) - 0.5) * 2 * spread * 0.6 + sinc(cyc(speed, 1 + (i % 3)), p, hash01(seed, i, 9)) * 14 * u * f;
      const tw = Math.max(0, sinc(cyc(speed, 2 + (i % 3)), p, hash01(seed, i, 10)));
      const len = (14 + 70 * f) * u * (0.6 + 0.6 * hash01(seed, i, 11));
      gl.push(<rect key={i} x={x - len / 2} y={y} width={len} height={(2 + 3.5 * f) * u} rx={2 * u} fill={pal.sun} opacity={(pal.night ? 0.7 : 0.95) * (0.2 + 0.8 * tw) * (1 - f * 0.35)} />);
    }
  }

  return (
    <AbsoluteFill style={{background: pal.top}}>
      <Svg>
        <defs>
          <LinGrad id="owl-sky" y1={0} y2={1} stops={[[0, pal.top], [0.55, pal.mid], [1, pal.bottom]]} />
          <radialGradient id="owl-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={pal.sun} stopOpacity={0.95} />
            <stop offset="0.3" stopColor={pal.sun} stopOpacity={0.4} />
            <stop offset="1" stopColor={pal.sun} stopOpacity={0} />
          </radialGradient>
          <LinGrad id="owl-haze" y1={0} y2={1} stops={[[0, pal.bottom, 0], [1, pal.bottom, 0.85]]} />
          <BlurFilter id="owl-blur" std={1.2 * u} />
        </defs>
        <rect width={w} height={hy + 2} fill="url(#owl-sky)" />
        {pal.night ? <LoopStars count={Math.round(110 * density)} seed={seed + 3} p={p} area={[0, 0, 1, horizon * 0.85]} /> : null}
        <circle cx={sx} cy={sunY} r={sunR * 3.4} fill="url(#owl-sun)" opacity={pal.night ? 0.45 : 0.9} />
        <circle cx={sx} cy={sunY} r={sunR} fill={pal.sun} />
        <rect y={hy - 90 * u} width={w} height={96 * u} fill="url(#owl-haze)" />
        <rect y={hy} width={w} height={h - hy} fill={farWater} />
        {waves}
        <g filter="url(#owl-blur)" opacity={0.95}>{gl}</g>
      </Svg>
      <NatureText title={title} subtitle={subtitle} fontFamily={fontFamily} ink={pal.ink} position={titlePosition} size={titleSize} />
    </AbsoluteFill>
  );
};

export const oceanWavesLayers = defineMotion<Props>({
  id: 'ocean-waves-layers',
  title: 'Ocean waves layers',
  category: 'environment',
  description:
    'Stylised flat-vector ocean: a sun or moon over a hazy horizon, 3-9 layered waves heaving and sliding on whole-cycle sine sums with foam dashes on the front crests and a glittering sun path; loops seamlessly, palette from dawn / day / dusk / night.',
  source: ['original — round 3 nature backdrops'],
  useFor:
    'A calm looping seascape behind titles, travel / holiday / wellness / meditation scenes, podcast or lyric backdrops; set timeOfDay or your brand colours, add a title, or let it run empty under your own HTML.',
  durationInFrames: 240,
  defaultProps: {
    timeOfDay: 'dusk',
    skyTop: '',
    skyBottom: '',
    accent: '',
    waterColor: '',
    layers: 6,
    waveHeight: 1,
    horizon: 0.46,
    sunX: 0.5,
    sunSize: 1,
    foam: true,
    glints: true,
    speed: 1,
    density: 1,
    seed: 1,
    title: '',
    subtitle: '',
    fontFamily: 'serif',
    ink: '',
    titlePosition: 'top',
    titleSize: 1,
  },
  propDocs: {
    timeOfDay: NATURE_DOCS.timeOfDay,
    skyTop: NATURE_DOCS.skyTop,
    skyBottom: NATURE_DOCS.skyBottom,
    accent: NATURE_DOCS.accent,
    waterColor: 'nearest (deepest) water colour; the far water blends toward the horizon sky; empty = from the sky',
    layers: 'number of wave layers (2-9)',
    waveHeight: 'wave amplitude multiplier',
    horizon: 'horizon height as a fraction of the frame height (0.3-0.65)',
    sunX: 'sun / moon horizontal position, 0 (left) – 1 (right)',
    sunSize: 'sun / moon size multiplier',
    foam: 'dashed foam lines along the front crests',
    glints: 'glittering reflection of the sun on the water',
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
  component: OceanWavesLayers,
  tags: ['ocean', 'sea', 'waves', 'water', 'beach', 'sunset', 'seascape', 'loop', 'backdrop', 'nature', 'calm', 'travel', 'wellness', 'landscape', 'horizon'],
});
