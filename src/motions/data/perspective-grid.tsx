import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {PencilHatch, SketchPaper} from '../../core/sketch-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {HandCursor, bez, lin} from '../../core/ui-kit';

/**
 * video22 hand-drawn chess board: perspective-grid-draw-on (trapezoid top = 0.72 x bottom, 18 quick pen strokes
 * with 4-14 px overshoot and a tiny bow, then handwritten a-h / 1-8 in red and blue), pencil-hatch-squares (green
 * coloured-pencil hatch on the dark squares), board-pullback-reveal (zoom-out ease cubic-bezier(.45,0,.55,1)),
 * doodle-piece-pop-in (pen ellipse -> pastel blob -> sprite with a spring pop, 2 f stagger, rank by rank), margin
 * doodles drawing on, then move-hint-rings (red circle under the piece, ochre rings with leaf sprouts on the
 * targets, L-bracket selection) with a white-glove cursor, and "your move" written below.
 */
type Props = {
  cols: number;
  rows: number;
  strokeColor: string;
  hatchColor: string;
  labelColors: string[];
  lightColors: string[];
  darkColors: string[];
  ringColor: string;
  paper: string;
  caption: string;
  pieces: boolean;
  doodles: boolean;
  hints: boolean;
  pullback: number;
  seed: number;
};

type Pt = [number, number];

// ----------------------------------------------------------------------------------------- piece sprites
const Piece: React.FC<{kind: number; x: number; y: number; s: number; light: boolean; pal: string[]; frame: number}> = ({kind, x, y, s, light, pal, frame}) => {
  const [body, shade, ink] = pal;
  const bob = Math.sin(frame * 0.12 + x * 0.01) * s * 0.015;
  const sw = Math.max(1, s * 0.045);
  const top = y - s * 0.95 + bob;
  const eyesY = y - s * 0.48 + bob;
  const hat = (() => {
    switch (kind) {
      case 1: // rook
        return <path d={`M${x - s * 0.3} ${top + s * 0.18} v${-s * 0.16} h${s * 0.13} v${s * 0.08} h${s * 0.1} v${-s * 0.08} h${s * 0.14} v${s * 0.08} h${s * 0.1} v${-s * 0.08} h${s * 0.13} v${s * 0.16} Z`} fill={shade} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
      case 2: // knight ears
        return (
          <>
            <path d={`M${x - s * 0.22} ${top + s * 0.16} l${s * 0.02} ${-s * 0.24} l${s * 0.12} ${s * 0.18} Z`} fill={shade} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <path d={`M${x + s * 0.22} ${top + s * 0.16} l${-s * 0.02} ${-s * 0.24} l${-s * 0.12} ${s * 0.18} Z`} fill={shade} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          </>
        );
      case 3: // bishop hat
        return <path d={`M${x - s * 0.2} ${top + s * 0.14} Q${x} ${top - s * 0.42} ${x + s * 0.2} ${top + s * 0.14} Z`} fill={shade} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
      case 4: // queen crown
        return <path d={`M${x - s * 0.24} ${top + s * 0.14} l${s * 0.02} ${-s * 0.24} l${s * 0.1} ${s * 0.12} l${s * 0.1} ${-s * 0.18} l${s * 0.1} ${s * 0.18} l${s * 0.1} ${-s * 0.12} l${s * 0.02} ${s * 0.24} Z`} fill="#F4D04E" stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
      case 5: // king crown + cross
        return (
          <>
            <path d={`M${x - s * 0.22} ${top + s * 0.14} l${s * 0.02} ${-s * 0.2} l${s * 0.1} ${s * 0.1} l${s * 0.1} ${-s * 0.14} l${s * 0.1} ${s * 0.14} l${s * 0.1} ${-s * 0.1} l${s * 0.02} ${s * 0.2} Z`} fill="#F4D04E" stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <path d={`M${x} ${top - s * 0.14} v${-s * 0.2} M${x - s * 0.08} ${top - s * 0.26} h${s * 0.16}`} stroke={ink} strokeWidth={sw * 1.2} strokeLinecap="round" />
          </>
        );
      default:
        return null;
    }
  })();
  const rw = kind === 0 ? 0.3 : 0.36;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={s * 0.34} ry={s * 0.1} fill={ink} opacity={0.18} />
      <path
        d={`M${x - s * rw} ${y - s * 0.05} C${x - s * (rw + 0.06)} ${top + s * 0.3} ${x - s * 0.24} ${top} ${x} ${top} C${x + s * 0.24} ${top} ${x + s * (rw + 0.06)} ${top + s * 0.3} ${x + s * rw} ${y - s * 0.05} Q${x} ${y + s * 0.06} ${x - s * rw} ${y - s * 0.05} Z`}
        fill={body}
        stroke={ink}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <path d={`M${x + s * rw * 0.55} ${top + s * 0.25} Q${x + s * rw * 0.95} ${y - s * 0.3} ${x + s * rw * 0.6} ${y - s * 0.08}`} fill="none" stroke={shade} strokeWidth={sw * 2.2} strokeLinecap="round" opacity={0.8} />
      {hat}
      {[-1, 1].map((k) => (
        <g key={k}>
          <ellipse cx={x + k * s * 0.1} cy={eyesY} rx={s * 0.05} ry={s * 0.07} fill="#fff" stroke={ink} strokeWidth={sw * 0.6} />
          <circle cx={x + k * s * 0.1 + s * 0.012} cy={eyesY + s * 0.015} r={s * 0.028} fill={ink} />
        </g>
      ))}
      {light ? (
        <path d={`M${x - s * 0.06} ${eyesY + s * 0.13} q${s * 0.06} ${s * 0.06} ${s * 0.12} 0`} fill="none" stroke={ink} strokeWidth={sw * 0.8} strokeLinecap="round" />
      ) : (
        <path d={`M${x - s * 0.18} ${eyesY - s * 0.1} l${s * 0.1} ${s * 0.03} M${x + s * 0.18} ${eyesY - s * 0.1} l${-s * 0.1} ${s * 0.03}`} stroke={ink} strokeWidth={sw * 0.8} strokeLinecap="round" />
      )}
      <circle cx={x - s * 0.19} cy={eyesY + s * 0.1} r={s * 0.04} fill="#F28A8A" opacity={0.6} />
      <circle cx={x + s * 0.19} cy={eyesY + s * 0.1} r={s * 0.04} fill="#F28A8A" opacity={0.6} />
    </g>
  );
};

