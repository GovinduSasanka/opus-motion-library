import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {HATCH3, X3PageGround, X3Rack, X3Sun, jarTimeline, makeProj, rackLayout, x14Fonts, type X3Jar} from '../../core/r2-x14-kit';

/**
 * x3 "pop-up physics book" jar rack: ink-line glass jars on a clay shelf rack, each with a paper label card.
 * Jars light one after another — saturated self-lit liquid rises with a meniscus (easeOutCubic, 0.4 s), its glow
 * spills onto the shelf, the side panels and the neighbours, and the handwritten value counts up; at the end all
 * jars drain (easeInCubic) so the loop restarts on the empty rack. The camera yaws slowly so the rack reads as 3D.
 */

type Props = {
  jars: X3Jar[];
  timeline: {jar: number; level: number; at: number}[];
  drainAt: number;
  fillFrames: number;
  drainFrames: number;
  cols: number;
  rows: number;
  eyebrow: string;
  title: string;
  caption: string;
  glow: number;
  labels: boolean;
  sun: boolean;
  paper: string;
  ink: string;
  yaw: number;
  pitch: number;
};

const JAR_DEFAULTS: X3Jar[] = [
  {label: 'Gravitational', color: HATCH3.purple, value: 14, unit: 'J'},
  {label: 'Kinetic', color: HATCH3.blue, value: 0.98, unit: 'J'},
  {label: 'Thermal', color: HATCH3.orange, value: 3.2, unit: 'J'},
  {label: 'Elastic', color: HATCH3.pink, value: 0.45, unit: 'J'},
  {label: 'Chemical', color: HATCH3.green, value: 9.6, unit: 'J'},
  {label: 'Magnetic', color: HATCH3.red, value: 0.06, unit: 'J'},
  {label: 'Electrostatic', color: HATCH3.yellow, value: 0.002, unit: 'J'},
  {label: 'Nuclear', color: HATCH3.teal, value: 120, unit: 'J'},
];

const EnergyJarFill: React.FC<Props> = ({jars, timeline, drainAt, fillFrames, drainFrames, cols, rows, eyebrow, title, caption, glow, labels, sun, paper, ink, yaw, pitch}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const n = Math.min(jars.length, cols * rows);
  const L = rackLayout(cols, rows);
  // events + a staggered drain of everything that was lit
  const lit = [...new Set(timeline.map((e) => e.jar))];
  const events = [...timeline, ...(drainAt > 0 ? lit.map((j, k) => ({jar: j, level: 0, at: drainAt + k * 3})) : [])];
  const states = jarTimeline(frame, n, events, fillFrames, drainFrames, jars.map((j) => j.value));

  // camera: slow 3/4 yaw drift + a gentle push
  const tt = frame / Math.max(1, durationInFrames);
  const yawNow = yaw + 7 * ease.sine(clamp(tt));
  const rackW = 2 * L.hw + 0.3;
  const rackH = L.panelH + 0.8;
  const sFit = portrait ? Math.min((w * 0.9) / rackW, (h * 0.42) / rackH) : Math.min((w * (w > h ? 0.6 : 0.86)) / rackW, (h * 0.62) / rackH);
  const s = sFit * (1 + 0.04 * ease.sine(clamp(tt)));
  const rcx = portrait ? w * 0.5 : w > h ? w * 0.58 : w * 0.5;
  const rcy = portrait ? h * 0.58 : w > h ? h * 0.56 : h * 0.6;
  const sinP = Math.sin((pitch * Math.PI) / 180);
  const cosP = Math.cos((pitch * Math.PI) / 180);
  const pr = makeProj(rcx, rcy + (L.panelH / 2) * cosP * s - 0.1 * sinP * s, s, yawNow, pitch);

  // sun icon top-right of the rack
  const [sx, sy] = pr.P(L.hw + 0.55, L.panelH + 0.75, -0.4);
  const sunDraw = prog(frame, 0, 12, ease.out);

  // text block
  const tIn = prog(frame, 2, 20, ease.out);
  const fs = (portrait ? 46 : w > h ? 40 : 40) * u;
  const tx = portrait ? w * 0.08 : w > h ? w * 0.065 : w * 0.08;
  const ty = portrait ? h * 0.12 : w > h ? h * 0.16 : h * 0.1;
  return (
    <AbsoluteFill style={{background: paper}}>
      <X3PageGround w={w} h={h} u={u} paper={paper} id="ejf" shift={-0.04 * tt} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <X3Rack pr={pr} cols={cols} rows={rows} jars={jars} states={states} u={u} id="ejf" ink={ink} labels={labels} glowStrength={glow} t={frame} />
        {sun ? <X3Sun x={Math.min(sx, w - 0.26 * s * 2.6)} y={sy} r={0.26 * s} draw={sunDraw} rays={prog(frame, 6, 18, ease.out)} shade={prog(frame, 10, 22)} u={u} id="ejf-sun" ink={ink} /> : null}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: tx,
          top: ty,
          opacity: tIn,
          transform: `translateY(${(1 - tIn) * 8 * u}px)`,
          color: ink,
          maxWidth: portrait ? w * 0.84 : w * 0.3,
        }}
      >
        {eyebrow ? (
          <div style={{fontFamily: x14Fonts.bookSerif, fontSize: fs * 0.36, letterSpacing: '0.14em', textTransform: 'uppercase', color: HATCH3.eyebrow, fontWeight: 600, marginBottom: 6 * u}}>{eyebrow}</div>
        ) : null}
        {title ? <div style={{fontFamily: x14Fonts.bookSerif, fontStyle: 'italic', fontWeight: 600, fontSize: fs, lineHeight: 1.1}}>{title}</div> : null}
      </div>
      {caption ? (
        <div
          style={{
            position: 'absolute',
            left: portrait ? w * 0.08 : w > h ? w * 0.065 : w * 0.08,
            bottom: portrait ? h * 0.1 : h * 0.08,
            opacity: tIn * 0.85,
            fontFamily: x14Fonts.bookSerifItalic,
            fontStyle: 'italic',
            fontSize: fs * 0.48,
            color: ink,
            maxWidth: w * 0.84,
          }}
        >
          {caption}
        </div>
      ) : null}
      <span style={{display: 'none', fontFamily: fonts.hand}} />
    </AbsoluteFill>
  );
};

