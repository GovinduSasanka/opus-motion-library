// Shared helpers for the LB3-2 batch (white-model city, sun maths, colour utils).
// Original implementation; ideas from lemo-opuscar styles/white-model (MIT, LemoLab) — see THIRD_PARTY_NOTICES.md.
import {rng} from './random';

export type V3 = [number, number, number];
export type Rgb = [number, number, number];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const sstep = (a: number, b: number, x: number) => {
  if (a === b) return x >= b ? 1 : 0;
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [mixN(a[0], b[0], t), mixN(a[1], b[1], t), mixN(a[2], b[2], t)];
export const hexRgb = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return [parseInt(f.slice(0, 2), 16) / 255, parseInt(f.slice(2, 4), 16) / 255, parseInt(f.slice(4, 6), 16) / 255];
};
export const rgbCss = (c: Rgb) => {
  const q = (v: number) => Math.round(255 * Math.pow(clamp01(v), 1 / 1.15));
  return `rgb(${q(c[0])},${q(c[1])},${q(c[2])})`;
};

// ------------------------------------------------------------------ city model
export type Bld = {id: number; x: number; z: number; w: number; d: number; h: number; year: number; rank: number; tag: string; value: number};
export type City = {W: number; D: number; buildings: Bld[]; water: (x: number, z: number) => boolean};

/** procedural massing model: lot grid, one diagonal river inlay, a tall cluster near the centre. */
export const makeCity = (seed: number, W = 14, D = 9.4): City => {
  const r = rng(seed * 977 + 13);
  const pitch = 1.3;
  const nx = Math.floor(W / pitch);
  const nz = Math.floor(D / pitch);
  const th = 0.38;
  const water = (x: number, z: number) => {
    const s = x * Math.cos(th) + z * Math.sin(th) - 2.3 + Math.sin(z * 0.9 + 1.2) * 0.35;
    return Math.abs(s) < 0.55;
  };
  const buildings: Bld[] = [];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x = -W / 2 + (i + 0.5) * (W / nx) + (r() - 0.5) * 0.12;
      const z = -D / 2 + (j + 0.5) * (D / nz) + (r() - 0.5) * 0.12;
      const jitter = r();
      if (water(x, z) || jitter < 0.07) continue;
      const dist = Math.hypot(x + 0.6, z * 1.2);
      const peak = Math.exp(-(dist * dist) / 9);
      const h = 0.22 + (0.25 + 1.9 * peak) * (0.35 + 0.65 * r()) + (r() < 0.06 ? 0.9 : 0);
      const w = 0.62 + r() * 0.34;
      const d = 0.62 + r() * 0.34;
      const year = Math.round(1860 + Math.min(1, dist / 7) * 90 + (r() - 0.5) * 60);
      buildings.push({id: buildings.length, x, z, w, d, h, year, rank: r(), tag: h > 1.7 ? 'tower' : 'block', value: r()});
    }
  }
  // order ranks 0..1 by random value (stable)
  const order = [...buildings].sort((a, b) => a.rank - b.rank);
  order.forEach((b, k) => (b.rank = buildings.length > 1 ? k / (buildings.length - 1) : 0));
  return {W, D, buildings, water};
};

// ------------------------------------------------------------------ camera
export type Cam = {az: number; el: number; dist: number; target: V3; focal: number; cx: number; cy: number};

export const makeProjector = (c: Cam) => {
  const ca = Math.cos(c.el);
  const pos: V3 = [c.target[0] + c.dist * ca * Math.sin(c.az), c.target[1] + c.dist * Math.sin(c.el), c.target[2] + c.dist * ca * Math.cos(c.az)];
  const f: V3 = norm([c.target[0] - pos[0], c.target[1] - pos[1], c.target[2] - pos[2]]);
  const right = norm(cross(f, [0, 1, 0]));
  const up = cross(right, f);
  const project = (p: V3): [number, number, number] => {
    const d: V3 = [p[0] - pos[0], p[1] - pos[1], p[2] - pos[2]];
    const z = dot(d, f);
    return [c.cx + (c.focal * dot(d, right)) / z, c.cy - (c.focal * dot(d, up)) / z, z];
  };
  return {pos, project};
};
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ------------------------------------------------------------------ scene polygons
export type Poly = {pts: string; n: V3; c: V3; b: Bld | null; kind: 'roof' | 'side' | 'ground' | 'water'};

