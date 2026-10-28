// Adapted from lemo-opuscar/styles/iso-infographic/demo/engine.js + world.js (projection, tri shading, route, pins) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, cl, dropIn, eio3, eo3, h1, ISO, IsoCtx, isoBox, isoP, isoPoly, IsoPolys, isoRoof, isoTree, isoTri, lerp, lf, seg} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Station = {pos: [number, number]; label: string; value: string; unit: string; kind: 'farm' | 'plant' | 'port' | 'city' | 'shop'};
type Props = {
  title: string;
  stations: Station[];
  total: string;
  totalLabel: string;
  bpm: number;
  palette: {ground: string; boardTop: string; sea: string; subject: string};
  seed: number;
  zoomOut: boolean;
};

const S = 56; // board half-size in world units

const IsoDioramaBoard: React.FC<Props> = ({title, stations, total, totalLabel, bpm, palette, seed, zoomOut}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const beat = (60 / bpm) * 30;
  const n = stations.length;

  // ---- timings: board drops, tiles/props pop, route draws station to station, pins pop, end legend
  const tBoard = 4;
  const tProps = tBoard + 10;
  const tRoute0 = tProps + 18;
  const perLeg = beat * 2.2;
  const tEnd = tRoute0 + n * perLeg + 10;
  const endK = zoomOut ? eio3(seg(frame, tEnd, tEnd + 30)) : 0;

  // ---- camera: gentle push toward the route head, then pull out for the legend
  const routeT = cl((frame - tRoute0) / (n > 1 ? (n - 1) * perLeg : 1));
  const kBase = Math.min((w * (portrait ? 0.96 : 0.86)) / (4 * S * 0.866), (h * (portrait ? 0.42 : 0.7)) / (2 * S));
  const k = kBase * lerp(1, 1.1, eio3(seg(frame, tRoute0, tRoute0 + n * perLeg))) * lerp(1, 0.82, endK);
  const ctx: IsoCtx = {k, cx: w / 2, cy: portrait ? h * 0.44 : h * 0.5, polys: []};

  // board float: slow bob
  const bob = Math.sin(frame / 38) * 0.35;
  const boardIn = eo3(seg(frame, tBoard, tBoard + 14));
  const boardRise = (1 - boardIn) * 30 - bob;

  // ---- stations placed on a Z route far -> near
  const sPos = stations.map((st) => [st.pos[0] * S * 1.7 - S * 0.85, st.pos[1] * S * 1.7 - S * 0.85] as [number, number]);

  // ---- draw board
  const zTop = 6;
  const g = palette.ground;
  void g;
  // strata under the top
  const strata = [palette.boardTop, ISO.soil[0], ISO.soil[1], ISO.soil[2]];
  const sh = [1.4, 2.4, 2.2, 3.4];
  let z = zTop;
  strata.forEach((c, i) => {
    const t = isoTri(c);
    const z1 = z;
    const z0 = z - sh[i];
    if (i === 0) isoPoly(ctx, [[-S, -S, z1 - boardRise * 0 + 0], [S, -S, z1], [S, S, z1], [-S, S, z1]].map((p) => [p[0], p[1], (p[2] as number) - boardRise]) as [number, number, number][], t.top, {bias: -200});
    isoPoly(ctx, [[-S, S, z1 - boardRise], [S, S, z1 - boardRise], [S, S, z0 - boardRise], [-S, S, z0 - boardRise]], t.left, {bias: -150});
    isoPoly(ctx, [[S, -S, z1 - boardRise], [S, S, z1 - boardRise], [S, S, z0 - boardRise], [S, -S, z0 - boardRise]], t.right, {bias: -150});
    z = z0;
  });
  // pebbles on the soil front faces
  for (let i = 0; i < 14; i++) {
    const px = lerp(-S * 0.9, S * 0.9, h1(i, seed));
    const pz = zTop - 3 - h1(i, seed + 1) * 4 - boardRise;
    const r = 0.5 + h1(i, seed + 2) * 0.7;
    isoPoly(ctx, [[px, S, pz], [px + r, S, pz], [px + r, S, pz - r], [px, S, pz - r]], ISO.soil[2], {bias: -140, alpha: 0.7});
  }
  // sea corner (water column on the front-right)
  const seaT = isoTri(palette.sea);
  isoPoly(ctx, [[S * 0.1, -S, zTop + 0.01 - boardRise], [S, -S, zTop + 0.01 - boardRise], [S, S * 0.05, zTop + 0.01 - boardRise], [S * 0.45, S * 0.05, zTop + 0.01 - boardRise]], seaT.top, {bias: -190});
  // waves
  for (let i = 0; i < 8; i++) {
    const wx = lerp(S * 0.3, S * 0.95, h1(i, seed + 4));
    const wy = lerp(-S * 0.9, 0, h1(i, seed + 5));
    if (wy > wx * 0.1 - S * 0.05) continue;
    const ph = seg((frame / 30 + h1(i, 3)) % 1, 0.2, 0.8);
    isoPoly(ctx, [[wx, wy, zTop + 0.02 - boardRise], [wx + 3.2 * ph, wy + 0.8, zTop + 0.02 - boardRise], [wx + 3.2 * ph, wy + 1.4, zTop + 0.02 - boardRise], [wx, wy + 0.6, zTop + 0.02 - boardRise]], '#cfe7f3', {bias: -185, alpha: 0.8});
  }

  // ---- props per station kind
  const kindProps = (st: Station, i: number) => {
    const [x, y] = sPos[i];
    const lt = frame - (tProps + i * 4);
    const {rise, sy} = dropIn(lt, 9, 8);
    if (lt < 0) return;
    const zb = zTop - boardRise;
    const o = {rise: zb + rise, keep: false};
    const sc = sy;
    void sc;
    if (st.kind === 'farm') {
      for (let r = 0; r < 3; r++)
        isoBox(ctx, x - 5 + r * 0.4, y - 5 + r * 3.2, 0, x + 5 - r * 0.4, y - 3.2 + r * 3.2, 0.9 + 0.1 * r, r % 2 ? ISO.leaf[1] : ISO.leaf[0], o);
      isoBox(ctx, x + 2, y - 8.4, 0, x + 6.4, y - 5.6, 2.6, '#F6EFE0', o);
      isoRoof(ctx, x + 2, y - 8.4, 2.6, x + 6.4, y - 5.6, 1.8, palette.subject, o);
      isoTree(ctx, x - 7.5, y + 6, 2.6, o);
      isoTree(ctx, x - 3.5, y + 7.5, 2.1, o);
    } else if (st.kind === 'plant') {
      isoBox(ctx, x - 6, y - 4, 0, x + 2, y + 4, 4.4, '#E4D6BC', o);
      isoRoof(ctx, x - 6, y - 4, 4.4, x - 2, y + 4, 2, ISO.mustard[1], o);
      isoRoof(ctx, x - 2, y - 4, 4.4, x + 2, y + 4, 2, ISO.mustard[1], o);
      isoBox(ctx, x + 3.4, y - 2.4, 0, x + 5.6, y + 0.2, 7.5, palette.subject, o);
      // smoke puffs
      for (let p = 0; p < 3; p++) {
        const ph = ((frame / 40 + p / 3 + h1(i, p)) % 1);
        const pz = 7.5 + ph * 5;
        isoBox(ctx, x + 3.9 - ph, y - 1.9 - ph, pz, x + 5.1 + ph, y - 0.6 + ph, pz + 1, '#F2EDE2', {...o, rise: o.rise, keep: true});
      }
    } else if (st.kind === 'port') {
      isoBox(ctx, x - 6, y - 3, 0, x + 1, y + 4, 2.2, '#DACBAF', o);
      // crane
      isoBox(ctx, x + 1.6, y - 1, 0, x + 3, y + 0.4, 8, ISO.mustard[0], o);
      isoBox(ctx, x - 1.5, y - 0.7, 7.2, x + 6.4, y + 0.1, 8, ISO.mustard[1], o);
      // containers
      isoBox(ctx, x - 4.4, y + 0.8, 0, x - 1.2, y + 2.4, 1.5, palette.subject, o);
      isoBox(ctx, x - 4, y + 2.6, 0, x - 0.8, y + 4.2, 1.5, ISO.sea[1], o);
      isoBox(ctx, x - 3.6, y + 0.8, 1.5, x - 0.9, y + 2.4, 3, ISO.leaf[1], o);
    } else if (st.kind === 'city') {
      const hts = [5, 8.5, 6.5, 11, 4.4, 7.4];
      hts.forEach((ht, j) => {
        const bx = x - 7 + (j % 3) * 5;
        const by = y - 4 + Math.floor(j / 3) * 5.4;
        isoBox(ctx, bx, by, 0, bx + 3.6, by + 3.8, ht, j === 3 ? '#D8CDB6' : ['#E8DFC9', '#DED2B8', '#CFC2A6'][j % 3], o);
        // windows on the right face
        for (let wy2 = 0; wy2 < Math.floor(ht / 1.7); wy2++)
          isoPoly(ctx, [[bx + 3.6, by + 0.7, 1.2 + wy2 * 1.7 + o.rise], [bx + 3.6, by + 3, 1.2 + wy2 * 1.7 + o.rise], [bx + 3.6, by + 3, 0.5 + wy2 * 1.7 + o.rise], [bx + 3.6, by + 0.7, 0.5 + wy2 * 1.7 + o.rise]], ISO.ink, {alpha: 0.18, bias: 0.06});
      });
    } else {
      isoBox(ctx, x - 4, y - 3, 0, x + 4, y + 3, 3.4, '#F6EFE0', o);
      isoRoof(ctx, x - 4, y - 3, 3.4, x + 4, y + 3, 2.4, palette.subject, o);
      isoBox(ctx, x - 1, y + 3, 0, x + 1, y + 3.4, 2.2, ISO.soil[1], o);
      isoTree(ctx, x + 6, y - 4.5, 2.4, o);
    }
  };
  stations.forEach(kindProps);

  // scattered trees
  for (let i = 0; i < 10; i++) {
    const tx = lerp(-S * 0.92, S * 0.4, h1(i, seed + 6));
    const ty = lerp(-S * 0.3, S * 0.92, h1(i, seed + 7));
    if (sPos.some(([sx2, sy2]) => Math.hypot(tx - sx2, ty - sy2) < 12)) continue;
    const lt = frame - (tProps + 6 + i * 2);
    isoTree(ctx, tx, ty, 2 + h1(i, seed + 8) * 1.6, {rise: zTop - boardRise, pop: backOut(cl(lt / 8), 2.2)});
  }

  // ---- route: dashed ink line far -> near, drawn slightly ahead of the subject
  const routeFrames: [number, number][] = [];
  const legOf = (t: number) => {
    const total2 = (n - 1) * perLeg;
    const ft = cl(t) * total2;
    const leg = Math.min(n - 2, Math.floor(ft / perLeg));
    return {leg, lt: ft / perLeg - leg};
  };
  const routePt = (t: number): [number, number] => {
    if (n < 2) return sPos[0] ?? [0, 0];
    const {leg, lt} = legOf(t);
    const a = sPos[leg];
    const b = sPos[leg + 1];
    const mx = (a[0] + b[0]) / 2 + (h1(leg, seed) - 0.5) * 18;
    const my = (a[1] + b[1]) / 2 + (h1(leg, seed + 1) - 0.5) * 18;
    const q = (p0: number, p1: number, p2: number, tt: number) => (1 - tt) * (1 - tt) * p0 + 2 * (1 - tt) * tt * p1 + tt * tt * p2;
    return [q(a[0], mx, b[0], lt), q(a[1], my, b[1], lt)];
  };
  const drawT = cl(routeT * 1.06 + 0.02);
  const Nr = 90;
  for (let i = 0; i <= Nr * drawT; i++) routeFrames.push(routePt(i / Nr));

  // subject marker (a little truck cube) rides the route
  const sub = routePt(routeT);
  const subNext = routePt(Math.min(1, routeT + 0.012));
  const heading = Math.atan2(subNext[1] - sub[1], subNext[0] - sub[0]);
  if (frame >= tRoute0 && n >= 2) {
    const cs = Math.cos(heading);
    const sn = Math.sin(heading);
    const bx = (dx: number, dy: number): [number, number] => [sub[0] + dx * cs - dy * sn, sub[1] + dx * sn + dy * cs];
    const base = [bx(-2.2, -1.2), bx(2.2, -1.2), bx(2.2, 1.2), bx(-2.2, 1.2)];
    isoPoly(ctx, base.map((p) => [p[0], p[1], zTop + 2 - boardRise]) as [number, number, number][], isoTri(palette.subject).top, {bias: 30, keep: true});
    base.forEach((p, i2) => {
      const p2 = base[(i2 + 1) % 4];
      isoPoly(ctx, [[p[0], p[1], zTop + 2 - boardRise], [p2[0], p2[1], zTop + 2 - boardRise], [p2[0], p2[1], zTop + 0.2 - boardRise], [p[0], p[1], zTop + 0.2 - boardRise]], i2 % 2 ? isoTri(palette.subject).right : isoTri(palette.subject).left, {bias: 29, keep: true});
    });
  }

  const routeD = routeFrames.length > 1 ? 'M' + routeFrames.map((p) => isoP(ctx, p[0], p[1], zTop + 0.3 - boardRise).map((v) => v.toFixed(1)).join(' ')).join('L') : '';

  // ---- pins
  const pinEls = stations.map((st, i) => {
    const reach = i === 0 ? tRoute0 : tRoute0 + i * perLeg;
    const kIn = backOut(seg(frame, reach, reach + 8), 2.2);
    if (kIn <= 0) return null;
    const [px, py] = isoP(ctx, sPos[i][0], sPos[i][1], zTop + 1 - boardRise);
    const fs = 25 * u;
    const lift = 70 * u;
    return (
      <g key={i} transform={`translate(${px} ${py - lift * kIn}) scale(${kIn})`}>
        <line x1={0} y1={lift * 0.98} x2={0} y2={fs * 1.3} stroke={ISO.ink} strokeWidth={2 * u} />
        <circle cx={0} cy={lift} r={4 * u} fill={ISO.ink} />
        <g>
          <text x={0} y={0} textAnchor="middle" fontFamily={lf.jost} fontWeight={600} fontSize={fs} fill={ISO.ink} letterSpacing={fs * 0.12} stroke={ISO.ground} strokeWidth={7 * u} paintOrder="stroke">
            {st.label.toUpperCase()}
          </text>
          <text x={0} y={fs * 1.15} textAnchor="middle" fontFamily={lf.jost} fontWeight={400} fontSize={fs * 1.15} fill={ISO.ink} stroke={ISO.ground} strokeWidth={7 * u} paintOrder="stroke">
            {st.value}
            <tspan fontSize={fs * 0.62} fontWeight={500}>
              {' '}
              {st.unit}
            </tspan>
          </text>
        </g>
      </g>
    );
  });

  // ---- legend end card
  const legend = endK > 0 && (
    <div style={{position: 'absolute', right: portrait ? w * 0.06 : w * 0.05, bottom: portrait ? h * 0.06 : h * 0.08, width: portrait ? w * 0.88 : Math.min(w * 0.34, 640 * u), background: ISO.boardTop, border: `${2 * u}px solid ${ISO.ink}`, borderRadius: 12 * u, padding: 26 * u, opacity: endK, transform: `translateY(${(1 - endK) * 30 * u}px)`, boxShadow: `0 ${12 * u}px ${34 * u}px rgba(46,37,34,0.25)`}}>
      <div style={{fontFamily: lf.jost, fontWeight: 700, fontSize: 40 * u, color: ISO.ink, letterSpacing: 1 * u}}>{title.toUpperCase()}</div>
      <div style={{height: 2 * u, background: ISO.ink, opacity: 0.25, margin: `${12 * u}px 0`}} />
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <span style={{fontFamily: lf.jost, fontWeight: 600, fontSize: 24 * u, color: ISO.ink, letterSpacing: 2 * u}}>{totalLabel.toUpperCase()}</span>
        <span style={{fontFamily: lf.jost, fontWeight: 400, fontSize: 52 * u, color: ISO.ink}}>{total}</span>
      </div>
      <div style={{fontFamily: lf.jost, fontWeight: 500, fontSize: 17 * u, color: ISO.ink, opacity: 0.55, marginTop: 8 * u, letterSpacing: 2 * u}}>NOT TO SCALE</div>
    </div>
  );

  return (
    <AbsoluteFill style={{background: palette.ground, overflow: 'hidden'}}>
      {/* faint iso dot lattice */}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="idb-dots" width={46 * u} height={27 * u} patternUnits="userSpaceOnUse">
            <circle cx={2 * u} cy={2 * u} r={1.4 * u} fill={ISO.ink} opacity={0.08} />
            <circle cx={25 * u} cy={15 * u} r={1.4 * u} fill={ISO.ink} opacity={0.08} />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#idb-dots)" />
        {/* board drop shadow */}
        <ellipse cx={w / 2} cy={(portrait ? h * 0.44 : h * 0.5) + S * k * 0.56} rx={S * k * ISO_HACK} ry={S * k * 0.5} fill={ISO.ink} opacity={0.12 * boardIn} style={{filter: `blur(${18 * u}px)`}} />
        <IsoPolys ctx={ctx} />
        {routeD && <path d={routeD} fill="none" stroke={ISO.ink} strokeWidth={2.4 * u} strokeDasharray={`${10 * u} ${8 * u}`} />}
        {pinEls}
      </svg>
      {/* title chip */}
      <div style={{position: 'absolute', left: w * 0.05, top: h * 0.055, opacity: eo3(seg(frame, 6, 18))}}>
        <div style={{fontFamily: lf.jost, fontWeight: 700, fontSize: (portrait ? 52 : 58) * u, color: ISO.ink, letterSpacing: 1 * u}}>{title.toUpperCase()}</div>
        <div style={{width: 64 * u, height: 5 * u, background: palette.subject, marginTop: 8 * u}} />
      </div>
      {legend}
    </AbsoluteFill>
  );
};

