import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {DAY_MS, dateParts, hexA, hexToRgb, mixHex, parseHM, parseISO, useUid, fitSize} from '../../core/r2-pr4-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Clock + calendar: an analog clock whose hands sweep from one time to another (a time-lapse compressed into the
 * clip; the sky tint runs night-dawn-day-dusk behind it) and/or a wall calendar whose pages flip (or tear off) day by
 * day while the date counter rolls. One shared eased timeline, a hold at the start and a pulse at the end.
 */
type Props = {
  mode: 'clock' | 'calendar' | 'both';
  from: string;
  to: string;
  fromDate: string;
  toDate: string;
  flip: 'flip' | 'tear';
  title: string;
  subtitle: string;
  background: string;
  sky: boolean;
  paper: string;
  ink: string;
  accent: string;
  holdStart: number;
  holdEnd: number;
  flipFrames: number;
  seconds: boolean;
};

const SKY: [number, string][] = [
  [0, '#0c1233'],
  [5, '#1c2860'],
  [6.8, '#e9a98a'],
  [9, '#f1e6d2'],
  [16, '#f1e6d2'],
  [18, '#ee9a6c'],
  [20, '#2a2150'],
  [24, '#0c1233'],
];
const skyAt = (hour: number) => {
  const hh = ((hour % 24) + 24) % 24;
  for (let i = 0; i < SKY.length - 1; i++) {
    if (hh >= SKY[i][0] && hh <= SKY[i + 1][0]) return mixHex(SKY[i][1], SKY[i + 1][1], ease.sine((hh - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0])));
  }
  return SKY[0][1];
};
const lum = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const fmtHM = (m: number) => {
  const mm = Math.floor(((m % 1440) + 1440) % 1440);
  return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
};

