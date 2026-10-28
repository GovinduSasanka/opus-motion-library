// Adapted from pdoom-video/docs/TREATMENT.md "Karaoke rules" + app/src/engine/lyrics.ts (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  BeatsProp,
  E,
  LyricLineIn,
  MUSIC_PROP_DOCS,
  PLACEHOLDER_LINES,
  TREATISE,
  TreatiseFinish,
  beatState,
  clamp01,
  useGrid,
  plexMono,
  resolveLyrics,
  vf,
  wordProgress,
} from '../../core/r2-music-kit';

type Props = {
  lines: string[];
  lyrics: LyricLineIn[];
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  beatsPerLine: number;
  background: string;
  ink: string;
  accent: string;
  unsung: 'outline' | 'dim';
  align: 'left' | 'center';
  beatReact: number;
  showGrid: boolean;
  size: number;
};

const LyricVideo: React.FC<Props> = ({lines, lyrics, bpm, offsetSec, beats, beatsPerLine, background, ink, accent, unsung, align, beatReact, showGrid, size}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const L = React.useMemo(() => resolveLyrics(g, lyrics, lines, {beatsPerLine}), [g, JSON.stringify(lyrics), JSON.stringify(lines), beatsPerLine]);
  const t = frame / fps;
  const b = beatState(g, t);
  const clear = background === 'transparent';

  // active line: from 0.4 s before its first word (dim preview, never highlighted early) until it ends
  const ANT = 0.4;
  const idx = L.findIndex((l, i) => t >= (l.words[0]?.start ?? l.start) - ANT && t < (L[i + 1] ? Math.min(l.end + 0.25, (L[i + 1].words[0]?.start ?? L[i + 1].start) - ANT) : l.end + 0.6));
  const line = idx >= 0 ? L[idx] : null;

  const maxChars = Math.max(4, ...L.flatMap((l) => l.words.map((wd) => wd.text.length)));
  const boxW = w * (portrait ? 0.84 : 0.8);
  const fs = Math.min(size * u * (portrait ? 1.05 : 1), boxW / (maxChars * 0.66));
  const kick = b.kick * beatReact;
  const flash = g.hit('downbeat', t, 0.1) * 0.06 * beatReact;

  let content: React.ReactNode = null;
  if (line) {
    const first = line.words[0]?.start ?? line.start;
    const enter = E.outCubic(clamp01((t - (first - ANT)) / 0.3));
    const exit = E.inCubic(clamp01((t - (line.end + 0.05)) / 0.22));
    content = (
      <div
        style={{
          position: 'absolute',
          left: align === 'center' ? (w - boxW) / 2 : w * (portrait ? 0.08 : 0.09),
          width: boxW,
          top: h * (portrait ? 0.4 : 0.44),
          transform: `translateY(-50%) translateY(${(1 - enter) * 0.35 * fs - exit * 0.6 * fs}px) scale(${1 + 0.025 * kick})`,
          transformOrigin: align === 'center' ? '50% 50%' : '0% 50%',
          opacity: Math.min(enter, 1 - exit),
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          lineHeight: 0.98,
          fontSize: fs,
          letterSpacing: '-0.01em',
        }}
      >
        {line.words.map((wd, i) => {
          const p = wordProgress(wd, t);
          const cur = t >= wd.start && t < wd.end + 0.06;
          const age = t - wd.start;
          const pop = cur ? E.outBack(clamp01(age / 0.18), 2.2) : 0;
          const creep = cur ? 1 + 0.035 * Math.max(0, age) : 1;
          const wdth = 100 + 10 * kick + (cur ? 6 * (1 - clamp01(age / 0.3)) : 0);
          const wght = 760 + 140 * kick;
          const style: React.CSSProperties = {...vf(wdth, wght), whiteSpace: 'pre', textTransform: 'uppercase'};
          const appear = clamp01((t - (first - ANT) - i * 0.03) / 0.2);
          return (
            <span
              key={i}
              style={{
                position: 'relative',
                display: 'inline-block',
                marginRight: '0.24em',
                marginBottom: '0.06em',
                transform: `translateY(${-0.05 * pop * fs}px) scale(${(cur ? 1 + 0.04 * pop : 1) * creep})`,
                transformOrigin: '50% 80%',
                opacity: appear,
              }}
            >
              <span
                style={{
                  ...style,
                  color: unsung === 'outline' ? 'transparent' : ink,
                  opacity: unsung === 'outline' ? 0.75 : 0.3,
                  WebkitTextStroke: unsung === 'outline' ? `${Math.max(1, 1.3 * u)}px ${ink}` : undefined,
                }}
              >
                {wd.text}
              </span>
              <span
                style={{
                  ...style,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  color: cur ? accent : ink,
                  clipPath: `inset(-25% ${((1 - p) * 100).toFixed(2)}% -25% -10%)`,
                  textShadow: cur ? `0 0 ${18 * u}px ${accent}55` : undefined,
                }}
              >
                {wd.text}
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  // beat ruler: 4 bars of beats, playhead fills them; ticks flash on hits
  const bpb = g.beatsPerBar;
  const nBeats = bpb * 4;
  const page = Math.floor(Math.max(0, b.beat) / nBeats);
  const rulerX = w * (portrait ? 0.08 : 0.09);
  const rulerW = w - rulerX * 2;
  const rulerY = h * (portrait ? 0.86 : 0.86);
  const mono = 15 * u * (portrait ? 1.1 : 1);
  const lineNo = line ? line.i + 1 : Math.max(1, L.filter((l) => l.start <= t).length);

  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background, overflow: 'hidden'}}>
      {!clear ? (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at ${align === 'center' ? 50 : 30}% 45%, ${accent}${Math.round(10 + 22 * b.pulse * beatReact).toString(16).padStart(2, '0')} 0%, transparent 55%)`}} />
      ) : null}
      {!clear ? <AbsoluteFill style={{background: ink, opacity: flash}} /> : null}
      {!clear ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 7}, (_, i) => {
            const r = (0.12 + i * 0.09) * Math.max(w, h) * (1 + 0.015 * b.pulse * beatReact);
            return <circle key={i} cx={w * (portrait ? 0.82 : 0.86)} cy={h * 0.3} r={r} fill="none" stroke={ink} strokeOpacity={0.06 - i * 0.006} strokeWidth={1} />;
          })}
        </svg>
      ) : null}
      {content}
      {showGrid ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: nBeats}, (_, i) => {
            const bi = page * nBeats + i;
            const x = rulerX + (i + 0.5) * (rulerW / nBeats);
            const down = i % bpb === 0;
            const passed = b.beat >= bi;
            const hot = passed && b.beat < bi + 1 ? Math.exp(-5 * (b.beat - bi)) : 0;
            const hh = (down ? 18 : 10) * u * (1 + 0.8 * hot);
            return <rect key={i} x={x - 1.5 * u} y={rulerY - hh} width={3 * u} height={hh} fill={hot > 0.05 ? accent : ink} opacity={passed ? 0.9 : 0.25} />;
          })}
          <line x1={rulerX} x2={rulerX + rulerW} y1={rulerY + 6 * u} y2={rulerY + 6 * u} stroke={ink} strokeOpacity={0.25} strokeWidth={1} />
          <rect x={rulerX} y={rulerY + 5 * u} width={rulerW * clamp01((b.beat - page * nBeats) / nBeats)} height={2 * u} fill={accent} />
          <text x={rulerX} y={rulerY + 32 * u} fontFamily={plexMono} fontSize={mono} fill={ink} opacity={0.6} letterSpacing={1}>
            {`BAR ${String(Math.max(0, b.barIndex) + 1).padStart(2, '0')} · ${b.beatInBar + 1}/${bpb} · ${Math.round(g.bpm)} BPM`}
          </text>
          <text x={rulerX + rulerW} y={rulerY + 32 * u} textAnchor="end" fontFamily={plexMono} fontSize={mono} fill={ink} opacity={0.6} letterSpacing={1}>
            {`LINE ${String(lineNo).padStart(2, '0')} / ${String(L.length).padStart(2, '0')}`}
          </text>
        </svg>
      ) : null}
      {!clear ? <TreatiseFinish grain={0.06} vignette={0.4} /> : null}
    </AbsoluteFill>
  );
};

export const lyricVideo = defineMotion<Props>({
  id: 'lyric-video',
  title: 'Lyric video (karaoke + beat)',
  category: 'music',
  description:
    'Big lyric lines set left in a heavy variable grotesk; unsung words wait as hairline outlines and fill solid at the singer’s speed (syllable-aware), the current word lights hazard orange and creeps, the type breathes on every kick, a beat ruler and bar counter tick along the bottom.',
  source: ['pdoom-video docs/TREATMENT.md karaoke rules + engine/lyrics.ts (MIT)', 'pdoom-video plates fig02/fig12 (karaoke-fill look)'],
  useFor: 'Lyric videos, word-synced song captions, music promos: pass `lyrics` (word timings) or just `lines` + `bpm`/`offsetSec`.',
  durationInFrames: 510,
  defaultProps: {
    lines: PLACEHOLDER_LINES,
    lyrics: [],
    bpm: 120,
    offsetSec: 0.5,
    beats: {},
    beatsPerLine: 8,
    background: TREATISE.ink,
    ink: TREATISE.bone,
    accent: TREATISE.signal,
    unsung: 'outline',
    align: 'left',
    beatReact: 1,
    showGrid: true,
    size: 118,
  },
  propDocs: {
    ...MUSIC_PROP_DOCS,
    beatsPerLine: 'when timing plain `lines`: beats per line (8 = two bars)',
    background: "frame colour, or 'transparent' to lay the lyrics over footage",
    ink: 'bone type colour (sung words)',
    accent: 'colour of the word being sung',
    unsung: "'outline' (hairline outline) or 'dim' (30 % ink) for words not yet sung",
    align: "'left' (treatise default) or 'center'",
    beatReact: 'how hard the type and background react to the beat (0 = still)',
    showGrid: 'show the beat ruler + bar counter at the bottom',
    size: 'lyric size in u (auto-shrinks so the longest word fits)',
  },
  component: LyricVideo,
  tags: ['lyric video', 'karaoke', 'lyrics', 'song', 'music', 'beat', 'bpm', 'word timing', 'captions', 'sync', 'kinetic typography', 'variable font', 'treatise', 'music video', 'singalong'],
});
