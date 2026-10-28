// Adapted from ClaudeAnimationBase/src/clawd.js smearTrail() + core.js stroll() (MIT, © 2026 John Heibel) — see THIRD_PARTY_NOTICES.md
// Character design is original ("Nib").
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {NIB_COLORS, NIB_PROP_DOCS, NibAction, NibBackdrop, NibFigure, NibLook, compileNibScript, hashN, nibColorsFrom, nibUnit} from '../../core/r2-mascot-kit';

type Props = {
  dashIn: number;
  dashOut: number;
  stopAt: number;
  emotion: string;
  speedLines: boolean;
  dust: boolean;
  size: number;
  bodyColor: string;
  inkColor: string;
  accent: string;
  look: NibLook;
  background: string;
};

const SmearTrail: React.FC<Props> = ({dashIn, dashOut, stopAt, emotion, speedLines, dust, size, bodyColor, inkColor, accent, look, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const ru = nibUnit(size, w, h);
  const gy = h * 0.8;
  const script: NibAction[] = React.useMemo(
    () => [
      {action: 'idle', frames: 6},
      {action: 'run', to: stopAt, frames: dashIn},
      {action: 'take', size: 0.9, frames: 20},
      {action: 'feel', emotion: 'surprised', frames: 26},
      {action: 'look', dir: 1, frames: 14},
      {action: 'feel', emotion, frames: 14},
      {action: 'run', to: 1.3, frames: dashOut},
      {action: 'idle', frames: 8},
    ],
    [dashIn, dashOut, stopAt, emotion],
  );
  const comp = React.useMemo(() => compileNibScript(script, {startX: -0.2, fps, bpm: 120, widthPx: w, u: ru, baseEmotion: 'determined'}), [script, fps, w, ru]);
  const x = comp.xAt(frame) * w;
  const vx = (comp.xAt(frame + 1) - comp.xAt(frame - 1)) * 0.5 * w;
  const speed = Math.abs(vx) / ru;
  const ink = inkColor || NIB_COLORS.ink;
  const stopF = 6 + dashIn;
  const dustAge = (frame - stopF) / fps;
  const colors = nibColorsFrom({bodyColor, inkColor, accent});
  return (
    <AbsoluteFill>
      <Svg>
        <NibBackdrop background={background} w={w} h={h} u={u} floorY={gy + ru * 0.12} id="smt" />
        {speedLines && speed > 0.4
          ? Array.from({length: 7}, (_, i) => {
              const len = (4 + 6 * hashN(i, 3)) * ru * Math.min(1, speed / 1.2);
              const yy = gy - ru * (1.2 + i * 1.25) + (hashN(i, Math.floor(frame / 2)) - 0.5) * ru * 0.4;
              const dir = Math.sign(vx);
              const x0 = x - dir * ru * (4 + hashN(i, 9) * 2);
              return <line key={i} x1={x0} x2={x0 - dir * len} y1={yy} y2={yy} stroke={ink} strokeWidth={Math.max(1, ru * 0.08)} strokeLinecap="round" opacity={0.55} />;
            })
          : null}
        {dust && dustAge > -0.05 && dustAge < 0.9
          ? Array.from({length: 6}, (_, i) => {
              const a = Math.max(0, dustAge);
              const dir = i % 2 ? -1 : 1;
              const r = ru * (0.5 + a * 2.2) * (0.7 + 0.5 * hashN(i));
              return <circle key={i} cx={x - ru * 2.5 + dir * a * ru * (2 + i)} cy={gy - r * 0.6 - a * ru * (0.5 + i * 0.2)} r={r} fill={NIB_COLORS.cream} stroke={ink} strokeWidth={Math.max(1, ru * 0.08)} opacity={Math.max(0, 1 - a / 0.9)} />;
            })
          : null}
        <NibFigure id="smtnib" x={x} y={gy} u={ru} frame={frame} fps={fps} keys={comp.keys} seed={2} colors={colors} look={look} extra={comp.extra} />
      </Svg>
    </AbsoluteFill>
  );
};

export const smearTrail = defineMotion<Props>({
  id: 'smear-trail',
  title: 'Smear trail dash (Nib)',
  category: 'mascot',
  description:
    'Nib dashes in so fast the drawing smears: the body stretches wide, dry-brush streaks of its own colour and thin ink speed lines trail behind, the eyes collapse to dashes; it skids to a stop in a dust puff, does a take, then zips off the other side.',
  source: ['ClaudeAnimationBase src/clawd.js smearTrail() (MIT): 4 streaks 1.5u apart, length (3–6)u·k, body widens k·.35'],
  useFor: 'Fast entrances/exits, whooshes and dashes that read on twos; a cartoon “zoom in, zoom out” beat. Transparent background overlays it on any scene.',
  durationInFrames: 110,
  defaultProps: {
    dashIn: 14,
    dashOut: 11,
    stopAt: 0.5,
    emotion: 'excited',
    speedLines: true,
    dust: true,
    size: 0.42,
    bodyColor: NIB_COLORS.body,
    inkColor: NIB_COLORS.ink,
    accent: NIB_COLORS.accent,
    look: 'ink-wash',
    background: 'paper',
  },
  propDocs: {
    dashIn: 'frames for the dash in (fewer = faster, more smear)',
    dashOut: 'frames for the exit dash',
    stopAt: 'where it skids to a stop (0..1 of width)',
    emotion: 'mood after the surprise take, before it zips off',
    speedLines: 'ink speed lines while moving fast',
    dust: 'dust puff on the skid',
    size: 'character height as a fraction of the frame height',
    background: "'paper', 'transparent' (overlay) or any colour",
    ...NIB_PROP_DOCS,
  },
  component: SmearTrail,
  tags: ['smear', 'smear frame', 'speed lines', 'dash', 'whoosh', 'cartoon', 'mascot', 'nib', 'character', 'entrance', 'exit', 'dust', 'skid', 'animation principles', 'overlay'],
});
