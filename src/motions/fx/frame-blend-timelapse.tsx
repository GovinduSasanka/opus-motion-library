// Adapted from lemo-opuscar/styles/city-symphony/demo/tools/prep.py speed integration + frame blending (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {useSafeId} from '../../core/image-kit';
import {rng} from '../../core/random';
import {mixHex, s1f, sh, smooth01} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Time-lapse by frame blending. The scene is a function of *source time*: a keyed speed curve (0.3x - 75x, smoothstep
 * between keys) is integrated with the trapezoid rule to a source position per output frame, and each output frame
 * averages `blend` sub-frames of the scene spread over the interval between consecutive positions (a running 1/(i+1)
 * opacity average). Headlights become continuous lines, clouds turn to water, the sky runs through the day — and when the
 * speed ramps back down it all snaps into sharp single frames again.
 */
type Props = {
  speedKeys: number[][];
  blend: number;
  shutter: number;
  lanes: number;
  hourStart: number;
  showHud: boolean;
  src: string;
  seed: number;
  background: string;
  speedLine: string;
  clockLabel: string;
  curveLabel: string;
};

const SKY: [number, string, string][] = [
  [0, '#070B1C', '#1B2145'],
  [5, '#1A1F45', '#E08A6A'],
  [7, '#5E86C8', '#F4C9A0'],
  [10, '#6FA8E6', '#CFE6F8'],
  [16, '#6FA8E6', '#E8EEF4'],
  [18.5, '#4B3A78', '#F08A5A'],
  [20, '#17163A', '#6A3F72'],
  [22, '#070B1C', '#1B2145'],
  [24, '#070B1C', '#1B2145'],
];
const skyAt = (hour: number): {top: string; bot: string; night: number} => {
  const hh = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < SKY.length - 2 && hh >= SKY[i + 1][0]) i++;
  const a = SKY[i];
  const b = SKY[i + 1];
  const t = smooth01((hh - a[0]) / Math.max(1e-6, b[0] - a[0]));
  const night = hh < 5 || hh > 21 ? 1 : hh < 7 ? 1 - (hh - 5) / 2 : hh > 18.5 ? clamp((hh - 18.5) / 2.5) : 0;
  return {top: mixHex(a[1], b[1], t), bot: mixHex(a[2], b[2], t), night};
};

const speedAt = (keys: number[][], t: number) => {
  if (!keys.length) return 1;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1];
      const b = keys[i];
      const k = smooth01((t - a[0]) / Math.max(1e-6, b[0] - a[0]));
      // interpolate in log space so 1x -> 70x ramps feel even
      return Math.exp(Math.log(Math.max(0.05, a[1])) * (1 - k) + Math.log(Math.max(0.05, b[1])) * k);
    }
  }
  return keys[keys.length - 1][1];
};

type World = {
  w: number;
  h: number;
  u: number;
  hor: number;
  bld: {x: number; bw: number; bh: number; rows: number; cols: number}[];
  clouds: {x: number; y: number; r: number; sp: number}[];
  cars: {lane: number; off: number; sp: number; hue: number}[];
  laneY: number[];
  laneDir: number[];
};

const makeWorld = (w: number, h: number, u: number, lanes: number, seed: number): World => {
  const r = rng(seed * 13 + 5);
  const hor = h * 0.66;
  const bld: World['bld'] = [];
  let x = -20 * u;
  while (x < w + 40 * u) {
    const bw = (50 + r() * 100) * u;
    const bh = (60 + r() * 230) * u * (h > w ? 0.9 : 1);
    bld.push({x, bw, bh, rows: Math.max(1, Math.floor(bh / (22 * u))), cols: Math.max(1, Math.floor(bw / (16 * u)))});
    x += bw + (3 + r() * 6) * u;
  }
  const clouds = Array.from({length: 9}, () => ({x: r() * w, y: h * (0.06 + r() * 0.3), r: (50 + r() * 90) * u, sp: 3 + r() * 6}));
  const laneY: number[] = [];
  const laneDir: number[] = [];
  const roadTop = hor + 22 * u;
  const roadH = h - roadTop - 30 * u;
  for (let i = 0; i < lanes; i++) {
    laneY.push(roadTop + roadH * ((i + 0.5) / lanes));
    laneDir.push(i < lanes / 2 ? 1 : -1);
  }
  const cars: World['cars'] = [];
  for (let l = 0; l < lanes; l++) {
    const n = 9;
    for (let j = 0; j < n; j++) cars.push({lane: l, off: (j + r() * 0.7) / n, sp: 0.8 + r() * 0.4, hue: r()});
  }
  return {w, h, u, hor, bld, clouds, cars, laneY, laneDir};
};

