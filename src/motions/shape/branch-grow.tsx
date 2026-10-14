import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Reticle, TypedLabel, VK, VoidBg} from '../../core/void-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video11 branching-growth-stroke + branching-tree-diagram. A recursive branching structure draws itself from the
 * trunk outward: each level's strokes reveal with a dash over `framesPerLevel`, children start when the parent is
 * 70 % drawn, terminal tips pop in as gold synapse dots, then signal pulses run root -> tips. A small binary-tree
 * diagram gains one level per stage. Layouts: neuron (dendrites up + roots down inside a reticle), tree, radial.
 */
type Props = {
  layout: 'neuron' | 'tree' | 'radial';
  depth: number;
  angleSpread: number;
  lengthDecay: number;
  framesPerLevel: number;
  startAt: number;
  color: string;
  tipColor: string;
  pulseColor: string;
  pulses: boolean;
  diagram: boolean;
  label: string;
  sublabel: string;
  seed: number;
};

type Br = {x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; d: number; t0: number; leaf: boolean; w: number; order: number};

const grow = (x: number, y: number, ang: number, len: number, depth: number, maxD: number, t0: number, fpl: number, spread: number, decay: number, r: () => number, out: Br[], w0: number) => {
  const x1 = x + Math.cos(ang) * len;
  const y1 = y + Math.sin(ang) * len;
  const bend = (r() - 0.5) * len * 0.25;
  const mx = (x + x1) / 2 - Math.sin(ang) * bend;
  const my = (y + y1) / 2 + Math.cos(ang) * bend;
  const leaf = depth >= maxD;
  out.push({x0: x, y0: y, cx: mx, cy: my, x1, y1, d: depth, t0, leaf, w: w0 * Math.pow(0.72, depth), order: out.length});
  if (leaf) return;
  const n = depth < 2 && r() < 0.35 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const side = n === 2 ? (i === 0 ? -1 : 1) : i - 1;
    const a = ang + side * ((spread * (0.8 + r() * 0.4) * Math.PI) / 180) + (r() - 0.5) * 0.2;
    const l = len * decay * (0.85 + r() * 0.3);
    if (depth > 2 && r() < 0.12) continue; // occasional pruned twig
    grow(x1, y1, a, l, depth + 1, maxD, t0 + fpl * 0.7, fpl, spread, decay, r, out, w0);
  }
};