const pts = (ps: [number, number, number][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

export const groundCells = (city: City, project: (p: V3) => [number, number, number], cell = 0.5): Poly[] => {
  const out: Poly[] = [];
  const nx = Math.round(city.W / cell);
  const nz = Math.round(city.D / cell);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x0 = -city.W / 2 + i * cell;
      const z0 = -city.D / 2 + j * cell;
      const c: V3 = [x0 + cell / 2, 0, z0 + cell / 2];
      out.push({
        pts: pts([project([x0, 0, z0]), project([x0 + cell, 0, z0]), project([x0 + cell, 0, z0 + cell]), project([x0, 0, z0 + cell])]),
        n: [0, 1, 0],
        c,
        b: null,
        kind: city.water(c[0], c[2]) ? 'water' : 'ground',
      });
    }
  }
  return out;
};

/** plinth (dark slab under and around the model): returns top polygon + visible side polygons */
export const plinthPolys = (city: City, project: (p: V3) => [number, number, number], camPos: V3, margin = 0.6, depth = 0.55) => {
  const x0 = -city.W / 2 - margin;
  const x1 = city.W / 2 + margin;
  const z0 = -city.D / 2 - margin;
  const z1 = city.D / 2 + margin;
  const top = pts([project([x0, 0, z0]), project([x1, 0, z0]), project([x1, 0, z1]), project([x0, 0, z1])]);
  const sides: {pts: string; shade: number}[] = [];
  const defs: [V3, V3, V3, V3][] = [
    [[x0, 0, z1], [x1, 0, z1], [x1, -depth, z1], [x0, -depth, z1]],
    [[x1, 0, z1], [x1, 0, z0], [x1, -depth, z0], [x1, -depth, z1]],
    [[x1, 0, z0], [x0, 0, z0], [x0, -depth, z0], [x1, -depth, z0]],
    [[x0, 0, z0], [x0, 0, z1], [x0, -depth, z1], [x0, -depth, z0]],
  ];
  const normals: V3[] = [[0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0]];
  const centres: V3[] = [[0, 0, z1], [x1, 0, 0], [0, 0, z0], [x0, 0, 0]];
  defs.forEach((d, k) => {
    const v: V3 = [camPos[0] - centres[k][0], camPos[1] - centres[k][1], camPos[2] - centres[k][2]];
    if (dot(normals[k], v) > 0) sides.push({pts: pts(d.map((p) => project(p))), shade: k % 2 ? 0.7 : 1});
  });
  return {top, sides};
};

/** visible faces of all buildings, far to near. Each building yields sides then roof. */
export const buildingPolys = (city: City, project: (p: V3) => [number, number, number], camPos: V3, heightScale: (b: Bld) => number = () => 1): Poly[] => {
  const order = [...city.buildings].sort((a, b) => Math.hypot(b.x - camPos[0], b.z - camPos[2]) - Math.hypot(a.x - camPos[0], a.z - camPos[2]));
  const out: Poly[] = [];
  for (const b of order) {
    const hh = b.h * heightScale(b);
    if (hh <= 0.001) continue;
    const x0 = b.x - b.w / 2;
    const x1 = b.x + b.w / 2;
    const z0 = b.z - b.d / 2;
    const z1 = b.z + b.d / 2;
    const sides: [V3, [V3, V3, V3, V3]][] = [
      [[0, 0, 1], [[x0, 0, z1], [x1, 0, z1], [x1, hh, z1], [x0, hh, z1]]],
      [[1, 0, 0], [[x1, 0, z1], [x1, 0, z0], [x1, hh, z0], [x1, hh, z1]]],
      [[0, 0, -1], [[x1, 0, z0], [x0, 0, z0], [x0, hh, z0], [x1, hh, z0]]],
      [[-1, 0, 0], [[x0, 0, z0], [x0, 0, z1], [x0, hh, z1], [x0, hh, z0]]],
    ];
    for (const [n, q] of sides) {
      const c: V3 = [(q[0][0] + q[2][0]) / 2, hh / 2, (q[0][2] + q[2][2]) / 2];
      if (dot(n, [camPos[0] - c[0], camPos[1] - c[1], camPos[2] - c[2]]) <= 0) continue;
      out.push({pts: pts(q.map((p) => project(p))), n, c, b, kind: 'side'});
    }
    const roof: [V3, V3, V3, V3] = [[x0, hh, z0], [x1, hh, z0], [x1, hh, z1], [x0, hh, z1]];
    if (camPos[1] > hh) out.push({pts: pts(roof.map((p) => project(p))), n: [0, 1, 0], c: [b.x, hh, b.z], b, kind: 'roof'});
  }
  return out;
};

