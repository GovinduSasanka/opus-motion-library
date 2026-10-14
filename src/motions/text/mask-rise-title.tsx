import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, BlockCursor, CropMarks, cursorOn, eic, eioc, eoc, estWidth, tfonts, typed} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Lines that rise out of their own masks (video17 masked-title-swap + masked-line-reveal, video3
 * staggered-title-fade). Chapter variant: red italic numeral rolls like an odometer, the extended
 * black title rises letter by letter (1 f stagger, ease-out cubic, motion blur), then a mono subtitle
 * types with a red block cursor; the previous chapter exits upward first. Stack variant: end-card lines
 * ("12 PRINCIPLES. / 0 CUTS. / 1 BALL.") rise 0.4 s apart with a typed side column, and leave with a
 * skewed slide-down.
 */

type Chapter = {number: string; title: string; kicker?: string; subtitle?: string};
type StackLine = {numeral?: string; word: string};
type Props = {
  variant: 'chapter' | 'stack';
  chapter: Chapter;
  fromChapter: Chapter | null;
  swapAt: number;
  lines: StackLine[];
  sideCopy: string[];
  sideMono: string[];
  startFrame: number;
  letterFrames: number;
  letterStagger: number;
  lineStagger: number;
  typeSpeed: number;
  background: string;
  ink: string;
  accent: string;
  muted: string;
  progressRule: boolean;
  cropMarks: boolean;
  exit: boolean;
  backdrop: BackdropKind;
  src: string;
};

/** per-letter rise from a baseline mask */
const RiseWord: React.FC<{text: string; start: number; per: number; dur: number; font: string; size: number; color: string; italic?: boolean; exitP?: number; tracking?: number}> = ({text, start, per, dur, font, size, color, italic, exitP = 0, tracking = 0}) => {
  const frame = useCurrentFrame();
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', lineHeight: 1.06, padding: `0 ${size * 0.08}px ${size * 0.06}px`, margin: `0 ${-size * 0.08}px`, verticalAlign: 'bottom'}}>
      <span style={{display: 'inline-block', transform: `translateY(${-exitP * 110}%)`, filter: exitP > 0 && exitP < 1 ? `blur(${Math.sin(exitP * Math.PI) * size * 0.05}px)` : undefined}}>
        {[...text].map((c, i) => {
          const t = clamp((frame - start - i * per) / dur);
          const e = eoc(t);
          const vel = t > 0 && t < 1 ? 3 * Math.pow(1 - t, 2) : 0;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                fontFamily: font,
                fontStyle: italic ? 'italic' : 'normal',
                fontSize: size,
                color,
                letterSpacing: `${tracking}em`,
                transform: `translateY(${(1 - e) * 110}%)`,
                filter: vel > 0.05 ? `blur(${vel * size * 0.02}px)` : undefined,
              }}
            >
              {c}
            </span>
          );
        })}
      </span>
    </span>
  );
};

/** odometer numeral: each changed digit rolls up (easeInOutCubic) with motion blur */
const RollNumeral: React.FC<{from: string; to: string; at: number; dur: number; size: number; color: string}> = ({from, to, at, dur, size, color}) => {
  const frame = useCurrentFrame();
  const n = Math.max(from.length, to.length);
  const a = from.padStart(n, ' ');
  const b = to.padStart(n, ' ');
  return (
    <span style={{display: 'inline-flex', overflow: 'hidden', lineHeight: 1, padding: `${size * 0.04}px ${size * 0.12}px ${size * 0.1}px`, margin: `0 ${-size * 0.12}px`}}>
      {[...b].map((ch, i) => {
        const same = a[i] === ch;
        const t = eioc((frame - at - i * 1.5) / dur);
        const blur = same ? 0 : Math.sin(t * Math.PI) * size * 0.06;
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', fontFamily: tfonts.instrument, fontStyle: 'italic', fontSize: size, color, whiteSpace: 'pre'}}>
            <span style={{visibility: 'hidden'}}>{ch === ' ' ? a[i] : ch}</span>
            {!same && (
              <span style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${-t * 105}%)`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined}}>{a[i]}</span>
            )}
            <span style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${same ? 0 : (1 - t) * 105}%)`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined}}>{ch}</span>
          </span>
        );
      })}
    </span>
  );
};

