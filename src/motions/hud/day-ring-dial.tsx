// Adapted from lemo-opuscar/styles/city-symphony/demo/tools/render.py dial_hour()/draw_dial() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CS, CsFinish, DayDial, h01, hhmm, isClear, keyLerp, la2Fonts, mixHex, seg, smooth, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Small thin 24-hour ring in a corner: an orange hand with a 3-hour arc that runs with the film's day, freezes and dims
 * during a slow passage, spins backwards during a rewind. Default backdrop = a procedural time-lapse city plate whose sky,
 * sun and lit windows follow the dial; set background 'transparent' to use it as an overlay.
 */

type Props = {
  hourKeys: [number, number][];
  dimRanges: [number, number][];
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size: number;
  accent: string;
  dimColor: string;
  readout: boolean;
  title: string;
  subtitle: string;
  background: string;
  seed: number;
};

const SKY: [number, string, string][] = [
  // hour, zenith, horizon
  [0, '#070a12', '#151a26'],
  [4.5, '#0b1020', '#2a2630'],
  [6, '#2a3348', '#c27a4c'],
  [7.5, '#5b7290', '#d8b08a'],
  [10, '#7f98b2', '#c9d2d8'],
  [15, '#7a92ac', '#ccd3d6'],
  [18, '#4b5874', '#d58a52'],
  [19.5, '#202a42', '#8a4c3c'],
  [21, '#0a0f1c', '#1d2030'],
  [24, '#070a12', '#151a26'],
];
const skyAt = (hr: number): [string, string] => {
  const h = ((hr % 24) + 24) % 24;
  for (let i = 1; i < SKY.length; i++) {
    if (h <= SKY[i][0]) {
      const k = smooth((h - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]));
      return [mixHex(SKY[i - 1][1], SKY[i][1], k), mixHex(SKY[i - 1][2], SKY[i][2], k)];
    }
  }
  return [SKY[0][1], SKY[0][2]];
};
/** 0 at day, 1 at night */
const nightness = (hr: number) => {
  const h = ((hr % 24) + 24) % 24;
  return h < 6 ? 1 - smooth((h - 5) / 1.5) : h > 18 ? smooth((h - 18.3) / 1.7) : 0;
};

