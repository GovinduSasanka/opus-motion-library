import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {Font} from 'three/examples/jsm/loaders/FontLoader.js';
import helvBold from 'three/examples/fonts/helvetiker_bold.typeface.json';
import helvReg from 'three/examples/fonts/helvetiker_regular.typeface.json';
import optBold from 'three/examples/fonts/optimer_bold.typeface.json';
import gentBold from 'three/examples/fonts/gentilis_bold.typeface.json';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {luma, mixHex, shade} from '../../core/r2-pr2-kit';
import {StudioEnv, bgCss} from '../../core/r3-3d-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * Extruded, bevelled 3D letters (real TextGeometry) spin in and settle with a damped wobble, then a light streak
 * sweeps across the glossy face. `mode` spins the whole word, or each letter on its own with a stagger.
 */
type Props = {
  text: string;
  subtitle: string;
  font: string;
  mode: string;
  axis: string;
  spins: number;
  spinFrames: number;
  startAt: number;
  stagger: number;
  depth: number;
  bevel: number;
  tracking: number;
  background: string;
  faceColor: string;
  sideColor: string;
  accent: string;
  ink: string;
  metalness: number;
  roughness: number;
  idleSway: number;
  fontFamily: string;
  size: number;
};

const FONT_SETS: Record<string, Font> = {
  sans: new Font(helvBold as never),
  light: new Font(helvReg as never),
  humanist: new Font(optBold as never),
  serif: new Font(gentBold as never),
};

type Glyph = {geo: THREE.BufferGeometry; x: number; y: number; z: number; i: number};

/** per-character extruded geometry centred on its own bounding box, laid out on the font's advance widths */
const buildGlyphs = (text: string, font: Font, depth: number, bevel: number, tracking: number) => {
  const data = font.data as unknown as {resolution: number; glyphs: Record<string, {ha: number; o?: string}>};
  const sc = 1 / data.resolution;
  const lines = text.split(/\\n|\n|\|/).map((l) => l.replace(/\s+$/, ''));
  const lh = 1.18;
  const out: Glyph[] = [];
  const widths: number[] = [];
  let idx = 0;
  lines.forEach((line, li) => {
    let x = 0;
    for (const ch of line) {
      const g = data.glyphs[ch] ?? data.glyphs['?'];
      const adv = (g?.ha ?? data.resolution * 0.5) * sc;
      if (ch !== ' ' && g?.o) {
        const geo = new TextGeometry(ch, {font, size: 1, depth, curveSegments: 10, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 4} as never);
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        const cx = (bb.min.x + bb.max.x) / 2;
        const cy = (bb.min.y + bb.max.y) / 2;
        const cz = (bb.min.z + bb.max.z) / 2;
        geo.translate(-cx, -cy, -cz);
        out.push({geo, x: x + cx, y: -li * lh + cy, z: cz, i: idx++});
      }
      x += adv + tracking;
    }
    widths.push(x - tracking);
  });
  // centre each line horizontally, the block vertically
  let minY = Infinity;
  let maxY = -Infinity;
  out.forEach((g) => {
    const bb = (g.geo.boundingBox ??= new THREE.Box3().setFromBufferAttribute(g.geo.attributes.position as THREE.BufferAttribute));
    minY = Math.min(minY, g.y + bb.min.y);
    maxY = Math.max(maxY, g.y + bb.max.y);
  });
  // the line index of each glyph for horizontal centring
  let gi = 0;
  const lineOf: number[] = [];
  lines.forEach((line, li) => {
    for (const ch of line) {
      const g = data.glyphs[ch] ?? data.glyphs['?'];
      if (ch !== ' ' && g?.o) lineOf[gi++] = li;
    }
  });
  out.forEach((g, k) => {
    g.x -= widths[lineOf[k]] / 2;
    g.y -= (minY + maxY) / 2;
    g.z = 0;
  });
  const maxW = Math.max(...widths, 0.1);
  return {glyphs: out, width: maxW, height: Math.max(0.2, maxY - minY)};
};

