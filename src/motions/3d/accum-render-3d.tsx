// Technique after mg-styles-15/demos/03-isometric/js/render.js (accumulation rendering: sub-pixel jitter AA,
// jittered sun = soft shadows, sub-frame motion blur; MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md.
// Own implementation: a render-takeover pass inside @remotion/three that accumulates N jittered renders per frame.
import React from 'react';
import {AbsoluteFill, getRemotionEnvironment, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {fonts} from '../../core/fonts';
import {CANDY, CandyLights, clamp01, hs, mg1Fonts} from '../../core/r2-mg1-kit';
import {useStage} from '../../core/stage';
import {CameraRig, SceneBackground, Stage3D} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

type Props = {
  background: string;
  objectColor: string;
  accentColor: string;
  rimColor: string;
  samples: number;
  shutter: number;
  jitterPx: number;
  sunJitter: number;
  spin: number;
  compare: boolean;
  labels: boolean;
  seed: number;
};

/**
 * Accumulation pass: takes over the render loop (useFrame priority 1) and renders the scene N times per frame
 * with sub-pixel camera jitter, a jittered sun direction and sub-frame time offsets, averaging into a float
 * target — film-quality AA, soft area shadows and real motion blur, fully deterministic.
 */
const AccumPass: React.FC<{
  samples: number;
  shutter: number;
  jitterPx: number;
  frame: number;
  apply: (tSec: number, s: number, n: number) => void;
  splitX?: number; // 0..1: left of this renders with 1 sample (comparison)
}> = ({samples, shutter, jitterPx, frame, apply, splitX = 0}) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const res = React.useMemo(() => {
    const w = Math.floor(size.width);
    const h = Math.floor(size.height);
    const mk = () => new THREE.WebGLRenderTarget(w, h, {type: THREE.HalfFloatType, format: THREE.RGBAFormat, colorSpace: THREE.LinearSRGBColorSpace});
    const pass = mk();
    const raw = mk();
    const accum = mk();
    const quadScene = new THREE.Scene();
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const addMat = new THREE.ShaderMaterial({
      uniforms: {tex: {value: pass.texture}, w: {value: 1}},
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main(){gl_FragColor=texture2D(tex,vUv)*w;}',
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), addMat);
    quadScene.add(quad);
    const outScene = new THREE.Scene();
    const outMat = new THREE.ShaderMaterial({
      uniforms: {tex: {value: accum.texture}, rawTex: {value: raw.texture}, split: {value: 0}},
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:
        'uniform sampler2D tex;\nvarying vec2 vUv;\nvoid main(){\nvec4 c=texture2D(tex,vUv);\ngl_FragColor=vec4(c.rgb,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
      depthTest: false,
      depthWrite: false,
    });
    outScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), outMat));
    return {pass, raw, accum, quadScene, quadCam, addMat, outMat, outScene, w, h};
  }, [size.width, size.height]);
  const applyRef = React.useRef(apply);
  applyRef.current = apply;

  useFrame(() => {
    const N = getRemotionEnvironment().isRendering ? samples : Math.min(2, samples);
    const {pass, raw, accum, quadScene, quadCam, addMat, outMat, outScene, w, h} = res;
    const oldTone = gl.toneMapping;
    const oldAuto = gl.autoClear;
    gl.autoClear = false;
    // clear accumulation
    gl.setRenderTarget(accum);
    gl.setClearColor('#000000', 1);
    gl.clear(true, true, true);
    addMat.uniforms.w.value = 1 / N;
    for (let s = 0; s < N; s++) {
      const dt = ((s + 0.5) / N - 0.5) * (shutter / 30);
      applyRef.current(frame / 30 + dt, s, N);
      const jx = (hs(frame, s, 1) - 0.5) * jitterPx;
      const jy = (hs(frame, s, 2) - 0.5) * jitterPx;
      camera.setViewOffset(w, h, jx, jy, w, h);
      camera.updateProjectionMatrix();
      gl.setRenderTarget(pass);
      gl.clear(true, true, true);
      gl.render(scene, camera);
      camera.clearViewOffset();
      gl.setRenderTarget(accum);
      gl.render(quadScene, quadCam);
    }
    // raw comparison: a single centre-time sample
    outMat.uniforms.split.value = splitX;
    if (splitX > 0) {
      applyRef.current(frame / 30, 0, 1);
      gl.setRenderTarget(raw);
      gl.clear(true, true, true);
      gl.render(scene, camera);
    }
    gl.setRenderTarget(null);
    gl.render(outScene, quadCam);
    gl.toneMapping = oldTone;
    gl.autoClear = oldAuto;
  }, 1);
  return null;
};

