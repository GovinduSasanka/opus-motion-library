import React from 'react';
import {AbsoluteFill, Audio, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, ramp, rgbaStr, useAudioReactive} from '../../core/r2-pr3-kit';

/**
 * Audio spectrum. Bars, a circular spectrum, a flowing wave or a phosphor oscilloscope that react to the real
 * soundtrack (src, via @remotion/media-utils: log-spaced bands, release smoothing, peak hold) — or to a synthetic
 * beat at `bpm` when no src is given, so it still looks alive in previews. useAudioEnergy(src, frame, fps) is
 * exported for driving other motions' scale / glow.
 */
type Props = {
  src: string;
  playAudio: boolean;
  mode: 'bars' | 'circle' | 'wave' | 'scope';
  bins: number;
  smoothing: number;
  peakHold: number;
  sensitivity: number;
  bpm: number;
  mirror: boolean;
  colors: string[];
  title: string;
  caption: string;
  background: string;
  seed: number;
};

const AudioSpectrum: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx, cy, portrait} = useStage();
  const au = useAudioReactive(P.src, frame, fps, {bins: P.bins, smoothing: P.smoothing, peakHold: P.peakHold, sensitivity: P.sensitivity, bpm: P.bpm, seed: P.seed});
  const intro = prog(frame, 0, 18, ease.out);
  const textIn = prog(frame, 14, 40, ease.out);
  const cols = P.colors.length ? P.colors : ['#7CF5C8'];
  const colAt = (k: number) => ramp(cols.map((c, i) => [cols.length === 1 ? 0 : i / (cols.length - 1), c] as [number, string]), k);
  const N = au.bands.length;
  const nodes: React.ReactNode[] = [];
  const uid = 'aspec';
  const kick = au.bass;

  if (P.mode === 'bars') {
    const W = w * (portrait ? 0.86 : 0.78);
    const x0 = (w - W) / 2;
    const slot = W / N;
    const bw = slot * 0.66;
    const base = P.mirror ? cy : h * (portrait ? 0.62 : 0.7);
    const maxH = (P.mirror ? 0.5 : 1) * h * (portrait ? 0.3 : 0.42);
    for (let i = 0; i < N; i++) {
      const v = au.bands[i] * intro;
      const hh = Math.max(4 * u, v * maxH);
      const x = x0 + i * slot + (slot - bw) / 2;
      const c = colAt(i / Math.max(1, N - 1));
      nodes.push(<rect key={`b${i}`} x={x} y={base - hh} width={bw} height={hh} rx={bw / 2} fill={c} />);
      if (P.mirror) nodes.push(<rect key={`m${i}`} x={x} y={base} width={bw} height={hh} rx={bw / 2} fill={c} opacity={0.85} />);
      else nodes.push(<rect key={`r${i}`} x={x} y={base + 8 * u} width={bw} height={hh * 0.45} rx={bw / 2} fill={c} opacity={0.14} />);
      const pk = Math.max(v, au.peaks[i] * intro) * maxH;
      nodes.push(<rect key={`p${i}`} x={x} y={base - pk - 10 * u} width={bw} height={4 * u} rx={2 * u} fill="#fff" opacity={0.75} />);
      if (P.mirror) nodes.push(<rect key={`pm${i}`} x={x} y={base + pk + 6 * u} width={bw} height={4 * u} rx={2 * u} fill="#fff" opacity={0.4} />);
    }
    nodes.push(<line key="base" x1={x0} x2={x0 + W} y1={base} y2={base} stroke={rgbaStr('#ffffff', 0.18)} strokeWidth={2 * u} />);
  } else if (P.mode === 'circle') {
    const R0 = Math.min(w, h) * (portrait ? 0.2 : 0.2) * (1 + kick * 0.06);
    const L = Math.min(w, h) * 0.2;
    const rot = (frame / fps) * 0.12;
    const total = N * 2; // mirrored left / right
    for (let k = 0; k < total; k++) {
      const i = k < N ? k : total - 1 - k;
      const a = (k / total) * Math.PI * 2 - Math.PI / 2 + rot;
      const v = au.bands[i] * intro;
      const len = Math.max(3 * u, v * L);
      const x1 = cx + Math.cos(a) * R0;
      const y1 = cy + Math.sin(a) * R0;
      const x2 = cx + Math.cos(a) * (R0 + len);
      const y2 = cy + Math.sin(a) * (R0 + len);
      nodes.push(<line key={`c${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colAt(i / Math.max(1, N - 1))} strokeWidth={Math.max(3 * u, ((Math.PI * 2 * R0) / total) * 0.62)} strokeLinecap="round" />);
      const pk = Math.max(v, au.peaks[i] * intro) * L;
      const x3 = cx + Math.cos(a) * (R0 + pk + 12 * u);
      const y3 = cy + Math.sin(a) * (R0 + pk + 12 * u);
      nodes.push(<circle key={`cp${k}`} cx={x3} cy={y3} r={2.2 * u} fill="#fff" opacity={0.7} />);
    }
    nodes.push(<circle key="ring" cx={cx} cy={cy} r={R0 - 14 * u} fill="none" stroke={rgbaStr(colAt(0.5), 0.4)} strokeWidth={2 * u} />);
    nodes.push(<circle key="disc" cx={cx} cy={cy} r={(R0 - 26 * u) * (1 + kick * 0.05)} fill={rgbaStr(colAt(0.3), 0.12 + kick * 0.2)} />);
  } else if (P.mode === 'wave') {
    const W = w * 0.96;
    const x0 = (w - W) / 2;
    const layers = [
      {a: 1, off: 0, amp: 1, alpha: 0.9},
      {a: 0.7, off: 5, amp: 0.7, alpha: 0.45},
      {a: 0.45, off: 11, amp: 0.45, alpha: 0.28},
    ];
    const maxH = h * (portrait ? 0.2 : 0.3);
    layers.forEach((ly, li) => {
      const pts: [number, number][] = [];
      const m = 80;
      for (let k = 0; k <= m; k++) {
        const x01 = k / m;
        const idx = Math.min(N - 1, Math.floor(Math.abs(x01 * 2 - 1) * (N - 1) * 0.92)); // mirrored: bass in the middle
        const env = Math.sin(Math.PI * x01) ** 0.7;
        const wob = Math.sin(x01 * 18 + frame * 0.12 * (li + 1) + li) * 0.18 + 0.82;
        pts.push([x0 + W * x01, au.bands[idx] * intro * env * wob * ly.amp * maxH]);
      }
      const top = pts.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)} ${(cy - p[1]).toFixed(1)}`).join('');
      const bot = [...pts].reverse().map((p) => `L${p[0].toFixed(1)} ${(cy + p[1] * 0.85).toFixed(1)}`).join('');
      nodes.push(<path key={`w${li}`} d={`${top}${bot}Z`} fill={`url(#${uid}-wv${li})`} opacity={ly.alpha} stroke={colAt(li * 0.4)} strokeWidth={2.2 * u} strokeLinejoin="round" />);
    });
    nodes.push(<line key="wl" x1={x0} x2={x0 + W} y1={cy} y2={cy} stroke={rgbaStr('#ffffff', 0.25)} strokeWidth={1.5 * u} />);
  } else {
    // scope
    const gx = w * 0.08;
    const gw = w - gx * 2;
    const gy = h * (portrait ? 0.3 : 0.2);
    const gh = h * (portrait ? 0.4 : 0.6);
    const c0 = cols[0];
    for (let i = 0; i <= 10; i++) nodes.push(<line key={`gx${i}`} x1={gx + (gw * i) / 10} x2={gx + (gw * i) / 10} y1={gy} y2={gy + gh} stroke={rgbaStr(c0, i === 5 ? 0.3 : 0.12)} strokeWidth={1.4 * u} />);
    for (let i = 0; i <= 8; i++) nodes.push(<line key={`gy${i}`} x1={gx} x2={gx + gw} y1={gy + (gh * i) / 8} y2={gy + (gh * i) / 8} stroke={rgbaStr(c0, i === 4 ? 0.3 : 0.12)} strokeWidth={1.4 * u} />);
    const wv = au.wave;
    const d = wv.map((v, k) => `${k ? 'L' : 'M'}${(gx + (gw * k) / (wv.length - 1)).toFixed(1)} ${(gy + gh / 2 - v * (gh * 0.42) * intro).toFixed(1)}`).join('');
    nodes.push(<path key="s1" d={d} fill="none" stroke={c0} strokeWidth={9 * u} opacity={0.22} strokeLinejoin="round" filter={`url(#${uid}-blur)`} />);
    nodes.push(<path key="s2" d={d} fill="none" stroke={mix(c0, '#ffffff', 0.5)} strokeWidth={3 * u} strokeLinejoin="round" strokeLinecap="round" />);
    nodes.push(
      <text key="sr" x={gx} y={gy - 18 * u} fontFamily={fonts.mono} fontSize={22 * u} fill={rgbaStr(c0, 0.7)} letterSpacing={2 * u}>
        CH1 · {(au.level * 100).toFixed(0).padStart(3, '0')}% · {P.bpm} BPM
      </text>,
    );
  }

  const label = (
    <g opacity={textIn} transform={`translate(0 ${(1 - textIn) * 12 * u})`}>
      {P.mode === 'circle' ? (
        <>
          <text x={cx} y={cy + 4 * u} textAnchor="middle" fontFamily={fonts.display} fontSize={(portrait ? 40 : 44) * u} fill="#fff">
            {P.title}
          </text>
          <text x={cx} y={cy + 44 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={20 * u} letterSpacing={3 * u} fill={rgbaStr('#ffffff', 0.6)}>
            {P.caption}
          </text>
        </>
      ) : (
        <>
          <text x={w * 0.08} y={h * (portrait ? 0.14 : 0.14)} fontFamily={fonts.display} fontSize={(portrait ? 56 : 60) * u} fill="#fff">
            {P.title}
          </text>
          <text x={w * 0.08} y={h * (portrait ? 0.14 : 0.14) + 46 * u} fontFamily={fonts.mono} fontSize={22 * u} letterSpacing={3 * u} fill={rgbaStr('#ffffff', 0.6)}>
            {P.caption}
          </text>
        </>
      )}
    </g>
  );

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 60%, ${mix(P.background, colAt(0.5), 0.1)} 0%, ${P.background} 62%, ${mix(P.background, '#000000', 0.5)} 100%)`}}>
      {P.src && P.playAudio && <Audio src={resolveSrc(P.src)} />}
      <Svg>
        <defs>
          {[0, 1, 2].map((li) => (
            <linearGradient key={li} id={`${uid}-wv${li}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={colAt(0)} stopOpacity="0.6" />
              <stop offset="0.5" stopColor={colAt(0.5)} stopOpacity="0.6" />
              <stop offset="1" stopColor={colAt(1)} stopOpacity="0.6" />
            </linearGradient>
          ))}
          <filter id={`${uid}-blur`}>
            <feGaussianBlur stdDeviation={5 * u} />
          </filter>
        </defs>
        {nodes}
        {label}
      </Svg>
    </AbsoluteFill>
  );
};

