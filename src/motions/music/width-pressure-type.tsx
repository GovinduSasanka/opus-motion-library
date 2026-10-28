// Adapted from pdoom-video/app/src/scenes/dense-press.ts (width steps, leading collapse, safe-area bursts, QC log) (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {
  BeatsProp,
  CropMarks,
  E,
  MUSIC_PROP_DOCS,
  TREATISE,
  TreatiseFinish,
  clamp01,
  clampN,
  lerpN,
  plexMono,
  springStep,
  timecode,
  useGrid,
  vf,
} from '../../core/r2-music-kit';

type Props = {
  lines: string[];
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  widthFrom: number;
  widthTo: number;
  weightFrom: number;
  weightTo: number;
  maxCopies: number;
  burstBeats: number[];
  background: string;
  ink: string;
  dim: string;
  accent: string;
  safeAreas: boolean;
  qcLog: boolean;
  counterTo: number;
};

const WidthPressureType: React.FC<Props> = ({lines, bpm, offsetSec, beats, widthFrom, widthTo, weightFrom, weightTo, maxCopies, burstBeats, background, ink, dim, accent, safeAreas, qcLog, counterTo}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const t = frame / fps;
  const beat = Math.max(0, g.beatAt(t));
  const kicks = Math.floor(beat);
  const kickT = g.timeOfBeat(kicks);
  const spr = springStep(t - kickT, 4.5, 0.4);
  // condense per kick: width steps down, weight up, hidden by a horizontal squeeze spring
  const total = durationInFrames / fps;
  const kicksTotal = Math.max(1, Math.floor(g.beatAt(total)));
  const stepK = clamp01(kicks / kicksTotal);
  const prevK = clamp01((kicks - 1) / kicksTotal);
  const kNow = lerpN(prevK, stepK, spr);
  const wdth = lerpN(widthFrom, widthTo, kNow);
  const wght = lerpN(weightFrom, weightTo, kNow);
  const squeeze = 1 - 0.06 * Math.max(0, 1 - (t - kickT) * 6) + 0.02 * (spr - 1);
  // copies stack with collapsing leading, creeping between kicks
  const copies = Math.min(maxCopies, 1 + kicks);
  const leadBase = lerpN(1.04, 0.74, kNow) - 0.015 * clamp01((t - kickT) / g.period);
  // burst: on listed beats the block scales past title-safe → action-safe → frame
  const burstIdx = burstBeats.filter((b) => beat >= b).length;
  const lastBurst = burstIdx > 0 ? g.timeOfBeat(burstBeats[burstIdx - 1]) : -9;
  const burstK = burstIdx > 0 ? [1.13, 1.22, 1.34][Math.min(2, burstIdx - 1)] : 1;
  const burstSpring = burstIdx > 0 ? 1 + (burstK - 1) * springStep(t - lastBurst, 3.5, 0.3) : 1;
  const splay = burstIdx >= 3 ? 14 * u * springStep(t - lastBurst, 3, 0.25) : 0;
  const text = (lines.length ? lines : ['MORE AND MORE', 'OF EVERYTHING', 'ALL AT ONCE']).map((s) => s.toUpperCase());
  const longest = Math.max(...text.map((s) => s.length), 4);
  const boxW = w * (portrait ? 0.84 : 0.8);
  const boxH = h * (portrait ? 0.62 : 0.66);
  const fs = Math.min(boxH / (text.length * copies) / 0.9, (boxW / longest) * (2.05 - (wdth / 125) * 0.85));
  const mono = 13 * u * (portrait ? 1.25 : 1);
  const counter = Math.round(20 * Math.pow(Math.max(1, counterTo / 20), E.inExpo(clamp01(t / total))));
  const warn = burstIdx >= 1;
  const rows: {line: string; tone: string}[] = [];
  for (let c = 0; c < copies; c++) for (const ln of text) rows.push({line: ln, tone: (rows.length % 2 === 0 ? ink : dim)});
  const clear = background === 'transparent';
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background, overflow: 'hidden'}}>
      {safeAreas ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <rect x={w * 0.05} y={h * 0.05} width={w * 0.9} height={h * 0.9} fill="none" stroke={dim} strokeOpacity={0.55} strokeWidth={Math.max(1, u)} strokeDasharray={`${6 * u} ${5 * u}`} />
          <rect x={w * 0.035} y={h * 0.035} width={w * 0.93} height={h * 0.93} fill="none" stroke={dim} strokeOpacity={0.3} strokeWidth={Math.max(1, u)} />
          <text x={w * 0.05 + 6 * u} y={h * 0.05 + mono * 1.3} fontFamily={plexMono} fontSize={mono * 0.85} fill={warn ? accent : dim} letterSpacing={1}>
            TITLE SAFE 90%
          </text>
          <text x={w * 0.035 + 6 * u} y={h * 0.035 + mono * 1.2} fontFamily={plexMono} fontSize={mono * 0.85} fill={burstIdx >= 2 ? accent : dim} opacity={0.8} letterSpacing={1}>
            ACTION SAFE 93%
          </text>
          <CropMarks w={w} h={h} inset={16 * u} len={26 * u} color={burstIdx >= 3 ? accent : dim} sw={Math.max(1, 1.4 * u)} splay={splay} />
        </svg>
      ) : null}
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transform: `scale(${squeeze * burstSpring}, ${burstSpring})`, textAlign: 'center'}}>
          {rows.map((r, i) => (
            <div key={i} style={{...vf(wdth, wght), fontSize: fs, lineHeight: leadBase, color: r.tone, letterSpacing: `${lerpN(0, -0.045, kNow)}em`, whiteSpace: 'nowrap'}}>
              {r.line}
            </div>
          ))}
        </div>
      </div>
      {qcLog ? (
        <div style={{position: 'absolute', left: w * 0.05 + 8 * u, bottom: h * 0.065, fontFamily: plexMono, fontSize: mono, color: ink, opacity: 0.85, lineHeight: 1.55}}>
          <div style={{opacity: 0.6}}>{`${timecode(t, fps)}  wdth ${wdth.toFixed(0)}  wght ${wght.toFixed(0)}  copies ${rows.length}`}</div>
          <div style={{opacity: 0.6}}>{`INFO  density ${(kNow * 100).toFixed(0)}%  ×${counter.toLocaleString('en-US')}`}</div>
          {warn ? <div style={{color: accent}}>{`WARN  text outside title safe (90%)  +${timecode(lastBurst, fps)}`}</div> : null}
          {burstIdx >= 3 ? <div style={{color: accent}}>{'FAIL  text outside frame · crop marks displaced'}</div> : null}
        </div>
      ) : null}
      {!clear ? <TreatiseFinish grain={0.06} vignette={0.3} /> : null}
    </AbsoluteFill>
  );
};

