// Adapted from lemo-opuscar/styles/art-deco/demo/scenes/lobby.js floor block (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {GOLD, GoldGradient, hh, mixC} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Art-deco lobby in true one-point perspective: a patterned marble floor (screen row ↔ ground depth
 * z = camY·f/(row − horizon)) slides under a dollying camera, with depth darkening (.55 → .15 → .35),
 * gold pilasters and sconces receding on both walls, warm mirrored glow pools on the floor and a glowing
 * sunburst door at the end of the hall.
 */
type Props = {
  tileA: string;
  tileB: string;
  runner: string;
  wall: string;
  ceiling: string;
  glow: string;
  speed: number;
  camY: number;
  hallWidth: number;
  sway: number;
  endDoor: boolean;
};

const Mode7Floor: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('mode7');
  const cx = w / 2;
  const hy = h * (portrait ? 0.46 : 0.42);
  const f = portrait ? w * 1.15 : w * 0.62;
  const camZ = (p.speed * frame) / 30 + 3 * ease.out(Math.min(1, frame / 60));
  const camX = Math.sin(frame / 55) * p.sway;
  const camY = p.camY;
  const W = p.hallWidth / 2;
  const H = 4.6;
  const zNear = Math.max(0.3, (f * camY) / (h - hy) * 0.98);
  const ENDZ = 52;
  const zFar = Math.min(ENDZ - camZ, 60);
  const P = (X: number, Y: number, Zw: number): [number, number] => {
    const z = Math.max(0.05, Zw - camZ);
    return [cx + (f * (X - camX)) / z, hy + (f * (camY - Y)) / z];
  };
  const pts = (arr: [number, number][]) => arr.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

  // floor tiles
  const tiles: React.ReactNode[] = [];
  const z0 = Math.floor(camZ + zNear);
  const z1 = Math.floor(camZ + zFar);
  for (let zi = z1; zi >= z0; zi--) {
    const za = Math.max(zi, camZ + zNear * 0.98);
    const zb = Math.min(zi + 1, camZ + zFar);
    if (zb <= za) continue;
    for (let xi = -Math.ceil(W); xi < Math.ceil(W); xi++) {
      const xa = Math.max(xi, -W);
      const xb = Math.min(xi + 1, W);
      const inRunner = xi >= -1 && xi < 1;
      const checker = (xi + zi) % 2 === 0;
      const n = hh(xi + 40, zi);
      const c = inRunner ? p.runner : checker ? mixC(p.tileA, '#ffffff', n * 0.12) : mixC(p.tileB, '#3a2e22', n * 0.25);
      tiles.push(<polygon key={`${xi}_${zi}`} points={pts([P(xa, 0, za), P(xb, 0, za), P(xb, 0, zb), P(xa, 0, zb)])} fill={c} />);
      // marble vein on light tiles
      if (!inRunner && checker && n > 0.45) {
        const [ax, ay] = P(xa + 0.15, 0, za + 0.2 + n * 0.4);
        const [bx, by] = P(xb - 0.2, 0, za + 0.75);
        tiles.push(<line key={`v${xi}_${zi}`} x1={ax} y1={ay} x2={bx} y2={by} stroke="#b8a888" strokeWidth={Math.max(0.5, (f * 0.012) / (za - camZ + 0.5))} opacity={0.5} />);
      }
    }
  }
  // gold runner edges + grout lines
  const runnerEdges = [-1, 1].map((x) => {
    const [ax, ay] = P(x, 0, camZ + zNear);
    const [bx, by] = P(x, 0, camZ + zFar);
    return <line key={x} x1={ax} y1={ay} x2={bx} y2={by} stroke={`url(#${id}-gu)`} strokeWidth={Math.max(1, 6 * u)} />;
  });
  // pilasters + sconces every 4 units
  const pil: React.ReactNode[] = [];
  const glowPools: React.ReactNode[] = [];
  for (let k = Math.floor((camZ + zNear) / 4); k * 4 < camZ + zFar; k++) {
    const Zp = k * 4 + 2;
    if (Zp - camZ < zNear * 0.5) continue;
    [-1, 1].forEach((sd) => {
      const X = sd * W;
      const a = P(X, 0, Zp - 0.3);
      const b = P(X, 0, Zp + 0.3);
      const at = P(X, H, Zp - 0.3);
      const bt = P(X, H, Zp + 0.3);
      pil.push(<polygon key={`p${k}${sd}`} points={pts([a, b, bt, at])} fill={`url(#${id}-gold)`} opacity={0.95} />);
      // sconce between pilasters
      const Zs = Zp + 2;
      const [sx, sy] = P(X, 2.7, Zs);
      const zr = Zs - camZ;
      const r = (f * 0.35) / Math.max(0.5, zr);
      pil.push(<circle key={`s${k}${sd}`} cx={sx} cy={sy} r={r * 2.2} fill={`url(#${id}-glow)`} style={{mixBlendMode: 'screen'}} />);
      pil.push(<path key={`f${k}${sd}`} d={`M${sx - r * 0.5} ${sy + r * 0.3} L${sx} ${sy - r * 0.6} L${sx + r * 0.5} ${sy + r * 0.3} Z`} fill={GOLD.light} />);
      // mirrored warm pool on the polished floor
      const [rx, ry] = P(X * 0.82, 0, Zs);
      glowPools.push(<ellipse key={`g${k}${sd}`} cx={rx} cy={ry + r * 0.8} rx={r * 0.9} ry={r * 3.2} fill={`url(#${id}-glow)`} opacity={0.75} style={{mixBlendMode: 'screen'}} />);
    });
  }
  // walls + ceiling
  const near = camZ + zNear * 0.3;
  const far = camZ + zFar;
  const wallL = pts([P(-W, 0, near), P(-W, 0, far), P(-W, H, far), P(-W, H, near)]);
  const wallR = pts([P(W, 0, near), P(W, 0, far), P(W, H, far), P(W, H, near)]);
  const ceil = pts([P(-W, H, near), P(W, H, near), P(W, H, far), P(-W, H, far)]);
  const [ex0, ey0] = P(-W, H, far);
  const [ex1, ey1] = P(W, 0, far);
  const endW = ex1 - ex0;
  const endH = ey1 - ey0;
  const doorCx = (ex0 + ex1) / 2;
  const intro = prog(frame, 0, 24, ease.out);

  return (
    <AbsoluteFill style={{background: '#060504'}}>
      <Svg>
        <defs>
          <GoldGradient id={`${id}-gold`} sheen={0.35 + 0.3 * Math.sin(frame / 40)} x1={0} y1={0} x2={0} y2={1} />
          <GoldGradient id={`${id}-gu`} sheen={0.5} x1={0} y1={hy} x2={0} y2={h} units="userSpaceOnUse" />
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" stopColor={p.glow} stopOpacity={0.8} />
            <stop offset="0.35" stopColor={p.glow} stopOpacity={0.25} />
            <stop offset="1" stopColor={p.glow} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}-depth`} x1="0" y1={hy} x2="0" y2={h} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#000" stopOpacity={0.55} />
            <stop offset="0.45" stopColor="#000" stopOpacity={0.15} />
            <stop offset="1" stopColor="#000" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixC(p.wall, '#000', 0.5)} />
            <stop offset="0.6" stopColor={p.wall} />
            <stop offset="1" stopColor={mixC(p.wall, '#000', 0.3)} />
          </linearGradient>
          <radialGradient id={`${id}-fog`} cx={doorCx} cy={hy} r={Math.max(endW, endH) * 3} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={p.glow} stopOpacity={0.35} />
            <stop offset="1" stopColor={p.glow} stopOpacity={0} />
          </radialGradient>
        </defs>
        <polygon points={ceil} fill={p.ceiling} />
        <polygon points={wallL} fill={`url(#${id}-wall)`} />
        <polygon points={wallR} fill={`url(#${id}-wall)`} />
        {/* end wall with sunburst door */}
        <rect x={ex0} y={ey0} width={endW} height={endH} fill={mixC(p.wall, '#000', 0.25)} />
        {p.endDoor && (
          <g>
            {Array.from({length: 13}, (_, i) => {
              const a = Math.PI + (i / 12) * Math.PI;
              const dy = ey1 - endH * 0.62;
              return <line key={i} x1={doorCx} y1={dy} x2={doorCx + Math.cos(a) * endW * 0.3} y2={dy + Math.sin(a) * endW * 0.3} stroke={GOLD.base} strokeWidth={Math.max(0.6, endW * 0.006)} />;
            })}
            <rect x={doorCx - endW * 0.16} y={ey1 - endH * 0.62} width={endW * 0.32} height={endH * 0.62} fill={p.glow} opacity={0.85} />
            <line x1={doorCx} y1={ey1 - endH * 0.62} x2={doorCx} y2={ey1} stroke={GOLD.shadow} strokeWidth={Math.max(0.8, endW * 0.008)} />
            <rect x={doorCx - endW * 0.16} y={ey1 - endH * 0.62} width={endW * 0.32} height={endH * 0.62} fill="none" stroke={GOLD.base} strokeWidth={Math.max(0.8, endW * 0.01)} />
          </g>
        )}
        {tiles}
        {runnerEdges}
        <rect x={0} y={hy} width={w} height={h - hy} fill={`url(#${id}-depth)`} />
        {glowPools}
        {/* door reflection streak */}
        {p.endDoor && <ellipse cx={doorCx} cy={ey1 + endH * 0.9} rx={endW * 0.12} ry={endH * 1.4} fill={`url(#${id}-glow)`} opacity={0.6} style={{mixBlendMode: 'screen'}} />}
        {pil}
        <rect width={w} height={h} fill={`url(#${id}-fog)`} style={{mixBlendMode: 'screen'}} />
        <rect width={w} height={h} fill="#000" opacity={1 - intro} />
      </Svg>
    </AbsoluteFill>
  );
};

