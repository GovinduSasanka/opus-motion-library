// Adapted from lemo-opuscar/styles/swiss-motion/demo/film.js (circleState, flight, drawCircle, gridState) + DEMO.md arc (MIT / CC BY 4.0, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {eo3, fx, lerp, lf, precise, seg} from '../../core/r2-lb2b-kit';

/**
 * A Swiss grid where everything moves in exact eased snaps — except one red circle: it twitches a quarter column
 * and snaps back (hesitation), then breaks out, the only linear, unsnapped move in the film, grows as it travels,
 * pauses an eighth mid-flight, and lands off the grid while a mono readout flips from "on grid" to red "off grid".
 * The other elements re-flow around it nearest-first and the grid lines extend past the poster to fill the frame.
 */
type Item = {id: string; col: number; row: number; w: number; h: number; kind: 'block' | 'bar' | 'ring' | 'text'; text?: string};
type Props = {
  cols: number;
  rows: number;
  items: Item[];
  exceptionFrom: number[];
  exceptionTo: number[];
  endDiameter: number;
  reflowTo: Record<string, number[]>;
  hesitateAt: number;
  breakAt: number;
  pauseFrames: number;
  flightFrames: number;
  reflowFrom: number;
  page: string;
  paper: string;
  ink: string;
  muted: string;
  signal: string;
};

