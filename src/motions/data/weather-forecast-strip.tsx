import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Header, clip, fmt, resolveFont, useChartBox} from '../../core/r3-chart-kit';
import {isClear, mixHex} from '../../core/r3-vertical-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Kind = 'sun' | 'moon' | 'partly' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog' | 'wind';
type Day = {day: string; icon: Kind | string; hi: number; lo: number; label?: string; precip?: number};
type Props = {
  title: string;
  subtitle: string;
  days: Day[];
  unit: string;
  highlightIndex: number;
  showPrecip: boolean;
  background: string;
  card: string;
  ink: string;
  accent: string;
  accent2: string;
  sunColor: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const DAYS: Day[] = [
  {day: 'Today', icon: 'sun', hi: 24, lo: 15, precip: 0},
  {day: 'Tue', icon: 'partly', hi: 23, lo: 14, precip: 10},
  {day: 'Wed', icon: 'cloud', hi: 20, lo: 13, precip: 30},
  {day: 'Thu', icon: 'rain', hi: 17, lo: 11, precip: 70},
  {day: 'Fri', icon: 'storm', hi: 16, lo: 10, precip: 85},
  {day: 'Sat', icon: 'partly', hi: 21, lo: 12, precip: 20},
  {day: 'Sun', icon: 'sun', hi: 25, lo: 14, precip: 0},
];
const NAMES: Record<string, string> = {sun: 'Sunny', moon: 'Clear', partly: 'Partly cloudy', cloud: 'Cloudy', rain: 'Rain', storm: 'Storm', snow: 'Snow', fog: 'Fog', wind: 'Windy'};

/** animated weather glyph, centred on (0,0), about 100 units wide */
const Icon: React.FC<{kind: string; frame: number; seed: number; sun: string; cloud: string; dark: string; rain: string}> = ({kind, frame, seed, sun, cloud, dark, rain}) => {
  const f = frame + seed * 13;
  const Cloud = ({fill, x = 0, y = 0, s = 1}: {fill: string; x?: number; y?: number; s?: number}) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <circle cx={-20} cy={2} r={16} />
      <circle cx={2} cy={-8} r={23} />
      <circle cx={24} cy={4} r={16} />
      <rect x={-34} y={2} width={74} height={18} rx={9} />
    </g>
  );
  const Sun = ({x = 0, y = 0, s = 1}: {x?: number; y?: number; s?: number}) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g transform={`rotate(${f * 0.6})`} stroke={sun} strokeWidth={5} strokeLinecap="round">
        {Array.from({length: 8}, (_, i) => (
          <line key={i} x1={0} y1={-30} x2={0} y2={-40 - Math.sin(f * 0.15 + i) * 2} transform={`rotate(${i * 45})`} />
        ))}
      </g>
      <circle r={21} fill={sun} />
      <circle r={21} fill="#fff" fillOpacity={0.18} cx={-5} cy={-6} />
    </g>
  );
  const drift = Math.sin(f * 0.05) * 3;
  if (kind === 'sun') return <Sun />;
  if (kind === 'moon')
    return (
      <g transform={`rotate(${Math.sin(f * 0.04) * 4})`}>
        <path d="M8,-36 A36,36 0 1 0 34,14 A28,28 0 1 1 8,-36Z" fill={sun} />
      </g>
    );
  if (kind === 'partly')
    return (
      <g>
        <Sun x={14} y={-14} s={0.7} />
        <Cloud fill={cloud} x={-4 + drift} y={12} s={0.82} />
      </g>
    );
  if (kind === 'cloud')
    return (
      <g>
        <Cloud fill={dark} x={14 - drift} y={-8} s={0.62} />
        <Cloud fill={cloud} x={-2 + drift} y={6} s={0.95} />
      </g>
    );
  if (kind === 'rain' || kind === 'storm' || kind === 'snow') {
    const col = kind === 'storm' ? dark : cloud;
    return (
      <g>
        <Cloud fill={col} y={-14} s={0.95} />
        {kind === 'rain' &&
          [0, 1, 2, 3].map((k) => {
            const p = ((f * 1.6 + k * 11) % 40) / 40;
            return <line key={k} x1={-24 + k * 16 - p * 6} y1={14 + p * 30} x2={-27 + k * 16 - p * 6} y2={24 + p * 30} stroke={rain} strokeWidth={5} strokeLinecap="round" opacity={clamp(Math.sin(p * Math.PI) * 2)} />;
          })}
        {kind === 'storm' && (
          <>
            <path d="M6,6 L-10,30 L-1,30 L-6,50 L14,22 L4,22 L10,6Z" fill={sun} opacity={0.35 + 0.65 * (Math.sin(f * 0.35) > 0.4 ? 1 : 0.35)} />
            {[0, 1].map((k) => {
              const p = ((f * 1.8 + k * 20) % 40) / 40;
              return <line key={k} x1={-28 + k * 54 - p * 6} y1={14 + p * 30} x2={-31 + k * 54 - p * 6} y2={24 + p * 30} stroke={rain} strokeWidth={5} strokeLinecap="round" opacity={clamp(Math.sin(p * Math.PI) * 2)} />;
            })}
          </>
        )}
        {kind === 'snow' &&
          [0, 1, 2, 3].map((k) => {
            const p = ((f * 0.9 + k * 10) % 40) / 40;
            return <circle key={k} cx={-24 + k * 16 + Math.sin(p * 6 + k) * 4} cy={14 + p * 34} r={4.5} fill="#fff" opacity={clamp(Math.sin(p * Math.PI) * 2)} />;
          })}
      </g>
    );
  }
  if (kind === 'fog')
    return (
      <g>
        <Cloud fill={cloud} y={-16} s={0.85} />
        {[0, 1, 2].map((k) => (
          <line key={k} x1={-34 + Math.sin(f * 0.06 + k) * 6} y1={16 + k * 12} x2={34 + Math.sin(f * 0.06 + k) * 6} y2={16 + k * 12} stroke={cloud} strokeWidth={6} strokeLinecap="round" opacity={0.85 - k * 0.2} />
        ))}
      </g>
    );
  // wind
  return (
    <g fill="none" stroke={cloud} strokeWidth={6} strokeLinecap="round">
      {[0, 1, 2].map((k) => {
        const sh = Math.sin(f * 0.1 + k * 1.3) * 5;
        const y = -18 + k * 18;
        return <path key={k} d={`M${-36 + sh},${y} H${14 + sh} a9,9 0 1 0 -9,-9`} opacity={0.9 - k * 0.15} />;
      })}
    </g>
  );
};