export const mode7FloorPerspective = defineMotion<Props>({
  id: 'mode7-floor-perspective',
  title: 'Mode-7 lobby floor',
  category: 'environment',
  description:
    'An art-deco lobby in true one-point perspective: a checkered marble floor with a burgundy runner slides under a dollying camera, with depth darkening, gold pilasters and glowing sconces receding on both walls, warm mirrored glow pools and a sunburst door at the end of the hall.',
  source: ['lemo-opuscar styles/art-deco demo/scenes/lobby.js mode-7 floor (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §2 mode7-floor-perspective'],
  useFor: 'Instant lobby / stage / hallway depth behind titles or characters: hotels, galas, luxury, theatre, "walk into the event" openers.',
  durationInFrames: 180,
  defaultProps: {
    tileA: '#e8dcc4',
    tileB: '#15110c',
    runner: '#5c1420',
    wall: '#1D3B33',
    ceiling: '#0b0907',
    glow: '#ffc45c',
    speed: 2.4,
    camY: 1.6,
    hallWidth: 9,
    sway: 0.35,
    endDoor: true,
  },
  propDocs: {
    tileA: 'light marble tile colour',
    tileB: 'dark marble tile colour',
    runner: 'centre runner colour (gold-edged)',
    wall: 'wall colour (deep emerald by default)',
    ceiling: 'ceiling colour',
    glow: 'sconce / door / reflection glow colour',
    speed: 'dolly speed in tiles per second',
    camY: 'camera eye height in tiles (lower = more floor drama)',
    hallWidth: 'hall width in tiles',
    sway: 'gentle lateral camera sway in tiles',
    endDoor: 'show the glowing sunburst door at the end of the hall',
  },
  component: Mode7Floor,
  tags: ['mode 7', 'perspective', 'floor', 'marble', 'lobby', 'hallway', 'art deco', 'dolly', 'hotel', 'stage', 'luxury', 'background', 'backdrop', 'one-point perspective', 'gold', 'environment'],
});
