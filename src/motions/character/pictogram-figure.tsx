// Adapted from lemo-opuscar/styles/pictogram-motion/demo/engine.js (LEN, WID, joints, drawFigure, keyPose, runCycle, walkCycle) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {MotifGrid, P, eio, fitW, lbf, lerp, mix, oExp, seg, toneSet} from '../../core/r2-lb1-kit';

/**
 * Faceless geometric pictogram athlete: round-capped bars for torso and limbs and a disc head, driven by forward
 * kinematics from beat-timed key poses (run, walk, jump, throw, kick, lift, wave, cheer); far-side limbs in a tone
 * mixed toward the background; standing on a big "sun disc" crossed by a slow light sweep over a low-contrast motif
 * grid. Arrives by horizontal bands sliding into register.
 */

type Pose = {x: number; y: number; rot: number; torso: number; head: number; aL1: number; aL2: number; aR1: number; aR2: number; lL1: number; lL2: number; lR1: number; lR2: number};
type Key = Partial<Pose> & {b: number};
type Props = {
  action: 'run' | 'walk' | 'jump' | 'throw' | 'kick' | 'lift' | 'wave' | 'cheer';
  bpm: number;
  hue: string;
  figure: string;
  farMix: number;
  disc: boolean;
  sweep: boolean;
  assemble: boolean;
  label: string;
  meta: string;
  pattern: boolean;
  background: string;
};

const LEN = {torso: 0.3, neck: 0.045, head: 0.082, ua: 0.16, fa: 0.15, th: 0.225, sh: 0.225};
const WID = {torso: 0.145, arm: 0.076, leg: 0.094};
const DEF: Pose = {x: 0, y: 0, rot: 0, torso: 0, head: 0, aL1: -8, aL2: -4, aR1: 8, aR2: 12, lL1: -4, lL2: -4, lR1: 4, lR2: 4};
const D2R = Math.PI / 180;
const rot2 = (v: P, deg: number): P => {
  const a = deg * D2R;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};
