import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease} from '../../core/ease';
import {BlurFilter, RainField, TAU, areaK, hash01, isTransparent, ridgePath} from '../../core/environment-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Rain (video1 rain-streaks, video14 rain-streaks, video16 rain-overlay).
 * 3 parallax layers of slanted streaks (far 600 / mid 300 / near 150 per 1080p frame,
 * 1200 / 1800 / 2600 px/s, 35 / 70 / 120 px, opacity .12 / .22 / .35), ~8° from vertical,
 * streaks brightened inside a sodium street-lamp cone, expanding ripple ellipses on the
 * ground (rx 0 -> 18 px, ry = 0.3 rx, 0.5 s) and optional glass droplets + trickles (20-60 px/s).
 */
type Props = {
  background: string;
  backdrop: boolean;
  color: string;
  density: number;
  speed: number;
  angle: number;
  layers: number;
  ripples: boolean;
  groundY: number;
  glass: boolean;
  glassDrops: number;
  lamp: boolean;
  lampColor: string;
  seed: number;
};

const NightStreet: React.FC<{horizon: number; lamp: boolean; lampColor: string; seed: number; lampX: number; lampTop: number; lampBase: number; t: number}> = ({horizon, lamp, lampColor, seed, lampX, lampTop, lampBase, t}) => {
  const {w, h, u} = useStage();
  // distant block silhouettes with a few lit windows
  const blocks: React.ReactNode[] = [];
  const windows: React.ReactNode[] = [];
  let x = -20 * u;
  let i = 0;
  while (x < w + 20 * u) {
    const bw = (70 + 110 * hash01(seed, i, 11)) * u;
    const bh = (40 + 190 * Math.pow(hash01(seed, i, 12), 1.4)) * u;
    const top = horizon - bh;
    blocks.push(<rect key={i} x={x} y={top} width={bw + 1} height={bh + 2} fill={i % 2 ? '#08111C' : '#060E18'} />);
    const cols = Math.max(1, Math.floor(bw / (16 * u)));
    const rows = Math.max(1, Math.floor((bh - 12 * u) / (20 * u)));
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) {
        if (hash01(seed, i, c, r) > 0.13) continue;
        const flick = hash01(seed, i, c, r, Math.floor(t * 0.7)) > 0.97 ? 0.15 : 1;
        windows.push(<rect key={`${i}-${c}-${r}`} x={x + 5 * u + c * 16 * u} y={top + 8 * u + r * 20 * u} width={7 * u} height={10 * u} fill="#E8A040" opacity={(0.35 + 0.35 * hash01(seed, i, c, r, 3)) * flick} />);
      }
    x += bw + (hash01(seed, i, 13) < 0.3 ? 30 * u : 0);
    i++;
  }
  const coneHalf = Math.min(w * 0.17, 300 * u);
  const headX = lampX - 46 * u;
  const headY = lampTop + 14 * u;
  return (
    <g>
      <defs>
        <linearGradient id="rain-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03070C" />
          <stop offset="0.5" stopColor="#0C1726" />
          <stop offset="0.85" stopColor="#1B2B40" />
          <stop offset="1" stopColor="#2A3D55" />
        </linearGradient>
        <linearGradient id="rain-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101C2A" />
          <stop offset="0.35" stopColor="#0A1420" />
          <stop offset="1" stopColor="#050B13" />
        </linearGradient>
        <linearGradient id="rain-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FA6C0" stopOpacity="0" />
          <stop offset="0.7" stopColor="#8FA6C0" stopOpacity="0.12" />
          <stop offset="1" stopColor="#8FA6C0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rain-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lampColor} stopOpacity="0.42" />
          <stop offset="0.6" stopColor={lampColor} stopOpacity="0.14" />
          <stop offset="1" stopColor={lampColor} stopOpacity="0.03" />
        </linearGradient>
        <radialGradient id="rain-glow">
          <stop offset="0" stopColor="#FFF1D6" stopOpacity="1" />
          <stop offset="0.25" stopColor={lampColor} stopOpacity="0.55" />
          <stop offset="1" stopColor={lampColor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rain-pool">
          <stop offset="0" stopColor={lampColor} stopOpacity="0.45" />
          <stop offset="1" stopColor={lampColor} stopOpacity="0" />
        </radialGradient>
        <BlurFilter id="rain-b12" std={12 * u} />
        <BlurFilter id="rain-b4" std={4 * u} />
      </defs>
      <rect width={w} height={h} fill="url(#rain-sky)" />
      <path d={ridgePath('rainhill', -10, w + 10, horizon - 120 * u, 50 * u, 500 * u, horizon + 2, {octaves: 2, step: 10 * u})} fill="#0E1A2A" opacity={0.9} />
      {blocks}
      {windows}
      <rect y={horizon - 160 * u} width={w} height={200 * u} fill="url(#rain-mist)" />
      <rect y={horizon} width={w} height={h - horizon} fill="url(#rain-ground)" />
      {/* wet-road reflections of the lit windows */}
      <g filter="url(#rain-b4)" opacity={0.5}>
        {windows.filter((_, k) => k % 3 === 0).map((wnd, k) => {
          const el = wnd as React.ReactElement<{x: number}>;
          return <rect key={k} x={el.props.x} y={horizon + 6 * u} width={7 * u} height={60 * u} fill="#E8A040" opacity={0.18} />;
        })}
      </g>
      <rect y={horizon} width={w} height={3 * u} fill="#24364B" opacity={0.7} />
      {lamp && (
        <g>
          <ellipse cx={headX} cy={lampBase} rx={coneHalf * 1.2} ry={coneHalf * 0.22} fill="url(#rain-pool)" />
          <ellipse cx={headX} cy={lampBase + 120 * u} rx={22 * u} ry={150 * u} fill={lampColor} opacity={0.22} filter="url(#rain-b12)" />
          <polygon points={`${headX - 14 * u},${headY} ${headX + 14 * u},${headY} ${headX + coneHalf},${lampBase} ${headX - coneHalf},${lampBase}`} fill="url(#rain-cone)" filter="url(#rain-b12)" style={{mixBlendMode: 'screen'}} />
          <rect x={lampX - 4 * u} y={lampTop} width={8 * u} height={lampBase - lampTop} fill="#05090F" />
          <path d={`M ${lampX} ${lampTop + 4 * u} Q ${lampX} ${lampTop - 6 * u} ${lampX - 20 * u} ${lampTop - 2 * u} L ${headX} ${lampTop + 4 * u}`} stroke="#05090F" strokeWidth={6 * u} fill="none" />
          <path d={`M ${headX - 18 * u} ${headY} L ${headX + 18 * u} ${headY} L ${headX + 10 * u} ${lampTop} L ${headX - 10 * u} ${lampTop} Z`} fill="#05090F" />
          <circle cx={headX} cy={headY + 2 * u} r={110 * u} fill="url(#rain-glow)" />
          <ellipse cx={headX} cy={headY + 1 * u} rx={14 * u} ry={4 * u} fill="#FFF6E2" />
        </g>
      )}
    </g>
  );
};

