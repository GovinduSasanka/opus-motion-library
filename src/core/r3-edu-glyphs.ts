/**
 * Single-stroke handwriting skeletons (A-Z, a-z, 0-9) in a 100 x ~190 box with ruled-paper rows:
 * top line y=20, mid line y=75 (x-height), baseline y=130, descender line y=175. Strokes are listed in kids' stroke order.
 * Path mini-language: M x y | L x y | Q cx cy x y | C c1x c1y c2x c2y x y | O cx cy rx ry a0 a1 (elliptical arc, degrees,
 * 0 = right, +90 = down, so a decreasing angle runs anticlockwise on screen).
 */
export const ROW = {top: 20, mid: 75, base: 130, desc: 175};

const U: Record<string, string[]> = {
  A: ['M50 20 L10 130', 'M50 20 L90 130', 'M26 92 L74 92'],
  B: ['M25 20 L25 130', 'M25 20 L52 20 C88 20 88 74 52 74 L25 74', 'M52 74 C100 74 100 130 52 130 L25 130'],
  C: ['O 55 75 42 55 -40 -320'],
  D: ['M22 20 L22 130', 'M22 20 L45 20 C100 20 100 130 45 130 L22 130'],
  E: ['M25 20 L25 130', 'M25 20 L80 20', 'M25 75 L70 75', 'M25 130 L80 130'],
  F: ['M25 20 L25 130', 'M25 20 L80 20', 'M25 75 L68 75'],
  G: ['O 55 75 42 55 -40 -330', 'M60 80 L93 80 L93 108'],
  H: ['M22 20 L22 130', 'M78 20 L78 130', 'M22 75 L78 75'],
  I: ['M50 20 L50 130', 'M30 20 L70 20', 'M30 130 L70 130'],
  J: ['M65 20 L65 100 C65 140 20 140 15 105'],
  K: ['M25 20 L25 130', 'M80 20 L25 88', 'M45 68 L82 130'],
  L: ['M25 20 L25 130 L80 130'],
  M: ['M15 130 L15 20', 'M15 20 L50 105 L85 20 L85 130'],
  N: ['M20 130 L20 20', 'M20 20 L80 130', 'M80 130 L80 20'],
  O: ['O 50 75 40 55 -90 -450'],
  P: ['M25 20 L25 130', 'M25 20 L55 20 C95 20 95 78 55 78 L25 78'],
  Q: ['O 50 72 40 52 -90 -450', 'M60 100 L88 135'],
  R: ['M25 20 L25 130', 'M25 20 L55 20 C95 20 95 78 55 78 L25 78', 'M55 78 L85 130'],
  S: ['M80 35 C72 14 22 14 22 48 C22 78 78 70 78 104 C78 140 25 138 18 110'],
  T: ['M15 20 L85 20', 'M50 20 L50 130'],
  U: ['M20 20 L20 90 C20 140 80 140 80 90 L80 20'],
  V: ['M10 20 L50 130 L90 20'],
  W: ['M5 20 L27 130 L50 50 L73 130 L95 20'],
  X: ['M15 20 L85 130', 'M85 20 L15 130'],
  Y: ['M15 20 L50 78', 'M85 20 L50 78', 'M50 78 L50 130'],
  Z: ['M18 20 L82 20 L18 130 L82 130'],
};

const L: Record<string, string[]> = {
  a: ['O 45 102 28 28 -35 -395', 'M73 75 L73 130'],
  b: ['M25 20 L25 130', 'O 52 102 27 28 180 540'],
  c: ['O 55 102 28 28 -40 -320'],
  d: ['O 48 102 27 28 -35 -395', 'M75 20 L75 130'],
  e: ['M22 104 L78 104 C78 70 22 70 22 104 C22 140 68 142 78 122'],
  f: ['M70 28 C60 15 38 15 38 40 L38 130', 'M18 75 L62 75'],
  g: ['O 45 102 27 28 -35 -395', 'M72 75 L72 150 C72 178 30 178 20 160'],
  h: ['M25 20 L25 130', 'M25 100 C30 70 75 68 75 100 L75 130'],
  i: ['M50 75 L50 130', 'M50 50 L50.5 50'],
  j: ['M50 75 L50 160 C50 180 25 180 15 165', 'M50 50 L50.5 50'],
  k: ['M25 20 L25 130', 'M72 75 L25 108', 'M45 95 L75 130'],
  l: ['M50 20 L50 128'],
  m: ['M15 75 L15 130', 'M15 98 C15 70 50 68 50 98 L50 130', 'M50 98 C50 70 85 68 85 98 L85 130'],
  n: ['M25 75 L25 130', 'M25 100 C28 68 75 68 75 100 L75 130'],
  o: ['O 50 102 28 28 -90 -450'],
  p: ['M25 75 L25 175', 'O 52 102 27 28 180 540'],
  q: ['O 48 102 27 28 -35 -395', 'M75 75 L75 175'],
  r: ['M30 75 L30 130', 'M30 100 C32 78 55 72 72 80'],
  s: ['M72 85 C62 70 28 72 28 92 C28 110 72 100 72 120 C72 142 34 138 26 122'],
  t: ['M45 40 L45 120 C45 132 60 134 72 126', 'M22 75 L68 75'],
  u: ['M25 75 L25 108 C25 140 75 140 75 108', 'M75 75 L75 130'],
  v: ['M18 75 L50 130 L82 75'],
  w: ['M8 75 L28 130 L50 85 L72 130 L92 75'],
  x: ['M20 75 L80 130', 'M80 75 L20 130'],
  y: ['M20 75 L50 130', 'M80 75 L45 150 C38 168 25 172 15 168'],
  z: ['M22 75 L78 75 L22 130 L78 130'],
};

