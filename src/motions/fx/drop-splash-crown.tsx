// Adapted from mg-styles-15/demos/07-liquid/js/scene.js (makeDroplet, emitDroplet, tendrilState) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {LiquidShade, hash, taper} from '../../core/r2-mg2b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A glossy liquid drop falls stretched, hits a polished floor, squashes into a lens (no pancake) and throws a crown of
 * tapered tendrils; each tip beads up and pinches off as a secondary droplet that flies on a ballistic arc and lands as a
 * small bead (or melts into the puddle) while the stubs recoil. Every state is closed-form in time, shaded as jelly with
 * `LiquidShade` and mirrored in the floor. Drops are a list, so a second one can land in the puddle.
 */
type Drop = {t: number; x: number; size: number; hue: number};
type Props = {
  drops: Drop[];
  crown: {count: number; height: number};
  secondaries: boolean;
  floorY: number;
  reflection: number;
  cameraMacro: boolean;
  light: number;
  background: string;
};

type Shape = {k: 'e'; x: number; y: number; rx: number; ry: number} | {k: 'c'; x: number; y: number; r: number};

const dropShapes = (frame: number, d: Drop, w: number, floor: number, u: number, crown: Props['crown'], secondaries: boolean, macro: boolean): Shape[] => {
  const r = 72 * u * d.size * (macro ? 2.5 : 1);
  const X = d.x * w;
  const out: Shape[] = [];
  const tau = (frame - d.t) / 30;
  if (frame < d.t) {
    const s = (d.t - frame) / 16;
    if (s > 1.35) return out;
    const sv = 1 + 0.45 * Math.min(1, s * 1.6);
    const hgt = floor * 0.8 * s * s;
    const y = floor - r * sv - hgt;
    out.push({k: 'e', x: X, y, rx: r / Math.sqrt(sv), ry: r * sv});
    out.push({k: 'c', x: X, y: y - r * sv * 1.1, r: r * 0.38});
    return out;
  }
  const eo = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
  // lens + puddle
  const lensRy = r * (0.13 + 0.87 * Math.exp(-tau / 0.06));
  const lensRx = r * (1 + 1.0 * eo(tau / 0.16));
  if (tau < 0.5) out.push({k: 'e', x: X, y: floor - lensRy * 0.55, rx: lensRx, ry: lensRy});
  const pud = Math.exp(-Math.max(0, tau - 1.8) / 2.4);
  out.push({k: 'e', x: X, y: floor - r * 0.05, rx: r * (1 + 1.4 * eo(tau / 0.2)) * pud, ry: r * 0.12 * pud + 1});
  // crown
  const n = Math.max(2, Math.round(crown.count));
  const up = eo(tau / 0.2);
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * 2 - 1;
    const hi = (crown.height * r * (2.1 - 0.7 * Math.abs(s)) * (0.85 + 0.3 * hash(i + d.t))) ;
    const base = X + s * lensRx * 0.78;
    const tp = 0.1 + 0.025 * (i % 3);
    const stub = tau > 0.28 ? Math.exp(-(tau - 0.28) / 0.1) : 1;
    const tipX = base + s * up * r * 0.95;
    const tipY = floor - up * hi;
    const rb = r * 0.26 * (1 - 0.3 * Math.abs(s));
    if (tau <= tp) {
      if (tau < 0.35) {
        taper(base, floor - 2 * u, tipX, tipY, rb, r * 0.13).forEach((c) => out.push({k: 'c', x: c.x, y: c.y, r: c.r}));
        out.push({k: 'c', x: tipX, y: tipY, r: r * (0.13 + 0.07 * (tau / tp))});
      }
    } else {
      const dt = tau - tp;
      const pH = Math.max(0.55, stub);
      const stubTipY = floor - (floor - tipY) * pH * 0.55;
      const stubTipX = base + (tipX - base) * pH * 0.55;
      if (stub > 0.04) taper(base, floor - 2 * u, stubTipX, stubTipY, rb * Math.max(0.5, stub), r * 0.1 * Math.max(0.4, stub)).forEach((c) => out.push({k: 'c', x: c.x, y: c.y, r: c.r}));
      if (secondaries) {
        const rr = r * (0.15 + 0.07 * hash(i * 3 + d.t));
        const vx = (s * 210 + (hash(i + 50 + d.t) - 0.5) * 90) * u * (macro ? 2.2 : 1);
        const vy = -(300 + hash(i + 80 + d.t) * 420) * u * (macro ? 1.8 : 1);
        const g = 2300 * u * (macro ? 1.8 : 1);
        const y0 = tipY;
        const x0 = tipX;
        const land = floor - rr * 0.7;
        const disc = vy * vy - 2 * g * (y0 - land);
        const tl = disc > 0 ? (-vy + Math.sqrt(disc)) / g : 1e9;
        if (dt < tl) out.push({k: 'c', x: x0 + vx * dt, y: y0 + vy * dt + 0.5 * g * dt * dt, r: rr});
        else {
          const rest = dt - tl;
          const lx = x0 + vx * tl;
          const keep = i % 2 === 0;
          const sz = keep ? 1 - 0.25 * clamp(rest / 1.2) : clamp(1 - Math.max(0, rest - 0.25) / 0.45);
          const sq = eo(rest / 0.06);
          if (sz > 0.02) out.push({k: 'e', x: lx + vx * 0.02 * Math.min(rest, 0.2) * 3, y: floor - rr * (1 - 0.25 * sq) * 0.75 * sz, rx: rr * (1 + 0.25 * sq) * sz, ry: rr * (1 - 0.25 * sq) * sz});
        }
      }
    }
  }
  return out;
};

