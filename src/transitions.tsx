import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {flip} from '@remotion/transitions/flip';
import {fbm, n2, rng} from './core/random';
import {smoothClosed} from './core/shapes';
import {at, axisFor, BlurFilter, C, clamp01, cornerR, E, Edge, frontLine, f1, gray, Hidden, lerp, Masked, Overlay, P, Plain, ptsStr, region, sampleEdge, sstep, straight, useFrameSize, useUid} from './transitions/kit';
import {Curtain, Door} from './transitions/doors';
import {Crt, Expand, Lights, ScreenPush, Tracking} from './transitions/screens';
import {Brush, Erase, Flood, Overprint, Rewrite, Squeegee, Stripes} from './transitions/paint';
import {Ball, Portal, Shockwave} from './transitions/burst';
import {Burn, LayerSwap, Occluder, Scan} from './transitions/world';
import {Blinds, LineOpen, MosaicT, SteppedDiagonal, Tiles} from './transitions/pattern';
import {IrisPlus} from './transitions/iris';
import {BlobBubble, BlobFog, BlobInk, Curl3d, DiagStrips, GridCut, Halftone, PackageBand, Scroll, Shutter, TearPeel, WipeX, ZoomSnap} from './transitions/ext';

/**
 * Scene-to-scene transitions reverse-engineered from the samples (see docs/TRANSITIONS.md).
 *
 * Every custom presentation renders each scene ONCE: soft / banded / organic reveals use an
 * SVG luminance <mask> referenced from CSS (`mask: url(#id)`), so heavy scenes (three.js, video)
 * are never duplicated. The only exception is `glitch`, which renders 3 offset copies per side.
 *
 *  fade        crossfade
 *  slide/wipe  remotion directional push / hard wipe
 *  clock       radial clock wipe, flip = 3D card flip
 *  iris        hard circle with a thin border, easeInQuad           (v4 iris-reveal-from-dot)
 *  blob        hairy ink blob grows from a point                     (v11 0:01 x-ray blob reveal)
 *  tear        zig-zag torn-paper edge with paper rim + shadow       (v10 torn-paper-wipe, v14 torn-seam-era-wipe)
 *  zoom        zoom-through: old pushes in + blurs, new settles from 0.62
 *  flash       wobbly light hole with gold rim + rays swallows frame (v6 light-hole-expand); variant 'plain' = white flash
 *  glitch      horizontal band displacement, bands flip scene independently (v8 glitch-layer-rewind)
 *  ripple      banded concentric flood                               (v17 ripple-flood)
 *  spiral      expanding Archimedean spiral stripes                  (v17 spiral-wipe)
 *  wave        diagonal liquid surge with wavy banded edge           (v17 liquid-wave-wipe); variant 'lines' (v20 wave-line-wipe)
 *  bands       posterised soft-edge directional wipe                 (v17 luma-ramp-wipe); variant 'center' (v17 bar-expand-wipe)
 *  diagonal    45° hard wipe with dashed glowing edge                (v6 diagonal-palette-wipe)
 *  push-blur   whip push, directional motion blur, overshoot settle  (v10 push-slide-blur, v20 whip-pan-truck)
 *  page-turn   page swings over from a spine, curved edge + shadow   (v1 page-turn-cover); variant 'roll' (v9 paper-roll-wipe)
 *  storm       scalloped feathered front                             (v1 storm-wall-wipe); variant 'watercolor' (v1 watercolor-front-wipe)
 *  whiteout    bloom to white, hold, milky fade up                   (v16 bloom-whiteout); variants 'burnout' (v16 glow-burnout-cut), 'blizzard' (v21)
 *  bar         thin bar sweeps across, cut underneath                (v19 bar-slide-wipe); variant 'black' = bar on black
 *  strip       horizontal band slams open from centre, then floods   (v21 eye-strip-slam)
 *  dots        old scene breaks into zooming dots                    (v18 dot-zoom-punch); variant 'bokeh' (v18 particle-burst-zoom)
 *  xray        hole with a hand-hatched ink edge                     (v6 xray-hatch-hole)
 *
 * Round 2 (src/transitions/*.tsx, from the lemo-opuscar / mg-styles-15 / pdoom-video / ClaudeAnimationBase styles
 * and the x2 x4 x5 x6 reference videos):
 *  door        art-deco split doors swing open; variants 'revolve' (glass wing), 'saloon' (wooden half-doors)
 *  curtain     scalloped paper cloud curtains close and part; variant 'velvet'
 *  crt         TV switch-off to a dot, then power-on; variants 'off', 'on'
 *  tracking    VHS tracking tear rolls down the frame, the scene changes under it
 *  rewrite     a label is struck through and rewritten by hand ("FIG. 1" -> "FIG. 2")
 *  erase       an eraser band leaves a 7 % ghost of the old scene
 *  blinds      slats turn over; variants 'vertical', 'open' (x2 field-blinds-wipe)
 *  tiles       cards flip in a diagonal wave; variant 'radial'
 *  mosaic      pixelate up, swap, pixelate down; variant 'swirl' (RPG encounter swirl to white)
 *  overprint   a riso ink disc multiplies over the frame, the scene swaps under it, it shrinks away
 *  scan        soft satellite scan front with a glow swath; variant 'tear' (light bar)
 *  portal      a spinning portal covers the frame, flashes, and the next scene opens out of it
 *  occluder    a blurred foreground prop passes the lens (pillar); variants 'trunks', 'foliage', 'clouds', 'waves'
 *  squeegee    screen-print squeegee pulls the new scene on with a ragged ink edge
 *  lights      house lights snap off, a key light strikes with a flicker, lights come up
 *  flood       three liquid colour sheets flood the frame and drain away
 *  stripes     candy-stripe band stack + stripe field sweep across
 *  burn        a spark runs under the page, burns it in two, the halves swing away
 *  brush       five ragged paint bands cover the frame and drag off
 *  ball        a ball flies at the camera and floods the frame with its colour
 *  shockwave   flash, grey beat, then a disc with a chromatic fringe and radial streaks
 *  screen      the camera pushes into a screen that shows the next scene
 *  layer-swap  the old scene's layers drop out near-to-far, the new layers rise far-to-near
 *  expand      a UI rect grows into the next screen; variant 'collapse' (rect -> dot on black)
 *  diagonal 'stepped' (x2 pixel-staircase band), bands 'line' (x2 line-open-wipe)
 *
 * Round-2 extensions of the original types (options + variants; defaults render exactly as before):
 *  iris        shape heart|star|keyhole|diamond|square|hexagon|rock, hold + holdRadius, mode 'closeopen', feather, x2/y2 drift, rim;
 *              variants 'ring', 'medallion' (numbered stamp), 'marker' (drawn ring), 'bloom' (feather by speed, shape 'horizon')   (src/transitions/iris.tsx)
 *  blob        'fog' (misty feathered), 'ink' (irregular edge + tide line), 'bubble' (chain of shape wipes)
 *  strip       'shutter' (top then bottom blacks out, strip opens)        page-turn 'curl3d' (N-strip curling leaf)
 *  dots        'halftone' (circle-grid wipe)      wipe 'brush' | 'soft' | 'mist' | 'band'      diagonal 'band' (package wipe) | 'strips'
 *  bands       'rows' | 'cols' | 'quarter' (grid snap)      slide 'scroll' (handscroll)      tear 'peel'      zoom 'snap'      push-blur 'whip'
 *  (the new variants live in src/transitions/ext.tsx)
 */
export type TransitionType =
  | 'cut'
  | 'fade'
  | 'slide'
  | 'wipe'
  | 'clock'
  | 'flip'
  | 'iris'
  | 'blob'
  | 'tear'
  | 'zoom'
  | 'flash'
  | 'glitch'
  | 'ripple'
  | 'spiral'
  | 'wave'
  | 'bands'
  | 'diagonal'
  | 'push-blur'
  | 'page-turn'
  | 'storm'
  | 'whiteout'
  | 'bar'
  | 'strip'
  | 'dots'
  | 'xray'
  | 'door'
  | 'curtain'
  | 'crt'
  | 'tracking'
  | 'rewrite'
  | 'erase'
  | 'blinds'
  | 'tiles'
  | 'mosaic'
  | 'overprint'
  | 'scan'
  | 'portal'
  | 'occluder'
  | 'squeegee'
  | 'lights'
  | 'flood'
  | 'stripes'
  | 'burn'
  | 'brush'
  | 'ball'
  | 'shockwave'
  | 'screen'
  | 'layer-swap'
  | 'expand';

