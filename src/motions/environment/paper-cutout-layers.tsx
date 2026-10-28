import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, onTwos, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {DeckleFilter, PAPER_KINDS, PaperKind, measureText, paperShadow, paperShape} from '../../core/r2-pr1-kit';
import {PaperTexture, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A scene made of flat coloured paper layers (data-driven): each layer is a shape or a line of text with a deckled edge
 * (turbulence displacement, boiling between 3 variants), a soft drop shadow that grows with depth, and a fibre texture
 * over everything. Layers slide up with a 4-8 degree rotation that settles to 0, the camera drifts for parallax and the
 * whole thing is stepped on twos (12 fps stop-motion feel). The building blocks (`paperShape`, `DeckleFilter`,
 * `paperShadow`) live in src/core/r2-pr1-kit.tsx so other SVG scenes can reuse the paper look.
 */

type Layer = {
  kind: PaperKind | 'text';
  /** hex colour or an index into `palette` */
  color: string | number;
  /** centre in % of the frame */
  x: number;
  y: number;
  /** band kinds (rect, hill, wave): width in % of frame width; objects: size in % of the short side; text: box width in % of frame width */
  w: number;
  /** band kinds: height in % of frame height */
  h?: number;
  /** 0 = flat on the table (no shadow) ... 4 = high above; also parallax strength */
  depth?: number;
  delay?: number;
  rot?: number;
  text?: string;
};
type Props = {
  layers: Layer[];
  palette: string[];
  step: number;
  shadow: number;
  drift: number;
  edge: number;
  grain: number;
  seed: number;
  background: string;
};

const BAND = new Set(['rect', 'hill', 'wave']);
const ASPECT: Record<string, number> = {circle: 1, ring: 1, star: 1, cloud: 0.5, tree: 1.3, sail: 1.1, blob: 0.85};

const PaperCutoutLayers: React.FC<Props> = ({layers, palette, step, shadow, drift, edge, grain, seed, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const f = onTwos(frame, Math.max(1, Math.round(step)));
  const boil = Math.floor(f / (Math.max(1, step) * 2)) % 3;
  const short = Math.min(w, h);

  const colorOf = (c: string | number) => (typeof c === 'number' ? palette[((c % palette.length) + palette.length) % palette.length] : c);
  const camX = Math.sin(f / 70) * drift * u;
  const camY = Math.cos(f / 95) * drift * 0.35 * u;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      {layers.map((l, i) => {
        const depth = l.depth ?? 1;
        const delay = l.delay ?? 4 + i * 4;
        const e = prog(f, delay, delay + 18, ease.back);
        const eo = prog(f, delay, delay + 18, ease.out);
        if (eo <= 0) return null;
        const sign = i % 2 ? 1 : -1;
        const rot0 = sign * (4 + (i % 3) * 2);
        const cx = (l.x / 100) * w;
        const cy = (l.y / 100) * h;
        const isBand = BAND.has(l.kind);
        const bw = isBand ? (l.w / 100) * w : (l.w / 100) * short;
        const bh = isBand ? ((l.h ?? 30) / 100) * h : bw * (ASPECT[l.kind] ?? 1);
        const sway = Math.sin(f / 46 + i * 1.3) * 0.5;
        const rot = (l.rot ?? 0) + rot0 * (1 - eo) + sway * (isBand ? 0.15 : 1);
        const dy = (1 - eo) * h * 0.13 * (0.6 + depth * 0.25) + Math.sin(f / 38 + i) * 2.4 * u * (isBand ? 0.3 : 1);
        const px = camX * depth * 0.9;
        const py = camY * depth * 0.9;
        const scale = 0.94 + 0.06 * Math.min(1.08, e);
        const col = colorOf(l.color);
        const fid = `pcl-${i}`;
        const sh = depth > 0 ? paperShadow(depth * (0.6 + 0.4 * eo), u, shadow) : undefined;
        const fseed = 5 + i * 7 + boil + seed;
        let body: React.ReactNode;
        if (l.kind === 'text') {
          const txt = l.text ?? 'Paper';
          const targetW = (l.w / 100) * w;
          const fsz = Math.min(targetW / (measureText(txt, fonts.display, 100, 400) / 100), 240 * u);
          body = (
            <text x={cx} y={cy + fsz * 0.34} textAnchor="middle" fontFamily={fonts.display} fontSize={fsz} fill={col} stroke={col} strokeWidth={fsz * 0.03} strokeLinejoin="round">
              {txt}
            </text>
          );
        } else {
          body = paperShape(l.kind as PaperKind, cx - bw / 2, cy - bh / 2, bw, bh, col, seed + i);
        }
        return (
          <svg
            key={i}
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'visible',
              filter: sh,
              transform: `translate(${px}px, ${py + dy}px) rotate(${rot}deg) scale(${isBand ? 1 : scale})`,
              transformOrigin: `${cx}px ${cy}px`,
              opacity: Math.min(1, eo * 3),
            }}
          >
            <defs>
              <DeckleFilter id={fid} scale={edge * u} seed={fseed} />
            </defs>
            <g filter={edge > 0 ? `url(#${fid})` : undefined}>{body}</g>
          </svg>
        );
      })}
      <PaperTexture opacity={grain} seed={4} scale={0.9} tint="#8a7350" />
      <Vignette strength={0.32} color="60,35,10" />
    </AbsoluteFill>
  );
};