const ISO_HACK = 1.75;

export const isoDioramaBoard = defineMotion<Props>({
  id: 'iso-diorama-board',
  title: 'Iso diorama board',
  category: 'map',
  description:
    'A floating flat-isometric diorama board (cream top, soil strata and a blue water corner on its front edges) builds up: stations drop in with a squash — farm, plant, port, city — trees pop, then a dashed ink route draws far-to-near with a red subject cube riding it; label pins with values pop at each stop and a legend card locks the total. Flat three-tone shading, no outlines.',
  source: ['lemo-opuscar styles/iso-infographic (MIT, LemoLab) — engine.js projection/tri, world.js board, DEMO.md'],
  useFor: 'Supply chains, onboarding flows, product journeys, "how X works" explainers as one premium map.',
  durationInFrames: 300,
  defaultProps: {
    title: 'From bean to cup',
    stations: [
      {pos: [0.16, 0.84], label: 'Harvest', value: '1,600', unit: 'm', kind: 'farm'},
      {pos: [0.6, 0.78], label: 'Dry', value: '21', unit: 'days', kind: 'plant'},
      {pos: [0.82, 0.34], label: 'Ship', value: '10,500', unit: 'km', kind: 'port'},
      {pos: [0.42, 0.3], label: 'Roast', value: '220', unit: '°C', kind: 'shop'},
      {pos: [0.14, 0.18], label: 'Cup', value: '70', unit: 'beans', kind: 'city'},
    ],
    total: '11,000 km',
    totalLabel: 'Total',
    bpm: 100,
    palette: {ground: ISO.ground, boardTop: ISO.boardTop, sea: ISO.sea[0], subject: ISO.subject[0]},
    seed: 7,
    zoomOut: true,
  },
  propDocs: {
    title: 'board title (top-left and on the legend)',
    stations: 'route stops in order: {pos [x,y] 0..1 on the board, label, value, unit, kind farm|plant|port|city|shop}',
    total: 'legend total value',
    totalLabel: 'legend total label',
    bpm: 'pace of the route (one leg ≈ 2.2 beats)',
    palette: 'ground, boardTop, sea and subject (accent) colours',
    seed: 'tree / route-curve seed',
    zoomOut: 'pull back to the legend card at the end',
  },
  component: IsoDioramaBoard,
  tags: ['isometric', 'iso', 'map', 'diorama', 'board', 'route', 'journey', 'supply chain', 'infographic', 'stations', 'pins', 'flat', 'kurzgesagt', 'explainer', 'process'],
});
