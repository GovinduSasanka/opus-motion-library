import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {PlinthStudio, VOXEL, VoxelInstances, resolveVoxelCells, voxelOrder, type VoxelPose} from '../../core/r2-x14-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * x1 0.5-3.3 s + 9.3-11.0 s: the round studio plinth carries a ring of ~120 notches near its top edge. As the model
 * is placed the notches light orange one by one, clockwise from the front-left (a radial progress bar that is part
 * of the set); they stay lit while the model exists and drain back to grey while it lifts away.
 */
type Props = {
  progress: number;
  count: number;
  preset: string;
  cells: number[][];
  modelColor: string;
  accent: string;
  idleColor: string;
  background: string;
  plinthColor: string;
  fillStart: number;
  fillFrames: number;
  holdFrames: number;
  liftFrames: number;
  drain: boolean;
  percent: boolean;
  label: string;
  seed: number;
};

const PlinthProgressRing: React.FC<Props> = ({progress, count, preset, cells, modelColor, accent, idleColor, background, plinthColor, fillStart, fillFrames, holdFrames, liftFrames, drain, percent, label, seed}) => {
  const f = useCurrentFrame();
  const {u, h} = useStage();
  const model = useMemo(() => resolveVoxelCells(cells, preset), [cells, preset]);
  const N = model.length;
  const rank = useMemo(() => voxelOrder(model, 'bottom-up', seed), [model, seed]);
  const mid = useMemo(() => {
    const xs = model.map((c) => c[0]);
    const zs = model.map((c) => c[2]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
  }, [model]);

  const auto = progress < 0;
  const fillEnd = fillStart + fillFrames;
  const liftStart = fillEnd + holdFrames;
  const fillT = clamp((f - fillStart) / Math.max(1, fillFrames));
  const liftT = drain ? clamp((f - liftStart) / Math.max(1, liftFrames)) : 0;
  const fillP = auto ? fillT : clamp(progress);
  const p = auto ? fillP * (1 - ease.inOut(liftT)) : fillP;
  const placedP = auto ? fillP : clamp(progress);
  const lift = ease.in(liftT);

  const pulse = auto && f >= fillEnd && f < fillEnd + 10 ? Math.sin(((f - fillEnd) / 10) * Math.PI) : 0;

  const poses: VoxelPose[] = model.map((c, i) => {
    const landP = (rank[i] + 1) / N;
    const landF = landP <= placedP ? 1 : 0;
    if (!landF) return {p: [0, -999, 0], s: 0, c: c[3]};
    // pop-in: scale 0 -> 1.06 -> 1 around the moment the placed fraction passes this voxel
    const age = auto ? (f - (fillStart + landP * fillFrames)) : 99;
    const pop = age < 5 ? ease.back(clamp(age / 5)) : 1;
    const rise = age < 5 ? (1 - clamp(age / 5)) * 2.2 : 0;
    return {p: [c[0] - mid[0], c[1] + 0.5 + rise + lift * 46, c[2] - mid[1]], s: Math.max(0.01, pop) * (1 - lift * 0.55), c: c[3]};
  });

  const pct = Math.round(p * 100);
  return (
    <AbsoluteFill>
      <PlinthStudio bg={background} plinthColor={plinthColor} ringColor={accent} ringIdle={idleColor} ringCount={count} progress={p + pulse * 0.0}>
        <VoxelInstances poses={poses} colors={[modelColor, VOXEL.eye]} />
      </PlinthStudio>
      {percent ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.06, textAlign: 'center', fontFamily: fonts.mono, fontSize: 28 * u, letterSpacing: 4 * u, color: VOXEL.muted}}>
          {label} <span style={{color: p > 0.001 ? accent : VOXEL.muted}}>{String(pct).padStart(3, '0')}%</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const plinthProgressRing = defineMotion<Props>({
  id: 'plinth-progress-ring',
  title: 'Plinth progress ring',
  category: '3d',
  description:
    'A round matte studio plinth whose ~120-notch ring lights orange clockwise as a clay-voxel model is placed, stays lit while the model exists and drains grey while it lifts away: a progress / loading indicator that lives in the scene.',
  source: ['video x1 0:00.5-0:03.3 (fill), 0:09.3-0:11.0 (drain)'],
  useFor: 'A loading / unlocking / onboarding-step indicator on a product pedestal; bind `progress` (0..1) to a counter, or leave it at -1 to auto-run fill, hold and drain.',
  durationInFrames: 170,
  defaultProps: {
    progress: -1,
    count: 120,
    preset: 'critter',
    cells: [],
    modelColor: '#E0764C',
    accent: VOXEL.accent,
    idleColor: VOXEL.notch,
    background: VOXEL.bg,
    plinthColor: VOXEL.plinth,
    fillStart: 12,
    fillFrames: 90,
    holdFrames: 22,
    liftFrames: 36,
    drain: true,
    percent: true,
    label: 'PLACING',
    seed: 7,
  },
  propDocs: {
    progress: 'ring fill 0..1 (model builds to this fraction); -1 = automatic fill, hold, drain',
    count: 'number of notches on the ring',
    preset: "built-in voxel model: 'critter' | 'heart' | 'cube'",
    cells: 'custom model [[x,y,z,slot],...] (overrides preset)',
    modelColor: 'voxel colour',
    accent: 'lit notch colour',
    idleColor: 'unlit notch colour',
    background: 'studio backdrop colour',
    plinthColor: 'plinth colour',
    fillStart: 'frame the fill starts (auto mode)',
    fillFrames: 'frames to fill the ring (auto mode)',
    holdFrames: 'frames the full ring is held before the lift',
    liftFrames: 'frames of the lift / drain',
    drain: 'lift the model away and drain the ring at the end (loop seam)',
    percent: 'show the small mono percentage readout',
    label: 'readout label word',
    seed: 'voxel placement shuffle seed',
  },
  component: PlinthProgressRing,
  tags: ['progress', 'ring', 'plinth', 'loader', 'loading', 'notch', 'radial', 'studio', 'voxel', 'three.js', '3d', 'unlock', 'pedestal', 'product', 'counter', 'clay'],
});
