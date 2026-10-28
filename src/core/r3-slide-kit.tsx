import React from 'react';
import {resolveSrc} from './asset';
import {clamp} from './ease';
import {tfonts, estWidth, type TFont} from './text-kit';

/** Shared helpers for the round-3 presentation / keynote slide motions (big-stat-slide, quote-slide, agenda-list-slide, ...). */

export {mixHex, withAlpha, backOut} from './r2-s1-kit';
export {avatarColor, initials} from './r3-social';

export const SLIDE_FONTS = ['sans', 'serif', 'display', 'grotesk', 'rounded', 'instrument', 'mono'] as const;
/** user-facing font name -> TFont (unknown names fall back) */
export const slideFont = (name: string | undefined, fallback: TFont = 'sans'): TFont => ((SLIDE_FONTS as readonly string[]).includes(name ?? '') ? (name as TFont) : fallback);
export const famOf = (f: TFont) => tfonts[f];

/** greedy word wrap with estimated widths */
export const wrapEst = (text: string, size: number, maxW: number, font: TFont, tracking = 0): string[] => {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const t = cur ? `${cur} ${wd}` : wd;
    if (cur && estWidth(t, size, font, tracking) > maxW) {
      lines.push(cur);
      cur = wd;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
};

/** largest size (<= size) at which `text` wraps inside maxW x maxH (line height lh em); caps the last line with an ellipsis if still too long at minSize */
export const wrapFit = (text: string, font: TFont, size: number, maxW: number, maxH: number, lh = 1.25, minSize = 12, tracking = 0) => {
  let s = size;
  let lines = wrapEst(text, s, maxW, font, tracking);
  while ((lines.length * s * lh > maxH || lines.some((l) => estWidth(l, s, font, tracking) > maxW)) && s > minSize) {
    s *= 0.94;
    lines = wrapEst(text, s, maxW, font, tracking);
  }
  const maxLines = Math.max(1, Math.floor(maxH / (s * lh)));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s.,;:!?]*$/, '') + '…';
  }
  return {lines, size: s, lineH: s * lh};
};

/** single line that shrinks to fit maxW */
export const fitLine = (text: string, font: TFont, size: number, maxW: number, tracking = 0) => {
  const w = estWidth(text, size, font, tracking);
  return w > maxW ? size * (maxW / w) : size;
};

/** 12,480 / 12 480 / 12480 */
export const fmtNum = (n: number, decimals = 0, thousands = true) => {
  const fixed = Math.abs(n).toFixed(Math.max(0, Math.round(decimals)));
  const [i, d] = fixed.split('.');
  const ii = thousands ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : i;
  return (n < 0 ? '-' : '') + ii + (d ? '.' + d : '');
};

/** rounded image (cover) clipped to a rect / circle at (x, y) with size w x h; falls back to nothing (caller draws the placeholder) */
export const ClipImage: React.FC<{id: string; src: string; x: number; y: number; w: number; h: number; r?: number; circle?: boolean; fit?: 'slice' | 'meet'; gray?: boolean; opacity?: number}> = ({id, src, x, y, w, h, r = 0, circle, fit = 'slice', gray, opacity = 1}) => (
  <g opacity={opacity}>
    <defs>
      <clipPath id={id}>{circle ? <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} /> : <rect x={x} y={y} width={w} height={h} rx={r} />}</clipPath>
    </defs>
    <image href={resolveSrc(src)} x={x} y={y} width={w} height={h} preserveAspectRatio={`xMidYMid ${fit}`} clipPath={`url(#${id})`} style={gray ? {filter: 'grayscale(1) contrast(1.05)'} : undefined} />
  </g>
);

/** 24x24 stroke icon set for feature columns / badges */
const gearPath = () => {
  const pts: string[] = [];
  const teeth = 8;
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const hi = i % 4 === 1 || i % 4 === 2;
    const r = hi ? 9.6 : 7.6;
    pts.push(`${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
};
const starIcon = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 9.6 : 4.2;
    pts.push(`${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r + 0.6).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
})();

