import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {ease, prog} from '../../core/ease';
import {hash01, mixHex, shade} from '../../core/r2-pr2-kit';
import {CameraRig, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * Section build (3D cross-section diorama). Reverse-engineered from the survival/build Shorts that pull 5–31M views
 * (2026-11-20 study): a side cut-away of the ground under a backyard (house, trees and fence behind), one continuous
 * camera, and the build happens on screen step by step — the hole is dug, walls rise, beams drop, a ladder and pipes go
 * in, air arrows flow, shelves fill, a little person climbs in, a clock spins for "time passes".
 * A storyboard plays one scene per narration line with the SAME `steps` and an increasing `stage`: everything before
 * `stage` is already built, step `stage` animates during the scene. That keeps one unbroken shot across scene cuts.
 */
type Op =
  | {type: 'dig'; x: number; w: number; depth: number; pile?: number}
  | {type: 'box'; id?: string; x: number; y: number; w: number; h: number; d?: number; z?: number; color?: string; anim?: 'drop' | 'rise' | 'slide' | 'grow' | 'fade'; from?: number; delay?: number}
  | {type: 'pipe'; x: number; y0: number; y1: number; r?: number; color?: string; bend?: number; delay?: number}
  | {type: 'ladder'; x: number; y0: number; y1: number; delay?: number}
  | {type: 'person'; x: number; y: number; toX?: number; toY?: number; shirt?: string; delay?: number}
  | {type: 'arrows'; x0: number; y0: number; x1: number; y1: number; color?: string; n?: number; delay?: number}
  | {type: 'shelf'; x: number; y: number; w: number; h: number; rows?: number; produce?: string[]; delay?: number}
  | {type: 'sun'; on: boolean}
  | {type: 'clock'}
  | {type: 'label'; text: string; x: number; y: number; delay?: number};
type Step = {ops: Op[]; cam?: {x: number; y: number; dist: number}};
type Props = {steps: Step[]; stage: number; dur: number; delay: number; t0?: number; len?: number; sky: string; sky2: string; soil: string; soil2: string; grass: string; houseColor: string; roofColor: string};

const WORLD_W = 9;
const GROUND_D = 3.2;
const BOTTOM = -9;

const soilTexture = (a: string, b: string) => {
  const W = 256;
  const H = 256;
  const data = new Uint8Array(W * H * 4);
  // hex -> sRGB bytes directly (THREE.Color would hand back linear values and darken the texture twice)
  const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const A = hx(a);
  const B = hx(b);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // clumpy soil: layered noise + small pebbles
      const n = hash01(Math.floor(x / 6), Math.floor(y / 6), 3) * 0.5 + hash01(Math.floor(x / 2), Math.floor(y / 2), 9) * 0.3 + hash01(x, y, 1) * 0.2;
      const peb = hash01(Math.floor(x / 9), Math.floor(y / 9), 5) > 0.93 ? 0.25 : 0;
      const t = Math.min(1, n + peb);
      const i = (y * W + x) * 4;
      data[i] = A[0] + (B[0] - A[0]) * t;
      data[i + 1] = A[1] + (B[1] - A[1]) * t;
      data[i + 2] = A[2] + (B[2] - A[2]) * t;
      data[i + 3] = 255;
    }
  const t = new THREE.DataTexture(data, W, H);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
};

const Bx: React.FC<{p: V3; s: V3; c: string; map?: THREE.Texture; rough?: number; emissive?: string; ei?: number; opacity?: number}> = ({p, s, c, map, rough = 0.9, emissive, ei = 0, opacity = 1}) => (
  <mesh position={p} castShadow receiveShadow>
    <boxGeometry args={[Math.max(0.001, s[0]), Math.max(0.001, s[1]), Math.max(0.001, s[2])]} />
    <meshStandardMaterial color={c} map={map ?? null} roughness={rough} emissive={emissive ?? '#000000'} emissiveIntensity={ei} transparent={opacity < 1} opacity={opacity} />
  </mesh>
);

/** a soil block whose texture is scaled to its size, so the cut face looks continuous */
const SoilBlock: React.FC<{x0: number; x1: number; y0: number; y1: number; tex: THREE.Texture; tint: string}> = ({x0, x1, y0, y1, tex, tint}) => {
  const w = x1 - x0;
  const h = y1 - y0;
  const map = useMemo(() => tex.clone(), [tex]);
  map.repeat.set(w / 2.2, h / 2.2);
  map.offset.set(x0 / 2.2, y0 / 2.2);
  map.needsUpdate = true;
  if (w <= 0.001 || h <= 0.001) return null;
  return <Bx p={[(x0 + x1) / 2, (y0 + y1) / 2, -GROUND_D / 2]} s={[w, h, GROUND_D]} c={tint} map={map} rough={1} />;
};

