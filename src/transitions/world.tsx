// Pillar adapted from lemo-opuscar/styles/shadow-puppet/demo/stage.js (foreground posts), scan from
// lemo-opuscar/styles/satellite-briefing/demo/engine.js (soft scan front, swath glow, map wipe) and burn from
// pdoom-video/app/src/scenes/bureau.ts (page burn-through) (MIT, © their authors) — see THIRD_PARTY_NOTICES.md.
// Occluder variants and layer-swap rebuilt from the x5 reference video.
import React from 'react';
import {
  AbsoluteFill,
  at,
  Axis,
  axisFor,
  bandPoly,
  BlurFilter,
  C,
  clamp01,
  E,
  Edge,
  frontLine,
  FullRect,
  hash01,
  Hidden,
  lerp,
  Masked,
  mix,
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

// ---------------------------------------------------------------------------------------------
// occluder — x5 foreground-occluder + shadow-puppet pillar-wipe: a near-camera prop, softly blurred
// (depth of field), passes in front of the lens and hides the cut; the next scene is revealed behind
// its trailing edge.
//   (default) 'pillar'  — a huge dark blurred stage post trucks across
//   'trunks'  — three tree trunks at different depths (parallax, nearest fastest/blurriest) with fronds
//   'foliage' — fern fronds close in from all four edges to a leaf-dark frame, then part
//   'clouds'  — a scalloped cloud bank rolls down over the frame
//   'waves'   — a wall of waves with foam crests rises up through the frame

const scallops = (ax: Axis, seed: number, rMin: number, rMax: number) => {
  const arcs: {c: number; r: number}[] = [];
  let i = 0;
  for (let c = ax.tmin - rMax * 2; c < ax.tmax + rMax * 2; i++) {
    const r = rMin + (rMax - rMin) * hash01(i * 4.7 + seed);
    arcs.push({c: c + r * 0.8, r});
    c += r * 1.5;
  }
  return (t: number) => {
    let best = 0;
    for (const a of arcs) if (Math.abs(t - a.c) <= a.r) best = Math.max(best, a.r * Math.sqrt(Math.max(0, 1 - ((t - a.c) / a.r) ** 2)));
    return best;
  };
};

const Frond: React.FC<{len: number; col: string; seed: number; u: number}> = ({len, col, seed, u}) => {
  const n = 14;
  const leaves: React.ReactNode[] = [];
  const bend = (hash01(seed * 3.3) - 0.5) * 0.5;
  const P = (t: number): [number, number] => [t * len, Math.sin(t * 2.2) * bend * len * 0.25];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const [x, y] = P(t);
    const s = (1 - t * 0.75) * len * 0.16;
    for (const side of [-1, 1]) {
      leaves.push(
        <ellipse
          key={`${i}${side}`}
          cx={x + s * 0.35}
          cy={y + side * s * 0.5}
          rx={s * 0.75}
          ry={s * 0.24}
          transform={`rotate(${side * 52 - 10 * side * t} ${x + s * 0.35} ${y + side * s * 0.5})`}
          fill={mix(col, '#000000', 0.05 + 0.12 * hash01(i + seed))}
        />,
      );
    }
  }
  return (
    <g>
      <polyline points={ptsStr(Array.from({length: 12}, (_, k) => P(k / 11)))} fill="none" stroke={mix(col, '#000000', 0.3)} strokeWidth={4 * u} />
      {leaves}
    </g>
  );
};

