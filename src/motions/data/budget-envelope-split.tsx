import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, clip, fmt, itemColor, resolveFont, textOn, useChartBox} from '../../core/r3-chart-kit';
import {isClear, mixHex} from '../../core/r3-vertical-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Env = {label: string; amount: number; color?: string};
type Props = {
  title: string;
  subtitle: string;
  income: number;
  incomeLabel: string;
  leftLabel: string;
  envelopes: Env[];
  prefix: string;
  suffix: string;
  showPercent: boolean;
  colors: string[];
  background: string;
  panel: string;
  ink: string;
  accent: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const ENVS: Env[] = [
  {label: 'Rent', amount: 1500},
  {label: 'Bills', amount: 600},
  {label: 'Groceries', amount: 700},
  {label: 'Transport', amount: 300},
  {label: 'Savings', amount: 800},
  {label: 'Fun', amount: 300},
];

const bez = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const m = 1 - t;
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
};

const BudgetEnvelopeSplit: React.FC<Props> = ({title, subtitle, income, incomeLabel, leftLabel, envelopes, prefix, suffix, showPercent, colors, background, panel, ink, accent, fontFamily, startAt, speed}) => {
  const frame = useCurrentFrame();
  const {u, portrait, square} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const envs = envelopes.slice(0, 9).map((e, i) => ({...e, color: itemColor(e.color, colors, i)}));
  const n = Math.max(1, envs.length);
  const total = Math.max(1, envs.reduce((a, e) => a + Math.max(0, e.amount), 0));
  const inc = income > 0 ? income : total;
  const per = 11 / speed;

  // income bar
  const barH = (portrait ? 150 : 128) * u;
  const barW = Math.min(box.w, (portrait ? 920 : 820) * u);
  const barX = box.x + (box.w - barW) / 2;
  const barY = box.y;
  const barIn = prog(frame, startAt, startAt + 22 / speed);

  // envelope grid
  const cols = n <= 3 ? n : portrait || square ? 2 : n <= 4 ? 4 : n <= 6 ? 3 : n <= 8 ? 4 : 3;
  const rws = Math.ceil(n / cols);
  const gridTop = barY + barH + (portrait ? 150 : 110) * u;
  const gridH = box.y + box.h - gridTop;
  const cellW = box.w / cols;
  const cellH = gridH / rws;
  const ew = Math.min(cellW * 0.76, (cellH * 0.86) / (0.64 * 1.52), 320 * u);
  const eh = ew * 0.64;
  const vis = eh * 0.52; // part of the slip that sticks out above the envelope
  const slipH = vis + eh * 0.5;
  const lab = ew * 0.115;

  const t0 = (i: number) => startAt + 26 / speed + i * per;
  const assigned = envs.reduce((a, e, i) => a + Math.max(0, e.amount) * (inc / total) * prog(frame, t0(i) + 10, t0(i) + 34 / speed, ease.out), 0);
  const left = Math.max(0, inc - assigned);
  const bg = isClear(background) ? 'transparent' : background;
  const inkSoft = {fillOpacity: 0.6};

  const centers = envs.map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    return {x: box.x + ((cols - inRow) * cellW) / 2 + col * cellW + cellW / 2, y: gridTop + row * cellH + (cellH - (eh + vis)) / 2 + vis + eh / 2};
  });

  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} startAt={startAt} />
        {/* connectors + travelling coins */}
        {envs.map((e, i) => {
          const c = centers[i];
          const sx = barX + barW * (0.12 + 0.76 * (n === 1 ? 0.5 : i / (n - 1)));
          const sy = barY + barH;
          const ty = c.y - eh / 2 - vis - 8 * u;
          const dp = prog(frame, t0(i) - 4, t0(i) + 18 / speed, ease.inOut);
          const my = (sy + ty) / 2;
          const px = bez(sx, sx, c.x, c.x, dp);
          const py = bez(sy, my, my, ty, dp);
          const fade = 1 - prog(frame, t0(i) + 16 / speed, t0(i) + 26 / speed);
          return (
            <g key={i}>
              <path d={`M${sx},${sy} C${sx},${my} ${c.x},${my} ${c.x},${ty}`} fill="none" stroke={e.color} strokeOpacity={0.35 * clamp(dp * 4)} strokeWidth={3 * u} strokeDasharray={`${8 * u} ${9 * u}`} pathLength={1} />
              {dp > 0 && dp < 1 && (
                <g opacity={fade}>
                  <circle cx={px} cy={py} r={13 * u} fill={e.color} />
                  <circle cx={px} cy={py} r={7 * u} fill="none" stroke={textOn(e.color)} strokeOpacity={0.6} strokeWidth={2 * u} />
                </g>
              )}
            </g>
          );
        })}
        {/* income bar */}
        <g opacity={barIn} transform={`translate(0 ${(1 - barIn) * -26 * u})`}>
          <rect x={barX} y={barY} width={barW} height={barH} rx={26 * u} fill={panel} />
          <text x={barX + 34 * u} y={barY + barH * 0.34} fontFamily={font} fontWeight={600} fontSize={barH * 0.19} letterSpacing={barH * 0.02} fill={ink} {...inkSoft}>
            {clip(incomeLabel.toUpperCase(), barW * 0.45, barH * 0.19, 0.66)}
          </text>
          <text x={barX + 34 * u} y={barY + barH * 0.8} fontFamily={font} fontWeight={700} fontSize={barH * 0.4} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(inc * prog(frame, startAt + 4, startAt + 30 / speed), 0, prefix, suffix)}
          </text>
          <text x={barX + barW - 34 * u} y={barY + barH * 0.34} textAnchor="end" fontFamily={font} fontWeight={600} fontSize={barH * 0.17} letterSpacing={barH * 0.02} fill={accent}>
            {clip(leftLabel.toUpperCase(), barW * 0.4, barH * 0.17, 0.66)}
          </text>
          <text x={barX + barW - 34 * u} y={barY + barH * 0.8} textAnchor="end" fontFamily={font} fontWeight={700} fontSize={barH * 0.3} fill={accent} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(Math.round(left), 0, prefix, suffix)}
          </text>
        </g>
        {/* envelopes */}
        {envs.map((e, i) => {
          const c = centers[i];
          const a = prog(frame, t0(i) - 6, t0(i) + 8, ease.back);
          const open = prog(frame, t0(i) + 16 / speed, t0(i) + 30 / speed, ease.inOut);
          const rise = prog(frame, t0(i) + 22 / speed, t0(i) + 44 / speed, ease.out);
          const x = c.x - ew / 2;
          const y = c.y - eh / 2;
          const share = Math.max(0, e.amount) / total;
          const amount = Math.max(0, e.amount) * (inc / total) * prog(frame, t0(i) + 22 / speed, t0(i) + 56 / speed, ease.out);
          const body = mixHex(e.color, '#ffffff', 0.08);
          const flapC = mixHex(e.color, '#000000', 0.18);
          const flapH = eh * 0.55;
          const fy = open * 2 - 1; // -1..1 -> closed to open
          const onTop = fy <= 0.0;
          const ink2 = textOn(body);
          const slipY = y + eh * 0.3 - rise * (eh * 0.3 + vis);
          const sid = `env-${i}`;
          return (
            <g key={i} opacity={clamp(a * 1.4)} transform={`translate(${c.x} ${c.y + (1 - clamp(a)) * 40 * u}) scale(${0.85 + 0.15 * clamp(a)}) translate(${-c.x} ${-c.y})`}>
              <rect x={x + 4 * u} y={y + 10 * u} width={ew} height={eh} rx={12 * u} fill="#000" opacity={0.18} />
              {/* open flap behind */}
              {!onTop && <path d={`M${x},${y} L${x + ew / 2},${y - flapH * fy} L${x + ew},${y}Z`} fill={flapC} stroke={flapC} strokeWidth={2 * u} strokeLinejoin="round" />}
              {/* slip */}
              <g>
                <rect x={x + ew * 0.1} y={slipY} width={ew * 0.8} height={slipH} rx={8 * u} fill="#FBFAF6" />
                <rect x={x + ew * 0.1} y={slipY} width={ew * 0.8} height={7 * u} rx={3 * u} fill={e.color} />
                <text x={x + ew / 2} y={slipY + vis * 0.62} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={Math.min(ew * 0.17, (ew * 0.76) / Math.max(3, fmt(e.amount, 0, prefix, suffix).length * 0.6))} fill="#14181F" style={{fontVariantNumeric: 'tabular-nums'}}>
                  {fmt(amount, 0, prefix, suffix)}
                </text>
                {showPercent && (
                  <text x={x + ew / 2} y={slipY + vis * 0.93} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={lab * 0.9} fill="#14181F" fillOpacity={0.5}>
                    {Math.round(share * 100)}%
                  </text>
                )}
              </g>
              {/* body */}
              <rect x={x} y={y} width={ew} height={eh} rx={12 * u} fill={body} />
              <path d={`M${x},${y + eh} L${x + ew * 0.42},${y + eh * 0.5}  M${x + ew},${y + eh} L${x + ew * 0.58},${y + eh * 0.5}`} stroke={ink2} strokeOpacity={0.16} strokeWidth={2 * u} fill="none" strokeLinecap="round" />
              <text x={x + ew / 2} y={y + eh * 0.8} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={lab * 1.3} fill={ink2} id={sid}>
                {clip(e.label, ew * 0.9, lab * 1.3)}
              </text>
              {/* closed flap in front */}
              {onTop && fy < 0.98 && <path d={`M${x},${y} L${x + ew / 2},${y + flapH * -fy * 1} L${x + ew},${y}Z`} fill={flapC} />}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const budgetEnvelopeSplit = defineMotion<Props>({
  id: 'budget-envelope-split',
  title: 'Budget envelope split',
  category: 'data',
  description:
    'An income bar at the top splits into coins that travel down dashed lines to a grid of paper envelopes; each envelope pops in, opens its flap and lifts a slip showing the amount and share, while the "left to assign" counter on the bar runs down to zero.',
  source: ['original round-3 vertical motion'],
  useFor:
    'Personal-finance and budgeting apps, envelope / zero-based budgeting explainers, salary or revenue allocation stories, "where does my money go" reels. Pass the income and a list of labelled envelopes with amounts and colours.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Every dollar gets a job',
    subtitle: 'Monthly income split into envelopes',
    income: 4200,
    incomeLabel: 'Monthly income',
    leftLabel: 'Left to assign',
    envelopes: ENVS,
    prefix: '$',
    suffix: '',
    showPercent: true,
    colors: ['#4C8DF6', '#F2994A', '#27AE8F', '#EB5B8C', '#8E6CF0', '#F2C94C', '#56CCF2', '#9B9B9B', '#7BC043'],
    background: '#101826',
    panel: '#1B2638',
    ink: '#EEF3FA',
    accent: '#7BE0A8',
    fontFamily: '',
    startAt: 6,
    speed: 1,
  },
  propDocs: {
    title: 'headline (empty = none)',
    subtitle: 'line under the headline (empty = none)',
    income: 'total income on the bar; envelopes are scaled to add up to it (0 = sum of the envelopes)',
    incomeLabel: 'caption over the income amount',
    leftLabel: 'caption over the running "left to assign" amount',
    envelopes: 'envelopes [{label, amount, color?}] up to 9; amounts are shares of the income',
    prefix: 'text before amounts (currency symbol)',
    suffix: 'text after amounts',
    showPercent: 'show each envelope\'s percentage share on its slip',
    colors: 'palette for envelopes without their own colour',
    background: 'page colour, or "transparent"',
    panel: 'income bar colour',
    ink: 'text colour',
    accent: '"left to assign" amount colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the income bar starts',
    speed: 'animation speed multiplier',
  },
  component: BudgetEnvelopeSplit,
  tags: ['budget', 'envelope', 'finance', 'money', 'income', 'salary', 'allocation', 'split', 'savings', 'personal finance', 'zero-based', 'breakdown', 'fintech', 'overlay'],
});
