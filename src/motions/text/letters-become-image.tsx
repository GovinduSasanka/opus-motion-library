// Adapted from lemo-opuscar/styles/ascii-crt/demo/main.js letter-fall block (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp} from '../../core/ease';
import {PlatePaletteName, sampleGrid, usePlatePixels, useSafeId} from '../../core/image-kit';
import {CrtGlass, asciiField, densityOrder, eio3, hh, lf, phosphor, pickLevel, seg} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A typed sentence holds with a blinking cursor, then breaks apart: its letters fly as small particles into
 * the cells of a picture built only from those letters. Ground lands first, bottom-to-top; each landing
 * flashes (1.9× decaying with τ 0.12 s); the source letters dim as they are consumed.
 */
type Props = {
  sentence: string;
  src: string;
  seed: number;
  palette: PlatePaletteName;
  cols: number;
  typeStart: number;
  splitAt: number;
  flightFrames: number;
  spreadFrames: number;
  order: 'bottomUp' | 'random';
  phosphorLo: string;
  phosphorMid: string;
  phosphorHi: string;
  background: string;
};

type Cell = {x: number; y: number; ch: string; lv: number; v: number; src: number; delay: number; jx: number; jy: number};

const LettersBecomeImage: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const id = useSafeId('l2img');
  const px = usePlatePixels({src: p.src, seed: p.seed, palette: p.palette}, 360);
  const sentence = p.sentence.toUpperCase();
  const cols = Math.max(16, Math.round(portrait ? p.cols * 0.8 : p.cols));
  const cw = w / cols;
  const chh = cw * 2;
  const rows = Math.floor(h / chh);
  const oy = (h - rows * chh) / 2;
  // sentence layout (centred, wraps in portrait)
  const ss = (portrait ? 58 : 60) * u;
  const adv = ss * 0.4;
  const maxChars = Math.floor((w * 0.86) / adv);
  const lines = useMemo(() => {
    const words = sentence.split(' ');
    const out: string[] = [];
    let cur = '';
    words.forEach((wd) => {
      if ((cur + ' ' + wd).trim().length > maxChars) {
        out.push(cur.trim());
        cur = wd;
      } else cur = (cur + ' ' + wd).trim();
    });
    if (cur) out.push(cur);
    return out;
  }, [sentence, maxChars]);
  const glyphPos = useMemo(() => {
    const g: {x: number; y: number; c: string}[] = [];
    lines.forEach((ln, li) => {
      const x0 = w / 2 - (ln.length * adv) / 2;
      const y = h * 0.5 + (li - (lines.length - 1) / 2) * ss * 1.25;
      [...ln].forEach((c, k) => g.push({x: x0 + k * adv, y, c}));
    });
    return g;
  }, [lines, w, h, adv, ss]);
  const charset = useMemo(() => densityOrder(sentence), [sentence]);
  const levels = charset.length;
  const cells = useMemo(() => {
    if (!px) return [] as Cell[];
    const rgb = sampleGrid(px, cols, rows, {x0: 0, y0: oy / h, x1: 1, y1: (oy + rows * chh) / h});
    const L = asciiField(rgb, cols, rows);
    const out: Cell[] = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const v = L[j * cols + i];
        if (v <= 0) continue;
        const lv = pickLevel(v, levels + 1, i, j, 0.6);
        if (lv <= 0) continue;
        const ch = charset[lv - 1];
        const sources = glyphPos.map((g, k) => (g.c === ch ? k : -1)).filter((k) => k >= 0);
        const src = sources.length ? sources[Math.floor(hh(i, j, 3) * sources.length)] : 0;
        const rowK = p.order === 'bottomUp' ? (rows - 1 - j) / Math.max(1, rows - 1) : hh(i, j, 9);
        out.push({x: i * cw, y: oy + (j + 0.78) * chh, ch, lv, v, src, delay: rowK * p.spreadFrames + hh(i, j, 5) * 8, jx: (hh(i, j, 1) - 0.5) * adv * 0.8, jy: (hh(i, j, 2) - 0.5) * ss * 0.6});
      }
    return out;
  }, [px, cols, rows, oy, h, chh, cw, levels, charset, glyphPos, p.order, p.spreadFrames, adv, ss]);

  const typedN = Math.max(0, Math.floor((frame - p.typeStart) / 1.15));
  const totalChars = glyphPos.length;
  const typingDone = typedN >= totalChars;
  const cursorOn = !typingDone || Math.floor(frame / 12) % 2 === 0;
  // how consumed is each source glyph
  const consumed = useMemo(() => new Array(glyphPos.length).fill(0), [glyphPos.length]);
  const counts = useMemo(() => {
    const c = new Array(glyphPos.length).fill(0);
    cells.forEach((cl) => c[cl.src]++);
    return c;
  }, [cells, glyphPos.length]);
  consumed.fill(0);
  const parts: React.ReactNode[] = [];
  cells.forEach((c, k) => {
    const t0 = p.splitAt + c.delay;
    const uu = seg(frame, t0, t0 + p.flightFrames);
    if (frame < t0) return;
    consumed[c.src]++;
    const g = glyphPos[c.src];
    const sx = g.x + adv * 0.5 + c.jx;
    const sy = g.y - ss * 0.3 + c.jy;
    const tx = c.x + cw * 0.5;
    const ty = c.y - chh * 0.38;
    const e = eio3(uu);
    const x = lerp(sx, tx, e);
    const y = lerp(sy, ty, uu * (0.6 + 0.4 * uu));
    const size = lerp(18 * u, chh * 1.12, ease.out(uu));
    const fadeIn = clamp((frame - t0) / (0.2 * fps));
    const landed = frame - (t0 + p.flightFrames);
    const flash = landed >= 0 ? 1 + 0.9 * Math.exp(-landed / fps / 0.12) : 1;
    const b = clamp(c.v * flash * 0.95, 0, 1.6);
    parts.push(
      <text key={k} x={x} y={y + size * 0.36} textAnchor="middle" fontSize={size} fill={phosphor(Math.min(1, b), p.phosphorLo, p.phosphorMid, p.phosphorHi)} opacity={fadeIn * clamp(0.35 + 0.65 * b)}>
        {c.ch}
      </text>,
    );
  });
  const sentenceShown = glyphPos.slice(0, Math.min(totalChars, typedN));
  const lastG = glyphPos[Math.min(totalChars, typedN) - 1];

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <filter id={`${id}-glow`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={3 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g fontFamily={lf.vt} filter={`url(#${id}-glow)`}>
          {sentenceShown.map((g, k) => {
            const left = counts[k] ? 1 - consumed[k] / counts[k] : 1;
            const op = frame < p.splitAt ? 1 : left;
            return (
              <text key={k} x={g.x} y={g.y} fontSize={ss} fill={p.phosphorHi} opacity={op}>
                {g.c}
              </text>
            );
          })}
          {cursorOn && frame < p.splitAt + 10 && (
            <rect x={lastG ? lastG.x + adv * 1.1 : w / 2} y={(lastG ? lastG.y : h / 2) - ss * 0.62} width={adv * 0.9} height={ss * 0.7} fill={p.phosphorMid} />
          )}
          {parts}
        </g>
        <CrtGlass id={id} w={w} h={h} u={u} tint={p.phosphorMid} frame={frame} />
      </Svg>
    </AbsoluteFill>
  );
};

