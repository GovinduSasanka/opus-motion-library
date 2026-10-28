import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useSafeId} from '../../core/image-kit';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Bokeh drift: soft out-of-focus light discs in three depth bands (far = small and blurry, near = large, soft and slower to
 * read) drifting through the frame in a chosen direction with a gentle twinkle. Wrap-around motion over the clip length
 * makes it loop. `background: "transparent"` makes it an overlay for footage.
 */
type Props = {
  colors: string[];
  count: number;
  direction: number;
  speed: number;
  size: number;
  softness: number;
  ring: number;
  twinkle: number;
  shape: 'circle' | 'hex';
  blend: 'screen' | 'normal' | 'plus-lighter';
  seed: number;
  background: string;
};

const Bokeh: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const id = useSafeId('bokeh');
  const r = rng(p.seed * 131 + 7);
  const cols = p.colors.length ? p.colors : ['#ffffff'];
  const dirX = Math.cos((p.direction * Math.PI) / 180);
  const dirY = -Math.sin((p.direction * Math.PI) / 180);
  const L = Math.hypot(w, h);
  const items = Array.from({length: Math.max(1, Math.min(160, p.count))}, (_, i) => {
    const band = i % 3; // 0 far, 1 mid, 2 near
    const depthScale = [0.45, 0.8, 1.35][band];
    return {
      band,
      x0: r() * w,
      y0: r() * h,
      rad: (28 + r() * 60) * p.size * depthScale * u,
      spd: (0.5 + r() * 0.7) * [0.5, 1, 1.7][band],
      col: cols[Math.floor(r() * cols.length) % cols.length],
      a: 0.5 + r() * 0.5,
      ph: r() * Math.PI * 2,
      rot: r() * 60,
    };
  });
  const travel = (frame / durationInFrames) * p.speed * L * 0.5; // whole-clip travel ~ speed * half diagonal
  const wrap = (v: number, m: number) => ((v % m) + m) % m;
  const blurs = [p.softness * 2.2, p.softness, p.softness * 1.6].map((b) => b * u);
  const hexPts = (cx: number, cy: number, rad: number, rot: number) =>
    Array.from({length: 6}, (_, k) => {
      const a = ((rot + k * 60) * Math.PI) / 180;
      return `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`;
    }).join(' ');
  const mode = p.blend === 'normal' ? 'normal' : p.blend === 'plus-lighter' ? 'plus-lighter' : 'screen';
  return (
    <AbsoluteFill style={{background: p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, mixBlendMode: mode as React.CSSProperties['mixBlendMode']}}>
        <defs>
          {blurs.map((b, i) => (
            <filter key={i} id={`${id}b${i}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={b} />
            </filter>
          ))}
        </defs>
        {[0, 1, 2].map((band) => (
          <g key={band} filter={`url(#${id}b${band})`}>
            {items
              .filter((d) => d.band === band)
              .map((d, i) => {
                const m = w + d.rad * 4;
                const mh = h + d.rad * 4;
                const x = wrap(d.x0 + dirX * travel * d.spd + d.rad * 2, m) - d.rad * 2;
                const y = wrap(d.y0 + dirY * travel * d.spd + d.rad * 2, mh) - d.rad * 2;
                const tw = 1 - p.twinkle * 0.5 * (1 + Math.sin((frame / durationInFrames) * Math.PI * 2 * 3 + d.ph));
                const a = d.a * tw;
                const fill = `${d.col}`;
                return p.shape === 'hex' ? (
                  <polygon key={i} points={hexPts(x, y, d.rad, d.rot)} fill={fill} opacity={a * (1 - p.ring * 0.3)} stroke={fill} strokeWidth={d.rad * 0.08 * p.ring} strokeOpacity={Math.min(1, a * 1.6)} />
                ) : (
                  <circle key={i} cx={x} cy={y} r={d.rad} fill={fill} opacity={a * (1 - p.ring * 0.3)} stroke={fill} strokeWidth={d.rad * 0.09 * p.ring} strokeOpacity={Math.min(1, a * 1.6)} />
                );
              })}
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const bokehDrift = defineMotion<Props>({
  id: 'bokeh-drift',
  title: 'Bokeh drift',
  category: 'texture',
  description: 'Soft depth-of-field light discs in three depth bands drifting through the frame with a gentle twinkle; circle or hexagon bokeh.',
  source: ['texture-vocabulary: bokeh light backgrounds'],
  useFor: 'Dreamy or festive backgrounds behind titles, night-city and party moods, wedding / event / luxury intros; overlay on footage with a transparent background.',
  durationInFrames: 180,
  defaultProps: {
    colors: ['#ffd9a0', '#ff9ec7', '#9ad7ff', '#ffffff'],
    count: 46,
    direction: 70,
    speed: 0.6,
    size: 1,
    softness: 3.5,
    ring: 0.6,
    twinkle: 0.5,
    shape: 'circle',
    blend: 'screen',
    seed: 3,
    background: '#0b0a1c',
  },
  propDocs: {
    colors: 'light colours picked per disc',
    count: 'number of discs (max 160)',
    direction: 'drift direction in degrees (0 = right, 90 = up, 180 = left)',
    speed: 'drift distance over the clip (loops by wrap-around)',
    size: 'disc size multiplier',
    softness: 'blur of the discs in u (higher = more defocused)',
    ring: 'bright rim on each disc (0 = flat disc, 1 = strong lens ring)',
    twinkle: 'brightness flicker amount (0..1)',
    shape: 'circle | hex (aperture blades)',
    blend: 'screen | normal | plus-lighter',
    seed: 'layout seed',
    background: 'CSS background; "transparent" = overlay on footage',
  },
  component: Bokeh,
  tags: ['bokeh', 'lights', 'depth of field', 'dreamy', 'background', 'texture', 'overlay', 'particles', 'night', 'party', 'loop'],
});
