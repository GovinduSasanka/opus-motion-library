import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LinGrad, hash01, mixHex, rgba, wrap} from '../../core/environment-kit';
import {LoopStars, NATURE_DOCS, NatureText, cyc, makePalette, sinc, useLoop} from '../../core/nature-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Misty pine forest in depth: 3-7 layers of conifer silhouettes that sway against each other in parallax,
 * drifting fog banks between them, breathing god rays from a low sun and floating pollen / dust motes.
 * All motion repeats a whole number of times per loop, so it loops seamlessly.
 */
type Props = {
  timeOfDay: string;
  skyTop: string;
  skyBottom: string;
  accent: string;
  treeColor: string;
  layers: number;
  treeHeight: number;
  fog: number;
  rays: number;
  sunX: number;
  sway: number;
  motes: boolean;
  trunks: boolean;
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

const ForestParallaxMist: React.FC<Props> = ({timeOfDay, skyTop, skyBottom, accent, treeColor, layers, treeHeight, fog, rays, sunX, sway, motes, trunks, speed, density, seed, title, subtitle, fontFamily, ink, titlePosition, titleSize}) => {
  const {p} = useLoop();
  const {w, h, u, portrait} = useStage();
  const pal = makePalette(timeOfDay, {skyTop, skyBottom, accent, ink});
  const L = Math.max(3, Math.min(7, Math.round(layers)));
  const tree = treeColor || '#1F4F3D';
  const sx = w * sunX;
  const sy = h * (portrait ? 0.22 : 0.26);
  const c1 = cyc(speed, 1);
  const hazeCol = mixHex(pal.mid, pal.bottom, 0.3);

  const treeRow = (l: number, t: number) => {
    // t: 0 far .. 1 near
    const baseY = h * (portrait ? 0.56 : 0.6) + t * h * 0.3 + (l % 2) * 8 * u;
    const th0 = (portrait ? 330 : 280) * (0.55 + 0.75 * t) * u * treeHeight;
    const wBase = (portrait ? 90 : 110) * (0.5 + 1.2 * t) * u;
    // ground strip under the row, then one stack of triangles per tree
    let d = `M${-120 * u} ${baseY + th0 * 0.05}L${w + 120 * u} ${baseY + th0 * 0.05}L${w + 120 * u} ${h + 20}L${-120 * u} ${h + 20}Z`;
    let x = -120 * u;
    let i = 0;
    while (x < w + 120 * u) {
      const tw = wBase * (0.75 + 0.6 * hash01(seed, l, i, 1));
      const th = th0 * (0.6 + 0.6 * hash01(seed, l, i, 2));
      const cx = x + tw / 2;
      const tiers = 4 + Math.floor(t * 2);
      for (let k = 0; k < tiers; k++) {
        const topY = baseY - th + k * th * (0.8 / tiers);
        const botY = topY + th * (1.5 / tiers);
        const half = tw * 0.5 * (0.3 + 0.7 * ((k + 1) / tiers));
        d += `M${cx.toFixed(1)} ${topY.toFixed(1)}L${(cx + half).toFixed(1)} ${botY.toFixed(1)}L${(cx - half).toFixed(1)} ${botY.toFixed(1)}Z`;
      }
      x += tw * (0.5 + 0.35 * hash01(seed, l, i, 3));
      i++;
    }
    return {d, baseY};
  };

  const parts: React.ReactNode[] = [];
  for (let l = 0; l < L; l++) {
    const t = l / (L - 1);
    const color = mixHex(mixHex(hazeCol, tree, 0.3), mixHex(tree, '#000000', 0.5), Math.pow(t, 0.8));
    const {d, baseY} = treeRow(l, t);
    const dx = sway * (6 + 70 * Math.pow(t, 1.4)) * u * sinc(1, p, 0.0) * (c1 === 0 ? 0 : 1);
    parts.push(
      <g key={`t${l}`} transform={`translate(${dx.toFixed(2)} 0)`}>
        <path d={d} fill={color} />
      </g>,
    );
    // fog bank in front of this layer
    if (fog > 0 && l < L - 1) {
      const S = w / 4;
      const blobs: React.ReactNode[] = [];
      for (let k = -2; k < 8; k++) {
        const x = k * S + 2 * S * c1 * p * (l % 2 ? -1 : 1);
        const big = k % 2 === 0;
        blobs.push(<ellipse key={k} cx={x} cy={baseY - 20 * u + (big ? -10 : 14) * u} rx={S * (big ? 1.1 : 0.85)} ry={(big ? 70 : 52) * u} fill={hazeCol} opacity={(0.3 - 0.12 * t) * fog} />);
      }
      parts.push(
        <g key={`f${l}`} style={{filter: `blur(${22 * u}px)`}}>
          {blobs}
        </g>,
      );
    }
  }

  // god rays from the sun
  const rayEls: React.ReactNode[] = [];
  const nr = Math.round(6 * rays);
  for (let i = 0; i < nr; i++) {
    const ang = (-0.55 + 1.1 * (i / Math.max(1, nr - 1))) + 0.08 * (hash01(seed, i, 71) - 0.5);
    const len = h * 1.4;
    const wd = (50 + 110 * hash01(seed, i, 72)) * u;
    const x1 = sx + Math.sin(ang) * len;
    const y1 = sy + Math.cos(ang) * len;
    const nx = Math.cos(ang);
    const ny = -Math.sin(ang);
    const o = Math.max(0, 0.5 + 0.5 * sinc(1 + (i % 2), p, hash01(seed, i, 73)));
    rayEls.push(<path key={i} d={`M${sx - nx * 8 * u} ${sy - ny * 8 * u}L${sx + nx * 8 * u} ${sy + ny * 8 * u}L${x1 + nx * wd} ${y1 + ny * wd}L${x1 - nx * wd} ${y1 - ny * wd}Z`} fill="url(#fpm-ray)" opacity={(0.25 + 0.75 * o) * 0.55 * Math.min(1, rays)} />);
  }

  // motes
  const moteEls: React.ReactNode[] = [];
  if (motes) {
    const n = Math.round(60 * density);
    for (let i = 0; i < n; i++) {
      const k = c1 === 0 ? 0 : Math.max(1, Math.round(speed * (1 + Math.floor(hash01(seed, i, 81) * 2))));
      const span = h + 40 * u;
      const y = h + 20 * u - wrap(hash01(seed, i, 82) * span + span * k * p * 0.5 * 2 / 2, span);
      const x = hash01(seed, i, 83) * w + 26 * u * sinc(1 + (i % 2), p, hash01(seed, i, 84));
      const nearRay = 0.4 + 0.6 * Math.max(0, 1 - Math.abs(x - sx) / (w * 0.5));
      moteEls.push(<circle key={i} cx={x} cy={y} r={(1.2 + 2.6 * hash01(seed, i, 85)) * u} fill={pal.sun} opacity={(0.25 + 0.5 * hash01(seed, i, 86)) * nearRay} />);
    }
  }

  // foreground trunks
  const trunkEls: React.ReactNode[] = [];
  if (trunks) {
    const spots = [0.04, 0.13, 0.9, 0.97];
    spots.forEach((fx, i) => {
      const tw = (portrait ? 46 : 60) * u * (0.8 + 0.6 * hash01(seed, i, 91));
      const x = fx * w + sway * 30 * u * sinc(1, p, 0.0) * 0.4;
      trunkEls.push(<path key={i} d={`M${x - tw * 0.5} ${h + 10}L${x - tw * 0.38} -10L${x + tw * 0.38} -10L${x + tw * 0.5} ${h + 10}Z`} fill={mixHex(tree, '#000000', 0.78)} />);
    });
  }

  return (
    <AbsoluteFill style={{background: pal.top}}>
      <Svg>
        <defs>
          <LinGrad id="fpm-sky" y1={0} y2={1} stops={[[0, pal.top], [0.5, pal.mid], [1, pal.bottom]]} />
          <radialGradient id="fpm-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={pal.sun} stopOpacity={0.95} />
            <stop offset="0.2" stopColor={pal.sun} stopOpacity={0.5} />
            <stop offset="1" stopColor={pal.sun} stopOpacity={0} />
          </radialGradient>
          <LinGrad id="fpm-ray" y1={0} y2={1} stops={[[0, pal.sun, 0.9], [1, pal.sun, 0]]} />
          <LinGrad id="fpm-ground" y1={0} y2={1} stops={[[0, hazeCol, 0], [1, mixHex(tree, '#000000', 0.6), 0.5]]} />
        </defs>
        <rect width={w} height={h} fill="url(#fpm-sky)" />
        {pal.night ? <LoopStars count={Math.round(120 * density)} seed={seed + 4} p={p} area={[0, 0, 1, 0.4]} /> : null}
        <circle cx={sx} cy={sy} r={Math.max(w, h) * 0.34} fill="url(#fpm-sun)" opacity={0.85 + 0.1 * sinc(1, p)} />
        <circle cx={sx} cy={sy} r={(portrait ? 54 : 62) * u} fill={pal.sun} />
        <g style={{mixBlendMode: 'screen'}}>{rayEls}</g>
        {parts}
        <g style={{mixBlendMode: 'screen'}}>{moteEls}</g>
        <rect width={w} height={h} fill="url(#fpm-ground)" />
        {trunkEls}
      </Svg>
      <NatureText title={title} subtitle={subtitle} fontFamily={fontFamily} ink={pal.ink} position={titlePosition} size={titleSize} shadow={rgba('#001008', 0.45)} />
    </AbsoluteFill>
  );
};

export const forestParallaxMist = defineMotion<Props>({
  id: 'forest-parallax-mist',
  title: 'Forest parallax mist',
  category: 'environment',
  description:
    'A misty pine forest in depth: 3-7 layers of conifer silhouettes swaying in parallax, drifting fog banks between them, breathing god rays from a low sun and floating pollen motes; loops seamlessly in dawn / day / dusk / night palettes.',
  source: ['original — round 3 nature backdrops'],
  useFor:
    'Atmospheric looping hero or title backdrop for outdoors, camping, wellness / meditation, storytelling, fantasy and horror-lite scenes, eco brands, podcasts and lyric videos; tint with timeOfDay or brand colours and add a title.',
  durationInFrames: 240,
  defaultProps: {
    timeOfDay: 'dawn',
    skyTop: '',
    skyBottom: '',
    accent: '',
    treeColor: '',
    layers: 5,
    treeHeight: 1,
    fog: 1,
    rays: 1,
    sunX: 0.68,
    sway: 1,
    motes: true,
    trunks: true,
    speed: 1,
    density: 1,
    seed: 5,
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
    treeColor: 'nearest tree colour (hex); farther layers fade toward the sky haze; empty = deep green',
    layers: 'number of tree layers (3-7)',
    treeHeight: 'tree height multiplier',
    fog: 'fog bank strength (0 = none)',
    rays: 'god-ray amount (0 = none)',
    sunX: 'sun horizontal position, 0 (left) – 1 (right)',
    sway: 'parallax sway amount (0 = still)',
    motes: 'floating pollen / dust motes',
    trunks: 'dark foreground trunks at the frame edges',
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
  component: ForestParallaxMist,
  tags: ['forest', 'pines', 'trees', 'mist', 'fog', 'god rays', 'parallax', 'camping', 'woods', 'dawn', 'loop', 'backdrop', 'nature', 'landscape', 'calm', 'fantasy', 'atmosphere'],
});
