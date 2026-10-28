import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {clamp, lerp} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {FilmGrain, useStage} from '../../core/stage';
import {CameraRig, Stage3D} from '../../core/three-kit';
import {defineMotion} from '../../core/types';
import {hexRgb, ReelHud, SWISS, useGlyphPoints} from '../../core/r2-x14-kit';

/**
 * x2 chapter 05 "PARTICLE": a title glyph dissolves into thousands of sand-like particles (cream with a few red and
 * lime specks) which sweep — left of the word first — into a slowly rotating Fibonacci sphere around a red core,
 * the sphere flattens and opens into a tilted torus that spins, and finally everything collapses into a tiny
 * glowing red-orange core with a bloom. A mono caption tracks it ("N = 5,200 · GLYPH → SPHERE", "COLLAPSE").
 * three.js Points; every position is computed per frame from the frame number (deterministic).
 */

type Shape = 'glyph' | 'sphere' | 'torus' | 'ring' | 'cube';
type Props = {
  text: string;
  count: number;
  shapes: Shape[];
  holdFrames: number;
  morphFrames: number;
  collapse: boolean;
  colors: string[];
  colorMix: number[];
  background: string;
  coreColor: string;
  rotation: number;
  particleSize: number;
  captions: boolean;
  hud: boolean;
  label: string;
  seed: number;
};

const FOV = 30;
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const GOLD = Math.PI * (3 - Math.sqrt(5));
const PHI = (Math.sqrt(5) - 1) / 2;

const vert = /* glsl */ `
attribute float size;
attribute vec3 color;
varying vec3 vColor;
varying float vShade;
uniform float uScale;
uniform float uDist;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float z = -mv.z;
  gl_PointSize = max(1.0, size * uScale / z);
  // nearer = brighter, far side of the sphere dims (depth reads without lighting)
  vShade = clamp(1.0 - (z - uDist) * 1.6, 0.42, 1.12);
  vColor = color;
  gl_Position = projectionMatrix * mv;
}`;
const frag = /* glsl */ `
varying vec3 vColor;
varying float vShade;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(min(vColor * vShade, vec3(1.0)), 1.0);
}`;

const Cloud: React.FC<{pos: Float32Array; size: Float32Array; col: Float32Array; scale: number; dist: number}> = ({pos, size, col, scale, dist}) => {
  const n = size.length;
  const {geo, mat} = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const m = new THREE.ShaderMaterial({vertexShader: vert, fragmentShader: frag, uniforms: {uScale: {value: 1}, uDist: {value: 1}}, depthTest: true, depthWrite: true});
    return {geo: g, mat: m};
  }, [n]);
  const pts = useMemo(() => {
    const p = new THREE.Points(geo, mat);
    p.frustumCulled = false;
    return p;
  }, [geo, mat]);
  useLayoutEffect(() => {
    (geo.attributes.position as THREE.BufferAttribute).copyArray(pos);
    (geo.attributes.size as THREE.BufferAttribute).copyArray(size);
    (geo.attributes.color as THREE.BufferAttribute).copyArray(col);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.size.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    mat.uniforms.uScale.value = scale;
    mat.uniforms.uDist.value = dist;
  });
  return <primitive object={pts} />;
};

const rotY = (x: number, y: number, z: number, a: number): [number, number, number] => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const rotX = (x: number, y: number, z: number, a: number): [number, number, number] => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];

