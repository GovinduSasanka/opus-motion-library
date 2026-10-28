import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Confetti, Pip, PipColors, PipPose, SpeechBubble, blinkAt, bubbleSize, pipLayout} from '../../core/r3-mascot';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  text: string;
  confettiColors: string[];
  confettiCount: number;
  size: number;
  speed: number;
  startAt: number;
  seed: number;
  background: string;
  bodyColor: string;
  plateColor: string;
  eyeColor: string;
  accent: string;
  bulbColor: string;
  cheekColor: string;
  bubbleColor: string;
  ink: string;
  fontFamily: string;
};

const MascotThumbsUp: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const f = Math.max(0, (frame - p.startAt) * p.speed);
  const L = pipLayout(w, h, u, portrait, p.size);
  const enter = springAt(f, fps, 0, 'pop');
  // crouch 20-30, jump 30-54, land squash 54-66
  const crouch = prog(f, 20, 30, ease.in) * (1 - prog(f, 30, 32, ease.linear));
  const air = prog(f, 30, 54, (t) => t);
  const jumpY = f >= 30 && f <= 54 ? -150 * Math.sin(air * Math.PI) : 0;
  const stretch = f >= 30 && f <= 54 ? 0.1 * Math.sin(air * Math.PI) : 0;
  const land = f > 54 ? 0.2 * Math.exp(-(f - 54) / 5) * Math.cos((f - 54) * 0.9) : 0;
  const armsUp = prog(f, 24, 40, ease.back);
  const thumbWiggle = f > 56 ? Math.sin((f - 56) * 0.35) * 5 * Math.exp(-(f - 56) / 90) : 0;
  const pose: PipPose = {
    dy: jumpY - (1 - Math.min(1, enter)) * 40,
    sx: Math.max(0.01, enter) * (1 + 0.14 * crouch - stretch * 0.6 + land),
    sy: Math.max(0.01, enter) * (1 - 0.14 * crouch + stretch - land),
    tilt: f > 56 ? Math.sin((f - 56) * 0.2) * 2 : 0,
    armR: [100 + 20 * armsUp, 175 * armsUp + 6 * (1 - armsUp) + thumbWiggle],
    handR: 'thumb',
    armL: [10 + 100 * armsUp, 4 + 150 * armsUp + (f > 56 ? Math.sin((f - 56) * 0.4) * 10 : 0)],
    handL: 'open',
    eyes: f < 20 ? 'open' : 'happy',
    mouth: f < 20 ? 'smile' : 'grin',
    blush: 1,
    bulb: 0.3 + 0.5 * prog(f, 30, 40),
    blink: f < 20 ? blinkAt(f) : 0,
    lookY: -0.3 * armsUp,
  };
  const colors: PipColors = {body: p.bodyColor, plate: p.plateColor, eye: p.eyeColor, accent: p.accent, ink: p.ink, bulb: p.bulbColor, cheek: p.cheekColor};
  const fs = (portrait ? 62 : 54) * u;
  const maxW = (portrait ? w * 0.8 : 560 * u) - fs * 1.8;
  const {bw, bh} = bubbleSize(p.text, fs, maxW);
  const bx = portrait ? w / 2 : L.x + 190 * L.sc * 0.75 + bw / 2 + 80 * u;
  const by = portrait ? L.y - 340 * L.sc - bh / 2 - 30 * u : L.y - 330 * L.sc - bh * 0.1;
  const tipX = L.x + (portrait ? 60 : 130) * L.sc;
  const tipY = L.y - (portrait ? 300 : 280) * L.sc;
  const pop = springAt(f, fps, 44, 'pop');
  const headX = L.x;
  const headY = L.y - 250 * L.sc;
  // sparkles by the thumb
  const sparks = [0, 1, 2, 3].map((i) => {
    const t = clamp((f - 52 - i * 5) / 40);
    if (t <= 0 || t >= 1) return null;
    const a = i * 1.7 + 0.5;
    const r = (60 + 90 * t) * L.sc;
    const sx = L.x + 150 * L.sc + Math.cos(a) * r;
    const sy = L.y - 250 * L.sc + Math.sin(a) * r * 0.8;
    const s = 16 * u * Math.sin(t * Math.PI) * (1 + (i % 2) * 0.5);
    return <path key={i} d={`M${sx} ${sy - s}Q${sx} ${sy} ${sx + s} ${sy}Q${sx} ${sy} ${sx} ${sy + s}Q${sx} ${sy} ${sx - s} ${sy}Q${sx} ${sy} ${sx} ${sy - s}Z`} fill={p.accent} />;
  });
  const cc = Math.round(p.confettiCount);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <circle cx={L.x} cy={L.y - 170 * L.sc} r={Math.min(w, h) * 0.42} fill={p.accent} opacity={0.08 * enter} />
        <Pip x={L.x} y={L.y} scale={L.sc} pose={pose} colors={colors} />
        {sparks}
        <SpeechBubble cx={bx} cy={by} tx={tipX} ty={tipY} text={p.text} fontSize={fs} maxW={maxW} fill={p.bubbleColor} ink={p.ink} fontFamily={p.fontFamily} pop={pop} shown={prog(f, 48, 60, ease.linear)} u={u} />
        <Confetti frame={f} start={34} x={headX} y={headY} count={cc} colors={p.confettiColors} u={u} seed={p.seed} power={1.25} life={100} spread={170} />
        <Confetti frame={f} start={36} x={w * 0.04} y={h * 0.92} count={Math.round(cc * 0.5)} colors={p.confettiColors} u={u} seed={p.seed + 1} power={1.9} angle={-58} spread={40} life={110} />
        <Confetti frame={f} start={36} x={w * 0.96} y={h * 0.92} count={Math.round(cc * 0.5)} colors={p.confettiColors} u={u} seed={p.seed + 2} power={1.9} angle={-122} spread={40} life={110} />
        <Confetti frame={f} start={62} x={headX} y={headY - 40 * u} count={Math.round(cc * 0.45)} colors={p.confettiColors} u={u} seed={p.seed + 3} power={0.9} life={80} spread={150} />
      </Svg>
    </AbsoluteFill>
  );
};

