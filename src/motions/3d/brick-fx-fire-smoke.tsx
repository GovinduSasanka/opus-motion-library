// Adapted from lemo-opuscar/styles/brick-toy/demo/rockets.js brick fire & smoke (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Brick, BRICK_COLORS, BrickMesh, BrickStage, hh, lf} from '../../core/r2-la1-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * Stop-motion brick VFX: a toy rocket's flame made of 8–20 translucent orange/yellow round plates re-seeded
 * every drawing (12 fps), and smoke of white round bricks that grow ×1.5 and roll outward over ~1 s — no
 * particles, no gradients. The rocket shivers, lifts off and the camera tilts up to follow.
 */
type Props = {
  kind: 'fire' | 'smoke' | 'water';
  rate: number;
  liftAt: number;
  palette: string[];
  smokeColor: string;
  rocketColors: string[];
  background: string;
  desk: string;
  caption: string;
  stepFps: number;
  seed: number;
};

const ROCKET: Brick[] = [
  // body: 2×2 rounds stacked
  ...Array.from({length: 4}, (_, i) => ({x: 0, y: 1.8 + i * 1.2, z: 0, w: 2, d: 2, h: 1.2, color: i % 2 ? '#f2f2ee' : '#c91a09', round: true})),
  {x: 0, y: 6.0, z: 0, w: 2, d: 2, h: 1.2, color: '#c91a09', round: true},
  {x: 0, y: 7.0, z: 0, w: 1.3, d: 1.3, h: 0.9, color: '#c91a09', round: true},
  {x: 0, y: 7.8, z: 0, w: 0.7, d: 0.7, h: 0.8, color: '#f2cd37', round: true},
  // fins
  {x: -1.4, y: 0.9, z: 0, w: 0.8, d: 1.6, h: 1.8, color: '#f2cd37'},
  {x: 1.4, y: 0.9, z: 0, w: 0.8, d: 1.6, h: 1.8, color: '#f2cd37'},
  {x: 0, y: 0.9, z: -1.4, w: 1.6, d: 0.8, h: 1.8, color: '#f2cd37'},
  {x: 0, y: 0.9, z: 1.4, w: 1.6, d: 0.8, h: 1.8, color: '#f2cd37'},
  // nozzle
  {x: 0, y: 0.6, z: 0, w: 1.4, d: 1.4, h: 1.2, color: '#6c6e68', round: true},
];

