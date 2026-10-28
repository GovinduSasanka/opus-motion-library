import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CRITTER_SPECIES, CritterPose, GuideStar, PaperCritter, PaperFilter, cloudPath, h01, lin, mountainRange, n2Safe, paperPalette, pineRow, shadeHex, star4} from '../../core/r2-x58-kit';

/**
 * x5 paper-critter-rig: an original paper-cut animal (default a red fox-like critter) built from cut pieces with
 * overlapping scale "feathers", a wedge head with tall ears, a 3-segment plume tail and four tapered legs, all
 * through the paper filter (fibre, torn light rim, contact shadow). Poses: walk in place (0.9 s stride, body bob
 * 1 %), sit (tail swish ±8° at 0.4 Hz, head tilt every ~2.6 s, 2-frame ear flick), stand, look-up at the star.
 * Default 'cycle' walks, stops, sits and looks up at a guide star on a mossy paper ledge at night.
 */
type Props = {
  pose: CritterPose | 'cycle';
  species: 'fox' | 'cat' | 'wolf' | 'hare';
  bodyColor: string;
  facing: 'right' | 'left';
  size: number;
  stride: number;
  palette: 'sunset' | 'moonlit' | 'dawn';
  scene: boolean;
  background: string;
  fireflies: boolean;
  star: boolean;
  seed: number;
};

