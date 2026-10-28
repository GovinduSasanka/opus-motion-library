// Variants added to the original transition types (round 2): blob fog / ink / bubble, strip shutter, page-turn curl3d,
// dots halftone, wipe brush / mist / soft, diagonal band / strips, bands rows / cols / quarter, slide scroll,
// tear peel, zoom snap.
// Ideas from lemo-opuscar (news-package, pictogram-motion, ukiyoe, watercolor, paper-popup, spy-titles, telestrator),
// mg-styles-15 (collage tear peel, flat-vector bubble wipe), the x2 / x5 / x6 reference videos and the prompt corpus;
// all re-written as deterministic SVG / CSS (MIT, © LemoLab and the respective authors; see THIRD_PARTY_NOTICES.md).
import React from 'react';
import {n2, rng} from '../core/random';
import {
  AbsoluteFill,
  at,
  axisFor,
  BlurFilter,
  C,
  clamp01,
  cornerR,
  E,
  Edge,
  f1,
  FullRect,
  Hidden,
  lerp,
  Masked,
  Overlay,
  Plain,
  ptsStr,
  region,
  sampleEdge,
  seg,
  sstep,
  straight,
  useFrameSize,
  useUid,
} from './kit';

type Pt = [number, number];
const radial = (cx: number, cy: number, R: number, k: (a: number) => number, n = 72): Pt[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = R * k(a);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
const poly = (pts: Pt[]) => ptsStr(pts);

// ---------------------------------------------------------------------------------------------
// blob 'fog' — x6 fog-blob: a soft white-misty organic blob opens from a point, near-linear, misty rim until it leaves the frame

export const BlobFog: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('fog');
  const fid = useUid('fogf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const fw = pp.feather > 0 ? pp.feather * u : 0.03 * w;
  const Rend = cornerR(cx, cy, w, h) * 1.2 + fw * 2;
  const R = Rend * Math.pow(p, 1.05);
  const ph = pp.seed * 1.7;
  const pts = radial(cx, cy, R, (a) => 1 + 0.035 * (Math.sin(2 * a + ph + 0.5 * p * 6) + Math.sin(3 * a + ph * 2 - 0.4 * p * 6) + Math.sin(4 * a + ph * 3 + 0.3 * p * 6)));
  const rimA = 0.6 * (1 - seg(p, 0.85, 1));
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} defs={<BlurFilter id={fid} sd={fw / 2} w={w} h={h} />} mask={<polygon points={poly(pts)} fill="white" filter={`url(#${fid})`} />}>
        <AbsoluteFill style={{filter: `brightness(${1 + 0.2 * (1 - p)})`}}>{children}</AbsoluteFill>
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid + 'r'} sd={fw * 0.45} w={w} h={h} />
        </defs>
        <polygon points={poly(pts)} fill="none" stroke={pp.color} strokeWidth={fw} opacity={rimA} filter={`url(#${fid}r)`} />
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// blob 'ink' — lemo ink-bloom: ink drop with an irregular fbm edge and a darker water-line at its front

export const BlobInk: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('ink');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const Rend = cornerR(cx, cy, w, h) * 1.4;
  const R = Rend * E.outCubic(p);
  const amp = pp.feather > 0 ? pp.feather : 0.15;
  const k = (a: number) => 1 + amp * n2(`ink${pp.seed}`, Math.cos(a) * 1.15, Math.sin(a) * 1.15 + p * 0.9) + 0.05 * Math.sin(3 * a + pp.seed);
  const outer = radial(cx, cy, R, k, 96);
  const bw = 0.05 * R + 14 * u;
  const inner = radial(cx, cy, Math.max(0, R - bw), k, 96).reverse();
  const d = `M${poly(outer)}Z M${poly(inner)}Z`;
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={poly(outer)} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <path d={d} fill="#000" fillRule="evenodd" opacity={0.38} />
        <polygon points={poly(outer)} fill="none" stroke={pp.color} strokeWidth={3 * u} opacity={0.55} />
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// blob 'bubble' — mg-styles-15 flat-vector bubble-shape-wipe: a speech bubble grows from a point to a colour field, a pill
// inside it grows into the next colour, ... and a final rounded shape reveals the next scene (chain of shape wipes)

