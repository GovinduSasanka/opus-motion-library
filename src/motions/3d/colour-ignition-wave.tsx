// Technique after mg-styles-15/demos/03-isometric (world.js clayMat / flash delay / two-faced tiles, main.js drop punch;
// MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md. Own implementation in @remotion/three.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ISO, ISO_MAP, IsoLights, IsoPiece, IsoSlab, IsoStage, IsoState, IsoTower, OrthoRig, buildIsoCity, clamp01, inv, lerp, E} from '../../core/r2-mg1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  map: string[];
  background: string[];
  igniteAt: number;
  origin: number[];
  speed: number;
  climbSpeed: number;
  clayColor: string;
  scanColor: string;
  zoomKick: boolean;
  zoom: number;
  seed: number;
};

const SQ2 = Math.SQRT2;

const ColourIgnitionWave: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h} = useStage();
  const t = frame / 30;
  const map = p.map && p.map.length ? p.map : ISO_MAP;
  const els = React.useMemo(() => buildIsoCity(map, p.seed), [map, p.seed]);
  const N = map.length;
  const M = Math.max(...map.map((r) => r.length));
  const span = Math.max(N, M);
  const ox = p.origin?.[0] ?? 0;
  const oz = p.origin?.[1] ?? 0;
  const T0 = p.igniteAt;
  const tau = t - T0;
  const clay = {base: p.clayColor, grass: mixC(p.clayColor, '#D8D2EE'), road: mixC(p.clayColor, '#BDB7DE')};

  const stateOf = (el: (typeof els)[number]): IsoState => {
    const d = Math.hypot(el.x - ox, el.z - oz);
    const arrive = d / p.speed;
    const local = tau - arrive;
    if (el.kind === 'tile') {
      // tiles hop and flip over to their coloured underside as the front passes
      const q = clamp01(local / 0.28);
      const flip = el.ch === 'g' || el.ch === 'w' || el.ch === 'r' || el.ch === 't' || el.ch === 'h' || el.ch === 's' || el.ch === 'u';
      return {grow: 1, rot: flip ? Math.PI * E.io2(q) : 0, lift: flip ? 0.35 * Math.sin(Math.PI * q) : 0, color: flip ? (q > 0.5 ? 1 : 0) : q > 0 ? 1 : 0, flash: local > 0 && local < 0.15 ? 0.7 * (1 - local / 0.15) : 0};
    }
    const delay = (el.kind === 'bldg' || el.kind === 'round' ? 0 : 0.05) + el.h / 14;
    const climb = local - delay < 0 ? 0 : ((local - delay) * p.climbSpeed) / Math.max(0.3, el.h);
    return {grow: 1, roof: 1, color: Math.min(1, climb), lit: clamp01((local - delay - el.h / p.climbSpeed - 0.15) / 0.3)};
  };
  const towerEl = els.find((e) => e.kind === 'tower');
  const towerFlash = tau > -0.07 && tau < 0.4 ? Math.exp(-Math.max(0, tau) * 8) : 0;
  const towerColor = tau < 0 ? 0 : clamp01((tau * p.climbSpeed) / 6.4);

  // exposure: dip −0.15 over 0.07 s before the hit, then +0.3 decaying e^(−30τ)
  const dip = tau > -0.07 && tau < 0 ? 0.15 * (1 + tau / 0.07) : 0;
  const flash = tau >= 0 ? 0.3 * Math.exp(-30 * tau) : 0;
  const kick = p.zoomKick && tau >= 0 ? 0.035 * Math.exp(-tau * 7) * Math.cos(tau * 18) : 0;
  const push = 1 + 0.05 * E.io2(clamp01(t / 5));
  const fitZoom = Math.min(w / (span * SQ2 * 0.95), h / (span * 0.82 + 3.4)) * p.zoom;
  const zoom = fitZoom * push * (1 + kick);

  // ground pulse ring
  const R = Math.max(0.01, tau * p.speed);
  const ringOp = tau > 0 ? clamp01(1 - R / (span * 0.85)) : 0;
  const bg = p.background;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${bg[0]} 0%, ${bg[1] ?? bg[0]} 55%, ${bg[2] ?? bg[1] ?? bg[0]} 100%)`}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 55%, ${ISO.cyan}55 0%, transparent ${lerp(10, 70, clamp01(tau / 1.2))}%)`,
          opacity: tau > 0 ? 0.6 * Math.exp(-tau * 1.5) : 0,
        }}
      />
      <IsoStage>
        <OrthoRig target={[0, 1.2, 0]} zoom={zoom} />
        <IsoLights extent={span} />
        <IsoSlab n={N} m={M} grow={1} />
        {els.map((el, i) => (el.kind === 'tower' ? null : <IsoPiece key={i} el={el} st={stateOf(el)} t={t} clay={clay} scan={p.scanColor} />))}
        {towerEl && <IsoTower el={towerEl} segs={[1, 1, 1, 1]} antenna={1} glow={Math.max(towerFlash, towerColor * (0.75 + 0.25 * Math.sin(t * 5)))} t={t} clayColor={p.clayColor} color={towerColor >= 0.5 ? 1 : 0} />}
        {ringOp > 0 && (
          <>
            <mesh position={[ox, 0.16, oz]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.max(0, R - 0.16), R, 128]} />
              <meshBasicMaterial color={p.scanColor} transparent opacity={ringOp} />
            </mesh>
            <mesh position={[ox, 0.155, oz]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.max(0, R - 1.1), Math.max(0.02, R - 0.16), 128]} />
              <meshBasicMaterial color={p.scanColor} transparent opacity={ringOp * 0.22} />
            </mesh>
          </>
        )}
      </IsoStage>
      <AbsoluteFill style={{background: '#000', opacity: dip, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
const mixC = (a: string, b: string) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round((v + pb[i]) / 2).toString(16).padStart(2, '0')).join('');
};

