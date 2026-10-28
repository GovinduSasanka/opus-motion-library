/**
 * r2-pr2-kit — shared helpers for the PR-2 batch (prompt-corpus techniques): globe-3d, brush-stroke-reveal,
 * device-mockup, product-turntable-3d, command-palette-type, impact-frame, game-hud, fog-clouds, exploded-view-3d.
 * Everything is a pure function of the frame (no timers, no Math.random, no canvas drawing).
 *
 *  - colour helpers, hashed noise, typing schedules with per-character jitter
 *  - texture loader (delayRender) for three.js image textures
 *  - procedural Earth: hand-written coarse continent outlines (original) -> a 1024x512 RGBA mask texture (land, coast
 *    noise, city lights, elevation), great-circle arcs, lat/lon helpers
 *  - impact state (flash / shake / punch / chroma) shared by the impact-frame motion and anything that wants a hit
 */
import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import * as THREE from 'three';
import {resolveSrc} from './asset';
import {clamp} from './ease';

// =================================================================================================================
// colour + maths
// =================================================================================================================
export const rgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
/** mix two hex colours (t 0..1) -> '#rrggbb' */
export const mixHex = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  const k = clamp(t);
  return '#' + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')).join('');
};
export const shade = (hex: string, k: number) => (k >= 0 ? mixHex(hex, '#ffffff', k) : mixHex(hex, '#000000', -k));
export const luma = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
export const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
/** deterministic hash 0..1 from up to three numbers */
export const hash01 = (a: number, b = 0, c = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + 1.3) * 43758.5453123;
  return x - Math.floor(x);
};
/** smooth value noise 0..1 on an integer lattice hash */
export const vnoise = (x: number, y: number, seed = 0) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash01(xi, yi, seed);
  const b = hash01(xi + 1, yi, seed);
  const c = hash01(xi, yi + 1, seed);
  const d = hash01(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};
export const fbmN = (x: number, y: number, seed = 0, oct = 4) => {
  let v = 0;
  let a = 0.5;
  let f = 1;
  let n = 0;
  for (let o = 0; o < oct; o++) {
    v += a * vnoise(x * f, y * f, seed + o * 7);
    n += a;
    a *= 0.5;
    f *= 2;
  }
  return v / n;
};
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a || 1));
  return t * t * (3 - 2 * t);
};

/**
 * frames at which each character of `text` appears: `perChar` frames apart (±jitter, never going backwards), pauses a
 * little after punctuation and spaces. Returns an array of length text.length (frame of char i).
 */
export const typeSchedule = (text: string, start: number, perChar = 2.5, jitter = 1, seed = 1) => {
  const out: number[] = [];
  let t = start;
  for (let i = 0; i < text.length; i++) {
    const j = (hash01(i + 1, seed, 3) * 2 - 1) * jitter;
    t += Math.max(1, perChar + j);
    const ch = text[i];
    if (ch === ',' || ch === '.') t += 2;
    else if (ch === ' ' && hash01(i, seed, 9) > 0.7) t += 1;
    out.push(Math.round(t));
  }
  return out;
};
/** how many characters of a schedule are visible at `frame` */
export const visibleChars = (sched: number[], frame: number) => {
  let n = 0;
  while (n < sched.length && sched[n] <= frame) n++;
  return n;
};

