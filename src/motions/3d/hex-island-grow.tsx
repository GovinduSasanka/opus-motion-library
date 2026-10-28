// Adapted from lemo-opuscar/styles/lowpoly-island/demo/world.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {
  Boat,
  FacetSea,
  HexTile,
  LpLights,
  LpRig,
  LpSky,
  LpStage,
  Pine,
  RoundTree,
  cl,
  h1,
  hexDisc,
  hexDist,
  hexXZ,
  lerp,
  lpDrop,
  lpFrustum,
  lpRise,
  lpView,
  popCurve,
  prismGeo,
  todMix,
} from '../../core/r2-la3c-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * lowpoly-island growth: hex tiles rise one per 16th note out of a faceted sea with a splash ring (cubic ease .5 s,
 * damped overshoot), then houses stack floor by floor (fast fall, bounce, volume-preserving squash) and get prism
 * roofs, trees pop, a windmill turns, lamps light — while an orthographic camera turntables around the island and the
 * light drifts from day to dusk so the windows come on. One piece lands per slot; nothing overlaps in a slot.
 */
type Palette = {sand: string; sandSide: string; grass: string; earth: string; walls: string[]; roofs: string[]; pine: string[]; leaves: string[]};
type Props = {
  radius: number;
  buildings: number;
  trees: number;
  windmill: boolean;
  lamps: number;
  boat: boolean;
  bpm: number;
  azimuthStart: number;
  azimuthEnd: number;
  elevation: number;
  zoom: number;
  timeStart: string;
  timeEnd: string;
  seed: number;
  palette: Palette;
};

const PAL: Palette = {
  sand: '#F3DFAB',
  sandSide: '#E2C68E',
  grass: '#93C96C',
  earth: '#C99C6E',
  walls: ['#FBF3E6', '#F5C2B0', '#B5DCCB', '#A9CBE8', '#F7DF8F', '#E9C9E6'],
  roofs: ['#D9644A', '#4F7FB8', '#E0874F', '#6A5A8E', '#3F8F86'],
  pine: ['#3F8A5A', '#4F9C63'],
  leaves: ['#7FC36A', '#9AD06F'],
};

type Item =
  | {kind: 'tile'; i: number; t: number}
  | {kind: 'house'; cell: number; floors: number; wall: string; roof: string; flip: boolean; t: number[]; tr: number}
  | {kind: 'tree'; cell: number; round: boolean; c: number; t: number; dx: number; dz: number; s: number}
  | {kind: 'mill'; cell: number; t: number}
  | {kind: 'lamp'; cell: number; t: number; dx: number; dz: number};

const FLOOR = 0.62;

