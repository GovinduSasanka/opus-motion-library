// Adapted from lemo-opuscar/styles/hd-2d/demo/post_ts.js (tilt-shift band) + STYLE.md §2/§6 (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {cl, eio3, h1, ISO, IsoCtx, isoBox, isoP, isoPoly, IsoPolys, isoRoof, isoTree, lerp, seg, sstep} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  src: string;
  center: number;
  width: number;
  falloff: number;
  maxBlur: number;
  follow: boolean;
  saturation: number;
  trainColor: string;
  seed: number;
  background: string;
};

const WALLS = ['#F6E7C8', '#F1CFA8', '#F4B9A0', '#CDE3D0', '#BFD7EA', '#F8E08F'];
const ROOFS = ['#C9553D', '#4F7FB8', '#3F8F86', '#E39B3C', '#7C5A9A'];
const G = 7;
const CELL = 16;

/** the miniature world: returns screen y of the train head so the focus band can follow it */
const buildWorld = (ctx: IsoCtx, frame: number, seed: number, trainColor: string, lightsOn: number) => {
  const span = G * CELL;
  const off = -span / 2;
  isoBox(ctx, off - 8, off - 8, -4, off + span + 8, off + span + 8, 0, '#E9DDC0', {bias: -900});
  isoBox(ctx, off - 4, off - 4, 0, off + span + 4, off + span + 4, 0.6, '#9DC47A', {bias: -800});
  // roads
  for (const r of [3]) {
    isoPoly(ctx, [[off + r * CELL - 2.2, off - 4, 0.7], [off + r * CELL + 2.2, off - 4, 0.7], [off + r * CELL + 2.2, off + span + 4, 0.7], [off + r * CELL - 2.2, off + span + 4, 0.7]], '#6E6A66', {bias: -700});
    isoPoly(ctx, [[off - 4, off + r * CELL - 2.2, 0.72], [off + span + 4, off + r * CELL - 2.2, 0.72], [off + span + 4, off + r * CELL + 2.2, 0.72], [off - 4, off + r * CELL + 2.2, 0.72]], '#6E6A66', {bias: -690});
  }
  // rail loop
  const lo = off + 1.5;
  const hi = off + span - 1.5;
  const rail = (x0: number, y0: number, x1: number, y1: number) => isoPoly(ctx, [[x0, y0, 0.8], [x1, y0, 0.8], [x1, y1, 0.8], [x0, y1, 0.8]], '#7B5B3E', {bias: -600});
  rail(lo - 0.7, lo - 0.7, hi + 0.7, lo + 0.7);
  rail(lo - 0.7, hi - 0.7, hi + 0.7, hi + 0.7);
  rail(lo - 0.7, lo - 0.7, lo + 0.7, hi + 0.7);
  rail(hi - 0.7, lo - 0.7, hi + 0.7, hi + 0.7);
  // blocks
  for (let gx = 0; gx < G; gx++)
    for (let gy = 0; gy < G; gy++) {
      if (gx === 3 || gy === 3) continue;
      if (gx === 0 || gy === 0 || gx === G - 1 || gy === G - 1) {
        // outer ring: trees and little gardens next to the track
        if (h1(gx, gy, seed) > 0.35) isoTree(ctx, off + gx * CELL + 8, off + gy * CELL + 8, 4.2 + h1(gx, gy, seed + 3) * 2, {});
        continue;
      }
      const r = h1(gx * 7 + gy, seed);
      const x = off + gx * CELL + 3;
      const y = off + gy * CELL + 3;
      if (r < 0.2) {
        isoTree(ctx, x + 4, y + 4, 4, {});
        isoTree(ctx, x + 9, y + 8, 3.2, {});
        continue;
      }
      const ht = 5 + Math.floor(r * 5) * 2.6;
      const wall = WALLS[Math.floor(r * 97) % WALLS.length];
      const roof = ROOFS[Math.floor(r * 53) % ROOFS.length];
      isoBox(ctx, x, y, 0.6, x + 10, y + 10, ht, wall, {});
      if (r > 0.45) isoRoof(ctx, x, y, ht, x + 10, y + 10, 4.5, roof, {});
      else isoBox(ctx, x + 0.8, y + 0.8, ht, x + 9.2, y + 9.2, ht + 1, roof, {});
      for (let wz = 0; wz < Math.floor(ht / 3); wz++) {
        const lit = h1(gx + wz * 5, gy, seed + 9) < lightsOn;
        isoPoly(ctx, [[x + 10.02, y + 2, 3.4 + wz * 3], [x + 10.02, y + 4.2, 3.4 + wz * 3], [x + 10.02, y + 4.2, 1.8 + wz * 3], [x + 10.02, y + 2, 1.8 + wz * 3]], lit ? '#FFD982' : '#8FB4CF', {bias: 0.05});
      }
    }
  // cars on the cross roads
  for (let c = 0; c < 4; c++) {
    const t = ((frame / 30) * 0.09 + c * 0.25) % 1;
    const along = off - 4 + t * (span + 8);
    const horiz = c % 2 === 0;
    const lane = off + 3 * CELL + (c < 2 ? -1.1 : 1.1);
    const x0 = horiz ? (c < 2 ? along : off + span + 4 - (along - off + 4)) : lane - 1;
    const y0 = horiz ? lane - 1 : c < 2 ? along : off + span + 4 - (along - off + 4);
    isoBox(ctx, x0, y0, 0.8, x0 + (horiz ? 3.6 : 2), y0 + (horiz ? 2 : 3.6), 2.6, ['#E94B3C', '#F2C14E', '#3F8F86', '#FFFFFF'][c], {bias: 5});
  }
  // train on the loop
  const per = 4 * (hi - lo);
  const pos = (s: number) => {
    const d = ((s % per) + per) % per;
    const L = hi - lo;
    if (d < L) return {x: lo + d, y: lo, hz: true};
    if (d < 2 * L) return {x: hi, y: lo + (d - L), hz: false};
    if (d < 3 * L) return {x: hi - (d - 2 * L), y: hi, hz: true};
    return {x: lo, y: hi - (d - 3 * L), hz: false};
  };
  const head = (frame / 30) * 13 + per * 0.1;
  let headScreen = 0;
  for (let i = 0; i < 4; i++) {
    const p = pos(head - i * 4.6);
    const dx = p.hz ? 4 : 2;
    const dy = p.hz ? 2 : 4;
    isoBox(ctx, p.x - dx / 2, p.y - dy / 2, 0.9, p.x + dx / 2, p.y + dy / 2, 3.4, i === 0 ? trainColor : '#F4EBD8', {bias: 8 + (p.x + p.y) * 0.001});
    if (i === 0) {
      isoBox(ctx, p.x - dx / 2 + 0.4, p.y - dy / 2 + 0.4, 3.4, p.x + dx / 2 - 0.4, p.y + dy / 2 - 0.4, 4.2, '#FFFFFF', {bias: 8.1});
      headScreen = isoP(ctx, p.x, p.y, 2)[1];
    }
  }
  return headScreen;
};

