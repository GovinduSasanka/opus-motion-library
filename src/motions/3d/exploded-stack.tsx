// Adapted from lemo-opuscar/styles/teardown/demo/src/{main.js,timeline.js,overlay.js} (layerE, gapE, camera track, label) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {CameraRig, makeCamera, projectPx, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';
import {back, eio3, fx, lerp, lf, seg, track} from '../../core/r2-lb2b-kit';

/**
 * A stack of flat layers (plates, boards, panels, an image slab) sits as one object on a dark seamless. On the hit
 * they lift apart along one axis top-first with a short stagger, repeated small parts (keys, chips) rising in a ripple
 * across each surface, while the camera orbits and a label column cascades in; hold with a gentle float; then bottom-first
 * closing with each small part landing with a tiny mechanical dip.
 */
type Parts = {cols: number; rows: number; size: number; height: number; color: string};
type Layer = {name: string; spec: string; w: number; d: number; h: number; color: string; src?: string; parts?: Parts};
type Props = {
  layers: Layer[];
  openAt: number;
  closeAt: number;
  stagger: number;
  wave: number;
  spread: number;
  orbitFrom: number;
  orbitTo: number;
  float: number;
  labels: boolean;
  accent: string;
  background: string;
  edge: string;
};

const useTex = (src: string | undefined) => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => (src ? delayRender('exploded-stack texture') : null));
  useEffect(() => {
    if (!src) return;
    new THREE.TextureLoader().load(
      resolveSrc(src),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        setTex(t);
        if (handle !== null) continueRender(handle);
      },
      undefined,
      () => {
        if (handle !== null) continueRender(handle);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  return tex;
};

const Slab: React.FC<{layer: Layer; y: number; parts: {x: number; z: number; lift: number}[]}> = ({layer, y, parts}) => {
  const tex = useTex(layer.src);
  const side = useMemo(() => new THREE.MeshStandardMaterial({color: layer.color, roughness: 0.42, metalness: 0.18}), [layer.color]);
  const top = useMemo(() => (tex ? new THREE.MeshStandardMaterial({map: tex, roughness: 0.3, metalness: 0.0}) : new THREE.MeshStandardMaterial({color: layer.color, roughness: 0.34, metalness: 0.2})), [tex, layer.color]);
  const p = layer.parts;
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, layer.h / 2, 0]} castShadow receiveShadow material={[side, side, top, side, side, side]}>
        <boxGeometry args={[layer.w, layer.h, layer.d]} />
      </mesh>
      {p &&
        parts.map((q, i) => (
          <mesh key={i} position={[q.x, layer.h - p.height / 2 + 0.003 + q.lift, q.z]} castShadow receiveShadow>
            <boxGeometry args={[p.size, p.height, p.size]} />
            <meshStandardMaterial color={p.color} roughness={0.5} metalness={0.1} />
          </mesh>
        ))}
    </group>
  );
};

