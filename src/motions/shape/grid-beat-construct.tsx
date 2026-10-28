// Adapted from mg-styles-15/demos/09-bauhaus/film.js (gridProg, target, groupAngle) + cues.json (MIT) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {defineMotion} from '../../core/types';
import {clamp, ease, prog} from '../../core/ease';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {fonts} from '../../core/fonts';

type Shape = {kind: 'disc' | 'bar' | 'tri' | 'square' | 'semi' | 'quarter'; x: number; y: number; w: number; h: number; color: string; verb: 'land' | 'slide' | 'flip' | 'scale' | 'rotate'};
type Props = {
  module: number;
  bpm: number;
  palette: string[];
  shapes: Shape[];
  title: string;
  subtitle: string;
  folio: string;
  turn: boolean;
  showTargets: boolean;
  escapementTeeth: number;
  paper: string;
  ink: string;
  startFrame: number;
  compScale: number;
};

const io2 = (t: number) => {
  const c = clamp(t);
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
};

const shapePath = (s: Shape, M: number) => {
  const w = s.w * M;
  const h = s.h * M;
  const x0 = -w / 2;
  const y0 = -h / 2;
  switch (s.kind) {
    case 'bar':
    case 'square':
      return `M${x0},${y0} h${w} v${h} h${-w} Z`;
    case 'tri':
      return `M${x0},${y0 + h} L${x0 + w / 2},${y0} L${x0 + w},${y0 + h} Z`;
    case 'semi':
      return `M${x0},${y0 + h} A${w / 2},${h} 0 0 1 ${x0 + w},${y0 + h} Z`;
    case 'quarter':
      return `M${x0},${y0 + h} V${y0} A${w},${h} 0 0 1 ${x0 + w},${y0 + h} Z`;
    default:
      return `M${x0},0 a${w / 2},${h / 2} 0 1 0 ${w},0 a${w / 2},${h / 2} 0 1 0 ${-w},0 Z`;
  }
};