const Rain: React.FC<Props> = ({background, backdrop, color, density, speed, angle, layers, ripples, groundY, glass, glassDrops, lamp, lampColor, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const horizon = h * groundY;
  const lampX = w * (portrait ? 0.74 : 0.72);
  const lampTop = h * (portrait ? 0.3 : 0.2);
  const lampBase = h * (portrait ? 0.84 : 0.86);
  const coneHalf = Math.min(w * 0.17, 300 * u);
  const headX = lampX - 46 * u;
  const headY = lampTop + 14 * u;
  const conePts = `${headX - 14 * u},${headY} ${headX + 14 * u},${headY} ${headX + coneHalf},${lampBase} ${headX - coneHalf},${lampBase}`;

  // ground ripples: each slot re-spawns every `life` frames at a new seeded spot
  const rip: React.ReactNode[] = [];
  if (ripples) {
    const n = Math.round(46 * areaK(w, h) * density);
    const life = 15;
    for (let i = 0; i < n; i++) {
      const off = Math.floor(hash01(seed, i, 21) * life * 3);
      const c = Math.floor((frame + off) / life);
      const age = (frame + off) % life;
      if (hash01(seed, i, c, 1) < 0.25) continue;
      const py = Math.pow(hash01(seed, i, c, 2), 1.3);
      const y = horizon + 8 * u + (h - horizon - 8 * u) * py;
      const x = hash01(seed, i, c, 3) * w;
      const persp = 0.35 + 0.9 * py;
      const p = ease.out(age / life);
      [0, 1].forEach((k) => {
        const pk = Math.max(0, p - k * 0.3);
        if (pk <= 0) return;
        const rx = 22 * u * persp * pk;
        rip.push(<ellipse key={`${i}-${k}`} cx={x} cy={y} rx={rx} ry={rx * 0.3} fill="none" stroke={color} strokeWidth={2 * u * persp} opacity={0.75 * (1 - pk) * (k ? 0.6 : 1)} />);
      });
    }
  }

  // glass droplets + trickles (window POV)
  const glassEls: React.ReactNode[] = [];
  if (glass) {
    const n = Math.round(glassDrops * areaK(w, h));
    for (let i = 0; i < n; i++) {
      const x = hash01(seed, i, 31) * w;
      const y = hash01(seed, i, 32) * h;
      const r = (4 + 14 * Math.pow(hash01(seed, i, 33), 2)) * u;
      glassEls.push(
        <g key={`d${i}`}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 1.08} fill="#ffffff" opacity={0.05} />
          <path d={`M ${x - r * 0.9} ${y + r * 0.1} A ${r} ${r * 1.08} 0 0 0 ${x + r * 0.9} ${y + r * 0.1}`} stroke="#000" strokeOpacity={0.35} strokeWidth={r * 0.28} fill="none" />
          <path d={`M ${x - r * 0.55} ${y + r * 0.55} A ${r * 0.7} ${r * 0.7} 0 0 0 ${x + r * 0.55} ${y + r * 0.55}`} stroke="#DCE8F5" strokeOpacity={0.45} strokeWidth={r * 0.16} fill="none" />
          <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.2} fill="#fff" opacity={0.85} />
        </g>,
      );
    }
    const trickles = Math.max(3, Math.round(7 * areaK(w, h)));
    for (let i = 0; i < trickles; i++) {
      const v = (20 + 40 * hash01(seed, i, 41)) * u * 2.2;
      const period = (h * 0.7) / v + 1.5;
      const tt = t + hash01(seed, i, 42) * period;
      const c = Math.floor(tt / period);
      const age = tt - c * period;
      const x0 = hash01(seed, i, c, 43) * w;
      const y0 = hash01(seed, i, c, 44) * h * 0.5;
      const r = (7 + 5 * hash01(seed, i, c, 45)) * u;
      // stick-slip descent: pauses then slides
      const travel = v * (age + 0.35 * Math.sin(age * 2.3 + i));
      const fx = (yy: number) => x0 + 5 * u * Math.sin(yy / (90 * u) + i) + 1.5 * u * Math.sin(yy / (23 * u) + i * 2);
      const pts: string[] = [];
      for (let s = 0; s <= 24; s++) {
        const yy = (travel * s) / 24;
        pts.push(`${fx(yy).toFixed(1)},${(y0 + yy).toFixed(1)}`);
      }
      const fade = Math.min(1, age / 0.3) * Math.min(1, (period - age) / 0.6);
      const hx = fx(travel);
      const hy = y0 + travel;
      glassEls.push(
        <g key={`t${i}`} opacity={fade}>
          <polyline points={pts.join(' ')} fill="none" stroke="#DCE8F5" strokeOpacity={0.14} strokeWidth={r * 0.7} strokeLinecap="round" />
          <ellipse cx={hx} cy={hy} rx={r} ry={r * 1.3} fill="#fff" opacity={0.07} />
          <path d={`M ${hx - r * 0.85} ${hy + r * 0.3} A ${r} ${r * 1.3} 0 0 0 ${hx + r * 0.85} ${hy + r * 0.3}`} stroke="#000" strokeOpacity={0.3} strokeWidth={r * 0.25} fill="none" />
          <circle cx={hx - r * 0.3} cy={hy - r * 0.5} r={r * 0.22} fill="#fff" opacity={0.9} />
        </g>,
      );
    }
  }

  const push = 1 + 0.025 * ease.sine(Math.min(1, frame / (fps * 6)));
  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      {scene && (
        <AbsoluteFill style={{transform: `scale(${push})`, filter: glass ? `blur(${3 * u}px)` : undefined}}>
          <Svg>
            <NightStreet horizon={horizon} lamp={lamp} lampColor={lampColor} seed={seed} lampX={lampX} lampTop={lampTop} lampBase={lampBase} t={t} />
          </Svg>
        </AbsoluteFill>
      )}
      <Svg>
        <defs>
          <clipPath id="rain-cone-clip">
            <polygon points={conePts} />
          </clipPath>
        </defs>
        {rip}
        <RainField t={t} w={w} h={h} u={u} seed={seed} density={density} speed={speed} angle={angle} color={color} layers={layers} />
        {scene && lamp && <RainField t={t} w={w} h={h} u={u} seed={seed} density={density} speed={speed} angle={angle} color="#FFD9A8" layers={layers} opacityScale={2.4} clipPath="url(#rain-cone-clip)" />}
        {glassEls}
      </Svg>
    </AbsoluteFill>
  );
};

