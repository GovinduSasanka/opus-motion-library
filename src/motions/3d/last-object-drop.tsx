// Adapted from lemo-opuscar/styles/data-physical/demo/set.js `update()` puck branch (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {FilmGrain, useStage} from '../../core/stage';
import {CameraRig, SceneFog, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';
import {ContactShadow, cylV3, DP, eo, h01, la2Fonts, plateMat, PlateMatName, seg, settleBounce, StripEnv, ToneMap, woodCanvas} from '../../core/r2-la2-kit';

/**
 * The heavy last object: a single brass puck engraved with the final number falls into the centre of a
 * walnut dial ringed by finished plate stacks — gravity y = h·(1 − u²) over 0.5 s, yaw unwinding, one tiny
 * damped bounce, its shadow tightening as it lands; the room dims for a breath before the hit.
 */

type Props = {
  value: string;
  label: string;
  topLine: string;
  material: string;
  dropAt: number;
  stacks: number;
  stackMaterialA: string;
  stackMaterialB: string;
  caption: string;
  background: string;
  accent: string;
  seed: number;
  introLine?: string;
};

const R = 3.35;
const DISC_H = 0.11;
const TH = 0.0125;
const PR = 0.64;
const PH = 0.075;
const FALL = 15; // 0.5 s

const puckTexture = (value: string, label: string, topLine: string, fonts: {num: string; sans: string; mono: string}) => {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 1024, 1024);
  // fine lathe rings (turned brass)
  for (let r = 20; r < 500; r += 3) {
    g.strokeStyle = `rgba(90,60,20,${0.03 + ((r * 37) % 11) / 300})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(512, 512, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.strokeStyle = g.fillStyle = '#3b2a12';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(512, 512, 470, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(512, 512, 446, 0, Math.PI * 2);
  g.stroke();
  for (let a = 0; a < 120; a++) {
    const ang = (a / 120) * Math.PI * 2;
    const r0 = 446;
    const r1 = a % 10 === 0 ? 408 : 428;
    g.lineWidth = a % 10 === 0 ? 4 : 2;
    g.beginPath();
    g.moveTo(512 + r0 * Math.sin(ang), 512 + r0 * Math.cos(ang));
    g.lineTo(512 + r1 * Math.sin(ang), 512 + r1 * Math.cos(ang));
    g.stroke();
  }
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  let size = 250;
  g.font = `300 ${size}px ${fonts.num}`;
  while (g.measureText(value).width > 700 && size > 80) {
    size -= 10;
    g.font = `300 ${size}px ${fonts.num}`;
  }
  g.fillText(value, 512, 512 + size * 0.35);
  let ls = 54;
  g.font = `500 ${ls}px ${fonts.sans}`;
  while (g.measureText(label).width > 620 && ls > 26) {
    ls -= 2;
    g.font = `500 ${ls}px ${fonts.sans}`;
  }
  g.fillText(label, 512, 720);
  g.font = `500 52px ${fonts.mono}`;
  g.fillText(topLine, 512, 330);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const RingStacks: React.FC<{p: Props}> = ({p}) => {
  const sheets = useMemo(() => {
    const out: {x: number; z: number; y: number; a: number; mat: string}[] = [];
    const n = Math.max(0, Math.round(p.stacks));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      for (const kind of [0, 1]) {
        const r = kind === 0 ? 2.45 : 1.85;
        const cnt = 14 + Math.floor(h01(i, kind, p.seed) * 26) + i * 2;
        for (let k = 0; k < cnt; k++) {
          const brass = (k + 1) % 10 === 0;
          out.push({
            x: r * Math.sin(a) + (h01(i * 100 + k, kind, 3) - 0.5) * 0.006,
            z: r * Math.cos(a) + (h01(i * 100 + k, kind, 5) - 0.5) * 0.006,
            y: DISC_H + TH * (k + 0.5),
            a: a + (h01(i * 100 + k, kind, 7) - 0.5) * 0.016,
            mat: brass ? 'brass' : kind === 0 ? p.stackMaterialA : p.stackMaterialB,
          });
        }
      }
    }
    return out;
  }, [p.stacks, p.seed, p.stackMaterialA, p.stackMaterialB]);
  const groups = useMemo(() => {
    const g: Record<string, {mat: THREE.Material; list: typeof sheets}> = {};
    for (const s of sheets) {
      if (!g[s.mat]) g[s.mat] = {mat: plateMat(s.mat as PlateMatName), list: []};
      g[s.mat].list.push(s);
    }
    return g;
  }, [sheets]);
  const geo = useMemo(() => new THREE.BoxGeometry(0.5, TH * 0.94, 0.42), []);
  const refs = useRef<Record<string, THREE.InstancedMesh | null>>({});
  useLayoutEffect(() => {
    const M4 = new THREE.Matrix4();
    const Q = new THREE.Quaternion();
    const ONE = new THREE.Vector3(1, 1, 1);
    for (const [name, g] of Object.entries(groups)) {
      const m = refs.current[name];
      if (!m) continue;
      g.list.forEach((s, i) => {
        Q.setFromEuler(new THREE.Euler(0, s.a, 0));
        M4.compose(new THREE.Vector3(s.x, s.y, s.z), Q, ONE);
        m.setMatrixAt(i, M4);
      });
      m.instanceMatrix.needsUpdate = true;
    }
  }, [groups]);
  return (
    <>
      {Object.entries(groups).map(([name, g]) => (
        <instancedMesh
          key={name}
          ref={(r) => {
            refs.current[name] = r;
          }}
          args={[geo, g.mat, g.list.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
};

const LastObjectDrop: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D} = useStage();
  const aspect = w / h;
  const fontsReady = typeof document !== 'undefined' && document.fonts ? document.fonts.check(`300 60px "${la2Fonts.inter}"`) && document.fonts.check(`500 40px "${la2Fonts.monoHeavy}"`) : false;
  const tex = useMemo(
    () => puckTexture(p.value, p.label, p.topLine, {num: `"${la2Fonts.inter}", sans-serif`, sans: `"${la2Fonts.inter}", sans-serif`, mono: `"${la2Fonts.monoHeavy}", monospace`}),
    [p.value, p.label, p.topLine, fontsReady], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const wood = useMemo(() => {
    const t = woodCanvas(p.seed, 1024);
    t.repeat.set(1.6, 1.6);
    return t;
  }, [p.seed]);
  const side = useMemo(() => plateMat((p.material || 'brass') as PlateMatName), [p.material]);
  const top = useMemo(() => {
    const base = side as THREE.MeshStandardMaterial;
    return new THREE.MeshStandardMaterial({color: base.color.clone().lerp(new THREE.Color('#ffffff'), 0.12), map: tex, metalness: 0.85, roughness: 0.27, envMapIntensity: 2.2});
  }, [side, tex]);

  // puck: gravity fall, yaw unwind, tiny damped bounce
  const t0 = p.dropAt;
  const land = t0 + FALL;
  const uu = seg(frame, t0, land);
  let y = DISC_H + PH / 2 + 2.6 * (1 - uu * uu);
  if (frame > land) y += settleBounce((frame - land) / 30);
  const yaw = 0.35 + (1 - eo(uu)) * 0.9;
  const lift = Math.max(0, y - DISC_H - PH / 2);
  const visible = frame >= t0;

  // camera: high 3/4, slow creep; pushes toward the puck after it lands
  const push = eo(seg(frame, land, land + 50));
  const fit = aspect < 0.8 ? 1.9 / aspect : Math.max(1, 1.15 / aspect);
  const camR = (6.0 - 1.4 * push - frame * 0.002) * fit;
  const camH = (6.6 - 2.2 * push) * fit;
  const az = 0.25 - frame * 0.0012;
  const camPos: V3 = cylV3(az, camR, camH);
  const tgt: V3 = [0, 0.05 + 0.03 * push, 0];
  const shake = frame >= land && frame < land + 3 ? (land + 3 - frame) * 0.006 : 0;
  camPos[0] += shake;

  // the "suck-out": room dims for ~0.4 s before the hit, then releases
  const dim = seg(frame, land - 12, land - 2) * (1 - seg(frame, land, land + 8));
  const capA = seg(frame, land + 14, land + 30);
  const introA = seg(frame, 4, 20) * (1 - seg(frame, t0 - 6, t0 + 4));

  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 100% at 50% 40%, ${p.background} 0%, #d6c8b6 70%, #c6b8a5 100%)`}}>
      <Stage3D shadows="soft" transparent>
        <ToneMap exposure={1.08} />
        <StripEnv sideI={1.1} topI={1.6} backI={1} roomI={0.5} roomColor="#a09a8e" />
        <SceneFog color={p.background} density={0.014} />
        <CameraRig position={camPos} target={tgt} fov={26} near={0.05} far={120} />
        <ambientLight intensity={0.45} color="#f2ead9" />
        <directionalLight
          position={[-6.2, 4.4, 1.6]}
          intensity={2.7}
          color="#fff1dc"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-4.6}
          shadow-camera-right={4.6}
          shadow-camera-top={4.6}
          shadow-camera-bottom={-4.6}
          shadow-bias={-0.0002}
          shadow-radius={4}
        />
        <directionalLight position={[5.5, 3.2, -5.5]} intensity={1.5} color="#b9d2ff" />
        <directionalLight position={[4.5, 2.6, 6]} intensity={0.7} color="#c6dbff" />
        <hemisphereLight args={['#fdf6ea', '#b4a893', 0.45]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[140, 140]} />
          <meshStandardMaterial color={DP.floor} roughness={0.94} />
        </mesh>
        <mesh position={[0, DISC_H / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[R, R, DISC_H, 160, 1]} />
          <meshStandardMaterial map={wood} color="#c9a582" roughness={0.6} />
        </mesh>
        <mesh position={[0, DISC_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R, 0.006, 8, 200]} />
          <meshStandardMaterial color="#d8d8d6" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0, DISC_H + 0.0005, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[PR + 0.08, 0.004, 6, 160]} />
          <meshStandardMaterial color={DP.inlay} roughness={0.5} />
        </mesh>
        <RingStacks p={p} />
        {visible && <ContactShadow y={DISC_H + 0.002} r={PR * 1.15} lift={lift} opacity={0.5} />}
        {visible && (
          <mesh position={[0, y, 0]} rotation={[0, yaw, 0]} castShadow receiveShadow material={[side, top, side]}>
            <cylinderGeometry args={[PR, PR, PH, 160]} />
          </mesh>
        )}
      </Stage3D>

      {/* dim before the hit */}
      <AbsoluteFill style={{background: 'rgba(30,22,14,1)', opacity: dim * 0.22, pointerEvents: 'none'}} />
      <div style={{position: 'absolute', left: w * 0.06, top: h * 0.08, opacity: introA, fontFamily: la2Fonts.plex, fontSize: 18 * u, letterSpacing: '0.22em', color: DP.ink2}}>
        {p.introLine}
      </div>
      <div style={{position: 'absolute', left: w * 0.06, right: w * 0.06, top: h * 0.08, opacity: capA, transform: `translateY(${(1 - eo(capA)) * 16 * u}px)`}}>
        <div style={{fontFamily: la2Fonts.inter, fontWeight: 500, fontSize: 40 * u, color: p.accent, lineHeight: 1.15, maxWidth: aspect >= 1.2 ? w * 0.5 : undefined}}>{p.caption}</div>
        <div style={{width: 300 * u * eo(capA), height: 1.6 * u, background: DP.ink2, marginTop: 16 * u}} />
      </div>
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(125% 100% at 50% 45%, rgba(0,0,0,0) 58%, rgba(60,45,30,0.22) 100%)'}} />
      <FilmGrain opacity={0.04} />
      {D < 0 && null}
    </AbsoluteFill>
  );
};

