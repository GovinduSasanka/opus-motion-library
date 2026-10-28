import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {ease, prog} from '../../core/ease';
import {dataTexture, hash01, luma, mixHex, shade, useImgTexture} from '../../core/r2-pr2-kit';
import {Headline, bgCss, coverTexture, fitDistBox, viewShift} from '../../core/r3-3d-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * A cut-away isometric room: the floor slab grows, two walls rise, then furniture blocks drop in one by one with a
 * squash-and-settle. Furniture, palette, wall art and timing are props; the camera is a near-orthographic iso view
 * that drifts a few degrees while it builds.
 */
type Props = {
  furniture: string[];
  wallArt: string;
  title: string;
  subtitle: string;
  background: string;
  ink: string;
  floorColor: string;
  wallColor: string;
  accent: string;
  accent2: string;
  woodColor: string;
  startAt: number;
  stagger: number;
  dropHeight: number;
  drift: number;
  size: number;
};

type Pal = {floor: string; wall: string; accent: string; accent2: string; wood: string; ink: string};

const Bx: React.FC<{p?: V3; s: V3; c: string; r?: V3; rough?: number; emissive?: string; ei?: number; cast?: boolean}> = ({p = [0, 0, 0], s, c, r = [0, 0, 0], rough = 0.85, emissive, ei = 0, cast = true}) => (
  <mesh position={p} rotation={r} castShadow={cast} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={c} roughness={rough} metalness={0} emissive={emissive ?? '#000000'} emissiveIntensity={ei} />
  </mesh>
);
const Cyl: React.FC<{p?: V3; r: number; r2?: number; h: number; c: string; seg?: number; emissive?: string; ei?: number}> = ({p = [0, 0, 0], r, r2, h, c, seg = 20, emissive, ei = 0}) => (
  <mesh position={p} castShadow receiveShadow>
    <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
    <meshStandardMaterial color={c} roughness={0.8} emissive={emissive ?? '#000000'} emissiveIntensity={ei} />
  </mesh>
);

