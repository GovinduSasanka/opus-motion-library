import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LinGrad, hash01, mixHex, rgba, ridgePath, wrap} from '../../core/environment-kit';
import {LoopStars, NATURE_DOCS, NatureText, cyc, makePalette, sinc, useLoop} from '../../core/nature-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Snow-capped mountain ranges at first light: three ridged ranges with soft snow lines, an alpine glow that
 * breathes on the sun-facing slopes, drifting mist, slow clouds, gently falling snow and pine silhouettes.
 * All motion is whole-cycle, so the clip loops seamlessly.
 */
type Props = {
  timeOfDay: string;
  skyTop: string;
  skyBottom: string;
  accent: string;
  rockColor: string;
  snowColor: string;
  ranges: number;
  peakHeight: number;
  sunX: number;
  snowfall: number;
  mist: number;
  pines: boolean;
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

const SnowMountainDawn: React.FC<Props> = ({timeOfDay, skyTop, skyBottom, accent, rockColor, snowColor, ranges, peakHeight, sunX, snowfall, mist, pines, speed, density, seed, title, subtitle, fontFamily, ink, titlePosition, titleSize}) => {
  const {p} = useLoop();
  const {w, h, u, portrait} = useStage();
  const pal = makePalette(timeOfDay, {skyTop, skyBottom, accent, ink});
  const R = Math.max(2, Math.min(5, Math.round(ranges)));
  const hy = h * (portrait ? 0.74 : 0.8);
  const sx = w * sunX;
  const rock = rockColor || mixHex(pal.top, '#000000', pal.night ? 0.2 : 0.45);
  const snow = snowColor || mixHex('#FFFFFF', pal.mid, pal.night ? 0.62 : 0.22);
  const hazeRock = mixHex(pal.bottom, pal.top, 0.5);
  const mainC = cyc(speed, 1);
  const step = Math.max(6, 9 * u);

  const mts: React.ReactNode[] = [];
  for (let l = 0; l < R; l++) {
    const t = l / (R - 1);
    const baseY = hy - (R - 1 - l) * (portrait ? 150 : 70) * u - (portrait ? 40 : 10) * u;
    const amp = (portrait ? 560 : 400) * (0.7 + 0.5 * t) * u * peakHeight * (1 - 0.18 * (R - 1 - l) / R) * (1.05 - 0.2 * (1 - t));
    const wl = (portrait ? 700 : 1100) * (1.2 - 0.45 * t) * u;
    const color = mixHex(hazeRock, rock, Math.pow(t, 0.8));
    const d = ridgePath(`snm${seed}${l}`, -step, w + step, baseY, amp, wl, h + 10, {ridged: true, octaves: 2, step});
    const yTop = baseY - amp * 0.95;
    const yLine = baseY - amp * (0.6 - 0.1 * t);
    const gs = `snm-s-${l}`;
    const gl = `snm-l-${l}`;
    const sunSide = sx < w / 2 ? 0 : 1;
    mts.push(
      <g key={l}>
        <defs>
          <LinGrad id={gs} units="userSpaceOnUse" x1={0} x2={0} y1={yTop} y2={yLine} stops={[[0, mixHex(snow, hazeRock, (1 - t) * 0.45)], [0.55, mixHex(snow, color, 0.15 + (1 - t) * 0.3), 0.9], [1, color, 0]]} />
          <LinGrad id={gl} units="userSpaceOnUse" x1={sunSide ? w : 0} x2={sunSide ? w * 0.35 : w * 0.65} y1={0} y2={0} stops={[[0, pal.sun, 0.4], [1, pal.sun, 0]]} />
        </defs>
        <path d={d} fill={color} />
        <path d={d} fill={`url(#${gs})`} />
        <path d={d} fill={`url(#${gl})`} opacity={(0.55 + 0.45 * sinc(1, p, 0.0)) * (0.35 + 0.65 * t)} style={{mixBlendMode: 'screen'}} />
      </g>,
    );
    // mist band in front of this range
    if (mist > 0 && l < R - 1) {
      const S = w / 5;
      const my = baseY + (portrait ? 60 : 30) * u;
      const blobs: React.ReactNode[] = [];
      for (let k = -2; k < 9; k++) {
        const x = k * S + 2 * S * mainC * p * (l % 2 ? -1 : 1);
        const big = k % 2 === 0;
        blobs.push(<ellipse key={k} cx={x} cy={my + (big ? -8 : 10) * u} rx={S * (big ? 1.05 : 0.8)} ry={(big ? 54 : 40) * u} fill={mixHex(pal.bottom, color, 0.2)} opacity={0.34 * mist} />);
      }
      mts.push(
        <g key={`m${l}`} style={{filter: `blur(${18 * u}px)`}}>
          {blobs}
        </g>,
      );
    }
  }

  // slow clouds
  const clouds: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const span = w + 600 * u;
    const y = h * (0.12 + 0.28 * hash01(seed, i, 43));
    const k = Math.max(1, mainC);
    const xx = wrap(hash01(seed, i, 41) * span + span * k * p, span) - 300 * u;
    const cw = (180 + 220 * hash01(seed, i, 44)) * u;
    clouds.push(<ellipse key={i} cx={xx} cy={y} rx={cw} ry={cw * 0.09} fill={mixHex(pal.mid, pal.sun, 0.45)} opacity={pal.night ? 0.1 : 0.32} />);
  }

  // snow flakes
  const flakes: React.ReactNode[] = [];
  const nf = Math.round(90 * snowfall * density);
  for (let i = 0; i < nf; i++) {
    const near = hash01(seed, i, 51);
    const r = (1.2 + 2.6 * near) * u;
    const kk = Math.max(1, Math.round(speed * (1 + Math.floor(near * 3))));
    const y = wrap(hash01(seed, i, 52) * (h + 40 * u) + (h + 40 * u) * kk * p, h + 40 * u) - 20 * u;
    const x = hash01(seed, i, 53) * w + 22 * u * sinc(2, p, hash01(seed, i, 54)) + (y - h / 2) * 0.06;
    flakes.push(<circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.35 + 0.5 * near} />);
  }

  // pines
  const trees: React.ReactNode[] = [];
  if (pines) {
    const nT = portrait ? 7 : 13;
    for (let i = 0; i < nT; i++) {
      const side = i / (nT - 1);
      const edge = Math.pow(Math.abs(side - 0.5) * 2, 1.4);
      const tx = side * w + (hash01(seed, i, 61) - 0.5) * 60 * u;
      const th = (120 + 280 * edge + 80 * hash01(seed, i, 62)) * u * (portrait ? 1.2 : 1);
      const tw = th * 0.42;
      const by = h + 10 * u;
      const sway = 2 * u * sinc(1, p, hash01(seed, i, 63));
      const tiers = 5;
      let dd = '';
      for (let k = 0; k < tiers; k++) {
        const topY = by - th + k * th * 0.17;
        const botY = topY + th * 0.36;
        const half = tw * 0.5 * (0.35 + 0.65 * ((k + 1) / tiers));
        dd += `M${tx + sway * (1 - k / tiers)} ${topY}L${tx + half} ${botY}L${tx - half} ${botY}Z`;
      }
      trees.push(<path key={i} d={dd} fill={mixHex(rock, '#000000', 0.5)} />);
    }
  }

  const glowR = (portrait ? 760 : 900) * u;
  return (
    <AbsoluteFill style={{background: pal.top}}>
      <Svg>
        <defs>
          <LinGrad id="snm-sky" y1={0} y2={1} stops={[[0, pal.top], [0.55, pal.mid], [1, pal.bottom]]} />
          <radialGradient id="snm-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={pal.sun} stopOpacity={0.95} />
            <stop offset="0.25" stopColor={pal.sun} stopOpacity={0.45} />
            <stop offset="1" stopColor={pal.sun} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#snm-sky)" />
        {pal.night || timeOfDay === 'dawn' ? <LoopStars count={Math.round(160 * density)} seed={seed + 9} p={p} area={[0, 0, 1, 0.55]} fade={pal.night ? 1 : 0.5} /> : null}
        <circle cx={sx} cy={hy - 240 * u} r={glowR} fill="url(#snm-sun)" opacity={0.75 + 0.1 * sinc(1, p)} />
        <circle cx={sx} cy={hy - 240 * u} r={(portrait ? 70 : 84) * u} fill={pal.sun} />
        {clouds}
        {mts}
        <g>{flakes}</g>
        {trees}
      </Svg>
      <NatureText title={title} subtitle={subtitle} fontFamily={fontFamily} ink={pal.ink} position={titlePosition} size={titleSize} shadow={rgba('#000010', 0.35)} />
    </AbsoluteFill>
  );
};

