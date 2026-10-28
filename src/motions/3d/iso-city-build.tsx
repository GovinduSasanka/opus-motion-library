// Technique after mg-styles-15/demos/03-isometric (world.js / main.js / anim.js, MIT, © Vincentwei1021)
// — see THIRD_PARTY_NOTICES.md. Own implementation in @remotion/three.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  ISO,
  ISO_MAP,
  IsoCloud,
  IsoLights,
  IsoPiece,
  IsoSlab,
  IsoStage,
  IsoState,
  IsoTower,
  OrthoRig,
  buildIsoCity,
  clamp01,
  hs,
  inv,
  lerp,
  springT,
  tileDrop,
  E,
} from '../../core/r2-mg1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  map: string[];
  background: string[];
  heroTower: boolean;
  traffic: number;
  drones: number;
  clouds: boolean;
  pullback: boolean;
  pullTo: 'top-right' | 'center' | 'top-left';
  speed: number;
  zoom: number;
  seed: number;
};

const SQ2 = Math.SQRT2;
const SQ6 = Math.sqrt(6);

const IsoCityBuild: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const t = (frame / 30) * p.speed;
  const els = React.useMemo(() => buildIsoCity(p.map && p.map.length ? p.map : ISO_MAP, p.seed), [p.map, p.seed]);
  const N = (p.map && p.map.length ? p.map : ISO_MAP).length;
  const M = Math.max(...(p.map && p.map.length ? p.map : ISO_MAP).map((r) => r.length));
  const span = Math.max(N, M);
  const sxMax = (span / 2) * SQ2;

  // ---- timeline (seconds) -----------------------------------------------------------------------
  const ringEvery = 0.2;
  const maxRing = Math.ceil(span / 2);
  const tilesEnd = 0.1 + maxRing * ringEvery + 0.5;
  const buildA = tilesEnd + 0.3;
  const buildB = buildA + 2.6;
  const towerA = buildB - 0.4;
  const igniteAt = towerA + 1.3;
  const pullA = 7.75;
  const pullB = 8.75;

  const stateOf = (el: (typeof els)[number]): IsoState => {
    if (el.kind === 'tile') {
      const t0 = 0.1 + el.ring * ringEvery + ((el.ang + Math.PI) / (Math.PI * 2)) * 0.07 * (el.ring + 1);
      const d = tileDrop(t - t0);
      if (!d.vis) return {grow: 0};
      const rim = clamp01(1 - (t - t0 - 0.3) / 0.2);
      return {grow: 1, lift: d.lift, rot: d.rot, sq: d.sq, flash: t - t0 > 0.28 ? rim : 0};
    }
    const front = (el.sx + sxMax) / (2 * sxMax);
    if (el.kind === 'tower') return {grow: 1};
    const st = (el.kind === 'tree' || el.kind === 'solar' || el.kind === 'house' || el.kind === 'turbine' ? buildA - 0.2 : buildA) + front * (buildB - buildA) + hs(el.seed, 9) * 0.19;
    const k = (t - st) / 1;
    const grow = k <= 0 ? 0 : springT(k, el.kind === 'tree' ? 3 : 2.1, 0.45);
    const roof = k <= 0.375 ? 0 : springT(k - 0.375, 3, 0.5);
    const lit = clamp01((t - igniteAt - el.dist * 0.06) / 0.3);
    return {grow, roof, lit};
  };

  const towerEl = els.find((e) => e.kind === 'tower');
  const segs = [0, 1, 2, 3].map((k) => (p.heroTower ? springT(t - towerA - k * 0.25, 2.6, 0.5) : 0));
  const antenna = p.heroTower ? springT(t - towerA - 1.0, 3, 0.55) : 0;
  const glow = clamp01((t - igniteAt) / 0.25) * (0.75 + 0.25 * Math.sin(t * 5));

  // ---- traffic on the ring road -----------------------------------------------------------------
  const ringR = (Math.min(N, M) - 1) / 2 - 1; // road ring half-size
  const loop = (q: number): [number, number, number] => {
    const L = 8 * ringR;
    let s = (((q % 1) + 1) % 1) * L;
    const leg = 2 * ringR;
    if (s < leg) return [-ringR + s, -ringR, 0];
    s -= leg;
    if (s < leg) return [ringR, -ringR + s, Math.PI / 2];
    s -= leg;
    if (s < leg) return [ringR - s, ringR, Math.PI];
    s -= leg;
    return [-ringR, ringR - s, -Math.PI / 2];
  };
  const carsOn = clamp01((t - (towerA + 0.3)) / 0.4);
  const cars = Array.from({length: Math.max(0, Math.round(p.traffic))}, (_, i) => {
    const q = i / Math.max(1, p.traffic) + (t - towerA) * 0.05 * (i % 2 ? 1 : -1);
    const [x, z, a] = loop(q);
    const lane = (i % 2 ? 0.18 : -0.18);
    const nx = Math.cos(a + Math.PI / 2) * lane;
    const nz = Math.sin(a + Math.PI / 2) * lane;
    return {x: x + nx, z: z + nz, a, c: ['#FF9E86', '#FFE6A1', '#FFFFFF', '#62F0F2'][i % 4]};
  });
  // drones carry packets from the tower top to downtown roofs
  const blds = els.filter((e) => e.kind === 'bldg' || e.kind === 'round');
  const drones = Array.from({length: Math.max(0, Math.round(p.drones))}, (_, i) => {
    const t0 = igniteAt + 0.4 + i * 0.25;
    const per = 2.2;
    const q = (t - t0) / per;
    if (q < 0 || !towerEl) return null;
    const target = blds[Math.floor(hs(p.seed, i, 4) * blds.length)] ?? towerEl;
    const ph = q % 1;
    const there = Math.floor(q) % 2 === 0;
    const a = there ? ph : 1 - ph;
    const sx = towerEl.x;
    const sz = towerEl.z;
    const x = lerp(sx, target.x, E.io2(a));
    const z = lerp(sz, target.z, E.io2(a));
    const y = lerp(4.2, target.h + 0.5, E.io2(a)) + Math.sin(a * Math.PI) * 1.2;
    return {x, y, z, i, carry: there};
  });

  // ---- camera ------------------------------------------------------------------------------------
  const fitZoom = Math.min(w / (span * SQ2 * 1.1), h / (span * 0.82 + 5)) * p.zoom;
  const push = 1 + 0.06 * E.io2(clamp01(inv(1, 6, t))) + 0.03 * Math.exp(-Math.max(0, t - igniteAt) * 6) * (t > igniteAt ? 1 : 0);
  const pullK = p.pullback ? E.io3(clamp01(inv(pullA, pullB, t))) : 0;
  const zoom = fitZoom * push * lerp(1, 0.66, pullK);
  // slide the island: screen-space shift in px -> world target offset
  const portrait = h > w;
  const shiftX = p.pullTo === 'center' ? 0 : (p.pullTo === 'top-right' ? 1 : -1) * (portrait ? 0 : w * 0.2);
  const shiftUp = p.pullTo === 'center' ? 0 : portrait ? h * 0.14 : h * 0.1;
  const ox = (shiftX * pullK) / zoom;
  const oy = (shiftUp * pullK) / zoom;
  const right = [1 / SQ2, 0, -1 / SQ2];
  const up = [-1 / SQ6, 2 / SQ6, -1 / SQ6];
  const ty = 1.1;
  const target: [number, number, number] = [-right[0] * ox - up[0] * oy, ty - right[1] * ox - up[1] * oy, -right[2] * ox - up[2] * oy];

  const bg = p.background;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${bg[0]} 0%, ${bg[1] ?? bg[0]} 55%, ${bg[2] ?? bg[1] ?? bg[0]} 100%)`}}>
      {/* blueprint dot grid before the tiles land */}
      <AbsoluteFill
        style={{
          opacity: 0.5 * (1 - clamp01(inv(0.6, 1.6, t))),
          backgroundImage: `radial-gradient(circle, ${ISO.cyan} ${1.6 * u}px, transparent ${1.8 * u}px)`,
          backgroundSize: `${48 * u}px ${28 * u}px`,
          backgroundPosition: 'center',
        }}
      />
      <IsoStage>
        <OrthoRig target={target} zoom={zoom} />
        <IsoLights extent={span} />
        <IsoSlab n={N} m={M} grow={E.out3(clamp01(inv(tilesEnd - 0.3, tilesEnd + 0.1, t)))} />
        {els.map((el, i) => (el.kind === 'tower' ? null : <IsoPiece key={i} el={el} st={stateOf(el)} t={t} />))}
        {towerEl && <IsoTower el={towerEl} segs={segs} antenna={antenna} glow={glow} t={t} />}
        {carsOn > 0 &&
          cars.map((c, i) => (
            <mesh key={'car' + i} position={[c.x, 0.1, c.z]} rotation={[0, -c.a, 0]} scale={[carsOn, carsOn, carsOn]} castShadow>
              <boxGeometry args={[0.32, 0.14, 0.16]} />
              <meshLambertMaterial color={c.c} />
            </mesh>
          ))}
        {drones.map(
          (d) =>
            d && (
              <group key={'dr' + d.i} position={[d.x, d.y, d.z]}>
                <mesh castShadow>
                  <boxGeometry args={[0.26, 0.06, 0.26]} />
                  <meshLambertMaterial color="#FFFFFF" />
                </mesh>
                {d.carry && (
                  <mesh position={[0, -0.12, 0]}>
                    <boxGeometry args={[0.13, 0.13, 0.13]} />
                    <meshBasicMaterial color={ISO.cyan} />
                  </mesh>
                )}
              </group>
            ),
        )}
        {p.clouds && (
          <>
            <IsoCloud x={-9 + t * 0.12} y={7.5} z={-9} s={1.3} />
            <IsoCloud x={4 - t * 0.1} y={8.5} z={-12} s={1} />
          </>
        )}
      </IsoStage>
    </AbsoluteFill>
  );
};

export const isoCityBuild = defineMotion<Props>({
  id: 'iso-city-build',
  title: 'Iso city build',
  category: '3d',
  description:
    'A pastel isometric island builds itself in true orthographic 3D: floor tiles fall in rings from the centre with spin, squash and a cyan rim flash, the soil slab slides under, buildings, houses, trees, solar fields and wind turbines grow along a sweep front with overshoot and lagged roofs, a navy hero tower stacks in segments and lights up, windows glow, cars loop the ring road, drones ferry packets, and the camera pulls back to float the island top-right.',
  source: ['mg-styles-15 03-isometric 0.0-8.8 s, world.js / main.js / anim.js (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'Smart-city, platform, ecosystem and architecture explainers; "watch it grow" openers; pass your own map rows and leave room for a title after the pull-back.',
  durationInFrames: 300,
  defaultProps: {
    map: ISO_MAP,
    background: ['#EEEAFC', '#DAD3F7', '#C4BAEF'],
    heroTower: true,
    traffic: 8,
    drones: 3,
    clouds: true,
    pullback: true,
    pullTo: 'center',
    speed: 1,
    zoom: 1,
    seed: 1,
  },
  propDocs: {
    map: "rows of map chars: r road, b block, p plaza, c core (2x2 hero tower), w water, t tree, h house, s solar, u turbine, g grass",
    background: 'background gradient stops (top -> bottom)',
    heroTower: 'stack the navy hero tower on the c cells',
    traffic: 'cars looping the ring road',
    drones: 'drones carrying packets from the tower',
    clouds: 'floating clouds',
    pullback: 'camera pulls back at 7.75 s to leave room for a title',
    pullTo: 'where the island floats after the pull-back: top-right | center | top-left',
    speed: 'timeline speed multiplier',
    zoom: 'camera zoom multiplier',
    seed: 'building heights / colours seed',
  },
  component: IsoCityBuild,
  tags: ['isometric', 'iso', 'city', 'diorama', 'miniature', 'build', 'grow', 'pastel', 'clay', '3d', 'three.js', 'orthographic', 'smart city', 'tower', 'traffic', 'drones', 'island', 'platform', 'mg-styles-15', 'iso-diorama'],
});
