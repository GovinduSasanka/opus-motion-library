import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, spring, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {Lotus, mix, shade} from '../../core/shape-kit';
import {FilmGrain, PaperTexture, Svg, Vignette, useStage} from '../../core/stage';
import {withPortraitFit} from '../../core/portrait3';
import {defineMotion} from '../../core/types';

/**
 * Two blooms in one motion:
 *  - style "lotus" (video4 22.10-22.45 s `lotus-bloom-pop`): layered pointed petals unfold from a closed bud
 *    with spring overshoot (damping 12, stiffness 180), outer layer first; ripples spread on the water plane.
 *  - style "radial" (video15 2.35-4.6 s `radial-petal-bloom`): a seed disk pops, then rings of narrow spike
 *    petals sweep clockwise from 12 o'clock (0.4 s per ring, back-out growth) into a dense fur/sunflower ball
 *    in front of a big orange sun, while the whole ball scales 0.18 -> 1.
 */
type Props = {
  style: 'lotus' | 'radial';
  petalCount: number;
  layers: number;
  colors: string[];
  centerColor: string;
  background: string;
  sun: boolean;
  start: number;
  seed: number;
};

const backOut = Easing.out(Easing.back(1.6));
const cubicOut = Easing.out(Easing.cubic);

const LotusBloom: React.FC<Props> = ({petalCount, layers, colors, centerColor, background, start}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const bg = background || '#ECE4D7';
  const c0 = colors[0] ?? '#F8B6E6';
  const c1 = colors[1] ?? '#E546AA';
  const size = Math.min(w, h) * (portrait ? 0.36 : 0.34);
  const x = cx;
  const y = cy + size * 0.32;
  const pop = spring({frame: frame - start + 8, fps: 30, config: {damping: 14, stiffness: 140}});
  const nL = Math.max(1, Math.round(layers));
  const open = Array.from({length: nL}, (_, L) => Math.max(0.03 * pop, spring({frame: frame - start - L * 5, fps: 30, config: {damping: 12, stiffness: 180}})));
  const done = start + nL * 5 + 12;
  const sway = Math.sin((frame - done) * 0.06) * prog(frame, done, done + 20, ease.sine);
  const bloomT = start + (nL - 1) * 5;
  const sparks = useMemo(() => {
    const r = rng(11);
    return Array.from({length: 14}, () => ({a: r() * Math.PI * 2, d: 0.6 + r() * 0.7, s: 10 + r() * 14, t0: r() * 30, life: 24 + r() * 20}));
  }, []);
  return (
    <AbsoluteFill style={{background: bg}}>
      <PaperTexture opacity={0.35} />
      <Svg>
        {/* water ripples on the plane */}
        {[0, 1, 2, 3].map((k) => {
          const t = prog(frame, bloomT + k * 7, bloomT + k * 7 + 48, (v) => 1 - (1 - v) * (1 - v));
          if (t <= 0 || t >= 1) return null;
          const R = size * (0.6 + 2.6 * t);
          return <ellipse key={k} cx={x} cy={y} rx={R} ry={R * 0.3} fill="none" stroke={c1} strokeWidth={(5 - k) * u * (1 - t) + 1 * u} opacity={(1 - t) * 0.7} />;
        })}
        <ellipse cx={x} cy={y + size * 0.05} rx={size * 1.05 * pop} ry={size * 0.3 * pop} fill={shade(bg, -0.12)} opacity={0.55} />
        <g transform={`rotate(${sway * 1.5} ${x} ${y})`}>
          <Lotus
            x={x}
            y={y}
            size={size * pop}
            open={open}
            petals={Math.max(3, Math.round(petalCount))}
            squash={0.4}
            colors={[c0, c1]}
            center={centerColor || '#F2B33D'}
            id="pb-lotus"
            shadow={false}
            layerLight={open.map((_, L) => (L / Math.max(1, nL - 1)) * 0.35)}
          />
        </g>
        {sparks.map((s, i) => {
          const age = frame - done + 6 - s.t0;
          if (age < 0 || age > s.life) return null;
          const t = age / s.life;
          return (
            <Sparkle
              key={i}
              x={x + Math.cos(s.a) * size * s.d}
              y={y - size * 0.35 + Math.sin(s.a) * size * s.d * 0.55 - t * 30 * u}
              size={s.s * u * Math.sin(Math.PI * t)}
              color={i % 3 ? '#FFF6B0' : '#F2B92E'}
              rotate={t * 45}
            />
          );
        })}
      </Svg>
      <Vignette strength={0.28} color="120,110,95" />
    </AbsoluteFill>
  );
};

