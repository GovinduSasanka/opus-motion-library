import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgOf} from '../../core/r3-social';
import {estWidth} from '../../core/text-kit';
import {backOut, famOf, fitLine, hexLum, mixHex, slideFont, solidBg, withAlpha, wrapFit} from '../../core/r3-slide-kit';

/**
 * Keynote roadmap: quarters across the top, one swimlane per workstream; item bars slide in on their lane (finished = solid,
 * upcoming = tinted, in progress = tinted with a progress strip) while a "today" line sweeps to the current date.
 */
type RItem = {label: string; start: number; end: number};
type Lane = {name: string; color?: string; items: RItem[]};
type Props = {
  title: string;
  quarters: string[];
  lanes: Lane[];
  palette: string[];
  nowAt: number;
  nowLabel: string;
  background: string;
  cardColor: string;
  ink: string;
  accent: string;
  fontFamily: string;
  stagger: number;
  startAt: number;
};

const DEFAULT_LANES: Lane[] = [
  {
    name: 'Product',
    items: [
      {label: 'Onboarding revamp', start: 0, end: 1.4},
      {label: 'Analytics v2', start: 1.5, end: 3},
      {label: 'Public API', start: 3.05, end: 4},
    ],
  },
  {
    name: 'Growth',
    items: [
      {label: 'Referral program', start: 0.2, end: 1.25},
      {label: 'Pricing tests', start: 1.3, end: 2.5},
      {label: 'Partner launch', start: 2.6, end: 3.85},
    ],
  },
  {
    name: 'Platform',
    items: [
      {label: 'Infrastructure migration', start: 0, end: 2},
      {label: 'Security audit', start: 2.1, end: 2.95},
      {label: 'Scale to 10x', start: 3, end: 4},
    ],
  },
];

