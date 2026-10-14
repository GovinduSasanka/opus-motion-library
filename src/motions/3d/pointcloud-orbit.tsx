import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {usePlatePixels, Pixels} from '../../core/image-kit';
import {useStage} from '../../core/stage';
import {CameraRig, GLSL_NOISE, h01, Stage3D, smoothstep, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * video18 depth-pointcloud + particle-disintegrate: an image (or a procedural figure) is resampled into
 * a grid of coloured beads; luminance pushes each bead toward the camera (bright = near), so the picture
 * gets relief. The camera orbits, beads extrude into short voxel columns, then a detach front sweeps
 * across and the beads blow sideways on curl-ish noise, shrinking and turning white.
 * All animation runs in a vertex shader driven by frame-derived uniforms (deterministic).
 */

type Props = {
  src: string;
  background: string;
  density: number;
  depthScale: number;
  beadSize: number;
  orbitAngle: number;
  extrusion: number;
  disintegrate: boolean;
  direction: number;
  speed: number;
  turbulence: number;
  fringe: number;
  keyDark: number;
};

// ------------------------------------------------------------------------------------------------
// procedural figure: a swordswoman in a red kimono (keyed: alpha 0 outside the figure)
// ------------------------------------------------------------------------------------------------
type Sample = {r: number; g: number; b: number; a: number; bulge: number};
const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const SKIN = hex('#ECAD91');
const SKIN_D = hex('#C1927D');
const HAIR = hex('#1d1a24');
const KIMONO = hex('#B23C31');
const KIMONO_D = hex('#7a2420');
const OBI = hex('#E0A848');
const COLLAR = hex('#F3E8DA');
const STEEL = hex('#DDE6EE');
const HILT = hex('#2a2230');
const TEAL = hex('#2E5D63');

const ell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
const segDist = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
  return {d: Math.hypot(x - ax - dx * t, y - ay - dy * t), t};
};
const mix3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** x,y in 0..1 (y down) over a 3:4 figure box */
const figure = (x: number, y: number): Sample => {
  let c: [number, number, number] | null = null;
  let bulge = 0;
  // sword (behind everything except hands): from hands up-right
  const sw = segDist(x, y, 0.56, 0.5, 0.95, 0.06);
  if (sw.d < 0.011) {
    c = sw.t < 0.12 ? HILT : mix3(STEEL, [255, 255, 255], 0.3 * Math.sin(sw.t * 40) ** 2);
    bulge = 0.5;
  }
  // ponytail behind
  const pt = segDist(x, y, 0.5, 0.13, 0.28, 0.42);
  if (pt.d < 0.035 * (1 - pt.t * 0.6)) {
    c = HAIR;
    bulge = 0.3;
  }
  // kimono body: trapezoid with wide sleeves
  const top = 0.31;
  const hem = 0.97;
  if (y > top && y < hem) {
    const k = (y - top) / (hem - top);
    // sloped shoulders, hanging furisode sleeves, flared hem
    const shoulder = smoothstep(top, top + 0.06, y);
    const sleeve = y < 0.74 ? 0.13 * smoothstep(top, top + 0.08, y) * (1 - smoothstep(0.66, 0.74, y)) : 0;
    const half = (lerp(0.15, 0.24, k * k) + sleeve) * lerp(0.55, 1, shoulder);
    const dx = Math.abs(x - 0.5);
    if (dx < half) {
      const fold = 0.5 + 0.5 * Math.sin((x - 0.5) * 38 + y * 6);
      c = mix3(KIMONO, KIMONO_D, 0.55 * fold * k + (dx / half) ** 3 * 0.6);
      bulge = Math.sqrt(Math.max(0, 1 - (dx / half) ** 2));
      // inner teal under-robe at the hem split
      if (y > 0.62 && dx < (y - 0.62) * 0.18) c = mix3(TEAL, [10, 30, 34], 0.5 * fold);
      // collar V
      const cv = Math.abs(dx - (y - top) * 0.55);
      if (y < 0.5 && cv < 0.018) c = COLLAR;
      // obi
      if (y > 0.47 && y < 0.55 && dx < half * 0.92) c = mix3(OBI, [150, 95, 30], 0.35 * (0.5 + 0.5 * Math.sin(x * 120)));
      // hands at the grip
      if (ell(x, y, 0.565, 0.5, 0.035, 0.028) < 1) c = SKIN;
    }
  }
  // neck
  if (y > 0.26 && y < 0.33 && Math.abs(x - 0.5) < 0.035) {
    c = SKIN_D;
    bulge = 0.7;
  }
  // head
  const he = ell(x, y, 0.5, 0.21, 0.075, 0.092);
  if (he < 1) {
    c = mix3(SKIN, SKIN_D, he * 0.7);
    bulge = Math.sqrt(1 - he);
    // eyes / brows
    if (ell(x, y, 0.47, 0.215, 0.012, 0.006) < 1 || ell(x, y, 0.53, 0.215, 0.012, 0.006) < 1) c = HAIR;
    if (ell(x, y, 0.5, 0.268, 0.014, 0.006) < 1) c = [200, 70, 70];
    // hair cap
    if (y < 0.2 - 0.02 * Math.cos((x - 0.5) * 20) || Math.abs(x - 0.5) > 0.062) c = HAIR;
  }
  // bun
  if (ell(x, y, 0.5, 0.105, 0.05, 0.04) < 1) {
    c = HAIR;
    bulge = 0.6;
  }
  if (ell(x, y, 0.5, 0.105, 0.05, 0.006) < 1 && Math.abs(x - 0.5) < 0.07) c = [210, 60, 50];
  if (!c) return {r: 0, g: 0, b: 0, a: 0, bulge: 0};
  return {r: c[0], g: c[1], b: c[2], a: 1, bulge};
};

