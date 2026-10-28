// Adapted from pdoom-video/app/src/scenes/bureau.ts (beat stutter ×3 time-remap) (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BeatsProp, MUSIC_PROP_DOCS, TREATISE, TimeRemap, TreatiseFinish, clamp01, E, plexMono, stutterFrame, useGrid, vf} from '../../core/r2-music-kit';

type Props = {
  word: string;
  caption: string;
  stutters: {at: number; length: number; repeats: number}[];
  flash: boolean;
  showClock: boolean;
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  background: string;
  ink: string;
  accent: string;
};

/** demo subject: a second hand sweeping + the word sliding through, so repeats are unmistakable */
const ClockScene: React.FC<{word: string; caption: string; ink: string; accent: string}> = ({word, caption, ink, accent}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const cx = w / 2;
  const cy = h * 0.44;
  const R = Math.min(w, h) * 0.26;
  const ang = (t / 4) * Math.PI * 2 - Math.PI / 2;
  const fs = Math.min(120 * u * (portrait ? 1.1 : 1), (w * 0.8) / Math.max(3, word.length * 0.62));
  const slide = ((t * 0.12) % 1.4) - 0.2;
  return (
    <AbsoluteFill>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={ink} strokeWidth={Math.max(1, 1.6 * u)} />
        {Array.from({length: 48}, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const r0 = i % 4 === 0 ? R * 0.9 : R * 0.95;
          return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke={ink} strokeOpacity={0.6} strokeWidth={Math.max(1, u)} />;
        })}
        <line x1={cx} y1={cy} x2={cx + Math.cos(ang) * R * 0.82} y2={cy + Math.sin(ang) * R * 0.82} stroke={accent} strokeWidth={Math.max(2, 3 * u)} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5 * u} fill={accent} />
        <circle cx={cx + Math.cos(ang) * R * 1.1} cy={cy + Math.sin(ang) * R * 1.1} r={6 * u} fill={ink} opacity={0.5} />
      </svg>
      <div style={{position: 'absolute', left: slide * w, top: h * (portrait ? 0.72 : 0.7), ...vf(76, 880), fontSize: fs, color: ink, whiteSpace: 'pre'}}>{word}</div>
      <div style={{position: 'absolute', left: w * 0.5, top: cy - R - 34 * u, transform: 'translateX(-50%)', fontFamily: plexMono, fontSize: 14 * u * (portrait ? 1.2 : 1), color: accent, letterSpacing: 4}}>{caption}</div>
    </AbsoluteFill>
  );
};

const TimeStutter: React.FC<Props> = ({word, caption, stutters, flash, showClock, bpm, offsetSec, beats, background, ink, accent}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const list = (stutters.length ? stutters : [{at: 60, length: 15, repeats: 3}]).slice().sort((a, b) => a.at - b.at);
  let f = frame;
  let active = -1;
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    const before = f;
    f = stutterFrame(f, s.at, s.length, s.repeats);
    if (frame >= s.at && frame < s.at + s.length * s.repeats && before !== f) active = i;
  }
  const inLoop = active >= 0;
  const loop = inLoop ? list[active] : null;
  const loopK = loop ? ((frame - loop.at) % loop.length) / loop.length : 0;
  const flashOn = flash && loop && (frame - loop.at) % loop.length < 1.0;
  const clear = background === 'transparent';
  const mono = 13 * u * (portrait ? 1.25 : 1);
  const total = 1;
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      <TimeRemap map={() => f}>
        <ClockScene word={word} caption={caption} ink={ink} accent={accent} />
      </TimeRemap>
      {flashOn ? <AbsoluteFill style={{background: accent, opacity: 0.16}} /> : null}
      {inLoop ? (
        <div style={{position: 'absolute', right: w * 0.05, top: h * 0.07, fontFamily: plexMono, fontSize: mono * 1.2, color: accent, letterSpacing: 3, transform: `scale(${1 + 0.15 * E.outCubic(1 - loopK)})`, transformOrigin: '100% 0'}}>
          {`⟲ REPEAT ${Math.floor((frame - (loop as {at: number}).at) / (loop as {length: number}).length) + 1}/${(loop as {repeats: number}).repeats}`}
        </div>
      ) : null}
      {showClock ? (
        <div style={{position: 'absolute', left: w * 0.05, bottom: h * 0.055, fontFamily: plexMono, fontSize: mono, color: ink, opacity: 0.65, letterSpacing: 2}}>
          {`OUT ${String(frame).padStart(4, '0')} → SRC ${String(Math.round(f)).padStart(4, '0')}  ·  Σ stutter ${list.reduce((a, s) => a + s.length * s.repeats, 0)}f`}
        </div>
      ) : null}
      {!clear ? <TreatiseFinish grain={0.06} vignette={0.3} /> : null}
    </AbsoluteFill>
  );
};

export const timeStutter = defineMotion<Props>({
  id: 'time-stutter',
  title: 'Time stutter (DJ retrig)',
  category: 'music',
  description:
    'DJ-style time stutter: the scene — a sweeping clock hand and a word sliding through — plays normally, then the last beat retrigs ×3 like a spun-back record (with an accent flash and a ⟲ REPEAT counter), and time carries on shifted so nothing is skipped; the OUT→SRC readout shows the remap. The `<TimeRemap>` wrapper stutters any motion.',
  source: ['pdoom-video app/src/scenes/bureau.ts beat stutter ×3 (MIT)'],
  useFor: 'Emphasis edits on a word like “repeat”, pre-drop tension, promo retrigs; wrap any motion and list the stutter points.',
  durationInFrames: 240,
  defaultProps: {
    word: 'REPEAT',
    caption: 'TIME REMAP',
    stutters: [
      {at: 60, length: 15, repeats: 3},
      {at: 165, length: 8, repeats: 4},
    ],
    flash: true,
    showClock: true,
    bpm: 120,
    offsetSec: 0,
    beats: {},
    background: TREATISE.ink,
    ink: TREATISE.bone,
    accent: TREATISE.signal,
  },
  propDocs: {
    word: 'the sliding word in the demo scene',
    caption: 'small caption over the clock',
    stutters: 'stutter points [{at: output frame, length: frames of the loop, repeats}] — applied in order',
    flash: 'accent flash on each retrig',
    showClock: 'OUT→SRC frame readout',
    ...MUSIC_PROP_DOCS,
    background: "frame colour or 'transparent'",
    ink: 'scene colour',
    accent: 'second hand / retrig colour',
  },
  component: TimeStutter,
  tags: ['stutter', 'retrig', 'time remap', 'dj', 'loop', 'repeat', 'beat', 'music', 'edit', 'glitch', 'freeze', 'wrapper', 'clock'],
});
