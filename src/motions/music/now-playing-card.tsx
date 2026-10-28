import React from 'react';
import {AbsoluteFill, Audio, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ease, prog, springAt} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, rgbaStr, useAudioReactive} from '../../core/r2-pr3-kit';
import {ArtBox, TransportIcon, fmtTime, wrapText} from '../../core/music-kit';

/**
 * Now-playing card: album art, track / artist / album, a scrubber with elapsed + remaining time, shuffle / prev /
 * play-pause / next / repeat controls and a like heart. The play button is pressed at `pressAt` (play icon becomes
 * pause and the scrubber starts moving) and the heart pops at `likeAt`. Landscape / square = horizontal card,
 * portrait = vertical card. Optional `audioSrc` makes the art breathe to the real track.
 */
type Props = {
  track: string;
  artist: string;
  album: string;
  label: string;
  coverSrc: string;
  audioSrc: string;
  playAudio: boolean;
  startSec: number;
  totalSec: number;
  scrubSpeed: number;
  startPaused: boolean;
  pressAt: number;
  likeAt: number;
  background: string;
  cardColor: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
  seed: number;
};

const NowPlayingCard: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const clear = P.background === 'transparent';
  const heading = P.fontFamily || fonts.grotesk;
  const body = P.fontFamily || fonts.sans;
  const au = useAudioReactive(P.audioSrc, frame, fps, {bins: 16, smoothing: 0.75, peakHold: 4, bpm: 104, seed: P.seed});

  // ---- play state --------------------------------------------------------------------------------------------
  const pressAt = P.startPaused ? P.pressAt : 0;
  const playing = frame >= pressAt;
  const playFrames = Math.max(0, frame - pressAt);
  const nowSec = Math.min(P.totalSec, P.startSec + (playFrames / fps) * P.scrubSpeed);
  const frac = P.totalSec > 0 ? nowSec / P.totalSec : 0;
  const press = P.startPaused ? (frame >= pressAt - 4 && frame < pressAt + 8 ? 1 - Math.sin(Math.PI * prog(frame, pressAt - 4, pressAt + 8, ease.linear)) * 0.14 : 1) : 1;
  const like = P.likeAt >= 0 ? springAt(frame, fps, P.likeAt, 'pop') : 0;
  const likeOn = P.likeAt >= 0 && frame >= P.likeAt;

  // ---- geometry -----------------------------------------------------------------------------------------------
  const wide = !portrait;
  let W: number;
  let H: number;
  let s: number;
  if (wide) {
    W = Math.min(w * 0.9, 1500 * u);
    H = W * 0.4;
    s = W / 1380;
  } else {
    W = w * 0.88;
    s = W / 950;
    H = 0; // computed below
  }
  const pad = wide ? H * 0.085 : W * 0.045;
  const artS = wide ? H - pad * 2 : W - pad * 2;
  if (!wide) H = pad + artS + 545 * s + pad * 0.5;
  const cardX = (w - W) / 2;
  const cardY = (h - H) / 2;
  const tx = wide ? cardX + pad + artS + pad * 1.3 : cardX + pad;
  const tW = wide ? cardX + W - pad * 1.3 - tx : W - pad * 2;
  const ty = wide ? cardY : cardY + pad + artS;
  // y positions inside the text block
  const Y = wide
    ? {label: ty + H * 0.15, title: ty + H * 0.335, artist: ty + H * 0.455, album: ty + H * 0.535, bar: ty + H * 0.655, times: ty + H * 0.745, ctl: ty + H * 0.85}
    : {label: ty + 58 * s, title: ty + 135 * s, artist: ty + 190 * s, album: ty + 235 * s, bar: ty + 295 * s, times: ty + 345 * s, ctl: ty + 430 * s};
  const titleFs = (wide ? 62 : 58) * s;
  const entry = springAt(frame, fps, 0, 'soft');
  const cardOp = prog(frame, 0, 14, ease.out);
  const rise = (1 - entry) * 70 * u;
  const tIn = (d: number) => prog(frame, d, d + 20, ease.out);

  const titleLines = wrapText(P.track, Math.max(6, Math.floor(tW / (titleFs * 0.54))), wide ? 1 : 2);
  const titleYshift = !wide && titleLines.length > 1 ? 0 : 0;

  // equalizer glyph
  const eqBars = [0, 1, 2, 3].map((i) => {
    const live = playing ? 0.35 + 0.65 * Math.abs(Math.sin(frame * (0.21 + i * 0.07) + i * 1.7 + au.level * 3)) : 0.18;
    return live;
  });

  // ---- controls ------------------------------------------------------------------------------------------------
  const ctlNames: ('shuffle' | 'prev' | 'next' | 'repeat')[] = ['shuffle', 'prev', 'next', 'repeat'];
  const ctlX = (k: number) => tx + (tW * (k + 0.5)) / 5;
  const bigR = (wide ? 46 : 52) * s;
  const iconS = (wide ? 34 : 38) * s;
  const barX0 = tx;
  const barX1 = tx + tW;
  const barH = 8 * s;
  const knobR = (playing ? 12 : 9) * s;

  const bg = clear
    ? undefined
    : `radial-gradient(ellipse at 28% 30%, ${mix(P.background, P.accent2, 0.3)} 0%, ${P.background} 60%), ${P.background}`;
  const glow = clear ? null : (
    <div
      style={{
        position: 'absolute',
        left: cardX - W * 0.08,
        top: cardY - H * 0.1,
        width: W * 1.16,
        height: H * 1.2,
        background: `radial-gradient(ellipse at 30% 40%, ${rgbaStr(P.accent, 0.22 + au.bass * 0.08)}, transparent 62%)`,
        filter: `blur(${30 * u}px)`,
        opacity: cardOp,
      }}
    />
  );

  return (
    <AbsoluteFill style={{background: bg}}>
      {P.audioSrc && P.playAudio && <Audio src={resolveSrc(P.audioSrc)} />}
      {glow}
      <div
        style={{
          position: 'absolute',
          left: cardX,
          top: cardY + rise,
          width: W,
          height: H,
          borderRadius: 40 * s,
          background: P.cardColor,
          border: `${1.5 * u}px solid ${rgbaStr(P.ink, 0.1)}`,
          boxShadow: `0 ${30 * u}px ${80 * u}px ${rgbaStr('#000000', 0.45)}`,
          opacity: cardOp,
        }}
      />
      <ArtBox
        uid="np"
        x={cardX + pad}
        y={cardY + pad + rise}
        size={artS}
        src={P.coverSrc}
        accent={P.accent}
        accent2={P.accent2}
        seed={P.seed}
        radius={26 * s}
        scale={(0.9 + 0.1 * prog(frame, 4, 26, ease.back)) * (1 + (playing ? au.bass * 0.025 : 0))}
        opacity={prog(frame, 2, 18)}
        shadow={`0 ${18 * u}px ${44 * u}px ${rgbaStr('#000000', 0.4)}`}
      />
      <Svg style={{transform: `translateY(${rise}px)`, opacity: cardOp}}>
        {/* label + equalizer glyph */}
        <g opacity={tIn(10)}>
          <text x={tx} y={Y.label} fontFamily={fonts.mono} fontWeight={700} fontSize={22 * s} letterSpacing={4 * s} fill={P.accent}>
            {P.label.toUpperCase()}
          </text>
          {eqBars.map((v, i) => (
            <rect key={i} x={tx + tW - (4 - i) * 11 * s} y={Y.label - v * 24 * s} width={7 * s} height={v * 24 * s} rx={2 * s} fill={P.accent} />
          ))}
        </g>
        {titleLines.map((ln, i) => (
          <text key={i} x={tx} y={Y.title + titleYshift + i * titleFs * 1.1} fontFamily={heading} fontWeight={700} fontSize={titleFs} fill={P.ink} opacity={tIn(14)}>
            {ln}
          </text>
        ))}
        {(() => {
          const dy = (titleLines.length - 1) * titleFs * 1.1;
          return (
            <>
              <text x={tx} y={Y.artist + dy} fontFamily={body} fontWeight={600} fontSize={(wide ? 34 : 36) * s} fill={rgbaStr(P.ink, 0.82)} opacity={tIn(18)}>
                {P.artist}
              </text>
              <text x={tx} y={Y.album + dy} fontFamily={body} fontSize={(wide ? 26 : 28) * s} fill={rgbaStr(P.ink, 0.5)} opacity={tIn(22)}>
                {P.album}
              </text>
              {/* scrubber */}
              <g opacity={tIn(24)} transform={`translate(0 ${dy})`}>
                <rect x={barX0} y={Y.bar - barH / 2} width={barX1 - barX0} height={barH} rx={barH / 2} fill={rgbaStr(P.ink, 0.16)} />
                <rect x={barX0} y={Y.bar - barH / 2} width={Math.max(barH, (barX1 - barX0) * frac)} height={barH} rx={barH / 2} fill={mix(P.accent, P.accent2, 0.35)} />
                <circle cx={barX0 + (barX1 - barX0) * frac} cy={Y.bar} r={knobR} fill={P.ink} />
                <text x={barX0} y={Y.times} fontFamily={fonts.mono} fontSize={22 * s} fill={rgbaStr(P.ink, 0.6)}>
                  {fmtTime(nowSec)}
                </text>
                <text x={barX1} y={Y.times} textAnchor="end" fontFamily={fonts.mono} fontSize={22 * s} fill={rgbaStr(P.ink, 0.6)}>
                  {`-${fmtTime(P.totalSec - nowSec)}`}
                </text>
                {/* controls */}
                <g opacity={tIn(28)}>
                  <TransportIcon name="shuffle" cx={ctlX(0)} cy={Y.ctl} s={iconS * 0.82} color={rgbaStr(P.ink, 0.55)} />
                  <TransportIcon name="prev" cx={ctlX(1)} cy={Y.ctl} s={iconS} color={P.ink} />
                  <circle cx={ctlX(2)} cy={Y.ctl} r={bigR * press} fill={P.accent} />
                  <TransportIcon name={playing ? 'pause' : 'play'} cx={ctlX(2) + (playing ? 0 : 2 * s)} cy={Y.ctl} s={iconS * 1.12 * press} color={P.cardColor} />
                  <TransportIcon name="next" cx={ctlX(3)} cy={Y.ctl} s={iconS} color={P.ink} />
                  <TransportIcon name="repeat" cx={ctlX(4)} cy={Y.ctl} s={iconS * 0.82} color={rgbaStr(P.ink, 0.55)} />
                </g>
                {/* like heart (top-right of the text block) */}
                <g transform={`translate(0 ${-dy})`}>
                  <TransportIcon
                    name="heart"
                    cx={tx + tW - 22 * s}
                    cy={Y.title - titleFs * 0.35}
                    s={(wide ? 38 : 42) * s * (likeOn ? 0.82 + 0.3 * like : 1)}
                    color={likeOn ? P.accent : rgbaStr(P.ink, 0.5)}
                    fill={likeOn}
                  />
                </g>
              </g>
            </>
          );
        })()}
      </Svg>
    </AbsoluteFill>
  );
};

