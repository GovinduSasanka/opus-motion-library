import React from 'react';
import {hexRgb} from './r2-s1-kit';

/** Shared helpers for the round-3 explainer / education motions (text wrapping, fit-to-box, tiny icon set). */

/** greedy word wrap by character budget */
export const wrapText = (text: string, maxChars: number): string[] => {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
};

/** biggest font size (<= maxFs, >= minFs) at which `text` wraps to fit a box; `em` = average glyph width in em */
export const fitText = (text: string, boxW: number, boxH: number, maxFs: number, minFs: number, em = 0.56, lh = 1.22) => {
  let fs = Math.max(minFs, maxFs);
  let lines = wrapText(text, Math.max(1, Math.floor(boxW / (fs * em))));
  while (fs > minFs) {
    lines = wrapText(text, Math.max(1, Math.floor(boxW / (fs * em))));
    if (lines.length * fs * lh <= boxH && lines.every((l) => l.length * fs * em <= boxW * 1.02)) break;
    fs -= 1;
  }
  lines = wrapText(text, Math.max(1, Math.floor(boxW / (fs * em))));
  return {fs, lines, lh};
};

/** true when a hex colour is dark (so light ink should sit on it) */
export const isDarkHex = (hex: string) => {
  if (!hex || !/^#?[0-9a-fA-F]{3,6}$/.test(hex.trim())) return false;
  const [r, g, b] = hexRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};

/** readable text colour on a fill */
export const inkOn = (fill: string, light = '#FFFFFF', dark = '#14161C') => (isDarkHex(fill) ? light : dark);

const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** 24x24 stroke icons (single multi-subpath string each) */
export const ICONS: Record<string, string> = {
  check: 'M4 12.5l5 5L20 6.5',
  cross: 'M5 5l14 14M19 5L5 19',
  bulb: `${circ(12, 10, 5.5)}M9.5 17.5h5M10.5 20.5h3M12 15.5v2`,
  gear: `${circ(12, 12, 3.2)}M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1`,
  target: `${circ(12, 12, 9)}${circ(12, 12, 5)}${circ(12, 12, 1)}`,
  chart: 'M4 4v16h16M8 16v-4M12 16V8M16 16v-6',
  user: `${circ(12, 8, 4)}M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7`,
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  bolt: 'M13 2L5 14h6l-1 8 8-12h-6z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
  search: `${circ(10, 10, 6)}M15 15l6 6`,
  clock: `${circ(12, 12, 9)}M12 7v5l3 2`,
  heart: 'M12 20s-8-5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20 12 20z',
  globe: `${circ(12, 12, 9)}M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18`,
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v13c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v13',
  rocket: 'M12 3c3 2 5 5 5 9l-2 3H9l-2-3c0-4 2-7 5-9zM9 15l-3 4M15 15l3 4M12 10.5h.01',
  speaker: 'M4 9.5h4l5-4v13l-5-4H4zM16.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11',
};

export const Icon: React.FC<{name: string; x: number; y: number; size: number; color: string; sw?: number; progress?: number}> = ({name, x, y, size, color, sw = 2, progress = 1}) => (
  <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`} opacity={progress <= 0 ? 0 : 1}>
    <path d={ICONS[name] ?? ICONS.star} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, Math.max(0, progress))} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
