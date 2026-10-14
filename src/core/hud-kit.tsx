import React from 'react';
import {clamp} from './ease';
import {rng} from './random';
import {useStage} from './stage';

/**
 * Shared helpers for the data/ and hud/ families (blueprint line art of video19, HUD text of
 * videos 9/17/23, iso projection colours of video7). Everything here is pure and deterministic.
 */

/** video19 blueprint palette */
export const BP = {
  bg: '#090A0F',
  scan: '#15161B',
  line: '#DADDE5',
  line60: '#8A8C93',
  line25: '#303136',
  steel: '#485E7F',
  blue: '#4777D2',
  blueMid: '#5474B4',
  blueDeep: '#2F5594',
  dotCore: '#75AAF7',
  dotGlow: '#3477FC',
  amber: '#9C7A45',
};

/** hex colour mix (a -> b by t) */
export const mixHex = (a: string, b: string, t: number) => {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const k = clamp(t);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
const parseHex = (h: string) => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) || 0);
};
export const shade = (h: string, t: number) => (t >= 0 ? mixHex(h, '#ffffff', t) : mixHex(h, '#000000', -t));

/** characters typed so far at `cps` chars/second (30 fps) */
export const typed = (text: string, frame: number, start: number, cps = 30) => {
  if (frame < start) return '';
  const n = Math.floor(((frame - start) / 30) * cps) + 1;
  return text.slice(0, Math.max(0, n));
};

/** smoothstep */
export const sstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const NS = {vectorEffect: 'non-scaling-stroke' as const};

/** video19 scanline texture: rows of fine dashes, drifting with an optional parallax offset */
export const ScanlineBg: React.FC<{color?: string; gap?: number; seed?: number; offsetX?: number; opacity?: number}> = ({color = BP.scan, gap = 6, seed = 19, offsetX = 0, opacity = 1}) => {
  const {w, h, u} = useStage();
  const d = React.useMemo(() => {
    const r = rng(seed);
    const rows = Math.ceil(h / (gap * u));
    let s = '';
    const W = w + 400 * u;
    for (let i = 0; i < rows; i++) {
      const y = (i + 0.5) * gap * u;
      let x = -200 * u + r() * 120 * u;
      while (x < W) {
        const len = (20 + r() * 180) * u;
        if (r() > 0.35) s += `M${x.toFixed(1)} ${y.toFixed(1)}h${len.toFixed(1)}`;
        x += len + (10 + r() * 90) * u;
      }
    }
    return s;
  }, [w, h, u, gap, seed]);
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity}}>
      <path d={d} stroke={color} strokeWidth={Math.max(1, u)} transform={`translate(${((offsetX % (200 * u)) + 200 * u) % (200 * u) - 100 * u},0)`} />
    </svg>
  );
};

/** glowing blue dot (video19 blue-dot motif) */
export const GlowDot: React.FC<{x: number; y: number; r: number; id: string; boost?: number; core?: string; glow?: string}> = ({x, y, r, id, boost = 1, core = BP.dotCore, glow = BP.dotGlow}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-gd`}>
        <stop offset="0%" stopColor={glow} stopOpacity={0.75 * clamp(boost, 0, 1.5)} />
        <stop offset="35%" stopColor={glow} stopOpacity={0.28 * boost} />
        <stop offset="100%" stopColor={glow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * 5 * Math.sqrt(boost)} fill={`url(#${id}-gd)`} />
    <circle cx={x} cy={y} r={r} fill={core} />
    <circle cx={x} cy={y} r={r * 0.45} fill="#EAF2FF" />
  </g>
);

/** saw-tooth gear outline (video19 era dial rim / background gears) */
export const gearPath = (R: number, teeth: number, h: number, saw = true) => {
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + (saw ? 0.15 : 0.25)) / teeth) * Math.PI * 2;
    const a2 = ((i + (saw ? 0.5 : 0.5)) / teeth) * Math.PI * 2;
    const a3 = ((i + (saw ? 0.85 : 0.75)) / teeth) * Math.PI * 2;
    const p = (a: number, r: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
    if (saw) d += `${i === 0 ? 'M' : 'L'}${p(a0, R)} L${p(a2, R + h)} `;
    else d += `${i === 0 ? 'M' : 'L'}${p(a0, R)} L${p(a1, R + h)} L${p(a2, R + h)} L${p(a3, R)} `;
  }
  return d + 'Z';
};