const GridException: React.FC<Props> = ({cols, rows, items, exceptionFrom, exceptionTo, endDiameter, reflowTo, hesitateAt, breakAt, pauseFrames, flightFrames, reflowFrom, page, paper, ink, muted, signal}) => {
  const frame = useCurrentFrame();
  const {w, h, cx, cy, u} = useStage();
  const fArch = lf('archivo');
  const fMono = lf('plex');
  const cs = Math.min((h * 0.88) / (rows + 1.2), (w * 0.94) / (cols + 1));
  const sw = cs * (cols + 1);
  const sh = cs * (rows + 1.2);
  const gx0 = cx - (cols * cs) / 2;
  const gy0 = cy - (rows * cs) / 2;
  const P = (c: number, r: number): [number, number] => [gx0 + c * cs, gy0 + r * cs];
  // landing-order rank for reflow (nearest to the landing point first)
  const land = exceptionTo;
  const ranked = Object.keys(reflowTo)
    .map((id) => {
      const it = items.find((i) => i.id === id)!;
      return {id, d: it ? Math.hypot(it.col + it.w / 2 - land[0], it.row + it.h / 2 - land[1]) : 0};
    })
    .sort((a, b) => a.d - b.d);
  const rank = (id: string) => Math.max(0, ranked.findIndex((r) => r.id === id));
  // exception position along its path
  const hes = 0.25 * precise(seg(frame, hesitateAt, hesitateAt + 4)) * (1 - precise(seg(frame, hesitateAt + 11, hesitateAt + 15)));
  const f1 = breakAt + flightFrames * 0.4;
  const f2 = f1 + pauseFrames;
  const f3 = f2 + flightFrames * 0.6;
  const along = frame < breakAt ? 0 : frame < f1 ? 0.4 * seg(frame, breakAt, f1) : frame < f2 ? 0.4 : 0.4 + 0.6 * seg(frame, f2, f3);
  const exC = lerp(exceptionFrom[0], exceptionTo[0], along) + hes;
  const exR = lerp(exceptionFrom[1], exceptionTo[1], along);
  const dCells = lerp(1, endDiameter, along);
  const [ex, ey] = P(exC + 0.5, exR + 0.5);
  const exEnter = precise(seg(frame, 10, 20));
  const onGrid = Math.abs(exC - Math.round(exC)) < 1e-6 && Math.abs(exR - Math.round(exR)) < 1e-6;
  const rd = (v: number) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2);
  const readout = `col ${rd(exC)} row ${rd(exR)} · ${onGrid ? 'on grid' : 'off grid'}`;
  const rfs = Math.max(16 * u, cs * 0.24);
  const ext = eo3(seg(frame, f3, f3 + 18));
  // grid lines
  const lines: React.ReactNode[] = [];
  for (let c = 0; c <= cols; c++) lines.push(<line key={'v' + c} x1={gx0 + c * cs} y1={gy0} x2={gx0 + c * cs} y2={gy0 + rows * cs} />);
  for (let r = 0; r <= rows; r++) lines.push(<line key={'h' + r} x1={gx0} y1={gy0 + r * cs} x2={gx0 + cols * cs} y2={gy0 + r * cs} />);
  const extLines: React.ReactNode[] = [];
  if (ext > 0) {
    const nL = Math.ceil(w / cs / 2) + 2;
    const nT = Math.ceil(h / cs / 2) + 2;
    for (let c = -nL; c <= cols + nL; c++) extLines.push(<line key={'ev' + c} x1={gx0 + c * cs} y1={0} x2={gx0 + c * cs} y2={h} />);
    for (let r = -nT; r <= rows + nT; r++) extLines.push(<line key={'eh' + r} x1={0} y1={gy0 + r * cs} x2={w} y2={gy0 + r * cs} />);
  }
  const vacated = frame >= breakAt + 2;
  const traceP = seg(frame, breakAt, f3);
  const [vx, vy] = P(exceptionFrom[0] + 0.5, exceptionFrom[1] + 0.5);
  const itemEls = items.map((it, i) => {
    // entrance: slides in one cell from the left with a precise snap
    const e = precise(seg(frame, 4 + i * 4, 16 + i * 4));
    let c = it.col;
    let r = it.row;
    const to = reflowTo[it.id];
    if (to) {
      const st = reflowFrom + Math.floor(rank(it.id) / 2) * 4;
      const k = precise(seg(frame, st, st + 10));
      c = lerp(it.col, to[0], k);
      r = lerp(it.row, to[1], k);
    }
    const [px, py] = P(c - (1 - e) * 1.2, r);
    const pw = it.w * cs;
    const ph = it.h * cs;
    const pad = cs * 0.08;
    let body: React.ReactNode = null;
    if (it.kind === 'block') body = <rect x={px + pad} y={py + pad} width={pw - 2 * pad} height={ph - 2 * pad} fill={ink} />;
    if (it.kind === 'bar') body = <rect x={px + pad} y={py + ph / 2 - cs * 0.07} width={pw - 2 * pad} height={cs * 0.14} fill={muted} />;
    if (it.kind === 'ring') body = <circle cx={px + pw / 2} cy={py + ph / 2} r={Math.min(pw, ph) / 2 - pad} fill="none" stroke={ink} strokeWidth={cs * 0.07} />;
    if (it.kind === 'text')
      body = (
        <text x={px + pad} y={py + ph / 2 + cs * 0.17} fontFamily={fArch} fontWeight={800} fontSize={cs * 0.4} letterSpacing={cs * 0.01} fill={ink}>
          {it.text}
        </text>
      );
    return (
      <g key={it.id} opacity={e}>
        {body}
      </g>
    );
  });
  // the readout sits on the free side of the circle
  const side = exC > cols / 2 ? -1 : 1;
  const rx = ex + side * -(dCells * cs * 0.5);
  const ry = ey + dCells * cs * 0.5 + rfs * 1.5;
  return (
    <AbsoluteFill style={{background: page}}>
      <Svg>
        <rect x={cx - sw / 2 + 8 * u} y={cy - sh / 2 + 12 * u} width={sw} height={sh} fill="#000" opacity={0.08} />
        <rect x={cx - sw / 2} y={cy - sh / 2} width={sw} height={sh} fill={paper} />
        <g stroke={muted} strokeWidth={1} opacity={0.5}>
          {lines}
        </g>
        <g stroke={muted} strokeWidth={1} opacity={0.32 * ext}>
          {extLines}
        </g>
        {itemEls}
        {/* vacated cell and trace */}
        {vacated && (
          <g>
            <rect x={vx - cs / 2} y={vy - cs / 2} width={cs} height={cs} fill="none" stroke={signal} strokeWidth={1.5} opacity={1 - seg(frame, f3, f3 + 14)} transform={`translate(${fx(vx)},${fx(vy)}) scale(${fx(1 - 0.0 * traceP)}) translate(${fx(-vx)},${fx(-vy)})`} />
            <line x1={vx} y1={vy} x2={lerp(vx, ex, 1)} y2={lerp(vy, ey, 1)} stroke={signal} strokeWidth={1.5} opacity={0.9 * (1 - seg(frame, f3 + 6, f3 + 22))} />
          </g>
        )}
        {exEnter > 0 && <circle cx={ex} cy={ey} r={dCells * cs * 0.5 * exEnter - cs * 0.06} fill={signal} />}
        {exEnter > 0.9 && (
          <text x={rx} y={ry} textAnchor={side > 0 ? 'start' : 'end'} fontFamily={fMono} fontWeight={500} fontSize={rfs} fill={onGrid ? ink : signal} stroke={paper} strokeWidth={rfs * 0.35} paintOrder="stroke">
            {readout}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const gridException = defineMotion<Props>({
  id: 'grid-exception',
  title: 'Grid exception (the one that breaks out)',
  category: 'data',
  description:
    'Swiss grid poster where everything moves in exact eased snaps and one red circle hesitates, then breaks out in the only linear move, growing and pausing mid-flight before landing off the grid; a mono readout flips from on grid to red off grid, the other elements re-flow nearest-first and the grid lines extend to fill the frame.',
  source: ['lemo-opuscar styles/swiss-motion demo/film.js (circleState, flight, drawCircle, gridState) + DEMO.md arc (MIT / CC BY 4.0, LemoLab)'],
  useFor: '"One product or person that breaks the mould" stories, the outlier in the data, launch films: a system plus one exception.',
  durationInFrames: 210,
  defaultProps: {
    cols: 6,
    rows: 8,
    items: [
      {id: 'a', col: 0, row: 0, w: 2, h: 2, kind: 'block'},
      {id: 'b', col: 2, row: 0, w: 3, h: 1, kind: 'bar'},
      {id: 'c', col: 0, row: 2, w: 3, h: 1, kind: 'text', text: 'One system.'},
      {id: 'd', col: 3, row: 2, w: 1, h: 1, kind: 'block'},
      {id: 'e', col: 4, row: 2, w: 2, h: 2, kind: 'ring'},
      {id: 'f', col: 0, row: 4, w: 4, h: 1, kind: 'bar'},
      {id: 'g', col: 4, row: 6, w: 2, h: 2, kind: 'block'},
      {id: 'h', col: 0, row: 6, w: 3, h: 1, kind: 'text', text: 'One exception.'},
    ],
    exceptionFrom: [5, 0],
    exceptionTo: [0.9, 3.1],
    endDiameter: 2.2,
    reflowTo: {c: [3, 1], f: [2, 5]},
    hesitateAt: 56,
    breakAt: 84,
    pauseFrames: 4,
    flightFrames: 36,
    reflowFrom: 122,
    page: '#e6e3dc',
    paper: '#fbfaf6',
    ink: '#111111',
    muted: '#bdb9ae',
    signal: '#e5322d',
  },
  propDocs: {
    cols: 'grid columns',
    rows: 'grid rows',
    items: 'grid elements: id, col, row, w, h (cells), kind block|bar|ring|text (+ text)',
    exceptionFrom: 'start cell [col,row] of the red circle',
    exceptionTo: 'landing position [col,row] — non-integer lands off grid',
    endDiameter: 'circle diameter in cells at landing',
    reflowTo: 'ids of elements that move out of the way: id -> [col,row]',
    hesitateAt: 'frame of the twitch',
    breakAt: 'frame the flight starts',
    pauseFrames: 'mid-flight pause in frames',
    flightFrames: 'moving frames of the whole flight',
    reflowFrom: 'frame the re-flow starts',
    page: 'page colour',
    paper: 'poster colour',
    ink: 'element colour',
    muted: 'grid line colour',
    signal: 'exception colour',
  },
  component: GridException,
  tags: ['swiss', 'grid', 'outlier', 'exception', 'breaks the rules', 'poster', 'circle', 'readout', 'coordinates', 'system', 'launch', 'reflow', 'minimal'],
});