const ClockCalendar: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames, portrait} = useStage();
  const uid = useUid('cc');
  const D = durationInFrames;
  const runEnd = D - p.holdEnd;
  const t = prog(frame, p.holdStart, runEnd, ease.inOut);
  const both = p.mode === 'both';
  const showClock = p.mode !== 'calendar';
  const showCal = p.mode !== 'clock';

  // timeline
  const m0 = parseHM(p.from);
  let m1 = parseHM(p.to);
  if (m1 <= m0) m1 += 1440;
  const minutes = lerp(m0, m1, t);
  const d0 = parseISO(p.fromDate);
  const d1 = Math.max(d0, parseISO(p.toDate));
  const nDays = Math.round((d1 - d0) / DAY_MS);
  const pos = t * nDays;
  const idx = Math.min(nDays, Math.floor(pos + 1e-6));
  const local = nDays === 0 || idx >= nDays ? 0 : pos - idx;
  const fpd = (runEnd - p.holdStart) / Math.max(1, nDays); // frames per day (average)
  const flipFrac = clamp(p.flipFrames / Math.max(1, fpd), 0.12, 0.92);
  const q = nDays === 0 ? 0 : clamp((local - (1 - flipFrac)) / flipFrac);

  const bg = p.sky && showClock ? skyAt(minutes / 60) : p.background;
  const dark = lum(bg) < 0.5;
  const txt = dark ? '#f1ecdf' : p.ink;
  const endPulse = prog(frame, runEnd, runEnd + 14, ease.out);
  const pulse = endPulse * (1 - prog(frame, runEnd + 14, runEnd + 34, ease.sine));

  // layout
  const S = Math.min(w, h);
  const clockR = (both ? (portrait ? 0.2 : 0.27) * S * 1.1 : 0.34 * S) * 1;
  const calW = both ? (portrait ? 0.42 : 0.4) * S : 0.5 * S;
  const calH = calW * 1.18;
  const clockC = both ? (portrait ? {x: w / 2, y: h * 0.3} : {x: w * 0.3, y: h * 0.52}) : {x: w / 2, y: h * 0.5};
  const calC = both ? (portrait ? {x: w / 2, y: h * 0.7} : {x: w * 0.7, y: h * 0.52}) : {x: w / 2, y: h * 0.5};
  const enter = (d: number) => prog(frame, d, d + 22, ease.out);

  // ---------------------------------------------------------------- clock
  const hourAng = (minutes / 720) * 360;
  const minAng = (minutes % 60) * 6;
  const secAng = ((minutes * 60) % 60) * 6;
  const R = clockR;
  const ticks = Array.from({length: 60}, (_, i) => i);

  // ---------------------------------------------------------------- calendar pages
  const page = (dayIdx: number) => dateParts(d0 + dayIdx * DAY_MS);
  const Page: React.FC<{i: number; shadow?: number}> = ({i, shadow = 0}) => {
    const d = page(i);
    const weekend = d.dow === 0 || d.dow === 6;
    return (
      <div style={{position: 'absolute', inset: 0, background: p.paper, borderRadius: 14 * u, overflow: 'hidden', boxShadow: `0 ${6 * u}px ${18 * u}px rgba(0,0,0,0.22)`}}>
        <div style={{height: calH * 0.22, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 12 * u, fontFamily: fonts.mono, fontWeight: 700, letterSpacing: calW * 0.016, fontSize: calW * 0.068, color: '#fff'}}>
          {d.month} {d.year}
        </div>
        <div style={{position: 'absolute', top: calH * 0.22, bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{fontFamily: fonts.display, fontSize: calW * 0.52, lineHeight: 0.95, color: weekend ? p.accent : p.ink}}>{d.day}</div>
          <div style={{fontFamily: fonts.grotesk, fontWeight: 700, letterSpacing: calW * 0.02, fontSize: calW * 0.07, color: hexA(p.ink, 0.62), marginTop: calH * 0.02}}>{d.weekday}</div>
        </div>
        {shadow > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${shadow})`}} />}
      </div>
    );
  };
  const flipAng = q <= 0 ? 0 : ease.in(q) * 180;
  const tearQ = ease.in(q);
  const calIn = enter(2);

  return (
    <AbsoluteFill style={{background: bg}}>
      {/* soft vignette */}
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${hexA('#ffffff', dark ? 0.05 : 0.18)}, ${hexA('#000000', dark ? 0.35 : 0.1)})`}} />

      {(p.title || p.subtitle) && (
        <div style={{position: 'absolute', left: 0, right: 0, top: portrait ? h * 0.05 : h * 0.07, textAlign: 'center', opacity: enter(0)}}>
          <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: fitSize(p.title, fonts.grotesk, 58 * u, w * 0.86, 700), color: txt, letterSpacing: -1 * u}}>{p.title}</div>
          {p.subtitle && <div style={{fontFamily: fonts.mono, fontSize: 15 * u, letterSpacing: 3 * u, color: hexA(txt, 0.6), marginTop: 10 * u}}>{p.subtitle.toUpperCase()}</div>}
        </div>
      )}

      {showClock && (
        <>
          <Svg>
            <defs>
              <radialGradient id={uid + 'face'} cx="50%" cy="40%" r="70%">
                <stop offset="0" stopColor={mixHex(p.paper, '#ffffff', 0.6)} />
                <stop offset="1" stopColor={p.paper} />
              </radialGradient>
              <filter id={uid + 'sh'} x="-20%" y="-20%" width="140%" height="150%">
                <feGaussianBlur stdDeviation={9 * u} />
              </filter>
            </defs>
            <g opacity={enter(0)} transform={`translate(${clockC.x} ${clockC.y}) scale(${0.92 + 0.08 * enter(0) + pulse * 0.02})`}>
              <circle cx={0} cy={R * 0.06} r={R * 1.02} fill="#000" opacity={0.3} filter={`url(#${uid}sh)`} />
              <circle r={R * 1.04} fill={p.ink} />
              <circle r={R} fill={`url(#${uid}face)`} />
              {ticks.map((i) => {
                const big = i % 5 === 0;
                const a = (i / 60) * Math.PI * 2;
                const r0 = R * (big ? 0.84 : 0.91);
                const r1 = R * 0.97;
                return <line key={i} x1={Math.sin(a) * r0} y1={-Math.cos(a) * r0} x2={Math.sin(a) * r1} y2={-Math.cos(a) * r1} stroke={p.ink} strokeWidth={(big ? 4 : 1.6) * u} strokeLinecap="round" opacity={big ? 1 : 0.55} />;
              })}
              {Array.from({length: 12}, (_, i) => {
                const n = i === 0 ? 12 : i;
                const a = (i / 12) * Math.PI * 2;
                return (
                  <text key={i} x={Math.sin(a) * R * 0.7} y={-Math.cos(a) * R * 0.7} textAnchor="middle" dominantBaseline="central" fontFamily={fonts.grotesk} fontWeight={700} fontSize={R * 0.16} fill={p.ink}>
                    {n}
                  </text>
                );
              })}
              {/* hands */}
              <g transform={`rotate(${hourAng})`}>
                <line x1={0} y1={R * 0.08} x2={0} y2={-R * 0.5} stroke={p.ink} strokeWidth={R * 0.055} strokeLinecap="round" />
              </g>
              <g transform={`rotate(${minAng})`}>
                <line x1={0} y1={R * 0.1} x2={0} y2={-R * 0.76} stroke={p.ink} strokeWidth={R * 0.036} strokeLinecap="round" />
              </g>
              {p.seconds && (
                <g transform={`rotate(${secAng})`} opacity={0.9}>
                  <line x1={0} y1={R * 0.16} x2={0} y2={-R * 0.84} stroke={p.accent} strokeWidth={R * 0.016} strokeLinecap="round" />
                  <circle cx={0} cy={-R * 0.84} r={R * 0.03} fill={p.accent} />
                </g>
              )}
              <circle r={R * 0.05} fill={p.accent} />
              <circle r={R * 0.018} fill={p.paper} />
              {pulse > 0.01 && <circle r={R * (1.06 + pulse * 0.18)} fill="none" stroke={p.accent} strokeWidth={5 * u} opacity={0.9 * (1 - pulse * 0.6)} />}
            </g>
          </Svg>
          <div style={{position: 'absolute', left: clockC.x - R, width: R * 2, top: clockC.y + R * 1.18, textAlign: 'center', opacity: enter(8)}}>
            <span style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: R * 0.3, letterSpacing: R * 0.02, color: txt}}>{fmtHM(minutes)}</span>
          </div>
        </>
      )}

      {showCal && (
        <div style={{position: 'absolute', left: calC.x - calW / 2, top: calC.y - calH / 2, width: calW, height: calH, opacity: calIn, transform: `translateY(${(1 - calIn) * 30 * u}px) scale(${1 + pulse * 0.02})`, perspective: 1600 * u}}>
          {/* sheet stack */}
          <div style={{position: 'absolute', inset: 0, transform: `translate(${5 * u}px, ${12 * u}px)`, background: mixHex(p.paper, '#000', 0.2), borderRadius: 14 * u}} />
          <div style={{position: 'absolute', inset: 0, transform: `translate(${2.5 * u}px, ${6 * u}px)`, background: mixHex(p.paper, '#000', 0.1), borderRadius: 14 * u}} />
          {/* next page waits underneath */}
          <Page i={Math.min(nDays, idx + (q > 0 ? 1 : 0))} shadow={q > 0 ? 0.34 * (1 - clamp(q * 1.1)) : 0} />
          {/* the page that leaves */}
          {q > 0 && q < 1 && (
            <div
              style={
                p.flip === 'flip'
                  ? {position: 'absolute', inset: 0, transformOrigin: '50% 0%', transform: `rotateX(${-flipAng}deg)`, backfaceVisibility: 'hidden', opacity: flipAng > 120 ? 0 : 1}
                  : {position: 'absolute', inset: 0, transformOrigin: '10% 0%', transform: `translate(${tearQ * calW * 0.5}px, ${-tearQ * h * 0.8}px) rotate(${tearQ * 22}deg)`, opacity: 1 - tearQ * 0.4}
              }
            >
              <Page i={idx} shadow={p.flip === 'flip' ? clamp(flipAng / 90) * 0.28 : 0} />
            </div>
          )}
          {/* binding */}
          <div style={{position: 'absolute', left: 0, right: 0, top: -calH * 0.03, display: 'flex', justifyContent: 'space-around', padding: `0 ${calW * 0.2}px`}}>
            {[0, 1].map((k) => (
              <div key={k} style={{width: calW * 0.045, height: calH * 0.09, borderRadius: calW * 0.03, background: 'linear-gradient(90deg,#d8dbe0,#8a8f98,#d8dbe0)', boxShadow: '0 2px 4px rgba(0,0,0,0.35)'}} />
            ))}
          </div>
          {/* end circle */}
          {pulse > 0.01 || endPulse > 0 ? (
            <svg width={calW} height={calH} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <ellipse cx={calW * 0.5} cy={calH * 0.5} rx={calW * 0.4} ry={calH * 0.2} fill="none" stroke={p.accent} strokeWidth={6 * u} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - ease.out(endPulse))} transform={`rotate(-4 ${calW / 2} ${calH * 0.5})`} />
            </svg>
          ) : null}
          <div style={{position: 'absolute', left: 0, right: 0, top: calH + 26 * u, textAlign: 'center', fontFamily: fonts.mono, fontSize: 15 * u, letterSpacing: 3 * u, color: hexA(txt, 0.7)}}>
            DAY {String(idx + 1 + (q > 0.5 ? 1 : 0) > nDays + 1 ? nDays + 1 : idx + 1 + (q > 0.5 ? 1 : 0)).padStart(2, '0')} / {String(nDays + 1).padStart(2, '0')}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const clockCalendar = defineMotion<Props>({
  id: 'clock-calendar',
  title: 'Clock and calendar time-lapse',
  category: 'ui',
  description:
    'An analog clock whose hands sweep from one time to another over a night-dawn-day-dusk sky tint with a digital readout, beside a wall calendar whose pages flip (or tear off) day by day while the date rolls, ending with a pulse ring and a circled final date.',
  source: ['prompt-corpus: clock-calendar (13 cases, awesome-opus5-5-videos)'],
  useFor: 'Deadlines, "a day in the life" and history-in-a-day stories, countdowns, project timelines, "X days later" beats. Use mode to show only the clock or only the calendar.',
  durationInFrames: 180,
  defaultProps: {
    mode: 'both',
    from: '08:00',
    to: '18:30',
    fromDate: '2025-03-03',
    toDate: '2025-03-14',
    flip: 'flip',
    title: 'One working week',
    subtitle: 'Twelve days in six seconds',
    background: '#efe7d8',
    sky: true,
    paper: '#fbf7ee',
    ink: '#1b1a22',
    accent: '#e8472b',
    holdStart: 14,
    holdEnd: 40,
    flipFrames: 8,
    seconds: true,
  },
  propDocs: {
    mode: "'clock' | 'calendar' | 'both'",
    from: 'clock start time HH:MM',
    to: 'clock end time HH:MM (past midnight if earlier than from)',
    fromDate: 'calendar start date YYYY-MM-DD',
    toDate: 'calendar end date YYYY-MM-DD',
    flip: "'flip' (page hinges up, 8 frames) | 'tear' (page tears off and flies away)",
    title: 'headline',
    subtitle: 'mono sub-line',
    background: 'flat background when sky is off',
    sky: 'tint the background by time of day (clock modes)',
    paper: 'clock face / calendar page colour',
    ink: 'clock numerals, hands and calendar text colour',
    accent: 'header band, weekend days, seconds hand, end circle',
    holdStart: 'frames held before the time-lapse starts',
    holdEnd: 'frames held after it ends (pulse + circle)',
    flipFrames: 'page flip length in frames',
    seconds: 'show the sweeping seconds hand',
  },
  component: ClockCalendar,
  tags: ['clock', 'calendar', 'time-lapse', 'timelapse', 'date', 'day', 'deadline', 'countdown', 'page flip', 'tear-off', 'analog clock', 'hands', 'a day in the life', 'timeline', 'schedule', 'days later', 'time passing', 'sky'],
});
