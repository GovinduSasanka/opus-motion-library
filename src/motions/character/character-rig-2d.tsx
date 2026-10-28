import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {rng} from '../../core/random';
import {clamp01} from '../../core/r2-pr1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A generic flat-vector humanoid presenter on a jointed 2D rig: walks in, idles with a 1.5 s breathing bob, blinks
 * every 2-5 s (3-frame close), talks with 4 mouth shapes (driven by the `say` text, or by an `amplitude` array for real
 * audio lip-flap) and performs cue actions: wave, point, nod, shrug, cheer, walk, talk. Any body part can be replaced
 * by a host image via `parts` (head / torso / armL / armR / legL / legR) and keeps the same joints.
 */

type Cue = {at: number; action: 'wave' | 'point' | 'nod' | 'shrug' | 'cheer' | 'walk' | 'talk' | 'idle'; dur?: number};
type Props = {
  cues: Cue[];
  say: string;
  sayAt: number;
  charFrames: number;
  amplitude: number[];
  walkInFrames: number;
  facing: 'right' | 'left';
  parts: Partial<Record<'head' | 'torso' | 'armL' | 'armR' | 'legL' | 'legR', string>>;
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  accent: string;
  background: string;
  floor: string;
  seed: number;
  showFloor: boolean;
};

const DUR: Record<string, number> = {wave: 44, point: 40, nod: 24, shrug: 30, cheer: 44, walk: 60, talk: 60, idle: 10};
const ramp = (frame: number, at: number, dur: number) => prog(frame, at, at + 7, ease.out) * (1 - prog(frame, at + dur - 7, at + dur, ease.in));

