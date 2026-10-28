import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame, useVideoConfig} from 'remotion';
import {useStage} from '../core/stage';

/**
 * Style engine. A style is a visual language (woodcut, risograph, ink wash, blueprint, pixel…) that can be applied
 * to ANY motion: the scene is rendered normally, then passed through one SVG filter chain (`steps`), finished with
 * HTML overlays (paper, grain, scanlines, vignette, letterbox, deckle, CRT glass, tape noise, film damage…), and
 * optionally re-timed ("on twos"). Because the filter works on pixels, one style restyles all motions with no
 * per-motion code.
 *
 * Filter pitfalls (learned the hard way, keep them in mind when adding steps):
 *  - feComposite `arithmetic` also acts on alpha and on PREMULTIPLIED colour: keep data images opaque, or do
 *    comparisons in the alpha channel (rgb = 0) and move the result to RGB with a feColorMatrix afterwards.
 *  - feImage (data URIs and element references) does not render inside CSS filters: every screen / pattern / glyph
 *    tile is built from feFlood rectangles + feMerge + feTile (see `makeTile`, `bayerNodes`, `glyphNodes`).
 *  - feTurbulence output carries noise in alpha too: always pass it through an opaque feColorMatrix (`noiseNodes`).
 *  - the chain always ends with opaque alpha (unless the style is `cutout`).
 *  - flood rectangles must sit on whole pixels; renders at a fractional device scale can break fine screens.
 */
export type FilterStep =
  // ---- tone and colour ----
  | {type: 'saturate'; value: number}
  | {type: 'contrast'; value: number; mid?: number}
  | {type: 'brightness'; value: number}
  | {type: 'posterize'; levels: number}
  | {type: 'gradientMap'; ramp: string[]; discrete?: boolean}
  /** alias of gradientMap for 2–3 inks (dark → light) */
  | {type: 'duotone'; colors: string[]}
  | {type: 'threshold'; at: number; ink: string; paper: string; jitter?: number; jitterFreq?: number}
  /** colour grade: temperature/tint (−1..1), lift (raise blacks), gain, gamma, saturation */
  | {type: 'grade'; temp?: number; tint?: number; lift?: number | [number, number, number]; gain?: number | [number, number, number]; gamma?: number; sat?: number}
  /** S-curve (amount 0..1) around a pivot */
  | {type: 'curve'; amount: number; pivot?: number}
  | {type: 'invert'}
  /** flip luminance (hue kept) when the frame is mostly light ('dark') or mostly dark ('light'): dark-mode styles stay dark on any motion */
  | {type: 'autoInvert'; want?: 'dark' | 'light'; threshold?: number}
  | {type: 'hue'; deg: number}
  /** add back a fraction of the ORIGINAL chroma after a gradient map / greyscale (0..1) */
  | {type: 'chromaKeep'; amount: number}
  /** keep one hue in colour, everything else greyscale (or mapped to `ramp`); recolor = flatten the accent to one ink.
   *  color 'any' keeps every saturated pixel (minSat) whatever its hue */
  | {type: 'accentIsolate'; color: string; range?: number; minSat?: number; ramp?: string[]; recolor?: string; saturate?: number}
  /** remember the pixels of one hue (before other steps) … */
  | {type: 'accentKeep'; color: string; range?: number; minSat?: number; soft?: number}
  /** … and paste them back on top (after other steps) */
  | {type: 'accentRestore'; recolor?: string; saturate?: number; amount?: number}
  /** nearest-colour quantisation to a fixed palette (≤ 8 colours), optional ordered (Bayer) dither */
  | {type: 'palette'; colors: string[]; dither?: number; cell?: number}
  /** per-channel ordered (Bayer 4×4) dither + posterize */
  | {type: 'dither'; levels: number; cell?: number; spread?: number}
  /** raw colour matrix: 15 numbers (R, G, B rows of 5; alpha kept) or 20 (full 4×5) — channel mixes such as orthochromatic film */
  | {type: 'matrix'; values: number[]}
  /** soft highlight roll-off 1 − e^(−k·x) (normalised): backlit paper / hide / glass glows instead of clipping */
  | {type: 'tonemap'; exposure: number}
  /** local contrast: pixel + amount·(pixel − wide blur) (analyst grade, gritty film, old-master modelling) */
  | {type: 'clarity'; radius: number; amount: number}
  // ---- print ----
  /** ink 'shade' = darker local colour, 'source' = the local colour; inverse = dots grow with brightness (light on dark) */
  | {type: 'halftone'; size: number; angle?: number; ink: string | 'shade' | 'source'; paper?: string; bias?: number; sharp?: number; inverse?: boolean}
  | {type: 'lines'; gap: number; angle?: number; ink: string | 'shade' | 'source'; paper?: string; bias?: number; sharp?: number; inverse?: boolean}
  /** spot-ink separation: each ink its own plate, angled halftone (period > 0) or flat (period 0), per-plate misregistration */
  | {type: 'plates'; inks: {color: string; angle?: number; offset?: [number, number]}[]; paper: string; period?: number; grain?: number; drift?: number; gain?: number; sharp?: number}
  /** CMYK rosette: four angled screens (C 15°, M 75°, Y 0°, K 45°) overprinted on paper */
  | {type: 'cmyk'; size: number; paper?: string; angles?: [number, number, number, number]; offset?: number; black?: number}
  | {type: 'misregister'; dx: number; dy: number; color: string; opacity?: number}
  /** cross-hatching by luminance bands: each family switches on below its `from` luminance; widths swell with tone */
  | {type: 'hatch'; gap: number; ink: string; paper?: string; families?: {angle: number; from: number; max?: number}[]; invert?: boolean; boil?: number; sharp?: number}
  /** colour fill printed off-register from its ink line (1950s cel / riso cartoon) */
  | {type: 'celRegister'; dx: number; dy: number; jitter?: number; ink?: string; strength?: number; width?: number; breaks?: number}
  | {type: 'stickerBorder'; width: number; color?: string; edge?: string; shadow?: number}
  /** sparse specks: ink voids / pinholes on dark ink, overspray / crachis spatter, dust; `on` gates them by tone */
  | {type: 'specks'; color: string; density: number; size?: number; on?: 'dark' | 'light' | 'all'; at?: number; seed?: number; boil?: number}
  /** tesserae / quarry cells: pixel cells with per-cell tone jitter, grout lines and an optional bevel (mosaic, leaded glass) */
  | {type: 'tiles'; size: number; grout?: number; color?: string; jitter?: number; bevel?: number; keep?: boolean}
  // ---- line / paint / material ----
  | {type: 'edges'; color: string; strength?: number; width?: number}
  /** cel shading: luminance quantised into soft bands (hue kept), detail simplified, optional outline */
  | {type: 'toon'; levels: number; smooth?: number; outline?: string; width?: number; strength?: number; soft?: number}
  | {type: 'wobble'; scale: number; frequency?: number; boil?: number}
  | {type: 'bleed'; radius: number; strength?: number}
  /** pooled-pigment rim: every shape darkens in its own colour just inside its edge (dried watercolour tide line) */
  | {type: 'edgeDarken'; radius: number; strength?: number; gain?: number}
  /** vein network from turbulence zero-lines: craquelure, mud-resist crackle (multiply), or caustic light webs (screen) */
  | {type: 'crackle'; scale: number; amount: number; color?: string; width?: number; mode?: 'multiply' | 'screen'; seed?: number; boil?: number}
  /** embossed relief from luminance (+ optional noise) lit by a distant light: paper cut layers, impasto, gesso */
  | {type: 'relief'; strength: number; azimuth?: number; elevation?: number; blur?: number; noise?: {freq: number | [number, number]; amount: number}; amount?: number}
  /** paper tooth: wax / pastel / dry-brush breaks up on the grain, paper shows through */
  | {type: 'tooth'; amount: number; freq?: number | [number, number]; paper: string; seed?: number; boil?: number}
  /** generic noise texture blended over the frame (wood grain, roller streaks, canvas, mottling) */
  | {type: 'texture'; freq: number | [number, number]; amount: number; mode?: 'multiply' | 'screen' | 'overlay' | 'soft-light'; octaves?: number; seed?: number; boil?: number; color?: string}
  | {type: 'grain'; amount: number; size?: number}
  | {type: 'tint'; color: string; mode?: 'multiply' | 'screen'; amount?: number}
  // ---- optics / screen ----
  | {type: 'pixelate'; size: number}
  | {type: 'blur'; radius: number}
  | {type: 'glow'; radius: number; amount?: number}
  /** threshold-gated glow: only pixels brighter than `threshold` bloom (two scales), optional tint (halation) */
  | {type: 'bloom'; radius: number; threshold?: number; amount?: number; tint?: string; streak?: number}
  /** lateral chromatic aberration: red one way, blue the other */
  | {type: 'chroma'; dx: number; dy?: number}
  /** blur outside a horizontal band (miniature / tilt-shift) */
  | {type: 'tiltShift'; blur: number; center?: number; band?: number; feather?: number}
  /** VHS signal: per-line time-base jitter, a rolling tracking band, chroma bleed to the right, edge ringing */
  | {type: 'tape'; jitter?: number; band?: number; bleed?: number; shift?: number; sharpen?: number}
  /** film gate weave: the whole picture drifts a pixel or two, with a rare frame jump */
  | {type: 'weave'; amount: number; jump?: number}
  /** character cells: luminance → glyph density ramp ( .:-+=*%#@) on a monospace grid */
  | {type: 'ascii'; cell?: number; ink?: string | 'source'; paper?: string; invert?: boolean | 'auto'; gain?: number; gamma?: number};

export interface StyleOverlays {
  /** paper / canvas colour multiplied over the frame (0..1 strength); kind picks the surface */
  paper?: {color: string; amount: number; fiber?: number; kind?: 'fiber' | 'laid' | 'rice' | 'cold-press' | 'mottle' | 'canvas' | 'kraft'};
  vignette?: {amount: number; color?: string};
  scanlines?: {gap: number; opacity: number};
  letterbox?: {aspect: number; color?: string};
  /** ragged printed / torn border (freq: lower = bigger bites, e.g. 0.012 for a frayed sketchbook paint edge) */
  deckle?: {color: string; size: number; freq?: number};
  /** shaped light: spot (follow spot / telestrator), band (travelling window light), blinds (slat shadows), window
   *  (hard sun parallelogram), mist (kasumi / fog bands), foot (stage footlights). x / y in 0..1, size 0..1 of the frame */
  light?: {kind: 'spot' | 'band' | 'blinds' | 'window' | 'mist' | 'foot'; color?: string; amount?: number; dark?: number; x?: number; y?: number; size?: number; angle?: number; speed?: number; gap?: number};
  /** camcorder / deck on-screen display: blinking REC or PLAY, tape counter, date stamp */
  osd?: {kind?: 'rec' | 'play'; color?: string; date?: string; size?: number};
  /** thin inset frame line */
  frameLine?: {color: string; inset: number; width?: number};
  /** animated film grain (re-seeded every 2 frames) */
  filmGrain?: number;
  /** soft drifting light leak (one or two colours) */
  leak?: {color: string; amount: number; color2?: string; drift?: number; at?: 'tl' | 'tr' | 'bl' | 'br'};
  /** CRT glass: rounded screen in a bezel, edge darkening, glare, rolling bar, flicker, RGB aperture grille */
  crt?: {radius?: number; bezel?: string; glare?: number; roll?: number; flicker?: number; grille?: number; inner?: number};
  /** VHS tape noise: snow, white dropout lines, head-switching band at the bottom */
  vhs?: {noise?: number; dropouts?: number; headSwitch?: number};
  /** projected film print damage: flicker, vertical scratches, dust, hair */
  filmDamage?: {flicker?: number; scratches?: number; dust?: number; hair?: number; burn?: number};
  /** pillarbox / window the picture to an aspect (4:3 TV, 1.37 Academy) with rounded corners */
  gate?: {aspect: number; radius?: number; color?: string; shadow?: number};
  /** passe-partout mat around the picture with a bevel line */
  mat?: {color: string; size: number; line?: string; shadow?: number};
  /** drafting / chart grid laid over the frame */
  grid?: {gap: number; color: string; opacity?: number; kind?: 'square' | 'dot' | 'iso'; major?: number};
  /** slow diagonal sheen sliding across (glass, enamel, gold) */
  sheen?: {amount: number; color?: string; speed?: number; angle?: number};
}

export interface StyleDef {
  id: string;
  name: string;
  family: 'print' | 'paint' | 'drawing' | 'screen' | 'photo' | 'craft' | 'graphic' | 'retro' | 'technical';
  description: string;
  /** what it suits, for agents */
  useFor: string;
  palette: {bg: string; paper: string; ink: string; accent: string; accent2?: string; swatches: string[]};
  steps: FilterStep[];
  overlays?: StyleOverlays;
  /** hold every drawing N frames (2 = "on twos", 12 fps feel at 24 fps) */
  step?: number;
  fonts?: {display: string; body: string; mono?: string};
  tags: string[];
  /** where the idea comes from (repo/path + licence, or "original") */
  source?: string;
  /** keep the motion's own transparency (no bg under the filter): for stickers / overlays; bg is painted behind */
  cutout?: boolean;
  /** motions / moves that show the style best (agents) */
  signature?: string[];
  /** what breaks the look (agents) */
  avoid?: string[];
  /** styles that look similar — pick deliberately */
  confusableWith?: string[];
  /** timing rules in one line (on twos, camera on ones, cuts on beats…) */
  motionRules?: string;
}

type N = React.ReactNode;
interface Ctx {
  u: number;
  frame: number;
  w: number;
  h: number;
  keep: Record<string, string>;
}

const LUMA = '0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0';
const LUMA_ROW = '0.2126 0.7152 0.0722 0 0';
/** rgb = 0, alpha = <row> */
const toAlpha = (row: string) => `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${row}`;
const hex = (s: string): [number, number, number] => {
  const h = s.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return [parseInt(f.slice(0, 2), 16) / 255, parseInt(f.slice(2, 4), 16) / 255, parseInt(f.slice(4, 6), 16) / 255];
};
const table = (ramp: string[], ch: 0 | 1 | 2) => ramp.map((c) => hex(c)[ch].toFixed(4)).join(' ');
const f4 = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(4));
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const triple = (v: number | [number, number, number] | undefined, d: number): [number, number, number] =>
  v === undefined ? [d, d, d] : typeof v === 'number' ? [v, v, v] : v;

