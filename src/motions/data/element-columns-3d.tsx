import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Reverse-engineered from a "periodic table in 3D" explainer: a dark lab room, the table laid out as rows of
 * 3D tiles on a wooden bench; the columns rise from the floor to heights set by one property (here melting
 * point) so a single element towers, a caption pill sits at the bottom and the camera drifts around the bench.
 * SVG pseudo-3D (painter's algorithm, per-face shading, symbols mapped onto the tile tops). Sample values are
 * illustrative (approximate melting points in K, unknown superheavy elements filled with placeholders).
 */
type Props = {
  values: number[];
  unit: string;
  caption: string;
  highlightLabel: string;
  highlightIndex: number;
  colors: string[];
  background: string;
  floorColor: string;
  maxHeight: number;
  orbitDeg: number;
  startYaw: number;
  pitch: number;
  showCaption: boolean;
};

const SYMS =
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(
    ' ',
  );
const NAMES: Record<string, string> = {C: 'Carbon', W: 'Tungsten', Re: 'Rhenium', Ta: 'Tantalum', Os: 'Osmium', Mo: 'Molybdenum', B: 'Boron'};

const VALUES = [14,1,454,1560,2349,3800,63,54,53,25,371,923,933,1687,317,388,172,84,337,1115,1814,1941,2183,2180,1519,1811,1768,1728,1358,693,303,1211,1090,494,266,116,312,1050,1799,2128,2750,2896,2430,2607,2237,1828,1235,594,430,505,904,723,387,161,302,1000,1193,1068,1208,1297,1315,1345,1099,1585,1629,1680,1734,1802,1818,1097,1925,2506,3290,3695,3459,3306,2739,2041,1337,234,577,601,544,527,575,202,300,973,1323,2115,1841,1405,917,913,1449,1613,1259,1173,1133,1800,1100,1100,1900,600,600,600,600,600,600,600,600,283,700,340,670,700,720,325];

/** atomic number (1-based) -> [col,row] grid cell */
const cellOf = (z: number): [number, number] => {
  if (z === 1) return [0, 0];
  if (z === 2) return [17, 0];
  if (z <= 4) return [z - 3, 1];
  if (z <= 10) return [z + 7, 1];
  if (z <= 12) return [z - 11, 2];
  if (z <= 18) return [z - 1, 2];
  if (z <= 36) return [z - 19, 3];
  if (z <= 54) return [z - 37, 4];
  if (z <= 56) return [z - 55, 5];
  if (z <= 71) return [z - 55, 8];
  if (z <= 86) return [z - 69, 5];
  if (z <= 88) return [z - 87, 6];
  if (z <= 103) return [z - 87, 9];
  return [z - 101, 6];
};
/** 0 alkali/alkaline, 1 transition, 2 post-transition, 3 nonmetal, 4 noble, 5 f-block */
const groupOf = (z: number, col: number, row: number): number => {
  if (row >= 8) return 5;
  if (col === 17) return 4;
  if (col <= 1 && z > 2) return 0;
  if (col >= 2 && col <= 11) return 1;
  if (z === 1 || [6, 7, 8, 15, 16, 34].includes(z)) return 3;
  if (col >= 12) return 2;
  return 3;
};

const hex2 = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0];
};
const mul = (h: string, k: number, add = 0) => {
  const [r, g, b] = hex2(h);
  const c = (v: number) => Math.round(clamp(v * k + add, 0, 255));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
};
type P2 = [number, number];
const pts = (arr: P2[]) => arr.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