const Foliage: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const fid = useUid('folf');
  if (presentationDirection === 'exiting') return p >= 0.5 ? <Hidden>{children}</Hidden> : <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const close = E.outCubic(seg(p, 0, 0.45));
  const part = E.inCubic(seg(p, 0.55, 1));
  const k = close * (1 - part);
  const md = Math.min(w, h);
  const fronds: React.ReactNode[] = [];
  const count = 30;
  for (let i = 0; i < count; i++) {
    const side = i % 4;
    const t = (Math.floor(i / 4) + 0.5 + 0.4 * (hash01(i * 2.9 + pp.seed) - 0.5)) / Math.ceil(count / 4);
    const [ax0, ay0] = side === 0 ? [t * w, -0.05 * h] : side === 1 ? [w * 1.05, t * h] : side === 2 ? [(1 - t) * w, h * 1.05] : [-0.05 * w, (1 - t) * h];
    const toC = Math.atan2(h / 2 - ay0, w / 2 - ax0) + (hash01(i * 7.7) - 0.5) * 0.9;
    const len = md * (0.55 + 0.45 * hash01(i * 5.1 + pp.seed));
    const out = (1 - k) * len * 1.1;
    const x = ax0 - Math.cos(toC) * out;
    const y = ay0 - Math.sin(toC) * out;
    const shade = 0.55 + 0.35 * hash01(i * 1.3);
    fronds.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${(toC * 180) / Math.PI})`}>
        <Frond len={len} col={mix('#000000', pp.color, shade)} seed={i + pp.seed} u={u} />
      </g>,
    );
  }
  const flat = sstep(0.3, 0.46, p) * (1 - sstep(0.54, 0.7, p));
  return (
    <AbsoluteFill>
      {p >= 0.5 ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={5 * u} w={w} h={h} />
        </defs>
        <g filter={`url(#${fid})`}>
          {fronds}
          {flat > 0 && <rect x={0} y={0} width={w} height={h} fill={mix('#000000', pp.color, 0.8)} opacity={flat} />}
        </g>
      </Overlay>
    </AbsoluteFill>
  );
};

