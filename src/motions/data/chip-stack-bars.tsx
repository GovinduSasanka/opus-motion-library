// Adapted from mg-styles-15/demos/19-paperclip/index.html (CATS / chart section) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {cl} from '../../core/r2-mg1b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Row = {label: string; items: string[]; accent?: boolean};
type Props = {
  rows: Row[];
  title: string;
  subtitle: string;
  background: string;
  chipColor: string;
  accentColor: string;
  startAt: number;
  rowGap: number;
  chipFrames: number;
};

const DEFAULT_ROWS: Row[] = [
  {label: 'STRUCTURE', items: ['Al', 'Fe', 'Ti', 'Mg', 'Cu', 'Zn', 'Ni', 'Cr', 'Mn', 'Sn', 'Pb', 'Co']},
  {label: 'POWER', items: ['Li', 'Co', 'Ni', 'Mn', 'Fe', 'P', 'C', 'Al', 'Cu']},
  {label: 'DISPLAY', accent: true, items: ['In', 'Sn', 'Ga', 'Y', 'Eu', 'Tb', 'Zn']},
  {label: 'SENSING', items: ['Si', 'Ge', 'Ga', 'As', 'B']},
  {label: 'CONNECT', items: ['Au', 'Ag', 'Pd']},
];

const ChipStackBars: React.FC<Props> = ({rows, title, subtitle, background, chipColor, accentColor, startAt, rowGap, chipFrames}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const M = Math.max(...rows.map((r) => r.items.length), 1);
  const availW = w * (portrait ? 0.86 : 0.78);
  const gap = 4 * u;
  const numW = 96 * u;
  const cols = portrait ? 8 : M;
  const chip = Math.min((portrait ? 104 : 76) * u, (availW - numW) / Math.min(M, cols) - gap);
  const lines = (n: number) => (portrait ? Math.max(1, Math.ceil(n / cols)) : 1);
  const rowH = chip + 64 * u;
  const rowTop = (ri: number) => rows.slice(0, ri).reduce((a, r) => a + rowH + (lines(r.items.length) - 1) * (chip + gap), 0);
  const blockH = rows.reduce((a, r) => a + rowH + (lines(r.items.length) - 1) * (chip + gap), 0);
  const x0 = (w - availW) / 2;
  const titleY = portrait ? h * 0.12 : h * 0.14;
  const y0 = Math.max(titleY + 120 * u, (h - blockH) / 2 + (portrait ? 40 * u : 60 * u));
  const intro = cl(frame / 12);
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <g opacity={intro}>
          <text x={x0} y={titleY} fontFamily={fonts.grotesk} fontWeight={700} fontSize={64 * u} fill={chipColor}>
            {title}
          </text>
          <text x={x0} y={titleY + 46 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={22 * u} letterSpacing={5 * u} fill="#7A8794">
            {subtitle}
          </text>
        </g>
        {rows.map((r, ri) => {
          const rowStart = startAt + ri * rowGap;
          const y = y0 + rowTop(ri);
          const labIn = prog(frame, rowStart - 4, rowStart + 8, ease.out);
          const visible = Math.min(r.items.length, Math.max(0, Math.floor((frame - rowStart) / chipFrames) + 1));
          const done = visible >= r.items.length;
          const fin = (rowStart + r.items.length * chipFrames);
          const col = r.accent ? accentColor : chipColor;
          return (
            <g key={ri}>
              <text x={x0} y={y + 14 * u} fontFamily={fonts.mono} fontWeight={700} fontSize={19 * u} letterSpacing={4 * u} fill={r.accent ? accentColor : '#7A8794'} opacity={labIn} transform={`translate(${(1 - labIn) * -14 * u} 0)`}>
                {r.label}
              </text>
              {r.items.map((it, k) => {
                const born = rowStart + k * chipFrames;
                if (frame < born) return null;
                const p = prog(frame, born, born + 6, ease.back);
                const wave = done && r.accent ? 1 + 0.05 * Math.sin((frame - fin) * 0.22 - k * 0.7) : 1;
                const kc = portrait ? k % cols : k;
                const kl = portrait ? Math.floor(k / cols) : 0;
                const cxk = x0 + kc * (chip + gap) + chip / 2;
                const cyk = y + 30 * u + kl * (chip + gap) + chip / 2;
                return (
                  <g key={k} transform={`translate(${cxk} ${cyk}) scale(${(0.55 + 0.45 * p) * wave}) translate(${-cxk} ${-cyk})`} opacity={cl(p * 2)}>
                    <rect x={cxk - chip / 2} y={cyk - chip / 2} width={chip} height={chip} rx={4 * u} fill={col} />
                    <text x={cxk} y={cyk + chip * 0.14} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={chip * 0.38} fill="#fff">
                      {it}
                    </text>
                  </g>
                );
              })}
              {visible > 0 && (
                <text
                  x={x0 + (portrait ? ((visible - 1) % cols) + 1 : visible) * (chip + gap) + 14 * u}
                  y={y + 30 * u + (portrait ? Math.floor((visible - 1) / cols) * (chip + gap) : 0) + chip * 0.74}
                  fontFamily={fonts.grotesk}
                  fontWeight={700}
                  fontSize={chip * 0.72}
                  fill={col}
                >
                  {visible}
                </text>
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const chipStackBars = defineMotion<Props>({
  id: 'chip-stack-bars',
  title: 'Chip stack bars',
  category: 'data',
  description:
    'Horizontal bars built from labelled unit chips, one chip per item: each row has a tiny tracked label above and a rolling count at the end, rows grow left to right chip by chip (about one chip per frame), and the highlighted row uses the accent colour with a gentle wave once complete.',
  source: ['mg-styles-15 demos/19-paperclip/index.html CATS / chart section (MIT)'],
  useFor: 'A unit-chart (isotype) alternative to bar charts for counts of things that have names: parts per system, features per tier, ingredients per category.',
  durationInFrames: 180,
  defaultProps: {
    rows: DEFAULT_ROWS,
    title: 'What goes inside',
    subtitle: 'ONE CHIP PER ITEM',
    background: '#EEF1F4',
    chipColor: '#25313D',
    accentColor: '#FF5A36',
    startAt: 16,
    rowGap: 12,
    chipFrames: 1.2,
  },
  propDocs: {
    rows: 'rows[{label, items: string[] (chip texts), accent?: true}]',
    title: 'headline',
    subtitle: 'small tracked line under the headline',
    background: 'page colour',
    chipColor: 'chip colour',
    accentColor: 'accent row colour',
    startAt: 'frame the first row starts',
    rowGap: 'frames between row starts',
    chipFrames: 'frames per chip (1 = one chip per frame)',
  },
  component: ChipStackBars,
  tags: ['unit chart', 'isotype', 'bars', 'chips', 'count', 'data', 'chart', 'stack', 'tiles', 'categories', 'infographic'],
});
