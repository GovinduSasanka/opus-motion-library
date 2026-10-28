import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Icon, fitText, inkOn} from '../../core/r3-explain';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Dictionary-style definition card: the word lands big, phonetic spelling and a part-of-speech pill slide in
 * beside it, a rule draws, then the definition types on with a caret and an italic example fades in under it.
 */
type Props = {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  background: string;
  ink: string;
  accent: string;
  card: string;
  fontFamily: string;
  startAt: number;
  speed: number;
  typeSpeed: number;
};

const DefinitionCard: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.serif;
  const cw = portrait ? w * 0.9 : Math.min(w * 0.78, 1380 * u);
  const pad = (portrait ? 56 : 72) * u;
  const innerW = cw - pad * 2;
  const wordFs = Math.min((portrait ? 150 : 170) * u, (innerW / Math.max(1, p.word.length * 0.55)));
  const defBoxH = portrait ? h * 0.2 : h * 0.2;
  const defFit = fitText(p.definition, innerW, defBoxH, (portrait ? 50 : 46) * u, 24 * u, 0.5, 1.32);
  const exFit = fitText(p.example ? `“${p.example}”` : '', innerW, h * 0.1, 34 * u, 20 * u, 0.5, 1.3);
  const cardH = pad * 2 + wordFs * 1.05 + 70 * u + 40 * u + defFit.lines.length * defFit.fs * defFit.lh + (p.example ? exFit.lines.length * exFit.fs * exFit.lh + 36 * u : 0) - 24 * u;
  const cardIn = easeOut3(sseg(f, 0, 22));
  const wordIn = easeOut3(sseg(f, 10, 34));
  const metaIn = easeOut3(sseg(f, 30, 52));
  const rule = easeOut3(sseg(f, 48, 72));
  const typeStart = 62;
  const cps = Math.max(0.3, p.typeSpeed || 1) * 1.1; // chars per frame
  const chars = Math.floor(Math.max(0, f - typeStart) * cps);
  const typed = p.definition.slice(0, chars);
  const rest = p.definition.slice(chars);
  const typeEnd = typeStart + p.definition.length / cps;
  const exIn = easeOut3(sseg(f, typeEnd + 8, typeEnd + 30));
  const caret = f < typeEnd + 20 && Math.floor(f / 8) % 2 === 0;
  const speakPulse = f > 12 && f < 46 ? 1 + 0.18 * Math.sin((f - 12) * 0.5) : 1;
  const showBg = p.background !== 'transparent';
  const cardBg = p.card;
  const ink = p.ink;
  // keep rest + typed lines wrapped exactly as the fitted layout
  const defFs = defFit.fs;

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: cw, height: cardH, borderRadius: 30 * u, background: cardBg, boxShadow: `0 ${28 * u}px ${80 * u}px rgba(0,0,0,0.3)`, position: 'relative', padding: pad, boxSizing: 'border-box', opacity: cardIn, transform: `translateY(${(1 - cardIn) * 50 * u}px) scale(${0.96 + 0.04 * cardIn})`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 14 * u, background: p.accent}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 28 * u, flexWrap: 'wrap', opacity: wordIn, transform: `translateY(${(1 - wordIn) * 30 * u}px)`}}>
          <div style={{fontFamily: font, fontWeight: 700, fontSize: wordFs, lineHeight: 1.05, color: ink, letterSpacing: -2 * u}}>{p.word}</div>
          <div style={{width: wordFs * 0.42, height: wordFs * 0.42, borderRadius: '50%', background: withAlpha(p.accent, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${speakPulse})`}}>
            <svg width={wordFs * 0.26} height={wordFs * 0.26} viewBox="0 0 24 24">
              <Icon name="speaker" x={12} y={12} size={22} color={p.accent} sw={2.2} />
            </svg>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 22 * u, marginTop: 12 * u, opacity: metaIn, transform: `translateX(${(1 - metaIn) * -30 * u}px)`}}>
          <div style={{fontFamily: fonts.mono, fontSize: 34 * u, color: withAlpha(ink, 0.62)}}>{p.phonetic}</div>
          <div style={{padding: `${6 * u}px ${22 * u}px`, borderRadius: 999, background: p.accent, color: inkOn(p.accent), fontFamily: fonts.sans, fontWeight: 800, fontSize: 24 * u, letterSpacing: 2 * u, textTransform: 'uppercase'}}>{p.partOfSpeech}</div>
        </div>
        <div style={{height: 4 * u, width: `${rule * 100}%`, background: mixHex(p.accent, cardBg, 0.35), margin: `${26 * u}px 0 ${24 * u}px`, borderRadius: 4 * u}} />
        <div style={{fontFamily: fonts.sans, fontWeight: 500, fontSize: defFs, lineHeight: defFit.lh, color: ink, whiteSpace: 'pre-wrap'}}>
          <span>{typed}</span>
          <span style={{display: 'inline-block', width: 4 * u, height: defFs * 0.95, background: p.accent, verticalAlign: 'text-bottom', marginLeft: 3 * u, opacity: caret ? 1 : 0}} />
          <span style={{opacity: 0}}>{rest}</span>
        </div>
        {p.example ? (
          <div style={{marginTop: 26 * u, fontFamily: font, fontStyle: 'italic', fontSize: exFit.fs, lineHeight: exFit.lh, color: withAlpha(ink, 0.66), opacity: exIn, transform: `translateY(${(1 - exIn) * 16 * u}px)`}}>
            {exFit.lines.join(' ')}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const definitionCard = defineMotion<Props>({
  id: 'definition-card',
  title: 'Definition card',
  category: 'text',
  description: 'A dictionary entry card: big headword with a speaker icon, phonetic spelling and part-of-speech pill, a rule that draws, the definition typing on with a caret, then an italic example sentence.',
  source: ['original (round 3)'],
  useFor: 'Vocabulary and "what does X mean" explainers, glossary beats, language lessons, jargon-busting intros — pass the word, phonetic, part of speech, definition and example.',
  durationInFrames: 240,
  defaultProps: {
    word: 'Inflation',
    phonetic: '/ɪnˈfleɪ.ʃən/',
    partOfSpeech: 'noun',
    definition: 'A general rise in prices over time, which means each unit of money buys a little less than it did before.',
    example: 'With inflation at 3%, a $100 basket of groceries costs $103 next year.',
    background: '#E9E1D0',
    ink: '#1D1B18',
    accent: '#C8452D',
    card: '#FFFDF7',
    fontFamily: '',
    startAt: 0,
    speed: 1,
    typeSpeed: 1,
  },
  propDocs: {
    word: 'the headword',
    phonetic: 'phonetic spelling, e.g. /ˈwɜːd/',
    partOfSpeech: 'noun / verb / adjective ... shown as a pill',
    definition: 'the definition text (types on)',
    example: 'optional example sentence (empty string hides it)',
    background: "backdrop colour or 'transparent'",
    ink: 'text colour',
    accent: 'pill, rule, caret and left-edge colour',
    card: 'card colour',
    fontFamily: 'optional CSS font-family for the word and example (empty = serif)',
    startAt: 'frame the card starts entering',
    speed: 'playback speed multiplier',
    typeSpeed: 'typing speed multiplier for the definition',
  },
  component: DefinitionCard,
  tags: ['definition', 'dictionary', 'glossary', 'vocabulary', 'word', 'meaning', 'typewriter', 'card', 'education', 'explainer', 'lesson'],
});
