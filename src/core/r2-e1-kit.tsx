import React from 'react';
import {resolveSrc} from './asset';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';
import {mixHex} from './hud-kit';

/**
 * Shared helpers for the round-2 "EXTENDS" group E1 (callout-labels dimension / magnifier variants,
 * stamp seals, ...). Pure functions of the frame; no timers, no randomness.
 */

/* ------------------------------------------------------------------ callout-labels: shared scene */

/** a flat product drawing (appliance body, dial, vents, button row) in frame-fraction coordinates */
export const ProductDrawing: React.FC<{w: number; h: number; u: number; ink: string; paper: string; accent: string}> = ({w, h, u, ink, paper, accent}) => {
  const bw = Math.min(w * 0.78, h * 0.62 * (w > h ? 1.5 : 1.15));
  const bh = bw * 0.62;
  const x0 = w / 2 - bw / 2;
  const y0 = h * 0.5 - bh / 2;
  const sw = 3 * u;
  return (
    <g>
      <rect x={x0} y={y0} width={bw} height={bh} rx={bh * 0.12} fill={mixHex(paper, '#ffffff', 0.45)} stroke={ink} strokeWidth={sw} />
      <rect x={x0 + bw * 0.06} y={y0 + bh * 0.1} width={bw * 0.88} height={bh * 0.12} rx={bh * 0.04} fill="none" stroke={ink} strokeWidth={sw * 0.6} />
      {/* dial */}
      <circle cx={w / 2} cy={h * 0.5} r={bh * 0.2} fill={paper} stroke={ink} strokeWidth={sw} />
      {Array.from({length: 24}, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r0 = bh * (i % 6 === 0 ? 0.24 : 0.225);
        return <line key={i} x1={w / 2 + Math.cos(a) * bh * 0.2} y1={h * 0.5 + Math.sin(a) * bh * 0.2} x2={w / 2 + Math.cos(a) * r0} y2={h * 0.5 + Math.sin(a) * r0} stroke={ink} strokeWidth={sw * (i % 6 === 0 ? 0.9 : 0.5)} />;
      })}
      <path d={`M${w / 2} ${h * 0.5} L${w / 2 + bh * 0.14} ${h * 0.5 - bh * 0.1}`} stroke={accent} strokeWidth={sw * 1.4} strokeLinecap="round" />
      <circle cx={w / 2} cy={h * 0.5} r={bh * 0.03} fill={ink} />
      {/* vents */}
      {Array.from({length: 6}, (_, i) => (
        <line key={i} x1={x0 + bw * 0.08} x2={x0 + bw * 0.28} y1={y0 + bh * (0.36 + i * 0.075)} y2={y0 + bh * (0.36 + i * 0.075)} stroke={ink} strokeWidth={sw * 0.6} strokeLinecap="round" />
      ))}
      {/* buttons */}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x0 + bw * (0.72 + i * 0.08)} cy={y0 + bh * 0.8} r={bh * 0.035} fill={i === 1 ? accent : paper} stroke={ink} strokeWidth={sw * 0.7} />
      ))}
      <circle cx={x0 + bw * 0.84} cy={y0 + bh * 0.5} r={bh * 0.02} fill={accent} />
    </g>
  );
};

export type MagItem = {x: number; y: number; label: string; sublabel?: string; ex?: number; ey?: number; r?: number; zoom?: number; color?: string; src?: string};

/**
 * Manual-style magnifier: paper ring + broken ink rim, flat disc holding a zoomed copy of the scene (or `src`),
 * dashed marching leader to a dot on the subject, paper tag with star bullet under the circle.
 */
