// Adapted from lemo-opuscar/styles/backrooms/demo/world.js + tex.js + main.js handheld rig (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {lerp} from '../../core/ease';
import {rng} from '../../core/random';
import {hh, lf, toRgb, vnoise} from '../../core/r2-la1-kit';
import {FilmGrain, Svg, Vignette, useStage} from '../../core/stage';
import {CameraRig, SceneBackground, SceneFog, Stage3D, V3, noiseTexture} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * An endless, empty office: mustard wallpaper partitions on a 2.4 m grid, a drop ceiling of 0.6 × 1.2 m tiles
 * with a fluorescent troffer every 2.4 m (3.5 % dead, 2.5 % flickering), damp carpet, flat shadowless light and
 * dark fog swallowing the far corridors. A handheld camcorder walks the route (gait bob, sway, breathing,
 * fear tremor) with a REC / clock OSD.
 */
type Props = {
  seed: number;
  wallpaper: string;
  trim: string;
  carpet: string;
  ceiling: string;
  signal: string;
  fogColor: string;
  fogDensity: number;
  speed: number;
  fear: number;
  osd: boolean;
  clock: string;
  date: string;
  osdLabel?: string;
};

const CELL = 2.4;
const HGT = 2.7;
const NX = 7; // cells each side of the route
const NZ = 34;

type Wall = {x: number; z: number; rotY: number};

const layoutWalls = (seed: number): Wall[] => {
  const r = rng(seed * 97 + 3);
  const out: Wall[] = [];
  for (let i = -NX; i <= NX; i++)
    for (let j = -2; j < NZ; j++) {
      const x0 = i * CELL;
      const z0 = -j * CELL;
      // edge along x (north side of the cell); never across the route lane (i = 0)
      if (i !== 0 && r() < 0.34) out.push({x: x0 + CELL / 2, z: z0, rotY: 0});
      // edge along z (west side); route lane walls are more frequent but leave openings
      const lane = i === 0 || i === 1;
      if (r() < (lane ? 0.62 : 0.3)) out.push({x: x0, z: z0 - CELL / 2, rotY: Math.PI / 2});
    }
  return out;
};

const Walls: React.FC<{walls: Wall[]; tex: THREE.Texture; trim: string}> = ({walls, tex, trim}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(CELL + 0.16, HGT, 0.16), []);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({map: tex}), walls.length);
    return m;
  }, [geo, tex, walls.length]);
  const base = useMemo(() => new THREE.InstancedMesh(new THREE.BoxGeometry(CELL + 0.18, 0.12, 0.18), new THREE.MeshLambertMaterial({color: trim}), walls.length), [walls.length, trim]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    walls.forEach((wl, i) => {
      o.position.set(wl.x, HGT / 2, wl.z);
      o.rotation.set(0, wl.rotY, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      o.position.set(wl.x, 0.06, wl.z);
      o.updateMatrix();
      base.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    base.instanceMatrix.needsUpdate = true;
  }, [walls, mesh, base]);
  return (
    <>
      <primitive object={mesh} />
      <primitive object={base} />
    </>
  );
};

const Troffers: React.FC<{frame: number; seed: number}> = ({frame, seed}) => {
  const n = (2 * NX + 1) * (NZ + 2);
  const mesh = useMemo(() => new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.03, 1.2), new THREE.MeshBasicMaterial({color: '#ffffff'}), n), [n]);
  const c = useMemo(() => new THREE.Color(), []);
  const step = Math.floor(frame / 2);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    let k = 0;
    for (let i = -NX; i <= NX; i++)
      for (let j = -2; j < NZ; j++) {
        o.position.set(i * CELL + CELL / 2, HGT - 0.02, -j * CELL - CELL / 2);
        o.updateMatrix();
        mesh.setMatrixAt(k, o.matrix);
        const r = hh(i + 50, j + 50, seed);
        let v = 1;
        if (r < 0.035) v = 0.28;
        else if (r < 0.06) v = hh(i, j, step) < 0.45 ? 0.35 : 1;
        const warm = (hh(i, j, seed + 1) - 0.5) * 0.08;
        c.setRGB(v * (1 + warm), v * (1.0 + hh(i, j, 7) * 0.05), v * (0.92 - warm));
        mesh.setColorAt(k, c);
        k++;
      }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [mesh, step, seed, c]);
  return <primitive object={mesh} />;
};

const tex = (fn: (x: number, y: number) => [number, number, number], size = 128, repeat: [number, number] = [1, 1]) => {
  const t = noiseTexture(size, (x, y) => 0, undefined);
  const data = t.image.data as Uint8Array;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fn(x / size, y / size);
      const i = (y * size + x) * 4;
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = 255;
    }
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(...repeat);
  t.needsUpdate = true;
  return t;
};