// ---- furniture (local origin = floor point at the centre; +z is the front) ------------------------------------------
const Sofa: React.FC<{pal: Pal}> = ({pal}) => (
  <group>
    <Bx p={[0, 0.28, 0]} s={[2.3, 0.46, 1.0]} c={pal.accent} />
    <Bx p={[0, 0.78, -0.4]} s={[2.3, 0.6, 0.24]} c={shade(pal.accent, -0.08)} />
    <Bx p={[-1.12, 0.5, 0]} s={[0.26, 0.5, 1.0]} c={shade(pal.accent, -0.12)} />
    <Bx p={[1.12, 0.5, 0]} s={[0.26, 0.5, 1.0]} c={shade(pal.accent, -0.12)} />
    <Bx p={[-0.5, 0.6, 0.08]} s={[0.92, 0.18, 0.78]} c={shade(pal.accent, 0.1)} />
    <Bx p={[0.5, 0.6, 0.08]} s={[0.92, 0.18, 0.78]} c={shade(pal.accent, 0.1)} />
    <Bx p={[-0.78, 0.82, -0.12]} s={[0.46, 0.36, 0.14]} c={pal.accent2} r={[0.25, 0.2, 0.05]} />
  </group>
);
const Table: React.FC<{pal: Pal}> = ({pal}) => (
  <group>
    <Bx p={[0, 0.42, 0]} s={[1.3, 0.09, 0.78]} c={pal.wood} />
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Bx key={`${x}${z}`} p={[x * 0.55, 0.2, z * 0.3]} s={[0.07, 0.4, 0.07]} c={shade(pal.wood, -0.2)} />))}
    <Cyl p={[0.25, 0.545, 0.05]} r={0.1} h={0.16} c={pal.accent2} />
    <Bx p={[-0.3, 0.5, -0.05]} s={[0.4, 0.04, 0.3]} c={pal.accent} r={[0, 0.3, 0]} />
  </group>
);
const Rug: React.FC<{pal: Pal}> = ({pal}) => (
  <group>
    <Bx p={[0, 0.02, 0]} s={[2.9, 0.04, 2.0]} c={pal.accent2} cast={false} />
    <Bx p={[0, 0.045, 0]} s={[2.4, 0.03, 1.5]} c={shade(pal.accent2, 0.3)} cast={false} />
  </group>
);
const Shelf: React.FC<{pal: Pal}> = ({pal}) => {
  const cols = [pal.accent, pal.accent2, pal.ink, shade(pal.accent, 0.35), shade(pal.accent2, -0.2)];
  return (
    <group>
      <Bx p={[-0.2, 1.15, 0]} s={[0.06, 2.3, 1.7]} c={shade(pal.wood, -0.2)} />
      <Bx p={[0, 1.15, -0.83]} s={[0.46, 2.3, 0.06]} c={pal.wood} />
      <Bx p={[0, 1.15, 0.83]} s={[0.46, 2.3, 0.06]} c={pal.wood} />
      <Bx p={[0, 2.3, 0]} s={[0.46, 0.06, 1.7]} c={pal.wood} />
      <Bx p={[0, 0.03, 0]} s={[0.46, 0.06, 1.7]} c={pal.wood} />
      {[0, 1, 2, 3].map((k) => {
        const y = 0.28 + k * 0.52;
        return (
          <group key={k}>
            <Bx p={[0.04, y, 0]} s={[0.4, 0.04, 1.62]} c={shade(pal.wood, -0.25)} />
            {[0, 1, 2, 3, 4, 5].map((b) => {
              const hgt = 0.26 + hash01(k, b, 3) * 0.14;
              return <Bx key={b} p={[0.06, y + 0.02 + hgt / 2, -0.66 + b * 0.24 + hash01(k, b, 7) * 0.04]} s={[0.26, hgt, 0.14]} c={cols[(k * 2 + b) % cols.length]} />;
            })}
          </group>
        );
      })}
    </group>
  );
};
const Plant: React.FC<{pal: Pal}> = ({pal}) => {
  const leaf = mixHex('#3f9a54', pal.accent, 0.12);
  return (
    <group>
      <Cyl p={[0, 0.3, 0]} r={0.36} r2={0.26} h={0.6} c={pal.accent2} />
      <mesh position={[0, 0.95, 0]} castShadow>
        <icosahedronGeometry args={[0.52, 0]} />
        <meshStandardMaterial color={leaf} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.22, 1.4, 0.1]} castShadow>
        <icosahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color={shade(leaf, 0.12)} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.2, 1.3, -0.12]} castShadow>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={shade(leaf, -0.1)} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
};
const Lamp: React.FC<{pal: Pal}> = ({pal}) => (
  <group>
    <Cyl p={[0, 0.04, 0]} r={0.3} h={0.08} c={pal.ink} />
    <Cyl p={[0, 0.95, 0]} r={0.03} h={1.8} c={pal.ink} seg={8} />
    <Cyl p={[0, 1.85, 0]} r={0.42} r2={0.26} h={0.5} c="#fff2d2" emissive="#ffd488" ei={0.9} />
  </group>
);
const Desk: React.FC<{pal: Pal}> = ({pal}) => (
  <group>
    <Bx p={[0, 0.78, 0]} s={[1.0, 0.08, 1.8]} c={pal.wood} />
    <Bx p={[-0.4, 0.38, -0.78]} s={[0.07, 0.76, 0.07]} c={shade(pal.wood, -0.2)} />
    <Bx p={[-0.4, 0.38, 0.78]} s={[0.07, 0.76, 0.07]} c={shade(pal.wood, -0.2)} />
    <Bx p={[0.4, 0.38, -0.78]} s={[0.07, 0.76, 0.07]} c={shade(pal.wood, -0.2)} />
    <Bx p={[0.4, 0.38, 0.78]} s={[0.07, 0.76, 0.07]} c={shade(pal.wood, -0.2)} />
    <Bx p={[-0.25, 1.15, 0]} s={[0.07, 0.66, 0.98]} c={pal.ink} />
    <Bx p={[-0.215, 1.15, 0]} s={[0.01, 0.58, 0.9]} c={pal.accent} emissive={pal.accent} ei={0.55} cast={false} />
    <Bx p={[-0.2, 0.84, 0]} s={[0.08, 0.1, 0.2]} c={pal.ink} />
    <Bx p={[0.15, 0.835, 0.1]} s={[0.3, 0.02, 0.7]} c={shade(pal.ink, 0.3)} />
  </group>
);
const Chair: React.FC<{pal: Pal}> = ({pal}) => (
  <group>
    <Bx p={[0, 0.48, 0]} s={[0.6, 0.1, 0.6]} c={pal.accent2} />
    <Bx p={[0, 0.9, -0.27]} s={[0.6, 0.7, 0.08]} c={shade(pal.accent2, -0.1)} />
    <Cyl p={[0, 0.24, 0]} r={0.05} h={0.48} c={pal.ink} seg={8} />
    <Cyl p={[0, 0.03, 0]} r={0.3} h={0.06} c={pal.ink} seg={5} />
  </group>
);
const Bed: React.FC<{pal: Pal}> = ({pal}) => (
  <group>
    <Bx p={[0, 0.22, 0]} s={[2.0, 0.44, 3.0]} c={pal.wood} />
    <Bx p={[0, 0.55, 0.1]} s={[1.84, 0.26, 2.7]} c="#f4f1ea" />
    <Bx p={[0, 0.62, 0.55]} s={[1.9, 0.18, 1.85]} c={pal.accent} />
    <Bx p={[-0.45, 0.72, -1.0]} s={[0.7, 0.18, 0.45]} c="#ffffff" />
    <Bx p={[0.45, 0.72, -1.0]} s={[0.7, 0.18, 0.45]} c="#ffffff" />
    <Bx p={[0, 0.85, -1.46]} s={[2.0, 1.0, 0.1]} c={shade(pal.wood, -0.15)} />
  </group>
);
const Tv: React.FC<{pal: Pal}> = ({pal}) => (
  <group>
    <Bx p={[0, 0.3, 0]} s={[1.9, 0.6, 0.55]} c={pal.wood} />
    <Bx p={[0, 1.0, 0]} s={[1.5, 0.82, 0.07]} c={pal.ink} />
    <Bx p={[0, 1.0, 0.04]} s={[1.42, 0.74, 0.01]} c={pal.accent2} emissive={pal.accent2} ei={0.5} cast={false} />
    <Bx p={[0, 0.66, 0]} s={[0.1, 0.12, 0.1]} c={pal.ink} />
  </group>
);

