import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  data: number[];
  distance: number;
  title: string;
  subtitle: string;
  unit: string;
  distUnit: string;
  colorByGrade: boolean;
  showPeak: boolean;
  speed: number;
  startAt: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
  monoFamily: string;
};

const DEFAULT_DATA = Array.from({length: 48}, (_, i) => {
  const t = i / 47;
  return Math.round(180 + 380 * Math.sin(t * Math.PI * 0.9) ** 1.2 + 70 * Math.sin(t * 17) + 40 * Math.sin(t * 41 + 1) + 90 * t);
});

const niceStep = (range: number, target: number) => {
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const m = raw / pow;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * pow;
};
const fmt = (v: number, d = 0) => v.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const ElevationProfile: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, (frame - p.startAt) * p.speed);
  const data = p.data.length > 1 ? p.data : DEFAULT_DATA;
  const N = data.length;
  const dmin = Math.min(...data), dmax = Math.max(...data);
  const step = niceStep(dmax - dmin || 1, 4);
  const y0v = Math.floor(dmin / step) * step - (dmin === Math.floor(dmin / step) * step ? step : 0);
  const y1v = Math.ceil(dmax / step) * step + (dmax === Math.ceil(dmax / step) * step ? step : 0);

  // ---- layout ---------------------------------------------------------------------------------------
  const pad = (portrait ? 70 : 110) * u;
  const cx0 = pad + 70 * u, cx1 = w - pad;
  const cy0 = portrait ? h * 0.42 : 330 * u;
  const cy1 = portrait ? h - 300 * u : h - 140 * u;
  const X = (s: number) => lerp(cx0, cx1, s);
  const Y = (v: number) => lerp(cy1, cy0, (v - y0v) / (y1v - y0v));
  const at = (s: number) => {
    const x = clamp(s) * (N - 1);
    const i = Math.min(N - 2, Math.floor(x));
    const t = x - i;
    const e = (1 - Math.cos(t * Math.PI)) / 2;
    return lerp(data[i], data[i + 1], e);
  };
  const SAMPLES = 160;
  const prof = Array.from({length: SAMPLES + 1}, (_, i) => at(i / SAMPLES));

  // ---- timeline -------------------------------------------------------------------------------------
  const s = prog(f, 24, 168, ease.inOut);
  const appear = prog(f, 0, 22, ease.out);
  const iHead = s * SAMPLES;
  const hv = at(s);
  const dist = s * p.distance;
  let gain = 0;
  for (let i = 1; i <= Math.floor(iHead); i++) gain += Math.max(0, prof[i] - prof[i - 1]);
  const lastI = Math.min(SAMPLES - 1, Math.floor(iHead));
  gain += Math.max(0, hv - prof[lastI]) * (iHead - lastI > 0 ? 1 : 0);
  const segKm = p.distance / SAMPLES;
  const gradeAt = (i: number) => ((prof[Math.min(SAMPLES, i + 1)] - prof[Math.max(0, i - 1)]) / (2 * segKm * 1000)) * 100;
  const grade = gradeAt(Math.round(iHead));
  const maxGrade = 12;
  const gradeColor = (g: number) => {
    const t = clamp(Math.abs(g) / maxGrade);
    return g >= 0 ? mix(p.accent2, p.accent, t) : mix(p.accent2, '#5B8CFF', t * 0.6);
  };
  const baseY = Y(y0v);
  const areaPath = (to: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= Math.floor(to); i++) pts.push(`${X(i / SAMPLES).toFixed(1)} ${Y(prof[i]).toFixed(1)}`);
    const frac = to - Math.floor(to);
    if (frac > 0 && Math.floor(to) < SAMPLES) pts.push(`${X(s).toFixed(1)} ${Y(hv).toFixed(1)}`);
    return pts;
  };
  const pts = areaPath(iHead);
  const gid = 'ep-area';
  const xTick = niceStep(p.distance, 5);
  const gridLines: React.ReactNode[] = [];
  for (let v = y0v; v <= y1v + 1e-6; v += step) {
    gridLines.push(
      <g key={'g' + v}>
        <line x1={cx0} x2={cx1} y1={Y(v)} y2={Y(v)} stroke={p.ink} strokeOpacity={0.12} strokeWidth={1.5 * u} />
        <text x={cx0 - 14 * u} y={Y(v) + 7 * u} textAnchor="end" fontSize={20 * u} fontFamily={p.monoFamily} fill={p.ink} opacity={0.5}>
          {fmt(v)}
        </text>
      </g>,
    );
  }
  for (let d = 0; d <= p.distance + 1e-6; d += xTick) {
    gridLines.push(
      <text key={'x' + d} x={X(d / p.distance)} y={cy1 + 36 * u} textAnchor="middle" fontSize={20 * u} fontFamily={p.monoFamily} fill={p.ink} opacity={0.5}>
        {fmt(d, xTick < 1 ? 1 : 0)}
      </text>,
    );
  }
  // coloured segments by grade
  const segs: React.ReactNode[] = [];
  const upto = Math.floor(iHead);
  for (let i = 0; i < upto; i++) {
    segs.push(<line key={i} x1={X(i / SAMPLES)} y1={Y(prof[i])} x2={X((i + 1) / SAMPLES)} y2={Y(prof[i + 1])} stroke={p.colorByGrade ? gradeColor(gradeAt(i)) : p.accent} strokeWidth={5 * u} strokeLinecap="round" />);
  }
  if (iHead > upto && upto < SAMPLES) segs.push(<line key="h" x1={X(upto / SAMPLES)} y1={Y(prof[upto])} x2={X(s)} y2={Y(hv)} stroke={p.colorByGrade ? gradeColor(gradeAt(upto)) : p.accent} strokeWidth={5 * u} strokeLinecap="round" />);

  const peakI = prof.indexOf(Math.max(...prof));
  const peakShow = p.showPeak ? prog(f, 24 + (peakI / SAMPLES) * 144, 24 + (peakI / SAMPLES) * 144 + 14, ease.back) : 0;
  const mx = X(s), my = Y(hv);
  const labW = 150 * u;
  const labX = clamp(mx, cx0 + labW / 2, cx1 - labW / 2);
  const padX = pad;
  const topY = (portrait ? 190 : 120) * u;
  const statY = portrait ? topY + 150 * u : topY;
  const stat = (x: number, y: number, big: string, small: string, color: string, anchor: 'start' | 'end' = 'start') => (
    <g transform={`translate(${x} ${y})`} textAnchor={anchor}>
      <text fontSize={(portrait ? 60 : 60) * u} fontWeight={800} fill={color} fontFamily={p.fontFamily}>{big}</text>
      <text y={34 * u} fontSize={20 * u} fill={p.ink} opacity={0.6} letterSpacing={2 * u} fontFamily={p.fontFamily}>{small}</text>
    </g>
  );
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={p.accent} stopOpacity={0.35} />
            <stop offset="1" stopColor={p.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g opacity={appear}>{gridLines}</g>
        {pts.length > 1 ? <path d={`M${pts[0]}L${pts.slice(1).join('L')}L${X(s).toFixed(1)} ${baseY}L${X(0)} ${baseY}Z`} fill={`url(#${gid})`} /> : null}
        {segs}
        {/* peak flag */}
        {p.showPeak ? (
          <g transform={`translate(${X(peakI / SAMPLES)} ${Y(prof[peakI])}) scale(${peakShow})`} fontFamily={p.fontFamily}>
            <path d={`M0 ${-10 * u}L0 ${-46 * u}`} stroke={p.ink} strokeWidth={2 * u} />
            <path d={`M0 ${-46 * u}L${52 * u} ${-38 * u}L0 ${-28 * u}Z`} fill={p.accent} />
            <text x={0} y={-58 * u} textAnchor="middle" fontSize={20 * u} fontWeight={800} fill={p.ink} letterSpacing={2 * u}>PEAK {fmt(Math.max(...prof))}</text>
          </g>
        ) : null}
        {/* marker */}
        <g opacity={prog(f, 22, 30)}>
          <line x1={mx} x2={mx} y1={my} y2={baseY} stroke={p.ink} strokeOpacity={0.45} strokeWidth={2 * u} strokeDasharray={`${6 * u} ${6 * u}`} />
          <circle cx={mx} cy={my} r={20 * u} fill={p.accent} opacity={0.25} />
          <circle cx={mx} cy={my} r={10 * u} fill={p.ink} stroke={p.accent} strokeWidth={4 * u} />
          <g transform={`translate(${labX} ${my - 78 * u})`} fontFamily={p.fontFamily}>
            <rect x={-labW / 2} y={-26 * u} width={labW} height={46 * u} rx={12 * u} fill={p.ink} />
            <path d={`M${(mx - labX) - 9 * u} ${20 * u}L${mx - labX} ${32 * u}L${(mx - labX) + 9 * u} ${20 * u}Z`} fill={p.ink} />
            <text textAnchor="middle" y={8 * u} fontSize={26 * u} fontWeight={800} fill={p.background === 'transparent' ? '#0B1220' : p.background}>
              {fmt(hv)} {p.unit}
            </text>
          </g>
        </g>
        {/* title + readouts */}
        <g opacity={appear}>
          <text x={padX} y={topY} fontSize={(portrait ? 76 : 64) * u} fontWeight={800} fill={p.ink} fontFamily={p.fontFamily} letterSpacing={-1 * u}>{p.title}</text>
          <text x={padX} y={topY + 44 * u} fontSize={26 * u} fill={p.ink} opacity={0.6} fontFamily={p.fontFamily}>{p.subtitle}</text>
          {portrait ? (
            <>
              {stat(padX, statY + 10 * u, fmt(dist, 1), p.distUnit.toUpperCase(), p.ink)}
              {stat(w / 2, statY + 10 * u, `+${fmt(gain)}`, `${p.unit.toUpperCase()} GAIN`, p.accent)}
              {stat(w - padX, statY + 10 * u, `${grade >= 0 ? '+' : ''}${grade.toFixed(1)}%`, 'GRADE', gradeColor(grade), 'end')}
            </>
          ) : (
            <>
              {stat(w - padX - 860 * u, topY, fmt(dist, 1), p.distUnit.toUpperCase(), p.ink)}
              {stat(w - padX - 560 * u, topY, `+${fmt(gain)}`, `${p.unit.toUpperCase()} GAIN`, p.accent)}
              {stat(w - padX, topY, `${grade >= 0 ? '+' : ''}${grade.toFixed(1)}%`, 'GRADE', gradeColor(grade), 'end')}
            </>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

const hex = (c: string): [number, number, number] => {
  const m = c.replace('#', '');
  const q = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  return [parseInt(q.slice(0, 2), 16) || 0, parseInt(q.slice(2, 4), 16) || 0, parseInt(q.slice(4, 6), 16) || 0];
};
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
};

export const elevationProfile = defineMotion<Props>({
  id: 'elevation-profile',
  title: 'Elevation profile',
  category: 'map',
  description: 'A route elevation line draws left to right, coloured by steepness, with a moving marker and live distance / total gain / grade readouts and a peak flag.',
  source: ['original (round 3)'],
  useFor: 'Hike, ride, run and race route explainers, stage profiles, any height-versus-distance story. Pass `data` (heights, evenly spaced along the route) and `distance`.',
  durationInFrames: 210,
  defaultProps: {
    data: DEFAULT_DATA,
    distance: 42,
    title: 'Route profile',
    subtitle: 'Distance against elevation',
    unit: 'm',
    distUnit: 'km',
    colorByGrade: true,
    showPeak: true,
    speed: 1,
    startAt: 0,
    background: '#0B1220',
    ink: '#E8EEF9',
    accent: '#FF7A59',
    accent2: '#4CC9F0',
    fontFamily: fonts.sans,
    monoFamily: fonts.mono,
  },
  propDocs: {
    data: 'elevation samples along the route (any unit, evenly spaced, 2+ numbers)',
    distance: 'total route length, shown on the x axis and distance readout',
    title: 'headline',
    subtitle: 'line under the headline',
    unit: 'height unit label (m, ft)',
    distUnit: 'distance unit label (km, mi)',
    colorByGrade: 'colour the line by steepness (accent = steep up, accent2 = flat/down)',
    showPeak: 'flag the highest point',
    speed: 'timeline speed multiplier',
    startAt: 'frame to start at',
    background: 'background colour or "transparent"',
    ink: 'text / axis colour',
    accent: 'steep climbs, area glow, gain readout',
    accent2: 'flat and downhill colour',
    fontFamily: 'CSS font-family',
    monoFamily: 'CSS font-family for axis numbers',
  },
  component: ElevationProfile,
  tags: ['map', 'elevation', 'profile', 'route', 'hiking', 'cycling', 'running', 'chart', 'altitude', 'gradient', 'terrain'],
});