const ElementColumns3D: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const vals = SYMS.map((_, i) => (typeof p.values[i] === 'number' ? p.values[i] : VALUES[i] ?? 0));
  const vmax = Math.max(...vals, 1);
  let top = p.highlightIndex >= 0 && p.highlightIndex < 118 ? p.highlightIndex : vals.indexOf(vmax);
  if (top < 0) top = 0;
  const cols = p.colors.length ? p.colors : ['#F28C38', '#2FB8B0', '#8A6FD8', '#5FA8F0', '#E87FA8', '#E6C34A'];
  const colOf = (g: number) => cols[g % cols.length];

  const dur = 270;
  const yaw = ((p.startYaw + p.orbitDeg * ease.inOut(clamp(frame / dur))) * Math.PI) / 180;
  const pr = (p.pitch * Math.PI) / 180;
  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const sp = Math.sin(pr), cp = Math.cos(pr);
  const S = Math.min((w * 0.94) / (portrait ? 25 : w / h < 1.3 ? 24 : 21), (h * (portrait ? 0.5 : 0.7)) / (10 * sp + p.maxHeight * cp + 2));
  const ox = w / 2;
  const oy = h * (portrait ? 0.46 : 0.5) + (p.maxHeight * cp * S) / 2 - 0.6 * S;
  const proj = (x: number, y: number, z: number): [number, number, number] => {
    const rx = x * cyw - y * syw;
    const ry = x * syw + y * cyw;
    return [ox + rx * S, oy + (ry * sp - z * cp) * S, ry];
  };

  const intro = prog(frame, 0, 24, ease.out);
  const label = prog(frame, 120, 150, ease.out);
  const capIn = prog(frame, 60, 90, ease.out);
  const cyc = 4.5;

  // wooden bench
  const FX = 10.4, fy0 = -1.6 - cyc, fy1 = 11.2 - cyc;
  const floorQ = ([[-FX, fy0], [FX, fy0], [FX, fy1], [-FX, fy1]] as P2[]).map(([x, y]) => proj(x, y, -0.12));
  const edges: React.ReactNode[] = [];
  const sidesB: {n: P2; a: P2; b: P2}[] = [
    {n: [0, -1], a: [-FX, fy0], b: [FX, fy0]},
    {n: [1, 0], a: [FX, fy0], b: [FX, fy1]},
    {n: [0, 1], a: [FX, fy1], b: [-FX, fy1]},
    {n: [-1, 0], a: [-FX, fy1], b: [-FX, fy0]},
  ];
  sidesB.forEach((s, i) => {
    if (s.n[0] * syw + s.n[1] * cyw <= 0.02) return;
    const q = [proj(s.a[0], s.a[1], -0.12), proj(s.b[0], s.b[1], -0.12), proj(s.b[0], s.b[1], -0.8), proj(s.a[0], s.a[1], -0.8)];
    edges.push(<polygon key={i} points={pts(q.map((v) => [v[0], v[1]] as P2))} fill={mul(p.floorColor, 0.38)} />);
  });

  type Item = {z: number; row: number; col: number; depth: number; hgt: number; g: number};
  const items: Item[] = [];
  for (let z = 1; z <= 118; z++) {
    const [col, row] = cellOf(z);
    const d = proj(col - 8.5, row - cyc, 0)[2];
    const norm = vals[z - 1] / vmax;
    const stagger = (col / 17) * 40 + row * 2;
    const gr = prog(frame, 14 + stagger, 14 + stagger + 55, ease.out);
    items.push({z, row, col, depth: d, hgt: 0.12 + p.maxHeight * norm * gr, g: groupOf(z, col, row)});
  }
  items.sort((a, b) => a.depth - b.depth);

  const T = 0.44;
  const lightDir: P2 = [-0.5, -0.6];
  const parts = items.map((it) => {
    const gx = it.col - 8.5, gy = it.row - cyc;
    const isTop = it.z - 1 === top;
    const base = colOf(it.g);
    const lit = isTop ? 1.35 : 1;
    const x0 = gx - T, x1 = gx + T, y0 = gy - T, y1 = gy + T, hz = it.hgt;
    const out: React.ReactNode[] = [];
    const sides: {n: P2; q: [number, number, number][]}[] = [
      {n: [0, -1], q: [[x0, y0, 0], [x1, y0, 0], [x1, y0, hz], [x0, y0, hz]]},
      {n: [1, 0], q: [[x1, y0, 0], [x1, y1, 0], [x1, y1, hz], [x1, y0, hz]]},
      {n: [0, 1], q: [[x1, y1, 0], [x0, y1, 0], [x0, y1, hz], [x1, y1, hz]]},
      {n: [-1, 0], q: [[x0, y1, 0], [x0, y0, 0], [x0, y0, hz], [x0, y1, hz]]},
    ];
    for (let i = 0; i < 4; i++) {
      const s = sides[i];
      if (s.n[0] * syw + s.n[1] * cyw <= 0.02) continue;
      const lamb = clamp(0.5 + 0.5 * (s.n[0] * lightDir[0] + s.n[1] * lightDir[1]));
      out.push(
        <polygon
          key={'s' + i}
          points={pts(s.q.map(([a, b, c]) => {
            const v = proj(a, b, c);
            return [v[0], v[1]] as P2;
          }))}
          fill={mul(base, (0.32 + 0.38 * lamb) * lit, isTop ? 14 : 0)}
          stroke={mul(base, 0.2)}
          strokeWidth={0.6 * u}
        />,
      );
    }
    const tq = ([[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as P2[]).map(([a, b]) => proj(a, b, hz));
    const topFill = isTop ? mul(base, 1.2, 40) : mul(base, 0.62 + 0.2 * (hz / (p.maxHeight + 0.12)), 4);
    out.push(<polygon key="t" points={pts(tq.map((q) => [q[0], q[1]] as P2))} fill={topFill} stroke={mul(base, 0.25)} strokeWidth={0.6 * u} />);
    const o = proj(x0, y0, hz), ex = proj(x1, y0, hz), ey = proj(x0, y1, hz);
    const a = (ex[0] - o[0]) / (2 * T), b = (ex[1] - o[1]) / (2 * T);
    const c2 = (ey[0] - o[0]) / (2 * T), d = (ey[1] - o[1]) / (2 * T);
    if (S * T * 2 > 20 * u) {
      out.push(
        <g key="x" transform={`matrix(${a} ${b} ${c2} ${d} ${o[0]} ${o[1]})`} fontFamily={fonts.sans} fill="#fff" fillOpacity={isTop ? 1 : 0.9}>
          <text x={T} y={T * 1.25} fontSize={0.52} fontWeight={800} textAnchor="middle">{SYMS[it.z - 1]}</text>
          <text x={0.08} y={0.22} fontSize={0.2} fontWeight={600} fillOpacity={0.7}>{it.z}</text>
        </g>,
      );
    }
    return <g key={it.z} opacity={intro}>{out}</g>;
  });

  const tIt = items.find((i) => i.z - 1 === top)!;
  const tcx = tIt.col - 8.5, tcy = tIt.row - cyc;
  // anchor on the tile's top-most corner on screen so the leader never covers the symbol
  const tp = ([[-T, -T], [T, -T], [T, T], [-T, T]] as P2[]).map(([a, b]) => proj(tcx + a, tcy + b, tIt.hgt)).reduce((m, q) => (q[1] < m[1] ? q : m));
  const sym = SYMS[top];
  const text = p.highlightLabel || `${NAMES[sym] ?? sym}  ${Math.round(vals[top])} ${p.unit}`;
  const fs = 30 * u;
  const lw = text.length * 0.56 * fs + 36 * u;
  const lx = clamp(tp[0] + 40 * u, lw / 2 + 12 * u, w - lw / 2 - 12 * u);
  const ly = Math.max(tp[1] - (70 + 40 * label) * u, 60 * u);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="element-columns-3d-room" cx="50%" cy="38%" r="75%">
            <stop offset="0" stopColor="#1d3550" />
            <stop offset="0.6" stopColor={p.background} />
            <stop offset="1" stopColor="#05070c" />
          </radialGradient>
          <linearGradient id="element-columns-3d-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mul(p.floorColor, 0.75)} />
            <stop offset="1" stopColor={mul(p.floorColor, 1.15)} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill="url(#element-columns-3d-room)" />
        {edges}
        <polygon points={pts(floorQ.map((q) => [q[0], q[1]] as P2))} fill="url(#element-columns-3d-wood)" stroke={mul(p.floorColor, 0.5)} strokeWidth={1.5 * u} />
        {[2, 4, 6, 8, 10].map((k) => {
          const y = fy0 + (k * (fy1 - fy0)) / 12;
          const a = proj(-FX, y, -0.12), b = proj(FX, y, -0.12);
          return <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={mul(p.floorColor, 0.55)} strokeWidth={1 * u} opacity={0.6} />;
        })}
        {parts}
        <g opacity={label}>
          <line x1={tp[0]} y1={tp[1] - 6 * u} x2={lx} y2={ly + 20 * u} stroke="#fff" strokeWidth={2 * u} strokeOpacity={0.8} />
          <circle cx={tp[0]} cy={tp[1]} r={(7 + 3 * Math.sin(frame / 6)) * u} fill="#fff" fillOpacity={0.9} stroke="#fff" strokeWidth={2 * u} />
          <rect x={lx - lw / 2} y={ly - 24 * u} width={lw} height={48 * u} rx={24 * u} fill="rgba(8,14,24,0.88)" stroke={colOf(tIt.g)} strokeWidth={2 * u} />
          <text x={lx} y={ly + 10 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={fs} fill="#fff">{text}</text>
        </g>
      </svg>
      {p.showCaption && p.caption ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: (portrait ? 150 : 56) * u,
            display: 'flex',
            justifyContent: 'center',
            opacity: capIn,
            transform: `translateY(${lerp(16, 0, capIn) * u}px)`,
          }}
        >
          <div
            style={{
              background: 'rgba(6,10,18,0.82)',
              border: `${1.5 * u}px solid rgba(255,255,255,0.18)`,
              color: '#fff',
              fontFamily: fonts.sans,
              fontWeight: 600,
              fontSize: 32 * u,
              padding: `${14 * u}px ${34 * u}px`,
              borderRadius: 999,
              maxWidth: w * 0.88,
              textAlign: 'center',
            }}
          >
            {p.caption}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const elementColumns3d = defineMotion<Props>({
  id: 'element-columns-3d',
  title: 'Element columns 3D',
  category: 'data',
  description:
    'A periodic table of 3D tiles on a wooden bench in a dark lab: the columns rise from the floor to heights set by a property (melting point), the camera drifts round, the tallest column is tagged with a label and a caption pill sits at the bottom. Sample values are illustrative.',
  source: ['analysis/sheets/r3/v1.jpg'],
  useFor: 'Show a property across the periodic table (or any 118-item grid dataset) and call out the extreme; science explainers.',
  durationInFrames: 270,
  defaultProps: {
    values: VALUES,
    unit: 'K',
    caption: 'The taller the column, the higher its melting point.',
    highlightLabel: '',
    highlightIndex: -1,
    colors: ['#F28C38', '#2FB8B0', '#8A6FD8', '#5FA8F0', '#E87FA8', '#E6C34A'],
    background: '#0b1522',
    floorColor: '#8a5a33',
    maxHeight: 4,
    orbitDeg: 38,
    startYaw: -22,
    pitch: 52,
    showCaption: true,
  },
  propDocs: {
    values: '118 numbers in atomic-number order (default: illustrative melting points in K); sets column heights',
    unit: 'unit shown in the auto label',
    caption: 'bottom caption pill text',
    highlightLabel: 'text for the tallest-column label (empty = element name + value)',
    highlightIndex: 'zero-based element index to highlight (-1 = the tallest)',
    colors: 'six group colours: alkali, transition, post-transition, nonmetal, noble gas, f-block',
    background: 'room colour',
    floorColor: 'wooden bench colour',
    maxHeight: 'tallest column height in tile widths',
    orbitDeg: 'camera orbit over the clip, degrees',
    startYaw: 'starting camera yaw, degrees',
    pitch: 'camera elevation, degrees',
    showCaption: 'show the caption pill',
  },
  component: ElementColumns3D,
  tags: ['periodic-table', 'chemistry', '3d', 'data', 'bars', 'science'],
});
