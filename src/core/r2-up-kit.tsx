import type {Pixels} from './image-kit';

/**
 * Helpers for the additive upgrades of comic-halftone (registration kick, scissor cut-out) and plan-tilt (popup).
 * Ideas only from the analysis notes (registration-kick, halftone-cutout-prep): everything here is original code.
 * Pure functions, deterministic, frame-driven — no timers, no Math.random.
 */

// ---------------------------------------------------------------------------------------------------------
// registration kick: colour plates jolt apart on accents, drift apart over a held bar, snap back on the downbeat
// ---------------------------------------------------------------------------------------------------------

export type KickOpts = {
  /** jolt amplitude in px (at 1080p); 0 = no kicks */
  amp: number;
  /** frames the jolts land on */
  frames: number[];
  /** max slow drift in px (0 = none) */
  drift: number;
  /** [from, to] frames: plates ease apart between them and snap back at `to` */
  driftRange: [number, number];
  seed: number;
};

type V2 = [number, number];
export type PlateOffsets = {r: V2; g: V2; b: V2};

const hash01 = (seed: number, i: number) => {
  let x = (Math.imul(seed | 0, 374761393) + Math.imul(i | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

/** unit directions of the three plates for jolt number `i` (R and B pushed roughly opposite, G across) */
const plateDirs = (seed: number, i: number): [V2, V2, V2] => {
  const a = hash01(seed, i * 3 + 1) * Math.PI * 2;
  const b = a + Math.PI + (hash01(seed, i * 3 + 2) - 0.5) * 1.1;
  const g = a + Math.PI / 2 + (hash01(seed, i * 3 + 3) - 0.5) * 1.1;
  return [
    [Math.cos(a), Math.sin(a)],
    [Math.cos(g), Math.sin(g)],
    [Math.cos(b), Math.sin(b)],
  ];
};

/** px offsets (already scaled by u) of the R, G, B plates at `frame`, or null when nothing is active */
export const plateKick = (frame: number, fps: number, u: number, o: KickOpts): PlateOffsets | null => {
  if (o.amp <= 0 && o.drift <= 0) return null;
  const acc: PlateOffsets = {r: [0, 0], g: [0, 0], b: [0, 0]};
  const add = (i: number, mag: number) => {
    const [r, g, b] = plateDirs(o.seed, i);
    acc.r[0] += r[0] * mag;
    acc.r[1] += r[1] * mag;
    acc.g[0] += g[0] * mag * 0.5;
    acc.g[1] += g[1] * mag * 0.5;
    acc.b[0] += b[0] * mag;
    acc.b[1] += b[1] * mag;
  };
  if (o.amp > 0) {
    o.frames.forEach((kf, i) => {
      const x = (frame - kf) / fps;
      if (x < 0 || x > 0.6) return;
      add(i + 1, o.amp * u * Math.exp(-11 * x) * Math.cos(34 * x));
    });
  }
  if (o.drift > 0) {
    const [d0, d1] = o.driftRange;
    if (frame >= d0) {
      if (frame < d1) {
        const t = Math.min(1, Math.max(0, (frame - d0) / Math.max(1, d1 - d0)));
        add(0, o.drift * u * t * t * (3 - 2 * t));
      } else {
        const x = (frame - d1) / fps;
        if (x < 0.7) add(0, o.drift * u * Math.exp(-16 * x) * Math.cos(40 * x));
      }
    }
  }
  return acc;
};

// ---------------------------------------------------------------------------------------------------------
// scissor cut-out: silhouette -> dilated paper rim -> faceted polygon (Douglas-Peucker)
// ---------------------------------------------------------------------------------------------------------

export type Poly = [number, number][];

/** true when the image has real transparency (more than 1.5 % of pixels below 245 alpha) */
export const hasAlpha = (px: Pixels) => {
  let n = 0;
  for (let i = 3; i < px.data.length; i += 4) if (px.data[i] < 245) n++;
  return n > px.w * px.h * 0.015;
};

/** binary mask from alpha (>= 110) */
export const alphaMask = (px: Pixels) => {
  const m = new Uint8Array(px.w * px.h);
  for (let i = 0; i < m.length; i++) m[i] = px.data[i * 4 + 3] >= 110 ? 1 : 0;
  return m;
};

/** octagonal dilation by r cells (alternating cross / square 3x3) */
export const dilate = (src: Uint8Array, W: number, H: number, r: number) => {
  let a = src;
  for (let k = 0; k < r; k++) {
    const b = new Uint8Array(a.length);
    const diag = k % 2 === 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let v = a[y * W + x];
        if (!v) {
          for (let dy = -1; dy <= 1 && !v; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              if (!diag && dx !== 0 && dy !== 0) continue;
              const xx = x + dx;
              const yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
              if (a[yy * W + xx]) {
                v = 1;
                break;
              }
            }
        }
        b[y * W + x] = v;
      }
    a = b;
  }
  return a;
};

/** keep only the largest 4-connected component */
const largest = (m: Uint8Array, W: number, H: number) => {
  const lab = new Int32Array(m.length);
  let best = 0;
  let bestN = 0;
  let id = 0;
  const stack: number[] = [];
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || lab[s]) continue;
    id++;
    let n = 0;
    stack.push(s);
    lab[s] = id;
    while (stack.length) {
      const p = stack.pop() as number;
      n++;
      const x = p % W;
      const y = (p - x) / W;
      if (x > 0 && m[p - 1] && !lab[p - 1]) (lab[p - 1] = id), stack.push(p - 1);
      if (x < W - 1 && m[p + 1] && !lab[p + 1]) (lab[p + 1] = id), stack.push(p + 1);
      if (y > 0 && m[p - W] && !lab[p - W]) (lab[p - W] = id), stack.push(p - W);
      if (y < H - 1 && m[p + W] && !lab[p + W]) (lab[p + W] = id), stack.push(p + W);
    }
    if (n > bestN) (bestN = n), (best = id);
  }
  const out = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) out[i] = lab[i] === best ? 1 : 0;
  return out;
};

