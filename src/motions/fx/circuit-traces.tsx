import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {rng} from '../../core/random';
import {PaintedField, lin, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x6 circuit-traces: a faint glowing PCB pattern — traces with 45° bends ending in round pads — draws on over the
 * ground (flat or projected onto the iso plane), then breathes at low opacity (0.2–0.35 pulsing at 0.3 Hz).
 * Traces are seeded Manhattan/45° walks from a few roots; draw-on via strokeDashoffset over `drawFrames`.
 */
type Props = {
  background: string;
  color: string;
  density: number;
  drawFrames: number;
  projection: 'flat' | 'iso';
  pulse: boolean;
  glow: number;
  label: string;
  demoScene: boolean;
  seed: number;
};

const CircuitTraces: React.FC<Props> = ({background, color, density, drawFrames, projection, pulse, glow, label, demoScene, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const r = rng(seed * 101);
  const n = Math.round(density * (portrait ? 26 : 34));
  const traces: {d: string; len: number; pad: [number, number]; start: number}[] = [];
  const S = Math.min(w, h);
  for (let i = 0; i < n; i++) {
    let x = w * (0.1 + 0.8 * r());
    let y = h * (0.1 + 0.8 * r());
    let dir = Math.floor(r() * 4) * 90;
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    let len = 0;
    const segs = 2 + Math.floor(r() * 4);
    for (let sgi = 0; sgi < segs; sgi++) {
      const seg = S * (0.04 + 0.12 * r());
      const a = (dir * Math.PI) / 180;
      x += Math.cos(a) * seg;
      y += Math.sin(a) * seg * 0.6;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      len += seg;
      dir += (r() > 0.5 ? 1 : -1) * 45;
    }
    traces.push({d, len: len * 1.3, pad: [x, y], start: (i / n) * drawFrames * 0.4});
  }
  const sw = 1.8 * u;
  return (
    <AbsoluteFill style={{background: background === 'transparent' ? 'transparent' : background, overflow: 'hidden'}}>
      {demoScene ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, opacity: 0.95}}>
          <PaintedField id={`ct-${seed}`} w={w} h={h} u={u} seed={seed} frame={frame} />
        </svg>
      ) : null}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`ct-g-${seed}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={glow * u} />
          </filter>
        </defs>
        <g transform={projection === 'iso' ? `translate(${w / 2} ${h / 2}) scale(1 0.55) rotate(0) translate(${-w / 2} ${-h / 2})` : undefined}>
          {[true, false].map((isGlow) => (
            <g key={String(isGlow)} filter={isGlow ? `url(#ct-g-${seed})` : undefined} opacity={isGlow ? 0.9 : 1} style={{mixBlendMode: 'screen'}}>
              {traces.map((tr, i) => {
                const p = lin(frame, tr.start, tr.start + drawFrames);
                if (p <= 0) return null;
                const breathe = pulse ? 0.275 + 0.075 * Math.sin(t * Math.PI * 2 * 0.3 + i * 0.7) : 0.33;
                const op = (p < 1 ? 0.55 : breathe + (frame < drawFrames * 1.4 ? (0.55 - breathe) * (1 - lin(frame, drawFrames, drawFrames * 1.6)) : 0)) * (isGlow ? 0.8 : 1);
                return (
                  <g key={i} opacity={op}>
                    <path d={tr.d} fill="none" stroke={color} strokeWidth={isGlow ? sw * 2.2 : sw} pathLength={1} strokeDasharray={p >= 1 ? undefined : `${p} 2`} strokeLinejoin="round" />
                    {p >= 0.98 ? <circle cx={tr.pad[0]} cy={tr.pad[1]} r={3.5 * u} fill="none" stroke={color} strokeWidth={isGlow ? sw * 1.8 : sw} /> : null}
                  </g>
                );
              })}
            </g>
          ))}
        </g>
        {label ? (
          <text x={w / 2} y={h * 0.92} textAnchor="middle" fontFamily={x58Fonts.mono} fontSize={14 * u} fill={color} opacity={0.8 * lin(frame, drawFrames * 0.8, drawFrames * 1.2)} letterSpacing={2 * u}>
            {label}
          </text>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export const circuitTraces = defineMotion<Props>({
  id: 'circuit-traces',
  title: 'Circuit traces',
  category: 'fx',
  description:
    'A faint glowing PCB pattern — thin traces with 45° bends ending in round pads — draws itself over the ground (flat or squashed onto the iso plane), then breathes at low opacity under the scene.',
  source: ['video x6 2.57 s, 9.2-9.5 s (draw-on), 16-46 s (breathing under the armies)'],
  useFor: '"AI / tech layer over the real world" overlay on maps, photos and product shots; background texture that says "computed".',
  durationInFrames: 150,
  defaultProps: {
    background: 'transparent',
    color: '#E8FFE0',
    density: 1,
    drawFrames: 20,
    projection: 'iso',
    pulse: true,
    glow: 4,
    label: '',
    demoScene: true,
    seed: 8,
  },
  propDocs: {
    background: "backdrop; 'transparent' (default) overlays the host content",
    color: 'trace colour',
    density: 'trace count multiplier',
    drawFrames: 'frames each trace takes to draw on',
    projection: "'flat' | 'iso' (squashed onto the ground plane)",
    pulse: 'breathe at 0.3 Hz after the draw-on',
    glow: 'glow blur in px at 1080p',
    label: 'optional mono caption under the pattern',
    demoScene: 'paint the painterly battlefield behind (preview only; turn off as an overlay)',
    seed: 'walk seed',
  },
  component: CircuitTraces,
  tags: ['circuit', 'pcb', 'traces', 'overlay', 'glow', 'tech', 'ai', 'draw on', 'ground', 'pattern', 'iso', 'breathe'],
});
