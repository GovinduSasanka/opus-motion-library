import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {HATCH3, X3Blur, X3Hatch, X3PageGround, X3Sun, ellPath, makeProj, polyPath, shadowHull, x14Fonts, type X3Proj} from '../../core/r2-x14-kit';

/**
 * x3 "render pass" reveal: everyday objects stand on a book page as bare black ink line drawings (they draw on
 * first). An ink sun icon switches on (circle draws, 12 rays pop) and the shading arrives within a few tenths of a
 * second: white clay fills, pen cross-hatching on the shadow sides, and soft cast shadows toward the lower right.
 * The light then drifts slowly so the shadows swing a little while the camera yaws — sketch → finished look.
 */

type Kind = 'block' | 'spring' | 'mug' | 'battery' | 'balloon' | 'ball' | 'jar';
type Props = {
  objects: Kind[];
  drawFrames: number;
  sunAt: number;
  shadeAt: number;
  shadeFrames: number;
  hatchSpacing: number;
  hatchAngle: number;
  lightAngle: number;
  lightDrift: number;
  shadowOpacity: number;
  sunIcon: boolean;
  caption: string;
  paper: string;
  ink: string;
  clay: string;
  yaw: number;
  pitch: number;
};

const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

type Ctx = {
  pr: X3Proj;
  u: number;
  ink: string;
  clay: string;
  m: number; // shade mix
  sh: number; // shadow mix
  ld: number; // line draw 0..1
  lx: number;
  lz: number;
  shOp: number;
  id: string;
  frame: number;
};

const shade = (clay: string) => ({lit: '#FDFCFA', mid: clay, dark: '#C4C0B8'});

