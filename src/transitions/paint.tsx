// Adapted from ClaudeAnimationBase/src/timeline.js (brushWipe), lemo-opuscar/styles/silkscreen-poster/demo/engine/silk.js
// (wipeRegion, squeegee), mg-styles-15/demos/07-liquid (flood sheets) + 18-hanazi (candy wipe), lemo-opuscar risograph
// overprint, board.js eraser pass and demo/sheet.js figure relabel (MIT, © their authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {fonts} from '../core/fonts';
import {
  AbsoluteFill,
  at,
  axisFor,
  bandPoly,
  BlurFilter,
  C,
  clamp01,
  cornerR,
  E,
  Easing,
  Edge,
  f1,
  frontLine,
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
  useFrameSize,
  useUid,
} from './kit';

const palette = (cols: string[], n: number, fallback: string[]) => {
  const c = cols.length ? cols : fallback;
  return Array.from({length: n}, (_, i) => c[i % c.length]);
};

// ---------------------------------------------------------------------------------------------
// brush — timeline.js brushWipe: five fat ragged paint bands (frame tilted ~-6°) sweep across with
// staggered delays, cover the old scene (easeOut), the scene swaps at p = 0.5, then the bands drag off
// the other side (smoothstep). Two alternating colours with a dry-brush hatch inside.

