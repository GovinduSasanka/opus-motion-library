import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {ease, prog, springAt} from '../../core/ease';
import {defineMotion} from '../../core/types';
import {CapStyle, E2_CAPTION_LINES} from '../../core/r2-e2-kit';

export interface CaptionCue {
  text: string;
  from: number;
  to: number;
  /** words to highlight; wrap in *asterisks* inside text works too */
  highlight?: string[];
  /** per-word timing in absolute frames (from speech alignment); words light up as they are spoken */
  words?: {text: string; from: number; to: number}[];
  /** per-cue placement, chosen to avoid the scene's own text */
  position?: 'bottom' | 'center' | 'top';
  /** per-cue contrast: 'light' text for dark scenes, 'dark' text for bright scenes */
  tone?: 'light' | 'dark';
  /** second-language / translation line (slam variant) */
  sub?: string;
}

type Style = {
  position?: 'bottom' | 'center' | 'top';
  color?: string;
  highlightColor?: string;
  highlightText?: string;
  size?: number;
  font?: keyof typeof fonts;
  /** reveal words one at a time across the cue (video10) */
  wordByWord?: boolean;
  /** 'kinetic' = word pop with highlight boxes (video10); 'premium' = calm line, words brighten as spoken */
  variant?: 'kinetic' | 'premium' | 'slam' | 'toast' | 'frosted-bar' | 'terminal' | 'print' | 'karaoke' | 'rise';
  /** premium: accent colour for *starred* words */
  accent?: string;
} & Omit<CapStyle, 'position' | 'color' | 'highlightColor' | 'highlightText' | 'size' | 'font' | 'accent'>;

/**
 * Premium caption: the line fades up out of a slight blur, unspoken words wait at low opacity and
 * brighten exactly when they are spoken (word timings from speech alignment), on a soft local scrim
 * that keeps it legible on any scene without a hard box.
 */
