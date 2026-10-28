// Technique after lemo-opuscar styles/watercolor demo/engine.js (mk, drawS, drawList) (MIT, LemoLab) — see THIRD_PARTY_NOTICES.md.
// Own deterministic SVG implementation: variable-width translucent ribbons + dry-brush bristle tracks.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {PaperTexture, useStage} from '../../core/stage';
import {rng} from '../../core/random';
import {defineMotion} from '../../core/types';

type PathSpec = {pts?: number[][]; d?: string; color?: string; width?: number; profile?: 'brush' | 'leaf' | 'even' | 'tip' | 'trunk'};
type Props = {
  paths: PathSpec[];
  colors: string[];
  width: number;
  profile: 'brush' | 'leaf' | 'even' | 'tip' | 'trunk' | 'auto';
  bristles: boolean;
  rough: number;
  opacity: number;
  order: 'given' | 'top-down' | 'radial' | 'byLength';
  startFrame: number;
  durationFrames: number;
  sway: number;
  paper: string;
  background: string;
  seed: number;
};

const PROF: Record<string, (s: number) => number> = {
  brush: (s) => Math.min(1, s / 0.1 + 0.3) * Math.pow(Math.max(0, 1 - 0.85 * s), 0.6),
  leaf: (s) => Math.pow(Math.max(0, Math.sin(Math.PI * (0.94 * s + 0.03))), 0.7),
  even: (s) => Math.min(1, s / 0.06 + 0.35) * Math.min(1, (1 - s) / 0.08 + 0.4),
  tip: (s) => Math.pow(Math.max(0, 1 - 0.92 * s), 0.85) * Math.min(1, s / 0.05 + 0.6),
  trunk: (s) => (1 - 0.62 * s) * (1 + 9 * Math.max(0, 0.06 - s)),
};

type Pt = [number, number];
type Spec = {pts: Pt[]; color: string; width: number; profile: string};

const quad = (a: Pt, c: Pt, b: Pt, n = 36): Pt[] =>
  Array.from({length: n}, (_, i) => {
    const t = i / (n - 1);
    const m = 1 - t;
    return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]] as Pt;
  });

const sprig = (seed: number): Spec[] => {
  const r = rng(seed);
  const out: Spec[] = [];
  const stem = quad([500, 900], [440, 560], [520, 150], 60);
  out.push({pts: stem, color: '#6b5a3c', width: 26, profile: 'trunk'});
  const leafCols = ['#4f7a4b', '#6f9a5a', '#3f6a52', '#7da45f'];
  const tList = [0.22, 0.34, 0.46, 0.58, 0.7, 0.82];
  tList.forEach((t, i) => {
    const k = Math.floor(t * (stem.length - 1));
    const P = stem[k];
    const Q = stem[Math.min(stem.length - 1, k + 3)];
    const dir: Pt = [Q[0] - P[0], Q[1] - P[1]];
    const dl = Math.hypot(dir[0], dir[1]) || 1;
    const sd: Pt = [dir[0] / dl, dir[1] / dl];
    const side = i % 2 === 0 ? 1 : -1;
    const nrm: Pt = [-sd[1] * side, sd[0] * side];
    const L = 190 - i * 8 + r() * 30;
    const end: Pt = [P[0] + nrm[0] * L * 0.8 + sd[0] * L * 0.55, P[1] + nrm[1] * L * 0.8 + sd[1] * L * 0.55];
    const ctl: Pt = [P[0] + nrm[0] * L * 0.75 + sd[0] * L * 0.05, P[1] + nrm[1] * L * 0.75 + sd[1] * L * 0.05];
    out.push({pts: quad(P, ctl, end, 30), color: leafCols[i % leafCols.length], width: 70 + r() * 16, profile: 'leaf'});
  });
  // top leaf
  out.push({pts: quad([520, 150], [545, 100], [575, 60], 20), color: leafCols[3], width: 54, profile: 'leaf'});
  // berries on short twigs
  [[0.5, -1], [0.66, 1], [0.38, 1]].forEach(([t, side], i) => {
    const k = Math.floor((t as number) * (stem.length - 1));
    const P = stem[k];
    const tw: Pt = [P[0] + (side as number) * 120, P[1] + 40];
    out.push({pts: quad(P, [P[0] + (side as number) * 60, P[1] - 30], tw, 16), color: '#6b5a3c', width: 8, profile: 'tip'});
    out.push({pts: quad([tw[0], tw[1] - 4], [tw[0] + 20, tw[1] + 22], [tw[0] - 3, tw[1] + 46], 14), color: '#c4462f', width: 52, profile: 'even'});
  });
  // ground wash
  out.push({pts: quad([240, 915], [500, 935], [770, 905], 30), color: '#d7b277', width: 40, profile: 'even'});
  return out;
};

