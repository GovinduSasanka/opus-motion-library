import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {DeckleFrame, InkLine, PencilHatch, SK, SketchPaper} from '../../core/sketch-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video20 sprout-grow-row (planters scene, 129-136 s), drawn in the video's pencil-sketch look.
 * Stems rise out of hatched planters with a left-to-right stagger (scaleY 0->1 over 0.4 s ease-out), leaf pairs pop
 * at 60 % of the stem, flower heads scale 0 -> 1.1 -> 1 over 0.25 s; then everything sways and a few sparkles twinkle.
 */
type Props = {
  background: string;
  ground: string;
  rows: number;
  planters: number;
  perPlanter: number;
  stagger: number;
  startAt: number;
  headColors: string[];
  stemColor: string;
  leafColor: string;
  sparkles: boolean;
  frame: boolean;
  seed: number;
};

type Sprout = {x: number; base: number; height: number; color: string; kind: number; t0: number; lean: number; scale: number; seed: number};

const Head: React.FC<{x: number; y: number; s: number; color: string; kind: number; u: number}> = ({x, y, s, color, kind, u}) => {
  if (s <= 0) return null;
  const R = 13 * u;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {kind === 0 ? (
        // sunflower: petals + brown centre
        <g>
          {Array.from({length: 9}, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return <ellipse key={i} cx={Math.cos(a) * R * 1.05} cy={Math.sin(a) * R * 1.05} rx={R * 0.62} ry={R * 0.32} transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * R * 1.05} ${Math.sin(a) * R * 1.05})`} fill={color} stroke={SK.ink} strokeWidth={0.8 * u} />;
          })}
          <circle r={R * 0.62} fill="#8A5A3A" stroke={SK.ink} strokeWidth={1 * u} />
        </g>
      ) : kind === 1 ? (
        // round blossom: 5 lobes
        <g>
          {Array.from({length: 5}, (_, i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            return <circle key={i} cx={Math.cos(a) * R * 0.62} cy={Math.sin(a) * R * 0.62} r={R * 0.58} fill={color} stroke={SK.ink} strokeWidth={0.8 * u} />;
          })}
          <circle r={R * 0.3} fill="#F2D060" stroke={SK.ink} strokeWidth={0.7 * u} />
        </g>
      ) : (
        // tulip cup
        <path d={`M ${-R * 0.8} ${-R * 0.2} Q ${-R * 0.9} ${R * 0.9} 0 ${R * 0.8} Q ${R * 0.9} ${R * 0.9} ${R * 0.8} ${-R * 0.2} L ${R * 0.45} ${R * 0.15} L 0 ${-R * 0.55} L ${-R * 0.45} ${R * 0.15} Z`} fill={color} stroke={SK.ink} strokeWidth={1 * u} strokeLinejoin="round" />
      )}
    </g>
  );
};

const SproutGrow: React.FC<Props> = ({background, ground, rows, planters, perPlanter, stagger, startAt, headColors, stemColor, leafColor, sparkles, frame: showFrame, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const horizon = h * (portrait ? 0.3 : 0.34);
  const nRows = rows > 0 ? Math.max(1, Math.min(4, Math.round(rows))) : portrait ? 3 : 2;
  const nP = Math.max(1, Math.round(planters));
  const r = rng(seed);
  const Z = portrait ? 1.3 : 1.6;
  // planter geometry per row (back row first, smaller and higher)
  const rowsGeo = Array.from({length: nRows}, (_, ri) => {
    const k = nRows === 1 ? 1 : 0.72 + (0.28 * ri) / (nRows - 1);
    const y = nRows === 1 ? h * 0.72 : horizon + (h * 0.9 - horizon) * ((ri + 0.75) / (nRows + 0.2));
    const span = w * (portrait ? 0.8 : 0.8) * (0.85 + 0.15 * k);
    const gap = 44 * u * k;
    const pw = (span - gap * (nP - 1)) / nP;
    const x0 = (w - span) / 2 + (ri % 2 ? 12 * u : -12 * u) * (nRows > 1 ? 1 : 0);
    return {k, y, pw, gap, x0, ph: 62 * Z * u * k, depth: 24 * Z * u * k};
  });
  // sprouts, globally ordered left-to-right within a row, back row first
  const sprouts: Sprout[] = [];
  let order = 0;
  const st = Math.min(stagger, 84 / Math.max(1, nRows * nP * perPlanter));
  rowsGeo.forEach((g, ri) => {
    for (let p = 0; p < nP; p++) {
      const px = g.x0 + p * (g.pw + g.gap);
      for (let s = 0; s < perPlanter; s++) {
        const x = px + g.pw * ((s + 0.5) / perPlanter) + (r() - 0.5) * g.pw * 0.05;
        sprouts.push({
          x,
          base: g.y - g.depth * 0.5,
          height: (100 + r() * 50) * Z * u * g.k,
          color: headColors[Math.floor(r() * headColors.length) % headColors.length],
          kind: Math.floor(r() * 3),
          t0: startAt + order * st + ri * 4,
          lean: (r() - 0.5) * 0.12,
          scale: g.k,
          seed: order,
        });
        order++;
      }
    }
  });
  const hatchSoil = 'sg-soil';
  const hatchFront = 'sg-front';
  const hatchGrass = 'sg-grass';
  return (
    <AbsoluteFill>
      <SketchPaper color={background} seed={seed} />
      <Svg>
        <PencilHatch id={hatchSoil} color="#3E3026" gap={4} opacity={0.6} />
        <PencilHatch id={hatchFront} color="#8C7660" gap={6} opacity={0.45} seed={3} />
        <PencilHatch id={hatchGrass} color="#6F7A45" gap={7} opacity={0.5} seed={5} />
        {/* background trees: hatched blobs behind the horizon */}
        {Array.from({length: portrait ? 4 : 7}, (_, i) => {
          const q = rng(seed * 11 + i);
          const tx = (w * (i + 0.5)) / (portrait ? 4 : 7) + (q() - 0.5) * 60 * u;
          const tr = (95 + q() * 55) * u;
          const ty = horizon - tr * 0.95 - q() * 30 * u;
          return (
            <g key={i}>
              <line x1={tx} x2={tx} y1={ty + tr * 0.6} y2={horizon + 4 * u} stroke={SK.ink} strokeWidth={2 * u} opacity={0.7} />
              <ellipse cx={tx} cy={ty} rx={tr * 1.05} ry={tr * 0.9} fill="#A9BD8E" opacity={0.75} />
              <ellipse cx={tx} cy={ty} rx={tr * 1.05} ry={tr * 0.9} fill={`url(#${hatchGrass})`} />
              <ellipse cx={tx} cy={ty} rx={tr * 1.05} ry={tr * 0.9} fill="none" stroke={SK.ink} strokeWidth={1.6 * u} opacity={0.8} />
            </g>
          );
        })}
        {/* ground */}
        <rect x={0} y={horizon} width={w} height={h - horizon} fill={ground} opacity={0.75} />
        <rect x={0} y={horizon} width={w} height={h - horizon} fill={`url(#${hatchGrass})`} />
        <InkLine x1={0} y1={horizon} x2={w} y2={horizon} width={1.6} seed={2} />
        {rowsGeo.map((g, ri) => (
          <g key={ri}>
            {/* planters */}
            {Array.from({length: nP}, (_, p) => {
              const px = g.x0 + p * (g.pw + g.gap);
              const top = g.y - g.depth;
              const fy = g.y;
              const sk = 14 * u * g.k;
              return (
                <g key={p}>
                  <ellipse cx={px + g.pw / 2 + 10 * u} cy={fy + g.ph + 6 * u} rx={g.pw * 0.55} ry={10 * u * g.k} fill="#5E5A3E" opacity={0.25} />
                  <polygon points={`${px},${fy} ${px + g.pw},${fy} ${px + g.pw},${fy + g.ph} ${px},${fy + g.ph}`} fill={SK.planter} />
                  <polygon points={`${px},${fy} ${px + g.pw},${fy} ${px + g.pw},${fy + g.ph} ${px},${fy + g.ph}`} fill={`url(#${hatchFront})`} />
                  <polygon points={`${px + sk},${top} ${px + g.pw - sk},${top} ${px + g.pw},${fy} ${px},${fy}`} fill={SK.soil} opacity={0.85} />
                  <polygon points={`${px + sk},${top} ${px + g.pw - sk},${top} ${px + g.pw},${fy} ${px},${fy}`} fill={`url(#${hatchSoil})`} />
                  <InkLine x1={px} y1={fy} x2={px + g.pw} y2={fy} seed={p * 4 + ri} />
                  <InkLine x1={px} y1={fy + g.ph} x2={px + g.pw} y2={fy + g.ph} seed={p * 4 + ri + 1} />
                  <InkLine x1={px} y1={fy} x2={px} y2={fy + g.ph} seed={p * 4 + ri + 2} />
                  <InkLine x1={px + g.pw} y1={fy} x2={px + g.pw} y2={fy + g.ph} seed={p * 4 + ri + 3} />
                  <InkLine x1={px + sk} y1={top} x2={px + g.pw - sk} y2={top} seed={p * 4 + ri + 5} width={1.4} />
                  <InkLine x1={px + sk} y1={top} x2={px} y2={fy} seed={p * 4 + ri + 6} width={1.4} />
                  <InkLine x1={px + g.pw - sk} y1={top} x2={px + g.pw} y2={fy} seed={p * 4 + ri + 7} width={1.4} />
                </g>
              );
            })}
            {/* sprouts of this row */}
            {sprouts
              .filter((s) => Math.abs(s.scale - g.k) < 1e-6)
              .map((s) => {
                const grow = prog(frame, s.t0, s.t0 + 12, ease.out);
                if (frame < s.t0 - 4) return null;
                const mound = prog(frame, s.t0 - 4, s.t0, ease.back);
                const sway = Math.sin(frame * 0.07 + s.seed * 1.3) * 0.035 * prog(frame, s.t0 + 14, s.t0 + 40) + s.lean;
                const H = s.height * grow;
                const tipX = s.x + Math.sin(sway) * H;
                const tipY = s.base - Math.cos(sway) * H;
                const midX = s.x + Math.sin(sway * 0.5) * H * 0.5;
                const midY = s.base - H * 0.5;
                const leafP = prog(frame, s.t0 + 7, s.t0 + 11, ease.back);
                const head = prog(frame, s.t0 + 11, s.t0 + 19, ease.back);
                const ly = s.base - s.height * 0.42 * grow;
                const lx = s.x + Math.sin(sway) * s.height * 0.42 * grow;
                const L = 21 * u * s.scale * leafP;
                const ang = (sway * 180) / Math.PI;
                return (
                  <g key={s.seed}>
                    <ellipse cx={s.x} cy={s.base + 1 * u} rx={9 * u * s.scale * mound} ry={4 * u * s.scale * mound} fill="#4A3A2E" />
                    {grow > 0 && (
                      <path d={`M ${s.x} ${s.base} Q ${midX} ${midY} ${tipX} ${tipY}`} fill="none" stroke={stemColor} strokeWidth={4.2 * u * s.scale} strokeLinecap="round" />
                    )}
                    {grow > 0 && <path d={`M ${s.x} ${s.base} Q ${midX} ${midY} ${tipX} ${tipY}`} fill="none" stroke={SK.ink} strokeWidth={0.9 * u} strokeLinecap="round" opacity={0.55} transform={`translate(${1.6 * u} 0)`} />}
                    {leafP > 0 && (
                      <g transform={`translate(${lx} ${ly}) rotate(${ang})`}>
                        <ellipse cx={-L * 0.75} cy={-L * 0.2} rx={L * 0.8} ry={L * 0.34} transform={`rotate(-28 ${-L * 0.75} ${-L * 0.2})`} fill={leafColor} stroke={SK.ink} strokeWidth={0.9 * u} />
                        <ellipse cx={L * 0.75} cy={-L * 0.35} rx={L * 0.8} ry={L * 0.34} transform={`rotate(28 ${L * 0.75} ${-L * 0.35})`} fill={leafColor} stroke={SK.ink} strokeWidth={0.9 * u} />
                      </g>
                    )}
                    <Head x={tipX} y={tipY} s={head * s.scale * 1.15} color={s.color} kind={s.kind} u={u} />
                  </g>
                );
              })}
          </g>
        ))}
        {sparkles &&
          sprouts
            .filter((_, i) => i % 3 === 1)
            .map((s, i) => {
              const at = s.t0 + 20 + (i % 4) * 6;
              const life = (frame - at) % 46;
              if (frame < at) return null;
              const tw = Math.sin(clamp(life / 14) * Math.PI);
              if (tw <= 0) return null;
              const q = rng(seed * 7 + i);
              const sx = s.x + (q() - 0.5) * 60 * u;
              const sy = s.base - s.height * (0.9 + q() * 0.5);
              return <Sparkle key={i} x={sx} y={sy} size={(7 + q() * 6) * u * tw} color={SK.sparkles[i % SK.sparkles.length]} rotate={frame * 3} />;
            })}
      </Svg>
      {showFrame && <DeckleFrame tint="#AFB592" seed={seed} />}
    </AbsoluteFill>
  );
};