const ExplodedStack: React.FC<Props> = ({layers, openAt, closeAt, stagger, wave, spread, orbitFrom, orbitTo, float, labels, accent, background, edge}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, fps} = useStage();
  const n = layers.length;
  const fSans = lf('archivo');
  const fMono = lf('plex');
  // closed base heights
  const baseY: number[] = [];
  let acc = 0;
  layers.forEach((l, k) => {
    baseY.push(acc);
    acc += l.h + 0.006;
  });
  const totalClosed = acc;
  const up = (k: number) => openAt + (n - 1 - k) * stagger;
  const down = (k: number) => closeAt + k * stagger;
  const openK = (k: number) => back(seg(frame, up(k), up(k) + 36), 1.1) * (1 - eio3(seg(frame, down(k), down(k) + 30)));
  const oa = openK(n - 1);
  const t = frame / fps;
  const yOf = (k: number) => baseY[k] + spread * k * openK(k) + Math.sin(2.4 * t + k * 1.7) * float * Math.min(1, oa * oa);
  // parts per layer
  const partsOf = (k: number) => {
    const L = layers[k];
    if (!L.parts) return [];
    const {cols, rows} = L.parts;
    const out: {x: number; z: number; lift: number}[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = cols === 1 ? 0.5 : c / (cols - 1);
        const nz = rows === 1 ? 0.5 : r / (rows - 1);
        const rank = Math.hypot(nx, nz) / Math.SQRT2;
        const upK = back(seg(frame, up(k) + 8 + rank * wave, up(k) + 26 + rank * wave), 1.2);
        const dn = seg(frame, down(k) + rank * wave * 0.7, down(k) + rank * wave * 0.7 + 14);
        const dip = 0.012 * Math.sin(Math.PI * seg(frame, down(k) + rank * wave * 0.7 + 12, down(k) + rank * wave * 0.7 + 26)) * (1 - seg(frame, down(k) + rank * wave * 0.7 + 12, down(k) + rank * wave * 0.7 + 26));
        const lift = (layers[k].parts!.height + 0.07) * upK * (1 - eio3(dn)) - dip;
        out.push({x: (nx - 0.5) * (L.w - L.parts.size * 2.2), z: (nz - 0.5) * (L.d - L.parts.size * 2.2), lift});
      }
    }
    return out;
  };
  // camera
  const orb = eio3(seg(frame, openAt - 4, openAt + 80));
    const az = (lerp(orbitFrom, orbitTo, orb) * Math.PI) / 180;
  const el = (track(frame, [[0, 26], [openAt + 70, 14], [closeAt + 60, 20]]) * Math.PI) / 180;
  const maxH = totalClosed + spread * (n - 1);
  const dist = (portrait ? 8.4 : 5.4) * (1 + 0.15 * oa);
  const tgtY = lerp(totalClosed * 0.5, maxH * 0.5, oa);
  const tgt: V3 = [portrait ? 0 : 0.5, tgtY, 0];
  const camPos: V3 = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
  const fov = portrait ? 38 : 32;
  const cam = useMemo(() => makeCamera(camPos, tgt, fov, w / h), [camPos[0], camPos[1], camPos[2], tgt[0], tgt[1], tgt[2], w, h]); // eslint-disable-line react-hooks/exhaustive-deps
  // labels
  const lab = layers.map((L, k) => {
    const p = projectPx(cam, [L.w / 2, yOf(k) + L.h / 2, L.d / 2], w, h);
    const colX = portrait ? w * 0.1 : w * 0.72;
    const ly = portrait ? h * 0.7 + (n - 1 - k) * h * 0.052 : h * 0.2 + (n - 1 - k) * h * 0.115;
    const s0 = openAt + 52 + (n - 1 - k) * 9;
    const inP = seg(frame, s0, s0 + 12);
    const lp = eio3(seg(frame, s0, s0 + 12));
    const outP = seg(frame, closeAt - 12, closeAt - 2);
    return {L, k, p, colX, ly, inP, lp, outP};
  });
  const fs = (portrait ? 38 : 30) * u;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 90% at 50% 42%, ${background} 0%, ${edge} 80%)`}}>
      <Stage3D shadows="soft" transparent>
        <CameraRig position={camPos} target={tgt} fov={fov} near={0.1} far={80} />
        <ambientLight intensity={0.7} color="#dfe6f2" />
        <directionalLight position={[-4, 7, 4]} intensity={2.6} color="#fff3e4" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0004} shadow-radius={5} />
        <directionalLight position={[5, 3, -3]} intensity={1.1} color="#a9c0ff" />
        <directionalLight position={[3, 2, 6]} intensity={0.6} color="#ffffff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <shadowMaterial opacity={0.5} />
        </mesh>
        {layers.map((L, k) => (
          <Slab key={k} layer={L} y={yOf(k)} parts={partsOf(k)} />
        ))}
      </Stage3D>
      {labels && (
        <Svg>
          {lab.map(({L, k, p, colX, ly, inP, lp, outP}) => {
            if (inP <= 0 || outP >= 1 || !p.visible) return null;
            const a = inP * (1 - outP);
            const dir = colX > p.x ? 1 : -1;
            const elbowX = colX - dir * 34 * u;
            const pts: [number, number][] = [
              [p.x, p.y],
              [elbowX - dir * Math.abs(ly - p.y) * 0.6, ly],
              [colX - dir * 14 * u, ly],
            ];
            const d = `M${fx(pts[0][0])},${fx(pts[0][1])} L${fx(pts[1][0])},${fx(pts[1][1])} L${fx(pts[2][0])},${fx(pts[2][1])}`;
            return (
              <g key={k} opacity={a}>
                <circle cx={p.x} cy={p.y} r={3.2 * u} fill="#fff" />
                <circle cx={p.x} cy={p.y} r={(3.2 + 6 * lp) * u} fill="none" stroke="#fff" strokeWidth={1.2 * u} opacity={1 - lp * 0.6} />
                <path d={d} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.3 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lp} />
                <g transform={`translate(${fx(colX)},${fx(ly)})`} opacity={lp}>
                  <text x={0} y={-6 * u} fontFamily={fMono} fontSize={(portrait ? 22 : 15) * u} fill={accent} fontWeight={500}>
                    {String(k + 1).padStart(2, '0')}
                  </text>
                  <text x={0} y={fs * 0.2} fontFamily={fSans} fontSize={fs} fontWeight={600} fill="#f1f1ee">
                    {L.name}
                  </text>
                  <text x={0} y={fs * 0.2 + (portrait ? 36 : 26) * u} fontFamily={fMono} fontSize={(portrait ? 26 : 17) * u} fill="#f1f1ee" opacity={0.6}>
                    {L.spec}
                  </text>
                </g>
              </g>
            );
          })}
        </Svg>
      )}
    </AbsoluteFill>
  );
};

export const explodedStack = defineMotion<Props>({
  id: 'exploded-stack',
  title: 'Exploded stack (teardown 3D)',
  category: '3d',
  description:
    'A stack of five flat layers (base, battery, board with chips, keyboard with keycaps, glass top) sits on a dark seamless; they lift apart top-first with a stagger while the keys and chips ripple up, the camera orbits and a leader-line label column cascades in; hold with a gentle float, then it closes bottom-first with each part landing with a tiny mechanical dip.',
  source: ['lemo-opuscar styles/teardown demo/src/main.js, timeline.js, overlay.js (MIT, LemoLab)'],
  useFor: 'Hardware launches, "what is inside" explainers, layered architecture (UI, API, DB as slabs), feature stacks on landing pages; any product screenshot can be one layer via src.',
  durationInFrames: 210,
  defaultProps: {
    layers: [
      {name: 'Chassis', spec: 'Machined aluminium', w: 2.3, d: 1.6, h: 0.1, color: '#3b3f48'},
      {name: 'Battery', spec: '58 Wh pack', w: 1.95, d: 1.25, h: 0.08, color: '#7a808c'},
      {name: 'Logic board', spec: 'Six-layer PCB', w: 2.05, d: 1.35, h: 0.05, color: '#1f6b53', parts: {cols: 3, rows: 2, size: 0.26, height: 0.05, color: '#15171b'}},
      {name: 'Key deck', spec: '64 scissor keys', w: 2.2, d: 1.5, h: 0.07, color: '#3a3d46', parts: {cols: 6, rows: 3, size: 0.25, height: 0.06, color: '#dcd7ca'}},
      {name: 'Glass cover', spec: 'Gorilla-grade, 0.7 mm', w: 2.3, d: 1.6, h: 0.05, color: '#8fa0b8'},
    ],
    openAt: 24,
    closeAt: 150,
    stagger: 5,
    wave: 14,
    spread: 0.34,
    orbitFrom: -31,
    orbitTo: 18,
    float: 0.012,
    labels: true,
    accent: '#ff7a1a',
    background: '#34363a',
    edge: '#0d0e10',
  },
  propDocs: {
    layers: 'bottom to top: name, spec, w, d, h (3D units), colour, optional src image on top face, optional parts grid (cols, rows, size, height, colour)',
    openAt: 'frame the top layer starts to lift',
    closeAt: 'frame the bottom layer starts to close',
    stagger: 'frames between layers',
    wave: 'frames the part ripple takes to cross a surface',
    spread: 'gap between lifted layers (3D units)',
    orbitFrom: 'camera azimuth at the start, degrees',
    orbitTo: 'camera azimuth when open, degrees',
    float: 'gentle float amplitude while open',
    labels: 'show the leader-line label column',
    accent: 'label index colour',
    background: 'seamless centre colour',
    edge: 'seamless edge colour',
  },
  component: ExplodedStack,
  tags: ['exploded view', 'teardown', 'product', 'hardware', 'layers', 'stack', 'architecture', '3d', 'labels', 'leader lines', 'what is inside', 'keyboard', 'launch'],
});
