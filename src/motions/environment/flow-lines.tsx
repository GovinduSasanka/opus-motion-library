import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {BlurFilter, CloudPuff, TAU, hash01, isTransparent, ridgePath, wrap} from '../../core/environment-kit';
import {n2} from '../../core/random';
import {smoothOpen} from '../../core/shapes';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Flow lines — four wavy-streamline looks.
 * wind  (video1 wind-streamlines): 6-8 long thin sine lines (1.5 px, #5a6fae, 70 %) crossing the sky,
 *   some ending in a 1.25-turn Archimedean curl (r 2 % W); a 1-3 % H, λ 40-70 % W, drift left
 *   1.5 % W/s, draw on / erase with dash offset, animated on twos.
 * heat  (video6 heat-wiggle-lines): ~12 rising white sine strands (60 %), phase scrolling upward at
 *   1.5 cycles/s, fading at the top — over a hot desert road with a shimmering mirage.
 * steam (video16 steam-wisps): 6-10 blurred white ribbons (stroke 20-40 px, blur 12 px, 15-30 %)
 *   whose control points ride noise upward ~40 px/s, fading over ~2 s and respawning.
 * waves (video20 wave-line-wipe): 14-18 braided ink sine rows (A 1.5-3 % H, λ 20-35 % W, + 0.3A
 *   2nd harmonic), scrolling 15 % W/s, pencil-wobbled on paper, 0.35 s fade in / out.
 */
type Props = {
  mode: 'wind' | 'heat' | 'steam' | 'waves' | 'ink-curls';
  background: string;
  backdrop: boolean;
  color: string;
  count: number;
  speed: number;
  amplitude: number;
  weight: number;
  curlProbability: number;
  sources: number[][];
  fade: boolean;
  seed: number;
  /** ink-curls mode */
  followPath: number[][];
  spawnEvery: number;
  drawFrames: number;
  life: number;
  curlSize: number;
  dabs: number;
  dabColors: string[];
};

const COLORS = {wind: '#5A6FAE', heat: '#FFFFFF', steam: '#FFFFFF', waves: '#2B2622', 'ink-curls': '#2B2520'};
const COUNTS = {wind: 7, heat: 18, steam: 8, waves: 16, 'ink-curls': 12};

const WindSky: React.FC<{t: number}> = ({t}) => {
  const {w, h, u, portrait} = useStage();
  const hz = h * (portrait ? 0.68 : 0.62);
  return (
    <g>
      <defs>
        <linearGradient id="fl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86ABC8" />
          <stop offset="0.75" stopColor="#A2C0D4" />
          <stop offset="1" stopColor="#C2D6E0" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="url(#fl-sky)" />
      <CloudPuff x={wrap(w * 0.15 - t * 14 * u, w * 1.4) - w * 0.15} y={h * 0.16} s={90 * u} seed={4} shade="#DCE7EE" />
      <CloudPuff x={wrap(w * 0.8 - t * 10 * u, w * 1.4) - w * 0.15} y={h * 0.3} s={70 * u} seed={5} shade="#DCE7EE" />
      <path d={ridgePath('flm', -10, w + 10, hz - 40 * u, 60 * u, 600 * u, h, {octaves: 2, step: 10 * u})} fill="#8EA9A4" />
      <path d={ridgePath('flm2', -10, w + 10, hz - 4 * u, 30 * u, 420 * u, h, {octaves: 2, step: 10 * u})} fill="#75938C" />
      <rect y={hz + 12 * u} width={w} height={h} fill="#8BAD7D" />
      <path d={`M 0 ${hz + 60 * u} Q ${w * 0.4} ${hz + 20 * u} ${w} ${hz + 90 * u} L ${w} ${h} L 0 ${h} Z`} fill="#79A958" />
      <path d={`M 0 ${h * 0.92} Q ${w * 0.5} ${hz + 120 * u} ${w} ${h * 0.86} L ${w} ${h} L 0 ${h} Z`} fill="#BFBA79" opacity={0.85} />
    </g>
  );
};

const Desert: React.FC<{frame: number; seed: number}> = ({frame, seed}) => {
  const {w, h, u, portrait, cx} = useStage();
  const hz = h * (portrait ? 0.6 : 0.56);
  const shimmerSeed = Math.floor(frame / 2) % 50;
  return (
    <g>
      <defs>
        <linearGradient id="fl-dsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9A55B" />
          <stop offset="0.6" stopColor="#F3C98A" />
          <stop offset="1" stopColor="#F8E4BC" />
        </linearGradient>
        <linearGradient id="fl-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DDA266" />
          <stop offset="1" stopColor="#C07A42" />
        </linearGradient>
        <radialGradient id="fl-sun">
          <stop offset="0" stopColor="#FFF8E4" />
          <stop offset="0.3" stopColor="#FFF1CC" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFE0A0" stopOpacity={0} />
        </radialGradient>
        <filter id="fl-shimmer" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.004 / u} ${0.09 / u}`} numOctaves={2} seed={shimmerSeed} />
          <feDisplacementMap in="SourceGraphic" scale={7 * u} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <rect width={w} height={h} fill="url(#fl-dsky)" />
      <circle cx={w * 0.74} cy={h * 0.2} r={Math.min(w, h) * 0.22} fill="url(#fl-sun)" />
      <circle cx={w * 0.74} cy={h * 0.2} r={Math.min(w, h) * 0.06} fill="#FFF9EC" />
      <g filter="url(#fl-shimmer)">
        <path d={ridgePath('mesa' + seed, -10, w + 10, hz - 60 * u, 70 * u, 300 * u, hz + 6 * u, {ridged: false, octaves: 1, step: 4 * u})} fill="#C98A5A" opacity={0.75} />
        <path d={`M ${-10} ${hz - 30 * u} L ${w * 0.12} ${hz - 30 * u} L ${w * 0.14} ${hz - 90 * u} L ${w * 0.26} ${hz - 90 * u} L ${w * 0.28} ${hz - 30 * u} L ${w * 0.62} ${hz - 20 * u} L ${w * 0.64} ${hz - 70 * u} L ${w * 0.7} ${hz - 70 * u} L ${w * 0.72} ${hz - 20 * u} L ${w + 10} ${hz - 20 * u} L ${w + 10} ${hz + 6 * u} L -10 ${hz + 6 * u} Z`} fill="#B5764D" opacity={0.85} />
        <rect x={cx - w * 0.2} y={hz - 2 * u} width={w * 0.4} height={14 * u} fill="#D6E2E6" opacity={0.55} />
      </g>
      <rect y={hz} width={w} height={h - hz} fill="url(#fl-sand)" />
      <path d={`M ${cx - 10 * u} ${hz} L ${cx + 10 * u} ${hz} L ${cx + w * 0.42} ${h} L ${cx - w * 0.42} ${h} Z`} fill="#6E5A50" />
      {Array.from({length: 7}, (_, k) => {
        const a = Math.pow(k / 7, 1.8);
        const b = Math.pow((k + 0.45) / 7, 1.8);
        const y0 = hz + (h - hz) * a;
        const y1 = hz + (h - hz) * b;
        const w0 = 1.5 * u + 10 * u * a;
        const w1 = 1.5 * u + 10 * u * b;
        return <path key={k} d={`M ${cx - w0} ${y0} L ${cx + w0} ${y0} L ${cx + w1} ${y1} L ${cx - w1} ${y1} Z`} fill="#F1D9A6" />;
      })}
    </g>
  );
};

const Kitchen: React.FC<{sx: number; sy: number}> = ({sx, sy}) => {
  const {w, h, u, cx} = useStage();
  const bw = Math.min(w, h) * 0.3;
  const tableY = sy + bw * 0.12;
  return (
    <g>
      <defs>
        <linearGradient id="fl-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24170F" />
          <stop offset="1" stopColor="#3A2618" />
        </linearGradient>
        <radialGradient id="fl-lamp" cx="0.5" cy="0" r="0.8">
          <stop offset="0" stopColor="#FFCF8A" stopOpacity={0.45} />
          <stop offset="1" stopColor="#FFCF8A" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="fl-table" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A4E2E" />
          <stop offset="1" stopColor="#3E2616" />
        </linearGradient>
        <linearGradient id="fl-bowl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#CFC4B2" />
          <stop offset="0.4" stopColor="#F4EEE3" />
          <stop offset="1" stopColor="#B9AD9A" />
        </linearGradient>
        <BlurFilter id="fl-sh" std={10 * u} />
      </defs>
      <rect width={w} height={h} fill="url(#fl-wall)" />
      <ellipse cx={cx} cy={0} rx={w * 0.6} ry={h * 0.85} fill="url(#fl-lamp)" />
      <rect y={tableY} width={w} height={h - tableY} fill="url(#fl-table)" />
      <rect y={tableY} width={w} height={4 * u} fill="#9A6A44" />
      <ellipse cx={sx} cy={sy + bw * 0.42} rx={bw * 0.62} ry={bw * 0.1} fill="#000" opacity={0.45} filter="url(#fl-sh)" />
      <path d={`M ${sx - bw / 2} ${sy} Q ${sx - bw * 0.46} ${sy + bw * 0.4} ${sx - bw * 0.16} ${sy + bw * 0.42} L ${sx + bw * 0.16} ${sy + bw * 0.42} Q ${sx + bw * 0.46} ${sy + bw * 0.4} ${sx + bw / 2} ${sy} Z`} fill="url(#fl-bowl)" />
      <ellipse cx={sx} cy={sy} rx={bw / 2} ry={bw * 0.09} fill="#F6F1E8" />
      <ellipse cx={sx} cy={sy + bw * 0.01} rx={bw * 0.45} ry={bw * 0.07} fill="#B8612A" />
      <ellipse cx={sx - bw * 0.1} cy={sy} rx={bw * 0.08} ry={bw * 0.02} fill="#E9A15A" opacity={0.8} />
      <ellipse cx={sx + bw * 0.12} cy={sy + bw * 0.02} rx={bw * 0.06} ry={bw * 0.015} fill="#7BA24E" opacity={0.9} />
    </g>
  );
};

const FlowLines: React.FC<Props> = ({mode, background, backdrop, color, count, speed, amplitude, weight, curlProbability, sources, fade, seed, followPath, spawnEvery, drawFrames, life, curlSize, dabs, dabColors}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const col = color || COLORS[mode];
  const n = count > 0 ? count : COUNTS[mode];
  const els: React.ReactNode[] = [];
  let backdropEl: React.ReactNode = null;
  let groupFilter: string | undefined;

  if (mode === 'wind') {
    const fq = Math.floor(frame / 2) * 2; // on twos
    const t = (fq / fps) * speed;
    if (scene) backdropEl = <WindSky t={t} />;
    for (let i = 0; i < n; i++) {
      const P = 3.4 + 1.2 * hash01(seed, i, 1);
      const tt = t - i * 0.42;
      if (tt < 0) continue;
      const c = Math.floor(tt / P);
      const p = (tt - c * P) / P;
      const hs = (k: number) => hash01(seed, i, c, k);
      const y0 = (scene ? 0.08 + (portrait ? 0.5 : 0.45) * hs(1) : 0.1 + 0.75 * hs(1)) * h;
      const L = (0.45 + 0.35 * hs(2)) * w;
      const a = (0.01 + 0.02 * hs(3)) * h * amplitude;
      const lam = (0.4 + 0.3 * hs(4)) * Math.max(w, h * 0.8);
      const ph = hs(5) * TAU;
      const drift = 0.03 * w * (tt - c * P);
      const xh = (0.1 + 0.6 * hs(6)) * w - drift;
      const pts: [number, number][] = [];
      for (let x = xh + L; x >= xh; x -= 10 * u) pts.push([x, y0 + a * Math.sin((TAU * x) / lam + t * 1.2 + ph)]);
      const end = pts[pts.length - 1];
      if (hs(7) < curlProbability) {
        // 1.25-turn Archimedean curl continuing leftward, rolling upward
        const R = 0.02 * w * (0.8 + 0.5 * hs(8));
        const ccx = end[0];
        const ccy = end[1] - R;
        for (let k = 1; k <= 40; k++) {
          const th = Math.PI / 2 + (k / 40) * 2.5 * Math.PI;
          const r = R * (1 - 0.72 * (k / 40));
          pts.push([ccx + Math.cos(th) * r, ccy + Math.sin(th) * r]);
        }
      }
      const b = ease.out(Math.min(1, p / 0.35));
      const e = ease.in(Math.max(0, (p - 0.65) / 0.35));
      if (b - e <= 0.001) continue;
      els.push(<path key={i} d={smoothOpen(pts)} pathLength={1} strokeDasharray={`${(b - e).toFixed(4)} 3`} strokeDashoffset={(-e).toFixed(4)} stroke={col} strokeWidth={2.8 * u * weight} fill="none" strokeLinecap="round" opacity={0.75} />);
    }
  } else if (mode === 'heat') {
    const t = (frame / fps) * speed;
    if (scene) backdropEl = <Desert frame={frame} seed={seed} />;
    const hz = h * (portrait ? 0.6 : 0.56);
    const nn = Math.round(n * Math.max(0.6, w / 1920));
    for (let i = 0; i < nn; i++) {
      const P = 1.8 + 1.0 * hash01(seed, i, 1);
      const tt = t + hash01(seed, i, 2) * P;
      const c = Math.floor(tt / P);
      const p = (tt - c * P) / P;
      const hs = (k: number) => hash01(seed, i, c, k);
      const x0 = (0.06 + 0.88 * ((i + hs(1)) / nn)) * w;
      const by = (scene ? hz + (h - hz) * (0.1 + 0.5 * hs(2)) : h * (0.55 + 0.4 * hs(2))) - 50 * u * p;
      const H = (170 + 170 * hs(3)) * u * (portrait ? 1.2 : 1);
      const lam = (55 + 25 * hs(4)) * u;
      const ph = hs(5) * TAU;
      const pts: [number, number][] = [];
      for (let d = 0; d <= H; d += 6 * u) {
        const A = (5 + 13 * (d / H)) * u * amplitude;
        pts.push([x0 + A * Math.sin((TAU * d) / lam + TAU * 1.5 * t + ph), by - d]);
      }
      const o = Math.min(1, Math.sin(Math.PI * p) * 1.3) * 0.65;
      els.push(
        <g key={i}>
          <defs>
            <linearGradient id={`fl-h${i}`} x1={0} y1={by} x2={0} y2={by - H} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={col} stopOpacity={0} />
              <stop offset="0.2" stopColor={col} stopOpacity={1} />
              <stop offset="0.6" stopColor={col} stopOpacity={0.7} />
              <stop offset="1" stopColor={col} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={smoothOpen(pts)} stroke={`url(#fl-h${i})`} strokeWidth={2.6 * u * weight} fill="none" strokeLinecap="round" opacity={o} />
        </g>,
      );
    }
  } else if (mode === 'steam') {
    const t = (frame / fps) * speed;
    const srcs = sources && sources.length ? sources : [[0.5, portrait ? 0.62 : 0.66]];
    if (scene) backdropEl = <Kitchen sx={srcs[0][0] * w} sy={srcs[0][1] * h} />;
    groupFilter = 'url(#fl-steamblur)';
    const bw = Math.min(w, h) * 0.3;
    srcs.forEach((s, si) => {
      for (let j = 0; j < n; j++) {
        const P = 2.4 + 0.8 * hash01(seed, si, j, 1);
        const tt = t + (j / n) * P;
        const c = Math.floor(tt / P);
        const a = tt - c * P;
        const hs = (k: number) => hash01(seed, si, j, c, k);
        const sx = s[0] * w + (hs(1) - 0.5) * bw * 0.6;
        const sy = s[1] * h - 6 * u;
        const rise = 40 * u * 2.2 * a;
        const Hmax = (260 + 160 * hs(2)) * u;
        const pts: [number, number][] = [];
        for (let k = 0; k <= 6; k++) {
          const d = (k / 6) * Hmax * (0.35 + 0.65 * Math.min(1, a / 0.8)) + rise * (k / 6);
          const sway = 70 * u * amplitude * (d / Hmax) * n2('st' + seed + j, d / (220 * u) - t * 0.35, hs(3) * 10);
          pts.push([sx + sway + 12 * u * Math.sin(d / (60 * u) + t * 1.5 + j), sy - d]);
        }
        const env = Math.min(1, a / 0.4) * Math.max(0, 1 - a / P) ** 0.8;
        const o = (0.15 + 0.15 * hs(4)) * env;
        const sw = (20 + 20 * hs(5)) * u * weight;
        els.push(<path key={`${si}-${j}`} d={smoothOpen(pts)} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={o} />);
        els.push(<path key={`${si}-${j}c`} d={smoothOpen(pts.slice(0, 5))} stroke={col} strokeWidth={sw * 0.4} fill="none" strokeLinecap="round" opacity={o * 0.8} />);
      }
    });
  } else if (mode === 'ink-curls') {
    // wind drawn as little "~@" ink curls that spawn behind a moving object, draw on, then erase from the tail;
    // a trail of leaf-shaped wash dabs tumbles after
    if (scene) backdropEl = null;
    const D = durationInFrames;
    const path = followPath.length >= 2 ? followPath : [[0.1, 0.55], [0.3, 0.42], [0.5, 0.52], [0.7, 0.4], [0.9, 0.48]];
    const posAtF = (f: number) => {
      const q = Math.max(0, Math.min(1, (f - 4) / Math.max(1, D - 24))) * (path.length - 1);
      const i = Math.min(path.length - 2, Math.floor(q));
      const k = q - i;
      const kk = k * k * (3 - 2 * k);
      return [(path[i][0] + (path[i + 1][0] - path[i][0]) * kk) * w, (path[i][1] + (path[i + 1][1] - path[i][1]) * kk) * h] as const;
    };
    const every = Math.max(2, spawnEvery);
    const first = 6;
    const nCurl = Math.floor((D - first) / every);
    const R0 = 0.04 * Math.min(w, h * 1.4) * curlSize;
    const heroP = posAtF(frame);
    // the hero: a small ink-dot object the curls trail behind
    els.push(<circle key="hero" cx={heroP[0]} cy={heroP[1]} r={9 * u} fill={col} />);
    for (let k = 0; k < nCurl; k++) {
      const s0 = first + k * every;
      if (frame < s0 || frame > s0 + life + 6) continue;
      const [px, py] = posAtF(s0);
      const [qx, qy] = posAtF(s0 + 3);
      const ang = Math.atan2(qy - py, qx - px);
      const L = R0 * (3.2 + 1.2 * hash01(seed, k, 1));
      const loopR = R0 * (0.55 + 0.25 * hash01(seed, k, 2));
      // local curl: wavy line going back from the hero then a 1.25 turn loop at the far end
      const pts: [number, number][] = [];
      for (let i = 0; i <= 18; i++) {
        const q = i / 18;
        pts.push([-q * L, Math.sin(q * Math.PI * 2.2) * R0 * 0.28 * amplitude]);
      }
      for (let i = 1; i <= 24; i++) {
        const th = (i / 24) * TAU * 1.25;
        const rr = loopR * (1 - 0.4 * (i / 24));
        const aa = -Math.PI / 2 - th;
        pts.push([-L + rr * Math.cos(aa), loopR + rr * Math.sin(aa)]);
      }
      const cs = Math.cos(ang);
      const sn = Math.sin(ang);
      const world: [number, number][] = pts.map(([x, y]) => [px + x * cs - y * sn, py + x * sn + y * cs]);
      const age = frame - s0;
      const drawP = Math.min(1, age / Math.max(1, drawFrames));
      const eraseP = Math.max(0, Math.min(1, (age - drawFrames) / Math.max(1, life - drawFrames)));
      const d = smoothOpen(world);
      els.push(
        <path key={`c${k}`} d={d} pathLength={1} stroke={col} strokeWidth={(2.4 + 1.4 * hash01(seed, k, 3)) * u * weight} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${Math.max(0.0001, drawP - eraseP)} 2`} strokeDashoffset={-eraseP} opacity={drawP > 0 ? 1 : 0} />,
      );
    }
    // leaf dabs: tumble and fall along the wake of the hero
    const nDab = Math.max(0, Math.round(dabs));
    const cols = dabColors.length ? dabColors : ['#6E9A4A', '#A7B84C', '#D98B3A', '#8DB07A'];
    for (let j = 0; j < nDab; j++) {
      const s0 = first + 4 + Math.floor(j * (D - first - 30) / Math.max(1, nDab));
      const age = frame - s0;
      if (age < 0 || age > 54) continue;
      const [px, py] = posAtF(s0);
      const k = age / 54;
      const x = px - 40 * u * (1 + hash01(seed, j, 7)) * k + 14 * u * Math.sin(age * 0.3 + j);
      const y = py + (60 + 80 * hash01(seed, j, 8)) * u * k * k + 10 * u * k;
      const sz = (5 + 15 * hash01(seed, j, 9)) * u;
      els.push(<ellipse key={`d${j}`} cx={x} cy={y} rx={sz} ry={sz * 0.5} fill={cols[j % cols.length]} opacity={0.8 * (1 - k * k)} transform={`rotate(${(age * 9 * (hash01(seed, j, 10) + 0.5)) % 360} ${x} ${y})`} />);
    }
  } else {
    const t = (frame / fps) * speed;
    if (scene) backdropEl = null;
    groupFilter = 'url(#fl-pencil)';
    const bands = Math.max(1, Math.round(n / 2));
    const scroll = 0.15 * w * t;
    for (let i = 0; i < n; i++) {
      const band = i % bands;
      const k = Math.floor(i / bands);
      const y0 = ((band + 0.5) / bands) * h;
      const A = (0.015 + 0.015 * hash01(seed, i, 1)) * h * amplitude;
      const lam = (0.2 + 0.15 * hash01(seed, band, 2)) * Math.max(w, h * 0.7);
      const ph = hash01(seed, band, 3) * TAU + k * Math.PI + (hash01(seed, i, 4) - 0.5) * 0.6;
      const pts: [number, number][] = [];
      for (let x = -20 * u; x <= w + 20 * u; x += 12 * u) {
        const xx = x + scroll * (1 + 0.1 * k);
        pts.push([x, y0 + A * Math.sin((TAU * xx) / lam + ph) + 0.3 * A * Math.sin((TAU * xx * 2.3) / lam + ph * 1.7)]);
      }
      const sw = (1.5 + 1.5 * hash01(seed, i, 5)) * u * weight;
      els.push(<path key={i} d={smoothOpen(pts)} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.5 + 0.4 * hash01(seed, i, 6)} />);
    }
  }

  const env = fade && mode === 'waves' ? Math.min(prog(frame, 0, 11, ease.out), 1 - prog(frame, durationInFrames - 11, durationInFrames, ease.in)) : 1;
  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      {scene && (mode === 'waves' || mode === 'ink-curls') && (
        <AbsoluteFill style={{background: mode === 'ink-curls' ? '#F1EAD8' : '#ECE4D7'}}>
          <Svg>
            <defs>
              <BlurFilter id="fl-wash" std={60 * u} />
            </defs>
            <g filter="url(#fl-wash)">
              <ellipse cx={w * 0.3} cy={h * 0.25} rx={w * 0.35} ry={h * 0.22} fill="#BCD3DC" opacity={0.6} />
              <ellipse cx={w * 0.78} cy={h * 0.7} rx={w * 0.3} ry={h * 0.25} fill="#E8C7B0" opacity={0.55} />
            </g>
          </Svg>
          <PaperTexture opacity={0.4} />
        </AbsoluteFill>
      )}
      {scene && backdropEl && <Svg>{backdropEl}</Svg>}
      <Svg>
        <defs>
          <BlurFilter id="fl-steamblur" std={12 * u} />
          <filter id="fl-pencil" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={0.04 / u} numOctaves={2} seed={Math.floor(frame / 3) % 7} />
            <feDisplacementMap in="SourceGraphic" scale={2.5 * u} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={groupFilter} opacity={env}>
          {els}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const flowLines = defineMotion<Props>({
  id: 'flow-lines',
  title: 'Flow lines (wind / heat / steam / waves)',
  category: 'environment',
  description: 'Wavy streamlines: wind lines with end curls across a sky, rising heat wiggles over a desert road, soft steam wisps from a bowl, or braided pencil wave rows on paper. Overlay-capable.',
  source: ['video1 15.0-18.33', 'video6 heat-wiggle-lines', 'video16 65.8-74.2', 'video20 182.5-183.7'],
  useFor: 'Show air, heat, smell, sound or time: breeze over a landscape, a hot day, a hot meal, a ripple/time wipe.',
  durationInFrames: 180,
  defaultProps: {
    mode: 'wind',
    background: '#A2C0D4',
    backdrop: true,
    color: '',
    count: 0,
    speed: 1,
    amplitude: 1,
    weight: 1,
    curlProbability: 0.5,
    sources: [],
    fade: true,
    seed: 1,
    followPath: [],
    spawnEvery: 12,
    drawFrames: 12,
    life: 42,
    curlSize: 1,
    dabs: 8,
    dabColors: [],
  },
  propDocs: {
    mode: '"wind", "heat", "steam", "waves" or "ink-curls" (wind drawn as ~@ ink curls spawning behind a moving object that draw on, then erase from the tail, with falling leaf dabs)',
    background: 'CSS background; "transparent" = overlay (lines only)',
    backdrop: 'paint the mode scene (sky / desert road / kitchen bowl / paper)',
    color: 'line colour; empty = mode default (#5A6FAE / white / white / ink #2B2622)',
    count: 'lines per frame; 0 = mode default (7 / 16 / 8 per source / 16)',
    speed: 'animation speed multiplier',
    amplitude: 'wave amplitude multiplier',
    weight: 'stroke width multiplier',
    curlProbability: 'wind: chance a line ends in a curl',
    sources: 'steam: [[x, y], ...] emitter positions as frame fractions (default bowl at [0.5, 0.66])',
    fade: 'waves: 0.35 s fade in at the start and out at the end (wipe use)',
    seed: 'random seed',
    followPath: 'ink-curls: [[x, y], ...] frame fractions the hero object travels along (empty = a gentle wave left to right)',
    spawnEvery: 'ink-curls: frames between curl spawns (one per beat, e.g. 12)',
    drawFrames: 'ink-curls: frames a curl takes to draw on (0.4 s = 12)',
    life: 'ink-curls: frames before a curl has erased itself from its tail',
    curlSize: 'ink-curls: curl size multiplier',
    dabs: 'ink-curls: number of leaf-shaped wash dabs tumbling after the hero',
    dabColors: 'ink-curls: foliage colours for the dabs (empty = greens / ochre)',
  },
  component: FlowLines,
  tags: ['wind', 'heat', 'steam', 'waves', 'lines', 'air', 'overlay', 'ambience', 'ink', 'curls', 'ink-curls', 'sketch', 'leaves', 'illustrated'],
});
