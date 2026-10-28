// Adapted from lemo-opuscar/styles/lowpoly-island/demo/world.js l.175-177 + demo/sea.js beam-lit water (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  BeamRibbon,
  FacetSea,
  HexTile,
  LpLights,
  LpRig,
  LpSky,
  LpStage,
  Pine,
  TAU,
  cl,
  hexDisc,
  hexXZ,
  lerp,
  lpDrop,
  lpFrustum,
  lpRise,
  lpView,
  popCurve,
  sstep,
  todMix,
} from '../../core/r2-la3c-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * lowpoly-island beam: a soft volumetric beam (camera-facing additive ribbon: Gaussian across-profile, root-bright core,
 * a 2.4x wider halo at .32, tilted 7 deg down) sweeps like a clock hand from a lighthouse lamp, one turn per
 * `beatsPerTurn` beats, and the faceted sea under it lights in a band with per-facet sparkles. `overlay` draws only the
 * beam (transparent) so it can sweep over any host scene.
 */
type Props = {
  bpm: number;
  beatsPerTurn: number;
  startAngle: number;
  beamColor: string;
  beamLength: number;
  tiltDeg: number;
  beamWidth: number;
  intensity: number;
  lighthouse: boolean;
  overlay: boolean;
  timeStart: string;
  timeEnd: string;
  azimuthStart: number;
  azimuthEnd: number;
  elevation: number;
  zoom: number;
  seed: number;
};

const LAMP_Y = 2.82;

const LightBeamRibbon: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const t = frame / 30;
  const k = cl(frame / Math.max(1, durationInFrames - 1));
  const tod = todMix(p.timeStart, p.timeEnd, k);
  const az = lerp(p.azimuthStart, p.azimuthEnd, k);
  const el = p.elevation;
  const fh = lpFrustum(p.zoom, w / h);
  const V = lpView(az, el);
  const s2 = Math.sin((el * Math.PI) / 180) ** 2;
  const shift = (fh * 0.1) / Math.max(0.1, s2);
  const target: [number, number, number] = [V.up[0] * shift, 0, V.up[2] * shift];
  const sizeSea = Math.hypot((fh * (w / h)) / 2, fh / (2 * Math.sin((el * Math.PI) / 180))) * 2.15;

  const cells = React.useMemo(() => hexDisc(1).map(([q, r], i) => ({q, r, xz: hexXZ(q, r), d: Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r))})), []);
  const rise = cells.map((c, i) => lpRise(t - (0.25 + i * 0.1)));
  const land: number[] = [];
  if (!p.overlay) cells.forEach((c, i) => rise[i].k > 0.35 && land.push(c.xz[0], c.xz[1]));

  // ---- beam ----------------------------------------------------------------------------------------
  const tOn = 1.9;
  const on = sstep(tOn, tOn + 0.6, t) * (0.9 + 0.1 * Math.sin(t * 9));
  const turn = TAU / ((p.beatsPerTurn * 60) / p.bpm);
  const ang = (p.startAngle * Math.PI) / 180 + t * turn;
  const tilt = (p.tiltDeg * Math.PI) / 180;
  const dir: [number, number, number] = [Math.cos(ang) * Math.cos(tilt), -Math.sin(tilt), Math.sin(ang) * Math.cos(tilt)];
  const lamp: [number, number, number] = p.lighthouse ? [0, LAMP_Y, 0] : [0, 1.2, 0];
  const lampHere = lamp;
  const view: [number, number, number] = [V.pos[0], V.pos[1], V.pos[2]];
  const w1 = 0.55 * p.beamWidth;

  const lighthouse = () => {
    const parts: {y: number; h: number; r0: number; r1: number; c: string; t: number}[] = [
      {y: 0.62, h: 0.62, r0: 0.34, r1: 0.3, c: '#F6F2EA', t: 1.1},
      {y: 1.24, h: 0.5, r0: 0.3, r1: 0.27, c: '#D9544A', t: 1.25},
      {y: 1.74, h: 0.5, r0: 0.27, r1: 0.24, c: '#F6F2EA', t: 1.4},
      {y: 2.24, h: 0.36, r0: 0.24, r1: 0.22, c: '#D9544A', t: 1.55},
    ];
    const out: React.ReactNode[] = [];
    parts.forEach((q, i) => {
      const d = lpDrop(t - q.t, 0.2);
      if (!d.vis) return;
      out.push(
        <mesh key={i} position={[0, q.y + (q.h * d.sy) / 2 + d.fall * 3 + d.bounce, 0]} scale={[1 / Math.sqrt(d.sy), d.sy, 1 / Math.sqrt(d.sy)]} castShadow>
          <cylinderGeometry args={[q.r1, q.r0, q.h, 8]} />
          <meshStandardMaterial color={q.c} roughness={0.9} flatShading />
        </mesh>,
      );
    });
    const top = lpDrop(t - 1.7, 0.2);
    if (top.vis) {
      const dy = top.fall * 3 + top.bounce;
      out.push(
        <group key="top" position={[0, dy, 0]}>
          <mesh position={[0, 2.62, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 8]} />
            <meshStandardMaterial color="#4A4458" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 2.8, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.3, 8]} />
            <meshStandardMaterial color="#FFF1C0" emissive="#FFD98A" emissiveIntensity={0.25 + 2.2 * on} roughness={0.5} flatShading />
          </mesh>
          <mesh position={[0, 3.12, 0]} castShadow>
            <coneGeometry args={[0.26, 0.3, 8]} />
            <meshStandardMaterial color="#D9544A" roughness={0.9} flatShading />
          </mesh>
        </group>,
      );
    }
    return out;
  };

  return (
    <AbsoluteFill style={{background: p.overlay ? 'transparent' : undefined}}>
      {!p.overlay && <LpSky tod={tod} frame={frame} w={w} h={h} u={u} seed={p.seed} band={0.34} />}
      <LpStage>
        <LpRig target={target} az={az} el={el} fh={fh} />
        <LpLights tod={tod} extent={7} />
        {!p.overlay && (
          <FacetSea
            opts={{
              t,
              size: sizeSea,
              seg: 100,
              tod,
              az,
              el,
              fh,
              target,
              land,
              amp: 1,
              sparkle: 1.2,
              glint: 0.5,
              foam: 1,
              beam: on > 0.01 ? {x: lampHere[0], z: lampHere[2], ang, bw: 0.9, len: p.beamLength, int: 0.95 * on * p.intensity, col: p.beamColor} : null,
              haze: [-0.2, 0.5],
              band: 0.34,
              seed: p.seed,
            }}
          />
        )}
        {!p.overlay &&
          cells.map((c, i) => {
            const topH = c.d === 0 ? 0.62 : 0.34;
            return rise[i].k > 0 ? <HexTile key={i} x={c.xz[0]} z={c.xz[1]} top={lerp(-1.4, topH, rise[i].k) + rise[i].over} topColor={c.d === 0 ? '#93C96C' : '#F3DFAB'} sideColor={c.d === 0 ? '#C99C6E' : '#E2C68E'} /> : null;
          })}
        {!p.overlay && <Pine x={hexXZ(1, 0)[0] * 0.5} y={0.34} z={hexXZ(1, 0)[1] * 0.5 + 0.1} s={0.8} pop={popCurve(t - 1.0)} />}
        {!p.overlay && <Pine x={hexXZ(-1, 1)[0] * 0.55} y={0.34} z={hexXZ(-1, 1)[1] * 0.55} s={0.65} pop={popCurve(t - 1.05)} c1="#4F9C63" c2="#7FC36A" />}
        {p.lighthouse && lighthouse()}
        {on > 0.01 && (
          <>
            {/* halo: 2.4x wider at .32 */}
            <BeamRibbon from={lampHere} dir={dir} len={p.beamLength} w0={0.1 * 2.4} w1={w1 * 2.4} view={view} color={p.beamColor} alpha={0.32 * on * p.intensity} soft={4.5} />
            <BeamRibbon from={lampHere} dir={dir} len={p.beamLength} w0={0.1} w1={w1} view={view} color={p.beamColor} alpha={1.0 * on * p.intensity} soft={4.5} />
          </>
        )}
      </LpStage>
    </AbsoluteFill>
  );
};