// =================================================================================================================
// three.js texture loader (waits for the image before the frame renders)
// =================================================================================================================
export const useImgTexture = (src: string | undefined, label = 'pr2 texture') => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => (src ? delayRender(label) : null));
  useEffect(() => {
    if (!src) return;
    new THREE.TextureLoader().load(
      resolveSrc(src),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        setTex(t);
        if (handle !== null) continueRender(handle);
      },
      undefined,
      () => {
        if (handle !== null) continueRender(handle);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  return tex;
};

/** a procedural RGBA DataTexture from a per-texel function (0..1 in, 0..1 rgba out). Pure maths, no canvas. */
export const dataTexture = (w: number, h: number, fn: (u: number, v: number) => [number, number, number, number], srgb = true, repeatX = true) => {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = fn((x + 0.5) / w, (y + 0.5) / h);
      const i = (y * w + x) * 4;
      data[i] = clamp(c[0]) * 255;
      data[i + 1] = clamp(c[1]) * 255;
      data[i + 2] = clamp(c[2]) * 255;
      data[i + 3] = clamp(c[3]) * 255;
    }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  if (repeatX) t.wrapS = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
};

// =================================================================================================================
// impact (hit) state
// =================================================================================================================
export type ImpactState = {
  /** 0 | 1: this frame is the inverted frame */
  invert: boolean;
  /** 0..1 white flash alpha */
  white: number;
  /** pixel-independent shake: fraction of the short side */
  dx: number;
  dy: number;
  /** degrees */
  rot: number;
  /** zoom factor (1.06 -> 1) */
  scale: number;
  /** chromatic split in fractions of the short side */
  chroma: number;
  /** frames since the latest impact (or 999) and its index */
  age: number;
  index: number;
};

/**
 * Hit response at `frame` for impacts at `at[]`: 1 inverted frame, 1 white frame, exp-decaying shake over ~8 frames,
 * zoom punch 1.06 -> 1 and a chromatic split. `strength` scales everything; later impacts may be stronger via `ramp`.
 */
export const impactAt = (frame: number, at: number[], strength = 1, ramp = 0.0, flash: 'invert' | 'white' | 'both' | 'none' = 'both'): ImpactState => {
  let idx = -1;
  for (let i = 0; i < at.length; i++) if (frame >= at[i]) idx = i;
  if (idx < 0) return {invert: false, white: 0, dx: 0, dy: 0, rot: 0, scale: 1, chroma: 0, age: 999, index: -1};
  const age = frame - at[idx];
  const s = strength * (1 + ramp * idx);
  const dec = Math.exp(-age / 3.2);
  const live = age < 14 ? 1 : 0;
  const a = hash01(idx + 1, age, 5) * 2 - 1;
  const b = hash01(idx + 3, age, 8) * 2 - 1;
  const inv = (flash === 'invert' || flash === 'both') && age === 0;
  const whiteFrame = flash === 'white' ? age === 0 : flash === 'both' ? age === 1 : false;
  return {
    invert: inv,
    white: whiteFrame ? Math.min(1, 0.85 * s) : 0,
    dx: a * 0.022 * s * dec * live,
    dy: b * 0.022 * s * dec * live,
    rot: (hash01(idx + 7, age, 2) * 2 - 1) * 0.7 * s * dec * live,
    scale: 1 + 0.06 * s * Math.exp(-age / 3.6) * live,
    chroma: 0.006 * s * Math.exp(-age / 4) * live,
    age,
    index: idx,
  };
};

// =================================================================================================================
// geography: lat/lon helpers and great-circle arcs
// =================================================================================================================
export type V3 = [number, number, number];
const D2R = Math.PI / 180;
/** unit vector for lat/lon degrees (y up, lon 0 along +z, east towards +x) */
export const llToVec = (lat: number, lon: number): V3 => [Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** point on the great circle a->b at t in 0..1, lifted off the surface by `rise` x chord x sin(pi t) */
export const arcPoint = (a: V3, b: V3, t: number, rise = 0.2, radius = 1): V3 => {
  const d = clamp(dot3(a, b), -1, 1);
  const om = Math.acos(d);
  const so = Math.sin(om) || 1e-6;
  const ka = Math.sin((1 - t) * om) / so;
  const kb = Math.sin(t * om) / so;
  const p: V3 = [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
  const chord = Math.sqrt(2 - 2 * d);
  const r = radius * (1.004 + rise * chord * Math.sin(Math.PI * t) * 0.9);
  return [p[0] * r, p[1] * r, p[2] * r];
};

// =================================================================================================================
// procedural Earth mask (original coarse outlines, lon/lat degrees)
// =================================================================================================================
type Poly = number[]; // flat lon,lat,lon,lat...

/** Afro-Eurasia as one outline (the Mediterranean, Black Sea and Caspian are carved out as water below). */
const AFROEURASIA: Poly = [
  -5.4, 36.05, -6.3, 36.5, -7.4, 37.2, -8.9, 37, -9.5, 38.7, -9, 40.5, -8.8, 42, -9.3, 43, -8, 43.7, -4, 43.4, -1.8, 43.4, -1.2, 46, -2.2, 47.3, -4.6, 48.1, -4.7, 48.7, -1.5, 48.7, -1.3, 49.7, 1.5, 50.2, 1.7, 51, 3.5, 51.4, 4.5, 52.6, 5, 53.3,
  8.5, 54, 8.6, 57, 10.6, 57.7, 10.3, 55.5, 11.5, 54.2, 14, 54, 18, 54.8, 19.8, 54.4, 21, 56, 21, 57.5, 23, 57.2, 24, 58.4, 23.5, 59.3, 28, 59.5, 30, 60, 28.5, 60.6, 24.5, 60, 22, 60.3, 21.3, 61.5, 21.5, 63.2, 25, 65, 24, 65.8, 21.5, 65.5, 19, 63.5, 17.5, 62, 17.3, 60.5, 18.7, 59.4, 16.5, 57.5, 16, 56.2, 14, 55.4, 12.5, 56.2, 11.7, 58, 10.5, 59.2, 8, 58.1, 5.8, 58.8, 5, 61, 7, 62.8, 11, 64.8, 13.5, 67, 16.5, 69, 20, 70, 25, 71, 31, 70.2, 35, 69.5, 41, 67.2, 44, 68.2, 50, 68, 56, 68.5, 60, 69.5, 66, 69, 68, 72, 73, 72.7, 78, 72, 82, 73.5, 86, 74, 95, 76, 104, 77.7, 112, 76, 113, 74, 125, 73.5, 130, 71, 140, 72.7, 150, 71.5, 160, 69.5, 170, 69.7, 180, 68.8, 180, 65.5, 176, 65, 170, 63, 164, 60, 162, 57, 160, 53, 156.5, 51, 155.8, 56, 151, 59, 143, 59.2, 138, 56, 135, 54.5, 141, 53, 141, 50, 140, 47.5, 138, 45.5, 135, 43.5, 132, 43, 130, 42.5, 129.5, 40.5, 128, 38.5, 129.4, 36, 128.5, 34.8, 126.5, 34.5, 126.4, 37, 125, 37.7, 125.2, 39.5, 121.5, 40.8, 121, 39, 122.5, 37.5, 119, 37.2, 118.8, 38.5, 118, 39, 117.8, 38.2, 119, 37, 120.5, 36.5, 121.5, 34.7, 121.5, 32, 122, 30.5, 120.5, 27, 119, 25, 116.5, 23, 113.5, 22, 110.5, 21, 108, 21.6, 106, 19.5, 108, 16, 109.3, 12.5, 107, 10.5, 105, 8.6, 104.8, 10.5, 103, 10.8, 102, 12.2, 100.5, 13.4, 100, 12.5, 99.2, 10, 100.3, 7, 101.5, 6, 103.5, 4, 104.3, 1.5, 103.5, 1.3, 101.5, 2.8, 100.3, 5.8, 98.3, 8, 98.5, 12, 97.7, 16.5, 95.3, 15.8, 94.3, 18, 94, 16, 92.2, 20.8, 90.8, 22.5, 89, 21.7, 86.5, 20, 85, 19.2, 82.5, 16.5, 80.2, 15.5, 80.3, 13, 79.8, 10.3, 78, 8.9, 77.2, 8.1, 76.2, 10, 75, 13, 73.5, 16.5, 72.8, 19, 72.8, 21, 70.5, 20.8, 69, 22.3, 70.5, 23, 68.2, 23.5, 66.5, 25.3, 62, 25.2, 57.5, 25.7, 56.8, 27, 54, 26.7, 51.5, 27.8, 50, 30, 48.8, 30, 48, 29.5, 49.8, 27, 50.5, 25.5, 51.5, 24.2, 53.5, 24.2, 56, 26.2, 57.3, 24, 59.8, 22.5, 58.5, 20.5, 57.5, 18.9, 55.5, 17.2, 52.2, 15.8, 49, 14.5, 45, 12.8, 43.5, 12.6, 43.2, 11.7, 44.5, 10.4, 48, 11.2, 51.2, 11.8, 51, 10.4, 49.5, 7.5, 47, 4.5, 44, 1.5, 41.5, -1.5, 39.5, -4.5, 39.2, -7, 39.5, -10, 40.6, -14, 40.4, -16.5, 36, -18.5, 35, -21.5, 35.4, -24, 32.8, -25.8, 32.7, -28, 30, -31.2, 27.5, -33.5, 25, -34, 20, -34.8, 18.4, -34, 17.8, -31.5, 16.5, -28.6, 15, -26, 14.5, -22.5, 12, -18, 11.8, -15, 13.5, -12, 13.2, -9, 12.2, -6, 9.5, -2.5, 9, 1, 9.8, 3.8, 8.5, 4.5, 5.8, 4.4, 4, 6.3, 1, 6, -2, 4.8, -4.5, 5.2, -7.5, 4.4, -10.5, 6.3, -13, 8.5, -14.5, 10.5, -16.8, 12.5, -17.4, 14.8, -16.5, 19.5, -16.2, 21, -14.5, 26, -12.5, 28, -9.8, 30, -9.8, 32, -8, 33.8, -6, 35.7, -5.5, 35.9,
];
const MEDITERRANEAN: Poly = [
  -5.5, 36, -2, 36.7, 0, 38.3, 0.2, 39.5, 3, 42, 3.2, 43.3, 6, 43.1, 8.5, 44.4, 10, 44, 10.5, 43, 12.3, 41.5, 14, 40.8, 15.6, 40, 16, 38.8, 15.8, 38, 16.5, 38.3, 17, 39.5, 16.8, 40.5, 18.5, 40.2, 17.5, 41, 16, 41.9, 14, 42.4, 13, 43.6, 12.3, 44.5, 12.3, 45.3, 13.8, 45.6, 14.2, 44.8, 15.5, 43.8, 17.5, 42.8, 19.4, 41.8, 19.4, 40, 20.2, 39.5, 21, 38.3, 21.7, 37, 23, 36.5, 22.8, 37.9, 24, 38, 23.6, 40, 22.8, 40.5, 24, 40.7, 26.2, 40.8, 26.2, 39.5, 27, 38.2, 27.5, 37, 30, 36.2, 32.5, 36.1, 34.5, 36.7, 36, 36.6, 36, 34.5, 35.2, 33, 34.5, 31.5, 32.5, 31.2, 30, 31.3, 27, 31, 24, 32.2, 21.5, 32.8, 20, 31.6, 19, 30.3, 15.2, 32.3, 12, 32.8, 10.2, 33.9, 11.1, 35.2, 10.7, 36.9, 9, 37.2, 6, 36.9, 3, 36.8, 0, 35.9, -2, 35.2, -5.3, 35.9,
];
const BLACK_SEA: Poly = [28, 41.5, 28, 44, 30, 46, 33, 46, 36, 45, 41, 43, 41.5, 41.5, 36, 41.5, 31, 41.2];
const CASPIAN: Poly = [47, 45, 53, 47, 54, 42, 53.5, 37, 49, 37, 48, 40, 47, 43];
const RED_SEA: Poly = [43, 12, 40, 15.5, 37.2, 20, 35, 24, 33.5, 27.5, 32.6, 29.8, 34.8, 29, 35, 27.5, 37, 24, 39, 21, 42, 16, 43.3, 13];
const HUDSON: Poly = [-94.5, 59, -93, 61.5, -90, 63.6, -87, 64, -85, 64.4, -82, 63.7, -80.5, 62.4, -78, 62.2, -77.5, 60, -78.5, 58, -77, 56, -79.3, 55, -79.7, 53, -79, 51.5, -81, 52, -82.3, 53, -85, 55.2, -88, 56.5, -92, 57, -94, 58.5];
const NORTH_AMERICA: Poly = [
  -166, 68.8, -165, 68.5, -166, 65, -163, 64.5, -165, 62, -166, 60, -162, 58.8, -158, 58.5, -162, 55.5, -165, 54.5, -158, 57, -154, 58.5, -151, 59.5, -150, 61, -147, 60.8, -144, 60, -140, 59.7, -136, 58, -133, 55, -130, 55, -128, 51, -124.5, 48.5, -124, 46, -124, 42, -124, 40.4, -122.5, 37.5, -121, 35, -118.5, 34, -117.2, 32.6, -115.5, 30, -114, 27.8, -111.8, 24.5, -110, 23, -109.5, 23.5, -112, 27, -114.5, 31.2, -114.8, 31.8, -112.5, 29, -110.5, 27.5, -109, 25.5, -106.5, 23, -105.5, 21.5, -105.5, 20, -104, 19, -101.5, 17.5, -98, 16, -95, 16, -93.5, 15.8, -91.5, 14, -89, 13.5, -87.5, 13, -85.7, 11.4, -83.7, 10, -82, 8.2, -80, 7.4, -77.5, 8.7, -79.5, 9.5, -81.5, 9, -83, 9.8, -83.5, 11, -83.3, 13, -83.8, 15, -85, 16, -88, 15.8, -88.5, 17.5, -88, 18.5, -87, 21.5, -90.4, 21.2, -90.5, 19.8, -91.5, 18.5, -94.5, 18.2, -96.5, 19, -97.5, 22, -97.3, 25.5, -97.2, 27.5, -95, 29, -92, 29.6, -89.5, 29.2, -89, 30.2, -87.5, 30.3, -85.3, 29.7, -84, 30, -82.8, 28.8, -82, 26.7, -81, 25.2, -80.2, 25.8, -80, 27.5, -81, 30, -81, 32, -79, 33.5, -76.5, 34.7, -75.7, 35.5, -76, 37, -75.5, 38.5, -74, 39.5, -74, 40.5, -72, 41, -70, 41.7, -70.5, 43, -67, 44.8, -65, 44, -62, 45.2, -60, 46, -61, 47, -64.5, 49.5, -60, 50.3, -57, 51.5, -56, 52.5, -60, 55, -61.5, 56.5, -64, 60, -66, 59.5, -68, 58.5, -70, 59, -70, 60.5, -73, 62, -77.5, 62.8, -81, 64.5, -86, 67, -90, 68.6, -94, 71, -98, 68.5, -105, 68, -112, 67.8, -120, 69, -128, 70, -135, 69, -141, 69.7, -150, 70.5, -156.5, 71.3, -162, 70.2,
];
const SOUTH_AMERICA: Poly = [
  -77.5, 8.7, -76, 9.5, -74.5, 11, -72, 12, -71.5, 11.8, -69.5, 11.5, -67, 10.6, -64, 10.6, -62, 10.7, -61, 8.5, -58, 6.8, -55, 5.8, -52.5, 5, -51, 4, -50, 1.5, -50, 0, -48.5, -1, -44.5, -2.5, -41, -2.9, -38, -4, -35.2, -5.5, -34.8, -8, -37, -11.5, -39, -14, -39.2, -17.5, -40.5, -20.5, -42, -23, -44.5, -23.2, -48, -25.5, -48.7, -28.5, -50, -31, -53, -34, -55, -35, -57, -34.8, -58.5, -34.3, -57, -36.5, -57, -38.2, -62, -39, -62.2, -41, -65, -41, -64.5, -43, -65.5, -45, -67.5, -46.5, -66, -47.8, -68.5, -50.2, -69, -52.5, -68.5, -53.3, -66, -55, -71, -54.8, -74, -52.5, -75.5, -49, -75, -46, -73.8, -42, -73.5, -38, -71.5, -32, -71.5, -28, -70.3, -23, -70.2, -18.5, -75, -15.5, -77.5, -12, -79.5, -7.5, -81.2, -5.8, -80, -3, -80.5, -1.5, -80, 1, -78.8, 1.8, -77.3, 4, -77.5, 6.5,
];
const AUSTRALIA: Poly = [
  113.5, -22, 114, -26, 115, -30, 115, -34.2, 118, -35, 123, -34, 126, -32.3, 131, -31.6, 134, -32.8, 135.8, -35, 137.5, -33, 138, -35.6, 140, -38, 143.5, -38.8, 146.5, -39, 148, -37.7, 150, -37, 151.2, -33.9, 153, -30, 153.2, -27, 150.8, -22.5, 149, -20.2, 146, -18.8, 145.5, -15, 143.5, -14, 142.5, -10.7, 141.5, -13, 141.3, -16.5, 139.5, -17.5, 137, -15.8, 135.5, -14.8, 136.8, -12.2, 132, -11.3, 130, -12.3, 129.5, -15, 127, -14, 125, -15.3, 122.2, -17.5, 121, -19.5, 117, -20.5, 114.5, -21.7,
];
const ANTARCTICA: Poly = [
  -180, -90, 180, -90, 180, -72, 160, -70, 150, -69, 135, -66, 110, -66, 90, -67, 70, -68, 55, -67, 30, -70, 10, -70, -10, -71, -25, -73, -40, -78, -60, -75, -62, -70, -68, -67, -60, -63.5, -65, -67, -75, -72, -100, -73, -125, -74, -150, -77, -165, -78, -180, -77,
];
const ISLANDS: Poly[] = [
  // Greenland, Arctic Canada, Newfoundland, Iceland, Caribbean
  [-73, 78.5, -65, 81, -45, 82.5, -25, 83.5, -20, 80, -18, 76, -20, 72, -22, 70.5, -27, 68.5, -35, 66, -40, 65, -43, 60, -48, 61, -51, 64, -53, 67, -54, 70, -58, 75, -66, 76],
  [-62, 66.5, -66, 62.8, -73, 63.5, -78, 64.8, -75, 67.5, -80, 70, -86, 73, -76, 73.8, -68, 70.5],
  [-118, 71, -110, 73, -102, 72, -101, 69.5, -110, 68.8, -117, 69.3],
  [-125, 72, -120, 74.5, -115, 73.5, -117, 71.5],
  [-90, 76.5, -80, 76.5, -62, 82, -75, 83, -92, 81, -95, 77.5],
  [-92, 75.5, -82, 76.2, -80, 74.5, -90, 74.3],
  [-59.3, 47.6, -53, 46.6, -52.8, 49, -55.5, 51.6, -58.5, 48.5],
  [-24, 65.5, -22, 66.4, -14.5, 66.2, -13.5, 64.4, -18, 63.4, -22.5, 63.8],
  [-84.9, 21.9, -81, 23.1, -77.5, 21.8, -74.2, 20.2, -77.6, 19.9, -80.5, 21.7, -82.7, 22.1],
  [-74.4, 18.4, -72, 19.9, -68.4, 18.6, -71.6, 17.8],
  // Europe / Med islands
  [-5.7, 50, 1.5, 51, 1.7, 52.8, -0.2, 53.7, -2, 55.8, -1.8, 57.5, -3, 58.6, -5, 58.6, -6, 56.5, -5, 55, -3.2, 54.8, -3.2, 53.4, -4.5, 53.3, -4.2, 52.3, -5.2, 51.7, -3, 51.2, -4.5, 50.3],
  [-10, 51.7, -6, 52.2, -6, 54.2, -6.5, 55.2, -8.3, 55, -10, 54],
  [12.4, 38, 15.6, 38.3, 15.1, 36.7, 12.5, 37.5],
  [8.2, 41, 9.7, 41, 9.6, 39.2, 8.5, 39],
  [23.5, 35.5, 26.3, 35.3, 24, 35],
  [32.3, 35, 34.5, 35.6, 33.5, 34.7],
  [52, 71, 55, 73, 60, 76.5, 68.5, 77, 60, 75, 56, 72, 55.5, 70.5],
  [142, 46, 143.5, 49, 143, 53, 142, 54, 142, 50.5],
  [-180, 68.8, -175, 67.5, -170, 66, -172, 64.5, -178, 64.5, -180, 65.5],
  // Asia / Pacific
  [130.9, 34, 133, 33.9, 135, 33.5, 136.8, 34.3, 138.5, 34.6, 140.8, 35.3, 141, 38.5, 141.5, 40.5, 140.2, 41.2, 139.8, 39.8, 138.5, 37.5, 136.8, 37, 135.5, 35.7, 132.5, 35.4],
  [140, 42, 141.5, 42.5, 145.5, 43.3, 142, 45.4, 141.5, 43.8, 140, 43.2],
  [129.8, 33, 131.2, 33.6, 132, 32.3, 131.2, 31, 130.2, 31.2],
  [132.5, 33.5, 134.5, 34.2, 134.2, 33.2, 133, 32.8],
  [120.2, 23, 121, 25.2, 122, 25, 121, 22],
  [108.7, 19.3, 110.5, 20, 111, 19.5, 109.5, 18.2],
  [120.3, 18.5, 122.2, 18.5, 122, 16.2, 124, 13.5, 121.5, 13.5, 120.5, 14.5, 119.8, 16.5],
  [122, 7, 123.5, 8.7, 126.3, 8, 126.2, 6.3, 125, 5.8, 123.5, 7.2],
  [122, 11, 124.5, 12.2, 125.5, 11, 124, 9.5, 122.5, 9.8],
  [79.8, 9.5, 81.8, 7.5, 80.5, 6, 79.9, 7.5],
  [95.3, 5.6, 98.5, 3.8, 101, 2, 103.8, -1, 106, -3, 105.8, -5.8, 103.2, -4.5, 100.5, -1.5, 98.5, 1.5],
  [105.2, -6.8, 108.5, -6.5, 112.5, -6.8, 114.5, -7.8, 114.5, -8.7, 110, -8.2, 106.5, -7.5],
  [109, 1.5, 111, 1.8, 113, 3.2, 115, 5, 117, 7, 119, 5.2, 117.5, 1, 118, -1, 116.5, -3.8, 114.5, -4, 111, -3, 110, -1.5],
  [119.5, 0.5, 122, 1, 125, 1.5, 121, 0.8, 123.5, -1, 121.5, -3, 123, -4.5, 121, -4.8, 120.4, -5.5, 119.5, -3.5, 119.8, -1],
  [131, -0.8, 134, -0.7, 138, -1.7, 141, -2.6, 145, -4.2, 147.5, -6, 150.5, -10.5, 147.5, -10, 144, -7.8, 141, -9.1, 138, -8.3, 137.5, -5.8, 135, -3.5, 132.5, -4],
  [49.3, -12, 50.5, -15.5, 49.5, -18, 47.5, -24.8, 45, -25.4, 43.3, -22.5, 44.5, -16.5, 47, -15],
  [144.7, -40.8, 148.3, -40.9, 148, -43.2, 146, -43.6],
  [172.8, -34.5, 174.5, -35.8, 178.5, -37.6, 177, -39.5, 175, -41.5, 174, -39.5, 173.8, -37],
  [172.7, -40.6, 174.2, -41.6, 172.7, -43.8, 171, -44.5, 169, -46.6, 166.5, -46, 168.2, -44, 171, -42.3],
];
const LAND: Poly[] = [AFROEURASIA, NORTH_AMERICA, SOUTH_AMERICA, AUSTRALIA, ANTARCTICA, ...ISLANDS];
const WATER: Poly[] = [MEDITERRANEAN, BLACK_SEA, CASPIAN, RED_SEA, HUDSON];

/** big cities (lat, lon, weight) -> the lit-up night side */
export const CITY_LIGHTS: [number, number, number][] = [
  [40.7, -74, 1], [34, -118, 0.8], [41.9, -87.6, 0.6], [19.4, -99.1, 0.8], [-23.5, -46.6, 1], [-34.6, -58.4, 0.6], [-12, -77, 0.4], [4.7, -74, 0.4], [51.5, -0.1, 0.9], [48.9, 2.3, 0.7], [52.5, 13.4, 0.5], [40.4, -3.7, 0.5], [41.9, 12.5, 0.5], [41, 29, 0.7], [55.7, 37.6, 0.7], [30, 31.2, 0.7], [6.5, 3.4, 0.7], [-1.3, 36.8, 0.4], [-26.2, 28, 0.5], [25.2, 55.3, 0.5], [35.7, 51.4, 0.5], [28.6, 77.2, 1], [19, 72.8, 0.9], [23.8, 90.4, 0.6], [13.7, 100.5, 0.6], [1.35, 103.8, 0.5], [-6.2, 106.8, 0.7], [39.9, 116.4, 0.9], [31.2, 121.5, 1], [22.3, 114.2, 0.7], [37.6, 127, 0.8], [35.7, 139.7, 1], [34.7, 135.5, 0.6], [14.6, 121, 0.6], [-33.9, 151.2, 0.6], [-37.8, 145, 0.4], [43.7, -79.4, 0.5], [49.3, -123.1, 0.3], [25.8, -80.2, 0.4], [29.8, -95.4, 0.4], [22.6, 88.4, 0.7], [24.9, 67, 0.6], [24.7, 46.7, 0.4], [50.4, 30.5, 0.4], [52.2, 21, 0.4], [31.5, 74.3, 0.5], [30.7, 104.1, 0.5], [-33.4, -70.7, 0.4], [-4.3, 15.3, 0.4], [9, 38.7, 0.3], [33.6, -7.6, 0.3],
];

export const EARTH_W = 1024;
export const EARTH_H = 512;
let _earth: Uint8Array<ArrayBuffer> | null = null;

/**
 * Equirectangular RGBA mask, row r = latitude (r/H*180-90): R = land coverage (softened), G = coast / terrain noise,
 * B = city-light intensity, A = elevation noise. Built once per module load (pure maths).
 */
export const earthMask = (): Uint8Array<ArrayBuffer> => {
  if (_earth) return _earth;
  const W = EARTH_W;
  const H = EARTH_H;
  const cov = new Uint8Array(W * H);
  const fillPoly = (poly: Poly) => {
    const n = poly.length / 2;
    const px: number[] = [];
    const py: number[] = [];
    for (let i = 0; i < n; i++) {
      px.push(((poly[i * 2] + 180) / 360) * W);
      py.push(((poly[i * 2 + 1] + 90) / 180) * H);
    }
    for (let r = 0; r < H; r++) {
      const yc = r + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const y0 = py[i];
        const y1 = py[j];
        if (y0 <= yc !== y1 <= yc) xs.push(px[i] + ((yc - y0) / (y1 - y0)) * (px[j] - px[i]));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const a = Math.max(0, Math.ceil(xs[k] - 0.5));
        const b = Math.min(W - 1, Math.floor(xs[k + 1] - 0.5));
        for (let x = a; x <= b; x++) cov[r * W + x] ^= 1;
      }
    }
  };
  LAND.forEach(fillPoly);
  WATER.forEach(fillPoly);
  // soften the coastline: two separable box blurs (radius 2) with horizontal wrap
  const f = new Float32Array(W * H);
  for (let i = 0; i < f.length; i++) f[i] = cov[i];
  const tmp = new Float32Array(W * H);
  for (let pass = 0; pass < 2; pass++) {
    for (let r = 0; r < H; r++)
      for (let x = 0; x < W; x++) {
        let s = 0;
        for (let k = -2; k <= 2; k++) s += f[r * W + ((x + k + W) % W)];
        tmp[r * W + x] = s / 5;
      }
    for (let r = 0; r < H; r++)
      for (let x = 0; x < W; x++) {
        let s = 0;
        for (let k = -2; k <= 2; k++) s += tmp[Math.min(H - 1, Math.max(0, r + k)) * W + x];
        f[r * W + x] = s / 5;
      }
  }
  const out = new Uint8Array(W * H * 4);
  for (let r = 0; r < H; r++)
    for (let x = 0; x < W; x++) {
      const i = r * W + x;
      const nx = (x / W) * 18;
      const ny = (r / H) * 9;
      out[i * 4] = Math.round(clamp(f[i]) * 255);
      out[i * 4 + 1] = Math.round(fbmN(nx, ny, 11, 4) * 255);
      out[i * 4 + 3] = Math.round(fbmN(nx * 0.7 + 40, ny * 0.7, 23, 4) * 255);
    }
  // city lights: gaussian blobs around big cities + faint scattered towns on land
  const lights = new Float32Array(W * H);
  for (const [lat, lon, wgt] of CITY_LIGHTS) {
    const cx = ((lon + 180) / 360) * W;
    const cy = ((lat + 90) / 180) * H;
    const sx = 5.5 * wgt + 2.2;
    for (let dy = -16; dy <= 16; dy++)
      for (let dx = -16; dx <= 16; dx++) {
        const x = Math.round(cx) + dx;
        const y = Math.round(cy) + dy;
        if (y < 0 || y >= H) continue;
        const xx = (x + W) % W;
        const d2 = (dx * dx + dy * dy) / (sx * sx);
        lights[y * W + xx] += Math.exp(-d2) * (0.55 + 0.45 * wgt) * (0.7 + 0.6 * hash01(dx, dy, lat));
      }
  }
  for (let r = 0; r < H; r++) {
    const lat = (r / H) * 180 - 90;
    const polar = Math.abs(lat) > 62 ? 0.25 : 1;
    for (let x = 0; x < W; x++) {
      const i = r * W + x;
      if (f[i] < 0.55) continue;
      const dens = fbmN((x / W) * 30, (r / H) * 15, 77, 3);
      const speck = hash01(x, r, 5) > 0.968 - dens * 0.03 ? 0.35 * dens * polar : 0;
      out[i * 4 + 2] = Math.round(clamp(lights[i] + speck) * 255);
    }
  }
  _earth = out;
  return out;
};
