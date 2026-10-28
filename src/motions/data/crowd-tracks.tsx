// Adapted from lemo-opuscar/styles/city-symphony/demo/tools/render.py class Trails (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {CS, CsFinish, TAU, h01, la2Fonts, lockDigits, mixHex, seg, smooth, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * People as data: a locked-off concourse plate (procedural, or your `src` still) is seen clearly for a moment, then darkens
 * and desaturates while every walker turns into a glowing sodium-orange dot trailing a decaying polyline of where it just
 * was (alpha 0.9^age), and each dot links to its nearest neighbour within the link radius — a living network of footfall.
 * Nothing is stored between frames: each agent's last positions are recomputed analytically from seeds.
 */

type Props = {
  agents: number;
  color: string;
  decay: number;
  trail: number;
  linkRadius: number;
  speed: number;
  revealAt: number;
  number: string;
  caption: string;
  sub: string;
  src: string;
  seed: number;
};

type Agent = {x0: number; z0: number; xr: number; vx: number; vz: number; wob: number; ph: number; still: boolean};

const Z0 = 14;
const Z1 = 320;
const CAM_H = 12; // camera height (m)

/** agents are seeded in SCREEN space (so the frame fills evenly) and then walk in world space */
const makeAgents = (n: number, seed: number, W: number, F: number, cx: number): Agent[] =>
  Array.from({length: n}, (_, i) => {
    const r = (k: number) => h01(i, k, seed);
    const lane = r(1) < 0.78;
    const dir = lane ? (r(2) < 0.5 ? 0 : Math.PI) + (r(3) - 0.5) * 0.7 : r(3) * TAU;
    const sp = 0.9 + r(4) * 0.8;
    const still = r(5) < 0.08;
    // screen depth fraction: more people toward the back, like a real concourse seen from above
    const yf = 0.02 + Math.pow(r(6), 1.5) * 0.74;
    const z = 1 / (1 / Z1 + yf * (1 / Z0 - 1 / Z1));
    const xr = ((W / 2) * 1.15 * z) / F;
    return {x0: (r(7) * 2 - 1) * xr + ((cx - W / 2) * z) / F, z0: z, xr, vx: still ? 0 : Math.cos(dir) * sp, vz: still ? 0 : Math.sin(dir) * sp * 0.5, wob: 0.6 + r(8) * 1.6, ph: r(9) * TAU, still};
  });

const wrapR = (v: number, a: number, b: number) => a + ((((v - a) % (b - a)) + (b - a)) % (b - a));

