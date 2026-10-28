// Adapted from lemo-opuscar/styles/briefing-board/demo/kit/board.js ink kind 'dim' + judgement frames (MIT / CC BY 4.0, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {Whiteboard, bease, eio3, lf, seg, settle} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Quantities drawn as real lengths to one scale on a whiteboard: for each item a blue dimension arrow shoots
 * from a shared start line (crawl vs rocket speed tells the story), the camera rides its tip, the arrowhead
 * taps on landing; items short of the limit line get a red strike and a dashed red shortfall. At the end the
 * camera pulls back to the whole judgement frame.
 */
type Props = {
  items: {label: string; value: number}[];
  unit: string;
  limit: number;
  limitLabel: string;
  verdict: string;
  measure: string;
  fail: string;
  ink: string;
  itemFrames: number;
  rideCamera: boolean;
  background: string;
};

const fmt = (v: number) => Math.round(v).toLocaleString('en-US');

const RideDimension: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('ridedim');
  const items = p.items;
  const n = items.length;
  const vmax = Math.max(p.limit, ...items.map((i) => i.value));
  const x0 = (portrait ? 70 : 140) * u;
  const scale = (w * (portrait ? 1.9 : 1.45)) / vmax; // world px per unit
  const worldW = x0 + vmax * scale + 220 * u;
  const rowH = Math.min((portrait ? 0.11 : 0.15) * h, (h * 0.62) / n);
  const top = portrait ? h * 0.3 : h * 0.26;
  const rowY = (i: number) => top + i * rowH + rowH * 0.5;
  // timing
  const start = (i: number) => 18 + i * p.itemFrames;
  const dur = (i: number) => Math.round(12 + 34 * Math.sqrt(items[i].value / vmax));
  const tipAt = (i: number, f: number) => x0 + items[i].value * scale * eio3(seg(f, start(i), start(i) + dur(i)));
  const endAll = start(n - 1) + dur(n - 1) + 16;
  // camera x: ride the active tip with beta-eased handoffs
  const camFor = (f: number) => {
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (f < start(i) - 12) break;
      const back = bease(seg(f, start(i) - 12, start(i)), 1.6, 3);
      const prevEnd = i > 0 ? Math.max(0, x0 + items[i - 1].value * scale - w * (portrait ? 0.5 : 0.62)) : 0;
      const ride = Math.max(0, tipAt(i, f) - w * (portrait ? 0.5 : 0.62));
      c = f < start(i) ? lerp(prevEnd, 0, back) : ride;
    }
    return c;
  };
  const pull = bease(seg(frame, endAll, endAll + 28), 1.8, 3);
  const fit = Math.min(1, (w * 0.94) / worldW);
  const camX = p.rideCamera ? camFor(frame) * (1 - pull) : 0;
  const Z = p.rideCamera ? lerp(1, fit, pull) : fit;
  const T = `translate(${(w - worldW * Z) * 0 * pull} ${(h / 2) * (1 - Z)}) scale(${Z}) translate(${-camX} 0)`;
  const limitX = x0 + p.limit * scale;
  const sw = 4.5 * u;
  const fs = (portrait ? 46 : 50) * u;
  const verdictK = clamp((frame - endAll - 30) / 18);
  const startDraw = eio3(seg(frame, 2, 16));
  const limitDraw = eio3(seg(frame, 8, 26));

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <Whiteboard id={id} w={w} h={h} u={u} sheen={camX / w} />
        <g transform={T}>
          <defs>
            <marker id={`${id}-ah`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 Z" fill={p.measure} />
            </marker>
          </defs>
          {/* start + limit lines */}
          <line x1={x0} y1={top - 40 * u} x2={x0} y2={top - 40 * u + (n * rowH + 80 * u) * startDraw} stroke={p.ink} strokeWidth={3 * u} strokeLinecap="round" />
          <line x1={limitX} y1={top - 70 * u} x2={limitX} y2={top - 70 * u + (n * rowH + 110 * u) * limitDraw} stroke={p.fail} strokeWidth={3 * u} strokeDasharray={`${16 * u} ${9 * u}`} />
          <text x={limitX + 14 * u} y={top - 46 * u} fontFamily={lf.hand} fontWeight={700} fontSize={fs} fill={p.fail} opacity={limitDraw}>
            {p.limitLabel}
          </text>
          {items.map((it, i) => {
            const y = rowY(i);
            const k = seg(frame, start(i), start(i) + dur(i));
            if (frame < start(i) - 10) return null;
            const tip = tipAt(i, frame);
            const landed = frame - (start(i) + dur(i));
            const tap = landed >= 0 ? 1 + 0.5 * (1 - settle(landed / 30, 12, 26)) : 1;
            const failed = it.value < p.limit;
            const judge = clamp((landed - 8) / 10);
            return (
              <g key={i}>
                <text x={portrait ? Math.max(x0 - 16 * u, camX + 12 * u) : x0 - 16 * u} y={y - 20 * u} textAnchor="start" fontFamily={lf.hand} fontWeight={700} fontSize={fs} fill={p.ink} opacity={clamp((frame - start(i) + 10) / 8)} transform={`translate(${16 * u} 0)`}>
                  {it.label}
                </text>
                {k > 0 && (
                  <>
                    <line x1={x0 + 2 * u} y1={y} x2={tip} y2={y} stroke={p.measure} strokeWidth={sw} strokeLinecap="round" markerEnd={`url(#${id}-ah)`} />
                    <line x1={x0} y1={y - 12 * u} x2={x0} y2={y + 12 * u} stroke={p.measure} strokeWidth={sw * 0.7} />
                    <circle cx={tip} cy={y} r={7 * u * tap} fill="none" stroke={p.measure} strokeWidth={2 * u} opacity={landed >= 0 ? clamp(1 - landed / 14) : 0} />
                    <text x={tip + 18 * u} y={y + fs * 0.36} fontFamily={lf.hand} fontWeight={700} fontSize={fs} fill={p.measure}>
                      {fmt(it.value * k)} {p.unit}
                    </text>
                  </>
                )}
                {failed && judge > 0 && (
                  <g opacity={judge}>
                    <line x1={tip + 4 * u} y1={y + 14 * u} x2={limitX} y2={y + 14 * u} stroke={p.fail} strokeWidth={3 * u} strokeDasharray={`${10 * u} ${8 * u}`} />
                    <line x1={tip + 12 * u} y1={y + 8 * u} x2={tip + 12 * u + (fs * 3.6) * judge} y2={y - 4 * u} stroke={p.fail} strokeWidth={5 * u} strokeLinecap="round" />
                  </g>
                )}
                {!failed && judge > 0 && (
                  <path d={`M${tip + 18 * u + fs * 3.6} ${y - 4 * u} l${10 * u} ${12 * u} l${20 * u} ${-26 * u}`} stroke={p.measure} strokeWidth={4 * u} fill="none" strokeLinecap="round" opacity={judge} pathLength={1} strokeDasharray={`${judge} 2`} />
                )}
              </g>
            );
          })}
        </g>
        {p.verdict && verdictK > 0 && (
          <g opacity={verdictK} transform={`translate(0 ${(1 - verdictK) * 14 * u})`}>
            <text x={w / 2} y={h - (portrait ? 200 : 110) * u} textAnchor="middle" fontFamily={lf.hand} fontWeight={700} fontSize={(portrait ? 76 : 84) * u} fill={p.fail}>
              {p.verdict}
            </text>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const rideDimensionLine = defineMotion<Props>({
  id: 'ride-dimension-line',
  title: 'Ride the dimension line',
  category: 'data',
  description:
    'Quantities drawn as real lengths to one scale on a whiteboard: blue dimension arrows shoot from a shared start line while the camera rides their tips, arrowheads tap on landing, items short of the red limit line get struck through with a dashed shortfall, then the camera pulls back to the whole judgement frame and a verdict lands.',
  source: ['lemo-opuscar styles/briefing-board demo/kit/board.js ink kind dim; DEMO.md judgement frames (MIT / CC BY 4.0, LemoLab)', 'analysis/sources/lemo-styles-a.md §7 ride-dimension-line'],
  useFor: 'Comparisons in real units — spans, ranges, distances, prices against a budget — that read better than bar charts.',
  durationInFrames: 240,
  defaultProps: {
    items: [
      {label: 'Beam bridge', value: 330},
      {label: 'Arch bridge', value: 600},
      {label: 'Cable-stayed', value: 1208},
      {label: 'Suspension', value: 2023},
    ],
    unit: 'm',
    limit: 1000,
    limitLabel: 'needed: 1,000 m',
    verdict: 'The ship decides the span.',
    measure: '#1F4FC8',
    fail: '#D33A21',
    ink: '#23272E',
    itemFrames: 34,
    rideCamera: true,
    background: '#F3F1EB',
  },
  propDocs: {
    items: '[{label, value}] one dimension line each, drawn to one shared scale',
    unit: 'unit after each value',
    limit: 'limit / requirement value (dashed red line); items below it fail',
    limitLabel: 'marker label at the limit line',
    verdict: 'red marker verdict after the pull-back (empty = none)',
    measure: 'measurement ink (blue)',
    fail: 'decision ink (red)',
    ink: 'graphite ink for labels',
    itemFrames: 'frames between items',
    rideCamera: 'camera rides the arrow tips (false = whole frame from the start)',
    background: 'board colour',
  },
  component: RideDimension,
  tags: ['dimension', 'measurement', 'comparison', 'scale', 'length', 'whiteboard', 'arrow', 'limit', 'budget', 'data', 'chart alternative', 'briefing', 'engineering', 'camera ride'],
});
