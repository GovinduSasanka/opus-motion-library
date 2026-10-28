import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {fonts, FontRole} from './fonts';
import {useStage} from './stage';

/**
 * Shared helpers for the round-2 "EXTENDS" group E2: new caption variants for kinetic-captions
 * (slam / toast / frosted-bar / terminal / print / karaoke / rise). Pure functions of the frame.
 * Caption looks adapted from lemo-opuscar styles (caption-news, glass-product, ui toasts) — MIT, see THIRD_PARTY_NOTICES.md.
 */

export interface CueLike {
  text: string;
  from: number;
  to: number;
  words?: {text: string; from: number; to: number}[];
  position?: 'bottom' | 'center' | 'top';
  tone?: 'light' | 'dark';
  /** second-language / translation line */
  sub?: string;
}

export interface CapStyle {
  position?: 'bottom' | 'center' | 'top';
  color?: string;
  highlightColor?: string;
  highlightText?: string;
  size?: number;
  font?: FontRole;
  accent?: string;
  /** slam: colour of the {keyword} block */
  keywordColor?: string;
  /** slam: start scale of each chunk */
  slamScale?: number;
  /** slam: seconds between chunks */
  chunkStagger?: number;
  /** frosted-bar: backdrop blur in px at 1080p */
  blur?: number;
  /** frosted-bar: draw a thin accent line on the bar top */
  accentLine?: boolean;
  /** terminal: inverse-video tag and prompt */
  tag?: string;
  prompt?: string;
  /** print: second-ink offset shadow colour */
  shadowColor?: string;
  /** karaoke: colours / opacity */
  sungColor?: string;
  unsungOpacity?: number;
  /** rise: px of rise and frames between words */
  risePx?: number;
  stagger?: number;
}

export const back = (t: number, k = 1.6) => {
  const x = clamp(t, 0, 1) - 1;
  return x * x * ((k + 1) * x + k) + 1;
};

const place = (pos: 'bottom' | 'center' | 'top', h: number, margin = 0.08): React.CSSProperties =>
  pos === 'top' ? {top: h * margin} : pos === 'center' ? {top: h * 0.45} : {bottom: h * margin};

const splitTokens = (text: string) => text.split(/\s+/).filter(Boolean);

/** word timings: explicit from speech alignment, else an even spread over 85 % of the cue */
const wordTimes = (cue: CueLike, n: number) =>
  Array.from({length: n}, (_, i) => {
    const wd = cue.words?.[i];
    const from = wd ? wd.from : cue.from + ((cue.to - cue.from) * 0.85 * i) / Math.max(1, n);
    const to = wd ? wd.to : cue.from + ((cue.to - cue.from) * 0.85 * (i + 1)) / Math.max(1, n);
    return {from, to: Math.max(to, from + 3)};
  });

/* ------------------------------------------------------------------ slam: chunks + keyword block */

