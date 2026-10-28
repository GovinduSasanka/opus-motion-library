import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LinGrad, hash01, mixHex, rgba, wrap} from '../../core/environment-kit';
import {LoopStars, NATURE_DOCS, NatureText, cyc, makePalette, sinc, useLoop} from '../../core/nature-kit';
import {n2} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Desert dunes in a heat haze: a huge low sun, 3-6 sand-dune ridges with a lit crest edge, shimmering
 * horizon (the far ridge edges wobble, translucent haze bands undulate) and wind-blown sand streaks that
 * stream along the crests. Whole-cycle motion, so it loops seamlessly.
 */
type Props = {
  timeOfDay: string;
  skyTop: string;
  skyBottom: string;
  accent: string;
  sandColor: string;
  dunes: number;
  heat: number;
  wind: number;
  sunSize: number;
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

const DesertDunesHeat: React.FC<Props> = ({timeOfDay, skyTop, skyBottom, accent, sandColor, dunes, heat, wind, sunSize, speed, density, seed, title, subtitle, fontFamily, ink, titlePosition, titleSize}) => {
  const {p} = useLoop();
  const {w, h, u, portrait} = useStage();
  const base = makePalette(timeOfDay, {skyTop, skyBottom, accent, ink});
  // desert skies are warmer than the generic presets unless overridden
  const pal = timeOfDay === 'day' && !skyTop && !skyBottom ? {...base, bottom: '#FFE6B8', mid: '#9ACBE8'} : base;
  const D = Math.max(2, Math.min(7, Math.round(dunes)));
  const hy = h * (portrait ? 0.46 : 0.5);
  const sand = sandColor || (pal.night ? '#6B5A78' : '#E0A860');
  const farSand = mixHex(pal.bottom, sand, pal.night ? 0.35 : 0.3);
  const nearSand = mixHex(sand, pal.night ? '#0A0716' : '#4A1F14', pal.night ? 0.8 : 0.72);
  const sunR = sunSize * 150 * u;
  const sx = w * 0.5;
  const sy = hy - sunR * 0.55;
  const step = Math.max(8, 12 * u);
  const hc = cyc(speed, 3);

  const dn: React.ReactNode[] = [];
  for (let l = 0; l < D; l++) {
    const t = D === 1 ? 0 : l / (D - 1);
    const baseY = hy + (h - hy) * (0.05 + 0.82 * Math.pow(t, 1.35));
    const amp = (30 + 150 * t) * u * (portrait ? 1.2 : 1);
    const wl = (portrait ? 620 : 1000) * (1.1 - 0.55 * t) * u;
    const shimmer = Math.max(0, 1 - t * 1.6) * heat * 3.2 * u;
    let d = '';
    for (let x = -step; x <= w + step; x += step) {
      const a = n2(`dun${seed}${l}`, x / wl, l * 3.1);
      const b = n2(`dub${seed}${l}`, x / (wl * 0.45), l * 1.7);
      // asymmetric dune profile: slow windward slope, sharp crest, steep lee face
      const q = a * 0.8 + b * 0.25;
      const prof = Math.pow(Math.abs(q), 0.8) * Math.sign(q);
      const y = baseY - prof * amp + shimmer * sinc(hc + (l % 2), p, x / (180 * u) + hash01(seed, l, 1));
      d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    const color = mixHex(farSand, nearSand, Math.pow(t, 0.85));
    const gid = `ddh-g-${l}`;
    dn.push(
      <g key={l}>
        <defs>
          <LinGrad id={gid} y1={0} y2={1} stops={[[0, mixHex(color, pal.sun, pal.night ? 0.08 : 0.28)], [0.3, color], [1, mixHex(color, nearSand, 0.25)]]} />
        </defs>
        <path d={`${d}L${w + step} ${h + 10}L${-step} ${h + 10}Z`} fill={`url(#${gid})`} />
        <path d={d} fill="none" stroke={mixHex(color, pal.sun, 0.55)} strokeWidth={(1.5 + 1.5 * t) * u} opacity={0.5} />
      </g>,
    );
  }

  // wind streaks drifting along the dune faces
  const streaks: React.ReactNode[] = [];
  const n = Math.round(70 * density * (portrait ? 0.7 : 1));
  const wc = cyc(speed, 1);
  const dirW = wind >= 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const t = Math.pow(hash01(seed, i, 21), 0.8);
    const y0 = hy + (h - hy) * (0.06 + 0.86 * t);
    const len = (30 + 140 * t) * u * (0.5 + hash01(seed, i, 22));
    const span = w + 2 * len;
    // each streak travels a whole number of frame-spans per loop, so the clip loops
    const k = wind === 0 ? 0 : Math.max(1, Math.round(Math.abs(wind) * (1 + hash01(seed, i, 24))));
    const xx = wrap(hash01(seed, i, 23) * span + dirW * k * wc * span * p, span) - len;
    const y = y0 + 4 * u * sinc(2, p, hash01(seed, i, 25)) + (xx - w / 2) * 0.012;
    streaks.push(<path key={i} d={`M${xx.toFixed(1)} ${y.toFixed(1)}q${(len * 0.5).toFixed(1)} ${(-3 * u).toFixed(1)} ${len.toFixed(1)} ${(-1 * u).toFixed(1)}`} stroke={pal.night ? '#B9A8D8' : '#FFE9C0'} strokeWidth={(1 + 2 * t) * u} strokeLinecap="round" opacity={0.1 + 0.28 * t} fill="none" />);
  }

  // haze bands over the horizon
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const y = hy + (i - 1) * 16 * u + 10 * u * sinc(hc, p, i * 0.21);
    bands.push(<rect key={i} x={-20} y={y} width={w + 40} height={(6 + 6 * (i % 2)) * u * heat} fill={pal.bottom} opacity={0.16 * heat} />);
  }

  return (
    <AbsoluteFill style={{background: pal.top}}>
      <Svg>
        <defs>
          <LinGrad id="ddh-sky" y1={0} y2={1} stops={[[0, pal.top], [0.6, pal.mid], [1, pal.bottom]]} />
          <radialGradient id="ddh-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={pal.sun} stopOpacity={0.9} />
            <stop offset="0.35" stopColor={pal.sun} stopOpacity={0.35} />
            <stop offset="1" stopColor={pal.sun} stopOpacity={0} />
          </radialGradient>
          <LinGrad id="ddh-haze" y1={0} y2={1} stops={[[0, pal.bottom, 0], [1, pal.bottom, 0.9]]} />
        </defs>
        <rect width={w} height={hy + 4} fill="url(#ddh-sky)" />
        {pal.night ? <LoopStars count={Math.round(150 * density)} seed={seed + 5} p={p} area={[0, 0, 1, 0.48]} /> : null}
        <circle cx={sx} cy={sy} r={sunR * (pal.night ? 2.6 : 4.2)} fill="url(#ddh-sun)" opacity={pal.night ? 0.5 : 1} />
        <circle cx={sx} cy={sy} r={sunR * (1 + 0.012 * sinc(hc, p))} fill={pal.sun} />
        <rect y={hy - 110 * u} width={w} height={116 * u} fill="url(#ddh-haze)" />
        <rect y={hy} width={w} height={h - hy} fill={farSand} />
        {dn}
        <g>{streaks}</g>
        <g>{bands}</g>
      </Svg>
      <NatureText title={title} subtitle={subtitle} fontFamily={fontFamily} ink={pal.ink} position={titlePosition} size={titleSize} shadow={rgba('#2A0E00', 0.4)} />
    </AbsoluteFill>
  );
};

