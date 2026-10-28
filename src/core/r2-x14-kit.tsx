/**
 * r2-x14-kit — shared helpers for the X14 group (techniques reverse-engineered from attached videos x1–x4).
 * x1 voxel studio (three.js voxels, plinth stage, mono HUD) · x2 Swiss motion reel (flat colour, mono HUD,
 * particles) · x3 ink-hatch pop-up textbook (serif UI, glass cards, jars) · x4 storybook gouache promo.
 * Everything is a pure function of the frame; no Math.random, no timers.
 */
import {loadFont as sourceSerif} from '@remotion/google-fonts/SourceSerif4';
import {loadFont as youngSerif} from '@remotion/google-fonts/YoungSerif';
import {loadFont as interTight} from '@remotion/google-fonts/InterTight';

/** extra font roles for this group (loaded once) */
export const x14Fonts = {
  /** book serif for x3 UI / captions (Source Serif 4) */
  bookSerif: sourceSerif('normal', {weights: ['400', '600'], subsets: ['latin']}).fontFamily,
  bookSerifItalic: sourceSerif('italic', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** soft display serif for x4 storybook titles (Young Serif) */
  softSerif: youngSerif('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  /** tight grotesk for x1 titles (Inter Tight) */
  tight: interTight('normal', {weights: ['600', '900'], subsets: ['latin']}).fontFamily,
};

/** parse #rrggbb -> [r,g,b] 0..255 */
export const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
};
/** mix two hex colours -> css rgb() */
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = Math.min(1, Math.max(0, t));
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`;
};
/** hex + alpha -> rgba() */
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, a))})`;
};

// ==== X1 (voxel studio) ====================================================================================
// (imports aliased with an x1 prefix so other sections can import the same names without clashes)
import x1React, {useLayoutEffect as x1UseLayoutEffect, useMemo as x1UseMemo, type FC as X1FC, type ReactNode as X1Node} from 'react';
import * as X1THREE from 'three';
import {RoundedBoxGeometry as X1RoundedBox} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {AbsoluteFill as X1Fill} from 'remotion';
import {useStage as x1UseStage} from './stage';
import {fonts as x1Fonts} from './fonts';
import {CameraRig as X1CameraRig, makeCamera as x1MakeCamera, projectPx as x1ProjectPx, Stage3D as X1Stage3D, type V3 as X1V3} from './three-kit';
import {rng as x1Rng} from './random';

/** x1 "voxel studio" palette (sampled) */
export const VOXEL = {
  bg: '#F3F1ED',
  bgEdge: '#E2E1DA',
  voxel: '#E0764C',
  eye: '#050301',
  plinth: '#E6E0DB',
  notch: '#C9C1B8',
  accent: '#F47A2D',
  badge: '#FF6623',
  ink: '#040300',
  muted: '#87837D',
};

/** one voxel cell: integer grid position + colour slot (0 body, 1 eye/detail, 2 alt) */
export type VoxelCell = [number, number, number, number];

/**
 * Built-in models. `critter` is an original voxel creature (rounded body, pointed ears, round eyes,
 * stubby arms, two fat legs and a curled tail), ~1.1 k voxels. Grid: y up, front face = +z, centred on x/z.
 */
export const voxelModel = (preset: string): VoxelCell[] => {
  const cells: VoxelCell[] = [];
  const add = (x: number, y: number, z: number, c = 0) => cells.push([x, y, z, c]);
  if (preset === 'cube') {
    for (let x = -5; x <= 5; x++) for (let y = 0; y <= 10; y++) for (let z = -5; z <= 5; z++) add(x, y, z, 0);
    return cells;
  }
  if (preset === 'heart') {
    for (let x = -7; x <= 7; x++)
      for (let y = 0; y <= 13; y++)
        for (let z = -2; z <= 2; z++) {
          const X = x / 7.2;
          const Y = (y - 5.5) / 7.2;
          const q = X * X + Y * Y - 1;
          const zr = Math.abs(z) / 2.6;
          if (q * q * q - X * X * Y * Y * Y < -zr * 0.35) add(x, y, z, 0);
        }
    return cells;
  }
  // critter
  for (let x = -6; x <= 6; x++)
    for (let y = 2; y <= 11; y++)
      for (let z = -4; z <= 4; z++) {
        const ex = Math.abs(x) === 6;
        const ez = Math.abs(z) === 4;
        if (ex && ez) continue; // vertical edges rounded
        if ((y === 11 || y === 2) && (ex || ez)) continue; // top / bottom edges rounded
        const ax = Math.abs(x);
        const eye = z === 4 && y >= 6 && y <= 7 && ax >= 2 && ax <= 3;
        add(x, y, z, eye ? 1 : 0);
      }
  // ears (pointed, leaning out)
  for (const s of [-1, 1]) {
    for (const [dx, y] of [
      [3, 12], [4, 12], [5, 12], [4, 13], [5, 13], [5, 14],
    ] as [number, number][])
      for (let z = -1; z <= 0; z++) add(s * dx, y, z, 0);
    // stubby arms
    for (let y = 5; y <= 6; y++) for (let z = -1; z <= 0; z++) add(s * 7, y, z, 0);
    add(s * 8, 6, 0, 0);
    // fat legs
    for (let dx = 2; dx <= 4; dx++) for (let y = 0; y <= 1; y++) for (let z = -1; z <= 1; z++) add(s * dx, y, z, 0);
  }
  // curled tail at the back
  for (const [x, y, z] of [
    [-1, 4, -5], [0, 4, -5], [1, 4, -5], [0, 5, -5], [0, 5, -6], [0, 6, -6], [0, 7, -6], [0, 8, -5],
  ] as X1V3[])
    add(x, y, z, 0);
  return cells;
};

/** JSON `cells` prop ([[x,y,z,c?],...]) or a preset name -> cells */
export const resolveVoxelCells = (cells: number[][] | undefined, preset: string): VoxelCell[] =>
  cells && cells.length ? cells.map((c) => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2]), Math.round(c[3] ?? 0)] as VoxelCell) : voxelModel(preset);

/** seeded build order: bottom-up (shuffled within each layer), random or radial (centre out) */
export const voxelOrder = (cells: VoxelCell[], order: string, seed: number) => {
  const r = x1Rng(seed);
  const keyed = cells.map((c, i) => {
    const j = r();
    const k = order === 'random' ? j : order === 'radial' ? Math.hypot(c[0], c[1] - 6, c[2]) + j * 0.9 : c[1] + j * 0.98;
    return {i, k};
  });
  keyed.sort((a, b) => a.k - b.k);
  const rank = new Array<number>(cells.length);
  keyed.forEach((e, n) => (rank[e.i] = n));
  return rank;
};

/** measured placement curve: slow start (≈ easeInQuad over the first 18 % of the window), then linear */
export const placedFraction = (tau: number) => {
  const t = Math.min(1, Math.max(0, tau));
  return t < 0.18 ? 0.15 * (t / 0.18) ** 2 : 0.15 + (0.85 * (t - 0.18)) / 0.82;
};
/** inverse of placedFraction: fraction of voxels placed -> time fraction of the build window */
export const placedInverse = (p: number) => (p < 0.15 ? 0.18 * Math.sqrt(Math.max(0, p) / 0.15) : 0.18 + ((p - 0.15) / 0.85) * 0.82);

export type VoxelPose = {p: X1V3; r?: X1V3; s?: number; c: number};

