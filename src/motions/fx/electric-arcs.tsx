import React from 'react';
import {ease, prog} from '../../core/ease';
import {FxRoot, boil, boltPoints, isClear, polyline, useFx} from '../../core/fx-kit';
import {rng, range} from '../../core/random';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video2 electric-arc-flicker: 10-20 thin jagged lightning arcs radiating from a subject, white core
 * with violet glow, completely re-randomised every 1-2 frames, with random brightness flashes.
 * Arc = midpoint-displacement polyline (5-6 levels, displacement 0.25 x segment), stroke 1.5 px white
 * over a ~6 px #b48cff glow at 30 %.
 * Modes: radial (out of an object edge), between (two points / electrodes), around (crawling over
 * an object's surface).
 */
type Props = {
  background: string;
  x: number;
  y: number;
  delay: number;
  mode: 'radial' | 'between' | 'around';
  x2: number;
  y2: number;
  count: number;
  reach: number;
  radius: number;
  holdFrames: number;
  levels: number;
  jaggedness: number;
  branches: boolean;
  color: string;
  glowColor: string;
  coreWidth: number;
  flashes: boolean;
  rampIn: number;
  rampOut: number;
  showSubject: boolean;
  seed: number;
};

const ElectricArcs: React.FC<Props> = (p) => {
  const {background, x, y, delay, mode, x2, y2, count, reach, radius, holdFrames, levels, jaggedness, branches, color, glowColor, coreWidth, flashes, rampIn, rampOut, showSubject, seed} = p;
  const {f, frame, u, w, h, px, py, durationInFrames} = useFx(x, y, delay);
  const clear = isClear(background);
  const endF = durationInFrames - delay;
  const env = f < 0 ? 0 : Math.min(prog(f, 0, rampIn, ease.out), 1 - prog(f, endF - rampOut, endF, ease.in));
  const b = boil(frame, holdFrames);
  const R = radius * u;
  const reachPx = reach * Math.min(w, h);
  const qx = x2 * w;
  const qy = y2 * h;

  const arcs: {d: string; o: number; wk: number}[] = [];
  if (env > 0.01) {
    const nActive = Math.max(1, Math.round(count * (0.35 + 0.65 * env)));
    for (let i = 0; i < nActive; i++) {
      const r = rng(seed * 100003 + b * 977 + i * 31);
      if (r() < 0.18) continue; // random drop-outs = flicker
      const o = range(r, 0.45, 1) * env;
      let pts: [number, number][] = [];
      if (mode === 'between') {
        const strand = i;
        if (strand < 3) pts = boltPoints(px, py, qx, qy, r, levels, jaggedness * (0.55 + 0.25 * strand));
        else {
          // short side spark off one terminal
          const sx = r() < 0.5 ? px : qx;
          const sy = sx === px ? py : qy;
          const a = r() * Math.PI * 2;
          const L = range(r, 0.3, 0.7) * R * 1.6;
          pts = boltPoints(sx + Math.cos(a) * R * 0.35, sy + Math.sin(a) * R * 0.35, sx + Math.cos(a) * L, sy + Math.sin(a) * L, r, levels - 1, jaggedness);
        }
      } else if (mode === 'around') {
        const a0 = r() * Math.PI * 2;
        const span = range(r, 0.6, 2.0) * (r() < 0.5 ? -1 : 1);
        const raw = boltPoints(0, 0, span * R, 0, r, levels - 1, jaggedness * 1.3);
        pts = raw.map(([sx, sy]) => {
          const th = a0 + sx / R;
          const rr = R * 1.03 + Math.abs(sy) * 1.6;
          return [px + Math.cos(th) * rr, py + Math.sin(th) * rr];
        });
      } else {
        const a = r() * Math.PI * 2;
        const L = reachPx * range(r, 0.45, 1);
        const a2 = a + (r() - 0.5) * 0.6;
        pts = boltPoints(px + Math.cos(a) * R * 0.95, py + Math.sin(a) * R * 0.95, px + Math.cos(a2) * L, py + Math.sin(a2) * L, r, levels, jaggedness);
      }
      arcs.push({d: polyline(pts), o, wk: 1});
      if (branches && pts.length > 6 && r() < 0.6) {
        const k = Math.floor(range(r, 0.25, 0.7) * pts.length);
        const [bx, by] = pts[k];
        const [nx, ny] = pts[Math.min(pts.length - 1, k + 2)];
        const base = Math.atan2(ny - by, nx - bx) + (r() < 0.5 ? -1 : 1) * range(r, 0.4, 0.9);
        const L = Math.hypot(pts[pts.length - 1][0] - pts[0][0], pts[pts.length - 1][1] - pts[0][1]) * range(r, 0.15, 0.35);
        arcs.push({d: polyline(boltPoints(bx, by, bx + Math.cos(base) * L, by + Math.sin(base) * L, r, 3, jaggedness)), o: o * 0.8, wk: 0.6});
      }
    }
  }
  // big flash frames
  const fr = rng(seed * 7 + b * 13);
  const bigFlash = flashes && env > 0.5 && fr() < 0.07;
  const flashO = bigFlash ? 0.1 + fr() * 0.1 : 0;

  // subject
  let subject: React.ReactNode = null;
  if (showSubject && !clear) {
    if (mode === 'between') {
      subject = (
        <g>
          {[
            [px, py],
            [qx, qy],
          ].map(([sx, sy], k) => (
            <g key={k}>
              <rect x={sx - 10 * u} y={sy} width={20 * u} height={h - sy + 10} fill="#3a4052" />
              <circle cx={sx} cy={sy} r={R * 0.38} fill={`url(#ea-metal-${seed})`} />
              <circle cx={sx - R * 0.12} cy={sy - R * 0.14} r={R * 0.08} fill="#fff" opacity={0.5} />
            </g>
          ))}
        </g>
      );
    } else {
      const pulse = 0.75 + 0.25 * env * (0.6 + 0.4 * Math.sin(frame * 1.7));
      subject = (
        <g>
          <rect x={px - R * 0.35} y={py + R * 0.8} width={R * 0.7} height={h - py} fill="#141824" />
          <path d={`M${px - R * 1.1} ${h} L${px - R * 0.6} ${py + R * 1.5} L${px + R * 0.6} ${py + R * 1.5} L${px + R * 1.1} ${h} Z`} fill="#1a1f2d" />
          <circle cx={px} cy={py} r={R} fill={`url(#ea-orb-${seed})`} />
          <circle cx={px} cy={py} r={R * 0.55 * pulse} fill={`url(#ea-core-${seed})`} />
          <ellipse cx={px - R * 0.35} cy={py - R * 0.42} rx={R * 0.28} ry={R * 0.16} fill="#fff" opacity={0.28} transform={`rotate(-30 ${px - R * 0.35} ${py - R * 0.42})`} />
        </g>
      );
    }
  }

  return (
    <FxRoot background={background}>
      <Svg>
        <defs>
          <filter id={`ea-glow-${seed}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={4 * u} />
          </filter>
          <filter id={`ea-bloom-${seed}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={14 * u} />
          </filter>
          <radialGradient id={`ea-orb-${seed}`} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#4a3b78" />
            <stop offset="60%" stopColor="#1e1838" />
            <stop offset="100%" stopColor="#0b0a16" />
          </radialGradient>
          <radialGradient id={`ea-metal-${seed}`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#e9ecf4" />
            <stop offset="45%" stopColor="#8a90a3" />
            <stop offset="100%" stopColor="#2a2f3d" />
          </radialGradient>
          <radialGradient id={`ea-core-${seed}`}>
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
            <stop offset="30%" stopColor={glowColor} stopOpacity={0.7} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`ea-amb-${seed}`}>
            <stop offset="0%" stopColor={glowColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        {!clear && <circle cx={mode === 'between' ? (px + qx) / 2 : px} cy={mode === 'between' ? (py + qy) / 2 : py} r={reachPx * 1.3} fill={`url(#ea-amb-${seed})`} opacity={env * (0.7 + 0.3 * fr())} />}
        {subject}
        <g filter={`url(#ea-bloom-${seed})`} opacity={0.5}>
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill="none" stroke={glowColor} strokeWidth={10 * u * a.wk} opacity={a.o} strokeLinejoin="round" />
          ))}
        </g>
        <g filter={`url(#ea-glow-${seed})`}>
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill="none" stroke={glowColor} strokeWidth={6 * u * a.wk} opacity={a.o * 0.8} strokeLinejoin="round" />
          ))}
        </g>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke={color} strokeWidth={coreWidth * u * a.wk} opacity={Math.min(1, a.o * 1.2)} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {flashO > 0 && <rect width={w} height={h} fill={glowColor} opacity={flashO} />}
      </Svg>
    </FxRoot>
  );
};

