import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {rng} from '../../core/random';
import {FilmGrain, useStage} from '../../core/stage';
import {TFont, eoc, tfonts} from '../../core/text-kit';
import {defineMotion} from '../../core/types';
import {DECODE_POOL, decodeGlyph, decodeRanks} from '../../core/r2-e2-text-kit';

/**
 * Corner credit typed on (video1 / video6 "opus 5.5"): one character every 2 frames at full
 * opacity, no cursor, a short hold after the first word. Optional scramble-out: glyphs jitter into
 * look-alike glyphs for 1–2 frames each while a 2-px block dissolve eats them within ~6 frames.
 */

type Props = {
  text: string;
  framesPerChar: number;
  charsPerStep: number;
  startFrame: number;
  wordPause: number;
  scrambleOut: boolean;
  scrambleAt: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  font: TFont;
  weight: number;
  size: number;
  color: string;
  tracking: number;
  background: string;
  decor: boolean;
  decorColor: string;
  mode: 'type' | 'decode';
  decodeFrames: number;
  reseedEvery: number;
  pool: string;
  direction: 'ltr' | 'center-out' | 'random';
  decodeOut: number;
};

const LOOKALIKE: Record<string, string> = {
  o: 'cea0', p: 'qrb', u: 'vnµ', s: 'z5e', a: 'oeä', e: 'co3', n: 'mhr', r: 'nvt', i: 'lj!', l: 'i1|', t: 'f+', c: 'oe(', d: 'bq', '5': 's6S', '.': ',·', '0': 'oO8', '1': 'l7', '2': 'z7', '3': '8e', '4': 'A9', '6': 'b5', '7': '1/', '8': '3B', '9': 'gq',
};
const POOL = 'acemnorsuvxz';

/** faint flower-of-life construction behind the credit (video6 end geometry) */
const Decor: React.FC<{color: string}> = ({color}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const R = Math.min(w, h) * (portrait ? 0.38 : 0.22);
  const cx = w / 2;
  const cy = h / 2;
  const rot = frame * 0.08;
  const draw = eoc(frame / 50);
  const circ = 2 * Math.PI * (R / 2);
  const hex = Array.from({length: 6}, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
  });
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <g transform={`rotate(${rot} ${cx} ${cy})`} fill="none" stroke={color} strokeWidth={1.6 * u} opacity={0.55}>
        <circle cx={cx} cy={cy} r={R} strokeDasharray={2 * Math.PI * R} strokeDashoffset={2 * Math.PI * R * (1 - draw)} />
        {hex.map(([x, y], i) => (
          <circle key={i} cx={(x + cx) / 2} cy={(y + cy) / 2} r={R / 2} strokeDasharray={circ} strokeDashoffset={circ * (1 - clamp(draw * 1.4 - i * 0.06))} opacity={0.8} />
        ))}
        <polygon points={hex.map((p) => p.join(',')).join(' ')} stroke="#c9cdf2" strokeDasharray={6 * R} strokeDashoffset={6 * R * (1 - draw)} opacity={0.7} />
      </g>
      {[0, 1].map((i) => {
        const y = cy + (i ? 40 : -40) * u + Math.sin(frame * 0.05 + i * 2) * 6 * u;
        return (
          <g key={i} opacity={draw}>
            <circle cx={cx} cy={y} r={9 * u} fill="#fff4cf" />
            <circle cx={cx} cy={y} r={20 * u} fill="#ffd36e" opacity={0.18} />
          </g>
        );
      })}
    </svg>
  );
};

