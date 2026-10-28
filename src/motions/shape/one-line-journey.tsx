// Adapted from mg-styles-15/demos/02-line-art/film.js (camera, PIECES, draw loop) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {IP, spline} from '../../core/r2-mg1-kit';
import {P2, bez, buildTimeRemap, cl, flattenPath, gauss, mix, smooth} from '../../core/r2-mg1b-kit';
import {Svg, FilmGrain, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Piece = {pts?: (number[])[]; d?: string; weight: number};
type Props = {
  pieces: Piece[];
  background: string;
  color: string;
  lineWidth: number;
  zoomKeys: number[][];
  dimTo: number;
  holdAfter: number[];
  holdSec: number;
  drawStart: number;
  drawEnd: number;
  follow: number;
  bank: number;
  title: string;
  subtitle: string;
};

// ---- default figures: seed -> plant -> building -> skyline -> wave -> ring logo (one continuous line, y down, ground y = 0)
const wavePts = (): number[][] => {
  const o: number[][] = [];
  for (let x = 1140; x <= 1640; x += 20) o.push([x, -56 * Math.sin(((x - 1140) / 500) * Math.PI * 4)]);
  return o;
};
const ringPts = (): number[][] => {
  const o: number[][] = [[1640, 0], [1700, 0]];
  for (let i = 1; i <= 36; i++) {
    const a = Math.PI / 2 - (i / 36) * Math.PI * 2;
    o.push([1700 + 100 * Math.cos(a), -100 + 100 * Math.sin(a)]);
  }
  o.push([1700, -60], [1700, -100, 1]);
  return o;
};
const DEFAULT_PIECES: Piece[] = [
  {weight: 1.0, pts: [[-140, 0], [40, 0], [170, 0]]},
  {weight: 1.4, pts: [[170, 0], [200, 0], [232, -6], [246, -26], [236, -44], [216, -40], [208, -20], [226, -2], [270, 0]]},
  {
    weight: 2.4,
    pts: [[270, 0], [300, 0], [306, -50], [300, -110], [304, -170, 1], [352, -196], [392, -172], [356, -136], [306, -122, 1], [262, -136], [228, -114], [258, -92], [302, -84, 1], [308, -40], [330, 0], [440, 0]],
  },
  {weight: 2.2, pts: [[440, 0], [440, -250, 1], [540, -310, 1], [640, -250, 1], [640, 0, 1], [780, 0]]},
  {
    weight: 2.4,
    pts: [[780, 0], [780, -130, 1], [830, -130, 1], [830, -210, 1], [890, -210, 1], [890, -100, 1], [940, -100, 1], [940, -280, 1], [1000, -280, 1], [1000, 0, 1], [1140, 0]],
  },
  {weight: 2.4, pts: wavePts()},
  {weight: 2.6, pts: ringPts()},
];

type Built = {
  pts: P2[];
  cum: number[]; // arclength at each sample
  total: number;
  pieceArc: number[]; // arc start of each piece (+ end)
  center: P2;
  extent: P2;
};

const build = (pieces: Piece[]): Built => {
  const pts: P2[] = [];
  const pieceArc: number[] = [];
  for (const p of pieces) {
    let poly: P2[];
    if (p.d) {
      const sp = flattenPath(p.d, 16);
      poly = sp.flatMap((s) => s.pts);
    } else {
      poly = spline((p.pts ?? []).map((q) => [q[0], q[1], q[2]] as IP), false, 3);
    }
    pieceArc.push(pts.length);
    for (let i = 0; i < poly.length; i++) {
      if (pts.length && i === 0 && Math.hypot(poly[0][0] - pts[pts.length - 1][0], poly[0][1] - pts[pts.length - 1][1]) < 0.5) continue;
      pts.push(poly[i]);
    }
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const pa = pieceArc.map((i) => cum[Math.min(i, cum.length - 1)]);
  pa.push(cum[cum.length - 1]);
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  let y1 = -1e9;
  for (const p of pts) {
    x0 = Math.min(x0, p[0]);
    x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]);
    y1 = Math.max(y1, p[1]);
  }
  return {pts, cum, total: cum[cum.length - 1], pieceArc: pa, center: [(x0 + x1) / 2, (y0 + y1) / 2], extent: [x1 - x0, y1 - y0]};
};

const posAt = (B: Built, s: number): P2 => {
  const t = cl(s, 0, B.total);
  let lo = 0;
  let hi = B.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (B.cum[m] <= t) lo = m;
    else hi = m;
  }
  const a = B.pts[lo];
  const b = B.pts[hi];
  const k = (t - B.cum[lo]) / Math.max(1e-9, B.cum[hi] - B.cum[lo]);
  return [mix(a[0], b[0], k), mix(a[1], b[1], k)];
};

