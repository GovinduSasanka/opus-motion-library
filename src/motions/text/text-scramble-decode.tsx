import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {Bg, fitBlock, h01, mixCol, scrambleChar} from '../../core/kinetic-type-kit';
import {estWidth, tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Text scramble / decode: every glyph starts as random noise from a charset and locks onto its real letter one
 * after another (left-to-right, from the centre out, from the edges in, or in random order). A resolving glyph flashes
 * the accent colour; an optional status line counts the percentage decoded. Long text wraps and shrinks to fit.
 */

type Props = {
  text: string;
  eyebrow: string;
  showProgress: boolean;
  charset: string;
  order: 'ltr' | 'rtl' | 'center' | 'edges' | 'random';
  font: TFont;
  size: number;
  weight: number;
  align: 'center' | 'left';
  tracking: number;
  startAt: number;
  revealFrames: number;
  scrambleEvery: number;
  exit: 'scramble' | 'fade' | 'none';
  exitFrames: number;
  seed: number;
  background: string;
  ink: string;
  accent: string;
  dim: string;
};

const Decode: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const size0 = p.size * u;
  const maxW = w * (w < h ? 0.88 : 0.82);
  const eyebrowSize = Math.max(16 * u, size0 * 0.2);
  const {size, lines} = fitBlock(p.text, size0, maxW, h * 0.56, p.font, 1.18, p.tracking);
  const mono = p.font === 'mono' || p.font === 'plex' || p.font === 'monoLight';
  const cw = (ch: string) => (mono ? size * 0.6 : Math.max(size * 0.12, estWidth(ch, size, p.font, 0))) + p.tracking * size;

  // global index of every visible glyph in reading order
  const flat: {li: number; ci: number; ch: string; g: number}[] = [];
  let g = 0;
  lines.forEach((l, li) => [...l].forEach((ch, ci) => flat.push({li, ci, ch, g: ch === ' ' ? -1 : g++})));
  const N = Math.max(1, g);

  const orderOf = (gi: number) => {
    const t = N > 1 ? gi / (N - 1) : 0;
    switch (p.order) {
      case 'rtl':
        return 1 - t;
      case 'center':
        return Math.abs(t - 0.5) * 2;
      case 'edges':
        return 1 - Math.abs(t - 0.5) * 2;
      case 'random':
        return h01(gi, 3, p.seed);
      default:
        return t;
    }
  };

  const total = p.revealFrames;
  const resolveAt = (gi: number) => p.startAt + 10 + orderOf(gi) * total + h01(gi, 9, p.seed) * 5;
  const exitAt = durationInFrames - p.exitFrames;
  const exitProg = p.exit === 'none' ? 0 : prog(frame, exitAt, durationInFrames, ease.in);
  const lastResolve = p.startAt + 10 + total + 5;
  const decoded = clamp((frame - (p.startAt + 10)) / Math.max(1, total + 5), 0, 1);
  const pct = Math.round(decoded * 100);
  const inA = prog(frame, p.startAt - 4, p.startAt + 6, ease.out);
  const lh = size * 1.18;
  const widest = Math.max(...lines.map((l) => [...l].reduce((a, ch) => a + cw(ch), 0)), size);
  const blockH = lines.length * lh;
  const above = p.eyebrow || p.showProgress ? eyebrowSize * 2.6 : 0;
  const top = h / 2 - (blockH + above) / 2;
  const left = p.align === 'center' ? 0 : (w - maxW) / 2;

  return (
    <Bg background={p.background} glow={p.accent} glowAmount={0.1}>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: p.exit === 'fade' ? 1 - exitProg : 1}}>
        {p.eyebrow || p.showProgress ? (
          <div
            style={{
              position: 'absolute',
              left,
              width: p.align === 'center' ? w : maxW,
              top,
              textAlign: p.align,
              fontFamily: tfonts.mono,
              fontSize: eyebrowSize,
              letterSpacing: eyebrowSize * 0.22,
              color: p.accent,
              opacity: inA * 0.9,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {p.eyebrow}
            {p.showProgress ? <span style={{color: p.dim}}>{`${p.eyebrow ? '   ' : ''}${String(pct).padStart(3, ' ')}%`}</span> : null}
          </div>
        ) : null}
        {lines.map((line, li) => {
          const chars = flat.filter((f) => f.li === li);
          const lineW = chars.reduce((s, c) => s + cw(c.ch), 0);
          const x0 = p.align === 'center' ? (w - lineW) / 2 : left;
          let x = x0;
          return (
            <div key={li} style={{position: 'absolute', left: 0, top: top + above + li * lh, width: w, height: lh}}>
              {chars.map((c) => {
                const cwi = cw(c.ch);
                const px = x;
                x += cwi;
                if (c.ch === ' ') return null;
                const rAt = resolveAt(c.g);
                const exitStart = exitAt + (p.exit === 'scramble' ? orderOf(c.g) * (p.exitFrames * 0.55) : 0);
                const scramblingIn = frame < rAt;
                const scramblingOut = p.exit === 'scramble' && frame >= exitStart;
                const tick = Math.floor((frame + c.g * 2) / Math.max(1, p.scrambleEvery));
                const shown = scramblingIn || scramblingOut ? scrambleChar(p.charset, c.g, tick, p.seed) : c.ch;
                const flash = scramblingIn || scramblingOut ? 1 : 1 - prog(frame, rAt, rAt + 8, ease.out);
                const color = scramblingIn || scramblingOut ? mixCol(p.accent, p.dim, 0.35 + 0.35 * h01(c.g, tick, p.seed)) : mixCol(p.ink, p.accent, flash);
                const vis = prog(frame, p.startAt + h01(c.g, 1, p.seed) * 6 - 2, p.startAt + h01(c.g, 1, p.seed) * 6 + 4, ease.out);
                const outFade = p.exit === 'scramble' ? 1 - prog(frame, exitStart + p.exitFrames * 0.3, exitStart + p.exitFrames * 0.45, ease.in) : 1;
                return (
                  <span
                    key={c.g}
                    style={{
                      position: 'absolute',
                      left: px,
                      top: 0,
                      width: cwi,
                      textAlign: 'center',
                      fontFamily: tfonts[p.font],
                      fontSize: size,
                      lineHeight: `${lh}px`,
                      fontWeight: p.weight,
                      color,
                      opacity: vis * (scramblingIn || scramblingOut ? 0.92 : 1) * outFade,
                      textShadow: flash > 0.05 ? `0 0 ${size * 0.25 * flash}px ${p.accent}` : undefined,
                      whiteSpace: 'pre',
                    }}
                  >
                    {shown}
                  </span>
                );
              })}
            </div>
          );
        })}
        {p.showProgress ? (
          <div style={{position: 'absolute', left: p.align === 'center' ? (w - widest) / 2 : left, top: top + above + blockH + size * 0.12, width: widest, height: Math.max(2, 3 * u), background: mixCol(p.background === 'transparent' ? '#000000' : p.background, p.dim, 0.5), opacity: inA}}>
            <div style={{width: `${(frame >= lastResolve ? 1 : decoded) * 100}%`, height: '100%', background: p.accent}} />
          </div>
        ) : null}
      </div>
    </Bg>
  );
};

