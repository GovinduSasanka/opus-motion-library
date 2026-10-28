/**
 * r2-pr4-kit — shared helpers for the PR-4 batch (prompt-corpus techniques): orbit-system, torn-paper-collage,
 * clock-calendar, loot-reveal, voxel-diorama, liquid-pour-fill. Pure functions of the frame; no timers, no Math.random.
 *
 *  - ids / colour maths / text fitting
 *  - torn-paper outlines (densify + noisy normal displacement) for photo / shape pieces
 *  - Kepler solver for the orbit system
 *  - tiny ISO date maths (UTC, deterministic) for the calendar
 *  - rarity palette for the loot reveal
 *  - voxel island generator (heightmap + trees + hut + build order) for the voxel diorama
 */
import React from 'react';
import {fbm, rng} from './random';

// ------------------------------------------------------------------------------------------------------------------
// ids, colour, text
// ------------------------------------------------------------------------------------------------------------------
/** a DOM-safe unique id per component instance */
export const useUid = (prefix: string) => prefix + React.useId().replace(/[^a-zA-Z0-9_-]/g, '');

export const hexToRgb = (h: string): [number, number, number] => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const mixHex = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const k = Math.min(1, Math.max(0, t));
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};

export const hexA = (h: string, a: number) => {
  const [r, g, b] = hexToRgb(h);
  return `rgba(${r},${g},${b},${a})`;
};

let _ctx: CanvasRenderingContext2D | null | undefined;
/** width in px of `text` (canvas measure at render time; fallback to an average) */
export const textW = (text: string, family: string, size: number, weight: number | string = 400) => {
  if (typeof document !== 'undefined') {
    if (_ctx === undefined) _ctx = document.createElement('canvas').getContext('2d');
    if (_ctx) {
      _ctx.font = `${weight} ${size}px ${family}`;
      const m = _ctx.measureText(text).width;
      if (m > 0) return m;
    }
  }
  return text.length * size * 0.6;
};

/** largest font size <= size so that text fits maxW */
export const fitSize = (text: string, family: string, size: number, maxW: number, weight: number | string = 400) => {
  const w = textW(text, family, size, weight);
  return w <= maxW ? size : Math.max(8, (size * maxW) / w);
};

// ------------------------------------------------------------------------------------------------------------------
// torn paper
// ------------------------------------------------------------------------------------------------------------------
export type Pt = [number, number];

/** resample a closed polygon so no edge is longer than `step` */
export const densify = (poly: Pt[], step: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(d / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
};

export const rectPoly = (w: number, h: number): Pt[] => [
  [-w / 2, -h / 2],
  [w / 2, -h / 2],
  [w / 2, h / 2],
  [-w / 2, h / 2],
];

export const circlePoly = (rx: number, ry: number, n = 48): Pt[] =>
  Array.from({length: n}, (_, i) => [Math.cos((i / n) * Math.PI * 2) * rx, Math.sin((i / n) * Math.PI * 2) * ry] as Pt);

export const starPoly = (pts: number, ro: number, ri: number, rot = -Math.PI / 2): Pt[] =>
  Array.from({length: pts * 2}, (_, i) => {
    const r = i % 2 === 0 ? ro : ri;
    const a = rot + (i / (pts * 2)) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r] as Pt;
  });

/** irregular blob (organic cut-out) */
export const blobPoly = (r: number, seed: number, n = 14): Pt[] => {
  const g = rng(seed);
  return Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = r * (0.78 + g() * 0.3);
    return [Math.cos(a) * k, Math.sin(a) * k * 0.92] as Pt;
  });
};

/**
 * torn edge: the closed outline densified every `step` px and pushed along its normal by smooth noise (low frequency
 * wobble) plus per-point jitter (fibres), `amp` px peak. `grow` offsets the whole outline outwards first (the white
 * paper rim sits `grow` px outside the picture).
 */
export const tornOutline = (base: Pt[], seed: number, amp: number, step = 9, grow = 0): Pt[] => {
  const dense = densify(base, step);
  const n = dense.length;
  const g = rng(seed * 7919 + 13);
  const key = 's' + seed;
  return dense.map((p, i) => {
    const a = dense[(i - 1 + n) % n];
    const b = dense[(i + 1) % n];
    let nx = b[1] - a[1];
    let ny = -(b[0] - a[0]);
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    // outward normal: make it point away from the centroid (0,0)
    if (nx * p[0] + ny * p[1] < 0) {
      nx = -nx;
      ny = -ny;
    }
    const wob = fbm(key, i * 0.22, 3.1, 2) * amp * 0.9;
    const fib = (g() - 0.5) * amp * 0.9;
    const d = grow + wob + fib;
    return [p[0] + nx * d, p[1] + ny * d] as Pt;
  });
};

