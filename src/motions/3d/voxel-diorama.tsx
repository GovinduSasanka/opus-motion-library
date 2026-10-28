import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {VoxelInstances, type VoxelPose} from '../../core/r2-x14-kit';
import {VOX, hexA, makeIsland, mixHex} from '../../core/r2-pr4-kit';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * Voxel diorama: a voxel island (heightmap with beach, grass, rock, trees and a hut) builds itself — cubes drop in
 * waves, low and central first, decorations last, each landing with a tiny squash — in a sea of bobbing water cubes
 * on a chunky slab, under drifting cube clouds, while an orbiting camera turns at ~15 deg/s. Soft sun shadows.
 */
type Palette = {water: string; waterLight: string; sand: string; grass: string; grass2: string; rock: string; snow: string; dirt: string; wood: string; leaf: string; leaf2: string; roof: string; wall: string; cloud: string};
type Props = {
  title: string;
  subtitle: string;
  heightmap: number[][];
  size: number;
  seed: number;
  trees: number;
  houses: number;
  maxHeight: number;
  buildAt: number;
  buildFrames: number;
  fallFrames: number;
  dropHeight: number;
  orbit: number;
  yaw: number;
  elevation: number;
  clouds: number;
  hud: boolean;
  skyTop: string;
  skyBottom: string;
  inkColor: string;
  palette: Palette;
};

const PAL: Palette = {
  water: '#3b9fd1',
  waterLight: '#4aa9d9',
  sand: '#f3dca4',
  grass: '#79c25b',
  grass2: '#5fae4c',
  rock: '#9a9aa6',
  snow: '#f4f7fb',
  dirt: '#b98457',
  wood: '#7a4f2c',
  leaf: '#3f9a4a',
  leaf2: '#4fb35a',
  roof: '#d9544a',
  wall: '#f6ead2',
  cloud: '#ffffff',
};

