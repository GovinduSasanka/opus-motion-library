import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Light-leak wash: analogue film light leaks — big hot blobs of warm colour that bleed in from the frame edges, swell,
 * drift across and fall away, with a faint streak and optional grain. Screen-blended, so on footage (`background: "transparent"`)
 * it only adds light. Leaks fire on `leakAt` (frames); with none given they are spaced evenly.
 */
type Props = {
  colors: string[];
  leaks: number;
  leakAt: number[];
  leakFrames: number;
  intensity: number;
  softness: number;
  streak: boolean;
  grain: number;
  seed: number;
  background: string;
};

const LightLeak: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const id = useSafeId('leak');
  const r = rng(p.seed * 53 + 5);
  const cols = p.colors.length ? p.colors : ['#ff7a18'];
  const n = Math.max(1, Math.min(8, p.leaks));
  const blobs = Array.from({length: n}, (_, i) => {
    const edge = Math.floor(r() * 4);
    const along = 0.15 + r() * 0.7;
    const start = p.leakAt[i] ?? Math.round(((i + 0.5) / n) * durationInFrames - p.leakFrames / 2);
    const ex = edge === 0 ? -0.1 : edge === 1 ? 1.1 : along;
    const ey = edge === 2 ? -0.1 : edge === 3 ? 1.1 : along;
    return {
      start,
      ex,
      ey,
      tx: (edge === 0 ? 0.22 : edge === 1 ? 0.78 : along + (r() - 0.5) * 0.3) + (r() - 0.5) * 0.1,
      ty: (edge === 2 ? 0.22 : edge === 3 ? 0.78 : along + (r() - 0.5) * 0.3) + (r() - 0.5) * 0.1,
      rx: (0.22 + r() * 0.2) * w,
      ry: (0.3 + r() * 0.35) * h,
      col: cols[i % cols.length],
      col2: cols[(i + 1) % cols.length],
      rot: r() * 360,
    };
  });
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
        <defs>
          <filter id={`${id}f`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={p.softness * u} />
          </filter>
          <filter id={`${id}g`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 9} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <g filter={`url(#${id}f)`}>
          {blobs.map((b, i) => {
            const t = (frame - b.start) / Math.max(1, p.leakFrames);
            if (t < 0 || t > 1) return null;
            const inn = prog(frame, b.start, b.start + p.leakFrames * 0.45, ease.out);
            const out = 1 - prog(frame, b.start + p.leakFrames * 0.5, b.start + p.leakFrames, ease.in);
            const a = inn * out * p.intensity;
            const x = (b.ex + (b.tx - b.ex) * ease.sine(t)) * w;
            const y = (b.ey + (b.ty - b.ey) * ease.sine(t)) * h;
            const sc = 0.7 + 0.6 * inn;
            return (
              <g key={i} opacity={Math.min(1, a)} transform={`translate(${x} ${y}) rotate(${b.rot + t * 25}) scale(${sc})`}>
                <defs>
                  <radialGradient id={`${id}r${i}`}>
                    <stop offset="0" stopColor={b.col} stopOpacity="0.95" />
                    <stop offset="0.55" stopColor={b.col} stopOpacity="0.45" />
                    <stop offset="1" stopColor={b.col} stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id={`${id}c${i}`}>
                    <stop offset="0" stopColor={b.col2} stopOpacity="0.95" />
                    <stop offset="0.5" stopColor={b.col2} stopOpacity="0.4" />
                    <stop offset="1" stopColor={b.col2} stopOpacity="0" />
                  </radialGradient>
                </defs>
                <ellipse cx={0} cy={0} rx={b.rx * 1.6} ry={b.ry * 1.6} fill={`url(#${id}r${i})`} />
                <ellipse cx={b.rx * 0.2} cy={-b.ry * 0.1} rx={b.rx * 0.8} ry={b.ry * 0.75} fill={`url(#${id}c${i})`} />
                <ellipse cx={b.rx * 0.25} cy={0} rx={b.rx * 0.22} ry={b.ry * 0.24} fill="#fff1d6" opacity={0.55} />
              </g>
            );
          })}
        </g>
        {p.streak
          ? blobs.map((b, i) => {
              const t = (frame - b.start) / Math.max(1, p.leakFrames);
              if (t < 0 || t > 1) return null;
              const a = Math.sin(Math.PI * t) * 0.25 * p.intensity;
              const x = (b.ex + (b.tx - b.ex) * ease.sine(t)) * w;
              return <rect key={i} x={x - 6 * u} y={0} width={12 * u} height={h} fill={b.col2} opacity={a} filter={`url(#${id}f)`} transform={`rotate(${(b.rot % 30) - 15} ${x} ${h / 2})`} />;
            })
          : null}
      </svg>
      {p.grain > 0 ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: p.grain, mixBlendMode: 'overlay'}}>
          <rect width={w} height={h} filter={`url(#${id}g)`} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

export const lightLeakWash = defineMotion<Props>({
  id: 'light-leak-wash',
  title: 'Light-leak wash',
  category: 'texture',
  description: 'Analogue film light leaks: hot colour blobs bleed in from the frame edges, swell, drift and fall away, screen-blended.',
  source: ['texture-vocabulary: film light leaks'],
  useFor: 'Warm nostalgic transitions and accents over footage or photos, wedding / travel / memory edits, title cards that need an analogue glow; use transparent background as an overlay.',
  durationInFrames: 150,
  defaultProps: {
    colors: ['#ff6a1a', '#ff2d55', '#ffb347', '#ff8a3d'],
    leaks: 3,
    leakAt: [],
    leakFrames: 70,
    intensity: 0.85,
    softness: 40,
    streak: true,
    grain: 0.25,
    seed: 4,
    background: '#120c0f',
  },
  propDocs: {
    colors: 'leak colours (cycled per leak; first of each pair is the body, the next the hot core)',
    leaks: 'how many leaks (1-8)',
    leakAt: 'start frames of each leak (empty = spaced evenly)',
    leakFrames: 'life of each leak in frames',
    intensity: 'brightness 0..1',
    softness: 'blur of the blobs in u',
    streak: 'thin light streak that rides each leak',
    grain: 'film grain overlay opacity (0 = none)',
    seed: 'layout seed',
    background: 'CSS background; "transparent" = overlay on footage',
  },
  component: LightLeak,
  tags: ['light leak', 'film', 'analog', 'warm', 'glow', 'overlay', 'texture', 'transition', 'nostalgia', 'vintage'],
});