export const nowPlayingCard = defineMotion<Props>({
  id: 'now-playing-card',
  title: 'Now playing card (album art + scrubber + controls)',
  category: 'music',
  description:
    'Streaming-app style now-playing card: album art, track / artist / album, a gradient scrubber with elapsed and remaining time, shuffle / previous / play-pause / next / repeat controls and a like heart. The play button is pressed (play becomes pause, scrubber starts) and the heart pops, with an equalizer glyph in the corner. Horizontal card on landscape and square, vertical card on portrait.',
  source: ['original (now-playing widget pattern)'],
  useFor: 'Music release and playlist promos, "now playing" overlays for streams and radio, app-store screenshots for audio apps, podcast and audiobook UI beats. Swap track, artist and cover art; pass audioSrc to make the art breathe.',
  durationInFrames: 180,
  defaultProps: {
    track: 'Golden Hour Drive',
    artist: 'Sample Artist',
    album: 'Night Signals - Single',
    label: 'Now playing',
    coverSrc: '',
    audioSrc: '',
    playAudio: false,
    startSec: 42,
    totalSec: 214,
    scrubSpeed: 4,
    startPaused: true,
    pressAt: 36,
    likeAt: 100,
    background: '#0B0D18',
    cardColor: '#181B2C',
    ink: '#F4F5FB',
    accent: '#3DDC97',
    accent2: '#5B8CFF',
    fontFamily: '',
    seed: 11,
  },
  propDocs: {
    track: 'track title (wraps to 2 lines on portrait, ellipsised on 1 line otherwise)',
    artist: 'artist name',
    album: 'album / playlist / episode line',
    label: 'small caps label above the title',
    coverSrc: 'album art (public/ path or URL); empty = procedural gradient cover',
    audioSrc: 'optional track path/URL: art breathes to its bass; empty = synthetic beat',
    playAudio: 'also play audioSrc in this layer (leave false if the composition already plays it)',
    startSec: 'playback position at the start (seconds)',
    totalSec: 'track length in seconds',
    scrubSpeed: 'how many times faster than real time the scrubber advances (so it visibly moves in a short clip)',
    startPaused: 'true = starts paused and the play button is pressed at pressAt; false = already playing',
    pressAt: 'frame the play button is pressed (when startPaused)',
    likeAt: 'frame the like heart pops; -1 = never',
    background: "page background, or 'transparent' to overlay on video",
    cardColor: 'card fill colour',
    ink: 'text colour',
    accent: 'play button, label, heart and scrubber start colour',
    accent2: 'scrubber end colour and cover gradient',
    fontFamily: 'optional CSS font-family for all text (default: Space Grotesk + Inter)',
    seed: 'procedural cover seed',
  },
  component: NowPlayingCard,
  tags: ['now playing', 'music', 'player', 'card', 'album', 'scrubber', 'controls', 'spotify', 'streaming', 'playlist', 'track', 'ui', 'audio', 'overlay', 'play button', 'song'],
});
