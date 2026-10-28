// Adapted from lemo-opuscar/styles/brick-toy/demo/rockets.js tip/collapse (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Brick, BRICK_COLORS, BrickMesh, BrickStage, hh, lf} from '../../core/r2-la1-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';
import {rng} from '../../core/random';

/**
 * A built brick tower creaks, tips about its base edge, and breaks into independent bricks that bounce
 * (gravity 420 studs/s², restitution 0.3) and settle; the camera shakes on impact. The whole fall is
 * pre-simulated deterministically at a fixed timestep, bricks step at 12 fps, the camera moves on ones.
 */
type Props = {
  width: number;
  height: number;
  palette: string[];
  pushAt: number;
  pushDir: number;
  seed: number;
  background: string;
  desk: string;
  caption: string;
  stepFps: number;
};

type Key = {x: number; y: number; z: number; rx: number; ry: number; rz: number};

const G = 420; // studs/s²
const DT = 1 / 120;
const REST = 0.3;

const simulate = (bricks: Brick[], pushDir: number, seed: number, creakSec: number, tipSec: number, totalSec: number) => {
  const r = rng(seed * 13 + 1);
  const n = bricks.length;
  const frames: Key[][] = [];
  // per-brick state (starts rigid on the tower)
  const st = bricks.map((b) => ({x: b.x, y: b.y, z: b.z, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, wx: (r() - 0.5) * 4, wy: (r() - 0.5) * 5, wz: (r() - 0.5) * 4, free: false, rest: 0}));
  const maxY = Math.max(...bricks.map((b) => b.y));
  const hw = Math.max(...bricks.map((b) => Math.abs(b.x) + b.w / 2));
  // break angle: bricks peel off top-first as the tip progresses
  const steps = Math.round(totalSec / DT);
  const fps30 = Math.round(1 / (30 * DT));
  let ang = 0;
  let angV = 0;
  for (let s = 0; s <= steps; s++) {
    const t = s * DT;
    // phase 1: creak (tiny oscillation), then tip about the base edge at +hw·pushDir
    if (t < creakSec) {
      ang = Math.sin(t * 14) * 0.012 * (t / creakSec) * pushDir;
    } else {
      angV += ((G * 0.004 * Math.sin(Math.abs(ang)) + 0.12) * DT) * 1;
      ang += angV * DT * pushDir;
    }
    const pivotX = hw * pushDir;
    st.forEach((b, i) => {
      if (!b.free) {
        // rigid rotation about the pivot
        const dx = bricks[i].x - pivotX;
        const dy = bricks[i].y;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        b.x = pivotX + dx * ca - dy * sa;
        b.y = dx * sa + dy * ca;
        b.rz = -ang;
        // free when tilt makes it unstable (higher bricks first)
        const thresh = 0.26 + ((maxY - bricks[i].y) / Math.max(1, maxY)) * 0.5;
        if (Math.abs(ang) > thresh || t > tipSec) {
          b.free = true;
          const rr = hh(i, seed);
          b.vx = -angV * bricks[i].y * pushDir * 0.9 + (rr - 0.5) * 9;
          b.vy = angV * Math.abs(bricks[i].x - pivotX) * 0.4 + rr * 2;
          b.vz = (hh(i, seed + 1) - 0.5) * 12;
        }
      } else {
        b.vy -= G * DT;
        b.x += b.vx * DT;
        b.y += b.vy * DT;
        b.z += b.vz * DT;
        b.rx += b.wx * DT;
        b.ry += b.wy * DT;
        b.rz += b.wz * DT;
        const floor = bricks[i].h / 2;
        if (b.y < floor) {
          b.y = floor;
          if (Math.abs(b.vy) > 2) {
            b.vy = -b.vy * REST;
            b.vx *= 0.72;
            b.vz *= 0.72;
            b.wx *= 0.5;
            b.wy *= 0.5;
            b.wz *= 0.5;
            b.rest++;
          } else {
            b.vy = 0;
            b.vx *= 0.82;
            b.vz *= 0.82;
            // settle flat
            b.rx = Math.round(b.rx / (Math.PI / 2)) * (Math.PI / 2) * 0.2 + b.rx * 0.8;
            b.wx = b.wy = b.wz = 0;
            if (Math.abs(b.vx) < 0.4 && Math.abs(b.vz) < 0.4) {
              b.vx = b.vz = 0;
              const snap = (v: number) => {
                const q = Math.round(v / (Math.PI / 2)) * (Math.PI / 2);
                return v + (q - v) * 0.25;
              };
              b.rx = snap(b.rx);
              b.rz = snap(b.rz);
            }
          }
        }
      }
    });
    if (s % fps30 === 0) frames.push(st.map((b) => ({x: b.x, y: b.y, z: b.z, rx: b.rx, ry: b.ry, rz: b.rz})));
  }
  // impact frame (first free brick hitting the floor) for camera shake
  let impact = frames.length - 1;
  outer: for (let f = 1; f < frames.length; f++) {
    for (let i = 0; i < n; i++) {
      if (frames[f][i].y <= bricks[i].h / 2 + 0.05 && frames[f - 1][i].y > bricks[i].h / 2 + 0.3) {
        impact = f;
        break outer;
      }
    }
  }
  return {frames, impact};
};

