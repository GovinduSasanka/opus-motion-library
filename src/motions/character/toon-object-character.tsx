import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease} from '../../core/ease';
import {ToonCharacter, toonPose, type ToonBody, type ToonBrows, type ToonMouth, type ToonSteam} from '../../core/r2-s2-toon-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * 1930s rubber-hose cartoon character built from an everyday object (mug / box / bottle / can): the whole object is
 * the body, pie eyes and a big mouth on its front, black noodle arms and legs with white four-finger gloves and huge
 * round shoes, ink outlines that boil on 3 drawings at 12 fps, a steam carrier that shows the mood, one hard
 * light-grey form-shadow band. A script of actions (walk, hop, point, wave, cheer) and an expression timeline drive it.
 * Original design (not any existing character).
 */
type Look = [number, number];
type Expr = {at: number; mouth?: string; brows?: string; steam?: string; look?: Look};
type Seg = {at: number; action: string; dur: number; x?: number};
type Props = {
  body: string;
  color: string;
  ink: string;
  accent: string;
  background: string;
  floor: string;
  expressions: Expr[];
  script: Seg[];
  startX: number;
  bpm: number;
  boil: number;
  onTwos: boolean;
  size: number;
  shadow: boolean;
};

const ToonObjectCharacter: React.FC<Props> = ({body, color, ink, accent, background, floor, expressions, script, startX, bpm, boil, onTwos, size, shadow}) => {
  const frame = useCurrentFrame();
  const {w, h, fps, portrait} = useStage();
  const S = Math.min((h * 0.62) / 335, (w * (portrait ? 0.74 : 0.6)) / 300) * size;
  const floorY = h * (portrait ? 0.68 : 0.8);
  const baseY = floorY - 149 * S;

  // current action segment
  let seg: Seg = script[0] ?? {at: 0, action: 'idle', dur: 30};
  for (const s of script) if (frame >= s.at) seg = s;
  const t = Math.max(0, Math.min(1, (frame - seg.at) / Math.max(1, seg.dur)));
  const pose = toonPose(seg.action, t, frame, fps, bpm);

  // horizontal travel: anchors at the end of every segment that names an x (fractions of the frame width, 0 = centre)
  const anchors: [number, number][] = [[0, startX]];
  for (const s of script) if (s.x !== undefined) anchors.push([s.at + s.dur, s.x]);
  let xf = anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [f0, x0] = anchors[i - 1];
    const [f1, x1] = anchors[i];
    if (frame >= f1) xf = x1;
    else if (frame > f0) {
      xf = x0 + (x1 - x0) * ease.inOut((frame - f0) / Math.max(1, f1 - f0));
      break;
    } else break;
  }
  const px = w / 2 + xf * w;

  // expression
  let ex: Expr = expressions[0] ?? {at: 0};
  for (const e of expressions) if (frame >= e.at) ex = e;
  const look: Look = ex.look ?? [0, 0];
  const blink = (frame + 30) % 76 < 4;
  const drift = Math.sin(frame * 0.05);

  const air = Math.max(0, -pose.dy) / 80;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${background} 0%, ${background} 55%, rgba(0,0,0,0.14) 140%), ${background}`}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <line x1={w * 0.04} x2={w * 0.96} y1={floorY + 12 * S} y2={floorY + 12 * S} stroke={floor} strokeWidth={3 * S} strokeLinecap="round" opacity={0.55} />
        {shadow ? <ellipse cx={px} cy={floorY + 6 * S} rx={92 * S * (1 - air * 0.35)} ry={13 * S * (1 - air * 0.3)} fill="#000" opacity={0.2 * (1 - air * 0.5)} /> : null}
        <g transform={`translate(${px + pose.dx * S} ${baseY + pose.dy * S}) rotate(${pose.rot}) scale(${S * pose.sx} ${S * pose.sy})`}>
          <ToonCharacter
            id="toon"
            body={(body as ToonBody) in {mug: 1, box3d: 1, bottle: 1, can: 1} ? (body as ToonBody) : 'mug'}
            color={color}
            ink={ink}
            accent={accent}
            pose={pose}
            mouth={(ex.mouth ?? 'smile') as ToonMouth}
            brows={(ex.brows ?? 'none') as ToonBrows}
            steam={(ex.steam ?? 'lazy') as ToonSteam}
            blink={blink}
            lookX={look[0] + drift * 0.3}
            lookY={look[1]}
            frame={frame}
            fps={fps}
            boilAmp={boil}
            onTwos={onTwos}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const toonObjectCharacter = defineMotion<Props>({
  id: 'toon-object-character',
  title: 'Toon object character',
  category: 'character',
  description:
    'An everyday object (mug, box, bottle, can) becomes a 1930s rubber-hose cartoon character: pie eyes and a big mouth on its front, black noodle arms and legs, white four-finger gloves, huge round shoes, boiling ink outlines and a steam carrier that shows the mood; it walks in, hops with squash and stretch, points, waves and cheers.',
  source: ['lemo-opuscar styles/rubber-hose demo/chars.js + toon.js ideas, STYLE.md §2 anatomy (MIT / CC BY 4.0, LemoLab); original redraw'],
  useFor: 'Product mascots from the host\'s own product shape (mug, bottle, box), retro ads, kids content; a second character family beside box-bot.',
  durationInFrames: 210,
  defaultProps: {
    body: 'mug',
    color: '#F2EEE2',
    ink: '#16130F',
    accent: '#E5788A',
    background: '#E9E3D3',
    floor: '#7A7466',
    expressions: [
      {at: 0, mouth: 'smile', brows: 'happy', steam: 'lazy'},
      {at: 66, mouth: 'smile', brows: 'worried', steam: 'bitter', look: [0, -0.4]},
      {at: 76, mouth: 'grin', brows: 'up', steam: 'alarm', look: [0.4, -0.6]},
      {at: 102, mouth: 'o', brows: 'up', steam: 'lazy', look: [1, 0]},
      {at: 136, mouth: 'tongue', brows: 'happy', steam: 'heart'},
      {at: 172, mouth: 'grin', brows: 'happy', steam: 'heart'},
    ],
    script: [
      {at: 0, action: 'walk', dur: 56, x: 0},
      {at: 56, action: 'idle', dur: 20},
      {at: 76, action: 'hop', dur: 30},
      {at: 106, action: 'point', dur: 30},
      {at: 136, action: 'wave', dur: 36},
      {at: 172, action: 'cheer', dur: 38},
    ],
    startX: -0.62,
    bpm: 100,
    boil: 1.2,
    onTwos: true,
    size: 1,
    shadow: true,
  },
  propDocs: {
    body: "'mug' | 'box3d' | 'bottle' | 'can'",
    color: 'body fill colour (greyscale or brand)',
    ink: 'outline / limb colour',
    accent: 'mouth tongue, heart steam and bottle cap colour',
    background: 'backdrop colour',
    floor: 'floor line colour',
    expressions: "[{at, mouth:'smile|grin|o|wavy|pucker|tongue', brows:'none|happy|worried|angry|up', steam:'lazy|bitter|alarm|wilted|heart|none', look:[x,y]}]",
    script: "[{at, dur, action:'idle|walk|run|hop|point|wave|cheer', x?}] ; x = horizontal target (fraction of the frame width) reached at the end of the segment",
    startX: 'starting x as a fraction of the frame width (0 = centre)',
    bpm: 'beat-breathe tempo',
    boil: 'ink boil amplitude in character units (0 = off)',
    onTwos: 'boil on 3 drawings at 12 fps',
    size: 'character scale multiplier',
    shadow: 'floor shadow',
  },
  component: ToonObjectCharacter,
  tags: ['rubber-hose', 'toon', 'cartoon', '1930s', 'character', 'mascot', 'object', 'mug', 'bottle', 'can', 'box', 'noodle-limbs', 'gloves', 'pie-eyes', 'boil', 'retro', 'squash-stretch', 'walk', 'hop', 'steam', 'product-mascot'],
});
