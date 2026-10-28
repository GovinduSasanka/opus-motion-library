import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {compileExpr, rgbaStr} from '../../core/r2-pr3-kit';

/**
 * Function plot (maths-explainer look): axes draw on, a curve traces left to right with a glowing head, a tangent
 * (or a shrinking secant that becomes the tangent) slides along it with a slope readout, Riemann bars melt into a
 * filled area with its integral. fn is parsed by a tiny safe parser (no eval); or pass points[] directly.
 */
type Props = {
  fn: string;
  points: [number, number][];
  domain: [number, number];
  range: [number, number] | null;
  tangentMode: 'tangent' | 'secant' | 'none';
  tangentFrom: number;
  tangentTo: number;
  fillArea: [number, number] | null;
  riemann: number;
  title: string;
  xLabel: string;
  yLabel: string;
  showGrid: boolean;
  background: string;
  ink: string;
  curveColor: string;
  tangentColor: string;
  areaColor: string;
};

const FunctionPlot: React.FC<Props> = ({fn, points, domain, range, tangentMode, tangentFrom, tangentTo, fillArea, riemann, title, xLabel, yLabel, showGrid, background, ink, curveColor, tangentColor, areaColor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = useMemo(() => {
    if (points && points.length > 1) {
      const pts = [...points].sort((a, b) => a[0] - b[0]);
      return (x: number) => {
        if (x <= pts[0][0]) return pts[0][1];
        for (let i = 1; i < pts.length; i++)
          if (x <= pts[i][0]) {
            const t = (x - pts[i - 1][0]) / Math.max(1e-9, pts[i][0] - pts[i - 1][0]);
            return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
          }
        return pts[pts.length - 1][1];
      };
    }
    return compileExpr(fn);
  }, [fn, points]);
  const [x0, x1] = domain;
  const N = 260;
  const samples = useMemo(() => Array.from({length: N + 1}, (_, i) => f(x0 + ((x1 - x0) * i) / N)), [f, x0, x1]);
  const [y0, y1] = useMemo(() => {
    if (range) return range;
    const v = samples.filter((s) => Number.isFinite(s));
    const lo = Math.min(...v, 0);
    const hi = Math.max(...v, 0);
    const pad = (hi - lo) * 0.14 || 1;
    return [lo - pad, hi + pad] as [number, number];
  }, [range, samples]);

  // plot rectangle
  const L = (portrait ? 0.12 : 0.09) * w;
  const R = w - (portrait ? 0.07 : 0.07) * w;
  const T = h * (portrait ? 0.24 : 0.2);
  const B = h * (portrait ? 0.82 : 0.86);
  const X = (x: number) => L + ((x - x0) / (x1 - x0)) * (R - L);
  const Y = (y: number) => B - ((y - y0) / (y1 - y0)) * (B - T);
  const axX = Y(clamp0(0, y0, y1));
  const axY = X(clamp0(0, x0, x1));

  const axisT = prog(frame, 0, 14, ease.out);
  const traceT = prog(frame, 14, 62, ease.inOut);
  const nTrace = Math.floor(traceT * N);
  const pathAt = (a: number, b: number) => {
    let d = '';
    let pen = false;
    for (let i = a; i <= b; i++) {
      const y = samples[i];
      if (!Number.isFinite(y)) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${X(x0 + ((x1 - x0) * i) / N).toFixed(1)} ${Y(y).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  const curve = pathAt(0, nTrace);
  const hx = x0 + (x1 - x0) * (nTrace / N);
  const hy = f(hx);

  // tangent / secant
  const slideT = prog(frame, 78, 150, ease.inOut);
  const tx = tangentFrom + (tangentTo - tangentFrom) * slideT;
  const dx = (x1 - x0) * 0.0015;
  const slope = (f(tx + dx) - f(tx - dx)) / (2 * dx);
  const showTan = tangentMode !== 'none' && frame >= 66;
  const tanIn = prog(frame, 66, 78, ease.out);
  const secH = tangentMode === 'secant' ? Math.max(0.0, (1 - prog(frame, 66, 96, ease.inOut)) * (x1 - x0) * 0.28) : 0;
  const sx2 = tx + Math.max(secH, 1e-3);
  const secSlope = (f(sx2) - f(tx)) / (sx2 - tx);
  const useSlope = tangentMode === 'secant' ? secSlope : slope;
  const lineHalf = (x1 - x0) * 0.2;
  const ty = f(tx);

  // area
  const fa = fillArea ?? [x0 + (x1 - x0) * 0.3, x1 - (x1 - x0) * 0.2];
  const doFill = fillArea !== null || false;
  const fillT = prog(frame, 156, 210, ease.inOut);
  const barsT = prog(frame, 150, 168, ease.out) * (1 - prog(frame, 190, 214, ease.inOut));
  const area = useMemo(() => {
    const a = fa[0];
    const b = fa[1];
    const n = 400;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const xm = a + ((b - a) * (i + 0.5)) / n;
      const v = f(xm);
      if (Number.isFinite(v)) s += v * ((b - a) / n);
    }
    return s;
  }, [f, fa[0], fa[1]]);
  const areaX1 = fa[0] + (fa[1] - fa[0]) * fillT;
  let areaPath = '';
  if (doFill && fillT > 0) {
    const m = 80;
    areaPath = `M${X(fa[0]).toFixed(1)} ${Y(0).toFixed(1)}`;
    for (let i = 0; i <= m; i++) {
      const x = fa[0] + ((areaX1 - fa[0]) * i) / m;
      const v = f(x);
      areaPath += `L${X(x).toFixed(1)} ${Y(Number.isFinite(v) ? v : 0).toFixed(1)}`;
    }
    areaPath += `L${X(areaX1).toFixed(1)} ${Y(0).toFixed(1)}Z`;
  }
  const bars: React.ReactNode[] = [];
  if (doFill && riemann > 0 && barsT > 0.01) {
    for (let i = 0; i < riemann; i++) {
      const a = fa[0] + ((fa[1] - fa[0]) * i) / riemann;
      const b = fa[0] + ((fa[1] - fa[0]) * (i + 1)) / riemann;
      const v = f((a + b) / 2);
      if (!Number.isFinite(v)) continue;
      const grow = prog(frame, 150 + i * 1.2, 164 + i * 1.2, ease.out);
      bars.push(<rect key={i} x={X(a)} y={Math.min(Y(0), Y(v * grow))} width={X(b) - X(a) - 1.5 * u} height={Math.abs(Y(0) - Y(v * grow))} fill={rgbaStr(areaColor, 0.42 * barsT)} stroke={rgbaStr(areaColor, 0.9 * barsT)} strokeWidth={1.2 * u} />);
    }
  }

  // ticks
  const span = x1 - x0;
  const step = span > 14 ? 2 : span > 6 ? 1 : 0.5;
  const xt: number[] = [];
  for (let v = Math.ceil(x0 / step) * step; v <= x1 + 1e-6; v += step) xt.push(Math.round(v * 100) / 100);
  const yspan = y1 - y0;
  const ystep = yspan > 14 ? 2 : yspan > 6 ? 1 : yspan > 3 ? 0.5 : 0.25;
  const yt: number[] = [];
  for (let v = Math.ceil(y0 / ystep) * ystep; v <= y1 + 1e-6; v += ystep) yt.push(Math.round(v * 100) / 100);
  const fs = (portrait ? 36 : 24) * u;
  const num = (v: number) => (Math.abs(v) < 1e-9 ? '0' : Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, ''));
  const uid = 'fplot';
  const titleIn = prog(frame, 10, 36, ease.out);
  const readIn = prog(frame, 92, 108, ease.out);
  const areaReadIn = prog(frame, 196, 216, ease.out);
  const bx = X(tx);
  const by = Y(ty);

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <clipPath id={`${uid}-clip`}>
            <rect x={L} y={T - 8 * u} width={R - L} height={B - T + 16 * u} />
          </clipPath>
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={6 * u} />
          </filter>
        </defs>
        {showGrid &&
          xt.map((v) => <line key={`gx${v}`} x1={X(v)} x2={X(v)} y1={T} y2={B} stroke={rgbaStr(ink, 0.07)} strokeWidth={1.2 * u} opacity={axisT} />)}
        {showGrid &&
          yt.map((v) => <line key={`gy${v}`} x1={L} x2={R} y1={Y(v)} y2={Y(v)} stroke={rgbaStr(ink, 0.07)} strokeWidth={1.2 * u} opacity={axisT} />)}
        {/* axes */}
        <line x1={L} x2={L + (R - L) * axisT} y1={axX} y2={axX} stroke={rgbaStr(ink, 0.8)} strokeWidth={2.4 * u} strokeLinecap="round" />
        <line x1={axY} x2={axY} y1={B} y2={B - (B - T) * axisT} stroke={rgbaStr(ink, 0.8)} strokeWidth={2.4 * u} strokeLinecap="round" />
        {xt.map((v) => (
          <g key={`tx${v}`} opacity={axisT}>
            <line x1={X(v)} x2={X(v)} y1={axX - 6 * u} y2={axX + 6 * u} stroke={rgbaStr(ink, 0.7)} strokeWidth={2 * u} />
            {Math.abs(v) > 1e-9 && (
              <text x={X(v)} y={axX + (portrait ? 44 : 34) * u} fontSize={fs * 0.8} fill={rgbaStr(ink, 0.6)} textAnchor="middle" fontFamily={fonts.mono}>
                {num(v)}
              </text>
            )}
          </g>
        ))}
        {yt.map((v) => (
          <g key={`ty${v}`} opacity={axisT}>
            <line x1={axY - 6 * u} x2={axY + 6 * u} y1={Y(v)} y2={Y(v)} stroke={rgbaStr(ink, 0.7)} strokeWidth={2 * u} />
            {Math.abs(v) > 1e-9 && (
              <text x={axY - 14 * u} y={Y(v) + 7 * u} fontSize={fs * 0.8} fill={rgbaStr(ink, 0.6)} textAnchor="end" fontFamily={fonts.mono}>
                {num(v)}
              </text>
            )}
          </g>
        ))}
        <text x={R} y={axX - 14 * u} fontSize={fs} fill={rgbaStr(ink, 0.75)} textAnchor="end" fontFamily={fonts.serif} fontStyle="italic" opacity={axisT}>
          {xLabel}
        </text>
        <text x={axY + 14 * u} y={T - 6 * u} fontSize={fs} fill={rgbaStr(ink, 0.75)} fontFamily={fonts.serif} fontStyle="italic" opacity={axisT}>
          {yLabel}
        </text>

        <g clipPath={`url(#${uid}-clip)`}>
          {areaPath && <path d={areaPath} fill={rgbaStr(areaColor, 0.4)} stroke={areaColor} strokeWidth={1.5 * u} />}
          {bars}
          {/* curve + glow */}
          {curve && <path d={curve} fill="none" stroke={curveColor} strokeWidth={14 * u} opacity={0.28} filter={`url(#${uid}-glow)`} strokeLinecap="round" strokeLinejoin="round" />}
          {curve && <path d={curve} fill="none" stroke={curveColor} strokeWidth={5 * u} strokeLinecap="round" strokeLinejoin="round" />}
          {/* tangent / secant */}
          {showTan && (
            <g opacity={tanIn}>
              <line
                x1={X(tx - lineHalf)}
                y1={Y(ty - useSlope * lineHalf)}
                x2={X(tx + lineHalf)}
                y2={Y(ty + useSlope * lineHalf)}
                stroke={tangentColor}
                strokeWidth={3.6 * u}
                strokeLinecap="round"
              />
              {tangentMode === 'secant' && secH > 0.02 && (
                <>
                  <circle cx={X(sx2)} cy={Y(f(sx2))} r={7 * u} fill={background} stroke={tangentColor} strokeWidth={3 * u} />
                </>
              )}
              <circle cx={bx} cy={by} r={9 * u} fill={tangentColor} />
            </g>
          )}
        </g>
        {/* trace head */}
        {traceT < 1 && Number.isFinite(hy) && (
          <>
            <circle cx={X(hx)} cy={Y(hy)} r={20 * u} fill={curveColor} opacity={0.3} filter={`url(#${uid}-glow)`} />
            <circle cx={X(hx)} cy={Y(hy)} r={8 * u} fill="#fff" />
          </>
        )}
        {/* title */}
        <text x={L} y={T - 52 * u} fontSize={(portrait ? 44 : 52) * u} fill={ink} fontFamily={fonts.serif} fontWeight={700} opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * 14 * u})`}>
          {title}
        </text>
        {/* slope readout */}
        {tangentMode !== 'none' && (
          <g opacity={readIn} transform={`translate(${R} ${T - 52 * u})`}>
            <text textAnchor="end" fontSize={34 * u} fill={tangentColor} fontFamily={fonts.mono} fontWeight={700}>
              {tangentMode === 'secant' && secH > 0.02 ? 'secant' : 'slope'} = {useSlope.toFixed(2)}
            </text>
          </g>
        )}
        {doFill && (
          <text x={R} y={B + 80 * u} textAnchor="end" fontSize={34 * u} fill={areaColor} fontFamily={fonts.mono} fontWeight={700} opacity={areaReadIn}>
            area = {(area * fillT).toFixed(2)}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

const clamp0 = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const functionPlot = defineMotion<Props>({
  id: 'function-plot',
  title: 'Function plot (curve, tangent, area)',
  category: 'data',
  description:
    'Maths-explainer plot on dark slate: axes draw on, a curve from a safe expression string traces left to right with a glowing head, a tangent (or a secant that shrinks into the tangent) slides along it with a slope readout, then Riemann bars melt into a filled area with a running integral.',
  source: ['prompt-corpus research: function-plot (16 cases, ideas only; original implementation)'],
  useFor: 'Maths and physics teaching, finance curves, "explain the formula" and derivative / integral explainers.',
  durationInFrames: 240,
  defaultProps: {
    fn: 'sin(x) + x/3',
    points: [],
    domain: [-6, 6],
    range: null,
    tangentMode: 'secant',
    tangentFrom: -4.6,
    tangentTo: 3.2,
    fillArea: [-1, 4],
    riemann: 10,
    title: 'f(x) = sin x + x/3',
    xLabel: 'x',
    yLabel: 'f(x)',
    showGrid: true,
    background: '#1C1C1C',
    ink: '#F2F2F2',
    curveColor: '#58C4DD',
    tangentColor: '#FFFF00',
    areaColor: '#83C167',
  },
  propDocs: {
    fn: 'expression in x: + - * / ^, sin cos tan exp ln sqrt abs, pi, e, implicit "2x"',
    points: 'optional [[x,y],...] data instead of fn (linearly interpolated)',
    domain: 'x range [min, max]',
    range: 'y range [min, max]; null = auto from the curve',
    tangentMode: "'tangent' | 'secant' (shrinking h) | 'none'",
    tangentFrom: 'x where the tangent starts sliding',
    tangentTo: 'x where it stops',
    fillArea: '[a, b] integral to fill, or null for none',
    riemann: 'number of Riemann bars that melt into the area (0 = none)',
    title: 'formula caption (top left)',
    xLabel: 'x axis label',
    yLabel: 'y axis label',
    showGrid: 'faint grid',
    background: 'background colour',
    ink: 'axes / text colour',
    curveColor: 'curve colour',
    tangentColor: 'tangent / readout colour',
    areaColor: 'area colour',
  },
  component: FunctionPlot,
  tags: ['graph', 'plot', 'function', 'math', 'maths', 'calculus', 'derivative', 'tangent', 'integral', 'area under curve', 'axes', 'explainer', 'education', 'physics', '3b1b', 'formula', 'riemann', 'curve'],
});
