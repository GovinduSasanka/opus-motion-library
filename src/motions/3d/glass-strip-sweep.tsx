// Adapted from lemo-opuscar/styles/glass-product/demo/studio.js + STYLE.md section 2 (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {StripEnv, ToneMap} from '../../core/r2-la2-kit';
import {easeIO, s1f, sseg} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * Dark glass product in black space. A tall emissive strip light passes behind the camera on a +-1.35 rad arc (baked to
 * an environment with PMREM every frame) and its reflection slides across the object, drawing a thin white contour; three
 * channel-tinted additive reflection layers with slightly rotated environments give the rainbow dispersion at the edges.
 * Between sweeps only the side-strip silhouettes remain. Materials: clear | frosted | chrome | satin.
 */
type Props = {
  object: 'bottle' | 'vase' | 'orb' | 'slab';
  material: 'clear' | 'frosted' | 'chrome' | 'satin';
  passes: number[];
  passFrames: number;
  dispersion: number;
  sideStrips: number;
  title: string;
  kicker: string;
  orbit: number;
  background: string;
};

const profile = (kind: Props['object']) => {
  const pts: [number, number][] =
    kind === 'vase'
      ? [[0, 0], [0.62, 0], [0.8, 0.12], [0.95, 0.7], [0.82, 1.3], [0.46, 1.75], [0.36, 2.1], [0.46, 2.3], [0.5, 2.35]]
      : [[0, 0], [0.5, 0], [0.56, 0.06], [0.58, 0.4], [0.58, 1.35], [0.52, 1.62], [0.3, 1.82], [0.2, 1.95], [0.2, 2.35], [0.24, 2.42], [0.24, 2.5], [0, 2.5]];
  const curve = new THREE.SplineCurve(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  return curve.getPoints(160).map((v) => new THREE.Vector2(Math.max(0, v.x), v.y));
};

const makeGeometry = (kind: Props['object']): {geo: THREE.BufferGeometry; y: number; h: number} => {
  if (kind === 'orb') return {geo: new THREE.SphereGeometry(1, 128, 96), y: 1.05, h: 2.1};
  if (kind === 'slab') return {geo: new RoundedBoxGeometry(1.7, 2.3, 0.34, 6, 0.2), y: 1.15, h: 2.3};
  const g = new THREE.LatheGeometry(profile(kind), 192);
  g.computeVertexNormals();
  return {geo: g, y: 0, h: 2.5};
};

type MatSet = {base: THREE.MeshPhysicalMaterial; disp: THREE.MeshStandardMaterial[]};
const makeMats = (m: Props['material']): MatSet => {
  const base = new THREE.MeshPhysicalMaterial({
    color: m === 'chrome' ? '#d4d8e0' : m === 'satin' ? '#b9bcc4' : '#030304',
    metalness: m === 'chrome' ? 1 : m === 'satin' ? 0.9 : 0,
    roughness: m === 'chrome' ? 0.05 : m === 'satin' ? 0.3 : m === 'frosted' ? 0.34 : 0.015,
    ior: 1.52,
    clearcoat: m === 'chrome' || m === 'satin' ? 0 : 1,
    clearcoatRoughness: m === 'frosted' ? 0.3 : 0.02,
    envMapIntensity: 1,
  });
  const tint = ['#ff0000', '#00ff00', '#0000ff'];
  const disp = tint.map(
    (c) =>
      new THREE.MeshStandardMaterial({
        color: c,
        metalness: 1,
        roughness: m === 'frosted' ? 0.3 : 0.03,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        envMapIntensity: 0.3,
      }),
  );
  return {base, disp};
};

const GlassObject: React.FC<Props & {sweep: number}> = ({object, material, dispersion, sweep}) => {
  const scene = useThree((s) => s.scene);
  const built = useMemo(() => makeGeometry(object), [object]);
  const mats = useMemo(() => makeMats(material), [material]);
  useLayoutEffect(() => {
    // after StripEnv (a previous sibling) has baked scene.environment for this frame
    const env = scene.environment as THREE.Texture | null;
    mats.base.envMap = env;
    mats.disp.forEach((m, i) => {
      m.envMap = env;
      m.envMapRotation.set(0, (i - 1) * dispersion, 0);
      m.opacity = 1;
      m.needsUpdate = true;
    });
    mats.base.needsUpdate = true;
  });
  const dispOn = dispersion > 0 && (material === 'clear' || material === 'frosted');
  void sweep;
  return (
    <group position={[0, built.y, 0]}>
      <mesh geometry={built.geo} material={mats.base} />
      {dispOn && mats.disp.map((m, i) => <mesh key={i} geometry={built.geo} material={m} scale={1.0006} />)}
    </group>
  );
};

const Floor: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
    <circleGeometry args={[7, 96]} />
    <meshStandardMaterial color="#030304" metalness={0.85} roughness={0.16} envMapIntensity={0.6} />
  </mesh>
);