/** circle tick ring as one path (n ticks between r0 and r1, every `major`-th longer) */
export const tickRing = (n: number, r0: number, r1: number, major = 0, majorExtra = 0) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const e = major && i % major === 0 ? majorExtra : 0;
    d += `M${(Math.cos(a) * (r0 - e)).toFixed(4)} ${(Math.sin(a) * (r0 - e)).toFixed(4)}L${(Math.cos(a) * r1).toFixed(4)} ${(Math.sin(a) * r1).toFixed(4)}`;
  }
  return d;
};

/** circle as a path (so it can take draw-on dashes with pathLength) */
export const circlePath = (r: number, start = -Math.PI / 2) => {
  const f = (v: number) => v.toFixed(5);
  const x0 = Math.cos(start) * r;
  const y0 = Math.sin(start) * r;
  return `M${f(x0)} ${f(y0)}A${f(r)} ${f(r)} 0 1 1 ${f(-x0)} ${f(-y0)}A${f(r)} ${f(r)} 0 1 1 ${f(x0)} ${f(y0)}`;
};

/** draw-on props for a path that declares pathLength={1} */
export const draw = (t: number) => (t >= 0.999 ? {} : {pathLength: 1, strokeDasharray: `${Math.max(0, t).toFixed(4)} 2`, strokeDashoffset: 0});

type PlanGeo = {
  shelves: string[];
  hatched: string[];
  dots: string;
  squares: string;
  spokes: string;
  hubTicks: string;
  hubSpokes: string;
  hubMarks: string;
  paths: {pts: [number, number][]; len: number}[];
  ringRadii: number[];
};

/** seeded geometry of the video19 circular library plan, in unit radius */
const planGeometry = (seed: number, sectors: number, rings: number, paths: number): PlanGeo => {
  const r = rng(seed);
  const inner = 0.31;
  const edges: number[] = [];
  for (let i = 0; i <= rings; i++) edges.push(inner + ((1 - inner) * i) / rings);
  const shelves: string[] = [];
  const hatched: string[] = [];
  let dots = '';
  const rect = (cx: number, cy: number, a: number, w: number, hh: number) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const pts = [
      [-w / 2, -hh / 2],
      [w / 2, -hh / 2],
      [w / 2, hh / 2],
      [-w / 2, hh / 2],
    ].map(([x, y]) => `${(cx + x * c - y * s).toFixed(4)} ${(cy + x * s + y * c).toFixed(4)}`);
    return `M${pts[0]}L${pts[1]}L${pts[2]}L${pts[3]}Z`;
  };
  for (let k = 0; k < rings; k++) {
    const r0 = edges[k] + 0.012;
    const r1 = edges[k + 1] - 0.012;
    const rows = Math.max(1, Math.round((r1 - r0) / 0.05));
    let sh = '';
    let ht = '';
    for (let s = 0; s < sectors; s++) {
      const a0 = (s / sectors) * Math.PI * 2 + 0.02;
      const a1 = ((s + 1) / sectors) * Math.PI * 2 - 0.02;
      for (let row = 0; row < rows; row++) {
        const rr = r0 + ((row + 0.5) * (r1 - r0)) / rows;
        const step = 0.042;
        const n = Math.max(1, Math.floor(((a1 - a0) * rr) / step));
        for (let j = 0; j < n; j++) {
          if (r() < 0.08) {
            const a = a0 + ((j + 0.5) / n) * (a1 - a0);
            dots += `M${(Math.cos(a) * rr + 0.006).toFixed(4)} ${(Math.sin(a) * rr).toFixed(4)}a0.006 0.006 0 1 0 -0.012 0a0.006 0.006 0 1 0 0.012 0`;
            continue;
          }
          const a = a0 + ((j + 0.5) / n) * (a1 - a0);
          const wv = step * (0.62 + r() * 0.2);
          const hv = ((r1 - r0) / rows) * (0.62 + r() * 0.2);
          const d = rect(Math.cos(a) * rr, Math.sin(a) * rr, a + Math.PI / 2 + (r() - 0.5) * 0.12, wv, hv);
          if (r() < 0.34) ht += d;
          else sh += d;
        }
      }
    }
    shelves.push(sh);
    hatched.push(ht);
  }
  let spokes = '';
  for (let s = 0; s < sectors; s++) {
    const a = (s / sectors) * Math.PI * 2;
    spokes += `M${(Math.cos(a) * inner).toFixed(4)} ${(Math.sin(a) * inner).toFixed(4)}L${Math.cos(a).toFixed(4)} ${Math.sin(a).toFixed(4)}`;
  }
  let squares = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + 0.13;
    const x = Math.cos(a) * 1.035;
    const y = Math.sin(a) * 1.035;
    squares += `M${(x - 0.008).toFixed(4)} ${(y - 0.008).toFixed(4)}h0.016v0.016h-0.016Z`;
  }
  let hubSpokes = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    hubSpokes += `M${(Math.cos(a) * 0.035).toFixed(4)} ${(Math.sin(a) * 0.035).toFixed(4)}L${(Math.cos(a) * 0.3).toFixed(4)} ${(Math.sin(a) * 0.3).toFixed(4)}`;
  }
  let hubMarks = '';
  for (let k = 0; k < 2; k++) {
    const rr = k ? 0.235 : 0.155;
    const n = k ? 24 : 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.1;
      hubMarks += `M${(Math.cos(a) * rr - 0.006).toFixed(4)} ${(Math.sin(a) * rr - 0.006).toFixed(4)}h0.012v0.012h-0.012Z`;
    }
  }
  const pathsOut: {pts: [number, number][]; len: number}[] = [];
  for (let p = 0; p < paths; p++) {
    const base = (p / paths) * Math.PI * 2 + r() * 0.9 + 0.3;
    const pts: [number, number][] = [];
    const a1 = base + (r() - 0.5) * 0.25;
    pts.push([Math.cos(base) * 2.2, Math.sin(base) * 2.2]);
    pts.push([Math.cos(base + 0.08) * 1.3, Math.sin(base + 0.08) * 1.3]);
    pts.push([Math.cos(a1) * 0.85, Math.sin(a1) * 0.85]);
    pts.push([Math.cos(a1 - 0.06) * 0.3, Math.sin(a1 - 0.06) * 0.3]);
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    pathsOut.push({pts, len});
  }
  return {shelves, hatched, dots, squares, spokes, hubTicks: tickRing(120, 0.282, 0.3), hubSpokes, hubMarks, paths: pathsOut, ringRadii: edges};
};

