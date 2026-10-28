// Adapted from lemo-opuscar/styles/dataviz STYLE.md §5–§8 "Breaking the frame", demo/engine.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DV, DataDot, DvPaper, PencilLine, PtA, clamp01, eio, eo, h01, la2Fonts, lerpN, pencilGeom, seg, smooth} from '../../core/r2-la2-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Record-breaking moment: a pencil chart draws calmly until one value overshoots the plot box and pierces the top frame
 * line (a torn zig-zag scar stays); after a held beat the y-axis rescales in 4 ratchet clicks — every tick label and mark
 * sliding to its new position each click — with a 2-frame camera punch-in and decaying shake on the break.
 */

type Props = {
  values: number[];
  spikeIndex: number;
  ticks: number;
  domainBefore: number;
  domainAfter: number;
  title: string;
  subtitle: string;
  unit: string;
  note: string;
  accent: string;
  seed: number;
  background: string;
};

const AxisRatchetRescale: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait, durationInFrames: D} = useStage();
  const vals = p.values.length > 1 ? p.values : [0, 1];
  const n = vals.length;
  const si = Math.min(n - 1, p.spikeIndex < 0 ? n - 3 : p.spikeIndex);
  // layout
  const x0 = w * (portrait ? 0.14 : 0.14);
  const x1 = w * (portrait ? 0.93 : 0.9);
  const y0 = h * (portrait ? 0.3 : 0.24);
  const y1 = h * (portrait ? 0.66 : 0.72);
  const X = (i: number) => x0 + ((x1 - x0) * i) / (n - 1);

  // timing: marks land on an accelerating beat grid; the spike lands, holds pierced ≥ half a beat, then 4 ratchet clicks
  const drawDur = 70;
  const dotAt = (i: number) => 8 + (drawDur * Math.pow(i / (n - 1), 0.85) || 0);
  const spikeF = dotAt(si);
  const holdF = spikeF + 18; // ≥ half a beat at 90–120 BPM
  const clickLen = 4; // 1/32 at 90 BPM ≈ 2 frames; eased over ~.09 beat ≈ 3–4 frames
  const clicks = 4;

  // domain = keyframed discrete steps with per-step ease
  let domain = p.domainBefore;
  let clickK = 0;
  for (let c = 0; c < clicks; c++) {
    const cf = holdF + c * clickLen;
    const k = eio(seg(frame, cf, cf + clickLen - 1));
    const d0 = p.domainBefore + ((p.domainAfter - p.domainBefore) * c) / clicks;
    const d1 = p.domainBefore + ((p.domainAfter - p.domainBefore) * (c + 1)) / clicks;
    if (frame >= cf) {
      domain = lerpN(d0, d1, k);
      clickK = k;
    }
  }
  const Y = (v: number) => y1 - (y1 - y0) * (v / domain);

  // camera punch on the pierce: ×1.16 over 2 frames + decaying shake
  const pf = frame - spikeF;
  const punch = pf >= 0 ? 1 + 0.16 * (pf < 2 ? pf / 2 : Math.exp(-(pf - 2) / 10)) : 1;
  const shake = pf >= 2 && pf < 26 ? Math.pow(1 - (pf - 2) / 24, 2) : 0;
  const shx = Math.sin(pf * 2.7) * 9 * u * shake;
  const shy = Math.cos(pf * 3.4) * 7 * u * shake;

  // marks
  const marks: React.ReactNode[] = [];
  const pts: PtA[] = [];
  for (let i = 0; i < n; i++) {
    if (frame < dotAt(i)) break;
    const y = Y(vals[i]);
    pts.push([X(i), y]);
    const isSpike = i === si;
    marks.push(<DataDot key={i} x={X(i)} y={y} r={5.5 * u} fill={isSpike ? p.accent : DV.paper} ring={isSpike ? p.accent : DV.ink} fresh={(frame - dotAt(i)) / fps} ringW={1.5 * u} ripple={!isSpike} />);
  }
  const lineG = pts.length > 1 ? pencilGeom(pts, {progress: 1, seed: p.seed, wobble: 0.5, width: 2.4 * u}) : null;

  // frame box + torn scar at the pierce x
  const pierceX = X(si);
  const pierced = frame >= spikeF;
  const scarW = 26 * u;
  const topY = y0;
  const boxP = smooth(seg(frame, 2, 16));
  const scar: PtA[] = [
    [pierceX - scarW / 2, topY],
    [pierceX - scarW * 0.28, topY - 7 * u],
    [pierceX - scarW * 0.1, topY + 5 * u],
    [pierceX + scarW * 0.14, topY - 6 * u],
    [pierceX + scarW * 0.32, topY + 4 * u],
    [pierceX + scarW / 2, topY],
  ];
  // y ticks slide with the domain
  const tickVals = Array.from({length: p.ticks + 1}, (_, i) => (domain / p.ticks) * i);

  // spike pokes above the frame while pierced (before rescale completes the value sits above y0)
  const titleA = smooth(seg(frame, 4, 18));
  const noteA = smooth(seg(frame, holdF + clicks * clickLen + 6, holdF + clicks * clickLen + 22)) * (1 - seg(frame, D - 10, D));
  const fsT = (portrait ? 50 : 62) * u;

  return (
    <AbsoluteFill style={{background: p.background}}>
      <DvPaper w={w} h={h} u={u} color={p.background} />
      <AbsoluteFill style={{transform: `translate(${shx}px, ${shy}px) scale(${punch})`, transformOrigin: `${pierceX}px ${(y0 + y1) / 2}px`}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <g opacity={titleA}>
            <text x={x0 - 24 * u} y={h * (portrait ? 0.12 : 0.13)} fontFamily={la2Fonts.newsreader} fontWeight={500} fontSize={fsT} fill={DV.ink}>
              {p.title}
            </text>
            <text x={x0 - 24 * u} y={h * (portrait ? 0.12 : 0.13) + 32 * u} fontFamily={la2Fonts.plex} fontSize={16 * u} fill={DV.inkSoft} letterSpacing={1 * u}>
              {p.subtitle}
            </text>
          </g>
          {/* plot frame; top line broken by the scar once pierced */}
          <g opacity={boxP}>
            {!pierced ? (
              <PencilLine pts={[[x0 - 20 * u, topY], [x1 + 14 * u, topY]]} progress={boxP} width={1.6 * u} color={DV.ink} seed={p.seed + 1} alpha={0.65} />
            ) : (
              <>
                <PencilLine pts={[[x0 - 20 * u, topY], [pierceX - scarW / 2, topY]]} width={1.6 * u} color={DV.ink} seed={p.seed + 1} alpha={0.65} />
                <PencilLine pts={[[pierceX + scarW / 2, topY], [x1 + 14 * u, topY]]} width={1.6 * u} color={DV.ink} seed={p.seed + 2} alpha={0.65} />
                <PencilLine pts={scar} width={1.4 * u} color={DV.red} seed={p.seed + 4} alpha={0.9} />
              </>
            )}
            <PencilLine pts={[[x0 - 20 * u, y1], [x1 + 14 * u, y1]]} progress={boxP} width={1.6 * u} color={DV.ink} seed={p.seed + 5} alpha={0.75} />
            <PencilLine pts={[[x0 - 20 * u, topY], [x0 - 20 * u, y1]]} progress={boxP} width={1.6 * u} color={DV.ink} seed={p.seed + 6} alpha={0.75} />
          </g>
          {/* y ticks (slide on each ratchet click) */}
          {tickVals.map((tv, i) => {
            if (i === 0) return null;
            const ty = Y(tv);
            if (ty < topY - 4 * u) return null;
            return (
              <g key={i} opacity={boxP * 0.9}>
                <line x1={x0 - 26 * u} y1={ty} x2={x0 - 14 * u} y2={ty} stroke={DV.inkSoft} strokeWidth={1.3 * u} />
                <line x1={x0 - 14 * u} y1={ty} x2={x1 + 10 * u} y2={ty} stroke={DV.rule} strokeWidth={1 * u} opacity={0.7} />
                <text x={x0 - 34 * u} y={ty + 6 * u} fontFamily={la2Fonts.plex} fontSize={17 * u} fill={DV.inkSoft} textAnchor="end">
                  {Math.round(tv)}
                </text>
              </g>
            );
          })}
          <text x={x0 - 34 * u} y={topY - 12 * u} fontFamily={la2Fonts.plex} fontSize={15 * u} fill={DV.inkSoft} textAnchor="end" opacity={boxP}>
            {p.unit}
          </text>
          {/* series */}
          {lineG?.d && <path d={lineG.d} fill="none" stroke={DV.graphite} strokeWidth={2.4 * u} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />}
          {marks}
          {/* handwritten note on the spike */}
          <g opacity={noteA}>
            <text x={Math.min(pierceX, x1 - 60 * u)} y={Y(vals[si]) - 26 * u} fontFamily={la2Fonts.caveat} fontSize={32 * u} fill={DV.red} textAnchor={si > n * 0.6 ? 'end' : 'start'}>
              {p.note}
            </text>
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const demoVals = Array.from({length: 26}, (_, i) => 18 + i * 1.6 + (h01(i, 2, 9) - 0.5) * 9 + (i === 23 ? 55 : 0));

export const axisRatchetRescale = defineMotion<Props>({
  id: 'axis-ratchet-rescale',
  title: 'Axis ratchet rescale',
  category: 'data',
  description:
    'A pencil chart draws calmly until one value pierces the top frame line — torn red scar, 2-frame punch-in, decaying shake — holds the break for a beat, then the y-axis rescales in 4 ratchet clicks with every tick and mark sliding to its new position.',
  source: ['lemo-opuscar styles/dataviz (MIT, LemoLab) — STYLE.md "Breaking the frame", DEMO.md Shots'],
  useFor: '"Record-breaking" moments — a viral spike, price bubble, flood level, heat record — in any chart story; pairs with number-counter.',
  durationInFrames: 180,
  defaultProps: {
    values: demoVals.map((v) => Math.round(v * 10) / 10),
    spikeIndex: 23,
    ticks: 4,
    domainBefore: 90,
    domainAfter: 160,
    title: 'Then came March',
    subtitle: 'DAILY VISITS, THOUSANDS · ONE MARK PER DAY',
    unit: 'k',
    note: 'off the chart',
    accent: DV.red,
    seed: 9,
    background: DV.paper,
  },
  propDocs: {
    values: 'the series; one value should exceed domainBefore',
    spikeIndex: 'index of the record value (-1 = third from last)',
    ticks: 'number of y-axis divisions',
    domainBefore: 'y domain before the rescale (the spike must overshoot it)',
    domainAfter: 'y domain after the 4 ratchet clicks',
    title: 'serif headline',
    subtitle: 'mono kicker',
    unit: 'unit label above the axis',
    note: 'handwritten red note at the spike',
    accent: 'spike colour',
    seed: 'pencil wobble seed',
    background: 'paper colour',
  },
  component: AxisRatchetRescale,
  tags: ['chart', 'rescale', 'ratchet', 'record', 'spike', 'break the frame', 'scar', 'pencil', 'hand drawn', 'paper', 'punch in', 'shake', 'dataviz', 'viral', 'peak', 'axis'],
});
