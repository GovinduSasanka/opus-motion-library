import React from 'react';
import {clamp} from './ease';
import {fonts} from './fonts';
import {regular, poly} from './shapes';
import {estWidth} from './text-kit';

/** Shared helpers for the round-3 social / marketing motions (subscribe, comments, poll, stories, sale, reviews, milestones). */

export {mixHex, withAlpha, backOut, easeOut3, sseg} from './r2-s1-kit';

export const SANS = fonts.sans;

/** neutral avatar palette (readable with white initials) */
export const AVATAR_COLORS = ['#E2574C', '#E8963C', '#C9A227', '#3FA66B', '#2F9DB5', '#4C6FE0', '#8A5CD6', '#D4568F'];

const hashStr = (s: string) => [...s].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);
export const avatarColor = (name: string, i = 0) => AVATAR_COLORS[(hashStr(name || String(i)) + i) % AVATAR_COLORS.length];

export const initials = (name: string) => {
  const parts = (name || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** 12,480 */
export const fmtInt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 1.2K / 3.5M, trimmed */
export const fmtCompact = (n: number, decimals = 1) => {
  const a = Math.abs(n);
  const trim = (v: number) => v.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  if (a >= 1e9) return trim(n / 1e9) + 'B';
  if (a >= 1e6) return trim(n / 1e6) + 'M';
  if (a >= 1e3) return trim(n / 1e3) + 'K';
  return String(Math.round(n));
};

/** greedy word wrap using estimated text widths; the last line gets an ellipsis if text overflows maxLines */
export const wrapText = (text: string, size: number, maxW: number, font: 'sans' | 'serif' | 'display' = 'sans', maxLines = 99): string[] => {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const t = cur ? `${cur} ${wd}` : wd;
    if (cur && estWidth(t, size, font) > maxW) {
      lines.push(cur);
      cur = wd;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    keep[maxLines - 1] = keep[maxLines - 1].replace(/[\s.,;:!?]*$/, '') + '…';
    return keep;
  }
  return lines;
};

/** 5-point star path centred on (cx, cy) with outer radius R */
export const starPath = (cx: number, cy: number, R: number, inner = 0.46) => `M${poly(regular(cx, cy, R, 5, -Math.PI / 2, R * inner)).replace(/ /g, 'L')}Z`;

/** heart path centred on (cx, cy), width ~ 2.1 s */
export const heartPath = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy + s * 0.95} C${cx - s * 1.5} ${cy - s * 0.1} ${cx - s * 0.7} ${cy - s * 1.0} ${cx} ${cy - s * 0.35} C${cx + s * 0.7} ${cy - s * 1.0} ${cx + s * 1.5} ${cy - s * 0.1} ${cx} ${cy + s * 0.95}Z`;

/** thumbs-up glyph, drawn in a 24x24 box placed at (x,y) = top-left, size s px */
export const ThumbUp: React.FC<{x: number; y: number; s: number; fill?: string; stroke?: string; sw?: number}> = ({x, y, s, fill = 'none', stroke = '#fff', sw = 1.6}) => (
  <g transform={`translate(${x} ${y}) scale(${s / 24})`}>
    <rect x={2} y={10.5} width={4.6} height={10.5} rx={1.3} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    <path
      d="M8.6 10.6 L12.4 3.4 Q14.9 3 15.2 5.4 L14.4 9.4 H19.7 Q22.1 9.6 21.7 12 L20.4 18.6 Q20 20.7 17.9 20.7 H9.9 Q8.6 20.7 8.6 19.4 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinejoin="round"
    />
  </g>
);

/** bell glyph in a 24x24 box (top-left x,y, size s); `swing` rotates around the hanger (degrees) */
export const Bell: React.FC<{x: number; y: number; s: number; fill?: string; stroke?: string; sw?: number; swing?: number}> = ({x, y, s, fill = 'none', stroke = '#fff', sw = 1.6, swing = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s / 24})`}>
    <g transform={`rotate(${swing} 12 3)`}>
      <circle cx={12} cy={3.4} r={1.4} fill={stroke} />
      <path d="M12 4.6 C7.6 4.6 6.1 8 6.1 11.4 V14.4 L3.8 17.6 H20.2 L17.9 14.4 V11.4 C17.9 8 16.4 4.6 12 4.6 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M9.7 19.6 Q12 22.2 14.3 19.6" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
    </g>
  </g>
);

/** round avatar with initials, centre (cx, cy), radius r */
export const Avatar: React.FC<{cx: number; cy: number; r: number; name: string; color?: string; ring?: string; ringW?: number; textColor?: string}> = ({cx, cy, r, name, color, ring, ringW = 3, textColor = '#ffffff'}) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={color ?? avatarColor(name)} stroke={ring} strokeWidth={ring ? ringW : 0} />
    <text x={cx} y={cy + r * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={r * 0.95} fill={textColor}>
      {initials(name)}
    </text>
  </g>
);

/** background style: 'transparent' leaves the frame clear so the motion can overlay other content */
export const bgOf = (background: string): string | undefined => (background === 'transparent' ? undefined : background);

/** clamp helper re-export for brevity */
export const c01 = clamp;