export type TransitionSpec = {
  type: TransitionType;
  /** length in frames (see transitionFrames() for each type's recommended default) */
  frames?: number;
  /** side the new scene comes from; 'from-center' only matters for `bands` */
  direction?: 'from-left' | 'from-right' | 'from-top' | 'from-bottom' | 'from-center';
  /** origin / centre as 0..1 of the frame (iris, blob, flash, ripple, spiral, zoom, whiteout burnout, strip y, bands center y, dots, xray) */
  x?: number;
  y?: number;
  /** accent colour: border, rim, edge line, bar, flash light, whiteout tint … (per type, see docs) */
  color?: string;
  spring?: boolean;
  /** travel direction in degrees for front-based wipes (0 = towards right, 90 = down); overrides direction */
  angle?: number;
  /** number of stepped bands in soft edges (ripple, wave, bands) */
  bands?: number;
  /** size parameter: bar width (fraction of travel), strip band height (fraction of H), page-roll width */
  size?: number;
  /** look variant, e.g. 'plain', 'lines', 'center', 'roll', 'watercolor', 'burnout', 'blizzard', 'black', 'bokeh' */
  variant?: string;
  /** random seed for jagged / organic edges */
  seed?: number;
  /** palette for multi-colour types (flood sheets, stripes bands, brush bands, squeegee bead, portal arms, line dot) */
  colors?: string[];
  /** text for types that draw words (rewrite: "old|new", e.g. "FIG. 1|FIG. 2 · EXPLODED VIEW") */
  text?: string;
  /** iris aperture: 'circle' (default) | 'heart' | 'star' | 'keyhole' | 'diamond' | 'square' | 'hexagon' | 'rock'; iris 'bloom': 'horizon' */
  shape?: string;
  /** iris: fraction of the transition spent holding at `holdRadius` (0 = no hold) */
  hold?: number;
  /** iris hold size: mean radius as a fraction of the frame height (default 0.22) */
  holdRadius?: number;
  /** feathered edge: iris px at 1080 (bloom: multiplier of the edge speed), blob 'fog' px, blob 'ink' edge irregularity (0.15) */
  feather?: number;
  /** iris: where the centre ends up (default = x, y); medallion drifts to it, 'closeopen' reopens there */
  x2?: number;
  y2?: number;
  /** rim / outline stroke width in px at 1080 (iris, medallion, brush edge); 0 = none */
  rim?: number;
  /** iris: 'closeopen' = the old scene closes (optionally holds) onto x,y, a black beat, then the new scene opens at x2,y2 */
  mode?: 'open' | 'closeopen';
};

export const TRANSITION_TYPES: TransitionType[] = [
  'fade', 'slide', 'wipe', 'clock', 'flip', 'iris', 'blob', 'tear', 'zoom', 'flash', 'glitch', 'ripple', 'spiral', 'wave',
  'bands', 'diagonal', 'push-blur', 'page-turn', 'storm', 'whiteout', 'bar', 'strip', 'dots', 'xray',
  'door', 'curtain', 'crt', 'tracking', 'rewrite', 'erase', 'blinds', 'tiles', 'mosaic', 'overprint', 'scan', 'portal',
  'occluder', 'squeegee', 'lights', 'flood', 'stripes', 'burn', 'brush', 'ball', 'shockwave', 'screen', 'layer-swap', 'expand',
];

type Def = {frames: number; color?: string; colors?: string[]; angle?: number; bands?: number; size?: number; variant?: string; x?: number; y?: number; text?: string; x2?: number; y2?: number; rim?: number; holdRadius?: number};
export const DEFAULTS: Record<string, Def> = {
  cut: {frames: 0},
  fade: {frames: 15},
  slide: {frames: 15},
  wipe: {frames: 15},
  clock: {frames: 20},
  flip: {frames: 20},
  iris: {frames: 8, color: '#3383CB'},
  blob: {frames: 18, color: '#0b0d1c'},
  tear: {frames: 12, color: '#f3efe6', angle: 0},
  zoom: {frames: 14},
  flash: {frames: 20, color: '#F6F0E4'},
  'flash:plain': {frames: 12, color: '#ffffff'},
  glitch: {frames: 15},
  ripple: {frames: 12, bands: 8},
  spiral: {frames: 18, color: '#ffffff'},
  wave: {frames: 14, angle: 205, bands: 6},
  'wave:lines': {frames: 36, color: '#2b2622'},
  bands: {frames: 10, angle: 90, bands: 8},
  'bands:center': {frames: 12, bands: 8},
  diagonal: {frames: 10, angle: 45, color: '#ffffff'},
  'push-blur': {frames: 12, angle: 180},
  'page-turn': {frames: 22, angle: 0, color: '#ffffff'},
  'page-turn:roll': {frames: 60, angle: 0, size: 0.035},
  storm: {frames: 20, angle: 180, color: 'rgba(236,240,248,0.75)'},
  'storm:watercolor': {frames: 34, angle: 0},
  whiteout: {frames: 42, color: '#ffffff'},
  'whiteout:burnout': {frames: 24, color: '#ffffff'},
  'whiteout:blizzard': {frames: 36, color: '#97A3BB'},
  bar: {frames: 8, angle: 0, color: '#C0C3CA', size: 0.036},
  'bar:black': {frames: 10, angle: 0, color: '#C0C3CA', size: 0.036},
  strip: {frames: 24, size: 0.4},
  dots: {frames: 16, color: '#ffffff'},
  'dots:bokeh': {frames: 20},
  xray: {frames: 10, color: '#1d140c'},
  // round 2
  door: {frames: 28, color: '#E8C27A'},
  'door:revolve': {frames: 26, angle: 180, color: '#D9B36C'},
  'door:saloon': {frames: 34, color: '#8A5A34'},
  curtain: {frames: 40, color: '#CFC4DC'},
  'curtain:velvet': {frames: 40, color: '#7A1424'},
  crt: {frames: 22, color: '#B8D6FF'},
  'crt:off': {frames: 16},
  'crt:on': {frames: 14},
  tracking: {frames: 16, size: 0.12},
  rewrite: {frames: 32, color: '#C8372D', text: 'FIG. 1|FIG. 2', y: 0.84},
  erase: {frames: 22, angle: 0, color: '#ffffff'},
  blinds: {frames: 18, bands: 12, color: '#000000'},
  'blinds:vertical': {frames: 18, bands: 8},
  'blinds:open': {frames: 14, bands: 12},
  tiles: {frames: 22, size: 0.12, color: '#000000'},
  mosaic: {frames: 24, size: 0.06},
  'mosaic:swirl': {frames: 40, color: '#ffffff'},
  overprint: {frames: 26, color: '#FF48B0'},
  scan: {frames: 14, angle: 90, color: '#ffffff'},
  'scan:tear': {frames: 10, angle: 90, color: '#fff7e0'},
  portal: {frames: 16, color: '#DCFFA8', colors: ['#160B33', '#3B1F86', '#7B4DFF', '#36D6C3', '#DCFFA8']},
  occluder: {frames: 16, angle: 0, color: '#210c05'},
  'occluder:trunks': {frames: 24, color: '#24160d'},
  'occluder:foliage': {frames: 22, color: '#1d3a1b'},
  'occluder:clouds': {frames: 22, angle: 90, color: '#eef1f6'},
  'occluder:waves': {frames: 26, angle: 270, color: '#1d5fa8'},
  squeegee: {frames: 18, angle: 0, colors: ['#FF4F7B', '#FFB000', '#2F6BFF']},
  lights: {frames: 42, color: '#FFE2B0'},
  flood: {frames: 36, angle: 20, colors: ['#FF5E8A', '#FFB84D', '#4CC9F0']},
  stripes: {frames: 12, angle: 0, color: '#ffffff', colors: ['#FF3D7F', '#FFE14D', '#16B9F0']},
  burn: {frames: 32, color: '#FF8A2A'},
  brush: {frames: 20, angle: 0, colors: ['#9C3F22', '#C9683F']},
  ball: {frames: 14, color: '#FF5A2C', x: 0.68, y: 0.58},
  shockwave: {frames: 16, color: '#C8D86A'},
  screen: {frames: 36, size: 0.42, color: '#15171c'},
  'layer-swap': {frames: 24},
  expand: {frames: 14, color: '#F4EFE6', size: 0.27},
  'expand:collapse': {frames: 18},
  'diagonal:stepped': {frames: 14, angle: 150, color: '#D2FC36', bands: 22, size: 0.25},
  'bands:line': {frames: 12, color: '#ffffff', colors: ['#F6481E']},
  // round-2 extensions of the original types
  'iris:ring': {frames: 14, rim: 3},
  'iris:medallion': {frames: 26, color: '#1F2A44', colors: ['#F2994A', '#FFFFFF'], x: 0.28, y: 0.34, x2: 0.5, y2: 0.5, rim: 7, text: '1'},
  'iris:marker': {frames: 24, color: '#E0312B', holdRadius: 0.13, rim: 7},
  'iris:bloom': {frames: 16, color: '#ffffff', rim: 0, angle: 270},
  'blob:fog': {frames: 14, color: '#E8ECEC', x: 0.58, y: 0.55},
  'blob:ink': {frames: 30},
  'blob:bubble': {frames: 30, colors: ['#FF6B4A', '#FFD23F']},
  'strip:shutter': {frames: 22},
  'page-turn:curl3d': {frames: 34, angle: 0, bands: 16, size: 0.55, color: '#ffffff'},
  'dots:halftone': {frames: 16, color: '#FF5470', size: 0.074, angle: 45},
  'wipe:brush': {frames: 20, angle: 0, color: '#2b2622', size: 0.04},
  'wipe:soft': {frames: 16, angle: 0, size: 0.12},
  'wipe:mist': {frames: 60, angle: 270, color: '#F1E9D8'},
  'wipe:band': {frames: 8, angle: 18, color: '#E02B2B', size: 0.135},
  'diagonal:band': {frames: 12, angle: 0, color: '#FFD400', size: 0.27, colors: ['#0B0F14']},
  'diagonal:strips': {frames: 24, angle: 30, size: 0.24},
  'bands:rows': {frames: 14, bands: 6},
  'bands:cols': {frames: 14, bands: 8},
  'bands:quarter': {frames: 14, size: 1 / 6},
  'slide:scroll': {frames: 34, angle: 180, color: '#c9b690', size: 0.135},
  'tear:peel': {frames: 36, color: '#f3efe6', colors: ['#C9A77A']},
  'zoom:snap': {frames: 10, size: 3.2},
  'push-blur:whip': {frames: 8, angle: 180, size: 60},
};

