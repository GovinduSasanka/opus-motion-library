// Adapted from pdoom-video/app/src/scenes/hook.ts (slam/retrig/punch logic) + docs/TREATMENT.md "HOOK ×4" (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  BeatsProp,
  E,
  MUSIC_PROP_DOCS,
  TREATISE,
  TreatiseFinish,
  clamp01,
  hash,
  plexMono,
  pulseHL,
  useGrid,
  vf,
} from '../../core/r2-music-kit';

type Props = {
  words: string[];
  variant: number;
  everyBeats: number;
  startBeat: number;
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  ink: string;
  field: string;
  accent: string;
  guides: boolean;
  invertFrames: number;
  shake: number;
  finale: {value: number; from: number; decimals: number} | null;
};

const WordSlamHook: React.FC<Props> = ({words, variant, everyBeats, startBeat, bpm, offsetSec, beats, ink, field, accent, guides, invertFrames, shake, finale}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const t = frame / fps;
  const v = Math.max(1, Math.min(4, Math.round(variant)));
  const per = Math.max(0.5, everyBeats);
  const list = words.length ? words : ['EVERY', 'WORD', 'LANDS', 'ON', 'THE', 'BEAT'];
  const bRaw = (g.beatAt(t) - startBeat) / per;
  const idx = Math.max(0, Math.min(list.length - 1, Math.floor(bRaw)));
  const tSlam = idx === 0 ? Math.min(0.1, g.timeOfBeat(startBeat)) : g.timeOfBeat(startBeat + idx * per);
  const age = Math.max(0, t - tSlam);
  const started = t >= tSlam - 0.0001 || bRaw >= 0;
  const word = list[idx];
  const isFinale = finale && idx === list.length - 1;
  // breakdown variant: slower, hairline, tiny
  const breakdown = v === 3;
  // escalation colours
  const bg = v === 2 ? accent : v === 4 ? (Math.floor(g.beatAt(t) * 2) % 3 === 0 ? TREATISE.ink : Math.floor(g.beatAt(t) * 2) % 3 === 1 ? accent : TREATISE.bone) : field;
  const fg = v === 2 ? TREATISE.ink : v === 4 ? (bg === TREATISE.bone ? TREATISE.ink : TREATISE.bone) : ink;
  // slam scale: hold·(1 + amt·(1 − outExpo(age/0.16))), held words creep
  const amt = (v >= 4 ? 0.28 : v === 2 ? 0.18 : 0.14) * (breakdown ? 0.4 : 1);
  const hold = 1 + 0.035 * age;
  const scale = hold * (1 + amt * (1 - E.outExpo(clamp01(age / 0.16))));
  // re-slam every beat on held words in the maximal variant
  const reslam = v === 4 ? 0.06 * pulseHL(t, g.nearestBeat(t) <= t ? g.beatAtOrBefore(t) : 0, 0.07) : 0;
  const shakeAmp = shake * pulseHL(t, tSlam, 0.05) * u * (breakdown ? 0.3 : 1);
  const fi = Math.round(t * fps);
  const sx = (hash(fi, 3) - 0.5) * 2 * shakeAmp;
  const sy = (hash(fi, 7) - 0.5) * 2 * shakeAmp;
  const punch = 1 + 0.04 * pulseHL(t, tSlam, 0.08);
  const invert = age < invertFrames / fps && idx >= 0 && started && age >= 0;
  // finale number roll
  let display = word;
  if (isFinale && finale) {
    const k = E.outExpo(clamp01(age / 0.9));
    const val = finale.from + (finale.value - finale.from) * k + 0.2 * (finale.value - finale.from) * 0.035 * age * (age > 0.9 ? 1 : 0);
    display = val.toFixed(finale.decimals);
  }
  const chars = Math.max(2, display.length);
  const fsBase = Math.min(h * (breakdown ? 0.12 : 0.62), ((w - 150 * u) / chars) * (breakdown ? 0.6 : 1.55));
  const mono = 13 * u * (portrait ? 1.25 : 1);
  const capY = h / 2 - fsBase * 0.36;
  const baseY = h / 2 + fsBase * 0.36;
  const rising = /UP|RISE|HIGH|MORE/i.test(word) ? -age * h * 0.03 : 0;
  const echoN = v === 4 ? 3 : 0;
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${punch + reslam})`}}>
        {guides && !breakdown ? (
          <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
            {[capY, baseY].map((y, i) => (
              <g key={i}>
                <line x1={0} x2={w} y1={y} y2={y} stroke={fg} strokeOpacity={0.35} strokeWidth={Math.max(1, u)} />
                <text x={w * 0.025} y={y - 6 * u} fontFamily={plexMono} fontSize={mono} fill={fg} opacity={0.6} letterSpacing={1}>
                  {i === 0 ? `cap-height · ${(0.7 + 0.01 * idx).toFixed(3)} em` : 'baseline'}
                </text>
              </g>
            ))}
            <line x1={w / 2} x2={w / 2} y1={h * 0.06} y2={h * 0.12} stroke={fg} strokeOpacity={0.3} strokeWidth={Math.max(1, u)} />
            <text x={w * 0.975} y={h * 0.075} textAnchor="end" fontFamily={plexMono} fontSize={mono} fill={fg} opacity={0.6} letterSpacing={1}>
              {`HOOK ${String(v).padStart(2, '0')} · WORD ${String(idx + 1).padStart(2, '0')}/${String(list.length).padStart(2, '0')}`}
            </text>
          </svg>
        ) : null}
        {started ? (
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{position: 'relative', transform: `translateY(${rising}px) scale(${scale})`}}>
              {Array.from({length: echoN}, (_, e) => (
                <div
                  key={e}
                  style={{
                    ...vf(80, 900),
                    position: 'absolute',
                    inset: 0,
                    fontSize: fsBase,
                    lineHeight: 1,
                    color: 'transparent',
                    WebkitTextStroke: `${Math.max(1, 1.2 * u)}px ${fg}`,
                    opacity: 0.35 - e * 0.1,
                    transform: `scale(${1 + (e + 1) * 0.07 * pulseHL(t, g.beatAtOrBefore(t), 0.14)})`,
                    textAlign: 'center',
                    whiteSpace: 'pre',
                  }}
                >
                  {display}
                </div>
              ))}
              <div
                style={{
                  ...vf(breakdown ? 110 : 80, breakdown ? 200 : 900),
                  fontSize: fsBase,
                  lineHeight: 1,
                  color: isFinale ? accent === bg ? fg : accent : fg,
                  letterSpacing: breakdown ? '0.25em' : '-0.01em',
                  whiteSpace: 'pre',
                  textAlign: 'center',
                }}
              >
                {display}
              </div>
            </div>
          </div>
        ) : null}
        {breakdown ? (
          <div style={{position: 'absolute', left: w * 0.05, bottom: h * 0.08, fontFamily: plexMono, fontSize: mono, color: fg, opacity: 0.5, letterSpacing: 2}}>
            {`· · · ${display ? display.toLowerCase() : ''}`}
          </div>
        ) : null}
      </AbsoluteFill>
      {invert ? <AbsoluteFill style={{background: TREATISE.bone, mixBlendMode: 'difference'}} /> : null}
      <TreatiseFinish grain={0.06} vignette={0.32} />
    </AbsoluteFill>
  );
};

export const wordSlamHook = defineMotion<Props>({
  id: 'word-slam-hook',
  title: 'Word slam hook (one word per beat)',
  category: 'music',
  description:
    'A hook phrase plays one giant word per beat: each word slams in full-frame in heavy variable grotesk over type-specimen guides (baseline / cap-height hairlines, deadpan mono labels), with a two-frame invert flash, screen shake and punch zoom on every hit; four escalation variants up to a strobing maximal pass, and the last word can roll into a giant number.',
  source: ['pdoom-video app/src/scenes/hook.ts slam/retrig/punch (MIT): scale hold·(1+amt·(1−outExpo(t/0.16))), creep 1+0.035·t, shake hl 0.05 s'],
  useFor: 'Chorus hooks, promo taglines, sports and hype edits — the “one word per beat” staple; set `variant` 1→4 to escalate each repeat.',
  durationInFrames: 180,
  defaultProps: {
    words: ['TURN', 'IT', 'UP', 'ONE', 'MORE', 'TIME'],
    variant: 1,
    everyBeats: 1,
    startBeat: 0,
    bpm: 120,
    offsetSec: 0.15,
    beats: {},
    ink: TREATISE.bone,
    field: TREATISE.ink,
    accent: TREATISE.signal,
    guides: true,
    invertFrames: 2,
    shake: 14,
    finale: null,
  },
  propDocs: {
    words: 'the hook, one entry per slam',
    variant: '1 clean bone-on-ink · 2 ink-on-orange, heavier · 3 breakdown (hairline, tiny, slow) · 4 maximal (strobing field, echo outlines, re-slams every beat)',
    everyBeats: 'beats per word (1 = every beat, 2 = every other)',
    startBeat: 'beat index of the first slam',
    ...MUSIC_PROP_DOCS,
    ink: 'type colour',
    field: 'background colour',
    accent: 'signal colour (finale number, variant 2 field)',
    guides: 'type-specimen hairlines + mono labels',
    invertFrames: 'frames of inverted flash on each slam (0 = off)',
    shake: 'screen shake in px per slam',
    finale: 'roll the last word into a number: {value, from, decimals} or null',
  },
  component: WordSlamHook,
  tags: ['word slam', 'hook', 'one word per beat', 'kinetic typography', 'hype', 'chorus', 'music', 'beat', 'slam', 'type specimen', 'variable font', 'promo', 'treatise', 'strobe'],
});
