// Technique after mg-styles-15/demos/04-3d-render/blender/sim.py (sweep / ring / wave_height; MIT, © Vincentwei1021)
// — see THIRD_PARTY_NOTICES.md. Own implementation with three.js InstancedMesh.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {CameraRig, Stage3D} from '../../core/three-kit';
import {CANDY, CandyLights, PillField, Ripple, Sweep, bedHeight} from '../../core/r2-mg1-kit';
import {defineMotion} from '../../core/types';

type Props = {
  background: string;
  capColor: string;
  bodyColor: string;
  rimColor: string;
  cols: number;
  rows: number;
  sweeps: number;
  sweepEvery: number;
  impacts: {x: number; z: number; at: number; amp: number}[];
  amp: number;
  camera: 'low' | 'high' | 'macro';
  grain: boolean;
  seed: number;
};

const ClonerBedRipple: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {portrait} = useStage();
  const t = frame / 30;
  const cols = Math.round(p.cols * (portrait ? 0.72 : 1));
  const rows = Math.round(p.rows * (portrait ? 1.35 : 1));
  const sweeps: Sweep[] = React.useMemo(
    () =>
      Array.from({length: Math.max(0, p.sweeps)}, (_, k) => ({
        at: 0.4 + k * p.sweepEvery,
        dir: k % 2 ? [1, 0.45] : [1, -0.3],
        speed: 3.4,
        sigma: 0.8,
        amp: 0.26 * p.amp,
      })),
    [p.sweeps, p.sweepEvery, p.amp],
  );
  const ripples: Ripple[] = React.useMemo(
    () => (p.impacts ?? []).map((im) => ({x: im.x, z: im.z, at: im.at, amp: im.amp * p.amp, c: 3.8, lambda: 1.05, decay: 0.95})),
    [p.impacts, p.amp],
  );
  const heightAt = React.useCallback((x: number, z: number) => bedHeight(x, z, t, sweeps, ripples), [t, sweeps, ripples]);
  const sample = React.useCallback((x: number, z: number) => ({y: Math.max(-0.1, heightAt(x, z))}), [heightAt]);

  const cam: {pos: [number, number, number]; tgt: [number, number, number]; fov: number} =
    p.camera === 'macro'
      ? {pos: [2.5, 1.6, 9], tgt: [0, 0.2, 0], fov: 32}
      : p.camera === 'high'
        ? {pos: [0, 15, 12], tgt: [0, 0, 0], fov: 34}
        : {pos: [4 - t * 0.06, 7.2, 12.5], tgt: [0, -0.4, -2.5], fov: portrait ? 42 : 34};

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, ${p.background} 0%, ${CANDY.grade} 115%)`}}>
      <Stage3D shadows="soft">
        <CameraRig position={cam.pos} target={cam.tgt} fov={cam.fov} />
        <CandyLights rim={p.rimColor} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]} receiveShadow>
          <planeGeometry args={[90, 90]} />
          <meshLambertMaterial color={p.background} />
        </mesh>
        <PillField cols={cols} rows={rows} capColor={p.capColor} bodyColor={p.bodyColor} frame={frame} sample={sample} tiltFrom={heightAt} />
      </Stage3D>
      {p.grain && <FilmGrain opacity={0.06} />}
      <Vignette strength={0.28} color="42,24,48" />
    </AbsoluteFill>
  );
};

export const clonerBedRipple = defineMotion<Props>({
  id: 'cloner-bed-ripple',
  title: 'Cloner bed ripple',
  category: '3d',
  description:
    'A dense pin-art bed of glossy two-tone candy capsules in soft pastel studio light; effector bands roll across it raising and tilting the pills along the height gradient, and timed impacts send damped ripple rings racing outward — a satisfying C4D-cloner ASMR field.',
  source: ['mg-styles-15 04-3d-render 0.0-5.5 s, blender/sim.py sweep/ring/wave_height (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'Satisfying backdrop or floor for product idents, logo stings and hero sections; pair with jelly-type-drop for the full candy ident.',
  durationInFrames: 240,
  defaultProps: {
    background: '#F1E4EC',
    capColor: '#EBDCCD',
    bodyColor: '#C6B9F3',
    rimColor: '#FF6FAE',
    cols: 76,
    rows: 56,
    sweeps: 3,
    sweepEvery: 2.2,
    impacts: [
      {x: -3, z: 1, at: 1.6, amp: 0.7},
      {x: 4, z: -2, at: 4.2, amp: 0.85},
      {x: 0, z: 0, at: 6.4, amp: 1.05},
    ],
    amp: 1,
    camera: 'low',
    grain: true,
    seed: 1,
  },
  propDocs: {
    background: 'cyc / floor colour',
    capColor: 'capsule top colour (cream)',
    bodyColor: 'capsule flipped/under colour (lilac)',
    rimColor: 'pink rim-light colour',
    cols: 'pills across',
    rows: 'pills deep',
    sweeps: 'how many effector bands roll through',
    sweepEvery: 'seconds between sweep bands',
    impacts: 'ripple sources: {x, z, at (s), amp}',
    amp: 'global height multiplier',
    camera: 'low 3/4 (dolly) | high | macro',
    grain: 'film grain + vignette finish',
    seed: 'pill jitter seed',
  },
  component: ClonerBedRipple,
  tags: ['cloner', 'pills', 'capsules', 'pin art', 'ripple', 'wave', 'sweep', 'asmr', 'candy', 'soft 3d', 'pastel', 'c4d', 'ident', 'background', 'three.js', 'instanced', 'mg-styles-15', 'soft-3d-candy'],
});
