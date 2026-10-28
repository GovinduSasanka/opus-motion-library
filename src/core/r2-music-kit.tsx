// Adapted from pdoom-video/app/src/engine/audio.ts, lyrics.ts, util.ts (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
// Rewritten as pure, frame-driven helpers for Remotion. No song, lyric text or data from the source is included:
// every default lyric here is an original placeholder line.
//
// Music + lyric sync layer for the whole library (group PD, round 2):
//  - beat grid: `beats` prop = {bpm, offsetSec} | a beat list (seconds) | full analysis {beats, downbeats, sections, onsets}
//  - lyric timing: `lyrics` prop = [{text, start, end, words?: [{text, start, end, syl?}]}] (seconds)
//  - word / line progress for karaoke wipes, line lookup by content, beat-snapped cuts anchored to lyric lines
//  - <TimeRemap>, <ShutterBlur>, <BeatCamera> wrappers that work around any children
import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame, useVideoConfig} from 'remotion';
import * as ArchivoFont from '@remotion/google-fonts/Archivo';
import {loadFont as loadPlexMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as loadCormorant} from '@remotion/google-fonts/CormorantGaramond';

// ------------------------------------------------------------------ fonts + palette
/** Archivo variable (wdth 62–125, wght 100–900): the lyric voice. Animate with `font-variation-settings`. */
export const archivoVar = (() => {
  // namespace + dynamic key: the catalog bundler stubs Google Fonts with `loadFont` only
  const mod = ArchivoFont as unknown as Record<string, ((style: string, o: {subsets: string[]}) => {fontFamily: string}) | undefined>;
  const load = mod['loadVariableFont'];
  try {
    return load ? load('normal', {subsets: ['latin']}).fontFamily : 'Archivo';
  } catch {
    return 'Archivo';
  }
})();
/** IBM Plex Mono: the machine voice (labels, tokens, footnotes, QC logs). */
export const plexMono = loadPlexMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']}).fontFamily;
/** Cormorant Garamond italic: the rare "prophetic" register. */
export const garamondItalic = loadCormorant('italic', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;

/** CSS for the variable width/weight axes of Archivo. */
export const vf = (wdth: number, wght: number): React.CSSProperties => ({
  fontFamily: archivoVar,
  fontVariationSettings: `'wdth' ${Math.max(62, Math.min(125, wdth)).toFixed(1)}, 'wght' ${Math.max(100, Math.min(900, wght)).toFixed(0)}`,
  fontWeight: Math.round(Math.max(100, Math.min(900, wght)) / 100) * 100,
});

/** "Engraved treatise" palette: near-black, bone type, one hazard-orange signal colour. */
export const TREATISE = {
  ink: '#0A0A0B',
  panel: '#151517',
  dim: '#5E5B57',
  mid: '#9C978F',
  bone: '#EEE9DF',
  signal: '#FF4D12',
  hot: '#FF8A3D',
  deep: '#C21D0B',
  lime: '#D8FF3C',
};

// ------------------------------------------------------------------ math
export const TAU = Math.PI * 2;
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clampN = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
export const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
export const fract = (x: number) => x - Math.floor(x);
export const mod = (x: number, m: number) => ((x % m) + m) % m;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const seg = (x: number, a: number, b: number) => (b <= a ? (x >= a ? 1 : 0) : clamp01((x - a) / (b - a)));
export const E = {
  outCubic: (t: number) => 1 - Math.pow(1 - clamp01(t), 3),
  inCubic: (t: number) => Math.pow(clamp01(t), 3),
  inOutCubic: (t: number) => {
    t = clamp01(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t))),
  inExpo: (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * clamp01(t) - 10)),
  outBack: (t: number, s = 1.70158) => {
    t = clamp01(t);
    return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  },
};
/** damped spring response to a step at time 0 (0 -> 1 with overshoot) */
export const springStep = (t: number, freq = 4, damping = 0.35) => {
  if (t <= 0) return 0;
  const w = TAU * freq;
  return 1 - Math.exp(-damping * w * t) * Math.cos(w * Math.sqrt(1 - damping * damping) * t);
};
/** exponential decay pulse after t0 with half-life hl (1 at t0) */
export const pulseHL = (t: number, t0: number, hl = 0.12) => (t < t0 ? 0 : Math.pow(0.5, (t - t0) / hl));
/** stateless hash of numbers to [0,1) */
export const hash = (...xs: number[]) => {
  let h = 2166136261 >>> 0;
  for (const x of xs) {
    h ^= Math.floor(x * 1000003) | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};
/** cheap smooth 1D value noise, -1..1 */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const k = f * f * f * (f * (f * 6 - 15) + 10);
  return lerpN(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, k);
};