// ------------------------------------------------------------------------------------------------
type Cloud = {pos: Float32Array; col: Float32Array; rnd: Float32Array; layer: Float32Array; count: number; xmin: number; xmax: number; height: number};

const buildCloud = (px: Pixels | null, density: number, frameAspect: number, keyDark: number, layers: number): Cloud => {
  const H = 10; // world height of the picture
  let W: number;
  let rows: number;
  let cols: number;
  let sample: (u: number, v: number) => Sample;
  if (px) {
    W = H * (px.w / px.h);
    rows = Math.round(130 * density);
    cols = Math.round(rows * (px.w / px.h));
    sample = (u, v) => {
      const i = (Math.min(px.h - 1, Math.floor(v * px.h)) * px.w + Math.min(px.w - 1, Math.floor(u * px.w))) * 4;
      const r = px.data[i];
      const g = px.data[i + 1];
      const b = px.data[i + 2];
      const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return {r, g, b, a: l < keyDark ? 0 : 1, bulge: 0};
    };
  } else {
    W = H * 0.75;
    rows = Math.round(150 * density);
    cols = Math.round(rows * 0.75);
    sample = figure;
  }
  const pos: number[] = [];
  const col: number[] = [];
  const rnd: number[] = [];
  const lay: number[] = [];
  let xmin = 1e9;
  let xmax = -1e9;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const u = (i + 0.5) / cols;
      const v = (j + 0.5) / rows;
      const s = sample(u, v);
      if (s.a <= 0) continue;
      const l = (0.2126 * s.r + 0.7152 * s.g + 0.0722 * s.b) / 255;
      const x = (u - 0.5) * W + (h01(i, j) - 0.5) * (W / cols) * 0.5;
      const y = (0.5 - v) * H + (h01(j, i, 2) - 0.5) * (H / rows) * 0.5;
      const z = l * 0.65 + s.bulge * 0.55;
      xmin = Math.min(xmin, x);
      xmax = Math.max(xmax, x);
      for (let L = 0; L < layers; L++) {
        pos.push(x, y, z);
        col.push(Math.pow(s.r / 255, 2.2), Math.pow(s.g / 255, 2.2), Math.pow(s.b / 255, 2.2));
        rnd.push(h01(i, j, 3), h01(i, j, 4), h01(i, j, 5 + L), h01(i, j, 6 + L));
        lay.push(L);
      }
    }
  return {pos: new Float32Array(pos), col: new Float32Array(col), rnd: new Float32Array(rnd), layer: new Float32Array(lay), count: lay.length, xmin, xmax, height: H};
};

