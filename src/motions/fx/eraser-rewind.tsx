// Idea after lemo-opuscar styles/whiteboard demo engine (MIT, LemoLab) Timeline.erase / zigzag / drawEraser — see THIRD_PARTY_NOTICES.md.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  background: string;
  ink: string;
  accent: string;
  text: string;
  after: string;
  passes: number;
  width: number;
  strength: number;
  startFrame: number;
  durationFrames: number;
  box: number[];
  label: string;
};

const EraserRewind: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const [bx, by, bw, bh] = p.box.length === 4 ? p.box : [0.08, 0.1, 0.84, 0.72];
  const X = bx * w;
  const Y = by * h;
  const W = bw * w;
  const H = bh * h;
  const bandW = p.width * u;
  const n = Math.max(2, p.passes);
  const pts: [number, number][] = [];
  const x0 = X + bandW * 0.15;
  const x1 = X + W - bandW * 0.15;
  for (let i = 0; i < n; i++) {
    const y = Y + (i / (n - 1)) * H;
    pts.push(i % 2 === 0 ? [x0, y] : [x1, y]);
    pts.push(i % 2 === 0 ? [x1, y] : [x0, y]);
  }
  const d = 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L');
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = seg[seg.length - 1];
  const e = prog(frame, p.startFrame, p.startFrame + p.durationFrames, ease.linear);
  const at = (t: number): {x: number; y: number} => {
    const L = t * total;
    let k = 1;
    while (k < seg.length - 1 && seg[k] < L) k++;
    const f = (L - seg[k - 1]) / Math.max(1e-6, seg[k] - seg[k - 1]);
    const a = pts[k - 1];
    const b = pts[k];
    return {x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f};
  };
  const eraser = at(e);
  const endF = p.startFrame + p.durationFrames;
  const eraserOn = prog(frame, p.startFrame - 10, p.startFrame, ease.out) * (1 - prog(frame, endF, endF + 14, ease.in));
  const tilt = Math.sin((e * total) / (70 * u)) * 4;

  const draw = prog(frame, 4, 40, ease.inOut);
  const lines = (p.text || '').split('\n');
  const fs = (portrait ? 88 : 84) * u;
  const afterP = prog(frame, endF + 8, endF + 44, ease.inOut);
  const mid = X + W / 2;
  const chartTop = Y + H * 0.05;
  const chartBot = Y + H * 0.7;
  const cw = portrait ? W * 0.92 : Math.min(W * 0.6, 760 * u);
  const bars = [0.34, 0.52, 0.8, 0.46];

  return (
    <AbsoluteFill style={{background: p.background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <mask id="er-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect x={0} y={0} width={w} height={h} fill="#fff" />
            <path d={d} pathLength={1000} fill="none" stroke="#000" strokeOpacity={p.strength} strokeWidth={bandW} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${1000 * e} 1100`} />
          </mask>
          <clipPath id="er-write">
            <rect x={X} y={Y} width={W * draw} height={H + 40 * u} />
          </clipPath>
          <clipPath id="er-after">
            <rect x={X} y={Y} width={W * afterP} height={H + 40 * u} />
          </clipPath>
        </defs>
        {Array.from({length: 7}, (_, i) => (
          <line key={i} x1={0} x2={w} y1={(h / 7) * (i + 0.5)} y2={(h / 7) * (i + 0.5)} stroke={p.ink} strokeOpacity={0.05} strokeWidth={2 * u} />
        ))}
        <g mask="url(#er-mask)">
          <g clipPath="url(#er-write)" fill="none" stroke={p.ink} strokeWidth={5 * u} strokeLinecap="round" strokeLinejoin="round">
            <path d={`M${mid - cw / 2} ${chartTop}V${chartBot}H${mid + cw / 2}`} />
            {bars.map((b, i) => {
              const bwid = cw / 6;
              const bxx = mid - cw / 2 + cw * 0.1 + i * (cw / 4.2);
              const bhh = (chartBot - chartTop) * b;
              return <path key={i} d={`M${bxx} ${chartBot}V${chartBot - bhh}H${bxx + bwid}V${chartBot}`} stroke={i === 2 ? p.accent : p.ink} />;
            })}
            <path d={`M${mid - cw / 2 + 20 * u} ${chartBot - (chartBot - chartTop) * 0.2}C${mid - cw * 0.1} ${chartTop + 40 * u} ${mid + cw * 0.15} ${chartBot - 60 * u} ${mid + cw / 2 - 10 * u} ${chartTop + 20 * u}`} stroke={p.accent} strokeDasharray={`${14 * u} ${12 * u}`} />
          </g>
          <g clipPath="url(#er-write)">
            {lines.map((ln, i) => (
              <text key={i} x={mid} y={chartBot + 100 * u + i * fs * 1.05} textAnchor="middle" fill={p.ink} fontFamily={fonts.hand} fontWeight={700} fontSize={fs}>
                {ln}
              </text>
            ))}
          </g>
        </g>
        {p.after ? (
          <g clipPath="url(#er-after)">
            <text x={mid} y={Y + H * 0.5} textAnchor="middle" fill={p.accent} fontFamily={fonts.hand} fontWeight={700} fontSize={fs * 1.3}>
              {p.after}
            </text>
            <path d={`M${mid - W * 0.22} ${Y + H * 0.5 + 24 * u}Q${mid} ${Y + H * 0.5 + 40 * u} ${mid + W * 0.22} ${Y + H * 0.5 + 16 * u}`} fill="none" stroke={p.accent} strokeWidth={6 * u} strokeLinecap="round" />
          </g>
        ) : null}
        <g opacity={eraserOn} transform={`translate(${eraser.x} ${eraser.y}) rotate(${tilt})`}>
          <ellipse cx={6 * u} cy={44 * u} rx={bandW * 0.5} ry={14 * u} fill="rgba(0,0,0,0.22)" />
          <rect x={-bandW * 0.5} y={-34 * u} width={bandW} height={68 * u} rx={14 * u} fill="#2A2C31" />
          <rect x={-bandW * 0.5} y={-34 * u} width={bandW} height={28 * u} rx={14 * u} fill="#45484f" />
          <rect x={-bandW * 0.5 + 10 * u} y={-4 * u} width={bandW - 20 * u} height={22 * u} rx={5 * u} fill="#E8E4DA" opacity={0.9} />
          <text x={0} y={13 * u} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={15 * u} fill={p.accent} letterSpacing={3 * u}>
            {p.label}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const eraserRewind = defineMotion<Props>({
  id: 'eraser-rewind',
  title: 'Eraser rewind (undo wipe)',
  category: 'fx',
  description:
    'A charcoal felt eraser slides along a zig-zag path at constant speed and wipes a wide band of hand-drawn ink, leaving a faint ghost; then a corrected line is written in. Reads as "undo / rewind time" or a clean whiteboard wipe.',
  source: ['lemo-opuscar styles/whiteboard demo engine (MIT, LemoLab) — Timeline.erase / zigzag / drawEraser, own SVG mask build'],
  useFor: "Undo / rewind beats, \"what if we hadn't…\" storytelling, clean wipes between whiteboard sections, correcting a wrong answer on screen.",
  durationInFrames: 210,
  defaultProps: {
    background: '#F2EFE8',
    ink: '#26282C',
    accent: '#E5462F',
    text: 'we expected 2x growth…',
    after: 'Start again.',
    passes: 5,
    width: 170,
    strength: 0.9,
    startFrame: 62,
    durationFrames: 80,
    box: [0.08, 0.1, 0.84, 0.72],
    label: 'UNDO',
  },
  propDocs: {
    background: 'board colour',
    ink: 'ink colour of the drawing that gets erased',
    accent: 'accent colour (highlight, new text, label)',
    text: 'handwritten line(s) under the chart, \\n for more lines',
    after: 'text written after the wipe (empty = none)',
    passes: 'zig-zag passes',
    width: 'eraser band width in px (90-230)',
    strength: 'how much ink is removed (0.9 leaves a 10 % ghost)',
    startFrame: 'frame the eraser starts',
    durationFrames: 'frames the wipe takes',
    box: '[x, y, w, h] erase area as frame fractions',
    label: 'tiny label on the eraser',
  },
  component: EraserRewind,
  tags: ['eraser', 'undo', 'rewind', 'whiteboard', 'wipe', 'transition', 'erase', 'ink', 'correction'],
});