const PremiumLine: React.FC<{cue: CaptionCue} & Style> = ({cue, position = 'bottom', size = 42, font = 'sans', accent = '#E9C27A'}) => {
  const frame = useCurrentFrame();
  const {u, h, w, portrait} = useStage();
  const pos = cue.position ?? position;
  const dark = (cue.tone ?? 'light') === 'dark';
  const ink = dark ? '#121418' : '#F5F2EC';
  const enter = prog(frame, cue.from, cue.from + 7, ease.out);
  const exit = prog(frame, cue.to - 6, cue.to, ease.in);
  const vis = enter * (1 - exit);
  const tokens = cue.text.split(/\s+/).filter(Boolean);
  // map each display token to a timed word (same order); fall back to an even spread
  const timed = tokens.map((t, i) => {
    const wd = cue.words?.[i];
    if (wd) return wd.from;
    return cue.from + ((cue.to - cue.from) * 0.85 * i) / Math.max(1, tokens.length);
  });
  const fs = size * u * (portrait ? 1.05 : 1);
  const band = pos === 'top' ? {top: h * 0.075} : pos === 'center' ? {top: h * 0.44} : {bottom: h * 0.075};
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        ...band,
        transform: `translate(-50%, ${(1 - enter) * 10 * u}px)`,
        width: portrait ? w * 0.86 : w * 0.62,
        textAlign: 'center',
        opacity: vis,
        filter: enter < 1 ? `blur(${(1 - enter) * 6 * u}px)` : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: `${-fs * 0.9}px ${-fs * 1.6}px`,
          background: dark
            ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0) 72%)'
            : 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.26) 45%, rgba(0,0,0,0) 72%)',
          filter: `blur(${fs * 0.35}px)`,
        }}
      />
      <div style={{position: 'relative', fontFamily: fonts[font], fontWeight: 600, fontSize: fs, lineHeight: 1.28, letterSpacing: '-0.005em', color: ink}}>
        {tokens.map((raw, i) => {
          const starred = /^\*.*\*[.,!?;:]*$/.test(raw);
          const word = raw.replace(/\*/g, '');
          const lit = prog(frame, timed[i] - 1, timed[i] + 4, ease.out);
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  opacity: 0.38 + 0.62 * lit,
                  color: starred ? accent : ink,
                  textShadow: dark ? 'none' : `0 ${1.5 * u}px ${6 * u}px rgba(0,0,0,0.55)`,
                }}
              >
                {word}
              </span>
              {i < tokens.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Word-pop captions with highlight boxes (video10 "People *bent* double").
 * Each word pops with a 0.18 s back-ease scale from 0.82; highlighted words sit on a solid box.
 */
const CaptionLine: React.FC<{cue: CaptionCue} & Style> = ({cue, position: basePosition = 'bottom', color = '#ffffff', highlightColor = '#d23a2c', highlightText = '#ffffff', size = 46, font = 'sans', wordByWord = true}) => {
  const frame = useCurrentFrame();
  const {u, fps, h} = useStage();
  const words = cue.text.split(/\s+/).filter(Boolean);
  const dur = cue.to - cue.from;
  const per = Math.max(3, Math.min(9, (dur * 0.6) / words.length));
  const exit = prog(frame, cue.to - 5, cue.to, ease.in);
  const position = cue.position ?? basePosition;
  const top = position === 'bottom' ? h * 0.78 : position === 'top' ? h * 0.1 : h * 0.47;
  return (
    <div
      style={{
        position: 'absolute',
        left: '7%',
        right: '7%',
        top,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: `${size * 0.18 * u}px ${size * 0.28 * u}px`,
        fontFamily: fonts[font],
        fontWeight: 800,
        fontSize: size * u,
        lineHeight: 1.15,
        opacity: 1 - exit,
      }}
    >
      {words.map((raw, i) => {
        const starred = /^\*.*\*[.,!?]*$/.test(raw);
        const w = raw.replace(/\*/g, '');
        const hl = starred || (cue.highlight ?? []).some((x) => w.toLowerCase().replace(/[^a-z0-9]/g, '') === x.toLowerCase());
        const start = cue.from + (wordByWord ? i * per : 0);
        const s = frame < start ? 0 : springAt(frame, fps, start, 'pop');
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `scale(${0.82 + 0.18 * s}) translateY(${(1 - s) * 10 * u}px)`,
              opacity: frame < start ? 0 : Math.min(1, s * 1.4),
              color: hl ? highlightText : color,
              background: hl ? highlightColor : 'transparent',
              padding: hl ? `0 ${size * 0.14 * u}px` : 0,
              borderRadius: 3 * u,
              textShadow: hl ? 'none' : `0 ${2 * u}px ${8 * u}px rgba(0,0,0,0.85), 0 0 ${2 * u}px rgba(0,0,0,0.9)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const CaptionTrack: React.FC<{cues: CaptionCue[]} & Style> = ({cues, ...style}) => {
  const frame = useCurrentFrame();
  const cue = cues.find((c) => frame >= c.from && frame < c.to);
  const Line: React.FC<any> = style.variant === 'premium' ? PremiumLine : style.variant && E2_CAPTION_LINES[style.variant] ? E2_CAPTION_LINES[style.variant] : CaptionLine;
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{cue && <Line cue={cue} {...style} />}</AbsoluteFill>;
};

const Demo: React.FC<{lines: string[]; secondLines?: string[]; framesPerLine: number; background: string} & Style> = ({lines, secondLines, framesPerLine, background, ...style}) => {
  // a cue's start/end are absolute frames; demo spreads lines evenly
  const cues = lines.map((text, i) => ({text, from: i * framesPerLine, to: (i + 1) * framesPerLine, ...(secondLines?.[i] ? {sub: secondLines[i]} : {})}));
  return (
    <AbsoluteFill style={{background}}>
      <CaptionTrack cues={cues} {...style} />
    </AbsoluteFill>
  );
};

export const kineticCaptions = defineMotion<Record<string, any>>({
  id: 'kinetic-captions',
  title: 'Kinetic word captions',
  category: 'text',
  description: 'Word-by-word pop-in captions; *starred* words sit on a solid highlight box.',
  source: ['video10 0:04-0:42', 'lemo-opuscar styles/caption-news, glass-product, ui toast (MIT, LemoLab)', 'pdoom karaoke-fill idea'],
  useFor: 'Narrated shorts: subtitles that pace with the voice and punch key words.',
  durationInFrames: 150,
  defaultProps: {
    lines: ['People *bent* double', 'on the *sidewalk.*', 'It *isn\'t* new.'],
    framesPerLine: 50,
    background: '#1c2433',
    position: 'center' as const,
    highlightColor: '#d23a2c',
    size: 64,
    variant: 'kinetic' as const,
    accent: '#E9C27A',
  },
  propDocs: {
    lines: 'caption lines; wrap a word in *stars* to highlight it',
    framesPerLine: 'frames each line stays on screen',
    background: 'scene colour; "transparent" = caption overlay on top of other motions',
    position: 'bottom | center | top',
    highlightColor: 'box colour behind highlighted words',
    variant: "kinetic (word pop + highlight boxes) | premium (calm line, words brighten as spoken, soft scrim) | slam (huge left-aligned chunks split by |, {keyword} on a colour block, optional secondLines) | toast (UI notification pill with live dot) | frosted-bar (blurred glass slab + accent line) | terminal (LOG tag, > prompt, words typed with the voice) | print (glyph-drop headline with offset overprint shadow) | karaoke (outline words fill as sung) | rise (calm per-word fade + rise)",
    accent: 'premium/toast/terminal/karaoke: accent colour (starred words, dot, tag, current word)',
    secondLines: 'slam: translation / second-language line per caption (shown under the chunks)',
    keywordColor: 'slam: colour of the {keyword} block (default honey #F2B63C)',
    slamScale: 'slam: start scale of each chunk (default 1.3)',
    chunkStagger: 'slam: seconds between chunks (default 0.12)',
    blur: 'frosted-bar: backdrop blur px at 1080p (default 18)',
    accentLine: 'frosted-bar: thin accent line on top of the bar (default true)',
    tag: 'terminal: inverse-video tag text (default LOG)',
    prompt: 'terminal: prompt glyph (default >)',
    shadowColor: 'print: second-ink offset shadow colour',
    sungColor: 'karaoke: colour of sung words (default = color)',
    unsungOpacity: 'karaoke: outline opacity of unsung words (default 0.35)',
    risePx: 'rise: px each word rises (default 8)',
    stagger: 'rise: frames between words (default 1.5)',
  },
  component: Demo as React.FC<any>,
  tags: ['caption', 'subtitle', 'toast', 'karaoke', 'lyrics', 'terminal', 'frosted', 'bilingual', 'keyword', 'headline', 'live transcript'],
});
