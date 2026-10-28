import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {CameraRig, fbm2, h01, noiseTexture, Stage3D, V3} from '../../core/three-kit';
import {defineMotion} from '../../core/types';

/**
 * video3 "Same blueprint, two renderers" (Three.js side): a glowing amber wireframe galleon lifts out of
 * a parchment blueprint part by part (keel → ribs → wales → deck → castles → masts → yards/rigging →
 * sail grids) with draw-on heads and golden sparks, then hull strips materialise white-hot and cool to
 * dark wood, sails fill with canvas, the wire fades, all on a slow orbiting camera.
 */

type Props = {
  background: string;
  paper: string;
  ink: string;
  wire: string;
  hot: string;
  wood: string;
  stripe: string;
  sail: string;
  spark: string;
  lineWidth: number;
  sparks: number;
  orbit: number;
  /** blueprint (default: parchment + materialising galleon) | holo (cyan hologram wireframe on a projector pad, scan plane, no solids) */
  variant: 'blueprint' | 'holo';
  /** holo: wire hue in degrees (188 = cyan) */
  hue: number;
  /** holo: projector pad rings + scan plane */
  pad: boolean;
};

type Poly = {pts: V3[]; a: number; b: number}; // draw window in frames
type Patch = {q: [V3, V3, V3, V3]; col: string; at: number};

// ------------------------------------------------------------------------------------------------
// procedural galleon
// ------------------------------------------------------------------------------------------------
const L = 10; // length along x
const KEEL_Y = 0.42;
const DECK_Y = 2.5;
const beam = (s: number) => (s >= 0 ? 1.45 * Math.pow(Math.max(0, 1 - Math.pow(s, 2.4)), 0.62) : 1.45 * Math.pow(Math.max(0, 1 - Math.pow(-s * 0.93, 5)), 0.5));
const keelY = (s: number) => KEEL_Y + (s > 0.55 ? Math.pow((s - 0.55) / 0.45, 2) * 1.7 : 0) + (s < -0.9 ? ((-s - 0.9) / 0.1) * 0.5 : 0);
const sect = (yy: number) => Math.pow(Math.sin((Math.PI / 2) * clamp(yy)), 0.55);
const hullPt = (s: number, yy: number, side: number): V3 => {
  const yk = keelY(s);
  const y = yk + yy * (DECK_Y - yk);
  return [s * (L / 2), y, side * beam(s) * sect(yy)];
};

