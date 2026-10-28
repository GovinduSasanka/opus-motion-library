import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {HATCH3, X3PageGround, X3Rack, X3Sun, jarTimeline, makeProj, rackLayout, x14Fonts, type X3Arc, type X3Jar} from '../../core/r2-x14-kit';

/**
 * x3 energy transfer: on a single clay shelf of ink-line glass jars, a thick gradient tube arches out of the source
 * jar and draws itself over to the target (easeInOutCubic, 0.3 s). The target starts filling when the arc reaches
 * 80 %, the source level drops ≈ 10 %, the arc stays with a soft glow and light pulses flow along it. Steps chain
 * (purple → blue → orange → pink), then everything drains so the clip loops on the empty shelf.
 */

type Step = {from: number; to: number; at: number};
type Props = {
  jars: X3Jar[];
  startJar: number;
  startLevel: number;
  chain: Step[];
  drawFrames: number;
  fillFrames: number;
  sourceDrop: number;
  resetAt: number;
  arcHeight: number;
  arcWidth: number;
  flow: boolean;
  eyebrow: string;
  title: string;
  caption: string;
  labels: boolean;
  sun: boolean;
  paper: string;
  ink: string;
  yaw: number;
  pitch: number;
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const TransferArc: React.FC<Props> = ({jars, startJar, startLevel, chain, drawFrames, fillFrames, sourceDrop, resetAt, arcHeight, arcWidth, flow, eyebrow, title, caption, labels, sun, paper, ink, yaw, pitch}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const cols = Math.max(2, jars.length);
  const n = jars.length;
  const L = rackLayout(cols, 1);

  // build fill events from the chain: start jar fills, every step fills the target at 80 % of the draw and
  // drops the source by `sourceDrop` of its current level
  const lv = Array.from({length: n}, () => 0);
  const events: {jar: number; level: number; at: number}[] = [{jar: startJar, level: startLevel, at: 2}];
  lv[startJar] = startLevel;
  const steps = [...chain].sort((a, b) => a.at - b.at);
  for (const st of steps) {
    const t80 = st.at + Math.round(drawFrames * 0.8);
    const give = lv[st.from] * sourceDrop;
    lv[st.from] = Math.max(0, lv[st.from] - give);
    events.push({jar: st.from, level: lv[st.from], at: t80});
    lv[st.to] = Math.min(0.85, Math.max(lv[st.to], startLevel * 0.85));
    events.push({jar: st.to, level: lv[st.to], at: t80});
  }
  if (resetAt > 0) for (let i = 0; i < n; i++) events.push({jar: i, level: 0, at: resetAt + i * 3});
  // value shown = value × level / start level (so the source visibly loses a little)
  const states = jarTimeline(frame, n, events, fillFrames, 9, jars.map((j) => j.value)).map((s, i) => ({
    ...s,
    value: (jars[i].value * s.level) / Math.max(0.0001, startLevel),
  }));
  const fade = resetAt > 0 ? 1 - prog(frame, resetAt, resetAt + 12, ease.in) : 1;
  const arcs: X3Arc[] = steps.map((st) => {
    const p = easeInOutCubic(clamp((frame - st.at) / Math.max(1, drawFrames)));
    const done = st.at + drawFrames;
    return {from: st.from, to: st.to, p, flow: flow && frame > done ? (frame - done) / 45 : 0, alpha: fade};
  });

  const tt = frame / Math.max(1, durationInFrames);
  const yawNow = yaw + 6 * ease.sine(clamp(tt));
  const rackW = 2 * L.hw + 0.3;
  const rackH = L.panelH + 1.6;
  const sFit = portrait ? Math.min((w * 0.9) / rackW, (h * 0.4) / rackH) : Math.min((w * (w > h ? 0.62 : 0.86)) / rackW, (h * 0.6) / rackH);
  const s = sFit * (1 + 0.04 * ease.sine(clamp(tt)));
  const rcx = portrait ? w * 0.5 : w > h ? w * 0.57 : w * 0.5;
  const rcy = portrait ? h * 0.52 : w > h ? h * 0.56 : h * 0.6;
  const cosP = Math.cos((pitch * Math.PI) / 180);
  const pr = makeProj(rcx, rcy + (rackH / 2 - 0.3) * cosP * s, s, yawNow, pitch);
  const [sx, sy] = pr.P(L.hw + 0.6, L.panelH + 1.25, -0.4);

  const tIn = prog(frame, 2, 20, ease.out);
  const fs = 40 * u * (portrait ? 1.15 : 1);
  const tx = portrait ? w * 0.08 : w > h ? w * 0.065 : w * 0.08;
  const ty = portrait ? h * 0.12 : w > h ? h * 0.14 : h * 0.1;
  return (
    <AbsoluteFill style={{background: paper}}>
      <X3PageGround w={w} h={h} u={u} paper={paper} id="tra" shift={-0.04 * tt} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <X3Rack pr={pr} cols={cols} rows={1} jars={jars} states={states} arcs={arcs} u={u} id="tra" ink={ink} labels={labels} arcHeight={arcHeight} arcWidth={arcWidth} t={frame} />
        {sun ? <X3Sun x={Math.min(sx, w - 0.24 * s * 2.6)} y={sy} r={0.24 * s} draw={prog(frame, 0, 12, ease.out)} rays={prog(frame, 6, 18, ease.out)} shade={prog(frame, 10, 22)} u={u} id="tra-sun" ink={ink} /> : null}
      </svg>
      <div style={{position: 'absolute', left: tx, top: ty, opacity: tIn, transform: `translateY(${(1 - tIn) * 8 * u}px)`, color: ink, maxWidth: portrait ? w * 0.84 : w * 0.34}}>
        {eyebrow ? <div style={{fontFamily: x14Fonts.bookSerif, fontSize: fs * 0.36, letterSpacing: '0.14em', textTransform: 'uppercase', color: HATCH3.eyebrow, fontWeight: 600, marginBottom: 6 * u}}>{eyebrow}</div> : null}
        {title ? <div style={{fontFamily: x14Fonts.bookSerif, fontStyle: 'italic', fontWeight: 600, fontSize: fs, lineHeight: 1.1}}>{title}</div> : null}
      </div>
      {caption ? (
        <div style={{position: 'absolute', left: tx, bottom: portrait ? h * 0.1 : h * 0.08, opacity: tIn * 0.85, fontFamily: x14Fonts.bookSerif, fontStyle: 'italic', fontSize: fs * (portrait ? 0.64 : 0.48), color: ink, maxWidth: w * 0.84}}>{caption}</div>
      ) : null}
    </AbsoluteFill>
  );
};

export const transferArc = defineMotion<Props>({
  id: 'transfer-arc',
  title: 'Transfer arc',
  category: 'data',
  description:
    'A thick gradient tube arches out of one glowing ink-line jar and draws itself into the next; the target fills as the arc lands, the source drops a little, and chained arcs carry the energy purple → blue → orange → pink with light flowing along them.',
  source: ['video x3 3.9-4.6 s, 11.6-13.3 s (transfer arcs between jars)'],
  useFor: 'Showing flows and transfers between containers — energy between stores, money between accounts, data between services — in explainers and lessons.',
  durationInFrames: 180,
  defaultProps: {
    jars: [
      {label: 'Gravitational', color: HATCH3.purple, value: 15, unit: 'J'},
      {label: 'Kinetic', color: HATCH3.blue, value: 13, unit: 'J'},
      {label: 'Thermal', color: HATCH3.orange, value: 12, unit: 'J'},
      {label: 'Sound', color: HATCH3.pink, value: 10, unit: 'J'},
    ],
    startJar: 0,
    startLevel: 0.8,
    chain: [
      {from: 0, to: 1, at: 22},
      {from: 1, to: 2, at: 56},
      {from: 2, to: 3, at: 90},
    ],
    drawFrames: 9,
    fillFrames: 12,
    sourceDrop: 0.1,
    resetAt: 150,
    arcHeight: 0.6,
    arcWidth: 1,
    flow: true,
    eyebrow: 'Transfers',
    title: 'Energy moves between stores',
    caption: 'Fig. 2  Each arc carries energy on to the next store.',
    labels: true,
    sun: true,
    paper: HATCH3.paper,
    ink: HATCH3.ink,
    yaw: -18,
    pitch: 26,
  },
  propDocs: {
    jars: 'jars on the shelf, left to right: {label, color, value (shown when full), unit}',
    startJar: 'index of the jar that is full at the start',
    startLevel: 'its fill level 0..1',
    chain: 'transfer steps {from, to, at (frame the arc starts drawing)}',
    drawFrames: 'frames for an arc to draw (easeInOutCubic; source 0.3 s)',
    fillFrames: 'frames for the target fill (starts at 80 % of the draw)',
    sourceDrop: 'fraction of its level the source loses per transfer',
    resetAt: 'frame where arcs fade and all jars drain (0 = never)',
    arcHeight: 'arc apex above the rims, in jar spacings',
    arcWidth: 'tube thickness multiplier',
    flow: 'light pulses flow along drawn arcs',
    eyebrow: 'small letter-spaced eyebrow ("" hides)',
    title: 'serif italic title ("" hides)',
    caption: 'italic figure caption ("" hides)',
    labels: 'show label cards with handwritten values',
    sun: 'show the ink sun icon',
    paper: 'page paper colour',
    ink: 'line / text ink colour',
    yaw: '3/4 view yaw in degrees (drifts +6°)',
    pitch: 'camera elevation in degrees',
  },
  component: TransferArc,
  tags: ['arc', 'transfer', 'flow', 'gradient', 'tube', 'jar', 'energy', 'chain', 'pipeline', 'money flow', 'data flow', 'ink', 'hatching', 'textbook', 'education', 'physics', 'glow', 'ink-hatch-3d', 'pop-up book', 'loop'],
});
