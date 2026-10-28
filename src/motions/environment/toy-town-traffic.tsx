// Adapted from lemo-opuscar styles/tilt-shift/demo/traffic.js + main.js (stepT) + DEMO.md (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {cl, keys, lerp, mixC, seg, shade, sm, TAU, TiltBand, useUid, type Pt} from '../../core/r2-lb3a-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  seed: number;
  blocks: [number, number];
  density: number;
  rate: [number, number][];
  lightCycle: number;
  view: 'top' | 'oblique';
  rotation: number;
  pitch: number;
  follow: boolean;
  band: {center: number; width: number; falloff: number; maxBlur: number};
  heroColor: string;
  carColors: string[];
  walls: string[];
  roofs: string[];
  asphalt: string;
  grass: string;
  water: string;
  clock: boolean;
  saturation: number;
  vignette: number;
};

const FPS = 30;
const BS = 60; // block size (m)
const RW = 14; // road width (m)
const P = BS + RW;
const CAR_L = 6.4;
const CAR_W = 3.0;
const SIM_DT = 0.2;

type Lane = {axis: 'h' | 'v'; road: number; dir: 1 | -1; lat: number; q0: number; Ll: number; stops: number[]; n: number; v0: number; first: number; hero: boolean};

const lightGreen = (axis: 'h' | 'v', i: number, j: number, tw: number, cycle: number) => {
  const ph = (((tw / cycle + ((i * 0.19 + j * 0.13) % 1)) % 1) + 1) % 1;
  return axis === 'h' ? ph < 0.46 : ph >= 0.5 && ph < 0.96;
};

/** deterministic follow-the-leader sim (IDM) for every lane, computed once for the whole clip */
const simulate = (lanes: Lane[], cols: number, rows: number, cycle: number, twMax: number, seed: number) => {
  const steps = Math.ceil(twMax / SIM_DT) + 2;
  const total = lanes.reduce((s, l) => s + l.n, 0);
  const out = new Float32Array(steps * total);
  const r = rng(seed * 977 + 13);
  let base = 0;
  lanes.forEach((ln) => {
    const pos: number[] = [];
    const vel: number[] = [];
    for (let m = 0; m < ln.n; m++) {
      pos.push(((m + 0.5) / ln.n) * ln.Ll + (r() - 0.5) * 14);
      vel.push(ln.v0 * 0.5);
    }
    for (let st = 0; st < steps; st++) {
      const tw = st * SIM_DT;
      for (let m = 0; m < ln.n; m++) out[st * total + base + m] = pos[m];
      const acc = pos.map((s, m) => {
        // leader
        let gap = 1e9;
        let dv = 0;
        for (let k = 0; k < ln.n; k++) {
          if (k === m) continue;
          const g = (((pos[k] - s) % ln.Ll) + ln.Ll) % ln.Ll - CAR_L;
          if (g < gap) {
            gap = g;
            dv = vel[m] - vel[k];
          }
        }
        // red light wall
        for (let q = 0; q < ln.stops.length; q++) {
          const g = ln.stops[q] - s - 0.5;
          if (g > -0.2 && g < 70) {
            const ii = ln.axis === 'h' ? q : ln.road;
            const jj = ln.axis === 'h' ? ln.road : q;
            if (!lightGreen(ln.axis, ii, jj, tw, cycle) && g < gap && g > (vel[m] * vel[m]) / 12) {
              gap = g;
              dv = vel[m];
            }
          }
        }
        const sStar = 3 + Math.max(0, vel[m] * 1.1 + (vel[m] * dv) / (2 * Math.sqrt(2.5 * 3)));
        return 2.5 * (1 - Math.pow(vel[m] / ln.v0, 4) - Math.pow(sStar / Math.max(gap, 0.1), 2));
      });
      for (let m = 0; m < ln.n; m++) {
        vel[m] = cl(vel[m] + acc[m] * SIM_DT, 0, ln.v0 * 1.05);
        pos[m] = (pos[m] + vel[m] * SIM_DT) % ln.Ll;
      }
    }
    base += ln.n;
  });
  return {out, steps, total};
};