const buildShip = () => {
  const polys: Poly[] = [];
  const patches: Patch[] = [];
  const P = (pts: V3[], a: number, b: number) => polys.push({pts, a, b});
  // keel + stem + sternpost
  const keel: V3[] = [];
  for (let i = 0; i <= 30; i++) {
    const s = -0.98 + (i / 30) * 1.97;
    keel.push([s * (L / 2), keelY(s), 0]);
  }
  keel.push([L / 2 + 0.25, DECK_Y + 0.5, 0]);
  P(keel, 18, 42);
  P([[-L / 2 * 0.98, keelY(-0.98), 0], [-L / 2 - 0.1, DECK_Y + 0.2, 0]], 30, 42);
  // ribs
  const ST = 15;
  for (let i = 0; i < ST; i++) {
    const s = -0.88 + (i / (ST - 1)) * 1.7;
    const pts: V3[] = [];
    for (let k = 0; k <= 16; k++) {
      const yy = 1 - k / 16;
      pts.push(hullPt(s, yy, -1));
    }
    for (let k = 1; k <= 16; k++) pts.push(hullPt(s, k / 16, 1));
    const a = 32 + i * 3.4;
    P(pts, a, a + 14);
  }
  // wales (longitudinal lines)
  const levels = [0.12, 0.28, 0.45, 0.62, 0.78, 0.9, 1];
  levels.forEach((yy, li) => {
    for (const side of [-1, 1]) {
      const pts: V3[] = [];
      for (let i = 0; i <= 28; i++) pts.push(hullPt(-0.97 + (i / 28) * 1.95, yy, side));
      const a = 62 + li * 3.5 + (side > 0 ? 2 : 0);
      P(pts, a, a + 20);
    }
  });
  // deck beams
  for (let i = 0; i < 9; i++) {
    const s = -0.8 + (i / 8) * 1.5;
    const b = beam(s);
    P([[s * (L / 2), DECK_Y, -b], [s * (L / 2), DECK_Y, b]], 78 + i * 1.6, 88 + i * 1.6);
  }
  // stern castle (two tiers) + forecastle as wire boxes
  const box = (x0: number, x1: number, y0: number, y1: number, zw: number, a: number) => {
    const c: V3[] = [
      [x0, y0, -zw],
      [x1, y0, -zw],
      [x1, y0, zw],
      [x0, y0, zw],
      [x0, y1, -zw],
      [x1, y1, -zw],
      [x1, y1, zw],
      [x0, y1, zw],
    ];
    const e = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
    e.forEach(([p, q], k) => P([c[p], c[q]], a + k * 0.8, a + 8 + k * 0.8));
    // rail posts on top
    const n = Math.round((x1 - x0) / 0.32);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      for (const sd of [-1, 1]) P([[x, y1, sd * zw], [x, y1 + 0.32, sd * zw]], a + 10 + i * 0.4, a + 15 + i * 0.4);
    }
    for (const sd of [-1, 1]) P([[x0, y1 + 0.32, sd * zw], [x1, y1 + 0.32, sd * zw]], a + 12, a + 22);
    return c;
  };
  box(-L / 2 - 0.05, -L / 2 + 1.9, DECK_Y, DECK_Y + 1.25, beam(-0.8) * 0.96, 92);
  box(-L / 2 + 0.05, -L / 2 + 1.05, DECK_Y + 1.25, DECK_Y + 2.05, beam(-0.85) * 0.8, 100);
  box(L / 2 - 1.75, L / 2 - 0.55, DECK_Y, DECK_Y + 0.75, beam(0.75) * 0.95, 98);
  // deck rails
  for (const sd of [-1, 1]) {
    const pts: V3[] = [];
    for (let i = 0; i <= 16; i++) {
      const s = -0.6 + (i / 16) * 1.25;
      pts.push([s * (L / 2), DECK_Y + 0.35, sd * beam(s)]);
    }
    P(pts, 96, 112);
  }
  // masts, yards, rigging, sail grids
  const masts = [
    {x: 2.6, h: 6.4, yw: 1.55},
    {x: -0.1, h: 7.6, yw: 1.9},
    {x: -2.7, h: 5.9, yw: 1.45},
  ];
  const sails: {x: number; y0: number; y1: number; w0: number; w1: number; at: number}[] = [];
  masts.forEach((m, i) => {
    const a = 108 + i * 5;
    P([[m.x, DECK_Y, 0], [m.x, DECK_Y + m.h, 0]], a, a + 16);
    const yards = [DECK_Y + m.h * 0.42, DECK_Y + m.h * 0.72, DECK_Y + m.h * 0.94];
    yards.forEach((y, k) => {
      const w = m.yw * (1 - k * 0.22);
      P([[m.x, y, -w], [m.x, y, w]], a + 12 + k * 2, a + 20 + k * 2);
    });
    // shrouds and stays
    for (const sd of [-1, 1]) {
      const bx = m.x;
      P([[m.x, DECK_Y + m.h * 0.92, 0], [bx - 0.4, DECK_Y + 0.35, sd * beam(bx / (L / 2))]], a + 18, a + 30);
      P([[m.x, DECK_Y + m.h * 0.92, 0], [bx + 0.4, DECK_Y + 0.35, sd * beam(bx / (L / 2))]], a + 19, a + 31);
    }
    sails.push({x: m.x, y0: yards[0] - 0.05, y1: yards[1] - 0.15, w0: m.yw * 0.95, w1: m.yw * 0.78 * 0.95, at: a + 20});
    sails.push({x: m.x, y0: yards[1] - 0.05, y1: yards[2] - 0.12, w0: m.yw * 0.78 * 0.95, w1: m.yw * 0.56 * 0.95, at: a + 24});
  });
  P([[masts[0].x, DECK_Y + masts[0].h * 0.95, 0], [L / 2 + 0.25, DECK_Y + 0.5, 0], [L / 2 + 2.2, DECK_Y + 1.6, 0]], 128, 140);
  P([[masts[1].x, DECK_Y + masts[1].h * 0.95, 0], [masts[0].x, DECK_Y + masts[0].h * 0.95, 0]], 130, 140);
  P([[masts[2].x, DECK_Y + masts[2].h * 0.95, 0], [masts[1].x, DECK_Y + masts[1].h * 0.95, 0]], 131, 141);
  // sail surface (bowed toward +x) and grid lines
  const sailPt = (sl: (typeof sails)[number], u: number, v: number): V3 => {
    const w = lerp(sl.w0, sl.w1, v);
    const bow = 0.3 * Math.sin(Math.PI * clamp(u)) * Math.sin(Math.PI * (0.15 + 0.7 * v));
    return [sl.x + 0.12 + bow, lerp(sl.y0, sl.y1, v), (u * 2 - 1) * w];
  };
  sails.forEach((sl, si) => {
    for (let k = 0; k <= 4; k++) {
      const pts: V3[] = [];
      for (let q = 0; q <= 10; q++) pts.push(sailPt(sl, q / 10, k / 4));
      P(pts, sl.at + k, sl.at + k + 8);
    }
    for (let k = 0; k <= 6; k++) {
      const pts: V3[] = [];
      for (let q = 0; q <= 6; q++) pts.push(sailPt(sl, k / 6, q / 6));
      P(pts, sl.at + 3 + k * 0.6, sl.at + 11 + k * 0.6);
    }
    // canvas patches
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 6; c++) {
        const u0 = c / 6;
        const u1 = (c + 1) / 6;
        const v0 = r / 4;
        const v1 = (r + 1) / 4;
        patches.push({q: [sailPt(sl, u0, v0), sailPt(sl, u1, v0), sailPt(sl, u1, v1), sailPt(sl, u0, v1)], col: 'sail', at: 192 + si * 2 + r * 3 + h01(si, r, c) * 4});
      }
  });
  // hull skin patches: wave stern -> bow
  const NS = 28;
  for (let i = 0; i < NS; i++) {
    const s0 = -0.97 + (i / NS) * 1.95;
    const s1 = -0.97 + ((i + 1) / NS) * 1.95;
    for (let l = 0; l < levels.length; l++) {
      const y0 = l === 0 ? 0 : levels[l - 1];
      const y1 = levels[l];
      for (const side of [-1, 1]) {
        const col = l === 4 ? 'stripe' : 'wood';
        patches.push({q: [hullPt(s0, y0, side), hullPt(s1, y0, side), hullPt(s1, y1, side), hullPt(s0, y1, side)], col, at: 140 + i * 1.5 + l * 1.2 + h01(i, l, side) * 3});
      }
    }
  }
  // deck
  for (let i = 0; i < 14; i++) {
    const s0 = -0.92 + (i / 14) * 1.82;
    const s1 = -0.92 + ((i + 1) / 14) * 1.82;
    patches.push({q: [[s0 * 5, DECK_Y, -beam(s0)], [s1 * 5, DECK_Y, -beam(s1)], [s1 * 5, DECK_Y, beam(s1)], [s0 * 5, DECK_Y, beam(s0)]], col: 'deck', at: 168 + i * 1.2});
  }
  // castle walls
  const wall = (x0: number, x1: number, y0: number, y1: number, zw: number, at: number) => {
    const c: V3[][] = [
      [[x0, y0, zw], [x1, y0, zw], [x1, y1, zw], [x0, y1, zw]],
      [[x1, y0, -zw], [x0, y0, -zw], [x0, y1, -zw], [x1, y1, -zw]],
      [[x0, y0, -zw], [x0, y0, zw], [x0, y1, zw], [x0, y1, -zw]],
      [[x1, y0, zw], [x1, y0, -zw], [x1, y1, -zw], [x1, y1, zw]],
      [[x0, y1, zw], [x1, y1, zw], [x1, y1, -zw], [x0, y1, -zw]],
    ];
    c.forEach((q, k) => patches.push({q: q as Patch['q'], col: 'wood', at: at + k * 2}));
  };
  wall(-L / 2 - 0.05, -L / 2 + 1.9, DECK_Y, DECK_Y + 1.25, beam(-0.8) * 0.96, 178);
  wall(-L / 2 + 0.05, -L / 2 + 1.05, DECK_Y + 1.25, DECK_Y + 2.05, beam(-0.85) * 0.8, 184);
  wall(L / 2 - 1.75, L / 2 - 0.55, DECK_Y, DECK_Y + 0.75, beam(0.75) * 0.95, 182);
  patches.sort((a, b) => a.at - b.at);
  return {polys, patches, masts};
};