// ------------------------------------------------------------------ beat grid
export type Section = {name: string; start: number; end: number};
export type Onset = [number, number] | number;
/** The `beats` prop every beat-aware motion accepts. */
export type BeatsProp =
  | {
      bpm?: number;
      /** time of the first beat in seconds */
      offsetSec?: number;
      beatsPerBar?: number;
      /** explicit beat times (seconds); overrides bpm when given */
      beats?: number[];
      downbeats?: number[];
      sections?: Section[];
      /** onset lists per kind (kick/snare/hat/vocal): [time, strength] or time */
      onsets?: Record<string, Onset[]>;
    }
  | number[];

export type BeatGrid = {
  bpm: number;
  period: number;
  beatsPerBar: number;
  offsetSec: number;
  /** continuous beat index (0 at first beat) */
  beatAt: (t: number) => number;
  timeOfBeat: (i: number) => number;
  /** continuous bar index */
  barAt: (t: number) => number;
  nearestBeat: (t: number) => number;
  /** last beat time at or before t (+tol) */
  beatAtOrBefore: (t: number, tol?: number) => number;
  /** last downbeat time at or before t (+tol) */
  downbeatAtOrBefore: (t: number, tol?: number) => number;
  nearestDownbeat: (t: number) => number;
  section: (t: number) => Section | null;
  sections: Section[];
  /** decaying hit 0..1 of kick/snare/hat/vocal/beat/downbeat/eighth (synthesised from the grid when no onsets) */
  hit: (kind: string, t: number, halfLife?: number) => number;
  /** onset events of a kind inside [t0, t1) */
  events: (kind: string, t0: number, t1: number) => [number, number][];
};

const DEFAULT_HL: Record<string, number> = {kick: 0.12, snare: 0.14, hat: 0.06, vocal: 0.15, beat: 0.12, downbeat: 0.16, eighth: 0.07};