const Scene: React.FC<Props & {frame: number; portrait: boolean}> = (p) => {
  const knot = React.useRef<THREE.Group>(null);
  const ball = React.useRef<THREE.Mesh>(null);
  const sun = React.useRef<THREE.DirectionalLight>(null);
  const apply = React.useCallback(
    (t: number, s: number, n: number) => {
      if (knot.current) {
        knot.current.rotation.y = t * p.spin;
        knot.current.rotation.x = 0.4 + Math.sin(t * 0.7) * 0.15;
        knot.current.position.y = 2.1 + Math.sin(t * 1.3) * 0.18;
      }
      if (ball.current) {
        const a = t * 1.4;
        ball.current.position.set(Math.cos(a) * 3.4, 0.75 + Math.abs(Math.sin(t * 3.2)) * 1.1, Math.sin(a) * 3.4);
      }
      if (sun.current) {
        // jittered sun = soft area shadows
        const j = p.sunJitter;
        sun.current.position.set(-7 + (hs(s, 1) - 0.5) * j, 13 + (hs(s, 2) - 0.5) * j, 8 + (hs(s, 3) - 0.5) * j);
      }
    },
    [p.spin, p.sunJitter],
  );
  return (
    <>
      <CameraRig position={[0, 4.2, 11]} target={[0, 1.4, 0]} fov={p.portrait ? 64 : 36} />
      <SceneBackground color={p.background} />
      <ambientLight intensity={0.6} color="#ffeef8" />
      <hemisphereLight args={['#fff0f6', '#b89ad6', 0.55]} />
      <directionalLight
        ref={sun}
        position={[-7, 13, 8]}
        intensity={1.35}
        color="#fff6ee"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[7, 3.5, -9]} intensity={1.6} color={p.rimColor} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshLambertMaterial color={p.background} />
      </mesh>
      <group ref={knot}>
        <mesh castShadow receiveShadow>
          <torusKnotGeometry args={[1.5, 0.52, 200, 32]} />
          <meshPhysicalMaterial color={p.objectColor} clearcoat={1} clearcoatRoughness={0.08} roughness={0.25} sheen={1} sheenColor="#ffd7ec" />
        </mesh>
      </group>
      <mesh ref={ball} castShadow receiveShadow>
        <sphereGeometry args={[0.75, 48, 32]} />
        <meshStandardMaterial color={p.accentColor} metalness={0.45} roughness={0.08} />
      </mesh>
      <mesh position={[3.9, 0.56, -2.6]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 0.9, 1.12, 48]} />
        <meshPhysicalMaterial color="#C6B9F3" clearcoat={1} clearcoatRoughness={0.06} roughness={0.3} />
      </mesh>
      <AccumPass samples={p.samples} shutter={p.shutter} jitterPx={p.jitterPx} frame={p.frame} apply={apply} splitX={p.compare ? 0.5 : 0} />
    </>
  );
};

const AccumRender3D: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Stage3D shadows="soft">
        <Scene {...p} frame={frame} portrait={h > w} />
      </Stage3D>
      {p.labels && p.compare && (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 2 * u, background: 'rgba(42,24,48,0.5)', marginLeft: w / 2}} />
          {[
            ['1 SAMPLE', 0.25],
            [`${p.samples} SAMPLES`, 0.75],
          ].map(([label, x], i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: (x as number) * w,
                transform: 'translateX(-50%)',
                bottom: h * 0.06,
                fontFamily: fonts.mono,
                fontSize: 24 * u,
                letterSpacing: 6 * u,
                color: CANDY.plum,
                background: 'rgba(255,255,255,0.55)',
                padding: `${8 * u}px ${18 * u}px`,
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
          ))}
        </>
      )}
      {p.labels && (
        <div style={{position: 'absolute', top: h * 0.05, left: 0, right: 0, textAlign: 'center', fontFamily: mg1Fonts.dm, fontWeight: 700, fontSize: 30 * u, letterSpacing: 10 * u, color: CANDY.plum, opacity: 0.8}}>
          ACCUMULATION RENDER
        </div>
      )}
    </AbsoluteFill>
  );
};

export const accumRender3D = defineMotion<Props>({
  id: 'accum-render-3d',
  title: 'Accumulation render 3D',
  category: '3d',
  description:
    'Film-quality three.js frames by brute force: every frame is rendered N times with sub-pixel camera jitter (anti-aliasing), a jittered sun (soft area shadows) and sub-frame time offsets (true motion blur), then averaged in a float buffer — shown on a candy studio scene with a fast-spinning torus knot and an orbiting chrome ball, optionally split against the raw 1-sample render.',
  source: ['mg-styles-15 03-isometric js/render.js accumulation pass (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'A Blender-like finish for 3D shots and a drop-in AccumPass pattern (copy the component) for any three.js motion that needs real motion blur and soft shadows; preview uses 2 samples, renders use all.',
  durationInFrames: 180,
  defaultProps: {
    background: '#F1E4EC',
    objectColor: '#FF5AA6',
    accentColor: '#C9CAD6',
    rimColor: '#FF6FAE',
    samples: 12,
    shutter: 0.8,
    jitterPx: 1.6,
    sunJitter: 1.6,
    spin: 5,
    compare: true,
    labels: true,
    seed: 1,
  },
  propDocs: {
    background: 'cyc / floor colour',
    objectColor: 'torus-knot colour',
    accentColor: 'orbiting ball colour',
    rimColor: 'rim light colour',
    samples: 'renders averaged per frame (render-time; preview always uses 2)',
    shutter: 'shutter fraction of a frame covered by the sub-frame samples (0–1)',
    jitterPx: 'sub-pixel camera jitter in px (anti-aliasing)',
    sunJitter: 'sun position jitter in world units (soft shadow size)',
    spin: 'torus-knot spin speed (rad/s) — faster = more visible motion blur',
    compare: 'split screen: left = 1 sample, right = accumulated',
    labels: 'caption pills',
    seed: 'unused variation seed (kept for spec compatibility)',
  },
  component: AccumRender3D,
  tags: ['accumulation', 'motion blur', 'anti-aliasing', 'soft shadows', 'render pass', 'supersampling', 'film quality', '3d', 'three.js', 'candy', 'studio', 'compare', 'technique demo', 'mg-styles-15', 'iso-diorama', 'soft-3d-candy'],
});
