import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {GlossySphere, Sparkle} from '../../core/shapes';
import {Lotus, circleIntersections, ringAt, shade} from '../../core/shape-kit';
import {PaperTexture, Svg, Vignette, useStage} from '../../core/stage';
import {withPortraitFit} from '../../core/portrait3';
import {defineMotion} from '../../core/types';

/**
 * video4 17.75-22.95 s: pink pings arrive from off-screen, the blue listener blinks a "received" halo and
 * answers, the pink partner slides in, the paper tilts 0 -> 70 deg into a perspective floor
 * (paper-plane-tilt-camera), the two spheres take turns pinging, a one-frame colour-swap halo flash,
 * a joint ping, sparkles riding the ring intersections and a lotus blooming between them.
 */
type Props = {
  background: string;
  colors: string[];
  ringColors: string[];
  turnFrames: number;
  tiltStart: number;
  tiltFrames: number;
  pitchTo: number;
  lotus: boolean;
  lotusColors: string[];
  sparkles: boolean;
  sparkleColor: string;
  paper: boolean;
};

type Cam = {fx: number; fy: number; th: number; D: number; f: number; ax: number; ay: number};

const project = (c: Cam, x: number, y: number, hgt = 0) => {
  const X = x - c.fx;
  const Y = y - c.fy;
  const z = c.D - Y * Math.sin(c.th) - hgt * Math.cos(c.th);
  const s = c.f / Math.max(z, 1e-3);
  return {x: c.ax + X * s, y: c.ay + (Y * Math.cos(c.th) - hgt * Math.sin(c.th)) * s, s, z};
};

const ringPath = (c: Cam, wx: number, wy: number, r: number, n = 96) => {
  let d = '';
  let pen = false;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const p = project(c, wx + Math.cos(a) * r, wy + Math.sin(a) * r);
    if (p.z < c.f * 0.14) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    pen = true;
  }
  return d;
};

type Ping = {at: number; who: 0 | 1; life: number; maxR: number; stroke: number; rings: number};

