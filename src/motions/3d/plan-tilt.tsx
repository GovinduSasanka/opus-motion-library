import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import monoFont from 'three/examples/fonts/droid/droid_sans_mono_regular.typeface.json';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {CameraRig, fbm2, noiseTexture, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * video9 "Every house starts as a plan": an ink floor plan draws on top-down (poché walls, door swings,
 * furniture, floor-stencil room labels and dimension strings), then the camera tilts from top-down to
 * eye level while the walls extrude into a 3D line drawing, dollies through the front door into the
 * house, and cranes back up until it reads as the plan again. Paper-white faces, ink edges (fat lines),
 * charcoal poché wall tops; labels are real mono glyph geometry printed on the floor.
 */

type Wall = [number, number, number, number];
type Room = {name: string; x: number; z: number; w: number; d: number};
type Furn = {x: number; z: number; w: number; d: number; h: number};
type Door = {x: number; z: number; r: number; a0: number};
type Props = {
  walls: Wall[];
  rooms: Room[];
  furniture: Furn[];
  doors: Door[];
  entrance: [number, number];
  wallHeight: number;
  wallThickness: number;
  paper: string;
  ink: string;
  poche: string;
  accent: string;
  title: string;
  kicker: string;
  showTitle: boolean;
  walkIn: boolean;
  mode: 'tour' | 'popup';
  popupFrames: number;
  pageGhost: number;
};

const WALLS: Wall[] = [
  [0, 0, 16, 0],
  [16, 0, 16, 11],
  [16, 11, 8.7, 11],
  [7.3, 11, 0, 11],
  [0, 11, 0, 0],
  [6, 0, 6, 4],
  [6, 5, 6, 11],
  [0, 6, 1, 6],
  [2, 6, 4, 6],
  [5, 6, 6, 6],
  [3, 6, 3, 11],
  [6, 7, 7, 7],
  [9, 7, 16, 7],
  [12, 0, 12, 3],
  [12, 5, 12, 7],
  [10, 7, 10, 9],
  [10, 10, 10, 11],
];
const ROOMS: Room[] = [
  {name: 'BEDROOM', x: 3, z: 4.7, w: 6, d: 6},
  {name: 'BATH', x: 1.5, z: 7.4, w: 3, d: 5},
  {name: 'STUDY', x: 4.5, z: 7.4, w: 3, d: 5},
  {name: 'ENTRANCE', x: 8, z: 8.5, w: 4, d: 4},
  {name: 'LIVING', x: 9.2, z: 5.4, w: 6, d: 7},
  {name: 'KITCHEN', x: 14, z: 5.7, w: 4, d: 7},
  {name: 'STUDIO', x: 13, z: 8.1, w: 6, d: 4},
];
const FURN: Furn[] = [
  {x: 2.2, z: 2.6, w: 2.0, d: 2.2, h: 0.5},
  {x: 8.9, z: 1.3, w: 3.6, d: 0.9, h: 0.8},
  {x: 7.4, z: 2.6, w: 0.9, d: 1.8, h: 0.8},
  {x: 9.4, z: 3.3, w: 1.4, d: 0.8, h: 0.4},
  {x: 14.1, z: 3.5, w: 1.0, d: 2.4, h: 0.9},
  {x: 15.4, z: 1.6, w: 0.6, d: 3.0, h: 0.9},
  {x: 4.6, z: 10.2, w: 1.6, d: 0.7, h: 0.75},
  {x: 1.0, z: 10.2, w: 1.6, d: 0.8, h: 0.5},
  {x: 13.2, z: 9.6, w: 2.6, d: 1.0, h: 0.75},
];
const DOORS: Door[] = [
  {x: 7.3, z: 11, r: 1.4, a0: 0},
  {x: 6, z: 4, r: 1.0, a0: Math.PI / 2},
  {x: 1, z: 6, r: 1.0, a0: 0},
  {x: 4, z: 6, r: 1.0, a0: 0},
  {x: 12, z: 3, r: 1.0, a0: Math.PI / 2},
  {x: 10, z: 9, r: 1.0, a0: Math.PI / 2},
];

const FONT = new FontLoader().parse(monoFont as unknown as Parameters<FontLoader['parse']>[0]);

/** flat text geometry (XZ plane, reading along +x, letters "up" toward -z) with tracking */
const textGeo = (str: string, size: number, tracking = 0.25, align: 'center' | 'left' = 'center') => {
  const parts: THREE.BufferGeometry[] = [];
  let x = 0;
  const data = (FONT as unknown as {data: {glyphs: Record<string, {ha: number}>; resolution: number}}).data;
  for (const ch of str) {
    const g = data.glyphs[ch] ?? data.glyphs['?'];
    const adv = ((g?.ha ?? 600) / data.resolution) * size;
    if (ch !== ' ') {
      const shapes = FONT.generateShapes(ch, size);
      const geo = new THREE.ShapeGeometry(shapes, 3);
      geo.translate(x, 0, 0);
      parts.push(geo);
    }
    x += adv + tracking * size;
  }
  const width = x - tracking * size;
  const merged = parts.length ? mergeGeometries(parts) : new THREE.BufferGeometry();
  merged.translate(align === 'center' ? -width / 2 : 0, -size / 2, 0);
  merged.rotateX(-Math.PI / 2);
  return merged;
};

const fatLines = (segs: number[], width: number, color: string, w: number, h: number, opacity = 1) => {
  const g = new LineSegmentsGeometry();
  g.setPositions(segs.length ? segs : [0, -99, 0, 0, -99, 0]);
  const m = new LineMaterial({linewidth: width, color: new THREE.Color(color).getHex(), transparent: true, opacity});
  m.resolution.set(w, h);
  const o = new LineSegments2(g, m);
  o.frustumCulled = false;
  return o;
};

const BOX_EDGES = (() => {
  const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  return Array.from(e.attributes.position.array as Float32Array);
})();

/** a wall: unit box scaled; paper faces, poché top, ink edges */
const WallMesh: React.FC<{wall: Wall; t: number; draw: number; height: number; thick: number; mats: THREE.Material[]; edgeMat: LineMaterial}> = ({wall, t, draw, height, thick, mats, edgeMat}) => {
  const [x1, z1, x2, z2] = wall;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const ang = Math.atan2(z2 - z1, x2 - x1);
  const L = len * draw + thick;
  const cx = x1 + Math.cos(ang) * (len * draw) * 0.5;
  const cz = z1 + Math.sin(ang) * (len * draw) * 0.5;
  const hgt = Math.max(0.02, height * t);
  const edges = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(BOX_EDGES);
    const o = new LineSegments2(g, edgeMat);
    o.frustumCulled = false;
    return o;
  }, [edgeMat]);
  if (draw <= 0) return null;
  return (
    <group position={[cx, hgt / 2, cz]} rotation={[0, -ang, 0]} scale={[L, hgt, thick]}>
      <mesh material={mats}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      <primitive object={edges} />
    </group>
  );
};

