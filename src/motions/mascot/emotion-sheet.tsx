// Adapted from ClaudeAnimationBase/src/sheets.js + docs/emotions.jpg layout (MIT, © 2026 John Heibel) — see THIRD_PARTY_NOTICES.md
// The character drawn is our original mascot "Nib" (src/core/r2-mascot-kit.tsx), not the source's mascot.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  DANCE_STYLES,
  EMOTIONS,
  EMOTIONS_LIST,
  HAT_KINDS,
  HatKind,
  NIB_COLORS,
  NIB_PROP_DOCS,
  NibBackdrop,
  NibFigure,
  NibLook,
  NibView,
  VIEW_KINDS,
  backOut,
  nibColorsFrom,
} from '../../core/r2-mascot-kit';

type Props = {
  sheet: 'emotions' | 'views' | 'dances' | 'hats';
  emotions: string[];
  labels: boolean;
  showFamily: boolean;
  highlight: string;
  columns: number;
  title: string;
  background: string;
  bodyColor: string;
  inkColor: string;
  accent: string;
  look: NibLook;
  bpm: number;
  offsetSec: number;
};

type Item = {label: string; emotion: string; view?: NibView; dance?: string; hat?: HatKind; sub?: string};

const EmotionSheet: React.FC<Props> = ({sheet, emotions, labels, showFamily, highlight, columns, title, background, bodyColor, inkColor, accent, look, bpm, offsetSec}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, square} = useStage();
  const items: Item[] =
    sheet === 'views'
      ? [...VIEW_KINDS.map((v): Item => ({label: v, emotion: 'neutral', view: v})), {label: 'q · flip', emotion: 'neutral', view: 'q'}, {label: 'side · flip', emotion: 'neutral', view: 'side'}]
      : sheet === 'dances'
        ? DANCE_STYLES.map((d) => ({label: d, emotion: 'happy', dance: d}))
        : sheet === 'hats'
          ? HAT_KINDS.map((k) => ({label: k, emotion: 'happy', hat: k as HatKind}))
          : (emotions.length ? emotions : [...EMOTIONS_LIST]).map((e) => ({label: e, emotion: e, sub: (EMOTIONS as Record<string, {family: string}>)[e]?.family}));
  const n = items.length;
  const cols = columns > 0 ? columns : portrait ? 4 : square ? 6 : n <= 8 ? n : Math.min(8, Math.ceil(n / 4));
  const rows = Math.ceil(n / cols);
  const top = title ? h * 0.12 : h * 0.05;
  const bottom = h * 0.03;
  const side = w * 0.03;
  const cw = (w - side * 2) / cols;
  const ch = (h - top - bottom) / rows;
  const ru = Math.min(cw / 11.5, ch / (labels ? 16.5 : 14));
  const colors = nibColorsFrom({bodyColor, inkColor, accent});
  const ink = inkColor || NIB_COLORS.ink;
  const labelSize = Math.max(11 * u, ru * 1.35);
  return (
    <AbsoluteFill style={{background: background === 'transparent' ? 'transparent' : undefined}}>
      <Svg>
        <NibBackdrop background={background} w={w} h={h} u={u} id="esheet" />
        {title ? (
          <text x={w / 2} y={top * 0.62} textAnchor="middle" fontFamily={fonts.grotesk} fontWeight={700} fontSize={Math.min(46 * u, w / (title.length * 0.6))} fill={ink} letterSpacing={2}>
            {title}
          </text>
        ) : null}
        {items.map((it, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const cx = side + cw * (c + 0.5);
          const gy = top + ch * r + ch * (labels ? 0.78 : 0.86);
          const appear = backOut((frame - 2 - (r * cols + c) * 0.7) / 12, 2.2);
          const k = Math.max(0, Math.min(1.2, appear));
          const hl = highlight && it.label === highlight;
          return (
            <g key={i} opacity={Math.min(1, Math.max(0, k * 1.5))}>
              {hl ? <rect x={cx - cw * 0.46} y={top + ch * r + ch * 0.04} width={cw * 0.92} height={ch * 0.92} rx={ru * 1.2} fill="none" stroke={accent || NIB_COLORS.accent} strokeWidth={Math.max(2, ru * 0.3)} /> : null}
              <line x1={cx - cw * 0.36} x2={cx + cw * 0.36} y1={gy + ru * 0.15} y2={gy + ru * 0.15} stroke={ink} strokeOpacity={0.14} strokeWidth={Math.max(1, ru * 0.12)} />
              <g transform={`translate(${cx} ${gy}) scale(${Math.max(0.01, k)}) translate(${-cx} ${-gy})`}>
                <NibFigure
                  id={`es${i}`}
                  x={cx}
                  y={gy}
                  u={ru}
                  frame={frame}
                  fps={fps}
                  bpm={bpm}
                  offsetSec={offsetSec + i * 0.037}
                  emotion={it.emotion}
                  view={it.view}
                  flip={it.label.includes('flip')}
                  dance={it.dance}
                  hat={it.hat}
                  seed={i + 1}
                  colors={colors}
                  look={look}
                />
              </g>
              {labels ? (
                <text x={cx} y={gy + ru * 2.6} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={labelSize} fill={ink} letterSpacing={labelSize * 0.12}>
                  {it.label.toUpperCase()}
                </text>
              ) : null}
              {labels && showFamily && it.sub ? (
                <text x={cx} y={gy + ru * 2.6 + labelSize * 1.15} textAnchor="middle" fontFamily={fonts.mono} fontSize={labelSize * 0.72} fill={ink} opacity={0.45} letterSpacing={1}>
                  {it.sub}
                </text>
              ) : null}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const emotionSheet = defineMotion<Props>({
  id: 'emotion-sheet',
  title: 'Mascot emotion sheet (Nib)',
  category: 'mascot',
  description:
    'A model sheet of the ink-drop mascot Nib: all 31 named emotions in a labelled grid, every one alive on the beat (idle body language, blinks, emotes); also a views, dances or hats sheet.',
  source: ['ClaudeAnimationBase src/sheets.js + docs/emotions.jpg layout (MIT); character original'],
  useFor: 'Pick an emotion by eye (agent reference image), mascot style guides, documentation thumbnails, library showcase.',
  durationInFrames: 150,
  defaultProps: {
    sheet: 'emotions',
    emotions: [],
    labels: true,
    showFamily: false,
    highlight: '',
    columns: 0,
    title: '',
    background: 'paper',
    bodyColor: NIB_COLORS.body,
    inkColor: NIB_COLORS.ink,
    accent: NIB_COLORS.accent,
    look: 'ink-wash',
    bpm: 120,
    offsetSec: 0,
  },
  propDocs: {
    sheet: "'emotions' (31 moods) | 'views' (front, q, side, qback, back) | 'dances' (12 beat dances) | 'hats' (wardrobe)",
    emotions: 'subset of emotion names to show (empty = all 31, in table order)',
    labels: 'print the name under each cell',
    showFamily: 'also print the emotion family (joy, low, hot, alarm, mind, sly)',
    highlight: 'name of one cell to ring in the accent colour',
    columns: 'grid columns (0 = auto: 8 landscape, 6 square, 4 portrait)',
    title: 'optional sheet title',
    background: "'paper', 'transparent' or any colour",
    ...NIB_PROP_DOCS,
  },
  component: EmotionSheet,
  tags: ['mascot', 'character', 'model sheet', 'emotions', 'expressions', 'reference', 'nib', 'ink drop', 'cartoon', 'cute', 'faces', 'moods', 'style guide', 'agent reference', 'grid'],
});
