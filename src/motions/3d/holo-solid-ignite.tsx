// Adapted from lemo-opuscar/styles/hologram-hud/demo/engine/holo.js (Fresnel faces from projection, beam) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  buildDrone,
  cl,
  eo3,
  h1,
  HoloCam,
  HoloChrome,
  HoloGlowDef,
  HoloPad,
  holoPaths,
  holoProject,
  HoloStage,
  holoTheme,
  HoloWire,
  lerp,
  lf,
  rgbaC,
  seg,
  TAU,
  V3,
} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  title: string;
  tagline: string;
  igniteAt: number;
  turns: number;
  background: string;
  hue: number;
  accent: number;
  beam: boolean;
  motes: number;
  fill: number;
};

const HoloSolidIgnite: React.FC<Props> = ({title, tagline, igniteAt, turns, background, hue, accent, beam, motes, fill}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const th = holoTheme(hue, accent);
  const clear = background === 'transparent';
  const cam: HoloCam = {
    yaw: -0.4 + (frame / D) * TAU * turns,
    pitch: 0.36 + 0.05 * Math.sin(frame / 70),
    dist: 6.3,
    f: Math.min(w, h) * (portrait ? 1.45 : 1.3),
    cx: w / 2,
    cy: h * (portrait ? 0.44 : 0.44),
  };
  const parts = buildDrone(frame * 0.7);
  const build = seg(frame, 4, igniteAt - 8);
  const scanY = frame < igniteAt - 8 ? lerp(-0.6, 0.7, eo3(build)) : Infinity;
  const ig = frame - igniteAt;
  const lit = cl(ig / 18);
  const widthMul = ig < 0 ? 1 : lerp(1.5, 1.12, eo3(ig / 20));
  const paths = holoPaths(parts, {cam, scanY});
  const flash = ig >= 0 && ig < 3 ? 1 - ig / 3 : 0;

  // ---- Fresnel faces (facing = projected area / (world area · scale²))
  const wave = ig < 0 ? -9 : lerp(-0.55, 0.75, ((ig % 75) / 75));
  type F = {d: string; depth: number; a: number; hot: number};
  const faces: F[] = [];
  if (ig >= 0) {
    for (const part of parts) {
      for (const pc of part.pieces) {
        for (const f of pc.faces) {
          if (f.length < 3) continue;
          const P = f.map((p) => holoProject(cam, p));
          let area = 0;
          for (let i = 0; i < P.length; i++) {
            const a = P[i];
            const b = P[(i + 1) % P.length];
            area += a[0] * b[1] - b[0] * a[1];
          }
          area = Math.abs(area) / 2;
          // world area (fan from vertex 0)
          let wa = 0;
          for (let i = 1; i < f.length - 1; i++) {
            const A = f[0];
            const B = f[i];
            const C = f[i + 1];
            const ab: V3 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
            const ac: V3 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
            wa += Math.hypot(ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]) / 2;
          }
          const depth = P.reduce((s, p) => s + p[2], 0) / P.length;
          const sc = cam.f / depth;
          const facing = cl(area / Math.max(1e-6, wa * sc * sc));
          const fres = 0.3 + 0.7 * Math.pow(1 - facing, 1.6);
          const cy = f.reduce((s, p) => s + p[1], 0) / f.length;
          const hot = Math.exp(-(((cy - wave) / 0.07) ** 2));
          faces.push({d: 'M' + P.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z', depth, a: fres, hot});
        }
      }
    }
    faces.sort((a, b) => b.depth - a.depth);
  }

  // ---- projector beam from the pad
  const padY = -0.45;
  const padR = 1.7;
  const beamOn = beam ? eo3(seg(ig, 0, 24)) : 0;
  const beamTop = lerp(padY, 1.4, beamOn);
  const left = holoProject(cam, [-padR * Math.cos(cam.yaw), padY, padR * Math.sin(cam.yaw)]);
  const right = holoProject(cam, [padR * Math.cos(cam.yaw), padY, -padR * Math.sin(cam.yaw)]);
  // screen-space beam: pad's horizontal extent rising, narrowing slightly
  const topY = holoProject(cam, [0, beamTop, 0])[1];
  const lx = Math.min(left[0], right[0]);
  const rx = Math.max(left[0], right[0]);
  const by = (left[1] + right[1]) / 2;
  const rays: string[] = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU + frame * 0.003;
    const p0 = holoProject(cam, [Math.cos(a) * padR * 0.95, padY, Math.sin(a) * padR * 0.95]);
    const p1 = holoProject(cam, [Math.cos(a) * padR * 0.75, beamTop, Math.sin(a) * padR * 0.75]);
    rays.push(`M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`);
  }
  const moteEls: React.ReactNode[] = [];
  for (let i = 0; i < motes; i++) {
    const a = h1(i, 1) * TAU;
    const r = Math.sqrt(h1(i, 2)) * padR * 0.9;
    const life = 90 + h1(i, 3) * 80;
    const t = ((frame + h1(i, 4) * life) % life) / life;
    const y = lerp(padY, beamTop, t);
    if (y > beamTop) continue;
    const p = holoProject(cam, [Math.cos(a) * r, y, Math.sin(a) * r]);
    moteEls.push(<circle key={i} cx={p[0]} cy={p[1]} r={(1 + h1(i, 5) * 1.6) * u} fill={th.hot} opacity={Math.sin(t * Math.PI) * 0.7 * beamOn} />);
  }

  const stripe = 4 * u;
  const titleIn = eo3(seg(frame, igniteAt + 30, igniteAt + 50));
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background, overflow: 'hidden'}}>
      {!clear && <HoloStage theme={th} w={w} h={h} u={u} px={frame * 0.6} id="hsi-dots" />}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <HoloGlowDef id="hsi-glow" u={u} strength={1 + lit * 0.3} />
          <linearGradient id="hsi-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={th.line} stopOpacity={0.12} />
            <stop offset="1" stopColor={th.line} stopOpacity={0} />
          </linearGradient>
          <pattern id="hsi-lace" width={8} height={stripe} patternUnits="userSpaceOnUse" y={(frame * u) % stripe}>
            <rect width={8} height={stripe / 2} fill="#fff" />
            <rect y={stripe / 2} width={8} height={stripe / 2} fill="#fff" opacity={0.38} />
          </pattern>
          <mask id="hsi-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect width={w} height={h} fill="url(#hsi-lace)" />
          </mask>
        </defs>
        <HoloPad cam={cam} y={padY} r={2.1} theme={th} u={u} rot={frame * 0.005} />
        {beamOn > 0 && (
          <g style={{mixBlendMode: 'screen'}}>
            <path d={`M${lx} ${by}L${rx} ${by}L${rx - (rx - lx) * 0.08} ${topY}L${lx + (rx - lx) * 0.08} ${topY}Z`} fill="url(#hsi-beam)" opacity={beamOn} />
            <path d={rays.join('')} stroke={th.line} strokeOpacity={0.07 * beamOn} strokeWidth={1.2 * u} />
            {moteEls}
          </g>
        )}
        {faces.length > 0 && (
          <g mask="url(#hsi-mask)" style={{mixBlendMode: 'screen'}} opacity={lit}>
            {faces.map((f, i) => (
              <path key={i} d={f.d} fill={f.hot > 0.05 ? rgbaC(th.hot, cl(f.a * fill + f.hot * 0.35)) : rgbaC(th.line, f.a * fill)} />
            ))}
          </g>
        )}
        <HoloWire paths={paths} theme={th} u={u} glowId="hsi-glow" width={1.3 * widthMul} />
        {flash > 0 && <rect width={w} height={h} fill={th.hot} opacity={flash * 0.35} />}
      </svg>
      {/* title lockup */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: portrait ? 0.16 * h : 0.06 * h, textAlign: 'center', opacity: titleIn, transform: `translateY(${(1 - titleIn) * 12 * u}px)`}}>
        <div style={{fontFamily: lf.rajdhani, fontWeight: 300, fontSize: (portrait ? 120 : 110) * u, letterSpacing: 26 * u, color: '#e2f2f4', lineHeight: 1, paddingLeft: 26 * u, textShadow: `0 0 ${18 * u}px ${rgbaC(th.line, 0.5)}`}}>{title}</div>
        <div style={{fontFamily: lf.techMono, fontSize: 24 * u, letterSpacing: 6 * u, color: th.line, marginTop: 14 * u}}>{tagline}</div>
      </div>
      {!clear && <HoloChrome w={w} h={h} u={u} theme={th} tl={`${title} // ${ig >= 0 ? 'SOLID' : 'SCAN'}`} tr={ig >= 0 ? 'IGNITED' : `BUILD ${Math.round(build * 100)}%`} bl={`Y ${scanY === Infinity ? '1.00' : (scanY + 0.6).toFixed(2)} M`} br={`${((cam.yaw * 57.3) % 360).toFixed(1)}°`} on={cl(frame / 10)} />}
    </AbsoluteFill>
  );
};

