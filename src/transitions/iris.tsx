// Iris extensions (round 2). Ideas from lemo-opuscar midcentury-toon (medallion iris), silent-film (iris hold),
// mg-styles-15 08-morph (field bloom), marker-iris, x5 rock iris and the character-rig / pdoom shape iris — all
// re-written as deterministic SVG / CSS (MIT, © LemoLab / the respective authors; see THIRD_PARTY_NOTICES.md).
import React from 'react';
import {Easing} from 'remotion';
import {n2, rng} from '../core/random';
import {fonts} from '../core/fonts';
import {AbsoluteFill, at, axisFor, BlurFilter, C, clamp01, cornerR, E, f1, Hidden, lerp, Masked, Overlay, Plain, ptsStr, region, seg, straight, useFrameSize, useUid} from './kit';

// ---------------------------------------------------------------------------------------------
// aperture shapes: polygons centred on the origin, mean radius 1, `inr` = smallest radius to the edge

type Pt = [number, number];
export type Shape = {pts: Pt[]; inr: number};

const segDist = (a: Pt, b: Pt) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1;
  const t = clamp01(-(a[0] * dx + a[1] * dy) / l2);
  return Math.hypot(a[0] + dx * t, a[1] + dy * t);
};

const normShape = (raw: Pt[]): Shape => {
  const cx = raw.reduce((s, p) => s + p[0], 0) / raw.length;
  const cy = raw.reduce((s, p) => s + p[1], 0) / raw.length;
  const c = raw.map(([x, y]): Pt => [x - cx, y - cy]);
  const mr = c.reduce((s, p) => s + Math.hypot(p[0], p[1]), 0) / c.length || 1;
  const pts = c.map(([x, y]): Pt => [x / mr, y / mr]);
  let inr = Infinity;
  for (let i = 0; i < pts.length; i++) inr = Math.min(inr, segDist(pts[i], pts[(i + 1) % pts.length]));
  return {pts, inr};
};

const ring = (n: number, f: (a: number, i: number) => number, rot = -Math.PI / 2): Pt[] =>
  Array.from({length: n}, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2;
    const r = f(a, i);
    return [Math.cos(a) * r, Math.sin(a) * r];
  });

const cache = new Map<string, Shape>();
export const SHAPES = ['circle', 'heart', 'star', 'keyhole', 'diamond', 'square', 'hexagon', 'rock'];

