// Adapted from pdoom-video/app/src/scenes/prompt.ts (shots), room.ts, dense-askew.ts, engine/util.ts springStep (MIT, © 2026 Giacomo Magnanini) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BeatCamera, BeatsProp, CamMove, MUSIC_PROP_DOCS, TREATISE, TreatiseFinish, beatState, hash, plexMono, useGrid, vf} from '../../core/r2-music-kit';

type Props = {
  title: string;
  caption: string;
  bpm: number;
  offsetSec: number;
  beats: BeatsProp;
  on: 'beat' | 'downbeat' | 'bar2';
  moves: CamMove[];
  intensity: number;
  punch: number;
  shake: number;
  background: string;
  ink: string;
  accent: string;
  showSubject: boolean;
  hud: boolean;
  seed: number;
};

/** demo subject: an engraved-style "table" of plinths + the title, so the camera has something to cut around */
const Subject: React.FC<{title: string; caption: string; ink: string; accent: string; t: number; pulse: number; kick: number}> = ({title, caption, ink, accent, t, pulse, kick}) => {
  const {w, h, u, portrait} = useStage();
  const cols = portrait ? 5 : 9;
  const baseY = h * 0.72;
  const fs = Math.min(150 * u * (portrait ? 1.1 : 1), (w * (portrait ? 0.78 : 0.86)) / Math.max(4, title.length * (portrait ? 0.8 : 0.62)));
  const pm = portrait ? 2.4 : 1; // portrait: taller plinths
  return (
    <AbsoluteFill>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {/* ground grid */}
        {Array.from({length: 7}, (_, i) => (
          <line key={'g' + i} x1={0} x2={w} y1={baseY + i * 26 * u} y2={baseY + i * 26 * u} stroke={ink} strokeOpacity={0.14 - i * 0.015} strokeWidth={Math.max(1, u)} />
        ))}
        {/* plinths stepping on the beat */}
        {Array.from({length: cols}, (_, i) => {
          const x = (w / cols) * (i + 0.5);
          const hh = ((30 + 70 * hash(i, 5)) * u * (1 + 0.25 * kick * (i % 2 ? 1 : -0.4)) + 26 * u * Math.max(0, Math.sin(t * 2 + i))) * pm;
          const bw = (w / cols) * 0.46;
          const hot = i === Math.floor(t * 2) % cols;
          return (
            <g key={i}>
              <rect x={x - bw / 2} y={baseY - hh} width={bw} height={hh} fill={hot ? accent : 'none'} fillOpacity={hot ? 0.85 : 0} stroke={ink} strokeOpacity={0.8} strokeWidth={Math.max(1, 1.3 * u)} />
              {Array.from({length: 3}, (_, k) => (
                <line key={k} x1={x - bw / 2} x2={x + bw / 2} y1={baseY - (hh * (k + 1)) / 4} y2={baseY - (hh * (k + 1)) / 4} stroke={ink} strokeOpacity={0.25} strokeWidth={Math.max(1, u * 0.8)} />
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: w * 0.07, top: h * 0.2, ...vf(80, 880), fontSize: fs, lineHeight: 0.96, color: ink, textTransform: 'uppercase', transform: `scale(${1 + 0.02 * pulse})`, transformOrigin: '0 50%'}}>
        {title}
      </div>
      <div style={{position: 'absolute', left: w * 0.075, top: h * 0.2 + fs * 1.15, fontFamily: plexMono, fontSize: (portrait ? 26 : 15) * u, color: accent, letterSpacing: 3}}>{caption}</div>
    </AbsoluteFill>
  );
};

const BeatCameraMotion: React.FC<Props> = ({title, caption, bpm, offsetSec, beats, on, moves, intensity, punch, shake, background, ink, accent, showSubject, hud, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const g = useGrid(beats, bpm, offsetSec);
  const t = frame / fps;
  const b = beatState(g, t);
  const clear = background === 'transparent';
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      <BeatCamera beats={Array.isArray(beats) ? beats : {bpm, offsetSec, ...(beats ?? {})}} moves={moves.length ? moves : undefined} on={on} intensity={portrait ? intensity * 0.55 : intensity} punch={punch} shake={shake} seed={seed}>
        {showSubject ? <Subject title={title} caption={caption} ink={ink} accent={accent} t={t} pulse={b.pulse} kick={b.kick} /> : null}
      </BeatCamera>
      {hud ? (
        <div style={{position: 'absolute', left: w * 0.05, bottom: h * 0.05, fontFamily: plexMono, fontSize: 13 * u * (portrait ? 2 : 1), color: ink, opacity: 0.6, letterSpacing: 2}}>
          {`BEAT-CAMERA · ${on.toUpperCase()} · BAR ${Math.max(0, b.barIndex) + 1} · ${b.beatInBar + 1}/${g.beatsPerBar}`}
        </div>
      ) : null}
      {!clear ? <TreatiseFinish grain={0.06} vignette={0.32} /> : null}
    </AbsoluteFill>
  );
};

export const beatCameraMotion = defineMotion<Props>({
  id: 'beat-camera',
  title: 'Beat camera (snap reframes)',
  category: 'music',
  description:
    'The camera never floats: on every beat (or downbeat) it snaps to a new framing — punch-in, roll, whip, orbit, push — each move caught by a damped spring, with a +4 % punch on the kicks and a hair of shake that dies before the next cut; demoed over an engraved plinth table and a heavy title, and usable as a wrapper around any motion in a mix.',
  source: ['pdoom-video app/src/scenes/prompt.ts shots + engine/util.ts springStep (MIT): 1 − e^(−ζωt)·cos(ω√(1−ζ²)t), settle before the cut'],
  useFor: 'Makes any static motion feel edited to music — wrap a scene in a `mix` with this on top, or use it as the demo explains; promos, recaps, music videos.',
  durationInFrames: 240,
  defaultProps: {
    title: 'ON THE BEAT',
    caption: 'CAMERA · SNAP REFRAME PER BEAT',
    bpm: 120,
    offsetSec: 0.3,
    beats: {},
    on: 'beat',
    moves: ['punch', 'roll', 'whip', 'orbit', 'push'],
    intensity: 1,
    punch: 0.04,
    shake: 7,
    background: TREATISE.ink,
    ink: TREATISE.bone,
    accent: TREATISE.signal,
    showSubject: true,
    hud: true,
    seed: 1,
  },
  propDocs: {
    title: 'demo headline',
    caption: 'demo mono caption',
    ...MUSIC_PROP_DOCS,
    on: "re-frame on every 'beat', 'downbeat' or every two bars ('bar2')",
    moves: 'allowed moves: punch | roll | whip | orbit | push | low | tilt (seeded pick per beat)',
    intensity: 'how far each reframe goes (0.5 subtle … 1.5 aggressive)',
    punch: 'extra zoom on each kick (0.04 = +4 %)',
    shake: 'post-cut shake in px (decays with half-life 0.05 s)',
    background: "frame colour, or 'transparent' with showSubject false to use purely as an overlay wrapper",
    showSubject: 'draw the demo subject (false = empty camera rig for compositing)',
    hud: 'bar/beat readout',
    seed: 'shot order',
  },
  component: BeatCameraMotion,
  tags: ['camera', 'beat', 'punch in', 'whip', 'roll', 'reframe', 'music', 'edit', 'spring', 'shake', 'kick', 'music video', 'wrapper', 'treatise'],
});
