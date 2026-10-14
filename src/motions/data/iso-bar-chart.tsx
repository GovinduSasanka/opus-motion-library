import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {mixHex, shade} from '../../core/hud-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video7 "Downhill": a clay-isometric (dimetric) bar chart on a tiled floor that doubles as a
 * staircase. A white eyed blob hops down it on the beat (0.5 s), each landing squashes the blob
 * (sy 0.7 -> 1.12 -> 1), throws 3-6 confetti squares and paints that bar's cap ghost -> orange
 * (6 f easeOutQuad). Near the bottom the paint cascades ahead of it, the camera eases out to the
 * whole chart (x0.62), the blob slams the floor (tile ripple, A 0.25 cell, 6 cells/s), rolls back
 * along the wall leaving a peach trail, rides a rising pillar (1.85 s easeInOutCubic) while the caps
 * un-paint from the bottom up, and hops onto step 1 again: a seamless loop.
 */
type Props = {
  values: number[];
  beatFrames: number;
  showCharacter: boolean;
  loop: boolean;
  maxHeight: number;
  zoom: number;
  hopHeight: number;
  accent: string;
  ghost: string;
  barColor: string;
  floorColor: string;
  background: string;
  pillarColor: string;
  seed: number;
};

type V3 = [number, number, number];
type Hop = {t0: number; t1: number; a: V3; b: V3; hard?: boolean};

const KX = [1, 0.32];
const KZ = [0.524, -0.3];
const base = (x: number, y: number, z: number): [number, number] => [x * KX[0] + z * KZ[0], x * KX[1] + z * KZ[1] - y];
const DET = KX[0] * KZ[1] - KZ[0] * KX[1];
const unbase = (bx: number, by: number): [number, number] => [(bx * KZ[1] - KZ[0] * by) / DET, (KX[0] * by - KX[1] * bx) / DET];
const easeCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const R_BALL = 0.34;