/** instanced rounded voxels. `poses` is recomputed every frame by the caller (deterministic). */
export const VoxelInstances: X1FC<{poses: VoxelPose[]; colors: string[]; size?: number; bevel?: number}> = ({poses, colors, size = 0.92, bevel = 0.08}) => {
  const n = Math.max(1, poses.length);
  const geo = x1UseMemo(() => new X1RoundedBox(size, size, size, 2, bevel), [size, bevel]);
  const mesh = x1UseMemo(() => {
    const m = new X1THREE.InstancedMesh(geo, new X1THREE.MeshLambertMaterial({color: '#ffffff'}), n);
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    return m;
  }, [geo, n]);
  const o = x1UseMemo(() => new X1THREE.Object3D(), []);
  const pal = x1UseMemo(() => colors.map((c) => new X1THREE.Color(c)), [colors.join('|')]);
  x1UseLayoutEffect(() => {
    for (let i = 0; i < n; i++) {
      const q = poses[i];
      if (!q || (q.s ?? 1) <= 0.001) {
        o.position.set(0, -999, 0);
        o.scale.setScalar(0.0001);
      } else {
        o.position.set(q.p[0], q.p[1], q.p[2]);
        o.scale.setScalar(q.s ?? 1);
      }
      const rr = q?.r ?? [0, 0, 0];
      o.rotation.set(rr[0], rr[1], rr[2]);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, pal[Math.min(pal.length - 1, q?.c ?? 0)]);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  return <primitive object={mesh} />;
};

/** plinth geometry constants (world units = voxels) */
export const PLINTH = {R: 14, H: 1.7, bevel: 0.35};

/** studio camera: ≈ 20° above the plinth plane, long lens, framing the plinth at 47 % W (wider in portrait) */
export const useStudioCamera = (yaw = 0, elevationDeg = 20, frameTop = 18) => {
  const {w, h} = x1UseStage();
  const fov = 30;
  const aspect = w / h;
  const hTan = Math.tan(((fov / 2) * Math.PI) / 180);
  const wantW = (PLINTH.R * 2) / (aspect >= 1.2 ? 0.47 : aspect >= 0.9 ? 0.66 : 0.86);
  const wantH = frameTop + 10; // keep the model + plinth in frame vertically
  const d = Math.max(wantW / (2 * hTan * aspect), wantH / (2 * hTan));
  const el = (elevationDeg * Math.PI) / 180;
  const target: X1V3 = [0, aspect >= 1.2 ? 6.2 : aspect >= 0.9 ? 7.5 : 12.5, 0];
  const position: X1V3 = [target[0] + Math.sin(yaw) * Math.cos(el) * d, target[1] + Math.sin(el) * d, target[2] + Math.cos(yaw) * Math.cos(el) * d];
  const cam = x1UseMemo(() => x1MakeCamera(position, target, fov, aspect), [position.join(','), target.join(','), aspect]);
  const project = (p: X1V3) => x1ProjectPx(cam, p, w, h);
  return {position, target, fov, project};
};

/** lathe profile of a round plinth with a chamfered top edge */
const plinthGeo = () => {
  const {R, H, bevel} = PLINTH;
  const pts = [new X1THREE.Vector2(0, -H), new X1THREE.Vector2(R, -H), new X1THREE.Vector2(R, -bevel), new X1THREE.Vector2(R - bevel, 0), new X1THREE.Vector2(0, 0)];
  return new X1THREE.LatheGeometry(pts, 160);
};

/** the notch ring: `count` small dents near the plinth's top edge, lit clockwise from the front-left */
const NotchRing: X1FC<{count: number; progress: number; color: string; idle: string; head?: number}> = ({count, progress, color, idle, head = 0}) => {
  const geo = x1UseMemo(() => new X1RoundedBox(0.62, 0.12, 0.3, 1, 0.04), []);
  const mesh = x1UseMemo(() => {
    const m = new X1THREE.InstancedMesh(geo, new X1THREE.MeshLambertMaterial({color: '#ffffff'}), count);
    m.receiveShadow = true;
    return m;
  }, [geo, count]);
  const o = x1UseMemo(() => new X1THREE.Object3D(), []);
  const ci = x1UseMemo(() => new X1THREE.Color(idle), [idle]);
  const cl = x1UseMemo(() => new X1THREE.Color(color), [color]);
  const tmp = x1UseMemo(() => new X1THREE.Color(), []);
  const r = PLINTH.R * 0.955;
  x1UseLayoutEffect(() => {
    for (let k = 0; k < count; k++) {
      // start at the front-left (≈ 7 o'clock seen from the camera) and run clockwise
      const phi = Math.PI * 0.75 - (k / count) * Math.PI * 2;
      o.position.set(Math.cos(phi) * r, 0.0, Math.sin(-phi) * -r);
      o.rotation.set(0, phi + Math.PI / 2, 0);
      o.updateMatrix();
      mesh.setMatrixAt(k, o.matrix);
      const lit = Math.min(1, Math.max(0, progress * count - k));
      tmp.copy(ci).lerp(cl, lit);
      if (head > 0 && lit > 0 && lit < 1) tmp.lerp(new X1THREE.Color('#FFD2B0'), head * 0.4);
      mesh.setColorAt(k, tmp);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  return <primitive object={mesh} />;
};

/**
 * The x1 studio set: warm seamless backdrop with a vignette, a soft key from the upper left with big soft shadows
 * falling right/back, a round matte plinth with a chamfered top and a notch progress ring. Children are 3D content
 * standing on the plinth top (y = 0).
 */
export const PlinthStudio: X1FC<{
  children?: X1Node;
  bg?: string;
  bgEdge?: string;
  plinthColor?: string;
  ringCount?: number;
  progress?: number;
  ringColor?: string;
  ringIdle?: string;
  showRing?: boolean;
  yaw?: number;
  elevation?: number;
  plinthLift?: number;
  plinthOpacity?: number;
}> = ({children, bg = VOXEL.bg, bgEdge = VOXEL.bgEdge, plinthColor = VOXEL.plinth, ringCount = 120, progress = 0, ringColor = VOXEL.accent, ringIdle = VOXEL.notch, showRing = true, yaw = 0, elevation = 20, plinthLift = 0}) => {
  const cam = useStudioCamera(yaw, elevation);
  const geo = x1UseMemo(plinthGeo, []);
  return (
    <X1Fill style={{background: `radial-gradient(ellipse 75% 85% at 50% 35%, ${bg} 0%, ${bg} 35%, ${bgEdge} 100%)`}}>
      <X1Stage3D shadows="soft" flat>
        <X1CameraRig position={cam.position} target={cam.target} fov={cam.fov} near={1} far={600} />
        <ambientLight intensity={1.2} color="#fff6ee" />
        <hemisphereLight args={["#ffffff", "#cfc6bb", 0.35]} />
        <directionalLight
          position={[-22, 40, 18]}
          intensity={0.95}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-camera-near={1}
          shadow-camera-far={140}
          shadow-bias={-0.0006}
          shadow-radius={9}
        />
        {/* shadow catcher floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -PLINTH.H - 0.01 + plinthLift, 0]} receiveShadow>
          <planeGeometry args={[400, 400]} />
          <shadowMaterial opacity={0.13} />
        </mesh>
        <group position={[0, plinthLift, 0]}>
          <mesh geometry={geo} castShadow receiveShadow>
            <meshLambertMaterial color={plinthColor} />
          </mesh>
          {showRing && <NotchRing count={ringCount} progress={progress} color={ringColor} idle={ringIdle} head={1} />}
        </group>
        {children}
      </X1Stage3D>
    </X1Fill>
  );
};

export type VoxelPhase = {from: number; label: string; color?: string};

/**
 * Minimal dev HUD: zero-padded counter "0817 / 1200 VOXELS" + grey sub-line top-left, a phase badge (READY in black,
 * actions in orange) + "029 / 720" frame counter top-right. Overlay-capable (no background).
 */
export const VoxelHud: X1FC<{value: number; total: number; unit: string; subline: string; badge: string; badgeColor: string; frameText: string; ink?: string; muted?: string}> = ({
  value,
  total,
  unit,
  subline,
  badge,
  badgeColor,
  frameText,
  ink = VOXEL.ink,
  muted = VOXEL.muted,
}) => {
  const {w, h, u, portrait} = x1UseStage();
  const s = portrait ? 1.25 : 1;
  const fs = 22 * u * s;
  const mx = Math.max(0.042 * w, 40 * u);
  const my = Math.max(0.072 * h * (portrait ? 0.6 : 1), 56 * u);
  const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, '0');
  const mono: x1React.CSSProperties = {fontFamily: x1Fonts.mono, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap'};
  return (
    <X1Fill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: mx, top: my, ...mono}}>
        <div style={{fontSize: fs * 1.4, color: muted, lineHeight: 1}}>
          <span style={{color: ink, fontWeight: 700}}>{pad(value)}</span> / {pad(total)} {unit}
        </div>
        <div style={{fontSize: fs * 0.82, color: muted, marginTop: fs * 0.75, letterSpacing: '0.1em'}}>{subline}</div>
      </div>
      <div style={{position: 'absolute', right: mx, top: my - fs * 0.35, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ...mono}}>
        <div style={{background: badgeColor, color: '#fff', fontWeight: 700, fontSize: fs * 0.95, padding: `${fs * 0.42}px ${fs * 0.62}px`, borderRadius: 4 * u, lineHeight: 1}}>{badge}</div>
        <div style={{fontSize: fs * 0.82, color: muted, marginTop: fs * 0.62, letterSpacing: '0.06em'}}>{frameText}</div>
      </div>
    </X1Fill>
  );
};

/** the phase active at frame f (phases sorted by `from`) */
export const phaseAt = (phases: VoxelPhase[], f: number): VoxelPhase => {
  let cur = phases[0] ?? {from: 0, label: 'READY'};
  for (const p of phases) if (f >= p.from) cur = p;
  return cur;
};

// ==== /X1 ==================================================================================================

// ==== X2 (swiss reel) ======================================================================================
// (imports aliased with an x2 prefix so other sections can import the same names without clashes)
import {useEffect as x2UseEffect, useState as x2UseState, type FC as X2FC} from 'react';
import {fonts as x2Fonts} from './fonts';
import {useCurrentFrame as x2UseFrame, delayRender as x2Delay, continueRender as x2Continue} from 'remotion';
import {useStage as x2UseStage} from './stage';
import {rng as x2Rng} from './random';

/** x2 "swiss reel" palette (sampled) */
export const SWISS = {
  paper: '#EDE9E1',
  paperEdge: '#CDC9C1',
  red: '#FC491D',
  dotOnBlue: '#F6481E',
  blue: '#1F32EE',
  blueCentre: '#2034F4',
  blueEdge: '#1C2EDA',
  lime: '#D2FC36',
  black: '#0C0B10',
  ink: '#1E181E',
  cream: '#EADED8',
  sand: '#E8E2D8',
  dash: '#E8E6DC',
  hud: '#808078',
};

/** uncached canvas text width (re-measured every call so a pre-font-load width never sticks) */
let x2Ctx: CanvasRenderingContext2D | null = null;
export const measureTextPx = (text: string, font: string) => {
  if (!text) return 0;
  x2Ctx ??= typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  if (!x2Ctx) return text.length * 40;
  x2Ctx.font = font;
  return x2Ctx.measureText(text).width;
};

/** flat colour field with a soft radial vignette (paper / ultramarine / black chapters) */
export const SwissField: X2FC<{color: string; edge?: string; cx?: number; cy?: number}> = ({color, edge, cx = 50, cy = 50}) => (
  <div style={{position: 'absolute', inset: 0, background: edge ? `radial-gradient(ellipse 75% 75% at ${cx}% ${cy}%, ${color} 35%, ${edge} 100%)` : color}} />
);

/** SMPTE-ish timecode from a frame at `fps` */
export const smpte = (frame: number, fps = 30) => {
  const f = Math.max(0, Math.floor(frame));
  const ff = f % fps;
  const s = Math.floor(f / fps);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
};

/**
 * Persistent studio HUD of the x2 reel: corner crop marks, chapter label top-left, beat-dot timecode top-right,
 * footer specs bottom-left, a 7-segment progress bar bottom-right. Ink at ≈ 55 % opacity so it never competes.
 */
export const ReelHud: X2FC<{ink: string; label?: string; footer?: string; segments?: number; active?: number; progress?: number; beat?: boolean; dot?: string; opacity?: number}> = ({
  ink,
  label = '',
  footer = '',
  segments = 7,
  active = 0,
  progress = 0,
  beat = false,
  dot = SWISS.red,
  opacity = 0.6,
}) => {
  const frame = x2UseFrame();
  const {w, h, u, fps} = x2UseStage();
  const m = 40 * u;
  const arm = 26 * u;
  const fs = 13 * u;
  const font = `500 ${fs}px ${x2Fonts.mono}`;
  const segW = 52 * u;
  const gap = 6 * u;
  const barX = w - 78 * u - segments * segW - (segments - 1) * gap;
  const barY = h - 84 * u;
  const tc = smpte(frame, fps);
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <g stroke={ink} strokeWidth={2 * u} fill="none" opacity={opacity}>
        <path d={`M${m},${m + arm} V${m} H${m + arm} M${w - m - arm},${m} H${w - m} V${m + arm} M${m},${h - m - arm} V${h - m} H${m + arm} M${w - m - arm},${h - m} H${w - m} V${h - m - arm}`} />
      </g>
      <g fontFamily={x2Fonts.mono} fontSize={fs} fill={ink} opacity={opacity} style={{letterSpacing: 0.25 * fs}}>
        {label ? (
          <text x={78 * u} y={85 * u + fs * 0.35} style={{font}}>
            {label}
          </text>
        ) : null}
        <text x={w - 78 * u} y={85 * u + fs * 0.35} textAnchor="end" style={{font}}>
          {tc}
        </text>
        {footer ? (
          <text x={78 * u} y={h - 84 * u + fs * 0.35} style={{font}}>
            {footer}
          </text>
        ) : null}
      </g>
      <circle cx={w - 78 * u - measureTextPx(tc, font) - tc.length * 0.25 * fs - 12 * u} cy={85 * u} r={3.5 * u} fill={beat ? dot : ink} opacity={beat ? 1 : opacity} />
      {segments > 0 && w / u > 900
        ? Array.from({length: segments}, (_, i) => (
            <g key={i}>
              <rect x={barX + i * (segW + gap)} y={barY - 1.5 * u} width={segW} height={3 * u} fill={ink} opacity={opacity * 0.35} />
              <rect
                x={barX + i * (segW + gap)}
                y={barY - 1.5 * u}
                width={segW * (i < active ? 1 : i === active ? Math.min(1, Math.max(0, progress)) : 0)}
                height={3 * u}
                fill={ink}
                opacity={opacity}
              />
            </g>
          ))
        : null}
    </svg>
  );
};

/** deterministic scramble-decode: chars resolve left→right between `start` and `end`, random glyphs before */
export const decodeText = (text: string, frame: number, start: number, end: number, seed = 7, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/') => {
  if (frame < start) return '';
  const n = text.length;
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = text[i];
    const resolveAt = start + ((end - start) * (i + 1)) / n;
    if (c === ' ' || frame >= resolveAt) out += c;
    else {
      const r = x2Rng(seed * 977 + i * 131 + Math.floor(frame) * 7919)();
      out += charset[Math.floor(r * charset.length)];
    }
  }
  return out;
};

export type GlyphPoints = {pts: Float32Array; count: number; aspect: number};
const x2GlyphCache = new Map<string, GlyphPoints>();
/**
 * Sample `count` points from `text` drawn on an offscreen canvas (after the web font has loaded).
 * Returns points normalised to the text's ink box: x,y in units of the box height, centred on 0 (y up).
 * Guarded by delayRender; memoised by text/font/count/seed.
 */
export const useGlyphPoints = (text: string, fontFamily: string, weight: string | number, count: number, seed = 1): GlyphPoints | null => {
  const key = `${text}|${fontFamily}|${weight}|${count}|${seed}`;
  const [pts, setPts] = x2UseState<GlyphPoints | null>(() => x2GlyphCache.get(key) ?? null);
  const [handle] = x2UseState(() => (x2GlyphCache.has(key) ? null : x2Delay(`sampling glyph ${text}`)));
  x2UseEffect(() => {
    const hit = x2GlyphCache.get(key);
    if (hit) {
      setPts(hit);
      if (handle !== null) x2Continue(handle);
      return;
    }
    let done = false;
    const S = 320; // font px on the sampling canvas
    const fontCss = `${weight} ${S}px ${fontFamily}`;
    const run = () => {
      if (done) return;
      done = true;
      const c = document.createElement('canvas');
      const tw = Math.ceil(measureTextPx(text, fontCss)) + S;
      c.width = Math.max(64, tw);
      c.height = Math.ceil(S * 1.6);
      const g = c.getContext('2d', {willReadFrequently: true});
      if (!g) {
        if (handle !== null) x2Continue(handle);
        return;
      }
      g.fillStyle = '#fff';
      g.font = fontCss;
      g.textBaseline = 'middle';
      g.fillText(text, S / 2, c.height / 2);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const inside: number[] = [];
      let x0 = 1e9;
      let x1 = -1e9;
      let y0 = 1e9;
      let y1 = -1e9;
      const step = 2;
      for (let y = 0; y < c.height; y += step)
        for (let x = 0; x < c.width; x += step)
          if (d[(y * c.width + x) * 4 + 3] > 128) {
            inside.push(x, y);
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      const r = x2Rng(seed * 1013 + 17);
      const out = new Float32Array(count * 2);
      const bh = Math.max(1, y1 - y0);
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const n = inside.length / 2;
      for (let i = 0; i < count; i++) {
        const k = n ? Math.floor(r() * n) : 0;
        const px = n ? inside[k * 2] + (r() - 0.5) * step : 0;
        const py = n ? inside[k * 2 + 1] + (r() - 0.5) * step : 0;
        out[i * 2] = (px - mx) / bh;
        out[i * 2 + 1] = -(py - my) / bh;
      }
      const res = {pts: out, count, aspect: (x1 - x0) / bh};
      x2GlyphCache.set(key, res);
      setPts(res);
      if (handle !== null) x2Continue(handle);
    };
    const fonts = (document as Document & {fonts?: FontFaceSet}).fonts;
    if (fonts && fonts.load) fonts.load(fontCss, text).then(run, run);
    else run();
  }, [key, text, fontFamily, weight, count, seed, handle]);
  return pts;
};

// ==== /X2 ==================================================================================================

// ==== X3 (ink-hatch textbook) ==============================================================================
// (imports aliased with an x3 prefix so other sections can import the same names without clashes)
import {Fragment as X3Fragment, type FC as X3FC} from 'react';
import {fonts as x3Fonts} from './fonts';

/** ink-hatch-3d palette (x3, sampled) */
export const HATCH3 = {
  desk: '#BEB3A2',
  deskShade: '#979086',
  deskDeep: '#7B756C',
  mat: '#8FA194',
  matMid: '#8A998D',
  matShade: '#535F56',
  paper: '#EFEDE9',
  paperShade: '#B0AEAE',
  ink: '#1E1E1E',
  clay: '#F4F2EE',
  clayShade: '#C9C6C0',
  cloth: '#D6A73C',
  clothSide: '#C99B2B',
  foil: '#B38046',
  pageEdge: '#AA7E1C',
  ribbon: '#141B40',
  label: '#F2EEE4',
  eyebrow: '#683836',
  purple: '#7E2AE4',
  blue: '#2A79EB',
  orange: '#F2741E',
  pink: '#E86AA8',
  green: '#2DFF71',
  red: '#E5483B',
  teal: '#16B5B0',
  yellow: '#F3C432',
  lilac: '#A891D7',
};

/** 2 significant figures, trimmed ("0.00011", "0.48", "14") */
export const fmtSig = (v: number, sig = 2) => (Math.abs(v) < 1e-9 ? '0' : String(Number(v.toPrecision(sig))));

/**
 * Orthographic 3/4 projector for 2.5D ink scenes (y up). Yaw about the vertical axis, then pitch down by
 * `pitchDeg` (elevation). A horizontal circle of radius r projects to an axis-aligned ellipse (r·s, r·s·sinφ).
 */
export type X3Proj = {
  P: (x: number, y: number, z: number) => [number, number];
  depth: (x: number, y: number, z: number) => number;
  s: number;
  sinPhi: number;
  cosPhi: number;
};
export const makeProj = (cx: number, cy: number, s: number, yawDeg: number, pitchDeg: number): X3Proj => {
  const ps = (yawDeg * Math.PI) / 180;
  const ph = (pitchDeg * Math.PI) / 180;
  const cp = Math.cos(ps);
  const sp = Math.sin(ps);
  const sinPhi = Math.sin(ph);
  const cosPhi = Math.cos(ph);
  return {
    P: (x, y, z) => {
      const xr = x * cp + z * sp;
      const zr = -x * sp + z * cp;
      return [cx + xr * s, cy - y * cosPhi * s + zr * sinPhi * s];
    },
    depth: (x, y, z) => (-x * sp + z * cp) * cosPhi + y * sinPhi,
    s,
    sinPhi,
    cosPhi,
  };
};

/** ellipse path: full, front (lower) half or back (upper) half */
export const ellPath = (cx: number, cy: number, rx: number, ry: number, part: 'full' | 'front' | 'back' = 'full') => {
  if (part === 'front') return `M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy}`;
  if (part === 'back') return `M${cx + rx},${cy} A${rx},${ry} 0 0 0 ${cx - rx},${cy}`;
  return `M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} A${rx},${ry} 0 0 0 ${cx - rx},${cy} Z`;
};

/** polygon path from screen points */
export const polyPath = (pts: [number, number][]) => 'M' + pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L') + ' Z';

/** 2D convex hull (monotone chain) */
export const hull2 = (pts: [number, number][]): [number, number][] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  up.pop();
  lo.pop();
  return lo.concat(up);
};

/** ground (y=0) cast-shadow hull of 3D points for a light whose shadow moves (lx, lz) per unit of height */
export const shadowHull = (pr: X3Proj, pts: [number, number, number][], lx: number, lz: number) =>
  hull2(pts.map(([x, y, z]) => pr.P(x + y * lx, 0, z + y * lz)));

/** parallel-line hatch <pattern> (pen strokes). Put inside <defs>. */
export const X3Hatch: X3FC<{id: string; spacing: number; angle: number; color?: string; width?: number; opacity?: number}> = ({
  id,
  spacing,
  angle,
  color = HATCH3.ink,
  width = 1,
  opacity = 0.7,
}) => (
  <pattern id={id} patternUnits="userSpaceOnUse" width={spacing} height={spacing} patternTransform={`rotate(${angle})`}>
    <line x1={spacing / 2} y1={-1} x2={spacing / 2} y2={spacing + 1} stroke={color} strokeWidth={width} opacity={opacity} />
  </pattern>
);

/** soft gaussian blur filter with a generous region. Put inside <defs>. */
export const X3Blur: X3FC<{id: string; sd: number}> = ({id, sd}) => (
  <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation={sd} />
  </filter>
);

/**
 * Book-page ground for the 2.5D ink scenes: warm paper with a soft window-light gobo (a diagonal band of
 * light and a mullion shadow fixed in the world), slight vignette and paper tooth.
 */
export const X3PageGround: X3FC<{w: number; h: number; u: number; paper?: string; gobo?: number; id: string; shift?: number}> = ({
  w,
  h,
  u,
  paper = HATCH3.paper,
  gobo = 1,
  id,
  shift = 0,
}) => {
  const sh = shift * w;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id={`${id}-pg`} cx="42%" cy="45%" r="80%">
          <stop offset="0%" stopColor={paper} />
          <stop offset="70%" stopColor={mixHex(paper, '#9a958c', 0.12)} />
          <stop offset="100%" stopColor={mixHex(paper, '#7d776d', 0.3)} />
        </radialGradient>
        <X3Blur id={`${id}-gb`} sd={38 * u} />
        <filter id={`${id}-tooth`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={4} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.07" />
          </feComponentTransfer>
        </filter>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-pg)`} />
      {gobo > 0 ? (
        <g filter={`url(#${id}-gb)`} opacity={gobo}>
          {/* shadow of the window wall: top-right wedge + a mullion bar crossing the light */}
          <path d={`M${w * 0.58 + sh},${-h * 0.2} L${w * 1.3 + sh},${-h * 0.2} L${w * 1.3 + sh},${h * 0.62} Z`} fill="#3b3128" opacity={0.2} />
          <path d={`M${w * 0.22 + sh},${-h * 0.2} L${w * 0.27 + sh},${-h * 0.2} L${w * 1.2 + sh},${h * 1.2} L${w * 1.13 + sh},${h * 1.2} Z`} fill="#3b3128" opacity={0.08} />
          <path d={`M${-w * 0.2 + sh},${h * 0.05} L${w * 0.2 + sh},${-h * 0.2} L${w * 0.75 + sh},${h * 1.2} L${w * 0.1 + sh},${h * 1.2} Z`} fill="#fffaf0" opacity={0.22} />
        </g>
      ) : null}
      <rect width={w} height={h} filter={`url(#${id}-tooth)`} />
    </svg>
  );
};

/** ink sun icon: a line circle draws on, 12 rays pop out, then the disc shades like clay (shade 0..1) */
export const X3Sun: X3FC<{x: number; y: number; r: number; draw: number; rays: number; shade: number; u: number; id: string; ink?: string}> = ({
  x,
  y,
  r,
  draw,
  rays,
  shade,
  u,
  id,
  ink = HATCH3.ink,
}) => {
  if (draw <= 0) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-sg`} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor={HATCH3.clay} />
          <stop offset="100%" stopColor={HATCH3.clayShade} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-sg)`} opacity={shade} />
      {Array.from({length: 12}, (_, k) => {
        const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
        const pk = clamp01((rays - k * 0.04) / 0.5);
        if (pk <= 0) return null;
        const r0 = r * 1.35;
        const r1 = r * (1.35 + 0.55 * (k % 2 ? 0.75 : 1) * pk);
        return <line key={k} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1} stroke={ink} strokeWidth={1.6 * u} strokeLinecap="round" />;
      })}
      <path d={ellPath(x, y, r, r)} pathLength={1} strokeDasharray={`${draw} 1`} fill="none" stroke={ink} strokeWidth={1.7 * u} />
    </g>
  );
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export type X3Jar = {label: string; color: string; value: number; unit?: string};
export type X3JarState = {level: number; glow: number; value: number};
export type X3Arc = {from: number; to: number; p: number; flow: number; alpha: number};