// blueprint ink drawing laid on the paper (static)
const blueprintInk = (): V3[][] => {
  const out: V3[][] = [];
  const y = 0.006;
  const W = 9.3;
  const D = 6.1;
  const rect = (x0: number, z0: number, x1: number, z1: number) => out.push([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]]);
  rect(-W, -D, W, D);
  rect(-W + 0.25, -D + 0.25, W - 0.25, D - 0.25);
  // ship plan (top view) offset toward the viewer, plus side elevation behind
  for (const sd of [-1, 1]) {
    const pts: V3[] = [];
    for (let i = 0; i <= 40; i++) {
      const s = -0.98 + (i / 40) * 1.98;
      pts.push([s * 5, y, sd * beam(s) * 1.0 + 0]);
    }
    out.push(pts);
  }
  out.push([[-5.6, y, 0], [5.9, y, 0]]);
  for (let i = 0; i < 15; i++) {
    const s = -0.88 + (i / 14) * 1.7;
    out.push([[s * 5, y, -beam(s)], [s * 5, y, beam(s)]]);
  }
  // side elevation on the far part of the sheet
  const ez = -4.3;
  const el: V3[] = [];
  for (let i = 0; i <= 30; i++) {
    const s = -0.98 + (i / 30) * 1.97;
    el.push([s * 4, y, ez + (keelY(s) - KEEL_Y) * 0.45]);
  }
  out.push(el);
  out.push([[-4.1, y, ez - 0.9], [4.3, y, ez - 0.9]]);
  out.push([[-4, y, ez + 0.1], [-4.1, y, ez - 0.9]]);
  out.push([[3.9, y, ez + 0.75], [4.3, y, ez - 0.9]]);
  // dimension line
  out.push([[-5, y, 3.0], [5, y, 3.0]]);
  for (const x of [-5, 5]) out.push([[x, y, 2.8], [x, y, 3.2]]);
  // compass rose (bottom-left)
  const cx = -7.4;
  const cz = 3.9;
  for (const r of [0.9, 0.75]) {
    const pts: V3[] = [];
    for (let i = 0; i <= 48; i++) pts.push([cx + Math.cos((i / 48) * Math.PI * 2) * r, y, cz + Math.sin((i / 48) * Math.PI * 2) * r]);
    out.push(pts);
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const r = k % 2 ? 0.7 : 1.15;
    const b = a + Math.PI / 8;
    const b2 = a - Math.PI / 8;
    out.push([[cx + Math.cos(b) * 0.2, y, cz + Math.sin(b) * 0.2], [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], [cx + Math.cos(b2) * 0.2, y, cz + Math.sin(b2) * 0.2]]);
  }
  // title cartouche (top-right) with "text" strokes
  rect(5.6, -5.6, 8.9, -4.2);
  for (let k = 0; k < 3; k++) out.push([[5.9, y, -5.25 + k * 0.32], [8.6 - k * 0.6, y, -5.25 + k * 0.32]]);
  // hatching grid
  for (let k = -8; k <= 8; k += 2) out.push([[k, y, 5.2], [k + 0.6, y, 5.6]]);
  return out;
};