export const electricArcs = defineMotion<Props>({
  id: 'electric-arcs',
  title: 'Electric arcs',
  category: 'fx',
  description:
    'Jagged white-core lightning arcs with violet glow, re-randomised every 1-2 frames with drop-outs and brightness flashes, radiating from a plasma orb, jumping between two electrodes or crawling around an object. Overlay-ready: background "transparent".',
  source: ['video2 electric-arc-flicker'],
  useFor: 'Energy, power, surges, sci-fi, "electrifying" ideas; around mode electrifies a logo or product.',
  durationInFrames: 90,
  defaultProps: {
    background: '#0d1018',
    x: 0.5,
    y: 0.47,
    delay: 0,
    mode: 'radial',
    x2: 0.75,
    y2: 0.5,
    count: 14,
    reach: 0.46,
    radius: 120,
    holdFrames: 2,
    levels: 6,
    jaggedness: 0.25,
    branches: true,
    color: '#ffffff',
    glowColor: '#b48cff',
    coreWidth: 2,
    flashes: true,
    rampIn: 8,
    rampOut: 12,
    showSubject: true,
    seed: 7,
  },
  propDocs: {
    background: "scene colour; 'transparent' = overlay (no orb / electrodes)",
    x: 'arc origin x (0..1) — orb centre or first electrode',
    y: 'arc origin y (0..1)',
    delay: 'frame the arcs switch on',
    mode: 'radial (out of an object edge) | between (x,y) and (x2,y2) | around (crawling over the object surface)',
    x2: 'between mode: second point x (0..1)',
    y2: 'between mode: second point y (0..1)',
    count: 'number of arcs (10-20)',
    reach: 'radial mode: max arc length as a fraction of the short side',
    radius: 'object radius in u (arcs start at its edge)',
    holdFrames: 'regenerate every N frames (1-2)',
    levels: 'midpoint-displacement recursion levels (5-6)',
    jaggedness: 'displacement factor (0.25 = source)',
    branches: 'add short forks off the arcs',
    color: 'arc core colour',
    glowColor: 'glow colour',
    coreWidth: 'core stroke width in u',
    flashes: 'random full-frame brightness flashes',
    rampIn: 'frames to power up',
    rampOut: 'frames to power down at the end',
    showSubject: 'draw the plasma orb / electrodes (scene mode only)',
    seed: 'random seed',
  },
  component: ElectricArcs,
  tags: ['electric', 'lightning', 'energy', 'sci-fi', 'flicker', 'overlay', 'fx'],
});
