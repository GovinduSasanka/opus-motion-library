import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {dataTexture, luma, mixHex, rgb, smooth, useImgTexture} from '../../core/r2-pr2-kit';
import {useStage} from '../../core/stage';
import {CameraRig, makeCamera, projectPx, Stage3D} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * A product (procedural can, bottle, box or phone with your label image or a generated label) on a seamless sweep:
 * image-based PBR light from a procedural room, a key-light streak that crosses the surface, a slow orbit and a soft
 * floor reflection; the hero type fades in beside it.
 */
type Props = {
  shape: string;
  labelSrc: string;
  colors: string[];
  bodyColor: string;
  background: string[];
  orbit: number;
  startYaw: number;
  lightSweepAt: number;
  reflection: number;
  headline: string;
  subline: string;
  textAt: number;
  textColor: string;
  size: number;
};

const Env: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.9;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
};

const c3 = (hex: string): [number, number, number] => rgb(hex).map((v) => v / 255) as [number, number, number];

/** generated label (u = around the product, v = up): colour field, wave line, a disc mark and bands */
const useLabel = (src: string, cA: string, cB: string, acc: string) => {
  const img = useImgTexture(src || undefined, 'product label');
  const gen = useMemo(() => {
    const A = c3(cA);
    const B = c3(cB);
    const K = c3(acc);
    const mixc = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
    return dataTexture(512, 256, (u, v) => {
      let col = mixc(A, B, smooth(0, 1, v));
      if ((v > 0.07 && v < 0.15) || (v > 0.85 && v < 0.93)) col = K;
      const wy = 0.3 + 0.035 * Math.sin(u * Math.PI * 2 * 4);
      if (Math.abs(v - wy) < 0.011) col = mixc(col, [1, 1, 1], 0.8);
      const dx = (((u + 0.5) % 1) - 0.5) * 2;
      const dy = v - 0.55;
      const d = Math.hypot(dx, dy);
      if (d < 0.31) col = d < 0.255 ? [0.99, 0.97, 0.9] : K;
      if (d < 0.15) col = mixc(A, B, 0.4);
      if (d < 0.07) col = K;
      const dx2 = (u - 0.5) * 2;
      if (Math.hypot(dx2, dy) < 0.2) col = mixc(col, [1, 1, 1], 0.25);
      return [col[0], col[1], col[2], 1];
    });
  }, [cA, cB, acc]);
  return img ?? gen;
};

type Built = {height: number; node: React.ReactNode};

const lathe = (pts: number[][]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 72);

const Product: React.FC<{shape: string; tex: THREE.Texture; body: string; acc: string; colorB: string}> = ({shape, tex, body, acc, colorB}) => {
  const built = useMemo<Built>(() => {
    const metal = <meshPhysicalMaterial color={body} metalness={1} roughness={0.26} />;
    const label = <meshPhysicalMaterial map={tex} roughness={0.34} metalness={0.05} clearcoat={0.9} clearcoatRoughness={0.12} />;
    if (shape === 'bottle') {
      const g = lathe([[0, 0], [0.5, 0], [0.56, 0.08], [0.56, 1.6], [0.5, 1.95], [0.22, 2.28], [0.2, 2.55], [0.25, 2.6], [0.25, 2.8], [0, 2.8]]);
      return {
        height: 2.8,
        node: (
          <group>
            <mesh geometry={g}>
              <meshPhysicalMaterial color={colorB} roughness={0.08} metalness={0.0} clearcoat={1} clearcoatRoughness={0.04} />
            </mesh>
            <mesh position={[0, 0.5 + 0.5, 0]}>
              <cylinderGeometry args={[0.568, 0.568, 1.05, 72, 1, true]} />
              {label}
            </mesh>
            <mesh position={[0, 2.72, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 0.2, 40]} />
              <meshPhysicalMaterial color={acc} roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        ),
      };
    }
    if (shape === 'box') {
      const g = new RoundedBoxGeometry(1.25, 1.75, 0.55, 4, 0.05);
      return {
        height: 1.75,
        node: (
          <group>
            <mesh geometry={g} position={[0, 0.875, 0]} material={[0, 1, 2, 3, 4, 5].map((i) => (i === 4 || i === 5 ? new THREE.MeshPhysicalMaterial({map: tex, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.2}) : new THREE.MeshPhysicalMaterial({color: acc, roughness: 0.45})))} />
          </group>
        ),
      };
    }
    if (shape === 'phone') {
      const g = new RoundedBoxGeometry(0.98, 2.0, 0.1, 5, 0.09);
      return {
        height: 2.0,
        node: (
          <group>
            <mesh geometry={g} position={[0, 1.0, 0]}>
              <meshPhysicalMaterial color={body} metalness={0.9} roughness={0.22} />
            </mesh>
            <mesh position={[0, 1.0, 0.052]}>
              <planeGeometry args={[0.88, 1.9]} />
              <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0.2, 1.68, -0.08]}>
              <cylinderGeometry args={[0.2, 0.2, 0.06, 40]} />
              <meshPhysicalMaterial color="#15171c" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.2, 1.68, -0.115]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.03, 32]} />
              <meshPhysicalMaterial color="#05070b" metalness={0.2} roughness={0.05} clearcoat={1} />
            </mesh>
          </group>
        ),
      };
    }
    // can (default)
    const g = lathe([[0, 0], [0.5, 0], [0.54, 0.03], [0.58, 0.1], [0.58, 1.95], [0.54, 2.05], [0.5, 2.12], [0.5, 2.16], [0.42, 2.2], [0, 2.2]]);
    return {
      height: 2.2,
      node: (
        <group>
          <mesh geometry={g}>{metal}</mesh>
          <mesh position={[0, 1.04, 0]}>
            <cylinderGeometry args={[0.588, 0.588, 1.84, 96, 1, true]} />
            {label}
          </mesh>
          <mesh position={[0, 2.215, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.02, 48]} />
            <meshPhysicalMaterial color="#c9ced4" metalness={1} roughness={0.35} />
          </mesh>
          <mesh position={[0.02, 2.235, 0]} rotation={[0, 0.3, 0]}>
            <boxGeometry args={[0.3, 0.02, 0.12]} />
            <meshPhysicalMaterial color="#aeb4bb" metalness={1} roughness={0.3} />
          </mesh>
        </group>
      ),
    };
  }, [shape, tex, body, acc, colorB]);
  const k = 2.4 / built.height;
  return <group scale={k}>{built.node}</group>;
};

