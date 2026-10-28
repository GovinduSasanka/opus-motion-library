// Adapted from pdoom-video/app/src/scenes/prompt.ts + prompt-data.ts (shots, candidate flicker, token kicks) (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
// All candidate text here is original placeholder copy.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  BeatsProp,
  E,
  LyricLineIn,
  MUSIC_PROP_DOCS,
  TREATISE,
  TreatiseFinish,
  clamp01,
  hash,
  lerpN,
  plexMono,
  pulseHL,
  resolveLyrics,
  springStep,
  useGrid,
} from '../../core/r2-music-kit';

type TokenIn = {text: string; at?: number; dist?: [string, number][]; pick?: number};
type Props = {
  text: string;
  tokens: TokenIn[];
  lyrics: LyricLineIn[];
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  tokensPerBeat: number;
  background: string;
  ink: string;
  dim: string;
  accent: string;
  backdrop: 'void' | 'rings';
  camera: boolean;
  enterKey: boolean;
  seed: number;
  promptLabel: string;
  nextTokenLabel: string;
};

const FILLER: [string, number][][] = [
  [['maybe', 0.31], ['perhaps', 0.24], ['possibly', 0.18], ['never', 0.09]],
  [['the', 0.42], ['a', 0.21], ['this', 0.12], ['that', 0.08]],
  [['music', 0.36], ['noise', 0.22], ['silence', 0.14], ['weather', 0.07]],
  [['louder', 0.4], ['brighter', 0.19], ['smaller', 0.12], ['sideways', 0.05]],
];