const Liminal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const walls = useMemo(() => layoutWalls(p.seed), [p.seed]);
  const wallTex = useMemo(() => {
    const c = toRgb(p.wallpaper);
    return tex((x, y) => {
      const stripe = 0.94 + 0.05 * Math.sin(x * Math.PI * 2 * 10) + 0.03 * Math.sin(x * Math.PI * 2 * 30);
      const stain = y > 0.78 ? 1 - (y - 0.78) * 0.6 * vnoise('tide', x * 4, 0) : 1;
      const top = y < 0.08 ? 0.86 + y * 1.6 : 1;
      const m = stripe * stain * top * (0.96 + 0.06 * vnoise('wp', x * 6, y * 6));
      return [c[0] * m, c[1] * m, c[2] * m];
    });
  }, [p.wallpaper]);
  const carpetTex = useMemo(() => {
    const c = toRgb(p.carpet);
    const t = tex((x, y) => {
      const m = 0.85 + 0.25 * vnoise('cp', x * 40, y * 40) - (vnoise('damp', x * 3, y * 3) > 0.68 ? 0.3 : 0);
      return [c[0] * m, c[1] * m, c[2] * m];
    }, 256, [24, 60]);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [p.carpet]);
  const ceilTex = useMemo(() => {
    const c = toRgb(p.ceiling);
    const t = tex((x, y) => {
      const grid = x < 0.04 || y < 0.02 ? 1.08 : 1;
      const m = grid * (0.93 + 0.07 * vnoise('ct', x * 8, y * 8)) * (hh(Math.floor(x * 9), Math.floor(y * 9)) < 0.04 ? 0.88 : 1);
      return [c[0] * m, c[1] * m, c[2] * m];
    }, 128, [60, 60]);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [p.ceiling]);

  // handheld walk
  const t = frame / fps;
  const dist = t * p.speed;
  const stride = 0.72;
  const gait = (dist / stride) * Math.PI;
  const breath = Math.sin(t * 2 * Math.PI * 0.27);
  const n = (s: number, hz: number) => Math.sin(t * hz * 6.283 + s) * 0.6 + Math.sin(t * hz * 2.7 * 6.283 + s * 3) * 0.4;
  const fear = p.fear;
  const bob = Math.abs(Math.sin(gait)) * 0.03;
  const sway = Math.sin(gait) * 0.018;
  const yaw = Math.sin(t * 0.55) * 0.16 + n(1, 0.6) * 0.02 + n(4, 3.7) * 0.004 * (1 + 2 * fear);
  const pitch = -0.03 + n(2, 1.1) * 0.016 + n(5, 3.7) * 0.005 * (1 + 2 * fear) + n(6, 9.5) * 0.0022 * fear + breath * 0.006;
  const roll = n(3, 0.6) * 0.012 + Math.sin(gait) * 0.014 * 0.5 + n(7, 7) * 0.003 * fear;
  const camX = CELL / 2 + sway;
  const camY = 1.58 + bob;
  const camZ = 2 - dist;
  const pos: V3 = [camX, camY, camZ];
  const tgt: V3 = [camX + Math.sin(yaw) * 5, camY + Math.sin(pitch) * 5, camZ - Math.cos(yaw) * 5];
  const exitZ = -CELL * 7 - 1.2;
  const os = (portrait ? 46 : 52) * u;
  const recOn = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill style={{background: p.fogColor}}>
      <AbsoluteFill style={{filter: 'blur(0.6px) saturate(0.86) contrast(1.06) brightness(1.04)'}}>
        <Stage3D flat>
          <CameraRig position={pos} target={tgt} fov={portrait ? 74 : 62} roll={roll} near={0.05} far={80} />
          <SceneBackground color={p.fogColor} />
          <SceneFog color={p.fogColor} density={p.fogDensity} />
          <ambientLight intensity={0.62} color="#fff6d8" />
          <hemisphereLight args={['#fffbe8', '#6b5a2a', 0.55]} />
          <pointLight position={[camX, 2.5, camZ - 2]} intensity={6} distance={14} decay={1.4} color="#fff6dc" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]}>
            <planeGeometry args={[NX * 2 * CELL + 10, 100]} />
            <meshLambertMaterial map={carpetTex} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HGT, -30]}>
            <planeGeometry args={[NX * 2 * CELL + 10, 100]} />
            <meshLambertMaterial map={ceilTex} />
          </mesh>
          <Walls walls={walls} tex={wallTex} trim={p.trim} />
          <Troffers frame={frame} seed={p.seed} />
          {/* the one signal colour: an EXIT sign over an opening far down the route */}
          <mesh position={[CELL / 2, 2.35, exitZ]}>
            <boxGeometry args={[0.6, 0.22, 0.06]} />
            <meshBasicMaterial color={p.signal} toneMapped={false} />
          </mesh>
          <pointLight position={[CELL / 2, 2.2, exitZ + 0.4]} intensity={2.5} distance={5} color={p.signal} />
        </Stage3D>
      </AbsoluteFill>
      <Vignette strength={0.5} />
      <FilmGrain opacity={0.14} every={1} />
      {p.osd && (
        <Svg>
          <g fontFamily={lf.vt} fontSize={os} fill="#fff" stroke="#000" strokeWidth={os * 0.08} paintOrder="stroke">
            {recOn && <circle cx={70 * u} cy={70 * u + os * 0.32} r={os * 0.24} fill="#ff2a1a" />}
            <text x={70 * u + os * 0.45} y={70 * u + os * 0.62}>
              {p.osdLabel}
            </text>
            <g transform={`translate(${w - 70 * u - os * 1.6} ${70 * u})`}>
              <rect width={os * 1.4} height={os * 0.62} fill="none" stroke="#fff" strokeWidth={os * 0.07} />
              <rect x={os * 1.4} y={os * 0.18} width={os * 0.12} height={os * 0.26} fill="#fff" />
              {[0, 1, 2].map((k) => (
                <rect key={k} x={os * (0.12 + k * 0.42)} y={os * 0.12} width={os * 0.32} height={os * 0.38} fill="#fff" stroke="none" />
              ))}
            </g>
            <text x={w - 70 * u} y={h - 70 * u - os * 1.05} textAnchor="end">
              {p.clock}
            </text>
            <text x={w - 70 * u} y={h - 70 * u} textAnchor="end">
              {p.date}
            </text>
          </g>
        </Svg>
      )}
      <AbsoluteFill style={{background: '#000', opacity: lerp(1, 0, Math.min(1, frame / 8))}} />
    </AbsoluteFill>
  );
};

