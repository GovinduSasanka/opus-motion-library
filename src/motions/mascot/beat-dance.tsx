// Adapted from ClaudeAnimationBase/src/clawd.js move()/dancer() (MIT, © 2026 John Heibel) — see THIRD_PARTY_NOTICES.md
// Character design is original ("Nib").
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {DANCE_STYLES, HatKind, NIB_COLORS, NIB_PROP_DOCS, NibBackdrop, NibFigure, NibLook, nibColorsFrom, nibUnit} from '../../core/r2-mascot-kit';
import {mixHex} from '../../core/character-kit';

type Props = {
  dance: string;
  emotion: string;
  crew: number;
  crewColors: string[];
  hats: string[];
  bpm: number;
  offsetSec: number;
  spotlight: boolean;
  showStyle: boolean;
  size: number;
  bodyColor: string;
  inkColor: string;
  accent: string;
  look: NibLook;
  background: string;
};

const MIX = ['bounce', 'roof', 'sway', 'spin', 'hop', 'wave', 'shimmy', 'stomp'];

const BeatDance: React.FC<Props> = ({dance, emotion, crew, crewColors, hats, bpm, offsetSec, spotlight, showStyle, size, bodyColor, inkColor, accent, look, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const ru = nibUnit(size, w, h);
  const gy = h * 0.82;
  const t = frame / fps;
  const bp = (t - offsetSec) / (60 / bpm);
  const hit = Math.exp(-6 * (bp - Math.floor(bp)));
  const ink = inkColor || NIB_COLORS.ink;
  const acc = accent || NIB_COLORS.accent;
  const n = Math.max(0, Math.min(6, Math.round(crew)));
  const members = [{x: 0.5, s: 1, seed: 0, color: bodyColor || NIB_COLORS.body, hat: hats[0] ?? ''}];
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const rank = Math.floor(i / 2) + 1;
    members.push({x: 0.5 + side * rank * (portrait ? 0.27 : 0.2), s: 0.72 - 0.08 * (rank - 1), seed: i + 1, color: crewColors[i % Math.max(1, crewColors.length)] || NIB_COLORS.body, hat: hats[i + 1] ?? ''});
  }
  // draw back row first
  const order = members.map((m, i) => ({...m, i})).sort((a, b) => a.s - b.s);
  const curStyle = dance === 'mix' ? MIX[(Math.floor(Math.max(0, bp) / 8) % MIX.length + MIX.length) % MIX.length] : dance;
  return (
    <AbsoluteFill>
      <Svg>
        <NibBackdrop background={background} w={w} h={h} u={u} floorY={gy + ru * 0.12} id="bdn" />
        {spotlight ? (
          <g>
            <defs>
              <radialGradient id="bdnspot">
                <stop offset="0" stopColor={acc} stopOpacity={0.55} />
                <stop offset="1" stopColor={acc} stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse cx={w / 2} cy={gy} rx={ru * (6 + 1.2 * hit)} ry={ru * (1.3 + 0.3 * hit)} fill="url(#bdnspot)" />
            <path d={`M${w / 2 - ru * 2} 0 L${w / 2 + ru * 2} 0 L${w / 2 + ru * 6.5} ${gy} L${w / 2 - ru * 6.5} ${gy} Z`} fill={acc} opacity={0.06 + 0.06 * hit} />
          </g>
        ) : null}
        {order.map((m) => {
          const uu = ru * m.s;
          const yy = gy - (1 - m.s) * ru * 2.2;
          const c = m.color;
          return (
            <NibFigure
              key={m.i}
              id={`bdn${m.i}`}
              x={w * m.x}
              y={yy}
              u={uu}
              frame={frame}
              fps={fps}
              bpm={bpm}
              offsetSec={offsetSec + m.seed * 0.03}
              emotion={emotion}
              dance={dance}
              seed={m.seed * 2}
              hat={m.hat as HatKind}
              colors={nibColorsFrom({bodyColor: c, shadeColor: mixHex(c, '#101030', 0.32), inkColor: ink, accent: acc})}
              look={look}
            />
          );
        })}
        {showStyle ? (
          <text x={w / 2} y={h * 0.95} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={16 * u * (portrait ? 1.2 : 1)} fill={ink} opacity={0.55} letterSpacing={3}>
            {`${curStyle.toUpperCase()} · ${Math.round(bpm)} BPM`}
          </text>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const beatDance = defineMotion<Props>({
  id: 'beat-dance',
  title: 'Beat dance (Nib + crew)',
  category: 'mascot',
  description:
    'Nib dances on the music under a pulsing spotlight — bounce, hop, raise-the-roof, sway, a drawn spin through its key views on beat 4, wave, walk, run, stomp, shimmy or a mix that changes every two bars — with an optional back-up crew offset so nobody twins.',
  source: ['ClaudeAnimationBase src/clawd.js move()/dancer() (MIT): dy = −|sin(π·beat)|·A, squash = max(0, 1 − 3.5·frac)·k'],
  useFor: 'Music videos, celebration / success states, party end cards, “we shipped it” moments synced to the host’s tempo.',
  durationInFrames: 240,
  defaultProps: {
    dance: 'mix',
    emotion: 'happy',
    crew: 2,
    crewColors: ['#3A9C98', '#D9614C', '#7B5CA8', '#E0A23A'],
    hats: ['', 'party', 'party'],
    bpm: 120,
    offsetSec: 0,
    spotlight: true,
    showStyle: false,
    size: 0.4,
    bodyColor: NIB_COLORS.body,
    inkColor: NIB_COLORS.ink,
    accent: NIB_COLORS.accent,
    look: 'ink-wash',
    background: 'paper',
  },
  propDocs: {
    dance: `dance style: ${DANCE_STYLES.join(' | ')}`,
    emotion: 'face/mood while dancing (happy, cool, excited, starstruck…)',
    crew: 'back-up dancers (0–6), each with its own seed and phase',
    crewColors: 'body colours of the crew',
    hats: "hat per dancer (lead first): '' | party | crown | top | beanie | headphones | halo | wizard | bow | flower | cap",
    spotlight: 'beat-pulsing spotlight on the lead',
    showStyle: 'print the current dance style + BPM',
    size: 'lead height as a fraction of the frame height',
    background: "'paper', 'transparent' or any colour",
    ...NIB_PROP_DOCS,
  },
  component: BeatDance,
  tags: ['dance', 'beat', 'music', 'bpm', 'party', 'celebration', 'mascot', 'nib', 'character', 'crew', 'crowd', 'spin', 'cartoon', 'music video'],
});
