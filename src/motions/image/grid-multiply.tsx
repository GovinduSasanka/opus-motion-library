// Adapted from lemo-opuscar/styles/city-symphony/demo/tools/render.py grid_plate(), ORDER9/ORDER16 (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CsFinish, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DEMO_IMAGES, Pic} from '../../core/ui-kit';

/**
 * The frame multiplies on the beat: one picture → 1×2 → 2×2 → 3×3 → 4×4. Each new stage lights its cells in a fixed
 * scattered order (never black: unlit cells keep the previous stage's picture); on the last beat the cells re-cut every
 * sixteenth, then everything slams back to one picture. Black 6 px gutters, slow push inside every cell.
 */

type Stage = {at: number; cols: number; rows: number};
type Props = {
  images: string[];
  stages: Stage[];
  bpm: number;
  gutter: number;
  frantic: boolean;
  franticAt: number;
  endFullAt: number;
  push: number;
  grade: boolean;
  seed: number;
};

const ORDER9 = [4, 0, 8, 2, 6, 1, 7, 3, 5];
const ORDER16 = [5, 10, 0, 15, 3, 12, 6, 9, 1, 14, 4, 11, 2, 13, 7, 8];
const orderFor = (n: number) => (n === 9 ? ORDER9 : n === 16 ? ORDER16 : Array.from({length: n}, (_, i) => i));

const GridMultiply: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const id = useIdA('gm');
  const beat = (60 / p.bpm) * fps;
  const six = beat / 4;
  const stages = p.stages.length ? p.stages : [{at: 0, cols: 1, rows: 1}];
  const full = p.endFullAt > 0 && frame >= p.endFullAt;
  let si = 0;
  stages.forEach((s, i) => {
    if (frame >= s.at) si = i;
  });
  const shift = p.frantic && frame >= p.franticAt && !full ? Math.floor((frame - p.franticAt) / six) + 1 : 0;
  const g = p.gutter * u;
  const nImg = p.images.length;

  const cell = (stageIdx: number, k: number, x: number, y: number, cw: number, ch: number, sh: number, row = 0) => {
    const key = stageIdx * 31 + k * 5 + sh * 5 + p.seed;
    const raw = k + row * 2 + stageIdx * 3 + sh * 5 + p.seed;
    const src = nImg ? p.images[raw % nImg] : undefined;
    const rep = nImg ? Math.floor(k / nImg) + (sh % 2) : 0;
    const t = (frame - stages[stageIdx].at) / fps;
    const z = 1 + (rep % 3) * 0.25 + p.push * t;
    const pos = `${30 + ((key * 37) % 41)}% ${35 + ((key * 23) % 31)}%`;
    return (
      <div key={`${stageIdx}-${k}`} style={{position: 'absolute', left: x, top: y, width: cw, height: ch, overflow: 'hidden', background: '#000'}}>
        <Pic id={`${id}c${stageIdx}-${k}-${sh}`} src={src} seed={key} position={pos} time={frame} imgStyle={{transform: `scale(${z})`, transformOrigin: pos}} />
      </div>
    );
  };

  const layer = (stageIdx: number, litCount: number, sh: number) => {
    const s = stages[stageIdx];
    const cols = portrait ? s.rows : s.cols;
    const rows = portrait ? s.cols : s.rows;
    const n = cols * rows;
    const order = orderFor(n);
    const cw = w / cols;
    const ch = h / rows;
    const els: React.ReactNode[] = [];
    for (let k = 0; k < n; k++) {
      if (order.indexOf(k) >= litCount) continue;
      const cx = (k % cols) * cw;
      const cy = Math.floor(k / cols) * ch;
      els.push(cell(stageIdx, k, cx + (k % cols ? g / 2 : 0), cy + (Math.floor(k / cols) ? g / 2 : 0), cw - (k % cols ? g / 2 : 0) - (k % cols < cols - 1 ? g / 2 : 0), ch - (Math.floor(k / cols) ? g / 2 : 0) - (Math.floor(k / cols) < rows - 1 ? g / 2 : 0), sh, Math.floor(k / cols)));
    }
    return els;
  };

  let content: React.ReactNode;
  if (full) {
    content = cell(0, 0, 0, 0, w, h, 7);
  } else {
    const s = stages[si];
    const n = s.cols * s.rows;
    const step = Math.min(six, (0.3 * fps) / n);
    const lit = si === 0 || n <= 2 ? (n === 2 ? (frame >= s.at + beat / 2 ? 2 : 1) : n) : Math.min(n, Math.floor((frame - s.at) / step) + 1);
    const filling = si > 0 && lit < n;
    content = (
      <>
        {filling && layer(si - 1, 999, 0)}
        {layer(si, lit, shift)}
      </>
    );
  }
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: p.grade ? 'contrast(1.08) saturate(0.86) brightness(0.98)' : undefined}}>{content}</AbsoluteFill>
      <CsFinish w={w} h={h} frame={frame} id={id + 'f'} grain={p.grade ? 0.1 : 0} vignette={p.grade ? 0.35 : 0} matte={p.grade} />
    </AbsoluteFill>
  );
};

export const gridMultiply = defineMotion<Props>({
  id: 'grid-multiply',
  title: 'Grid multiply',
  category: 'image',
  description:
    'The frame splits 1×2 → 2×2 → 3×3 → 4×4 on the beat; each stage lights its cells in a scattered order over the previous stage (never black), the last beat re-cuts every cell every sixteenth, then it slams back to one picture.',
  source: ['lemo-opuscar styles/city-symphony (MIT, LemoLab) — render.py grid_plate, ORDER9/ORDER16'],
  useFor: 'Montage climaxes, "everything at once" beats, product-range / UGC / location walls synced to music; pass your own `images`.',
  durationInFrames: 180,
  defaultProps: {
    images: DEMO_IMAGES,
    stages: [
      {at: 0, cols: 1, rows: 1},
      {at: 15, cols: 2, rows: 1},
      {at: 45, cols: 2, rows: 2},
      {at: 75, cols: 3, rows: 3},
      {at: 105, cols: 4, rows: 4},
    ],
    bpm: 120,
    gutter: 6,
    frantic: true,
    franticAt: 150,
    endFullAt: 168,
    push: 0.05,
    grade: true,
    seed: 1,
  },
  propDocs: {
    images: 'public/ image paths cycled through the cells (empty = procedural scenes)',
    stages: '[{at: frame, cols, rows}] — one stage per half bar or bar; cols/rows swap in portrait',
    bpm: 'tempo: the 1×2 halves light half a beat apart, cells fill on sixteenths (≤ 0.3 s per stage)',
    gutter: 'black gutter width in u',
    frantic: 'on the last beat re-cut every cell every sixteenth',
    franticAt: 'frame where the frantic re-cutting starts',
    endFullAt: 'frame where it slams back to one full picture (0 = never)',
    push: 'slow zoom per second inside each cell',
    grade: 'release-print finish: contrast, desaturation, grain, vignette and 1.85 matte',
    seed: 'crop / procedural seed',
  },
  component: GridMultiply,
  tags: ['grid', 'split screen', 'montage', 'multiply', 'beat', 'music sync', 'wall', 'mosaic', 'climax', 'everything at once', 'ugc', 'city symphony', 'cuts', 'time-lapse'],
});
