import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {BlurFilter, TAU, areaK, hash01, isTransparent, rgba, wrap} from '../../core/environment-kit';
import {n2} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Caustics + god-rays (video23 surface-caustics-godrays, video2 caustic-water-texture,
 * video14 light-shaft-dust).
 * underwater: a rippling bright caustic web across the top ~40 % (surface seen from below, in
 *   perspective), 6-10 long skinny light shafts fanning down from above-left, each swaying ±1.5°
 *   with sin(t·0.3 + i) opacity, screen-blended, plus drifting marine-snow motes.
 * pool: full-frame turquoise (#6d9e9a) caustic cells with bright #cfeff0 web lines scrolling
 *   diagonally (~2 % W/s); opens on a wire grid that switches to caustics in 3 frames.
 * beam: chiaroscuro window shaft — a diagonal trapezoid rgba(255,220,150,.35) -> 0 (screen) with
 *   dust motes drifting along it and a gentle 7 Hz + 11 Hz flicker.
 * The caustic web is a moving Voronoi diagram: each cell is inset and corner-rounded, then
 * subtracted (mask) from a bright layer, so only the web of lines remains.
 */
type Props = {
  mode: 'underwater' | 'pool' | 'beam';
  background: string;
  backdrop: boolean;
  lineColor: string;
  rayColor: string;
  rayCount: number;
  causticScale: number;
  speed: number;
  motes: number;
  fadeDepth: number;
  intro: boolean;
  seed: number;
};

type P = [number, number];

const clipHalf = (poly: P[], nx: number, ny: number, c: number): P[] => {
  const out: P[] = [];
  for (let k = 0; k < poly.length; k++) {
    const a = poly[k];
    const b = poly[(k + 1) % poly.length];
    const da = a[0] * nx + a[1] * ny - c;
    const db = b[0] * nx + b[1] * ny - c;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const s = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]);
    }
  }
  return out;
};

/** rounded, inset Voronoi cells of moving sites inside [0,W]x[0,H] */
const causticCells = (W: number, H: number, cell: number, t: number, seed: number, scroll: P, insetK: number) => {
  const cols = Math.ceil(W / cell) + 2;
  const rows = Math.ceil(H / cell) + 2;
  const sites: P[] = [];
  const DW = cols * cell;
  const DH = rows * cell;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const jx = (hash01(seed, i, 1) - 0.5) * 0.8 + 0.55 * n2('cx' + seed, i * 0.71, t * 0.35);
      const jy = (hash01(seed, i, 2) - 0.5) * 0.8 + 0.55 * n2('cy' + seed, i * 0.71, t * 0.35);
      const x = wrap((c + 0.5 + jx) * cell + scroll[0] * t, DW) - cell;
      const y = wrap((r + 0.5 + jy) * cell + scroll[1] * t, DH) - cell;
      sites.push([x, y]);
    }
  const R2 = (cell * 2.6) ** 2;
  const paths: string[] = [];
  sites.forEach((s, i) => {
    if (s[0] < -cell * 0.8 || s[0] > W + cell * 0.8 || s[1] < -cell * 0.8 || s[1] > H + cell * 0.8) return;
    let poly: P[] = [
      [s[0] - cell * 3, s[1] - cell * 3],
      [s[0] + cell * 3, s[1] - cell * 3],
      [s[0] + cell * 3, s[1] + cell * 3],
      [s[0] - cell * 3, s[1] + cell * 3],
    ];
    for (let j = 0; j < sites.length; j++) {
      if (j === i) continue;
      const o = sites[j];
      const dx = o[0] - s[0];
      const dy = o[1] - s[1];
      if (dx * dx + dy * dy > R2) continue;
      poly = clipHalf(poly, dx, dy, dx * (s[0] + o[0]) * 0.5 + dy * (s[1] + o[1]) * 0.5);
      if (poly.length < 3) return;
    }
    let cx = 0;
    let cy = 0;
    poly.forEach((p) => {
      cx += p[0];
      cy += p[1];
    });
    cx /= poly.length;
    cy /= poly.length;
    const d = cell * insetK * (0.55 + 0.9 * (0.5 + 0.5 * n2('ci' + seed, i * 0.37, t * 0.6)));
    const ins = poly.map(([x, y]) => {
      const dx = x - cx;
      const dy = y - cy;
      const L = Math.hypot(dx, dy) || 1;
      const k = Math.max(0, 1 - d / L);
      return [cx + dx * k, cy + dy * k] as P;
    });
    const n = ins.length;
    const mid = (a: P, b: P) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(ins[0], ins[1]);
    let path = `M${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
    for (let k = 1; k <= n; k++) {
      const v = ins[k % n];
      const m = mid(v, ins[(k + 1) % n]);
      path += `Q${v[0].toFixed(1)} ${v[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
    }
    paths.push(path + 'Z');
  });
  return paths.join('');
};

