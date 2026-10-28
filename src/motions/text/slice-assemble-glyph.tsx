import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {FilmGrain, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {decodeText, measureTextPx, ReelHud, SWISS} from '../../core/r2-x14-kit';

/**
 * x2 chapter 04b: on black, a big word is cut into horizontal slices of different heights that fly in from the left
 * and right at different speeds (easeOutExpo, a few overshoot or sit misaligned for a beat like a glitch) and lock
 * into the finished glyphs; a mono caption decodes from random characters under it, then a red dot pops on at the
 * word's top-right. Life: two short glitch re-slices while it holds; the dot breathes.
 */

type Props = {
  text: string;
  caption: string;
  slices: number;
  spread: number;
  frames: number;
  font: 'display' | 'sans' | 'grotesk';
  color: string;
  background: string;
  dotColor: string;
  glitchAt: number[];
  seed: number;
  hud: boolean;
  label: string;
};

const CAP = 0.72;
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

const SliceAssembleGlyph: React.FC<Props> = ({text, caption, slices, spread, frames, font, color, background, dotColor, glitchAt, seed, hud, label}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, fps} = useStage();
  const family = fonts[font];
  const weight = font === 'display' ? 400 : font === 'sans' ? 800 : 700;
  const word = text || 'FLOW';
  const css = (px: number) => `${weight} ${px}px ${family}`;
  const probe = 100;
  const wW = Math.max(1, measureTextPx(word, css(probe)));
  // glyph (cap) height ≈ 0.28 H, never wider than 84 % W
  const fs = Math.min((0.28 * h) / CAP, (0.78 * w * probe) / wW, (0.42 * Math.min(w, h)) / CAP);
  const capH = fs * CAP;
  const textW = (wW * fs) / probe;
  const baseY = cy + capH / 2 - capH * 0.08;
  const top = baseY - capH;

  // ---- seeded slices: heights 4–14 % of the glyph, offsets ±0.3–0.6 W, staggered starts ----
  const n = Math.max(3, Math.round(slices));
  const r = rng(seed * 7919 + 3);
  const raw = Array.from({length: n}, () => 0.4 + r() * 1.0);
  const sum = raw.reduce((a, b) => a + b, 0);
  const pad = capH * 0.12; // slices cover a little above / below the cap box (overshoots, accents)
  let acc = top - pad;
  const total = capH + pad * 2;
  const S = raw.map((v, i) => {
    const hh = (v / sum) * total;
    const y = acc;
    acc += hh;
    const dir = r() < 0.5 ? -1 : 1;
    const dist = (0.3 + r() * 0.3) * w * spread * dir;
    const start = Math.floor(r() * frames * 0.4);
    const dur = Math.round(frames * (0.45 + r() * 0.45));
    const glitch = r() < 0.35 ? (r() - 0.5) * 0.08 * w : 0; // sits misaligned for a beat
    const over = r() < 0.3 ? 0.04 + r() * 0.04 : 0;
    return {y, hh, dist, start, dur, glitch, over, i};
  });

  const sliceDx = (s: (typeof S)[number]) => {
    const t = clamp((frame - s.start) / s.dur);
    if (t >= 1) return 0;
    let dx = s.dist * (1 - expoOut(t));
    if (s.over) dx -= s.dist * s.over * Math.sin(Math.PI * clamp((t - 0.55) / 0.45)); // overshoot past home and back
    if (s.glitch && t > 0.7) dx = s.glitch * (t < 0.93 ? 1 : 0); // misaligned hold, then snap
    return dx;
  };
  const blurOf = (s: (typeof S)[number]) => {
    const t = clamp((frame - s.start) / s.dur);
    if (t <= 0 || t >= 0.7) return 0;
    const v = Math.abs(s.dist) * 10 * Math.log(2) * Math.pow(2, -10 * t) / s.dur; // px / frame
    return Math.min(40 * u, v * 0.35);
  };

  // ---- life: short glitch re-slices while holding ----
  const glitchDx = (s: (typeof S)[number]) => {
    let dx = 0;
    for (const g of glitchAt) {
      const k = frame - g;
      if (k < 0 || k > 5) continue;
      const rr = rng(seed * 31 + s.i * 97 + g * 13);
      if (rr() < 0.45) dx += (rr() - 0.5) * 0.12 * w * (k < 4 ? 1 : 0);
    }
    return dx;
  };

  const assembled = S.reduce((m, s) => Math.max(m, s.start + s.dur), 0);
  const capStart = Math.round(assembled * 0.55);
  const capText = decodeText(caption, frame, capStart, capStart + 16, seed);
  const dotAt = assembled + 4;
  const dk = frame - dotAt;
  const dotR = (capH * 0.08) / 2;
  const dotScale = dk < 0 ? 0 : dk < 2 ? (dk / 2) * 1.25 : dk < 4 ? 1.25 - ((dk - 2) / 2) * 0.25 : 1 + 0.06 * Math.sin((dk - 4) * ((2 * Math.PI) / fps));
  const capFs = Math.max(11 * u, capH * 0.07);
  const id = `sag-${seed}-${Math.round(w)}`;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          {S.map((s) => (
            <clipPath key={s.i} id={`${id}-c${s.i}`}>
              <rect x={-w} y={s.y - 0.5} width={w * 3} height={s.hh + 1} />
            </clipPath>
          ))}
          {S.map((s) => (
            <filter key={s.i} id={`${id}-b${s.i}`} x="-50%" y="-10%" width="200%" height="120%">
              <feGaussianBlur stdDeviation={`${blurOf(s)} 0`} />
            </filter>
          ))}
          <radialGradient id={`${id}-glow`}>
            <stop offset="0%" stopColor={dotColor} stopOpacity={0.55} />
            <stop offset="100%" stopColor={dotColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${1 + 0.04 * clamp((frame - assembled) / 100)}) translate(${-cx} ${-cy})`}>
        {S.map((s) => {
          const dx = sliceDx(s) + glitchDx(s);
          if (frame < s.start) return null;
          const b = blurOf(s);
          return (
            <g key={s.i} clipPath={`url(#${id}-c${s.i})`}>
              <text
                x={cx + dx}
                y={baseY}
                textAnchor="middle"
                style={{font: css(fs)}}
                fill={color}
                filter={b > 0.3 ? `url(#${id}-b${s.i})` : undefined}
              >
                {word}
              </text>
            </g>
          );
        })}
        {dotScale > 0 ? (
          <g transform={`translate(${cx + textW / 2 + dotR * 3} ${top + dotR})`}>
            <circle r={dotR * 5 * dotScale} fill={`url(#${id}-glow)`} />
            <circle r={dotR * dotScale} fill={dotColor} />
          </g>
        ) : null}
        <text x={cx} y={baseY + capH * 0.42} textAnchor="middle" style={{font: `500 ${capFs}px ${fonts.mono}`, letterSpacing: capFs * 0.5}} fill={color} opacity={0.6}>
          {capText}
        </text>
        </g>
      </svg>
      <FilmGrain opacity={0.06} />
      {hud ? <ReelHud ink={SWISS.cream} label={label} footer={`MOTION REEL / ${w}×${h} / ${fps} FPS`} active={3} progress={0.5 + frame / 240} beat={frame < assembled} opacity={0.45} /> : null}
    </AbsoluteFill>
  );
};

