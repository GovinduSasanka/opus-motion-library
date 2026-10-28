// Adapted from lemo-opuscar styles/tilt-shift/STYLE.md §8 "Long-exposure light" + DEMO.md (dawn car trail) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {catmull, cl, lerp, polyAt, polyTable, useUid, type Pt} from '../../core/r2-lb3a-kit';
import {nz} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type PathDef = {
  pts: [number, number][];
  color?: string;
  count?: number;
  speed?: number;
  offset?: number;
  delay?: number;
  perspective?: boolean;
  reverse?: boolean;
  hero?: boolean;
};

type Props = {
  paths: PathDef[];
  trail: number;
  width: number;
  glow: number;
  rate: number;
  background: string;
  src: string;
  headColor: string;
  tailColor: string;
  intensity: number;
  hero: boolean;
};

const FPS = 30;

const LongExposureTrails: React.FC<Props> = ({paths, trail, width, glow, rate, background, src, headColor, intensity, hero}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const uid = useUid('let');
  const t = (frame / FPS) * rate;

  const prepared = React.useMemo(
    () =>
      paths.map((p) => {
        const pts = catmull(p.pts.map((q) => [q[0] * w, q[1] * h] as Pt), 14);
        return {p, pts, tab: polyTable(pts)};
      }),
    [JSON.stringify(paths), w, h], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const Plate = () => {
    if (src) return <Img src={resolveSrc(src)} style={{position: 'absolute', inset: 0, width: w, height: h, objectFit: 'cover'}} />;
    if (background === 'transparent') return null;
    // procedural dusk city seen over a bending road
    const rnd = (i: number) => (Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;
    const bl: {x: number; bw: number; bh: number; c: string}[] = [];
    let x = -20 * u;
    for (let i = 0; x < w + 40 * u; i++) {
      const bw = (50 + Math.abs(rnd(i)) * 90) * u;
      const bh = h * (0.16 + Math.abs(rnd(i + 40)) * 0.3);
      bl.push({x, bw, bh, c: ['#171A2E', '#1B1E36', '#14162A'][i % 3]});
      x += bw + 4 * u;
    }
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B0D22" />
            <stop offset="0.55" stopColor="#3A2A5A" />
            <stop offset="0.88" stopColor="#C8667A" />
            <stop offset="1" stopColor="#F2A874" />
          </linearGradient>
          <linearGradient id={`${uid}-road`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2A2230" />
            <stop offset="1" stopColor="#0B0A12" />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill="#0E0B16" />
        <rect width={w} height={h * 0.66} fill={`url(#${uid}-sky)`} />
        {bl.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={h * 0.66 - b.bh} width={b.bw} height={b.bh} fill={b.c} />
            {Array.from({length: Math.floor((b.bw / (14 * u)) * (b.bh / (22 * u)) * 0.5)}, (_, k) => {
              const cols = Math.max(1, Math.floor(b.bw / (14 * u)));
              const cx = b.x + 6 * u + (k % cols) * 14 * u;
              const cy = h * 0.66 - b.bh + 10 * u + Math.floor(k / cols) * 22 * u;
              const on = Math.abs(rnd(i * 31 + k)) > 0.55;
              return cy < h * 0.65 && cx < b.x + b.bw - 8 * u ? <rect key={k} x={cx} y={cy} width={6 * u} height={9 * u} fill={on ? '#FFD9A0' : '#262945'} opacity={on ? 0.85 : 0.6} /> : null;
            })}
          </g>
        ))}
        <path d={`M${w * 0.44} ${h * 0.66} L${w * 0.56} ${h * 0.66} L${w * 1.02} ${h} L${w * -0.02} ${h} Z`} fill={`url(#${uid}-road)`} />
        <path d={`M${w * 0.5} ${h * 0.66} L${w * 0.5} ${h}`} stroke="#E8C58A" strokeOpacity={0.25} strokeWidth={2 * u} strokeDasharray={`${14 * u} ${18 * u}`} />
      </svg>
    );
  };

  const nodes: React.ReactNode[] = [];
  const trailSec = Math.max(0.2, trail);
  const N = 26;
  prepared.forEach(({p, pts, tab}, pi) => {
    const count = p.count ?? 5;
    const speed = (p.speed ?? 0.22) * (p.hero ? 1 : 1);
    const colour = p.color ?? headColor;
    for (let c = 0; c < count; c++) {
      const base = (c / count + nz(uid + pi + 'o' + c, c) * 0.04 + (p.delay ?? 0) + 1) % 1;
      const vs = speed * (1 + nz(uid + pi + 'v' + c, c * 3) * 0.12);
      const offPx = (p.offset ?? 0) * u;
      const seq: {x: number; y: number; s: number}[] = [];
      for (let k = 0; k <= N; k++) {
        const tt = t - (k / N) * trailSec;
        const rawS = (((base + tt * vs) % 1) + 1) % 1;
        const s = p.reverse ? 1 - rawS : rawS;
        seq.push({...polyAt(pts, tab, s), s: rawS});
      }
      const persp = p.perspective !== false;
      const heroK = p.hero && hero ? 1.5 : 1;
      // loop wrap: break trail where the position jumps
      const segs: React.ReactNode[] = [];
      for (let k = 0; k < N; k++) {
        const a = seq[k];
        const b = seq[k + 1];
        if (Math.abs(a.s - b.s) > 0.5) continue;
        const f = 1 - k / N;
        const near = p.reverse ? 1 - a.s : a.s;
        const sc = persp ? lerp(0.35, 1.7, Math.pow(cl(p.reverse ? 1 - a.s : a.s), 1.4)) : 1;
        const sw = width * u * sc * heroK * (0.4 + 0.6 * f);
        const op = Math.pow(f, 1.25) * intensity * (persp ? lerp(0.45, 1, near) : 1);
        segs.push(
          <line key={k} x1={b.x + offPx * sc} y1={b.y} x2={a.x + offPx * sc} y2={a.y} stroke={colour} strokeWidth={sw} strokeOpacity={op} strokeLinecap="round" />,
        );
      }
      const head = seq[0];
      const hsc = persp ? lerp(0.35, 1.7, Math.pow(cl(p.reverse ? 1 - head.s : head.s), 1.4)) : 1;
      nodes.push(
        <g key={`${pi}-${c}`}>
          {segs}
          <circle cx={head.x + offPx * hsc} cy={head.y} r={width * u * hsc * 1.5 * heroK} fill="#fff" fillOpacity={0.9 * intensity} />
        </g>,
      );
    }
  });

  return (
    <AbsoluteFill style={{background: background === 'transparent' ? 'transparent' : background.startsWith('#') && !src ? '#0B0D22' : background}}>
      <Plate />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
        <defs>
          <filter id={`${uid}-g1`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glow * 0.45 * u} />
          </filter>
          <filter id={`${uid}-g2`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glow * 1.1 * u} />
          </filter>
        </defs>
        <g filter={`url(#${uid}-g2)`} opacity={0.75}>{nodes}</g>
        <g filter={`url(#${uid}-g1)`} opacity={0.9}>{nodes}</g>
        <g>{nodes}</g>
      </svg>
    </AbsoluteFill>
  );
};

