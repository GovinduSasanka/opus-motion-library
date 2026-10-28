/**
 * r2-lb2a-kit — extra helpers for LB2 batch A (time-rings, swirl-portal, atomic-orbit-title, lamp-screen, press-lift,
 * carved-plaque, hide-carve-patterns, intertitle-card, theatre-gate, screenprint-poster).
 * Builds on r2-lb2-kit (read-only). Ideas adapted from lemo-opuscar styles (satellite-briefing, scifi-toon,
 * shadow-puppet, silent-film, silkscreen-poster) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md.
 * Pure functions of the frame and seeds: no Math.random, no timers.
 */
import React from 'react';
import {Pt, blobPts, catmullClosed, fx, h1, lerp, measure, mixHex, pts} from './r2-lb2-kit';

// =============================================================================================== text wrap
/** greedy word wrap using the canvas measure (falls back to a char estimate) */
export const wrapText = (text: string, family: string, size: number, maxW: number, weight: number | string = 400, italic = false): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (cur && measure(t, family, size, weight, italic) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
};

// =============================================================================================== art-deco card border
export type DecoLevel = 'title' | 'narration' | 'shout' | 'tender';
const stepped = (x0: number, y0: number, x1: number, y1: number, n: number) =>
  `M${fx(x0 + n)},${fx(y0)} H${fx(x1 - n)} V${fx(y0 + n)} H${fx(x1)} V${fx(y1 - n)} H${fx(x1 - n)} V${fx(y1)} H${fx(x0 + n)} V${fx(y1 - n)} H${fx(x0)} V${fx(y0 + n)} H${fx(x0 + n)} Z`;

/**
 * Art-Deco intertitle border (after silent-film cards.js): double rule with stepped corners; the ornament follows
 * the emotion. Draws in the local box (x,y,w,h) with stroke unit `s` (px for a 1080 gate).
 */
export const DecoBorder: React.FC<{level: DecoLevel; x: number; y: number; w: number; h: number; s: number; color: string}> = ({level, x, y, w, h, s, color}) => {
  const ins = 0.03 * h;
  const gap = 0.014 * h;
  const n = 0.014 * h;
  const ox0 = x + ins;
  const oy0 = y + ins;
  const ox1 = x + w - ins;
  const oy1 = y + h - ins;
  const ix0 = ox0 + gap;
  const iy0 = oy0 + gap;
  const ix1 = ox1 - gap;
  const iy1 = oy1 - gap;
  const cx = x + w / 2;
  const parts: React.ReactNode[] = [];
  if (level === 'shout') {
    parts.push(<path key="o" d={stepped(ox0, oy0, ox1, oy1, n * 0.6)} fill="none" stroke={color} strokeWidth={7 * s} strokeLinejoin="miter" />);
  } else {
    parts.push(<path key="o" d={stepped(ox0, oy0, ox1, oy1, n)} fill="none" stroke={color} strokeWidth={3.2 * s} />);
    parts.push(<path key="i" d={stepped(ix0, iy0, ix1, iy1, n * 0.7)} fill="none" stroke={color} strokeWidth={1.6 * s} />);
  }
  if (level === 'narration') {
    // rule - diamond - rule, top and bottom
    [iy0 + 0.05 * h, iy1 - 0.05 * h].forEach((yy, k) => {
      const dm = 9 * s;
      parts.push(
        <g key={'orn' + k} stroke={color} fill={color} strokeWidth={1.6 * s}>
          <path d={`M${fx(cx - 150 * s)},${fx(yy)} H${fx(cx - 26 * s)} M${fx(cx + 26 * s)},${fx(yy)} H${fx(cx + 150 * s)}`} fill="none" />
          <path d={`M${fx(cx)},${fx(yy - dm)} L${fx(cx + dm)},${fx(yy)} L${fx(cx)},${fx(yy + dm)} L${fx(cx - dm)},${fx(yy)} Z`} />
          <circle cx={cx - 40 * s} cy={yy} r={2.4 * s} stroke="none" />
          <circle cx={cx + 40 * s} cy={yy} r={2.4 * s} stroke="none" />
        </g>,
      );
    });
    // corner fans: 5 short radiating strokes from each inner corner
    const L = 0.06 * h;
    ([[ix0, iy0, 0], [ix1, iy0, 90], [ix1, iy1, 180], [ix0, iy1, 270]] as [number, number, number][]).forEach(([px, py, rot], k) => {
      parts.push(
        <g key={'fan' + k} transform={`translate(${fx(px)},${fx(py)}) rotate(${rot})`} stroke={color} strokeWidth={1.5 * s} fill="none">
          {[0, 1, 2, 3, 4].map((i) => {
            const a = ((6 + i * 19.5) * Math.PI) / 180;
            return <path key={i} d={`M${fx(Math.cos(a) * L * 0.35)},${fx(Math.sin(a) * L * 0.35)} L${fx(Math.cos(a) * L)},${fx(Math.sin(a) * L)}`} />;
          })}
        </g>,
      );
    });
  }
  if (level === 'tender') {
    // wavy vines with five-petal flowers down both sides
    const y0 = iy0 + 0.16 * h;
    const y1 = iy1 - 0.16 * h;
    [ix0 + 0.035 * w, ix1 - 0.035 * w].forEach((vx, side) => {
      const pp: Pt[] = Array.from({length: 41}, (_, i) => [vx + Math.sin((i / 40) * Math.PI * 5 + side * Math.PI) * 0.01 * w, lerp(y0, y1, i / 40)]);
      parts.push(<path key={'v' + side} d={`M${pts(pp).split(' ').join(' L')}`} fill="none" stroke={color} strokeWidth={1.8 * s} />);
      for (let f = 0; f < 5; f++) {
        const yy = lerp(y0, y1, (f + 0.5) / 5);
        const fxp = vx + Math.sin(((f + 0.5) / 5) * Math.PI * 5 + side * Math.PI) * 0.01 * w;
        parts.push(
          <g key={`f${side}${f}`} transform={`translate(${fx(fxp)},${fx(yy)})`} fill={color}>
            {[0, 1, 2, 3, 4].map((p) => (
              <circle key={p} cx={Math.cos((p / 5) * Math.PI * 2 - Math.PI / 2) * 7 * s} cy={Math.sin((p / 5) * Math.PI * 2 - Math.PI / 2) * 7 * s} r={4.4 * s} />
            ))}
            <circle r={3.2 * s} fill="#141210" />
          </g>,
        );
      }
    });
  }
  return <g>{parts}</g>;
};