/** world layout of the jar rack: jar i (reading order, top row first) -> base centre + row */
export const rackLayout = (cols: number, rows: number) => {
  const SP = 1.3;
  const R = 0.42;
  const H = 1.08;
  const ROW = 1.55;
  const PL = 0.12; // plank thickness
  const D = 0.62; // half depth
  const hw = (cols * SP) / 2 + 0.08;
  const jar = (i: number) => {
    const row = rows - 1 - Math.floor(i / cols);
    const col = i % cols;
    const y0 = row * ROW + PL;
    return {x: (col - (cols - 1) / 2) * SP, y0, z: 0, row};
  };
  const panelH = (rows - 1) * ROW + PL + H + 0.4;
  return {SP, R, H, ROW, PL, D, hw, jar, panelH};
};

/**
 * The x3 pop-up jar rack, drawn in ink on clay: planks with hatched front edges, side panels, glass jars with
 * self-lit liquids (level 0..1), glow spill on shelves/panels/neighbours, label cards with handwritten values,
 * and transfer arcs (gradient tubes that draw on, then flow). Pure SVG, painter-sorted.
 */
export const X3Rack: X3FC<{
  pr: X3Proj;
  cols: number;
  rows: number;
  jars: X3Jar[];
  states: X3JarState[];
  arcs?: X3Arc[];
  u: number;
  id: string;
  ink?: string;
  labels?: boolean;
  glowStrength?: number;
  arcWidth?: number;
  arcHeight?: number;
  lineDraw?: number;
  shadow?: number;
  /** frame, drives the rising specks inside lit liquids */
  t?: number;
}> = ({pr, cols, rows, jars, states, arcs = [], u, id, ink = HATCH3.ink, labels = true, glowStrength = 1, arcWidth = 1, arcHeight = 0.6, lineDraw = 1, shadow = 1, t = 0}) => {
  const L = rackLayout(cols, rows);
  const {P, s, sinPhi} = pr;
  const n = Math.min(jars.length, cols * rows);
  const lw = 1.5 * u;
  const rx = L.R * s;
  const ry = L.R * s * sinPhi;
  const ld = clamp01(lineDraw);
  const dash = ld < 1 ? {pathLength: 1, strokeDasharray: `${ld} 1`} : {};
  // aggregate tint per row/panel side
  const glowAt = (x: number, y: number) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let wsum = 0;
    for (let i = 0; i < n; i++) {
      const st = states[i];
      if (!st || st.glow <= 0.001) continue;
      const j = L.jar(i);
      const d = Math.hypot(j.x - x, j.y0 + L.H / 2 - y);
      const k = (st.glow * glowStrength) / (1 + d * d * 0.9);
      const c = hexRgb(jars[i].color);
      r += c[0] * k;
      g += c[1] * k;
      b += c[2] * k;
      wsum += k;
    }
    if (wsum <= 0) return null;
    return {color: `rgb(${Math.round(r / wsum)},${Math.round(g / wsum)},${Math.round(b / wsum)})`, k: clamp01(wsum)};
  };
  const quad = (pts: [number, number, number][]) => polyPath(pts.map(([x, y, z]) => P(x, y, z)));
  // ---- ground shadow of the whole rack (light from upper-left-back) ----
  const shPts: [number, number, number][] = [];
  for (const sx of [-L.hw, L.hw]) for (const sz of [-L.D, L.D]) for (const sy of [0, L.panelH]) shPts.push([sx, sy, sz]);
  const rackShadow = polyPath(shadowHull(pr, shPts, 0.55, 0.22));

  const plank = (row: number) => {
    const yT = row * L.ROW + L.PL;
    const yB = yT - L.PL;
    const g = glowAt(0, yT + 0.3);
    const top = quad([
      [-L.hw, yT, -L.D],
      [L.hw, yT, -L.D],
      [L.hw, yT, L.D],
      [-L.hw, yT, L.D],
    ]);
    const front = quad([
      [-L.hw, yT, L.D],
      [L.hw, yT, L.D],
      [L.hw, yB, L.D],
      [-L.hw, yB, L.D],
    ]);
    return (
      <g key={`pl${row}`}>
        <path d={top} fill={HATCH3.clay} opacity={0.55 * ld} />
        {g ? <path d={top} fill={g.color} opacity={0.32 * g.k * ld} /> : null}
        {/* glow pools on the plank under each lit jar */}
        {Array.from({length: n}, (_, i) => {
          const j = L.jar(i);
          const st = states[i];
          if (j.row !== row || !st || st.glow <= 0.001) return null;
          const [px, py] = P(j.x, yT, j.z + 0.15);
          return <ellipse key={i} cx={px} cy={py} rx={rx * 2.3} ry={rx * 2.3 * sinPhi * 1.3} fill={jars[i].color} opacity={0.42 * st.glow * glowStrength} filter={`url(#${id}-b2)`} />;
        })}
        <path d={front} fill={HATCH3.clay} opacity={ld} />
        <path d={front} fill={`url(#${id}-h1)`} opacity={ld} />
        <path d={top} fill="none" stroke={ink} strokeWidth={lw} strokeLinejoin="round" {...dash} />
        <path d={front} fill="none" stroke={ink} strokeWidth={lw} strokeLinejoin="round" {...dash} />
      </g>
    );
  };

  const panel = (side: -1 | 1) => {
    const x = side * L.hw;
    const xi = x - side * 0.1;
    const g = glowAt(x, L.panelH * 0.55);
    const face = quad([
      [x, 0, -L.D],
      [x, L.panelH, -L.D],
      [x, L.panelH, L.D],
      [x, 0, L.D],
    ]);
    const edge = quad([
      [xi, 0, L.D],
      [x, 0, L.D],
      [x, L.panelH, L.D],
      [xi, L.panelH, L.D],
    ]);
    return (
      <g key={`pn${side}`}>
        <path d={face} fill={HATCH3.clay} opacity={0.5 * ld} />
        {g ? <path d={face} fill={g.color} opacity={0.55 * g.k * ld} /> : null}
        <path d={face} fill={`url(#${id}-h2)`} opacity={0.35 * ld} />
        <path d={edge} fill={HATCH3.clay} opacity={ld} />
        <path d={edge} fill={`url(#${id}-h1)`} opacity={ld} />
        <path d={face} fill="none" stroke={ink} strokeWidth={lw} strokeLinejoin="round" {...dash} />
        <path d={edge} fill="none" stroke={ink} strokeWidth={lw} strokeLinejoin="round" {...dash} />
      </g>
    );
  };

  const jarEl = (i: number) => {
    const j = L.jar(i);
    const st = states[i] ?? {level: 0, glow: 0, value: 0};
    const col = jars[i].color;
    const [bx, by] = P(j.x, j.y0, j.z);
    const [tx, ty] = P(j.x, j.y0 + L.H, j.z);
    const sil = `M${tx - rx},${ty} L${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${tx + rx},${ty} A${rx},${ry} 0 0 0 ${tx - rx},${ty} Z`;
    const lev = clamp01(st.level);
    const yl = j.y0 + 0.05 + lev * (L.H - 0.12);
    const [lx, lyy] = P(j.x, yl, j.z);
    const [lbx, lby] = P(j.x, j.y0 + 0.05, j.z);
    const rr = rx * 0.88;
    const rry = ry * 0.88;
    const liquid = `M${lx - rr},${lyy} L${lbx - rr},${lby} A${rr},${rry} 0 0 0 ${lbx + rr},${lby} L${lx + rr},${lyy} A${rr},${rry} 0 0 0 ${lx - rr},${lyy} Z`;
    const gid = `${id}-lq${i}`;
    return (
      <g key={`j${i}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mixHex(col, '#ffffff', 0.38)} />
            <stop offset="45%" stopColor={col} />
            <stop offset="100%" stopColor={mixHex(col, '#000000', 0.22)} />
          </linearGradient>
        </defs>
        {/* halo around the jar */}
        {st.glow > 0.001 ? <ellipse cx={(bx + tx) / 2} cy={(by + ty) / 2} rx={rx * 2.4} ry={(by - ty) * 0.85} fill={col} opacity={0.3 * st.glow * glowStrength} filter={`url(#${id}-b3)`} /> : null}
        {/* glass body */}
        <path d={sil} fill="#ffffff" opacity={0.18 * ld} />
        {/* back rim + back base (seen through the glass) */}
        <path d={ellPath(bx, by, rx, ry, 'back')} fill="none" stroke={ink} strokeWidth={lw * 0.8} opacity={0.3} {...dash} />
        {lev > 0.004 ? (
          <g>
            <path d={liquid} fill={col} opacity={0.55} filter={`url(#${id}-b1)`} />
            <path d={liquid} fill={`url(#${gid})`} />
            <path d={ellPath(lx, lyy, rr, rry)} fill={mixHex(col, '#ffffff', 0.5)} opacity={0.92} />
            <path d={ellPath(lx, lyy, rr, rry, 'front')} fill="none" stroke={mixHex(col, '#000000', 0.25)} strokeWidth={lw * 0.7} opacity={0.6} />
            <rect x={lbx - rr * 0.62} y={lyy + rry * 0.6} width={rr * 0.16} height={Math.max(0, lby - lyy - rry * 0.6)} fill="#ffffff" opacity={0.35} rx={rr * 0.08} />
            {/* rising specks */}
            {Array.from({length: 3}, (_, k) => {
              const ph = (k * 0.37 + i * 0.13 + t / (40 + k * 9)) % 1;
              const yy = lby - (lby - lyy - rry) * ph;
              return <circle key={k} cx={lbx + (k - 1) * rr * 0.4} cy={yy} r={1.6 * u} fill="#ffffff" opacity={0.6 * lev} />;
            })}
          </g>
        ) : null}
        {/* glass highlight */}
        <line x1={tx - rx * 0.6} y1={ty + ry * 1.4} x2={bx - rx * 0.6} y2={by - ry * 0.4} stroke="#ffffff" strokeWidth={3 * u} opacity={0.5 * ld} strokeLinecap="round" />
        {/* ink lines */}
        <path d={`M${tx - rx},${ty} L${bx - rx},${by} M${tx + rx},${ty} L${bx + rx},${by}`} stroke={ink} strokeWidth={lw} fill="none" {...dash} />
        <path d={ellPath(bx, by, rx, ry, 'front')} stroke={ink} strokeWidth={lw} fill="none" {...dash} />
        <path d={ellPath(tx, ty, rx, ry)} stroke={ink} strokeWidth={lw} fill="none" {...dash} />
        <path d={ellPath(tx, ty + ry * 0.35, rx * 0.9, ry * 0.85, 'front')} stroke={ink} strokeWidth={lw * 0.7} fill="none" opacity={0.6} {...dash} />
      </g>
    );
  };

  const labelEl = (i: number) => {
    const j = L.jar(i);
    const st = states[i] ?? {level: 0, glow: 0, value: 0};
    const W = 0.9;
    const Hc = 0.4;
    const zc = L.D - 0.04;
    const yTop = j.y0 + Hc + 0.02;
    const o = P(j.x - W / 2, yTop, zc);
    const ax = P(j.x - W / 2 + 1, yTop, zc);
    const ay = P(j.x - W / 2, yTop - 1, zc);
    const m = `matrix(${ax[0] - o[0]},${ax[1] - o[1]},${ay[0] - o[0]},${ay[1] - o[1]},${o[0]},${o[1]})`;
    const jr = jars[i];
    const g = st.glow * glowStrength;
    return (
      <g key={`lb${i}`} transform={m} opacity={ld}>
        <rect x={0} y={0} width={W} height={Hc} fill={HATCH3.label} stroke={ink} strokeWidth={0.014} />
        {g > 0.001 ? <rect x={0} y={0} width={W} height={Hc} fill={jr.color} opacity={0.16 * g} /> : null}
        <rect x={0.035} y={0.035} width={W - 0.07} height={Hc - 0.07} fill="none" stroke={ink} strokeWidth={0.006} opacity={0.5} />
        <text x={0.07} y={0.12} fontFamily={x14Fonts.bookSerif} fontSize={0.075} fill={ink} opacity={0.85}>
          {jr.label}
        </text>
        <circle cx={W - 0.12} cy={0.1} r={0.04} fill="none" stroke={ink} strokeWidth={0.008} />
        <text x={0.1} y={0.33} fontFamily={x3Fonts.hand} fontWeight={700} fontSize={0.2} fill={ink}>
          {fmtSig(st.value)} {jr.unit ?? 'J'}
        </text>
      </g>
    );
  };

  const arcEl = (a: X3Arc, k: number) => {
    if (a.p <= 0.005 || a.alpha <= 0) return null;
    const ja = L.jar(a.from);
    const jb = L.jar(a.to);
    const ya = ja.y0 + L.H - 0.3;
    const yb = jb.y0 + L.H - 0.3;
    const apex = Math.max(ja.y0, jb.y0) + L.H + arcHeight * L.SP * Math.sqrt(Math.max(1, Math.abs(a.to - a.from) % cols || 1));
    const cy3 = 2 * apex - (ya + yb) / 2;
    const pts: [number, number][] = [];
    const N = 40;
    for (let q = 0; q <= N; q++) {
      const t = q / N;
      const x = (1 - t) * (1 - t) * ja.x + 2 * (1 - t) * t * ((ja.x + jb.x) / 2) + t * t * jb.x;
      const y = (1 - t) * (1 - t) * ya + 2 * (1 - t) * t * cy3 + t * t * yb;
      const z = (1 - t) * ja.z + t * jb.z;
      pts.push(P(x, y, z));
    }
    const d = 'M' + pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L');
    const ca = jars[a.from].color;
    const cb = jars[a.to].color;
    const gid = `${id}-ag${k}`;
    const wv = 6.2 * u * arcWidth;
    const da = {pathLength: 1, strokeDasharray: `${a.p} 2`};
    return (
      <g key={`a${k}`} opacity={a.alpha}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={pts[0][0]} y1={pts[0][1]} x2={pts[N][0]} y2={pts[N][1]}>
            <stop offset="0%" stopColor={ca} />
            <stop offset="50%" stopColor={mixHex(mixHex2(ca, cb), '#ffffff', 0.25)} />
            <stop offset="100%" stopColor={cb} />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke={`url(#${gid})`} strokeWidth={wv * 3} strokeLinecap="round" opacity={0.35} filter={`url(#${id}-b1)`} {...da} />
        <path d={d} fill="none" stroke={`url(#${gid})`} strokeWidth={wv} strokeLinecap="round" {...da} />
        <path d={d} fill="none" stroke="#ffffff" strokeWidth={wv * 0.28} strokeLinecap="round" opacity={0.45} transform={`translate(${-wv * 0.18},${-wv * 0.22})`} {...da} />
        {a.p >= 1 && a.flow > 0 ? (
          <path d={d} fill="none" stroke="#ffffff" strokeWidth={wv * 0.45} strokeLinecap="round" opacity={0.55 * Math.min(1, a.flow * 4)} pathLength={1} strokeDasharray="0.035 0.075" strokeDashoffset={-a.flow} />
        ) : null}
      </g>
    );
  };

  const rowsArr = Array.from({length: rows}, (_, r) => r);
  return (
    <g>
      <defs>
        <X3Hatch id={`${id}-h1`} spacing={4.2 * u} angle={-60} width={1 * u} opacity={0.65} />
        <X3Hatch id={`${id}-h2`} spacing={6 * u} angle={-35} width={0.9 * u} opacity={0.5} />
        <X3Blur id={`${id}-b1`} sd={5 * u} />
        <X3Blur id={`${id}-b2`} sd={14 * u} />
        <X3Blur id={`${id}-b3`} sd={22 * u} />
        <X3Blur id={`${id}-bs`} sd={16 * u} />
      </defs>
      <path d={rackShadow} fill="#2b241c" opacity={0.2 * shadow} filter={`url(#${id}-bs)`} />
      {panel(-1)}
      {rowsArr.map((row) => (
        <X3Fragment key={row}>
          {plank(row)}
          {Array.from({length: n}, (_, i) => (L.jar(i).row === row ? jarEl(i) : null))}
          {labels ? Array.from({length: n}, (_, i) => (L.jar(i).row === row ? labelEl(i) : null)) : null}
        </X3Fragment>
      ))}
      {panel(1)}
      {arcs.map(arcEl)}
    </g>
  );
};
const mixHex2 = (a: string, b: string) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const h = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${h((A[0] + B[0]) / 2)}${h((A[1] + B[1]) / 2)}${h((A[2] + B[2]) / 2)}`;
};

/** jar state from a fill timeline: [{jar, level, at}] with fill (easeOutCubic) / drain (easeInCubic) */
export const jarTimeline = (
  frame: number,
  n: number,
  events: {jar: number; level: number; at: number}[],
  fillFrames: number,
  drainFrames: number,
  values: number[],
): X3JarState[] =>
  Array.from({length: n}, (_, i) => {
    const ev = events.filter((e) => e.jar === i).sort((a, b) => a.at - b.at);
    let level = 0;
    for (const e of ev) {
      if (frame < e.at) break;
      const up = e.level >= level;
      const dur = up ? fillFrames : drainFrames;
      const t = clamp01((frame - e.at) / dur);
      const k = up ? 1 - Math.pow(1 - t, 3) : t * t * t;
      level = level + (e.level - level) * k;
    }
    const maxLevel = Math.max(0.0001, ...ev.map((e) => e.level));
    // counter interpolates over ~10 frames behind the level: quantised to 2 significant figures by fmtSig
    return {level, glow: clamp01(level / Math.max(0.35, maxLevel * 0.6)), value: (values[i] ?? 0) * clamp01(level / maxLevel)};
  });

/** generic ink-on-clay objects for the x3 world (mug, battery, balloon, block, spring, ball, jar) */
export type X3ObjKind = 'mug' | 'battery' | 'balloon' | 'block' | 'spring' | 'ball' | 'jar' | 'bulb';
// ==== X3 helpers end ====

// ==== /X3 ==================================================================================================

// ==== X3b (textbook UI: cards, loupe, flap, toolbar) =======================================================
// (imports aliased with an x3b prefix so they never clash with other sections)
import type {CSSProperties as X3bCSS, FC as X3bFC, ReactNode as X3bNode} from 'react';
import {useStage as x3bUseStage} from './stage';
import {fonts as x3bFonts} from './fonts';

/** ink-hatch-3d palette (x3, sampled) */
export const INK3 = {
  wood: '#BEB3A2',
  woodShade: '#979086',
  woodGrain: '#ABA08F',
  mat: '#8FA194',
  matShade: '#7F9184',
  paper: '#EFEDE9',
  paperShade: '#DCD9D2',
  ink: '#1E1E1E',
  cloth: '#D6A73C',
  clothSide: '#C99B2B',
  pageEdge: '#AA7E1C',
  ribbon: '#141B40',
  purple: '#7E2AE4',
  blue: '#2A79EB',
  orange: '#F2741E',
  green: '#2DFF71',
  pink: '#E86AA8',
  glassTop: '#F5EDE0',
  glassBottom: '#CBD2CB',
  toolbar: '#C7CEC7',
  toolbarInk: '#2B2B2B',
  eyebrow: '#683836',
  heading: '#22211A',
  body: '#3B3B38',
  pager: '#733843',
  flap: '#F2EEE4',
  flapUnder: '#D9D2C2',
};

export type BookMode = 'auto' | 'spread' | 'single';
/** page units: each page is PW × PH */
export const BOOK_PW = 1000;
export const BOOK_PH = 1150;

/** where the open book sits on screen: s = px per page unit; left page = (bx, by, PW·s, PH·s) */
export const bookLayout = (w: number, h: number, mode: BookMode = 'auto', offsetY = 0) => {
  const single = mode === 'single' || (mode === 'auto' && h > w * 1.1);
  const spreadW = single ? BOOK_PW : BOOK_PW * 2;
  const s = Math.min((w * (single ? 0.9 : 0.84)) / spreadW, (h * (single ? 0.68 : 0.84)) / BOOK_PH);
  const bx = (w - spreadW * s) / 2;
  const by = (h - BOOK_PH * s) / 2 + (w > h ? 0.03 : 0.02) * h + offsetY * h;
  return {single, s, bx, by, spreadW, page: {x: bx, y: by, w: BOOK_PW * s, h: BOOK_PH * s}};
};

const SERIF = () => x14Fonts.bookSerif;
const SERIF_I = () => x14Fonts.bookSerifItalic;

/** left page (page units): lesson text, equation box, key words, predict checklist, WHY? flap box */
const X3bLeftPage: X3bFC<{uid: string}> = ({uid}) => {
  const serif = SERIF();
  const it = SERIF_I();
  const T = (p: {x: number; y: number; size: number; children: X3bNode; fill?: string; weight?: number; italic?: boolean; ls?: number; anchor?: 'start' | 'middle' | 'end'; family?: string}) => (
    <text
      x={p.x}
      y={p.y}
      fontSize={p.size}
      fill={p.fill ?? INK3.body}
      fontWeight={p.weight ?? 400}
      fontFamily={p.family ?? (p.italic ? it : serif)}
      fontStyle={p.italic ? 'italic' : 'normal'}
      letterSpacing={p.ls ?? 0}
      textAnchor={p.anchor ?? 'start'}
    >
      {p.children}
    </text>
  );
  const terms: [string, string][] = [
    ['system', 'An object or group of objects.'],
    ['energy store', 'A way a system holds energy.'],
    ['pathway', 'How energy moves between stores.'],
    ['joule (J)', 'The unit of energy.'],
  ];
  return (
    <g>
      <T x={90} y={70} size={17} fill="#9A958C" ls={3}>
        ENERGY · LESSON 1
      </T>
      <T x={90} y={160} size={62} fill={INK3.heading} weight={600}>
        Energy stores
      </T>
      {['When something changes, energy moves from one', 'store to another. Energy is not a substance: the', 'stores are a model that helps us keep count.'].map((l, i) => (
        <T key={i} x={90} y={222 + i * 42} size={28}>
          {l}
        </T>
      ))}
      <rect x={90} y={350} width={820} height={108} fill="none" stroke="#CFC8BC" strokeWidth={2} rx={4} />
      <text x={130} y={410} fontSize={44} fontFamily={it} fontStyle="italic" fill={INK3.heading}>
        E<tspan fontSize={26} dy={10}>p</tspan>
        <tspan dy={-10}> = m g h</tspan>
      </text>
      <T x={130} y={442} size={19} fill="#7A766E" italic>
        gravitational energy = mass × field strength × height
      </T>
      <T x={90} y={510} size={17} fill={INK3.eyebrow} ls={3} weight={600}>
        KEY WORDS
      </T>
      {terms.map(([a, b], i) => (
        <text key={i} x={90} y={550 + i * 36} fontSize={24} fontFamily={serif} fill={INK3.body}>
          <tspan fontWeight={600} fill={INK3.heading}>
            {a}
          </tspan>
          <tspan> {b}</tspan>
        </text>
      ))}
      <T x={90} y={725} size={17} fill={INK3.eyebrow} ls={3} weight={600}>
        PREDICT
      </T>
      <T x={90} y={762} size={26} fill={INK3.heading}>
        The book slides off the shelf and lands. Where is
      </T>
      <T x={90} y={796} size={26} fill={INK3.heading}>
        its energy now?
      </T>
      {['It has been used up', 'In the thermal stores around it', 'Still in its gravitational store'].map((l, i) => (
        <g key={i}>
          <rect x={96} y={820 + i * 34} width={20} height={20} fill="none" stroke="#6E6A62" strokeWidth={1.6} rx={2} />
          <T x={132} y={837 + i * 34} size={23} italic>
            {l}
          </T>
        </g>
      ))}
      <g>
        <rect x={150} y={940} width={760} height={128} fill={INK3.flap} stroke="#CDC5B5" strokeWidth={2} />
        <rect x={150} y={1060} width={760} height={8} fill="#000" opacity={0.05} />
        <T x={180} y={976} size={17} fill="#B0372C" ls={2} weight={600}>
          WHY?
        </T>
        <T x={180} y={1016} size={31} fill={INK3.heading} weight={600}>
          Lift the flap to see the answer
        </T>
        <T x={180} y={1050} size={22} italic fill="#6A665E">
          …after you have made your prediction.
        </T>
        <text x={760} y={982} fontSize={28} fontFamily={x3bFonts.hand} fill={INK3.heading}>
          lift here
        </text>
        <path d="M800 994 C 820 1010, 838 1028, 858 1046 M858 1046 l-16 -2 M858 1046 l-2 -16" stroke={INK3.heading} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </g>
      <text x={90} y={1112} fontSize={26} fontFamily={x3bFonts.hand} fill="#55524C">
        Light every jar: find all eight stores.
      </text>
      <T x={90} y={1138} size={15} fill="#9A958C">
        4
      </T>
    </g>
  );
};

/** right page (page units): ink-line jar rack with two lit jars, sun icon, small objects, figure caption */
const X3bRightPage: X3bFC<{uid: string}> = ({uid}) => {
  const it = SERIF_I();
  const serif = SERIF();
  const shelves = [430, 720];
  const xs = [235, 405, 575, 745];
  const names = [
    ['gravitational', 'kinetic', 'thermal', 'elastic'],
    ['chemical', 'magnetic', 'electrostatic', 'nuclear'],
  ];
  const lit: Record<string, {c: string; l: number; v: string}> = {
    '0-0': {c: INK3.purple, l: 0.72, v: '15 J'},
    '0-2': {c: INK3.orange, l: 0.46, v: '6 J'},
  };
  const jw = 128;
  const jh = 200;
  const stroke = {stroke: INK3.ink, strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <g>
      {/* soft cast shadows (window light from upper left) */}
      <g opacity={0.16} filter={`url(#${uid}-soft)`}>
        <polygon points="150,450 900,450 990,560 240,560" fill="#000" />
        <polygon points="150,740 900,740 990,850 240,850" fill="#000" />
      </g>
      {/* rack frame */}
      <path d={`M120 140 V 760 M880 140 V 760 M120 140 L 150 118 M880 140 L 910 118 M150 118 V 735 M910 118 V 735`} {...stroke} />
      {shelves.map((y, k) => (
        <g key={k}>
          <polygon points={`120,${y} 880,${y} 910,${y - 22} 150,${y - 22}`} {...stroke} fill={INK3.paper} />
          <rect x={120} y={y} width={760} height={16} {...stroke} fill={INK3.paper} />
          <rect x={120} y={y + 16} width={760} height={44} fill={`url(#${uid}-hatch)`} opacity={0.55} />
        </g>
      ))}
      {shelves.map((y, k) =>
        xs.map((x, i) => {
          const key = `${k}-${i}`;
          const L = lit[key];
          const top = y - 22 - jh + 10;
          const base = y - 12;
          return (
            <g key={key}>
              {L ? (
                <g>
                  <circle cx={x} cy={base - jh * 0.4} r={jw * 1.4} fill={`url(#${uid}-glow-${key})`} />
                  <defs>
                    <radialGradient id={`${uid}-glow-${key}`}>
                      <stop offset="0" stopColor={L.c} stopOpacity={0.42} />
                      <stop offset="1" stopColor={L.c} stopOpacity={0} />
                    </radialGradient>
                    <linearGradient id={`${uid}-liq-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#ffffff" stopOpacity={0.55} />
                      <stop offset="0.25" stopColor={L.c} stopOpacity={0.95} />
                      <stop offset="1" stopColor={L.c} />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M${x - jw / 2 + 4} ${base - jh * L.l} V ${base} A ${jw / 2 - 4} 12 0 0 0 ${x + jw / 2 - 4} ${base} V ${base - jh * L.l} Z`}
                    fill={`url(#${uid}-liq-${key})`}
                  />
                  <ellipse cx={x} cy={base - jh * L.l} rx={jw / 2 - 4} ry={11} fill={L.c} opacity={0.75} />
                </g>
              ) : null}
              <ellipse cx={x} cy={top} rx={jw / 2} ry={14} {...stroke} />
              <ellipse cx={x} cy={top} rx={jw / 2 - 8} ry={9} stroke={INK3.ink} strokeWidth={1.2} fill="none" opacity={0.6} />
              <path d={`M${x - jw / 2} ${top} V ${base} A ${jw / 2} 13 0 0 0 ${x + jw / 2} ${base} V ${top}`} {...stroke} />
              <path d={`M${x + jw / 2 - 18} ${top + 24} V ${base - 14}`} stroke={INK3.ink} strokeWidth={1.2} opacity={0.35} />
              <rect x={x - 52} y={base - 70} width={104} height={50} fill="#F4F1EA" stroke={INK3.ink} strokeWidth={1.6} />
              <text x={x - 46} y={base - 56} fontSize={10} fontFamily={serif} fill="#55524C">
                {names[k][i]}
              </text>
              <text x={x - 44} y={base - 27} fontSize={22} fontFamily={x3bFonts.hand} fill={INK3.ink}>
                {L ? L.v : '0 J'}
              </text>
            </g>
          );
        }),
      )}
      {/* sun icon */}
      <g transform="translate(905 70)">
        <circle r={30} {...stroke} fill="#F7F5F0" />
        <path d="M-12 18 A 22 22 0 0 0 18 -10" stroke={INK3.ink} strokeWidth={1} fill="none" opacity={0.5} />
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={Math.cos(a) * 40} y1={Math.sin(a) * 40} x2={Math.cos(a) * 54} y2={Math.sin(a) * 54} {...stroke} strokeWidth={2} />;
        })}
      </g>
      {/* small objects */}
      <g>
        <g opacity={0.14} filter={`url(#${uid}-soft)`}>
          <ellipse cx={300} cy={968} rx={80} ry={16} fill="#000" />
          <ellipse cx={500} cy={968} rx={60} ry={14} fill="#000" />
          <ellipse cx={690} cy={968} rx={70} ry={14} fill="#000" />
          <ellipse cx={870} cy={968} rx={70} ry={12} fill="#000" />
        </g>
        {/* mug */}
        <path d="M200 860 V 950 A 55 14 0 0 0 310 950 V 860" {...stroke} fill={INK3.paper} />
        <ellipse cx={255} cy={860} rx={55} ry={14} {...stroke} fill="#E9E1D2" />
        <path d="M310 880 C 345 880, 345 935, 310 935" {...stroke} />
        <rect x={262} y={866} width={46} height={86} fill={`url(#${uid}-hatch)`} opacity={0.6} />
        <path d="M235 840 c -10 -14, 10 -22, 0 -38 M262 836 c -10 -14, 10 -22, 0 -38" {...stroke} strokeWidth={1.6} opacity={0.7} />
        {/* battery */}
        <rect x={470} y={846} width={64} height={110} rx={10} {...stroke} fill={INK3.paper} />
        <rect x={490} y={834} width={24} height={14} rx={3} {...stroke} fill={INK3.paper} />
        <rect x={506} y={850} width={26} height={104} fill={`url(#${uid}-hatch)`} opacity={0.6} />
        {/* ball */}
        <circle cx={690} cy={908} r={52} {...stroke} fill={INK3.paper} />
        <path d="M690 856 A 52 52 0 0 1 690 960 A 30 52 0 0 0 690 856" fill={`url(#${uid}-hatch)`} opacity={0.7} />
        {/* spring (coil on a base plate) */}
        <rect x={800} y={950} width={140} height={10} rx={3} {...stroke} fill={INK3.paper} />
        {Array.from({length: 8}, (_, i) => (
          <ellipse key={i} cx={822 + i * 14} cy={912} rx={9} ry={36} {...stroke} strokeWidth={1.8} />
        ))}
      </g>
      <text x={110} y={1046} fontSize={21} fontFamily={it} fontStyle="italic" fill="#6A665E">
        Fig. 1   Eight things, eight stores
      </text>
      <text x={110} y={1082} fontSize={25} fontFamily={it} fontStyle="italic" fill={INK3.body}>
        Tap each thing in the scene to light its jar.
      </text>
      <text x={900} y={1138} fontSize={15} fontFamily={serif} fill="#9A958C">
        5
      </text>
    </g>
  );
};