const OneLineJourney: React.FC<Props> = (props) => {
  const {pieces, background, color, lineWidth, zoomKeys, dimTo, holdAfter, holdSec, drawStart, drawEnd, follow, bank, title, subtitle} = props;
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx, cy} = useStage();
  const key = JSON.stringify([pieces, holdAfter, holdSec, drawStart, drawEnd]);
  const M = useMemo(() => {
    const B = build(pieces);
    const W = pieces.reduce((a, p) => a + p.weight, 0);
    const starts: number[] = [];
    let acc = 0;
    for (const p of pieces) {
      starts.push(drawStart + (acc / W) * (drawEnd - drawStart));
      acc += p.weight;
    }
    starts.push(drawEnd);
    const holds = holdAfter.filter((i) => i >= 0 && i < pieces.length - 1).map((i) => ({at: starts[i + 1] + 0.089, dur: holdSec}));
    const rm = buildTimeRemap(holds, {easeIn: 0.133, release: 0.55, total: drawEnd + 6});
    const ease = bez(0.4, 0, 0.4, 1);
    const arcAtClock = (c: number) => {
      if (c <= starts[0]) return 0;
      if (c >= drawEnd) return B.total;
      let i = 0;
      while (i < pieces.length - 1 && c >= starts[i + 1]) i++;
      const loc = cl((c - starts[i]) / Math.max(1e-6, starts[i + 1] - starts[i]));
      return B.pieceArc[i] + ease(loc) * (B.pieceArc[i + 1] - B.pieceArc[i]);
    };
    // arc(t) on a 1/60 s grid so a chunk's draw time can be recovered for age dimming
    const grid: number[] = [];
    for (let k = 0; k <= Math.ceil((drawEnd + 6) * 60); k++) grid.push(arcAtClock(rm.remap(k / 60)));
    const timeAtArc = (s: number) => {
      let lo = 0;
      let hi = grid.length - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (grid[m] <= s) lo = m;
        else hi = m;
      }
      return lo / 60;
    };
    return {B, starts, rm, arcAtClock, timeAtArc};
  }, [key]);
  const {B, starts, rm, arcAtClock, timeAtArc} = M;

  const t = frame / fps;
  const clockNow = rm.remap(t);
  const sTip = arcAtClock(clockNow);

  // camera: gaussian-weighted average of tip positions over +-follow s (sigma follow*0.4) with a small look-ahead
  const sigma = follow * 0.4;
  let camX = 0;
  let camY = 0;
  let wsum = 0;
  for (let o = -follow; o <= follow + 1e-6; o += follow / 8) {
    const p = posAt(B, arcAtClock(rm.remap(Math.max(0, t + o + 0.08))));
    const g = gauss(o, sigma);
    camX += p[0] * g;
    camY += p[1] * g;
    wsum += g;
  }
  camX /= wsum;
  camY /= wsum;
  // zoom keys in log space with smoothstep between keys (seconds on the clock)
  let zl = Math.log(zoomKeys[0][1]);
  for (let i = 1; i < zoomKeys.length; i++) {
    if (clockNow <= zoomKeys[i][0]) {
      const k = smooth(zoomKeys[i - 1][0], zoomKeys[i][0], clockNow);
      zl = mix(Math.log(zoomKeys[i - 1][1]), Math.log(zoomKeys[i][1]), k);
      break;
    }
    zl = Math.log(zoomKeys[i][1]);
  }
  const reveal = smooth(drawEnd - 1.4, drawEnd + 0.4, clockNow);
  camX = mix(camX, B.center[0], reveal);
  camY = mix(camY, B.center[1], reveal);
  const fit = Math.min((w * 0.86) / B.extent[0], (h * 0.55) / B.extent[1]);
  const scale = fit * Math.exp(zl);
  const sx = (x: number) => cx + (x - camX) * scale;
  const sy = (y: number) => cy + (y - camY) * scale + (cy * 0.06) * reveal;
  // banking roll through the wave piece
  const wi = Math.min(5, pieces.length - 1);
  const roll = -bank * Math.sin(Math.PI * cl((clockNow - starts[wi]) / Math.max(1e-6, starts[wi + 1] - starts[wi])));

  // chunks
  const CH = 40; // world px per chunk (age granularity)
  const nCh = Math.ceil(B.total / CH);
  const chunks: React.ReactNode[] = [];
  const lw = (lineWidth * u) / scale;
  const relight = smooth(drawEnd - 0.2, drawEnd + 1.2, clockNow);
  let startIdx = 0;
  for (let c = 0; c < nCh; c++) {
    const s0 = c * CH;
    if (s0 >= sTip) break;
    const s1 = Math.min(B.total, (c + 1) * CH);
    // gather points between s0 and min(s1, sTip)
    while (startIdx > 0 && B.cum[startIdx] > s0) startIdx--;
    while (startIdx < B.cum.length - 1 && B.cum[startIdx + 1] <= s0) startIdx++;
    const end = Math.min(s1, sTip);
    const seg: P2[] = [posAt(B, s0)];
    for (let i = startIdx + 1; i < B.cum.length && B.cum[i] < end; i++) seg.push(B.pts[i]);
    seg.push(posAt(B, end));
    const age = clockNow - timeAtArc(s1);
    const dim = dimTo + (1 - dimTo) * (1 - smooth(0.2, 1.5, age));
    const op = mix(dim, 1, relight);
    chunks.push(
      <polyline
        key={c}
        points={seg.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={lw}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={op}
      />,
    );
  }
  // tip
  const tip = posAt(B, sTip);
  const tipX = sx(tip[0]);
  const tipY = sy(tip[1]);
  const drawing = cl((clockNow - starts[0] + 0.3) / 0.3) * (1 - smooth(drawEnd - 0.2, drawEnd + 0.8, clockNow));
  const textIn = smooth(drawEnd + 0.9, drawEnd + 1.7, clockNow);
  const textIn2 = smooth(drawEnd + 1.3, drawEnd + 2.1, clockNow);

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, ${background} 0%, #03070f 120%)`}}>
      <Svg>
        <defs>
          <radialGradient id="olj-g1">
            <stop offset="0" stopColor={color} stopOpacity={0.55} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="olj-g2">
            <stop offset="0" stopColor="#fff6dc" stopOpacity={0.9} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`rotate(${(roll * 180) / Math.PI} ${cx} ${cy})`}>
          <g transform={`translate(${sx(0)} ${sy(0)}) scale(${scale})`}>
            <line x1={-4000} x2={4000} y1={0} y2={0} stroke={color} strokeWidth={lw * 0.5} opacity={0.08} />
            {chunks}
          </g>
          <g opacity={drawing}>
            <circle cx={tipX} cy={tipY} r={46 * u} fill="url(#olj-g1)" opacity={0.7} />
            <circle cx={tipX} cy={tipY} r={17 * u} fill="url(#olj-g2)" />
            <circle cx={tipX} cy={tipY} r={4.5 * u} fill="#fff8e8" />
          </g>
        </g>
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: cy + h * 0.27,
          textAlign: 'center',
          color: '#F4E6C3',
          fontFamily: fonts.serif,
          fontWeight: 500,
          fontSize: 78 * u,
          letterSpacing: 14 * u,
          textTransform: 'uppercase',
          opacity: textIn,
          transform: `translateY(${(1 - textIn) * 18 * u}px)`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: cy + h * 0.27 + 100 * u,
          textAlign: 'center',
          color: color,
          fontFamily: fonts.sans,
          fontWeight: 400,
          fontSize: 24 * u,
          letterSpacing: 10 * u,
          textTransform: 'uppercase',
          opacity: textIn2 * 0.8,
        }}
      >
        {subtitle}
      </div>
      <Vignette strength={0.5} />
      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};

