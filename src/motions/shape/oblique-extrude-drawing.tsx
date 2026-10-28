// Adapted from lemo-opuscar/styles/blueprint/demo/draw.js S() / solid() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {BlueprintPaper, eio3, lf, seg} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Cyanotype engineering drawing: a flat line elevation draws on in drafting order, then "turns" into a thick
 * oblique (cavalier) drawing as the depth factor animates 0 → 0.5 — N offset copies of each path, painted
 * back to front (paper fill under a white stroke) so hidden lines vanish correctly; parts can explode along
 * the depth axis; dimensions and a title block finish the sheet.
 */
type Props = {
  parts: {d: string; name?: string; dz?: number; explode?: number}[];
  k: number;
  angle: number;
  drawFrames: number;
  extrudeAt: number;
  extrudeFrames: number;
  explodeAt: number;
  title: string;
  subtitle: string;
  note: string;
  lineColor: string;
  paperDark: string;
  paperLight: string;
  seed: number;
};

// default drawing: a small desk lamp in flat elevation (viewBox 0..100), rear parts first
const LAMP: Props['parts'] = [
  {d: 'M22 86 L58 86 L58 92 L22 92 Z', name: 'BASE', dz: 1, explode: 0},
  {d: 'M38 86 L42 86 L46 48 L42 48 Z', name: 'STEM', dz: 0.7, explode: 0.35},
  {d: 'M44 52 L66 36 L70 42 L48 58 Z', name: 'ARM', dz: 0.7, explode: 0.7},
  {d: 'M62 26 L82 40 L70 52 L56 34 Z', name: 'SHADE', dz: 1, explode: 1},
  {d: 'M66 40 L74 46 L70 50 L62 44 Z', name: 'BULB', dz: 0.4, explode: 1.25},
];