export const ptsPath = (pts: Pt[]) => 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L') + 'Z';

// ------------------------------------------------------------------------------------------------------------------
// orbit maths
// ------------------------------------------------------------------------------------------------------------------
/** solve Kepler's equation M = E - e sin E (Newton, 6 iterations) and return [x, y] in the orbit frame, a = 1, focus at 0 */
export const keplerXY = (M: number, e: number): [number, number] => {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return [Math.cos(E) - e, Math.sqrt(1 - e * e) * Math.sin(E)];
};

// ------------------------------------------------------------------------------------------------------------------
// dates (UTC, deterministic)
// ------------------------------------------------------------------------------------------------------------------
export const parseISO = (s: string): number => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (!m) return Date.UTC(2025, 0, 1);
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
};
export const DAY_MS = 86400000;
export const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
export const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
export const dateParts = (ms: number) => {
  const d = new Date(ms);
  return {day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()], weekday: WEEKDAYS[d.getUTCDay()], year: d.getUTCFullYear(), dow: d.getUTCDay()};
};
/** "HH:MM" -> minutes since midnight */
export const parseHM = (s: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  return m ? +m[1] * 60 + +m[2] : 0;
};

// ------------------------------------------------------------------------------------------------------------------
// rarity
// ------------------------------------------------------------------------------------------------------------------
export const RARITY: Record<string, {color: string; deep: string; stars: number; label: string}> = {
  common: {color: '#9AA4B1', deep: '#4b5563', stars: 1, label: 'COMMON'},
  rare: {color: '#3B82F6', deep: '#1e3a8a', stars: 2, label: 'RARE'},
  epic: {color: '#A855F7', deep: '#581c87', stars: 3, label: 'EPIC'},
  legendary: {color: '#F59E0B', deep: '#92400e', stars: 4, label: 'LEGENDARY'},
};

// ------------------------------------------------------------------------------------------------------------------
// voxel island
// ------------------------------------------------------------------------------------------------------------------
/** colour slots used by the voxel diorama */
export const VOX = {water: 0, waterLight: 1, sand: 2, grass: 3, grass2: 4, rock: 5, snow: 6, dirt: 7, wood: 8, leaf: 9, leaf2: 10, roof: 11, wall: 12, cloud: 13} as const;

export type VoxCell = {x: number; y: number; z: number; c: number; key: number; sub: boolean};

export type IslandPlan = {
  n: number;
  heights: number[][];
  cells: VoxCell[];
  /** sea cells (x,z) with distance from centre */
  sea: {x: number; z: number; d: number; shade: number}[];
};

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Island: radial falloff x fbm heightmap (or a user heightmap), then trees on the grass, one hut on a levelled pad.
 * Every cube gets a build key 0..1 (low + near the centre lands first; decorations land last).
 */