/** the aperture polygon for a named shape (cached) */
export const shapeOf = (name: string, seed = 1): Shape => {
  const key = `${name}:${name === 'rock' ? seed : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let raw: Pt[];
  switch (name) {
    case 'heart':
      raw = Array.from({length: 72}, (_, i): Pt => {
        const t = (i / 72) * Math.PI * 2;
        return [16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
      });
      break;
    case 'star':
      raw = ring(10, (_, i) => (i % 2 ? 0.52 : 1));
      break;
    case 'diamond':
      raw = ring(4, () => 1);
      break;
    case 'square':
      raw = ring(4, () => 1, -Math.PI / 4);
      break;
    case 'hexagon':
      raw = ring(6, () => 1, 0);
      break;
    case 'keyhole': {
      const arc: Pt[] = Array.from({length: 40}, (_, i) => {
        const a = Math.PI / 2 + 0.55 + (i / 39) * (Math.PI * 2 - 1.1);
        return [0.62 * Math.cos(a), -0.28 + 0.62 * Math.sin(a)];
      });
      raw = [...arc, [0.4, 1.1], [-0.4, 1.1]];
      break;
    }
    case 'rock': {
      const r = rng(seed * 61 + 5);
      const jit = Array.from({length: 40}, () => r());
      raw = ring(40, (_, i) => 1 + 0.12 * (jit[i] - 0.5) * 2 + 0.05 * Math.sin(i * 0.9));
      break;
    }
    default:
      raw = ring(64, () => 1);
  }
  const s = normShape(raw);
  cache.set(key, s);
  return s;
};

const polyAt = (sh: Shape, cx: number, cy: number, k: number) => ptsStr(sh.pts.map(([x, y]) => [cx + x * k, cy + y * k]));

// ---------------------------------------------------------------------------------------------
// radius curves (k = mean radius in px)

/** opening curve: 0 -> kHold (ease-out), a slow drift while holding, then ease-in to kEnd */
const kOpen = (p: number, kEnd: number, hold: number, kHold: number) => {
  p = clamp01(p);
  if (hold <= 0.001) return kEnd * E.inQuad(p);
  const kh = Math.min(kHold, kEnd * 0.8);
  const a = (1 - hold) * 0.5;
  const b = a + hold;
  if (p < a) return kh * E.outCubic(p / a);
  if (p < b) return kh * (1 + 0.06 * ((p - a) / (b - a)));
  return lerp(kh * 1.06, kEnd, E.inQuad((p - b) / (1 - b)));
};

const bloomEase = Easing.bezier(0.42, 0, 0.12, 1);
const backOut = (t: number, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

// ---------------------------------------------------------------------------------------------
// the visible window

type WinProps = {id: string; sh: Shape; cx: number; cy: number; k: number; feather: number; w: number; h: number; children: React.ReactNode};
const Win: React.FC<WinProps> = ({id, sh, cx, cy, k, feather, w, h, children}) => {
  if (feather > 1.5) {
    const fid = id + 'b';
    return (
      <Masked id={id} w={w} h={h} defs={<BlurFilter id={fid} sd={feather / 2} w={w} h={h} />} mask={<polygon points={polyAt(sh, cx, cy, k)} fill="white" filter={`url(#${fid})`} />}>
        {children}
      </Masked>
    );
  }
  const clip = sh.pts.length === 64 && sh.inr > 0.99 ? `circle(${f1(Math.max(0, k))}px at ${f1(cx)}px ${f1(cy)}px)` : `polygon(${sh.pts.map(([x, y]) => `${f1(cx + x * k)}px ${f1(cy + y * k)}px`).join(',')})`;
  return <AbsoluteFill style={{clipPath: k <= 0.01 ? 'circle(0px at 0px 0px)' : clip}}>{children}</AbsoluteFill>;
};

const Rim: React.FC<{sh: Shape; cx: number; cy: number; k: number; color: string; width: number}> = ({sh, cx, cy, k, color, width}) =>
  k <= 0.5 || width <= 0 ? null : sh.pts.length === 64 && sh.inr > 0.99 ? (
    <circle cx={cx} cy={cy} r={k} fill="none" stroke={color} strokeWidth={width} />
  ) : (
    <polygon points={polyAt(sh, cx, cy, k)} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" />
  );

const ROCKS = ['#5C5A5A', '#6E6A66', '#7F7A73', '#8D8780', '#9A958F'];

