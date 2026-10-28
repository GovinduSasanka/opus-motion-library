import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {rng} from '../../core/random';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FilterDefs, PixelDitherFilter, Plate, PlatePaletteName, useSafeId} from '../../core/image-kit';

/**
 * video21 pixelate-dither-look + cinemascope-letterbox: the frame is a ~320-px-wide picture upscaled
 * x6 nearest-neighbour, ordered-dithered (2x2 Bayer) and graded to a 5–8 step hue ramp, inside hard
 * black 2.34:1 bars, with faint grain + vignette. Optional slow tilt / push and rising pixel embers.
 * Everything moves under a fixed pixel grid, so the "virtual pixels" never swim.
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  pixelSize: number;
  colors: string[];
  dither: number;
  tilt: number;
  push: number;
  letterbox: 'auto' | 'on' | 'off';
  aspect: number;
  embers: number;
  grain: number;
  vignette: number;
  fadeIn: number;
  /** palette collapse (EXTENDS r2): colour-depth steps taken one per `stepFrames` after `collapseAt`; presets full (24 steps) | c16 | c8 (steps resampled from `colors`) | gb4 | c2 | faded (fixed blue-grey ramps) or a hex ramp "#000,#334,#99a" */
  ladder: string[];
  stepFrames: number;
  collapseAt: number;
};

/** colour-depth presets: n = number of steps resampled from the main ramp; pal = fixed ramp */
const LADDER: Record<string, {n?: number; pal?: string[]}> = {
  full: {n: 24},
  c16: {n: 16},
  c8: {n: 8},
  gb4: {pal: ['#0d1b2a', '#35506b', '#7e9bb5', '#d3e0ea']},
  c2: {pal: ['#1b2a3a', '#cfdbe6']},
  faded: {pal: ['#14202b', '#2a3b4b', '#425669', '#5d7388', '#7d92a6', '#a3b5c5', '#cbd8e3']},
};

const hexRgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const resampleRamp = (ramp: string[], n: number) => {
  if (ramp.length < 2) return ramp;
  return Array.from({length: n}, (_, i) => {
    const t = (i / Math.max(1, n - 1)) * (ramp.length - 1);
    const k = Math.min(ramp.length - 2, Math.floor(t));
    const f = t - k;
    const a = hexRgb(ramp[k]);
    const b = hexRgb(ramp[k + 1]);
    return '#' + a.map((v, j) => Math.round(v + (b[j] - v) * f).toString(16).padStart(2, '0')).join('');
  });
};

const PixelDither: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: D, portrait} = useStage();
  const id = useSafeId('pxd');
  const ps = Math.max(2, Math.round(p.pixelSize * u));
  const stepIdx = p.ladder.length ? Math.max(0, Math.min(p.ladder.length, Math.floor((frame - p.collapseAt) / Math.max(1, p.stepFrames)) + 1)) : 0;
  const stepName = stepIdx > 0 ? p.ladder[stepIdx - 1] : '';
  const stepDef = stepName ? (LADDER[stepName] ?? (stepName.includes('#') ? {pal: stepName.split(',').map((c) => c.trim())} : undefined)) : undefined;
  const palNow = stepDef ? (stepDef.pal ?? resampleRamp(p.colors, stepDef.n ?? 8)) : p.colors;
  const levelsNow = 5;
  const flash = p.ladder.length && frame >= p.collapseAt && (frame - p.collapseAt) % Math.max(1, p.stepFrames) < 2 && stepIdx > 0 ? 0.12 : 0;
  const boxed = p.letterbox === 'on' || (p.letterbox === 'auto' && !portrait);
  const ha = boxed ? Math.min(h, Math.round(w / p.aspect / ps) * ps) : h;
  const top = Math.round((h - ha) / 2);
  const tSec = frame / fps;
  const Tsec = D / fps;

  // slow tilt (px/s at 1080p, + = camera tilts up so content moves down) and push (%/s)
  const k = interpolate(frame, [0, D], [0, 1], {easing: Easing.bezier(0.45, 0, 0.4, 1)});
  const travel = Math.abs(p.tilt) * u * Tsec;
  const zoom = 1 + (p.push / 100) * tSec;
  const cover = 1 + travel / ha + 0.01;
  const ty = (p.tilt >= 0 ? -0.5 + k : 0.5 - k) * travel;

  const fade = p.fadeIn > 0 ? interpolate(frame, [p.fadeIn * 0.33, p.fadeIn], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;

  // embers: 1-virtual-pixel squares rising 20–40 px/s with flicker, snapped to the grid by the filter
  const er = rng(p.seed * 13 + 5);
  const embers = Array.from({length: p.embers}, (_, i) => {
    const x0 = w * (0.25 + 0.5 * er());
    const y0 = er() * ha;
    const v = (20 + 20 * er()) * u;
    const life = ha + 40 * u;
    const y = ha - ((ha - y0 + tSec * v * 3) % life);
    const x = x0 + Math.sin(tSec * (1 + er()) + i) * 14 * u;
    const on = (Math.floor(frame / 3) + i) % 5 !== 0;
    const big = er() > 0.75;
    return {x, y, s: ps * (big ? 2 : 1), on, c: er() > 0.5 ? '#ffd27a' : '#ff8a3d'};
  });

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <FilterDefs>
        <PixelDitherFilter id={id} size={ps} palette={palNow} dither={p.dither} levels={levelsNow} />
      </FilterDefs>
      <div style={{position: 'absolute', left: 0, top, width: w, height: ha, overflow: 'hidden', opacity: fade}}>
        {/* filtered wrapper: fixed pixel grid; everything inside moves underneath it */}
        <div style={{position: 'absolute', inset: 0, filter: `url(#${id})`}}>
          <div style={{position: 'absolute', left: 0, top: (ha - h) / 2, width: w, height: h, transform: `translateY(${ty}px) scale(${zoom * cover})`, transformOrigin: '50% 50%'}}>
            <Plate src={p.src} seed={p.seed} palette={p.palette} />
          </div>
          <svg width={w} height={ha} style={{position: 'absolute', inset: 0}}>
            {embers.map((e, i) => e.on && <rect key={i} x={e.x} y={e.y} width={e.s} height={e.s} fill={e.c} />)}
          </svg>
        </div>
        {flash > 0 && <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash}} />}
        {p.vignette > 0 && <Vignette strength={p.vignette} />}
        {p.grain > 0 && <FilmGrain opacity={p.grain * 2.5} every={1} />}
      </div>
    </AbsoluteFill>
  );
};