/** vertical cylinder (axis y) with optional open top */
const cylinder = (c: Ctx, key: string, x: number, z: number, r: number, y0: number, y1: number, opts: {open?: boolean; inner?: string} = {}) => {
  const {pr, u, ink, m, ld} = c;
  const [bx, by] = pr.P(x, y0, z);
  const [tx, ty] = pr.P(x, y1, z);
  const rx = r * pr.s;
  const ry = r * pr.s * pr.sinPhi;
  const sil = `M${tx - rx},${ty} L${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${tx + rx},${ty} A${rx},${ry} 0 0 0 ${tx - rx},${ty} Z`;
  const cid = `${c.id}-${key}`;
  const dash = ld < 1 ? {pathLength: 1, strokeDasharray: `${ld} 1`} : {};
  const S = shade(c.clay);
  const top = Math.min(ty, by) - ry;
  const hgt = Math.abs(by - ty) + 2 * ry;
  return (
    <g key={key}>
      <defs>
        <clipPath id={`${cid}-c`}>
          <path d={sil} />
        </clipPath>
        <linearGradient id={`${cid}-r1`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.85" stopColor="#fff" stopOpacity={1} />
        </linearGradient>
        <linearGradient id={`${cid}-r2`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.72" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.98" stopColor="#fff" stopOpacity={1} />
        </linearGradient>
        <mask id={`${cid}-m1`} maskUnits="userSpaceOnUse" x={tx - rx - 2} y={top - 2} width={rx * 2 + 4} height={hgt + 4}>
          <rect x={tx - rx} y={top} width={rx * 2} height={hgt} fill={`url(#${cid}-r1)`} />
        </mask>
        <mask id={`${cid}-m2`} maskUnits="userSpaceOnUse" x={tx - rx - 2} y={top - 2} width={rx * 2 + 4} height={hgt + 4}>
          <rect x={tx - rx} y={top} width={rx * 2} height={hgt} fill={`url(#${cid}-r2)`} />
        </mask>
        <linearGradient id={`${cid}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={S.mid} />
          <stop offset="22%" stopColor={S.lit} />
          <stop offset="58%" stopColor={S.mid} />
          <stop offset="100%" stopColor={S.dark} />
        </linearGradient>
      </defs>
      <g opacity={m}>
        <path d={sil} fill={`url(#${cid}-g)`} />
        <g clipPath={`url(#${cid}-c)`}>
          <rect x={tx - rx} y={top} width={rx * 2} height={hgt} fill={`url(#${c.id}-hv)`} mask={`url(#${cid}-m1)`} />
          <rect x={tx - rx} y={top} width={rx * 2} height={hgt} fill={`url(#${c.id}-hx)`} mask={`url(#${cid}-m2)`} />
        </g>
        <path d={ellPath(tx, ty, rx, ry)} fill={opts.open ? opts.inner ?? '#D8D3CB' : S.lit} />
        {opts.open ? (
          <g>
            <clipPath id={`${cid}-t`}>
              <path d={ellPath(tx, ty, rx * 0.92, ry * 0.92)} />
            </clipPath>
            <rect x={tx - rx} y={ty - ry} width={rx * 0.9} height={ry * 2} fill={`url(#${c.id}-hv)`} clipPath={`url(#${cid}-t)`} opacity={0.7} />
          </g>
        ) : null}
      </g>
      <path d={`M${tx - rx},${ty} L${bx - rx},${by} M${tx + rx},${ty} L${bx + rx},${by}`} stroke={ink} strokeWidth={1.6 * u} fill="none" {...dash} />
      <path d={ellPath(bx, by, rx, ry, 'front')} stroke={ink} strokeWidth={1.6 * u} fill="none" {...dash} />
      <path d={ellPath(tx, ty, rx, ry)} stroke={ink} strokeWidth={1.6 * u} fill="none" {...dash} />
      {opts.open ? <path d={ellPath(tx, ty, rx * 0.9, ry * 0.88)} stroke={ink} strokeWidth={1.1 * u} fill="none" opacity={0.7} {...dash} /> : null}
    </g>
  );
};

/** axis-aligned box; visible faces: top, front (+z), +x side */
const box = (c: Ctx, key: string, x: number, z: number, wx: number, hy: number, dz: number, y0 = 0) => {
  const {pr, u, ink, m, ld} = c;
  const x0 = x - wx / 2;
  const x1 = x + wx / 2;
  const z0 = z - dz / 2;
  const z1 = z + dz / 2;
  const y1 = y0 + hy;
  const q = (pts: [number, number, number][]) => polyPath(pts.map((p) => pr.P(...p)));
  const top = q([
    [x0, y1, z0],
    [x1, y1, z0],
    [x1, y1, z1],
    [x0, y1, z1],
  ]);
  const front = q([
    [x0, y1, z1],
    [x1, y1, z1],
    [x1, y0, z1],
    [x0, y0, z1],
  ]);
  const side = q([
    [x1, y1, z1],
    [x1, y1, z0],
    [x1, y0, z0],
    [x1, y0, z1],
  ]);
  const S = shade(c.clay);
  const dash = ld < 1 ? {pathLength: 1, strokeDasharray: `${ld} 1`} : {};
  return (
    <g key={key}>
      <g opacity={m}>
        <path d={top} fill={S.lit} />
        <path d={front} fill={S.mid} />
        <path d={front} fill={`url(#${c.id}-hs)`} opacity={0.5} />
        <path d={side} fill={S.dark} />
        <path d={side} fill={`url(#${c.id}-hv)`} />
        <path d={side} fill={`url(#${c.id}-hx)`} />
      </g>
      {[top, front, side].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={ink} strokeWidth={1.6 * u} strokeLinejoin="round" {...dash} />
      ))}
    </g>
  );
};

const sphere = (c: Ctx, key: string, x: number, y: number, z: number, rx0: number, ry0: number) => {
  const {pr, u, ink, m, ld} = c;
  const [sx, sy] = pr.P(x, y, z);
  const rx = rx0 * pr.s;
  const ry = ry0 * pr.s;
  const cid = `${c.id}-${key}`;
  const S = shade(c.clay);
  const dash = ld < 1 ? {pathLength: 1, strokeDasharray: `${ld} 1`} : {};
  return (
    <g key={key}>
      <defs>
        <radialGradient id={`${cid}-g`} cx="34%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor={S.mid} />
          <stop offset="100%" stopColor={S.dark} />
        </radialGradient>
        <clipPath id={`${cid}-c`}>
          <ellipse cx={sx} cy={sy} rx={rx} ry={ry} />
        </clipPath>
        <clipPath id={`${cid}-k`}>
          <ellipse cx={sx + rx * 0.55} cy={sy + ry * 0.45} rx={rx * 1.05} ry={ry * 1.05} />
        </clipPath>
      </defs>
      <g opacity={m}>
        <ellipse cx={sx} cy={sy} rx={rx} ry={ry} fill={`url(#${cid}-g)`} />
        <g clipPath={`url(#${cid}-c)`}>
          <rect x={sx - rx} y={sy - ry} width={rx * 2} height={ry * 2} fill={`url(#${c.id}-hb)`} clipPath={`url(#${cid}-k)`} />
        </g>
      </g>
      <path d={ellPath(sx, sy, rx, ry)} fill="none" stroke={ink} strokeWidth={1.6 * u} {...dash} />
    </g>
  );
};

type Built = {depth: number; shadow: [number, number, number][]; el: React.ReactNode; pr?: X3Proj; row?: number};

const circlePts = (x: number, y: number, z: number, r: number, n = 18): [number, number, number][] =>
  Array.from({length: n}, (_, k) => [x + Math.cos((k / n) * Math.PI * 2) * r, y, z + Math.sin((k / n) * Math.PI * 2) * r]);

const buildObject = (c: Ctx, kind: Kind, i: number, x: number, z: number): Built => {
  const {pr, u, ink, ld} = c;
  const dash = ld < 1 ? {pathLength: 1, strokeDasharray: `${ld} 1`} : {};
  const key = `o${i}`;
  const depth = pr.depth(x, 0, z);
  switch (kind) {
    case 'block':
      return {
        depth,
        shadow: [
          ...[-0.55, 0.55].flatMap((dx) => [-0.38, 0.38].flatMap((dz) => [[x + dx, 0, z + dz] as [number, number, number], [x + dx, 0.62, z + dz] as [number, number, number]])),
        ],
        el: (
          <g key={key}>
            {box(c, key + 'a', x, z, 1.1, 0.34, 0.76)}
            {box(c, key + 'b', x - 0.04, z + 0.02, 0.92, 0.28, 0.62, 0.34)}
            {/* page lines on the front of the top book */}
            {[0.08, 0.14, 0.2].map((yy, k) => {
              const a = pr.P(x - 0.46, 0.34 + yy, z + 0.33);
              const b = pr.P(x + 0.42, 0.34 + yy, z + 0.33);
              return <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ink} strokeWidth={0.8 * u} opacity={0.55 * ld} />;
            })}
          </g>
        ),
      };
    case 'spring': {
      const baseW = 1.3;
      const segs: {d: string; back: boolean}[] = [];
      const N = 160;
      const coils = 8;
      const xa = x - baseW / 2 + 0.2;
      const xb = x + baseW / 2 - 0.2;
      let prev: [number, number] | null = null;
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const a = t * coils * Math.PI * 2;
        const p = pr.P(xa + (xb - xa) * t, 0.36 + Math.sin(a) * 0.15, z + Math.cos(a) * 0.15);
        if (prev) segs.push({d: `M${prev[0].toFixed(1)},${prev[1].toFixed(1)} L${p[0].toFixed(1)},${p[1].toFixed(1)}`, back: Math.cos(a) < 0});
        prev = p;
      }
      const shown = Math.floor(segs.length * ld);
      return {
        depth,
        shadow: [
          [x - baseW / 2, 0, z - 0.25],
          [x + baseW / 2, 0, z - 0.25],
          [x + baseW / 2, 0, z + 0.25],
          [x - baseW / 2, 0, z + 0.25],
          [x - baseW / 2 + 0.06, 0.62, z],
          [x + baseW / 2 - 0.06, 0.62, z],
        ],
        el: (
          <g key={key}>
            {box(c, key + 'b', x, z, baseW, 0.12, 0.5)}
            {box(c, key + 'p0', x - baseW / 2 + 0.1, z, 0.14, 0.5, 0.3, 0.12)}
            <path d={segs.slice(0, shown).filter((g) => g.back).map((g) => g.d).join(' ')} fill="none" stroke={ink} strokeWidth={1.2 * u} opacity={0.35} strokeLinecap="round" />
            <path d={segs.slice(0, shown).filter((g) => !g.back).map((g) => g.d).join(' ')} fill="none" stroke={ink} strokeWidth={1.7 * u} strokeLinecap="round" />
            {box(c, key + 'p1', x + baseW / 2 - 0.1, z, 0.14, 0.5, 0.3, 0.12)}
          </g>
        ),
      };
    }
    case 'mug': {
      const r = 0.4;
      const hgt = 0.78;
      // handle: an ink ring on the +x side, drawn as two concentric arcs
      const hp = (k: number, rr: number) => {
        const a = -Math.PI / 2 + (k / 20) * Math.PI;
        return pr.P(x + r - 0.04 + Math.cos(a) * rr, 0.42 - Math.sin(a) * rr * 1.1, z);
      };
      const ring = (rr: number) => 'M' + Array.from({length: 21}, (_, k) => hp(k, rr).map((v) => v.toFixed(1)).join(',')).join(' L');
      const steam = Array.from({length: 3}, (_, k) => {
        const pts2: string[] = [];
        for (let q = 0; q <= 16; q++) {
          const t = q / 16;
          const [px, py] = pr.P(x - 0.18 + k * 0.18 + Math.sin(t * 6 + c.frame * 0.12 + k * 2) * 0.05, hgt + 0.12 + t * 0.55, z);
          pts2.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        return <path key={k} d={'M' + pts2.join(' L')} fill="none" stroke={ink} strokeWidth={1.2 * u} opacity={0.45 * c.m} strokeLinecap="round" />;
      });
      return {
        depth,
        shadow: [...circlePts(x, 0, z, r), ...circlePts(x, hgt, z, r), [x + r + 0.28, 0.4, z]],
        el: (
          <g key={key}>
            <path d={ring(0.26)} fill="none" stroke={ink} strokeWidth={1.6 * u} {...dash} />
            <path d={ring(0.17)} fill="none" stroke={ink} strokeWidth={1.4 * u} {...dash} />
            {cylinder(c, key + 'c', x, z, r, 0, hgt, {open: true, inner: '#CDBFAE'})}
            {steam}
          </g>
        ),
      };
    }
    case 'battery': {
      const r = 0.25;
      const hgt = 0.9;
      const [ax, ay] = pr.P(x - r, hgt * 0.78, z);
      const band = ellPath(pr.P(x, hgt * 0.78, z)[0], pr.P(x, hgt * 0.78, z)[1], r * pr.s, r * pr.s * pr.sinPhi, 'front');
      return {
        depth,
        shadow: [...circlePts(x, 0, z, r), ...circlePts(x, hgt + 0.1, z, r)],
        el: (
          <g key={key}>
            {cylinder(c, key + 'c', x, z, r, 0, hgt)}
            {cylinder(c, key + 't', x, z, 0.09, hgt, hgt + 0.09)}
            <path d={band} fill="none" stroke={ink} strokeWidth={1.2 * u} {...dash} />
            <text x={ax + r * pr.s * 0.55} y={ay + 0.25 * pr.s} fontFamily={x14Fonts.bookSerif} fontSize={0.2 * pr.s} fill={ink} opacity={0.75 * ld}>
              +
            </text>
          </g>
        ),
      };
    }
    case 'balloon': {
      const cy = 1.25;
      const [kx, ky] = pr.P(x, cy - 0.5, z);
      const [wx, wy] = pr.P(x, 0.16, z);
      const str: string[] = [];
      for (let q = 0; q <= 12; q++) {
        const t = q / 12;
        str.push(`${(kx + (wx - kx) * t + Math.sin(t * Math.PI * 2) * 4 * u).toFixed(1)},${(ky + (wy - ky) * t).toFixed(1)}`);
      }
      return {
        depth,
        shadow: [...circlePts(x, cy - 0.2, z, 0.4), ...circlePts(x, cy + 0.2, z, 0.4), ...circlePts(x, 0, z, 0.1)],
        el: (
          <g key={key}>
            {box(c, key + 'w', x, z, 0.2, 0.16, 0.2)}
            <path d={'M' + str.join(' L')} fill="none" stroke={ink} strokeWidth={1.1 * u} {...dash} />
            {sphere(c, key + 's', x, cy, z, 0.4, 0.5)}
            <path d={`M${kx - 5 * u},${ky + 6 * u} L${kx},${ky - 2 * u} L${kx + 5 * u},${ky + 6 * u} Z`} fill={HATCH3.clay} stroke={ink} strokeWidth={1.2 * u} opacity={ld} />
          </g>
        ),
      };
    }
    case 'ball':
      return {depth, shadow: [...circlePts(x, 0.05, z, 0.3), ...circlePts(x, 0.6, z, 0.3)], el: sphere(c, key, x, 0.35, z, 0.35, 0.35)};
    case 'jar':
    default:
      return {
        depth,
        shadow: [...circlePts(x, 0, z, 0.36), ...circlePts(x, 1.0, z, 0.36)],
        el: cylinder(c, key, x, z, 0.36, 0, 1.0, {open: true, inner: '#E4E0D8'}),
      };
  }
};

const SPAN: Record<Kind, number> = {block: 1.3, spring: 1.5, mug: 1.5, battery: 0.85, balloon: 1.0, ball: 0.9, jar: 0.95};

const SketchShadeIn: React.FC<Props> = ({objects, drawFrames, sunAt, shadeAt, shadeFrames, hatchSpacing, hatchAngle, lightAngle, lightDrift, shadowOpacity, sunIcon, caption, paper, ink, clay, yaw, pitch}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const tt = clamp(frame / Math.max(1, durationInFrames));
  const id = 'ssi';
  const objs = objects.length ? objects : (['block'] as Kind[]);
  const totalSpan = objs.reduce((a, k) => a + SPAN[k], 0);
  // portrait: two rows
  const rowsN = portrait ? 2 : 1;
  const perRow = Math.ceil(objs.length / rowsN);
  const rowSpan = (r: number) => objs.slice(r * perRow, (r + 1) * perRow).reduce((a, k) => a + SPAN[k], 0);
  const maxSpan = Math.max(...Array.from({length: rowsN}, (_, r) => rowSpan(r)), 1);
  const s0 = Math.min((w * (portrait ? 0.86 : 0.8)) / maxSpan, (h * (portrait ? 0.2 : 0.46)) / 1.9);
  const s = s0 * (1 + 0.05 * ease.sine(tt));
  const yawNow = yaw + 6 * ease.sine(tt);
  const pr = makeProj(w / 2, portrait ? h * 0.44 : h * 0.68, s, yawNow, pitch);
  const prRow = (r: number) => (portrait ? makeProj(w / 2, h * (0.42 + r * 0.3), s, yawNow, pitch) : pr);
  const m = easeInOutQuad(clamp((frame - shadeAt) / Math.max(1, shadeFrames)));
  const sh = easeInOutQuad(clamp((frame - shadeAt - shadeFrames * 0.25) / Math.max(1, shadeFrames)));
  const la = ((lightAngle + lightDrift * ease.sine(clamp((frame - shadeAt - shadeFrames) / Math.max(1, durationInFrames - shadeAt - shadeFrames)))) * Math.PI) / 180;
  const lx = Math.cos(la) * 0.85;
  const lz = Math.sin(la) * 0.85;

  // place objects
  const placed: {kind: Kind; x: number; z: number; i: number; r: number}[] = [];
  for (let r = 0; r < rowsN; r++) {
    const row = objs.slice(r * perRow, (r + 1) * perRow);
    let acc = -rowSpan(r) / 2;
    row.forEach((k, j) => {
      const i = r * perRow + j;
      const x = acc + SPAN[k] / 2;
      acc += SPAN[k];
      const z = i % 2 ? 0.35 : -0.3;
      placed.push({kind: k, x, z, i, r});
    });
  }
  const built = placed
    .map((p) => {
      const ld = clamp((frame - p.i * 3) / Math.max(1, drawFrames));
      const c: Ctx = {pr: prRow(p.r), u, ink, clay, m, sh, ld: ld <= 0 ? 0.0001 : ld, lx, lz, shOp: shadowOpacity, id, frame};
      return {...buildObject(c, p.kind, p.i, p.x, p.z), pr: c.pr, row: p.r};
    })
    .sort((a, b) => (a.row ?? 0) - (b.row ?? 0) || a.depth - b.depth);

  const [sx, sy] = pr.P(totalSpan * 0 + maxSpan / 2 - 0.2, 2.4, -1.2);
  const sunR = Math.min(0.24 * s, 40 * u);
  const sunX = Math.min(sx, w - sunR * 2.6);
  const sunY = Math.max(sy, sunR * 2.8 + (portrait ? h * 0.08 : 0));
  return (
    <AbsoluteFill style={{background: paper}}>
      <X3PageGround w={w} h={h} u={u} paper={paper} id={id} gobo={0.7} shift={-0.03 * tt} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <X3Hatch id={`${id}-hv`} spacing={hatchSpacing * u} angle={hatchAngle} width={1 * u} opacity={0.7} />
          <X3Hatch id={`${id}-hx`} spacing={hatchSpacing * u * 1.1} angle={hatchAngle + 70} width={1 * u} opacity={0.6} />
          <X3Hatch id={`${id}-hs`} spacing={hatchSpacing * u * 1.6} angle={hatchAngle + 45} width={0.8 * u} opacity={0.5} />
          <X3Hatch id={`${id}-hb`} spacing={hatchSpacing * u} angle={hatchAngle - 40} width={1 * u} opacity={0.65} />
          <X3Blur id={`${id}-sb`} sd={9 * u} />
        </defs>
        {/* cast shadows (on the page, toward the lower right) */}
        <g opacity={sh * shadowOpacity} filter={`url(#${id}-sb)`}>
          {built.map((b, k) => (
            <path key={k} d={polyPath(shadowHull(b.pr ?? pr, b.shadow, lx, lz))} fill="#000" />
          ))}
        </g>
        {built.map((b) => b.el)}
        {sunIcon ? <X3Sun x={sunX} y={sunY} r={sunR} draw={prog(frame, sunAt, sunAt + 5, ease.out)} rays={prog(frame, sunAt + 3, sunAt + 9, ease.out)} shade={m} u={u} id={`${id}-sun`} ink={ink} /> : null}
      </svg>
      {caption ? (
        <div
          style={{
            position: 'absolute',
            left: portrait ? w * 0.08 : w * 0.065,
            bottom: portrait ? h * 0.1 : h * 0.08,
            fontFamily: x14Fonts.bookSerif,
            fontStyle: 'italic',
            fontSize: 20 * u * (portrait ? 1.2 : 1),
            color: ink,
            opacity: 0.8 * prog(frame, 4, 20),
            maxWidth: w * 0.84,
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const sketchShadeIn = defineMotion<Props>({
  id: 'sketch-shade-in',
  title: 'Sketch shade-in',
  category: 'shape',
  description:
    'Everyday objects drawn as bare black ink lines on a book page; an ink sun icon switches on and the shading arrives in a few tenths of a second — white clay fills, pen cross-hatching on the shadow sides and soft cast shadows — then the light drifts so the shadows swing.',
  source: ['video x3 2.45-3.20 s (sun icon, fill + hatch, cast shadows)'],
  useFor: 'The "render pass" reveal from sketch to finished look: product or architecture visualisation, before/after, an ink-and-clay NPR finish for an explainer.',
  durationInFrames: 150,
  defaultProps: {
    objects: ['block', 'spring', 'mug', 'battery', 'balloon'],
    drawFrames: 20,
    sunAt: 26,
    shadeAt: 36,
    shadeFrames: 12,
    hatchSpacing: 5.5,
    hatchAngle: 12,
    lightAngle: 20,
    lightDrift: 25,
    shadowOpacity: 0.25,
    sunIcon: true,
    caption: 'Fig. 3  Light switches on: fill, hatch, shadow.',
    paper: HATCH3.paper,
    ink: HATCH3.ink,
    clay: HATCH3.clay,
    yaw: -16,
    pitch: 24,
  },
  propDocs: {
    objects: "objects left to right: 'block' | 'spring' | 'mug' | 'battery' | 'balloon' | 'ball' | 'jar' (portrait splits into two rows)",
    drawFrames: 'frames for each object’s ink lines to draw on (staggered 3 f)',
    sunAt: 'frame the sun icon draws (source 2.45 s)',
    shadeAt: 'frame the clay fill + hatching start (source 2.70 s)',
    shadeFrames: 'frames for the fill + hatch fade (easeInOutQuad; source 0.4 s)',
    hatchSpacing: 'hatch line spacing in u (source ≈ 5 px at 1280 w)',
    hatchAngle: 'hatch angle in degrees (second direction at +70°)',
    lightAngle: 'cast-shadow direction on the page in degrees (0 = right, 90 = toward camera)',
    lightDrift: 'degrees the light swings after the shade-in',
    shadowOpacity: 'cast shadow darkness (source ≈ 0.25)',
    sunIcon: 'show the ink sun icon',
    caption: 'italic figure caption ("" hides)',
    paper: 'page colour',
    ink: 'ink line colour',
    clay: 'clay fill colour',
    yaw: '3/4 view yaw in degrees (drifts +6°)',
    pitch: 'camera elevation in degrees',
  },
  component: SketchShadeIn,
  tags: ['sketch', 'shade', 'hatching', 'cross-hatch', 'ink', 'pen', 'clay', 'npr', 'render pass', 'line art', 'shadow', 'sun', 'reveal', 'before after', 'textbook', 'education', 'ink-hatch-3d', 'pop-up book'],
});