const ChapterCard: React.FC<{c: Chapter; p: Props; inStart: number; outStart: number | null; compressAt: number | null; s: number}> = ({c, p, inStart, outStart, compressAt, s}) => {
  const frame = useCurrentFrame();
  const {u} = useStage();
  const titleSize = 66 * u * s;
  const per = p.letterStagger;
  const landed = inStart + per * c.title.length + p.letterFrames;
  const typeStart = landed + 3;
  const sub = c.subtitle ?? '';
  const n = Math.min(sub.length, typed(frame, typeStart, p.typeSpeed));
  const typing = n < sub.length && frame >= typeStart;
  const outP = outStart === null ? 0 : eic((frame - outStart) / 4);
  const comp = compressAt === null ? 0 : eic((frame - compressAt) / 6);
  if (outP >= 1) return null;
  return (
    <div style={{transformOrigin: 'top left', transform: `scaleY(${1 - comp}) translateY(${-comp * 30 * u}px)`, opacity: 1 - comp * 0.6}}>
      <div style={{height: titleSize * 1.06, display: 'flex', alignItems: 'flex-end'}}>
        <RiseWord text={c.title} start={inStart} per={per} dur={p.letterFrames} font={fonts.display} size={titleSize} color={p.ink} exitP={outP} tracking={0.01} />
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 16 * u * s, marginTop: 6 * u * s, opacity: 1 - outP}}>
        {c.kicker ? <RiseWord text={c.kicker} start={inStart + 2} per={0} dur={p.letterFrames} font={fonts.sans} size={30 * u * s} color={p.ink} /> : null}
        <span style={{fontFamily: fonts.mono, fontSize: 22 * u * s, color: p.muted, whiteSpace: 'pre', letterSpacing: '0.02em'}}>
          {sub.slice(0, n)}
          {frame >= typeStart && <BlockCursor visible={cursorOn(frame, typing, 2)} color={p.accent} w={10 * u * s} h={18 * u * s} />}
        </span>
      </div>
    </div>
  );
};