const CrowdTracks: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, durationInFrames: D} = useStage();
  const id = useIdA('crowd');
  const horizonY = h * (portrait ? 0.4 : 0.3);
  const F = h * (portrait ? 0.62 : 0.95);
  const cx = w / 2;
  const agents = React.useMemo(() => makeAgents(Math.max(1, Math.round(p.agents)), p.seed, w, F, cx), [p.agents, p.seed, w, F, cx]);
  const proj = (X: number, Z: number) => [cx + (F * X) / Z, horizonY + (F * CAM_H) / Z] as const;
  const posAt = (a: Agent, f: number) => {
    const t = (f / fps) * p.speed;
    const X = a.x0 + a.vx * t + Math.sin(t * 0.35 * a.wob + a.ph) * a.wob;
    const Z = a.z0 + a.vz * t + Math.cos(t * 0.3 * a.wob + a.ph) * a.wob * 0.6;
    return [wrapR(X, -a.xr, a.xr), Math.min(Z1, Math.max(Z0, Z))] as const;
  };
  const kk = smooth(seg(frame, p.revealAt, p.revealAt + 14));
  const N = Math.max(2, Math.round(p.trail));

  // current screen points
  const cur = agents.map((a) => {
    const [X, Z] = posAt(a, frame);
    const [sx, sy] = proj(X, Z);
    return {sx, sy, Z, X};
  });

  // trails: decaying segments to where each walker just was
  const trails: React.ReactNode[] = [];
  const walkers: React.ReactNode[] = [];
  agents.forEach((a, i) => {
    let prev = cur[i];
    let d = '';
    const segs: {d: string; o: number}[] = [];
    for (let k = 1; k <= N; k++) {
      const [X, Z] = posAt(a, frame - k);
      if (Math.abs(X - prev.X) > a.xr) break;
      const [sx, sy] = proj(X, Z);
      d = `M${prev.sx.toFixed(1)} ${prev.sy.toFixed(1)}L${sx.toFixed(1)} ${sy.toFixed(1)}`;
      segs.push({d, o: Math.pow(p.decay, k)});
      prev = {sx, sy, Z, X};
    }
    const lw = Math.max(1, (2 * u * 26) / Math.max(26, cur[i].Z) + 0.6 * u);
    segs.forEach((s, k) => trails.push(<path key={`${i}-${k}`} d={s.d} stroke={p.color} strokeWidth={lw} opacity={s.o * 0.95} />));
    // the walker on the plate
    const c = cur[i];
    if (c.sx > -40 * u && c.sx < w + 40 * u && c.sy < h + 60 * u) {
      const ht = (F * 1.7) / c.Z;
      const bob = a.still ? 0 : Math.abs(Math.sin((frame / fps) * p.speed * 4 + a.ph)) * ht * 0.04;
      walkers.push(
        <g key={i} transform={`translate(${c.sx.toFixed(1)} ${(c.sy - bob).toFixed(1)})`}>
          <ellipse cx={0} cy={0} rx={ht * 0.22} ry={ht * 0.05} fill="#000" opacity={0.25} />
          <rect x={-ht * 0.11} y={-ht * 0.82} width={ht * 0.22} height={ht * 0.78} rx={ht * 0.09} fill={h01(i, 31, p.seed) < 0.5 ? '#2a2a2c' : '#3b3936'} />
          <circle cx={0} cy={-ht * 0.9} r={ht * 0.1} fill="#29282a" />
        </g>,
      );
    }
  });

  // links: each dot to its nearest neighbour within the link radius (the "constellation")
  const R = p.linkRadius * u;
  const links: React.ReactNode[] = [];
  for (let i = 0; i < cur.length; i++) {
    const a = cur[i];
    if (a.sx < -R || a.sx > w + R || a.sy > h + R) continue;
    let best = -1;
    let bd = R * R;
    for (let j = 0; j < cur.length; j++) {
      if (j === i) continue;
      const dx = cur[j].sx - a.sx;
      const dy = cur[j].sy - a.sy;
      const dd = dx * dx + dy * dy;
      if (dd < bd) {
        bd = dd;
        best = j;
      }
    }
    if (best >= 0) links.push(<line key={i} x1={a.sx} y1={a.sy} x2={cur[best].sx} y2={cur[best].sy} stroke={p.color} strokeWidth={Math.max(0.8, 1.1 * u)} opacity={0.45 * (1 - Math.sqrt(bd) / R) + 0.12} />);
  }
  const dots = cur.map((c, i) => <circle key={i} cx={c.sx} cy={c.sy} r={Math.max(1.6, (3 * u * 40) / Math.max(40, c.Z) + 0.8 * u)} fill={mixHex(p.color, '#fff3dd', 0.25)} />);

  // plate: concourse with a ribbed canopy, tiled floor (all world-space so it reads as one locked-off shot)
  const plate = (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7b7b79" />
          <stop offset="1" stopColor="#a9a8a4" />
        </linearGradient>
        <linearGradient id={`${id}fl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f8d89" />
          <stop offset="1" stopColor="#55534f" />
        </linearGradient>
      </defs>
      <rect width={w} height={horizonY} fill={`url(#${id}sky)`} />
      {Array.from({length: 41}, (_, i) => {
        const k = i / 40 - 0.5;
        return <line key={i} x1={cx + k * w * 0.12} y1={-h * 0.2} x2={cx + k * w * 3.2} y2={horizonY} stroke="#5f5e5b" strokeWidth={(i % 5 === 0 ? 4 : 1.6) * u} opacity={0.55} />;
      })}
      <rect y={horizonY} width={w} height={h - horizonY} fill={`url(#${id}fl)`} />
      {Array.from({length: 22}, (_, i) => {
        const X = -300 + (i * 600) / 21;
        const [ax, ay] = proj(X, Z1 * 1.4);
        const [bx, by] = proj(X, 12);
        return <line key={`x${i}`} x1={ax} y1={ay} x2={bx} y2={by} stroke="#6a6864" strokeWidth={1.2 * u} opacity={0.5} />;
      })}
      {Array.from({length: 18}, (_, i) => {
        const Z = 20 + Math.pow(i / 17, 1.6) * Z1 * 1.3;
        const [, y] = proj(0, Z);
        return <line key={`z${i}`} x1={0} y1={y} x2={w} y2={y} stroke="#6a6864" strokeWidth={1.2 * u} opacity={0.45} />;
      })}
    </svg>
  );

  // counter (lock digits) + captions, left-aligned over a soft darkening
  const t0 = p.revealAt + 30;
  const L = lockDigits(p.number, frame, t0 + 3, 3.75, p.seed);
  const tA = smooth(seg(frame, t0, t0 + 6)) * (1 - smooth(seg(frame, D - 12, D - 1)));
  const tx = w * (portrait ? 0.08 : 0.092);
  const ty = h * (portrait ? 0.8 : 0.74);
  const fs = Math.min((portrait ? 96 : 84) * u, (w * 0.84) / Math.max(4, p.number.length) / 0.95);
  const ruleW = Math.min(w * 0.6, fs * 0.9 * p.number.length) * smooth(seg(frame, t0 + 6, t0 + 33));

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: `saturate(${1 - 0.85 * kk}) brightness(${1 - 0.62 * kk})`}}>
        {p.src ? <Img src={resolveSrc(p.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} /> : plate}
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          {walkers}
        </svg>
      </AbsoluteFill>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: kk}}>
        <defs>
          <filter id={`${id}gl`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={3 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#${id}gl)`} fill="none" strokeLinecap="round">
          {links}
          {trails}
          {dots}
        </g>
      </svg>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: tA}}>
        <defs>
          <radialGradient id={`${id}sh`}>
            <stop offset="0" stopColor="#000" stopOpacity={0.6} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={tx + w * 0.2} cy={ty} rx={w * 0.38} ry={h * 0.17} fill={`url(#${id}sh)`} />
        <text x={tx} y={ty} fontFamily={la2Fonts.michroma} fontSize={fs} fill={CS.ink} letterSpacing={fs * 0.06}>
          {L.text}
        </text>
        <rect x={tx + 4 * u} y={ty + 22 * u} width={ruleW} height={2 * u} fill={p.color} />
        <text x={tx + 4 * u} y={ty + 64 * u} fontFamily={la2Fonts.michroma} fontSize={24 * u} fill={CS.ink} letterSpacing={24 * u * 0.12}>
          {p.caption}
        </text>
        <text x={tx + 4 * u} y={ty + 98 * u} fontFamily={la2Fonts.michroma} fontSize={15 * u} fill={CS.dim} letterSpacing={15 * u * 0.32}>
          {p.sub}
        </text>
      </svg>
      <CsFinish w={w} h={h} frame={frame} id={id + 'f'} grain={0.13} vignette={0.5} />
    </AbsoluteFill>
  );
};