export const holoSolidIgnite = defineMotion<Props>({
  id: 'holo-solid-ignite',
  title: 'Holo solid ignite',
  category: '3d',
  description:
    'A cyan hologram wireframe builds up through a scan plane, then ignites into a translucent solid: faces fill with edge-bright Fresnel and scrolling interlace lines, a light wave climbs the model, lines thicken then settle, and a projector beam with rays and dust motes rises from the pad while it turntables.',
  source: ['lemo-opuscar styles/hologram-hud (MIT, LemoLab) — holo.js Fresnel faces + beam, STYLE.md'],
  useFor: 'The once-per-film "the whole thing is ready" launch beat for products, apps and logos.',
  durationInFrames: 240,
  defaultProps: {
    title: 'LUMEN D1',
    tagline: 'READY FOR FLIGHT',
    igniteAt: 62,
    turns: 0.55,
    background: '#020709',
    hue: 188,
    accent: 38,
    beam: true,
    motes: 70,
    fill: 0.55,
  },
  propDocs: {
    title: 'product name revealed after ignition',
    tagline: 'mono line under the title',
    igniteAt: 'frame the wireframe ignites into a solid',
    turns: 'turntable turns over the whole duration',
    background: 'stage colour, or "transparent" for an overlay',
    hue: 'hologram hue (188 cyan)',
    accent: 'accent hue',
    beam: 'projector beam with rays and dust',
    motes: 'number of dust motes in the beam',
    fill: 'face fill strength (0.2–0.5)',
  },
  component: HoloSolidIgnite,
  tags: ['hologram', '3d', 'wireframe', 'fresnel', 'ignite', 'launch', 'reveal', 'product', 'turntable', 'beam', 'projector', 'sci-fi', 'scan', 'cyan', 'drone'],
});
