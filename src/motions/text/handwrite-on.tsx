import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {wobble} from '../../core/random';
import {PaperTexture, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Pen-written text (video4 "opus 5.5 / claude", video22 "ballpoint gambit", video19 end card).
 * Each glyph's outline is stroked on with a dash offset, the ink fill bleeds in right behind
 * the stroke, glyphs overlap ~30% so the line reads as continuous writing. Optional un-write
 * (reverse, 2x speed) at the end like video22's caption cards.
 */
// uncached canvas measurement: re-measured every frame, so a width taken before the web font loaded never sticks
let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, font: string) => {
  if (!text) return 0;
  ctx ??= typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  if (!ctx) return text.length * 40;
  ctx.font = font;
  return ctx.measureText(text).width;
};

type Line = {text: string; color?: string; size?: number; delay?: number};
type Props = {
  lines: Line[];
  background: string;
  color: string;
  font: 'hand' | 'serif' | 'sans' | 'grotesk';
  size: number;
  framesPerGlyph: number;
  strokeWidth: number;
  unwriteAt: number;
  paper: boolean;
  jitter: number;
};

const HandwriteOn: React.FC<Props> = ({lines, background, color, font, size, framesPerGlyph, strokeWidth, unwriteAt, paper, jitter}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  let cursor = 0;
  const totalLines = lines.length;
  const lineGap = size * 1.25 * u;
  const y0 = h / 2 - ((totalLines - 1) * lineGap) / 2;
  // un-write runs backward at 2x speed
  const f = unwriteAt > 0 && frame > unwriteAt ? Math.max(0, unwriteAt - (frame - unwriteAt) * 2) : frame;
  return (
    <AbsoluteFill style={{background}}>
      {paper && <PaperTexture opacity={0.3} />}
      <svg width={w} height={h} style={{position: 'absolute'}}>
        {lines.map((ln, li) => {
          const start = (ln.delay ?? (li === 0 ? 6 : cursor + 8));
          const chars = [...ln.text];
          cursor = start + chars.length * framesPerGlyph;
          const fs = (ln.size ?? size) * u;
          const col = ln.color ?? color;
          const fw = font === 'hand' ? 700 : 600;
          const m = (s: string) => measure(s, `${fw} ${fs}px ${fonts[font]}`);
          const totalW = m(ln.text);
          const x0 = w / 2 - totalW / 2;
          const xs = chars.map((_, i) => x0 + m(chars.slice(0, i).join('')) + m(chars[i]) / 2);
          return (
            <g key={li}>
              {chars.map((ch, i) => {
                if (ch === ' ') return null;
                const gs = start + i * framesPerGlyph;
                const p = clamp((f - gs) / (framesPerGlyph / 0.7));
                if (p <= 0) return null;
                const fill = prog(f, gs + framesPerGlyph * 0.6, gs + framesPerGlyph * 2.2, ease.out);
                const jw = wobble(`hw${li}`, i, frame * 0.02, jitter * u);
                const len = fs * 3.2;
                return (
                  <text
                    key={i}
                    x={xs[i] + jw.x}
                    y={y0 + li * lineGap + jw.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily={fonts[font]}
                    fontWeight={font === 'hand' ? 700 : 600}
                    fontSize={fs}
                    fill={col}
                    fillOpacity={fill}
                    stroke={col}
                    strokeWidth={strokeWidth * u}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={len}
                    strokeDashoffset={len * (1 - p)}
                  >
                    {ch}
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const handwriteOn = defineMotion<Props>({
  id: 'handwrite-on',
  title: 'Handwrite-on title',
  category: 'text',
  description: 'Text written glyph by glyph with a pen: outline strokes on, ink fill follows; optional fast un-write.',
  source: ['video4 0:26-0:28', 'video22 0:05-0:07', 'video22 0:14-0:16'],
  useFor: 'Friendly titles, end cards, chapter interstitials and handwritten captions.',
  durationInFrames: 120,
  defaultProps: {
    lines: [{text: 'ballpoint', color: '#C8363A'}, {text: 'gambit', color: '#3B3F9E'}],
    background: '#EFE9DC',
    color: '#2B74C5',
    font: 'hand',
    size: 150,
    framesPerGlyph: 3,
    strokeWidth: 2,
    unwriteAt: 0,
    paper: true,
    jitter: 1.2,
  },
  propDocs: {
    lines: 'array of {text, color?, size?, delay?} — each line written after the previous',
    font: 'hand | serif | sans | grotesk',
    framesPerGlyph: 'writing speed (video4 ≈ 1.75 f @30fps, video22 ≈ 3 f)',
    unwriteAt: 'frame to start erasing backwards at 2x speed (0 = never)',
    jitter: 'pen wobble in px',
  },
  component: HandwriteOn,
  tags: ['title', 'handwriting', 'pen', 'endcard'],
});
