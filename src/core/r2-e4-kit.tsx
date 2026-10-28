import React from 'react';
import {random} from 'remotion';
import {n2} from './random';
import {clamp} from './ease';

/**
 * Shared helpers for round-2 EXTENDS group E4 (film-look print damage / CRT / projector gate, number-counter
 * lock / scramble / flap / clock, ...). Pure functions of frame + seed; deterministic.
 */

export const h1 = (seed: string | number, k: number) => random(`${seed}-${k}`);

/** projected-print damage overlay: flicker veil, vertical scratches, dust, a hair, edge burn, sepia veil (SVG, no filters) */
export const DamageOverlay: React.FC<{
  frame: number;
  w: number;
  h: number;
  u: number;
  seed?: number;
  scratches?: number;
  dust?: number;
  hair?: boolean;
  burn?: number;
  sepia?: number;
  flicker?: number;
  crank?: number;
}> = ({frame, w, h, u, seed = 1, scratches = 0, dust = 0, hair = false, burn = 0, sepia = 0, flicker = 0, crank = 1}) => {
  const f = frame * crank;
  const els: React.ReactNode[] = [];
  // flicker as a black / white veil
  const fl = flicker > 0 ? ((h1('fl' + seed, Math.floor(f)) - 0.5) * 0.09 + 0.025 * Math.sin(1.9 * f) + 0.02 * Math.sin(0.37 * f)) * flicker : 0;
  // scratches: 4 lanes
  for (let i = 0; i < 4 && scratches > 0; i++) {
    const life = 5 + 3 * i;
    const slot = Math.floor(f / life);
    const on = h1('sc' + seed + i, slot) > 1 - scratches * (0.55 - 0.1 * i);
    if (!on) continue;
    const x0 = h1('scx' + seed + i, slot) * w;
    const dark = h1('scd' + seed + i, slot) < 0.38;
    const wd = (0.6 + 1.4 * h1('scw' + seed + i, slot)) * u;
    const segs: React.ReactNode[] = [];
    const n = 14;
    for (let s = 0; s < n; s++) {
      const gate = n2('scg' + seed + i + slot, s * 0.7, 0.3);
      if (gate < -0.1) continue;
      const y0 = (s / n) * h;
      const y1 = ((s + 0.6 + 0.3 * h1('sl' + seed + i, slot * 31 + s)) / n) * h;
      const drift = Math.sin(f * 0.2 + i) * 3 * u;
      segs.push(<rect key={s} x={x0 + drift - wd / 2} y={y0} width={wd} height={y1 - y0} fill={dark ? 'rgba(20,12,6,0.55)' : 'rgba(255,250,235,0.7)'} />);
    }
    els.push(<g key={'sc' + i}>{segs}</g>);
  }
  // dust specks
  const nd = dust > 0 ? Math.floor(h1('dn' + seed, Math.floor(f)) * 5 * dust + 0.5) : 0;
  for (let i = 0; i < nd; i++) {
    const x = h1('dx' + seed + i, Math.floor(f)) * w;
    const y = h1('dy' + seed + i, Math.floor(f)) * h;
    const r = (1 + 3 * h1('dr' + seed + i, Math.floor(f))) * u;
    const dk = h1('dk' + seed + i, Math.floor(f)) < 0.7;
    els.push(<ellipse key={'d' + i} cx={x} cy={y} rx={r} ry={r * (0.5 + h1('de' + seed + i, Math.floor(f)))} fill={dk ? 'rgba(15,10,5,0.7)' : 'rgba(255,248,230,0.7)'} />);
  }
  // a hair in the gate (lives ~8-20 frames, every ~40)
  if (hair) {
    const slot = Math.floor(f / 40);
    const age = f - slot * 40;
    if (age < 8 + 12 * h1('hl' + seed, slot)) {
      const x = (0.15 + 0.7 * h1('hx' + seed, slot)) * w;
      const y = (0.1 + 0.5 * h1('hy' + seed, slot)) * h;
      const l = 120 * u;
      const bend = (h1('hb' + seed, slot) - 0.5) * 120 * u;
      els.push(<path key="hair" d={`M ${x} ${y} C ${x + bend} ${y + l * 0.3}, ${x - bend} ${y + l * 0.6}, ${x + bend * 0.4} ${y + l}`} fill="none" stroke="rgba(10,6,3,0.75)" strokeWidth={1.6 * u} strokeLinecap="round" />);
    }
  }
  const fogId = `dmg${seed}`;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <radialGradient id={fogId} cx="50%" cy="50%" r="75%">
          <stop offset="0.55" stopColor="#3a1c08" stopOpacity={0} />
          <stop offset="1" stopColor="#3a1c08" stopOpacity={clamp(burn) * (0.55 + 0.2 * n2('bn' + seed, f * 0.02, 1))} />
        </radialGradient>
      </defs>
      {sepia > 0 && <rect width={w} height={h} fill="#8a5a22" opacity={clamp(sepia) * 0.4} style={{mixBlendMode: 'color'}} />}
      {burn > 0 && <rect width={w} height={h} fill={`url(#${fogId})`} />}
      {els}
      {fl > 0.002 && <rect width={w} height={h} fill="#fff" opacity={clamp(fl * 2)} />}
      {fl < -0.002 && <rect width={w} height={h} fill="#000" opacity={clamp(-fl * 2)} />}
    </svg>
  );
};

