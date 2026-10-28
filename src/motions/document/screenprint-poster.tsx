// Adapted from lemo-opuscar/styles/silkscreen-poster/demo/engine/poster.js, scenes.js, silk.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  ART,
  BAND,
  POSTER_H,
  POSTER_LAYERS,
  POSTER_W,
  PlankWall,
  PosterInfo,
  PosterInfoInk,
  PosterLayer,
  PosterPalette,
  Squeegee,
  buildPoster,
  eio3,
  fx,
  h1,
  posterInfoCount,
  raggedPull,
  resolvePalette,
  seg,
  useUid,
} from '../../core/r2-lb2-kit';

/**
 * A portrait poster (paper border, art area, dark info band) builds one ink at a time on a screen-printing rig: a
 * stepped-band sky, a concentric sun ring, a far ridge with a lit facet, mid hills, near pines (darkest), then the
 * info band pulls in and its header, name, big number, rule and stats row stamp in left to right. Each pull is one
 * beat of the bpm; the squeegee blade drags a ragged edge; layers sit 1-3 units out of register. It ends as a finished
 * print and the screen frame lifts away.
 */
type Props = {
  header: string;
  name: string;
  number: string;
  stats: {label: string; value: string}[];
  palette: string | PosterPalette;
  paper: string;
  wall: string;
  bpm: number;
  startFrame: number;
  squeegee: boolean;
  screenFrame: boolean;
  misregister: number;
  seed: number;
};