const ParticleShapeMorph: React.FC<Props> = ({
  text,
  count,
  shapes,
  holdFrames,
  morphFrames,
  collapse,
  colors,
  colorMix,
  background,
  coreColor,
  rotation,
  particleSize,
  captions,
  hud,
  label,
  seed,
}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, fps, portrait} = useStage();
  const N = Math.max(200, Math.min(12000, Math.round(count)));
  const word = text || 'FLOW';
  const glyph = useGlyphPoints(word, fonts.display, 400, N, seed);
  const s = Math.min(w, h); // 1 world unit = short side in px (at z = 0)
  const dist = (0.5 * (h / s)) / Math.tan(((FOV / 2) * Math.PI) / 180);
  const seq: Shape[] = shapes.length ? shapes : ['glyph', 'sphere', 'torus'];

  // ---- per-particle constants ----
  const P = useMemo(() => {
    const r = rng(seed * 4099 + 11);
    const mixSum = colorMix.reduce((a, b) => a + b, 0) || 1;
    const cols = colors.map((c) => hexRgb(c).map((v) => v / 255));
    const col = new Float32Array(N * 3);
    const base = new Float32Array(N);
    const jit = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      let k = r() * mixSum;
      let ci = 0;
      while (ci < colorMix.length - 1 && k > colorMix[ci]) {
        k -= colorMix[ci];
        ci++;
      }
      const c = cols[Math.min(ci, cols.length - 1)] ?? [1, 1, 1];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
      base[i] = 0.7 + r() * 0.6;
      jit[i * 3] = r() * 2 - 1;
      jit[i * 3 + 1] = r() * 2 - 1;
      jit[i * 3 + 2] = r() * 2 - 1;
    }
    return {col, base, jit};
  }, [N, seed, colors.join(','), colorMix.join(',')]);

  // glyph size (world units): ink-box height 0.28, width ≤ 0.86 of the frame width
  const gAspect = glyph?.aspect ?? 3;
  const G = Math.min(0.3, (0.86 * (w / s)) / gAspect);
  // x rank of each glyph point -> sweep delay (left side of the word leaves first)
  const xRank = useMemo(() => {
    const out = new Float32Array(N);
    if (!glyph) return out;
    const idx = Array.from({length: N}, (_, i) => i).sort((a, b) => glyph.pts[a * 2] - glyph.pts[b * 2]);
    idx.forEach((i, k) => (out[i] = k / N));
    return out;
  }, [glyph, N]);

  // ---- timeline ----
  const hold0 = Math.round(holdFrames * 0.5);
  const segs: {from: Shape; to: Shape; a: number; b: number}[] = [];
  let t0 = hold0;
  for (let k = 1; k < seq.length; k++) {
    const m = k === 1 && seq[0] === 'glyph' ? Math.round(morphFrames * 1.2) : morphFrames;
    segs.push({from: seq[k - 1], to: seq[k], a: t0, b: t0 + m});
    t0 += m + holdFrames;
  }
  const collapseAt = t0;
  const collapseEnd = collapseAt + 12;
  const spin = ((rotation * Math.PI) / 180 / fps) * frame;

  const shapePos = (sh: Shape, i: number): [number, number, number] => {
    switch (sh) {
      case 'glyph': {
        if (!glyph) return [0, 0, 0];
        return [glyph.pts[i * 2] * G, glyph.pts[i * 2 + 1] * G, P.jit[i * 3 + 2] * 0.012];
      }
      case 'sphere': {
        const R = 0.31;
        const y = 1 - (2 * (i + 0.5)) / N;
        const rr = Math.sqrt(1 - y * y);
        const th = i * GOLD;
        let p = [Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R] as [number, number, number];
        p = rotY(...p, spin);
        return rotX(...p, 0.32); // tilted axis
      }
      case 'torus': {
        const R = 0.27;
        const r = 0.095;
        // lattice: M rings around the main circle, K points per ring (tube lines like the source)
        const M = Math.max(12, Math.round(Math.sqrt((N * R) / r)));
        const K = Math.max(6, Math.floor(N / M));
        const ring = Math.floor(i / K) % M;
        const a = (2 * Math.PI * (ring + (i % K) * 0.0)) / M + spin * 1.4;
        const v = (2 * Math.PI * (i % K)) / K + ring * 0.5;
        let p = [(R + r * Math.cos(v)) * Math.cos(a), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(a)] as [number, number, number];
        return rotX(...p, 0.52); // viewed ≈ 60° from its axis
      }
      case 'ring': {
        const a = (2 * Math.PI * i) / N + spin;
        const rad = 0.3 + P.jit[i * 3] * 0.04;
        return rotX(Math.cos(a) * rad, P.jit[i * 3 + 1] * 0.015, Math.sin(a) * rad, 0.45);
      }
      case 'cube': {
        const face = i % 6;
        const a = P.jit[i * 3] * 0.22;
        const b = P.jit[i * 3 + 1] * 0.22;
        const c = face % 2 ? 0.22 : -0.22;
        const q: [number, number, number] = face < 2 ? [c, a, b] : face < 4 ? [a, c, b] : [a, b, c];
        return rotX(...rotY(...q, spin + 0.6), 0.4);
      }
    }
  };

  // ---- evaluate ----
  const pos = new Float32Array(N * 3);
  const size = new Float32Array(N);
  let released = 0;
  let caption = '';
  let collapseU = 0;
  const seg = segs.find((g) => frame < g.b + holdFrames) ?? segs[segs.length - 1];
  for (let i = 0; i < N; i++) {
    let p: [number, number, number];
    let sz = P.base[i] * particleSize;
    if (!seg || frame < seg.a) {
      // first hold: the glyph "breaks up" (jitter grows)
      p = shapePos(seq[0], i);
      const j = clamp((frame - hold0 * 0.3) / Math.max(1, hold0 * 0.7)) * 0.006;
      p = [p[0] + P.jit[i * 3] * j, p[1] + P.jit[i * 3 + 1] * j, p[2]];
      if (seq[0] === 'glyph') sz *= 1.45;
    } else {
      const fromGlyph = seg.from === 'glyph';
      const span = seg.b - seg.a;
      const delay = fromGlyph ? xRank[i] * 0.4 * span : ((i * 0.618) % 1) * 0.15 * span;
      const dur = span - (fromGlyph ? 0.4 : 0.15) * span;
      const e = easeIO(clamp((frame - seg.a - delay) / dur));
      if (e > 0) released++;
      const A = shapePos(seg.from, i);
      const B = shapePos(seg.to, i);
      p = [lerp(A[0], B[0], e), lerp(A[1], B[1], e), lerp(A[2], B[2], e)];
      // swirl: a sideways arc while in flight
      const sw = Math.sin(Math.PI * e) * (fromGlyph ? 0.9 : 0.5);
      p = rotY(...p, sw);
      p = [p[0] + P.jit[i * 3] * 0.03 * Math.sin(Math.PI * e), p[1] + P.jit[i * 3 + 1] * 0.03 * Math.sin(Math.PI * e), p[2]];
      if (fromGlyph) sz *= lerp(1.45, 1, e);
    }
    if (collapse && frame >= collapseAt) {
      collapseU = clamp((frame - collapseAt) / (collapseEnd - collapseAt));
      const c = collapseU * collapseU * collapseU;
      const spiral = c * 1.8;
      p = rotY(p[0] * (1 - c), p[1] * (1 - c), p[2] * (1 - c), spiral);
      sz *= 1 - 0.85 * c;
      if (collapseU >= 1) sz = 0;
    }
    pos[i * 3] = p[0];
    pos[i * 3 + 1] = p[1];
    pos[i * 3 + 2] = p[2];
    size[i] = sz * u;
  }
  const fmt = (n: number) => n.toLocaleString('en-US');
  if (collapse && frame >= collapseAt) caption = 'COLLAPSE';
  else if (!seg || frame < seg.a) caption = `N = ${fmt(N)} · ${seq[0].toUpperCase()}`;
  else caption = `N = ${fmt(seg.from === 'glyph' ? Math.max(released, 0) : N)} · ${seg.from.toUpperCase()} → ${seg.to.toUpperCase()}`;

  // ---- core + bloom (screen space, always on top) ----
  const coreOn = seq[0] === 'glyph' ? clamp((frame - (segs[0]?.a ?? 0)) / 10) : 1;
  const flash = collapse ? clamp(1 - Math.abs(frame - collapseEnd) / 6) : 0;
  const after = collapse && frame > collapseEnd ? frame - collapseEnd : -1;
  const bloomR = (after >= 0 ? lerp(0.25, 0.14, clamp(after / 20)) + 0.015 * Math.sin(after * 0.25) : lerp(0.05, 0.25, collapseU * collapseU)) * s;
  const coreR = 0.0125 * s * (1 + flash * 0.8 + collapseU * 0.6);
  const bloomA = after >= 0 ? 0.55 : 0.35 + 0.4 * collapseU;
  const [cr, cg, cb] = hexRgb(coreColor);
  const capFs = (portrait ? 26 : 12) * u;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      {glyph ? (
        <Stage3D flat>
          <CameraRig position={[0, 0, dist]} target={[0, 0, 0]} fov={FOV} near={0.05} far={20} />
          <Cloud pos={pos} size={size} col={P.col} scale={dist} dist={dist} />
        </Stage3D>
      ) : null}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <defs>
          <radialGradient id={`psm-bloom-${seed}`}>
            <stop offset="0%" stopColor={`rgb(${cr},${cg},${cb})`} stopOpacity={1} />
            <stop offset="35%" stopColor={`rgb(${cr},${cg},${cb})`} stopOpacity={0.35} />
            <stop offset="100%" stopColor={`rgb(${cr},${cg},${cb})`} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g opacity={coreOn}>
          <circle cx={cx} cy={cy} r={bloomR} fill={`url(#psm-bloom-${seed})`} opacity={bloomA} style={{mixBlendMode: 'screen'}} />
          <circle cx={cx} cy={cy} r={coreR * 2.2} fill={`url(#psm-bloom-${seed})`} opacity={0.9} />
          <circle cx={cx} cy={cy} r={coreR} fill={coreColor} />
          {flash > 0 ? <circle cx={cx} cy={cy} r={coreR * 0.55} fill="#FFF3E6" opacity={flash} /> : null}
        </g>
        {captions ? (
          <text x={cx} y={Math.min(cy + 0.42 * s, h - 130 * u)} textAnchor="middle" style={{font: `500 ${capFs}px ${fonts.mono}`, letterSpacing: capFs * 0.3}} fill={SWISS.cream} opacity={0.55}>
            {caption}
          </text>
        ) : null}
      </svg>
      <FilmGrain opacity={0.05} />
      {hud ? <ReelHud ink={SWISS.cream} label={label} footer={`MOTION REEL / ${w}×${h} / ${fps} FPS`} active={4} progress={frame / (collapseEnd + 20)} beat={!!seg && frame >= seg.a && frame < seg.b} opacity={0.42} scale={portrait ? 2 : 1} /> : null}
    </AbsoluteFill>
  );
};

