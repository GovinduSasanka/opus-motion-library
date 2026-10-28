import React from 'react';
import {Img} from 'remotion';
import {resolveSrc} from './asset';
import {clamp} from './ease';
import {fonts} from './fonts';
import {textWidth} from './r2-mg2b-kit';
import {hash01} from './text-kit';

/**
 * r3-brand-kit — small shared helpers for the intro / outro / branding motions (logo reveals, end screens, credits,
 * title cards, sponsor slates). Pure functions of the frame; nothing random.
 */

/** 0..1 segment progress between two frames (linear) */
export const seg = (frame: number, a: number, b: number) => (b <= a ? (frame >= a ? 1 : 0) : clamp((frame - a) / (b - a)));
export const eo3 = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const eo5 = (t: number) => 1 - Math.pow(1 - clamp(t), 5);
export const ei3 = (t: number) => Math.pow(clamp(t), 3);
export const eio = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const backOut = (t: number, s = 1.70158) => {
  const x = clamp(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** `#rgb` / `#rrggbb` + alpha -> rgba(); any other colour string is returned unchanged */
export const withAlpha = (c: string, a: number) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return c;
  const h = m[1].length === 3 ? m[1].split('').map((x) => x + x).join('') : m[1];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** relative luminance 0..1 of a #hex colour (0.5 when unknown) */
export const lum = (c: string) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return 0.5;
  const h = m[1].length === 3 ? m[1].split('').map((x) => x + x).join('') : m[1];
  const n = parseInt(h, 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};

/** the standard logo box for a stage: wide on landscape, taller and narrower on portrait */
export const logoBox = (w: number, h: number, u: number, portrait: boolean, scale = 1) => {
  const bw = (portrait ? w * 0.7 : Math.min(w * 0.42, h * 0.78)) * scale;
  const bh = (portrait ? Math.min(h * 0.2, w * 0.5) : h * 0.3) * scale;
  return {bw, bh, cx: w / 2, cy: h / 2, u};
};

/**
 * The brand mark: a picture (`src`, object-fit contain inside the box) or, when none is given, a wordmark `text` set
 * to fit the box. Centred on (0,0) of its own box so callers position / animate it with a wrapper.
 */
export const Mark: React.FC<{
  src?: string;
  text: string;
  bw: number;
  bh: number;
  color: string;
  font?: keyof typeof fonts;
  weight?: number;
  tracking?: number;
  style?: React.CSSProperties;
}> = ({src, text, bw, bh, color, font = 'display', weight = 400, tracking = 0.02, style}) => {
  if (src) {
    return (
      <div style={{width: bw, height: bh, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>
        <Img src={resolveSrc(src)} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
      </div>
    );
  }
  const fam = fonts[font];
  const lines = text.split('\n');
  const widest = Math.max(1, ...lines.map((l) => textWidth(l, 100, fam, weight) / 100 + tracking * l.length));
  const fs = Math.min((bw * 0.98) / widest, (bh * 0.96) / (lines.length * 1.05));
  return (
    <div
      style={{
        width: bw,
        height: bh,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fam,
        fontWeight: weight,
        fontSize: fs,
        lineHeight: 1.05,
        letterSpacing: `${tracking}em`,
        color,
        whiteSpace: 'nowrap',
        textAlign: 'center',
        ...style,
      }}
    >
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

/** seeded wobble in -1..1 (smooth in t) */
export const wob = (seed: number, i: number, t: number) => Math.sin(t * (1.1 + hash01(i, seed) * 1.4) + hash01(i + 9, seed) * 6.283);
