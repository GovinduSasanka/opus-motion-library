import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {Ball, Mono, P17, PrinciplesHud, bounceAt, bounceImpacts, caught, serifItalic} from '../../core/principles-kit';
import {ImpactScene, SlimeScene, TimelineScene} from '../../core/r2-e3-ball';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video17 principles 01 / 02 / 08 / 10 with one red ball over a dark HUD.
 *  bounce       — gravity drop, restitution 0.67, velocity stretch, 1-frame squash, live sx/sy/area readout
 *  anticipation — squash + charge gauge 0→100 %, easeInExpo launch out the top, stretched re-entry, caught spring
 *  crack        — exaggerated drop, impact frame, cream lens-iris, ground crack branches + ballistic debris
 *  hop          — hops along a ground line on the beat, one note per landing on a staff (secondary action)
 */
type Mode = 'bounce' | 'anticipation' | 'crack' | 'hop' | 'timeline' | 'slime' | 'impact';
type Props = {
  mode: Mode;
  background: string;
  color: string;
  radius: number;
  restitution: number;
  gravity: number;
  maxStretch: number;
  squash: number;
  notes: string[];
  bpm: number;
  hud: boolean;
  numeral: string;
  title: string;
  subtitle: string;
  code: string;
  seed: number;
  /** round-2 modes: timeline / slime / impact */
  period: number;
  apex: number;
  trail: 'dots' | 'none';
  labels: string;
  bounces: number;
  eyes: 'square' | 'ii' | 'x' | 'closed';
  puffs: boolean;
  rim: boolean;
  rays: number;
  rings: number;
  ground: 'line' | 'band';
  launchAt: number;
  accent: string;
  accent2: string;
};

const AUTO: Record<Mode, {bg: string; numeral: string; title: string; subtitle: string; code: string}> = {
  bounce: {bg: P17.ink, numeral: '01', title: 'SQUASH & STRETCH', subtitle: 'The shape changes. The volume never does.', code: 'sx = 1 / sy; // area π·r² is conserved'},
  anticipation: {bg: P17.ink, numeral: '02', title: 'ANTICIPATION', subtitle: 'Wind up before you go.', code: 'y = 540 + A·e^(-ζω·t)·sin(ωd·t); // caught'},
  crack: {bg: P17.ink, numeral: '10', title: 'EXAGGERATION', subtitle: 'Real is not enough. Push it.', code: 'anticipation = 72px · k // k: 1 real → 4 pushed'},
  timeline: {bg: P17.ink, numeral: '06', title: 'TIMING', subtitle: 'Spacing tells the weight.', code: 'y = contactY - 4 * apex * u * (1 - u); // u = (t mod T) / T'},
  slime: {bg: '#F6E8D8', numeral: '', title: '', subtitle: '', code: ''},
  impact: {bg: '#F4EBD8', numeral: '', title: '', subtitle: '', code: ''},
  hop: {bg: P17.pink, numeral: '08', title: 'SECONDARY ACTION', subtitle: 'A smaller action that sells the main one.', code: 'if (landed) emit(note[k++ % 8]); // E G A G E D E C'},
};

const stretchOf = (v: number, u: number, max: number) => {
  const sy = 1 + clamp((Math.abs(v) / u) * 1.15e-4, 0, max);
  return {sx: 1 / sy, sy};
};

