import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from './ease';
import {Plate, PlatePaletteName, useSafeId} from './image-kit';
import {rng} from './random';
import {Vignette, useStage} from './stage';

/**
 * Round-2 group E2: glass-pane-grid mode 'leaded' — the image re-made as a stained-glass panel: a jittered lozenge
 * lattice of jewel-tinted pieces, a dark lead network with round joins and solder blobs, streaky glass, backlight band.
 * Idea from lemo-opuscar styles/stained-glass demo/glass.js (MIT) — see THIRD_PARTY_NOTICES.md.
 */

export interface LeadedProps {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  gridSeed: number;
  cellSize: number;
  lead: number;
  leadColor: string;
  jewels: string[];
  backlight: number;
  bandAt: number;
  start: number;
  tintOpacity: number;
}

export const LeadedGlass: React.FC<LeadedProps> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = useSafeId('gpgl');
  const cs = Math.max(24, p.cellSize) * u;
  const cells = useMemo(() => {
    const r = rng(p.gridSeed * 101 + 5);
    const n = Math.ceil((Math.hypot(w, h) / cs) / 2) + 2;
    const cx = w / 2;
    const cy = h / 2;
    const ca = Math.cos(Math.PI / 4 + 0.12);
    const sa = Math.sin(Math.PI / 4 + 0.12);
    const V: [number, number][][] = [];
    for (let j = -n; j <= n; j++) {
      const row: [number, number][] = [];
      for (let i = -n; i <= n; i++) {
        const a = i * cs * 1.0 + (r() - 0.5) * cs * 0.34;
        const b = j * cs * 1.45 + (r() - 0.5) * cs * 0.34;
        row.push([cx + a * ca - b * sa, cy + a * sa + b * ca]);
      }
      V.push(row);
    }
    const out: {pts: [number, number][]; c: number; ang: number; k: number; j: number}[] = [];
    for (let j = 0; j < V.length - 1; j++)
      for (let i = 0; i < V[j].length - 1; i++) {
        const pts = [V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]];
        const mx = pts.reduce((s, q) => s + q[0], 0) / 4;
        const my = pts.reduce((s, q) => s + q[1], 0) / 4;
        if (mx < -cs * 2 || mx > w + cs * 2 || my < -cs * 2 || my > h + cs * 2) continue;
        out.push({pts, c: r(), ang: r() * 180, k: r(), j: mx * 0.002 + my * 0.0014});
      }
    return {cells: out, V};
  }, [w, h, cs, p.gridSeed]);
  const light = prog(frame, p.start, p.start + 20, ease.out);
  const bandAt = p.bandAt >= 0 ? p.bandAt : p.start + 30;
  const band = prog(frame, bandAt, bandAt + 60, ease.inOut);
  const lw = p.lead * u;
  const leadD = cells.cells.map((c) => `M${c.pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L')}Z`).join('');
  return (
    <AbsoluteFill style={{background: p.leadColor, overflow: 'hidden'}}>
      <Plate src={p.src} seed={p.seed} palette={p.palette} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${id}-streak`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={`${0.004 / u} ${0.05 / u}`} numOctaves={2} seed={p.gridSeed + 3} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.2" />
          </filter>
          <linearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff6dc" stopOpacity={0.55 * p.backlight} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* jewel colour pieces over the image */}
        {cells.cells.map((c, i) => {
          const col = p.jewels[Math.floor(c.c * p.jewels.length) % p.jewels.length];
          const appear = prog(frame, p.start + c.j * 7, p.start + c.j * 7 + 14, ease.out);
          const d = `M${c.pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L')}Z`;
          return (
            <g key={i} opacity={appear}>
              <path d={d} fill={col} style={{mixBlendMode: 'color'}} opacity={p.tintOpacity} />
              <path d={d} fill={col} style={{mixBlendMode: 'multiply'}} opacity={p.tintOpacity * 0.55 * (0.7 + 0.3 * c.k)} />
              {c.k > 0.8 && <path d={d} fill="#ffffff" opacity={0.22} />}
            </g>
          );
        })}
        <rect width={w} height={h} filter={`url(#${id}-streak)`} style={{mixBlendMode: 'overlay'}} opacity={0.35 * light} />
        {/* lead network */}
        <path d={leadD} fill="none" stroke={p.leadColor} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round" opacity={light} />
        <path d={leadD} fill="none" stroke="#5b5758" strokeWidth={lw * 0.18} strokeLinejoin="round" opacity={0.5 * light} transform={`translate(${-lw * 0.18} ${-lw * 0.18})`} />
        {cells.V.flat().map((q, i) => (i % 2 === 0 && q[0] > 0 && q[0] < w && q[1] > 0 && q[1] < h ? <circle key={i} cx={q[0]} cy={q[1]} r={lw * 0.62} fill={p.leadColor} opacity={light} /> : null))}
        {/* backlight band sweeping across */}
        <g style={{mixBlendMode: 'screen'}}>
          <rect x={-w * 0.4 + band * w * 1.4} y={0} width={w * 0.4} height={h} fill={`url(#${id}-band)`} opacity={band > 0 && band < 1 ? 1 : 0} />
        </g>
      </svg>
      <Vignette strength={0.3} />
    </AbsoluteFill>
  );
};