const DIR_ANGLE: Record<string, number> = {'from-left': 0, 'from-right': 180, 'from-top': 90, 'from-bottom': 270};

const variantOf = (s: TransitionSpec) => s.variant ?? (s.type === 'bands' && s.direction === 'from-center' ? 'center' : '');
const defOf = (s: TransitionSpec): Def => ({...(DEFAULTS[s.type] ?? {frames: 15}), ...(DEFAULTS[`${s.type}:${variantOf(s)}`] ?? {})});

/** frames a transition lasts: spec.frames or the type's recommended default */
export const transitionFrames = (s: TransitionSpec) => s.frames ?? defOf(s).frames;

// ---------------------------------------------------------------------------------------------
// iris — v4 iris-reveal-from-dot: hard circle, thin border, easeInQuad

const Iris: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const r = (cornerR(cx, cy, w, h) + 6 * u) * E.inQuad(p);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `circle(${r}px at ${cx}px ${cy}px)`}}>{children}</AbsoluteFill>
      {p < 1 && (
        <Overlay w={w} h={h}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={pp.color} strokeWidth={4 * u} />
        </Overlay>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// blob — v11 x-ray reveal: dark ink blob with a hairy fibre edge grows from a point

const blobK = (a: number, seed: number, t: number) =>
  1 + 0.15 * Math.sin(a * 3 + seed + t * 3) + 0.08 * Math.sin(a * 5 - seed * 2 + t * 5) + 0.08 * n2(`blob${seed}`, Math.cos(a) * 1.4, Math.sin(a) * 1.4 + t * 1.5);

const Blob: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('blob');
  const fid = useUid('blobf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const R = (cornerR(cx, cy, w, h) / 0.66) * Math.pow(p, 1.7);
  const n = 48;
  const pts: [number, number][] = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = blobK(a, pp.seed, p);
    return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k];
  });
  const d = smoothClosed(pts);
  const boil = Math.floor((p * D) / 2);
  const r = rng(pp.seed * 977 + boil);
  const count = Math.min(700, Math.round((2 * Math.PI * R) / (5 * u)));
  const grow = Math.min(1, R / (60 * u));
  const hairs = Array.from({length: count}, (_, i) => {
    const a = r() * Math.PI * 2;
    const rr = R * blobK(a, pp.seed, p);
    const bx = cx + Math.cos(a) * rr;
    const by = cy + Math.sin(a) * rr;
    const da = a + (r() - 0.5) * 1.3;
    const len = (6 + 24 * r()) * u * grow;
    return <line key={i} x1={bx - Math.cos(da) * len * 0.3} y1={by - Math.sin(da) * len * 0.3} x2={bx + Math.cos(da) * len} y2={by + Math.sin(da) * len} strokeWidth={(1 + r() * 1.4) * u} />;
  });
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<path d={d} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={10 * u} w={w} h={h} />
        </defs>
        <path d={d} fill="none" stroke={pp.color} strokeWidth={34 * u} opacity={0.6} filter={`url(#${fid})`} />
        <path d={d} fill="none" stroke={pp.color} strokeWidth={5 * u} />
        <g stroke={pp.color} strokeLinecap="round">
          {hairs}
        </g>
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// tear — v10 torn-paper-wipe / v14 torn-seam: seeded zig-zag edge, paper rim, shadow on old side

const Tear: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('tear');
  const fid = useUid('tearf');
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const r = rng(pp.seed * 131 + 7);
  const edge: Edge = [];
  for (let t = ax.tmin - 40 * u; ; t += (0.03 + 0.03 * r()) * ax.M) {
    edge.push([t, (r() - 0.5) * 0.05 * ax.L]);
    if (t > ax.tmax + 40 * u) break;
  }
  const fibre: Edge = edge.map(([t, ds], i) => [t, ds - (3 + 3 * Math.sin(i * 2.3)) * u]);
  const S = ax.smin + lerp(-0.08, 1.08, E.tear(p)) * ax.L;
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, S, edge)} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={6 * u} w={w} h={h} />
        </defs>
        <polyline points={frontLine(ax, S, edge, 7 * u)} fill="none" stroke="#000" strokeOpacity={0.4} strokeWidth={12 * u} filter={`url(#${fid})`} />
        <polyline points={frontLine(ax, S, fibre)} fill="none" stroke={pp.color} strokeOpacity={0.55} strokeWidth={9 * u} strokeLinejoin="round" />
        <polyline points={frontLine(ax, S, edge)} fill="none" stroke={pp.color} strokeWidth={5 * u} strokeLinejoin="miter" />
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// zoom — zoom-through: old scene pushes in & blurs away, new one settles from 0.62

const Zoom: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {u} = useFrameSize();
  const origin = `${pp.x * 100}% ${pp.y * 100}%`;
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{transform: `scale(${1 + 2.6 * Math.pow(p, 2.2)})`, transformOrigin: origin, opacity: 1 - sstep(0.75, 1, p), filter: `blur(${p * 10 * u}px)`}}>
        {children}
      </AbsoluteFill>
    );
  }
  const q = clamp01((p - 0.3) / 0.7);
  return (
    <AbsoluteFill style={{transform: `scale(${0.74 + 0.26 * E.outCubic(q)})`, transformOrigin: origin, opacity: sstep(0.35, 0.72, p), filter: `blur(${(1 - q) * 6 * u}px)`}}>
      {children}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// flash — v6 light-hole-expand: wobbly light hole (gold rim, dark rim, straw rays) swallows the
// frame with easeInExpo, then the new scene fades up out of the light. variant 'plain': white flash.

const PlainFlash: C = ({children, presentationDirection, presentationProgress: t, passedProps}) => {
  const white = presentationDirection === 'exiting' ? Math.min(1, t * 2) : Math.max(0, 1 - (t - 0.5) * 2);
  const show = presentationDirection === 'exiting' ? t < 0.5 : t >= 0.5;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: `brightness(${1 + white * 2})`, opacity: show ? 1 : 0}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{background: passedProps.color, opacity: white, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

const LightHole: C = (props) => {
  const {children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp} = props;
  const {w, h, u} = useFrameSize();
  const gid = useUid('holeg');
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  const A = 0.62;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const maxR = cornerR(cx, cy, w, h);
  if (p >= A) {
    const q = E.outCubic(clamp01((p - A - 0.06) / (1 - A - 0.06)));
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{background: pp.color, opacity: 1 - q}} />
      </AbsoluteFill>
    );
  }
  const a = p / A;
  const R = maxR * 1.25 * (0.1 * E.outCubic(clamp01(a / 0.2)) + 0.9 * E.inExpo(a));
  const f = p * D;
  const n = 64;
  const rad = (ang: number) => R * (1 + 0.06 * n2(`hole${pp.seed}`, Math.cos(ang) * 1.2, Math.sin(ang) * 1.2 + f * 0.05));
  const pts: [number, number][] = Array.from({length: n}, (_, i) => {
    const ang = (i / n) * Math.PI * 2;
    return [cx + Math.cos(ang) * rad(ang), cy + Math.sin(ang) * rad(ang)];
  });
  const d = smoothClosed(pts);
  const r = rng(pp.seed * 53 + 3);
  const scaleRays = Math.sqrt(Math.max(R, 1) / (0.1 * w));
  const rays = Array.from({length: 80}, (_, i) => {
    const ang = r() * Math.PI * 2;
    const r0 = rad(ang) * 0.96;
    const len = (0.15 + 0.2 * r()) * w * 0.6 * scaleRays;
    return (
      <line key={i} x1={cx + Math.cos(ang) * r0} y1={cy + Math.sin(ang) * r0} x2={cx + Math.cos(ang) * (r0 + len)} y2={cy + Math.sin(ang) * (r0 + len)} strokeWidth={(1 + r()) * u} opacity={0.5 + 0.4 * r()} />
    );
  });
  return (
    <AbsoluteFill>
      <Hidden>{children}</Hidden>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={gid} sd={22 * u} w={w} h={h} />
        </defs>
        <g stroke="#A88F67" strokeLinecap="round">
          {rays}
        </g>
        <path d={d} fill="none" stroke={pp.color} strokeWidth={60 * u} opacity={0.45} filter={`url(#${gid})`} />
        <path d={d} fill={pp.color} stroke="#2B1C10" strokeWidth={22 * u} />
        <path d={d} fill="none" stroke="#C99A55" strokeWidth={6 * u} />
      </Overlay>
    </AbsoluteFill>
  );
};

