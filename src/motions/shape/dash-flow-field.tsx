import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {FilmGrain, useStage} from '../../core/stage';
import {smoothstep} from '../../core/three-kit';
import {defineMotion} from '../../core/types';
import {hexRgb, ReelHud, SWISS, SwissField} from '../../core/r2-x14-kit';

/**
 * x2 chapter 06 "RHYTHM": a regular grid of short rounded cream dashes on ultramarine. Every dash turns to follow a
 * vector field around a red dot that wanders on a slow Lissajous: first the dashes circle it (vortex), then point at
 * it (radial), then circle again. Rings of longer lime dashes ripple outward from the dot, and dashes near it shrink to
 * dots (a calm eye). Pure SVG lines with round caps.
 */

type Mode = 'vortex' | 'radial' | 'flow';
type Props = {
  pitch: number;
  dashLength: number;
  thickness: number;
  modes: {at: number; mode: Mode}[];
  blendFrames: number;
  rippleEvery: number;
  rippleSpeed: number;
  rippleBoost: number;
  wander: number;
  background: string;
  vignette: string;
  dashColor: string;
  rippleColor: string;
  dotColor: string;
  dotSize: number;
  hud: boolean;
  label: string;
};

const modeAngle = (m: Mode) => (m === 'vortex' ? Math.PI / 2 : m === 'radial' ? 0 : Math.PI / 4);

const DashFlowField: React.FC<Props> = ({
  pitch,
  dashLength,
  thickness,
  modes,
  blendFrames,
  rippleEvery,
  rippleSpeed,
  rippleBoost,
  wander,
  background,
  vignette,
  dashColor,
  rippleColor,
  dotColor,
  dotSize,
  hud,
  label,
}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, fps} = useStage();
  const P = pitch * u;
  const cols = Math.ceil(w / P) + 1;
  const rows = Math.ceil(h / P) + 1;
  const ox = (w - (cols - 1) * P) / 2;
  const oy = (h - (rows - 1) * P) / 2;

  // ---- attractor: slow Lissajous wander (≈ 0.3 W/s), starts at the centre ----
  const dotAt = (f: number) => {
    const t = f / fps;
    const amp = clamp(f / 30) * wander;
    return [cx + Math.sin(t * 0.9) * w * 0.22 * amp, cy + Math.sin(t * 1.3 + 0.4) * h * 0.18 * amp];
  };
  const [dx, dy] = dotAt(frame);

  // ---- field mode keyframes, blended over `blendFrames` (angle offset 0 = radial, π/2 = vortex) ----
  const ks = [...modes].sort((a, b) => a.at - b.at);
  let off = modeAngle(ks[0]?.mode ?? 'vortex');
  for (let k = 1; k < ks.length; k++) {
    const b = prog(frame, ks[k].at, ks[k].at + blendFrames, ease.inOut);
    off = off + (modeAngle(ks[k].mode) - off) * b;
  }

  // ---- ripples: a lime ring every `rippleEvery` frames travelling at rippleSpeed W/s ----
  const vR = (rippleSpeed * w) / fps;
  const band = 1.5 * P * 0.6;
  const ripples: {r: number; fade: number; x: number; y: number}[] = [];
  const reach = 0.75 * Math.max(w, h);
  if (rippleEvery > 0)
    for (let k = 0; k * rippleEvery <= frame; k++) {
      const born = k * rippleEvery + 10;
      const age = frame - born;
      if (age < 0) continue;
      const r = age * vR;
      if (r > reach) continue;
      const [x, y] = dotAt(born); // rings stay centred where they were emitted
      ripples.push({r, fade: Math.pow(1 - r / reach, 1.4), x, y});
    }

  // ---- entrance: dashes grow out radially from the centre over the first ~18 frames ----
  const grow = (d: number) => clamp((frame - 2 - (d / Math.hypot(w, h)) * 16) / 8);

  const [dr, dg, db] = hexRgb(dashColor);
  const [lr, lg, lb] = hexRgb(rippleColor);
  const L = dashLength * u;
  const T = thickness * u;
  const lines: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const px = ox + i * P;
      const py = oy + j * P;
      const vx = px - dx;
      const vy = py - dy;
      const d = Math.hypot(vx, vy);
      const g = ease.back(grow(Math.hypot(px - cx, py - cy)));
      if (g <= 0) continue;
      let k = 0;
      for (const rp of ripples) k = Math.max(k, Math.exp(-(((Math.hypot(px - rp.x, py - rp.y) - rp.r) / band) ** 2)) * rp.fade);
      const a = Math.atan2(vy, vx) + off;
      const eye = smoothstep(0, 1.5 * P, d);
      const len = (L * eye + rippleBoost * u * k) * g;
      const hx = (Math.cos(a) * len) / 2;
      const hy = (Math.sin(a) * len) / 2;
      const c = `rgb(${Math.round(dr + (lr - dr) * k)},${Math.round(dg + (lg - dg) * k)},${Math.round(db + (lb - db) * k)})`;
      lines.push(<line key={`${i}-${j}`} x1={px - hx} y1={py - hy} x2={px + hx} y2={py + hy} stroke={c} strokeWidth={T * (0.6 + 0.4 * g)} strokeLinecap="round" />);
    }

  const dotIn = prog(frame, 0, 10, ease.back);
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <SwissField color={background} edge={vignette} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {lines}
        <circle cx={dx} cy={dy} r={(dotSize * u * dotIn) / 2} fill={dotColor} />
      </svg>
      <FilmGrain opacity={0.05} />
      {hud ? <ReelHud ink={SWISS.dash} label={label} footer={`MOTION REEL / ${w}×${h} / ${fps} FPS`} active={5} progress={frame / 180} beat={ripples.some((r) => r.r < 60 * u)} opacity={0.6} /> : null}
    </AbsoluteFill>
  );
};

