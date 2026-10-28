import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Header, Legend, arcPath, fmt, legendHeight, polar, ramp, resolveFont, useChartBox} from '../../core/r3-chart-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Zone = {to: number; color: string; label?: string};
type Props = {
  value: number;
  min: number;
  max: number;
  target: number;
  label: string;
  title: string;
  subtitle: string;
  prefix: string;
  suffix: string;
  decimals: number;
  zones: Zone[];
  accent: string;
  ticks: number;
  tickDecimals: number;
  showLegend: boolean;
  targetLabel: string;
  background: string;
  ink: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const A0 = -120;
const A1 = 120;

const GaugeKpiDial: React.FC<Props> = ({
  value,
  min,
  max,
  target,
  label,
  title,
  subtitle,
  prefix,
  suffix,
  decimals,
  zones,
  accent,
  ticks,
  tickDecimals,
  showLegend,
  targetLabel,
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
  const span = Math.max(1e-9, max - min);
  const f = (v: number) => clamp((v - min) / span);
  const ang = (v: number) => lerp(A0, A1, f(v));

  const side = !portrait && !box.square;
  const legSize = 28 * u;
  const legRow = legSize * 1.9;
  const zl = zones.filter((z) => z.label);
  const legCols = side ? 1 : Math.min(zl.length, portrait ? 2 : 3);
  const legH = showLegend ? legendHeight(zl.length, legCols, legRow) : 0;

  // dial geometry
  const dialW = side ? box.w * 0.54 : box.w;
  const belowH = side ? 0 : (portrait ? 330 : 260) * u + legH;
  const R = Math.max(90 * u, Math.min(dialW * 0.47, (box.h - belowH) / 1.5));
  const dialH = R * 1.5;
  const cx = side ? box.x + dialW / 2 : box.x + box.w / 2;
  const groupH = side ? dialH : dialH + belowH;
  const cy = box.y + (box.h - groupH) / 2 + R;
  const band = R * 0.2;
  const rOut = R;
  const rIn = R - band;

  // timing
  const sweepIn = ramp(frame, startAt, 36, speed, ease.out);
  const needleP = prog(frame, startAt + 14 / speed, startAt + 70 / speed, ease.back);
  const nShow = clamp(needleP);
  const settled = frame > startAt + 70 / speed;
  const wob = settled ? Math.sin((frame - startAt) * 0.21) * Math.exp(-(frame - startAt - 70 / speed) * 0.02) * 0.8 : 0;
  const needleVal = lerp(min, value, needleP) ;
  const needleDeg = ang(needleVal) + wob;
  const shown = lerp(min, value, nShow);

  // value colour = zone the live value is in
  const zs = zones.length ? [...zones].sort((a, b) => a.to - b.to) : [];
  const zoneAt = (v: number) => zs.find((z) => v <= z.to) || zs[zs.length - 1];
  const valCol = zs.length ? zoneAt(shown).color : accent;

  // zone arcs
  const arcs: {a0: number; a1: number; color: string}[] = [];
  if (zs.length) {
    let prev = min;
    zs.forEach((z) => {
      const to = clamp(z.to, min, max);
      if (to > prev) arcs.push({a0: ang(prev), a1: ang(to), color: z.color});
      prev = Math.max(prev, to);
    });
  }

  const tickList = Array.from({length: Math.max(2, ticks) + 1}, (_, i) => min + (span * i) / Math.max(2, ticks));

  // right panel / below panel
  const px = side ? box.x + dialW + 70 * u : box.x;
  const pw = side ? box.w - dialW - 70 * u : box.w;
  const bigSize = Math.min((portrait ? 190 : side ? 170 : 150) * u, (pw * 0.95) / Math.max(4, fmt(max, decimals, prefix, suffix).length) / 0.6);
  const panelCx = side ? px : box.x + box.w / 2;
  const anchor = side ? 'start' : 'middle';
  const panelTop = side ? cy - R * 0.62 : cy + R * 0.52 + 24 * u;
  const numY = panelTop + bigSize * 0.82;
  const lblSize = Math.min(38 * u, bigSize * 0.3);
  const tgtT = prog(frame, startAt + 40 / speed, startAt + 60 / speed, ease.out);
  const hasTarget = Number.isFinite(target) && target > min && target <= max;
  const legY = side ? numY + lblSize * 4.2 + 24 * u : numY + lblSize * 3.6 + (hasTarget ? 40 * u : 0) + 10 * u;

  const [tipX, tipY] = polar(cx, cy, rIn - 6 * u, needleDeg);
  const [bx1, by1] = polar(cx, cy, 12 * u, needleDeg + 90);
  const [bx2, by2] = polar(cx, cy, 12 * u, needleDeg - 90);
  const [tx0, ty0] = polar(cx, cy, rOut + 10 * u, ang(target));
  const [tx1, ty1] = polar(cx, cy, rOut + 36 * u, ang(target));

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} />
        <g>
          <path d={arcPath(cx, cy, rIn, rOut, A0, A1)} fill={ink} fillOpacity={0.09} />
          {arcs.length === 0 && sweepIn > 0 && <path d={arcPath(cx, cy, rIn, rOut, A0, A0 + Math.max(0.02, (ang(shown) - A0) * 1))} fill={accent} />}
          {arcs.map((a, i) => {
            const vis = clamp((A0 + (A1 - A0) * sweepIn - a.a0) / Math.max(0.01, a.a1 - a.a0));
            if (vis <= 0) return null;
            return <path key={i} d={arcPath(cx, cy, rIn, rOut, a.a0 + 0.6, a.a0 + 0.6 + Math.max(0.01, (a.a1 - a.a0 - 1.2) * vis))} fill={a.color} />;
          })}
          {tickList.map((tv, i) => {
            const [x0, y0] = polar(cx, cy, rIn - 8 * u, ang(tv));
            const [x1, y1] = polar(cx, cy, rIn - 26 * u, ang(tv));
            const [lx, ly] = polar(cx, cy, rIn - 58 * u, ang(tv));
            return (
              <g key={i} opacity={sweepIn}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={ink} strokeOpacity={0.5} strokeWidth={3 * u} strokeLinecap="round" />
                <text x={lx} y={ly + 9 * u} textAnchor="middle" fontFamily={font} fontWeight={500} fontSize={Math.max(18, R * 0.065)} fill={ink} fillOpacity={0.6}>
                  {fmt(tv, tickDecimals, '', '')}
                </text>
              </g>
            );
          })}
          {hasTarget && (
            <g opacity={tgtT}>
              <line x1={tx0} y1={ty0} x2={tx1} y2={ty1} stroke={ink} strokeWidth={5 * u} strokeLinecap="round" />
            </g>
          )}
          {/* needle */}
          <g>
            <polygon points={`${tipX},${tipY} ${bx1},${by1} ${bx2},${by2}`} fill={ink} />
            <circle cx={cx} cy={cy} r={22 * u} fill={ink} />
            <circle cx={cx} cy={cy} r={9 * u} fill={valCol} />
          </g>
        </g>
        <g opacity={prog(frame, startAt + 6, startAt + 24)}>
          <text x={panelCx} y={numY} textAnchor={anchor} fontFamily={font} fontWeight={700} fontSize={bigSize} fill={valCol} style={{fontVariantNumeric: 'tabular-nums'}} letterSpacing={-2 * u}>
            {fmt(shown, decimals, prefix, suffix)}
          </text>
          {label && (
            <text x={panelCx} y={numY + lblSize * 1.45} textAnchor={anchor} fontFamily={font} fontWeight={600} fontSize={lblSize} fill={ink} fillOpacity={0.75}>
              {label}
            </text>
          )}
        </g>
        {hasTarget && (
          <g opacity={tgtT}>
            <text x={panelCx} y={numY + lblSize * 2.6} textAnchor={anchor} fontFamily={font} fontWeight={600} fontSize={lblSize * 0.78} fill={ink} fillOpacity={0.6}>
              {`${targetLabel} ${fmt(target, decimals, prefix, suffix)}`}
            </text>
          </g>
        )}
        {showLegend && zl.length > 0 && (
          <Legend
            items={zl.map((z) => ({label: z.label || '', color: z.color}))}
            x={side ? px : box.x}
            y={legY}
            w={side ? Math.min(pw, 460 * u) : box.w}
            cols={legCols}
            rowH={legRow}
            size={legSize}
            ink={ink}
            fontFamily={font}
            frame={frame}
            start={startAt + 30}
            stagger={5}
            align={side ? 'start' : 'center'}
          />
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const gaugeKpiDial = defineMotion<Props>({
  id: 'gauge-kpi-dial',
  title: 'Gauge KPI dial',
  category: 'data',
  description:
    'A 240-degree dial gauge: coloured zone bands sweep on, tick labels appear, the needle swings to the value with a small overshoot and wobble while a big KPI number counts up in the colour of the zone it is in, with a target marker and zone legend.',
  source: ['original round-3 chart motion'],
  useFor: 'One headline KPI with a good / ok / bad reading: NPS, uptime, conversion rate, utilisation, health score, goal progress. Set value, min, max, zones, prefix / suffix.',
  durationInFrames: 150,
  defaultProps: {
    value: 78,
    min: 0,
    max: 100,
    target: 85,
    label: 'Customer satisfaction',
    title: 'Satisfaction score',
    subtitle: 'Current quarter against target',
    prefix: '',
    suffix: '%',
    decimals: 0,
    zones: [
      {to: 40, color: '#E5484D', label: 'Needs work'},
      {to: 70, color: '#F5A524', label: 'On track'},
      {to: 100, color: '#12A594', label: 'Strong'},
    ],
    accent: '#2F6FED',
    ticks: 5,
    tickDecimals: 0,
    showLegend: true,
    targetLabel: 'Target',
    background: '#0F1722',
    ink: '#EEF2F7',
    fontFamily: '',
    startAt: 8,
    speed: 1,
  },
  propDocs: {
    value: 'the reading the needle lands on',
    min: 'dial minimum',
    max: 'dial maximum',
    target: 'target marker position (outside min..max = no marker)',
    label: 'caption under the big number',
    title: 'headline (empty = none)',
    subtitle: 'small line under the headline (empty = none)',
    prefix: 'text before numbers',
    suffix: 'text after numbers, e.g. "%"',
    decimals: 'decimal places on the big number',
    zones: 'colour bands [{to, color, label?}] ascending by "to"; empty = one accent arc that fills to the value',
    accent: 'colour used when there are no zones',
    ticks: 'number of tick intervals around the dial',
    tickDecimals: 'decimals on tick labels',
    showLegend: 'legend of the labelled zones',
    targetLabel: 'word before the target number',
    background: 'page colour, or "transparent"',
    ink: 'text, needle and track colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the dial starts drawing',
    speed: 'animation speed multiplier',
  },
  component: GaugeKpiDial,
  tags: ['gauge', 'dial', 'kpi', 'speedometer', 'needle', 'score', 'nps', 'meter', 'chart', 'data', 'infographic', 'count-up', 'dashboard'],
});