/** Build a beat grid from the `beats` prop (bpm/offset, a beat list or a full analysis). Pure. */
export const makeBeatGrid = (p?: BeatsProp | null, fallbackBpm = 120, fallbackOffset = 0): BeatGrid => {
  const obj = Array.isArray(p) ? {beats: p} : p ?? {};
  const list = (obj.beats ?? []).filter((x) => typeof x === 'number').slice().sort((a, b) => a - b);
  const bpb = Math.max(1, Math.round(obj.beatsPerBar ?? 4));
  const bpm = obj.bpm ?? (list.length > 1 ? (60 * (list.length - 1)) / (list[list.length - 1] - list[0]) : fallbackBpm);
  const period = 60 / Math.max(1, bpm);
  const offset = list.length ? list[0] : obj.offsetSec ?? fallbackOffset;
  const useList = list.length >= 2;
  const beatAt = (t: number) => {
    if (!useList) return (t - offset) / period;
    const b = list;
    if (t <= b[0]) return (t - b[0]) / (b[1] - b[0]);
    if (t >= b[b.length - 1]) return b.length - 1 + (t - b[b.length - 1]) / (b[b.length - 1] - b[b.length - 2]);
    let lo = 0;
    let hi = b.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (b[m] <= t) lo = m;
      else hi = m;
    }
    return lo + (t - b[lo]) / (b[hi] - b[lo]);
  };
  const timeOfBeat = (i: number) => {
    if (!useList) return offset + i * period;
    const b = list;
    const n = b.length;
    const per = (b[n - 1] - b[0]) / (n - 1);
    if (i <= 0) return b[0] + i * per;
    if (i >= n - 1) return b[n - 1] + (i - (n - 1)) * per;
    const k = Math.floor(i);
    return b[k] + (b[k + 1] - b[k]) * (i - k);
  };
  const dbs = (obj.downbeats ?? []).slice().sort((a, b) => a - b);
  // without explicit downbeats, bar 0 starts on beat 0
  const barAt = (t: number) => {
    if (dbs.length < 2) return beatAt(t) / bpb;
    if (t <= dbs[0]) return (t - dbs[0]) / (dbs[1] - dbs[0]);
    if (t >= dbs[dbs.length - 1]) return dbs.length - 1 + (t - dbs[dbs.length - 1]) / (dbs[dbs.length - 1] - dbs[dbs.length - 2]);
    let lo = 0;
    let hi = dbs.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (dbs[m] <= t) lo = m;
      else hi = m;
    }
    return lo + (t - dbs[lo]) / (dbs[hi] - dbs[lo]);
  };
  const timeOfBar = (k: number) => (dbs.length >= 2 ? (k < dbs.length ? dbs[Math.max(0, k)] : dbs[dbs.length - 1] + (k - dbs.length + 1) * (dbs[dbs.length - 1] - dbs[dbs.length - 2])) : timeOfBeat(k * bpb));
  const onsets: Record<string, [number, number][]> = {};
  for (const [k, v] of Object.entries(obj.onsets ?? {})) {
    onsets[k] = (v ?? []).map((o) => (Array.isArray(o) ? ([o[0], o[1] ?? 1] as [number, number]) : ([o, 1] as [number, number]))).sort((a, b) => a[0] - b[0]);
  }
  /** synthesised hits on the grid: kick on every beat (accent on the downbeat), snare on 2 & 4, hat on eighths */
  const lastSynth = (kind: string, t: number): [number, number] | null => {
    const b = beatAt(t + 1e-6);
    if (kind === 'eighth' || kind === 'hat') {
      const e = Math.floor(b * 2);
      return [timeOfBeat(e / 2), e % 2 === 0 ? 0.8 : 0.55];
    }
    if (kind === 'downbeat') {
      const k = Math.floor(barAt(t + 1e-6));
      return [timeOfBar(k), 1];
    }
    const bi = Math.floor(b);
    if (kind === 'snare') {
      let j = bi;
      for (let n = 0; n < bpb + 1; n++, j--) if (mod(j, bpb) % 2 === 1) return [timeOfBeat(j), 1];
      return [timeOfBeat(bi), 1];
    }
    // kick / beat / vocal fallback
    return [timeOfBeat(bi), mod(bi, bpb) === 0 ? 1 : 0.82];
  };
  const hit = (kind: string, t: number, halfLife?: number) => {
    const hl = halfLife ?? DEFAULT_HL[kind] ?? 0.12;
    const list2 = onsets[kind];
    if (list2 && list2.length) {
      let lo = 0;
      let hi = list2.length;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        if (list2[m][0] <= t) lo = m + 1;
        else hi = m;
      }
      let v = 0;
      for (let i = lo - 1; i >= 0 && i >= lo - 6; i--) {
        const [ot, s] = list2[i];
        if (t - ot > hl * 8) break;
        v = Math.max(v, s * Math.pow(0.5, (t - ot) / hl));
      }
      return v;
    }
    const e = lastSynth(kind, t);
    if (!e || t < e[0]) return 0;
    return e[1] * Math.pow(0.5, (t - e[0]) / hl);
  };
  const events = (kind: string, t0: number, t1: number): [number, number][] => {
    const l = onsets[kind];
    if (l && l.length) return l.filter(([x]) => x >= t0 && x < t1);
    const out: [number, number][] = [];
    const step = kind === 'hat' || kind === 'eighth' ? 0.5 : 1;
    for (let b = Math.ceil(beatAt(t0) / step) * step; ; b += step) {
      const tt = timeOfBeat(b);
      if (tt >= t1) break;
      if (kind === 'snare' && mod(Math.round(b), bpb) % 2 !== 1) continue;
      if (kind === 'downbeat' && mod(Math.round(b), bpb) !== 0) continue;
      out.push([tt, mod(Math.round(b), bpb) === 0 ? 1 : 0.8]);
      if (out.length > 4000) break;
    }
    return out;
  };
  const sections = obj.sections ?? [];
  return {
    bpm,
    period,
    beatsPerBar: bpb,
    offsetSec: offset,
    beatAt,
    timeOfBeat,
    barAt,
    nearestBeat: (t) => timeOfBeat(Math.round(beatAt(t))),
    beatAtOrBefore: (t, tol = 0.02) => timeOfBeat(Math.floor(beatAt(t + tol))),
    downbeatAtOrBefore: (t, tol = 0.02) => timeOfBar(Math.floor(barAt(t + tol))),
    nearestDownbeat: (t) => timeOfBar(Math.round(barAt(t))),
    section: (t) => sections.find((s) => t >= s.start && t < s.end) ?? null,
    sections,
    hit,
    events,
  };
};

