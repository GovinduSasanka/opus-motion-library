// Adapted from mg-styles-15/demos/10-synthwave/index.html (sky, sun, mountains, floor grid, palms, posts) (MIT) — see THIRD_PARTY_NOTICES.md
// Rewritten as a deterministic one-point-perspective SVG scene (no WebGL needed).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {clamp, ease, prog} from '../../core/ease';
import {n2, rng} from '../../core/random';
import {Svg, useStage, Vignette} from '../../core/stage';

type Props = {
  speed: number;
  gridColor: string;
  glowColor: string;
  sunColors: string[];
  skyColors: string[];
  sunRise: number;
  mountains: boolean;
  palms: boolean;
  posts: boolean;
  pulses: number[];
  car: boolean;
  stars: number;
  horizonY: number;
  seed: number;
};

const Palm: React.FC<{x: number; y: number; s: number; side: number; sway: number; rim: string}> = ({x, y, s, side, sway, rim}) => {
  const H = 5.2 * s;
  const lean = side * 0.28 * H;
  const topX = x + lean * 0.9 + sway * H * 0.01;
  const topY = y - H;
  const fronds = [-150, -115, -80, -40, -10, 25, 55].map((a, i) => {
    const ang = (a * Math.PI) / 180 + (i % 2 ? 0.05 : -0.05) + sway * 0.01;
    const L = H * (0.46 + (i % 3) * 0.05);
    const ex = topX + Math.cos(ang) * L;
    const ey = topY + Math.sin(ang) * L * 0.55 + L * 0.35;
    const mx = topX + Math.cos(ang) * L * 0.5;
    const my = topY + Math.sin(ang) * L * 0.5 - L * 0.12;
    return `M${topX},${topY} Q${mx},${my} ${ex},${ey} Q${mx},${my + L * 0.12} ${topX},${topY + L * 0.04} Z`;
  });
  return (
    <g>
      <path d={`M${x - 0.1 * s},${y} Q${x + lean * 0.2},${y - H * 0.5} ${topX - 0.05 * s},${topY} L${topX + 0.07 * s},${topY} Q${x + lean * 0.25 + 0.1 * s},${y - H * 0.5} ${x + 0.14 * s},${y} Z`} fill="#0a0118" stroke={rim} strokeWidth={Math.max(0.6, s * 0.015)} strokeOpacity={0.6} />
      {fronds.map((d, i) => (
        <path key={i} d={d} fill="#0a0118" stroke={rim} strokeWidth={Math.max(0.6, s * 0.015)} strokeOpacity={0.55} />
      ))}
    </g>
  );
};

