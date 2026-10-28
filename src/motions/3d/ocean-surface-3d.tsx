import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Vignette, FilmGrain, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CameraRig, SkyDome, Stage3D, V3} from '../../core/three-kit';
import {rgba5} from '../../core/r2-pr5-kit';

/**
 * Ocean surface (3D): a perspective sea — four Gerstner waves displace a dense plane, the fragment shader adds
 * analytic normals + fine ripples, fresnel sky reflection, sun glitter (sparkle threshold), crest foam, depth tint and
 * horizon fog under a gradient sky with a sun glow. Camera presets: low skim, high look-down, slow drift.
 * Time is a pure function of the frame, so every frame is deterministic.
 */

type Props = {
  deepColor: string;
  shallowColor: string;
  skyZenith: string;
  skyHorizon: string;
  sunColor: string;
  sunElevation: number;
  sunAzimuth: number;
  waveHeight: number;
  steepness: number;
  speed: number;
  foam: number;
  glitter: number;
  fog: number;
  camera: 'low' | 'high' | 'drift';
  title: string;
  subtitle: string;
  ink: string;
};

const NWAVES = 4;
// [dirAngle(rad), wavelength, amplitude weight]
const WAVES: [number, number, number][] = [
  [0.15, 22, 1.0],
  [-0.62, 13, 0.62],
  [0.9, 7.5, 0.34],
  [-1.25, 4.2, 0.18],
];