/** bright web layer: a coloured rect masked by (white - rounded cells) */
const CausticWeb: React.FC<{
  id: string;
  W: number;
  H: number;
  cell: number;
  t: number;
  seed: number;
  scroll: P;
  inset: number;
  color: string;
  blur: number;
  transform?: string;
  opacity?: number;
}> = ({id, W, H, cell, t, seed, scroll, inset, color, blur, transform, opacity = 1}) => {
  const d = causticCells(W, H, cell, t, seed, scroll, inset);
  return (
    <g transform={transform} opacity={opacity}>
      <defs>
        <BlurFilter id={`${id}-b`} std={blur} />
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-W} y={-H} width={W * 3} height={H * 3}>
          <rect x={-cell} y={-cell} width={W + 2 * cell} height={H + 2 * cell} fill="#fff" />
          <path d={d} fill="#000" filter={`url(#${id}-b)`} />
        </mask>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={color} mask={`url(#${id}-m)`} />
    </g>
  );
};

const Motes: React.FC<{n: number; t: number; seed: number; color: string; area: [number, number, number, number]; rise: number; size: number; inside?: (x: number, y: number) => number}> = ({n, t, seed, color, area, rise, size, inside}) => {
  const {u} = useStage();
  const out: React.ReactNode[] = [];
  const [x0, y0, x1, y1] = area;
  for (let i = 0; i < n; i++) {
    const layer = i % 3;
    const k = [0.6, 1, 1.4][layer];
    const sw = y1 - y0;
    const y = wrap(hash01(seed, i, 2) * sw - rise * u * k * t, sw) + y0;
    const x = x0 + wrap(hash01(seed, i, 1) * (x1 - x0) + 6 * u * Math.sin(t * 0.5 + i) + 8 * u * k * t, x1 - x0);
    const r = (0.6 + layer * 0.8) * u * size * (0.7 + 0.6 * hash01(seed, i, 3));
    const lit = inside ? inside(x, y) : 1;
    const o = (0.2 + 0.4 * hash01(seed, i, 4)) * (0.75 + 0.25 * Math.sin(t * 2 + i)) * lit;
    if (o < 0.02) continue;
    out.push(<circle key={i} cx={x} cy={y} r={r} fill={color} opacity={o} />);
  }
  return <g>{out}</g>;
};