// ------------------------------------------------------------------------------------------------
// three objects
// ------------------------------------------------------------------------------------------------
const useLineObj = (width: number, color: string, opacity: number, additive: boolean, w: number, h: number) =>
  useMemo(() => {
    const geo = new LineSegmentsGeometry();
    const mat = new LineMaterial({linewidth: width, color: new THREE.Color(color).getHex(), transparent: true, opacity, vertexColors: true, depthWrite: false});
    if (additive) mat.blending = THREE.AdditiveBlending;
    mat.resolution.set(w, h);
    const obj = new LineSegments2(geo, mat);
    obj.frustumCulled = false;
    return obj;
  }, [width, color, additive, w, h]);

const WireframeBuild: React.FC<Props> = ({background: bg0, paper, ink, wire: wire0, hot: hot0, wood, stripe, sail, spark: spark0, lineWidth, sparks, orbit, variant, hue, pad}) => {
  const frame = useCurrentFrame();
  const holo = variant === 'holo';
  const background = holo ? '#02080c' : bg0;
  const wire = holo ? `hsl(${hue}, 100%, 62%)` : wire0;
  const hot = holo ? '#e6ffff' : hot0;
  const spark = holo ? `hsl(${hue}, 100%, 78%)` : spark0;
  const {w, h, u, portrait} = useStage();
  const ship = useMemo(() => buildShip(), []);
  const inkLines = useMemo(() => blueprintInk(), []);
  const paperTex = useMemo(
    () =>
      noiseTexture(256, (x, y) => 0.5 + 0.5 * fbm2('paper', x * 5, y * 5, 5), (v) => {
        const a = new THREE.Color('#ffffff');
        const b = new THREE.Color('#d9ccb6');
        const c = b.lerp(a, v);
        return [c.r, c.g, c.b, 1];
      }),
    [],
  );

  // wire fade-out after materialising
  const wireAlpha = holo ? 1 : 1 - 0.85 * prog(frame, 205, 245, ease.inOut);

  // ---- line positions for this frame ----
  const {pos, colA} = useMemo(() => {
    const p: number[] = [];
    const c: number[] = [];
    const wc = new THREE.Color(wire);
    const hc = new THREE.Color(hot);
    const tmp = new THREE.Color();
    for (const poly of ship.polys) {
      const d = clamp((frame - poly.a) / (poly.b - poly.a));
      if (d <= 0) continue;
      // lift: drawn flat on the plan first, then rises
      const lift = ease.out(clamp((frame - (poly.a + (poly.b - poly.a) * 0.55)) / 14));
      const n = poly.pts.length - 1;
      const tip = d * n;
      const heat = 1 - clamp((frame - poly.b) / 14);
      tmp.copy(wc).lerp(hc, 0.75 * heat);
      for (let i = 0; i < n; i++) {
        if (i >= tip) break;
        const f = Math.min(1, tip - i);
        const A = poly.pts[i];
        const B = poly.pts[i + 1];
        const Bx: V3 = [lerp(A[0], B[0], f), lerp(A[1], B[1], f), lerp(A[2], B[2], f)];
        const yA = 0.01 + (A[1] - 0.01) * lift;
        const yB = 0.01 + (Bx[1] - 0.01) * lift;
        p.push(A[0], yA, A[2], Bx[0], yB, Bx[2]);
        const headK = i + 1 >= tip - 1 && d < 1 ? 1 : 0;
        const cc = headK ? hc : tmp;
        c.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b);
      }
    }
    if (p.length === 0) p.push(0, -10, 0, 0, -10, 0) && c.push(0, 0, 0, 0, 0, 0);
    return {pos: new Float32Array(p), colA: new Float32Array(c)};
  }, [frame, ship, wire, hot]);

  const glow = useLineObj(lineWidth * 7 * u, '#ffffff', 0.22, true, w, h);
  const mid = useLineObj(lineWidth * 3 * u, '#ffffff', 0.45, true, w, h);
  const core = useLineObj(lineWidth * 1.1 * u, '#ffffff', 0.95, false, w, h);
  useLayoutEffect(() => {
    for (const o of [glow, mid, core]) {
      const g = new LineSegmentsGeometry();
      g.setPositions(pos);
      g.setColors(colA);
      o.geometry.dispose();
      o.geometry = g;
      o.computeLineDistances();
    }
    (glow.material as LineMaterial).opacity = 0.22 * wireAlpha;
    (mid.material as LineMaterial).opacity = 0.45 * wireAlpha;
    (core.material as LineMaterial).opacity = 0.95 * wireAlpha;
  }, [pos, colA, glow, mid, core, wireAlpha]);

  // ---- blueprint ink (static fat lines) ----
  const inkObj = useMemo(() => {
    const arr: number[] = [];
    for (const l of inkLines) for (let i = 0; i < l.length - 1; i++) arr.push(...l[i], ...l[i + 1]);
    const g = new LineSegmentsGeometry();
    g.setPositions(arr);
    const m = new LineMaterial({linewidth: 1.8 * u, color: new THREE.Color(ink).getHex(), transparent: true, opacity: 0.9});
    m.resolution.set(w, h);
    const o = new LineSegments2(g, m);
    o.frustumCulled = false;
    return o;
  }, [inkLines, ink, u, w, h]);

  // ---- materialised patches (lit) + heat overlay (additive) ----
  const patchGeo = useMemo(() => {
    const n = ship.patches.length;
    const P = new Float32Array(n * 18);
    const C = new Float32Array(n * 18);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    ship.patches.forEach((pt, i) => {
      const [a, b, c, d] = pt.q;
      [a, b, c, a, c, d].forEach((v, k) => P.set(v, i * 18 + k * 3));
    });
    g.computeVertexNormals();
    const heat = new THREE.BufferGeometry();
    heat.setAttribute('position', g.attributes.position);
    heat.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 18), 3));
    return {g, heat};
  }, [ship]);
  const revealed = ship.patches.filter((p) => p.at <= frame).length;
  useLayoutEffect(() => {
    const colMap: Record<string, THREE.Color> = {wood: new THREE.Color(wood), stripe: new THREE.Color(stripe), sail: new THREE.Color(sail), deck: new THREE.Color(wood).lerp(new THREE.Color('#6b4a2e'), 0.5)};
    const hc = new THREE.Color(hot);
    const C = patchGeo.g.attributes.color.array as Float32Array;
    const H = patchGeo.heat.attributes.color.array as Float32Array;
    const tmp = new THREE.Color();
    ship.patches.forEach((pt, i) => {
      const age = frame - pt.at;
      const heat = age < 0 ? 0 : 1 - clamp(age / 10);
      const base = colMap[pt.col] ?? colMap.wood;
      tmp.copy(base).lerp(hc, heat * 0.85);
      for (let k = 0; k < 6; k++) {
        C.set([tmp.r, tmp.g, tmp.b], i * 18 + k * 3);
        H.set([hc.r * heat * 1.1, hc.g * heat * 0.9, hc.b * heat * 0.7], i * 18 + k * 3);
      }
    });
    patchGeo.g.attributes.color.needsUpdate = true;
    patchGeo.heat.attributes.color.needsUpdate = true;
    patchGeo.g.setDrawRange(0, revealed * 6);
    patchGeo.heat.setDrawRange(0, revealed * 6);
  }, [frame, patchGeo, ship, revealed, wood, stripe, sail, hot]);

  // ---- sparks ----
  const sparkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparks * 3), 3));
    g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(sparks), 1));
    return g;
  }, [sparks]);
  const sparkMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {uCol: {value: new THREE.Color(spark)}, uPx: {value: 1}},
        vertexShader: `attribute float aA; varying float vA; uniform float uPx;
          void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uPx*(0.6+aA)/-mv.z; vA = aA; }`,
        fragmentShader: `uniform vec3 uCol; varying float vA;
          void main(){ float r = length(gl_PointCoord-0.5); if(r>0.5) discard; float a = smoothstep(0.5,0.0,r); gl_FragColor = vec4(uCol*(0.6+a), a*a*vA);
          #include <colorspace_fragment>
          }`,
      }),
    [spark],
  );
  useLayoutEffect(() => {
    const P = sparkGeo.attributes.position.array as Float32Array;
    const A = sparkGeo.attributes.aA.array as Float32Array;
    const polys = ship.polys;
    for (let i = 0; i < sparks; i++) {
      const poly = polys[Math.floor(h01(i, 1) * polys.length)];
      const born = poly.a + h01(i, 2) * (poly.b - poly.a) + h01(i, 7) * 20;
      const life = 18 + h01(i, 3) * 30;
      const age = frame - born;
      if (age < 0 || age > life || born > 230) {
        A[i] = 0;
        P.set([0, -50, 0], i * 3);
        continue;
      }
      const pt = poly.pts[Math.floor(h01(i, 4) * poly.pts.length)];
      const t = age / 30;
      P.set([pt[0] + Math.sin(t * 3 + i) * 0.15 + (h01(i, 5) - 0.5) * t * 0.6, pt[1] + t * (0.9 + h01(i, 6) * 1.2), pt[2] + Math.cos(t * 2.3 + i) * 0.15], i * 3);
      A[i] = Math.sin(Math.PI * (age / life)) * (0.55 + 0.45 * Math.sin(frame * 1.7 + i * 3));
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkGeo.attributes.aA.needsUpdate = true;
    sparkMat.uniforms.uPx.value = 70 * (h / 1080);
  }, [frame, sparkGeo, sparkMat, ship, sparks, u, h]);

  // ---- camera: slow orbit + push, target rises with the masts ----
  const t = prog(frame, 0, 300, ease.linear);
  const az = lerp(-38, -38 + orbit, ease.sine(t)) * (Math.PI / 180);
  const el = lerp(48, 17, ease.inOut(prog(frame, 0, 230, ease.linear))) * (Math.PI / 180);
  const dist = lerp(19, 17.5, ease.sine(t)) * (portrait ? 2.8 : 1);
  const tgt: V3 = [lerp(0, -0.3, t), lerp(0.4, 4.6, ease.inOut(prog(frame, 40, 240, ease.linear))), 0];
  const camPos: V3 = [tgt[0] + Math.sin(az) * Math.cos(el) * dist, tgt[1] + Math.sin(el) * dist, tgt[2] + Math.cos(az) * Math.cos(el) * dist];
  const fade = prog(frame, 0, 18, ease.out);
  const masts = prog(frame, 168, 186, ease.out);

  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{opacity: fade}}>
        <Stage3D>
          <CameraRig position={camPos} target={tgt} fov={38} />
          <ambientLight intensity={0.45} color="#ffe2bf" />
          <spotLight position={[2, 16, 6]} angle={0.62} penumbra={0.8} intensity={650} decay={2} color="#ffe4c0" />
          <directionalLight position={[-6, 8, 9]} intensity={0.9} color="#ffd9a8" />
          {/* parchment */}
          {!holo && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[19.5, 13]} />
              <meshStandardMaterial map={paperTex} color={paper} roughness={0.95} />
            </mesh>
          )}
          {holo && pad && (
            <group>
              {[[8.6, 8.75, 1], [6.4, 6.5, 0.55], [3.6, 3.66, 0.4]].map(([r0, r1, o], i) => (
                <mesh key={i} rotation={[-Math.PI / 2, 0, frame * 0.004 * (i % 2 ? -1 : 1)]} position={[0, 0.01, 0]}>
                  <ringGeometry args={[r0, r1, 96, 1, 0, i === 1 ? Math.PI * 1.6 : Math.PI * 2]} />
                  <meshBasicMaterial color={wire} transparent opacity={o * 0.7} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>
              ))}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5 + 7.5 * ease.inOut(prog(frame, 30, 235, ease.linear)), 0]}>
                <ringGeometry args={[5.2, 5.32, 96]} />
                <meshBasicMaterial color={hot} transparent opacity={0.8 * (1 - prog(frame, 240, 262))} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5 + 7.5 * ease.inOut(prog(frame, 30, 235, ease.linear)), 0]}>
                <circleGeometry args={[5.2, 64]} />
                <meshBasicMaterial color={wire} transparent opacity={0.07 * (1 - prog(frame, 240, 262))} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
          {!holo && <primitive object={inkObj} />}
          {/* keel blocks */}
          {!holo && Array.from({length: 7}, (_, i) => {
            const x = -3.9 + i * 1.3;
            const on = prog(frame, 24 + i * 2, 34 + i * 2, ease.out);
            return on > 0 ? (
              <mesh key={i} position={[x, 0.2 * on, 0]} scale={[0.5, 0.4 * on, 0.9]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#2a1a10" roughness={0.8} />
              </mesh>
            ) : null;
          })}
          {!holo && (<>
          <mesh geometry={patchGeo.g}>
            <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.75} metalness={0.05} />
          </mesh>
          <mesh geometry={patchGeo.heat}>
            <meshBasicMaterial vertexColors side={THREE.DoubleSide} transparent blending={THREE.AdditiveBlending} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
          </>)}
          {!holo && masts > 0 &&
            ship.masts.map((m, i) => (
              <mesh key={i} position={[m.x, DECK_Y + (m.h * masts) / 2, 0]} scale={[1, masts, 1]}>
                <cylinderGeometry args={[0.07, 0.11, m.h, 12]} />
                <meshStandardMaterial color={wood} roughness={0.7} />
              </mesh>
            ))}
          <primitive object={glow} />
          <primitive object={mid} />
          <primitive object={core} />
          <points geometry={sparkGeo} material={sparkMat} frustumCulled={false} />
        </Stage3D>
      </AbsoluteFill>
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 40%, rgba(5,3,2,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

export const wireframeBuild = defineMotion<Props>({
  id: 'wireframe-build',
  title: 'Wireframe build',
  category: '3d',
  description:
    'A glowing amber wireframe galleon lifts out of a parchment blueprint part by part with sparks, then hull strips flash white-hot and cool into dark wood and sails fill with canvas, under a slow orbiting camera.',
  source: ['video3 0:00-0:12', 'video9 sketch-to-render-reveal'],
  useFor: '"From plan to product" reveals, build/compile metaphors, engineering and making-of sequences.',
  durationInFrames: 300,
  defaultProps: {
    background: '#0b0907',
    paper: '#e6d8c0',
    ink: '#3a3026',
    wire: '#e2a35a',
    hot: '#fff2dc',
    wood: '#3a2718',
    stripe: '#8a2a22',
    sail: '#d8d2c0',
    spark: '#ffd79a',
    lineWidth: 1.4,
    sparks: 260,
    orbit: 70,
    variant: 'blueprint',
    hue: 188,
    pad: true,
  },
  propDocs: {
    background: 'void colour around the blueprint',
    paper: 'parchment tint',
    ink: 'blueprint ink colour',
    wire: 'wireframe glow colour (amber)',
    hot: 'white-hot colour of fresh lines / materialising strips',
    wood: 'hull wood colour',
    stripe: 'gunwale stripe colour',
    sail: 'sail canvas colour',
    spark: 'spark particle colour',
    lineWidth: 'core wire width in px at 1080',
    sparks: 'number of spark particles',
    orbit: 'camera orbit sweep in degrees',
    variant: "blueprint (default) | holo (hologram: hue-coloured additive wireframe grows through a glowing scan plane over a projector pad; no parchment, solids or masts)",
    hue: 'holo: wire hue in degrees (188 cyan, 38 amber, 300 magenta)',
    pad: 'holo: projector pad rings and the rising scan plane',
  },
  component: WireframeBuild,
  tags: ['3d', 'wireframe', 'blueprint', 'build', 'materialize', 'sparks', 'three', 'hologram', 'holo', 'scan', 'projector', 'cyan', 'sci-fi', 'spec scan'],
});
