import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeIO, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {list} from '../../core/r3-edu-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Learn-to-tell-the-time clock: a friendly analogue face whose short hour hand and long minute hand sweep forward to each
 * target time (really: the minute hand turns 12x faster), with a coloured minute wedge, a digital readout that ticks along,
 * a spoken-style caption ("half past six") and a hand legend.
 */
type Props = {
  times: string[];
  captions: string[];
  format: string;
  showMinuteNumbers: boolean;
  showLegend: boolean;
  hourHandLabel: string;
  minuteHandLabel: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  card: string;
  fontFamily: string;
  timeFrames: number;
  startAt: number;
  speed: number;
};

const DEFAULT_TIMES = ['3:00', '6:30', '9:15', '12:45'];

type Parsed = {T: number; h24: number; pm: boolean; has: boolean};
const parseTime = (s: string): Parsed => {
  const m = String(s).match(/(\d{1,2})\s*:\s*(\d{2})\s*([ap]\.?m\.?)?/i);
  if (!m) return {T: 0, h24: 12, pm: false, has: false};
  let h = parseInt(m[1], 10);
  const mi = Math.min(59, parseInt(m[2], 10));
  const suffix = (m[3] || '').toLowerCase();
  const pm = suffix ? suffix.startsWith('p') : h >= 12 && h < 24;
  if (h >= 24) h = h % 24;
  const h12 = h % 12;
  return {T: h12 * 60 + mi, h24: suffix ? (h % 12) + (pm ? 12 : 0) : h, pm, has: !!suffix || h >= 13};
};

const caption = (T: number): string => {
  const h12 = Math.floor(T / 60) % 12 || 12;
  const next = (h12 % 12) + 1;
  const m = Math.round(T % 60);
  if (m === 0) return `${h12} o'clock`;
  if (m === 15) return `quarter past ${h12}`;
  if (m === 30) return `half past ${h12}`;
  if (m === 45) return `quarter to ${next}`;
  return m < 30 ? `${m} minutes past ${h12}` : `${60 - m} minutes to ${next}`;
};

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
};

