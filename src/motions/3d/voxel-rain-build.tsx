import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {rng} from '../../core/random';
import {PlinthStudio, phaseAt, placedInverse, resolveVoxelCells, VOXEL, VoxelHud, VoxelInstances, voxelOrder, type VoxelPhase, type VoxelPose} from '../../core/r2-x14-kit';
import {defineMotion} from '../../core/types';

/**
 * x1 0.25–3.30 s: a voxel model assembles itself from ~1.1 k rounded cubes that rain from above the frame
 * (easeInQuad gravity, 0.85x in flight, tiny spin and x/z jitter resolving on landing, 1.06 settle), bottom-up
 * and shuffled within each layer; placement starts slow then runs linear. The plinth's notch ring fills with
 * the placed fraction and a mono dev HUD counts the voxels. Then the creature blinks and looks around.
 */

type Props = {
  preset: string;
  cells: number[][];
  voxelColor: string;
  eyeColor: string;
  background: string;
  plinthColor: string;
  accent: string;
  buildStart: number;
  buildFrames: number;
  fallFrames: number;
  dropHeight: number;
  order: string;
  seed: number;
  hud: boolean;
  unit: string;
  subline: string;
  ring: boolean;
};

const VoxelRainBuild: React.FC<Props> = ({preset, cells, voxelColor, eyeColor, background, plinthColor, accent, buildStart, buildFrames, fallFrames, dropHeight, order, seed, hud, unit, subline, ring}) => {
  const f = useCurrentFrame();
  const model = useMemo(() => resolveVoxelCells(cells, preset), [cells, preset]);
  const N = model.length;
  const rank = useMemo(() => voxelOrder(model, order, seed), [model, order, seed]);
  const jit = useMemo(() => {
    const r = rng(seed + 17);
    return model.map(() => ({jx: (r() - 0.5) * 0.3, jz: (r() - 0.5) * 0.3, sp: (r() - 0.5) * 0.7, ax: r(), dh: r()}));
  }, [model, seed]);
  const eyeRows = useMemo(() => {
    const ys = model.filter((c) => c[3] === 1).map((c) => c[1]);
    return ys.length ? [Math.min(...ys), Math.max(...ys)] : [1e9, 1e9];
  }, [model]);
  const midX = useMemo(() => {
    const xs = model.map((c) => c[0]);
    const zs = model.map((c) => c[2]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
  }, [model]);

  const buildEnd = buildStart + buildFrames;
  // blinks: close 2 f, hold 2 f, open 2 f (x1: 3 / 4 / 4 frames @60)
  const blinkAt = [buildEnd + 9, buildEnd + 40];
  const closed = blinkAt.some((b) => f >= b && f < b + 5);
  const lookT = clamp((f - (buildEnd + 22)) / 36);
  const yaw = f > buildEnd + 22 ? Math.sin(lookT * Math.PI * 2) * 0.24 * ease.sine(Math.min(1, lookT * 3)) : 0;

  let landed = 0;
  const poses: VoxelPose[] = model.map((c, i) => {
    const landF = buildStart + placedInverse(rank[i] / Math.max(1, N - 1)) * buildFrames;
    const startF = landF - fallFrames;
    const x = c[0] - midX[0];
    const z = c[2] - midX[1];
    let col = c[3];
    if (closed && col === 1 && (c[1] === eyeRows[1] || (eyeRows[1] - eyeRows[0] >= 2 && c[1] === eyeRows[0]))) col = 0;
    if (f < startF) return {p: [0, -999, 0], s: 0, c: col};
    const j = jit[i];
    if (f < landF) {
      const uu = (f - startF) / fallFrames;
      const fall = 1 - uu * uu; // easeInQuad gravity
      const dh = dropHeight * (0.9 + 0.2 * j.dh);
      return {p: [x + j.jx * fall, c[1] + 0.5 + dh * fall, z + j.jz * fall], r: [j.sp * fall, j.sp * 0.6 * fall, j.sp * 0.4 * fall], s: 0.85 + 0.15 * (1 - fall), c: col};
    }
    landed++;
    const settle = 1 + 0.06 * Math.sin(Math.PI * clamp((f - landF) / 2.5));
    return {p: [x, c[1] + 0.5, z], s: settle, c: col};
  });

  const phases: VoxelPhase[] = [
    {from: 0, label: 'READY', color: '#111111'},
    {from: buildStart, label: 'BUILD'},
    {from: buildEnd, label: 'BLINK'},
    {from: buildEnd + 22, label: 'LOOK'},
  ];
  const ph = phaseAt(phases, f);

  return (
    <AbsoluteFill>
      <PlinthStudio bg={background} plinthColor={plinthColor} ringColor={accent} progress={landed / N} showRing={ring}>
        <group rotation={[0, yaw, 0]}>
          <VoxelInstances poses={poses} colors={[voxelColor, eyeColor]} />
        </group>
      </PlinthStudio>
      {hud && (
        <VoxelHud
          value={landed}
          total={N}
          unit={unit}
          subline={subline}
          badge={ph.label}
          badgeColor={ph.color ?? VOXEL.badge}
          frameText={`${String(f).padStart(3, '0')} / ${String(buildEnd + 52).padStart(3, '0')}`}
        />
      )}
    </AbsoluteFill>
  );
};

export const voxelRainBuild = defineMotion<Props>({
  id: 'voxel-rain-build',
  title: 'Voxel rain build',
  category: '3d',
  description:
    'Clay-studio three.js scene: ~1.1 k rounded orange cubes rain from above the frame and stack bottom-up into an original voxel creature on a round white plinth, while the plinth notch ring fills and a mono HUD counts the voxels; the creature then blinks and looks around.',
  source: ['video x1 0:00.25-0:03.30 (build), 0:03.25-0:07.25 (blink / look)'],
  useFor: 'An "assembling the product / team / feature" beat, a loader that builds a mascot or logo, or the opening of a voxel-studio loop.',
  durationInFrames: 150,
  defaultProps: {
    preset: 'critter',
    cells: [],
    voxelColor: VOXEL.voxel,
    eyeColor: VOXEL.eye,
    background: VOXEL.bg,
    plinthColor: VOXEL.plinth,
    accent: VOXEL.accent,
    buildStart: 15,
    buildFrames: 83,
    fallFrames: 15,
    dropHeight: 32,
    order: 'bottom-up',
    seed: 7,
    hud: true,
    unit: 'VOXELS',
    subline: 'VOXEL STUDIO / BUILD / 5 S',
    ring: true,
  },
  propDocs: {
    preset: "built-in model: 'critter' (original voxel creature) | 'cube' | 'heart'",
    cells: 'custom model as [[x,y,z,colourSlot],...] (y up, +z faces camera, slot 0 body / 1 eyes); overrides preset',
    voxelColor: 'body voxel colour (slot 0)',
    eyeColor: 'eye / detail voxel colour (slot 1)',
    background: 'studio backdrop centre colour',
    plinthColor: 'plinth colour',
    accent: 'lit notch colour of the progress ring',
    buildStart: 'frame the first voxel lands',
    buildFrames: 'frames from first to last landing',
    fallFrames: 'fall time of one voxel (easeInQuad)',
    dropHeight: 'how far (in voxels) each cube falls',
    order: "'bottom-up' | 'random' | 'radial'",
    seed: 'shuffle / jitter seed',
    hud: 'show the mono counter + phase badge HUD',
    unit: 'counter unit word',
    subline: 'grey HUD sub-line',
    ring: 'show the notch progress ring',
  },
  component: VoxelRainBuild,
  tags: ['voxel', 'build', 'assemble', 'cubes', 'rain', 'mascot', 'creature', 'three.js', '3d', 'clay', 'studio', 'plinth', 'loader', 'progress', 'counter', 'hud', 'logo-build', 'product', 'voxel-studio'],
});