export const rain = defineMotion<Props>({
  id: 'rain',
  title: 'Rain',
  category: 'environment',
  description: 'Night street in the rain: 3 parallax layers of slanted streaks, lamp-lit cone, ground ripples; optional glass droplets and trickles. Works as a transparent overlay.',
  source: ['video1 34.9-41.7', 'video14 109.75-115.2', 'video16 46.0-52.2, 75.9-80.1'],
  useFor: 'Moody/rainy ambience under any scene; set background "transparent" to lay rain over footage, glass: true for a window POV.',
  durationInFrames: 180,
  defaultProps: {
    background: '#060D16',
    backdrop: true,
    color: '#C8D6E5',
    density: 1,
    speed: 1,
    angle: 8,
    layers: 3,
    ripples: true,
    groundY: 0.64,
    glass: false,
    glassDrops: 40,
    lamp: true,
    lampColor: '#F0904F',
    seed: 1,
  },
  propDocs: {
    background: 'CSS background; "transparent" = overlay mode (no painted street)',
    backdrop: 'paint the procedural night street (sky, blocks, wet road, lamp)',
    color: 'streak / ripple colour',
    density: 'streak + ripple count multiplier (1 = 150/300/600 per 1080p frame)',
    speed: 'fall speed multiplier (1 = 2600/1800/1200 px/s)',
    angle: 'degrees from vertical; positive falls to the right',
    layers: '1-3 parallax layers (near layer always kept)',
    ripples: 'expanding ripple ellipses on the ground band',
    groundY: 'fraction of height where the ground / ripple band starts',
    glass: 'window-glass POV: droplets with highlights, slow trickles, backdrop blurred',
    glassDrops: 'number of static droplets per 1080p frame',
    lamp: 'street lamp with volumetric cone that lights the streaks',
    lampColor: 'sodium lamp colour',
    seed: 'random seed',
  },
  component: Rain,
  tags: ['weather', 'rain', 'night', 'overlay', 'ambience', 'particles'],
});