/* ---------------------------------------------------------------- bounce */
const BounceScene: React.FC<Props & {fg: string}> = ({color, radius, restitution, gravity, maxStretch, squash, fg}) => {
  const frame = useCurrentFrame();
  const {w, u, cx, cy, portrait} = useStage();
  const r = radius * u;
  const floorY = cy + (portrait ? 330 : 239) * u;
  const h0 = (portrait ? 620 : 480) * u;
  const g = gravity * u;
  // cycle: drop at f=4, bounce to rest, get tossed back up at 66, drop again at 78
  const D1 = 4;
  const L0 = 66;
  const D2 = 78;
  const start = (f: number) => (f >= D2 ? D2 : D1);
  const T = (f: number) => (f - start(f)) / 30;
  const xA = cx - 150 * u;
  const xAt = (f: number) => {
    if (f >= L0 && f < D2) return xA + 80 * u * 2.0 * (1 - prog(f, L0, D2, ease.inOut));
    return xA + 80 * u * clamp(T(f), 0, 2.0) * (f >= D2 ? -1 : 1) + (f >= D2 ? 0 : 0);
  };
  const tossH = (f: number) => {
    const p = clamp((f - L0) / (D2 - L0));
    return h0 * (1 - (1 - p) * (1 - p));
  };
  const state = (f: number) => {
    if (f >= L0 && f < D2) {
      const p = clamp((f - L0) / (D2 - L0));
      return {y: tossH(f), v: ((2 * h0 * (1 - p)) / (D2 - L0)) * 30, rest: false};
    }
    const b = bounceAt(T(f), h0, g, restitution, 1.5 * u);
    return {y: b.y, v: b.v, rest: b.rest};
  };
  const s = state(frame);
  const impacts = bounceImpacts(h0, g, restitution, 1.5 * u);
  const v0 = impacts[0].v;
  const t = T(frame);
  const tossing = frame >= L0 && frame < D2;
  const hit = tossing ? undefined : impacts.find((im) => im.t > t - 1 / 30 && im.t <= t + 1e-6);
  let sx = 1;
  let sy = 1;
  let y = floorY - r - s.y;
  let anchored = false;
  if (hit) {
    sy = 1 - (1 - squash) * clamp(hit.v / v0);
    sx = 1 / sy;
    y = floorY - r;
    anchored = true;
  } else if (frame >= L0 - 3 && frame < L0) {
    sy = 1 - 0.12 * prog(frame, L0 - 3, L0);
    sx = 1 / sy;
    y = floorY - r;
    anchored = true;
  } else if (!s.rest) {
    const st = stretchOf(s.v, u, maxStretch);
    sx = st.sx;
    sy = st.sy;
  }
  const x = xAt(frame);
  // trail: dots every 2 frames
  const dots = [];
  for (let k = 2; k <= 44; k += 2) {
    const f = frame - k;
    if (f < 4) break;
    const p = state(f);
    if (f >= L0 - 2 && f < D2 && frame >= D2) continue;
    dots.push(<circle key={k} cx={xAt(f)} cy={floorY - r - p.y} r={1.6 * u} fill={fg} opacity={0.55 * (1 - k / 46)} />);
  }
  const shadowK = clamp(1 - s.y / h0);
  // readouts
  const rx = portrait ? w - 60 * u : w - 120 * u;
  const ry = portrait ? 220 * u : 150 * u;
  const vals = [
    ['SX', sx.toFixed(2)],
    ['SY', sy.toFixed(2)],
    ['AREA', (sx * sy).toFixed(2)],
  ];
  const readIn = prog(frame, 6, 16);
  const diag = prog(frame, 40, 58, ease.inOut);
  const dx0 = portrait ? w / 2 - 170 * u : rx - 380 * u;
  const dy0 = ry + 190 * u;
  const L = 2 * Math.PI * 30 * u;
  return (
    <>
      <Svg>
        <line x1={44 * u} x2={w - 44 * u} y1={floorY} y2={floorY} stroke={P17.hudDim} strokeWidth={2 * u} />
        <ellipse cx={x} cy={floorY + 2 * u} rx={r * (0.6 + 0.6 * shadowK)} ry={r * 0.13 * (0.6 + 0.6 * shadowK)} fill="none" stroke={P17.hudGrey} strokeWidth={1.2 * u} opacity={0.25 + 0.45 * shadowK} />
        {dots}
        <Ball x={x} y={y} r={r} sx={sx} sy={sy} ax={x} ay={anchored ? floorY : y} color={color} />
        {/* tick marks beside the ball (measure) */}
        <line x1={x + r * sx + 16 * u} x2={x + r * sx + 16 * u} y1={y - r * sy} y2={y + r * sy} stroke={P17.hudGrey} strokeWidth={1 * u} opacity={0.7} />
        <line x1={x + r * sx + 11 * u} x2={x + r * sx + 21 * u} y1={y - r * sy} y2={y - r * sy} stroke={P17.hudGrey} strokeWidth={1 * u} opacity={0.7} />
        <line x1={x + r * sx + 11 * u} x2={x + r * sx + 21 * u} y1={y + r * sy} y2={y + r * sy} stroke={P17.hudGrey} strokeWidth={1 * u} opacity={0.7} />
        {diag > 0 && (
          <g stroke={fg} strokeWidth={1.5 * u} fill="none">
            <circle cx={dx0 + 40 * u} cy={dy0} r={30 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(diag * 3)} />
            <ellipse cx={dx0 + 170 * u} cy={dy0} rx={22 * u} ry={41 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(diag * 3 - 1)} />
            <ellipse cx={dx0 + 310 * u} cy={dy0} rx={52 * u} ry={17 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(diag * 3 - 2)} />
          </g>
        )}
      </Svg>
      {diag > 0 && (
        <>
          <Mono x={dx0 + 105 * u} y={dy0 - 12 * u} size={20} color={fg} anchor="center" opacity={clamp(diag * 3)}>
            =
          </Mono>
          <Mono x={dx0 + 240 * u} y={dy0 - 12 * u} size={20} color={fg} anchor="center" opacity={clamp(diag * 3 - 1)}>
            =
          </Mono>
          <Mono x={dx0 + 175 * u} y={dy0 + 62 * u} size={11} color={P17.hudGrey} anchor="center" opacity={diag}>
            CIRCLE = ELLIPSE = ELLIPSE
          </Mono>
        </>
      )}
      <Mono x={rx} y={ry - 46 * u} size={11} color={P17.hudGrey} anchor="right" opacity={readIn}>
        SCALE · LIVE
      </Mono>
      <div style={{position: 'absolute', left: rx, top: ry - 20 * u, transform: 'translateX(-100%)', display: 'flex', gap: 34 * u, opacity: readIn}}>
        {vals.map(([k, v], i) => (
          <div key={k} style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
            <div style={{fontFamily: serifItalic, fontStyle: 'italic', fontSize: 64 * u, lineHeight: 1, color: i === 2 ? P17.red : fg, fontVariantNumeric: 'tabular-nums'}}>{v}</div>
            <div style={{fontFamily: fonts.mono, fontSize: 10 * u, letterSpacing: '0.15em', color: P17.hudGrey, marginTop: 6 * u}}>{k}</div>
          </div>
        ))}
      </div>
    </>
  );
};