export const mascotThumbsUp = defineMotion<Props>({
  id: 'mascot-thumbs-up',
  title: 'Mascot Pip thumbs up + confetti',
  category: 'mascot',
  description: 'Pip crouches, jumps and lands with a thumbs-up while confetti cannons fire and a "nice work" bubble pops.',
  source: ['original (round 3)'],
  useFor: 'Success / completion / goal-reached states, milestone and launch celebrations, quiz-correct feedback, end cards. Change `text` and `confettiColors` to the brand.',
  durationInFrames: 150,
  defaultProps: {
    text: 'Nice work!',
    confettiColors: ['#FFB454', '#FF6B8A', '#4CC9F0', '#7BE0A1', '#FFFFFF'],
    confettiCount: 70,
    size: 1,
    speed: 1,
    startAt: 0,
    seed: 11,
    background: '#F4EFE6',
    bodyColor: '#5B7CFA',
    plateColor: '#1D2340',
    eyeColor: '#8FF0FF',
    accent: '#FFB454',
    bulbColor: '#FFD84D',
    cheekColor: '#FF8FA8',
    bubbleColor: '#FFFFFF',
    ink: '#1D2340',
    fontFamily: fonts.sans,
  },
  propDocs: {
    text: 'celebration line in the bubble',
    confettiColors: 'confetti palette (any number of colours)',
    confettiCount: 'pieces in the main burst (side cannons use half)',
    size: 'mascot scale multiplier',
    speed: 'timeline speed multiplier',
    startAt: 'frame to start at',
    seed: 'confetti pattern seed',
    background: 'background colour or "transparent"',
    bodyColor: 'body colour',
    plateColor: 'face plate colour',
    eyeColor: 'eyes + mouth colour',
    accent: 'chest light, halo, sparkles',
    bulbColor: 'antenna bulb glow colour',
    cheekColor: 'blush colour',
    bubbleColor: 'speech bubble fill',
    ink: 'speech text colour',
    fontFamily: 'CSS font-family',
  },
  component: MascotThumbsUp,
  tags: ['mascot', 'character', 'thumbs up', 'celebrate', 'confetti', 'success', 'robot', 'win', 'complete', 'jump'],
});