const WeatherForecastStrip: React.FC<Props> = ({title, subtitle, days, unit, highlightIndex, showPrecip, background, card, ink, accent, accent2, sunColor, fontFamily, startAt, speed}) => {
  const frame = useCurrentFrame();
  const {u, portrait, square} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);
  const ds = days.slice(0, 8);
  const n = Math.max(1, ds.length);
  const lo = Math.min(...ds.map((d) => Math.min(d.lo, d.hi)));
  const hi = Math.max(...ds.map((d) => Math.max(d.lo, d.hi)));
  const span = Math.max(1, hi - lo);
  const stag = 9 / speed;
  const rows = portrait || square;
  const cloud = mixHex(card, ink, 0.62);
  const dark = mixHex(card, ink, 0.32);
  const bg = isClear(background) ? 'transparent' : background;
  const kindOf = (d: Day) => String(d.icon || 'sun');
  const hot = (t: number) => mixHex(accent2, accent, clamp(t));

  const nodes: React.ReactNode[] = [];
  if (!rows) {
    const gap = 18 * u;
    const cw = (box.w - gap * (n - 1)) / n;
    const ch = Math.min(box.h, 700 * u, cw * 3);
    const top = box.y + (box.h - ch) / 2;
    ds.forEach((d, i) => {
      const t = prog(frame, startAt + i * stag, startAt + i * stag + 26 / speed, ease.out);
      const x = box.x + i * (cw + gap);
      const hl = i === highlightIndex;
      const tt = prog(frame, startAt + i * stag + 12, startAt + i * stag + 56 / speed, ease.out);
      const dayS = Math.min(cw * 0.17, 34 * u);
      const iconS = Math.min(cw * 0.62, ch * 0.2);
      const big = Math.min(cw * 0.26, 58 * u);
      const small = big * 0.62;
      const barTop = top + ch * 0.62;
      const barH = ch * 0.2;
      const barW = Math.max(10 * u, cw * 0.075);
      const y1 = barTop + barH * (1 - (d.hi - lo) / span);
      const y0 = barTop + barH * (1 - (d.lo - lo) / span);
      const grow = prog(frame, startAt + i * stag + 20, startAt + i * stag + 60 / speed, ease.out);
      const midX = x + cw / 2;
      const cond = d.label ?? NAMES[kindOf(d)] ?? '';
      nodes.push(
        <g key={i} opacity={t} transform={`translate(0 ${(1 - t) * 50 * u})`}>
          <rect x={x} y={top} width={cw} height={ch} rx={26 * u} fill={hl ? mixHex(card, accent, 0.22) : card} stroke={hl ? accent : 'none'} strokeWidth={3 * u} />
          <text x={midX} y={top + ch * 0.1} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={dayS} letterSpacing={dayS * 0.04} fill={hl ? accent : ink}>
            {clip(d.day, cw * 0.9, dayS, 0.62)}
          </text>
          <g transform={`translate(${midX} ${top + ch * 0.27}) scale(${iconS / 100})`}>
            <Icon kind={kindOf(d)} frame={frame} seed={i} sun={sunColor} cloud={cloud} dark={dark} rain={accent2} />
          </g>
          <text x={midX} y={top + ch * 0.44} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={small * 0.62} fill={ink} fillOpacity={0.75}>
            {clip(cond, cw * 0.92, small * 0.62)}
          </text>
          {showPrecip && d.precip !== undefined && (
            <text x={midX} y={top + ch * 0.5} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={small * 0.6} fill={accent2} fillOpacity={0.95}>
              {'●'} {fmt(d.precip * tt)}%
            </text>
          )}
          <text x={midX} y={top + ch * 0.6} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={big} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(d.hi * tt, 0, '', unit)}
          </text>
          <rect x={midX - barW / 2} y={barTop + 14 * u} width={barW} height={barH} rx={barW / 2} fill={ink} fillOpacity={0.12} />
          <rect x={midX - barW / 2} y={barTop + 14 * u + (y1 - barTop) + (y0 - y1) * (1 - grow)} width={barW} height={(y0 - y1 + barW) * grow} rx={barW / 2} fill={hot((d.hi - lo) / span)} />
          <text x={midX} y={barTop + barH + 14 * u + small * 1.7} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={small} fill={ink} fillOpacity={0.62} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(d.lo * tt, 0, '', unit)}
          </text>
        </g>,
      );
    });
  } else {
    const rowH = Math.min(box.h / n, 130 * u);
    const gap = Math.min(12 * u, rowH * 0.1);
    const top = box.y + (box.h - n * rowH) / 2;
    ds.forEach((d, i) => {
      const t = prog(frame, startAt + i * stag, startAt + i * stag + 26 / speed, ease.out);
      const tt = prog(frame, startAt + i * stag + 12, startAt + i * stag + 56 / speed, ease.out);
      const y = top + i * rowH;
      const rh = rowH - gap;
      const hl = i === highlightIndex;
      const W = box.w;
      const x = box.x;
      const big = rh * 0.36;
      const barX0 = x + W * 0.62;
      const barX1 = x + W * 0.84;
      const bh = Math.max(10 * u, rh * 0.12);
      const sx = (v: number) => barX0 + ((v - lo) / span) * (barX1 - barX0);
      const grow = prog(frame, startAt + i * stag + 20, startAt + i * stag + 60 / speed, ease.out);
      const x0 = sx(d.lo);
      const x1 = sx(d.hi);
      const cond = (d.label ?? NAMES[kindOf(d)] ?? '') + (showPrecip && d.precip !== undefined ? `  ${'·'}  ${d.precip}%` : '');
      nodes.push(
        <g key={i} opacity={t} transform={`translate(${(1 - t) * 60 * u} 0)`}>
          <rect x={x} y={y} width={W} height={rh} rx={rh * 0.28} fill={hl ? mixHex(card, accent, 0.22) : card} stroke={hl ? accent : 'none'} strokeWidth={3 * u} />
          <text x={x + 28 * u} y={y + rh * 0.47} fontFamily={font} fontWeight={700} fontSize={rh * 0.3} fill={hl ? accent : ink}>
            {clip(d.day, W * 0.26, rh * 0.3, 0.62)}
          </text>
          <text x={x + 28 * u} y={y + rh * 0.78} fontFamily={font} fontWeight={500} fontSize={rh * 0.2} fill={ink} fillOpacity={0.62}>
            {clip(cond, W * 0.3, rh * 0.2)}
          </text>
          <g transform={`translate(${x + W * 0.43} ${y + rh / 2}) scale(${(rh * 0.74) / 100})`}>
            <Icon kind={kindOf(d)} frame={frame} seed={i} sun={sunColor} cloud={cloud} dark={dark} rain={accent2} />
          </g>
          <text x={x + W * 0.585} y={y + rh / 2 + big * 0.34} textAnchor="end" fontFamily={font} fontWeight={600} fontSize={big * 0.9} fill={ink} fillOpacity={0.6} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(d.lo * tt, 0, '', unit)}
          </text>
          <rect x={barX0} y={y + rh / 2 - bh / 2} width={barX1 - barX0} height={bh} rx={bh / 2} fill={ink} fillOpacity={0.12} />
          <rect x={x0 + (x1 - x0) * (1 - grow) * 0.5} y={y + rh / 2 - bh / 2} width={Math.max(bh, (x1 - x0) * grow)} height={bh} rx={bh / 2} fill={hot((d.hi - lo) / span)} />
          <text x={x + W * 0.865} y={y + rh / 2 + big * 0.34} fontFamily={font} fontWeight={700} fontSize={big} fill={ink} style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(d.hi * tt, 0, '', unit)}
          </text>
        </g>,
      );
    });
  }

  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} startAt={startAt} />
        {nodes}
      </Svg>
    </AbsoluteFill>
  );
};

