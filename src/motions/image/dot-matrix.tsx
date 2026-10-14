import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {rng} from '../../core/random';
import {Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {PlatePaletteName, hexRgb, luma, mixRgb, rgbStr, sampleGrid, usePlatePixels, useSafeId} from '../../core/image-kit';

/**
 * video18 dot-matrix remix: the image resampled to a grid of round dots.
 *  - led: cells drawn at 0.92 x pitch in the cell's mean colour (+20 % contrast); dark "background"
 *    cells become small dim LED dots (0.55 x pitch, #972C21) on a black panel; refresh held 2 frames.
 *  - halftone: print duotone, r = 0.5 p sqrt(1 - L^0.8) clamped to [0.08, 0.62] p, one ink on flat paper.
 *  - glow: off-grid jittered particles, r = rand(0.2..1) * L^2 * 18 px, L < 0.25 dropped, colour
 *    lerp(body, white, L), blurred copy screen-blended, reseeded every 2 frames (shimmer).
 *  - pointillism (video14): jittered overlapping dabs with ±15 % colour jitter + 10 % complementary.
 * resolution-ramp: pitch steps (hard cuts, 6 f apart, 2-frame x1.08 overshoot) 150 -> 90 -> 60 -> 40 -> legible,
 * and the reverse at the end (40 -> 300).
 */
type Style = 'led' | 'halftone' | 'glow' | 'pointillism';

type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  style: Style;
  pitch: number;
  ramp: number[];
  stepFrames: number;
  rampStart: number;
  rampOut: boolean;
  push: number;
  holdFrames: number;
  panel: string;
  bgDot: string;
  matte: number;
  paper: string;
  ink: string;
  invert: boolean;
  body: string;
  maxRadius: number;
  glow: number;
};

/** ink / paper pairs measured in video18 */
export const HALFTONE_PAIRS: [string, string][] = [
  ['#FAF1DE', '#29254A'],
  ['#F7F00B', '#030303'],
  ['#15FFFD', '#030303'],
  ['#EF5E30', '#030303'],
  ['#2321F5', '#FFFFFF'],
  ['#EB1458', '#FFFFFF'],
];