/* ---------------------------------------------------------- anticipation */
const AnticipationScene: React.FC<Props & {fg: string}> = ({color, radius, fg}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const r = radius * u;
  const floorY = cy + (portrait ? 330 : 239) * u;
  // phases (30 fps): squash 0-10, charge 10-39, launch 39-46, re-entry 64-70, caught spring
  const sq = prog(frame, 0, 10, ease.out);
  const fill = prog(frame, 10, 40, (t) => t * (2 - t));
  const pump = frame >= 10 && frame < 40 ? Math.sin((frame - 10) * 0.9) * 0.012 : 0;
  const base = 1 - 0.13 * sq - 0.07 * fill + pump;
  let sy = base;
  let sx = 1 / sy;
  const depthOf = (s: number) => (s < 1 ? r * (1 - s) * 0.55 : 0);
  let bottom = floorY + depthOf(sy);
  let onGround = true;
  let ballOpacity = 1;
  if (frame >= 40 && frame < 47) {
    const st = prog(frame, 40, 43, ease.out);
    const rise = prog(frame, 41, 47, (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)));
    sy = base + (3.6 - base) * st;
    sx = 1 / sy + (0.45 - 1 / sy) * st * 0.6;
    bottom = floorY + depthOf(base) * (1 - st) - rise * (floorY + r * 8);
    onGround = rise < 0.01;
  } else if (frame >= 47 && frame < 64) {
    ballOpacity = 0;
  } else if (frame >= 64 && frame < 70) {
    const tin = prog(frame, 64, 70, (t) => t * t);
    sy = 3.2 - 1.9 * tin;
    sx = 1 / Math.sqrt(sy);
    bottom = lerpN(-30 * u, floorY, tin);
    onGround = false;
  } else if (frame >= 70 && frame < 72) {
    sy = 0.74;
    sx = 1 / sy;
    bottom = floorY + depthOf(sy);
  } else if (frame >= 72) {
    const off = caught((frame - 72) / 30, -46 * u, 0.45, 30);
    const up = Math.min(0, off);
    sy = off > 0 ? 1 - clamp(off / (120 * u), 0, 0.15) : 1 + clamp(-off / (400 * u), 0, 0.08);
    sx = 1 / sy;
    bottom = floorY + up + depthOf(sy);
    onGround = up > -0.5 * u;
  }
  const yC = bottom - r; // unscaled centre (Ball scales about the bottom anchor)
  const x = cx;
  const dip = onGround && ballOpacity > 0 ? bottom - floorY : 0;
  // gauge
  const gy = floorY - r * 2 - 120 * u;
  const gr = 95 * u;
  const gaugeOn = prog(frame, 6, 12) * (1 - prog(frame, 76, 84));
  const pct = Math.round(fill * 100);
  const arcP = (t: number) => {
    const a = Math.PI + Math.PI * t;
    return [x + Math.cos(a) * gr, gy + Math.sin(a) * gr];
  };
  const [ax0, ay0] = arcP(0);
  const [ax1, ay1] = arcP(Math.max(0.001, fill));
  const full = fill >= 1 && frame < 76;
  const flash = full ? 0.5 + 0.5 * Math.cos((frame - 40) * 0.8) : 0;
  // timeline bars
  const bars = [
    ['ANTICIPATION', 90],
    ['ACTION', 45],
    ['FOLLOW-THROUGH', 45],
  ] as const;
  const barW = portrait ? w - 140 * u : 640 * u;
  const bx0 = cx - barW / 2;
  const by = portrait ? 210 * u : 120 * u;
  const tot = 180;
  let acc = 0;
  return (
    <>
      <Svg>
        <path
          d={`M ${44 * u} ${floorY - 18 * u} L ${x - r * 2.2} ${floorY - 6 * u} C ${x - r * 0.9} ${floorY - 4 * u} ${x - r * 0.7} ${floorY + dip} ${x} ${floorY + dip} C ${x + r * 0.7} ${floorY + dip} ${x + r * 0.9} ${floorY - 4 * u} ${x + r * 2.2} ${floorY - 6 * u} L ${w - 44 * u} ${floorY - 18 * u}`}
          fill="none"
          stroke={P17.hudGrey}
          strokeWidth={1.5 * u}
        />
        <circle cx={44 * u} cy={floorY - 18 * u} r={3 * u} fill={P17.hudGrey} />
        <circle cx={w - 44 * u} cy={floorY - 18 * u} r={3 * u} fill={P17.hudGrey} />
        {gaugeOn > 0 && (
          <g opacity={gaugeOn}>
            <path d={`M ${ax0} ${ay0} A ${gr} ${gr} 0 0 1 ${x + gr} ${gy}`} fill="none" stroke={P17.hudDim} strokeWidth={6 * u} />
            {Array.from({length: 7}, (_, i) => {
              const a = Math.PI + (Math.PI * i) / 6;
              return <line key={i} x1={x + Math.cos(a) * (gr + 10 * u)} y1={gy + Math.sin(a) * (gr + 10 * u)} x2={x + Math.cos(a) * (gr + 20 * u)} y2={gy + Math.sin(a) * (gr + 20 * u)} stroke={P17.hudGrey} strokeWidth={1.5 * u} />;
            })}
            {fill > 0 && <path d={`M ${ax0} ${ay0} A ${gr} ${gr} 0 0 1 ${ax1} ${ay1}`} fill="none" stroke={P17.red} strokeWidth={(6 + 3 * flash) * u} strokeLinecap="butt" />}
          </g>
        )}
        <Ball x={x} y={yC} r={r} sx={sx} sy={sy} ax={x} ay={bottom} color={color} opacity={ballOpacity} />
        {frame >= 41 && frame < 47 && <rect x={x - r * 0.3} y={bottom} width={r * 0.6} height={Math.max(0, floorY - bottom)} fill={color} opacity={0.16} />}
        {/* timeline bars */}
        {bars.map(([label, n], i) => {
          const x0 = bx0 + (barW * acc) / tot;
          const bw = (barW * n) / tot - 8 * u;
          acc += n;
          const p = prog(frame, i === 0 ? 10 : i === 1 ? 40 : 64, i === 0 ? 40 : i === 1 ? 50 : 86, ease.linear);
          return (
            <g key={label}>
              <rect x={x0} y={by} width={bw} height={3 * u} fill={P17.hudDim} />
              <rect x={x0} y={by} width={bw * p} height={3 * u} fill={i === 0 ? P17.red : fg} />
            </g>
          );
        })}
      </Svg>
      {bars.map(([label, n], i) => {
        const x0 = bx0 + (barW * bars.slice(0, i).reduce((a, b) => a + b[1], 0)) / tot;
        return (
          <Mono key={label} x={x0} y={by - 22 * u} size={10} color={i === 0 ? P17.red : P17.hudGrey}>
            {`${label} ${n}F`}
          </Mono>
        );
      })}
      {gaugeOn > 0 && (
        <div style={{position: 'absolute', left: x, top: gy - gr - 96 * u, transform: 'translateX(-50%)', opacity: gaugeOn, display: 'flex', alignItems: 'baseline', gap: 4 * u}}>
          <span style={{fontFamily: serifItalic, fontStyle: 'italic', fontSize: 84 * u, lineHeight: 1, color: full ? (flash > 0.5 ? P17.red : fg) : fg, fontVariantNumeric: 'tabular-nums'}}>{pct}</span>
          <span style={{fontFamily: serifItalic, fontStyle: 'italic', fontSize: 34 * u, color: fg}}>%</span>
        </div>
      )}
      {gaugeOn > 0 && (
        <Mono x={x} y={gy + 14 * u} size={10} color={P17.hudGrey} anchor="center" opacity={gaugeOn}>
          LOADED · {frame < 40 ? 'CHARGING' : 'RELEASE'}
        </Mono>
      )}
    </>
  );
};

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