const ClockTimeTeach: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.display;
  const showBg = p.background !== 'transparent';
  const times = list<string>(p.times, DEFAULT_TIMES).map(parseTime);
  const caps = list<string>(p.captions, []);
  const n = times.length;
  const S = Math.max(60, Math.round(p.timeFrames || 96));
  const SWEEP = Math.round(S * 0.4);
  const t0 = 22;

  // cumulative minute counter so hands only ever turn forward
  const cum: number[] = [0];
  let prevT = 0;
  times.forEach((tm) => {
    const d = (((tm.T - prevT) % 720) + 720) % 720;
    cum.push(cum[cum.length - 1] + d);
    prevT = tm.T;
  });
  const idx = Math.min(n - 1, Math.max(0, Math.floor((f - t0) / S)));
  const local = f - t0 - idx * S;
  const q = f < t0 ? 0 : sseg(local, 0, SWEEP);
  const e = easeIO(q);
  const Tnow = cum[idx] + (cum[idx + 1] - cum[idx]) * e;
  const settled = f >= t0 && local >= SWEEP;
  const wob = settled ? Math.exp(-(local - SWEEP) * 0.16) * Math.sin((local - SWEEP) * 0.9) * 2.6 : 0;
  const minAngle = Tnow * 6 + wob;
  const hourAngle = Tnow * 0.5 + wob * 0.15;

  // geometry
  const R = portrait ? w * 0.36 : Math.min(h * 0.34, w * 0.19);
  const ccx = portrait ? w / 2 : w * 0.3;
  const ccy = portrait ? h * 0.3 : h * 0.5;
  const clockIn = backOut(sseg(f, 0, 22), 1.5);
  const face = R * 0.92;

  // readout
  const tgt = times[idx];
  const prevP = idx > 0 ? times[idx - 1] : {T: 0, h24: 12, pm: false, has: false};
  const usePrevSuffix = f < t0 || q < 0.5;
  const sfx = usePrevSuffix ? prevP : tgt;
  const Tm = Math.floor(((Tnow % 720) + 720) % 720 + 1e-6);
  const hh12 = Math.floor(Tm / 60) % 12 || 12;
  const mm = Tm % 60;
  const is24 = String(p.format).toLowerCase().startsWith('24');
  const hDisp = is24 ? ((hh12 % 12) + (sfx.pm ? 12 : 0)) : hh12;
  const suffixTxt = !is24 && sfx.has ? (sfx.pm ? ' PM' : ' AM') : '';
  const hStr = is24 ? String(hDisp).padStart(2, '0') : String(hDisp);
  const mStr = String(mm).padStart(2, '0');
  const colonOn = settled ? Math.floor(local / 15) % 2 === 0 : true;

  const rx = portrait ? w / 2 : w * 0.72;
  const readW = portrait ? w * 0.7 : Math.min(w * 0.34, 660 * u);
  const readH = portrait ? 190 * u : 220 * u;
  const readCy = portrait ? h * 0.64 : h * 0.37;
  const readIn = easeOut3(sseg(f, 8, 28));
  const capText = String(caps[idx] ?? '').trim() || caption(tgt.T);
  const capQ = settled ? backOut(sseg(local, SWEEP + 2, SWEEP + 20), 1.6) : 0;
  const capOut = 1 - sseg(local, S - 10, S - 2) * (idx < n - 1 ? 1 : 0);
  const capFs = Math.min((portrait ? 76 : 70) * u, (portrait ? w * 0.9 : w * 0.36) / Math.max(6, capText.length * 0.5));

  // minute wedge
  const mA0 = (((Tnow * 6) % 360) + 360) % 360;
  const mA = mA0 > 359.2 ? 0 : mA0;
  const wedge = (() => {
    if (mA < 0.5) return '';
    const [x1, y1] = polar(ccx, ccy, face * 0.62, 0);
    const [x2, y2] = polar(ccx, ccy, face * 0.62, mA);
    return `M${ccx} ${ccy} L${x1} ${y1} A${face * 0.62} ${face * 0.62} 0 ${mA > 180 ? 1 : 0} 1 ${x2} ${y2}Z`;
  })();

  const hand = (deg: number, len: number, width: number, col: number | string, tail: number) => {
    const [x, y] = polar(ccx, ccy, len, deg);
    const [tx, ty] = polar(ccx, ccy, -tail, deg);
    return (
      <g>
        <line x1={tx + 3 * u} y1={ty + 5 * u} x2={x + 3 * u} y2={y + 5 * u} stroke="rgba(0,0,0,0.18)" strokeWidth={width} strokeLinecap="round" />
        <line x1={tx} y1={ty} x2={x} y2={y} stroke={String(col)} strokeWidth={width} strokeLinecap="round" />
      </g>
    );
  };

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g transform={`translate(${ccx} ${ccy}) scale(${clockIn}) translate(${-ccx} ${-ccy})`} opacity={Math.min(1, clockIn * 1.5)}>
          {/* rim + face */}
          <circle cx={ccx + 4 * u} cy={ccy + 14 * u} r={R} fill="rgba(0,0,0,0.2)" />
          <circle cx={ccx} cy={ccy} r={R} fill={p.accent} />
          <circle cx={ccx} cy={ccy} r={face} fill={p.card} />
          <circle cx={ccx} cy={ccy} r={face} fill="none" stroke={withAlpha(p.ink, 0.12)} strokeWidth={3 * u} />
          {/* minute wedge */}
          {wedge && <path d={wedge} fill={withAlpha(p.accent2, 0.2)} />}
          {/* ticks */}
          {Array.from({length: 60}, (_, i) => {
            const big = i % 5 === 0;
            const [x1, y1] = polar(ccx, ccy, face * (big ? 0.88 : 0.93), i * 6);
            const [x2, y2] = polar(ccx, ccy, face * 0.98, i * 6);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={big ? p.ink : withAlpha(p.ink, 0.4)} strokeWidth={(big ? 5 : 2.5) * u} strokeLinecap="round" />;
          })}
          {/* hour numbers */}
          {Array.from({length: 12}, (_, i) => {
            const [x, y] = polar(ccx, ccy, face * 0.72, (i + 1) * 30);
            return (
              <text key={i} x={x} y={y + R * 0.066} textAnchor="middle" fontFamily={font} fontSize={R * 0.2} fill={p.ink}>{i + 1}</text>
            );
          })}
          {/* minute numbers outside the rim */}
          {p.showMinuteNumbers &&
            Array.from({length: 12}, (_, i) => {
              const [x, y] = polar(ccx, ccy, R * 1.13, (i + 1) * 30);
              return (
                <text key={i} x={x} y={y + R * 0.045} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={R * 0.1} fill={withAlpha(p.accent2, 0.9)}>{(i + 1) * 5}</text>
              );
            })}
          {/* hands */}
          {hand(hourAngle, face * 0.5, R * 0.085, p.accent, R * 0.08)}
          {hand(minAngle, face * 0.8, R * 0.058, p.accent2, R * 0.1)}
          <circle cx={ccx} cy={ccy} r={R * 0.075} fill={p.ink} />
          <circle cx={ccx} cy={ccy} r={R * 0.03} fill={p.card} />
          {/* settle pulse at the minute-hand tip */}
          {settled && local - SWEEP < 24 && (() => {
            const [x, y] = polar(ccx, ccy, face * 0.8, minAngle);
            const k = (local - SWEEP) / 24;
            return <circle cx={x} cy={y} r={R * (0.05 + 0.14 * k)} fill="none" stroke={p.accent2} strokeWidth={4 * u} opacity={1 - k} />;
          })()}
        </g>
      </svg>

      {/* digital readout */}
      <div style={{position: 'absolute', left: rx - readW / 2, top: readCy - readH / 2, width: readW, height: readH, borderRadius: 32 * u, background: p.ink, boxShadow: `0 ${20 * u}px ${50 * u}px rgba(0,0,0,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: readIn, transform: `translateY(${(1 - readIn) * 30 * u}px)`}}>
        <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: readH * 0.52, color: p.accent2, letterSpacing: -2 * u, whiteSpace: 'pre', textShadow: `0 0 ${24 * u}px ${withAlpha(p.accent2, 0.5)}`}}>
          {hStr}
          <span style={{opacity: colonOn ? 1 : 0.25}}>:</span>
          {mStr}
          {suffixTxt ? <span style={{fontSize: readH * 0.24, color: withAlpha(p.accent2, 0.7)}}>{suffixTxt}</span> : null}
        </div>
      </div>

      {/* caption */}
      <div style={{position: 'absolute', left: rx - (portrait ? w * 0.45 : w * 0.18), width: portrait ? w * 0.9 : w * 0.36, top: readCy + readH / 2 + 36 * u, textAlign: 'center', fontFamily: font, fontSize: capFs, lineHeight: 1.15, color: p.ink, opacity: Math.min(1, capQ * 1.4) * capOut, transform: `scale(${0.8 + 0.2 * capQ})`}}>{capText}</div>

      {/* legend */}
      {p.showLegend && (
        <div style={{position: 'absolute', left: rx - (portrait ? w * 0.45 : w * 0.18), width: portrait ? w * 0.9 : w * 0.36, top: portrait ? h * 0.86 : h * 0.78, display: 'flex', flexDirection: portrait ? 'row' : 'column', justifyContent: 'center', alignItems: portrait ? 'center' : 'flex-start', gap: (portrait ? 40 : 16) * u, paddingLeft: portrait ? 0 : w * 0.06, opacity: easeOut3(sseg(f, 20, 40))}}>
          {[
            {c: p.accent, t: p.hourHandLabel, wd: 0.5},
            {c: p.accent2, t: p.minuteHandLabel, wd: 0.9},
          ].map((it, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16 * u, fontFamily: fonts.sans, fontWeight: 700, fontSize: (portrait ? 34 : 32) * u, color: p.ink}}>
              <div style={{width: 90 * u * it.wd + 18 * u, height: 14 * u, borderRadius: 14 * u, background: it.c}} />
              {it.t}
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const clockTimeTeach = defineMotion<Props>({
  id: 'clock-time-teach',
  title: 'Clock time teach',
  category: 'data',
  description: 'A friendly analogue clock for learning to tell the time: the short hour hand and long minute hand sweep forward to each target time, a coloured minute wedge follows, a digital readout ticks along and a caption ("half past six") pops in, with a hand legend.',
  source: ['original (round 3)'],
  useFor: 'Telling-the-time lessons, kids\' routine and schedule videos, ESL time vocabulary, timetable explainers and clock-based countdown/scheduling graphics — pass any list of times and optional captions.',
  durationInFrames: 420,
  defaultProps: {
    times: DEFAULT_TIMES,
    captions: [],
    format: '12h',
    showMinuteNumbers: true,
    showLegend: true,
    hourHandLabel: 'Hour hand: short',
    minuteHandLabel: 'Minute hand: long',
    background: '#E8F6FF',
    ink: '#1E2A4A',
    accent: '#FF6B6B',
    accent2: '#1E9BE8',
    card: '#FFFFFF',
    fontFamily: '',
    timeFrames: 96,
    startAt: 0,
    speed: 1,
  },
  propDocs: {
    times: 'target times in order, "h:mm" with optional am/pm or 24h (e.g. "3:00", "6:30 PM", "15:15"); the clock starts at 12:00',
    captions: 'optional caption per time (empty or missing = auto English such as "half past 6")',
    format: "'12h' or '24h' digital readout",
    showMinuteNumbers: 'show 5, 10, 15 ... around the outside of the rim',
    showLegend: 'show the hour-hand / minute-hand legend',
    hourHandLabel: 'legend text for the hour hand',
    minuteHandLabel: 'legend text for the minute hand',
    background: "backdrop colour or 'transparent'",
    ink: 'numbers, ticks and readout panel colour',
    accent: 'rim and hour-hand colour',
    accent2: 'minute hand, wedge and readout digits colour',
    card: 'clock face colour',
    fontFamily: 'optional CSS font-family for clock numbers and captions (empty = display)',
    timeFrames: 'frames each time is shown (sweep takes ~40%)',
    startAt: 'frame the clock starts',
    speed: 'playback speed multiplier',
  },
  component: ClockTimeTeach,
  tags: ['clock', 'time', 'telling time', 'analogue', 'analog', 'hands', 'kids', 'children', 'school', 'education', 'o\'clock', 'schedule', 'hour', 'minute', 'learning', 'lesson'],
});