export const colourIgnitionWave = defineMotion<Props>({
  id: 'colour-ignition-wave',
  title: 'Colour ignition wave',
  category: '3d',
  description:
    'A matte white clay isometric city waits; the exposure dips, the hero tower flashes and a cyan pulse ring races out across the ground — as it reaches each object, colour climbs its facade from the ground behind a thin bright scan line, empty tiles hop and flip to their coloured undersides, windows light and the camera kicks.',
  source: ['mg-styles-15 03-isometric 6.0-6.5 s, world.js clayMat / flash delay / two-faced tiles (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'A universal "before → after / switched on / launch" hero moment for product, city, platform and data dioramas.',
  durationInFrames: 150,
  defaultProps: {
    map: ISO_MAP,
    background: ['#EEEAFC', '#DAD3F7', '#C4BAEF'],
    igniteAt: 1.4,
    origin: [0, 0],
    speed: 6.5,
    climbSpeed: 9,
    clayColor: '#F1EEFA',
    scanColor: '#62F0F2',
    zoomKick: true,
    zoom: 1,
    seed: 1,
  },
  propDocs: {
    map: 'rows of map chars (see iso-city-build): r road, b block, p plaza, c core, w water, t tree, h house, s solar, u turbine, g grass',
    background: 'background gradient stops',
    igniteAt: 'seconds until the hit',
    origin: '[x, z] grid offset from the centre where the pulse starts',
    speed: 'pulse front speed in tiles per second',
    climbSpeed: 'how fast colour climbs a facade (tiles per second)',
    clayColor: 'pre-colour clay',
    scanColor: 'pulse ring / scan line colour',
    zoomKick: 'camera punch on the hit',
    zoom: 'camera zoom multiplier',
    seed: 'building heights / colours seed',
  },
  component: ColourIgnitionWave,
  tags: ['ignition', 'colour wave', 'reveal', 'before after', 'switch on', 'clay', 'isometric', 'iso', 'city', 'pulse', 'shockwave', 'scan line', '3d', 'three.js', 'hero moment', 'launch', 'mg-styles-15', 'iso-diorama'],
});
