import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {rng} from '../../core/random';
import {fonts} from '../../core/fonts';
import {h1} from '../../core/r2-e4-kit';
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
type Style = 'led' | 'halftone' | 'glow' | 'pointillism' | 'field' | 'tiles' | 'text';
type FieldLayer = {color: string; angle: number; step: number; k: number};

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
  field: 'radial' | 'edge' | 'ramp';
  fieldLayers: FieldLayer[];
  fieldRadius: number;
  fieldPow: number;
  fieldSwell: number;
  fieldCenter: [number, number];
  tileSize: number;
  tileShape: 'square' | 'round' | 'circle';
  grout: number;
  flipFrames: number;
  flipOrder: 'radial' | 'random' | 'sweep';
  flipStart: number;
  flipSpan: number;
  text: string;
  textGrid: number;
  textWave: number;
  zoomFrom: number;
  textColor: string;
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


/** analytic halftone density field (Ben-Day layers at different angles, multiply-printed on paper) */
const FieldRender: React.FC<{p: Props; frame: number; w: number; h: number; u: number}> = ({p, frame, w, h, u}) => {
  const layers = p.fieldLayers.length ? p.fieldLayers : [{color: p.ink, angle: 45, step: 22, k: 0.65}];
  const R = Math.hypot(w, h) * 0.5 * p.fieldRadius * (1 + p.fieldSwell * Math.sin((frame / 30) * 2));
  const cx0 = p.fieldCenter[0] * w;
  const cy0 = p.fieldCenter[1] * h;
  const pw = p.fieldPow;
  const paths = layers.map((L, li) => {
    const step = L.step * u;
    const a = (L.angle * Math.PI) / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const n = Math.ceil(Math.hypot(w, h) / step) + 1;
    let d = '';
    for (let j = -n; j <= n; j++)
      for (let i = -n; i <= n; i++) {
        const lx = i * step;
        const ly = j * step;
        const x = w / 2 + lx * ca - ly * sa;
        const y = h / 2 + lx * sa + ly * ca;
        if (x < -step || x > w + step || y < -step || y > h + step) continue;
        let v: number;
        if (p.field === 'edge') {
          const e = Math.min(x, w - x, y, h - y) / (Math.min(w, h) * 0.35 * p.fieldRadius);
          v = Math.pow(clamp(1 - e), pw);
        } else if (p.field === 'ramp') {
          v = Math.pow(clamp(x / w + 0.25 * Math.sin((frame / 30) * p.fieldSwell * 2)), pw);
        } else {
          v = Math.pow(clamp(1 - Math.hypot(x - cx0, y - cy0) / R), pw);
        }
        const r = L.k * step * 0.5 * Math.sqrt(v) * 1.15;
        if (r < 0.6 * u) continue;
        d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;
      }
    return <path key={li} d={d} fill={L.color} style={{mixBlendMode: 'multiply'}} />;
  });
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      {paths}
    </svg>
  );
};

/** image built from flipping tiles with grout */
const TilesRender: React.FC<{p: Props; frame: number; w: number; h: number; u: number; px: ReturnType<typeof usePlatePixels>}> = ({p, frame, w, h, u, px}) => {
  const size = Math.max(w * 0.015, (p.tileSize / 100) * Math.min(w, h));
  const cols = Math.ceil(w / size);
  const rows = Math.ceil(h / size);
  const g = px ? sampleGrid(px, cols, rows, {x0: 0, y0: 0, x1: 1, y1: 1}) : null;
  const ox = (w - cols * size) / 2;
  const oy = (h - rows * size) / 2;
  const els: React.ReactNode[] = [];
  const maxD = Math.hypot(cols, rows) / 2;
  for (let gy = 0; gy < rows; gy++)
    for (let gx = 0; gx < cols; gx++) {
      const k = gy * cols + gx;
      let ord = 0;
      if (p.flipOrder === 'random') ord = h1('tf' + p.seed, k);
      else if (p.flipOrder === 'sweep') ord = gx / cols;
      else ord = Math.hypot(gx - cols / 2, gy - rows / 2) / maxD;
      const t0 = p.flipStart + ord * p.flipSpan;
      const t = clamp((frame - t0) / Math.max(1, p.flipFrames));
      const sx = Math.abs(Math.cos(Math.PI * t));
      const front = t >= 0.5;
      const o = k * 3;
      const col = g && front ? `rgb(${g[o] | 0},${g[o + 1] | 0},${g[o + 2] | 0})` : p.bgDot;
      const cx = ox + (gx + 0.5) * size;
      const cy = oy + (gy + 0.5) * size;
      const s = size - p.grout * u;
      if (s <= 0 || sx < 0.01) continue;
      if (p.tileShape === 'circle') els.push(<ellipse key={k} cx={cx} cy={cy} rx={(s / 2) * sx} ry={s / 2} fill={col} />);
      else els.push(<rect key={k} x={cx - (s / 2) * sx} y={cy - s / 2} width={s * sx} height={s} rx={p.tileShape === 'round' ? s * 0.22 : 0} fill={col} />);
    }
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      {els}
    </svg>
  );
};

