// Adapted from lemo-opuscar/styles/dataviz/demo/engine.js morphMark, valueColor, rampRGB, dataDot (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DV, DataDot, DvPaper, PencilLine, PtA, clamp01, eo, h01, la2Fonts, lerpN, pencilGeom, rampHex, ringPts, seg, smooth} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A finished pencil dot-and-line chart sweeps, mark by mark left to right, into a full-height "warming stripes" band:
 * each dot falls to the band centre, stretches into a coloured stripe and loses its ink ring; the graphite line fades as
 * its left dot starts moving; the annotation ring returns as a tiny pencil tick above the band.
 */

type Props = {
  values: number[];
  startLabel: string;
  endLabel: string;
  title: string;
  subtitle: string;
  centre: number;
  half: number;
  morphAt: number;
  sweep: number;
  noteIndex: number;
  note: string;
  seed: number;
  background: string;
};

const DotToStripesMorph: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, durationInFrames: D} = useStage();
  const vals = p.values.length > 1 ? p.values : [0, 1];
  const n = vals.length;
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  // chart box
  const x0 = w * (portrait ? 0.1 : 0.12);
  const x1 = w * (portrait ? 0.94 : 0.92);
  const cy0 = h * (portrait ? 0.3 : 0.26);
  const cy1 = h * (portrait ? 0.68 : 0.72);
  const X = (i: number) => x0 + ((x1 - x0) * i) / (n - 1);
  const Y = (v: number) => cy1 - ((cy1 - cy0) * (v - mn)) / (mx - mn || 1);
  // band (full height-ish)
  const by0 = h * (portrait ? 0.2 : 0.16);
  const by1 = h * (portrait ? 0.78 : 0.82);
  const cellW = (x1 - x0) / (n - 1);
  const r = Math.max(4.5 * u, Math.min(8 * u, cellW * 0.33));

  // chart draws in first: line reveals, dots land left to right
  const drawDur = Math.max(20, p.morphAt - 30);
  const lineProg = smooth(seg(frame, 6, 6 + drawDur));
  const dotAt = (i: number) => 6 + (drawDur * i) / (n - 1);
  // morph: per-mark local u
  const stagger = (p.sweep * fps) / n;
  const dur = stagger * 4;
  const uOf = (i: number) => clamp01((frame - p.morphAt - i * stagger) / dur);
  const started = frame >= p.morphAt;

  const pts: PtA[] = vals.map((v, i) => [X(i), Y(v)]);
  const lineG = pencilGeom(pts, {progress: lineProg, seed: p.seed, wobble: 0.5, width: 2.4 * u});

  const marks: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const uu = uOf(i);
    const col = rampHex((vals[i] - p.centre) / p.half);
    const landed = frame >= dotAt(i);
    if (!landed) continue;
    // line segment to the next dot fades as this dot starts
    if (i < n - 1 && frame >= dotAt(i + 1) && uu < 0.3) {
      // handled by global line below until morph start
    }
    if (uu <= 0) {
      marks.push(<DataDot key={i} x={X(i)} y={Y(vals[i])} r={r} fill={col} fresh={(frame - dotAt(i)) / fps} ringW={1.5 * u} />);
      continue;
    }
    // morph math (engine.js morphMark)
    const fall = smooth(Math.min(1, uu / 0.45));
    const grow = eo(Math.max(0, (uu - 0.3) / 0.7));
    const bx0 = x0 + (i - 0.5) * cellW;
    const bx1 = x0 + (i + 0.5) * cellW;
    const cxm = lerpN(X(i), (bx0 + bx1) / 2, grow);
    const cym = lerpN(Y(vals[i]), (by0 + by1) / 2, fall);
    const ww = lerpN(r * 2, bx1 - bx0 + 0.6, grow);
    const hh = lerpN(r * 2, by1 - by0, grow);
    const rad = lerpN(r, 0, Math.min(1, grow * 1.5));
    marks.push(
      <g key={i}>
        <rect x={cxm - ww / 2} y={cym - hh / 2} width={ww} height={hh} rx={rad} fill={col} />
        {grow < 1 && <rect x={cxm - ww / 2} y={cym - hh / 2} width={ww} height={hh} rx={rad} fill="none" stroke={DV.ink} strokeWidth={1.5 * u} opacity={1 - grow} />}
      </g>,
    );
  }
  // graphite line fades out as the sweep crosses it
  const lineFade = started ? 1 - smooth(seg(frame, p.morphAt, p.morphAt + p.sweep * fps * 0.7)) : 1;

  // annotation: ring around noteIndex + handwritten note, returning as a pencil tick above the band
  const ni = Math.min(n - 1, Math.max(0, p.noteIndex < 0 ? n - 1 : p.noteIndex));
  const ringP = smooth(seg(frame, dotAt(ni) + 10, dotAt(ni) + 26));
  const nu = uOf(ni);
  const ringFade = 1 - smooth(Math.min(1, nu / 0.4));
  const tickIn = smooth(seg(nu, 0.5, 1));
  const noteCol = vals[ni] >= p.centre ? DV.red : DV.blue;
  const tickX = x0 + ni * cellW;

  // axis + labels
  const axisP = smooth(seg(frame, 2, 18));
  const labA = smooth(seg(frame, 10, 24));
  const titleA = smooth(seg(frame, 4, 20));
  const endA = smooth(seg(frame, p.morphAt + p.sweep * fps, p.morphAt + p.sweep * fps + 18));
  const fsT = (portrait ? 54 : 66) * u;

  return (
    <AbsoluteFill style={{background: p.background}}>
      <DvPaper w={w} h={h} u={u} color={p.background} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {/* title (Newsreader) + kicker */}
        <g opacity={titleA}>
          <text x={x0} y={h * (portrait ? 0.1 : 0.12)} fontFamily={la2Fonts.newsreader} fontWeight={500} fontSize={fsT} fill={DV.ink}>
            {p.title}
          </text>
          <text x={x0} y={h * (portrait ? 0.1 : 0.12) + (portrait ? 44 : 34) * u} fontFamily={la2Fonts.plex} fontSize={(portrait ? 26 : 17) * u} fill={DV.inkSoft} letterSpacing={1 * u}>
            {p.subtitle}
          </text>
        </g>
        {/* axis */}
        <g opacity={axisP * lineFade}>
          <PencilLine pts={[[x0 - 14 * u, cy1 + r * 2.2], [x1 + 10 * u, cy1 + r * 2.2]]} progress={axisP} width={1.5 * u} color={DV.ink} seed={p.seed + 3} alpha={0.6} />
        </g>
        {/* graphite series line */}
        {lineFade > 0.01 && lineG.d && <path d={lineG.d} fill="none" stroke={DV.graphite} strokeWidth={2.4 * u} strokeLinecap="round" strokeLinejoin="round" opacity={0.85 * lineFade} />}
        {/* marks / stripes */}
        {marks}
        {/* x labels */}
        <g opacity={labA} fontFamily={la2Fonts.plex} fontSize={(portrait ? 28 : 17) * u} fill={DV.inkSoft}>
          <text x={x0} y={by1 + (portrait ? 44 : 34) * u} textAnchor="middle">
            {p.startLabel}
          </text>
          <text x={x1} y={by1 + (portrait ? 44 : 34) * u} textAnchor="middle">
            {p.endLabel}
          </text>
        </g>
        {/* annotation ring -> tick */}
        {ringP > 0 && ringFade > 0 && (
          <g opacity={ringFade}>
            <PencilLine pts={ringPts(X(ni), Y(vals[ni]), r * 2.1, p.seed + 7)} progress={ringP} width={1.6 * u} color={noteCol} seed={p.seed + 11} />
          </g>
        )}
        {p.note && (ringP > 0.3 || tickIn > 0) && (
          <g>
            <text
              x={Math.min(tickX, x1 - 40 * u)}
              y={(started ? by0 : Y(vals[ni]) - r * 3.2) - 16 * u}
              fontFamily={la2Fonts.caveat}
              fontSize={(portrait ? 40 : 30) * u}
              fill={noteCol}
              textAnchor={ni > n * 0.7 ? 'end' : 'start'}
              opacity={Math.max(ringFade * smooth(seg(ringP, 0.3, 1)), tickIn)}
            >
              {p.note}
            </text>
            {tickIn > 0 && <PencilLine pts={[[tickX, by0 - 12 * u], [tickX, by0 - 2 * u]]} progress={tickIn} width={2 * u} color={noteCol} seed={p.seed + 13} />}
          </g>
        )}
        {/* ramp legend after the sweep */}
        <g opacity={endA}>
          {Array.from({length: 24}, (_, i) => {
            const uu2 = (i / 23) * 2 - 1;
            return <rect key={i} x={x0 + ((x1 - x0 - 120 * u) * i) / 24} y={by1 + 48 * u} width={(x1 - x0 - 120 * u) / 24 + 1} height={10 * u} fill={rampHex(uu2)} />;
          })}
          <text x={x1} y={by1 + 58 * u} fontFamily={la2Fonts.plex} fontSize={(portrait ? 26 : 15) * u} fill={DV.inkSoft} textAnchor="end">
            ±{p.half.toFixed(2)}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const demoValues = Array.from({length: 48}, (_, i) => -0.25 + 0.02 * i + (h01(i, 1, 5) - 0.5) * 0.28 + (i > 36 ? (i - 36) * 0.022 : 0));

export const dotToStripesMorph = defineMotion<Props>({
  id: 'dot-to-stripes-morph',
  title: 'Dot-to-stripes morph',
  category: 'data',
  description:
    'A hand-drawn pencil dot chart on cream paper sweeps mark by mark into a full-height warming-stripes band: each dot falls to the band centre, stretches into its coloured stripe and loses its ink ring, while the graphite line fades and a handwritten note returns as a tiny pencil tick.',
  source: ['lemo-opuscar styles/dataviz (MIT, LemoLab) — engine.js morphMark, valueColor, rampRGB, dataDot'],
  useFor: 'Climate / finance / health "the whole century in one band" reveals; the ramp centre, span and colours are props so it stays brand-safe.',
  durationInFrames: 210,
  defaultProps: {
    values: demoValues.map((v) => Math.round(v * 100) / 100),
    startLabel: '1978',
    endLabel: '2025',
    title: 'Every summer since 1978',
    subtitle: 'ANOMALY VS 1951–80 MEAN, °C · ONE MARK PER YEAR',
    centre: 0.22,
    half: 0.85,
    morphAt: 110,
    sweep: 1.9,
    noteIndex: -1,
    note: 'the hottest yet',
    seed: 5,
    background: DV.paper,
  },
  propDocs: {
    values: 'the series (one mark each)',
    startLabel: 'label under the first mark',
    endLabel: 'label under the last mark',
    title: 'serif headline',
    subtitle: 'mono kicker under it',
    centre: 'ramp centre (reference mean)',
    half: 'symmetric half-span of the diverging ramp',
    morphAt: 'frame where the sweep starts',
    sweep: 'sweep duration in seconds',
    noteIndex: 'which mark gets the handwritten ring note (-1 = the last one)',
    note: 'handwritten note text (empty = none)',
    seed: 'pencil wobble seed',
    background: 'paper colour',
  },
  component: DotToStripesMorph,
  tags: ['warming stripes', 'climate', 'morph', 'chart', 'dots', 'stripes', 'pencil', 'hand drawn', 'paper', 'data story', 'diverging ramp', 'rdbu', 'annotation', 'handwriting', 'dataviz', 'reveal'],
});