/** point at fraction t along a polyline */
export const alongPolyline = (pts: [number, number][], t: number): [number, number, number] => {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(l);
    total += l;
  }
  let d = clamp(t) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? d / segs[i] : 0;
      const a = pts[i];
      const b = pts[i + 1];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
    }
    d -= segs[i];
  }
  const l = pts[pts.length - 1];
  return [l[0], l[1], 0];
};

/**
 * video19 radial-plan-blueprint: concentric rings of hatched shelf blocks, 12 sector spokes,
 * a glowing blue hub and blue accent paths. Drawn in unit space and scaled to `r` pixels,
 * hairlines stay crisp (non-scaling strokes) so it can sit inside zooms.
 */
export const RadialPlan: React.FC<{
  id: string;
  cx: number;
  cy: number;
  r: number;
  seed?: number;
  sectors?: number;
  rings?: number;
  accentPaths?: number;
  /** 0..1 rings + shelves reveal outward */
  reveal?: number;
  /** 0..1 blue hub */
  hub?: number;
  /** 0..1 accent paths draw in from outside */
  paths?: number;
  /** 0..1 fine-detail opacity (LOD) */
  detail?: number;
  rotate?: number;
  /** flowing node phase (frames) */
  flow?: number;
  line?: string;
  blue?: string;
  u?: number;
}> = ({id, cx, cy, r, seed = 7, sectors = 12, rings = 4, accentPaths = 3, reveal = 1, hub = 1, paths = 1, detail = 1, rotate = 0, flow = 0, line = BP.line, blue = BP.blue, u = 1}) => {
  const g = React.useMemo(() => planGeometry(seed, sectors, rings, accentPaths), [seed, sectors, rings, accentPaths]);
  const hw = Math.max(0.6, u);
  const sw = (x: number) => (x * hw) / Math.max(1e-6, r);
  return (
    <g transform={`translate(${cx},${cy}) rotate(${rotate}) scale(${r})`}>
      {/* outer frame */}
      <path d={circlePath(1)} fill="none" stroke={line} strokeOpacity={0.55} strokeWidth={sw(1.4)} {...draw(reveal * 1.3)} />
      <path d={circlePath(1.02)} fill="none" stroke={line} strokeOpacity={0.3} strokeWidth={sw(1)} {...draw(reveal * 1.2)} />
      <path d={g.squares} fill="none" stroke={line} strokeOpacity={0.45 * clamp(reveal * 2 - 1)} strokeWidth={sw(1)} />
      {/* crosshair */}
      <path d="M-1.08 0H1.08M0 -1.08V1.08" stroke={line} strokeOpacity={0.4 * clamp(reveal * 2)} strokeWidth={sw(1)} />
      {/* ring circles + spokes */}
      {g.ringRadii.map((rr, i) => (
        <path key={i} d={circlePath(rr, -Math.PI / 2 + i)} fill="none" stroke={line} strokeOpacity={0.4} strokeWidth={sw(1)} {...draw(clamp(reveal * 1.6 - i * 0.12))} />
      ))}
      <path d={g.spokes} stroke={line} strokeOpacity={0.3 * clamp(reveal * 2 - 0.3)} strokeWidth={sw(1)} />
      {/* shelves per annulus, revealed outward */}
      {g.shelves.map((d, k) => {
        const o = clamp(reveal * (rings + 1) - k - 0.6) * detail;
        if (o <= 0.01) return null;
        return (
          <g key={k} opacity={o}>
            <path d={d} fill="none" stroke={line} strokeOpacity={0.36} strokeWidth={sw(0.8)} />
            <path d={g.hatched[k]} fill={line} fillOpacity={0.16} stroke={line} strokeOpacity={0.36} strokeWidth={sw(0.8)} />
          </g>
        );
      })}
      <path d={g.dots} fill="none" stroke={line} strokeOpacity={0.5 * detail * clamp(reveal * 2 - 1)} strokeWidth={sw(1)} />
      {/* accent paths */}
      {g.paths.map((p, i) => {
        const t = clamp(paths * 1.25 - i * 0.12);
        if (t <= 0) return null;
        const d = `M${p.pts.map((q) => `${q[0].toFixed(4)} ${q[1].toFixed(4)}`).join('L')}`;
        const nodes = [0, 1, 2, 3, 4].map((k) => {
          const ph = (((flow / 90 + k / 5 + i * 0.13) % 1) + 1) % 1;
          return alongPolyline(p.pts, 1 - ph);
        });
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={blue} strokeOpacity={0.22} strokeWidth={sw(14)} strokeLinejoin="round" {...draw(t)} />
            <path d={d} fill="none" stroke={blue} strokeWidth={sw(5)} strokeLinejoin="round" {...draw(t)} />
            <path d={d} fill="none" stroke="#9DBBF0" strokeOpacity={0.7} strokeWidth={sw(1)} strokeDasharray={`${(4 * hw) / Math.max(1e-6, r)} ${(8 * hw) / Math.max(1e-6, r)}`} opacity={t >= 1 ? 1 : 0} />
            {t >= 1 &&
              nodes.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={0.008} fill="#CFE0FF" opacity={0.9} />)}
          </g>
        );
      })}
      {/* hub */}
      {hub > 0 && (
        <g opacity={clamp(hub * 1.5)}>
          {[0.12, 0.2, 0.3].map((rr, i) => (
            <g key={i}>
              <path d={circlePath(rr)} fill="none" stroke={blue} strokeOpacity={0.25} strokeWidth={sw(10)} {...draw(clamp(hub * 1.4 - i * 0.15))} />
              <path d={circlePath(rr)} fill="none" stroke={blue} strokeWidth={sw(i === 2 ? 3 : 2)} {...draw(clamp(hub * 1.4 - i * 0.15))} />
            </g>
          ))}
          <path d={g.hubSpokes} stroke={blue} strokeWidth={sw(2.2)} opacity={clamp(hub * 2 - 0.6)} />
          <path d={g.hubTicks} stroke={line} strokeOpacity={0.45} strokeWidth={sw(0.8)} opacity={clamp(hub * 2 - 1) * detail} />
          <path d={g.hubMarks} fill={line} fillOpacity={0.55} opacity={clamp(hub * 2 - 1) * detail} />
          <circle r={0.045} fill="none" stroke="#BFD4FF" strokeWidth={sw(1.2)} />
        </g>
      )}
    </g>
  );
};