export const sproutGrow = defineMotion<Props>({
  id: 'sprout-grow',
  title: 'Sprout grow row',
  category: 'shape',
  description: 'Pencil-sketch planters on a park lawn: stems rise one after another, leaf pairs pop and flower heads (sunflower, blossom, tulip) scale in with overshoot, then sway with twinkling sparkles inside a torn-paper frame.',
  source: ['video20 2:09-2:16 sprout-grow-row'],
  useFor: 'Growth / progress / "it worked" beats, gardening or sustainability topics, a cheerful payoff after a fix.',
  durationInFrames: 150,
  defaultProps: {
    background: SK.paper,
    ground: SK.grass,
    rows: 0,
    planters: 3,
    perPlanter: 5,
    stagger: 2.4,
    startAt: 8,
    headColors: ['#E8C25A', '#E0626A', '#9070C0', '#F2A65A'],
    stemColor: SK.stem,
    leafColor: SK.leaf,
    sparkles: true,
    frame: true,
    seed: 3,
  },
  propDocs: {
    background: 'paper colour (sky)',
    ground: 'lawn colour under the hatching',
    rows: 'planter rows (0 = auto: 2 landscape, 3 portrait; back rows smaller)',
    planters: 'planters per row',
    perPlanter: 'sprouts per planter',
    stagger: 'frames between consecutive sprouts (left to right, 0.08 s measured)',
    startAt: 'frame the first sprout starts',
    headColors: 'flower head colours (picked per sprout)',
    sparkles: 'twinkle 4-point sparkles after the flowers open',
    frame: 'draw the torn deckle paper frame',
    seed: 'layout / colour randomness',
  },
  component: SproutGrow,
  tags: ['grow', 'plant', 'flower', 'pencil', 'sketch', 'stagger', 'nature'],
});