/**
 * Procedural backdrop of x3: a pale wood desk edge, teal felt mat with a window-light gobo, and an open
 * mustard hardback showing the "Energy stores" lesson spread (ink-line jar rack on the right page).
 * In portrait (mode auto) only the left (text) page is shown, larger. `zoom` = slow camera push about the centre.
 */
export const DeskBook: X3bFC<{uid?: string; mode?: BookMode; zoom?: number; offsetY?: number; style?: X3bCSS}> = ({uid = 'x3b', mode = 'auto', zoom = 1, offsetY = 0, style}) => {
  const {w, h, u} = x3bUseStage();
  const L = bookLayout(w, h, mode, offsetY);
  const {s, bx, by, spreadW, single} = L;
  const PW = BOOK_PW;
  const PH = BOOK_PH;
  const woodH = (w > h ? 0.13 : 0.07) * h;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', transform: `scale(${zoom})`, transformOrigin: '50% 50%', ...style}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${uid}-felt`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.9 / Math.max(0.5, u)} numOctaves={2} seed={4} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.18" />
            </feComponentTransfer>
          </filter>
          <filter id={`${uid}-blurBig`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={60 * u} />
          </filter>
          <filter id={`${uid}-blurMid`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={18 * u} />
          </filter>
          <filter id={`${uid}-soft`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation={9} />
          </filter>
          <pattern id={`${uid}-hatch`} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={7} stroke={INK3.ink} strokeWidth={1.3} />
          </pattern>
          <filter id={`${uid}-paperfib`}>
            <feTurbulence type="fractalNoise" baseFrequency={0.6} numOctaves={2} seed={9} />
          </filter>
          <linearGradient id={`${uid}-gutL`} x1="0" x2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.16} />
          </linearGradient>
          <linearGradient id={`${uid}-gutR`} x1="0" x2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0.14} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C7BDAD" />
            <stop offset="1" stopColor={INK3.wood} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={INK3.mat} />
        <rect width={w} height={h} filter={`url(#${uid}-felt)`} />
        {/* desk edge (wood) */}
        <rect width={w} height={woodH} fill={`url(#${uid}-wood)`} />
        {Array.from({length: 7}, (_, i) => (
          <path
            key={i}
            d={`M0 ${woodH * (0.12 + i * 0.13)} ${Array.from({length: 9}, (_, k) => `Q ${(w / 8) * (k + 0.5)} ${woodH * (0.12 + i * 0.13) + Math.sin(k * 1.7 + i) * 3 * u} ${(w / 8) * (k + 1)} ${woodH * (0.12 + i * 0.13)}`).join(' ')}`}
            stroke={INK3.woodGrain}
            strokeWidth={1.2 * u}
            fill="none"
            opacity={0.3}
          />
        ))}
        <rect y={woodH - 3 * u} width={w} height={6 * u} fill={INK3.woodShade} opacity={0.6} />
        {/* window gobo: a warm light band and soft mullion shadows */}
        <polygon points={`${w * 0.15},${-h * 0.1} ${w * 0.55},${-h * 0.1} ${w * 0.95},${h * 1.1} ${w * 0.55},${h * 1.1}`} fill="#FFF6E2" opacity={0.12} filter={`url(#${uid}-blurBig)`} />
        <polygon points={`${-w * 0.1},${h * 0.62} ${w * 0.18},${h * 1.1} ${-w * 0.1},${h * 1.1}`} fill="#000" opacity={0.22} filter={`url(#${uid}-blurBig)`} />
        <polygon points={`${w * 0.86},${h * 0.2} ${w * 1.1},${h * 0.05} ${w * 1.1},${h * 0.9}`} fill="#000" opacity={0.18} filter={`url(#${uid}-blurBig)`} />
        {/* book */}
        <rect x={bx + 14 * s} y={by + 26 * s} width={spreadW * s} height={PH * s} fill="#000" opacity={0.32} filter={`url(#${uid}-blurMid)`} />
        <g transform={`translate(${bx} ${by}) scale(${s})`}>
          <rect x={-18} y={-14} width={spreadW + 36} height={PH + 36} rx={12} fill={INK3.cloth} />
          <rect x={-18} y={PH + 10} width={spreadW + 36} height={12} rx={6} fill={INK3.clothSide} />
          <rect x={-4} y={PH - 2} width={spreadW + 8} height={14} fill="#E6DECE" />
          {[3, 7, 11].map((y) => (
            <line key={y} x1={0} x2={spreadW} y1={PH + y} y2={PH + y} stroke={INK3.pageEdge} strokeWidth={1.2} opacity={0.7} />
          ))}
          <rect x={0} y={0} width={spreadW} height={PH} fill={INK3.paper} />
          <rect x={0} y={0} width={spreadW} height={PH} filter={`url(#${uid}-paperfib)`} opacity={0.035} />
          <X3bLeftPage uid={uid} />
          {!single ? (
            <g transform={`translate(${PW} 0)`}>
              <X3bRightPage uid={uid} />
            </g>
          ) : null}
          <rect x={PW - 110} y={0} width={110} height={PH} fill={`url(#${uid}-gutL)`} />
          {!single ? <rect x={PW} y={0} width={110} height={PH} fill={`url(#${uid}-gutR)`} /> : null}
          {!single ? <rect x={PW - 9} y={PH - 30} width={18} height={110} fill={INK3.ribbon} /> : null}
        </g>
      </svg>
    </div>
  );
};

