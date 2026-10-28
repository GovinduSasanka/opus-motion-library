// Adapted from lemo-opuscar/styles/iso-infographic (engine.js ICON.*, iconGrid; DEMO.md "Isotype numbers") (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, cl, eo3, ISO, lf, seg} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type IconKind = 'person' | 'drop' | 'house' | 'cup' | 'box' | 'tree';
type Props = {
  title: string;
  count: number;
  highlight: number;
  unitValue: number;
  unitLabel: string;
  highlightLabel: string;
  icon: IconKind;
  arrangement: 'grid' | 'bar' | 'row' | 'heart';
  bpm: number;
  start: number;
  color: string;
  accent: string;
  background: string;
  ink: string;
};

// icons drawn in a 1×1 box (origin top-left)
const ICONS: Record<IconKind, string> = {
  person: 'M.5 .04a.15 .15 0 1 1 0 .3a.15 .15 0 1 1 0-.3ZM.26 .4H.74a.08 .08 0 0 1 .08 .08V.7H.68V.98H.32V.7H.18V.48a.08 .08 0 0 1 .08-.08Z',
  drop: 'M.5 .02C.62 .25 .84 .45 .84 .66A.34 .34 0 0 1 .16 .66C.16 .45 .38 .25 .5 .02Z',
  house: 'M.5 .06L.96 .46H.84V.96H.16V.46H.04ZM.42 .96V.66H.58V.96Z',
  cup: 'M.12 .22H.78V.6A.3 .3 0 0 1 .48 .9H.42A.3 .3 0 0 1 .12 .6ZM.78 .3H.86A.12 .12 0 0 1 .86 .54H.78Z',
  box: 'M.5 .06L.94 .28V.74L.5 .96L.06 .74V.28ZM.5 .5L.94 .28M.5 .5L.06 .28M.5 .5V.96',
  tree: 'M.5 .02L.86 .52H.66L.9 .8H.56V.98H.44V.8H.1L.34 .52H.14Z',
};