const CharacterRig2D: React.FC<Props> = ({cues, say, sayAt, charFrames, amplitude, walkInFrames, facing, parts, skin, hair, shirt, pants, shoes, accent, background, floor, seed, showFloor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, durationInFrames} = useStage();
  const S = (portrait ? Math.min(h * 0.5, w * 0.78 * 1.4) : h * 0.78) / 640;
  const groundY = portrait ? h * 0.78 : h * 0.86;

  // ---- weights
  const wt = (name: string) => cues.reduce((m, c) => (c.action === name ? Math.max(m, ramp(frame, c.at, c.dur ?? DUR[name] ?? 40)) : m), 0);
  const walkIn = walkInFrames > 0 ? 1 - prog(frame, walkInFrames - 8, walkInFrames, ease.out) : 0;
  const walkW = Math.max(wt('walk'), walkIn);
  const talkingByText = say && frame >= sayAt && frame < sayAt + say.length * charFrames + 6 ? 1 : 0;
  const amp = amplitude.length ? amplitude[Math.min(amplitude.length - 1, Math.max(0, frame))] ?? 0 : 0;
  const talkW = Math.max(wt('talk'), talkingByText, amplitude.length ? clamp01(amp * 3) : 0);

  // ---- idle + actions -> pose
  const t = frame / fps;
  const bob = Math.sin((frame / 45) * Math.PI * 2); // 1.5 s period
  const pose = {armL: 7 + bob * 1.2, armR: 7 + bob * 1.2, foreL: 6, foreR: 6, thighL: 0, thighR: 0, shinL: 0, shinR: 0, lean: 0, headTilt: Math.sin(t * 0.9) * 1.5, headDip: 0, bodyY: bob * 3, shoulder: 0};
  const apply = (k: keyof typeof pose, target: number, wgt: number) => (pose[k] = lerp(pose[k], target, clamp01(wgt)));

  // talk gestures (small, always there while speaking)
  const g = Math.sin(frame * 0.33);
  apply('armL', 20 + g * 7, talkW * 0.8);
  apply('foreL', 38 + g * 10, talkW * 0.8);
  apply('headTilt', Math.sin(frame * 0.21) * 3, talkW * 0.7);
  // wave (screen-right arm)
  const wv = wt('wave');
  apply('armR', 148, wv);
  apply('foreR', 28 + Math.sin(frame * 0.6) * 24, wv);
  apply('headTilt', 5, wv * 0.6);
  // point
  const pt = wt('point');
  apply('armR', 82, pt);
  apply('foreR', 6, pt);
  apply('headTilt', -4, pt * 0.6);
  apply('lean', 3, pt);
  // nod
  const nd = wt('nod');
  pose.headDip += Math.sin(((frame % 24) / 24) * Math.PI * 2 * 1.5) * 9 * nd;
  // shrug
  const sh = wt('shrug');
  apply('armL', 38, sh);
  apply('armR', 38, sh);
  apply('foreL', 78, sh);
  apply('foreR', 78, sh);
  apply('shoulder', -10 * u, sh);
  pose.bodyY -= sh * 6;
  // cheer
  const ch = wt('cheer');
  apply('armL', 160 + Math.sin(frame * 0.5) * 8, ch);
  apply('armR', 160 - Math.sin(frame * 0.5) * 8, ch);
  apply('foreL', 14, ch);
  apply('foreR', 14, ch);
  pose.bodyY -= Math.abs(Math.sin(frame * 0.25)) * 14 * ch;
  // walk
  const p = (frame / 22) * Math.PI * 2;
  apply('thighL', 26 * Math.sin(p), walkW);
  apply('thighR', -26 * Math.sin(p), walkW);
  apply('shinL', Math.max(0, -Math.sin(p + 0.9)) * 34, walkW);
  apply('shinR', Math.max(0, Math.sin(p + 0.9)) * 34, walkW);
  apply('armL', 7 - 20 * Math.sin(p), walkW);
  apply('armR', 7 + 20 * Math.sin(p), walkW);
  pose.bodyY = lerp(pose.bodyY, -Math.abs(Math.sin(p)) * 9, walkW);

  // ---- blink
  const r = rng(seed);
  let tt = 20 + Math.floor(r() * 30);
  let blink = 0;
  while (tt < durationInFrames + 10) {
    const d = frame - tt;
    if (d >= 0 && d < 3) blink = d === 1 ? 1 : 0.75;
    tt += Math.round(60 + r() * 90);
  }

  // ---- mouth: 0 closed, 1 small, 2 wide, 3 O
  let mouth = 0;
  if (amplitude.length) mouth = amp > 0.55 ? 2 : amp > 0.3 ? 3 : amp > 0.1 ? 1 : 0;
  else if (talkingByText) {
    const idx = Math.floor((frame - sayAt) / charFrames);
    const ch1 = (say[idx] ?? ' ').toLowerCase();
    mouth = /[aei]/.test(ch1) ? 2 : /[ouw]/.test(ch1) ? 3 : /[mbp\s.,!?]/.test(ch1) ? 0 : 1;
  } else if (wt('talk') > 0.1) mouth = Math.floor(frame / 3) % 3;

  // ---- position
  const x0 = w / 2 + (portrait ? 0 : -w * 0.06);
  const walkX = walkInFrames > 0 ? lerp(-w * 0.3, 0, ease.out(clamp01(frame / walkInFrames))) : 0;
  const dir = facing === 'left' ? -1 : 1;
  const floorScroll = wt('walk') * 0 + (wt('walk') > 0.05 ? frame * 7 : 0);

  const img = (role: keyof Props['parts'], bw: number, bh: number, ox = 0, oy = 0) =>
    parts[role] ? <image href={resolveSrc(parts[role] as string)} x={-bw / 2 + ox} y={oy} width={bw} height={bh} preserveAspectRatio="xMidYMid meet" /> : null;

  const arm = (side: 'L' | 'R') => {
    const a = side === 'L' ? pose.armL : pose.armR;
    const f = side === 'L' ? pose.foreL : pose.foreR;
    const sx = side === 'L' ? -64 : 64;
    const rot = side === 'L' ? a : -a;
    const frot = side === 'L' ? f : -f;
    return (
      <g transform={`translate(${sx + (side === 'L' ? -pose.shoulder * -0 : 0)} ${-440 + pose.shoulder * 0.0}) rotate(${rot})`}>
        {img(side === 'L' ? 'armL' : 'armR', 64, 220) ?? (
          <>
            <rect x={-17} y={-6} width={34} height={118} rx={17} fill={shirt} />
            <g transform={`translate(0 104) rotate(${frot})`}>
              <rect x={-14} y={-4} width={28} height={104} rx={14} fill={skin} />
              <circle cx={0} cy={104} r={17} fill={skin} />
              <rect x={-17} y={-6} width={34} height={30} rx={13} fill={shirt} opacity={0.0} />
            </g>
          </>
        )}
      </g>
    );
  };
  const leg = (side: 'L' | 'R') => {
    const th = side === 'L' ? pose.thighL : pose.thighR;
    const sn = side === 'L' ? pose.shinL : pose.shinR;
    const sx = side === 'L' ? -30 : 30;
    return (
      <g transform={`translate(${sx} -252) rotate(${th})`}>
        {img(side === 'L' ? 'legL' : 'legR', 70, 252) ?? (
          <>
            <rect x={-24} y={-4} width={48} height={132} rx={22} fill={pants} />
            <g transform={`translate(0 122) rotate(${sn})`}>
              <rect x={-21} y={-2} width={42} height={124} rx={20} fill={pants} />
              <path d={`M -22 112 h 56 a 16 16 0 0 1 16 16 v 6 h -72 z`} fill={shoes} transform="translate(-6 0)" />
            </g>
          </>
        )}
      </g>
    );
  };

  const eyeH = 13 * (1 - blink);
  const mouthShapes = [
    <path key="m0" d="M -17 0 Q 0 11 17 0" stroke="#4a2a2a" strokeWidth={4.5} strokeLinecap="round" fill="none" />,
    <ellipse key="m1" cx={0} cy={3} rx={9} ry={5.5} fill="#5a2630" />,
    <g key="m2">
      <path d="M -18 -2 Q 0 -4 18 -2 Q 14 20 0 20 Q -14 20 -18 -2 Z" fill="#5a2630" />
      <path d="M -14 -1 Q 0 -3 14 -1 L 13 5 Q 0 3 -13 5 Z" fill="#fff" />
      <ellipse cx={0} cy={16} rx={8} ry={4} fill="#d9667a" />
    </g>,
    <ellipse key="m3" cx={0} cy={6} rx={9} ry={11} fill="#5a2630" />,
  ];

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${background} 0%, ${background} 62%, ${floor} 100%)`}}>
      <Svg>
        {showFloor ? (
          <g>
            <rect x={0} y={groundY} width={w} height={h - groundY} fill={floor} opacity={0.9} />
            <rect x={0} y={groundY} width={w} height={3 * u} fill="#000" opacity={0.12} />
            {Array.from({length: 14}, (_, i) => {
              const xx = (((i * 180 * u - floorScroll * u) % (w + 180 * u)) + (w + 180 * u)) % (w + 180 * u) - 90 * u;
              return <rect key={i} x={xx} y={groundY + (h - groundY) * 0.45} width={70 * u} height={5 * u} rx={2.5 * u} fill="#000" opacity={0.07} />;
            })}
          </g>
        ) : null}
        {/* contact shadow */}
        <ellipse cx={x0 + walkX * 1} cy={groundY + 6 * u} rx={120 * S} ry={16 * S} fill="#000" opacity={0.18} />
        <g transform={`translate(${x0 + walkX} ${groundY}) scale(${S * dir} ${S})`}>
          <g transform={`translate(0 ${pose.bodyY})`}>
            {/* back arm + legs */}
            {leg('L')}
            {leg('R')}
            {/* torso */}
            <g transform={`rotate(${pose.lean} 0 -250)`}>
              {arm('L')}
              {img('torso', 150, 220, 0, -450) ?? (
                <>
                  <path d="M -62 -440 Q 0 -462 62 -440 L 58 -250 Q 0 -236 -58 -250 Z" fill={shirt} />
                  <path d="M -22 -452 Q 0 -420 22 -452" fill="none" stroke={accent} strokeWidth={6} strokeLinecap="round" />
                  <rect x={-58} y={-262} width={116} height={20} rx={8} fill={pants} />
                </>
              )}
              {arm('R')}
              {/* neck + head */}
              <rect x={-17} y={-478} width={34} height={44} rx={12} fill={skin} />
              <g transform={`translate(0 ${-540 + pose.headDip}) rotate(${pose.headTilt})`}>
                {img('head', 170, 190, 0, -100) ?? (
                  <>
                    <ellipse cx={0} cy={0} rx={66} ry={74} fill={skin} />
                    <ellipse cx={-66} cy={4} rx={9} ry={14} fill={skin} />
                    <ellipse cx={66} cy={4} rx={9} ry={14} fill={skin} />
                    <path d="M -70 -6 Q -76 -84 0 -86 Q 76 -84 70 -6 Q 56 -52 6 -56 Q -40 -52 -70 -6 Z" fill={hair} />
                    <ellipse cx={-25} cy={2} rx={8.5} ry={Math.max(1.2, eyeH)} fill="#241a1a" />
                    <ellipse cx={25} cy={2} rx={8.5} ry={Math.max(1.2, eyeH)} fill="#241a1a" />
                    <path d="M -38 -20 Q -25 -27 -12 -20 M 12 -20 Q 25 -27 38 -20" stroke={hair} strokeWidth={5} strokeLinecap="round" fill="none" />
                    <circle cx={-44} cy={26} r={9} fill="#ff8a7a" opacity={0.28} />
                    <circle cx={44} cy={26} r={9} fill="#ff8a7a" opacity={0.28} />
                    <g transform="translate(0 38)">{mouthShapes[mouth]}</g>
                  </>
                )}
              </g>
            </g>
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

void clamp;

export const characterRig2d = defineMotion<Props>({
  id: 'character-rig-2d',
  title: 'Character rig 2D (presenter)',
  category: 'character',
  description:
    'A flat-vector humanoid presenter on a jointed rig: walks in, idles with a 1.5 s breathing bob, blinks every 2-5 s, lip-flaps through four mouth shapes from text or an amplitude array, and plays cue actions (wave, point, nod, shrug, cheer, walk, talk). Body parts can be swapped for your own images.',
  source: ['prompt-corpus: character-rig-2d (56 cases)', 'awesome-opus5-5-videos prompts (MIT) — technique only'],
  useFor: 'Presenters, mascots, explainers with a host and story shorts: set `say`/`amplitude` for speech, `cues` for gestures, colours for the brand, `parts` for a custom character.',
  durationInFrames: 240,
  defaultProps: {
    cues: [
      {at: 52, action: 'wave', dur: 44},
      {at: 128, action: 'point', dur: 40},
      {at: 172, action: 'shrug', dur: 30},
      {at: 208, action: 'nod', dur: 26},
    ],
    say: 'Hi there, welcome to the show. Let me walk you through it.',
    sayAt: 58,
    charFrames: 3,
    amplitude: [],
    walkInFrames: 48,
    facing: 'right',
    parts: {},
    skin: '#E9B38D',
    hair: '#3B2A22',
    shirt: '#2F7F86',
    pants: '#2D3748',
    shoes: '#E8E2D6',
    accent: '#F2C14E',
    background: '#F4EBDD',
    floor: '#D9C9B2',
    seed: 7,
    showFloor: true,
  },
  propDocs: {
    cues: "[{at, action: 'wave'|'point'|'nod'|'shrug'|'cheer'|'walk'|'talk'|'idle', dur?}]",
    say: 'text whose letters drive the 4 mouth shapes (empty = silent)',
    sayAt: 'frame the speech starts',
    charFrames: 'frames per character of `say`',
    amplitude: 'optional per-frame audio amplitude 0..1 (30 fps) for real lip-flap; overrides `say`',
    walkInFrames: 'frames of the walk-in from the left (0 = already standing)',
    facing: "'right' | 'left'",
    parts: 'optional image paths per part: head, torso, armL, armR, legL, legR (replace the vector part)',
    skin: 'skin colour',
    hair: 'hair colour',
    shirt: 'shirt colour',
    pants: 'trousers colour',
    shoes: 'shoe colour',
    accent: 'collar accent',
    background: 'wall colour',
    floor: 'floor colour',
    seed: 'blink timing seed',
    showFloor: 'draw the floor and shadow',
  },
  component: CharacterRig2D,
  tags: ['character', 'rig', 'presenter', 'host', 'humanoid', 'lip-sync', 'lipsync', 'mouth', 'blink', 'walk', 'wave', 'point', 'mascot', 'explainer', 'avatar', 'person'],
});