/**
 * Frosted glass panel (x3 cards / toolbar). If `frost` is given (the exact backdrop node behind the panel),
 * a blurred copy of it is clipped inside the panel — reliable in headless renders. Otherwise CSS
 * backdrop-filter is used (works over host content on the web).
 */
export const GlassPanel: X3bFC<{
  x: number;
  y: number;
  width: number;
  height?: number;
  radius: number;
  frost?: X3bNode;
  blur?: number;
  top?: string;
  bottom?: string;
  opacity?: number;
  style?: X3bCSS;
  children?: X3bNode;
}> = ({x, y, width, height, radius, frost, blur = 14, top = 'rgba(245,237,224,0.86)', bottom = 'rgba(203,210,203,0.58)', opacity = 1, style, children}) => {
  const {w, h, u} = x3bUseStage();
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        opacity,
        boxShadow: `0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.13), 0 ${1 * u}px ${3 * u}px rgba(0,0,0,0.08)`,
        backdropFilter: frost ? undefined : `blur(${blur * u}px) saturate(1.1)`,
        ...style,
      }}
    >
      {frost ? (
        <div style={{position: 'absolute', left: -x, top: -y, width: w, height: h, filter: `blur(${blur * u}px) saturate(1.1)`}}>{frost}</div>
      ) : null}
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${top} 0%, ${top} 35%, ${bottom} 100%)`}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 ${Math.max(1, u)}px rgba(255,255,255,0.42), inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.5)`}} />
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};

// ==== /X3b =================================================================================================

// ==== X4 (storybook gouache) ===============================================================================
// (imports aliased with an x4 prefix so other sections can import the same names without clashes)
import {useId as x4UseId, type FC as X4FC, type ReactNode as X4Node} from 'react';
import {rng as x4Rng} from './random';

/** x4 storybook-gouache palette (sampled from the source frames) */
export const SB = {
  ink: '#3E2A20',
  cream: '#F0DBB0',
  wall: '#DE9D61',
  paper: '#FDEBCB',
  wood: '#B88B5D',
  woodDark: '#8E6440',
  woodLight: '#D9AE7A',
  brick: '#C88760',
  brickDark: '#A3654A',
  brickLight: '#D69A72',
  plaster: '#DCC7A3',
  slate: '#959381',
  slateDark: '#76746A',
  stone: '#E6D8BC',
  stoneDark: '#C9B794',
  door: '#74756D',
  doorDark: '#55574F',
  sky: '#7AA8C9',
  skyLow: '#A2C1D2',
  cloud: '#E9DFC8',
  cloudLit: '#FBF5E6',
  foliage: '#41575B',
  sage: '#9FAE90',
  paving: '#DCC59D',
  pavingDark: '#B99E72',
  terracotta: '#C9714E',
  sweater: '#D2714E',
  sweaterShade: '#B5573A',
  cuff: '#C5613F',
  skin: '#E8C497',
  skinShade: '#D29E76',
  glow: '#F2C66E',
  glowCore: '#FFE7A8',
  glowEdge: '#E9A94A',
  glass: '#56656B',
  glassLit: '#7F9094',
  metal: '#9C9B8D',
  metalLight: '#C2C0AE',
  rail: '#5F7678',
  title: '#261F3D',
  cta: '#DF5142',
};

