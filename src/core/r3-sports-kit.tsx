import React from 'react';
import {estWidth} from './text-kit';
import {hexRgb, mixHex, withAlpha} from './r2-s1-kit';

export {
  Crest,
  Silhouette,
  avatarColor,
  backOut,
  bgCss,
  bodyFont,
  easeIO,
  easeOut3,
  fmtInt,
  headFont,
  initials,
  mixHex,
  mmss,
  pad2,
  sseg,
  withAlpha,
} from './r3-game-kit';

/** Shared helpers for the sports motions (pitch / court drawing, layout, small formatters). Original drawings only. */

export type Sport = 'football' | 'basketball' | 'plain';

type SportSpec = {L: number; W: number; field: string; label: string};
/** playing-area size in metres (x = length, y = width) and the default surface colour */
export const SPORTS: Record<Sport, SportSpec> = {
  football: {L: 105, W: 68, field: '#2B8A4E', label: 'pitch'},
  basketball: {L: 28, W: 15, field: '#C48A4E', label: 'court'},
  plain: {L: 100, W: 62, field: '#2A3550', label: 'field'},
};
export const asSport = (s: string): Sport => (s === 'basketball' || s === 'plain' ? s : 'football');

/** readable ink (near-black or white) for text on a coloured chip */
export const onColor = (hex: string, dark = '#0B1020', light = '#FFFFFF') => {
  const [r, g, b] = hexRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? dark : light;
};

/** font size (<= size) that keeps `text` inside maxW */
export const fitFont = (text: string, size: number, maxW: number, font: 'sans' | 'display' = 'display', tracking = 0) => {
  const wd = estWidth(text || ' ', size, font, tracking);
  return wd > maxW ? (size * maxW) / wd : size;
};

export const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const num = (v: unknown, d = 0) => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && isFinite(Number(v)) ? Number(v) : d);

/** 83.456 -> "1:23.46" (or "23.46" under a minute) */
export const fmtTime = (sec: number, decimals = 2, forceMin = false) => {
  const s = Math.max(0, sec);
  const f = Math.pow(10, decimals);
  const total = Math.floor(s * f + 1e-6) / f;
  const m = Math.floor(total / 60);
  const rest = total - m * 60;
  const r = rest.toFixed(decimals).padStart(decimals + 3, '0');
  return m > 0 || forceMin ? `${m}:${r}` : rest.toFixed(decimals);
};

/** colour on a multi-stop ramp, t in 0..1 */
export const rampColor = (stops: string[], t: number) => {
  const st = stops.length ? stops : ['#000000', '#ffffff'];
  if (st.length === 1) return st[0];
  const x = clampN(t, 0, 1) * (st.length - 1);
  const i = Math.min(st.length - 2, Math.floor(x));
  return mixHex(st[i], st[i + 1], x - i);
};

/* ------------------------------------------------------------------ pitch / court */

export type FieldLayout = {
  sport: Sport;
  vertical: boolean;
  /** pixels per metre */
  s: number;
  /** pixel box of the drawn window (incl. margin) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** metres */
  L: number;
  W: number;
  margin: number;
  xa: number;
  xb: number;
  crop: [number, number];
  /** normalised (0..1 along the crop window, 0..1 across the width) -> pixels. Attack is right (landscape) or up (portrait). */
  pt: (nx: number, ny: number) => {x: number; y: number};
  /** pixels -> normalised coordinates (inverse of pt) */
  inv: (px: number, py: number) => {nx: number; ny: number};
  /** SVG matrix that maps field metres to pixels */
  matrix: string;
};

/** Fit a pitch / court into a pixel box (centred), optionally rotated to vertical and cropped to part of its length. */
export const fieldLayout = (sport: Sport, box: {x: number; y: number; w: number; h: number}, vertical: boolean, crop: [number, number] = [0, 1]): FieldLayout => {
  const {L, W} = SPORTS[sport];
  const margin = sport === 'football' ? 3 : sport === 'basketball' ? 1.1 : 2;
  const a = clampN(crop[0], 0, 0.9);
  const b = clampN(crop[1], a + 0.1, 1);
  const xa = a * L - margin;
  const xb = b * L + margin;
  const lenM = xb - xa;
  const widM = W + 2 * margin;
  const winW = vertical ? widM : lenM;
  const winH = vertical ? lenM : widM;
  const s = Math.min(box.w / winW, box.h / winH);
  const pw = winW * s;
  const ph = winH * s;
  const ox = box.x + (box.w - pw) / 2;
  const oy = box.y + (box.h - ph) / 2;
  const pt = (nx: number, ny: number) => {
    const lx = (a + nx * (b - a)) * L;
    const ly = ny * W;
    return vertical ? {x: ox + (ly + margin) * s, y: oy + (xb - lx) * s} : {x: ox + (lx - xa) * s, y: oy + (ly + margin) * s};
  };
  const inv = (px: number, py: number) => {
    const lx = vertical ? xb - (py - oy) / s : xa + (px - ox) / s;
    const ly = vertical ? (px - ox) / s - margin : (py - oy) / s - margin;
    return {nx: (lx / L - a) / (b - a), ny: ly / W};
  };
  const matrix = vertical ? `matrix(0,${-s},${s},0,${ox + s * margin},${oy + s * xb})` : `matrix(${s},0,0,${s},${ox - s * xa},${oy + s * margin})`;
  return {sport, vertical, s, x: ox, y: oy, w: pw, h: ph, L, W, margin, xa, xb, crop: [a, b], pt, inv, matrix};
};