type Place = {p: [number, number]; ry: number; Comp: React.FC<{pal: Pal}>};
// room is 8 x 8 (x, z in -4..4); walls stand on the -z (back) and -x (left) edges
const LIB: Record<string, Place> = {
  rug: {p: [-0.7, -1.4], ry: 0, Comp: Rug},
  sofa: {p: [-0.7, -3.2], ry: 0, Comp: Sofa},
  table: {p: [-0.7, -1.4], ry: 0, Comp: Table},
  shelf: {p: [-3.65, -0.7], ry: 0, Comp: Shelf},
  desk: {p: [-3.45, 2.3], ry: 0, Comp: Desk},
  chair: {p: [-2.3, 2.3], ry: -Math.PI / 2 - 0.25, Comp: Chair},
  plant: {p: [3.3, 3.1], ry: 0, Comp: Plant},
  lamp: {p: [-3.35, -3.4], ry: 0, Comp: Lamp},
  bed: {p: [2.4, -1.7], ry: 0, Comp: Bed},
  tv: {p: [2.55, -3.55], ry: 0, Comp: Tv},
};

const landState = (frame: number, start: number, dropH: number) => {
  // fall (accelerating), land, squash, settle
  const fall = 14;
  const t = frame - start;
  if (t < 0) return {y: dropH, sy: 1, sxz: 1, vis: false};
  if (t < fall) {
    const k = t / fall;
    return {y: dropH * (1 - k * k), sy: 1 + 0.06 * k, sxz: 1 - 0.03 * k, vis: true};
  }
  const e = t - fall;
  const damp = Math.exp(-e * 0.28);
  const sq = Math.sin(e * 0.9) * damp;
  return {y: Math.max(0, 0.25 * Math.abs(Math.sin(e * 0.55)) * Math.exp(-e * 0.4)), sy: 1 - 0.2 * Math.max(0, sq) + 0.08 * Math.min(0, sq), sxz: 1 + 0.1 * Math.max(0, sq), vis: true};
};