const Sweeper: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('occ');
  const fid = useUid('occf');
  const bid = useUid('occb');
  const gid = useUid('occg');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const v = pp.variant;
  const ax = axisFor(pp.angle, w, h);
  const step = 8 * u;
  const pad = 60 * u;
  type Prop = {S: number; Wd: number; lead: Edge; trail: Edge; draw: (poly: string) => React.ReactNode; blur: number};
  const props: Prop[] = [];
  let cut: {S: number; trail: Edge} = {S: ax.smin - 10, trail: straight(ax)};
  if (v === 'trunks') {
    const defs = [
      {wd: 0.1, win: [0, 1], blur: 3, shade: 0.75},
      {wd: 0.17, win: [0.04, 0.96], blur: 8, shade: 0.55},
      {wd: 0.36, win: [0.14, 0.9], blur: 16, shade: 0.35},
    ];
    defs.forEach((d, k) => {
      const Wd = d.wd * ax.L;
      const q = E.inOutQuad(seg(p, d.win[0], d.win[1]));
      const S = lerp(ax.smin - 20 * u, ax.smax + Wd + 60 * u, q);
      const wob = (t: number) => Math.sin(t / (90 * u) + k) * 6 * u + Math.sin(t / (31 * u) + k * 2) * 2 * u;
      const lead = sampleEdge(ax, (t) => wob(t) + 0.03 * Wd * ((t - ax.tmin) / ax.M), step, pad);
      const trail = sampleEdge(ax, (t) => wob(t + 50 * u) - 0.03 * Wd * ((t - ax.tmin) / ax.M), step, pad);
      const col = mix('#000000', pp.color, 0.6 + d.shade);
      props.push({
        S,
        Wd,
        lead,
        trail,
        blur: d.blur * u,
        draw: (poly) => (
          <g>
            <polygon points={poly} fill={col} />
            {Array.from({length: 7}, (_, j) => {
              const o = (0.1 + 0.8 * (j / 6)) * Wd;
              return <polyline key={j} points={frontLine(ax, S - o, trail.map(([t, ds]) => [t, ds * 0.5] as [number, number]))} fill="none" stroke={j % 2 ? '#000' : mix(col, '#ffffff', 0.25)} strokeOpacity={0.25} strokeWidth={(3 + 5 * hash01(j + k)) * u} />;
            })}
            <polyline points={frontLine(ax, S, lead, -4 * u)} fill="none" stroke={mix(col, '#ffd9a8', 0.4)} strokeOpacity={0.5} strokeWidth={4 * u} />
          </g>
        ),
      });
      if (k === 2) cut = {S: S - Wd, trail};
    });
  } else {
    const kind = v === 'clouds' ? 'clouds' : v === 'waves' ? 'waves' : 'pillar';
    const Wd = (kind === 'pillar' ? 0.48 : 0.9) * ax.L;
    const ease = kind === 'pillar' ? E.inOutQuad : E.inOutCubic;
    let leadFn: (t: number) => number;
    let trailFn: (t: number) => number;
    let ext = 0;
    if (kind === 'clouds') {
      const a = scallops(ax, pp.seed * 3, 0.05 * ax.M, 0.11 * ax.M);
      const b = scallops(ax, pp.seed * 3 + 9, 0.05 * ax.M, 0.1 * ax.M);
      leadFn = (t) => a(t);
      trailFn = (t) => -b(t);
      ext = 0.11 * ax.M;
    } else if (kind === 'waves') {
      const lam = 0.22 * ax.M;
      leadFn = (t) => 0.05 * ax.M * Math.pow(0.5 + 0.5 * Math.sin((t / lam) * 6.283 + p * 4), 2.2) + 0.02 * ax.M * Math.sin(t / (0.07 * ax.M) - p * 6);
      trailFn = (t) => -0.04 * ax.M * Math.pow(0.5 + 0.5 * Math.sin((t / (lam * 0.8)) * 6.283 - p * 3 + 1), 2.2);
      ext = 0.08 * ax.M;
    } else {
      leadFn = () => 0;
      trailFn = () => 0;
    }
    const S = lerp(ax.smin - ext - 40 * u, ax.smax + Wd + ext + 40 * u, ease(p));
    const lead = sampleEdge(ax, leadFn, step, pad);
    const trail = sampleEdge(ax, trailFn, step, pad);
    const blur = (kind === 'pillar' ? 26 : kind === 'clouds' ? 7 : 4) * u;
    const [g1x, g1y] = at(ax, S - Wd, 0);
    const [g2x, g2y] = at(ax, S, 0);
    const draw = (poly: string) => {
      if (kind === 'pillar') {
        return (
          <g>
            <polygon points={poly} fill={pp.color} />
            <polyline points={frontLine(ax, S, lead, -0.06 * Wd)} fill="none" stroke={mix(pp.color, '#ff9a5a', 0.35)} strokeOpacity={0.5} strokeWidth={0.04 * Wd} />
          </g>
        );
      }
      if (kind === 'clouds') {
        return (
          <g>
            <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={g1x} y1={g1y} x2={g2x} y2={g2y}>
              <stop offset="0" stopColor={mix(pp.color, '#7a86a0', 0.35)} />
              <stop offset="1" stopColor={pp.color} />
            </linearGradient>
            <polygon points={poly} fill={`url(#${gid})`} />
            {[0.2, 0.42, 0.66].map((o, j) => (
              <polyline key={j} points={frontLine(ax, S - o * Wd, lead.map(([t, ds]) => [t + j * 60 * u, ds * 0.8] as [number, number]))} fill="none" stroke={mix(pp.color, '#8892aa', 0.3)} strokeOpacity={0.35} strokeWidth={14 * u} />
            ))}
            <polyline points={frontLine(ax, S, lead, -6 * u)} fill="none" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={6 * u} />
          </g>
        );
      }
      return (
        <g>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={g1x} y1={g1y} x2={g2x} y2={g2y}>
            <stop offset="0" stopColor={mix(pp.color, '#000000', 0.35)} />
            <stop offset="0.8" stopColor={pp.color} />
            <stop offset="1" stopColor={mix(pp.color, '#9fe0ff', 0.45)} />
          </linearGradient>
          <polygon points={poly} fill={`url(#${gid})`} />
          {[0.15, 0.3, 0.5, 0.7].map((o, j) => (
            <polyline key={j} points={frontLine(ax, S - o * Wd, lead.map(([t, ds]) => [t + j * 90 * u, ds * 0.6] as [number, number]))} fill="none" stroke={mix(pp.color, '#ffffff', 0.35)} strokeOpacity={0.3} strokeWidth={5 * u} />
          ))}
          <polyline points={frontLine(ax, S, lead, -5 * u)} fill="none" stroke="#ffffff" strokeOpacity={0.9} strokeWidth={10 * u} strokeLinejoin="round" />
          <polyline points={frontLine(ax, S - Wd, trail, 5 * u)} fill="none" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={8 * u} strokeLinejoin="round" />
        </g>
      );
    };
    props.push({S, Wd, lead, trail, blur, draw});
    cut = {S: S - Wd, trail};
  }
  const maskBlur = props[props.length - 1].blur * 0.6;
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} defs={<BlurFilter id={bid} sd={Math.max(0.5, maskBlur)} w={w} h={h} />} mask={<polygon points={region(ax, cut.S, cut.trail)} fill="white" filter={`url(#${bid})`} />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          {props.map((pr, k) => (
            <BlurFilter key={k} id={`${fid}${k}`} sd={Math.max(0.5, pr.blur)} w={w} h={h} />
          ))}
        </defs>
        {props.map((pr, k) => (
          <g key={k}>
            <polygon points={bandPoly(ax, pr.S - pr.Wd, pr.trail, pr.S, pr.lead)} fill="#000" opacity={0.25} transform={`translate(${at(ax, 0.04 * pr.Wd, 0).join(' ')})`} filter={`url(#${fid}${k})`} />
            <g filter={`url(#${fid}${k})`}>{pr.draw(bandPoly(ax, pr.S - pr.Wd, pr.trail, pr.S, pr.lead))}</g>
          </g>
        ))}
      </Overlay>
    </AbsoluteFill>
  );
};

