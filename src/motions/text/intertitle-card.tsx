// Adapted from lemo-opuscar/styles/silent-film/demo/engine/cards.js, STYLE.md §4 (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FilmDamage, Lb2Font, fx, h1, lf, measure, seg, useUid, weaveAt} from '../../core/r2-lb2-kit';
import {DecoBorder, DecoLevel, wrapText} from '../../core/r2-lb2a-kit';

/**
 * A full-frame black painted intertitle card with an Art-Deco border whose ornament follows the emotion: narration
 * (double rule with stepped corners, diamond-and-rule ornaments, corner fans), shout (one heavy rule, big small-caps
 * that shake), tender (double rule with wavy flowering vines) or title (small-caps title plus italic subtitle).
 * Gets the same print damage as the film: weave, flicker, scratches, dust and a hair.
 */
type Line = {text: string; font?: Lb2Font; size?: number; italic?: boolean};
type Props = {
  lines: Line[];
  level: DecoLevel;
  shake: number;
  cardColor: string;
  inkColor: string;
  borderColor: string;
  hold: number;
  fadeFrames: number;
  damage: number;
  aspect: number;
  outside: string;
};

const defaults = (level: DecoLevel, i: number): {font: Lb2Font; size: number; italic: boolean; weight: number} => {
  if (level === 'title') return i === 0 ? {font: 'playfair', size: 90, italic: false, weight: 400} : {font: 'oldItalic', size: 30, italic: true, weight: 400};
  if (level === 'shout') return {font: 'playfair', size: 110, italic: false, weight: 700};
  return {font: 'oldItalic', size: 72, italic: true, weight: 400};
};

