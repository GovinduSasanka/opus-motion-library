import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng, wobble} from '../../core/random';
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
  /** round-2: variant 'marker' | 'brush' (dry brush, swelling pressure, tapered ends), caption halo + bottom anchor */
  variant: 'pen' | 'marker' | 'brush';
  glyphJitter: {tilt: number; baseline: number; size: number};
  wetGlint: boolean;
  multiply: boolean;
  dry: number;
  halo: {color: string; width: number} | null;
  anchor: 'center' | 'bottom';
  seed: number;
};

const HandwriteOn: React.FC<Props> = ({lines, background, color, font, size, framesPerGlyph, strokeWidth, unwriteAt, paper, jitter, variant, glyphJitter, wetGlint, multiply, dry, halo, anchor, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  let cursor = 0;
  const totalLines = lines.length;
  const lineGap = size * 1.25 * u * (portrait ? 1.6 : 1);
  const y0 = anchor === 'bottom' ? h - 0.1 * h - (totalLines - 1) * lineGap : h / 2 - ((totalLines - 1) * lineGap) / 2;
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
          const fs0 = (ln.size ?? size) * u;
          const fw = font === 'hand' ? 700 : 600;
          const m0 = measure(ln.text, `${fw} ${fs0}px ${fonts[font]}`);
          const fs = portrait ? fs0 * Math.max(1, Math.min(1.6, (w * 0.88) / Math.max(1, m0))) : fs0;
          const col = ln.color ?? color;
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
                const gr = rng(`hw${seed}-${li}-${i}`);
                const gj = variant === 'marker' ? {tilt: (gr() - 0.5) * 2 * glyphJitter.tilt, base: (gr() - 0.5) * 2 * glyphJitter.baseline * u, size: 1 + (gr() - 0.5) * 2 * glyphJitter.size} : {tilt: 0, base: 0, size: 1};
                const brush = variant === 'brush';
                const swell = brush ? 0.55 + 0.9 * Math.sin(Math.PI * Math.min(1, p)) : 1;
                const sw = strokeWidth * u * (variant === 'marker' ? 1.6 : brush ? 2.6 * swell : 1);
                const op = variant === 'marker' && multiply ? 0.9 : 1;
                const glint = wetGlint && variant === 'marker' && p > 0 && p < 1 ? (
                  <circle key={`wg${i}`} cx={xs[i] + jw.x + fs * 0.12} cy={y0 + li * lineGap + jw.y - fs * 0.05} r={fs * 0.05} fill="#fff" opacity={0.85 * Math.sin(Math.PI * p)} />
                ) : null;
                const mixStyle: React.CSSProperties | undefined = variant === 'marker' && multiply ? {mixBlendMode: 'multiply'} : undefined;
                return (
                  <React.Fragment key={i}>
                  {halo && (
                    <text x={xs[i] + jw.x} y={y0 + li * lineGap + jw.y} textAnchor="middle" dominantBaseline="central" fontFamily={fonts[font]} fontWeight={font === 'hand' ? 700 : 600} fontSize={fs} fill={halo.color} stroke={halo.color} strokeWidth={halo.width * u} strokeLinejoin="round" opacity={0.85 * fill} style={{filter: `blur(${5 * u}px)`}}>
                      {ch}
                    </text>
                  )}
                  {brush && dry > 0 && (
                    <text x={xs[i] + jw.x} y={y0 + li * lineGap + jw.y} textAnchor="middle" dominantBaseline="central" fontFamily={fonts[font]} fontWeight={font === 'hand' ? 700 : 600} fontSize={fs} fill="none" stroke="#fff" strokeWidth={sw * 0.5} strokeDasharray={`${2 * u} ${3 * u}`} strokeOpacity={0.55 * dry} opacity={p > 0.2 ? 1 : 0}>
                      {ch}
                    </text>
                  )}
                  <text
                    x={xs[i] + jw.x}
                    y={y0 + li * lineGap + jw.y}
                    transform={gj.tilt || gj.base ? `rotate(${gj.tilt} ${xs[i]} ${y0 + li * lineGap})` : undefined}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily={fonts[font]}
                    fontWeight={font === 'hand' ? 700 : 600}
                    fontSize={fs * gj.size}
                    fill={col}
                    fillOpacity={fill * op}
                    style={mixStyle}
                    stroke={col}
                    strokeWidth={sw}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={len}
                    strokeDashoffset={len * (1 - p)}
                  >
                    {ch}
                  </text>
                  {glint}
                  </React.Fragment>
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
    variant: 'pen',
    glyphJitter: {tilt: 2.5, baseline: 2, size: 0.03},
    wetGlint: true,
    multiply: true,
    dry: 0.6,
    halo: null,
    anchor: 'center',
    seed: 4,
  },
  propDocs: {
    lines: 'array of {text, color?, size?, delay?} — each line written after the previous',
    font: 'hand | serif | sans | grotesk',
    framesPerGlyph: 'writing speed (video4 ≈ 1.75 f @30fps, video22 ≈ 3 f)',
    unwriteAt: 'frame to start erasing backwards at 2x speed (0 = never)',
    jitter: 'pen wobble in px',
    variant: "'pen' (default outline-then-ink) | 'marker' (dry-erase marker: per-glyph seeded tilt / baseline / size wobble, thicker translucent multiply ink, wet glint at the nib) | 'brush' (swelling pressure per glyph, thick stroke, dry streaks)",
    glyphJitter: 'marker: {tilt deg, baseline px, size fraction} seeded per glyph',
    wetGlint: 'marker: small white glint at the nib while a glyph is being written',
    multiply: 'marker: ink is ~90 % opaque and multiplies with what is below',
    dry: 'brush: 0..1 dry-brush streak strength',
    halo: "written-caption mode: {color, width} paper-coloured blurred halo behind each glyph so it knocks back lines passing behind (null = off)",
    anchor: "'center' (default) | 'bottom' (caption position, 10 % from the bottom)",
    seed: 'marker glyph jitter seed',
  },
  component: HandwriteOn,
  tags: ['title', 'handwriting', 'pen', 'endcard', 'marker', 'whiteboard', 'brush', 'calligraphy', 'caption', 'written-caption'],
});