/** the whole scene as a pure function of source time `s` (seconds) */
const SceneAt: React.FC<{world: World; s: number; hourStart: number; src: string; uid: string}> = ({world, s, hourStart, src, uid}) => {
  const {w, h, u, hor, bld, clouds, cars, laneY, laneDir} = world;
  const hour = hourStart + s * 0.3;
  const sky = skyAt(hour);
  const night = sky.night;
  const dim = 1 - night * 0.82;
  let wins = '';
  const tick = Math.floor(s * 0.6);
  bld.forEach((b, i) => {
    for (let ry = 0; ry < b.rows; ry++) {
      for (let cx = 0; cx < b.cols; cx++) {
        if (sh(i, ry * 31 + cx, tick) < 0.05 + night * 0.42) {
          wins += `M${(b.x + (cx + 0.3) * 16 * u).toFixed(1)} ${(hor - b.bh + (ry + 0.3) * 22 * u + 8 * u).toFixed(1)}h${(8 * u).toFixed(1)}v${(11 * u).toFixed(1)}h${(-8 * u).toFixed(1)}z`;
        }
      }
    }
  });
  const road = '#14131c';
  return (
    <g>
      {src ? (
        <image href={resolveSrc(src)} x={0} y={0} width={w} height={hor} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={sky.top} />
              <stop offset="1" stopColor={sky.bot} />
            </linearGradient>
          </defs>
          <rect width={w} height={hor + 2} fill={`url(#${uid})`} />
        </>
      )}
      {!src && (
        <>
          {clouds.map((c, i) => {
            const x = ((c.x + s * c.sp * u * 2.4) % (w + 400 * u)) - 200 * u;
            const op = 0.55 * dim;
            return (
              <g key={i} opacity={op}>
                <ellipse cx={x} cy={c.y} rx={c.r * 1.6} ry={c.r * 0.5} fill="#fff" />
                <ellipse cx={x - c.r * 0.7} cy={c.y + c.r * 0.12} rx={c.r} ry={c.r * 0.4} fill="#fff" />
                <ellipse cx={x + c.r * 0.8} cy={c.y + c.r * 0.1} rx={c.r * 0.9} ry={c.r * 0.38} fill="#fff" />
              </g>
            );
          })}
          {bld.map((b, i) => (
            <rect key={i} x={b.x} y={hor - b.bh} width={b.bw} height={b.bh + 2} fill={mixHex('#0C0B14', '#2B2E48', dim * 0.6)} />
          ))}
          <path d={wins} fill={mixHex('#FFE2A0', '#FFF6D8', night)} opacity={0.35 + 0.6 * night} />
        </>
      )}
      <rect x={0} y={hor} width={w} height={h - hor} fill={road} />
      <rect x={0} y={hor} width={w} height={6 * u} fill="#2a2940" />
      {laneY.slice(1).map((y, i) => (
        <line key={i} x1={0} x2={w} y1={(y + laneY[i]) / 2} y2={(y + laneY[i]) / 2} stroke="#3b3a52" strokeWidth={2 * u} strokeDasharray={`${26 * u} ${30 * u}`} />
      ))}
      {cars.map((c, i) => {
        const dir = laneDir[c.lane];
        const span = w + 260 * u;
        const speed = 70 * u * c.sp * (c.lane % 2 ? 1.0 : 1.25);
        const x = ((c.off * span + dir * s * speed) % span + span) % span - 130 * u;
        const y = laneY[c.lane];
        const head = dir > 0;
        const lx = head ? x + 20 * u : x - 20 * u;
        const col = head ? '#FFF1B8' : '#FF3030';
        const glowA = 0.25 + 0.6 * night;
        return (
          <g key={i}>
            <rect x={x - 26 * u} y={y - 8 * u} width={52 * u} height={16 * u} rx={5 * u} fill={mixHex('#2b2b3a', mixHex('#B8C0D8', '#E24A4A', c.hue), 0.5 * dim)} opacity={0.9} />
            <ellipse cx={lx} cy={y - 3.5 * u} rx={20 * u} ry={5.5 * u} fill={col} opacity={glowA * 0.8} />
            <ellipse cx={lx} cy={y + 3.5 * u} rx={20 * u} ry={5.5 * u} fill={col} opacity={glowA * 0.8} />
            <rect x={lx - 5 * u} y={y - 5 * u} width={10 * u} height={3 * u} fill={col} />
            <rect x={lx - 5 * u} y={y + 2 * u} width={10 * u} height={3 * u} fill={col} />
          </g>
        );
      })}
    </g>
  );
};

