import React, {useMemo} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {luma, mixHex, shade} from '../../core/r2-pr2-kit';
import {StudioEnv, bgCss, fitDistBox} from '../../core/r3-3d-kit';
import {useStage} from '../../core/stage';
import {CameraRig, Stage3D, V3, discTexture, makeCamera, projectPx, smoothstep} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * Icon / logo / label badges sit on the surface of a slowly rotating (tilted) sphere: badges on the near side are big
 * and bright, the far side is small and dim and passes behind the solid core. Badges pop out from the core with a
 * stagger; the badge nearest the viewer is highlighted. Latitude rings and a dotted shell give the sphere form.
 */
type Props = {
  items: string[];
  icons: string[];
  images: string[];
  title: string;
  subtitle: string;
  background: string;
  ink: string;
  coreColor: string;
  coreInk: string;
  colors: string[];
  coreStyle: string;
  showLabels: boolean;
  rings: number;
  dots: number;
  speed: number;
  tilt: number;
  startAt: number;
  stagger: number;
  size: number;
};

// simple 24x24 stroke glyphs (in the style of common open icon sets; drawn here, no assets)
const GLYPHS: Record<string, string> = {
  design: 'M12 20h9 M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
  code: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
  cloud: 'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z',
  data: 'M18 20V10 M12 20V4 M6 20v-6',
  mail: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z M22 6l-10 7L2 6',
  chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  music: 'M9 18V5l12-2v13 M9 18a3 3 0 11-6 0 3 3 0 016 0z M21 16a3 3 0 11-6 0 3 3 0 016 0z',
  photo: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z',
  map: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
  pay: 'M3 5h18a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z M1 10h22',
  docs: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M8 13h8 M8 17h8',
  video: 'M5 3l14 9-14 9z',
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 018 0v4',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  globe: 'M12 22a10 10 0 100-20 10 10 0 000 20z M2 12h20 M12 2a15 15 0 010 20 15 15 0 010-20z',
};
const GLYPH_KEYS = Object.keys(GLYPHS);
const ALIASES: Record<string, string> = {photos: 'photo', camera: 'photo', maps: 'map', payments: 'pay', payment: 'pay', money: 'pay', files: 'docs', doc: 'docs', document: 'docs', analytics: 'data', chart: 'data', email: 'mail', message: 'chat', messages: 'chat', play: 'video', movie: 'video', security: 'lock', team: 'user', people: 'user', web: 'globe', world: 'globe', fast: 'bolt', speed: 'bolt', favourite: 'heart', favorite: 'heart', storage: 'cloud', dev: 'code', api: 'code', ui: 'design'};

/** glyph path for a badge: an explicit icon name, else matched from the label; unknown labels get a monogram */
const glyphFor = (label: string, icon: string | undefined, i: number): string | undefined => {
  const look = (k: string) => GLYPHS[k.toLowerCase().trim()] ?? GLYPHS[ALIASES[k.toLowerCase().trim()]];
  if (icon) return look(icon) ?? GLYPHS[GLYPH_KEYS[i % GLYPH_KEYS.length]];
  return look(label);
};