const VERT = /* glsl */ `
${GLSL_NOISE}
attribute vec3 aCol;
attribute vec4 aRnd;
attribute float aLayer;
uniform float uDepth; uniform float uExtrude; uniform float uFront; uniform float uDir; uniform float uSpeed;
uniform float uTurb; uniform float uFrontSpeed; uniform float uSize; uniform float uIntro; uniform float uTime; uniform float uPx;
varying vec3 vCol; varying float vAlpha; varying float vWhite;
void main() {
  vec3 p = position;
  p.z *= uDepth;
  // depth jitter (breathing)
  p.z += snoise(vec3(p.xy * 0.4, uTime * 0.6)) * 0.08 * uDepth;
  // voxel extrusion: layers stack back behind the surface
  float layerOn = aLayer < 0.5 ? 1.0 : step(aLayer, uExtrude * 3.0 + 0.001);
  p.z -= aLayer * 0.22 * uDepth * uExtrude;
  // intro: beads arrive from a scattered depth cloud
  float d = clamp((uIntro - aRnd.x * 0.5) / 0.5, 0.0, 1.0);
  d = 1.0 - pow(1.0 - d, 3.0);
  vec3 scat = vec3((aRnd.y - 0.5) * 4.0, (aRnd.z - 0.5) * 4.0, 6.0 + aRnd.w * 10.0);
  p = mix(p + scat, p, d);
  // disintegration: detach front sweeps along x (uDir = +1 sweeps left->right, -1 right->left)
  float age = max(0.0, (uFront - p.x * uDir) / uFrontSpeed - aRnd.y * 0.12);
  if (uFront - p.x * uDir < 0.0) age = 0.0;
  vec3 q = p;
  float sp = uSpeed * (0.2 + aRnd.z * 0.8);
  q.x += uDir * sp * age * (1.0 + age * 0.6);
  q.y += snoise(vec3(p.xy * 0.35 + 3.0, age * 0.8)) * uTurb * age + age * age * 0.25;
  q.z += snoise(vec3(p.yx * 0.35 + 9.0, age * 0.8)) * uTurb * age * 0.8;
  q.x += snoise(vec3(p.xy * 0.5 + 17.0, age)) * uTurb * 0.5 * age;
  vec4 mv = modelViewMatrix * vec4(q, 1.0);
  gl_Position = projectionMatrix * mv;
  float shrink = mix(1.0, 0.3, clamp(age / 0.9, 0.0, 1.0));
  float size = uSize * (0.75 + 0.5 * aRnd.w) * shrink * layerOn * d;
  gl_PointSize = size * uPx / -mv.z;
  vCol = aCol * (aLayer > 0.5 ? 0.62 : 1.0);
  vWhite = clamp(age / 0.7, 0.0, 1.0);
  vAlpha = (1.0 - clamp((age - 1.5) / 1.3, 0.0, 1.0)) * layerOn;
}`;

const FRAG = /* glsl */ `
uniform float uFringe;
varying vec3 vCol; varying float vAlpha; varying float vWhite;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5 || vAlpha < 0.01) discard;
  // tiny RGB split on the bead rim (chromatic fringe)
  float rr = length(c + vec2(uFringe, 0.0));
  float bb = length(c - vec2(uFringe, 0.0));
  vec3 col = mix(vCol, vec3(1.0, 0.97, 0.94), vWhite);
  vec3 rim = vec3(rr > 0.44 ? 0.35 : 1.0, 1.0 - 0.25 * step(0.44, max(rr, bb)), bb > 0.44 ? 0.35 : 1.0);
  float shade = 0.7 + 0.45 * (1.0 - smoothstep(0.0, 0.5, length(c + vec2(0.12, 0.14))));
  col = col * shade * mix(vec3(1.0), rim, 1.0 - vWhite);
  gl_FragColor = vec4(col, vAlpha);
  #include <colorspace_fragment>
}`;

const Beads: React.FC<{cloud: Cloud; u: Record<string, number>}> = ({cloud, u}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(cloud.pos, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(cloud.col, 3));
    g.setAttribute('aRnd', new THREE.BufferAttribute(cloud.rnd, 4));
    g.setAttribute('aLayer', new THREE.BufferAttribute(cloud.layer, 1));
    return g;
  }, [cloud]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: true,
        uniforms: Object.fromEntries(['uDepth', 'uExtrude', 'uFront', 'uFrontSpeed', 'uDir', 'uSpeed', 'uTurb', 'uSize', 'uIntro', 'uTime', 'uPx', 'uFringe'].map((k) => [k, {value: 0}])),
      }),
    [],
  );
  useLayoutEffect(() => {
    for (const k of Object.keys(u)) mat.uniforms[k].value = u[k];
  }, [mat, ...Object.values(u)]);
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

