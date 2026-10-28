import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, clip, fmt, itemColor, resolveFont, ringPath, useChartBox} from '../../core/r3-chart-kit';
import {Check, FLAME, isClear, mixHex} from '../../core/r3-vertical-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Ring = {label: string; value: number; goal: number; unit?: string; color?: string; decimals?: number};
type Day = {label: string; value: number};
type Props = {
  title: string;
  subtitle: string;
  rings: Ring[];
  week: Day[];
  streak: number;
  streakLabel: string;
  centerLabel: string;
  colors: string[];
  background: string;
  panel: string;
  ink: string;
  accent: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const RINGS: Ring[] = [
  {label: 'Move', value: 540, goal: 500, unit: 'kcal'},
  {label: 'Exercise', value: 32, goal: 30, unit: 'min'},
  {label: 'Steps', value: 9200, goal: 10000, unit: 'steps'},
];
const WEEK: Day[] = [
  {label: 'M', value: 1},
  {label: 'T', value: 1},
  {label: 'W', value: 1},
  {label: 'T', value: 1},
  {label: 'F', value: 1},
  {label: 'S', value: 1},
  {label: 'S', value: 0.72},
];

const FitnessActivityRings: React.FC<Props> = ({title, subtitle, rings, week, streak, streakLabel, centerLabel, colors, background, panel, ink, accent, fontFamily, startAt, speed}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const rows = rings.slice(0, 5).map((r, i) => ({...r, goal: r.goal > 0 ? r.goal : 1, color: itemColor(r.color, colors, i), decimals: r.decimals ?? 0}));
  const n = Math.max(1, rows.length);
  const days = week.slice(0, 7);
  const per = 12 / speed;
  const dur = 62 / speed;
  const rt = (i: number) => prog(frame, startAt + 6 + i * per, startAt + 6 + i * per + dur, ease.out);
  const frac = (i: number) => clamp(rows[i].value / rows[i].goal, 0, 2);

  // regions
  const rowH = (portrait ? 112 : 108) * u;
  const streakH = (portrait ? 290 : 270) * u;
  const metricsH = n * rowH;
  let ringRect: {x: number; y: number; w: number; h: number};
  let panelRect: {x: number; y: number; w: number; h: number};
  if (portrait) {
    const rh = Math.min(box.w * 0.92, Math.max(300 * u, box.h - metricsH - streakH - 70 * u));
    ringRect = {x: box.x, y: box.y, w: box.w, h: rh};
    panelRect = {x: box.x, y: box.y + rh + 30 * u, w: box.w, h: box.h - rh - 30 * u};
  } else {
    const rw = box.w * 0.46;
    ringRect = {x: box.x, y: box.y, w: rw, h: box.h};
    const pw = Math.min(box.w - rw - 40 * u, 840 * u);
    panelRect = {x: box.x + rw + 40 * u + (box.w - rw - 40 * u - pw) / 2, y: box.y, w: pw, h: box.h};
  }
  const R = Math.max(90 * u, Math.min(ringRect.w, ringRect.h) / 2 - 6 * u);
  const hole = R * 0.3;
  const slot = (R - hole) / n;
  const thick = Math.min(slot * 0.84, 70 * u);
  const rcx = ringRect.x + ringRect.w / 2;
  const rcy = ringRect.y + ringRect.h / 2;
    const closedShown = rows.filter((r, i) => r.value >= r.goal && rt(i) > 0.98).length;

  const stackH = metricsH + 26 * u + streakH;
  const sy0 = panelRect.y + Math.max(0, (panelRect.h - stackH) / 2);
  const bg = isClear(background) ? '#101418' : background;

  return (
    <AbsoluteFill style={{background: isClear(background) ? 'transparent' : background}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} startAt={startAt} />
        {/* rings */}
        {rows.map((r, i) => {
          const rr = R - thick / 2 - i * slot;
          const t = rt(i);
          const total = frac(i) * t * 360;
          const lap1 = Math.min(360, total);
          const lap2 = Math.max(0, total - 360);
          const light = mixHex(r.color, '#ffffff', 0.38);
          const endAngle = lap1 >= 359.5 ? lap2 : lap1;
          const [ex, ey] = [rcx + rr * Math.sin((endAngle * Math.PI) / 180), rcy - rr * Math.cos((endAngle * Math.PI) / 180)];
          return (
            <g key={i} opacity={prog(frame, startAt + i * 4, startAt + i * 4 + 12)}>
              <circle cx={rcx} cy={rcy} r={rr} fill="none" stroke={r.color} strokeOpacity={0.2} strokeWidth={thick} />
              {lap1 > 0.5 && <path d={ringPath(rcx, rcy, rr, 0, Math.min(lap1, 359.9))} fill="none" stroke={r.color} strokeWidth={thick} strokeLinecap="round" />}
              {lap2 > 0.5 && (
                <>
                  <circle cx={ex} cy={ey} r={thick / 2 + 2 * u} fill="#000" opacity={0.3} />
                  <path d={ringPath(rcx, rcy, rr, 0, Math.min(lap2, 359.9))} fill="none" stroke={light} strokeWidth={thick} strokeLinecap="round" />
                </>
              )}
              {/* start chevron */}
              <path
                d={`M${rcx - thick * 0.16},${rcy - rr - thick * 0.26} L${rcx + thick * 0.14},${rcy - rr} L${rcx - thick * 0.16},${rcy - rr + thick * 0.26}`}
                fill="none"
                stroke={bg}
                strokeOpacity={0.55}
                strokeWidth={thick * 0.14}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}
        {/* centre */}
        {hole > 44 * u && (
          <g opacity={prog(frame, startAt + 14, startAt + 34)}>
            <text x={rcx} y={rcy + hole * 0.12} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={hole * 0.62} fill={ink}>
              {closedShown}
              <tspan fillOpacity={0.45} fontSize={hole * 0.42}>
                {'/' + n}
              </tspan>
            </text>
            {centerLabel ? (
              <text x={rcx} y={rcy + hole * 0.52} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={hole * 0.2} letterSpacing={hole * 0.03} fill={ink} fillOpacity={0.55}>
                {centerLabel}
              </text>
            ) : null}
          </g>
        )}
        {/* metrics */}
        {rows.map((r, i) => {
          const t = rt(i);
          const a = prog(frame, startAt + 10 + i * per, startAt + 10 + i * per + 18);
          const y = sy0 + i * rowH;
          const big = rowH * 0.5;
          const small = rowH * 0.26;
          const num = fmt(r.value * t, r.decimals);
          return (
            <g key={i} opacity={a} transform={`translate(${(1 - a) * 30 * u} 0)`}>
              <rect x={panelRect.x} y={y + rowH * 0.12} width={6 * u} height={rowH * 0.76} rx={3 * u} fill={r.color} />
              <text x={panelRect.x + 24 * u} y={y + rowH * 0.36} fontFamily={font} fontWeight={700} fontSize={small} letterSpacing={small * 0.08} fill={r.color}>
                {clip(r.label.toUpperCase(), panelRect.w * 0.4, small, 0.66)}
              </text>
              <text x={panelRect.x + 24 * u} y={y + rowH * 0.88} fontFamily={font} fontWeight={700} fontSize={big} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
                {num}
                <tspan fontSize={small * 1.05} fontWeight={600} fillOpacity={0.55}>
                  {' / ' + fmt(r.goal, r.decimals) + (r.unit ? ' ' + r.unit : '')}
                </tspan>
              </text>
              {r.value >= r.goal && t > 0.97 && (
                <g opacity={prog(frame, startAt + 6 + i * per + dur, startAt + 6 + i * per + dur + 10)}>
                  <circle cx={panelRect.x + panelRect.w - rowH * 0.3} cy={y + rowH * 0.5} r={rowH * 0.26} fill={r.color} />
                  <Check x={panelRect.x + panelRect.w - rowH * 0.3} y={y + rowH * 0.5} s={rowH * 0.3} color={bg} />
                </g>
              )}
            </g>
          );
        })}
        {/* streak card */}
        {(() => {
          const sy = sy0 + metricsH + 26 * u;
          const a = prog(frame, startAt + 40 / speed, startAt + 62 / speed);
          const x = panelRect.x;
          const w = panelRect.w;
          const sNum = Math.round(streak * prog(frame, startAt + 46 / speed, startAt + 90 / speed));
          const fl = streakH * 0.2;
          const flicker = 1 + Math.sin(frame * 0.5) * 0.04;
          const colW = w / Math.max(1, days.length);
          const ms = Math.min(colW * 0.34, streakH * 0.14);
          return (
            <g opacity={a} transform={`translate(0 ${(1 - a) * 24 * u})`}>
              <rect x={x} y={sy} width={w} height={streakH} rx={26 * u} fill={panel} />
              <g transform={`translate(${x + 24 * u + fl * 0.8} ${sy + streakH * 0.32}) scale(${fl * flicker} ${fl * flicker})`}>
                <path d={FLAME} fill={accent} />
                <path d={FLAME} fill={mixHex(accent, '#ffffff', 0.55)} transform="translate(0 0.28) scale(0.5)" />
              </g>
              <text x={x + 24 * u + fl * 2.1} y={sy + streakH * 0.42} fontFamily={font} fontWeight={700} fontSize={streakH * 0.3} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
                {sNum}
              </text>
              <text x={x + 24 * u + fl * 2.1 + streakH * 0.3 * (String(streak).length * 0.58 + 0.35)} y={sy + streakH * 0.42} fontFamily={font} fontWeight={600} fontSize={streakH * 0.13} fill={ink} fillOpacity={0.6}>
                {clip(streakLabel, w * 0.45, streakH * 0.13)}
              </text>
              {days.map((d, k) => {
                const dt = prog(frame, startAt + 56 / speed + k * 4, startAt + 56 / speed + k * 4 + 30 / speed, ease.out);
                const gx = x + colW * k + colW / 2;
                const gy = sy + streakH * 0.67;
                const v = clamp(d.value);
                const done = v >= 1;
                return (
                  <g key={k}>
                    <circle cx={gx} cy={gy} r={ms} fill="none" stroke={accent} strokeOpacity={0.2} strokeWidth={ms * 0.36} />
                    {v * dt > 0.01 && (done && dt > 0.98 ? (
                      <circle cx={gx} cy={gy} r={ms} fill="none" stroke={accent} strokeWidth={ms * 0.36} />
                    ) : (
                      <path d={ringPath(gx, gy, ms, 0, Math.min(359.9, v * dt * 360))} fill="none" stroke={accent} strokeWidth={ms * 0.36} strokeLinecap="round" />
                    ))}
                    {done && dt > 0.9 && <Check x={gx} y={gy} s={ms * 0.7} color={accent} width={ms * 0.2} t={prog(dt, 0.9, 1)} />}
                    <text x={gx} y={gy + ms + streakH * 0.12} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={streakH * 0.1} fill={ink} fillOpacity={0.55}>
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}
      </Svg>
    </AbsoluteFill>
  );
};

export const fitnessActivityRings = defineMotion<Props>({
  id: 'fitness-activity-rings',
  title: 'Fitness activity rings',
  category: 'data',
  description:
    'A fitness-app daily summary: three thick concentric activity rings close clockwise (a ring above its goal laps a second, lighter turn) while a count-up list shows each value against its goal with a check when closed, and a streak card with a flame and seven weekly mini rings fills in beneath.',
  source: ['original round-3 vertical motion'],
  useFor:
    'Fitness, wellness and habit apps and promos: daily steps / calories / active minutes, closing-your-rings moments, streak and weekly-consistency stories. Each ring has its own label, value, goal, unit and colour; the week row and streak count are props.',
  durationInFrames: 180,
  defaultProps: {
    title: 'Daily activity',
    subtitle: 'Two of three goals closed, keep the streak alive',
    rings: RINGS,
    week: WEEK,
    streak: 12,
    streakLabel: 'day streak',
    centerLabel: 'GOALS',
    colors: ['#FF4D6D', '#8BE04E', '#34C9F5', '#B07CFF', '#F2B134'],
    background: '#0E1216',
    panel: '#1A2027',
    ink: '#F2F5F8',
    accent: '#FF9F2E',
    fontFamily: '',
    startAt: 6,
    speed: 1,
  },
  propDocs: {
    title: 'headline (empty = none)',
    subtitle: 'line under the headline (empty = none)',
    rings: 'rings [{label, value, goal, unit?, color?, decimals?}] up to 5, outermost first; value above goal laps twice',
    week: 'weekly mini rings [{label, value 0-1}] up to 7; 1 = closed day (check mark)',
    streak: 'streak length shown with the flame (counts up)',
    streakLabel: 'text after the streak number',
    centerLabel: 'caption under the closed-goals count in the middle of the rings',
    colors: 'palette for rings without their own colour',
    background: 'page colour, or "transparent"',
    panel: 'streak card colour',
    ink: 'text colour',
    accent: 'flame / weekly ring colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the first ring starts',
    speed: 'animation speed multiplier',
  },
  component: FitnessActivityRings,
  tags: ['fitness', 'activity rings', 'steps', 'calories', 'workout', 'health', 'wellness', 'streak', 'habit', 'goal', 'progress ring', 'tracker', 'app', 'overlay'],
});