const IsoBarChart: React.FC<Props> = ({values, beatFrames, showCharacter, loop, maxHeight, zoom, hopHeight, accent, ghost, barColor, floorColor, background, pillarColor, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const N = Math.max(2, values.length);
  const vals = values.length >= 2 ? values : [3, 2];
  const vmax = Math.max(...vals.map((v) => Math.abs(v)), 1e-6);
  const B = Math.max(6, Math.round(beatFrames));

  // ---------- timeline ----------
  const plan = React.useMemo(() => {
    const H = vals.map((v) => Math.max(0.12, (Math.abs(v) / vmax) * maxHeight));
    const top = (i: number): V3 => [i + 0.5, H[i], 0.5];
    const K = Math.max(0, Math.min(N - 1, N - 5));
    const R = N - 1 - K;
    const casc = R > 0 ? Math.min(2, R) : 0;
    const hops: Hop[] = [];
    const paint: number[] = new Array(N).fill(0);
    for (let k = 1; k <= K; k++) {
      hops.push({t0: (k - 1) * B, t1: k * B, a: top(k - 1), b: top(k)});
      paint[k] = k * B;
    }
    let cur = K;
    for (let c = 0; c < casc; c++) {
      const nxt = c === casc - 1 ? N - 1 : K + Math.ceil(R / casc);
      hops.push({t0: (K + c) * B, t1: (K + c + 1) * B, a: top(cur), b: top(nxt)});
      cur = nxt;
    }
    for (let i = K + 1; i < N; i++) paint[i] = K * B + ((i - K) * casc * B) / R - 2;
    const Lf = (K + casc + 1) * B;
    const floorPos: V3 = [N + 0.5, 0, -0.5];
    hops.push({t0: Lf - B, t1: Lf, a: top(N - 1), b: floorPos, hard: true});
    const Hp = H[0] + Math.max(0.35, Math.min(1, Math.abs(H[0] - H[1]) || 0.5));
    const T = {
      Lf,
      rollA: Lf + 30,
      rollB: Lf + 120,
      riseA: Lf + 126,
      riseB: Lf + 181,
      unpaint: Lf + 135,
      pillarCap: Lf + 178,
      Tc: Lf + 270,
    };
    const unpaint = H.map((_, i) => T.unpaint + (N - 1 - i) * 3);
    const landings = [0, ...hops.map((x) => x.t1), T.riseB];
    return {H, top, hops, paint, unpaint, T, Hp, floorPos, landings, K};
  }, [vals.join(','), vmax, maxHeight, N, B]);
  const {H, hops, paint, unpaint, T, Hp, floorPos, landings} = plan;

  const intro = loop ? 0 : 40;
  const Tc = T.Tc;
  const tl = loop ? ((frame % Tc) + Tc) % Tc : frame - intro;
  const ended = !loop && tl >= T.Lf;

  const pillarH = (t: number) => {
    if (!loop) return 0;
    if (t < 15) return Hp * (1 - ease.in(t / 15));
    if (t < T.riseA) return 0;
    if (t < T.riseB) return Hp * easeCubic((t - T.riseA) / (T.riseB - T.riseA));
    return Hp;
  };
  const rollX = (t: number) => lerp(floorPos[0], -0.5, ease.inOut(clamp((t - T.rollA) / (T.rollB - T.rollA))));

  // ball position (world), rolling angle
  const ballAt = (tRaw: number): {p: V3; roll: number; air: number} => {
    let t = tRaw;
    if (loop) t = ((t % Tc) + Tc) % Tc;
    if (!loop && t < 0) {
      const d = ease.in(clamp((t + 18) / 18));
      return {p: [0.5, H[0] + (1 - d) * 4, 0.5], roll: 0, air: 1 - d};
    }
    if (!loop && t >= T.Lf) return {p: floorPos, roll: 0, air: 0};
    for (const hp of hops) {
      if (t >= hp.t0 && t < hp.t1) {
        const p = (t - hp.t0) / (hp.t1 - hp.t0);
        const q = Math.pow(p, 1.159);
        const arcH = hopHeight + Math.max(0, hp.b[1] - hp.a[1]);
        const arc = arcH * 4 * q * (1 - q);
        return {p: [lerp(hp.a[0], hp.b[0], p), lerp(hp.a[1], hp.b[1], p) + arc, lerp(hp.a[2], hp.b[2], p)], roll: 0, air: arc};
      }
    }
    if (t < T.rollA) return {p: floorPos, roll: 0, air: 0};
    if (t < T.rollB) {
      const x = rollX(t);
      return {p: [x, 0, -0.5], roll: (floorPos[0] - x) / R_BALL, air: 0};
    }
    if (t < Tc - B) return {p: [-0.5, pillarH(t), -0.5], roll: 0, air: 0};
    const p = (t - (Tc - B)) / B;
    const q = Math.pow(p, 1.159);
    const a: V3 = [-0.5, Hp, -0.5];
    const b = plan.top(0);
    const arc = hopHeight * 4 * q * (1 - q);
    return {p: [lerp(a[0], b[0], p), lerp(a[1], b[1], p) + arc, lerp(a[2], b[2], p)], roll: 0, air: arc};
  };

  // ---------- camera ----------
  const bb = React.useMemo(() => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    const add = (x: number, y: number, z: number) => {
      const [a, b] = base(x, y, z);
      x0 = Math.min(x0, a);
      x1 = Math.max(x1, a);
      y0 = Math.min(y0, b);
      y1 = Math.max(y1, b);
    };
    H.forEach((hh, i) => {
      for (const x of [i, i + 1]) for (const z of [0, 1]) for (const y of [0, hh]) add(x, y, z);
    });
    add(N + 1, 0, -1);
    add(-1, 0, -1);
    return {x0, x1, y0, y1};
  }, [H, N]);
  const Cclose = 103 * u * zoom * (portrait ? 1.08 : 1);
  const fit = Math.min((w * 0.86) / (bb.x1 - bb.x0), (h * (portrait ? 0.55 : 0.8)) / (bb.y1 - bb.y0));
  const Cwide = Math.min(Cclose * Math.max(0.62, Math.min(0.9, 9 / N)), fit);
  const wideW = (t: number) => {
    if (!loop && t >= T.Lf) return prog(t, T.Lf - 30, T.Lf + 6, ease.inOut);
    const kA = Math.max(0, (plan.K - 1) * B);
    return Math.min(prog(t, kA, T.Lf + 2, ease.inOut), 1 - prog(t, T.Lf + 30, T.Lf + 150, ease.inOut));
  };
  const smooth = (() => {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let k = 0; k <= 12; k += 2) {
      const tt = tl - k;
      const b = ballAt(tt);
      const [a, c] = base(b.p[0], b.p[1] - b.air * 0.7, b.p[2]);
      sx += a;
      sy += c;
      n++;
    }
    return [sx / n, sy / n];
  })();
  const ww = tl < 0 ? 0 : wideW(tl);
  const C = Math.exp(lerp(Math.log(Cclose), Math.log(Cwide), ww));
  const focus = [lerp(smooth[0], (bb.x0 + bb.x1) / 2, ww), lerp(smooth[1], (bb.y0 + bb.y1) / 2, ww)];
  const anchor = [lerp(w * (portrait ? 0.5 : 0.52), w * 0.5, ww), lerp(h * (portrait ? 0.5 : 0.47), h * 0.5, ww)];
  const P = (x: number, y: number, z: number): [number, number] => {
    const [a, b] = base(x, y, z);
    return [(a - focus[0]) * C + anchor[0], (b - focus[1]) * C + anchor[1]];
  };
  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const pth = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z `;
  const quad = (a: V3, b: V3, c: V3, d: V3) => poly([P(...a), P(...b), P(...c), P(...d)]);

  // ---------- colours ----------
  const capTop = accent;
  const capFront = shade(accent, -0.07);
  const capRight = shade(accent, -0.19);
  const ghostSide = shade(ghost, -0.03);
  const barFront = shade(barColor, 0.12);
  const barFrontLow = shade(barColor, -0.1);
  const barRight = shade(barColor, 0.25);
  const barRightLow = shade(barColor, -0.06);
  const tray = shade(barColor, 0.65);
  const groove = shade(floorColor, -0.13);
  const trailTint = mixHex(floorColor, accent, 0.22);
  const pTop = pillarColor;
  const pFront = shade(pillarColor, -0.08);
  const pRight = shade(pillarColor, -0.14);

  const introH = (i: number) => (loop ? 1 : prog(frame, 2 + i * 1.5, 22 + i * 1.5, ease.out));

  // cap state 0..1 (paint) with colour mix
  const capState = (i: number, t: number): {o: number; m: number} => {
    if (t < 0) return {o: 0, m: 0};
    const pIn = clamp((t - paint[i] + 1) / 3);
    if (pIn <= 0) return {o: 0, m: 0};
    let o = 0.35 + 0.65 * pIn;
    let m = 1 - (1 - pIn) * (1 - pIn);
    if (loop) {
      const uo = clamp((t - unpaint[i]) / 4);
      if (uo > 0) {
        m *= 1 - clamp(uo * 2);
        o *= 1 - clamp(uo * 2 - 1);
      }
    }
    return {o, m};
  };

  // ---------- floor grid ----------
  const corners = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ].map(([sx, sy]) => unbase((sx - anchor[0]) / C + focus[0], (sy - anchor[1]) / C + focus[1]));
  const gx0 = Math.floor(Math.min(...corners.map((c) => c[0]))) - 1;
  const gx1 = Math.ceil(Math.max(...corners.map((c) => c[0]))) + 1;
  const gz0 = Math.floor(Math.min(...corners.map((c) => c[1]))) - 1;
  const gz1 = Math.ceil(Math.max(...corners.map((c) => c[1]))) + 1;
  let grid = '';
  let gridHi = '';
  for (let x = gx0; x <= gx1; x++) {
    const a = P(x, 0, gz0);
    const b = P(x, 0, gz1);
    grid += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    const a2 = P(x + 0.045, 0, gz0);
    const b2 = P(x + 0.045, 0, gz1);
    gridHi += `M${a2[0].toFixed(1)} ${a2[1].toFixed(1)}L${b2[0].toFixed(1)} ${b2[1].toFixed(1)}`;
  }
  for (let z = gz0; z <= gz1; z++) {
    const a = P(gx0, 0, z);
    const b = P(gx1, 0, z);
    grid += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    const a2 = P(gx0, 0, z - 0.045);
    const b2 = P(gx1, 0, z - 0.045);
    gridHi += `M${a2[0].toFixed(1)} ${a2[1].toFixed(1)}L${b2[0].toFixed(1)} ${b2[1].toFixed(1)}`;
  }

  // ---------- ripple + trail tiles ----------
  const jit = React.useMemo(() => {
    const r = rng(seed * 7 + 3);
    return Array.from({length: 400}, () => 0.8 + r() * 0.4);
  }, [seed]);
  const g = 0.035;
  const tileTop = (i: number, j: number, y: number) => quad([i + g, y, j + g], [i + 1 - g, y, j + g], [i + 1 - g, y, j + 1 - g], [i + g, y, j + 1 - g]);
  const rippleBehind: React.ReactNode[] = [];
  const rippleFront: React.ReactNode[] = [];
  const flat: React.ReactNode[] = [];
  const ic = Math.floor(floorPos[0]);
  const jc = Math.floor(floorPos[2]);
  if (showCharacter && tl >= T.Lf && tl < T.Lf + 30) {
    const tt = (tl - T.Lf) / 30;
    const cells: {i: number; j: number; lift: number; d: number}[] = [];
    for (let i = ic - 6; i <= ic + 6; i++) {
      for (let j = jc - 6; j <= jc + 6; j++) {
        if (i >= 0 && i < N && j === 0) continue;
        const d = Math.hypot(i - ic, j - jc);
        if (d > 5.5) continue;
        const A = 0.25 * jit[((i * 31 + j * 17) % 400 + 400) % 400];
        const lift = A * Math.exp(-Math.pow((d - 6 * tt) / 0.8, 2)) * (1 - ease.in(clamp(tt / 0.85)));
        if (lift > 0.004) cells.push({i, j, lift, d});
      }
    }
    cells.sort((a, b) => a.i - a.j - (b.i - b.j));
    for (const c of cells) {
      const {i, j, lift} = c;
      const tint = mixHex(floorColor, trailTint, clamp(lift / 0.18));
      const el = (
        <g key={`r${i},${j}`}>
          <polygon points={quad([i + g, 0, j + g], [i + 1 - g, 0, j + g], [i + 1 - g, lift, j + g], [i + g, lift, j + g])} fill={shade(tint, -0.1)} />
          <polygon points={quad([i + 1 - g, 0, j + g], [i + 1 - g, 0, j + 1 - g], [i + 1 - g, lift, j + 1 - g], [i + 1 - g, lift, j + g])} fill={shade(tint, -0.05)} />
          <polygon points={tileTop(i, j, lift)} fill={tint} />
        </g>
      );
      if (j >= 0 && i < N) rippleBehind.push(el);
      else rippleFront.push(el);
    }
  }
  if (showCharacter && loop && tl >= T.rollA) {
    for (let i = -1; i <= N; i++) {
      const xi = i + 0.5;
      if (rollX(tl) > xi + 0.2) continue;
      // time the ball passed this tile
      let tp = T.rollA;
      for (let s = T.rollA; s <= T.rollB; s++) if (rollX(s) <= xi) {
        tp = s;
        break;
      }
      const a = clamp(1 - (tl - tp) / 90);
      if (a > 0) flat.push(<polygon key={`t${i}`} points={tileTop(i, -1, 0.002)} fill={trailTint} opacity={a * 0.85} />);
    }
  }
  if (loop) flat.push(<polygon key="foot" points={tileTop(-1, -1, 0.002)} fill={mixHex(floorColor, pillarColor, 0.55)} />);

  // ---------- bars ----------
  const t = tl;
  const ball = showCharacter && (loop || t >= -18) ? ballAt(t) : undefined;
  const barEls: React.ReactNode[] = [];
  const segLines = (i: number, hh: number, top: number) => {
    let d = '';
    for (let y = 0.5; y < top - 0.05; y += 0.5) {
      const a = P(i, y, 0);
      const b = P(i + 1, y, 0);
      const c = P(i + 1, y, 1);
      d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
    }
    return d;
  };
  const ins = 0.1;
  const dep = 0.14;
  for (let i = 0; i < N; i++) {
    const hh = H[i] * introH(i);
    if (hh < 0.01) continue;
    const cs = capState(i, t);
    const capH = Math.min(0.42, hh * 0.6);
    const capVis = cs.o > 0.001;
    barEls.push(
      <g key={`b${i}`}>
        <polygon points={quad([i, 0, 0], [i + 1, 0, 0], [i + 1, hh, 0], [i, hh, 0])} fill="url(#iso-front)" />
        <polygon points={quad([i + 1, 0, 0], [i + 1, 0, 1], [i + 1, hh, 1], [i + 1, hh, 0])} fill="url(#iso-right)" />
        <path d={segLines(i, hh, capVis ? hh - capH : hh)} fill="none" stroke={barFrontLow} strokeOpacity={0.45} strokeWidth={Math.max(0.6, 0.011 * C)} />
        {/* recessed tray */}
        <polygon points={quad([i + ins, hh - dep, ins], [i + 1 - ins, hh - dep, ins], [i + 1 - ins, hh - dep, 1 - ins], [i + ins, hh - dep, 1 - ins])} fill={shade(tray, -0.03)} />
        <polygon points={quad([i + ins, hh, 1 - ins], [i + 1 - ins, hh, 1 - ins], [i + 1 - ins, hh - dep, 1 - ins], [i + ins, hh - dep, 1 - ins])} fill={shade(barColor, 0.05)} />
        <polygon points={quad([i + ins, hh, ins], [i + ins, hh, 1 - ins], [i + ins, hh - dep, 1 - ins], [i + ins, hh - dep, ins])} fill={shade(barColor, 0.3)} />
        <path
          d={`${pth([P(i, hh, 0), P(i + 1, hh, 0), P(i + 1, hh, 1), P(i, hh, 1)])}${pth([P(i + ins, hh, ins), P(i + 1 - ins, hh, ins), P(i + 1 - ins, hh, 1 - ins), P(i + ins, hh, 1 - ins)])}`}
          fill={tray}
          fillRule="evenodd"
        />
        {capVis && (
          <g opacity={cs.o}>
            <polygon points={quad([i, hh - capH, 0], [i + 1, hh - capH, 0], [i + 1, hh, 0], [i, hh, 0])} fill={mixHex(ghostSide, capFront, cs.m)} />
            <polygon points={quad([i + 1, hh - capH, 0], [i + 1, hh - capH, 1], [i + 1, hh, 1], [i + 1, hh, 0])} fill={mixHex(ghostSide, capRight, cs.m)} />
            <polygon points={quad([i, hh, 0], [i + 1, hh, 0], [i + 1, hh, 1], [i, hh, 1])} fill={mixHex(ghost, capTop, cs.m)} />
          </g>
        )}
      </g>,
    );
  }

  // ---------- pillar ----------
  const ph = pillarH(t);
  const pillarCap = (() => {
    if (!loop) return {o: 0, m: 0};
    if (t >= T.pillarCap) return {o: clamp((t - T.pillarCap + 1) / 3) * 0.65 + 0.35, m: 1 - Math.pow(1 - clamp((t - T.pillarCap + 1) / 3), 2)};
    if (t < 15) return {o: 1 - clamp((t - 8) / 7), m: 1 - clamp(t / 10)};
    return {o: 0, m: 0};
  })();
  const pillar =
    ph > 0.005 ? (
      <g key="pillar">
        <polygon points={quad([-1, 0, -1], [0, 0, -1], [0, ph, -1], [-1, ph, -1])} fill={pFront} />
        <polygon points={quad([0, 0, -1], [0, 0, 0], [0, ph, 0], [0, ph, -1])} fill={pRight} />
        <polygon points={quad([-1, ph, -1], [0, ph, -1], [0, ph, 0], [-1, ph, 0])} fill={pTop} />
        {pillarCap.o > 0 && (
          <g opacity={pillarCap.o}>
            <polygon points={quad([-1, ph - Math.min(0.42, ph), -1], [0, ph - Math.min(0.42, ph), -1], [0, ph, -1], [-1, ph, -1])} fill={mixHex(ghostSide, capFront, pillarCap.m)} />
            <polygon points={quad([0, ph - Math.min(0.42, ph), -1], [0, ph - Math.min(0.42, ph), 0], [0, ph, 0], [0, ph, -1])} fill={mixHex(ghostSide, capRight, pillarCap.m)} />
            <polygon points={quad([-1, ph, -1], [0, ph, -1], [0, ph, 0], [-1, ph, 0])} fill={mixHex(ghost, capTop, pillarCap.m)} />
          </g>
        )}
      </g>
    ) : null;

  // ---------- ball ----------
  let ballEl: React.ReactNode = null;
  let ballAfter = N - 1;
  const confetti: React.ReactNode[] = [];
  if (ball) {
    const [bx, by, bz] = ball.p;
    // squash from the latest landing
    let sy = 1;
    let eyesHidden = false;
    let lastL = -999;
    let hard = false;
    for (const L of landings) if (L <= t && L > lastL) lastL = L;
    if (loop && t < 6 && lastL < 0) lastL = 0;
    const pf = t - lastL;
    if (lastL === T.Lf) hard = true;
    if (pf >= 0 && pf < 7 && !(lastL === T.riseB)) {
      const k0 = hard ? 0.5 : 0.7;
      sy = pf < 1 ? k0 : pf < 3 ? lerp(k0, 1.12, (pf - 1) / 2) : lerp(1.12, 1, clamp((pf - 3) / 3));
      eyesHidden = hard && pf < 3;
    } else if (lastL === T.riseB && pf < 8) {
      sy = pf < 2 ? 0.86 : lerp(0.86, 1, clamp((pf - 2) / 5));
    }
    if (loop && t >= T.riseB && t < Tc - B) sy *= 1 + 0.035 * Math.sin(((t - T.riseB) / 37) * Math.PI * 2);
    if (ended) sy *= 1 + 0.03 * Math.sin(frame * 0.12);
    // pre-landing stretch while falling fast
    for (const hp of hops) {
      if (t >= hp.t0 && t < hp.t1) {
        const p = (t - hp.t0) / (hp.t1 - hp.t0);
        if (p > 0.7) sy = Math.max(sy, 1 + 0.1 * clamp((p - 0.7) / 0.25));
      }
    }
    const sx = 1 / Math.sqrt(sy);
    const r = R_BALL * C;
    const ground = P(bx, by - ball.air, bz);
    const contact = P(bx, by, bz);
    const cyB = contact[1] - r * sy;
    const hfrac = clamp(ball.air / 1.2);
    const roll = ball.roll;
    const face = Math.cos(roll);
    const eyeShift = -Math.sin(roll) * 0.45 * r;
    // blink while idle on pillar / on the floor at the end
    const blink = (loop && t > T.riseB + 20 && t < Tc - B && Math.abs(((t - T.riseB) % 45) - 30) < 2) || (ended && frame % 70 < 3);
    const eyeVis = !eyesHidden && face > 0.25;
    ballAfter = bz >= -0.2 ? Math.min(N - 1, Math.max(0, Math.floor(bx + 0.3))) : N + 1;
    ballEl = (
      <g key="ball">
        <ellipse cx={ground[0]} cy={ground[1]} rx={r * (1.05 - 0.45 * hfrac)} ry={r * 0.36 * (1.05 - 0.45 * hfrac)} fill="#7A6450" opacity={0.22 * (1 - hfrac * 0.6)} />
        <ellipse cx={contact[0]} cy={cyB} rx={r * sx} ry={r * sy} fill="url(#iso-ball)" />
        <ellipse cx={contact[0] - r * 0.34 * sx} cy={cyB - r * 0.4 * sy} rx={r * 0.17} ry={r * 0.12} fill="#fff" opacity={0.9} />
        {eyeVis &&
          [-1, 1].map((s) => (
            <g key={s}>
              <ellipse cx={contact[0] + (s * 0.22 * r + eyeShift) * sx} cy={cyB + 0.1 * r * sy} rx={0.085 * r * sx * Math.max(0.3, face)} ry={0.155 * r * sy * (blink ? 0.12 : 1)} fill="#160A00" />
              {!blink && <circle cx={contact[0] + (s * 0.22 * r + eyeShift - 0.03 * r) * sx} cy={cyB + 0.04 * r * sy} r={0.03 * r} fill="#fff" opacity={0.8} />}
            </g>
          ))}
      </g>
    );
    // impact confetti
    landings.forEach((L, li) => {
      const age = t - L;
      if (age < 0 || age > 14) return;
      if (L === T.riseB) return;
      const isFloor = L === T.Lf;
      const pos = L === 0 ? plan.top(0) : L === T.Lf ? floorPos : hops.find((x) => x.t1 === L)?.b;
      if (!pos) return;
      const o = P(pos[0], pos[1], pos[2]);
      const r2 = rng(seed * 101 + li * 13);
      const n = isFloor ? 14 : 4 + Math.floor(r2() * 3);
      const k = C / 103;
      for (let q = 0; q < n; q++) {
        const life = 8 + r2() * 4 * (isFloor ? 1.5 : 1);
        const vx = (r2() < 0.5 ? -1 : 1) * (60 + r2() * 80) * k * (isFloor ? 1.6 : 1);
        const vy = -(80 + r2() * 110) * k * (isFloor ? 1.4 : 1);
        const size = (5 + r2() * 4) * k * (isFloor ? 1.2 : 1);
        const spin = (r2() - 0.5) * 900;
        const col = r2() < 0.55 ? accent : ghost;
        if (age > life) continue;
        const s = age / 30;
        const x = o[0] + vx * s;
        const y = o[1] - 4 * k + vy * s + 0.5 * 300 * k * s * s;
        const fade = 1 - clamp((age / life - 0.6) / 0.4);
        confetti.push(<rect key={`c${li}-${q}`} x={x - size / 2} y={y - size / 2} width={size} height={size} fill={col} opacity={fade} transform={`rotate(${spin * s},${x},${y})`} />);
      }
    });
  }

  const ordered: React.ReactNode[] = [];
  barEls.forEach((el, i) => {
    ordered.push(el);
    if (ball && i === ballAfter) ordered.push(ballEl);
  });

  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 80% at 72% 22%, ${shade(background, 0.35)} 0%, ${background} 55%, ${shade(background, -0.07)} 100%)`}} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="iso-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={barFront} />
            <stop offset="100%" stopColor={barFrontLow} />
          </linearGradient>
          <linearGradient id="iso-right" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={barRight} />
            <stop offset="100%" stopColor={barRightLow} />
          </linearGradient>
          <radialGradient id="iso-ball" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F9F4EE" />
            <stop offset="100%" stopColor="#CFC7BD" />
          </radialGradient>
          <radialGradient id="iso-fog" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="70%" stopColor="#fff" stopOpacity={0.75} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0.3} />
          </radialGradient>
          <mask id="iso-floor-mask">
            <rect width={w} height={h} fill="url(#iso-fog)" />
          </mask>
        </defs>
        <g mask="url(#iso-floor-mask)">
          <path d={gridHi} stroke={shade(floorColor, 0.5)} strokeWidth={Math.max(0.6, 0.022 * C)} fill="none" opacity={0.7} />
          <path d={grid} stroke={groove} strokeWidth={Math.max(0.8, 0.055 * C)} fill="none" />
        </g>
        {flat}
        {rippleBehind}
        {pillar}
        {ordered}
        {rippleFront}
        {ball && ballAfter > N - 1 && ballEl}
        {confetti}
      </svg>
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 70% 25%, rgba(0,0,0,0) 45%, rgba(90,70,50,0.16) 100%)'}} />
    </AbsoluteFill>
  );
};

