// Adapted from pdoom-video/app/src/scenes/loss.ts + fuse.ts (spark-drawn curve, words on the path, burn front) (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
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
  clamp01,
  clampN,
  hash,
  lerpN,
  noise1,
  plexMono,
  resolveLyrics,
  useGrid,
  vf,
  wordProgress,
} from '../../core/r2-music-kit';

type Props = {
  lines: string[];
  lyrics: LyricLineIn[];
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  variant: 'curve' | 'fuse';
  path: string;
  background: string;
  ink: string;
  accent: string;
  ashColor: string;
  size: number;
  labels: boolean;
  seed: number;
};

const LyricOnPath: React.FC<Props> = ({lines, lyrics, bpm, offsetSec, beats, variant, path, background, ink, accent, ashColor, size, labels, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const L = React.useMemo(() => resolveLyrics(g, lyrics, lines, {beatsPerLine: portrait ? 10 : 8, wordBeats: 0.75}), [g, JSON.stringify(lyrics), JSON.stringify(lines), portrait]);
  const words = L.flatMap((l) => l.words);
  const t = frame / fps;
  const total = durationInFrames / fps;
  // ---- the curve: default = a descending loss-like polyline with noise; or a custom normalised path (list of "x,y" 0..1)
  const pts = React.useMemo(() => {
    const out: {x: number; y: number}[] = [];
    if (path) {
      for (const pair of path.split(/\s+/)) {
        const [px, py] = pair.split(',').map(Number);
        if (Number.isFinite(px) && Number.isFinite(py)) out.push({x: px * w, y: py * h});
      }
    }
    if (out.length < 2) {
      const n = 160;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const x = lerpN(0.06, 0.94, k) * w;
        const base = variant === 'fuse' ? 0.52 + 0.1 * Math.sin(k * 9 + seed) : lerpN(0.24, 0.74, Math.pow(k, 0.8));
        const y = (base + noise1(k * 6 + seed * 13, 2) * (variant === 'fuse' ? 0.05 : 0.07) * (1 - k * 0.4)) * h;
        out.push({x, y});
      }
    }
    return out;
  }, [path, w, h, variant, seed]);
  const lens = React.useMemo(() => {
    const Lk = [0];
    for (let i = 1; i < pts.length; i++) Lk.push(Lk[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return Lk;
  }, [pts]);
  const totalLen = lens[lens.length - 1];
  const at = (s: number) => {
    s = clampN(s, 0, totalLen);
    let lo = 0;
    let hi = pts.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (lens[m] < s) lo = m;
      else hi = m;
    }
    const segL = lens[hi] - lens[lo] || 1;
    const k = (s - lens[lo]) / segL;
    return {x: lerpN(pts[lo].x, pts[hi].x, k), y: lerpN(pts[lo].y, pts[hi].y, k), ang: (Math.atan2(pts[hi].y - pts[lo].y, pts[hi].x - pts[lo].x) * 180) / Math.PI};
  };
  // even arc spacing per word (keeps words legible); the spark front is the sung progress through the
  // word sequence, so the spark is exactly at word i while word i is sung (the source's property)
  const N = Math.max(1, words.length);
  // arc slots weighted by word length so long words never collide
  const cum = React.useMemo(() => {
    const c = [0];
    for (const wd of words) c.push(c[c.length - 1] + wd.text.length + 2.2);
    return c;
  }, [words.map((x) => x.text).join(' ')]);
  const sOf = (gi: number) => totalLen * (0.03 + (0.94 * (cum[gi] + cum[gi + 1]) * 0.5) / Math.max(1, cum[cum.length - 1]));
  const lastEnd = words.length ? words[words.length - 1].end + 0.6 : total;
  let prog = 0;
  for (const wd of words) {
    const p = wordProgress(wd, t);
    prog += p * ((cum[words.indexOf(wd) + 1] - cum[words.indexOf(wd)]) / Math.max(1, cum[cum.length - 1])) * N;
    if (p < 1) break;
  }
  const lastW = words[words.length - 1];
  const tail = lastW && t > lastW.end ? clamp01((t - lastW.end) / 0.8) : 0;
  const front = totalLen * clamp01(E.outCubic(clamp01(t / 0.3)) * (0.03 + (0.94 * prog) / N + 0.03 * tail));
  const head = at(front);
  const fi = Math.round(t * fps);
  const d = 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L');
  const fs = size * u * (portrait ? 1.15 : 1);
  const mono = 12 * u * (portrait ? 1.25 : 1);
  const clear = background === 'transparent';
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`lop${seed}halo`}>
            <stop offset="0" stopColor="#FFD9A8" stopOpacity="0.95" />
            <stop offset="0.25" stopColor={TREATISE.hot} stopOpacity="0.55" />
            <stop offset="1" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* undrawn path hint + drawn line */}
        <path d={d} fill="none" stroke={ink} strokeOpacity={0.12} strokeWidth={Math.max(1, u)} strokeDasharray={`${3 * u} ${6 * u}`} />
        <path d={d} fill="none" stroke={variant === 'fuse' ? TREATISE.mid : ink} strokeWidth={Math.max(1, (variant === 'fuse' ? 3 : 1.6) * u)} strokeDasharray={totalLen} strokeDashoffset={totalLen - front} strokeLinecap="round" />
        {variant === 'fuse' ? (
          // charred part behind the burn front
          <path d={d} fill="none" stroke={ashColor} strokeWidth={Math.max(1, 2 * u)} strokeDasharray={`${Math.max(0, front - 30 * u)} ${totalLen}`} strokeLinecap="round" opacity={0.8} />
        ) : null}
        {/* grid footnotes */}
        {labels
          ? [0.25, 0.5, 0.75].map((k, i) => {
              const p = at(totalLen * k);
              return (
                <g key={i} opacity={front > totalLen * k ? 0.55 : 0.18}>
                  <line x1={p.x} x2={p.x} y1={p.y + 10 * u} y2={p.y + 26 * u} stroke={ink} strokeWidth={Math.max(1, u)} />
                  <text x={p.x} y={p.y + 26 * u + mono * 1.2} textAnchor="middle" fontFamily={plexMono} fontSize={mono} fill={ink}>
                    {variant === 'fuse' ? `${((1 - k) * 100).toFixed(0)}%` : `1e-${4 + i * 2}`}
                  </text>
                </g>
              );
            })
          : null}
        {/* words on the path */}
        {words.map((wd) => {
          const s = sOf(wd.gi);
          if (front < s - 10 * u) return null;
          const p = at(s);
          const sung = wordProgress(wd, t);
          const burnt = variant === 'fuse' ? clamp01((front - s) / (totalLen * 0.08) - 0.4) : 0;
          const glow = variant === 'fuse' ? Math.exp(-Math.abs(front - s) / (26 * u)) : sung > 0 && sung < 1 ? 1 : 0;
          const col = burnt > 0.5 ? ashColor : glow > 0.4 || (sung > 0 && sung < 1) ? accent : ink;
          const drift = burnt > 0 ? burnt * 16 * u : 0;
          const crumble = burnt > 0 ? (hash(wd.gi, fi % 7) - 0.5) * burnt * 3 * u : 0;
          return (
            <g key={wd.gi} transform={`translate(${p.x + crumble} ${p.y - 12 * u + drift}) rotate(${p.ang})`} opacity={clamp01(1.1 - burnt)}>
              <text textAnchor="middle" style={vf(90, 740)} fontSize={fs * (1 + 0.18 * glow)} fill={col} fillOpacity={0.25 + 0.75 * clamp01(sung * 3)}>
                {wd.text.toUpperCase()}
              </text>
            </g>
          );
        })}
        {/* the spark head: white-hot core, four rays, sputter */}
        {front < totalLen - 1 ? (
          <g transform={`translate(${head.x} ${head.y})`}>
            <circle r={26 * u} fill={`url(#lop${seed}halo)`} />
            {Array.from({length: 4}, (_, i) => {
              const a = (i * Math.PI) / 2 + 0.3;
              const len = (8 + 5 * hash(fi, i)) * u;
              return <line key={i} x1={Math.cos(a) * 4 * u} y1={Math.sin(a) * 4 * u} x2={Math.cos(a) * len} y2={Math.sin(a) * len} stroke={TREATISE.hot} strokeWidth={Math.max(1, 1.4 * u)} />;
            })}
            {Array.from({length: 7}, (_, i) => {
              const ph = (fi * 0.13 + hash(i, seed)) % 1;
              const a = hash(i, seed, 3) * Math.PI * 2;
              const r = ph * 24 * u;
              return <circle key={i} cx={Math.cos(a) * r - ph * 14 * u} cy={Math.sin(a) * r + ph * 8 * u} r={(1 - ph) * 2.2 * u} fill={TREATISE.hot} opacity={1 - ph} />;
            })}
            <circle r={4.5 * u} fill={TREATISE.hot} />
            <circle r={2.2 * u} fill="#FFE9C8" />
          </g>
        ) : null}
      </svg>
      {!clear ? <TreatiseFinish grain={0.06} vignette={0.35} /> : null}
    </AbsoluteFill>
  );
};