const RadialBloom: React.FC<Props> = ({petalCount, layers, colors, centerColor, background, sun, start, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy} = useStage();
  const bg = background || '#14203A';
  const base = colors[0] ?? '#C08938';
  const tipOuter = colors[1] ?? '#ECC67A';
  const tipInner = colors[2] ?? '#F3ECD6';
  const disk = centerColor || '#B9711F';
  const S = Math.min(w, h) / 1080;
  const K = Math.max(1, Math.round(layers * 2.34)); // 3 layers -> 7 rings

  const petals = useMemo(() => {
    const r = rng(seed);
    const out: {ring: number; a: number; r0: number; len: number; wid: number; delay: number; dark: boolean}[] = [];
    for (let k = 0; k < K; k++) {
      const n = Math.round(petalCount * 4.5 + 6 * k); // 8 -> 36 petals in ring 1
      const off = ((k * 137.5) % 360) * (Math.PI / 180);
      for (let i = 0; i < n; i++) {
        const frac = i / n;
        out.push({
          ring: k,
          a: -Math.PI / 2 + frac * Math.PI * 2 + off * 0.15 + (r() - 0.5) * 0.14,
          r0: (70 + k * 34) * u,
          len: (72 + k * 10 + r() * 22) * u,
          wid: (24 + r() * 9) * u,
          delay: start + 6 + k * 4 + frac * 12,
          dark: r() < 0.5,
        });
      }
    }
    return out.sort((p, q) => q.ring - p.ring);
  }, [K, petalCount, seed, u, start]);

  const grow = lerp(0.18, 1, prog(frame, start, start + 60, cubicOut));
  const rise = lerp(50, 0, prog(frame, start, start + 60, cubicOut)) * u;
  const diskS = prog(frame, start, start + 5, backOut);
  const sunR = 430 * S;
  const breathe = Math.sin(frame * 0.05) * 1.2;
  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <defs>
          <radialGradient id="pb-sun" cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#F9A35C" />
            <stop offset="70%" stopColor="#EF7436" />
            <stop offset="100%" stopColor="#D85A26" />
          </radialGradient>
          <radialGradient id="pb-disk" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor={shade(disk, 0.3)} />
            <stop offset="100%" stopColor={shade(disk, -0.25)} />
          </radialGradient>
          {Array.from({length: K}, (_, k) => {
            const tip = mix(tipInner, tipOuter, K > 1 ? k / (K - 1) : 1);
            return (
              <linearGradient key={k} id={`pb-p${k}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={base} />
                <stop offset="100%" stopColor={tip} />
              </linearGradient>
            );
          })}
        </defs>
        {sun && (
          <g opacity={prog(frame, 0, 10, ease.out)}>
            {Array.from({length: 90}, (_, i) => {
              const a = (i / 90) * Math.PI * 2 + frame * 0.002;
              const l = (i % 3 === 0 ? 60 : 38) * S;
              const x0 = cx + Math.cos(a) * (sunR - 6 * S);
              const y0 = cy + Math.sin(a) * (sunR - 6 * S);
              const x1 = cx + Math.cos(a) * (sunR + l);
              const y1 = cy + Math.sin(a) * (sunR + l);
              const px = -Math.sin(a) * 5 * S;
              const py = Math.cos(a) * 5 * S;
              return <path key={i} d={`M ${x0 + px} ${y0 + py} L ${x1} ${y1} L ${x0 - px} ${y0 - py} Z`} fill="#D9662C" opacity={0.85} />;
            })}
            <circle cx={cx} cy={cy} r={sunR} fill="url(#pb-sun)" />
          </g>
        )}
        <g transform={`translate(${cx} ${cy + rise}) scale(${grow}) rotate(${breathe})`}>
          {petals.map((p, i) => {
            const t = clamp((frame - p.delay) / 6);
            if (t <= 0) return null;
            const s = backOut(t);
            const deg = (p.a * 180) / Math.PI;
            const d = `M 0 0 Q ${p.len * 0.45} ${p.wid / 2} ${p.len} 0 Q ${p.len * 0.45} ${-p.wid / 2} 0 0 Z`;
            const half = `M 0 0 Q ${p.len * 0.45} ${p.wid / 2} ${p.len} 0 Z`;
            return (
              <g key={i} transform={`rotate(${deg}) translate(${p.r0 * 0.6} 0) scale(${s} ${lerp(0.6, 1, Math.min(1, s))})`}>
                <path d={d} fill={`url(#pb-p${p.ring})`} stroke={shade(base, -0.35)} strokeWidth={1 * u} strokeOpacity={0.35} />
                <path d={half} fill="#3a2108" opacity={p.dark ? 0.16 : 0.07} />
              </g>
            );
          })}
          <circle r={70 * u * diskS} fill="url(#pb-disk)" />
          {diskS > 0.5 &&
            Array.from({length: 34}, (_, i) => {
              const a = i * 2.39996;
              const rr = Math.sqrt(i / 34) * 58 * u;
              return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={3.2 * u} fill={shade(disk, -0.4)} opacity={0.55 * (diskS - 0.5) * 2} />;
            })}
        </g>
      </Svg>
      <FilmGrain opacity={0.07} />
    </AbsoluteFill>
  );
};

const PetalBloom: React.FC<Props> = (props) => (props.style === 'radial' ? <RadialBloom {...props} /> : <LotusBloom {...props} />);

export const petalBloom = defineMotion<Props>({
  id: 'petal-bloom',
  title: 'Petal bloom (lotus / radial)',
  category: 'shape',
  description: 'Layered petals unfold radially with spring overshoot into a lotus, or dense rings of spike petals sweep round a seed disk into a sunflower / fur ball.',
  source: ['video4 0:22.10-0:22.45 (lotus)', 'video15 0:02.35-0:04.6 (radial)'],
  useFor: 'An organic reveal of a result or idea; "it blossoms"; building a radial emblem, flower, logo mark or mascot head.',
  durationInFrames: 120,
  defaultProps: {
    style: 'lotus',
    petalCount: 8,
    layers: 3,
    colors: [],
    centerColor: '',
    background: '',
    sun: true,
    start: 10,
    seed: 15,
  },
  propDocs: {
    style: '"lotus" (spring-unfolding layered petals) or "radial" (spike rings sweeping round a seed disk)',
    petalCount: 'lotus: petals per layer; radial: ring 1 gets 4.5x this (8 -> 36), +6 per ring',
    layers: 'lotus: petal layers; radial: rings = 2.34x this (3 -> 7)',
    colors: 'lotus: [light, deep]; radial: [base, outer tip, inner tip] — empty uses the source palette',
    centerColor: 'lotus centre / radial seed disk colour ("" = default)',
    background: 'background colour ("" = paper for lotus, navy for radial)',
    sun: 'radial: big orange sun disc behind the bloom',
    start: 'frame the bloom starts',
  },
  component: withPortraitFit(PetalBloom, {s: 1.5}),
  tags: ['flower', 'bloom', 'organic', 'reveal', 'radial', 'lotus'],
});