export const isoBarChart = defineMotion<Props>({
  id: 'iso-bar-chart',
  title: 'Isometric bar-chart staircase',
  category: 'data',
  description: 'Data-driven clay-isometric bar chart on a tiled floor; a white eyed blob hops down it on the beat painting each cap orange (squash, confetti), the paint cascades, the floor ripples, and it rides a pillar back up — a seamless loop.',
  source: ['video7 0:00-16:04 (iso-bar-staircase, hop-and-paint, squash-stretch-blob, impact-confetti, paint-cascade, floor-tile-ripple, roll-with-trail, pillar-rise-sink, follow-cam-diagonal)'],
  useFor: 'Metric stories (declines, rankings, progress through steps) as a friendly looping hero animation.',
  durationInFrames: 480,
  defaultProps: {
    values: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    beatFrames: 15,
    showCharacter: true,
    loop: true,
    maxHeight: 8,
    zoom: 1,
    hopHeight: 0.6,
    accent: '#E48E6D',
    ghost: '#F7DAC9',
    barColor: '#E7E0D5',
    floorColor: '#ECE4D8',
    background: '#E9E1D6',
    pillarColor: '#E5BDA6',
    seed: 7,
  },
  propDocs: {
    values: 'bar heights (any series; loop length = (N-2)*beat + 270 f for N>=6)',
    beatFrames: 'frames per hop (15 = 0.5 s)',
    showCharacter: 'show the hopping blob (off: caps paint on the same beat)',
    loop: 'true = seamless loop with return trip; false = bars rise in, blob drops, descends and settles on the floor',
    maxHeight: 'height of the tallest bar in cells',
    zoom: 'close-up camera scale multiplier',
    hopHeight: 'hop arc height in cells',
    accent: 'painted cap colour',
    ghost: 'cap colour as it materialises',
    barColor: 'bar body colour',
    floorColor: 'floor tile colour',
    background: 'backdrop colour behind the floor',
    pillarColor: 'lift pillar colour',
    seed: 'confetti / ripple jitter seed',
  },
  component: IsoBarChart,
  tags: ['chart', 'isometric', 'bar chart', 'loop', 'character', 'data'],
});
