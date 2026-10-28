import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {n2} from '../../core/random';
import {FilmGrain, Svg, useStage, Vignette} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {blendPose, LIM, poseAt, PoseName, rgba5, solveStick, StickPose} from '../../core/r2-pr5-kit';

/**
 * Stickman rig: stick figures with circle heads perform a pose library (idle, walk, run, punch, kick, fall, cheer,
 * moonwalk, wave, dance, think, getup) built from joint-angle keyframes with 2-bone IK on the legs. Each actor has a
 * track of {at, pose, x}; poses blend over 5 frames. Lines boil on twos, and punches/kicks trigger impact frames
 * (white flash, burst, hit-stop shake). Defaults: a short parody scuffle ending in a victory dance.
 */

type TrackKey = {at: number; pose: PoseName; x: number; face?: 1 | -1; speed?: number};
type Actor = {name?: string; color: string; track: TrackKey[]};

type Props = {
  actors: Actor[];
  background: string;
  groundColor: string;
  ink: string;
  height: number;
  stroke: number;
  boil: number;
  impacts: boolean;
  title: string;
  caption: string;
};

// frame (within a pose) at which a strike lands
const HIT_AT: Partial<Record<PoseName, number>> = {punch: 8, kick: 10};
const BLEND = 5;

type Resolved = {pose: StickPose; x: number; face: 1 | -1; name: PoseName; local: number};

const resolve = (a: Actor, frame: number, wUnits: number): Resolved => {
  const keys = [...a.track].sort((p, q) => p.at - q.at);
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (frame >= keys[k].at) i = k;
  const cur = keys[i];
  const nxt = keys[i + 1];
  const local = Math.max(0, frame - cur.at);
  let pose = poseAt(cur.pose, local, cur.speed ?? 1);
  // blend from the previous key's pose (continuing its cycle)
  if (i > 0 && local < BLEND) {
    const pv = keys[i - 1];
    const old = poseAt(pv.pose, cur.at - pv.at + local, pv.speed ?? 1);
    pose = blendPose(old, pose, ease.inOut(local / BLEND));
  }
  // x travels linearly between keys
  let x = cur.x;
  if (nxt) x = cur.x + (nxt.x - cur.x) * clamp((frame - cur.at) / Math.max(1, nxt.at - cur.at));
  void wUnits;
  return {pose, x, face: cur.face ?? 1, name: cur.pose, local};
};

const Stick: React.FC<{r: Resolved; color: string; px: number; groundY: number; cx: number; stroke: number; boil: number; frame: number; seed: string; ink: string; headFill: string}> = ({r, color, px, groundY, cx, stroke, boil, frame, seed, ink, headFill}) => {
  const j = solveStick(r.pose);
  const twos = Math.floor(frame / 2);
  const P = (p: [number, number], k: string): [number, number] => {
    const bx = n2(`${seed}${k}x`, twos * 0.9, 0) * boil;
    const by = n2(`${seed}${k}y`, 0, twos * 0.9) * boil;
    return [cx + r.face * p[0] * px + bx, groundY - p[1] * px + by];
  };
  const hip = P(j.hip, 'a');
  const neck = P(j.neck, 'b');
  const head = P(j.headC, 'c');
  const sh = P(j.shF, 'd');
  const elF = P(j.elF, 'e');
  const haF = P(j.haF, 'f');
  const elB = P(j.elB, 'g');
  const haB = P(j.haB, 'h');
  const knF = P(j.kneeF, 'i');
  const ftF = P(j.footF, 'j');
  const knB = P(j.kneeB, 'k');
  const ftB = P(j.footB, 'l');
  const line = (pts: [number, number][], op = 1, col = color) => <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" opacity={op} />;
  const headR = LIM.head * px;
  // face direction dot (eye) so the figure reads as facing
  const ex = head[0] + r.face * headR * 0.38;
  const ey = head[1] - headR * 0.08;
  return (
    <g>
      {line([hip, knB, ftB], 0.78)}
      {line([sh, elB, haB], 0.78)}
      {line([hip, neck])}
      {line([hip, knF, ftF])}
      {line([sh, elF, haF])}
      <circle cx={head[0]} cy={head[1]} r={headR} fill={headFill} stroke={color} strokeWidth={stroke} />
      <circle cx={ex} cy={ey} r={Math.max(1.5, stroke * 0.32)} fill={ink} />
    </g>
  );
};

