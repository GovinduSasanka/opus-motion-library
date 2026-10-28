import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {clamp, ease, prog} from '../../core/ease';
import {hash01, luma, mixHex, shade} from '../../core/r2-pr2-kit';
import {Headline} from '../../core/r3-3d-kit';
import {useStage} from '../../core/stage';
import {CameraRig, SceneFog, SkyDome, Stage3D, fbm2, smoothstep, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * A seeded, flat-shaded low-poly island (height-map terrain with a 5-colour palette, pine trees, drifting low-poly
 * clouds and a faceted sea) with a camera that flies over it, hugging the ground, under a gradient sky and fog.
 */
type Props = {
  seed: number;
  palette: string[];
  sky: string[];
  sunColor: string;
  sunHeight: number;
  relief: number;
  seaLevel: number;
  trees: number;
  clouds: number;
  path: string;
  speed: number;
  altitude: number;
  fog: number;
  title: string;
  subtitle: string;
  ink: string;
  titlePlace: string;
  size: number;
};

const SIZE = 260; // terrain edge (world units)
const SEG = 84;

type Terrain = {geo: THREE.BufferGeometry; heightAt: (x: number, z: number) => number; trees: THREE.BufferGeometry | null};

const buildTerrain = (seed: number, relief: number, sea: number, palette: string[], nTrees: number): Terrain => {
  const s = `lp${seed}`;
  const f = 1 / (SIZE * 0.3);
  const heightAt = (x: number, z: number) => {
    const n = fbm2(s, x * f, z * f, 5);
    const ridge = 1 - Math.abs(fbm2(s + 'r', x * f * 1.7 + 9, z * f * 1.7 - 4, 3));
    let hh = 0.5 + 0.62 * n + 0.3 * (ridge * ridge - 0.45);
    hh -= sea;
    const d = Math.hypot(x, z) / (SIZE * 0.5);
    const mask = 1 - smoothstep(0.42, 0.92, d);
    hh = hh * mask + -0.32 * (1 - mask);
    return hh >= 0 ? Math.pow(hh, 1.4) * relief * 1.05 : hh * relief * 0.5;
  };
  const [cWater, cSand, cGrass, cRock, cSnow] = [0, 1, 2, 3, 4].map((i) => new THREE.Color(palette[i] ?? ['#2f9fd0', '#f2dd9c', '#7cc65a', '#8c8f9a', '#ffffff'][i]));
  const cDeep = cWater.clone().lerp(cSand, 0.35).multiplyScalar(0.75);
  const cForest = cGrass.clone().multiplyScalar(0.62);
  const colourOf = (e: number, slope: number, v: number) => {
    const r = e / relief;
    const c = new THREE.Color();
    if (e < -0.2) c.copy(cDeep);
    else if (e < 0.05 * relief) c.copy(cSand);
    else if (r < 0.62) c.copy(cGrass).lerp(cForest, smoothstep(0.25, 0.6, r) * 0.6);
    else if (r < 0.86) c.copy(cRock).lerp(cGrass, smoothstep(0.74, 0.62, r) * 0.5);
    else c.copy(cSnow);
    if (slope > 0.9 && e > 0.05 * relief && r < 0.86) c.lerp(cRock, clamp((slope - 0.9) * 1.1));
    return c.multiplyScalar(0.93 + v * 0.14);
  };

  const step = SIZE / SEG;
  const H: number[][] = [];
  for (let i = 0; i <= SEG; i++) {
    H[i] = [];
    for (let j = 0; j <= SEG; j++) H[i][j] = heightAt(-SIZE / 2 + i * step, -SIZE / 2 + j * step);
  }
  const pos: number[] = [];
  const col: number[] = [];
  const tri = (a: [number, number], b: [number, number], c: [number, number], k: number) => {
    const ys = [H[a[0]][a[1]], H[b[0]][b[1]], H[c[0]][c[1]]];
    const e = (ys[0] + ys[1] + ys[2]) / 3;
    const slope = (Math.max(...ys) - Math.min(...ys)) / step;
    const colr = colourOf(e, slope, hash01(a[0], a[1], k + seed));
    [a, b, c].forEach((p) => {
      pos.push(-SIZE / 2 + p[0] * step, H[p[0]][p[1]], -SIZE / 2 + p[1] * step);
      col.push(colr.r, colr.g, colr.b);
    });
  };
  for (let i = 0; i < SEG; i++)
    for (let j = 0; j < SEG; j++) {
      // alternate the diagonal for a less regular facet pattern
      if ((i + j + seed) % 2 === 0) {
        tri([i, j], [i, j + 1], [i + 1, j], 1);
        tri([i + 1, j], [i, j + 1], [i + 1, j + 1], 2);
      } else {
        tri([i, j], [i, j + 1], [i + 1, j + 1], 1);
        tri([i, j], [i + 1, j + 1], [i + 1, j], 2);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();

  // trees: two stacked cones per tree, merged into one geometry
  let treeGeo: THREE.BufferGeometry | null = null;
  if (nTrees > 0) {
    const cone = new THREE.ConeGeometry(1, 2.3, 5, 1).toNonIndexed();
    const cp = cone.attributes.position;
    const tp: number[] = [];
    const tc: number[] = [];
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    let placed = 0;
    for (let k = 0; k < nTrees * 6 && placed < nTrees; k++) {
      const x = (hash01(k, seed, 1) - 0.5) * SIZE * 0.9;
      const z = (hash01(k, seed, 2) - 0.5) * SIZE * 0.9;
      const e = heightAt(x, z);
      if (e < 0.06 * relief || e > 0.52 * relief) continue;
      const sl = Math.abs(heightAt(x + 2, z) - e) + Math.abs(heightAt(x, z + 2) - e);
      if (sl > 3.4) continue;
      // trees cluster where a second noise says "forest"
      if (fbm2(s + 'f', x * f * 3, z * f * 3, 2) < -0.05) continue;
      placed++;
      const sc = 0.95 + hash01(k, seed, 3) * 1.0;
      const tcol = cForest.clone().multiplyScalar(0.85 + hash01(k, seed, 4) * 0.35).lerp(cGrass, hash01(k, seed, 5) * 0.2);
      for (let tier = 0; tier < 2; tier++) {
        const ts = sc * (tier === 0 ? 1 : 0.68);
        m.compose(v.set(x, e + sc * (tier === 0 ? 1.45 : 2.6) - 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, hash01(k, seed, 6) * 6.28, 0)), new THREE.Vector3(ts * 0.62, ts * 0.9, ts * 0.62));
        for (let q = 0; q < cp.count; q++) {
          v.fromBufferAttribute(cp, q).applyMatrix4(m);
          tp.push(v.x, v.y, v.z);
          tc.push(tcol.r, tcol.g, tcol.b);
        }
      }
    }
    treeGeo = new THREE.BufferGeometry();
    treeGeo.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
    treeGeo.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3));
    treeGeo.computeVertexNormals();
  }
  return {geo, heightAt, trees: treeGeo};
};