export const lyricOnPath = defineMotion<Props>({
  id: 'lyric-on-path',
  title: 'Lyric on a path (spark / fuse)',
  category: 'music',
  description:
    'An orange spark with a white-hot core drags a hairline curve across the frame and the lyric rides it: each word appears on the path, tilted to the tangent, exactly as it is sung; in the fuse variant the burning front makes words glow as it passes, then they char to ash and crumble off the line.',
  source: ['pdoom-video app/src/scenes/loss.ts + fuse.ts + _motifs.ts spark (MIT)'],
  useFor: 'Text that follows a chart line, a fuse, a route or a timeline; lyric videos, countdown fuses, “descending into the data” beats.',
  durationInFrames: 300,
  defaultProps: {
    lines: PLACEHOLDER_LINES.slice(0, 2),
    lyrics: [],
    bpm: 120,
    offsetSec: 0.3,
    beats: {},
    variant: 'curve',
    path: '',
    background: TREATISE.ink,
    ink: TREATISE.bone,
    accent: TREATISE.signal,
    ashColor: '#55504B',
    size: 34,
    labels: true,
    seed: 2,
  },
  propDocs: {
    ...MUSIC_PROP_DOCS,
    variant: "'curve' (words light as sung on a descending line) or 'fuse' (burn front ignites then chars the words)",
    path: "custom path as normalised points 'x,y x,y …' (0..1); empty = procedural curve",
    background: "frame colour or 'transparent'",
    ink: 'line + rested word colour',
    accent: 'spark / sung word colour',
    ashColor: 'charred word colour (fuse)',
    size: 'word size in u',
    labels: 'tiny mono footnote ticks along the path',
    seed: 'curve shape + sputter variety',
  },
  component: LyricOnPath,
  tags: ['lyrics', 'path', 'spark', 'fuse', 'burn', 'curve', 'karaoke', 'text on path', 'music', 'chart', 'line', 'ember', 'treatise', 'word timing'],
});
