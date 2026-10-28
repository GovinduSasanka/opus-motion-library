// Adapted from lemo-opuscar/styles/data-physical/demo/set.js + film.js and core/lib.js `track` (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {FilmGrain, useStage} from '../../core/stage';
import {CameraRig, SceneFog, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';
import {cylV3, DP, eo, h01, la2Fonts, monotoneTrack, plateMat, PlateMatName, seg, StripEnv, ToneMap, woodCanvas} from '../../core/r2-la2-kit';

/**
 * Chart → installation: two series of physical plate stacks spiral around a walnut dial. The film starts
 * close on the first pair, tracks along the spiral while the stacks assemble, then cranes back and up
 * (monotone-cubic camera keys, ~4 s) to a ~70° top view where the stacks read as one data sculpture and the
 * inlaid tick ring and years on the base become the typography; an end card settles beside it.
 */

type Props = {
  labels: string[];
  valuesA: number[];
  valuesB: number[];
  nameA: string;
  nameB: string;
  materialA: string;
  materialB: string;
  unit: number;
  rulerEvery: number;
  title: string;
  kicker: string;
  verdict: string;
  background: string;
  accent: string;
  craneAt: number;
  seed: number;
};

const R = 3.35;
const DISC_H = 0.11;
const TH = 0.0125;
const SW = 0.5;
const SD = 0.42;

type Stack = {i: number; kind: 0 | 1; n: number; r: number; a: number; x: number; z: number; b: number};

const layout = (p: Props) => {
  const N = Math.max(1, Math.min(p.labels.length, p.valuesA.length, p.valuesB.length));
  const span = Math.min(5.6, 0.48 * N);
  const step = N > 1 ? span / (N - 1) : 0;
  const a0 = 0.7 - span; // last pair at a=0.7 (front-right)
  const stacks: Stack[] = [];
  const pairs: {a: number; rr: number; label: string}[] = [];
  for (let i = 0; i < N; i++) {
    const a = a0 + i * step;
    const rS = 2.25 + 0.03 * i;
    const rW = rS - 0.6;
    const b = 6 + i * 7;
    stacks.push({i, kind: 0, n: Math.max(1, Math.round(p.valuesA[i] / p.unit)), r: rS, a, x: rS * Math.sin(a), z: rS * Math.cos(a), b});
    stacks.push({i, kind: 1, n: Math.max(1, Math.round(p.valuesB[i] / p.unit)), r: rW, a, x: rW * Math.sin(a), z: rW * Math.cos(a), b: b + 3});
    pairs.push({a, rr: rS + SD / 2 + 0.22, label: p.labels[i]});
  }
  return {N, stacks, pairs, a0, step};
};

const inlayTexture = (pairs: {a: number; rr: number; label: string}[], font: string) => {
  const C = 2048;
  const c = document.createElement('canvas');
  c.width = c.height = C;
  const x = c.getContext('2d')!;
  const px = (v: number) => ((v / R + 1) / 2) * C;
  x.strokeStyle = x.fillStyle = '#fff';
  for (let a = 0; a < 180; a++) {
    const ang = (a / 180) * Math.PI * 2;
    const r0 = R - 0.07;
    const r1 = R - (a % 15 === 0 ? 0.2 : 0.12);
    x.lineWidth = a % 15 === 0 ? 3 : 1.4;
    x.beginPath();
    x.moveTo(px(r0 * Math.sin(ang)), px(r0 * Math.cos(ang)));
    x.lineTo(px(r1 * Math.sin(ang)), px(r1 * Math.cos(ang)));
    x.stroke();
  }
  x.lineWidth = 1.6;
  x.beginPath();
  x.arc(C / 2, C / 2, ((R - 0.26) / R) * (C / 2), 0, Math.PI * 2);
  x.stroke();
  x.font = `500 ${Math.round((0.15 / R) * (C / 2))}px ${font}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  for (const p of pairs) {
    x.save();
    x.translate(px(p.rr * Math.sin(p.a)), px(p.rr * Math.cos(p.a)));
    x.rotate(-p.a);
    x.fillText(p.label, 0, 0);
    x.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
};

const Stacks: React.FC<{p: Props; frame: number; stacks: Stack[]}> = ({p, frame, stacks}) => {
  const sheets = useMemo(() => {
    const list: {s: Stack; k: number; brass: boolean; land: number; ja: number; jt: number; shade: number}[] = [];
    for (const s of stacks)
      for (let k = 0; k < s.n; k++)
        list.push({s, k, brass: (k + 1) % p.rulerEvery === 0, land: s.b + 18 * Math.pow((k + 1) / s.n, 0.85), ja: (h01(s.i * 1000 + k, p.seed, s.kind) - 0.5) * 0.016, jt: (h01(s.i * 977 + k, p.seed, 3 + s.kind) - 0.5) * 0.007, shade: 0.9 + h01(s.i * 91 + k, p.seed, 7) * 0.12});
    return list;
  }, [stacks, p.rulerEvery, p.seed]);
  const groups = useMemo(() => {
    const g: Record<string, {mat: THREE.Material; list: typeof sheets}> = {};
    for (const sh of sheets) {
      const name = sh.brass ? 'brass' : ((sh.s.kind === 0 ? p.materialA : p.materialB) as PlateMatName);
      if (!g[name]) g[name] = {mat: plateMat(name), list: []};
      g[name].list.push(sh);
    }
    return g;
  }, [sheets, p.materialA, p.materialB]);
  const geo = useMemo(() => new THREE.BoxGeometry(SW, TH * 0.94, SD), []);
  const refs = useRef<Record<string, THREE.InstancedMesh | null>>({});
  useLayoutEffect(() => {
    const M4 = new THREE.Matrix4();
    const Q = new THREE.Quaternion();
    const E = new THREE.Euler();
    const P = new THREE.Vector3();
    const ONE = new THREE.Vector3(1, 1, 1);
    const ZERO = new THREE.Vector3(1e-4, 1e-4, 1e-4);
    for (const name of Object.keys(groups)) {
      const mesh = refs.current[name];
      if (!mesh) continue;
      groups[name].list.forEach((sh, idx) => {
        const t0 = sh.land - 4;
        if (frame < t0) M4.compose(P.set(0, -5, 0), Q.identity(), ZERO);
        else {
          const {s} = sh;
          const y = DISC_H + TH * (sh.k + 0.5) + 0.12 * (1 - eo(seg(frame, t0, sh.land)));
          const tx = Math.cos(s.a);
          const tz = -Math.sin(s.a);
          P.set(s.x + tx * sh.jt, y, s.z + tz * sh.jt);
          Q.setFromEuler(E.set(0, s.a + sh.ja, 0));
          M4.compose(P, Q, ONE);
        }
        mesh.setMatrixAt(idx, M4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  });
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

const ChartToInstallation: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D} = useStage();
  const aspect = w / h;
  const {stacks, pairs, a0, step, N} = useMemo(() => layout(p), [p]);
  const fontReady = typeof document !== 'undefined' && document.fonts ? document.fonts.check(`500 40px "${la2Fonts.monoHeavy}"`) : false;
  const inlay = useMemo(() => inlayTexture(pairs, `"${la2Fonts.monoHeavy}", monospace`), [pairs, fontReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const wood = useMemo(() => {
    const t = woodCanvas(p.seed, 1024);
    t.repeat.set(1.6, 1.6);
    return t;
  }, [p.seed]);

  // camera keys [frame, camAz, camR, camY, tgtAz, tgtR, tgtY] — side close-up → track along the spiral → crane to top view
  const C = p.craneAt;
  const thA = (i: number) => a0 + i * step;
  const mid = Math.floor((N - 1) / 2);
  // portrait/square: pull further back so the whole dial fits at the top view
  const fit = Math.max(1.12, 1.62 / aspect);
  // top view target sits off-centre so an end card fits beside (left in landscape, above in portrait)
  const endTgt = aspect >= 1.2 ? cylV3(-Math.PI / 2, 1.9, 0.2) : ([0, 0.2, -1.5] as V3);
  const keys: [number, number[]][] = [
    [0, [thA(0) + 0.7, 4.5, 1.05, thA(0) + 0.1, 2.0, 0.3]],
    [C * 0.45, [thA(mid) + 0.15, 5.4, 1.55, thA(mid) - 0.4, 2.0, 0.45]],
    [C, [thA(N - 1) + 0.2, 5.8, 2.0, thA(N - 1) - 0.5, 1.9, 0.5]],
    [C + 120, [0.15, 5.4, 16.2 * fit, 0, 0, 0.2]],
    [Math.max(C + 121, D), [0.02, 5.5, 16.8 * fit, 0, 0, 0.2]],
  ];
  const tracks = useMemo(() => [0, 1, 2, 3, 4, 5].map((j) => monotoneTrack(keys.map(([f, v]) => [f, v[j]] as [number, number]))), [JSON.stringify(keys)]); // eslint-disable-line react-hooks/exhaustive-deps
  const v = tracks.map((tr) => tr(frame));
  const craneK = seg(frame, C, C + 120);
  const cam = cylV3(v[0], v[1], v[2]);
  const tgtBase = cylV3(v[3], v[4], v[5]);
  const tgt: V3 = [tgtBase[0] + endTgt[0] * craneK, tgtBase[1], tgtBase[2] + endTgt[2] * craneK];
  const camPos: V3 = [cam[0] + endTgt[0] * craneK, cam[1], cam[2] + endTgt[2] * craneK];
  const fov = 24 - 6 * craneK;

  const kickA = seg(frame, 8, 24) * (1 - seg(frame, C - 10, C + 6));
  const endA = seg(frame, C + 90, C + 112);
  const verdictA = seg(frame, C + 110, C + 132);
  const land = aspect >= 1.2;

  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 100% at 50% 40%, ${p.background} 0%, #d6c8b6 70%, #c6b8a5 100%)`}}>
      <Stage3D shadows="soft" transparent>
        <ToneMap exposure={1.08} />
        <StripEnv sideI={1.1} topI={1.6} backI={1} roomI={0.5} roomColor="#a09a8e" />
        <SceneFog color={p.background} density={0.012} />
        <CameraRig position={camPos} target={tgt} fov={fov} near={0.05} far={120} />
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
        <mesh position={[0, DISC_H + 0.0006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[R, 160]} />
          <meshStandardMaterial color={DP.inlay} alphaMap={inlay} transparent roughness={0.55} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
        <Stacks p={p} frame={frame} stacks={stacks} />
      </Stage3D>

      {/* opening kicker */}
      <div style={{position: 'absolute', left: w * 0.055, top: h * 0.075, opacity: kickA, fontFamily: la2Fonts.plex, fontSize: 16 * u, letterSpacing: '0.2em', color: DP.ink2}}>
        <span style={{display: 'inline-block', width: 11 * u, height: 11 * u, background: DP.alu, marginRight: 8 * u, border: `1px solid ${DP.ink2}`}} />
        {p.nameA.toUpperCase()}
        <span style={{display: 'inline-block', width: 11 * u, height: 11 * u, background: DP.acrylic, margin: `0 ${8 * u}px 0 ${22 * u}px`, border: `1px solid ${DP.ink2}`}} />
        {p.nameB.toUpperCase()}
        <div style={{marginTop: 8 * u}}>ONE PLATE = {p.unit} · BRASS EVERY {p.rulerEvery}</div>
      </div>

      {/* end card */}
      <div
        style={{
          position: 'absolute',
          left: w * 0.065,
          top: land ? h * 0.3 : h * 0.07,
          width: land ? w * 0.36 : w * 0.86,
          opacity: endA,
          transform: `translateY(${(1 - eo(endA)) * 16 * u}px)`,
        }}
      >
        <div style={{fontFamily: la2Fonts.plex, fontSize: 17 * u, letterSpacing: '0.24em', color: DP.ink2}}>{p.kicker.toUpperCase()}</div>
        <div style={{fontFamily: la2Fonts.newsreader, fontWeight: 600, fontSize: 84 * u, color: DP.ink, lineHeight: 1.02, marginTop: 10 * u}}>{p.title}</div>
        <div style={{width: 380 * u * eo(verdictA), maxWidth: '100%', height: 1.6 * u, background: DP.ink2, marginTop: 22 * u}} />
        <div style={{fontFamily: la2Fonts.inter, fontWeight: 500, fontSize: 30 * u, color: p.accent, marginTop: 16 * u, opacity: verdictA}}>{p.verdict}</div>
      </div>
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(125% 100% at 50% 45%, rgba(0,0,0,0) 60%, rgba(60,45,30,0.2) 100%)'}} />
      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};