export const makeIsland = (opts: {n: number; seed: number; heightmap?: number[][]; trees: number; houses: number; maxH: number; sea: number}): IslandPlan => {
  const {seed, trees, houses, maxH} = opts;
  const user = opts.heightmap && opts.heightmap.length > 1 ? opts.heightmap : null;
  const n = user ? Math.max(...user.map((r) => r.length), user.length) : Math.max(8, Math.round(opts.n));
  const H: number[][] = [];
  const key = 'iso' + seed;
  for (let z = 0; z < n; z++) {
    const row: number[] = [];
    for (let x = 0; x < n; x++) {
      if (user) {
        row.push(Math.max(0, Math.round(user[z]?.[x] ?? 0)));
        continue;
      }
      const dx = (x - (n - 1) / 2) / (n / 2);
      const dz = (z - (n - 1) / 2) / (n / 2);
      const d = Math.hypot(dx, dz);
      const nz = fbm(key, x * 0.17, z * 0.17, 3) * 0.5 + 0.5;
      const fall = 1 - smooth(0.42, 0.98, d + (nz - 0.5) * 0.35);
      row.push(Math.max(0, Math.round(fall * (1.2 + nz * maxH))));
    }
    H.push(row);
  }
  const g = rng(seed * 31 + 7);
  const at = (x: number, z: number) => (H[z] && H[z][x] !== undefined ? H[z][x] : 0);

  // hut pad(s)
  const pads: {x: number; z: number; h: number}[] = [];
  const spots: [number, number][] = [];
  for (let z = 2; z < n - 3; z++) for (let x = 2; x < n - 3; x++) if (at(x, z) >= 2 && at(x, z) <= 4) spots.push([x, z]);
  for (let k = 0; k < houses && spots.length; k++) {
    const [x, z] = spots.splice(Math.floor(g() * spots.length), 1)[0];
    const h = Math.min(4, Math.max(2, at(x, z)));
    for (let dz = -1; dz <= 2; dz++) for (let dx = -1; dx <= 2; dx++) if (H[z + dz]?.[x + dx] !== undefined && H[z + dz][x + dx] >= 1) H[z + dz][x + dx] = h;
    pads.push({x, z, h});
    for (let i = spots.length - 1; i >= 0; i--) if (Math.hypot(spots[i][0] - x, spots[i][1] - z) < 5) spots.splice(i, 1);
  }

  const cells: VoxCell[] = [];
  const mid = (n - 1) / 2;
  const maxD = Math.hypot(mid, mid);
  const topSlot = (h: number) => (h <= 1 ? VOX.sand : h === 2 ? (g() > 0.5 ? VOX.sand : VOX.grass) : h <= 4 ? VOX.grass : h === 5 ? VOX.grass2 : h <= 6 ? VOX.rock : VOX.snow);
  for (let z = 0; z < n; z++) {
    for (let x = 0; x < n; x++) {
      const h = H[z][x];
      if (h <= 0) continue;
      const d = Math.hypot(x - mid, z - mid) / maxD;
      const top = topSlot(h);
      for (let y = 0; y < h; y++) {
        const exposed = y === h - 1 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => at(x + dx, z + dz) <= y);
        if (!exposed) continue;
        const sub = y < h - 1;
        const slot = y === h - 1 ? top : y >= h - 2 && top !== VOX.sand ? (top === VOX.grass || top === VOX.grass2 ? VOX.dirt : top) : y <= 0 ? VOX.sand : VOX.dirt;
        cells.push({x, y, z, c: slot, key: ((y / Math.max(1, maxH + 2)) * 0.55 + d * 0.45 + g() * 0.04) * 0.74, sub});
      }
    }
  }
  // trees
  const grass: [number, number][] = [];
  for (let z = 1; z < n - 1; z++)
    for (let x = 1; x < n - 1; x++) {
      const h = H[z][x];
      if (h >= 3 && h <= 5 && !pads.some((p) => Math.abs(p.x + 0.5 - x) < 3 && Math.abs(p.z + 0.5 - z) < 3)) grass.push([x, z]);
    }
  const placed: [number, number][] = [];
  let tk = 0.76;
  for (let t = 0; t < trees && grass.length; t++) {
    const [x, z] = grass.splice(Math.floor(g() * grass.length), 1)[0];
    if (placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 2.6)) {
      t--;
      if (grass.length < 3) break;
      continue;
    }
    placed.push([x, z]);
    const h = H[z][x];
    const k0 = tk;
    tk += 0.2 / Math.max(1, trees);
    const tall = 1 + (g() > 0.55 ? 1 : 0);
    for (let i = 0; i < tall; i++) cells.push({x, y: h + i, z, c: VOX.wood, key: k0 + i * 0.004, sub: false});
    const ty = h + tall;
    const leaf = g() > 0.5 ? VOX.leaf : VOX.leaf2;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) cells.push({x: x + dx, y: ty, z: z + dz, c: leaf, key: k0 + 0.02, sub: false});
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) cells.push({x: x + dx, y: ty + 1, z: z + dz, c: leaf, key: k0 + 0.03, sub: false});
  }
  // huts: 2x2 walls, 2 tall, stepped roof
  for (const p of pads) {
    const k0 = Math.min(0.97, tk + 0.02);
    for (let y = 0; y < 2; y++) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) cells.push({x: p.x + dx, y: p.h + y, z: p.z + dz, c: VOX.wall, key: k0 + y * 0.01, sub: false});
    for (let dz = -1; dz < 3; dz++) for (let dx = -1; dx < 3; dx++) cells.push({x: p.x + dx, y: p.h + 2, z: p.z + dz, c: VOX.roof, key: k0 + 0.025, sub: false});
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) cells.push({x: p.x + dx, y: p.h + 3, z: p.z + dz, c: VOX.roof, key: k0 + 0.035, sub: false});
  }
  const maxK = Math.max(...cells.map((c) => c.key), 0.0001);
  cells.forEach((c) => (c.key = Math.min(1, c.key / maxK)));

  // sea cells
  const m = n + 6;
  const sea: IslandPlan['sea'] = [];
  const off = (m - n) / 2;
  for (let z = 0; z < m; z++)
    for (let x = 0; x < m; x++) {
      const ix = x - off;
      const iz = z - off;
      if (at(ix, iz) > 0) continue;
      sea.push({x: ix, z: iz, d: Math.hypot(ix - mid, iz - mid) / maxD, shade: (fbm('sea' + seed, x * 0.35, z * 0.35, 2) + 1) / 2});
    }
  return {n, heights: H, cells, sea};
};
