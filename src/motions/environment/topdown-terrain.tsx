import React, {useMemo} from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {clamp, ease, onTwos} from '../../core/ease';
import {rng, range, pick} from '../../core/random';
import {FilmGrain, Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {PaperCraneTop, circlesD, polysD, shade} from '../../core/world-kit';

type Biome = 'farmland' | 'ocean' | 'desert' | 'snow' | 'city' | 'forest';

type Props = {
  biomes: Biome[];
  montage: boolean;
  speed: number;
  speedRamp: number;
  angle: number;
  hero: 'crane' | 'none';
  heroSrc: string;
  heroSize: number;
  shadow: boolean;
  trail: boolean;
  trailColor: string;
  grain: number;
  seed: string;
};

const P2 = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;

/** generate one seamless (period P along world y) biome tile, content centred on 0,0 */
const genTile = (biome: Biome, seed: string, Wt: number, P: number, u: number): React.ReactNode => {
  const r = rng(`${seed}-${biome}`);
  const X0 = -Wt / 2;
  const Y0 = -P / 2;
  const bg = (c: string) => <rect x={X0 - 10} y={Y0 - 2} width={Wt + 20} height={P + 4} fill={c} />;
  /** duplicate items close to the tile's y edges so the wrap is seamless */
  const wrap = <T extends {y: number}>(items: T[], m: number) => {
    const out = [...items];
    for (const it of items) {
      if (it.y - Y0 < m) out.push({...it, y: it.y + P});
      if (Y0 + P - it.y < m) out.push({...it, y: it.y - P});
    }
    return out;
  };
  const scatterIn = (n: number) => Array.from({length: n}, () => ({x: X0 + r() * Wt, y: Y0 + r() * P}));

  if (biome === 'ocean') {
    const ticks: string[] = [];
    const n = Math.round((Wt * P) / (64 * u) ** 2);
    for (const p of scatterIn(n)) {
      const s = range(r, 4, 7) * u;
      ticks.push(`M${P2(p.x - s, p.y - s * 0.4)}Q${P2(p.x - s * 0.3, p.y + s * 0.3)} ${P2(p.x, p.y - s * 0.2)}Q${P2(p.x + s * 0.3, p.y + s * 0.3)} ${P2(p.x + s, p.y - s * 0.4)}`);
    }
    const blobs = wrap(scatterIn(14).map((p) => ({...p, r: range(r, 120, 260) * u})), 260 * u);
    // boat with V-wake
    const bx = X0 + Wt * 0.3;
    const by = Y0 + P * 0.2;
    return (
      <g>
        {bg('#375f8f')}
        <path d={circlesD(blobs)} fill="#33598a" opacity={0.35} />
        <path d={ticks.join('')} stroke="#d3d7d7" strokeWidth={1.4 * u} fill="none" opacity={0.75} strokeLinecap="round" />
        <g transform={`translate(${bx},${by}) rotate(200)`}>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M0 ${20 * u}L${-(30 + i * 22) * u} ${(70 + i * 55) * u}M0 ${20 * u}L${(30 + i * 22) * u} ${(70 + i * 55) * u}`} stroke="#e8ecec" strokeWidth={1.5 * u} strokeDasharray={`${6 * u} ${5 * u}`} opacity={0.7 - i * 0.15} />
          ))}
          <path d={`M0 ${-26 * u}L${7 * u} ${-8 * u}L${6 * u} ${22 * u}L${-6 * u} ${22 * u}L${-7 * u} ${-8 * u}Z`} fill="#c96a4a" stroke="#2a2630" strokeWidth={1.2 * u} />
          <rect x={-4 * u} y={-4 * u} width={8 * u} height={12 * u} fill="#efe9dc" />
        </g>
      </g>
    );
  }

  if (biome === 'desert') {
    const nb = Math.max(4, Math.round(P / (150 * u)));
    const sp = P / nb;
    const lam = Wt * 0.7;
    const bands: React.ReactNode[] = [];
    for (let k = -1; k <= nb; k++) {
      const y0 = Y0 + k * sp;
      const ph = ((k % nb) + nb) % nb * 1.7;
      const A = 0.04 * Wt * 0.5;
      const ridge = (x: number) => y0 + A * Math.sin((2 * Math.PI * x) / lam + ph);
      const thick = (x: number) => (26 + 18 * Math.sin((2 * Math.PI * x) / (lam * 0.5) + ph * 2)) * u;
      let top = '';
      let bot = '';
      for (let x = X0 - 20; x <= X0 + Wt + 30; x += 20) {
        top += `${top ? 'L' : 'M'}${P2(x, ridge(x))}`;
      }
      for (let x = X0 + Wt + 30; x >= X0 - 20; x -= 20) bot += `L${P2(x, ridge(x) + thick(x))}`;
      bands.push(
        <g key={k}>
          <path d={top + bot + 'Z'} fill="#b0895a" />
          <path d={top + bot + 'Z'} fill={`url(#tdt-hatch-sand-${seed})`} opacity={0.35} />
          <path d={top} stroke="#7f6141" strokeWidth={1.6 * u} fill="none" />
          <path d={top.replace(/(\d) ([-\d.]+)/g, (_m, a, b) => `${a} ${(parseFloat(b) - 10 * u).toFixed(1)}`)} stroke="#e4c891" strokeWidth={6 * u} fill="none" opacity={0.5} />
        </g>,
      );
    }
    // oasis + camels
    const ox = X0 + Wt * 0.22;
    const oy = Y0 + P * 0.62;
    const palms = Array.from({length: 7}, (_, i) => ({x: ox + Math.cos(i * 0.9) * 110 * u, y: oy + Math.sin(i * 0.9) * 70 * u}));
    const camels = Array.from({length: 6}, (_, i) => ({x: X0 + Wt * 0.62 + i * 26 * u, y: Y0 + P * 0.3 + i * 18 * u}));
    return (
      <g>
        <defs>
          <pattern id={`tdt-hatch-sand-${seed}`} patternUnits="userSpaceOnUse" width={6 * u} height={6 * u} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={6 * u} stroke="#6e5232" strokeWidth={1.1 * u} />
          </pattern>
        </defs>
        {bg('#d7b57a')}
        {bands}
        <ellipse cx={ox} cy={oy} rx={190 * u} ry={130 * u} fill="#9cae63" />
        <path d={`M${P2(ox - 90 * u, oy)}C${P2(ox - 80 * u, oy - 70 * u)} ${P2(ox + 70 * u, oy - 60 * u)} ${P2(ox + 85 * u, oy + 5 * u)}C${P2(ox + 70 * u, oy + 60 * u)} ${P2(ox - 70 * u, oy + 55 * u)} ${P2(ox - 90 * u, oy)}Z`} fill="#4f9a9a" stroke="#2f6f72" strokeWidth={2 * u} />
        {palms.map((p, i) => (
          <g key={i} transform={`translate(${p.x},${p.y})`}>
            {Array.from({length: 7}, (_, j) => {
              const a = (j / 7) * Math.PI * 2 + i;
              return <path key={j} d={`M0 0Q${Math.cos(a + 0.3) * 14 * u} ${Math.sin(a + 0.3) * 14 * u} ${Math.cos(a) * 26 * u} ${Math.sin(a) * 26 * u}`} stroke="#3f6b3a" strokeWidth={5 * u} fill="none" strokeLinecap="round" />;
            })}
          </g>
        ))}
        {camels.map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) rotate(-30)`}>
            <path d={`M0 0L${60 * u} ${-8 * u}L${62 * u} ${4 * u}L0 ${10 * u}Z`} fill="#897257" opacity={0.55} />
            <ellipse cx={0} cy={0} rx={13 * u} ry={6 * u} fill="#7a5a3a" />
            <ellipse cx={-14 * u} cy={-1 * u} rx={5 * u} ry={3 * u} fill="#6b4d31" />
            <circle cx={2 * u} cy={-1 * u} r={4 * u} fill="#8a6843" />
          </g>
        ))}
      </g>
    );
  }

  if (biome === 'snow') {
    const peaks = wrap(
      Array.from({length: Math.round((Wt * P) / (520 * u) ** 2)}, () => ({x: X0 + r() * Wt, y: Y0 + r() * P, R: range(r, 130, 250) * u, n: Math.floor(range(r, 8, 12)), rot: r() * 6.28, s: r() * 1000})),
      300 * u,
    );
    const trees = scatterIn(Math.round((Wt * P) / (34 * u) ** 2)).map((p) => ({...p, r: range(r, 4, 8) * u}));
    return (
      <g>
        <defs>
          <pattern id={`tdt-hatch-snow-${seed}`} patternUnits="userSpaceOnUse" width={5 * u} height={5 * u} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={5 * u} stroke="#5d6274" strokeWidth={1 * u} />
          </pattern>
        </defs>
        {bg('#556e5c')}
        <path d={circlesD(trees)} fill="#48604f" />
        <ellipse cx={X0 + Wt * 0.7} cy={Y0 + P * 0.15} rx={70 * u} ry={46 * u} fill="#9fd0d8" stroke="#eef3f5" strokeWidth={4 * u} />
        {peaks.map((pk, i) => {
          const pr = rng(pk.s);
          const outer: [number, number][] = [];
          const inner: [number, number][] = [];
          for (let k = 0; k < pk.n * 2; k++) {
            const a = pk.rot + (k / (pk.n * 2)) * Math.PI * 2;
            const rr = k % 2 ? pk.R * range(pr, 0.35, 0.5) : pk.R * range(pr, 0.75, 1.1);
            outer.push([pk.x + Math.cos(a) * rr, pk.y + Math.sin(a) * rr]);
            inner.push([pk.x + Math.cos(a) * rr * 0.55, pk.y + Math.sin(a) * rr * 0.55]);
          }
          const tips = outer.filter((_, k) => k % 2 === 0);
          // shaded half (lower-right of every spike)
          const shadeHalf = outer.map((p, k) => (k % 2 ? [p, tips[(k + 1) / 2 % tips.length], [pk.x, pk.y]] : null)).filter(Boolean) as [number, number][][];
          return (
            <g key={i}>
              <polygon points={outer.map(([x, y]) => `${x + 14 * u},${y + 12 * u}`).join(' ')} fill="#3f5446" opacity={0.5} />
              <polygon points={outer.map(([x, y]) => `${x},${y}`).join(' ')} fill="#9ea2af" stroke="#6e7282" strokeWidth={1.4 * u} />
              <polygon points={inner.map(([x, y]) => `${x},${y}`).join(' ')} fill="#e8e9ee" />
              <path d={polysD(shadeHalf)} fill={`url(#tdt-hatch-snow-${seed})`} opacity={0.6} />
              <path d={tips.map(([x, y]) => `M${P2(pk.x, pk.y)}L${P2(x, y)}`).join('')} stroke="#7f8394" strokeWidth={1.2 * u} />
            </g>
          );
        })}
      </g>
    );
  }

  if (biome === 'city') {
    const g = 92 * u;
    const nX = Math.ceil(Wt / g) + 1;
    const nY = Math.round(P / g);
    const gy = P / nY;
    const blocks: [number, number][][] = [];
    const parks: [number, number][][] = [];
    const lots: [number, number][][] = [];
    for (let i = 0; i < nX; i++)
      for (let j = 0; j < nY; j++) {
        const x = X0 + i * g;
        const y = Y0 + j * gy;
        const m = 6 * u;
        const q: [number, number][] = [[x + m, y + m], [x + g - m, y + m], [x + g - m, y + gy - m], [x + m, y + gy - m]];
        if (r() < 0.07) parks.push(q);
        else blocks.push(q);
        if (r() < 0.5) {
          const a = range(r, 0.15, 0.45) * g;
          const b = range(r, 0.15, 0.45) * gy;
          const lx = x + m + r() * (g - 2 * m - a);
          const ly = y + m + r() * (gy - 2 * m - b);
          lots.push([[lx, ly], [lx + a, ly], [lx + a, ly + b], [lx, ly + b]]);
        }
      }
    const lights = scatterIn(Math.round((Wt * P) / (16 * u) ** 2)).map((p) => {
      const s = range(r, 1.2, 2.6) * u;
      return [[p.x, p.y], [p.x + s, p.y], [p.x + s, p.y + s], [p.x, p.y + s]] as [number, number][];
    });
    let grid = '';
    for (let i = 0; i <= nX; i++) grid += `M${P2(X0 + i * g, Y0 - 2)}L${P2(X0 + i * g, Y0 + P + 2)}`;
    for (let j = 0; j <= nY; j++) grid += `M${P2(X0, Y0 + j * gy)}L${P2(X0 + Wt, Y0 + j * gy)}`;
    const rx = X0 + Wt * 0.62;
    return (
      <g>
        {bg('#171128')}
        <path d={polysD(blocks)} fill="#24203f" />
        <path d={polysD(lots)} fill="#1b1631" />
        <path d={polysD(parks)} fill="#1f3a33" />
        <path d={polysD(lights.slice(0, Math.floor(lights.length * 0.75)))} fill="#f2d27a" opacity={0.85} />
        <path d={polysD(lights.slice(Math.floor(lights.length * 0.75)))} fill="#ffffff" opacity={0.7} />
        <path d={grid} stroke="#a79469" strokeWidth={2 * u} opacity={0.85} />
        <rect x={rx} y={Y0 - 2} width={110 * u} height={P + 4} fill="#0c0919" />
        <path d={`M${P2(rx, Y0)}L${P2(rx, Y0 + P)}M${P2(rx + 110 * u, Y0)}L${P2(rx + 110 * u, Y0 + P)}`} stroke="#a79469" strokeWidth={1.4 * u} opacity={0.6} />
      </g>
    );
  }

  if (biome === 'forest') {
    const cell = 34 * u;
    const cols = ['#b39349', '#aa6533', '#9b3d2a', '#7a6a38', '#c2a14f', '#5e6a36'];
    const groups: {x: number; y: number; r: number}[][] = cols.map(() => []);
    const nY = Math.round(P / cell);
    const cy = P / nY;
    const pathX = (y: number) => X0 + Wt * 0.38 + Wt * 0.1 * Math.sin((2 * Math.PI * y) / P) + Wt * 0.04 * Math.sin((6 * Math.PI * y) / P + 1);
    const lake = {x: X0 + Wt * 0.18, y: Y0 + P * 0.3, rx: 200 * u, ry: 130 * u};
    for (let j = 0; j < nY; j++)
      for (let x = X0; x < X0 + Wt + cell; x += cell) {
        const y = Y0 + j * cy + range(r, -0.3, 0.3) * cy;
        const xx = x + range(r, -0.3, 0.3) * cell + (j % 2) * cell * 0.5;
        if (Math.abs(xx - pathX(y)) < 22 * u) continue;
        if (((xx - lake.x) / lake.rx) ** 2 + ((y - lake.y) / lake.ry) ** 2 < 1) continue;
        groups[Math.floor(r() * cols.length)].push({x: xx, y, r: range(r, 0.55, 0.8) * cell});
      }
    const all = groups.flat();
    let road = '';
    for (let y = Y0 - 10; y <= Y0 + P + 10; y += 15) road += `${road ? 'L' : 'M'}${P2(pathX(y), y)}`;
    return (
      <g>
        {bg('#4a4526')}
        <path d={circlesD(all.map((c) => ({...c, x: c.x + 4 * u, y: c.y + 4 * u})))} fill="#2c2412" opacity={0.45} />
        {groups.map((gr, i) => (
          <path key={i} d={circlesD(gr)} fill={cols[i]} stroke={shade(cols[i], -0.25)} strokeWidth={1.4 * u} />
        ))}
        <path d={circlesD(all.filter((_, i) => i % 3 === 0).map((c) => ({x: c.x - c.r * 0.25, y: c.y - c.r * 0.25, r: c.r * 0.35})))} fill="#ffffff" opacity={0.1} />
        <path d={road} stroke="#6b5a3c" strokeWidth={26 * u} fill="none" />
        <path d={road} stroke="#d8c9a3" strokeWidth={18 * u} fill="none" />
        <ellipse cx={lake.x} cy={lake.y} rx={lake.rx} ry={lake.ry} fill="#4f8fa0" stroke="#2f5f6a" strokeWidth={3 * u} />
      </g>
    );
  }

  // farmland: jittered field lattice (periodic in y), river, road, town roofs, red bridge
  const c = 125 * u;
  const nY = Math.round(P / c);
  const cy = P / nY;
  const nX = Math.ceil(Wt / c) + 2;
  const jit: [number, number][][] = Array.from({length: nX + 1}, () => Array.from({length: nY}, () => [range(r, -0.22, 0.22) * c, range(r, -0.22, 0.22) * cy]));
  const L = (i: number, j: number): [number, number] => {
    const jj = ((j % nY) + nY) % nY;
    const wrapY = Math.floor(j / nY) * P;
    return [X0 - c + i * c + jit[i][jj][0], Y0 + jj * cy + jit[i][jj][1] + wrapY];
  };
  const pal = ['#bfba79', '#7dab69', '#97b96d', '#b3c079', '#9fc5d6', '#a9b56c', '#c9b77f', '#88b06a'];
  const fields: [number, number][][][] = pal.map(() => []);
  for (let i = 0; i < nX; i++)
    for (let j = 0; j < nY; j++) {
      const q = [L(i, j), L(i + 1, j), L(i + 1, j + 1), L(i, j + 1)];
      const ci = Math.floor(r() * pal.length);
      fields[ci].push(q);
    }
  const rx = (y: number) => X0 + Wt * 0.58 + Wt * 0.07 * Math.sin((2 * Math.PI * y) / P + 0.5) + Wt * 0.025 * Math.sin((6 * Math.PI * y) / P);
  const rw = 70 * u;
  let rl = '';
  let rr = '';
  let road = '';
  for (let y = Y0 - 20; y <= Y0 + P + 20; y += 15) {
    rl += `${rl ? 'L' : 'M'}${P2(rx(y) - rw / 2, y)}`;
    road += `${road ? 'L' : 'M'}${P2(rx(y) - rw / 2 - 70 * u, y)}`;
  }
  for (let y = Y0 + P + 20; y >= Y0 - 20; y -= 15) rr += `L${P2(rx(y) + rw / 2, y)}`;
  // houses in rows along the road on the town stretch
  const roofs: [number, number][][][] = [[], [], []];
  const shadows: [number, number][][] = [];
  const ridges: string[] = [];
  for (let side = 0; side < 4; side++) {
    const off = [-110, -155, 40, 85][side] * u;
    for (let y = Y0 + P * 0.05; y < Y0 + P * 0.55; y += range(r, 18, 26) * u) {
      if (r() < 0.12) continue;
      const x = rx(y) + (side < 2 ? -rw / 2 : rw / 2) + off;
      const hw = range(r, 6, 9) * u;
      const hh = range(r, 9, 13) * u;
      const q: [number, number][] = [[x - hw, y - hh], [x + hw, y - hh], [x + hw, y + hh], [x - hw, y + hh]];
      roofs[Math.floor(r() * 3)].push(q);
      shadows.push(q.map(([a, b]) => [a + 5 * u, b + 4 * u]));
      ridges.push(`M${P2(x, y - hh)}L${P2(x, y + hh)}`);
    }
  }
  const trees = wrap(scatterIn(Math.round((Wt * P) / (90 * u) ** 2)).map((p) => ({...p, r: range(r, 5, 10) * u})), 12 * u).filter((t) => Math.abs(t.x - rx(t.y)) > rw);
  const by = Y0 + P * 0.3;
  return (
    <g>
      {bg('#8bad7d')}
      {fields.map((f, i) => (
        <path key={i} d={polysD(f)} fill={pal[i]} />
      ))}
      <path d={polysD(fields.flat())} fill="none" stroke="#6f8a55" strokeWidth={1.6 * u} opacity={0.55} />
      <path d={circlesD(trees.map((t) => ({...t, x: t.x + 3 * u, y: t.y + 3 * u})))} fill="#2f4a2a" opacity={0.35} />
      <path d={circlesD(trees)} fill="#4f7f45" />
      <path d={road} stroke="#d8cfae" strokeWidth={10 * u} fill="none" />
      <path d={rl + rr + 'Z'} fill="#74a4ab" stroke="#4f7f86" strokeWidth={3 * u} />
      <path d={rl.replace(/(\d) ([-\d.]+)/g, (_m, a, b) => `${a} ${b}`)} transform={`translate(${rw * 0.35},0)`} stroke="#bfe0e4" strokeWidth={1.4 * u} strokeDasharray={`${14 * u} ${30 * u}`} fill="none" opacity={0.7} />
      <path d={polysD(shadows)} fill="#2a2630" opacity={0.25} />
      {roofs.map((rf, i) => (
        <path key={i} d={polysD(rf)} fill={['#5e6278', '#8b5a4a', '#a46a52'][i]} stroke="#2a2630" strokeWidth={0.8 * u} />
      ))}
      <path d={ridges.join('')} stroke="#ffffff" strokeWidth={0.8 * u} opacity={0.35} />
      <rect x={rx(by) - rw * 0.9} y={by - 7 * u} width={rw * 1.8} height={14 * u} fill="#c0392b" stroke="#2a2630" strokeWidth={1.2 * u} />
    </g>
  );
};

