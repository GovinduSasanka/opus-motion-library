// Adapted from lemo-opuscar/styles/ink-wash/demo/ink.js (brush engine: bristle loads, flying white) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {brushStroke, eio3, INK, InkBleedDef, InkPoint, InkProfileName, lf, RicePaper, seg} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type StrokeSpec = {
  path: InkPoint[]; // 0..1 frame fractions (x, y, pressure)
  width: number; // in u
  dry: number;
  tone: number;
  at: number;
  dur: number;
  profile?: InkProfileName;
  darkSide?: number;
  color?: string;
};
type Props = {
  strokes: StrokeSpec[];
  preset: 'swoosh' | 'underline' | 'enso' | 'bamboo' | 'none';
  caption: string;
  color: string;
  background: string;
  paper: boolean;
  bleed: number;
  seed: number;
};

const PRESETS: Record<string, StrokeSpec[]> = {
  swoosh: [
    {path: [[0.14, 0.62, 0.35], [0.3, 0.44, 0.95], [0.52, 0.38, 1], [0.72, 0.42, 0.75], [0.88, 0.34, 0.3]], width: 92, dry: 0.42, tone: 0.9, at: 10, dur: 5, profile: 'brush', darkSide: 1},
    {path: [[0.3, 0.6, 0.5], [0.46, 0.57, 0.85], [0.62, 0.6, 0.6], [0.74, 0.55, 0.25]], width: 40, dry: 0.58, tone: 0.62, at: 26, dur: 7, profile: 'tip', darkSide: -1},
  ],
  underline: [{path: [[0.12, 0.56, 0.6], [0.4, 0.53, 1], [0.7, 0.55, 0.85], [0.9, 0.52, 0.25]], width: 46, dry: 0.5, tone: 0.88, at: 8, dur: 6, profile: 'brush', darkSide: 1}],
  enso: [
    {
      path: Array.from({length: 26}, (_, i): InkPoint => {
        const a = -Math.PI / 2 + (i / 25) * Math.PI * 1.82;
        const r = 0.26 * (1 + 0.04 * Math.sin(i * 1.3));
        return [0.5 + Math.cos(a) * r * 0.62, 0.46 + Math.sin(a) * r, i < 3 ? 0.5 + i * 0.2 : 1 - (i / 25) * 0.55];
      }),
      width: 64,
      dry: 0.5,
      tone: 0.9,
      at: 8,
      dur: 22,
      profile: 'even',
      darkSide: 1,
    },
  ],
  bamboo: [
    {path: [[0.3, 0.9, 0.9], [0.31, 0.68, 1], [0.3, 0.5, 0.95]], width: 34, dry: 0.34, tone: 0.9, at: 6, dur: 6, profile: 'even', darkSide: 1},
    {path: [[0.3, 0.47, 0.95], [0.32, 0.3, 1], [0.31, 0.14, 0.9]], width: 30, dry: 0.4, tone: 0.82, at: 16, dur: 6, profile: 'even', darkSide: 1},
    {path: [[0.32, 0.42, 0.9], [0.45, 0.36, 0.8], [0.6, 0.34, 0.3]], width: 22, dry: 0.55, tone: 0.72, at: 26, dur: 4, profile: 'tip'},
    {path: [[0.33, 0.25, 0.9], [0.47, 0.17, 0.75], [0.58, 0.12, 0.25]], width: 20, dry: 0.55, tone: 0.66, at: 33, dur: 4, profile: 'tip'},
    {path: [[0.42, 0.37, 0.25], [0.53, 0.42, 1], [0.64, 0.49, 0.1]], width: 42, dry: 0.28, tone: 0.95, at: 40, dur: 3, profile: 'lens', darkSide: 1},
    {path: [[0.43, 0.39, 0.25], [0.5, 0.49, 1], [0.55, 0.58, 0.08]], width: 38, dry: 0.3, tone: 0.8, at: 44, dur: 3, profile: 'lens', darkSide: 1},
    {path: [[0.45, 0.17, 0.25], [0.56, 0.2, 1], [0.68, 0.27, 0.1]], width: 40, dry: 0.3, tone: 0.9, at: 48, dur: 3, profile: 'lens', darkSide: 1},
    {path: [[0.46, 0.18, 0.25], [0.55, 0.26, 1], [0.6, 0.35, 0.08]], width: 36, dry: 0.32, tone: 0.76, at: 52, dur: 3, profile: 'lens', darkSide: 1},
  ],
  none: [],
};
// bamboo node ticks drawn after the trunk
const BAMBOO_NODES: InkPoint[][] = [
  [[0.287, 0.495, 1], [0.315, 0.49, 1]],
  [[0.297, 0.675, 1], [0.325, 0.67, 1]],
];