/** hatched background gear (video19 dial scene) */
export const HatchGear: React.FC<{cx: number; cy: number; R: number; teeth?: number; rotate?: number; id: string; color?: string; u?: number}> = ({cx, cy, R, teeth = 28, rotate = 0, id, color = '#3A3B41', u = 1}) => (
  <g transform={`translate(${cx},${cy}) rotate(${rotate})`}>
    <defs>
      <pattern id={`${id}-h`} patternUnits="userSpaceOnUse" width={5 * u} height={5 * u} patternTransform="rotate(45)">
        <line x1={0} y1={0} x2={0} y2={5 * u} stroke={color} strokeWidth={1.2 * u} />
      </pattern>
    </defs>
    <path d={gearPath(R * 0.86, teeth, R * 0.14)} fill="none" stroke={color} strokeWidth={1.5 * u} />
    <circle r={R * 0.6} fill={`url(#${id}-h)`} stroke={color} strokeWidth={1.5 * u} />
    {Array.from({length: 6}, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return <line key={i} x1={Math.cos(a) * R * 0.12} y1={Math.sin(a) * R * 0.12} x2={Math.cos(a) * R * 0.6} y2={Math.sin(a) * R * 0.6} stroke="#55565c" strokeWidth={1.5 * u} />;
    })}
    <circle r={R * 0.12} fill={BP.bg} stroke={color} strokeWidth={1.5 * u} />
  </g>
);

