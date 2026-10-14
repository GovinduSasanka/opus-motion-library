import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {BlurFilter, PixelateFilter, TAU, areaK, hash01, isTransparent, ridgePath, wrap} from '../../core/environment-kit';
import {n2} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Snowfall (video2 snowfall-drift, video21 blizzard-whiteout-dissolve).
 * drift: 3 depth layers of round flakes (far small/slow, near large/fast/blurred) drifting
 *   diagonally down-right with a ±3 px sine sway, over a dusk railway-crossing landscape.
 * blizzard: ~600 pixel flakes (6x6 / 12x6, snapped to a 6 px grid) streaming sideways at
 *   900-1600 px/s with 50-150 px/s fall, faint 30-60 px streak lines at ~20 %, over a
 *   #97A3BB -> #727A8E vignetted white-out that clears from a brighter flash.
 */
type Props = {
  mode: 'drift' | 'blizzard';
  background: string;
  backdrop: boolean;
  color: string;
  density: number;
  speed: number;
  wind: number;
  size: number;
  streaks: number;
  pixelSize: number;
  seed: number;
};

const circlePath = (x: number, y: number, r: number) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`;

const DRIFT_LAYERS = [
  {count: 520, size: [1, 1.7], fall: 38, sway: 3, opacity: 0.65, blur: 0},
  {count: 300, size: [1.8, 2.8], fall: 70, sway: 5, opacity: 0.9, blur: 0},
  {count: 90, size: [3.5, 6], fall: 130, sway: 9, opacity: 0.95, blur: 1.6},
];

const DuskCrossing: React.FC<{seed: number}> = ({seed}) => {
  const {w, h, u, portrait} = useStage();
  const hz = h * (portrait ? 0.6 : 0.56);
  const poles = [0.16, 0.86].map((f) => w * f);
  const poleTop = hz - (portrait ? 0.3 : 0.38) * h;
  return (
    <g>
      <defs>
        <linearGradient id="snow-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A5D80" />
          <stop offset="0.45" stopColor="#6B87A4" />
          <stop offset="0.8" stopColor="#C9B3B0" />
          <stop offset="1" stopColor="#EBC7A9" />
        </linearGradient>
        <linearGradient id="snow-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9D3E0" />
          <stop offset="0.5" stopColor="#D9E1EB" />
          <stop offset="1" stopColor="#E9EEF5" />
        </linearGradient>
        <linearGradient id="snow-mtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8496B0" />
          <stop offset="1" stopColor="#A9B5C6" />
        </linearGradient>
        <BlurFilter id="snow-b6" std={6 * u} />
      </defs>
      <rect width={w} height={hz + 4} fill="url(#snow-sky)" />
      <path d={ridgePath('snowmtn' + seed, -10, w + 10, hz - 30 * u, 70 * u, 420 * u, hz + 2, {ridged: true, octaves: 3, step: 8 * u})} fill="url(#snow-mtn)" />
      <path d={ridgePath('snowmtn2' + seed, -10, w + 10, hz - 8 * u, 26 * u, 260 * u, hz + 2, {octaves: 2, step: 8 * u})} fill="#97A6B8" />
      <rect y={hz} width={w} height={h - hz} fill="url(#snow-ground)" />
      {/* soft blue drift shadows */}
      <g filter="url(#snow-b6)" opacity={0.55}>
        <ellipse cx={w * 0.3} cy={hz + (h - hz) * 0.35} rx={w * 0.35} ry={16 * u} fill="#C5D1E0" />
        <ellipse cx={w * 0.75} cy={hz + (h - hz) * 0.62} rx={w * 0.3} ry={22 * u} fill="#C9D4E2" />
        <ellipse cx={w * 0.45} cy={hz + (h - hz) * 0.85} rx={w * 0.4} ry={26 * u} fill="#CFD9E6" />
      </g>
      {/* snowy fence receding to the right + dry grass tufts */}
      {(() => {
        const fy = (x: number) => hz + (h - hz) * (0.34 - 0.12 * (x / w));
        const ph = (x: number) => (46 - 18 * (x / w)) * u * (portrait ? 1.2 : 1);
        const posts: React.ReactNode[] = [];
        const step = 120 * u;
        for (let x = -20 * u, k = 0; x < w + step; x += step * (1 - 0.35 * (x / w)), k++) {
          const y = fy(x);
          const p = ph(x);
          posts.push(
            <g key={k}>
              <rect x={x - 3.5 * u} y={y - p} width={7 * u} height={p} fill="#4A4038" />
              <ellipse cx={x} cy={y - p} rx={5 * u} ry={2.5 * u} fill="#F7F9FC" />
            </g>,
          );
        }
        const rail = (f: number) => `M ${-20 * u} ${fy(-20 * u) - ph(-20 * u) * f} L ${w + 20 * u} ${fy(w + 20 * u) - ph(w + 20 * u) * f}`;
        const tufts: React.ReactNode[] = [];
        for (let i = 0; i < 26; i++) {
          const x = hash01(seed, i, 81) * w;
          const y = hz + (h - hz) * (0.42 + 0.55 * hash01(seed, i, 82));
          const s2 = (10 + 16 * hash01(seed, i, 83)) * u * (0.6 + (y - hz) / (h - hz));
          let d = '';
          for (let b = 0; b < 6; b++) {
            const a = -Math.PI / 2 + (b - 2.5) * 0.22 + (hash01(seed, i, b) - 0.5) * 0.2;
            d += `M ${x + (b - 2.5) * 1.5 * u} ${y} q ${Math.cos(a) * s2 * 0.3} ${Math.sin(a) * s2 * 0.6} ${Math.cos(a) * s2} ${Math.sin(a) * s2}`;
          }
          tufts.push(<path key={i} d={d} stroke="#6B5E4E" strokeWidth={1.4 * u} fill="none" opacity={0.75} />);
        }
        return (
          <g>
            <path d={rail(0.78)} stroke="#4A4038" strokeWidth={4 * u} />
            <path d={rail(0.4)} stroke="#4A4038" strokeWidth={4 * u} />
            <path d={rail(0.78)} stroke="#F7F9FC" strokeWidth={1.6 * u} transform={`translate(0 ${-2.4 * u})`} />
            {posts}
            {tufts}
          </g>
        );
      })()}
      {/* utility poles + sagging wires */}
      {poles.map((x, i) => (
        <g key={i}>
          <rect x={x - 4 * u} y={poleTop} width={8 * u} height={hz + (h - hz) * 0.3 - poleTop} fill="#2E3440" />
          <rect x={x - 26 * u} y={poleTop + 18 * u} width={52 * u} height={5 * u} fill="#2E3440" />
          <rect x={x - 3 * u} y={poleTop - 2 * u} width={6 * u} height={4 * u} fill="#F2F5FA" />
        </g>
      ))}
      {[0, 1, 2].map((k) => {
        const y0 = poleTop + 20 * u + k * 6 * u;
        const sag = (40 + k * 8) * u;
        return (
          <g key={k} stroke="#2E3440" strokeWidth={1.5 * u} fill="none" opacity={0.85}>
            <path d={`M ${-20 * u} ${y0 + 30 * u} Q ${poles[0] * 0.5} ${y0 + sag * 0.6} ${poles[0]} ${y0}`} />
            <path d={`M ${poles[0]} ${y0} Q ${(poles[0] + poles[1]) / 2} ${y0 + sag * 2} ${poles[1]} ${y0}`} />
            <path d={`M ${poles[1]} ${y0} Q ${(poles[1] + w) / 2} ${y0 + sag * 0.6} ${w + 20 * u} ${y0 + 24 * u}`} />
          </g>
        );
      })}
    </g>
  );
};

const WhiteOut: React.FC<{seed: number; t: number}> = ({seed, t}) => {
  const {w, h, u} = useStage();
  return (
    <g>
      <defs>
        <radialGradient id="snow-wo" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#A7B2C8" />
          <stop offset="0.55" stopColor="#97A3BB" />
          <stop offset="1" stopColor="#6E7689" />
        </radialGradient>
        <BlurFilter id="snow-wob" std={30 * u} />
      </defs>
      <rect width={w} height={h} fill="url(#snow-wo)" />
      <path d={ridgePath('wo' + seed, -10, w + 10, h * 0.66, 90 * u, 380 * u, h + 10, {ridged: true, step: 10 * u})} fill="#5E6779" opacity={0.28} />
      <path d={ridgePath('wo2' + seed, -10, w + 10, h * 0.8, 40 * u, 300 * u, h + 10, {step: 10 * u})} fill="#4F586A" opacity={0.25} />
      {/* gusting fog banks */}
      <g filter="url(#snow-wob)">
        {[0, 1, 2, 3].map((k) => {
          const x = wrap(hash01(seed, k, 9) * w * 1.6 + t * w * 0.35 * (0.8 + 0.3 * k), w * 1.6) - w * 0.3;
          return <ellipse key={k} cx={x} cy={h * (0.25 + 0.18 * k)} rx={w * 0.28} ry={h * 0.08} fill="#E4E8F0" opacity={0.35} />;
        })}
      </g>
    </g>
  );
};

const Snowfall: React.FC<Props> = ({mode, background, backdrop, color, density, speed, wind, size, streaks, pixelSize, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const t = frame / fps;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const K = areaK(w, h) * density;
  const blizzard = mode === 'blizzard';

  const layers: React.ReactNode[] = [];
  if (!blizzard) {
    DRIFT_LAYERS.forEach((L, li) => {
      const n = Math.round(L.count * K);
      const fall = L.fall * u * speed;
      const drift = fall * 0.4 * wind;
      const margin = 20 * u;
      const spanX = w + 2 * margin + Math.abs(drift) * 0;
      const spanY = h + 2 * margin;
      const buckets = ['', ''];
      for (let i = 0; i < n; i++) {
        const v = 0.8 + 0.4 * hash01(seed, li, i, 3);
        const y = wrap(hash01(seed, li, i, 2) * spanY + fall * v * t, spanY) - margin;
        const swayF = 0.4 + 0.5 * hash01(seed, li, i, 4);
        const x = wrap(hash01(seed, li, i, 1) * spanX + drift * v * t + L.sway * u * Math.sin(TAU * swayF * t + i), spanX) - margin;
        const r = (L.size[0] + (L.size[1] - L.size[0]) * hash01(seed, li, i, 5)) * u * size;
        buckets[i % 2] += circlePath(x, y, r);
      }
      layers.push(
        <g key={li} filter={L.blur ? `url(#snow-blur${li})` : undefined}>
          {L.blur ? <BlurFilter id={`snow-blur${li}`} std={L.blur * u * size} /> : null}
          {buckets.map((d, bi) => (
            <path key={bi} d={d} fill={color} opacity={L.opacity * (bi ? 0.8 : 1)} />
          ))}
        </g>,
      );
    });
    // optional wind streaks (video2 hydrant variant)
    if (streaks > 0) {
      let d = '';
      const n = Math.round(streaks * areaK(w, h));
      for (let i = 0; i < n; i++) {
        const vx = (500 + 400 * hash01(seed, i, 61)) * u * speed * wind;
        const len = (10 + 20 * hash01(seed, i, 62)) * u * 1.6;
        const x = wrap(hash01(seed, i, 63) * (w + 200 * u) + vx * t, w + 200 * u) - 100 * u;
        const y = hash01(seed, i, 64) * h + 12 * u * Math.sin(t * 2 + i);
        d += `M${x.toFixed(1)} ${y.toFixed(1)}l${(-len).toFixed(1)} ${(-len * 0.12).toFixed(1)}`;
      }
      layers.push(<path key="st" d={d} stroke={color} strokeWidth={1.2 * u} opacity={0.18} strokeLinecap="round" />);
    }
  } else {
    // blizzard: pixel flakes snapped to the grid + streak lines
    const px = Math.max(2, pixelSize * u);
    const n = Math.round(600 * K);
    const flakes = ['', '', ''];
    let lines = '';
    const span = w + 200 * u;
    for (let i = 0; i < n; i++) {
      const vx = (900 + 700 * hash01(seed, i, 71)) * u * speed * wind;
      const vy = (50 + 100 * hash01(seed, i, 72)) * u * speed;
      const gust = 1 + 0.25 * n2('gust' + seed, t * 0.6, i * 0.01);
      const x = wrap(hash01(seed, i, 73) * span + vx * gust * t, span) - 100 * u;
      const y = wrap(hash01(seed, i, 74) * (h + 40 * u) + vy * t + 30 * u * Math.sin(t * 1.3 + i), h + 40 * u) - 20 * u;
      const sx = Math.round(x / px) * px;
      const sy = Math.round(y / px) * px;
      const wide = hash01(seed, i, 75) < 0.35 ? 2 : 1;
      const b = Math.floor(hash01(seed, i, 76) * 3);
      flakes[b] += `M${sx.toFixed(0)} ${sy.toFixed(0)}h${(px * wide).toFixed(1)}v${px.toFixed(1)}h${(-px * wide).toFixed(1)}z`;
      if (i % 3 === 0) {
        const len = vx * 0.04;
        lines += `M${x.toFixed(1)} ${(y + px / 2).toFixed(1)}l${(-len).toFixed(1)} ${(-len * (vy / vx)).toFixed(1)}`;
      }
    }
    layers.push(
      <g key="bz">
        <path d={lines} stroke={color} strokeWidth={Math.max(1, 2 * u)} opacity={0.22} />
        {flakes.map((d, bi) => (
          <path key={bi} d={d} fill={color} opacity={0.6 + bi * 0.2} />
        ))}
      </g>,
    );
  }

  // blizzard opens on a bright white-out that clears (ease-out, ~1 s)
  const flash = blizzard && scene ? 1 - prog(frame, 3, 33, ease.out) : 0;
  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      {scene && <Svg>{blizzard ? <WhiteOut seed={seed} t={t} /> : <DuskCrossing seed={seed} />}</Svg>}
      <Svg>
        {layers}
      </Svg>
      {flash > 0 && <AbsoluteFill style={{background: '#E9EDF4', opacity: flash * 0.85}} />}
    </AbsoluteFill>
  );
};