export const dashFlowField = defineMotion<Props>({
  id: 'dash-flow-field',
  title: 'Dash flow field',
  category: 'shape',
  description:
    'A grid of rounded cream dashes on ultramarine turns to follow a vector field around a wandering red dot — circling it (vortex), pointing at it (radial), circling again — while rings of longer lime dashes ripple outward and dashes near the dot shrink to dots.',
  source: ['video x2 0:10.25-0:11.55 (chapter 06 RHYTHM)'],
  useFor: 'Ambient "rhythm / data flow / magnetic field" backgrounds, interactive-feeling hero loops (the attractor reads like a cursor), music or pulse beats.',
  durationInFrames: 180,
  defaultProps: {
    pitch: 80,
    dashLength: 32,
    thickness: 10,
    modes: [
      {at: 0, mode: 'vortex'},
      {at: 60, mode: 'radial'},
      {at: 110, mode: 'vortex'},
      {at: 150, mode: 'radial'},
    ],
    blendFrames: 8,
    rippleEvery: 24,
    rippleSpeed: 0.45,
    rippleBoost: 24,
    wander: 1,
    background: SWISS.blueCentre,
    vignette: SWISS.blueEdge,
    dashColor: SWISS.dash,
    rippleColor: SWISS.lime,
    dotColor: SWISS.dotOnBlue,
    dotSize: 50,
    hud: true,
    label: '06 — RHYTHM',
  },
  propDocs: {
    pitch: 'grid spacing in u (both axes)',
    dashLength: 'dash length in u',
    thickness: 'dash thickness in u (round caps)',
    modes: 'field keyframes [{at: frame, mode: vortex | radial | flow}]',
    blendFrames: 'frames to blend between field modes',
    rippleEvery: 'frames between lime ripple rings (0 = none)',
    rippleSpeed: 'ripple speed in frame widths per second',
    rippleBoost: 'extra dash length (u) inside a ripple ring',
    wander: 'attractor wander amount (0 = stays at the centre)',
    background: 'field colour (centre)',
    vignette: 'field colour at the corners',
    dashColor: 'dash colour',
    rippleColor: 'ripple dash colour',
    dotColor: 'attractor dot colour',
    dotSize: 'attractor dot diameter in u',
    hud: 'show the reel HUD',
    label: 'HUD chapter label',
  },
  component: DashFlowField,
  tags: ['vector field', 'flow field', 'dashes', 'grid', 'vortex', 'radial', 'ripple', 'attractor', 'magnetic', 'rhythm', 'pattern background', 'loop', 'swiss', 'ultramarine', 'x2'],
});
