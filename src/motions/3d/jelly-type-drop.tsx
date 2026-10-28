// Technique after mg-styles-15/demos/04-3d-render/blender/sim.py (bed_force / letter_track; MIT, © Vincentwei1021)
// — see THIRD_PARTY_NOTICES.md. Own implementation: three.js TextGeometry with a big bevel + precomputed drop ODE.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {Font} from 'three/examples/jsm/loaders/FontLoader.js';
import helvBold from 'three/examples/fonts/helvetiker_bold.typeface.json';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {CameraRig, Stage3D} from '../../core/three-kit';
import {CANDY, CandyLights, PillField, Ripple, bedHeight, bedTrack, clamp01, jellySquash} from '../../core/r2-mg1-kit';
import {defineMotion} from '../../core/types';

type Props = {
  text: string;
  background: string;
  letterColor: string;
  capColor: string;
  bodyColor: string;
  rimColor: string;
  material: 'gummy' | 'plastic' | 'chrome';
  beats: number[];
  dropHeight: number;
  jiggle: number;
  size: number;
  relift: boolean;
  grain: boolean;
  seed: number;
};

const JellyTypeDrop: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {portrait} = useStage();
  const t = frame / 30;
  const font = React.useMemo(() => new Font(helvBold as never), []);
  const text = (p.text || 'soft').slice(0, 10);
  const letters = React.useMemo(() => {
    const size = 2.1 * p.size * (portrait ? 0.82 : 1);
    const geos = [...text].map((ch) => {
      const g = new TextGeometry(ch, {
        font,
        size,
        depth: size * 0.42,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: size * 0.22,
        bevelSize: size * 0.16,
        bevelSegments: 6,
      });
      g.computeBoundingBox();
      const bb = g.boundingBox!;
      const w = bb.max.x - bb.min.x;
      g.translate(-(bb.min.x + w / 2), -bb.min.y, -(bb.min.z + (bb.max.z - bb.min.z) / 2));
      return {g, w};
    });
    const gap = size * 0.24;
    const total = geos.reduce((a, b) => a + b.w, 0) + gap * (geos.length - 1);
    let x = -total / 2;
    return geos.map(({g, w}, i) => {
      const cx = x + w / 2;
      x += w + gap;
      return {g, x: cx};
    });
  }, [text, font, p.size, portrait]);

  const beats = p.beats && p.beats.length ? p.beats : [0.5, 1.5, 2.0, 2.5];
  const tracks = React.useMemo(() => letters.map((_, i) => bedTrack(0, p.dropHeight)), [letters, p.dropHeight]);
  const ripples: Ripple[] = React.useMemo(() => {
    const out: Ripple[] = [];
    letters.forEach((L, i) => {
      const at = beats[i % beats.length] + (i >= beats.length ? Math.floor(i / beats.length) * 2 : 0);
      out.push({x: L.x, z: 0, at: at + tracks[i].contact, amp: 0.5, c: 3.8});
    });
    if (p.relift) out.push({x: -8, z: 0, at: (beats[beats.length - 1] ?? 2.5) + 1.6, amp: 0.4, c: 5, lambda: 2.4, decay: 1.4});
    return out;
  }, [letters, beats, tracks, p.relift]);
  const heightAt = React.useCallback((x: number, z: number) => bedHeight(x, z, t, [], ripples), [t, ripples]);
  const sample = React.useCallback((x: number, z: number) => ({y: Math.max(-0.1, heightAt(x, z))}), [heightAt]);

  const mat = React.useMemo(() => {
    if (p.material === 'chrome') return new THREE.MeshStandardMaterial({color: p.letterColor, metalness: 1, roughness: 0.12});
    if (p.material === 'plastic') return new THREE.MeshPhysicalMaterial({color: p.letterColor, clearcoat: 1, clearcoatRoughness: 0.06, roughness: 0.3});
    return new THREE.MeshPhysicalMaterial({color: p.letterColor, clearcoat: 1, clearcoatRoughness: 0.1, roughness: 0.22, sheen: 1, sheenColor: new THREE.Color('#ffd7ec')});
  }, [p.material, p.letterColor]);

  const cols = Math.round(68 * (portrait ? 0.7 : 1));
  const rows = Math.round(46 * (portrait ? 1.4 : 1));
  const push = 1 - 0.12 * clamp01(t / 2.4);
  const cam: [number, number, number] = [0, 6.4 + 3 * push, 12.6 + 3.2 * push];

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, ${p.background} 0%, ${CANDY.grade} 115%)`}}>
      <Stage3D shadows="soft">
        <CameraRig position={cam} target={[0, 0.2, -1.2]} fov={portrait ? 42 : 33} />
        <CandyLights rim={p.rimColor} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]} receiveShadow>
          <planeGeometry args={[90, 90]} />
          <meshLambertMaterial color={p.background} />
        </mesh>
        <PillField cols={cols} rows={rows} capColor={p.capColor} bodyColor={p.bodyColor} frame={frame} sample={sample} tiltFrom={heightAt} />
        {letters.map((L, i) => {
          const at = beats[i % beats.length] + (i >= beats.length ? Math.floor(i / beats.length) * 2 : 0);
          const tau = t - at;
          if (tau < 0) return null;
          const tr = tracks[i];
          let y = tr.at(tau);
          const sq = jellySquash(tau - tr.contact, 0.26 * p.jiggle);
          // re-lift hop when the relift wave reaches the letter
          if (p.relift) {
            const wave = ripples[ripples.length - 1];
            const arrive = wave.at + Math.hypot(L.x - wave.x, 0 - wave.z) / (wave.c ?? 5);
            const ht = t - arrive;
            if (ht > 0 && ht < 0.5) y += 0.9 * Math.sin(Math.PI * (ht / 0.5));
          }
          const sy = sq;
          const sxz = 1 / Math.sqrt(Math.max(0.4, sy));
          return <mesh key={i} geometry={L.g} material={mat} position={[L.x, y + 0.25, 0]} scale={[sxz, sy, sxz]} rotation={[0, (hs2(i) - 0.5) * 0.08, 0]} castShadow receiveShadow />;
        })}
      </Stage3D>
      {p.grain && <FilmGrain opacity={0.06} />}
      <Vignette strength={0.28} color="42,24,48" />
    </AbsoluteFill>
  );
};
const hs2 = (i: number) => {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export const jellyTypeDrop = defineMotion<Props>({
  id: 'jelly-type-drop',
  title: 'Jelly type drop',
  category: '3d',
  description:
    'Inflated glossy candy letters fall one per beat into a soft bed of two-tone capsules, sink past the surface, wobble back up with jelly squash-and-stretch and fire a damped ripple ring through the pill field on every landing; a late wave can hop the whole word again in reading order.',
  source: ['mg-styles-15 04-3d-render 0.3-3.8 s, blender/sim.py bed_force / letter_track (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'Playful brand word reveals and candy idents; with cloner-bed-ripple gives the full C4D-ident look in the browser.',
  durationInFrames: 180,
  defaultProps: {
    text: 'soft',
    background: '#F1E4EC',
    letterColor: '#FF5AA6',
    capColor: '#EBDCCD',
    bodyColor: '#C6B9F3',
    rimColor: '#FF6FAE',
    material: 'gummy',
    beats: [0.5, 1.5, 2.0, 2.5],
    dropHeight: 5.5,
    jiggle: 1,
    size: 1,
    relift: true,
    grain: true,
    seed: 1,
  },
  propDocs: {
    text: 'the word (lowercase reads most candy-like, up to 10 letters)',
    background: 'cyc colour',
    letterColor: 'letter material colour',
    capColor: 'pill top colour',
    bodyColor: 'pill under colour',
    rimColor: 'pink rim-light colour',
    material: 'gummy (sheen) | plastic (clearcoat) | chrome',
    beats: 'drop time in seconds per letter (cycles if shorter than the word)',
    dropHeight: 'fall height in world units',
    jiggle: 'jelly wobble amount',
    size: 'letter size multiplier',
    relift: 'a late wave hops the letters again in reading order',
    grain: 'film grain + vignette finish',
    seed: 'unused variation seed (kept for spec compatibility)',
  },
  component: JellyTypeDrop,
  tags: ['jelly', 'type', 'letters', 'drop', 'candy', 'gummy', 'soft 3d', 'squash and stretch', 'ripple', 'pills', 'ident', 'word reveal', 'logo', 'three.js', 'text geometry', 'mg-styles-15', 'soft-3d-candy'],
});