/** css-safe unique id for <defs> */
export const useX4Id = (prefix: string) => prefix + x4UseId().replace(/[^a-zA-Z0-9_-]/g, '');
const x4l = (a: number, b: number, t: number) => a + (b - a) * t;
const x4c = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
type X4P = [number, number];

/**
 * Gouache finish over a whole frame: fine paper speckle, blotchy pigment mottling, a warm multiply grade
 * and a soft warm-brown vignette. Put it last.
 */
export const GouacheFinish: X4FC<{w: number; h: number; grain?: number; mottle?: number; vignette?: number; warm?: number; seed?: number}> = ({
  w,
  h,
  grain = 1,
  mottle = 1,
  vignette = 0.16,
  warm = 0.06,
  seed = 4,
}) => {
  const id = useX4Id('x4fin');
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <defs>
        <filter id={`${id}g`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.16  0 0 0 0 0.11  2.6 0 0 0 -1.2" />
        </filter>
        <filter id={`${id}m`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${(2.2 / w).toFixed(5)} ${(2.2 / h).toFixed(5)}`} numOctaves={4} seed={seed + 3} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.27  0 0 0 0 0.15  1.8 0 0 0 -0.75" />
        </filter>
        <radialGradient id={`${id}v`} cx="50%" cy="46%" r="72%">
          <stop offset="0.55" stopColor={SB.ink} stopOpacity={0} />
          <stop offset="1" stopColor={SB.ink} stopOpacity={vignette} />
        </radialGradient>
      </defs>
      <rect width={w} height={h} filter={`url(#${id}m)`} opacity={0.22 * mottle} style={{mixBlendMode: 'multiply'}} />
      <rect width={w} height={h} filter={`url(#${id}g)`} opacity={0.2 * grain} style={{mixBlendMode: 'multiply'}} />
      <rect width={w} height={h} fill="#F6BE78" opacity={warm} style={{mixBlendMode: 'multiply'}} />
      <rect width={w} height={h} fill={`url(#${id}v)`} />
    </svg>
  );
};

/** soft diagonal window-light bands (screen-blended), shimmering very slightly */
export const SunShafts: X4FC<{w: number; h: number; frame: number; angle?: number; opacity?: number; seed?: number; x0?: number; count?: number}> = ({
  w,
  h,
  frame,
  angle = 32,
  opacity = 0.22,
  seed = 2,
  x0 = 0.05,
  count = 4,
}) => {
  const id = useX4Id('x4sun');
  const r = x4Rng(seed);
  const L = Math.hypot(w, h) * 1.6;
  const bands = Array.from({length: count}, (_, i) => ({x: x0 * w + (i * 0.16 + r() * 0.08) * w, bw: (0.05 + r() * 0.07) * Math.max(w, h), a: 0.6 + r() * 0.4, ph: r() * 6}));
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4DA" stopOpacity={1} />
          <stop offset="0.55" stopColor="#FFE9BE" stopOpacity={0.45} />
          <stop offset="1" stopColor="#FFE9BE" stopOpacity={0} />
        </linearGradient>
      </defs>
      {bands.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={-h * 0.2}
          width={b.bw}
          height={L}
          fill={`url(#${id})`}
          opacity={opacity * b.a * (0.9 + 0.1 * Math.sin(frame * 0.05 + b.ph))}
          transform={`rotate(${-angle} ${b.x} ${-h * 0.2})`}
        />
      ))}
    </svg>
  );
};

/**
 * Manga "emanata" action ticks: 3–5 short curved ink strokes fanning out from a point, redrawn with a
 * slightly different angle every `every` frames (on twos by default). Render inside an <svg>.
 */
export const ActionTicks: X4FC<{frame: number; x: number; y: number; size: number; dir?: number; spread?: number; count?: number; seed?: number; color?: string; width?: number; every?: number; opacity?: number}> = ({
  frame,
  x,
  y,
  size,
  dir = -90,
  spread = 70,
  count = 4,
  seed = 1,
  color = SB.ink,
  width = 2,
  every = 2,
  opacity = 1,
}) => {
  const k = Math.floor(frame / every);
  const r = x4Rng(seed * 131 + k * 977);
  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = ((dir + spread * ((i + 0.5) / count - 0.5) + (r() - 0.5) * spread * 0.22) * Math.PI) / 180;
    const r0 = size * (0.45 + r() * 0.25);
    const len = size * (0.32 + r() * 0.28);
    const p0: X4P = [x + Math.cos(a) * r0, y + Math.sin(a) * r0];
    const p1: X4P = [x + Math.cos(a) * (r0 + len), y + Math.sin(a) * (r0 + len)];
    const bend = len * 0.22 * (r() - 0.5) * 2;
    const c: X4P = [(p0[0] + p1[0]) / 2 - Math.sin(a) * bend, (p0[1] + p1[1]) / 2 + Math.cos(a) * bend];
    paths.push(`M${p0[0].toFixed(1)},${p0[1].toFixed(1)} Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`);
  }
  return (
    <g stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" opacity={opacity}>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
};

/** a storybook cassette (top view, 100×64 local), centred at x,y; `squash` < 1 lays it down in perspective */
export const Cassette: X4FC<{x: number; y: number; w: number; body?: string; label?: string; band?: string; rot?: number; squash?: number; ink?: string; lw?: number; opacity?: number}> = ({
  x,
  y,
  w,
  body = '#7C6E8A',
  label = '#F3E7CF',
  band = '#D2714E',
  rot = 0,
  squash = 1,
  ink = SB.ink,
  lw = 1.5,
  opacity = 1,
}) => {
  const k = w / 100;
  const st = {stroke: ink, strokeWidth: lw, vectorEffect: 'non-scaling-stroke' as const};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k} ${k * squash}) translate(-50 -32)`} opacity={opacity}>
      <rect x={0} y={0} width={100} height={64} rx={6} fill={body} {...st} />
      <rect x={3} y={3} width={94} height={8} rx={3} fill="#FFFFFF" opacity={0.14} />
      <rect x={8} y={8} width={84} height={30} rx={3} fill={label} {...st} />
      <rect x={8} y={27} width={84} height={6} fill={band} opacity={0.9} />
      <line x1={14} y1={15} x2={60} y2={15} stroke={ink} strokeWidth={0.8} vectorEffect="non-scaling-stroke" opacity={0.5} />
      <rect x={27} y={14} width={46} height={14} rx={7} fill="#3A322C" {...st} />
      {[38, 62].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={21} r={5} fill="#EFE6D4" />
          <circle cx={cx} cy={21} r={2} fill="#3A322C" />
        </g>
      ))}
      <path d="M22,64 L28,50 L72,50 L78,64 Z" fill="#000" opacity={0.18} />
      <path d="M22,64 L28,50 L72,50 L78,64" fill="none" {...st} />
      {[
        [6, 6],
        [94, 6],
        [6, 58],
        [94, 58],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.6} fill={ink} opacity={0.6} />
      ))}
    </g>
  );
};

/** perspective cobblestone paving from `top` to the bottom of the frame */
export const Cobbles: X4FC<{w: number; h: number; top: number; s: number; seed?: number; base?: string; line?: string}> = ({w, h, top, s, seed = 9, base = SB.paving, line = SB.pavingDark}) => {
  const id = useX4Id('x4cob');
  const r = x4Rng(seed);
  const stones: {x: number; y: number; rx: number; ry: number; t: number; rot: number}[] = [];
  let y = top + 4 * s;
  let row = 0;
  while (y < h + 40 * s && row < 60) {
    const t = x4c((y - top) / Math.max(1, h - top));
    const rx = x4l(9, 40, t) * s;
    const ry = rx * x4l(0.42, 0.62, t);
    const off = (row % 2) * rx;
    for (let x = -rx + off; x < w + rx; x += rx * 2.15) stones.push({x: x + (r() - 0.5) * rx * 0.4, y: y + (r() - 0.5) * ry * 0.3, rx: rx * (0.82 + r() * 0.3), ry: ry * (0.8 + r() * 0.35), t: r(), rot: (r() - 0.5) * 18});
    y += ry * 2.05;
    row++;
  }
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6D3AE" />
          <stop offset="0.5" stopColor={base} />
          <stop offset="1" stopColor="#C9AC80" />
        </linearGradient>
      </defs>
      <rect x={0} y={top} width={w} height={h - top + 2} fill={`url(#${id})`} />
      {stones.map((c, i) => (
        <ellipse
          key={i}
          cx={c.x}
          cy={c.y}
          rx={c.rx}
          ry={c.ry}
          transform={`rotate(${c.rot} ${c.x} ${c.y})`}
          fill={c.t < 0.33 ? '#E5D2AE' : c.t < 0.66 ? '#DCC59F' : '#D5BC93'}
          stroke={line}
          strokeWidth={Math.max(0.6, 1.1 * s)}
          strokeOpacity={0.38}
        />
      ))}
    </g>
  );
};

/** one gouache cloud (no outline): a cluster of discs with a lit top and a soft shaded base */
export const GouacheCloud: X4FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  const blobs: [number, number, number][] = [
    [-70, 6, 34],
    [-34, -16, 44],
    [10, -26, 50],
    [56, -10, 40],
    [88, 8, 28],
    [16, 10, 42],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {blobs.map(([bx, by, br], i) => (
        <circle key={'s' + i} cx={bx + 4} cy={by + 8} r={br} fill="#CFC4AE" />
      ))}
      {blobs.map(([bx, by, br], i) => (
        <circle key={'b' + i} cx={bx} cy={by} r={br} fill={SB.cloud} />
      ))}
      {blobs.map(([bx, by, br], i) => (
        <circle key={'l' + i} cx={bx - br * 0.15} cy={by - br * 0.22} r={br * 0.68} fill={SB.cloudLit} opacity={0.75} />
      ))}
    </g>
  );
};

/**
 * Storybook sky + distant hill town (Mediterranean roofs, cypresses, a bell tower), drawn full width.
 * `horizon` = y of the town's ground line. Clouds drift with the frame.
 */
export const StoryTown: X4FC<{w: number; h: number; horizon: number; s: number; frame: number; seed?: number; drift?: number; ink?: string}> = ({
  w,
  h,
  horizon,
  s,
  frame,
  seed = 3,
  drift = 0.25,
  ink = SB.ink,
}) => {
  const id = useX4Id('x4sky');
  const r = x4Rng(seed);
  const clouds = Array.from({length: 5}, (_, i) => ({x: ((i + 0.2 + r() * 0.5) / 5) * w, y: (0.06 + r() * 0.2) * horizon + 0.04 * h, sc: (0.7 + r() * 0.6) * s}));
  const hill = (amp: number, base: number, ph: number) => {
    let d = `M0,${h} L0,${base}`;
    for (let x = 0; x <= w + 20; x += 20 * s) d += ` L${x.toFixed(1)},${(base - amp * (0.55 + 0.3 * Math.sin(x / (230 * s) + ph) + 0.15 * Math.sin(x / (97 * s) + ph * 2))).toFixed(1)}`;
    return d + ` L${w},${h} Z`;
  };
  const houses: {x: number; y: number; hw: number; hh: number; roof: number; c: number}[] = [];
  for (let x = -20 * s; x < w + 40 * s; ) {
    const hw = (26 + r() * 30) * s;
    const hh = (22 + r() * 34) * s;
    houses.push({x, y: horizon - r() * 26 * s, hw, hh, roof: 10 + r() * 10, c: r()});
    x += hw * (0.75 + r() * 0.4);
  }
  const cypress = Array.from({length: Math.round(w / (90 * s))}, () => ({x: r() * w, hgt: (50 + r() * 60) * s, y: horizon - r() * 18 * s}));
  const tower = {x: w * (0.16 + r() * 0.1), y: horizon - 30 * s};
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SB.sky} />
          <stop offset="1" stopColor={SB.skyLow} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={horizon + 40 * s} fill={`url(#${id})`} />
      {clouds.map((c, i) => (
        <GouacheCloud key={i} x={((c.x + frame * drift * s * (0.6 + i * 0.15)) % (w + 300 * s)) - 100 * s} y={c.y} s={c.sc} />
      ))}
      <path d={hill(70 * s, horizon - 40 * s, seed)} fill="#B5BFA6" />
      <path d={hill(46 * s, horizon - 14 * s, seed + 2)} fill={SB.sage} />
      {/* bell tower */}
      <g transform={`translate(${tower.x} ${tower.y})`} stroke={ink} strokeWidth={Math.max(0.7, 1.1 * s)} strokeOpacity={0.55}>
        <rect x={-14 * s} y={-110 * s} width={28 * s} height={110 * s} fill="#E7D9BD" />
        <path d={`M${-18 * s},${-110 * s} L0,${-150 * s} L${18 * s},${-110 * s} Z`} fill={SB.terracotta} />
        <rect x={-5 * s} y={-96 * s} width={10 * s} height={16 * s} rx={5 * s} fill="#5D5A55" />
      </g>
      {houses.map((hs, i) => (
        <g key={i} stroke={ink} strokeWidth={Math.max(0.6, 0.9 * s)} strokeOpacity={0.5}>
          <rect x={hs.x} y={hs.y - hs.hh} width={hs.hw} height={hs.hh + 30 * s} fill={hs.c < 0.5 ? '#ECDDC2' : '#E3CDA9'} />
          <path d={`M${hs.x - 3 * s},${hs.y - hs.hh} L${hs.x + hs.hw / 2},${hs.y - hs.hh - hs.roof * s} L${hs.x + hs.hw + 3 * s},${hs.y - hs.hh} Z`} fill={hs.c < 0.3 ? '#B9654A' : SB.terracotta} />
          <rect x={hs.x + hs.hw * 0.3} y={hs.y - hs.hh * 0.6} width={5 * s} height={8 * s} fill="#6F6A60" stroke="none" />
          {hs.hw > 40 * s && <rect x={hs.x + hs.hw * 0.65} y={hs.y - hs.hh * 0.6} width={5 * s} height={8 * s} fill="#6F6A60" stroke="none" />}
        </g>
      ))}
      {cypress.map((c, i) => (
        <ellipse key={i} cx={c.x} cy={c.y - c.hgt / 2} rx={c.hgt * 0.14} ry={c.hgt / 2} fill={SB.foliage} opacity={0.92} />
      ))}
    </g>
  );
};