const VoxelDiorama: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const pal = {...PAL, ...(p.palette || {})};
  const slots = [pal.water, pal.waterLight, pal.sand, pal.grass, pal.grass2, pal.rock, pal.snow, pal.dirt, pal.wood, pal.leaf, pal.leaf2, pal.roof, pal.wall, pal.cloud];
  const plan = useMemo(() => makeIsland({n: p.size, seed: p.seed, heightmap: p.heightmap, trees: p.trees, houses: p.houses, maxH: p.maxHeight, sea: 5}), [p.size, p.seed, p.heightmap, p.trees, p.houses, p.maxHeight]);
  const n = plan.n;
  const mid = (n - 1) / 2;
  const m = n + 6;

  const jit = useMemo(() => {
    const g = rng(p.seed + 41);
    return plan.cells.map(() => ({dh: g(), jx: (g() - 0.5) * 0.4, jz: (g() - 0.5) * 0.4, sp: (g() - 0.5) * 0.8}));
  }, [plan, p.seed]);

  // island poses
  let landed = 0;
  const poses: VoxelPose[] = plan.cells.map((c, i) => {
    const landF = p.buildAt + c.key * p.buildFrames;
    const startF = landF - p.fallFrames;
    const x = c.x - mid;
    const z = c.z - mid;
    if (frame < startF) return {p: [0, -999, 0], s: 0, c: c.c};
    const j = jit[i];
    if (frame < landF) {
      const uu = (frame - startF) / p.fallFrames;
      const fall = 1 - uu * uu;
      const dh = p.dropHeight * (0.85 + 0.3 * j.dh);
      return {p: [x + j.jx * fall, c.y + 0.5 + dh * fall, z + j.jz * fall], r: [j.sp * fall, j.sp * 0.6 * fall, 0], s: 0.9 + 0.1 * (1 - fall), c: c.c};
    }
    landed++;
    const k = clamp((frame - landF) / 4);
    const sq = 1 + 0.09 * Math.sin(Math.PI * k) * (1 - k);
    return {p: [x, c.y + 0.5 - (sq - 1) * 0.5, z], s: sq, c: c.c};
  });

  // sea poses
  const seaPoses: VoxelPose[] = plan.sea.map((c) => {
    const k = prog(frame, 0 + c.d * 26, 18 + c.d * 26, ease.back);
    const bob = Math.sin(frame * 0.09 + c.x * 0.6 + c.z * 0.5) * 0.05;
    const sparkle = (Math.sin(frame * 0.05 + c.x * 1.7 + c.z * 2.3) + 1) / 2 > 0.93;
    return {p: [c.x - mid, 0.36 + bob, c.z - mid], s: k, c: c.shade > 0.58 || sparkle ? 1 : 0};
  });

  // clouds
  const cloudCells = useMemo(() => {
    const g = rng(p.seed * 5 + 11);
    const out: {ox: number; y: number; z: number; dx: number; dy: number; dz: number}[] = [];
    for (let c = 0; c < p.clouds; c++) {
      const ox = g() * m * 2;
      const y = 10 + g() * 3;
      const z = (g() - 0.5) * m * 0.8;
      const len = 3 + Math.floor(g() * 3);
      for (let k = 0; k < len; k++) out.push({ox, y, z, dx: k - len / 2, dy: 0, dz: 0});
      for (let k = 1; k < len - 1; k++) out.push({ox, y, z, dx: k - len / 2 + 0.2, dy: 1, dz: (g() - 0.5)});
      out.push({ox, y, z, dx: -len / 4, dy: 0, dz: 1}, {ox, y, z, dx: len / 5, dy: 0, dz: -1});
    }
    return out;
  }, [p.clouds, p.seed, m]);
  const cloudPoses: VoxelPose[] = cloudCells.map((c) => {
    const x = ((c.ox + frame * 0.045) % (m * 2)) - m + c.dx;
    return {p: [x, c.y + c.dy, c.z + c.dz], s: prog(frame, 20, 50, ease.out), c: 0};
  });

  // camera
  const aspect = w / h;
  const fov = 32;
  const tanH = Math.tan((fov / 2) * (Math.PI / 180));
  const want = m * (aspect >= 1.2 ? 1.8 : aspect >= 0.9 ? 1.65 : 1.6);
  const dist = Math.max(want / (2 * tanH * aspect), (m * 1.0) / (2 * tanH)) * (aspect >= 0.9 ? 1.3 : 0.86) * (1.08 - 0.08 * ease.out(prog(frame, 0, p.buildAt + p.buildFrames)));
  const yaw = ((p.yaw + (p.orbit * frame) / 30) * Math.PI) / 180;
  const el = (p.elevation * Math.PI) / 180;
  const target: [number, number, number] = [0, portrait ? 0 : -2.2, 0];
  const position: [number, number, number] = [target[0] + Math.sin(yaw) * Math.cos(el) * dist, target[1] + Math.sin(el) * dist, target[2] + Math.cos(yaw) * Math.cos(el) * dist];

  const total = plan.cells.length;
  const titleIn = prog(frame, p.buildAt + p.buildFrames * 0.5, p.buildAt + p.buildFrames + 14, ease.out);

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${p.skyTop} 0%, ${p.skyBottom} 100%)`}}>
      <Stage3D shadows="soft" flat>
        <CameraRig position={position} target={target} fov={fov} near={1} far={600} />
        <ambientLight intensity={1.15} color="#fff8ee" />
        <hemisphereLight args={['#ffffff', '#9fc3d8', 0.4]} />
        <directionalLight
          position={[-n * 0.9, n * 1.5, n * 0.7]}
          intensity={1.0}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-n * 1.1}
          shadow-camera-right={n * 1.1}
          shadow-camera-top={n * 1.1}
          shadow-camera-bottom={-n * 1.1}
          shadow-camera-near={1}
          shadow-camera-far={n * 5}
          shadow-bias={-0.0006}
          shadow-radius={6}
        />
        {/* slab */}
        <mesh position={[0, -1.5, 0]} receiveShadow castShadow>
          <boxGeometry args={[m, 3, m]} />
          <meshLambertMaterial color={mixHex(pal.water, '#10304a', 0.5)} />
        </mesh>
        <VoxelInstances poses={seaPoses} colors={[pal.water, pal.waterLight]} size={1.0} bevel={0.05} />
        <VoxelInstances poses={poses} colors={slots} size={0.97} bevel={0.07} />
        {p.clouds > 0 && <VoxelInstances poses={cloudPoses} colors={[pal.cloud]} size={1.9} bevel={0.4} />}
      </Stage3D>
      {(p.title || p.subtitle || p.hud) && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: portrait ? h * 0.07 : h * 0.065, textAlign: 'center', opacity: titleIn, transform: `translateY(${(1 - titleIn) * 14 * u}px)`}}>
          {p.title && <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: (portrait ? 84 : 66) * u, color: p.inkColor, letterSpacing: -1 * u, textShadow: `0 ${2 * u}px 0 ${hexA('#ffffff', 0.5)}`}}>{p.title}</div>}
          <div style={{fontFamily: fonts.mono, fontSize: 16 * u, letterSpacing: 4 * u, color: hexA(p.inkColor, 0.7), marginTop: 10 * u}}>
            {[p.subtitle.toUpperCase(), p.hud ? `${landed} / ${total} CUBES` : ''].filter(Boolean).join('  ·  ')}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const voxelDiorama = defineMotion<Props>({
  id: 'voxel-diorama',
  title: 'Voxel diorama',
  category: '3d',
  description:
    'A voxel island with beach, grass, rock, block trees and a little hut builds itself as cubes drop in waves (low and central first, decorations last) in a sea of bobbing water cubes on a slab, under drifting cube clouds, with a slow orbiting camera, soft shadows and a cube-count caption.',
  source: ['prompt-corpus: voxel-diorama (11 cases, awesome-opus5-5-videos)'],
  useFor: 'Gaming content, playful brand "worlds", kids explainers, a loader or intro that builds a place. Pass heightmap (rows of integer column heights) to build your own terrain.',
  durationInFrames: 180,
  defaultProps: {
    title: 'Voxel Isle',
    subtitle: 'built one cube at a time',
    heightmap: [],
    size: 22,
    seed: 7,
    trees: 6,
    houses: 1,
    maxHeight: 6,
    buildAt: 12,
    buildFrames: 78,
    fallFrames: 14,
    dropHeight: 22,
    orbit: 15,
    yaw: 35,
    elevation: 32,
    clouds: 3,
    hud: true,
    skyTop: '#8ed3f2',
    skyBottom: '#eaf8ff',
    inkColor: '#173a4f',
    palette: PAL,
  },
  propDocs: {
    title: 'caption headline ("" for none)',
    subtitle: 'caption sub-line',
    heightmap: 'optional rows of integer column heights (0 = sea); empty = generated island',
    size: 'generated island grid size (cells)',
    seed: 'terrain / tree / cloud seed',
    trees: 'number of block trees',
    houses: 'number of huts',
    maxHeight: 'peak height of the generated terrain in cubes',
    buildAt: 'frame the first cube starts to fall',
    buildFrames: 'frames over which the build runs (1-3 s)',
    fallFrames: 'fall time of each cube',
    dropHeight: 'drop height in cubes',
    orbit: 'camera orbit speed in degrees per second',
    yaw: 'start camera azimuth in degrees',
    elevation: 'camera elevation in degrees',
    clouds: 'drifting cube clouds',
    hud: 'show the "n / total cubes" counter',
    skyTop: 'sky gradient top',
    skyBottom: 'sky gradient bottom',
    inkColor: 'caption colour',
    palette: 'colour overrides {water,waterLight,sand,grass,grass2,rock,snow,dirt,wood,leaf,leaf2,roof,wall,cloud}',
  },
  component: VoxelDiorama,
  tags: ['voxel', 'diorama', 'island', 'blocks', 'cubes', 'minecraft-like', 'build', 'world', 'game', 'kids', 'playful', 'three.js', '3d', 'orbit', 'heightmap', 'water', 'clouds', 'trees', 'isometric', 'loader', 'clay'],
});
