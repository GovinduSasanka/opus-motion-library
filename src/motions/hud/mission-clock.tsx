// Adapted from lemo-opuscar/styles/countdown/demo/index.html drawClock() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CD, ClockBlock, eio, eo, isClear, la2Fonts, seg, useIdA} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Countdown state machine: T−00:04.0 in fixed condensed slots with an accent T−, grey tenths and a ten-segment bar that
 * drains every second; each new second drops in 14 px. At zero the whole block flips to accent with dark ink, the header
 * becomes MISSION ELAPSED and it counts T+ with a white flash; a control strip of named segments fills on hand-overs.
 */

type Seg = {label: string; at: number};
type Props = {
  startSeconds: number;
  rate: number;
  hours: boolean;
  segments: Seg[];
  header: string;
  elapsedHeader: string;
  caption: string;
  accent: string;
  background: string;
  size: number;
  flash: boolean;
};

const MissionClock: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, durationInFrames: D} = useStage();
  const id = useIdA('mc');
  const M = p.startSeconds + (frame / fps) * p.rate;
  const zeroFrame = (-p.startSeconds / p.rate) * fps;
  // hand-overs
  let hi = 0;
  let ht = -999;
  p.segments.forEach((sg, i) => {
    if (frame >= sg.at) {
      hi = i;
      ht = sg.at;
    }
  });
  const segK = eo(seg(frame, ht, ht + 0.3 * fps));
  const handFlash = ht > 0 && frame - ht < 0.6 * fps ? 1 - (frame - ht) / (0.6 * fps) : 0;
  // panel geometry; opens from its left edge (re-layout 0.34 s eio)
  const s = u * p.size * (portrait ? 1.55 : 1.45);
  const pw = Math.min(w - 96 * u, 1150 * u * p.size);
  const ph = 215 * s;
  const px = (w - pw) / 2;
  const py = (h - ph) / 2 - (portrait ? 40 * u : 20 * u);
  const open = eio(seg(frame, 2, 2 + 0.34 * fps));
  const zf = frame - zeroFrame;
  const glob = p.flash && zf >= 0 ? 0.7 * Math.exp((-zf / fps) * 9) : 0;
  const capA = eo(seg(frame, 12, 24)) * (1 - seg(frame, D - 10, D));
  return (
    <AbsoluteFill style={{background: isClear(p.background) ? 'transparent' : p.background}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={`${id}o`}>
            <rect x={px} y={py - 4 * u} width={pw * open} height={ph + 8 * u} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}o)`}>
          <ClockBlock
            x={px}
            y={py}
            w={pw}
            h={ph}
            M={M}
            s={s}
            header={[p.header, p.elapsedHeader]}
            segments={p.segments.map((x) => x.label)}
            activeSeg={hi}
            segK={segK}
            handFlash={handFlash}
            accent={p.accent}
            hours={p.hours}
          />
        </g>
        {open < 1 && open > 0 && <rect x={px + pw * open - 2 * u} y={py} width={3 * u} height={ph} fill={p.accent} />}
        {p.caption && (
          <text x={px} y={py + ph + 46 * u} fontFamily={la2Fonts.plex} fontWeight={500} fontSize={(portrait ? 22 : 20) * u} fill={CD.dim} letterSpacing={2 * u} opacity={capA}>
            {p.caption}
          </text>
        )}
        {glob > 0.005 && <rect width={w} height={h} fill="#FFF8EC" opacity={glob} />}
      </svg>
    </AbsoluteFill>
  );
};

export const missionClock = defineMotion<Props>({
  id: 'mission-clock',
  title: 'Mission clock',
  category: 'hud',
  description:
    'A T−00:04.0 countdown in fixed condensed slots: accent T−, grey tenths, a ten-segment bar draining every second, new seconds dropping in; at zero it flips to an accent block with dark T+ and an "elapsed" header and a warm flash, while a control strip of named segments fills on each hand-over.',
  source: ['lemo-opuscar styles/countdown (MIT, LemoLab) — demo/index.html drawClock, HANDS'],
  useFor: 'Launches, deadlines, sales ending, live events, sports and "go time" beats; a reusable countdown HUD (background transparent to overlay).',
  durationInFrames: 210,
  defaultProps: {
    startSeconds: -4.3,
    rate: 1,
    hours: false,
    segments: [
      {label: 'GROUND', at: 0},
      {label: 'VEHICLE', at: 24},
      {label: 'MISSION', at: 170},
    ],
    header: 'COUNTDOWN',
    elapsedHeader: 'MISSION ELAPSED',
    caption: 'NORTHWIND-1 · PAD 2 · SAME CLOCK FOR EVERY FEED',
    accent: CD.org,
    background: CD.bg,
    size: 1,
    flash: true,
  },
  propDocs: {
    startSeconds: 'clock value at frame 0 in seconds (negative = T−, zero is where it inverts)',
    rate: 'clock seconds per real second (1 = real time)',
    hours: 'HH:MM:SS instead of MM:SS',
    segments: 'control strip [{label, at: frame}] — the active segment fills on its hand-over with a warm flash',
    header: 'header before zero',
    elapsedHeader: 'header after zero (inverted state)',
    caption: 'mono line under the clock (empty = none)',
    accent: 'accent colour (T−, bar, inverted fill)',
    background: "page colour or 'transparent'",
    size: 'scale multiplier',
    flash: 'full-frame warm flash at zero',
  },
  component: MissionClock,
  tags: ['countdown', 'clock', 'timer', 'launch', 't-minus', 'deadline', 'live', 'event', 'hud', 'mission', 'zero', 'invert', 'sports', 'sale ending', 'orange', 'dark'],
});