export const Occluder: C = (props) => (props.passedProps.variant === 'foliage' ? <Foliage {...props} /> : <Sweeper {...props} />);

// ---------------------------------------------------------------------------------------------
// layer-swap — x5 layer-swap (pop-up book): the old scene is cut into paper layers along wavy
// horizon contours; the layers drop out near-to-far (easeInCubic, vertical motion blur) until only the
// sky is left, the sky cross-fades to the new sky, and the new layers rise far-to-near (easeOutCubic).

const CONTOURS = [0.4, 0.6, 0.79];

const contour = (j: number, w: number, h: number, seed: number) => {
  const pts: [number, number][] = [];
  const base = CONTOURS[j] * h;
  const amp = (0.035 + 0.015 * j) * h;
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * (w + 40) - 20;
    const t = x / w;
    pts.push([x, base - amp * (0.6 * Math.sin(t * (3 + j) * 3.14 + seed + j * 1.7) + 0.4 * Math.sin(t * (7 + 2 * j) * 3.14 - j + seed * 2))]);
  }
  return pts;
};

/** layer k: 0 = sky (top), 1..3 = hills -> foreground (bottom) */
const layerPoly = (k: number, w: number, h: number, seed: number) => {
  const top = k === 0 ? [[-20, -h], [w + 20, -h]] : contour(k - 1, w, h, seed);
  const bot = k === 3 ? [[w + 20, h * 2], [-20, h * 2]] : [...contour(k, w, h, seed)].reverse();
  return ptsStr([...top, ...bot]);
};