const SEG_WEIGHTS = [1.67, 1.67, 1.25, 1.25, 0.83, 0.83, 0.83];

const TopdownTerrain: React.FC<Props> = ({biomes, montage, speed, speedRamp, angle, hero, heroSrc, heroSize, shadow, trail, trailColor, grain, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, durationInFrames: D} = useStage();
  const list = (biomes.length ? biomes : ['farmland']) as Biome[];
  const diag = Math.sqrt(w * w + h * h);
  const Wt = Math.ceil(diag * 1.08);
  const P = Math.ceil(diag * 1.08);

  // segments (biome hard-cut montage)
  const segs = useMemo(() => {
    if (!montage || list.length === 1) return [{biome: list[0], from: 0, to: D, i: 0}];
    const ws = list.map((_, i) => (i === list.length - 1 ? 1.67 : SEG_WEIGHTS[i % SEG_WEIGHTS.length]));
    const tot = ws.reduce((a, b) => a + b, 0);
    let acc = 0;
    return list.map((b, i) => {
      const from = Math.round((acc / tot) * D);
      acc += ws[i];
      return {biome: b, from, to: Math.round((acc / tot) * D), i};
    });
  }, [montage, list.join(','), D]);
  const seg = segs.find((s) => frame >= s.from && frame < s.to) ?? segs[segs.length - 1];

  const tile = useMemo(() => genTile(seg.biome, `${seed}-${seg.i}`, Wt, P, u), [seg.biome, seg.i, seed, Wt, P, u]);

  // speed ramps 1 -> speedRamp across the clip (px / frame @1080)
  const v0 = speed * u;
  const s = v0 * (frame + ((speedRamp - 1) * frame * frame) / (2 * D));
  const vNow = v0 * (1 + ((speedRamp - 1) * frame) / D);
  const off = ((s % P) + P) % P;
  const tileId = `tdt-${seed}-${seg.i}`;
  const th = (angle * Math.PI) / 180;

  // hero: on twos, flap 0.6 s, small drift
  const f2 = onTwos(frame);
  const flapPh = (f2 / 18) * Math.PI * 2;
  const spread = 0.87 + 0.13 * Math.cos(flapPh);
  const hx = cx + w * 0.012 * Math.sin(frame / 45);
  const hy = cy + h * 0.01 * Math.cos(frame / 37);
  const size = heroSize * u;
  const shOff = {x: 0.12 * Math.min(w, h) * 1.1, y: 0.105 * Math.min(w, h) * 1.1};
  // whale breach event in the ocean
  const oceanEvent = seg.biome === 'ocean';
  const fe = seg.from + (seg.to - seg.from) * 0.25;
  const sAt = (f: number) => v0 * (f + ((speedRamp - 1) * f * f) / (2 * D));
  const lf = frame - fe;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Svg>
        <defs>
          <g id={tileId}>{tile}</g>
          <pattern id={`tdt-hatch-${seed}`} patternUnits="userSpaceOnUse" width={6 * u} height={6 * u} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={6 * u} stroke="#1d1a22" strokeWidth={2.4 * u} />
          </pattern>
        </defs>
        <g transform={`translate(${cx},${cy}) rotate(${angle})`}>
          <g transform={`translate(0,${off})`}>
            <use href={`#${tileId}`} />
            <use href={`#${tileId}`} y={-P} />
          </g>
          {oceanEvent && lf > -20 && lf < 60 && (
            <g transform={`translate(${-210 * u},${-sAt(fe) + s + 90 * u})`}>
              <g opacity={0.6 * clamp((lf + 20) / 15) * (1 - clamp((lf - 30) / 25))} transform={`rotate(-20) scale(${1 + 0.15 * clamp(lf / 15)})`}>
                <path d={`M${-110 * u} 0C${-80 * u} ${-34 * u} ${70 * u} ${-30 * u} ${110 * u} 0C${70 * u} ${30 * u} ${-80 * u} ${34 * u} ${-110 * u} 0Z`} fill="#1f3550" />
                <path d={`M${-105 * u} 0L${-150 * u} ${-24 * u}L${-140 * u} 0L${-150 * u} ${24 * u}Z`} fill="#1f3550" />
              </g>
              {[0, 1, 2, 3, 4].map((i) => {
                const st = 12 + i * 2;
                const g = ease.back(clamp((lf - st) / 10));
                const fade = 1 - clamp((lf - 34 - i * 2) / 14);
                const a = i * 1.3;
                return g > 0 && fade > 0 ? <circle key={i} cx={(60 + Math.cos(a) * 24) * u} cy={Math.sin(a) * 22 * u} r={(16 + i * 4) * u * g} fill="#f4f6f4" opacity={fade} /> : null;
              })}
            </g>
          )}
        </g>
        {/* flight trail streams away behind the crane */}
        {trail && hero !== 'none' && (
          <path
            d={`M${hx - Math.sin(th) * size * 0.8} ${hy + Math.cos(th) * size * 0.8} Q${hx - Math.sin(th) * diag * 0.3 + 30 * u} ${hy + Math.cos(th) * diag * 0.3} ${hx - Math.sin(th) * diag} ${hy + Math.cos(th) * diag}`}
            stroke={trailColor}
            strokeWidth={3 * u}
            fill="none"
            strokeDasharray={`${16 * u} ${10 * u}`}
            strokeDashoffset={-s * 1.0}
            opacity={0.9}
          />
        )}
        {hero === 'crane' && !heroSrc && (
          <>
            {shadow && (
              <g transform={`translate(${hx + shOff.x},${hy + shOff.y}) rotate(${angle}) scale(0.92)`} opacity={0.6}>
                <PaperCraneTop size={size} spread={spread} u={u} fill={`url(#tdt-hatch-${seed})`} shadeFill={`url(#tdt-hatch-${seed})`} stroke={false} />
              </g>
            )}
            <g transform={`translate(${hx},${hy}) rotate(${angle}) scale(${1 + 0.02 * Math.sin(flapPh)})`}>
              <PaperCraneTop size={size} spread={spread} u={u} />
            </g>
          </>
        )}
      </Svg>
      {heroSrc && hero !== 'none' && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <Img src={staticFile(heroSrc)} style={{width: size * 2, height: size * 2, objectFit: 'contain', transform: `translate(${hx - cx}px,${hy - cy}px) rotate(${angle}deg)`, filter: `drop-shadow(${shOff.x}px ${shOff.y}px 0 rgba(20,18,25,0.35))`}} />
        </AbsoluteFill>
      )}
      {grain > 0 && <FilmGrain opacity={grain} />}
      <Vignette strength={0.25} />
      {/* keep vNow referenced for future speed-lines; tiny speed-dependent haze */}
      <AbsoluteFill style={{background: '#fff', opacity: clamp((vNow / u - 14) / 40) * 0.08, mixBlendMode: 'soft-light'}} />
    </AbsoluteFill>
  );
};