export const energyJarFill = defineMotion<Props>({
  id: 'energy-jar-fill',
  title: 'Energy jar fill',
  category: 'data',
  description:
    'Ink-line glass jars on a clay shelf rack light up one by one: saturated self-lit liquid rises with a meniscus, its glow spills onto the shelf, panels and label cards, and handwritten values count up, then everything drains.',
  source: ['video x3 3:40-4:60 (3.4-4.6 s, 5.6-6.2 s, 22-28 s)'],
  useFor: 'Visualising stores and quantities (energy, budget, storage, progress) as glowing jars — a physical alternative to a bar chart in explainers and lessons.',
  durationInFrames: 180,
  defaultProps: {
    jars: JAR_DEFAULTS,
    timeline: [
      {jar: 0, level: 0.78, at: 8},
      {jar: 1, level: 0.62, at: 34},
      {jar: 2, level: 0.74, at: 60},
      {jar: 4, level: 0.7, at: 86},
      {jar: 3, level: 0.5, at: 110},
    ],
    drainAt: 150,
    fillFrames: 12,
    drainFrames: 9,
    cols: 4,
    rows: 2,
    eyebrow: 'Lesson 1',
    title: 'Energy stores',
    caption: 'Fig. 1  Eight stores on one shelf. Each jar lights when its store fills.',
    glow: 1,
    labels: true,
    sun: true,
    paper: HATCH3.paper,
    ink: HATCH3.ink,
    yaw: -20,
    pitch: 28,
  },
  propDocs: {
    jars: 'jar list in reading order (top row first): {label, color, value (full value shown on the card), unit}',
    timeline: 'fill / drain events: {jar (index), level 0..1, at (frame)}; level 0 drains',
    drainAt: 'frame where every lit jar drains (staggered 3 f); 0 = never',
    fillFrames: 'frames for a fill (easeOutCubic; source 0.35-0.45 s)',
    drainFrames: 'frames for a drain (easeInCubic; source 0.3 s)',
    cols: 'jars per shelf',
    rows: 'number of shelves (1-3)',
    eyebrow: 'small letter-spaced eyebrow above the title ("" hides)',
    title: 'serif italic title top-left ("" hides)',
    caption: 'italic figure caption bottom-left ("" hides)',
    glow: 'glow spill strength (0 = none, 1 = source)',
    labels: 'show the paper label cards with handwritten values',
    sun: 'show the ink sun icon',
    paper: 'page paper colour',
    ink: 'line / text ink colour',
    yaw: '3/4 view yaw in degrees (drifts +7° over the clip)',
    pitch: 'camera elevation in degrees',
  },
  component: EnergyJarFill,
  tags: ['jar', 'fill', 'liquid', 'glow', 'energy', 'store', 'shelf', 'rack', 'ink', 'hatching', 'textbook', 'education', 'physics', 'counter', 'handwritten', 'quantity', 'bar chart alternative', 'progress', 'ink-hatch-3d', 'pop-up book', 'loop'],
});