const Collapse: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {u, fps, portrait} = useStage();
  const bricks = useMemo(() => {
    const r = rng(p.seed);
    const out: Brick[] = [];
    for (let row = 0; row < p.height; row++) {
      let x = -p.width / 2;
      const odd = row % 2 === 1;
      while (x < p.width / 2 - 0.01) {
        const rem = p.width / 2 - x;
        let len = Math.min(rem, odd && x === -p.width / 2 ? 3 : r() < 0.4 ? 2 : 4);
        if (rem - len === 1) len = Math.max(1, len - 1);
        out.push({x: x + len / 2, y: row * 1.2 + 0.6, z: 0, w: len, d: 2, h: 1.2, color: p.palette[Math.floor(r() * p.palette.length) % p.palette.length]});
        x += len;
      }
    }
    return out;
  }, [p.width, p.height, p.palette, p.seed]);
  const sim = useMemo(() => simulate(bricks, p.pushDir >= 0 ? 1 : -1, p.seed, 0.5, 1.4, 4.2), [bricks, p.seed, p.pushDir]);
  const hold = Math.max(1, Math.round(fps / p.stepFps));
  const fq = Math.floor(frame / hold) * hold;
  const simF = Math.max(0, Math.min(sim.frames.length - 1, Math.floor(((fq - p.pushAt) * 30) / fps)));
  const keys = sim.frames[simF];
  const impactFrame = p.pushAt + (sim.impact * fps) / 30;
  // camera on ones: slow push, shake after impact
  const towerH = p.height * 1.2;
  const dist = (portrait ? 2.2 : 2.0) * Math.max(p.width, towerH) + 7;
  const k = prog(frame, 0, 150, ease.sine);
  const sh = frame >= impactFrame ? Math.exp(-(frame - impactFrame) / 9) * Math.min(1, (frame - impactFrame + 4) / 6) : 0;
  const shx = Math.sin(frame * 2.1) * sh * 0.5;
  const shy = Math.sin(frame * 2.7 + 1) * sh * 0.35;
  const pos: V3 = [Math.sin(0.34 - k * 0.1) * dist + shx, towerH * 0.42 + dist * 0.16 + shy, Math.cos(0.34 - k * 0.1) * dist];
  const tgt: V3 = [shx * 0.5, towerH * 0.3 * (1 - prog(frame, impactFrame, impactFrame + 40, ease.inOut) * 0.6), 0];
  const capIn = prog(frame, impactFrame + 16, impactFrame + 30, ease.out);

  return (
    <AbsoluteFill style={{background: p.background, filter: 'contrast(1.12) saturate(1.1)'}}>
      <Stage3D shadows="soft">
        <CameraRig position={pos} target={tgt} fov={portrait ? 46 : 36} />
        <BrickStage desk={p.desk} plateR={Math.ceil(Math.max(p.width, 10) + 6)}>
          {bricks.map((b, i) => {
            const K = keys[i];
            return <BrickMesh key={i} b={b} pos={[K.x, K.y, K.z]} rot={[K.rx, K.ry, K.rz]} />;
          })}
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

export const brickCollapsePhysics = defineMotion<Props>({
  id: 'brick-collapse-physics',
  title: 'Brick collapse physics',
  category: '3d',
  description:
    'A built brick tower creaks, tips about its base edge and breaks into independent bricks that bounce with restitution 0.3 and settle flat; the camera shakes on impact and tilts down to the rubble. Deterministic pre-simulated rigid bodies, bricks stepped at 12 fps.',
  source: ['lemo-opuscar styles/brick-toy demo/rockets.js collapse (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §6 brick-collapse-physics'],
  useFor: 'Failure / pivot beats, "break it to rebuild it", playful destruction before a rebuild.',
  durationInFrames: 165,
  defaultProps: {
    width: 8,
    height: 10,
    palette: [BRICK_COLORS.red, BRICK_COLORS.yellow, BRICK_COLORS.blue, BRICK_COLORS.white],
    pushAt: 28,
    pushDir: 1,
    seed: 11,
    background: '#cfd4d8',
    desk: '#9b958c',
    caption: 'Well. Back to the drawing board.',
    stepFps: 12,
  },
  propDocs: {
    width: 'tower width in studs',
    height: 'tower height in brick rows',
    palette: 'brick colours',
    pushAt: 'frame the creak/tip starts',
    pushDir: '1 = tips right, -1 = tips left',
    seed: 'brick layout + scatter seed',
    background: 'studio wall colour',
    desk: 'desk colour',
    caption: 'subtitle pill after the dust settles (empty = none)',
    stepFps: 'stop-motion stepping of brick movement',
  },
  component: Collapse,
  tags: ['bricks', 'toy', 'collapse', 'physics', 'fall', 'destruction', 'tower', 'tip over', 'stop motion', '3d', 'failure', 'crash', 'playful'],
});