const OutrunGrid: React.FC<Props> = ({speed, gridColor, glowColor, sunColors, skyColors, sunRise, mountains, palms, posts, pulses, car, stars, horizonY, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait} = useStage();
  const t = frame / 30;
  const hy = h * (portrait ? horizonY - 0.04 : horizonY);
  const f = h * 0.8;
  const camH = 1.5;
  const zNear = (camH * f) / (h - hy);
  const zFar = 260;
  const travel = speed * (t - 0.4 + 0.4 * ease.out(prog(frame, 0, 24)));

  const sunR = Math.min(h * 0.23, w * 0.3);
  const pump = pulses.reduce((m, p) => {
    const a = (frame - p) / 30;
    return a >= 0 ? Math.max(m, 0.1 * Math.exp(-7 * a)) : m;
  }, 0);
  const rise = prog(frame, 0, sunRise, ease.out);
  const sunCy = hy + sunR * 1.05 - rise * sunR * 1.75;
  const sunS = 1 + pump;

  const sunMaskStripes: React.ReactNode[] = [];
  for (let n = -3; n < 12; n++) {
    const phase0 = n + t * 0.55;
    const v0 = 0.12 + phase0 / 5;
    const gap = clamp(0.55 * (v0 - 0.12), 0, 0.62) / 5;
    if (v0 + gap < 0.1 || v0 > 1.05) continue;
    sunMaskStripes.push(<rect key={n} x={cx - sunR * 1.1} y={sunCy - sunR + v0 * sunR * 2} width={sunR * 2.2} height={Math.max(0, gap * sunR * 2)} fill="#000" />);
  }

  // sky + stars
  const starList = React.useMemo(() => {
    const r = rng(seed * 31 + 5);
    return Array.from({length: stars}, () => ({x: r() * w, y: r() * hy * 0.92, s: 0.6 + r() * 1.6, ph: r() * 6.28}));
  }, [stars, seed, w, hy]);
  const shoot = prog(frame, 70, 96, ease.sine);

  // mountains
  const mtn = React.useMemo(() => {
    const pts: [number, number][] = [];
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const edge = Math.abs(x - cx) / (w / 2);
      const valley = Math.pow(edge, 1.35);
      const rn = 1 - Math.abs(n2('mtn' + seed, i * 0.21, 3.3));
      const rn2 = 1 - Math.abs(n2('mtn2' + seed, i * 0.53, 8.1));
      const hh = (0.06 + valley * 0.9) * (0.55 + 0.45 * rn) * (0.8 + 0.2 * rn2);
      pts.push([x, hh]);
    }
    return pts;
  }, [seed, w, cx]);
  const mtnH = h * 0.2;
  const ridge = mtn.map(([x, v]) => `${x.toFixed(1)},${(hy - v * mtnH).toFixed(1)}`).join(' ');

  // floor lines
  const gridX: React.ReactNode[] = [];
  const gridZ: React.ReactNode[] = [];
  const nX = 40;
  for (let i = -nX; i <= nX; i++) {
    const X = i * 2.5;
    const xf = cx + (X * f) / zFar;
    const yf = hy + (camH * f) / zFar;
    const xn = cx + (X * f) / zNear;
    gridX.push(<line key={i} x1={xf} y1={yf} x2={xn} y2={h + 4} stroke={gridColor} strokeOpacity={i === 0 ? 0.95 : 0.8} />);
  }
  const spacing = 5;
  const off = (((travel % spacing) + spacing) % spacing);
  for (let m = 0; m < 60; m++) {
    const z = zNear - off + m * spacing;
    if (z < zNear * 0.98 || z > zFar) continue;
    const y = hy + (camH * f) / z;
    const fade = 1 - clamp((z - 20) / (zFar - 20));
    gridZ.push(<line key={m} x1={0} x2={w} y1={y} y2={y} stroke={gridColor} strokeOpacity={0.25 + 0.75 * fade} strokeWidth={(1 + 3.2 / (z * 0.18 + 1)) * u} />);
  }
  const pulseLines = pulses.map((p, i) => {
    const age = (frame - p) / 30;
    if (age < 0 || age > 2.4) return null;
    const z = zNear + age * 75 * (1 + age * 0.6);
    const y = hy + (camH * f) / z;
    return <line key={i} x1={0} x2={w} y1={y} y2={y} stroke="#fff" strokeWidth={(2 + 5 / (z * 0.15 + 1)) * u} strokeOpacity={Math.exp(-1.3 * age)} />;
  });

  // palms & posts
  const props: React.ReactNode[] = [];
  const period = 0.6 * speed;
  const countP = 26;
  const offP = (((travel % period) + period) % period);
  if (palms)
    for (let m = 0; m < countP; m++) {
      const z = zNear + 3 - offP + m * period;
      if (z < 5 || z > 190) continue;
      const side = m % 2 ? 1 : -1;
      const idx = Math.floor((travel - offP) / period) + m;
      const side2 = ((idx % 2) + 2) % 2 ? 1 : -1;
      const X = side2 * (10 + (((idx * 7) % 5) * 0.5));
      const sc = f / z;
      const x = cx + X * sc;
      const y = hy + camH * sc;
      props.push(<g key={`p${m}`} opacity={1 - clamp((z - 120) / 70)}><Palm x={x} y={y} s={sc} side={-side2} sway={Math.sin(t * 1.4 + idx) * 3} rim={glowColor} /></g>);
      void side;
    }
  if (posts) {
    const sp = 5;
    const offQ = (((travel % sp) + sp) % sp);
    for (let m = 0; m < 40; m++) {
      const z = zNear - offQ + m * sp;
      if (z < 4 || z > 170) continue;
      const idx = Math.floor((travel - offQ) / sp) + m;
      for (const sd of [-1, 1]) {
        if ((idx + (sd > 0 ? 1 : 0)) % 2) continue;
        const sc = f / z;
        const x = cx + sd * 5.2 * sc;
        const y = hy + camH * sc;
        props.push(
          <g key={`q${m}${sd}`} opacity={1 - clamp((z - 100) / 70)}>
            <rect x={x - 0.07 * sc} y={y - 1.2 * sc} width={0.14 * sc} height={1.2 * sc} fill="#0a0118" stroke={glowColor} strokeOpacity={0.5} strokeWidth={Math.max(0.5, sc * 0.015)} />
            <circle cx={x} cy={y - 1.05 * sc} r={Math.max(1, 0.1 * sc)} fill={sd > 0 ? '#ff3b6b' : '#ffd36b'} />
          </g>,
        );
      }
    }
  }

  const sunGrad = 'ogsun';
  const carW = Math.min(w * 0.36, h * 0.3);
  const carY = h * 0.9 + Math.sin(t * 9) * 1.2 * u;

  return (
    <AbsoluteFill style={{background: skyColors[0]}}>
      <Svg>
        <defs>
          <linearGradient id="ogsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyColors[0]} />
            <stop offset="55%" stopColor={skyColors[1]} />
            <stop offset="100%" stopColor={skyColors[2]} />
          </linearGradient>
          <linearGradient id="ogfloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyColors[2]} stopOpacity="0.9" />
            <stop offset="12%" stopColor="#1a0638" />
            <stop offset="100%" stopColor="#05010e" />
          </linearGradient>
          <linearGradient id={sunGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sunColors[0]} />
            <stop offset="50%" stopColor={sunColors[1]} />
            <stop offset="100%" stopColor={sunColors[2]} />
          </linearGradient>
          <radialGradient id="oghalo" cx="50%" cy="50%" r="50%">
            <stop offset="30%" stopColor={sunColors[1]} stopOpacity="0.55" />
            <stop offset="100%" stopColor={sunColors[2]} stopOpacity="0" />
          </radialGradient>
          <mask id="ogsunmask">
            <rect x={cx - sunR * 1.2} y={sunCy - sunR * 1.2} width={sunR * 2.4} height={sunR * 2.4} fill="#fff" />
            {sunMaskStripes}
          </mask>
          <clipPath id="ogabove">
            <rect x={0} y={0} width={w} height={hy + 1} />
          </clipPath>
          <filter id="ogblur" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={3.2 * u} />
          </filter>
          <filter id="ogblur2" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={9 * u} />
          </filter>
        </defs>

        <rect x={0} y={0} width={w} height={hy + 1} fill="url(#ogsky)" />
        {/* stars */}
        {starList.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s * u * 0.8} fill="#fff" opacity={(0.25 + 0.6 * Math.abs(Math.sin(t * 1.4 + s.ph))) * (0.3 + 0.7 * (1 - s.y / hy))} />
        ))}
        {shoot > 0 && shoot < 1 && (
          <g opacity={1 - shoot * 0.9}>
            <line x1={w * 0.78 - shoot * w * 0.3} y1={hy * 0.18 + shoot * hy * 0.22} x2={w * 0.78 - shoot * w * 0.3 + w * 0.09} y2={hy * 0.18 + shoot * hy * 0.22 - hy * 0.06} stroke="#fff" strokeWidth={2 * u} strokeLinecap="round" />
          </g>
        )}
        {/* sun */}
        <g clipPath="url(#ogabove)">
          <circle cx={cx} cy={sunCy} r={sunR * 1.9 * sunS} fill="url(#oghalo)" opacity={0.85 * rise} />
          <g mask="url(#ogsunmask)">
            <circle cx={cx} cy={sunCy} r={sunR * sunS} fill={`url(#${sunGrad})`} />
          </g>
        </g>
        {/* mountains */}
        {mountains && (
          <g>
            <polygon points={`0,${hy} ${ridge} ${w},${hy}`} fill="#12032b" />
            <polyline points={ridge} fill="none" stroke={glowColor} strokeWidth={5 * u} filter="url(#ogblur)" opacity={0.7} />
            <polyline points={ridge} fill="none" stroke={glowColor} strokeWidth={1.8 * u} />
            {/* wire contours */}
            <g stroke={glowColor} strokeWidth={0.9 * u} opacity={0.38} fill="none">
              {[0.35, 0.62].map((k, j) => (
                <polyline key={j} points={mtn.map(([x, v]) => `${x.toFixed(1)},${(hy - v * mtnH * k).toFixed(1)}`).join(' ')} />
              ))}
              {mtn.filter((_, i) => i % 3 === 0).map(([x, v], i) => (
                <line key={i} x1={x} y1={hy - v * mtnH} x2={x + (x < cx ? 14 : -14) * u} y2={hy} />
              ))}
            </g>
          </g>
        )}
        {/* horizon glow */}
        <ellipse cx={cx} cy={hy} rx={w * 0.6} ry={h * 0.05} fill={sunColors[2]} opacity={0.35 + pump * 2} filter="url(#ogblur2)" />
        {/* floor */}
        <rect x={0} y={hy} width={w} height={h - hy} fill="url(#ogfloor)" />
        {/* sun reflection streak */}
        <rect x={cx - sunR * 0.12} y={hy} width={sunR * 0.24} height={h - hy} fill={sunColors[2]} opacity={0.14 * rise} filter="url(#ogblur2)" />
        <g strokeWidth={1.1 * u}>
          <g filter="url(#ogblur)" strokeWidth={4 * u} opacity={0.8}>{gridX}{gridZ}</g>
          <g strokeWidth={1.3 * u}>{gridX}{gridZ}</g>
        </g>
        {pulseLines}
        <line x1={0} x2={w} y1={hy} y2={hy} stroke="#fff" strokeOpacity={0.9} strokeWidth={1.5 * u} />
        {props}
        {/* car from behind */}
        {car && (
          <g transform={`translate(${cx} ${carY})`} opacity={prog(frame, 6, 24, ease.out)}>
            <ellipse cx={0} cy={carW * 0.06} rx={carW * 0.56} ry={carW * 0.06} fill="#000" opacity={0.5} />
            <path d={`M${-carW * 0.5},0 L${-carW * 0.5},${-carW * 0.16} Q${-carW * 0.46},${-carW * 0.2} ${-carW * 0.36},${-carW * 0.22} L${-carW * 0.26},${-carW * 0.38} Q${-carW * 0.22},${-carW * 0.42} ${-carW * 0.14},${-carW * 0.42} L${carW * 0.14},${-carW * 0.42} Q${carW * 0.22},${-carW * 0.42} ${carW * 0.26},${-carW * 0.38} L${carW * 0.36},${-carW * 0.22} Q${carW * 0.46},${-carW * 0.2} ${carW * 0.5},${-carW * 0.16} L${carW * 0.5},0 Z`} fill="#0e0522" stroke={glowColor} strokeWidth={1.6 * u} strokeOpacity={0.7} />
            <path d={`M${-carW * 0.22},${-carW * 0.36} L${-carW * 0.14},${-carW * 0.39} L${carW * 0.14},${-carW * 0.39} L${carW * 0.22},${-carW * 0.36} L${carW * 0.25},${-carW * 0.25} L${-carW * 0.25},${-carW * 0.25} Z`} fill="#2a0f55" />
            {[-1, 1].map((sd) => (
              <g key={sd}>
                <rect x={sd * carW * 0.36 - carW * 0.09} y={-carW * 0.15} width={carW * 0.18} height={carW * 0.05} rx={carW * 0.015} fill="#ff2b5e" />
                <ellipse cx={sd * carW * 0.36} cy={-carW * 0.125} rx={carW * 0.16} ry={carW * 0.07} fill="#ff2b5e" opacity={0.45} filter="url(#ogblur)" />
              </g>
            ))}
            <rect x={-carW * 0.4} y={-carW * 0.1} width={carW * 0.8} height={carW * 0.012} fill="#ff2b5e" opacity={0.7} />
          </g>
        )}
      </Svg>
      <Vignette strength={0.45} color="5,0,20" />
    </AbsoluteFill>
  );
};

