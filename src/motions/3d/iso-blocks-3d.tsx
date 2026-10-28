import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {CameraRig, h01, mixCol, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * video7 "Downhill", in real 3D: a soft clay isometric bar chart (stacked rounded slabs on a tiled floor,
 * soft shadow-mapped light). A white ball with two eyes hops down the bars once per beat, painting each
 * top with an orange cap (ghost -> accent), slams onto the floor with a tile ripple, rolls back leaving a
 * peach trail, rides a rising pillar while the caps un-paint, and hops on again — a seamless loop.
 * Follow camera with damped tracking and a zoom-out to reveal the whole chart.
 */

type Props = {
  values: number[];
  beatFrames: number;
  background: string;
  barColor: string;
  floorColor: string;
  grooveColor: string;
  accent: string;
  ghost: string;
  pillar: string;
  ballColor: string;
  hopHeight: number;
  zoomOut: number;
};

const SEGH = 0.5; // world height of one value unit (one slab)

type Timeline = {
  N: number;
  L: number[]; // landing frames on bars
  floorF: number;
  rollStart: number;
  rollEnd: number;
  riseStart: number;
  riseEnd: number;
  hopOff: number;
  total: number;
};

const timeline = (N: number, beat: number): Timeline => {
  const L = Array.from({length: N}, (_, k) => k * beat);
  const floorF = N * beat;
  const rollStart = floorF + Math.round(beat * 1.6);
  const rollEnd = rollStart + Math.round(N * 6.5 + 10);
  const riseStart = rollEnd + 4;
  const riseEnd = riseStart + 55;
  const hopOff = riseEnd + 30;
  return {N, L, floorF, rollStart, rollEnd, riseStart, riseEnd, hopOff, total: hopOff + beat};
};

/** ball centre + squash at a frame */
const ballState = (f: number, tl: Timeline, tops: number[], hop: number, r: number) => {
  const {N, beat} = {N: tl.N, beat: tl.L[1] - tl.L[0] || 15};
  const pillarTop = tops[0] + SEGH;
  const CAP = 0.45;
  const ROLL = Math.PI * 2 * Math.max(1, Math.round((N + 1.4) / r / (Math.PI * 2)));
  const PX = -1;
  const PZ = 1;
  let x = 0;
  let y = 0;
  let z = 0;
  let sx = 1;
  let sy = 1;
  let roll = 0;
  let land = -1e9; // last landing frame
  let hard = false;
  const arc = (p: number) => {
    // apex late (~0.55) like the measured hop
    const q = p < 0.55 ? p / 0.55 : 1 - (p - 0.55) / 0.45;
    return p < 0.55 ? 1 - (1 - q) * (1 - q) : 1 - (1 - q) * (1 - q) * 1;
  };
  if (f < tl.floorF) {
    const k = Math.floor(f / beat);
    const p = (f - k * beat) / beat;
    const a: V3 = [k, tops[k] + CAP, 0];
    const b: V3 = k + 1 < N ? [k + 1, tops[k + 1] + CAP, 0] : [N + 0.4, 0, 0.35];
    x = lerp(a[0], b[0], p);
    z = lerp(a[2], b[2], p);
    y = lerp(a[1], b[1], p) + hop * arc(p) * (k + 1 < N ? 1 : 1.25);
    land = k * beat;
  } else if (f < tl.rollStart) {
    x = N + 0.4;
    z = 0.35;
    y = 0;
    land = tl.floorF;
    hard = true;
  } else if (f < tl.riseStart) {
    // roll back along the front of the wall
    const p = ease.inOut(clamp((f - tl.rollStart) / (tl.rollEnd - tl.rollStart)));
    const x0 = N + 0.4;
    x = lerp(x0, PX, p);
    z = lerp(0.35, PZ, clamp(p * 4));
    y = 0;
    roll = -ROLL * ((x0 - x) / (x0 - PX));
    land = tl.floorF;
    hard = true;
  } else if (f < tl.hopOff) {
    const p = ease.inOut(clamp((f - tl.riseStart) / (tl.riseEnd - tl.riseStart)));
    x = PX;
    z = PZ;
    y = pillarTop * p + CAP;
    roll = 0;
    if (f >= tl.riseEnd) y = pillarTop + CAP + Math.sin(((f - tl.riseEnd) / 30) * Math.PI * 2) * 0.04;
    land = tl.riseEnd;
  } else {
    const p = (f - tl.hopOff) / beat;
    x = lerp(PX, 0, p);
    z = lerp(PZ, 0, p);
    y = lerp(pillarTop + CAP, tops[0] + CAP, p) + hop * arc(p);
    roll = 0;
    land = tl.riseEnd;
  }
  // squash & stretch from the last landing
  const pf = f - land;
  if (pf >= 0 && pf < 12) {
    const s = hard ? 0.55 : 0.72;
    sy = interpolateSy(pf, s);
    sx = 1 / Math.sqrt(sy);
  }
  return {x, y, z, sx, sy, roll, land, hard};
};
const interpolateSy = (pf: number, s: number) => {
  const keys = [0, 2, 5, 8, 12];
  const vals = [s, s, 1.12, 1.0, 1.0];
  for (let i = 0; i < keys.length - 1; i++)
    if (pf <= keys[i + 1]) {
      const t = (pf - keys[i]) / (keys[i + 1] - keys[i]);
      return lerp(vals[i], vals[i + 1], ease.sine(t));
    }
  return 1;
};

const Slabs: React.FC<{values: number[]; color: string}> = ({values, color}) => {
  const count = values.reduce((a, v) => a + Math.max(1, Math.round(v)), 0);
  const geo = useMemo(() => new RoundedBoxGeometry(0.97, SEGH - 0.012, 0.97, 2, 0.035), []);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({color}), count);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [geo, count]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    let i = 0;
    values.forEach((v, k) => {
      for (let s = 0; s < Math.max(1, Math.round(v)); s++) {
        o.position.set(k, s * SEGH + SEGH / 2, 0);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    (mesh.material as THREE.MeshLambertMaterial).color.set(color);
  }, [mesh, values, color]);
  return <primitive object={mesh} />;
};

const Tiles: React.FC<{x0: number; x1: number; z0: number; z1: number; lift: (x: number, z: number) => number; tint: (x: number, z: number) => number; color: string; tintColor: string}> = ({
  x0,
  x1,
  z0,
  z1,
  lift,
  tint,
  color,
  tintColor,
}) => {
  const nx = x1 - x0 + 1;
  const nz = z1 - z0 + 1;
  const geo = useMemo(() => new RoundedBoxGeometry(0.93, 0.16, 0.93, 2, 0.03), []);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({color: '#ffffff'}), nx * nz);
    m.receiveShadow = true;
    m.castShadow = true;
    return m;
  }, [geo, nx, nz]);
  const o = useMemo(() => new THREE.Object3D(), []);
  const c = useMemo(() => new THREE.Color(), []);
  const base = new THREE.Color(color);
  const tc = new THREE.Color(tintColor);
  // evaluate per frame
  let i = 0;
  const lifts: number[] = [];
  const tints: number[] = [];
  for (let z = z0; z <= z1; z++)
    for (let x = x0; x <= x1; x++) {
      lifts.push(lift(x, z));
      tints.push(tint(x, z));
    }
  const key = lifts.join(',') + '|' + tints.join(',');
  useLayoutEffect(() => {
    i = 0;
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++) {
        o.position.set(x, -0.08 + lifts[i], z);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        c.copy(base).lerp(tc, clamp(tints[i]));
        mesh.setColorAt(i, c);
        i++;
      }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesh, key, color, tintColor]);
  return <primitive object={mesh} />;
};

