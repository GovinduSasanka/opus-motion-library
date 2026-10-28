import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Segmented worm breach: a giant panelled mechanical worm (ring segments with a toothed circular mouth)
 * bursts out of a cream line-art desert in a dust plume, arcs over toward camera and dives back.
 * Pseudo-3D in SVG: rings are ellipses placed along an animated 3D Bezier, sized by perspective.
 * Optional x-ray pass turns the worm translucent cyan for a stretch of the clip.
 */
type Props = {
  background: string;
  sand: string;
  ink: string;
  body: string;
  bodyDark: string;
  accent: string;
  dust: string;
  xrayColor: string;
  xray: boolean;
  segments: number;
  size: number;
  dustAmount: number;
  seed: number;
};

type V3 = {x: number; h: number; z: number};
const bez = (a: number, b: number, c: number, d: number, t: number) => {
  const m = 1 - t;
  return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d;
};
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, '0')).join('');
};

const Worm: React.FC<Props> = ({background, sand, ink, body, bodyDark, accent, dust, xrayColor, xray, segments, size, dustAmount, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const D = 150;
  const xs = portrait ? 0.74 : 1;
  const sc = Math.min(w, h * 1.45);
  const H = h * (portrait ? 0.3 : 0.34);
  const Zs = sc * 0.5;
  const cx = w / 2;
  const yH = h * (portrait ? 0.54 : 0.5);
  const gY = (z: number) => h * (yH / h + 0.08 + 0.14 * z);
  const persp = (z: number) => 1 / (1 - z * 0.45);
  const P = {
    x: [-0.3, -0.2, 0.06, 0.24],
    h: [-0.04, 1.55, 1.5, -0.04],
    z: [0, 0.05, 0.85, 0.9],
  };
  const at = (p: number): V3 => ({x: bez(P.x[0], P.x[1], P.x[2], P.x[3], p), h: bez(P.h[0], P.h[1], P.h[2], P.h[3], p), z: bez(P.z[0], P.z[1], P.z[2], P.z[3], p)});
  const proj = (v: V3) => {
    const k = persp(v.z);
    return {x: cx + v.x * sc * xs * k, y: gY(v.z) - v.h * H * k, k};
  };

  const N = Math.max(8, Math.round(segments));
  const sp = 0.75 / N;
  const head = 1.8 * prog(frame, 4, D - 12, ease.inOut);
  const xr = xray ? Math.min(prog(frame, 0.5 * D, 0.58 * D, ease.inOut), 1 - prog(frame, 0.78 * D, 0.86 * D, ease.inOut)) : 0;
  const r0 = 0.07 * sc * size;

  type Ring = {i: number; c: {x: number; y: number}; r: number; tx: number; ty: number; minor: number; tzn: number; z: number; ok: boolean; h: number};
  const rings: Ring[] = [];
  for (let i = 0; i <= N; i++) {
    const p = head - i * sp;
    const ok = p >= 0 && p <= 1;
    const pc = clamp(p, 0, 1);
    const a = at(pc);
    const s = proj(a);
    const e = 0.004;
    const b0 = at(clamp(pc - e, 0, 1));
    const b1 = at(clamp(pc + e, 0, 1));
    const s0 = proj(b0);
    const s1 = proj(b1);
    let tx = s1.x - s0.x;
    let ty = s1.y - s0.y;
    const tl = Math.hypot(tx, ty) || 1;
    const wx = (b1.x - b0.x) * sc;
    const wy = (b1.h - b0.h) * H;
    const wz = (b1.z - b0.z) * Zs;
    const wl = Math.hypot(wx, wy, wz) || 1;
    tx /= tl;
    ty /= tl;
    const tzn = wz / wl;
    rings.push({i, c: s, r: r0 * s.k, tx, ty, tzn, minor: Math.max(0.3, Math.abs(tzn)), z: a.z, ok, h: a.h});
  }

  // line-art desert
  const R = rng(seed);
  const hz: React.ReactNode[] = [];
  for (let k = 0; k < 9; k++) {
    const y = yH + (k + 0.4) * ((h * 0.5) / 9) * (0.5 + k * 0.12);
    let d = '';
    const ph = R() * 6;
    for (let j = 0; j <= 24; j++) {
      const x = (j / 24) * w;
      d += `${j ? 'L' : 'M'}${x.toFixed(1)},${(y + Math.sin(x / (w * 0.13) + ph + k) * 5 * u * (0.4 + k * 0.2)).toFixed(1)}`;
    }
    hz.push(<path key={k} d={d} fill="none" stroke={ink} strokeWidth={(0.8 + k * 0.1) * u} opacity={0.5} />);
  }
  const props: React.ReactNode[] = [];
  const Rp = rng(seed + 7);
  for (let k = 0; k < 9; k++) {
    const x = w * (0.05 + 0.35 * Rp());
    const y = yH + 8 * u + 40 * u * Rp();
    const s = (0.6 + Rp() * 0.8) * u;
    if (k % 3 === 0) props.push(<rect key={k} x={x} y={y - 8 * s} width={22 * s} height={8 * s} fill={sand} stroke={ink} strokeWidth={1 * u} />);
    else
      props.push(
        <g key={k}>
          <line x1={x} y1={y} x2={x} y2={y - 22 * s} stroke={ink} strokeWidth={1.6 * u} />
          <path d={`M${x},${y - 22 * s}l${10 * s},${3 * s}l${-10 * s},${3 * s}z`} fill={ink} />
        </g>,
      );
  }

  const mound = (x: number, y: number, rw: number, rh: number, key: string) => {
    const top = mix(sand, '#ffffff', 0.55);
    const shade = mix(sand, dust, 0.7);
    const outline = `M${x - rw},${y + rh * 0.4} Q${x - rw * 0.4},${y - rh} ${x},${y - rh} Q${x + rw * 0.5},${y - rh} ${x + rw},${y + rh * 0.4}`;
    return (
      <g key={key}>
        <ellipse cx={x + rw * 0.1} cy={y + rh * 0.45} rx={rw * 1.1} ry={rh * 0.28} fill={shade} opacity={0.8} />
        <path d={outline + 'Z'} fill={top} />
        <path d={`M${x + rw * 0.1},${y - rh * 0.9} Q${x + rw * 0.6},${y - rh * 0.6} ${x + rw},${y + rh * 0.4}L${x + rw * 0.1},${y + rh * 0.4}Z`} fill={shade} opacity={0.75} />
        <path d={outline} fill="none" stroke={ink} strokeWidth={2 * u} opacity={0.85} />
      </g>
    );
  };
  const sIn = proj(at(0));
  const sOut = proj(at(1));
  const mIn = 0.5 + 0.5 * prog(frame, 4, 24, ease.out);
  const mOutT = prog(frame, 100, 130, ease.out);

  // dust
  const puffs: React.ReactNode[] = [];
  const Rd = rng(seed + 31);
  const nP = Math.round(46 * dustAmount);
  for (let k = 0; k < nP; k++) {
    const kind = k % 3;
    const f0 = kind === 0 ? 2 + Rd() * 55 : kind === 1 ? 92 + Rd() * 40 : 20 + Rd() * 100;
    const life = 55 + Rd() * 40;
    const a = (frame - f0) / life;
    const jx = (Rd() - 0.5) * 2;
    const jy = Rd();
    const sz = 0.6 + Rd();
    if (a < 0 || a > 1) continue;
    const base = kind === 1 ? sOut : sIn;
    const x = base.x + jx * r0 * 2.6 * persp(kind === 1 ? 0.9 : 0) + (kind === 0 ? -1 : 1) * a * 70 * u * (0.5 + jy);
    const y = base.y - a * (60 + jy * 90) * u + (jy - 0.3) * 20 * u;
    const rr = (16 + 50 * ease.out(a)) * sz * u * (kind === 2 ? 1.1 : 1);
    const o = 0.5 * Math.pow(1 - a, 1.3) * Math.min(1, a * 8);
    puffs.push(<circle key={k} cx={x} cy={y} r={rr} fill={dust} opacity={o} />);
  }

  const els: React.ReactNode[] = [];
  const bodyFill = (k: number) => mix(k % 2 ? body : mix(body, '#ffffff', 0.12), bodyDark, 0.12 * (k % 3));
  const xf = (c: string) => mix(c, xrayColor, xr);
  for (let i = N - 1; i >= 0; i--) {
    const a = rings[i];
    const b = rings[i + 1];
    if (!a.ok || !b.ok) continue;
    const na = {x: -a.ty, y: a.tx};
    const nb = {x: -b.ty, y: b.tx};
    const pt = (rr: Ring, n: {x: number; y: number}, uu: number) => ({x: rr.c.x + n.x * rr.r * uu, y: rr.c.y + n.y * rr.r * uu});
    const quad = (u0: number, u1: number, v0: number, v1: number) => {
      const A = (uu: number, v: number) => {
        const pa = pt(a, na, uu);
        const pb = pt(b, nb, uu);
        return `${lerp(pa.x, pb.x, v).toFixed(1)},${lerp(pa.y, pb.y, v).toFixed(1)}`;
      };
      return `M${A(u0, v0)}L${A(u1, v0)}L${A(u1, v1)}L${A(u0, v1)}Z`;
    };
    const fillC = xr > 0.01 ? mix(bodyFill(i), i % 2 ? xrayColor : mix(xrayColor, '#ffffff', 0.35), xr) : bodyFill(i);
    const op = lerp(1, 0.5, xr);
    els.push(<path key={'s' + i} d={quad(-1, 1, 0, 1)} fill={fillC} opacity={op} stroke={mix(ink, mix(xrayColor, '#0a3a44', 0.6), xr)} strokeWidth={lerp(1.1, 1.8, xr) * u} strokeOpacity={lerp(0.8, 1, xr)} />);
    const Rr = rng(seed * 100 + i);
    for (let q = 0; q < 4; q++) {
      const u0 = -0.8 + q * 0.42;
      if (Rr() < 0.35) continue;
      const w2 = 0.14 + Rr() * 0.16;
      els.push(<path key={`p${i}-${q}`} d={quad(u0, u0 + w2, 0.2, 0.8)} fill={mix(bodyDark, '#0e6f7e', xr)} opacity={lerp(0.85, 0.6, xr)} />);
    }
    if (i % 4 === 1) els.push(<path key={'g' + i} d={quad(-1, 1, 0.38, 0.52)} fill={xf(accent)} opacity={lerp(1, 0.8, xr)} />);
    els.push(
      <ellipse
        key={'e' + i}
        cx={0}
        cy={0}
        rx={b.r * b.minor}
        ry={b.r}
        transform={`translate(${b.c.x} ${b.c.y}) rotate(${(Math.atan2(b.ty, b.tx) * 180) / Math.PI})`}
        fill="none"
        stroke={mix(ink, '#0a3a44', xr)}
        strokeWidth={lerp(1, 2, xr) * u}
        opacity={lerp(0.65, 0.9, xr)}
      />,
    );
  }
  const hd = rings[0];
  if (hd.ok) {
    const ang = (Math.atan2(hd.ty, hd.tx) * 180) / Math.PI;
    const vis = clamp((hd.tzn - 0.1) / 0.4);
    const teeth: React.ReactNode[] = [];
    for (let t = 0; t < 30; t++) {
      const th = (t / 30) * Math.PI * 2;
      teeth.push(<line key={t} x1={Math.cos(th) * 0.5} y1={Math.sin(th) * 0.5} x2={Math.cos(th) * 0.93} y2={Math.sin(th) * 0.93} stroke={ink} strokeWidth={2.2 * u} vectorEffect="non-scaling-stroke" opacity={0.75} />);
    }
    els.push(
      <g key="head" transform={`translate(${hd.c.x} ${hd.c.y}) rotate(${ang}) scale(${hd.minor} 1)`} opacity={lerp(1, 0.6, xr)}>
        <circle r={hd.r} fill={xr > 0.01 ? xrayColor : mix(body, '#ffffff', 0.18)} fillOpacity={lerp(1, 0.25, xr)} stroke={xr > 0.01 ? xrayColor : ink} strokeWidth={1.4 * u} vectorEffect="non-scaling-stroke" />
        <g transform={`scale(${hd.r})`}>
          <circle r={0.93} fill="none" stroke={xf(accent)} strokeWidth={3 * u} vectorEffect="non-scaling-stroke" />
          <g opacity={0.35 + 0.65 * vis}>{teeth}</g>
          <circle r={0.46} fill={xr > 0.01 ? xrayColor : bodyDark} fillOpacity={lerp(0.9, 0.3, xr)} opacity={0.35 + 0.65 * vis} />
          <circle r={0.2} fill={xr > 0.01 ? xrayColor : '#2a2a28'} opacity={vis} />
        </g>
      </g>,
    );
  }

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <filter id="swb-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={10 * u} />
          </filter>
          <linearGradient id="swb-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mix(background, '#cfd0d4', 0.5)} />
            <stop offset="1" stopColor={background} />
          </linearGradient>
        </defs>
        <rect width={w} height={yH} fill="url(#swb-sky)" />
        <rect y={yH} width={w} height={h - yH} fill={sand} />
        <path d={`M0,${yH}Q${w * 0.3},${yH - 28 * u} ${w * 0.5},${yH - 6 * u}T${w},${yH - 2 * u}`} fill="none" stroke={ink} strokeWidth={1.5 * u} opacity={0.7} />
        {hz}
        {props}
        {mound(sIn.x, sIn.y, r0 * 2.2 * mIn, r0 * 0.5 * mIn, 'in')}
        <g>{els}</g>
        {mound(sOut.x, sOut.y, r0 * persp(0.9) * 2.4 * mOutT, r0 * persp(0.9) * 0.5 * mOutT, 'out')}
        <g filter="url(#swb-blur)">{puffs}</g>
      </Svg>
    </AbsoluteFill>
  );
};