/** words spelled by lit cells of a huge dot grid; camera cranes from one cell to the full floor */
const TextRender: React.FC<{p: Props; frame: number; w: number; h: number; u: number; D: number}> = ({p, frame, w, h, u, D}) => {
  const id = `ct${p.seed}`;
  const cell = Math.max(3 * u, w / p.textGrid);
  const words = p.text.split(/\s+/).filter(Boolean);
  const per = Math.max(8, Math.floor((D * 0.6) / Math.max(1, words.length)));
  const zz = p.zoomFrom > 1 ? Math.exp(Math.log(p.zoomFrom) * (1 - Math.sqrt(clamp(frame / (D * 0.4))))) : 1;
  const stack = words.length > 2 && w < h;
  const fs = Math.min(h * 0.2, (w * 0.88) / Math.max(3, (stack ? Math.max(...words.map((x) => x.length)) : p.text.length) * 0.7));
  const lines = stack ? words : [p.text];
  const bands = 8;
  const wave = (y: number) => 0.5 + 0.5 * Math.sin(y * 0.01 + (frame / 30) * p.textWave * 3);
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <defs>
        <pattern id={id + 'p'} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <rect x={cell * 0.14} y={cell * 0.14} width={cell * 0.72} height={cell * 0.72} fill={p.textColor} />
        </pattern>
        <mask id={id + 'm'}>
          <rect width={w} height={h} fill="#000" />
          {lines.map((ln, li) => {
            const wd = ln.split(' ');
            return (
              <text key={li} x={w / 2} y={h / 2 + (li - (lines.length - 1) / 2) * fs * 1.15 + fs * 0.35} textAnchor="middle" fontFamily={fonts.display} fontWeight={800} fontSize={fs} fill="#fff">
                {wd.map((wt, wi) => {
                  const gi = stack ? li : words.indexOf(wt);
                  const on = clamp((frame - (6 + gi * per)) / 10);
                  return (
                    <tspan key={wi} fillOpacity={on}>
                      {wt + (wi < wd.length - 1 ? ' ' : '')}
                    </tspan>
                  );
                })}
              </text>
            );
          })}
        </mask>
      </defs>
      <g transform={`translate(${w / 2} ${h / 2}) scale(${zz}) translate(${-w / 2} ${-h / 2})`}>
        {Array.from({length: bands}, (_, b) => (
          <rect key={b} x={0} y={(b / bands) * h} width={w} height={h / bands + 1} fill={`url(#${id}p)`} opacity={0.06 + 0.18 * wave((b / bands) * h) * (0.6 + 0.4 * random('cw' + b + Math.floor(frame / 3)))} />
        ))}
        <rect width={w} height={h} fill={`url(#${id}p)`} mask={`url(#${id}m)`} opacity={0.95} />
      </g>
    </svg>
  );
};

const DotMatrix: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D} = useStage();
  const id = useSafeId('dm');
  const px = usePlatePixels({src: p.src, seed: p.seed, palette: p.palette}, 480);
  const fq = Math.floor(frame / Math.max(1, p.holdFrames)) * Math.max(1, p.holdFrames);
  if (p.style === 'field' || p.style === 'tiles' || p.style === 'text') {
    return (
      <AbsoluteFill style={{background: p.style === 'field' ? p.paper : p.panel, overflow: 'hidden', isolation: 'isolate'}}>
        {p.style === 'field' && <FieldRender p={p} frame={frame} w={w} h={h} u={u} />}
        {p.style === 'tiles' && <TilesRender p={p} frame={frame} w={w} h={h} u={u} px={px} />}
        {p.style === 'text' && <TextRender p={p} frame={frame} w={w} h={h} u={u} D={D} />}
      </AbsoluteFill>
    );
  }

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
    field: 'radial',
    fieldLayers: [
      {color: '#EB1458', angle: 15, step: 22, k: 0.7},
      {color: '#2321F5', angle: 70, step: 22, k: 0.6},
    ],
    fieldRadius: 0.8,
    fieldPow: 1.2,
    fieldSwell: 0.06,
    fieldCenter: [0.5, 0.5],
    tileSize: 3,
    tileShape: 'square',
    grout: 2,
    flipFrames: 8,
    flipOrder: 'radial',
    flipStart: 6,
    flipSpan: 60,
    text: 'SCALE',
    textGrid: 160,
    textWave: 1,
    zoomFrom: 6,
    textColor: '#7FD6FF',
  },
  propDocs: {
    src: 'public/ image path; empty = procedural plate (sampled analytically)',
    seed: 'procedural plate / jitter seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    style: 'led | halftone | glow | pointillism | field (analytic Ben-Day density field) | tiles (flipping mosaic tiles with grout) | text (words spelled by a cell grid)',
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
    field: "style 'field' (Ben-Day density field, no image): radial halo | edge (dots crowd the frame border) | ramp (left to right)",
    fieldLayers: "style 'field': overprinted layers [{color, angle deg, step px at 1080p, k dot size 0..1}] (multiply on paper)",
    fieldRadius: 'field: halo radius / edge band, relative (0.8)',
    fieldPow: 'field: density fall-off exponent (1.2)',
    fieldSwell: 'field: breathing amplitude of the halo (dots swell = emotion), 0 = static',
    fieldCenter: 'field radial: halo centre [x,y] 0..1',
    tileSize: "style 'tiles': tile size in % of the short side",
    tileShape: 'tiles: square | round | circle',
    grout: 'tiles: grout width px at 1080p (bgDot colour shows on the unflipped back of each tile)',
    flipFrames: 'tiles: frames a tile flip takes',
    flipOrder: 'tiles: radial (from the centre) | random | sweep (left to right)',
    flipStart: 'tiles: first flip frame',
    flipSpan: 'tiles: frames over which the flips are staggered',
    text: "style 'text': words spelled out by lit cells (panel colour is the floor)",
    textGrid: 'text: cells across the width',
    textWave: 'text: speed of the lattice flicker waves',
    zoomFrom: 'text: camera crane start zoom (1 = none, 6 = macro to wide)',
    textColor: 'text: lit cell colour',
  },
  component: DotMatrix,
  tags: ['image', 'halftone', 'led', 'dots', 'particles', 'pointillism', 'resolution-ramp', 'music-video', 'ben-day', 'density field', 'mosaic', 'tiles', 'flip', 'cell text', 'led wall', 'photo reveal'],
});