type RShape = {a: number; b: number; c: number; tail?: boolean};
const CHAIN: RShape[] = [{a: 1.1, b: 0.75, c: 0.4, tail: true}, {a: 1.7, b: 0.55, c: 0.55}, {a: 1, b: 1, c: 1}, {a: 1.7, b: 0.55, c: 0.55}];
const cover = (s: RShape, dx: number, dy: number) => 1.05 * Math.max(dx / (s.a - 0.3 * s.c), dy / (s.b - 0.3 * s.c));

const RoundShape: React.FC<{s: RShape; cx: number; cy: number; k: number; fill: string; swing: number}> = ({s, cx, cy, k, fill, swing}) => {
  if (k <= 0.3) return null;
  const tail = s.tail ? `${f1(cx - 0.62 * s.a * k)},${f1(cy + s.b * k * 0.7)} ${f1(cx - 0.12 * s.a * k)},${f1(cy + s.b * k * 0.7)} ${f1(cx - (0.95 - swing) * s.a * k)},${f1(cy + (s.b + 0.5) * k)}` : '';
  return (
    <g fill={fill}>
      <rect x={cx - s.a * k} y={cy - s.b * k} width={2 * s.a * k} height={2 * s.b * k} rx={s.c * k} />
      {s.tail && <polygon points={tail} />}
    </g>
  );
};