const BranchGrow: React.FC<Props> = ({layout, depth, angleSpread, lengthDecay, framesPerLevel, startAt, color, tipColor, pulseColor, pulses, diagram, label, sublabel, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const fpl = framesPerLevel;
  const D = Math.max(2, Math.min(8, Math.round(depth)));
  const R = Math.min(w, h) * 0.42;
  const branches = useMemo(() => {
    const r = rng(seed);
    const out: Br[] = [];
    if (layout === 'radial') {
      const n = 6;
      for (let i = 0; i < n; i++) grow(cx, cy, (i / n) * Math.PI * 2 + 0.3, R * 0.3, 0, D - 1, startAt, fpl, angleSpread * 0.85, lengthDecay, r, out, 5 * u);
    } else if (layout === 'tree') {
      const base = portrait ? h * 0.8 : h * 0.86;
      grow(cx, base, -Math.PI / 2, (portrait ? h * 0.16 : h * 0.2), 0, D, startAt, fpl, angleSpread, lengthDecay, r, out, 9 * u);
    } else {
      grow(cx, cy + R * 0.18, -Math.PI / 2, R * 0.24, 0, D, startAt, fpl, angleSpread, lengthDecay * 1.04, r, out, 6 * u);
      grow(cx, cy + R * 0.18, Math.PI / 2, R * 0.15, 0, Math.max(2, D - 2), startAt + fpl * 0.5, fpl, angleSpread * 1.15, lengthDecay * 0.95, r, out, 4 * u);
    }
    return out;
  }, [layout, D, angleSpread, lengthDecay, fpl, startAt, seed, cx, cy, R, u, h, portrait]);
  const lastT = Math.max(...branches.map((b) => b.t0)) + fpl;
  const leaves = branches.filter((b) => b.leaf);
  // diagram
  const dg = {x: portrait ? w * 0.1 : w * 0.06, y: portrait ? h * 0.08 : h * 0.1, w: portrait ? w * 0.42 : w * 0.17, h: portrait ? h * 0.07 : h * 0.14};
  const levels = 5;
  const lvlAt = (k: number) => startAt + (k * (lastT - startAt)) / levels;
  const diagramLines: React.ReactNode[] = [];
  if (diagram) {
    for (let k = 0; k < levels - 1; k++) {
      const t0 = lvlAt(k + 1);
      const hp = prog(frame, t0, t0 + 3, ease.out);
      const vp = prog(frame, t0 + 3, t0 + 6, ease.out);
      if (hp <= 0) continue;
      const n = Math.pow(2, k);
      const yN = dg.y + (dg.h * k) / (levels - 1);
      const yC = dg.y + (dg.h * (k + 1)) / (levels - 1);
      const ym = (yN + yC) / 2;
      for (let i = 0; i < n; i++) {
        const xc = dg.x + (dg.w * (i + 0.5)) / n;
        const half = dg.w / n / 4;
        diagramLines.push(<line key={`s${k}-${i}`} x1={xc} x2={xc} y1={yN} y2={yN + (ym - yN) * hp} stroke="#A09FC2" strokeWidth={1.5 * u} />);
        diagramLines.push(<line key={`h${k}-${i}`} x1={xc - half * hp} x2={xc + half * hp} y1={ym} y2={ym} stroke="#A09FC2" strokeWidth={1.5 * u} />);
        if (vp > 0) [-1, 1].forEach((sd) => diagramLines.push(<line key={`v${k}-${i}-${sd}`} x1={xc + sd * half} x2={xc + sd * half} y1={ym} y2={ym + (yC - ym) * vp} stroke="#A09FC2" strokeWidth={1.5 * u} />));
      }
    }
  }
  const leafCount = leaves.filter((b) => frame >= b.t0 + fpl).length;
  const pulsePeriod = 24;
  const pulseStart = lastT + 4;
  return (
    <AbsoluteFill>
      <VoidBg seed={seed + 2} />
      <Svg>
        <defs>
          <filter id={`bg-glow-${seed}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={3 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {layout !== 'tree' && (
          <g>
            <Reticle cx={cx} cy={cy} r={R * 1.04} draw={prog(frame, 0, 18, ease.out)} rotate={frame * 0.05} />
            <circle cx={cx} cy={cy} r={R * 1.12} fill="none" stroke={VK.reticle} strokeWidth={1 * u} strokeDasharray={`${2 * u} ${6 * u}`} opacity={prog(frame, 6, 20)} />
          </g>
        )}
        <g filter={`url(#bg-glow-${seed})`}>
          {branches.map((b, i) => {
            const p = prog(frame, b.t0, b.t0 + fpl, (t) => 1 - (1 - t) * (1 - t));
            if (p <= 0) return null;
            return <path key={i} d={`M ${b.x0} ${b.y0} Q ${b.cx} ${b.cy} ${b.x1} ${b.y1}`} fill="none" stroke={color} strokeWidth={Math.max(1, b.w)} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.9} />;
          })}
          {/* soma / root node */}
          <circle cx={branches[0].x0} cy={branches[0].y0} r={(layout === 'tree' ? 7 : 11) * u * prog(frame, startAt - 4, startAt + 2, ease.back)} fill={layout === 'neuron' ? VK.magenta : 'none'} stroke={color} strokeWidth={2 * u} />
          {leaves.map((b, i) => {
            const s = prog(frame, b.t0 + fpl, b.t0 + fpl + 3, ease.back);
            if (s <= 0) return null;
            const tw = 0.8 + 0.2 * Math.sin(frame * 0.2 + i);
            return <circle key={`t${i}`} cx={b.x1} cy={b.y1} r={(3.5 + (i % 3)) * u * s * tw} fill={tipColor} />;
          })}
          {pulses &&
            frame > pulseStart &&
            branches.map((b, i) => {
              const ph = frame - pulseStart;
              const k = Math.floor(ph / pulsePeriod);
              const out: React.ReactNode[] = [];
              for (let j = Math.max(0, k - 1); j <= k; j++) {
                const local = (ph - j * pulsePeriod) / 5 - b.d; // 5 frames per level
                if (local < 0 || local > 1) continue;
                const t = local;
                const x = (1 - t) * (1 - t) * b.x0 + 2 * (1 - t) * t * b.cx + t * t * b.x1;
                const y = (1 - t) * (1 - t) * b.y0 + 2 * (1 - t) * t * b.cy + t * t * b.y1;
                out.push(<circle key={`${i}-${j}`} cx={x} cy={y} r={2.6 * u} fill={pulseColor} />);
              }
              return out;
            })}
        </g>
        {diagramLines}
        {diagram && <circle cx={dg.x + dg.w / 2} cy={dg.y - 4 * u} r={4 * u * prog(frame, startAt - 2, startAt + 2)} fill="none" stroke="#A09FC2" strokeWidth={1.5 * u} />}
      </Svg>
      {diagram && (
        <TypedLabel x={dg.x} y={dg.y + dg.h + 14 * u} text={`n = ${Math.pow(2, Math.max(0, Math.min(levels - 1, Math.floor(((frame - startAt) / Math.max(1, lastT - startAt)) * levels))))}`} start={startAt} size={18} />
      )}
      {label && <TypedLabel x={portrait ? cx : w * 0.06} y={portrait ? cy + R * 1.3 : h * 0.8} text={label} sub={sublabel} start={Math.round(lastT * 0.6)} size={26} anchor={portrait ? 'center' : 'left'} />}
      <TypedLabel x={portrait ? w * 0.9 : w - 70 * u} y={portrait ? h * 0.08 : h * 0.1} text={`tips ${String(leafCount).padStart(3, '0')}`} start={startAt + 4} size={18} anchor="right" />
    </AbsoluteFill>
  );
};

export const branchGrow = defineMotion<Props>({
  id: 'branch-grow',
  title: 'Branching growth (dendrites / tree / network)',
  category: 'shape',
  description: 'A glowing recursive branching structure draws itself level by level from the trunk in a navy HUD void, gold dots pop at every tip, signal pulses run root to tips, and a binary-tree diagram counts the doubling.',
  source: ['video11 0:16.1-0:17.0 branching-growth-stroke', 'video11 0:03.5-0:05.2 branching-tree-diagram'],
  useFor: 'Growth, learning, neural networks, family trees, decision trees, "one idea spreads into many" beats.',
  durationInFrames: 150,
  defaultProps: {
    layout: 'neuron',
    depth: 6,
    angleSpread: 28,
    lengthDecay: 0.74,
    framesPerLevel: 8,
    startAt: 10,
    color: VK.stroke,
    tipColor: VK.gold,
    pulseColor: '#7FE0E8',
    pulses: true,
    diagram: true,
    label: 'dendrites · synapses form',
    sublabel: 'one cell, thousands of connections',
    seed: 3,
  },
  propDocs: {
    layout: "'neuron' (dendrites up, roots down, inside a reticle) | 'tree' (one tree from the bottom) | 'radial' (network from the centre)",
    depth: 'recursion depth (levels)',
    angleSpread: 'branch angle from the parent in degrees (25-35 measured)',
    lengthDecay: 'child length / parent length (0.72 measured)',
    framesPerLevel: 'frames to draw one level (children start at 70 %)',
    startAt: 'frame the trunk starts drawing',
    tipColor: 'synapse dot colour at the tips',
    pulseColor: 'signal pulse colour',
    pulses: 'run signal pulses root -> tips after growth',
    diagram: 'show the doubling binary-tree diagram + count',
    label: 'typed mono label',
    sublabel: 'second label line',
    seed: 'branch randomness',
  },
  component: BranchGrow,
  tags: ['branch', 'tree', 'neuron', 'network', 'growth', 'recursive', 'hud', 'science'],
});
