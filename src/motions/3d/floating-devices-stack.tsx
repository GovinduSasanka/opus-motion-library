import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {clamp, ease, prog} from '../../core/ease';
import {dataTexture, luma, mixHex, shade, useImgTexture} from '../../core/r2-pr2-kit';
import {Headline, StudioEnv, bgCss, bob, coverTexture, fitDistBox, roundedPlane, uiScreenTexture, viewShift} from '../../core/r3-3d-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * Laptop, tablet and phone mockups float up into a layered, slightly rotated stack. Each screen shows your image
 * (`screens[]`, cover-fitted) or a generated app UI in your colours. Slot 0 is the hero (largest, centre).
 */
type Props = {
  devices: string[];
  screens: string[];
  title: string;
  subtitle: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  bodyColor: string;
  darkScreens: boolean;
  startAt: number;
  stagger: number;
  floatAmount: number;
  sway: number;
  size: number;
};

type Slot = {p: V3; ry: number; rx: number; s: number};
// landscape: hero centre-back, two flanking in front, two far in the back
const SLOTS_L: Slot[] = [
  {p: [0.2, 0.18, -0.5], ry: -0.2, rx: 0.05, s: 1.4},
  {p: [-1.7, -0.3, 0.6], ry: 0.4, rx: 0.04, s: 1.05},
  {p: [1.85, -0.32, 0.75], ry: -0.36, rx: 0.04, s: 1.05},
  {p: [-2.75, 0.55, -1.1], ry: 0.5, rx: 0.03, s: 0.82},
  {p: [2.9, 0.55, -1.2], ry: -0.5, rx: 0.03, s: 0.82},
];
// portrait / square: hero on top, the others tucked underneath and to the sides
const SLOTS_P: Slot[] = [
  {p: [0.0, 1.05, -0.5], ry: -0.2, rx: 0.05, s: 1.4},
  {p: [-0.82, -0.95, 0.7], ry: 0.38, rx: 0.04, s: 1.08},
  {p: [0.95, -1.05, 0.85], ry: -0.34, rx: 0.04, s: 1.08},
  {p: [-1.6, 0.6, -1.2], ry: 0.45, rx: 0.03, s: 0.8},
  {p: [1.7, 0.45, -1.3], ry: -0.45, rx: 0.03, s: 0.8},
];

const SCREEN = {laptop: {w: 1.62, h: 1.0}, tablet: {w: 0.78, h: 1.1}, phone: {w: 0.47, h: 1.03}} as const;
type Kind = keyof typeof SCREEN;
const kindOf = (s: string): Kind => (s === 'tablet' || s === 'phone' ? s : 'laptop');

const useScreenTex = (src: string, kind: Kind, idx: number, bg: string, a: string, b: string, dark: boolean) => {
  const img = useImgTexture(src || undefined, 'device screen');
  const asp = SCREEN[kind].w / SCREEN[kind].h;
  const gen = useMemo(() => uiScreenTexture(asp, bg, idx % 2 ? b : a, idx % 2 ? a : b, idx + 1, dark), [asp, bg, a, b, idx, dark]);
  const cover = useMemo(() => (img ? coverTexture(img, asp) : null), [img, asp]);
  return cover ?? gen;
};