const CausticsGodrays: React.FC<Props> = ({mode, background, backdrop, lineColor, rayColor: rayColorProp, rayCount, causticScale, speed, motes, fadeDepth, intro, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx} = useStage();
  const t = (frame / fps) * speed;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const K = areaK(w, h);
  const rayColor = rayColorProp || (mode === 'beam' ? '#FFDC96' : '#E6FBFF');

  if (mode === 'pool') {
    const cell = 120 * u * causticScale;
    const scroll: P = [0.02 * w * 1.4, 0.012 * w * 1.4];
    const on = intro ? prog(frame, 12, 15, ease.linear) : 1;
    const grid = intro ? 1 - on : 0;
    const g = 64 * u;
    let gd = '';
    for (let x = -g; x < w + g; x += g) gd += `M${(x + (frame * 0.6 * u) % g).toFixed(1)} 0V${h}`;
    for (let y = -g; y < h + g; y += g) gd += `M0 ${(y + (frame * 0.4 * u) % g).toFixed(1)}H${w}`;
    return (
      <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
        <Svg>
          <defs>
            <radialGradient id="cg-pool" cx="0.35" cy="0.3" r="0.9">
              <stop offset="0" stopColor="#7DB3AE" />
              <stop offset="0.6" stopColor="#5F9692" />
              <stop offset="1" stopColor="#3F716F" />
            </radialGradient>
            <BlurFilter id="cg-poolglow" std={6 * u} />
          </defs>
          {scene && <rect width={w} height={h} fill="url(#cg-pool)" />}
          {scene &&
            [0, 1, 2].map((k) => (
              <ellipse key={k} cx={wrap(w * (0.2 + 0.35 * k) + t * 30 * u, w * 1.3) - w * 0.15} cy={h * (0.3 + 0.25 * k)} rx={w * 0.25} ry={h * 0.18} fill="#2F5E5C" opacity={0.18} filter="url(#cg-poolglow)" />
            ))}
          <g opacity={on}>
            <CausticWeb id="cg-p2" W={w} H={h} cell={cell * 0.55} t={t * 1.3 + 7} seed={seed + 9} scroll={[scroll[0] * 1.3, -scroll[1] * 0.6]} inset={0.1} color={lineColor} blur={1.5 * u} opacity={0.35} />
            <g filter="url(#cg-poolglow)" opacity={0.6}>
              <CausticWeb id="cg-pg" W={w} H={h} cell={cell} t={t} seed={seed} scroll={scroll} inset={0.055} color={lineColor} blur={2 * u} />
            </g>
            <CausticWeb id="cg-p1" W={w} H={h} cell={cell} t={t} seed={seed} scroll={scroll} inset={0.055} color={lineColor} blur={2 * u} />
          </g>
          {grid > 0 && <path d={gd} stroke={lineColor} strokeWidth={1.5 * u} opacity={0.8 * grid} />}
        </Svg>
      </AbsoluteFill>
    );
  }

  if (mode === 'beam') {
    const flick = 1 + 0.05 * Math.sin(TAU * 7 * t) + 0.03 * Math.sin(TAU * 11 * t) + 0.03 * n2('bf' + seed, t * 4, 0);
    const wx = w * 0.12;
    const wy = h * 0.1;
    const ww = Math.min(w, h) * 0.26;
    const wh = Math.min(w, h) * 0.34;
    const dx = w * 0.5;
    const dy = h * 0.72;
    const beam: P[] = [
      [wx, wy],
      [wx + ww, wy],
      [wx + ww + dx, wy + wh + dy],
      [wx + dx, wy + wh + dy],
    ];
    const beamPts = beam.map((p) => p.join(',')).join(' ');
    // point-in-beam weight (parallelogram coordinates)
    const inside = (x: number, y: number) => {
      const s = (y - wy) / (wh + dy);
      if (s < 0 || s > 1) return 0.15;
      const left = wx + dx * s;
      const f = (x - left) / ww;
      return f < 0 || f > 1 ? 0.15 : 1;
    };
    return (
      <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
        <Svg>
          <defs>
            <linearGradient id="cg-beam" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0" stopColor={rayColor} stopOpacity={0.42} />
              <stop offset="1" stopColor={rayColor} stopOpacity={0} />
            </linearGradient>
            <radialGradient id="cg-room" cx="0.6" cy="0.75" r="0.9">
              <stop offset="0" stopColor="#3A2818" />
              <stop offset="0.7" stopColor="#1B120B" />
              <stop offset="1" stopColor="#0C0805" />
            </radialGradient>
            <BlurFilter id="cg-bb" std={14 * u} />
            <BlurFilter id="cg-bw" std={3 * u} />
          </defs>
          {scene && (
            <g>
              <rect width={w} height={h} fill="url(#cg-room)" />
              <rect y={h * 0.8} width={w} height={h * 0.2} fill="#120C07" opacity={0.6} />
              <rect x={wx - 10 * u} y={wy - 10 * u} width={ww + 20 * u} height={wh + 20 * u} fill="#070403" />
              <rect x={wx} y={wy} width={ww} height={wh} fill="#FFF0CF" opacity={0.95} />
              <path d={`M ${wx + ww / 2} ${wy} V ${wy + wh} M ${wx} ${wy + wh / 2} H ${wx + ww}`} stroke="#070403" strokeWidth={8 * u} />
            </g>
          )}
          <polygon points={beamPts} fill="url(#cg-beam)" filter="url(#cg-bb)" opacity={flick} style={{mixBlendMode: 'screen'}} />
          <Motes n={Math.round(140 * K * motes)} t={t} seed={seed} color="#FFE6B4" area={[0, 0, w, h]} rise={-8} size={2.4} inside={inside} />
        </Svg>
      </AbsoluteFill>
    );
  }

  // underwater
  const bandH = h * fadeDepth;
  const cell = 110 * u * causticScale;
  const ox = cx - w * 0.12;
  const oy = -h * 0.28;
  const rays: React.ReactNode[] = [];
  const nR = Math.max(1, Math.round(rayCount));
  for (let i = 0; i < nR; i++) {
    const base = -32 + (64 * (i + 0.5)) / nR + (hash01(seed, i, 1) - 0.5) * 6;
    const ang = ((base + 1.5 * Math.sin(t * 0.3 + i * 1.7)) * Math.PI) / 180;
    const L = h * 1.45;
    const half = L * Math.tan(((0.9 + 1.8 * hash01(seed, i, 2)) * Math.PI) / 180);
    const ex = ox + Math.sin(ang) * L;
    const ey = oy + Math.cos(ang) * L;
    const px = Math.cos(ang);
    const py = -Math.sin(ang);
    const o = (0.05 + 0.1 * hash01(seed, i, 3)) * (0.6 + 0.4 * Math.sin(t * 0.3 * 2 + i * 2.3)) * 2.2;
    rays.push(<polygon key={i} points={`${ox - px * 4 * u},${oy - py * 4 * u} ${ox + px * 4 * u},${oy + py * 4 * u} ${ex + px * half},${ey + py * half} ${ex - px * half},${ey - py * half}`} fill="url(#cg-ray)" opacity={o} />);
  }
  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      <Svg>
        <defs>
          <linearGradient id="cg-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5CC6DC" />
            <stop offset="0.3" stopColor="#2A93B8" />
            <stop offset="0.65" stopColor="#11577E" />
            <stop offset="1" stopColor="#062843" />
          </linearGradient>
          <linearGradient id="cg-ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={rayColor} stopOpacity={1} />
            <stop offset="0.7" stopColor={rayColor} stopOpacity={0.35} />
            <stop offset="1" stopColor={rayColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cg-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.4" stopColor="#fff" stopOpacity={0.6} />
            <stop offset="0.85" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="cg-fadem" maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect width={w} height={bandH} fill="url(#cg-fade)" />
          </mask>
          <linearGradient id="cg-surf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D8F7FB" stopOpacity={0.55} />
            <stop offset="1" stopColor="#D8F7FB" stopOpacity={0} />
          </linearGradient>
          <BlurFilter id="cg-rb" std={8 * u} />
          <BlurFilter id="cg-glow" std={5 * u} />
        </defs>
        {scene && (
          <g>
            <rect width={w} height={h} fill="url(#cg-sea)" />
            <rect width={w} height={bandH * 0.7} fill="url(#cg-surf)" />
            <path d={`M 0 ${h} L 0 ${h * 0.9} Q ${w * 0.25} ${h * 0.84} ${w * 0.5} ${h * 0.9} T ${w} ${h * 0.88} L ${w} ${h} Z`} fill="#04203A" opacity={0.6} />
          </g>
        )}
        <g mask="url(#cg-fadem)">
          <g filter="url(#cg-glow)" opacity={0.7}>
            <CausticWeb id="cg-ug" W={w * 1.3} H={bandH * 2.5} cell={cell} t={t} seed={seed} scroll={[24 * u, 10 * u]} inset={0.045} color={lineColor} blur={2 * u} transform={`translate(${-w * 0.15} 0) scale(1 0.45)`} />
          </g>
          <CausticWeb id="cg-u1" W={w * 1.3} H={bandH * 2.5} cell={cell} t={t} seed={seed} scroll={[24 * u, 10 * u]} inset={0.045} color={lineColor} blur={1.3 * u} transform={`translate(${-w * 0.15} 0) scale(1 0.45)`} />
          <CausticWeb id="cg-u2" W={w * 1.3} H={bandH * 2.5} cell={cell * 0.6} t={t * 1.4 + 3} seed={seed + 5} scroll={[-18 * u, 6 * u]} inset={0.08} color={lineColor} blur={1.2 * u} transform={`translate(${-w * 0.15} 0) scale(1 0.45)`} opacity={0.4} />
        </g>
        <g filter="url(#cg-rb)" style={{mixBlendMode: 'screen'}}>
          {rays}
        </g>
        <Motes n={Math.round(220 * K * motes)} t={t} seed={seed} color="#B8DCE6" area={[0, 0, w, h]} rise={6} size={1.2} />
      </Svg>
    </AbsoluteFill>
  );
};