export const crowdTracks = defineMotion<Props>({
  id: 'crowd-tracks',
  title: 'Crowd tracks',
  category: 'data',
  description:
    'A locked-off concourse plate darkens and desaturates while every walker becomes a glowing sodium-orange dot trailing a decaying polyline of where it just was, linked to its nearest neighbour — people as data — with a lock-digit footfall count.',
  source: ['lemo-opuscar styles/city-symphony (MIT, LemoLab) — render.py Trails, lock_digits; poster docs/frames/city-symphony.jpg'],
  useFor: 'Footfall / mobility / network-activity explainers, smart-city and retail-analytics films, "everyone is connected" beats; drop a crowd still into `src`.',
  durationInFrames: 210,
  defaultProps: {
    agents: 300,
    color: CS.sodium,
    decay: 0.9,
    trail: 26,
    linkRadius: 70,
    speed: 4,
    revealAt: 16,
    number: '128,406',
    caption: 'FOOTFALL · ONE MORNING',
    sub: 'CONCOURSE B · NORTHWIND STATION',
    src: '',
    seed: 7,
  },
  propDocs: {
    agents: 'number of walkers',
    color: 'trail / dot / link colour (sodium orange)',
    decay: 'trail alpha multiplier per frame of age (0.9 = source)',
    trail: 'trail length in frames',
    linkRadius: 'max distance (u) for nearest-neighbour links',
    speed: 'time-lapse factor on walking speed',
    revealAt: 'frame where the plate starts darkening and the tracks appear',
    number: 'counter value (digits lock left→right one per sixteenth); empty = no text',
    caption: 'tracked line under the rule',
    sub: 'small tracked line',
    src: 'optional public/ crowd still used as the plate (procedural concourse otherwise)',
    seed: 'walker layout seed',
  },
  component: CrowdTracks,
  tags: ['crowd', 'people', 'tracking', 'trails', 'network', 'constellation', 'footfall', 'mobility', 'smart city', 'retail analytics', 'data', 'time-lapse', 'city symphony', 'sodium', 'orange', 'glow', 'documentary', 'counter'],
});