export const chartToInstallation = defineMotion<Props>({
  id: 'chart-to-installation',
  title: 'Chart to installation (crane to top view)',
  category: '3d',
  description:
    'Two series of physical plate stacks spiral around a walnut dial; the camera tracks the spiral while they assemble, then cranes back and up to a ~70° top view where the stacks read as one data sculpture and the inlaid tick ring and years become the typography, with an end card beside it.',
  source: ['lemo-opuscar styles/data-physical (MIT, LemoLab)'],
  useFor: 'Signature ending / summary shot for any physical-data film: a decade of values revealed as one installation.',
  durationInFrames: 240,
  defaultProps: {
    labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
    valuesA: [120, 150, 190, 230, 280, 340, 400, 470, 540, 620],
    valuesB: [180, 200, 220, 240, 270, 300, 330, 360, 390, 420],
    nameA: 'Series A',
    nameB: 'Series B',
    materialA: 'aluminium',
    materialB: 'acrylic',
    unit: 10,
    rulerEvery: 10,
    title: 'Two spirals',
    kicker: 'A decade, stacked',
    verdict: '2025 · Series A is 1.5× Series B',
    background: '#e4d7c6',
    accent: '#d4521c',
    craneAt: 96,
    seed: 5,
  },
  propDocs: {
    labels: 'period labels inlaid on the dial (one per stack pair)',
    valuesA: 'outer-ring series values',
    valuesB: 'inner-ring series values',
    nameA: 'outer series name',
    nameB: 'inner series name',
    materialA: 'aluminium | acrylic | brass | oak | stone | copper',
    materialB: 'aluminium | acrylic | brass | oak | stone | copper',
    unit: 'value per plate',
    rulerEvery: 'every Nth plate is brass',
    title: 'end-card title',
    kicker: 'tracked caps line above the title',
    verdict: 'accent verdict line under the rule',
    background: 'studio sweep colour',
    accent: 'verdict colour',
    craneAt: 'frame the 4 s crane to the top view starts',
    seed: 'jitter seed',
  },
  component: ChartToInstallation,
  tags: ['3d', 'data', 'physicalization', 'crane', 'top-view', 'dial', 'spiral', 'installation', 'end-card', 'summary', 'plates', 'walnut', 'data-physical'],
});