/** window geometry of the procedural workshop (local units, origin = base centre, y up is negative) */
export const WORKSHOP_WINDOWS: {x: number; y: number; w: number; h: number; shape: 'arch' | 'round' | 'rect'}[] = [
  {x: -356, y: -178, w: 54, h: 122, shape: 'arch'},
  {x: -218, y: -240, w: 72, h: 180, shape: 'arch'},
  {x: -34, y: -526, w: 68, h: 68, shape: 'round'},
  {x: 146, y: -240, w: 72, h: 180, shape: 'arch'},
  {x: 302, y: -252, w: 62, h: 196, shape: 'arch'},
  {x: 432, y: -252, w: 62, h: 196, shape: 'arch'},
];

export const windowPath = (x: number, y: number, w: number, h: number, shape: 'arch' | 'round' | 'rect') => {
  if (shape === 'round') {
    const r = Math.min(w, h) / 2;
    return `M${x + w / 2 - r},${y + h / 2} A${r},${r} 0 1 1 ${x + w / 2 + r},${y + h / 2} A${r},${r} 0 1 1 ${x + w / 2 - r},${y + h / 2} Z`;
  }
  if (shape === 'rect') return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  return `M${x},${y + h} V${y + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w},${y + w / 2} V${y + h} Z`;
};

/** screen-space geometry of a workshop placed at (x, y) with scale s */
export const workshopGeo = (x: number, y: number, s: number) => ({
  windows: WORKSHOP_WINDOWS.map((wi) => ({x: x + wi.x * s, y: y + wi.y * s, w: wi.w * s, h: wi.h * s, shape: wi.shape})),
  door: {x0: x - 100 * s, x1: x + 100 * s, top: y - 290 * s, base: y},
  hopper: {x: x - 168 * s, y: y - 672 * s},
  chimney: {x: x + 325 * s, y: y - 660 * s},
  width: 1050 * s,
  left: x - 505 * s,
  right: x + 545 * s,
  top: y - 820 * s,
});

const x4Gear = (r: number, teeth: number) => {
  let d = '';
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.8;
    const p0: X4P = [Math.cos(a0 + 0.06) * rr, Math.sin(a0 + 0.06) * rr];
    const p1: X4P = [Math.cos(a1 - 0.06) * rr, Math.sin(a1 - 0.06) * rr];
    d += `${i === 0 ? 'M' : 'L'}${p0[0].toFixed(1)},${p0[1].toFixed(1)} L${p1[0].toFixed(1)},${p1[1].toFixed(1)} `;
  }
  return d + 'Z';
};

/**
 * Procedural storybook workshop (original design): brick gabled hall with a big arched double door and a
 * blank plaque, a plastered lean-to, a hipped right wing, a brick tower crowned with a turning cog, and a
 * metal hopper on the roof. Six windows (left → right) light with `glow[i]` 0..1; `doorOpen` 0..1 swings the
 * leaves out toward the viewer; `smoke` puffs from the tower. Render inside an <svg> in px coords.
 */
