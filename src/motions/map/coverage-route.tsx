// Adapted from lemo-opuscar/styles/midcentury-toon/demo/film.js (laneY / buildPath / planProgress) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {P, TAU, TOON, ToonDefs, ToonShape, back, clamp, cumLen, eio, fitW, lbf, lerp, mix, pd, pointAt, rrectPts, seg, starPts, subpath} from '../../core/r2-lb1-kit';

/**
 * Coverage route: a top-down floor plan where a robot's route draws itself region by region — one wall-follow loop,
 * then back-and-forth lanes that flow smoothly around furniture (potential-flow streamlines, never crossing), a
 * small curl at every U-turn, stars and dots popping in the gaps, a dotted return home. The camera pulls back while
 * counter-rotating, so the finished route reads as an atomic-age textile.
 */

type Zone = {x0: number; x1: number; color: string; label: string};
type Item = {shape: 'round' | 'sofa' | 'plant' | 'rect'; x: number; y: number; rx: number; ry: number; color: string};
type Props = {
  zones: Zone[];
  items: Item[];
  dock: [number, number];
  laneGap: number;
  curl: number;
  wallLoop: boolean;
  startFrame: number;
  loopFrames: number;
  zoneFrames: number;
  returnFrames: number;
  pullback: number;
  roll: number;
  routeColor: string;
  routeEdge: string;
  robotColor: string;
  decor: boolean;
  floor: string;
  wall: string;
  ink: string;
  caption: string;
  showLabels: boolean;
  background: string;
};

/** potential-flow streamline displacement around an ellipse (lane at y0, position x) */
const flowDy = (x: number, y0: number, cx: number, cy: number, rx: number, ry: number) => {
  const X = (x - cx) / rx;
  const Y0 = (y0 - cy) / ry;
  if (Math.abs(X) > 5 || Math.abs(Y0) > 3) return 0;
  const s = Y0 >= 0 ? 1 : -1;
  const a0 = Math.max(Math.abs(Y0), 1e-3);
  const f = (Y: number) => Y - Y / (X * X + Y * Y) - a0;
  let lo = Math.max(a0, Math.sqrt(Math.max(0, 1 - X * X)) + 1e-4);
  let hi = a0 + 3;
  if (f(lo) > 0) return (lo - a0) * s * ry;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (f(m) > 0) hi = m;
    else lo = m;
  }
  return ((lo + hi) / 2 - a0) * s * ry;
};