const Flash: C = (props) => (props.passedProps.variant === 'plain' ? <PlainFlash {...props} /> : <LightHole {...props} />);

// ---------------------------------------------------------------------------------------------
// glitch — v8 glitch-layer-rewind: 12-20 bands re-randomised every 1.5 frames, offset sideways
// with black slivers; every band flips from old to new scene on its own (jittered) schedule.

const Glitch: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  const base = useUid('gl');
  const step = Math.floor((p * D) / 1.5);
  const amt = Math.pow(Math.sin(Math.PI * clamp01(p)), 0.6);
  const r = rng(pp.seed * 7919 + step * 31 + 1);
  const K = 3;
  const offs = Array.from({length: K}, () => (r() < 0.5 ? -1 : 1) * (0.005 + 0.035 * r()) * w * amt);
  const bands: {y: number; bh: number; cls: number; isNew: boolean}[] = [];
  for (let y = 0; y < h; ) {
    const bh = (0.02 + 0.06 * r()) * h;
    const j = Math.floor(r() * 3) - 1;
    bands.push({y, bh, cls: Math.floor(r() * K), isNew: p + j * 0.2 > 0.5});
    y += bh;
  }
  const mine = bands.filter((b) => b.isNew === (presentationDirection === 'entering'));
  if (mine.length === 0) return <Hidden>{children}</Hidden>;
  const classes = Array.from({length: K}, (_, k) => k).filter((k) => mine.some((b) => b.cls === k));
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          {classes.map((k) => (
            <mask key={k} id={`${base}${k}`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={-w} y={-h} width={3 * w} height={3 * h}>
              {mine
                .filter((b) => b.cls === k)
                .map((b, i) => (
                  <rect key={i} x={-w} y={b.y} width={3 * w} height={b.bh + 0.6} fill="white" />
                ))}
            </mask>
          ))}
        </defs>
      </svg>
      <Overlay w={w} h={h}>
        {mine.map((b, i) => (
          <rect key={i} x={0} y={b.y} width={w} height={b.bh + 0.6} fill="#000" />
        ))}
      </Overlay>
      {classes.map((k) => (
        <AbsoluteFill key={k} style={{transform: `translateX(${offs[k]}px)`, mask: `url(#${base}${k})`, WebkitMask: `url(#${base}${k})`, filter: `brightness(${1 + 0.25 * amt})`}}>
          {children}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// ripple — v17 ripple-flood: concentric stepped-opacity rings, easeInQuad radius

const Ripple: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('rip');
  const fid = useUid('ripf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const N = Math.max(1, Math.round(pp.bands));
  const b = 14 * u * Math.min(1, 0.25 + p * 3);
  const R = (cornerR(cx, cy, w, h) + (N + 1) * b) * E.inQuad(p);
  return (
    <Masked
      id={id}
      w={w}
      h={h}
      defs={<BlurFilter id={fid} sd={1.4 * u} w={w} h={h} />}
      mask={
        <g filter={`url(#${fid})`}>
          {Array.from({length: N}, (_, k) => (
            <circle key={k} cx={cx} cy={cy} r={R + (k + 0.5) * b} fill="none" stroke={gray(1 - (k + 1) / (N + 1))} strokeWidth={b + 0.5} />
          ))}
          <circle cx={cx} cy={cy} r={R} fill="white" />
        </g>
      }
    >
      {children}
    </Masked>
  );
};

// ---------------------------------------------------------------------------------------------
// spiral — v17 spiral-wipe: Archimedean stripes coil out from a point, widen and fill

const Spiral: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('spi');
  if (presentationDirection === 'exiting' || p >= 0.995) return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const maxR = cornerR(cx, cy, w, h);
  const e = E.inCubic(p);
  const P = Math.min(w, h) * (0.06 + 0.34 * e);
  const sw = P * (0.1 + 1.0 * e);
  const a = P / (2 * Math.PI);
  const ext = maxR * (0.3 + 0.8 * E.outCubic(clamp01(p * 1.5))) + sw;
  const thMax = ext / a;
  const rot = Math.PI * 0.5 + p * Math.PI * 0.8;
  const steps = Math.ceil((thMax / (Math.PI * 2)) * 64);
  const pts: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * thMax;
    const rr = a * th;
    pts.push([cx + Math.cos(th + rot) * rr, cy + Math.sin(th + rot) * rr]);
  }
  const d = 'M ' + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L ');
  return (
    <AbsoluteFill>
      <Overlay w={w} h={h}>
        <path d={d} fill="none" stroke={pp.color} strokeOpacity={0.85} strokeWidth={sw + 7 * u} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={sw * 0.6 + 3.5 * u} fill={pp.color} fillOpacity={0.85} />
      </Overlay>
      <Masked
        id={id}
        w={w}
        h={h}
        mask={
          <>
            <path d={d} fill="none" stroke="white" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={cx} cy={cy} r={sw * 0.6} fill="white" />
          </>
        }
      >
        {children}
      </Masked>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// wave — v17 liquid-wave-wipe: sinusoidal surge front with stepped bands (default from bottom-right)
//        variant 'lines' — v20 wave-line-wipe: wavy ink lines fade over, scenes crossfade underneath

const WaveLines: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  const env = sstep(0, 0.3, p) * (1 - sstep(0.7, 1, p));
  const r = rng(pp.seed * 17 + 5);
  const rows = 16;
  const scroll = ((p * D) / 30) * 0.15 * w;
  const lines = Array.from({length: rows}, (_, i) => {
    const y0 = ((i + 0.5) / rows) * h + (r() - 0.5) * (h / rows) * 0.6;
    const A = (0.015 + 0.015 * r()) * h;
    const lam = (0.2 + 0.15 * r()) * w;
    const ph = r() * Math.PI * 2;
    const sw = (1.5 + 1.5 * r()) * u;
    const op = 0.5 + 0.4 * r();
    const pts: number[][] = [];
    for (let x = -20 * u; x <= w + 20 * u; x += 14 * u) {
      const X = x + scroll;
      pts.push([x, y0 + A * Math.sin((2 * Math.PI * X) / lam + ph) + 0.3 * A * Math.sin((4 * Math.PI * X) / lam + 2 * ph)]);
    }
    return <polyline key={i} points={ptsStr(pts)} fill="none" stroke={pp.color} strokeWidth={sw} strokeOpacity={op} strokeLinejoin="round" />;
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: sstep(0.38, 0.62, p)}}>{children}</AbsoluteFill>
      <Overlay w={w} h={h} style={{opacity: env}}>
        {lines}
      </Overlay>
    </AbsoluteFill>
  );
};

const LiquidWave: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('wav');
  const fid = useUid('wavf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const N = Math.max(1, Math.round(pp.bands));
  const bw = 0.028 * ax.L;
  const A = 0.055 * Math.min(w, h);
  const lam = 0.6 * Math.max(w, h);
  const S = lerp(ax.smin - A * 1.4 - N * bw, ax.smax + A * 1.4, E.inOutCubic(p));
  const ph = p * Math.PI * 1.6;
  const edge = sampleEdge(ax, (t) => A * Math.sin((2 * Math.PI * t) / lam + ph) + 0.3 * A * Math.sin((2 * Math.PI * t) / (0.43 * lam) - 1.7 * ph), 12 * u, 40 * u);
  return (
    <Masked
      id={id}
      w={w}
      h={h}
      defs={<BlurFilter id={fid} sd={1.5 * u} w={w} h={h} />}
      mask={
        <g filter={`url(#${fid})`}>
          {Array.from({length: N + 1}, (_, i) => N - i).map((k) => (
            <polygon key={k} points={region(ax, S + k * bw, edge)} fill={gray(1 - k / (N + 1))} />
          ))}
        </g>
      }
    >
      {children}
    </Masked>
  );
};

const Wave: C = (props) => (props.passedProps.variant === 'lines' ? <WaveLines {...props} /> : <LiquidWave {...props} />);

// ---------------------------------------------------------------------------------------------
// bands — v17 luma-ramp-wipe: straight front with an 8-step posterised soft edge (12 % of travel)
//         variant 'center' — v17 bar-expand-wipe: a line at y thickens into a soft-edged band

const Bands: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  const id = useUid('bnd');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const N = Math.max(1, Math.round(pp.bands));
  const order = Array.from({length: N + 1}, (_, i) => N - i);
  let mask: React.ReactNode;
  if (pp.variant === 'center') {
    const y0 = pp.y * h;
    const bw = (0.05 * h) / N;
    const e = E.inOutQuad(p);
    const top = lerp(y0, -N * bw - 2, e);
    const bot = lerp(y0, h + N * bw + 2, e);
    mask = order.map((k) => <rect key={k} x={-10} y={top - k * bw} width={w + 20} height={Math.max(0, bot - top + 2 * k * bw)} fill={gray(1 - k / (N + 1))} />);
  } else {
    const ax = axisFor(pp.angle, w, h);
    const edgeLen = 0.12 * ax.L;
    const bw = edgeLen / N;
    const S = lerp(ax.smin - edgeLen, ax.smax + 2, 0.5 * p + 0.5 * p * p);
    const edge = straight(ax);
    mask = order.map((k) => <polygon key={k} points={region(ax, S + k * bw, edge)} fill={gray(1 - k / (N + 1))} />);
  }
  return (
    <Masked id={id} w={w} h={h} mask={mask}>
      {children}
    </Masked>
  );
};

// ---------------------------------------------------------------------------------------------
// diagonal — v6 diagonal-palette-wipe: 45° hard boundary, linear, dashed glowing white edge

const Diagonal: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('dia');
  const fid = useUid('diaf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const S = lerp(ax.smin - 2, ax.smax + 2, p);
  const edge = straight(ax);
  const line = frontLine(ax, S, edge);
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, S, edge)} fill="white" />}>
        {children}
      </Masked>
      {p > 0 && (
        <Overlay w={w} h={h}>
          <defs>
            <BlurFilter id={fid} sd={4 * u} w={w} h={h} />
          </defs>
          <polyline points={line} fill="none" stroke={pp.color} strokeWidth={8 * u} strokeOpacity={0.55} filter={`url(#${fid})`} />
          <polyline points={line} fill="none" stroke={pp.color} strokeWidth={3.4 * u} strokeDasharray={`${18 * u} ${11 * u}`} />
        </Overlay>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// push-blur — v10 push-slide-blur + v20 whip-pan-truck: both scenes travel together
// (easeInOutQuart), directional blur from velocity, thin dark seam, ~4 % overshoot that settles.

const pushPos = (p: number) => (p < 0.78 ? 1.04 * E.inOutQuart(p / 0.78) : 1.04 - 0.04 * E.inOutCubic((p - 0.78) / 0.22));

/** whip pan: easeInOutExpo, no overshoot (variant 'whip', `size` = max blur px) */
const pushExpo = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);

const PushBlur: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('pbf');
  const a = (pp.angle * Math.PI) / 180;
  const dx = Math.round(Math.cos(a) * 1000) / 1000;
  const dy = Math.round(Math.sin(a) * 1000) / 1000;
  const L = Math.abs(dx) * w + Math.abs(dy) * h;
  const whip = pp.variant === 'whip';
  const posFn = whip ? pushExpo : pushPos;
  const pos = posFn(clamp01(p));
  const dp = 0.01;
  const vel = ((posFn(clamp01(p + dp)) - posFn(clamp01(p - dp))) / (2 * dp)) * (L / Math.max(1, D));
  const blur = p <= 0 || p >= 1 ? 0 : whip ? Math.min((pp.size || 60) * u, Math.abs(vel) * 0.2) : Math.min(40 * u, Math.abs(vel) * 0.12);
  const filt = blur > 0.3 ? `url(#${fid})` : undefined;
  const defs = (
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${f1(blur * Math.abs(dx))} ${f1(blur * Math.abs(dy))}`} />
        </filter>
      </defs>
    </svg>
  );
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill>
        {defs}
        <AbsoluteFill style={{transform: `translate(${dx * pos * L}px, ${dy * pos * L}px)`, filter: filt}}>{children}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const off = 1 - pos;
  const sc = pos > 1 ? 1 + 2 * (pos - 1) : 1;
  const g = 7 * u;
  const seam: React.CSSProperties = {position: 'absolute', background: '#0a0a0a'};
  if (dx < -0.5) Object.assign(seam, {left: -g, top: 0, width: g, height: h});
  else if (dx > 0.5) Object.assign(seam, {left: w, top: 0, width: g, height: h});
  else if (dy < -0.5) Object.assign(seam, {left: 0, top: -g, width: w, height: g});
  else Object.assign(seam, {left: 0, top: h, width: w, height: g});
  return (
    <AbsoluteFill>
      {defs}
      <AbsoluteFill style={{transform: `translate(${-dx * off * L}px, ${-dy * off * L}px) scale(${sc})`, filter: filt}}>
        {children}
        {p < 1 && <div style={seam} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// page-turn — v1 page-turn-cover: the new scene is a page hinged on a spine (direction side)
// that swings flat, curved free edge, rim highlight, darkening and a cast shadow.
// variant 'roll' — v9 paper-roll-wipe: a paper cylinder unrolls the new scene behind it.

const rollX = (p: number) =>
  p < 0.12 ? lerp(-0.04, 0.15, E.outCubic(p / 0.12)) : p < 0.6 ? lerp(0.15, 0.25, (p - 0.12) / 0.48) : lerp(0.25, 1.06, Math.pow((p - 0.6) / 0.4, 1.45));

const PaperRoll: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('roll');
  const gid = useUid('rollg');
  const sid = useUid('rolls');
  const cid = useUid('rollc');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const tilt = 2;
  const tan = Math.tan((tilt * Math.PI) / 180);
  const rollW = (pp.size || 0.035) * ax.L;
  const tmid = (ax.tmin + ax.tmax) / 2;
  const X = ax.smin + rollX(p) * ax.L;
  const edge: Edge = [
    [ax.tmin - 20, -tan * (ax.tmin - 20 - tmid)],
    [ax.tmax + 20, -tan * (ax.tmax + 20 - tmid)],
  ];
  const [px, py] = at(ax, X, tmid);
  const rotDeg = pp.angle + tilt;
  const H = ax.M * 1.3;
  const notches = Array.from({length: Math.ceil(H / (90 * u))}, (_, i) => -H / 2 + i * 90 * u);
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, X - rollW / 2 + 1, edge)} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#d7d2c7" />
            <stop offset="0.3" stopColor="#f7f5ef" />
            <stop offset="0.45" stopColor="#fffefa" />
            <stop offset="0.7" stopColor="#e4e0d6" />
            <stop offset="1" stopColor="#bdb8ad" />
          </linearGradient>
          <linearGradient id={sid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity={0.25} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={cid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.12} />
          </linearGradient>
        </defs>
        <g transform={`translate(${f1(px)} ${f1(py)}) rotate(${rotDeg})`}>
          <rect x={rollW / 2} y={-H / 2} width={0.03 * ax.L} height={H} fill={`url(#${sid})`} />
          <rect x={-rollW / 2 - 0.01 * ax.L} y={-H / 2} width={0.01 * ax.L} height={H} fill={`url(#${cid})`} />
          <rect x={-rollW / 2} y={-H / 2} width={rollW} height={H} fill={`url(#${gid})`} />
          <line x1={0} y1={-H / 2} x2={0} y2={H / 2} stroke="#6b665c" strokeWidth={1.2 * u} />
          {notches.map((y, i) => (
            <rect key={i} x={-3 * u} y={y} width={6 * u} height={1.6 * u} fill="#57524a" opacity={0.7} />
          ))}
        </g>
      </Overlay>
    </AbsoluteFill>
  );
};

const PageCurl: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('pg');
  const gid = useUid('pgg');
  const fid = useUid('pgf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const uu = E.inOutCubic(p);
  const th = (uu * Math.PI) / 2; // 0 = page upright, pi/2 = flat
  const sinT = Math.sin(th);
  const cosT = Math.cos(th);
  const s0 = ax.smin;
  const xe = s0 + ax.L * sinT;
  const ext = 0.16 * ax.M * cosT;
  const bulge = 0.12 * ax.L * Math.sin(2 * th);
  const tmid = (ax.tmin + ax.tmax) / 2;
  const P = (s: number, t: number) => at(ax, s, t).map(f1).join(' ');
  const pagePath = (xs: number, b: number) =>
    `M ${P(s0 - 4, ax.tmin - 4)} L ${P(xs, ax.tmin - ext)} Q ${P(xs + b, tmid)} ${P(xs, ax.tmax + ext)} L ${P(s0 - 4, ax.tmax + 4)} Z`;
  const d = pagePath(xe, bulge);
  const rim = `M ${P(xe, ax.tmin - ext)} Q ${P(xe + bulge, tmid)} ${P(xe, ax.tmax + ext)}`;
  const shadowD = pagePath(xe + 0.06 * ax.L * cosT + 4 * u, bulge * 1.2);
  const horiz = Math.abs(ax.dx) > 0.5;
  const k = Math.min(1, Math.max(0.02, (ax.L * sinT + Math.max(0, bulge) * 0.5 + 2) / ax.L));
  const origin = horiz ? (ax.dx > 0 ? 'left center' : 'right center') : ax.dy > 0 ? 'center top' : 'center bottom';
  const [gx1, gy1] = at(ax, s0, tmid);
  const [gx2, gy2] = at(ax, xe + bulge * 0.5, tmid);
  return (
    <AbsoluteFill>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={16 * u} w={w} h={h} />
        </defs>
        <path d={shadowD} fill="#000" opacity={0.38 * Math.sin(Math.PI * uu)} filter={`url(#${fid})`} />
      </Overlay>
      <Masked id={id} w={w} h={h} mask={<path d={d} fill="white" />}>
        <AbsoluteFill style={{transform: horiz ? `scaleX(${k})` : `scaleY(${k})`, transformOrigin: origin}}>{children}</AbsoluteFill>
        <Overlay w={w} h={h}>
          <defs>
            <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={gx1} y1={gy1} x2={gx2} y2={gy2}>
              <stop offset="0" stopColor="#000" stopOpacity={0.05 * cosT} />
              <stop offset="0.65" stopColor="#000" stopOpacity={0.18 * cosT} />
              <stop offset="1" stopColor="#000" stopOpacity={0.42 * cosT} />
            </linearGradient>
          </defs>
          <rect x={-10} y={-10} width={w + 20} height={h + 20} fill={`url(#${gid})`} />
        </Overlay>
      </Masked>
      <Overlay w={w} h={h}>
        <path d={rim} fill="none" stroke={pp.color} strokeWidth={3 * u} strokeOpacity={0.9 * (0.3 + 0.7 * cosT)} />
      </Overlay>
    </AbsoluteFill>
  );
};

const PageTurn: C = (props) => (props.passedProps.variant === 'roll' ? <PaperRoll {...props} /> : <PageCurl {...props} />);

// ---------------------------------------------------------------------------------------------
// storm — v1 storm-wall-wipe: scalloped front, 4° slant (bottom leads), ease-in, feathered band
//         variant 'watercolor' — v1 watercolor-front-wipe: fbm wet-paint edge, 15° tilt, 70 px half-opacity band

const Storm: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('stm');
  const fid = useUid('stmf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const horiz = Math.abs(ax.dx) > 0.5;
  const crossNorm = (t: number) => {
    const [x, y] = at(ax, 0, t);
    return horiz ? y / h : x / w;
  };
  const wc = pp.variant === 'watercolor';
  let fn: (t: number) => number;
  let S: number;
  if (wc) {
    const tilt = Math.tan((15 * Math.PI) / 180) * (horiz ? h : w);
    fn = (t) => tilt * (crossNorm(t) - 0.5) + fbm(`wc${pp.seed}`, t * 0.004, 0.5, 3) * 0.04 * ax.L;
    S = ax.smin + lerp(-0.2, 1.2, p) * ax.L;
  } else {
    const r = rng(pp.seed * 41 + 9);
    const arcs: {c: number; rad: number}[] = [];
    for (let c = ax.tmin - 60 * u; c < ax.tmax + 60 * u; ) {
      const rad = (0.03 + 0.02 * r()) * ax.M;
      arcs.push({c: c + rad, rad});
      c += rad * 2;
    }
    const bump = (t: number) => {
      for (const a of arcs) if (Math.abs(t - a.c) <= a.rad) return a.rad * Math.sqrt(Math.max(0, 1 - ((t - a.c) / a.rad) ** 2));
      return 0;
    };
    fn = (t) => 0.08 * ax.L * (crossNorm(t) - 0.5) + bump(t);
    const m = 0.06 * ax.L + 0.06 * ax.M;
    S = lerp(ax.smin - m, ax.smax + m, E.inQuad(p));
  }
  const edge = sampleEdge(ax, fn, (wc ? 10 : 4) * u, 60 * u);
  const feather = (wc ? 70 : 40) * u;
  return (
    <AbsoluteFill>
      <Masked
        id={id}
        w={w}
        h={h}
        defs={<BlurFilter id={fid} sd={(wc ? 12 : 1.6) * u} w={w} h={h} />}
        mask={
          <g filter={`url(#${fid})`}>
            <polygon points={region(ax, S + feather, edge)} fill={gray(wc ? 0.5 : 0.42)} />
            <polygon points={region(ax, S, edge)} fill="white" />
          </g>
        }
      >
        {children}
      </Masked>
      {!wc && (
        <Overlay w={w} h={h}>
          <polyline points={frontLine(ax, S, edge)} fill="none" stroke={pp.color} strokeWidth={2.5 * u} strokeLinejoin="round" />
        </Overlay>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// whiteout — v16 bloom-whiteout: ramp 0.3 s (easeInQuad, brightness+blur) → hold 0.4 s → milky
//            fade up 0.7 s (blur 12→0, contrast 0.7→1).
//   'burnout'  — v16 glow-burnout-cut: radial glow + god-rays from (x,y), easeInExpo white, HARD cut
//   'blizzard' — v21 blizzard-whiteout-dissolve: hard cut to blue-grey white-out with streaming
//                pixel snow, next scene fades in underneath (ease-out)

const Snow: React.FC<{w: number; h: number; u: number; f: number; density: number; seed: number}> = ({w, h, u, f, density, seed}) => {
  const r = rng(seed * 313 + 11);
  const flakes: React.ReactNode[] = [];
  const W = w + 100 * u;
  for (let i = 0; i < 600; i++) {
    const sx = r() * W;
    const sy = r() * h;
    const vx = (900 + 700 * r()) / 30 * (w / 1920);
    const vy = (50 + 100 * r()) / 30 * (w / 1920);
    const big = r() < 0.3;
    const op = 0.6 + 0.4 * r();
    const show = r() < density;
    const streak = r() < 0.25;
    if (!show) continue;
    const x = (((sx + f * vx) % W) + W) % W - 50 * u;
    const y = (((sy + f * vy) % h) + h) % h;
    const g = 6 * u;
    const X = Math.round(x / g) * g;
    const Y = Math.round(y / g) * g;
    flakes.push(<rect key={i} x={X} y={Y} width={big ? 2 * g : g} height={g} fill="#fff" opacity={op} />);
    if (streak) flakes.push(<line key={`s${i}`} x1={X - vx * 1.2} y1={Y + g / 2} x2={X} y2={Y + g / 2} stroke="#fff" strokeOpacity={0.22} strokeWidth={1.5 * u} />);
  }
  return <Overlay w={w} h={h}>{flakes}</Overlay>;
};

const Whiteout: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const gid = useUid('wog');
  const v = pp.variant;
  const f = p * D;
  if (v === 'blizzard') {
    if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
    const q = E.outCubic(clamp01((p - 0.15) / 0.85));
    const density = p < 0.15 ? 1 : lerp(1, 0.35, sstep(0.15, 0.6, p)) * (1 - sstep(0.75, 1, p));
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{background: `radial-gradient(ellipse at center, ${pp.color} 0%, ${pp.color} 35%, #727A8E 100%)`}} />
        <AbsoluteFill style={{opacity: q}}>{children}</AbsoluteFill>
        {density > 0.01 && <Snow w={w} h={h} u={u} f={f} density={density} seed={pp.seed} />}
      </AbsoluteFill>
    );
  }
  if (v === 'burnout') {
    if (presentationDirection === 'entering') return <Hidden>{children}</Hidden>;
    const q = clamp01(p / 0.75);
    const cx = pp.x * w;
    const cy = pp.y * h;
    const gr = lerp(300, 2000, E.inQuad(q)) * u;
    const rot = f * 0.4;
    const len = Math.max(w, h) * 1.5;
    const rays = Array.from({length: 24}, (_, i) => {
      const a = ((i / 24) * 360 + rot) * (Math.PI / 180);
      const da = 0.022;
      return (
        <polygon
          key={i}
          points={ptsStr([
            [cx, cy],
            [cx + Math.cos(a - da) * len, cy + Math.sin(a - da) * len],
            [cx + Math.cos(a + da) * len, cy + Math.sin(a + da) * len],
          ])}
          fill="#fff"
          opacity={0.15 * Math.min(1, q * 2)}
        />
      );
    });
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: `brightness(${1 + 1.2 * q})`}}>{children}</AbsoluteFill>
        <Overlay w={w} h={h} style={{mixBlendMode: 'screen'}}>
          <defs>
            <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={gr}>
              <stop offset="0" stopColor="#fff" stopOpacity={0.95} />
              <stop offset="0.35" stopColor="#fff6dc" stopOpacity={0.55} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
          </defs>
          {rays}
          <rect x={0} y={0} width={w} height={h} fill={`url(#${gid})`} opacity={Math.min(1, q * 1.5)} />
        </Overlay>
        <AbsoluteFill style={{background: pp.color, opacity: E.inExpo(q)}} />
      </AbsoluteFill>
    );
  }
  const A = 0.214;
  const B = 0.5;
  if (presentationDirection === 'exiting') {
    const q = E.inQuad(clamp01(p / A));
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: `brightness(${1 + 2 * q}) blur(${4 * q * u}px)`}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{background: pp.color, opacity: q}} />
      </AbsoluteFill>
    );
  }
  if (p < B) return <Hidden>{children}</Hidden>;
  const q = E.outCubic((p - B) / (1 - B));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: q < 1 ? `blur(${(1 - q) * 12 * u}px) contrast(${0.7 + 0.3 * q})` : undefined}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{background: pp.color, opacity: 1 - q}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// bar — v19 bar-slide-wipe: a thin grey-white bar sweeps across; the cut happens underneath it.