// ------------------------------------------------------------------ sun
export const parseClock = (s: string): number => {
  const m = /^(\d{1,2}):(\d{2})/.exec(s.trim());
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 720;
};
export const fmtClock = (min: number) => {
  const m = Math.round(min);
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** simplified NOAA solar position. Returns azimuth (radians, bearing from north clockwise) and elevation (radians). */
export const sunPosition = (lat: number, lon: number, date: string, minutes: number, tz: number) => {
  const dt = new Date(`${date}T00:00:00Z`);
  const y = dt.getUTCFullYear();
  const doy = Math.floor((dt.getTime() - Date.UTC(y, 0, 0)) / 86400000);
  const g = ((2 * Math.PI) / 365) * (doy - 1 + (minutes / 60 - 12) / 24);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const tst = minutes + eqt + 4 * lon - 60 * tz;
  const ha = ((tst / 4 - 180) * Math.PI) / 180;
  const la = (lat * Math.PI) / 180;
  const sinEl = Math.sin(la) * Math.sin(decl) + Math.cos(la) * Math.cos(decl) * Math.cos(ha);
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl)));
  const A = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(la) - Math.tan(decl) * Math.cos(la));
  return {az: A + Math.PI, el};
};

/** unit vector from a ground point toward the sun; world: x east, y up, z south */
export const sunVector = (az: number, el: number): V3 => [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];

/** is ground/roof point (x, y, z) inside the shadow of prism `b`? (exact: footprint swept along the shadow vector) */
export const inPrismShadow = (b: Bld, x: number, y: number, z: number, sun: V3): boolean => {
  if (y >= b.h || sun[1] <= 0.01) return false;
  const k = (b.h - y) / sun[1]; // horizontal shift of the cross-section at height y
  const vx = -sun[0] * k;
  const vz = -sun[2] * k;
  // need s in [0,1] with (x - s vx, z - s vz) inside footprint
  let lo = 0;
  let hi = 1;
  const axis = (q: number, v: number, a: number, c: number) => {
    if (Math.abs(v) < 1e-9) return q >= a && q <= c;
    let s0 = (q - c) / v;
    let s1 = (q - a) / v;
    if (s0 > s1) [s0, s1] = [s1, s0];
    lo = Math.max(lo, s0);
    hi = Math.min(hi, s1);
    return true;
  };
  if (!axis(x, vx, b.x - b.w / 2, b.x + b.w / 2)) return false;
  if (!axis(z, vz, b.z - b.d / 2, b.z + b.d / 2)) return false;
  return lo <= hi;
};

// ------------------------------------------------------------------ woodcut: tone analysis + form-following knife cuts
// Technique after lemo-opuscar styles/woodcut demo/engine (filter.js, hatch.js, knife.js) (MIT, LemoLab): structure-tensor
// orientation, Jobard-Lefer style streamlines, V-gouge knife profiles. Own deterministic implementation.
export type Cut = {px: number[]; py: number[]; nx: number[]; ny: number[]; wid: number[]; tone: number; cy: number; len: number; d: string};

const boxBlur = (src: Float32Array, W: number, H: number, r: number) => {
  if (r <= 0) return src;
  const tmp = new Float32Array(W * H);
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * W + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = acc / (2 * r + 1);
      acc += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < W; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) {
      out[y * W + x] = acc / (2 * r + 1);
      acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
    }
  }
  return out;
};