export const Workshop: X4FC<{
  x: number;
  y: number;
  s: number;
  frame: number;
  lw: number;
  glow?: number[];
  doorOpen?: number;
  sign?: string;
  signFont?: string;
  gearAngle?: number;
  smoke?: number;
  ink?: string;
  brick?: string;
  glowColor?: string;
  breathe?: number;
}> = ({x, y, s, frame, lw, glow = [], doorOpen = 0, sign = '', signFont = 'serif', gearAngle = 0, smoke = 0, ink = SB.ink, brick = SB.brick, glowColor = SB.glow, breathe = 0}) => {
  const id = useX4Id('x4ws');
  const sw = lw / s;
  const st = {stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const};
  const g = (i: number) => x4c(glow[i] ?? 0);
  // door leaves
  const th = (doorOpen * 104 * Math.PI) / 180;
  const leaf = (sign: number) => {
    const pts: X4P[] = [];
    const proj = (lx: number, ly: number): X4P => {
      const persp = 1 + 0.08 * Math.sin(th) * (lx / 100);
      const X = -100 + lx * Math.cos(th) - 0.1 * Math.sin(th) * lx;
      const Y = -150 + (ly + 150) * persp;
      return [X * sign, Y];
    };
    pts.push(proj(0, 0), proj(0, -190));
    for (let k = 1; k <= 8; k++) {
      const a = Math.PI - (k / 8) * (Math.PI / 2);
      const px = 100 * Math.cos(a);
      const py = -190 - 100 * Math.sin(a);
      pts.push(proj(px + 100, py));
    }
    pts.push(proj(100, 0));
    const planks = [25, 50, 75].map((lx) => {
      const top = -190 - Math.sqrt(Math.max(0, 100 * 100 - (100 - lx) * (100 - lx)));
      const a = proj(lx, -4);
      const b = proj(lx, top + 4);
      return `M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    });
    const straps = [-40, -160].map((ly) => {
      const a = proj(2, ly);
      const b = proj(58, ly);
      return `M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    });
    const back = Math.cos(th) < 0;
    return (
      <g key={sign}>
        <path d={'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + ' Z'} fill={back ? SB.doorDark : SB.door} {...st} />
        <path d={planks.join(' ')} stroke={ink} strokeWidth={sw * 0.6} opacity={0.45} />
        <path d={straps.join(' ')} stroke="#2E2A26" strokeWidth={7} strokeLinecap="round" opacity={0.75} />
      </g>
    );
  };
  // smoke puffs from the tower
  const puffs = smoke
    ? Array.from({length: 7}, (_, i) => {
        const period = 84;
        const age = (((frame + (i * period) / 7) % period) + period) % period;
        const t = age / period;
        return {x: 325 + 40 * t + 14 * Math.sin(t * 5 + i), y: -680 - 260 * t, r: 18 + 46 * t, o: smoke * 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.15))};
      })
    : [];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <pattern id={`${id}b`} patternUnits="userSpaceOnUse" width={120} height={48}>
          <rect width={120} height={48} fill={brick} />
          <rect x={30} y={0} width={30} height={12} fill={SB.brickLight} opacity={0.55} />
          <rect x={75} y={12} width={30} height={12} fill={SB.brickDark} opacity={0.35} />
          <rect x={0} y={24} width={30} height={12} fill={SB.brickDark} opacity={0.3} />
          <rect x={60} y={36} width={30} height={12} fill={SB.brickLight} opacity={0.5} />
          <path d="M0,12 H120 M0,24 H120 M0,36 H120 M0,48 H120 M30,0 V12 M60,0 V12 M90,0 V12 M15,12 V24 M45,12 V24 M75,12 V24 M105,12 V24 M0,24 V36 M30,24 V36 M60,24 V36 M90,24 V36 M15,36 V48 M45,36 V48 M75,36 V48 M105,36 V48" stroke={SB.brickDark} strokeWidth={1.4} opacity={0.6} fill="none" />
        </pattern>
        <linearGradient id={`${id}wash`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#FFF3D8" stopOpacity={0.18} />
          <stop offset="0.5" stopColor="#FFF3D8" stopOpacity={0} />
          <stop offset="1" stopColor="#3E2A20" stopOpacity={0.16} />
        </linearGradient>
        <linearGradient id={`${id}in`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E1713" />
          <stop offset="1" stopColor="#4A3A2C" />
        </linearGradient>
        <radialGradient id={`${id}lit`} cx="50%" cy="60%" r="65%">
          <stop offset="0" stopColor={SB.glowCore} />
          <stop offset="1" stopColor={SB.glowEdge} />
        </radialGradient>
        <linearGradient id={`${id}gl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SB.glassLit} />
          <stop offset="0.45" stopColor={SB.glass} />
          <stop offset="1" stopColor="#46535A" />
        </linearGradient>
        <linearGradient id={`${id}met`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={SB.metalLight} />
          <stop offset="0.5" stopColor={SB.metal} />
          <stop offset="1" stopColor="#7C7B6E" />
        </linearGradient>
        <filter id={`${id}blur`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={16} />
        </filter>
        <filter id={`${id}puff`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
        <filter id={`${id}sh`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {/* contact shadow */}
      <ellipse cx={30} cy={8} rx={590} ry={30} fill={ink} opacity={0.18} filter={`url(#${id}sh)`} />
      {/* smoke behind */}
      <g filter={`url(#${id}puff)`}>
        {puffs.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#F7F1E6" opacity={Math.max(0, p.o * 1.3)} />
        ))}
      </g>
      {/* tower + cog */}
      <path d="M285,-300 L292,-640 L358,-640 L365,-300 Z" fill={`url(#${id}b)`} {...st} />
      <path d="M285,-300 L292,-640 L358,-640 L365,-300 Z" fill={`url(#${id}wash)`} />
      <rect x={280} y={-662} width={90} height={24} rx={4} fill={SB.stone} {...st} />
      <g transform={`translate(325 -738) rotate(${gearAngle})`}>
        <path d={x4Gear(74, 10)} fill={`url(#${id}met)`} {...st} />
        <circle r={44} fill="none" stroke={ink} strokeWidth={sw} />
        {Array.from({length: 5}, (_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 28} cy={Math.sin(a) * 28} r={11} fill="#5B5A50" stroke={ink} strokeWidth={sw * 0.8} />;
        })}
        <circle r={9} fill={SB.metalLight} stroke={ink} strokeWidth={sw} />
      </g>
      <path d="M318,-662 L332,-662 L330,-692 L320,-692 Z" fill="#6A685C" {...st} />
      {/* hopper on the roof */}
      <path d="M-196,-520 L-196,-430 M-140,-520 L-140,-430 M-200,-470 L-136,-500" stroke={SB.slateDark} strokeWidth={9} strokeLinecap="round" />
      <rect x={-188} y={-565} width={40} height={60} fill={`url(#${id}met)`} {...st} />
      <path d="M-262,-660 L-74,-660 L-140,-560 L-196,-560 Z" fill={`url(#${id}met)`} {...st} />
      <ellipse cx={-168} cy={-660} rx={94} ry={16} fill="#6E6D62" {...st} />
      <path d="M-240,-650 L-180,-570" stroke="#FFFFFF" strokeWidth={6} opacity={0.25} strokeLinecap="round" />
      {/* left lean-to */}
      <path d="M-482,0 L-482,-212 L-250,-286 L-250,0 Z" fill={SB.plaster} {...st} />
      <path d="M-482,0 L-482,-212 L-250,-286 L-250,0 Z" fill={`url(#${id}wash)`} />
      <path d="M-250,-306 L-508,-222 L-508,-200 L-250,-284 Z" fill={SB.slate} {...st} />
      <rect x={-452} y={-150} width={58} height={150} fill={SB.door} {...st} />
      <path d="M-438,-140 V-6 M-423,-140 V-6 M-408,-140 V-6" stroke={ink} strokeWidth={sw * 0.6} opacity={0.4} />
      {/* right wing */}
      <rect x={262} y={-300} width={270} height={300} fill={`url(#${id}b)`} {...st} />
      <rect x={262} y={-300} width={270} height={300} fill={`url(#${id}wash)`} />
      <path d="M244,-296 L550,-296 L506,-378 L288,-378 Z" fill={SB.slate} {...st} />
      <path d="M288,-378 L506,-378" stroke={ink} strokeWidth={sw} />
      <path d="M262,-330 L262,-296" stroke={ink} strokeWidth={sw} />
      {/* main hall + gable */}
      <path d="M-265,0 V-335 L0,-575 L265,-335 V0 Z" fill={`url(#${id}b)`} {...st} />
      <path d="M-265,0 V-335 L0,-575 L265,-335 V0 Z" fill={`url(#${id}wash)`} />
      {/* quoins */}
      {Array.from({length: 11}, (_, i) => (
        <g key={i}>
          <rect x={-265} y={-30 - i * 30} width={i % 2 ? 22 : 34} height={28} fill={SB.stone} stroke={ink} strokeWidth={sw * 0.6} />
          <rect x={i % 2 ? 243 : 231} y={-30 - i * 30} width={i % 2 ? 22 : 34} height={28} fill={SB.stoneDark} stroke={ink} strokeWidth={sw * 0.6} />
        </g>
      ))}
      {/* bargeboards (slate rakes) */}
      <path d="M-298,-318 L0,-598 L298,-318" fill="none" stroke={ink} strokeWidth={36} strokeLinejoin="miter" />
      <path d="M-298,-318 L0,-598 L298,-318" fill="none" stroke={SB.slate} strokeWidth={36 - 2 * sw} strokeLinejoin="miter" />
      <path d="M-290,-326 L0,-588" fill="none" stroke="#B5B3A0" strokeWidth={6} opacity={0.6} />
      {/* plaque */}
      <rect x={-162} y={-432} width={324} height={86} rx={16} fill="#EFE2C4" {...st} />
      <rect x={-150} y={-421} width={300} height={64} rx={10} fill="none" stroke={ink} strokeWidth={sw * 0.7} opacity={0.6} />
      {sign ? (
        <text x={0} y={-376} textAnchor="middle" dominantBaseline="middle" fontFamily={signFont} fontSize={sign.length > 10 ? 300 / sign.length : 36} fill={ink} letterSpacing={2}>
          {sign}
        </text>
      ) : null}
      {/* windows */}
      {WORKSHOP_WINDOWS.map((wi, i) => {
        const d = windowPath(wi.x, wi.y, wi.w, wi.h, wi.shape);
        const surround = windowPath(wi.x - 9, wi.y - 9, wi.w + 18, wi.h + 14, wi.shape);
        const gi = g(i) * (1 + breathe * 0.06 * Math.sin(frame * 0.13 + i * 1.7));
        const cxw = wi.x + wi.w / 2;
        return (
          <g key={i}>
            {wi.shape !== 'round' && <path d={surround} fill={SB.stone} {...st} />}
            {wi.shape === 'round' && <circle cx={cxw} cy={wi.y + wi.h / 2} r={wi.w / 2 + 10} fill={SB.stone} {...st} />}
            <path d={d} fill={`url(#${id}gl)`} />
            <path d={d} fill={`url(#${id}lit)`} opacity={x4c(gi)} />
            {wi.shape === 'round' ? (
              <path d={`M${cxw},${wi.y} V${wi.y + wi.h} M${wi.x},${wi.y + wi.h / 2} H${wi.x + wi.w}`} stroke={ink} strokeWidth={sw * 0.9} />
            ) : (
              <path
                d={`M${cxw},${wi.y + 4} V${wi.y + wi.h} M${wi.x},${wi.y + wi.h * 0.5} H${wi.x + wi.w} M${wi.x},${wi.y + wi.h * 0.76} H${wi.x + wi.w} M${wi.x},${wi.y + wi.w / 2} H${wi.x + wi.w}`}
                stroke={ink}
                strokeWidth={sw * 0.9}
              />
            )}
            <path d={d} fill="none" {...st} />
            {wi.shape !== 'round' && <rect x={wi.x - 12} y={wi.y + wi.h} width={wi.w + 24} height={10} fill={SB.stone} {...st} />}
          </g>
        );
      })}
      {/* door */}
      <path d={windowPath(-116, -306, 232, 306, 'arch')} fill={SB.stone} {...st} />
      <path d={windowPath(-100, -290, 200, 290, 'arch')} fill={`url(#${id}in)`} {...st} />
      {doorOpen > 0.02 && <ellipse cx={0} cy={-6} rx={80} ry={10} fill={SB.glowEdge} opacity={0.18 * doorOpen} />}
      {leaf(1)}
      {leaf(-1)}
      {/* base course */}
      <rect x={-508} y={-16} width={1056} height={16} fill={SB.stoneDark} {...st} />
      {/* bloom (screen) */}
      <g style={{mixBlendMode: 'screen'}} filter={`url(#${id}blur)`}>
        {WORKSHOP_WINDOWS.map((wi, i) => {
          const gi = g(i) * (1 + breathe * 0.08 * Math.sin(frame * 0.13 + i * 1.7));
          if (gi <= 0.01) return null;
          return (
            <g key={i} opacity={0.75 * gi}>
              <path d={windowPath(wi.x - 6, wi.y - 6, wi.w + 12, wi.h + 12, wi.shape)} fill={glowColor} />
              {wi.shape !== 'round' && <ellipse cx={wi.x + wi.w / 2} cy={wi.y + wi.h + 18} rx={wi.w * 0.9} ry={18} fill={glowColor} opacity={0.6} />}
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** gouache shrub (clustered leaf blobs, darker base, lit top) sitting on (x, y); optional stone planter */
export const Shrub: X4FC<{x: number; y: number; s: number; seed?: number; planter?: boolean; frame?: number; ink?: string; lw?: number}> = ({x, y, s, seed = 1, planter = false, frame = 0, ink = SB.ink, lw = 1.5}) => {
  const r = x4Rng(seed * 77 + 5);
  const blobs = Array.from({length: 11}, (_, i) => {
    const a = Math.PI * (0.05 + 0.9 * r());
    const d = 30 + r() * 40;
    return {x: Math.cos(a) * d * 1.3 * (r() > 0.5 ? 1 : -1), y: -Math.sin(a) * d - 30, r: 26 + r() * 18, i};
  });
  const sway = Math.sin(frame * 0.05 + seed) * 1.5;
  const base = planter ? -44 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {planter && <path d="M-70,-46 L70,-46 L60,0 L-60,0 Z" fill={SB.stone} stroke={ink} strokeWidth={lw / s} strokeLinejoin="round" />}
      <g transform={`translate(0 ${base}) rotate(${sway} 0 0)`}>
        {blobs.map((b) => (
          <circle key={'d' + b.i} cx={b.x} cy={b.y + 6} r={b.r} fill="#3F5A48" />
        ))}
        {blobs.map((b) => (
          <circle key={'m' + b.i} cx={b.x} cy={b.y} r={b.r * 0.86} fill="#5B7A58" />
        ))}
        {blobs.map((b) => (
          <circle key={'l' + b.i} cx={b.x - b.r * 0.25} cy={b.y - b.r * 0.3} r={b.r * 0.45} fill="#86A06D" opacity={0.8} />
        ))}
      </g>
    </g>
  );
};

/** a cream plastered house corner framing the street at the left or right frame edge, with a lantern */
export const SideHouse: X4FC<{side: 'left' | 'right'; w: number; h: number; ground: number; s: number; lw: number; frame?: number; lamp?: boolean; ink?: string}> = ({side, w, h, ground, s, lw, frame = 0, lamp = true, ink = SB.ink}) => {
  const W = 150 * s;
  const sg = side === 'left' ? 1 : -1;
  const x0 = side === 'left' ? 0 : w;
  const X = (v: number) => x0 + sg * v;
  const st = {stroke: ink, strokeWidth: lw};
  const roofY = Math.max(-10, ground - 620 * s);
  const sway = Math.sin(frame * 0.06) * 2;
  return (
    <g>
      <path d={`M${X(-10)},${h} L${X(-10)},${roofY} L${X(W)},${roofY + 20 * s} L${X(W)},${h} Z`} fill="#E8D7B6" {...st} />
      <path d={`M${X(-10)},${roofY - 30 * s} L${X(W + 36 * s)},${roofY + 6 * s} L${X(W + 36 * s)},${roofY + 34 * s} L${X(-10)},${roofY} Z`} fill={SB.terracotta} {...st} />
      <rect x={Math.min(X(30 * s), X(96 * s))} y={roofY + 110 * s} width={66 * s} height={120 * s} fill={SB.glass} {...st} />
      <rect x={Math.min(X(14 * s), X(30 * s))} y={roofY + 104 * s} width={16 * s} height={132 * s} fill="#5F7F78" {...st} />
      <rect x={Math.min(X(96 * s), X(112 * s))} y={roofY + 104 * s} width={16 * s} height={132 * s} fill="#5F7F78" {...st} />
      <rect x={Math.min(X(20 * s), X(106 * s))} y={roofY + 236 * s} width={86 * s} height={14 * s} fill={SB.stone} {...st} />
      <path d={`M${X(-10)},${ground - 40 * s} L${X(W)},${ground - 40 * s}`} stroke={ink} strokeWidth={lw} opacity={0.6} />
      <rect x={Math.min(X(-10), X(W))} y={ground - 40 * s} width={W + 10} height={40 * s + (h - ground)} fill="#CDB792" opacity={0.6} />
      {lamp && (
        <g transform={`rotate(${sway * 0.3} ${X(W)} ${ground - 380 * s})`}>
          <path d={`M${X(W)},${ground - 380 * s} H${X(W + 70 * s)} M${X(W + 10 * s)},${ground - 380 * s} Q${X(W + 40 * s)},${ground - 420 * s} ${X(W + 64 * s)},${ground - 392 * s}`} stroke="#2E2A26" strokeWidth={5 * s} fill="none" strokeLinecap="round" />
          <g transform={`translate(${X(W + 70 * s)} ${ground - 380 * s}) rotate(${sway})`}>
            <path d={`M0,0 V${14 * s}`} stroke="#2E2A26" strokeWidth={3 * s} />
            <path d={`M${-16 * s},${14 * s} L${16 * s},${14 * s} L${12 * s},${62 * s} L${-12 * s},${62 * s} Z`} fill="#F6E3B0" opacity={0.92} stroke="#2E2A26" strokeWidth={3 * s} />
            <path d={`M${-20 * s},${14 * s} L0,${0} L${20 * s},${14 * s} Z`} fill="#2E2A26" />
            <rect x={-14 * s} y={60 * s} width={28 * s} height={7 * s} fill="#2E2A26" />
          </g>
        </g>
      )}
    </g>
  );
};

/**
 * The "creator hand": a giant right hand + forearm in a chunky ribbed sweater, drawn in storybook ink.
 * (px, py) is the pinch point (where a held card sits); the sleeve runs straight to the off-screen anchor
 * (ax, ay) so it stretches naturally. `pose` 0 = pinch (holding), 1 = open. Arms coming from the left are
 * mirrored (left hand). `size` ≈ hand length in px. Render inside an <svg>; draw held props BEFORE it.
 */
export const CreatorArm: X4FC<{
  px: number;
  py: number;
  ax: number;
  ay: number;
  size: number;
  pose?: number;
  lw?: number;
  sleeve?: string;
  sleeveShade?: string;
  cuff?: string;
  skin?: string;
  skinShade?: string;
  ink?: string;
}> = ({px, py, ax, ay, size, pose = 0, lw = 2, sleeve = SB.sweater, sleeveShade = SB.sweaterShade, cuff = SB.cuff, skin = SB.skin, skinShade = SB.skinShade, ink = SB.ink}) => {
  const k = size / 100;
  const ang = (Math.atan2(ay - py, ax - px) * 180) / Math.PI;
  const flip = ax < px;
  const L = Math.hypot(ax - px, ay - py) / k - 88 + 80;
  const sw = lw / k;
  const P = (a: X4P[], b: X4P[]) => a.map((p, i) => [x4l(p[0], b[i][0], pose), x4l(p[1], b[i][1], pose)] as X4P);
  const fingers: {pts: X4P[]; w: number}[] = [
    {pts: P([[-54, 12], [-64, 18], [-60, 25]], [[-54, 12], [-80, 18], [-94, 22]]), w: 12},
    {pts: P([[-56, 0], [-69, 4], [-65, 13]], [[-56, 0], [-88, 2], [-104, 6]]), w: 14},
    {pts: P([[-56, -14], [-72, -10], [-69, 0]], [[-56, -14], [-90, -14], [-108, -10]]), w: 15},
  ];
  const index = {pts: P([[-50, -26], [-80, -18], [-89, -3]], [[-50, -26], [-84, -30], [-104, -27]]), w: 15};
  const thumb = {pts: P([[-22, 20], [-62, 22], [-86, 7]], [[-22, 20], [-56, 34], [-78, 42]]), w: 17};
  const fd = (pts: X4P[]) => `M${pts[0][0]},${pts[0][1]} Q${pts[1][0]},${pts[1][1]} ${pts[2][0]},${pts[2][1]}`;
  const finger = (f: {pts: X4P[]; w: number}, key: string) => (
    <g key={key}>
      <path d={fd(f.pts)} stroke={ink} strokeWidth={f.w + 2 * sw} strokeLinecap="round" fill="none" />
      <path d={fd(f.pts)} stroke={skin} strokeWidth={f.w} strokeLinecap="round" fill="none" />
    </g>
  );
  const ribs = Array.from({length: 8}, (_, i) => 8 + i * 4.4);
  return (
    <g transform={`translate(${px} ${py}) rotate(${ang}) scale(${k} ${flip ? -k : k}) translate(88 -2)`}>
      {fingers.map((f, i) => finger(f, 'f' + i))}
      <path d="M6,-31 C-14,-37 -40,-38 -55,-31 C-65,-22 -66,10 -58,22 C-46,32 -18,34 6,31 Z" fill={skin} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      <ellipse cx={-26} cy={20} rx={26} ry={8} fill={skinShade} opacity={0.4} />
      <path d="M-48,-20 q-4,4 -2,8 M-51,-5 q-4,4 -2,8 M-50,9 q-3,3 -2,6" stroke={ink} strokeWidth={sw * 0.7} fill="none" opacity={0.45} strokeLinecap="round" />
      {finger(index, 'i')}
      {finger(thumb, 't')}
      {[index, thumb].map((f, i) => {
        const [a, b] = [f.pts[1], f.pts[2]];
        const an = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
        return (
          <ellipse key={'n' + i} cx={b[0] - Math.cos((an * Math.PI) / 180) * 3} cy={b[1] - Math.sin((an * Math.PI) / 180) * 3} rx={5} ry={4.2} transform={`rotate(${an} ${b[0] - Math.cos((an * Math.PI) / 180) * 3} ${b[1] - Math.sin((an * Math.PI) / 180) * 3})`} fill="#F6E2C8" stroke={ink} strokeWidth={sw * 0.5} opacity={0.9} />
        );
      })}
      <path d={`M${fd(thumb.pts).slice(1)}`} stroke={skinShade} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.35} transform="translate(0 4)" />
      {/* sleeve */}
      <path d={`M14,-35 L${L},-54 L${L},54 L14,35 Z`} fill={sleeve} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M14,17 L${L},26 L${L},54 L14,35 Z`} fill={sleeveShade} opacity={0.55} />
      <path d={`M40,-8 L${L},-12 M40,8 L${L},10`} stroke={sleeveShade} strokeWidth={3} opacity={0.25} />
      <path d={`M14,-30 L${L},-46`} stroke="#F2A07E" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
      {/* ribbed cuff */}
      <path d="M0,-38 L44,-40 L44,40 L0,38 Q-5,0 0,-38 Z" fill={cuff} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
      {ribs.map((rx) => (
        <path key={rx} d={`M${rx},-37 Q${rx - 2},0 ${rx},37`} stroke={sleeveShade} strokeWidth={1.8} fill="none" opacity={0.8} />
      ))}
      <path d="M44,-40 L44,40" stroke={ink} strokeWidth={sw} />
    </g>
  );
};

/** the lightbulb "idea card" (white card with an ink bulb doodle) centred at x,y */
export const IdeaCard: X4FC<{x: number; y: number; size: number; rot?: number; squash?: number; icon?: 'bulb' | 'star' | 'heart' | 'none'; color?: string; ink?: string; lw?: number; children?: X4Node}> = ({
  x,
  y,
  size,
  rot = 0,
  squash = 1,
  icon = 'bulb',
  color = '#FBF6EA',
  ink = SB.ink,
  lw = 2,
  children,
}) => {
  const k = size / 100;
  const st = {stroke: ink, strokeWidth: lw, vectorEffect: 'non-scaling-stroke' as const, fill: 'none'};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k} ${k * squash})`}>
      <rect x={-46} y={-50} width={96} height={104} rx={3} fill="#000" opacity={0.12} transform="translate(4 5)" />
      <rect x={-48} y={-52} width={96} height={104} rx={3} fill={color} stroke={ink} strokeWidth={lw} vectorEffect="non-scaling-stroke" />
      {children}
      {icon === 'bulb' && (
        <g>
          <path d="M0,-30 C-16,-30 -24,-18 -22,-6 C-20,4 -11,8 -10,18 L10,18 C11,8 20,4 22,-6 C24,-18 16,-30 0,-30 Z" {...st} fill="#F7D35C" />
          <path d="M-8,4 L-3,-6 L0,4 L3,-6 L8,4" {...st} />
          <rect x={-10} y={18} width={20} height={12} rx={2} fill="#A7A9AA" stroke={ink} strokeWidth={lw} vectorEffect="non-scaling-stroke" />
          <path d="M-10,22 H10 M-10,26 H10" {...st} />
          <path d="M-36,-14 L-30,-12 M36,-14 L30,-12 M-28,-36 L-23,-31 M28,-36 L23,-31 M0,-44 V-37" {...st} />
        </g>
      )}
      {icon === 'star' && <path d="M0,-30 L9,-9 L31,-8 L14,6 L20,28 L0,15 L-20,28 L-14,6 L-31,-8 L-9,-9 Z" {...st} fill="#F7D35C" strokeLinejoin="round" />}
      {icon === 'heart' && <path d="M0,24 C-30,4 -30,-26 -12,-26 C-4,-26 0,-18 0,-14 C0,-18 4,-26 12,-26 C30,-26 30,4 0,24 Z" {...st} fill="#E86A5A" />}
    </g>
  );
};

// ==== /X4 ==================================================================================================