/** wall picture texture: the user's image (cover-fitted) or generated abstract art. Call outside the canvas. */
const useWallArt = (src: string, pal: Pal, seed: number) => {
  const img = useImgTexture(src || undefined, 'room wall art');
  const gen = useMemo(
    () =>
      dataTexture(128, 96, (u, v) => {
        const c1 = new THREE.Color(pal.accent);
        const c2 = new THREE.Color(pal.accent2);
        const d = Math.hypot(u - (0.35 + 0.3 * hash01(seed, 1)), v - 0.55);
        let c = new THREE.Color('#f6f1e6');
        if (d < 0.28) c = c1;
        if (Math.hypot(u - 0.7, v - 0.35) < 0.18) c = c2;
        if (v < 0.14) c = c.clone().lerp(new THREE.Color(pal.wall), 0.55);
        return [c.r, c.g, c.b, 1];
      }, false),
    [pal.accent, pal.accent2, pal.wall, seed],
  );
  return useMemo(() => (img ? coverTexture(img, 1.25) : gen), [img, gen]);
};

const WallArt: React.FC<{tex: THREE.Texture}> = ({tex}) => {
  return (
    <group>
      <Bx p={[0, 0, 0]} s={[1.5, 1.2, 0.06]} c={pal.ink} cast={false} />
      <mesh position={[0, 0, 0.034]}>
        <planeGeometry args={[1.38, 1.1]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
};

const IsometricRoom: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, portrait, durationInFrames} = useStage();
  const aspect = w / h;
  const stacked = portrait || aspect < 1.2;
  const hasText = !!(P.title || P.subtitle);
  const pal: Pal = {floor: P.floorColor, wall: P.wallColor, accent: P.accent, accent2: P.accent2, wood: P.woodColor, ink: shade(P.accent, -0.7)};
  const artTex = useWallArt(P.wallArt, pal, 3);
  const bgRef = P.background === 'transparent' ? '#ffffff' : P.background;
  const ink = P.ink || (luma(bgRef) > 0.5 ? '#1c2540' : '#ffffff');

  // build phases
  const floorP = ease.out(prog(frame, P.startAt, P.startAt + 22, (t) => t));
  const wallA = ease.out(prog(frame, P.startAt + 10, P.startAt + 34, (t) => t));
  const wallB = ease.out(prog(frame, P.startAt + 18, P.startAt + 42, (t) => t));
  const detail = ease.out(prog(frame, P.startAt + 36, P.startAt + 52, (t) => t));
  const fStart = P.startAt + 44;

  const floorTex = useMemo(
    () =>
      dataTexture(
        256,
        256,
        (u, v) => {
          const plank = Math.floor(v * 16);
          const base = new THREE.Color(P.floorColor);
          const tone = 0.93 + hash01(plank, 4) * 0.12;
          const seam = Math.abs(((v * 16) % 1) - 0.5) > 0.47 ? 0.82 : 1;
          const join = Math.abs((((u * 4 + hash01(plank, 9) * 2) % 1) - 0.5)) > 0.492 && Math.abs(((v * 16) % 1) - 0.5) < 0.47 ? 0.88 : 1;
          return [base.r * tone * seam * join, base.g * tone * seam * join, base.b * tone * seam * join, 1];
        },
        false,
      ),
    [P.floorColor],
  );

  const fov = 14;
  const roomW = 12.4; // projected iso width of the room incl. walls
  const roomH = 9.6;
  let dist: number;
  let sx = 0;
  let sy = 0;
  if (stacked) {
    const hv = Math.max((roomW / 2) * 1.04 / aspect, hasText ? roomH * 0.5 / 0.64 : roomH * 0.5 / 0.9);
    dist = hv / Math.tan((fov * Math.PI) / 360);
    sy = hasText ? 4.6 - 0.46 * hv - 0.2 : 0;
  } else {
    const vw = hasText ? (roomW / 2) / 0.58 : roomW / 2;
    dist = fitDistBox(vw, roomH / 2, fov, aspect);
    sx = hasText ? -0.4 * vw : 0;
  }
  dist /= P.size;
  const yaw = (Math.PI / 4) + ((Math.sin((frame / Math.max(1, durationInFrames)) * Math.PI) - 0.5) * P.drift * Math.PI) / 180;
  const elev = Math.atan(1 / Math.SQRT2) * 0.97;
  const tgt: V3 = [0, 1.4, 0];
  const eye: V3 = [tgt[0] + Math.sin(yaw) * Math.cos(elev) * dist, tgt[1] + Math.sin(elev) * dist, tgt[2] + Math.cos(yaw) * Math.cos(elev) * dist];
  const cam = viewShift(eye, tgt, sx, sy);

  const items = P.furniture.filter((f) => LIB[f]).slice(0, 12);
  const wallH = 3.7;
  const floorScale = Math.max(0.001, floorP);
  return (
    <AbsoluteFill style={{background: bgCss(P.background, P.accent)}}>
      <Stage3D shadows="soft" transparent exposure={1}>
        <CameraRig position={cam.position} target={cam.target} fov={fov} near={1} far={200} />
        <hemisphereLight args={['#ffffff', mixHex(P.floorColor, '#8a8aa0', 0.5), 1.5]} />
        <directionalLight position={[7, 12, 5]} intensity={1.7} color="#fff6e8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={40} shadow-bias={-0.0006} shadow-normalBias={0.02} />
        <pointLight position={[-3.1, 3.4, -3.1]} intensity={detail * 14} distance={8} decay={2} color="#ffd9a0" />
        <group scale={[floorScale, 1, floorScale]}>
          {/* floor slab + planks */}
          <mesh position={[0, -0.18, 0]} receiveShadow castShadow>
            <boxGeometry args={[8.4, 0.36, 8.4]} />
            <meshStandardMaterial color={shade(P.floorColor, -0.35)} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[8, 8]} />
            <meshStandardMaterial map={floorTex} roughness={0.8} />
          </mesh>
        </group>
        {/* back wall (-z) and left wall (-x) grow up from the floor */}
        <group position={[0, 0, -4.15]} scale={[1, Math.max(0.001, wallA), 1]}>
          <Bx p={[0.0, wallH / 2, 0]} s={[8.4, wallH, 0.3]} c={P.wallColor} />
          <Bx p={[0, 0.14, 0.17]} s={[8, 0.26, 0.06]} c={shade(P.wallColor, 0.35)} cast={false} />
        </group>
        <group position={[-4.15, 0, 0]} scale={[1, Math.max(0.001, wallB), 1]}>
          <Bx p={[0, wallH / 2, 0]} s={[0.3, wallH, 8.4]} c={shade(P.wallColor, -0.06)} />
          <Bx p={[0.17, 0.14, 0]} s={[0.06, 0.26, 8]} c={shade(P.wallColor, 0.3)} cast={false} />
        </group>
        {/* wall dressing fades/scales in after the walls */}
        <group scale={detail}>
          <group position={[1.9, 2.15, -3.95]}>
            <Bx p={[0, 0, 0]} s={[2.2, 1.7, 0.08]} c="#ffffff" cast={false} />
            <Bx p={[0, 0, 0.05]} s={[1.9, 1.4, 0.03]} c={mixHex('#bfe3ff', P.accent, 0.12)} emissive="#cfeaff" ei={0.35} cast={false} />
            <Bx p={[0, 0, 0.075]} s={[0.07, 1.4, 0.02]} c="#ffffff" cast={false} />
            <Bx p={[0, 0, 0.075]} s={[1.9, 0.07, 0.02]} c="#ffffff" cast={false} />
          </group>
          <group position={[-3.95, 2.3, -2.4]} rotation={[0, Math.PI / 2, 0]}>
            <WallArt tex={artTex} />
          </group>
        </group>
        {items.map((id, i) => {
          const L = LIB[id];
          const st = landState(frame, fStart + i * P.stagger, P.dropHeight);
          if (!st.vis) return null;
          return (
            <group key={`${id}${i}`} position={[L.p[0], st.y, L.p[1]]} rotation={[0, L.ry, 0]} scale={[st.sxz, st.sy, st.sxz]}>
              <L.Comp pal={pal} />
            </group>
          );
        })}
      </Stage3D>
      <Headline title={P.title} subtitle={P.subtitle} ink={ink} accent={P.accent} at={P.startAt + 6} place={stacked ? 'top' : 'side'} />
    </AbsoluteFill>
  );
};