export const topdownTerrain = defineMotion<Props>({
  id: 'topdown-terrain',
  title: 'Top-down terrain scroll',
  category: 'environment',
  description:
    'Bird’s-eye view: a fixed paper crane (with hatched cast shadow and streaming dashed trail) flies over seeded top-down terrain — fields, river and town roofs, ocean with a whale breach, desert dunes, snowy peaks, night city, autumn forest — that scrolls diagonally with a speed ramp and hard-cuts between biomes.',
  source: ['video1 0:18-0:28 topdown-terrain-scroll', 'video1 0:18-0:28 biome-hardcut-montage'],
  useFor: 'Journeys and "around the world" montages, travel/progress beats, map-like transitions under a hero.',
  durationInFrames: 240,
  defaultProps: {
    biomes: ['farmland', 'ocean', 'desert', 'snow', 'city', 'forest'],
    montage: true,
    speed: 8,
    speedRamp: 1.96,
    angle: 40,
    hero: 'crane',
    heroSrc: '',
    heroSize: 165,
    shadow: true,
    trail: true,
    trailColor: '#8688ad',
    grain: 0.06,
    seed: 'journey',
  },
  propDocs: {
    biomes: 'list of biomes: farmland | ocean | desert | snow | city | forest',
    montage: 'hard-cut through all biomes (true) or scroll only the first one (false)',
    speed: 'ground speed in px per frame at 1080 (8 = source farmland speed)',
    speedRamp: 'speed multiplier reached at the end (1.96 = 8 -> 15.7 px/f as in the source)',
    angle: 'flight heading in degrees clockwise from up (terrain moves the opposite way)',
    hero: '"crane" (procedural paper crane) or "none"',
    heroSrc: 'optional public/ image path used as the hero instead of the crane',
    heroSize: 'hero half-wingspan in u',
    shadow: 'hatched cast shadow under the hero',
    trail: 'dashed flight trail behind the hero',
    trailColor: 'trail colour',
    grain: 'paper grain opacity',
    seed: 'terrain seed',
  },
  component: TopdownTerrain,
  tags: ['map', 'aerial', 'travel', 'journey', 'montage', 'terrain', 'crane'],
});
