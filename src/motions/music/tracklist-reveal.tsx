import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mix, rgbaStr} from '../../core/r2-pr3-kit';
import {ArtBox, fmtTime, parseTime, wrapText} from '../../core/music-kit';

/**
 * Tracklist reveal: an album / EP / playlist header with cover art, then numbered rows (title, optional artist,
 * duration) that slide in one by one; afterwards a "now playing" highlight steps down the list with an animated
 * equalizer glyph. Total runtime is computed from the durations when `meta` is empty.
 */
type Track = {title: string; duration: string; artist?: string};
type Props = {
  title: string;
  artist: string;
  meta: string;
  tracks: Track[];
  coverSrc: string;
  numbered: boolean;
  highlight: boolean;
  holdPerTrack: number;
  stagger: number;
  startAt: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
  seed: number;
};

const TracklistReveal: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const stacked = w / h < 1.3;
  const clear = P.background === 'transparent';
  const heading = P.fontFamily || fonts.grotesk;
  const body = P.fontFamily || fonts.sans;
  const tracks = P.tracks.length ? P.tracks : [{title: 'Untitled', duration: '3:00'}];
  const n = tracks.length;
  const total = tracks.reduce((a, t) => a + parseTime(t.duration), 0);
  const meta = P.meta || `${n} track${n === 1 ? '' : 's'}  ·  ${fmtTime(total)}`;

  // ---- layout -------------------------------------------------------------------------------------------------
  let coverS: number;
  let coverX: number;
  let coverY: number;
  let hdrX: number;
  let hdrW: number;
  let hdrY: number;
  let listX: number;
  let listW: number;
  let listTop: number;
  let listBottom: number;
  if (!stacked) {
    coverS = Math.min(h * 0.46, w * 0.24);
    coverX = w * 0.07;
    coverY = h * 0.15;
    hdrX = coverX;
    hdrW = w * 0.34;
    hdrY = coverY + coverS + 54 * u;
    listX = w * 0.47;
    listW = w * 0.46;
    listTop = h * 0.12;
    listBottom = h * 0.88;
  } else {
    coverS = portrait ? w * 0.27 : h * 0.17;
    coverX = w * 0.07;
    coverY = portrait ? h * 0.06 : h * 0.06;
    hdrX = coverX + coverS + w * 0.04;
    hdrW = w - hdrX - w * 0.07;
    hdrY = coverY + coverS * 0.32;
    listX = w * 0.07;
    listW = w * 0.86;
    listTop = coverY + coverS + (portrait ? 56 : 32) * u;
    listBottom = h * (portrait ? 0.94 : 0.95);
  }
  const rowH = Math.min((portrait ? 104 : 100) * u, (listBottom - listTop) / n);
  const fs = Math.min(40 * u, rowH * 0.42);
  const titleFs = (stacked ? (portrait ? 54 : 44) : 70) * u;
  const hdrCh = Math.max(6, Math.floor(hdrW / (titleFs * 0.56)));
  const hdrLines = wrapText(P.title, hdrCh, stacked ? 2 : 3);
  const numW = P.numbered ? fs * 1.9 : 0;
  const durW = fs * 3;
  const startRows = P.startAt + 14;
  const revealEnd = startRows + (n - 1) * P.stagger + 24;
  const hlStart = revealEnd + 6;
  const hlIdx = P.highlight ? Math.min(n - 1, Math.max(-1, Math.floor((frame - hlStart) / Math.max(4, P.holdPerTrack)))) : -1;
  // highlight band moves smoothly between rows
  const bandRow = (() => {
    if (!P.highlight || frame < hlStart) return -1;
    const i = Math.floor((frame - hlStart) / Math.max(4, P.holdPerTrack));
    const f = ((frame - hlStart) % Math.max(4, P.holdPerTrack)) / Math.max(4, P.holdPerTrack);
    const cur = Math.min(n - 1, i);
    const prev = Math.max(0, cur - 1);
    const mv = cur === prev ? 1 : ease.inOut(clamp(f * 4));
    return prev + (cur - prev) * mv;
  })();

  const hIn = (d: number) => prog(frame, P.startAt + d, P.startAt + d + 22, ease.out);

  const rows: React.ReactNode[] = [];
  tracks.forEach((tr, i) => {
    const a = prog(frame, startRows + i * P.stagger, startRows + i * P.stagger + 20, ease.out);
    const y = listTop + i * rowH + rowH / 2;
    const active = hlIdx === i;
    const maxCh = Math.max(6, Math.floor((listW - numW - durW - 24 * u) / (fs * 0.53)));
    const label = tr.title;
    const shown = label.length > maxCh ? label.slice(0, maxCh - 1).trimEnd() + '…' : label;
    const eq = [0, 1, 2].map((k) => 0.3 + 0.7 * Math.abs(Math.sin(frame * (0.22 + k * 0.08) + k * 1.9)));
    rows.push(
      <g key={i} opacity={a} transform={`translate(${(1 - a) * 60 * u} 0)`}>
        <line x1={listX} x2={listX + listW} y1={listTop + (i + 1) * rowH} y2={listTop + (i + 1) * rowH} stroke={rgbaStr(P.ink, 0.09)} strokeWidth={1.5 * u} />
        {P.numbered && !active && (
          <text x={listX + numW * 0.5} y={y + fs * 0.35} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={fs * 0.8} fill={rgbaStr(P.ink, 0.4)}>
            {String(i + 1).padStart(2, '0')}
          </text>
        )}
        {active && (
          <g>
            {eq.map((v, k) => (
              <rect key={k} x={listX + numW * 0.5 - fs * 0.38 + k * fs * 0.27} y={y + fs * 0.32 - v * fs * 0.8} width={fs * 0.17} height={v * fs * 0.8} rx={fs * 0.05} fill={P.accent} />
            ))}
          </g>
        )}
        <text x={listX + numW} y={y + (tr.artist ? 0 : fs * 0.35)} fontFamily={body} fontWeight={active ? 800 : 600} fontSize={fs} fill={active ? P.accent : P.ink}>
          {shown}
        </text>
        {tr.artist && (
          <text x={listX + numW} y={y + fs * 0.74} fontFamily={body} fontSize={fs * 0.62} fill={rgbaStr(P.ink, 0.5)}>
            {tr.artist}
          </text>
        )}
        <text x={listX + listW} y={y + fs * 0.34} textAnchor="end" fontFamily={fonts.mono} fontSize={fs * 0.78} fill={active ? P.accent : rgbaStr(P.ink, 0.55)}>
          {tr.duration}
        </text>
      </g>,
    );
  });

  const band = bandRow >= 0 ? (
    <rect x={listX - 14 * u} y={listTop + bandRow * rowH + 3 * u} width={listW + 28 * u} height={rowH - 6 * u} rx={14 * u} fill={rgbaStr(P.accent, 0.13)} stroke={rgbaStr(P.accent, 0.35)} strokeWidth={1.5 * u} />
  ) : null;

  const bg = clear ? undefined : `radial-gradient(ellipse at ${stacked ? '30% 10%' : '20% 40%'}, ${mix(P.background, P.accent2, 0.22)} 0%, ${P.background} 62%)`;

  return (
    <AbsoluteFill style={{background: bg}}>
      <ArtBox
        uid="tl"
        x={coverX}
        y={coverY + (1 - hIn(0)) * 24 * u}
        size={coverS}
        src={P.coverSrc}
        accent={P.accent}
        accent2={P.accent2}
        seed={P.seed}
        radius={coverS * 0.05}
        opacity={hIn(0)}
        scale={0.95 + 0.05 * hIn(0)}
        shadow={`0 ${22 * u}px ${56 * u}px ${rgbaStr('#000000', 0.45)}`}
      />
      <Svg>
        <g opacity={hIn(6)}>
          <text x={hdrX} y={hdrY - (stacked ? 20 : 34) * u} fontFamily={fonts.mono} fontWeight={700} fontSize={(stacked ? 22 : 24) * u} letterSpacing={4 * u} fill={P.accent}>
            TRACKLIST
          </text>
        </g>
        {hdrLines.map((ln, i) => (
          <text key={i} x={hdrX} y={hdrY + titleFs * 0.8 + i * titleFs * 1.08 + (1 - hIn(8 + i * 3)) * 16 * u} fontFamily={heading} fontWeight={700} fontSize={titleFs} fill={P.ink} opacity={hIn(8 + i * 3)}>
            {ln}
          </text>
        ))}
        <text x={hdrX} y={hdrY + titleFs * 0.8 + hdrLines.length * titleFs * 1.08 + 12 * u} fontFamily={body} fontWeight={600} fontSize={(stacked ? 34 : 38) * u} fill={rgbaStr(P.ink, 0.85)} opacity={hIn(14)}>
          {P.artist}
        </text>
        <text x={hdrX} y={hdrY + titleFs * 0.8 + hdrLines.length * titleFs * 1.08 + 12 * u + (stacked ? 42 : 50) * u} fontFamily={fonts.mono} fontSize={(stacked ? 22 : 24) * u} letterSpacing={2 * u} fill={rgbaStr(P.ink, 0.5)} opacity={hIn(18)}>
          {meta.toUpperCase()}
        </text>
        {band}
        {rows}
      </Svg>
    </AbsoluteFill>
  );
};

