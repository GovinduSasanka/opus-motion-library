import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease} from '../../core/ease';
import {bgOf, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A cup fills with a layered drink: a thin stream pours each layer in turn (espresso, milk, foam ...), the surface ripples,
 * layers stack with soft interfaces and, on the side, each layer is named with a leader line. `drinkLayers` is the recipe.
 */
type Layer = {label: string; color: string; amount: number; detail?: string};
type Props = {
  title: string;
  subtitle: string;
  cupLabel: string;
  drinkLayers: Layer[];
  cup: string;
  pourFrames: number;
  steam: boolean;
  background: string;
  ink: string;
  accent: string;
  startAt: number;
};

const CoffeePourCup: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const layers = (p.drinkLayers.length ? p.drinkLayers : [{label: 'Drink', color: '#6B4226', amount: 1}]).slice(0, 6);
  const n = layers.length;
  const amt = layers.map((l) => Math.max(0.05, l.amount));
  const total = amt.reduce((a, b) => a + b, 0);
  const mug = p.cup === 'mug';

  // layout
  const cs = u * (portrait ? 1.5 : 1.42);
  const cupX = w * (portrait ? 0.3 : 0.34);
  const baseY = h * (portrait ? 0.76 : 0.86);
  const H = (mug ? 330 : 430) * cs;
  const bw = (mug ? 140 : 108) * cs;
  const tw = (mug ? 140 : 150) * cs;
  const fillTop = H * 0.9;
  const pourF = Math.max(30, p.pourFrames);
  const fill0 = 34;
  const fillEnd = fill0 + pourF;

  // layer timeline
  const starts: number[] = [];
  const ends: number[] = [];
  let cursor = fill0;
  for (let i = 0; i < n; i++) {
    starts.push(cursor);
    cursor += (pourF * amt[i]) / total;
    ends.push(cursor);
  }
  const cum: number[] = [0];
  for (let i = 0; i < n; i++) cum.push(cum[i] + amt[i] / total);
  const levelAt = (i: number) => cum[i] + (amt[i] / total) * ease.sine(sseg(t, starts[i], ends[i]));

  let active = -1;
  for (let i = 0; i < n; i++) if (t >= starts[i] && t < ends[i]) active = i;
  const surfaceFrac = active >= 0 ? levelAt(active) : t >= fillEnd ? 1 : 0;

  const cupIn = ease.out(sseg(t, 0, 22));
  const inner = (y: number) => {
    // half-width of the interior at height y above the base (0..H)
    const k = y / H;
    return (mug ? tw - 8 * cs : bw + (tw - bw) * k) - 8 * cs * (mug ? 0 : 0.6);
  };

  const interior = mug
    ? `M ${-tw + 10 * cs} ${-H} L ${tw - 10 * cs} ${-H} L ${tw - 10 * cs} ${-40 * cs} Q ${tw - 10 * cs} ${-8 * cs} ${tw - 50 * cs} ${-8 * cs} L ${-tw + 50 * cs} ${-8 * cs} Q ${-tw + 10 * cs} ${-8 * cs} ${-tw + 10 * cs} ${-40 * cs} Z`
    : `M ${-tw + 8 * cs} ${-H} L ${tw - 8 * cs} ${-H} L ${bw - 8 * cs} ${-18 * cs} Q ${bw - 10 * cs} ${-8 * cs} ${bw - 30 * cs} ${-8 * cs} L ${-bw + 30 * cs} ${-8 * cs} Q ${-bw + 10 * cs} ${-8 * cs} ${-bw + 8 * cs} ${-18 * cs} Z`;
  const outer = mug
    ? `M ${-tw} ${-H} L ${tw} ${-H} L ${tw} ${-40 * cs} Q ${tw} 0 ${tw - 50 * cs} 0 L ${-tw + 50 * cs} 0 Q ${-tw} 0 ${-tw} ${-40 * cs} Z`
    : `M ${-tw} ${-H} L ${tw} ${-H} L ${bw} ${-18 * cs} Q ${bw} 0 ${bw - 26 * cs} 0 L ${-bw + 26 * cs} 0 Q ${-bw} 0 ${-bw} ${-18 * cs} Z`;

  // wavy top for a layer
  const wavy = (yTop: number, amp: number, ph: number, x0: number, x1: number) => {
    let d = `M ${x0} ${-8 * cs}`;
    d += ` L ${x0} ${yTop}`;
    const steps = 18;
    for (let s = 1; s <= steps; s++) {
      const x = x0 + ((x1 - x0) * s) / steps;
      d += ` L ${x} ${yTop + Math.sin(x / (22 * cs) + ph) * amp}`;
    }
    d += ` L ${x1} ${-8 * cs} Z`;
    return d;
  };

  const layerEls: React.ReactNode[] = [];
  const blends: React.ReactNode[] = [];
  const midY: number[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const lv = t >= starts[i] ? levelAt(i) : cum[i];
    const lvAll = t >= starts[i] ? Math.min(lv, cum[i + 1]) : cum[i];
    if (t < starts[i]) continue;
    const yTop = -8 * cs - (fillTop - 8 * cs) * lvAll;
    const isActive = active === i;
    const settle = isActive ? 1 : 1 - sseg(t, ends[i], ends[i] + 26);
    const amp = (isActive ? 4.5 : 5 * settle) * cs;
    layerEls.push(<path key={'l' + i} d={wavy(yTop, amp, t * 0.34 + i, -tw, tw)} fill={layers[i].color} />);
  }
  for (let i = 0; i < n; i++) {
    midY.push(-8 * cs - (fillTop - 8 * cs) * ((cum[i] + cum[i + 1]) / 2));
    if (i > 0 && t >= starts[i] + 4) {
      const yy = -8 * cs - (fillTop - 8 * cs) * cum[i];
      blends.push(
        <rect key={'b' + i} x={-tw} y={yy - 14 * cs} width={tw * 2} height={28 * cs} fill={`url(#cpc-blend-${i})`} opacity={0.85 * ease.out(sseg(t, starts[i], starts[i] + 24))} />,
      );
    }
  }

  // stream
  const surfY = -8 * cs - (fillTop - 8 * cs) * surfaceFrac;
  const streamOn = active >= 0 ? ease.out(sseg(t, starts[active] - 3, starts[active] + 3)) : 0;
  const streamW = 15 * cs * (1 - 0.18 * Math.sin(t * 0.6));
  const streamTop = -H - 340 * cs;
  const streamColor = active >= 0 ? layers[active].color : layers[0].color;
  const streamEnd = t > ends[n - 1] - 4 ? 1 - ease.in(sseg(t, ends[n - 1] - 4, ends[n - 1] + 4)) : 1;

  // label rows on the side
  const labelX = w * (portrait ? 0.6 : 0.56);
  const labelW = w - labelX - w * 0.05;
  const rowMin = (portrait ? 78 : 74) * u;
  const ys: number[] = [];
  // top layer first (physical order), push apart
  const order = Array.from({length: n}, (_, i) => n - 1 - i);
  let last = -1e9;
  const titleBottom = portrait ? h * 0.24 : h * 0.3;
  for (const i of order) {
    let y = baseY + midY[i];
    y = Math.max(y, last + rowMin, titleBottom);
    ys[i] = y;
    last = y;
  }

  const labelEls = order.map((i) => {
    const a = starts[i];
    const op = ease.out(sseg(t, a, a + 12));
    const y = ys[i];
    const lyCup = baseY + midY[i];
    const edgeX = cupX + inner(-midY[i]) + 12 * cs;
    return (
      <React.Fragment key={i}>
        <line x1={edgeX} y1={lyCup} x2={labelX - 16 * u} y2={y} stroke={withAlpha(p.ink, 0.35)} strokeWidth={2.2 * u} strokeDasharray={`${6 * u} ${6 * u}`} opacity={op} />
        <circle cx={edgeX} cy={lyCup} r={5 * u} fill={p.ink} opacity={op} />
        <foreignObject x={labelX} y={y - rowMin / 2} width={labelW} height={rowMin} style={{opacity: op, overflow: 'visible'}}>
          <div style={{display: 'flex', alignItems: 'center', height: rowMin, gap: 16 * u, transform: `translateX(${(1 - op) * 24 * u}px)`}}>
            <div style={{width: 34 * u, height: 34 * u, borderRadius: 10 * u, background: layers[i].color, flex: 'none', boxShadow: `inset 0 0 0 ${2.5 * u}px ${withAlpha('#ffffff', 0.35)}`}} />
            <div style={{fontFamily: fonts.sans, color: p.ink, minWidth: 0}}>
              <div style={{fontWeight: 800, fontSize: 33 * u, lineHeight: 1.1, whiteSpace: 'nowrap'}}>{layers[i].label}</div>
              {layers[i].detail ? <div style={{fontFamily: fonts.mono, fontSize: 21 * u, color: withAlpha(p.ink, 0.6), marginTop: 2 * u}}>{layers[i].detail}</div> : null}
            </div>
          </div>
        </foreignObject>
      </React.Fragment>
    );
  });

  // steam
  const steamOn = p.steam ? ease.out(sseg(t, fillEnd + 4, fillEnd + 26)) : 0;
  const steamEls: React.ReactNode[] = [];
  if (steamOn > 0) {
    for (let s = 0; s < 3; s++) {
      const ph = (t * 0.045 + s * 0.33) % 1;
      const x0 = (s - 1) * 56 * cs;
      let d = `M ${x0} ${-H - 12 * cs}`;
      for (let k = 1; k <= 8; k++) {
        const yy = -H - 12 * cs - (k / 8) * 150 * cs;
        d += ` L ${x0 + Math.sin(k * 0.9 + ph * 6.28 + s) * 14 * cs} ${yy}`;
      }
      steamEls.push(<path key={s} d={d} fill="none" stroke={withAlpha(p.ink, 0.28 * steamOn * (0.6 + 0.4 * Math.sin(ph * 6.28 + s)))} strokeWidth={9 * cs} strokeLinecap="round" />);
    }
  }

  const onPill = onColor(p.accent);
  const labelIn = ease.out(sseg(t, fillEnd + 4, fillEnd + 20));
  const tIn = ease.out(sseg(t, 0, 18));

  const gid = 'cpc';
  const handle = mug ? (
    <path d={`M ${tw - 4 * cs} ${-H * 0.78} C ${tw + 120 * cs} ${-H * 0.82} ${tw + 120 * cs} ${-H * 0.2} ${tw - 30 * cs} ${-H * 0.22}`} fill="none" stroke={withAlpha('#ffffff', 0.6)} strokeWidth={26 * cs} strokeLinecap="round" />
  ) : null;

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, overflow: 'hidden'}}>
      <Svg>
        <defs>
          <clipPath id={`${gid}-clip`}>
            <path d={interior} />
          </clipPath>
          {layers.map((l, i) =>
            i > 0 ? (
              <linearGradient key={i} id={`${gid}-blend-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={l.color} stopOpacity={0} />
                <stop offset="0.5" stopColor={mixHex(l.color, layers[i - 1].color, 0.5)} stopOpacity={0.9} />
                <stop offset="1" stopColor={layers[i - 1].color} stopOpacity={0} />
              </linearGradient>
            ) : null,
          )}
          <linearGradient id={`${gid}-stream`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={streamColor} stopOpacity={0} />
            <stop offset="0.25" stopColor={streamColor} stopOpacity={1} />
            <stop offset="1" stopColor={streamColor} stopOpacity={1} />
          </linearGradient>
        </defs>
        {/* table shadow */}
        <ellipse cx={cupX} cy={baseY + 6 * cs} rx={(mug ? 230 : 190) * cs} ry={18 * cs} fill={withAlpha('#000000', 0.18 * cupIn)} />
        {mug ? <ellipse cx={cupX} cy={baseY + 2 * cs} rx={215 * cs} ry={16 * cs} fill={withAlpha(p.ink, 0.12)} stroke={withAlpha('#ffffff', 0.5)} strokeWidth={3 * cs} /> : null}
        <g transform={`translate(${cupX} ${baseY + (1 - cupIn) * 60 * u})`} opacity={cupIn}>
          {handle}
          <path d={outer} fill={withAlpha('#ffffff', 0.12)} />
          <g clipPath={`url(#${gid}-clip)`}>
            {layerEls}
            {blends}
          </g>
          {/* ripple at the pour point */}
          {active >= 0 && streamOn > 0 ? (
            <>
              <ellipse cx={0} cy={surfY} rx={(24 + (t % 12) * 3.4) * cs} ry={(6 + (t % 12) * 0.5) * cs} fill="none" stroke={withAlpha('#ffffff', 0.6 * (1 - (t % 12) / 12))} strokeWidth={3 * cs} clipPath={`url(#${gid}-clip)`} />
            </>
          ) : null}
          {/* stream */}
          {active >= 0 && streamOn > 0 ? <rect x={-streamW / 2} y={streamTop} width={streamW} height={surfY - streamTop} fill={`url(#${gid}-stream)`} opacity={streamOn * streamEnd} rx={streamW / 2} /> : null}
          {/* glass edge + highlights */}
          <path d={outer} fill="none" stroke={withAlpha('#ffffff', mug ? 0.85 : 0.6)} strokeWidth={(mug ? 12 : 5) * cs} strokeLinejoin="round" />
          <path d={`M ${-tw * 0.78} ${-H * 0.9} L ${-bw * 0.8} ${-H * 0.14}`} stroke={withAlpha('#ffffff', 0.32)} strokeWidth={14 * cs} strokeLinecap="round" />
          <path d={`M ${tw * 0.82} ${-H * 0.88} L ${bw * 0.86} ${-H * 0.36}`} stroke={withAlpha('#ffffff', 0.18)} strokeWidth={8 * cs} strokeLinecap="round" />
          {steamEls}
          {/* cup label */}
          {p.cupLabel ? (
            <g opacity={labelIn} transform={`translate(0 ${-H * 0.38 + (1 - labelIn) * 12 * cs})`}>
              <rect x={-(bw - 6 * cs)} y={-34 * cs} width={(bw - 6 * cs) * 2} height={68 * cs} rx={14 * cs} fill={p.accent} />
              <text x={0} y={9 * cs} textAnchor="middle" fontFamily={fonts.display} fontSize={Math.min(30 * cs, ((bw - 20 * cs) * 2) / Math.max(5, p.cupLabel.length) * 1.5)} fill={onPill} letterSpacing={2 * cs}>
                {p.cupLabel}
              </text>
            </g>
          ) : null}
        </g>
        {labelEls}
      </Svg>

      <div style={{position: 'absolute', left: labelX, top: portrait ? h * 0.07 : h * 0.1, width: labelW, color: p.ink, opacity: tIn, transform: `translateY(${(1 - tIn) * -18 * u}px)`}}>
        <div style={{fontFamily: fonts.serif, fontWeight: 700, fontSize: (portrait ? 74 : 78) * u, lineHeight: 1.02}}>{p.title}</div>
        <div style={{fontFamily: fonts.mono, fontSize: 22 * u, letterSpacing: 4 * u, color: p.accent, marginTop: 12 * u, textTransform: 'uppercase', fontWeight: 700}}>{p.subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};

export const coffeePourCup = defineMotion<Props>({
  id: 'coffee-pour-cup',
  title: 'Coffee pour: layered cup fills',
  category: 'product',
  description:
    'A glass or mug fills with a layered drink — a thin stream pours each layer in turn, the surface ripples, layers stack with soft interfaces, steam rises, a label sits on the cup and every layer is named on the side with a leader line.',
  source: ['original (round 3)'],
  useFor: 'Cafe and drink promos, "what is in your latte" explainers, cocktail / smoothie / bubble-tea layer builds, recipe reveals — set drinkLayers (label, colour, amount) and the cup label.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Caramel latte',
    subtitle: 'Built in four layers',
    cupLabel: 'LATTE',
    drinkLayers: [
      {label: 'Caramel', color: '#B9742E', amount: 0.7, detail: '2 pumps'},
      {label: 'Espresso', color: '#3B2314', amount: 1, detail: 'double shot'},
      {label: 'Steamed milk', color: '#D9B48A', amount: 2.2, detail: '200 ml'},
      {label: 'Milk foam', color: '#F5EAD7', amount: 0.9, detail: 'silky'},
    ],
    cup: 'glass',
    pourFrames: 120,
    steam: true,
    background: '#F1E6D6',
    ink: '#2B1D12',
    accent: '#C4642B',
    startAt: 0,
  },
  propDocs: {
    title: 'headline (top of the label column)',
    subtitle: 'small caps line under the headline',
    cupLabel: "text on the cup ('' for none)",
    drinkLayers: 'layers bottom to top, up to 6: {label, color, amount (relative height), detail?}',
    cup: "'glass' (tapered latte glass) or 'mug' (straight mug with handle)",
    pourFrames: 'frames the whole fill takes (split between layers by amount)',
    steam: 'rising steam after the pour',
    background: "page colour or 'transparent'",
    ink: 'text colour',
    accent: 'cup label colour and subtitle',
    startAt: 'frame the scene starts',
  },
  component: CoffeePourCup,
  tags: ['coffee', 'latte', 'cafe', 'drink', 'pour', 'layers', 'cup', 'espresso', 'milk', 'cocktail', 'smoothie', 'tea', 'recipe', 'liquid', 'beverage', 'product'],
});
