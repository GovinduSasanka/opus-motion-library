// Adapted from lemo-opuscar/styles/microgame/demo/glpass.js `crayon` (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {TAU, cl, h1, lf, lerp, sstep} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * microgame crayon pass: a kid's crayon drawing. Every stroke carries a pressure (its alpha); an SVG filter deposits wax
 * only where a procedural paper tooth (fine grain + a stretched octave) is below the pressure — `tooth > 1 - 1.22*pressure`
 * — so light strokes skip over the grain and heavy ones fill in. Hatching zig-zags past the lines, the paper grain is
 * embossed lit from the top-left, and the indigo wobbly outlines boil on twos (8 fps stepping).
 */
type Props = {
  text: string;
  paper: string;
  outline: string;
  crayons: string[];
  pressure: number;
  boil: number;
  tooth: number;
  emboss: number;
  seed: number;
};

type P2 = [number, number];
const circlePts = (cx: number, cy: number, r: number, n = 40): P2[] => Array.from({length: n}, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r]);
const rectPts = (x: number, y: number, w: number, h: number): P2[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
const resample = (pts: P2[], closed: boolean, step: number): P2[] => {
  const out: P2[] = [];
  const n = pts.length;
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.round(L / step));
    for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
};
const dOf = (pts: P2[], close = false) => 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L') + (close ? 'Z' : '');
const wob = (pts: P2[], amp: number, step: number, seed: number): P2[] => pts.map((q, i) => [q[0] + (h1(i, step, seed) - 0.5) * 2 * amp, q[1] + (h1(i, step, seed + 7) - 0.5) * 2 * amp]);
const centroid = (pts: P2[]): P2 => [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];
const inflate = (pts: P2[], k: number): P2[] => {
  const c = centroid(pts);
  return pts.map((q) => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k]);
};
/** continuous zig-zag across a polygon's bbox at an angle */
const zigzag = (pts: P2[], deg: number, sp: number, step: number, seed: number): P2[] => {
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const C: P2 = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + sp;
  const a = (deg * Math.PI) / 180;
  const d: P2 = [Math.cos(a), Math.sin(a)];
  const n: P2 = [-d[1], d[0]];
  const out: P2[] = [];
  let k = 0;
  for (let o = -R; o <= R; o += sp, k++) {
    const j0 = (h1(k, step, seed) - 0.5) * sp * 0.5;
    const j1 = (h1(k, step, seed + 3) - 0.5) * sp * 0.5;
    const p0: P2 = [C[0] + n[0] * o - d[0] * (R + j0), C[1] + n[1] * o - d[1] * (R + j0)];
    const p1: P2 = [C[0] + n[0] * (o + sp * 0.3) + d[0] * (R + j1), C[1] + n[1] * (o + sp * 0.3) + d[1] * (R + j1)];
    if (k % 2) out.push(p1, p0);
    else out.push(p0, p1);
  }
  return out;
};

type Shape = {key: string; pts: P2[]; color: string; angle: number; sp: number; pr: number; t0: number; dur: number; lineOnly?: boolean; open?: P2[]};

