import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Pip, PipColors, PipPose, blinkAt, mixHex, pipLayout} from '../../core/r3-mascot';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  idea: string;
  dots: number;
  thinkFrames: number;
  size: number;
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

const MascotThinking: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const f = Math.max(0, (frame - p.startAt) * p.speed);
  const L = pipLayout(w, h, u, portrait, p.size);
  const T = p.thinkFrames; // frame the idea lands
  const enter = springAt(f, fps, 0, 'pop');
  const idea = prog(f, T, T + 10, ease.out);
  const ideaPop = f >= T ? 0.2 * Math.exp(-(f - T) / 6) * Math.cos((f - T) * 0.9) : 0;
  const jump = f >= T && f < T + 14 ? -34 * Math.sin(((f - T) / 14) * Math.PI) : 0;
  const think = 1 - idea;
  const ponder = Math.sin(f * 0.09);
  // hand beside the head while thinking, then both arms open
  const chin: [number, number] = [75 + 3 * ponder, -150];
  const pose: PipPose = {
    dy: jump - (1 - Math.min(1, enter)) * 40,
    sx: Math.max(0.01, enter) * (1 + ideaPop),
    sy: Math.max(0.01, enter) * (1 - ideaPop),
    tilt: think * (5 + 1.5 * ponder) + idea * -2,
    armR: [chin[0] * (1 - idea) + 50 * idea, chin[1] * (1 - idea) + 120 * idea],
    handR: 'fist',
    armL: [10 + idea * 70, 4 + idea * 70],
    handL: 'open',
    eyes: idea > 0.5 ? 'wide' : 'open',
    lookX: think * (0.9 + 0.2 * ponder),
    lookY: think * -0.9,
    mouth: idea > 0.5 ? 'open' : 'hmm',
    brow: idea > 0.5 ? 2 : 1,
    blush: 0.4 + 0.5 * idea,
    bulb: idea > 0.01 ? 1 : 0.05,
    blink: think > 0.5 ? blinkAt(f, 110, 30) : 0,
  };
  const colors: PipColors = {body: p.bodyColor, plate: p.plateColor, eye: p.eyeColor, accent: p.accent, ink: p.ink, bulb: p.bulbColor, cheek: p.cheekColor};

  // thought bubble: three trail puffs -> cloud
  const R = (portrait ? 230 : 190) * u;
  const cxC = portrait ? w / 2 : L.x + 560 * u;
  const cyC = portrait ? L.y - 340 * L.sc - R * 1.15 - 80 * u : h * 0.3;
  const hx = L.x + (portrait ? 60 : 100) * L.sc;
  const hy = L.y - 280 * L.sc;
  const trail = [0.28, 0.5, 0.72].map((t, i) => {
    const q = springAt(f, fps, 12 + i * 5, 'pop');
    return <circle key={i} cx={hx + (cxC - R * 0.8 - hx) * t} cy={hy + (cyC + R * 0.7 - hy) * t} r={(10 + i * 8) * u * Math.max(0, q)} fill={p.bubbleColor} stroke={p.accent} strokeWidth={0} opacity={0.98} />;
  });
  const cloudQ = springAt(f, fps, 30, 'pop');
  const blobs: [number, number, number][] = [[-0.85, 0.12, 0.5], [-0.45, -0.38, 0.58], [0.15, -0.46, 0.62], [0.72, -0.2, 0.55], [0.9, 0.22, 0.46], [0.4, 0.42, 0.52], [-0.25, 0.44, 0.5]];
  const cloud = (
    <g transform={`translate(${cxC} ${cyC}) scale(${Math.max(0.001, cloudQ) * (1 + 0.04 * idea)})`}>
      <g fill={mixHex(p.bubbleColor, p.bulbColor, 0.25 * idea)}>
        {blobs.map((b, i) => (
          <circle key={i} cx={b[0] * R} cy={b[1] * R} r={b[2] * R} />
        ))}
        <ellipse cx={0} cy={0} rx={R * 0.95} ry={R * 0.5} />
      </g>
      {/* thinking dots */}
      <g opacity={think}>
        {Array.from({length: Math.max(1, p.dots)}, (_, i) => {
          const n = Math.max(1, p.dots);
          const cx = (i - (n - 1) / 2) * R * 0.38;
          const t = Math.sin(f * 0.22 - i * 0.9);
          return <circle key={i} cx={cx} cy={-t * R * 0.07} r={R * 0.1 * (1 + 0.25 * Math.max(0, t))} fill={p.ink} opacity={0.35 + 0.65 * Math.max(0, t * 0.5 + 0.5)} />;
        })}
      </g>
      {/* idea bulb */}
      <g opacity={idea} transform={`scale(${0.5 + 0.5 * idea})`}>
        {Array.from({length: 10}, (_, k) => {
          const a = (k / 10) * Math.PI * 2 + 0.3;
          const flick = 0.75 + 0.25 * Math.sin(f * 0.5 + k);
          return <path key={k} d={`M${Math.cos(a) * R * 0.42} ${-R * 0.1 + Math.sin(a) * R * 0.42}L${Math.cos(a) * R * 0.58 * flick} ${-R * 0.1 + Math.sin(a) * R * 0.58 * flick}`} stroke={p.accent} strokeWidth={7 * u} strokeLinecap="round" />;
        })}
        <circle cx={0} cy={-R * 0.1} r={R * 0.3} fill={p.bulbColor} stroke={p.ink} strokeWidth={5 * u} />
        <path d={`M${-R * 0.1} ${R * 0.14}h${R * 0.2}v${R * 0.1}h${-R * 0.2}Z`} fill={p.ink} opacity={0.85} />
        <path d={`M${-R * 0.08} ${R * 0.05}Q0 ${-R * 0.12} ${R * 0.08} ${R * 0.05}`} fill="none" stroke={p.ink} strokeWidth={4 * u} opacity={0.55} />
        <text y={R * 0.02} textAnchor="middle" fontSize={0} fill="none" />
      </g>
    </g>
  );
  const labelIn = prog(f, T + 6, T + 22, ease.back);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <circle cx={L.x} cy={L.y - 170 * L.sc} r={Math.min(w, h) * 0.42} fill={p.accent} opacity={0.08 * enter} />
        <Pip x={L.x} y={L.y} scale={L.sc} pose={pose} colors={colors} />
        {trail}
        {cloud}
        {p.idea ? (
          <g transform={`translate(${cxC} ${cyC + R * 0.98 + 36 * u}) scale(${Math.max(0.001, labelIn)})`} fontFamily={p.fontFamily}>
            <rect x={-(p.idea.length * 15 + 44) * u} y={-34 * u} width={(p.idea.length * 30 + 88) * u} height={68 * u} rx={34 * u} fill={p.accent} />
            <text y={14 * u} textAnchor="middle" fontSize={44 * u} fontWeight={800} fill={mixHex(p.accent, '#000000', 0.78)}>{p.idea}</text>
          </g>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const mascotThinking = defineMotion<Props>({
  id: 'mascot-thinking',
  title: 'Mascot Pip thinking to idea',
  category: 'mascot',
  description: 'Pip ponders with a hand by its head while a thought bubble of pulsing dots grows, then the dots flip to a glowing light bulb, the antenna lights and Pip hops.',
  source: ['original (round 3)'],
  useFor: 'Loading / "thinking" states, problem-then-solution beats, "what if..." questions, AI-assistant processing screens, aha moments. Set `idea` to the punchline word.',
  durationInFrames: 180,
  defaultProps: {
    idea: 'Idea!',
    dots: 3,
    thinkFrames: 96,
    size: 1,
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
    idea: 'label shown with the bulb ("" to hide)',
    dots: 'number of thinking dots',
    thinkFrames: 'frame the idea lights up (length of the thinking phase)',
    size: 'mascot scale multiplier',
    speed: 'timeline speed multiplier',
    startAt: 'frame to start at',
    background: 'background colour or "transparent"',
    bodyColor: 'body colour',
    plateColor: 'face plate colour',
    eyeColor: 'eyes + mouth colour',
    accent: 'chest light, halo, idea label',
    bulbColor: 'bulb colour',
    cheekColor: 'blush colour',
    bubbleColor: 'thought cloud fill',
    ink: 'dots / bulb outline colour',
    fontFamily: 'CSS font-family',
  },
  component: MascotThinking,
  tags: ['mascot', 'character', 'thinking', 'idea', 'light bulb', 'thought bubble', 'robot', 'loading', 'aha', 'question'],
});