export const lastObjectDrop = defineMotion<Props>({
  id: 'last-object-drop',
  title: 'Last object drop (engraved brass puck)',
  category: '3d',
  description:
    'A single brass puck engraved with the final number falls with gravity into the centre of a walnut dial ringed by plate stacks, unwinds its yaw, lands with one tiny damped bounce while its shadow tightens; the room dims for a breath before the hit and an accent verdict settles.',
  source: ['lemo-opuscar styles/data-physical (MIT, LemoLab)'],
  useFor: 'Totals, ratios and "target met" endings for data films; the one heavy object that closes the argument.',
  durationInFrames: 150,
  defaultProps: {
    value: '×1.86',
    label: 'SERIES A ÷ SERIES B',
    topLine: '2025',
    material: 'brass',
    dropAt: 40,
    stacks: 10,
    stackMaterialA: 'aluminium',
    stackMaterialB: 'acrylic',
    caption: '2025 · Series A is 1.86× Series B',
    background: '#e4d7c6',
    accent: '#d4521c',
    seed: 4,
    introLine: 'AND THE LAST PIECE —',
  },
  propDocs: {
    value: 'big engraved number on the puck face',
    label: 'engraved line under the number',
    topLine: 'small engraved line above the number (e.g. a year)',
    material: 'puck material: brass | copper | aluminium | stone | oak',
    dropAt: 'frame the fall starts (lands 15 frames later)',
    stacks: 'number of context stack pairs ringed around the dial (0 = bare dial)',
    stackMaterialA: 'outer stack material',
    stackMaterialB: 'inner stack material',
    caption: 'accent verdict line that settles after the landing',
    background: 'studio sweep colour',
    accent: 'verdict colour',
    seed: 'jitter seed',
    introLine: 'small spaced line at the top-left before the drop',
  },
  component: LastObjectDrop,
  tags: ['3d', 'data', 'physicalization', 'drop', 'gravity', 'puck', 'coin', 'brass', 'engraved', 'total', 'ending', 'verdict', 'data-physical'],
});
