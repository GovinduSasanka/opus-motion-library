import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';

import {FilmGrain, useStage} from '../../core/stage';
import {fbm2 as fbm, nz2 as n2, CameraRig, catmull, makeCamera, mixCol, hexOf, noiseTexture, projectPx, SceneFog, SkyDome, smoothstep, Stage3D, typedCount, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * video8 "every pixel is math": a heightmap mountain that is rebuilt in labelled stages
 * (flat → noise → fractal → erosion → material → sun → atmosphere → clouds → lens) while a code panel
 * types each stage, then a cinematic eased fly-by past the hero peak with lens ghosts.
 * Real 3D: displaced PlaneGeometry with vertex colours, shadow-mapped sun, gradient sky dome, exp fog,
 * stacked alpha cloud layers. Stage overlay = stage-title-block + ide-typewriter-panel + stage-cut.
 */

type Stage = {title: string; subtitle: string; file: string; code: string};
type Props = {
  stages: Stage[];
  seed: number;
  stageFrames: number;
  leadIn: number;
  flyby: boolean;
  flybyFrames: number;
  showCode: boolean;
  showTitle: boolean;
  sunElevation: number;
  sunAzimuth: number;
  snowLine: number;
  colors: {rock: string; scree: string; grass: string; snow: string; clay: string; sun: string; zenith: string; horizon: string; cloudShadow: string; cloudLight: string};
};

const STAGES: Stage[] = [
  {title: 'NOTHING', subtitle: 'a flat plane.', file: 'world.glsl', code: 'float terrain(vec2 p) {\n  return 0.0;\n}'},
  {title: 'NOISE', subtitle: 'one octave of noise.', file: 'world.glsl', code: 'float terrain(vec2 p) {\n  return 1500.0 * noise(p / 2600.0);\n}'},
  {
    title: 'FRACTAL',
    subtitle: 'twelve octaves. mountains.',
    file: 'terrain.js',
    code: 'for (let o = 0; o < 12; o++) {\n  const n = noised(p); d += n.yz;\n  h += a * n.x / (1.0 + dot(d, d));\n  a *= 0.5; p = m2 * p * 2.0;\n}',
  },
  {
    title: 'EROSION',
    subtitle: '10,485,760 simulated raindrops.',
    file: 'erosion.js',
    code: 'for (let d = 0; d < 10485760; d++) {\n  const cap = max(-dh * speed * water, 0.01);\n  if (sed > cap) deposit(sed - cap);\n  else erode(cap - sed);\n}',
  },
  {
    title: 'MATERIAL',
    subtitle: 'rock. scree. snow.',
    file: 'world.glsl',
    code: 'rock = mix(rock, scree, sediment);\nsnow = smoothstep(.62, .80, normal.y);\nalbedo = mix(rock, vec3(.9, .92, .95), snow);',
  },
  {
    title: 'SUN',
    subtitle: 'a star, 8 light-minutes away.',
    file: 'world.glsl',
    code: 'float sh = softShadow(p + n * 2.0, SUN);\nvec3 sun = sunTrans(p) * SUNI;\ncol = albedo * (sun * max(dot(n, SUN), 0.0) * sh\n      + sky * occ);',
  },
  {
    title: 'ATMOSPHERE',
    subtitle: 'rayleigh · mie · ozone.',
    file: 'world.glsl',
    code: 'const vec3 BR = vec3(5.8e-6, 13.5e-6, 33.1e-6);\nconst vec3 BM = vec3(21e-6);\ncol = col * transmittance + inscatter(ro, rd, t);',
  },
  {
    title: 'CLOUDS',
    subtitle: 'volumetric. perlin-worley.',
    file: 'world.glsl',
    code: 'for (int i = 0; i < 110; i++) {\n  float d = clouds(p, true, HF);\n  acc += Tr * (1.0 - exp(-d * dt));\n  Tr *= exp(-d * dt);\n}',
  },
  {title: 'LENS', subtitle: 'and a camera.', file: 'post.glsl', code: 'motionBlur(); depthOfField();\ngodRays();    lensFlare();\nbloom();      filmGrain();'},
];

const COLORS: Props['colors'] = {
  rock: '#6e6a66',
  scree: '#9a948c',
  grass: '#4f6a3a',
  snow: '#f2f2f2',
  clay: '#bcbcbc',
  sun: '#ffbe6e',
  zenith: '#4c545b',
  horizon: '#af8a0e',
  cloudShadow: '#444759',
  cloudLight: '#c19464',
};

// ------------------------------------------------------------------------------------------------
// terrain fields
// ------------------------------------------------------------------------------------------------
const SIZE = 210;
const SEG = 256;
const PEAK: [number, number] = [2, -12];

type Field = {h1: Float32Array; h2: Float32Array; h3: Float32Array; mat: Float32Array; n: number};

const ridged = (s: string, x: number, z: number, oct: number) => {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  let w = 1;
  for (let o = 0; o < oct; o++) {
    let r = 1 - Math.abs(n2(s + o, x * f, z * f));
    r *= r;
    r *= w;
    w = clamp(r * 1.6, 0, 1);
    v += r * amp;
    f *= 2.03;
    amp *= 0.5;
  }
  return v;
};

const blurField = (src: Float32Array, n: number, r: number, passes: number) => {
  let a = src.slice();
  let b = new Float32Array(a.length);
  for (let p = 0; p < passes; p++) {
    for (let z = 0; z < n; z++)
      for (let x = 0; x < n; x++) {
        let s = 0;
        let c = 0;
        for (let k = -r; k <= r; k++) {
          const xx = Math.min(n - 1, Math.max(0, x + k));
          s += a[z * n + xx];
          c++;
        }
        b[z * n + x] = s / c;
      }
    for (let z = 0; z < n; z++)
      for (let x = 0; x < n; x++) {
        let s = 0;
        let c = 0;
        for (let k = -r; k <= r; k++) {
          const zz = Math.min(n - 1, Math.max(0, z + k));
          s += b[zz * n + x];
          c++;
        }
        a[z * n + x] = s / c;
      }
  }
  return a;
};

const buildField = (seed: number, colors: Props['colors'], snowLine: number): Field => {
  const n = SEG + 1;
  const s = 'terr' + seed;
  const h1 = new Float32Array(n * n);
  const h2 = new Float32Array(n * n);
  const cell = SIZE / SEG;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const x = -SIZE / 2 + i * cell;
      const z = -SIZE / 2 + j * cell;
      const k = j * n + i;
      h1[k] = 2.2 + 3.0 * n2(s + 'one', x / 30, z / 30);
      // domain warp
      const wx = x + 7 * n2(s + 'wx', x / 45, z / 45);
      const wz = z + 7 * n2(s + 'wz', x / 45 + 7, z / 45);
      const range = 0.35 + 0.65 * smoothstep(-0.5, 0.6, n2(s + 'rng', x / 60, z / 60));
      // octaves limited so the finest wavelength stays >= ~3 grid cells (no aliasing spikes)
      const r = ridged(s, wx / 40, wz / 40, 5);
      const dx = x - PEAK[0];
      const dz = (z - PEAK[1]) * 1.1;
      // faceted pyramid (aretes) blended with a radial cone
      let poly = -1e9;
      for (let q = 0; q < 4; q++) {
        const a = q * (Math.PI / 2) + 0.55;
        poly = Math.max(poly, dx * Math.cos(a) + dz * Math.sin(a));
      }
      const rad = Math.sqrt(dx * dx + dz * dz);
      const d = lerp(rad, poly * 1.18, 0.55) + 2.2 * n2(s + 'pd', x / 9, z / 9);
      const hero = 35 * Math.pow(Math.max(0, 1 - d / 30), 1.55) * (0.86 + 0.24 * ridged(s + 'h', wx / 14, wz / 14, 3));
      // keep the near foreground lower so the hero reads; taper to the skirt at the edges
      const near = 1 - 0.5 * smoothstep(25, 80, z);
      const edge = 1 - smoothstep(SIZE * 0.36, SIZE * 0.49, Math.max(Math.abs(x), Math.abs(z)));
      h2[k] = 1.0 + (r * 15 * range * near + hero) * edge;
      h1[k] = 1.0 + (h1[k] - 1.0) * edge;
    }
  // erosion-ish: carve gullies on steep slopes, flatten valleys with a blurred copy (scree fans)
  const blur = blurField(h2, n, 3, 3);
  const h3 = new Float32Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const k = j * n + i;
      const x = -SIZE / 2 + i * cell;
      const z = -SIZE / 2 + j * cell;
      const hx = h2[j * n + Math.min(n - 1, i + 1)] - h2[j * n + Math.max(0, i - 1)];
      const hz = h2[Math.min(n - 1, j + 1) * n + i] - h2[Math.max(0, j - 1) * n + i];
      const slope = Math.sqrt(hx * hx + hz * hz) / (2 * cell);
      // gullies run downhill: stretch noise along the gradient
      const g = 1 - Math.abs(n2(s + 'gul', (x * hz - z * hx) * 0.02 + x * 0.25, (x * hx + z * hz) * 0.02 + z * 0.25));
      const gully = Math.pow(g, 4) * Math.min(1.6, slope) * 1.6;
      const low = 1 - smoothstep(1.5, 10, h2[k]);
      let v = h2[k] - gully;
      v = lerp(v, blur[k], 0.65 * low);
      v += 0.3 * n2(s + 'fine', x / 3, z / 3) * Math.min(1, slope);
      h3[k] = v;
    }
  // material colours from the eroded field
  const mat = new Float32Array(n * n * 3);
  const rock = new THREE.Color(colors.rock);
  const scree = new THREE.Color(colors.scree);
  const grass = new THREE.Color(colors.grass);
  const snow = new THREE.Color(colors.snow);
  const tmp = new THREE.Color();
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const k = j * n + i;
      const x = -SIZE / 2 + i * cell;
      const z = -SIZE / 2 + j * cell;
      const hx = h3[j * n + Math.min(n - 1, i + 1)] - h3[j * n + Math.max(0, i - 1)];
      const hz = h3[Math.min(n - 1, j + 1) * n + i] - h3[Math.max(0, j - 1) * n + i];
      const ny = 1 / Math.sqrt(1 + (hx * hx + hz * hz) / (4 * cell * cell));
      const h = h3[k];
      const nz = n2(s + 'mat', x / 6, z / 6);
      const sed = smoothstep(0.55, 0.9, ny) * (0.5 + 0.5 * nz);
      tmp.copy(rock).lerp(scree, clamp(sed + 0.2 * n2(s + 'r', x / 2, z / 2)));
      const g = (1 - smoothstep(3.5, 7.5, h + 2 * nz)) * smoothstep(0.7, 0.9, ny);
      tmp.lerp(grass, g * 0.95);
      const snowAmt = smoothstep(0.42, 0.68, ny) * smoothstep(snowLine - 2, snowLine + 2, h + 3 * nz);
      tmp.lerp(snow, snowAmt);
      // streaks of snow in steep gullies high up
      const streak = smoothstep(snowLine + 2, snowLine + 7, h) * smoothstep(0.2, 0.45, ny) * Math.pow(Math.max(0, n2(s + 'st', x / 1.2, z / 3)), 2);
      tmp.lerp(snow, streak);
      mat[k * 3] = tmp.r;
      mat[k * 3 + 1] = tmp.g;
      mat[k * 3 + 2] = tmp.b;
    }
  return {h1, h2, h3, mat, n};
};