const rectD = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
const circD = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`;

/** line paths of the playing surface, in metres */
const markings = (sport: Sport): {d: string; dash?: boolean}[] => {
  const {L, W} = SPORTS[sport];
  const out: {d: string; dash?: boolean}[] = [{d: rectD(0, 0, L, W)}, {d: `M${L / 2} 0V${W}`}];
  if (sport === 'football') {
    const cy = W / 2;
    out.push({d: circD(L / 2, cy, 9.15)});
    out.push({d: circD(L / 2, cy, 0.4)});
    for (const side of [0, 1]) {
      const sx = side ? L : 0;
      const dir = side ? -1 : 1;
      const x16 = sx + dir * 16.5;
      const x6 = sx + dir * 5.5;
      out.push({d: `M${sx} ${cy - 20.16}H${x16}V${cy + 20.16}H${sx}`});
      out.push({d: `M${sx} ${cy - 9.16}H${x6}V${cy + 9.16}H${sx}`});
      out.push({d: circD(sx + dir * 11, cy, 0.35)});
      out.push({d: `M${x16} ${cy - 7.31}A9.15 9.15 0 0 ${side ? 0 : 1} ${x16} ${cy + 7.31}`});
      // goal frame behind the line
      out.push({d: `M${sx} ${cy - 3.66}H${sx - dir * 2}V${cy + 3.66}H${sx}`});
      // corner arcs
      const cxm = sx + dir * 1;
      out.push({d: `M${cxm} 0A1 1 0 0 ${side ? 1 : 0} ${sx} 1`});
      out.push({d: `M${cxm} ${W}A1 1 0 0 ${side ? 0 : 1} ${sx} ${W - 1}`});
    }
  } else if (sport === 'basketball') {
    const cy = W / 2;
    out.push({d: circD(L / 2, cy, 1.8)});
    for (const side of [0, 1]) {
      const sx = side ? L : 0;
      const dir = side ? -1 : 1;
      const k = (n: number) => sx + dir * n;
      out.push({d: `M${sx} ${cy - 2.45}H${k(5.8)}V${cy + 2.45}H${sx}`});
      out.push({d: `M${k(5.8)} ${cy - 1.8}A1.8 1.8 0 0 ${side ? 0 : 1} ${k(5.8)} ${cy + 1.8}`});
      out.push({d: `M${k(5.8)} ${cy - 1.8}A1.8 1.8 0 0 ${side ? 1 : 0} ${k(5.8)} ${cy + 1.8}`, dash: true});
      out.push({d: `M${sx} 0.9H${k(2.99)}A6.75 6.75 0 0 ${side ? 0 : 1} ${k(2.99)} ${W - 0.9}H${sx}`});
      out.push({d: circD(k(1.575), cy, 0.23)});
      out.push({d: `M${k(1.2)} ${cy - 0.9}V${cy + 0.9}`});
    }
  } else {
    out.push({d: circD(L / 2, W / 2, 7)});
  }
  return out;
};

/** Pitch / court drawing. `draw` 0..1 draws the lines on; `surface` is the playing-surface colour. */
export const FieldArt: React.FC<{layout: FieldLayout; surface: string; line: string; draw?: number; id: string; lineWidthPx?: number; surfaceOpacity?: number}> = ({layout, surface, line, draw = 1, id, lineWidthPx = 3, surfaceOpacity = 1}) => {
  const {L, W, margin, xa, xb, sport, s} = layout;
  const lw = lineWidthPx / s;
  const bands = sport === 'football' ? 14 : 0;
  const clipId = `${id}-clip`;
  const full = draw >= 0.999;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={xa} y={-margin} width={xb - xa} height={W + 2 * margin} />
        </clipPath>
      </defs>
      <g transform={layout.matrix} clipPath={`url(#${clipId})`}>
        <rect x={xa - 2} y={-margin - 2} width={xb - xa + 4} height={W + 2 * margin + 4} fill={mixHex(surface, '#000000', 0.18)} opacity={surfaceOpacity} />
        <rect x={0} y={0} width={L} height={W} fill={surface} opacity={surfaceOpacity} />
        {bands > 0 &&
          Array.from({length: bands}).map((_, i) =>
            i % 2 === 0 ? <rect key={i} x={(i * L) / bands} y={0} width={L / bands} height={W} fill={mixHex(surface, '#ffffff', 0.07)} opacity={surfaceOpacity} /> : null,
          )}
        {sport === 'basketball' &&
          [0, 1].map((side) => {
            const sx = side ? L - 5.8 : 0;
            return <rect key={side} x={sx} y={W / 2 - 2.45} width={5.8} height={4.9} fill={mixHex(surface, '#000000', 0.16)} opacity={surfaceOpacity} />;
          })}
        <g fill="none" stroke={line} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round">
          {markings(sport).map((m, i) => (
            <path key={i} d={m.d} pathLength={1} strokeDasharray={full ? (m.dash ? `${0.012} ${0.012}` : undefined) : '1 1'} strokeDashoffset={full ? undefined : 1 - draw} opacity={m.dash ? 0.7 : 1} />
          ))}
        </g>
      </g>
    </g>
  );
};

/** soft shadow + rounded frame around the field window (pixel space) */
export const fieldFrame = (layout: FieldLayout, color: string, rx: number) => (
  <rect x={layout.x} y={layout.y} width={layout.w} height={layout.h} rx={rx} fill="none" stroke={withAlpha(color, 0.4)} strokeWidth={2} />
);

/** neutral sample names for default rosters (no real people) */
export const SAMPLE_NAMES = ['Alder', 'Brook', 'Calder', 'Dunmore', 'Everly', 'Fenwick', 'Garrow', 'Hale', 'Ingram', 'Jarrow', 'Kestrel', 'Lowry', 'Marlow', 'Norley', 'Oakes', 'Penrose'];