/** orientation field (angle along edges) from a tone grid in [0,1] */
export const orientationField = (tone: Float32Array, W: number, H: number, a0: number, tensorR = 4) => {
  const L = boxBlur(tone, W, H, 1);
  const at = (x: number, y: number) => L[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  const jxx = new Float32Array(W * H);
  const jxy = new Float32Array(W * H);
  const jyy = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      jxx[y * W + x] = gx * gx;
      jxy[y * W + x] = gx * gy;
      jyy[y * W + x] = gy * gy;
    }
  }
  const Jxx = boxBlur(jxx, W, H, tensorR);
  const Jxy = boxBlur(jxy, W, H, tensorR);
  const Jyy = boxBlur(jyy, W, H, tensorR);
  let maxTr = 1e-6;
  for (let i = 0; i < W * H; i++) maxTr = Math.max(maxTr, Jxx[i] + Jyy[i]);
  const vc = new Float32Array(W * H);
  const vs = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const tr = Math.max(0, Jxx[i] + Jyy[i]);
    const th = 0.5 * Math.atan2(2 * Jxy[i], Jxx[i] - Jyy[i]) + Math.PI / 2;
    const coh = tr > 1e-9 ? Math.sqrt((Jxx[i] - Jyy[i]) ** 2 + 4 * Jxy[i] ** 2) / tr : 0;
    const str = Math.min(1, Math.sqrt(tr / maxTr) * 6);
    const wgt = Math.min(1, coh * str);
    vc[i] = Math.cos(2 * th) * wgt + Math.cos(2 * a0) * (1 - wgt);
    vs[i] = Math.sin(2 * th) * wgt + Math.sin(2 * a0) * (1 - wgt);
  }
  const bc = boxBlur(vc, W, H, 2);
  const bs = boxBlur(vs, W, H, 2);
  const ang = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) ang[i] = 0.5 * Math.atan2(bs[i], bc[i]);
  return ang;
};

export type CutOpts = {sp: number; cell: number; lo: number; hi: number; seed: number; maxCuts: number};

export const cutPath = (px: number[], py: number[], nx: number[], ny: number[], wid: number[], m: number) => {
  let a = '';
  let b = '';
  for (let k = 0; k < m; k++) {
    const hw = wid[k] / 2;
    a += `${k ? 'L' : 'M'}${(px[k] + nx[k] * hw).toFixed(1)} ${(py[k] + ny[k] * hw).toFixed(1)}`;
    b = `L${(px[k] - nx[k] * hw).toFixed(1)} ${(py[k] - ny[k] * hw).toFixed(1)}` + b;
  }
  return a + b + 'Z';
};

