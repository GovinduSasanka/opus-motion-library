// Adapted from lemo-opuscar/styles/silkscreen-poster (STYLE.md "Palette re-ink", demo/engine/silk.js wipeRegion) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {buildPoster, eo3, fx, lerp, mixHex, POSTER_H, POSTER_W, PosterSheet, raggedPull, resolvePalette, seg, Squeegee, useUid} from '../../core/r2-lb2b-kit';

/**
 * The same finished screen-print poster is pulled again in a new palette: a wide, slightly tilted squeegee crosses
 * the sheet in ~⅓ s and behind it every ink has changed (noon -> golden -> dusk), geometry identical on both sides.
 */
type Props = {
  palettes: string[];
  at: number[];
  frames: number;
  angle: number;
  tail: number;
  header: string;
  name: string;
  labels: string[];
  stats: {label: string; value: string}[];
  background: string;
  paper: string;
  blade: boolean;
  seed: number;
};

const PaletteReink: React.FC<Props> = ({palettes, at, frames, angle, tail, header, name, labels, stats, background, paper, blade, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const uid = useUid('reink');
  const geo = React.useMemo(() => buildPoster(seed), [seed]);
  const pals = palettes.map((p) => resolvePalette(p));
  const fit = Math.min((h * 0.9) / POSTER_H, (w * 0.9) / POSTER_W);
  const enter = eo3(seg(frame, 0, 16));
  const push = 1 + 0.035 * seg(frame, 0, 150);
  const s = fit * lerp(0.9, 1, enter) * push;
  const infoFor = (i: number) => ({header, name, number: labels[i] ?? labels[labels.length - 1] ?? '', stats});
  const box = {x: 0, y: 0, w: POSTER_W, h: POSTER_H};
  const sheets: React.ReactNode[] = [];
  let bladeEl: React.ReactNode = null;
  pals.forEach((pal, i) => {
    if (i === 0) {
      sheets.push(<PosterSheet key={i} pal={pal} geo={geo} paper={paper} info={infoFor(i)} />);
      return;
    }
    const t0 = at[i - 1] ?? 60 * i;
    const p = seg(frame, t0, t0 + frames);
    if (p <= 0) return;
    if (p >= 1) {
      sheets.push(<PosterSheet key={i} pal={pal} geo={geo} paper={paper} info={infoFor(i)} />);
      return;
    }
    const rp = raggedPull(box, p, angle, tail, 5, seed + i);
    sheets.push(
      <g key={i}>
        <clipPath id={`${uid}c${i}`}>
          <polygon points={rp.poly} />
        </clipPath>
        <g clipPath={`url(#${uid}c${i})`}>
          <PosterSheet pal={pal} geo={geo} paper={paper} info={infoFor(i)} />
        </g>
      </g>,
    );
    if (blade) {
      const f = rp.frontPt(0);
      bladeEl = <Squeegee x={f[0]} y={f[1]} len={POSTER_W * 1.05} angle={angle} ink={pal.sun} frame={frame} />;
    }
  });
  const shadowK = 0.35 * enter;
  return (
    <AbsoluteFill style={{background}}>
      <PaperTexture opacity={0.18} seed={5} />
      <Svg>
        <defs>
          <filter id={`${uid}sh`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={18} />
          </filter>
        </defs>
        <g transform={`translate(${fx(cx)},${fx(cy + 6 * u * (1 - enter))}) scale(${fx(s)}) translate(${-POSTER_W / 2},${-POSTER_H / 2})`}>
          <rect x={10} y={22} width={POSTER_W} height={POSTER_H} fill={mixHex(background, '#000000', 0.6)} opacity={shadowK} filter={`url(#${uid}sh)`} />
          {sheets}
          {bladeEl}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const paletteReink = defineMotion<Props>({
  id: 'palette-reink',
  title: 'Palette re-ink (squeegee recolour)',
  category: 'fx',
  description:
    'A finished screen-print poster of a lake under mountains is pulled again: a wide tilted squeegee crosses the sheet in about a third of a second and behind it every ink has changed (noon, golden hour, dusk), geometry identical; the big number swaps with the palette.',
  source: ['lemo-opuscar styles/silkscreen-poster STYLE.md §5/§8 + DEMO.md "7 h" swap (MIT, LemoLab)'],
  useFor: 'Time passing (day/night hours), seasons, product colourways, A/B variants — any "same thing, new palette" beat.',
  durationInFrames: 150,
  defaultProps: {
    palettes: ['noon', 'golden', 'dusk'],
    at: [44, 100],
    frames: 11,
    angle: -12,
    tail: 30,
    header: 'Hours at the lake',
    name: 'Northwind Lake',
    labels: ['7 H', '13 H', '19 H'],
    stats: [
      {label: 'Light', value: 'Soft'},
      {label: 'Wind', value: '4 kt'},
      {label: 'Water', value: '14 C'},
    ],
    background: '#e9e3d6',
    paper: '#f4efe4',
    blade: true,
    seed: 3,
  },
  propDocs: {
    palettes: 'palette names (dawn, noon, golden, dusk, harbour, winter) or inline objects; one per re-ink + the first',
    at: 'frame each re-ink starts (one per palette after the first)',
    frames: 'frames the blade takes to cross the sheet',
    angle: 'blade tilt in degrees',
    tail: 'depth of the ragged ink front in poster units',
    header: 'tracked line at the top of the poster',
    name: 'big name in the info band',
    labels: 'big number per palette',
    stats: 'info-band stat blocks',
    background: 'page colour behind the poster',
    paper: 'poster paper colour',
    blade: 'draw the squeegee',
    seed: 'landscape seed',
  },
  component: PaletteReink,
  tags: ['palette', 'recolour', 'time of day', 'poster', 'silkscreen', 'screenprint', 'squeegee', 'wipe', 'colourway', 'seasons', 'reveal'],
});