const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];

/** Moore-neighbour outer boundary of the largest blob (cell coordinates, clockwise) */
export const traceOuter = (m0: Uint8Array, W: number, H: number): Poly => {
  const m = largest(m0, W, H);
  let s = -1;
  for (let i = 0; i < m.length; i++)
    if (m[i]) {
      s = i;
      break;
    }
  if (s < 0) return [];
  const sx = s % W;
  const sy = (s - sx) / W;
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < W && y < H ? m[y * W + x] : 0);
  const pts: Poly = [[sx, sy]];
  let x = sx;
  let y = sy;
  let d = 6;
  for (let guard = 0; guard < W * H * 2; guard++) {
    const start = d % 2 === 0 ? (d + 6) % 8 : (d + 7) % 8;
    let found = -1;
    for (let k = 0; k < 8; k++) {
      const dd = (start + k) % 8;
      if (at(x + DX[dd], y + DY[dd])) {
        found = dd;
        break;
      }
    }
    if (found < 0) break;
    x += DX[found];
    y += DY[found];
    d = found;
    if (x === sx && y === sy) break;
    pts.push([x, y]);
  }
  return pts;
};

const segDist = (p: [number, number], a: [number, number], b: [number, number]) => {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const l2 = vx * vx + vy * vy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l2)) : 0;
  return Math.hypot(p[0] - (a[0] + vx * t), p[1] - (a[1] + vy * t));
};

const dpOpen = (pts: Poly, tol: number): Poly => {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const st: [number, number][] = [[0, pts.length - 1]];
  while (st.length) {
    const [i0, i1] = st.pop() as [number, number];
    let md = 0;
    let mi = -1;
    for (let i = i0 + 1; i < i1; i++) {
      const dd = segDist(pts[i], pts[i0], pts[i1]);
      if (dd > md) (md = dd), (mi = i);
    }
    if (mi >= 0 && md > tol) {
      keep[mi] = 1;
      st.push([i0, mi], [mi, i1]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};

/** Douglas-Peucker on a closed polygon (split at the point farthest from vertex 0) */
export const simplifyClosed = (pts: Poly, tol: number): Poly => {
  if (pts.length < 6) return pts;
  let fi = 0;
  let fd = 0;
  for (let i = 1; i < pts.length; i++) {
    const dd = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (dd > fd) (fd = dd), (fi = i);
  }
  const a = dpOpen(pts.slice(0, fi + 1), tol);
  const b = dpOpen([...pts.slice(fi), pts[0]], tol);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
};

export type Cutout = {
  /** faceted outer rim polygon, normalised 0..1 of the plate */
  outer: Poly;
  /** synthetic hand-cut outline (opaque images only), normalised; null when the alpha defines the subject */
  inner: Poly | null;
};

/** hand-cut jittered ellipse for opaque images (the photo itself is clipped to it) */
const syntheticOutline = (seed: number, aspect: number, scale = 0.74): Poly => {
  const n = 28;
  const pts: Poly = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const j = 1 + (hash01(seed, 40 + i) - 0.5) * 0.07;
    const rx = 0.5 * scale * j;
    const ry = 0.5 * scale * j * Math.min(1, aspect * 0.0 + 1);
    pts.push([0.5 + Math.cos(a) * rx * 0.95, 0.5 + Math.sin(a) * ry * 0.95]);
  }
  return pts;
};

/**
 * Scissor cut-out polygon for an image: alpha silhouette -> octagonal dilation by `rimCells` -> Moore trace ->
 * Douglas-Peucker at `tolCells` (facets). Opaque images get a jittered ellipse cut instead.
 */
export const buildCutout = (px: Pixels, rimCells: number, tolCells: number, seed: number): Cutout => {
  const W = px.w;
  const H = px.h;
  if (hasAlpha(px)) {
    const m = dilate(alphaMask(px), W, H, Math.max(1, Math.round(rimCells)));
    const tr = simplifyClosed(traceOuter(m, W, H), Math.max(0.6, tolCells));
    return {outer: tr.map(([x, y]) => [(x + 0.5) / W, (y + 0.5) / H] as [number, number]), inner: null};
  }
  // synthetic: ellipse in pixel space (so it is round in the image), faceted by polygon resolution
  const inner = syntheticOutline(seed, W / H).map(([x, y]) => [x, y] as [number, number]);
  // ellipse is round in image pixels (not stretched by aspect): radius from the short side
  const short = Math.min(W, H);
  const px2 = inner.map(([x, y]) => [0.5 + ((x - 0.5) * short) / W, 0.5 + ((y - 0.5) * short) / H] as [number, number]);
  const outer = px2.map(([x, y]) => {
    const dx = (x - 0.5) * W;
    const dy = (y - 0.5) * H;
    const l = Math.hypot(dx, dy) || 1;
    return [x + ((dx / l) * rimCells) / W, y + ((dy / l) * rimCells) / H] as [number, number];
  });
  return {outer, inner: px2};
};
