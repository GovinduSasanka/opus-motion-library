import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {scatter} from '../../core/random';
import {arcPoint, earthMask, EARTH_H, EARTH_W, llToVec, rgb, useImgTexture, V3} from '../../core/r2-pr2-kit';
import {Svg, useStage} from '../../core/stage';
import {CameraRig, makeCamera, projectPx, Stage3D} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * A shaded three.js globe (procedural land/ocean from original coarse coastlines, or your own equirectangular
 * texture): day/night terminator with city lights, atmosphere rim, great-circle arcs flying between points with pulsing
 * markers and name labels, then the camera swings to a focus lat/lon and zooms in.
 */
type Pt = {name: string; lat: number; lon: number; color?: string};
type ArcDef = {from: number | string; to: number | string; at?: number; color?: string};
type Focus = {lat: number; lon: number; at: number; label?: string; zoom?: number};
type Props = {
  points: Pt[];
  arcs: ArcDef[];
  focus: Focus | null;
  textureSrc: string;
  background: string;
  backgroundEdge: string;
  oceanColor: string;
  landColor: string;
  atmosphereColor: string;
  arcColor: string;
  markerColor: string;
  nightLights: boolean;
  lightColor: string;
  spin: number;
  startLon: number;
  tilt: number;
  labels: boolean;
  stars: boolean;
  size: number;
};

const VERT = /* glsl */ `
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
void main(){
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vWN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
uniform sampler2D uMask; uniform sampler2D uDay; uniform float uHasTex;
uniform vec3 uSun; uniform vec3 uOcean; uniform vec3 uShallow; uniform vec3 uLand; uniform vec3 uLandHi; uniform vec3 uDesert;
uniform vec3 uAtm; uniform vec3 uLight; uniform float uNight;
void main(){
  vec3 n = normalize(vObj);
  float lat = asin(clamp(n.y, -1.0, 1.0));
  float lon = atan(n.x, n.z);
  vec2 uv = vec2(lon / 6.2831853 + 0.5, lat / 3.1415927 + 0.5);
  vec4 m = texture2D(uMask, uv);
  float land = smoothstep(0.40, 0.60, m.r + (m.g - 0.5) * 0.30);
  float coast = smoothstep(0.12, 0.45, m.r) * (1.0 - land);
  float alat = abs(lat);
  float desert = exp(-pow((alat - 0.46) / 0.2, 2.0)) * smoothstep(0.28, 0.7, m.g);
  vec3 lc = mix(uLand, uLandHi, smoothstep(0.35, 0.8, m.a));
  lc = mix(lc, uDesert, desert * 0.75);
  vec3 oc = mix(uOcean, uShallow, coast * 0.9 + (m.g - 0.5) * 0.08);
  vec3 day = mix(oc, lc, land);
  if (uHasTex > 0.5) day = texture2D(uDay, uv).rgb;
  float ice = smoothstep(1.34, 1.5, alat) * (0.55 + 0.45 * land);
  day = mix(day, vec3(0.9, 0.94, 0.98), ice * 0.9);
  vec3 N = normalize(vWN);
  vec3 V = normalize(cameraPosition - vWP);
  float ndl = dot(N, uSun);
  float lit = smoothstep(-0.12, 0.3, ndl);
  vec3 col = day * (0.38 + 0.78 * smoothstep(-0.05, 0.9, ndl));
  vec3 nightCol = mix(day * 0.07, vec3(0.012, 0.02, 0.05), 0.55);
  col = mix(nightCol, col, lit);
  float spec = pow(max(dot(reflect(-uSun, N), V), 0.0), 46.0) * (1.0 - land) * (1.0 - ice) * lit;
  col += vec3(1.0, 0.95, 0.85) * spec * 0.5;
  float cl = m.b * land * (1.0 - lit) * uNight;
  col += uLight * cl * 1.9;
  float tw = exp(-pow(ndl / 0.14, 2.0));
  col += vec3(1.0, 0.45, 0.2) * tw * 0.1;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  col += uAtm * fres * (0.22 + 0.78 * lit) * 0.95;
  gl_FragColor = vec4(col, 1.0);
}`;

