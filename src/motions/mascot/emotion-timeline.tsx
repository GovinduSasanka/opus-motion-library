// Adapted from ClaudeAnimationBase/src/clawd.js emotions() (MIT, © 2026 John Heibel) — see THIRD_PARTY_NOTICES.md
// Character design is original ("Nib").
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {EMOTIONS_LIST, EmotionKey, NIB_COLORS, NIB_PROP_DOCS, NibBackdrop, NibFigure, NibLook, emotionsAt, nibColorsFrom, nibUnit} from '../../core/r2-mascot-kit';

type Props = {
  keys: EmotionKey[];
  showTimeline: boolean;
  size: number;
  takeScale: number;
  bpm: number;
  offsetSec: number;
  bodyColor: string;
  inkColor: string;
  accent: string;
  look: NibLook;
  seed: number;
  background: string;
};

const EmotionTimeline: React.FC<Props> = ({keys, showTimeline, size, takeScale, bpm, offsetSec, bodyColor, inkColor, accent, look, seed, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const ru = nibUnit(size, w, h);
  const gy = h * (showTimeline ? (portrait ? 0.7 : 0.74) : 0.84);
  const colors = nibColorsFrom({bodyColor, inkColor, accent});
  const ink = inkColor || NIB_COLORS.ink;
  const acc = accent || NIB_COLORS.accent;
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  const cur = emotionsAt(sorted, frame, fps, bpm, offsetSec, takeScale);
  // timeline strip
  const tx0 = w * 0.08;
  const tx1 = w * 0.92;
  const ty = h * (portrait ? 0.86 : 0.9);
  const X = (f: number) => tx0 + ((tx1 - tx0) * f) / durationInFrames;
  const fsz = Math.max(12 * u, 15 * u * (portrait ? 1.15 : 1));
  return (
    <AbsoluteFill>
      <Svg>
        <NibBackdrop background={background} w={w} h={h} u={u} floorY={gy + ru * 0.12} id="etl" />
        <NibFigure id="etlnib" x={w / 2} y={gy} u={ru} frame={frame} fps={fps} bpm={bpm} offsetSec={offsetSec} keys={sorted} takeScale={takeScale} seed={seed} colors={colors} look={look} />
        {showTimeline ? (
          <g>
            <text x={w / 2} y={ty - fsz * 3.2} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={fsz * 1.5} fill={ink} letterSpacing={fsz * 0.2}>
              {cur.emotion.toUpperCase()}
            </text>
            <line x1={tx0} x2={tx1} y1={ty} y2={ty} stroke={ink} strokeOpacity={0.25} strokeWidth={Math.max(1, 2 * u)} strokeLinecap="round" />
            <line x1={tx0} x2={X(frame)} y1={ty} y2={ty} stroke={ink} strokeOpacity={0.8} strokeWidth={Math.max(1, 2 * u)} strokeLinecap="round" />
            {sorted.map((k, i) => {
              const passed = frame >= k.at;
              const near = Math.exp(-Math.abs(frame - k.at) / 6);
              return (
                <g key={i}>
                  <circle cx={X(k.at)} cy={ty} r={(6 + 4 * near) * u} fill={passed ? acc : NIB_COLORS.paper} stroke={ink} strokeWidth={Math.max(1, 1.6 * u)} />
                  <text x={X(k.at)} y={ty + fsz * 1.9} textAnchor="middle" fontFamily={fonts.mono} fontSize={fsz} fill={ink} opacity={passed ? 0.9 : 0.4}>
                    {k.emotion}
                  </text>
                </g>
              );
            })}
            <path d={`M${X(frame)} ${ty - 14 * u} l${-6 * u} ${-9 * u} l${12 * u} 0 Z`} fill={ink} />
            <text x={tx1} y={ty - fsz * 1.1} textAnchor="end" fontFamily={fonts.mono} fontSize={fsz * 0.85} fill={ink} opacity={0.45}>
              {`squint ${cur.squint.toFixed(2)} · take ${(-cur.sq).toFixed(2)}`}
            </text>
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const emotionTimeline = defineMotion<Props>({
  id: 'emotion-timeline',
  title: 'Acted emotion timeline (Nib)',
  category: 'mascot',
  description:
    'Nib acts a chain of moods without ever snapping: eyes squint shut before each key, the face swaps under them, a squash-and-stretch take sized to the new mood fires, the pose overshoots into its new idle, colour and blush cross-fade and the new emote pops; an optional key strip shows the keys and playhead.',
  source: ['ClaudeAnimationBase src/clawd.js emotions() (MIT): squint .1 s / release .14 s, backOut .4 s, colour .3 s, emote .06–.32 s'],
  useFor: 'A whole reaction beat from one prop — reveals, “wait… what?… oh!” moments, onboarding hosts, explainers.',
  durationInFrames: 180,
  defaultProps: {
    keys: [
      {at: 0, emotion: 'sleepy'},
      {at: 34, emotion: 'surprised'},
      {at: 70, emotion: 'thinking'},
      {at: 108, emotion: 'idea'},
      {at: 146, emotion: 'excited'},
    ],
    showTimeline: true,
    size: 0.42,
    takeScale: 1,
    bpm: 120,
    offsetSec: 0,
    bodyColor: NIB_COLORS.body,
    inkColor: NIB_COLORS.ink,
    accent: NIB_COLORS.accent,
    look: 'ink-wash',
    seed: 1,
    background: 'paper',
  },
  propDocs: {
    keys: `mood keys [{at: frame, emotion, look?: [x,y], emote?}] — emotions: ${EMOTIONS_LIST.join(', ')}; keys closer than 12 frames are pushed apart`,
    showTimeline: 'draw the key strip, playhead and current mood name (turn off for a clean shot)',
    size: 'character height as a fraction of the frame height',
    takeScale: 'multiplies every reaction take',
    background: "'paper', 'transparent' or any colour",
    ...NIB_PROP_DOCS,
  },
  component: EmotionTimeline,
  tags: ['mascot', 'character', 'nib', 'emotion', 'acting', 'reaction', 'take', 'squash and stretch', 'timeline', 'keyframes', 'mood change', 'cartoon', 'explainer'],
});
