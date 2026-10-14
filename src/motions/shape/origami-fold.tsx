import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, onTwos, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video1 origami-fold-sequence + crease-line-draw + paper-scrap-fall + paper-crane-flap.
 * A real flat-fold simulator: the sheet is a set of convex paper pieces (sheet-space polygon + affine transform);
 * every fold splits the pieces on a crease line and reflects the flap over it. A flap in motion is the fold primitive
 * p' = q + n·h·cosθ with lift z = h·sinθ (so in the tilted 3/4 view flap corners travel on arcs, shown by dotted
 * guides). Each fold is snappy (θ 0→90→180 on twos) followed by a hold. Sequence: crease X draws, diagonal fold, the
 * excess strip falls, pre-creases (fold / unfold), rotate to a diamond, tilt to 3/4, kite folds, narrowing, neck and
 * tail, head, sparkle, then the wings flap. direction 'unfold' plays the crane back to the flat sheet and highlights
 * the crease pattern.
 */
type Props = {
  direction: 'fold' | 'unfold';
  paperColor: string;
  backColor: string;
  creaseColor: string;
  highlightColor: string;
  inkColor: string;
  wall: string;
  sky: string;
  stepFrames: number;
  holdFrames: number;
  showArcGuides: boolean;
  dutchJitter: boolean;
  window: boolean;
  seed: number;
};

type V = [number, number];
type Mat = [number, number, number, number, number, number];
type Piece = {poly: V[]; M: Mat; flip: number; tags: string[]};
type Seg = {a: V; b: V; group: number};