const ScreenprintPoster: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const id = useUid('spp');
  const pal = resolvePalette(p.palette);
  const geo = React.useMemo(() => buildPoster(p.seed), [p.seed]);
  const S = Math.min((h * 0.9) / POSTER_H, (w * 0.92) / POSTER_W);
  const px = (w - POSTER_W * S) / 2;
  const py = (h - POSTER_H * S) / 2;
  const beat = Math.max(6, Math.round((fps * 60) / p.bpm));
  const info: PosterInfo = {header: p.header, name: p.name, number: p.number, stats: p.stats};
  const nInfo = posterInfoCount(info);
  const infoStart = p.startFrame + POSTER_LAYERS * beat;
  const itemGap = Math.max(3, Math.round(0.18 * fps));
  const prog = Array.from({length: nInfo}, (_, j) => seg(frame, infoStart + j * itemGap, infoStart + j * itemGap + Math.max(4, itemGap - 1)));
  const printEnd = infoStart + nInfo * itemGap + 8;
  const lift = eio3(seg(frame, printEnd, printEnd + 12));
  const inks = [pal.sky1, pal.sky2, pal.sun, pal.far, pal.mid, pal.near, pal.near];
  const boxes = Array.from({length: POSTER_LAYERS}, (_, k) => (k === 6 ? BAND : ART));

  return (
    <AbsoluteFill style={{background: p.wall}}>
      <Svg>
        <PlankWall w={w} h={h} u={u} base={p.wall} />
        <defs>
          <filter id={`${id}sh`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
          <filter id={`${id}pp`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={5} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.7 -0.25" />
          </filter>
        </defs>
        <defs>
          <clipPath id={`${id}art`}>
            <rect x={ART.x} y={ART.y} width={ART.w} height={ART.h} />
          </clipPath>
        </defs>
        <g transform={`translate(${fx(px)},${fx(py)}) scale(${fx(S, 5)})`}>
          <rect x={14} y={22} width={POSTER_W} height={POSTER_H} fill="#000" opacity={0.4} filter={`url(#${id}sh)`} />
          <rect width={POSTER_W} height={POSTER_H} fill={p.paper} />
          <rect width={POSTER_W} height={POSTER_H} filter={`url(#${id}pp)`} opacity={0.16} style={{mixBlendMode: 'multiply'}} />
          {Array.from({length: POSTER_LAYERS}, (_, k) => {
            const s0 = p.startFrame + k * beat;
            const pr = seg(frame, s0, s0 + Math.round(beat * 0.9));
            if (pr <= 0) return null;
            const ox = (h1(k, p.seed + 3) - 0.5) * 2 * 2.4 * p.misregister;
            const oy = (h1(k + 9, p.seed + 3) - 0.5) * 2 * 2.4 * p.misregister;
            const rp = raggedPull(boxes[k], pr, 0, 28, 5, p.seed * 5 + k);
            return (
              <g key={k} clipPath={k < 6 ? `url(#${id}art)` : undefined}>
                {pr < 1 && (
                  <clipPath id={`${id}c${k}`}>
                    <polygon points={rp.poly} />
                  </clipPath>
                )}
                <g transform={`translate(${fx(ox)},${fx(oy)})`} clipPath={pr < 1 ? `url(#${id}c${k})` : undefined}>
                  <PosterLayer k={k} geo={geo} pal={pal} paper={p.paper} />
                </g>
              </g>
            );
          })}
          <PosterInfoInk info={info} pal={pal} paper={p.paper} prog={prog} />
          {/* squeegee riding the front of the active pull */}
          {p.squeegee &&
            Array.from({length: POSTER_LAYERS}, (_, k) => {
              const s0 = p.startFrame + k * beat;
              const pr = seg(frame, s0, s0 + Math.round(beat * 0.9));
              if (pr <= 0 || pr >= 1) return null;
              const rp = raggedPull(boxes[k], pr, 0, 28, 5, p.seed * 5 + k);
              const b = boxes[k];
              return <Squeegee key={'sq' + k} x={b.x + b.w / 2} y={rp.front - 10} len={b.w * 0.9} ink={inks[k]} frame={frame} />;
            })}
          {/* the screen frame lifts away when printing is done */}
          {p.screenFrame && lift < 1 && (
            <g transform={`translate(0,${fx(-lift * 700)})`} opacity={1 - lift * 0.6}>
              <rect x={-30} y={-30} width={POSTER_W + 60} height={POSTER_H + 60} fill="none" stroke="#8a6a45" strokeWidth={46} rx={6} />
              <rect x={-30} y={-30} width={POSTER_W + 60} height={POSTER_H + 60} fill="none" stroke="#c9a373" strokeWidth={4} rx={6} transform="translate(-21,-21) scale(1.0)" opacity={0.6} />
              <rect x={-53} y={-53} width={POSTER_W + 106} height={8} fill="#e0c08e" opacity={0.5} />
              <rect x={-8} y={-8} width={POSTER_W + 16} height={POSTER_H + 16} fill="none" stroke="#5e4433" strokeWidth={6} opacity={0.7} />
            </g>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const screenprintPoster = defineMotion<Props>({
  id: 'screenprint-poster',
  title: 'Screen-print poster (builds one ink at a time)',
  category: 'document',
  description:
    'A portrait poster builds one ink at a time under a squeegee on the beat: stepped-band sky, a concentric sun ring, far ridge with a lit facet, mid hills and near pines, then the info band stamps in its header, name, big number, rule and stats row; layers sit slightly out of register and the screen frame lifts away from the finished print.',
  source: ['lemo-opuscar styles/silkscreen-poster demo/engine/poster.js, scenes.js, silk.js, DEMO.md "Poster template" (MIT, LemoLab)'],
  useFor: 'Event posters (headline, date, venue, CTA), destination or trail guides, product drops with colourways, seasonal-hours notices: a reusable information motion with strong craft appeal. Swap palette and stats for each print.',
  durationInFrames: 240,
  defaultProps: {
    header: 'Lakeside Trail',
    name: 'Mirror Lake',
    number: '01',
    stats: [
      {label: 'Distance', value: '6.4 km'},
      {label: 'Climb', value: '210 m'},
      {label: 'Time', value: '2 h'},
    ],
    palette: 'dusk',
    paper: '#F3ECDD',
    wall: '#5e4433',
    bpm: 100,
    startFrame: 8,
    squeegee: true,
    screenFrame: true,
    misregister: 1,
    seed: 3,
  },
  propDocs: {
    header: 'tracked-out line printed in the sky',
    name: 'big name in the info band (auto-fits)',
    number: 'large two-digit number in the accent ink',
    stats: 'info row [{label, value}] (2-4 items fit)',
    palette: "'dawn' | 'noon' | 'golden' | 'dusk' | 'harbour' | 'winter' or {sky1, sky2, far, mid, near, sun, glow?}",
    paper: 'paper colour',
    wall: 'studio wall colour',
    bpm: 'one ink pull per beat at this tempo',
    startFrame: 'frame of the first pull',
    squeegee: 'show the squeegee blade on each pull',
    screenFrame: 'show the screen frame (lifts off when done)',
    misregister: 'layer offset strength (0 = perfect register)',
    seed: 'landscape seed (ridge, pines, glints)',
  },
  component: ScreenprintPoster,
  tags: ['poster', 'screen print', 'silkscreen', 'print', 'squeegee', 'event', 'trail', 'travel', 'information', 'stats', 'craft', 'misregister', 'layers', 'palette', 'build-up', 'landscape'],
});