export const particleShapeMorph = defineMotion<Props>({
  id: 'particle-shape-morph',
  title: 'Particle shape morph',
  category: '3d',
  description:
    'A title glyph dissolves into ≈ 5 k sand-like particles that sweep (left first) into a rotating Fibonacci sphere around a red core, open into a tilted spinning torus, then collapse into a tiny glowing core with an orange bloom, while a mono caption tracks N and the stage.',
  source: ['video x2 0:07.75-0:09.95 (chapter 05 PARTICLE)'],
  useFor: '"Ideas / data take shape" beats, logo-to-particle intros, tech-product hero loops; the collapse hands off to a shockwave or flash transition.',
  durationInFrames: 205,
  defaultProps: {
    text: 'FLOW',
    count: 5200,
    shapes: ['glyph', 'sphere', 'torus'],
    holdFrames: 40,
    morphFrames: 30,
    collapse: true,
    colors: [SWISS.sand, SWISS.red, SWISS.lime],
    colorMix: [85, 8, 7],
    background: SWISS.black,
    coreColor: SWISS.red,
    rotation: 30,
    particleSize: 3,
    captions: true,
    hud: true,
    label: '05 — PARTICLE',
    seed: 3,
  },
  propDocs: {
    text: 'word the particles start as (sampled from the rendered font)',
    count: 'number of particles (200–12000)',
    shapes: 'shape sequence: glyph | sphere | torus | ring | cube (glyph only makes sense first)',
    holdFrames: 'frames each shape holds (the first glyph holds half of it)',
    morphFrames: 'frames per morph (glyph → first shape is 20 % longer, swept left to right)',
    collapse: 'end by collapsing everything into the glowing core',
    colors: 'particle colours',
    colorMix: 'relative share of each colour (default 85 / 8 / 7 %)',
    background: 'background colour',
    coreColor: 'core dot and bloom colour',
    rotation: 'rotation speed of the 3D shapes in degrees per second',
    particleSize: 'particle diameter in u (randomised ±30 %)',
    captions: 'show the mono "N = … · A → B" caption',
    hud: 'show the reel HUD',
    label: 'HUD chapter label',
    seed: 'sampling / colour seed',
  },
  component: ParticleShapeMorph,
  tags: ['particles', 'point cloud', 'morph', 'sphere', 'torus', 'glyph', 'text to particles', 'collapse', 'core', 'bloom', 'three.js', 'fibonacci', 'data', 'swiss', 'x2'],
});
