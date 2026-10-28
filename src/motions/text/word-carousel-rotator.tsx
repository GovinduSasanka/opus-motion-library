import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {Bg, fitBlock, useTextWidths, wrapWords} from '../../core/kinetic-type-kit';
import {estWidth, fitSize, tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Word carousel rotator: a fixed sentence with one swapping word — "We build [fast | safe | beautiful] apps".
 * The word sits in a clipped box (optionally an accent pill) whose width glides to each new word's measured width
 * while the rest of the sentence re-centres (or stays anchored). Transitions: roll (slot machine), blur, flip, slide.
 * Falls back to a stacked three-line layout when the sentence is too wide (portrait / long copy).
 */

type Props = {
  prefix: string;
  words: string[];
  suffix: string;
  layout: 'auto' | 'inline' | 'stacked';
  transition: 'roll' | 'blur' | 'flip' | 'slide';
  pill: boolean;
  anchor: 'center' | 'prefix';
  loop: boolean;
  startAt: number;
  interval: number;
  transitionFrames: number;
  font: TFont;
  size: number;
  weight: number;
  tracking: number;
  background: string;
  ink: string;
  accent: string;
  pillInk: string;
};

const Rotator: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const words = p.words.length ? p.words : ['…'];
  const n = words.length;
  const maxW = w * 0.88;
  const size0 = p.size * u;
  const longest = words.reduce((a, b) => (estWidth(b, size0, p.font) > estWidth(a, size0, p.font) ? b : a), words[0]);
  const padX = p.pill ? 0.34 : 0;
  const gapEm = 0.28;

  // choose layout from estimates
  const inlineEst = estWidth(`${p.prefix} ${longest} ${p.suffix}`, size0, p.font, p.tracking) + size0 * (padX * 2 + 0.1);
  const inline = p.layout === 'inline' || (p.layout === 'auto' && inlineEst <= maxW / 0.62);
  let size: number;
  if (inline) size = Math.min(size0, (size0 * maxW) / Math.max(1, inlineEst));
  else {
    const sBase = size0 * 1.05;
    const sWord = fitSize(longest, sBase, maxW - sBase * padX * 2, p.font, p.tracking);
    const sPre = p.prefix ? fitBlock(p.prefix, sBase, maxW, h * 0.28, p.font, 1.32, p.tracking).size : sBase;
    const sSuf = p.suffix ? fitBlock(p.suffix, sBase, maxW, h * 0.28, p.font, 1.32, p.tracking).size : sBase;
    size = Math.min(sWord, sPre, sSuf);
  }
  const boxH = size * 1.32;

  const {widths, probes} = useTextWidths([p.prefix, p.suffix, ...words], tfonts[p.font], size, p.weight, p.tracking * size);
  const wOf = (i: number) => (widths && widths[i + 2] ? widths[i + 2] : estWidth(words[i], size, p.font, p.tracking));
  const wPre = widths && widths[0] !== undefined && p.prefix ? widths[0] : estWidth(p.prefix, size, p.font, p.tracking);
  const wSuf = widths && widths[1] !== undefined && p.suffix ? widths[1] : estWidth(p.suffix, size, p.font, p.tracking);
  const boxOf = (i: number) => wOf(i) + size * padX * 2;

  // step logic
  const dur = Math.max(6, p.transitionFrames);
  const sRaw = Math.floor((frame - p.startAt) / Math.max(dur + 4, p.interval));
  const s = p.loop ? sRaw : Math.min(sRaw, n - 1);
  const T = p.startAt + Math.max(s, 0) * Math.max(dur + 4, p.interval);
  const idx = (k: number) => (p.loop ? ((k % n) + n) % n : Math.min(k, n - 1));
  const curI = idx(Math.max(s, 0));
  const prevI = s >= 1 ? idx(s - 1) : -1;
  const tp = frame < p.startAt ? 0 : prog(frame, T, T + dur, p.transition === 'roll' ? ease.back : ease.out);
  const tpl = frame < p.startAt ? 0 : prog(frame, T, T + dur, ease.out);
  const prevBox = prevI < 0 ? boxOf(curI) : boxOf(prevI);
  const boxW = lerp(prevBox, boxOf(curI), tpl);
  const maxBox = Math.max(...words.map((_, i) => boxOf(i)));
  const pillScale = p.pill ? (s < 0 ? 0 : s === 0 ? tpl : 1) : 1;
  const intro = prog(frame, 0, 18, ease.out);

  const renderWord = (i: number, state: 'in' | 'out') => {
    const t = state === 'in' ? tp : tpl;
    const tIn = state === 'in' ? tp : 0;
    let tf = '';
    let op = 1;
    let filter: string | undefined;
    const dist = boxH * 0.95;
    if (p.transition === 'roll') {
      tf = state === 'in' ? `translateY(${(1 - tIn) * dist}px)` : `translateY(${-tpl * dist}px)`;
      op = state === 'in' ? clamp01(tpl * 2.2) : 1 - clamp01(tpl * 1.6);
    } else if (p.transition === 'slide') {
      tf = state === 'in' ? `translateX(${(1 - tpl) * size * 1.2}px)` : `translateX(${-tpl * size * 1.2}px)`;
      op = state === 'in' ? tpl : 1 - tpl;
    } else if (p.transition === 'blur') {
      op = state === 'in' ? tpl : 1 - tpl;
      filter = `blur(${(state === 'in' ? 1 - tpl : tpl) * size * 0.14}px)`;
      tf = `scale(${state === 'in' ? 0.92 + 0.08 * tpl : 1 + 0.08 * tpl})`;
    } else {
      const a = state === 'in' ? (1 - tpl) * 90 : -tpl * 90;
      tf = `perspective(${size * 6}px) rotateX(${a}deg)`;
      op = state === 'in' ? (tpl > 0.45 ? 1 : 0) : tpl < 0.5 ? 1 : 0;
    }
    void t;
    return (
      <div
        key={`${state}-${i}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: boxH,
          lineHeight: `${boxH}px`,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          transform: tf,
          opacity: op,
          filter,
          transformOrigin: '50% 50%',
        }}
      >
        {words[i]}
      </div>
    );
  };

  const wordBox = (
    <div
      style={{
        position: 'relative',
        width: boxW,
        height: boxH,
        overflow: 'hidden',
        borderRadius: p.pill ? boxH * 0.34 : 0,
        background: p.pill ? p.accent : 'transparent',
        color: p.pill ? p.pillInk : p.accent,
        transform: `scale(${pillScale})`,
        transformOrigin: '50% 60%',
        fontFamily: tfonts[p.font],
        fontSize: size,
        fontWeight: p.weight,
        letterSpacing: p.tracking * size,
      }}
    >
      {s >= 0 ? (
        <>
          {prevI >= 0 && tpl < 1 ? renderWord(prevI, 'out') : null}
          {renderWord(curI, 'in')}
        </>
      ) : null}
    </div>
  );

  const textStyle: React.CSSProperties = {fontFamily: tfonts[p.font], fontSize: size, fontWeight: p.weight, letterSpacing: p.tracking * size, color: p.ink, lineHeight: `${boxH}px`, whiteSpace: 'nowrap'};
  const gap = size * gapEm;
  const fade = (k: number) => prog(frame, k, k + 18, ease.out);

  let body: React.ReactNode;
  if (inline) {
    const total = wPre + (p.prefix ? gap : 0) + boxW + (p.suffix ? gap : 0) + wSuf;
    const totalMax = wPre + (p.prefix ? gap : 0) + maxBox + (p.suffix ? gap : 0) + wSuf;
    const left = p.anchor === 'prefix' ? (w - totalMax) / 2 : (w - total) / 2;
    body = (
      <div style={{position: 'absolute', left, top: h / 2 - boxH / 2, height: boxH, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'}}>
        {p.prefix ? <div style={{...textStyle, marginRight: gap, opacity: intro, transform: `translateY(${(1 - intro) * size * 0.3}px)`}}>{p.prefix}</div> : null}
        {wordBox}
        {p.suffix ? <div style={{...textStyle, marginLeft: gap, opacity: fade(6), transform: `translateY(${(1 - fade(6)) * size * 0.3}px)`}}>{p.suffix}</div> : null}
      </div>
    );
  } else {
    const rows: React.ReactNode[] = [];
    const preLines = p.prefix ? wrapWords(p.prefix, size, maxW, p.font, p.tracking) : [];
    const sufLines = p.suffix ? wrapWords(p.suffix, size, maxW, p.font, p.tracking) : [];
    if (p.prefix) rows.push(<div key="pre" style={{...textStyle, textAlign: 'center', whiteSpace: 'pre', opacity: intro, transform: `translateY(${(1 - intro) * size * 0.3}px)`}}>{preLines.join('\n')}</div>);
    rows.push(<div key="word" style={{display: 'flex', justifyContent: 'center', margin: `${size * 0.06}px 0`}}>{wordBox}</div>);
    if (p.suffix) rows.push(<div key="suf" style={{...textStyle, textAlign: 'center', whiteSpace: 'pre', opacity: fade(6), transform: `translateY(${(1 - fade(6)) * size * 0.3}px)`}}>{sufLines.join('\n')}</div>);
    body = (
      <div style={{position: 'absolute', left: 0, width: w, top: h / 2 - (boxH * (preLines.length + 1 + sufLines.length) + size * 0.12) / 2}}>{rows}</div>
    );
  }

  return (
    <Bg background={p.background} glow={p.accent} glowAmount={0.08}>
      {probes}
      {body}
    </Bg>
  );
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const wordCarouselRotator = defineMotion<Props>({
  id: 'word-carousel-rotator',
  title: 'Word carousel rotator',
  category: 'text',
  description:
    'A fixed sentence with one swapping word — "We build [fast | safe | beautiful | scalable] apps": the word rolls like a slot machine (or blurs, flips, slides) inside an accent pill whose width glides to each new word while the rest re-centres; stacks into three lines on narrow frames.',
  source: ['original — generic kinetic-type effect (R3)'],
  useFor: 'Website hero taglines, value-prop rotators, "for designers / developers / teams" audience swaps, intro slides, social hooks; set prefix, words[] and suffix.',
  durationInFrames: 220,
  defaultProps: {
    prefix: 'We build',
    words: ['fast', 'secure', 'beautiful', 'scalable'],
    suffix: 'apps',
    layout: 'auto',
    transition: 'roll',
    pill: true,
    anchor: 'center',
    loop: true,
    startAt: 14,
    interval: 50,
    transitionFrames: 14,
    font: 'sans',
    size: 150,
    weight: 800,
    tracking: -0.01,
    background: '#F5F1E8',
    ink: '#16130F',
    accent: '#FF5A36',
    pillInk: '#FFFFFF',
  },
  propDocs: {
    prefix: 'static text before the swapping word ("" for none)',
    words: 'the words that rotate, in order',
    suffix: 'static text after the swapping word ("" for none)',
    layout: 'auto (inline if it fits, otherwise stacked) | inline | stacked',
    transition: 'roll | blur | flip | slide — how one word replaces another',
    pill: 'put the word on an accent pill (false = accent-coloured text)',
    anchor: 'center (sentence re-centres as the word width changes) | prefix (prefix stays put)',
    loop: 'wrap back to the first word after the last (false = hold the last word)',
    startAt: 'frame the first word rolls in',
    interval: 'frames each word stays (min transitionFrames + 4)',
    transitionFrames: 'frames each swap takes',
    font: 'font role',
    size: 'max font size in u; shrinks to fit the frame',
    weight: 'font weight',
    tracking: 'letter spacing in em',
    background: 'background colour; "transparent" for an overlay',
    ink: 'colour of the fixed text',
    accent: 'pill / word colour',
    pillInk: 'word colour when on the pill',
  },
  component: Rotator,
  tags: ['text', 'word', 'rotator', 'carousel', 'swap', 'hero', 'headline', 'tagline', 'website', 'slot', 'roll', 'typography', 'kinetic', 'value-prop', 'overlay'],
});
