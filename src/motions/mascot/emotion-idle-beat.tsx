// Adapted from ClaudeAnimationBase/src/clawd.js EMO[*].body (beat-locked idles) (MIT, © 2026 John Heibel) — see THIRD_PARTY_NOTICES.md
// Character design is original ("Nib").
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {EMOTIONS_LIST, NIB_COLORS, NIB_PROP_DOCS, NibBackdrop, NibFigure, NibLook, backOut, nibColorsFrom} from '../../core/r2-mascot-kit';
import {mixHex} from '../../core/character-kit';

type Props = {
  emotions: string[];
  colors: string[];
  labels: boolean;
  metronome: boolean;
  bpm: number;
  offsetSec: number;
  inkColor: string;
  accent: string;
  look: NibLook;
  background: string;
};

const EmotionIdleBeat: React.FC<Props> = ({emotions, colors, labels, metronome, bpm, offsetSec, inkColor, accent, look, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const list = emotions.length ? emotions : ['happy', 'cry', 'cool', 'furious', 'sleepy'];
  const n = list.length;
  const cols = portrait ? Math.min(3, n) : n;
  const rows = Math.ceil(n / cols);
  const ink = inkColor || NIB_COLORS.ink;
  const acc = accent || NIB_COLORS.accent;
  const areaTop = h * (portrait ? 0.12 : 0.1);
  const areaBot = h * (metronome ? 0.8 : 0.9);
  const rowH = (areaBot - areaTop) / rows;
  const ru = Math.min(w / cols / 12, rowH / (labels ? 14 : 12));
  const beatSec = 60 / bpm;
  const bp = (frame / fps - offsetSec) / beatSec;
  const bi = Math.floor(bp);
  const hit = Math.exp(-6 * (bp - bi));
  const fsz = Math.max(13 * u, ru * 1.3);
  return (
    <AbsoluteFill>
      <Svg>
        <NibBackdrop background={background} w={w} h={h} u={u} id="eib" />
        {list.map((e, i) => {
          const r = Math.floor(i / cols);
          const inRow = Math.min(cols, n - r * cols);
          const c = i - r * cols;
          const cx = (w / inRow) * (c + 0.5);
          const gy = areaTop + rowH * (r + (labels ? 0.8 : 0.88));
          const body = colors[i % Math.max(1, colors.length)] || NIB_COLORS.body;
          const k = backOut((frame - i * 4) / 14, 2);
          return (
            <g key={i} transform={`translate(${cx} ${gy}) scale(${Math.max(0.001, k)}) translate(${-cx} ${-gy})`}>
              <ellipse cx={cx} cy={gy + ru * 0.2} rx={ru * 4.2} ry={ru * 0.8} fill={acc} opacity={0.12 + 0.25 * hit} />
              <NibFigure id={`eib${i}`} x={cx} y={gy} u={ru} frame={frame} fps={fps} bpm={bpm} offsetSec={offsetSec} emotion={e} seed={i * 3 + 1} colors={nibColorsFrom({bodyColor: body, shadeColor: mixHex(body, '#101030', 0.32), inkColor: ink, accent: acc})} look={look} />
              {labels ? (
                <text x={cx} y={gy + ru * 2.6} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={fsz} fill={ink} letterSpacing={fsz * 0.12}>
                  {e.toUpperCase()}
                </text>
              ) : null}
            </g>
          );
        })}
        {metronome ? (
          <g>
            {Array.from({length: 4}, (_, j) => {
              const on = ((bi % 4) + 4) % 4 === j;
              const x = w / 2 + (j - 1.5) * 34 * u * (portrait ? 1.3 : 1);
              return <circle key={j} cx={x} cy={h * 0.89} r={(8 + (on ? 6 * hit : 0)) * u * (portrait ? 1.3 : 1)} fill={on ? acc : 'none'} stroke={ink} strokeWidth={Math.max(1, 1.8 * u)} />;
            })}
            <text x={w / 2} y={h * 0.89 + 40 * u * (portrait ? 1.3 : 1)} textAnchor="middle" fontFamily={fonts.mono} fontSize={fsz * 0.85} fill={ink} opacity={0.55} letterSpacing={2}>
              {`${Math.round(bpm)} BPM · BEAT ${((bi % 4) + 4) % 4 + 1}`}
            </text>
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const emotionIdleBeat = defineMotion<Props>({
  id: 'emotion-idle-beat',
  title: 'Emotion idles on the beat (Nib line-up)',
  category: 'mascot',
  description:
    'A line-up of Nib mascots, each in a different mood, each moving with its own body language (bounce, sob per beat, cool nod, furious tremble, slow sleepy breath) locked to one tempo, over beat-pulsing floor spots and a four-dot metronome.',
  source: ['ClaudeAnimationBase src/clawd.js EMO[*].body + _b() beat helpers (MIT); character original'],
  useFor: 'Keep characters alive on long holds in sync with the host’s music; compare moods; a playful “how are you feeling?” beat or poll result.',
  durationInFrames: 150,
  defaultProps: {
    emotions: ['happy', 'cry', 'cool', 'furious', 'sleepy'],
    colors: ['#3F63C9', '#3A9C98', '#7B5CA8', '#D9614C', '#E0A23A'],
    labels: true,
    metronome: true,
    bpm: 120,
    offsetSec: 0,
    inkColor: NIB_COLORS.ink,
    accent: NIB_COLORS.accent,
    look: 'ink-wash',
    background: 'paper',
  },
  propDocs: {
    emotions: `moods in the line-up (any of ${EMOTIONS_LIST.join(', ')})`,
    colors: 'body colour per character (cycles)',
    labels: 'print each mood name',
    metronome: 'show the 4-beat metronome + BPM readout',
    background: "'paper', 'transparent' or any colour",
    ...NIB_PROP_DOCS,
  },
  component: EmotionIdleBeat,
  tags: ['mascot', 'character', 'nib', 'idle', 'beat', 'bpm', 'music', 'line-up', 'crowd', 'emotions', 'body language', 'loop', 'metronome'],
});
