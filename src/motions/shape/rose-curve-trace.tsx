import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video17 17.9-20.8 s `rose-curve-trace` + `petal-zoom-wipe`: a red ball swings like a pendulum (dotted
 * string + pivot shown) tracing petal loops one by one, leaving a thin black outline; after the last petal
 * the flower fills pink with an offset echo, then scales past the camera (1 -> 8, easeInCubic, +35 deg) with
 * ghost outlines and the petal colour becomes the new background.
 */
type Props = {
  background: string;
  ballColor: string;
  lineColor: string;
  fillColor: string;
  echoColor: string;
  petals: number;
  radius: number;
  framesPerPetal: number;
  zoomWipe: boolean;
  number: string;
  title: string;
};

const sineInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));

const RoseCurveTrace: React.FC<Props> = ({background, ballColor, lineColor, fillColor, echoColor, petals, radius, framesPerPetal, zoomWipe, number, title}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, durationInFrames, portrait} = useStage();
  const N = Math.max(2, Math.round(petals));
  const R = radius * Math.min(w, h);
  const s = R * 0.19; // lens half-width (sagitta)
  const rho = (R * R) / 4 / (2 * s) + s / 2;
  const t0 = 8;
  const traceEnd = t0 + N * framesPerPetal;
  const fillT = prog(frame, traceEnd + 2, traceEnd + 8, ease.out);
  const zStart = durationInFrames - 26;
  const z = zoomWipe ? prog(frame, zStart, zStart + 12, (t) => t * t * t) : 0;
  const zScale = lerp(1, 8, z);
  const zRot = 35 * z + 6 * prog(frame, traceEnd, zStart + 12, ease.sine);
  const bgPink = zoomWipe ? prog(frame, zStart + 9, zStart + 13, ease.out) : 0;

  // geometry per petal
  const geo = Array.from({length: N}, (_, p) => {
    const phi = -Math.PI / 2 + (p / N) * Math.PI * 2;
    const dx = Math.cos(phi);
    const dy = Math.sin(phi);
    const nx = -dy;
    const ny = dx;
    const mx = cx + dx * R * 0.5;
    const my = cy + dy * R * 0.5;
    const tip = [cx + dx * R, cy + dy * R] as const;
    // arc 1 bulges +n (out), arc 2 bulges -n (back)
    const p1 = [mx - nx * (rho - s), my - ny * (rho - s)] as const;
    const p2 = [mx + nx * (rho - s), my + ny * (rho - s)] as const;
    const angOf = (c: readonly [number, number], x: number, y: number) => Math.atan2(y - c[1], x - c[0]);
    let a1s = angOf(p1, cx, cy);
    let a1e = angOf(p1, tip[0], tip[1]);
    let a2s = angOf(p2, tip[0], tip[1]);
    let a2e = angOf(p2, cx, cy);
    const norm = (a: number, b: number) => {
      let d = b - a;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return a + d;
    };
    a1e = norm(a1s, a1e);
    a2e = norm(a2s, a2e);
    const pt = (half: 0 | 1, t: number) => {
      const c = half ? p2 : p1;
      const a = half ? lerp(a2s, a2e, t) : lerp(a1s, a1e, t);
      return [c[0] + Math.cos(a) * rho, c[1] + Math.sin(a) * rho] as const;
    };
    const outline = (k: number) => {
      const pts: string[] = [];
      for (let i = 0; i <= k; i++) {
        const t = i / k;
        const [x, y] = t <= 0.5 ? pt(0, t * 2) : pt(1, (t - 0.5) * 2);
        pts.push(`${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      return pts.join(' ');
    };
    return {pt, p1, p2, outline, full: outline(80) + ' Z'};
  });

  // ball state
  const ballAt = (f: number) => {
    const k = (f - t0) / framesPerPetal;
    if (k < 0) return {x: cx, y: cy, petal: -1, local: 0};
    if (k >= N) return {x: cx, y: cy, petal: N, local: 0};
    const p = Math.floor(k);
    const local = k - p;
    const half = local < 0.5 ? 0 : 1;
    const t = sineInOut(half ? (local - 0.5) * 2 : local * 2);
    const [x, y] = geo[p].pt(half as 0 | 1, t);
    return {x, y, petal: p, local};
  };
  const b = ballAt(frame);
  const bPrev = ballAt(frame - 1);
  const vx = b.x - bPrev.x;
  const vy = b.y - bPrev.y;
  const speed = Math.hypot(vx, vy);
  const stretch = clamp(speed / (60 * u), 0, 0.55);
  const vAng = (Math.atan2(vy, vx) * 180) / Math.PI;
  const ballR = 34 * u * (1 + 0.15 * Math.sin(Math.PI * prog(frame, traceEnd, traceEnd + 8)));

  // trail progress per petal
  const trailP = (p: number) => clamp((frame - t0 - p * framesPerPetal) / framesPerPetal);
  const partial = (p: number, tp: number) => {
    if (tp <= 0) return '';
    const half = tp < 0.5 ? 0 : 1;
    const tt = sineInOut(half ? (tp - 0.5) * 2 : tp * 2);
    const n = 40;
    const pts: string[] = [];
    // first arc
    const lim1 = half ? 1 : tt;
    for (let i = 0; i <= n; i++) {
      const [x, y] = geo[p].pt(0, (i / n) * lim1);
      pts.push(`${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    if (half) for (let i = 1; i <= n; i++) {
      const [x, y] = geo[p].pt(1, (i / n) * tt);
      pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const pivot = b.petal >= 0 && b.petal < N ? (b.local < 0.5 ? geo[b.petal].p1 : geo[b.petal].p2) : null;
  const pivotVis = Math.min(prog(frame, t0 - 4, t0 + 2), 1 - prog(frame, traceEnd - 2, traceEnd + 6));

  const flower = (opacity = 1, strokeOnly = false, sw = 2.5 * u) =>
    geo.map((g, p) => <path key={p} d={g.full} fill={strokeOnly ? 'none' : fillColor} stroke={lineColor} strokeWidth={sw} strokeLinejoin="round" opacity={opacity} />);

  const tf = `translate(${cx} ${cy}) rotate(${zRot}) scale(${zScale}) translate(${-cx} ${-cy})`;
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        {/* faint pendulum circles + guide */}
        <g opacity={0.25 * (1 - fillT * 0.6) * (1 - z)}>
          {geo.map((g, p) =>
            trailP(p) > 0 ? (
              <g key={p}>
                <circle cx={g.p1[0]} cy={g.p1[1]} r={rho} fill="none" stroke={lineColor} strokeWidth={1 * u} strokeDasharray={`${2 * u} ${6 * u}`} />
                <circle cx={g.p1[0]} cy={g.p1[1]} r={4 * u} fill={lineColor} />
              </g>
            ) : null,
          )}
        </g>
        <g transform={tf}>
          {/* echo + fill */}
          {fillT > 0 &&
            [3, 2, 1].map((k) => (
              <g key={k} transform={`translate(${k * 7 * u * fillT} ${k * 7 * u * fillT})`} opacity={0.35 * fillT}>
                {geo.map((g, p) => (
                  <path key={p} d={g.full} fill="none" stroke={echoColor} strokeWidth={1.5 * u} />
                ))}
              </g>
            ))}
          {fillT > 0 && flower(fillT)}
          {/* ghost zoom-blur outlines */}
          {z > 0 &&
            Array.from({length: 6}, (_, k) => (
              <g key={k} transform={`translate(${cx} ${cy}) scale(${Math.pow(0.92, k + 1)}) translate(${-cx} ${-cy})`} opacity={0.35 * (1 - k / 6) * Math.sin(Math.PI * z)}>
                {flower(1, false, 1.2 * u)}
              </g>
            ))}
          {/* traced outlines */}
          {geo.map((g, p) => {
            const tp = trailP(p);
            if (tp <= 0) return null;
            const d = tp >= 1 ? g.full : partial(p, tp);
            return (
              <g key={p}>
                <path d={d} fill="none" stroke={lineColor} strokeWidth={2.5 * u} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={lineColor} strokeWidth={6 * u} strokeLinecap="round" strokeDasharray={`0.1 ${22 * u}`} opacity={1 - fillT} />
              </g>
            );
          })}
        </g>
        {/* pendulum string */}
        {pivot && pivotVis > 0 && (
          <g opacity={pivotVis}>
            <line x1={pivot[0]} y1={pivot[1]} x2={b.x} y2={b.y} stroke={lineColor} strokeWidth={1.6 * u} strokeDasharray={`${3 * u} ${5 * u}`} />
            <circle cx={pivot[0]} cy={pivot[1]} r={6 * u} fill={background} stroke={lineColor} strokeWidth={2 * u} />
            <line x1={pivot[0] - 12 * u} y1={pivot[1]} x2={pivot[0] + 12 * u} y2={pivot[1]} stroke={lineColor} strokeWidth={1.2 * u} />
            <line x1={pivot[0]} y1={pivot[1] - 12 * u} x2={pivot[0]} y2={pivot[1] + 12 * u} stroke={lineColor} strokeWidth={1.2 * u} />
          </g>
        )}
        {bgPink > 0 && <rect width={w} height={h} fill={fillColor} opacity={bgPink} />}
        {/* ball with smear */}
        {[3, 2, 1].map((k) => {
          const g = ballAt(frame - k * 0.6);
          return stretch > 0.05 ? <circle key={k} cx={g.x} cy={g.y} r={ballR * (1 - k * 0.08)} fill={ballColor} opacity={0.18} /> : null;
        })}
        <ellipse cx={b.x} cy={b.y} rx={ballR * (1 + stretch)} ry={ballR * (1 - stretch * 0.45)} fill={ballColor} transform={`rotate(${vAng} ${b.x} ${b.y})`} />
      </Svg>
      {(number || title) && (
        <div style={{position: 'absolute', left: 0.045 * w, bottom: (portrait ? 0.06 : 0.07) * h, display: 'flex', alignItems: 'baseline', gap: 18 * u, opacity: prog(frame, 0, 10, ease.out)}}>
          {number && <span style={{fontFamily: fonts.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 92 * u, color: ballColor, lineHeight: 1}}>{number}</span>}
          {title && <span style={{fontFamily: fonts.display, fontSize: 56 * u, color: lineColor, letterSpacing: 1 * u, lineHeight: 1}}>{title}</span>}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const roseCurveTrace = defineMotion<Props>({
  id: 'rose-curve-trace',
  title: 'Rose-curve pendulum trace',
  category: 'shape',
  description: 'A red ball swings on a dotted pendulum string tracing petal loops; the outlines complete into a flower that fills pink, then zooms past camera and its colour becomes the background.',
  source: ['video17 0:17.9-0:20.8'],
  useFor: 'Decorative parametric drawing (flower, spirograph, loader), "natural motion follows arcs", a chapter transition.',
  durationInFrames: 150,
  defaultProps: {
    background: '#F5CA1E',
    ballColor: '#ED3821',
    lineColor: '#0B0D0C',
    fillColor: '#F7A7CC',
    echoColor: '#888578',
    petals: 6,
    radius: 0.3,
    framesPerPetal: 15,
    zoomWipe: true,
    number: '07',
    title: 'ARCS',
  },
  propDocs: {
    petals: 'number of petal loops traced',
    radius: 'petal length as a fraction of the short side',
    framesPerPetal: 'frames per petal loop (pendulum swing out and back)',
    fillColor: 'petal fill, and the background after the zoom wipe',
    echoColor: 'offset echo outlines under the filled flower',
    zoomWipe: 'end with the flower scaling past the camera into a full pink frame',
    number: 'chapter number label ("" to hide)',
    title: 'chapter title label ("" to hide)',
  },
  component: RoseCurveTrace,
  tags: ['pendulum', 'flower', 'trace', 'arc', 'transition', 'principles'],
});