const BrickFx: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {u, fps, portrait} = useStage();
  const hold = Math.max(1, Math.round(fps / p.stepFps));
  const drawing = Math.floor(frame / hold); // re-seed per drawing
  const fq = drawing * hold;
  const lift = Math.pow(prog(frame, p.liftAt, p.liftAt + 70, ease.in), 1.6) * 34;
  const shiver = frame > p.liftAt - 18 && lift < 0.2 ? (hh(drawing, 5) - 0.5) * 0.16 : 0;
  const fireOn = frame >= p.liftAt - 12;

  // flame: translucent round plates, re-seeded every drawing
  const flame = useMemo(() => {
    if (!fireOn || p.kind === 'smoke') return [] as {b: Brick; posPl: [number, number, number]}[];
    const nPl = Math.round(lerp(8, 20, clamp(lift / 6 + (frame - (p.liftAt - 12)) / 24)));
    const out: {b: Brick; posPl: [number, number, number]}[] = [];
    for (let i = 0; i < nPl; i++) {
      const r1 = hh(i, drawing, p.seed);
      const r2 = hh(i + 40, drawing, p.seed);
      const r3 = hh(i + 80, drawing, p.seed);
      const depth = Math.pow(r1, 1.4) * (3.2 + lift * 0.12);
      const size = lerp(1.9, 0.5, depth / 3.6) * (0.8 + r2 * 0.4);
      const col = p.kind === 'water' ? (r3 < 0.5 ? '#5e8f96' : '#9fc7c0') : r3 < 0.42 ? p.palette[0] : r3 < 0.8 ? p.palette[1 % p.palette.length] : p.palette[2 % p.palette.length] ?? p.palette[0];
      out.push({
        b: {x: 0, y: 0, z: 0, w: size, d: size, h: 0.4, color: col, round: true, plate: true},
        posPl: [(r2 - 0.5) * 0.9 * (0.4 + depth * 0.3), lift + 0.2 - depth, (r3 - 0.5) * 0.9 * (0.4 + depth * 0.3)],
      });
    }
    return out;
  }, [fireOn, p.kind, p.palette, drawing, p.seed, lift, frame, p.liftAt, p.kind]);

  // smoke: white round bricks spawned at the pad on a fixed cadence, grow ×1.5 and roll outward over ~1 s
  const smoke: {b: Brick; posPl: [number, number, number]; scale: number}[] = [];
  if (fireOn) {
    const born0 = p.liftAt - 12;
    for (let k = 0; k < 60; k++) {
      const bt = born0 + k * p.rate;
      if (fq < bt) break;
      const age = (fq - bt) / fps; // seconds
      if (age > 2.2) continue;
      const r1 = hh(k, p.seed + 9);
      const r2 = hh(k + 31, p.seed + 9);
      const ang = r1 * Math.PI * 2;
      const dist = 1.2 + age * (2.6 + r2 * 2);
      const size = (0.9 + r2 * 0.7) * Math.min(1.5, 0.5 + age * 1.4);
      const yy = 0.4 + age * 0.5 + Math.sin(age * 3 + r1 * 6) * 0.1;
      const roll = age * (2 + r1 * 2);
      smoke.push({
        b: {x: 0, y: 0, z: 0, w: 1, d: 1, h: 1, color: age > 1.6 ? '#dcdcd6' : p.smokeColor, round: true},
        posPl: [Math.cos(ang) * dist, yy, Math.sin(ang) * dist],
        scale: size * clamp(age * 6) * clamp((2.2 - age) * 1.4),
      });
      void roll;
    }
  }

  const k = prog(frame, 0, 165, ease.sine);
  const dist = portrait ? 30 : 22;
  const pos: V3 = [Math.sin(0.5 - k * 0.2) * dist, 5.5 + k * 2, Math.cos(0.5 - k * 0.2) * dist];
  const tgt: V3 = [0, 4 + lift * 0.75, 0];
  const capIn = prog(frame, p.liftAt + 18, p.liftAt + 32, ease.out);

  return (
    <AbsoluteFill style={{background: p.background, filter: 'contrast(1.12) saturate(1.1)'}}>
      <Stage3D shadows="soft">
        <CameraRig position={pos} target={tgt} fov={portrait ? 42 : 32} />
        <BrickStage desk={p.desk} plateR={14}>
          {/* launch pad ring */}
          {Array.from({length: 6}, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return <BrickMesh key={'p' + i} b={{x: 0, y: 0.6, z: 0, w: 2, d: 1, h: 1.2, color: BRICK_COLORS.lightGrey}} pos={[Math.cos(a) * 4.5, 0.6, Math.sin(a) * 4.5]} rot={[0, -a, 0]} />;
          })}
          {p.kind !== 'smoke' && fireOn && <pointLight position={[0, lift + 0.5, 0]} intensity={14} distance={12} decay={1.6} color={p.kind === 'water' ? '#9adbe8' : '#ffb24d'} />}
          {ROCKET.map((b, i) => (
            <BrickMesh key={i} b={b} pos={[b.x + shiver, b.y + lift, b.z]} />
          ))}
          {flame.map((f, i) => (
            <BrickMesh key={'f' + i} b={f.b} pos={f.posPl} translucent={0.3} shadow={false} />
          ))}
          {smoke.map((s, i) => (
            <BrickMesh key={'s' + i} b={s.b} pos={s.posPl} scale={Math.max(0.01, s.scale)} />
          ))}
        </BrickStage>
      </Stage3D>
      {p.caption && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 120 * u,
            transform: `translate(-50%, ${(1 - capIn) * 20 * u}px)`,
            opacity: capIn,
            background: 'rgba(18,20,26,0.62)',
            color: '#fff',
            borderRadius: 40 * u,
            padding: `${16 * u}px ${34 * u}px`,
            fontFamily: lf.sans,
            fontWeight: 600,
            fontSize: 42 * u,
            whiteSpace: 'nowrap',
          }}
        >
          {p.caption}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const brickFxFireSmoke = defineMotion<Props>({
  id: 'brick-fx-fire-smoke',
  title: 'Brick FX: fire & smoke',
  category: '3d',
  description:
    'Stop-motion brick VFX on a toy rocket launch: the flame is 8–20 translucent orange round plates re-seeded every drawing at 12 fps, the smoke is white round bricks that grow and roll outward — no particles, no gradients — as the rocket shivers and lifts off.',
  source: ['lemo-opuscar styles/brick-toy demo/rockets.js fire & smoke (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §6 brick-fx-fire-smoke'],
  useFor: 'Launch beats, "we have lift-off", stop-motion VFX vocabulary reusable across brick / clay / papercraft looks.',
  durationInFrames: 165,
  defaultProps: {
    kind: 'fire',
    rate: 3,
    liftAt: 52,
    palette: ['#ff5a00', '#ffa200', '#ffd84a'],
    smokeColor: '#f2f2ee',
    rocketColors: [],
    background: '#cfd4d8',
    desk: '#9b958c',
    caption: 'And every launch starts with one brick.',
    stepFps: 12,
    seed: 7,
  },
  propDocs: {
    kind: 'fire = flame + smoke, smoke = smoke only, water = cool splash plates + smoke',
    rate: 'frames between smoke puffs',
    liftAt: 'frame the rocket lifts off (ignition 12 frames earlier)',
    palette: 'flame plate colours (hot → bright)',
    smokeColor: 'smoke brick colour',
    rocketColors: 'reserved',
    background: 'studio wall colour',
    desk: 'desk colour',
    caption: 'subtitle pill (empty = none)',
    stepFps: 'stop-motion re-seed rate of the flame drawings',
    seed: 'FX seed',
  },
  component: BrickFx,
  tags: ['bricks', 'toy', 'fire', 'smoke', 'rocket', 'launch', 'vfx', 'stop motion', '3d', 'flame', 'lift off', 'playful', 'kids'],
});