const PlanTilt: React.FC<Props> = ({walls, rooms, furniture, doors, entrance, wallHeight, wallThickness, paper, ink, poche, accent, title, kicker, showTitle, walkIn, mode, popupFrames, pageGhost}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const aspect = w / h;

  // ---- materials ----
  const wallMats = useMemo(() => {
    const side = new THREE.MeshBasicMaterial({color: '#f7f5ef', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
    const side2 = new THREE.MeshBasicMaterial({color: '#ebe8df', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
    const top = new THREE.MeshBasicMaterial({color: poche, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
    // +x, -x, +y, -y, +z, -z
    return [side2, side2, top, side, side, side];
  }, [poche]);
  const edgeMat = useMemo(() => {
    const m = new LineMaterial({linewidth: 1.7 * u, color: new THREE.Color(ink).getHex()});
    m.resolution.set(w, h);
    return m;
  }, [ink, u, w, h]);
  const furnMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#f9f7f2', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1}), []);
  const paperTex = useMemo(
    () =>
      noiseTexture(256, (x, y) => 0.5 + 0.5 * fbm2('lintel', x * 4, y * 4, 4), (v) => {
        const c = new THREE.Color('#e6e2d7').lerp(new THREE.Color('#f6f3ea'), v);
        return [c.r, c.g, c.b, 1];
      }),
    [],
  );
  useLayoutEffect(() => {
    paperTex.repeat.set(14, 14);
  }, [paperTex]);

  // ---- static floor ink: grid, door swings, dimension lines ----
  const minX = Math.min(...walls.flatMap((q) => [q[0], q[2]]));
  const maxX = Math.max(...walls.flatMap((q) => [q[0], q[2]]));
  const minZ = Math.min(...walls.flatMap((q) => [q[1], q[3]]));
  const maxZ = Math.max(...walls.flatMap((q) => [q[1], q[3]]));
  const PW = maxX - minX;
  const PD = maxZ - minZ;
  const C: V3 = [(minX + maxX) / 2, 0, (minZ + maxZ) / 2];
  const gridObj = useMemo(() => {
    const s: number[] = [];
    const y = 0.003;
    for (let x = Math.floor(minX - 6); x <= maxX + 6; x++) s.push(x, y, minZ - 5, x, y, maxZ + 6);
    for (let z = Math.floor(minZ - 5); z <= maxZ + 6; z++) s.push(minX - 6, y, z, maxX + 6, y, z);
    return fatLines(s, 1 * u, '#cfc9bc', w, h, 0.7);
  }, [minX, maxX, minZ, maxZ, u, w, h]);
  const doorObj = useMemo(() => {
    const s: number[] = [];
    const y = 0.006;
    for (const d of doors) {
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a = d.a0 + (i / n) * (Math.PI / 2);
        const b = d.a0 + ((i + 1) / n) * (Math.PI / 2);
        s.push(d.x + Math.cos(a) * d.r, y, d.z - Math.sin(a) * d.r, d.x + Math.cos(b) * d.r, y, d.z - Math.sin(b) * d.r);
      }
      const e = d.a0 + Math.PI / 2;
      s.push(d.x, y, d.z, d.x + Math.cos(e) * d.r, y, d.z - Math.sin(e) * d.r);
    }
    // dimension strings
    const dz = minZ - 1.2;
    s.push(minX, y, dz, maxX, y, dz);
    for (const x of [minX, maxX]) s.push(x, y, dz - 0.3, x, y, dz + 0.3);
    const dx = minX - 1.2;
    s.push(dx, y, minZ, dx, y, maxZ);
    for (const z of [minZ, maxZ]) s.push(dx - 0.3, y, z, dx + 0.3, y, z);
    return fatLines(s, 1.4 * u, ink, w, h, 0.9);
  }, [doors, minX, maxX, minZ, maxZ, ink, u, w, h]);
  const accentObj = useMemo(() => {
    // dashed orange construction line along the entrance axis
    const s: number[] = [];
    for (let z = entrance[1] + 0.6; z < entrance[1] + 7; z += 0.5) s.push(entrance[0], 0.006, z, entrance[0], 0.006, z + 0.28);
    return fatLines(s, 2 * u, accent, w, h, 0.9);
  }, [entrance, accent, u, w, h]);

  // ---- labels ----
  const labelGeos = useMemo(
    () =>
      rooms.map((r) => ({
        name: textGeo(r.name, Math.min(0.42, (r.w * 0.8) / (r.name.length * 0.85)), 0.25),
        dims: textGeo(`${(r.w * r.d).toFixed(0)} m2  ${r.w.toFixed(1)}x${r.d.toFixed(1)}`, Math.min(0.2, (r.w * 0.85) / 16), 0.12),
      })),
    [rooms],
  );
  const dimGeos = useMemo(() => ({top: textGeo(PW.toFixed(2), 0.4, 0.15), side: textGeo(PD.toFixed(2), 0.4, 0.15), plan: textGeo('GROUND FLOOR PLAN', 0.42, 0.3)}), [PW, PD]);
  const inkMat = useMemo(() => new THREE.MeshBasicMaterial({color: ink, transparent: true, side: THREE.DoubleSide}), [ink]);
  const greyMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#6b675f', transparent: true, side: THREE.DoubleSide}), []);

  // ---- timeline ----
  const drawEnd = 62;
  const wallDraw = (i: number) => prog(frame, 4 + i * (40 / walls.length), 4 + i * (40 / walls.length) + 12, ease.out);
  const furnOn = (i: number) => prog(frame, 34 + i * 2.5, 46 + i * 2.5, ease.out);
  const doorsOn = prog(frame, 38, 56, ease.out);
  const labelsOn = prog(frame, 48, 66, ease.out);
  useLayoutEffect(() => {
    inkMat.opacity = labelsOn;
    greyMat.opacity = labelsOn * 0.9;
    (doorObj.material as LineMaterial).opacity = 0.9 * doorsOn;
    (accentObj.material as LineMaterial).opacity = 0.9 * labelsOn;
    (gridObj.material as LineMaterial).opacity = 0.7 * prog(frame, 0, 20, ease.out);
  }, [inkMat, greyMat, labelsOn, doorObj, doorsOn, accentObj, gridObj, frame]);

  const tiltA = 84;
  const tiltB = 150;
  const dollyA = 158;
  const dollyB = 222;
  const craneA = 232;
  const craneB = 290;
  const popup = mode === 'popup';
  // popup: the flat drawing is complete by ~70, then pieces rise back -> front with a paper-pop overshoot
  const popStart = 74;
  const riseF = Math.max(8, popupFrames);
  const popU = (order: number, n: number, at: number) => {
    const t0 = at + (order / Math.max(1, n)) * 34;
    return Math.max(0, prog(frame, t0, t0 + riseF, ease.back));
  };
  const wallOrder = (i: number) => {
    const q = walls[i];
    return clamp((Math.max(q[1], q[3]) - minZ) / Math.max(1, PD), 0, 1) * walls.length; // back (small z) first
  };
  const wallH = (i: number) => (popup ? wallHeight * popU(wallOrder(i), walls.length, popStart) : 0);
  const ext = popup ? 0 : prog(frame, tiltA + 4, tiltB - 10, ease.inOut) * (1 - prog(frame, craneA + 18, craneB + 4, ease.inOut));
  const height = wallHeight * ext;
  const ghostObj = useMemo(() => {
    const s: number[] = [];
    const y = 0.005;
    const t = wallThickness / 2;
    for (const [x1, z1, x2, z2] of walls) {
      const a = Math.atan2(z2 - z1, x2 - x1);
      const nx = -Math.sin(a) * t;
      const nz = Math.cos(a) * t;
      const ex = Math.cos(a) * t;
      const ez = Math.sin(a) * t;
      const P = [
        [x1 - ex + nx, z1 - ez + nz],
        [x2 + ex + nx, z2 + ez + nz],
        [x2 + ex - nx, z2 + ez - nz],
        [x1 - ex - nx, z1 - ez - nz],
      ];
      for (let k = 0; k < 4; k++) s.push(P[k][0], y, P[k][1], P[(k + 1) % 4][0], y, P[(k + 1) % 4][1]);
    }
    return fatLines(s, 1.2 * u, ink, w, h, 1);
  }, [walls, wallThickness, ink, u, w, h]);
  useLayoutEffect(() => {
    (ghostObj.material as LineMaterial).opacity = popup ? pageGhost * prog(frame, 4, 40, ease.out) : 0;
  }, [ghostObj, popup, pageGhost, frame]);

  // ---- camera ----
  const fovTop = portrait ? 62 : 40;
  const fovEye = portrait ? 74 : 58;
  const fitW = PW + (portrait ? 3 : 7);
  const fitH = PD + 6;
  const vfovR = (fovTop * Math.PI) / 180;
  const needH = Math.max(fitH, (fitW * (showTitle && !portrait ? 1.38 : 1)) / aspect, showTitle && portrait ? fitH * 1.3 : 0);
  const topDist = needH / 2 / Math.tan(vfovR / 2);
  const ent: V3 = [entrance[0], 0, entrance[1]];
  // top-down pose (slight push during the draw)
  const topPush = lerp(1.06, 1.0, ease.sine(prog(frame, 0, tiltA, ease.linear)));
  const visH = topDist * 2 * Math.tan(vfovR / 2);
  const offX = showTitle && !portrait ? -visH * aspect * 0.13 : 0;
  const offZ = showTitle && portrait ? -visH * 0.1 : 0;
  const topPos = (k = 1): V3 => [C[0] + offX, topDist * topPush * k, C[2] + offZ + 0.02];
  let camPos: V3 = topPos();
  let tgt: V3 = [C[0] + offX, 0, C[2] + offZ];
  let fov = fovTop;
  const outside: V3 = [ent[0], 1.6, ent[2] + 5.5];
  if (frame >= tiltA) {
    // tilt: pitch -90 -> ~-2, while dropping to eye height in front of the entrance
    const p = ease.inOut(prog(frame, tiltA, tiltB, ease.linear));
    const zoom = ease.in(prog(frame, tiltA, tiltA + 30, ease.linear));
    const pitch = lerp(89.5, 2, p) * (Math.PI / 180);
    const focus: V3 = [lerp(C[0] + offX, ent[0], zoom), lerp(0, 1.5, p), lerp(C[2] + offZ, ent[2], zoom)];
    const R = lerp(topDist, 5.6, Math.min(1, zoom * 0.5 + p * 0.6));
    camPos = [focus[0], focus[1] + Math.sin(pitch) * R, focus[2] + Math.cos(pitch) * R];
    tgt = focus;
    fov = lerp(fovTop, fovEye, p);
  }
  if (walkIn && frame >= dollyA) {
    // doorway dolly-through: front door -> entrance -> living opening, slight yaw
    const p = ease.inOut(prog(frame, dollyA, dollyB, ease.linear));
    const keys: V3[] = [outside, [ent[0], 1.6, ent[2] - 0.6], [ent[0] - 0.4, 1.6, ent[2] - 4.6]];
    const s = p * 2;
    const i = Math.min(1, Math.floor(s));
    const f = s - i;
    camPos = [lerp(keys[i][0], keys[i + 1][0], f), 1.6, lerp(keys[i][2], keys[i + 1][2], f)];
    const yaw = lerp(0, 0.55, ease.sine(p));
    tgt = [camPos[0] + Math.sin(yaw) * 6, lerp(1.5, 1.1, p), camPos[2] - Math.cos(yaw) * 6];
    fov = fovEye;
  }
  if (frame >= craneA) {
    // crane up to the plan
    const p = ease.inOut(prog(frame, craneA, craneB, ease.linear));
    const from = walkIn ? camPos : outside;
    const fromT = tgt;
    const top = topPos(1.02 + 0.03 * prog(frame, craneB, 300, ease.linear));
    const pitch = lerp(5, 89.5, p) * (Math.PI / 180);
    const focus: V3 = [lerp(fromT[0], C[0] + offX, p), lerp(1.5, 0, p), lerp(fromT[2], C[2] + offZ, p)];
    const R = lerp(Math.hypot(from[0] - fromT[0], from[2] - fromT[2]) + 1, top[1], p);
    camPos = [focus[0], focus[1] + Math.sin(pitch) * R, focus[2] + Math.cos(pitch) * R];
    tgt = focus;
    fov = lerp(fovEye, fovTop, p);
  }

  if (popup) {
    // top-down while it draws, then tilt to a high oblique, keep pushing in and slowly orbit
    const p = ease.inOut(prog(frame, 66, 150, ease.linear));
    const pitch = lerp(89.5, portrait ? 50 : 46, p) * (Math.PI / 180);
    const yaw = lerp(0, portrait ? -0.3 : -0.42, ease.inOut(prog(frame, 70, 300, ease.linear)));
    const push = lerp(1, portrait ? 0.95 : 0.94, ease.out(prog(frame, 80, 300, ease.linear)));
    const R = topDist * push * lerp(1, portrait ? 1.3 : 1.2, p);
    const focus: V3 = [C[0] + offX * (1 - p), lerp(0, wallHeight * 0.35, p), C[2] + offZ * (1 - p)];
    camPos = [focus[0] + Math.sin(yaw) * Math.cos(pitch) * R, focus[1] + Math.sin(pitch) * R, focus[2] + Math.cos(yaw) * Math.cos(pitch) * R + 0.02];
    tgt = focus;
    fov = fovTop;
  }

  const hud = prog(frame, 6, 22, ease.out) * (1 - prog(frame, popup ? 70 : tiltA, (popup ? 70 : tiltA) + 14, ease.linear));
  const hud2 = popup ? 0 : prog(frame, craneB - 10, craneB + 6, ease.out);
  const hint = popup ? (frame < popStart ? 'FLAT DRAWING' : 'EXTRUDING') : frame < tiltA ? 'SCROLL TO WALK IN' : frame < craneA ? 'ENTRANCE · LIVING' : 'GROUND FLOOR · 7 ROOMS';

  return (
    <AbsoluteFill style={{background: paper}}>
      <Stage3D>
        <CameraRig position={camPos} target={tgt} fov={fov} near={0.05} far={600} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[C[0], 0, C[2]]}>
          <planeGeometry args={[600, 600]} />
          <meshBasicMaterial map={paperTex} color="#ffffff" />
        </mesh>
        <primitive object={gridObj} />
        <primitive object={doorObj} />
        <primitive object={accentObj} />
        <primitive object={ghostObj} />
        {walls.map((q, i) => (
          <WallMesh key={i} wall={q} t={1} draw={wallDraw(i)} height={Math.max(0.03, popup ? wallH(i) : height)} thick={wallThickness} mats={wallMats} edgeMat={edgeMat} />
        ))}
        {furniture.map((f, i) => {
          const on = furnOn(i);
          if (on <= 0) return null;
          return (
            <FurnMesh key={i} f={f} on={on} ext={popup ? popU(i + walls.length * 0.5, walls.length, popStart + 22) : ext} mat={furnMat} edgeMat={edgeMat} />
          );
        })}
        {labelGeos.map((g, i) => (
          <group key={i} position={[rooms[i].x, 0.008, rooms[i].z]}>
            <mesh geometry={g.name} material={inkMat} />
            <mesh geometry={g.dims} material={greyMat} position={[0, 0, 0.5]} />
          </group>
        ))}
        <mesh geometry={dimGeos.top} material={inkMat} position={[C[0], 0.008, minZ - 1.75]} />
        <group position={[minX - 1.75, 0.008, C[2]]} rotation={[0, Math.PI / 2, 0]}>
          <mesh geometry={dimGeos.side} material={inkMat} />
        </group>
        <mesh geometry={dimGeos.plan} material={inkMat} position={[C[0], 0.008, maxZ + 1.7]} />
      </Stage3D>
      {showTitle && (hud > 0 || hud2 > 0) && (
        <div style={{position: 'absolute', left: 64 * u, top: 60 * u, opacity: Math.max(hud, hud2), color: ink}}>
          <div style={{fontFamily: fonts.mono, fontSize: 15 * u, letterSpacing: '0.22em', opacity: 0.7, marginBottom: 14 * u}}>{kicker}</div>
          <div style={{fontFamily: fonts.display, fontSize: 64 * u, lineHeight: 1.0, textTransform: 'uppercase', whiteSpace: 'pre-line', maxWidth: (portrait ? 900 : 560) * u}}>
            {title.split('|').map((line, i, arr) => (
              <div key={i} style={{color: i === arr.length - 1 ? accent : ink}}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 30 * u, textAlign: 'center', fontFamily: fonts.mono, fontSize: 14 * u, letterSpacing: '0.3em', color: ink, opacity: 0.85}}>
        {hint}
        <div style={{width: 180 * u, height: 1, margin: `${10 * u}px auto 0`, background: 'rgba(32,27,28,0.25)', position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, top: -0.5 * u, height: 2 * u, width: `${(frame / 300) * 100}%`, background: ink}} />
        </div>
      </div>
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0) 55%, rgba(120,110,95,0.18) 100%)'}} />
    </AbsoluteFill>
  );
};

const FurnMesh: React.FC<{f: Furn; on: number; ext: number; mat: THREE.Material; edgeMat: LineMaterial}> = ({f, on, ext, mat, edgeMat}) => {
  const edges = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(BOX_EDGES);
    const o = new LineSegments2(g, edgeMat);
    o.frustumCulled = false;
    return o;
  }, [edgeMat]);
  const hh = Math.max(0.015, f.h * ext) ;
  return (
    <group position={[f.x, hh / 2, f.z]} scale={[f.w * (0.6 + 0.4 * on), hh, f.d * (0.6 + 0.4 * on)]}>
      <mesh material={mat}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      <primitive object={edges} />
    </group>
  );
};

export const planTilt = defineMotion<Props>({
  id: 'plan-tilt',
  title: 'Plan tilt to 3D',
  category: '3d',
  description:
    'An ink floor plan draws on top-down, then the camera tilts to eye level as the walls extrude into a 3D line drawing, dollies through the front door, and cranes back up until it reads as the plan again.',
  source: ['video9 0:01-0:17', 'video4 paper-plane-tilt-camera'],
  useFor: 'Architecture, product or system explainers: show that the diagram and the 3D thing are the same; walk into a space.',
  durationInFrames: 300,
  defaultProps: {
    walls: WALLS,
    rooms: ROOMS,
    furniture: FURN,
    doors: DOORS,
    entrance: [8, 11],
    wallHeight: 3,
    wallThickness: 0.28,
    paper: '#efece3',
    ink: '#201b1c',
    poche: '#2a2829',
    accent: '#e24d0f',
    title: 'Every house|starts as|a plan.',
    kicker: 'LINTEL · CASA SERRA · 2026',
    showTitle: true,
    walkIn: true,
    mode: 'tour',
    popupFrames: 26,
    pageGhost: 0.3,
  },
  propDocs: {
    walls: 'wall segments [x1, z1, x2, z2] in metres (gaps = openings)',
    rooms: 'floor labels {name, x, z, w, d} (w×d prints the area string)',
    furniture: 'extruded blocks {x, z, w, d, h}',
    doors: 'door swings {x, z, r, a0} (hinge point, radius, start angle)',
    entrance: '[x, z] of the front door the camera tilts to and walks through',
    wallHeight: 'wall height in metres after extrusion',
    wallThickness: 'wall thickness in metres',
    paper: 'paper colour',
    ink: 'ink colour',
    poche: 'wall-top (poché) fill',
    accent: 'accent colour (last title line, construction line)',
    title: 'hero headline, lines separated by |',
    kicker: 'small mono line above the headline',
    showTitle: 'show the headline over the plan',
    walkIn: 'dolly through the doorway before craning back up',
    mode: "'tour' (default: tilt, walk in, crane back) or 'popup' (the flat line drawing rises off the page into a 3D ink model, camera tilts to an oblique and orbits)",
    popupFrames: 'popup mode: frames each wall/object takes to rise (with paper-pop overshoot)',
    pageGhost: 'popup mode: opacity of the flat wall footprints left on the page (0-1)',
  },
  component: PlanTilt,
  tags: ['3d', 'architecture', 'plan', 'camera', 'line-art', 'three'],
});
