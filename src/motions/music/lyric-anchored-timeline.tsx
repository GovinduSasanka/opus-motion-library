// Adapted from pdoom-video/app/src/timeline.ts cut(q) + engine/lyrics.ts get() (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  BeatsProp,
  E,
  LLine,
  LyricLineIn,
  MUSIC_PROP_DOCS,
  PLACEHOLDER_LINES,
  TREATISE,
  TreatiseFinish,
  clamp01,
  cutForLyric,
  getLine,
  hash,
  plexMono,
  resolveLyrics,
  useGrid,
  vf,
  wordProgress,
} from '../../core/r2-music-kit';

type Look = 'field' | 'outline' | 'stamp' | 'stack';
type Scene = {lyric: string; snap?: 'beat' | 'downbeat' | 'none'; nth?: number; look?: Look; background?: string; ink?: string};
type Props = {
  scenes: Scene[];
  lines: string[];
  lyrics: LyricLineIn[];
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  accent: string;
  editStrip: boolean;
  cutFlash: boolean;
};

const DEFAULT_BG: Record<Look, [string, string]> = {
  field: [TREATISE.signal, TREATISE.ink],
  outline: [TREATISE.ink, TREATISE.bone],
  stamp: [TREATISE.bone, TREATISE.ink],
  stack: [TREATISE.panel, TREATISE.bone],
};

