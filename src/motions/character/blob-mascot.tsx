import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Blob, SoftShadow, mixHex} from '../../core/character-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video7 "Downhill": a white eyed sphere hops down an isometric bar-chart staircase, squashing on every
 * landing and painting each bar's cap; it hits the floor with a hard squash + tile ripple, then rolls back
 * along the base (eyes coming round every revolution) leaving a peach trail that fades over ~3 s.
 */
type Props = {
  background: string;
  floorColor: string;
  barColor: string;
  accent: string;
  trailColor: string;
  bodyColor: string;
  steps: number;
  hopFrames: number;
  rollFrames: number;
  trailFade: number;
  squash: number;
  followCam: boolean;
};

type Pt = [number, number];

const BlobMascot: React.FC<Props> = ({background, floorColor, barColor, accent, trailColor, bodyColor, steps, hopFrames, rollFrames, trailFade, squash, followCam}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const c = (portrait ? 165 : 155) * u;
  const r = 0.32 * c;
  const N = Math.max(2, Math.round(steps));
  const heights = Array.from({length: N}, (_, k) => 0.9 * (N - k) + 0.3);
  const capH = 0.22;
  const iso = (gx: number, gy: number, gz: number): Pt => [(gx - gy) * c * 0.866, (gx + gy) * c * 0.5 - gz * c];

  // ---------------- timeline
  const start = 14;
  // hops accelerate toward the bottom (v7: speeds up near the end)
  const hopLen = (k: number) => Math.max(9, Math.round(hopFrames * (1 - 0.32 * (k / Math.max(1, N - 1)))));
  const lands: number[] = [];
  let t = start;
  for (let k = 1; k < N; k++) {
    t += hopLen(k);
    lands.push(t);
  }
  const floorHop = Math.round(hopFrames * 1.15);
  const floorLand = t + floorHop;
  const rollStart = floorLand + 16;
  const rollEnd = rollStart + rollFrames;
  const floorPos: [number, number] = [N + 0.7, 1.15];
  const rollTo: [number, number] = [-1.8, 1.15];

  type BlobState = {gx: number; gy: number; gz: number; sx: number; sy: number; roll: number; eyes: number; look: number};
  const topZ = (k: number) => heights[k] + capH;
  const sqAt = (pf: number, hard: boolean) => {
    // landing squash -> takeoff stretch -> neutral (v7 table), volume preserving
    const s0 = hard ? 1 - squash * 1.6 : 1 - squash;
    const sy = interpolate(pf, [0, 2, 5, 8, 12], [s0, s0, 1.12, 1, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return {sx: 1 / Math.sqrt(sy), sy};
  };
  const stateAt = (f: number): BlobState => {
    const base: BlobState = {gx: 0.5, gy: 0, gz: topZ(0), sx: 1, sy: 1, roll: 0, eyes: 1, look: 0.3};
    if (f < start) {
      base.sy = 1 + 0.02 * Math.sin(f * 0.5);
      return base;
    }
    // stair hops
    let prevLand = start;
    for (let k = 1; k < N; k++) {
      const L = lands[k - 1];
      if (f < L) {
        const dur = L - prevLand;
        const pf = f - prevLand;
        const take = 4;
        if (pf < take) {
          const s = sqAt(k === 1 ? 6 + pf : pf, false);
          return {...base, gx: k - 0.5, gz: topZ(k - 1), sx: s.sx, sy: k === 1 ? 1 - 0.12 * (pf / take) : s.sy};
        }
        const q = (f - prevLand - take) / (dur - take);
        const z0 = topZ(k - 1);
        const z1 = topZ(k);
        const apex = 0.55;
        const gz = z0 + (z1 - z0) * q + apex * 4 * q * (1 - q);
        const st = q < 0.35 ? 1.12 - 0.12 * (q / 0.35) : 1 + 0.08 * clamp((q - 0.75) / 0.25);
        return {...base, gx: k - 0.5 + q, gz, sx: 1 / Math.sqrt(st), sy: st};
      }
      prevLand = L;
    }
    // hop to the floor
    if (f < floorLand) {
      const pf = f - prevLand;
      const take = 4;
      if (pf < take) {
        const s = sqAt(pf, false);
        return {...base, gx: N - 0.5, gz: topZ(N - 1), sx: s.sx, sy: s.sy};
      }
      const q = (pf - take) / (floorHop - take);
      const z0 = topZ(N - 1);
      const gz = z0 * (1 - q) + 0.7 * 4 * q * (1 - q);
      const st = q < 0.3 ? 1.12 - 0.12 * (q / 0.3) : 1 + 0.12 * clamp((q - 0.7) / 0.3);
      return {...base, gx: N - 0.5 + (floorPos[0] - (N - 0.5)) * q, gy: floorPos[1] * q, gz, sx: 1 / Math.sqrt(st), sy: st};
    }
    // floor landing (hard squash, eyes hidden 5 f)
    if (f < rollStart) {
      const pf = f - floorLand;
      const s = sqAt(Math.min(pf, 1) + Math.max(0, pf - 4) * 0.8, true);
      return {...base, gx: floorPos[0], gy: floorPos[1], gz: 0, sx: s.sx, sy: s.sy, eyes: pf < 5 ? 0 : 1, look: -0.4};
    }
    // roll back along the base
    if (f < rollEnd) {
      const q = prog(f, rollStart, rollEnd, ease.inOut);
      const gx = floorPos[0] + (rollTo[0] - floorPos[0]) * q;
      const dist = Math.abs(gx - floorPos[0]) * c;
      return {...base, gx, gy: floorPos[1], gz: 0, roll: -dist / r, look: 0};
    }
    // happy hops at rest
    const pf = f - rollEnd;
    const totalRoll = (Math.abs(rollTo[0] - floorPos[0]) * c) / r;
    const settle = -totalRoll + Math.round(totalRoll / (Math.PI * 2)) * Math.PI * 2;
    const rr = settle * (1 - prog(pf, 0, 10, ease.out));
    const hopP = 16;
    const k = Math.floor((pf - 14) / hopP);
    if (pf >= 14 && k < 2) {
      const lp = (pf - 14) % hopP;
      const q = lp / hopP;
      const gz = 0.35 * 4 * q * (1 - q);
      const s = q < 0.15 ? 1 - squash * 0.6 : q > 0.9 ? 1 - squash * 0.4 : 1 + 0.06 * Math.sin(Math.PI * q);
      return {...base, gx: rollTo[0], gy: rollTo[1], gz, sx: 1 / Math.sqrt(s), sy: s, roll: 0, look: 0};
    }
    const blink = pf > 50 && pf < 54;
    return {...base, gx: rollTo[0], gy: rollTo[1], gz: 0, roll: rr, eyes: blink ? 0.1 : 1, look: 0, sy: 1 + 0.015 * Math.sin(pf * 0.3)};
  };

  const s = stateAt(frame);
  // ---------------- follow cam: centred moving average of the blob position (v7 follow-cam-diagonal)
  const camAt = (f: number): Pt => {
    let ax = 0;
    let ay = 0;
    let n = 0;
    for (let k = -18; k <= 18; k += 3) {
      const st = stateAt(Math.max(0, f + k));
      const p = iso(st.gx, st.gy, st.gz * 0.85);
      ax += p[0];
      ay += p[1];
      n++;
    }
    return [ax / n, ay / n];
  };
  const cam = followCam ? camAt(frame) : iso(N / 2, 0.5, 1);
  const ox = w / 2 - cam[0];
  const oy = h * (portrait ? 0.5 : 0.52) - cam[1];
  const P = (gx: number, gy: number, gz: number): Pt => {
    const p = iso(gx, gy, gz);
    return [p[0] + ox, p[1] + oy];
  };
  const poly = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  // ---------------- floor tiles with trail + ripple
  const tiles: React.ReactNode[] = [];
  const span = portrait ? 11 : 9;
  const cx0 = Math.round(cam[0] / (c * 0.866) / 2);
  const rippleT = frame - floorLand;
  for (let gx = -span + cx0 - 8; gx <= span + cx0 + 10; gx++) {
    for (let gy = -span - 10; gy <= span; gy++) {
      const ctr = P(gx + 0.5, gy + 0.5, 0);
      if (ctr[0] < -c * 1.2 || ctr[0] > w + c * 1.2 || ctr[1] < -c || ctr[1] > h + c) continue;
      if (gy === 0 && gx >= 0 && gx < N) continue; // under the bars
      let tint = 0;
      // trail: tiles touched while rolling stay peach then fade
      if (gy === Math.floor(floorPos[1]) && frame >= rollStart) {
        const tileX = gx + 0.5;
        const qTouch = (tileX - floorPos[0]) / (rollTo[0] - floorPos[0]);
        if (qTouch >= -0.05 && qTouch <= 1.02) {
          // invert ease.inOut approximately by sampling
          let touchF = -1;
          for (let f2 = rollStart; f2 <= rollEnd; f2 += 2) {
            if (prog(f2, rollStart, rollEnd, ease.inOut) >= qTouch) {
              touchF = f2;
              break;
            }
          }
          if (touchF >= 0 && frame >= touchF) tint = clamp(1 - (frame - touchF) / trailFade) * clamp((frame - touchF) / 3);
        }
      }
      let lift = 0;
      if (rippleT >= 0 && rippleT < 40) {
        const d = Math.hypot(gx + 0.5 - floorPos[0], gy + 0.5 - floorPos[1]);
        const front = rippleT * 0.22;
        lift = 0.05 * Math.exp(-((d - front) ** 2) / 0.5) * (1 - rippleT / 40);
        if (d < 0.8 && rippleT < 12) tint = Math.max(tint, 0.6 * (1 - rippleT / 12));
      }
      const g = 0.04;
      const pts = [P(gx + g, gy + g, lift), P(gx + 1 - g, gy + g, lift), P(gx + 1 - g, gy + 1 - g, lift), P(gx + g, gy + 1 - g, lift)];
      tiles.push(<polygon key={`${gx}_${gy}`} points={poly(pts)} fill={tint > 0 ? mixHex(floorColor, trailColor, tint) : floorColor} />);
    }
  }

  // ---------------- bars + caps
  const paintOn = (k: number) => (k === 0 ? 0 : lands[k - 1]);
  const bars = heights.map((hz, k) => {
    const x0 = k;
    const x1 = k + 1;
    const y0 = -0.5;
    const y1 = 0.5;
    const pOn = prog(frame, paintOn(k), paintOn(k) + 5, ease.out);
    const unpaint = prog(frame, rollStart + 10 + (N - 1 - k) * 7, rollStart + 16 + (N - 1 - k) * 7, ease.in);
    const paint = k === 0 ? 1 - unpaint : pOn * (1 - unpaint);
    const capColor = (f: string) => mixHex('#F7DAC9', f, paint);
    const face = (a: Pt[], fill: string, key: string) => <polygon key={key} points={poly(a)} fill={fill} />;
    const top = hz + capH * paint;
    const segLines = Array.from({length: Math.floor(hz / 0.3)}, (_, i) => {
      const z = (i + 1) * 0.3;
      if (z >= hz - 0.05) return null;
      const a = P(x1, y0, z);
      const b = P(x1, y1, z);
      const d = P(x0, y1, z);
      return (
        <g key={i} opacity={0.5}>
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#C2BAAF" strokeWidth={1 * u} />
          <line x1={b[0]} y1={b[1]} x2={d[0]} y2={d[1]} stroke="#C2BAAF" strokeWidth={1 * u} />
        </g>
      );
    });
    return (
      <g key={k}>
        {face([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, hz), P(x0, y1, hz)], mixHex(barColor, '#000000', 0.03), 'l')}
        {face([P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, hz), P(x1, y0, hz)], mixHex(barColor, '#000000', 0.08), 'r')}
        {segLines}
        {face([P(x0, y0, hz), P(x1, y0, hz), P(x1, y1, hz), P(x0, y1, hz)], '#F9F5EF', 't')}
        {paint > 0.01 && (
          <g opacity={clamp(paint * 1.5)}>
            {face([P(x0 + 0.04, y1 - 0.04, hz), P(x1 - 0.04, y1 - 0.04, hz), P(x1 - 0.04, y1 - 0.04, top), P(x0 + 0.04, y1 - 0.04, top)], capColor('#D27557'), 'cl')}
            {face([P(x1 - 0.04, y0 + 0.04, hz), P(x1 - 0.04, y1 - 0.04, hz), P(x1 - 0.04, y1 - 0.04, top), P(x1 - 0.04, y0 + 0.04, top)], capColor('#BA6142'), 'cr')}
            {face([P(x0 + 0.04, y0 + 0.04, top), P(x1 - 0.04, y0 + 0.04, top), P(x1 - 0.04, y1 - 0.04, top), P(x0 + 0.04, y1 - 0.04, top)], capColor(accent), 'ct')}
          </g>
        )}
      </g>
    );
  });

  // ---------------- impact bits (v7 impact-confetti)
  const impacts = [...lands, floorLand];
  const bits: React.ReactNode[] = [];
  impacts.forEach((L, i) => {
    const lt = frame - L;
    if (lt < 0 || lt > 16) return;
    const st = stateAt(L);
    const rr = rng(i * 37 + 3);
    const n = i === impacts.length - 1 ? 9 : 5;
    for (let j = 0; j < n; j++) {
      const a = rr() * Math.PI * 2;
      const sp = (0.025 + rr() * 0.03) * (i === impacts.length - 1 ? 1.4 : 1);
      const gx = st.gx + Math.cos(a) * sp * lt;
      const gy = st.gy + Math.sin(a) * sp * lt;
      const gz = st.gz + 0.09 * lt - 0.008 * lt * lt;
      const p = P(gx, gy, Math.max(st.gz, gz));
      const sz = (5 + rr() * 5) * u;
      bits.push(<rect key={`${i}-${j}`} x={p[0] - sz / 2} y={p[1] - sz / 2} width={sz} height={sz} fill={j % 2 ? accent : '#F7DAC9'} opacity={1 - lt / 16} transform={`rotate(${lt * 20 + j * 40} ${p[0]} ${p[1]})`} />);
    }
  });

  const bp = P(s.gx, s.gy, s.gz);
  // shadow sits on whatever surface is under the blob
  const surf = Math.abs(s.gy) < 0.5 && s.gx >= -0.05 && s.gx < N ? topZ(clamp(Math.floor(s.gx + 0.05), 0, N - 1)) : 0;
  const sp = P(s.gx, s.gy, Math.min(surf, s.gz));
  const air = Math.max(0, s.gz - surf);
  const shK = 1 / (1 + air * 1.2);
  const bgGrad = `radial-gradient(ellipse at 62% 35%, ${mixHex(background, '#FFFFFF', 0.25)} 0%, ${background} 55%, ${mixHex(background, '#8C7F70', 0.25)} 100%)`;
  return (
    <AbsoluteFill style={{background: bgGrad}}>
      <Svg>
        <g>
          {(() => {
            // grooves = background colour showing between tiles
            const a = P(-40, -40, 0);
            const b = P(40, -40, 0);
            const cc = P(40, 40, 0);
            const d = P(-40, 40, 0);
            return <polygon points={poly([a, b, cc, d])} fill="#CEC5B7" />;
          })()}
          {tiles}
        </g>
        {bars}
        <SoftShadow id="blob-sh" x={sp[0] + r * 0.15} y={sp[1] + r * 0.05} rx={r * 1.1 * shK} ry={r * 0.55 * shK} color="#6E5A48" opacity={0.45 * shK} />
        {bits}
        <Blob id="blob-hero" x={bp[0]} y={bp[1] + r * 0.12} r={r} sx={s.sx} sy={s.sy} roll={s.roll} eyesOpen={s.eyes} look={s.look} body={bodyColor} />
      </Svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0) 50%, rgba(120,100,80,0.18) 100%)'}} />
    </AbsoluteFill>
  );
};