const Sea: React.FC<{color: string; frame: number}> = ({color, frame}) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(SIZE * 1.7, SIZE * 1.7, 56, 56), []);
  useLayoutEffect(() => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      p.setZ(i, 0.5 * Math.sin(x * 0.06 + frame * 0.04) + 0.4 * Math.sin(y * 0.08 - frame * 0.03 + 1.3) + 0.25 * Math.sin((x + y) * 0.12 + frame * 0.05));
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  }, [geo, frame]);
  return (
    <group>
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} flatShading transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <planeGeometry args={[SIZE * 9, SIZE * 9]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </mesh>
    </group>
  );
};

const Clouds: React.FC<{n: number; seed: number; frame: number; y: number; color: string}> = ({n, seed, frame, y, color}) => {
  const items = useMemo(
    () =>
      Array.from({length: n}, (_, i) => ({
        x: (hash01(i, seed, 11) - 0.5) * SIZE * 1.2,
        z: (hash01(i, seed, 12) - 0.5) * SIZE * 1.2,
        y: y + hash01(i, seed, 13) * 34 - 6,
        s: 7 + hash01(i, seed, 14) * 9,
        blobs: [0, 1, 2, 3].map((b) => ({dx: (b - 1.5) * 0.9 + hash01(i, b, 15) * 0.4, dy: hash01(i, b, 16) * 0.35, r: 0.8 - Math.abs(b - 1.5) * 0.18 + hash01(i, b, 17) * 0.2})),
      })),
    [n, seed, y],
  );
  return (
    <>
      {items.map((c, i) => (
        <group key={i} position={[((c.x + frame * 0.12 + SIZE * 0.6) % (SIZE * 1.2)) - SIZE * 0.6, c.y, c.z]} scale={c.s}>
          {c.blobs.map((b, k) => (
            <mesh key={k} position={[b.dx, b.dy, 0]} scale={[b.r * 1.3, b.r * 0.62, b.r]}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={color} roughness={1} flatShading emissive={color} emissiveIntensity={0.28} fog={false} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
};

const LowPolyFlyover: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, durationInFrames, portrait} = useStage();
  const T = useMemo(() => buildTerrain(P.seed, P.relief, P.seaLevel, P.palette, Math.round(P.trees)), [P.seed, P.relief, P.seaLevel, P.palette, P.trees]);

  const [skyTop, skyHor] = [P.sky[0] ?? '#4a8fe0', P.sky[1] ?? '#ffe3c2'];
  const water = P.palette[0] ?? '#2f9fd0';
  const q = clamp((frame / Math.max(1, durationInFrames - 1)) * P.speed, 0, 1.4);

  // camera path: fly = a gently weaving pass across the island, orbit = a circle around it
  const pathXZ = (t: number): [number, number] => {
    if (P.path === 'orbit') {
      const a = -0.6 + t * Math.PI * 1.1;
      return [Math.sin(a) * SIZE * 0.28, Math.cos(a) * SIZE * 0.28];
    }
    return [Math.sin(t * Math.PI * 1.5 + 0.4) * SIZE * 0.15, SIZE * 0.36 - t * SIZE * 0.66];
  };
  const groundAt = (t: number) => {
    const [x, z] = pathXZ(t);
    let m = Math.max(0, T.heightAt(x, z));
    let sum = m;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const e = Math.max(0, T.heightAt(x + Math.cos(a) * 16, z + Math.sin(a) * 16));
      m = Math.max(m, e);
      sum += e;
    }
    return 0.55 * m + 0.45 * (sum / 9);
  };
  const dq = 0.025;
  const alt = (groundAt(q - dq) + groundAt(q) * 2 + groundAt(q + dq)) / 4 + P.altitude;
  const [cx, cz] = pathXZ(q);
  const [lx, lz] = P.path === 'orbit' ? [0, 0] : pathXZ(q + 0.2);
  const lookY = P.path === 'orbit' ? Math.max(0, T.heightAt(0, 0)) + 2 : Math.max(0, T.heightAt(lx, lz)) + P.altitude * 0.1;
  const bank = P.path === 'orbit' ? 0 : clamp((pathXZ(q + 0.05)[0] - pathXZ(q)[0]) * 0.012, -0.12, 0.12);
  const cam: V3 = [cx, alt, cz];
  const tgt: V3 = [lx, P.path === 'orbit' ? lookY : Math.min(lookY, alt - 6), lz];
  const fov = portrait ? 62 : 52;
  const sunEl = (P.sunHeight * Math.PI) / 180;
  const sunDir: V3 = [Math.cos(sunEl) * 0.5, Math.sin(sunEl), -Math.cos(sunEl) * 0.85];
  const fade = ease.out(prog(frame, 0, 14, (t) => t));
  const ink = P.ink || (luma(skyHor) > 0.75 ? '#14213d' : '#ffffff');
  const hasText = !!(P.title || P.subtitle);

  return (
    <AbsoluteFill style={{background: skyHor}}>
      <Stage3D transparent={false} flat={false} exposure={1}>
        <CameraRig position={cam} target={tgt} fov={fov / P.size} near={0.5} far={900} roll={bank} />
        <SkyDome zenith={skyTop} horizon={skyHor} ground={skyHor} sunDir={sunDir} sunColor={P.sunColor} glow={0.5} radius={600} horizonSharp={3.2} />
        <SceneFog color={skyHor} density={P.fog} />
        <hemisphereLight args={[mixHex(skyTop, '#ffffff', 0.55), mixHex(P.palette[2] ?? '#7cc65a', '#ffffff', 0.25), 2.1]} />
        <directionalLight position={[sunDir[0] * 100, sunDir[1] * 100, sunDir[2] * 100]} intensity={2.4} color={P.sunColor} />
        <directionalLight position={[-sunDir[0] * 100, 40, -sunDir[2] * 100]} intensity={0.9} color={mixHex(skyTop, '#ffffff', 0.5)} />
        <mesh geometry={T.geo}>
          <meshStandardMaterial vertexColors roughness={1} metalness={0} flatShading />
        </mesh>
        {T.trees && (
          <mesh geometry={T.trees}>
            <meshStandardMaterial vertexColors roughness={1} metalness={0} flatShading />
          </mesh>
        )}
        <Sea color={water} frame={frame} />
        <Clouds n={Math.round(P.clouds)} seed={P.seed} frame={frame} y={alt * 0.55 + 28} color="#ffffff" />
      </Stage3D>
      {hasText && <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h * 0.42, background: `linear-gradient(0deg, ${luma(ink) > 0.5 ? 'rgba(10,20,40,0.55)' : 'rgba(255,255,255,0.4)'} 0%, rgba(0,0,0,0) 100%)`, opacity: fade, pointerEvents: 'none'}} />}
      <Headline title={P.title} subtitle={P.subtitle} ink={ink} at={14} place={P.titlePlace === 'center' ? 'center' : P.titlePlace === 'top' ? 'top' : 'bottom'} />
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: 1 - fade, pointerEvents: 'none'}} />
      <div style={{display: 'none'}}>{w}</div>
    </AbsoluteFill>
  );
};