export const ICON_PATHS: Record<string, string[]> = {
  bolt: ['M13 2.5 L4.5 13.5 H11 L10 21.5 L19.5 9.5 H13 Z'],
  shield: ['M12 2.5 L20 5.5 V11.5 C20 16.5 16.5 20.2 12 21.5 C7.5 20.2 4 16.5 4 11.5 V5.5 Z', 'M8.5 12 L11 14.5 L15.5 9.5'],
  chart: ['M4 20 V13 M10 20 V5 M16 20 V9.5 M21 20 H3'],
  globe: ['M12 3 a9 9 0 1 0 0.01 0', 'M3 12 H21', 'M12 3 C8 7.5 8 16.5 12 21 M12 3 C16 7.5 16 16.5 12 21'],
  heart: ['M12 20.5 C4 15 3 10 3 8.3 C3 5.5 5.2 3.8 7.5 3.8 C9.4 3.8 11 4.9 12 6.6 C13 4.9 14.6 3.8 16.5 3.8 C18.8 3.8 21 5.5 21 8.3 C21 10 20 15 12 20.5 Z'],
  star: [starIcon],
  gear: [gearPath(), 'M12 9 a3 3 0 1 0 0.01 0'],
  lock: ['M5.5 10.5 H18.5 V20.5 H5.5 Z', 'M8 10.5 V7.5 a4 4 0 0 1 8 0 V10.5', 'M12 14.5 V17'],
  spark: ['M12 2.5 C12.8 8 16 11.2 21.5 12 C16 12.8 12.8 16 12 21.5 C11.2 16 8 12.8 2.5 12 C8 11.2 11.2 8 12 2.5 Z'],
  users: ['M9 11 a3.2 3.2 0 1 0 0.01 0', 'M3 20 C3 15.6 6 13.6 9 13.6 C12 13.6 15 15.6 15 20', 'M16.5 6.8 a2.6 2.6 0 1 1 0 5', 'M17 13.6 C19.8 13.6 21.5 15.4 21.5 19.5'],
  clock: ['M12 3 a9 9 0 1 0 0.01 0', 'M12 7 V12 L15.5 14.2'],
  cloud: ['M7 18.5 a4.5 4.5 0 0 1 -0.5 -9 a6 6 0 0 1 11.4 1.6 a3.7 3.7 0 0 1 -0.9 7.4 Z'],
  target: ['M12 3 a9 9 0 1 0 0.01 0', 'M12 7.5 a4.5 4.5 0 1 0 0.01 0', 'M12 11.2 a0.8 0.8 0 1 0 0.01 0'],
  code: ['M8 7 L3 12 L8 17 M16 7 L21 12 L16 17 M13.5 5 L10.5 19'],
  check: ['M12 3 a9 9 0 1 0 0.01 0', 'M7.8 12.4 L10.7 15.3 L16.4 9.2'],
  rocket: ['M12 2.5 C15.5 5 17 9 16.5 14 H7.5 C7 9 8.5 5 12 2.5 Z', 'M7.5 14 L4.5 17.5 L8.5 16.5 M16.5 14 L19.5 17.5 L15.5 16.5', 'M12 9.5 a1.6 1.6 0 1 0 0.01 0', 'M10.5 17.5 L12 21.5 L13.5 17.5'],
};
export const ICON_NAMES = Object.keys(ICON_PATHS);
/** unknown / empty names cycle through the set by index */
export const iconFor = (name: string | undefined, i: number) => (name && ICON_PATHS[name] ? name : ICON_NAMES[(i * 3 + 1) % ICON_NAMES.length]);

export const Icon: React.FC<{name: string; cx: number; cy: number; size: number; color: string; sw?: number; draw?: number}> = ({name, cx, cy, size, color, sw = 1.7, draw = 1}) => {
  const paths = ICON_PATHS[name] ?? ICON_PATHS.spark;
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 24})`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => (
        <path key={i} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(draw)} />
      ))}
    </g>
  );
};

/** items can be given as plain strings or objects; normalise to objects with the main text under `key` */
export const asObjs = <T extends Record<string, any>>(items: unknown, key: string, fallback: T[]): T[] => {
  if (!Array.isArray(items) || !items.length) return fallback;
  return items.map((it) => (typeof it === 'string' || typeof it === 'number' ? ({[key]: String(it)} as unknown as T) : (it as T)));
};

/** safe colour for transparent backgrounds when we need to mix with it */
export const solidBg = (background: string, fallback = '#ffffff') => (background === 'transparent' ? fallback : background);

/** relative luminance 0..1 of a #rgb / #rrggbb colour (for choosing readable text on a fill) */
export const hexLum = (hex: string) => {
  let v = (hex || '#000000').replace('#', '').trim();
  if (v.length === 3) v = v.split('').map((c) => c + c).join('');
  const n = parseInt(v.slice(0, 6), 16) || 0;
  const ch = [(n >> 16) & 255, (n >> 8) & 255, (n >> 0) & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