export const blobMascot = defineMotion<Props>({
  id: 'blob-mascot',
  title: 'Blob mascot hop & roll',
  category: 'character',
  description: 'White eyed sphere hops down an isometric bar staircase with squash/stretch, painting each cap, lands with a tile ripple, then rolls back with its eyes coming round, leaving a fading peach trail.',
  source: ['video7 0:00-0:16 squash-stretch-blob, roll-with-trail, hop-and-paint, floor-tile-ripple, impact-confetti, follow-cam-diagonal'],
  useFor: 'Declining-metric metaphors, playful loaders, step-by-step progress where a tiny character visits each step.',
  durationInFrames: 240,
  defaultProps: {
    background: '#EFE8DE',
    floorColor: '#ECE4D8',
    barColor: '#CEC6BB',
    accent: '#E48E6D',
    trailColor: '#F0D6C4',
    bodyColor: '#F9F4EE',
    steps: 5,
    hopFrames: 18,
    rollFrames: 72,
    trailFade: 90,
    squash: 0.3,
    followCam: true,
  },
  propDocs: {
    steps: 'number of bars in the staircase',
    hopFrames: 'frames per hop at the top (hops speed up toward the bottom)',
    rollFrames: 'frames for the roll back along the floor',
    trailFade: 'frames for a trail tile to fade back',
    squash: 'landing squash amount (sy = 1 - squash; floor landing is 1.6x)',
    accent: 'cap paint colour',
    trailColor: 'roll trail tint',
    followCam: 'camera follows the blob diagonally',
  },
  component: BlobMascot,
  tags: ['mascot', 'squash', 'stretch', 'isometric', 'roll', 'bounce'],
});