export const LayerSwap: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const base = useUid('lsw');
  const exiting = presentationDirection === 'exiting';
  if (!exiting && p >= 1) return <Plain>{children}</Plain>;
  if (exiting && p >= 0.62) return <Hidden>{children}</Hidden>;
  const dt = 0.02;
  const layers: {k: number; y: number; v: number; op: number}[] = [];
  if (exiting) {
    // sky stays; layers 3 (near) .. 1 (far) drop
    layers.push({k: 0, y: 0, v: 0, op: 1});
    for (const k of [1, 2, 3]) {
      const i = 3 - k; // 0 = nearest
      const yAt = (pv: number) => (0.62 - 0.08 * i) * h * E.inCubic(seg(pv, i * 0.08, i * 0.08 + 0.2));
      layers.push({k, y: yAt(p), v: (yAt(p + dt) - yAt(p - dt)) / (2 * dt * D), op: 1});
    }
  } else {
    const sky = E.inOutQuad(seg(p, 0.34, 0.52));
    if (sky <= 0) return <Hidden>{children}</Hidden>;
    layers.push({k: 0, y: 0, v: 0, op: sky});
    for (const k of [1, 2, 3]) {
      const j = k - 1; // 0 = farthest
      const st = 0.5 + j * 0.1;
      const rise = (0.16 + 0.08 * j) * h;
      const yAt = (pv: number) => rise * (1 - E.outCubic(seg(pv, st, st + 0.22)));
      const q = seg(p, st, st + 0.22);
      layers.push({k, y: yAt(p), v: (yAt(p + dt) - yAt(p - dt)) / (2 * dt * D), op: q > 0 ? 1 : 0});
    }
  }
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          {layers.map((l) => (
            <React.Fragment key={l.k}>
              <mask id={`${base}m${l.k}`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={-w} y={-h} width={3 * w} height={3 * h}>
                <polygon points={layerPoly(l.k, w, h, pp.seed)} fill="white" />
              </mask>
              <filter id={`${base}b${l.k}`} x="-5%" y="-30%" width="110%" height="160%">
                <feGaussianBlur stdDeviation={`0 ${Math.min(30 * u, Math.abs(l.v) * 0.5).toFixed(1)}`} />
              </filter>
            </React.Fragment>
          ))}
        </defs>
      </svg>
      {layers.map((l) =>
        l.op <= 0 ? null : (
          <AbsoluteFill key={l.k} style={{transform: `translateY(${l.y}px)`, opacity: l.op, filter: Math.abs(l.v) > 1 ? `url(#${base}b${l.k})` : undefined}}>
            <AbsoluteFill style={{mask: `url(#${base}m${l.k})`, WebkitMask: `url(#${base}m${l.k})`}}>{children}</AbsoluteFill>
            {l.k > 0 && (
              <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
                <polyline points={ptsStr(contour(l.k - 1, w, h, pp.seed))} fill="none" stroke="#000" strokeOpacity={0.28} strokeWidth={10 * u} transform={`translate(0 ${-5 * u})`} style={{filter: `blur(${6 * u}px)`}} />
                <polyline points={ptsStr(contour(l.k - 1, w, h, pp.seed))} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.6 * u} />
              </svg>
            )}
          </AbsoluteFill>
        ),
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// burn — pdoom bureau page burn-through: the next scene's spark travels UNDER the page (its light shows
// through), bursts through, burns the page in two along its path (orange ember edge, char), and the
// two halves swing away revealing the next scene. `y` = burn line, `color` = ember.

type Aff = [number, number, number, number, number, number]; // a b c d e f  (x' = a x + c y + e)
const affPt = (m: Aff, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const rotAbout = (deg: number, px: number, py: number, dx: number, dy: number, s: number): Aff => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a) * s;
  const sn = Math.sin(a) * s;
  return [c, sn, -sn, c, px - c * px + sn * py + dx, py - sn * px - c * py + dy];
};

export const Burn: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('brn');
  const gid = useUid('brng');
  const fid = useUid('brnf');
  const cy = pp.y * h;
  const path: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const x = (i / 64) * (w + 80 * u) - 40 * u;
    const t = x / w;
    path.push([x, cy + 0.06 * h * Math.sin(t * 5.2 + pp.seed) + 0.025 * h * Math.sin(t * 13 - pp.seed) + (hash01(i * 3.1 + pp.seed) - 0.5) * 12 * u]);
  }
  const A = 0.34; // spark run
  const B = 0.46; // burst
  const ign = E.outCubic(seg(p, A, B + 0.06));
  const gap = 0.012 * h * ign;
  const sw = E.inCubic(seg(p, B, 1));
  const topPoly: [number, number][] = [[-40 * u, -h * 0.5], [w + 40 * u, -h * 0.5], ...[...path].reverse().map(([x, y]) => [x, y - gap] as [number, number])];
  const botPoly: [number, number][] = [...path.map(([x, y]) => [x, y + gap] as [number, number]), [w + 40 * u, h * 1.5], [-40 * u, h * 1.5]];
  const mTop = rotAbout(-24 * sw, 0, 0, 0.08 * w * sw, -0.85 * h * sw, 1 + 0.12 * sw);
  const mBot = rotAbout(20 * sw, 0, h, 0.05 * w * sw, 0.9 * h * sw, 1 + 0.12 * sw);
  if (presentationDirection === 'exiting') {
    if (p >= 1) return <Hidden>{children}</Hidden>;
    const sx = lerp(-0.08 * w, 1.08 * w, E.inOutQuad(seg(p, 0, A)));
    const half = (poly: [number, number][], m: Aff, key: string, sign: 1 | -1) => (
      <AbsoluteFill key={key} style={{transform: `matrix(${m.map((v) => v.toFixed(5)).join(',')})`, transformOrigin: '0 0'}}>
        <AbsoluteFill style={{clipPath: `polygon(${poly.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`}}>
          {children}
          {ign > 0 && (
            <Overlay w={w} h={h}>
              <polyline points={ptsStr(path.map(([x, y]) => [x, y + sign * gap]))} fill="none" stroke="#1a0c04" strokeOpacity={0.85} strokeWidth={40 * u * ign} filter={`url(#${fid})`} />
              <polyline points={ptsStr(path.map(([x, y]) => [x, y + sign * gap]))} fill="none" stroke={pp.color} strokeWidth={9 * u * ign} filter={`url(#${fid})`} />
              <polyline points={ptsStr(path.map(([x, y]) => [x, y + sign * gap]))} fill="none" stroke="#ffe08a" strokeWidth={3 * u * ign} />
            </Overlay>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
    // spark glow under the page during the run
    const glow =
      p < B + 0.05 ? (
        <Overlay w={w} h={h} style={{mixBlendMode: 'screen'}}>
          <defs>
            <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={sx} cy={(path[Math.max(0, Math.min(64, Math.round(((sx + 40 * u) / (w + 80 * u)) * 64)))] ?? [0, cy])[1]} r={0.22 * h}>
              <stop offset="0" stopColor="#fff2c0" stopOpacity={0.9} />
              <stop offset="0.25" stopColor={pp.color} stopOpacity={0.55} />
              <stop offset="1" stopColor={pp.color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={w} height={h} fill={`url(#${gid})`} opacity={1 - seg(p, A, B + 0.05)} />
          <polyline points={ptsStr(path.filter(([x]) => x < sx))} fill="none" stroke={pp.color} strokeOpacity={0.35 * (1 - ign)} strokeWidth={14 * u} filter={`url(#${fid})`} />
        </Overlay>
      ) : null;
    return (
      <AbsoluteFill>
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <BlurFilter id={fid} sd={7 * u} w={w} h={h} />
          </defs>
        </svg>
        {half(topPoly, mTop, 't', -1)}
        {half(botPoly, mBot, 'b', 1)}
        {glow}
      </AbsoluteFill>
    );
  }
  if (p < A || p >= 1) return p >= 1 ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>;
  // new scene everywhere the two (transformed) halves are not
  const tp = topPoly.map(([x, y]) => affPt(mTop, x, y));
  const bp = botPoly.map(([x, y]) => affPt(mBot, x, y));
  const sparks: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const q = clamp01((p - B) / 0.4 - hash01(i * 2.3) * 0.5);
    if (q <= 0 || q >= 1) continue;
    const [px0, py0] = path[Math.floor(hash01(i * 5.7 + pp.seed) * 64)];
    const vx = (hash01(i * 9.1) - 0.5) * 0.3 * w;
    const vy = -(0.1 + 0.3 * hash01(i * 3.9)) * h;
    sparks.push(<circle key={i} cx={px0 + vx * q} cy={py0 + vy * q + 0.4 * h * q * q} r={(2 + 3 * hash01(i)) * u * (1 - q)} fill={i % 3 ? pp.color : '#ffe08a'} />);
  }
  return (
    <AbsoluteFill>
      <Masked
        id={id}
        w={w}
        h={h}
        mask={
          <>
            <FullRect w={w} h={h} />
            <polygon points={ptsStr(tp)} fill="black" />
            <polygon points={ptsStr(bp)} fill="black" />
          </>
        }
      >
        <AbsoluteFill style={{filter: `brightness(${1 + 0.6 * (1 - sw)})`}}>{children}</AbsoluteFill>
      </Masked>
      <Overlay w={w} h={h}>{sparks}</Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// scan — satellite-briefing pass: a soft feathered front (never a hard line, feather ≈ 36 px) with a
// faint glowing swath behind it sweeps down the frame, swapping the scenes (direction up = rewind).
// variant 'tear': a hard front with a bright scanner light bar and a paper-edge shadow on the old side.

export const Scan: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('scn');
  const fid = useUid('scnf');
  const gid = useUid('scng');
  const lid = useUid('scnl');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const tear = pp.variant === 'tear';
  const feather = 36 * u;
  const swath = 0.16 * ax.L;
  const S = lerp(ax.smin - (tear ? 10 * u : feather * 2), ax.smax + (tear ? 30 * u : feather * 2 + 10), tear ? E.inOutQuad(p) : E.inOutCubic(p));
  const edge = straight(ax, 40);
  const [g1x, g1y] = at(ax, S - swath, 0);
  const [g2x, g2y] = at(ax, S, 0);
  return (
    <AbsoluteFill>
      <Masked
        id={id}
        w={w}
        h={h}
        defs={tear ? undefined : <BlurFilter id={fid} sd={feather * 0.45} w={w} h={h} />}
        mask={<polygon points={region(ax, S, edge)} fill="white" filter={tear ? undefined : `url(#${fid})`} />}
      >
        {children}
      </Masked>
      <Overlay w={w} h={h} style={{mixBlendMode: tear ? undefined : 'screen'}}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={g1x} y1={g1y} x2={g2x} y2={g2y}>
            <stop offset="0" stopColor={pp.color} stopOpacity={0} />
            <stop offset="0.7" stopColor={pp.color} stopOpacity={0.05} />
            <stop offset="1" stopColor={pp.color} stopOpacity={0.16} />
          </linearGradient>
          <BlurFilter id={lid} sd={(tear ? 14 : 8) * u} w={w} h={h} />
          <pattern id={`${gid}p`} patternUnits="userSpaceOnUse" width={6 * u} height={6 * u} patternTransform={`rotate(${pp.angle - 90})`}>
            <rect x={0} y={0} width={6 * u} height={1.2 * u} fill={pp.color} opacity={0.18} />
          </pattern>
        </defs>
        {!tear && (
          <>
            <polygon points={bandPoly(ax, S - swath, edge, S, edge)} fill={`url(#${gid})`} />
            <polygon points={bandPoly(ax, S - swath * 0.5, edge, S, edge)} fill={`url(#${gid}p)`} opacity={0.6} />
            <polygon points={bandPoly(ax, S - 10 * u, edge, S + 4 * u, edge)} fill={pp.color} opacity={0.22} filter={`url(#${lid})`} />
          </>
        )}
        {tear && (
          <>
            <polygon points={bandPoly(ax, S, edge, S + 40 * u, edge)} fill="#000" opacity={0.35} filter={`url(#${lid})`} />
            <polygon points={bandPoly(ax, S - 14 * u, edge, S + 14 * u, edge)} fill={pp.color} opacity={0.75} filter={`url(#${lid})`} />
            <polygon points={bandPoly(ax, S - 2 * u, edge, S + 2 * u, edge)} fill="#ffffff" />
            <polygon points={bandPoly(ax, S - 0.12 * ax.L, edge, S, edge)} fill={pp.color} opacity={0.1} />
          </>
        )}
      </Overlay>
    </AbsoluteFill>
  );
};
