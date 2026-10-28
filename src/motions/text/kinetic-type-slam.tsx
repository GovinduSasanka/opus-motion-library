import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog, springAt} from '../../core/ease';
import {fonts, FontRole} from '../../core/fonts';
import {measureText} from '../../core/r2-pr1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Phrase-level kinetic type (short lines of 2-4 words). Unlike word-slam-hook (one word per beat, full frame) this one
 * lays out whole phrases: words land one per beat inside their own mask, scale-punch, STACK into a block (or justify to
 * the full width, or swap in place), hold, then the whole line is pushed off by the next one. One accent word per line
 * takes the brand colour. Optional slow camera push and landing shake.
 */

type Line = {text: string; accent?: string | number; at?: number};
type Props = {
  lines: Line[];
  layout: 'stack' | 'center' | 'fill';
  beatFrames: number;
  holdBeats: number;
  font: FontRole;
  align: 'left' | 'center';
  tracking: number;
  uppercase: boolean;
  capHeight: number;
  entryScale: number;
  push: number;
  shake: number;
  flash: boolean;
  showIndex: boolean;
  background: string;
  ink: string;
  accent: string;
};

const WEIGHT: Partial<Record<FontRole, number>> = {display: 400, sans: 800, grotesk: 700, serif: 700, mono: 700};

type WordT = {text: string; accent: boolean; at: number; i: number; n: number};

