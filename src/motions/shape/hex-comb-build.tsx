import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {shade} from '../../core/shape-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video6 14.67-16.6 s `hex-comb-build-strokes` (+ 9.25-9.92 s `spiral-cap-close`, 2.6-3.1 s `hex-prism-extrude`):
 * thick cream wax edges grow one segment at a time (node ball on each growing tip) while thin lavender
 * compass circles preview the next cell; finished cells fill with honey / pollen colours, some get a wax
 * cap that spirals shut, and the comb finally tilts into perspective and extrudes into prisms.
 */
type Props = {
  background: string;
  waxColor: string;
  guideColor: string;
  ghostColor: string;
  cellColors: string[];
  rings: number;
  edgeLength: number;
  framesPerEdge: number;
  edgeStagger: number;
  compassPreview: boolean;
  fill: boolean;
  caps: number;
  extrude: boolean;
  seed: number;
};

type Cell = {q: number; r: number; x: number; y: number};
type Edge = {a: [number, number]; b: [number, number]; cell: number; start: number};

const SQ3 = Math.sqrt(3);

const HexCombBuild: React.FC<Props> = ({background, waxColor, guideColor, ghostColor, cellColors, rings, edgeLength, framesPerEdge, edgeStagger, compassPreview, fill, caps, extrude, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, durationInFrames} = useStage();
  const L = edgeLength * u;

  const vert = (c: {x: number; y: number}, k: number): [number, number] => {
    const a = ((-90 + 60 * k) * Math.PI) / 180;
    return [c.x + L * Math.cos(a), c.y + L * Math.sin(a)];
  };

  const {cells, edges, ghosts, cellDone, cellStart} = useMemo(() => {
    const at = (q: number, r: number): Cell => ({q, r, x: cx + L * SQ3 * (q + r / 2), y: cy + L * 1.5 * r});
    // spiral order around the seed cell
    const order: Cell[] = [at(0, 0)];
    const dirs = [
      [1, 0],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [0, -1],
      [1, -1],
    ];
    for (let k = 1; k <= rings; k++) {
      let q = 0;
      let r = -k;
      for (let side = 0; side < 6; side++) {
        const [dq, dr] = dirs[side];
        for (let s = 0; s < k; s++) {
          order.push(at(q, r));
          q += dq;
          r += dr;
        }
      }
    }
    const key = (p: [number, number]) => `${Math.round(p[0])},${Math.round(p[1])}`;
    const built = new Set<string>();
    const present = new Set<string>();
    const es: Edge[] = [];
    const cStart: number[] = [];
    const cDone: number[] = [];
    let t = 6;
    order.forEach((c, ci) => {
      cStart[ci] = t;
      // begin the walk at a vertex that already exists, so growth is continuous
      let k0 = 0;
      for (let k = 0; k < 6; k++)
        if (present.has(key(vert(c, k)))) {
          k0 = k;
          break;
        }
      for (let j = 0; j < 6; j++) {
        const k = (k0 + j) % 6;
        const a = vert(c, k);
        const b = vert(c, k + 1);
        const ek = [key(a), key(b)].sort().join('|');
        if (built.has(ek)) continue;
        built.add(ek);
        const flip = !present.has(key(a)) && present.has(key(b));
        es.push({a: flip ? b : a, b: flip ? a : b, cell: ci, start: t});
        present.add(key(a));
        present.add(key(b));
        t += edgeStagger;
      }
      cDone[ci] = t - edgeStagger + framesPerEdge;
    });
    // faint pre-existing comb covering the frame
    const gs: Cell[] = [];
    const R = Math.ceil(Math.max(w, h) / (L * 1.5)) + 3;
    for (let r = -R; r <= R; r++)
      for (let q = -R - Math.abs(r); q <= R + Math.abs(r); q++) {
        const c = at(q, r);
        if (c.x > -L * 2 && c.x < w + L * 2 && c.y > -L * 2 && c.y < h + L * 2) gs.push(c);
      }
    return {cells: order, edges: es, ghosts: gs, cellDone: cDone, cellStart: cStart};
  }, [cx, cy, L, rings, edgeStagger, framesPerEdge, w, h]);

  const r = rng(seed);
  const look = cells.map(() => ({col: cellColors[Math.floor(r() * cellColors.length) % cellColors.length] ?? '#E8B04A', cap: r() < caps, tw: r()}));
  const buildEnd = Math.max(...cellDone);

  // ---- extrude / camera -----------------------------------------------------------------------
  const exStart = durationInFrames - 48;
  const ex = extrude ? prog(frame, exStart, durationInFrames - 12, ease.inOut) : 0;
  const pitch = lerp(0, 52, ex) * (Math.PI / 180);
  const cosP = Math.cos(pitch);
  const depth = L * 1.1 * ex;
  const push = lerp(1, 1.06, prog(frame, 0, exStart, ease.sine)) * lerp(1, 0.97, ex);
  const T = (x: number, y: number): [number, number] => [cx + (x - cx) * push, cy + (y - cy) * cosP * push - depth * Math.sin(pitch) * 0.5];
  const Tb = (x: number, y: number): [number, number] => {
    const [a, b] = T(x, y);
    return [a, b + depth * Math.sin(pitch) * push];
  };
  const pts = (c: Cell, rad: number, f = T) =>
    Array.from({length: 6}, (_, k) => {
      const a = ((-90 + 60 * k) * Math.PI) / 180;
      return f(c.x + rad * Math.cos(a), c.y + rad * Math.sin(a)).map((v) => v.toFixed(1)).join(',');
    }).join(' ');
  const ell = (c: Cell, rad: number) => {
    const [x, y] = T(c.x, c.y);
    return {cx: x, cy: y, rx: rad * push, ry: rad * push * cosP};
  };

  const sw = 12 * u * push;
  const ghostIn = prog(frame, 0, 12, ease.out);

  // edges
  const edgeEls: React.ReactNode[] = [];
  const balls: React.ReactNode[] = [];
  edges.forEach((e, i) => {
    const t = clamp((frame - e.start) / framesPerEdge);
    if (t <= 0) return;
    const et = 1 - (1 - t) * (1 - t);
    const [ax, ay] = T(e.a[0], e.a[1]);
    const [bx0, by0] = T(e.b[0], e.b[1]);
    const bx = lerp(ax, bx0, et);
    const by = lerp(ay, by0, et);
    edgeEls.push(
      <g key={i}>
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke={shade(waxColor, -0.22)} strokeWidth={sw * 1.12} strokeLinecap="round" />
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke={waxColor} strokeWidth={sw * 0.82} strokeLinecap="round" />
      </g>,
    );
    const ballR = 9 * u * push * (1 - prog(frame, e.start + framesPerEdge, e.start + framesPerEdge + 8, ease.in));
    if (ballR > 0.3) balls.push(<circle key={`b${i}`} cx={bx} cy={by} r={ballR} fill={waxColor} stroke={shade(waxColor, -0.25)} strokeWidth={1.5 * u} />);
  });

  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(232,176,74,0.07) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)'}} />
      <Svg>
        <defs>
          {look.map((lk, i) => (
            <radialGradient key={i} id={`hcb-f${i}`} cx="42%" cy="38%" r="70%">
              <stop offset="0%" stopColor={shade(lk.col, 0.35)} />
              <stop offset="55%" stopColor={lk.col} />
              <stop offset="100%" stopColor={shade(lk.col, -0.35)} />
            </radialGradient>
          ))}
        </defs>
        <g opacity={ghostIn * (1 - ex * 0.6)}>
          {ghosts.map((c, i) => (
            <polygon key={i} points={pts(c, L * 0.97)} fill="none" stroke={ghostColor} strokeWidth={2 * u} />
          ))}
        </g>
        {extrude && ex > 0 && (
          <g opacity={ex}>
            {cells.map((c, i) => (
              <polygon key={`bt${i}`} points={pts(c, L, Tb)} fill={shade(look[i].col, -0.55)} stroke={shade(waxColor, -0.45)} strokeWidth={3 * u} />
            ))}
            {cells.flatMap((c, i) =>
              [0, 1, 2, 3, 4, 5].map((k) => {
                const [x, y] = vert(c, k);
                const a = T(x, y);
                const b = Tb(x, y);
                return <line key={`w${i}-${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={shade(waxColor, -0.3)} strokeWidth={5 * u} strokeLinecap="round" />;
              }),
            )}
          </g>
        )}
        {fill &&
          cells.map((c, i) => {
            const f0 = cellDone[i] + 4;
            const s = prog(frame, f0, f0 + 10, ease.out);
            if (s <= 0) return null;
            const e = ell(c, L * 0.62 * s);
            return (
              <g key={`f${i}`}>
                <polygon points={pts(c, L * 0.92 * lerp(0.4, 1, s))} fill={`url(#hcb-f${i})`} opacity={0.92 * s} />
                <ellipse cx={e.cx - L * 0.18 * push} cy={e.cy - L * 0.2 * push * cosP} rx={e.rx * 0.32} ry={e.ry * 0.14} fill="#FFF6D8" opacity={0.35 * s} />
              </g>
            );
          })}
        {cells.map((c, i) => {
          if (!look[i].cap || !fill) return null;
          const c0 = cellDone[i] + 16 + look[i].tw * 10;
          const t = prog(frame, c0, c0 + 12, (x) => x * x);
          if (t <= 0) return null;
          const rc = L * 0.8;
          const ri = rc * (1 - t);
          const e = ell(c, rc);
          const ei = ell(c, ri);
          const annulus = `M ${e.cx - e.rx} ${e.cy} a ${e.rx} ${e.ry} 0 1 0 ${2 * e.rx} 0 a ${e.rx} ${e.ry} 0 1 0 ${-2 * e.rx} 0 Z M ${ei.cx - ei.rx} ${ei.cy} a ${ei.rx} ${ei.ry} 0 1 1 ${2 * ei.rx} 0 a ${ei.rx} ${ei.ry} 0 1 1 ${-2 * ei.rx} 0 Z`;
          const turns = 4;
          const spiral = Array.from({length: 120}, (_, k) => {
            const th = (k / 119) * turns * Math.PI * 2;
            const rr = (rc * 0.88 * k) / 119;
            const [x, y] = T(c.x + Math.cos(th) * rr, c.y + Math.sin(th) * rr);
            return `${k ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          }).join(' ');
          return (
            <g key={`c${i}`}>
              <path d={annulus} fill="#F2EAD8" fillRule="evenodd" stroke={shade('#F2EAD8', -0.25)} strokeWidth={1.5 * u} />
              <path d={spiral} fill="none" stroke={shade('#F2EAD8', -0.3)} strokeWidth={1.6 * u} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />
            </g>
          );
        })}
        {compassPreview &&
          cells.map((c, i) => {
            const s0 = cellStart[i];
            const vis = Math.min(prog(frame, s0 - 10, s0 - 2, ease.out), 1 - prog(frame, cellDone[i], cellDone[i] + 8, ease.in));
            if (vis <= 0 || ex > 0.2) return null;
            const e = ell(c, L);
            const dr = prog(frame, s0 - 10, s0, ease.inOut);
            const tick = 9 * u;
            return (
              <g key={`g${i}`} opacity={vis} stroke={guideColor} strokeWidth={1.4 * u} fill="none">
                <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dr} />
                <line x1={e.cx - tick} y1={e.cy} x2={e.cx + tick} y2={e.cy} />
                <line x1={e.cx} y1={e.cy - tick} x2={e.cx} y2={e.cy + tick} />
                {[0, 1, 2, 3, 4, 5].map((k) => {
                  const [vx, vy] = T(...vert(c, k));
                  return <line key={k} x1={vx - tick * 0.7} y1={vy - tick * 0.7} x2={vx + tick * 0.7} y2={vy + tick * 0.7} />;
                })}
              </g>
            );
          })}
        {edgeEls}
        {balls}
        {frame > buildEnd && <rect width={w} height={h} fill="none" />}
      </Svg>
    </AbsoluteFill>
  );
};

export const hexCombBuild = defineMotion<Props>({
  id: 'hex-comb-build',
  title: 'Hex comb build',
  category: 'shape',
  description: 'Cream wax hexagon edges grow segment by segment with node balls and compass-circle previews, cells fill with honey colours, wax caps spiral shut and the comb tilts into extruded prisms.',
  source: ['video6 0:14.67-0:16.6', 'video6 0:09.25-0:09.92 (spiral cap)', 'video6 0:02.6-0:03.1 (prism extrude)'],
  useFor: 'Building a system cell by cell, modular growth, teamwork / hive, filling a grid of slots.',
  durationInFrames: 200,
  defaultProps: {
    background: '#180F0B',
    waxColor: '#F2EAD8',
    guideColor: '#7589CB',
    ghostColor: '#3A2A1A',
    cellColors: ['#E8B04A', '#E8B04A', '#D99A3A', '#E8B04A', '#E8B04A', '#C8473A', '#E07B2E', '#D9C23A', '#E8B04A', '#7E9A3E', '#D99A3A'],
    rings: 2,
    edgeLength: 98,
    framesPerEdge: 5,
    edgeStagger: 1.6,
    compassPreview: true,
    fill: true,
    caps: 0.25,
    extrude: true,
    seed: 6,
  },
  propDocs: {
    waxColor: 'wax edge colour',
    guideColor: 'compass-preview circle colour',
    ghostColor: 'faint pre-existing comb outline colour',
    cellColors: 'fill colours picked per cell (honey, pollen...)',
    rings: 'rings of cells built around the seed cell (1 = 7 cells, 2 = 19, 3 = 37)',
    edgeLength: 'hexagon edge length in u',
    framesPerEdge: 'frames each wax edge takes to grow (easeOutQuad)',
    edgeStagger: 'frames between edge starts',
    compassPreview: 'lavender compass circles preview each next cell',
    fill: 'fill finished cells with colour',
    caps: 'fraction of filled cells that get a spiral wax cap',
    extrude: 'end by tilting the comb into perspective and extruding prisms',
  },
  component: HexCombBuild,
  tags: ['honeycomb', 'hexagon', 'build', 'grid', 'growth', 'bee'],
});