export const segmentedWormBreach = defineMotion<Props>({
  id: 'segmented-worm-breach',
  title: 'Segmented worm breach',
  category: 'environment',
  description: 'A giant panelled mechanical worm with a toothed circular mouth bursts out of a cream line-art desert in a dust plume, arcs toward camera and dives back; optional translucent cyan x-ray pass.',
  source: ['analysis/sheets/r3/v2.jpg'],
  useFor: 'Hero reveal of a colossal machine/creature, desert or sand worlds, sci-fi cold opens, product-as-monster metaphors.',
  durationInFrames: 150,
  defaultProps: {
    background: '#e9e6df',
    sand: '#f2e9cf',
    ink: '#2b2a27',
    body: '#8f8a78',
    bodyDark: '#4a4739',
    accent: '#d9a42a',
    dust: '#c4a981',
    xrayColor: '#4fc3d0',
    xray: false,
    segments: 34,
    size: 1,
    dustAmount: 1,
    seed: 5,
  },
  propDocs: {
    background: 'sky colour',
    sand: 'desert ground colour',
    ink: 'line-art ink colour',
    body: 'worm ring base colour',
    bodyDark: 'panel / shadow colour',
    accent: 'gold ring accents',
    dust: 'dust puff colour',
    xrayColor: 'cyan used in the x-ray pass',
    xray: 'turn the worm translucent cyan x-ray for the middle of the clip',
    segments: 'number of ring segments',
    size: 'worm girth multiplier',
    dustAmount: 'dust puff density (0 = none)',
    seed: 'seed for panels, dunes and dust',
  },
  component: Worm,
  tags: ['worm', 'desert', 'dust', 'machine', '3d', 'xray', 'reveal'],
});
