// Adapted from lemo-opuscar/styles/glass-product/demo/product.js explode() + DEMO.md motion numbers (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {easeIn3, easeOut3, mixHex, s1f, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Exploded view that snaps shut on a beat. A stack of product parts (isometric slabs with depth sorting) floats apart
 * along one diagonal axis in 3 s ease-out, each tilting and spinning slightly, hovers with a +3 % drift for 0.75 s, then all
 * parts snap back together in a quarter second (ease-in) — and in the same frame the screen lights, a click cluster pops,
 * a 2-frame micro-shake hits and the camera pushes in 40 % over the next 0.9 s.
 */
type Part = {label: string; kind: 'glass' | 'screen' | 'board' | 'battery' | 'frame' | 'base'; color: string};
type Props = {
  parts: Part[];
  axis: number;
  spread: number;
  tOpen: number;
  openFrames: number;
  hoverFrames: number;
  snapFrames: number;
  push: number;
  labels: boolean;
  accent: string;
  background: string;
};

type V = [number, number, number];

const rounded = (w: number, d: number, r: number, n = 5): [number, number][] => {
  const pts: [number, number][] = [];
  const cs: [number, number, number][] = [
    [w / 2 - r, d / 2 - r, 0],
    [-w / 2 + r, d / 2 - r, 0.5],
    [-w / 2 + r, -d / 2 + r, 1],
    [w / 2 - r, -d / 2 + r, 1.5],
  ];
  cs.forEach(([cx, cz, q]) => {
    for (let i = 0; i <= n; i++) {
      const a = (q + i / n * 0.5) * Math.PI;
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  });
  return pts;
};

const ExplodedViewSnap: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('evs');
  const n = Math.max(2, p.parts.length);
  const tOpen = p.tOpen;
  const tHover = tOpen + p.openFrames;
  const tSnap = tHover + p.hoverFrames;
  const tEnd = tSnap + p.snapFrames;
  // explode amount: 0 assembled -> 1 apart (ease-out), hover drift +3 %, snap shut (ease-in)
  const open = easeOut3(sseg(frame, tOpen, tHover));
  const drift = 0.03 * sseg(frame, tHover, tSnap);
  const snap = easeIn3(sseg(frame, tSnap, tEnd));
  const E = (open + drift) * (1 - snap);
  const snapped = frame >= tEnd;
  const since = frame - tEnd;
  const shake = since >= 0 && since < 2 ? (since === 0 ? 1 : -1) * 3.5 * u : 0;
  const pushK = 1 + p.push * easeIn3(0) + p.push * (1 - Math.pow(1 - sseg(frame, tEnd + 2, tEnd + 29), 3));
  const flash = since >= 0 && since < 4 ? 1 - since / 4 : 0;
  // camera: yaw/pitch (isometric-ish)
  const yaw = (-34 * Math.PI) / 180;
  const pitch = (27 * Math.PI) / 180;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const S = (portrait ? w * 0.33 : Math.min(h * 0.33, w * 0.2)) * pushK;
  const ox = w / 2;
  const oy = h * (portrait ? 0.5 : 0.5) + (frame > tEnd ? 12 * u * (pushK - 1) : 0);
  const cam = (x: number, y: number, z: number): V => {
    const X1 = x * cy + z * sy;
    const Z1 = -x * sy + z * cy;
    const Y2 = y * cp - Z1 * sp;
    const Z2 = y * sp + Z1 * cp;
    return [ox + shake + E * S * (portrait ? 0.02 : 0.28) + X1 * S, oy - Y2 * S, Z2];
  };
  // explode direction: along one axis ~axis degrees from vertical with a little depth
  const a = (p.axis * Math.PI) / 180;
  const ev: V = [Math.sin(a) * 0.9, Math.cos(a), -Math.sin(a) * 0.55];
  const thick = 0.1;
  const baseOff = (i: number) => ((n - 1) / 2 - i) * (thick + 0.012);
  const per = (p.spread * 1.0) / (n - 1);
  type Built = {i: number; depth: number; el: React.ReactNode; lab: React.ReactNode};
  const built: Built[] = p.parts.map((part, i) => {
    const wd = part.kind === 'glass' || part.kind === 'frame' ? 1.0 : part.kind === 'base' ? 0.98 : 0.9;
    const dd = part.kind === 'glass' || part.kind === 'frame' ? 0.62 : part.kind === 'base' ? 0.6 : 0.52;
    const t = part.kind === 'frame' ? 0.14 : part.kind === 'battery' ? 0.12 : part.kind === 'base' ? 0.12 : part.kind === 'glass' ? 0.05 : 0.07;
    const rr = part.kind === 'board' ? 0.04 : 0.1;
    const o = baseOff(i) * 1.0 + ((n - 1) / 2 - i) * per * E; // along stack (vertical) and diagonal
    const cxw = ev[0] * ((n - 1) / 2 - i) * per * E * 0.0 + 0;
    const bob = Math.sin(frame * 0.085 + i * 1.3) * 0.018 * E;
    const tiltX = Math.sin(i * 1.7) * 0.2 * E;
    const tiltZ = Math.cos(i * 2.3) * 0.17 * E;
    const spin = Math.sin(i * 0.9 + 0.4) * 0.35 * E + (E > 0.5 ? Math.sin((frame - tOpen) * 0.03 + i) * 0.04 : 0);
    const center: V = [ev[0] * ((n - 1) / 2 - i) * per * E * 0.55 + cxw, baseOff(i) + ev[1] * ((n - 1) / 2 - i) * per * E * 0.5 + bob, ev[2] * ((n - 1) / 2 - i) * per * E * 0.55];
    void o;
    const T = (x: number, yy: number, z: number): V => {
      // local rotate: Rz(tiltZ), Rx(tiltX), Ry(spin)
      let X = x;
      let Y = yy;
      let Z = z;
      let t1 = X * Math.cos(tiltZ) - Y * Math.sin(tiltZ);
      Y = X * Math.sin(tiltZ) + Y * Math.cos(tiltZ);
      X = t1;
      t1 = Y * Math.cos(tiltX) - Z * Math.sin(tiltX);
      Z = Y * Math.sin(tiltX) + Z * Math.cos(tiltX);
      Y = t1;
      t1 = X * Math.cos(spin) + Z * Math.sin(spin);
      Z = -X * Math.sin(spin) + Z * Math.cos(spin);
      X = t1;
      return cam(X + center[0], Y + center[1], Z + center[2]);
    };
    const outline = rounded(wd, dd, rr);
    const top = outline.map(([x, z]) => T(x, t / 2, z));
    const bot = outline.map(([x, z]) => T(x, -t / 2, z));
    const area = (pts: V[]) => pts.reduce((s, q, k) => s + (q[0] * pts[(k + 1) % pts.length][1] - pts[(k + 1) % pts.length][0] * q[1]), 0);
    const aTop = area(top);
    const colour = part.color;
    const sides: React.ReactNode[] = [];
    for (let k = 0; k < outline.length; k++) {
      const k2 = (k + 1) % outline.length;
      const quad = [top[k], top[k2], bot[k2], bot[k]];
      const aq = area(quad);
      if (aq * aTop < 0 || Math.abs(aq) < 1e-6) {
        const ang = Math.atan2(outline[k][1] + outline[k2][1], outline[k][0] + outline[k2][0]);
        const lum = 0.5 + 0.5 * Math.cos(ang - yaw * 1.0 + 0.7);
        sides.push(<polygon key={k} points={quad.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ')} fill={mixHex(colour, '#0b0f1c', 0.18 + 0.4 * (1 - lum))} stroke={mixHex(colour, '#0b0f1c', 0.5)} strokeWidth={0.6} />);
      }
    }
    const pg = (pts: V[]) => pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
    const rect = (x0: number, z0: number, x1: number, z1: number): V[] => [T(x0, t / 2 + 0.001, z0), T(x1, t / 2 + 0.001, z0), T(x1, t / 2 + 0.001, z1), T(x0, t / 2 + 0.001, z1)];
    const dec: React.ReactNode[] = [];
    const lit = snapped;
    if (part.kind === 'glass') {
      const q = rect(-wd * 0.46, -dd * 0.44, wd * 0.46, dd * 0.44);
      dec.push(<polygon key="g" points={pg(q)} fill={withAlpha('#ffffff', 0.16)} />);
      const s1 = rect(-wd * 0.3, -dd * 0.5, -wd * 0.18, dd * 0.5);
      dec.push(<polygon key="s" points={pg(s1)} fill={withAlpha('#ffffff', 0.35)} />);
    } else if (part.kind === 'screen') {
      const q = rect(-wd * 0.46, -dd * 0.44, wd * 0.46, dd * 0.44);
      dec.push(<polygon key="s" points={pg(q)} fill={lit ? `url(#${uid}-on)` : '#0A0D16'} />);
      if (lit) {
        [0.2, 0.05, -0.1, -0.25].forEach((zz, k) => dec.push(<polygon key={'r' + k} points={pg(rect(-wd * 0.38, zz * dd - 0.012, -wd * 0.38 + wd * (k === 0 ? 0.5 : 0.7 - k * 0.1), zz * dd + 0.012))} fill={withAlpha('#ffffff', k === 0 ? 0.9 : 0.55)} />));
      } else {
        dec.push(<polygon key="h" points={pg(rect(-wd * 0.46, -dd * 0.44, wd * 0.46, -dd * 0.1))} fill={withAlpha('#ffffff', 0.06)} />);
      }
    } else if (part.kind === 'board') {
      [[-0.25, -0.12, 0.2, 0.22], [0.08, 0.05, 0.16, 0.14], [0.2, -0.16, 0.14, 0.1], [-0.3, 0.12, 0.12, 0.1]].forEach(([x, z, ww, hh], k) =>
        dec.push(<polygon key={'c' + k} points={pg(rect(x * wd - (ww * wd) / 2, z * dd - (hh * dd) / 2, x * wd + (ww * wd) / 2, z * dd + (hh * dd) / 2))} fill={k === 0 ? '#1d1f26' : '#C9A24B'} stroke="#0b0f1c" strokeWidth={0.4} />),
      );
      for (let k = 0; k < 6; k++) dec.push(<polygon key={'t' + k} points={pg(rect(-wd * 0.44, -dd * 0.4 + k * 0.045, wd * 0.44 - k * 0.12, -dd * 0.4 + k * 0.045 + 0.006))} fill={withAlpha('#E6D28A', 0.5)} />);
    } else if (part.kind === 'battery') {
      for (let k = 0; k < 3; k++) dec.push(<polygon key={k} points={pg(rect(-wd * 0.44 + k * wd * 0.3, -dd * 0.4, -wd * 0.44 + k * wd * 0.3 + wd * 0.27, dd * 0.4))} fill={k === 1 ? p.accent : mixHex(colour, '#ffffff', 0.25)} stroke="#0b0f1c" strokeWidth={0.4} />);
    } else if (part.kind === 'frame') {
      const inner = rect(-wd * 0.38, -dd * 0.36, wd * 0.38, dd * 0.36);
      dec.push(<polygon key="i" points={pg(inner)} fill={mixHex(colour, '#0b0f1c', 0.45)} />);
    } else {
      for (let k = 0; k < 4; k++) {
        const x = (k % 2 ? 1 : -1) * wd * 0.36;
        const z = (k < 2 ? 1 : -1) * dd * 0.34;
        dec.push(<polygon key={k} points={pg(rect(x - 0.05, z - 0.05, x + 0.05, z + 0.05))} fill={mixHex(colour, '#000', 0.5)} />);
      }
    }
    const depth = (() => {
      const c = T(0, 0, 0);
      return c[2];
    })();
    // label anchor: right-most projected point
    const rightPt = top.reduce((b, q) => (q[0] > b[0] ? q : b), top[0]);
    const el = (
      <g key={i}>
        {sides}
        <polygon points={pg(top)} fill={mixHex(colour, '#ffffff', 0.08)} stroke={mixHex(colour, '#0b0f1c', 0.45)} strokeWidth={0.8} opacity={part.kind === 'glass' ? 0.82 : 1} />
        {dec}
      </g>
    );
    const lab = (<g key={'l' + i}>
        {p.labels && E > 0.6 && (
          <g opacity={clamp((E - 0.6) / 0.3) * (1 - snap)}>
            <line x1={rightPt[0]} y1={rightPt[1]} x2={rightPt[0] + 54 * u} y2={rightPt[1] - 10 * u} stroke={p.accent} strokeWidth={2 * u} />
            <circle cx={rightPt[0]} cy={rightPt[1]} r={4 * u} fill={p.accent} />
            <text x={rightPt[0] + 62 * u} y={rightPt[1] - 4 * u} fontFamily={s1f.barlow} fontWeight={600} fontSize={22 * u} letterSpacing={2 * u} fill={mixHex(p.background, '#000000', 0.7)}>
              {part.label.toUpperCase()}
            </text>
          </g>
        )}
</g>);
    return {i, depth, el, lab};
  });
  // far -> near: depth is view-space z (larger = nearer to the viewer under this projection)
  built.sort((A, B) => A.depth - B.depth);
  const clickR = 14 * u + since * 6 * u;
  const bgDark = mixHex(p.background, '#000000', 0.06);
  const shadowW = S * 1.05 * (1 - 0.35 * E);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <radialGradient id={`${uid}-bg`} cx="50%" cy="42%" r="75%">
            <stop offset="0" stopColor={mixHex(p.background, '#ffffff', 0.45)} />
            <stop offset="1" stopColor={bgDark} />
          </radialGradient>
          <linearGradient id={`${uid}-on`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6FD6FF" />
            <stop offset="1" stopColor="#3B5BFF" />
          </linearGradient>
          <radialGradient id={`${uid}-sh`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#000" stopOpacity={0.28} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${uid}-fl`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}-bg)`} />
        <ellipse cx={ox + shake} cy={oy + S * 1.05} rx={shadowW} ry={shadowW * 0.34} fill={`url(#${uid}-sh)`} />
        {built.map((b) => b.el)}
        {built.map((b) => b.lab)}
        {since >= 0 && since < 14 && (
          <g transform={`translate(${ox + shake} ${oy + 0.1 * S})`} opacity={1 - since / 14}>
            {[0, 1, 2, 3, 4, 5].map((k) => {
              const ang = (k / 6) * Math.PI * 2 + 0.3;
              return <line key={k} x1={Math.cos(ang) * clickR * 5.5} y1={Math.sin(ang) * clickR * 2.6} x2={Math.cos(ang) * (clickR * 5.5 + 16 * u)} y2={Math.sin(ang) * (clickR * 2.6 + 8 * u)} stroke={p.accent} strokeWidth={3 * u} strokeLinecap="round" />;
            })}
            <ellipse rx={clickR * 5} ry={clickR * 2.4} fill="none" stroke={p.accent} strokeWidth={2.5 * u} />
          </g>
        )}
        {flash > 0 && <ellipse cx={ox} cy={oy} rx={S * 1.6} ry={S * 1.2} fill={`url(#${uid}-fl)`} opacity={flash * 0.7} />}
      </Svg>
    </AbsoluteFill>
  );
};

export const explodedViewSnap = defineMotion<Props>({
  id: 'exploded-view-snap',
  title: 'Exploded view snap',
  category: 'product',
  description:
    'A product\'s parts float apart along one diagonal axis (tilting, spinning, hovering with a slow drift), then all snap back together in a quarter second on a beat with a click cluster, a micro-shake, the screen lighting up and a camera push.',
  source: ['lemo-opuscar styles/glass-product/demo/product.js explode(); DEMO.md motion numbers (MIT, LemoLab)'],
  useFor: 'Modular products, architecture "how it fits together", feature stacks, layered UI explainers - land the snap on a downbeat.',
  durationInFrames: 180,
  defaultProps: {
    parts: [
      {label: 'Cover glass', kind: 'glass', color: '#A9D2F2'},
      {label: 'Display', kind: 'screen', color: '#1B2030'},
      {label: 'Logic board', kind: 'board', color: '#1F7A5A'},
      {label: 'Battery', kind: 'battery', color: '#C7CDD8'},
      {label: 'Frame', kind: 'frame', color: '#D5D9E2'},
      {label: 'Base', kind: 'base', color: '#3A3F4B'},
    ],
    axis: 40,
    spread: 2.1,
    tOpen: 10,
    openFrames: 90,
    hoverFrames: 22,
    snapFrames: 8,
    push: 0.4,
    labels: true,
    accent: '#FF5A36',
    background: '#E6EAF2',
  },
  propDocs: {
    parts: 'ordered top to bottom: {label, kind: glass|screen|board|battery|frame|base, color}',
    axis: 'explode axis angle from vertical in degrees (about 40 gives the diagonal)',
    spread: 'total spread of the stack when open, in product widths (about 2)',
    tOpen: 'frame the opening starts',
    openFrames: 'frames of the ease-out apart (90 = 3 s)',
    hoverFrames: 'frames of hover with +3 % drift (22 = 0.75 s)',
    snapFrames: 'frames of the ease-in snap shut (8 = quarter second) - put its end on the beat',
    push: 'extra camera push after the snap (0.4 = +40 %)',
    labels: 'show leader-line labels while open',
    accent: 'leader / click-burst colour',
    background: 'studio colour',
  },
  component: ExplodedViewSnap,
  tags: ['exploded view', 'product', 'assembly', 'snap', 'parts', 'isometric', 'how it fits together', 'hardware', 'device', 'layers', 'click', 'beat'],
});