const TextExtrudeSpin: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const aspect = w / h;
  const font = FONT_SETS[P.font] ?? FONT_SETS.sans;
  const text = (P.text || 'SPIN').slice(0, 60);
  const {glyphs, width, height} = useMemo(() => buildGlyphs(text, font, P.depth, P.bevel, P.tracking), [text, font, P.depth, P.bevel, P.tracking]);

  const D = 12;
  const fov = 30;
  const visH = 2 * D * Math.tan((fov * Math.PI) / 360);
  const visW = visH * aspect;
  const hasSub = !!P.subtitle;
  const fit = Math.min((visW * 0.8) / width, (visH * (hasSub ? 0.46 : 0.58)) / height) * P.size;
  const lift = hasSub ? visH * 0.06 : 0;

  const bgRef = P.background === 'transparent' ? '#ffffff' : P.background;
  const ink = P.ink || (luma(bgRef) > 0.5 ? '#14182b' : '#ffffff');
  const [faceMat, sideMat] = useMemo(() => {
    const f = new THREE.MeshPhysicalMaterial({color: P.faceColor, metalness: P.metalness, roughness: P.roughness, clearcoat: 0.8, clearcoatRoughness: 0.15});
    const s = new THREE.MeshPhysicalMaterial({color: P.sideColor, metalness: Math.min(1, P.metalness + 0.1), roughness: Math.min(1, P.roughness + 0.1), clearcoat: 0.5, clearcoatRoughness: 0.3});
    return [f, s];
  }, [P.faceColor, P.sideColor, P.metalness, P.roughness]);

  const n = glyphs.length;
  const wordMode = P.mode !== 'letter';
  const total = P.spins * Math.PI * 2;
  const stag = wordMode ? 0 : P.stagger;
  const endFrame = P.startAt + P.spinFrames + stag * Math.max(0, n - 1);
  const settleAt = P.startAt + P.spinFrames;

  const angleOf = (f0: number) => {
    const p = ease.expoOut(prog(f0, 0, P.spinFrames, (t) => t));
    const rem = total * (1 - p);
    const e = Math.max(0, f0 - P.spinFrames);
    const wob = f0 > P.spinFrames ? Math.exp(-e * 0.14) * Math.sin(e * 0.52) * 0.2 : 0;
    return {rem, wob, p};
  };

  const axisY = P.axis !== 'x';
  const spinRot = (a: {rem: number; wob: number}): [number, number, number] => (axisY ? [0, a.rem + a.wob, 0] : [a.rem + a.wob, 0, 0]);
  const idle = Math.sin((frame / 90) * Math.PI) * P.idleSway * (Math.PI / 180) * clamp((frame - endFrame) / 20);
  const wordA = angleOf(frame - P.startAt);
  const enter = ease.back(prog(frame, P.startAt, P.startAt + 14, (t) => t));

  // light streak that crosses the face just after it settles
  const sweepP = prog(frame, endFrame - 6, endFrame + 36, (t) => t);
  const sweepX = -visW * 0.62 + visW * 1.24 * ease.inOut(sweepP);
  const sweepI = sweepP > 0 && sweepP < 1 ? 60 * Math.sin(Math.PI * sweepP) : 0;

  const subA = ease.out(prog(frame, settleAt - 6, settleAt + 18, (t) => t));
  const cam: V3 = [0, 0, D];
  void durationInFrames;

  return (
    <AbsoluteFill style={{background: bgCss(P.background, P.accent)}}>
      <Stage3D transparent exposure={1.05}>
        <CameraRig position={cam} target={[0, 0, 0]} fov={fov} near={1} far={60} />
        <StudioEnv intensity={0.7} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[-4, 5, 8]} intensity={2.2} color="#fff3e2" />
        <directionalLight position={[6, -1, 4]} intensity={1.5} color={mixHex(P.accent, '#ffffff', 0.25)} />
        <directionalLight position={[0, 3, -6]} intensity={1.2} color={mixHex(P.accent, '#ffffff', 0.5)} />
        <pointLight position={[sweepX, 1.2, 4.5]} intensity={sweepI} distance={14} decay={1.4} color="#ffffff" />
        <group position={[0, lift, 0]} rotation={[0, idle, 0]} scale={fit * (0.2 + 0.8 * clamp(enter, 0, 1.15))}>
          <group rotation={wordMode ? spinRot(wordA) : [0, 0, 0]}>
            {glyphs.map((g) => {
              const a = wordMode ? {rem: 0, wob: 0, p: 1} : angleOf(frame - P.startAt - g.i * stag);
              const k = wordMode ? 1 : ease.back(prog(frame, P.startAt + g.i * stag, P.startAt + g.i * stag + 12, (t) => t));
              const dropY = wordMode ? 0 : (1 - clamp(k)) * 1.6;
              return (
                <mesh key={g.i} geometry={g.geo} material={[faceMat, sideMat]} position={[g.x, g.y + dropY, 0]} rotation={wordMode ? [0, 0, 0] : spinRot(a)} scale={wordMode ? 1 : Math.max(0.001, k)} />
              );
            })}
          </group>
        </group>
      </Stage3D>
      {hasSub && (
        <div style={{position: 'absolute', left: w * 0.08, right: w * 0.08, top: h * (portrait ? 0.6 : 0.74), textAlign: 'center', color: ink, fontFamily: P.fontFamily || fonts.sans, fontSize: (portrait ? 42 : 40) * u, fontWeight: 500, letterSpacing: 6 * u, textTransform: 'uppercase', opacity: subA * 0.8, transform: `translateY(${(1 - subA) * 20 * u}px)`}}>
          {P.subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const textExtrudeSpin3d = defineMotion<Props>({
  id: '3d-text-extrude-spin',
  title: '3D text extrude and spin (settles)',
  category: '3d',
  description:
    'Your words as real extruded, bevelled 3D letters: they scale in spinning on the vertical (or horizontal) axis, ease out of the spin with a damped wobble, then a light streak sweeps across the glossy faces. Spin the whole word or each letter in a stagger.',
  source: ['three.js TextGeometry (original build)'],
  useFor: 'Title cards, logo-style hero words, brand stings, countdown numbers and chapter openers: set `text`, `faceColor`, `sideColor`, `accent` and the background.',
  durationInFrames: 150,
  defaultProps: {
    text: 'LAUNCH',
    subtitle: 'Coming this spring',
    font: 'sans',
    mode: 'word',
    axis: 'y',
    spins: 2,
    spinFrames: 56,
    startAt: 6,
    stagger: 4,
    depth: 0.36,
    bevel: 0.035,
    tracking: 0.07,
    background: '#101426',
    faceColor: '#f4f6ff',
    sideColor: '#4f6bff',
    accent: '#ff5ea8',
    ink: '',
    metalness: 0.25,
    roughness: 0.28,
    idleSway: 8,
    fontFamily: '',
    size: 1,
  },
  propDocs: {
    text: "the word(s); use '|' or \\n for a new line (Latin letters, digits and basic punctuation; at most 60 characters)",
    subtitle: 'small caps line under the word ("" for none)',
    font: "'sans' (bold) | 'light' (regular) | 'humanist' (bold) | 'serif' (bold)",
    mode: "'word' (whole word spins) | 'letter' (each letter spins on its own with a stagger)",
    axis: "'y' (turntable spin) | 'x' (forward flip)",
    spins: 'full turns before it settles',
    spinFrames: 'frames the spin takes to settle',
    startAt: 'frame the spin starts',
    stagger: "frames between letters in 'letter' mode",
    depth: 'extrusion depth (letter height = 1)',
    bevel: 'bevel size (0 = sharp edges)',
    tracking: 'extra letter spacing (letter height = 1)',
    background: "background colour ('transparent' to composite over other content)",
    faceColor: 'front-face colour',
    sideColor: 'extruded side colour',
    accent: 'rim-light and background glow colour',
    ink: 'subtitle colour (empty = auto contrast)',
    metalness: 'material metalness 0..1',
    roughness: 'material roughness 0..1',
    idleSway: 'degrees of slow sway after it settles',
    fontFamily: 'subtitle font-family (empty = library sans)',
    size: 'word scale multiplier',
  },
  component: TextExtrudeSpin,
  tags: ['3d text', 'extruded', 'title', 'spin', 'turntable', 'logo', 'bevel', 'glossy', 'chrome', 'sting', 'intro', 'headline', 'kinetic type', 'three.js', '3d', 'hero word', 'countdown'],
});