/* ----------------------------------------------------------------- crack */
const CrackScene: React.FC<Props & {fg: string; seed: number}> = ({color, radius, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const r = radius * u;
  const floorY = cy + (portrait ? 330 : 239) * u;
  const FI = 18; // impact frame
  const x = cx;
  let sx = 1;
  let sy = 1;
  let yC: number;
  let anchored = false;
  if (frame < FI) {
    const t = prog(frame, 3, FI, (k) => k * k);
    sy = 1 + 1.1 * t;
    sx = 1 / Math.sqrt(sy);
    yC = lerpN(-r * 4, floorY - r, t);
    if (frame < 3) yC = -r * 4;
  } else if (frame < FI + 2) {
    sy = 0.45;
    sx = 1.9;
    yC = floorY - r;
    anchored = true;
  } else {
    const h1 = 260 * u;
    const g = 7100 * u;
    const T0 = Math.sqrt((2 * h1) / g);
    const b = bounceAt(T0 + (frame - FI - 2) / 30, h1, g, 0.5, 2 * u);
    const st = stretchOf(b.v, u, 0.3);
    sx = st.sx;
    sy = st.sy;
    yC = floorY - r - b.y;
    const im = bounceImpacts(h1, g, 0.5, 2 * u).find((q) => q.t > T0 && Math.abs(q.t - (T0 + (frame - FI - 2) / 30)) < 1 / 30);
    if (im) {
      sy = 0.75;
      sx = 1 / sy;
      yC = floorY - r;
      anchored = true;
    }
  }
  const impactFrame = frame >= FI && frame < FI + 2;
  const iris = prog(frame, FI + 2, FI + 8, (t) => t * (2 - t));
  const R = 150 * u + iris * Math.hypot(w, h) * 1.05;
  const shake = frame >= FI && frame < FI + 10 ? (1 - (frame - FI) / 10) * 14 * u : 0;
  const shx = shake * Math.sin(frame * 7.3);
  const shy = shake * Math.cos(frame * 5.1);
  // crack branches: seeded random walks on the ground plane (flattened 0.32 for perspective), tapered
  const rr = rng(seed * 7 + 3);
  type Seg = {x1: number; y1: number; x2: number; y2: number; wd: number; at: number};
  const segs: Seg[] = [];
  const walk = (x0: number, y0: number, a0: number, steps: number, w0: number, t0: number, depth: number) => {
    let px = x0;
    let py = y0;
    let a = a0;
    for (let k = 0; k < steps; k++) {
      a += (rr() - 0.5) * 0.7;
      const len = (26 + rr() * 26) * u;
      const nx = px + Math.cos(a) * len;
      const ny = py + Math.sin(a) * len * 0.32;
      const wd = w0 * (1 - k / (steps + 1));
      segs.push({x1: px, y1: py, x2: nx, y2: ny, wd, at: t0 + k});
      if (depth < 1 && k > 0 && rr() < 0.45) walk(nx, ny, a + (rr() < 0.5 ? -1 : 1) * (0.5 + rr() * 0.4), 2 + Math.floor(rr() * 3), wd * 0.7, t0 + k + 1, depth + 1);
      px = nx;
      py = ny;
    }
  };
  for (let b = 0; b < 5; b++) {
    const side = b % 2 === 0 ? -1 : 1;
    const a0 = side < 0 ? Math.PI - (rr() * 0.9 - 0.1) : rr() * 0.9 - 0.1;
    walk(x + side * r * 0.3, floorY + 1 * u, a0, 6 + Math.floor(rr() * 3), (4.5 + rr() * 2) * u, b * 0.4, 0);
  }
  const shards = Array.from({length: 13}, (_, i) => {
    const q = rng(seed * 31 + i * 17);
    const dir = q() < 0.5 ? -1 : 1;
    const vx = dir * (150 + q() * 560) * u;
    const vy = (650 + q() * 650) * u;
    const om = (q() - 0.5) * 900;
    const size = (8 + q() * 17) * u;
    const nv = q() < 0.5 ? 3 : 4;
    const pts = Array.from({length: nv}, (_, k) => {
      const a = (k / nv) * Math.PI * 2 + q() * 0.8;
      const rad = size * (0.6 + q() * 0.5);
      return [Math.cos(a) * rad, Math.sin(a) * rad] as [number, number];
    });
    return {vx, vy, om, pts, x0: x + dir * q() * r};
  });
  const ts = (frame - FI) / 30;
  const g = 2600 * u;
  const dark = frame < FI + 2;
  const crackP = prog(frame, FI + 1, FI + 8, ease.out);
  return (
    <>
      <AbsoluteFill style={{transform: `translate(${shx}px, ${shy}px)`}}>
        <Svg>
          {!dark && (
            <defs>
              <radialGradient id={`bb-iris-${seed}`} gradientUnits="userSpaceOnUse" cx={x} cy={floorY} r={R}>
                <stop offset="0" stopColor={P17.paper} />
                <stop offset={clamp(1 - (60 * u) / R)} stopColor={P17.paper} />
                <stop offset="1" stopColor={P17.paper} stopOpacity={0} />
              </radialGradient>
            </defs>
          )}
          {!dark && <circle cx={x} cy={floorY} r={R} fill={`url(#bb-iris-${seed})`} />}
          {!dark && iris < 1 && (
            <g fill="none" stroke="#000" strokeOpacity={0.06} strokeWidth={2 * u}>
              <circle cx={x} cy={floorY} r={R * 0.55} />
              <circle cx={x} cy={floorY} r={R * 0.8} />
            </g>
          )}
          <line x1={44 * u} x2={w - 44 * u} y1={floorY} y2={floorY} stroke={dark ? P17.hudDim : P17.ink} strokeWidth={(dark ? 2 : 2.5) * u} />
          {!dark &&
            segs.map((sg, i) => {
              const pp = clamp(crackP * 10 - sg.at);
              if (pp <= 0) return null;
              return <line key={i} x1={sg.x1} y1={sg.y1} x2={sg.x1 + (sg.x2 - sg.x1) * pp} y2={sg.y1 + (sg.y2 - sg.y1) * pp} stroke={P17.ink} strokeWidth={Math.max(1, sg.wd)} strokeLinecap="round" />;
            })}
          {!dark &&
            shards.map((s, i) => {
              const sx2 = s.x0 + s.vx * ts;
              const sy2 = floorY - 8 * u - s.vy * ts + 0.5 * g * ts * ts;
              if (sy2 > h + 60 * u) return null;
              return <polygon key={i} points={s.pts.map(([a, b]) => `${a},${b}`).join(' ')} transform={`translate(${sx2} ${sy2}) rotate(${s.om * ts})`} fill={P17.ink} />;
            })}
          {frame < FI && frame > 2 && (
            <g stroke={P17.hudGrey} strokeWidth={1 * u}>
              <line x1={x - r - 40 * u} x2={x - r - 40 * u} y1={yC - r * sy} y2={yC + r * sy} />
              <line x1={x - r - 46 * u} x2={x - r - 34 * u} y1={yC - r * sy} y2={yC - r * sy} />
              <line x1={x - r - 46 * u} x2={x - r - 34 * u} y1={yC + r * sy} y2={yC + r * sy} />
            </g>
          )}
          {!impactFrame && <Ball x={x} y={yC} r={r} sx={sx} sy={sy} ax={x} ay={anchored ? floorY : yC} color={color} />}
        </Svg>
      </AbsoluteFill>
      {frame < FI && frame > 2 && (
        <div style={{position: 'absolute', left: x + r * 1.4, top: Math.max(120 * u, yC - r * 2), fontFamily: serifItalic, fontStyle: 'italic', fontSize: 150 * u, lineHeight: 1, color: P17.red}}>×4</div>
      )}
      {impactFrame && <ImpactFrame x={x} y={floorY - r * 0.4} seed={seed + frame} label="×4.0" />}
    </>
  );
};

/** 2-frame comic smash frame: black, white radial speed lines, jagged burst, giant italic label */
const ImpactFrame: React.FC<{x: number; y: number; seed: number; label: string}> = ({x, y, seed, label}) => {
  const {w, h, u} = useStage();
  const q = rng(seed * 13 + 1);
  const Rmax = Math.hypot(w, h);
  const lines = Array.from({length: 80}, (_, i) => {
    const a = (i / 80) * Math.PI * 2 + q() * 0.05;
    const r0 = (250 + q() * 120) * u;
    const wd = (2 + q() * 8) * u;
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    const p0 = [x + Math.cos(a) * r0, y + Math.sin(a) * r0];
    const p1 = [x + Math.cos(a) * Rmax + nx * wd, y + Math.sin(a) * Rmax + ny * wd];
    const p2 = [x + Math.cos(a) * Rmax - nx * wd, y + Math.sin(a) * Rmax - ny * wd];
    return `${p0[0]},${p0[1]} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`;
  });
  const burst = Array.from({length: 28}, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const rad = (i % 2 ? 70 : 150 + q() * 60) * u;
    return `${x + Math.cos(a) * rad * 1.5},${y + Math.sin(a) * rad * 0.7}`;
  }).join(' ');
  return (
    <AbsoluteFill style={{background: P17.ink}}>
      <Svg>
        {lines.map((pts, i) => (
          <polygon key={i} points={pts} fill="#fff" />
        ))}
        <polygon points={burst} fill="#fff" />
      </Svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: y - 260 * u, textAlign: 'center', fontFamily: serifItalic, fontStyle: 'italic', fontSize: 300 * u, lineHeight: 1, color: '#fff', transform: 'skewX(-10deg)', mixBlendMode: 'difference'}}>{label}</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------- hop */
