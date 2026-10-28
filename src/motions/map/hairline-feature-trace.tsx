// Adapted from lemo-opuscar/styles/lidar-survey/demo/film.js surface shader (feature field, amber hairlines) + STYLE.md (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {cl, eio3, lerp, lf, seg} from '../../core/r2-la3-kit';
import {drape, makeReliefH, ReliefMesh, reliefQuads, RelCam, RELIEF_PAL, relP} from '../../core/r2-la3b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  amber: string;
  speed: number;
  gap: number;
  startAt: number;
  labels: string[];
  size: number;
  seed: number;
  background: string;
  surface: string;
};

type Poly = [number, number][];

/** resample a plan polyline to ~step spacing so it drapes over the surface smoothly */
const dense = (pts: Poly, step: number): Poly => {
  const out: Poly = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k++) out.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
  }
  return out;
};
const lenOf = (p: Poly) => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);

const HairlineFeatureTrace: React.FC<Props> = ({amber, speed, gap, startAt, labels, size, seed, background, surface}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame / 30;
  const s = size / 200;
  const H = React.useMemo(() => makeReliefH(seed, [{x: -48 * s, y: 26 * s, r: 52 * s, h: 14}, {x: 52 * s, y: -34 * s, r: 40 * s, h: 9}], 4), [seed, s]);

  // features in plan view: walls (compound), road (sinuous), pipes (right-angle run), boundary (closed loop)
  const features = React.useMemo(() => {
    const q = (a: Poly): Poly => a.map(([x, y]) => [x * s, y * s] as [number, number]);
    const walls = q([[-70, -10], [-70, 40], [-20, 40], [-20, -10], [-70, -10], [-45, -10], [-45, 40], [-45, 15], [-20, 15]]);
    const roadRaw: Poly = Array.from({length: 17}, (_, i) => [-95 + i * 12.5, -48 + 22 * Math.sin(i * 0.55 + 0.6) + i * 2.2]);
    const pipes = q([[-20, 28], [8, 28], [8, -4], [46, -4], [46, 30], [78, 30]]);
    const boundary = q([[22, 42], [62, 52], [88, 24], [74, -10], [36, -20], [14, 10], [22, 42]]);
    return [
      {pts: dense(walls, 2 * s), name: labels[0] ?? 'Walls'},
      {pts: dense(q(roadRaw), 2 * s), name: labels[1] ?? 'Roads'},
      {pts: dense(pipes, 2 * s), name: labels[2] ?? 'Pipes'},
      {pts: dense(boundary, 2 * s), name: labels[3] ?? 'Boundary'},
    ];
  }, [s, labels.join('|')]);

  const yaw = 0.42 + t * 0.035;
  const el = (portrait ? 52 : 46) * (Math.PI / 180);
  const k = Math.min((w * (portrait ? 0.98 : 0.8)) / (size * 1.3), (h * (portrait ? 0.62 : 0.88)) / (size * 0.72 * Math.sin(el) + 16 * Math.cos(el)));
  const cam: RelCam = {yaw, el, k: k * (portrait ? 1.45 : 1), cx: w / 2, cy: h * (portrait ? 0.5 : 0.54)};
  const quads = reliefQuads(H, size, 60, cam, {az: (315 * Math.PI) / 180, el: (26 * Math.PI) / 180}, {...RELIEF_PAL, lo: surface, hi: '#C6BFAA', zmax: 20 * s + 6, ambient: 0.2, interval: 2});

  // sequential light-up: each feature starts after the previous finishes (speed in plan units per frame)
  let start = startAt;
  const timeline = features.map((f) => {
    const L = lenOf(f.pts);
    const dur = L / Math.max(0.1, speed * s);
    const st = start;
    start += dur + gap;
    return {...f, L, dur, st};
  });

  const px = Math.max(1, 1.2 * u);
  const parts: React.ReactNode[] = [];
  const chips: React.ReactNode[] = [];
  timeline.forEach((f, fi) => {
    const prog = cl((frame - f.st) / f.dur);
    if (prog <= 0) return;
    const nShow = Math.max(2, Math.floor(prog * (f.pts.length - 1)) + 1);
    const frac = prog * (f.pts.length - 1) - (nShow - 1);
    const shown = f.pts.slice(0, nShow);
    if (prog < 1 && nShow < f.pts.length) {
      const a = f.pts[nShow - 1];
      const b = f.pts[nShow];
      shown.push([lerp(a[0], b[0], cl(frac)), lerp(a[1], b[1], cl(frac))]);
    }
    const sp = drape(H, cam, shown, 0.5);
    const d = 'M' + sp.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L');
    const head = sp[sp.length - 1];
    parts.push(
      <g key={fi}>
        <path d={d} fill="none" stroke={amber} strokeOpacity="0.07" strokeWidth={7 * u} strokeLinejoin="round" />
        <path d={d} fill="none" stroke={amber} strokeWidth={px} strokeLinejoin="round" strokeLinecap="round" />
        {prog < 1 && (
          <>
            <circle cx={head[0]} cy={head[1]} r={11 * u} fill={amber} opacity="0.22" />
            <circle cx={head[0]} cy={head[1]} r={3.2 * u} fill="#FFF1D6" />
          </>
        )}
      </g>,
    );
    const a0 = sp[0];
    const pop = cl((frame - f.st) / 8);
    chips.push(
      <text key={fi} x={a0[0] + 12 * u} y={a0[1] - 10 * u} fill={amber} fillOpacity={0.85 * pop} fontFamily={lf.plex} fontSize={(portrait ? 28 : 17) * u} style={{letterSpacing: 3 * u}}>
        {f.name.toUpperCase()}
      </text>,
    );
  });

  const fadeIn = eio3(seg(frame, 0, 20));
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="hft-vig" cx="50%" cy="52%" r="70%">
            <stop offset="55%" stopColor={background} stopOpacity="0" />
            <stop offset="100%" stopColor={background} stopOpacity="0.85" />
          </radialGradient>
        </defs>
        <g opacity={fadeIn}>
          <ReliefMesh quads={quads} />
        </g>
        {parts}
        {chips}
        <rect width={w} height={h} fill="url(#hft-vig)" />
        <text x={64 * u} y={h - 52 * u} fill="#FFFFFF" fillOpacity="0.62" fontFamily={lf.plex} fontSize={(portrait ? 28 : 19) * u}>
          Plan trace, vertical exaggeration x1.0
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export const hairlineFeatureTrace = defineMotion<Props>({
  id: 'hairline-feature-trace',
  title: 'Hairline feature trace',
  category: 'map',
  description:
    'On a dark raking-lit survey surface, 1-px amber hairlines light up along traced features in order (compound walls, a sinuous road, a pipe run, a boundary loop). Each line has a bright head glow at the drawing front and a faint halo behind, stays crisp at any distance, and is draped on the terrain while the camera drifts.',
  source: ['lemo-opuscar styles/lidar-survey/demo/film.js surface shader (MIT, LemoLab)', 'lemo-styles-a lidar-survey: hairline-feature-trace'],
  useFor: 'Route, network and boundary reveals on terrains and maps; complements map-route and topdown-terrain.',
  durationInFrames: 240,
  defaultProps: {amber: '#FFB347', speed: 5.5, gap: 8, startAt: 14, labels: ['Walls', 'Roads', 'Pipes', 'Boundary'], size: 200, seed: 6, background: '#07090B', surface: '#2A2D2F'},
  propDocs: {
    amber: 'hairline colour',
    speed: 'draw speed in plan units per frame (200-unit plot)',
    gap: 'frames between features',
    startAt: 'frame the first feature starts',
    labels: 'four feature labels in order',
    size: 'terrain plot size in metres',
    seed: 'terrain seed',
    background: 'backdrop colour',
    surface: 'low-ground colour of the lit surface',
  },
  component: HairlineFeatureTrace,
  tags: ['hairline', 'trace', 'survey', 'terrain', 'routes', 'roads', 'pipes', 'boundary', 'map', 'amber', 'network', 'light up', 'lidar', 'draw on'],
});
