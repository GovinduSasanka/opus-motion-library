import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LinGrad, TAU, hash01, mixHex, rgba, wrap} from '../../core/environment-kit';
import {LoopStars, NATURE_DOCS, NatureText, cyc, makePalette, sinc, useLoop} from '../../core/nature-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Rainy window over a city at night: defocused rooftops and lit windows, soft bokeh city lights, thin rain
 * outside, and the glass in front — fogged, with clinging beads and larger drops that slide down leaving a wet
 * trail. Everything repeats a whole number of times per loop, so it loops seamlessly.
 */
type Props = {
  timeOfDay: string;
  skyTop: string;
  skyBottom: string;
  lights: string[];
  rain: number;
  drops: number;
  fog: number;
  blur: number;
  frame: boolean;
  speed: number;
  density: number;
  seed: number;
  title: string;
  subtitle: string;
  fontFamily: string;
  ink: string;
  titlePosition: string;
  titleSize: number;
};

const CityRooftopsRainWindow: React.FC<Props> = ({timeOfDay, skyTop, skyBottom, lights, rain, drops, fog, blur, frame, speed, density, seed, title, subtitle, fontFamily, ink, titlePosition, titleSize}) => {
  const {p} = useLoop();
  const {w, h, u, portrait} = useStage();
  const pal = makePalette(timeOfDay, {skyTop, skyBottom, ink});
  const L = lights.length ? lights : ['#FFC857'];
  const hy = h * (portrait ? 0.66 : 0.7);
  const bld = mixHex(pal.top, '#000000', pal.night ? 0.35 : 0.62);
  const bldFar = mixHex(pal.mid, bld, 0.55);

  // building row builder (rects) — far row is lighter, near row darker
  const row = (rowSeed: number, baseY: number, minW: number, maxW: number, minH: number, maxH: number, color: string, winProb: number) => {
    const rects: React.ReactNode[] = [];
    const wins: React.ReactNode[] = [];
    let x = -40 * u;
    let i = 0;
    while (x < w + 40 * u) {
      const bw = (minW + (maxW - minW) * hash01(seed, rowSeed, i, 1)) * u;
      const bh = (minH + (maxH - minH) * hash01(seed, rowSeed, i, 2)) * u;
      rects.push(<rect key={`b${i}`} x={x} y={baseY - bh} width={bw + 1} height={bh + 400 * u} fill={color} />);
      if (hash01(seed, rowSeed, i, 7) < 0.35) {
        rects.push(<rect key={`a${i}`} x={x + bw * 0.45} y={baseY - bh - (30 + 40 * hash01(seed, rowSeed, i, 8)) * u} width={3 * u} height={(30 + 40 * hash01(seed, rowSeed, i, 8)) * u + 2} fill={color} />);
      }
      const cols = Math.max(2, Math.floor(bw / (26 * u)));
      const rws = Math.max(2, Math.floor(bh / (34 * u)));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rws; r++) {
          const hv = hash01(seed, rowSeed, i, c, r, 9);
          if (hv > winProb) continue;
          const col = L[Math.floor(hash01(seed, rowSeed, i, c, r, 10) * L.length) % L.length];
          const flick = hash01(seed, rowSeed, i, c, r, 11) < 0.08 ? 0.55 + 0.45 * sinc(2, p, hv) : 1;
          wins.push(<rect key={`w${i}-${c}-${r}`} x={x + (c + 0.3) * (bw / cols)} y={baseY - bh + (r + 0.35) * 34 * u} width={(bw / cols) * 0.42} height={16 * u} fill={col} opacity={(pal.night ? 0.85 : 0.5) * flick} />);
        }
      }
      x += bw + (hash01(seed, rowSeed, i, 3) * 10) * u;
      i++;
    }
    return (
      <g>
        {rects}
        {wins}
      </g>
    );
  };

  // bokeh city lights
  const bokeh: React.ReactNode[] = [];
  const nb = Math.round(46 * density);
  for (let i = 0; i < nb; i++) {
    const col = L[i % L.length];
    const r = (16 + 46 * Math.pow(hash01(seed, i, 21), 1.6)) * u;
    const x = hash01(seed, i, 22) * w;
    const y = hy - (portrait ? 330 : 240) * u * hash01(seed, i, 23) + 60 * u * hash01(seed, i, 24);
    const pulse = 0.55 + 0.45 * sinc(1 + (i % 3), p, hash01(seed, i, 25));
    bokeh.push(<circle key={i} cx={x} cy={y} r={r} fill={col} opacity={(pal.night ? 0.5 : 0.25) * pulse} />);
  }

  // rain streaks outside (3 depth layers, whole passes per loop)
  const rainPaths: React.ReactNode[] = [];
  if (rain > 0) {
    const layers = [
      {n: 120, len: 36, k: 7, o: 0.1, sw: 1},
      {n: 80, len: 64, k: 11, o: 0.16, sw: 1.4},
      {n: 40, len: 110, k: 16, o: 0.22, sw: 1.8},
    ];
    layers.forEach((Ly, li) => {
      const n = Math.round(Ly.n * rain * density * Math.pow((w * h) / (1920 * 1080), 0.7));
      const len = Ly.len * u;
      const span = h + len * 2;
      const k = Math.max(1, Math.round(Ly.k * (speed <= 0 ? 0 : speed))) * (speed <= 0 ? 0 : 1);
      let d = '';
      for (let i = 0; i < n; i++) {
        const y = wrap(hash01(seed, li, i, 31) * span + span * k * p, span) - len;
        const x = hash01(seed, li, i, 32) * (w + 100 * u) - 50 * u + y * 0.1;
        d += `M${x.toFixed(1)} ${y.toFixed(1)}l${(-len * 0.1).toFixed(1)} ${(-len).toFixed(1)}`;
      }
      rainPaths.push(<path key={li} d={d} stroke="#CFE0F5" strokeWidth={Ly.sw * u} opacity={Ly.o} strokeLinecap="round" fill="none" />);
    });
  }

  // clinging beads on the glass
  const beads: React.ReactNode[] = [];
  const nBeads = Math.round(190 * drops * density);
  for (let i = 0; i < nBeads; i++) {
    const r = (3.5 + 13 * Math.pow(hash01(seed, i, 41), 2.0)) * u;
    const x = hash01(seed, i, 42) * w;
    const y = hash01(seed, i, 43) * h;
    const shim = 0.8 + 0.2 * sinc(1, p, hash01(seed, i, 44));
    beads.push(
      <g key={i} opacity={shim}>
        <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill="url(#crw-bead)" />
        <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.28} ry={r * 0.2} fill="#FFFFFF" opacity={0.7} />
      </g>,
    );
  }

  // running drops with trails
  const runners: React.ReactNode[] = [];
  const nr = Math.round(16 * drops * density);
  const stagger = (q: number, m: number) => q + (0.9 / (TAU * m)) * Math.sin(TAU * m * q);
  for (let i = 0; i < nr; i++) {
    const r = (6 + 7 * hash01(seed, i, 51)) * u;
    const x = hash01(seed, i, 52) * w;
    const k = speed <= 0 ? 0 : Math.max(1, Math.round(speed * (1 + Math.floor(hash01(seed, i, 53) * 2))));
    const m = 2 + Math.floor(hash01(seed, i, 54) * 3);
    const tl = (160 + 220 * hash01(seed, i, 56)) * u * (0.5 + 0.5 * Math.min(1, k));
    const span = h + tl + 4 * r;
    const s = wrap(hash01(seed, i, 55) + k * stagger(p, m), 1);
    const y = s * span - 2 * r;
    const wob = 3 * u * Math.sin(y / (70 * u) + i);
    runners.push(
      <g key={i}>
        <rect x={x + wob - r * 0.32} y={y - tl} width={r * 0.64} height={tl} rx={r * 0.32} fill="url(#crw-trail)" />
        <ellipse cx={x + wob} cy={y} rx={r} ry={r * 1.4} fill="url(#crw-bead)" />
        <ellipse cx={x + wob - r * 0.3} cy={y - r * 0.45} rx={r * 0.3} ry={r * 0.25} fill="#FFFFFF" opacity={0.8} />
      </g>,
    );
  }

  const fb = 18 * u;
  return (
    <AbsoluteFill style={{background: pal.top}}>
      <Svg>
        <defs>
          <LinGrad id="crw-sky" y1={0} y2={1} stops={[[0, pal.top], [1, pal.bottom]]} />
          <filter id="crw-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={7 * u * blur} />
          </filter>
          <filter id="crw-blur2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={9 * u * blur} />
          </filter>
          <filter id="crw-blur3" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={3 * u * blur} />
          </filter>
          <radialGradient id="crw-bead" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.1} />
            <stop offset="0.7" stopColor="#CFE3FF" stopOpacity={0.22} />
            <stop offset="1" stopColor="#0A1424" stopOpacity={0.6} />
          </radialGradient>
          <LinGrad id="crw-trail" y1={0} y2={1} stops={[[0, '#CFE3FF', 0], [1, '#CFE3FF', 0.22]]} />
          <radialGradient id="crw-fog" cx="0.5" cy="0.8" r="0.9">
            <stop offset="0" stopColor="#BFD3EA" stopOpacity={0.16 * fog} />
            <stop offset="1" stopColor="#BFD3EA" stopOpacity={0.06 * fog} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#crw-sky)" />
        {pal.night ? <LoopStars count={Math.round(60 * density)} seed={seed + 2} p={p} area={[0, 0, 1, 0.3]} fade={0.45} /> : null}
        <g filter="url(#crw-blur)">{row(1, hy - 10 * u, 70, 150, 90, 330, bldFar, 0.28)}</g>
        <g filter="url(#crw-blur2)" style={{mixBlendMode: 'screen'}}>{bokeh}</g>
        <g filter="url(#crw-blur3)">{row(2, h + 2 * u, 110, 260, (portrait ? 210 : 170), (portrait ? 330 : 250), bld, 0.2)}</g>
        <g fill="none">{rainPaths}</g>
        <rect width={w} height={h} fill="url(#crw-fog)" />
        <g>{beads}</g>
        <g>{runners}</g>
        {frame ? (
          <g fill={mixHex(bld, '#000000', 0.7)}>
            <rect x={0} y={0} width={w} height={fb} />
            <rect x={0} y={h - fb * 1.8} width={w} height={fb * 1.8} />
            <rect x={0} y={0} width={fb} height={h} />
            <rect x={w - fb} y={0} width={fb} height={h} />
          </g>
        ) : null}
      </Svg>
      <NatureText title={title} subtitle={subtitle} fontFamily={fontFamily} ink={pal.ink} position={titlePosition} size={titleSize} shadow={rgba('#000010', 0.55)} />
    </AbsoluteFill>
  );
};