const NOTE_STEP: Record<string, number> = {C: -2, D: -1, E: 0, F: 1, G: 2, A: 3, B: 4, C5: 5, D5: 6, E5: 7, F5: 8};

const HopScene: React.FC<Props & {fg: string}> = ({color, radius, notes, bpm, fg}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const r = radius * 0.75 * u;
  const floorY = cy + (portrait ? 300 : 210) * u;
  const P = (60 / bpm) * 30;
  const n = Math.max(1, notes.length);
  const F0 = 10;
  const x0 = w * 0.13 + r;
  const x1 = w * 0.87 - r;
  const heights = [90, 75, 105, 80, 95, 70, 100, 85];
  const posAt = (f: number) => {
    const k = Math.floor((f - F0) / P);
    if (f < F0) return {x: x0, y: 0, v: 0, k: -1};
    if (k >= n) return {x: x1, y: 0, v: 0, k: n};
    const t = (f - F0 - k * P) / P;
    const H = heights[k % heights.length] * u;
    return {x: x0 + ((x1 - x0) * (k + t)) / n, y: 4 * H * t * (1 - t), v: 4 * H * (1 - 2 * t) * (30 / P), k};
  };
  const s = posAt(frame);
  const landF = (k: number) => F0 + (k + 1) * P;
  const justLanded = Array.from({length: n}, (_, k) => landF(k)).some((lf) => frame >= lf && frame < lf + 1.5);
  const anticip = Array.from({length: n}, (_, k) => F0 + k * P).some((sf) => frame >= sf - 1.2 && frame < sf);
  let sx = 1;
  let sy = 1;
  let anchored = false;
  if (justLanded || anticip || frame < F0) {
    sy = frame < F0 ? 1 - 0.1 * prog(frame, 2, F0) : justLanded ? 0.7 : 0.82;
    sx = 1 / sy;
    anchored = true;
  } else if (s.k >= 0 && s.k < n) {
    const st = stretchOf(s.v, u, 0.18);
    sx = st.sx;
    sy = st.sy;
  }
  // idle bob after the run (playback)
  const play = frame - (landF(n - 1) + 8);
  if (s.k >= n && play > 0) {
    const bob = Math.max(0, Math.sin((play / P) * Math.PI));
    sy = 1 - 0.08 * bob;
    sx = 1 / sy;
    anchored = true;
  }
  const yC = floorY - r - s.y;
  // staff
  const st0 = portrait ? 260 * u : 150 * u;
  const gap = 18 * u;
  const sxL = w * 0.1;
  const sxR = w * 0.9;
  const bottomLine = st0 + 4 * gap;
  const noteX = (k: number) => sxL + 90 * u + ((sxR - sxL - 150 * u) * k) / Math.max(1, n - 1);
  const dots = [];
  for (let k = 2; k <= 60; k += 2) {
    const f = frame - k;
    if (f < F0) break;
    const p = posAt(f);
    if (p.k >= n) continue;
    dots.push(<circle key={k} cx={p.x} cy={floorY - r - p.y} r={2.4 * u} fill={fg} opacity={0.7 * (1 - k / 62)} />);
  }
  const lastLanded = Array.from({length: n}, (_, k) => k).filter((k) => frame >= landF(k)).pop();
  const calloutIn = prog(frame, 14, 22);
  const noteCallIn = lastLanded !== undefined ? prog(frame, landF(0), landF(0) + 6) : 0;
  return (
    <>
      <Svg>
        {Array.from({length: 5}, (_, i) => (
          <line key={i} x1={sxL} x2={sxL + (sxR - sxL) * prog(frame, 0, 14, ease.out)} y1={st0 + i * gap} y2={st0 + i * gap} stroke={fg} strokeWidth={1.2 * u} opacity={0.75} />
        ))}
        <line x1={sxL} x2={sxL} y1={st0} y2={bottomLine} stroke={fg} strokeWidth={2 * u} />
        <text x={sxL + 14 * u} y={bottomLine + 6 * u} fontFamily={serifItalic} fontStyle="italic" fontSize={104 * u} fill={fg}>
          𝄞
        </text>
        {notes.map((nm, k) => {
          const lf = landF(k);
          if (frame < lf) return null;
          const pop = prog(frame, lf, lf + 5, ease.back);
          const bump = s.k >= n && play > 0 ? Math.max(0, 1 - Math.abs(play - k * 4) / 3) : 0;
          const col = interpolateColors(Math.max(prog(frame, lf, lf + 9, ease.linear) - bump, 0), [0, 1], [P17.red, fg]);
          const step = NOTE_STEP[nm] ?? 0;
          const nx = noteX(k);
          const ny = bottomLine - (step * gap) / 2;
          const sc = pop * (1 + 0.25 * bump);
          return (
            <g key={k} transform={`translate(${nx} ${ny}) scale(${sc})`}>
              {step <= -2 && <line x1={-19 * u} x2={19 * u} y1={((-2 - step) * gap) / 2} y2={((-2 - step) * gap) / 2} stroke={fg} strokeWidth={1.2 * u} />}
              <ellipse cx={0} cy={0} rx={11.5 * u} ry={8 * u} transform="rotate(-22)" fill={col} />
              <line x1={10.4 * u} x2={10.4 * u} y1={-3 * u} y2={-54 * u} stroke={col} strokeWidth={2.2 * u} />
              {k % 2 === 1 && <path d={`M ${10.4 * u} ${-54 * u} q ${13 * u} ${10 * u} ${10 * u} ${27 * u}`} fill="none" stroke={col} strokeWidth={2.6 * u} />}
            </g>
          );
        })}
        <line x1={44 * u} x2={w - 44 * u} y1={floorY} y2={floorY} stroke={fg} strokeWidth={1.5 * u} />
        {dots}
        <Ball x={s.x} y={yC} r={r} sx={sx} sy={sy} ax={s.x} ay={anchored ? floorY : yC} color={color} />
        {/* callouts */}
        <g opacity={calloutIn} stroke={fg} strokeWidth={1 * u} fill="none">
          <path d={`M ${s.x + r * 0.6} ${yC + r * 0.6} L ${s.x + r + 70 * u} ${yC + r + 70 * u} L ${s.x + r + 200 * u} ${yC + r + 70 * u}`} />
        </g>
        {lastLanded !== undefined && (
          <g opacity={noteCallIn} stroke={fg} strokeWidth={1 * u} fill="none">
            <path d={`M ${noteX(lastLanded) + 12 * u} ${st0 - 10 * u} L ${noteX(lastLanded) + 52 * u} ${st0 - 50 * u} L ${noteX(lastLanded) + 170 * u} ${st0 - 50 * u}`} />
          </g>
        )}
      </Svg>
      <div style={{position: 'absolute', left: s.x + r + 80 * u, top: yC + r + 50 * u, opacity: calloutIn}}>
        <div style={{fontFamily: fonts.mono, fontSize: 11 * u, letterSpacing: '0.15em', color: fg, fontWeight: 700}}>PRIMARY · HOP</div>
        <div style={{width: 60 * u, height: 3 * u, background: P17.red, marginTop: 5 * u}} />
      </div>
      {lastLanded !== undefined && (
        <div style={{position: 'absolute', left: noteX(lastLanded) + 60 * u, top: st0 - 72 * u, opacity: noteCallIn}}>
          <div style={{fontFamily: fonts.mono, fontSize: 11 * u, letterSpacing: '0.15em', color: fg, fontWeight: 700}}>SECONDARY · NOTE {notes[lastLanded]}</div>
        </div>
      )}
    </>
  );
};