export type IconKind = 'plan' | 'press' | 'book' | 'computer' | 'monitor' | 'network' | 'build' | 'inspect' | 'ask' | 'teach' | 'scroll';

/** hatched human figure (video19 scholars), feet at (x, y), height h */
const Figure: React.FC<{x: number; y: number; h: number; fill: string; stroke: string; sw: number; arm?: number}> = ({x, y, h, fill, stroke, sw, arm}) => {
  const hr = h * 0.11;
  const bw = h * 0.17;
  return (
    <g>
      <circle cx={x} cy={y - h + hr} r={hr} fill="none" stroke={stroke} strokeWidth={sw} />
      <path d={`M${x - bw} ${y} C${x - bw * 1.1} ${y - h * 0.5} ${x - bw * 0.9} ${y - h * 0.74} ${x} ${y - h * 0.76} C${x + bw * 0.9} ${y - h * 0.74} ${x + bw * 1.1} ${y - h * 0.5} ${x + bw} ${y} Z`} fill={fill} stroke={stroke} strokeWidth={sw} />
      {arm !== undefined && <path d={`M${x + bw * 0.6} ${y - h * 0.55} L${x + bw * 1.6} ${y - h * 0.42} L${x + bw * 1.6 + Math.cos(arm) * h * 0.25} ${y - h * 0.42 + Math.sin(arm) * h * 0.25}`} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />}
    </g>
  );
};

/**
 * Line-art vignettes (video19 era dial windows and medallions), drawn in a box of half-size `s`
 * centred at (x, y). `accent` draws the blue highlight strokes.
 */