// ----------------------------------------------------------------------------------------- doodles
type Doodle = {kind: 'sun' | 'cloud' | 'moon' | 'rainbow' | 'whale' | 'flower' | 'star' | 'bunting'; x: number; y: number; s: number; x2?: number};

const doodlePaths = (d: Doodle): {d: string; c: string; w?: number; fill?: string}[] => {
  const {x, y, s} = d;
  switch (d.kind) {
    case 'sun':
      return [
        {d: `M${x + s * 0.3} ${y} A${s * 0.3} ${s * 0.3} 0 1 1 ${x + s * 0.3 - 0.01} ${y - 1}`, c: '#D9A43A', fill: '#F6D77A'},
        ...Array.from({length: 9}, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return {d: `M${x + Math.cos(a) * s * 0.42} ${y + Math.sin(a) * s * 0.42} L${x + Math.cos(a) * s * 0.6} ${y + Math.sin(a) * s * 0.6}`, c: '#D9A43A'};
        }),
        {d: `M${x - s * 0.1} ${y + s * 0.06} q${s * 0.1} ${s * 0.08} ${s * 0.2} 0`, c: '#7a5a2a'},
      ];
    case 'cloud':
      return [{d: `M${x - s * 0.6} ${y + s * 0.15} q${-s * 0.1} ${-s * 0.3} ${s * 0.2} ${-s * 0.3} q${s * 0.1} ${-s * 0.3} ${s * 0.4} ${-s * 0.2} q${s * 0.3} ${-s * 0.15} ${s * 0.45} ${s * 0.15} q${s * 0.3} ${s * 0.05} ${s * 0.15} ${s * 0.35} Z`, c: '#7C93C9', fill: '#F4F6FB'}];
    case 'moon':
      return [{d: `M${x + s * 0.1} ${y - s * 0.45} a${s * 0.45} ${s * 0.45} 0 1 0 ${s * 0.3} ${s * 0.8} a${s * 0.35} ${s * 0.35} 0 1 1 ${-s * 0.3} ${-s * 0.8} Z`, c: '#7C7FC9', fill: '#F4F0C8'}];
    case 'rainbow':
      return ['#E06A5A', '#F2B24A', '#7FB868', '#6A8FD8'].map((c, i) => ({d: `M${x - s * (0.7 - i * 0.12)} ${y} A${s * (0.7 - i * 0.12)} ${s * (0.7 - i * 0.12)} 0 0 1 ${x + s * (0.7 - i * 0.12)} ${y}`, c, w: 3.2}));
    case 'whale':
      return [
        {d: `M${x - s * 0.6} ${y} C${x - s * 0.6} ${y - s * 0.45} ${x + s * 0.35} ${y - s * 0.5} ${x + s * 0.45} ${y - s * 0.05} L${x + s * 0.7} ${y - s * 0.3} L${x + s * 0.68} ${y + s * 0.1} L${x + s * 0.45} ${y + s * 0.08} C${x + s * 0.2} ${y + s * 0.3} ${x - s * 0.5} ${y + s * 0.3} ${x - s * 0.6} ${y} Z`, c: '#5B6FB8', fill: '#C9D4F2'},
        {d: `M${x - s * 0.35} ${y - s * 0.08} m${-s * 0.03} 0 a${s * 0.03} ${s * 0.03} 0 1 0 ${s * 0.06} 0 a${s * 0.03} ${s * 0.03} 0 1 0 ${-s * 0.06} 0`, c: '#2a2550'},
        {d: `M${x - s * 0.1} ${y - s * 0.38} q${-s * 0.05} ${-s * 0.2} ${-s * 0.15} ${-s * 0.22} M${x - s * 0.1} ${y - s * 0.38} q${s * 0.05} ${-s * 0.2} ${s * 0.15} ${-s * 0.22}`, c: '#6A8FD8'},
      ];
    case 'flower':
      return [
        {d: `M${x} ${y + s * 0.5} Q${x + s * 0.05} ${y + s * 0.2} ${x} ${y}`, c: '#5F9A55'},
        {d: `M${x} ${y + s * 0.3} q${s * 0.2} ${-s * 0.1} ${s * 0.22} ${-s * 0.25} q${-s * 0.18} 0 ${-s * 0.22} ${s * 0.25}`, c: '#5F9A55', fill: '#A9D59A'},
        ...Array.from({length: 5}, (_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return {d: `M${x + Math.cos(a) * s * 0.12 - s * 0.08} ${y + Math.sin(a) * s * 0.12} a${s * 0.08} ${s * 0.08} 0 1 0 ${s * 0.16} 0 a${s * 0.08} ${s * 0.08} 0 1 0 ${-s * 0.16} 0`, c: '#D9657A', fill: '#F6B7C3'};
        }),
        {d: `M${x - s * 0.05} ${y} a${s * 0.05} ${s * 0.05} 0 1 0 ${s * 0.1} 0 a${s * 0.05} ${s * 0.05} 0 1 0 ${-s * 0.1} 0`, c: '#C9922E', fill: '#F6D77A'},
      ];
    case 'star':
      return [{d: `M${x} ${y - s * 0.3} L${x + s * 0.09} ${y - s * 0.09} L${x + s * 0.3} ${y} L${x + s * 0.09} ${y + s * 0.09} L${x} ${y + s * 0.3} L${x - s * 0.09} ${y + s * 0.09} L${x - s * 0.3} ${y} L${x - s * 0.09} ${y - s * 0.09} Z`, c: '#D9A43A', fill: '#F6E39A'}];
    case 'bunting': {
      const x2 = d.x2 ?? x + s * 4;
      const n = Math.max(4, Math.round((x2 - x) / (s * 0.45)));
      const sag = s * 0.35;
      const yy = (t: number) => y + Math.sin(t * Math.PI) * sag;
      const out: {d: string; c: string; w?: number; fill?: string}[] = [{d: `M${x} ${y} Q${(x + x2) / 2} ${y + sag * 2} ${x2} ${y}`, c: '#8a7a62'}];
      const cols = ['#E06A5A', '#F2B24A', '#7FB868', '#6A8FD8', '#C58AD8'];
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const px = lerp(x, x2, t);
        const py = yy(t);
        out.push({d: `M${px - s * 0.12} ${py} L${px + s * 0.12} ${py} L${px} ${py + s * 0.3} Z`, c: cols[i % cols.length], fill: cols[i % cols.length]});
      }
      return out;
    }
  }
};

