import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {clamp, lerp} from '../../core/ease';
import {rng} from '../../core/random';
import {PlinthStudio, phaseAt, resolveVoxelCells, VOXEL, VoxelHud, VoxelInstances, type VoxelPhase, type VoxelPose} from '../../core/r2-x14-kit';
import {defineMotion} from '../../core/types';
import type {V3} from '../../core/three-kit';

/**
 * x1 7.2–11.1 s: the finished voxel creature shatters into its cubes, which fly mostly horizontally into a thick
 * tumbling ring around the plinth (easeOutCubic), orbit it (≈ 50°/s, slow bob) with the black eye voxels still
 * readable inside the cloud, then the cloud lifts top-first and accelerates out of the top of frame (easeInCubic)
 * while the notch ring drains — leaving the empty plinth (a seamless loop seam). Exits: lift | fall | scatter |
 * reassemble; `reverse` plays it backwards as a "cloud gathers into the creature" intro.
 */

type Props = {
  preset: string;
  cells: number[][];
  voxelColor: string;
  eyeColor: string;
  background: string;
  plinthColor: string;
  accent: string;
  burstAt: number;
  burstFrames: number;
  orbitFrames: number;
  orbitSpeed: number;
  liftFrames: number;
  ringRadius: number;
  ringHeight: number;
  tumble: number;
  exit: string;
  reverse: boolean;
  seed: number;
  hud: boolean;
  unit: string;
  subline: string;
};

const outCubic = Easing.out(Easing.cubic);
const inCubic = Easing.in(Easing.cubic);
const inOutCubic = Easing.inOut(Easing.cubic);

const VoxelBurstSwirl: React.FC<Props> = (p) => {
  const {preset, cells, voxelColor, eyeColor, background, plinthColor, accent, burstAt, burstFrames, orbitFrames, orbitSpeed, liftFrames, ringRadius, ringHeight, tumble, exit, reverse, seed, hud, unit, subline} = p;
  const frame = useCurrentFrame();
  const liftStart = burstAt + burstFrames + orbitFrames;
  const liftEnd = liftStart + liftFrames;
  const total = liftEnd + 20;
  const f = reverse ? Math.max(0, total - 1 - frame) : frame;

  const model = useMemo(() => resolveVoxelCells(cells, preset), [cells, preset]);
  const N = model.length;
  const bounds = useMemo(() => {
    const xs = model.map((c) => c[0]);
    const ys = model.map((c) => c[1]);
    const zs = model.map((c) => c[2]);
    return {mx: (Math.min(...xs) + Math.max(...xs)) / 2, mz: (Math.min(...zs) + Math.max(...zs)) / 2, y0: Math.min(...ys), y1: Math.max(...ys)};
  }, [model]);
  const rnd = useMemo(() => {
    const r = rng(seed);
    return model.map((c) => {
      const x = c[0] - bounds.mx;
      const z = c[2] - bounds.mz;
      const yn = (c[1] - bounds.y0) / Math.max(1, bounds.y1 - bounds.y0);
      const ax = r() - 0.5;
      const ay = r() - 0.5;
      const az = r() - 0.5;
      const al = Math.hypot(ax, ay, az) || 1;
      return {
        th: Math.atan2(z, x || 0.001) + (r() - 0.5) * 1.6,
        rr: 0.7 + 0.6 * r(),
        hy: lerp(r() - 0.5, yn - 0.5, 0.45),
        axis: [ax / al, ay / al, az / al] as V3,
        w: ((90 + 270 * r()) * Math.PI) / 180 / 30, // 90–360 °/s
        ph: r() * Math.PI * 2,
        yn,
        fall: r(),
      };
    });
  }, [model, bounds, seed]);

  const om = (orbitSpeed * Math.PI) / 180 / 30;
  const burstK = outCubic(clamp((f - burstAt) / burstFrames));
  const liftG = clamp((f - liftStart) / liftFrames);
  const R = ringRadius;
  const centreY = 10;

  const poses: VoxelPose[] = model.map((c, i) => {
    const q = rnd[i];
    const home: V3 = [c[0] - bounds.mx, c[1] + 0.5, c[2] - bounds.mz];
    if (f < burstAt) return {p: home, c: c[3]};
    const tb = f - burstAt;
    const th = q.th + om * tb;
    const bob = Math.sin(tb * 0.09 + q.ph) * 0.35;
    const ring: V3 = [Math.cos(th) * R * q.rr, centreY + q.hy * 24 * ringHeight + bob, Math.sin(th) * R * q.rr];
    let pos: V3 = [lerp(home[0], ring[0], burstK), lerp(home[1], ring[1], burstK), lerp(home[2], ring[2], burstK)];
    const ang = q.w * tb * tumble;
    let rot: V3 = [q.axis[0] * ang, q.axis[1] * ang, q.axis[2] * ang];
    let s = 1;
    // exits (each voxel delayed so the top of the cloud leads by ≈ 0.3 s)
    const lu = clamp((f - liftStart + 9 * q.yn) / (liftFrames - 9));
    if (lu > 0) {
      if (exit === 'fall') {
        const k = Easing.in(Easing.quad)(lu);
        pos = [pos[0] * (1 + 0.3 * k), pos[1] - 70 * k, pos[2] * (1 + 0.3 * k)];
      } else if (exit === 'scatter') {
        const k = inCubic(lu);
        pos = [pos[0] * (1 + 3.5 * k), pos[1] + (pos[1] - centreY) * 2 * k, pos[2] * (1 + 3.5 * k)];
        s = 1 - k;
      } else if (exit === 'reassemble') {
        const k = inOutCubic(clamp((f - liftStart - 9 * (1 - q.yn)) / (liftFrames - 9)));
        pos = [lerp(pos[0], home[0], k), lerp(pos[1], home[1], k), lerp(pos[2], home[2], k)];
        rot = [rot[0] * (1 - k), rot[1] * (1 - k), rot[2] * (1 - k)];
      } else {
        pos = [pos[0], pos[1] + 75 * inCubic(lu), pos[2]];
      }
    }
    return {p: pos, r: rot, s, c: c[3]};
  });

  const reform = exit === 'reassemble';
  const progress = reform ? 1 : f < liftStart ? 1 : 1 - liftG;
  const counter = f < burstAt ? N : reform && f >= liftEnd ? N : reform ? Math.round(N * clamp((f - liftStart) / liftFrames)) : 0;
  const phases: VoxelPhase[] = reverse
    ? [
        {from: 0, label: 'READY', color: '#111111'},
        {from: total - liftEnd, label: 'GATHER'},
        {from: total - liftStart, label: 'SWIRL'},
        {from: total - burstAt - burstFrames, label: 'BUILD'},
        {from: total - burstAt, label: 'READY', color: '#111111'},
      ]
    : [
        {from: 0, label: 'LOOK'},
        {from: burstAt, label: 'BURST'},
        {from: burstAt + burstFrames, label: 'SWIRL'},
        {from: liftStart, label: exit === 'reassemble' ? 'REBUILD' : exit === 'fall' ? 'FALL' : exit === 'scatter' ? 'SCATTER' : 'LIFT'},
        {from: liftEnd, label: reform ? 'LOOK' : 'READY', color: reform ? undefined : '#111111'},
      ];
  const ph = phaseAt(phases, frame);

  return (
    <AbsoluteFill>
      <PlinthStudio bg={background} plinthColor={plinthColor} ringColor={accent} progress={progress} portraitFit={0.6}>
        <VoxelInstances poses={poses} colors={[voxelColor, eyeColor]} />
      </PlinthStudio>
      {hud && (
        <VoxelHud
          value={counter}
          total={N}
          unit={unit}
          subline={subline}
          badge={ph.label}
          badgeColor={ph.color ?? VOXEL.badge}
          frameText={`${String(frame).padStart(3, '0')} / ${String(total).padStart(3, '0')}`}
        />
      )}
    </AbsoluteFill>
  );
};

