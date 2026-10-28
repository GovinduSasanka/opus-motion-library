import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LinGrad, TAU, hash01, mixHex, rgba, ridgePath} from '../../core/environment-kit';
import {LoopStars, NATURE_DOCS, NatureText, cyc, sinc, useLoop} from '../../core/nature-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Firefly meadow at night: moonlit sky with stars, rolling hills and a tree line, two layers of swaying
 * grass and dozens of fireflies drifting on closed Lissajous loops and pulsing on their own blink rhythm.
 * Everything repeats a whole number of times per loop, so it loops seamlessly.
 */
type Props = {
  skyTop: string;
  skyBottom: string;
  grassColor: string;
  glowColor: string;
  moon: boolean;
  moonX: number;
  fireflies: number;
  glowSize: number;
  sway: number;
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

const FireflyMeadowNight: React.FC<Props> = ({skyTop, skyBottom, grassColor, glowColor, moon, moonX, fireflies, glowSize, sway, speed, density, seed, title, subtitle, fontFamily, ink, titlePosition, titleSize}) => {
  const {p} = useLoop();
  const {w, h, u, portrait} = useStage();
  const top = skyTop || '#040814';
  const bottom = skyBottom || '#16305A';
  const grass = grassColor || '#123B2C';
  const glow = glowColor || '#FFE27A';
  const hy = h * (portrait ? 0.56 : 0.62);
  const step = Math.max(6, 10 * u);
  const hillFar = mixHex(bottom, grass, 0.55);
  const hillNear = mixHex(grass, '#02100A', 0.45);
  const mx = w * moonX;
  const my = h * (portrait ? 0.2 : 0.22);
  const moonR = (portrait ? 80 : 86) * u;

  // grass blades (two layers) — tip sways with whole-cycle sine
  const blades = (layer: number) => {
    const n = Math.round((portrait ? 150 : 260) * density * (layer === 0 ? 1 : 0.8));
    let d = '';
    for (let i = 0; i < n; i++) {
      const x = ((i + hash01(seed, layer, i, 1)) / n) * (w + 60 * u) - 30 * u;
      const bh = (layer === 0 ? 70 + 120 * hash01(seed, layer, i, 2) : 120 + 220 * hash01(seed, layer, i, 2)) * u * (portrait ? 1.1 : 1);
      const baseY = h + 6 * u;
      const lean = (hash01(seed, layer, i, 3) - 0.5) * 30 * u;
      const swayX = sway * (10 + 12 * layer) * u * sinc(cyc(speed, 1 + (i % 2)), p, x / (w * 0.9) + 0.13 * layer);
      const tipX = x + lean + swayX;
      const tipY = baseY - bh;
      const bw = (4 + 4 * hash01(seed, layer, i, 4)) * u;
      d += `M${(x - bw).toFixed(1)} ${baseY}Q${(x + lean * 0.3 + swayX * 0.3).toFixed(1)} ${(baseY - bh * 0.55).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}Q${(x + bw + lean * 0.3 + swayX * 0.3).toFixed(1)} ${(baseY - bh * 0.5).toFixed(1)} ${(x + bw).toFixed(1)} ${baseY}Z`;
    }
    return d;
  };

  const ff: React.ReactNode[] = [];
  const nf = Math.round(fireflies * density);
  const c1 = cyc(speed, 1);
  for (let i = 0; i < nf; i++) {
    const depth = hash01(seed, i, 1);
    const bx = hash01(seed, i, 2) * w;
    const by = hy - 30 * u + (h * 0.98 - hy) * Math.pow(hash01(seed, i, 3), 0.8);
    const sc = 0.55 + 0.9 * (by - hy) / (h - hy + 1) + 0.15 * depth;
    const ax = (50 + 120 * hash01(seed, i, 4)) * u * sc;
    const ay = (30 + 80 * hash01(seed, i, 5)) * u * sc;
    const kx = Math.max(1, c1 * (1 + Math.floor(hash01(seed, i, 6) * 2)));
    const ky = Math.max(1, c1 * (1 + Math.floor(hash01(seed, i, 7) * 3)));
    const x = bx + ax * Math.sin(TAU * (kx * p + hash01(seed, i, 8))) + 0.4 * ax * Math.sin(TAU * (2 * kx * p + hash01(seed, i, 9)));
    const y = by + ay * Math.sin(TAU * (ky * p + hash01(seed, i, 10)));
    // blink: smooth on/off pulses, 2-4 per loop
    const bc = 2 + Math.floor(hash01(seed, i, 11) * 3);
    const b = Math.pow(Math.max(0, 0.5 + 0.5 * Math.sin(TAU * (bc * p + hash01(seed, i, 12)))), 2.2);
    const o = 0.12 + 0.88 * b;
    const r = (3.8 + 2.4 * hash01(seed, i, 13)) * u * sc;
    const gr = r * 7 * glowSize;
    ff.push(
      <g key={i} opacity={o}>
        <circle cx={x} cy={y} r={gr} fill="url(#ffm-glow)" />
        <circle cx={x} cy={y} r={r} fill={mixHex(glow, '#FFFFFF', 0.55)} />
      </g>,
    );
  }

  return (
    <AbsoluteFill style={{background: top}}>
      <Svg>
        <defs>
          <LinGrad id="ffm-sky" y1={0} y2={1} stops={[[0, top], [1, bottom]]} />
          <radialGradient id="ffm-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={glow} stopOpacity={0.85} />
            <stop offset="0.3" stopColor={glow} stopOpacity={0.28} />
            <stop offset="1" stopColor={glow} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ffm-moon" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#DCE8FF" stopOpacity={0.55} />
            <stop offset="0.45" stopColor="#DCE8FF" stopOpacity={0.14} />
            <stop offset="1" stopColor="#DCE8FF" stopOpacity={0} />
          </radialGradient>
          <LinGrad id="ffm-ground" y1={0} y2={1} stops={[[0, hillFar], [1, hillNear]]} />
        </defs>
        <rect width={w} height={h} fill="url(#ffm-sky)" />
        <LoopStars count={Math.round(170 * density)} seed={seed + 11} p={p} area={[0, 0, 1, 0.55]} />
        {moon ? (
          <g>
            <circle cx={mx} cy={my} r={moonR * 5} fill="url(#ffm-moon)" />
            <circle cx={mx} cy={my} r={moonR} fill="#EAF1FF" />
            <circle cx={mx - moonR * 0.28} cy={my - moonR * 0.18} r={moonR * 0.2} fill="#CBD8F0" opacity={0.7} />
            <circle cx={mx + moonR * 0.3} cy={my + moonR * 0.25} r={moonR * 0.28} fill="#CBD8F0" opacity={0.55} />
          </g>
        ) : null}
        <path d={ridgePath(`ffh${seed}`, -step, w + step, hy - 20 * u, 70 * u, 900 * u, h + 10, {step})} fill={mixHex(bottom, hillFar, 0.55)} />
        {/* tree line */}
        <path d={ridgePath(`fft${seed}`, -step, w + step, hy + 10 * u, 44 * u, 120 * u, h + 10, {ridged: true, octaves: 2, step})} fill={mixHex(grass, '#000', 0.55)} />
        <path d={ridgePath(`ffg${seed}`, -step, w + step, hy + 70 * u, 50 * u, 700 * u, h + 10, {step})} fill="url(#ffm-ground)" />
        <path d={blades(0)} fill={mixHex(grass, '#000', 0.35)} />
        <g>{ff}</g>
        <path d={blades(1)} fill={mixHex(hillNear, '#000', 0.4)} />
      </Svg>
      <NatureText title={title} subtitle={subtitle} fontFamily={fontFamily} ink={ink || '#EAF2FF'} position={titlePosition} size={titleSize} shadow={rgba('#000000', 0.5)} />
    </AbsoluteFill>
  );
};

export const fireflyMeadowNight = defineMotion<Props>({
  id: 'firefly-meadow-night',
  title: 'Firefly meadow night',
  category: 'environment',
  description:
    'A moonlit meadow: starry sky, rolling hills and tree line, two layers of swaying grass blades and dozens of fireflies drifting on closed loops and pulsing softly; loops seamlessly.',
  source: ['original — round 3 nature backdrops'],
  useFor:
    'Magical, cosy or calm night backdrop for bedtime stories, meditation / sleep apps, fantasy and fairytale titles, cottagecore, wedding / romantic videos, "end of day" screens and lyric videos.',
  durationInFrames: 240,
  defaultProps: {
    skyTop: '',
    skyBottom: '',
    grassColor: '',
    glowColor: '',
    moon: true,
    moonX: 0.72,
    fireflies: 46,
    glowSize: 1,
    sway: 1,
    speed: 1,
    density: 1,
    seed: 6,
    title: '',
    subtitle: '',
    fontFamily: 'serif',
    ink: '',
    titlePosition: 'top',
    titleSize: 1,
  },
  propDocs: {
    skyTop: 'top sky colour (hex); empty = deep navy',
    skyBottom: 'horizon sky colour (hex); empty = midnight blue',
    grassColor: 'meadow colour (hex); nearer grass and hills darken from it; empty = forest green',
    glowColor: 'firefly glow colour (hex); empty = warm yellow',
    moon: 'show the moon',
    moonX: 'moon horizontal position, 0 (left) – 1 (right)',
    fireflies: 'firefly count at default density',
    glowSize: 'firefly glow radius multiplier',
    sway: 'grass sway amount (0 = still)',
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
  component: FireflyMeadowNight,
  tags: ['fireflies', 'meadow', 'night', 'moon', 'grass', 'stars', 'magic', 'fantasy', 'bedtime', 'sleep', 'calm', 'loop', 'backdrop', 'nature', 'landscape', 'glow', 'romantic'],
});
