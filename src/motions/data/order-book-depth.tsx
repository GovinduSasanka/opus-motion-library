import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {n2, rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Order-book depth chart: two stepped cumulative curves (bids rising to the left, asks rising to the right)
 * grow out from the mid price, then breathe as levels refill and get eaten. A dashed mid line carries a
 * ticking price tag, the spread readout sits under the title, and small trade pings fire at the mid.
 * All numbers are clearly sample data (props), never live market data.
 */
type Props = {
  title: string;
  subtitle: string;
  pair: string;
  midPrice: number;
  tick: number;
  levels: number;
  decimals: number;
  bidColor: string;
  askColor: string;
  background: string;
  ink: string;
  gridColor: string;
  seed: number;
  liveliness: number;
};

const levelSizes = (seed: number, side: string, n: number, frame: number, live: number) => {
  const r = rng(`${seed}-${side}`);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const base = 0.4 + r() * 1.2 + (r() < 0.12 ? 2.2 * r() : 0); // occasional "wall"
    const wob = 1 + live * 0.45 * n2(`${seed}${side}`, i * 0.35, frame * 0.025);
    out.push(Math.max(0.05, base * wob));
  }
  return out;
};

const OrderBookDepth: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const n = Math.max(6, Math.round(p.levels));
  const live = clamp(p.liveliness, 0, 2);

  // chart box
  const box = portrait
    ? {x0: w * 0.08, x1: w * 0.92, y0: h * 0.32, y1: h * 0.8}
    : {x0: w * 0.07, x1: w * 0.93, y0: h * 0.3, y1: h * 0.82};
  const midX = (box.x0 + box.x1) / 2;
  const halfW = (box.x1 - box.x0) / 2;

  const bids = levelSizes(p.seed, 'bid', n, frame, live);
  const asks = levelSizes(p.seed, 'ask', n, frame, live);
  const cum = (a: number[]) => a.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []);
  const cb = cum(bids);
  const ca = cum(asks);
  const maxCum = Math.max(cb[n - 1], ca[n - 1]) * 1.12;

  const grow = prog(frame, 6, 46, ease.out);
  const gap = halfW * 0.035; // visual spread
  const stepW = (halfW - gap) / n;
  const yOf = (v: number) => lerp(box.y1, box.y0, v / maxCum);

  const sidePath = (c: number[], dir: -1 | 1) => {
    const shown = grow * n;
    let d = `M${(midX + dir * gap).toFixed(1)} ${box.y1.toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      if (i >= shown) break;
      const xa = midX + dir * (gap + i * stepW);
      const xb = midX + dir * (gap + Math.min(i + 1, shown) * stepW);
      const y = yOf(c[i]);
      d += `L${xa.toFixed(1)} ${y.toFixed(1)}L${xb.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };
  const bidLine = sidePath(cb, -1);
  const askLine = sidePath(ca, 1);
  const endX = (dir: -1 | 1) => midX + dir * (gap + grow * n * stepW);
  const bidFill = `${bidLine}L${endX(-1).toFixed(1)} ${box.y1.toFixed(1)}Z`;
  const askFill = `${askLine}L${endX(1).toFixed(1)} ${box.y1.toFixed(1)}Z`;

  // mid price drifts on the tick grid
  const driftTicks = Math.round(n2(`${p.seed}mid`, 0.3, frame * 0.012) * 6 * live);
  const mid = p.midPrice + driftTicks * p.tick;
  const spread = p.tick * (1 + Math.round(Math.abs(n2(`${p.seed}spr`, 1.7, frame * 0.03)) * 2 * live));
  const fmt = (v: number) => v.toLocaleString('en-US', {minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals});

  const txtIn = prog(frame, 0, 18, ease.out);
  const midIn = prog(frame, 30, 50, ease.out);
  const sideIn = prog(frame, 40, 60, ease.out);

  // trade pings at the mid every ~22 frames after the build
  const pings = [] as {x: number; y: number; t: number; col: string}[];
  for (let k = 0; k < 6; k++) {
    const start = 50 + k * 22;
    const t = (frame - start) / 24;
    if (t < 0 || t > 1) continue;
    const r = rng(`${p.seed}-ping-${k}`);
    const buy = r() > 0.5;
    pings.push({x: midX + (buy ? 1 : -1) * gap, y: lerp(box.y1, box.y0, 0.08 + r() * 0.12), t, col: buy ? p.askColor : p.bidColor});
  }

  const fs = portrait ? 1.05 : 1;
  const gridRows = 4;
  const priceLabelsN = portrait ? 2 : 3;
  const id = `obd-${p.seed}`;

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.bidColor} stopOpacity={0.42} />
            <stop offset="1" stopColor={p.bidColor} stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.askColor} stopOpacity={0.42} />
            <stop offset="1" stopColor={p.askColor} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        {/* grid */}
        {Array.from({length: gridRows + 1}, (_, i) => {
          const y = lerp(box.y1, box.y0, i / gridRows);
          return <line key={i} x1={box.x0} x2={box.x1} y1={y} y2={y} stroke={p.gridColor} strokeWidth={1.2 * u} opacity={txtIn} />;
        })}
        {/* fills + steps */}
        <path d={bidFill} fill={`url(#${id}-b)`} />
        <path d={askFill} fill={`url(#${id}-a)`} />
        <path d={bidLine} fill="none" stroke={p.bidColor} strokeWidth={4 * u} strokeLinejoin="round" />
        <path d={askLine} fill="none" stroke={p.askColor} strokeWidth={4 * u} strokeLinejoin="round" />
        {/* mid line */}
        <line x1={midX} x2={midX} y1={box.y0 - 10 * u} y2={box.y1} stroke={p.ink} strokeWidth={2 * u} strokeDasharray={`${8 * u} ${8 * u}`} opacity={0.55 * midIn} />
        {pings.map((q, i) => (
          <g key={i} opacity={(1 - q.t) * midIn}>
            <circle cx={q.x} cy={q.y} r={(8 + 40 * ease.out(q.t)) * u} fill="none" stroke={q.col} strokeWidth={3 * u} />
            <circle cx={q.x} cy={q.y} r={7 * u} fill={q.col} />
          </g>
        ))}
        {/* price axis labels */}
        {Array.from({length: priceLabelsN * 2 + 1}, (_, i) => {
          const k = i - priceLabelsN;
          const x = midX + (k / priceLabelsN) * (halfW * 0.9);
          const price = mid + k * Math.round(n / priceLabelsN * 0.9) * p.tick;
          return (
            <text key={i} x={x} y={box.y1 + 34 * u} fill={p.ink} opacity={0.5 * txtIn} fontFamily={fonts.mono} fontSize={20 * u * fs} textAnchor="middle">
              {fmt(price)}
            </text>
          );
        })}
        {/* side labels */}
        <text x={box.x0} y={box.y0 - 18 * u} fill={p.bidColor} opacity={sideIn} fontFamily={fonts.mono} fontWeight={700} fontSize={22 * u * fs}>
          BIDS {cb[n - 1].toFixed(1)}
        </text>
        <text x={box.x1} y={box.y0 - 18 * u} fill={p.askColor} opacity={sideIn} fontFamily={fonts.mono} fontWeight={700} fontSize={22 * u * fs} textAnchor="end">
          {ca[n - 1].toFixed(1)} ASKS
        </text>
      </Svg>
      {/* header */}
      <div
        style={{
          position: 'absolute',
          left: box.x0,
          right: w - box.x1,
          top: portrait ? h * 0.08 : h * 0.06,
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: portrait ? 'flex-start' : 'flex-end',
          gap: 18 * u,
          color: p.ink,
          opacity: txtIn,
          transform: `translateY(${(1 - txtIn) * 20 * u}px)`,
        }}
      >
        <div>
          <div style={{fontFamily: fonts.mono, fontSize: 20 * u * fs, letterSpacing: 3 * u, opacity: 0.55}}>{p.subtitle}</div>
          <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 64 * u * fs, lineHeight: 1.05}}>{p.title}</div>
        </div>
        <div style={{textAlign: portrait ? 'left' : 'right', opacity: midIn}}>
          <div style={{fontFamily: fonts.mono, fontSize: 20 * u * fs, opacity: 0.55, letterSpacing: 2 * u}}>
            {p.pair} · SPREAD {fmt(spread)}
          </div>
          <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 52 * u * fs}}>{fmt(mid)}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const orderBookDepth = defineMotion<Props>({
  id: 'order-book-depth',
  title: 'Order-book depth chart',
  category: 'data',
  description:
    'Stepped cumulative bid (left) and ask (right) depth curves grow out from a dashed mid line, then breathe as levels refill; a ticking mid price, spread readout and trade pings sit on a dark trading-desk panel.',
  source: ['original'],
  useFor: 'Finance and trading explainers: liquidity, spread, supply vs demand, market depth, fintech product heroes (sample data only).',
  durationInFrames: 180,
  defaultProps: {
    title: 'Market depth',
    subtitle: 'SAMPLE ORDER BOOK',
    pair: 'ABC / XYZ',
    midPrice: 100,
    tick: 0.05,
    levels: 24,
    decimals: 2,
    bidColor: '#2FD39A',
    askColor: '#FF5C6C',
    background: '#0E1320',
    ink: '#E9EEF7',
    gridColor: '#222B3D',
    seed: 7,
    liveliness: 1,
  },
  propDocs: {
    title: 'headline above the chart',
    subtitle: 'small caps label above the headline (keep it saying sample data unless you pass real numbers)',
    pair: 'instrument label shown next to the spread (fictional by default)',
    midPrice: 'centre price the book drifts around',
    tick: 'price step between levels',
    levels: 'number of price levels per side (6+)',
    decimals: 'decimals in price readouts',
    bidColor: 'buy side colour',
    askColor: 'sell side colour',
    background: 'panel background',
    ink: 'text and mid-line colour',
    gridColor: 'horizontal grid line colour',
    seed: 'changes the sample book shape',
    liveliness: '0 = frozen book, 1 = normal churn, 2 = frantic',
  },
  component: OrderBookDepth,
});