const sampleD = (d: string): Pt[] => {
  try {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    const L = el.getTotalLength();
    return Array.from({length: 48}, (_, i) => {
      const q = el.getPointAtLength((i / 47) * L);
      return [q.x, q.y] as Pt;
    });
  } catch {
    return [];
  }
};

const BrushPaintIn: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const S = (Math.min(w, h) * 0.84 * (portrait ? 1.6 : 1)) / 1000;
  const ox = w / 2 - 500 * S;
  const oy = h / 2 - 500 * S;

  const strokes = React.useMemo(() => {
    const r = rng(p.seed * 17 + 3);
    let specs: Spec[];
    if (p.paths && p.paths.length) {
      specs = p.paths
        .map((sp, i): Spec => ({
          pts: sp.pts && sp.pts.length > 1 ? (sp.pts as Pt[]) : sp.d ? sampleD(sp.d) : [],
          color: sp.color || p.colors[i % Math.max(1, p.colors.length)] || '#3a5a8c',
          width: sp.width ?? p.width,
          profile: sp.profile || (p.profile === 'auto' ? 'brush' : p.profile),
        }))
        .filter((s) => s.pts.length > 1);
    } else specs = sprig(p.seed);
    return specs.map((sp) => {
      const n = sp.pts.length;
      const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
      const nz = (s: number) => 0.5 * (Math.sin(s * 9 + ph[0]) + Math.sin(s * 23 + ph[1]) * 0.6 + Math.sin(s * 5 + ph[2]) * 0.4) / 1.5 * 2;
      const prof = PROF[sp.profile] || PROF.brush;
      const cum = [0];
      for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(sp.pts[i][0] - sp.pts[i - 1][0], sp.pts[i][1] - sp.pts[i - 1][1]));
      const len = cum[n - 1] || 1;
      const widths = sp.pts.map((_, i) => Math.max(0.5, sp.width * prof(cum[i] / len) * (1 + p.rough * nz(cum[i] / len))));
      const normals = sp.pts.map((_, i) => {
        const a = sp.pts[Math.max(0, i - 1)];
        const b = sp.pts[Math.min(n - 1, i + 1)];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const l = Math.hypot(dx, dy) || 1;
        return [-dy / l, dx / l] as Pt;
      });
      const nb = Math.max(3, Math.min(9, Math.round(sp.width * S / 3.2)));
      const bristles = Array.from({length: nb}, () => ({
        off: (r() - 0.5) * 0.92,
        wr: 0.6 + r() * 0.7,
        a: 0.3 + r() * 0.55,
        end: 0.72 + r() * 0.28,
        dash: Array.from({length: 3}, () => `${(18 + r() * 72).toFixed(0)} ${(1 + r() * (sp.width * 0.5 + 3)).toFixed(0)}`).join(' '),
      }));
      const cx = sp.pts.reduce((s, q) => s + q[0], 0) / n;
      const cy = sp.pts.reduce((s, q) => s + q[1], 0) / n;
      return {...sp, widths, normals, len, bristles, cx, cy, tone: (r() - 0.5) * 0.12};
    });
  }, [p.paths, p.colors, p.width, p.profile, p.rough, p.seed]);

  // paint order
  const order = React.useMemo(() => {
    const idx = strokes.map((_, i) => i);
    if (p.order === 'top-down') idx.sort((a, b) => strokes[a].cy - strokes[b].cy);
    else if (p.order === 'radial') idx.sort((a, b) => Math.hypot(strokes[a].cx - 500, strokes[a].cy - 500) - Math.hypot(strokes[b].cx - 500, strokes[b].cy - 500));
    else if (p.order === 'byLength') idx.sort((a, b) => strokes[b].len - strokes[a].len);
    return idx;
  }, [strokes, p.order]);

  const N = strokes.length;
  const slice = Math.min(0.5, Math.max(0.12, 4 / Math.max(1, N)));
  const q = prog(frame, p.startFrame, p.startFrame + p.durationFrames, ease.sine);
  const done = q >= 1;
  const sway = done ? Math.sin((frame - p.startFrame - p.durationFrames) * 0.055) * p.sway * Math.min(1, (frame - p.startFrame - p.durationFrames) / 20) : 0;

  const els: React.ReactNode[] = [];
  order.forEach((si, rank) => {
    const s = strokes[si];
    const start = N > 1 ? (rank / (N - 1)) * (1 - slice) : 0;
    const local = Math.min(1, Math.max(0, (q - start) / slice));
    if (local <= 0) return;
    const pe = ease.out(local);
    const n = s.pts.length;
    const upto = pe * (n - 1);
    const m = Math.floor(upto);
    const f = upto - m;
    const idxs: {x: number; y: number; w: number; nx: number; ny: number}[] = [];
    for (let i = 0; i <= m; i++) idxs.push({x: s.pts[i][0], y: s.pts[i][1], w: s.widths[i], nx: s.normals[i][0], ny: s.normals[i][1]});
    if (f > 0 && m < n - 1) {
      const a = idxs[m];
      const b = {x: s.pts[m + 1][0], y: s.pts[m + 1][1], w: s.widths[m + 1], nx: s.normals[m + 1][0], ny: s.normals[m + 1][1]};
      idxs.push({x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, w: (a.w + (b.w - a.w) * f) * (local < 1 ? 0.5 : 1), nx: a.nx, ny: a.ny});
    }
    if (idxs.length < 2) return;
    const left = idxs.map((q2) => `${(q2.x + (q2.nx * q2.w) / 2).toFixed(1)},${(q2.y + (q2.ny * q2.w) / 2).toFixed(1)}`);
    const right = idxs.map((q2) => `${(q2.x - (q2.nx * q2.w) / 2).toFixed(1)},${(q2.y - (q2.ny * q2.w) / 2).toFixed(1)}`).reverse();
    const body = `M${left.join('L')}L${right.join('L')}Z`;
    const rib = p.bristles ? 0.62 : 0.92;
    els.push(
      <g key={si}>
        <path d={body} fill={s.color} fillOpacity={0.92 * rib * p.opacity} stroke={s.color} strokeOpacity={0.35 * p.opacity} strokeWidth={0.8} strokeLinejoin="round" />
        {p.bristles && s.width * S >= 6
          ? s.bristles.map((b, bi) => {
              const lim = Math.min(idxs.length, Math.max(2, Math.round(b.end * (n - 1) + 1)));
              const seg = idxs.slice(0, lim);
              if (seg.length < 2) return null;
              const pts = seg.map((q2) => `${(q2.x + q2.nx * q2.w * b.off).toFixed(1)},${(q2.y + q2.ny * q2.w * b.off).toFixed(1)}`).join(' ');
              const avgW = (s.width / s.bristles.length) * b.wr;
              return <polyline key={bi} points={pts} fill="none" stroke={s.color} strokeOpacity={b.a * p.opacity} strokeWidth={Math.max(0.7 / S, avgW)} strokeDasharray={b.dash} strokeLinecap="round" strokeLinejoin="round" />;
            })
          : null}
      </g>,
    );
  });

  return (
    <AbsoluteFill style={{background: p.background}}>
      <PaperTexture opacity={0.5} tint={p.paper} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${ox} ${oy + 450 * S}) skewX(${sway}) translate(0 ${-450 * S}) scale(${S})`} style={{mixBlendMode: 'multiply'}}>
          {els}
        </g>
      </svg>
      <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${180 * u}px rgba(120,95,50,0.16)`}} />
    </AbsoluteFill>
  );
};

