// Adapted from lemo-opuscar/styles/data-physical/demo/set.js + film.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {clamp, lerp} from '../../core/ease';
import {FilmGrain, useStage} from '../../core/stage';
import {CameraRig, makeCamera, projectPx, SceneFog, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';
import {ContactShadow, DP, eo, h01, keyLerp, la2Fonts, plateMat, PlateMatName, seg, settleBounce, StripEnv, ToneMap, woodCanvas} from '../../core/r2-la2-kit';

/**
 * Data physicalization: each data series is a stack of real thin plates (brushed aluminium, milky acrylic,
 * a brass "ruler" plate every Nth unit) on a walnut base lit like a studio product shot. Stacks assemble
 * bottom-to-top plate by plate, then the newest increase is fed in one plate at a time from above while a
 * pinned reading rolls with the landings — the counter counts objects, not time.
 */

type Series = {label: string; material: string; value: number};
type Props = {
  series: Series[];
  unit: number;
  unitLabel: string;
  rulerEvery: number;
  feedSeries: number;
  feedValue: number;
  title: string;
  sourceLine: string;
  background: string;
  accent: string;
  seed: number;
};

const SW = 0.5; // plate width
const SD = 0.42; // plate depth
const TH = 0.0145; // plate pitch (incl. hairline gap)
const GAP_X = 0.78;
const BASE_H = 0.12;

type Sheet = {si: number; k: number; brass: boolean; t0: number; land: number; mode: 'c' | 'd'; jt: number; jr: number; ja: number; shade: number; g: string; idx: number};

const buildSchedule = (series: Series[], unit: number, rulerEvery: number, feedSeries: number, feedN: number, seed: number) => {
  const sheets: Sheet[] = [];
  const counts = series.map((s) => Math.max(1, Math.round(s.value / unit)));
  series.forEach((s, si) => {
    const nBase = counts[si];
    const extra = si === feedSeries ? feedN : 0;
    const t0 = 8 + si * 18;
    const L = 34;
    for (let k = 0; k < nBase + extra; k++) {
      const brass = (k + 1) % rulerEvery === 0;
      let start: number;
      let land: number;
      let mode: 'c' | 'd';
      if (k < nBase) {
        land = t0 + L * Math.pow((k + 1) / nBase, 0.85);
        start = land - 4;
        mode = 'c';
      } else {
        const j = k - nBase;
        start = 112 + j * 3;
        land = start + 13;
        mode = 'd';
      }
      sheets.push({
        si,
        k,
        brass,
        t0: start,
        land,
        mode,
        jt: (h01(si * 1000 + k, seed) - 0.5) * 0.007,
        jr: (h01(si * 1000 + k, seed, 5) - 0.5) * 0.007,
        ja: (h01(si * 777 + k * 3, seed, 9) - 0.5) * 0.016,
        shade: 0.9 + h01(si * 91 + k * 2, seed, 17) * 0.14,
        g: '',
        idx: 0,
      });
    }
  });
  return {sheets, counts};
};

const Plates: React.FC<{p: Props; frame: number}> = ({p, frame}) => {
  const m = p.series.length;
  const xOf = (si: number) => (si - (m - 1) / 2) * GAP_X;
  const feedN = Math.max(0, Math.round(p.feedValue / p.unit));
  const {sheets} = useMemo(() => buildSchedule(p.series, p.unit, p.rulerEvery, p.feedSeries, feedN, p.seed), [p.series, p.unit, p.rulerEvery, p.feedSeries, feedN, p.seed]);
  // bucket sheets by material group
  const groups = useMemo(() => {
    const g: Record<string, {mat: THREE.Material; list: Sheet[]}> = {};
    for (const sh of sheets) {
      const name = sh.brass ? 'brass' : ((p.series[sh.si].material || 'aluminium') as PlateMatName);
      if (!g[name]) g[name] = {mat: plateMat(name as PlateMatName), list: []};
      sh.g = name;
      sh.idx = g[name].list.length;
      g[name].list.push(sh);
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheets]);
  const geo = useMemo(() => new THREE.BoxGeometry(SW, TH * 0.94, SD), []);
  const refs = useRef<Record<string, THREE.InstancedMesh | null>>({});

  useLayoutEffect(() => {
    const M4 = new THREE.Matrix4();
    const Q = new THREE.Quaternion();
    const E = new THREE.Euler();
    const P = new THREE.Vector3();
    const ONE = new THREE.Vector3(1, 1, 1);
    const ZERO = new THREE.Vector3(0.0001, 0.0001, 0.0001);
    const t = frame;
    for (const name of Object.keys(groups)) {
      const mesh = refs.current[name];
      if (!mesh) continue;
      for (const sh of groups[name].list) {
        if (t < sh.t0) {
          M4.compose(P.set(0, -5, 0), Q.identity(), ZERO);
        } else {
          let y = BASE_H + TH * (sh.k + 0.5);
          let yaw = sh.ja;
          let dx = 0;
          let tilt = 0;
          if (sh.mode === 'c') {
            const u = seg(t, sh.t0, sh.land);
            y += 0.12 * (1 - eo(u));
          } else {
            const u = seg(t, sh.t0, sh.land);
            const f = Math.pow(1 - u, 5);
            y += 1.0 * f;
            yaw += (h01(sh.k * 13, p.seed) > 0.5 ? 1 : -1) * (0.35 + h01(sh.k * 29, p.seed) * 0.25) * f;
            dx = (h01(sh.k * 33, p.seed) - 0.5) * 0.05 * f;
            tilt = (h01(sh.k * 51, p.seed) - 0.5) * 0.12 * f;
          }
          P.set(xOf(sh.si) + sh.jt + dx, y, sh.jr);
          Q.setFromEuler(E.set(tilt, yaw, tilt * 0.6, 'YXZ'));
          M4.compose(P, Q, ONE);
        }
        mesh.setMatrixAt(sh.idx, M4);
      }
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

const landedCount = (p: Props, frame: number) => {
  const feedN = Math.max(0, Math.round(p.feedValue / p.unit));
  const {sheets, counts} = buildSchedule(p.series, p.unit, p.rulerEvery, p.feedSeries, feedN, p.seed);
  const per = p.series.map(() => 0);
  for (const sh of sheets) if (sh.land <= frame) per[sh.si]++;
  return {per, counts, feedN};
};

const StackPlates3D: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D} = useStage();
  const m = p.series.length;
  const xOf = (si: number) => (si - (m - 1) / 2) * GAP_X;
  const feedN = Math.max(0, Math.round(p.feedValue / p.unit));
  const nOf = (si: number) => Math.max(1, Math.round(p.series[si].value / p.unit)) + (si === p.feedSeries ? feedN : 0);
  const topOf = (si: number, f: number) => {
    const {per} = landedCount(p, f);
    return BASE_H + per[si] * TH;
  };

  // camera: slow orbit + creep, rises with the fed stack, target drifts to the fed stack
  const feedTopEnd = BASE_H + nOf(Math.max(0, p.feedSeries)) * TH;
  const az = keyLerp(
    [
      [0, 0.66],
      [100, 0.42],
      [D, 0.3],
    ],
    frame,
  );
  const r = keyLerp(
    [
      [0, 3.35],
      [90, 2.95],
      [D, 3.15],
    ],
    frame,
  ) * Math.max(1, 1.08 / (w / h)) * (1 + Math.max(0, feedTopEnd - 0.7) * 0.5);
  const riseT = seg(frame, 112, 112 + feedN * 3 + 13);
  const camY = keyLerp(
    [
      [0, 0.52],
      [100, 0.72],
      [D, 0.86],
    ],
    frame,
  ) + riseT * Math.max(0, feedTopEnd - 0.75) * 0.6;
  const tx = lerp(0, xOf(Math.max(0, p.feedSeries)) * 0.6, seg(frame, 100, 140));
  const ty = lerp(0.34, Math.max(0.34, feedTopEnd * 0.62), riseT);
  const camPos: V3 = [tx + r * Math.sin(az), camY, r * Math.cos(az)];
  const tgt: V3 = [tx, ty, 0];
  const fov = 24;

  // overlay projections
  const cam = useMemo(() => makeCamera(camPos, tgt, fov, w / h), [camPos[0], camPos[1], camPos[2], tgt[0], tgt[1], tgt[2], w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  const {per} = landedCount(p, frame);

  const baseW = m * GAP_X + 0.55;
  const wood = useMemo(() => woodCanvas(p.seed), [p.seed]);

  const readings = p.series.map((s, si) => {
    const appear = si === p.feedSeries ? 104 : 48 + si * 20;
    const a = seg(frame, appear, appear + 14) * (1 - seg(frame, D - 14, D - 2) * 0);
    if (a <= 0) return null;
    const top = BASE_H + per[si] * TH;
    const anchor = projectPx(cam, [xOf(si), Math.max(BASE_H + 0.02, top - 0.015), SD / 2], w, h);
    const value = per[si] * p.unit;
    const rise = (1 - eo(a)) * 16 * u;
    const left = anchor.x < w * 0.52;
    return (
      <div key={si} style={{position: 'absolute', left: anchor.x, top: anchor.y, opacity: a, pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: -3.5 * u, top: -3.5 * u, width: 7 * u, height: 7 * u, borderRadius: '50%', background: DP.ink}} />
        <div
          style={{
            position: 'absolute',
            left: left ? 20 * u : undefined,
            right: left ? undefined : 20 * u,
            bottom: 14 * u - rise,
            background: 'rgba(240,233,220,.86)',
            padding: `${10 * u}px ${18 * u}px ${9 * u}px`,
            whiteSpace: 'nowrap',
            textAlign: left ? 'left' : 'right',
            boxShadow: `0 ${2 * u}px ${14 * u}px rgba(60,44,28,.12)`,
          }}
        >
          <div style={{fontFamily: la2Fonts.plex, fontSize: 16 * u, letterSpacing: '0.16em', color: DP.ink2, display: 'flex', alignItems: 'center', gap: 9 * u, justifyContent: left ? 'flex-start' : 'flex-end'}}>
            <span style={{display: 'inline-block', width: 12 * u, height: 12 * u, background: si === 1 ? DP.acrylic : DP.alu, border: `1px solid ${DP.ink2}`}} />
            {s.label.toUpperCase()}
          </div>
          <div style={{fontFamily: la2Fonts.inter, fontWeight: 300, fontSize: 52 * u, color: DP.ink, lineHeight: 1.18, marginTop: 2 * u}}>
            {value.toLocaleString('en-US')}
            <span style={{fontFamily: la2Fonts.plex, fontSize: 18 * u, marginLeft: 9 * u, color: DP.ink2}}>{p.unitLabel}</span>
          </div>
        </div>
      </div>
    );
  });

  const titleA = seg(frame, 6, 22);
  const srcA = seg(frame, 20, 36);
  const puckBounceY = 0; // reserved
  void puckBounceY;
  void settleBounce;

  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 90% at 50% 34%, ${p.background} 0%, #c9bcab 70%, #bbae9d 100%)`}}>
      <Stage3D shadows="soft" transparent>
        <ToneMap exposure={1.08} />
        <StripEnv sideI={1.1} topI={1.6} backI={1} roomI={0.5} roomColor="#a09a8e" />
        <SceneFog color="#e0d3c2" density={0.028} />
        <CameraRig position={camPos} target={tgt} fov={fov} near={0.05} far={60} />
        <ambientLight intensity={0.5} color="#f2ead9" />
        <directionalLight
          position={[-6.2, 4.4, 1.6]}
          intensity={2.6}
          color="#fff1dc"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-3.4}
          shadow-camera-right={3.4}
          shadow-camera-top={3.4}
          shadow-camera-bottom={-3.4}
          shadow-bias={-0.0003}
          shadow-radius={5}
        />
        <directionalLight position={[5.5, 3.2, -5.5]} intensity={1.5} color="#b9d2ff" />
        <directionalLight position={[4.5, 2.6, 6]} intensity={0.8} color="#c6dbff" />
        <hemisphereLight args={['#fdf6ea', '#b4a893', 0.5]} />
        {/* floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={DP.floor} roughness={0.94} />
        </mesh>
        {/* walnut base */}
        <mesh position={[0, BASE_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[baseW, BASE_H, 1.0]} />
          <meshStandardMaterial map={wood} color="#c9a582" roughness={0.58} />
        </mesh>
        {p.series.map((_, si) => (
          <ContactShadow key={si} x={xOf(si)} y={BASE_H + 0.002} r={0.42} opacity={0.22} />
        ))}
        <Plates p={p} frame={frame} />
      </Stage3D>

      {/* title + source overlay */}
      <div style={{position: 'absolute', left: w * 0.055, top: h * 0.075, opacity: titleA, transform: `translateY(${(1 - eo(titleA)) * 14 * u}px)`}}>
        <div style={{fontFamily: la2Fonts.plex, fontSize: 16 * u, letterSpacing: '0.22em', color: DP.ink2}}>ONE PLATE = {p.unit} {p.unitLabel}</div>
        <div style={{fontFamily: la2Fonts.inter, fontWeight: 300, fontSize: 52 * u, color: DP.ink, marginTop: 8 * u, maxWidth: w * 0.42, lineHeight: 1.1}}>{p.title}</div>
        <div style={{width: 74 * u, height: 3 * u, background: p.accent, marginTop: 12 * u, transform: `scaleX(${eo(titleA)})`, transformOrigin: 'left'}} />
      </div>
      <div style={{position: 'absolute', left: w * 0.055, bottom: h * 0.06, fontFamily: la2Fonts.plex, fontSize: 15 * u, letterSpacing: '0.08em', color: DP.ink2, opacity: srcA * 0.9}}>
        {p.sourceLine}
      </div>
      {readings}
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(130% 100% at 50% 42%, rgba(0,0,0,0) 58%, rgba(60,45,30,0.18) 100%)'}} />
      <FilmGrain opacity={0.045} />
    </AbsoluteFill>
  );
};

export const stackPlates3d = defineMotion<Props>({
  id: 'stack-plates-3d',
  title: 'Stack of plates (data physicalization)',
  category: '3d',
  description:
    'Data series as stacks of real thin plates — brushed aluminium and milky acrylic with a brass ruler plate every 10th — assembling piece by piece on a walnut base in a warm studio, then the newest increase feeds in plate by plate while pinned readings roll with the landings.',
  source: ['lemo-opuscar styles/data-physical (MIT, LemoLab)'],
  useFor: 'Premium annual-report / ESG / investor / energy / budget numbers built as countable physical objects.',
  durationInFrames: 220,
  defaultProps: {
    series: [
      {label: 'Series A', material: 'aluminium', value: 420},
      {label: 'Series B', material: 'acrylic', value: 260},
    ],
    unit: 10,
    unitLabel: 'GW',
    rulerEvery: 10,
    feedSeries: 0,
    feedValue: 120,
    title: 'Built, plate by plate',
    sourceLine: 'SOURCE: ANNUAL CAPACITY REPORT · 2026',
    background: '#e2d5c4',
    accent: '#d4521c',
    seed: 7,
  },
  propDocs: {
    series: 'stacks: {label, material: aluminium|acrylic|brass|oak|stone|copper, value}',
    unit: 'value represented by one plate',
    unitLabel: 'unit text shown after values',
    rulerEvery: 'every Nth plate is brass (a physical ruler)',
    feedSeries: 'index of the series fed plate-by-plate at the end (−1 = none)',
    feedValue: 'how much value arrives during the feed',
    title: 'headline top-left',
    sourceLine: 'small mono source credit bottom-left',
    background: 'studio sweep colour',
    accent: 'underline / verdict accent',
    seed: 'jitter seed',
  },
  component: StackPlates3D,
  tags: ['3d', 'data', 'physicalization', 'plates', 'stack', 'counter', 'studio', 'premium', 'report', 'brass', 'walnut', 'data-physical'],
});