const GridBeatConstruct: React.FC<Props> = ({module: modProp, bpm, shapes, title, subtitle, folio, turn, showTargets, escapementTeeth, paper, ink, startFrame, compScale: cs}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait, square} = useStage();
  const M = modProp > 0 ? modProp * u : portrait ? w / 8 : square ? w / 9.5 : w / 16;
  const inset = M * 0.5;
  const beat = (30 * 60) / bpm;
  // composition centre on a grid intersection
  const ccx = portrait || square ? cx : cx + 3 * M;
  const ccy = portrait ? cy - 2 * M : square ? cy - 1.2 * M : cy;

  // ---- grid ruling from the centre outward
  const nx = Math.floor((w / 2 - inset) / M);
  const ny = Math.floor((h / 2 - inset) / M);
  const lines: React.ReactNode[] = [];
  const ruleLine = (axis: 'v' | 'h', i: number) => {
    const d = Math.abs(i);
    const start = 4 + d * 3.75;
    const p = prog(frame, start, start + 7.5, ease.out);
    if (p <= 0) return;
    const relax = prog(frame, start + 7.5, start + 13, ease.out);
    const wgt = (d === 0 ? 6 : 3) * u * (1 - relax) + 1.1 * u * relax;
    const half = axis === 'v' ? (h / 2 - inset) * p : (w / 2 - inset) * p;
    const pos = axis === 'v' ? cx + i * M : cy + i * M;
    lines.push(
      axis === 'v' ? (
        <line key={`v${i}`} x1={pos} x2={pos} y1={cy - half} y2={cy + half} stroke={ink} strokeWidth={wgt} strokeOpacity={d === 0 ? 0.8 : 0.5} strokeLinecap="butt" />
      ) : (
        <line key={`h${i}`} y1={pos} y2={pos} x1={cx - half} x2={cx + half} stroke={ink} strokeWidth={wgt} strokeOpacity={d === 0 ? 0.8 : 0.5} strokeLinecap="butt" />
      ),
    );
  };
  for (let i = -nx; i <= nx; i++) ruleLine('v', i);
  for (let i = -ny; i <= ny; i++) ruleLine('h', i);

  // ---- group escapement turn
  const t0 = startFrame + shapes.length * beat + 6;
  const turnLen = escapementTeeth * 3.5;
  const q = prog(frame, t0, t0 + turnLen, ease.linear) * escapementTeeth;
  const k = Math.min(escapementTeeth - 1, Math.floor(q));
  const r = q - k;
  const theta = turn ? (frame >= t0 + turnLen ? 0 : -90 + (90 / escapementTeeth) * (k + io2((r - 0.35) / 0.65))) : 0;
  const thetaStart = turn ? -90 : 0;
  const rot = frame < t0 ? thetaStart : theta;

  // ---- shapes
  const shapeEls = shapes.map((s, i) => {
    const land = startFrame + i * beat;
    const p = prog(frame, land, land + 9, ease.sine);
    const tgt = showTargets ? prog(frame, land - beat / 2, land - beat / 2 + 3, ease.out) * (1 - prog(frame, land, land + 3, ease.out)) : 0;
    // positions are given in the FINAL (unrotated) orientation: pre-rotate into the group's built orientation
    const px = s.x * M * cs;
    const py = s.y * M * cs;
    // verb transforms (local, around the shape centre)
    let tx = 0;
    let ty = 0;
    let sx = 1;
    let sy = 1;
    let rz = 0;
    if (s.verb === 'land') {
      const q2 = ease.out(p);
      ty = -(1 - q2) * 2.2 * M;
      sy = 1 + 0.08 * Math.sin(Math.PI * p) * (1 - p);
    } else if (s.verb === 'slide') tx = -(1 - p) * 7 * M;
    else if (s.verb === 'flip') sx = Math.cos(Math.PI * (1 - p));
    else if (s.verb === 'scale') {
      const q2 = ease.back(p);
      sx = sy = q2;
    } else rz = -(1 - p) * 90;
    const vis = frame >= land - 0.01;
    return (
      <g key={i}>
        {tgt > 0 && (
          <g transform={`translate(${px} ${py})`} opacity={tgt} stroke={ink} strokeWidth={2.6 * u} fill="none">
            <circle r={23 * u * (1.5 - 0.5 * tgt)} />
            <path d={`M${-38 * u},0 h${16 * u} M${22 * u},0 h${16 * u} M0,${-38 * u} v${16 * u} M0,${22 * u} v${16 * u}`} />
          </g>
        )}
        {vis && (
          <g transform={`translate(${px + tx} ${py + ty}) rotate(${rz}) scale(${sx} ${sy})`}>
            <path d={shapePath(s, M * cs)} fill={s.color} />
          </g>
        )}
      </g>
    );
  });

  // ---- title lockup
  const tp = prog(frame, t0 + turnLen + 2, t0 + turnLen + 22, ease.out);
  const tp2 = prog(frame, t0 + turnLen + 10, t0 + turnLen + 30, ease.out);
  const tx0 = portrait || square ? cx - 3.5 * M : cx - 7.2 * M;
  const ty0 = portrait ? ccy + 5.6 * M : square ? ccy + 5.3 * M : cy + 0.2 * M;
  const tw = portrait || square ? 7 * M : 6 * M;
  const fs = Math.min(M * 1.15, tw / (Math.max(title.length, 4) * 0.74));
  const titleUp = title.toUpperCase();

  return (
    <AbsoluteFill style={{background: paper}}>
      <PaperTexture opacity={0.5} seed={11} tint="#8a7350" scale={0.8} />
      <Svg>
        <defs>
          <clipPath id="gbc-title">
            <rect x={tx0 - 4} y={ty0 - fs * 1.05} width={tw + M} height={fs * 1.25} />
          </clipPath>
        </defs>
        <rect x={inset} y={inset} width={w - 2 * inset} height={h - 2 * inset} fill="none" stroke={ink} strokeWidth={1.1 * u} opacity={0.35 * prog(frame, 0, 12, ease.out)} />
        {lines}
        <g transform={`rotate(${rot} ${ccx} ${ccy}) translate(${ccx} ${ccy})`}>
          {/* shapes are authored in the final orientation, so counter-rotate the build state only through the group */}
          {shapeEls}
        </g>
        <g clipPath="url(#gbc-title)">
          <text x={tx0} y={ty0 + (1 - tp) * fs * 1.1} fontFamily={fonts.display} fontSize={fs} fill={ink}>
            {titleUp}
          </text>
        </g>
        <g opacity={tp2} transform={`translate(0 ${(1 - tp2) * 10 * u})`}>
          <rect x={tx0} y={ty0 + fs * 0.22} width={M * 0.9} height={M * 0.12} fill="#D2261C" />
          <text x={tx0} y={ty0 + fs * 0.22 + M * 0.62} fontFamily={fonts.mono} fontWeight={700} fontSize={M * 0.2} letterSpacing={M * 0.03} fill={ink}>
            {subtitle.toUpperCase()}
          </text>
        </g>
        <text x={w - inset - M * 0.3} y={h - inset - M * 0.3} textAnchor="end" fontFamily={fonts.mono} fontSize={M * 0.17} letterSpacing={M * 0.04} fill={ink} opacity={0.6 * tp2}>
          {folio}
        </text>
      </Svg>
    </AbsoluteFill>
  );
};