export const weatherForecastStrip = defineMotion<Props>({
  id: 'weather-forecast-strip',
  title: 'Weather forecast strip',
  category: 'data',
  description:
    'A week-ahead forecast: a row of cards (a stacked list in 1:1 and 9:16) rises in one after another, each with the day, a live animated weather icon (spinning sun, drifting cloud, falling rain / snow, flashing storm, fog bands), a chance-of-rain figure, counting high and low temperatures and a warm-to-cool range bar; today is highlighted.',
  source: ['original round-3 vertical motion'],
  useFor:
    'Weather apps and bulletins, travel and event planning, outdoor-business "what to expect" reels, smart-home widgets. Pass your own days with a day name, icon (sun, moon, partly, cloud, rain, storm, snow, fog, wind), high and low temperatures and optional chance of rain.',
  durationInFrames: 180,
  defaultProps: {
    title: 'Week ahead',
    subtitle: 'Seven-day forecast',
    days: DAYS,
    unit: '°',
    highlightIndex: 0,
    showPrecip: true,
    background: '#0D1B2A',
    card: '#162B42',
    ink: '#EAF2FA',
    accent: '#FFB347',
    accent2: '#5CB8FF',
    sunColor: '#FFC83D',
    fontFamily: '',
    startAt: 6,
    speed: 1,
  },
  propDocs: {
    title: 'headline (empty = none)',
    subtitle: 'line under the headline (empty = none)',
    days: 'days [{day, icon(sun|moon|partly|cloud|rain|storm|snow|fog|wind), hi, lo, label?, precip?(0-100)}] up to 8',
    unit: 'text after temperatures (degree sign, "C", ...)',
    highlightIndex: 'index of the highlighted card (-1 = none)',
    showPrecip: 'show chance of rain when a day has precip',
    background: 'page colour, or "transparent"',
    card: 'card colour',
    ink: 'text colour (icon clouds are tinted from it)',
    accent: 'warm end of the temperature bar and highlight colour',
    accent2: 'cool end of the temperature bar, rain and precipitation colour',
    sunColor: 'sun / moon / lightning colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the first card starts',
    speed: 'animation speed multiplier',
  },
  component: WeatherForecastStrip,
  tags: ['weather', 'forecast', 'week', 'temperature', 'icons', 'sun', 'rain', 'cards', 'travel', 'app', 'widget', 'climate', 'bulletin', 'overlay'],
});