const KineticTypeSlam: React.FC<Props> = ({lines, layout, beatFrames, holdBeats, font, align, tracking, uppercase, capHeight, entryScale, push, shake, flash, showIndex, background, ink, accent}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames} = useStage();
  const family = fonts[font];
  const weight = WEIGHT[font] ?? 700;
  const beat = Math.max(4, beatFrames);

  // schedule: each line starts where the previous one's push-off begins (or at its own `at`)
  type Sched = {start: number; end: number; words: WordT[]};
  const sched: Sched[] = [];
  let cursor = 6;
  lines.forEach((ln, li) => {
    const raw = (ln.text || '').trim().split(/\s+/).filter(Boolean);
    const start = ln.at ?? cursor;
    const words: WordT[] = raw.map((t, i) => {
      const isAcc = typeof ln.accent === 'number' ? ln.accent === i : typeof ln.accent === 'string' ? t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === ln.accent.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') : false;
      return {text: uppercase ? t.toUpperCase() : t, accent: isAcc, at: start + i * beat, i, n: raw.length};
    });
    const end = start + raw.length * beat + holdBeats * beat;
    sched.push({start, end, words});
    cursor = end + 2;
    void li;
  });

  const trackPx = (txt: string, size: number) => measureText(txt, family, size, weight) + tracking * size * txt.length;
  const unitW = (txt: string) => trackPx(txt, 100) / 100;

  // which lines are visible
  const out: React.ReactNode[] = [];
  let landing = 99; // frames since the last word landed (for shake / flash)
  let lastAccentAge = 99;
  sched.forEach((s, li) => {
    const isLast = li === sched.length - 1;
    const exitP = isLast ? 0 : prog(frame, s.end, s.end + 9, ease.in);
    if (frame < s.start || exitP >= 1) return;
    const n = s.words.length;
    const maxW = w * (portraitSafe(w, h) ? 0.9 : 0.86);
    const capPx = capHeight * h; // desired cap height of the biggest word (px)
    // font-size per word
    let sizes: number[];
    if (layout === 'fill') {
      sizes = s.words.map((wd) => Math.min(maxW / unitW(wd.text), (h * 0.8) / n / 0.9));
    } else if (layout === 'center') {
      sizes = s.words.map((wd) => Math.min(maxW / unitW(wd.text), capPx / 0.7 + 40 * u));
    } else {
      const fitW = Math.min(...s.words.map((wd) => maxW / unitW(wd.text)));
      const fitH = (h * 0.8) / n / 0.88;
      const sz = Math.min(fitW, fitH, capPx / 0.7 + 60 * u);
      sizes = s.words.map(() => sz);
    }
    const lh = 0.86;
    const heights = sizes.map((sz) => sz * lh);
    const total = heights.reduce((a, b) => a + b, 0);
    const blockW = Math.max(...s.words.map((wd, i) => unitW(wd.text) * sizes[i]));
    const pushY = lerp(0, -(h * 0.62 + total / 2), exitP);

    let yCursor = h / 2 - total / 2;
    s.words.forEach((wd, i) => {
      const age = frame - wd.at;
      const hSz = heights[i];
      const sz = sizes[i];
      const top = layout === 'center' ? h / 2 - hSz / 2 : yCursor;
      yCursor += hSz;
      if (age < 0) return;
      // in 'center' only the newest word is on screen
      if (layout === 'center' && i < n - 1 && frame >= s.words[i + 1].at) return;
      const sp = springAt(frame, fps, wd.at, 'snappy');
      const from = i % 2 ? Math.min(entryScale, 0.6) : Math.max(entryScale, 1.25);
      const scale = lerp(from, 1, sp);
      const slide = (1 - prog(frame, wd.at, wd.at + 6, ease.out)) * hSz * 0.95;
      const wordW = unitW(wd.text) * sz;
      const left = layout === 'center' || layout === 'fill' || align === 'center' ? (w - wordW) / 2 : (w - blockW) / 2;
      landing = Math.min(landing, age);
      if (wd.accent) lastAccentAge = Math.min(lastAccentAge, age);
      out.push(
        <div
          key={`${li}-${i}`}
          style={{
            position: 'absolute',
            left,
            top: top + pushY,
            width: wordW + sz * 0.08,
            height: hSz,
            overflow: 'hidden',
            transform: `scale(${scale})`,
            transformOrigin: layout === 'center' ? '50% 50%' : align === 'center' || layout === 'fill' ? '50% 60%' : '0% 60%',
          }}
        >
          <div
            style={{
              transform: `translateY(${slide}px)`,
              fontFamily: family,
              fontWeight: weight,
              fontSize: sz,
              lineHeight: `${hSz}px`,
              height: hSz,
              letterSpacing: `${tracking}em`,
              color: wd.accent ? accent : ink,
              whiteSpace: 'nowrap',
              paddingTop: sz * 0.02,
            }}
          >
            {wd.text}
          </div>
        </div>,
      );
    });
  });

  // camera: slow push + landing shake
  const pushScale = 1 + push * (frame / Math.max(1, durationInFrames));
  const sk = Math.max(0, 1 - landing / 5) * shake * u;
  const shx = Math.sin(frame * 12.9) * sk;
  const shy = Math.cos(frame * 9.3) * sk;
  const flashA = flash ? Math.max(0, 1 - lastAccentAge / 3) * 0.16 : 0;
  const curLine = sched.findIndex((s, i) => frame >= s.start && (i === sched.length - 1 || frame < s.end + 6));

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${shx}px, ${shy}px) scale(${pushScale})`, transformOrigin: '50% 50%'}}>{out}</AbsoluteFill>
      <AbsoluteFill style={{background: accent, opacity: flashA, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)'}} />
      {showIndex && curLine >= 0 ? (
        <div style={{position: 'absolute', left: 48 * u, top: 44 * u, fontFamily: fonts.mono, fontSize: 22 * u, letterSpacing: '0.18em', color: ink, opacity: 0.45}}>
          {String(curLine + 1).padStart(2, '0')} / {String(lines.length).padStart(2, '0')}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const portraitSafe = (w: number, h: number) => h > w;

export const kineticTypeSlam = defineMotion<Props>({
  id: 'kinetic-type-slam',
  title: 'Kinetic type slam (phrases)',
  category: 'text',
  description:
    'Huge 2-4 word phrases land one word per beat: each word rises through its own mask with a 1.25→1 (or 0.6→1) scale punch, they stack (or justify full-width, or swap in place), one accent word takes the brand colour, then the whole line is shoved off the top by the next phrase while the camera creeps in.',
  source: ['prompt-corpus: kinetic-type-slam (52 cases)', 'awesome-opus5-5-videos prompts (MIT) — technique only'],
  useFor: 'Hooks for shorts, launch films, manifestos and title sequences: pass `lines` (accent word per line), pick `layout`, set `beatFrames` to your music grid.',
  durationInFrames: 180,
  defaultProps: {
    lines: [
      {text: 'Make it punchy', accent: 'punchy'},
      {text: 'One word per beat', accent: 'beat'},
      {text: 'Then push it off', accent: 'off'},
      {text: 'Ship the hook', accent: 'hook'},
    ],
    layout: 'stack',
    beatFrames: 10,
    holdBeats: 1.4,
    font: 'display',
    align: 'center',
    tracking: -0.03,
    uppercase: true,
    capHeight: 0.28,
    entryScale: 1.25,
    push: 0.06,
    shake: 5,
    flash: true,
    showIndex: true,
    background: '#0E0E10',
    ink: '#F3EFE6',
    accent: '#FF4D12',
  },
  propDocs: {
    lines: '[{text, accent?: word or index, at?: start frame}] — 2-4 words each',
    layout: "'stack' words stacked at one size · 'fill' each word justified to full width · 'center' one word at a time",
    beatFrames: 'frames per word (6-15; match your beat grid)',
    holdBeats: 'beats a finished line holds before being pushed off',
    font: "'display' | 'sans' | 'grotesk' | 'serif' | 'mono'",
    align: "'left' | 'center' for stack",
    tracking: 'letter-spacing in em (-0.02…-0.04)',
    capHeight: 'cap height of the biggest word as a fraction of frame height (0.25-0.45)',
    entryScale: 'start scale of even words (1.25 punch-in); odd words use ≤0.6 pop-up',
    push: 'camera push-in over the whole clip (0.06 = +6 %)',
    shake: 'landing shake in px (0 = none)',
    flash: 'accent-colour flash on accent-word impact',
    showIndex: 'small 01/04 line counter',
    background: 'background colour',
    ink: 'text colour',
    accent: 'accent word colour',
  },
  component: KineticTypeSlam,
  tags: ['kinetic', 'typography', 'type', 'words', 'phrases', 'slam', 'hook', 'title', 'beat', 'punchy', 'stack', 'manifesto', 'launch', 'shorts', 'text'],
});