export const gridBeatConstruct = defineMotion<Props>({
  id: 'grid-beat-construct',
  title: 'Grid beat construct',
  category: 'shape',
  description: 'A cream sheet rules its module grid from the centre outward; Bauhaus primitives (disc, bar, triangle, square, semicircle, quarter-disc) land, slide, flip, scale and rotate in one per beat, each preceded by a crosshair target; the finished composition then turns upright in a clock-escapement of 7.5 degree ticks and locks into a poster with title, subtitle and folio.',
  source: ['mg-styles-15 demos/09-bauhaus/film.js (MIT, gridProg / target / groupAngle) + cues.json; video 0-6 s'],
  useFor: 'Beat-synced kinetic posters, music promos, logo builds from primitives and Swiss / rational explainer intros.',
  durationInFrames: 240,
  defaultProps: {
    module: 0,
    bpm: 120,
    palette: ['#D2261C', '#16130F', '#1F4E9C', '#F2B31B'],
    shapes: [
      {kind: 'disc', x: -2, y: -2, w: 3, h: 3, color: '#D2261C', verb: 'land'},
      {kind: 'bar', x: 1, y: -3.5, w: 6, h: 1, color: '#16130F', verb: 'slide'},
      {kind: 'tri', x: 2.5, y: -0.5, w: 3, h: 3, color: '#1F4E9C', verb: 'flip'},
      {kind: 'square', x: -2.5, y: 1.5, w: 2, h: 2, color: '#F2B31B', verb: 'scale'},
      {kind: 'semi', x: 0, y: 3.25, w: 4, h: 2, color: '#16130F', verb: 'rotate'},
      {kind: 'quarter', x: 2, y: 1.5, w: 1.5, h: 1.5, color: '#D2261C', verb: 'land'},
    ],
    title: 'Construct',
    subtitle: 'Form follows the beat',
    folio: 'No. 01 / Grid study',
    turn: true,
    showTargets: true,
    escapementTeeth: 12,
    paper: '#EFE7D6',
    ink: '#16130F',
    startFrame: 34,
    compScale: 0.8,
  },
  propDocs: {
    module: 'module size in px at 1080 (0 = auto: 1/16 width)',
    bpm: 'beats per minute: one primitive lands per beat',
    palette: 'reference palette (shapes carry their own colours)',
    shapes: 'cues: kind disc|bar|tri|square|semi|quarter, x/y centre in modules from the composition centre, w/h modules, colour, verb land|slide|flip|scale|rotate',
    title: 'poster title',
    subtitle: 'small mono line',
    folio: 'folio in the corner',
    turn: 'build sideways then turn upright in escapement ticks',
    showTargets: 'crosshair target before each landing',
    escapementTeeth: 'teeth in the 90 degree turn (12 = 7.5 degrees each)',
    paper: 'sheet colour',
    ink: 'rule / type colour',
    startFrame: 'frame of the first beat',
    compScale: 'scale of the shape composition relative to the module grid (0.8)',
  },
  component: GridBeatConstruct,
  tags: ['bauhaus', 'swiss', 'grid', 'poster', 'beat', 'music', 'geometric', 'primitives', 'kinetic', 'crosshair', 'construct', 'logo build', 'rational', 'minimal', 'escapement'],
});