// ---------------------------------------------------------------------------------------------------------------
// Screen tiles (halftone dots / line screens at real angles), built from flood rectangles, blurred, and remapped
// through their own CDF so that coverage == tone. A rotated lattice is periodic on an L×L tile when tan(angle) is
// rational (p/q): L = spacing·√(p²+q²).
// ---------------------------------------------------------------------------------------------------------------
interface Tile {
  G: number;
  M: number;
  L: number;
  sigma: number;
  rects: number[][];
  table: string;
}
const ANGLES: [number, number][] = [
  [0, 1], [1, 4], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1], [4, 1], [1, 0], [-1, 4], [-1, 3], [-1, 2], [-1, 1], [-2, 1], [-3, 1], [-4, 1],
];
const pickAngle = (deg: number): [number, number] => {
  let d = ((deg % 180) + 180) % 180;
  if (d > 90) d -= 180;
  let best = ANGLES[0];
  let bd = 1e9;
  for (const a of ANGLES) {
    const ad = (Math.atan2(a[0], a[1]) * 180) / Math.PI;
    const diff = Math.min(Math.abs(ad - d), 180 - Math.abs(ad - d));
    if (diff < bd) {
      bd = diff;
      best = a;
    }
  }
  return best;
};
const tileCache = new Map<string, Tile>();
const makeTile = (kind: 'dot' | 'line', spacing: number, angle: number): Tile => {
  const key = `${kind}|${spacing.toFixed(2)}|${angle}`;
  const hit = tileCache.get(key);
  if (hit) return hit;
  const [p, q] = pickAngle(angle);
  const r = Math.hypot(p, q);
  const L = Math.max(3, Math.round(spacing * r));
  const b = L / r;
  const ux = q / r;
  const uy = p / r;
  const nx = -p / r;
  const ny = q / r;
  const m = kind === 'line' ? Math.max(1, Math.round(b / 1.5)) : 1;
  const a = b / m;
  const sigma = kind === 'dot' ? 0.3 * b : 0.26 * b;
  const s = kind === 'dot' ? Math.max(1, Math.round(0.55 * b)) : Math.max(1, Math.round(0.22 * b));
  const M = Math.ceil(3 * sigma + s);
  const G = L + 2 * M;
  const rects: number[][] = [];
  const seen = new Set<string>();
  const add = (x0: number, y0: number, x1: number, y1: number) => {
    const rx0 = Math.max(0, x0);
    const ry0 = Math.max(0, y0);
    const rx1 = Math.min(G, x1);
    const ry1 = Math.min(G, y1);
    if (rx1 <= rx0 || ry1 <= ry0) return;
    const kk = `${rx0},${ry0},${rx1},${ry1}`;
    if (seen.has(kk)) return;
    seen.add(kk);
    rects.push([rx0, ry0, rx1 - rx0, ry1 - ry0]);
  };
  if (kind === 'line' && (p === 0 || q === 0)) {
    // axis-aligned lines: one rectangle per line
    for (let j = -Math.ceil(G / b) - 1; j <= Math.ceil(G / b) + 1; j++) {
      const c = Math.round(j * b - s / 2) + M;
      if (p === 0) add(0, c, G, c + s);
      else add(c, 0, c + s, G);
    }
  } else {
    const range = Math.ceil((G * 1.5) / Math.min(a, b)) + 2;
    for (let i = -range; i <= range; i++)
      for (let j = -range; j <= range; j++) {
        const x = i * a * ux + j * b * nx;
        const y = i * a * uy + j * b * ny;
        if (x < -M - s || x > L + M || y < -M - s || y > L + M) continue;
        const rx = Math.round(x - s / 2) + M;
        const ry = Math.round(y - s / 2) + M;
        add(rx, ry, rx + s, ry + s);
      }
  }
  // rasterise + gaussian blur in JS to predict the screen values, then build the CDF remap table
  const img = new Float32Array(G * G);
  for (const [x, y, w2, h2] of rects) for (let yy = y; yy < y + h2; yy++) for (let xx = x; xx < x + w2; xx++) img[yy * G + xx] = 1;
  const rad = Math.ceil(3 * sigma);
  const ker: number[] = [];
  let ks = 0;
  for (let i = -rad; i <= rad; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    ker.push(v);
    ks += v;
  }
  for (let i = 0; i < ker.length; i++) ker[i] /= ks;
  const tmp = new Float32Array(G * G);
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      let acc = 0;
      for (let i = -rad; i <= rad; i++) {
        const xx = x + i;
        if (xx >= 0 && xx < G) acc += img[y * G + xx] * ker[i + rad];
      }
      tmp[y * G + x] = acc;
    }
  const vals: number[] = [];
  for (let y = M; y < M + L; y++)
    for (let x = M; x < M + L; x++) {
      let acc = 0;
      for (let i = -rad; i <= rad; i++) {
        const yy = y + i;
        if (yy >= 0 && yy < G) acc += tmp[yy * G + x] * ker[i + rad];
      }
      vals.push(acc);
    }
  vals.sort((x, y) => x - y);
  const K = 48;
  const n = vals.length;
  const cdf = (x: number) => {
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (vals[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo / n;
  };
  const tbl = Array.from({length: K}, (_, k) => cdf(k / (K - 1)).toFixed(4)).join(' ');
  const t: Tile = {G, M, L, sigma, rects, table: tbl};
  tileCache.set(key, t);
  return t;
};

/** full-frame tiled screen, grey 0..1 (uniformly distributed), opaque; result = id */
const screenNodes = (t: Tile, id: string): N[] => {
  const nodes: N[] = [];
  nodes.push(<feFlood key={id + 'z'} x={0} y={0} width={t.G} height={t.G} floodColor="#000" result={id + 'z'} />);
  t.rects.forEach((q, i) => nodes.push(<feFlood key={id + 'f' + i} x={q[0]} y={q[1]} width={q[2]} height={q[3]} floodColor="#fff" result={id + 'f' + i} />));
  nodes.push(
    <feMerge key={id + 'm'} x={0} y={0} width={t.G} height={t.G} result={id + 'm'}>
      <feMergeNode in={id + 'z'} />
      {t.rects.map((_, i) => (
        <feMergeNode key={i} in={id + 'f' + i} />
      ))}
    </feMerge>,
  );
  nodes.push(<feGaussianBlur key={id + 'b'} in={id + 'm'} stdDeviation={t.sigma} x={0} y={0} width={t.G} height={t.G} result={id + 'b'} />);
  nodes.push(
    <feComponentTransfer key={id + 'r'} in={id + 'b'} x={t.M} y={t.M} width={t.L} height={t.L} result={id + 'r'}>
      <feFuncR type="table" tableValues={t.table} />
      <feFuncG type="table" tableValues={t.table} />
      <feFuncB type="table" tableValues={t.table} />
      <feFuncA type="table" tableValues="1 1" />
    </feComponentTransfer>,
  );
  nodes.push(<feTile key={id} in={id + 'r'} result={id} />);
  return nodes;
};

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** 4×4 ordered-dither threshold map, cell px per entry, grey (b+0.5)/16, tiled; result = id */
const bayerNodes = (cell: number, id: string): N[] => {
  const c = Math.max(1, Math.round(cell));
  const nodes: N[] = [];
  BAYER4.forEach((b, i) => {
    const g = Math.round(((b + 0.5) / 16) * 255);
    nodes.push(<feFlood key={id + i} x={(i % 4) * c} y={Math.floor(i / 4) * c} width={c} height={c} floodColor={`rgb(${g},${g},${g})`} result={id + 'f' + i} />);
  });
  nodes.push(
    <feMerge key={id + 'm'} x={0} y={0} width={4 * c} height={4 * c} result={id + 'm'}>
      {BAYER4.map((_, i) => (
        <feMergeNode key={i} in={id + 'f' + i} />
      ))}
    </feMerge>,
  );
  nodes.push(<feTile key={id} in={id + 'm'} result={id} />);
  return nodes;
};

/** opaque grey fractal noise, contrast-stretched (rgb = noise, alpha = 1); result = id */
const noiseNodes = (id: string, freq: number | [number, number], octaves: number, seed: number, u: number, stretch = 1.6): N[] => {
  const [fx, fy] = typeof freq === 'number' ? [freq, freq] : freq;
  const s = stretch;
  const o = 0.5 - 0.5 * s;
  return [
    <feTurbulence key={id + 't'} type="fractalNoise" baseFrequency={`${f4(fx / Math.max(0.35, u))} ${f4(fy / Math.max(0.35, u))}`} numOctaves={octaves} seed={seed} result={id + 't'} />,
    <feColorMatrix key={id} in={id + 't'} type="matrix" values={`${s} 0 0 0 ${o}  ${s} 0 0 0 ${o}  ${s} 0 0 0 ${o}  0 0 0 0 1`} result={id} />,
  ];
};

/** ascii glyphs 5×7 for the density ramp " .:-+=*%#@" */
const GLYPHS: string[][] = [
  ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  ['.....', '.....', '.....', '.....', '.....', '..#..', '..#..'],
  ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
  ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  ['.....', '..#..', '#.#.#', '.###.', '#.#.#', '..#..', '.....'],
  ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
  ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.####'],
];

/** rectangle runs of one glyph, in glyph pixels */
const glyphRuns = (g: string[]) => {
  const runs: [number, number, number][] = [];
  g.forEach((row, y) => {
    let x = 0;
    while (x < 5) {
      if (row[x] === '#') {
        let e = x;
        while (e < 5 && row[e] === '#') e++;
        runs.push([x, y, e - x]);
        x = e;
      } else x++;
    }
  });
  return runs;
};

// accent hue basis: chroma direction c of the target colour and its perpendicular p in the chroma plane
const accentRows = (color: string, range = 28, minSat = 0.18, soft = 9) => {
  const t = hex(color);
  const mean = (t[0] + t[1] + t[2]) / 3;
  let c = t.map((v) => v - mean);
  let n = Math.hypot(c[0], c[1], c[2]);
  if (n < 1e-3) {
    c = [2 / 3, -1 / 3, -1 / 3];
    n = Math.hypot(c[0], c[1], c[2]);
  }
  c = c.map((v) => v / n);
  const g = 1 / Math.sqrt(3);
  const p = [g * c[2] - g * c[1], g * c[0] - g * c[2], g * c[1] - g * c[0]];
  const pn = Math.hypot(p[0], p[1], p[2]) || 1;
  const pp = p.map((v) => v / pn);
  const kr = 1 / Math.tan((Math.max(4, Math.min(85, range)) * Math.PI) / 180);
  const row = (sign: number) => `${f4(soft * (c[0] + sign * kr * pp[0]))} ${f4(soft * (c[1] + sign * kr * pp[1]))} ${f4(soft * (c[2] + sign * kr * pp[2]))} 0 ${f4(-soft * minSat)}`;
  return {a: row(-1), b: row(1)};
};

/** mean luminance of the frame (blurred luma sampled at five points, averaged), tiled over the whole frame; result = id */
const meanNodes = (src: string, id: string, ctx: Ctx): N[] => {
  const pts: [number, number][] = [[0.5, 0.5], [0.25, 0.28], [0.75, 0.28], [0.25, 0.72], [0.75, 0.72]];
  const nodes: N[] = [
    <feColorMatrix key={id + 'l'} in={src} type="matrix" values={`${LUMA_ROW}  ${LUMA_ROW}  ${LUMA_ROW}  0 0 0 0 1`} result={id + 'l'} />,
    <feGaussianBlur key={id + 'b'} in={id + 'l'} stdDeviation={Math.round(ctx.h / 9)} edgeMode="duplicate" result={id + 'b'} />,
  ];
  pts.forEach(([px, py], i) => {
    nodes.push(<feOffset key={id + 'p' + i} in={id + 'b'} dx={0} dy={0} x={Math.round(ctx.w * px)} y={Math.round(ctx.h * py)} width={1} height={1} result={id + 'p' + i} />);
    nodes.push(<feTile key={id + 't' + i} in={id + 'p' + i} result={id + 't' + i} />);
  });
  // (p1+p2)/2, (p3+p4)/2 -> quarter mean, then 0.8 ring + 0.2 centre
  nodes.push(<feComposite key={id + 'a'} in={id + 't1'} in2={id + 't2'} operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result={id + 'a'} />);
  nodes.push(<feComposite key={id + 'c'} in={id + 't3'} in2={id + 't4'} operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result={id + 'c'} />);
  nodes.push(<feComposite key={id + 'r'} in={id + 'a'} in2={id + 'c'} operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result={id + 'r'} />);
  nodes.push(<feComposite key={id + 'm'} in={id + 'r'} in2={id + 't0'} operator="arithmetic" k1="0" k2="0.8" k3="0.2" k4="0" result={id + 'm'} />);
  nodes.push(
    <feComponentTransfer key={id} in={id + 'm'} result={id}>
      <feFuncA type="table" tableValues="1 1" />
    </feComponentTransfer>,
  );
  return nodes;
};

/** alpha = 1 when the frame mean is above (want 'dark') / below (want 'light') the threshold */
const flipMaskNodes = (mean: string, id: string, want: 'dark' | 'light', thr: number): N[] => {
  const n = 40;
  const cut = Math.round(thr * n);
  const tv = Array.from({length: n}, (_, j) => ((want === 'dark' ? j >= cut : j < cut) ? '1' : '0')).join(' ');
  return [
    <feColorMatrix key={id + 'a'} in={mean} type="matrix" values={toAlpha('1 0 0 0 0')} result={id + 'a'} />,
    <feComponentTransfer key={id} in={id + 'a'} result={id}>
      <feFuncA type="discrete" tableValues={tv} />
    </feComponentTransfer>,
  ];
};

const accentKeepNodes = (prev: string, s: {color: string; range?: number; minSat?: number; soft?: number}, k: (n: string) => string): {nodes: N[]; keep: string} => {
  if (s.color === 'any') {
    // union of six hue sectors
    const hues = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
    const nodes: N[] = [];
    hues.forEach((hc, j) => {
      const rows = accentRows(hc, 31, s.minSat ?? 0.3, s.soft);
      nodes.push(<feColorMatrix key={k('xa' + j)} in={prev} type="matrix" values={toAlpha(rows.a)} result={k('xa' + j)} />);
      nodes.push(<feColorMatrix key={k('xb' + j)} in={prev} type="matrix" values={toAlpha(rows.b)} result={k('xb' + j)} />);
      nodes.push(<feComposite key={k('xm' + j)} in={k('xa' + j)} in2={k('xb' + j)} operator="in" result={k('xm' + j)} />);
    });
    nodes.push(
      <feMerge key={k('am')} result={k('am')}>
        {hues.map((_, j) => (
          <feMergeNode key={j} in={k('xm' + j)} />
        ))}
      </feMerge>,
    );
    nodes.push(<feComposite key={k('keep')} in={prev} in2={k('am')} operator="in" result={k('keep')} />);
    return {keep: k('keep'), nodes};
  }
  const rows = accentRows(s.color, s.range, s.minSat, s.soft);
  return {
    keep: k('keep'),
    nodes: [
      <feColorMatrix key={k('aa')} in={prev} type="matrix" values={toAlpha(rows.a)} result={k('aa')} />,
      <feColorMatrix key={k('ab')} in={prev} type="matrix" values={toAlpha(rows.b)} result={k('ab')} />,
      <feComposite key={k('am')} in={k('aa')} in2={k('ab')} operator="in" result={k('am')} />,
      <feComposite key={k('keep')} in={prev} in2={k('am')} operator="in" result={k('keep')} />,
    ],
  };
};

const accentRestoreNodes = (prev: string, keep: string, s: {recolor?: string; saturate?: number; amount?: number}, k: (n: string) => string, r: string): N[] => {
  const nodes: N[] = [];
  let src = keep;
  if (s.recolor) {
    nodes.push(<feFlood key={k('rf')} floodColor={s.recolor} result={k('rf')} />);
    nodes.push(<feComposite key={k('rc')} in={k('rf')} in2={keep} operator="in" result={k('rc')} />);
    src = k('rc');
  } else if (s.saturate && s.saturate !== 1) {
    nodes.push(<feColorMatrix key={k('rs')} in={keep} type="saturate" values={String(s.saturate)} result={k('rs')} />);
    src = k('rs');
  }
  if (s.amount !== undefined && s.amount < 1) {
    nodes.push(
      <feComponentTransfer key={k('ro')} in={src} result={k('ro')}>
        <feFuncA type="linear" slope={s.amount} />
      </feComponentTransfer>,
    );
    src = k('ro');
  }
  nodes.push(<feComposite key={r} in={src} in2={prev} operator="over" result={r} />);
  return nodes;
};

/** least-squares inverse of the ink absorbance matrix (3 channels × n inks), small ridge for stability */
const inkInverse = (inks: [number, number, number][]): number[][] => {
  const n = inks.length;
  const A = [0, 1, 2].map((c) => inks.map((t) => -Math.log(Math.max(0.035, t[c]))));
  const AtA = Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => A.reduce((s, row) => s + row[i] * row[j], 0) + (i === j ? 1e-3 : 0)));
  // gauss-jordan
  const inv = AtA.map((row, i) => [...row, ...Array.from({length: n}, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let piv = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(inv[r][i]) > Math.abs(inv[piv][i])) piv = r;
    [inv[i], inv[piv]] = [inv[piv], inv[i]];
    const d = inv[i][i] || 1e-6;
    for (let j = 0; j < 2 * n; j++) inv[i][j] /= d;
    for (let r = 0; r < n; r++)
      if (r !== i) {
        const f = inv[r][i];
        for (let j = 0; j < 2 * n; j++) inv[r][j] -= f * inv[i][j];
      }
  }
  const Ai = inv.map((row) => row.slice(n));
  // W = (AtA)^-1 At  -> n × 3
  return Ai.map((row) => [0, 1, 2].map((c) => row.reduce((s, v, j) => s + v * A[c][j], 0)));
};