/** CRT screen overlay: scanlines, rolling interference band, per-beat slice glitch, phosphor tint, curved-glass edge, impact flash */
export const CrtOverlay: React.FC<{
  frame: number;
  w: number;
  h: number;
  u: number;
  seed?: number;
  scanlines?: number;
  rollBand?: number;
  sliceGlitch?: number;
  phosphor?: string;
  curvature?: number;
  flashAt?: number;
}> = ({frame, w, h, u, seed = 1, scanlines = 0, rollBand = 0, sliceGlitch = 0, phosphor = '', curvature = 0, flashAt = -1}) => {
  const id = `crt${seed}`;
  const gap = Math.max(2, Math.round(3 * u));
  const bandY = ((frame * 6 * u) % (h * 1.6)) - h * 0.3;
  const flash = flashAt >= 0 && frame >= flashAt ? clamp(1 - (frame - flashAt) / 6) : 0;
  const slices: React.ReactNode[] = [];
  if (sliceGlitch > 0 && h1('sg' + seed, Math.floor(frame / 2)) < 0.12 * sliceGlitch + 0.02) {
    for (let i = 0; i < 3; i++) {
      const y = h1('sy' + seed + i, frame) * h;
      const hh = (4 + 26 * h1('sh' + seed + i, frame)) * u;
      const dx = (h1('sx' + seed + i, frame) - 0.5) * 60 * u * sliceGlitch;
      slices.push(<rect key={i} x={dx} y={y} width={w} height={hh} fill={i % 2 ? 'rgba(255,40,80,0.16)' : 'rgba(40,220,255,0.16)'} />);
    }
  }
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <pattern id={id + 'p'} width={gap} height={gap} patternUnits="userSpaceOnUse">
          <rect width={gap} height={Math.max(1, gap / 3)} fill="#000" />
        </pattern>
        <linearGradient id={id + 'b'} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.12 * rollBand} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={id + 'v'} cx="50%" cy="50%" r="72%">
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55 * clamp(curvature * 10)} />
        </radialGradient>
      </defs>
      {phosphor && <rect width={w} height={h} fill={phosphor} opacity={0.45} style={{mixBlendMode: 'color'}} />}
      {scanlines > 0 && <rect width={w} height={h} fill={`url(#${id}p)`} opacity={clamp(scanlines) * 0.6} />}
      {rollBand > 0 && <rect x={0} y={bandY} width={w} height={h * 0.18} fill={`url(#${id}b)`} />}
      {slices}
      {curvature > 0 && <rect width={w} height={h} fill={`url(#${id}v)`} />}
      {flash > 0.01 && <rect width={w} height={h} fill="#fff" opacity={flash * 0.8} />}
    </svg>
  );
};

/** black mask with a rounded rectangular aperture (projector / theatre gate) */
export const GateMask: React.FC<{w: number; h: number; aspect: number; radius: number; softness?: number; id: string}> = ({w, h, aspect, radius, softness = 0, id}) => {
  let gw = h * aspect;
  let gh = h;
  if (gw > w) {
    gw = w;
    gh = w / aspect;
  }
  const x = (w - gw) / 2;
  const y = (h - gh) / 2;
  const r = radius;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={softness} />
        </filter>
      </defs>
      <path
        fillRule="evenodd"
        fill="#000"
        filter={softness > 0 ? `url(#${id})` : undefined}
        d={`M0 0H${w}V${h}H0Z M${x + r} ${y}H${x + gw - r}A${r} ${r} 0 0 1 ${x + gw} ${y + r}V${y + gh - r}A${r} ${r} 0 0 1 ${x + gw - r} ${y + gh}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + gh - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`}
      />
    </svg>
  );
};
