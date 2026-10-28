import React from 'react';
import {AbsoluteFill, Audio, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, rgb3, rgbaStr, useAudioReactive} from '../../core/r2-pr3-kit';
import {ArtBox, fmtTime, seededWave, wrapText} from '../../core/music-kit';

/**
 * Podcast audiogram: cover art + show / episode title + an animated waveform that fills as the clip plays
 * + elapsed / total time + word-by-word caption lines. Waveform shape is a deterministic seeded envelope;
 * with `audioSrc` the bars near the playhead bounce to the real track (same @remotion/media-utils path as
 * audio-spectrum), otherwise to a synthetic beat.
 */
type Props = {
  show: string;
  episode: string;
  title: string;
  speaker: string;
  captions: string[];
  coverSrc: string;
  audioSrc: string;
  playAudio: boolean;
  bars: number;
  seed: number;
  startSec: number;
  totalSec: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const PodcastAudiogram: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const stacked = w / h < 1.3;
  const clear = P.background === 'transparent';
  const heading = P.fontFamily || fonts.grotesk;
  const body = P.fontFamily || fonts.sans;
  const N = Math.max(16, Math.min(160, Math.round(P.bars)));
  const wave = React.useMemo(() => seededWave(N, P.seed), [N, P.seed]);
  const au = useAudioReactive(P.audioSrc, frame, fps, {bins: 32, smoothing: 0.7, peakHold: 4, bpm: 96, seed: P.seed});

  const pStart = 22;
  const pEnd = Math.max(pStart + 10, durationInFrames - 24);
  const p = prog(frame, pStart, pEnd, ease.linear);
  const clipSec = (pEnd - pStart) / fps;
  const nowSec = P.startSec + p * clipSec;

  // ---- layout ---------------------------------------------------------------------------------------------
  const padX = stacked ? w * 0.08 : w * 0.075;
  let coverS: number;
  let coverX: number;
  let coverY: number;
  let colX: number;
  let colW: number;
  let align: 'start' | 'middle' = 'start';
  const titleFs = (stacked ? (portrait ? 64 : 50) : 76) * u;
  const capFs = (stacked ? (portrait ? 42 : 32) : 38) * u;
  const waveH = (stacked ? (portrait ? 190 : 120) : 190) * u;
  if (stacked) {
    coverS = portrait ? w * 0.66 : h * 0.3;
    coverX = (w - coverS) / 2;
    coverY = 0; // set after the block height is known
    colX = padX;
    colW = w - padX * 2;
    align = 'middle';
  } else {
    coverS = h * 0.52;
    coverX = padX;
    coverY = (h - coverS) / 2;
    colX = coverX + coverS + w * 0.05;
    colW = w - padX - colX;
  }
  const titleLines = wrapText(P.title, Math.max(8, Math.floor(colW / (titleFs * 0.56))), 3);
  const titleLH = titleFs * 1.12;
  const labelH = 34 * u;
  const gap1 = 26 * u;
  const gap2 = (stacked ? 34 : 40) * u;
  const timesH = 44 * u;
  const capLH = capFs * 1.3;
  const capBlockH = capLH * 2;
  const blockH = labelH + gap1 + titleLines.length * titleLH + gap2 + waveH + timesH + 18 * u + capBlockH;
  const gapC = (portrait ? 70 : 38) * u;
  if (stacked) coverY = (h - (coverS + gapC + blockH)) / 2;
  const y0 = stacked ? coverY + coverS + gapC : (h - blockH) / 2;
  const tx = align === 'middle' ? colX + colW / 2 : colX;

  const labelY = y0 + labelH * 0.7;
  const titleY0 = y0 + labelH + gap1 + titleFs * 0.85;
  const waveTop = y0 + labelH + gap1 + titleLines.length * titleLH + gap2;
  const waveMid = waveTop + waveH / 2;
  const timesY = waveTop + waveH + 34 * u;
  const capY0 = timesY + 18 * u + capFs * 1.05;

  const textIn = (d: number) => prog(frame, d, d + 22, ease.out);
  const coverIn = prog(frame, 0, 24, ease.out);
  const pulse = 1 + au.bass * 0.022;

  // ---- waveform ---------------------------------------------------------------------------------------------
  const slot = colW / N;
  const bw = slot * 0.58;
  const waveNodes: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const frac = (i + 0.5) / N;
    const on = frac <= p;
    const near = Math.exp(-((((frac - p) * N) / 5) ** 2));
    const live = au.bands[Math.min(au.bands.length - 1, Math.floor((i / N) * au.bands.length))];
    const appear = prog(frame, 6 + (i / N) * 16, 22 + (i / N) * 16, ease.out);
    const amp = wave[i] * (1 + near * (0.15 + live * 0.5));
    const hh = Math.max(3 * u, amp * waveH * 0.5 * appear);
    const x = colX + i * slot + (slot - bw) / 2;
    const col = on ? mix(P.accent, P.accent2, frac) : rgbaStr(P.ink, 0.26);
    waveNodes.push(<rect key={i} x={x} y={waveMid - hh} width={bw} height={hh * 2} rx={bw / 2} fill={col} />);
  }
  const phx = colX + colW * p;
  const playhead = (
    <g opacity={prog(frame, 16, 30)}>
      <rect x={phx - 1.5 * u} y={waveTop - 8 * u} width={3 * u} height={waveH + 16 * u} rx={1.5 * u} fill={P.ink} opacity={0.9} />
      <circle cx={phx} cy={waveTop - 10 * u} r={7 * u} fill={P.accent} stroke={P.ink} strokeWidth={2 * u} />
    </g>
  );

  // ---- captions -----------------------------------------------------------------------------------------------
  const caps = P.captions.filter(Boolean);
  const cStart = 30;
  const cEnd = Math.max(cStart + 12, durationInFrames - 14);
  const per = (cEnd - cStart) / Math.max(1, caps.length);
  const ci = clamp(Math.floor((frame - cStart) / per), 0, Math.max(0, caps.length - 1));
  const cLocal = frame - cStart - ci * per;
  const capNodes: React.ReactNode[] = [];
  if (caps.length && frame >= cStart - 6) {
    const words = caps[ci].split(/\s+/).filter(Boolean);
    const lines = wrapText(caps[ci], Math.max(10, Math.floor(colW / (capFs * 0.5))), 2);
    const fadeIn = prog(cLocal, 0, 8);
    const fadeOut = ci < caps.length - 1 ? 1 - prog(cLocal, per - 7, per) : 1;
    let wi = 0;
    lines.forEach((ln, li) => {
      const lw = ln.split(' ');
      const spans = lw.map((wd, k) => {
        const idx = wi + k;
        const t0 = 2 + (idx / words.length) * (per * 0.78);
        const lit = prog(cLocal, t0, t0 + 5, ease.out);
        return (
          <tspan key={k} fill={P.ink} fillOpacity={0.35 + 0.65 * lit} dx={k ? capFs * 0.26 : 0}>
            {wd}
          </tspan>
        );
      });
      wi += lw.length;
      capNodes.push(
        <text key={li} x={tx} y={capY0 + li * capLH} textAnchor={align} fontFamily={body} fontWeight={600} fontSize={capFs} opacity={fadeIn * fadeOut}>
          {spans}
        </text>,
      );
    });
  }

  const lightBg = !clear && rgb3(P.background).reduce((a, b) => a + b, 0) > 384;
  const bg = clear
    ? undefined
    : `radial-gradient(ellipse at ${stacked ? '50% 20%' : '25% 50%'}, ${mix(P.background, P.accent2, 0.22)} 0%, ${P.background} 62%, ${mix(P.background, lightBg ? P.accent2 : '#000000', lightBg ? 0.1 : 0.35)} 100%)`;
  const label = `${P.show.toUpperCase()}${P.episode ? '  ·  ' + P.episode.toUpperCase() : ''}`;

  return (
    <AbsoluteFill style={{background: bg}}>
      {P.audioSrc && P.playAudio && <Audio src={resolveSrc(P.audioSrc)} />}
      <ArtBox
        uid="pa"
        x={coverX}
        y={coverY + (1 - coverIn) * 30 * u}
        size={coverS}
        src={P.coverSrc}
        accent={P.accent}
        accent2={P.accent2}
        seed={P.seed}
        radius={coverS * 0.06}
        scale={(0.94 + 0.06 * coverIn) * pulse}
        opacity={coverIn}
        shadow={`0 ${28 * u}px ${70 * u}px ${rgbaStr('#000000', 0.5)}, 0 0 ${90 * u}px ${rgbaStr(P.accent, 0.22 + au.bass * 0.15)}`}
      />
      <Svg>
        <g opacity={textIn(6)} transform={`translate(0 ${(1 - textIn(6)) * 14 * u})`}>
          {align === 'start' && <circle cx={colX + 7 * u} cy={labelY - 9 * u} r={6 * u} fill={P.accent} />}
          <text x={align === 'middle' ? tx : colX + 24 * u} y={labelY} textAnchor={align} fontFamily={fonts.mono} fontWeight={700} fontSize={25 * u} letterSpacing={3.5 * u} fill={P.accent}>
            {label}
          </text>
        </g>
        {titleLines.map((ln, i) => (
          <text
            key={i}
            x={tx}
            y={titleY0 + i * titleLH + (1 - textIn(10 + i * 4)) * 18 * u}
            textAnchor={align}
            fontFamily={heading}
            fontWeight={700}
            fontSize={titleFs}
            fill={P.ink}
            opacity={textIn(10 + i * 4)}
          >
            {ln}
          </text>
        ))}
        {waveNodes}
        <line x1={colX} x2={colX + colW} y1={waveMid} y2={waveMid} stroke={rgbaStr(P.ink, 0.1)} strokeWidth={1.5 * u} />
        {playhead}
        <g opacity={textIn(18)} fontFamily={fonts.mono} fontSize={24 * u} fill={rgbaStr(P.ink, 0.7)}>
          <text x={colX} y={timesY}>
            {fmtTime(nowSec)}
          </text>
          {P.speaker && (
            <text x={colX + colW / 2} y={timesY} textAnchor="middle" fill={rgbaStr(P.ink, 0.5)} fontSize={22 * u} letterSpacing={2 * u}>
              {P.speaker.toUpperCase()}
            </text>
          )}
          <text x={colX + colW} y={timesY} textAnchor="end">
            {fmtTime(P.totalSec)}
          </text>
        </g>
        {capNodes}
      </Svg>
    </AbsoluteFill>
  );
};