/** one ink plate: density (alpha) -> optional offset -> screen compare -> grain -> white→ink image; returns result id */
const plateNodes = (
  densAlpha: string,
  ink: string,
  o: {angle: number; period: number; dx: number; dy: number; sharp: number; tex?: string},
  id: string,
): {nodes: N[]; out: string} => {
  const nodes: N[] = [];
  let d = densAlpha;
  if (o.dx || o.dy) {
    nodes.push(<feOffset key={id + 'o'} in={d} dx={o.dx} dy={o.dy} result={id + 'o'} />);
    d = id + 'o';
  }
  let m: string;
  if (o.period > 0) {
    const t = makeTile('dot', o.period, o.angle);
    nodes.push(...screenNodes(t, id + 's'));
    nodes.push(<feColorMatrix key={id + 'sa'} in={id + 's'} type="matrix" values={toAlpha('1 0 0 0 0')} result={id + 'sa'} />);
    const K = Math.max(2, o.period * 0.55) * o.sharp;
    // ink where density + screen > 1
    nodes.push(<feComposite key={id + 'm'} in={d} in2={id + 'sa'} operator="arithmetic" k1="0" k2={f4(K)} k3={f4(K)} k4={f4(0.5 - K)} result={id + 'm'} />);
    m = id + 'm';
  } else {
    const K = 7 * o.sharp;
    nodes.push(
      <feComponentTransfer key={id + 'm'} in={d} result={id + 'm'}>
        <feFuncA type="linear" slope={f4(K)} intercept={f4(0.5 - 0.5 * K)} />
      </feComponentTransfer>,
    );
    m = id + 'm';
  }
  if (o.tex) {
    nodes.push(<feComposite key={id + 'g'} in={m} in2={o.tex} operator="in" result={id + 'g'} />);
    m = id + 'g';
  }
  nodes.push(<feFlood key={id + 'w'} floodColor="#fff" result={id + 'w'} />);
  nodes.push(<feFlood key={id + 'c'} floodColor={ink} result={id + 'c'} />);
  nodes.push(<feComposite key={id + 'i'} in={id + 'c'} in2={m} operator="in" result={id + 'i'} />);
  nodes.push(<feComposite key={id + 'p'} in={id + 'i'} in2={id + 'w'} operator="over" result={id + 'p'} />);
  return {nodes, out: id + 'p'};
};

