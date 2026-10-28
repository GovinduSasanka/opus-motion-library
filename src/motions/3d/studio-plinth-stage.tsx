import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {clamp, ease} from '../../core/ease';
import {PlinthStudio, VOXEL} from '../../core/r2-x14-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * x1 whole video: the seamless warm studio "product turntable" stage: radial warm backdrop with a vignette, a round
 * matte plinth with a chamfered top edge and a notch ring, one soft key from the upper left so contact shadows fall
 * right and back. A neutral original subject (orb / bottle / cube / knot / stack) turns on the plinth; swap it for
 * your own 3D content or use the stage as a clean backdrop.
 */
type Props = {
  subject: string;
  subjectColor: string;
  accentColor: string;
  background: string;
  edge: string;
  plinthColor: string;
  ring: boolean;
  ringColor: string;
  ringIdle: string;
  ringLoop: boolean;
  spin: number;
  orbit: number;
  elevation: number;
  floatAmp: number;
  entrance: number;
};

const mat = (color: string, rough = 0.38, metal = 0.0) => <meshStandardMaterial color={color} roughness={rough} metalness={metal} />;

const bottleGeo = () => {
  const pts = [[0, 0], [3.4, 0], [3.9, 0.5], [3.9, 8.5], [3.5, 10.5], [1.6, 12], [1.4, 14], [1.55, 14.4], [1.55, 15.4], [0, 15.4]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 64);
};

const Subject: React.FC<{kind: string; color: string; accent: string}> = ({kind, color, accent}) => {
  const bottle = useMemo(bottleGeo, []);
  if (kind === 'cube')
    return (
      <group>
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow rotation={[0, Math.PI / 6, 0]}>
          <boxGeometry args={[6.4, 6.4, 6.4]} />
          {mat(color, 0.45)}
        </mesh>
        <mesh position={[0, 7.6, 0]} castShadow receiveShadow rotation={[0, -Math.PI / 10, 0]}>
          <boxGeometry args={[3.2, 3.2, 3.2]} />
          {mat(accent, 0.45)}
        </mesh>
      </group>
    );
  if (kind === 'bottle')
    return (
      <group>
        <mesh geometry={bottle} castShadow receiveShadow>
          {mat(color, 0.3, 0.1)}
        </mesh>
        <mesh position={[0, 15.9, 0]} castShadow>
          <cylinderGeometry args={[1.7, 1.7, 1.2, 40]} />
          {mat(accent, 0.35, 0.2)}
        </mesh>
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[3.95, 3.95, 4.2, 48, 1, true]} />
          <meshStandardMaterial color="#F6F1E8" roughness={0.7} />
        </mesh>
      </group>
    );
  if (kind === 'knot')
    return (
      <mesh position={[0, 6.8, 0]} castShadow receiveShadow scale={1.35}>
        <torusKnotGeometry args={[2.3, 0.8, 160, 24, 2, 3]} />
        {mat(color, 0.28, 0.15)}
      </mesh>
    );
  if (kind === 'stack')
    return (
      <group>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.7 + i * 1.5, 0]} rotation={[0, i * 0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[4.6 - i * 0.7, 4.6 - i * 0.7, 1.3, 48]} />
            {mat(i % 2 ? accent : color, 0.4)}
          </mesh>
        ))}
        <mesh position={[0, 7.4, 0]} castShadow>
          <sphereGeometry args={[1.5, 32, 24]} />
          {mat(color, 0.2, 0.1)}
        </mesh>
      </group>
    );
  // orb (default): glossy sphere + ring on a small foot
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.6, 1, 40]} />
        {mat(accent, 0.4, 0.2)}
      </mesh>
      <mesh position={[0, 6.2, 0]} castShadow receiveShadow>
        <sphereGeometry args={[4.6, 64, 48]} />
        {mat(color, 0.18, 0.05)}
      </mesh>
      <mesh position={[0, 6.2, 0]} rotation={[Math.PI / 2.4, 0, 0]} castShadow>
        <torusGeometry args={[6.4, 0.32, 20, 96]} />
        {mat(accent, 0.3, 0.3)}
      </mesh>
    </group>
  );
};

const StudioPlinthStage: React.FC<Props> = ({subject, subjectColor, accentColor, background, edge, plinthColor, ring, ringColor, ringIdle, ringLoop, spin, orbit, elevation, floatAmp, entrance}) => {
  const f = useCurrentFrame();
  const {fps} = useStage();
  const t = f / fps;
  const e = ease.back(clamp(f / Math.max(1, entrance)));
  const prog = ringLoop ? (f % 120) / 120 : 0;
  const yaw = (orbit * t * Math.PI) / 180;
  return (
    <AbsoluteFill>
      <PlinthStudio bg={background} bgEdge={edge} plinthColor={plinthColor} ringColor={ringColor} ringIdle={ringIdle} showRing={ring} progress={prog} yaw={yaw} elevation={elevation}>
        {subject !== 'none' ? (
          <group rotation={[0, (spin * t * Math.PI) / 180, 0]} scale={Math.max(0.001, e)} position={[0, Math.sin(t * 1.6) * floatAmp + (1 - e) * 4, 0]}>
            <Subject kind={subject} color={subjectColor} accent={accentColor} />
          </group>
        ) : null}
      </PlinthStudio>
    </AbsoluteFill>
  );
};

export const studioPlinthStage = defineMotion<Props>({
  id: 'studio-plinth-stage',
  title: 'Studio plinth stage',
  category: '3d',
  description:
    'Seamless warm studio backdrop with a soft vignette and a round matte plinth with a bevelled top and notch ring, lit by one soft key from the upper left so shadows fall right/back; an original subject turns on it like a product turntable.',
  source: ['video x1 whole video (stage, backdrop, plinth, key light)'],
  useFor: 'A neutral turntable stage for products, logos, mascots and 3D charts; use `subject: "none"` for a clean studio backdrop under your own content.',
  durationInFrames: 150,
  defaultProps: {
    subject: 'orb',
    subjectColor: '#E0764C',
    accentColor: '#3F4B66',
    background: VOXEL.bg,
    edge: VOXEL.bgEdge,
    plinthColor: VOXEL.plinth,
    ring: true,
    ringColor: VOXEL.accent,
    ringIdle: VOXEL.notch,
    ringLoop: false,
    spin: 30,
    orbit: 0,
    elevation: 20,
    floatAmp: 0.25,
    entrance: 18,
  },
  propDocs: {
    subject: "'orb' | 'bottle' | 'cube' | 'knot' | 'stack' | 'none'",
    subjectColor: 'main subject colour',
    accentColor: 'secondary subject colour',
    background: 'backdrop centre colour',
    edge: 'backdrop corner colour',
    plinthColor: 'plinth colour',
    ring: 'show the notch ring',
    ringColor: 'lit notch colour',
    ringIdle: 'unlit notch colour',
    ringLoop: 'run a lit sweep around the ring (4 s loop)',
    spin: 'subject turntable speed, degrees per second',
    orbit: 'camera orbit speed, degrees per second (0 = locked-off)',
    elevation: 'camera elevation above the plinth plane, degrees',
    floatAmp: 'subject hover amplitude in plinth units',
    entrance: 'frames of the pop-in of the subject',
  },
  component: StudioPlinthStage,
  tags: ['stage', 'plinth', 'studio', 'turntable', 'product', 'backdrop', 'pedestal', 'showroom', 'three.js', '3d', 'clay', 'soft-shadow', 'mockup', 'logo-stage'],
});