export const pixelDither = defineMotion<Props>({
  id: 'pixel-dither',
  title: 'Pixelate + Bayer dither look',
  category: 'image',
  description: 'Image rendered as chunky 6 px pixel art with 2x2 Bayer ordered dither, a 5–8 colour hue ramp, 2.34:1 letterbox, grain and vignette, slowly tilting.',
  source: ['video21 0:00-0:20 pixelate-dither-look', 'video21 cinemascope-letterbox'],
  useFor: 'Retro game / pixel-art cinematics, moody cold opens, unifying mixed stills into one pixel style.',
  durationInFrames: 180,
  defaultProps: {
    src: '',
    seed: 1,
    palette: 'dusk',
    pixelSize: 6,
    colors: ['#06050a', '#170d1a', '#33172a', '#5e2430', '#93392d', '#c8642f', '#eda14c', '#ffe0a3'],
    dither: 1,
    tilt: 22,
    push: 1.2,
    letterbox: 'auto',
    aspect: 2.34,
    embers: 18,
    grain: 0.035,
    vignette: 0.55,
    fadeIn: 18,
    ladder: [],
    stepFrames: 15,
    collapseAt: 30,
  },
  propDocs: {
    src: 'public/ image path; empty = procedural plate',
    seed: 'procedural plate / ember seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    pixelSize: 'virtual pixel size in px at 1080p (source: 6)',
    colors: 'luminance ramp dark -> light (3–8 colours); [] keeps source colours, posterised',
    dither: '2x2 Bayer dither strength in palette steps (0 = none, 1 = classic)',
    tilt: 'slow vertical tilt in px/s (+ = tilt up)',
    push: 'slow push-in in %/s',
    letterbox: 'auto (landscape only) | on | off — hard black bars',
    aspect: 'active picture aspect (2.34 in the source)',
    embers: 'number of rising pixel embers (0 = none)',
    grain: 'grain amount (0.03–0.04)',
    vignette: 'corner darkening (0.55 in the source)',
    fadeIn: 'fade from black over this many frames',
    ladder: "palette collapse: colour-depth steps, one per stepFrames after collapseAt, e.g. ['c16','c8','gb4','c2','faded'] (presets full 24 steps | c16 | c8 resampled from colors | gb4 | c2 | faded fixed blue-greys, or a hex ramp string '#000,#445,#aab'); [] = off",
    stepFrames: 'palette collapse: frames per step (a beat, 15 = 0.5 s)',
    collapseAt: 'palette collapse: frame of the first step',
  },
  component: PixelDither,
  tags: ['image', 'pixel-art', 'dither', 'retro', 'letterbox', 'grade', 'palette collapse', 'colour depth', 'memory fading', 'bit depth', 'faded', 'flashback'],
});