/** builds the <filter> primitives for a step list; each step reads `prev` and writes a new result */
const buildSteps = (steps: FilterStep[], ctx: Ctx): {nodes: React.ReactNode[]; last: string} => {
  const {u, frame} = ctx;
  const out: React.ReactNode[] = [];
  let prev = 'SourceGraphic';
  steps.forEach((s, i) => {
    const r = `s${i}`;
    const k = (n: string) => `${r}${n}`;
    let next = r;
    switch (s.type) {
      case 'saturate':
        out.push(<feColorMatrix key={r} in={prev} type="saturate" values={String(s.value)} result={r} />);
        break;
      case 'hue':
        out.push(<feColorMatrix key={r} in={prev} type="hueRotate" values={String(s.deg)} result={r} />);
        break;
      case 'invert':
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="table" tableValues="1 0" />
            <feFuncG type="table" tableValues="1 0" />
            <feFuncB type="table" tableValues="1 0" />
          </feComponentTransfer>,
        );
        break;
      case 'autoInvert': {
        out.push(...meanNodes(prev, k('mn'), ctx));
        out.push(...flipMaskNodes(k('mn'), k('fm'), s.want ?? 'dark', s.threshold ?? 0.5));
        // luminance flip that keeps hue: x + 1 - 2L = x + 2(1-L) - 1 (keeps every alpha term non-negative)
        out.push(<feColorMatrix key={k('il')} in={prev} type="matrix" values={`${'-0.2126 -0.7152 -0.0722 0 1  '.repeat(3)}0 0 0 0 1`} result={k('il')} />);
        out.push(<feComposite key={k('iv')} in={prev} in2={k('il')} operator="arithmetic" k1="0" k2="1" k3="2" k4="-1" result={k('iv')} />);
        out.push(
          <feComponentTransfer key={k('iva')} in={k('iv')} result={k('iva')}>
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>,
        );
        out.push(<feComposite key={k('ivm')} in={k('iva')} in2={k('fm')} operator="in" result={k('ivm')} />);
        out.push(<feComposite key={r} in={k('ivm')} in2={prev} operator="over" result={r} />);
        break;
      }
      case 'contrast': {
        const m = s.mid ?? 0.5;
        const sl = s.value;
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="linear" slope={sl} intercept={m - m * sl} />
            <feFuncG type="linear" slope={sl} intercept={m - m * sl} />
            <feFuncB type="linear" slope={sl} intercept={m - m * sl} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'brightness':
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="linear" slope={s.value} />
            <feFuncG type="linear" slope={s.value} />
            <feFuncB type="linear" slope={s.value} />
          </feComponentTransfer>,
        );
        break;
      case 'curve': {
        const pv = s.pivot ?? 0.5;
        const a = Math.max(0, Math.min(1, s.amount));
        const sig = (x: number) => 1 / (1 + Math.exp(-8 * (x - pv)));
        const s0 = sig(0);
        const s1 = sig(1);
        const t = Array.from({length: 33}, (_, j) => {
          const x = j / 32;
          const y = (sig(x) - s0) / (s1 - s0);
          return f4(x + (y - x) * a);
        }).join(' ');
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="table" tableValues={t} />
            <feFuncG type="table" tableValues={t} />
            <feFuncB type="table" tableValues={t} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'grade': {
        const sat = s.sat ?? 1;
        const t = s.temp ?? 0;
        const ti = s.tint ?? 0;
        const gain = triple(s.gain, 1).map((g, c) => g * (c === 0 ? 1 + 0.12 * t : c === 2 ? 1 - 0.12 * t : 1 - 0.06 * ti));
        const lift = triple(s.lift, 0);
        // saturation matrix (luma-weighted) then per-channel gain and lift: out = x*gain*(1-lift) + lift
        const lr = 0.2126;
        const lg = 0.7152;
        const lb = 0.0722;
        const S = [
          [lr + (1 - lr) * sat, lg - lg * sat, lb - lb * sat],
          [lr - lr * sat, lg + (1 - lg) * sat, lb - lb * sat],
          [lr - lr * sat, lg - lg * sat, lb + (1 - lb) * sat],
        ];
        const rows = [0, 1, 2]
          .map((c) => {
            const g = gain[c] * (1 - lift[c]);
            return `${f4(S[c][0] * g)} ${f4(S[c][1] * g)} ${f4(S[c][2] * g)} 0 ${f4(lift[c])}`;
          })
          .join('  ');
        if (s.gamma && s.gamma !== 1) {
          out.push(<feColorMatrix key={k('m')} in={prev} type="matrix" values={`${rows}  0 0 0 1 0`} result={k('m')} />);
          const e = f4(1 / s.gamma);
          out.push(
            <feComponentTransfer key={r} in={k('m')} result={r}>
              <feFuncR type="gamma" amplitude="1" exponent={e} offset="0" />
              <feFuncG type="gamma" amplitude="1" exponent={e} offset="0" />
              <feFuncB type="gamma" amplitude="1" exponent={e} offset="0" />
            </feComponentTransfer>,
          );
        } else out.push(<feColorMatrix key={r} in={prev} type="matrix" values={`${rows}  0 0 0 1 0`} result={r} />);
        break;
      }
      case 'posterize': {
        const n = Math.max(2, s.levels);
        const t = Array.from({length: n}, (_, j) => (j / (n - 1)).toFixed(3)).join(' ');
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="discrete" tableValues={t} />
            <feFuncG type="discrete" tableValues={t} />
            <feFuncB type="discrete" tableValues={t} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'duotone':
      case 'gradientMap': {
        const ramp = s.type === 'duotone' ? s.colors : s.ramp;
        const type = s.type === 'gradientMap' && s.discrete ? 'discrete' : 'table';
        out.push(<feColorMatrix key={k('l')} in={prev} type="matrix" values={LUMA} result={k('l')} />);
        out.push(
          <feComponentTransfer key={r} in={k('l')} result={r}>
            <feFuncR type={type} tableValues={table(ramp, 0)} />
            <feFuncG type={type} tableValues={table(ramp, 1)} />
            <feFuncB type={type} tableValues={table(ramp, 2)} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'threshold': {
        const steps2 = 40;
        const cut = Math.round(s.at * steps2);
        const col = (c: string, ch: 0 | 1 | 2) => hex(c)[ch].toFixed(4);
        const tv = (ch: 0 | 1 | 2) => Array.from({length: steps2}, (_, j) => (j < cut ? col(s.ink, ch) : col(s.paper, ch))).join(' ');
        out.push(<feColorMatrix key={k('l')} in={prev} type="matrix" values={LUMA} result={k('l')} />);
        let src = k('l');
        if (s.jitter) {
          // ragged knife edge: low-frequency noise added to luminance before the cut
          out.push(...noiseNodes(k('n'), s.jitterFreq ?? 0.02, 2, 7, u));
          out.push(<feComposite key={k('j')} in={k('l')} in2={k('n')} operator="arithmetic" k1="0" k2="1" k3={f4(s.jitter)} k4={f4(-s.jitter / 2)} result={k('j')} />);
          src = k('j');
        }
        out.push(
          <feComponentTransfer key={r} in={src} result={r}>
            <feFuncR type="discrete" tableValues={tv(0)} />
            <feFuncG type="discrete" tableValues={tv(1)} />
            <feFuncB type="discrete" tableValues={tv(2)} />
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>,
        );
        break;
      }
      case 'chromaKeep': {
        const a = s.amount;
        const row = (c: number) => [0, 1, 2].map((j) => f4(a * ((c === j ? 1 : 0) - [0.2126, 0.7152, 0.0722][j]))).join(' ');
        out.push(<feColorMatrix key={k('c')} in="SourceGraphic" type="matrix" values={`${row(0)} 0 0.5  ${row(1)} 0 0.5  ${row(2)} 0 0.5  0 0 0 0 1`} result={k('c')} />);
        out.push(<feComposite key={r} in={prev} in2={k('c')} operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" result={r} />);
        break;
      }
      case 'accentKeep': {
        const a = accentKeepNodes(prev, s, k);
        out.push(...a.nodes);
        ctx.keep.accent = a.keep;
        next = prev;
        break;
      }
      case 'accentRestore': {
        const keep = ctx.keep.accent;
        if (!keep) {
          next = prev;
          break;
        }
        out.push(...accentRestoreNodes(prev, keep, s, k, r));
        break;
      }
      case 'accentIsolate': {
        const a = accentKeepNodes(prev, s, k);
        out.push(...a.nodes);
        let rest: string;
        if (s.ramp?.length) {
          out.push(<feColorMatrix key={k('l')} in={prev} type="matrix" values={LUMA} result={k('l')} />);
          out.push(
            <feComponentTransfer key={k('g')} in={k('l')} result={k('g')}>
              <feFuncR type="table" tableValues={table(s.ramp, 0)} />
              <feFuncG type="table" tableValues={table(s.ramp, 1)} />
              <feFuncB type="table" tableValues={table(s.ramp, 2)} />
            </feComponentTransfer>,
          );
          rest = k('g');
        } else {
          out.push(<feColorMatrix key={k('g')} in={prev} type="saturate" values="0" result={k('g')} />);
          rest = k('g');
        }
        out.push(...accentRestoreNodes(rest, a.keep, {recolor: s.recolor, saturate: s.saturate ?? 1.15}, k, r));
        break;
      }
      case 'palette': {
        const cols = s.colors.slice(0, 8).map(hex);
        const n = cols.length;
        if (n < 2) {
          out.push(<feFlood key={r} floodColor={s.colors[0] ?? '#000'} result={r} />);
          break;
        }
        let src = prev;
        if (s.dither) {
          out.push(...bayerNodes((s.cell ?? 2) * u, k('by')));
          out.push(<feComposite key={k('d')} in={prev} in2={k('by')} operator="arithmetic" k1="0" k2="1" k3={f4(s.dither)} k4={f4(-s.dither / 2)} result={k('d')} />);
          src = k('d');
        }
        const W = [0.3, 0.5, 0.2];
        const G = 40;
        const pairs: [number, number][] = [];
        for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) pairs.push([a, b]);
        // binary tests, 3 per image: 1 where colour a is closer than colour b
        const tests: string[] = [];
        for (let t = 0; t * 3 < pairs.length; t++) {
          const rows = [0, 1, 2]
            .map((ch) => {
              const pr = pairs[t * 3 + ch];
              if (!pr) return '0 0 0 0 0';
              const [a, b] = pr;
              const ca = cols[a];
              const cb = cols[b];
              const co = [0, 1, 2].map((c) => f4(-2 * G * W[c] * (cb[c] - ca[c])));
              const cst = 0.5 + G * [0, 1, 2].reduce((acc, c) => acc + W[c] * (cb[c] * cb[c] - ca[c] * ca[c]), 0);
              return `${co.join(' ')} 0 ${f4(cst)}`;
            })
            .join('  ');
          out.push(<feColorMatrix key={k('tm' + t)} in={src} type="matrix" values={`${rows}  0 0 0 0 1`} result={k('tm' + t)} />);
          out.push(
            <feComponentTransfer key={k('t' + t)} in={k('tm' + t)} result={k('t' + t)}>
              <feFuncR type="discrete" tableValues="0 1" />
              <feFuncG type="discrete" tableValues="0 1" />
              <feFuncB type="discrete" tableValues="0 1" />
            </feComponentTransfer>,
          );
          tests.push(k('t' + t));
        }
        // scores: each colour wins all its n-1 comparisons -> score 1
        const scores: string[] = [];
        const inv = 1 / (n - 1);
        for (let g = 0; g * 3 < n; g++) {
          const partials: string[] = [];
          tests.forEach((tn, t) => {
            const rows = [0, 1, 2]
              .map((slot) => {
                const ci = g * 3 + slot;
                if (ci >= n) return '0 0 0 0 0';
                const co = [0, 0, 0];
                let cst = 0;
                for (let ch = 0; ch < 3; ch++) {
                  const pr = pairs[t * 3 + ch];
                  if (!pr) continue;
                  if (pr[0] === ci) co[ch] += inv;
                  else if (pr[1] === ci) {
                    co[ch] -= inv;
                    cst += inv;
                  }
                }
                return `${f4(co[0])} ${f4(co[1])} ${f4(co[2])} 0 ${f4(cst)}`;
              })
              .join('  ');
            out.push(<feColorMatrix key={k(`p${g}_${t}`)} in={tn} type="matrix" values={`${rows}  0 0 0 0 1`} result={k(`p${g}_${t}`)} />);
            partials.push(k(`p${g}_${t}`));
          });
          let acc = partials[0];
          for (let t = 1; t < partials.length; t++) {
            out.push(<feComposite key={k(`q${g}_${t}`)} in={acc} in2={partials[t]} operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result={k(`q${g}_${t}`)} />);
            acc = k(`q${g}_${t}`);
          }
          const nn = 2 * (n - 1);
          const tv = Array.from({length: nn}, (_, j) => (j === nn - 1 ? '1' : '0')).join(' ');
          out.push(
            <feComponentTransfer key={k('w' + g)} in={acc} result={k('w' + g)}>
              <feFuncR type="discrete" tableValues={tv} />
              <feFuncG type="discrete" tableValues={tv} />
              <feFuncB type="discrete" tableValues={tv} />
            </feComponentTransfer>,
          );
          scores.push(k('w' + g));
        }
        const layers: string[] = [];
        cols.forEach((_, ci) => {
          const g = Math.floor(ci / 3);
          const slot = ci % 3;
          const row = ['1 0 0 0 0', '0 1 0 0 0', '0 0 1 0 0'][slot];
          out.push(<feColorMatrix key={k('ma' + ci)} in={scores[g]} type="matrix" values={toAlpha(row)} result={k('ma' + ci)} />);
          out.push(<feFlood key={k('fc' + ci)} floodColor={s.colors[ci]} result={k('fc' + ci)} />);
          out.push(<feComposite key={k('lc' + ci)} in={k('fc' + ci)} in2={k('ma' + ci)} operator="in" result={k('lc' + ci)} />);
          layers.push(k('lc' + ci));
        });
        out.push(
          <feMerge key={r} result={r}>
            {layers.map((l) => (
              <feMergeNode key={l} in={l} />
            ))}
          </feMerge>,
        );
        break;
      }
      case 'dither': {
        const lv = Math.max(2, s.levels);
        const spread = s.spread ?? 1 / (lv - 1);
        out.push(...bayerNodes((s.cell ?? 2) * u, k('by')));
        out.push(<feComposite key={k('d')} in={prev} in2={k('by')} operator="arithmetic" k1="0" k2="1" k3={f4(spread)} k4={f4(-spread / 2)} result={k('d')} />);
        const t = Array.from({length: lv}, (_, j) => (j / (lv - 1)).toFixed(3)).join(' ');
        out.push(
          <feComponentTransfer key={r} in={k('d')} result={r}>
            <feFuncR type="discrete" tableValues={t} />
            <feFuncG type="discrete" tableValues={t} />
            <feFuncB type="discrete" tableValues={t} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'matrix': {
        const v = s.values.map((x) => f4(x));
        const vals = v.length >= 20 ? v.slice(0, 20).join(' ') : `${v.slice(0, 15).join(' ')} 0 0 0 1 0`;
        out.push(<feColorMatrix key={r} in={prev} type="matrix" values={vals} result={r} />);
        break;
      }
      case 'tonemap': {
        const kx = Math.max(0.1, s.exposure);
        const t = Array.from({length: 33}, (_, j) => f4((1 - Math.exp((-kx * j) / 32)) / (1 - Math.exp(-kx)))).join(' ');
        out.push(
          <feComponentTransfer key={r} in={prev} result={r}>
            <feFuncR type="table" tableValues={t} />
            <feFuncG type="table" tableValues={t} />
            <feFuncB type="table" tableValues={t} />
          </feComponentTransfer>,
        );
        break;
      }
      case 'clarity': {
        out.push(<feGaussianBlur key={k('b')} in={prev} stdDeviation={s.radius * u} edgeMode="duplicate" result={k('b')} />);
        out.push(<feComposite key={r} in={prev} in2={k('b')} operator="arithmetic" k1="0" k2={f4(1 + s.amount)} k3={f4(-s.amount)} k4="0" result={r} />);
        break;
      }
      case 'specks': {
        const sz = s.size ?? 2.5;
        const ph = s.boil ? Math.floor(frame / s.boil) % 7 : 0;
        out.push(...noiseNodes(k('n'), 0.75 / sz, 1, (s.seed ?? 31) + ph, u, 2.6));
        // speck where noise > 1 - density (rgb 0, alpha = mask)
        const K = 9;
        const thr = 1 - Math.max(0.002, Math.min(0.6, s.density)) * 1.6;
        out.push(<feColorMatrix key={k('m')} in={k('n')} type="matrix" values={toAlpha(`${K} 0 0 0 ${f4(-K * thr)}`)} result={k('m')} />);
        let mask = k('m');
        const on = s.on ?? 'all';
        if (on !== 'all') {
          const at = s.at ?? 0.45;
          const K2 = 12;
          const row = on === 'dark' ? `${f4(-K2 * 0.2126)} ${f4(-K2 * 0.7152)} ${f4(-K2 * 0.0722)} 0 ${f4(K2 * at)}` : `${f4(K2 * 0.2126)} ${f4(K2 * 0.7152)} ${f4(K2 * 0.0722)} 0 ${f4(-K2 * at)}`;
          out.push(<feColorMatrix key={k('g')} in={prev} type="matrix" values={toAlpha(row)} result={k('g')} />);
          out.push(<feComposite key={k('mg')} in={k('m')} in2={k('g')} operator="in" result={k('mg')} />);
          mask = k('mg');
        }
        out.push(<feFlood key={k('c')} floodColor={s.color} result={k('c')} />);
        out.push(<feComposite key={k('i')} in={k('c')} in2={mask} operator="in" result={k('i')} />);
        out.push(<feComposite key={r} in={k('i')} in2={prev} operator="over" result={r} />);
        break;
      }
      case 'tiles': {
        const size = Math.max(3, Math.round(s.size * u));
        const half = Math.floor(size / 2);
        out.push(<feFlood key={k('d')} x={half} y={half} width="1" height="1" floodColor="#000" result={k('d')} />);
        out.push(<feComposite key={k('c')} in={k('d')} in2={k('d')} width={size} height={size} x="0" y="0" result={k('c')} />);
        out.push(<feTile key={k('t')} in={k('c')} result={k('t')} />);
        out.push(<feComposite key={k('s')} in={prev} in2={k('t')} operator="in" result={k('s')} />);
        out.push(<feMorphology key={k('px')} in={k('s')} operator="dilate" radius={half} result={k('px')} />);
        // keep: leave the picture sharp and only lay the cell grid (quarry glass / tile grid over the image)
        let cur = s.keep ? prev : k('px');
        if (s.jitter) {
          // one noise sample per cell, spread over the cell, added to the tone
          out.push(...noiseNodes(k('n'), 0.37, 1, 23, u, 2));
          out.push(<feComposite key={k('ns')} in={k('n')} in2={k('t')} operator="in" result={k('ns')} />);
          out.push(<feMorphology key={k('nd')} in={k('ns')} operator="dilate" radius={half} result={k('nd')} />);
          out.push(<feComposite key={k('j')} in={cur} in2={k('nd')} operator="arithmetic" k1="0" k2="1" k3={f4(s.jitter)} k4={f4(-s.jitter / 2)} result={k('j')} />);
          cur = k('j');
        }
        const g = Math.max(1, Math.round((s.grout ?? 1.5) * u));
        const bv = s.bevel ? Math.max(1, Math.round(s.bevel * u)) : 0;
        const col = s.color ?? '#1d1b1a';
        const parts: N[] = [];
        const names: string[] = [];
        const add = (n: string, x: number, y: number, w2: number, h2: number, c: string, o: number) => {
          parts.push(<feFlood key={k(n)} x={x} y={y} width={w2} height={h2} floodColor={c} floodOpacity={o} result={k(n)} />);
          names.push(k(n));
        };
        if (bv) {
          add('bl', 0, 0, bv, size, '#ffffff', 0.22);
          add('bt', 0, 0, size, bv, '#ffffff', 0.28);
          add('br', size - g - bv, 0, bv, size, '#000000', 0.22);
          add('bb', 0, size - g - bv, size, bv, '#000000', 0.28);
        }
        add('gx', size - g, 0, g, size, col, 1);
        add('gy', 0, size - g, size, g, col, 1);
        out.push(...parts);
        out.push(
          <feMerge key={k('gm')} x={0} y={0} width={size} height={size} result={k('gm')}>
            {names.map((x) => (
              <feMergeNode key={x} in={x} />
            ))}
          </feMerge>,
        );
        out.push(<feTile key={k('gt')} in={k('gm')} result={k('gt')} />);
        out.push(<feComposite key={r} in={k('gt')} in2={cur} operator="over" result={r} />);
        break;
      }
      case 'pixelate': {
        const size = Math.max(2, Math.round(s.size * u));
        const half = Math.floor(size / 2);
        out.push(<feFlood key={k('d')} x={half} y={half} width="1" height="1" floodColor="#000" result={k('d')} />);
        out.push(<feComposite key={k('c')} in={k('d')} in2={k('d')} width={size} height={size} x="0" y="0" result={k('c')} />);
        out.push(<feTile key={k('t')} in={k('c')} result={k('t')} />);
        out.push(<feComposite key={k('s')} in={prev} in2={k('t')} operator="in" result={k('s')} />);
        out.push(<feMorphology key={r} in={k('s')} operator="dilate" radius={half} result={r} />);
        break;
      }
      case 'blur':
        out.push(<feGaussianBlur key={r} in={prev} stdDeviation={s.radius * u} result={r} />);
        break;
      case 'edges': {
        const w = s.width ?? 1;
        const [R, G, B] = hex(s.color);
        const st = s.strength ?? 6;
        out.push(<feColorMatrix key={k('l')} in={prev} type="matrix" values={LUMA} result={k('l')} />);
        if (w > 1) out.push(<feGaussianBlur key={k('b')} in={k('l')} stdDeviation={(w - 1) * 0.6 * u} result={k('b')} />);
        out.push(<feConvolveMatrix key={k('e')} in={w > 1 ? k('b') : k('l')} order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result={k('e')} />);
        // edge magnitude -> alpha of an ink layer
        out.push(<feColorMatrix key={k('a')} in={k('e')} type="matrix" values={`0 0 0 0 ${R}  0 0 0 0 ${G}  0 0 0 0 ${B}  ${st} 0 0 0 0`} result={k('a')} />);
        out.push(<feComposite key={r} in={k('a')} in2={prev} operator="over" result={r} />);
        break;
      }
      case 'halftone':
      case 'lines': {
        const isDot = s.type === 'halftone';
        const size = Math.max(3, Math.round((isDot ? s.size : s.gap) * u));
        const t = makeTile(isDot ? 'dot' : 'line', size, s.angle ?? (isDot ? 45 : 0));
        out.push(...screenNodes(t, k('scr')));
        out.push(<feColorMatrix key={k('sa')} in={k('scr')} type="matrix" values={toAlpha('1 0 0 0 0')} result={k('sa')} />);
        out.push(<feColorMatrix key={k('la')} in={prev} type="matrix" values={toAlpha(LUMA_ROW)} result={k('la')} />);
        const K = Math.max(2, size * 0.5) * (s.sharp ?? 1);
        const bias = s.bias ?? 0;
        // ink where screen > luma + bias (soft edge for anti-aliasing); inverse: where screen > 1 - luma + bias
        if (s.inverse) out.push(<feComposite key={k('m')} in={k('sa')} in2={k('la')} operator="arithmetic" k1="0" k2={f4(K)} k3={f4(K)} k4={f4(0.5 - K * (1 + bias))} result={k('m')} />);
        else out.push(<feComposite key={k('m')} in={k('sa')} in2={k('la')} operator="arithmetic" k1="0" k2={f4(K)} k3={f4(-K)} k4={f4(0.5 - K * bias)} result={k('m')} />);
        let ink: string;
        if (s.ink === 'source') ink = prev;
        else if (s.ink === 'shade') {
          out.push(<feColorMatrix key={k('sh')} in={prev} type="matrix" values="0.42 0 0 0 0  0 0.42 0 0 0  0 0 0.5 0 0  0 0 0 1 0" result={k('sh')} />);
          ink = k('sh');
        } else {
          out.push(<feFlood key={k('ic')} floodColor={s.ink} result={k('ic')} />);
          ink = k('ic');
        }
        out.push(<feComposite key={k('i')} in={ink} in2={k('m')} operator="in" result={k('i')} />);
        let base = prev;
        if (s.paper) {
          out.push(<feFlood key={k('p')} floodColor={s.paper} result={k('p')} />);
          base = k('p');
        }
        out.push(<feComposite key={r} in={k('i')} in2={base} operator="over" result={r} />);
        break;
      }
      case 'plates': {
        const inks = s.inks.slice(0, 3);
        const T = inks.map((x) => hex(x.color));
        const Wm = inkInverse(T);
        const P = hex(s.paper).map((v) => -Math.log(Math.max(0.035, v)));
        const Lmax = Math.log(64);
        const logT = Array.from({length: 32}, (_, j) => f4(Math.min(1, -Math.log(Math.max(1 / 64, j / 31)) / Lmax))).join(' ');
        out.push(
          <feComponentTransfer key={k('lg')} in={prev} result={k('lg')}>
            <feFuncR type="table" tableValues={logT} />
            <feFuncG type="table" tableValues={logT} />
            <feFuncB type="table" tableValues={logT} />
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>,
        );
        const gain = s.gain ?? 1;
        const rows = [0, 1, 2]
          .map((i) => {
            if (i >= inks.length) return '0 0 0 0 0';
            const w = Wm[i];
            const cst = -(w[0] * P[0] + w[1] * P[1] + w[2] * P[2]) * gain;
            return `${f4(w[0] * Lmax * gain)} ${f4(w[1] * Lmax * gain)} ${f4(w[2] * Lmax * gain)} 0 ${f4(cst)}`;
          })
          .join('  ');
        out.push(<feColorMatrix key={k('dn')} in={k('lg')} type="matrix" values={`${rows}  0 0 0 0 1`} result={k('dn')} />);
        let tex: string | undefined;
        if (s.grain) {
          out.push(...noiseNodes(k('gn'), 0.55, 2, 11 + (Math.floor(frame / 4) % 3), u, 2));
          out.push(<feColorMatrix key={k('gt')} in={k('gn')} type="matrix" values={toAlpha(`${f4(-s.grain)} 0 0 0 1`)} result={k('gt')} />);
          tex = k('gt');
        }
        out.push(<feFlood key={k('pp')} floodColor={s.paper} result={k('pp')} />);
        let acc = k('pp');
        const period = s.period === undefined ? 7 : s.period;
        inks.forEach((ink, i) => {
          const row = ['1 0 0 0 0', '0 1 0 0 0', '0 0 1 0 0'][i];
          out.push(<feColorMatrix key={k('da' + i)} in={k('dn')} type="matrix" values={toAlpha(row)} result={k('da' + i)} />);
          const off = ink.offset ?? [0, 0];
          const dr = s.drift ?? 0;
          const ph = Math.floor(frame / 2);
          const dx = Math.round((off[0] + dr * Math.sin(ph * 0.21 + i * 2.1)) * u);
          const dy = Math.round((off[1] + dr * Math.cos(ph * 0.17 + i * 1.3)) * u);
          const pl = plateNodes(k('da' + i), ink.color, {angle: ink.angle ?? [15, 0, 75][i], period: Math.round(period * u), dx, dy, sharp: s.sharp ?? 1, tex}, k('pl' + i));
          out.push(...pl.nodes);
          out.push(<feBlend key={k('mx' + i)} in={pl.out} in2={acc} mode="multiply" result={k('mx' + i)} />);
          acc = k('mx' + i);
        });
        next = acc;
        break;
      }
      case 'cmyk': {
        const blk = s.black ?? 0.85;
        // C, M, Y = 1 - R, G, B minus a share of K; K from darkness
        out.push(<feColorMatrix key={k('cm')} in={prev} type="matrix" values={`-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 0 1`} result={k('cm')} />);
        out.push(<feColorMatrix key={k('kk')} in={prev} type="matrix" values={toAlpha(`${f4(-0.2126 * 2.2 * blk)} ${f4(-0.7152 * 2.2 * blk)} ${f4(-0.0722 * 2.2 * blk)} 0 ${f4(blk)}`)} result={k('kk')} />);
        const ang = s.angles ?? [15, 75, 0, 45];
        const inks = ['#00A6E4', '#E6007E', '#FFED00', '#1B1B1B'];
        const size = Math.max(3, Math.round(s.size * u));
        const off = s.offset ?? 0;
        out.push(<feFlood key={k('pp')} floodColor={s.paper ?? '#F7F4EC'} result={k('pp')} />);
        let acc = k('pp');
        for (let p = 0; p < 4; p++) {
          let dA: string;
          if (p < 3) {
            const row = ['1 0 0 0 0', '0 1 0 0 0', '0 0 1 0 0'][p];
            out.push(<feColorMatrix key={k('da' + p)} in={k('cm')} type="matrix" values={toAlpha(row)} result={k('da' + p)} />);
            dA = k('da' + p);
          } else dA = k('kk');
          const dx = Math.round(off * u * [0, 1, -1, 0][p]);
          const dy = Math.round(off * u * [0, -1, 1, 0][p]);
          const pl = plateNodes(dA, inks[p], {angle: ang[p], period: size, dx, dy, sharp: 1}, k('pl' + p));
          out.push(...pl.nodes);
          out.push(<feBlend key={k('mx' + p)} in={pl.out} in2={acc} mode="multiply" result={k('mx' + p)} />);
          acc = k('mx' + p);
        }
        next = acc;
        break;
      }
      case 'hatch': {
        const fam = s.families ?? [
          {angle: 45, from: 0.8},
          {angle: -45, from: 0.52},
          {angle: 0, from: 0.28},
        ];
        const gap = Math.max(3, Math.round(s.gap * u));
        const row = s.invert ? `-0.2126 -0.7152 -0.0722 0 1` : LUMA_ROW;
        out.push(<feColorMatrix key={k('la')} in={prev} type="matrix" values={toAlpha(row)} result={k('la')} />);
        out.push(<feFlood key={k('ic')} floodColor={s.ink} result={k('ic')} />);
        const inks: string[] = [];
        fam.forEach((f, j) => {
          const t = makeTile('line', gap, f.angle);
          out.push(...screenNodes(t, k('sc' + j)));
          let sa = k('sa' + j);
          out.push(<feColorMatrix key={sa} in={k('sc' + j)} type="matrix" values={toAlpha('1 0 0 0 0')} result={sa} />);
          if (s.boil) {
            const ph = Math.floor(frame / s.boil);
            const dx = Math.round((hash(ph * 3.1 + j) - 0.5) * 2 * u);
            const dy = Math.round((hash(ph * 7.3 + j * 2) - 0.5) * 2 * u);
            if (dx || dy) {
              out.push(<feOffset key={k('so' + j)} in={sa} dx={dx} dy={dy} result={k('so' + j)} />);
              sa = k('so' + j);
            }
          }
          const mx = f.max ?? 0.55;
          const a = mx;
          const b = mx / Math.max(0.05, f.from);
          const K = Math.max(2, gap * 0.45) * (s.sharp ?? 1);
          // cov = a - b·L ; ink where S > 1 - cov
          out.push(<feComposite key={k('m' + j)} in={sa} in2={k('la')} operator="arithmetic" k1="0" k2={f4(K)} k3={f4(-K * b)} k4={f4(K * (a - 1) + 0.5)} result={k('m' + j)} />);
          out.push(<feComposite key={k('i' + j)} in={k('ic')} in2={k('m' + j)} operator="in" result={k('i' + j)} />);
          inks.push(k('i' + j));
        });
        let base = prev;
        if (s.paper) {
          out.push(<feFlood key={k('p')} floodColor={s.paper} result={k('p')} />);
          base = k('p');
        }
        out.push(
          <feMerge key={r} result={r}>
            <feMergeNode in={base} />
            {inks.map((x) => (
              <feMergeNode key={x} in={x} />
            ))}
          </feMerge>,
        );
        break;
      }
      case 'celRegister': {
        const ph = Math.floor(frame / 2);
        const j = s.jitter ?? 0;
        const dx = Math.round((s.dx + (hash(ph * 1.7) - 0.5) * 2 * j) * u);
        const dy = Math.round((s.dy + (hash(ph * 2.9 + 5) - 0.5) * 2 * j) * u);
        out.push(<feOffset key={k('f')} in={prev} dx={dx} dy={dy} result={k('f')} />);
        const w = s.width ?? 1.4;
        const [R, G, B] = hex(s.ink ?? '#1B1712');
        const st = s.strength ?? 7;
        out.push(<feColorMatrix key={k('l')} in={prev} type="matrix" values={LUMA} result={k('l')} />);
        out.push(<feGaussianBlur key={k('b')} in={k('l')} stdDeviation={Math.max(0.3, (w - 1) * 0.6 * u)} result={k('b')} />);
        out.push(<feConvolveMatrix key={k('e')} in={k('b')} order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result={k('e')} />);
        out.push(<feColorMatrix key={k('a')} in={k('e')} type="matrix" values={`0 0 0 0 ${R}  0 0 0 0 ${G}  0 0 0 0 ${B}  ${st} 0 0 0 0`} result={k('a')} />);
        let line = k('a');
        if (s.breaks) {
          out.push(...noiseNodes(k('n'), 0.05, 2, 3 + (ph % 7), u, 2));
          out.push(<feColorMatrix key={k('nb')} in={k('n')} type="matrix" values={toAlpha(`${f4(4)} 0 0 0 ${f4(-4 * s.breaks)}`)} result={k('nb')} />);
          out.push(<feComposite key={k('lb')} in={k('a')} in2={k('nb')} operator="in" result={k('lb')} />);
          line = k('lb');
        }
        out.push(<feComposite key={r} in={line} in2={k('f')} operator="over" result={r} />);
        break;
      }
      case 'stickerBorder': {
        const wd = Math.max(1, s.width * u);
        out.push(<feMorphology key={k('d')} in={prev} operator="dilate" radius={wd} result={k('d')} />);
        out.push(<feFlood key={k('c')} floodColor={s.color ?? '#FFFDF7'} result={k('c')} />);
        out.push(<feComposite key={k('b')} in={k('c')} in2={k('d')} operator="in" result={k('b')} />);
        const layers = [k('b')];
        if (s.edge) {
          out.push(<feMorphology key={k('d2')} in={prev} operator="dilate" radius={wd + 1.5 * u} result={k('d2')} />);
          out.push(<feFlood key={k('ec')} floodColor={s.edge} result={k('ec')} />);
          out.push(<feComposite key={k('e')} in={k('ec')} in2={k('d2')} operator="in" result={k('e')} />);
          layers.unshift(k('e'));
        }
        if (s.shadow) {
          out.push(<feGaussianBlur key={k('sb')} in={k('d')} stdDeviation={6 * u} result={k('sb')} />);
          out.push(<feOffset key={k('so')} in={k('sb')} dx={4 * u} dy={8 * u} result={k('so')} />);
          out.push(<feColorMatrix key={k('sc')} in={k('so')} type="matrix" values={`0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0 0.05  0 0 0 ${f4(s.shadow)} 0`} result={k('sc')} />);
          layers.unshift(k('sc'));
        }
        out.push(
          <feMerge key={r} result={r}>
            {layers.map((x) => (
              <feMergeNode key={x} in={x} />
            ))}
            <feMergeNode in={prev} />
          </feMerge>,
        );
        break;
      }
      case 'toon': {
        const sm = Math.max(0, (s.smooth ?? 1.5) * u);
        let src = prev;
        if (sm >= 0.5) {
          out.push(<feMorphology key={k('o1')} in={prev} operator="erode" radius={sm} result={k('o1')} />);
          out.push(<feMorphology key={k('o2')} in={k('o1')} operator="dilate" radius={sm} result={k('o2')} />);
          out.push(<feMorphology key={k('o3')} in={k('o2')} operator="dilate" radius={sm} result={k('o3')} />);
          out.push(<feMorphology key={k('o4')} in={k('o3')} operator="erode" radius={sm} result={k('o4')} />);
          src = k('o4');
        }
        // luminance bands with soft edges; shift every channel by (Lq - L) so hue/chroma survive
        const lv = Math.max(2, s.levels);
        const soft = s.soft ?? 0.035;
        const N2 = 96;
        const t = Array.from({length: N2}, (_, j) => {
          const x = j / (N2 - 1);
          const band = Math.min(lv - 1, Math.floor(x * lv));
          const edge = (band + 1) / lv;
          // each band takes the luminance of its middle, so the frame keeps its average brightness
          const lo = (band + 0.5) / lv;
          const hi = Math.min(1, (band + 1.5) / lv);
          const tt = Math.max(0, Math.min(1, (x - (edge - soft)) / (2 * soft)));
          const sstep = tt * tt * (3 - 2 * tt);
          return f4(band === lv - 1 ? lo : lo + (hi - lo) * sstep);
        }).join(' ');
        out.push(<feColorMatrix key={k('l')} in={src} type="matrix" values={LUMA} result={k('l')} />);
        out.push(
          <feComponentTransfer key={k('q')} in={k('l')} result={k('q')}>
            <feFuncR type="table" tableValues={t} />
            <feFuncG type="table" tableValues={t} />
            <feFuncB type="table" tableValues={t} />
          </feComponentTransfer>,
        );
        // tone = src + (Lq - L): built from non-negative sums so alpha never dips (premultiplied clamping)
        out.push(
          <feComponentTransfer key={k('li')} in={k('l')} result={k('li')}>
            <feFuncR type="linear" slope={-1} intercept={1} />
            <feFuncG type="linear" slope={-1} intercept={1} />
            <feFuncB type="linear" slope={-1} intercept={1} />
          </feComponentTransfer>,
        );
        out.push(<feComposite key={k('h1')} in={src} in2={k('q')} operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result={k('h1')} />);
        out.push(<feComposite key={k('h2')} in={k('h1')} in2={k('li')} operator="arithmetic" k1="0" k2="1" k3="0.5" k4="-0.5" result={k('h2')} />);
        out.push(
          <feComponentTransfer key={k('h2a')} in={k('h2')} result={k('h2a')}>
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>,
        );
        const tone = s.outline ? k('t') : r;
        out.push(<feComposite key={tone} in={k('h2a')} in2={k('h2a')} operator="arithmetic" k1="0" k2="2" k3="0" k4="0" result={tone} />);
        if (s.outline) {
          const w = s.width ?? 1.4;
          const [R, G, B] = hex(s.outline);
          const st = s.strength ?? 7;
          out.push(<feColorMatrix key={k('el')} in={src} type="matrix" values={LUMA} result={k('el')} />);
          out.push(<feGaussianBlur key={k('eb')} in={k('el')} stdDeviation={Math.max(0.3, (w - 1) * 0.6 * u)} result={k('eb')} />);
          out.push(<feConvolveMatrix key={k('ee')} in={k('eb')} order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result={k('ee')} />);
          out.push(<feColorMatrix key={k('ea')} in={k('ee')} type="matrix" values={`0 0 0 0 ${R}  0 0 0 0 ${G}  0 0 0 0 ${B}  ${st} 0 0 0 0`} result={k('ea')} />);
          out.push(<feComposite key={r} in={k('ea')} in2={tone} operator="over" result={r} />);
        }
        break;
      }
      case 'misregister': {
        const [R, G, B] = hex(s.color);
        out.push(<feOffset key={k('o')} in={prev} dx={s.dx * u} dy={s.dy * u} result={k('o')} />);
        out.push(<feColorMatrix key={k('c')} in={k('o')} type="matrix" values={`0 0 0 0 ${R}  0 0 0 0 ${G}  0 0 0 0 ${B}  -0.33 -0.33 -0.33 1 0`} result={k('c')} />);
        out.push(
          <feComponentTransfer key={k('a')} in={k('c')} result={k('a')}>
            <feFuncA type="linear" slope={s.opacity ?? 0.5} />
          </feComponentTransfer>,
        );
        out.push(<feBlend key={r} in={k('a')} in2={prev} mode="multiply" result={r} />);
        break;
      }
      case 'wobble': {
        const seed = s.boil ? Math.floor(frame / s.boil) % 50 : 3;
        out.push(<feTurbulence key={k('n')} type="fractalNoise" baseFrequency={(s.frequency ?? 0.02) / Math.max(0.5, u)} numOctaves={2} seed={seed} result={k('n')} />);
        out.push(<feDisplacementMap key={r} in={prev} in2={k('n')} scale={s.scale * u} xChannelSelector="R" yChannelSelector="G" result={r} />);
        break;
      }
      case 'bleed': {
        // watercolour edge darkening: source darkened where it differs from a blurred copy
        out.push(<feGaussianBlur key={k('b')} in={prev} stdDeviation={s.radius * u} result={k('b')} />);
        const st = s.strength ?? 0.6;
        out.push(<feComposite key={k('d')} in={prev} in2={k('b')} operator="arithmetic" k1="0" k2={1 + st} k3={-st} k4="0" result={k('d')} />);
        out.push(<feBlend key={r} in={k('d')} in2={k('b')} mode="multiply" result={r} />);
        break;
      }
      case 'edgeDarken': {
        out.push(<feGaussianBlur key={k('b')} in={prev} stdDeviation={s.radius * u} edgeMode="duplicate" result={k('b')} />);
        out.push(<feColorMatrix key={k('la')} in={prev} type="matrix" values={toAlpha(LUMA_ROW)} result={k('la')} />);
        out.push(<feColorMatrix key={k('lb')} in={k('b')} type="matrix" values={toAlpha(LUMA_ROW)} result={k('lb')} />);
        const g = s.gain ?? 7;
        // rim mask (in alpha): inside the darker shape, where the blurred copy is lighter than the pixel
        out.push(<feComposite key={k('m')} in={k('lb')} in2={k('la')} operator="arithmetic" k1="0" k2={f4(g)} k3={f4(-g)} k4="0" result={k('m')} />);
        out.push(
          <feComponentTransfer key={k('ms')} in={k('m')} result={k('ms')}>
            <feFuncA type="linear" slope={f4(s.strength ?? 0.55)} />
          </feComponentTransfer>,
        );
        // multiply the pixel by its own colour inside the rim = deeper pigment
        out.push(<feComposite key={k('c')} in={prev} in2={k('ms')} operator="in" result={k('c')} />);
        out.push(<feBlend key={r} in={k('c')} in2={prev} mode="multiply" result={r} />);
        break;
      }
      case 'crackle': {
        const ph = s.boil ? Math.floor(frame / s.boil) % 11 : 0;
        const fq = 1 / Math.max(2, s.scale * u);
        out.push(<feTurbulence key={k('n')} type="turbulence" baseFrequency={f4(fq)} numOctaves={1} seed={(s.seed ?? 41) + ph} result={k('n')} />);
        // veins where the turbulence is near zero
        const wd = s.width ?? 0.05;
        const K = 1 / Math.max(0.01, wd);
        out.push(<feColorMatrix key={k('m')} in={k('n')} type="matrix" values={toAlpha(`${f4(-K)} 0 0 0 ${f4(1.6)}`)} result={k('m')} />);
        out.push(
          <feComponentTransfer key={k('ma')} in={k('m')} result={k('ma')}>
            <feFuncA type="linear" slope={f4(s.amount)} />
          </feComponentTransfer>,
        );
        const mode = s.mode ?? 'multiply';
        out.push(<feFlood key={k('c')} floodColor={s.color ?? (mode === 'screen' ? '#ffffff' : '#2a1d12')} result={k('c')} />);
        out.push(<feComposite key={k('i')} in={k('c')} in2={k('ma')} operator="in" result={k('i')} />);
        if (mode === 'screen') out.push(<feBlend key={r} in={k('i')} in2={prev} mode="screen" result={r} />);
        else out.push(<feComposite key={r} in={k('i')} in2={prev} operator="over" result={r} />);
        break;
      }
      case 'relief': {
        const amt = s.amount ?? 1;
        out.push(<feColorMatrix key={k('h')} in={prev} type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${LUMA_ROW}`} result={k('h')} />);
        let hgt = k('h');
        if (s.blur) {
          out.push(<feGaussianBlur key={k('hb')} in={hgt} stdDeviation={s.blur * u} result={k('hb')} />);
          hgt = k('hb');
        }
        if (s.noise) {
          out.push(...noiseNodes(k('n'), s.noise.freq, 3, 17, u, 1.4));
          out.push(<feColorMatrix key={k('na')} in={k('n')} type="matrix" values={toAlpha('1 0 0 0 0')} result={k('na')} />);
          out.push(<feComposite key={k('hn')} in={hgt} in2={k('na')} operator="arithmetic" k1="0" k2="1" k3={f4(s.noise.amount)} k4={f4(-s.noise.amount / 2)} result={k('hn')} />);
          hgt = k('hn');
        }
        const el = s.elevation ?? 40;
        const kd = 0.8 / Math.sin((el * Math.PI) / 180);
        out.push(
          <feDiffuseLighting key={k('lt')} in={hgt} surfaceScale={s.strength * u} diffuseConstant={f4(kd)} lightingColor="#ffffff" result={k('lt')}>
            <feDistantLight azimuth={s.azimuth ?? 225} elevation={el} />
          </feDiffuseLighting>,
        );
        out.push(<feComposite key={r} in={prev} in2={k('lt')} operator="arithmetic" k1={f4(1.25 * amt)} k2={f4(1 - amt)} k3="0" k4="0" result={r} />);
        break;
      }
      case 'tooth': {
        const ph = s.boil ? Math.floor(frame / s.boil) % 5 : 0;
        out.push(...noiseNodes(k('n'), s.freq ?? [0.9, 0.35], 3, (s.seed ?? 21) + ph, u, 1.9));
        out.push(<feColorMatrix key={k('na')} in={k('n')} type="matrix" values={toAlpha('1 0 0 0 0')} result={k('na')} />);
        out.push(<feColorMatrix key={k('la')} in={prev} type="matrix" values={toAlpha(LUMA_ROW)} result={k('la')} />);
        // wax where noise < pressure·a + c   (pressure = darkness)
        const a = 1 + s.amount;
        const c = 0.55 - s.amount * 0.5;
        const K = 6;
        out.push(<feComposite key={k('m')} in={k('la')} in2={k('na')} operator="arithmetic" k1="0" k2={f4(-K * a)} k3={f4(-K)} k4={f4(K * (a + c))} result={k('m')} />);
        out.push(<feComposite key={k('w')} in={prev} in2={k('m')} operator="in" result={k('w')} />);
        out.push(<feFlood key={k('p')} floodColor={s.paper} result={k('p')} />);
        out.push(<feComposite key={r} in={k('w')} in2={k('p')} operator="over" result={r} />);
        break;
      }
      case 'texture': {
        const ph = s.boil ? Math.floor(frame / s.boil) % 9 : 0;
        out.push(...noiseNodes(k('n'), s.freq, s.octaves ?? 3, (s.seed ?? 5) + ph, u, 1.8));
        const mode = s.mode ?? 'multiply';
        const a = s.amount;
        const col = s.color ? hex(s.color) : ([1, 1, 1] as [number, number, number]);
        // neutral value of the blend: white for multiply, black for screen, mid-grey for overlay / soft-light
        const row = (c: number) =>
          mode === 'multiply' ? `${f4(a * c)} 0 0 0 ${f4(1 - a)}` : mode === 'screen' ? `${f4(a * c)} 0 0 0 0` : `${f4(a * c)} 0 0 0 ${f4(0.5 - (a * c) / 2)}`;
        out.push(<feColorMatrix key={k('t')} in={k('n')} type="matrix" values={`${row(col[0])}  ${row(col[1])}  ${row(col[2])}  0 0 0 0 1`} result={k('t')} />);
        out.push(<feBlend key={r} in={k('t')} in2={prev} mode={mode} result={r} />);
        break;
      }
      case 'grain': {
        const seed = Math.floor(frame / 2) % 60;
        out.push(<feTurbulence key={k('n')} type="fractalNoise" baseFrequency={(s.size ?? 0.9) / Math.max(0.5, u)} numOctaves={1} seed={seed} result={k('n')} />);
        out.push(<feColorMatrix key={k('g')} in={k('n')} type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result={k('g')} />);
        out.push(<feComposite key={r} in={prev} in2={k('g')} operator="arithmetic" k1="0" k2="1" k3={s.amount} k4={-s.amount / 2} result={r} />);
        break;
      }
      case 'tint':
        out.push(<feFlood key={k('f')} floodColor={s.color} floodOpacity={s.amount ?? 1} result={k('f')} />);
        out.push(<feBlend key={r} in={k('f')} in2={prev} mode={s.mode ?? 'multiply'} result={r} />);
        break;
      case 'glow':
        out.push(<feGaussianBlur key={k('b')} in={prev} stdDeviation={s.radius * u} result={k('b')} />);
        out.push(<feComposite key={r} in={prev} in2={k('b')} operator="arithmetic" k1="0" k2="1" k3={s.amount ?? 0.6} k4="0" result={r} />);
        break;
      case 'bloom': {
        const thr = Math.min(0.95, s.threshold ?? 0.7);
        const sl = 1 / (1 - thr);
        out.push(
          <feComponentTransfer key={k('t')} in={prev} result={k('t')}>
            <feFuncR type="linear" slope={f4(sl)} intercept={f4(-thr * sl)} />
            <feFuncG type="linear" slope={f4(sl)} intercept={f4(-thr * sl)} />
            <feFuncB type="linear" slope={f4(sl)} intercept={f4(-thr * sl)} />
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>,
        );
        const sk = s.streak ?? 1;
        const sd = (m: number) => (sk === 1 ? s.radius * m * u : `${f4(s.radius * m * u * sk)} ${f4(s.radius * m * u * 0.35)}`);
        out.push(<feGaussianBlur key={k('b1')} in={k('t')} stdDeviation={sd(1)} result={k('b1')} />);
        out.push(<feGaussianBlur key={k('b2')} in={k('t')} stdDeviation={sd(3.2)} result={k('b2')} />);
        out.push(<feComposite key={k('bm')} in={k('b1')} in2={k('b2')} operator="arithmetic" k1="0" k2="0.6" k3="0.55" k4="0" result={k('bm')} />);
        let bl = k('bm');
        if (s.tint) {
          const [R, G, B] = hex(s.tint);
          out.push(<feColorMatrix key={k('bt')} in={bl} type="matrix" values={`${f4(R)} 0 0 0 0  0 ${f4(G)} 0 0 0  0 0 ${f4(B)} 0 0  0 0 0 1 0`} result={k('bt')} />);
          bl = k('bt');
        }
        out.push(<feComposite key={r} in={prev} in2={bl} operator="arithmetic" k1="0" k2="1" k3={f4(s.amount ?? 0.8)} k4="0" result={r} />);
        break;
      }
      case 'chroma': {
        const dx = s.dx * u;
        const dy = (s.dy ?? 0) * u;
        out.push(<feColorMatrix key={k('r')} in={prev} type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1" result={k('r')} />);
        out.push(<feColorMatrix key={k('g')} in={prev} type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1" result={k('g')} />);
        out.push(<feColorMatrix key={k('b')} in={prev} type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0 1" result={k('b')} />);
        out.push(<feOffset key={k('ro')} in={k('r')} dx={dx} dy={dy} result={k('ro')} />);
        out.push(<feOffset key={k('bo')} in={k('b')} dx={-dx} dy={-dy} result={k('bo')} />);
        out.push(<feComposite key={k('rg')} in={k('ro')} in2={k('g')} operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result={k('rg')} />);
        out.push(<feComposite key={r} in={k('rg')} in2={k('bo')} operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result={r} />);
        break;
      }
      case 'tiltShift': {
        const c = (s.center ?? 0.55) * ctx.h;
        const band = (s.band ?? 0.14) * ctx.h;
        const fe = (s.feather ?? 0.12) * ctx.h;
        out.push(<feGaussianBlur key={k('b1')} in={prev} stdDeviation={s.blur * u} result={k('b1')} />);
        out.push(<feGaussianBlur key={k('b2')} in={prev} stdDeviation={s.blur * 0.4 * u} result={k('b2')} />);
        out.push(<feFlood key={k('m1')} x={0} y={Math.round(c - band)} width={ctx.w} height={Math.round(2 * band)} floodColor="#fff" result={k('m1')} />);
        out.push(<feGaussianBlur key={k('m1b')} in={k('m1')} stdDeviation={`0 ${f4(fe / 2)}`} result={k('m1b')} />);
        out.push(<feFlood key={k('m2')} x={0} y={Math.round(c - band - fe)} width={ctx.w} height={Math.round(2 * (band + fe))} floodColor="#fff" result={k('m2')} />);
        out.push(<feGaussianBlur key={k('m2b')} in={k('m2')} stdDeviation={`0 ${f4(fe / 2)}`} result={k('m2b')} />);
        out.push(<feComposite key={k('sh')} in={prev} in2={k('m1b')} operator="in" result={k('sh')} />);
        out.push(<feComposite key={k('md')} in={k('b2')} in2={k('m2b')} operator="in" result={k('md')} />);
        out.push(
          <feMerge key={r} result={r}>
            <feMergeNode in={k('b1')} />
            <feMergeNode in={k('md')} />
            <feMergeNode in={k('sh')} />
          </feMerge>,
        );
        break;
      }
      case 'tape': {
        const jit = (s.jitter ?? 1.2) * u;
        const S = s.band ? Math.max(jit * 2, 18 * u) : Math.max(1, jit * 2);
        const c = (1.8 * jit * 2) / S;
        out.push(<feTurbulence key={k('jt')} type="fractalNoise" baseFrequency={`0 ${f4(0.45 / Math.max(0.5, u))}`} numOctaves={1} seed={frame % 97} result={k('jt')} />);
        out.push(<feColorMatrix key={k('jm')} in={k('jt')} type="matrix" values={`${f4(c)} 0 0 0 ${f4(0.5 - c / 2)}  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1`} result={k('jm')} />);
        let map = k('jm');
        if (s.band) {
          // a rolling tracking band with big per-line offsets
          const bh = Math.round(s.band * ctx.h);
          const cyc = ctx.h + bh * 3;
          const y0 = Math.round(((frame * 7 * u) % cyc) - bh);
          out.push(<feTurbulence key={k('bt')} type="fractalNoise" baseFrequency={`0.002 ${f4(0.12 / Math.max(0.5, u))}`} numOctaves={2} seed={(frame * 3) % 89} result={k('bt')} />);
          out.push(<feColorMatrix key={k('bm')} in={k('bt')} type="matrix" values="4 0 0 0 -1.5  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1" result={k('bm')} />);
          out.push(<feFlood key={k('bf')} x={0} y={y0} width={ctx.w} height={bh} floodColor="#fff" result={k('bf')} />);
          out.push(<feComposite key={k('bc')} in={k('bm')} in2={k('bf')} operator="in" result={k('bc')} />);
          out.push(
            <feMerge key={k('mm')} result={k('mm')}>
              <feMergeNode in={k('jm')} />
              <feMergeNode in={k('bc')} />
            </feMerge>,
          );
          map = k('mm');
        }
        out.push(<feDisplacementMap key={k('d')} in={prev} in2={map} scale={f4(S)} xChannelSelector="R" yChannelSelector="G" result={k('d')} />);
        // chroma bleed: split luma / chroma, smear chroma to the right
        const bleed = s.bleed ?? 5;
        if (bleed > 0) {
          out.push(<feColorMatrix key={k('y')} in={k('d')} type="matrix" values={LUMA} result={k('y')} />);
          const row = (cc: number) => [0, 1, 2].map((j) => f4((cc === j ? 1 : 0) - [0.2126, 0.7152, 0.0722][j])).join(' ');
          out.push(<feColorMatrix key={k('c')} in={k('d')} type="matrix" values={`${row(0)} 0 0.5  ${row(1)} 0 0.5  ${row(2)} 0 0.5  0 0 0 0 1`} result={k('c')} />);
          out.push(<feGaussianBlur key={k('cb')} in={k('c')} stdDeviation={`${f4(bleed * u)} 0`} result={k('cb')} />);
          out.push(<feOffset key={k('co')} in={k('cb')} dx={(s.shift ?? 2.5) * u} dy={0} result={k('co')} />);
          let y = k('y');
          if (s.sharpen) {
            out.push(<feGaussianBlur key={k('yb')} in={k('y')} stdDeviation={`${f4(2.2 * u)} 0`} result={k('yb')} />);
            out.push(<feComposite key={k('ys')} in={k('y')} in2={k('yb')} operator="arithmetic" k1="0" k2={f4(1 + s.sharpen)} k3={f4(-s.sharpen)} k4="0" result={k('ys')} />);
            y = k('ys');
          }
          out.push(<feComposite key={r} in={y} in2={k('co')} operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" result={r} />);
        } else next = k('d');
        break;
      }
      case 'weave': {
        const a = s.amount * u;
        let dx = a * (0.6 * Math.sin(frame * 0.71 + 1.3) + 0.4 * Math.sin(frame * 1.93 + 0.4));
        let dy = a * (0.6 * Math.sin(frame * 0.53 + 2.1) + 0.4 * Math.sin(frame * 1.37 + 3.3));
        if (s.jump && hash(Math.floor(frame / 3)) > 0.93) dy += s.jump * u;
        dx = Math.round(dx * 2) / 2;
        dy = Math.round(dy * 2) / 2;
        out.push(<feOffset key={r} in={prev} dx={dx} dy={dy} result={r} />);
        break;
      }
      case 'ascii': {
        const gp = Math.max(1, Math.round((s.cell ?? 2) * u));
        const cw = 6 * gp;
        const ch = 9 * gp;
        // cell average -> one sample per cell -> spread over the cell
        out.push(<feGaussianBlur key={k('ab')} in={prev} stdDeviation={`${f4(cw / 3)} ${f4(ch / 3)}`} result={k('ab')} />);
        out.push(<feFlood key={k('d')} x={Math.floor(cw / 2)} y={Math.floor(ch / 2)} width="1" height="1" floodColor="#000" result={k('d')} />);
        out.push(<feComposite key={k('c')} in={k('d')} in2={k('d')} x="0" y="0" width={cw} height={ch} result={k('c')} />);
        out.push(<feTile key={k('t')} in={k('c')} result={k('t')} />);
        out.push(<feComposite key={k('s')} in={k('ab')} in2={k('t')} operator="in" result={k('s')} />);
        out.push(<feMorphology key={k('px')} in={k('s')} operator="dilate" radius={`${Math.ceil(cw / 2)} ${Math.ceil(ch / 2)}`} result={k('px')} />);
        const gain = s.gain ?? 1.1;
        const inv = s.invert ?? 'auto';
        const rowP = `${f4(0.2126 * gain)} ${f4(0.7152 * gain)} ${f4(0.0722 * gain)} 0 0`;
        const rowN = `${f4(-0.2126 * gain)} ${f4(-0.7152 * gain)} ${f4(-0.0722 * gain)} 0 ${f4(gain)}`;
        if (inv === 'auto') {
          // light frames: density from darkness; dark frames: density from brightness
          out.push(<feColorMatrix key={k('lp')} in={k('px')} type="matrix" values={toAlpha(rowP)} result={k('lp')} />);
          out.push(<feColorMatrix key={k('ln')} in={k('px')} type="matrix" values={toAlpha(rowN)} result={k('ln')} />);
          out.push(...meanNodes(prev, k('mn'), ctx));
          out.push(...flipMaskNodes(k('mn'), k('fm'), 'dark', 0.5));
          out.push(
            <feComponentTransfer key={k('fmn')} in={k('fm')} result={k('fmn')}>
              <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>,
          );
          out.push(<feComposite key={k('lnm')} in={k('ln')} in2={k('fm')} operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result={k('lnm')} />);
          out.push(<feComposite key={k('lpm')} in={k('lp')} in2={k('fmn')} operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result={k('lpm')} />);
          out.push(<feComposite key={k('la')} in={k('lpm')} in2={k('lnm')} operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result={k('la')} />);
        } else out.push(<feColorMatrix key={k('la')} in={k('px')} type="matrix" values={toAlpha(inv ? rowN : rowP)} result={k('la')} />);
        const nl = GLYPHS.length;
        const gam = s.gamma ?? 1.35;
        const NB = 64;
        const layers: string[] = [];
        for (let g = 1; g < nl; g++) {
          const tv = Array.from({length: NB}, (_, j) => (Math.min(nl - 1, Math.floor(Math.pow((j + 0.5) / NB, gam) * nl)) === g ? '1' : '0')).join(' ');
          out.push(
            <feComponentTransfer key={k('lv' + g)} in={k('la')} result={k('lv' + g)}>
              <feFuncA type="discrete" tableValues={tv} />
            </feComponentTransfer>,
          );
          const runs = glyphRuns(GLYPHS[g]);
          runs.forEach((ru, q) =>
            out.push(<feFlood key={k(`g${g}_${q}`)} x={ru[0] * gp} y={ru[1] * gp} width={ru[2] * gp} height={gp} floodColor="#fff" result={k(`g${g}_${q}`)} />),
          );
          out.push(
            <feMerge key={k('gm' + g)} x={0} y={0} width={cw} height={ch} result={k('gm' + g)}>
              {runs.map((_, q) => (
                <feMergeNode key={q} in={k(`g${g}_${q}`)} />
              ))}
            </feMerge>,
          );
          out.push(<feTile key={k('gt' + g)} in={k('gm' + g)} result={k('gt' + g)} />);
          out.push(<feComposite key={k('gl' + g)} in={k('gt' + g)} in2={k('lv' + g)} operator="in" result={k('gl' + g)} />);
          layers.push(k('gl' + g));
        }
        out.push(
          <feMerge key={k('gs')} result={k('gs')}>
            {layers.map((x) => (
              <feMergeNode key={x} in={x} />
            ))}
          </feMerge>,
        );
        let ink: string;
        if (!s.ink || s.ink === 'source') {
          out.push(<feColorMatrix key={k('ik0')} in={k('px')} type="saturate" values="1.3" result={k('ik0')} />);
          out.push(
            <feComponentTransfer key={k('ik')} in={k('ik0')} result={k('ik')}>
              <feFuncR type="linear" slope="1.35" />
              <feFuncG type="linear" slope="1.35" />
              <feFuncB type="linear" slope="1.35" />
            </feComponentTransfer>,
          );
          ink = k('ik');
        } else {
          out.push(<feFlood key={k('ik')} floodColor={s.ink} result={k('ik')} />);
          ink = k('ik');
        }
        out.push(<feComposite key={k('ig')} in={ink} in2={k('gs')} operator="in" result={k('ig')} />);
        out.push(<feFlood key={k('pp')} floodColor={s.paper ?? '#050505'} result={k('pp')} />);
        out.push(<feComposite key={r} in={k('ig')} in2={k('pp')} operator="over" result={r} />);
        break;
      }
    }
    prev = next;
  });
  return {nodes: out, last: prev};
};

const buildFilter = (steps: FilterStep[], ctx: Ctx, opaque: boolean): React.ReactNode[] => {
  const res = buildSteps(steps, ctx);
  const nodes = [...res.nodes];
  // re-assert opaque alpha so arithmetic steps never leave the frame translucent
  nodes.push(
    <feComponentTransfer key="alpha" in={res.last}>
      <feFuncA type="table" tableValues={opaque ? '1 1' : '0 1'} />
    </feComponentTransfer>,
  );
  return nodes;
};

// ---------------------------------------------------------------------------------------------------------------
// Overlays (HTML / SVG layers on top of the filtered frame)
// ---------------------------------------------------------------------------------------------------------------
const PaperLayer: React.FC<{o: NonNullable<StyleOverlays['paper']>; id: string}> = ({o, id}) => {
  const {w, h, u} = useStage();
  const kind = o.kind ?? 'fiber';
  const fib = o.fiber ?? 0.35;
  const fq = (v: number) => f4(v / Math.max(0.5, u));
  let body: React.ReactNode;
  if (kind === 'cold-press' || kind === 'canvas') {
    body = (
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type={kind === 'canvas' ? 'turbulence' : 'fractalNoise'} baseFrequency={kind === 'canvas' ? `${fq(0.5)} ${fq(0.5)}` : fq(0.09)} numOctaves={kind === 'canvas' ? 2 : 3} seed={5} result="n" />
        <feColorMatrix in="n" type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 0 0 0`} result="a" />
        <feDiffuseLighting in="a" surfaceScale={kind === 'canvas' ? 1.6 : 2.6} diffuseConstant="1.15" lightingColor="#fff" result="l">
          <feDistantLight azimuth="225" elevation="52" />
        </feDiffuseLighting>
        <feComponentTransfer in="l">
          <feFuncR type="linear" slope={f4(fib * 1.4)} intercept={f4(1 - fib * 1.4 * 0.95)} />
          <feFuncG type="linear" slope={f4(fib * 1.4)} intercept={f4(1 - fib * 1.4 * 0.95)} />
          <feFuncB type="linear" slope={f4(fib * 1.4)} intercept={f4(1 - fib * 1.4 * 0.95)} />
        </feComponentTransfer>
      </filter>
    );
  } else if (kind === 'rice' || kind === 'laid' || kind === 'kraft') {
    body = (
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={`${fq(kind === 'rice' ? 0.012 : 0.6)} ${fq(kind === 'rice' ? 0.22 : 0.6)}`} numOctaves={3} seed={7} result="a" />
        <feTurbulence type="fractalNoise" baseFrequency={`${fq(0.22)} ${fq(0.014)}`} numOctaves={2} seed={8} result="b" />
        <feTurbulence type="fractalNoise" baseFrequency={fq(0.006)} numOctaves={2} seed={9} result="c" />
        <feComposite in="a" in2="b" operator="arithmetic" k2="0.6" k3="0.4" result="ab" />
        <feComposite in="ab" in2="c" operator="arithmetic" k2="0.7" k3="0.3" result="abc" />
        <feColorMatrix in="abc" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.2 0 0 0 0.62`} result="m" />
        <feComponentTransfer in="m">
          <feFuncA type="linear" slope={f4(fib)} />
        </feComponentTransfer>
      </filter>
    );
  } else if (kind === 'mottle') {
    body = (
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={fq(0.004)} numOctaves={3} seed={4} result="c" />
        <feTurbulence type="fractalNoise" baseFrequency={fq(0.7)} numOctaves={2} seed={5} result="f" />
        <feComposite in="c" in2="f" operator="arithmetic" k2="0.75" k3="0.25" result="cf" />
        <feColorMatrix in="cf" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.1 0 0 0 0.68`} result="m" />
        <feComponentTransfer in="m">
          <feFuncA type="linear" slope={f4(fib)} />
        </feComponentTransfer>
      </filter>
    );
  } else {
    body = (
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency={0.8} numOctaves={3} seed={5} />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues={`0 ${fib}`} />
        </feComponentTransfer>
      </filter>
    );
  }
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: o.amount}}>
      {body}
      <rect width={w} height={h} fill={o.color} />
      <rect width={w} height={h} filter={`url(#${id})`} fill={kind === 'cold-press' || kind === 'canvas' ? '#fff' : undefined} />
    </svg>
  );
};

const Overlays: React.FC<{o: StyleOverlays}> = ({o}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const lb = o.letterbox ? Math.max(0, (h - w / o.letterbox.aspect) / 2) : 0;
  const leakAt = {tl: '12% 10%', tr: '88% 10%', bl: '12% 90%', br: '88% 90%'}[o.leak?.at ?? 'tr'];
  const ld = o.leak?.drift ?? 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {o.paper && <PaperLayer o={o.paper} id={`pf${id}`} />}
      {o.paper?.kind === 'laid' && (
        <AbsoluteFill style={{opacity: o.paper.amount * 0.35, mixBlendMode: 'multiply', backgroundImage: `repeating-linear-gradient(0deg, rgba(90,70,40,0.35) 0px, rgba(90,70,40,0.35) ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px, transparent ${4 * u}px), repeating-linear-gradient(90deg, rgba(90,70,40,0.25) 0px, rgba(90,70,40,0.25) ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px, transparent ${110 * u}px)`}} />
      )}
      {o.grid && (
        <AbsoluteFill
          style={{
            opacity: o.grid.opacity ?? 0.5,
            mixBlendMode: 'normal',
            backgroundImage:
              (o.grid.kind ?? 'square') === 'dot'
                ? `radial-gradient(circle, ${o.grid.color} ${Math.max(1, 1.3 * u)}px, transparent ${Math.max(1.5, 1.8 * u)}px)`
                : o.grid.kind === 'iso'
                  ? `repeating-linear-gradient(30deg, ${o.grid.color} 0px, ${o.grid.color} ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px, transparent ${o.grid.gap * u}px), repeating-linear-gradient(150deg, ${o.grid.color} 0px, ${o.grid.color} ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px, transparent ${o.grid.gap * u}px)`
                  : `linear-gradient(${o.grid.color} ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px), linear-gradient(90deg, ${o.grid.color} ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px)` +
                    (o.grid.major ? `, linear-gradient(${o.grid.color} ${Math.max(1, 2 * u)}px, transparent ${Math.max(1, 2 * u)}px), linear-gradient(90deg, ${o.grid.color} ${Math.max(1, 2 * u)}px, transparent ${Math.max(1, 2 * u)}px)` : ''),
            backgroundSize:
              o.grid.kind === 'iso'
                ? undefined
                : `${o.grid.gap * u}px ${o.grid.gap * u}px, ${o.grid.gap * u}px ${o.grid.gap * u}px` + (o.grid.major ? `, ${o.grid.gap * o.grid.major * u}px ${o.grid.gap * o.grid.major * u}px, ${o.grid.gap * o.grid.major * u}px ${o.grid.gap * o.grid.major * u}px` : ''),
            backgroundPosition: 'center center',
          }}
        />
      )}
      {o.leak && (
        <>
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse at ${leakAt}, ${o.leak.color} 0%, transparent 55%)`,
              opacity: o.leak.amount * (0.75 + 0.25 * Math.sin(frame / 23)),
              transform: `translate(${Math.sin(frame / 61) * 40 * u * ld}px, ${Math.cos(frame / 47) * 24 * u * ld}px)`,
              mixBlendMode: 'screen',
            }}
          />
          {o.leak.color2 && (
            <AbsoluteFill
              style={{
                background: `radial-gradient(ellipse 60% 80% at ${8 + 6 * Math.sin(frame / 53) * ld}% 70%, ${o.leak.color2} 0%, transparent 60%)`,
                opacity: o.leak.amount * 0.8 * (0.7 + 0.3 * Math.sin(frame / 31 + 1)),
                mixBlendMode: 'screen',
              }}
            />
          )}
        </>
      )}
      {o.sheen && (
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: o.sheen.amount,
            background: `linear-gradient(${o.sheen.angle ?? 115}deg, transparent ${-60 + ((frame * (o.sheen.speed ?? 0.4)) % 220)}%, ${o.sheen.color ?? '#ffffff'} ${-45 + ((frame * (o.sheen.speed ?? 0.4)) % 220)}%, transparent ${-30 + ((frame * (o.sheen.speed ?? 0.4)) % 220)}%)`,
          }}
        />
      )}
      {o.scanlines && (
        <AbsoluteFill style={{opacity: o.scanlines.opacity, backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.9) 0px, rgba(0,0,0,0.9) ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px, transparent ${o.scanlines.gap * u}px)`}} />
      )}
      {o.vhs && <VhsLayer o={o.vhs} id={`vh${id}`} />}
      {o.filmGrain ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: o.filmGrain, mixBlendMode: 'overlay'}}>
          <filter id={`fg${id}`}>
            <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={Math.floor(frame / 2) % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={w} height={h} filter={`url(#fg${id})`} />
        </svg>
      ) : null}
      {o.filmDamage && <FilmDamageLayer o={o.filmDamage} />}
      {o.light && <LightLayer o={o.light} />}
      {o.vignette && <AbsoluteFill style={{background: `radial-gradient(ellipse at center, transparent 50%, ${o.vignette.color ?? 'rgba(0,0,0,1)'} 135%)`, opacity: o.vignette.amount}} />}
      {o.crt && <CrtLayer o={o.crt} />}
      {o.gate && <GateLayer o={o.gate} />}
      {o.mat && (
        <>
          <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 ${o.mat.size * u}px ${o.mat.color}`}} />
          <div
            style={{
              position: 'absolute',
              inset: o.mat.size * u,
              boxShadow: `inset 0 0 ${(o.mat.shadow ?? 14) * u}px rgba(0,0,0,0.35), 0 0 0 ${Math.max(1, 3 * u)}px ${o.mat.line ?? 'rgba(255,255,255,0.65)'}`,
            }}
          />
        </>
      )}
      {o.frameLine && <div style={{position: 'absolute', inset: o.frameLine.inset * u, border: `${(o.frameLine.width ?? 1.5) * u}px solid ${o.frameLine.color}`}} />}
      {o.deckle && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <filter id={`dk${id}`}>
            <feTurbulence type="fractalNoise" baseFrequency={f4((o.deckle.freq ?? 0.04) / Math.max(0.5, u))} numOctaves={3} seed={9} />
            <feDisplacementMap in="SourceGraphic" scale={o.deckle.size * 0.8 * u} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <path
            d={`M0 0 H${w} V${h} H0 Z M${o.deckle.size * u} ${o.deckle.size * u} V${h - o.deckle.size * u} H${w - o.deckle.size * u} V${o.deckle.size * u} Z`}
            fill={o.deckle.color}
            fillRule="evenodd"
            filter={`url(#dk${id})`}
          />
        </svg>
      )}
      {lb > 0 && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: lb, background: o.letterbox!.color ?? '#000'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: lb, background: o.letterbox!.color ?? '#000'}} />
        </>
      )}
      {o.osd && <OsdLayer o={o.osd} />}
    </AbsoluteFill>
  );
};