export const voxelBurstSwirl = defineMotion<Props>({
  id: 'voxel-burst-swirl',
  title: 'Voxel burst swirl',
  category: '3d',
  description:
    'Clay-studio three.js scene: an original voxel creature on a round plinth shatters into ~1.1 k tumbling cubes that fly into a thick ring, orbit the plinth with the black eye voxels still readable, then fly back and reassemble into the creature so the clip ends on a finished, loopable frame (exit=lift sends the cloud up and out leaving the empty stage; also fall / scatter).',
  source: ['video x1 0:07.2-0:11.1 (burst, swirl, lift)'],
  useFor: 'A dramatic "disrupt / transform / remix" beat, data turning into particles, or a loop outro that returns to the empty stage; reverse it for a gather-in intro.',
  durationInFrames: 135,
  defaultProps: {
    preset: 'critter',
    cells: [],
    voxelColor: VOXEL.voxel,
    eyeColor: VOXEL.eye,
    background: VOXEL.bg,
    plinthColor: VOXEL.plinth,
    accent: VOXEL.accent,
    burstAt: 12,
    burstFrames: 15,
    orbitFrames: 37,
    orbitSpeed: 50,
    liftFrames: 52,
    ringRadius: 15,
    ringHeight: 1,
    tumble: 1,
    exit: 'reassemble',
    reverse: false,
    seed: 11,
    hud: true,
    unit: 'VOXELS',
    subline: 'VOXEL STUDIO / BURST / 4.5 S',
  },
  propDocs: {
    preset: "built-in model: 'critter' (original voxel creature) | 'cube' | 'heart'",
    cells: 'custom model as [[x,y,z,colourSlot],...] (y up, +z faces camera); overrides preset',
    voxelColor: 'body voxel colour',
    eyeColor: 'eye / detail voxel colour',
    background: 'studio backdrop centre colour',
    plinthColor: 'plinth colour',
    accent: 'lit notch colour of the ring',
    burstAt: 'frame the model shatters',
    burstFrames: 'explosion length (easeOutCubic)',
    orbitFrames: 'how long the cloud orbits before the exit',
    orbitSpeed: 'orbit speed in degrees per second',
    liftFrames: 'exit length (top of the cloud leads by 9 frames)',
    ringRadius: 'mean ring radius in voxels (plinth radius = 14)',
    ringHeight: 'vertical thickness multiplier of the cloud',
    tumble: 'cube tumble speed multiplier (90–360 °/s at 1)',
    exit: "'lift' | 'fall' | 'scatter' | 'reassemble'",
    reverse: 'play backwards: the cloud gathers into the creature (intro)',
    seed: 'cloud layout seed',
    hud: 'show the mono counter + phase badge HUD',
    unit: 'counter unit word',
    subline: 'grey HUD sub-line',
  },
  component: VoxelBurstSwirl,
  tags: ['voxel', 'burst', 'explode', 'shatter', 'swirl', 'orbit', 'ring', 'lift', 'cubes', 'particles', 'tumble', 'mascot', 'three.js', '3d', 'clay', 'studio', 'plinth', 'loop', 'outro', 'transform', 'voxel-studio'],
});