const heightAt = (f: Field, x: number, z: number) => {
  const n = f.n;
  const gx = ((x + SIZE / 2) / SIZE) * SEG;
  const gz = ((z + SIZE / 2) / SIZE) * SEG;
  if (gx < 0 || gz < 0 || gx >= SEG || gz >= SEG) return 0;
  const i = Math.floor(gx);
  const j = Math.floor(gz);
  const fx = gx - i;
  const fz = gz - j;
  const a = f.h3[j * n + i];
  const b = f.h3[j * n + i + 1];
  const c = f.h3[(j + 1) * n + i];
  const d = f.h3[(j + 1) * n + i + 1];
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
};

// ------------------------------------------------------------------------------------------------
// 3D pieces
// ------------------------------------------------------------------------------------------------
const Terrain: React.FC<{field: Field; a1: number; a2: number; a3: number; matT: number; clay: string}> = ({field, a1, a2, a3, matT, clay}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    g.rotateX(-Math.PI / 2);
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(field.n * field.n * 3), 3));
    return g;
  }, [field]);
  useLayoutEffect(() => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const {h1, h2, h3} = field;
    // PlaneGeometry rows run from -z (top) after rotateX: vertex k at (x, z) with z = -SIZE/2 + row*cell
    for (let k = 0; k < h1.length; k++) {
      let h = h1[k] * a1;
      h = lerp(h, h2[k], a2);
      h = lerp(h, h3[k], a3);
      arr[k * 3 + 1] = h;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }, [geo, field, a1, a2, a3]);
  useLayoutEffect(() => {
    const c = geo.attributes.color as THREE.BufferAttribute;
    const arr = c.array as Float32Array;
    const cl = new THREE.Color(clay);
    for (let k = 0; k < field.n * field.n; k++) {
      arr[k * 3] = lerp(cl.r, field.mat[k * 3], matT);
      arr[k * 3 + 1] = lerp(cl.g, field.mat[k * 3 + 1], matT);
      arr[k * 3 + 2] = lerp(cl.b, field.mat[k * 3 + 2], matT);
    }
    c.needsUpdate = true;
  }, [geo, field, matT, clay]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
    </mesh>
  );
};

