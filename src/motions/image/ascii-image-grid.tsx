// Adapted from lemo-opuscar/styles/ascii-crt/demo/term.js makeRamp/pick/cellsFromImage (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {PlatePaletteName, sampleGrid, usePlatePixels, useSafeId} from '../../core/image-kit';
import {CrtGlass, RAMP20, asciiField, densityOrder, hh, lf, phosphor, pickLevel} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Any image (or the procedural plate) rebuilt as monospace glyphs on a strict 1:2 grid of a phosphor CRT:
 * brightness → glyph ink density + dim/normal/bold attribute, Bayer + hash dither, dark areas stay empty.
 * The only camera is the grid: the sample window slowly pushes in under constant-size glyphs.
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  cols: number;
  charset: string;
  phosphorLo: string;
  phosphorMid: string;
  phosphorHi: string;
  background: string;
  reveal: 'rows' | 'random' | 'none';
  revealFrames: number;
  push: number;
  dither: number;
  title: string;
};

const ATTR = [0.42, 0.7, 1.0];

const AsciiGrid: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D, portrait} = useStage();
  const id = useSafeId('ascii');
  const px = usePlatePixels({src: p.src, seed: p.seed, palette: p.palette}, 480);
  const cols = Math.max(20, Math.round(portrait ? p.cols * 0.62 : p.cols));
  const cw = w / cols;
  const ch = cw * 2;
  const rows = Math.ceil(h / ch);
  const ramp = p.charset ? densityOrder(p.charset).join('') : RAMP20;
  const levels = Math.min(20, ramp.length);
  const charAt = (lv: number) => ramp[Math.min(ramp.length - 1, Math.round((lv / Math.max(1, levels - 1)) * (ramp.length - 1)))];
  // grid camera: sample window shrinks about the centre
  const z = lerp(1, p.push, prog(frame, 0, D, ease.sine));
  const half = 0.5 / z;
  const rect = {x0: 0.5 - half, y0: 0.5 - (half * rows * ch) / h, x1: 0.5 + half, y1: 0.5 + (half * rows * ch) / h};
  const flick = Math.floor(frame / 3);
  const rowsOut: React.ReactNode[] = [];
  if (px) {
    const rgb = sampleGrid(px, cols, rows, rect);
    const L = asciiField(rgb, cols, rows);
    for (let j = 0; j < rows; j++) {
      // reveal
      let typedCols = cols;
      if (p.reveal === 'rows') typedCols = Math.floor(clamp((frame - (j / rows) * p.revealFrames * 0.7) / (p.revealFrames * 0.3)) * cols);
      const groups: {cls: number; xs: number[]; chars: string[]}[][] = [[], [], [], []];
      for (let i = 0; i < cols; i++) {
        if (i >= typedCols) break;
        const v = L[j * cols + i];
        if (v <= 0) continue;
        if (p.reveal === 'random' && hh(i, j, 7) > clamp(frame / Math.max(1, p.revealFrames)) * 1.05) continue;
        // a few cells re-pick their dither every 3 frames (live phosphor noise)
        const lv = pickLevel(v, levels, i, j, p.dither, hh(i, j, 11) < 0.04 ? flick : 0);
        if (lv <= 0) continue;
        const cls = v < 0.3 ? 0 : v < 0.6 ? 1 : v < 0.85 ? 2 : 3;
        const g = groups[cls];
        let cur = g[g.length - 1];
        if (!cur) {
          cur = {cls, xs: [], chars: []};
          g.push(cur);
        }
        cur.xs.push(i * cw);
        cur.chars.push(charAt(lv));
      }
      groups.forEach((g, cls) =>
        g.forEach((run, k) =>
          rowsOut.push(
            <text key={`${j}-${cls}-${k}`} x={run.xs.map((x) => x.toFixed(1)).join(' ')} y={(j + 0.78) * ch} fill={phosphor([0.25, 0.5, 0.75, 1][cls], p.phosphorLo, p.phosphorMid, p.phosphorHi)} opacity={ATTR[Math.min(2, cls)]}>
              {run.chars.join('')}
            </text>,
          ),
        ),
      );
    }
  }
  const titleTyped = p.title.slice(0, Math.max(0, Math.floor((frame - 4) / 1.2)));
  const cursorOn = Math.floor(frame / 15) % 2 === 0;
  const ts = (portrait ? 64 : 72) * u;

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <filter id={`${id}-glow`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={3.2 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g fontFamily={lf.vt} fontSize={ch * 1.12} filter={`url(#${id}-glow)`}>
          {rowsOut}
        </g>
        {p.title && (
          <g filter={`url(#${id}-glow)`}>
            <rect x={60 * u} y={56 * u} width={(titleTyped.length * 0.5 + 1.2) * ts} height={ts * 1.05} fill={p.background} opacity={0.82} />
            <text x={74 * u} y={56 * u + ts * 0.86} fontFamily={lf.vt} fontSize={ts} fill={p.phosphorHi}>
              {titleTyped}
            </text>
            {cursorOn && <rect x={74 * u + titleTyped.length * ts * 0.4 + 6 * u} y={56 * u + ts * 0.2} width={ts * 0.4} height={ts * 0.7} fill={p.phosphorMid} />}
          </g>
        )}
        <CrtGlass id={id} w={w} h={h} u={u} tint={p.phosphorMid} frame={frame} />
      </Svg>
    </AbsoluteFill>
  );
};

export const asciiImageGrid = defineMotion<Props>({
  id: 'ascii-image-grid',
  title: 'ASCII image grid (phosphor CRT)',
  category: 'image',
  description:
    'An image or procedural scene rebuilt as amber phosphor glyphs on a strict monospace grid: brightness becomes glyph ink density and dim/normal/bold attributes, dark areas stay empty; rows type in, then the sample window slowly pushes in under constant-size glyphs.',
  source: ['lemo-opuscar styles/ascii-crt demo/term.js makeRamp, pick, cellsFromImage (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §3 ascii-image-grid'],
  useFor: 'A logo, product or photo in a terminal aesthetic for dev tools, hacker, retro-computing and data brands.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 2,
    palette: 'dusk',
    cols: 132,
    charset: '',
    phosphorLo: '#FF6605',
    phosphorMid: '#FFB000',
    phosphorHi: '#FFEBB8',
    background: '#090604',
    reveal: 'rows',
    revealFrames: 40,
    push: 1.18,
    dither: 0.65,
    title: 'HARBOUR.LOG',
  },
  propDocs: {
    src: 'public/ image to convert (empty = procedural plate)',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette',
    cols: 'grid columns in landscape (portrait uses ~62 %); 80–240',
    charset: 'restrict glyphs to these characters, e.g. a sentence ("a picture made only of these words"); empty = full density ramp',
    phosphorLo: 'dim phosphor colour (amber #FF6605, green P1 #1F8F3A)',
    phosphorMid: 'mid phosphor colour',
    phosphorHi: 'overexposed phosphor colour',
    background: 'unlit glass colour (warm near-black)',
    reveal: 'rows = typed top to bottom, random = cells pop in, none = already on',
    revealFrames: 'reveal duration',
    push: 'grid-camera push over the whole duration (1 = none)',
    dither: 'Bayer + hash dither amount (0.6–0.7 in the source)',
    title: 'typed terminal title top-left with block cursor (empty = none)',
  },
  component: AsciiGrid,
  tags: ['ascii', 'ascii art', 'terminal', 'crt', 'phosphor', 'amber', 'retro computing', 'glyphs', 'monospace', 'hacker', 'dev tools', 'image effect', 'text art', 'vt323', 'typing'],
});