const GlassStripSweep: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  // sweep state
  let sweepX = -1;
  let sweepI = 0;
  let sweepAmt = 0;
  for (const a of p.passes) {
    if (frame >= a && frame <= a + p.passFrames) {
      const t = (frame - a) / p.passFrames;
      sweepX = -1 + 2 * easeIO(t);
      sweepI = 40 * Math.min(1, Math.sin(Math.PI * t) * 2.2);
      sweepAmt = Math.sin(Math.PI * t);
    }
  }
  const camAz = Math.sin(frame * 0.012) * p.orbit;
  const dist = portrait ? 8.2 : 5.8;
  const tY = 1.45;
  const camPos: [number, number, number] = [Math.sin(camAz) * dist, 1.35, Math.cos(camAz) * dist];
  const titleOp = 0.5 + 0.5 * sweepAmt;
  const enter = sseg(frame, 4, 26);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Stage3D flat={false} transparent={false} exposure={1.1}>
        <color attach="background" args={[p.background]} />
        <ToneMap exposure={1.1} mode="neutral" />
        <StripEnv sweepX={sweepX} sweepI={sweepI} az={camAz} sideI={p.sideStrips} topI={0.12} backI={0.15} keyI={0} />
        <CameraRig position={camPos} target={[0, tY, 0]} fov={portrait ? 30 : 28} near={0.1} far={80} />
        <GlassObject {...p} sweep={sweepAmt} />
        <Floor />
      </Stage3D>
      <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.08 : 0.1), textAlign: 'center', opacity: enter, transform: `translateY(${(1 - enter) * 14 * u}px)`}}>
        {p.kicker && (
          <div style={{fontFamily: s1f.tight, fontWeight: 300, fontSize: Math.min(20 * u, w * 0.03), letterSpacing: '0.42em', color: `rgba(255,255,255,${0.42 + 0.2 * sweepAmt})`, marginBottom: 14 * u, paddingLeft: '0.42em'}}>{p.kicker}</div>
        )}
        <div style={{fontFamily: s1f.tight, fontWeight: 200, fontSize: Math.min(h * 0.095, w * (portrait ? 0.11 : 0.07)), letterSpacing: '0.46em', paddingLeft: '0.46em', color: `rgba(255,255,255,${0.5 + 0.45 * titleOp})`, whiteSpace: 'nowrap'}}>{p.title}</div>
      </div>
    </AbsoluteFill>
  );
};

export const glassStripSweep = defineMotion<Props>({
  id: 'glass-strip-sweep',
  title: 'Glass strip-light sweep',
  category: '3d',
  description:
    'A dark glass product in black space: a tall strip light passes behind the camera and its reflection slides across the object, drawing a thin white contour with rainbow fringing at the edges; between sweeps only side-strip silhouettes remain.',
  source: ['lemo-opuscar styles/glass-product/demo/studio.js, STYLE.md section 2 (MIT, LemoLab)'],
  useFor: 'Premium product reveals for SaaS / hardware brands, app-icon glass hero, launch-film openers.',
  durationInFrames: 150,
  defaultProps: {
    object: 'bottle',
    material: 'clear',
    passes: [8, 78],
    passFrames: 60,
    dispersion: 0.035,
    sideStrips: 1,
    title: 'LUMEN',
    kicker: 'INTRODUCING',
    orbit: 0.28,
    background: '#000000',
  },
  propDocs: {
    object: 'bottle | vase | orb | slab (built-in geometry)',
    material: 'clear | frosted | chrome | satin',
    passes: 'start frames of each strip sweep',
    passFrames: 'frames one sweep takes (arc -1.35 to +1.35 rad)',
    dispersion: 'rainbow fringe strength (rad of environment offset per channel; 0 = off)',
    sideStrips: 'intensity of the permanent side strips that draw the silhouette',
    title: 'ultra-thin tracked product name (empty = none)',
    kicker: 'small tracked caps above the name',
    orbit: 'slow camera orbit amplitude in rad',
    background: 'space colour',
  },
  component: GlassStripSweep,
  tags: ['glass', 'product', 'reveal', 'strip light', 'sweep', 'reflection', 'dispersion', 'dark', 'premium', 'studio', 'icon', 'three', 'lathe', 'chrome'],
});