/** Grid from the usual motion props: a non-empty `beats` wins, else `{bpm, offsetSec}`. */
export const gridFrom = (beats: BeatsProp | undefined | null, bpm = 120, offsetSec = 0) =>
  makeBeatGrid(Array.isArray(beats) ? (beats.length ? beats : {bpm, offsetSec}) : beats && Object.keys(beats).length ? {bpm, offsetSec, ...beats} : {bpm, offsetSec}, bpm, offsetSec);
/** Memoised `gridFrom` for components. */
export const useGrid = (beats: BeatsProp | undefined | null, bpm = 120, offsetSec = 0) =>
  React.useMemo(() => gridFrom(beats, bpm, offsetSec), [JSON.stringify(beats), bpm, offsetSec]);

/** Beat state at time t, the values every music motion needs. */
export const beatState = (g: BeatGrid, t: number) => {
  const beat = g.beatAt(t);
  const bar = g.barAt(t);
  return {
    t,
    beat,
    beatIndex: Math.floor(beat),
    beatPhase: fract(beat),
    bar,
    barIndex: Math.floor(bar),
    barPhase: fract(bar),
    beatInBar: mod(Math.floor(beat), g.beatsPerBar),
    /** 1 on each beat, decaying (exp(-k * phase)) */
    pulse: Math.exp(-6 * fract(beat)),
    /** same on eighth notes */
    pulse2: Math.exp(-6 * fract(beat * 2)),
    kick: g.hit('kick', t),
    snare: g.hit('snare', t),
    hat: g.hit('hat', t),
    downbeat: g.hit('downbeat', t),
    section: g.section(t),
  };
};
export type BeatState = ReturnType<typeof beatState>;

/** Hook: song time (seconds) and beat state for the current frame. `offsetSec` shifts the song clock. */
export const useBeat = (beats?: BeatsProp | null, opts: {bpm?: number; offsetSec?: number; songOffset?: number} = {}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const grid = React.useMemo(() => makeBeatGrid(beats, opts.bpm ?? 120, opts.offsetSec ?? 0), [JSON.stringify(beats), opts.bpm, opts.offsetSec]);
  const t = frame / fps + (opts.songOffset ?? 0);
  return {grid, frame, fps, ...beatState(grid, t)};
};

// ------------------------------------------------------------------ lyrics
export type LyricWordIn = {text?: string; w?: string; start: number; end: number; conf?: number; syl?: [number, number][]};
export type LyricLineIn = {text: string; start: number; end: number; words?: LyricWordIn[]};
export type LWord = {text: string; start: number; end: number; conf: number; syl?: [number, number][]; line: number; index: number; gi: number; estimated: boolean};
export type LLine = {i: number; text: string; start: number; end: number; words: LWord[]; estimated: boolean};