export const Brush: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const tid = useUid('brt');
  const hid = useUid('brh');
  if (presentationDirection === 'exiting') return p >= 0.5 ? <Hidden>{children}</Hidden> : <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const [c1, c2] = palette(pp.colors, 2, ['#9C3F22', '#C9683F']);
  const horiz = Math.abs(Math.cos((pp.angle * Math.PI) / 180)) > 0.5;
  const L = horiz ? w : h; // travel length
  const M = horiz ? h : w; // across
  const k = M / 1080;
  const n = 5;
  const span = M + 420 * k;
  const bh = span / n + 40 * k;
  const delays = [0, 0.14, 0.06, 0.18, 0.1];
  const boil = Math.floor((p * D) / 2);
  const jit = (i: number, kk: number, a: number) => (hash01(i * 91 + kk * 7.7 + boil * 3.1 + pp.seed) - 0.5) * 2 * a * k;
  const sX = L / 1920;
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const y0 = -230 * k + (i * span) / n;
    const d = delays[i];
    const q = p < 0.5 ? E.outCubic(clamp01((p * 2 - d) / (1 - d))) : sstep(0, 1, clamp01(((p - 0.5) * 2 - d) / (1 - d)));
    const x0 = p < 0.5 ? -300 * sX : lerp(-300 * sX, L + 400 * sX, q);
    const x1 = p < 0.5 ? lerp(-300 * sX, L + 400 * sX, q) : L + 400 * sX;
    if (x1 - x0 < 30 * sX) continue;
    const rag = (kk: number) => (40 + 50 * hash01(i * 31 + kk + pp.seed * 5)) * k + jit(i, kk + 50, 12);
    const pts: [number, number][] = [];
    for (let kk = 0; kk <= 8; kk++) pts.push([lerp(x0, x1, kk / 8), y0 + Math.sin(kk * 0.9 + i) * 14 * k + jit(i, kk, 5)]);
    for (let kk = 1; kk < 9; kk++) pts.push([x1 + rag(kk) - 40 * k, y0 + (bh * kk) / 9]);
    for (let kk = 8; kk >= 0; kk--) pts.push([lerp(x0, x1, kk / 8), y0 + bh + Math.sin(kk * 0.8 + i * 2) * 14 * k + jit(i, kk + 20, 5)]);
    if (p >= 0.5) for (let kk = 8; kk > 0; kk--) pts.push([x0 - rag(kk + 20) + 40 * k, y0 + (bh * kk) / 9]);
    const wash = i % 2 ? c1 : c2;
    const fill = i % 2 ? c2 : c1;
    const poly = ptsStr(pts);
    // dry-brush hatch: horizontal streaks, spacing ~44 source px, alternating colour
    const streaks: React.ReactNode[] = [];
    const hatchCol = i % 2 ? mix(c2, '#ffffff', 0.15) : '#F2E6D0';
    for (let s = 0; s < 14; s++) {
      const yy = y0 + ((s + 0.5) / 14) * bh;
      const a = x0 + (x1 - x0) * 0.04 * hash01(i * 13 + s);
      const b = x1 - (x1 - x0) * (0.05 + 0.25 * hash01(i * 17 + s * 3));
      streaks.push(<line key={s} x1={a} y1={yy} x2={b} y2={yy + (hash01(s + i) - 0.5) * 6 * k} stroke={hatchCol} strokeOpacity={0.12 + 0.22 * hash01(s * 5 + i)} strokeWidth={(2 + 5 * hash01(s * 2 + i * 9)) * k} strokeLinecap="round" />);
    }
    bands.push(
      <g key={i}>
        <clipPath id={`${hid}${i}`}>
          <polygon points={poly} />
        </clipPath>
        <polygon points={poly} fill={wash} />
        <polygon points={poly} fill={fill} opacity={0.27} transform={`translate(${6 * k} ${4 * k})`} />
        <g clipPath={`url(#${hid}${i})`}>{streaks}</g>
      </g>,
    );
  }
  const rot = pp.angle - 5.7;
  return (
    <AbsoluteFill>
      {p >= 0.5 ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
      <Overlay w={w} h={h}>
        <defs>
          <filter id={tid} filterUnits="userSpaceOnUse" x={-w} y={-h} width={3 * w} height={3 * h}>
            <feTurbulence type="fractalNoise" baseFrequency={(0.02 / u).toFixed(4)} numOctaves={3} seed={pp.seed + boil} result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale={16 * u} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={`url(#${tid})`} transform={`translate(${w / 2} ${h / 2}) rotate(${rot}) translate(${-L / 2} ${-M / 2})`}>
          {bands}
        </g>
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// squeegee — silkscreen wipeRegion + squeegee: the new scene is pulled on behind a squeegee blade
// at linear speed; its leading edge is ragged with short drag streaks (ink not pulled evenly); a
// rolling ink bead (split fountain = several colours along the blade) rides in front of the rubber
// blade, the wooden handle behind it.

export const Squeegee: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('sqg');
  const fid = useUid('sqgf');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const s = 2.4 * u;
  const tail = 28 * s;
  const back = -30 * s; // handle extends behind the blade
  const W0 = 26 * s; // bead thickness
  const F = ax.smin - tail + p * (ax.L + 2 * tail + Math.abs(back) + W0 + 20 * s);
  const step = 5 * u;
  const edge: Edge = [];
  for (let t = ax.tmin - 20; t <= ax.tmax + 20 + step; t += step) {
    const i = Math.floor((t - ax.tmin) / step);
    const n1 = hash01(i * 7.13 + pp.seed * 31.7);
    const n2 = hash01(Math.floor(i / 3) * 3.7 + pp.seed);
    edge.push([t, -tail * (n1 * 0.65 + n2 * 0.35)]);
  }
  const front = F; // blade line
  const beads = palette(pp.colors, Math.max(1, pp.colors.length || 1), ['#333333']);
  const T = ax.M + 40;
  const wAt = (q: number) => W0 * (0.82 + 0.18 * Math.sin(q * 9 + pp.seed) + 0.08 * Math.sin(q * 31 + pp.seed * 2));
  const tAt = (q: number) => ax.tmin - 20 + q * T;
  const P = (q: number, dd: number) => at(ax, front + dd, tAt(q));
  const bandPts = (q0: number, q1: number, d0: (q: number) => number, d1: (q: number) => number) => {
    const nn = Math.max(8, Math.ceil(((q1 - q0) * T) / (8 * u)));
    const a: number[][] = [];
    const b: number[][] = [];
    for (let i = 0; i <= nn; i++) {
      const q = lerp(q0, q1, i / nn);
      a.push(P(q, d0(q)));
      b.push(P(q, d1(q)));
    }
    return ptsStr([...a, ...b.reverse()]);
  };
  const roll = p * 18;
  const glints: React.ReactNode[] = [];
  const gap = 46 * s;
  for (let qq = ((roll * 60) % gap + gap) % gap; qq < T; qq += gap) {
    const q = qq / T;
    const [gx, gy] = P(q, 3 * s + wAt(q) * 0.3);
    glints.push(<ellipse key={qq} cx={gx} cy={gy} rx={(3 + 2 * hash01(Math.floor(qq / gap))) * s} ry={2 * s} fill="#fff" opacity={0.75} transform={`rotate(${pp.angle + 90} ${gx} ${gy})`} />);
  }
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, front - 2 * s, edge)} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={8 * s} w={w} h={h} />
        </defs>
        {/* drop shadow of handle + blade */}
        <polygon points={bandPts(0, 1, () => back - 4 * s, () => 6 * s)} fill="#000" opacity={0.25} transform={`translate(${8 * s} ${10 * s})`} filter={`url(#${fid})`} />
        {beads.map((col, i) => {
          const q0 = i / beads.length;
          const q1 = (i + 1) / beads.length;
          return (
            <g key={i}>
              <polygon points={bandPts(q0, q1, () => 3 * s, (q) => 3 * s + wAt(q))} fill={col} />
              <polygon points={bandPts(q0, q1, (q) => 3 * s + wAt(q) * 0.12, (q) => 3 * s + wAt(q) * 0.5)} fill={mix(col, '#ffffff', 0.22)} />
              <polygon points={bandPts(q0, q1, (q) => 3 * s + wAt(q) * 0.72, (q) => 3 * s + wAt(q) - 0.5)} fill={mix(col, '#000000', 0.18)} />
              <polyline points={ptsStr(Array.from({length: 40}, (_, k) => P(lerp(q0, q1, k / 39), 3 * s + wAt(lerp(q0, q1, k / 39)) - 1.4 * s)))} fill="none" stroke={mix(col, '#000000', 0.28)} strokeWidth={3.2 * s} />
              <polyline points={ptsStr(Array.from({length: 40}, (_, k) => P(lerp(q0, q1, k / 39), 3 * s + wAt(lerp(q0, q1, k / 39)) * 0.32)))} fill="none" stroke="#fff" strokeOpacity={0.42} strokeWidth={2.4 * s} />
            </g>
          );
        })}
        {glints}
        {/* rubber blade */}
        <polygon points={bandPts(0, 1, () => -2 * s, () => 4 * s)} fill="#23201E" />
        <polygon points={bandPts(0, 1, () => 2.2 * s, () => 4 * s)} fill="#57524C" />
        {/* wooden handle */}
        <polygon points={bandPts(0, 1, () => back, () => -2 * s)} fill="#C48A52" />
        <polygon points={bandPts(0, 1, () => back, () => back + 5 * s)} fill="#D9A56C" />
        {Array.from({length: 5}, (_, k) => {
          const dd = back + 6 * s + (k * (-back - 8 * s)) / 5;
          return <polyline key={k} points={ptsStr(Array.from({length: 40}, (_, j) => P(j / 39, dd + Math.sin((j / 39) * 9 + k * 2) * 1.2 * s)))} fill="none" stroke="rgba(90,50,20,.35)" strokeWidth={1.1 * s} />;
        })}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// overprint — risograph overprint: a flat disc of one ink grows from (x, y) with multiply blend, so