const vert = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uSteep;
  uniform vec4 uW[${NWAVES}]; // dir.x, dir.z, k, amplitude weight
  varying vec3 vWorld;
  varying vec3 vN;
  varying float vH;
  varying float vFoam;
  void main() {
    vec3 p = position;
    vec3 n = vec3(0.0, 1.0, 0.0);
    float h = 0.0;
    float jac = 0.0;
    vec3 disp = vec3(0.0);
    for (int i = 0; i < ${NWAVES}; i++) {
      vec2 d = uW[i].xy;
      float k = uW[i].z;
      float a = uW[i].w * uAmp;
      float c = sqrt(9.8 / k);
      float f = k * dot(d, p.xz) - c * k * uTime;
      float q = uSteep / (k * a * ${NWAVES}.0 + 0.0001);
      q = min(q, 1.0);
      disp.x += q * a * d.x * cos(f);
      disp.z += q * a * d.y * cos(f);
      disp.y += a * sin(f);
      n.x -= d.x * k * a * cos(f);
      n.z -= d.y * k * a * cos(f);
      n.y -= q * k * a * sin(f);
      jac += q * k * a * sin(f);
    }
    p += disp;
    vH = disp.y;
    vFoam = jac; // positive and large near sharp crests
    vN = normalize(n);
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uZen;
  uniform vec3 uHor;
  uniform vec3 uSunCol;
  uniform vec3 uSun;
  uniform float uAmp;
  uniform float uFoam;
  uniform float uGlit;
  uniform float uFog;
  varying vec3 vWorld;
  varying vec3 vN;
  varying float vH;
  varying float vFoam;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  vec3 skyCol(vec3 d) {
    float y = max(d.y, 0.0);
    vec3 c = mix(uHor, uZen, 1.0 - exp(-y * 2.6));
    float s = max(dot(d, normalize(uSun)), 0.0);
    c += uSunCol * (pow(s, 6.0) * 0.28 + pow(s, 80.0) * 0.5 + pow(s, 1200.0) * 4.0);
    return c;
  }
  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    float dist = length(cameraPosition - vWorld);
    // fine ripples (scroll with time), fade with distance to avoid shimmer
    vec2 q = vWorld.xz;
    float rip = clamp(1.0 - dist / 120.0, 0.0, 1.0);
    vec2 r1 = vec2(vnoise(q * 1.7 + vec2(uTime * 0.7, uTime * 0.3)), vnoise(q * 1.7 + vec2(7.3 - uTime * 0.4, 2.1 + uTime * 0.6)));
    vec2 r2 = vec2(vnoise(q * 4.3 - vec2(uTime * 0.9, 0.0)), vnoise(q * 4.3 + vec2(3.1, -uTime * 0.8)));
    vec3 N = normalize(vN + vec3(r1.x - 0.5 + (r2.x - 0.5) * 0.6, 0.0, r1.y - 0.5 + (r2.y - 0.5) * 0.6) * 0.34 * rip);
    float ndv = max(dot(N, V), 0.0);
    float F = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 refl = skyCol(R);
    // body colour: deep water, scattering into the shallow tint at crests and grazing light
    float crest = smoothstep(-0.2, 1.0, vH / max(uAmp, 0.001));
    vec3 body = mix(uDeep, uShallow, clamp(0.12 + crest * 0.55 + ndv * 0.28, 0.0, 1.0));
    float sss = pow(max(dot(normalize(uSun) * vec3(1.0, 0.5, 1.0), -V), 0.0), 3.0) * crest * 0.4;
    body += uShallow * sss;
    vec3 col = mix(body, refl, clamp(F, 0.0, 1.0));
    // sun glitter: sharp specular modulated by a sparkle field (threshold), distance-faded
    float spec = pow(max(dot(R, normalize(uSun)), 0.0), 700.0);
    float spark = smoothstep(0.62, 0.95, vnoise(q * 9.0 + vec2(uTime * 1.9, -uTime * 1.3)) * 0.6 + vnoise(q * 21.0 - uTime * 2.4) * 0.5);
    col += uSunCol * (spec * (0.4 + 2.4 * spark) * 5.0 + pow(max(dot(R, normalize(uSun)), 0.0), 120.0) * 0.55 * spark) * uGlit;
    // foam on sharp crests, broken up by noise
    float fm = smoothstep(0.17, 0.34, vFoam + (vnoise(q * 2.6 + uTime * 0.3) - 0.5) * 0.12) * uFoam * rip;
    float lace = smoothstep(0.35, 0.8, vnoise(q * 6.0 + vec2(uTime * 0.5, 0.0)));
    col = mix(col, vec3(0.95, 0.98, 1.0), clamp(fm * (0.55 + 0.45 * lace), 0.0, 0.9));
    // horizon fog
    float fogF = 1.0 - exp(-dist * uFog * 0.012);
    col = mix(col, uHor, clamp(fogF, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const Sea: React.FC<{p: Props; time: number}> = ({p, time}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uTime: {value: 0},
          uAmp: {value: 1},
          uSteep: {value: 0.3},
          uW: {value: WAVES.map(([a, L, wt]) => new THREE.Vector4(Math.cos(a), Math.sin(a), (Math.PI * 2) / L, wt))},
          uDeep: {value: new THREE.Color()},
          uShallow: {value: new THREE.Color()},
          uZen: {value: new THREE.Color()},
          uHor: {value: new THREE.Color()},
          uSunCol: {value: new THREE.Color()},
          uSun: {value: new THREE.Vector3()},
          uFoam: {value: 1},
          uGlit: {value: 1},
          uFog: {value: 1},
        },
      }),
    [],
  );
  const sunDir = useMemo<V3>(() => {
    const el = (p.sunElevation * Math.PI) / 180;
    const az = (p.sunAzimuth * Math.PI) / 180;
    return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
  }, [p.sunElevation, p.sunAzimuth]);
  useLayoutEffect(() => {
    const U = mat.uniforms;
    U.uTime.value = time;
    U.uAmp.value = p.waveHeight;
    U.uSteep.value = p.steepness;
    U.uDeep.value.set(p.deepColor);
    U.uShallow.value.set(p.shallowColor);
    U.uZen.value.set(p.skyZenith);
    U.uHor.value.set(p.skyHorizon);
    U.uSunCol.value.set(p.sunColor);
    U.uSun.value.set(...sunDir);
    U.uFoam.value = p.foam;
    U.uGlit.value = p.glitter;
    U.uFog.value = p.fog;
    mat.needsUpdate = true;
  }, [mat, time, p, sunDir]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(520, 520, 420, 420);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
};