const DotMatrix: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D} = useStage();
  const id = useSafeId('dm');
  const px = usePlatePixels({src: p.src, seed: p.seed, palette: p.palette}, 480);
  const fq = Math.floor(frame / Math.max(1, p.holdFrames)) * Math.max(1, p.holdFrames);

  // ---- resolution ramp (hard steps) -----------------------------------------------------------
  const minPitch = Math.sqrt((w * h) / 5000);
  const rampIn = p.ramp.map((v) => v * u);
  const legible = Math.max(minPitch, p.pitch * u);
  const outSteps = p.rampOut ? [legible * 1.6, legible * 3, 150 * u, 300 * u] : [];
  let pitch = legible;
  let stepStart = -100;
  const ri = Math.floor((frame - p.rampStart) / p.stepFrames);
  if (frame < p.rampStart && rampIn.length) {
    pitch = rampIn[0];
    stepStart = -100;
  } else if (ri < rampIn.length) {
    pitch = rampIn[Math.max(0, ri)];
    stepStart = p.rampStart + Math.max(0, ri) * p.stepFrames;
  } else if (ri === rampIn.length) {
    stepStart = p.rampStart + ri * p.stepFrames;
  }
  const outStart = D - outSteps.length * p.stepFrames;
  if (outSteps.length && frame >= outStart) {
    const oi = Math.min(outSteps.length - 1, Math.floor((frame - outStart) / p.stepFrames));
    pitch = outSteps[oi];
    stepStart = outStart + oi * p.stepFrames;
  }
  pitch = Math.max(minPitch, pitch);
  const overshoot = frame - stepStart < 2 && frame >= stepStart ? 1.08 : 1;

  const cols = Math.ceil(w / pitch) + 1;
  const rows = Math.ceil(h / pitch) + 1;
  const ox = (w - cols * pitch) / 2;
  const oy = (h - rows * pitch) / 2;
  const zoom = 1 + (p.push / 100) * (fq / 30);

  // background colour per style
  const bg = p.style === 'led' ? p.panel : p.style === 'halftone' ? p.paper : p.style === 'glow' ? '#09071F' : p.paper;
  const bgFill = p.style === 'glow' ? (p.body.toLowerCase() === '#ffffff' ? '#050505' : bg) : bg;

  const dots: React.ReactNode[] = [];
  const glowDots: React.ReactNode[] = [];
  if (px) {
    // sample a slightly larger window than the grid so the last column is valid
    const nx = (x: number) => 0.5 + (x / w - 0.5) / zoom;
    const ny = (y: number) => 0.5 + (y / h - 0.5) / zoom;
    const g = sampleGrid(px, cols, rows, {x0: nx(ox), y0: ny(oy), x1: nx(ox + cols * pitch), y1: ny(oy + rows * pitch)});
    const r = rng(p.seed * 977 + (p.style === 'glow' ? fq : p.style === 'pointillism' ? Math.floor(frame / 6) : 0));
    const bgDot = hexRgb(p.bgDot);
    const ink = hexRgb(p.ink);
    const body = hexRgb(p.body);
    const white: [number, number, number] = [255, 255, 255];
    // auto-levels (5th..97th percentile) for the luminance-driven styles so dark plates keep a full tonal range
    let lo = 0;
    let hi = 1;
    if (p.style === 'halftone' || p.style === 'glow') {
      const ls: number[] = [];
      for (let i = 0; i < cols * rows; i++) ls.push(luma(g, i * 3));
      ls.sort((a, b) => a - b);
      lo = ls[Math.floor(ls.length * 0.05)];
      hi = Math.max(lo + 0.2, ls[Math.floor(ls.length * 0.97)]);
    }
    for (let gy = 0; gy < rows; gy++)
      for (let gx = 0; gx < cols; gx++) {
        const o = (gy * cols + gx) * 3;
        const c: [number, number, number] = [g[o], g[o + 1], g[o + 2]];
        const L = clamp((luma(c) - lo) / (hi - lo));
        const cx = ox + (gx + 0.5) * pitch;
        const cy = oy + (gy + 0.5) * pitch;
        const k = gy * cols + gx;
        if (p.style === 'led') {
          if (L < p.matte) dots.push(<circle key={k} cx={cx} cy={cy} r={0.275 * pitch} fill={rgbStr(bgDot)} />);
          else {
            const b = c.map((v) => clamp((v - 128) * 1.2 + 128, 0, 255)) as [number, number, number];
            dots.push(<circle key={k} cx={cx} cy={cy} r={0.46 * pitch} fill={rgbStr(b)} />);
          }
        } else if (p.style === 'halftone') {
          const l = Math.pow(L, 0.8);
          const v = p.invert ? l : 1 - l;
          const rr = 0.5 * pitch * Math.sqrt(v);
          if (rr < 0.08 * pitch) continue;
          dots.push(<circle key={k} cx={cx} cy={cy} r={Math.min(0.62 * pitch, rr)} fill={rgbStr(ink)} />);
        } else if (p.style === 'glow') {
          if (L < 0.25) {
            r();
            r();
            r();
            continue;
          }
          const jx = (r() - 0.5) * pitch;
          const jy = (r() - 0.5) * pitch;
          const rr = Math.max(1 * u, (0.2 + 0.8 * r()) * L * L * p.maxRadius * u);
          const col = rgbStr(mixRgb(body, white, clamp((L - 0.25) / 0.75) * 0.85));
          dots.push(<circle key={k} cx={cx + jx} cy={cy + jy} r={rr} fill={col} />);
          if (p.glow > 0) glowDots.push(<circle key={k} cx={cx + jx} cy={cy + jy} r={rr * 1.3} fill={col} />);
        } else {
          // pointillism dabs
          const jx = (r() - 0.5) * pitch * 0.9;
          const jy = (r() - 0.5) * pitch * 0.9;
          const comp = r() < 0.1;
          const j = 1 + (r() - 0.5) * 0.3;
          let col: [number, number, number] = comp ? [255 - c[0], 255 - c[1], 255 - c[2]] : [c[0] * j, c[1] * j, c[2] * (2 - j)];
          col = col.map((v) => clamp(v, 0, 255)) as [number, number, number];
          const rr = (0.42 + 0.22 * r()) * pitch * (comp ? 0.6 : 1);
          dots.push(<circle key={k} cx={cx + jx} cy={cy + jy} r={rr} fill={rgbStr(col)} />);
        }
      }
  }

  return (
    <AbsoluteFill style={{background: bgFill, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={10 * u} />
          </filter>
        </defs>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${overshoot}) translate(${-w / 2} ${-h / 2})`}>
          {glowDots.length > 0 && (
            <g filter={`url(#${id})`} opacity={0.7 * p.glow} style={{mixBlendMode: 'screen'}}>
              {glowDots}
            </g>
          )}
          <g>{dots}</g>
        </g>
      </svg>
      {(p.style === 'led' || p.style === 'glow') && <Vignette strength={0.35} />}
    </AbsoluteFill>
  );
};