export const MagnifierSet: React.FC<{
  items: MagItem[];
  frame: number;
  stagger: number;
  w: number;
  h: number;
  u: number;
  ink: string;
  paper: string;
  accent: string;
  out: number;
  scene: React.ReactNode;
  src?: string;
}> = ({items, frame, stagger, w, h, u, ink, paper, accent, out, scene, src}) => {
  return (
    <g>
      {items.map((it, i) => {
        const st = 12 + i * stagger;
        const f = frame - st;
        if (f < 0) return null;
        const tx = it.x * w;
        const ty = it.y * h;
        const portrait = h > w;
        const r = (it.r ?? (portrait ? 150 : 175)) * u;
        const side = i % 2 ? 1 : -1;
        const cx = it.ex !== undefined ? tx + it.ex * u : tx + side * (r * 1.45 + 60 * u);
        const cy = it.ey !== undefined ? ty + it.ey * u : ty + (portrait ? (i % 2 ? 1 : -1) * r * 1.9 : (i % 2 ? 0.55 : -0.9) * r * 1.2);
        const pop = ease.back(clamp(f / 9.6));
        const rr = r * pop;
        const dotP = clamp(f / 4);
        const leader = prog(frame, st + 6, st + 16, ease.out) * (1 - out);
        const k = it.zoom ?? 2.6;
        const col = it.color ?? mixHex(accent, paper, 0.35);
        const dx = cx - tx;
        const dy = cy - ty;
        const dist = Math.hypot(dx, dy) || 1;
        const lx0 = cx - (dx / dist) * (rr + 16 * u);
        const ly0 = cy - (dy / dist) * (rr + 16 * u);
        const mid = `mag-clip-${i}`;
        const tagP = prog(frame, st + 12, st + 18, ease.back);
        const fs = 30 * u;
        const tagW = Math.max(180 * u, it.label.length * fs * 0.58 + 70 * u);
        return (
          <g key={i} opacity={1 - out}>
            <line x1={lx0} y1={ly0} x2={lerp(lx0, tx, leader)} y2={lerp(ly0, ty, leader)} stroke={ink} strokeWidth={3 * u} strokeDasharray={`${14 * u} ${10 * u}`} strokeDashoffset={-(frame * 40 * u) / 30} strokeLinecap="round" />
            <circle cx={tx} cy={ty} r={9 * u * dotP} fill={accent} stroke={ink} strokeWidth={2.5 * u} />
            <circle cx={tx} cy={ty} r={20 * u * dotP} fill="none" stroke={accent} strokeWidth={2 * u} opacity={0.6 * (1 - clamp((f - 4) / 12))} />
            <defs>
              <clipPath id={mid}>
                <circle cx={cx} cy={cy} r={Math.max(0.1, rr)} />
              </clipPath>
            </defs>
            <circle cx={cx} cy={cy} r={rr + 16 * u} fill={paper} />
            <circle cx={cx} cy={cy} r={rr + 8 * u} fill="none" stroke={ink} strokeWidth={4.5 * u} strokeDasharray={`${rr * 1.2} ${rr * 0.18} ${rr * 0.6} ${rr * 0.12}`} strokeLinecap="round" />
            <g clipPath={`url(#${mid})`}>
              <rect x={cx - rr} y={cy - rr} width={rr * 2} height={rr * 2} fill={col} />
              <g transform={`translate(${cx},${cy}) scale(${k}) translate(${-tx},${-ty})`}>
                {it.src || src ? <image href={resolveSrc(it.src || src || '')} x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" /> : scene}
              </g>
            </g>
            {tagP > 0 && (
              <g transform={`translate(${cx},${cy + rr + 46 * u}) scale(${tagP})`}>
                <rect x={-tagW / 2} y={-fs * 0.9} width={tagW} height={fs * (it.sublabel ? 2.5 : 1.8)} rx={8 * u} fill={paper} stroke={ink} strokeWidth={2.5 * u} />
                <text x={0} y={fs * 0.12} textAnchor="middle" fill={ink} fontFamily={fonts.sans} fontWeight={700} fontSize={fs}>
                  {'★ ' + it.label}
                </text>
                {it.sublabel && (
                  <text x={0} y={fs * 1.2} textAnchor="middle" fill={ink} fillOpacity={0.6} fontFamily={fonts.mono} fontSize={fs * 0.55} letterSpacing={fs * 0.1}>
                    {it.sublabel}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ callout-labels: dimension lines */

export type Measure = {p1: [number, number]; p2: [number, number]; p2To?: [number, number]; offset?: number; label?: string};

/** engineering dimension: extension lines, double arrowheads, rotated label written on after 60 % of the draw */
export const DimensionLine: React.FC<{
  a: [number, number];
  b: [number, number];
  offset: number;
  label: string;
  t: number;
  u: number;
  ink: string;
  accent: string;
}> = ({a, b, offset, label, t, u, ink, accent}) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * Math.sign(offset || 1);
  const ny = ux * Math.sign(offset || 1);
  const o = Math.abs(offset);
  const gap = 8 * u;
  const over = 14 * u;
  const A: [number, number] = [a[0] + nx * o, a[1] + ny * o];
  const B: [number, number] = [b[0] + nx * o, b[1] + ny * o];
  const ext = prog(t, 0, 0.35);
  const run = prog(t, 0.25, 0.7);
  const txt = prog(t, 0.6, 1);
  const as = 16 * u;
  const aw = 4.5 * u;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const flip = ang > 90 || ang < -90;
  const mx = (A[0] + B[0]) / 2;
  const my = (A[1] + B[1]) / 2;
  const sw = 2 * u;
  const arrow = (p: [number, number], dir: 1 | -1) => {
    const bx = p[0] - ux * as * dir;
    const by = p[1] - uy * as * dir;
    return `M${p[0]} ${p[1]} L${bx + nx * aw} ${by + ny * aw} L${bx - nx * aw} ${by - ny * aw} Z`;
  };
  // the dimension line grows from the centre outwards
  const hx = (B[0] - A[0]) / 2;
  const hy = (B[1] - A[1]) / 2;
  const fs = 30 * u;
  return (
    <g>
      <line x1={a[0] + nx * gap} y1={a[1] + ny * gap} x2={lerp(a[0] + nx * gap, A[0] + nx * over, ext)} y2={lerp(a[1] + ny * gap, A[1] + ny * over, ext)} stroke={ink} strokeWidth={sw * 0.7} />
      <line x1={b[0] + nx * gap} y1={b[1] + ny * gap} x2={lerp(b[0] + nx * gap, B[0] + nx * over, ext)} y2={lerp(b[1] + ny * gap, B[1] + ny * over, ext)} stroke={ink} strokeWidth={sw * 0.7} />
      {run > 0 && (
        <g>
          <line x1={mx - hx * run} y1={my - hy * run} x2={mx + hx * run} y2={my + hy * run} stroke={ink} strokeWidth={sw} />
          {run > 0.85 && <path d={arrow(A, 1)} fill={ink} />}
          {run > 0.85 && <path d={arrow(B, -1)} fill={ink} />}
        </g>
      )}
      {txt > 0 && (
        <g transform={`translate(${mx + nx * 22 * u},${my + ny * 22 * u}) rotate(${flip ? ang + 180 : ang})`} opacity={txt}>
          <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fill={accent} fontFamily={fonts.mono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.04}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ emote-pop: extra icon set */

export const EXTRA_EMOTES = ['ticks', 'anger', 'steam', 'zzz', 'dots', 'stars', 'spark', 'cloud'];

const sparkPath = (r: number) => `M0 ${-r} Q${r * 0.12} ${-r * 0.12} ${r} 0 Q${r * 0.12} ${r * 0.12} 0 ${r} Q${-r * 0.12} ${r * 0.12} ${-r} 0 Q${-r * 0.12} ${-r * 0.12} 0 ${-r} Z`;
const hash = (id: string, k: number) => {
  let x = k * 374761393;
  for (let i = 0; i < id.length; i++) x = (x ^ id.charCodeAt(i)) * 668265263;
  x = (x ^ (x >>> 13)) * 1274126177;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
};

/** returns null when `ic` isn't one of EXTRA_EMOTES; drawn around the origin, S = icon scale */
export const ExtraEmote: React.FC<{ic: string; S: number; lf: number; dur: number; u: number; ink: string; red: string; bulb: string; sweat: string; heart: string; id: string}> = ({ic, S, lf, dur, u, ink, red, bulb, sweat, heart, id}) => {
  const sw = 3.2 * u * (S / (190 * u));
  const pop = ease.back(clamp(lf / 5));
  const fade = 1 - clamp((lf - (dur - 6)) / 6);
  const g = (n: React.ReactNode) => (
    <g opacity={fade} transform={`scale(${Math.max(0.01, pop)})`}>
      {n}
    </g>
  );
  switch (ic) {
    case 'ticks': {
      // 3-5 short curved strokes in a ~60 deg fan, redrawn at a new angle every 2 frames (manga emanata)
      const k = Math.floor(lf / 2);
      const on = lf % 6 < 4;
      if (!on) return null;
      const n = 3 + Math.floor(hash(id, k) * 3);
      return g(
        <g>
          {Array.from({length: n}, (_, i) => {
            const a = ((-90 - 30 + (60 * (i + 0.5)) / n + (hash(id, k * 7 + i) - 0.5) * 14) * Math.PI) / 180;
            const r0 = S * (0.38 + hash(id, k + i * 3) * 0.05);
            const r1 = r0 + S * (0.2 + hash(id, k * 3 + i) * 0.06);
            const am = a + 0.12;
            return <path key={i} d={`M${Math.cos(a) * r0} ${Math.sin(a) * r0} Q${Math.cos(am) * (r0 + r1) * 0.5} ${Math.sin(am) * (r0 + r1) * 0.5} ${Math.cos(a) * r1} ${Math.sin(a) * r1}`} fill="none" stroke={ink} strokeWidth={sw * 1.2} strokeLinecap="round" />;
          })}
        </g>,
      );
    }
    case 'anger': {
      const r = S * 0.3;
      const arc = (sx: number, sy: number, k: number) => <path key={k} d={`M${sx * r * 0.25} ${sy * r * 1.0} Q${sx * r * 1.0} ${sy * r * 0.95} ${sx * r * 1.0} ${sy * r * 0.25}`} fill="none" stroke={red} strokeWidth={sw * 2} strokeLinecap="round" />;
      const jig = Math.sin(lf * 1.7) * 0.03 * S;
      return g(
        <g transform={`translate(${jig} ${-0.15 * S}) rotate(${Math.sin(lf * 1.3) * 2})`}>
          {[arc(1, 1, 0), arc(-1, 1, 1), arc(1, -1, 2), arc(-1, -1, 3)]}
        </g>,
      );
    }
    case 'steam': {
      const cyc = 21;
      return (
        <g opacity={fade}>
          {[0, 1, 2].map((i) => {
            const t = ((lf + i * 7) % cyc) / cyc;
            const x = (i - 1) * 0.22 * S + Math.sin((t + i) * 6) * 0.04 * S;
            return <circle key={i} cx={x} cy={-0.1 * S - t * 0.5 * S} r={S * (0.07 + t * 0.12)} fill="#ECEAE6" stroke={ink} strokeWidth={sw * 0.6} opacity={1 - t * 0.85} />;
          })}
        </g>
      );
    }
    case 'zzz': {
      const cyc = 75;
      return (
        <g opacity={fade}>
          {[0, 1, 2].map((i) => {
            const t = (((lf - i * 22) % cyc) + cyc) % cyc / cyc;
            if (lf - i * 22 < 0) return null;
            const s2 = S * (0.16 + t * 0.14);
            return (
              <text key={i} x={t * 0.3 * S + i * 0.04 * S} y={-t * 0.65 * S} fontFamily="Inter, sans-serif" fontWeight={800} fontSize={s2} fill={sweat} stroke={ink} strokeWidth={sw * 0.4} opacity={Math.sin(t * Math.PI)} transform={`rotate(${-12 + t * 20})`}>
                Z
              </text>
            );
          })}
        </g>
      );
    }
    case 'dots': {
      return g(
        <g transform={`translate(0 ${-0.1 * S})`}>
          <rect x={-0.36 * S} y={-0.14 * S} width={0.72 * S} height={0.28 * S} rx={0.14 * S} fill="#fff" stroke={ink} strokeWidth={sw} />
          {[-1, 0, 1].map((i) => {
            const t = (((lf - (i + 1) * 7) % 54) + 54) % 54;
            const bounce = t < 14 ? Math.sin((t / 14) * Math.PI) * 0.06 * S : 0;
            return <circle key={i} cx={i * 0.18 * S} cy={-bounce} r={0.045 * S} fill={ink} />;
          })}
        </g>,
      );
    }
    case 'stars': {
      return (
        <g opacity={fade} transform={`translate(0 ${0.05 * S}) scale(${Math.max(0.01, pop)})`}>
          {[0, 1, 2].map((i) => {
            const a = (lf / 30) * 5 + (i / 3) * Math.PI * 2;
            const x = Math.cos(a) * 0.42 * S;
            const y = Math.sin(a) * 0.1 * S;
            return <path key={i} d={sparkPath(0.09 * S * (1 + 0.2 * Math.sin(a * 2)))} transform={`translate(${x} ${y})`} fill={bulb} stroke={ink} strokeWidth={sw * 0.6} opacity={0.6 + 0.4 * Math.sin(a + 1.5) } />;
          })}
        </g>
      );
    }
    case 'spark': {
      return g(
        <g>
          <path d={sparkPath(0.34 * S)} fill={bulb} stroke={ink} strokeWidth={sw} strokeLinejoin="round" transform={`rotate(${lf * 3})`} />
          <path d={sparkPath(0.14 * S)} fill="#fff" transform={`translate(${0.3 * S} ${-0.25 * S}) rotate(${-lf * 4})`} stroke={ink} strokeWidth={sw * 0.6} />
        </g>,
      );
    }
    case 'cloud': {
      return g(
        <g transform={`translate(0 ${-0.15 * S})`}>
          <path d={`M${-0.3 * S} 0 a${0.12 * S} ${0.12 * S} 0 0 1 ${0.05 * S} ${-0.2 * S} a${0.17 * S} ${0.17 * S} 0 0 1 ${0.3 * S} ${-0.06 * S} a${0.13 * S} ${0.13 * S} 0 0 1 ${0.25 * S} ${0.26 * S} Z`} fill="#8E98A8" stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          {[0, 1, 2, 3].map((i) => {
            const t = (((lf + i * 5) % 16) / 16);
            return <line key={i} x1={(-0.18 + i * 0.12) * S} x2={(-0.2 + i * 0.12) * S} y1={0.06 * S + t * 0.3 * S} y2={0.14 * S + t * 0.3 * S} stroke={sweat} strokeWidth={sw} strokeLinecap="round" opacity={1 - t} />;
          })}
        </g>,
      );
    }
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ beat-montage: graphic match cuts */

export const MATCH_SHAPES = ['wheel', 'roulette', 'pupil', 'moon', 'keyhole', 'target'] as const;

/** a circle that keeps the SAME centre + radius from shot to shot, redrawn as a different object */
export const MatchShape: React.FC<{kind: string; w: number; h: number; u: number; bg: string; fg: string; accent: string; t: number}> = ({kind, w, h, u, bg, fg, accent, t}) => {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.3;
  const spin = t * 40;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <rect width={w} height={h} fill={bg} />
      <g>
        {kind === 'wheel' && (
          <g transform={`rotate(${spin} ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={fg} strokeWidth={R * 0.1} />
            {Array.from({length: 8}, (_, i) => (
              <line key={i} x1={cx} y1={cy} x2={cx + Math.cos((i / 8) * Math.PI * 2) * R} y2={cy + Math.sin((i / 8) * Math.PI * 2) * R} stroke={fg} strokeWidth={R * 0.05} />
            ))}
            <circle cx={cx} cy={cy} r={R * 0.14} fill={accent} />
          </g>
        )}
        {kind === 'roulette' && (
          <g transform={`rotate(${-spin} ${cx} ${cy})`}>
            {Array.from({length: 12}, (_, i) => {
              const a0 = (i / 12) * Math.PI * 2;
              const a1 = ((i + 1) / 12) * Math.PI * 2;
              return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} A${R} ${R} 0 0 1 ${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R} Z`} fill={i % 2 ? fg : accent} />;
            })}
            <circle cx={cx} cy={cy} r={R * 0.3} fill={bg} />
          </g>
        )}
        {kind === 'pupil' && (
          <g>
            <circle cx={cx} cy={cy} r={R} fill={fg} />
            <circle cx={cx} cy={cy} r={R * 0.62} fill={accent} />
            <circle cx={cx} cy={cy} r={R * 0.34} fill={bg} />
            <circle cx={cx - R * 0.14} cy={cy - R * 0.14} r={R * 0.1} fill={fg} />
          </g>
        )}
        {kind === 'moon' && (
          <g>
            <circle cx={cx} cy={cy} r={R} fill={fg} />
            {[[-0.3, -0.25, 0.2], [0.35, 0.1, 0.14], [-0.1, 0.4, 0.1]].map(([x, y, r], i) => (
              <circle key={i} cx={cx + x * R} cy={cy + y * R} r={r * R} fill={accent} opacity={0.5} />
            ))}
          </g>
        )}
        {kind === 'keyhole' && (
          <g>
            <circle cx={cx} cy={cy} r={R} fill={fg} />
            <circle cx={cx} cy={cy - R * 0.18} r={R * 0.28} fill={bg} />
            <path d={`M${cx - R * 0.14} ${cy - R * 0.05} L${cx - R * 0.26} ${cy + R * 0.55} L${cx + R * 0.26} ${cy + R * 0.55} L${cx + R * 0.14} ${cy - R * 0.05} Z`} fill={bg} />
          </g>
        )}
        {kind === 'target' && (
          <g>
            {[1, 0.72, 0.46, 0.2].map((k, i) => (
              <circle key={i} cx={cx} cy={cy} r={R * k} fill={i % 2 ? accent : fg} />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
};