export const outrunGrid = defineMotion<Props>({
  id: 'outrun-grid',
  title: 'Outrun grid',
  category: 'environment',
  description: 'One-point-perspective neon floor grid scrolling toward the camera to a hot horizon, a banded retro sun with scrolling cut-out stripes, ridged wireframe mountains, palm silhouettes and reflector posts whipping past, a starry sky with a shooting star and a tail-lit car; beats fire a bright shock line across the floor and pump the sun.',
  source: ['mg-styles-15 demos/10-synthwave/index.html (MIT); video 1-4 s'],
  useFor: 'Retro / synthwave backdrop for music, gaming and 80s-themed promos, or a website hero loop (export to webm on mobile).',
  durationInFrames: 180,
  defaultProps: {
    speed: 22,
    gridColor: '#ff3fb4',
    glowColor: '#35e8ff',
    sunColors: ['#ffe45e', '#ff7a3d', '#ff2f8e'],
    skyColors: ['#0a0220', '#3b0a63', '#c2146f'],
    sunRise: 40,
    mountains: true,
    palms: true,
    posts: true,
    pulses: [50, 95, 140],
    car: true,
    stars: 110,
    horizonY: 0.52,
    seed: 5,
  },
  propDocs: {
    speed: 'floor travel speed in world units per second (it ramps in over the first second)',
    gridColor: 'floor grid colour',
    glowColor: 'mountain / palm rim colour',
    sunColors: 'sun gradient top, middle, bottom',
    skyColors: 'sky gradient zenith, mid, horizon',
    sunRise: 'frames for the sun to rise',
    mountains: 'ridged wireframe mountains',
    palms: 'palm silhouettes whipping past',
    posts: 'reflector posts along the road',
    pulses: 'frames of kick hits: shock line across the floor + sun pump',
    car: 'tail-lit car from behind',
    stars: 'number of stars',
    horizonY: 'horizon height as a fraction of the frame',
    seed: 'mountain / star seed',
  },
  component: OutrunGrid,
  tags: ['synthwave', 'outrun', 'retrowave', '80s', 'neon', 'grid', 'sun', 'mountains', 'palm', 'perspective', 'road', 'music', 'gaming', 'background', 'loop', 'vaporwave', 'horizon'],
});