export const podcastAudiogram = defineMotion<Props>({
  id: 'podcast-audiogram',
  title: 'Podcast audiogram (cover + waveform + captions)',
  category: 'music',
  description:
    'Social audiogram clip: cover art that breathes with the beat, show / episode label, title, a seeded waveform whose bars fill with a gradient as a playhead sweeps (bars near the playhead bounce), elapsed / total time and word-by-word caption lines. Landscape = cover left / text right; square and portrait stack cover over text.',
  source: ['original (podcast-audiogram pattern)'],
  useFor: 'Podcast episode teasers, quote clips for Reels / Shorts / LinkedIn, voice-note and radio promos, spoken-word and interview highlights. Pass audioSrc for real audio-reactive bounce.',
  durationInFrames: 240,
  defaultProps: {
    show: 'The Sample Show',
    episode: 'Ep 42',
    title: 'How small teams ship great work',
    speaker: 'Guest name',
    captions: ['The best teams I have seen keep the loop tiny.', 'Ship something small, listen, then change one thing.', 'That is the whole secret, honestly.'],
    coverSrc: '',
    audioSrc: '',
    playAudio: false,
    bars: 56,
    seed: 5,
    startSec: 754,
    totalSec: 2310,
    background: '#0E1020',
    ink: '#F4F5FB',
    accent: '#FF7A59',
    accent2: '#7B61FF',
    fontFamily: '',
  },
  propDocs: {
    show: 'podcast / show name (small label)',
    episode: 'episode tag shown next to the show name, empty to hide',
    title: 'episode title (wraps to 3 lines)',
    speaker: 'speaker / guest name centred under the waveform, empty to hide',
    captions: 'caption lines shown one after another, words light up as they are spoken',
    coverSrc: 'cover art image (public/ path or URL); empty = procedural gradient cover',
    audioSrc: 'soundtrack path/URL used only to make the waveform bounce; empty = synthetic beat',
    playAudio: 'also play audioSrc in this layer (leave false if the composition already plays it)',
    bars: 'number of waveform bars (16-160)',
    seed: 'waveform + procedural cover seed',
    startSec: 'clip start position in the episode (seconds), drives the elapsed time',
    totalSec: 'episode length in seconds, shown at the right of the waveform',
    background: "background colour, or 'transparent' to overlay on video",
    ink: 'text / playhead colour',
    accent: 'played-waveform start colour and label colour',
    accent2: 'played-waveform end colour and cover gradient',
    fontFamily: 'optional CSS font-family for all text (default: Space Grotesk + Inter)',
  },
  component: PodcastAudiogram,
  tags: ['podcast', 'audiogram', 'waveform', 'audio', 'cover art', 'episode', 'captions', 'progress', 'music', 'voice', 'radio', 'quote', 'teaser', 'social', 'overlay'],
});
