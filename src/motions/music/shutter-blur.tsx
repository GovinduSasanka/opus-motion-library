// Adapted from pdoom-video/README.md + docs/ENGINE.md "Motion blur and sampling" (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BeatsProp, E, MUSIC_PROP_DOCS, ShutterBlur, TREATISE, TreatiseFinish, clamp01, plexMono, useGrid, vf} from '../../core/r2-music-kit';

type Props = {
  words: string[];
  samples: number;
  shutter: number;
  compare: boolean;
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  background: string;
  ink: string;
  accent: string;
  steppedLabel: string;
  shutterLabel: string;
};

/** demo subject: a word whipping through the frame once per bar + a pendulum ball */
const Whip: React.FC<{words: string[]; ink: string; accent: string; bpm: number; offsetSec: number}> = ({words, ink, accent, bpm, offsetSec}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const barSec = (60 / bpm) * 4;
  const bar = Math.max(0, Math.floor((t - offsetSec) / barSec));
  const k = clamp01(((t - offsetSec) % barSec + (t < offsetSec ? barSec : 0)) / barSec);
  const word = (words.length ? words : ['WHIP'])[bar % Math.max(1, words.length)];
  // slam in from the right with outExpo, hold, exit left with inExpo
  const x = k < 0.5 ? (1 - E.outExpo(clamp01(k / 0.22))) * w * 1.1 : -E.inExpo(clamp01((k - 0.78) / 0.22)) * w * 1.1;
  const fs = Math.min(200 * u * (portrait ? 1.1 : 1), (w * 0.8) / Math.max(2, word.length * 0.62));
  const pend = Math.sin(t * 5.2) * w * 0.3;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: '50%', top: '42%', transform: `translate(-50%, -50%) translateX(${x}px)`, ...vf(72, 900), fontSize: fs, color: ink, whiteSpace: 'pre'}}>{word}</div>
      <div style={{position: 'absolute', left: '50%', top: '72%', transform: `translateX(${pend}px)`, width: 34 * u, height: 34 * u, marginLeft: -17 * u, borderRadius: '50%', background: accent}} />
    </AbsoluteFill>
  );
};

const ShutterBlurMotion: React.FC<Props> = ({words, samples, shutter, compare, bpm, offsetSec, beats, background, ink, accent, steppedLabel = 'STEPPED · NO SHUTTER', shutterLabel = 'SHUTTER {f}f · {n} SAMPLES'}) => {
  const {w, h, u, portrait} = useStage();
  useGrid(beats, bpm, offsetSec);
  const clear = background === 'transparent';
  const mono = 13 * u * (portrait ? 1.3 : 1);
  const subject = <Whip words={words} ink={ink} accent={accent} bpm={bpm} offsetSec={offsetSec} />;
  const half: React.CSSProperties = {position: 'absolute', top: 0, bottom: 0, overflow: 'hidden'};
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      {compare ? (
        <>
          <div style={{...half, left: 0, width: w / 2}}>
            <div style={{position: 'absolute', width: w, height: h}}>{subject}</div>
          </div>
          <div style={{...half, left: w / 2, width: w / 2}}>
            <div style={{position: 'absolute', width: w, height: h, left: -w / 2}}>
              <div style={{position: 'absolute', width: w, height: h, left: 0}}>
                <ShutterBlur samples={samples} shutter={shutter}>{subject}</ShutterBlur>
              </div>
            </div>
          </div>
          <div style={{position: 'absolute', left: w / 2 - 1, top: 0, bottom: 0, width: 2, background: ink, opacity: 0.4}} />
          <div style={{position: 'absolute', left: w * 0.05, bottom: h * 0.06, fontFamily: plexMono, fontSize: mono, color: ink, opacity: 0.7, letterSpacing: 2}}>{steppedLabel}</div>
          <div style={{position: 'absolute', right: w * 0.05, bottom: h * 0.06, fontFamily: plexMono, fontSize: mono, color: accent, letterSpacing: 2, textAlign: 'right'}}>
            {shutterLabel.replace('{f}', shutter.toFixed(1)).replace('{n}', String(samples))}
          </div>
        </>
      ) : (
        <ShutterBlur samples={samples} shutter={shutter}>{subject}</ShutterBlur>
      )}
      {!clear ? <TreatiseFinish grain={0.06} vignette={0.3} /> : null}
    </AbsoluteFill>
  );
};

export const shutterBlurMotion = defineMotion<Props>({
  id: 'shutter-blur',
  title: 'Shutter motion blur (wrapper demo)',
  category: 'music',
  description:
    'Real shutter motion blur: a word whips through the frame once per bar and a ball swings below, rendered as the average of N sub-frame samples over a fractional-frame shutter so fast moves leave true streaks; split-screen compares the stepped original with the blurred pass. The `<ShutterBlur>` wrapper works around any deterministic motion.',
  source: ['pdoom-video README.md + docs/ENGINE.md motion blur and sampling (MIT): 0.2-frame shutter, 12 still / 36 move / 108+ whip samples'],
  useFor: 'Premium finish for type slams, whips and crash zooms — wrap just the hit moments (cost scales with samples).',
  durationInFrames: 240,
  defaultProps: {
    words: ['WHIP', 'PAN', 'SLAM'],
    samples: 12,
    shutter: 0.9,
    compare: true,
    bpm: 120,
    offsetSec: 0.2,
    beats: {},
    background: TREATISE.ink,
    ink: TREATISE.bone,
    accent: TREATISE.signal,
    steppedLabel: 'STEPPED · NO SHUTTER',
    shutterLabel: 'SHUTTER {f}f · {n} SAMPLES',
  },
  propDocs: {
    words: 'one word per bar for the whip demo',
    samples: 'sub-frame renders averaged per frame (12 subtle · 36 camera move · 108 whips; render cost ×samples)',
    shutter: 'shutter length in frames (0.5–1 natural, >1 dreamy)',
    compare: 'split screen: left stepped, right blurred (false = full-frame blurred)',
    ...MUSIC_PROP_DOCS,
    background: "frame colour or 'transparent'",
    ink: 'type colour',
    accent: 'ball / label colour',
    steppedLabel: 'caption of the un-blurred half in compare mode',
    shutterLabel: 'caption of the blurred half; {f} = shutter angle in frames, {n} = samples',
  },
  component: ShutterBlurMotion,
  tags: ['motion blur', 'shutter', 'whip', 'slam', 'samples', 'film', 'premium', 'wrapper', 'speed', 'streak', 'compare', 'music'],
});