export const snowMountainDawn = defineMotion<Props>({
  id: 'snow-mountain-dawn',
  title: 'Snow mountain dawn',
  category: 'environment',
  description:
    'Three ridged mountain ranges with soft snow lines at first light: an alpine glow breathing on the sun-facing slopes, drifting mist between the ranges, slow clouds, falling snow and pine silhouettes; loops seamlessly in dawn / day / dusk / night palettes.',
  source: ['original — round 3 nature backdrops'],
  useFor:
    'Calm looping hero or title backdrop for outdoor / adventure / expedition, winter, wellness, finance "summit" metaphors, motivational quotes, podcasts and lyric videos; colour with timeOfDay or brand colours and add your own title.',
  durationInFrames: 240,
  defaultProps: {
    timeOfDay: 'dawn',
    skyTop: '',
    skyBottom: '',
    accent: '',
    rockColor: '',
    snowColor: '',
    ranges: 3,
    peakHeight: 1,
    sunX: 0.62,
    snowfall: 1,
    mist: 1,
    pines: true,
    speed: 1,
    density: 1,
    seed: 3,
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
    rockColor: 'nearest mountain rock colour (hex); far ranges fade toward the sky; empty = from the sky',
    snowColor: 'snow cap colour (hex); empty = from the sky',
    ranges: 'number of mountain ranges (2-5)',
    peakHeight: 'peak height multiplier',
    sunX: 'sun / glow horizontal position, 0 (left) – 1 (right)',
    snowfall: 'falling snow amount (0 = none)',
    mist: 'mist between the ranges (0 = none)',
    pines: 'pine tree silhouettes in the foreground',
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
  component: SnowMountainDawn,
  tags: ['mountain', 'snow', 'alpine', 'dawn', 'sunrise', 'winter', 'mist', 'pines', 'loop', 'backdrop', 'nature', 'landscape', 'summit', 'adventure', 'calm'],
});
