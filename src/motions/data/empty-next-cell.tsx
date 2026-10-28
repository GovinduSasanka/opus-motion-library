// Adapted from lemo-opuscar/styles/dataviz/demo/engine.js dashedCell() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DV, DataDot, DvPaper, PencilLine, PtA, clamp01, eio, h01, la2Fonts, lerpN, pencilGeom, rampHex, resampleA, seg, smooth} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * The value nobody knows yet: after a short run of landed marks, a dashed red pencil rectangle draws itself around its
 * perimeter in the next empty slot with a handwritten "?", holds, then widens into a frame-within-frame end card.
 */

type Props = {
  values: number[];
  labels: [string, string];
  title: string;
  subtitle: string;
  question: string;
  cardTitle: string;
  cardSub: string;
  widenAt: number;
  color: string;
  seed: number;
  background: string;
};

const EmptyNextCell: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, durationInFrames: D} = useStage();
  const PT = portrait ? 1.75 : 1;
  const vals = p.values.length ? p.values : [1];
  const n = vals.length;
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const x0 = w * (portrait ? 0.1 : 0.13);
  const x1 = w * (portrait ? 0.92 : 0.89);
  const y0 = h * (portrait ? 0.26 : 0.28);
  const y1 = h * (portrait ? 0.74 : 0.7);
  const slotW = (x1 - x0) / (n + 1);
  const X = (i: number) => x0 + slotW * (i + 0.5);
  const Y = (v: number) => y1 - ((y1 - y0) * (v - mn)) / (mx - mn || 1);

  const drawDur = 46;
  const dotAt = (i: number) => 6 + (drawDur * i) / Math.max(1, n - 1);
  const pts: PtA[] = [];
  for (let i = 0; i < n; i++) if (frame >= dotAt(i)) pts.push([X(i) - slotW, Y(vals[i])]); // shifted: marks occupy slots 0..n-1, cell is slot n
  // actually keep marks at X(i) and the empty cell after the last mark
  const mpts: PtA[] = [];
  for (let i = 0; i < n; i++) if (frame >= dotAt(i)) mpts.push([X(i), Y(vals[i])]);
  const lineG = mpts.length > 1 ? pencilGeom(mpts, {progress: 1, seed: p.seed, wobble: 0.5, width: 2.4 * u}) : null;

  // the empty next cell: dashed rect drawn by perimeter progress over ~1 s, then widening to the full frame
  const pad = Math.min(slotW * 0.44, 46 * u);
  const c0: [number, number, number, number] = [x0 + slotW * (n + 0.02), Y(vals[n - 1]) - pad * 1.9, slotW * 0.96, pad * 3.2];
  const drawStart = drawDur + 14;
  const perim = smooth(seg(frame, drawStart, drawStart + fps));
  const widen = eio(seg(frame, p.widenAt, p.widenAt + 0.9 * fps));
  const margin = 44 * u;
  const rect: [number, number, number, number] = [
    lerpN(c0[0], margin, widen),
    lerpN(c0[1], margin, widen),
    lerpN(c0[2], w - 2 * margin, widen),
    lerpN(c0[3], h - 2 * margin, widen),
  ];
  const [rx, ry, rw, rh] = rect;
  // dashed perimeter path cut by progress
  const per: PtA[] = [
    [rx, ry],
    [rx + rw, ry],
    [rx + rw, ry + rh],
    [rx, ry + rh],
    [rx, ry],
  ];
  const R = resampleA(per, 4 * u);
  const end = R.total * clamp01(perim);
  const dashSegs: React.ReactNode[] = [];
  const dash = 9 * u;
  const gap = 7 * u;
  for (let i = 1; i < R.pts.length; i++) {
    if (R.len[i] > end) break;
    if (R.len[i] % (dash + gap) < dash) {
      const a = R.pts[i - 1];
      const b = R.pts[i];
      dashSegs.push(<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={p.color} strokeWidth={1.8 * u} strokeLinecap="round" opacity={0.85 * (1 - 0.35 * h01(i, 1, p.seed))} />);
    }
  }
  const qA = smooth(seg(frame, drawStart + fps * 0.7, drawStart + fps * 1.1));
  const axisP = smooth(seg(frame, 2, 16));
  const titleA = smooth(seg(frame, 4, 18)) * (1 - widen);
  const chartFade = 1 - widen * 0.85;
  const cardA = smooth(seg(frame, p.widenAt + 0.7 * fps, p.widenAt + 1.1 * fps));
  const fsT = (portrait ? 52 : 64) * u;
  const qSize = lerpN(Math.min(54 * u, c0[3] * 0.72), 190 * u, widen);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <DvPaper w={w} h={h} u={u} color={p.background} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <g opacity={titleA}>
          <text x={x0 - 10 * u} y={h * (portrait ? 0.12 : 0.14)} fontFamily={la2Fonts.newsreader} fontWeight={500} fontSize={fsT} fill={DV.ink}>
            {p.title}
          </text>
          <text x={x0 - 10 * u} y={h * (portrait ? 0.12 : 0.14) + (portrait ? 44 : 32) * u} fontFamily={la2Fonts.plex} fontSize={16 * PT * u} fill={DV.inkSoft} letterSpacing={1 * u}>
            {p.subtitle}
          </text>
        </g>
        <g opacity={chartFade}>
          <PencilLine pts={[[x0 - 10 * u, y1 + 24 * u], [x1 + 20 * u, y1 + 24 * u]]} progress={axisP} width={1.5 * u} color={DV.ink} seed={p.seed + 3} alpha={0.65} />
          {lineG?.d && <path d={lineG.d} fill="none" stroke={DV.graphite} strokeWidth={2.4 * u} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />}
          {mpts.map(([mxp, myp], i) => (
            <DataDot key={i} x={mxp} y={myp} r={6 * u} fill={i === n - 1 ? p.color : DV.paper} ring={DV.ink} fresh={(frame - dotAt(i)) / fps} ringW={1.6 * u} />
          ))}
          <g opacity={axisP * 0.9} fontFamily={la2Fonts.plex} fontSize={16 * PT * u} fill={DV.inkSoft}>
            <text x={X(0)} y={y1 + 52 * u} textAnchor="middle">
              {p.labels[0]}
            </text>
            <text x={x0 + slotW * (n + 0.5)} y={y1 + 52 * u} textAnchor="middle" fill={p.color}>
              {p.labels[1]}
            </text>
          </g>
        </g>
        {dashSegs}
        {qA > 0 && (
          <text x={rx + rw / 2} y={ry + rh * lerpN(0.5, 0.4, widen) + qSize * 0.34} fontFamily={la2Fonts.caveat} fontWeight={700} fontSize={qSize} fill={p.color} textAnchor="middle" opacity={qA} transform={`rotate(${-4 * (1 - widen)} ${rx + rw / 2} ${ry + rh / 2})`}>
            {p.question}
          </text>
        )}
        <g opacity={cardA}>
          <text x={w / 2} y={ry + rh * 0.72} fontFamily={la2Fonts.newsreader} fontWeight={500} fontSize={(portrait ? 46 : 56) * u} fill={DV.ink} textAnchor="middle">
            {p.cardTitle}
          </text>
          <text x={w / 2} y={ry + rh * 0.72 + 38 * u} fontFamily={la2Fonts.plex} fontSize={17 * PT * u} fill={DV.inkSoft} textAnchor="middle" letterSpacing={1.5 * u}>
            {p.cardSub}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const emptyNextCell = defineMotion<Props>({
  id: 'empty-next-cell',
  title: 'Empty next cell',
  category: 'data',
  description:
    'After a short run of pencil data marks, a dashed red rectangle draws itself around the next empty slot with a handwritten "?", holds, then widens into a frame-within-frame end card for the value nobody knows yet.',
  source: ['lemo-opuscar styles/dataviz (MIT, LemoLab) — engine.js dashedCell'],
  useFor: 'Forecasts, "what\'s next" end cards, upcoming launches / quarters / seasons at the end of any chart story.',
  durationInFrames: 180,
  defaultProps: {
    values: [34, 41, 38, 47, 52, 49, 58, 63],
    labels: ['Q1 ’24', 'Q1 ’26'],
    title: 'Eight quarters in',
    subtitle: 'NEW TEAMS PER QUARTER',
    question: '?',
    cardTitle: 'Q1 2026 — your guess',
    cardSub: 'THE NEXT CELL IS STILL EMPTY',
    widenAt: 120,
    color: DV.red,
    seed: 3,
    background: DV.paper,
  },
  propDocs: {
    values: 'the known series (one mark per slot; the dashed cell sits after the last)',
    labels: '[first, last+1] slot labels; the second is the unknown slot in the accent colour',
    title: 'serif headline',
    subtitle: 'mono kicker',
    question: 'handwritten text inside the cell',
    cardTitle: 'end-card line once widened',
    cardSub: 'end-card mono line',
    widenAt: 'frame where the cell widens into the end card (0 = never)',
    color: 'pencil colour of the dashed cell (red = records/warnings)',
    seed: 'pencil jitter seed',
    background: 'paper colour',
  },
  component: EmptyNextCell,
  tags: ['forecast', 'unknown', 'question', 'dashed', 'cell', 'end card', 'pencil', 'hand drawn', 'paper', 'whats next', 'future', 'dataviz', 'chart', 'frame within frame'],
});