export const BlobBubble: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  const id = useUid('bub');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const cols = pp.colors.length ? pp.colors : [pp.color];
  const cx = pp.x * w;
  const cy = pp.y * h;
  const dx = Math.max(cx, w - cx);
  const dy = Math.max(cy, h - cy);
  const S = cols.length + 1;
  const wd = 0.36;
  const kAt = (i: number, s: RShape) => cover(s, dx, dy) * E.inQuad(seg(p, (i * (1 - wd)) / (S - 1), (i * (1 - wd)) / (S - 1) + wd));
  const swing = 0.22 * Math.sin(p * 18);
  const last = CHAIN[(S - 1) % CHAIN.length].tail ? CHAIN[1] : CHAIN[(S - 1) % CHAIN.length];
  return (
    <AbsoluteFill>
      <Overlay w={w} h={h}>
        {cols.map((c, i) => {
          const s = CHAIN[i % CHAIN.length];
          return <RoundShape key={i} s={s} cx={cx} cy={cy} k={kAt(i, s)} fill={c} swing={swing} />;
        })}
      </Overlay>
      <Masked id={id} w={w} h={h} mask={<RoundShape s={last} cx={cx} cy={cy} k={kAt(S - 1, last)} fill="white" swing={0} />}>
        {children}
      </Masked>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// strip 'shutter' — x6 shutter close: the top half blacks out first, then the bottom; a strip then opens from the centre line

export const Shutter: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const black = pp.colors[0] ?? '#000000';
  if (p < 0.5) {
    const top = (h / 2) * E.inQuad(seg(p, 0, 0.22));
    const bot = (h / 2) * E.inQuad(seg(p, 0.14, 0.36));
    return (
      <AbsoluteFill>
        <Hidden>{children}</Hidden>
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: top + 0.5, background: black}} />
        <div style={{position: 'absolute', left: 0, bottom: 0, width: w, height: bot + 0.5, background: black}} />
      </AbsoluteFill>
    );
  }
  const cy = pp.y * h;
  const half = lerp(0, Math.max(cy, h - cy) + 2, E.inOutCubic(seg(p, 0.54, 1)));
  return (
    <AbsoluteFill style={{background: black}}>
      <AbsoluteFill style={{clipPath: `inset(${Math.max(0, cy - half)}px 0px ${Math.max(0, h - (cy + half))}px 0px)`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// page-turn 'curl3d' — paper-popup page-curl: the old leaf lifts from the spine and curls away as it turns (N strips, each
// foreshortened by its integrated angle, shaded, receding with perspective); the new scene shows where the leaf has left.
// Renders the old scene once per strip: keep `bands` (strips) at 12-20 and avoid very heavy three.js scenes.

type Curl = {X: number[]; Z: number[]; phi: number[]; N: number};
const curlGeom = (uu: number, N: number, bend: number): Curl => {
  const th = uu * (Math.PI / 2);
  const L = bend * Math.sin(Math.PI * uu);
  const X = [0];
  const Z = [0];
  const phi: number[] = [];
  for (let i = 0; i < N; i++) {
    const f = Math.min(Math.PI / 2, Math.max(0, th * (1 - L * ((i + 0.5) / N - 0.5))));
    phi.push(f);
    X.push(X[i] + Math.cos(f) / N);
    Z.push(Z[i] + Math.sin(f) / N);
  }
  return {X, Z, phi, N};
};
const zk = 0.6;
const mAt = (z: number) => 1 / (1 + z * zk);

export const Curl3d: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('c3');
  const gid = useUid('c3g');
  const ax = axisFor(pp.angle, w, h);
  const N = Math.max(6, Math.min(32, Math.round(pp.bands)));
  const uu = E.inOutCubic(clamp01(p));
  const g = curlGeom(uu, N, pp.size || 0.55);
  const tmid = (ax.tmin + ax.tmax) / 2;
  const sAt = (X: number) => ax.smin + X * ax.L;
  if (presentationDirection === 'exiting') {
    if (p >= 1) return <Hidden>{children}</Hidden>;
    const big = ax.L + ax.M;
    return (
      <AbsoluteFill>
        {Array.from({length: N}, (_, i) => {
          const s0 = ax.smin + (i / N) * ax.L;
          const kx = (g.X[i + 1] - g.X[i]) * N;
          const m = mAt((g.Z[i] + g.Z[i + 1]) / 2);
          const quad = [at(ax, sAt(g.X[i]) - 0.4, tmid - big), at(ax, sAt(g.X[i + 1]) + 0.4, tmid - big), at(ax, sAt(g.X[i + 1]) + 0.4, tmid + big), at(ax, sAt(g.X[i]) - 0.4, tmid + big)];
          const clip = `polygon(${quad.map(([x, y]) => `${f1(x)}px ${f1(y)}px`).join(',')})`;
          // linear part A = kx d d^T + m n n^T, translation (s0' - s0 kx) d + tmid (1 - m) n
          const a = kx * ax.dx * ax.dx + m * ax.nx * ax.nx;
          const c = kx * ax.dx * ax.dy + m * ax.nx * ax.ny;
          const b = c;
          const d = kx * ax.dy * ax.dy + m * ax.ny * ax.ny;
          const ts = sAt(g.X[i]) - s0 * kx;
          const tt = tmid * (1 - m);
          const e = ts * ax.dx + tt * ax.nx;
          const f = ts * ax.dy + tt * ax.ny;
          const dark = 0.4 * (1 - Math.cos(g.phi[i])) + 0.06 * (i / N) * uu;
          return (
            <AbsoluteFill key={i} style={{clipPath: clip}}>
              <AbsoluteFill style={{transformOrigin: '0 0', transform: `matrix(${a},${b},${c},${d},${e},${f})`}}>{children}</AbsoluteFill>
              <AbsoluteFill style={{background: `rgba(0,0,0,${dark.toFixed(3)})`}} />
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
    );
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  const top = Array.from({length: N + 1}, (_, i) => at(ax, sAt(g.X[i]), tmid - (ax.M / 2) * mAt(g.Z[i])));
  const bot = Array.from({length: N + 1}, (_, i) => at(ax, sAt(g.X[i]), tmid + (ax.M / 2) * mAt(g.Z[i]))).reverse();
  const leaf = poly([...top, ...bot]);
  const [x1, y1] = at(ax, sAt(g.X[N]), tmid);
  const [x2, y2] = at(ax, sAt(g.X[N]) + 0.16 * ax.L, tmid);
  return (
    <Masked id={id} w={w} h={h} mask={<><FullRect w={w} h={h} /><polygon points={leaf} fill="black" /></>}>
      {children}
      <Overlay w={w} h={h}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
            <stop offset="0" stopColor="#000" stopOpacity={0.4 * Math.sin(Math.PI * uu)} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={-10} y={-10} width={w + 20} height={h + 20} fill={`url(#${gid})`} />
        <polyline points={poly(top)} fill="none" stroke={pp.color} strokeWidth={2 * u} opacity={0.7} />
      </Overlay>
    </Masked>
  );
};

// ---------------------------------------------------------------------------------------------
// dots 'halftone' — lemo halftone-dot-wipe: a coarse grid of flat-colour circles grows with a diagonal ripple to full cover,
// each cell switches scene while covered, then the dots shrink away

export const Halftone: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  const id = useUid('hlf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const pitch = (pp.size || 0.074) * h;
  const cols = Math.ceil(w / pitch) + 1;
  const rows = Math.ceil(h / pitch) + 1;
  const ax = axisFor(pp.angle, w, h);
  const rmax = pitch * 0.78;
  const cells: {x: number; y: number; r: number; on: boolean; c: string}[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * pitch;
      const y = (j + 0.5) * pitch;
      const prog = ((x * ax.dx + y * ax.dy - ax.smin) / ax.L) || 0;
      const pl = clamp01((p - clamp01(prog) * 0.35) / 0.65);
      cells.push({x, y, r: Math.sin(Math.PI * pl) * rmax, on: pl >= 0.5, c: pp.colors.length ? pp.colors[(i + j) % pp.colors.length] : pp.color});
    }
  }
  return (
    <AbsoluteFill>
      <Masked
        id={id}
        w={w}
        h={h}
        mask={cells.filter((c) => c.on).map((c, k) => <rect key={k} x={c.x - pitch / 2 - 0.5} y={c.y - pitch / 2 - 0.5} width={pitch + 1} height={pitch + 1} fill="white" />)}
      >
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        {cells.filter((c) => c.r > 0.4).map((c, k) => <circle key={k} cx={c.x} cy={c.y} r={c.r} fill={c.c} />)}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// wipe 'brush' / 'soft' / 'mist' — lemo watercolor mist-erase: a wavy value-noise front reveals the next scene;
// 'mist' first washes the old scene back to blank paper with two wavy layers rising, then brushes the new scene in

const waveEdge = (ax: ReturnType<typeof axisFor>, seed: number, amp: number, step: number, t0 = 0): Edge =>
  sampleEdge(ax, (t) => amp * (n2(`wipe${seed}`, t / (ax.M * 0.16) + t0, t0) + 0.3 * n2(`wipeb${seed}`, t / (ax.M * 0.05), 3 + t0)), step, 20);

export const WipeX: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('wpx');
  const fid = useUid('wpxf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  if (pp.variant === 'mist') {
    const paper = pp.color;
    const ax1 = axisFor(pp.angle, w, h);
    const ax2 = axisFor(pp.angle + 90, w, h);
    const amp = 0.04 * ax1.L;
    const c1 = E.inOutCubic(seg(p, 0, 0.5));
    const lifts = [0.11 * ax1.L, 0];
    const layers = lifts.map((lift, i) => {
      const edge = sampleEdge(ax1, (t) => amp * (n2(`mist${pp.seed + i}`, t / (ax1.M * 0.16), 0) + 0.15 * Math.sin(t / (ax1.M * 0.1) + p * 5)), 40 * u, 20);
      return <polygon key={i} points={region(ax1, lerp(ax1.smin - amp * 2, ax1.smax + amp * 2, c1) + lift * 4 * c1 * (1 - c1), edge)} fill={paper} opacity={i === 0 ? 0.55 : 1} />;
    });
    if (p < 0.5) {
      return (
        <AbsoluteFill>
          <Hidden>{children}</Hidden>
          <Overlay w={w} h={h}>{layers}</Overlay>
        </AbsoluteFill>
      );
    }
    const amp2 = 0.045 * ax2.L;
    const S2 = lerp(ax2.smin - amp2 * 3, ax2.smax + amp2 * 3, E.inOutCubic(seg(p, 0.5, 1)));
    const edge2 = waveEdge(ax2, pp.seed, amp2, 12 * u);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{background: paper}} />
        <Masked id={id} w={w} h={h} mask={<polygon points={region(ax2, S2, edge2)} fill="white" />}>
          {children}
        </Masked>
      </AbsoluteFill>
    );
  }
  const ax = axisFor(pp.angle, w, h);
  if (pp.variant === 'soft') {
    const fw = (pp.size || 0.12) * ax.L;
    const S = lerp(ax.smin - fw, ax.smax + fw, E.inOutCubic(p));
    return (
      <Masked id={id} w={w} h={h} defs={<BlurFilter id={fid} sd={fw / 2} w={w} h={h} />} mask={<polygon points={region(ax, S, straight(ax))} fill="white" filter={`url(#${fid})`} />}>
        {children}
      </Masked>
    );
  }
  // brush
  const amp = (pp.size || 0.04) * ax.L;
  const S = lerp(ax.smin - amp * 1.6, ax.smax + amp * 1.6, E.inOutCubic(p));
  const edge = waveEdge(ax, pp.seed, amp, 12 * u);
  const rim = edge.map(([t, ds]) => at(ax, S + ds, t));
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, S, edge)} fill="white" />}>
        {children}
      </Masked>
      {pp.rim > 0 && (
        <Overlay w={w} h={h}>
          <polyline points={poly(rim)} fill="none" stroke={pp.color} strokeWidth={pp.rim * u} strokeLinejoin="round" opacity={0.5} />
        </Overlay>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// diagonal 'band' — lemo telestrator package-wipe: a fat slanted colour band with dark edges sweeps across, the scene swaps behind it

export const PackageBand: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('pkb');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ltr = Math.cos((pp.angle * Math.PI) / 180) >= 0;
  const sg = ltr ? 1 : -1;
  const shear = 0.38;
  const bw = (pp.size || 0.27) * w;
  const reach = bw / 2 + shear * h * 0.5 + 10 * u;
  const xc0 = ltr ? lerp(-reach, w + reach, E.inOutCubic(p)) : lerp(w + reach, -reach, E.inOutCubic(p));
  const xc = (y: number) => xc0 - sg * shear * (y - h / 2);
  const y0 = -20;
  const y1 = h + 20;
  const lead = 40 * u;
  const trail = 18 * u;
  const quad = (a: number, b: number) => poly([[xc(y0) + a, y0], [xc(y0) + b, y0], [xc(y1) + b, y1], [xc(y1) + a, y1]]);
  const half = bw / 2;
  const behind = ltr ? poly([[-w * 2, y0], [xc(y0), y0], [xc(y1), y1], [-w * 2, y1]]) : poly([[xc(y0), y0], [w * 3, y0], [w * 3, y1], [xc(y1), y1]]);
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={behind} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <polygon points={quad(-half, half)} fill={pp.color} />
        <polygon points={ltr ? quad(half - lead, half) : quad(-half, -half + lead)} fill={pp.colors[0] ?? '#0B0F14'} />
        <polygon points={ltr ? quad(-half, -half + trail) : quad(half - trail, half)} fill={pp.colors[0] ?? '#0B0F14'} />
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// diagonal 'strips' — lemo spy-titles shattering: the old frame breaks into parallel strips along `angle` that slide away in
// alternating directions, staggered from the centre. Renders the old scene once per strip.

export const DiagStrips: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('dst');
  const ax = axisFor(pp.angle, w, h);
  const sw0 = (pp.size || 0.24) * h;
  const N = Math.max(2, Math.min(14, Math.ceil(ax.M / sw0)));
  const sw = ax.M / N;
  const stag = Math.min(0.045, 0.28 / (N / 2));
  const D = (i: number) => {
    const delay = Math.abs(i - (N - 1) / 2) * stag;
    const e = E.inQuad(seg(p, delay, Math.min(1, delay + 0.72)));
    return (i % 2 ? 1 : -1) * (ax.L * 1.04 + 20 * u) * e;
  };
  const band = (i: number, s0: number, s1: number) => [at(ax, s0, ax.tmin + i * sw), at(ax, s1, ax.tmin + i * sw), at(ax, s1, ax.tmin + (i + 1) * sw + 0.5), at(ax, s0, ax.tmin + (i + 1) * sw + 0.5)] as Pt[];
  if (presentationDirection === 'exiting') {
    if (p >= 1) return <Hidden>{children}</Hidden>;
    return (
      <AbsoluteFill>
        {Array.from({length: N}, (_, i) => {
          const q = band(i, ax.smin - 30, ax.smax + 30);
          const d = D(i);
          return (
            <AbsoluteFill key={i} style={{clipPath: `polygon(${q.map(([x, y]) => `${f1(x)}px ${f1(y)}px`).join(',')})`}}>
              <AbsoluteFill style={{transform: `translate(${f1(ax.dx * d)}px, ${f1(ax.dy * d)}px)`}}>{children}</AbsoluteFill>
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
    );
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  const mask: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const d = D(i);
    if (d > 0) mask.push(<polygon key={i} points={poly(band(i, ax.smin - ax.L, ax.smin + d))} fill="white" />);
    else if (d < 0) mask.push(<polygon key={i} points={poly(band(i, ax.smax + d, ax.smax + ax.L))} fill="white" />);
  }
  return (
    <Masked id={id} w={w} h={h} mask={mask}>
      {children}
    </Masked>
  );
};

// ---------------------------------------------------------------------------------------------
// bands 'rows' / 'cols' / 'quarter' — lemo pictogram-motion grid-snap cuts: rows of the new scene slide in from alternating
// sides, columns drop / rise, or quarter-discs grow from every cell corner. rows / cols render the new scene once per row / column.

export const GridCut: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h} = useFrameSize();
  const id = useUid('grc');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const v = pp.variant;
  if (v === 'quarter') {
    const cell = (pp.size || 1 / 6) * h;
    const cols = Math.ceil(w / cell) + 1;
    const rows = Math.ceil(h / cell) + 1;
    const mask: React.ReactNode[] = [];
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const d = (i + j) / (cols + rows);
        const r = cell * 0.73 * E.inOutCubic(seg(p, d * 0.25, d * 0.25 + 0.75));
        if (r > 0.3) mask.push(<circle key={`${i}_${j}`} cx={i * cell} cy={j * cell} r={r} fill="white" />);
      }
    }
    return (
      <Masked id={id} w={w} h={h} mask={mask}>
        {children}
      </Masked>
    );
  }
  const rows = v === 'rows';
  const N = Math.max(2, Math.round(pp.bands));
  const size = (rows ? h : w) / N;
  const stag = Math.min(0.05, 0.3 / N);
  return (
    <AbsoluteFill>
      {Array.from({length: N}, (_, i) => {
        const e = E.inOutCubic(seg(p, i * stag, i * stag + (1 - N * stag)));
        const sg = i % 2 ? 1 : -1;
        const a = i * size - 0.5;
        const b = (i + 1) * size + 0.5;
        const clip = rows ? `inset(${a}px 0px ${h - b}px 0px)` : `inset(0px ${w - b}px 0px ${a}px)`;
        const tr = rows ? `translateX(${sg * w * (1 - e)}px)` : `translateY(${sg * h * (1 - e)}px)`;
        return (
          <AbsoluteFill key={i} style={{clipPath: clip}}>
            <AbsoluteFill style={{transform: tr}}>{children}</AbsoluteFill>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// slide 'scroll' — lemo ukiyoe handscroll: the scenes are prints on one long mounting scroll; the camera slides across the mount gap

export const Scroll: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const ax = axisFor(pp.angle, w, h);
  const gap = (pp.size || 0.135) * ax.L;
  const pos = E.inOutCubic(clamp01(p));
  const shift = (ax.L + gap) * pos;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{transform: `translate(${f1(ax.dx * shift)}px, ${f1(ax.dy * shift)}px)`}}>{children}</AbsoluteFill>;
  }
  const off = (ax.L + gap) * (1 - pos);
  const s0 = ax.smax - off; // far edge of the new print, in the direction of travel
  const lo = [at(ax, s0, ax.tmin - 40), at(ax, s0 + gap, ax.tmin - 40), at(ax, s0 + gap, ax.tmax + 40), at(ax, s0, ax.tmax + 40)] as Pt[];
  const ln = (s: number) => poly([at(ax, s, ax.tmin - 40), at(ax, s, ax.tmax + 40)]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${f1(-ax.dx * off)}px, ${f1(-ax.dy * off)}px)`}}>{children}</AbsoluteFill>
      <Overlay w={w} h={h}>
        <polygon points={poly(lo)} fill={pp.color} />
        <polyline points={ln(s0)} stroke="#000" strokeOpacity={0.35} strokeWidth={3 * u} />
        <polyline points={ln(s0 + gap)} stroke="#000" strokeOpacity={0.35} strokeWidth={3 * u} />
        <polyline points={ln(s0 + gap * 0.5)} stroke="#000" strokeOpacity={0.08} strokeWidth={gap * 0.8} />
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// tear 'peel' — mg-styles-15 collage paper-tear-peel: a jagged rip runs top to bottom, the page shakes, then both halves peel
// away, curling over to show their kraft back. Renders the old scene twice.

export const TearPeel: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('tpl');
  const gid = useUid('tplg');
  const gid2 = useUid('tplh');
  const r = rng(pp.seed * 53 + 11);
  const line: Pt[] = [];
  const y0 = -60 * u;
  const y1 = h + 60 * u;
  const x0 = (pp.x || 0.5) * w * 1.2;
  const x1 = (pp.x || 0.5) * w * 0.8;
  for (let y = y0; y < y1 + 40 * u; y += (22 + r() * 22) * u) {
    const t = clamp01((y - y0) / (y1 - y0));
    line.push([lerp(x0, x1, t) + Math.sin(y * 0.012 / u) * 22 * u + Math.sin(y * 0.04 / u) * 8 * u + (r() - 0.5) * 14 * u, y]);
  }
  const rip = clamp01(p / 0.28);
  const e = E.inCubic(seg(p, 0.38, 1));
  const D = w * 0.78;
  const shake: Pt = p >= 0.28 && p < 0.38 ? (p < 0.33 ? [6 * u, -5 * u] : [-3 * u, 3 * u]) : [0, 0];
  const tf = (side: -1 | 1) => ({tx: shake[0] + side * D * e, ty: shake[1] - 0.04 * h * e, rot: side * 7 * e});
  const leftPoly: Pt[] = [[-w, y0], ...line, [-w, y1]];
  const rightPoly: Pt[] = [[w * 2, y0], ...line, [w * 2, y1]];
  const ox = (pp.x || 0.5) * w;
  const oy = h;
  const bw = seg(p, 0.34, 0.6) * lerp(70, 130, e) * u;
  const shown = line.slice(0, Math.max(2, Math.ceil(rip * line.length)));
  const clip = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${f1(x)}px ${f1(y)}px`).join(',')})`;
  const half = (side: -1 | 1) => {
    const t = tf(side);
    const band = poly([...line.map(([x, y]): Pt => [x, y]), ...line.map(([x, y]): Pt => [x - side * bw, y]).reverse()]);
    return (
      <AbsoluteFill key={side} style={{clipPath: clip(side < 0 ? leftPoly : rightPoly), transformOrigin: `${ox}px ${oy}px`, transform: `translate(${f1(t.tx)}px, ${f1(t.ty)}px) rotate(${t.rot}deg)`}}>
        {children}
        <Overlay w={w} h={h}>
          <defs>
            <linearGradient id={side < 0 ? gid : gid2} gradientUnits="objectBoundingBox" x1={side < 0 ? 1 : 0} y1={0} x2={side < 0 ? 0 : 1} y2={0}>
              <stop offset="0" stopColor="#3a2410" stopOpacity={0.55} />
              <stop offset="0.45" stopColor="#fff" stopOpacity={0.12} />
              <stop offset="1" stopColor="#3a2410" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          {bw > 1 && <polygon points={band} fill={pp.colors[0] ?? '#C9A77A'} />}
          {bw > 1 && <polygon points={band} fill={`url(#${side < 0 ? gid : gid2})`} />}
          <polyline points={poly(shown)} fill="none" stroke={pp.color} strokeWidth={5 * u} strokeLinejoin="round" opacity={0.9} />
        </Overlay>
      </AbsoluteFill>
    );
  };
  if (presentationDirection === 'exiting') {
    if (p >= 1) return <Hidden>{children}</Hidden>;
    return (
      <AbsoluteFill>
        {half(-1)}
        {half(1)}
      </AbsoluteFill>
    );
  }
  if (p >= 1) return <Plain>{children}</Plain>;
  const svgT = (side: -1 | 1) => {
    const t = tf(side);
    return `translate(${f1(ox + t.tx)} ${f1(oy + t.ty)}) rotate(${t.rot}) translate(${f1(-ox)} ${f1(-oy)})`;
  };
  return (
    <Masked
      id={id}
      w={w}
      h={h}
      mask={
        <>
          <FullRect w={w} h={h} />
          <polygon points={poly(leftPoly)} fill="black" transform={svgT(-1)} />
          <polygon points={poly(rightPoly)} fill="black" transform={svgT(1)} />
        </>
      }
    >
      {children}
    </Masked>
  );
};

// ---------------------------------------------------------------------------------------------
// zoom 'snap' — x3 snap dolly: a very fast eased camera move (easeInOutCubic) that reads like a cut but is continuous; the old
// scene dollies in by `size`x (default 3.2) toward (x, y) with motion blur and the new scene arrives from 1 / size

export const ZoomSnap: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {u} = useFrameSize();
  const S = pp.size > 1 ? pp.size : 3.2;
  const e = E.inOutCubic(clamp01(p));
  const origin = `${pp.x * 100}% ${pp.y * 100}%`;
  const blur = Math.sin(Math.PI * clamp01(p)) * 14 * u;
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{transform: `scale(${Math.pow(S, e)})`, transformOrigin: origin, opacity: 1 - sstep(0.5, 0.62, p), filter: `blur(${blur}px)`}}>
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{transform: `scale(${Math.pow(S, e - 1)})`, transformOrigin: origin, opacity: sstep(0.38, 0.55, p), filter: `blur(${blur}px)`}}>
      {children}
    </AbsoluteFill>
  );
};
