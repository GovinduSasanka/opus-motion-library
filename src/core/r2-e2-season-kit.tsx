import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp} from './ease';
import {rng} from './random';
import {Svg, useStage} from './stage';

/**
 * Round-2 group E2: seasons for time-of-day-grade (palette sets + falling petals / leaves / snow / motes).
 * Pure functions of the frame; particle fields are seeded.
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_PALETTES: Record<Season, {skyTop: string; skyBottom: string; sun: string; grade: string; hills: string[]; fixedT: number}> = {
  spring: {skyTop: '#9cc4ea', skyBottom: '#e9f3ea', sun: '#fff6d8', grade: '#fff3f6', hills: ['#a9c8b8', '#8fc07a', '#79b35e'], fixedT: 0.12},
  summer: {skyTop: '#6aaee6', skyBottom: '#d6edfa', sun: '#fff3c8', grade: '#fffbe6', hills: ['#8eb8c8', '#6fae5a', '#4f9a3f'], fixedT: 0.04},
  autumn: {skyTop: '#8da4c6', skyBottom: '#f2d1a0', sun: '#ffc46a', grade: '#ffe2bd', hills: ['#c4b09a', '#c98a4a', '#a8582a'], fixedT: 0.34},
  winter: {skyTop: '#9db0c8', skyBottom: '#eaeff5', sun: '#fff7e6', grade: '#e6eefa', hills: ['#c9d6e2', '#dfe8f0', '#f2f6fa'], fixedT: 0.1},
};

const COLORS: Record<Season, string[]> = {
  spring: ['#F7C6D6', '#F9DCE5', '#FFFFFF', '#F2A9C0'],
  summer: ['#FFF4B8', '#FFFFFF'],
  autumn: ['#D8631F', '#E8A130', '#B8421C', '#C98B2B'],
  winter: ['#FFFFFF', '#EAF3FF'],
};

const COUNT: Record<Season, number> = {spring: 46, summer: 22, autumn: 52, winter: 120};

/** falling particles for one season at opacity `alpha` */
export const SeasonParticles: React.FC<{season: Season; alpha: number; seed?: string}> = ({season, alpha, seed = 'season'}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  if (alpha <= 0.01) return null;
  const r = rng(`${seed}-${season}`);
  const n = COUNT[season];
  const cols = COLORS[season];
  const items = Array.from({length: n}, () => ({x: r(), y0: r(), v: 0.5 + r() * 0.9, sw: r() * Math.PI * 2, amp: 0.02 + r() * 0.05, s: 0.6 + r() * 0.9, c: cols[Math.floor(r() * cols.length)], rot: r() * 360, spin: (r() - 0.5) * 6}));
  return (
    <Svg>
      <g opacity={alpha}>
        {items.map((it, i) => {
          const fallPer = season === 'summer' ? 0.0004 : season === 'winter' ? 0.0016 : 0.0018;
          const yy = (((it.y0 + frame * fallPer * it.v * (season === 'summer' ? -1 : 1)) % 1) + 1) % 1;
          const x = (it.x + Math.sin(frame * 0.04 * it.v + it.sw) * it.amp) * w;
          const y = yy * (h + 60 * u) - 30 * u;
          if (season === 'winter') return <circle key={i} cx={x} cy={y} r={(2.2 + it.s * 2.6) * u} fill={it.c} opacity={0.9} />;
          if (season === 'summer') return <circle key={i} cx={x} cy={y} r={(2 + it.s * 2) * u} fill={it.c} opacity={0.5 + 0.4 * Math.sin(frame * 0.1 + it.sw)} />;
          const rot = it.rot + frame * it.spin;
          if (season === 'spring') return <ellipse key={i} cx={x} cy={y} rx={(5 + it.s * 4) * u} ry={(3 + it.s * 2) * u} fill={it.c} transform={`rotate(${rot} ${x} ${y})`} />;
          return <path key={i} d={`M${x} ${y - 9 * u * it.s} Q${x + 7 * u * it.s} ${y} ${x} ${y + 9 * u * it.s} Q${x - 7 * u * it.s} ${y} ${x} ${y - 9 * u * it.s}Z`} fill={it.c} transform={`rotate(${rot} ${x} ${y})`} />;
        })}
      </g>
    </Svg>
  );
};

/** which season(s) are visible at this frame: [{season, alpha}] */
export const seasonMix = (frame: number, D: number, mode: string, seasonFrames: number, fade: number) => {
  if (mode !== 'cycle') return [{season: mode as Season, alpha: 1}];
  const len = seasonFrames > 0 ? seasonFrames : D / 4;
  const i = Math.min(3, Math.floor(frame / len));
  const local = frame - i * len;
  const toNext = i < 3 ? clamp((local - (len - fade)) / fade) : 0;
  const out: {season: Season; alpha: number}[] = [{season: SEASONS[i], alpha: 1}];
  if (toNext > 0) out.push({season: SEASONS[i + 1], alpha: toNext});
  return out;
};
