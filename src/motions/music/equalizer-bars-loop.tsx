import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, ramp, rgbaStr} from '../../core/r2-pr3-kit';
import {rng} from '../../core/random';

/**
 * Seamless equalizer loop. Every bar height is a sum of sine harmonics whose cycle counts are whole numbers per
 * loop (the loop length is the composition length), so frame 0 and the last frame match exactly and the clip can be
 * looped forever as a backdrop, overlay or avatar-ring. `bpm` sets the beat harmonic. No text, transparent-capable.
 */
type Props = {
  bars: number;
  style: 'bars' | 'segments' | 'dots' | 'mirror';
  colors: string[];
  colorMode: 'across' | 'height';
  bpm: number;
  profile: 'bass-left' | 'flat' | 'bell' | 'bass-right';
  widthFrac: number;
  heightFrac: number;
  gap: number;
  align: 'bottom' | 'center';
  glow: number;
  reflection: boolean;
  background: string;
  seed: number;
};

const EqualizerBarsLoop: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const T = Math.max(1, durationInFrames);
  const secs = T / fps;
  const N = Math.max(4, Math.min(120, Math.round(P.bars)));
  const k0 = Math.max(1, Math.round((P.bpm / 60) * secs)); // beat cycles per loop
  const cols = P.colors.length ? P.colors : ['#7CF5C8'];
  const colAt = (k: number) => ramp(cols.map((c, i) => [cols.length === 1 ? 0 : i / (cols.length - 1), c] as [number, string]), clamp(k));
  const clear = P.background === 'transparent';

  const bars = React.useMemo(() => {
    const r = rng(P.seed * 977 + 3);
    return Array.from({length: N}, (_, i) => ({
      ph: [r(), r(), r(), r()],
      mulA: 1 + Math.floor(r() * 2), // 1..2 x beat
      mulB: 2 + Math.floor(r() * 3), // 2..4 x beat
      wA: 0.5 + r() * 0.5,
      wB: 0.3 + r() * 0.5,
      cap: 0.75 + r() * 0.25,
      i,
    }));
  }, [N, P.seed]);

  const heightOf = (b: (typeof bars)[number]) => {
    const t = frame / T;
    const x = N === 1 ? 0 : b.i / (N - 1);
    const prof = P.profile === 'flat' ? 1 : P.profile === 'bell' ? 0.45 + 0.55 * Math.sin(Math.PI * x) : P.profile === 'bass-right' ? 0.35 + 0.65 * x : 1 - 0.65 * x;
    const beat = Math.pow(0.5 + 0.5 * Math.sin(2 * Math.PI * (k0 * t + b.ph[0])), 2.2);
    const a = 0.5 + 0.5 * Math.sin(2 * Math.PI * (k0 * b.mulA * t + b.ph[1]));
    const c = 0.5 + 0.5 * Math.sin(2 * Math.PI * (k0 * b.mulB * t + b.ph[2]));
    const mixv = (beat * (0.4 + 0.6 * prof) + a * b.wA * 0.5 + c * b.wB * 0.35) / (0.4 + 0.6 * prof + b.wA * 0.5 + b.wB * 0.35);
    return clamp(0.08 + 0.92 * Math.pow(mixv, 1.15) * (0.55 + 0.45 * prof) * b.cap + 0.04);
  };

  const W = w * clamp(P.widthFrac, 0.1, 1);
  const H = Math.min(h * clamp(P.heightFrac, 0.1, 1) * (portrait ? 0.7 : 1), P.align === 'bottom' ? h * 0.85 : h);
  const x0 = (w - W) / 2;
  const base = P.style === 'mirror' ? h / 2 : P.align === 'bottom' ? h * 0.9 : (h + H) / 2;
  const slot = W / N;
  const gapF = clamp(P.gap, 0, 0.9);
  const bw = slot * (1 - gapF);
  const nodes: React.ReactNode[] = [];
  const segN = 16;

  bars.forEach((b) => {
    const v = heightOf(b);
    const x = x0 + b.i * slot + (slot - bw) / 2;
    const fullH = P.style === 'mirror' ? H / 2 : H;
    const hh = v * fullH;
    const cAcross = colAt(N === 1 ? 0 : b.i / (N - 1));
    if (P.style === 'bars' || P.style === 'mirror') {
      const fill = P.colorMode === 'height' ? undefined : cAcross;
      const f = fill ?? 'url(#eql-hg)';
      if (P.style === 'mirror') {
        nodes.push(<rect key={`r${b.i}`} x={x} y={base - hh} width={bw} height={hh * 2} rx={Math.min(bw / 2, hh)} fill={f} />);
      } else {
        nodes.push(<rect key={`r${b.i}`} x={x} y={base - hh} width={bw} height={hh} rx={bw / 2} fill={f} />);
        if (P.reflection && P.align === 'bottom') nodes.push(<rect key={`f${b.i}`} x={x} y={base + 6 * u} width={bw} height={hh * 0.35} rx={bw / 2} fill={f} opacity={0.14} />);
      }
    } else if (P.style === 'segments') {
      const sh = fullH / segN;
      const lit = Math.round(v * segN);
      for (let s = 0; s < segN; s++) {
        const on = s < lit;
        const c = P.colorMode === 'height' ? colAt(s / (segN - 1)) : cAcross;
        nodes.push(<rect key={`s${b.i}-${s}`} x={x} y={base - (s + 1) * sh + sh * 0.12} width={bw} height={sh * 0.76} rx={Math.min(bw, sh) * 0.18} fill={c} opacity={on ? 1 : 0.1} />);
      }
    } else {
      const dr = bw / 2;
      const rows = Math.max(1, Math.floor(fullH / (bw * 1.25)));
      const lit = Math.round(v * rows);
      for (let s = 0; s < rows; s++) {
        const on = s < lit;
        const c = P.colorMode === 'height' ? colAt(s / Math.max(1, rows - 1)) : cAcross;
        nodes.push(<circle key={`d${b.i}-${s}`} cx={x + dr} cy={base - dr - s * bw * 1.25} r={dr * 0.86} fill={c} opacity={on ? 1 : 0.09} />);
      }
    }
  });

  return (
    <AbsoluteFill style={{background: clear ? undefined : `radial-gradient(ellipse at 50% 70%, ${mix(P.background, colAt(0.5), 0.1)} 0%, ${P.background} 70%)`}}>
      <Svg>
        <defs>
          <linearGradient id="eql-hg" gradientUnits="userSpaceOnUse" x1="0" y1={base} x2="0" y2={base - (P.style === 'mirror' ? H / 2 : H)}>
            {cols.map((c, ci) => (
              <stop key={ci} offset={cols.length === 1 ? 0 : ci / (cols.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
          <filter id="eql-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.max(0.01, P.glow) * 14 * u} />
          </filter>
        </defs>
        {P.glow > 0 && (
          <g filter="url(#eql-glow)" opacity={clamp(P.glow, 0, 1) * 0.7}>
            {nodes}
          </g>
        )}
        <g>{nodes}</g>
        {P.style === 'bars' && <line x1={x0} x2={x0 + W} y1={base} y2={base} stroke={rgbaStr('#ffffff', 0.14)} strokeWidth={2 * u} />}
      </Svg>
    </AbsoluteFill>
  );
};

export const equalizerBarsLoop = defineMotion<Props>({
  id: 'equalizer-bars-loop',
  title: 'Equalizer bars (seamless loop)',
  category: 'music',
  description:
    'A seamlessly looping equalizer: rounded bars, LED segments, dot stacks or a mirrored centre-line spectrum, bar count, colours, bass profile and glow all adjustable. Heights are beat-locked sine harmonics with whole cycles per loop, so the last frame flows into the first. Text-free, transparent-capable.',
  source: ['original (looping equalizer pattern)'],
  useFor: 'Looping music-player glyphs, podcast / radio / stream backdrops, "audio playing" indicators, DJ and event lower thirds, lyric-video bases when no soundtrack is wired. Use a short duration (2-4 s) and loop it.',
  durationInFrames: 120,
  defaultProps: {
    bars: 32,
    style: 'bars',
    colors: ['#7CF5C8', '#5B8CFF', '#FF6FB5'],
    colorMode: 'across',
    bpm: 120,
    profile: 'bass-left',
    widthFrac: 0.7,
    heightFrac: 0.45,
    gap: 0.36,
    align: 'center',
    glow: 0.4,
    reflection: true,
    background: '#0A0C16',
    seed: 7,
  },
  propDocs: {
    bars: 'number of bars (4-120)',
    style: "'bars' | 'segments' (LED blocks) | 'dots' | 'mirror' (grows both ways from the centre line)",
    colors: 'gradient colours (across the bars, or bottom-to-top when colorMode is height)',
    colorMode: "'across' = colour by bar position | 'height' = colour by level (VU style)",
    bpm: 'tempo that sets the main beat cycles per loop (rounded to whole cycles so the loop is seamless)',
    profile: "energy shape across the spectrum: 'bass-left' | 'bass-right' | 'bell' | 'flat'",
    widthFrac: 'width of the equalizer as a fraction of the frame width',
    heightFrac: 'maximum height as a fraction of the frame height',
    gap: 'gap between bars as a fraction of the slot (0-0.9)',
    align: "'center' = block centred vertically | 'bottom' = baseline near the bottom edge (mirror style always centres)",
    glow: 'blurred glow strength 0-1 (0 = off)',
    reflection: 'faint reflection under the baseline (bars style, bottom align)',
    background: "background colour, or 'transparent' to overlay on video",
    seed: 'pattern seed',
  },
  component: EqualizerBarsLoop,
  tags: ['equalizer', 'bars', 'loop', 'loops', 'seamless', 'audio', 'music', 'visualizer', 'visualiser', 'spectrum', 'level meter', 'vu', 'podcast', 'radio', 'playing', 'overlay', 'led'],
});