//       variant 'black': old → bar on black → new (the source's two black frames)

const Bar: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  const id = useUid('bar');
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const bw = (pp.size || 0.036) * ax.L;
  const S = lerp(ax.smin - bw, ax.smax + bw, E.sweep(p));
  const edge = straight(ax);
  const barPts = ptsStr([at(ax, S - bw / 2, ax.tmin - 10), at(ax, S + bw / 2, ax.tmin - 10), at(ax, S + bw / 2, ax.tmax + 10), at(ax, S - bw / 2, ax.tmax + 10)]);
  const bar = (
    <Overlay w={w} h={h}>
      <polygon points={barPts} fill={pp.color} />
    </Overlay>
  );
  if (pp.variant === 'black') {
    const phase = p < 0.36 ? 0 : p < 0.64 ? 1 : 2;
    return (
      <AbsoluteFill>
        {phase === 2 ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
        {phase === 1 && <AbsoluteFill style={{background: '#000'}} />}
        {bar}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, S, edge)} fill="white" />}>
        {children}
      </Masked>
      {bar}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// strip — v21 eye-strip-slam: a full-width band slams open from the centre line (6 f,
// bezier(.3,0,.2,1)) to `size`·H over the dimmed old scene, holds, then floods the frame.

const Strip: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {h} = useFrameSize();
  const o = E.slam(clamp01(p / 0.28));
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{background: '#000', opacity: 0.75 * o}} />
      </AbsoluteFill>
    );
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  const e = E.inOutCubic(clamp01((p - 0.62) / 0.38));
  const cy = pp.y * h;
  const half = lerp(((pp.size || 0.4) * h * o) / 2, Math.max(cy, h - cy) + 2, e);
  const top = Math.max(0, cy - half);
  const bot = Math.max(0, h - (cy + half));
  return (
    <AbsoluteFill style={{clipPath: `inset(${top}px 0px ${bot}px 0px)`}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.06 * (1 - o)})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// dots — v18 dot-zoom-punch: the old scene breaks into a dot grid that zooms (pitch 56→520 u,