export const dotMatrix = defineMotion<Props>({
  id: 'dot-matrix',
  title: 'Dot matrix / halftone / particle image',
  category: 'image',
  description: 'Image resampled to a grid of dots — LED billboard, print halftone duotone, glowing luma particles or pointillist dabs — with a stepped resolution ramp from abstract to legible and back.',
  source: ['video18 0:00-0:20 led-dot-matrix, resolution-ramp, halftone-duotone, luma-particle-glow', 'video14 pointillism-fill / halftone-bg'],
  useFor: 'Music-video stylisation, beat-synced reveals of a picture, retro LED signage, print/poster looks.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 1,
    palette: 'dusk',
    style: 'led',
    pitch: 26,
    ramp: [150, 90, 60, 40],
    stepFrames: 6,
    rampStart: 8,
    rampOut: true,
    push: 2,
    holdFrames: 2,
    panel: '#060404',
    bgDot: '#972C21',
    matte: 0.14,
    paper: '#FAF1DE',
    ink: '#29254A',
    invert: false,
    body: '#FFC861',
    maxRadius: 18,
    glow: 1,
  },
  propDocs: {
    src: 'public/ image path; empty = procedural plate (sampled analytically)',
    seed: 'procedural plate / jitter seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    style: 'led | halftone | glow | pointillism',
    pitch: 'legible dot pitch in px at 1080p (led 26, halftone 13–29, glow 12–18); auto-raised to keep ≤ 5000 dots',
    ramp: 'coarser pitches stepped through before the legible one ([] = no ramp)',
    stepFrames: 'frames per ramp step (half-beats: 5–6)',
    rampStart: 'frame of the first ramp step',
    rampOut: 'reverse ramp (coarser and coarser) over the last steps',
    push: 'slow push-in of the sampled image in %/s (keeps the dots alive)',
    holdFrames: 'refresh the mosaic every N frames (LED low-fps feel)',
    panel: 'led: panel colour',
    bgDot: 'led: dim background-dot colour',
    matte: 'led: cells darker than this luma become background dots (0 = off)',
    paper: 'halftone / pointillism: paper colour (pairs: #FAF1DE/#29254A, #F7F00B/#030303, #15FFFD/#030303, #EF5E30/#030303, #2321F5/#FFFFFF, #EB1458/#FFFFFF)',
    ink: 'halftone: ink colour',
    invert: 'halftone: light ink on dark paper (dot size grows with brightness)',
    body: 'glow: particle body colour (gold #FFC861, violet #D88BFF, white)',
    maxRadius: 'glow: max particle radius in px at 1080p',
    glow: 'glow: blurred bloom copy strength 0..1',
  },
  component: DotMatrix,
  tags: ['image', 'halftone', 'led', 'dots', 'particles', 'pointillism', 'resolution-ramp', 'music-video'],
});