const HexIslandGrow: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const t = frame / 30;
  const k = cl(frame / Math.max(1, durationInFrames - 1));
  const pal = {...PAL, ...(p.palette || {})};
  const slot = 60 / p.bpm / 4; // 16th
  const R = Math.max(1, Math.round(p.radius));

  const plan = React.useMemo(() => {
    const cells = hexDisc(R)
      .map(([q, r]) => ({q, r, d: hexDist(q, r), xz: hexXZ(q, r), a: Math.atan2(hexXZ(q, r)[1], hexXZ(q, r)[0])}))
      .sort((a, b) => a.d - b.d || a.a - b.a);
    const tops = cells.map((c, i) => (c.d === R ? 0.3 : 0.5 + h1(i, p.seed, 1) * 0.42));
    const items: Item[] = [];
    let tt = 0.35;
    cells.forEach((c, i) => {
      items.push({kind: 'tile', i, t: tt});
      tt += slot;
    });
    tt += slot * 2;
    // choose cells (grass cells only, shuffled)
    const grass = cells.map((c, i) => ({c, i})).filter((x) => x.c.d < R);
    const order = grass.slice().sort((a, b) => h1(a.i, p.seed, 9) - h1(b.i, p.seed, 9));
    let n = 0;
    for (let b = 0; b < p.buildings && n < order.length; b++, n++) {
      const cell = order[n].i;
      const floors = 1 + Math.floor(h1(cell, p.seed, 3) * 3);
      const times: number[] = [];
      for (let f = 0; f < floors; f++) {
        times.push(tt);
        tt += slot * 2;
      }
      const tr = tt;
      tt += slot * 2;
      items.push({kind: 'house', cell, floors, wall: pal.walls[Math.floor(h1(cell, p.seed, 4) * pal.walls.length)], roof: pal.roofs[Math.floor(h1(cell, p.seed, 5) * pal.roofs.length)], flip: h1(cell, p.seed, 6) > 0.5, t: times, tr});
    }
    if (p.windmill && n < order.length) {
      items.push({kind: 'mill', cell: order[n].i, t: tt});
      tt += slot * 2;
      n++;
    }
    for (let l = 0; l < p.lamps && n < order.length; l++, n++) {
      items.push({kind: 'lamp', cell: order[n].i, t: tt, dx: 0.32, dz: 0.2});
      tt += slot;
    }
    // trees: also on cells already holding things (offset) + any remaining
    let tc = 0;
    for (let q = 0; q < p.trees; q++) {
      const ordIdx = n < order.length ? n++ : q % order.length;
      const cell = order[ordIdx].i;
      const spread = n >= order.length ? 1 : 0;
      tc++;
      items.push({kind: 'tree', cell, round: h1(cell, p.seed, 7 + q) > 0.55, c: tc, t: tt, dx: spread ? (h1(q, 2) - 0.5) * 0.8 : 0.0, dz: spread ? (h1(q, 3) - 0.5) * 0.6 : 0.0, s: 0.9 + h1(q, p.seed, 8) * 0.4});
      tt += slot;
    }
    return {cells, tops, items, end: tt};
  }, [R, p.buildings, p.trees, p.windmill, p.lamps, p.seed, slot, pal.walls, pal.roofs]);

  const fh = lpFrustum(p.zoom, w / h);
  const az = lerp(p.azimuthStart, p.azimuthEnd, k * k * (3 - 2 * k));
  const el = p.elevation;
  const V = lpView(az, el);
  const tod = todMix(p.timeStart, p.timeEnd, cl((t - plan.end * 0.55) / Math.max(1, 10 - plan.end * 0.55)));
  const shift = (fh * 0.06) / Math.max(0.1, Math.sin((el * Math.PI) / 180) ** 2);
  const target: [number, number, number] = [V.up[0] * shift, 0.6, V.up[2] * shift];
  const sizeSea = Math.hypot((fh * (w / h)) / 2, fh / (2 * Math.sin((el * Math.PI) / 180))) * 2.15;

  const rises = plan.cells.map((_, i) => lpRise(t - (plan.items[i] as any).t));
  const land: number[] = [];
  plan.cells.forEach((c, i) => rises[i].k > 0.35 && land.push(c.xz[0], c.xz[1]));

  const prism = React.useMemo(() => prismGeo(0.9, 0.5, 0.86), []);
  const baseY = (cell: number) => plan.tops[cell];
  const boatAng = 1.2 + t * 0.3;
  const BR = R * 1.5 + 2.6;
  const bx = Math.cos(boatAng) * BR;
  const bz = Math.sin(boatAng) * BR * 0.85;
  const heading = Math.atan2(Math.cos(boatAng) * BR * 0.85, -Math.sin(boatAng) * BR);
  const glow = tod.glow;
  const winMat = (
    <meshStandardMaterial color="#E4D9BE" emissive="#FFC676" emissiveIntensity={glow * 1.6} roughness={0.8} flatShading />
  );

  const pieces: React.ReactNode[] = [];
  plan.items.forEach((it, idx) => {
    if (it.kind === 'tile') {
      const c = plan.cells[it.i];
      const rs = rises[it.i];
      if (rs.k <= 0) return;
      const topH = plan.tops[it.i];
      const top = lerp(-1.4, topH, rs.k) + rs.over;
      const s = t - it.t;
      // splash ring
      const q = (s - 0.05) / 0.6;
      pieces.push(<HexTile key={'t' + idx} x={c.xz[0]} z={c.xz[1]} top={top} topColor={c.d === R ? pal.sand : pal.grass} sideColor={c.d === R ? pal.sandSide : pal.earth} />);
      if (q > 0 && q < 1)
        pieces.push(
          <mesh key={'r' + idx} position={[c.xz[0], 0.06, c.xz[1]]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + q * 1.1}>
            <ringGeometry args={[0.9, 1.04, 24]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.65 * (1 - q) * (1 - q)} depthWrite={false} toneMapped={false} />
          </mesh>,
        );
    } else if (it.kind === 'house') {
      const c = plan.cells[it.cell];
      const top = baseY(it.cell);
      for (let f = 0; f < it.floors; f++) {
        const d = lpDrop(t - it.t[f]);
        if (!d.vis) continue;
        const yc = top + f * FLOOR + (FLOOR * d.sy) / 2 + d.fall * 3 + d.bounce;
        pieces.push(
          <group key={`h${idx}f${f}`} position={[c.xz[0], yc, c.xz[1]]} scale={[1 / Math.sqrt(d.sy), d.sy, 1 / Math.sqrt(d.sy)]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.8, FLOOR, 0.8]} />
              <meshStandardMaterial color={it.wall} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0.2, 0.02, 0.405]}>
              <boxGeometry args={[0.17, 0.2, 0.02]} />
              {winMat}
            </mesh>
            <mesh position={[-0.2, 0.02, 0.405]}>
              <boxGeometry args={[0.17, 0.2, 0.02]} />
              {winMat}
            </mesh>
            <mesh position={[0.405, 0.02, 0]}>
              <boxGeometry args={[0.02, 0.2, 0.2]} />
              {winMat}
            </mesh>
          </group>,
        );
      }
      const dr = lpDrop(t - it.tr, 0.2);
      if (dr.vis) {
        const y0 = top + it.floors * FLOOR + dr.fall * 3 + dr.bounce;
        pieces.push(
          <mesh key={`h${idx}r`} geometry={prism} position={[c.xz[0], y0 - (1 - dr.sy) * 0.1, c.xz[1]]} rotation={[0, it.flip ? Math.PI / 2 : 0, 0]} scale={[1 / Math.sqrt(dr.sy), dr.sy, 1 / Math.sqrt(dr.sy)]} castShadow>
            <meshStandardMaterial color={it.roof} roughness={0.9} flatShading side={THREE.DoubleSide} />
          </mesh>,
        );
      }
    } else if (it.kind === 'tree') {
      const c = plan.cells[it.cell];
      const pop = popCurve(t - it.t);
      if (pop <= 0) return;
      const x = c.xz[0] + (it.dx || 0) + 0.28;
      const z = c.xz[1] + (it.dz || 0) - 0.25;
      pieces.push(
        it.round ? (
          <RoundTree key={'tr' + idx} x={x} y={baseY(it.cell)} z={z} s={it.s} pop={pop} c1={pal.leaves[it.c % pal.leaves.length]} />
        ) : (
          <Pine key={'tr' + idx} x={x} y={baseY(it.cell)} z={z} s={it.s * 1.1} pop={pop} c1={pal.pine[0]} c2={pal.pine[1]} />
        ),
      );
    } else if (it.kind === 'mill') {
      const c = plan.cells[it.cell];
      const d = lpDrop(t - it.t, 0.24);
      if (!d.vis) return;
      const top = baseY(it.cell) + d.fall * 3 + d.bounce;
      const spin = t * 1.4;
      pieces.push(
        <group key={'m' + idx} position={[c.xz[0], top, c.xz[1]]} scale={[1 / Math.sqrt(d.sy), d.sy, 1 / Math.sqrt(d.sy)]}>
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 1.3, 6]} />
            <meshStandardMaterial color="#FBF3E6" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 1.5, 0]} castShadow>
            <coneGeometry args={[0.3, 0.34, 6]} />
            <meshStandardMaterial color="#D9644A" roughness={0.9} flatShading />
          </mesh>
          <group position={[0.0, 1.22, 0.3]} rotation={[0, 0, spin]}>
            {[0, 1, 2, 3].map((b) => (
              <mesh key={b} position={[0, 0, 0]} rotation={[0, 0, (b * Math.PI) / 2]}>
                <boxGeometry args={[0.1, 1.2, 0.03]} />
                <meshStandardMaterial color="#F7DF8F" roughness={0.9} flatShading />
              </mesh>
            ))}
            <mesh>
              <sphereGeometry args={[0.07, 6, 4]} />
              <meshStandardMaterial color="#6B5A48" flatShading />
            </mesh>
          </group>
        </group>,
      );
    } else if (it.kind === 'lamp') {
      const c = plan.cells[it.cell];
      const pop = popCurve(t - it.t);
      if (pop <= 0) return;
      pieces.push(
        <group key={'l' + idx} position={[c.xz[0] + it.dx, baseY(it.cell), c.xz[1] + it.dz]} scale={pop}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.035, 0.6, 5]} />
            <meshStandardMaterial color="#4A4458" flatShading />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <icosahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#FFF1CC" emissive="#FFC676" emissiveIntensity={0.25 + glow * 2} flatShading />
          </mesh>
        </group>,
      );
    }
  });

  return (
    <AbsoluteFill>
      <LpSky tod={tod} frame={frame} w={w} h={h} u={u} seed={p.seed} band={0.34} />
      <LpStage>
        <LpRig target={target} az={az} el={el} fh={fh} />
        <LpLights tod={tod} extent={R * 2.6 + 3} />
        <FacetSea opts={{t, size: sizeSea, seg: 100, tod, az, el, fh, target, land, amp: 1, sparkle: 1, glint: 0.5, foam: 1, beam: null, haze: [-0.2, 0.5], band: 0.34, seed: 3}} />
        {pieces}
        {p.boat && t > plan.end * 0.6 && <Boat x={bx} z={bz} t={t} heading={heading} s={1.5 * popCurve(t - plan.end * 0.6)} />}
      </LpStage>
    </AbsoluteFill>
  );
};

