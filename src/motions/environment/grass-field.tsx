import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {rng, range} from '../../core/random';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {GrassField, GrassRow, Moon, Stars, goldenRows, tealRows} from '../../core/world-kit';

type Props = {
  background: string;
  horizon: string;
  bladeBase: string;
  bladeTip: string;
  golden: boolean;
  goldenAt: number;
  growAt: number;
  density: number;
  heightScale: number;
  swayAmp: number;
  gust: number;
  windSpeed: number;
  stars: boolean;
  moon: boolean;
  motes: boolean;
  grain: number;
  seed: string;
};

const GrassFieldMotion: React.FC<Props> = ({background, horizon, bladeBase, bladeTip, golden, goldenAt, growAt, density, heightScale, swayAmp, gust, windSpeed, stars, moon, motes, grain, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const k = heightScale * (portrait ? 1.6 : 1);
  const teal = tealRows(k).map((r, i, a) => (i === a.length - 1 ? {...r, base: bladeBase, tip: bladeTip} : r));
  const dens = (r: GrassRow): GrassRow => ({...r, spacing: r.spacing / Math.max(0.2, density)});
  // back -> front: dark back blades, staggered golden leaf rows, two teal rows in front
  const rows: GrassRow[] = [dens(teal[0]), ...(golden ? goldenRows(k, goldenAt) : []), dens(teal[1]), dens(teal[2])];
  const baseY = h + 10 * u;
  const moonIn = prog(frame, 0, 20, ease.out);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${background} 0%, ${background} 55%, ${horizon} 100%)`}}>
      <Svg>
        {stars && <Stars w={w} h={h} u={u} frame={frame} count={portrait ? 130 : 110} seed={`${seed}-st`} maxY={0.75} />}
        {moon && <Moon id={`grass-field-moon-${seed}`} x={w * (portrait ? 0.7 : 0.72)} y={h * (portrait ? 0.2 : 0.22)} r={(portrait ? 44 : 34) * u} opacity={moonIn} />}
        <GrassField id={`grass-field-${seed}`} rows={rows} baseY={baseY} x0={-40 * u} x1={w + 40 * u} u={u} w={w} frame={frame} seed={seed} swayAmp={swayAmp} gust={gust} windSpeed={windSpeed} growAt={growAt} growSpread={20} />
        {motes &&
          Array.from({length: 34}, (_, i) => {
            const r = rng(`${seed}-mote${i}`);
            const sp = range(r, 0.6, 1.6) * u * windSpeed;
            const x = (((r() * w * 1.2 + frame * sp * 1.6) % (w * 1.2)) + w * 1.2) % (w * 1.2) - w * 0.1;
            const y = h * range(r, 0.55, 0.92) - frame * sp * 0.35 + Math.sin(frame * 0.05 + i) * 14 * u;
            const a = clamp((frame - 20 - r() * 30) / 20) * (0.35 + 0.45 * Math.abs(Math.sin(frame * 0.07 + i)));
            return <circle key={i} cx={x} cy={y} r={range(r, 1.5, 3.2) * u} fill="#f3d9a0" opacity={a} />;
          })}
      </Svg>
      {grain > 0 && <FilmGrain opacity={grain} />}
    </AbsoluteFill>
  );
};

export const grassField = defineMotion<Props>({
  id: 'grass-field',
  title: 'Grass field (teal blades + golden leaves)',
  category: 'environment',
  description: 'Procedural tapered teal grass blades grow up from the bottom edge in a staggered wave, golden pointed leaves pop up behind, and the whole field sways with travelling wind gusts under a starry night sky.',
  source: ['video15 0:00-0:03 grass-blade-field', 'video15 0:26-0:27 grass-grow-up'],
  useFor: 'A living foreground for night/sunrise scenes, an opening or end-card ground plane, a calm nature beat.',
  durationInFrames: 150,
  defaultProps: {
    background: '#0c1820',
    horizon: '#13262f',
    bladeBase: '#253a43',
    bladeTip: '#3f7f86',
    golden: true,
    goldenAt: 26,
    growAt: 0,
    density: 1,
    heightScale: 1,
    swayAmp: 2,
    gust: 6,
    windSpeed: 1,
    stars: true,
    moon: true,
    motes: true,
    grain: 0.07,
    seed: 'meadow',
  },
  propDocs: {
    background: 'night sky colour (top)',
    horizon: 'sky colour at the bottom edge',
    bladeBase: 'front blade colour at the base',
    bladeTip: 'front blade colour at the tip',
    golden: 'add the row of golden pointed leaves behind the teal blades',
    goldenAt: 'frame the golden leaves start popping up',
    growAt: 'frame the teal blades start growing (-1 = already grown)',
    density: 'blade density multiplier',
    heightScale: 'blade height multiplier',
    swayAmp: 'base sway in degrees (2.5 s period)',
    gust: 'extra lean of the travelling wind gust (degrees)',
    windSpeed: 'speed multiplier for sway and gusts',
    stars: 'twinkling stars',
    moon: 'crescent moon',
    motes: 'floating pollen motes drifting on the wind',
    grain: 'film grain opacity (0 = off)',
    seed: 'random seed for the blades',
  },
  component: GrassFieldMotion,
  tags: ['grass', 'nature', 'wind', 'night', 'foreground', 'grow'],
});
