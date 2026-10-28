// Shared helpers for the round-3 product/document motions (feature-callout-orbit, unbox-lid-lift, colorway-swap).
import React from 'react';
import {resolveSrc} from './asset';
import {hexRgb, mixHex, withAlpha} from './r2-s1-kit';

/** A neutral, procedural product (a rounded smart speaker) used whenever no `src` image is given. Centred on 0,0, `s` px tall-ish. */
export const ProductArt: React.FC<{uid: string; s: number; body: string; accent: string; src?: string; tint?: string | null}> = ({uid, s, body, accent, src, tint}) => {
  if (src) {
    const filt = tint ? `url(#${uid}-tint)` : undefined;
    return (
      <g>
        {tint ? <TintFilter id={`${uid}-tint`} color={tint} /> : null}
        <image href={resolveSrc(src)} x={-s / 2} y={-s / 2} width={s} height={s} preserveAspectRatio="xMidYMid meet" filter={filt} />
      </g>
    );
  }
  const bw = s * 0.6;
  const bh = s * 0.86;
  const rx = s * 0.16;
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 5; c++) dots.push(<circle key={`${r}-${c}`} cx={(c - 2) * s * 0.07} cy={s * 0.02 + r * s * 0.05} r={s * 0.014} fill={withAlpha('#000000', 0.28)} />);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-pb`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={mixHex(body, '#ffffff', 0.22)} />
          <stop offset="0.45" stopColor={body} />
          <stop offset="1" stopColor={mixHex(body, '#000000', 0.38)} />
        </linearGradient>
      </defs>
      <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={rx} fill={`url(#${uid}-pb)`} />
      <rect x={-bw / 2 + s * 0.03} y={-bh / 2 + s * 0.04} width={s * 0.05} height={bh - s * 0.08} rx={s * 0.025} fill="#fff" opacity={0.16} />
      <rect x={-bw * 0.3} y={-bh / 2 + s * 0.05} width={bw * 0.6} height={s * 0.018} rx={s * 0.009} fill={accent} />
      <circle cx={0} cy={-bh * 0.3} r={s * 0.075} fill={mixHex(body, '#000000', 0.5)} />
      <circle cx={0} cy={-bh * 0.3} r={s * 0.052} fill={accent} />
      <circle cx={-s * 0.018} cy={-bh * 0.3 - s * 0.018} r={s * 0.014} fill="#fff" opacity={0.55} />
      {dots}
    </g>
  );
};

/** Multiply-tints an image through its luminance (recolours a product photo to `color`). */
export const TintFilter: React.FC<{id: string; color: string}> = ({id, color}) => {
  const [r, g, b] = hexRgb(color).map((v) => v / 255);
  const k = 1.35;
  const m = (c: number) => `${(0.3 * c * k).toFixed(3)} ${(0.59 * c * k).toFixed(3)} ${(0.11 * c * k).toFixed(3)} 0 0`;
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={`${m(r)} ${m(g)} ${m(b)} 0 0 0 1 0`} />
    </filter>
  );
};

/** estimated rendered width of a string in a font of size fs (em factor per font family) */
export const textW = (s: string, fs: number, em = 0.56) => s.length * fs * em;