const StickmanRig: React.FC<Props> = ({actors, background, groundColor, ink, height, stroke, boil, impacts, title, caption}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const px = Math.min(h * (portrait ? 0.3 : 0.62), w * 0.55) * height; // figure height in px
  const groundY = h * (portrait ? 0.7 : 0.78);
  const span = w * (portrait ? 0.42 : 0.36); // track x -1..1 maps to +-span

  // collect impact events: frame of the hit + position of the attacker's front hand/foot
  const hits: {at: number; x: number; y: number; face: number}[] = [];
  if (impacts) {
    actors.forEach((a) => {
      const keys = [...a.track].sort((p, q) => p.at - q.at);
      keys.forEach((k, ki) => {
        const hitF = HIT_AT[k.pose];
        if (hitF == null) return;
        const at = k.at + hitF;
        const nx = keys[ki + 1];
        const x = k.x + (nx ? (nx.x - k.x) * clamp(hitF / Math.max(1, nx.at - k.at)) : 0);
        const pose = poseAt(k.pose, hitF);
        const jt = solveStick(pose);
        const tip = k.pose === 'kick' ? jt.footF : jt.haF;
        const face = k.face ?? 1;
        hits.push({at, x: w / 2 + x * span + face * tip[0] * px, y: groundY - tip[1] * px, face});
      });
    });
  }
  const hitNow = hits.filter((hh) => frame >= hh.at && frame < hh.at + 14);
  const freezeAt = hits.find((hh) => frame >= hh.at && frame < hh.at + 2);
  const flash = hits.some((hh) => frame >= hh.at && frame < hh.at + 2) ? 0.55 : 0;
  const shake = hitNow.reduce((s, hh) => s + Math.max(0, 1 - (frame - hh.at) / 8), 0);
  const sx = n2('stk-shake', frame * 1.7, 0) * 16 * u * Math.min(1, shake);
  const sy = n2('stk-shake', 0, frame * 1.7) * 12 * u * Math.min(1, shake);

  const palette = actors.map((a) => a.color);
  const fr = freezeAt ? freezeAt.at : frame; // hit-stop: freeze the poses for 2 frames of impact

  return (
    <AbsoluteFill style={{background}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 55% at 50% 70%, ${rgba5('#ffffff', 0.5)}, transparent 70%)`}} />
      <Svg style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* ground */}
        <line x1={w * 0.04} y1={groundY + 2 * u} x2={w * 0.96} y2={groundY + 2 * u} stroke={groundColor} strokeWidth={4 * u} strokeLinecap="round" opacity={prog(frame, 0, 14)} />
        {[...Array(9)].map((_, i) => (
          <line key={i} x1={w * (0.12 + i * 0.1)} y1={groundY + 22 * u} x2={w * (0.12 + i * 0.1) + 38 * u} y2={groundY + 22 * u} stroke={groundColor} strokeWidth={3 * u} strokeLinecap="round" opacity={0.35 * prog(frame, 4 + i, 18 + i)} />
        ))}
        {actors.map((a, ai) => {
          const r = resolve(a, fr, span);
          const lowFall = r.pose.rot !== 0 ? 0.5 : 1;
          return (
            <g key={ai}>
              <ellipse cx={w / 2 + r.x * span} cy={groundY + 6 * u} rx={px * 0.2 * lowFall + px * 0.1} ry={7 * u} fill={rgba5('#000', 0.14)} />
              <Stick r={r} color={a.color} px={px} groundY={groundY} cx={w / 2 + r.x * span} stroke={stroke * u} boil={boil * u} frame={frame} seed={`stk${ai}`} ink={ink} headFill={background} />
              {a.name ? (
                <text x={w / 2 + r.x * span} y={groundY + 54 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={16 * u} fill={a.color} opacity={0.8 * prog(frame, 6, 20)}>
                  {a.name}
                </text>
              ) : null}
            </g>
          );
        })}
        {/* impact bursts */}
        {hitNow.map((hh, i) => {
          const t = (frame - hh.at) / 14;
          const rays = 10;
          return (
            <g key={i} opacity={1 - t * t}>
              {[...Array(rays)].map((_, k) => {
                const ang = (k / rays) * Math.PI * 2 + 0.3;
                const r0 = (30 + 50 * ease.out(t)) * u;
                const r1 = r0 + (k % 2 ? 46 : 78) * u * (1 - t * 0.5);
                return <line key={k} x1={hh.x + Math.cos(ang) * r0} y1={hh.y + Math.sin(ang) * r0} x2={hh.x + Math.cos(ang) * r1} y2={hh.y + Math.sin(ang) * r1} stroke={ink} strokeWidth={5 * u} strokeLinecap="round" />;
              })}
              <circle cx={hh.x} cy={hh.y} r={(16 + 30 * ease.out(t)) * u} fill="none" stroke={palette[0] ?? ink} strokeWidth={5 * u} />
            </g>
          );
        })}
      </Svg>
      {/* title / caption */}
      <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.07, textAlign: 'center', color: ink, opacity: prog(frame, 0, 14)}}>
        <div style={{fontFamily: fonts.comic, fontSize: (portrait ? 84 : 76) * u, letterSpacing: 2 * u}}>{title}</div>
        <div style={{fontFamily: fonts.hand, fontSize: 36 * u, opacity: 0.6, marginTop: 4 * u}}>{caption}</div>
      </div>
      {flash > 0 ? <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'normal'}} /> : null}
      <Vignette strength={0.25} />
      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};

const demo: Actor[] = [
  {
    name: 'blue',
    color: '#2F6BFF',
    track: [
      {at: 0, pose: 'walk', x: -1.05},
      {at: 44, pose: 'idle', x: -0.5},
      {at: 62, pose: 'wave', x: -0.5},
      {at: 96, pose: 'punch', x: -0.32},
      {at: 132, pose: 'idle', x: -0.32},
      {at: 160, pose: 'cheer', x: -0.32},
      {at: 190, pose: 'moonwalk', x: -0.32},
      {at: 240, pose: 'dance', x: -0.7},
    ],
  },
  {
    name: 'red',
    color: '#EE4B3E',
    track: [
      {at: 0, pose: 'run', x: 1.1, face: -1},
      {at: 52, pose: 'idle', x: 0.1, face: -1},
      {at: 106, pose: 'fall', x: 0.1, face: -1},
      {at: 152, pose: 'getup', x: 0.24, face: -1},
      {at: 178, pose: 'idle', x: 0.24, face: -1},
      {at: 190, pose: 'dance', x: 0.55, face: -1},
    ],
  },
];

export const stickmanRig = defineMotion<Props>({
  id: 'stickman-rig',
  title: 'Stickman rig',
  category: 'character',
  description:
    'Round-capped stick figures with circle heads walk, run, punch, kick, fall, cheer, moonwalk, wave and dance from a joint-angle pose library with 2-bone IK legs; lines boil on twos and strikes trigger impact frames (flash, burst, hit-stop shake).',
  source: ['prompt-corpus: awesome-opus5-5-videos (MIT) — stick-figure comedy / fight-parody / process cases (5), original implementation'],
  useFor: 'Comedy and meme shorts, fight parodies, process explainers with people, "someone does a thing" beats where a full character is overkill.',
  durationInFrames: 270,
  defaultProps: {
    actors: demo,
    background: '#F4F1EA',
    groundColor: '#25232A',
    ink: '#1D1B22',
    height: 1,
    stroke: 8,
    boil: 1.6,
    impacts: true,
    title: 'STICK FIGHT',
    caption: 'round one',
  },
  propDocs: {
    actors: '[{name?, color, track:[{at, pose, x, face?, speed?}]}] — pose: idle|walk|run|punch|kick|fall|cheer|moonwalk|wave|dance|think|getup; x: -1..1 across the ground; face: 1 right, -1 left',
    background: 'background colour',
    groundColor: 'ground line colour',
    ink: 'text / impact colour',
    height: 'figure size multiplier',
    stroke: 'limb stroke width (px at 1080)',
    boil: 'line-boil jitter in px (on twos; 0 = steady)',
    impacts: 'flash + burst + hit-stop shake when a punch or kick lands',
    title: 'comic-lettered title',
    caption: 'handwritten sub-caption',
  },
  component: StickmanRig,
  tags: ['stickman', 'stick figure', 'rig', 'walk cycle', 'run', 'fight', 'punch', 'kick', 'dance', 'moonwalk', 'ik', 'character', 'comedy', 'meme', 'animation', 'impact frame', 'line boil', 'explainer', 'people'],
});