const ROAD_OUT: [number, number][] = [[0.51, 0.665], [0.56, 0.72], [0.63, 0.8], [0.72, 0.9], [0.8, 1.0]];
const ROAD_IN: [number, number][] = [[0.49, 0.665], [0.44, 0.72], [0.37, 0.8], [0.28, 0.9], [0.2, 1.0]];

export const longExposureTrails = defineMotion<Props>({
  id: 'long-exposure-trails',
  title: 'Long-exposure trails',
  category: 'fx',
  description:
    'Dusk city with a road bending to the horizon: moving lights leave long glowing streaks like a long-exposure photograph — warm white headlights streaming toward the viewer and red tail-lights streaming away, each trail a tapered additive-glow line that fades toward its tail and grows with perspective, plus a brighter hero car. Overlay-capable: set background transparent (or give a src plate) and your own light paths.',
  source: ['lemo-opuscar styles/tilt-shift/STYLE.md §8 long-exposure light; DEMO.md dawn car trail (MIT, LemoLab)'],
  useFor: 'Night-city intros, logistics / delivery routes, "data packets" metaphors, festive lantern scenes, traffic and motion energy over any dark plate.',
  durationInFrames: 180,
  defaultProps: {
    paths: [
      {pts: ROAD_OUT, color: '#FF3B30', count: 9, speed: 0.17, offset: 6},
      {pts: ROAD_IN, color: '#FFF1C9', count: 9, speed: 0.19, offset: -6, reverse: true},
      {pts: [[0.505, 0.665], [0.6, 0.75], [0.7, 0.85], [0.86, 1.0]], color: '#FFF1C9', count: 1, speed: 0.12, offset: 0, hero: true, delay: 0.1},
    ],
    trail: 3,
    width: 4.5,
    glow: 14,
    rate: 1,
    background: '#0B0D22',
    src: '',
    headColor: '#FFF1C9',
    tailColor: '#FF3B30',
    intensity: 1,
    hero: true,
  },
  propDocs: {
    paths: 'light paths: {pts:[[x,y]…] (0-1 of the frame), color, count, speed (path fractions/s), offset (px), delay, perspective, reverse, hero}',
    trail: 'trail length in seconds of world time (1–4)',
    width: 'light core width in px at 1080p',
    glow: 'additive glow radius in px at 1080p',
    rate: 'time-lapse rate multiplier (higher = longer-looking streaks)',
    background: 'plate colour, or "transparent" to overlay on a host scene',
    src: 'optional plate image in public/ (replaces the procedural dusk city)',
    headColor: 'default head-light colour (warm white)',
    tailColor: 'default tail-light colour (red)',
    intensity: 'overall trail opacity 0–1.5',
    hero: 'enlarge paths flagged hero',
  },
  component: LongExposureTrails,
  tags: ['long exposure', 'light trails', 'headlights', 'tail lights', 'streak', 'night city', 'traffic', 'glow', 'dusk', 'overlay', 'time-lapse', 'routes', 'lanterns', 'additive'],
});