// =============================================================================================== procedural dated plates
/**
 * A top-down "terrain" plate for time-rings when no photograph is supplied: warm broken ground with a pale
 * subject field (ice / lake / city block) whose size follows `k/n`. Returns the subject outline too.
 */
export const plateSubject = (w: number, h: number, k: number, n: number, seed: number, shrink = 0.5) => {
  const f = lerp(1, shrink, n > 1 ? k / (n - 1) : 0);
  const base = Math.min(w, h);
  const cx = w * 0.42 + (h1(seed, 1) - 0.5) * 0.02 * w;
  const cy = h * 0.5;
  const rx = base * (w > h ? 0.21 : 0.28) * f;
  const ry = base * (w > h ? 0.26 : 0.25) * f;
  const p = blobPts(cx, cy, rx, ry, 18, seed, 0.2, 0);
  return {pts: p, d: catmullClosed(p)};
};

export const TerrainPlate: React.FC<{w: number; h: number; u: number; k: number; n: number; seed: number; id: string; tint: string; subjectTint: string}> = ({w, h, u, k, n, seed, id, tint, subjectTint}) => {
  const sub = plateSubject(w, h, k, n, seed);
  const shade = mixHex(tint, '#000000', 0.1 * ((k * 7) % 3));
  return (
    <g>
      <defs>
        <filter id={`${id}t`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.006 / u} ${0.009 / u}`} numOctaves={5} seed={seed + 3 + (k % 2)} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 1.5 -0.55" />
        </filter>
        <filter id={`${id}f`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.045 / u}`} numOctaves={2} seed={seed + 11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.9  0 0 0 0 0.85  0 0 0 1.2 -0.5" />
        </filter>
        <clipPath id={`${id}s`}>
          <path d={sub.d} />
        </clipPath>
      </defs>
      <rect x={-w} y={-h} width={3 * w} height={3 * h} fill={shade} />
      <rect x={-w} y={-h} width={3 * w} height={3 * h} filter={`url(#${id}t)`} opacity={0.85} />
      {/* river-like dark veins */}
      <path d={`M${fx(w * 0.05)},${fx(h * 0.9)} C${fx(w * 0.25)},${fx(h * 0.7)} ${fx(w * 0.2)},${fx(h * 0.4)} ${fx(w * 0.38)},${fx(h * 0.3)} S${fx(w * 0.7)},${fx(h * 0.25)} ${fx(w * 0.98)},${fx(h * 0.1)}`} fill="none" stroke={mixHex(tint, '#101820', 0.6)} strokeWidth={5 * u} opacity={0.55} />
      <path d={sub.d} fill={subjectTint} />
      <g clipPath={`url(#${id}s)`}>
        <rect width={w} height={h} filter={`url(#${id}f)`} opacity={0.55} />
      </g>
      <path d={sub.d} fill="none" stroke={mixHex(subjectTint, '#ffffff', 0.4)} strokeWidth={3 * u} opacity={0.6} />
    </g>
  );
};

// =============================================================================================== small shapes
/** four-point twinkle star centred on (0,0) with radius r */
export const star4 = (r: number) => {
  const k = r * 0.22;
  return `M0,${fx(-r)} L${fx(k)},${fx(-k)} L${fx(r)},0 L${fx(k)},${fx(k)} L0,${fx(r)} L${fx(-k)},${fx(k)} L${fx(-r)},0 L${fx(-k)},${fx(-k)} Z`;
};
