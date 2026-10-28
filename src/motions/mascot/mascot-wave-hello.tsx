import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Pip, PipColors, PipPose, SpeechBubble, blinkAt, bubbleSize, pipLayout, shade} from '../../core/r3-mascot';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  text: string;
  name: string;
  hand: 'right' | 'left';
  size: number;
  waveSpeed: number;
  speed: number;
  startAt: number;
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

const MascotWaveHello: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const f = Math.max(0, (frame - p.startAt) * p.speed);
  const L = pipLayout(w, h, u, portrait, p.size);
  const enter = springAt(f, fps, 0, 'pop');
  const waveOn = prog(f, 14, 26, ease.out);
  const sw = Math.sin(f * 0.4 * p.waveSpeed);
  const wave: [number, number] = [132 + 6 * sw * waveOn, 168 + 30 * sw * waveOn];
  const rest: [number, number] = [10, 4];
  const lerpA = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const raised = lerpA(rest, wave, waveOn);
  const bob = -4 * Math.abs(Math.sin(f * 0.2 * p.waveSpeed)) * waveOn;
  const squashIn = f < 22 ? 0.18 * Math.exp(-(f / 6)) * Math.cos(f * 0.9) : 0;
  const pose: PipPose = {
    dy: bob - (1 - Math.min(1, enter)) * 40,
    sx: Math.max(0.01, enter) * (1 + squashIn),
    sy: Math.max(0.01, enter) * (1 - squashIn),
    tilt: Math.sin(f * 0.1 * p.waveSpeed) * 2 * waveOn,
    armR: p.hand === 'right' ? raised : rest,
    armL: p.hand === 'left' ? raised : rest,
    handR: p.hand === 'right' ? 'open' : 'fist',
    handL: p.hand === 'left' ? 'open' : 'fist',
    eyes: f > 40 && Math.sin(f * 0.05) > -0.6 ? 'happy' : 'open',
    lookX: 0.3 * Math.sin(f * 0.07),
    mouth: f < 12 ? 'smile' : 'grin',
    blush: 0.7,
    bulb: 0.25 + 0.15 * Math.sin(f * 0.15),
    blink: blinkAt(f),
  };
  const colors: PipColors = {body: p.bodyColor, plate: p.plateColor, eye: p.eyeColor, accent: p.accent, ink: p.ink, bulb: p.bulbColor, cheek: p.cheekColor};
  const fs = (portrait ? 54 : 46) * u;
  const maxW = (portrait ? w * 0.78 : 560 * u) - fs * 1.8;
  const {bw, bh} = bubbleSize(p.text, fs, maxW);
  const bx = portrait ? w / 2 : L.x + 150 * L.sc * 0.6 + bw / 2 + 40 * u;
  const by = portrait ? L.y - 330 * L.sc - bh / 2 - 20 * u : L.y - 300 * L.sc - bh * 0.1;
  const tipX = L.x + (portrait ? 40 : 90) * L.sc;
  const tipY = L.y - (portrait ? 300 : 250) * L.sc;
  const pop = springAt(f, fps, 16, 'pop');
  const typed = prog(f, 20, 20 + Math.max(8, p.text.length * 1.4), ease.linear);
  const tagIn = prog(f, 10, 28, ease.out);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <circle cx={L.x} cy={L.y - 170 * L.sc} r={Math.min(w, h) * 0.42} fill={p.accent} opacity={0.08 * enter} />
        <Pip x={L.x} y={L.y} scale={L.sc} pose={pose} colors={colors} />
        {p.name ? (
          <g opacity={tagIn} transform={`translate(${L.x} ${L.y + 52 * u})`} fontFamily={p.fontFamily}>
            <rect x={-(p.name.length * 13 + 30) * u} y={-26 * u} width={(p.name.length * 26 + 60) * u} height={50 * u} rx={25 * u} fill={p.accent} />
            <text y={9 * u} textAnchor="middle" fontSize={28 * u} fontWeight={800} fill={shade(p.accent, -0.78)} letterSpacing={2 * u}>{p.name}</text>
          </g>
        ) : null}
        <SpeechBubble cx={bx} cy={by} tx={tipX} ty={tipY} text={p.text} fontSize={fs} maxW={maxW} fill={p.bubbleColor} ink={p.ink} fontFamily={p.fontFamily} pop={pop} shown={typed} u={u} />
      </Svg>
    </AbsoluteFill>
  );
};

export const mascotWaveHello = defineMotion<Props>({
  id: 'mascot-wave-hello',
  title: 'Mascot Pip waves hello',
  category: 'mascot',
  description: 'An original capsule-robot mascot (Pip) pops in, waves, blinks and says a typed line in a speech bubble.',
  source: ['original (round 3)'],
  useFor: 'Welcome / onboarding / intro beats, chat-widget greetings, "hi, I am your guide" cold opens, sign-off waves. Change `text` and the colour props to match a brand.',
  durationInFrames: 150,
  defaultProps: {
    text: 'Hello there! Welcome aboard.',
    name: 'PIP',
    hand: 'right',
    size: 1,
    waveSpeed: 1,
    speed: 1,
    startAt: 0,
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
    text: 'the speech bubble line',
    name: 'name tag under the feet ("" to hide)',
    hand: 'which arm waves: "right" or "left"',
    size: 'mascot scale multiplier',
    waveSpeed: 'wave tempo multiplier',
    speed: 'timeline speed multiplier',
    startAt: 'frame to start at',
    background: 'background colour or "transparent"',
    bodyColor: 'body colour',
    plateColor: 'face plate colour',
    eyeColor: 'eyes + mouth colour',
    accent: 'chest light, name tag, soft halo',
    bulbColor: 'antenna bulb glow colour',
    cheekColor: 'blush colour',
    bubbleColor: 'speech bubble fill',
    ink: 'speech text colour',
    fontFamily: 'CSS font-family',
  },
  component: MascotWaveHello,
  tags: ['mascot', 'character', 'wave', 'hello', 'greeting', 'welcome', 'robot', 'onboarding', 'speech bubble', 'intro'],
});