const PerspectiveGrid: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait, fps} = useStage();
  const C = p.cols;
  const R = p.rows;
  // final board geometry
  const Wb = portrait ? w * 0.84 : Math.min(w * 0.46, h * 0.95);
  const Hb = portrait ? h * 0.4 : h * 0.6;
  const top = portrait ? h * 0.23 : h * 0.13;
  const a = (Wb * 0.72) / 2;
  const b = Wb / 2;
  const q = b / a;
  const persp = (t: number) => (t * q) / (1 - t + t * q);
  const P = (s: number, t: number): Pt => {
    const tt = persp(t);
    return [cx + (2 * s - 1) * lerp(a, b, tt), top + Hb * tt];
  };
  const sqW = (t: number) => (2 * lerp(a, b, persp(t))) / C;

  // camera pull-back
  const pb0 = 46;
  const pb1 = pb0 + 51;
  const pbT = bez(0.45, 0, 0.55, 1)(lin(frame, pb0, pb1));
  const z0 = Math.min(p.pullback, (w * 0.96) / Wb, (h * 0.92) / (Hb + 130 * u));
  const zoom = lerp(Math.max(1, z0), 1, pbT) * (1 + 0.02 * prog(frame, pb1, 240, ease.sine));
  const oy = top + Hb * 0.5 + 30 * u;
  const camY = lerp(30 * u, 0, pbT);

  // strokes
  const strokes = React.useMemo(() => {
    const r = rng(p.seed + 3);
    const L: [Pt, Pt][] = [];
    L.push([P(0, 0), P(1, 0)]);
    L.push([P(1, 0), P(1, 1)]);
    L.push([P(1, 1), P(0, 1)]);
    L.push([P(0, 1), P(0, 0)]);
    for (let i = 1; i < C; i++) L.push([P(i / C, 0), P(i / C, 1)]);
    for (let j = 1; j < R; j++) L.push([P(0, j / R), P(1, j / R)]);
    return L.map(([A, B]) => {
      const dx = B[0] - A[0];
      const dy = B[1] - A[1];
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const o1 = (4 + 10 * r()) * u;
      const o2 = (4 + 10 * r()) * u;
      const bow = (r() * 4 - 2) * u;
      const S: Pt = [A[0] - ux * o1, A[1] - uy * o1];
      const E: Pt = [B[0] + ux * o2, B[1] + uy * o2];
      const M: Pt = [(S[0] + E[0]) / 2 - uy * bow, (S[1] + E[1]) / 2 + ux * bow];
      return `M${S[0].toFixed(1)} ${S[1].toFixed(1)} Q${M[0].toFixed(1)} ${M[1].toFixed(1)} ${E[0].toFixed(1)} ${E[1].toFixed(1)}`;
    });
  }, [w, h, u, C, R, p.seed]);
  const strokeT = (i: number) => clamp((frame - (4 + i * 1.6)) / 3.5);

  // hatch quads (dark squares)
  const hatchA = prog(frame, 40, 48, ease.out);
  const quads: string[] = [];
  for (let i = 0; i < C; i++)
    for (let j = 0; j < R; j++) {
      const rank = R - j; // bottom row = 1
      if ((i + rank) % 2 === 1) continue;
      const pts = [P(i / C, j / R), P((i + 1) / C, j / R), P((i + 1) / C, (j + 1) / R), P(i / C, (j + 1) / R)];
      quads.push(pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '));
    }

  // pieces: rank 2, 1 (light) then 7, 8 (dark)
  const back = [1, 2, 3, 4, 5, 3, 2, 1];
  const order: {file: number; rank: number; kind: number; light: boolean}[] = [];
  if (p.pieces) {
    for (let f = 0; f < C; f++) order.push({file: f, rank: 2, kind: 0, light: true});
    for (let f = 0; f < C; f++) order.push({file: f, rank: 1, kind: back[f % 8], light: true});
    for (let f = 0; f < C; f++) order.push({file: f, rank: R - 1, kind: 0, light: false});
    for (let f = 0; f < C; f++) order.push({file: f, rank: R, kind: back[f % 8], light: false});
  }
  const pieceStart = 70;
  const sq = (file: number, rank: number) => {
    const t = (R - rank + 0.8) / R;
    const [x, y] = P((file + 0.5) / C, t);
    return {x, y, s: sqW(t)};
  };
  // hints: piece on file e (index 4) rank 2
  const hf = Math.min(4, C - 1);
  const H0 = 178;
  const targets = [3, 4];

  // doodles
  const doodles: Doodle[] = portrait
    ? [
        {kind: 'sun', x: w * 0.14, y: h * 0.075, s: 110 * u},
        {kind: 'cloud', x: w * 0.42, y: h * 0.075, s: 120 * u},
        {kind: 'moon', x: w * 0.86, y: h * 0.07, s: 90 * u},
        {kind: 'bunting', x: w * 0.12, x2: w * 0.88, y: h * 0.135, s: 80 * u},
        {kind: 'rainbow', x: w * 0.24, y: h * 0.84, s: 210 * u},
        {kind: 'whale', x: w * 0.7, y: h * 0.83, s: 260 * u},
        {kind: 'flower', x: w * 0.1, y: h * 0.9, s: 120 * u},
        {kind: 'flower', x: w * 0.9, y: h * 0.91, s: 110 * u},
        {kind: 'star', x: w * 0.6, y: h * 0.06, s: 50 * u},
        {kind: 'star', x: w * 0.47, y: h * 0.92, s: 50 * u},
      ]
    : [
        {kind: 'sun', x: w * 0.1, y: h * 0.16, s: 120 * u},
        {kind: 'cloud', x: w * 0.22, y: h * 0.33, s: 110 * u},
        {kind: 'moon', x: w * 0.9, y: h * 0.15, s: 100 * u},
        {kind: 'cloud', x: w * 0.8, y: h * 0.33, s: 90 * u},
        {kind: 'bunting', x: cx - Wb * 0.45, x2: cx + Wb * 0.45, y: h * 0.045, s: 70 * u},
        {kind: 'rainbow', x: w * 0.13, y: h * 0.74, s: 170 * u},
        {kind: 'whale', x: w * 0.86, y: h * 0.6, s: 200 * u},
        {kind: 'flower', x: w * 0.07, y: h * 0.86, s: 100 * u},
        {kind: 'flower', x: w * 0.93, y: h * 0.84, s: 90 * u},
        {kind: 'star', x: w * 0.3, y: h * 0.12, s: 50 * u},
        {kind: 'star', x: w * 0.7, y: h * 0.1, s: 44 * u},
      ];
  const boil = Math.floor(frame / 3) % 3;

  const pen = p.strokeColor;
  const labelY = top + Hb + 52 * u;
  const capT = lin(frame, 206, 228);
  const cursorTo = (() => {
    const s0 = sq(hf, 2);
    const s1 = sq(hf, 4);
    const k1 = prog(frame, 160, 176, ease.inOut);
    const k2 = prog(frame, 196, 206, ease.inOut);
    const sx = cx + Wb * 0.62;
    const sy = top + Hb * 1.05;
    return [lerp(lerp(sx, s0.x + 8 * u, k1), s1.x + 8 * u, k2), lerp(lerp(sy, s0.y - s0.s * 0.3, k1), s1.y - s1.s * 0.2, k2)];
  })();

  return (
    <AbsoluteFill>
      <SketchPaper color={p.paper} seed={p.seed + 5} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <PencilHatch id="pg-hatch" color={p.hatchColor} gap={7} width={2} opacity={0.75} angle={-55} seed={p.seed} />
        <g transform={`translate(0 ${camY}) translate(${cx} ${oy}) scale(${zoom}) translate(${-cx} ${-oy})`}>
          {/* margin doodles */}
          {p.doodles &&
            doodles.map((d, i) => {
              const t0 = 100 + i * 5;
              const dt = lin(frame, t0, t0 + 12);
              if (dt <= 0) return null;
              const paths = doodlePaths(d);
              const jit = (boil - 1) * 0.6 * u;
              return (
                <g key={i} transform={`translate(${jit} ${-jit})`}>
                  {paths.map((pp, k) => (
                    <g key={k}>
                      {pp.fill && <path d={pp.d} fill={pp.fill} opacity={0.75 * clamp(dt * 2 - 1)} />}
                      <path d={pp.d} fill="none" stroke={pp.c} strokeWidth={(pp.w ?? 2.4) * u} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(dt * 1.3 - k * 0.05)} />
                    </g>
                  ))}
                </g>
              );
            })}
          {/* hatch */}
          <g opacity={hatchA}>
            {quads.map((pts, i) => (
              <polygon key={i} points={pts} fill="url(#pg-hatch)" />
            ))}
          </g>
          {/* grid strokes */}
          {strokes.map((d, i) => {
            const t = strokeT(i);
            if (t <= 0) return null;
            return <path key={i} d={d} fill="none" stroke={pen} strokeWidth={3.2 * u} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />;
          })}
          {/* labels */}
          {Array.from({length: C}, (_, i) => {
            const t0 = 34 + i * 1.5;
            const s = spring({frame: frame - t0, fps, config: {damping: 12, stiffness: 200}});
            if (frame < t0) return null;
            const [x] = P((i + 0.5) / C, 1);
            return (
              <text key={i} x={x} y={labelY} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={46 * u * s} fill={i < C / 2 ? p.labelColors[0] : p.labelColors[1]}>
                {String.fromCharCode(97 + i)}
              </text>
            );
          })}
          {Array.from({length: R}, (_, j) => {
            const t0 = 34 + C * 1.5 + j * 1.2;
            if (frame < t0) return null;
            const s = spring({frame: frame - t0, fps, config: {damping: 12, stiffness: 200}});
            const t = (R - j - 0.5) / R;
            const [x, y] = P(0, t);
            return (
              <text key={j} x={x - 30 * u} y={y + 14 * u} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={38 * u * s} fill={pen} opacity={0.85}>
                {j + 1}
              </text>
            );
          })}
          {/* hint: red circle under the selected piece */}
          {p.hints &&
            (() => {
              const s0 = sq(hf, 2);
              const t = lin(frame, H0, H0 + 5);
              if (t <= 0) return null;
              return <ellipse cx={s0.x} cy={s0.y - s0.s * 0.02} rx={s0.s * 0.42} ry={s0.s * 0.16} fill="none" stroke="#C8453B" strokeWidth={3 * u} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />;
            })()}
          {/* pieces */}
          {order
            .map((pc, i) => ({pc, i}))
            .sort((A, B) => B.pc.rank - A.pc.rank)
            .map(({pc, i}) => {
            const t0 = pieceStart + i * 2;
            if (frame < t0) return null;
            const {x, y, s} = sq(pc.file, pc.rank);
            const S = s * 0.74;
            const l = frame - t0;
            const pal = pc.light ? p.lightColors : p.darkColors;
            const outline = clamp(l / 3);
            const sp = spring({frame: l - 5, fps, config: {damping: 12, stiffness: 200}});
            const lift = p.hints && pc.light && pc.rank === 2 && pc.file === hf ? prog(frame, H0 - 4, H0 + 2, ease.out) * 10 * u : 0;
            return (
              <g key={i}>
                {l < 7 && <ellipse cx={x} cy={y - S * 0.45} rx={S * 0.32} ry={S * 0.45} fill={l >= 3 ? (pc.light ? '#E8C9A0' : '#C9C0EE') : 'none'} stroke={pc.light ? '#B0503A' : '#4F4790'} strokeWidth={2 * u} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - outline} />}
                {l >= 5 && (
                  <g transform={`translate(${x} ${y - lift}) scale(${0.9 + 0.1 * sp + (l < 9 ? 0.05 * Math.sin(((l - 5) / 4) * Math.PI) : 0)}) translate(${-x} ${-y})`}>
                    <Piece kind={pc.kind} x={x} y={y} s={S} light={pc.light} pal={pal} frame={frame} />
                  </g>
                )}
              </g>
            );
          })}
          {/* hint rings on targets */}
          {p.hints &&
            targets.map((rk, k) => {
              const s1 = sq(hf, rk);
              const t0 = H0 + 3 + k * 1.5;
              const t = lin(frame, t0, t0 + 5);
              if (t <= 0) return null;
              const rr = s1.s * 0.35;
              return (
                <g key={k}>
                  <path d={`M${s1.x + rr} ${s1.y - s1.s * 0.3} A${rr} ${rr * 0.62} 0 1 1 ${s1.x + rr * 0.96} ${s1.y - s1.s * 0.3 - rr * 0.18}`} fill="none" stroke={p.ringColor} strokeWidth={3 * u} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />
                  {t >= 1 && <path d={`M${s1.x + rr * 0.7} ${s1.y - s1.s * 0.3 - rr * 0.5} q${6 * u} ${-12 * u} ${16 * u} ${-10 * u} q${-4 * u} ${10 * u} ${-16 * u} ${10 * u}`} fill="#7FB868" stroke="#4F7A43" strokeWidth={1.5 * u} />}
                </g>
              );
            })}
          {p.hints &&
            frame >= H0 + 22 &&
            (() => {
              const s1 = sq(hf, 4);
              const sc = frame === H0 + 22 ? 1.1 : 1;
              const half = s1.s * 0.5 * sc;
              const L = s1.s * 0.18;
              const yc = s1.y - s1.s * 0.3;
              return (
                <g stroke={p.ringColor} strokeWidth={3.5 * u} fill="none" strokeLinecap="round">
                  {[
                    [-1, -1],
                    [1, -1],
                    [1, 1],
                    [-1, 1],
                  ].map(([sx, sy], k) => (
                    <path key={k} d={`M${s1.x + sx * half} ${yc + sy * half * 0.62 - sy * L} V${yc + sy * half * 0.62} H${s1.x + sx * half - sx * L}`} />
                  ))}
                </g>
              );
            })()}
          {/* caption */}
          {capT > 0 && (
            <text
              x={cx}
              y={labelY + (portrait ? 110 : 84) * u}
              textAnchor="middle"
              fontFamily={fonts.hand}
              fontWeight={700}
              fontSize={(portrait ? 72 : 60) * u}
              fill="#C8453B"
              style={{clipPath: `inset(0 ${(1 - capT) * 100}% 0 0)`}}
            >
              {p.caption}
            </text>
          )}
          {p.hints && frame >= 156 && <HandCursor x={cursorTo[0]} y={cursorTo[1]} size={44 * u} />}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const perspectiveGrid = defineMotion<Props>({
  id: 'perspective-grid',
  title: 'Hand-drawn perspective board',
  category: 'data',
  description: 'Pen strokes draw a perspective trapezoid board, coloured-pencil hatch fills squares, doodle pieces pop in (outline -> blob -> sprite) during a pull-back that reveals margin doodles, then move-hint rings and "your move".',
  source: ['video22 7:60-10:50 perspective-grid-draw-on, pencil-hatch-squares, doodle-piece-pop-in, move-hint-rings, board-pullback-reveal'],
  useFor: 'Game boards, calendars / schedules drawn by hand, planning grids, playful "your move" decision beats.',
  durationInFrames: 240,
  defaultProps: {
    cols: 8,
    rows: 8,
    strokeColor: '#483E31',
    hatchColor: '#9BAF8E',
    labelColors: ['#C8453B', '#3F5FB8'],
    lightColors: ['#F2B36B', '#E08F4A', '#5A3A22'],
    darkColors: ['#8A7FE6', '#5E54C8', '#2A2550'],
    ringColor: '#B19551',
    paper: '#E9E4DA',
    caption: 'your move',
    pieces: true,
    doodles: true,
    hints: true,
    pullback: 1.35,
    seed: 2,
  },
  propDocs: {
    cols: 'board columns (files)',
    rows: 'board rows (ranks)',
    strokeColor: 'pen ink colour',
    hatchColor: 'coloured-pencil hatch on dark squares',
    labelColors: '[left-half, right-half] file letter colours',
    lightColors: '[body, shade, ink] of the light pieces',
    darkColors: '[body, shade, ink] of the dark pieces',
    ringColor: 'ochre hint ring / bracket colour',
    caption: 'handwritten line under the board at the end',
    pieces: 'pop in doodle pieces on the first/last two ranks',
    doodles: 'draw margin doodles during the pull-back',
    hints: 'select a piece and show move-hint rings + cursor',
    pullback: 'starting zoom of the camera pull-back (1 = none)',
  },
  component: PerspectiveGrid,
  tags: ['board', 'grid', 'hand-drawn', 'chess', 'calendar', 'doodle', 'pencil'],
});
