// Ideas from lemo-opuscar/styles/impasto/demo/film.js l.284-297 (umbrella waltz, dabbed trails) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, cl, eio3, h1, lerp, mixC, seg, TAU} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  count: number;
  rings: number;
  bpm: number;
  palette: string[];
  ground: string;
  umbrellaR: number;
  dabEvery: number;
  zoomFrom: number;
  zoomTo: number;
  seed: number;
};

const mod = (a: number, n: number) => ((a % n) + n) % n;

const OverheadTrailMandala: React.FC<Props> = ({count, rings, bpm, palette, ground, umbrellaR, dabEvery, zoomFrom, zoomTo, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const t = frame / 30;
  const beat = 60 / bpm;
  const R = umbrellaR * u;
  const nR = Math.max(1, Math.round(rings));
  const total = Math.max(1, Math.round(count));
  // distribute umbrellas over rings, outer rings hold more
  const weights = Array.from({length: nR}, (_, r) => r + 1.4);
  const wsum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((q) => Math.max(3, Math.round((total * q) / wsum)));
  const dancers: {ring: number; k: number; n: number; id: number}[] = [];
  counts.forEach((n, r) => {
    for (let k = 0; k < n; k++) dancers.push({ring: r, k, n, id: dancers.length});
  });

  /** deterministic dance: ring radius breathes with a downbeat swell every bar of three, rings counter-rotate */
  const dancePos = (d: {ring: number; k: number; n: number; id: number}, tt: number): [number, number] => {
    const bar = mod(tt / (beat * 3), 1);
    const pulse = Math.exp(-bar * 6.5);
    const base = 150 * u + d.ring * (R * 2.15 + 40 * u);
    const rad = base * (1 + 0.11 * pulse) + 20 * u * Math.sin(tt * 1.3 + d.id);
    const dir = d.ring % 2 === 0 ? 1 : -1;
    const th = (TAU * d.k) / d.n + dir * tt * (0.34 - d.ring * 0.05) + 0.25 * Math.sin(tt * 0.9 + d.ring) + d.ring * 0.4;
    return [Math.cos(th) * rad, Math.sin(th) * rad];
  };
  const tIn = (d: {ring: number; k: number}) => 0.2 + d.ring * 0.55 + d.k * 0.09;

  const zoom = lerp(zoomFrom, zoomTo, eio3(seg(frame, 6, durationInFrames - 20)));
  const rot = lerp(0, 38, eio3(seg(frame, 6, durationInFrames - 20))) + t * 1.2;
  const step = (beat * dabEvery) as number;
  const col = (i: number) => palette[i % palette.length] ?? '#E8503A';

  return (
    <AbsoluteFill style={{background: ground, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="otm-cobble" width={240 * u} height={240 * u} patternUnits="userSpaceOnUse">
            <rect width={240 * u} height={240 * u} fill={mixC(ground, '#000000', 0.18)} />
            {Array.from({length: 30}, (_, i) => {
              const cx = (i % 6) * 40 * u + (Math.floor(i / 6) % 2 ? 20 * u : 0) + (h1(i, seed) - 0.5) * 6 * u;
              const cy = Math.floor(i / 6) * 48 * u + 24 * u + (h1(i, seed + 2) - 0.5) * 6 * u;
              const tone = h1(i, seed + 5);
              return <rect key={i} x={cx - 18 * u} y={cy - 21 * u} width={36 * u} height={42 * u} rx={11 * u} fill={mixC(ground, tone > 0.5 ? '#FFFFFF' : '#000000', 0.04 + tone * 0.08)} />;
            })}
          </pattern>
          <radialGradient id="otm-vig" cx="50%" cy="50%" r="72%">
            <stop offset="55%" stopColor="#0E0E14" stopOpacity="0" />
            <stop offset="100%" stopColor="#0E0E14" stopOpacity="0.5" />
          </radialGradient>
        </defs>
        <g transform={`translate(${w / 2} ${h / 2}) rotate(${rot}) scale(${zoom})`}>
          <rect x={-w * 3} y={-h * 3} width={w * 6} height={h * 6} fill="url(#otm-cobble)" />
          {/* dabbed trails: sampled from the past, so the frame is a pure function of time */}
          {dancers.map((d) => {
            const t0 = tIn(d);
            if (t < t0) return null;
            let dd = '';
            for (let tau = t0; tau <= t; tau += step) {
              const p = dancePos(d, tau);
              const q = dancePos(d, tau + 0.04);
              const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
              const L = 10 * u;
              dd += `M${(p[0] - Math.cos(a) * L).toFixed(1)} ${(p[1] - Math.sin(a) * L).toFixed(1)}L${(p[0] + Math.cos(a) * L).toFixed(1)} ${(p[1] + Math.sin(a) * L).toFixed(1)}`;
            }
            return <path key={d.id} d={dd} stroke={col(d.id)} strokeWidth={8 * u} strokeLinecap="round" fill="none" opacity={0.92} />;
          })}
          {/* umbrellas seen from above */}
          {dancers.map((d) => {
            const t0 = tIn(d);
            const s = backOut(seg(t, t0, t0 + 0.4), 2);
            if (s <= 0.01) return null;
            const [x, y] = dancePos(d, t);
            const c = col(d.id);
            const light = mixC(c, '#FFF3E0', 0.55);
            const spin = (t * 55 + d.id * 40) * (d.ring % 2 ? -1 : 1);
            const pulse = 1 + 0.06 * Math.exp(-mod(t / (beat * 3), 1) * 8);
            return (
              <g key={d.id} transform={`translate(${x} ${y})`}>
                <circle cx={9 * u} cy={11 * u} r={R * s} fill="#0A0A10" opacity={0.3} />
                <g transform={`rotate(${spin}) scale(${s * pulse})`}>
                  {Array.from({length: 8}, (_, i) => {
                    const a0 = (i * TAU) / 8;
                    const a1 = ((i + 1) * TAU) / 8;
                    return <path key={i} d={`M0 0L${Math.cos(a0) * R} ${Math.sin(a0) * R}A${R} ${R} 0 0 1 ${Math.cos(a1) * R} ${Math.sin(a1) * R}Z`} fill={i % 2 ? light : c} />;
                  })}
                  <circle r={R} fill="none" stroke={mixC(c, '#000', 0.35)} strokeWidth={3 * u} />
                  <circle r={7 * u} fill={mixC(c, '#000', 0.4)} />
                </g>
              </g>
            );
          })}
        </g>
        <rect width={w} height={h} fill="url(#otm-vig)" />
      </svg>
    </AbsoluteFill>
  );
};

export const overheadTrailMandala = defineMotion<Props>({
  id: 'overhead-trail-mandala',
  title: 'Overhead trail mandala',
  category: 'data',
  description:
    'Top-down 8-panel umbrellas dance in counter-rotating rings on grey cobbles, swelling on every downbeat of a waltz, while each drips its colour as dashed dabs along its path; the camera rotates and cranes out until the trails read as a coloured mandala.',
  source: ['lemo-opuscar styles/impasto/demo/film.js l.284-297, docs/frames/impasto.jpg (MIT, LemoLab)'],
  useFor: 'Choreography, routes and "many paths make a pattern": delivery networks, community, team dashboards, movement maps.',
  durationInFrames: 270,
  defaultProps: {
    count: 21,
    rings: 3,
    bpm: 96,
    palette: ['#E8503A', '#F2A93B', '#2F9E8F', '#3E6FD8', '#C2458F', '#7BB661', '#F27C9A', '#6A4CC2'],
    ground: '#8D9096',
    umbrellaR: 84,
    dabEvery: 0.125,
    zoomFrom: 1.7,
    zoomTo: 0.72,
    seed: 4,
  },
  propDocs: {
    count: 'number of umbrellas (spread over the rings)',
    rings: 'number of dance rings (1–4)',
    bpm: 'waltz tempo; rings swell on each bar of three',
    palette: 'umbrella / trail colours',
    ground: 'cobble colour',
    umbrellaR: 'umbrella radius in px at 1080p (the original is 128–150, fewer umbrellas)',
    dabEvery: 'trail dab spacing in beats (0.125 = every eighth of a beat)',
    zoomFrom: 'camera zoom at the start',
    zoomTo: 'camera zoom at the end (crane out)',
    seed: 'cobble layout seed',
  },
  component: OverheadTrailMandala,
  tags: ['top down', 'umbrella', 'waltz', 'trails', 'mandala', 'choreography', 'routes', 'paths', 'pattern', 'crane out', 'dance', 'rings', 'network', 'community'],
});