//        easeInCubic) while the dots shrink away; glow + R/B fringe on dot edges.
//        variant 'bokeh' — v18 particle-burst-zoom: soft discs fly at the camera, new scene fades in.

const BOKEH = ['#E4572E', '#17A398', '#F3E9D2', '#2E4A3F', '#F2A541'];

const Bokeh: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('bkf');
  const cx = pp.x * w;
  const cy = pp.y * h;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{transform: `scale(${1 + 0.35 * E.inQuad(p)})`, transformOrigin: `${pp.x * 100}% ${pp.y * 100}%`}}>{children}</AbsoluteFill>;
  }
  const pal = pp.color && pp.color !== '#ffffff' ? [pp.color, ...BOKEH] : BOKEH;
  const r = rng(pp.seed * 101 + 3);
  const md = Math.min(w, h);
  const discs: React.ReactNode[] = [];
  for (let i = 0; i < 150; i++) {
    const ang = r() * Math.PI * 2;
    const r0 = (0.02 + 0.3 * r()) * md;
    const start = r() * 0.35;
    const dur = 0.45 + 0.2 * r();
    const rb = (5 + 12 * r()) * u;
    const col = pal[Math.floor(r() * pal.length) % pal.length];
    const q = (p - start) / dur;
    if (q <= 0 || q >= 1) continue;
    const op = 0.85 * sstep(0, 0.1, q) * (1 - sstep(0.7, 1, q));
    for (let g = 3; g >= 0; g--) {
      const qg = q - g * 0.035;
      if (qg <= 0) continue;
      const z = lerp(1, 0.1, E.inQuad(qg));
      discs.push(<circle key={`${i}-${g}`} cx={cx + Math.cos(ang) * (r0 / z)} cy={cy + Math.sin(ang) * (r0 / z)} r={Math.min(rb / z, 0.4 * md)} fill={col} opacity={op * (g === 0 ? 1 : 0.22 * (1 - g / 4))} />);
    }
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: sstep(0.3, 0.75, p)}}>{children}</AbsoluteFill>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={4 * u} w={w} h={h} />
        </defs>
        <g filter={`url(#${fid})`}>{discs}</g>
      </Overlay>
    </AbsoluteFill>
  );
};

