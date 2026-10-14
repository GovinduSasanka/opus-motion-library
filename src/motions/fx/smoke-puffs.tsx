import React from 'react';
import {Easing} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {FxRoot, boil, doodleLoop, isClear, useFx, portraitFit} from '../../core/fx-kit';
import {rng, range} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video20 smoke-puff-circles: clusters of 3-6 overlapping open ink circles spawn at a vent every 0.3 s,
 * rise ~15 % of frame height, grow x1.5 and fade over 1.2 s; when the trouble is fixed they shrink
 * back to nothing in 0.5 s.
 * video3 cannon-flash-smoke: 2-frame orange-white muzzle flash (#fff3c0 -> #ff9a3c), then a soft
 * grey-white puff of 5-7 blurred circles growing 0.3 -> 1.6 over 1.5 s (easeOutQuad), opacity
 * 0.9 -> 0.3, drifting forward; fired twice ~0.25 s apart.
 */
type Props = {
  background: string;
  x: number;
  y: number;
  delay: number;
  style: 'doodle' | 'soft';
  flash: boolean;
  shots: number;
  shotEvery: number;
  rate: number;
  rise: number;
  life: number;
  grow: number;
  size: number;
  direction: number;
  drift: number;
  stopAt: number;
  color: string;
  smokeColor: string;
  flashColor: string;
  showSubject: boolean;
  seed: number;
};

type Cluster = {t0: number; big: boolean; side: number; circles: {ox: number; oy: number; r: number; a0: number; sweep: number; sw: number}[]};

const quadOut = Easing.out(Easing.quad);

const SmokePuffs: React.FC<Props> = (p) => {
  const {x, y, delay, style, flash, shots, shotEvery, rate, rise, life, grow, size: size0, direction, drift, stopAt, color, smokeColor, flashColor, showSubject, seed} = p;
  const background = p.background === 'auto' ? (style === 'soft' ? '#27303F' : '#E1D7C5') : p.background;
  const {f, frame, u, w, h, px, py: py0, durationInFrames} = useFx(x, y, delay);
  const clear = isClear(background);
  const {portrait: fitPortrait, h: fitH} = useStage();
  const fit = portraitFit(fitPortrait, showSubject && !clear, fitH);
  const size = size0 * fit.k;
  const py = py0 + fit.dy;
  const endF = durationInFrames - delay;
  const stop = stopAt >= 0 ? stopAt : flash ? 99999 : endF - 22;
  const shrink = flash ? 0 : prog(f, stop + 2, stop + 17, ease.inOut);
  const dirR = (direction * Math.PI) / 180;

  const clusters = React.useMemo(() => {
    const r = rng(seed * 131 + 9);
    const list: Cluster[] = [];
    const starts: number[] = [];
    if (flash) for (let k = 0; k < Math.max(1, shots); k++) starts.push(k * shotEvery);
    else for (let t = 0; t < Math.min(stop, 2000); t += Math.max(2, rate)) starts.push(t);
    starts.forEach((t0, i) => {
      const n = flash ? (style === 'soft' ? 7 : 6) : 3 + Math.floor(r() * 4);
      const circles = Array.from({length: n}, (_, k) => {
        const ang = r() * Math.PI * 2;
        const dist = k === 0 ? 0 : range(r, 0.35, 0.95);
        return {ox: Math.cos(ang) * dist, oy: Math.sin(ang) * dist * 0.75, r: k === 0 ? 1 : range(r, 0.45, 0.85), a0: r() * 6.28, sweep: range(r, 5.8, 6.7), sw: range(r, 1.6, 2.6)};
      });
      list.push({t0, big: flash, side: i % 2 ? 1 : -1, circles});
    });
    return list;
  }, [seed, flash, shots, shotEvery, rate, stop, style]);

  const nodes: React.ReactNode[] = [];
  const bj = boil(frame, 3);

  clusters.forEach((c, i) => {
    const age = f - c.t0;
    const L = c.big ? life * 2.5 : life;
    if (age < 0 || age > L) return;
    const t = age / L;
    const base = (c.big ? 105 : 78) * u * size;
    let cx: number;
    let cy: number;
    let sc: number;
    let op: number;
    if (c.big) {
      // cannon puff: grows 0.3 -> 1.6, drifts forward along `direction` and slightly up
      const e = quadOut(clamp(t));
      sc = (0.3 + 1.3 * e) * (grow / 1.5);
      cx = px + Math.cos(dirR) * (base * 0.9 + e * 260 * u * size) + (drift * age) / 30 * u;
      cy = py + Math.sin(dirR) * (base * 0.9 + e * 260 * u * size) - e * rise * h * 0.5;
      op = (0.9 - 0.6 * e) * (1 - prog(t, 0.7, 1, ease.in));
    } else {
      cx = px + c.side * 34 * u * size + c.side * Math.abs(c.circles[1 % c.circles.length].ox) * 80 * u * size * t + c.side * 20 * u * t + (drift * age) / 30 * u;
      cy = py - 60 * u * size - t * rise * h;
      sc = (0.55 + 0.45 * prog(age, 0, 5, ease.out)) * (1 + (grow - 1) * t);
      op = 1 - t;
    }
    sc *= 1 - shrink;
    if (sc <= 0.01 || op <= 0.01) return;
    if (style === 'doodle') {
      const d = c.circles
        .map((ci, k) => {
          const R = ci.r * base * sc;
          const X = cx + ci.ox * base * sc;
          const Y = cy + ci.oy * base * sc;
          const s1 = doodleLoop(X, Y, R, R * 0.96, 0, ci.a0 + bj * 0.2, ci.sweep, `sp${seed}-${i}-${k}-${bj}`, 0.06, 18);
          const s2 = k === 0 ? doodleLoop(X + 2 * u, Y - 1 * u, R * 0.92, R * 0.9, 0, ci.a0 + 2.1, 5.2, `sp2${i}-${bj}`, 0.08, 16) : '';
          const knot = k === 0 ? doodleLoop(X, Y, R * 0.28, R * 0.2, ci.a0, bj, 9, `spk${i}-${bj}`, 0.25, 22) : '';
          return `${s1} ${s2} ${knot}`;
        })
        .join(' ');
      nodes.push(<path key={i} d={d} fill="none" stroke={color} strokeWidth={2 * u * Math.max(0.7, size)} strokeLinecap="round" opacity={op} />);
    } else {
      nodes.push(
        <g key={i} opacity={op} filter={`url(#sp-blur-${seed})`}>
          {c.circles.map((ci, k) => (
            <circle key={k} cx={cx + ci.ox * base * sc * 1.1} cy={cy + ci.oy * base * sc} r={ci.r * base * sc} fill={smokeColor} />
          ))}
          {c.circles.slice(1, 4).map((ci, k) => (
            <circle key={`s${k}`} cx={cx + ci.ox * base * sc * 1.1 + base * sc * 0.25} cy={cy + ci.oy * base * sc + base * sc * 0.3} r={ci.r * base * sc * 0.7} fill="#8f949c" opacity={0.45} />
          ))}
        </g>,
      );
    }
  });

  // muzzle flash: bright for 2 frames per shot, [0,1,1,0] over 3 frames
  const flashes: React.ReactNode[] = [];
  if (flash) {
    for (let k = 0; k < Math.max(1, shots); k++) {
      const a = f - k * shotEvery;
      if (a < -0.5 || a > 3) continue;
      const o = a < 0.5 ? 0.6 : a < 2.5 ? 1 : 0.25;
      const R = 0.06 * Math.max(w, h) * 1.6 * size;
      const fx = px + Math.cos(dirR) * R * 0.3;
      const fy = py + Math.sin(dirR) * R * 0.3;
      const r = rng(seed * 7 + k);
      flashes.push(
        <g key={`fl${k}`} opacity={o}>
          <circle cx={fx} cy={fy} r={R * 1.8} fill={`url(#sp-fl-${seed})`} />
          {Array.from({length: 9}, (_, j) => {
            const ang = dirR + (j - 4) * 0.32 + (r() - 0.5) * 0.2;
            const len = R * (j === 4 ? 1.9 : range(r, 0.8, 1.4));
            const wd = R * 0.12;
            const ex = fx + Math.cos(ang) * len;
            const ey = fy + Math.sin(ang) * len;
            const nx = -Math.sin(ang) * wd;
            const ny = Math.cos(ang) * wd;
            return <path key={j} d={`M${fx + nx} ${fy + ny} L${ex} ${ey} L${fx - nx} ${fy - ny} Z`} fill="#fff3c0" />;
          })}
          <circle cx={fx} cy={fy} r={R * 0.45} fill="#fffbe8" />
        </g>,
      );
    }
  }

  // subject
  let subject: React.ReactNode = null;
  if (showSubject && !clear) {
    const sw = 2.6 * u;
    if (style === 'doodle' && !flash) {
      const bw = 560 * u * size;
      const bh = 360 * u * size;
      const top = py + 70 * u * size;
      const bx = px - bw * 0.62;
      const shake = f >= 0 && f < stop ? Math.sin(frame * 2.1) * 2 * u : 0;
      subject = (
        <g transform={`translate(${shake} 0)`}>
          <ellipse cx={bx + bw * 0.6} cy={top + bh + 10 * u} rx={bw * 0.7} ry={18 * u} fill={color} opacity={0.12} />
          <path d={`M${bx + bw} ${top} l${bw * 0.22} ${-bh * 0.14} l0 ${bh} l${-bw * 0.22} ${bh * 0.14} Z`} fill="#a9a7a1" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M${bx} ${top} l${bw * 0.22} ${-bh * 0.14} l${bw} 0 l${-bw * 0.22} ${bh * 0.14} Z`} fill="#dcdad3" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <rect x={bx} y={top} width={bw} height={bh} fill="#cfcdc6" stroke={color} strokeWidth={sw} />
          {Array.from({length: 14}, (_, i) => (
            <line key={i} x1={bx + bw + 6 * u} y1={top + 10 * u + i * bh * 0.07} x2={bx + bw * 1.2} y2={top - bh * 0.1 + i * bh * 0.07} stroke={color} strokeWidth={1.1 * u} opacity={0.35} />
          ))}
          <circle cx={bx + bw * 0.72} cy={top + bh * 0.3} r={bh * 0.15} fill="#ece9e1" stroke={color} strokeWidth={sw} />
          <line x1={bx + bw * 0.72} y1={top + bh * 0.3} x2={bx + bw * 0.72 + Math.cos(frame * 0.5) * bh * 0.11} y2={top + bh * 0.3 + Math.sin(frame * 0.5) * bh * 0.11} stroke="#c8424f" strokeWidth={2 * u} />
          <rect x={bx + bw * 0.18} y={top + bh * 0.58} width={bw * 0.36} height={bh * 0.2} rx={6 * u} fill="#6f6d68" stroke={color} strokeWidth={sw} />
          <rect x={bx + bw * 0.12} y={top + bh * 0.22} width={bw * 0.3} height={bh * 0.12} fill="none" stroke={color} strokeWidth={sw * 0.8} />
          {/* vent pipe */}
          <rect x={px - 30 * u * size} y={py - 6 * u} width={60 * u * size} height={top - py + 4 * u} fill="#b6b4ad" stroke={color} strokeWidth={sw} />
          <rect x={px - 40 * u * size} y={py - 22 * u} width={80 * u * size} height={22 * u} rx={4 * u} fill="#9d9b95" stroke={color} strokeWidth={sw} />
        </g>
      );
    } else if (!flash) {
      // soft steam from a dark chimney stack
      subject = (
        <g>
          <rect x={px - 55 * u * size} y={py} width={110 * u * size} height={h - py + 10} fill="#141a25" />
          <rect x={px - 70 * u * size} y={py - 10 * u} width={140 * u * size} height={34 * u * size} rx={6 * u} fill="#1c2433" />
          <rect x={0} y={h * 0.86} width={w} height={h * 0.14} fill="#141a25" />
        </g>
      );
    } else {
      // cannon barrel aimed along `direction`, muzzle at the anchor
      const L = 460 * u * size;
      const kick = flash ? Math.max(...Array.from({length: Math.max(1, shots)}, (_, k) => (f - k * shotEvery >= 0 ? Math.exp(-(f - k * shotEvery) / 4) : 0))) : 0;
      subject = (
        <g transform={`translate(${px} ${py}) rotate(${direction}) translate(${-kick * 26 * u} 0)`}>
          <path d={`M${-L} ${-60 * u * size} L0 ${-38 * u * size} L0 ${38 * u * size} L${-L} ${60 * u * size} Z`} fill="#141a25" stroke="#0a0e15" strokeWidth={sw} />
          <rect x={-26 * u * size} y={-48 * u * size} width={30 * u * size} height={96 * u * size} rx={8 * u} fill="#1c2433" />
          <rect x={-L * 0.55} y={-56 * u * size} width={22 * u * size} height={112 * u * size} rx={6 * u} fill="#1c2433" />
          <line x1={-L} y1={-40 * u} x2={-6 * u} y2={-26 * u} stroke="#4a5670" strokeWidth={3 * u} opacity={0.6} />
          <ellipse cx={-L * 0.8} cy={110 * u * size} rx={110 * u * size} ry={110 * u * size} fill="#0f141d" />
        </g>
      );
    }
  }

  return (
    <FxRoot background={background} paper={!clear && style === 'doodle'} paperTint="#8a7350">
      <Svg>
        <defs>
          <filter id={`sp-blur-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={9 * u * size} />
          </filter>
          <radialGradient id={`sp-fl-${seed}`}>
            <stop offset="0%" stopColor="#fff3c0" stopOpacity={1} />
            <stop offset="35%" stopColor={flashColor} stopOpacity={0.85} />
            <stop offset="100%" stopColor={flashColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        {nodes}
        {subject}
        {flashes}
      </Svg>
    </FxRoot>
  );
};

export const smokePuffs = defineMotion<Props>({
  id: 'smoke-puffs',
  title: 'Smoke puffs',
  category: 'fx',
  description:
    'Clusters of open doodle ink circles (or soft blurred circles) rise from a vent, grow and fade, then shrink away when fixed; flash mode fires a 2-frame muzzle flash and a forward-drifting smoke puff. Overlay-ready: background "transparent".',
  source: ['video20 27-33 s smoke-puff-circles', 'video3 cannon-flash-smoke'],
  useFor: 'Broken machines, steam, thinking, engines; with flash: cannon / gun / launch / explosion beats.',
  durationInFrames: 120,
  defaultProps: {
    background: 'auto',
    x: 0.5,
    y: 0.42,
    delay: 0,
    style: 'doodle',
    flash: false,
    shots: 2,
    shotEvery: 8,
    rate: 9,
    rise: 0.24,
    life: 36,
    grow: 1.5,
    size: 1,
    direction: -25,
    drift: 0,
    stopAt: -1,
    color: '#2e2a26',
    smokeColor: '#e7e4dd',
    flashColor: '#ff9a3c',
    showSubject: true,
    seed: 6,
  },
  propDocs: {
    background: "scene colour; 'auto' = cream paper (doodle) or dusk navy (soft); 'transparent' = overlay",
    x: 'vent / muzzle x (0..1)',
    y: 'vent / muzzle y (0..1)',
    delay: 'frame the first puff (or shot) fires',
    style: 'doodle (v20 open ink circles) | soft (v3 blurred grey-white smoke)',
    flash: 'true = cannon mode: muzzle flash + one big puff per shot',
    shots: 'flash mode: number of shots',
    shotEvery: 'flash mode: frames between shots (0.25 s)',
    rate: 'continuous mode: frames between new clusters (0.3 s)',
    rise: 'rise distance as a fraction of frame height',
    life: 'frames each puff lives (1.2 s)',
    grow: 'scale reached at end of life',
    size: 'size multiplier',
    direction: 'flash mode: barrel / blast direction in degrees (0 = right, -90 = up)',
    drift: 'sideways wind in u per second',
    stopAt: 'continuous mode: local frame spawning stops and puffs shrink away (-1 = 22 frames before the end)',
    color: 'ink colour',
    smokeColor: 'soft smoke colour',
    flashColor: 'muzzle flash outer colour',
    showSubject: 'draw the broken machine (doodle) or cannon (flash) — scene mode only',
    seed: 'random seed',
  },
  component: SmokePuffs,
  tags: ['smoke', 'steam', 'puff', 'cannon', 'flash', 'doodle', 'overlay', 'fx'],
});