/** trace evenly spaced streamlines over the frame (px units) and split them into knife cuts */
export const buildCuts = (tone: Float32Array, ang: Float32Array, AW: number, AH: number, w: number, h: number, o: CutOpts): Cut[] => {
  const r = rng(o.seed * 101 + 7);
  const sp = o.sp;
  const dsep = 0.62 * sp;
  const oc = Math.max(2, dsep);
  const OW = Math.ceil(w / oc) + 1;
  const OH = Math.ceil(h / oc) + 1;
  const occ = new Int32Array(OW * OH);
  const ix = (x: number) => Math.min(AW - 1, Math.max(0, Math.floor(x / o.cell)));
  const iy = (y: number) => Math.min(AH - 1, Math.max(0, Math.floor(y / o.cell)));
  const toneAt = (x: number, y: number) => tone[iy(y) * AW + ix(x)];
  const angAt = (x: number, y: number) => ang[iy(y) * AW + ix(x)];
  const blocked = (x: number, y: number, id: number) => {
    const cx = Math.floor(x / oc);
    const cy = Math.floor(y / oc);
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const xx = cx + i;
        const yy = cy + j;
        if (xx < 0 || yy < 0 || xx >= OW || yy >= OH) continue;
        const v = occ[yy * OW + xx];
        if (v && v !== id) return true;
      }
    }
    return false;
  };
  const mark = (x: number, y: number, id: number) => {
    const cx = Math.floor(x / oc);
    const cy = Math.floor(y / oc);
    if (cx >= 0 && cy >= 0 && cx < OW && cy < OH) occ[cy * OW + cx] = id;
  };
  const step = Math.max(2, sp * 0.45);
  const lines: [number, number][][] = [];
  const trace = (sx: number, sy: number, id: number, dir: number, maxN: number) => {
    const pts: [number, number][] = [];
    let x = sx;
    let y = sy;
    let px = Math.cos(angAt(x, y)) * dir;
    let py = Math.sin(angAt(x, y)) * dir;
    for (let n = 0; n < maxN; n++) {
      const a = angAt(x, y);
      let dx = Math.cos(a);
      let dy = Math.sin(a);
      if (dx * px + dy * py < 0) {
        dx = -dx;
        dy = -dy;
      }
      const a2 = angAt(x + dx * step * 0.5, y + dy * step * 0.5);
      let ex = Math.cos(a2);
      let ey = Math.sin(a2);
      if (ex * dx + ey * dy < 0) {
        ex = -ex;
        ey = -ey;
      }
      x += ex * step;
      y += ey * step;
      px = ex;
      py = ey;
      if (x < 0 || y < 0 || x >= w || y >= h) break;
      if (blocked(x, y, id)) break;
      pts.push([x, y]);
      mark(x, y, id);
    }
    return pts;
  };
  const seeds: [number, number][] = [];
  const gs = sp * 1.1;
  for (let y = gs / 2; y < h; y += gs) for (let x = gs / 2; x < w; x += gs) seeds.push([x + (r() - 0.5) * gs * 0.6, y + (r() - 0.5) * gs * 0.6]);
  for (let i = seeds.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
  }
  const queue: [number, number][] = [];
  let id = 0;
  let si = 0;
  const maxN = Math.ceil(520 / step);
  while ((queue.length || si < seeds.length) && lines.length < o.maxCuts * 2) {
    const s = queue.length ? (queue.pop() as [number, number]) : seeds[si++];
    if (s[0] < 0 || s[1] < 0 || s[0] >= w || s[1] >= h) continue;
    if (blocked(s[0], s[1], -1)) continue;
    id++;
    mark(s[0], s[1], id);
    const fw = trace(s[0], s[1], id, 1, maxN);
    const bw = trace(s[0], s[1], id, -1, maxN);
    const pts: [number, number][] = [...bw.reverse(), [s[0], s[1]], ...fw];
    if (pts.length < 5) continue;
    lines.push(pts);
    for (let k = 3; k < pts.length; k += 5) {
      const a = angAt(pts[k][0], pts[k][1]);
      queue.push([pts[k][0] - Math.sin(a) * sp, pts[k][1] + Math.cos(a) * sp]);
      queue.push([pts[k][0] + Math.sin(a) * sp, pts[k][1] - Math.cos(a) * sp]);
    }
  }
  const cuts: Cut[] = [];
  const wmax = 1.02 * sp;
  for (const L of lines) {
    let i = 0;
    while (i < L.length - 2 && cuts.length < o.maxCuts) {
      const cutLen = sp * (5 + r() * 17);
      const gap = 1 + r() * 0.6 * sp;
      let acc = 0;
      const seg: [number, number][] = [L[i]];
      let j = i + 1;
      while (j < L.length && acc < cutLen) {
        acc += Math.hypot(L[j][0] - L[j - 1][0], L[j][1] - L[j - 1][1]);
        seg.push(L[j]);
        j++;
      }
      let ga = 0;
      while (j < L.length && ga < gap) {
        ga += Math.hypot(L[j][0] - L[j - 1][0], L[j][1] - L[j - 1][1]);
        j++;
      }
      i = j;
      if (seg.length < 3) continue;
      const tones = seg.map((q) => toneAt(q[0], q[1]));
      const mt = tones.reduce((s2, v) => s2 + v, 0) / tones.length;
      const base = Math.min(1, Math.max(0, (mt - o.lo) / (o.hi - o.lo)));
      if (base < 0.05) continue; // dark = no cut
      const cum = [0];
      for (let k = 1; k < seg.length; k++) cum.push(cum[k - 1] + Math.hypot(seg[k][0] - seg[k - 1][0], seg[k][1] - seg[k - 1][1]));
      const tot = cum[cum.length - 1];
      const wid = seg.map((_, k) => {
        const a = Math.min(1, Math.max(0, (tones[k] - o.lo) / (o.hi - o.lo)));
        const wv = wmax * Math.pow(a, 0.9);
        const e = Math.min(1, cum[k] / (0.9 * wv + 1));
        const x = Math.min(1, (tot - cum[k]) / (2.6 * wv + 2));
        return wv * (0.35 + 0.65 * e * (2 - e)) * Math.pow(x, 0.75);
      });
      const nx: number[] = [];
      const ny: number[] = [];
      seg.forEach((_, k) => {
        const a = seg[Math.max(0, k - 1)];
        const b = seg[Math.min(seg.length - 1, k + 1)];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const l = Math.hypot(dx, dy) || 1;
        nx.push(-dy / l);
        ny.push(dx / l);
      });
      const px = seg.map((q) => q[0]);
      const py = seg.map((q) => q[1]);
      cuts.push({px, py, nx, ny, wid, tone: mt, cy: py[Math.floor(py.length / 2)] / h, len: tot, d: cutPath(px, py, nx, ny, wid, seg.length)});
    }
  }
  return cuts;
};