export const brushPaintIn = defineMotion<Props>({
  id: 'brush-paint-in',
  title: 'Watercolour brush paint-in',
  category: 'shape',
  description:
    'Any path set (a plant sprig by default) paints itself in stroke by stroke: each stroke is a translucent variable-width ribbon with thin bristle tracks that break into dashes and end early (dry-brush flying white), overlaps darken, and the finished painting sways gently.',
  source: ['lemo-opuscar styles/watercolor demo/engine.js mk/drawS/drawList (MIT, LemoLab) — own SVG build'],
  useFor: 'Paint-on reveals of icons, logos, plants, horizons and illustrations in warm editorial / field-journal looks; hand-made accents for nature, craft, wellness and education brands.',
  durationInFrames: 210,
  defaultProps: {
    paths: [],
    colors: ['#4f7a4b', '#c4462f', '#6b5a3c', '#d7b277'],
    width: 44,
    profile: 'auto',
    bristles: true,
    rough: 0.22,
    opacity: 1,
    order: 'given',
    startFrame: 14,
    durationFrames: 140,
    sway: 1.4,
    paper: '#8a7350',
    background: '#F3EDE0',
    seed: 7,
  },
  propDocs: {
    paths: "[{pts:[[x,y]..] (0-1000 design space) | d:'svg path', color, width, profile}] — empty = built-in plant sprig",
    colors: 'fallback colours cycled over paths without a colour',
    width: 'default stroke width in design units',
    profile: "width profile: 'brush'|'leaf'|'even'|'tip'|'trunk'|'auto'",
    bristles: 'dry-brush bristle tracks',
    rough: 'width noise 0-0.5',
    opacity: 'overall stroke opacity',
    order: "'given'|'top-down'|'radial'|'byLength'",
    startFrame: 'frame painting starts',
    durationFrames: 'frames the whole painting takes',
    sway: 'degrees of idle sway after finishing (0 = still)',
    paper: 'paper fibre tint',
    background: 'paper colour',
    seed: 'randomness seed',
  },
  component: BrushPaintIn,
  tags: ['watercolor', 'watercolour', 'brush', 'paint', 'strokes', 'bristle', 'dry brush', 'botanical', 'illustration', 'paper', 'sway', 'reveal'],
});
