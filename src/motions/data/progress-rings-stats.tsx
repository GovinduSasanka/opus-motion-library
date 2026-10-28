import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, Legend, fmt, itemColor, legendHeight, ramp, resolveFont, ringPath, useChartBox, wrapLines} from '../../core/r3-chart-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Ring = {label: string; value: number; max?: number; color?: string; prefix?: string; suffix?: string; decimals?: number};
type Props = {
  rings: Ring[];
  layout: 'row' | 'concentric';
  title: string;
  subtitle: string;
  prefix: string;
  suffix: string;
  decimals: number;
  showPercent: boolean;
  showLegend: boolean;
  centerLabel: string;
  thickness: number;
  colors: string[];
  background: string;
  ink: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const RINGS: Ring[] = [
  {label: 'Move', value: 480, max: 600, suffix: ' kcal'},
  {label: 'Exercise', value: 42, max: 60, suffix: ' min'},
  {label: 'Stand', value: 10, max: 12, suffix: ' hrs'},
  {label: 'Sleep', value: 7.2, max: 8, suffix: ' h'},
];

const ProgressRingsStats: React.FC<Props> = ({
  rings,
  layout,
  title,
  subtitle,
  prefix,
  suffix,
  decimals,
  showPercent,
  showLegend,
  centerLabel,
  thickness,
  colors,
  background,
  ink,
  fontFamily,
  startAt,
  speed,
}) => {
  const frame = useCurrentFrame();
  const {u, portrait, square} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const n = Math.max(1, rings.length);
  const rows = rings.map((r, i) => ({
    ...r,
    max: r.max && r.max > 0 ? r.max : 100,
    color: itemColor(r.color, colors, i),
    prefix: r.prefix ?? prefix,
    suffix: r.suffix ?? suffix,
    decimals: r.decimals ?? decimals,
  }));
  const per = 14 / speed;
  const rt = (i: number) => prog(frame, startAt + i * per, startAt + i * per + 54 / speed, ease.out);
  const frac = (i: number) => clamp(rows[i].value / rows[i].max);
  const th = clamp(thickness, 0.05, 0.4);

  const nodes: React.ReactNode[] = [];

  if (layout === 'concentric') {
    const legRight = !portrait;
    const legSize = (portrait ? 34 : 30) * u;
    const legRowH = legSize * 2;
    const legW = showLegend ? (legRight ? Math.min(box.w * 0.34, 560 * u) : box.w) : 0;
    const legH = showLegend ? legendHeight(n, 1, legRowH) : 0;
    const plotW = legRight && showLegend ? box.w - legW - 50 * u : box.w;
    const plotH = !legRight && showLegend ? box.h - legH - 40 * u : box.h;
    const R = Math.max(80 * u, Math.min(plotW, plotH) / 2 - 8 * u);
    const slot = Math.min((R * 0.9) / n, R * 0.2);
    const thick = Math.min(slot * 0.78, R * th * 1.1);
    const groupW = 2 * R + (legRight && showLegend ? legW + 70 * u : 0);
    const cx = legRight && showLegend ? box.x + (box.w - groupW) / 2 + R : box.x + box.w / 2;
    const cy = box.y + plotH / 2;
    const avg = rows.reduce((a, _r, i) => a + frac(i) * rt(i), 0) / n;
    rows.forEach((r, i) => {
      const rr = R - thick / 2 - i * slot;
      const sweep = frac(i) * 360 * rt(i);
      nodes.push(
        <g key={i}>
          <circle cx={cx} cy={cy} r={rr} fill="none" stroke={r.color} strokeOpacity={0.18} strokeWidth={thick} />
          {sweep > 0.5 && <path d={ringPath(cx, cy, rr, 0, sweep)} fill="none" stroke={r.color} strokeWidth={thick} strokeLinecap="round" />}
        </g>,
      );
    });
    const innerR = R - n * slot;
    if (innerR > 60 * u) {
      const size = Math.min(innerR * 0.62, (innerR * 1.5) / 4.6);
      nodes.push(
        <g key="c" opacity={prog(frame, startAt + 6, startAt + 24)}>
          <text x={cx} y={cy + size * (centerLabel ? 0.2 : 0.35)} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={size} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(avg * 100, 0, '', '%')}
          </text>
          {centerLabel ? (
            <text x={cx} y={cy + size * 0.75} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={size * 0.34} fill={ink} fillOpacity={0.6} letterSpacing={size * 0.03}>
              {centerLabel}
            </text>
          ) : null}
        </g>,
      );
    }
    if (showLegend) {
      nodes.push(
        <Legend
          key="leg"
          items={rows.map((r, i) => ({label: r.label, color: r.color, value: fmt(r.value * rt(i), r.decimals, r.prefix, r.suffix)}))}
          x={legRight ? cx + R + 70 * u : box.x}
          y={legRight ? cy - legH / 2 : box.y + plotH + 40 * u}
          w={legW}
          cols={1}
          rowH={legRowH}
          size={legSize}
          ink={ink}
          fontFamily={font}
          frame={frame}
          start={startAt + 8}
          stagger={per}
          shape="dot"
        />,
      );
    }
  } else {
    // row of separate rings with the number inside
    const cols = n <= 1 ? 1 : portrait || square ? 2 : Math.min(n, 4);
    const rws = Math.ceil(n / cols);
    const cellW = box.w / cols;
    const cellH = box.h / rws;
    const labSize = (portrait ? 34 : 30) * u;
    const D = Math.max(100 * u, Math.min(cellW * 0.8, cellH - labSize * 3.2));
    rows.forEach((r, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, n - row * cols);
      const gx = box.x + ((cols - inRow) * cellW) / 2 + col * cellW + cellW / 2;
      const gy = box.y + row * cellH + (cellH - (D + labSize * 2.6)) / 2 + D / 2;
      const thick = D * th;
      const rr = (D - thick) / 2;
      const t = rt(i);
      const sweep = frac(i) * 360 * t;
      const full = fmt(r.value, r.decimals, r.prefix, r.suffix);
      const numSize = Math.min(D * 0.26, (D * 0.66) / Math.max(2.4, full.length * 0.62));
      const labelLines = wrapLines(r.label, cellW * 0.9, labSize, 0.56, 2);
      nodes.push(
        <g key={i}>
          <circle cx={gx} cy={gy} r={rr} fill="none" stroke={r.color} strokeOpacity={0.18} strokeWidth={thick} />
          {sweep > 0.5 && <path d={ringPath(gx, gy, rr, 0, sweep)} fill="none" stroke={r.color} strokeWidth={thick} strokeLinecap="round" />}
          <text x={gx} y={gy + numSize * (showPercent ? 0.18 : 0.35)} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={numSize} fill={ink} opacity={clamp(t * 3)} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(r.value * t, r.decimals, r.prefix, r.suffix)}
          </text>
          {showPercent && (
            <text x={gx} y={gy + numSize * 0.9} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={numSize * 0.42} fill={r.color} opacity={clamp(t * 3)}>
              {fmt(frac(i) * 100 * t, 0, '', '%')}
            </text>
          )}
          {labelLines.map((ln, k) => (
            <text key={k} x={gx} y={gy + D / 2 + labSize * 1.5 + k * labSize * 1.2} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={labSize} fill={ink} fillOpacity={0.85} opacity={prog(frame, startAt + i * per, startAt + i * per + 16)}>
              {ln}
            </text>
          ))}
        </g>,
      );
    });
  }

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} />
        {nodes}
      </Svg>
    </AbsoluteFill>
  );
};