const CallResponse: React.FC<Props> = ({background, colors, ringColors, turnFrames, tiltStart, tiltFrames, pitchTo, lotus, lotusColors, sparkles, sparkleColor, paper}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait, durationInFrames} = useStage();
  const blue = colors[0] ?? '#3780E7';
  const pink = colors[1] ?? '#E546AA';
  const ringBlue = ringColors[0] ?? '#3383CB';
  const ringPink = ringColors[1] ?? pink;

  // ---- schedule -------------------------------------------------------------------------------
  const tiltEnd = tiltStart + tiltFrames;
  const T0 = tiltEnd + 4;
  const sync = T0 + 4 * turnFrames + 2;
  const bloom = sync + 5;
  const pings: Ping[] = [
    {at: 4, who: 1, life: 34, maxR: 1650, stroke: 16, rings: 3},
    {at: 34, who: 0, life: 20, maxR: 900, stroke: 18, rings: 3},
    {at: tiltStart - 6, who: 1, life: 24, maxR: 1000, stroke: 14, rings: 2},
    {at: tiltStart + 4, who: 0, life: 38, maxR: 1500, stroke: 12, rings: 3},
  ];
  for (let k = 0; k < 4; k++) pings.push({at: T0 + k * turnFrames, who: k % 2 === 0 ? 1 : 0, life: 40, maxR: 1500, stroke: 14, rings: 3});
  pings.push({at: sync + 2, who: 0, life: 46, maxR: 1600, stroke: 18, rings: 3});
  pings.push({at: sync + 2, who: 1, life: 46, maxR: 1600, stroke: 18, rings: 3});
  for (let t = sync + 2 + 30, k = 0; t < durationInFrames - 6; t += 13, k++) pings.push({at: t, who: k % 2 === 0 ? 1 : 0, life: 40, maxR: 1500, stroke: 12, rings: 3});

  // ---- world: blue listener at origin, pink partner enters from lower-left -------------------
  const pinkSrc: [number, number] = [-1150, 680];
  const PX = portrait ? 0.62 : 1; // partner sits closer in tall frames
  const enter = prog(frame, 44, 55, (t) => 1 - Math.pow(1 - t, 3));
  const glide = prog(frame, tiltStart, tiltEnd, ease.inOut);
  const pinkPos: [number, number] = [lerp(lerp(pinkSrc[0], -520 * PX, enter), -430 * PX, glide), lerp(lerp(pinkSrc[1], 230, enter), -50, glide)];
  const bluePos: [number, number] = [0, 0];
  const posOf = (who: 0 | 1, at: number): [number, number] => {
    if (who === 0) return bluePos;
    if (at < 44) return pinkSrc;
    const e = prog(at, 44, 55, (t) => 1 - Math.pow(1 - t, 3));
    const g = prog(at, tiltStart, tiltEnd, ease.inOut);
    return [lerp(lerp(pinkSrc[0], -520 * PX, e), -430 * PX, g), lerp(lerp(pinkSrc[1], 230, e), -50, g)];
  };

  // ---- camera -------------------------------------------------------------------------------
  const tiltP = prog(frame, tiltStart, tiltEnd, (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2));
  const th = ((portrait ? pitchTo - 10 : pitchTo) * Math.PI * tiltP) / 180;
  const f = 1150 * u;
  const pull = prog(frame, tiltStart, durationInFrames, ease.sine);
  const cam: Cam = {
    fx: lerp(0, -215 * PX, tiltP) * u,
    fy: lerp(0, -25, tiltP) * u,
    th,
    f,
    D: f * (1 + 0.12 * pull),
    ax: cx,
    ay: cy + lerp(0, portrait ? 0.04 : 0.07, tiltP) * h,
  };
  const P = (x: number, y: number, hh = 0) => project(cam, x * u, y * u, hh * u);

  // ---- rings --------------------------------------------------------------------------------
  type LiveRing = {wx: number; wy: number; r: number; sw: number; op: number; who: 0 | 1; t: number; key: string; seed: number};
  const live: LiveRing[] = [];
  pings.forEach((p, pi) => {
    const [wx, wy] = posOf(p.who, p.at);
    for (let i = 0; i < p.rings; i++) {
      const life = p.life;
      const g = ringAt(frame - p.at - i * 5, life, p.maxR, p.stroke, i);
      if (!g) continue;
      live.push({wx, wy, r: g.r, sw: g.sw, op: g.op, who: p.who, t: g.t, key: `${pi}-${i}`, seed: pi * 7 + i});
    }
  });

  const RS = 22; // blue sphere radius (u)
  const PR = 19; // pink sphere radius (u)
  const bS = P(bluePos[0], bluePos[1], RS);
  const pS = P(pinkPos[0], pinkPos[1], PR);
  const flash = frame >= sync && frame < sync + 2;
  const pulse = (who: 0 | 1) => {
    let m = 1;
    for (const p of pings) if (p.who === who) m = Math.max(m, 1 + 0.2 * clamp(1 - Math.abs(frame - p.at - 1) / 2));
    return m;
  };

  const grow = lerp(1, 1.45, tiltP);
  // received halo (blinks twice) around the listener
  const halo = (frame >= 22 && frame < 26) || (frame >= 29 && frame < 33);

  // sparkles at pink x blue ring intersections
  const spark: React.ReactNode[] = [];
  if (sparkles) {
    const pinks = live.filter((r) => r.who === 1 && r.t > 0.05 && r.t < 0.9);
    const blues = live.filter((r) => r.who === 0 && r.t > 0.05 && r.t < 0.9);
    let n = 0;
    for (const a of pinks)
      for (const b of blues) {
        const pts = circleIntersections(a.wx, a.wy, a.r, b.wx, b.wy, b.r);
        pts.forEach(([x, y], k) => {
          if (n > 26) return;
          const pp = P(x, y, 2);
          if (pp.z < f * 0.2 || pp.x < -50 || pp.x > w + 50 || pp.y < -50 || pp.y > h + 50) return;
          const env = Math.sin(Math.PI * clamp((Math.min(a.t, b.t) - 0.05) / 0.6));
          const tw = 0.6 + 0.4 * Math.sin((frame + a.seed * 13 + b.seed * 7 + k * 3) * 0.9);
          const sz = 30 * u * env * tw * clamp(pp.s, 0.8, 1.6);
          if (sz < 1) return;
          n++;
          spark.push(
            <g key={`${a.key}-${b.key}-${k}`} opacity={Math.min(a.op, b.op)}>
              <Sparkle x={pp.x} y={pp.y} size={sz * 1.2} color="#F2B92E" rotate={45 * env + k * 20} opacity={0.85} />
              <Sparkle x={pp.x} y={pp.y} size={sz * 0.8} color={sparkleColor} rotate={45 * env + k * 20} />
            </g>,
          );
        });
      }
  }

  // lotus
  const sp = (d: number) => spring({frame: frame - bloom - d, fps: 30, config: {damping: 12, stiffness: 180}});
  const mid = P((pinkPos[0] + bluePos[0]) / 2, (pinkPos[1] + bluePos[1]) / 2, 0);

  const ringEls = live.map((r) => {
    const col = r.who === 0 ? ringBlue : ringPink;
    const c = P(r.wx, r.wy);
    const sw = r.sw * u * clamp(Math.sqrt(c.s), 0.6, 1.4);
    let dash: string | undefined;
    const br = clamp((r.t - 0.5) / 0.3) * (1 - tiltP);
    if (br > 0) {
      const rr = rng(r.seed * 31 + 5);
      dash = Array.from({length: 10}, (_, k) => (k % 2 ? (8 + rr() * 30) * br : 40 + rr() * 90) * u).join(' ');
    }
    return <path key={r.key} d={ringPath(cam, r.wx * u, r.wy * u, r.r * u)} fill="none" stroke={col} strokeWidth={sw} strokeDasharray={dash} opacity={r.op} strokeLinecap="round" />;
  });

  const srcGlow = 1 - prog(frame, 40, 60, ease.out);
  const srcP = P(pinkSrc[0], pinkSrc[1]);

  const spheres = [
    {who: 1 as const, p: pS, r: PR, col: pink, light: '#F9A9DC', dark: '#922568', show: frame >= 44, haloCol: '#FFF26B'},
    {who: 0 as const, p: bS, r: RS, col: blue, light: '#ABCFFF', dark: '#2B4681', show: true, haloCol: '#F08AD8'},
  ].sort((a, b) => a.p.y - b.p.y);

  return (
    <AbsoluteFill style={{background}}>
      {paper && <PaperTexture opacity={0.4} />}
      <Svg>
        <defs>
          <radialGradient id="cr-src">
            <stop offset="0%" stopColor={pink} stopOpacity={0.28} />
            <stop offset="100%" stopColor={pink} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="cr-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shade(background, -0.08)} stopOpacity={0.9} />
            <stop offset="100%" stopColor={background} stopOpacity={0} />
          </linearGradient>
        </defs>
        {srcGlow > 0 && <circle cx={srcP.x} cy={srcP.y} r={420 * u} fill="url(#cr-src)" opacity={srcGlow} />}
        {th > 0.3 && <rect x={0} y={0} width={w} height={Math.max(1, cam.ay - (f * Math.cos(th)) / Math.sin(th) + 60 * u)} fill="url(#cr-haze)" opacity={tiltP} />}
        {ringEls}
        {lotus && frame >= bloom - 1 && (
          <Lotus x={mid.x} y={mid.y} size={190 * u * mid.s * (portrait ? 0.75 : 1)} open={[sp(2), sp(0)]} petals={8} squash={Math.max(0.3, Math.cos(th))} colors={[lotusColors[0] ?? '#F8B6E6', lotusColors[1] ?? '#E546AA']} center={lotusColors[2] ?? '#F2B33D'} id="cr-lotus" />
        )}
        {spheres.map((s) =>
          s.show ? (
            <g key={s.who}>
              {flash && <circle cx={s.p.x} cy={s.p.y} r={s.r * 2.2 * u * s.p.s * grow} fill={s.haloCol} />}
              {s.who === 0 && halo && <circle cx={s.p.x} cy={s.p.y} r={34 * u * s.p.s} fill="none" stroke={ringBlue} strokeWidth={2 * u} />}
              <GlossySphere cx={s.p.x} cy={s.p.y} r={s.r * u * s.p.s * pulse(s.who) * grow} color={s.col} light={s.light} dark={s.dark} id={`cr-sph${s.who}`} shadowOpacity={0.55} />
            </g>
          ) : null,
        )}
        {spark}
      </Svg>
      {paper && <Vignette strength={0.28} color="120,110,95" />}
    </AbsoluteFill>
  );
};