const TypewriterSignature: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {u, durationInFrames, portrait} = useStage();
  const chars = [...p.text];
  const firstSpace = p.text.indexOf(' ');
  // time at which char i appears (steps of charsPerStep every framesPerChar, + pause after first word)
  const appearAt = (i: number) => p.startFrame + Math.floor(i / p.charsPerStep) * p.framesPerChar + (firstSpace > 0 && i >= firstSpace ? p.wordPause : 0);
  const sAt = p.scrambleAt > 0 ? p.scrambleAt : durationInFrames - 14;
  const sp = p.scrambleOut ? clamp((frame - sAt) / 7) : 0;
  const decode = p.mode === 'decode';
  const scr = !decode && p.scrambleOut && frame >= sAt;
  const ranks = decodeRanks(chars.length, p.direction, 3);
  const dn = chars.length;
  const resIn = Math.floor(clamp((frame - p.startFrame) / Math.max(1, p.decodeFrames)) * (dn + 1));
  const resOut = decode && p.decodeOut > 0 ? Math.floor((1 - clamp((frame - sAt) / p.decodeOut)) * (dn + 1)) : dn + 1;
  const resolvedCount = Math.min(resIn, resOut);
  const decOutFade = decode && p.decodeOut > 0 ? 1 - clamp((frame - sAt - p.decodeOut) / 4) : 1;
  const fid = `tsig-${Math.round(sp * 100)}`;
  const pos = p.position;
  const margin = 0.08;
  const style: React.CSSProperties = {position: 'absolute', whiteSpace: 'pre'};
  if (pos === 'center') Object.assign(style, {left: 0, right: 0, top: '50%', textAlign: 'center', transform: 'translateY(-50%)'});
  else {
    if (pos.includes('right')) Object.assign(style, {right: `${margin * 100}%`, textAlign: 'right'});
    else Object.assign(style, {left: `${margin * 100}%`});
    if (pos.includes('bottom')) Object.assign(style, {bottom: '6%'});
    else Object.assign(style, {top: '6%'});
  }
  return (
    <AbsoluteFill style={{background: p.background}}>
      {p.decor && <Decor color={p.decorColor} />}
      <FilmGrain opacity={0.06} />
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={fid} x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={0.45 / u} numOctaves={1} seed={7} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -0.6" result="m" />
          <feComponentTransfer in="m" result="k">
            <feFuncA type="linear" slope={14} intercept={-14 * sp} />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="k" operator="in" />
        </filter>
      </svg>
      <div
        style={{
          ...style,
          fontFamily: tfonts[p.font],
          fontWeight: p.weight,
          fontSize: p.size * u * (portrait ? 1.6 : 1),
          color: p.color,
          letterSpacing: `${p.tracking}em`,
          filter: scr ? `url(#${fid})` : undefined,
          opacity: decode ? decOutFade : sp >= 1 ? 0 : 1,
        }}
      >
        {chars.map((c, i) => {
          if (decode) {
            if (frame < p.startFrame) return null;
            const d = decodeGlyph(c, i, frame, resolvedCount, ranks[i], p.reseedEvery, p.pool || DECODE_POOL);
            return (
              <span key={i} style={{opacity: d.resolved ? 1 : d.band ? 0.6 : 0.45}}>
                {d.g}
              </span>
            );
          }
          if (frame < appearAt(i)) return null;
          let g = c;
          if (scr && c !== ' ') {
            const step = Math.floor((frame - sAt) / 2);
            const r = rng(`sig${i}-${step}`);
            if (r() < 0.75) {
              const set = LOOKALIKE[c.toLowerCase()] ?? POOL;
              g = set[Math.floor(r() * set.length)];
            }
          }
          return <span key={i}>{g}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const typewriterSignature = defineMotion<Props>({
  id: 'typewriter-signature',
  title: 'Typewriter signature',
  category: 'text',
  description: 'Small lowercase credit typed into a corner two frames per character, no cursor; optional glyph-scramble dissolve out.',
  source: ['video1 1:06.2-1:06.5', 'video6 0:52.3-0:53.2'],
  useFor: 'Sign-offs, maker credits, version tags and quiet end stamps.',
  durationInFrames: 90,
  defaultProps: {
    text: 'opus 5.5',
    framesPerChar: 2,
    charsPerStep: 1,
    startFrame: 24,
    wordPause: 4,
    scrambleOut: true,
    scrambleAt: 0,
    position: 'bottom-right',
    font: 'rounded',
    weight: 300,
    size: 44,
    color: '#E9E0D5',
    tracking: 0.05,
    background: '#15100E',
    decor: true,
    decorColor: '#6f86d8',
    mode: 'type',
    decodeFrames: 20,
    reseedEvery: 2,
    pool: '',
    direction: 'ltr',
    decodeOut: 8,
  },
  propDocs: {
    text: 'the credit text',
    framesPerChar: 'frames per typing step (2 = video6; video1 uses 2 with charsPerStep 2)',
    charsPerStep: 'characters added per step',
    startFrame: 'frame the first character appears',
    wordPause: 'extra frames held after the first word',
    scrambleOut: 'glyph-scramble + pixel dissolve exit',
    scrambleAt: 'frame the scramble-out starts (0 = 14 frames before the end)',
    position: 'bottom-right | bottom-left | top-right | top-left | center',
    font: 'font role (rounded = Quicksand, video1/6 look)',
    size: 'glyph size in px at 1080p',
    background: 'scene colour (use "transparent" to overlay)',
    decor: 'draw a faint flower-of-life construction behind the credit',
    mode: 'type (typed on) | decode (random symbols resolve into the real letters, then break back into symbols)',
    decodeFrames: 'decode: frames the resolve takes (≈20 ms per char in the source)',
    reseedEvery: 'decode: frames between re-randomising unresolved glyphs',
    pool: 'decode: glyph pool (empty = brackets, symbols, letters)',
    direction: 'decode: ltr | center-out | random resolve order',
    decodeOut: 'decode: frames the break-back-to-symbols exit takes at scrambleAt (0 = no decode exit)',
  },
  component: TypewriterSignature,
  tags: ['credit', 'signature', 'typewriter', 'endcard', 'decode', 'scramble', 'hacker', 'generating', 'boot', 'decrypt'],
});