const ATM_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vWN;
void main(){ vN = normalize(normalMatrix * normal); vWN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ATM_FRAG = /* glsl */ `
precision highp float;
varying vec3 vN; varying vec3 vWN;
uniform vec3 uAtm; uniform vec3 uSun;
void main(){
  float a = clamp(-vN.z, 0.0, 1.0);
  float g = pow(a, 1.5) * 1.5;
  float side = 0.45 + 0.55 * smoothstep(-0.6, 0.7, dot(normalize(vec3(vWN.xy, 0.0) + 1e-4), normalize(uSun * vec3(1.0, 1.0, 0.0) + 1e-4)));
  gl_FragColor = vec4(uAtm * g * side, g * side);
}`;

const v3 = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return new THREE.Vector3(r / 255, g / 255, b / 255);
};

const SUN = new THREE.Vector3(0.78, 0.3, 0.52).normalize();

class ArcCurve extends THREE.Curve<THREE.Vector3> {
  a: V3;
  b: V3;
  rise: number;
  constructor(a: V3, b: V3, rise: number) {
    super();
    this.a = a;
    this.b = b;
    this.rise = rise;
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const p = arcPoint(this.a, this.b, t, this.rise);
    return target.set(p[0], p[1], p[2]);
  }
}
const TUBE_SEG = 96;
const TUBE_RAD = 6;

