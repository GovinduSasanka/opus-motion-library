import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';
import {useStage} from './stage';

/**
 * bouncing-ball round-2 modes (group E3): `timeline` (timing-chart study, x2 0-1.7 s), `slime`
 * (glossy hop character, x7) and `impact` (flat-vector drop, rays + ground rings, mg-styles-15 / video 0.3-1.2 s).
 * Pure functions of the frame.
 */
type Common = {color: string; radius: number; fg: string; bpm: number; labels: string};

/* ------------------------------------------------------------------ timeline bounce study */
export const TimelineScene: React.FC<Common & {period: number; apex: number; trail: boolean; bounces: number}> = ({color, radius, fg, period, apex, trail, bounces, labels}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: D} = useStage();
  const r = radius * u * 0.86;
  const T = period * fps;
  const t0 = 8;
  const axisY = h * 0.72;
  const x0 = w * 0.13;
  const x1 = w * 0.87;
  const nB = Math.max(1, bounces || Math.floor((D - t0 - 12) / T));
  const span = nB * T;
  const posAt = (f: number) => {
    const t = Math.max(0, f - t0);
    const q = (t % T) / T;
    const x = x0 + (x1 - x0) * Math.min(1, t / span);
    const lift = h * apex * 4 * q * (1 - q);
    return {x, y: axisY - r - lift, q, n: Math.floor(t / T)};
  };
  const cur = posAt(frame);
  const prev = posAt(frame - 1);
  const vx = cur.x - prev.x;
  const vy = cur.y - prev.y;
  const vmax = (h * apex * 4) / T;
  const speed = Math.min(1, Math.hypot(vx, vy) / Math.max(1e-3, vmax));
  const ang = Math.atan2(vy, vx);
  const sy = 1 + 0.38 * Math.min(1, Math.abs(vy) / Math.max(1e-3, vmax));
  const sx = 1 / Math.sqrt(sy);
  const near = Math.min(cur.q, 1 - cur.q) * T;
  const squash = frame >= t0 && near < 1.2 ? 1 : 0;
  const axisIn = prog(frame, 0, 5, ease.out);
  const dots: React.ReactNode[] = [];
  if (trail) {
    for (let f = t0; f < frame; f += 2) {
      const p = posAt(f);
      dots.push(<circle key={f} cx={p.x} cy={p.y} r={Math.max(2, 2.4 * u)} fill="#9A9690" opacity={0.85} />);
    }
  }
  const ticks: React.ReactNode[] = [];
  for (let n = 0; n <= nB; n++) {
    const tf = t0 + n * T;
    if (frame < tf) break;
    const a = prog(frame, tf, tf + 5, ease.out);
    const x = x0 + (x1 - x0) * Math.min(1, (n * T) / span);
    ticks.push(
      <g key={n} opacity={a}>
        <line x1={x} y1={axisY} x2={x} y2={axisY + 14 * u * a} stroke={fg} strokeWidth={2 * u} />
        <text x={x} y={axisY + 36 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={13 * u} fill={fg} opacity={0.75} letterSpacing={1.5 * u}>
          {`${(n * period).toFixed(2)}s`}
        </text>
      </g>,
    );
  }
  const lastTick = Math.min(nB, Math.max(0, Math.floor((frame - t0) / T)));
  const label = labels !== '' ? labels : `sy ${(squash ? 0.64 : sy).toFixed(2)}  sx ${(squash ? 1.5 : sx).toFixed(2)}`;
  const lbA = prog(frame, t0 + T * 0.5, t0 + T * 0.5 + 8, ease.out);
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
      <line x1={x0} y1={axisY} x2={lerp(x0, x1, axisIn)} y2={axisY} stroke={fg} strokeWidth={2 * u} />
      {ticks}
      {dots}
      <g transform={`translate(${cur.x} ${cur.y + (squash ? r * 0.3 : 0)}) rotate(${(ang * 180) / Math.PI}) scale(${squash ? 1 : 1} ${1})`}>
        {squash ? (
          <ellipse cx={0} cy={0} rx={r * 1.5} ry={r * 0.64} fill={color} transform={`rotate(${(-ang * 180) / Math.PI})`} />
        ) : (
          <ellipse cx={0} cy={0} rx={r * lerp(1, sy, speed)} ry={r * lerp(1, sx, speed)} fill={color} />
        )}
      </g>
      <g opacity={lbA}>
        <line x1={cur.x + r * 1.2} y1={cur.y - r * 0.3} x2={cur.x + r * 2.4} y2={cur.y - r * 1.6} stroke={fg} strokeOpacity={0.5} strokeWidth={1.4 * u} />
        <text x={cur.x + r * 2.5} y={cur.y - r * 1.7} fontFamily={fonts.mono} fontSize={13 * u} letterSpacing={2 * u} fill={fg} fontWeight={700}>
          {label}
        </text>
      </g>
      <text x={x0} y={axisY + 64 * u} fontFamily={fonts.mono} fontSize={11 * u} letterSpacing={2.5 * u} fill={fg} opacity={0.5}>
        {`BOUNCE ${String(Math.min(nB, lastTick + 1)).padStart(2, '0')} / ${String(nB).padStart(2, '0')}  ·  PERIOD ${period.toFixed(2)}s`}
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------------ slime hop */
export const SlimeScene: React.FC<Common & {eyes: 'square' | 'ii' | 'x' | 'closed'; puffs: boolean; rim: boolean}> = ({color, radius, fg, bpm, eyes, puffs, rim}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: D} = useStage();
  const r = radius * u * 1.45;
  const groundY = h * 0.72;
  const hop = Math.max(10, Math.round((fps * 60) / Math.max(30, bpm) / 1)); // frames per hop (flight + land)
  const air = Math.round(hop * 0.7);
  const idx = Math.floor(frame / hop);
  const lf = frame - idx * hop;
  const spanX = w * 0.26;
  const dir = idx % 2 === 0 ? 1 : -1;
  const xBase = w * 0.5 + (dir === 1 ? -spanX * 0.5 : spanX * 0.5) + (idx % 4 < 2 ? 0 : 0);
  const x = xBase + dir * spanX * ease.inOut(clamp(lf / air));
  const flying = lf < air;
  const q = clamp(lf / air);
  const height = h * 0.3 * 4 * q * (1 - q);
  // landing squash 1.6 / 0.45 for 2 frames, recover over 5; take-off stretch
  const sinceLand = lf - air;
  let sxs = 1;
  let sys = 1;
  if (!flying) {
    const k = sinceLand < 2 ? 1 : 1 - clamp((sinceLand - 2) / 5);
    sxs = lerp(1, 1.6, k);
    sys = lerp(1, 0.45, k);
  } else if (lf < 3) {
    sxs = 0.8;
    sys = 1.25;
  } else {
    const v = Math.abs(1 - 2 * q);
    sys = 1 + 0.18 * v;
    sxs = 1 / Math.sqrt(sys);
  }
  const bodyY = groundY - r * sys - height;
  const body = (dx: number, col: string, op: number, key: string) => (
    <ellipse key={key} cx={x + dx} cy={bodyY} rx={r * sxs} ry={r * sys} fill={col} opacity={op} />
  );
  const eyeY = bodyY - r * sys * 0.12;
  const eyeDx = r * sxs * 0.36;
  const eyeEl = (sign: number) => {
    const ex = x + sign * eyeDx;
    const blink = Math.floor(frame / (fps * 1.6)) % 1 === 0 && frame % Math.round(fps * 1.6) < 3;
    const s = r * 0.16;
    if (eyes === 'x') return <path key={sign} d={`M ${ex - s} ${eyeY - s} L ${ex + s} ${eyeY + s} M ${ex + s} ${eyeY - s} L ${ex - s} ${eyeY + s}`} stroke="#1B1B25" strokeWidth={r * 0.07} strokeLinecap="round" />;
    if (eyes === 'closed' || blink) return <path key={sign} d={`M ${ex - s} ${eyeY} Q ${ex} ${eyeY + s * 0.9} ${ex + s} ${eyeY}`} fill="none" stroke="#1B1B25" strokeWidth={r * 0.07} strokeLinecap="round" />;
    if (eyes === 'ii') return <rect key={sign} x={ex - s * 0.35} y={eyeY - s * 1.5} width={s * 0.7} height={s * 3} rx={s * 0.35} fill="#1B1B25" />;
    return <rect key={sign} x={ex - s * 0.8} y={eyeY - s * 0.8} width={s * 1.6} height={s * 1.6} rx={s * 0.3} fill="#1B1B25" />;
  };
  // puffs at each landing
  const puffEls: React.ReactNode[] = [];
  if (puffs) {
    for (let i = Math.max(0, idx - 1); i <= idx; i++) {
      const lx0 = w * 0.5 + (i % 2 === 0 ? -spanX * 0.5 : spanX * 0.5) + (i % 2 === 0 ? 1 : -1) * spanX;
      const age = frame - (i * hop + air);
      if (age < 0 || age > 9) continue;
      const a = age / 8;
      for (let k = 0; k < 4; k++) {
        const dirk = k < 2 ? -1 : 1;
        const rr = (r * (0.18 + 0.1 * k * 0.4)) * (0.6 + 1.4 * ease.out(a));
        puffEls.push(<circle key={`${i}-${k}`} cx={lx0 + dirk * r * (0.9 + 0.5 * (k % 2)) * (0.5 + ease.out(a))} cy={groundY - rr * (0.6 + a * 0.6)} r={rr} fill="#F7FAFB" opacity={0.85 * (1 - a)} />);
      }
    }
  }
  const grad = `slimeG${radius}`;
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <radialGradient id={grad} cx="0.62" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.18" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity={1} />
        </radialGradient>
        <radialGradient id={`${grad}s`} cx="0.35" cy="0.8" r="0.7">
          <stop offset="0" stopColor="#000" stopOpacity={0.28} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </defs>
      <line x1={w * 0.08} y1={groundY} x2={w * 0.92} y2={groundY} stroke={fg} strokeOpacity={0.35} strokeWidth={2 * u} />
      <ellipse cx={x} cy={groundY + 4 * u} rx={r * 0.95 * (1 - 0.35 * (height / (h * 0.3))) * (flying ? 1 : sxs * 0.9)} ry={r * 0.14} fill="#000" opacity={0.2 * (1 - 0.5 * (height / (h * 0.3)))} />
      {rim && body(-r * 0.05, '#E54B8E', 0.7, 'rimL')}
      {rim && body(r * 0.05, '#55C5F9', 0.7, 'rimR')}
      <ellipse cx={x} cy={bodyY} rx={r * sxs} ry={r * sys} fill={color} />
      <ellipse cx={x} cy={bodyY} rx={r * sxs} ry={r * sys} fill={`url(#${grad}s)`} />
      <ellipse cx={x + r * sxs * 0.38} cy={bodyY - r * sys * 0.45} rx={r * sxs * 0.2} ry={r * sys * 0.11} fill="#F7FAFB" opacity={0.9} transform={`rotate(-30 ${x + r * sxs * 0.38} ${bodyY - r * sys * 0.45})`} />
      {eyeEl(-1)}
      {eyeEl(1)}
      {puffEls}
    </svg>
  );
};

