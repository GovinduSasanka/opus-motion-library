// Adapted from pdoom-video/app/src/engine/audio.ts (beatAt/barAt/hit/section) (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BeatsProp, MUSIC_PROP_DOCS, Section, TREATISE, TreatiseFinish, beatState, clamp01, plexMono, useGrid, vf} from '../../core/r2-music-kit';

type Props = {
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  sections: Section[];
  background: string;
  ink: string;
  accent: string;
  window: number;
  lanes: boolean;
};

const BeatGridMotion: React.FC<Props> = ({bpm, offsetSec, beats, sections, background, ink, accent, window: win, lanes}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const g0 = useGrid(beats, bpm, offsetSec);
  const g = React.useMemo(() => (g0.sections.length || !sections.length ? g0 : {...g0, sections, section: (t: number) => sections.find((s) => t >= s.start && t < s.end) ?? null}), [g0, JSON.stringify(sections)]);
  const t = frame / fps;
  const b = beatState(g, t);
  const clear = background === 'transparent';
  const intro = clamp01(frame / 14);
  const P = portrait ? 1.25 : 1;
  const mono = 15 * u * P;
  // ---- readout
  const rx = w * 0.07;
  const ry = h * (portrait ? 0.14 : 0.2);
  const big = Math.min(190 * u * P, w * 0.3);
  // ---- bar squares
  const bpb = g.beatsPerBar;
  const sqSize = Math.min((portrait ? w * 0.8 : w * 0.38) / bpb, 120 * u * P);
  const sqX0 = portrait ? (w - sqSize * bpb) / 2 : w * 0.56;
  const sqY = portrait ? h * 0.36 : h * 0.16;
  // ---- ruler
  const rulY = portrait ? h * 0.6 : h * 0.6;
  const x0 = w * 0.06;
  const x1 = w * 0.94;
  const play = x0 + (x1 - x0) * 0.3;
  const pxPerSec = (x1 - x0) / win;
  const X = (tt: number) => play + (tt - t) * pxPerSec;
  const tA = t - win * 0.3;
  const tB = t + win * 0.7;
  const beatsIn: number[] = [];
  for (let i = Math.ceil(g.beatAt(tA) * 2) / 2; ; i += 0.5) {
    const tt = g.timeOfBeat(i);
    if (tt > tB || beatsIn.length > 400) break;
    beatsIn.push(i);
  }
  const laneH = 34 * u * P;
  const laneKinds = ['kick', 'snare', 'hat'];
  const secColors = [TREATISE.dim, accent, TREATISE.mid, TREATISE.hot];
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      <Svg>
        <g opacity={intro}>
          {/* BPM readout */}
          <text x={rx} y={ry + big * 0.78} style={vf(85, 900)} fontSize={big} fill={ink} letterSpacing={-big * 0.02}>
            {Math.round(g.bpm)}
          </text>
          <text x={rx + big * 0.04} y={ry + big * 1.08} fontFamily={plexMono} fontSize={mono * 1.4} fill={accent} letterSpacing={3}>
            {`BPM · ${bpb}/4`}
          </text>
          <text x={rx + big * 0.04} y={ry + big * 1.08 + mono * 2} fontFamily={plexMono} fontSize={mono} fill={ink} opacity={0.6} letterSpacing={2}>
            {`BAR ${String(Math.max(0, b.barIndex) + 1).padStart(3, '0')} · BEAT ${b.beatInBar + 1} · ${(b.beatPhase * 100).toFixed(0).padStart(2, '0')}%`}
          </text>
          <text x={rx + big * 0.04} y={ry + big * 1.08 + mono * 3.6} fontFamily={plexMono} fontSize={mono} fill={ink} opacity={0.6} letterSpacing={2}>
            {`SECTION · ${(b.section?.name ?? '—').toUpperCase()}`}
          </text>
          {/* bar squares */}
          {Array.from({length: bpb}, (_, i) => {
            const on = b.beatInBar === i && b.beat >= 0;
            const k = on ? b.pulse : 0;
            const s = sqSize * 0.84 * (1 + 0.08 * k);
            const cx = sqX0 + sqSize * (i + 0.5);
            const cy = sqY + sqSize / 2;
            return (
              <g key={i}>
                <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} fill={on ? accent : 'none'} fillOpacity={0.25 + 0.75 * k} stroke={i === 0 ? ink : TREATISE.dim} strokeWidth={Math.max(1, (i === 0 ? 2 : 1.2) * u)} />
                <text x={cx} y={cy + s / 2 + mono * 1.6} textAnchor="middle" fontFamily={plexMono} fontSize={mono} fill={ink} opacity={on ? 1 : 0.4}>
                  {i + 1}
                </text>
              </g>
            );
          })}
          {/* phase dial */}
          {(() => {
            const cx = portrait ? w * 0.8 : sqX0 + sqSize * bpb + sqSize * 0.9;
            const cy = portrait ? h * 0.2 : sqY + sqSize / 2;
            const r = sqSize * (portrait ? 0.7 : 0.5);
            const arc = (rr: number, p: number) => {
              const a = -Math.PI / 2 + p * Math.PI * 2;
              const large = p > 0.5 ? 1 : 0;
              return `M${cx} ${cy - rr} A${rr} ${rr} 0 ${large} 1 ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
            };
            return (
              <g>
                <circle cx={cx} cy={cy} r={r * (1 + 0.12 * b.kick)} fill={accent} opacity={0.12 + 0.3 * b.kick} />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={TREATISE.dim} strokeWidth={Math.max(1, u)} />
                <path d={arc(r, Math.min(0.999, b.barPhase))} fill="none" stroke={ink} strokeWidth={Math.max(1.5, 3 * u)} />
                <path d={arc(r * 0.72, Math.min(0.999, b.beatPhase))} fill="none" stroke={accent} strokeWidth={Math.max(1.5, 4 * u)} />
              </g>
            );
          })()}
          {/* ruler */}
          <line x1={x0} x2={x1} y1={rulY} y2={rulY} stroke={TREATISE.dim} strokeWidth={Math.max(1, u)} />
          {beatsIn.map((bi) => {
            const tt = g.timeOfBeat(bi);
            const x = X(tt);
            if (x < x0 || x > x1) return null;
            const eighth = bi % 1 !== 0;
            const down = !eighth && ((Math.round(bi) % bpb) + bpb) % bpb === 0;
            const hh = (eighth ? 8 : down ? 30 : 16) * u * P;
            const near = Math.exp(-Math.abs(t - tt) * 14);
            return (
              <g key={bi}>
                <line x1={x} x2={x} y1={rulY - hh} y2={rulY} stroke={tt <= t ? (near > 0.2 ? accent : ink) : TREATISE.mid} strokeWidth={Math.max(1, (down ? 2.2 : 1.2) * u)} opacity={tt <= t ? 0.95 : 0.45} />
                {down ? (
                  <text x={x + 4 * u} y={rulY - hh + mono * 0.8} fontFamily={plexMono} fontSize={mono * 0.75} fill={ink} opacity={0.5}>
                    {Math.round(bi / bpb) + 1}
                  </text>
                ) : null}
              </g>
            );
          })}
          {/* sections lane */}
          {g.sections.map((s, i) => {
            const a = Math.max(x0, X(s.start));
            const z = Math.min(x1, X(s.end));
            if (z <= a) return null;
            return (
              <g key={i}>
                <rect x={a} y={rulY + 10 * u} width={z - a - 2 * u} height={laneH * 0.7} fill={secColors[i % secColors.length]} opacity={t >= s.start && t < s.end ? 0.55 : 0.2} />
                <text x={a + 6 * u} y={rulY + 10 * u + laneH * 0.5} fontFamily={plexMono} fontSize={mono * 0.8} fill={ink} letterSpacing={2}>
                  {s.name.toUpperCase()}
                </text>
              </g>
            );
          })}
          {/* onset lanes */}
          {lanes
            ? laneKinds.map((k, li) => {
                const y = rulY + 10 * u + laneH * (1.1 + li);
                return (
                  <g key={k}>
                    <text x={x0} y={y + mono * 0.35} fontFamily={plexMono} fontSize={mono * 0.75} fill={ink} opacity={0.5} letterSpacing={2}>
                      {k.toUpperCase()}
                    </text>
                    {g.events(k, tA, tB).map(([tt, s], i) => {
                      const x = X(tt);
                      if (x < x0 + 70 * u * P || x > x1) return null;
                      const hot = tt <= t ? Math.pow(0.5, (t - tt) / 0.12) : 0;
                      return <circle key={i} cx={x} cy={y} r={(3 + 3 * s + 6 * hot) * u * P * 0.8} fill={tt <= t ? accent : 'none'} fillOpacity={0.35 + 0.65 * hot} stroke={tt <= t ? accent : TREATISE.mid} strokeWidth={Math.max(1, u)} />;
                    })}
                    <rect x={x1 - 8 * u} y={y - 8 * u} width={16 * u * (0.3 + g.hit(k, t))} height={16 * u} fill={accent} opacity={g.hit(k, t)} />
                  </g>
                );
              })
            : null}
          {/* playhead */}
          <line x1={play} x2={play} y1={rulY - 50 * u * P} y2={rulY + laneH * (lanes ? 4.3 : 1.2)} stroke={accent} strokeWidth={Math.max(1.5, 2 * u)} />
          <text x={play + 6 * u} y={rulY - 40 * u * P} fontFamily={plexMono} fontSize={mono * 0.85} fill={accent}>
            {t.toFixed(2)}s
          </text>
        </g>
      </Svg>
      {!clear ? <TreatiseFinish grain={0.05} /> : null}
    </AbsoluteFill>
  );
};

export const beatGridMotion = defineMotion<Props>({
  id: 'beat-grid',
  title: 'Beat grid (music clock HUD)',
  category: 'music',
  description:
    'A deadpan music clock: a huge BPM readout, four bar squares that flash on each beat, a beat/bar phase dial, and a scrolling ruler of beats and eighths with section blocks and kick/snare/hat lanes lighting as they cross the playhead — the beat grid every music motion in the library syncs to.',
  source: ['pdoom-video app/src/engine/audio.ts beatAt/barAt/hit/section + data/audio.json schema (MIT)'],
  useFor: 'Music-production / DJ / metronome visuals, “how the edit is cut to the beat” explainers, a beat HUD overlay; feed it your song’s `beats` analysis to check sync.',
  durationInFrames: 240,
  defaultProps: {
    bpm: 120,
    offsetSec: 0.5,
    beats: {},
    sections: [
      {name: 'intro', start: 0, end: 2.5},
      {name: 'verse', start: 2.5, end: 6.5},
      {name: 'chorus', start: 6.5, end: 10.5},
    ],
    background: TREATISE.ink,
    ink: TREATISE.bone,
    accent: TREATISE.signal,
    window: 4,
    lanes: true,
  },
  propDocs: {
    ...MUSIC_PROP_DOCS,
    sections: 'song sections [{name, start, end}] in seconds (used when `beats` has none)',
    background: "frame colour or 'transparent' (HUD overlay)",
    ink: 'type / tick colour',
    accent: 'hit colour',
    window: 'seconds of music visible on the ruler',
    lanes: 'show kick / snare / hat onset lanes (synthesised from the grid when no onsets are given)',
  },
  component: BeatGridMotion,
  tags: ['beat', 'bpm', 'metronome', 'music', 'tempo', 'bar', 'downbeat', 'rhythm', 'hud', 'timeline', 'sync', 'kick', 'snare', 'dj', 'music video', 'treatise'],
});