const PaperCritterRig: React.FC<Props> = ({pose, species, bodyColor, facing, size, stride, palette, scene, background, fireflies, star, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const pal = paperPalette(palette);
  const S = Math.min(w, h);
  const base = CRITTER_SPECIES[species] ?? CRITTER_SPECIES.fox;
  const colors = bodyColor ? {...base, body: bodyColor, shade: shadeHex(bodyColor, -0.2)} : base;
  const D = 240;
  const f = frame % D;
  const cur: CritterPose = pose === 'cycle' ? (f < 96 ? 'walk' : f < 120 ? 'stand' : f < 160 ? 'sit' : 'look-up') : pose;
  const H = S * 0.46 * size;
  const feetY = portrait ? h * 0.66 : h * 0.8;
  const cx = w * (portrait ? 0.5 : 0.44);
  const fid = `pcr-${seed}`;
  const ledge = `M${-w * 0.05} ${feetY + S * 0.02} C${w * 0.2} ${feetY - S * 0.02} ${w * 0.6} ${feetY - S * 0.03} ${w * 1.05} ${feetY + S * 0.03} L${w * 1.05} ${h * 1.1} L${-w * 0.05} ${h * 1.1}Z`;
  const far = mountainRange(seed + 3, -w * 0.05, w * 1.05, feetY - S * 0.12, S * 0.12, S * 0.3, 5);
  const t = frame / fps;
  // walking in place: the ground scrolls under the feet
  const scroll = cur === 'walk' ? (frame * S * 0.004) % (w * 0.25) : 0;
  return (
    <AbsoluteFill style={{background: scene ? pal.skyTop : background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <PaperFilter id={fid} u={u} h={h} rim={pal.rim} seed={seed} />
          <linearGradient id={`${fid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.skyTop} />
            <stop offset="60%" stopColor={pal.skyMid} />
            <stop offset="100%" stopColor={pal.skyLow} />
          </linearGradient>
          <filter id={`${fid}-gl`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={5 * u} />
          </filter>
        </defs>
        {scene ? (
          <g>
            <rect width={w} height={h} fill={`url(#${fid}-sky)`} />
            {pal.night
              ? Array.from({length: 60}, (_, i) => <circle key={i} cx={h01(i, 1) * w} cy={h01(i, 2) * h * 0.5} r={(0.8 + 1.4 * h01(i, 3)) * u} fill="#FFF3D6" opacity={0.4 + 0.5 * Math.abs(Math.sin(t * 1.3 + i))} />)
              : null}
            <g filter={`url(#${fid})`}>
              <path d={cloudPath(seed + 1, w * 0.22, h * 0.2, w * 0.3, S * 0.12, 7)} fill={pal.cloud} opacity={0.9} />
            </g>
            <g filter={`url(#${fid})`}>
              <path d={far.base} fill={pal.far} />
              <path d={far.shade} fill={pal.farShade} opacity={0.7} />
              <path d={far.snow} fill={pal.snow} />
            </g>
            <g filter={`url(#${fid})`} transform={`translate(${-scroll * 0.4} 0)`}>
              <path d={pineRow(seed + 5, -w * 0.1, w * 1.4, feetY - S * 0.04, S * 0.12, S * 0.24, 22)} fill={pal.forest} />
            </g>
            <g filter={`url(#${fid})`}>
              <path d={ledge} fill={pal.meadow} />
              <g transform={`translate(${-scroll} 0)`}>
                {Array.from({length: 40}, (_, i) => (
                  <path key={i} d={`M${(i / 40) * w * 1.3} ${feetY + S * (0.05 + 0.25 * h01(i, 9))} l${3 * u} ${-10 * u} l${3 * u} ${10 * u}`} stroke={shadeHex(pal.meadow, -0.2)} strokeWidth={2 * u} fill="none" />
                ))}
              </g>
            </g>
          </g>
        ) : null}
        {star && scene ? <GuideStar id={`${fid}-star`} x={w * (portrait ? 0.78 : 0.78)} y={h * (portrait ? 0.2 : 0.16)} r={S * 0.03 * (0.92 + 0.08 * Math.sin(t * 7.5))} /> : null}
        <PaperCritter id={`${fid}-c`} x={cx} y={feetY} H={H} frame={frame} fps={fps} pose={cur} colors={colors} facing={facing === 'left' ? -1 : 1} stride={stride} filter={`url(#${fid})`} />
        {fireflies && scene
          ? Array.from({length: 24}, (_, i) => {
              const x = w * h01(i, 21) + n2Safe('fx' + i, t * 0.3) * 50 * u;
              const y = h * (0.15 + 0.6 * h01(i, 22)) + n2Safe('fy' + i, t * 0.3) * 40 * u;
              const b = 0.3 + 0.7 * Math.max(0, Math.sin((t * Math.PI * 2) / (1.5 + 1.5 * h01(i, 23)) + i));
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={12 * u} fill="#F2B33D" opacity={0.3 * b} filter={`url(#${fid}-gl)`} />
                  <circle cx={x} cy={y} r={3 * u} fill="#FFE08A" opacity={b} />
                </g>
              );
            })
          : null}
        {/* entrance sparkle so frame 0 is not static */}
        {lin(frame, 0, 12) < 1 ? <path d={star4(S * 0.02 * (1 - lin(frame, 0, 12)), 0.2)} transform={`translate(${cx + H * 0.4} ${feetY - H * 0.9})`} fill="#FFF3C4" /> : null}
      </svg>
    </AbsoluteFill>
  );
};

export const paperCritterRig = defineMotion<Props>({
  id: 'paper-critter-rig',
  title: 'Paper critter rig',
  category: 'character',
  description:
    'An original paper-cut critter (fox-like by default) made of overlapping scale-shaped paper pieces, with walk-in-place, stand, sit and look-up poses, tail swish, head tilts and ear flicks, paper rims and a contact shadow on a mossy paper ledge.',
  source: ['video x5 0:02-0:06 (walk), 0:12.5-0:17.5 (sit idle) — original design'],
  useFor: 'A reusable storybook hero for explainers, kids’ content and brand journeys; a mascot in a paper world.',
  durationInFrames: 240,
  defaultProps: {
    pose: 'cycle',
    species: 'fox',
    bodyColor: '',
    facing: 'right',
    size: 1,
    stride: 0.9,
    palette: 'moonlit',
    scene: true,
    background: '#182C4B',
    fireflies: true,
    star: true,
    seed: 2,
  },
  propDocs: {
    pose: "'cycle' (walk → stand → sit → look-up) | 'walk' | 'stand' | 'sit' | 'look-up'",
    species: "palette preset: 'fox' | 'cat' | 'wolf' | 'hare'",
    bodyColor: 'override body colour (hex), shade is derived',
    facing: "'right' | 'left'",
    size: 'critter size multiplier (1 = 46 % of the short side)',
    stride: 'seconds per walk stride',
    palette: "scene palette: 'sunset' | 'moonlit' | 'dawn'",
    scene: 'draw the paper ledge / mountains / sky (false = plain background, use background "transparent" for an overlay)',
    background: "background when scene is off ('transparent' for an overlay)",
    fireflies: 'drifting fireflies',
    star: 'golden guide star in the sky',
    seed: 'scene seed',
  },
  component: PaperCritterRig,
  tags: ['paper', 'paper-cut', 'character', 'animal', 'fox', 'critter', 'mascot', 'walk cycle', 'sit', 'idle', 'rig', 'storybook', 'kids', 'craft'],
});