export const SlamLine: React.FC<{cue: CueLike} & CapStyle> = ({cue, position = 'bottom', color = '#ffffff', size = 64, font = 'sans', keywordColor = '#F2B63C', slamScale = 1.3, chunkStagger = 0.12}) => {
  const frame = useCurrentFrame();
  const {u, h, w, fps, portrait} = useStage();
  const pos = cue.position ?? position;
  const chunks = cue.text.split('|').map((s) => s.trim()).filter(Boolean);
  const exit = prog(frame, cue.to - 5, cue.to, ease.in);
  const fs = size * 1.1 * u * (portrait ? 0.85 : 1);
  const gap = chunkStagger * fps;
  return (
    <div style={{position: 'absolute', left: '7%', right: '7%', ...place(pos, h, 0.1), fontFamily: fonts[font], opacity: 1 - exit}}>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: `${fs * 0.06}px ${fs * 0.3}px`, alignItems: 'baseline', textAlign: 'left', fontWeight: 800, fontSize: fs, lineHeight: 1.12}}>
        {chunks.map((chunk, i) => {
          const t0 = cue.from + i * gap;
          const k = frame < t0 ? 0 : prog(frame, t0, t0 + 4, (x) => x);
          const s = lerp(slamScale, 1, back(k, 1.6));
          const parts = chunk.split(/(\{[^}]*\})/).filter(Boolean);
          return (
            <span key={i} style={{display: 'inline-block', transformOrigin: '0% 70%', transform: `scale(${s})`, opacity: Math.min(1, k * 2.5), textShadow: `0 ${4 * u}px ${20 * u}px rgba(0,0,0,0.6)`}}>
              {parts.map((p, j) => {
                const isKw = /^\{.*\}$/.test(p);
                if (!isKw) return <span key={j} style={{color}}>{p}</span>;
                const wipe = prog(frame, t0 + 1, t0 + 5, ease.out);
                return (
                  <span key={j} style={{color: wipe > 0.35 ? '#161616' : color, padding: `0 ${fs * 0.14}px`, backgroundImage: `linear-gradient(${keywordColor},${keywordColor})`, backgroundRepeat: 'no-repeat', backgroundSize: `${wipe * 100}% 100%`, textShadow: 'none', borderRadius: 3 * u}}>
                    {p.slice(1, -1)}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>
      {cue.sub ? (
        <div style={{marginTop: fs * 0.2, fontSize: fs * 0.42, fontWeight: 600, color, opacity: 0.88 * prog(frame, cue.from + 4, cue.from + 9, ease.out), transform: `translateY(${(1 - prog(frame, cue.from + 4, cue.from + 9, ease.out)) * 10 * u}px)`, textShadow: `0 ${3 * u}px ${14 * u}px rgba(0,0,0,0.7)`, maxWidth: w * 0.8}}>{cue.sub}</div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ toast + frosted bar */

export const ToastLine: React.FC<{cue: CueLike} & CapStyle> = ({cue, position = 'bottom', color = '#F4F6FA', size = 64, font = 'sans', accent = '#59D6A0'}) => {
  const frame = useCurrentFrame();
  const {u, h, w, portrait} = useStage();
  const pos = cue.position ?? position;
  const enter = prog(frame, cue.from, cue.from + 5, ease.out);
  const exit = prog(frame, cue.to - 5, cue.to, ease.in);
  const fs = size * 0.55 * u * (portrait ? 1.1 : 1);
  const pulse = 0.65 + 0.35 * Math.sin(frame * 0.35);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        ...place(pos, h, 0.08),
        transform: `translate(-50%, ${(1 - enter) * 14 * u}px)`,
        opacity: enter * (1 - exit),
        maxWidth: w * (portrait ? 0.9 : 0.7),
        display: 'flex',
        alignItems: 'center',
        gap: fs * 0.55,
        padding: `${fs * 0.5}px ${fs * 1.2}px`,
        background: 'rgba(12,14,19,0.84)',
        border: `${Math.max(1, u)}px solid rgba(255,255,255,0.18)`,
        borderRadius: fs * 1.4,
        boxShadow: `0 ${10 * u}px ${40 * u}px rgba(0,0,0,0.5)`,
        fontFamily: fonts[font],
        fontWeight: 600,
        fontSize: fs,
        lineHeight: 1.25,
        color,
      }}
    >
      <span style={{flex: 'none', width: fs * 0.28, height: fs * 0.28, borderRadius: '50%', background: accent, boxShadow: `0 0 ${fs * 0.5 * pulse}px ${accent}`}} />
      <span>{cue.text.replace(/\*/g, '')}</span>
    </div>
  );
};

export const FrostedBarLine: React.FC<{cue: CueLike} & CapStyle> = ({cue, position = 'bottom', color = '#F6F8FB', size = 64, font = 'sans', accent = '#9CC8FF', blur = 18, accentLine = true}) => {
  const frame = useCurrentFrame();
  const {u, h, w, portrait} = useStage();
  const pos = cue.position ?? position;
  const enter = prog(frame, cue.from, cue.from + 8, ease.out);
  const exit = prog(frame, cue.to - 6, cue.to, ease.in);
  const fs = size * 0.58 * u * (portrait ? 1.1 : 1);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        ...place(pos, h, 0.07),
        transform: `translate(-50%, ${(1 - enter) * 10 * u}px)`,
        opacity: enter * (1 - exit),
        maxWidth: w * (portrait ? 0.9 : 0.72),
        padding: `${fs * 0.55}px ${fs * 1.5}px`,
        borderRadius: fs * 1.6,
        backdropFilter: `blur(${blur * u}px) brightness(1.25)`,
        WebkitBackdropFilter: `blur(${blur * u}px) brightness(1.25)`,
        background: 'linear-gradient(180deg, rgba(235,244,255,0.16), rgba(235,244,255,0.07))',
        border: `${Math.max(1, 1.2 * u)}px solid rgba(255,255,255,0.32)`,
        boxShadow: `0 ${8 * u}px ${30 * u}px rgba(0,0,0,0.28)`,
        fontFamily: fonts[font],
        fontWeight: 400,
        letterSpacing: '0.02em',
        textAlign: 'center',
        fontSize: fs,
        lineHeight: 1.25,
        color,
        overflow: 'hidden',
      }}
    >
      {accentLine && <div style={{position: 'absolute', left: '12%', right: '12%', top: 0, height: Math.max(2, 2 * u), background: `linear-gradient(90deg, transparent, ${accent}, transparent)`}} />}
      {cue.text.replace(/\*/g, '')}
    </div>
  );
};

/* ------------------------------------------------------------------ terminal log */

export const TerminalLine: React.FC<{cue: CueLike} & CapStyle> = ({cue, color = '#8CFFB4', size = 64, tag = 'LOG', prompt = '>', accent}) => {
  const frame = useCurrentFrame();
  const {u, h, w, portrait} = useStage();
  const tokens = splitTokens(cue.text.replace(/\*/g, '').toUpperCase());
  const times = wordTimes(cue, tokens.length);
  const shown = tokens.filter((_, i) => frame >= times[i].from).length;
  const fs = size * 0.5 * u * (portrait ? 1.15 : 1);
  const exit = prog(frame, cue.to - 4, cue.to, ease.in);
  const blink = Math.floor(frame / 8) % 2 === 0;
  const ink = accent ?? color;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: `${fs * 0.7}px ${w * 0.06}px ${fs * 1.1}px`,
        background: 'linear-gradient(180deg, rgba(0,10,6,0) 0%, rgba(0,12,7,0.85) 38%)',
        fontFamily: fonts.mono,
        fontWeight: 700,
        fontSize: fs,
        color,
        opacity: 1 - exit,
        textShadow: `0 0 ${fs * 0.5}px ${color}66`,
      }}
    >
      <div style={{borderTop: `${Math.max(1, 1.5 * u)}px dashed ${color}77`, marginBottom: fs * 0.55}} />
      <div style={{display: 'flex', gap: fs * 0.6, alignItems: 'baseline', flexWrap: 'wrap'}}>
        <span style={{background: ink, color: '#02140A', padding: `0 ${fs * 0.35}px`, textShadow: 'none'}}>{tag}</span>
        <span style={{opacity: 0.8}}>{prompt}</span>
        <span style={{letterSpacing: '0.04em'}}>
          {tokens.slice(0, shown).join(' ')}
          <span style={{display: 'inline-block', width: fs * 0.55, height: fs * 0.9, marginLeft: fs * 0.2, verticalAlign: 'text-bottom', background: ink, opacity: blink ? 1 : 0.15}} />
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ print headline (per-glyph drop + offset overprint) */

export const PrintLine: React.FC<{cue: CueLike} & CapStyle> = ({cue, position = 'center', color = '#ffffff', size = 64, shadowColor = '#E8453C', highlightColor = '#F6D13C'}) => {
  const frame = useCurrentFrame();
  const {u, h, portrait} = useStage();
  const pos = cue.position ?? position;
  const tokens = splitTokens(cue.text);
  const exit = prog(frame, cue.to - 5, cue.to, ease.in);
  const fs = size * 1.3 * u * (portrait ? 0.9 : 1);
  let gi = 0;
  return (
    <div style={{position: 'absolute', left: '6%', right: '6%', ...place(pos, h, 0.1), textAlign: 'center', fontFamily: fonts.display, fontSize: fs, lineHeight: 1.08, textTransform: 'uppercase', opacity: 1 - exit}}>
      {tokens.map((raw, wi) => {
        const starred = /^\*.*\*[.,!?;:]*$/.test(raw);
        const word = raw.replace(/\*/g, '');
        return (
          <span key={wi} style={{display: 'inline-block', whiteSpace: 'nowrap', marginRight: fs * 0.22}}>
            {word.split('').map((ch, ci) => {
              const t0 = cue.from + gi * 2;
              gi++;
              const k = prog(frame, t0, t0 + 7, (x) => x);
              const e = back(k, 1.7);
              const drop = (1 - e) * -70 * u;
              const sy = k < 1 ? 1 + (1 - k) * 0.25 : 1;
              const ink = starred ? highlightColor : color;
              return (
                <span key={ci} style={{position: 'relative', display: 'inline-block', opacity: k > 0 ? 1 : 0, transform: `translateY(${drop}px) scaleY(${sy})`}}>
                  <span style={{position: 'absolute', left: 8 * u, top: 8 * u, color: shadowColor, opacity: 0.95}}>{ch}</span>
                  <span style={{position: 'relative', color: ink}}>{ch}</span>
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ karaoke fill (+ soft rise) */

export const KaraokeLine: React.FC<{cue: CueLike} & CapStyle> = ({cue, position = 'center', color = '#F3EEE4', size = 64, font = 'sans', sungColor, accent = '#FF6A2B', unsungOpacity = 0.35}) => {
  const frame = useCurrentFrame();
  const {u, h, w, portrait} = useStage();
  const pos = cue.position ?? position;
  const tokens = splitTokens(cue.text.replace(/\*/g, ''));
  const times = wordTimes(cue, tokens.length);
  const enter = prog(frame, cue.from, cue.from + 6, ease.out);
  const exit = prog(frame, cue.to - 5, cue.to, ease.in);
  const fs = size * 1.15 * u * (portrait ? 0.9 : 1);
  const sung = sungColor ?? color;
  return (
    <div style={{position: 'absolute', left: '50%', width: w * (portrait ? 0.88 : 0.72), ...place(pos, h, 0.1), transform: `translateX(-50%) translateY(${(1 - enter) * 8 * u}px)`, textAlign: 'center', fontFamily: fonts[font], fontWeight: 800, fontSize: fs, lineHeight: 1.18, opacity: enter * (1 - exit)}}>
      {tokens.map((tk, i) => {
        const {from, to} = times[i];
        const k = clamp((frame - from) / Math.max(1, to - from), 0, 1);
        const current = frame >= from && frame < to;
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', marginRight: fs * 0.24}}>
            <span style={{color: 'transparent', WebkitTextStroke: `${Math.max(1, 1.4 * u)}px ${color}`, opacity: unsungOpacity + 0.3}}>{tk}</span>
            <span style={{position: 'absolute', left: 0, top: 0, color: current ? accent : sung, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, textShadow: current ? `0 0 ${fs * 0.3}px ${accent}88` : 'none'}}>{tk}</span>
          </span>
        );
      })}
    </div>
  );
};

export const RiseLine: React.FC<{cue: CueLike} & CapStyle> = ({cue, position = 'bottom', color = '#F5F2EC', size = 64, font = 'sans', risePx = 8, stagger = 1.5}) => {
  const frame = useCurrentFrame();
  const {u, h, w, portrait} = useStage();
  const pos = cue.position ?? position;
  const tokens = splitTokens(cue.text.replace(/\*/g, ''));
  const exit = prog(frame, cue.to - 6, cue.to, ease.in);
  const fs = size * 0.9 * u * (portrait ? 0.95 : 1);
  return (
    <div style={{position: 'absolute', left: '50%', width: w * (portrait ? 0.88 : 0.66), ...place(pos, h, 0.09), transform: 'translateX(-50%)', textAlign: 'center', fontFamily: fonts[font], fontWeight: 600, fontSize: fs, lineHeight: 1.25, color, opacity: 1 - exit, textShadow: `0 ${2 * u}px ${12 * u}px rgba(0,0,0,0.5)`}}>
      {tokens.map((tk, i) => {
        const k = prog(frame, cue.from + i * stagger, cue.from + i * stagger + 21, ease.out);
        return (
          <span key={i} style={{display: 'inline-block', marginRight: fs * 0.26, opacity: Math.sin((k * Math.PI) / 2), transform: `translateY(${(1 - k) * risePx * u}px)`}}>{tk}</span>
        );
      })}
    </div>
  );
};

/** variant -> caption line, for the new E2 variants */
export const E2_CAPTION_LINES: Record<string, React.FC<{cue: CueLike} & CapStyle>> = {
  slam: SlamLine,
  toast: ToastLine,
  'frosted-bar': FrostedBarLine,
  terminal: TerminalLine,
  print: PrintLine,
  karaoke: KaraokeLine,
  rise: RiseLine,
};