const Device: React.FC<{kind: Kind; tex: THREE.Texture; body: string; edge: string}> = ({kind, tex, body, edge}) => {
  const sc = SCREEN[kind];
  const geo = useMemo(() => roundedPlane(sc.w, sc.h, kind === 'phone' ? 0.045 : 0.03), [sc.w, sc.h, kind]);
  const key = useMemo(
    () =>
      dataTexture(
        128,
        64,
        (u, v) => {
          const gx = (u * 15) % 1;
          const gy = (v * 5) % 1;
          const keyHit = gx > 0.1 && gx < 0.9 && gy > 0.14 && gy < 0.86 ? 1 : 0;
          const s = 0.1 + 0.06 * keyHit;
          return [s, s, s + 0.012, 1];
        },
        true,
        false,
      ),
    [],
  );
  const bodies = useMemo(
    () => ({
      phone: new RoundedBoxGeometry(0.52, 1.1, 0.06, 5, 0.075),
      tablet: new RoundedBoxGeometry(0.86, 1.18, 0.055, 5, 0.06),
      deck: new RoundedBoxGeometry(1.78, 0.055, 1.12, 4, 0.02),
      lid: new RoundedBoxGeometry(1.78, 1.12, 0.045, 5, 0.04),
    }),
    [],
  );
  const bodyMat = <meshPhysicalMaterial color={body} metalness={0.85} roughness={0.28} clearcoat={0.4} clearcoatRoughness={0.3} />;
  const screenMat = <meshBasicMaterial map={tex} toneMapped={false} />;
  if (kind === 'phone') {
    const g = bodies.phone;
    return (
      <group>
        <mesh geometry={g}>{bodyMat}</mesh>
        <mesh geometry={geo} position={[0, 0, 0.032]}>
          {screenMat}
        </mesh>
        <mesh position={[0, 0.455, 0.034]}>
          <planeGeometry args={[0.13, 0.034]} />
          <meshBasicMaterial color="#05060a" />
        </mesh>
        <mesh position={[0.272, 0.22, -0.002]}>
          <boxGeometry args={[0.016, 0.16, 0.012]} />
          <meshStandardMaterial color={edge} metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    );
  }
  if (kind === 'tablet') {
    const g = bodies.tablet;
    return (
      <group>
        <mesh geometry={g}>{bodyMat}</mesh>
        <mesh geometry={geo} position={[0, 0, 0.029]}>
          {screenMat}
        </mesh>
        <mesh position={[0, 0.545, 0.031]}>
          <circleGeometry args={[0.009, 16]} />
          <meshBasicMaterial color="#05060a" />
        </mesh>
      </group>
    );
  }
  // laptop: deck + hinged lid
  const deck = bodies.deck;
  const lid = bodies.lid;
  return (
    <group position={[0, -0.5, 0]}>
      <mesh geometry={deck} position={[0, 0.0275, 0.1]}>
        {bodyMat}
      </mesh>
      <mesh position={[0, 0.058, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 0.6]} />
        <meshStandardMaterial map={key} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.058, 0.52]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 0.34]} />
        <meshStandardMaterial color={mixHex(body, '#000000', 0.25)} roughness={0.5} metalness={0.4} />
      </mesh>
      <group position={[0, 0.045, -0.46]} rotation={[-0.2, 0, 0]}>
        <mesh geometry={lid} position={[0, 0.56, 0]}>
          {bodyMat}
        </mesh>
        <mesh geometry={geo} position={[0, 0.56, 0.0245]}>
          {screenMat}
        </mesh>
      </group>
    </group>
  );
};

const FloatingDevices: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, portrait, durationInFrames} = useStage();
  const aspect = w / h;
  const slots = portrait || aspect < 1.2 ? SLOTS_P : SLOTS_L;
  const devs = (P.devices.length ? P.devices : ['laptop']).slice(0, 5);
  const hasText = !!(P.title || P.subtitle);
  const fov = 28;
  const stacked = portrait || aspect < 1.2;
  const side = hasText && !stacked;
  const fovT = Math.tan((fov * Math.PI) / 360);
  let dist: number;
  let textDx = 0;
  let textDy = 0;
  if (stacked) {
    // hero on top, small devices below; with a title the stack starts ~27% down the frame
    const halfW = 1.6;
    const hv = Math.max(halfW / aspect, hasText ? 2.9 : 2.1);
    dist = hv / fovT / P.size;
    textDy = hasText ? 1.75 - 0.44 * hv - 0.1 : 0;
  } else {
    const halfW = devs.length >= 4 ? 3.3 : 2.5;
    // with a text column the stack is framed in the right ~55% of the frame
    const viewHalfW = side ? halfW / 0.56 : halfW;
    textDx = side ? -0.4 * viewHalfW : 0;
    dist = fitDistBox(viewHalfW, 1.6, fov, aspect) / P.size;
  }
  const sway = Math.sin((frame / Math.max(1, durationInFrames)) * Math.PI * 2) * P.sway * (Math.PI / 180);
  const eye: V3 = [Math.sin(sway) * dist, 0.9 + dist * 0.06, Math.cos(sway) * dist];
  const cam = viewShift(eye, [0, 0.1, 0], textDx, textDy);
  const ink = P.ink || (luma(P.background) > 0.5 ? '#13213f' : '#ffffff');
  const bgRef = P.background === 'transparent' ? '#ffffff' : P.background;

  return (
    <AbsoluteFill style={{background: bgCss(P.background, P.accent)}}>
      <Stage3D transparent exposure={1}>
        <CameraRig position={cam.position} target={cam.target} fov={fov} near={0.1} far={80} />
        <StudioEnv intensity={0.8} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[-4, 6, 5]} intensity={2} color="#fff4e6" />
        <directionalLight position={[5, 2, -3]} intensity={1.2} color={mixHex(P.accent, '#ffffff', 0.4)} />
        {devs.map((d, i) => (
          <Item key={i} i={i} kind={kindOf(d)} slot={slots[i]} src={P.screens.length ? P.screens[i % P.screens.length] : ''} P={P} bg={bgRef} frame={frame} />
        ))}
      </Stage3D>
      <Headline title={P.title} subtitle={P.subtitle} ink={ink} accent={P.accent} at={P.startAt + 10} place={portrait || aspect < 1.2 ? 'top' : 'side'} />
    </AbsoluteFill>
  );
};

