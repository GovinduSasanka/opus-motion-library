import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {
  Header,
  Legend,
  arcPath,
  fmt,
  itemColor,
  legendHeight,
  polar,
  ramp,
  resolveFont,
  textOn,
  useChartBox,
} from '../../core/r3-chart-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Slice = {label: string; value: number; color?: string};
type Props = {
  data: Slice[];
  title: string;
  subtitle: string;
  centerLabel: string;
  prefix: string;
  suffix: string;
  decimals: number;
  showPercent: boolean;
  showLegend: boolean;
  legendValues: boolean;
  sort: boolean;
  highlight: number;
  ringWidth: number;
  gap: number;
  colors: string[];
  background: string;
  ink: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const DEFAULT_DATA: Slice[] = [
  {label: 'Direct', value: 420},
  {label: 'Search', value: 310},
  {label: 'Social', value: 180},
  {label: 'Referral', value: 120},
  {label: 'Other', value: 70},
];

const DonutBreakdown: React.FC<Props> = ({
  data,
  title,
  subtitle,
  centerLabel,
  prefix,
  suffix,
  decimals,
  showPercent,
  showLegend,
  legendValues,
  sort,
  highlight,
  ringWidth,
  gap,
  colors,
  background,
  ink,
  fontFamily,
  startAt,
  speed,
}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);

  const rows = (sort ? [...data].sort((a, b) => b.value - a.value) : data).map((d, i) => ({...d, value: Math.max(0, d.value), color: itemColor(d.color, colors, i)}));
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  let acc = 0;
  const segs = rows.map((r) => {
    const a0 = (acc / total) * 360;
    acc += r.value;
    return {...r, a0, a1: (acc / total) * 360, share: r.value / total};
  });

  // layout: legend right (landscape / square) or below (portrait)
  const legendRight = !portrait;
  const legSize = (portrait ? 34 : 30) * u;
  const legRowH = legSize * 1.9;
  const legCols = legendRight ? 1 : rows.length > 4 ? 2 : 1;
  const legW = showLegend ? (legendRight ? Math.min(box.w * 0.34, 520 * u) : box.w) : 0;
  const legH = showLegend ? legendHeight(rows.length, legCols, legRowH) : 0;
  const donutBoxW = legendRight ? box.w - legW - (showLegend ? 40 * u : 0) : box.w;
  const donutBoxH = legendRight ? box.h : box.h - legH - (showLegend ? 48 * u : 0);
  const R = Math.max(80 * u, Math.min(donutBoxW, donutBoxH) / 2 - 22 * u);
  const groupX = box.x + (box.w - (legendRight ? 2 * R + (showLegend ? legW + 70 * u : 0) : box.w)) / 2;
  const cx = legendRight ? groupX + R : box.x + box.w / 2;
  const cy = box.y + (legendRight ? box.h / 2 : donutBoxH / 2);
  const r1 = R;
  const r0 = R * (1 - clamp(ringWidth, 0.1, 0.8));

  const sweep = ramp(frame, startAt, 64, speed, ease.inOut);
  const theta = sweep * 360;
  const totalShown = total * sweep;

  const hl = highlight >= 0 && highlight < segs.length ? highlight : -1;
  const hlT = hl >= 0 ? prog(frame, startAt + 78 / speed, startAt + 96 / speed, ease.out) : 0;

  // centre text sizing
  const centerStr = fmt(totalShown, decimals, prefix, suffix);
  const fullStr = fmt(total, decimals, prefix, suffix);
  const innerD = r0 * 2 * 0.74;
  const cSize = Math.min(r0 * 0.56, innerD / (fullStr.length * 0.6));

  const legX = legendRight ? cx + R + 70 * u : box.x;
  const legY = legendRight ? cy - legH / 2 : box.y + donutBoxH + 48 * u;
  const legItems = segs.map((s, i) => {
    const local = clamp((theta - s.a0) / Math.max(0.001, s.a1 - s.a0));
    return {label: s.label, color: s.color, value: legendValues ? fmt(s.value * local, decimals, prefix, suffix) : undefined};
  });

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} />
        <circle cx={cx} cy={cy} r={(r0 + r1) / 2} fill="none" stroke={ink} strokeOpacity={0.08} strokeWidth={r1 - r0} opacity={prog(frame, startAt - 4, startAt + 8)} />
        {segs.map((s, i) => {
          const span = s.a1 - s.a0;
          const local = clamp((theta - s.a0) / Math.max(0.001, span));
          if (local <= 0 || span <= 0) return null;
          const g = Math.min(gap / 2, span / 3);
          const mid = (s.a0 + s.a1) / 2;
          const a0 = s.a0 + g;
          const a1 = s.a0 + g + Math.max(0.01, (span - 2 * g) * local);
          const isHl = i === hl;
          const dimmed = hl >= 0 && !isHl ? 1 - 0.55 * hlT : 1;
          const push = isHl ? 16 * u * hlT : 0;
          const [ox, oy] = polar(0, 0, push, mid);
          const rr1 = r1 + (isHl ? 8 * u * hlT : 0);
          const [lx, ly] = polar(cx + ox, cy + oy, (r0 + rr1) / 2, mid);
          const labelOn = showPercent && s.share >= 0.055 && local >= 1;
          const pT = prog(frame, startAt + (s.a1 / 360) * (64 / speed), startAt + (s.a1 / 360) * (64 / speed) + 10);
          const pSize = Math.min((r1 - r0) * 0.38, 40 * u);
          return (
            <g key={i} opacity={dimmed}>
              <path d={arcPath(cx + ox, cy + oy, r0, rr1, a0, a1)} fill={s.color} />
              {labelOn && (
                <text x={lx} y={ly + pSize * 0.35} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={pSize} fill={textOn(s.color)} opacity={pT}>
                  {fmt(s.share * 100, 0, '', '%')}
                </text>
              )}
            </g>
          );
        })}
        <g opacity={prog(frame, startAt + 4, startAt + 20)}>
          <text x={cx} y={cy + cSize * 0.28 - (centerLabel ? cSize * 0.28 : 0)} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={cSize} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
            {centerStr}
          </text>
          {centerLabel ? (
            <text x={cx} y={cy + cSize * 0.28 + cSize * 0.5} textAnchor="middle" fontFamily={font} fontWeight={500} fontSize={cSize * 0.38} fill={ink} fillOpacity={0.6} letterSpacing={cSize * 0.04}>
              {centerLabel}
            </text>
          ) : null}
        </g>
        {showLegend && (
          <Legend
            items={legItems}
            x={legX}
            y={legY}
            w={legendRight ? legW : box.w}
            cols={legCols}
            rowH={legRowH}
            size={legSize}
            ink={ink}
            fontFamily={font}
            frame={frame}
            start={startAt + 12}
            stagger={5}
            dim={(i) => (hl >= 0 && i !== hl ? 1 - 0.55 * hlT : 1)}
          />
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const donutBreakdown = defineMotion<Props>({
  id: 'donut-breakdown',
  title: 'Donut breakdown',
  category: 'data',
  description:
    'A donut chart that sweeps round clockwise segment by segment with percentage labels, a count-up total in the centre and a legend whose values count up as each segment lands; an optional highlighted slice pops out while the rest dim.',
  source: ['original round-3 chart motion'],
  useFor: 'Share-of-total stories on any brand: revenue by channel, budget split, traffic sources, survey answers, market share. Replace data, colours, prefix / suffix; works on a transparent background over footage.',
  durationInFrames: 180,
  defaultProps: {
    data: DEFAULT_DATA,
    title: 'Traffic by source',
    subtitle: 'Share of total sessions, thousands',
    centerLabel: 'TOTAL',
    prefix: '',
    suffix: 'K',
    decimals: 0,
    showPercent: true,
    showLegend: true,
    legendValues: true,
    sort: false,
    highlight: -1,
    ringWidth: 0.34,
    gap: 2,
    colors: ['#2F6FED', '#FF7A45', '#16B39A', '#F2B134', '#8E5CF0', '#E5487F', '#5BC0EB', '#7A8794'],
    background: '#F5F3EE',
    ink: '#18212B',
    fontFamily: '',
    startAt: 10,
    speed: 1,
  },
  propDocs: {
    data: 'slices [{label, value, color?}]; any count, values are relative',
    title: 'headline (empty = none)',
    subtitle: 'small line under the headline (empty = none)',
    centerLabel: 'small caption under the centre total (empty = none)',
    prefix: 'text before every number, e.g. "$"',
    suffix: 'text after every number, e.g. "K", "%", " users"',
    decimals: 'decimal places on the numbers',
    showPercent: 'print each slice share on the ring',
    showLegend: 'legend beside (16:9, 1:1) or below (9:16) the donut',
    legendValues: 'show the count-up value next to each legend label',
    sort: 'sort slices largest first',
    highlight: 'index of a slice to pop out once the sweep ends (-1 = none)',
    ringWidth: 'ring thickness as a fraction of the radius (0.1-0.8)',
    gap: 'gap between slices in degrees',
    colors: 'palette used for slices without their own colour',
    background: 'page colour, or "transparent" to sit over other content',
    ink: 'text and track colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the sweep starts',
    speed: 'animation speed multiplier',
  },
  component: DonutBreakdown,
  tags: ['donut', 'pie', 'chart', 'breakdown', 'share', 'percentage', 'infographic', 'data', 'legend', 'overlay', 'count-up', 'statistics'],
});