/* ------------------------------------------------------------------ flat-vector impact drop */
export const ImpactScene: React.FC<Common & {rays: number; rings: number; ground: 'line' | 'band'; launchAt: number; accent: string; accent2: string}> = ({color, radius, fg, rays, rings, ground, launchAt, accent, accent2}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const k = fps / 30;
  const r = radius * u * 1.25;
  const groundY = h * 0.72;
  const cx = w / 2;
  const I1 = 15 * k;
  const I2 = 24 * k;
  const AN = launchAt > 0 ? launchAt - 4 * k : 27 * k;
  const LA = launchAt > 0 ? launchAt : 31 * k;
  const top = -r * 2;
  const restY = groundY - r;
  let y = top;
  let sx = 1;
  let sy = 1;
  if (frame < I1) {
    const q = frame / I1;
    y = lerp(top, restY, q * q);
    sy = 1 + 0.22 * q;
    sx = 1 / sy;
  } else if (frame < I2) {
    const q = (frame - I1) / (I2 - I1);
    y = restY - h * 0.16 * 4 * q * (1 - q) * 0.9;
    const near = Math.min(q, 1 - q);
    if (frame - I1 < 2) {
      sy = 0.6;
      sx = 1.35;
    } else {
      sy = 1 + 0.12 * (1 - near * 2);
      sx = 1 / sy;
    }
  } else if (frame < AN) {
    y = restY;
    const sinceI = frame - I2;
    const sq = sinceI < 2 ? 0.7 : 1 - clamp((sinceI - 2) / 3) * 0.3;
    sy = sq;
    sx = 1 / sq;
  } else if (frame < LA) {
    const q = clamp((frame - AN) / (LA - AN));
    sy = lerp(0.82, 0.62, q);
    sx = 1 / sy;
    y = groundY - r * sy;
  } else {
    const q = (frame - LA) / (10 * k);
    y = restY - (h * 1.1 * q * q);
    sy = 1.45;
    sx = 1 / Math.sqrt(sy);
  }
  const sinceLand = (f0: number) => frame - f0;
  const burst = (f0: number, scale: number, key: string) => {
    const age = sinceLand(f0);
    if (age < 0 || age > 14 * k) return null;
    const a = age / (14 * k);
    const els: React.ReactNode[] = [];
    for (let i = 0; i < rays; i++) {
      const ang = Math.PI * (0.08 + (0.84 * i) / Math.max(1, rays - 1));
      const r0 = r * (1.0 + 0.3 * ease.out(a));
      const r1 = r * (1.25 + 1.5 * scale * ease.out(a));
      const rr1 = lerp(r0, r1, 1);
      const rr0 = lerp(r0, r1, ease.in(a));
      els.push(<line key={`${key}r${i}`} x1={cx + Math.cos(ang) * rr0 * 1.05} y1={groundY - Math.sin(ang) * rr0 * 0.9} x2={cx + Math.cos(ang) * rr1} y2={groundY - Math.sin(ang) * rr1 * 0.9} stroke={i % 2 ? '#FFFFFF' : accent} strokeWidth={r * 0.11} strokeLinecap="round" opacity={1 - a} />);
    }
    for (let j = 0; j < rings; j++) {
      const ra = clamp(a * 1.1 - j * 0.12);
      els.push(<ellipse key={`${key}g${j}`} cx={cx} cy={groundY + 3 * u} rx={r * (1 + 3 * scale * ease.out(ra))} ry={r * 0.22 * (1 + 3 * scale * ease.out(ra))} fill="none" stroke={j % 2 ? accent2 : fg} strokeWidth={Math.max(1.5, 3 * u * (1 - ra))} opacity={(1 - ra) * 0.9} />);
    }
    return <g key={key}>{els}</g>;
  };
  const streak = frame < I1 && frame > 3
    ? [-0.45, 0.45].map((d, i) => <line key={i} x1={cx + d * r} y1={Math.max(0, y - r * 4 * sy)} x2={cx + d * r} y2={y - r * 1.1} stroke={fg} strokeOpacity={0.35} strokeWidth={3 * u} strokeLinecap="round" />)
    : null;
  const launchStreak = frame >= LA ? <line x1={cx} y1={y + r * 1.2} x2={cx} y2={y + r * 5} stroke={fg} strokeOpacity={0.3} strokeWidth={r * 0.35} strokeLinecap="round" /> : null;
  const sh = clamp(1 - Math.abs(y - restY) / (h * 0.5));
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
      {ground === 'band' ? <rect x={0} y={groundY} width={w} height={h - groundY} fill={fg} opacity={0.12} /> : null}
      <line x1={ground === 'band' ? 0 : w * 0.12} y1={groundY} x2={ground === 'band' ? w : w * 0.88} y2={groundY} stroke={fg} strokeWidth={4 * u} strokeLinecap="round" />
      <ellipse cx={cx} cy={groundY + 6 * u} rx={r * (0.5 + 0.55 * sh)} ry={r * 0.1} fill={fg} opacity={0.12 + 0.12 * sh} />
      {burst(I1, 1, 'a')}
      {burst(I2, 0.55, 'b')}
      {streak}
      {launchStreak}
      <ellipse cx={cx} cy={y + (r - r * sy) * (frame < LA ? 1 : 0)} rx={r * sx} ry={r * sy} fill={color} />
    </svg>
  );
};