const D: Record<string, string[]> = {
  '0': ['O 50 75 33 55 -90 -450'],
  '1': ['M30 45 L55 20 L55 130'],
  '2': ['M22 45 C25 10 78 10 78 48 C78 80 30 105 22 130 L80 130'],
  '3': ['M22 35 C35 8 78 18 74 48 C71 68 55 72 42 73 C82 76 84 132 48 130 C32 130 22 120 18 106'],
  '4': ['M65 20 L15 98 L88 98', 'M65 20 L65 130'],
  '5': ['M75 20 L28 20 L24 68 C45 58 82 68 80 100 C78 138 34 138 20 118'],
  '6': ['M70 22 C35 40 22 80 24 105 C26 145 78 140 78 105 C78 70 28 70 24 105'],
  '7': ['M18 20 L82 20 L40 130'],
  '8': ['M50 75 C20 70 25 20 50 20 C75 20 80 70 50 75 C15 80 15 130 50 130 C85 130 85 80 50 75'],
  '9': ['M76 52 C76 15 22 15 22 52 C22 88 76 90 76 52 C76 85 66 120 36 130'],
};

/** fallback skeleton for characters with no entry: a plain outlined box */
const FALLBACK = ['M20 20 L80 20 L80 130 L20 130 L20 20'];

export const glyphStrokes = (ch: string): string[] => U[ch] ?? L[ch] ?? D[ch] ?? FALLBACK;
export const isLowerGlyph = (ch: string) => ch in L;
export const hasDescender = (ch: string) => 'gjpqy'.includes(ch);

export type Poly = {pts: [number, number][]; cum: number[]; len: number};

/** sample a stroke string into a polyline with cumulative lengths; optional x offset */
export const samplePath = (d: string, dx = 0): Poly => {
  const tk = d.match(/[MLQCO]|-?\d*\.?\d+/g) ?? [];
  const pts: [number, number][] = [];
  let i = 0;
  const num = () => parseFloat(tk[i++]);
  const push = (x: number, y: number) => pts.push([x + dx, y]);
  while (i < tk.length) {
    const c = tk[i++];
    if (c === 'M' || c === 'L') {
      push(num(), num());
    } else if (c === 'Q') {
      const [cx, cy, x, y] = [num(), num(), num(), num()];
      const [x0, y0] = pts.length ? [pts[pts.length - 1][0] - dx, pts[pts.length - 1][1]] : [cx, cy];
      for (let s = 1; s <= 14; s++) {
        const t = s / 14;
        push((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y);
      }
    } else if (c === 'C') {
      const [a, b, c2, e, x, y] = [num(), num(), num(), num(), num(), num()];
      const [x0, y0] = pts.length ? [pts[pts.length - 1][0] - dx, pts[pts.length - 1][1]] : [a, b];
      for (let s = 1; s <= 18; s++) {
        const t = s / 18;
        const m = 1 - t;
        push(m * m * m * x0 + 3 * m * m * t * a + 3 * m * t * t * c2 + t * t * t * x, m * m * m * y0 + 3 * m * m * t * b + 3 * m * t * t * e + t * t * t * y);
      }
    } else if (c === 'O') {
      const [cx, cy, rx, ry, a0, a1] = [num(), num(), num(), num(), num(), num()];
      const steps = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 8));
      for (let s = 0; s <= steps; s++) {
        const a = ((a0 + ((a1 - a0) * s) / steps) * Math.PI) / 180;
        push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
      }
    }
  }
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  return {pts, cum, len: cum[cum.length - 1] || 0.001};
};

/** point at a length along the polyline */
export const pointAt = (p: Poly, L: number): [number, number] => {
  const l = Math.max(0, Math.min(p.len, L));
  let k = 1;
  while (k < p.pts.length - 1 && p.cum[k] < l) k++;
  const span = p.cum[k] - p.cum[k - 1] || 1;
  const t = (l - p.cum[k - 1]) / span;
  return [p.pts[k - 1][0] + (p.pts[k][0] - p.pts[k - 1][0]) * t, p.pts[k - 1][1] + (p.pts[k][1] - p.pts[k - 1][1]) * t];
};

/** SVG path data for the first L units of the polyline */
export const slicePath = (p: Poly, L: number): string => {
  const l = Math.max(0, Math.min(p.len, L));
  if (l <= 0) return '';
  let d = `M${p.pts[0][0].toFixed(2)} ${p.pts[0][1].toFixed(2)}`;
  for (let k = 1; k < p.pts.length && p.cum[k] <= l; k++) d += `L${p.pts[k][0].toFixed(2)} ${p.pts[k][1].toFixed(2)}`;
  const e = pointAt(p, l);
  d += `L${e[0].toFixed(2)} ${e[1].toFixed(2)}`;
  return d;
};

export const fullPath = (p: Poly): string => slicePath(p, p.len);
