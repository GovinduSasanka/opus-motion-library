import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {Bg, fitBlock, h01} from '../../core/kinetic-type-kit';
import {estWidth, tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Typewriter, delete, retype: a fixed lead-in is typed once, then a list of phrases is typed after it, held,
 * deleted (backspacing or select-all-and-delete) and replaced by the next — with uneven keystroke rhythm, an
 * optional typo that is noticed and corrected, and a blinking caret (bar, block or underscore) that stays solid
 * while keys are pressed. Everything is a pure function of the frame (the keystroke schedule is precomputed).
 */

type Props = {
  prefix: string;
  phrases: string[];
  typo: boolean;
  deleteStyle: 'backspace' | 'select';
  loop: boolean;
  typeCps: number;
  deleteCps: number;
  hold: number;
  startAt: number;
  cursor: 'bar' | 'block' | 'underscore';
  align: 'left' | 'center';
  font: TFont;
  size: number;
  weight: number;
  tracking: number;
  seed: number;
  background: string;
  ink: string;
  accent: string;
  cursorColor: string;
  selectColor: string;
};

type KeyState = {t: number; pre: string; ph: string; sel: boolean; press: boolean};

const buildSchedule = (p: Props): KeyState[] => {
  const out: KeyState[] = [];
  const stepT = (cps: number, i: number, ch: string, seed: number) => {
    const base = 30 / Math.max(1, cps);
    const jitter = 0.65 + 0.7 * h01(i, ch.charCodeAt(0), seed);
    const extra = ch === ' ' ? base * 0.5 : /[.,!?]/.test(ch) ? base * 0.7 : 0;
    return Math.max(1, base * jitter + extra);
  };
  let t = p.startAt;
  let pre = '';
  let ph = '';
  out.push({t: 0, pre: '', ph: '', sel: false, press: false});
  [...p.prefix].forEach((ch, i) => {
    t += stepT(p.typeCps, i, ch, p.seed);
    pre += ch;
    out.push({t, pre, ph, sel: false, press: true});
  });
  t += 8;
  const n = p.phrases.length;
  for (let k = 0; k < n; k++) {
    const phrase = [...p.phrases[k]];
    ph = '';
    const typoAt = p.typo && k % 2 === 1 && phrase.length >= 4 ? Math.floor(phrase.length * 0.55) : -1;
    for (let i = 0; i < phrase.length; i++) {
      if (i === typoAt) {
        const wrong = /[a-z]/i.test(phrase[i]) ? String.fromCharCode(phrase[i].charCodeAt(0) + (phrase[i] === 'z' ? -1 : 1)) : '#';
        t += stepT(p.typeCps, i + 50, wrong, p.seed);
        out.push({t, pre, ph: ph + wrong, sel: false, press: true});
        t += 11; // notices the mistake
        out.push({t, pre, ph: ph + wrong, sel: false, press: false});
        t += 4;
        out.push({t, pre, ph, sel: false, press: true});
        t += 5;
      }
      t += stepT(p.typeCps, i + k * 31, phrase[i], p.seed);
      ph += phrase[i];
      out.push({t, pre, ph, sel: false, press: true});
    }
    t += p.hold;
    const last = k === n - 1;
    if (last && !p.loop) break;
    if (p.deleteStyle === 'select') {
      out.push({t, pre, ph, sel: true, press: false});
      t += 12;
      ph = '';
      out.push({t, pre, ph, sel: false, press: true});
    } else {
      const len = [...ph].length;
      for (let i = len - 1; i >= 0; i--) {
        const accel = 1 - 0.45 * ((len - 1 - i) / Math.max(1, len - 1));
        t += (30 / Math.max(1, p.deleteCps)) * accel;
        ph = [...ph].slice(0, i).join('');
        out.push({t, pre, ph, sel: false, press: true});
      }
    }
    t += 9;
  }
  return out;
};

const Typewriter: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const sched = buildSchedule(p);
  let cur = sched[0];
  for (const s of sched) if (s.t <= frame) cur = s;
  else break;
  const sinceKey = frame - cur.t;
  const pressing = cur.press && sinceKey < 9;
  const blinkOn = pressing || Math.floor(Math.max(0, frame - cur.t - 9) / 15) % 2 === 0;

  const longest = [p.prefix + p.phrases.reduce((a, b) => (b.length > a.length ? b : a), '')].join('');
  const maxW = w * (w < h ? 0.86 : 0.8);
  const {size, lines} = fitBlock(longest, p.size * u, maxW, h * 0.55, p.font, 1.25, p.tracking);
  const lh = size * 1.25;
  const boxW = Math.min(maxW, Math.max(...lines.map((l) => estWidth(l, size, p.font, p.tracking))) * 1.06 + size * 0.5);
  const boxH = lines.length * lh;
  const left = p.align === 'center' ? (w - maxW) / 2 : (w - boxW) / 2;
  const width = p.align === 'center' ? maxW : boxW;
  const enter = prog(frame, 0, 12, ease.out);

  const cursorEl = (() => {
    const base: React.CSSProperties = {display: 'inline-block', background: p.cursorColor, opacity: blinkOn ? 1 : 0, verticalAlign: 'baseline'};
    if (p.cursor === 'block') return <span style={{...base, width: size * 0.56, height: size * 0.95, marginLeft: size * 0.04, transform: `translateY(${size * 0.14}px)`}} />;
    if (p.cursor === 'underscore') return <span style={{...base, width: size * 0.56, height: Math.max(3, size * 0.09), marginLeft: size * 0.04}} />;
    return <span style={{...base, width: Math.max(3, size * 0.07), height: size * 1.0, marginLeft: size * 0.05, transform: `translateY(${size * 0.16}px)`}} />;
  })();

  return (
    <Bg background={p.background} glow={p.accent} glowAmount={0.06}>
      <div
        style={{
          position: 'absolute',
          left,
          width,
          top: h / 2 - boxH / 2,
          minHeight: boxH,
          textAlign: p.align,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: `${lh}px`,
          fontFamily: tfonts[p.font],
          fontSize: size,
          fontWeight: p.weight,
          letterSpacing: p.tracking * size,
          color: p.ink,
          opacity: enter,
        }}
      >
        <span>{cur.pre}</span>
        <span style={{color: p.accent, background: cur.sel ? p.selectColor : 'transparent', borderRadius: size * 0.06}}>{cur.ph}</span>
        {cursorEl}
      </div>
    </Bg>
  );
};

