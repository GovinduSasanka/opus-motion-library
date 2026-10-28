// Adapted from lemo-opuscar/styles/one-line/demo/cam.js (camAt), ink.js (prepare/drawLine), geom.js (curvature timing) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {CamKey, P, blotPath, camAt, clamp, cumLen, lbf, pd, resample, seg, spline, ss, widthRibbon} from '../../core/r2-lb1-kit';

/**
 * One-line drawing filmed by a nib-follow camera: a single ink line that never leaves the paper draws a whole scene
 * with real pen dynamics — thin and quick on travels, fat at slow corners (time ∝ curvature), a soaked bleed, a short
 * accent stretch — while the camera glides with the drawing point (Gaussian-lagged follow, soft nib clamp), composes
 * still for vignettes, and pulls back at the end to reveal the whole picture. Pure function of the frame.
 */

type Props = {
  paths: string | number[][][];
  paper: string;
  ink: string;
  accent: string;
  accentRange: [number, number];
  baseWidth: number;
  curvatureK: number;
  bleed: number;
  penShadow: boolean;
  drawStart: number;
  drawEnd: number;
  revealFrames: number;
  openZoom: number;
  travelZoom: number;
  caption: string;
  captionAt: number;
  pool: boolean;
  seed: number;
  background: string;
};

/** default continuous picture: shoreline → sailboat → wave → gull → sun spiral (one open polyline, 1920×1080 world) */
const DEFAULT_LINE: P[][] = [
  [
    // shoreline in
    [120, 780], [330, 760], [520, 790], [700, 770],
    // hull
    [760, 770], [800, 840], [980, 860], [1150, 835], [1190, 765], [1020, 772], [905, 768],
    // mast up
    [910, 762], [915, 470],
    // big sail
    [918, 468], [1130, 700], [930, 712], [920, 560],
    // jib
    [915, 520], [780, 700], [895, 718],
    // back to the water, wave curls
    [940, 790], [1240, 800], [1320, 760], [1300, 720], [1260, 745], [1300, 790], [1450, 780],
    // gull
    [1480, 500], [1530, 460], [1575, 495], [1620, 455], [1665, 500],
    // sun spiral
    [1680, 300], [1600, 240], [1660, 170], [1740, 230], [1700, 290], [1640, 260],
  ],
];