const MaskRiseTitle: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const margin = (portrait ? 64 : 88) * u;
  const exitAt = p.exit ? D - 12 : null;

  if (p.variant === 'stack') {
    const lines = p.lines;
    const side = p.sideCopy.length + p.sideMono.length > 0;
    const availW = portrait ? w - margin * 2 : w * 0.9 - margin;
    const est = Math.max(...lines.map((l) => estWidth(l.word, 1, 'display', 0.01) + (l.numeral ? estWidth(l.numeral, 1.35, 'instrument') + 0.15 : 0)));
    const fs = Math.min(200 * u, availW / est);
    const sideStart = p.startFrame + lines.length * p.lineStagger + 6;
    return (
      <AbsoluteFill>
        <Backdrop kind={p.backdrop} color={p.background} src={p.src || undefined} />
        {p.cropMarks && <CropMarks color={p.muted} />}
        <div style={{position: 'absolute', left: margin, right: margin, top: 0, bottom: 0, display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: portrait ? 'flex-start' : 'center', justifyContent: portrait ? 'center' : 'space-between', gap: portrait ? 90 * u : 40 * u}}>
          <div>
            {lines.map((l, i) => {
              const st = p.startFrame + i * p.lineStagger;
              const ex = exitAt === null ? 0 : eic((frame - exitAt - (lines.length - 1 - i) * 2) / 7);
              const rise = eoc((frame - st) / (p.letterFrames + 3));
              const vel = rise > 0 && rise < 1 ? 1 - rise : 0;
              return (
                <div key={i} style={{overflow: 'hidden', lineHeight: 0.98, paddingBottom: fs * 0.04}}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: fs * 0.12,
                      transform: `translateY(${(1 - rise) * 110 + ex * 40}%) skewY(${ex * 6}deg)`,
                      filter: vel + ex > 0.04 ? `blur(${(vel * 0.03 + ex * 0.04) * fs}px)` : undefined,
                      opacity: 1 - ex,
                    }}
                  >
                    {l.numeral ? <span style={{fontFamily: tfonts.instrument, fontStyle: 'italic', fontSize: fs * 1.35, color: p.ink, lineHeight: 0.85}}>{l.numeral}</span> : null}
                    <span style={{fontFamily: fonts.display, fontSize: fs, color: p.ink, whiteSpace: 'pre'}}>{l.word}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {side && (
            <div style={{...(portrait ? {} : {position: 'absolute', right: 0, top: h * 0.47}), width: portrait ? w - margin * 2 : w * 0.3, opacity: exitAt === null ? 1 : 1 - eic((frame - exitAt) / 8)}}>
              {p.sideCopy.map((t, i) => {
                const st = sideStart + i * 4;
                const pr = eoc((frame - st) / 10);
                return (
                  <div key={i} style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 34 * u, color: p.ink, lineHeight: 1.3, opacity: pr, transform: `translateY(${(1 - pr) * 12 * u}px)`}}>
                    {t}
                  </div>
                );
              })}
              <div style={{height: 2 * u, background: p.muted, opacity: 0.6, margin: `${40 * u}px 0 ${36 * u}px`, width: `${eoc((frame - sideStart - 10) / 9) * 100}%`}} />
              {p.sideMono.map((t, i) => {
                const st = sideStart + 18 + i * 16;
                const n = typed(frame, st, p.typeSpeed);
                return (
                  <div key={i} style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 24 * u, letterSpacing: '0.15em', color: i === p.sideMono.length - 1 ? p.accent : p.muted, lineHeight: 1.7, whiteSpace: 'pre'}}>
                    {t.slice(0, n)}
                    {frame >= st && n < t.length && <BlockCursor visible color={p.accent} w={12 * u} h={20 * u} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // ---- chapter variant
  const from = p.fromChapter;
  const swapAt = from ? p.swapAt : -1;
  const est = Math.max(estWidth(p.chapter.title, 66, 'display', 0.01), from ? estWidth(from.title, 66, 'display', 0.01) : 0) + 170;
  const s = Math.min(2.1, (w - margin * 2) / u / est);
  const numSize = 150 * u * s;
  const rollAt = from ? swapAt + 3 : p.startFrame - 2;
  const newIn = from ? swapAt + 5 : p.startFrame;
  const numFrom = from ? from.number : p.chapter.number.replace(/./g, '0');
  const numEnter = from ? eoc((frame - p.startFrame + 2) / p.letterFrames) : 1;
  const prog = frame / Math.max(1, D - 1);
  const blockTop = portrait ? h * 0.42 : h * 0.6;
  const compressAt = exitAt;
  return (
    <AbsoluteFill>
      <Backdrop kind={p.backdrop} color={p.background} src={p.src || undefined} />
      {p.cropMarks && <CropMarks color={p.muted} />}
      <div style={{position: 'absolute', left: margin, top: blockTop, display: 'flex', alignItems: 'flex-start', gap: 22 * u * s}}>
        <div style={{transform: `translateY(${(1 - numEnter) * 100}%)`, opacity: compressAt === null ? 1 : 1 - eic((frame - compressAt) / 6), marginTop: -numSize * 0.12}}>
          <RollNumeral from={numFrom} to={frame < rollAt ? numFrom : p.chapter.number} at={rollAt} dur={6} size={numSize} color={p.accent} />
        </div>
        <div style={{paddingTop: numSize * 0.1}}>
          {from && frame < swapAt + 5 && <ChapterCard c={from} p={p} inStart={p.startFrame} outStart={swapAt} compressAt={null} s={s} />}
          {(!from || frame >= swapAt + 5) && <ChapterCard c={p.chapter} p={p} inStart={newIn} outStart={null} compressAt={compressAt} s={s} />}
        </div>
      </div>
      {p.progressRule && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <line x1={margin * 0.5} x2={w - margin * 0.5} y1={h - 72 * u} y2={h - 72 * u} stroke={p.muted} strokeWidth={1 * u} opacity={0.5} />
          {Array.from({length: 15}, (_, i) => {
            const x = margin * 0.5 + ((w - margin) * i) / 14;
            return <line key={i} x1={x} x2={x} y1={h - 72 * u} y2={h - 66 * u} stroke={p.muted} strokeWidth={1 * u} opacity={0.5} />;
          })}
          <line x1={margin * 0.5} x2={margin * 0.5 + (w - margin) * prog} y1={h - 72 * u} y2={h - 72 * u} stroke={p.accent} strokeWidth={2.5 * u} />
          <line x1={margin * 0.5 + (w - margin) * prog} x2={margin * 0.5 + (w - margin) * prog} y1={h - 80 * u} y2={h - 64 * u} stroke={p.accent} strokeWidth={2 * u} />
          <text x={margin * 0.5} y={h - 38 * u} fontFamily={fonts.mono} fontSize={16 * u} fill={p.muted} letterSpacing={2 * u}>
            {`TC 00:00:${String(Math.floor(frame / 30)).padStart(2, '0')}:${String(frame % 30).padStart(2, '0')}`}
          </text>
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const maskRiseTitle = defineMotion<Props>({
  id: 'mask-rise-title',
  title: 'Mask-rise title',
  category: 'text',
  description: 'Editorial title whose letters rise out of baseline masks with motion blur; chapter variant rolls a red italic numeral and types a subtitle, stack variant builds an end-card headline.',
  source: ['video17 0:06.0-0:06.6', 'video17 0:38.7-0:42.8', 'video3 0:16.6-0:17.4'],
  useFor: 'Chapter titles, principle/step headers, end-card headlines and list reveals.',
  durationInFrames: 180,
  defaultProps: {
    variant: 'chapter',
    chapter: {number: '03', title: 'STAGING', subtitle: '— One idea. Unmistakably clear.'},
    fromChapter: {number: '02', title: 'ANTICIPATION', subtitle: '— Wind up before you go.'},
    swapAt: 78,
    lines: [
      {numeral: '12', word: 'PRINCIPLES.'},
      {numeral: '0', word: 'CUTS.'},
      {numeral: '1', word: 'BALL.'},
    ],
    sideCopy: ['Every frame and every sound', 'in this film is code.'],
    sideMono: ['8,951 LINES OF CODE · 37 FILES', '0 KEYFRAMES · MADE WITH CODE'],
    startFrame: 8,
    letterFrames: 7,
    letterStagger: 1,
    lineStagger: 12,
    typeSpeed: 30,
    background: '#EEEBDE',
    ink: '#0B0D0C',
    accent: '#ED3821',
    muted: '#888578',
    progressRule: true,
    cropMarks: true,
    exit: true,
    backdrop: 'cream',
    src: '',
  },
  propDocs: {
    variant: 'chapter (numeral + title + typed subtitle) | stack (end-card lines + side column)',
    chapter: '{number, title, kicker?, subtitle?} shown (after the swap if fromChapter is set)',
    fromChapter: 'previous chapter shown first and swapped out at swapAt (null = enter fresh, numeral rolls from 00)',
    swapAt: 'frame the previous title exits upward',
    lines: 'stack: [{numeral?, word}] headline lines',
    sideCopy: 'stack: body lines in the right column',
    sideMono: 'stack: mono lines typed under the rule (last one in accent colour)',
    letterFrames: 'frames each letter takes to rise',
    letterStagger: 'frames between letters (video17 ≈ 1)',
    lineStagger: 'stack: frames between lines (0.4 s = 12)',
    typeSpeed: 'subtitle typing, characters per second',
    accent: 'numeral / cursor / progress colour',
    progressRule: 'chapter: global progress rule + timecode at the bottom',
    exit: 'compress (chapter) or skew-slide (stack) out over the last 12 frames',
    backdrop: 'cream | ink | dunes | … (plain background colour for cream)',
  },
  component: MaskRiseTitle,
  tags: ['title', 'chapter', 'mask', 'reveal', 'editorial', 'endcard'],
});
