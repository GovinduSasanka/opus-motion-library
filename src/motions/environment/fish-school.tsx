import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {n2, rng, range} from '../../core/random';
import {smoothOpen} from '../../core/shapes';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {Fish, Jellyfish, makeRidge, mix, ridgePath} from '../../core/world-kit';

type Props = {
  count: number;
  path: number[][];
  fishSize: number;
  fishColor: string;
  bellyColor: string;
  spread: number;
  jellies: number;
  waterTop: string;
  waterBottom: string;
  floor: boolean;
  rays: boolean;
  seed: string;
};

const bez = (p: number[][], t: number): [number, number] => {
  const [a, b, c, d] = p;
  const m = 1 - t;
  return [
    m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0],
    m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1],
  ];
};

const FishSchool: React.FC<Props> = ({count, path, fishSize, fishColor, bellyColor, spread, jellies, waterTop, waterBottom, floor, rays, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D, portrait} = useStage();
  const id = `fish-school-${seed}`;
  const ctrl = (path.length >= 4 ? path : [[-0.1, 0.66], [0.3, 0.06], [0.7, 1.0], [1.1, 0.34]]).slice(0, 4).map(([x, y]) => [x * w, y * h]);
  const T = 0.12 + 0.9 * prog(frame, 0, D - 1, ease.sine);
  const r = rng(`${seed}-fish`);
  const fish = Array.from({length: count}, (_, i) => ({
    lag: Math.pow(r(), 1.4) * 0.18,
    side: range(r, -1, 1),
    z: r(),
    ph: r() * 6.28,
    hz: range(r, 2.6, 3.4),
    i,
  }));
  const S = fishSize * u * (portrait ? 1.1 : 1);

  const placed = fish
    .map((f) => {
      const t = T - f.lag;
      const [x, y] = bez(ctrl, clamp(t, -0.2, 1.2));
      const [x2, y2] = bez(ctrl, clamp(t + 0.01, -0.2, 1.2));
      const a = Math.atan2(y2 - y, x2 - x);
      // spread perpendicular to travel + low-frequency wander (boids-like loose cluster)
      const perp = f.side * spread * u;
      const nx = n2(`${seed}nx`, f.i * 1.7, frame * 0.012) * 25 * u;
      const ny = n2(`${seed}ny`, f.i * 1.7, frame * 0.012) * 25 * u;
      return {
        f,
        x: x - Math.sin(a) * perp + nx,
        y: y + Math.cos(a) * perp + ny,
        a: (a * 180) / Math.PI + n2(`${seed}na`, f.i, frame * 0.03) * 6,
        s: 0.6 + 0.5 * f.z,
      };
    })
    .sort((p, q) => p.f.z - q.f.z);

  const jr = rng(`${seed}-jelly`);
  const jel = Array.from({length: jellies}, (_, i) => ({
    x: range(jr, 0.12, 0.88) * w,
    y0: range(jr, 0.25, 0.8) * h,
    r: range(jr, 26, 48) * u,
    per: range(jr, 48, 66),
    ph: jr() * 100,
    i,
  }));
  const floorR = makeRidge(`${seed}-floor`, w, [1, 2, 3, 5, 9], 0.55);
  const floorY = h * (portrait ? 0.9 : 0.86);
  const kelp = Array.from({length: portrait ? 7 : 10}, (_, i) => {
    const kr = rng(`${seed}-kelp${i}`);
    return {x: (i + range(kr, 0.1, 0.9)) * (w / (portrait ? 7 : 10)), hh: range(kr, 0.2, 0.45) * h, ph: kr() * 6, c: kr()};
  });
  const motes = Array.from({length: 90}, () => ({x: r() * w, y: r() * h, s: range(r, 0.8, 2.2), ph: r() * 6}));

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${waterTop} 0%, ${mix(waterTop, waterBottom, 0.55)} 50%, ${waterBottom} 100%)`}}>
      <Svg>
        <defs>
          <radialGradient id={`${id}-vig`} cx="50%" cy="45%" r="75%">
            <stop offset="50%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.6} />
          </radialGradient>
          <linearGradient id={`${id}-ray`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9f6fb" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#d9f6fb" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* surface shimmer + god rays */}
        {rays && (
          <g style={{mixBlendMode: 'screen'}}>
            {Array.from({length: 9}, (_, k) => {
              const x0 = w * (0.05 + k * 0.11) + Math.sin(frame * 0.015 + k) * 25 * u;
              const sw = (26 + (k % 3) * 22) * u;
              return <polygon key={k} points={`${x0},0 ${x0 + sw},0 ${x0 + sw * 2.5 + 260 * u},${h} ${x0 + 220 * u},${h}`} fill={`url(#${id}-ray)`} opacity={0.6 + 0.4 * Math.sin(frame * 0.04 + k * 1.9)} />;
            })}
            <path
              d={`M0 0L${w} 0L${w} ${30 * u}` + Array.from({length: 41}, (_, k) => `L${w - (k / 40) * w} ${(22 + 8 * Math.sin(k * 1.1 + frame * 0.12)) * u}`).join('') + 'Z'}
              fill="#cfeef2"
              opacity={0.25}
            />
          </g>
        )}
        {/* drifting particles */}
        {motes.map((m, i) => (
          <circle key={i} cx={(m.x + Math.sin(frame * 0.02 + m.ph) * 8 * u) % w} cy={(((m.y - frame * 0.4 * u) % h) + h) % h} r={m.s * u} fill="#cdeef4" opacity={0.25} />
        ))}
        {/* far jellyfish (behind the school) */}
        {jel
          .filter((j) => j.i % 2 === 1)
          .map((j) => {
            const ph = ((frame + j.ph) % j.per) / j.per;
            const pulse = Math.pow(Math.sin(ph * Math.PI), 2);
            const rise = (Math.floor((frame + j.ph) / j.per) + ease.out(ph)) * 12 * u - (j.ph / j.per) * 12 * u;
            return (
              <g key={j.i} transform={`translate(${j.x},${j.y0 - rise}) scale(0.7)`} opacity={0.7}>
                <Jellyfish id={`${id}-j${j.i}`} r={j.r} pulse={pulse} lag={Math.sin(ph * Math.PI * 2)} frame={frame} seed={j.i} color="#e3d8ff" glow="#9a8cff" />
              </g>
            );
          })}
        {/* sea floor + kelp */}
        {floor && (
          <g>
            {kelp.map((k, i) => {
              const pts: [number, number][] = Array.from({length: 7}, (_, s) => {
                const tt = s / 6;
                return [k.x + Math.sin(frame * 0.04 + k.ph + tt * 2.4) * 26 * u * tt, floorY + 10 * u - tt * k.hh];
              });
              return <path key={i} d={smoothOpen(pts)} stroke={mix('#2f6b4f', waterBottom, 0.3 + k.c * 0.3)} strokeWidth={(12 + k.c * 8) * u} fill="none" strokeLinecap="round" />;
            })}
            <path d={ridgePath(floorR, -10, w + 10, floorY, 0.03 * h, h + 4, 12)} fill={mix('#c9b98a', waterBottom, 0.55)} />
            <path d={ridgePath(floorR, -10, w + 10, floorY + 0.04 * h, 0.02 * h, h + 4, 12)} fill={mix('#c9b98a', waterBottom, 0.68)} />
          </g>
        )}
        {/* school */}
        {placed.map((p) => {
          const L = S * p.s;
          const col = mix(fishColor, waterTop, (1 - p.f.z) * 0.45);
          const bel = mix(bellyColor, waterTop, (1 - p.f.z) * 0.45);
          const flip = Math.abs(((p.a % 360) + 360) % 360 - 180) < 90; // swimming left -> keep belly down
          return (
            <g key={p.f.i} transform={`translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${p.a.toFixed(1)}) scale(1,${flip ? -1 : 1})`}>
              <Fish id={`${id}-f${p.f.i}`} len={L} wiggle={18 * Math.sin((frame / 30) * Math.PI * 2 * p.f.hz + p.f.ph)} body={col} belly={bel} eye={p.f.z > 0.3} />
            </g>
          );
        })}
        {/* near jellyfish */}
        {jel
          .filter((j) => j.i % 2 === 0)
          .map((j) => {
            const ph = ((frame + j.ph) % j.per) / j.per;
            const pulse = Math.pow(Math.sin(ph * Math.PI), 2);
            const rise = (Math.floor((frame + j.ph) / j.per) + ease.out(ph)) * 14 * u - (j.ph / j.per) * 14 * u;
            return (
              <g key={j.i} transform={`translate(${j.x},${j.y0 - rise})`}>
                <Jellyfish id={`${id}-j${j.i}`} r={j.r} pulse={pulse} lag={Math.sin(ph * Math.PI * 2)} frame={frame} seed={j.i} color="#f0e6ff" glow="#a99cff" />
              </g>
            );
          })}
        <rect x={0} y={0} width={w} height={h} fill={`url(#${id}-vig)`} />
      </Svg>
    </AbsoluteFill>
  );
};

