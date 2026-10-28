import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeIO, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Icon, inkOn} from '../../core/r3-explain';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A paragraph of reading text fades in; the key phrases (`highlights`) are swiped with a marker one after
 * another, then a KEY TAKEAWAY box rises in with a one-line summary and a lightbulb.
 */
type Props = {
  text: string;
  highlights: string[];
  takeaway: string;
  takeawayLabel: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  card: string;
  fontFamily: string;
  startAt: number;
  speed: number;
  stagger: number;
};

type Seg = {s: string; hi: number};

/** split `text` into plain / highlighted segments (first occurrence of each phrase, case-insensitive) */
const segment = (text: string, hs: string[]): Seg[] => {
  const hits: {a: number; b: number; i: number}[] = [];
  hs.forEach((h, i) => {
    if (!h) return;
    const a = text.toLowerCase().indexOf(h.toLowerCase());
    if (a >= 0) hits.push({a, b: a + h.length, i});
  });
  hits.sort((x, y) => x.a - y.a);
  const segs: Seg[] = [];
  let pos = 0;
  let rank = 0;
  for (const h of hits) {
    if (h.a < pos) continue;
    if (h.a > pos) segs.push({s: text.slice(pos, h.a), hi: -1});
    segs.push({s: text.slice(h.a, h.b), hi: rank++});
    pos = h.b;
  }
  if (pos < text.length) segs.push({s: text.slice(pos), hi: -1});
  return segs;
};

const KeyTakeawayHighlight: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt) * (p.speed || 1);
  const font = p.fontFamily || fonts.serif;
  const segs = segment(p.text, p.highlights || []);
  const nHi = segs.filter((s) => s.hi >= 0).length;
  const mx = w * 0.07;
  const colW = portrait ? w - mx * 2 : (w - mx * 2) * 0.6;
  const boxW = portrait ? w - mx * 2 : (w - mx * 2) * 0.34;
  const chars = p.text.length;
  const fs = Math.max(26 * u, Math.min((portrait ? 56 : 60) * u, Math.sqrt((colW * (portrait ? h * 0.42 : h * 0.62)) / (chars * 0.5 * 1.55))));
  const intro = easeOut3(sseg(f, 0, 26));
  const hiStart = 46;
  const step = Math.max(8, p.stagger || 26);
  const hiEnd = hiStart + nHi * step;
  const boxAt = hiEnd + 6;
  const boxIn = easeOut3(sseg(f, boxAt, boxAt + 24));
  const bulb = backOut(sseg(f, boxAt + 12, boxAt + 32), 2.4);
  const showBg = p.background !== 'transparent';

  const para = (
    <div style={{width: colW, fontFamily: font, fontWeight: 500, fontSize: fs, lineHeight: 1.55, color: p.ink, opacity: intro, transform: `translateY(${(1 - intro) * 28 * u}px)`}}>
      {segs.map((s, i) => {
        if (s.hi < 0) return <span key={i}>{s.s}</span>;
        const t0 = hiStart + s.hi * step;
        const k = easeIO(sseg(f, t0, t0 + step * 0.8));
        const col = s.hi % 2 === 0 ? p.accent : p.accent2;
        return (
          <span
            key={i}
            style={{
              fontWeight: 700,
              backgroundImage: `linear-gradient(${withAlpha(col, 0.62)}, ${withAlpha(col, 0.62)})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${k * 100}% 86%`,
              backgroundPosition: '0 78%',
              padding: `0 ${6 * u}px`,
              margin: `0 ${-6 * u}px`,
              WebkitBoxDecorationBreak: 'clone',
              boxDecorationBreak: 'clone',
              borderRadius: 6 * u,
            }}
          >
            {s.s}
          </span>
        );
      })}
    </div>
  );

  const box = (
    <div style={{width: boxW, boxSizing: 'border-box', padding: `${34 * u}px ${38 * u}px`, borderRadius: 26 * u, background: p.card, border: `${5 * u}px solid ${p.accent}`, boxShadow: `0 ${20 * u}px ${60 * u}px rgba(0,0,0,0.22)`, opacity: boxIn, transform: `translateY(${(1 - boxIn) * 90 * u}px) rotate(${(1 - boxIn) * 2}deg)`, position: 'relative'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16 * u, marginBottom: 18 * u}}>
        <div style={{width: 58 * u, height: 58 * u, borderRadius: '50%', background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${Math.max(0.001, bulb)})`}}>
          <svg width={34 * u} height={34 * u} viewBox="0 0 24 24">
            <Icon name="bulb" x={12} y={12} size={22} color={inkOn(p.accent)} sw={2} />
          </svg>
        </div>
        <div style={{fontFamily: fonts.display, fontSize: 28 * u, letterSpacing: 4 * u, color: mixHex(p.accent, p.ink, 0.62)}}>{p.takeawayLabel}</div>
      </div>
      <div style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: Math.min(portrait ? 46 * u : 40 * u, (boxW * 1.2) / Math.max(10, p.takeaway.length * 0.52 / 1.4)), lineHeight: 1.28, color: p.ink}}>{p.takeaway}</div>
    </div>
  );

  return (
    <AbsoluteFill style={{background: showBg ? p.background : undefined}}>
      <AbsoluteFill style={{display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: (portrait ? 70 : 90) * u, padding: `0 ${mx}px`}}>
        {para}
        {box}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const keyTakeawayHighlight = defineMotion<Props>({
  id: 'key-takeaway-highlight',
  title: 'Key takeaway highlight',
  category: 'text',
  description: 'A reading paragraph whose key phrases are swiped with a marker one by one, followed by a KEY TAKEAWAY box with a lightbulb and a one-line summary.',
  source: ['original (round 3)'],
  useFor: 'Lesson recaps, article / study summaries, "what to remember" endings, explainer chapters — pass your paragraph, the phrases to highlight and the takeaway line.',
  durationInFrames: 270,
  defaultProps: {
    text: 'Compound interest means you earn interest on your interest. Even a small amount invested early can grow far larger than a bigger amount invested late, because time does most of the work. The first years feel slow, then growth speeds up.',
    highlights: ['interest on your interest', 'invested early', 'time does most of the work'],
    takeaway: 'Start early: time matters more than the amount.',
    takeawayLabel: 'KEY TAKEAWAY',
    background: '#F4EFE3',
    ink: '#1F1D1A',
    accent: '#FFC21A',
    accent2: '#7FD6C2',
    card: '#FFFFFF',
    fontFamily: '',
    startAt: 0,
    speed: 1,
    stagger: 26,
  },
  propDocs: {
    text: 'the paragraph shown on screen',
    highlights: 'phrases inside `text` to marker-highlight, in the order they are swiped (matched case-insensitively)',
    takeaway: 'summary sentence in the takeaway box',
    takeawayLabel: 'label above the takeaway',
    background: "backdrop colour or 'transparent'",
    ink: 'text colour',
    accent: 'marker colour (odd highlights), takeaway border and lightbulb',
    accent2: 'marker colour for every second highlight',
    card: 'takeaway box fill',
    fontFamily: 'optional CSS font-family for the paragraph (empty = serif)',
    startAt: 'frame the paragraph starts fading in',
    speed: 'playback speed multiplier',
    stagger: 'frames between marker swipes',
  },
  component: KeyTakeawayHighlight,
  tags: ['highlight', 'marker', 'takeaway', 'summary', 'key', 'paragraph', 'recap', 'lesson', 'education', 'explainer', 'text', 'reading'],
});