// everything beneath turns into the overprint mix; registration kick on the cover frames; the scene
// swaps under full cover, then the disc shrinks back into a small key shape at (x, y) and vanishes.

export const Overprint: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const gid = useUid('ovp');
  if (presentationDirection === 'exiting') return p >= 0.47 ? <Hidden>{children}</Hidden> : <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const cx = pp.x * w;
  const cy = pp.y * h;
  const Rmax = cornerR(cx, cy, w, h) * 1.04 + 20 * u;
  const r0 = 0.05 * Math.min(w, h);
  const grow = E.inOutCubic(seg(p, 0, 0.42));
  const shrink = E.inOutCubic(seg(p, 0.52, 0.94));
  const R = p < 0.52 ? lerp(0, Rmax, grow) : lerp(Rmax, r0, shrink);
  const kick = p >= 0.42 && p < 0.5 ? (Math.floor(p * 100) % 2 ? 1 : -1) : 0;
  const fade = 1 - seg(p, 0.9, 1);
  const wob = (a: number) => 1 + 0.012 * Math.sin(a * 5 + pp.seed) + 0.008 * Math.sin(a * 11 - pp.seed);
  const disc = (dx: number, dy: number) =>
    ptsStr(
      Array.from({length: 96}, (_, i) => {
        const a = (i / 96) * Math.PI * 2;
        return [cx + dx + Math.cos(a) * R * wob(a), cy + dy + Math.sin(a) * R * wob(a)];
      }),
    );
  return (
    <AbsoluteFill>
      {p >= 0.47 ? <Plain>{children}</Plain> : <Hidden>{children}</Hidden>}
      {R > 0.5 && (
        <Overlay w={w} h={h} style={{opacity: 0.32 * fade}}>
          <polygon points={disc(kick * 7 * u, -kick * 5 * u)} fill={pp.color} />
        </Overlay>
      )}
      <Overlay w={w} h={h} style={{mixBlendMode: 'multiply', opacity: fade}}>
        <defs>
          <filter id={gid} filterUnits="userSpaceOnUse" x={-w} y={-h} width={3 * w} height={3 * h}>
            <feTurbulence type="fractalNoise" baseFrequency={(0.9 / u).toFixed(3)} numOctaves={2} seed={pp.seed} result="t" />
            <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.95" result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
          </filter>
        </defs>
        {R > 0.5 && (
          <g filter={`url(#${gid})`}>
            <polygon points={disc(kick * 7 * u, -kick * 5 * u)} fill={pp.color} />
          </g>
        )}
        {kick !== 0 && <polygon points={disc(-kick * 4 * u, kick * 3 * u)} fill="none" stroke={mix(pp.color, '#000000', 0.25)} strokeWidth={5 * u} opacity={0.5} />}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// erase — board eraser pass: a soft eraser band (feathered ~40 px, scrubby edge, white haze, crumbs)
// sweeps across; behind it the new scene, with the old one still faintly there (a 7.5 % ghost) until
// the very end.

export const Erase: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('ers');
  const fid = useUid('ersf');
  const hid = useUid('ersh');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const feather = 40 * u;
  const haze = 0.1 * ax.L;
  const e = E.inOutQuad(seg(p, 0, 0.9));
  const S = lerp(ax.smin - feather * 2, ax.smax + haze + feather * 2, e);
  const scrub = Math.floor((p * D) / 2);
  const edge = sampleEdge(ax, (t) => 22 * u * Math.sin(t / (38 * u) + scrub * 1.7) + 14 * u * Math.sin(t / (13 * u) - scrub), 6 * u, 40 * u);
  const ghost = 0.075 * (1 - seg(p, 0.8, 1));
  const crumbs: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const t = ax.tmin + hash01(i * 3.3 + pp.seed) * ax.M;
    const back = (0.01 + 0.18 * hash01(i * 7.1)) * ax.L;
    const [x, y] = at(ax, S - back, t);
    const sz = (2 + 4 * hash01(i * 1.7)) * u;
    crumbs.push(<rect key={i} x={x} y={y} width={sz} height={sz * 0.7} fill="#8b8f96" opacity={0.5 * (1 - back / (0.2 * ax.L))} transform={`rotate(${i * 37} ${x} ${y})`} />);
  }
  return (
    <AbsoluteFill>
      <Masked
        id={id}
        w={w}
        h={h}
        style={{opacity: 1 - ghost}}
        defs={<BlurFilter id={fid} sd={feather * 0.4} w={w} h={h} />}
        mask={<polygon points={region(ax, S, edge)} fill="white" filter={`url(#${fid})`} />}
      >
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={hid} sd={18 * u} w={w} h={h} />
        </defs>
        <polygon points={bandPoly(ax, S - haze, edge, S + feather * 0.3, edge)} fill={pp.color} opacity={0.22 * Math.sin(Math.PI * clamp01(p * 1.1))} filter={`url(#${hid})`} />
        <polyline points={frontLine(ax, S, edge)} fill="none" stroke={pp.color} strokeWidth={10 * u} strokeOpacity={0.35} filter={`url(#${hid})`} />
        {crumbs}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// stripes — hanazi candy wipe: a slanted stack of pink, yellow and cyan bands sweeps across, trailing
// a cyan/white stripe field that fills the frame for a few frames; the trailing bands reveal the new
// scene. `colors` = the three bands, `color` = the light stripe of the field.

export const Stripes: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('cnd');
  const pid = useUid('cndp');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const cols = palette(pp.colors, 3, ['#FF3D7F', '#FFE14D', '#16B9F0']);
  const bw = 0.05 * ax.L;
  const field = 1.05 * ax.L;
  const slant = Math.tan((20 * Math.PI) / 180);
  const tmid = (ax.tmin + ax.tmax) / 2;
  const edge: Edge = [
    [ax.tmin - 40, slant * (ax.tmin - 40 - tmid)],
    [ax.tmax + 40, slant * (ax.tmax + 40 - tmid)],
  ];
  const ext = slant * ax.M * 0.5;
  const total = 6 * bw + field;
  const F = lerp(ax.smin - ext - 2, ax.smax + ext + total + 2, E.inOutQuad(p));
  const tail = F - total;
  const lead = [0, 1, 2].map((i) => bandPoly(ax, F - (i + 1) * bw, edge, F - i * bw, edge));
  const trail = [2, 1, 0].map((i, k) => bandPoly(ax, tail + k * bw, edge, tail + (k + 1) * bw, edge));
  const stripe = 50 * u;
  const drift = p * 400 * u;
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, tail + 1, edge)} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <pattern id={pid} patternUnits="userSpaceOnUse" width={stripe * 2} height={stripe * 2} patternTransform={`rotate(${pp.angle + 25}) translate(${f1(drift)} 0)`}>
            <rect x={0} y={0} width={stripe} height={stripe * 2} fill={cols[2]} />
            <rect x={stripe} y={0} width={stripe} height={stripe * 2} fill={pp.color} />
          </pattern>
        </defs>
        <polygon points={bandPoly(ax, F - 3 * bw - field, edge, F - 3 * bw + 1, edge)} fill={`url(#${pid})`} />
        {lead.map((pts, i) => (
          <polygon key={`l${i}`} points={pts} fill={cols[i]} />
        ))}
        {trail.map((pts, i) => (
          <polygon key={`t${i}`} points={pts} fill={cols[[2, 1, 0][i]]} />
        ))}
        <polyline points={frontLine(ax, F, edge)} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3 * u} />
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// flood — 07-liquid flood: three liquid sheets with wavy, bulging fronts (3 sines + a gaussian bulge)
// sweep diagonally across in a quick stagger, immerse the frame, then drain top sheet first; the new
// scene is revealed under the last sheet's back edge. Marbled bands + a lit front inside each sheet.