export const fishSchool = defineMotion<Props>({
  id: 'fish-school',
  title: 'Fish school + jellyfish',
  category: 'environment',
  description:
    'Underwater scene: a loose school of fish sweeps across the frame along an eased Bézier S-curve, each fish trailing at its own lag with tail wobble, depth-faded colour and gentle wander, past pulsing glowing jellyfish, swaying kelp, god-rays and drifting particles.',
  source: ['video23 0:03-0:40 sprite-swim-cycle (fish school, jellyfish)'],
  useFor: 'Ocean / nature beats, "moving together" or crowd metaphors, calm ambient backgrounds.',
  durationInFrames: 210,
  defaultProps: {
    count: 42,
    path: [
      [-0.1, 0.66],
      [0.3, 0.06],
      [0.7, 1.0],
      [1.1, 0.34],
    ],
    fishSize: 78,
    fishColor: '#2d6c84',
    bellyColor: '#cfe9ee',
    spread: 150,
    jellies: 5,
    waterTop: '#2B88A2',
    waterBottom: '#004768',
    floor: true,
    rays: true,
    seed: 'reef',
  },
  propDocs: {
    count: 'number of fish in the school',
    path: 'cubic Bézier control points [[x,y] x4] as fractions of the frame; the school travels it over the clip (ease in-out)',
    fishSize: 'fish length in u',
    fishColor: 'back colour of the fish',
    bellyColor: 'belly colour of the fish',
    spread: 'half-width of the school across its path (u)',
    jellies: 'number of pulsing jellyfish',
    waterTop: 'water colour at the top',
    waterBottom: 'water colour at the bottom',
    floor: 'sandy floor with swaying kelp',
    rays: 'god-rays and surface shimmer',
    seed: 'random seed',
  },
  component: FishSchool,
  tags: ['ocean', 'fish', 'underwater', 'school', 'jellyfish', 'nature'],
});