/** a ring of paper rocks on the aperture edge (x5 rock iris) */
const Rocks: React.FC<{sh: Shape; cx: number; cy: number; k: number; u: number; seed: number; colors: string[]}> = ({sh, cx, cy, k, u, seed, colors}) => {
  if (k <= 1) return null;
  const pal = colors.length ? colors : ROCKS;
  const r = rng(seed * 17 + 3);
  const rr = Math.min(70 * u, Math.max(6 * u, k * 0.17));
  return (
    <g>
      {sh.pts.map(([x, y], i) => {
        const px = cx + x * k + x * rr * 0.55;
        const py = cy + y * k + y * rr * 0.55;
        const m = 7;
        const rot = r() * 6.28;
        const size = rr * (0.8 + r() * 0.7);
        const pts = Array.from({length: m}, (_, j) => {
          const a = rot + (j / m) * Math.PI * 2;
          const rad = size * (0.7 + r() * 0.45);
          return `${f1(px + Math.cos(a) * rad)},${f1(py + Math.sin(a) * rad * 0.85)}`;
        }).join(' ');
        return <polygon key={i} points={pts} fill={pal[(i * 7 + Math.floor(r() * 5)) % pal.length]} stroke="rgba(255,255,255,0.35)" strokeWidth={1 * u} strokeLinejoin="round" />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
// IrisPlus — shape, hold, close-then-open, feather, centre drift, and the variants
//   ''          iris with any `shape` (+ `hold` / `holdRadius`, `mode: 'closeopen'`, `feather`, `x2,y2`, `rim`)
//   'ring'      extra trailing rings (grid-snap iris)
//   'medallion' a numbered medallion stamps, then a circle grows from it (midcentury-toon)
//   'marker'    a hand-drawn ring is drawn, held, then becomes the aperture
//   'bloom'     a colour field that grows from a subject: edge feathered by its speed, crisp when it stops; shape 'horizon' = straight edge

export const IrisPlus: C = ({children, presentationDirection, presentationProgress: p, presentationDurationInFrames: D, passedProps: pp}) => {
  const {w, h, u} = useFrameSize();
  const id = useUid('irp');
  const exiting = presentationDirection === 'exiting';
  const v = pp.variant;
  const closeOpen = pp.mode === 'closeopen';
  const sh = shapeOf(pp.shape || 'circle', pp.seed);
  const surround = pp.colors[0] ?? '#000000';
  const holdK = (pp.holdRadius || 0.22) * h;
  const drift = (t: number): [number, number] => [lerp(pp.x, pp.x2, t) * w, lerp(pp.y, pp.y2, t) * h];

  // ---- close then open (the old scene closes onto a subject, black beat, the new scene opens)
  if (closeOpen && v === '') {
    const split = 0.46;
    if (exiting) {
      if (p >= 0.5) return <Hidden>{children}</Hidden>;
      const q = clamp01(p / split);
      const cx = pp.x * w;
      const cy = pp.y * h;
      const kEnd = (cornerR(cx, cy, w, h) + 6 * u) / sh.inr;
      const k = kOpen(1 - q, kEnd, pp.hold, holdK);
      return (
        <AbsoluteFill style={{background: surround}}>
          <Win id={id} sh={sh} cx={cx} cy={cy} k={k} feather={pp.feather * u} w={w} h={h}>
            {children}
          </Win>
          <Overlay w={w} h={h}>
            {pp.shape === 'rock' && <Rocks sh={sh} cx={cx} cy={cy} k={k} u={u} seed={pp.seed} colors={pp.colors.slice(1)} />}
            <Rim sh={sh} cx={cx} cy={cy} k={k} color={pp.color} width={pp.rim * u} />
          </Overlay>
        </AbsoluteFill>
      );
    }
    if (p >= 1) return <Plain>{children}</Plain>;
    const q = clamp01((p - (1 - split)) / split);
    const cx = pp.x2 * w;
    const cy = pp.y2 * h;
    const kEnd = (cornerR(cx, cy, w, h) + 6 * u) / sh.inr;
    const k = kOpen(q, kEnd, pp.hold, holdK);
    return (
      <AbsoluteFill>
        <Win id={id} sh={sh} cx={cx} cy={cy} k={k} feather={pp.feather * u} w={w} h={h}>
          {children}
        </Win>
        <Overlay w={w} h={h}>
          {pp.shape === 'rock' && <Rocks sh={sh} cx={cx} cy={cy} k={k} u={u} seed={pp.seed} colors={pp.colors.slice(1)} />}
          <Rim sh={sh} cx={cx} cy={cy} k={k} color={pp.color} width={pp.rim * u} />
        </Overlay>
      </AbsoluteFill>
    );
  }

  if (exiting) return <Plain>{children}</Plain>;
  if (p >= 1) return <Plain>{children}</Plain>;

  // ---- bloom: colour field that follows a subject
  if (v === 'bloom') {
    const e = bloomEase(p);
    if (pp.shape === 'horizon') {
      const ax = axisFor(pp.angle, w, h);
      const fw = (pp.feather || 1) * 0.06 * ax.L * Math.sin(Math.PI * clamp01(p)) * 0.8;
      const S = lerp(ax.smin - fw - 2, ax.smax + fw + 2, e);
      const fid = id + 'f';
      const mask = <polygon points={region(ax, S, straight(ax))} fill="white" filter={fw > 1.5 ? `url(#${fid})` : undefined} />;
      return (
        <AbsoluteFill>
          <Masked id={id} w={w} h={h} defs={<BlurFilter id={fid} sd={Math.max(0.1, fw / 2)} w={w} h={h} />} mask={mask}>
            {children}
          </Masked>
          {pp.rim > 0 && (
            <Overlay w={w} h={h}>
              <polyline points={ptsStr(straight(ax).map(([t]) => at(ax, S, t)))} stroke={pp.color} strokeWidth={pp.rim * u} fill="none" />
            </Overlay>
          )}
        </AbsoluteFill>
      );
    }
    const [cx, cy] = drift(e);
    const kEnd = (cornerR(cx, cy, w, h) + 6 * u + 0.06 * w) / sh.inr;
    const kAt = (t: number) => kEnd * bloomEase(clamp01(t));
    const speed = Math.abs(kAt(p + 1 / D) - kAt(p - 1 / D)) / 2; // px per frame
    const fw = (pp.feather || 1) * speed * 1.2;
    const k = kAt(p);
    return (
      <AbsoluteFill>
        <Win id={id} sh={sh} cx={cx} cy={cy} k={k} feather={fw > 1.5 ? Math.min(fw, 0.12 * w) : 0} w={w} h={h}>
          {children}
        </Win>
        <Overlay w={w} h={h}>
          <Rim sh={sh} cx={cx} cy={cy} k={k} color={pp.color} width={pp.rim * u} />
        </Overlay>
      </AbsoluteFill>
    );
  }

  // ---- medallion
  if (v === 'medallion') {
    const x0 = pp.x * w;
    const y0 = pp.y * h;
    const r0 = 0.096 * h;
    const s = seg(p, 0, 0.28);
    const kk = E.inOutQuad(seg(p, 0.3, 1));
    const cx = lerp(x0, pp.x2 * w, kk);
    const cy = lerp(y0, pp.y2 * h, kk);
    const diag = cornerR(cx, cy, w, h) + 10 * u;
    const R = p < 0.3 ? 0 : lerp(r0, diag, kk * kk);
    const pop = p < 0.3 ? backOut(s) : 1;
    const rot = (1 - s) * 0.4;
    const disc = pp.colors[0] ?? '#F2994A';
    const star = pp.colors[1] ?? '#FFFFFF';
    const ink = pp.color;
    const discA = p < 0.3 ? 1 : 1 - seg(kk, 0, 0.3);
    const numA = p < 0.3 ? s : kk < 0.5 ? 1 - 2 * kk : 0;
    const numS = p < 0.3 ? 1 : 1 + 3 * Math.min(kk, 0.5);
    const rr = r0 * pop;
    const rays = Array.from({length: 16}, (_, i) => {
      const a = (i / 16) * Math.PI * 2 + rot;
      const a2 = a + (Math.PI / 16) * 0.9;
      const R1 = rr * 1.7;
      return `${f1(x0 + Math.cos(a) * rr)},${f1(y0 + Math.sin(a) * rr)} ${f1(x0 + Math.cos((a + a2) / 2) * R1)},${f1(y0 + Math.sin((a + a2) / 2) * R1)} ${f1(x0 + Math.cos(a2) * rr)},${f1(y0 + Math.sin(a2) * rr)}`;
    });
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: R <= 0.5 ? 'circle(0px at 0px 0px)' : `circle(${f1(R)}px at ${f1(cx)}px ${f1(cy)}px)`}}>{children}</AbsoluteFill>
        <Overlay w={w} h={h}>
          {R > 0.5 && <circle cx={cx} cy={cy} r={R} fill="none" stroke={ink} strokeWidth={Math.max(pp.rim, 1) * u} />}
          {discA > 0.01 && (
            <g opacity={discA}>
              {p < 0.3 && rays.map((d, i) => <polygon key={i} points={d} fill={star} opacity={0.9} />)}
              <circle cx={x0} cy={y0} r={rr} fill={disc} stroke={ink} strokeWidth={5 * u} />
            </g>
          )}
          {numA > 0.01 && pp.text !== '' && (
            <text x={x0} y={y0 + rr * 0.36 * numS} textAnchor="middle" fontFamily={fonts.display} fontSize={rr * 1.15 * numS} fill={ink} opacity={numA}>
              {pp.text}
            </text>
          )}
        </Overlay>
      </AbsoluteFill>
    );
  }

  // ---- marker: hand-drawn ring becomes the aperture
  if (v === 'marker') {
    const cx = pp.x * w;
    const cy = pp.y * h;
    const rr = (pp.holdRadius || 0.13) * h;
    const draw = E.inOutQuad(seg(p, 0, 0.4));
    const grow = E.inQuad(seg(p, 0.55, 1));
    const kEnd = (cornerR(cx, cy, w, h) + 10 * u) / sh.inr;
    const k = grow > 0 ? lerp(rr, kEnd, grow) : 0;
    const N = 72;
    const pts: Pt[] = Array.from({length: N + 1}, (_, i) => {
      const t = i / N;
      const a = -Math.PI / 2 + t * Math.PI * 2 * 1.06;
      const rad = rr * (1 + 0.045 * Math.sin(a * 3 + pp.seed) + 0.03 * n2(`mk${pp.seed}`, Math.cos(a) * 1.3, Math.sin(a) * 1.3) + 0.05 * t);
      return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
    });
    const shown = pts.slice(0, Math.max(2, Math.round(draw * pts.length)));
    return (
      <AbsoluteFill>
        <Win id={id} sh={sh} cx={cx} cy={cy} k={k} feather={0} w={w} h={h}>
          {children}
        </Win>
        <Overlay w={w} h={h}>
          {grow <= 0 && draw > 0.01 && <polyline points={ptsStr(shown)} fill="none" stroke={pp.color} strokeWidth={Math.max(pp.rim, 1) * u} strokeLinecap="round" strokeLinejoin="round" />}
          {grow > 0 && <Rim sh={sh} cx={cx} cy={cy} k={k} color={pp.color} width={Math.max(pp.rim, 1) * u} />}
        </Overlay>
      </AbsoluteFill>
    );
  }

  // ---- shaped / hold / feathered / ring iris
  const [cx, cy] = drift(E.inQuad(p));
  const kEnd = (cornerR(cx, cy, w, h) + 6 * u) / sh.inr;
  const k = kOpen(p, kEnd, pp.hold, holdK);
  return (
    <AbsoluteFill>
      <Win id={id} sh={sh} cx={cx} cy={cy} k={k} feather={pp.feather * u} w={w} h={h}>
        {children}
      </Win>
      <Overlay w={w} h={h}>
        {pp.shape === 'rock' && <Rocks sh={sh} cx={cx} cy={cy} k={k} u={u} seed={pp.seed} colors={pp.colors} />}
        {v === 'ring' &&
          [0.84, 0.7].map((f, i) => (
            <Rim key={i} sh={sh} cx={cx} cy={cy} k={k * f} color={pp.color} width={(3 - i) * u} />
          ))}
        <Rim sh={sh} cx={cx} cy={cy} k={k} color={pp.color} width={pp.rim * u} />
      </Overlay>
    </AbsoluteFill>
  );
};