const IsotypeCount: React.FC<Props> = ({title, count, highlight, unitValue, unitLabel, highlightLabel, icon, arrangement, bpm, start, color, accent, background, ink}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const N = Math.max(1, Math.min(400, Math.round(count)));
  const sixteenth = (60 / bpm) * 30 / 4;

  // accumulation accelerates: quarter -> eighth -> sixteenth -> waves
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < N; i++) {
    times.push(t);
    const step = i < 2 ? sixteenth * 4 : i < 5 ? sixteenth * 2 : i < 12 ? sixteenth : Math.max(0.6, sixteenth / (1 + (i - 12) / 5));
    t += step;
  }
  const tDone = t;

  // ---- layout region
  const area = portrait ? {x: 0.08 * w, y: 0.3 * h, w: 0.84 * w, h: 0.42 * h} : {x: 0.38 * w, y: 0.16 * h, w: 0.56 * w, h: 0.68 * h};
  type Cell = {x: number; y: number; s: number};
  const cells: Cell[] = [];
  if (arrangement === 'heart') {
    // sample a heart silhouette on a lattice, sorted by y (bottom up looks like filling)
    const pts: [number, number][] = [];
    for (let res = 6; res < 60 && pts.length < N; res++) {
      pts.length = 0;
      for (let gy = 0; gy < res; gy++)
        for (let gx = 0; gx < res; gx++) {
          const x = (gx + 0.5) / res * 2.4 - 1.2;
          const y = 1.25 - (gy + 0.5) / res * 2.5;
          const q = (x * x + y * y - 1) ** 3 - x * x * y * y * y;
          if (q <= 0) pts.push([gx / res, gy / res]);
        }
      if (pts.length >= N) {
        const s = Math.min(area.w, area.h) / res;
        pts.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
        const ox = area.x + (area.w - s * res) / 2;
        const oy = area.y + (area.h - s * res) / 2;
        pts.slice(0, N).forEach(([px, py]) => cells.push({x: ox + px * res * s, y: oy + py * res * s, s: s * 0.86}));
        break;
      }
    }
  } else {
    const cols = arrangement === 'row' ? N : arrangement === 'bar' ? Math.ceil(N / 2) : Math.ceil(Math.sqrt((N * area.w) / area.h));
    const rows = Math.ceil(N / cols);
    const s = Math.min(area.w / cols, area.h / rows, 160 * u);
    const ox = area.x + (area.w - cols * s) / 2;
    const oy = area.y + (area.h - rows * s) / 2;
    for (let i = 0; i < N; i++) cells.push({x: ox + (i % cols) * s, y: oy + Math.floor(i / cols) * s, s: s * 0.84});
  }

  const shown = times.filter((x) => frame >= x).length;
  const value = Math.min(N, shown) * unitValue;
  const fmt = (v: number) => Math.round(v).toLocaleString('en-US');
  const hiDone = seg(frame, tDone + 6, tDone + 16);

  const numFs = (portrait ? 150 : 170) * u;
  const headX = portrait ? 0.08 * w : 0.06 * w;
  const headY = portrait ? 0.07 * h : 0.2 * h;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <path id="itc-icon" d={ICONS[icon] ?? ICONS.person} />
        </defs>
        {cells.map((c, i) => {
          const lt = frame - times[i];
          if (lt < 0) return null;
          const k = backOut(cl(lt / 6), 2.2);
          const isHi = i < highlight;
          const fill = isHi ? accent : color;
          const pulse = isHi && hiDone > 0 ? 1 + 0.12 * Math.sin(hiDone * Math.PI) : 1;
          const cx = c.x + c.s / 2;
          const cy = c.y + c.s / 2;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${c.s * k * pulse}) translate(-.5 -.5)`}>
              <use href="#itc-icon" fill={icon === 'box' ? 'none' : fill} stroke={icon === 'box' ? fill : 'none'} strokeWidth={icon === 'box' ? 0.08 : 0} strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
      {/* number + legend */}
      <div style={{position: 'absolute', left: headX, top: headY, maxWidth: portrait ? 0.84 * w : 0.3 * w}}>
        <div style={{fontFamily: lf.jost, fontWeight: 600, fontSize: 30 * u, letterSpacing: 4 * u, color: ink, opacity: eo3(seg(frame, 2, 12))}}>{title.toUpperCase()}</div>
        <div style={{fontFamily: lf.jost, fontWeight: 400, fontSize: numFs, lineHeight: 1, color: ink, fontVariantNumeric: 'tabular-nums', marginTop: 10 * u, whiteSpace: 'nowrap'}}>{fmt(value)}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12 * u, marginTop: 18 * u, opacity: eo3(seg(frame, start, start + 10))}}>
          <svg width={34 * u} height={34 * u} viewBox="0 0 1 1">
            <path d={ICONS[icon] ?? ICONS.person} fill={icon === 'box' ? 'none' : color} stroke={icon === 'box' ? color : 'none'} strokeWidth={0.08} />
          </svg>
          <span style={{fontFamily: lf.jost, fontWeight: 500, fontSize: 28 * u, color: ink}}>= {fmt(unitValue)} {unitLabel}</span>
        </div>
        {highlight > 0 && (
          <div style={{display: 'flex', alignItems: 'center', gap: 12 * u, marginTop: 10 * u, opacity: hiDone}}>
            <svg width={34 * u} height={34 * u} viewBox="0 0 1 1">
              <path d={ICONS[icon] ?? ICONS.person} fill={accent} />
            </svg>
            <span style={{fontFamily: lf.jost, fontWeight: 600, fontSize: 28 * u, color: accent}}>
              {fmt(highlight * unitValue)} {highlightLabel}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const isotypeCount = defineMotion<Props>({
  id: 'isotype-count',
  title: 'Isotype count',
  category: 'data',
  description:
    'Isotype statistic: identical flat icons pop in with a back-ease overshoot into a grid, bar, row or heart silhouette, accelerating from quarter notes to 16ths while a big count-up number runs in sync; a highlighted subset turns accent and a legend reads "icon = N".',
  source: ['lemo-opuscar styles/iso-infographic (MIT, LemoLab) — engine.js ICON/iconGrid, DEMO.md Isotype numbers'],
  useFor: 'Stats that feel physical — users, litres, votes, homes — for explainers, reports and pitch decks.',
  durationInFrames: 180,
  defaultProps: {
    title: 'People served each day',
    count: 60,
    highlight: 15,
    unitValue: 1000,
    unitLabel: 'people',
    highlightLabel: 'first-time visitors',
    icon: 'person',
    arrangement: 'grid',
    bpm: 100,
    start: 14,
    color: ISO.sea[1],
    accent: ISO.subject[0],
    background: ISO.ground,
    ink: ISO.ink,
  },
  propDocs: {
    title: 'caps line above the number',
    count: 'number of icons (≤ 400)',
    highlight: 'how many icons (from the first) turn the accent colour',
    unitValue: 'value of one icon (count-up = icons × this)',
    unitLabel: 'legend unit ("1 icon = N unitLabel")',
    highlightLabel: 'legend label for the highlighted subset',
    icon: "'person' | 'drop' | 'house' | 'cup' | 'box' | 'tree'",
    arrangement: "'grid' | 'bar' | 'row' | 'heart' (silhouette)",
    bpm: 'beat grid for the pops (accelerates to 16ths and waves)',
    start: 'frame of the first pop',
    color: 'icon colour',
    accent: 'highlight colour',
    background: 'ground colour',
    ink: 'text colour',
  },
  component: IsotypeCount,
  tags: ['isotype', 'icons', 'pictogram', 'count', 'statistic', 'infographic', 'data', 'people', 'grid', 'count-up', 'number', 'pop', 'explainer', 'pitch deck'],
});