export const cityRooftopsRainWindow = defineMotion<Props>({
  id: 'city-rooftops-rain-window',
  title: 'City rooftops rain window',
  category: 'environment',
  description:
    'A rainy window over a defocused city: blurred rooftops with lit windows, soft bokeh lights, thin rain outside, and fogged glass with clinging beads and larger drops that slide down leaving trails; loops seamlessly, night / dusk / dawn / day palettes and a custom light colour list.',
  source: ['original — round 3 nature backdrops'],
  useFor:
    'Moody lo-fi / study-beats / podcast backdrops, melancholy or cosy titles, noir and thriller scenes, weather and "rainy day" content, city-life brand heroes; add a title or put your own UI over the glass.',
  durationInFrames: 240,
  defaultProps: {
    timeOfDay: 'night',
    skyTop: '',
    skyBottom: '',
    lights: ['#FFB347', '#FF6B6B', '#6EC1FF', '#FFE08A'],
    rain: 1,
    drops: 1,
    fog: 1,
    blur: 1,
    frame: true,
    speed: 1,
    density: 1,
    seed: 9,
    title: '',
    subtitle: '',
    fontFamily: 'serif',
    ink: '',
    titlePosition: 'center',
    titleSize: 1,
  },
  propDocs: {
    timeOfDay: NATURE_DOCS.timeOfDay,
    skyTop: NATURE_DOCS.skyTop,
    skyBottom: NATURE_DOCS.skyBottom,
    lights: 'city light / lit-window / bokeh colours (hex list)',
    rain: 'rain streaks outside the glass (0 = none)',
    drops: 'amount of water drops on the glass (0 = clean glass)',
    fog: 'condensation haze on the glass (0 = none)',
    blur: 'defocus of the city behind the glass (0 = sharp)',
    frame: 'dark window frame around the edges',
    speed: NATURE_DOCS.speed,
    density: NATURE_DOCS.density,
    seed: NATURE_DOCS.seed,
    title: NATURE_DOCS.title,
    subtitle: NATURE_DOCS.subtitle,
    fontFamily: NATURE_DOCS.fontFamily,
    ink: NATURE_DOCS.ink,
    titlePosition: NATURE_DOCS.titlePosition,
    titleSize: NATURE_DOCS.titleSize,
  },
  component: CityRooftopsRainWindow,
  tags: ['rain', 'window', 'city', 'night', 'bokeh', 'rooftops', 'raindrops', 'lo-fi', 'moody', 'cozy', 'noir', 'loop', 'backdrop', 'weather', 'urban', 'glass', 'condensation'],
});