const NibFollowCamera: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const id = 'nib-follow-camera';
  const world: P[] = React.useMemo(() => {
    const raw: P[][] = typeof p.paths === 'string' && p.paths ? (JSON.parse(p.paths) as P[][]) : p.paths && (p.paths as number[][][]).length ? (p.paths as P[][]) : DEFAULT_LINE;
    const out: P[] = [];
    for (const seg2 of raw) out.push(...spline(seg2 as P[], false, 10));
    return out;
  }, [p.paths]);
  const prep = React.useMemo(() => {
    const pts = resample(world, 2.2);
    const n = pts.length;
    // curvature weights -> per-sample time
    const wts: number[] = [1];
    for (let i = 1; i < n - 1; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const c = pts[i + 1];
      const a1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const a2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
      let turn = Math.abs(a2 - a1);
      if (turn > Math.PI) turn = 2 * Math.PI - turn;
      wts.push(1 + p.curvatureK * Math.min(3.2 * turn, 3));
    }
    wts.push(1);
    const cumT: number[] = [0];
    for (let i = 1; i < n; i++) cumT.push(cumT[i - 1] + wts[i]);
    const T = cumT[cumT.length - 1];
    const times = cumT.map((x) => x / T);
    const cum = cumLen(pts);
    return {pts, times, cum, n};
  }, [world, p.curvatureK]);
  const drawK = (f: number) => ss(seg(f, p.drawStart, p.drawEnd > 0 ? p.drawEnd : D - p.revealFrames - 10));
  const idxAt = (f: number) => {
    const tt = drawK(f);
    // binary search in times
    let lo = 0;
    let hi = prep.n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (prep.times[mid] < tt) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const head = idxAt(frame);
  const posAt = (f: number): P => prep.pts[Math.min(prep.n - 1, idxAt(f))];
  // speeds -> widths
  const samples = React.useMemo(() => {
    const out: {x: number; y: number; r: number; v: number}[] = [];
    const endT = p.drawEnd > 0 ? p.drawEnd : 300;
    const totalSec = Math.max(1, endT - p.drawStart) / 30;
    for (let i = 0; i < prep.n; i++) {
      const dT = (prep.times[Math.min(prep.n - 1, i + 1)] - prep.times[Math.max(0, i - 1)]) * totalSec;
      const dS = prep.cum[Math.min(prep.n - 1, i + 1)] - prep.cum[Math.max(0, i - 1)];
      const v = dS / Math.max(1e-4, dT);
      const pressure = 0.66 + 0.8 * Math.exp(-v / 300);
      const noiseW = 1 + 0.16 * (Math.sin(i * 0.61 + p.seed) * 0.5 + Math.sin(i * 0.173) * 0.3);
      out.push({x: prep.pts[i][0], y: prep.pts[i][1], r: (p.baseWidth / 2) * pressure * noiseW, v});
    }
    return out;
  }, [prep, p.baseWidth, p.seed, p.drawStart, p.drawEnd]);
  const drawnD = React.useMemo(() => widthRibbon(samples.slice(0, Math.max(2, head + 1))), [samples, head]);
  // accent stretch (fraction of arc length)
  const accentD = React.useMemo(() => {
    const a0 = p.accentRange[0];
    const a1 = p.accentRange[1];
    if (a1 <= a0) return '';
    const total = prep.cum[prep.n - 1];
    const i0 = prep.cum.findIndex((c) => c >= a0 * total);
    let i1 = prep.cum.findIndex((c) => c >= a1 * total);
    if (i1 < 0) i1 = prep.n - 1;
    const hi = Math.min(head, i1);
    if (hi - Math.max(0, i0) < 3) return '';
    return widthRibbon(samples.slice(Math.max(0, i0), hi + 1));
  }, [samples, head, prep, p.accentRange]);
  // pools where the pen went slowly
  const pools = React.useMemo(() => {
    if (!p.pool) return [] as {x: number; y: number; r: number; i: number}[];
    const out: {x: number; y: number; r: number; i: number}[] = [];
    for (let i = 6; i < prep.n - 6; i += 4) {
      const s = samples[i];
      if (s.v < 45 && (out.length === 0 || Math.hypot(s.x - out[out.length - 1].x, s.y - out[out.length - 1].y) > 26)) {
        out.push({x: s.x, y: s.y, r: s.r * (0.62 + 0.3 * (1 - s.v / 45)) * 2.2, i});
      }
    }
    return out.slice(0, 14);
  }, [samples, prep, p.pool]);
  // camera
  const drawEndF = p.drawEnd > 0 ? p.drawEnd : D - p.revealFrames - 10;
  const WLD_W = 1920;
  const WLD_H = 1080;
  const fitZ = Math.min(w / WLD_W, h / WLD_H) * (portrait ? 1.12 : 0.98);
  const travelZ = p.travelZoom * fitZ * (portrait ? 1.5 : 1);
  const keys: CamKey[] = [
    {f: 0, x: prep.pts[0][0], y: prep.pts[0][1], z: p.openZoom * fitZ * (portrait ? 1.4 : 1), follow: 0.85},
    {f: drawEndF * 0.35, x: WLD_W * 0.5, y: WLD_H * 0.62, z: travelZ, follow: 0.75},
    {f: drawEndF * 0.75, x: WLD_W * 0.62, y: WLD_H * 0.55, z: travelZ * 0.92, follow: 0.7, roll: -1.5},
    {f: drawEndF, x: WLD_W * 0.78, y: WLD_H * 0.35, z: travelZ * 1.05, follow: 0.6},
    {f: drawEndF + p.revealFrames, x: WLD_W / 2, y: WLD_H / 2 + (portrait ? 40 : 0), z: fitZ, follow: 0, roll: 0},
  ];
  const cam = camAt(frame, keys, posAt, w, h);
  const nib = prep.pts[head];
  const camT = `translate(${w / 2} ${h / 2}) rotate(${-cam.roll}) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`;
  const drawing = frame >= p.drawStart && head < prep.n - 1;
  const capK = p.caption ? ss(seg(frame, p.captionAt, p.captionAt + 12)) : 0;
  return (
    <AbsoluteFill style={{background: p.background === 'paper' ? p.paper : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${id}-bleed`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={0.9} />
          </filter>
          <radialGradient id={`${id}-mottle`} cx="0.5" cy="0.42" r="0.85">
            <stop offset="0" stopColor={p.paper} />
            <stop offset="0.75" stopColor={p.paper} />
            <stop offset="1" stopColor="#E6E0D4" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}-mottle)`} />
        <g transform={camT}>
          {p.bleed > 0 && drawnD && (
            <g filter={`url(#${id}-bleed)`} opacity={0.22}>
              <path d={drawnD} fill={p.ink} transform={`translate(${nib[0] * 0} 0) scale(1)`} strokeWidth={0} />
            </g>
          )}
          {pools.map((pl, i) =>
            pl.i <= head ? (
              (() => {
                const startF = p.drawStart + prep.times[pl.i] * (drawEndF - p.drawStart);
                const g = clamp((frame - startF) / 26);
                const b = blotPath(pl.x, pl.y, 1 - Math.pow(1 - g, 2.2), p.baseWidth, 0.55, p.seed + i);
                return <path key={i} d={b.d} fill={p.ink} opacity={0.82} />;
              })()
            ) : null,
          )}
          {drawnD && <path d={drawnD} fill={p.ink} />}
          {accentD && <path d={accentD} fill={p.accent} />}
          {/* pen shadow + contact dot */}
          {drawing && (
            <g>
              <path
                d={pd(
                  [
                    [nib[0], nib[1]],
                    [nib[0] + 170 / cam.z, nib[1] + 36 / cam.z],
                    [nib[0] + 200 / cam.z, nib[1] + 90 / cam.z],
                    [nib[0] + 44 / cam.z, nib[1] + 26 / cam.z],
                  ],
                )}
                fill="#3A3127"
                opacity={0.15}
                filter={`url(#${id}-bleed)`}
              />
              <circle cx={nib[0]} cy={nib[1]} r={Math.max(1.6, p.baseWidth * 0.8)} fill={p.ink} />
            </g>
          )}
        </g>
        {capK > 0 && (
          <g opacity={capK}>
            <text x={w / 2} y={h - 92 * u} textAnchor="middle" fontFamily={lbf('caveat')} fontWeight={500} fontSize={46 * u} fill={p.ink} opacity={0.84} stroke={p.paper} strokeWidth={12 * u} style={{paintOrder: 'stroke'}}>
              {p.caption}
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const nibFollowCamera = defineMotion<Props>({
  id: 'nib-follow-camera',
  title: 'One-line drawing, nib-follow camera',
  category: 'shape',
  description:
    'A single continuous ink line draws a whole scene with real pen dynamics — thin on fast travels, fat and pooled at slow corners, a soaked bleed, one red accent stretch, a soft pen shadow at the nib — while the camera glides after the drawing point with lag and anticipation and pulls back at the end to reveal the whole picture.',
  source: ['lemo-opuscar styles/one-line (MIT code, CC BY 4.0 docs, LemoLab) — demo/cam.js camAt, ink.js prepare/drawLine, geom.js'],
  useFor: 'Minimal brand stories, signature / logo reveals, life-milestone films, "one continuous process" explainers; pass your own polyline for a custom picture.',
  durationInFrames: 240,
  defaultProps: {
    paths: '',
    paper: '#F4EFE4',
    ink: '#1D1A17',
    accent: '#B3332B',
    accentRange: [0.47, 0.56],
    baseWidth: 5.2,
    curvatureK: 1.6,
    bleed: 0.22,
    penShadow: true,
    drawStart: 4,
    drawEnd: 0,
    revealFrames: 50,
    openZoom: 3.4,
    travelZoom: 1.9,
    caption: 'It all starts with one line.',
    captionAt: 200,
    pool: true,
    seed: 3,
    background: 'paper',
  },
  propDocs: {
    paths: 'JSON array of polylines [[[x,y],…],…] in a 1920×1080 world (smoothed through a spline); empty = built-in sailboat scene',
    paper: 'paper colour',
    ink: 'ink colour',
    accent: 'accent colour for one stretch',
    accentRange: 'accent stretch [from, to] as fractions of total line length',
    baseWidth: 'base line width (world px)',
    curvatureK: 'how much sharp turns slow the pen (0 = constant speed)',
    bleed: 'soaked-edge opacity',
    penShadow: 'soft shadow wedge at the nib',
    drawStart: 'frame the line starts',
    drawEnd: 'frame it finishes (0 = auto: duration − reveal)',
    revealFrames: 'pull-back reveal length',
    openZoom: 'macro zoom at the start',
    travelZoom: 'zoom during travel',
    caption: 'handwritten caption at the end ("" to hide)',
    captionAt: 'caption frame',
    pool: 'ink pools where the pen moves slowly',
    seed: 'width-noise seed',
    background: '"paper" or a colour / "transparent"',
  },
  component: NibFollowCamera,
  tags: ['one line', 'single line', 'draw on', 'ink', 'pen', 'camera follow', 'pull back', 'reveal', 'minimal', 'signature', 'continuous', 'pressure', 'calligraphy'],
});