export const desertDunesHeat = defineMotion<Props>({
  id: 'desert-dunes-heat',
  title: 'Desert dunes heat haze',
  category: 'environment',
  description:
    'Rolling sand-dune ridges under a huge low sun: 3-7 layered dunes with lit crest edges, a shimmering heat-haze horizon and wind-blown sand streaks racing along the dunes; loops seamlessly, dawn / day / dusk / night palettes.',
  source: ['original — round 3 nature backdrops'],
  useFor:
    'Warm looping landscape backdrop for travel, adventure, Middle-East / Sahara themes, western titles, survival or thirst / heat messages, product reveals on sand; add a title or place your own HTML on top.',
  durationInFrames: 240,
  defaultProps: {
    timeOfDay: 'dusk',
    skyTop: '',
    skyBottom: '',
    accent: '',
    sandColor: '',
    dunes: 5,
    heat: 1,
    wind: 1,
    sunSize: 1,
    speed: 1,
    density: 1,
    seed: 4,
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
    sandColor: 'mid-distance sand colour (hex); near and far dunes shade from it; empty = from timeOfDay',
    dunes: 'number of dune layers (2-7)',
    heat: 'heat shimmer strength (0 = none, 1 = default, 2 = strong)',
    wind: 'blown-sand intensity; negative blows right-to-left, 0 = no streaks motion',
    sunSize: 'sun size multiplier',
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
  component: DesertDunesHeat,
  tags: ['desert', 'dunes', 'sand', 'heat', 'haze', 'sun', 'sahara', 'travel', 'adventure', 'loop', 'backdrop', 'nature', 'landscape', 'warm', 'wind'],
});