const Cap: React.FC<{x: number; y: number; z?: number; t: number; ghost: string; accent: string; geo: THREE.BufferGeometry; solid?: boolean}> = ({x, y, z = 0, t, ghost, accent, geo, solid}) => {
  const mat = useMemo(() => new THREE.MeshLambertMaterial({transparent: true}), []);
  useLayoutEffect(() => {
    mat.color.copy(mixCol(ghost, accent, ease.out(clamp(t))));
    mat.opacity = solid ? 1 : 0.35 + 0.65 * clamp(t * 1.4);
    mat.depthWrite = solid || t > 0.6;
  }, [mat, t, ghost, accent, solid]);
  if (t <= 0 && !solid) return null;
  return <mesh geometry={geo} material={mat} position={[x, y + 0.225, z]} castShadow={t > 0.5} receiveShadow />;
};

const IsoBlocks: React.FC<Props> = ({values, beatFrames, background, barColor, floorColor, grooveColor, accent, ghost, pillar, ballColor, hopHeight, zoomOut}) => {
  const frame = useCurrentFrame();
  const {w, h, portrait} = useStage();
  const N = values.length;
  const tl = useMemo(() => timeline(N, beatFrames), [N, beatFrames]);
  const T = tl.total;
  const f = ((frame % T) + T) % T;
  const tops = values.map((v) => Math.max(1, Math.round(v)) * SEGH);
  const R = 0.28;
  const capGeo = useMemo(() => new RoundedBoxGeometry(0.97, 0.45, 0.97, 2, 0.04), []);

  // ---- caps: paint on landing, un-paint cascade (bottom -> top) during the pillar rise ----
  const capT = (k: number) => {
    const on = clamp((f - tl.L[k] + 2) / 6);
    const offStart = tl.riseStart + 6 + (N - 1 - k) * 4;
    const off = clamp((f - offStart) / 8);
    return f >= offStart ? 1 - off : on;
  };
  // pillar: rises with the ball, sinks after hop-off (wraps to the loop start)
  const pillarTop = tops[0] + SEGH;
  const pillarH =
    f >= tl.riseStart ? pillarTop * ease.inOut(clamp((f - tl.riseStart) / (tl.riseEnd - tl.riseStart))) : f < beatFrames * 2 ? pillarTop * (1 - ease.in(clamp(f / (beatFrames * 1.2)))) : 0;
  const pillarCap = f >= tl.riseEnd - 4 ? clamp((f - tl.riseEnd + 4) / 6) : f < beatFrames * 2 ? 1 - clamp(f / (beatFrames * 1.2)) : 0;

  const ball = ballState(f, tl, tops, hopHeight, R);

  // ---- floor ripple + trail ----
  const impactX = N + 0.4;
  const rip = (x: number, z: number) => {
    const t = (f - tl.floorF) / 30;
    if (t < 0 || t > 0.9) return 0;
    const d = Math.hypot(x - impactX, z - 0.35);
    if (d > 5.5) return 0;
    const wave = Math.exp(-Math.pow((d - 6 * t) / 0.8, 2)) * (1 - t / 0.9);
    return 0.25 * wave * (0.8 + 0.4 * h01(x, z));
  };
  const trail = (x: number, z: number) => {
    if (f < tl.rollStart || Math.abs(z - 1) > 0.5) return 0;
    const p = ease.inOut(clamp((f - tl.rollStart) / (tl.rollEnd - tl.rollStart)));
    const bx = lerp(impactX, -1, p);
    if (x < bx - 0.5 || x > impactX + 0.5) return 0;
    // when was it touched? approximate by the roll param
    const touchedP = clamp((impactX - x) / (impactX + 1));
    let tf = tl.rollStart;
    for (let g = tl.rollStart; g <= tl.rollEnd; g++) {
      if (ease.inOut(clamp((g - tl.rollStart) / (tl.rollEnd - tl.rollStart))) >= touchedP) {
        tf = g;
        break;
      }
    }
    return 0.75 * clamp(1 - (f - tf) / 90);
  };
  const footprint = (x: number, z: number) => (x === -1 && z === 1 && pillarH < 0.05 ? 0.5 : 0);

  // ---- camera: damped follow with zoom keys, pre-integrated twice around the loop so it is seamless ----
  const cam = useMemo(() => {
    const target: V3[] = [];
    for (let g = 0; g < T; g++) {
      const b = ballState(g, tl, tops, hopHeight, R);
      target.push([b.x, Math.max(b.y, 0) * 0.85 + 0.4, b.z]);
    }
    const out: V3[] = new Array(T);
    let c: V3 = target[0];
    for (let pass = 0; pass < 2; pass++)
      for (let g = 0; g < T; g++) {
        const k = 0.12;
        c = [c[0] + (target[g][0] - c[0]) * k, c[1] + (target[g][1] - c[1]) * k, c[2] + (target[g][2] - c[2]) * k];
        if (pass === 1) out[g] = c;
      }
    return out;
  }, [T, tl, tops.join(','), hopHeight]);
  const zoomKeys: [number, number][] = [
    [0, 1],
    [tl.floorF - beatFrames * 3.5, 0.95],
    [tl.floorF + 4, zoomOut],
    [tl.rollStart + 10, zoomOut],
    [tl.rollEnd, 0.92],
    [tl.riseEnd, 1],
    [T, 1],
  ];
  let zoom = 1;
  for (let i = 0; i < zoomKeys.length - 1; i++) {
    const [a, va] = zoomKeys[i];
    const [b, vb] = zoomKeys[i + 1];
    if (f >= a && f <= b) zoom = lerp(va, vb, ease.inOut(clamp((f - a) / Math.max(1, b - a))));
  }
  // at zoom-out, frame the whole chart instead of the ball
  const chartC: V3 = [N / 2 - 0.5, tops[0] * 0.35, 0];
  const wOut = clamp((1 - zoom) / (1 - zoomOut));
  const ct = cam[f];
  const tgt: V3 = [lerp(ct[0], chartC[0], wOut * 0.85), lerp(ct[1], chartC[1], wOut * 0.85), lerp(ct[2], chartC[2], wOut * 0.85)];
  const fov = 12;
  const viewH = (portrait ? lerp(15, Math.max(15, ((N * 0.85 + 1.8) / (w / h)) * zoomOut), wOut) : 6.4) / zoom;
  const dist = viewH / 2 / Math.tan((fov / 2) * (Math.PI / 180));
  const dir = new THREE.Vector3(0.62, 0.7, 1.0).normalize();
  const camPos: V3 = [tgt[0] + dir.x * dist, tgt[1] + dir.y * dist, tgt[2] + dir.z * dist];

  // ---- confetti on landings ----
  const conf: {p: V3; c: string; s: number; rot: number}[] = [];
  const landings = [...tl.L.map((l, k) => ({f: l, x: k, y: tops[k] + 0.45, n: 5})), {f: tl.floorF, x: impactX, y: 0.1, n: 12}];
  for (const L of landings) {
    const age = (f - L.f) / 30;
    if (age < 0 || age > 0.45) continue;
    for (let i = 0; i < L.n; i++) {
      const a = h01(L.f, i) * Math.PI * 2;
      const sp = 1.4 + h01(i, L.f, 3) * 1.6;
      const up = 2.2 + h01(i, L.f, 5) * 1.5;
      conf.push({
        p: [L.x + Math.cos(a) * sp * age * 0.6, L.y + up * age - 4 * age * age, (L.x === impactX ? 0.35 : 0) + Math.sin(a) * sp * age * 0.6],
        c: i % 2 ? accent : ghost,
        s: (0.06 + 0.04 * h01(i, 9)) * (1 - clamp((age - 0.27) / 0.18)),
        rot: age * 12 + i,
      });
    }
  }

  const facing = Math.cos(ball.roll);
  const eyesOn = facing > 0.64 && !(ball.hard && f - ball.land < 5 && f < tl.rollStart);

  return (
    <AbsoluteFill style={{background}}>
      <Stage3D shadows="soft" flat>
        <CameraRig position={camPos} target={tgt} fov={fov} near={1} far={dist * 3} />
        <ambientLight intensity={1.02} color="#fff8f2" />
        <directionalLight
          position={[tgt[0] - 6, 14, tgt[2] + 9]}
          intensity={0.42}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-bias={-0.0005}
          shadow-radius={6}
        >
          <object3D attach="target" position={[tgt[0], 0, tgt[2]]} />
        </directionalLight>
        <hemisphereLight args={['#ffffff', '#d8cfc4', 0.12]} />
        {/* groove base under the tiles */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[N / 2, -0.16, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshLambertMaterial color={grooveColor} />
        </mesh>
        <Tiles
          x0={Math.round(tgt[0]) - 17}
          x1={Math.round(tgt[0]) + 17}
          z0={Math.round(tgt[2]) - 15}
          z1={Math.round(tgt[2]) + 12}
          lift={(x, z) => rip(x, z)}
          tint={(x, z) => Math.max(rip(x, z) * 4, trail(x, z), footprint(x, z))}
          color={floorColor}
          tintColor="#F0D6C4"
        />
        <Slabs values={values} color={barColor} />
        {values.map((_, k) => (
          <Cap key={k} x={k} y={tops[k]} t={capT(k)} ghost={ghost} accent={accent} geo={capGeo} />
        ))}
        {pillarH > 0.01 && (
          <mesh position={[-1, pillarH / 2, 1]} scale={[1, pillarH, 1]} castShadow receiveShadow>
            <boxGeometry args={[0.97, 1, 0.97]} />
            <meshLambertMaterial color={pillar} />
          </mesh>
        )}
        {pillarH > 0.01 && <Cap x={-1} y={pillarH} z={1} t={pillarCap} solid ghost={ghost} accent={accent} geo={capGeo} />}
        {/* ball: pivot at the contact point for squash */}
        <group position={[ball.x, ball.y, ball.z]}>
          <group scale={[ball.sx, ball.sy, ball.sx]}>
            <group position={[0, R, 0]} rotation={[0, 0, ball.roll]}>
              <mesh castShadow>
                <sphereGeometry args={[R, 48, 32]} />
                <meshStandardMaterial color={ballColor} roughness={0.35} metalness={0} />
              </mesh>
            </group>
            {eyesOn &&
              [-1, 1].map((sd) => (
                <mesh key={sd} position={[0.53 * R * 0.93 + 0.85 * 0.095 * sd, R * 0.9, 0.85 * R * 0.93 - 0.53 * 0.095 * sd]} rotation={[0, 0.555, 0]} scale={[0.034, 0.062, 0.02]}>
                  <sphereGeometry args={[1, 16, 12]} />
                  <meshBasicMaterial color="#160A00" />
                </mesh>
              ))}
          </group>
        </group>
        {conf.map((c, i) => (
          <mesh key={i} position={c.p} rotation={[c.rot, c.rot * 0.7, 0]} scale={c.s}>
            <boxGeometry args={[1, 1, 1]} />
            <meshLambertMaterial color={c.c} />
          </mesh>
        ))}
      </Stage3D>
      <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse at 78% 18%, rgba(255,250,242,0.35) 0%, rgba(255,250,242,0) 45%), radial-gradient(ellipse at center, rgba(213,203,191,0) 55%, rgba(200,188,174,0.28) 100%)`}} />
    </AbsoluteFill>
  );
};


export const isoBlocks3d = defineMotion<Props>({
  id: 'iso-blocks-3d',
  title: 'Iso blocks (3D clay)',
  category: '3d',
  description:
    'Soft clay isometric 3D bar chart: a white ball with eyes hops down the bars painting each top orange, slams onto the tiled floor with a ripple, rolls back and rides a rising pillar while the caps un-paint — a seamless loop with a follow camera.',
  source: ['video7 0:00-0:16'],
  useFor: 'Declining (or any) metric stories, step-by-step progress, playful looping data explainers in real 3D.',
  durationInFrames: 390,
  defaultProps: {
    values: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
    beatFrames: 15,
    background: '#E6DED3',
    barColor: '#EDE6DC',
    floorColor: '#EDE5D9',
    grooveColor: '#CEC5B7',
    accent: '#E48E6D',
    ghost: '#F7DAC9',
    pillar: '#E5BDA6',
    ballColor: '#F9F4EE',
    hopHeight: 0.75,
    zoomOut: 0.62,
  },
  propDocs: {
    values: 'bar heights in slabs (any series; the ball hops left to right)',
    beatFrames: 'frames per hop',
    background: 'backdrop colour behind the floor',
    barColor: 'bar clay colour',
    floorColor: 'floor tile colour',
    grooveColor: 'colour of the gaps between tiles',
    accent: 'painted cap colour',
    ghost: 'cap colour at the moment of touchdown',
    pillar: 'lift pillar colour',
    ballColor: 'ball body colour',
    hopHeight: 'hop arc height (world units, 1 = one cell)',
    zoomOut: 'camera zoom at the reveal (1 = close follow)',
  },
  component: IsoBlocks,
  tags: ['3d', 'isometric', 'clay', 'bar-chart', 'loop', 'character', 'three'],
});
