import {fonts} from './fonts';

/** Shared helpers for the seamless UI loops (src/motions/ui/*-loop etc.). Everything is a pure function of the frame. */
export const TAU = Math.PI * 2;
export const fract = (x: number) => x - Math.floor(x);
/** 0 -> 1 -> 0 raised cosine over one cycle of phase p (p in cycles) */
export const tri = (p: number) => 0.5 - 0.5 * Math.cos(TAU * p);
/** loop phase 0..1 of `frame` inside a loop of `T` frames (wraps, so frame T == frame 0) */
export const loopPhase = (frame: number, T: number) => (((frame % T) + T) % T) / T;
/** whole cycles per loop: keeps a periodic motion seamless whatever the user passes as `speed` */
export const cycles = (speed: number, min = 1) => Math.max(min, Math.round(Number.isFinite(speed) ? speed : 1));
/** font prop: 'auto' (or empty) -> the library sans */
export const fam = (f: string | undefined) => (!f || f === 'auto' ? fonts.sans : f);
/** CSS background for a frame colour, or none when 'transparent' */
export const bgCss = (background: string): string | undefined => (!background || background === 'transparent' ? undefined : background);
/** colour to treat as the surface behind the UI (for tinting) even when the frame is transparent */
export const surface = (background: string, fallback = '#ffffff') => (!background || background === 'transparent' ? fallback : background);
/** is a hex colour dark? */
export const isDark = (hex: string) => {
  let v = (hex || '#000').replace('#', '');
  if (v.length === 3) v = v.split('').map((c) => c + c).join('');
  const n = parseInt(v.slice(0, 6), 16) || 0;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
};
