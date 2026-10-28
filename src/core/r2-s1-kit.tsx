// Shared helpers for build-round-2 batch S-1 (vhs-crt-pass, cel-shade-crescent, chrome-80s-title, colour-model-relight,
// frame-blend-timelapse, remix-thumbnail-shelf, glass-strip-sweep, exploded-view-snap, frost-to-clear, rpg-menu-ui).
// Adapted in part from lemo-opuscar (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md. Algorithms re-written from the
// research notes in analysis/sources/lemo-styles-a.md / lemo-styles-b.md as deterministic frame-driven React/SVG/three.js.
import {loadFont as loadDela} from '@remotion/google-fonts/DelaGothicOne';
import {loadFont as loadBarlowSC} from '@remotion/google-fonts/BarlowSemiCondensed';
import {loadFont as loadPress} from '@remotion/google-fonts/PressStart2P';
import {loadFont as loadSilk} from '@remotion/google-fonts/Silkscreen';
import {loadFont as loadInterTight} from '@remotion/google-fonts/InterTight';
import {clamp} from './ease';

export const s1f = {
  dela: loadDela('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  barlow: loadBarlowSC('normal', {weights: ['600'], subsets: ['latin']}).fontFamily,
  press: loadPress('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  tight: loadInterTight('normal', {weights: ['200', '300'], subsets: ['latin']}).fontFamily,
  silk: loadSilk('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily,
};
/** CJK-capable fallback stack for a Japanese tagline (system fonts; no network slices) */
export const JP_STACK = `'Yu Gothic UI','Yu Gothic','Meiryo','Hiragino Sans','Noto Sans CJK JP','Noto Sans JP',sans-serif`;

/** deterministic 0..1 hash of integers */
export const sh = (a: number, b = 0, c = 0) => {
  let x = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647);
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};
export const sseg = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1e-6, b - a));
export const smooth01 = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeIO = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut3 = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn3 = (t: number) => Math.pow(clamp(t), 3);
export const backOut = (t: number, s = 1.7) => {
  const x = clamp(t) - 1;
  return 1 + x * x * ((s + 1) * x + s);
};
export const hexRgb = (hex: string): [number, number, number] => {
  let v = hex.replace('#', '').trim();
  if (v.length === 3) v = v.split('').map((c) => c + c).join('');
  const n = parseInt(v.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const h2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
export const rgbHex = (c: [number, number, number]) => '#' + h2(c[0]) + h2(c[1]) + h2(c[2]);
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return rgbHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
};
export const withAlpha = (hex: string, a: number) => {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