const Item: React.FC<{i: number; kind: Kind; slot: Slot; src: string; P: Props; bg: string; frame: number}> = ({i, kind, slot, src, P, bg, frame}) => {
  const tex = useScreenTex(src, kind, i, shade(P.accent, 0.78), P.accent, P.accent2, P.darkScreens);
  const edge = shade(P.bodyColor, 0.25);
  // hero (slot 0) lands first, the others follow
  const st = P.startAt + i * P.stagger;
  const p = ease.back(prog(frame, st, st + 34, (t) => t));
  const settle = clamp(p);
  const fl = P.floatAmount;
  const y = slot.p[1] + (1 - p) * -3.2 + bob(frame, 150, i * 0.31) * 0.07 * fl;
  const ry = slot.ry + (1 - settle) * (i % 2 ? 1.1 : -1.1) + bob(frame, 210, i * 0.2) * 0.05 * fl;
  const rx = slot.rx + bob(frame, 180, i * 0.17 + 0.2) * 0.035 * fl;
  const rz = bob(frame, 240, i * 0.41) * 0.02 * fl + (1 - settle) * (i % 2 ? -0.35 : 0.35);
  const k = slot.s * (0.55 + 0.45 * settle) * (kind === 'phone' && i === 0 ? 1.12 : 1);
  return (
    <group position={[slot.p[0], y, slot.p[2]]} rotation={[rx, ry, rz]} scale={k}>
      <Device kind={kind} tex={tex} body={P.bodyColor} edge={edge} />
    </group>
  );
};

export const floatingDevicesStack = defineMotion<Props>({
  id: 'floating-devices-stack',
  title: 'Floating devices stack (3D laptop, tablet, phone)',
  category: '3d',
  description:
    'A real-3D laptop, tablet and phone rise into a layered, slightly rotated stack and float with a gentle sway, lit by a soft studio. Each screen shows your image (cover-fitted) or a generated app UI in your colours; an optional headline sits beside or above.',
  source: ['3D product-mockup stack (original build; three.js)'],
  useFor: 'App / SaaS launches, "works on every device" beats, store previews and landing-page heroes. Pass `screens` (your screenshots), `devices` order, brand colours and a `title`.',
  durationInFrames: 180,
  defaultProps: {
    devices: ['laptop', 'tablet', 'phone'],
    screens: [],
    title: 'One product, every screen',
    subtitle: 'Designed once. Looks right everywhere.',
    background: '#eef1f8',
    ink: '',
    accent: '#4f6bff',
    accent2: '#ff7ab6',
    bodyColor: '#1d2029',
    darkScreens: false,
    startAt: 4,
    stagger: 9,
    floatAmount: 1,
    sway: 7,
    size: 1,
  },
  propDocs: {
    devices: "device per slot, in order of importance (slot 0 is the hero): 'laptop' | 'tablet' | 'phone' (up to 5)",
    screens: 'screen images (public/ path or URL), one per device, cycled; empty = generated app UI in your colours',
    title: 'headline (\\n for a line break; empty with an empty subtitle = devices only, centred)',
    subtitle: 'line under the headline',
    background: "background colour ('transparent' to composite over other content)",
    ink: 'headline colour (empty = auto contrast)',
    accent: 'brand colour (generated screens, headline bar, rim light)',
    accent2: 'second brand colour (generated screens)',
    bodyColor: 'device frame colour',
    darkScreens: 'generated screens use a dark theme',
    startAt: 'frame the first device starts rising',
    stagger: 'frames between devices landing',
    floatAmount: 'strength of the idle float / wobble (0 = still)',
    sway: 'degrees the camera swings around the stack across the clip',
    size: 'overall scale multiplier',
  },
  component: FloatingDevices,
  tags: ['devices', 'mockup', 'laptop', 'tablet', 'phone', 'app', 'saas', 'launch', 'responsive', 'screens', 'stack', 'floating', 'product', 'hero', 'three.js', '3d', 'screenshot', 'store preview'],
});