const CityPlate: React.FC<{hour: number; seed: number}> = ({hour, seed}) => {
  const {w, h, u} = useStage();
  const id = useIdA('drd');
  const [zen, hor] = skyAt(hour);
  const nt = nightness(hour);
  const horizonY = h * 0.6;
  // sun / moon arc
  const hh = ((hour % 24) + 24) % 24;
  const sa = ((hh - 6) / 12) * Math.PI;
  const sunX = w * 0.5 - Math.cos(sa) * w * 0.42;
  const sunY = horizonY - Math.sin(sa) * h * 0.5;
  const ma = ((hh + 6) % 24) / 12 * Math.PI;
  const moonX = w * 0.5 - Math.cos(ma) * w * 0.42;
  const moonY = horizonY - Math.sin(ma) * h * 0.45;
  // skyline: three depth rows (far rows hazed toward the horizon colour)
  const ROWS = [
    {base: horizonY, wMul: 30, hMul: 0.2, haze: 0.55, day: '#8b939e', night: '#1a1d26'},
    {base: horizonY + h * 0.07, wMul: 44, hMul: 0.27, haze: 0.25, day: '#5d636c', night: '#121419'},
    {base: horizonY + h * 0.2, wMul: 64, hMul: 0.2, haze: 0, day: '#2c2d31', night: '#0a0b0d'},
  ];
  const rows = ROWS.map((R, row) => {
    const els: React.ReactNode[] = [];
    let x = -10 * u;
    let i = 0;
    const col = mixHex(mixHex(R.day, R.night, nt), hor, R.haze * (1 - nt * 0.5));
    const winDay = mixHex(col, '#1b1d22', 0.25);
    while (x < w + 10 * u) {
      const bw = R.wMul * u * (0.55 + h01(i, row, seed) * 0.9);
      const tall = Math.pow(h01(i, row + 7, seed), 1.8);
      const bh = R.hMul * h * (0.3 + tall * 1.1);
      const y0 = R.base - bh;
      els.push(<rect key={`b${i}`} x={x} y={y0} width={bw} height={bh + h} fill={col} />);
      // setback crown / antenna on the tall ones
      if (tall > 0.55) {
        els.push(<rect key={`c${i}`} x={x + bw * 0.2} y={y0 - bh * 0.08} width={bw * 0.6} height={bh * 0.08 + 1} fill={col} />);
        if (h01(i, 8, seed) > 0.5) els.push(<rect key={`a${i}`} x={x + bw * 0.48} y={y0 - bh * 0.2} width={Math.max(1, 1.5 * u)} height={bh * 0.12} fill={col} />);
      }
      // windows: dark panes by day, warm lights by night
      const step = (row === 2 ? 11 : 8) * u;
      const wx = Math.max(1, Math.floor((bw - 4 * u) / step));
      const wy = Math.floor((bh - 8 * u) / (step * 1.3));
      for (let a = 0; a < wx; a++)
        for (let b = 0; b < wy; b++) {
          const r = h01(i * 131 + a, b, seed + row * 17);
          const lit = r < nt * 0.5;
          if (!lit && (row === 0 || r > 0.75)) continue;
          els.push(<rect key={`w${i}-${a}-${b}`} x={x + 3 * u + a * step} y={y0 + 6 * u + b * step * 1.3} width={step * 0.45} height={step * 0.6} fill={lit ? '#f2c27a' : winDay} opacity={lit ? (0.5 + 0.45 * h01(a, b, i)) * (1 - R.haze * 0.5) : 0.35 * (1 - nt)} />);
        }
      x += bw + (h01(i, 3, seed) < 0.25 ? (4 + h01(i, 6, seed) * 14) * u : 0.8 * u);
      i++;
    }
    return els;
  });
  // time-lapse cloud streaks: their x follows the hour itself, so they freeze when the dial freezes and run back on a rewind
  const clouds = Array.from({length: 9}, (_, i) => {
    const y = h * (0.08 + h01(i, 1, seed) * 0.36);
    const len = w * (0.25 + h01(i, 2, seed) * 0.35);
    const x = ((h01(i, 3, seed) * w * 1.6 + hour * w * 0.22 * (0.7 + h01(i, 4, seed) * 0.6)) % (w * 1.6)) - w * 0.3;
    return <ellipse key={i} cx={x} cy={y} rx={len / 2} ry={(10 + h01(i, 5, seed) * 26) * u} fill={mixHex('#e9e6e0', '#3a3f4e', nt)} opacity={0.18 + 0.12 * (1 - nt)} filter={`url(#${id}b)`} />;
  });
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={zen} />
          <stop offset="0.62" stopColor={hor} />
        </linearGradient>
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor="#fff2d6" stopOpacity={0.55} />
          <stop offset="1" stopColor="#fff2d6" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}b`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={14 * u} />
        </filter>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}s)`} />
      {sunY < horizonY + 40 * u && (
        <>
          <circle cx={sunX} cy={sunY} r={160 * u} fill={`url(#${id}g)`} />
          <circle cx={sunX} cy={sunY} r={22 * u} fill="#fff4dc" opacity={0.9} />
        </>
      )}
      {moonY < horizonY && <circle cx={moonX} cy={moonY} r={12 * u} fill="#e8e4da" opacity={0.8 * nt} />}
      {Array.from({length: 60}, (_, i) => (
        <circle key={i} cx={h01(i, 9, seed) * w} cy={h01(i, 10, seed) * horizonY * 0.9} r={(0.8 + h01(i, 11, seed)) * u} fill="#fff" opacity={nt * 0.6 * h01(i, 12, seed)} />
      ))}
      {clouds}
      {rows[0]}
      {rows[1]}
      {rows[2]}
    </svg>
  );
};