export const sliceAssembleGlyph = defineMotion<Props>({
  id: 'slice-assemble-glyph',
  title: 'Slice-assemble glyph',
  category: 'text',
  description:
    'On black, a big word cut into 8–10 horizontal slices of different heights flies in from both sides at different speeds (some overshoot or sit misaligned like a glitch) and locks into place; a mono caption decodes under it and a red dot pops on at its top-right.',
  source: ['video x2 0:07.20-0:07.60 (chapter 04 TYPE, glyph slice-in)'],
  useFor: 'Punchy logo / word reveals with a clean glitch flavour; display type and CJK titles; chapter openers on dark.',
  durationInFrames: 120,
  defaultProps: {
    text: 'FLOW',
    caption: 'MOTION DESIGN',
    slices: 9,
    spread: 1,
    frames: 16,
    font: 'display',
    color: SWISS.cream,
    background: SWISS.black,
    dotColor: SWISS.red,
    glitchAt: [70, 102],
    seed: 4,
    hud: true,
    label: '04 — TYPE',
  },
  propDocs: {
    text: 'the word / glyphs to assemble (CJK works if a system font has the glyphs)',
    caption: 'mono caption that decodes under the word ("" = none)',
    slices: 'number of horizontal slices',
    spread: 'scale of the slices’ start offsets (1 = 0.3–0.6 W)',
    frames: 'assembly window in frames (each slice flies for 45–90 % of it, starts in its first 40 %)',
    font: 'display (Archivo Black) | sans | grotesk',
    color: 'glyph colour',
    background: 'background colour',
    dotColor: 'accent dot colour',
    glitchAt: 'frames where a short glitch re-slice happens while holding ([] = none)',
    seed: 'slice layout seed',
    hud: 'show the reel HUD',
    label: 'HUD chapter label',
  },
  component: SliceAssembleGlyph,
  tags: ['slice', 'glitch', 'logo reveal', 'word reveal', 'assemble', 'kinetic type', 'decode', 'scramble', 'cjk', 'swiss', 'dark', 'title', 'red dot', 'x2'],
});