const hull = (pts: Pt[]): Pt[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

const ToyTownTraffic: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const uid = useUid('ttt');
  const [bc, br] = portrait ? [p.blocks[1], p.blocks[0]] : p.blocks;
  const cols = Math.max(1, Math.round(bc));
  const rows = Math.max(1, Math.round(br));
  const Wt = cols * P + RW;
  const Ht = rows * P + RW;
  const xRoad = (i: number) => -Wt / 2 + RW / 2 + i * P;
  const yRoad = (j: number) => -Ht / 2 + RW / 2 + j * P;

  // time-lapse: pre-integrated world clock
  const table = React.useMemo(() => {
    const n = Math.max(durationInFrames, 300) + 60;
    const t = [0];
    for (let f = 1; f <= n; f++) t.push(t[f - 1] + (keys(p.rate, (f - 0.5) / FPS) / FPS));
    return t;
  }, [JSON.stringify(p.rate), durationInFrames]); // eslint-disable-line react-hooks/exhaustive-deps
  const twAt = (tr: number) => {
    const f = tr * FPS;
    const i = Math.min(table.length - 2, Math.max(0, Math.floor(f)));
    return lerp(table[i], table[i + 1], f - i);
  };
  const rateNow = keys(p.rate, frame / FPS);
  const hz = rateNow >= 6 ? 8 : rateNow >= 2 ? 12 : 0;
  const trq = hz ? Math.floor((frame / FPS) * hz) / hz : frame / FPS;
  const tw = twAt(trq);

  // lanes + sim
  const world = React.useMemo(() => {
    const lanes: Lane[] = [];
    const r = rng(p.seed * 31 + 7);
    const nOf = (Ll: number) => Math.max(2, Math.round(Ll / lerp(130, 42, cl(p.density))));
    const heroRow = Math.floor(rows / 2);
    for (let j = 0; j <= rows; j++) {
      for (const dir of [1, -1] as const) {
        const ext = Wt / 2 + 40;
        const Ll = ext * 2;
        const q0 = -ext;
        lanes.push({
          axis: 'h', road: j, dir, lat: dir > 0 ? 3.6 : -3.6, q0, Ll,
          stops: Array.from({length: cols + 1}, (_, i) => (dir > 0 ? xRoad(i) - RW / 2 - 1 - q0 : q0 + Ll - (xRoad(i) + RW / 2 + 1))),
          n: nOf(Ll), v0: 12 + r() * 3, first: 0, hero: dir > 0 && j === heroRow,
        });
      }
    }
    for (let i = 0; i <= cols; i++) {
      for (const dir of [1, -1] as const) {
        const ext = Ht / 2 + 40;
        const Ll = ext * 2;
        const q0 = -ext;
        lanes.push({
          axis: 'v', road: i, dir, lat: dir > 0 ? -3.6 : 3.6, q0, Ll,
          stops: Array.from({length: rows + 1}, (_, j) => (dir > 0 ? yRoad(j) - RW / 2 - 1 - q0 : q0 + Ll - (yRoad(j) + RW / 2 + 1))),
          n: nOf(Ll), v0: 12 + r() * 3, first: 0, hero: false,
        });
      }
    }
    let acc = 0;
    lanes.forEach((l) => {
      l.first = acc;
      acc += l.n;
    });
    const sim = simulate(lanes, cols, rows, p.lightCycle, twAt(durationInFrames / FPS) + 2, p.seed);
    const cr = rng(p.seed * 53 + 3);
    const carCol: string[] = [];
    for (let k = 0; k < acc; k++) carCol.push(p.carColors[Math.floor(cr() * p.carColors.length)]);
    // block layout
    const br2 = rng(p.seed * 7 + 1);
    const blocksArr: {x: number; y: number; kind: 'park' | 'bld'; lots: {x: number; y: number; sx: number; sy: number; hgt: number; wall: string; roof: string; step: number}[]; trees: {x: number; y: number; r: number}[]; pond: Pt | null}[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = xRoad(i) + P / 2;
        const y = yRoad(j) + P / 2;
        const kind = br2() < 0.2 ? 'park' : 'bld';
        const lots: (typeof blocksArr)[number]['lots'] = [];
        const trees: {x: number; y: number; r: number}[] = [];
        let pond: Pt | null = null;
        if (kind === 'bld') {
          br2();
          const sub = 2;
          const ls = (BS - 4) / sub;
          for (let a = 0; a < sub; a++)
            for (let b = 0; b < sub; b++) {
              lots.push({
                x: x - BS / 2 + 2 + ls * (a + 0.5), y: y - BS / 2 + 2 + ls * (b + 0.5),
                sx: ls / 2 - 2.5 - br2() * 3, sy: ls / 2 - 2.5 - br2() * 3,
                hgt: 8 + br2() * br2() * 26,
                wall: p.walls[Math.floor(br2() * p.walls.length)], roof: p.roofs[Math.floor(br2() * p.roofs.length)], step: br2() < 0.35 ? 1 : 0,
              });
            }
        } else {
          for (let k = 0; k < 7; k++) trees.push({x: x + (br2() - 0.5) * (BS - 12), y: y + (br2() - 0.5) * (BS - 12), r: 3.4 + br2() * 2.2});
          pond = [x + (br2() - 0.5) * 16, y + (br2() - 0.5) * 16];
        }
        blocksArr.push({x, y, kind, lots, trees, pond});
      }
    }
    return {lanes, sim, carCol, blocksArr};
  }, [p.seed, cols, rows, p.density, p.lightCycle, JSON.stringify(p.rate), durationInFrames, JSON.stringify(p.walls), JSON.stringify(p.roofs), JSON.stringify(p.carColors)]); // eslint-disable-line react-hooks/exhaustive-deps

  // camera
  const pitchDeg = p.view === 'top' ? 90 : p.pitch;
  const sp = Math.sin((pitchDeg * Math.PI) / 180);
  const cp = Math.cos((pitchDeg * Math.PI) / 180);
  const th = ((-6 + p.rotation * (frame / FPS)) * Math.PI) / 180;
  const cs = Math.cos(th);
  const sn = Math.sin(th);
  const Rm = Math.hypot(Wt / 2, Ht / 2);
  const k = ((portrait ? w * 1.0 : w * 0.66) / Rm) * lerp(1.0, 1.1, sm(frame / durationInFrames));
  const proj = (x: number, y: number, z = 0): Pt => {
    const X = x * cs - y * sn;
    const Y = x * sn + y * cs;
    return [w / 2 + X * k, h / 2 + Y * k * sp - z * k * cp];
  };
  const polyS = (pts: Pt[], z = 0) => pts.map((q) => proj(q[0], q[1], z));
  const D = (pts: Pt[]) => 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L') + 'Z';
  const rectW = (cx: number, cy: number, hx: number, hy: number): Pt[] => [[cx - hx, cy - hy], [cx + hx, cy - hy], [cx + hx, cy + hy], [cx - hx, cy + hy]];

  type Item = {d: number; el: React.ReactNode};
  const items: Item[] = [];
  const faceShade = (nx: number, ny: number) => {
    const rx = nx * cs - ny * sn;
    return 0.74 + 0.26 * cl(0.55 - rx * 0.6);
  };
  const addBox = (key: string, cx: number, cy: number, hx: number, hy: number, z0: number, z1: number, wall: string, roof: string) => {
    const c = polyS(rectW(cx, cy, hx, hy), 0);
    const sides: {a: number; b: number; n: [number, number]}[] = [
      {a: 0, b: 1, n: [0, -1]}, {a: 1, b: 2, n: [1, 0]}, {a: 2, b: 3, n: [0, 1]}, {a: 3, b: 0, n: [-1, 0]},
    ];
    const wc = rectW(cx, cy, hx, hy);
    const faces: React.ReactNode[] = [];
    if (cp > 0.01) {
      sides.forEach((s, si) => {
        const ny = s.n[0] * sn + s.n[1] * cs;
        if (ny <= 0.001) return;
        const poly = [proj(wc[s.a][0], wc[s.a][1], z0), proj(wc[s.b][0], wc[s.b][1], z0), proj(wc[s.b][0], wc[s.b][1], z1), proj(wc[s.a][0], wc[s.a][1], z1)];
        faces.push(<path key={si} d={D(poly)} fill={shade(wall, faceShade(s.n[0], s.n[1]))} />);
      });
    }
    faces.push(<path key="r" d={D(polyS(wc, z1))} fill={roof} />);
    items.push({d: c.reduce((s2, q) => s2 + q[1], 0) / 4, el: <g key={key}>{faces}</g>});
  };

  /* ───── ground ───── */
  const ground: React.ReactNode[] = [];
  const big = Math.max(w, h) * 3;
  ground.push(<rect key="bg" x={-big} y={-big} width={big * 3} height={big * 3} fill={p.grass} />);
  ground.push(<path key="slab" d={D(polyS(rectW(0, 0, Wt / 2 + 14, Ht / 2 + 14)))} fill="#B9B3A4" />);
  ground.push(<path key="asph" d={D(polyS(rectW(0, 0, Wt / 2, Ht / 2)))} fill={p.asphalt} />);
  world.blocksArr.forEach((b, bi) => {
    ground.push(<path key={`s${bi}`} d={D(polyS(rectW(b.x, b.y, BS / 2, BS / 2)))} fill={b.kind === 'park' ? p.grass : '#C9C3B3'} />);
    if (b.kind === 'park' && b.pond) {
      const pts: Pt[] = Array.from({length: 18}, (_, a) => {
        const an = (a / 18) * TAU;
        return [b.pond![0] + Math.cos(an) * (11 + Math.sin(an * 3) * 1.6), b.pond![1] + Math.sin(an) * (7.5 + Math.cos(an * 2) * 1.2)] as Pt;
      });
      ground.push(<path key={`pr${bi}`} d={D(polyS(pts.map((q) => [b.pond![0] + (q[0] - b.pond![0]) * 1.16, b.pond![1] + (q[1] - b.pond![1]) * 1.16] as Pt)))} fill="#EFE6C8" />);
      ground.push(<path key={`pw${bi}`} d={D(polyS(pts))} fill={p.water} />);
      ground.push(<path key={`ph${bi}`} d={D(polyS(pts.map((q) => [b.pond![0] + (q[0] - b.pond![0]) * 0.55 - 1, b.pond![1] + (q[1] - b.pond![1]) * 0.45 - 1.4] as Pt)))} fill={mixC(p.water, '#ffffff', 0.35)} opacity={0.5} />);
    }
  });
  // lane markings + crossings
  const marks: React.ReactNode[] = [];
  for (let j = 0; j <= rows; j++) marks.push(<path key={`mh${j}`} d={'M' + polyS([[-Wt / 2, yRoad(j)], [Wt / 2, yRoad(j)]]).map((q) => q.join(' ')).join('L')} stroke="#E6D9A5" strokeWidth={Math.max(1, 0.35 * k)} strokeDasharray={`${3 * k} ${3 * k}`} fill="none" opacity={0.7} />);
  for (let i = 0; i <= cols; i++) marks.push(<path key={`mv${i}`} d={'M' + polyS([[xRoad(i), -Ht / 2], [xRoad(i), Ht / 2]]).map((q) => q.join(' ')).join('L')} stroke="#E6D9A5" strokeWidth={Math.max(1, 0.35 * k)} strokeDasharray={`${3 * k} ${3 * k}`} fill="none" opacity={0.7} />);
  const cross: React.ReactNode[] = [];
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const x = xRoad(i);
      const y = yRoad(j);
      for (let s = -3; s <= 3; s++) {
        for (const sgn of [-1, 1]) {
          cross.push(<path key={`ch${i}-${j}-${s}-${sgn}`} d={D(polyS(rectW(x + sgn * (RW / 2 + 1.6), y + s * 2, 0.9, 0.7)))} fill="#F4F1E6" opacity={0.85} />);
          cross.push(<path key={`cv${i}-${j}-${s}-${sgn}`} d={D(polyS(rectW(x + s * 2, y + sgn * (RW / 2 + 1.6), 0.7, 0.9)))} fill="#F4F1E6" opacity={0.85} />);
        }
      }
    }

  /* ───── depth-sorted objects ───── */
  const shadows: React.ReactNode[] = [];
  world.blocksArr.forEach((b, bi) => {
    b.lots.forEach((l, li) => {
      const sh = l.hgt * 0.55;
      const pts: Pt[] = [...rectW(l.x, l.y, l.sx, l.sy), ...rectW(l.x + sh, l.y + sh * 0.5, l.sx, l.sy)];
      shadows.push(<path key={`sh${bi}-${li}`} d={D(polyS(hull(pts)))} fill="#14305E" opacity={0.2} />);
      addBox(`b${bi}-${li}`, l.x, l.y, l.sx, l.sy, 0, l.hgt, l.wall, mixC(l.roof, '#ffffff', 0.08));
      if (l.step) addBox(`bt${bi}-${li}`, l.x, l.y, l.sx * 0.55, l.sy * 0.55, l.hgt, l.hgt + 4, mixC(l.wall, '#ffffff', 0.1), l.roof);
    });
    b.trees.forEach((t, ti) => {
      const g = proj(t.x, t.y, 0);
      const c = proj(t.x, t.y, t.r * 1.5);
      const rad = t.r * k * (0.92 + 0.1 * sp);
      items.push({
        d: g[1],
        el: (
          <g key={`t${bi}-${ti}`}>
            <ellipse cx={g[0] + rad * 0.4} cy={g[1] + rad * 0.1} rx={rad * 1.0} ry={rad * 0.45 * sp + 1} fill="#14305E" opacity={0.2} />
            <rect x={g[0] - 0.4 * k} y={g[1] - t.r * 1.5 * k * cp} width={0.8 * k} height={t.r * 1.5 * k * cp + 1} fill="#6B4A2B" />
            <circle cx={c[0]} cy={c[1]} r={rad} fill="#5E9B3A" />
            <circle cx={c[0] - rad * 0.18} cy={c[1] - rad * 0.22} r={rad * 0.82} fill="#8FD14A" />
            <circle cx={c[0] - rad * 0.35} cy={c[1] - rad * 0.4} r={rad * 0.32} fill="#B6E96A" opacity={0.7} />
          </g>
        ),
      });
    });
  });

  // cars
  const stepF = tw / SIM_DT;
  const s0 = Math.min(world.sim.steps - 2, Math.floor(stepF));
  const sf = stepF - s0;
  let heroScreenY = h / 2;
  world.lanes.forEach((ln, li) => {
    for (let m = 0; m < ln.n; m++) {
      const a = world.sim.out[s0 * world.sim.total + ln.first + m];
      const b = world.sim.out[(s0 + 1) * world.sim.total + ln.first + m];
      const s = Math.abs(b - a) > ln.Ll / 2 ? b : lerp(a, b, sf);
      const q = ln.dir > 0 ? ln.q0 + s : ln.q0 + ln.Ll - s;
      const cx = ln.axis === 'h' ? q : xRoad(ln.road) + ln.lat;
      const cy = ln.axis === 'h' ? yRoad(ln.road) + ln.lat : q;
      if (Math.abs(cx) > Wt / 2 + 20 || Math.abs(cy) > Ht / 2 + 20) continue;
      const hero = ln.hero && m === 0;
      const col = hero ? p.heroColor : world.carCol[ln.first + m];
      const hx = (ln.axis === 'h' ? CAR_L : CAR_W) / 2 * (hero ? 1.2 : 1);
      const hy = (ln.axis === 'h' ? CAR_W : CAR_L) / 2 * (hero ? 1.2 : 1);
      if (hero) heroScreenY = proj(cx, cy, 1)[1];
      const g = proj(cx, cy, 0);
      items.push({
        d: g[1],
        el: (
          <g key={`c${li}-${m}`}>
            <path d={D(polyS(rectW(cx + 1.0, cy + 0.6, hx, hy)))} fill="#14305E" opacity={0.25} />
          </g>
        ),
      });
      const before = items.length;
      addBox(`car${li}-${m}`, cx, cy, hx, hy, 0.3, 2.0, col, shade(col, 1.12));
      addBox(`cab${li}-${m}`, cx - (ln.axis === 'h' ? 0.2 * ln.dir : 0), cy - (ln.axis === 'v' ? 0.2 * ln.dir : 0), hx * (ln.axis === 'h' ? 0.5 : 0.82), hy * (ln.axis === 'h' ? 0.82 : 0.5), 2.0, 3.0, '#9DB4C8', mixC(col, '#ffffff', 0.25));
      for (let z = before; z < items.length; z++) items[z].d += 0.01 * (z - before) + 0.3;
    }
  });

  // lights + waiting crowds
  const lights: React.ReactNode[] = [];
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const x = xRoad(i);
      const y = yRoad(j);
      const gh = lightGreen('h', i, j, tw, p.lightCycle);
      const gv = lightGreen('v', i, j, tw, p.lightCycle);
      const pts: {x: number; y: number; g: boolean}[] = [
        {x: x - RW / 2 - 0.8, y: y - 6.2, g: gh}, {x: x + RW / 2 + 0.8, y: y + 6.2, g: gh},
        {x: x + 6.2, y: y - RW / 2 - 0.8, g: gv}, {x: x - 6.2, y: y + RW / 2 + 0.8, g: gv},
      ];
      pts.forEach((q, qi) => {
        const sp2 = proj(q.x, q.y, 3.6);
        const gd = proj(q.x, q.y, 0);
        items.push({d: gd[1] + 0.5, el: <g key={`l${i}-${j}-${qi}`}><rect x={gd[0] - 0.12 * k} y={sp2[1]} width={0.24 * k} height={Math.max(1, gd[1] - sp2[1])} fill="#2B2F36" /><circle cx={sp2[0]} cy={sp2[1]} r={0.95 * k} fill={q.g ? '#46D36B' : '#FF4B3E'} /></g>});
      });
      const phase = (((tw / p.lightCycle + ((i * 0.19 + j * 0.13) % 1)) % 1) + 1) % 1;
      const wait = sm(seg(phase % 0.5, 0.0, 0.42));
      const nWait = Math.round(1 + 4 * wait);
      [[-1, -1], [1, 1], [1, -1], [-1, 1]].forEach(([sx, sy], ci) => {
        for (let d = 0; d < nWait; d++) {
          const rr = rng(i * 131 + j * 17 + ci * 5 + d);
          const pp = proj(x + sx * (RW / 2 + 2.6 + rr() * 1.2), y + sy * (RW / 2 + 2.6 + rr() * 1.2), 0);
          items.push({d: pp[1] + 0.2, el: <g key={`pe${i}-${j}-${ci}-${d}`}><ellipse cx={pp[0]} cy={pp[1]} rx={0.55 * k} ry={0.3 * k * sp + 0.5} fill="#000" opacity={0.15} /><circle cx={pp[0]} cy={pp[1] - 0.9 * k * cp} r={0.55 * k} fill={['#D9472F', '#2E6FD0', '#F2C230', '#FFFFFF', '#2F9E6B'][(ci + d) % 5]} /></g>});
        }
      });
    }

  items.sort((a, b) => a.d - b.d);

  // tilt-shift band
  const heroC = cl(heroScreenY / h, 0.28, 0.72);
  const bandY = p.follow ? heroC : p.band.center;
  const bandSm = bandY;
  const World = (
    <>
      {ground}
      <g>{marks}</g>
      <g>{cross}</g>
      <g>{shadows}</g>
      {items.map((it) => it.el)}
    </>
  );

  const rateTxt = rateNow >= 2 ? `×${Math.round(rateNow)} TIME-LAPSE` : '×1 REAL TIME';
  const clockS = Math.floor(7 * 3600 + 12 * 60 + tw * (rateNow >= 2 ? 6 : 1));
  const hh = String(Math.floor(clockS / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor(clockS / 60) % 60).padStart(2, '0');
  const ss = String(clockS % 60).padStart(2, '0');

  return (
    <AbsoluteFill style={{background: p.grass, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${uid}-grade`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values={String(p.saturation)} />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.1" intercept="-0.04" />
              <feFuncG type="linear" slope="1.08" intercept="-0.04" />
              <feFuncB type="linear" slope="1.0" intercept="-0.03" />
            </feComponentTransfer>
          </filter>
          <radialGradient id={`${uid}-vig`} cx="50%" cy="50%" r="75%">
            <stop offset="55%" stopColor="#1B1020" stopOpacity="0" />
            <stop offset="100%" stopColor="#1B1020" stopOpacity={p.vignette} />
          </radialGradient>
        </defs>
        <g filter={`url(#${uid}-grade)`}>
          <TiltBand id={uid} w={w} h={h} bandY={bandSm} halfW={p.band.width} fall={p.band.falloff} amp={p.band.maxBlur * u} levels={3}>
            {World}
          </TiltBand>
        </g>
        <rect width={w} height={h} fill={`url(#${uid}-vig)`} />
      </svg>
      {p.clock && (
        <div style={{position: 'absolute', left: 36 * u, top: 32 * u, padding: `${10 * u}px ${16 * u}px`, borderRadius: 12 * u, background: 'rgba(14,16,22,0.72)', fontFamily: fonts.mono, color: '#fff'}}>
          <div style={{fontSize: 34 * u, fontWeight: 700, letterSpacing: 1 * u}}>
            {hh}:{mm}
            <span style={{fontSize: 18 * u, opacity: 0.7}}> {ss}</span>
          </div>
          <div style={{fontSize: 15 * u, letterSpacing: 2 * u, color: rateNow >= 2 ? '#FFB000' : '#46D36B', marginTop: 2 * u}}>{rateTxt}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const toyTownTraffic = defineMotion<Props>({
  id: 'toy-town-traffic',
  title: 'Toy-town traffic',
  category: 'environment',
  description:
    'A seeded miniature city seen from a high oblique angle: blocks of low-rise buildings with coloured roofs and blue shadows, parks with round bright trees and ponds, crosswalks, and dozens of little cars that flow, queue at red lights and surge on green (IDM car-following simulated deterministically), pedestrians gathering at corners. Actors step at 8 / 12 Hz under the time-lapse while the camera rotates smoothly, a tilt-shift focus band follows the red hero car, and a time-lapse clock ramps from ×6 down to ×1 real time.',
  source: ['lemo-opuscar styles/tilt-shift/demo/traffic.js, story.js, main.js stepT (MIT, LemoLab)'],
  useFor: 'Mobility / logistics / smart-city / real-estate explainers, "rush hour" metaphors for queues and load, satisfying looping backgrounds; nothing else in the library animates a traffic system.',
  durationInFrames: 240,
  defaultProps: {
    seed: 5,
    blocks: [4, 3],
    density: 0.55,
    rate: [[0, 6], [5.2, 6], [6.8, 1.2]],
    lightCycle: 16,
    view: 'oblique',
    rotation: 3.5,
    pitch: 52,
    follow: true,
    band: {center: 0.55, width: 0.08, falloff: 0.28, maxBlur: 15},
    heroColor: '#E23B2E',
    carColors: ['#F4F4F2', '#C9CED4', '#2B2F36', '#D6382C', '#2E6FD0', '#F2C230', '#FFFFFF'],
    walls: ['#F6E7C8', '#F1CFA8', '#F4B9A0', '#CDE3D0', '#BFD7EA', '#F8E08F'],
    roofs: ['#C8673A', '#4F7FB8', '#3F8F86', '#E39B3C', '#7C5A9A', '#B84A3A'],
    asphalt: '#4B4E53',
    grass: '#6FA24A',
    water: '#2F78C8',
    clock: true,
    saturation: 1.3,
    vignette: 0.35,
  },
  propDocs: {
    seed: 'town layout + car colours seed',
    blocks: '[columns, rows] of city blocks (swapped automatically in portrait)',
    density: 'traffic density 0–1',
    rate: 'time-lapse rate keyframes [[seconds, rate]] — ≥6 steps at 8 Hz, 2–6 at 12 Hz, <2 smooth; drop to ~1 for the real-time detail',
    lightCycle: 'traffic-light cycle in world seconds',
    view: 'oblique (high three-quarter) or top (straight down)',
    rotation: 'camera rotation in degrees per second',
    pitch: 'oblique pitch in degrees (45–58)',
    follow: 'tilt-shift band follows the red hero car',
    band: 'tilt-shift band: centre (when not following), width, falloff (fractions of height), maxBlur px at 1080p',
    heroColor: 'hero car colour',
    carColors: 'colour pool for the other cars',
    walls: 'building wall colours',
    roofs: 'building roof colours',
    asphalt: 'road colour',
    grass: 'park / ground colour',
    water: 'pond colour',
    clock: 'show the time-lapse clock chip',
    saturation: 'miniature colour boost (1.3–1.7)',
    vignette: 'edge darkening 0–0.6',
  },
  component: ToyTownTraffic,
  tags: ['traffic', 'city', 'town', 'miniature', 'tilt shift', 'time-lapse', 'cars', 'traffic lights', 'top-down', 'simulation', 'smart city', 'mobility', 'logistics', 'rush hour', 'diorama', 'environment', 'oblique'],
});