const liquidEase = Easing.bezier(0.28, 0.55, 0.42, 1);

export const Flood: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('fld');
  const fid = useUid('fldf');
  const gid = useUid('fldg');
  if (presentationDirection === 'exiting' || p >= 1) return <Plain>{children}</Plain>;
  const ax = axisFor(pp.angle, w, h);
  const cols = palette(pp.colors, 3, ['#FF5E8A', '#FFB84D', '#4CC9F0']);
  const A = 0.055 * Math.min(w, h);
  const pad = A * 2.4 + 0.12 * ax.L;
  const f = p * D;
  const shape = (k: number, amp: number, ph: number) => (t: number) => {
    const x = t / (0.55 * Math.max(w, h));
    const s = 0.58 * Math.sin(x * 6.283 + ph + f * 0.09) + 0.3 * Math.sin(x * 6.283 * 1.87 - ph * 1.3 - f * 0.13) + 0.14 * Math.sin(x * 6.283 * 3.13 + ph * 2 + f * 0.2);
    const bc = lerp(ax.tmin, ax.tmax, 0.3 + 0.4 * hash01(k * 3 + pp.seed));
    const bulge = 1.6 * Math.exp(-(((t - bc) / (250 * u)) ** 2));
    return amp * A * (s + bulge);
  };
  const pos = (q: number) => lerp(ax.smin - pad, ax.smax + pad, liquidEase(clamp01(q)));
  const sheets = [0, 1, 2].map((k) => {
    const Fk = pos(seg(p, 0.04 * k, 0.36 + 0.04 * k));
    const Bk = pos(seg(p, 0.5 + 0.05 * (2 - k), 0.88 + 0.05 * (2 - k)));
    const eF = sampleEdge(ax, shape(k, 1, k * 1.7), 14 * u, 40 * u);
    const eB = sampleEdge(ax, shape(k + 5, 0.85, k * 2.3 + 1), 14 * u, 40 * u);
    return {k, Fk, Bk, eF, eB};
  });
  const last = sheets[0];
  return (
    <AbsoluteFill>
      <Masked id={id} w={w} h={h} mask={<polygon points={region(ax, last.Bk, last.eB)} fill="white" />}>
        {children}
      </Masked>
      <Overlay w={w} h={h}>
        <defs>
          <BlurFilter id={fid} sd={10 * u} w={w} h={h} />
        </defs>
        {sheets.map(({k, Fk, Bk, eF, eB}) => {
          if (Fk - Bk < 1) return null;
          const col = cols[k];
          const poly = bandPoly(ax, Bk, eB, Fk, eF);
          const cid = `${gid}c${k}`;
          return (
            <g key={k}>
              <polyline points={frontLine(ax, Fk, eF, 10 * u)} fill="none" stroke="#000" strokeOpacity={0.18} strokeWidth={18 * u} filter={`url(#${fid})`} />
              <clipPath id={cid}>
                <polygon points={poly} />
              </clipPath>
              <linearGradient id={`${gid}${k}`} gradientUnits="userSpaceOnUse" x1={at(ax, Fk - 0.5 * ax.L, 0)[0]} y1={at(ax, Fk - 0.5 * ax.L, 0)[1]} x2={at(ax, Fk, 0)[0]} y2={at(ax, Fk, 0)[1]}>
                <stop offset="0" stopColor={mix(col, '#000000', 0.12)} />
                <stop offset="1" stopColor={mix(col, '#ffffff', 0.12)} />
              </linearGradient>
              <polygon points={poly} fill={`url(#${gid}${k})`} />
              <g clipPath={`url(#${cid})`}>
                {[0.08, 0.17, 0.3, 0.46, 0.63].map((o, j) => (
                  <polyline key={j} points={frontLine(ax, Fk - o * ax.L, eF.map(([t, ds]) => [t, ds * (0.6 + 0.3 * Math.sin(j * 2.1))] as [number, number]))} fill="none" stroke={j % 2 ? mix(col, '#ffffff', 0.35) : mix(col, '#000000', 0.15)} strokeOpacity={0.35} strokeWidth={(10 + 18 * hash01(j + k * 7)) * u} />
                ))}
                <polyline points={frontLine(ax, Fk, eF, -9 * u)} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={5 * u} />
              </g>
            </g>
          );
        })}
      </Overlay>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// rewrite — figure relabel: a small paper label "FIG. 1" sits on the frame; it is struck through by
// hand, "FIG. 2" is written beside it with a nib, while the scenes cross underneath; the label then
// lifts away. `text` = "old|new", `color` = pencil ink, `x`,`y` = label centre.

export const Rewrite: C = ({children, presentationDirection, presentationProgress: p, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const cid = useUid('rwc');
  const sid = useUid('rws');
  if (presentationDirection === 'exiting') return <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;
  const [oldT, newT] = (pp.text || 'FIG. 1|FIG. 2').split(/\s*(?:\||→|->)\s*/).concat(['']).slice(0, 2);
  let fs = 64 * u;
  const oldW = (txt: string, f: number) => txt.length * f * 0.62;
  const newW = (txt: string, f: number) => txt.length * f * 0.5;
  const pad = () => fs * 0.6;
  let cardW = pad() * 2 + oldW(oldT, fs) + fs * 0.7 + newW(newT, fs * 1.25);
  if (cardW > w * 0.9) {
    fs *= (w * 0.9) / cardW;
    cardW = w * 0.9;
  }
  const cardH = fs * 2.1;
  const cx = Math.min(w - cardW / 2 - 10 * u, Math.max(cardW / 2 + 10 * u, pp.x * w));
  const cy = pp.y * h;
  const x0 = cx - cardW / 2;
  const appear = E.outCubic(seg(p, 0, 0.12));
  const leave = E.inCubic(seg(p, 0.86, 1));
  const strike = E.inOutQuad(seg(p, 0.12, 0.32));
  const write = seg(p, 0.36, 0.74);
  const ox = x0 + pad();
  const ow = oldW(oldT, fs);
  const nx = ox + ow + fs * 0.7;
  const nw = newW(newT, fs * 1.25);
  const base = cy + fs * 0.36;
  // hand-drawn strike: slightly rising, wobbly, overshooting both ends
  const sx0 = ox - fs * 0.25;
  const sx1 = ox + ow + fs * 0.2;
  const sp = Array.from({length: 12}, (_, i) => {
    const t = i / 11;
    return [lerp(sx0, sx1, t), cy - fs * 0.02 + Math.sin(t * 5 + pp.seed) * fs * 0.03 - t * fs * 0.1];
  });
  const sLen = Math.hypot(sx1 - sx0, fs * 0.1) * 1.05;
  const wx = nx + nw * write;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: E.inOutQuad(seg(p, 0.3, 0.72))}}>{children}</AbsoluteFill>
      <Overlay w={w} h={h} style={{opacity: appear * (1 - leave), transform: `translateY(${(1 - appear) * 20 * u - leave * 26 * u}px)`}}>
        <defs>
          <BlurFilter id={sid} sd={10 * u} w={w} h={h} />
          <clipPath id={cid}>
            <rect x={nx - fs * 0.2} y={cy - cardH} width={Math.max(0, wx - nx + fs * 0.2)} height={cardH * 2} />
          </clipPath>
        </defs>
        <rect x={x0 + 6 * u} y={cy - cardH / 2 + 10 * u} width={cardW} height={cardH} fill="#000" opacity={0.3} filter={`url(#${sid})`} />
        <rect x={x0} y={cy - cardH / 2} width={cardW} height={cardH} fill="#F6F1E4" />
        <rect x={x0 + 5 * u} y={cy - cardH / 2 + 5 * u} width={cardW - 10 * u} height={cardH - 10 * u} fill="none" stroke="#2b2622" strokeOpacity={0.55} strokeWidth={1.4 * u} />
        <text x={ox} y={base} fontFamily={fonts.mono} fontWeight={700} fontSize={fs} fill="#2b2622" letterSpacing={fs * 0.02}>
          {oldT}
        </text>
        {strike > 0 && (
          <polyline points={ptsStr(sp)} fill="none" stroke={pp.color} strokeWidth={fs * 0.09} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={sLen} strokeDashoffset={sLen * (1 - strike)} />
        )}
        {write > 0 && (
          <g clipPath={`url(#${cid})`}>
            <text x={nx} y={base + fs * 0.05} fontFamily={fonts.hand} fontWeight={700} fontSize={fs * 1.25} fill={pp.color}>
              {newT}
            </text>
          </g>
        )}
        {write > 0 && write < 1 && <circle cx={wx} cy={base - fs * 0.25 + Math.sin(write * 40) * fs * 0.18} r={fs * 0.07} fill={pp.color} />}
      </Overlay>
    </AbsoluteFill>
  );
};