const TiltShiftDiorama: React.FC<Props> = ({src, center, width, falloff, maxBlur, follow, saturation, trainColor, seed, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const span = G * CELL;
  const push = lerp(1.02, 1.1, eio3(seg(frame, 0, 200)));
  const k = Math.min((w * (portrait ? 0.98 : 0.78)) / (span * 2 * 0.866 + 24), (h * (portrait ? 0.5 : 0.92)) / (span + 36)) * push;
  const ctx: IsoCtx = {k, cx: w / 2, cy: h * (portrait ? 0.5 : 0.5) - 6 * k, polys: []};
  const lightsOn = cl(0.15 + frame / 160, 0, 0.7);
  const headY = buildWorld(ctx, frame, seed, trainColor, lightsOn);
  // band centre: follows the train head (clamped .2–.8) or stays fixed
  const c0 = follow && !src ? cl(headY / h, 0.2, 0.8) : center;
  const levels = 4;
  const sig = (i: number) => (maxBlur * u * 0.5 * (i + 1)) / levels;
  const stops = Array.from({length: 41}, (_, i) => i / 40);
  const World = () => (src ? <image href={resolveSrc(src)} width={w} height={h} preserveAspectRatio="xMidYMid slice" /> : <IsoPolys ctx={ctx} />);
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <g id="tsd-world">
            <rect x={-w} y={-h} width={w * 3} height={h * 3} fill={background} />
            <World />
          </g>
          {Array.from({length: levels}, (_, i) => (
            <React.Fragment key={i}>
              <filter id={`tsd-b${i}`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation={sig(i)} edgeMode="duplicate" />
              </filter>
              <linearGradient id={`tsd-g${i}`} x1="0" y1="0" x2="0" y2="1">
                {stops.map((y) => (
                  <stop key={y} offset={y} stopColor="#fff" stopOpacity={sstep(width + (falloff * i) / levels, width + (falloff * (i + 1)) / levels, Math.abs(y - c0))} />
                ))}
              </linearGradient>
              <mask id={`tsd-m${i}`}>
                <rect width={w} height={h} fill={`url(#tsd-g${i})`} />
              </mask>
            </React.Fragment>
          ))}
          <filter id="tsd-grade" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values={String(saturation)} />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.08" intercept="-0.03" />
              <feFuncG type="linear" slope="1.08" intercept="-0.03" />
              <feFuncB type="linear" slope="1.08" intercept="-0.03" />
            </feComponentTransfer>
          </filter>
          <radialGradient id="tsd-vig" cx="50%" cy="50%" r="72%">
            <stop offset="55%" stopColor="#1B1020" stopOpacity="0" />
            <stop offset="100%" stopColor="#1B1020" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <g filter="url(#tsd-grade)">
          <use href="#tsd-world" />
          {Array.from({length: levels}, (_, i) => (
            <g key={i} mask={`url(#tsd-m${i})`}>
              <use href="#tsd-world" filter={`url(#tsd-b${i})`} />
            </g>
          ))}
        </g>
        <rect width={w} height={h} fill="url(#tsd-vig)" />
      </svg>
    </AbsoluteFill>
  );
};

export const tiltShiftDiorama = defineMotion<Props>({
  id: 'tilt-shift-diorama',
  title: 'Tilt-shift diorama',
  category: 'image',
  description:
    'A high three-quarter view of a little lit isometric town (cars, windows warming up, a train looping the track) where only a horizontal band is sharp and everything above and below melts into blur, with boosted saturation and vignette so it reads as a tabletop model. The sharp band follows the train. With src it applies the same tilt-shift to any picture.',
  source: ['lemo-opuscar styles/hd-2d/demo/post_ts.js tilt-shift term (MIT, LemoLab)', 'lemo-styles-a hd-2d: tilt-shift-diorama (2D strip fallback)'],
  useFor: 'Miniature look over any city / landscape plate, map overviews, "toy world" openers; overlay-capable as an image filter.',
  durationInFrames: 180,
  defaultProps: {src: '', center: 0.4, width: 0.1, falloff: 0.3, maxBlur: 17, follow: true, saturation: 1.3, trainColor: '#D9472F', seed: 4, background: '#CFE0D2'},
  propDocs: {
    src: 'optional image in public/ to tilt-shift instead of the built-in town',
    center: 'band centre as a fraction of height (used when follow is false or with src)',
    width: 'half-width of the fully sharp band (fraction of height, ~.1)',
    falloff: 'distance from sharp to maximum blur (fraction of height, ~.3)',
    maxBlur: 'maximum blur diameter in px at 1080p (16–18)',
    follow: 'procedural scene only: band follows the train head (clamped .2–.8)',
    saturation: 'colour boost that sells the miniature (1.15–1.4)',
    trainColor: 'loco colour',
    seed: 'town layout seed',
    background: 'ground colour around the board',
  },
  component: TiltShiftDiorama,
  tags: ['tilt shift', 'miniature', 'diorama', 'toy', 'depth of field', 'blur', 'isometric', 'town', 'train', 'model', 'map', 'image filter', 'overlay'],
});
