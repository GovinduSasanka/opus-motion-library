import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, clip, fmt, resolveFont, useChartBox} from '../../core/r3-chart-kit';
import {Check, isClear, mixHex} from '../../core/r3-vertical-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Milestone = {label: string; value: number};
type Props = {
  title: string;
  subtitle: string;
  goal: number;
  saved: number;
  goalLabel: string;
  savedLabel: string;
  reachedLabel: string;
  toGoLabel: string;
  milestones: Milestone[];
  prefix: string;
  suffix: string;
  coins: number;
  background: string;
  liquid: string;
  glass: string;
  ink: string;
  accent: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const MILESTONES: Milestone[] = [
  {label: 'First step', value: 1000},
  {label: 'Halfway there', value: 2500},
  {label: 'Almost done', value: 4000},
  {label: 'Goal', value: 5000},
];

const SavingsGoalJar: React.FC<Props> = ({title, subtitle, goal, saved, goalLabel, savedLabel, reachedLabel, toGoLabel, milestones, prefix, suffix, coins, background, liquid, glass, ink, accent, fontFamily, startAt, speed}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const G = Math.max(1, goal);
  const frac = clamp(saved / G, 0, 1);
  const fillStart = startAt + 16;
  const fillDur = 130 / speed;
  const t = prog(frame, fillStart, fillStart + fillDur, ease.inOut);
  const level = frac * t;
  const reached = saved >= goal;
  const ms = milestones.slice(0, 6).filter((m) => m.value > 0).sort((a, b) => a.value - b.value);

  // jar box
  const side = !portrait;
  const jarArea = side ? {x: box.x, y: box.y, w: box.w * 0.38, h: box.h} : {x: box.x, y: box.y, w: box.w, h: box.h * 0.52};
  const infoArea = side ? {x: box.x + box.w * 0.44, y: box.y, w: box.w * 0.56, h: box.h} : {x: box.x, y: box.y + box.h * 0.55, w: box.w, h: box.h * 0.45};
  const jh = Math.min(jarArea.h, jarArea.w / 0.7);
  const jw = jh * 0.7;
  const jx = jarArea.x + (jarArea.w - jw) / 2;
  const jy = jarArea.y + (jarArea.h - jh) / 2;
  const topY = jy + jh * 0.24; // liquid at 100%
  const botY = jy + jh - 6 * u;
  const surf = botY - level * (botY - topY);
  const levelY = (v: number) => botY - clamp(v / G) * (botY - topY);
  const r = jw * 0.14;
  const nl = jx + jw * 0.17;
  const nr = jx + jw * 0.83;
  const ny = jy + jh * 0.08;
  const sh = jy + jh * 0.26;
  const jarPath = `M${nl},${jy} H${nr} V${ny} C${nr},${ny + jh * 0.05} ${jx + jw},${jy + jh * 0.14} ${jx + jw},${sh} V${jy + jh - r} Q${jx + jw},${jy + jh} ${jx + jw - r},${jy + jh} H${jx + r} Q${jx},${jy + jh} ${jx},${jy + jh - r} V${sh} C${jx},${jy + jh * 0.14} ${nl},${ny + jh * 0.05} ${nl},${ny}Z`;
  const jarIn = prog(frame, startAt, startAt + 20);
  const id = 'sgj';

  // waves
  const wave = (amp: number, k: number, ph: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const x = jx + (jw * i) / 24;
      pts.push(`${x.toFixed(1)},${(surf + Math.sin(i * k + frame * ph) * amp).toFixed(1)}`);
    }
    return `M${jx},${botY + 10} L${pts.join(' L')} L${jx + jw},${botY + 10}Z`;
  };
  const waveAmp = (5 + 5 * (1 - t)) * u * (level > 0.005 ? 1 : 0);

  // coins
  const nCoins = Math.max(0, Math.round(coins));
  const coinNodes: React.ReactNode[] = [];
  for (let k = 0; k < nCoins; k++) {
    const s0 = fillStart + (k / Math.max(1, nCoins)) * fillDur * 0.9;
    const lt = (frame - s0) / (22 / speed);
    if (lt < 0 || lt > 1.15) continue;
    const cxk = jx + jw * (0.36 + 0.28 * ((k * 0.618) % 1));
    const fromY = jy - jh * 0.35;
    const toY = surf + 6 * u;
    const y = fromY + (toY - fromY) * ease.in(clamp(lt));
    const cr = jw * 0.085;
    const sx = Math.abs(Math.cos(lt * 5 + k));
    const op = 1 - clamp((lt - 0.9) / 0.25);
    coinNodes.push(
      <g key={k} opacity={op}>
        <ellipse cx={cxk} cy={y} rx={cr * Math.max(0.25, sx)} ry={cr} fill={accent} />
        <ellipse cx={cxk} cy={y} rx={cr * Math.max(0.25, sx) * 0.62} ry={cr * 0.62} fill="none" stroke={mixHex(accent, '#000000', 0.25)} strokeWidth={2 * u} />
      </g>,
    );
  }

  // sparkles when the goal is reached
  const doneT = reached ? prog(frame, fillStart + fillDur, fillStart + fillDur + 26) : 0;

  // info
  const colX = infoArea.x;
  const colW = infoArea.w;
  const bigNum = fmt(saved * t, 0, prefix, suffix);
  const fullNum = fmt(saved, 0, prefix, suffix);
  const bigSize = Math.min((portrait ? 150 : 128) * u, colW / Math.max(3, fullNum.length * 0.62));
  const infoTop = side ? infoArea.y + Math.max(0, (infoArea.h - (bigSize * 2.5 + ms.length * 78 * u + 70 * u)) / 2) : infoArea.y;
  const a0 = prog(frame, startAt + 8, startAt + 30);
  const toGo = Math.max(0, goal - saved * t);

  const mRow = Math.min(portrait ? 70 * u : 76 * u, (infoArea.y + infoArea.h - (infoTop + bigSize * 2.3 + 40 * u)) / Math.max(1, ms.length));
  const bg = isClear(background) ? 'transparent' : background;
  const ticks = ms.map((m) => ({...m, y: levelY(m.value), hit: saved * t >= m.value - 0.0001}));

  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <defs>
          <clipPath id={id + '-clip'}>
            <path d={jarPath} />
          </clipPath>
          <linearGradient id={id + '-liq'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(liquid, '#ffffff', 0.18)} />
            <stop offset="1" stopColor={mixHex(liquid, '#000000', 0.25)} />
          </linearGradient>
        </defs>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} startAt={startAt} />
        {/* jar */}
        <g opacity={jarIn}>
          <path d={jarPath} fill={glass} fillOpacity={0.1} />
          <g clipPath={`url(#${id}-clip)`}>
            <path d={wave(waveAmp, 0.9, 0.13)} fill={mixHex(liquid, '#ffffff', 0.15)} fillOpacity={0.55} />
            <path d={wave(waveAmp * 0.8, 0.7, -0.1)} fill={`url(#${id}-liq)`} />
            {/* bubbles */}
            {[0, 1, 2, 3, 4].map((k) => {
              const bp = ((frame * (0.5 + k * 0.13)) / 60 + k * 0.37) % 1;
              const by = botY - bp * Math.max(0, botY - surf - 10 * u);
              return level > 0.04 ? <circle key={k} cx={jx + jw * (0.2 + 0.15 * k)} cy={by} r={(4 + k) * u} fill="#fff" fillOpacity={0.22} /> : null;
            })}
          </g>
          <path d={jarPath} fill="none" stroke={glass} strokeOpacity={0.9} strokeWidth={5 * u} strokeLinejoin="round" />
          <rect x={jx + jw * 0.1} y={sh} width={jw * 0.055} height={(jh - (sh - jy)) * 0.6} rx={jw * 0.027} fill="#fff" fillOpacity={0.14} />
          <rect x={nl - 8 * u} y={jy - 12 * u} width={nr - nl + 16 * u} height={16 * u} rx={8 * u} fill={glass} fillOpacity={0.9} />
          {/* coins falling in */}
          <g>{coinNodes}</g>
          {/* milestone ticks */}
          {ticks.map((m, i) => (
            <g key={i}>
              <line x1={jx + jw - 26 * u} y1={m.y} x2={jx + jw + 4 * u} y2={m.y} stroke={m.hit ? accent : ink} strokeOpacity={m.hit ? 1 : 0.4} strokeWidth={4 * u} strokeLinecap="round" />
              <circle cx={jx + jw + 18 * u} cy={m.y} r={(m.hit ? 9 : 6) * u} fill={m.hit ? accent : 'none'} stroke={m.hit ? accent : ink} strokeOpacity={m.hit ? 1 : 0.4} strokeWidth={3 * u} />
            </g>
          ))}
        </g>
        {/* sparkles */}
        {reached && doneT > 0 &&
          [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const a = (k / 8) * Math.PI * 2 + 0.3;
            const d = (jw * 0.25 + doneT * jw * 0.55) * (0.8 + (k % 3) * 0.12);
            const sx = jx + jw / 2 + Math.cos(a) * d;
            const sy = jy + jh * 0.12 + Math.sin(a) * d * 0.7;
            const sz = (14 - doneT * 6) * u;
            return <path key={k} d={`M${sx},${sy - sz} L${sx + sz * 0.3},${sy - sz * 0.3} L${sx + sz},${sy} L${sx + sz * 0.3},${sy + sz * 0.3} L${sx},${sy + sz} L${sx - sz * 0.3},${sy + sz * 0.3} L${sx - sz},${sy} L${sx - sz * 0.3},${sy - sz * 0.3}Z`} fill={accent} opacity={1 - doneT * 0.6} />;
          })}
        {/* info column */}
        <g opacity={a0}>
          <text x={colX} y={infoTop + bigSize * 0.25} fontFamily={font} fontWeight={600} fontSize={bigSize * 0.2} letterSpacing={bigSize * 0.025} fill={ink} fillOpacity={0.55}>
            {clip(savedLabel.toUpperCase(), colW, bigSize * 0.2, 0.66)}
          </text>
          <text x={colX} y={infoTop + bigSize * 1.2} fontFamily={font} fontWeight={700} fontSize={bigSize} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
            {bigNum}
          </text>
          <text x={colX} y={infoTop + bigSize * 1.2 + bigSize * 0.32} fontFamily={font} fontWeight={600} fontSize={bigSize * 0.22} fill={ink} fillOpacity={0.6}>
            {clip(`${goalLabel} ${fmt(goal, 0, prefix, suffix)}`, colW, bigSize * 0.22)}
          </text>
          <text x={colX} y={infoTop + bigSize * 1.2 + bigSize * 0.7} fontFamily={font} fontWeight={700} fontSize={bigSize * 0.24} fill={accent}>
            {reached && doneT > 0.5 ? reachedLabel : `${fmt(Math.round(toGo), 0, prefix, suffix)} ${toGoLabel}`}
          </text>
        </g>
        {ms.map((m, i) => {
          const hit = saved * t >= m.value - 0.0001;
          const pop = hit ? prog(frame, fillStart + fillDur * ease.inOut(0) , fillStart + fillDur) : 0;
          void pop;
          const a = prog(frame, startAt + 20 + i * 6, startAt + 38 + i * 6);
          const y = infoTop + bigSize * 2.15 + i * mRow;
          const sz = mRow * 0.36;
          return (
            <g key={i} opacity={a} transform={`translate(${(1 - a) * 24 * u} 0)`}>
              <circle cx={colX + sz * 0.9} cy={y + mRow * 0.45} r={sz * 0.9} fill={hit ? accent : 'none'} stroke={hit ? accent : ink} strokeOpacity={hit ? 1 : 0.35} strokeWidth={3 * u} />
              {hit && <Check x={colX + sz * 0.9} y={y + mRow * 0.45} s={sz * 0.95} color={isClear(background) ? '#10161C' : background} width={sz * 0.26} />}
              <text x={colX + sz * 2.4} y={y + mRow * 0.45 + sz * 0.35} fontFamily={font} fontWeight={hit ? 700 : 600} fontSize={sz} fill={ink} fillOpacity={hit ? 1 : 0.6}>
                {clip(m.label, colW - sz * 9, sz)}
              </text>
              <text x={colX + colW} y={y + mRow * 0.45 + sz * 0.35} textAnchor="end" fontFamily={font} fontWeight={700} fontSize={sz} fill={ink} fillOpacity={hit ? 1 : 0.5} style={{fontVariantNumeric: 'tabular-nums'}}>
                {fmt(m.value, 0, prefix, suffix)}
              </text>
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const savingsGoalJar = defineMotion<Props>({
  id: 'savings-goal-jar',
  title: 'Savings goal jar',
  category: 'data',
  description:
    'A glass savings jar fills with a wavy liquid as coins drop in, a big saved-amount counter runs up beside it, tick marks on the glass and a milestone checklist light up as each milestone is passed, and a "to go" line turns into a sparkle "goal reached" celebration when the target is hit.',
  source: ['original round-3 vertical motion'],
  useFor:
    'Savings, fundraising and crowdfunding progress, goal-tracker and fintech app promos, "save for X" explainers. Set the goal, the amount saved, your own milestones, currency and colours.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Saving for the trip',
    subtitle: 'Every deposit gets us closer',
    goal: 5000,
    saved: 3200,
    goalLabel: 'of',
    savedLabel: 'Saved so far',
    reachedLabel: 'Goal reached!',
    toGoLabel: 'to go',
    milestones: MILESTONES,
    prefix: '$',
    suffix: '',
    coins: 8,
    background: '#101A24',
    liquid: '#34C3A0',
    glass: '#CFE6F2',
    ink: '#EDF4FA',
    accent: '#F5C451',
    fontFamily: '',
    startAt: 6,
    speed: 1,
  },
  propDocs: {
    title: 'headline (empty = none)',
    subtitle: 'line under the headline (empty = none)',
    goal: 'target amount (the jar is full at this value)',
    saved: 'amount saved; if it reaches the goal the jar celebrates',
    goalLabel: 'word before the goal amount ("of $5,000")',
    savedLabel: 'caption over the big amount',
    reachedLabel: 'message shown when saved >= goal',
    toGoLabel: 'text after the remaining amount',
    milestones: 'milestones [{label, value}] up to 6; ticks on the jar and a checklist light up when passed',
    prefix: 'text before amounts (currency symbol)',
    suffix: 'text after amounts',
    coins: 'number of coins that drop into the jar (0 = none)',
    background: 'page colour, or "transparent"',
    liquid: 'colour of the liquid',
    glass: 'colour of the jar glass and rim',
    ink: 'text colour',
    accent: 'coins, ticks, checks and highlight colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the jar fades in',
    speed: 'animation speed multiplier',
  },
  component: SavingsGoalJar,
  tags: ['savings', 'goal', 'jar', 'piggy bank', 'fundraising', 'crowdfunding', 'milestone', 'progress', 'money', 'finance', 'fintech', 'coins', 'target', 'overlay'],
});
