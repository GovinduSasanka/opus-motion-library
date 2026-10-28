import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, eio, eo3, eo5, ei3, mix, seg, withAlpha} from '../../core/r3-brand-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Chapter countdown: a ring with tick marks counts 3-2-1 (each number pops in, the ring sweeps round once per count, the
 * ticks light up), then the ring snaps shut into a line that opens out sideways while the chapter label, title and subtitle
 * rise from behind it.
 */
type Props = {
  from: number;
  preLabel: string;
  chapterLabel: string;
  title: string;
  subtitle: string;
  framesPerCount: number;
  background: string;
  ink: string;
  accent: string;
  startAt: number;
  fontFamily: string;
};

const ChapterCountdown: React.FC<Props> = ({from, preLabel, chapterLabel, title, subtitle, framesPerCount, background, ink, accent, startAt, fontFamily}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const f = Math.max(0, frame - startAt);
  const n = Math.max(1, Math.min(9, Math.round(from)));
  const fpc = Math.max(12, framesPerCount);
  const lead = 8;
  const cEnd = lead + n * fpc;
  const S = Math.min(w, h);
  const R = S * (portrait ? 0.27 : 0.24);
  const fam = fontFamily || fonts.display;
  const bg = background === 'transparent' ? undefined : background;

  const idx = Math.min(n - 1, Math.max(0, Math.floor((f - lead) / fpc)));
  const val = n - idx;
  const lf = f - lead - idx * fpc; // frame within this count
  const counting = f >= lead && f < cEnd;
  const numIn = backOut(seg(lf, 0, 10), 2.6);
  const numOut = ei3(seg(lf, fpc - 6, fpc));
  const sweep = counting ? seg(lf, 0, fpc - 2) : 0;
  const ringIn = eo5(seg(f, 0, 14));
  const close = eio(seg(f, cEnd, cEnd + 10)); // ring shrinks to a dot / line
  const open = eo5(seg(f, cEnd + 8, cEnd + 34));
  const label = eo3(seg(f, cEnd + 22, cEnd + 40));
  const titleT = eo5(seg(f, cEnd + 16, cEnd + 42));
  const subT = eo3(seg(f, cEnd + 38, cEnd + 56));
  const ticks = 60;
  const ringR = R * (1 - 0.0 * close);
  const circ = 2 * Math.PI * ringR;
  const totalProgress = counting ? (f - lead) / (n * fpc) : f >= cEnd ? 1 : 0;

  const lineW = w * (portrait ? 0.78 : 0.56) * open;
  const titleFs = Math.min((portrait ? 108 : 112) * u, (w * 0.86) / Math.max(4, [...title].length * 0.62));
  const titleBoxH = titleFs * 1.2;
  const rise = (t: number) => (1 - t) * titleBoxH;

  return (
    <AbsoluteFill style={{background: bg, fontFamily: fam}}>
      <Svg>
        <g opacity={ringIn * (1 - close)} transform={`translate(${cx} ${cy}) scale(${mix(0.8, 1, ringIn) * (1 - close * 0.4)})`}>
          <circle r={ringR} fill="none" stroke={withAlpha(ink, 0.14)} strokeWidth={6 * u} />
          {Array.from({length: ticks}).map((_, i) => {
            const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
            const lit = i / ticks < totalProgress;
            const major = i % 5 === 0;
            const r0 = ringR + 22 * u;
            const r1 = r0 + (major ? 24 : 12) * u;
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={lit ? accent : withAlpha(ink, major ? 0.35 : 0.18)} strokeWidth={(major ? 4 : 2.4) * u} strokeLinecap="round" />;
          })}
          <circle r={ringR} fill="none" stroke={accent} strokeWidth={9 * u} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - sweep)} transform="rotate(-90)" />
          {/* leading dot */}
          {sweep > 0 && <circle cx={Math.cos(sweep * Math.PI * 2 - Math.PI / 2) * ringR} cy={Math.sin(sweep * Math.PI * 2 - Math.PI / 2) * ringR} r={11 * u} fill={accent} />}
        </g>
        {/* the line the ring closes into, opening sideways */}
        {f >= cEnd && <line x1={cx - lineW / 2} x2={cx + lineW / 2} y1={cy} y2={cy} stroke={accent} strokeWidth={5 * u} strokeLinecap="round" />}
        {f >= cEnd && f < cEnd + 14 && <circle cx={cx} cy={cy} r={mix(R * 0.6, 8 * u, close)} fill="none" stroke={accent} strokeWidth={6 * u} opacity={1 - open} />}
      </Svg>
      {/* number */}
      {counting && (
        <div style={{position: 'absolute', left: cx - R, top: cy - R, width: R * 2, height: R * 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ink, fontSize: R * 1.15, lineHeight: 1, opacity: Math.min(1, numIn) * (1 - numOut), transform: `scale(${mix(0.6, 1, numIn) * (1 + numOut * 0.35)})`, filter: numOut > 0 ? `blur(${numOut * 8 * u}px)` : undefined}}>
          {val}
        </div>
      )}
      {preLabel && counting && (
        <div style={{position: 'absolute', left: 0, right: 0, top: cy + R + 70 * u, textAlign: 'center', fontFamily: fonts.sans, fontWeight: 700, fontSize: 26 * u, letterSpacing: '0.34em', paddingLeft: '0.34em', textTransform: 'uppercase', color: withAlpha(ink, 0.6), opacity: ringIn}}>{preLabel}</div>
      )}
      {/* chapter label + title + subtitle around the line */}
      {f >= cEnd + 8 && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: cy - 36 * u - titleBoxH - 30 * u, height: titleBoxH + 30 * u, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center'}}>
            <div style={{transform: `translateY(${rise(titleT) * 0.0}px)`, opacity: label, color: accent, fontFamily: fonts.sans, fontWeight: 800, fontSize: (portrait ? 34 : 30) * u, letterSpacing: '0.3em', paddingLeft: '0.3em', textTransform: 'uppercase', marginBottom: 14 * u}}>{chapterLabel}</div>
          </div>
          <div style={{position: 'absolute', left: w * 0.05, right: w * 0.05, top: cy + 22 * u, height: titleBoxH, overflow: 'hidden', textAlign: 'center'}}>
            <div style={{transform: `translateY(${rise(titleT)}px)`, color: ink, fontSize: titleFs, lineHeight: 1.2, whiteSpace: 'nowrap', letterSpacing: '0.01em'}}>{title}</div>
          </div>
          {subtitle && (
            <div style={{position: 'absolute', left: w * 0.08, right: w * 0.08, top: cy + 22 * u + titleBoxH + 18 * u, textAlign: 'center', color: withAlpha(ink, 0.66), fontFamily: fonts.sans, fontWeight: 500, fontSize: (portrait ? 36 : 30) * u, opacity: subT, transform: `translateY(${(1 - subT) * 14 * u}px)`}}>
              {subtitle}
            </div>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

export const chapterCountdown = defineMotion<Props>({
  id: 'chapter-countdown',
  title: 'Chapter countdown (3-2-1 ring)',
  category: 'text',
  description:
    'A tick-marked ring counts 3-2-1: each number pops in and the ring sweeps once per count while the ticks light up; the ring then snaps shut into a line that opens sideways, with the chapter label, title and subtitle rising out from behind it.',
  source: ['original (branding pass, round 3)'],
  useFor: 'Chapter / section intros in tutorials, courses and long videos; "starting in 3-2-1" openers before a segment, with the chapter title.',
  durationInFrames: 190,
  defaultProps: {
    from: 3,
    preLabel: 'starting in',
    chapterLabel: 'Chapter 02',
    title: 'Getting Started',
    subtitle: 'Set up your workspace in five minutes',
    framesPerCount: 28,
    background: '#0E1320',
    ink: '#F4F1EA',
    accent: '#4DD6C1',
    startAt: 0,
    fontFamily: '',
  },
  propDocs: {
    from: 'number to count down from (1-9)',
    preLabel: 'small line under the ring while counting ("" = none)',
    chapterLabel: 'small tracked label above the title (e.g. "Chapter 02", "Part 3")',
    title: 'chapter title',
    subtitle: 'line under the title ("" = none)',
    framesPerCount: 'frames per number (30 = one second)',
    background: 'backdrop colour, or "transparent" to sit over footage',
    ink: 'number and title colour',
    accent: 'ring, ticks, label and line colour',
    startAt: 'frame the countdown starts',
    fontFamily: 'optional CSS font-family for the number and title',
  },
  component: ChapterCountdown,
  tags: ['countdown', 'chapter', 'chapter title', '3 2 1', 'ring', 'timer', 'section', 'intro', 'tutorial', 'course', 'segment', 'starting soon', 'title', 'ticks'],
});