export const audioSpectrum = defineMotion<Props>({
  id: 'audio-spectrum',
  title: 'Audio spectrum (bars / circle / wave / scope)',
  category: 'music',
  description:
    'Audio-reactive visualiser: rounded gradient bars with peak-hold caps, a circular spectrum around a pulsing disc, a layered mirrored wave, or a green-phosphor oscilloscope, driven by the real soundtrack (64-128 log-spaced bins, release smoothing, peak hold) or by a synthetic beat when no file is given. Exports useAudioEnergy() to drive other motions.',
  source: ['prompt-corpus research: audio-spectrum (13 cases, ideas only; original implementation)'],
  useFor: 'Music promos, podcast and audiogram clips, DJ / event ads, lyric-video backdrops; pass the same soundtrack path the composition plays.',
  durationInFrames: 240,
  defaultProps: {
    src: '',
    playAudio: false,
    mode: 'bars',
    bins: 64,
    smoothing: 0.72,
    peakHold: 8,
    sensitivity: 1,
    bpm: 118,
    mirror: false,
    colors: ['#7CF5C8', '#5B8CFF', '#FF6FB5'],
    title: 'Night Signal',
    caption: 'LIVE MIX',
    background: '#0A0C16',
    seed: 3,
  },
  propDocs: {
    src: 'soundtrack path under public/ (or URL); empty = synthetic beat',
    playAudio: 'also play the file in this layer (leave false if the composition already plays it)',
    mode: "'bars' | 'circle' | 'wave' | 'scope'",
    bins: 'number of frequency bands (32-128)',
    smoothing: 'release smoothing 0.5-0.9 (attack is instant)',
    peakHold: 'frames the peak caps hold before falling',
    sensitivity: 'input gain multiplier',
    bpm: 'tempo of the synthetic beat (and the scope readout)',
    mirror: 'bars: grow up and down from the centre line',
    colors: 'gradient colours across the spectrum (scope uses the first)',
    title: 'title text',
    caption: 'small caption',
    background: 'background colour',
    seed: 'synthetic beat seed',
  },
  component: AudioSpectrum,
  tags: ['audio', 'spectrum', 'equalizer', 'visualizer', 'visualiser', 'waveform', 'oscilloscope', 'bars', 'music', 'beat', 'reactive', 'audiogram', 'podcast', 'dj', 'sound', 'fft', 'peak hold', 'circular'],
});