const BouncingBall: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const {mode, background, hud, seed} = props;
  const auto = AUTO[mode] ?? AUTO.bounce;
  let bg = background || auto.bg;
  if (mode === 'crack' && !background && frame >= 21) bg = P17.paper;
  const fg = bg === P17.ink || bg.toLowerCase() === '#0b0d0c' || bg === '#000000' ? P17.paper : P17.ink;
  const dark = fg === P17.paper;
  return (
    <AbsoluteFill style={{background: mode === 'crack' && !background ? P17.ink : bg}}>
      {mode === 'anticipation' ? (
        <AnticipationScene {...props} fg={fg} />
      ) : mode === 'crack' ? (
        <CrackScene {...props} fg={fg} seed={seed} />
      ) : mode === 'timeline' ? (
        <TimelineScene color={props.color} radius={props.radius} fg={fg} bpm={props.bpm} labels={props.labels} period={props.period} apex={props.apex} trail={props.trail === 'dots'} bounces={props.bounces} />
      ) : mode === 'slime' ? (
        <SlimeScene color={props.color} radius={props.radius} fg={fg} bpm={props.bpm} labels={props.labels} eyes={props.eyes} puffs={props.puffs} rim={props.rim} />
      ) : mode === 'impact' ? (
        <ImpactScene color={props.color} radius={props.radius} fg={fg} bpm={props.bpm} labels={props.labels} rays={props.rays} rings={props.rings} ground={props.ground} launchAt={props.launchAt} accent={props.accent} accent2={props.accent2} />
      ) : mode === 'hop' ? (
        <HopScene {...props} fg={fg} />
      ) : (
        <BounceScene {...props} fg={fg} />
      )}
      {hud && (mode !== 'slime' && mode !== 'impact' || !!props.title) && !(mode === 'crack' && frame >= 18 && frame < 20) && (
        <PrinciplesHud bg={dark ? P17.ink : P17.paper} numeral={props.numeral || auto.numeral} title={props.title || auto.title} subtitle={props.subtitle || auto.subtitle} code={props.code || auto.code} bpm={props.bpm} />
      )}
    </AbsoluteFill>
  );
};