export const LineIcon: React.FC<{kind: IconKind; x: number; y: number; s: number; sw: number; id: string; line?: string; accent?: string; t?: number}> = ({kind, x, y, s, sw, id, line = BP.line, accent = BP.blue, t = 0}) => {
  const P = (px: number, py: number) => `${(x + px * s).toFixed(1)} ${(y + py * s).toFixed(1)}`;
  const hatch = `url(#${id}-hatch)`;
  const common = {fill: 'none', stroke: line, strokeWidth: sw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  const defs = (
    <defs>
      <pattern id={`${id}-hatch`} patternUnits="userSpaceOnUse" width={s * 0.06} height={s * 0.06} patternTransform="rotate(45)">
        <line x1={0} y1={0} x2={0} y2={s * 0.06} stroke={line} strokeWidth={sw * 0.6} strokeOpacity={0.7} />
      </pattern>
    </defs>
  );
  let body: React.ReactNode = null;
  switch (kind) {
    case 'plan':
      body = (
        <g>
          {[0.25, 0.5, 0.75, 0.95].map((rr, i) => (
            <circle key={i} cx={x} cy={y} r={rr * s} {...common} strokeOpacity={0.4 + i * 0.12} />
          ))}
          {Array.from({length: 8}, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + t * 0.02;
            return <line key={i} x1={x + Math.cos(a) * 0.25 * s} y1={y + Math.sin(a) * 0.25 * s} x2={x + Math.cos(a) * 0.95 * s} y2={y + Math.sin(a) * 0.95 * s} stroke={i % 3 === 0 ? accent : line} strokeOpacity={i % 3 === 0 ? 1 : 0.4} strokeWidth={i % 3 === 0 ? sw * 2 : sw} />;
          })}
          <circle cx={x} cy={y} r={0.25 * s} fill="none" stroke={accent} strokeWidth={sw * 2} />
        </g>
      );
      break;
    case 'press':
      body = (
        <g>
          <path d={`M${P(-0.75, 0.8)} L${P(-0.75, -0.75)} L${P(0.75, -0.75)} L${P(0.75, 0.8)}`} {...common} />
          <path d={`M${P(-0.9, -0.75)} L${P(0.9, -0.75)} M${P(-0.9, 0.8)} L${P(0.9, 0.8)}`} {...common} />
          <rect x={x - 0.08 * s} y={y - 0.75 * s} width={0.16 * s} height={0.55 * s} fill={hatch} stroke={line} strokeWidth={sw} />
          <rect x={x - 0.55 * s} y={y - 0.2 * s} width={1.1 * s} height={0.18 * s} fill={hatch} stroke={line} strokeWidth={sw} />
          <rect x={x - 0.6 * s} y={y + 0.3 * s} width={1.2 * s} height={0.14 * s} {...common} />
          <path d={`M${P(0.08, -0.5)} L${P(0.08 + Math.cos(t * 0.15) * 0.5, -0.5 + Math.sin(t * 0.15) * 0.2)}`} stroke={accent} strokeWidth={sw * 2} />
          {[-0.4, -0.2, 0, 0.2, 0.4].map((k) => (
            <line key={k} x1={x + (k - 0.06) * s} y1={y + 0.37 * s} x2={x + (k + 0.06) * s} y2={y + 0.37 * s} stroke={line} strokeWidth={sw} />
          ))}
        </g>
      );
      break;
    case 'book':
      body = (
        <g>
          {[-0.85, -0.55, -0.25].map((yy) => (
            <g key={yy}>
              <line x1={x - 0.85 * s} y1={y + yy * s} x2={x + 0.85 * s} y2={y + yy * s} stroke={line} strokeWidth={sw} strokeOpacity={0.6} />
              {Array.from({length: 12}, (_, i) => (
                <rect key={i} x={x + (-0.82 + i * 0.137) * s} y={y + (yy - 0.26) * s} width={0.09 * s} height={(0.22 + ((i * 7) % 4) * 0.01) * s} fill={i % 3 === 0 ? hatch : 'none'} stroke={line} strokeWidth={sw * 0.7} strokeOpacity={0.6} />
              ))}
            </g>
          ))}
          <path d={`M${P(0, 0.05)} C${P(-0.3, -0.05)} ${P(-0.6, 0)} ${P(-0.8, 0.1)} L${P(-0.8, 0.75)} C${P(-0.6, 0.65)} ${P(-0.3, 0.62)} ${P(0, 0.72)} Z`} fill={BP.bg} stroke={line} strokeWidth={sw} />
          <path d={`M${P(0, 0.05)} C${P(0.3, -0.05)} ${P(0.6, 0)} ${P(0.8, 0.1)} L${P(0.8, 0.75)} C${P(0.6, 0.65)} ${P(0.3, 0.62)} ${P(0, 0.72)} Z`} fill={BP.bg} stroke={line} strokeWidth={sw} />
          {[0.2, 0.32, 0.44, 0.56].map((yy, i) => (
            <g key={yy}>
              <line x1={x - 0.65 * s} y1={y + yy * s} x2={x - 0.12 * s} y2={y + (yy - 0.03) * s} stroke={i === 1 ? accent : line} strokeWidth={i === 1 ? sw * 1.8 : sw * 0.7} />
              <line x1={x + 0.12 * s} y1={y + (yy - 0.03) * s} x2={x + 0.65 * s} y2={y + yy * s} stroke={line} strokeWidth={sw * 0.7} />
            </g>
          ))}
        </g>
      );
      break;
    case 'computer':
      body = (
        <g>
          {[-0.85, -0.28, 0.29].map((xx, k) => (
            <g key={xx}>
              <rect x={x + xx * s} y={y - 0.75 * s} width={0.56 * s} height={1.45 * s} {...common} />
              {Array.from({length: 12}, (_, i) => {
                const cx = x + (xx + 0.1 + (i % 3) * 0.18) * s;
                const cy = y + (-0.6 + Math.floor(i / 3) * 0.24) * s;
                const on = (Math.floor(t / 4) + i * 3 + k * 5) % 7 < 2;
                return <circle key={i} cx={cx} cy={cy} r={0.055 * s} fill={on ? accent : 'none'} stroke={line} strokeWidth={sw * 0.8} />;
              })}
              <rect x={x + (xx + 0.06) * s} y={y + 0.38 * s} width={0.44 * s} height={0.2 * s} fill={hatch} stroke={line} strokeWidth={sw * 0.8} />
            </g>
          ))}
          <path d={`M${P(-0.6, 0.7)} C${P(-0.5, 0.95)} ${P(0, 0.95)} ${P(0.05, 0.7)}`} {...common} strokeOpacity={0.7} />
        </g>
      );
      break;
    case 'monitor':
      body = (
        <g>
          <rect x={x - 0.85 * s} y={y - 0.7 * s} width={1.7 * s} height={1.1 * s} rx={0.06 * s} {...common} />
          <rect x={x - 0.75 * s} y={y - 0.6 * s} width={1.5 * s} height={0.9 * s} {...common} strokeOpacity={0.5} />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={x - 0.62 * s} y1={y + (-0.42 + i * 0.13) * s} x2={x + (-0.62 + [0.7, 1.0, 0.5, 0.8][i]) * s} y2={y + (-0.42 + i * 0.13) * s} stroke={i === 1 ? accent : line} strokeWidth={i === 1 ? sw * 1.8 : sw * 0.8} strokeOpacity={i === 1 ? 1 : 0.6} />
          ))}
          <circle cx={x + 0.45 * s} cy={y + 0.05 * s} r={0.05 * s} fill={accent} />
          <path d={`M${P(-0.15, 0.4)} L${P(-0.22, 0.72)} L${P(0.22, 0.72)} L${P(0.15, 0.4)}`} {...common} />
          <line x1={x - 0.45 * s} y1={y + 0.72 * s} x2={x + 0.45 * s} y2={y + 0.72 * s} {...common} />
        </g>
      );
      break;
    case 'network': {
      const nodes: [number, number][] = [
        [0, 0],
        [-0.6, -0.5],
        [0.55, -0.6],
        [0.7, 0.35],
        [-0.65, 0.45],
        [0, 0.8],
        [0.05, -0.85],
      ];
      body = (
        <g>
          {nodes.slice(1).map((n, i) => (
            <line key={i} x1={x} y1={y} x2={x + n[0] * s} y2={y + n[1] * s} stroke={i % 2 ? line : accent} strokeWidth={i % 2 ? sw : sw * 1.8} strokeOpacity={i % 2 ? 0.6 : 1} />
          ))}
          <path d={`M${P(-0.6, -0.5)} L${P(0.05, -0.85)} L${P(0.55, -0.6)} L${P(0.7, 0.35)} L${P(0, 0.8)} L${P(-0.65, 0.45)} Z`} {...common} strokeOpacity={0.4} />
          {nodes.map((n, i) => (
            <circle key={i} cx={x + n[0] * s} cy={y + n[1] * s} r={(i ? 0.09 : 0.16) * s} fill={i ? BP.bg : accent} stroke={line} strokeWidth={sw} />
          ))}
          <circle cx={x} cy={y} r={(0.28 + 0.06 * Math.sin(t * 0.2)) * s} {...common} strokeOpacity={0.35} />
        </g>
      );
      break;
    }
    case 'scroll':
      body = (
        <g>
          <rect x={x - 0.55 * s} y={y - 0.6 * s} width={1.1 * s} height={1.2 * s} {...common} />
          <ellipse cx={x} cy={y - 0.6 * s} rx={0.62 * s} ry={0.1 * s} fill={hatch} stroke={line} strokeWidth={sw} />
          <ellipse cx={x} cy={y + 0.6 * s} rx={0.62 * s} ry={0.1 * s} fill={hatch} stroke={line} strokeWidth={sw} />
          {[-0.3, -0.1, 0.1, 0.3].map((yy, i) => (
            <line key={yy} x1={x - 0.4 * s} y1={y + yy * s} x2={x + (i === 2 ? 0.1 : 0.4) * s} y2={y + yy * s} stroke={i === 1 ? accent : line} strokeWidth={sw} />
          ))}
        </g>
      );
      break;
    case 'build':
      body = (
        <g>
          <Figure x={x - 0.62 * s} y={y + 0.72 * s} h={1.05 * s} fill={hatch} stroke={line} sw={sw} />
          <Figure x={x - 0.25 * s} y={y + 0.72 * s} h={1.05 * s} fill={hatch} stroke={line} sw={sw} arm={-0.8} />
          <rect x={x + 0.25 * s} y={y - 0.7 * s} width={0.3 * s} height={1.42 * s} fill={hatch} stroke={accent} strokeWidth={sw * 1.6} />
          <path d={`M${P(-0.05, -0.05)} L${P(0.3, -0.62)}`} stroke={accent} strokeWidth={sw * 1.6} />
          <line x1={x - 0.95 * s} y1={y + 0.72 * s} x2={x + 0.95 * s} y2={y + 0.72 * s} stroke={line} strokeWidth={sw} />
          <path d={`M${P(0.4, -0.85)} C${P(0.55, -0.85)} ${P(0.62, -0.75)} ${P(0.6, -0.6)}`} fill="none" stroke={line} strokeWidth={sw} strokeDasharray={`${sw * 3} ${sw * 3}`} />
        </g>
      );
      break;
    case 'inspect':
      body = (
        <g>
          <Figure x={x - 0.45 * s} y={y + 0.72 * s} h={1.1 * s} fill={hatch} stroke={line} sw={sw} arm={-0.6} />
          <rect x={x + 0.0 * s} y={y - 0.65 * s} width={0.85 * s} height={0.65 * s} {...common} />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={x + 0.1 * s} y1={y + (-0.53 + i * 0.11) * s} x2={x + (0.1 + [0.6, 0.45, 0.65, 0.4, 0.55][i]) * s} y2={y + (-0.53 + i * 0.11) * s} stroke={i === 2 ? accent : line} strokeWidth={i === 2 ? sw * 1.8 : sw * 0.8} />
          ))}
          <path d={`M${P(-0.4, -0.15)} L${P(0, -0.3)}`} stroke={line} strokeWidth={sw} strokeDasharray={`${sw * 2} ${sw * 2}`} />
          <line x1={x - 0.95 * s} y1={y + 0.72 * s} x2={x + 0.95 * s} y2={y + 0.72 * s} stroke={line} strokeWidth={sw} />
        </g>
      );
      break;
    case 'ask':
      body = (
        <g>
          <Figure x={x - 0.4 * s} y={y + 0.72 * s} h={1.2 * s} fill={hatch} stroke={line} sw={sw} arm={-0.45} />
          <rect x={x + 0.3 * s} y={y - 0.95 * s} width={0.7 * s} height={1.67 * s} fill={hatch} stroke={line} strokeWidth={sw} />
          {[-0.6, -0.3, 0, 0.3].map((yy) => (
            <line key={yy} x1={x + 0.3 * s} y1={y + yy * s} x2={x + 1 * s} y2={y + yy * s} stroke={line} strokeWidth={sw} strokeOpacity={0.7} />
          ))}
          <line x1={x + 0.3 * s} y1={y - 0.12 * s} x2={x + 1 * s} y2={y - 0.12 * s} stroke={accent} strokeWidth={sw * 2} />
          <line x1={x - 0.95 * s} y1={y + 0.72 * s} x2={x + 0.95 * s} y2={y + 0.72 * s} stroke={line} strokeWidth={sw} />
        </g>
      );
      break;
    case 'teach':
      body = (
        <g>
          <Figure x={x - 0.5 * s} y={y + 0.72 * s} h={1.2 * s} fill={hatch} stroke={line} sw={sw} arm={-1.2} />
          {[0.05, 0.4, 0.75].map((xx) => (
            <Figure key={xx} x={x + xx * s} y={y + 0.72 * s} h={0.6 * s} fill="none" stroke={line} sw={sw} />
          ))}
          <path d={`M${P(-0.2, -0.75)} L${P(0.8, -0.75)} L${P(0.8, -0.25)} L${P(-0.2, -0.25)} Z`} {...common} strokeOpacity={0.7} />
          <path d={`M${P(-0.05, -0.45)} L${P(0.25, -0.6)} L${P(0.45, -0.4)} L${P(0.65, -0.62)}`} fill="none" stroke={accent} strokeWidth={sw * 1.8} />
          <line x1={x - 0.95 * s} y1={y + 0.72 * s} x2={x + 0.95 * s} y2={y + 0.72 * s} stroke={line} strokeWidth={sw} />
        </g>
      );
      break;
  }
  return (
    <g>
      {defs}
      {body}
    </g>
  );
};

/** polar radar grid (video19 radar-spoke-draw / radar target) */
export const RadarGrid: React.FC<{cx: number; cy: number; r: number; rings?: number; spokes?: number; color?: string; opacity?: number; sw?: number; draw?: number}> = ({cx, cy, r, rings = 4, spokes = 12, color = BP.steel, opacity = 0.6, sw = 1, draw: dr = 1}) => (
  <g transform={`translate(${cx},${cy})`} opacity={opacity}>
    {Array.from({length: rings}, (_, i) => (
      <path key={i} d={circlePath((r * (i + 1)) / rings)} fill="none" stroke={color} strokeWidth={sw} {...draw(clamp(dr * 1.4 - i * 0.1))} />
    ))}
    {Array.from({length: spokes}, (_, i) => {
      const a = (i / spokes) * Math.PI * 2 - Math.PI / 2;
      return <line key={i} x1={0} y1={0} x2={Math.cos(a) * r * clamp(dr)} y2={Math.sin(a) * r * clamp(dr)} stroke={color} strokeWidth={sw} />;
    })}
  </g>
);