const SceneView: React.FC<{line: LLine | null; look: Look; bg: string; ink: string; accent: string; t: number; t0: number; w: number; h: number; u: number; portrait: boolean; seed: number}> = ({line, look, bg, ink, accent, t, t0, w, h, u, portrait, seed}) => {
  const words = line?.words ?? [];
  const lt = t - t0;
  const enter = E.outExpo(clamp01(lt / 0.35));
  const maxChars = Math.max(4, ...words.map((x) => x.text.length));
  const pad = w * (portrait ? 0.08 : 0.08);
  const cur = (wd: {start: number; end: number}) => t >= wd.start && t < wd.end + 0.05;
  const hot = accent === bg ? TREATISE.bone : accent;
  if (look === 'stack') {
    const fs = Math.min((h * 0.78) / Math.max(1, words.length) / 1.0, (w * 0.84) / (maxChars * 0.6));
    return (
      <AbsoluteFill style={{background: bg, alignItems: 'flex-end', justifyContent: 'center', paddingRight: pad, flexDirection: 'column'}}>
        {words.map((wd, i) => {
          const p = wordProgress(wd, t);
          const vis = t >= wd.start - 0.12 ? 1 : 0.12;
          return (
            <div key={i} style={{...vf(78, 850), fontSize: fs, lineHeight: 0.98, color: cur(wd) ? hot : ink, opacity: vis * (p > 0 ? 1 : 0.6), textTransform: 'uppercase', transform: `translateX(${(1 - E.outExpo(clamp01((t - wd.start + 0.12) / 0.25))) * 60 * u}px)`}}>
              {wd.text}
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }
  const fs = Math.min((portrait ? 150 : 140) * u, (w - pad * 2) / (maxChars * 0.64));
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      {look === 'stamp' ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: 0.18}}>
          {Array.from({length: 14}, (_, i) => (
            <line key={i} x1={0} x2={w} y1={(h / 14) * i} y2={(h / 14) * i} stroke={ink} strokeWidth={0.6} />
          ))}
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: pad,
          right: pad,
          top: '50%',
          transform: `translateY(-50%) scale(${look === 'outline' ? 1 + 0.06 * (1 - enter) : 1})`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: look === 'outline' ? 'center' : 'flex-start',
          fontSize: fs,
          lineHeight: 1,
          gap: `0 ${0.24 * fs}px`,
        }}
      >
        {words.map((wd, i) => {
          const p = wordProgress(wd, t);
          const style: React.CSSProperties = {...vf(look === 'field' ? 70 : 100, look === 'stamp' ? 700 : 860), textTransform: look === 'stamp' ? 'none' : 'uppercase', whiteSpace: 'pre'};
          if (look === 'stamp') {
            const sp = clamp01((t - wd.start) / 0.09);
            if (t < wd.start) return <span key={i} style={{...style, opacity: 0}}>{wd.text}</span>;
            const rot = (hash(i, seed) - 0.5) * 6;
            return (
              <span key={i} style={{...style, display: 'inline-block', color: cur(wd) ? hot : ink, transform: `rotate(${rot}deg) scale(${1 + 0.5 * (1 - sp)})`, opacity: sp}}>
                {wd.text}
              </span>
            );
          }
          return (
            <span key={i} style={{position: 'relative', display: 'inline-block'}}>
              <span style={{...style, color: look === 'outline' ? 'transparent' : ink, opacity: look === 'outline' ? 0.7 : 0.25, WebkitTextStroke: look === 'outline' ? `${Math.max(1, 1.4 * u)}px ${ink}` : undefined}}>{wd.text}</span>
              <span style={{...style, position: 'absolute', left: 0, top: 0, color: cur(wd) && look !== 'field' ? hot : ink, clipPath: `inset(-20% ${((1 - p) * 100).toFixed(2)}% -20% -10%)`}}>{wd.text}</span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const LyricAnchoredTimeline: React.FC<Props> = ({scenes, lines, lyrics, bpm, offsetSec, beats, accent, editStrip, cutFlash}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const L = React.useMemo(() => resolveLyrics(g, lyrics, lines, {beatsPerLine: 8}), [g, JSON.stringify(lyrics), JSON.stringify(lines)]);
  const t = frame / fps;
  const resolved = scenes
    .map((s, i) => ({s, i, line: getLine(L, s.lyric, s.nth ?? 0), at: cutForLyric(g, L, s.lyric, {snap: s.snap ?? 'beat', nth: s.nth ?? 0})}))
    .filter((r) => r.at !== null)
    .sort((a, b) => (a.at as number) - (b.at as number));
  if (resolved.length) resolved[0] = {...resolved[0], at: Math.min(0, resolved[0].at as number)};
  let idx = 0;
  for (let i = 0; i < resolved.length; i++) if (t >= (resolved[i].at as number)) idx = i;
  const sc = resolved[idx];
  const look: Look = sc?.s.look ?? 'outline';
  const [dbg, dink] = DEFAULT_BG[look];
  const sinceCut = sc ? t - (sc.at as number) : 99;
  const flash = cutFlash && idx > 0 && sinceCut < 2 / fps;
  const total = durationInFrames / fps;
  const P = portrait ? 1.25 : 1;
  const mono = 12.5 * u * P;
  const stripY = h - 70 * u * P;
  const sx0 = w * 0.05;
  const sx1 = w * 0.95;
  const SX = (tt: number) => sx0 + ((sx1 - sx0) * tt) / total;
  return (
    <AbsoluteFill style={{background: TREATISE.ink}}>
      {sc ? <SceneView line={sc.line} look={look} bg={sc.s.background || dbg} ink={sc.s.ink || dink} accent={accent} t={t} t0={sc.at as number} w={w} h={h} u={u} portrait={portrait} seed={sc.i + 1} /> : null}
      {flash ? <AbsoluteFill style={{background: TREATISE.bone, mixBlendMode: 'difference'}} /> : null}
      {editStrip ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <rect x={sx0 - 10 * u} y={stripY - 30 * u * P} width={sx1 - sx0 + 20 * u} height={62 * u * P} fill={TREATISE.ink} opacity={0.82} rx={4 * u} />
          {Array.from({length: Math.ceil(g.beatAt(total)) + 1}, (_, i) => {
            const tt = g.timeOfBeat(i);
            if (tt < 0 || tt > total) return null;
            const down = i % g.beatsPerBar === 0;
            return <line key={i} x1={SX(tt)} x2={SX(tt)} y1={stripY + (down ? -8 : -3) * u * P} y2={stripY + 8 * u * P} stroke={TREATISE.bone} strokeOpacity={down ? 0.5 : 0.22} strokeWidth={Math.max(1, u)} />;
          })}
          {L.flatMap((l) => l.words).map((wd) => (
            <rect key={wd.gi} x={SX(wd.start)} y={stripY + 11 * u * P} width={Math.max(1, SX(wd.end) - SX(wd.start) - 1)} height={5 * u * P} fill={TREATISE.mid} opacity={t >= wd.start ? 0.9 : 0.35} />
          ))}
          {resolved.map((r, i) => {
            const x = SX(Math.max(0, r.at as number));
            const active = i === idx;
            return (
              <g key={i}>
                <path d={`M${x} ${stripY - 22 * u * P} L${x} ${stripY + 18 * u * P}`} stroke={accent} strokeWidth={Math.max(1.5, (active ? 3 : 1.6) * u)} />
                <path d={`M${x} ${stripY - 22 * u * P} l${7 * u} ${-7 * u} l${-14 * u} 0 Z`} fill={accent} />
                {!portrait || active ? (
                  <text x={x + 5 * u} y={stripY - 13 * u * P} fontFamily={plexMono} fontSize={mono} fill={TREATISE.bone} opacity={active ? 1 : 0.55}>
                    {`“${r.s.lyric}” · ${r.s.snap ?? 'beat'}`}
                  </text>
                ) : null}
              </g>
            );
          })}
          <line x1={SX(t)} x2={SX(t)} y1={stripY - 26 * u * P} y2={stripY + 22 * u * P} stroke={TREATISE.bone} strokeWidth={Math.max(1, 1.5 * u)} />
        </svg>
      ) : null}
      <TreatiseFinish grain={0.05} vignette={0.3} />
    </AbsoluteFill>
  );
};

export const lyricAnchoredTimeline = defineMotion<Props>({
  id: 'lyric-anchored-timeline',
  title: 'Lyric-anchored cuts (edit by lyric text)',
  category: 'music',
  description:
    'A lyric video whose scenes are placed by lyric text, not timestamps: each scene names a fragment of its line and cuts on the last beat (or downbeat) before that line’s first word, then integrates the words its own way (orange field, outline fill, rubber-stamped, stacked); an edit strip shows beats, word blocks and the snapped cut markers.',
  source: ['pdoom-video app/src/timeline.ts cut(q) = last beat ≤ first word (+20 ms), engine/lyrics.ts get(text) (MIT)'],
  useFor: 'Author a whole lyric video or captioned promo by lyric text — re-time the song and every cut still lands on the beat; teach “cut on the beat” editing.',
  durationInFrames: 510,
  defaultProps: {
    scenes: [
      {lyric: 'city lights', snap: 'beat', look: 'outline'},
      {lyric: 'heartbeat', snap: 'downbeat', look: 'field'},
      {lyric: 'the signal', snap: 'beat', look: 'stamp'},
      {lyric: 'louder', snap: 'downbeat', look: 'stack'},
    ],
    lines: PLACEHOLDER_LINES,
    lyrics: [],
    bpm: 120,
    offsetSec: 0.5,
    beats: {},
    accent: TREATISE.signal,
    editStrip: true,
    cutFlash: true,
  },
  propDocs: {
    scenes: "[{lyric: 'words from the line', snap: 'beat'|'downbeat'|'none', nth?, look: 'field'|'outline'|'stamp'|'stack', background?, ink?}] — each scene starts at its line's snapped cut",
    ...MUSIC_PROP_DOCS,
    accent: 'signal colour (current word, cut markers)',
    editStrip: 'show the edit strip (beats, words, cut markers, playhead) — turn off for the clean video',
    cutFlash: 'two-frame invert flash on every cut',
  },
  component: LyricAnchoredTimeline,
  tags: ['lyric video', 'edit', 'cut on the beat', 'lyrics', 'karaoke', 'music video', 'timeline', 'beat sync', 'scenes', 'downbeat', 'treatise', 'kinetic typography'],
});