const I: Mat = [1, 0, 0, 1, 0, 0];
const ap = (m: Mat, p: V): V => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
const mul = (a: Mat, b: Mat): Mat => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];
const inv = (m: Mat): Mat => {
  const det = m[0] * m[3] - m[1] * m[2];
  const a = m[3] / det;
  const b = -m[1] / det;
  const c = -m[2] / det;
  const d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
};
const reflectM = (a: V, d: V): Mat => {
  const r0 = 2 * d[0] * d[0] - 1;
  const r1 = 2 * d[0] * d[1];
  const r3 = 2 * d[1] * d[1] - 1;
  return [r0, r1, r1, r3, a[0] - (r0 * a[0] + r1 * a[1]), a[1] - (r1 * a[0] + r3 * a[1])];
};
const norm = (v: V): V => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
const area = (p: V[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s / 2);
};
/** keep the part of a convex polygon where (p - a)·n >= 0 */
const clipHalf = (poly: V[], a: V, n: V): V[] => {
  const out: V[] = [];
  const f = (p: V) => (p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const fp = f(p);
    const fq = f(q);
    if (fp >= 0) out.push(p);
    if ((fp >= 0) !== (fq >= 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
};
/** clip a segment to a convex polygon (Cyrus-Beck) */
const clipSeg = (a: V, b: V, poly: V[]): [V, V] | null => {
  let t0 = 0;
  let t1 = 1;
  const d: V = [b[0] - a[0], b[1] - a[1]];
  // polygon orientation
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  const sg = s >= 0 ? 1 : -1;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const n: V = [-(q[1] - p[1]) * sg, (q[0] - p[0]) * sg]; // inward normal
    const num = (a[0] - p[0]) * n[0] + (a[1] - p[1]) * n[1];
    const den = d[0] * n[0] + d[1] * n[1];
    if (Math.abs(den) < 1e-12) {
      if (num < 0) return null;
      continue;
    }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  if (t1 - t0 < 1e-4) return null;
  return [
    [a[0] + d[0] * t0, a[1] + d[1] * t0],
    [a[0] + d[0] * t1, a[1] + d[1] * t1],
  ];
};

type FoldSpec = {a: V; b: V; move: V; tags?: string[]; notTags?: string[]; region?: {a: V; b: V; keep: V}; back?: boolean; tag?: string; arc?: boolean};
type Split = {stay: Piece[]; moving: Piece[]; a: V; d: V; n: V; back: boolean};

const doFold = (geo: Piece[], f: FoldSpec): {split: Split; next: Piece[]; creases: [V, V][]} => {
  const d = norm([f.b[0] - f.a[0], f.b[1] - f.a[1]]);
  let n: V = [-d[1], d[0]];
  if ((f.move[0] - f.a[0]) * n[0] + (f.move[1] - f.a[1]) * n[1] < 0) n = [-n[0], -n[1]];
  const stay: Piece[] = [];
  const moving: Piece[] = [];
  const creases: [V, V][] = [];
  const far: V = [f.a[0] + d[0] * 50, f.a[1] + d[1] * 50];
  const far2: V = [f.a[0] - d[0] * 50, f.a[1] - d[1] * 50];
  for (const pc of geo) {
    const ok = (!f.tags || f.tags.some((t) => pc.tags.includes(t))) && (!f.notTags || !f.notTags.some((t) => pc.tags.includes(t)));
    if (!ok) {
      stay.push(pc);
      continue;
    }
    const Mi = inv(pc.M);
    const mp = pc.poly.map((p) => ap(pc.M, p));
    let inside = mp;
    if (f.region) {
      const rd = norm([f.region.b[0] - f.region.a[0], f.region.b[1] - f.region.a[1]]);
      let rn: V = [-rd[1], rd[0]];
      if ((f.region.keep[0] - f.region.a[0]) * rn[0] + (f.region.keep[1] - f.region.a[1]) * rn[1] < 0) rn = [-rn[0], -rn[1]];
      inside = clipHalf(mp, f.region.a, rn);
      const outside = clipHalf(mp, f.region.a, [-rn[0], -rn[1]]);
      if (outside.length > 2 && area(outside) > 1e-6) stay.push({...pc, poly: outside.map((p) => ap(Mi, p))});
    }
    if (inside.length < 3 || area(inside) < 1e-6) continue;
    const mv = clipHalf(inside, f.a, n);
    const st = clipHalf(inside, f.a, [-n[0], -n[1]]);
    if (st.length > 2 && area(st) > 1e-6) stay.push({...pc, poly: st.map((p) => ap(Mi, p))});
    if (mv.length > 2 && area(mv) > 1e-6) {
      const sheetPoly = mv.map((p) => ap(Mi, p));
      moving.push({...pc, poly: sheetPoly});
      const seg = clipSeg(ap(Mi, far2), ap(Mi, far), pc.poly);
      if (seg) creases.push(seg);
    }
  }
  const R = reflectM(f.a, d);
  const flipped = moving
    .slice()
    .reverse()
    .map((pc) => ({poly: pc.poly, M: mul(R, pc.M), flip: pc.flip ^ 1, tags: f.tag ? [...pc.tags, f.tag] : pc.tags}));
  const next = f.back ? [...flipped, ...stay] : [...stay, ...flipped];
  return {split: {stay, moving, a: f.a, d, n, back: !!f.back}, next, creases};
};

// diamond coords (T top, R right, B bottom, L left; half-diagonal 1) -> model/sheet coords
const S2 = Math.SQRT1_2;
const dm = (p: V): V => [(p[0] + p[1]) * S2, (-p[0] + p[1]) * S2];
const reflectPt = (p: V, a: V, b: V): V => ap(reflectM(a, norm([b[0] - a[0], b[1] - a[1]])), p);

type Entry =
  | {kind: 'enter' | 'creaseX' | 'rotate' | 'tilt' | 'scrap' | 'highlight' | 'hold'; start: number; dur: number; geo: number}
  | {kind: 'fold'; start: number; dur: number; op: number; reverse: boolean; arc: boolean; after: number; hideScrap: boolean}
  | {kind: 'flap'; start: number; dur: number; op: number; geo: number};

type OpSeg = Seg & {op: number};

const build = (stepF: number, holdF: number, direction: 'fold' | 'unfold') => {
  const s = S2;
  const strip = 0.42;
  const geos: Piece[][] = [
    [
      {poly: [[-s, -s], [s, -s], [s, s], [-s, s]], M: I, flip: 0, tags: ['sq']},
      {poly: [[-s, s], [s, s], [s, s + strip], [-s, s + strip]], M: I, flip: 0, tags: ['scrap']},
    ],
  ];
  const splits: Split[] = [];
  const creases: OpSeg[] = [];
  const fold = (from: number, f: FoldSpec, group: number) => {
    const r = doFold(geos[from], f);
    splits.push(r.split);
    const op = splits.length - 1;
    r.creases.forEach(([a, b]) => creases.push({a, b, group, op}));
    geos.push(r.next);
    return {op, from, to: geos.length - 1};
  };
  const push = (g: Piece[]) => {
    geos.push(g);
    return geos.length - 1;
  };
  // pre-crease phase (flat, frontal)
  const A = fold(0, {a: [-s, -s], b: [s, s], move: [s * 0.5, -s * 0.5], tags: ['sq']}, 0);
  const FL = push(geos[0].filter((p) => !p.tags.includes('scrap')));
  const B = fold(FL, {a: [s, -s], b: [-s, s], move: [-s * 0.5, -s * 0.5]}, 1);
  const C = fold(FL, {a: [-s, 0], b: [s, 0], move: [0, -s * 0.5]}, 2);
  const Dv = fold(FL, {a: [0, -s], b: [0, s], move: [-s * 0.5, 0]}, 2);
  // crane phase, specified in diamond coords
  const D = dm;
  const chain: {op: number; from: number; to: number; arc: boolean}[] = [];
  let g = FL;
  const cf = (f: FoldSpec, group: number) => {
    const r = fold(g, f, group);
    g = r.to;
    chain.push({...r, arc: !!f.arc});
    return r;
  };
  cf({a: D([0, 1]), b: D([-0.586, -0.414]), move: D([-1, 0]), arc: true}, 3);
  cf({a: D([0, 1]), b: D([0.586, -0.414]), move: D([1, 0]), arc: true}, 3);
  cf({a: D([0, -1]), b: D([-0.414, 0]), move: D([-0.55, -0.4]), arc: true}, 3);
  cf({a: D([0, -1]), b: D([0.414, 0]), move: D([0.55, -0.4]), arc: true}, 3);
  const lower = {a: D([-2, 0]), b: D([2, 0]), keep: D([0, 0.5])};
  cf({a: D([0, 1]), b: D([-0.234, -0.177]), move: D([-0.3, 0.1]), region: lower}, 4);
  cf({a: D([0, 1]), b: D([0.234, -0.177]), move: D([0.3, 0.1]), region: lower}, 4);
  const neckA: V = [-0.05, 0.24];
  const neckB: V = [-0.05 + 0.966, 0.24 - 0.259];
  const tailA: V = [0.05, 0.24];
  const tailB: V = [0.05 - 0.966, 0.24 - 0.259];
  cf({a: D(neckA), b: D(neckB), move: D([-0.02, 0.9]), region: {a: D([0, -2]), b: D([0, 2]), keep: D([-0.5, 0])}, tag: 'neck', arc: true}, 5);
  cf({a: D(tailA), b: D(tailB), move: D([0.02, 0.9]), region: {a: D([0, -2]), b: D([0, 2]), keep: D([0.5, 0])}, tag: 'tail', arc: true}, 5);
  const tip = reflectPt([0, 1], neckA, neckB);
  const v = norm([tip[0] - neckA[0], tip[1] - neckA[1]]);
  const wv: V = norm([-0.94, 0.42]);
  const hc: V = [neckA[0] + (tip[0] - neckA[0]) * 0.78, neckA[1] + (tip[1] - neckA[1]) * 0.78];
  const hd = norm([v[0] + wv[0], v[1] + wv[1]]);
  const hb: V = [hc[0] + hd[0], hc[1] + hd[1]];
  const head = cf({a: D(hc), b: D(hb), move: D(tip), tags: ['neck']}, 6);
  const beak = reflectPt(tip, hc, hb);
  const craneGeo = g;
  // wings: flap about a horizontal line through the body (never applied permanently)
  const flap = fold(craneGeo, {a: D([-2, -0.04]), b: D([2, -0.04]), move: D([0, -0.6]), notTags: ['neck', 'tail']}, 7);

  const E: Entry[] = [];
  let t = 0;
  const step = stepF + holdF;
  const add = (e: Entry) => {
    E.push(e);
    t = e.start + e.dur;
  };
  const fe = (op: number, reverse: boolean, after: number, arc = false, extra = 0, hideScrap = false) =>
    add({kind: 'fold', start: t, dur: step + extra, op, reverse, arc, after, hideScrap});
  if (direction === 'fold') {
    add({kind: 'enter', start: 0, dur: 10, geo: 0});
    add({kind: 'creaseX', start: t, dur: 12, geo: 0});
    fe(A.op, false, A.to);
    add({kind: 'scrap', start: t, dur: 14, geo: A.to});
    fe(A.op, true, FL, false, 0, true);
    for (const r of [B, C, Dv]) {
      fe(r.op, false, r.to);
      fe(r.op, true, FL);
    }
    add({kind: 'rotate', start: t, dur: step, geo: FL});
    add({kind: 'tilt', start: t, dur: step + 2, geo: FL});
    chain.forEach((c) => fe(c.op, false, c.to, c.arc, c.op === head.op ? 6 : 0));
    add({kind: 'flap', start: t, dur: 9999, op: flap.op, geo: craneGeo});
  } else {
    add({kind: 'flap', start: 0, dur: 40, op: flap.op, geo: craneGeo});
    add({kind: 'hold', start: t, dur: 4, geo: craneGeo});
    chain
      .slice()
      .reverse()
      .forEach((c) => fe(c.op, true, c.from, c.arc));
    add({kind: 'tilt', start: t, dur: step + 2, geo: FL});
    add({kind: 'rotate', start: t, dur: step, geo: FL});
    add({kind: 'highlight', start: t, dur: 9999, geo: FL});
  }
  return {geos, splits, E, creases, beak: D(beak), headOp: head.op, FL};
};

const XLINES: [V, V][] = [
  [
    [-S2, -S2],
    [S2, S2],
  ],
  [
    [S2, -S2],
    [-S2, S2],
  ],
];

const OrigamiFold: React.FC<Props> = ({direction, paperColor, backColor, creaseColor, highlightColor, inkColor, wall, sky, stepFrames, holdFrames, showArcGuides, dutchJitter, window: showWindow, seed}) => {
  const raw = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const frame = onTwos(raw, 2);
  const stepF = Math.max(2, Math.round(stepFrames));
  const holdF = Math.max(0, Math.round(holdFrames));
  const sim = useMemo(() => build(stepF, holdF, direction), [stepF, holdF, direction]);
  const {geos, splits, E, creases} = sim;
  const fwd = direction === 'fold';
  let ei = 0;
  for (let i = 0; i < E.length; i++) if (frame >= E[i].start) ei = i;
  const cur = E[ei];
  const lt = frame - cur.start;
  const find = (kd: Entry['kind']) => E.find((e) => e.kind === kd);
  // ---- view: rotate to diamond, tilt to 3/4, dutch re-frames, zoom
  const rotE = find('rotate')!;
  const tiltE = find('tilt')!;
  const rotP = clamp((frame - rotE.start) / stepF);
  const tiltP = clamp((frame - tiltE.start) / (stepF + 2));
  const rot = (fwd ? rotP : 1 - rotP) * 45;
  const tiltK = fwd ? ease.inOut(tiltP) : 1 - ease.inOut(tiltP);
  const craneE = E.filter((e) => e.kind === 'fold' && e.arc);
  const neckE = fwd ? craneE[4] : craneE[1];
  const relax = neckE ? (fwd ? prog(frame, neckE.start, neckE.start + 10, ease.inOut) : 1 - prog(frame, neckE.start, neckE.start + 10, ease.inOut)) : 0;
  const tilt = (((portrait ? 48 : 54) * Math.PI) / 180) * tiltK * (1 - 0.5 * relax);
  const enterP = fwd ? prog(frame, 0, 10, ease.out) : 1;
  const foldsDone = E.filter((e) => (e.kind === 'fold' || e.kind === 'flap') && frame >= e.start).length;
  const dutchSeq = [-5, -5, 4, 4, -3, -3, 3, 3, -2, -2, 3, 3, -3, -3, 2, 2, -2, -2, 2, 2, 0, 0, 0, 0, 0];
  const dutchDeg = dutchJitter ? (dutchSeq[Math.min(dutchSeq.length - 1, Math.floor(foldsDone / 2))] ?? 0) * tiltK - 2 * (1 - tiltK) : 0;
  const dutch = (dutchDeg * Math.PI) / 180;
  const zoom = 1 + 0.22 * tiltK + 0.06 * relax;
  const base = Math.min(w, h) * (portrait ? 0.36 : 0.4);
  const k = base * zoom;
  const ccx = cx;
  const ccy = cy + (fwd ? (1 - enterP) * -h * 0.7 : 0) + base * 0.06 * (1 - tiltK) - base * 0.02 * tiltK + base * 0.2 * relax;
  const enterRot = (1 - enterP) * 0.14;
  const ang = (rot * Math.PI) / 180 + enterRot;
  const cr = Math.cos(ang);
  const sr = Math.sin(ang);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const cd = Math.cos(dutch);
  const sd = Math.sin(dutch);
  const view = (p: V, z = 0): V => {
    const x = (p[0] * cr - p[1] * sr) * k;
    const y = (p[0] * sr + p[1] * cr) * k * ct - z * st * k;
    return [ccx + x * cd - y * sd, ccy + x * sd + y * cd];
  };
  // ---- creases visible now
  const vis: Seg[] = [];
  const cxE = find('creaseX');
  if (!fwd || (cxE && frame >= cxE.start + cxE.dur)) XLINES.forEach(([a, b], i) => vis.push({a, b, group: i}));
  if (!fwd) creases.forEach((c) => vis.push(c));
  else {
    const done = new Set<number>();
    E.forEach((e) => {
      if (e.kind === 'fold' && frame >= e.start + stepF) done.add(e.op);
    });
    creases.forEach((c) => done.has(c.op) && vis.push(c));
  }
  // ---- drawable polygons
  type Draw = {pts: V[]; face: number; moving: boolean; creases: [V, V][]; dots: V[]; scrap: boolean};
  const draws: Draw[] = [];
  const r = rng(seed);
  const speck: V[] = Array.from({length: 46}, () => [(r() - 0.5) * 1.42, (r() - 0.5) * 1.42]);
  const inPoly = (p: V, poly: V[]) => clipSeg(p, [p[0] + 1e-4, p[1] + 1e-4], poly) !== null;
  const pieceDraw = (pc: Piece, anim?: {sp: Split; th: number}): Draw => {
    const tf = (p: V): [V, number] => {
      const m = ap(pc.M, p);
      if (!anim) return [m, 0];
      const {a, n} = anim.sp;
      const c = Math.cos(anim.th);
      const hh = (m[0] - a[0]) * n[0] + (m[1] - a[1]) * n[1];
      return [[m[0] - n[0] * hh * (1 - c), m[1] - n[1] * hh * (1 - c)], hh * Math.sin(anim.th) * (anim.sp.back ? -1 : 1)];
    };
    const pv = (p: V) => {
      const [q, z] = tf(p);
      return view(q, z);
    };
    const pts = pc.poly.map(pv);
    let face = pc.flip;
    let moving = false;
    if (anim) {
      const c = Math.cos(anim.th);
      if (c < 0) face ^= 1;
      moving = Math.abs(c) < 0.87;
    }
    const cr2: [V, V][] = [];
    vis.forEach((cs) => {
      const sg = clipSeg(cs.a, cs.b, pc.poly);
      if (sg) cr2.push([pv(sg[0]), pv(sg[1])]);
    });
    const dots = anim ? [] : speck.filter((sp) => inPoly(sp, pc.poly)).map(pv);
    return {pts, face, moving, creases: cr2, dots, scrap: pc.tags.includes('scrap')};
  };
  let arcGuides: V[][] = [];
  let scrapT = -1;
  if (cur.kind === 'fold' && lt < stepF) {
    const sp = splits[cur.op];
    const u0 = clamp(lt / stepF);
    const th = Math.PI * (cur.reverse ? 1 - u0 : u0);
    sp.stay.filter((pc) => !(cur.hideScrap && pc.tags.includes('scrap'))).forEach((pc) => draws.push(pieceDraw(pc)));
    const mov = sp.moving.map((pc) => pieceDraw(pc, {sp, th}));
    if (sp.back) draws.unshift(...mov);
    else draws.push(...(Math.cos(th) < 0 ? mov.slice().reverse() : mov));
    if (showArcGuides && cur.arc && tilt > 0.1) {
      arcGuides = sp.moving.slice(-3).map((pc) => {
        let best = pc.poly[0];
        let bh = -1;
        for (const p of pc.poly) {
          const m = ap(pc.M, p);
          const hh = (m[0] - sp.a[0]) * sp.n[0] + (m[1] - sp.a[1]) * sp.n[1];
          if (hh > bh) {
            bh = hh;
            best = p;
          }
        }
        const m = ap(pc.M, best);
        const pts: V[] = [];
        for (let i = 0; i <= 28; i++) {
          const tt = (Math.PI * i) / 28;
          pts.push(view([m[0] - sp.n[0] * bh * (1 - Math.cos(tt)), m[1] - sp.n[1] * bh * (1 - Math.cos(tt))], bh * Math.sin(tt)));
        }
        return pts;
      });
    }
  } else if (cur.kind === 'flap') {
    const sp = splits[cur.op];
    const period = 16;
    const amp = 1.0;
    const fade = fwd ? 1 : 1 - prog(lt, 28, 40);
    const th = -amp * fade * (0.5 - 0.5 * Math.cos((lt / period) * Math.PI * 2)) * (fwd ? prog(lt, 0, 6) : 1) - 1e-4;
    sp.stay.forEach((pc) => draws.push(pieceDraw(pc)));
    const wings = sp.moving.map((pc) => pieceDraw(pc, {sp, th}));
    if (th < 0) draws.unshift(...wings);
    else draws.push(...wings);
  } else {
    const gi = cur.kind === 'fold' ? cur.after : cur.geo;
    if (cur.kind === 'scrap') scrapT = clamp(lt / cur.dur);
    geos[gi].forEach((pc) => draws.push(pieceDraw(pc)));
  }
  const xDraw = fwd && cxE && frame >= cxE.start && frame < cxE.start + cxE.dur ? [prog(frame, cxE.start, cxE.start + 5, (t) => t * (2 - t)), prog(frame, cxE.start + 4, cxE.start + 9, (t) => t * (2 - t))] : null;
  const hlE = find('highlight');
  const hl = !fwd && hlE && frame >= hlE.start ? frame - hlE.start : -1;
  const headE = E.find((e) => e.kind === 'fold' && e.op === sim.headOp && !e.reverse);
  const sparkF = headE && fwd ? frame - (headE.start + stepF) : -99;
  const beakP = view(sim.beak);
  const faceCol = (d: Draw) => (d.moving ? '#C9C1B0' : d.face ? backColor : paperColor);
  const sw = 1.6 * u;
  const scrapTr = (d: Draw) => {
    if (!d.scrap || scrapT < 0) return undefined;
    const c0 = d.pts.reduce((acc, p) => [acc[0] + p[0] / d.pts.length, acc[1] + p[1] / d.pts.length], [0, 0]);
    const dx = -0.12 * w * scrapT;
    const dy = 0.45 * h * scrapT * scrapT;
    const rr = -15 - 20 * scrapT;
    const sc = 1 - 0.2 * scrapT;
    return `translate(${dx} ${dy}) translate(${c0[0]} ${c0[1]}) rotate(${rr * clamp(scrapT * 3)}) scale(${sc}) translate(${-c0[0]} ${-c0[1]})`;
  };
  const ptsStr = (pts: V[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const allCreases: Seg[] = [...XLINES.map(([a, b], i) => ({a, b, group: i})), ...creases];
  return (
    <AbsoluteFill style={{background: wall}}>
      {showWindow && <WindowScene sky={sky} ink={inkColor} />}
      <Svg>
        <defs>
          <filter id="ori-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={10 * u} />
          </filter>
        </defs>
        <g filter="url(#ori-shadow)" opacity={0.22} transform={`translate(${16 * u} ${26 * u})`}>
          {draws.map((d, i) => (
            <polygon key={i} points={ptsStr(d.pts)} fill="#3A3226" transform={scrapTr(d)} />
          ))}
        </g>
        {draws.map((d, i) => (
          <g key={i} transform={scrapTr(d)}>
            <polygon points={ptsStr(d.pts)} fill={faceCol(d)} stroke={inkColor} strokeWidth={sw} strokeLinejoin="round" />
            {d.creases.map(([a, b], j) => (
              <line key={j} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={creaseColor} strokeWidth={1 * u} opacity={0.9} />
            ))}
            {d.dots.map((p, j) => (
              <circle key={j} cx={p[0]} cy={p[1]} r={0.9 * u} fill="#9C9384" opacity={0.5} />
            ))}
          </g>
        ))}
        {xDraw &&
          XLINES.map(([a0, b0], i) => {
            const a = view(a0);
            const b = view(b0);
            const t = xDraw[i];
            return <line key={i} x1={a[0]} y1={a[1]} x2={a[0] + (b[0] - a[0]) * t} y2={a[1] + (b[1] - a[1]) * t} stroke={creaseColor} strokeWidth={1.3 * u} />;
          })}
        {arcGuides.map((pts, i) => (
          <polyline key={i} points={ptsStr(pts)} fill="none" stroke={inkColor} strokeWidth={1 * u} strokeDasharray={`${2 * u} ${4 * u}`} opacity={0.4} />
        ))}
        {hl >= 0 &&
          geos[sim.FL].map((pc, pi) =>
            allCreases.map((cs, j) => {
              const sg = clipSeg(cs.a, cs.b, pc.poly);
              if (!sg) return null;
              const p = prog(hl, cs.group * 6, cs.group * 6 + 8, (t) => t * (2 - t));
              if (p <= 0) return null;
              const a = view(ap(pc.M, sg[0]));
              const b = view(ap(pc.M, sg[1]));
              return <line key={`${pi}-${j}`} x1={a[0]} y1={a[1]} x2={a[0] + (b[0] - a[0]) * p} y2={a[1] + (b[1] - a[1]) * p} stroke={highlightColor} strokeWidth={1.8 * u} />;
            }),
          )}
        {sparkF >= 0 && sparkF < 8 && <Sparkle x={beakP[0]} y={beakP[1]} size={(14 + 12 * Math.sin((sparkF / 8) * Math.PI)) * u} color="#FFF6D0" rotate={sparkF * 8} opacity={Math.sin((sparkF / 8) * Math.PI)} />}
      </Svg>
      <PaperTexture opacity={0.22} seed={seed} />
    </AbsoluteFill>
  );
};

const WindowScene: React.FC<{sky: string; ink: string}> = ({sky, ink}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const ww = portrait ? w * 0.84 : w * 0.6;
  const wh = portrait ? h * 0.7 : h * 0.8;
  const x0 = (w - ww) / 2;
  const y0 = portrait ? h * 0.08 : h * 0.04;
  const bar = 16 * u;
  const cloud = (x: number, y: number, s: number) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#F3F1EC">
      <ellipse cx={0} cy={0} rx={60 * u} ry={22 * u} />
      <ellipse cx={-30 * u} cy={-10 * u} rx={30 * u} ry={20 * u} />
      <ellipse cx={20 * u} cy={-16 * u} rx={34 * u} ry={24 * u} />
    </g>
  );
  const drift = frame * 0.25 * u;
  return (
    <Svg>
      <defs>
        <clipPath id="ori-win">
          <rect x={x0} y={y0} width={ww} height={wh} />
        </clipPath>
      </defs>
      <rect x={x0} y={y0} width={ww} height={wh} fill={sky} />
      <g clipPath="url(#ori-win)">
        {cloud(x0 + ww * 0.18 + drift, y0 + wh * 0.16, 1.2)}
        {cloud(x0 + ww * 0.78 + drift * 0.7, y0 + wh * 0.3, 0.8)}
        {/* branch with leaves */}
        <path d={`M ${x0 - 10 * u} ${y0 + wh * 0.12} L ${x0 + ww * 0.25} ${y0 + wh * 0.06} L ${x0 + ww * 0.45} ${y0 + wh * 0.09} L ${x0 + ww * 0.7} ${y0 + wh * 0.04}`} fill="none" stroke="#4A3B33" strokeWidth={5 * u} strokeLinecap="round" />
        {Array.from({length: 14}, (_, i) => {
          const t = i / 13;
          const bx = x0 + ww * 0.7 * t;
          const by = y0 + wh * (0.1 - 0.05 * t) + (i % 2 ? 10 : -12) * u;
          const sw = Math.sin(frame * 0.05 + i) * 6;
          return <ellipse key={i} cx={bx} cy={by} rx={12 * u} ry={6 * u} fill={i % 3 ? '#5E9A4E' : '#7DB463'} transform={`rotate(${(i % 2 ? 25 : -20) + sw} ${bx} ${by})`} />;
        })}
      </g>
      <g fill="#EFE8D8" stroke={ink} strokeWidth={2 * u}>
        <rect x={x0 - bar} y={y0 - bar} width={ww + bar * 2} height={bar} />
        <rect x={x0 - bar} y={y0 + wh} width={ww + bar * 2} height={bar * 1.6} />
        <rect x={x0 - bar} y={y0} width={bar} height={wh} />
        <rect x={x0 + ww} y={y0} width={bar} height={wh} />
        <rect x={x0 + ww / 2 - bar / 2} y={y0} width={bar} height={wh} />
        <rect x={x0} y={y0 + wh * 0.45 - bar / 2} width={ww} height={bar} />
        <rect x={x0 - bar * 3} y={y0 + wh + bar * 1.6} width={ww + bar * 6} height={bar * 0.9} />
      </g>
    </Svg>
  );
};

export const origamiFold = defineMotion<Props>({
  id: 'origami-fold',
  title: 'Origami fold sequence (paper crane)',
  category: 'shape',
  description: 'A paper sheet in front of a sunny window: crease lines draw on, the sheet folds in snappy 2-3 frame flap rotations (excess strip falls away, pre-creases, diamond, 3/4 tilt, kite and narrowing folds, neck, tail, head) into a crane that flaps its wings; reversible (unfold).',
  source: ['video1 0:03.3-0:11.25 origami-fold-sequence, crease-line-draw, paper-scrap-fall, paper-crane-flap', 'video1 1:58-1:02.6 reverse unfold + crease highlight'],
  useFor: 'Making / transformation / "step by step" stories, craft or paper themes, turning a plain idea into something that flies.',
  durationInFrames: 240,
  defaultProps: {
    direction: 'fold',
    paperColor: '#E6DECD',
    backColor: '#D1C9BB',
    creaseColor: '#BDB6A8',
    highlightColor: '#6773B5',
    inkColor: '#2A2630',
    wall: '#E2D8C1',
    sky: '#B7CDDC',
    stepFrames: 4,
    holdFrames: 4,
    showArcGuides: true,
    dutchJitter: true,
    window: true,
    seed: 3,
  },
  propDocs: {
    direction: "'fold' (sheet → crane, then flapping) | 'unfold' (crane flaps, unfolds back to the sheet, crease pattern highlights)",
    paperColor: 'front face colour',
    backColor: 'back face colour (≈8 % darker)',
    creaseColor: 'faint crease line colour',
    highlightColor: 'unfold mode: crease highlight colour',
    stepFrames: 'frames per flap rotation (2-3 at 24 fps measured; animated on twos)',
    holdFrames: 'hold frames after each fold',
    showArcGuides: 'dotted arc guides along flap-corner paths in the 3/4 view',
    dutchJitter: 'hard dutch-angle re-frames at fold-group boundaries',
    window: 'draw the sunny window backdrop',
  },
  component: OrigamiFold,
  tags: ['origami', 'paper', 'fold', 'crane', 'craft', 'step-by-step', 'transform'],
});