export const bouncingBall = defineMotion<Props>({
  id: 'bouncing-ball',
  title: 'Bouncing ball (squash, anticipation, crack, hop)',
  category: 'shape',
  description: 'A red ball over a dark dev-HUD: gravity bounces with velocity stretch and 1-frame squash, or a charge-gauge launch, an exaggerated ground-cracking drop, or beat hops that write notes on a staff.',
  source: ['video17 0:00-0:05 squash-stretch-bounce + anticipation-charge-launch', 'video17 0:21-0:24 note-per-bounce', 'video17 0:27-0:30 impact-frame + ground-crack-debris'],
  useFor: 'Explaining physics / animation principles, playful logo or mascot drops, "charging then launch" beats, heavy-impact emphasis.',
  durationInFrames: 120,
  defaultProps: {
    mode: 'bounce',
    background: '',
    color: P17.red,
    radius: 69.5,
    restitution: 0.67,
    gravity: 7100,
    maxStretch: 0.3,
    squash: 0.55,
    notes: ['E', 'G', 'A', 'G', 'E', 'D', 'E', 'C'],
    bpm: 160,
    hud: true,
    numeral: '',
    title: '',
    subtitle: '',
    code: '',
    seed: 4,
    period: 0.5,
    apex: 0.31,
    trail: 'dots',
    labels: '',
    bounces: 0,
    eyes: 'square',
    puffs: true,
    rim: true,
    rays: 7,
    rings: 3,
    ground: 'line',
    launchAt: 0,
    accent: '#F5C518',
    accent2: '#E8553B',
  },
  propDocs: {
    mode: "'bounce' (gravity bounces) | 'anticipation' (charge gauge + launch) | 'crack' (exaggerated drop, impact frame, ground crack + debris) | 'hop' (beat hops, a note per landing) | 'timeline' (timing chart: ticks, dot trail, live squash readout) | 'slime' (glossy jelly hopper with eyes, puffs, chroma rim) | 'impact' (flat-vector drop: speed streaks, burst rays, ground rings, launch)",
    background: "background colour; '' = mode default (ink / pink for hop; crack flips to cream)",
    color: 'ball colour',
    radius: 'ball radius in u (1080-short-side px)',
    restitution: 'velocity kept per bounce (0.67 measured)',
    gravity: 'gravity in u/s² (7100 measured at 1080p)',
    maxStretch: 'max extra vertical stretch from speed',
    squash: 'scaleY on the hardest impact frame',
    notes: "hop mode: note names on the staff, one per landing (C D E F G A B C5 D5…)",
    bpm: 'beat rate (hop period, HUD beat squares)',
    hud: 'show the HUD chrome + chapter title',
    numeral: "chapter numeral ('' = mode default)",
    title: "chapter title, \\n for a second line ('' = mode default)",
    subtitle: 'small line under the title',
    code: 'live code comment typed in the footer',
    seed: 'crack / debris randomness',
    period: 'timeline mode: seconds per bounce (0.5 measured)',
    apex: 'timeline mode: apex height as a fraction of the frame height',
    trail: "timeline mode: 'dots' keeps a grey dot every 2 frames (spacing chart) | 'none'",
    labels: 'timeline mode: leader-line label text ("" = live sy / sx readout)',
    bounces: 'timeline mode: bounces across the axis (0 = fit the duration)',
    eyes: "slime mode: 'square' | 'ii' | 'x' | 'closed'",
    puffs: 'slime mode: white dust puffs at each landing',
    rim: 'slime mode: red / cyan chromatic rim copies',
    rays: 'impact mode: burst ray count (two colours)',
    rings: 'impact mode: expanding ground rings per impact',
    ground: "impact mode: 'line' | 'band'",
    launchAt: 'impact mode: frame of the stretch launch (0 = frame 31 @30 fps)',
    accent: 'impact mode: first ray colour',
    accent2: 'impact mode: second ground-ring colour',
  },
  component: BouncingBall,
  tags: ['ball', 'bounce', 'squash', 'stretch', 'physics', 'hud', 'impact', 'music', 'timeline', 'timing-chart', 'spacing', 'slime', 'jelly', 'hop', 'mascot', 'ground-rings', 'burst-rays'],
});