export const lettersBecomeImage = defineMotion<Props>({
  id: 'letters-become-image',
  title: 'Letters become image',
  category: 'text',
  description:
    'A typed sentence on a phosphor terminal breaks apart: its letters fly as particles into the cells of a picture made only of those letters, landing bottom-to-top with a flash on each landing while the source letters dim.',
  source: ['lemo-opuscar styles/ascii-crt demo/main.js letter-fall block + term.js (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §3 letters-become-image'],
  useFor: 'Text-to-image climaxes: a manifesto becomes a city, a product name becomes the product, a recipe becomes the dish.',
  durationInFrames: 180,
  defaultProps: {
    sentence: 'Every city is made of small lights',
    src: '',
    seed: 2,
    palette: 'dusk',
    cols: 84,
    typeStart: 4,
    splitAt: 66,
    flightFrames: 18,
    spreadFrames: 52,
    order: 'bottomUp',
    phosphorLo: '#FF6605',
    phosphorMid: '#FFB000',
    phosphorHi: '#FFEBB8',
    background: '#090604',
  },
  propDocs: {
    sentence: 'the typed sentence; the picture is built only from its letters',
    src: 'public/ image to build (empty = procedural night plate)',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette',
    cols: 'picture columns in landscape (portrait uses 60 %)',
    typeStart: 'frame typing starts',
    splitAt: 'frame the sentence breaks apart (≈1.5 s after typing ends)',
    flightFrames: 'flight time of one letter',
    spreadFrames: 'frames from the first landing row to the last',
    order: 'bottomUp = ground lands first, random = scattered',
    phosphorLo: 'dim phosphor colour',
    phosphorMid: 'mid phosphor colour (cursor)',
    phosphorHi: 'bright phosphor colour (sentence)',
    background: 'unlit glass colour',
  },
  component: LettersBecomeImage,
  tags: ['ascii', 'letters', 'particles', 'text to image', 'typing', 'terminal', 'crt', 'phosphor', 'transformation', 'reveal', 'manifesto', 'climax', 'glyphs', 'retro computing'],
});