export const tracklistReveal = defineMotion<Props>({
  id: 'tracklist-reveal',
  title: 'Tracklist reveal (numbered tracks + durations)',
  category: 'music',
  description:
    'Album / EP / playlist tracklist: a header with cover art, title, artist and "8 tracks · 31:42" (computed from the durations), then numbered rows slide in one by one with ruled lines and right-aligned times, and a "now playing" band with an animated equalizer glyph steps down the list. Two columns on landscape, header-over-list on square and portrait.',
  source: ['original (tracklist pattern)'],
  useFor: 'Album and EP announcements, playlist and mixtape reveals, setlists, podcast chapter lists, festival lineups (use the duration column for set times), "what is on the record" beats.',
  durationInFrames: 300,
  defaultProps: {
    title: 'Night Signals',
    artist: 'Sample Artist',
    meta: '',
    tracks: [
      {title: 'Golden Hour Drive', duration: '3:34'},
      {title: 'Static Bloom', duration: '4:02'},
      {title: 'Paper Skyline', duration: '2:58'},
      {title: 'Low Tide Radio', duration: '3:47'},
      {title: 'Afterimage', duration: '5:11'},
      {title: 'Neon Hush', duration: '3:20'},
      {title: 'Quiet Machines', duration: '4:36'},
      {title: 'Last Train Home', duration: '4:14'},
    ],
    coverSrc: '',
    numbered: true,
    highlight: true,
    holdPerTrack: 22,
    stagger: 7,
    startAt: 0,
    background: '#0E0F1A',
    ink: '#F4F5FB',
    accent: '#FFB13D',
    accent2: '#7B61FF',
    fontFamily: '',
    seed: 9,
  },
  propDocs: {
    title: 'album / playlist title (wraps)',
    artist: 'artist / curator line',
    meta: 'small caps line under the artist; empty = auto "N tracks · total time" from the durations',
    tracks: 'array of {title, duration "m:ss", artist?} - rows scale down to fit any count',
    coverSrc: 'cover art (public/ path or URL); empty = procedural gradient cover',
    numbered: 'show 01, 02, ... numbers',
    highlight: 'step a now-playing band down the list after the reveal',
    holdPerTrack: 'frames the band stays on each track',
    stagger: 'frames between rows sliding in',
    startAt: 'frame the reveal begins',
    background: "background colour, or 'transparent' to overlay on video",
    ink: 'text colour',
    accent: 'label, numbers highlight, now-playing band',
    accent2: 'cover gradient and background tint',
    fontFamily: 'optional CSS font-family for all text (default: Space Grotesk + Inter)',
    seed: 'procedural cover seed',
  },
  component: TracklistReveal,
  tags: ['tracklist', 'track list', 'album', 'playlist', 'songs', 'music', 'setlist', 'lineup', 'durations', 'numbered', 'list', 'chapters', 'release', 'ep', 'mixtape', 'now playing'],
});