const LightLayer: React.FC<{o: NonNullable<StyleOverlays['light']>}> = ({o}) => {
  const frame = useCurrentFrame();
  const {u} = useStage();
  const col = o.color ?? '#fff3d6';
  const amt = o.amount ?? 0.5;
  const dark = o.dark ?? 0.5;
  const sp = o.speed ?? 0;
  const x = (o.x ?? 0.5) * 100 + (sp ? Math.sin(frame * sp * 0.02) * 6 : 0);
  const y = (o.y ?? 0.5) * 100 + (sp ? Math.cos(frame * sp * 0.017) * 3 : 0);
  const sz = (o.size ?? 0.35) * 100;
  const ang = o.angle ?? 0;
  const mul = (bg: string, op: number, extra?: React.CSSProperties) => <AbsoluteFill style={{mixBlendMode: 'multiply', background: bg, opacity: op, ...extra}} />;
  const scr = (bg: string, op: number, extra?: React.CSSProperties) => <AbsoluteFill style={{mixBlendMode: 'screen', background: bg, opacity: op, ...extra}} />;
  if (o.kind === 'spot')
    return (
      <AbsoluteFill>
        {mul(`radial-gradient(ellipse ${sz}% ${sz * 1.3}% at ${x}% ${y}%, #fff 0%, #fff 50%, #000 100%)`, dark)}
        {scr(`radial-gradient(ellipse ${sz * 0.8}% ${sz}% at ${x}% ${y}%, ${col} 0%, transparent 70%)`, amt)}
      </AbsoluteFill>
    );
  if (o.kind === 'band') {
    const wd = sz / 2;
    const pos = sp ? ((x + frame * sp * 0.15) % 160) - 30 : x;
    const st = (inside: string, outside: string) => `linear-gradient(${90 + ang}deg, ${outside} 0%, ${outside} ${pos - wd - 12}%, ${inside} ${pos - wd}%, ${inside} ${pos + wd}%, ${outside} ${pos + wd + 12}%, ${outside} 100%)`;
    return (
      <AbsoluteFill>
        {mul(st('#fff', '#000'), dark)}
        {scr(st(col, 'transparent'), amt)}
      </AbsoluteFill>
    );
  }
  if (o.kind === 'blinds') {
    const gap = (o.gap ?? 46) * u;
    const off = sp ? frame * sp * 0.3 * u : 0;
    return (
      <AbsoluteFill>
        {scr(`linear-gradient(${ang || 120}deg, ${col} 0%, transparent 70%)`, amt)}
        {mul(`repeating-linear-gradient(${ang || -35}deg, #000 ${off}px, #000 ${off + gap * 0.45}px, #fff ${off + gap * 0.55}px, #fff ${off + gap}px)`, dark, {filter: `blur(${(o.gap ?? 46) * 0.09 * u}px)`})}
      </AbsoluteFill>
    );
  }
  if (o.kind === 'window') {
    const x0 = x - sz / 2;
    const sk = ang || 18;
    const poly = `polygon(${x0}% ${y - sz / 3}%, ${x0 + sz * 0.55}% ${y - sz / 3}%, ${x0 + sz * 0.55 + sk}% ${y + sz / 2}%, ${x0 + sk}% ${y + sz / 2}%)`;
    return (
      <AbsoluteFill>
        {mul('#5a6688', dark * 0.55)}
        <AbsoluteFill style={{mixBlendMode: 'screen', opacity: amt, filter: `blur(${9 * u}px)`}}>
          <AbsoluteFill style={{clipPath: poly}}>
            <AbsoluteFill style={{background: col}} />
            <AbsoluteFill style={{background: `repeating-linear-gradient(90deg, transparent 0px, transparent ${150 * u}px, #000 ${150 * u}px, #000 ${164 * u}px)`}} />
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  if (o.kind === 'mist') {
    const band = (yy: number, ph: number, k: number) => (
      <AbsoluteFill
        key={k}
        style={{
          opacity: amt,
          background: `linear-gradient(180deg, transparent ${yy - sz * 0.35}%, ${col} ${yy - sz * 0.08}%, ${col} ${yy + sz * 0.08}%, transparent ${yy + sz * 0.35}%)`,
          WebkitMaskImage: `linear-gradient(90deg, transparent ${4 + ph}%, #000 ${20 + ph}%, #000 ${70 + ph}%, transparent ${92 + ph}%)`,
          maskImage: `linear-gradient(90deg, transparent ${4 + ph}%, #000 ${20 + ph}%, #000 ${70 + ph}%, transparent ${92 + ph}%)`,
          transform: `translateX(${Math.sin(frame * 0.004 * (sp || 1) + k) * 40 * u}px)`,
        }}
      />
    );
    return (
      <AbsoluteFill>
        {band(y, -6, 0)}
        {band(Math.min(95, y + 28), 8, 1)}
      </AbsoluteFill>
    );
  }
  // foot: stage footlights from below, darkness above, candle flicker
  const fl = 1 + 0.07 * Math.sin(frame * 0.9) * Math.sin(frame * 0.37 + 1);
  return (
    <AbsoluteFill>
      {mul('linear-gradient(180deg, #000 0%, #fff 62%)', dark)}
      {scr(`radial-gradient(ellipse 90% ${sz + 10}% at 50% 108%, ${col} 0%, transparent 72%)`, amt * fl)}
    </AbsoluteFill>
  );
};

const OsdLayer: React.FC<{o: NonNullable<StyleOverlays['osd']>}> = ({o}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {u} = useStage();
  const fs2 = (o.size ?? 34) * u;
  const c = o.color ?? '#F2F2F2';
  const t = Math.floor(frame / fps);
  const tc = `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  const base: React.CSSProperties = {position: 'absolute', fontFamily: "VT323, 'Courier New', monospace", fontSize: fs2, color: c, letterSpacing: 0.06 * fs2, textShadow: `${2 * u}px ${2 * u}px 0 rgba(0,0,0,0.65), 0 0 ${4 * u}px rgba(0,0,0,0.5)`, lineHeight: 1};
  const m = 6;
  const rec = (o.kind ?? 'rec') === 'rec';
  return (
    <AbsoluteFill>
      <div style={{...base, left: `${m}%`, top: `${m}%`, display: 'flex', alignItems: 'center', gap: 0.35 * fs2}}>
        {rec ? <span style={{display: 'inline-block', width: 0.55 * fs2, height: 0.55 * fs2, borderRadius: '50%', background: '#ff2a1f', opacity: frame % 30 < 19 ? 1 : 0}} /> : <span>▶</span>}
        <span>{rec ? 'REC' : 'PLAY'}</span>
      </div>
      <div style={{...base, right: `${m}%`, top: `${m}%`}}>SP</div>
      <div style={{...base, left: `${m}%`, bottom: `${m}%`}}>{o.date ?? 'JUN 14 1997'}</div>
      <div style={{...base, right: `${m}%`, bottom: `${m}%`}}>{tc}</div>
    </AbsoluteFill>
  );
};

const GateLayer: React.FC<{o: NonNullable<StyleOverlays['gate']>}> = ({o}) => {
  const {w, h, u} = useStage();
  let gw = h * o.aspect;
  let gh = h;
  if (gw > w) {
    gw = w;
    gh = w / o.aspect;
  }
  const r = (o.radius ?? 18) * u;
  return (
    <div
      style={{
        position: 'absolute',
        left: (w - gw) / 2,
        top: (h - gh) / 2,
        width: gw,
        height: gh,
        borderRadius: r,
        boxShadow: `0 0 0 ${Math.max(w, h)}px ${o.color ?? '#000'}, inset 0 0 ${(o.shadow ?? 26) * u}px ${(o.shadow ?? 26) * 0.4 * u}px rgba(0,0,0,0.55)`,
      }}
    />
  );
};

const CrtLayer: React.FC<{o: NonNullable<StyleOverlays['crt']>}> = ({o}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const rad = (o.radius ?? 46) * u;
  const inset = (o.inner ?? 18) * u;
  const roll = o.roll ?? 0.06;
  const rollY = ((frame * 2.2) % 140) - 20;
  const flick = (o.flicker ?? 0.02) * (hash(frame) - 0.5) * 2;
  return (
    <AbsoluteFill>
      {o.grille ? (
        <AbsoluteFill
          style={{
            opacity: o.grille,
            mixBlendMode: 'multiply',
            backgroundImage: `repeating-linear-gradient(90deg, #ff6060 0px, #ff6060 ${u}px, #60ff60 ${u}px, #60ff60 ${2 * u}px, #6060ff ${2 * u}px, #6060ff ${3 * u}px)`,
          }}
        />
      ) : null}
      {roll > 0 && (
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: roll,
            background: `linear-gradient(180deg, transparent ${rollY - 12}%, rgba(255,255,255,0.9) ${rollY}%, transparent ${rollY + 10}%)`,
          }}
        />
      )}
      {flick !== 0 && <AbsoluteFill style={{background: flick > 0 ? '#fff' : '#000', opacity: Math.abs(flick), mixBlendMode: flick > 0 ? 'screen' : 'multiply'}} />}
      {(o.glare ?? 0.07) > 0 && (
        <AbsoluteFill style={{mixBlendMode: 'screen', opacity: o.glare ?? 0.07, background: 'radial-gradient(ellipse 55% 40% at 28% 18%, #ffffff 0%, transparent 70%)'}} />
      )}
      <div
        style={{
          position: 'absolute',
          left: inset,
          top: inset,
          width: w - 2 * inset,
          height: h - 2 * inset,
          borderRadius: rad,
          boxShadow: `0 0 0 ${Math.max(w, h)}px ${o.bezel ?? '#0b0b0a'}, inset 0 0 ${60 * u}px ${18 * u}px rgba(0,0,0,0.6), inset 0 0 ${8 * u}px ${2 * u}px rgba(0,0,0,0.8)`,
        }}
      />
    </AbsoluteFill>
  );
};