void PAPER_KINDS;

const PAL = ['#F7E3C3', '#F4A261', '#FFFDF6', '#9CCBB4', '#66AA90', '#3F8670', '#2F6F8F', '#E76F51', '#264653'];

export const paperCutoutLayers = defineMotion<Props>({
  id: 'paper-cutout-layers',
  title: 'Paper cut-out layers (stop-motion)',
  category: 'environment',
  description:
    'A scene built from flat coloured paper layers with deckled edges and soft drop shadows that grow with depth, fibre grain over everything: layers slide up with a 4-8 degree rotation that settles to 0, a sun, clouds, three hills, a paper sea and a sailboat bob and drift in parallax, a paper-cut title lands last, all stepped on twos (12 fps stop-motion).',
  source: ['prompt-corpus: paper-cutout-layers (20 cases)', 'awesome-opus5-5-videos prompts (MIT) — technique only'],
  useFor: 'Kids / education explainers, festive greetings, charity stories and warm brand films: pass your own `layers` (shapes or text) and `palette`; reuse `paperShape` / `DeckleFilter` / `paperShadow` from r2-pr1-kit to give any SVG scene the paper look. For a fixed pop-up landscape see paper-diorama.',
  durationInFrames: 180,
  defaultProps: {
    layers: [
      {kind: 'rect', color: 0, x: 50, y: 50, w: 124, h: 110, depth: 0, delay: 0},
      {kind: 'circle', color: 1, x: 80, y: 44, w: 24, depth: 0.6, delay: 6},
      {kind: 'cloud', color: 2, x: 15, y: 38, w: 24, depth: 0.9, delay: 12},
      {kind: 'cloud', color: 2, x: 84, y: 14, w: 17, depth: 0.8, delay: 16},
      {kind: 'hill', color: 3, x: 28, y: 66, w: 72, h: 44, depth: 1.2, delay: 20},
      {kind: 'hill', color: 3, x: 80, y: 68, w: 62, h: 38, depth: 1.1, delay: 24},
      {kind: 'hill', color: 4, x: 48, y: 78, w: 120, h: 40, depth: 1.8, delay: 30},
      {kind: 'wave', color: 6, x: 50, y: 88, w: 124, h: 24, depth: 2.4, delay: 38},
      {kind: 'sail', color: 7, x: 42, y: 79, w: 15, depth: 2.8, delay: 48},
      {kind: 'wave', color: 8, x: 50, y: 96, w: 124, h: 20, depth: 3.4, delay: 56},
      {kind: 'text', text: 'Paper days', color: 8, x: 50, y: 20, w: 54, depth: 3.8, delay: 70},
    ],
    palette: PAL,
    step: 2,
    shadow: 1,
    drift: 22,
    edge: 5,
    grain: 0.5,
    seed: 3,
    background: '#F7E3C3',
  },
  propDocs: {
    layers: "[{kind:'rect'|'circle'|'hill'|'wave'|'cloud'|'tree'|'star'|'blob'|'sail'|'ring'|'text', color: hex | palette index, x, y (centre, % of frame), w (bands: % of frame width; objects: % of the short side; text: % of frame width), h? (bands: % of frame height), depth 0-4, delay?, rot?, text?}]",
    palette: 'colours that layers can reference by index',
    step: 'hold each drawing for n frames (2 = 12 fps stop-motion)',
    shadow: 'drop-shadow strength (0 = none, 1 = default)',
    drift: 'camera parallax drift in u',
    edge: 'deckled-edge roughness in u (0 = clean)',
    grain: 'paper fibre overlay opacity',
    seed: 'edge / hill shape seed',
    background: 'table colour behind the layers',
  },
  component: PaperCutoutLayers,
  tags: ['paper', 'paper cut', 'papercut', 'cutout', 'layers', 'stop motion', 'stop-motion', 'parallax', 'shadow', 'deckle', 'craft', 'kids', 'education', 'greeting', 'festive', 'charity', 'storybook', 'collage', 'environment'],
});
