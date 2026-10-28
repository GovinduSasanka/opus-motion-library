import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeIO, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Icon, fitText, inkOn} from '../../core/r3-explain';
import {Burst, list, textEm} from '../../core/r3-edu-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Cloze exercise: a sentence with a blank, answer chips pop in below, (optionally) a wrong chip is tried and bounces
 * back with a shake, then the right chip arcs into the blank, turns green with a tick and sparkles, and the feedback appears.
 */
type Props = {
  sentence: string;
  options: string[];
  answerIndex: number;
  tryWrongFirst: boolean;
  prompt: string;
  correctText: string;
  wrongText: string;
  explanation: string;
  background: string;
  ink: string;
  accent: string;
  card: string;
  correctColor: string;
  wrongColor: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const FillInTheBlank: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.grotesk;
  const showBg = p.background !== 'transparent';
  const options = list<string>(p.options, ['mat', 'sky', 'cloud']).map(String);
  const nOpt = options.length;
  const ans = Math.min(nOpt - 1, Math.max(0, Math.round(p.answerIndex || 0)));
  const wrong = options.findIndex((_, i) => i !== ans);
  const doWrong = p.tryWrongFirst && wrong >= 0;

  const marker = /_{2,}/;
  const parts = String(p.sentence).split(marker);
  const before = (parts[0] ?? '').replace(/\s+$/, '');
  const after = (parts.slice(1).join(' ') ?? '').replace(/^\s+/, '');

  // --- sentence layout (blank is a fixed slot, text hangs off both sides)
  const availW = w * (portrait ? 0.9 : 0.84);
  const maxOptEm = Math.max(...options.map((o) => textEm(o)), 2);
  const slotEm = maxOptEm + 0.9;
  const bEm = textEm(before);
  const aEm = textEm(after);
  const gapEm = 0.28;
  const totalEm = bEm + aEm + slotEm + (before ? gapEm : 0) + (after ? gapEm : 0);
  const fs = Math.max(30 * u, Math.min((portrait ? 104 : 118) * u, availW / totalEm));
  const slotW = slotEm * fs;
  const slotH = fs * 1.4;
  const totalW = totalEm * fs;
  const left0 = w / 2 - totalW / 2;
  const slotL = left0 + bEm * fs + (before ? gapEm * fs : 0);
  const slotCx = slotL + slotW / 2;
  const sentY = h * (portrait ? 0.34 : 0.37);

  // --- chips layout
  const chipFs = Math.max(28 * u, Math.min(fs * 0.62, 62 * u));
  const chipH = chipFs * 1.9;
  const chipW = options.map((o) => textEm(o) * chipFs + chipFs * 1.6);
  const gap = 26 * u;
  const rowsArr: number[][] = [[]];
  let rowW = 0;
  options.forEach((_, i) => {
    const cur = rowsArr[rowsArr.length - 1];
    if (cur.length && rowW + gap + chipW[i] > availW) {
      rowsArr.push([i]);
      rowW = chipW[i];
    } else {
      cur.push(i);
      rowW += (cur.length > 1 ? gap : 0) + chipW[i];
    }
  });
  const chipY0 = h * (portrait ? 0.52 : 0.6);
  const slots: {x: number; y: number}[] = [];
  rowsArr.forEach((row, ri) => {
    const rw = row.reduce((a, i) => a + chipW[i], 0) + gap * (row.length - 1);
    let x = w / 2 - rw / 2;
    row.forEach((i) => {
      slots[i] = {x: x + chipW[i] / 2, y: chipY0 + ri * chipH * 1.35};
      x += chipW[i] + gap;
    });
  });

  // --- timeline
  const tChips = 52;
  const tWrong = 104;
  const wrongFly = 22;
  const wrongHold = 26;
  const wrongBack = 20;
  const tCorrect = doWrong ? tWrong + wrongFly + wrongHold + wrongBack + 14 : tWrong;
  const flyDur = 26;
  const land = tCorrect + flyDur;

  const promptIn = easeOut3(sseg(f, 0, 18));
  const blankPulse = 0.5 + 0.5 * Math.sin(f * 0.18);

  const flyState = (i: number) => {
    // returns {e, mode}: e=0 at slot, 1 at blank
    if (doWrong && i === wrong) {
      if (f < tWrong) return {e: 0, mode: 'idle' as const};
      if (f < tWrong + wrongFly) return {e: easeIO(sseg(f, tWrong, tWrong + wrongFly)), mode: 'wrong' as const};
      if (f < tWrong + wrongFly + wrongHold) return {e: 1, mode: 'wrongHold' as const};
      if (f < tWrong + wrongFly + wrongHold + wrongBack) return {e: 1 - easeIO(sseg(f, tWrong + wrongFly + wrongHold, tWrong + wrongFly + wrongHold + wrongBack)), mode: 'wrongBack' as const};
      return {e: 0, mode: 'idle' as const};
    }
    if (i === ans) {
      if (f < tCorrect) return {e: 0, mode: 'idle' as const};
      if (f < land) return {e: easeIO(sseg(f, tCorrect, land)), mode: 'fly' as const};
      return {e: 1, mode: 'placed' as const};
    }
    return {e: 0, mode: 'idle' as const};
  };

  const placedQ = f >= land ? easeOut3(sseg(f, land, land + 16)) : 0;
  const bannerIn = backOut(sseg(f, land + 12, land + 34));
  const expIn = easeOut3(sseg(f, land + 30, land + 56));
  const wrongMsgIn = doWrong ? easeOut3(sseg(f, tWrong + wrongFly, tWrong + wrongFly + 10)) * (1 - easeOut3(sseg(f, tWrong + wrongFly + wrongHold, tWrong + wrongFly + wrongHold + 12))) : 0;
  const expFit = fitText(p.explanation, availW * 0.92, h * 0.1, 40 * u, 24 * u, 0.52, 1.3);

  const chipEls = options.map((o, i) => {
    const s = slots[i];
    const inQ = backOut(sseg(f, tChips + i * 7, tChips + i * 7 + 18), 1.9);
    const {e, mode} = flyState(i);
    const away = mode !== 'idle' && e > 0;
    const arc = -Math.sin(e * Math.PI) * 70 * u;
    const x = s.x + (slotCx - s.x) * e;
    const y = s.y + (sentY - s.y) * e + arc;
    const wNow = chipW[i] + (slotW - chipW[i]) * e;
    const hNow = chipH + (slotH - chipH) * e;
    const fNow = chipFs + (fs - chipFs) * e;
    const isAns = i === ans;
    const dim = f >= land && !isAns ? 0.35 : 1;
    let bg = p.accent;
    let fg = inkOn(p.accent);
    let border = 'transparent';
    let shake = 0;
    if (mode === 'wrongHold') {
      bg = withAlpha(p.wrongColor, 0.18);
      fg = p.wrongColor;
      border = p.wrongColor;
      shake = Math.sin((f - tWrong - wrongFly) * 1.7) * 9 * u * (1 - sseg(f, tWrong + wrongFly, tWrong + wrongFly + wrongHold));
    } else if (mode === 'wrong' && e > 0.85) {
      bg = withAlpha(p.wrongColor, 0.18);
      fg = p.wrongColor;
      border = p.wrongColor;
    } else if (mode === 'wrongBack') {
      bg = mixHex(p.wrongColor, p.accent, 1 - e);
      fg = inkOn(bg);
    } else if (mode === 'placed') {
      bg = mixHex(p.accent, p.correctColor, placedQ);
      bg = withAlpha(p.correctColor, 0.16 * placedQ + (1 - placedQ) * 0.9);
      fg = placedQ > 0.5 ? p.correctColor : inkOn(p.accent);
      border = placedQ > 0.5 ? p.correctColor : 'transparent';
    } else if (mode === 'fly') {
      bg = p.accent;
    }
    return (
      <React.Fragment key={i}>
        {/* ghost slot where the chip came from */}
        <div style={{position: 'absolute', left: s.x - chipW[i] / 2, top: s.y - chipH / 2, width: chipW[i], height: chipH, borderRadius: chipH / 2, border: `${3 * u}px dashed ${withAlpha(p.ink, 0.25)}`, opacity: inQ * (away ? 1 : 0), boxSizing: 'border-box'}} />
        <div style={{position: 'absolute', left: x - wNow / 2 + shake, top: y - hNow / 2, width: wNow, height: hNow, borderRadius: hNow / 2, background: bg, border: `${(mode === 'placed' || mode === 'wrongHold' ? 4 : 0) * u}px solid ${border}`, boxSizing: 'border-box', color: fg, fontFamily: font, fontWeight: 700, fontSize: fNow, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, inQ * 1.5) * dim, transform: `scale(${mode === 'idle' ? 0.4 + 0.6 * inQ : 1 + 0.06 * Math.sin(e * Math.PI)})`, boxShadow: mode === 'placed' ? 'none' : `0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.22)`, whiteSpace: 'nowrap'}}>{o}</div>
      </React.Fragment>
    );
  });

  const sentIn = (k: number) => easeOut3(sseg(f, 8 + k * 6, 30 + k * 6));
  const textStyle: React.CSSProperties = {position: 'absolute', top: sentY - slotH / 2, height: slotH, display: 'flex', alignItems: 'center', fontFamily: font, fontWeight: 600, fontSize: fs, color: p.ink, whiteSpace: 'pre', letterSpacing: -0.5 * u};

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined, overflow: 'hidden'}}>
      {/* prompt pill */}
      <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.13 : 0.12), display: 'flex', justifyContent: 'center', opacity: promptIn, transform: `translateY(${(1 - promptIn) * -20 * u}px)`}}>
        <div style={{padding: `${10 * u}px ${34 * u}px`, borderRadius: 999, background: withAlpha(p.accent, 0.16), color: p.accent, fontFamily: fonts.sans, fontWeight: 800, fontSize: 32 * u, letterSpacing: 4 * u, textTransform: 'uppercase'}}>{p.prompt}</div>
      </div>

      {/* sentence card + text */}
      <div style={{position: 'absolute', left: w / 2 - (totalW + 120 * u) / 2, top: sentY - slotH / 2 - 44 * u, width: totalW + 120 * u, height: slotH + 88 * u, borderRadius: 40 * u, background: p.card, boxShadow: `0 ${20 * u}px ${60 * u}px rgba(0,0,0,0.12)`, opacity: easeOut3(sseg(f, 0, 22)), transform: `scale(${0.96 + 0.04 * easeOut3(sseg(f, 0, 22))})`}} />
      {before ? <div style={{...textStyle, right: w - (slotL - gapEm * fs), justifyContent: 'flex-end', opacity: sentIn(0), transform: `translateY(${(1 - sentIn(0)) * 18 * u}px)`}}>{before}</div> : null}
      {after ? <div style={{...textStyle, left: slotL + slotW + gapEm * fs, opacity: sentIn(1), transform: `translateY(${(1 - sentIn(1)) * 18 * u}px)`}}>{after}</div> : null}
      {/* the blank */}
      <div style={{position: 'absolute', left: slotL, top: sentY - slotH / 2, width: slotW, height: slotH, opacity: sentIn(0.5)}}>
        <div style={{position: 'absolute', inset: `${slotH * 0.12}px 0`, borderRadius: slotH * 0.2, background: withAlpha(f >= land ? p.correctColor : p.accent, f >= land ? 0.08 : 0.1 + 0.08 * blankPulse)}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: slotH * 0.14, height: 7 * u, borderRadius: 7 * u, background: f >= land ? p.correctColor : mixHex(p.accent, p.ink, 0.1), opacity: f >= land ? 1 : 0.55 + 0.45 * blankPulse}} />
      </div>

      {/* chips */}
      {chipEls}

      {/* wrong message */}
      {wrongMsgIn > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: sentY + slotH / 2 + 70 * u, textAlign: 'center', fontFamily: fonts.sans, fontWeight: 700, fontSize: 40 * u, color: p.wrongColor, opacity: wrongMsgIn, transform: `translateY(${(1 - wrongMsgIn) * 14 * u}px)`}}>{p.wrongText}</div>
      )}

      {/* feedback */}
      {bannerIn > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.74 : 0.78), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 * u}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22 * u, padding: `${14 * u}px ${44 * u}px ${14 * u}px ${24 * u}px`, borderRadius: 999, background: p.correctColor, color: inkOn(p.correctColor), fontFamily: font, fontWeight: 700, fontSize: 60 * u, transform: `scale(${Math.max(0, bannerIn)})`, boxShadow: `0 ${14 * u}px ${40 * u}px ${withAlpha(p.correctColor, 0.4)}`}}>
            <svg width={68 * u} height={68 * u} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={withAlpha(inkOn(p.correctColor), 0.2)} /><Icon name="check" x={12} y={12} size={15} color={inkOn(p.correctColor)} sw={3} progress={sseg(f, land + 16, land + 30)} /></svg>
            {p.correctText}
          </div>
          {p.explanation ? <div style={{width: availW * 0.92, textAlign: 'center', fontFamily: fonts.sans, fontWeight: 500, fontSize: expFit.fs, lineHeight: expFit.lh, color: withAlpha(p.ink, 0.75), opacity: expIn, transform: `translateY(${(1 - expIn) * 16 * u}px)`}}>{expFit.lines.join(' ')}</div> : null}
        </div>
      )}

      {/* sparkles + wrong cross */}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <Burst x={slotCx} y={sentY} t={sseg(f, land, land + 40)} colors={[p.correctColor, p.accent, '#FFD23F', '#4DB6E8']} n={18} radius={slotW * 0.9} seed={7} size={14 * u} />
        {doWrong && f >= tWrong + wrongFly && f < tWrong + wrongFly + wrongHold + 10 && (
          <g transform={`translate(${slotCx + slotW / 2 + 10 * u} ${sentY - slotH / 2 - 6 * u}) scale(${backOut(sseg(f, tWrong + wrongFly, tWrong + wrongFly + 10))})`}>
            <circle r={26 * u} fill={p.wrongColor} />
            <Icon name="cross" x={0} y={0} size={26 * u} color="#fff" sw={3} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const fillInTheBlank = defineMotion<Props>({
  id: 'fill-in-the-blank',
  title: 'Fill in the blank',
  category: 'text',
  description: 'A cloze exercise: a sentence with a pulsing blank, answer chips that pop in below, a wrong chip that is tried and bounces back with a shake and a cross, then the right chip arcs into the blank, turns green with a tick and sparkles and the feedback appears.',
  source: ['original (round 3)'],
  useFor: 'Grammar and vocabulary exercises, language-learning reels, classroom quiz clips, ESL practice posts and "can you spot the right word?" engagement videos — pass the sentence with ___ for the blank, the options and the answer.',
  durationInFrames: 330,
  defaultProps: {
    sentence: 'The cat sat on the ___ all day.',
    options: ['mat', 'sky', 'cloud'],
    answerIndex: 0,
    tryWrongFirst: true,
    prompt: 'Fill in the blank',
    correctText: 'Correct!',
    wrongText: 'Not quite - try again',
    explanation: 'A cat can sit on a mat, but not on the sky.',
    background: '#EAF2FF',
    ink: '#1D2440',
    accent: '#4C6FFF',
    card: '#FFFFFF',
    correctColor: '#1FA463',
    wrongColor: '#E5484D',
    fontFamily: '',
    startAt: 0,
    speed: 1,
  },
  propDocs: {
    sentence: 'the sentence; write ___ (3 underscores) where the blank goes',
    options: 'answer chips shown below the sentence',
    answerIndex: 'index (0-based) of the correct option',
    tryWrongFirst: 'try a wrong option first (shake + cross) before the correct one lands',
    prompt: 'label pill above the sentence',
    correctText: 'headline of the success banner',
    wrongText: 'message while the wrong option is in the blank',
    explanation: 'optional one-line explanation under the success banner (empty hides it)',
    background: "backdrop colour or 'transparent'",
    ink: 'sentence text colour',
    accent: 'chip and blank colour',
    card: 'sentence card colour',
    correctColor: 'success colour',
    wrongColor: 'wrong-answer colour',
    fontFamily: 'optional CSS font-family for the sentence and chips (empty = grotesk)',
    startAt: 'frame the exercise starts',
    speed: 'playback speed multiplier',
  },
  component: FillInTheBlank,
  tags: ['fill in the blank', 'cloze', 'quiz', 'grammar', 'language', 'esl', 'worksheet', 'exercise', 'vocabulary', 'education', 'school', 'answer', 'sentence', 'learning', 'test'],
});