const DropSplashCrown: React.FC<Props> = ({drops, crown, secondaries, floorY, reflection, cameraMacro, light, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = useSafeId('dsc');
  const floor = h * floorY;
  const shapes = drops.flatMap((d) => dropShapes(frame, d, w, floor, u, crown, secondaries, cameraMacro).map((s) => ({...s, hue: d.hue})));
  const kids = (
    <g>
      {shapes.map((s, i) =>
        s.k === 'c' ? (
          <circle key={i} cx={s.x} cy={s.y} r={Math.max(0.5, s.r)} fill={`hsl(${s.hue},88%,56%)`} />
        ) : (
          <ellipse key={i} cx={s.x} cy={s.y} rx={Math.max(0.5, s.rx)} ry={Math.max(0.5, s.ry)} fill={`hsl(${s.hue},88%,56%)`} />
        ),
      )}
    </g>
  );
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <linearGradient id={id + 'bg'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d2a4a" />
            <stop offset="1" stopColor="#0a1024" />
          </linearGradient>
          <linearGradient id={id + 'fl'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a3a63" />
            <stop offset="1" stopColor="#0a0f20" />
          </linearGradient>
          <linearGradient id={id + 'fade'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={reflection} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={id + 'm'} maskUnits="userSpaceOnUse" x={0} y={floor} width={w} height={h - floor}>
            <rect x={0} y={floor} width={w} height={h - floor} fill={`url(#${id}fade)`} />
          </mask>
          <clipPath id={id + 'c'}>
            <rect x={0} y={0} width={w} height={floor + 1} />
          </clipPath>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}bg)`} />
        <rect x={0} y={floor} width={w} height={h - floor} fill={`url(#${id}fl)`} />
        <rect x={0} y={floor} width={w} height={2 * u} fill="#8fb4ff" opacity={0.25} />
        {reflection > 0 && (
          <g mask={`url(#${id}m)`}>
            <g transform={`translate(0,${2 * floor}) scale(1,-1)`}>
              <LiquidShade id={id + 'r'} w={w} h={h} u={u} blur={9} gloss={0.5} rim={0.4} light={light}>
                {kids}
              </LiquidShade>
            </g>
          </g>
        )}
        <g clipPath={`url(#${id}c)`}>
          <LiquidShade id={id} w={w} h={h} u={u} blur={9} gloss={1} rim={0.55} light={light}>
            {kids}
          </LiquidShade>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const dropSplashCrown = defineMotion<Props>({
  id: 'drop-splash-crown',
  title: 'Drop splash crown',
  category: 'fx',
  description:
    'A glossy drop falls stretched onto a polished floor, squashes into a lens and throws a crown of tapered tendrils; the tips bead up and pinch off as secondary droplets that fly and land as small beads or melt into the puddle while the stubs recoil, all mirrored in the floor; a second smaller drop lands in the puddle.',
  source: ['mg-styles-15 demos/07-liquid/js/scene.js makeDroplet, emitDroplet, tendrilState (MIT)', 'video 07-liquid 0.3-1.7 s'],
  useFor: 'Drink, food and cosmetics ads, logo openers, "drop" product launches and loader hits.',
  durationInFrames: 150,
  defaultProps: {
    drops: [
      {t: 22, x: 0.5, size: 1, hue: 335},
      {t: 96, x: 0.43, size: 0.7, hue: 190},
    ],
    crown: {count: 7, height: 1},
    secondaries: true,
    floorY: 0.74,
    reflection: 0.35,
    cameraMacro: true,
    light: 225,
    background: '#0a1024',
  },
  propDocs: {
    drops: 'list of {t: impact frame, x: 0..1 across the frame, size, hue 0-360}',
    crown: '{count: tendrils (6-8 looks right), height: multiplier}',
    secondaries: 'tips pinch off into flying droplets',
    floorY: 'floor line as a fraction of the frame height',
    reflection: 'mirror strength in the floor 0..1 (0 = none)',
    cameraMacro: 'macro framing: bigger drop and crown',
    light: 'key light azimuth in degrees',
    background: 'backdrop base colour',
  },
  component: DropSplashCrown,
  tags: ['liquid', 'drop', 'splash', 'crown', 'droplet', 'milk', 'water', 'jelly', 'glossy', 'floor reflection', 'macro', 'slow motion', 'ad', 'beverage', 'cosmetics', 'logo opener', 'loader'],
});