const PointcloudOrbit: React.FC<Props> = ({src, background, density, depthScale, beadSize, orbitAngle, extrusion, disintegrate, direction, speed, turbulence, fringe, keyDark}) => {
  const frame = useCurrentFrame();
  const {w, h, portrait} = useStage();
  const px = usePlatePixels({src: src || undefined}, 360);
  const ready = !src || !!px;
  const layers = extrusion > 0 ? 4 : 1;
  const cloud = useMemo(() => (ready ? buildCloud(src ? px : null, density, w / h, keyDark, layers) : null), [ready, px, src, density, w, h, keyDark, layers]);

  const intro = prog(frame, 0, 36, ease.linear);
  const yaw = lerp(-orbitAngle, orbitAngle, ease.sine(prog(frame, 6, 205, ease.linear))) * (Math.PI / 180);
  const pitch = (4 + 5 * Math.sin(frame / 60)) * (Math.PI / 180);
  const ext = extrusion * prog(frame, 70, 108, ease.inOut);
  const dir = direction >= 0 ? 1 : -1;
  const halfW = cloud ? (cloud.xmax - cloud.xmin) / 2 + 0.6 : 5;
    const frontSpeed = ((2 * halfW + 1) / 62) * 30;
  const front = disintegrate ? -halfW - 0.5 + ((frame - 140) / 30) * frontSpeed : -999;
  const dist = (portrait ? 23 : 16.5) * lerp(1.08, 0.95, ease.sine(prog(frame, 0, 240, ease.linear)));
  const camPos: V3 = [Math.sin(yaw) * dist * Math.cos(pitch), Math.sin(pitch) * dist, Math.cos(yaw) * dist * Math.cos(pitch)];
  const fov = portrait ? 40 : 38;
  // pixel scale so beadSize is in world units
  const pxScale = h / (2 * Math.tan(((fov / 2) * Math.PI) / 180));
  return (
    <AbsoluteFill style={{background}}>
      {cloud && (
        <Stage3D>
          <CameraRig position={camPos} target={[0, 0, 0]} fov={fov} />
          <Beads
            cloud={cloud}
            u={{
              uDepth: depthScale,
              uExtrude: ext,
              uFront: front,
              uFrontSpeed: frontSpeed,
              uDir: dir,
              uSpeed: speed,
              uTurb: turbulence,
              uSize: beadSize,
              uIntro: intro * 1.5,
              uTime: frame / 30,
              uPx: pxScale,
              uFringe: fringe,
            }}
          />
        </Stage3D>
      )}
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

export const pointcloudOrbit = defineMotion<Props>({
  id: 'pointcloud-orbit',
  title: 'Point cloud orbit',
  category: '3d',
  description:
    'An image (default: a procedural swordswoman) becomes a 3D cloud of coloured beads pushed forward by brightness; the camera orbits, beads extrude into voxel columns, then the figure disintegrates into white particles blown sideways.',
  source: ['video18 0:09-0:12'],
  useFor: 'Turn any still into a living 3D data sculpture; "Thanos snap" exits; tech/AI vision moments.',
  durationInFrames: 240,
  defaultProps: {
    src: '',
    background: '#050407',
    density: 1,
    depthScale: 2.4,
    beadSize: 0.085,
    orbitAngle: 24,
    extrusion: 1,
    disintegrate: true,
    direction: 1,
    speed: 5,
    turbulence: 0.8,
    fringe: 0.07,
    keyDark: 0.06,
  },
  propDocs: {
    src: 'optional image in public/ (e.g. demo/owl.jpg); empty = procedural figure',
    background: 'backdrop colour',
    density: 'grid density multiplier (1 ≈ 150 rows)',
    depthScale: 'how far brightness pushes beads toward the camera',
    beadSize: 'bead diameter in world units (picture is 10 units tall)',
    orbitAngle: 'camera yaw swing in degrees (±)',
    extrusion: '0..1 voxel column extrusion (0 = flat relief only)',
    disintegrate: 'blow the cloud away at the end',
    direction: '+1 blow to the right, -1 to the left',
    speed: 'particle drift speed (world units per second)',
    turbulence: 'noise turbulence amplitude',
    fringe: 'RGB rim split on each bead (0 = off)',
    keyDark: 'for images: luminance below this is keyed out (0 = keep all)',
  },
  component: PointcloudOrbit,
  tags: ['3d', 'particles', 'pointcloud', 'image', 'disintegrate', 'three'],
});