const IntertitleCard: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const id = useUid('itc');
  // the gate: 4:3 (3:4 in portrait), aspect -1 = fill the frame
  const asp = p.aspect > 0 ? p.aspect : p.aspect < 0 ? w / h : w > h ? 4 / 3 : w < h ? 3 / 4 : 1;
  let gw = w;
  let gh = w / asp;
  if (gh > h) {
    gh = h;
    gw = h * asp;
  }
  const gx = (w - gw) / 2;
  const gy = (h - gh) / 2;
  const su = Math.sqrt(gw * gh) / 1247;
  const wv = weaveAt(frame, 0.6 * p.damage);
  const visible = frame < Math.round(p.hold * fps);
  const fadeIn = seg(frame, 0, p.fadeFrames);
  const shout = p.level === 'shout';
  const sx = shout ? (h1(frame, 8) - 0.5) * 5 * su * p.shake : 0;
  const sy = shout ? (h1(frame, 9) - 0.5) * 5 * su * p.shake : 0;

  // lay out lines (wrapped to 72 % of the gate)
  const maxW = gw * (p.level === 'shout' ? 0.78 : 0.7);
  const blocks = p.lines.map((l, i) => {
    const d = defaults(p.level, i);
    const font: Lb2Font = l.font ?? d.font;
    const fam = lf(font);
    const italic = l.italic ?? (font === 'oldItalic' ? true : d.italic);
    let size = (l.size ?? d.size) * su;
    const text = p.level === 'shout' ? l.text.toUpperCase() : l.text;
    const wt = d.weight;
    const spacing = font === 'playfair' ? size * 0.05 : size * 0.01;
    let wrapped = wrapText(text, fam, size, maxW, wt, italic);
    // shrink a single very long word
    const widest = Math.max(...wrapped.map((t) => measure(t, fam, size, wt, italic) + spacing * t.length));
    if (widest > maxW) size *= maxW / widest;
    wrapped = wrapText(text, fam, size, maxW, wt, italic);
    return {fam, size, italic, wrapped, wt, spacing};
  });
  const gapL = 0.42;
  const totalH = blocks.reduce((s, b, i) => s + b.wrapped.length * b.size * 1.18 + (i ? b.size * gapL : 0), 0);
  let yy = gy + gh / 2 - totalH / 2;
  const placed = blocks.map((b, i) => {
    if (i) yy += b.size * gapL;
    const y0 = yy + b.size * 0.88;
    yy += b.wrapped.length * b.size * 1.18;
    return {...b, y0};
  });

  return (
    <AbsoluteFill style={{background: p.outside}}>
      <Svg>
        <defs>
          <clipPath id={`${id}g`}>
            <rect x={gx} y={gy} width={gw} height={gh} />
          </clipPath>
          <filter id={`${id}mot`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={`${0.012 / u} ${0.02 / u}`} numOctaves={3} seed={7} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.88  0 0 0 0 0.82  0 0 0 0.9 -0.35" />
          </filter>
        </defs>
        <g clipPath={`url(#${id}g)`}>
          <g transform={`translate(${fx(wv.x * u)},${fx(wv.y * u)})`}>
            <rect x={gx - 20} y={gy - 20} width={gw + 40} height={gh + 40} fill={p.cardColor} />
            {visible && (
              <g opacity={fadeIn}>
                <rect x={gx} y={gy} width={gw} height={gh} filter={`url(#${id}mot)`} opacity={0.06} />
                <DecoBorder level={p.level} x={gx} y={gy} w={gw} h={gh} s={su} color={p.borderColor} />
                <g transform={`translate(${fx(sx)},${fx(sy)})`}>
                  {placed.map((b, i) => (
                    <text key={i} x={gx + gw / 2} y={b.y0} textAnchor="middle" fontFamily={b.fam} fontStyle={b.italic ? 'italic' : 'normal'} fontWeight={b.wt} fontSize={b.size} letterSpacing={b.spacing} fill={p.inkColor}>
                      {b.wrapped.map((t, k) => (
                        <tspan key={k} x={gx + gw / 2} dy={k === 0 ? 0 : b.size * 1.18}>
                          {t}
                        </tspan>
                      ))}
                    </text>
                  ))}
                </g>
              </g>
            )}
          </g>
          {p.damage > 0 && <FilmDamage x={gx} y={gy} w={gw} h={gh} u={su} frame={frame} k={0.6 * p.damage} id={`${id}d`} />}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const intertitleCard = defineMotion<Props>({
  id: 'intertitle-card',
  title: 'Intertitle card (silent-film)',
  category: 'text',
  description:
    'A full-frame black painted silent-film card with an Art-Deco border whose ornament follows the emotion (narration, shout, tender, title), set in small-caps and italic serifs, with weave, flicker, scratches, dust and a hair of print damage.',
  source: ['lemo-opuscar styles/silent-film demo/engine/cards.js, STYLE.md §4 (MIT, LemoLab)'],
  useFor: 'Chapter cards, quotes, punchlines ("Meanwhile, in the lab..."), a statistic as a twist; any retro or silent-comedy explainer. The SRT text can be the card text, so it doubles as a subtitle style.',
  durationInFrames: 120,
  defaultProps: {
    lines: [{text: 'Meanwhile, in the laboratory, a small idea was quietly growing larger than the room.'}],
    level: 'narration',
    shake: 1,
    cardColor: '#141210',
    inkColor: '#e8e4da',
    borderColor: '#bdb6a8',
    hold: 3.5,
    fadeFrames: 5,
    damage: 1,
    aspect: 0,
    outside: '#050403',
  },
  propDocs: {
    lines: "card text [{text, font?, size?, italic?}]; level 'title' treats the first line as the title and the rest as italic subtitles",
    level: "'narration' | 'shout' | 'tender' | 'title': picks the border ornament and type style",
    shake: 'shout shake strength',
    cardColor: 'painted card colour',
    inkColor: 'text colour',
    borderColor: 'border colour',
    hold: 'seconds the card is shown before a cut to black',
    fadeFrames: 'fade from black at the start (0 = hard cut)',
    damage: 'print damage 0..1 (weave, flicker, scratches, dust)',
    aspect: '0 = 4:3 (3:4 in portrait), -1 = fill the frame, or a width/height number',
    outside: 'colour outside the gate',
  },
  component: IntertitleCard,
  tags: ['intertitle', 'silent film', 'title card', 'art deco', 'retro', 'subtitle', 'quote', 'chapter', 'narration', 'shout', 'tender', 'vintage', 'film damage', 'punchline', 'photoplay'],
});
