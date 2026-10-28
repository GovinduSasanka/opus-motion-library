// Adapted from pdoom-video/app/src/engine/lyrics.ts (wordProgress/lineCharProgress, lyrics.json schema) (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  BeatsProp,
  LLine,
  LyricLineIn,
  MUSIC_PROP_DOCS,
  PLACEHOLDER_LINES,
  TREATISE,
  TreatiseFinish,
  clamp01,
  lastLine,
  lyricsFromText,
  normalizeLyrics,
  plexMono,
  timecode,
  useGrid,
  vf,
  wordAt,
  wordProgress,
} from '../../core/r2-music-kit';

type Props = {
  lines: string[];
  lyrics: LyricLineIn[];
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  window: number;
  background: string;
  ink: string;
  accent: string;
  showLine: boolean;
};

const LyricTiming: React.FC<Props> = ({lines, lyrics, bpm, offsetSec, beats, window: win, background, ink, accent, showLine}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const L: LLine[] = React.useMemo(() => {
    if (lyrics.length) return normalizeLyrics(lyrics);
    // plain lines: time them on the grid and split held words into two syllables to show syllable timing
    const timed = lyricsFromText(lines.length ? lines : PLACEHOLDER_LINES, g, {beatsPerLine: 8});
    return normalizeLyrics(
      timed.map((l) => ({
        ...l,
        words: l.words?.map((wd) => {
          const d = wd.end - wd.start;
          if (d < 0.5 || (wd.text ?? '').length < 4) return wd;
          const m = wd.start + d * 0.4;
          return {...wd, syl: [[wd.start, m - 0.01], [m, wd.end]] as [number, number][]};
        }),
      })),
    );
  }, [JSON.stringify(lyrics), JSON.stringify(lines), g]);
  const t = frame / fps;
  const clear = background === 'transparent';
  const P = portrait ? 1.9 : 1;
  const mono = 14 * u * P;
  const x0 = w * 0.05;
  const x1 = w * 0.95;
  const play = x0 + (x1 - x0) * 0.38;
  const pps = (x1 - x0) / win;
  const X = (tt: number) => play + (tt - t) * pps;
  const laneY = h * (portrait ? 0.56 : 0.58);
  const laneH = 64 * u * P;
  const intro = clamp01(frame / 12);
  const cur = wordAt(L, t);
  const ln = lastLine(L, t + 0.4);
  const all = L.flatMap((l) => l.words);
  // beat ticks
  const ticks: number[] = [];
  for (let i = Math.ceil(g.beatAt(t - win)); ; i++) {
    const tt = g.timeOfBeat(i);
    if (tt > t + win || ticks.length > 200) break;
    ticks.push(i);
  }
  const lineFs = Math.min(64 * u * P, (w * 0.9) / Math.max(10, (ln?.text.length ?? 20) * 0.62));
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      <Svg>
        <defs>
          <clipPath id="lytlane">
            <rect x={x0} y={0} width={x1 - x0} height={h} />
          </clipPath>
        </defs>
        <g opacity={intro}>
          {/* header */}
          <text x={x0} y={h * 0.09} fontFamily={plexMono} fontSize={mono} fill={ink} opacity={0.55} letterSpacing={2}>
            {`LYRICS.JSON · ${L.length} LINES · ${all.length} WORDS · ${Math.round(g.bpm)} BPM`}
          </text>
          <text x={x1} y={h * 0.09} textAnchor="end" fontFamily={plexMono} fontSize={mono} fill={accent} letterSpacing={2}>
            {timecode(t, fps)}
          </text>
          {/* current line karaoke (char-accurate) */}
          {showLine && ln ? (
            <text x={x0} y={h * (portrait ? 0.3 : 0.3)} style={vf(92, 800)} fontSize={lineFs} letterSpacing={-lineFs * 0.01}>
              {ln.words.map((wd, i) => {
                const p = wordProgress(wd, t);
                const isCur = t >= wd.start && t < wd.end;
                return (
                  <tspan key={i} fill={isCur ? accent : ink} fillOpacity={p >= 1 || isCur ? 1 : 0.28}>
                    {wd.text + (i < ln.words.length - 1 ? ' ' : '')}
                  </tspan>
                );
              })}
            </text>
          ) : null}
          {/* lane frame */}
          <rect x={x0} y={laneY - laneH * 0.9} width={x1 - x0} height={laneH * 2.5} fill={TREATISE.panel} opacity={clear ? 0.8 : 0.6} />
          <g clipPath="url(#lytlane)">
            {/* beat grid */}
            {ticks.map((bi) => {
              const x = X(g.timeOfBeat(bi));
              const down = ((bi % g.beatsPerBar) + g.beatsPerBar) % g.beatsPerBar === 0;
              return <line key={bi} x1={x} x2={x} y1={laneY - laneH * 0.9} y2={laneY + laneH * 1.6} stroke={ink} strokeOpacity={down ? 0.22 : 0.08} strokeWidth={Math.max(1, (down ? 1.6 : 1) * u)} />;
            })}
            {/* line brackets */}
            {L.map((l) => {
              const a = X(l.start);
              const z = X(l.end);
              if (z < x0 || a > x1) return null;
              return (
                <g key={'l' + l.i}>
                  <path d={`M${a} ${laneY - laneH * 0.45} l0 ${-10 * u} L${z} ${laneY - laneH * 0.45 - 10 * u} l0 ${10 * u}`} fill="none" stroke={ink} strokeOpacity={0.4} strokeWidth={Math.max(1, u)} />
                  <text x={a + 6 * u} y={laneY - laneH * 0.45 - 16 * u} fontFamily={plexMono} fontSize={mono * 0.85} fill={ink} opacity={0.5}>
                    {`L${l.i + 1}  ${l.start.toFixed(2)}–${l.end.toFixed(2)}`}
                  </text>
                </g>
              );
            })}
            {/* word blocks */}
            {all.map((wd) => {
              const a = X(wd.start);
              const z = X(wd.end);
              if (z < x0 || a > x1) return null;
              const p = wordProgress(wd, t);
              const isCur = cur === wd;
              const bw = Math.max(2, z - a - 2 * u);
              const fsz = Math.min(mono * 1.05, (bw / Math.max(2, wd.text.length)) * 1.6);
              return (
                <g key={wd.gi}>
                  <rect x={a} y={laneY - laneH * 0.35} width={bw} height={laneH} fill="none" stroke={isCur ? accent : ink} strokeOpacity={isCur ? 1 : 0.45} strokeWidth={Math.max(1, (isCur ? 2 : 1) * u)} strokeDasharray={wd.estimated ? `${4 * u} ${3 * u}` : undefined} />
                  <rect x={a} y={laneY - laneH * 0.35} width={bw * p} height={laneH} fill={isCur ? accent : ink} opacity={isCur ? 0.85 : 0.18} />
                  {wd.syl && wd.syl.length > 1
                    ? wd.syl.slice(1).map(([s0], k) => <line key={k} x1={X(s0)} x2={X(s0)} y1={laneY - laneH * 0.35} y2={laneY + laneH * 0.65} stroke={isCur ? TREATISE.ink : accent} strokeWidth={Math.max(1, 1.5 * u)} strokeDasharray={`${3 * u} ${2 * u}`} />)
                    : null}
                  <text x={a + 5 * u} y={laneY + laneH * 0.2} fontFamily={plexMono} fontWeight={700} fontSize={fsz} fill={isCur ? TREATISE.ink : ink}>
                    {wd.text.replace(/[^\w’'-]/g, '').toUpperCase()}
                  </text>
                  {/* confidence bar */}
                  <rect x={a} y={laneY + laneH * 0.75} width={bw * wd.conf} height={4 * u} fill={wd.conf > 0.8 ? TREATISE.mid : accent} opacity={0.6} />
                </g>
              );
            })}
          </g>
          {/* playhead */}
          <line x1={play} x2={play} y1={laneY - laneH * 1.1} y2={laneY + laneH * 1.7} stroke={accent} strokeWidth={Math.max(1.5, 2 * u)} />
          <path d={`M${play - 7 * u} ${laneY - laneH * 1.1} l${14 * u} 0 l${-7 * u} ${10 * u} Z`} fill={accent} />
          {/* readout */}
          <text x={x0} y={laneY + laneH * 2.4} fontFamily={plexMono} fontSize={mono} fill={ink} opacity={0.75} letterSpacing={1}>
            {cur
              ? `WORD “${cur.text}”  ${cur.start.toFixed(2)}→${cur.end.toFixed(2)}s  sung ${(wordProgress(cur, t) * 100).toFixed(0).padStart(3, ' ')}%${cur.syl ? `  syl ${cur.syl.length}` : ''}  conf ${cur.conf.toFixed(2)}`
              : 'WORD —  (gap: next line previews 0.4 s early, never highlighted ahead of the voice)'}
          </text>
        </g>
      </Svg>
      {!clear ? <TreatiseFinish grain={0.05} /> : null}
    </AbsoluteFill>
  );
};

export const lyricTiming = defineMotion<Props>({
  id: 'lyric-timing',
  title: 'Lyric timing lane (word + syllable sync)',
  category: 'music',
  description:
    'A DAW-style lyric lane: every word is a block sized to its sung duration scrolling past a playhead on a beat grid, filling as it is sung (split at syllables, dashed when estimated), with line brackets, confidence bars, a word readout and the current line lighting word by word above.',
  source: ['pdoom-video app/src/engine/lyrics.ts wordProgress/lineCharProgress + data/lyrics.json schema (MIT; no lyric content used)'],
  useFor: 'Show / check word timing for karaoke and captions, “how the lyric video is synced” explainers, music-tech UI; doubles as a QA view for your lyrics.json.',
  durationInFrames: 300,
  defaultProps: {
    lines: PLACEHOLDER_LINES,
    lyrics: [],
    bpm: 120,
    offsetSec: 0.5,
    beats: {},
    window: 5,
    background: TREATISE.ink,
    ink: TREATISE.bone,
    accent: TREATISE.signal,
    showLine: true,
  },
  propDocs: {
    ...MUSIC_PROP_DOCS,
    window: 'seconds visible across the lane',
    background: "frame colour or 'transparent'",
    ink: 'type / block colour',
    accent: 'current word + playhead colour',
    showLine: 'show the current line above the lane, lighting word by word',
  },
  component: LyricTiming,
  tags: ['lyrics', 'karaoke', 'word timing', 'syllables', 'alignment', 'timeline', 'daw', 'music', 'captions', 'sync', 'subtitles', 'whisper', 'qa', 'treatise'],
});
