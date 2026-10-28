// Adapted from lemo-opuscar/styles/newsreel/demo/index.html (pencil, ring, lineP, pencilDark, sceneButton) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {P, PencilStroke, WaxFilter, eo, greaseArrow, greaseRing, greaseUnderline, jolt, lbf, seg} from '../../core/r2-lb1-kit';

/**
 * Grease-pencil annotation overlay: a warm-white wax pencil draws a slightly wobbly loop that overshoots past its
 * start around a detail, then a quick arrow (shaft + two barbs), a cross or a soft-lead underline; every stroke is
 * doubled by a thinner offset pass so it looks waxy. Optionally freezes an image with a short jolt first.
 * Transparent by default — lay it over any motion, still or screenshot.
 */

type Mark = {type: 'ring' | 'arrow' | 'underline' | 'cross'; at: [number, number]; to?: [number, number]; rx?: number; ry?: number; rot?: number; start: number; dur?: number; label?: string};
type Props = {
  marks: Mark[];
  color: string;
  width: number;
  double: boolean;
  freezeSrc: string;
  joltAmp: number;
  labelColor: string;
  seed: number;
  background: string;
};

const GreasePencilMark: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = 'grease-pencil-mark';
  const d = frame / 30;
  const jx = p.freezeSrc ? jolt(d, 12, 60) * p.joltAmp * u : 0;
  const strokes: React.ReactNode[] = [];
  p.marks.forEach((m, i) => {
    const at: P = [m.at[0] * w, m.at[1] * h];
    const dur = m.dur ?? (m.type === 'ring' ? 9 : m.type === 'underline' ? 8 : 5);
    const k = eo(seg(frame, m.start, m.start + dur));
    if (k <= 0) return;
    const col = p.color;
    const wd = p.width * u;
    if (m.type === 'ring') {
      const pts = greaseRing(at[0], at[1], (m.rx ?? 0.09) * Math.min(w, h) * 1.6, (m.ry ?? 0.06) * Math.min(w, h) * 1.6, m.rot ?? -0.1, p.seed + i, u);
      strokes.push(<PencilStroke key={i} pts={pts} p={k} color={col} width={wd} u={u} double={p.double} filter={`url(#${id}-wax)`} />);
    } else if (m.type === 'arrow') {
      const to: P = m.to ? [m.to[0] * w, m.to[1] * h] : [at[0] + 0.12 * w, at[1] + 0.1 * h];
      const [shaft, b1, b2] = greaseArrow(at, to, p.seed + i, u);
      strokes.push(
        <g key={i}>
          <PencilStroke pts={shaft} p={k} color={col} width={wd} u={u} double={p.double} filter={`url(#${id}-wax)`} />
          <PencilStroke pts={b1} p={seg(frame, m.start + dur, m.start + dur + 2.5)} color={col} width={wd} u={u} double={false} filter={`url(#${id}-wax)`} />
          <PencilStroke pts={b2} p={seg(frame, m.start + dur + 2, m.start + dur + 4.5)} color={col} width={wd} u={u} double={false} filter={`url(#${id}-wax)`} />
        </g>,
      );
    } else if (m.type === 'underline') {
      const half = (m.rx ?? 0.12) * w;
      strokes.push(<PencilStroke key={i} pts={greaseUnderline(at[0] - half, at[0] + half, at[1], p.seed + i, u)} p={k} color={col} width={wd * 0.85} u={u} double={p.double} filter={`url(#${id}-wax)`} opacity={0.8} />);
    } else if (m.type === 'cross') {
      const r = (m.rx ?? 0.045) * Math.min(w, h) * 1.6;
      const l1: P[] = [
        [at[0] - r, at[1] - r],
        [at[0] + r * 1.08, at[1] + r * 0.94],
      ];
      const l2: P[] = [
        [at[0] + r * 0.96, at[1] - r * 1.04],
        [at[0] - r * 1.05, at[1] + r],
      ];
      strokes.push(
        <g key={i}>
          <PencilStroke pts={l1} p={seg(frame, m.start, m.start + 3)} color={col} width={wd} u={u} double={p.double} filter={`url(#${id}-wax)`} />
          <PencilStroke pts={l2} p={seg(frame, m.start + 3, m.start + 6)} color={col} width={wd} u={u} double={p.double} filter={`url(#${id}-wax)`} />
        </g>,
      );
    }
    if (m.label) {
      const lk = eo(seg(frame, m.start + dur + 4, m.start + dur + 10));
      if (lk > 0) {
        const ly = at[1] + (m.type === 'ring' ? (m.ry ?? 0.06) * Math.min(w, h) * 1.6 + 46 * u : 46 * u);
        strokes.push(
          <text key={'l' + i} x={at[0]} y={ly} textAnchor="middle" fontFamily={lbf('oswald')} fontWeight={600} fontSize={30 * u} letterSpacing="0.18em" fill={p.labelColor} opacity={lk}>
            {m.label.toUpperCase()}
          </text>,
        );
      }
    }
  });
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${jx}px, ${jx * 0.6}px)`}}>
        {p.freezeSrc && <Img src={resolveSrc(p.freezeSrc)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.1) sepia(0.18)'}} />}
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <WaxFilter id={`${id}-wax`} u={u} />
          </defs>
          {strokes}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const greasePencilMark = defineMotion<Props>({
  id: 'grease-pencil-mark',
  title: 'Grease pencil marks',
  category: 'fx',
  description:
    'Hand-made telestration: a warm-white grease pencil draws a wobbly overshooting ring around a detail, quick arrows with barbs, crosses and soft-lead underlines — each stroke doubled by a thinner offset pass so it reads waxy; optionally freezes an image with a short jolt first. Transparent overlay by default.',
  source: ['lemo-opuscar styles/newsreel (MIT code, CC BY 4.0 docs, LemoLab) — demo/index.html pencil/ring/lineP/pencilDark'],
  useFor: '"Look here" evidence circles for documentaries, sports telestration on stills, tutorial screenshots, annotated archive photos.',
  durationInFrames: 120,
  defaultProps: {
    marks: [
      {type: 'ring', at: [0.62, 0.38], rx: 0.1, ry: 0.07, rot: -0.12, start: 8, label: 'Here'},
      {type: 'arrow', at: [0.3, 0.72], to: [0.54, 0.46], start: 34},
      {type: 'underline', at: [0.3, 0.8], rx: 0.11, start: 52},
    ],
    color: 'rgba(250,248,240,0.92)',
    width: 7,
    double: true,
    freezeSrc: '',
    joltAmp: 16,
    labelColor: '#F3EEE4',
    seed: 5,
    background: 'transparent',
  },
  propDocs: {
    marks: 'annotations [{type: ring|arrow|underline|cross, at: [x,y] 0..1, to? (arrow), rx/ry (size), rot, start (frame), dur?, label?}]',
    color: 'pencil colour (warm white; use a dark tone on paper)',
    width: 'stroke width in u',
    double: 'second thinner offset pass (waxy look)',
    freezeSrc: 'optional image to freeze and jolt under the marks',
    joltAmp: 'freeze jolt amplitude in u',
    labelColor: 'label colour',
    seed: 'wobble seed',
    background: 'default "transparent" (overlay); any colour for standalone',
  },
  component: GreasePencilMark,
  tags: ['annotation', 'telestrator', 'grease pencil', 'circle', 'arrow', 'underline', 'cross', 'overlay', 'evidence', 'documentary', 'newsreel', 'look here', 'markup'],
});