export const callResponse = defineMotion<Props>({
  id: 'call-response',
  title: 'Call & response (two spheres)',
  category: 'shape',
  description: 'Blue and pink glossy spheres take turns pinging rings, flash a colour-swap halo, the paper tilts into a perspective floor, sparkles ride the ring crossings and a lotus blooms between them.',
  source: ['video4 0:17.75-0:22.95'],
  useFor: 'Two agents / users / systems communicating, a handshake or sync moment, "a result blooms where two inputs meet".',
  durationInFrames: 210,
  defaultProps: {
    background: '#ECE4D7',
    colors: ['#3780E7', '#E546AA'],
    ringColors: ['#3383CB', '#E546AA'],
    turnFrames: 11,
    tiltStart: 62,
    tiltFrames: 24,
    pitchTo: 70,
    lotus: true,
    lotusColors: ['#F8B6E6', '#E546AA', '#F2B33D'],
    sparkles: true,
    sparkleColor: '#FFF6B0',
    paper: true,
  },
  propDocs: {
    colors: '[listener, partner] sphere colours',
    ringColors: '[listener, partner] ring stroke colours',
    turnFrames: 'frames between alternate pings after the tilt',
    tiltStart: 'frame the paper starts tilting into a floor',
    tiltFrames: 'length of the tilt (easeInOutCubic)',
    pitchTo: 'final camera pitch in degrees (0 = top-down)',
    lotus: 'bloom a lotus between the spheres after the joint ping',
    lotusColors: '[petal light, petal deep, centre]',
    sparkles: 'sparkles at pink/blue ring intersections',
    paper: 'paper grain + vignette',
  },
  component: withPortraitFit(CallResponse, {s: 1.5}),
  tags: ['sonar', 'dialogue', 'handshake', 'sync', 'perspective', 'bloom'],
});