export const typewriterDeleteRetype = defineMotion<Props>({
  id: 'typewriter-delete-retype',
  title: 'Typewriter delete & retype',
  category: 'text',
  description:
    'A lead-in line is typed once, then phrases are typed after it with an uneven keystroke rhythm, held, then deleted — backspacing with accelerating speed or select-all-and-delete — and replaced by the next phrase, with an optional typo that is noticed and corrected and a blinking bar, block or underscore caret.',
  source: ['original — generic kinetic-type effect (R3)'],
  useFor: 'Hero taglines that cycle ("Built to be fast / secure / simple"), search-box and prompt demos, "we help X do Y" rotators, chat/AI typing intros, coding-themed titles; set prefix and phrases[].',
  durationInFrames: 290,
  defaultProps: {
    prefix: 'Built to be ',
    phrases: ['fast.', 'secure.', 'simple.'],
    typo: true,
    deleteStyle: 'backspace',
    loop: true,
    typeCps: 12,
    deleteCps: 26,
    hold: 38,
    startAt: 10,
    cursor: 'bar',
    align: 'left',
    font: 'mono',
    size: 110,
    weight: 700,
    tracking: 0,
    seed: 5,
    background: '#0F1217',
    ink: '#ECEFF4',
    accent: '#4FE3A6',
    cursorColor: '#4FE3A6',
    selectColor: 'rgba(79,227,166,0.28)',
  },
  propDocs: {
    prefix: 'lead-in typed once and kept (include a trailing space if the phrase follows directly)',
    phrases: 'phrases typed, held and deleted one after another',
    typo: 'every second phrase gets a mistyped letter that is noticed and corrected',
    deleteStyle: 'backspace (letter by letter, speeding up) | select (highlight the phrase, then delete at once)',
    loop: 'delete the last phrase too (false = last phrase stays on screen)',
    typeCps: 'typing speed in characters per second',
    deleteCps: 'backspace speed in characters per second',
    hold: 'frames a finished phrase stays before deleting',
    startAt: 'frame typing starts',
    cursor: 'bar | block | underscore',
    align: 'left (anchored, block centred on screen) | center',
    font: 'font role (mono looks most typed)',
    size: 'max font size in u; shrinks so the longest line fits',
    weight: 'font weight',
    tracking: 'letter spacing in em',
    seed: 'keystroke-rhythm seed',
    background: 'background colour; "transparent" for an overlay',
    ink: 'lead-in colour',
    accent: 'phrase colour',
    cursorColor: 'caret colour',
    selectColor: 'selection highlight colour (select delete style)',
  },
  component: Typewriter,
  tags: ['text', 'typewriter', 'typing', 'delete', 'backspace', 'retype', 'cursor', 'caret', 'tagline', 'hero', 'rotator', 'prompt', 'ai', 'search', 'typography', 'kinetic', 'website', 'overlay'],
});