const dirDown = (deg: number, frame: number): P => rot2([Math.sin(-deg * D2R), Math.cos(deg * D2R)], frame);
const add = (p: P, v: P, k: number): P => [p[0] + v[0] * k, p[1] + v[1] * k];
const joints = (pp: Partial<Pose>) => {
  const p = {...DEF, ...pp};
  const hip: P = [p.x, p.y];
  const tf = p.rot + p.torso;
  const up = rot2([0, -1], tf);
  const neck = add(hip, up, LEN.torso);
  const sho = add(hip, up, LEN.torso - 0.025);
  const hup = rot2(up, p.head);
  const head = add(neck, hup, LEN.neck + LEN.head);
  // facing +x: "forward" (90°) must point to +x, so mirror the angle sign
  const arm = (a1: number, a2: number): [P, P, P] => {
    const e = add(sho, dirDown(-a1, tf), LEN.ua);
    return [sho, e, add(e, dirDown(-a2, tf), LEN.fa)];
  };
  const leg = (l1: number, l2: number): [P, P, P] => {
    const k = add(hip, dirDown(-l1, p.rot), LEN.th);
    return [hip, k, add(k, dirDown(-l2, p.rot), LEN.sh)];
  };
  return {hip, neck, head, up, aL: arm(p.aL1, p.aL2), aR: arm(p.aR1, p.aR2), lL: leg(p.lL1, p.lL2), lR: leg(p.lR1, p.lR2)};
};
const lerpPose = (a: Partial<Pose>, b: Partial<Pose>, t: number): Partial<Pose> => {
  const o: Partial<Pose> = {};
  for (const k of Object.keys(DEF) as (keyof Pose)[]) o[k] = lerp(a[k] ?? DEF[k], b[k] ?? DEF[k], t);
  return o;
};
const keyPose = (keys: Key[], beat: number, loop: number) => {
  const u = ((beat % loop) + loop) % loop;
  for (let i = 0; i < keys.length; i++) {
    const a = keys[i];
    const b = keys[(i + 1) % keys.length];
    const bEnd = i + 1 < keys.length ? b.b : loop + keys[0].b;
    if (u >= a.b && u < bEnd) return lerpPose(a, b, eio((u - a.b) / (bEnd - a.b)));
  }
  return lerpPose(keys[keys.length - 1], keys[0], 0);
};
const runCycle = (ph: number, k = 1): Partial<Pose> => {
  const s = Math.sin(ph * Math.PI * 2);
  const c = Math.cos(ph * Math.PI * 2);
  const sw = 55 * k;
  const legR = s * sw;
  const legL = -s * sw;
  const knee = (l: number, cc: number) => l - (20 + 70 * k * Math.max(0, -cc) + 25 * k * (l < 0 ? 1 : 0.3));
  return {torso: 12 * k, y: -Math.abs(c) * 0.03 * k, lR1: legR, lR2: knee(legR, c), lL1: legL, lL2: knee(legL, -c), aR1: -s * 60 * k, aR2: -s * 60 * k + 85, aL1: s * 60 * k, aL2: s * 60 * k + 85};
};
const walkCycle = (ph: number): Partial<Pose> => {
  const s = Math.sin(ph * Math.PI * 2);
  return {torso: 4, y: -Math.abs(Math.cos(ph * Math.PI * 2)) * 0.012, lR1: s * 28, lR2: s * 28 - 6, lL1: -s * 28, lL2: -s * 28 - 6, aR1: -s * 32, aR2: -s * 32 + 70, aL1: s * 32, aL2: s * 32 + 70};
};
const KEYS: Record<string, {keys: Key[]; loop: number}> = {
  jump: {
    loop: 4,
    keys: [
      {b: 0, torso: 4},
      {b: 1, torso: 28, y: 0.09, lR1: 50, lR2: -40, lL1: 44, lL2: -46, aR1: -50, aR2: -30, aL1: -40, aL2: -20},
      {b: 1.6, torso: 0, y: -0.22, lR1: -6, lR2: -12, lL1: -14, lL2: -20, aR1: 170, aR2: 175, aL1: 160, aL2: 170},
      {b: 2.2, torso: 10, y: -0.28, lR1: 60, lR2: -30, lL1: 50, lL2: -40, aR1: 120, aR2: 140, aL1: 110, aL2: 130},
      {b: 2.8, torso: 24, y: 0.08, lR1: 46, lR2: -40, lL1: 40, lL2: -44, aR1: 40, aR2: 70, aL1: 30, aL2: 60},
    ],
  },
  throw: {
    loop: 3,
    keys: [
      {b: 0, torso: -14, aR1: -120, aR2: -150, aL1: 90, aL2: 100, lR1: -18, lR2: -18, lL1: 26, lL2: 20},
      {b: 1.1, torso: -20, aR1: -140, aR2: -175, aL1: 100, aL2: 110, lR1: -22, lR2: -24, lL1: 30, lL2: 22},
      {b: 1.5, torso: 26, aR1: 150, aR2: 120, aL1: -30, aL2: -10, lR1: -30, lR2: -36, lL1: 34, lL2: 26},
      {b: 2.2, torso: 18, aR1: 60, aR2: 40, aL1: -40, aL2: -20, lR1: -24, lR2: -30, lL1: 20, lL2: 14},
    ],
  },
  kick: {
    loop: 2,
    keys: [
      {b: 0, torso: -6, lR1: -40, lR2: -70, lL1: 4, lL2: 4, aR1: 40, aR2: 70, aL1: -40, aL2: -20},
      {b: 0.7, torso: -18, lR1: 100, lR2: 110, lL1: 2, lL2: 0, aR1: -50, aR2: -30, aL1: 60, aL2: 80},
      {b: 1.2, torso: -10, lR1: 60, lR2: 30, aR1: -20, aR2: 0, aL1: 30, aL2: 50},
    ],
  },
  lift: {
    loop: 4,
    keys: [
      {b: 0, torso: 30, y: 0.12, lR1: 70, lR2: -10, lL1: 64, lL2: -16, aR1: 30, aR2: 20, aL1: 26, aL2: 16},
      {b: 1.4, torso: 6, y: 0, lR1: 6, lR2: 0, lL1: 2, lL2: -4, aR1: 70, aR2: 160, aL1: 66, aL2: 156},
      {b: 2, torso: 0, y: 0, aR1: 172, aR2: 178, aL1: 168, aL2: 176},
      {b: 3, torso: 0, y: 0, aR1: 174, aR2: 180, aL1: 170, aL2: 178},
    ],
  },
  wave: {
    loop: 2,
    keys: [
      {b: 0, torso: -2, aR1: 140, aR2: 160, aL1: -8, aL2: -4},
      {b: 0.5, torso: -2, aR1: 140, aR2: 120},
      {b: 1, torso: -2, aR1: 140, aR2: 165},
      {b: 1.5, torso: -2, aR1: 140, aR2: 122},
    ],
  },
  cheer: {
    loop: 2,
    keys: [
      {b: 0, y: 0.04, torso: 6, aR1: 150, aR2: 170, aL1: 150, aL2: 172, lR1: 20, lR2: -10, lL1: 16, lL2: -14},
      {b: 1, y: -0.12, torso: -4, aR1: 170, aR2: 180, aL1: 168, aL2: 178, lR1: 2, lR2: -6, lL1: -6, lL2: -12},
    ],
  },
};