const OceanSurface3D: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const {h, u, portrait} = useStage();
  const time = (frame / 30) * props.speed + 12;
  const t = frame / 30;
  const el = (props.sunElevation * Math.PI) / 180;
  const az = (props.sunAzimuth * Math.PI) / 180;
  const sunDir: V3 = [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];

  // camera presets (looking toward -z, where the sun sits by default)
  let pos: V3;
  let tgt: V3;
  const waveLift = props.waveHeight * 1.2;
  if (props.camera === 'high') {
    pos = [Math.sin(t * 0.12) * 4, 26 + waveLift, 18 - t * 1.2];
    tgt = [0, 0, -70 - t * 1.2];
  } else if (props.camera === 'drift') {
    pos = [Math.sin(t * 0.22) * 9, 5.2 + waveLift + Math.sin(t * 0.7) * 0.5, 12 - t * 2.4];
    tgt = [Math.sin(t * 0.18 + 1) * 10, 1.6, -60 - t * 2.4];
  } else {
    pos = [Math.sin(t * 0.3) * 1.5, 2.6 + waveLift * 0.7 + Math.sin(t * 0.9) * 0.12, 6 - t * 1.4];
    tgt = [Math.sin(t * 0.2) * 3, 0.6 + Math.sin(t * 0.5) * 0.25, -60 - t * 1.4];
  }
  const enter = prog(frame, 0, 24, ease.out);

  return (
    <AbsoluteFill style={{background: props.skyHorizon}}>
      <Stage3D flat={false} exposure={1} transparent={false}>
        <CameraRig position={pos} target={tgt} fov={portrait ? 62 : 52} near={0.3} far={2000} />
        <SkyDome zenith={props.skyZenith} horizon={props.skyHorizon} ground={props.skyHorizon} sunDir={sunDir} sunColor={props.sunColor} glow={0.55} horizonSharp={5} />
        <Sea p={props} time={time} />
      </Stage3D>
      <Vignette strength={0.35} />
      <FilmGrain opacity={0.03} />
      {props.title ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? 0.16 : 0.14), textAlign: 'center', color: props.ink, opacity: enter * clamp(1 - prog(frame, 205, 230)), transform: `translateY(${(1 - enter) * 24 * u}px)`}}>
          <div style={{fontFamily: fonts.serif, fontWeight: 500, fontSize: (portrait ? 120 : 112) * u, letterSpacing: 2 * u, textShadow: `0 ${4 * u}px ${40 * u}px ${rgba5('#04101F', 0.55)}`}}>{props.title}</div>
          <div style={{fontFamily: fonts.mono, fontSize: 21 * u, letterSpacing: 8 * u, opacity: 0.8, marginTop: 6 * u, textShadow: `0 ${2 * u}px ${20 * u}px ${rgba5('#04101F', 0.5)}`}}>{props.subtitle}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const oceanSurface3d = defineMotion<Props>({
  id: 'ocean-surface-3d',
  title: 'Ocean surface 3D',
  category: '3d',
  description:
    'A perspective sea built from Gerstner waves with analytic normals, fresnel sky reflection, sparkling sun glitter, crest foam and horizon fog under a gradient sky and sun glow; low-skim, high or drifting camera.',
  source: ['prompt-corpus: awesome-opus5-5-videos (MIT) — Gerstner ocean cases (9), original implementation'],
  useFor: 'Travel, maritime and calm brand heroes, film openers, looping website backgrounds (put the words in HTML over it). For a stylised low-poly sea use faceted-sea instead.',
  durationInFrames: 240,
  defaultProps: {
    deepColor: '#03203A',
    shallowColor: '#12889E',
    skyZenith: '#2459A8',
    skyHorizon: '#B4D2E8',
    sunColor: '#FFE9C2',
    sunElevation: 11,
    sunAzimuth: 6,
    waveHeight: 0.8,
    steepness: 0.3,
    speed: 1,
    foam: 1,
    glitter: 1,
    fog: 0.55,
    camera: 'low',
    title: '',
    subtitle: '',
    ink: '#FFFFFF',
  },
  propDocs: {
    deepColor: 'deep water colour',
    shallowColor: 'shallow / crest scattering colour',
    skyZenith: 'sky colour overhead (also what the sea reflects)',
    skyHorizon: 'sky + fog colour at the horizon',
    sunColor: 'sun and glitter colour',
    sunElevation: 'sun height above the horizon in degrees (low = long glitter path)',
    sunAzimuth: 'sun direction in degrees (0 = straight ahead)',
    waveHeight: 'wave amplitude multiplier (0.3 calm - 2 rough)',
    steepness: 'Gerstner steepness 0.2-0.4 (sharper crests, more foam)',
    speed: 'wave time scale',
    foam: 'crest foam amount (0 = none)',
    glitter: 'sun glitter intensity (0 = none)',
    fog: 'horizon fog density',
    camera: 'low (skim) | high (look-down) | drift (slow sway)',
    title: 'optional serif title over the sea (empty = none)',
    subtitle: 'optional mono subtitle',
    ink: 'title colour',
  },
  component: OceanSurface3D,
  tags: ['ocean', 'sea', 'water', 'waves', 'gerstner', 'three.js', '3d', 'fresnel', 'glitter', 'foam', 'horizon', 'sunset', 'travel', 'maritime', 'calm', 'loop', 'background', 'hero', 'film opener', 'shader'],
});