export const oneLineJourney = defineMotion<Props>({
  id: 'one-line-journey',
  title: 'One-line journey',
  category: 'shape',
  description:
    'A single gold line with a glowing pen tip travels through a chain of figures (seed, plant, building, skyline, wave, ring) as one continuous path; a virtual camera rides the tip zoomed in and pulls back as the drawing grows, older parts dim to ~35 %, the clock breathes on each figure, and the finished drawing relights under a tracked title.',
  source: ['mg-styles-15 demos/02-line-art/film.js camera + PIECES (MIT)'],
  useFor: 'Luxury, architecture, finance and founder-story films; agents can feed brand-specific path pieces for a one-stroke story.',
  durationInFrames: 330,
  defaultProps: {
    pieces: DEFAULT_PIECES,
    background: '#0E1B33',
    color: '#E8C46A',
    lineWidth: 3.4,
    zoomKeys: [
      [0, 5],
      [0.9, 3.4],
      [2.4, 2.4],
      [4.4, 1.7],
      [6.4, 1.25],
      [8.2, 1],
    ],
    dimTo: 0.35,
    holdAfter: [2, 3, 4, 5],
    holdSec: 0.15,
    drawStart: 0.3,
    drawEnd: 8.2,
    follow: 0.8,
    bank: 0.016,
    title: 'Northwind',
    subtitle: 'one continuous line',
  },
  propDocs: {
    pieces: 'ordered figures [{pts:[[x,y,corner?]…] | d:"svg path", weight}] in world units (ground y=0, y down); the pen continues from piece to piece',
    background: 'centre colour of the backdrop gradient',
    color: 'line and glow colour',
    lineWidth: 'line width in screen px at 1080p',
    zoomKeys: '[[clock seconds, zoom]…] camera zoom (1 = whole drawing fits), interpolated in log space',
    dimTo: 'opacity older line fades to (0-1)',
    holdAfter: 'piece indices after which the clock holds (punctuation) then runs ~2x to catch up',
    holdSec: 'seconds of each hold',
    drawStart: 'clock second the pen starts',
    drawEnd: 'clock second the last piece is finished',
    follow: 'camera smoothing window in seconds (gaussian)',
    bank: 'camera roll (radians) while drawing the wave piece',
    title: 'tracked title that appears after the drawing',
    subtitle: 'small line under the title',
  },
  component: OneLineJourney,
  tags: ['line art', 'pen', 'one line', 'continuous line', 'camera follow', 'luxury', 'architecture', 'journey', 'draw-on', 'gold', 'story'],
});