const FrameBlendTimelapse: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, fps, durationInFrames} = useStage();
  const uid = useSafeId('fbt');
  const world = React.useMemo(() => makeWorld(w, h, u, Math.max(2, p.lanes - (p.lanes % 2)), p.seed), [w, h, u, p.lanes, p.seed]);
  // integrate the keyed speed curve (trapezoid rule) to a source position in seconds
  const vAt = (f: number) => speedAt(p.speedKeys, f / fps);
  let pos = 0;
  let prevPos = 0;
  let vPrev = vAt(0);
  for (let f = 1; f <= frame; f++) {
    const v = vAt(f);
    prevPos = pos;
    pos += ((vPrev + v) / 2) / fps;
    vPrev = v;
  }
  if (frame === 0) prevPos = 0;
  const v = vAt(frame);
  const span = pos - prevPos || v / fps;
  const N = clamp(Math.round(v * p.shutter), 1, Math.max(1, Math.round(p.blend)));
  // samples spread over the last `shutter` fraction of the interval, ending at pos
  const samples = Array.from({length: N}, (_, i) => (N === 1 ? pos : pos - span * p.shutter + (span * p.shutter * i) / (N - 1)));
  const hour = p.hourStart + pos * 0.3;
  const hh = ((hour % 24) + 24) % 24;
  const clock = `${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor((hh % 1) * 60)).padStart(2, '0')}`;
  // nest running averages: layer i has opacity 1/(i+1)
  const layers = samples.map((s, i) => (
    <g key={i} opacity={1 / (i + 1)}>
      <SceneAt world={world} s={s} hourStart={p.hourStart} src={p.src} uid={`${uid}s${i}`} />
    </g>
  ));
  const hud = p.showHud;
  const fs = portrait ? 38 * u : Math.min(26 * u, w * 0.04);
  const hy = portrait ? 1.45 : 1; // HUD vertical scale
  // speed graph
  const gw = portrait ? w * 0.8 : Math.min(w * 0.42, 560 * u);
  const gh = (portrait ? 120 : 70) * u;
  const gx = portrait ? w / 2 - gw / 2 : 48 * u;
  const gy = h - gh - 70 * u;
  const lmin = Math.log(0.3);
  const lmax = Math.log(80);
  const gp = Array.from({length: 61}, (_, i) => {
    const f = (i / 60) * durationInFrames;
    const vv = vAt(f);
    return `${i ? 'L' : 'M'}${(gx + (i / 60) * gw).toFixed(1)} ${(gy + gh - ((Math.log(vv) - lmin) / (lmax - lmin)) * gh).toFixed(1)}`;
  }).join('');
  const px = gx + (frame / durationInFrames) * gw;
  const py = gy + gh - ((Math.log(v) - lmin) / (lmax - lmin)) * gh;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        {layers.length ? layers : null}
        {hud && (
          <g>
            <rect x={0} y={0} width={w} height={150 * hy * u} fill="rgba(0,0,0,0.35)" />
            <text x={portrait ? w / 2 : 48 * u} y={72 * hy * u} textAnchor={portrait ? 'middle' : 'start'} fontFamily={s1f.dela} fontSize={portrait ? 90 * u : Math.min(62 * u, w * 0.1)} fill="#FFF7E8">
              {v >= 10 ? Math.round(v) : v.toFixed(1)}×
            </text>
            <text x={portrait ? w / 2 : 48 * u} y={108 * hy * u} textAnchor={portrait ? 'middle' : 'start'} fontFamily={s1f.barlow} fontWeight={600} fontSize={fs * 0.8} letterSpacing={3 * u} fill="#B8B1D0">
              {p.speedLine.replace('{n}', String(N)).replace('{s}', N > 1 ? 'S' : '')}
            </text>
            <text x={w - 48 * u} y={72 * hy * u} textAnchor="end" fontFamily={s1f.dela} fontSize={portrait ? 90 * u : Math.min(62 * u, w * 0.1)} fill="#FFF7E8">
              {clock}
            </text>
            <text x={w - 48 * u} y={108 * hy * u} textAnchor="end" fontFamily={s1f.barlow} fontWeight={600} fontSize={fs * 0.8} letterSpacing={3 * u} fill="#B8B1D0">
              {p.clockLabel}
            </text>
          </g>
        )}
        {hud && (
          <g>
            <g>
              <rect x={gx - 10 * u} y={gy - 14 * u} width={gw + 20 * u} height={gh + 28 * u} rx={10 * u} fill="rgba(0,0,0,0.45)" />
              <path d={gp} fill="none" stroke="#35E7FF" strokeWidth={2.5 * u} />
              <line x1={px} x2={px} y1={gy - 6 * u} y2={gy + gh + 6 * u} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5 * u} />
              <circle cx={px} cy={py} r={6 * u} fill="#FFF0A0" />
              <text x={gx} y={gy + gh + (portrait ? 44 : 28) * u} fontFamily={s1f.barlow} fontWeight={600} fontSize={fs * 0.62} letterSpacing={2 * u} fill="#9A93B8">
                {p.curveLabel}
              </text>
            </g>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const frameBlendTimelapse = defineMotion<Props>({
  id: 'frame-blend-timelapse',
  title: 'Frame-blend time-lapse',
  category: 'fx',
  description:
    'A keyed speed ramp (1x to 70x and a hard brake to 0.3x) integrated to source time, each frame an average of blended sub-frames: headlights become continuous lines, clouds turn to water, the sky runs through the day, then everything snaps sharp.',
  source: ['lemo-opuscar styles/city-symphony/demo/tools/prep.py (MIT, LemoLab); STYLE.md sections 5 and 8'],
  useFor: 'Hyperlapse and time-lapse looks, "time flies" beats, light-trail backgrounds; the same speed-integration + sub-frame-average recipe applies to any procedural child.',
  durationInFrames: 180,
  defaultProps: {
    speedKeys: [[0, 1], [0.8, 1], [1.6, 30], [3.6, 70], [4.4, 2.2], [4.95, 0.3]],
    blend: 20,
    shutter: 1,
    lanes: 4,
    hourStart: 14,
    showHud: true,
    src: '',
    seed: 4,
    background: '#070B1C',
    speedLine: 'SPEED · {n} SUB-FRAME{s} BLENDED',
    clockLabel: 'SOURCE CLOCK',
    curveLabel: '0.3× – 80× SPEED CURVE',
  },
  propDocs: {
    speedKeys: 'speed keyframes [[seconds, multiplier], ...] — smoothstep (log-space) between keys; 0.3 - 75',
    blend: 'cap on sub-frames averaged per output frame (8 - 30)',
    shutter: 'fraction of the frame interval that is sampled (1 = 360 degrees; ~0.4 for noon clouds)',
    lanes: 'road lanes (even number, half each way)',
    hourStart: 'clock hour at source time zero (the sky and window lights follow it)',
    showHud: 'speed / clock / curve readout',
    src: 'optional still image (public/) used as the sky + skyline plate behind the road',
    seed: 'seed for buildings, clouds and cars',
    background: 'fallback background',
    speedLine: 'HUD line; {n} = sub-frames blended, {s} = "S" when more than one',
    clockLabel: 'caption under the source clock readout',
    curveLabel: 'caption under the speed-curve graph',
  },
  component: FrameBlendTimelapse,
  tags: ['timelapse', 'hyperlapse', 'speed ramp', 'frame blend', 'motion blur', 'light trails', 'headlights', 'shutter', 'time flies', 'city', 'day to night', 'wrapper'],
});
