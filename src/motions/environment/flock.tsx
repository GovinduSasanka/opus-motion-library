import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, onTwos, prog} from '../../core/ease';
import {n2, rng, range} from '../../core/random';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {PaperCraneSide, circlesD, makeRidge, mix, ridgePath} from '../../core/world-kit';

type Props = {
  count: number;
  spacing: number;
  angleDeg: number;
  scaleFalloff: number;
  birdSize: number;
  period: number;
  paperCrane: boolean;
  joinAt: number;
  joinFrames: number;
  sky: string;
  horizon: string;
  mountains: boolean;
  grain: number;
  seed: string;
};

/**
 * Side-view red-crowned crane facing LEFT. `ph` = flap phase (radians).
 * Down-stroke: near wing white with black trailing band; up-stroke: grey-blue back side, narrower (video1 bird-flap-cycle).
 */
const Crane: React.FC<{s: number; ph: number; u: number}> = ({s, ph, u}) => {
  const a = (55 * Math.cos(ph) - 5) * (Math.PI / 180); // + = wing up
  const up = Math.sin(ph) > 0; // angle increasing = up-stroke
  const span = 1.45;
  const sinA = Math.sin(a);
  const narrow = up ? 0.82 : 1;
  const W = (uu: number, v: number, far = false): [number, number] => [
    (uu * narrow + (far ? 0.12 : 0)) * s,
    (-0.08 - v * span * sinA * (far ? 0.9 : 1) - (far ? 0.04 : 0) + v * v * 0.12 * Math.cos(a)) * s,
  ];
  const outline = (far = false) => {
    const pts: [number, number][] = [W(-0.3, 0, far), W(-0.42, 0.45, far), W(-0.36, 0.85, far), W(-0.22, 1.02, far)];
    // primary feather fingers at the tip
    for (let k = 0; k < 5; k++) {
      const v = 1.02 - k * 0.07;
      pts.push(W(-0.12 + k * 0.08, v + 0.04, far), W(-0.06 + k * 0.08, v - 0.06, far));
    }
    pts.push(W(0.36, 0.6, far), W(0.46, 0.3, far), W(0.38, 0, far));
    return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  };
  const band = (() => {
    const pts: [number, number][] = [W(0.38, 0), W(0.46, 0.3), W(0.36, 0.6), W(0.2, 0.62), W(0.26, 0.3), W(0.2, 0)];
    return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  })();
  const white = '#f2f1ec';
  const black = '#1d1f2c';
  return (
    <g>
      {/* far wing */}
      <polygon points={outline(true)} fill={up ? '#8f9bb1' : '#d9dbe0'} />
      {/* legs trailing */}
      <path d={`M${0.42 * s} ${0.06 * s}L${1.55 * s} ${0.16 * s}M${0.42 * s} ${0.09 * s}L${1.5 * s} ${0.22 * s}`} stroke={black} strokeWidth={Math.max(1, 0.03 * s)} strokeLinecap="round" />
      {/* body */}
      <ellipse cx={0} cy={0} rx={0.56 * s} ry={0.17 * s} fill={white} />
      <path d={`M${0.3 * s} ${-0.1 * s}Q${0.62 * s} ${-0.02 * s} ${0.66 * s} ${0.06 * s}L${0.4 * s} ${0.1 * s}Z`} fill={black} />
      {/* neck + head */}
      <path d={`M${-0.4 * s} ${-0.1 * s}L${-1.3 * s} ${-0.12 * s}L${-1.3 * s} ${-0.04 * s}L${-0.4 * s} ${0.06 * s}Z`} fill={black} />
      <path d={`M${-0.55 * s} ${-0.06 * s}L${-0.95 * s} ${-0.1 * s}L${-0.95 * s} ${-0.07 * s}L${-0.55 * s} ${-0.01 * s}Z`} fill={white} opacity={0.9} />
      <ellipse cx={-1.34 * s} cy={-0.08 * s} rx={0.09 * s} ry={0.065 * s} fill={black} />
      <circle cx={-1.33 * s} cy={-0.135 * s} r={0.035 * s} fill="#b61f3c" />
      <path d={`M${-1.42 * s} ${-0.1 * s}L${-1.7 * s} ${-0.07 * s}L${-1.42 * s} ${-0.05 * s}Z`} fill="#b9b08a" />
      {/* near wing */}
      <polygon points={outline()} fill={up ? '#a9b4c8' : white} stroke={mix(white, black, 0.25)} strokeWidth={Math.max(0.6, 0.012 * s)} />
      {!up && <polygon points={band} fill={black} />}
      {up && <polygon points={band} fill="#6f7a92" opacity={0.8} />}
    </g>
  );
};

