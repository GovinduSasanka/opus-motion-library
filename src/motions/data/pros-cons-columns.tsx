import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeOut3, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Icon, fitText, inkOn} from '../../core/r3-explain';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Two cards side by side (stacked in portrait): PROS and CONS. Items appear alternately, each with a drawn tick
 * or cross, and an optional verdict pill closes the beat.
 */
type Props = {
  title: string;
  prosLabel: string;
  consLabel: string;
  pros: string[];
  cons: string[];
  verdict: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  card: string;
  fontFamily: string;
  startAt: number;
  stagger: number;
};

const ProsConsColumns: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = p.fontFamily || fonts.grotesk;
  const pros = (p.pros || []).slice(0, 6);
  const cons = (p.cons || []).slice(0, 6);
  const rowsN = Math.max(1, pros.length, cons.length);
  const titleH = p.title ? (portrait ? 120 : 130) * u : 0;
  const verdictH = p.verdict ? 110 * u : 0;
  const mx = w * 0.05;
  const topY = h * 0.05 + titleH;
  const availH = h - topY - h * 0.05 - verdictH;
  const gap = 36 * u;
  const cw = portrait ? w - mx * 2 : (w - mx * 2 - gap) / 2;
  const chH = portrait ? (availH - gap) / 2 : availH;
  const headH = 96 * u;
  const rh = Math.min((chH - headH - 30 * u) / rowsN, portrait ? 150 * u : 120 * u);
  const per = Math.max(8, p.stagger || 22);
  const t0 = 26;
  const titleIn = easeOut3(sseg(f, 0, 20));
  const cardIn = (k: number) => easeOut3(sseg(f, 6 + k * 8, 26 + k * 8));
  const fsAll = Math.min(...[...pros, ...cons].map((s) => fitText(s, cw - 150 * u, rh * 0.9, rh * 0.42, 16 * u, 0.55, 1.15).fs), rh * 0.42, (portrait ? 54 : 44) * u);
  const showBg = p.background !== 'transparent';
  const vk = backOut(sseg(f, t0 + rowsN * 2 * per + 10, t0 + rowsN * 2 * per + 28), 1.8);
  const cardPos = (side: 0 | 1) => (portrait ? {x: mx, y: topY + side * (chH + gap)} : {x: mx + side * (cw + gap), y: topY});

  const column = (side: 0 | 1, items: string[], label: string, col: string, icon: string) => {
    const {x, y} = cardPos(side);
    const ci = cardIn(side);
    return (
      <g key={side} opacity={ci} transform={`translate(0 ${(1 - ci) * 40 * u})`}>
        <rect x={x} y={y} width={cw} height={chH} rx={28 * u} fill={p.card} stroke={withAlpha(col, 0.5)} strokeWidth={4 * u} />
        <path d={`M${x} ${y + headH} V${y + 28 * u} a${28 * u} ${28 * u} 0 0 1 ${28 * u} ${-28 * u} H${x + cw - 28 * u} a${28 * u} ${28 * u} 0 0 1 ${28 * u} ${28 * u} V${y + headH} z`} fill={col} />
        <circle cx={x + 58 * u} cy={y + headH / 2} r={26 * u} fill={withAlpha('#000000', 0.18)} />
        <Icon name={icon} x={x + 58 * u} y={y + headH / 2} size={30 * u} color={inkOn(col)} sw={3.2} progress={sseg(f, 14 + side * 8, 30 + side * 8)} />
        <text x={x + 108 * u} y={y + headH / 2 + 14 * u} fontFamily={fonts.display} fontSize={40 * u} letterSpacing={4 * u} fill={inkOn(col)}>
          {label}
        </text>
        {items.map((s, i) => {
          const at = t0 + (i * 2 + side) * per;
          const k = easeOut3(sseg(f, at, at + 16));
          const dk = backOut(sseg(f, at + 4, at + 20), 2);
          const ry = y + headH + 24 * u + i * rh;
          const fit = fitText(s, cw - 150 * u, rh * 0.9, fsAll, 14 * u, 0.55, 1.15);
          return (
            <g key={i} opacity={k} transform={`translate(${(side === 0 ? -1 : 1) * (1 - k) * 50 * u} 0)`}>
              <g transform={`translate(${x + 62 * u} ${ry + rh * 0.5}) scale(${Math.max(0.001, dk)})`}>
                <circle r={rh * 0.3} fill={withAlpha(col, 0.18)} />
                <Icon name={icon} x={0} y={0} size={rh * 0.34} color={col} sw={3.4} progress={sseg(f, at + 4, at + 18)} />
              </g>
              <text fontFamily={font} fontWeight={600} fontSize={fit.fs} fill={p.ink}>
                {fit.lines.map((l, j) => (
                  <tspan key={j} x={x + 62 * u + rh * 0.5} y={ry + rh * 0.5 + fit.fs * 0.34 + (j - (fit.lines.length - 1) / 2) * fit.fs * fit.lh}>
                    {l}
                  </tspan>
                ))}
              </text>
              {i < items.length - 1 ? <line x1={x + 36 * u} x2={x + cw - 36 * u} y1={ry + rh} y2={ry + rh} stroke={withAlpha(p.ink, 0.1)} strokeWidth={2 * u} /> : null}
            </g>
          );
        })}
      </g>
    );
  };

  const vw = Math.min(w * 0.9, p.verdict.length * 24 * u + 120 * u);
  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined}}>
      <Svg>
        {p.title ? (
          <text x={w / 2} y={h * 0.05 + titleH * 0.62} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={Math.min((portrait ? 66 : 60) * u, (w * 0.9) / Math.max(8, p.title.length * 0.56))} fill={p.ink} opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * -20 * u})`}>
            {p.title}
          </text>
        ) : null}
        {column(0, pros, p.prosLabel, p.accent, 'check')}
        {column(1, cons, p.consLabel, p.accent2, 'cross')}
        {p.verdict ? (
          <g transform={`translate(${w / 2} ${h - h * 0.05 - verdictH / 2 + 4 * u}) scale(${Math.max(0.001, vk)})`}>
            <rect x={-vw / 2} y={-34 * u} width={vw} height={68 * u} rx={34 * u} fill={p.ink} />
            <text textAnchor="middle" y={11 * u} fontFamily={font} fontWeight={700} fontSize={Math.min(34 * u, (vw - 60 * u) / Math.max(6, p.verdict.length * 0.56))} fill={inkOn(p.ink)}>
              {p.verdict}
            </text>
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const prosConsColumns = defineMotion<Props>({
  id: 'pros-cons-columns',
  title: 'Pros and cons columns',
  category: 'data',
  description: 'Two cards (PROS in green, CONS in red) with coloured headers; items slide in alternately, each marked by a drawn tick or cross, and a verdict pill pops at the end.',
  source: ['original (round 3)'],
  useFor: 'Decision videos, review / comparison summaries, "should you…?" explainers, tech / money / lifestyle trade-offs — pass `pros`, `cons` and an optional `verdict`.',
  durationInFrames: 270,
  defaultProps: {
    title: 'Working from home',
    prosLabel: 'PROS',
    consLabel: 'CONS',
    pros: ['No commute', 'Flexible hours', 'Quiet focus time', 'Lower daily costs'],
    cons: ['Harder to switch off', 'Less face time', 'Feels isolating', 'Home distractions'],
    verdict: 'Great if you plan for the downsides',
    background: '#F1EEE7',
    ink: '#1B1D22',
    accent: '#1E9E6A',
    accent2: '#DB4437',
    card: '#FFFFFF',
    fontFamily: '',
    startAt: 0,
    stagger: 22,
  },
  propDocs: {
    title: 'heading above the columns (empty = none)',
    prosLabel: 'header of the positive card',
    consLabel: 'header of the negative card',
    pros: 'positive items (up to 6)',
    cons: 'negative items (up to 6)',
    verdict: 'optional closing pill (empty = none)',
    background: "backdrop colour or 'transparent'",
    ink: 'text colour',
    accent: 'pros colour',
    accent2: 'cons colour',
    card: 'card fill',
    fontFamily: 'optional CSS font-family (empty = grotesk)',
    startAt: 'frame the title starts',
    stagger: 'frames between items',
  },
  component: ProsConsColumns,
  tags: ['pros', 'cons', 'compare', 'comparison', 'tick', 'cross', 'checklist', 'advantages', 'disadvantages', 'decision', 'review', 'columns', 'explainer', 'education'],
});