const smartQuotes = (s: string) => s.replace(/(^|[\s(])'/g, '$1‘').replace(/'/g, '’').replace(/(^|[\s(])"/g, '$1“').replace(/"/g, '”');
const fold = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

/**
 * Normalise the `lyrics` prop. Lines without word timings get an *estimated* karaoke speed
 * (fill = min(lineDur − 0.1, 0.45 + 0.075·chars), split by character count).
 */
export const normalizeLyrics = (lines: LyricLineIn[] | undefined | null, smart = true): LLine[] => {
  let gi = 0;
  return (lines ?? [])
    .filter((l) => l && typeof l.text === 'string')
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((l, li) => {
      const text = smart ? smartQuotes(l.text) : l.text;
      let words: LWord[];
      const estimated = !l.words || l.words.length === 0;
      if (!estimated) {
        words = l.words!.map((w, wi) => ({
          text: smart ? smartQuotes(w.text ?? w.w ?? '') : w.text ?? w.w ?? '',
          start: w.start,
          end: Math.max(w.start + 0.01, w.end),
          conf: w.conf ?? 1,
          syl: w.syl,
          line: li,
          index: wi,
          gi: 0,
          estimated: false,
        }));
      } else {
        const toks = text.split(/\s+/).filter(Boolean);
        const chars = text.length;
        const dur = Math.max(0.2, Math.min(l.end - l.start - 0.1, 0.45 + 0.075 * chars));
        const weights = toks.map((tk) => tk.length + 1);
        const total = weights.reduce((a, b) => a + b, 0);
        let acc = 0;
        words = toks.map((tk, wi) => {
          const s = l.start + (acc / total) * dur;
          acc += weights[wi];
          const e = l.start + (acc / total) * dur;
          return {text: tk, start: s, end: e, conf: 0.5, line: li, index: wi, gi: 0, estimated: true};
        });
      }
      for (const w of words) w.gi = gi++;
      return {i: li, text, start: l.start, end: l.end, words, estimated};
    });
};

/** Sung progress of a word at t: 0 before start, 1 after end, linear inside (piecewise across syllables). */
export const wordProgress = (w: {start: number; end: number; syl?: [number, number][]}, t: number) => {
  if (t <= w.start) return 0;
  if (t >= w.end) return 1;
  if (w.syl && w.syl.length > 1) {
    const n = w.syl.length;
    for (let i = 0; i < n; i++) {
      const [a, b] = w.syl[i];
      if (t < a) return i / n;
      if (t < b) return (i + (t - a) / Math.max(1e-3, b - a)) / n;
    }
    return 1;
  }
  return (t - w.start) / Math.max(1e-3, w.end - w.start);
};
/** Characters of a line sung at t (counting spaces) for per-glyph wipes. */
export const lineCharProgress = (l: LLine, t: number) => {
  let chars = 0;
  for (const w of l.words) {
    const p = wordProgress(w, t);
    chars += p * w.text.length;
    if (p < 1) break;
    chars += 1;
  }
  return Math.min(chars, l.text.length);
};
export const lineAt = (lines: LLine[], t: number) => lines.find((l) => t >= l.start && t < l.end) ?? null;
export const lastLine = (lines: LLine[], t: number) => {
  let best: LLine | null = null;
  for (const l of lines) if (l.start <= t) best = l;
  return best;
};
export const nextLine = (lines: LLine[], t: number) => lines.find((l) => l.start > t) ?? null;
export const wordAt = (lines: LLine[], t: number) => {
  for (const l of lines) for (const w of l.words) if (t >= w.start && t < w.end) return w;
  return null;
};
/** Lines whose text contains the fragment (case-insensitive, straight or curly quotes). */
export const findLines = (lines: LLine[], fragment: string) => {
  const q = fold(fragment);
  return lines.filter((l) => fold(l.text).includes(q));
};
/** nth line containing the fragment, or null (scenes find their line by content, never by timestamp). */
export const getLine = (lines: LLine[], fragment: string, nth = 0) => findLines(lines, fragment)[nth] ?? null;

/** Lyric-anchored cut: the last beat (or downbeat) at or before the first word of the line (+20 ms tolerance). */
export const cutForLyric = (g: BeatGrid, lines: LLine[], fragment: string, opts: {snap?: 'beat' | 'downbeat' | 'none'; nth?: number} = {}) => {
  const l = getLine(lines, fragment, opts.nth ?? 0);
  if (!l) return null;
  const first = l.words[0]?.start ?? l.start;
  if (opts.snap === 'none') return first;
  return opts.snap === 'downbeat' ? g.downbeatAtOrBefore(first) : g.beatAtOrBefore(first);
};

/** Original placeholder lyrics (no third-party lyric is ever shipped). Replace with your own. */
export const PLACEHOLDER_LINES = [
  'Turn the city lights up one more time',
  'Every heartbeat lands right on the line',
  'Hold the signal, never let it fade',
  'We are louder than the noise we made',
];

/**
 * Time a list of plain lines onto a beat grid: each line starts on a bar line, words fall on eighth notes,
 * the last word is held. Handy when you have lyrics + bpm but no alignment yet.
 */
export const lyricsFromText = (
  lines: string[],
  g: BeatGrid,
  opts: {startBeat?: number; beatsPerLine?: number; wordBeats?: number; holdBeats?: number} = {},
): LyricLineIn[] => {
  const start = opts.startBeat ?? 0;
  const per = opts.beatsPerLine ?? 8;
  const wb = opts.wordBeats ?? 0.5;
  const hold = opts.holdBeats ?? 1.5;
  return lines.map((text, li) => {
    const toks = text.split(/\s+/).filter(Boolean);
    const b0 = start + li * per;
    const words = toks.map((tk, wi) => {
      const sb = b0 + wi * wb;
      const eb = wi === toks.length - 1 ? sb + hold : sb + wb;
      return {text: tk, start: g.timeOfBeat(sb), end: g.timeOfBeat(eb) - 0.02};
    });
    return {text, start: g.timeOfBeat(b0) - 0.05, end: g.timeOfBeat(b0 + per - 0.25), words};
  });
};

/** Resolve `lyrics` (timed lines) or `lines` (plain text) + beats into normalised lyric lines. */
export const resolveLyrics = (g: BeatGrid, lyrics: LyricLineIn[] | undefined, lines: string[] | undefined, opts: {startBeat?: number; beatsPerLine?: number; wordBeats?: number} = {}) =>
  normalizeLyrics(lyrics && lyrics.length ? lyrics : lyricsFromText(lines && lines.length ? lines : PLACEHOLDER_LINES, g, opts));

// ------------------------------------------------------------------ wrappers
/** Render children at a remapped frame: `map(frame) -> frame` (stutters, holds, reverses). */
export const TimeRemap: React.FC<{map: (frame: number) => number; children: React.ReactNode}> = ({map, children}) => {
  const frame = useCurrentFrame();
  return <Freeze frame={Math.max(0, map(frame))}>{children}</Freeze>;
};

/**
 * Beat stutter map: from frame `at`, the preceding `length` frames repeat `repeats` times, then time carries on
 * (shifted back so nothing is skipped). Returns the remapped frame.
 */
export const stutterFrame = (frame: number, at: number, length: number, repeats: number) => {
  if (frame < at || length <= 0 || repeats <= 0) return frame;
  const span = length * repeats;
  if (frame < at + span) return at - length + ((frame - at) % length);
  return frame - span;
};

/**
 * Real shutter motion blur: averages `samples` sub-frame renders spread over `shutter` frames (0..1+) behind the
 * current frame. Children must be pure functions of useCurrentFrame() (all library motions are). Cost × samples.
 */
export const ShutterBlur: React.FC<{samples?: number; shutter?: number; active?: boolean; children: React.ReactNode}> = ({samples = 10, shutter = 0.5, active = true, children}) => {
  const frame = useCurrentFrame();
  const n = Math.max(1, Math.round(samples));
  if (!active || n <= 1 || shutter <= 0) return <>{children}</>;
  return (
    <AbsoluteFill>
      {Array.from({length: n}, (_, i) => {
        // draw oldest first; layer k gets opacity 1/(k+1) so the stack is an equal-weight average
        const f = frame - (shutter * (n - 1 - i)) / Math.max(1, n - 1);
        return (
          <AbsoluteFill key={i} style={{opacity: 1 / (i + 1)}}>
            <Freeze frame={Math.max(0, f)}>{children}</Freeze>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

export type CamMove = 'punch' | 'roll' | 'whip' | 'orbit' | 'push' | 'low' | 'tilt';
export type CamShot = {zoom: number; rot: number; x: number; y: number};

/** The framing a beat camera holds after beat i (seeded pick from the move list). x/y = fractions of the frame. */
export const beatShot = (i: number, moves: CamMove[], intensity = 1, seed = 1): CamShot & {move: CamMove} => {
  if (i < 0 || !moves.length) return {zoom: 1, rot: 0, x: 0, y: 0, move: moves[0] ?? 'punch'};
  const m = moves[Math.floor(hash(i, seed) * moves.length) % moves.length];
  const s = hash(i, seed, 7) < 0.5 ? -1 : 1;
  const r = hash(i, seed, 13);
  const k = intensity;
  switch (m) {
    case 'punch':
      return {zoom: 1 + (0.12 + 0.12 * r) * k, rot: 0, x: s * 0.03 * k, y: -0.02 * k, move: m};
    case 'roll':
      return {zoom: 1 + 0.1 * k, rot: s * (0.05 + 0.04 * r) * k, x: 0, y: 0, move: m};
    case 'whip':
      return {zoom: 1 + 0.16 * k, rot: s * 0.02 * k, x: s * (0.08 + 0.05 * r) * k, y: 0, move: m};
    case 'orbit':
      return {zoom: 1 + 0.06 * k, rot: s * 0.08 * k, x: -s * 0.04 * k, y: 0.02 * k, move: m};
    case 'push':
      return {zoom: 1 + (0.25 + 0.15 * r) * k, rot: 0, x: 0, y: 0, move: m};
    case 'low':
      return {zoom: 1 + 0.14 * k, rot: s * 0.03 * k, x: 0, y: 0.06 * k, move: m};
    case 'tilt':
    default:
      return {zoom: 1 + 0.08 * k, rot: s * 0.12 * k, x: 0, y: 0, move: m};
  }
};

/**
 * Beat camera transform at song time t: snaps to a new framing on every beat (or downbeat / bar), each change caught by
 * a damped spring; kicks add a +4 % punch, shake keyed to the frame index; settles to rest at `settleAt`.
 */
export const beatCameraAt = (
  g: BeatGrid,
  t: number,
  o: {moves?: CamMove[]; on?: 'beat' | 'downbeat' | 'bar2'; intensity?: number; punch?: number; shake?: number; seed?: number; fps?: number; settleAt?: number; startBeat?: number} = {},
) => {
  const moves = o.moves ?? ['punch', 'roll', 'whip', 'orbit', 'push'];
  const per = o.on === 'downbeat' ? g.beatsPerBar : o.on === 'bar2' ? g.beatsPerBar * 2 : 1;
  const b = g.beatAt(t) / per;
  const i = Math.floor(b) - Math.floor((o.startBeat ?? 0) / per);
  const tKey = g.timeOfBeat(Math.floor(b) * per);
  const prev = beatShot(i - 1, moves, o.intensity ?? 1, o.seed ?? 1);
  const cur = beatShot(i, moves, o.intensity ?? 1, o.seed ?? 1);
  const k = springStep(t - tKey, cur.move === 'whip' ? 5 : 4, 0.35);
  let shot: CamShot = {zoom: lerpN(prev.zoom, cur.zoom, k), rot: lerpN(prev.rot, cur.rot, k), x: lerpN(prev.x, cur.x, k), y: lerpN(prev.y, cur.y, k)};
  const kick = g.hit('kick', t, 0.08);
  shot.zoom *= 1 + (o.punch ?? 0.04) * kick;
  const fi = Math.round(t * (o.fps ?? 30));
  const sh = (o.shake ?? 6) * pulseHL(t, tKey, 0.05);
  shot.x += ((hash(fi, 3) - 0.5) * sh) / 1000;
  shot.y += ((hash(fi, 5) - 0.5) * sh) / 1000;
  // whip: speed during the first 30 % of the spring
  const whip = cur.move === 'whip' ? Math.max(0, 1 - (t - tKey) / 0.12) : 0;
  if (o.settleAt !== undefined) {
    const s = smooth(o.settleAt - 0.4, o.settleAt, t);
    shot = {zoom: lerpN(shot.zoom, 1, s), rot: lerpN(shot.rot, 0, s), x: lerpN(shot.x, 0, s), y: lerpN(shot.y, 0, s)};
  }
  return {...shot, whip, move: cur.move, index: i};
};

/** Wraps any children in a beat-driven camera transform (scale/rotate/translate about the centre). */
export const BeatCamera: React.FC<{
  beats?: BeatsProp;
  moves?: CamMove[];
  on?: 'beat' | 'downbeat' | 'bar2';
  intensity?: number;
  punch?: number;
  shake?: number;
  seed?: number;
  /** extra oversize so frame edges never show */
  overscan?: number;
  children: React.ReactNode;
}> = ({beats, moves, on, intensity = 1, punch = 0.04, shake = 6, seed = 1, overscan = 1.06, children}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const g = React.useMemo(() => makeBeatGrid(beats), [JSON.stringify(beats)]);
  const c = beatCameraAt(g, frame / fps, {moves, on, intensity, punch, shake, seed, fps, settleAt: durationInFrames / fps});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${-c.x * width}px, ${-c.y * height}px) rotate(${c.rot}rad) scale(${c.zoom * overscan})`,
          transformOrigin: '50% 50%',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ small shared drawing bits
/** Fine treatise grain + vignette over a frame. */
export const TreatiseFinish: React.FC<{grain?: number; vignette?: number; seedEvery?: number}> = ({grain = 0.07, vignette = 0.35, seedEvery = 2}) => {
  const frame = useCurrentFrame();
  const {width: w, height: h} = useVideoConfig();
  const seed = Math.floor(frame / seedEvery) % 89;
  const id = `r2grain${seed}`;
  return (
    <>
      <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,${vignette}) 100%)`}} />
      {grain > 0 ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: grain, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
          <filter id={id}>
            <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={seed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={w} height={h} filter={`url(#${id})`} />
        </svg>
      ) : null}
    </>
  );
};

/** Corner crop marks (the treatise "plate" frame). */
export const CropMarks: React.FC<{w: number; h: number; inset: number; len: number; color: string; sw?: number; splay?: number}> = ({w, h, inset, len, color, sw = 1.2, splay = 0}) => {
  const c = [
    [inset, inset, 1, 1],
    [w - inset, inset, -1, 1],
    [inset, h - inset, 1, -1],
    [w - inset, h - inset, -1, -1],
  ];
  return (
    <g stroke={color} strokeWidth={sw} fill="none">
      {c.map(([x, y, sx, sy], i) => {
        const ox = -sx * splay;
        const oy = -sy * splay;
        return <path key={i} d={`M${x + ox + sx * len} ${y + oy} L${x + ox} ${y + oy} L${x + ox} ${y + oy + sy * len}`} />;
      })}
    </g>
  );
};

/** Format seconds as a timecode HH:MM:SS:FF. */
export const timecode = (sec: number, fps = 30) => {
  const f = Math.max(0, Math.floor(sec * fps));
  const ff = f % fps;
  const s = Math.floor(f / fps);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
};

/** Shared prop docs for beat/lyric-aware motions. */
export const MUSIC_PROP_DOCS = {
  bpm: 'tempo used when `beats` has no beat list',
  offsetSec: 'time of the first beat in seconds (aligns the grid to your song)',
  beats: 'beat data: {bpm, offsetSec, beatsPerBar} or a list of beat times (s), or a full analysis {beats, downbeats, sections, onsets:{kick,snare,hat:[[t,strength]]}}',
  lyrics: 'timed lyrics: [{text, start, end, words?: [{text, start, end, syl?:[[a,b]]}]}] in seconds; words without times are estimated',
  lines: 'plain lyric lines (used when `lyrics` is empty): timed onto the beat grid, words on eighth notes',
} as const;
