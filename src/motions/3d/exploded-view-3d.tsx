import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rgba, shade} from '../../core/r2-pr2-kit';
import {Svg, useStage} from '../../core/stage';
import {CameraRig, makeCamera, projectPx, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * A procedural 3D assembly (a compact servo: cap, battery, board, motor, shaft, gear, housing sleeve, front plate)
 * separates along its axis part by part with a 3-frame stagger, orbits, shows leader-line labels projected from 3D
 * anchors, then reassembles; the `cutaway` variant keeps it closed and slices the shell open with a clip plane.
 * Parts are data: pass your own `parts` (box / cyl / tube / gear / board / sphere) to explode any object.
 */
type Part = {
  name: string;
  spec?: string;
  mesh: string;
  pos: number[];
  size: number[];
  dir: number[];
  dist: number;
  color: string;
  spin?: number;
  shell?: boolean;
  metal?: number;
};
type Props = {
  parts: Part[];
  variant: string;
  explodeAt: number;
  reassembleAt: number;
  stagger: number;
  orbitSpeed: number;
  startAzimuth: number;
  elevation: number;
  labels: boolean;
  accent: string;
  background: string;
  backgroundEdge: string;
  scale: number;
  sectionLabel?: string;
};

const Setup: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.75;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
};

const gearGeometry = (R: number, thick: number, teeth: number) => {
  const sh = new THREE.Shape();
  const root = R * 0.84;
  const n = Math.max(6, Math.round(teeth));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = (Math.PI * 2) / n;
    const pts: [number, number][] = [
      [root, a - d * 0.28],
      [R, a - d * 0.14],
      [R, a + d * 0.14],
      [root, a + d * 0.28],
    ];
    pts.forEach(([r, ang], j) => {
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0 && j === 0) sh.moveTo(x, y);
      else sh.lineTo(x, y);
    });
  }
  sh.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, R * 0.22, 0, Math.PI * 2, true);
  sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, {depth: thick, bevelEnabled: false, curveSegments: 6});
  g.translate(0, 0, -thick / 2);
  g.rotateY(Math.PI / 2);
  return g;
};