const RoadmapSwimlanes: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = slideFont(p.fontFamily, 'grotesk');
  const sans = famOf('sans');
  const bg = solidBg(p.background, '#ffffff');
  const quarters = (Array.isArray(p.quarters) && p.quarters.length ? p.quarters : ['Q1', 'Q2', 'Q3', 'Q4']).map(String).slice(0, 8);
  const nq = quarters.length;
  const lanes = (Array.isArray(p.lanes) && p.lanes.length ? p.lanes : DEFAULT_LANES).slice(0, 6);
  const palette = Array.isArray(p.palette) && p.palette.length ? p.palette : [p.accent];
  const m = (portrait ? 56 : 96) * u;

  const labelW = portrait ? 0 : 200 * u;
  const gx = m + labelW;
  const gw = w - m - gx;
  const qW = gw / nq;
  const headY = (portrait ? 290 : 215) * u;
  const headH = 56 * u;
  const lanesTop = headY + headH + 14 * u;
  const lanesBottom = h - (portrait ? 90 : 64) * u;
  const laneGap = 14 * u;

  // sub-row packing per lane
  const packed = lanes.map((ln) => {
    const items = [...(ln.items || [])].map((it) => ({...it, start: clamp(it.start, 0, nq), end: clamp(Math.max(it.end, it.start + 0.25), 0, nq)})).sort((a, b) => a.start - b.start);
    const rowEnds: number[] = [];
    const placed = items.map((it) => {
      let r = rowEnds.findIndex((e) => e <= it.start + 0.01);
      if (r < 0) {
        r = rowEnds.length;
        rowEnds.push(0);
      }
      rowEnds[r] = it.end;
      return {...it, row: r};
    });
    return {ln, placed, rows: Math.max(1, rowEnds.length)};
  });
  const totalRows = packed.reduce((a, b) => a + b.rows, 0);
  const nameH = portrait ? 46 * u : 0;
  const availH = lanesBottom - lanesTop - laneGap * (lanes.length - 1);
  const perRow = (availH - nameH * lanes.length) / totalRows;
  const itemH = Math.min((portrait ? 200 : 120) * u, perRow - 16 * u);
  const rowStep = Math.min(perRow, itemH + (portrait ? 130 : 76) * u);

  let yCursor = lanesTop;
  const laneBoxes = packed.map((pl) => {
    const bh = pl.rows * rowStep + nameH;
    const box = {y: yCursor, h: bh};
    yCursor += bh + laneGap;
    return box;
  });

  const lanesEnd = yCursor - laneGap + 14 * u;

  // global order of items for stagger
  const order: Record<string, number> = {};
  packed
    .flatMap((pl, li) => pl.placed.map((it, ii) => ({li, ii, s: it.start})))
    .sort((a, b) => a.s - b.s || a.li - b.li)
    .forEach((o, k) => (order[`${o.li}-${o.ii}`] = k));

  const titleIn = prog(f, 0, 22, ease.out);
  const titleSize = fitLine(p.title, font, (portrait ? 84 : 76) * u, w - 2 * m);
  const nowQ = clamp(p.nowAt, 0, nq);
  const sweep = prog(f, 26, 100, ease.inOut);
  const nowX = gx + qW * nowQ * sweep;
  const st = Math.max(1, p.stagger);

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        <g opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * 22 * u})`}>
          <text x={m} y={(portrait ? 150 : 128) * u} fontFamily={famOf(font)} fontWeight={700} fontSize={titleSize} fill={p.ink}>
            {p.title}
          </text>
          <rect x={m} y={(portrait ? 150 : 128) * u + 30 * u} width={96 * u * titleIn} height={7 * u} rx={3.5 * u} fill={p.accent} />
        </g>

        {/* quarter columns */}
        {quarters.map((q, i) => {
          const a = prog(f, 6 + i * 4, 26 + i * 4, ease.out);
          return (
            <g key={i} opacity={a}>
              <rect x={gx + i * qW + 3 * u} y={headY} width={qW - 6 * u} height={headH} rx={14 * u} fill={withAlpha(p.ink, i % 2 ? 0.07 : 0.1)} />
              <text x={gx + i * qW + qW / 2} y={headY + headH * 0.66} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={fitLine(q, 'sans', 28 * u, qW - 20 * u, 0.06)} letterSpacing={0.06 * 28 * u} fill={withAlpha(p.ink, 0.8)}>
                {q}
              </text>
              <line x1={gx + i * qW} x2={gx + i * qW} y1={headY + headH + 6 * u} y2={(headY + headH + 6 * u) + (lanesEnd - headY - headH - 6 * u) * prog(f, 10 + i * 4, 50 + i * 4, ease.out)} stroke={withAlpha(p.ink, 0.12)} strokeWidth={2 * u} strokeDasharray={`${6 * u} ${8 * u}`} />
            </g>
          );
        })}

        {/* lanes */}
        {packed.map((pl, li) => {
          const col = pl.ln.color || palette[li % palette.length];
          const box = laneBoxes[li];
          const la = prog(f, 12 + li * 6, 34 + li * 6, ease.out);
          const bandCol = p.cardColor === 'auto' ? withAlpha(p.ink, 0.045) : p.cardColor;
          return (
            <g key={li}>
              <g opacity={la}>
                <rect x={m} y={box.y} width={w - 2 * m} height={box.h} rx={22 * u} fill={bandCol} />
                <rect x={m} y={box.y + 14 * u} width={7 * u} height={box.h - 28 * u} rx={3.5 * u} fill={col} />
                {portrait ? (
                  <text x={m + 28 * u} y={box.y + 34 * u} fontFamily={sans} fontWeight={800} fontSize={26 * u} letterSpacing={3 * u} fill={col}>
                    {(pl.ln.name || '').toUpperCase()}
                  </text>
                ) : (
                  (() => {
                    const nb = wrapFit(pl.ln.name || '', 'sans', 32 * u, labelW - 44 * u, 110 * u, 1.15, 18 * u);
                    return nb.lines.map((ln, j) => (
                      <text key={j} x={m + 28 * u} y={box.y + box.h / 2 - ((nb.lines.length - 1) * nb.lineH) / 2 + j * nb.lineH + nb.size * 0.34} fontFamily={sans} fontWeight={800} fontSize={nb.size} fill={p.ink}>
                        {ln}
                      </text>
                    ));
                  })()
                )}
              </g>
              {pl.placed.map((it, ii) => {
                const k = order[`${li}-${ii}`] ?? 0;
                const s0 = 30 + k * st;
                const a = prog(f, s0, s0 + 22, ease.out);
                const pop = backOut(prog(f, s0, s0 + 22, ease.linear), 1.2);
                const x = gx + it.start * qW + 4 * u;
                const bw = (it.end - it.start) * qW - 8 * u;
                const y = box.y + nameH + (rowStep - itemH) / 2 + it.row * rowStep;
                const done = it.end <= nowQ + 1e-6;
                const doing = !done && it.start < nowQ;
                const solid = done;
                const fill = solid ? col : mixHex(bg, col, 0.22);
                const txt = solid ? (hexLum(col) > 0.55 ? '#10131A' : '#FFFFFF') : p.ink;
                const prgW = doing ? clamp((nowQ - it.start) / (it.end - it.start)) * bw * sweep : 0;
                const size0 = Math.min(itemH * 0.36, 30 * u);
                const showCheck = done && bw > 300 * u;
                const avail = (bw - 34 * u - (showCheck ? itemH * 0.55 : 0)) * 0.92;
                const lb = wrapFit(it.label || '', 'sans', size0, avail, itemH - (doing ? 32 : 20) * u, 1.14, 15 * u);
                const blockH = lb.lines.length * lb.lineH;
                const ty0 = y + (itemH - (doing ? 12 * u : 0) - blockH) / 2;
                return (
                  <g key={ii} opacity={a} transform={`translate(${(1 - pop) * -70 * u} 0)`}>
                    <rect x={x} y={y} width={bw} height={itemH} rx={16 * u} fill={fill} stroke={solid ? 'none' : col} strokeWidth={2.5 * u} />
                    {doing && <rect x={x + 10 * u} y={y + itemH - 14 * u} width={Math.max(0, prgW - 20 * u)} height={6 * u} rx={3 * u} fill={col} />}
                    {lb.lines.map((ln, j) => (
                      <text key={j} x={x + 20 * u} y={ty0 + j * lb.lineH + lb.size * 0.88} fontFamily={sans} fontWeight={700} fontSize={lb.size} fill={txt}>
                        {ln}
                      </text>
                    ))}
                    {showCheck && (
                      <path d={`M${x + bw - itemH * 0.62} ${y + itemH * 0.52} l${itemH * 0.14} ${itemH * 0.14} l${itemH * 0.26} ${-itemH * 0.28}`} fill="none" stroke={txt} strokeWidth={4 * u} strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* now line */}
        <g opacity={prog(f, 24, 40, ease.out)}>
          <line x1={nowX} x2={nowX} y1={headY - 6 * u} y2={lanesEnd + 8 * u} stroke={p.accent} strokeWidth={4 * u} />
          <g transform={`translate(${nowX} ${headY - 6 * u})`}>
            <rect x={-(estWidth(p.nowLabel, 24 * u, 'sans', 0.05) + 36 * u) / 2} y={-44 * u} width={estWidth(p.nowLabel, 24 * u, 'sans', 0.05) + 36 * u} height={40 * u} rx={20 * u} fill={p.accent} />
            <text x={0} y={-16 * u} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={22 * u} letterSpacing={0.05 * 22 * u} fill={hexLum(p.accent) > 0.55 ? '#10131A' : '#FFFFFF'}>
              {p.nowLabel}
            </text>
          </g>
          <circle cx={nowX} cy={lanesEnd + 8 * u} r={(7 + 3 * Math.sin(f / 5) * (sweep >= 1 ? 1 : 0)) * u} fill={p.accent} />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const roadmapSwimlanes = defineMotion<Props>({
  id: 'roadmap-swimlanes',
  title: 'Roadmap swimlanes',
  category: 'ui',
  description: 'Keynote roadmap: quarter columns across the top, one swimlane per workstream; item bars slide in on their lane (done solid, upcoming tinted, in progress with a progress strip) while a "today" line sweeps to the current date.',
  source: ['original (round 3, presentation slides)'],
  useFor: 'Product and project roadmaps, release plans, quarterly OKR timelines, programme schedules and "what ships when" slides for decks, videos and status pages.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Product roadmap',
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    lanes: DEFAULT_LANES,
    palette: ['#5B9DFF', '#F5A524', '#34C79A', '#C77DFF', '#FF6B8B', '#7FD1E8'],
    nowAt: 1.6,
    nowLabel: 'TODAY',
    background: '#0F1624',
    cardColor: 'auto',
    ink: '#EEF2F8',
    accent: '#FF5C7A',
    fontFamily: 'grotesk',
    stagger: 4,
    startAt: 0,
  },
  propDocs: {
    title: 'slide title',
    quarters: 'column headings across the top (2-8 strings, e.g. quarters, months, sprints)',
    lanes: 'array of {name, color?, items:[{label, start, end}]} — start/end are in column units (0 = left edge, 4 = right edge of 4 columns); up to 6 lanes',
    palette: 'lane colours used when a lane has no colour of its own',
    nowAt: 'position of the "today" line in column units (items ending before it are shown done)',
    nowLabel: 'text on the today marker',
    background: 'frame colour, or "transparent" to overlay content',
    cardColor: 'lane band fill, or "auto"',
    ink: 'text colour',
    accent: 'today line and title underline colour',
    fontFamily: 'title font: sans | serif | display | grotesk | rounded | instrument | mono',
    stagger: 'frames between bars sliding in',
    startAt: 'frame the slide begins',
  },
  component: RoadmapSwimlanes,
  tags: ['slide', 'keynote', 'presentation', 'roadmap', 'timeline', 'swimlanes', 'gantt', 'quarters', 'plan', 'schedule', 'milestones', 'deck'],
});