export const hexIslandGrow = defineMotion<Props>({
  id: 'hex-island-grow',
  title: 'Hex island grow',
  category: '3d',
  description:
    'A flat-shaded low-poly hex island builds itself in an orthographic turntable: tiles rise from a faceted sea with a splash ring and damped overshoot, houses stack floor by floor with bounce and squash and get prism roofs, trees pop, a windmill turns, lamps and windows light as the day drifts to dusk.',
  source: ['lemo-opuscar styles/lowpoly-island demo/world.js (MIT, LemoLab) — hex layout, rise/drop/pop arrival curves, one event per slot'],
  useFor: '"Growth" stories — a startup year, city planning, community, a product ecosystem; a satisfying loop for websites; pair with the faceted-sea look.',
  durationInFrames: 300,
  defaultProps: {radius: 2, buildings: 5, trees: 6, windmill: true, lamps: 2, boat: true, bpm: 120, azimuthStart: 40, azimuthEnd: 95, elevation: 33, zoom: 9.5, timeStart: 'day', timeEnd: 'dusk', seed: 7, palette: PAL},
  propDocs: {
    radius: 'island radius in hex rings (1-3); 2 = 19 tiles',
    buildings: 'number of houses (1-3 floors each, prism roofs)',
    trees: 'number of pines / round trees',
    windmill: 'add a turning windmill',
    lamps: 'number of lamp posts (glow at dusk)',
    boat: 'a boat sails around the island once it is built',
    bpm: 'build tempo: one tile per 16th note, floors per 8th',
    azimuthStart: 'camera azimuth at the start (degrees)',
    azimuthEnd: 'camera azimuth at the end (turntable sweep)',
    elevation: 'camera elevation (30-35 build view)',
    zoom: 'orthographic frustum height (12-16 island scale)',
    timeStart: 'time of day at the start: dawn | day | dusk | night',
    timeEnd: 'time of day at the end (windows light as it darkens)',
    seed: 'layout / heights / colours seed',
    palette: 'sand, sandSide, grass, earth, walls[], roofs[], pine[], leaves[] hex colours',
  },
  component: HexIslandGrow,
  tags: ['low-poly', 'lowpoly', 'hex', 'island', 'grow', 'build', 'timelapse', 'isometric', 'orthographic', 'diorama', 'houses', 'trees', 'windmill', 'turntable', 'pastel', 'three.js', '3d', 'growth', 'city planning', 'startup', 'community', 'ecosystem', 'loop', 'time of day', 'lowpoly-island'],
});
