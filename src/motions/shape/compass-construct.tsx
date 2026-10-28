import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {TipDot, dash1} from '../../core/shape-kit';
import {Svg, useStage} from '../../core/stage';
import {withPortraitFit} from '../../core/portrait3';
import {defineMotion} from '../../core/types';

/**
 * video6 2.00-2.70 s / 51.3-53.2 s `compass-geometry-construct` + `geometry-implode`: a compass (pivot leg,
 * pencil leg, hinge) sweeps a circle, then the six petal arcs of the Seed of Life, a ruler draws the
 * hexagon vertex to vertex with a bright leading tip, vertex glints, vesica lens, gold nodes - then the
 * whole construction spins -60 deg, shrinks and un-draws into a glowing point.
 */
type Props = {
  background: string;
  lineColor: string;
  hexColor: string;
  nodeColor: string;
  compassColor: string;
  radius: number;
  speed: number;
  showCompass: boolean;
  vesica: boolean;
  implode: boolean;
  seed: number;
};

type Arc = {kind: 'arc'; cx: number; cy: number; a0: number; a1: number; s: number; d: number};
type Seg = {kind: 'line'; x0: number; y0: number; x1: number; y1: number; s: number; d: number};

const CompassConstruct: React.FC<Props> = ({background, lineColor, hexColor, nodeColor, compassColor, radius, speed, showCompass, vesica, implode, seed}) => {
  const frame0 = useCurrentFrame();
  const {u, cx, cy, w, h, durationInFrames} = useStage();
  const frame = frame0 * speed;
  const D = durationInFrames * speed;
  const R = radius * Math.min(w, h);
  const deg = Math.PI / 180;
  const P = (i: number): [number, number] => [cx + R * Math.cos(-90 * deg + i * 60 * deg), cy + R * Math.sin(-90 * deg + i * 60 * deg)];

  // ---- schedule (frames at 30 fps, before speed) -------------------------------------------
  const radiusLine: Seg = {kind: 'line', x0: cx, y0: cy, x1: cx, y1: cy - R, s: 2, d: 6};
  const circle: Arc = {kind: 'arc', cx, cy, a0: -90 * deg, a1: 270 * deg, s: 8, d: 20};
  const petals: Arc[] = Array.from({length: 6}, (_, i) => {
    const [px, py] = P(i);
    const a = -90 * deg + i * 60 * deg;
    return {kind: 'arc', cx: px, cy: py, a0: a + 120 * deg, a1: a + 240 * deg, s: 31 + i * 6, d: 10};
  });
  const hexStart = 70;
  const hex: Seg[] = Array.from({length: 6}, (_, i) => {
    const [x0, y0] = P(i);
    const [x1, y1] = P(i + 1);
    return {kind: 'line', x0, y0, x1, y1, s: hexStart + i * 3, d: 4};
  });
  const vesStart = 100;
  const impStart = D - 22;
  const impEnd = impStart + 9;

  const p = (s: number, d: number, e: (t: number) => number = (t) => t) => e(clamp((frame - s) / d));
  const r = rng(seed);
  const undoOffsets = Array.from({length: 20}, () => r() * 5);
  const undo = (k: number) => (implode ? 1 - clamp((frame - impStart - undoOffsets[k % 20]) / 5) : 1);

  const arcPt = (a: Arc, t: number): [number, number] => {
    const ang = lerp(a.a0, a.a1, t);
    return [a.cx + R * Math.cos(ang), a.cy + R * Math.sin(ang)];
  };
  const arcD = (a: Arc) => {
    const [x0, y0] = arcPt(a, 0);
    let d = `M ${x0} ${y0}`;
    for (let k = 1; k <= 4; k++) {
      const [x, y] = arcPt(a, k / 4);
      d += ` A ${R} ${R} 0 0 1 ${x} ${y}`;
    }
    return d;
  };

  // current compass job
  const sweep = (t: number) => t; // near-linear like the source
  let job: {pivot: [number, number]; tip: [number, number]; vis: number} | null = null;
  const arcs = [circle, ...petals];
  for (const a of arcs) {
    const t = clamp((frame - a.s) / a.d);
    const vis = Math.min(prog(frame, a.s - 5, a.s, ease.out), 1 - prog(frame, a.s + a.d, a.s + a.d + 5, ease.in));
    if (vis > 0 && (!job || frame >= a.s - 3)) job = {pivot: [a.cx, a.cy], tip: arcPt(a, sweep(t)), vis};
  }
  if (frame >= circle.s + circle.d + 1 && frame < petals[0].s - 4) job = null;

  // hexagon ruler tip
  let rulerTip: [number, number] | null = null;
  for (const sg of hex) {
    const t = clamp((frame - sg.s) / sg.d);
    if (t > 0 && t < 1) rulerTip = [lerp(sg.x0, sg.x1, t), lerp(sg.y0, sg.y1, t)];
  }

  const strengthen = prog(frame, hexStart + 22, hexStart + 28, ease.out);
  const glow = 0.5 + 0.5 * Math.sin(frame * 0.18);

  // implode group transform
  const imp = implode ? prog(frame, impStart, impEnd, (t) => t * t * t) : 0;
  const settle = prog(frame, hexStart + 30, impStart, ease.sine);
  const rot = -60 * imp + 6 * settle;
  const sc = lerp(1, 0.1, imp);
  const groupOpacity = implode ? 1 - prog(frame, impEnd, impEnd + 3) : 1;
  const point = implode ? Math.min(prog(frame, impEnd - 3, impEnd), 1 - prog(frame, impEnd + 2, D - 1, ease.in)) : 0;

  const thin = 1.6 * u;
  const lineEl = (sg: Seg, k: number, color: string, sw: number) => (
    <path key={k} d={`M ${sg.x0} ${sg.y0} L ${sg.x1} ${sg.y1}`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" {...dash1(p(sg.s, sg.d) * undo(k))} />
  );

  const Compass = () => {
    if (!showCompass || !job) return null;
    const [px, py] = job.pivot;
    const [tx, ty] = job.tip;
    const dx = tx - px;
    const dy = ty - py;
    const d = Math.hypot(dx, dy) || 1;
    const L = R * 0.82;
    const H = Math.sqrt(Math.max(0, L * L - (d / 2) * (d / 2)));
    const nx = dy / d;
    const ny = -dx / d;
    const hx = px + dx / 2 + nx * H;
    const hy = py + dy / 2 + ny * H;
    return (
      <g opacity={job.vis}>
        <line x1={px} y1={py} x2={tx} y2={ty} stroke={compassColor} strokeWidth={1 * u} opacity={0.45} />
        <line x1={hx} y1={hy} x2={px} y2={py} stroke={compassColor} strokeWidth={4 * u} strokeLinecap="round" />
        <line x1={hx} y1={hy} x2={tx} y2={ty} stroke={compassColor} strokeWidth={4 * u} strokeLinecap="round" />
        <line x1={hx} y1={hy} x2={hx + nx * 34 * u} y2={hy + ny * 34 * u} stroke={compassColor} strokeWidth={6 * u} strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={8 * u} fill={background} stroke={compassColor} strokeWidth={2.5 * u} />
        <circle cx={px} cy={py} r={4 * u} fill={nodeColor} />
        <TipDot x={tx} y={ty} r={3.2 * u} color="#FFFFFF" glow={lineColor} />
      </g>
    );
  };

  const vesD = (rx: number, ry: number) => `M ${cx} ${cy - ry} Q ${cx + rx * 2} ${cy} ${cx} ${cy + ry} Q ${cx - rx * 2} ${cy} ${cx} ${cy - ry}`;

  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 52%, rgba(117,137,203,0.10) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.35) 100%)`}} />
      <Svg>
        <defs>
          <filter id="cc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={4 * u} />
          </filter>
        </defs>
        <g transform={`rotate(${rot} ${cx} ${cy}) translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`} opacity={groupOpacity}>
          {lineEl(radiusLine, 0, compassColor, 1 * u)}
          <path d={arcD(circle)} fill="none" stroke={lineColor} strokeWidth={thin} strokeOpacity={0.9} {...dash1(p(circle.s, circle.d) * undo(1))} />
          {petals.map((a, i) => (
            <path key={i} d={arcD(a)} fill="none" stroke={lineColor} strokeWidth={thin} strokeOpacity={0.9} {...dash1(p(a.s, a.d, ease.inOut) * undo(2 + i))} />
          ))}
          {vesica && (
            <>
              <path d={vesD(R * 0.25, R * 0.95)} fill="none" stroke={lineColor} strokeWidth={thin} {...dash1(p(vesStart, 12, ease.inOut) * undo(14))} />
              <path d={vesD(R * 0.12, R * 0.62)} fill="none" stroke={lineColor} strokeWidth={thin} {...dash1(p(vesStart + 5, 12, ease.inOut) * undo(15))} />
            </>
          )}
          <g filter="url(#cc-glow)" opacity={0.55 * strengthen}>
            {hex.map((sg, i) => lineEl(sg, 30 + i, hexColor, 4 * u))}
          </g>
          {hex.map((sg, i) => lineEl(sg, 8 + i, hexColor, lerp(2.2, 3.4, strengthen) * u))}
          {rulerTip && <TipDot x={rulerTip[0]} y={rulerTip[1]} r={3.5 * u} glow={hexColor} />}
          {Array.from({length: 6}, (_, i) => {
            const [x, y] = P(i);
            const g = prog(frame, hexStart + 20 + i, hexStart + 26 + i, ease.back);
            return g > 0 ? (
              <g key={i}>
                <circle cx={x} cy={y} r={3 * u * g} fill="#FFFFFF" />
                <Sparkle x={x} y={y} size={(12 + 4 * glow) * u * g} color="#E6ECFF" rotate={45 * g} opacity={0.9} />
              </g>
            ) : null;
          })}
          <Sparkle x={cx} y={cy} size={(14 + 4 * glow) * u * prog(frame, 0, 6, ease.back)} color={nodeColor} />
          {vesica &&
            [-1, 1].map((sgn) => {
              const g = prog(frame, vesStart + 12, vesStart + 18, ease.back);
              return g > 0 ? (
                <g key={sgn}>
                  <circle cx={cx} cy={cy + sgn * 0.09 * R} r={9 * u * g} fill={nodeColor} opacity={0.25} />
                  <circle cx={cx} cy={cy + sgn * 0.09 * R} r={4.5 * u * g} fill={nodeColor} />
                  <Sparkle x={cx} y={cy + sgn * 0.09 * R} size={(16 + 6 * glow) * u * g} color={nodeColor} rotate={sgn * 20} />
                </g>
              ) : null;
            })}
          {Compass()}
        </g>
        {point > 0 && (
          <g>
            <circle cx={cx} cy={cy} r={26 * u} fill={nodeColor} opacity={0.18 * point} />
            <circle cx={cx} cy={cy} r={6 * u * point} fill="#FFF4D8" />
            <Sparkle x={cx} y={cy} size={30 * u * point} color={nodeColor} />
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const compassConstruct = defineMotion<Props>({
  id: 'compass-construct',
  title: 'Compass geometry construct',
  category: 'shape',
  description: 'A drafting compass sweeps a circle and the six Seed-of-Life petals, a ruler draws the hexagon with a bright tip, nodes glint, then the construction spins and implodes to a point.',
  source: ['video6 0:02.00-0:03.15', 'video6 0:51.3-0:53.2'],
  useFor: 'Sacred-geometry / "first principles" / "how it is built" openers, logo construction, a geometric intro or outro.',
  durationInFrames: 150,
  defaultProps: {
    background: '#180F0B',
    lineColor: '#7589CB',
    hexColor: '#C9D1F5',
    nodeColor: '#F6C886',
    compassColor: '#E9E0D5',
    radius: 0.27,
    speed: 1,
    showCompass: true,
    vesica: true,
    implode: true,
    seed: 6,
  },
  propDocs: {
    lineColor: 'construction lines (circle, petals, vesica)',
    hexColor: 'hexagon edges',
    nodeColor: 'gold centre / node glints',
    compassColor: 'compass legs and radius line',
    radius: 'circle radius as a fraction of the short side',
    speed: 'time multiplier (2 = twice as fast, like the source)',
    showCompass: 'show the compass arms + pivot while arcs are drawn',
    vesica: 'add the vertical vesica lens and two gold nodes',
    implode: 'end by spinning -60 deg, shrinking and un-drawing into a point',
  },
  component: withPortraitFit(CompassConstruct, {s: 1.5}),
  tags: ['geometry', 'compass', 'construction', 'hexagon', 'sacred', 'outro'],
});