export const lowPolyTerrainFlyover = defineMotion<Props>({
  id: 'low-poly-terrain-flyover',
  title: 'Low-poly terrain flyover',
  category: '3d',
  description:
    'A seeded, flat-shaded low-poly island (mountains with snow caps, grass, sand, pine forests, a faceted sea and drifting clouds) under a gradient sky and fog, with the camera flying low across it (or circling it).',
  source: ['procedural height-map terrain (original build; three.js)'],
  useFor: 'Travel and outdoors intros, game / world-building teasers, nature or sustainability titles, calm looping hero backdrops. Change `seed` for a new island, `palette` and `sky` for the mood (autumn, desert, arctic), `title` for the words.',
  durationInFrames: 240,
  defaultProps: {
    seed: 7,
    palette: ['#2f9fd0', '#f2dd9c', '#7cc65a', '#8c8f9a', '#ffffff'],
    sky: ['#4a8fe0', '#ffe3c2'],
    sunColor: '#ffd9a0',
    sunHeight: 38,
    relief: 28,
    seaLevel: 0.02,
    trees: 700,
    clouds: 9,
    path: 'fly',
    speed: 1,
    altitude: 36,
    fog: 0.0045,
    title: 'Wide open horizons',
    subtitle: 'Explore what is out there',
    ink: '',
    titlePlace: 'bottom',
    size: 1,
  },
  propDocs: {
    seed: 'island seed (any integer): a different landscape each time',
    palette: '[water, sand, grass, rock, snow] colours',
    sky: '[zenith, horizon] sky colours (the horizon colour also tints fog)',
    sunColor: 'sun / key-light colour',
    sunHeight: 'sun elevation in degrees',
    relief: 'mountain height (world units)',
    seaLevel: 'raises (positive) or lowers (negative) the sea relative to the land (-0.15..0.2)',
    trees: 'number of pine trees',
    clouds: 'number of low-poly clouds',
    path: "'fly' (low pass across the island) | 'orbit' (circle around it)",
    speed: 'how much of the path is covered (1 = the whole path over the clip)',
    altitude: 'camera height above the ground (world units)',
    fog: 'fog density (0 = clear)',
    title: 'headline ("" with an empty subtitle = scene only)',
    subtitle: 'line under the headline',
    ink: 'headline colour (empty = auto contrast)',
    titlePlace: "'bottom' | 'top' | 'center'",
    size: 'zoom multiplier (>1 = narrower lens)',
  },
  component: LowPolyFlyover,
  tags: ['terrain', 'low poly', 'landscape', 'flyover', 'fly-through', 'island', 'mountains', 'forest', 'sea', 'clouds', 'travel', 'nature', 'game', 'world', 'procedural', 'seeded', 'drone', 'three.js', '3d', 'backdrop'],
});
