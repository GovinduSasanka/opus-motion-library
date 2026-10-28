// Adapted from ClaudeAnimationBase/src/clawd.js feel()/emotions()/move() + src/core.js (MIT, © 2026 John Heibel) — see THIRD_PARTY_NOTICES.md
// Character design is original ("Nib", the library's ink-drop mascot).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  DancePose,
  EMOTIONS_LIST,
  EmotionKey,
  HatKind,
  NIB_COLORS,
  NIB_PROP_DOCS,
  NibAction,
  NibBackdrop,
  NibFigure,
  NibLook,
  NibView,
  backOut,
  compileNibScript,
  nibColorsFrom,
  nibUnit,
} from '../../core/r2-mascot-kit';

type Props = {
  emotion: string;
  emotions: EmotionKey[];
  script: NibAction[];
  x: number;
  y: number;
  size: number;
  view: NibView;
  flip: boolean;
  dance: string;
  hat: string;
  entrance: 'drop' | 'pop' | 'none';
  bpm: number;
  offsetSec: number;
  bodyColor: string;
  shadeColor: string;
  lightColor: string;
  inkColor: string;
  accent: string;
  cheekColor: string;
  look: NibLook;
  onTwos: boolean;
  takeScale: number;
  seed: number;
  background: string;
};

const MascotNib: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const ru = nibUnit(p.size, w, h);
  const comp = React.useMemo(
    () => (p.script.length ? compileNibScript(p.script, {startX: p.x, fps, bpm: p.bpm, widthPx: w, u: ru, baseEmotion: p.emotion, startView: p.view}) : null),
    [JSON.stringify(p.script), p.x, fps, p.bpm, w, ru, p.emotion, p.view],
  );
  const keys: EmotionKey[] = [...(comp ? comp.keys : [{at: 0, emotion: p.emotion}]), ...p.emotions].sort((a, b) => a.at - b.at);
  const xFrac = comp ? comp.xAt(frame) : p.x;
  const dance = comp ? comp.danceAt(frame) || p.dance : p.dance;
  const entrance = (fr: number): Partial<DancePose> | null => {
    if (p.entrance === 'drop') {
      const land = 14;
      if (fr < land) {
        const k = fr / land;
        return {dy: -16 * (1 - k * k), sq: -0.14, aL: 1.1, aR: 1.1};
      }
      const a = (fr - land) / fps;
      return {sq: 0.24 * Math.exp(-8 * a) * Math.cos(20 * a)};
    }
    return null;
  };
  const extra = (fr: number) => {
    const e = entrance(fr);
    const s = comp ? comp.extra(fr) : null;
    if (!e) return s;
    if (!s) return e;
    return {...s, ...e, dy: (s.dy ?? 0) + (e.dy ?? 0), sq: (s.sq ?? 0) + (e.sq ?? 0)};
  };
  const pop = p.entrance === 'pop' ? Math.max(0.001, backOut(frame / 12, 2.2)) : 1;
  const gx = xFrac * w;
  const gy = p.y * h;
  const colors = nibColorsFrom(p);
  return (
    <AbsoluteFill>
      <Svg>
        <NibBackdrop background={p.background} w={w} h={h} u={u} floorY={gy + ru * 0.12} id="mnib" />
        <g transform={`translate(${gx} ${gy}) scale(${pop}) translate(${-gx} ${-gy})`}>
          <NibFigure
            id="mnibfig"
            x={gx}
            y={gy}
            u={ru}
            frame={frame}
            fps={fps}
            bpm={p.bpm}
            offsetSec={p.offsetSec}
            keys={keys}
            dance={dance}
            seed={p.seed}
            view={p.view}
            flip={p.flip}
            hat={(p.hat || '') as HatKind}
            takeScale={p.takeScale}
            colors={colors}
            look={p.look}
            onTwos={p.onTwos}
            extra={extra}
          />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const mascotNib = defineMotion<Props>({
  id: 'mascot-nib',
  title: 'Mascot Nib (31 emotions)',
  category: 'mascot',
  description:
    'Nib, the library’s hand-inked ink-drop mascot with a springy curl, round eyes, brows and noodle arms, drops in and stays alive in any of 31 named emotions (face, colour shift, emote mark and its own beat-locked body language); can follow an action script (walk, run, hop, jump, feel, turn, dance, take, wave, look, emote).',
  source: ['ClaudeAnimationBase src/clawd.js EMO/feel/emotions/move + src/core.js take/jump (MIT); character original'],
  useFor: 'Explainer host, onboarding/empty/error/success states, reaction shots, end cards — pick a mood by name (`emotion`) or act a sequence (`script`, `emotions`).',
  durationInFrames: 150,
  defaultProps: {
    emotion: 'happy',
    emotions: [],
    script: [],
    x: 0.5,
    y: 0.84,
    size: 0.5,
    view: 'front',
    flip: false,
    dance: '',
    hat: '',
    entrance: 'drop',
    bpm: 120,
    offsetSec: 0,
    bodyColor: NIB_COLORS.body,
    shadeColor: NIB_COLORS.shade,
    lightColor: NIB_COLORS.light,
    inkColor: NIB_COLORS.ink,
    accent: NIB_COLORS.accent,
    cheekColor: NIB_COLORS.cheek,
    look: 'ink-wash',
    onTwos: false,
    takeScale: 1,
    seed: 1,
    background: 'paper',
  },
  propDocs: {
    emotion: `starting mood: ${EMOTIONS_LIST.join(' | ')}`,
    emotions: 'acted mood changes [{at: frame, emotion, look?: [x,y], emote?}] (blink-swap, take, overshoot, colour fade)',
    script:
      "actions in order: {action:'walk'|'run', to?: 0..1, dx?, frames?} {action:'hop'|'jump', to?, dx?, height?} {action:'feel', emotion} {action:'turn', view:'front'|'q'|'side'|'qback'|'back'} {action:'dance', style, beats} {action:'take', size} {action:'wave'} {action:'look', dir} {action:'emote', emote} {action:'idle', frames}",
    x: 'ground point x (0..1 of width)',
    y: 'ground line y (0..1 of height)',
    size: 'character height as a fraction of the frame height (0.42 = medium shot)',
    view: "drawn key view: 'front' | 'q' (3/4) | 'side' | 'qback' | 'back'",
    flip: 'mirror (face left)',
    dance: "beat dance: '' | bounce | hop | roof | sway | spin | wave | walk | run | idle | stomp | shimmy | mix",
    hat: "'' | party | crown | top | beanie | headphones | halo | wizard | bow | flower | cap",
    entrance: "'drop' (falls in and squashes), 'pop' (scales in) or 'none'",
    onTwos: 'hold each drawing two frames (hand-drawn timing)',
    takeScale: 'multiplies every reaction take (0 = no squash/stretch takes)',
    background: "'paper', 'transparent' (overlay on your scene) or any colour",
    ...NIB_PROP_DOCS,
  },
  component: MascotNib,
  tags: ['mascot', 'character', 'nib', 'ink drop', 'emotions', 'expressions', 'reaction', 'cute', 'cartoon', 'host', 'onboarding', 'empty state', 'success', 'error', 'beat', 'dance', 'acting', 'overlay', 'brand mascot'],
});