const Tree: React.FC<{p: V3; s?: number; c: string; r?: number}> = ({p, s = 1, c, r = 0}) => (
  <group position={p} scale={s} rotation={[0, 0, r]}>
    <Bx p={[0, 0.9, 0]} s={[0.22, 1.8, 0.22]} c="#6b4a2f" />
    {[0, 1, 2, 3].map((k) => (
      <mesh key={k} position={[(hash01(k, 1) - 0.5) * 0.9, 2.1 + hash01(k, 2) * 0.9, (hash01(k, 3) - 0.5) * 0.6]} castShadow>
        <icosahedronGeometry args={[0.75 + hash01(k, 4) * 0.25, 0]} />
        <meshStandardMaterial color={shade(c, (hash01(k, 5) - 0.5) * 0.25)} roughness={0.9} flatShading />
      </mesh>
    ))}
  </group>
);

const House: React.FC<{c: string; roof: string}> = ({c, roof}) => (
  <group position={[0.4, 0, -9]}>
    <Bx p={[0, 1.6, 0]} s={[6.5, 3.2, 3]} c={c} />
    <mesh position={[0, 3.95, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.62, 1, 0.75]} castShadow>
      <coneGeometry args={[3.6, 1.6, 4]} />
      <meshStandardMaterial color={roof} roughness={0.85} flatShading />
    </mesh>
    {[-2.2, -0.75, 0.75, 2.2].map((x) =>
      [1.0, 2.35].map((y) => <Bx key={`${x}${y}`} p={[x, y, 1.51]} s={[0.8, 0.85, 0.05]} c="#d9e7f2" emissive="#bcd6ea" ei={0.15} />),
    )}
    <Bx p={[0, 0.65, 1.52]} s={[0.9, 1.3, 0.05]} c={shade(roof, -0.1)} />
    <Bx p={[2.2, 4.2, -0.3]} s={[0.45, 1.2, 0.45]} c={shade(roof, -0.2)} />
  </group>
);

const Person: React.FC<{p: V3; walk: number; shirt: string}> = ({p, walk, shirt}) => {
  const sw = Math.sin(walk) * 0.5;
  return (
    <group position={p} scale={0.55}>
      <group position={[0, 0.9, 0]} rotation={[0, 0, sw * 0.6]}>
        <Bx p={[-0.12, -0.45, 0]} s={[0.2, 0.9, 0.22]} c="#2f3442" />
      </group>
      <group position={[0, 0.9, 0]} rotation={[0, 0, -sw * 0.6]}>
        <Bx p={[0.12, -0.45, 0]} s={[0.2, 0.9, 0.22]} c="#2f3442" />
      </group>
      <Bx p={[0, 1.35, 0]} s={[0.55, 0.9, 0.3]} c={shirt} />
      <group position={[-0.36, 1.7, 0]} rotation={[0, 0, -sw * 0.5]}>
        <Bx p={[0, -0.38, 0]} s={[0.15, 0.75, 0.18]} c={shirt} />
      </group>
      <group position={[0.36, 1.7, 0]} rotation={[0, 0, sw * 0.5]}>
        <Bx p={[0, -0.38, 0]} s={[0.15, 0.75, 0.18]} c={shirt} />
      </group>
      <mesh position={[0, 2.05, 0]} castShadow>
        <sphereGeometry args={[0.24, 18, 14]} />
        <meshStandardMaterial color="#e8b48e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.18, 0]}>
        <sphereGeometry args={[0.25, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.9} />
      </mesh>
    </group>
  );
};

const Arrow: React.FC<{p: V3; dir: number; c: string; s: number}> = ({p, dir, c, s}) => (
  <group position={p} rotation={[0, 0, dir]} scale={s}>
    <Bx p={[-0.18, 0, 0.3]} s={[0.36, 0.09, 0.05]} c={c} emissive={c} ei={0.7} />
    <mesh position={[0.06, 0, 0.3]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.14, 0.24, 3]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.7} />
    </mesh>
  </group>
);

const PRODUCE: Record<string, string> = {potato: '#b8925c', carrot: '#e8742a', apple: '#d1322f', jar: '#e3b23c', cabbage: '#7fb455'};