const DotPunch: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('dot');
  const fid = useUid('dotf');
  const cx = pp.x * w;
  const cy = pp.y * h;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{transform: `scale(${1 + 0.6 * E.inCubic(p)})`, transformOrigin: `${pp.x * 100}% ${pp.y * 100}%`}}>{children}</AbsoluteFill>;
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  const P = lerp(56, 520, E.inCubic(p)) * u;
  const ratio = 0.72 * (1 - sstep(0.08, 1, p));
  const rad = ratio * P;
  const dots: [number, number][] = [];
  if (rad > 0.5) {
    const i0 = Math.floor(-cx / P) - 1;
    const i1 = Math.ceil((w - cx) / P) + 1;
    const j0 = Math.floor(-cy / P) - 1;
    const j1 = Math.ceil((h - cy) / P) + 1;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) dots.push([cx + i * P, cy + j * P]);
  }
  const fringe = dots.length < 500 && p > 0.15;
  const fo = Math.min(1, (p - 0.15) * 4);
  return (
    <AbsoluteFill>
      <Masked
        id={id}
        w={w}
        h={h}
        mask={
          <>
            <rect x={-w} y={-h} width={3 * w} height={3 * h} fill="white" />
            {dots.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={rad} fill="black" />
            ))}
          </>
        }
      >
        {children}
      </Masked>
      {fringe && (
        <Overlay w={w} h={h} style={{mixBlendMode: 'screen', opacity: fo}}>
          <defs>
            <BlurFilter id={fid} sd={3 * u} w={w} h={h} />
          </defs>
          <g fill="none" filter={`url(#${fid})`}>
            {dots.map(([x, y], i) => (
              <React.Fragment key={i}>
                <circle cx={x - 4 * u} cy={y} r={rad} stroke="#ff3030" strokeWidth={3 * u} strokeOpacity={0.55} />
                <circle cx={x + 4 * u} cy={y} r={rad} stroke="#3060ff" strokeWidth={3 * u} strokeOpacity={0.55} />
                <circle cx={x} cy={y} r={rad} stroke={pp.color} strokeWidth={6 * u} strokeOpacity={0.3} />
              </React.Fragment>
            ))}
          </g>
        </Overlay>
      )}
    </AbsoluteFill>
  );
};