export const isometricRoomBuild = defineMotion<Props>({
  id: 'isometric-room-build',
  title: 'Isometric room build (3D furniture drop-in)',
  category: '3d',
  description:
    'A cut-away isometric room builds itself: the plank floor grows, two walls rise with a window and framed art, then rug, sofa, table, shelf, desk, plant and lamp drop in one after another with a squash-and-settle while the camera drifts a few degrees.',
  source: ['isometric room diorama (original build; three.js)'],
  useFor: 'Interior design, real estate, home / furniture e-commerce, "build your space" and game-lobby beats. Choose the `furniture` list, palette colours and `wallArt` image; add a `title`.',
  durationInFrames: 240,
  defaultProps: {
    furniture: ['rug', 'sofa', 'table', 'shelf', 'plant', 'lamp', 'desk', 'chair'],
    wallArt: '',
    title: 'Build your space',
    subtitle: 'Piece by piece, room by room.',
    background: '#f3ece4',
    ink: '',
    floorColor: '#e0c39b',
    wallColor: '#f7f3ee',
    accent: '#3f7fd9',
    accent2: '#f0a05a',
    woodColor: '#b9855a',
    startAt: 6,
    stagger: 12,
    dropHeight: 7,
    drift: 14,
    size: 1,
  },
  propDocs: {
    furniture: "pieces in drop order: 'rug' | 'sofa' | 'table' | 'shelf' | 'desk' | 'chair' | 'plant' | 'lamp' | 'bed' | 'tv' (each has a fixed spot in the room)",
    wallArt: 'picture on the left wall (public/ path or URL); empty = generated abstract art',
    title: 'headline (\\n for a line break; empty with an empty subtitle = room only, centred)',
    subtitle: 'line under the headline',
    background: "background colour ('transparent' to composite over other content)",
    ink: 'headline colour (empty = auto contrast)',
    floorColor: 'floor planks colour',
    wallColor: 'wall colour',
    accent: 'main furniture colour (sofa, screens, headline bar)',
    accent2: 'secondary colour (rug, pots, chair, cushions)',
    woodColor: 'tables, shelf and desk wood',
    startAt: 'frame the floor starts growing',
    stagger: 'frames between furniture drops',
    dropHeight: 'height furniture falls from (world units)',
    drift: 'degrees the camera swings while it builds',
    size: 'overall scale multiplier',
  },
  component: IsometricRoom,
  tags: ['isometric', 'room', 'interior', 'furniture', 'real estate', 'home', 'build', 'diorama', 'drop', 'sofa', 'living room', 'decor', 'game', 'three.js', '3d', 'lowpoly', 'clay'],
});