const Flock: React.FC<Props> = ({count, spacing, angleDeg, scaleFalloff, birdSize, period, paperCrane, joinAt, joinFrames, sky, horizon, mountains, grain, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D, portrait} = useStage();
  const k = portrait ? 0.85 : 1;
  const sp = spacing * u * k;
  const ang = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(ang) * sp;
  const dy = Math.sin(ang) * sp;
  const lead = {x: w * (portrait ? 0.2 : 0.27), y: h * (portrait ? 0.42 : 0.46) - frame * 0.45 * u};
  const nA = Math.ceil((count - 1) * 0.6);
  const nB = count - 1 - nA;
  type Slot = {x: number; y: number; s: number; i: number};
  const slots: Slot[] = [{...lead, s: 1, i: 0}];
  let ax = lead.x;
  let ay = lead.y;
  for (let i = 1; i <= nA; i++) {
    const f = Math.pow(scaleFalloff, i - 1);
    ax += dx * f;
    ay -= dy * f;
    slots.push({x: ax, y: ay, s: Math.pow(scaleFalloff, i), i: slots.length});
  }
  let bx = lead.x;
  let by = lead.y;
  let paperSlot: Slot = {x: 0, y: 0, s: 1, i: -1};
  for (let i = 1; i <= nB + 1; i++) {
    const f = Math.pow(scaleFalloff, i - 1);
    bx += dx * f * 1.05;
    by += dy * f * 0.55;
    const sl = {x: bx, y: by, s: Math.pow(scaleFalloff, i) * 1.04, i: slots.length};
    if (i === 1) paperSlot = sl; // the slot just behind and below the leader waits for the paper crane
    else slots.push(sl);
  }
  const r = rng(`${seed}-birds`);
  const phases = slots.map(() => r() * Math.PI * 2);
  const S = birdSize * u * k;
  const birds = slots.map((sl, j) => {
    const ph = (onTwos(frame) / period) * Math.PI * 2 + phases[j];
    const nx = n2(`${seed}x`, j * 3.1, frame * 0.008) * 0.006 * w;
    const ny = n2(`${seed}y`, j * 3.1, frame * 0.008) * 0.008 * h;
    const bob = 0.01 * h * Math.sin(ph) * sl.s; // body moves opposite to the wing
    return {x: sl.x + nx, y: sl.y + ny + bob, s: S * sl.s, ph, j};
  });

  // paper crane joins from lower right into the free slot
  const jp = prog(frame, joinAt, joinAt + joinFrames, ease.inOut);
  const pStart = {x: w * 1.1, y: h * 0.86};
  const pcx = pStart.x + (paperSlot.x - pStart.x) * jp + n2(`${seed}p`, 1, frame * 0.01) * 0.004 * w;
  const pcy = pStart.y + (paperSlot.y - pStart.y) * jp - Math.sin(jp * Math.PI) * 0.06 * h;
  const pflap = 48 * Math.sin((onTwos(frame) / 16) * Math.PI * 2);

  // background
  const hz = h * (portrait ? 0.8 : 0.74);
  const drift = frame * u; // world slides right (we fly left)
  const P = w * 1.6;
    const rr = rng(`${seed}-bg`);
  const peaks = Array.from({length: 9}, (_, i) => ({x: (i / 9) * P + range(rr, -40, 40) * u, hh: range(rr, 0.08, 0.17) * h, wd: range(rr, 0.08, 0.14) * w}));
  const wrapX = (x: number, f: number) => ((((x + drift * f) % P) + P) % P) - (P - w) / 2;
  const cloudsBank = (y: number, f: number, col: string, amp: number, sd: string) => {
    const fr = makeRidge(sd, P, [4, 7, 11, 17], 0.8);
    const o = (drift * f) % P;
    return (
      <g transform={`translate(${o - P},0)`}>
        <path d={ridgePath(fr, 0, P * 2, y, amp, h + 4, 8)} fill={col} />
      </g>
    );
  };
  const skyStreaks = Array.from({length: 5}, () => ({x: rr() * w, y: range(rr, 0.08, 0.5) * h, l: range(rr, 0.1, 0.25) * w}));

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${sky} 0%, ${mix(sky, horizon, 0.5)} 60%, ${horizon} 100%)`}}>
      <Svg>
        {skyStreaks.map((c, i) => (
          <line key={i} x1={wrapX(c.x, 0.15)} y1={c.y} x2={wrapX(c.x, 0.15) + c.l} y2={c.y} stroke="#ffffff" strokeWidth={3 * u} strokeLinecap="round" opacity={0.25} />
        ))}
        {mountains && (
          <g>
            {/* haze band + snowy peaks */}
            <rect x={0} y={hz - 0.05 * h} width={w} height={h} fill={mix(horizon, '#ffffff', 0.35)} opacity={0.6} />
            {peaks.map((p, i) => {
              const x = wrapX(p.x, 0.25);
              const top = hz - p.hh;
              return (
                <g key={i}>
                  <polygon points={`${x - p.wd},${hz + 0.02 * h} ${x},${top} ${x + p.wd},${hz + 0.02 * h}`} fill="#a9b0c4" />
                  <polygon points={`${x},${top} ${x + p.wd},${hz + 0.02 * h} ${x + p.wd * 0.2},${hz + 0.02 * h}`} fill="#959db3" />
                  <polygon points={`${x - p.wd * 0.38},${top + p.hh * 0.38} ${x},${top} ${x + p.wd * 0.38},${top + p.hh * 0.38} ${x + p.wd * 0.15},${top + p.hh * 0.3} ${x},${top + p.hh * 0.44} ${x - p.wd * 0.18},${top + p.hh * 0.3}`} fill="#f2f1ec" />
                </g>
              );
            })}
            {cloudsBank(hz + 0.004 * h, 0.4, '#e9ecef', 0.008 * h, `${seed}-cb1`)}
            {cloudsBank(hz + 0.03 * h, 0.5, '#aab2c3', 0.02 * h, `${seed}-ridge2`)}
            {cloudsBank(hz + 0.06 * h, 0.6, '#eef0f2', 0.01 * h, `${seed}-cb2`)}
            {cloudsBank(hz + 0.085 * h, 0.8, '#8d98ab', 0.018 * h, `${seed}-ridge3`)}
            {cloudsBank(hz + 0.12 * h, 0.9, '#e3e7ea', 0.008 * h, `${seed}-cb3`)}
            {cloudsBank(hz + 0.15 * h, 1.0, '#6d7d8f', 0.012 * h, `${seed}-ridge4`)}
            {/* conifer silhouettes at the bottom */}
            <g>
              {Array.from({length: Math.ceil(w / (22 * u)) + 4}, (_, i) => {
                const x = ((i * 22 * u + drift * 1.1) % (w + 88 * u)) - 44 * u;
                const th = (40 + 34 * Math.abs(Math.sin(i * 2.3))) * u;
                return <polygon key={i} points={`${x - 11 * u},${h + 2} ${x},${h - th} ${x + 11 * u},${h + 2}`} fill={i % 3 ? '#3e5560' : '#4a6470'} />;
              })}
            </g>
          </g>
        )}
        {/* far birds first (smaller) */}
        {[...birds]
          .sort((a, b) => a.s - b.s)
          .map((b) => (
            <g key={b.j} transform={`translate(${b.x.toFixed(1)},${b.y.toFixed(1)})`}>
              <Crane s={b.s} ph={b.ph} u={u} />
            </g>
          ))}
        {paperCrane && frame >= joinAt - 1 && <PaperCraneSide x={pcx} y={pcy} size={S * paperSlot.s * 1.3} flap={pflap} u={u} rotate={-6 * (1 - jp) - 2} />}
      </Svg>
      {grain > 0 && <FilmGrain opacity={grain} />}
    </AbsoluteFill>
  );
};

export const flock = defineMotion<Props>({
  id: 'flock',
  title: 'V-formation flock',
  category: 'environment',
  description:
    'A V-formation of red-crowned cranes flies right-to-left over snowy peaks: birds shrink with depth along each arm, flap on twos with offset phases (white down-strokes, grey-blue up-strokes) and bob against their wings, while a lone paper crane swoops in from the lower right and takes the last slot.',
  source: ['video1 0:28-0:35 v-formation-flock', 'video1 0:30-0:32 bird-flap-cycle'],
  useFor: 'Migration / journey / teamwork beats, "joining the group" metaphors, sky interludes.',
  durationInFrames: 180,
  defaultProps: {
    count: 9,
    spacing: 175,
    angleDeg: 30,
    scaleFalloff: 0.93,
    birdSize: 68,
    period: 25,
    paperCrane: true,
    joinAt: 18,
    joinFrames: 110,
    sky: '#7a9fc0',
    horizon: '#a9c1d6',
    mountains: true,
    grain: 0.05,
    seed: 'migrate',
  },
  propDocs: {
    count: 'number of real cranes (including the leader)',
    spacing: 'distance between birds in u',
    angleDeg: 'angle of the V arms (degrees from horizontal)',
    scaleFalloff: 'size factor per bird toward the back (depth)',
    birdSize: 'leader body half-length in u',
    period: 'flap cycle in frames (25 = 0.833 s, drawn on twos)',
    paperCrane: 'a paper crane flies in and joins the formation',
    joinAt: 'frame the paper crane enters',
    joinFrames: 'frames it takes to reach its slot',
    sky: 'sky colour (top)',
    horizon: 'sky colour at the horizon',
    mountains: 'snowy peaks, cloud banks and conifers below',
    grain: 'film grain opacity',
    seed: 'random seed',
  },
  component: Flock,
  tags: ['birds', 'flock', 'cranes', 'sky', 'migration', 'formation'],
});
