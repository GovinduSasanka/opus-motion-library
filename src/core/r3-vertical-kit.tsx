import React from 'react';

/** small helpers shared by the round-3 business-vertical motions (fitness, finance, property, booking, weather) */

const parse = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};

/** blend colour a toward colour b by t (0..1); falls back to `a` when a colour is not a plain hex */
export const mixHex = (a: string, b: string, t: number) => {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return a;
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/** true for 'transparent' / empty backgrounds */
export const isClear = (bg: string) => !bg || bg === 'transparent' || bg === 'none';

/** days in a month (month 1-12) */
export const daysInMonth = (year: number, month: number) => {
  const m = ((Math.round(month) - 1) % 12 + 12) % 12;
  if (m === 1) return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  return [3, 5, 8, 10].includes(m) ? 30 : 31;
};

/** weekday of the 1st of a month, 0 = Sunday (Sakamoto) */
export const firstWeekday = (year: number, month: number) => {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const m = ((Math.round(month) - 1) % 12 + 12) % 12;
  const y = m < 2 ? year - 1 : year;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m] + 1) % 7;
};

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** flame glyph centred on (0,0), about 2 units tall; scale with the transform */
export const FLAME = 'M0,-1 C0.45,-0.45 0.85,-0.05 0.72,0.5 C0.6,0.95 -0.6,0.95 -0.72,0.5 C-0.85,-0.05 -0.3,-0.3 0,-1Z';

export const Check: React.FC<{x: number; y: number; s: number; color: string; width?: number; t?: number}> = ({x, y, s, color, width, t = 1}) => {
  const len = 3.2;
  return (
    <path
      d={`M${x - s * 0.5},${y} L${x - s * 0.12},${y + s * 0.4} L${x + s * 0.55},${y - s * 0.42}`}
      fill="none"
      stroke={color}
      strokeWidth={width ?? s * 0.22}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={len}
      strokeDasharray={len}
      strokeDashoffset={len * (1 - t)}
    />
  );
};
