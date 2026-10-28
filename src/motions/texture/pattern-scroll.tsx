import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Pattern scroll: a seamless tiling geometric background that drifts in any direction — dots, stripes, checks, waves,
 * diamonds or plus signs — with optional alternating rows, accent tiles and a soft pulse. Speed is in whole cells per second so a
 * 5 s clip with speed 0.6 loops perfectly. `background: "transparent"` makes it a pattern overlay.
 */
type PatternName = 'dots' | 'lines' | 'checks' | 'waves' | 'diamonds' | 'plus';
type Props = {
  pattern: PatternName;
  cell: number;
  angle: number;
  speed: number;
  alternate: boolean;
  thickness: number;
  accentEvery: number;
  pulse: number;
  fade: number;
  background: string;
  ink: string;
  accent: string;
};

const mod1 = (v: number) => ((v % 1) + 1) % 1;

const PatternScroll: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const cell = Math.max(26, p.cell) * u;
  const R = Math.hypot(w, h) / 2 + cell * 2;
  const n = Math.ceil(R / cell) + 1;
  const off = (p.speed * frame) / fps; // cells travelled
  const f = mod1(off);
  const thick = Math.max(0.02, p.thickness);
  const els: React.ReactNode[] = [];
  const colorFor = (i: number, j: number) => (p.accentEvery > 0 && (((i + 1000 * 7) * 3 + (j + 1000) * 5) % p.accentEvery === 0) ? p.accent : p.ink);
  const t = frame / fps;

  if (p.pattern === 'lines') {
    for (let j = -n; j <= n; j++) {
      const y = (j + f) * cell;
      els.push(<rect key={j} x={-R} y={y - (cell * thick) / 2} width={R * 2} height={cell * thick} fill={colorFor(0, j)} />);
    }
  } else if (p.pattern === 'waves') {
    const wl = cell * 2;
    for (let j = -n; j <= n; j++) {
      const dir = p.alternate && j % 2 !== 0 ? -1 : 1;
      const shift = f * wl * dir;
      const pts: string[] = [];
      for (let x = -R; x <= R; x += cell / 5) pts.push(`${x.toFixed(1)},${(j * cell + Math.sin(((x - shift) / wl) * Math.PI * 2) * cell * 0.3).toFixed(1)}`);
      els.push(<polyline key={j} points={pts.join(' ')} fill="none" stroke={colorFor(0, j)} strokeWidth={cell * thick * 0.55} strokeLinecap="round" strokeLinejoin="round" />);
    }
  } else {
    for (let j = -n; j <= n; j++) {
      const dir = p.alternate && j % 2 !== 0 ? -1 : 1;
      const half = p.pattern === 'diamonds' && j % 2 !== 0 ? 0.5 : 0;
      for (let i = -n - 1; i <= n + 1; i++) {
        const fx = i + (dir === 1 ? f : -f) + half;
        const x = fx * cell;
        const y = j * cell;
        const c = colorFor(i, j);
        const wave = p.pulse > 0 ? 1 + p.pulse * 0.5 * Math.sin(t * 2.2 + (i + j) * 0.45) : 1;
        const key = `${i}_${j}`;
        if (p.pattern === 'dots') els.push(<circle key={key} cx={x} cy={y} r={cell * thick * 0.5 * wave} fill={c} />);
        else if (p.pattern === 'checks') {
          if ((((i + j) % 2) + 2) % 2 === 0) els.push(<rect key={key} x={x - cell / 2} y={y - cell / 2} width={cell} height={cell} fill={c} />);
        } else if (p.pattern === 'diamonds') {
          const r = cell * 0.5 * Math.min(0.95, thick * 1.6) * wave;
          els.push(<polygon key={key} points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} fill={c} />);
        } else {
          const r = cell * 0.3 * wave;
          const sw = cell * thick * 0.5;
          els.push(<path key={key} d={`M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}`} stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none" />);
        }
      }
    }
  }
  const mask = p.fade > 0 ? `radial-gradient(ellipse at 50% 50%, #000 ${(1 - p.fade) * 55}%, transparent ${55 + (1 - p.fade) * 45 + 10}%)` : undefined;
  const bg = p.background === 'transparent' ? 'transparent' : p.background;
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
          <g transform={`translate(${w / 2} ${h / 2}) rotate(${p.angle})`}>{els}</g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const patternScroll = defineMotion<Props>({
  id: 'pattern-scroll',
  title: 'Pattern scroll',
  category: 'texture',
  description: 'Seamless tiling geometric background (dots, lines, checks, waves, diamonds, plus) scrolling in any direction, loop-perfect.',
  source: ['texture-vocabulary: scrolling pattern backgrounds'],
  useFor: 'Brandable looping backgrounds behind titles, lower thirds, slides and web sections; retro / Memphis / editorial wallpaper; set background transparent for a pattern overlay.',
  durationInFrames: 150,
  defaultProps: {
    pattern: 'dots',
    cell: 90,
    angle: -20,
    speed: 0.6,
    alternate: false,
    thickness: 0.34,
    accentEvery: 7,
    pulse: 0,
    fade: 0,
    background: '#101826',
    ink: '#24344f',
    accent: '#ff7a59',
  },
  propDocs: {
    pattern: 'dots | lines | checks | waves | diamonds | plus',
    cell: 'tile size in u (min 26)',
    angle: 'rotation of the whole pattern, degrees (also sets scroll direction)',
    speed: 'cells per second along the pattern x axis; whole number of cells per clip loops seamlessly',
    alternate: 'every second row scrolls the opposite way',
    thickness: 'mark size / stroke weight (fraction of a cell)',
    accentEvery: 'every Nth tile uses the accent colour (0 = none)',
    pulse: 'size breathing wave across the pattern (0 = none)',
    fade: 'fade the pattern out towards the edges (0..1)',
    background: 'CSS background; "transparent" = overlay',
    ink: 'pattern colour',
    accent: 'accent tile colour',
  },
  component: PatternScroll,
  tags: ['pattern', 'scroll', 'tile', 'seamless', 'loop', 'dots', 'stripes', 'checks', 'waves', 'background', 'texture', 'overlay', 'wallpaper'],
});