export const causticsGodrays = defineMotion<Props>({
  id: 'caustics-godrays',
  title: 'Caustics & god-rays',
  category: 'environment',
  description: 'Underwater: a rippling caustic web at the surface, swaying light shafts and drifting motes; "pool" = full-frame scrolling caustic texture; "beam" = warm window light shaft with dust. Overlay-capable.',
  source: ['video23 0.0-14.0', 'video2 14.17-15.25', 'video14 era ambience (light-shaft-dust)'],
  useFor: 'Ocean / underwater openers, pool or summer textures, quiet interiors with a single light shaft; layer over footage as light.',
  durationInFrames: 180,
  defaultProps: {
    mode: 'underwater',
    background: '#11577E',
    backdrop: true,
    lineColor: '#CFF3F8',
    rayColor: '',
    rayCount: 8,
    causticScale: 1,
    speed: 1,
    motes: 1,
    fadeDepth: 0.42,
    intro: true,
    seed: 1,
  },
  propDocs: {
    mode: '"underwater" (surface web + god-rays), "pool" (full-frame caustic texture), "beam" (window light shaft + dust)',
    background: 'CSS background; "transparent" = overlay (only light elements are drawn)',
    backdrop: 'paint the procedural water / room',
    lineColor: 'caustic web line colour (pool source: #cfeff0)',
    rayColor: 'light shaft colour; empty = #E6FBFF underwater, #FFDC96 beam',
    rayCount: 'number of god-rays (underwater)',
    causticScale: 'caustic cell size multiplier',
    speed: 'animation speed multiplier',
    motes: 'dust / marine-snow density multiplier',
    fadeDepth: 'fraction of height the surface caustics reach before fading (underwater)',
    intro: 'pool mode: open on a wire grid that switches to caustics in 3 frames',
    seed: 'random seed',
  },
  component: CausticsGodrays,
  tags: ['water', 'underwater', 'light', 'caustics', 'godrays', 'overlay', 'ambience', 'texture'],
});