const PictogramFigure: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'pictogram-figure';
  const tones = toneSet(p.hue);
  const bg = tones[1];
  const light = p.figure === 'auto' ? '#15111C' : p.figure;
  const far = mix(light, bg, p.farMix);
  const beat = ((frame / 30) * p.bpm) / 60;
  const pose: Partial<Pose> =
    p.action === 'run' ? runCycle(beat / 2) : p.action === 'walk' ? walkCycle(beat / 2) : keyPose(KEYS[p.action].keys, beat, KEYS[p.action].loop);
  const J = joints(pose);
  // layout
  const discR = Math.min(h * 0.36, w * (portrait ? 0.42 : 0.24));
  const dcx = portrait ? w / 2 : w * 0.64;
  const dcy = portrait ? h * 0.44 : h * 0.5;
  const H = discR * 1.3;
  const groundY = dcy + discR * 0.58;
  const ox = dcx - H * 0.04;
  const oy = groundY - (LEN.th + LEN.sh) * H;
  const X = (q: P): P => [ox + q[0] * H, oy + q[1] * H];
  const seg2 = (a: P, b: P, wd: number, col: string, key: string) => {
    const A = X(a);
    const B = X(b);
    return <line key={key} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={col} strokeWidth={wd * H} strokeLinecap="round" />;
  };
  const limb = (L: [P, P, P], wd: number, col: string, key: string) => [seg2(L[0], L[1], wd, col, key + 'a'), seg2(L[1], L[2], wd * 0.92, col, key + 'b')];
  const neckTop = add(J.neck, J.up, -0.02);
  const head = X(J.head);
  // assembly bands
  const bandH = 54 * u;
  const asmK = p.assemble ? oExp(seg(frame, 4, 4 + 13) * 1) : 1;
  const nb = Math.ceil((H * 1.4) / bandH) + 2;
  const top = oy - H * 0.7;
  const figure = (
    <g>
      {limb(J.lL, WID.leg, far, 'lL')}
      {limb(J.aL, WID.arm, far, 'aL')}
      {seg2(J.hip, neckTop, WID.torso, light, 'torso')}
      {limb(J.lR, WID.leg, light, 'lR')}
      {limb(J.aR, WID.arm, light, 'aR')}
      <circle cx={head[0]} cy={head[1]} r={LEN.head * H} fill={light} />
      {p.action === 'lift' && (
        (() => {
          const hand = X(J.aR[2]);
          return (
            <g>
              <rect x={hand[0] - H * 0.36} y={hand[1] - H * 0.012} width={H * 0.72} height={H * 0.024} fill={light} />
              <rect x={hand[0] - H * 0.36} y={hand[1] - H * 0.07} width={H * 0.04} height={H * 0.14} rx={H * 0.01} fill={light} />
              <rect x={hand[0] + H * 0.32} y={hand[1] - H * 0.07} width={H * 0.04} height={H * 0.14} rx={H * 0.01} fill={light} />
            </g>
          );
        })()
      )}
    </g>
  );
  const labelSize = fitW(p.label.toUpperCase(), (portrait ? 150 : 170) * u, portrait ? w * 0.86 : w * 0.4, 'tight');
  const lx = portrait ? w / 2 : w * 0.07;
  const ly = portrait ? h * 0.84 : h * 0.56;
  const tIn = oExp(seg(frame, 10, 25));
  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? 'transparent' : bg, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {p.pattern && p.background !== 'transparent' && <MotifGrid id={`${id}-grid`} frame={frame} w={w} h={h} cell={180 * u} tones={tones} spread={0.42} seed={11} sweep={false} />}
        <defs>
          <linearGradient id={`${id}-sw`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.18} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <clipPath id={`${id}-dc`}>
            <circle cx={dcx} cy={dcy} r={discR} />
          </clipPath>
          {Array.from({length: nb}, (_, i) => (
            <clipPath key={i} id={`${id}-b${i}`}>
              <rect x={0} y={top + i * bandH} width={w} height={bandH + 0.5} />
            </clipPath>
          ))}
        </defs>
        {p.disc && (
          <g>
            <circle cx={dcx} cy={dcy} r={discR * oExp(seg(frame, 0, 12))} fill={tones[4]} />
            {p.sweep && (
              <g clipPath={`url(#${id}-dc)`}>
                <rect x={dcx - discR * 2 + ((frame * 4 * u) % (discR * 4))} y={dcy - discR * 1.5} width={discR * 0.6} height={discR * 3} fill={`url(#${id}-sw)`} transform={`rotate(20 ${dcx} ${dcy})`} />
              </g>
            )}
          </g>
        )}
        <line x1={portrait ? 0 : dcx - discR * 1.5} y1={groundY} x2={w} y2={groundY} stroke={light} strokeOpacity={0.55} strokeWidth={3 * u} />
        {Array.from({length: nb}, (_, i) => {
          const off = (i % 2 ? 1 : -1) * (90 + ((i * 53) % 160)) * u * (1 - asmK);
          return (
            <g key={i} clipPath={`url(#${id}-b${i})`}>
              <g transform={`translate(${off} 0)`}>{figure}</g>
            </g>
          );
        })}
        {p.label && (
          <g opacity={tIn}>
            <text x={lx} y={ly + (1 - tIn) * 40 * u} textAnchor={portrait ? 'middle' : 'start'} fontFamily={lbf('tight')} fontWeight={900} fontSize={labelSize} letterSpacing="-0.02em" fill={light}>
              {p.label.toUpperCase()}
            </text>
            {p.meta && (
              <text x={lx} y={ly - labelSize * 0.95} textAnchor={portrait ? 'middle' : 'start'} fontFamily={lbf('dmmono')} fontWeight={500} fontSize={22 * u} letterSpacing="0.14em" fill={light}>
                {p.meta.toUpperCase()}
              </text>
            )}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const pictogramFigure = defineMotion<Props>({
  id: 'pictogram-figure',
  title: 'Pictogram figure (geometric athlete)',
  category: 'character',
  description:
    'Faceless geometric pictogram figure — round-capped bars and a disc head driven by beat-timed key poses (run, walk, jump, throw, kick, lift, wave, cheer) — far-side limbs tinted toward the background, standing on a big sun disc with a light sweep over a low-contrast motif grid, assembled from horizontal bands that slide into register.',
  source: ['lemo-opuscar styles/pictogram-motion (MIT code, CC BY 4.0 docs, LemoLab) — demo/engine.js joints/drawFigure/keyPose/runCycle/walkCycle'],
  useFor: '"Person doing X" icon animation for explainers, onboarding, sports, workplace steps, fitness and safety instructions — any brand colour, no character design needed.',
  durationInFrames: 180,
  defaultProps: {
    action: 'run',
    bpm: 150,
    hue: '#D8B21A',
    figure: 'auto',
    farMix: 0.42,
    disc: true,
    sweep: true,
    assemble: true,
    label: 'Sprint',
    meta: '06 / 43',
    pattern: true,
    background: 'tone',
  },
  propDocs: {
    action: 'run | walk | jump | throw | kick | lift | wave | cheer',
    bpm: 'tempo; key poses are timed in beats',
    hue: 'chapter hue (five tones derived from it)',
    figure: 'figure colour ("auto" = dark ink)',
    farMix: 'how far the far-side limbs mix toward the background',
    disc: 'big sun disc behind the figure',
    sweep: 'light sweep across the disc',
    assemble: 'arrive by horizontal bands sliding into register',
    label: 'big title beside the figure ("" to hide)',
    meta: 'mono index line above the title',
    pattern: 'low-contrast motif grid in the background',
    background: '"tone" or "transparent"',
  },
  component: PictogramFigure,
  tags: ['pictogram', 'figure', 'stick figure', 'athlete', 'sports', 'run', 'jump', 'icon', 'person', 'geometric', 'faceless', 'fitness', 'safety', 'instructions'],
});
