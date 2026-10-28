// Adapted from lemo-opuscar/styles/swiss-motion/demo/film.js (buildUnits, drawUnits, gridState, drawScoreLabels) (MIT / CC BY 4.0, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {eo3, fx, lerp, lf, precise, seg} from '../../core/r2-lb2b-kit';

/**
 * "The poster is the score": a white poster on a pale page; a modular grid draws on column by column, black bars step
 * down a diagonal with lighter "second voice" bars beneath; the whole artifact rotates 90 degrees and stops, pitch labels
 * and step numbers wipe in, and a red playhead sweeps — each bar turns red on the exact frame it is played, and the red
 * circle pulses a ring when it is hit. Data can double as a real chart or schedule.
 */
type Note = {col: number; row: number; len: number; voice: 'main' | 'second'};
type Props = {
  cols: number;
  rows: number;
  notes: Note[];
  pitchLabels: string[];
  circle: {col: number; row: number};
  title: string;
  caption: string;
  gridStart: number;
  barsStart: number;
  rotateAt: number;
  rotateFrames: number;
  labelsAt: number;
  playFrom: number;
  playFrames: number;
  page: string;
  paper: string;
  ink: string;
  second: string;
  signal: string;
};

const PW = 706;
const PH = 1008;

const GridScore: React.FC<Props> = ({cols, rows, notes, pitchLabels, circle, title, caption, gridStart, barsStart, rotateAt, rotateFrames, labelsAt, playFrom, playFrames, page, paper, ink, second, signal}) => {
  const frame = useCurrentFrame();
  const {w, h, cx, cy} = useStage();
  const fArch = lf('archivo');
  const fMono = lf('plex');
  const cw = 40;
  const ch = Math.min(52, 830 / rows);
  const gw = cols * cw;
  const gh = rows * ch;
  const x0 = -gw / 2;
  const y0 = -gh / 2 + 22;
  const rotE = precise(seg(frame, rotateAt, rotateAt + rotateFrames));
  const S0 = (h * 0.86) / PH;
  const S1 = Math.min((w * 0.9) / PH, (h * 0.8) / PW);
  const S = lerp(S0, S1, rotE);
  const enter = eo3(seg(frame, 0, 14));
  const playK = seg(frame, playFrom, playFrom + playFrames);
  const playY = lerp(y0, y0 + gh, playK);
  const hitFrame = (row: number) => Math.round(playFrom + (row / rows) * playFrames);
  const labelsOn = frame >= labelsAt;
  const gridLines: React.ReactNode[] = [];
  for (let c = 0; c <= cols; c++) {
    const p = seg(frame, gridStart + c * 3.75, gridStart + c * 3.75 + 10);
    if (p > 0) gridLines.push(<line key={'v' + c} x1={x0 + c * cw} y1={y0} x2={x0 + c * cw} y2={y0 + gh * p} />);
  }
  for (let r = 0; r <= rows; r++) {
    const p = seg(frame, gridStart + 8 + r * 1.2, gridStart + 8 + r * 1.2 + 10);
    if (p > 0) gridLines.push(<line key={'h' + r} x1={x0} y1={y0 + r * ch} x2={x0 + gw * p} y2={y0 + r * ch} />);
  }
  const bar = (n: Note, i: number) => {
    const on = barsStart + n.row * 2 + (n.voice === 'second' ? 1 : 4) + i * 0.3;
    const p = precise(seg(frame, on, on + 5));
    if (p <= 0) return null;
    const bx = x0 + n.col * cw + 4;
    const by = y0 + n.row * ch + 3;
    const bh = n.len * ch - 6;
    const played = n.voice === 'main' && frame >= hitFrame(n.row);
    return <rect key={`${n.voice}${i}`} x={bx} y={by} width={cw - 8} height={bh * p} fill={n.voice === 'second' ? second : played ? signal : ink} />;
  };
  const circ = circle;
  const circX = x0 + (circ.col + 0.5) * cw;
  const circY = y0 + (circ.row + 0.5) * ch;
  const circOn = precise(seg(frame, barsStart + circ.row * 2 + 6, barsStart + circ.row * 2 + 12));
  const ringP = eo3(seg(frame, hitFrame(circ.row), hitFrame(circ.row) + 14));
  const lab = (i: number) => precise(seg(frame, labelsAt + i * 2, labelsAt + i * 2 + 6));
  return (
    <AbsoluteFill style={{background: page}}>
      <Svg>
        <g transform={`translate(${fx(cx)},${fx(cy)}) scale(${fx(S * lerp(0.94, 1, enter))}) rotate(${fx(-90 * rotE)})`} opacity={enter}>
          <rect x={-PW / 2 + 10} y={-PH / 2 + 16} width={PW} height={PH} fill="#000" opacity={0.1} />
          <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} fill={paper} />
          <text x={-PW / 2 + 30} y={-PH / 2 + 56} fontFamily={fArch} fontWeight={800} fontSize={30} letterSpacing={3} fill={ink}>
            {title}
          </text>
          <text x={-PW / 2 + 30} y={PH / 2 - 28} fontFamily={fMono} fontWeight={500} fontSize={15} letterSpacing={1.5} fill={ink} opacity={0.7}>
            {caption}
          </text>
          <g stroke={ink} strokeWidth={1.1} opacity={0.4}>
            {gridLines}
          </g>
          {notes.filter((n) => n.voice === 'second').map((n, i) => bar(n, i))}
          {notes.filter((n) => n.voice === 'main').map((n, i) => bar(n, i))}
          {circOn > 0 && (
            <g>
              <circle cx={circX} cy={circY} r={(cw / 2 - 3) * circOn} fill={signal} />
              {ringP > 0 && ringP < 1 && <circle cx={circX} cy={circY} r={cw / 2 + 70 * ringP} fill="none" stroke={signal} strokeWidth={6 * (1 - ringP)} />}
            </g>
          )}
          {/* labels stay upright in the final orientation */}
          {labelsOn &&
            Array.from({length: cols}, (_, c) => {
              const o = lab(c);
              return (
                <g key={'pl' + c} opacity={o} transform={`translate(${fx(x0 + (c + 0.5) * cw)},${fx(y0 - 14 - (1 - o) * 10)}) rotate(90)`}>
                  <text textAnchor="end" y={6} fontFamily={fArch} fontWeight={700} fontSize={21} fill={ink}>
                    {pitchLabels[c] ?? ''}
                  </text>
                </g>
              );
            })}
          {labelsOn &&
            Array.from({length: rows}, (_, r) => {
              const o = lab(r * 0.5);
              return (
                <g key={'sl' + r} opacity={o} transform={`translate(${fx(x0 + gw + 14 + (1 - o) * 10)},${fx(y0 + (r + 0.5) * ch)}) rotate(90)`}>
                  <text textAnchor="middle" y={-2} fontFamily={fMono} fontWeight={500} fontSize={15} fill={ink} opacity={0.75}>
                    {String(r + 1).padStart(2, '0')}
                  </text>
                </g>
              );
            })}
          {playK > 0 && <rect x={x0 - 16} y={playY - 1.5} width={gw + 32} height={3} fill={signal} />}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

const mainNotes: [number, number, number][] = [
  [0, 0, 2],
  [1, 2, 2],
  [2, 4, 2],
  [3, 6, 2],
  [4, 8, 3],
  [5, 11, 2],
  [6, 13, 3],
];
const secondNotes: [number, number, number][] = [
  [2, 0, 3],
  [3, 3, 3],
  [4, 5, 3],
  [5, 8, 3],
  [6, 10, 3],
  [1, 13, 3],
];

export const gridScore = defineMotion<Props>({
  id: 'grid-score',
  title: 'Grid score (poster is the score)',
  category: 'data',
  description:
    'A Swiss poster whose modular grid draws on column by column, black note bars step down a diagonal over lighter second-voice bars; the whole sheet rotates 90 degrees, pitch labels and step numbers wipe in and a red playhead sweeps, turning each bar red on the frame it is played and pulsing a ring on the red circle.',
  source: ['lemo-opuscar styles/swiss-motion demo/film.js (buildUnits, drawUnits, gridState, drawScoreLabels) + DEMO.md (MIT / CC BY 4.0, LemoLab)'],
  useFor: 'Music or audio brand films, event posters, timetables, "your data is the design" reveals, spec sheets; a data-driven Swiss poster instead of a generic bar chart.',
  durationInFrames: 300,
  defaultProps: {
    cols: 7,
    rows: 16,
    notes: [...mainNotes.map(([col, row, len]) => ({col, row, len, voice: 'main' as const})), ...secondNotes.map(([col, row, len]) => ({col, row, len, voice: 'second' as const}))],
    pitchLabels: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    circle: {col: 3, row: 14},
    title: 'SCORE N.7',
    caption: '7 PITCHES / 16 STEPS / 2 VOICES',
    gridStart: 6,
    barsStart: 34,
    rotateAt: 100,
    rotateFrames: 28,
    labelsAt: 140,
    playFrom: 176,
    playFrames: 112,
    page: '#e6e3dc',
    paper: '#fbfaf6',
    ink: '#111111',
    second: '#cfcdc6',
    signal: '#e5322d',
  },
  propDocs: {
    cols: 'grid columns (pitches or categories)',
    rows: 'grid rows (time steps)',
    notes: 'bars: col, row, len, voice main|second (main bars turn red when played)',
    pitchLabels: 'label per column, shown after the rotation',
    circle: 'cell of the red circle that pulses when hit',
    title: 'tracked heading on the poster',
    caption: 'mono caption at the foot of the poster',
    gridStart: 'frame the grid starts drawing',
    barsStart: 'frame the first bars land',
    rotateAt: 'frame the 90 degree rotation starts',
    rotateFrames: 'rotation length in frames',
    labelsAt: 'frame the labels start to wipe in',
    playFrom: 'frame the playhead starts',
    playFrames: 'frames the playhead takes to sweep all rows',
    page: 'page colour',
    paper: 'poster colour',
    ink: 'bar and text colour',
    second: 'second-voice bar colour',
    signal: 'playhead, played bars and circle colour',
  },
  component: GridScore,
  tags: ['swiss', 'poster', 'score', 'music', 'piano roll', 'timeline', 'schedule', 'grid', 'playhead', 'timetable', 'data art', 'rotate', 'bars'],
});