const CoverageRoute: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'coverage-route';
  // canonical space: long side horizontal
  const LW = Math.max(w, h);
  const SH = Math.min(w, h);
  const m = 0.075 * SH;
  const RW = LW - 2 * m;
  const RH = SH - 2 * m;
  const S = (q: P): P => (portrait ? [q[1], q[0]] : q);
  const geo = React.useMemo(() => {
    const inset = 34 * u;
    const gap = p.laneGap * u;
    const obs = p.items.map((it) => ({cx: m + it.x * RW, cy: m + it.y * RH, rx: it.rx * RW + 30 * u, ry: it.ry * RH + 30 * u}));
    const dy = (x: number, y0: number) => {
      let d = 0;
      for (const o of obs) d += flowDy(x, y0, o.cx, o.cy, o.rx, o.ry);
      return clamp(y0 + d, m + inset * 0.6, m + RH - inset * 0.6) - y0;
    };
    const route: P[] = [];
    const marks: number[] = [0];
    const decor: {q: P; s: number; kind: number}[] = [];
    const dock: P = [m + p.dock[0] * RW, m + p.dock[1] * RH];
    route.push(dock);
    if (p.wallLoop) {
      const loop = rrectPts(m + inset, m + inset, RW - 2 * inset, RH - 2 * inset, 60 * u, 8);
      // start the loop at the corner nearest the dock (bottom-left), run clockwise
      let k0 = 0;
      let best = 1e9;
      loop.forEach((q, i) => {
        const d = Math.hypot(q[0] - dock[0], q[1] - dock[1]);
        if (d < best) {
          best = d;
          k0 = i;
        }
      });
      for (let i = 0; i <= loop.length; i++) route.push(loop[(k0 + i) % loop.length]);
    }
    marks.push(cumLen(route).at(-1) ?? 0);
    const step = 8 * u;
    for (const z of p.zones) {
      const xa = m + z.x0 * RW + inset + gap / 2;
      const xb = m + z.x1 * RW - inset - gap / 2;
      const nL = Math.max(1, Math.floor((RH - 2 * inset) / gap));
      const yTop = m + inset + (RH - 2 * inset - (nL - 1) * gap) / 2;
      // enter the zone at the corner nearest the previous route end (no diagonal jumps)
      const lp = route[route.length - 1];
      const topFirst = Math.abs(lp[1] - yTop) <= Math.abs(lp[1] - (yTop + (nL - 1) * gap));
      let dir = Math.abs(lp[0] - xa) <= Math.abs(lp[0] - xb) ? 1 : -1;
      const vs = topFirst ? 1 : -1;
      for (let kk = 0; kk < nL; kk++) {
        const k = topFirst ? kk : nL - 1 - kk;
        const y0 = yTop + k * gap;
        const n = Math.max(2, Math.ceil((xb - xa) / step));
        const lane: P[] = [];
        for (let i = 0; i <= n; i++) {
          const x = dir > 0 ? lerp(xa, xb, i / n) : lerp(xb, xa, i / n);
          lane.push([x, y0 + dy(x, y0)]);
        }
        // connect from previous point
        const before = cumLen([...route, lane[0]]).at(-1) ?? 0;
        // decor in the gap below this lane
        if (p.decor && kk < nL - 1) {
          for (let x = xa + 64 * u; x < xb - 30 * u; x += 128 * u) {
            const yg = y0 + (vs * gap) / 2;
            const yy = yg + (dy(x, y0) + dy(x, y0 + vs * gap)) / 2;
            if (obs.some((o) => ((x - o.cx) / o.rx) ** 2 + ((yy - o.cy) / o.ry) ** 2 < 1.15)) continue;
            const frac = dir > 0 ? (x - xa) / (xb - xa) : (xb - x) / (xb - xa);
            decor.push({q: [x, yy], s: before + frac * (xb - xa), kind: Math.round(x / (128 * u) + k) % 2});
          }
        }
        route.push(...lane);
        if (kk < nL - 1) {
          // U-turn arc with a small curl at its apex
          const e = lane[lane.length - 1];
          const ny0 = y0 + vs * gap;
          const xe = e[0];
          const yNext = ny0 + dy(xe, ny0);
          const cy = (e[1] + yNext) / 2;
          const r = Math.abs(yNext - e[1]) / 2;
          const arc: P[] = [];
          for (let i = 1; i < 12; i++) {
            const a = vs * (-Math.PI / 2 + (Math.PI * i) / 12);
            arc.push([xe + dir * Math.cos(a) * r * 0.9, cy + Math.sin(a) * r]);
            if (i === 6 && p.curl > 0) {
              const cr = p.curl * u;
              const ccx = xe + dir * (r * 0.9 - cr);
              for (let j = 1; j <= 20; j++) {
                const b = (dir > 0 ? 0 : Math.PI) + dir * (TAU * j) / 20;
                arc.push([ccx + Math.cos(b) * cr, cy + Math.sin(b) * cr]);
              }
            }
          }
          route.push(...arc);
        }
        dir = -dir;
      }
      marks.push(cumLen(route).at(-1) ?? 0);
    }
    const mainLen = cumLen(route).at(-1) ?? 0;
    const endP = route[route.length - 1];
    const ret: P[] = [endP, [endP[0], dock[1]], dock];
    return {route, cum: cumLen(route), marks, decor, mainLen, ret, dock, obs};
  }, [u, m, RW, RH, JSON.stringify(p.zones), JSON.stringify(p.items), p.laneGap, p.curl, p.wallLoop, p.decor, p.dock[0], p.dock[1]]);

  // progress keyed to segments
  const f = frame - p.startFrame;
  const segFrames = [p.wallLoop ? p.loopFrames : 1, ...p.zones.map(() => p.zoneFrames)];
  let L = 0;
  let t0 = 0;
  for (let i = 0; i < segFrames.length; i++) {
    const a = geo.marks[i];
    const b = geo.marks[i + 1] ?? a;
    const k = eio(seg(f, t0, t0 + segFrames[i]));
    if (f >= t0) L = lerp(a, b, k);
    t0 += segFrames[i];
  }
  const total = geo.mainLen;
  const doneAt = t0;
  const retK = eio(seg(f, doneAt, doneAt + p.returnFrames));
  const drawn = subpath(geo.route, total > 0 ? L / total : 0, geo.cum);
  const retPts = subpath(geo.ret, retK);
  const head = retK > 0 ? retPts[retPts.length - 1] : drawn[drawn.length - 1];
  const hd = retK > 0 ? pointAt(geo.ret, Math.max(0.001, retK)).a : pointAt(geo.route, Math.max(0.0005, L / Math.max(1, total)), geo.cum).a;
  // camera: pull back + counter-rotate around the route head
  const camK = eio(seg(f, 0, doneAt + p.returnFrames * 0.5));
  const z = lerp(p.pullback, 1, camK);
  const roll = lerp(p.roll, 0, camK);
  const centre: P = [LW / 2, SH / 2];
  const wHead = lerp(1, 0, clamp((p.pullback - z) / Math.max(0.01, p.pullback - 1) * 1.25));
  const fx = lerp(centre[0], head[0], wHead);
  const fy = lerp(centre[1], head[1], wHead);
  const F = S([fx, fy]);
  const camT = `translate(${w / 2} ${h / 2}) rotate(${roll}) scale(${z}) translate(${-F[0]} ${-F[1]})`;
  const route = drawn.map(S);
  const lineW = 7 * u;
  const transparent = p.background === 'transparent';
  const capIn = seg(f, doneAt + p.returnFrames, doneAt + p.returnFrames + 5);
  return (
    <AbsoluteFill style={{background: transparent ? 'transparent' : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <ToonDefs id={id} u={u} />
        <defs>
          <pattern id={`${id}-chk`} patternUnits="userSpaceOnUse" width={64 * u} height={64 * u}>
            <rect width={32 * u} height={32 * u} fill="#000" opacity={0.045} />
            <rect x={32 * u} y={32 * u} width={32 * u} height={32 * u} fill="#000" opacity={0.045} />
          </pattern>
        </defs>
        <g transform={camT}>
          {/* floor + zones */}
          {!transparent && <path d={pd([S([m, m]), S([m + RW, m]), S([m + RW, m + RH]), S([m, m + RH])])} fill={p.floor} />}
          {p.zones.map((zn, i) => {
            const a = S([m + zn.x0 * RW, m]);
            const b = S([m + zn.x1 * RW, m + RH]);
            return <rect key={i} x={Math.min(a[0], b[0])} y={Math.min(a[1], b[1])} width={Math.abs(b[0] - a[0])} height={Math.abs(b[1] - a[1])} fill={zn.color} opacity={0.35} />;
          })}
          <path d={pd([S([m, m]), S([m + RW, m]), S([m + RW, m + RH]), S([m, m + RH])])} fill={`url(#${id}-chk)`} />
          {/* zone dividers */}
          {p.zones.slice(1).map((zn, i) => {
            const a = S([m + zn.x0 * RW, m]);
            const b = S([m + zn.x0 * RW, m + RH]);
            return <ToonShape key={i} pts={[a, b]} closed={false} frame={frame} u={u} defsId={id} line={3} lineColor={p.ink} breaks={0.45} seed={60 + i} />;
          })}
          {/* furniture */}
          {p.items.map((it, i) => {
            const c = S([m + it.x * RW, m + it.y * RH]);
            const rx = (portrait ? it.ry * RH : it.rx * RW);
            const ry = (portrait ? it.rx * RW : it.ry * RH);
            const sh = it.shape;
            const pts: P[] =
              sh === 'sofa' || sh === 'rect'
                ? rrectPts(c[0] - rx, c[1] - ry, rx * 2, ry * 2, Math.min(rx, ry) * (sh === 'sofa' ? 0.5 : 0.15), 6)
                : sh === 'plant'
                  ? starPts(c[0], c[1], rx, 7, 0.55, i)
                  : Array.from({length: 49}, (_, k) => [c[0] + Math.cos((k / 48) * TAU) * rx, c[1] + Math.sin((k / 48) * TAU) * ry] as P);
            return (
              <g key={i}>
                <ToonShape pts={pts} frame={frame} u={u} defsId={id} fill={it.color} line={3.4} lineColor={p.ink} seed={70 + i} shadow="rgba(60,40,20,0.18)" shadowOff={[8, 8]} />
                {sh === 'sofa' && <ToonShape pts={rrectPts(c[0] - rx * 0.78, c[1] - ry * 0.55, rx * 1.56, ry * 1.1, Math.min(rx, ry) * 0.3, 5)} frame={frame} u={u} defsId={id} fill={mix(it.color, '#ffffff', 0.25)} line={2.4} lineColor={p.ink} seed={80 + i} />}
                {sh === 'plant' && <circle cx={c[0]} cy={c[1]} r={rx * 0.35} fill={TOON.kraft} stroke={p.ink} strokeWidth={2.4 * u} />}
              </g>
            );
          })}
          {/* walls */}
          <path d={pd([S([m, m]), S([m + RW, m]), S([m + RW, m + RH]), S([m, m + RH])])} fill="none" stroke={p.wall} strokeWidth={14 * u} strokeLinejoin="round" />
          {/* decor revealed as the route passes */}
          {geo.decor.map((d, i) => {
            const k = back(clamp((L - d.s) / (40 * u)), 2);
            if (k <= 0) return null;
            const q = S(d.q);
            return d.kind === 0 ? (
              <path key={i} d={pd(starPts(q[0], q[1], 11 * u * k, 4, 0.36, 0))} fill={TOON.coral} />
            ) : (
              <circle key={i} cx={q[0]} cy={q[1]} r={4.5 * u * k} fill={p.ink} opacity={0.75} />
            );
          })}
          {/* route: off-register ink edge + product colour */}
          {route.length > 1 && (
            <>
              <path d={pd(route, false)} transform={`translate(${2.5 * u} ${2.5 * u})`} fill="none" stroke={p.routeEdge} strokeWidth={lineW + 3 * u} strokeLinecap="round" strokeLinejoin="round" />
              <path d={pd(route, false)} fill="none" stroke={p.routeColor} strokeWidth={lineW} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {retK > 0 && (
            <path d={pd(retPts.map(S), false)} fill="none" stroke={p.ink} strokeWidth={4 * u} strokeDasharray={`${2 * u} ${12 * u}`} strokeLinecap="round" />
          )}
          {/* dock */}
          {(() => {
            const d = S(geo.dock);
            return (
              <g>
                <rect x={d[0] - 30 * u} y={d[1] - 16 * u} width={60 * u} height={32 * u} rx={8 * u} fill={TOON.white} stroke={p.ink} strokeWidth={3 * u} />
                <rect x={d[0] - 12 * u} y={d[1] - 5 * u} width={24 * u} height={10 * u} rx={3 * u} fill={TOON.coral} />
              </g>
            );
          })()}
          {/* robot */}
          {(() => {
            const q = S(head);
            const ang = portrait ? Math.atan2(Math.cos(hd), Math.sin(hd)) : hd;
            const r = 22 * u;
            return (
              <g transform={`translate(${q[0]} ${q[1]}) rotate(${(ang * 180) / Math.PI})`}>
                <circle cx={4 * u} cy={4 * u} r={r} fill="rgba(40,30,20,0.25)" />
                <circle r={r} fill={p.robotColor} stroke={p.ink} strokeWidth={3 * u} />
                <circle r={r * 0.62} fill="none" stroke={TOON.white} strokeWidth={3 * u} />
                <circle cx={r * 0.55} r={4 * u} fill={TOON.coral} />
              </g>
            );
          })()}
          {/* zone labels */}
          {p.showLabels &&
            p.zones.map((zn, i) => {
              // label pill at the top-centre (landscape) / top-left (portrait) of the zone, in screen space
              const q: P = portrait ? [w / 2, m + zn.x0 * RW + 30 * u] : [m + ((zn.x0 + zn.x1) / 2) * RW, m + 30 * u];
              const avail = portrait ? w * 0.6 : Math.abs(zn.x1 - zn.x0) * RW * 0.8;
              const fs = fitW(zn.label.toUpperCase(), 22 * u, avail, 'jost', 0.3);
              const lw = Math.min(avail, zn.label.length * fs * 0.95) + 30 * u;
              return (
                <g key={i}>
                  <rect x={q[0] - lw / 2} y={q[1] - fs * 1.05} width={lw} height={fs * 1.7} rx={fs * 0.85} fill={p.floor} stroke={p.ink} strokeWidth={2 * u} />
                  <text x={q[0] + fs * 0.15} y={q[1] + fs * 0.12} textAnchor="middle" fontFamily={lbf('jost')} fontWeight={600} fontSize={fs} letterSpacing="0.3em" fill={p.ink}>
                    {zn.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
        </g>
        {p.caption && capIn > 0 && (
          <g opacity={capIn} transform={`translate(0 ${(1 - capIn) * 10 * u})`}>
            {(() => {
              const fs = fitW(p.caption, 40 * u, w * 0.72, 'jost');
              const cw = Math.min(w * 0.86, (p.caption.length * fs * 0.52 + 140 * u));
              const ch = fs * 1.9;
              const x = w / 2 - cw / 2;
              const y = h - 60 * u - ch;
              const box = rrectPts(x, y, cw, ch, 14 * u, 5);
              return (
                <>
                  <ToonShape pts={box} frame={frame} u={u} defsId={id} fill={TOON.white} line={3.6} lineColor={p.ink} seed={91} off={[5, 5]} shadow={TOON.mustard} shadowOff={[5, 5]} breaks={0.06} />
                  <text x={w / 2} y={y + ch * 0.66} textAnchor="middle" fontFamily={lbf('jost')} fontWeight={500} fontSize={fs} fill={p.ink}>
                    {p.caption}
                  </text>
                  {[x + 34 * u, x + cw - 34 * u].map((sx, i) => (
                    <path key={i} d={pd(starPts(sx, y + ch / 2, 13 * u, 8, 0.45, frame * 0.05 * (i ? -1 : 1)))} fill={TOON.coral} />
                  ))}
                </>
              );
            })()}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const coverageRoute = defineMotion<Props>({
  id: 'coverage-route',
  title: 'Coverage route (floor plan)',
  category: 'map',
  description:
    'Top-down mid-century floor plan: a robot route draws itself region by region — a wall-follow loop, then back-and-forth lanes that flow around furniture without crossing, curls at every U-turn, stars and dots popping between lanes, a dotted return to the dock — while the camera pulls back and counter-rotates to reveal a patterned whole.',
  source: ['lemo-opuscar styles/midcentury-toon (MIT code, CC BY 4.0 docs, LemoLab) — demo/film.js laneY/buildPath/planProgress'],
  useFor: 'Robot vacuums / mowers, delivery rounds, sprinkler or cleaning coverage, "how the algorithm covers the space" payoffs.',
  durationInFrames: 240,
  defaultProps: {
    zones: [
      {x0: 0, x1: 0.38, color: '#F3D37F', label: 'Living room'},
      {x0: 0.38, x1: 0.7, color: '#8ACFC6', label: 'Kitchen'},
      {x0: 0.7, x1: 1, color: '#F0B4A8', label: 'Hall'},
    ],
    items: [
      {shape: 'sofa', x: 0.17, y: 0.28, rx: 0.1, ry: 0.07, color: '#E4613F'},
      {shape: 'round', x: 0.22, y: 0.7, rx: 0.055, ry: 0.09, color: '#C9955D'},
      {shape: 'round', x: 0.54, y: 0.48, rx: 0.07, ry: 0.13, color: '#7F9CC0'},
      {shape: 'plant', x: 0.86, y: 0.26, rx: 0.035, ry: 0.06, color: '#A7AE5B'},
      {shape: 'rect', x: 0.87, y: 0.72, rx: 0.05, ry: 0.08, color: '#E8B43A'},
    ],
    dock: [0.04, 0.9],
    laneGap: 82,
    curl: 11,
    wallLoop: true,
    startFrame: 6,
    loopFrames: 30,
    zoneFrames: 46,
    returnFrames: 18,
    pullback: 3.4,
    roll: -6,
    routeColor: '#3FA7A0',
    routeEdge: '#1B5753',
    robotColor: '#3FA7A0',
    decor: true,
    floor: '#F4EAD5',
    wall: '#2B2420',
    ink: '#2B2420',
    caption: 'One pass. Every corner.',
    showLabels: true,
    background: '#E6D8BC',
  },
  propDocs: {
    zones: 'regions drawn one per beat [{x0, x1 (0..1 of room width), color, label}]',
    items: 'furniture obstacles [{shape: round|sofa|plant|rect, x, y (0..1), rx, ry (fraction of room), color}]',
    dock: 'dock position [x, y] 0..1 of the room',
    laneGap: 'lane spacing in u',
    curl: 'curl radius at U-turns in u (0 = none)',
    wallLoop: 'start with one wall-follow loop',
    startFrame: 'delay before drawing',
    loopFrames: 'frames for the wall loop',
    zoneFrames: 'frames per zone',
    returnFrames: 'frames for the dotted return home',
    pullback: 'starting camera zoom (pulls back to 1)',
    roll: 'starting counter-rotation in degrees',
    routeColor: 'route (product) colour',
    routeEdge: 'darker off-register edge under the route',
    robotColor: 'robot body colour',
    decor: 'stars and dots revealed between lanes',
    floor: 'floor colour',
    wall: 'wall outline colour',
    ink: 'ink colour',
    caption: 'caption card after the return ("" to hide)',
    showLabels: 'zone labels',
    background: 'colour outside the room, or "transparent"',
  },
  component: CoverageRoute,
  tags: ['route', 'coverage', 'floor plan', 'robot vacuum', 'boustrophedon', 'path', 'map', 'midcentury', 'toon', 'pull back', 'camera', 'pattern', 'process'],
});