const OrbitingIconsSphere: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const aspect = w / h;
  const items = (P.items.length ? P.items : ['Item']).slice(0, 40);
  const n = items.length;
  const R = 3;
  const fov = 30;
  const D = fitDistBox(R * 1.2, R * 1.32, fov, aspect) / P.size;
  const camPos: V3 = [0, 0, D];
  const cam3 = useMemo(() => makeCamera(camPos, [0, 0, 0], fov, aspect), [D, aspect]); // eslint-disable-line react-hooks/exhaustive-deps
  const cx = w / 2;
  const cy = h / 2;
  const Rpx = projectPx(cam3, [R, 0, 0], w, h).x - cx;

  const palette = P.colors.length ? P.colors : ['#4f6bff'];
  const bgRef = P.background === 'transparent' ? '#ffffff' : P.background;
  const solid = P.coreStyle !== 'none';
  const ink = P.ink || (luma(bgRef) > 0.5 ? '#1a2240' : '#ffffff');
  const coreInk = P.coreInk || (solid ? (luma(P.coreColor) > 0.55 ? '#14183a' : '#ffffff') : ink);

  // fibonacci-lattice layout (unit vectors)
  const base = useMemo(
    () =>
      Array.from({length: n}, (_, i) => {
        const y = n === 1 ? 0 : 1 - (2 * (i + 0.5)) / n;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const a = i * 2.399963229728653;
        return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      }),
    [n],
  );

  const yaw = (P.speed * frame * Math.PI) / 180;
  const q = useMemo(() => new THREE.Quaternion(), []);
  const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const qt = new THREE.Quaternion().setFromEuler(new THREE.Euler((P.tilt * Math.PI) / 180, 0, (-P.tilt * 0.55 * Math.PI) / 180));
  q.copy(qt).multiply(qy);

  const coreIn = ease.out(prog(frame, P.startAt, P.startAt + 22, (t) => t));
  const chipPx = Rpx * 0.3 * clamp(Math.sqrt(12 / n), 0.55, 1.25);

  const placed = items.map((label, i) => {
    const e = ease.back(prog(frame, P.startAt + 12 + i * P.stagger, P.startAt + 12 + i * P.stagger + 28, (t) => t));
    const v = base[i].clone().applyQuaternion(q);
    const rad = R * Math.max(0.0001, e);
    const wp: V3 = [v.x * rad, v.y * rad, v.z * rad];
    const pr = projectPx(cam3, wp, w, h);
    const persp = D / (D - wp[2]);
    const near = smoothstep(0.62, 0.98, v.z);
    const dim = 0.3 + 0.7 * smoothstep(-0.9, 0.0, v.z);
    return {label, i, x: pr.x, y: pr.y, z: v.z, k: persp * (0.82 + 0.28 * near) * clamp(e, 0, 1.15), op: dim * clamp(e * 1.4), near};
  });

  const cc = (i: number) => palette[i % palette.length];
  const renderChip = (c: (typeof placed)[number], front: boolean) => {
    const size = chipPx * c.k;
    const iconUrl = P.images[c.i];
    const g = iconUrl ? undefined : glyphFor(c.label, P.icons[c.i], c.i);
    return (
      <div key={c.i} style={{position: 'absolute', left: c.x, top: c.y, width: 0, height: 0, opacity: c.op, zIndex: Math.round((c.z + 1) * 100)}}>
        <div style={{position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, borderRadius: size * 0.3, background: iconUrl ? '#ffffff' : `linear-gradient(145deg, ${shade(cc(c.i), 0.18)}, ${cc(c.i)} 60%, ${shade(cc(c.i), -0.2)})`, boxShadow: `0 ${size * 0.1}px ${size * 0.28}px rgba(10,16,40,${front ? 0.3 : 0.14})${c.near > 0.05 ? `, 0 0 0 ${size * 0.05 * c.near}px ${mixHex(cc(c.i), '#ffffff', 0.55)}` : ''}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
          {iconUrl ? (
            <Img src={resolveSrc(iconUrl)} style={{width: '78%', height: '78%', objectFit: 'contain'}} />
          ) : g ? (
            <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d={g} />
            </svg>
          ) : (
            <span style={{color: '#fff', fontFamily: fonts.grotesk, fontWeight: 700, fontSize: size * 0.5}}>{c.label.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        {P.showLabels && (
          <div style={{position: 'absolute', left: -size * 1.2, width: size * 2.4, top: size * 0.58, textAlign: 'center', fontFamily: fonts.sans, fontWeight: 600, fontSize: Math.max(11, size * 0.24), color: ink, whiteSpace: 'nowrap', opacity: 0.7 + 0.3 * c.near}}>
            <span style={{background: luma(bgRef) > 0.5 ? 'rgba(255,255,255,0.78)' : 'rgba(10,14,30,0.6)', padding: `${size * 0.03}px ${size * 0.1}px`, borderRadius: size * 0.2}}>{c.label}</span>
          </div>
        )}
      </div>
    );
  };

  const dots = useMemo(() => {
    const m = Math.max(0, Math.round(P.dots));
    const arr = new Float32Array(m * 3);
    for (let i = 0; i < m; i++) {
      const y = 1 - (2 * (i + 0.5)) / m;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.399963229728653;
      arr[i * 3] = Math.cos(a) * r * R * 0.985;
      arr[i * 3 + 1] = y * R * 0.985;
      arr[i * 3 + 2] = Math.sin(a) * r * R * 0.985;
    }
    return arr;
  }, [P.dots]);
  const sprite = useMemo(() => discTexture(32, 0.5), []);
  const ringTilts: number[] = [0, 1.1, -1.1, 0.55, -0.55].slice(0, Math.round(P.rings));
  const titleLen = Math.max(...P.title.split('\n').map((l) => l.length), 1);
  const fs = Math.min(Rpx * 0.25, (Rpx * 1.0) / (titleLen * 0.55));
  const titleA = ease.out(prog(frame, P.startAt + 6, P.startAt + 30, (t) => t));
  const bg = bgCss(P.background, P.coreColor);
  void durationInFrames;
  void u;

  return (
    <AbsoluteFill style={{background: bg}}>
      <div style={{position: 'absolute', inset: 0}}>{placed.filter((c) => c.z < 0).sort((a, b) => a.z - b.z).map((c) => renderChip(c, false))}</div>
      <Stage3D transparent exposure={1}>
        <CameraRig position={camPos} target={[0, 0, 0]} fov={fov} near={0.5} far={80} />
        <StudioEnv intensity={0.7} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[-4, 5, 6]} intensity={2.2} color="#ffffff" />
        <directionalLight position={[5, -2, 3]} intensity={1.0} color={mixHex(palette[0], '#ffffff', 0.4)} />
        <group quaternion={[q.x, q.y, q.z, q.w]}>
          {P.coreStyle === 'solid' && (
            <mesh scale={coreIn}>
              <sphereGeometry args={[R * 0.6, 64, 48]} />
              <meshPhysicalMaterial color={P.coreColor} roughness={0.32} metalness={0.15} clearcoat={0.9} clearcoatRoughness={0.2} />
            </mesh>
          )}
          {P.coreStyle === 'wire' && (
            <>
              <mesh scale={coreIn}>
                <sphereGeometry args={[R * 0.58, 40, 28]} />
                <meshBasicMaterial color={shade(P.coreColor, -0.5)} />
              </mesh>
              <mesh scale={coreIn}>
                <icosahedronGeometry args={[R * 0.6, 3]} />
                <meshBasicMaterial color={palette[0]} wireframe transparent opacity={0.55} />
              </mesh>
            </>
          )}
          {ringTilts.map((t, i) => (
            <mesh key={i} rotation={[Math.PI / 2 + t, 0, i * 0.7]} scale={coreIn}>
              <torusGeometry args={[R * (i === 0 ? 1.0 : 0.985), 0.012, 8, 160]} />
              <meshBasicMaterial color={mixHex(palette[i % palette.length], '#ffffff', 0.3)} transparent opacity={0.4} />
            </mesh>
          ))}
          {dots.length > 0 && (
            <points scale={coreIn}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[dots, 3]} />
              </bufferGeometry>
              <pointsMaterial color={mixHex(palette[0], '#ffffff', 0.45)} size={0.05} map={sprite} transparent opacity={0.8} depthWrite={false} sizeAttenuation />
            </points>
          )}
        </group>
      </Stage3D>
      <div style={{position: 'absolute', inset: 0}}>{placed.filter((c) => c.z >= 0).sort((a, b) => a.z - b.z).map((c) => renderChip(c, true))}</div>
      {(P.title || P.subtitle) && (
        <div style={{position: 'absolute', left: cx - Rpx * 0.62, width: Rpx * 1.24, top: cy, transform: `translateY(-50%) scale(${0.9 + 0.1 * titleA})`, textAlign: 'center', color: coreInk, zIndex: 1000, opacity: titleA * coreIn, fontFamily: fonts.grotesk, pointerEvents: 'none'}}>
          <div style={{fontSize: fs, fontWeight: 700, lineHeight: 1.05, letterSpacing: -fs * 0.03, whiteSpace: 'pre-line'}}>{P.title}</div>
          {P.subtitle && <div style={{fontFamily: fonts.sans, fontSize: Math.max(12, fs * 0.3), fontWeight: 500, opacity: 0.75, marginTop: fs * 0.22, lineHeight: 1.25}}>{P.subtitle}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const orbitingIconsSphere = defineMotion<Props>({
  id: 'orbiting-icons-sphere',
  title: 'Orbiting icons sphere',
  category: '3d',
  description:
    'Icon (or logo) badges with labels cover a slowly rotating, tilted sphere: they pop out of a glossy core with a stagger, near-side badges are large and highlighted while far-side ones shrink, dim and pass behind the core. Latitude rings and a dotted shell give the globe form; a title sits on the core.',
  source: ['3D tag-cloud / integrations globe (original build; three.js + HTML badges)'],
  useFor: 'Integrations / "works with" walls, feature or skills clouds, ecosystem and partner beats, community and category hubs. Pass `items` (labels), optional `icons` names or `images` (logos) and brand `colors`.',
  durationInFrames: 240,
  defaultProps: {
    items: ['Design', 'Code', 'Cloud', 'Data', 'Mail', 'Chat', 'Music', 'Photo', 'Map', 'Pay', 'Docs', 'Video'],
    icons: [],
    images: [],
    title: 'One hub\nevery tool',
    subtitle: 'Connect what you already use',
    background: '#f1f4fb',
    ink: '',
    coreColor: '#1b2660',
    coreInk: '',
    colors: ['#4f6bff', '#ff5ea8', '#18b8a6', '#ffb020'],
    coreStyle: 'solid',
    showLabels: true,
    rings: 3,
    dots: 420,
    speed: 0.55,
    tilt: 18,
    startAt: 4,
    stagger: 4,
    size: 1,
  },
  propDocs: {
    items: 'badge labels (1-40); the count sets how many badges cover the sphere',
    icons: "glyph per badge: design | code | cloud | data | mail | chat | music | photo | map | pay | docs | video | bolt | star | heart | lock | user | globe (empty = pick from the label, else cycle)",
    images: 'logo / icon images per badge (public/ path or URL); overrides the glyph for that badge',
    title: 'text on the core (\\n for a line break; "" for none)',
    subtitle: 'small line under the title',
    background: "background colour ('transparent' to composite over other content)",
    ink: 'label colour (empty = auto contrast)',
    coreColor: 'core sphere colour',
    coreInk: 'title colour on the core (empty = auto contrast)',
    colors: 'badge colours, cycled',
    coreStyle: "'solid' (glossy core, hides the far side) | 'wire' (dark wireframe core) | 'none' (open globe)",
    showLabels: 'show the text label under each badge',
    rings: 'number of orbit rings 0..5',
    dots: 'number of dots in the shell (0 = none)',
    speed: 'rotation in degrees per frame',
    tilt: 'axis tilt in degrees',
    startAt: 'frame the core appears',
    stagger: 'frames between badges popping out',
    size: 'overall scale multiplier',
  },
  component: OrbitingIconsSphere,
  tags: ['icons', 'sphere', 'orbit', 'globe', 'integrations', 'tag cloud', 'logos', 'partners', 'ecosystem', 'skills', 'features', 'hub', 'rotating', 'badges', 'labels', 'three.js', '3d', 'apps', 'works with'],
});