const ProductTurntable: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const [cA, cB, acc] = [P.colors[0] ?? '#ffd23f', P.colors[1] ?? '#ff7a3c', P.colors[2] ?? '#1d6b4a'];
  const [bgTop, bgBot] = [P.background[0] ?? '#f6dfcd', P.background[1] ?? '#e9b99a'];
  const tex = useLabel(P.labelSrc, cA, cB, acc);
  const enter = ease.out(prog(frame, 0, 26, (t) => t));
  const yaw = ((P.startYaw + P.orbit * ease.sine(clamp(frame / Math.max(1, durationInFrames - 10)))) * Math.PI) / 180;
  const sw = prog(frame, P.lightSweepAt, P.lightSweepAt + 45, (t) => t);
  const sweepX = -3.2 + 6.4 * ease.inOut(sw);
  const sweepI = sw > 0 && sw < 1 ? 14 * Math.sin(Math.PI * sw) : 0;
  const hasText = !!(P.headline || P.subline);
  const offX = hasText && !portrait ? -1.45 : 0;
  const offY = hasText && portrait ? 0.9 : 0;
  const camPos: [number, number, number] = [0, 1.55, portrait ? 9.6 : 7.4];
  const tgt: [number, number, number] = [0, 1.15, 0];
  const fov = 30;
  const cam = useMemo(() => makeCamera(camPos, tgt, fov, w / h), [w, h, portrait]); // eslint-disable-line react-hooks/exhaustive-deps
  const horizonY = projectPx(cam, [0, 0, -60], w, h).y;
  const floorTex = useMemo(
    () =>
      dataTexture(
        128,
        128,
        (uu, vv) => {
          const x = (uu - 0.5) * 120;
          const z = (0.5 - vv) * 120;
          const base = 1 - clamp(P.reflection);
          const a = clamp(Math.max(base + (1 - base) * smooth(0.5, 6.5, z), smooth(0.9, 3.4, Math.abs(x))));
          return [a, a, a, 1];
        },
        false,
        false,
      ),
    [P.reflection],
  );
  const shadowTex = useMemo(
    () =>
      dataTexture(
        64,
        64,
        (uu, vv) => {
          const d = Math.hypot(uu - 0.5, vv - 0.5) * 2;
          const a = Math.pow(clamp(1 - d), 1.7);
          return [a, a, a, 1];
        },
        false,
        false,
      ),
    [],
  );
  const refl = clamp(P.reflection);
  const floorOpacity = 1;
  const textA = ease.out(prog(frame, P.textAt, P.textAt + 22, (t) => t));
  const ink = P.textColor || (luma(bgBot) > 0.5 ? '#2a1a12' : '#ffffff');
  const horizonPct = clamp(horizonY / h, 0.05, 0.95) * 100;
  const prodY = (1 - enter) * 0.5;
  const prodS = 0.9 + 0.1 * enter;
  const scale = P.size;
  // floor alpha: reflection strength rescales the near-product opacity
  const floorMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({color: bgBot, transparent: true, alphaMap: floorTex, depthWrite: false});
    return m;
  }, [bgBot, floorTex]);
  void floorOpacity;

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${bgTop} 0%, ${mixHex(bgTop, bgBot, 0.9)} ${horizonPct}%, ${bgBot} ${horizonPct}%, ${bgBot} 100%)`}}>
      <Stage3D transparent exposure={1}>
        <CameraRig position={camPos} target={tgt} fov={fov} near={0.1} far={200} />
        <Env />
        <ambientLight intensity={0.25} />
        <directionalLight position={[-3.5, 5, 4]} intensity={2.1} color="#fff1e0" />
        <directionalLight position={[4, 3, -3]} intensity={1.4} color="#cfe0ff" />
        <pointLight position={[sweepX, 1.6, 2.2]} intensity={sweepI} distance={9} decay={2} color="#ffffff" />
        <group position={[offX, offY, 0]} scale={scale}>
          <group position={[0, prodY, 0]} scale={prodS} rotation={[0, yaw, 0]}>
            <Product shape={P.shape} tex={tex} body={P.bodyColor} acc={acc} colorB={cB} />
          </group>
          <group position={[0, -prodY, 0]} scale={[prodS, -prodS, prodS]} rotation={[0, yaw, 0]}>
            <Product shape={P.shape} tex={tex} body={P.bodyColor} acc={acc} colorB={cB} />
          </group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} material={floorMat} renderOrder={2}>
            <planeGeometry args={[120, 120]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} renderOrder={3}>
            <planeGeometry args={[2.6, 2.6]} />
            <meshBasicMaterial color="#000000" transparent alphaMap={shadowTex} opacity={0.42 * enter} depthWrite={false} />
          </mesh>
        </group>
      </Stage3D>
      {hasText && (
        <div style={{position: 'absolute', left: portrait ? 0 : w * 0.54, right: portrait ? 0 : w * 0.06, top: portrait ? h * 0.72 : h * 0.5, transform: `translateY(${portrait ? 0 : -50}%) translateY(${(1 - textA) * 26 * u}px)`, opacity: textA, textAlign: portrait ? 'center' : 'left', padding: portrait ? `0 ${w * 0.08}px` : 0, color: ink, fontFamily: fonts.sans}}>
          <div style={{fontFamily: fonts.display, fontSize: (portrait ? 96 : 104) * u, lineHeight: 0.98, letterSpacing: -1 * u, textTransform: 'uppercase'}}>{P.headline}</div>
          {P.subline && <div style={{fontSize: (portrait ? 34 : 32) * u, marginTop: 22 * u, opacity: 0.75, lineHeight: 1.3, fontWeight: 500}}>{P.subline}</div>}
        </div>
      )}
      <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${220 * u}px rgba(0,0,0,${0.1 + 0.05 * refl})`, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const productTurntable3d = defineMotion<Props>({
  id: 'product-turntable-3d',
  title: 'Product turntable (3D hero shot)',
  category: '3d',
  description:
    'A procedural can, bottle, box or phone (with your label image or a generated label) rises onto a seamless peach sweep lit by an image-based studio, orbits slowly 40 degrees while a key-light streak crosses its glossy surface, a soft contact shadow and floor reflection ground it, and a hero headline fades in beside it.',
  source: ['prompt corpus x15 (product on a seamless sweep, three-point light, slow orbit, light streak, reflection)'],
  useFor: 'E-commerce, product launches, packaging reveals and hero sections: set `labelSrc` to your label artwork (for a phone, your screen), `colors` and the headline.',
  durationInFrames: 180,
  defaultProps: {
    shape: 'can',
    labelSrc: '',
    colors: ['#ffd23f', '#ff7a3c', '#1d6b4a'],
    bodyColor: '#d9dde2',
    background: ['#f7e3d3', '#e8b697'],
    orbit: 40,
    startYaw: -26,
    lightSweepAt: 40,
    reflection: 0.22,
    headline: 'Sparkling Lemon',
    subline: 'Crisp, cold and made with real citrus.',
    textAt: 64,
    textColor: '',
    size: 1,
  },
  propDocs: {
    shape: "'can' | 'bottle' | 'box' | 'phone'",
    labelSrc: 'label / box-face / phone-screen image (public/ path or URL); empty = generated label',
    colors: '[label colour A, label colour B (also bottle glass), accent]',
    bodyColor: 'metal body colour (can, phone)',
    background: '[top, floor] sweep colours',
    orbit: 'degrees the product turns across the clip (20-40)',
    startYaw: 'starting rotation in degrees',
    lightSweepAt: 'frame the key-light streak starts crossing the product (45 frames)',
    reflection: 'floor reflection strength 0..1',
    headline: 'hero headline ("" with an empty subline = product only, centred)',
    subline: 'line under the headline',
    textAt: 'frame the type starts fading in',
    textColor: 'type colour (empty = auto contrast)',
    size: 'product scale multiplier',
  },
  component: ProductTurntable,
  tags: ['product', 'turntable', 'can', 'bottle', 'box', 'phone', 'packaging', 'hero', 'e-commerce', 'launch', 'studio', 'pbr', 'reflection', 'orbit', 'light streak', 'three.js', '3d', 'label', 'beverage', 'sweep'],
});
