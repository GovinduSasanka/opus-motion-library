// Adapted from lemo-opuscar/styles/lidar-survey/demo/film.js point shader (cut plane, lift, rim) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {cl, eio3, h1, lf, mixC, mul32, seg, TAU} from '../../core/r2-la3-kit';
import {relP, RelCam} from '../../core/r2-la3b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  trees: number;
  seed: number;
  cutKeys: number[];
  stepFrames: number;
  startAt: number;
  ramp: string[];
  background: string;
  rulerSide: string;
  label: string;
  size: number;
  orbit: number;
};

type Pt = {x: number; y: number; z: number; r: number; crown: boolean};
const ZMAX = 32;

const LidarCanopyPeel: React.FC<Props> = ({trees, seed, cutKeys, stepFrames, startAt, ramp, background, rulerSide, label, size, orbit}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();

  const pts = React.useMemo(() => {
    const rnd = mul32(seed * 977 + 11);
    const out: Pt[] = [];
    const half = size / 2;
    // trees: trunk points + ellipsoidal crown shell/volume
    for (let i = 0; i < trees; i++) {
      const tx = (rnd() - 0.5) * size * 0.92;
      const ty = (rnd() - 0.5) * size * 0.92;
      const Ht = 12 + rnd() * 18;
      const cr = 2.6 + rnd() * 3.4;
      const cb = Ht * (0.38 + rnd() * 0.12);
      for (let k = 0; k < 8; k++) out.push({x: tx + (rnd() - 0.5) * 0.4, y: ty + (rnd() - 0.5) * 0.4, z: (cb * k) / 8, r: rnd(), crown: false});
      const nC = 520;
      for (let k = 0; k < nC; k++) {
        // points on/inside a crown ellipsoid, denser near the top surface (the lidar sees the canopy skin)
        const th = rnd() * TAU;
        const ph = Math.acos(1 - 2 * rnd());
        const rr = Math.cbrt(0.35 + 0.65 * rnd());
        const ex = Math.sin(ph) * Math.cos(th) * cr * rr;
        const ey = Math.sin(ph) * Math.sin(th) * cr * rr;
        const ez = Math.cos(ph) * ((Ht - cb) / 2) * rr;
        out.push({x: tx + ex, y: ty + ey, z: cb + (Ht - cb) / 2 + ez, r: rnd(), crown: true});
      }
    }
    // bare-earth scan stripes
    const lines = 30;
    for (let l = 0; l < lines; l++) {
      const yy = -half + ((l + 0.5) * size) / lines;
      for (let k = 0; k < 108; k++) out.push({x: -half + (k / 107) * size, y: yy, z: Math.max(0, 0.25 * Math.sin(k * 0.19 + l) + 0.2 * rnd()), r: rnd(), crown: false});
    }
    return out;
  }, [trees, seed, size]);

  // cut plane steps down on the beat: eased moves with short holds
  const keys = cutKeys.length ? cutKeys : [30, 0];
  const local = Math.max(0, frame - startAt);
  const idx = Math.min(keys.length - 1, Math.floor(local / stepFrames));
  const nxt = Math.min(keys.length - 1, idx + 1);
  const cut = frame < startAt ? keys[0] : keys[idx] + (keys[nxt] - keys[idx]) * eio3(seg(local - idx * stepFrames, 0, stepFrames * 0.45));

  const yaw = 0.55 + (frame / 30) * orbit;
  const el = (38 * Math.PI) / 180;
  const k = Math.min((w * (portrait ? 0.86 : 0.54)) / (size * 1.38), (h * (portrait ? 0.62 : 0.82)) / (size * 0.62 * Math.sin(el) + ZMAX * Math.cos(el)));
  const cx = rulerSide === 'left' ? w * (portrait ? 0.54 : 0.56) : w * (portrait ? 0.46 : 0.42);
  const cam: RelCam = {yaw, el, k, cx, cy: h * (portrait ? 0.62 : 0.6), };

  const rampAt = (q: number) => {
    const c = ramp.length >= 3 ? ramp : ['#1F3F35', '#5C9A7A', '#E2F3DC'];
    const v = cl(q);
    return v < 0.5 ? mixC(c[0], c[1], v * 2) : mixC(c[1], c[2], (v - 0.5) * 2);
  };

  // bin points by colour and alpha so the whole cloud is a few dozen paths
  const bins = new Map<string, {d: string; col: string; a: number; size: number}>();
  const add = (col: string, a: number, sz: number, x: number, y: number) => {
    const aq = Math.max(2, Math.min(5, Math.round(a * 5)));
    const key = `${col}|${aq}|${sz}`;
    const b = bins.get(key) ?? {d: '', col, a: aq / 5, size: sz};
    b.d += `M${x.toFixed(1)} ${y.toFixed(1)}h0.01`;
    bins.set(key, b);
  };
  const hist = new Array(Math.ceil(ZMAX / 2)).fill(0);
  const histAll = new Array(Math.ceil(ZMAX / 2)).fill(0);
  for (const p of pts) {
    if (p.crown) histAll[Math.min(hist.length - 1, Math.floor(p.z / 2))]++;
    const appear = seg(frame, p.r * 18, p.r * 18 + 14);
    if (appear <= 0) continue;
    const a = p.z - cut;
    let z = p.z;
    let fade = 1;
    let col = rampAt(p.z / 26);
    let sz = 2.3;
    if (a > 0) {
      const aa = Math.min(a, 5);
      z = p.z + 2.2 * aa + 0.35 * aa * aa;
      fade = 1 - cl(a / 5);
      col = mixC(col, '#FFFFFF', cl(a / 1.4));
      if (fade <= 0.02) continue;
      sz = 2.8;
    } else {
      if (p.crown) hist[Math.min(hist.length - 1, Math.floor(p.z / 2))]++;
      if (a > -0.45) {
        col = mixC(col, '#EFFFF0', 0.75 * (1 - -a / 0.45));
        sz = 3.6;
      }
    }
    const s = relP(cam, p.x, p.y, z);
    const depth = cl((s[2] + size * 0.7) / (size * 1.4));
    add(col, appear * fade * (0.62 + 0.38 * (1 - depth)), sz, s[0], s[1]);
  }

  // rim ring: the plane's outline where it meets the trees
  const half = size / 2;
  const corner = ([[-half, -half], [half, -half], [half, half], [-half, half]] as [number, number][]).map(([x, y]) => relP(cam, x, y, cut));
  const planePts = corner.map((c) => `${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const base = ([[-half, -half], [half, -half], [half, half], [-half, half]] as [number, number][]).map(([x, y]) => relP(cam, x, y, 0));
  const basePts = base.map((c) => `${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');

  // ruler with canopy-height histogram
  const left = rulerSide === 'left';
  const rx = left ? 96 * u : w - 96 * u;
  const rTop = h * 0.14;
  const rBot = h * 0.86;
  const zy = (m: number) => rBot - (m / ZMAX) * (rBot - rTop);
  const maxH = Math.max(...histAll, 1);
  const hw = (portrait ? 70 : 150) * u;
  const dir = left ? 1 : -1;

  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${cx / w * 100}% 58%, ${mixC(background, '#1F4A3C', 0.35)} 0%, ${background} 62%)`}} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="lcp-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={5 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polygon points={basePts} fill="none" stroke={ramp[1] ?? '#5C9A7A'} strokeOpacity="0.25" strokeWidth={1.2 * u} />
        <polygon points={planePts} fill={ramp[2] ?? '#E2F3DC'} fillOpacity="0.045" stroke="#EFFFF0" strokeOpacity="0.85" strokeWidth={1.8 * u} filter="url(#lcp-glow)" />
        <g filter="url(#lcp-glow)">
          {[...bins.values()].map((b, i) => (
            <path key={i} d={b.d} stroke={b.col} strokeOpacity={b.a} strokeWidth={b.size * u} strokeLinecap="round" fill="none" />
          ))}
        </g>
        {/* ruler */}
        <path d={`M${rx} ${rTop}V${rBot}`} stroke="#E2F3DC" strokeOpacity="0.5" strokeWidth={1.5 * u} />
        {Array.from({length: Math.floor(ZMAX / 5) + 1}, (_, i) => i * 5).map((m) => (
          <g key={m}>
            <path d={`M${rx} ${zy(m)}h${dir * 12 * u}`} stroke="#E2F3DC" strokeOpacity="0.6" strokeWidth={1.5 * u} />
            <text x={rx + dir * 20 * u} y={zy(m) + 6 * u} fill="#E2F3DC" fillOpacity="0.6" fontFamily={lf.techMono} fontSize={17 * u} textAnchor={left ? 'start' : 'end'}>
              {m}
            </text>
          </g>
        ))}
        {hist.map((n, i) => (
          <rect
            key={i}
            x={left ? rx + 58 * u : rx - 58 * u - (n / maxH) * hw}
            y={zy(i * 2 + 2) + 1.5 * u}
            width={(n / maxH) * hw}
            height={(zy(0) - zy(2)) - 3 * u}
            fill={rampAt((i * 2 + 1) / 26)}
            opacity={0.8}
          />
        ))}
        <g transform={`translate(${rx} ${zy(cut)})`}>
          <path d={`M0 0L${dir * 14 * u} ${-8 * u}V${8 * u}Z`} fill="#EFFFF0" />
          <path d={`M${dir * 14 * u} 0H${dir * (portrait ? 150 : 240) * u}`} stroke="#EFFFF0" strokeOpacity="0.35" strokeWidth={1 * u} strokeDasharray={`${4 * u} ${6 * u}`} />
          <text x={dir * 130 * u + (left ? 0 : 0)} y={-12 * u} fill="#EFFFF0" fontFamily={lf.barlowC} fontWeight={300} fontSize={34 * u} textAnchor={left ? 'start' : 'end'} style={{letterSpacing: 1 * u}}>
            {cut.toFixed(1)} m
          </text>
        </g>
        <text x={left ? w - 64 * u : 64 * u} y={h - 56 * u} fill="#E2F3DC" fillOpacity="0.7" fontFamily={lf.barlowC} fontWeight={300} fontSize={26 * u} textAnchor={left ? 'end' : 'start'} style={{letterSpacing: 5 * u}}>
          {label.toUpperCase()}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

export const lidarCanopyPeel = defineMotion<Props>({
  id: 'lidar-canopy-peel',
  title: 'Lidar canopy peel',
  category: '3d',
  description:
    'A dense teal-to-pale point-cloud forest. A horizontal cut plane steps down on the beat; returns above it lift, glow white and vanish, a bright rim marks where the plane meets the crowns, and a height ruler with a canopy-height histogram tracks the cut. Bare-earth scan stripes remain at the end. Procedural seeded forest, slow orbit camera.',
  source: ['lemo-opuscar styles/lidar-survey/demo/film.js point shader (MIT, LemoLab)', 'lemo-styles-a lidar-survey: lidar-canopy-peel'],
  useFor: 'Archaeology / forestry / engineering reveals; "strip away the noise to find what matters" in product and brand stories.',
  durationInFrames: 210,
  defaultProps: {trees: 26, seed: 7, cutKeys: [30, 25, 20, 15, 10, 5, 0], stepFrames: 24, startAt: 26, ramp: ['#1F3F35', '#5C9A7A', '#E2F3DC'], background: '#05080A', rulerSide: 'right', label: 'Canopy returns, plot 07', size: 80, orbit: 0.07},
  propDocs: {
    trees: 'number of procedural trees',
    seed: 'forest seed',
    cutKeys: 'cut-plane heights in metres, one step per entry (30 → 0)',
    stepFrames: 'frames per step (the move takes 45 % of it, then holds)',
    startAt: 'frame the first step starts',
    ramp: 'three height-ramp colours low → mid → high',
    background: 'backdrop colour',
    rulerSide: 'right | left',
    label: 'caption (small caps, bottom corner)',
    size: 'plot edge length in metres',
    orbit: 'camera orbit speed in rad/s',
  },
  component: LidarCanopyPeel,
  tags: ['lidar', 'point cloud', 'forest', 'canopy', 'survey', 'scan', 'cut plane', 'strip away', 'reveal', 'ruler', 'histogram', 'archaeology', 'forestry', 'data'],
});