const PartMesh: React.FC<{part: Part; clip: THREE.Plane | null; spin: number}> = ({part, clip, spin}) => {
  const s = part.size;
  const geo = useMemo(() => {
    if (part.mesh === 'cyl') {
      const g = new THREE.CylinderGeometry(s[0], s[0], s[1], 56);
      g.rotateZ(Math.PI / 2);
      return g;
    }
    if (part.mesh === 'tube') {
      const [ro, L, ri] = [s[0], s[1], s[2] ?? s[0] * 0.9];
      const g = new THREE.LatheGeometry([[ri, -L / 2], [ro, -L / 2], [ro, L / 2], [ri, L / 2], [ri, -L / 2]].map(([x, y]) => new THREE.Vector2(x, y)), 72);
      g.rotateZ(Math.PI / 2);
      return g;
    }
    if (part.mesh === 'gear') return gearGeometry(s[0], s[1], s[2] ?? 14);
    if (part.mesh === 'sphere') return new THREE.SphereGeometry(s[0], 40, 28);
    if (part.mesh === 'ring') return new THREE.TorusGeometry(s[0], s[1], 20, 64).rotateY(Math.PI / 2);
    return new THREE.BoxGeometry(s[0], s[1] ?? s[0], s[2] ?? s[0]);
  }, [part.mesh, s[0], s[1], s[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  const metal = part.metal ?? (part.mesh === 'gear' || part.mesh === 'cyl' ? 0.7 : 0.35);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({color: part.color, metalness: metal, roughness: 0.34, side: part.shell ? THREE.DoubleSide : THREE.FrontSide, clippingPlanes: part.shell && clip ? [clip] : [], clipShadows: false}),
    [part.color, metal, part.shell, clip],
  );
  const board = part.mesh === 'board' || part.name.toLowerCase().includes('board');
  return (
    <group rotation={[(spin * Math.PI) / 180, 0, 0]}>
      <mesh geometry={geo} material={mat} />
      {board && part.mesh === 'box' && (
        <>
          {[[0.3, 0.45, 0.55], [-0.35, -0.2, 0.3], [0.05, -0.5, 0.4]].map(([a, b, k], i) => (
            <mesh key={i} position={[s[0] / 2 + 0.04, a * s[1], b * s[2]]}>
              <boxGeometry args={[0.08, 0.3 * k + 0.12, 0.3 * k + 0.2]} />
              <meshStandardMaterial color="#1b1f27" metalness={0.3} roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[s[0] / 2 + 0.012, 0, 0]}>
            <boxGeometry args={[0.025, s[1] * 0.92, 0.04]} />
            <meshStandardMaterial color="#d9b44a" metalness={0.9} roughness={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
};

const ExplodedView3D: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const parts = P.parts;
  const n = parts.length;
  const cut = P.variant === 'cutaway';
  const expMul = cut ? 0.16 : 1;
  const popIn = ease.out(prog(frame, 0, 20, (t) => t));
  const e = parts.map((p, i) => {
    const up = ease.inOut(prog(frame, P.explodeAt + i * P.stagger, P.explodeAt + i * P.stagger + 40, (t) => t));
    const down = ease.inOut(prog(frame, P.reassembleAt + (n - 1 - i) * P.stagger, P.reassembleAt + (n - 1 - i) * P.stagger + 30, (t) => t));
    return up * (1 - down) * expMul;
  });
  const clipC = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 2), []);
  const cutOpen = ease.inOut(prog(frame, P.explodeAt, P.explodeAt + 48, (t) => t)) * (1 - ease.inOut(prog(frame, P.reassembleAt, P.reassembleAt + 34, (t) => t)));
  clipC.constant = cut ? 2.2 - 2.2 * cutOpen : 99;

  // world layout: axis = x (landscape) or y (portrait, group rotated)
  const posOf = (p: Part, i: number): V3 => [p.pos[0] + p.dir[0] * p.dist * e[i], p.pos[1] + p.dir[1] * p.dist * e[i], p.pos[2] + p.dir[2] * p.dist * e[i]];
  let lo = Infinity;
  let hi = -Infinity;
  parts.forEach((p, i) => {
    const c = posOf(p, i)[0];
    const half = (p.mesh === 'box' ? p.size[0] : p.mesh === 'sphere' ? p.size[0] * 2 : p.size[1]) / 2;
    lo = Math.min(lo, c - half);
    hi = Math.max(hi, c + half);
  });
  const axisLen = Math.max(3.4, hi - lo);
  const midAxis = (hi + lo) / 2;
  const az = ((P.startAzimuth + (P.orbitSpeed * frame) / 30) * Math.PI) / 180;
  const el = (P.elevation * Math.PI) / 180;
  const fov = 30;
  const aspect = w / h;
  const tanH = Math.tan((fov * Math.PI) / 360);
  const fitAxis = (axisLen / 2) * 1.34 * (portrait ? 1 : 1);
  const dist = Math.max(fitAxis / (tanH * (portrait ? 1 : aspect)), (portrait ? 1.9 / (tanH * aspect) : 1.9 / tanH)) / P.scale;
  const rotZ = portrait ? Math.PI / 2 : 0;
  // object centre after rotation
  const centre: V3 = portrait ? [0, midAxis, 0] : [midAxis, 0, 0];
  const camPos: V3 = [centre[0] + dist * Math.sin(az) * Math.cos(el), centre[1] + dist * Math.sin(el), centre[2] + dist * Math.cos(az) * Math.cos(el)];
  const cam = useMemo(() => makeCamera(camPos, centre, fov, aspect), [camPos[0], camPos[1], camPos[2], centre[0], centre[1], centre[2], aspect]); // eslint-disable-line react-hooks/exhaustive-deps

  // labels
  const lab = parts.map((p, i) => {
    const pp = posOf(p, i);
    const v = new THREE.Vector3(...pp);
    if (portrait) v.applyEuler(new THREE.Euler(0, 0, rotZ));
    const pr = projectPx(cam, [v.x, v.y, v.z], w, h);
    return {p, i, x: pr.x, y: pr.y, vis: pr.visible};
  });
  const sides: Record<'L' | 'R', typeof lab> = {L: [], R: []};
  lab.forEach((l) => sides[l.x < w / 2 ? 'L' : 'R'].push(l));
  const colX = {L: w * (portrait ? 0.06 : 0.07), R: w * (portrait ? 0.94 : 0.93)};
  const minGap = (portrait ? 124 : 98) * u;
  const place = (arr: typeof lab) => {
    const sorted = [...arr].sort((a, b) => a.y - b.y);
    const ys: number[] = [];
    sorted.forEach((l, k) => {
      let y = Math.min(h * 0.92, Math.max(h * 0.08, l.y));
      if (k > 0) y = Math.max(y, ys[k - 1] + minGap);
      ys.push(y);
    });
    // pull back up if the stack ran off the bottom
    for (let k = sorted.length - 1; k >= 0; k--) {
      const lim = k === sorted.length - 1 ? h * 0.94 : ys[k + 1] - minGap;
      ys[k] = Math.min(ys[k], lim);
    }
    return sorted.map((l, k) => ({...l, ly: ys[k]}));
  };
  const placed = [...place(sides.L).map((l) => ({...l, side: 'L' as const})), ...place(sides.R).map((l) => ({...l, side: 'R' as const}))];
  const lastExploded = P.explodeAt + (n - 1) * P.stagger + 36;
  const outP = ease.in(prog(frame, P.reassembleAt - 10, P.reassembleAt + 2, (t) => t));
  const fs = (portrait ? 40 : 28) * u;

  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 90% at 50% 45%, ${P.background} 0%, ${P.backgroundEdge} 80%)`}}>
      <Stage3D transparent>
        <CameraRig position={camPos} target={centre} fov={fov} near={0.1} far={200} />
        <Setup />
        <ambientLight intensity={0.35} />
        <directionalLight position={[-4, 6, 5]} intensity={2.4} color="#fff2e2" />
        <directionalLight position={[5, 2, -4]} intensity={1.2} color="#9bb8ff" />
        <group rotation={[0, 0, rotZ]} scale={Math.max(0.001, popIn * 0.1 + 0.9)}>
          {parts.map((p, i) => (
            <group key={i} position={posOf(p, i)}>
              <PartMesh part={p} clip={cut ? clipC : null} spin={(p.spin ?? 0) * (frame / 30) * (0.3 + 0.7 * e[i] / Math.max(0.001, expMul))} />
            </group>
          ))}
        </group>
      </Stage3D>
      {P.labels && (
        <Svg>
          {placed.map(({p, i, x, y, ly, side, vis}) => {
            const s0 = lastExploded - 14 + i * 4;
            const inP = ease.out(prog(frame, s0, s0 + 12, (t) => t)) * (1 - outP);
            if (inP <= 0.01 || !vis) return null;
            const cx = colX[side];
            const dir = side === 'R' ? 1 : -1;
            const elbow = cx - dir * 26 * u;
            const d = `M${x.toFixed(1)},${y.toFixed(1)} L${(elbow - dir * Math.abs(ly - y) * 0.5).toFixed(1)},${ly.toFixed(1)} L${(cx - dir * 10 * u).toFixed(1)},${ly.toFixed(1)}`;
            const anchor = side === 'R' ? 'end' : 'start';
            return (
              <g key={i} opacity={inP}>
                <circle cx={x} cy={y} r={3.4 * u} fill="#fff" />
                <circle cx={x} cy={y} r={(3.4 + 7 * inP) * u} fill="none" stroke={P.accent} strokeWidth={1.3 * u} opacity={1 - inP * 0.55} />
                <path d={d} fill="none" stroke={P.accent} strokeOpacity={0.75} strokeWidth={1.4 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - inP} />
                <text x={cx} y={ly - fs * 0.35} textAnchor={anchor} fontFamily={fonts.mono} fontSize={fs * 0.58} fill={P.accent}>{String(i + 1).padStart(2, '0')}</text>
                <text x={cx} y={ly + fs * 0.55} textAnchor={anchor} fontFamily={fonts.sans} fontWeight={700} fontSize={fs} fill="#f3f5fa">{p.name}</text>
                {p.spec && (
                  <text x={cx} y={ly + fs * 1.4} textAnchor={anchor} fontFamily={fonts.mono} fontSize={fs * (portrait ? 0.62 : 0.6)} fill="#f3f5fa" opacity={0.55}>{p.spec}</text>
                )}
              </g>
            );
          })}
        </Svg>
      )}
      {cut && (
        <div style={{position: 'absolute', left: w * 0.06, top: h * 0.06, fontFamily: fonts.mono, fontSize: 22 * u, letterSpacing: 3 * u, color: rgba(P.accent, 0.9), opacity: cutOpen}}>
          {P.sectionLabel}
        </div>
      )}
    </AbsoluteFill>
  );
};

const DEFAULT_PARTS: Part[] = [
  {name: 'End cap', spec: 'anodised alloy', mesh: 'cyl', pos: [-1.95, 0, 0], size: [1.0, 0.3], dir: [-1, 0, 0], dist: 3.4, color: '#3f485c', shell: true},
  {name: 'Battery', spec: '3.7 V Li-ion', mesh: 'cyl', pos: [-1.25, 0, 0], size: [0.72, 0.95], dir: [-1, 0, 0], dist: 2.1, color: '#e0a030', metal: 0.3},
  {name: 'Control board', spec: 'ARM controller', mesh: 'box', pos: [-0.55, 0, 0], size: [0.12, 1.5, 1.5], dir: [-1, 0, 0], dist: 0.9, color: '#1f8a5b', metal: 0.2},
  {name: 'Motor', spec: 'brushless 12 000 rpm', mesh: 'cyl', pos: [0.1, 0, 0], size: [0.5, 0.9], dir: [0, 1, 0], dist: 1.9, color: '#6d7688'},
  {name: 'Shaft', spec: 'hardened steel', mesh: 'cyl', pos: [0.55, 0, 0], size: [0.11, 2.3], dir: [1, 0, 0], dist: 0.9, color: '#b3bac6', metal: 0.95},
  {name: 'Gear', spec: '16 teeth', mesh: 'gear', pos: [0.95, 0, 0], size: [0.86, 0.22, 16], dir: [1, 0, 0], dist: 1.9, color: '#d9b04a', spin: 50},
  {name: 'Front plate', spec: 'machined aluminium', mesh: 'cyl', pos: [1.5, 0, 0], size: [1.0, 0.18], dir: [1, 0, 0], dist: 3.5, color: '#3f485c', shell: true},
  {name: 'Housing', spec: 'sleeve, 2.2 mm wall', mesh: 'tube', pos: [-0.15, 0, 0], size: [1.1, 2.2, 0.96], dir: [0, 0, 0], dist: 0, color: '#5b7cfa', shell: true, metal: 0.5},
];

export const explodedView3d = defineMotion<Props>({
  id: 'exploded-view-3d',
  title: 'Exploded view (3D parts, labels, cutaway)',
  category: '3d',
  description:
    'A real three.js assembly (end cap, battery, circuit board with chips, motor, shaft, spinning gear, front plate inside a hollow housing sleeve) lit by a studio environment separates part by part along its axis with a 3-frame stagger while the camera orbits and numbered leader-line labels project from the 3D parts, then reassembles; the cutaway variant stays closed and a clip plane slices the shell open.',
  source: ['prompt corpus x17 (procedural 3D object separates into labelled parts, orbits, reassembles; cutaway slices it open)'],
  useFor: 'Hardware launches, engineering and teaching explainers, "how it is made" and product feature call-outs. Replace `parts` (mesh box / cyl / tube / gear / board / sphere / ring) to explode your own object; the axis turns vertical in portrait.',
  durationInFrames: 240,
  defaultProps: {
    parts: DEFAULT_PARTS,
    variant: 'explode',
    explodeAt: 26,
    reassembleAt: 176,
    stagger: 3,
    orbitSpeed: 4,
    startAzimuth: 14,
    elevation: 16,
    labels: true,
    accent: '#7cf0ff',
    background: '#1f2736',
    backgroundEdge: '#090c13',
    scale: 1,
    sectionLabel: 'SECTION A-A',
  },
  propDocs: {
    parts: '[{name, spec?, mesh:"box|cyl|tube|gear|board|sphere|ring", pos:[x,y,z], size:[...], dir:[dx,dy,dz], dist, color, spin?, shell?, metal?}] x is the assembly axis; size = box [x,y,z], cyl [radius,length], tube [outerR,length,innerR], gear [R,thickness,teeth]',
    variant: "'explode' (parts separate) | 'cutaway' (closed assembly, shell parts sliced open by a clip plane)",
    explodeAt: 'frame the first part starts to move (or the cut starts)',
    reassembleAt: 'frame the parts start coming back',
    stagger: 'frames between consecutive parts',
    orbitSpeed: 'camera orbit speed, degrees per second',
    startAzimuth: 'starting camera azimuth in degrees',
    elevation: 'camera elevation in degrees',
    labels: 'numbered leader-line labels',
    accent: 'label / leader colour',
    background: 'backdrop centre colour',
    backgroundEdge: 'backdrop corner colour',
    scale: 'zoom multiplier (>1 = closer)',
    sectionLabel: 'mono caption top-left while the cutaway is open',
  },
  component: ExplodedView3D,
  tags: ['exploded view', '3d', 'three.js', 'parts', 'assembly', 'teardown', 'cutaway', 'section', 'engineering', 'hardware', 'product', 'how it works', 'gear', 'labels', 'leader lines', 'orbit', 'servo', 'motor', 'launch'],
});