export const lightBeamRibbon = defineMotion<Props>({
  id: 'light-beam-ribbon',
  title: 'Light beam ribbon',
  category: '3d',
  description:
    'A soft volumetric beam sweeps like a clock hand from a lighthouse lamp over a night sea: a camera-facing additive ribbon with a Gaussian profile, a root-bright core and a wide halo, tilted 7 degrees down, while the faceted water under it lights in a band with per-facet sparkles. An overlay mode draws only the beam.',
  source: ['lemo-opuscar styles/lowpoly-island demo/world.js l.175-177 + sea.js beam-lit water (MIT, LemoLab)'],
  useFor: 'Night scenes, "spotlight on X", searching / discovery / guidance metaphors, lighthouse and projector beats; overlay mode sweeps a beam across any host scene.',
  durationInFrames: 240,
  defaultProps: {
    bpm: 120,
    beatsPerTurn: 12,
    startAngle: -30,
    beamColor: '#FFE7A8',
    beamLength: 20,
    tiltDeg: 7,
    beamWidth: 1,
    intensity: 1,
    lighthouse: true,
    overlay: false,
    timeStart: 'dusk',
    timeEnd: 'night',
    azimuthStart: 35,
    azimuthEnd: 55,
    elevation: 25,
    zoom: 12,
    seed: 5,
  },
  propDocs: {
    bpm: 'tempo used to time the sweep',
    beatsPerTurn: 'beats for one full 360 degree turn (12 = a slow clock hand)',
    startAngle: 'beam azimuth at frame 0 (degrees, ground plane)',
    beamColor: 'beam hex colour',
    beamLength: 'beam length in world units',
    tiltDeg: 'degrees the beam points below horizontal',
    beamWidth: 'beam width multiplier',
    intensity: 'beam + water-glow strength',
    lighthouse: 'draw the lighthouse the beam comes from',
    overlay: 'draw only the beam on a transparent background (host scene shows through)',
    timeStart: 'time of day at the start: dawn | day | dusk | night',
    timeEnd: 'time of day at the end',
    azimuthStart: 'camera azimuth at the start',
    azimuthEnd: 'camera azimuth at the end',
    elevation: 'camera elevation (20-25 night shows more sky and stars)',
    zoom: 'orthographic frustum height',
    seed: 'facet jitter / star seed',
  },
  component: LightBeamRibbon,
  tags: ['light beam', 'beam', 'lighthouse', 'searchlight', 'spotlight', 'volumetric', 'ribbon', 'sweep', 'night', 'sea', 'low-poly', 'lowpoly', 'faceted', 'sparkle', 'additive', 'glow', 'discovery', 'searching', 'projector', 'three.js', '3d', 'overlay', 'lowpoly-island'],
});