export const liminalCorridor3d = defineMotion<Props>({
  id: 'liminal-corridor-3d',
  title: 'Liminal office corridor (3D)',
  category: '3d',
  description:
    'A handheld camcorder walks an endless, empty office of mustard wallpaper partitions on a 2.4 m grid under a drop ceiling of fluorescent troffers (a few dead, a few flickering), the far corridors fading into dark fog, one red EXIT sign far ahead and a REC / clock OSD.',
  source: ['lemo-opuscar styles/backrooms demo/world.js, tex.js, main.js handheld rig (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §4 liminal-corridor-3d'],
  useFor: 'Liminal / uncanny backdrops for horror-lite, mystery, "corporate dread" satire and found-footage openers.',
  durationInFrames: 180,
  defaultProps: {
    seed: 7,
    wallpaper: '#d5bd66',
    trim: '#4d3d26',
    carpet: '#8c763c',
    ceiling: '#d9d3b8',
    signal: '#ff2a1a',
    fogColor: '#1c180b',
    fogDensity: 0.085,
    speed: 1.1,
    fear: 0.3,
    osd: true,
    clock: 'PM 11:58',
    date: 'SEP.27.1996',
    osdLabel: 'REC',
  },
  propDocs: {
    seed: 'layout seed (partition placement, dead / flickering panels)',
    wallpaper: 'wallpaper colour (pool tile #9fc7c0, school #b9c49a for alternatives)',
    trim: 'baseboard colour',
    carpet: 'carpet colour',
    ceiling: 'ceiling tile colour',
    signal: 'the one signal colour (EXIT sign)',
    fogColor: 'fog / background colour (dark)',
    fogDensity: 'exponential fog density (higher = darker far corridors)',
    speed: 'walking speed in m/s',
    fear: '0..1 extra handheld tremor',
    osd: 'camcorder REC / battery / clock / date overlay',
    clock: 'OSD clock text',
    date: 'OSD date text',
    osdLabel: 'camcorder on-screen-display label next to the red dot (osd: true)',
  },
  component: Liminal,
  tags: ['liminal', 'liminal space', 'office', 'corridor', 'hallway', 'fluorescent', 'found footage', 'camcorder', 'vhs', 'horror', 'mystery', 'uncanny', '3d', 'walk', 'first person', 'eerie', 'backdrop'],
});
