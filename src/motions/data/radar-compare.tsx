import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, Legend, clip, fmt, itemColor, legendHeight, polar, ramp, resolveFont, useChartBox} from '../../core/r3-chart-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Series = {name: string; values: number[]; color?: string};
type Props = {
  axes: string[];
  series: Series[];
  max: number;
  rings: number;
  title: string;
  subtitle: string;
  prefix: string;
  suffix: string;
  decimals: number;
  showValues: boolean;
  showAverage: boolean;
  showLegend: boolean;
  fillOpacity: number;
  colors: string[];
  background: string;
  ink: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const AXES = ['Speed', 'Quality', 'Cost', 'Support', 'Reach', 'Design'];
const SERIES: Series[] = [
  {name: 'Option A', values: [82, 70, 55, 88, 64, 76]},
  {name: 'Option B', values: [58, 86, 78, 52, 80, 62]},
];

const RadarCompare: React.FC<Props> = ({
  axes,
  series,
  max,
  rings,
  title,
  subtitle,
  prefix,
  suffix,
  decimals,
  showValues,
  showAverage,
  showLegend,
  fillOpacity,
  colors,
  background,
  ink,
  fontFamily,
  startAt,
  speed,
}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const n = Math.max(3, axes.length);
  const maxV = max > 0 ? max : Math.max(1, ...series.flatMap((s) => s.values));
  const ringN = Math.max(1, Math.round(rings));

  const legRight = !portrait;
  const legSize = (portrait ? 34 : 30) * u;
  const legRowH = legSize * 1.9;
  const legW = showLegend ? (legRight ? Math.min(box.w * 0.24, 400 * u) : box.w) : 0;
  const legH = showLegend ? legendHeight(series.length, legRight ? 1 : Math.min(2, series.length), legRowH) : 0;
  const plotW = legRight && showLegend ? box.w - legW - 40 * u : box.w;
  const plotH = !legRight && showLegend ? box.h - legH - 36 * u : box.h;
  const labFs = (portrait ? 32 : 28) * u;
  const R = Math.max(90 * u, Math.min(plotW / 2 - (portrait ? 120 : 190) * u, plotH / 2 - 62 * u));
  const groupW = 2 * R + 2 * 170 * u + (legRight && showLegend ? legW + 40 * u : 0);
  const cx = legRight && showLegend ? box.x + (box.w - groupW) / 2 + 170 * u + R : box.x + box.w / 2;
  const cy = box.y + plotH / 2;
  const halo = background === 'transparent' ? 'none' : background;
  const gridT = ramp(frame, startAt, 20, speed, ease.out);

  const verts = (vals: number[], k: number) =>
    Array.from({length: n}, (_, i) => {
      const v = clamp((vals[i] ?? 0) / maxV);
      return polar(cx, cy, R * v * k, (360 * i) / n);
    });

  const per = 22 / speed;
  const growStart = startAt + 14 / speed;
  const growEnd = (si: number) => growStart + si * per + 44 / speed;
  const avg = (s: Series) => s.values.slice(0, n).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(n, s.values.length));

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} />
        <g opacity={gridT}>
          {Array.from({length: ringN}, (_, k) => {
            const rr = (R * (k + 1)) / ringN;
            const pts = Array.from({length: n}, (_, i) => polar(cx, cy, rr, (360 * i) / n).join(',')).join(' ');
            return <polygon key={k} points={pts} fill={k === ringN - 1 ? ink : 'none'} fillOpacity={0.035} stroke={ink} strokeOpacity={k === ringN - 1 ? 0.3 : 0.14} strokeWidth={2 * u} />;
          })}
          {Array.from({length: n}, (_, i) => {
            const [x, y] = polar(cx, cy, R, (360 * i) / n);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={ink} strokeOpacity={0.16} strokeWidth={2 * u} />;
          })}
          {Array.from({length: ringN}, (_, k) => {
            const [x, y] = polar(cx, cy, (R * (k + 1)) / ringN, 180 / n);
            if (ringN > 6 || R < 150 * u) return null;
            return (
              <text key={k} x={x} y={y + labFs * 0.2} textAnchor="middle" fontFamily={font} fontWeight={500} fontSize={labFs * 0.6} fill={ink} fillOpacity={0.45} stroke={halo} strokeWidth={5 * u} paintOrder="stroke">
                {fmt((maxV * (k + 1)) / ringN, decimals > 0 ? 1 : 0, '', '')}
              </text>
            );
          })}
          {Array.from({length: n}, (_, i) => {
            const ang = (360 * i) / n;
            const [x, y] = polar(cx, cy, R + 26 * u, ang);
            const sn = Math.sin((ang * Math.PI) / 180);
            const cs = Math.cos((ang * Math.PI) / 180);
            const anchor = Math.abs(sn) < 0.25 ? 'middle' : sn > 0 ? 'start' : 'end';
            const label = axes[i] ?? '';
            return (
              <text key={i} x={x} y={y + (cs > 0.5 ? -4 * u : cs < -0.5 ? labFs * 0.9 : labFs * 0.35)} textAnchor={anchor} fontFamily={font} fontWeight={600} fontSize={labFs} fill={ink}>
                {clip(label, 170 * u, labFs)}
              </text>
            );
          })}
        </g>
        {series.map((s, si) => {
          const col = itemColor(s.color, colors, si);
          const t = prog(frame, growStart + si * per, growEnd(si), ease.out);
          if (t <= 0) return null;
          const pts = verts(s.values, t);
          const dotT = prog(frame, growEnd(si) - 10, growEnd(si) + 4, ease.back);
          const showV = showValues && frame > growEnd(si);
          const vT = prog(frame, growEnd(si), growEnd(si) + 16);
          return (
            <g key={si}>
              <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={col} fillOpacity={fillOpacity} stroke={col} strokeWidth={5 * u} strokeLinejoin="round" />
              {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={8 * u * dotT} fill={col} stroke={background === 'transparent' ? '#fff' : background} strokeWidth={3 * u} />
              ))}
              {showV &&
                pts.map(([x, y], i) => {
                  const ang = (360 * i) / n;
                  const [lx, ly] = polar(x, y, 26 * u, ang);
                  return (
                    <text key={'v' + i} x={lx} y={ly + labFs * 0.2} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={labFs * 0.78} fill={col} stroke={halo} strokeWidth={6 * u} paintOrder="stroke" strokeLinejoin="round" opacity={vT} style={{fontVariantNumeric: 'tabular-nums'}}>
                      {fmt(s.values[i] ?? 0, decimals, prefix, suffix)}
                    </text>
                  );
                })}
            </g>
          );
        })}
        {showLegend && (
          <Legend
            items={series.map((s, si) => ({
              label: s.name,
              color: itemColor(s.color, colors, si),
              value: showAverage ? fmt(avg(s) * clamp(prog(frame, growStart + si * per, growEnd(si), ease.out)), decimals, prefix, suffix) : undefined,
            }))}
            x={legRight ? cx + R + 190 * u + 30 * u : box.x}
            y={legRight ? cy - legH / 2 : box.y + plotH + 36 * u}
            w={legW}
            cols={legRight ? 1 : Math.min(2, series.length)}
            rowH={legRowH}
            size={legSize}
            ink={ink}
            fontFamily={font}
            frame={frame}
            start={startAt + 16}
            stagger={8}
            shape="dot"
          />
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const radarCompare = defineMotion<Props>({
  id: 'radar-compare',
  title: 'Radar compare',
  category: 'data',
  description:
    'A radar (spider) chart: concentric rings and spokes fade in with axis labels, then each series polygon grows out from the centre in turn with vertex dots and count-up value labels; a legend lists every series with its average.',
  source: ['original round-3 chart motion'],
  useFor: 'Comparing two or three things across the same criteria: products, plans, candidates, teams, skill profiles, before / after. Replace axes, series, max and colours.',
  durationInFrames: 180,
  defaultProps: {
    axes: AXES,
    series: SERIES,
    max: 100,
    rings: 4,
    title: 'How the options compare',
    subtitle: 'Scores out of 100 on six criteria',
    prefix: '',
    suffix: '',
    decimals: 0,
    showValues: true,
    showAverage: true,
    showLegend: true,
    fillOpacity: 0.22,
    colors: ['#2F6FED', '#FF7A45', '#16B39A', '#F2B134', '#8E5CF0', '#E5487F'],
    background: '#F5F3EE',
    ink: '#18212B',
    fontFamily: '',
    startAt: 10,
    speed: 1,
  },
  propDocs: {
    axes: 'axis labels around the chart (3 or more)',
    series: 'series [{name, values[] (one per axis), color?}]',
    max: 'value at the outer ring (0 = largest value in the data)',
    rings: 'number of grid rings',
    title: 'headline (empty = none)',
    subtitle: 'small line under the headline (empty = none)',
    prefix: 'text before numbers',
    suffix: 'text after numbers',
    decimals: 'decimal places on numbers',
    showValues: 'value labels at every vertex (best with 1-2 series)',
    showAverage: 'show each series average (count-up) in the legend',
    showLegend: 'legend beside (16:9, 1:1) or below (9:16) the chart',
    fillOpacity: 'polygon fill opacity 0-1',
    colors: 'palette for series without their own colour',
    background: 'page colour, or "transparent"',
    ink: 'text and grid colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the grid starts drawing',
    speed: 'animation speed multiplier',
  },
  component: RadarCompare,
  tags: ['radar', 'spider', 'web chart', 'compare', 'comparison', 'chart', 'data', 'skills', 'profile', 'infographic', 'legend', 'overlay'],
});