export const progressRingsStats = defineMotion<Props>({
  id: 'progress-rings-stats',
  title: 'Progress rings stats',
  category: 'data',
  description:
    'Activity-style progress rings with round caps that sweep clockwise to their value one after another while the numbers count up; either a row / grid of separate rings with the number inside and a label below, or concentric rings with a live legend and an overall percentage in the middle.',
  source: ['original round-3 chart motion'],
  useFor: 'Goal progress and KPI sets: completion rates, daily targets, quota attainment, fitness-style stats, survey scores. Each ring has its own value, max, colour, prefix and suffix.',
  durationInFrames: 150,
  defaultProps: {
    rings: RINGS,
    layout: 'row',
    title: 'Today at a glance',
    subtitle: 'Progress against daily goals',
    prefix: '',
    suffix: '',
    decimals: 0,
    showPercent: true,
    showLegend: true,
    centerLabel: 'OVERALL',
    thickness: 0.12,
    colors: ['#FF4D6D', '#7ED957', '#35C2FF', '#B07CFF', '#F2B134', '#16B39A'],
    background: '#0F1722',
    ink: '#EEF2F7',
    fontFamily: '',
    startAt: 10,
    speed: 1,
  },
  propDocs: {
    rings: 'rings [{label, value, max?(default 100), color?, prefix?, suffix?, decimals?}]; the fill is value / max',
    layout: '"row" = separate rings in a row / grid, "concentric" = nested rings with a legend',
    title: 'headline (empty = none)',
    subtitle: 'small line under the headline (empty = none)',
    prefix: 'default text before numbers',
    suffix: 'default text after numbers (a ring can override)',
    decimals: 'decimal places on numbers',
    showPercent: 'row layout: print the percentage under the number inside each ring',
    showLegend: 'concentric layout: legend with count-up values',
    centerLabel: 'concentric layout: caption under the overall percentage',
    thickness: 'ring thickness as a fraction of the ring diameter (row) or slot (concentric) 0.05-0.4',
    colors: 'palette for rings without their own colour',
    background: 'page colour, or "transparent"',
    ink: 'text colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the first ring starts',
    speed: 'animation speed multiplier',
  },
  component: ProgressRingsStats,
  tags: ['progress ring', 'rings', 'activity rings', 'goal', 'kpi', 'stats', 'chart', 'data', 'completion', 'infographic', 'count-up', 'legend', 'overlay'],
});