const VhsLayer: React.FC<{o: NonNullable<StyleOverlays['vhs']>; id: string}> = ({o, id}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const f = Math.floor(frame / 1);
  const drops = Math.round((o.dropouts ?? 1.5) * 1.5);
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < drops; i++) {
    if (hash(f * 13.1 + i * 7.7) > 0.55) continue;
    const y = hash(f * 3.3 + i) * h;
    const x = hash(f * 5.1 + i * 3) * w * 0.8;
    const len = (0.1 + hash(f * 9.7 + i) * 0.4) * w;
    lines.push(<rect key={i} x={x} y={y} width={len} height={Math.max(1, 1.6 * u)} fill="url(#vhsfade)" />);
  }
  const hs = (o.headSwitch ?? 1) * 10 * u;
  return (
    <AbsoluteFill>
      {(o.noise ?? 0.08) > 0 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: o.noise ?? 0.08, mixBlendMode: 'screen'}}>
          <filter id={id}>
            <feTurbulence type="fractalNoise" baseFrequency={`${f4(0.9 / Math.max(0.5, u))} ${f4(0.3 / Math.max(0.5, u))}`} numOctaves={1} seed={f % 113} />
            <feColorMatrix type="matrix" values="1.6 0 0 0 -0.5  1.6 0 0 0 -0.5  1.6 0 0 0 -0.5  0 0 0 0 1" />
          </filter>
          <rect width={w} height={h} filter={`url(#${id})`} />
        </svg>
      )}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="vhsfade" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {lines}
        {hs > 0 && (
          <g>
            <rect x={0} y={h - hs} width={w} height={hs} fill="#000" opacity={0.25} />
            <rect x={(hash(f) - 0.5) * 30 * u} y={h - hs * 0.7} width={w} height={Math.max(1, hs * 0.25)} fill="#fff" opacity={0.18} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

const FilmDamageLayer: React.FC<{o: NonNullable<StyleOverlays['filmDamage']>}> = ({o}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const items: React.ReactNode[] = [];
  const nS = o.scratches ?? 2;
  for (let i = 0; i < nS; i++) {
    const life = 7 + i * 3;
    const seg = Math.floor((frame + i * 5) / life);
    if (hash(seg * 1.3 + i * 17) > 0.6) continue;
    const x = (hash(seg * 7.1 + i) * 0.9 + 0.05) * w + Math.sin(frame * 0.7 + i) * 3 * u;
    const y0 = hash(seg * 2.7 + i) * h * 0.4;
    const len = h * (0.4 + hash(seg * 3.9 + i) * 0.6);
    const light = hash(seg * 5.3 + i) > 0.5;
    items.push(<rect key={'s' + i} x={x} y={y0} width={Math.max(1, (0.8 + hash(seg + i) * 1.2) * u)} height={len} fill={light ? '#f4efe2' : '#14110d'} opacity={0.35 + 0.35 * hash(seg * 9 + i)} />);
  }
  const nD = Math.round((o.dust ?? 4) * (0.5 + hash(frame * 1.7)));
  for (let i = 0; i < nD; i++) {
    const x = hash(frame * 11.3 + i * 3.7) * w;
    const y = hash(frame * 17.9 + i * 5.1) * h;
    const r = (1 + hash(frame * 23.1 + i) * 3.5) * u;
    const light = hash(frame * 29.3 + i) > 0.55;
    items.push(<ellipse key={'d' + i} cx={x} cy={y} rx={r} ry={r * (0.5 + hash(i + frame) * 0.8)} fill={light ? '#f6f1e4' : '#0e0c09'} opacity={0.75} />);
  }
  if (o.hair && hash(Math.floor(frame / 9) * 3.3) < o.hair) {
    const seg = Math.floor(frame / 9);
    const x = hash(seg * 4.4) * w;
    const y = hash(seg * 6.6) * h;
    const s = (40 + hash(seg) * 60) * u;
    items.push(<path key="hair" d={`M${x} ${y} q ${s * 0.4} ${-s * 0.5} ${s} ${-s * 0.1} t ${s * 0.6} ${s * 0.4}`} stroke="#0e0c09" strokeWidth={Math.max(1, 1.2 * u)} fill="none" opacity={0.7} />);
  }
  const fl = (o.flicker ?? 0.04) * (hash(frame * 0.77) - 0.5) * 2;
  return (
    <AbsoluteFill>
      {fl !== 0 && <AbsoluteFill style={{background: fl > 0 ? '#fff8e8' : '#000', opacity: Math.abs(fl), mixBlendMode: fl > 0 ? 'screen' : 'multiply'}} />}
      {o.burn ? <AbsoluteFill style={{background: `radial-gradient(ellipse at center, transparent 55%, rgba(60,30,5,1) 140%)`, opacity: o.burn, mixBlendMode: 'multiply'}} /> : null}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {items}
      </svg>
    </AbsoluteFill>
  );
};

/** Wraps any scene: re-times it (on twos), filters it through the style's chain, then lays the overlays on top. */
export const StyleFrame: React.FC<{style: StyleDef; children: React.ReactNode; strength?: number}> = ({style, children, strength = 1}) => {
  const frame = useCurrentFrame();
  const {u, w, h} = useStage();
  const id = 'st' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const step = style.step ?? 1;
  const f = step > 1 ? Math.floor(frame / step) * step : frame;
  const inner = step > 1 ? <Freeze frame={f}>{children}</Freeze> : children;
  const cut = !!style.cutout;
  const filtered = (
    <AbsoluteFill style={{background: cut ? undefined : style.palette.bg, filter: style.steps.length ? `url(#${id})` : undefined}}>
      {inner}
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={cut ? {background: style.palette.bg} : undefined}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          {buildFilter(style.steps, {u, frame: f, w, h, keep: {}}, !cut)}
        </filter>
      </svg>
      {strength < 1 ? (
        <AbsoluteFill>
          <AbsoluteFill>{inner}</AbsoluteFill>
          <AbsoluteFill style={{opacity: strength}}>{filtered}</AbsoluteFill>
        </AbsoluteFill>
      ) : (
        filtered
      )}
      {style.overlays && <Overlays o={style.overlays} />}
    </AbsoluteFill>
  );
};
