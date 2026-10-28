import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Header, Legend, clip, fmt, niceScale, resolveFont, useChartBox, wrapLines} from '../../core/r3-chart-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Step = {label: string; value: number; total?: boolean};
type Props = {
  steps: Step[];
  autoTotal: boolean;
  endLabel: string;
  title: string;
  subtitle: string;
  prefix: string;
  suffix: string;
  decimals: number;
  showConnectors: boolean;
  showGrid: boolean;
  showLegend: boolean;
  increaseLabel: string;
  decreaseLabel: string;
  totalLabel: string;
  increaseColor: string;
  decreaseColor: string;
  totalColor: string;
  background: string;
  ink: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const STEPS: Step[] = [
  {label: 'Opening', value: 120, total: true},
  {label: 'New customers', value: 45},
  {label: 'Upgrades', value: 30},
  {label: 'Churn', value: -28},
  {label: 'Refunds', value: -9},
  {label: 'Price change', value: 22},
];

const WaterfallBridge: React.FC<Props> = ({
  steps,
  autoTotal,
  endLabel,
  title,
  subtitle,
  prefix,
  suffix,
  decimals,
  showConnectors,
  showGrid,
  showLegend,
  increaseLabel,
  decreaseLabel,
  totalLabel,
  increaseColor,
  decreaseColor,
  totalColor,
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

  // running totals -> bars {lo, hi, cum, kind, shown value}
  let cum = 0;
  const bars = steps.map((s) => {
    if (s.total) {
      cum = s.value;
      return {label: s.label, lo: Math.min(0, s.value), hi: Math.max(0, s.value), cum, kind: 'total' as const, v: s.value, from: 0};
    }
    const from = cum;
    cum += s.value;
    return {label: s.label, lo: Math.min(from, cum), hi: Math.max(from, cum), cum, kind: s.value >= 0 ? ('up' as const) : ('down' as const), v: s.value, from};
  });
  if (autoTotal) bars.push({label: endLabel, lo: Math.min(0, cum), hi: Math.max(0, cum), cum, kind: 'total' as const, v: cum, from: 0});
  const N = Math.max(1, bars.length);
  const vmin = Math.min(0, ...bars.map((b) => b.lo));
  const vmax = Math.max(1, ...bars.map((b) => b.hi));
  const sc = niceScale(vmin, vmax * 1.02, 4);
  const colorOf = (k: 'up' | 'down' | 'total') => (k === 'up' ? increaseColor : k === 'down' ? decreaseColor : totalColor);

  const legSize = (portrait ? 30 : 26) * u;
  const legRowH = legSize * 1.8;
  const legItems = [
    {label: increaseLabel, color: increaseColor},
    {label: decreaseLabel, color: decreaseColor},
    {label: totalLabel, color: totalColor},
  ].filter((l) => l.label);
  const legH = showLegend ? legRowH + 24 * u : 0;

  const per = 17 / speed;
  const s0 = startAt;
  const barT = (i: number) => prog(frame, s0 + i * per, s0 + i * per + 24 / speed, ease.out);
  const fs = Math.min(portrait ? 32 * u : 26 * u, (box.w / N) * 0.2 + 6 * u);
  const vfs = Math.min((portrait ? 36 : 32) * u, fs * 1.3);
  const gridT = prog(frame, startAt - 4, startAt + 14);

  const content: React.ReactNode[] = [];

  if (!portrait) {
    const x0 = box.x + (showGrid ? 84 * u : 0);
    const x1 = box.x + box.w;
    const top = box.y + 44 * u;
    const catH = fs * 2.9;
    const bottom = box.y + box.h - legH - catH;
    const slot = (x1 - x0) / N;
    const bw = slot * 0.62;
    const yv = (v: number) => bottom - ((v - sc.min) / (sc.max - sc.min)) * (bottom - top);
    if (showGrid) {
      for (let g = sc.min; g <= sc.max + 1e-9; g += sc.step) {
        content.push(
          <g key={'g' + g} opacity={gridT}>
            <line x1={x0} x2={x1} y1={yv(g)} y2={yv(g)} stroke={ink} strokeOpacity={g === 0 ? 0.4 : 0.1} strokeWidth={(g === 0 ? 3 : 2) * u} />
            <text x={x0 - 16 * u} y={yv(g) + fs * 0.35} textAnchor="end" fontFamily={font} fontWeight={500} fontSize={fs * 0.9} fill={ink} fillOpacity={0.5}>
              {fmt(g, 0, prefix, suffix)}
            </text>
          </g>,
        );
      }
    }
    bars.forEach((b, i) => {
      const t = barT(i);
      const cxx = x0 + slot * (i + 0.5);
      const col = colorOf(b.kind);
      // grow from the start level to the end level
      const a = b.kind === 'total' ? 0 : b.from;
      const bEnd = b.kind === 'total' ? b.v : b.cum;
      const cur = lerp(a, bEnd, t);
      const yTop = yv(Math.max(a, cur));
      const yBot = yv(Math.min(a, cur));
      const vShown = b.kind === 'total' ? b.v * t : b.v * t;
      const labelY = yv(Math.max(b.hi, a)) - 14 * u;
      if (showConnectors && i < N - 1) {
        const ct = prog(frame, s0 + i * per + 14 / speed, s0 + i * per + 28 / speed);
        content.push(<line key={'c' + i} x1={cxx + bw / 2} x2={cxx + bw / 2 + (slot - bw) * ct} y1={yv(b.cum)} y2={yv(b.cum)} stroke={ink} strokeOpacity={0.4} strokeWidth={2 * u} strokeDasharray={`${6 * u} ${6 * u}`} />);
      }
      content.push(
        <g key={i}>
          <rect x={cxx - bw / 2} y={yTop} width={bw} height={Math.max(0, yBot - yTop)} rx={Math.min(8 * u, bw / 6)} fill={col} />
          <text x={cxx} y={b.kind === 'down' ? yv(b.lo) + vfs * 1.15 : labelY} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={vfs} fill={ink} opacity={clamp(t * 2 - 0.6)} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(vShown, decimals, prefix, suffix, b.kind !== 'total')}
          </text>
          {wrapLines(b.label, slot * 0.96, fs, 0.56, 2).map((ln, k) => (
            <text key={k} x={cxx} y={bottom + fs * 1.35 + k * fs * 1.2} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={fs} fill={ink} fillOpacity={0.85} opacity={prog(frame, s0 + i * per, s0 + i * per + 14)}>
              {ln}
            </text>
          ))}
        </g>,
      );
    });
  } else {
    const labW = 250 * u;
    const valRoom = 190 * u;
    const x0 = box.x + labW;
    const x1 = box.x + box.w - valRoom;
    const top = box.y;
    const bottom = box.y + box.h - legH;
    const slot = (bottom - top) / N;
    const bh = Math.min(slot * 0.62, 96 * u);
    const xv = (v: number) => x0 + ((v - sc.min) / (sc.max - sc.min)) * (x1 - x0);
    if (showGrid) {
      for (let g = sc.min; g <= sc.max + 1e-9; g += sc.step) {
        content.push(<line key={'g' + g} x1={xv(g)} x2={xv(g)} y1={top} y2={bottom} stroke={ink} strokeOpacity={g === 0 ? 0.4 : 0.1} strokeWidth={(g === 0 ? 3 : 2) * u} opacity={gridT} />);
      }
    }
    bars.forEach((b, i) => {
      const t = barT(i);
      const cyy = top + slot * (i + 0.5);
      const col = colorOf(b.kind);
      const a = b.kind === 'total' ? 0 : b.from;
      const bEnd = b.kind === 'total' ? b.v : b.cum;
      const cur = lerp(a, bEnd, t);
      const xl = xv(Math.min(a, cur));
      const xr = xv(Math.max(a, cur));
      if (showConnectors && i < N - 1) {
        const ct = prog(frame, s0 + i * per + 14 / speed, s0 + i * per + 28 / speed);
        content.push(<line key={'c' + i} x1={xv(b.cum)} x2={xv(b.cum)} y1={cyy + bh / 2} y2={cyy + bh / 2 + (slot - bh) * ct} stroke={ink} strokeOpacity={0.4} strokeWidth={2 * u} strokeDasharray={`${6 * u} ${6 * u}`} />);
      }
      content.push(
        <g key={i}>
          {wrapLines(b.label, labW - 24 * u, fs, 0.56, 2).map((ln, k, arr) => (
            <text key={k} x={x0 - 18 * u} y={cyy + fs * 0.35 + (k - (arr.length - 1) / 2) * fs * 1.15} textAnchor="end" fontFamily={font} fontWeight={600} fontSize={fs} fill={ink} fillOpacity={0.85} opacity={prog(frame, s0 + i * per, s0 + i * per + 14)}>
              {ln}
            </text>
          ))}
          <rect x={xl} y={cyy - bh / 2} width={Math.max(0, xr - xl)} height={bh} rx={Math.min(8 * u, bh / 5)} fill={col} />
          <text x={xv(Math.max(b.hi, a)) + 14 * u} y={cyy + vfs * 0.36} fontFamily={font} fontWeight={700} fontSize={vfs} fill={ink} opacity={clamp(t * 2 - 0.6)} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(b.v * t, decimals, prefix, suffix, b.kind !== 'total')}
          </text>
        </g>,
      );
    });
  }

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} />
        {content}
        {showLegend && legItems.length > 0 && (
          <Legend
            items={legItems}
            x={box.x + (box.w - Math.min(box.w, legItems.length * 360 * u)) / 2}
            y={box.y + box.h - legH + 24 * u}
            w={Math.min(box.w, legItems.length * 360 * u)}
            cols={legItems.length}
            rowH={legRowH}
            size={legSize}
            ink={ink}
            fontFamily={font}
            frame={frame}
            start={startAt + 20}
            stagger={5}
            align="center"
          />
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const waterfallBridge = defineMotion<Props>({
  id: 'waterfall-bridge',
  title: 'Waterfall bridge',
  category: 'data',
  description:
    'A waterfall / bridge chart: an opening total, then floating increase and decrease bars that grow one after another from the running level, joined by dashed connectors, with signed count-up values and a closing total; vertical on 16:9 and 1:1, horizontal on 9:16.',
  source: ['original round-3 chart motion'],
  useFor: 'Explaining how one number became another: revenue bridge, profit walk, budget variance, headcount change, price-volume-mix. Give the opening total, the deltas and let the end total compute itself.',
  durationInFrames: 180,
  defaultProps: {
    steps: STEPS,
    autoTotal: true,
    endLabel: 'Closing',
    title: 'From opening to closing',
    subtitle: 'What moved the number, in thousands',
    prefix: '',
    suffix: 'K',
    decimals: 0,
    showConnectors: true,
    showGrid: true,
    showLegend: true,
    increaseLabel: 'Increase',
    decreaseLabel: 'Decrease',
    totalLabel: 'Total',
    increaseColor: '#16B39A',
    decreaseColor: '#E5487F',
    totalColor: '#2F6FED',
    background: '#F5F3EE',
    ink: '#18212B',
    fontFamily: '',
    startAt: 10,
    speed: 1,
  },
  propDocs: {
    steps: 'bars in order [{label, value, total?}]; total:true sets the running level (usually the first), otherwise value is a +/- change',
    autoTotal: 'append a closing total bar computed from the steps',
    endLabel: 'label of the closing total bar',
    title: 'headline (empty = none)',
    subtitle: 'small line under the headline (empty = none)',
    prefix: 'text before numbers, e.g. "$"',
    suffix: 'text after numbers, e.g. "K", "%"',
    decimals: 'decimal places',
    showConnectors: 'dashed lines joining bars at the running level',
    showGrid: 'value gridlines (with axis labels on 16:9 and 1:1)',
    showLegend: 'increase / decrease / total legend',
    increaseLabel: 'legend text for increases (empty = hide entry)',
    decreaseLabel: 'legend text for decreases',
    totalLabel: 'legend text for totals',
    increaseColor: 'colour of increase bars',
    decreaseColor: 'colour of decrease bars',
    totalColor: 'colour of total bars',
    background: 'page colour, or "transparent"',
    ink: 'text and grid colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the first bar starts',
    speed: 'animation speed multiplier',
  },
  component: WaterfallBridge,
  tags: ['waterfall', 'bridge', 'variance', 'walk', 'finance', 'chart', 'data', 'increase', 'decrease', 'infographic', 'count-up', 'legend', 'overlay'],
});