const CrayonPressure: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const id = `crayon-${p.seed}`;
  const step = Math.floor((frame * p.boil) / 30);
  const sc = Math.min(w / 1500, h / 1100) * 0.98;
  const ox = (w - 1500 * sc) / 2;
  const oy = (h - 1100 * sc) / 2;
  const C = p.crayons.length >= 8 ? p.crayons : ['#F6C21A', '#F08A24', '#E0453A', '#4FA24A', '#2F7A3D', '#3F7FD6', '#7DB8EA', '#8A5A34', '#D6347F'];
  const [yellow, orange, red, green, dgreen, blue, lblue, brown, magenta] = C;
  const pr = p.pressure;

  const hillTop = (x: number) => lerp(790 - 70 * Math.sin(x * 0.0036 + 0.4), 832, sstep(380, 520, x) * (1 - sstep(980, 1100, x)));
  const hill: P2[] = [...Array.from({length: 40}, (_, i) => [-30 + (i / 39) * 1560, hillTop(-30 + (i / 39) * 1560)] as P2), [1530, 1110], [-30, 1110]];
  const cloud: P2[] = Array.from({length: 50}, (_, i) => {
    const a = (i / 50) * TAU;
    return [330 + 175 * Math.cos(a) * (1 + 0.16 * Math.sin(5 * a)), 200 + 78 * Math.sin(a) * (1 + 0.28 * Math.sin(5 * a))] as P2;
  });

  const shapes: Shape[] = [
    {key: 'hill', pts: hill, open: hill.slice(0, 40), color: green, angle: -28, sp: 26, pr: 0.55, t0: 2, dur: 34},
    {key: 'sun', pts: circlePts(1190, 230, 115), color: yellow, angle: 40, sp: 17, pr: 0.8, t0: 20, dur: 26},
    {key: 'cloud', pts: cloud, color: lblue, angle: 70, sp: 18, pr: 0.6, t0: 36, dur: 24},
    {key: 'body', pts: rectPts(560, 520, 340, 300), color: red, angle: 58, sp: 20, pr: 0.78, t0: 50, dur: 28},
    {key: 'roof', pts: [[515, 528], [730, 355], [945, 528]], color: orange, angle: -42, sp: 17, pr: 0.7, t0: 76, dur: 22},
    {key: 'door', pts: rectPts(700, 690, 80, 130), color: blue, angle: 25, sp: 13, pr: 0.75, t0: 96, dur: 14},
    {key: 'win', pts: rectPts(600, 585, 74, 74), color: yellow, angle: 50, sp: 11, pr: 0.7, t0: 104, dur: 12},
    {key: 'trunk', pts: rectPts(1170, 620, 50, 245), color: brown, angle: 80, sp: 12, pr: 0.8, t0: 112, dur: 12},
    {key: 'crown', pts: circlePts(1195, 530, 125), color: dgreen, angle: 18, sp: 18, pr: 0.7, t0: 120, dur: 24},
    {key: 'head', pts: circlePts(300, 615, 46), color: '#F2B58A', angle: 35, sp: 12, pr: 0.55, t0: 138, dur: 12},
  ];
  // open strokes (outline-colour crayon, heavy)
  const lines: {key: string; pts: P2[]; color: string; w: number; pr: number; t0: number; dur: number}[] = [
    ...Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * TAU + 0.1;
      return {key: 'ray' + i, pts: [[1190 + Math.cos(a) * 142, 230 + Math.sin(a) * 142], [1190 + Math.cos(a) * (190 + (i % 2) * 22), 230 + Math.sin(a) * (190 + (i % 2) * 22)]] as P2[], color: orange, w: 9, pr: 0.85, t0: 40 + i, dur: 8};
    }),
    {key: 'cross1', pts: [[637, 585], [637, 659]], color: p.outline, w: 6, pr: 0.9, t0: 112, dur: 6},
    {key: 'cross2', pts: [[600, 622], [674, 622]], color: p.outline, w: 6, pr: 0.9, t0: 114, dur: 6},
    {key: 'knob', pts: circlePts(762, 758, 4, 8), color: p.outline, w: 7, pr: 0.9, t0: 108, dur: 5},
    {key: 'body1', pts: [[300, 661], [300, 765]], color: p.outline, w: 9, pr: 0.92, t0: 148, dur: 8},
    {key: 'armL', pts: [[300, 690], [248, 735]], color: p.outline, w: 9, pr: 0.92, t0: 154, dur: 6},
    {key: 'armR', pts: [[300, 690], [352, 655], [376, 598]], color: p.outline, w: 9, pr: 0.92, t0: 156, dur: 8},
    {key: 'legL', pts: [[300, 765], [268, 835]], color: p.outline, w: 9, pr: 0.92, t0: 160, dur: 6},
    {key: 'legR', pts: [[300, 765], [338, 835]], color: p.outline, w: 9, pr: 0.92, t0: 162, dur: 6},
    {key: 'eyeL', pts: circlePts(286, 608, 3, 6), color: p.outline, w: 7, pr: 0.95, t0: 152, dur: 4},
    {key: 'eyeR', pts: circlePts(316, 608, 3, 6), color: p.outline, w: 7, pr: 0.95, t0: 152, dur: 4},
    {key: 'smile', pts: [[284, 630], [300, 640], [318, 629]], color: p.outline, w: 6, pr: 0.95, t0: 153, dur: 5},
    {key: 'hair', pts: [[256, 600], [270, 560], [288, 580], [300, 552], [316, 578], [334, 556], [344, 600]], color: brown, w: 10, pr: 0.85, t0: 146, dur: 10},
    ...Array.from({length: 9}, (_, i) => ({key: 'gr' + i, pts: [[60 + i * 150 + h1(i, 1) * 50, 880 + (i % 3) * 30], [66 + i * 150 + h1(i, 1) * 50, 850 + (i % 3) * 30]] as P2[], color: dgreen, w: 8, pr: 0.7, t0: 30 + i * 3, dur: 6})),
  ];

  const toothF = p.tooth / u;
  const textP = cl((frame - 168) / 22);

  return (
    <AbsoluteFill style={{background: p.paper}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${id}-wax`} x={0} y={0} width={w} height={h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={`${0.42 * toothF} ${0.42 * toothF}`} numOctaves={3} seed={11} result="t1" />
            <feTurbulence type="fractalNoise" baseFrequency={`${0.07 * toothF} ${0.55 * toothF}`} numOctaves={2} seed={5} result="t2" />
            <feComposite in="t1" in2="t2" operator="arithmetic" k1={0} k2={0.62} k3={0.38} k4={0} result="tn" />
            <feColorMatrix in="tn" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="tA" />
            <feComponentTransfer in="tA" result="tT">
              <feFuncA type="linear" slope={3.2} intercept={-1.1} />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="tT" operator="arithmetic" k1={0} k2={1.22} k3={1} k4={-1} result="dep0" />
            <feComponentTransfer in="dep0" result="dep">
              <feFuncA type="linear" slope={9} intercept={0} />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="dep" operator="in" result="wax" />
            <feComponentTransfer in="wax">
              <feFuncA type="linear" slope={1.35} intercept={0} />
            </feComponentTransfer>
          </filter>
          <filter id={`${id}-emb`} x={0} y={0} width={w} height={h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={`${0.42 * toothF} ${0.42 * toothF}`} numOctaves={3} seed={11} result="t1" />
            <feTurbulence type="fractalNoise" baseFrequency={`${0.07 * toothF} ${0.55 * toothF}`} numOctaves={2} seed={5} result="t2" />
            <feComposite in="t1" in2="t2" operator="arithmetic" k1={0} k2={0.62} k3={0.38} k4={0} result="tn" />
            <feDiffuseLighting in="tn" surfaceScale={2.4} diffuseConstant={1.05} lightingColor="#ffffff">
              <feDistantLight azimuth={225} elevation={52} />
            </feDiffuseLighting>
          </filter>
          {shapes.map((s) => (
            <clipPath key={s.key} id={`${id}-c-${s.key}`}>
              <path d={dOf(wob(inflate(s.pts, 1.035), 4, step, p.seed + 2), true)} />
            </clipPath>
          ))}
          <clipPath id={`${id}-txt`}>
            <rect x={0} y={0} width={Math.max(1, 1500 * textP)} height={1100} />
          </clipPath>
        </defs>

        <g filter={`url(#${id}-wax)`}>
          <g transform={`translate(${ox} ${oy}) scale(${sc})`}>
            {/* hatching */}
            {shapes.map((s, si) => {
              const r = sstep(0, 1, cl((frame - s.t0 - s.dur * 0.3) / (s.dur * 0.7)));
              if (r <= 0) return null;
              const zz = zigzag(s.pts, s.angle, s.sp, step, p.seed + si);
              return (
                <g key={'h' + s.key} clipPath={`url(#${id}-c-${s.key})`}>
                  <path d={dOf(zz)} pathLength={1} fill="none" stroke={s.color} strokeOpacity={cl(s.pr * pr)} strokeWidth={s.sp * 0.62} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 2" strokeDashoffset={1 - r} />
                </g>
              );
            })}
            {/* outlines + open strokes: heavy indigo, boiling on twos */}
            {shapes.map((s, si) => {
              const r = cl((frame - s.t0) / (s.dur * 0.55));
              if (r <= 0 || s.lineOnly) return null;
              const cl0 = !s.open;
              const pts = wob(resample(s.open || s.pts, cl0, 16), 2.6, step, p.seed + 20 + si);
              const pts2 = wob(resample(s.open || s.pts, cl0, 22), 3.4, step + 1, p.seed + 40 + si);
              return (
                <g key={'o' + s.key} fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d={dOf(pts, cl0)} pathLength={1} stroke={p.outline} strokeOpacity={cl(0.92 * pr)} strokeWidth={8} strokeDasharray="1 2" strokeDashoffset={1 - r} />
                  <path d={dOf(pts2, cl0)} pathLength={1} stroke={p.outline} strokeOpacity={cl(0.5 * pr)} strokeWidth={4.5} strokeDasharray="1 2" strokeDashoffset={1 - r} />
                </g>
              );
            })}
            {lines.map((l, li) => {
              const r = cl((frame - l.t0) / l.dur);
              if (r <= 0) return null;
              const pts = wob(resample(l.pts, false, 14), 2.2, step, p.seed + 60 + li);
              return <path key={l.key} d={dOf(pts)} pathLength={1} fill="none" stroke={l.color} strokeOpacity={cl(l.pr * pr)} strokeWidth={l.w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 2" strokeDashoffset={1 - r} />;
            })}
            {textP > 0 && (
              <g clipPath={`url(#${id}-txt)`}>
                <text x={300} y={470} transform={`rotate(-8 300 470) translate(${(h1(1, step, 3) - 0.5) * 3} ${(h1(2, step, 4) - 0.5) * 3})`} textAnchor="middle" fontFamily={lf.caveat} fontWeight={700} fontSize={170} fill={magenta} fillOpacity={cl(0.85 * pr)} stroke={magenta} strokeOpacity={cl(0.6 * pr)} strokeWidth={5}>
                  {p.text}
                </text>
              </g>
            )}
          </g>
        </g>
        {p.emboss > 0 && <rect width={w} height={h} filter={`url(#${id}-emb)`} style={{mixBlendMode: 'multiply'}} opacity={p.emboss} />}
      </svg>
    </AbsoluteFill>
  );
};

export const crayonPressurePass = defineMotion<Props>({
  id: 'crayon-pressure-pass',
  title: 'Crayon pressure pass',
  category: 'image',
  description:
    "A child's crayon drawing draws itself: waxy strokes skip over a procedural paper tooth (light pressure leaves gaps, heavy fills in), zig-zag hatching overshoots the lines, the paper grain is embossed from the top-left and the indigo wobbly outlines boil on twos.",
  source: ['lemo-opuscar styles/microgame demo/glpass.js crayon (MIT, LemoLab) — deposit = tooth > 1 - 1.22*pressure, SVG feTurbulence approximation'],
  useFor: 'Kids / edu / family brands, "hand-drawn by a child" moments, playful onboarding and recap drawings; the wax filter idea works on any stroke art.',
  durationInFrames: 210,
  defaultProps: {text: 'yay!', paper: '#F4EFE3', outline: '#3B3D9A', crayons: ['#F6C21A', '#F08A24', '#E0453A', '#4FA24A', '#2F7A3D', '#3F7FD6', '#7DB8EA', '#8A5A34', '#D6347F'], pressure: 1, boil: 8, tooth: 1, emboss: 0.35, seed: 3},
  propDocs: {
    text: 'handwritten word written in magenta crayon',
    paper: 'paper colour',
    outline: 'outline crayon colour (indigo)',
    crayons: 'nine hex colours: yellow, orange, red, green, dark green, blue, light blue, brown, magenta',
    pressure: 'pressure multiplier (below 1 = more skipped grain)',
    boil: 'line-boil steps per second (8 = on twos at 30 fps)',
    tooth: 'paper tooth scale (higher = finer grain)',
    emboss: 'strength of the embossed paper grain 0-1',
    seed: 'hatching / wobble seed',
  },
  component: CrayonPressure,
  tags: ['crayon', 'wax', 'kids', 'child drawing', 'hand-drawn', 'hatching', 'paper tooth', 'texture', 'emboss', 'boil', 'on twos', 'microgame', 'playful', 'family', 'edu', 'onboarding', 'feTurbulence', 'stroke pressure', 'doodle', 'scribble'],
});