const DayRingDial: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const id = useIdA('drdf');
  const hour = keyLerp(p.hourKeys, frame);
  const dimK = p.dimRanges.reduce((m, [a, b]) => Math.max(m, Math.min(seg(frame, a, a + 8), 1 - seg(frame, b, b + 8))), 0);
  const fadeIn = smooth(seg(frame, 4, 16));
  const alpha = fadeIn * (1 - 0.6 * dimK);
  const r = p.size * u;
  const m = (portrait ? 70 : 80) * u + r;
  const right = p.position.endsWith('right');
  const bottom = p.position.startsWith('bottom');
  const bar = !portrait && w / h > 1.6 ? (h - w / 1.85) / 2 : 0;
  const cx = right ? w - m : m;
  const cy = bottom ? h - m - bar - (p.readout ? 26 * u : 0) : m + bar;
  const clear = isClear(p.background);
  const plate = p.background === 'plate';
  // title (left-aligned, over a soft darkening — never on a box)
  const tA = smooth(seg(frame, 14, 30)) * (1 - smooth(seg(frame, D - 14, D - 2)));
  const tx = w * (portrait ? 0.08 : 0.092);
  const ty = h * (portrait ? 0.74 : 0.7);
  const fs = (portrait ? 44 : 52) * u;
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : plate ? '#000' : p.background}}>
      {plate && <CityPlate hour={hour} seed={p.seed} />}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`${id}sh`}>
            <stop offset="0" stopColor="#000" stopOpacity={0.5} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
        </defs>
        {(p.title || p.subtitle) && (
          <g opacity={tA}>
            <ellipse cx={tx + w * 0.18} cy={ty} rx={w * 0.34} ry={h * 0.16} fill={`url(#${id}sh)`} />
            <text x={tx} y={ty} fontFamily={la2Fonts.michroma} fontSize={fs} fill={CS.ink} letterSpacing={fs * 0.06}>
              {p.title}
            </text>
            <rect x={tx + 4 * u} y={ty + 26 * u} width={Math.min(w * 0.55, fs * 0.92 * p.title.length) * smooth(seg(frame, 20, 46))} height={2 * u} fill={p.accent} />
            <text x={tx + 4 * u} y={ty + 64 * u} fontFamily={la2Fonts.michroma} fontSize={17 * u} fill={CS.dim} letterSpacing={17 * u * 0.32}>
              {p.subtitle}
            </text>
          </g>
        )}
        <circle cx={cx} cy={cy} r={r * 2.2} fill={`url(#${id}sh)`} opacity={alpha * 0.8} />
        <DayDial cx={cx} cy={cy} r={r} hour={hour} alpha={alpha} accent={p.accent} dim={p.dimColor} u={u} readout={p.readout ? hhmm(hour) : undefined} />
      </svg>
      {!clear && <CsFinish w={w} h={h} frame={frame} id={id + 'f'} matte={plate} grain={plate ? 0.12 : 0} vignette={plate ? 0.45 : 0} />}
    </AbsoluteFill>
  );
};

export const dayRingDial = defineMotion<Props>({
  id: 'day-ring-dial',
  title: 'Day ring dial',
  category: 'hud',
  description:
    'A small thin 24-hour ring in the corner with an orange hand and a 3-hour arc that runs with the day of a time-lapse city (sky, sun and lit windows follow it), freezes and dims on a slow passage, then spins backwards on a rewind.',
  source: ['lemo-opuscar styles/city-symphony (MIT, LemoLab) — render.py dial_hour/draw_dial'],
  useFor: 'A "day in the life" clock for time-lapse films, shift / operations timelines or any time-of-day structure; overlay it (background transparent) on footage.',
  durationInFrames: 210,
  defaultProps: {
    hourKeys: [
      [0, 4.5],
      [70, 12],
      [100, 16],
      [140, 16],
      [168, 22.5],
      [194, 7],
      [210, 7.4],
    ],
    dimRanges: [[100, 140]],
    position: 'bottom-right',
    size: 62,
    accent: CS.sodium,
    dimColor: '#B9B4AC',
    readout: true,
    title: 'ONE DAY',
    subtitle: 'NORTHWIND · 24 HOURS',
    background: 'plate',
    seed: 3,
  },
  propDocs: {
    hourKeys: '[[frame, hour], ...] linearly interpolated; decreasing hours spin the hand backwards (rewind); hours may exceed 24',
    dimRanges: '[[fromFrame, toFrame], ...] where the dial dims to ~40 % (slow passage / brake)',
    position: 'bottom-right | bottom-left | top-right | top-left',
    size: 'ring radius in u (62 ≈ 11 % H diameter)',
    accent: 'hand / arc colour (sodium orange)',
    dimColor: 'ring, ticks and labels colour',
    readout: 'show hh:mm under the ring',
    title: 'left-aligned tracked title (empty = none)',
    subtitle: 'small tracked line under the title',
    background: "'plate' = procedural time-lapse city that follows the dial, 'transparent' = overlay, or any CSS colour",
    seed: 'skyline / clouds seed',
  },
  component: DayRingDial,
  tags: ['clock', 'dial', '24-hour', 'time of day', 'time-lapse', 'hyperlapse', 'day in the life', 'rewind', 'hud', 'overlay', 'city symphony', 'sodium', 'orange', 'minimal', 'documentary'],
});