export const textScrambleDecode = defineMotion<Props>({
  id: 'text-scramble-decode',
  title: 'Text scramble decode',
  category: 'text',
  description:
    'A headline starts as flickering random glyphs (blocks, symbols, binary or your own charset) and each character locks onto its real letter in turn — left to right, centre out, edges in or random — flashing the accent colour as it lands, with an optional "decoding 64%" status line and bar; wraps and shrinks for long text, optional scramble-out.',
  source: ['original — generic kinetic-type effect (R3)'],
  useFor: 'Hacker / cyber / AI reveals, tech product titles, "secret message" stings, section headers on dark sites, caption reveals; replace the text and charset.',
  durationInFrames: 150,
  defaultProps: {
    text: 'Hidden in plain sight',
    eyebrow: 'Decoding message',
    showProgress: true,
    charset: 'glyphs',
    order: 'ltr',
    font: 'mono',
    size: 120,
    weight: 700,
    align: 'center',
    tracking: 0,
    startAt: 8,
    revealFrames: 62,
    scrambleEvery: 2,
    exit: 'scramble',
    exitFrames: 26,
    seed: 7,
    background: '#0A0F14',
    ink: '#EAF4F2',
    accent: '#34F5B0',
    dim: '#2F8F78',
  },
  propDocs: {
    text: 'the line or paragraph to decode (\\n = forced break; long text wraps and shrinks to fit)',
    eyebrow: 'small status label above the text ("" to hide)',
    showProgress: 'show the % counter and progress bar',
    charset: 'glyphs | binary | hex | letters | symbols | digits — or any string whose characters are used as the noise',
    order: 'ltr | rtl | center | edges | random — order in which glyphs lock in',
    font: 'font role (mono keeps cells even; others work too)',
    size: 'max font size in u (1080-short-side units); shrinks to fit',
    weight: 'font weight',
    align: 'center | left',
    tracking: 'extra letter spacing in em',
    startAt: 'frame the noise appears',
    revealFrames: 'frames over which the glyphs lock in (longer = slower decode)',
    scrambleEvery: 'frames between noise changes (1 = frantic, 4 = calm)',
    exit: 'scramble (back to noise and gone) | fade | none',
    exitFrames: 'length of the exit at the end of the clip',
    seed: 'noise seed',
    background: 'background colour; "transparent" for an overlay',
    ink: 'colour of resolved text',
    accent: 'noise / flash / status colour',
    dim: 'secondary colour for noise and counter',
  },
  component: Decode,
  tags: ['text', 'scramble', 'decode', 'decrypt', 'hacker', 'matrix', 'cyber', 'title', 'reveal', 'glitch', 'typography', 'kinetic', 'website', 'caption', 'overlay'],
});
