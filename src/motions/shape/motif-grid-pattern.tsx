// Adapted from lemo-opuscar/styles/pictogram-motion/demo/engine.js (G.pattern, G.drawPattern, motif kinds) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {ALL_MOTIFS, MotifGrid, toneSet} from '../../core/r2-lb1-kit';

/**
 * Identity-system "core graphic": a full-bleed grid of square cells carrying big discs and half-discs that straddle
 * grid nodes, discs with inner discs, and 14 small geometric motifs (quarter discs, fish scales, dots, triangles,
 * striped sunsets, concentric arcs, sun wheels, checkers, crescents, S-waves…) in five tones of one hue. Whole rows
 * slide against each other, breathe slowly and jump a quarter cell on the beat; a faint light sweep passes over.
 */

type Props = {
  hue: string;
  tones: string[];
  spread: number;
  cell: number;
  density: number;
  motifs: string[];
  rowDrift: number;
  bpm: number;
  beatJump: boolean;
  sweep: boolean;
  seed: number;
  background: string;
};

const MotifGridPattern: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const tones = p.tones.length >= 5 ? p.tones : toneSet(p.hue);
  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? 'transparent' : tones[1], overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <MotifGrid
          id="motif-grid-pattern"
          frame={frame}
          w={w}
          h={h}
          cell={p.cell * u}
          tones={tones}
          spread={p.spread}
          density={p.density}
          seed={p.seed}
          motifs={p.motifs.length ? p.motifs : ALL_MOTIFS}
          rowDrift={p.rowDrift}
          bpm={p.bpm}
          beatJump={p.beatJump}
          sweep={p.sweep}
          background={p.background !== 'transparent'}
        />
      </svg>
    </AbsoluteFill>
  );
};

export const motifGridPattern = defineMotion<Props>({
  id: 'motif-grid-pattern',
  title: 'Motif grid pattern (identity backdrop)',
  category: 'shape',
  description:
    'Brandable identity backdrop: square cells of big discs, half-discs and 14 small geometric motifs in five tones of one hue; whole rows slide against each other, breathe and jump a quarter cell on the beat, with a faint diagonal light sweep. One prop swaps the whole colour.',
  source: ['lemo-opuscar styles/pictogram-motion (MIT code, CC BY 4.0 docs, LemoLab) — demo/engine.js G.pattern/G.drawPattern'],
  useFor: 'Event, sports and launch identity backgrounds, website hero sections, chapter colour cards; low spread under text, high spread for hero cards.',
  durationInFrames: 240,
  defaultProps: {
    hue: '#D8B21A',
    tones: [],
    spread: 0.6,
    cell: 180,
    density: 0.5,
    motifs: ALL_MOTIFS,
    rowDrift: 26,
    bpm: 150,
    beatJump: true,
    sweep: true,
    seed: 7,
    background: 'tone',
  },
  propDocs: {
    hue: 'base hue; five tones are mixed toward black / white from it',
    tones: 'or five explicit tones [t0 darkest … t4 lightest] (overrides hue)',
    spread: 'contrast of the pattern against the ground (0.42 under text, 0.95 hero)',
    cell: 'cell size in u (180 = six rows at 1080p)',
    density: 'share of cells with a small motif',
    motifs: 'allow-list of motif kinds: quarter, fish, dots, tri, sunset, arcs, wheel, checker, crescent, swave, gradq, bars, half, ring',
    rowDrift: 'row drift speed (px/s at 1080p)',
    bpm: 'tempo for the quarter-cell beat jumps',
    beatJump: 'rows jump a quarter cell on each beat',
    sweep: 'faint diagonal light sweep',
    seed: 'layout seed',
    background: '"tone" (t1 ground) or "transparent" (shapes only)',
  },
  component: MotifGridPattern,
  tags: ['pattern', 'grid', 'backdrop', 'background', 'identity', 'geometric', 'motif', 'discs', 'sports', 'event', 'brand', 'loop', 'beat', 'tiles'],
});