const Dots: C = (props) => (props.passedProps.variant === 'bokeh' ? <Bokeh {...props} /> : <DotPunch {...props} />);

// ---------------------------------------------------------------------------------------------
// xray — v6 xray-hatch-hole: noisy circular hole (easeInQuad) with a 30-50 px ring of short
// hand-hatched ink strokes (±25° around radial), re-seeded every 2 frames for boil.

const Xray: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('xr');
  const fid = useUid('xrf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const R = (cornerR(cx, cy, w, h) * 1.1 + 30 * u) * E.inQuad(p);
  const boil = Math.floor((p * D) / 2);
  const rad = (a: number) => R * (1 + 0.05 * n2(`xr${pp.seed}`, Math.cos(a) * 2, Math.sin(a) * 2 + boil * 0.3));
  const n = 72;
  const d = smoothClosed(
    Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [cx + Math.cos(a) * rad(a), cy + Math.sin(a) * rad(a)] as [number, number];
    }),
  );
  const r = rng(pp.seed * 13 + boil * 7 + 2);
  const clusters = Math.min(650, Math.round((2 * Math.PI * R) / (7 * u)));
  const grow = Math.min(1, R / (80 * u));
  let hatch = '';
  let hatchLight = '';
  for (let i = 0; i < clusters; i++) {
    const a = r() * Math.PI * 2;
    const rr = rad(a) + (r() - 0.4) * 44 * u;
    const da = a + (r() - 0.5) * 0.87;
    const len = (20 + 20 * r()) * u * grow;
    const lines = 2 + Math.floor(r() * 3);
    const gap = (4 + 2 * r()) * u;
    const light = r() < 0.18;
    const cx0 = cx + Math.cos(a) * rr;
    const cy0 = cy + Math.sin(a) * rr;
    const ux = Math.cos(da);
    const uy = Math.sin(da);
    for (let j = 0; j < lines; j++) {
      const o = (j - (lines - 1) / 2) * gap;
      const x = cx0 - uy * o;
      const y = cy0 + ux * o;
      const l = len * (0.75 + 0.25 * r());
      const seg = `M${f1(x - (ux * l) / 2)} ${f1(y - (uy * l) / 2)}L${f1(x + (ux * l) / 2)} ${f1(y + (uy * l) / 2)}`;
      if (light) hatchLight += seg;
      else hatch += seg;
    }
  }
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<path d={d} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={5 * u} w={w} h={h} />
        </defs>
        <path d={d} fill="none" stroke={pp.color} strokeWidth={16 * u} opacity={0.55} filter={`url(#${fid})`} />
        <path d={hatchLight} fill="none" stroke="#efe3c8" strokeOpacity={0.55} strokeWidth={1.4 * u} strokeLinecap="round" />
        <path d={hatch} fill="none" stroke={pp.color} strokeOpacity={0.9} strokeWidth={1.8 * u} strokeLinecap="round" />
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------

const custom = (component: C, props: P): TransitionPresentation<P> => ({component, props});
type Dir4 = 'from-left' | 'from-right' | 'from-top' | 'from-bottom';

export const presentationFor = (s: TransitionSpec, width = 1920, height = 1080): TransitionPresentation<any> => {
  const def = defOf(s);
  const variant = variantOf(s);
  const dir4: Dir4 | undefined = s.direction && s.direction !== 'from-center' ? s.direction : undefined;
  const pp: P = {
    x: s.x ?? def.x ?? 0.5,
    y: s.y ?? def.y ?? 0.5,
    color: s.color ?? def.color ?? '#ffffff',
    colors: s.colors && s.colors.length ? s.colors : def.colors ?? [],
    text: s.text ?? def.text ?? '',
    angle: s.angle ?? (dir4 ? DIR_ANGLE[dir4] : def.angle ?? 0),
    bands: s.bands ?? def.bands ?? 8,
    size: s.size ?? def.size ?? 0,
    variant,
    seed: s.seed ?? 1,
    shape: s.shape ?? '',
    hold: s.hold ?? 0,
    holdRadius: s.holdRadius ?? def.holdRadius ?? 0.22,
    feather: s.feather ?? 0,
    x2: s.x2 ?? def.x2 ?? s.x ?? def.x ?? 0.5,
    y2: s.y2 ?? def.y2 ?? s.y ?? def.y ?? 0.5,
    rim: s.rim ?? def.rim ?? 4,
    mode: s.mode ?? '',
  };
  switch (s.type) {
    case 'slide':
      return variant === 'scroll' ? custom(Scroll, pp) : slide({direction: dir4 ?? 'from-right'});
    case 'wipe':
      if (variant === 'band') return custom(Bar, pp);
      if (variant === 'brush' || variant === 'soft' || variant === 'mist') return custom(WipeX, pp);
      return wipe({direction: dir4 ?? 'from-left'});
    case 'clock':
      return clockWipe({width, height});
    case 'flip':
      return flip();
    case 'iris':
      return custom(variant || s.shape || s.hold || s.mode || s.feather || s.x2 !== undefined || s.y2 !== undefined || s.rim !== undefined ? IrisPlus : Iris, pp);
    case 'blob':
      return custom(variant === 'fog' ? BlobFog : variant === 'ink' ? BlobInk : variant === 'bubble' ? BlobBubble : Blob, pp);
    case 'tear':
      return custom(variant === 'peel' ? TearPeel : Tear, pp);
    case 'zoom':
      return custom(variant === 'snap' ? ZoomSnap : Zoom, pp);
    case 'flash':
      return custom(Flash, pp);
    case 'glitch':
      return custom(Glitch, pp);
    case 'ripple':
      return custom(Ripple, pp);
    case 'spiral':
      return custom(Spiral, pp);
    case 'wave':
      return custom(Wave, pp);
    case 'bands':
      return custom(variant === 'line' ? LineOpen : variant === 'rows' || variant === 'cols' || variant === 'quarter' ? GridCut : Bands, pp);
    case 'diagonal':
      return custom(variant === 'stepped' ? SteppedDiagonal : variant === 'band' ? PackageBand : variant === 'strips' ? DiagStrips : Diagonal, pp);
    case 'push-blur':
      return custom(PushBlur, pp);
    case 'page-turn':
      return custom(variant === 'curl3d' ? Curl3d : PageTurn, pp);
    case 'storm':
      return custom(Storm, pp);
    case 'whiteout':
      return custom(Whiteout, pp);
    case 'bar':
      return custom(Bar, pp);
    case 'strip':
      return custom(variant === 'shutter' ? Shutter : Strip, pp);
    case 'dots':
      return custom(variant === 'halftone' ? Halftone : Dots, pp);
    case 'xray':
      return custom(Xray, pp);
    case 'door':
      return custom(Door, pp);
    case 'curtain':
      return custom(Curtain, pp);
    case 'crt':
      return custom(Crt, pp);
    case 'tracking':
      return custom(Tracking, pp);
    case 'lights':
      return custom(Lights, pp);
    case 'screen':
      return custom(ScreenPush, pp);
    case 'expand':
      return custom(Expand, pp);
    case 'brush':
      return custom(Brush, pp);
    case 'squeegee':
      return custom(Squeegee, pp);
    case 'overprint':
      return custom(Overprint, pp);
    case 'erase':
      return custom(Erase, pp);
    case 'stripes':
      return custom(Stripes, pp);
    case 'flood':
      return custom(Flood, pp);
    case 'rewrite':
      return custom(Rewrite, pp);
    case 'ball':
      return custom(Ball, pp);
    case 'shockwave':
      return custom(Shockwave, pp);
    case 'portal':
      return custom(Portal, pp);
    case 'occluder':
      return custom(Occluder, pp);
    case 'layer-swap':
      return custom(LayerSwap, pp);
    case 'burn':
      return custom(Burn, pp);
    case 'scan':
      return custom(Scan, pp);
    case 'blinds':
      return custom(Blinds, pp);
    case 'tiles':
      return custom(Tiles, pp);
    case 'mosaic':
      return custom(MosaicT, pp);
    default:
      return fade();
  }
};
