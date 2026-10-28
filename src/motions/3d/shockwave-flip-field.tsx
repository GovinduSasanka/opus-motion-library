// Technique after mg-styles-15/demos/04-3d-render/blender/sim.py + cues.json (ball hang / slam / shock front;
// MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md. Own implementation with three.js InstancedMesh.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {CameraRig, Stage3D} from '../../core/three-kit';
import {CANDY, CandyLights, PillField, PillSample, clamp01, hs, inv} from '../../core/r2-mg1-kit';
import {defineMotion} from '../../core/types';

type Props = {
  background: string;
  capColor: string;
  flipColor: string;
  ballColor: string;
  rimColor: string;
  impactAt: number;
  impact: number[];
  speed: number;
  flingRatio: number;
  slowMo: boolean;
  cols: number;
  rows: number;
  grain: boolean;
  seed: number;
};

const ShockwaveFlipField: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {portrait} = useStage();
  const raw = frame / 30;
  // slow-mo apex 0.35x shortly after the hit, then catch-up <= 1.35x (time-remap)
  const T0 = p.impactAt;
  const remap = (tt: number) => {
    if (!p.slowMo || tt < T0 + 0.25) return tt;
    const a = T0 + 0.25;
    const b = a + 0.5; // slow window (real time)
    const c = b + 1.1; // catch-up window
    if (tt < b) return a + (tt - a) * 0.35;
    const slowEnd = a + 0.5 * 0.35;
    if (tt < c) {
      const q = (tt - b) / (c - b);
      const target = c;
      return slowEnd + (target - slowEnd) * (q * q * (3 - 2 * q) * 0.6 + q * 0.4);
    }
    return tt;
  };
  const t = remap(raw);
  const ix = p.impact?.[0] ?? 0;
  const iz = p.impact?.[1] ?? 0;
  const tau = t - T0;

  // chrome ball: enter, hang, slam
  const enterT = T0 - 1.1;
  const hangY = 6.2;
  let ballY = 99;
  let ballX = ix;
  if (t > enterT) {
    if (t < T0 - 0.18) {
      const q = clamp01((t - enterT) / (T0 - 0.18 - enterT));
      ballY = 12 - (12 - hangY) * (1 - (1 - q) * (1 - q));
      ballX = ix + (1 - q) * 3;
    } else if (t < T0) {
      const q = (t - (T0 - 0.18)) / 0.18;
      ballY = hangY * (1 - q * q);
    } else {
      ballY = 1.05 - Math.min(0.45, tau * 2);
    }
  }

  const sample = React.useCallback(
    (x: number, z: number, sd: number): PillSample => {
      const r = Math.hypot(x - ix, z - iz);
      const arrive = r / p.speed;
      const local = tau - arrive;
      if (local <= 0) {
        // pre-hit: faint tremble as the ball hangs
        const tr = t > T0 - 1 && t < T0 ? 0.015 * Math.sin(t * 40 + sd * 20) : 0;
        return {y: tr};
      }
      const fling = sd < p.flingRatio / (1 + r / 3);
      const amp = Math.min(2.6, 2.2 / (0.6 + r * 0.35)) * (0.7 + 0.6 * sd);
      const flight = 0.5 + 0.25 * sd;
      if (fling && local < 2.5) {
        // fly off frame: ballistic with stronger kick, keep flying
        const vy = amp * 7;
        const y = vy * local - 14 * local * local;
        if (y < -3) return {hide: true, y: 0};
        const away = Math.atan2(z - iz, x - ix);
        return {y: Math.max(0, y), rx: local * 9 * (sd - 0.5), rz: local * 7 * (0.5 - sd), flip: 1, s: 1};
      }
      if (local < flight) {
        const q = local / flight;
        const y = amp * 4 * q * (1 - q) * 0.45;
        return {y, rx: Math.PI * q * (sd < 0.5 ? 1 : -1), flip: q, s: 1};
      }
      // landed flipped, small settle
      const st = local - flight;
      const settle = 0.06 * Math.exp(-st / 0.1) * Math.cos(st * 34);
      return {y: Math.max(0, settle), flip: 1};
    },
    [tau, ix, iz, p.speed, p.flingRatio, t, T0],
  );

  const cols = Math.round(p.cols * (portrait ? 0.72 : 1));
  const rows = Math.round(p.rows * (portrait ? 1.35 : 1));
  const kick = tau > 0 ? 0.3 * Math.exp(-tau * 6) * Math.cos(tau * 22) : 0;
  const cam: [number, number, number] = [4.5, 7.6 + kick * 0.4, 11.8];
  const flash = tau > 0 ? 0.35 * Math.exp(-tau * 10) : 0;

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, ${p.background} 0%, ${CANDY.grade} 115%)`}}>
      <Stage3D shadows="soft">
        <CameraRig position={cam} target={[0, -0.6 + kick * 0.2, -2]} fov={portrait ? 42 : 34} />
        <CandyLights rim={p.rimColor} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
          <planeGeometry args={[90, 90]} />
          <meshLambertMaterial color={p.background} />
        </mesh>
        <PillField cols={cols} rows={rows} capColor={p.capColor} bodyColor={p.flipColor} frame={frame} sample={sample} />
        {ballY < 20 && (
          <mesh position={[ballX, ballY, iz]} castShadow>
            <sphereGeometry args={[1.05, 48, 32]} />
            <meshStandardMaterial color={p.ballColor} metalness={0.45} roughness={0.08} envMapIntensity={1} />
          </mesh>
        )}
      </Stage3D>
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
      {p.grain && <FilmGrain opacity={0.06} />}
      <Vignette strength={0.28} color="42,24,48" />
    </AbsoluteFill>
  );
};

export const shockwaveFlipField = defineMotion<Props>({
  id: 'shockwave-flip-field',
  title: 'Shockwave flip field',
  category: '3d',
  description:
    'A heavy chrome ball glides in, hangs for a beat, then slams into a bed of two-tone candy capsules: a shock front races outward and every pill it reaches leaps, tumbles half a turn and lands showing its other colour — the whole field recolours as the ring passes, nearby pills fly off frame, the camera kicks and the moment plays in brief slow motion.',
  source: ['mg-styles-15 04-3d-render 5.6-7.8 s, blender/sim.py + cues.json ball/shock (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'A hero "state change" beat: brand colour takeover, before/after, launch moments; strong for idents and thumbnails.',
  durationInFrames: 180,
  defaultProps: {
    background: '#F1E4EC',
    capColor: '#EBDCCD',
    flipColor: '#C6B9F3',
    ballColor: '#C9CAD6',
    rimColor: '#FF6FAE',
    impactAt: 1.6,
    impact: [0, -1],
    speed: 5,
    flingRatio: 0.35,
    slowMo: true,
    cols: 76,
    rows: 56,
    grain: true,
    seed: 1,
  },
  propDocs: {
    background: 'cyc colour',
    capColor: 'pill colour before the flip (cream)',
    flipColor: 'pill colour after the flip (the takeover colour)',
    ballColor: 'chrome ball tint',
    rimColor: 'pink rim-light colour',
    impactAt: 'seconds until the slam',
    impact: '[x, z] impact point in world units',
    speed: 'shock front speed (units per second)',
    flingRatio: 'fraction of nearby pills that fly off frame',
    slowMo: 'brief 0.35x slow-mo just after the hit, then catch-up',
    cols: 'pills across',
    rows: 'pills deep',
    grain: 'film grain + vignette finish',
    seed: 'unused variation seed (kept for spec compatibility)',
  },
  component: ShockwaveFlipField,
  tags: ['shockwave', 'flip', 'colour takeover', 'before after', 'impact', 'chrome ball', 'slam', 'candy', 'pills', 'soft 3d', 'slow motion', 'hero moment', 'ident', 'three.js', 'instanced', 'mg-styles-15', 'soft-3d-candy'],
});