const Oblique: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('oblq');
  const parts = p.parts.length ? p.parts : LAMP;
  const S = Math.min(w * (portrait ? 0.0095 : 0.0075), h * 0.0085);
  const ox = w / 2 - 50 * S + (portrait ? -4 : -10) * S;
  const oy = h / 2 - 54 * S;
  const a = (p.angle * Math.PI) / 180;
  const draw = seg(frame, 6, 6 + p.drawFrames);
  const kNow = p.k * eio3(seg(frame, p.extrudeAt, p.extrudeAt + p.extrudeFrames));
  const explode = eio3(seg(frame, p.explodeAt, p.explodeAt + 26));
  const explodeDist = 16;
  const sw = Math.max(1.4, 2.2 * u);
  const Zc = lerp(1.04, 1, prog(frame, 0, 40, ease.out)) * lerp(1, 1.06, prog(frame, p.extrudeAt, p.extrudeAt + 120, ease.sine));

  const layers: React.ReactNode[] = [];
  const DEPTH = 7; // drawing units of full depth at k = 0.5
  parts.forEach((part, pi) => {
    const dzTotal = (part.dz ?? 1) * DEPTH * (kNow / Math.max(1e-6, p.k));
    const off = (part.explode ?? 0) * explode * explodeDist * (kNow / Math.max(1e-6, p.k)) * 0.5;
    const partDraw = clamp(draw * parts.length - pi);
    if (partDraw <= 0) return;
    const steps = kNow > 0.001 ? Math.max(2, Math.min(80, Math.round((dzTotal * S) / 1.6))) : 1;
    const nodes: React.ReactNode[] = [];
    for (let i = steps - 1; i >= 0; i--) {
      const z = (i / Math.max(1, steps - 1)) * dzTotal + off;
      const dx = Math.cos(a) * z;
      const dy = -Math.sin(a) * z;
      const front = i === 0;
      const back = i === steps - 1 && steps > 1;
      nodes.push(
        <g key={i} transform={`translate(${dx} ${dy})`}>
          <path
            d={part.d}
            fill={front ? 'rgba(16,34,72,0.55)' : '#16305e'}
            fillOpacity={front ? 0.55 : 1}
            stroke={p.lineColor}
            strokeOpacity={front || back ? 1 : 0.4}
            strokeWidth={((front ? sw : sw * 0.4) / S) * 1}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={`${partDraw} 2`}
          />
        </g>,
      );
    }
    layers.push(<g key={pi}>{nodes}</g>);
  });

  // dimension line under the base after extrude
  const dim = eio3(seg(frame, p.extrudeAt + p.extrudeFrames + 6, p.extrudeAt + p.extrudeFrames + 20));
  const titleIn = prog(frame, 14, 34, ease.out);
  const noteIn = prog(frame, p.extrudeAt + p.extrudeFrames + 14, p.extrudeAt + p.extrudeFrames + 30, ease.out);
  const labels = parts
    .map((part, i) => ({name: part.name, i}))
    .filter((x) => x.name);

  return (
    <AbsoluteFill style={{background: p.paperDark}}>
      <AbsoluteFill style={{transform: `scale(${Zc})`}}>
        <Svg>
          <BlueprintPaper id={id} w={w} h={h} u={u} dark={p.paperDark} light={p.paperLight} seed={p.seed} />
          {/* centre lines */}
          <g stroke={p.lineColor} opacity={0.4} strokeWidth={1 * u} strokeDasharray={`${14 * u} ${6 * u} ${3 * u} ${6 * u}`}>
            <line x1={ox + 40 * S} y1={oy - 6 * S} x2={ox + 40 * S} y2={oy + 100 * S} pathLength={1} strokeDasharray={undefined} strokeOpacity={0} />
            <line x1={ox - 8 * S} y1={oy + 89 * S} x2={ox + 112 * S} y2={oy + 89 * S} opacity={Math.min(1, draw * 2)} />
          </g>
          <g transform={`translate(${ox} ${oy}) scale(${S})`}>{layers}</g>
          {/* part labels with leaders */}
          {labels.map(({name, i}, k2) => {
            const on = clamp(draw * parts.length - i);
            if (on < 0.8) return null;
            const part = parts[i];
            const m = part.d.match(/M\s*([\d.]+)[ ,]([\d.]+)/);
            const px0 = m ? +m[1] : 50;
            const py0 = m ? +m[2] : 50;
            const lx = portrait ? w / 2 + (k2 % 2 === 0 ? -1 : 1) * w * 0.33 : ox + 118 * S;
            const ly = portrait ? oy + 100 * S + (Math.floor(k2 / 2) + 1) * 54 * u : oy + (12 + k2 * 12) * S;
            const offL = (part.explode ?? 0) * explode * explodeDist * (kNow / Math.max(1e-6, p.k)) * 0.5;
            const ax = ox + (px0 + Math.cos(a) * offL) * S;
            const ay = oy + (py0 - Math.sin(a) * offL) * S;
            return (
              <g key={k2} opacity={Math.min(1, (on - 0.8) * 5)}>
                <circle cx={ax} cy={ay} r={2.5 * u} fill="none" stroke={p.lineColor} strokeWidth={1.2 * u} />
                <line x1={ax} y1={ay} x2={lx} y2={ly - 6 * u} stroke={p.lineColor} strokeWidth={1 * u} opacity={0.6} />
                <text x={lx} y={ly + 10 * u} textAnchor={portrait ? 'middle' : 'start'} fontFamily={lf.hand} fontSize={(portrait ? 36 : 22) * u} fill={p.lineColor}>
                  {name}
                </text>
              </g>
            );
          })}
          {/* depth dimension */}
          {dim > 0 && (
            <g stroke={p.lineColor} fill={p.lineColor} opacity={dim}>
              <line x1={ox + 58 * S} y1={oy + 92 * S + 16 * u} x2={ox + 58 * S + Math.cos(a) * 7 * S} y2={oy + 92 * S - Math.sin(a) * 7 * S + 16 * u} strokeWidth={1.4 * u} markerEnd="none" />
              <text x={ox + 58 * S + Math.cos(a) * 4 * S + 8 * u} y={oy + 92 * S + 42 * u} fontFamily={lf.plex} fontSize={(portrait ? 30 : 20) * u} stroke="none">
                d = 7
              </text>
            </g>
          )}
          {/* title block */}
          <g opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * 12 * u})`}>
            <rect x={w - (portrait ? w * 0.84 : 560 * u) - 50 * u} y={h - (portrait ? 200 : 170) * u} width={portrait ? w * 0.84 : 560 * u} height={(portrait ? 140 : 110) * u} fill="rgba(12,28,62,0.58)" stroke={p.lineColor} strokeWidth={1.6 * u} />
            <text x={w - (portrait ? w * 0.84 : 560 * u) - 26 * u} y={h - (portrait ? 128 : 118) * u} fontFamily={lf.hand} fontWeight={700} fontSize={(portrait ? 52 : 40) * u} fill={p.lineColor}>
              {p.title}
            </text>
            <text x={w - (portrait ? w * 0.84 : 560 * u) - 26 * u} y={h - (portrait ? 84 : 82) * u} fontFamily={lf.plex} fontSize={(portrait ? 28 : 20) * u} letterSpacing={2 * u} fill={p.lineColor} opacity={0.85}>
              {p.subtitle}
            </text>
          </g>
          {p.note && (
            <text x={50 * u} y={h - 92 * u} fontFamily={lf.hand} fontSize={(portrait ? 36 : 26) * u} fill={p.lineColor} opacity={noteIn * 0.9}>
              {p.note}
            </text>
          )}
        </Svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const obliqueExtrudeDrawing = defineMotion<Props>({
  id: 'oblique-extrude-drawing',
  title: 'Oblique extrude drawing',
  category: 'shape',
  description:
    'On cyanotype blueprint paper, a flat line elevation draws on in drafting order, then turns into a thick oblique drawing as the depth animates 0 → 0.5 with hidden lines vanishing correctly; parts explode along the depth axis with hand-lettered labels, a dimension and a title block.',
  source: ['lemo-opuscar styles/blueprint demo/draw.js S(), solid() (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §5 oblique-extrude-drawing'],
  useFor: 'Plan → object reveals without three.js: flat-pack furniture, lamps, circuit boards, product diagrams, patents.',
  durationInFrames: 180,
  defaultProps: {
    parts: [],
    k: 0.5,
    angle: 35,
    drawFrames: 44,
    extrudeAt: 64,
    extrudeFrames: 36,
    explodeAt: 118,
    title: 'The Desk Lamp',
    subtitle: 'PATENT PENDING · FIG. 1 · SCALE 1:4',
    note: 'REV.1 — add one (1) bulb.',
    lineColor: '#E7F0F9',
    paperDark: '#18336B',
    paperLight: '#2A58A6',
    seed: 3,
  },
  propDocs: {
    parts: '[{d, name?, dz?, explode?}] SVG paths in a 0..100 box, rear to front; dz = relative thickness, explode = offset along depth on the explode beat; empty = built-in desk lamp',
    k: 'final oblique depth factor (0.5 = cavalier/2)',
    angle: 'receding axis angle in degrees (30–45)',
    drawFrames: 'frames for the flat elevation to draw on',
    extrudeAt: 'frame the extrusion starts',
    extrudeFrames: 'extrusion duration',
    explodeAt: 'frame parts fly apart along the depth axis (set past the duration to skip)',
    title: 'hand-lettered title in the block',
    subtitle: 'mono line under the title',
    note: 'witty marginal note (empty = none)',
    lineColor: 'line work colour',
    paperDark: 'cyanotype paper dark ramp end',
    paperLight: 'cyanotype paper light ramp end',
    seed: 'paper texture seed',
  },
  component: Oblique,
  tags: ['blueprint', 'cyanotype', 'oblique', 'extrude', 'drafting', 'engineering drawing', 'patent', 'line art', 'technical', 'exploded', '2.5d', 'plan', 'diagram', 'draw on'],
});