const TokenSamplerPrompt: React.FC<Props> = ({text, tokens, lyrics, bpm, offsetSec, beats, tokensPerBeat, background, ink, dim, accent, backdrop, camera, enterKey, seed, promptLabel = 'PROMPT', nextTokenLabel = 'NEXT TOKEN'}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const t = frame / fps;
  // resolve the token stream: explicit tokens > lyric words > text split on the beat grid
  const stream = React.useMemo(() => {
    let base: {text: string; at: number}[];
    if (tokens.length) {
      base = tokens.map((tk, i) => ({text: tk.text, at: tk.at ?? g.timeOfBeat(1 + i / Math.max(0.25, tokensPerBeat))}));
    } else if (lyrics.length) {
      base = resolveLyrics(g, lyrics, undefined).flatMap((l) => l.words.map((wd) => ({text: wd.text, at: wd.start})));
    } else {
      const toks = (text || 'turn the city lights up one more time').split(/\s+/).filter(Boolean);
      base = toks.map((tk, i) => ({text: tk, at: g.timeOfBeat(1 + i / Math.max(0.25, tokensPerBeat))}));
    }
    return base.map((b, i) => {
      const given = tokens[i];
      const dist = given?.dist?.length ? given.dist : FILLER[Math.floor(hash(i, seed) * FILLER.length) % FILLER.length];
      const list: [string, number][] = [...dist];
      const pick = given?.pick ?? Math.min(list.length, Math.floor(hash(i, seed, 5) * (list.length + 1)));
      if (pick >= list.length || list[pick][0] !== b.text) {
        const p = Math.max(...list.map(([, q]) => q)) + 0.07;
        list.splice(Math.min(pick, list.length), 0, [b.text, Math.min(0.97, p)]);
      }
      const pickIdx = list.findIndex(([s]) => s === b.text);
      return {...b, dist: list.slice(0, 5), pick: pickIdx < 0 ? 0 : pickIdx, id: 1200 + Math.floor(hash(i, seed, 9) * 90000)};
    });
  }, [JSON.stringify(tokens), JSON.stringify(lyrics), text, g, tokensPerBeat, seed]);
  const typedN = stream.filter((s) => t >= s.at).length;
  const next = stream[typedN] ?? null;
  const last = stream[typedN - 1] ?? null;
  const done = typedN >= stream.length;
  const enterT = done && stream.length ? g.nearestDownbeat(stream[stream.length - 1].at + g.period * 2) : Infinity;
  const entered = enterKey && t >= enterT;
  // layout
  const P = portrait ? 1.3 : 1;
  const fs = 30 * u * P;
  const fieldW = w * (portrait ? 0.86 : 0.7);
  const fieldX = (w - fieldW) / 2;
  const fieldY = h * 0.55;
  const pad = fs * 0.6;
  const typed = stream.slice(0, typedN).map((s) => s.text).join(' ');
  const caretOn = Math.floor(t * 2.4) % 2 === 0 || (next && next.at - t < 0.3);
  const charW = fs * 0.6;
  const maxChars = Math.floor((fieldW - pad * 2) / charW) - 1;
  const show = typed.length > maxChars ? '…' + typed.slice(typed.length - maxChars + 1) : typed;
  const caretX = fieldX + pad + show.length * charW;
  // candidate panel: flickers in ~0.16 s before each token; sampled one lights orange at s.at
  const ant = 0.26;
  const panelFor = next && next.at - t < ant ? next : last && t - last.at < 0.22 ? last : null;
  const panelK = panelFor ? (panelFor === next ? clamp01((t - (next!.at - ant)) / 0.07) : 1 - clamp01((t - last!.at - 0.12) / 0.1)) : 0;
  // camera shots: re-frame between caret, text and field; each token kicks it
  const shotLen = g.period * 2;
  const shotI = Math.floor(Math.max(0, t) / shotLen);
  const shotK = springStep(t - shotI * shotLen, 3.5, 0.45);
  const prevShot = shotTarget(shotI - 1);
  const curShot = shotTarget(shotI);
  function shotTarget(i: number): {zoom: number; fx: number; fy: number; roll: number} {
    if (i < 0) return {zoom: 1.05, fx: 0.5, fy: 0.55, roll: 0};
    const r = hash(i, seed, 21);
    const kind = Math.floor(hash(i, seed, 33) * 3);
    if (!camera) return {zoom: 1, fx: 0.5, fy: 0.5, roll: 0};
    if (kind === 0) return {zoom: portrait ? 1.3 + 0.2 * r : 2.1 + 0.6 * r, fx: clamp01(caretX / w), fy: fieldY / h + 0.02, roll: (r - 0.5) * 0.05};
    if (kind === 1) return {zoom: portrait ? 1.2 + 0.15 * r : 1.5 + 0.4 * r, fx: 0.42 + 0.1 * r, fy: fieldY / h - 0.06, roll: (r - 0.5) * 0.04};
    return {zoom: 1.12 + 0.12 * r, fx: 0.5, fy: 0.52, roll: (r - 0.5) * 0.03};
  }
  const kick = last ? 0.02 * pulseHL(t, last.at, 0.07) : 0;
  const zoom = (lerpN(prevShot.zoom, curShot.zoom, shotK) + kick) * (entered ? 1 + 2.5 * E.inExpo(clamp01((t - enterT) / 0.5)) : 1);
  const fx = lerpN(prevShot.fx, curShot.fx, shotK) * w;
  const fy = lerpN(prevShot.fy, curShot.fy, shotK) * h;
  const roll = lerpN(prevShot.roll, curShot.roll, shotK);
  const flash = entered && t - enterT < 2 / fps;
  const mono = 13 * u * (portrait ? 2 : 1);
  const clear = background === 'transparent';
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom}) rotate(${roll}rad)`, transformOrigin: `${fx}px ${fy}px`, opacity: entered ? 1 - E.inCubic(clamp01((t - enterT) / 0.55)) : 1}}>
        {backdrop === 'rings' ? (
          <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
            {Array.from({length: 9}, (_, i) => {
              const k = i / 9 + (t * 0.05 % (1 / 9));
              const r = Math.max(w, h) * (0.08 + k * 0.75);
              return <circle key={i} cx={w / 2} cy={fieldY} r={r} fill="none" stroke={dim} strokeOpacity={0.3 * (1 - k) + 0.12 * g.hit('kick', t)} strokeWidth={Math.max(1, u)} />;
            })}
          </svg>
        ) : null}
        {/* prompt field */}
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <rect x={fieldX} y={fieldY - fs * 1.15} width={fieldW} height={fs * 2.1} fill={TREATISE.panel} stroke={dim} strokeWidth={Math.max(1, u)} />
          <text x={fieldX} y={fieldY - fs * 1.5} fontFamily={plexMono} fontSize={mono} fill={dim} letterSpacing={2}>
            {promptLabel}
          </text>
          <text x={fieldX + fieldW} y={fieldY - fs * 1.5} textAnchor="end" fontFamily={plexMono} fontSize={mono} fill={dim} letterSpacing={1}>
            {`T ${(0.7).toFixed(1)} · TOKENS ${String(typedN).padStart(3, '0')}/${String(stream.length).padStart(3, '0')}`}
          </text>
          <text x={fieldX + pad} y={fieldY + fs * 0.35} fontFamily={plexMono} fontSize={fs} fill={ink} style={{whiteSpace: 'pre'}} textLength={show.length ? show.length * charW : undefined}>
            {show}
          </text>
          {last && t - last.at < 0.25 ? (
            <text x={caretX - (last.text.length + 1) * charW} y={fieldY + fs * 0.35} fontFamily={plexMono} fontSize={fs} fill={accent} opacity={1 - (t - last.at) / 0.25} style={{whiteSpace: 'pre'}} textLength={last.text.length * charW}>
              {last.text}
            </text>
          ) : null}
          {caretOn && !entered ? <rect x={caretX + charW * 0.3} y={fieldY - fs * 0.72} width={charW * 0.55} height={fs * 1.3} fill={accent} /> : null}
          {/* enter key */}
          {enterKey ? (
            <g opacity={done ? 1 : 0.35} transform={`translate(${fieldX + fieldW - fs * 1.6} ${fieldY + fs * 1.6})`}>
              <rect width={fs * 1.3} height={fs * 1.05} rx={4 * u} fill={done && Math.floor(g.beatAt(t)) % 2 === 0 ? accent : 'none'} stroke={done ? accent : dim} strokeWidth={Math.max(1, 1.2 * u)} />
              <text x={fs * 0.65} y={fs * 0.68} textAnchor="middle" fontFamily={plexMono} fontSize={fs * 0.55} fill={done ? ink : dim}>
                ⏎
              </text>
            </g>
          ) : null}
          {/* candidate distribution */}
          {panelFor && panelK > 0.01
            ? (() => {
                const rows = panelFor.dist;
                const py = fieldY - fs * 1.7 - rows.length * mono * 1.9;
                const px = Math.min(Math.max(fieldX + pad, caretX - fieldW * 0.1), fieldX + fieldW - 260 * u * P);
                const flick = Math.floor(t * 30) % 3 === 0 && panelFor === next;
                const sampled = panelFor === last || (next && next.at - t < 0.045);
                return (
                  <g opacity={panelK * (flick ? 0.75 : 1)}>
                    <text x={px} y={py - mono} fontFamily={plexMono} fontSize={mono * 0.85} fill={dim} letterSpacing={1}>
                      {`${nextTokenLabel} · id ${panelFor.id}`}
                    </text>
                    {rows.map(([s, p], i) => {
                      const y = py + i * mono * 1.9;
                      const on = sampled && i === panelFor.pick;
                      return (
                        <g key={i}>
                          <rect x={px} y={y} width={120 * u * P * p * 2.2} height={mono * 1.2} fill={on ? accent : dim} opacity={on ? 0.9 : 0.35} />
                          <text x={px + 126 * u * P * 2.2 * 0.35 + 8 * u} y={y + mono} fontFamily={plexMono} fontSize={mono} fill={on ? accent : ink} opacity={on ? 1 : 0.75}>
                            {`${s}  ${(p * 100).toFixed(0)}%`}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()
            : null}
        </svg>
      </AbsoluteFill>
      {flash ? <AbsoluteFill style={{background: TREATISE.bone}} /> : null}
      {!clear ? <TreatiseFinish grain={0.06} vignette={0.38} /> : null}
    </AbsoluteFill>
  );
};

export const tokenSamplerPrompt = defineMotion<Props>({
  id: 'token-sampler-prompt',
  title: 'Token sampler prompt (LLM typing)',
  category: 'music',
  description:
    'A thin prompt field in a dark void types a phrase token by token on the beat (or on sung-word starts): just before each token a tiny next-token distribution flickers above the caret and the sampled candidate lights orange, the camera re-frames between caret, text and field with a hair of kick per token, and ⏎ fires a flash-zoom on the closing downbeat.',
  source: ['pdoom-video app/src/scenes/prompt.ts + prompt-data.ts (MIT): candidate flicker ~0.16 s ahead, camera zoom 1.25–2.7 with ±0.03 rad roll'],
  useFor: 'AI-product videos, “how an LLM picks the next word” explainers, prompt demos; feed `lyrics` to type exactly on the vocal.',
  durationInFrames: 210,
  defaultProps: {
    text: 'turn the city lights up one more time',
    tokens: [],
    lyrics: [],
    bpm: 120,
    offsetSec: 0.4,
    beats: {},
    tokensPerBeat: 1,
    background: TREATISE.ink,
    ink: TREATISE.bone,
    dim: TREATISE.dim,
    accent: TREATISE.signal,
    backdrop: 'rings',
    camera: true,
    enterKey: true,
    seed: 3,
    promptLabel: 'PROMPT',
    nextTokenLabel: 'NEXT TOKEN',
  },
  propDocs: {
    text: 'the phrase to type (split on spaces, timed to the beat) when `tokens`/`lyrics` are empty',
    tokens: 'explicit stream [{text, at?: seconds, dist?: [[candidate, p]], pick?}] — give real distributions (and jokes) here',
    ...MUSIC_PROP_DOCS,
    tokensPerBeat: 'typing speed when timing from the grid',
    background: "frame colour or 'transparent'",
    ink: 'typed-text colour',
    dim: 'field / idle-candidate colour',
    accent: 'sampled token + caret colour',
    backdrop: "'void' (plain) or 'rings' (tunnel rings pulling in behind)",
    camera: 'beat-cut camera reframes between caret, text and field',
    enterKey: 'show ⏎ and fire the flash-zoom exit on the downbeat after the last token',
    seed: 'placeholder-distribution and shot variety',
    promptLabel: 'small caps label above the prompt field',
    nextTokenLabel: 'heading of the candidate-token panel (" · id N" follows)',
  },
  component: TokenSamplerPrompt,
  tags: ['llm', 'token', 'sampling', 'prompt', 'ai', 'typing', 'next token', 'probability', 'caret', 'terminal', 'beat', 'music', 'explainer', 'treatise'],
});
