// Adapted from lemo-opuscar/styles/swiss-motion/demo/film.js (drawPosterText `cut`) + STYLE.md §5 (MIT / CC BY 4.0, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {fx, lf, precise, seg} from '../../core/r2-lb2b-kit';

/**
 * Swiss "deletion" grammar: a thin red rule shoots across a row (3 frames, linear), then the row collapses
 * vertically to its own midline and is gone; the rows below re-flow into the freed space nearest first and the
 * running total counts down. Works as a list-item removal, a "budget cut" or a feature strike.
 */
type Item = {label: string; amount: number};
type Props = {
  title: string;
  items: Item[];
  cuts: number[];
  cutAt: number[];
  currency: string;
  totalLabel: string;
  direction: 'ltr' | 'rtl';
  lineFrames: number;
  collapseFrames: number;
  background: string;
  ink: string;
  signal: string;
  muted: string;
};

const collapseEase = Easing.bezier(0.7, 0, 0.2, 1);

const KnifeCut: React.FC<Props> = ({title, items, cuts, cutAt, currency, totalLabel, direction, lineFrames, collapseFrames, background, ink, signal, muted}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const fSans = lf('archivo');
  const fMono = lf('plex');
  const panelW = portrait ? w * 0.88 : Math.min(w * 0.7, 1180 * u);
  const nRows = items.length + 1; // + total
  const rowH = Math.min(h * 0.1, 104 * u * (portrait ? 1.25 : 1));
  const fs = rowH * 0.42;
  const headH = rowH * 1.3;
  const blockH = headH + nRows * rowH;
  const x0 = cx - panelW / 2;
  const y0 = cy - blockH / 2;
  const E = (t: number) => collapseEase(Math.min(1, Math.max(0, t)));
  const cutList = cuts.map((idx, i) => ({idx, at: cutAt[i] ?? 40 + i * 38}));
  // reflow offset (px) for row j
  const offsetFor = (j: number) =>
    cutList.reduce((acc, c) => {
      if (j <= c.idx) return acc;
      const start = c.at + collapseFrames + 3 * (j - c.idx - 1);
      return acc - rowH * E(seg(frame, start, start + collapseFrames));
    }, 0);
  const removed = cutList.reduce((acc, c) => acc + (items[c.idx]?.amount ?? 0) * E(seg(frame, c.at + 3, c.at + 3 + 12)), 0);
  const total = items.reduce((a, b) => a + b.amount, 0) - removed;
  const fmt = (v: number) => `${currency}${Math.round(v).toLocaleString('en-US')}`;
  const rows = [...items.map((it) => ({label: it.label, value: fmt(it.amount), total: false})), {label: totalLabel, value: fmt(total), total: true}];
  const enter = (j: number) => precise(seg(frame, 2 + j * 3, 14 + j * 3));
  const titleIn = precise(seg(frame, 0, 12));
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <g opacity={titleIn} transform={`translate(0 ${fx((1 - titleIn) * 14 * u)})`}>
          <text x={x0} y={y0 + headH * 0.62} fontFamily={fSans} fontWeight={800} fontSize={fs * 1.3} fill={ink} letterSpacing={fs * 0.02}>
            {title}
          </text>
          <rect x={x0} y={y0 + headH - rowH * 0.12} width={panelW} height={3 * u} fill={ink} />
        </g>
        {rows.map((r, j) => {
          const cut = cutList.find((c) => c.idx === j);
          const ent = enter(j);
          const yTop = y0 + headH + j * rowH + offsetFor(j);
          const mid = yTop + rowH * 0.5;
          // collapse of the cut row around its own midline
          const cp = cut ? E(seg(frame, cut.at, cut.at + collapseFrames)) : 0;
          if (cut && cp >= 1) return null;
          const lineP = cut ? seg(frame, cut.at - lineFrames, cut.at) : 0;
          const lineShow = cut && frame >= cut.at - lineFrames && frame <= cut.at + collapseFrames;
          const lx0 = x0 - 10 * u;
          const lw = panelW + 20 * u;
          const baseline = yTop + rowH * 0.5 + fs * 0.35;
          const midY = baseline - 0.35 * fs;
          return (
            <g key={j} opacity={ent} transform={`translate(${fx((1 - ent) * -30 * u)},0)`}>
              <g transform={`translate(0,${fx(midY)}) scale(1,${fx(1 - cp)}) translate(0,${fx(-midY)})`}>
                <text x={x0} y={baseline} fontFamily={fSans} fontWeight={r.total ? 800 : 600} fontSize={fs} fill={ink}>
                  {r.label}
                </text>
                <text x={x0 + panelW} y={baseline} textAnchor="end" fontFamily={fMono} fontWeight={r.total ? 600 : 500} fontSize={fs * 0.95} fill={r.total ? signal : ink}>
                  {r.value}
                </text>
                <rect x={x0} y={yTop + rowH - 1.5 * u} width={panelW} height={(r.total ? 0 : 1.5) * u} fill={muted} opacity={0.5} />
                {r.total && <rect x={x0} y={yTop - 0.5 * u} width={panelW} height={3 * u} fill={ink} />}
              </g>
              {lineShow && lineP > 0 && (
                <rect x={direction === 'ltr' ? lx0 : lx0 + lw * (1 - lineP)} y={midY - 1 * u} width={lw * lineP} height={2 * u} fill={signal} />
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const knifeCut = defineMotion<Props>({
  id: 'knife-cut',
  title: 'Knife cut (strike a row out)',
  category: 'text',
  description:
    'A thin red rule shoots across a list row in three frames, then the row collapses vertically to its own midline and is gone; the rows below re-flow into the freed space nearest first and the running total counts down. Precise Swiss deletion.',
  source: ['lemo-opuscar styles/swiss-motion demo/film.js drawPosterText cut (MIT / CC BY 4.0, LemoLab)'],
  useFor: 'Removing text, bullets, prices or features with a precise non-fade beat: "budget cut", quote tidy-ups, feature trimming; pairs with kinetic captions.',
  durationInFrames: 130,
  defaultProps: {
    title: 'Quote',
    items: [
      {label: 'Setup fee', amount: 240},
      {label: 'Premium support', amount: 90},
      {label: 'Custom onboarding', amount: 150},
      {label: 'Annual audit', amount: 120},
      {label: 'Platform licence', amount: 400},
    ],
    cuts: [1, 3],
    cutAt: [40, 78],
    currency: '$',
    totalLabel: 'Total',
    direction: 'ltr',
    lineFrames: 3,
    collapseFrames: 6,
    background: '#ece8df',
    ink: '#111111',
    signal: '#e5322d',
    muted: '#8f8b82',
  },
  propDocs: {
    title: 'heading above the list',
    items: 'rows: label + numeric amount',
    cuts: 'indexes of the rows to strike out',
    cutAt: 'frame each cut line lands (one per cut)',
    currency: 'currency symbol for amounts',
    totalLabel: 'label of the running-total row',
    direction: "'ltr' or 'rtl' knife direction",
    lineFrames: 'frames the rule takes to cross',
    collapseFrames: 'frames the collapse takes',
    background: 'page colour',
    ink: 'text colour',
    signal: 'knife and total accent colour',
    muted: 'hairline colour',
  },
  component: KnifeCut,
  tags: ['delete', 'remove', 'strike', 'list', 'price', 'budget cut', 'swiss', 'guillotine', 'total', 'counter', 'typography', 'reflow'],
});
