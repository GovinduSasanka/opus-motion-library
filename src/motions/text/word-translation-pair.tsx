import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {easeIn3, easeIO, easeOut3, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Icon, inkOn} from '../../core/r3-explain';
import {list, textEm} from '../../core/r3-edu-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Language lesson: a word in language A rolls away letter by letter and the same word in language B rolls in; the
 * language chips swap highlight, and a pronunciation line sweeps in with a speaker icon. Cycles through any number of pairs.
 */
type Pair = {from: string; to: string; pron: string};
type Props = {
  pairs: Pair[];
  fromLang: string;
  toLang: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
  pairFrames: number;
  startAt: number;
  speed: number;
};

const DEFAULT_PAIRS: Pair[] = [
  {from: 'Hello', to: 'Hola', pron: 'OH-lah'},
  {from: 'Thank you', to: 'Gracias', pron: 'GRAH-see-ahs'},
  {from: 'Friend', to: 'Amigo', pron: 'ah-MEE-go'},
];

const WordTranslationPair: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.grotesk;
  const showBg = p.background !== 'transparent';
  const pairs = list<Pair>(p.pairs, DEFAULT_PAIRS).map((x) => ({from: String(x?.from ?? ''), to: String(x?.to ?? ''), pron: String(x?.pron ?? '')}));
  const n = pairs.length;
  const cycle = Math.max(90, Math.round(p.pairFrames || 120));
  const lead = 8;
  const idx = Math.min(n - 1, Math.max(0, Math.floor((f - lead) / cycle)));
  const t = f - lead - idx * cycle;
  const pair = pairs[idx];
  const isLast = idx === n - 1;

  const MORPH = Math.round(cycle * 0.38);
  const exitT = isLast ? 0 : easeIn3(sseg(t, cycle - 12, cycle - 2));
  const groupOp = 1 - exitT;
  const groupDy = -exitT * 30 * u;

  const availW = portrait ? w * 0.88 : w * 0.74;
  const emMax = Math.max(textEm(pair.from), textEm(pair.to), 1);
  const fs = Math.min((portrait ? 190 : 220) * u, availW / emMax);
  const cx = w / 2;
  const cy = h * (portrait ? 0.46 : 0.5);

  const tm = t - MORPH;
  const fromChars = Array.from(pair.from);
  const toChars = Array.from(pair.to);

  const switched = easeIO(sseg(tm, 4, 22));
  const chipFont = (portrait ? 34 : 32) * u;
  const chip = (label: string, active: number) => (
    <div style={{padding: `${10 * u}px ${30 * u}px`, borderRadius: 999, fontFamily: fonts.sans, fontWeight: 800, fontSize: chipFont, letterSpacing: 2 * u, textTransform: 'uppercase', background: active > 0.5 ? p.accent : 'transparent', color: active > 0.5 ? inkOn(p.accent) : withAlpha(p.ink, 0.6), border: `${3 * u}px solid ${active > 0.5 ? p.accent : withAlpha(p.ink, 0.3)}`, transform: `scale(${1 + 0.08 * Math.max(0, 1 - Math.abs(active - 0.5) * 6)})`}}>{label}</div>
  );
  const chipIn = easeOut3(sseg(f, 0, 18));

  // pronunciation sweep
  const pronIn = easeOut3(sseg(t, MORPH + 34, MORPH + 52));
  const sweep = easeIO(sseg(t, MORPH + 50, MORPH + 50 + Math.max(16, pair.pron.length * 2.6)));
  const pronFs = (portrait ? 64 : 60) * u;
  const speakPulse = 1 + 0.16 * Math.sin(Math.max(0, t - (MORPH + 50)) * 0.5) * (sweep > 0 && sweep < 1 ? 1 : 0);

  const lineStyle: React.CSSProperties = {position: 'absolute', left: 0, right: 0, top: cy - fs * 0.6, height: fs * 1.2, display: 'flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'pre', fontFamily: font, fontWeight: 700, fontSize: fs, lineHeight: 1.2, letterSpacing: -2 * u};

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined, overflow: 'hidden'}}>
      {/* language chips */}
      <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.2 : 0.17), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 * u, opacity: chipIn, transform: `translateY(${(1 - chipIn) * -20 * u}px)`}}>
        {chip(p.fromLang, 1 - switched)}
        <svg width={84 * u} height={36 * u} viewBox="0 0 84 36">
          <path d="M4 18 H70 M56 6 L70 18 L56 30" fill="none" stroke={p.accent2} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 8" strokeDashoffset={-f * 0.7} />
        </svg>
        {chip(p.toLang, switched)}
      </div>

      <div style={{position: 'absolute', inset: 0, opacity: groupOp, transform: `translateY(${groupDy}px)`}}>
        {/* source word */}
        <div style={{...lineStyle, color: p.ink}}>
          {fromChars.map((ch, i) => {
            const qIn = easeOut3(sseg(t, i * 1.6, i * 1.6 + 16));
            const qOut = easeIO(sseg(tm, i * 2, i * 2 + 14));
            const dy = (1 - qIn) * fs * 0.8 - qOut * fs * 0.9;
            const op = Math.min(qIn * 1.3, 1) * (1 - Math.min(1, qOut * 1.25));
            return (
              <span key={i} style={{display: 'inline-block', transform: `translateY(${dy}px)`, opacity: op, filter: qOut > 0 ? `blur(${qOut * 6 * u}px)` : undefined}}>{ch}</span>
            );
          })}
        </div>
        {/* target word */}
        <div style={{...lineStyle, color: p.accent}}>
          {toChars.map((ch, j) => {
            const q = easeOut3(sseg(tm, 8 + j * 2, 8 + j * 2 + 16));
            if (q <= 0) return <span key={j} style={{display: 'inline-block', opacity: 0}}>{ch}</span>;
            return (
              <span key={j} style={{display: 'inline-block', transform: `translateY(${(1 - q) * fs * 0.9}px) scale(${0.9 + 0.1 * q})`, opacity: Math.min(1, q * 1.3), filter: q < 1 ? `blur(${(1 - q) * 6 * u}px)` : undefined}}>{ch}</span>
            );
          })}
        </div>
        {/* underline */}
        <div style={{position: 'absolute', left: cx - (textEm(pair.to) * fs * 0.46), width: textEm(pair.to) * fs * 0.92, top: cy + fs * 0.74, height: 7 * u, borderRadius: 7 * u, background: withAlpha(p.accent2, 0.9), transform: `scaleX(${easeOut3(sseg(tm, 14, 40))})`}} />
        {/* pronunciation */}
        {pair.pron ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: cy + fs * 0.74 + 36 * u, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22 * u, opacity: pronIn, transform: `translateY(${(1 - pronIn) * 24 * u}px)`}}>
            <div style={{width: pronFs * 1.15, height: pronFs * 1.15, borderRadius: '50%', background: withAlpha(p.accent2, 0.2), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${speakPulse})`}}>
              <svg width={pronFs * 0.72} height={pronFs * 0.72} viewBox="0 0 24 24"><Icon name="speaker" x={12} y={12} size={22} color={p.accent2} sw={2.3} /></svg>
            </div>
            <div style={{position: 'relative', fontFamily: fonts.mono, fontWeight: 700, fontSize: pronFs, letterSpacing: 2 * u, whiteSpace: 'pre'}}>
              <span style={{color: withAlpha(p.ink, 0.4)}}>{pair.pron}</span>
              <span style={{position: 'absolute', left: 0, top: 0, color: p.accent2, clipPath: `inset(0 ${(1 - sweep) * 100}% 0 0)`}}>{pair.pron}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* progress dots */}
      {n > 1 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: h * 0.09, display: 'flex', justifyContent: 'center', gap: 16 * u, opacity: chipIn}}>
          {pairs.map((_, i) => (
            <div key={i} style={{width: (i === idx ? 34 : 14) * u, height: 14 * u, borderRadius: 14 * u, background: i === idx ? p.accent : withAlpha(p.ink, 0.25)}} />
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const wordTranslationPair = defineMotion<Props>({
  id: 'word-translation-pair',
  title: 'Word translation pair',
  category: 'text',
  description: 'A language lesson: a word in the first language rolls away letter by letter while its translation rolls in, the language chips swap highlight, and a pronunciation line with a speaker icon sweeps in. Cycles through any number of word pairs.',
  source: ['original (round 3)'],
  useFor: 'Language-learning reels, vocabulary-of-the-day posts, travel phrase videos, bilingual kids\' content and app promos — pass your own pairs (word, translation, pronunciation) and the two language names.',
  durationInFrames: 380,
  defaultProps: {
    pairs: DEFAULT_PAIRS,
    fromLang: 'English',
    toLang: 'Español',
    background: '#16213E',
    ink: '#F4F1E8',
    accent: '#FF8A5B',
    accent2: '#5BD1D7',
    fontFamily: '',
    pairFrames: 120,
    startAt: 0,
    speed: 1,
  },
  propDocs: {
    pairs: 'array of {from, to, pron}: source word, translation, pronunciation respelling (empty pron hides the line)',
    fromLang: 'name of the source language (left chip)',
    toLang: 'name of the target language (right chip)',
    background: "backdrop colour or 'transparent'",
    ink: 'source word and chip text colour',
    accent: 'translated word and active chip colour',
    accent2: 'underline, arrow and pronunciation sweep colour',
    fontFamily: 'optional CSS font-family for the words (empty = grotesk); set one that supports your script',
    pairFrames: 'frames each word pair stays on screen',
    startAt: 'frame the lesson starts',
    speed: 'playback speed multiplier',
  },
  component: WordTranslationPair,
  tags: ['translation', 'language', 'vocabulary', 'word', 'pronunciation', 'bilingual', 'learning', 'phrase', 'spanish', 'esl', 'education', 'morph', 'kinetic', 'lesson', 'travel'],
});