const InkBrushStroke: React.FC<Props> = ({strokes, preset, caption, color, background, paper, bleed, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const list = strokes.length ? strokes : PRESETS[preset] ?? [];
  const clear = background === 'transparent';
  const capIn = eio3(seg(frame, 56, 74));
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background === 'paper' ? INK.paper : background, overflow: 'hidden'}}>
      {!clear && paper && <RicePaper w={w} h={h} id="ibs-paper" paper={background === 'paper' ? INK.paper : background} seed={seed} />}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkBleedDef id="ibs-bleed" u={u} bleed={bleed} />
        </defs>
        <g filter={bleed > 0 ? 'url(#ibs-bleed)' : undefined}>
          {preset === 'bamboo' && !strokes.length &&
            BAMBOO_NODES.map((nd, i) => {
              const k = seg(frame, 22 + i * 10, 25 + i * 10);
              if (k <= 0) return null;
              const x0 = nd[0][0] * w;
              const x1 = x0 + (nd[1][0] - nd[0][0]) * w * k;
              const y = (py: number) => py * (portrait ? h * 0.72 : h) + (portrait ? h * 0.1 : 0);
              return <path key={'n' + i} d={`M${x0} ${y(nd[0][1])}Q${(x0 + x1) / 2} ${y(nd[0][1]) - 6 * u} ${x1} ${y(nd[1][1])}`} stroke={color} strokeWidth={5 * u} fill="none" opacity={0.9} />;
            })}
          {list.map((s, i) => {
            const t = seg(frame, s.at, s.at + s.dur);
            if (t <= 0) return null;
            const px = (p: InkPoint): InkPoint => [p[0] * w, p[1] * (portrait ? h * 0.72 : h) + (portrait ? h * 0.1 : 0), p[2]];
            const {body, bristles} = brushStroke({
              path: s.path.map(px),
              width: s.width * u,
              dry: s.dry,
              tone: s.tone,
              seed: seed + i * 13,
              profile: s.profile,
              darkSide: s.darkSide,
              t: eio3(t),
            });
            const col = s.color ?? color;
            return (
              <g key={i}>
                <path d={body} fill={col} opacity={s.tone * (1 - s.dry) * 0.55} />
                {bristles.map((b, j) => (
                  <path key={j} d={b.d} stroke={col} strokeWidth={b.w} strokeLinecap="round" fill="none" opacity={b.o} />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
      {caption && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: portrait ? 0.14 * h : 0.12 * h, textAlign: 'center', opacity: capIn, transform: `translateY(${(1 - capIn) * 8 * u}px)`}}>
          <span style={{display: 'inline-block', width: 12 * u, height: 12 * u, background: INK.vermilion, marginRight: 16 * u}} />
          <span style={{fontFamily: lf.cormorant, fontStyle: 'italic', fontWeight: 500, fontSize: 46 * u, color: INK.ink, letterSpacing: 1 * u}}>{caption}</span>
        </div>
      )}
      {frame > D - 10 && <AbsoluteFill style={{background: '#000', opacity: 0}} />}
    </AbsoluteFill>
  );
};

export const inkBrushStroke = defineMotion<Props>({
  id: 'ink-brush-stroke',
  title: 'Ink brush stroke',
  category: 'shape',
  description:
    'Sumi brushstrokes paint themselves on rice paper: a wet loaded body with a darker contour side, bristle tracks that break into flying white at the dry tail, soft edge bleed; presets for a decisive swoosh, an underline, an ensō circle and a bamboo sprig, or pass your own paths.',
  source: ['lemo-opuscar styles/ink-wash (MIT, LemoLab) — demo/ink.js brush engine, STYLE.md'],
  useFor: 'Hand-made accent strokes, underlines, logo swooshes, dividers; the foundation stroke for any brush or calligraphy look.',
  durationInFrames: 150,
  defaultProps: {
    strokes: [],
    preset: 'bamboo',
    caption: 'one breath, one stroke',
    color: INK.ink,
    background: 'paper',
    paper: true,
    bleed: 1,
    seed: 3,
  },
  propDocs: {
    strokes: 'custom strokes: {path [[x,y,pressure]..] in 0..1, width (u), dry 0–0.7, tone 0–1, at, dur, profile brush|tip|even|lens|fan|rise, darkSide -1|0|1, color?} — empty uses the preset',
    preset: "built-in stroke sets: 'swoosh' | 'underline' | 'enso' | 'bamboo' | 'none'",
    caption: 'small italic serif line with a vermilion square ("" = none)',
    color: 'ink colour',
    background: "'paper' (warm rice paper), any colour, or 'transparent' for an overlay",
    paper: 'draw the procedural rice-paper texture',
    bleed: 'wet edge bleed strength (0 = crisp)',
    seed: 'bristle randomness seed',
  },
  component: InkBrushStroke,
  tags: ['ink', 'brush', 'sumi', 'calligraphy', 'stroke', 'flying white', 'paint', 'draw-on', 'underline', 'enso', 'bamboo', 'japanese', 'chinese', 'xieyi', 'paper', 'overlay', 'accent'],
});