export const snowfall = defineMotion<Props>({
  id: 'snowfall',
  title: 'Snowfall',
  category: 'environment',
  description: 'Layered snow drifting diagonally over a dusk snowy landscape; blizzard mode streams pixel snow and streaks sideways through a blue-grey white-out. Overlay-capable.',
  source: ['video2 12.00-13.08, 27.25-28.92', 'video21 7.20-8.35, 21.9-23.3'],
  useFor: 'Winter / cold / quiet beats; blizzard for harsh weather, isolation or a white-out scene change; set background "transparent" to snow over anything.',
  durationInFrames: 180,
  defaultProps: {
    mode: 'drift',
    background: '#3A5D80',
    backdrop: true,
    color: '#FFFFFF',
    density: 1,
    speed: 1,
    wind: 1,
    size: 1,
    streaks: 0,
    pixelSize: 6,
    seed: 1,
  },
  propDocs: {
    mode: '"drift" (soft layered snow) or "blizzard" (horizontal pixel snow + white-out)',
    background: 'CSS background; "transparent" = overlay (no painted landscape)',
    backdrop: 'paint the procedural landscape / white-out',
    color: 'flake colour',
    density: 'flake count multiplier (drift 520/240/60, blizzard 600 per 1080p frame)',
    speed: 'fall / stream speed multiplier',
    wind: 'horizontal drift multiplier (negative blows left)',
    size: 'flake size multiplier (drift mode)',
    streaks: 'extra fast wind streak lines in drift mode (video2 hydrant look), e.g. 120',
    pixelSize: 'blizzard pixel size in px at 1080p (6 = source)',
    seed: 'random seed',
  },
  component: Snowfall,
  tags: ['weather', 'snow', 'winter', 'blizzard', 'overlay', 'particles', 'pixel'],
});
