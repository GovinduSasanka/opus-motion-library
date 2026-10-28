import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {ARCADE, ArcadeStage, ExtrudeText, SlimeOrb, SparkCritter, SprayGrain, easeInExpo, easeOutCubic, h01, lin, n2Safe, pop, shadeHex, star4, x58Fonts} from '../../core/r2-x58-kit';

/**
 * x7 beam-clash: two fighters on opposite sides fire straight energy beams (white core, glow in each fighter's
 * colour, 2.5× thickness at 40 %) that meet mid-frame in a white four-point star flare with 12–20 spark streaks
 * (3-frame life); the contact point jitters ±2 % W at 3–5 Hz; a blurred reflected copy streaks along the glossy
 * floor; "DEAD EVEN!" pops in above; the clash ends in a 3-frame white-out bloom.
 */
type Props = {
  leftColor: string;
  rightColor: string;
  contact: number;
  jitter: number;
  sparks: number;
  reflection: boolean;
  text: string;
  textAt: number;
  bloomAt: number;
  fighters: boolean;
  grain: boolean;
  seed: number;
};

const BeamClash: React.FC<Props> = ({leftColor, rightColor, contact, jitter, sparks, reflection, text, textAt, bloomAt, fighters, grain, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const id = `bc-${seed}`;
  const floorY = h * (portrait ? 0.62 : 0.7);
  const beamY = floorY - h * (portrait ? 0.08 : 0.15);
  const lx = w * (portrait ? 0.23 : 0.2);
  const rx = w * (portrait ? 0.77 : 0.78);
  const cs = portrait ? w : h; // character size basis
  const fire = easeOutCubic(lin(frame, 8, 16));
  const cxBase = lx + (rx - lx) * contact;
  const cxp = cxBase + n2Safe(`bc${seed}`, t * 4) * jitter * w;
  const thick = h * 0.035 * (portrait ? 0.8 : 1);
  const bloom = bloomAt > 0 ? easeInExpo(lin(frame, bloomAt, bloomAt + 3)) : 0;
  const leftEnd = lx + (cxp - lx) * fire;
  const rightEnd = rx - (rx - cxp) * fire;
  const beam = (x1: number, x2: number, col: string, key: string, y: number) => (
    <g key={key}>
      <rect x={Math.min(x1, x2)} y={y - thick * 1.25} width={Math.abs(x2 - x1)} height={thick * 2.5} fill={col} opacity={0.4} filter={`url(#${id}-gl)`} />
      <rect x={Math.min(x1, x2)} y={y - thick * 0.75} width={Math.abs(x2 - x1)} height={thick * 1.5} fill={col} opacity={0.85} />
      <rect x={Math.min(x1, x2)} y={y - thick * 0.35} width={Math.abs(x2 - x1)} height={thick * 0.7} fill="#fff" />
    </g>
  );
  const flareK = fire >= 0.99 ? 1 + 0.15 * Math.sin(t * 30) : 0;
  const S = Math.min(w, h);
  const textK = text ? pop(frame, textAt, 5, 1.12) : 0;
  return (
    <AbsoluteFill style={{background: ARCADE.bg, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${id}-gl`} x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation={thick * 0.6} />
          </filter>
          <filter id={`${id}-rf`} x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation={`${6 * u} ${3 * u}`} />
          </filter>
          <radialGradient id={`${id}-fl`}>
            <stop offset="0%" stopColor="#fff" />
            <stop offset="40%" stopColor="#fff" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ArcadeStage id={`${id}-st`} w={w} h={h} u={u} frame={frame} floorY={floorY} />
        {fighters ? (
          <>
            <SparkCritter id={`${id}-cr`} x={lx - cs * 0.04} y={floorY} s={cs * 0.2} color={leftColor} shade={shadeHex(leftColor, -0.35)} eyes="angry" lean={-6} />
            <SlimeOrb id={`${id}-sl`} x={rx + cs * 0.05} y={floorY} r={cs * 0.1} color={rightColor} shade={shadeHex(rightColor, -0.3)} eyes="ii" look={-0.6} />
          </>
        ) : null}
        {/* floor reflection */}
        {reflection && fire > 0 ? (
          <g opacity={0.4} filter={`url(#${id}-rf)`}>
            {beam(lx, leftEnd, leftColor, 'rl', floorY + (floorY - beamY) * 0.9)}
            {beam(rightEnd, rx, rightColor, 'rr', floorY + (floorY - beamY) * 0.9)}
          </g>
        ) : null}
        {fire > 0 ? (
          <g style={{mixBlendMode: 'screen'}}>
            {beam(lx, leftEnd, leftColor, 'l', beamY)}
            {beam(rightEnd, rx, rightColor, 'r', beamY)}
          </g>
        ) : null}
        {flareK > 0 ? (
          <g transform={`translate(${cxp} ${beamY})`}>
            <circle r={S * 0.14 * flareK} fill={`url(#${id}-fl)`} />
            <path d={star4(S * 0.13 * flareK, 0.06)} fill="#fff" />
            <path d={star4(S * 0.05 * flareK, 0.12)} fill="#fff" transform="rotate(45)" />
            {Array.from({length: sparks}, (_, i) => {
              const life = 3;
              const gen = Math.floor((frame + i) / life);
              const age = ((frame + i) % life) / life;
              const a = h01(i, gen, seed) * Math.PI * 2;
              const r0 = S * (0.03 + 0.1 * age);
              const len = S * (0.01 + 0.03 * h01(i, gen, 2));
              return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * (r0 + len)} y2={Math.sin(a) * (r0 + len)} stroke="#fff" strokeWidth={3 * u} strokeLinecap="round" opacity={1 - age} />;
            })}
          </g>
        ) : null}
        {textK > 0 ? (
          <g transform={`translate(${w / 2} ${h * (portrait ? 0.3 : 0.2)}) scale(${textK})`}>
            <ExtrudeText x={0} y={0} size={S * (portrait ? 0.12 : 0.1)} text={text} font={x58Fonts.bangers} gradient={['#FCFAE3', '#F8E3A0', '#F1C25F']} id={`${id}-tg`} ink="#070224" depth={S * 0.01} skew={-4} letterSpacing={2 * u} />
          </g>
        ) : null}
        {grain ? <SprayGrain w={w} h={h} u={u} frame={frame} count={900} seed={seed} opacity={0.45} /> : null}
      </svg>
      {bloom > 0 ? <AbsoluteFill style={{background: '#FFFFFF', opacity: bloom}} /> : null}
    </AbsoluteFill>
  );
};

export const beamClash = defineMotion<Props>({
  id: 'beam-clash',
  title: 'Beam clash',
  category: 'fx',
  description:
    'Two fighters fire white-core energy beams in their own colours that meet mid-frame in a jittering four-point star flare spraying spark streaks, with a blurred reflection on the glossy neon floor, a "DEAD EVEN!" pop and a white-out bloom at the end.',
  source: ['video x7 21.25-23.55 s (beam clash, contact jitter, white-out) — original fighters'],
  useFor: '"Two forces are equal / competing" metaphors, head-to-head finales, energy-transfer diagrams.',
  durationInFrames: 75,
  defaultProps: {
    leftColor: '#E66154',
    rightColor: '#3598F6',
    contact: 0.5,
    jitter: 0.02,
    sparks: 16,
    reflection: true,
    text: 'DEAD EVEN!',
    textAt: 22,
    bloomAt: 68,
    fighters: true,
    grain: true,
    seed: 3,
  },
  propDocs: {
    leftColor: 'left beam / fighter colour',
    rightColor: 'right beam / fighter colour',
    contact: 'where the beams meet between the fighters (0..1)',
    jitter: 'contact jitter as a fraction of width',
    sparks: 'spark streaks around the flare',
    reflection: 'blurred reflection on the floor',
    text: 'exclamation that pops in above ("" = none)',
    textAt: 'frame the exclamation pops',
    bloomAt: 'frame of the 3-frame white-out bloom (0 = none)',
    fighters: 'draw the two original fighters at the beam ends',
    grain: 'spray-grain speckle',
    seed: 'spark seed',
  },
  component: BeamClash,
  tags: ['beam', 'clash', 'energy', 'versus', 'fight', 'arcade', 'flare', 'sparks', 'duel', 'competition', 'equal', 'neon', 'whiteout', 'game'],
});