const Arc: React.FC<{a: V3; b: V3; color: string; head: number; tail: number; fade: number}> = ({a, b, color, head, tail, fade}) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new ArcCurve(a, b, 0.2), TUBE_SEG, 0.0042, TUBE_RAD, false), [a, b]);
  const geo2 = useMemo(() => new THREE.TubeGeometry(new ArcCurve(a, b, 0.2), TUBE_SEG, 0.0055, TUBE_RAD, false), [a, b]);
  const r1 = useRef<THREE.BufferGeometry>(null);
  const r2 = useRef<THREE.BufferGeometry>(null);
  useLayoutEffect(() => {
    const per = TUBE_SEG * 0 + TUBE_RAD * 6;
    const h = Math.floor(clamp(head) * TUBE_SEG);
    const t = Math.floor(clamp(tail) * TUBE_SEG);
    geo.setDrawRange(0, h * per);
    geo2.setDrawRange(t * per, Math.max(0, h - t) * per);
  }, [geo, geo2, head, tail]);
  void r1;
  void r2;
  const headPos = arcPoint(a, b, clamp(head), 0.2);
  return (
    <group>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} transparent opacity={0.34 * fade} depthWrite={false} />
      </mesh>
      <mesh geometry={geo2}>
        <meshBasicMaterial color={color} transparent opacity={1.0 * fade} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {head > 0 && head < 1 && (
        <mesh position={headPos}>
          <sphereGeometry args={[0.014, 12, 10]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
};

const Marker: React.FC<{p: V3; color: string; frame: number; phase: number; appear: number; burst: number}> = ({p, color, frame, phase, appear, burst}) => {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...p).normalize()), [p]);
  const pulse = ((frame + phase) % 30) / 30;
  const k = ease.out(clamp(appear));
  const pos: V3 = [p[0] * 1.003, p[1] * 1.003, p[2] * 1.003];
  return (
    <group position={pos} quaternion={q} scale={Math.max(0.0001, k)}>
      <mesh>
        <circleGeometry args={[0.014, 20]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh scale={1 + pulse * 2.4}>
        <ringGeometry args={[0.016, 0.021, 40]} />
        <meshBasicMaterial color={color} transparent opacity={(1 - pulse) * 0.85} depthWrite={false} />
      </mesh>
      {burst > 0 && burst < 1 && (
        <mesh scale={1 + burst * 4.5}>
          <ringGeometry args={[0.018, 0.026, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={(1 - burst) * 0.9} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

const angDiff = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;

const Globe3D: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const {points, arcs, focus, textureSrc, background, backgroundEdge, nightLights, spin, startLon, tilt} = P;
  const dayTex = useImgTexture(textureSrc || undefined, 'globe-3d texture');
  const maskTex = useMemo(() => {
    const t = new THREE.DataTexture(earthMask(), EARTH_W, EARTH_H, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.wrapS = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }, []);
  const uniforms = useMemo(
    () => ({
      uMask: {value: maskTex},
      uDay: {value: dayTex ?? maskTex},
      uHasTex: {value: dayTex ? 1 : 0},
      uSun: {value: SUN},
      uOcean: {value: v3(P.oceanColor)},
      uShallow: {value: v3(P.oceanColor).lerp(new THREE.Vector3(0.35, 0.7, 0.85), 0.42)},
      uLand: {value: v3(P.landColor)},
      uLandHi: {value: v3(P.landColor).lerp(new THREE.Vector3(0.62, 0.55, 0.38), 0.55)},
      uDesert: {value: new THREE.Vector3(0.76, 0.64, 0.42)},
      uAtm: {value: v3(P.atmosphereColor)},
      uLight: {value: v3(P.lightColor)},
      uNight: {value: nightLights ? 1 : 0},
    }),
    [maskTex, dayTex, P.oceanColor, P.landColor, P.atmosphereColor, P.lightColor, nightLights],
  );
  const atmU = useMemo(() => ({uAtm: {value: v3(P.atmosphereColor)}, uSun: {value: SUN}}), [P.atmosphereColor]);

  // --- view: centre longitude / latitude, zoom ---
  const f0 = focus ?? {lat: 0, lon: 0, at: 99999, zoom: 1};
  const fp = focus ? ease.inOut(prog(frame, f0.at, f0.at + 55, (t) => t)) : 0;
  const lonBase = startLon - (spin * frame) / 30;
  const lonC = lonBase + angDiff(lonBase, f0.lon) * fp;
  const latC = tilt + (f0.lat - tilt) * fp;
  const zoom = 1 + ((f0.zoom ?? 1.8) - 1) * fp;
  const alpha = (latC * Math.PI) / 180;
  const theta = (-lonC * Math.PI) / 180;
  const fov = 32;
  const aspect = w / h;
  const fit = 0.8 * P.size * zoom;
  const tt = Math.tan((fov * Math.PI) / 360) * fit * Math.min(1, aspect);
  const dist = 1 / Math.sin(Math.atan(tt));
  const cam = useMemo(() => makeCamera([0, 0, dist], [0, 0, 0], fov, aspect), [dist, aspect]);
  const euler = useMemo(() => new THREE.Euler(alpha, theta, 0, 'XYZ'), [alpha, theta]);

  // --- points / arcs ---
  const idxOf = (r: number | string) => (typeof r === 'number' ? r : Math.max(0, points.findIndex((p) => p.name === r)));
  const vecs = useMemo(() => points.map((p) => llToVec(p.lat, p.lon)), [points]);
  const used = new Set<number>();
  const arcInfo = arcs.map((a, i) => {
    const s = a.at ?? 14 + i * 24;
    const ia = idxOf(a.from);
    const ib = idxOf(a.to);
    used.add(ia);
    used.add(ib);
    const flight = 44;
    const head = ease.inOut(prog(frame, s, s + flight, (t) => t));
    const tail = ease.inOut(prog(frame, s + 14, s + flight + 22, (t) => t));
    const settle = prog(frame, s + flight, s + flight + 20, (t) => t);
    return {a: ia, b: ib, s, head, tail, fade: 0.55 + 0.45 * (1 - settle), burst: prog(frame, s + flight - 2, s + flight + 26, (t) => t), color: a.color ?? P.arcColor};
  });
  const markerAppear = (i: number) => {
    const first = arcInfo.reduce((m, a) => (a.a === i || a.b === i ? Math.min(m, a.s - 6) : m), 9999);
    return prog(frame, Math.min(first, 40), Math.min(first, 40) + 12, (t) => t);
  };

  const starDots = useMemo(() => scatter(P.stars ? 110 : 0, 'globe-stars', (r) => ({x: r(), y: r(), s: 0.4 + r() * 1.3, p: r() * 6.28, o: 0.25 + r() * 0.6})), [P.stars]);
  const vis = (p: V3) => {
    const wv = new THREE.Vector3(...p).applyEuler(euler);
    const pp = projectPx(cam, [wv.x * 1.004, wv.y * 1.004, wv.z * 1.004], w, h);
    const facing = wv.z / Math.max(0.0001, 1) - 1 / dist;
    return {x: pp.x, y: pp.y, vis: pp.visible && facing > 0.04, facing};
  };
  const labFs = 17 * u * (portrait ? 1.15 : 1);
  const focusLabel = focus?.label ?? '';
  const lp = focus ? ease.out(prog(frame, f0.at + 30, f0.at + 56, (t) => t)) : 0;

  return (
    <AbsoluteFill style={{background: background === 'transparent' ? undefined : `radial-gradient(120% 100% at 50% 45%, ${backgroundEdge} 0%, ${background} 72%)`}}>
      {P.stars && background !== 'transparent' && (
        <Svg>
          {starDots.map((s, i) => (
            <circle key={i} cx={s.x * w} cy={s.y * h} r={s.s * u} fill="#cfe0ff" opacity={s.o * (0.65 + 0.35 * Math.sin(frame * 0.07 + s.p))} />
          ))}
        </Svg>
      )}
      <Stage3D transparent>
        <CameraRig position={[0, 0, dist]} target={[0, 0, 0]} fov={fov} near={0.1} far={50} />
        <group rotation={[alpha, theta, 0]}>
          <mesh>
            <sphereGeometry args={[1, 128, 96]} />
            <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} />
          </mesh>
          {arcInfo.map((a, i) => (
            <Arc key={i} a={vecs[a.a]} b={vecs[a.b]} color={a.color} head={a.head} tail={a.tail} fade={a.fade * (a.head > 0 ? 1 : 0)} />
          ))}
          {points.map((p, i) =>
            used.has(i) || arcs.length === 0 ? (
              <Marker key={i} p={vecs[i]} color={p.color ?? P.markerColor} frame={frame} phase={i * 7} appear={markerAppear(i)} burst={Math.max(0, ...arcInfo.filter((a) => a.b === i).map((a) => a.burst))} />
            ) : null,
          )}
        </group>
        <mesh scale={1.0}>
          <sphereGeometry args={[1.07, 96, 64]} />
          <shaderMaterial uniforms={atmU} vertexShader={ATM_VERT} fragmentShader={ATM_FRAG} side={THREE.BackSide} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </Stage3D>
      <Svg>
        {P.labels &&
          points.map((p, i) => {
            if (!used.has(i) && arcs.length > 0) return null;
            const s = vis(vecs[i]);
            const a = clamp((s.facing - 0.04) / 0.2) * markerAppear(i);
            if (!s.vis || a <= 0.02) return null;
            const flip = s.x > w * 0.72;
            return (
              <g key={i} opacity={a}>
                <text x={s.x + (flip ? -1 : 1) * 14 * u} y={s.y - 12 * u} textAnchor={flip ? 'end' : 'start'} fontFamily={fonts.sans} fontWeight={600} fontSize={labFs} fill="#f4f8ff" stroke="#05101f" strokeWidth={3 * u} paintOrder="stroke" letterSpacing={0.4 * u}>
                  {p.name}
                </text>
              </g>
            );
          })}
        {focusLabel && lp > 0 && (
          <g opacity={lp} transform={`translate(${(portrait ? 0.08 : 0.07) * w},${h * (portrait ? 0.9 : 0.88)})`}>
            <rect x={0} y={-labFs * 2.6} width={4 * u} height={labFs * 3.1} fill={P.arcColor} />
            <text x={18 * u} y={-labFs * 1.15} fontFamily={fonts.mono} fontSize={labFs * 0.8} fill={P.arcColor} letterSpacing={3 * u}>
              {`${Math.abs(f0.lat).toFixed(1)}°${f0.lat >= 0 ? 'N' : 'S'}  ${Math.abs(f0.lon).toFixed(1)}°${f0.lon >= 0 ? 'E' : 'W'}`}
            </text>
            <text x={18 * u} y={labFs * 0.6} fontFamily={fonts.display} fontSize={labFs * 2.2} fill="#f4f8ff" letterSpacing={2 * u}>
              {focusLabel.toUpperCase()}
            </text>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

const PTS: Pt[] = [
  {name: 'London', lat: 51.5, lon: -0.1},
  {name: 'New York', lat: 40.7, lon: -74},
  {name: 'Tokyo', lat: 35.7, lon: 139.7},
  {name: 'Sydney', lat: -33.9, lon: 151.2},
  {name: 'Sao Paulo', lat: -23.5, lon: -46.6},
  {name: 'Dubai', lat: 25.2, lon: 55.3},
  {name: 'Nairobi', lat: -1.3, lon: 36.8},
  {name: 'Singapore', lat: 1.35, lon: 103.8},
  {name: 'Berlin', lat: 52.5, lon: 13.4},
];

export const globe3d = defineMotion<Props>({
  id: 'globe-3d',
  title: 'Globe (3D, day/night, arcs)',
  category: '3d',
  description:
    'A shaded three.js Earth (procedural land and ocean, soft day/night terminator with warm city lights, atmosphere rim) turns slowly; glowing arcs lift off the surface and fly between cities along great circles with pulsing markers and name labels, then the camera swings to a focus lat/lon and zooms in with a coordinates caption.',
  source: ['prompt corpus x25 (globe with arcs, terminator, focus zoom)', 'original coarse coastline data'],
  useFor: 'Global reach stats, travel and logistics routes, climate and space explainers, "we ship worldwide" beats. Use `textureSrc` for a real equirectangular map; set `background: "transparent"` to overlay.',
  durationInFrames: 240,
  defaultProps: {
    points: PTS,
    arcs: [
      {from: 'Dubai', to: 'Singapore', at: 10},
      {from: 'Nairobi', to: 'Dubai', at: 34},
      {from: 'Singapore', to: 'Tokyo', at: 56},
      {from: 'London', to: 'Dubai', at: 80},
      {from: 'London', to: 'Nairobi', at: 102},
      {from: 'Berlin', to: 'London', at: 126},
    ],
    focus: {lat: 49, lon: 9, at: 140, label: 'Europe', zoom: 1.45},
    textureSrc: '',
    background: '#04070f',
    backgroundEdge: '#0d1b3a',
    oceanColor: '#0f3b78',
    landColor: '#3f8a4d',
    atmosphereColor: '#6cb6ff',
    arcColor: '#ffc65a',
    markerColor: '#ffe9a8',
    nightLights: true,
    lightColor: '#ffc873',
    spin: 9,
    startLon: 60,
    tilt: 18,
    labels: true,
    stars: true,
    size: 1,
  },
  propDocs: {
    points: '[{name, lat, lon, color?}] markers (only points used by an arc get a marker/label)',
    arcs: '[{from, to, at?, color?}] great-circle flights; from/to are point names or indexes, at = start frame',
    focus: '{lat, lon, at, label?, zoom?} camera swings and zooms to this place from frame `at`; null = never',
    textureSrc: 'optional equirectangular day-map image (public/ path or URL); empty = procedural Earth',
    background: 'backdrop outer colour ("transparent" to overlay the globe on your own scene)',
    backgroundEdge: 'backdrop centre glow colour',
    oceanColor: 'deep ocean colour',
    landColor: 'lowland colour',
    atmosphereColor: 'atmosphere rim colour',
    arcColor: 'arc / caption accent colour',
    markerColor: 'marker colour',
    nightLights: 'show city lights on the night side',
    lightColor: 'city-light colour',
    spin: 'rotation speed, degrees per second (eastward)',
    startLon: 'longitude facing the camera at frame 0',
    tilt: 'camera latitude (degrees above the equator)',
    labels: 'show city name labels',
    stars: 'draw a faint starfield behind the globe',
    size: 'globe size multiplier (1 = about 80% of the short side)',
  },
  component: Globe3D,
  tags: ['globe', 'earth', 'world', 'map', 'arcs', 'flights', 'routes', 'logistics', 'travel', 'global', 'night lights', 'terminator', 'atmosphere', 'three.js', '3d', 'geo', 'cities', 'shipping', 'zoom', 'overlay', 'space'],
});