export const widthPressureType = defineMotion<Props>({
  id: 'width-pressure-type',
  title: 'Width pressure type (condensing slab)',
  category: 'music',
  description:
    'A lyric packed into the broadcast title-safe box condenses on every kick — variable width 125→62, weight 300→900, tracking collapsing, more copies stacking with shrinking leading until the box is a solid slab — then bursts through title-safe, action-safe and finally the frame while a deadpan mono QC log complains and a counter races upward.',
  source: ['pdoom-video app/src/scenes/dense-press.ts + plate fig12 (MIT): width steps on the kick with a horizontal squeeze spring'],
  useFor: '“Pressure / scale / too much” beats in explainers, launch videos and hype reels; a typographic crescendo synced to the music.',
  durationInFrames: 240,
  defaultProps: {
    lines: ['MORE AND MORE', 'OF EVERYTHING', 'ALL AT ONCE'],
    bpm: 120,
    offsetSec: 0.3,
    beats: {},
    widthFrom: 125,
    widthTo: 62,
    weightFrom: 300,
    weightTo: 900,
    maxCopies: 4,
    burstBeats: [8, 11, 14],
    background: TREATISE.ink,
    ink: TREATISE.bone,
    dim: TREATISE.mid,
    accent: TREATISE.signal,
    safeAreas: true,
    qcLog: true,
    counterTo: 20000,
  },
  propDocs: {
    ...MUSIC_PROP_DOCS,
    lines: 'the text block (each entry one row, duplicated as pressure builds)',
    widthFrom: 'variable-font width at the start (125 = widest)',
    widthTo: 'width under full pressure (62 = most condensed)',
    weightFrom: 'weight at the start',
    weightTo: 'weight under full pressure',
    maxCopies: 'how many copies of the block may stack',
    burstBeats: 'beat indices where the slab bursts a safe area (3rd = through the frame, crop marks splay)',
    background: "frame colour or 'transparent'",
    ink: 'primary type tone',
    dim: 'alternating copy tone',
    accent: 'warning colour',
    safeAreas: 'draw title/action-safe boxes and crop marks',
    qcLog: 'deadpan mono QC log bottom-left',
    counterTo: 'the racing counter’s final value',
  },
  component: WidthPressureType,
  tags: ['variable font', 'width axis', 'condensed', 'pressure', 'kinetic typography', 'kick', 'beat', 'music', 'safe area', 'qc', 'broadcast', 'slab', 'density', 'treatise'],
});