const Clock2D: React.FC<{t: number}> = ({t}) => (
  <svg viewBox="0 0 100 100" style={{position: 'absolute', left: '50%', top: '9%', width: 220, transform: 'translateX(-50%)', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}}>
    <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#1d1d1d" strokeWidth="4" />
    {Array.from({length: 12}, (_, i) => (
      <line key={i} x1="50" y1="9" x2="50" y2="15" stroke="#1d1d1d" strokeWidth="2.6" transform={`rotate(${i * 30} 50 50)`} />
    ))}
    <line x1="50" y1="50" x2="50" y2="28" stroke="#1d1d1d" strokeWidth="5" strokeLinecap="round" transform={`rotate(${t * 360} 50 50)`} />
    <line x1="50" y1="50" x2="50" y2="16" stroke="#d63a2f" strokeWidth="3" strokeLinecap="round" transform={`rotate(${t * 360 * 12} 50 50)`} />
    <circle cx="50" cy="50" r="4" fill="#1d1d1d" />
  </svg>
);

const SectionBuild: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const tex = useMemo(() => soilTexture(P.soil, P.soil2), [P.soil, P.soil2]);
  const steps = P.steps ?? [];
  const stage = Math.min(P.stage ?? 0, steps.length - 1);
  // progress of every op: earlier steps done (1), current step animates, later steps not yet (0)
  const pr = (si: number, delay = 0) => (si < stage ? 1 : si > stage ? 0 : prog(frame, P.delay + delay, P.delay + delay + P.dur, ease.inOut));
  const live = (si: number) => si <= stage;

  // camera: ease from the previous step's camera to this one's
  const camOf = (si: number) => {
    for (let k = si; k >= 0; k--) if (steps[k]?.cam) return steps[k].cam!;
    return {x: 0, y: -2, dist: 15};
  };
  const c0 = camOf(Math.max(0, stage - 1));
  const c1 = camOf(stage);
  // the camera travels for the whole step (not a quick move then a parked shot): the references keep ~88% of frames moving
  const ct = prog(frame, 0, Math.max(26, P.len ?? P.delay + P.dur), (t: number) => t * t * (3 - 2 * t));
  const cx = c0.x + (c1.x - c0.x) * ct;
  const cy = c0.y + (c1.y - c0.y) * ct;
  const cd = c0.dist + (c1.dist - c0.dist) * ct;
  // one clock for the whole video (t0 = scene start, passed by the storyboard): slow orbit/bob/push that never stops
  const G = (P.t0 ?? 0) + frame;
  const drift = Math.sin(G / 48) * 0.8;
  const bob = Math.cos(G / 64) * 0.3;
  const push = Math.sin(G / 80) * 1.1;

  // holes (dig ops) shape the soil blocks
  const holes: {x0: number; x1: number; depth: number}[] = [];
  const piles: {x: number; s: number}[] = [];
  steps.forEach((st, si) => {
    if (!live(si)) return;
    st.ops.forEach((o) => {
      if (o.type !== 'dig') return;
      const k = pr(si);
      holes.push({x0: o.x - o.w / 2, x1: o.x + o.w / 2, depth: o.depth * k});
      piles.push({x: o.pile ?? o.x + o.w / 2 + 1.1, s: k});
    });
  });
  holes.sort((a, b) => a.x0 - b.x0);
  const blocks: React.ReactNode[] = [];
  let cur = -WORLD_W;
  holes.forEach((h, i) => {
    blocks.push(<SoilBlock key={`l${i}`} x0={cur} x1={h.x0} y0={BOTTOM} y1={0} tex={tex} tint="#ffffff" />);
    blocks.push(<SoilBlock key={`b${i}`} x0={h.x0} x1={h.x1} y0={BOTTOM} y1={-h.depth} tex={tex} tint="#ffffff" />);
    cur = h.x1;
  });
  blocks.push(<SoilBlock key="last" x0={cur} x1={WORLD_W} y0={BOTTOM} y1={0} tex={tex} tint="#ffffff" />);
  // grass strips on the surface between holes
  const grass: React.ReactNode[] = [];
  let g0 = -WORLD_W;
  [...holes, {x0: WORLD_W, x1: WORLD_W, depth: 0}].forEach((h, i) => {
    if (h.x0 > g0) grass.push(<Bx key={`g${i}`} p={[(g0 + h.x0) / 2, 0.06, -GROUND_D / 2]} s={[h.x0 - g0, 0.14, GROUND_D + 0.02]} c={P.grass} />);
    g0 = Math.max(g0, h.x1);
  });

  const clockOn = steps[stage]?.ops.some((o) => o.type === 'clock');
  const sunOn = steps.slice(0, stage + 1).reduce((acc, st) => {
    const s = st.ops.find((o) => o.type === 'sun') as {type: 'sun'; on: boolean} | undefined;
    return s ? s.on : acc;
  }, false);
  const labels: React.ReactNode[] = [];

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${P.sky} 0%, ${P.sky2} 55%, ${shade(P.soil, -0.2)} 56%)`}}>
      <Stage3D shadows>
        <CameraRig position={[cx + drift, cy + 0.6 + bob, cd + push]} target={[cx + drift * 0.3, cy, -1.2]} fov={38} />
        {/* drifting clouds */}
        {[0, 1, 2, 3, 4].map((i) => {
          const x = (((G * 0.012 + i * 9) % 45) + 45) % 45 - 22;
          return (
            <group key={`cl${i}`} position={[x, 7 + (i % 3) * 1.3, -26 - (i % 2) * 6]}>
              <mesh scale={[2.6, 0.8, 1]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.45} roughness={1} /></mesh>
              <mesh position={[1.6, 0.25, 0]} scale={[1.6, 0.7, 1]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.45} roughness={1} /></mesh>
              <mesh position={[-1.5, 0.1, 0]} scale={[1.4, 0.6, 1]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#f4f7fb" emissive="#ffffff" emissiveIntensity={0.4} roughness={1} /></mesh>
            </group>
          );
        })}
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#dfefff', '#6b4a2f', 0.6]} />
        <directionalLight position={[-6, 12, 9]} intensity={sunOn ? 2.1 : 1.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={12} shadow-camera-bottom={-12} />
        {/* backyard behind the cut */}
        <Bx p={[0, -0.02, -12]} s={[60, 0.1, 18]} c={shade(P.grass, -0.08)} />
        <House c={P.houseColor} roof={P.roofColor} />
        <Tree p={[-5.5, 0, -6]} c="#4f8a3c" s={1.2}  r={Math.sin(G / 37 + 1) * 0.04} />
        <Tree p={[5.6, 0, -7]} c="#5c9443" s={1.35}  r={Math.sin(G / 44 + 2) * 0.04} />
        <Tree p={[-8, 0, -10]} c="#4a7f37" s={1.5}  r={Math.sin(G / 51 + 3) * 0.04} />
        {Array.from({length: 18}, (_, i) => <Bx key={`f${i}`} p={[-9 + i, 0.45, -4.2]} s={[0.12, 0.9, 0.1]} c="#a8835c" />)}
        <Bx p={[0, 0.75, -4.2]} s={[18, 0.1, 0.06]} c="#a8835c" />
        {/* the ground (cut-away) */}
        {blocks}
        {grass}
        {holes.map((h, i) => (
          <Bx key={`back${i}`} p={[(h.x0 + h.x1) / 2, -h.depth / 2, -GROUND_D + 0.01]} s={[h.x1 - h.x0, h.depth, 0.02]} c={shade(P.soil, -0.25)} />
        ))}
        {piles.map((p, i) => (
          <mesh key={`pile${i}`} position={[p.x, 0.1, -1.2]} scale={[1.1 * p.s + 0.001, 0.55 * p.s + 0.001, 0.9 * p.s + 0.001]} castShadow>
            <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={shade(P.soil, -0.05)} roughness={1} flatShading />
          </mesh>
        ))}
        {/* build ops */}
        {steps.flatMap((st, si) =>
          live(si)
            ? st.ops.map((o, oi) => {
                const key = `${si}-${oi}`;
                const k = pr(si, (o as {delay?: number}).delay ?? 0);
                if (o.type === 'box') {
                  const d = o.d ?? 1.2;
                  const z = o.z ?? -d / 2 - 0.1;
                  const c = o.color ?? '#b07a45';
                  const a = o.anim ?? 'drop';
                  if (k <= 0) return null;
                  if (a === 'drop') {
                    const y = o.y + (1 - ease.out(k)) * (o.from ?? 4);
                    return <Bx key={key} p={[o.x, y, z]} s={[o.w, o.h, d]} c={c} />;
                  }
                  if (a === 'rise') return <Bx key={key} p={[o.x, o.y - o.h / 2 + (o.h * k) / 2, z]} s={[o.w, o.h * k, d]} c={c} />;
                  if (a === 'grow') return <Bx key={key} p={[o.x - o.w / 2 + (o.w * k) / 2, o.y, z]} s={[o.w * k, o.h, d]} c={c} />;
                  if (a === 'slide') return <Bx key={key} p={[o.x + (1 - k) * (o.from ?? 6), o.y, z]} s={[o.w, o.h, d]} c={c} />;
                  return <Bx key={key} p={[o.x, o.y, z]} s={[o.w, o.h, d]} c={c} opacity={k} />;
                }
                if (o.type === 'pipe') {
                  const r = o.r ?? 0.13;
                  const len = (o.y1 - o.y0) * k;
                  return (
                    <group key={key}>
                      <mesh position={[o.x, o.y0 + len / 2, -0.8]} castShadow>
                        <cylinderGeometry args={[r, r, Math.max(0.001, len), 16]} />
                        <meshStandardMaterial color={o.color ?? '#b8bec6'} metalness={0.6} roughness={0.35} />
                      </mesh>
                      {o.bend && k > 0.98 ? (
                        <mesh position={[o.x + (o.bend * 0.25), o.y1 + 0.12, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
                          <cylinderGeometry args={[r, r, 0.5, 16]} />
                          <meshStandardMaterial color={o.color ?? '#b8bec6'} metalness={0.6} roughness={0.35} />
                        </mesh>
                      ) : null}
                    </group>
                  );
                }
                if (o.type === 'ladder') {
                  const h = (o.y1 - o.y0) * k;
                  const rungs = Math.floor(h / 0.35);
                  return (
                    <group key={key} position={[o.x, o.y0, -0.5]}>
                      <Bx p={[-0.28, h / 2, 0]} s={[0.07, h, 0.07]} c="#8a6a48" />
                      <Bx p={[0.28, h / 2, 0]} s={[0.07, h, 0.07]} c="#8a6a48" />
                      {Array.from({length: rungs}, (_, r) => <Bx key={r} p={[0, 0.3 + r * 0.35, 0]} s={[0.56, 0.05, 0.06]} c="#9b7a55" />)}
                    </group>
                  );
                }
                if (o.type === 'person') {
                  const x = o.x + ((o.toX ?? o.x) - o.x) * k;
                  const y = o.y + ((o.toY ?? o.y) - o.y) * k;
                  const moving = si === stage && k > 0 && k < 1;
                  return <Person key={key} p={[x, y, -0.35]} walk={moving ? frame / 3 : 0} shirt={o.shirt ?? '#d8432f'} />;
                }
                if (o.type === 'arrows') {
                  const n = o.n ?? 4;
                  const dir = Math.atan2(o.y1 - o.y0, o.x1 - o.x0);
                  const on = si === stage ? prog(frame, P.delay + (o.delay ?? 0), P.delay + (o.delay ?? 0) + 12) : 0.85;
                  return (
                    <group key={key}>
                      {Array.from({length: n}, (_, j) => {
                        const t = ((frame / 45 + j / n) % 1 + 1) % 1;
                        return <Arrow key={j} p={[o.x0 + (o.x1 - o.x0) * t, o.y0 + (o.y1 - o.y0) * t, -0.2]} dir={dir} c={o.color ?? '#ff8a2a'} s={on * Math.sin(Math.PI * t)} />;
                      })}
                    </group>
                  );
                }
                if (o.type === 'shelf') {
                  const rows = o.rows ?? 3;
                  const items = o.produce ?? ['potato', 'carrot', 'apple'];
                  return (
                    <group key={key} position={[o.x, o.y, -1.6]}>
                      <Bx p={[-o.w / 2, o.h / 2, 0]} s={[0.08, o.h * Math.min(1, k * 2), 0.8]} c="#7a5634" />
                      <Bx p={[o.w / 2, o.h / 2, 0]} s={[0.08, o.h * Math.min(1, k * 2), 0.8]} c="#7a5634" />
                      {Array.from({length: rows}, (_, r) => {
                        const y = 0.15 + (r * (o.h - 0.2)) / rows;
                        const kr = Math.min(1, Math.max(0, k * 2 - 0.4 - r * 0.15));
                        return (
                          <group key={r}>
                            <Bx p={[0, y, 0]} s={[o.w, 0.06, 0.8]} c="#8a6440" />
                            {Array.from({length: Math.round(o.w / 0.28)}, (_, q) => {
                              const show = kr > q / Math.round(o.w / 0.28);
                              if (!show) return null;
                              const col = PRODUCE[items[(r + q) % items.length]] ?? '#b8925c';
                              return (
                                <mesh key={q} position={[-o.w / 2 + 0.17 + q * 0.28, y + 0.13, (hash01(r, q) - 0.5) * 0.25]} castShadow>
                                  <sphereGeometry args={[0.11 + hash01(q, r, 2) * 0.03, 10, 8]} />
                                  <meshStandardMaterial color={shade(col, (hash01(q, r, 4) - 0.5) * 0.2)} roughness={0.7} />
                                </mesh>
                              );
                            })}
                          </group>
                        );
                      })}
                    </group>
                  );
                }
                if (o.type === 'label' && k > 0.2) {
                  labels.push(
                    <div key={key} style={{position: 'absolute', left: `${o.x * 100}%`, top: `${o.y * 100}%`, transform: 'translate(-50%,-50%)', opacity: Math.min(1, (k - 0.2) * 3), fontFamily: 'Montserrat, Arial Black, sans-serif', fontWeight: 900, fontSize: 52, color: '#ffffff', textShadow: '0 3px 0 #000, 0 0 12px rgba(0,0,0,0.6)'}}>
                      {o.text}
                    </div>,
                  );
                }
                return null;
              })
            : [],
        )}
        {sunOn ? (
          <mesh position={[-5, 9, -14]}>
            <sphereGeometry args={[1.2, 24, 18]} />
            <meshStandardMaterial color="#ffe08a" emissive="#ffcf4a" emissiveIntensity={1.6} />
          </mesh>
        ) : null}
      </Stage3D>
      {labels}
      {clockOn ? <Clock2D t={prog(frame, P.delay, P.delay + P.dur * 2, ease.inOut) * 3} /> : null}
    </AbsoluteFill>
  );
};

export const sectionBuild3d = defineMotion<Props>({
  id: 'section-build-3d',
  title: 'Section build (3D cross-section diorama)',
  category: '3d',
  description:
    'A side cut-away of the ground under a backyard (house, trees, fence behind) where a build happens step by step in one continuous shot: a hole is dug with a dirt pile, walls rise, beams drop, ladders and pipes grow, air arrows flow, shelves fill with produce, a little person walks and climbs, a clock spins for time passing. One storyboard scene per step with the same steps and an increasing stage.',
  source: ['survival / build Shorts (Hasta Que Funcione 31M, 2026-11-20 reverse-engineering; original build, three.js)'],
  useFor: 'Survival, DIY and "how a hole becomes a bunker / cellar / shelter" explainers; any step-by-step build told under the ground.',
  durationInFrames: 120,
  defaultProps: {
    steps: [
      {ops: [{type: 'dig', x: 0, w: 3.2, depth: 2.6}], cam: {x: 0, y: -1.6, dist: 15}},
      {ops: [{type: 'box', x: -1.55, y: -1.3, w: 0.18, h: 2.6, anim: 'rise', color: '#9a958c'}, {type: 'box', x: 1.55, y: -1.3, w: 0.18, h: 2.6, anim: 'rise', color: '#9a958c', delay: 8}]},
      {ops: [{type: 'box', x: 0, y: 0.08, w: 3.6, h: 0.16, anim: 'drop', color: '#b07a45'}, {type: 'ladder', x: -1.1, y0: -2.6, y1: 0.4, delay: 10}]},
    ],
    stage: 2,
    dur: 50,
    delay: 6,
    sky: '#8fc3ef',
    sky2: '#dcefff',
    soil: '#8a5a33',
    soil2: '#5e3a1f',
    grass: '#5fae45',
    houseColor: '#e9e2d4',
    roofColor: '#8c4a3a',
  },
  propDocs: {
    steps: 'build steps: [{ops: [...], cam?: {x, y, dist}}]; op types: dig, box (anim drop|rise|slide|grow|fade), pipe, ladder, person, arrows, shelf, sun, clock, label',
    stage: 'index of the step that animates in this scene (earlier steps are already built)',
    dur: 'frames the current step takes to animate',
    delay: 'frames before the current step starts',
    sky: 'sky colour (top)',
    sky2: 'sky colour (horizon)',
    soil: 'soil colour (light)',
    soil2: 'soil colour (dark)',
    grass: 'grass colour',
    houseColor: 'house wall colour',
    roofColor: 'roof colour',
  },
  component: SectionBuild,
  tags: ['3d', 'three.js', 'cross-section', 'cutaway', 'diorama', 'build', 'bunker', 'cellar', 'survival', 'dig', 'underground', 'explainer', 'shorts'],
});