/** PlaneGeometry vertex order check: row j has z = -SIZE/2 + j*cell after rotateX(-90°) (y up). */

const Sun: React.FC<{dir: V3; color: string; intensity: number}> = ({dir, color, intensity}) => {
  const light = useMemo(() => {
    const l = new THREE.DirectionalLight('#ffffff', 1);
    l.castShadow = true;
    l.shadow.mapSize.set(4096, 4096);
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -95;
    c.right = 95;
    c.top = 95;
    c.bottom = -95;
    c.near = 1;
    c.far = 500;
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.35;
    l.shadow.radius = 3;
    return l;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Vector3(...dir).normalize();
    light.position.copy(d.multiplyScalar(220));
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();
    light.color.set(color);
    light.intensity = intensity;
    light.shadow.camera.updateProjectionMatrix();
  }, [light, dir[0], dir[1], dir[2], color, intensity]);
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};

const Clouds: React.FC<{seed: number; cover: number; base: number; shadow: string; light: string; drift: number}> = ({seed, cover, base, shadow, light, drift}) => {
  const layers = 5;
  const tex = useMemo(
    () =>
      Array.from({length: layers}, (_, L) =>
        noiseTexture(256, (x, y) => {
          // tileable via torus mapping
          const a = x * Math.PI * 2;
          const b = y * Math.PI * 2;
          const v = fbm('cl' + seed + L, Math.cos(a) * 1.3 + Math.sin(b) * 0.4, Math.sin(a) * 1.3 + Math.cos(b) * 1.6, 5);
          return smoothstep(-0.25 + L * 0.05, 0.45, v);
        }),
      ),
    [seed],
  );
  const mats = useMemo(() => tex.map((t) => new THREE.MeshBasicMaterial({alphaMap: t, transparent: true, depthWrite: false, color: '#ffffff', side: THREE.DoubleSide})), [tex]);
  useLayoutEffect(() => {
    mats.forEach((m, L) => {
      const k = L / (layers - 1);
      m.color.copy(mixCol(shadow, light, 0.1 + 0.9 * k));
      m.opacity = cover * (0.7 + 0.28 * k);
      const t = m.alphaMap!;
      t.repeat.set(2.2, 2.2);
      t.offset.set(drift * (0.6 + L * 0.1), drift * 0.15);
    });
  }, [mats, cover, shadow, light, drift]);
  if (cover <= 0.001) return null;
  return (
    <group position={[0, base, 0]}>
      {mats.map((m, L) => (
        <mesh key={L} material={m} position={[0, L * 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={L}>
          <planeGeometry args={[420, 420]} />
        </mesh>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------------------------------------
// overlay: stage title block + code panel
// ------------------------------------------------------------------------------------------------
const KW = new Set('float int vec2 vec3 vec4 return for const let if else'.split(' '));
const TOK = /(\/\/.*$)|(\b\d[\d_.]*(?:e-?\d+)?\b|\.\d+)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+)|([\s\S])/g;
const hl = (line: string) => {
  const out: {t: string; c: string}[] = [];
  for (const m of line.matchAll(TOK)) {
    const [s, com, num, fn, word] = m;
    let c = '#d8dade';
    if (com) c = '#7a7d85';
    else if (num) c = '#e0a860';
    else if (fn) c = KW.has(fn) ? '#b898d8' : '#88a0d8';
    else if (word) c = KW.has(word) ? '#b898d8' : '#d8dade';
    out.push({t: s, c});
  }
  return out;
};

const TitleBlock: React.FC<{stages: Stage[]; idx: number; local: number; u: number; alpha: number}> = ({stages, idx, local, u, alpha}) => {
  const st = stages[idx];
  const blank = idx > 0 && local < 2;
  const tIn = prog(local - 2, 0, 6, ease.out);
  const sIn = prog(local - 6, 0, 5, ease.out) * 0.85;
  const m = 72 * u;
  const total = stages.length - 1;
  return (
    <div style={{position: 'absolute', left: m, top: 76 * u, opacity: alpha, color: '#f4f4f4'}}>
      <div style={{fontFamily: fonts.mono, fontSize: 19.5 * u, letterSpacing: '0.15em', opacity: 0.7, height: 30 * u}}>
        {String(idx).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
      <div style={{height: 70 * u, overflow: 'hidden'}}>
        {!blank && (
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 58 * u,
              letterSpacing: '0.12em',
              lineHeight: 1.15,
              transform: `translateY(${(1 - tIn) * -30 * u}px)`,
              opacity: tIn,
              textShadow: `0 ${3 * u}px ${12 * u}px rgba(0,0,0,.35)`,
            }}
          >
            {st.title}
          </div>
        )}
      </div>
      <div style={{fontFamily: fonts.sans, fontWeight: 400, fontSize: 30 * u, opacity: blank ? 0 : sIn, height: 42 * u, textShadow: `0 ${2 * u}px ${10 * u}px rgba(0,0,0,.35)`}}>{st.subtitle}</div>
      <div style={{display: 'flex', gap: 4.5 * u, marginTop: 10 * u}}>
        {stages.map((_, i) => (
          <div key={i} style={{width: 31.5 * u, height: 3 * u, background: i <= idx ? '#f0f4f6' : 'rgba(160,163,172,0.45)'}} />
        ))}
      </div>
    </div>
  );
};

const CodePanel: React.FC<{st: Stage; local: number; u: number; w: number; h: number; portrait: boolean; alpha: number; first: boolean}> = ({st, local, u, w, h, portrait, alpha, first}) => {
  const m = 72 * u;
  const width = portrait ? w - 2 * m : Math.min(w - 2 * m, w * 0.59 - m * 0.4);
  const typeStart = 3;
  const typeDur = 32;
  const code = st.code;
  const n = local < 2 && !first ? 0 : typedCount(code, local, typeStart, typeDur);
  const shown = code.slice(0, n);
  const lines = shown.split('\n');
  const allLines = code.split('\n');
  // line appearance frames for the height animation
  const lineFrames = useMemo(() => {
    const fr: number[] = [0];
    let lc = 1;
    for (let f = typeStart; f <= typeStart + typeDur + 1 && lc < allLines.length; f++) {
      const c = code.slice(0, typedCount(code, f, typeStart, typeDur)).split('\n').length;
      while (lc < c) {
        fr.push(f);
        lc++;
      }
    }
    while (fr.length < allLines.length) fr.push(typeStart + typeDur);
    return fr;
  }, [code]);
  const pitch = 43.5 * u;
  let rows = 0;
  lineFrames.forEach((f, i) => {
    if (i === 0) rows += 1;
    else rows += prog(local, f, f + 5, ease.out);
  });
  if (local < 2 && !first) rows = 1;
  const bodyH = 33 * u + rows * pitch + 40 * u;
  const header = 51 * u;
  const typing = n < code.length;
  const cursorOn = typing || Math.floor((local - typeStart - typeDur) / 15) % 2 === 0;
  const fs = 25.5 * u;
  return (
    <div
      style={{
        position: 'absolute',
        left: m,
        bottom: (portrait ? 110 : 68) * u,
        width,
        height: header + bodyH,
        borderRadius: 15 * u,
        background: 'rgba(58,59,64,0.86)',
        overflow: 'hidden',
        opacity: alpha,
        boxShadow: `0 ${10 * u}px ${40 * u}px rgba(0,0,0,0.25)`,
      }}
    >
      <div style={{height: header, background: '#4f5055', position: 'relative'}}>
        {['#dd5d5d', '#dfac2e', '#2ead4a'].map((c, i) => (
          <div key={c} style={{position: 'absolute', left: (27 + i * 27) * u - 7.5 * u, top: header / 2 - 7.5 * u, width: 15 * u, height: 15 * u, borderRadius: '50%', background: c}} />
        ))}
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.mono, fontSize: 18 * u, color: 'rgba(255,255,255,0.55)'}}>{st.file}</div>
      </div>
      <div style={{position: 'relative', paddingTop: 33 * u, fontFamily: fonts.mono, fontSize: fs, whiteSpace: 'pre'}}>
        {Array.from({length: Math.max(1, Math.round(rows))}, (_, i) => {
          const line = lines[i] ?? '';
          const isLast = i === lines.length - 1;
          return (
            <div key={i} style={{height: pitch, lineHeight: `${pitch}px`, position: 'relative'}}>
              <span style={{position: 'absolute', left: 42 * u, color: '#5b5c61', width: 20 * u, textAlign: 'right'}}>{i + 1}</span>
              <span style={{position: 'absolute', left: 78 * u}}>
                {hl(line).map((s, k) => (
                  <span key={k} style={{color: s.c}}>
                    {s.t}
                  </span>
                ))}
                {isLast && cursorOn && (local >= 2 || first) && (
                  <span style={{display: 'inline-block', width: 13.5 * u, height: 27 * u, background: '#e6e6e6', verticalAlign: 'middle', marginLeft: 1 * u}} />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------------
// main
// ------------------------------------------------------------------------------------------------
const TerrainBuild: React.FC<Props> = ({stages, seed, stageFrames, leadIn, flyby, flybyFrames, showCode, showTitle, sunElevation, sunAzimuth, snowLine, colors}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const C = {...COLORS, ...colors};
  const field = useMemo(() => buildField(seed, C, snowLine), [seed, C.rock, C.scree, C.grass, C.snow, snowLine]);
  const S = (k: number) => leadIn + k * stageFrames;
  const nSt = stages.length;
  const buildEnd = S(nSt);
  const stageIdx = Math.max(0, Math.min(nSt - 1, Math.floor((frame - leadIn) / stageFrames)));
  const local = frame - S(stageIdx);

  // ---- stage-driven scene state (the visual technique order is fixed: index 0..8) ----
  const a1 = prog(frame, S(1) + 4, S(1) + 14, ease.out);
  const a2 = prog(frame, S(2) + 5, S(2) + 16, ease.out);
  const a3 = prog(frame, S(3) + 4, S(3) + 34, ease.sine);
  const matT = prog(frame, S(4), S(4) + 3, ease.linear);
  const sunT = prog(frame, S(5) + 5, S(5) + 40, ease.inOut);
  const atmT = prog(frame, S(6) + 2, S(6) + 14, ease.sine);
  const cloudT = prog(frame, S(7) + 10, S(7) + 46, ease.out);
  const lensT = prog(frame, S(8) + 8, S(8) + 14, ease.out);

  // sun: high studio light -> low golden sun
  const el = lerp(58, sunElevation, sunT) * (Math.PI / 180);
  const az = lerp(150, sunAzimuth, sunT) * (Math.PI / 180);
  const sunDir: V3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  const sunColor = hexOf(mixCol('#ffffff', C.sun, sunT));
  const sunI = lerp(1.7, 3.6, sunT);
  const hemiSky = hexOf(mixCol('#d4d4dc', '#8094b8', sunT));
  const hemiGnd = hexOf(mixCol('#8a8a8a', '#3a3530', sunT));
  const hemiI = lerp(1.15, 1.0, sunT);

  const zen = hexOf(mixCol(mixCol('#9898a0', '#6a7280', sunT), C.zenith, atmT));
  const hor = hexOf(mixCol(mixCol('#7e818a', '#8c8d92', sunT), C.horizon, atmT));
  const fogCol = hexOf(mixCol(mixCol('#8a8c94', '#7c8088', sunT), mixCol(C.horizon, '#6a7078', 0.4), atmT));
  const fogD = lerp(0.005, 0.0085, atmT);

  // ---- camera ----
  const fov = portrait ? 64 : 38;
  const lockPos: V3 = [0, 36, 66];
  const lockTgt: V3 = [1, 26, -10];
  const flyT = flyby ? clamp((frame - (buildEnd - 4)) / flybyFrames) : 0;
  // two overlapping ease-in-out segments: fast start, lull, second push, long settle
  const flyE = flyT <= 0 ? 0 : 0.55 * ease.inOut(clamp(flyT / 0.5)) + 0.45 * ease.sine(clamp((flyT - 0.35) / 0.65));
  const PATH: V3[] = [
    [0, 36, 66],
    [-20, 30, 48],
    [-40, 27, 22],
    [-52, 31, 4],
    [-50, 36, 34],
  ];
  const TGT: V3[] = [
    [1, 26, -10],
    [3, 24, -12],
    [6, 24, -12],
    [40, 26, -18],
    [40, 30, -8],
  ];
  let camPos: V3 = lockPos;
  let camTgt: V3 = lockTgt;
  if (flyE > 0) {
    camPos = catmull(PATH, flyE);
    camTgt = catmull(TGT, flyE);
    const ground = heightAt(field, camPos[0], camPos[2]) + 5;
    if (camPos[1] < ground) camPos = [camPos[0], ground, camPos[2]];
    // slow forward drift continues after the path
  }
  const drift = frame * 0.0009;

  // ---- lens: sun on screen + occlusion for ghosts ----
  const aspect = w / h;
  const cam = makeCamera(camPos, camTgt, fov, aspect);
  const sunWorld: V3 = [camPos[0] + sunDir[0] * 600, camPos[1] + sunDir[1] * 600, camPos[2] + sunDir[2] * 600];
  const sp = projectPx(cam, sunWorld, w, h);
  let vis = 0;
  if (sunT > 0.5 && sp.visible) {
    const offs = [
      [0, 0],
      [0.012, 0],
      [-0.012, 0],
      [0, 0.012],
      [0, -0.012],
    ];
    for (const [ox, oy] of offs) {
      const d = new THREE.Vector3(sunDir[0] + ox, sunDir[1] + oy, sunDir[2]).normalize();
      let hit = false;
      for (let t = 2; t < 220; t += 1.5) {
        const px = camPos[0] + d.x * t;
        const py = camPos[1] + d.y * t;
        const pz = camPos[2] + d.z * t;
        if (Math.abs(px) > SIZE / 2 || Math.abs(pz) > SIZE / 2) break;
        if (py < heightAt(field, px, pz)) {
          hit = true;
          break;
        }
      }
      if (!hit) vis += 0.2;
    }
    vis *= smoothstep(-0.05 * w, 0.05 * w, sp.x) * smoothstep(-0.05 * w, 0.05 * w, w - sp.x) * smoothstep(-0.05 * h, 0.05 * h, sp.y);
  }

  // overlay visibility
  const overlayIn = prog(frame, leadIn, leadIn + 4, ease.linear);
  const overlayOut = flyby ? 1 - prog(frame, buildEnd - 8, buildEnd - 2, ease.linear) : 1;
  const overlay = overlayIn * overlayOut;
  const dip = frame === S(5) || frame === S(5) + 1 ? 0.82 : 1;
  const sunGlow = lerp(0, 1, sunT) * lerp(0.35, 1, atmT);
  const ghostK = [0.3, 0.5, 0.8, 1.1, 1.4];
  const ccx = w / 2;
  const ccy = h / 2;

  return (
    <AbsoluteFill style={{background: '#7e818a', overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: `brightness(${dip}) contrast(${1 + 0.08 * lensT}) saturate(${1 + 0.08 * lensT})`}}>
        <Stage3D shadows="soft" exposure={1.0}>
          <CameraRig position={camPos} target={camTgt} fov={fov} near={0.5} far={12000} />
          <SkyDome zenith={zen} horizon={hor} ground={fogCol} sunDir={sunDir} sunColor={C.sun} glow={sunGlow * 1.4} horizonSharp={lerp(3, 9, atmT)} />
          <SceneFog color={fogCol} density={fogD} />
          <hemisphereLight args={[hemiSky, hemiGnd, hemiI]} />
          <Sun dir={sunDir} color={sunColor} intensity={sunI} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.9, 0]} receiveShadow>
            <planeGeometry args={[16000, 16000]} />
            <meshStandardMaterial color={hexOf(mixCol(C.clay, mixCol(C.grass, C.rock, 0.5), matT))} roughness={0.95} />
          </mesh>
          <Terrain field={field} a1={a1} a2={a2} a3={a3} matT={matT} clay={C.clay} />
          <Clouds seed={seed} cover={cloudT} base={lerp(-2.5, 3.4, cloudT)} shadow={hexOf(mixCol('#9a9ca6', C.cloudShadow, atmT))} light={hexOf(mixCol('#e4e4ea', mixCol(C.cloudLight, '#f2e6dc', 0.45), atmT))} drift={drift} />
        </Stage3D>
      </AbsoluteFill>

      {/* lens: bloom glow, ghosts, vignette, grain */}
      {lensT > 0 && (
        <AbsoluteFill style={{opacity: lensT, pointerEvents: 'none'}}>
          {vis > 0 && (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: sp.x - 420 * u,
                  top: sp.y - 420 * u,
                  width: 840 * u,
                  height: 840 * u,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, rgba(255,236,190,${0.75 * vis}) 0%, rgba(255,190,110,${0.28 * vis}) 18%, rgba(255,160,80,0) 60%)`,
                  mixBlendMode: 'screen',
                }}
              />
              <div style={{position: 'absolute', left: 0, right: 0, top: sp.y - 2 * u, height: 4 * u, background: `linear-gradient(90deg, rgba(255,210,150,0), rgba(255,220,170,${0.35 * vis}) 50%, rgba(255,210,150,0))`, mixBlendMode: 'screen', transform: `translateX(${sp.x - w / 2}px)`}} />
              {ghostK.map((k, i) => {
                const gx = ccx + (ccx - sp.x) * k;
                const gy = ccy + (ccy - sp.y) * k;
                const r = (14 + ((i * 7) % 5) * 9) * u;
                const c = i % 2 ? '120,200,255' : '255,190,110';
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: gx - r,
                      top: gy - r,
                      width: 2 * r,
                      height: 2 * r,
                      clipPath: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)',
                      background: `radial-gradient(circle, rgba(${c},${0.1 * vis}) 30%, rgba(${c},${0.22 * vis}) 100%)`,
                      mixBlendMode: 'screen',
                    }}
                  />
                );
              })}
            </>
          )}
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.38) 100%)'}} />
          <FilmGrain opacity={0.1} every={1} />
        </AbsoluteFill>
      )}

      {overlay > 0 && showTitle && <TitleBlock stages={stages} idx={stageIdx} local={local} u={u} alpha={overlay} />}
      {overlay > 0 && showCode && <CodePanel st={stages[stageIdx]} local={local} u={u} w={w} h={h} portrait={portrait} alpha={overlay} first={stageIdx === 0} />}
    </AbsoluteFill>
  );
};

export const terrainBuild3d = defineMotion<Props>({
  id: 'terrain-build-3d',
  title: 'Terrain build (3D)',
  category: '3d',
  description:
    'A procedural mountain heightmap rebuilds itself in labelled stages — flat, noise, fractal, erosion, materials, sun, atmosphere, clouds, lens — with a typing code panel, then a cinematic eased fly-by past the peak.',
  source: ['video8 0:04-0:38'],
  useFor: '"How it is made" / generative-art explainers: show a world being built step by step, then reward with a hero fly-through.',
  durationInFrames: 650,
  defaultProps: {
    stages: STAGES,
    seed: 3,
    stageFrames: 48,
    leadIn: 6,
    flyby: true,
    flybyFrames: 210,
    showCode: true,
    showTitle: true,
    sunElevation: 7,
    sunAzimuth: 104,
    snowLine: 13,
    colors: COLORS,
  },
  propDocs: {
    stages: 'list of {title, subtitle, file, code}; index order maps to the fixed build techniques (0 flat … 8 lens)',
    seed: 'terrain seed',
    stageFrames: 'frames per stage',
    leadIn: 'frames before stage 0',
    flyby: 'fly past the peak after the build (overlay fades out)',
    flybyFrames: 'length of the fly-by',
    showCode: 'show the typing code panel',
    showTitle: 'show the stage title block + progress dashes',
    sunElevation: 'final sun elevation in degrees (low = golden hour)',
    sunAzimuth: 'final sun azimuth in degrees (90 = from screen right)',
    snowLine: 'height above which snow settles (world units, hero peak ≈ 32)',
    colors: 'rock / scree / grass / snow / clay / sun / zenith / horizon / cloudShadow / cloudLight',
  },
  component: TerrainBuild,
  tags: ['3d', 'terrain', 'procedural', 'code', 'flyby', 'three'],
});
