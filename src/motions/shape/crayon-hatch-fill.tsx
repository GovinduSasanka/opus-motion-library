// Adapted from lemo-opuscar/styles/crayon-book/demo/crayon.js fill() + line() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {BPt, CRAYON, CrayonFill, CrayonFilter, CrayonLine, CrayonPaper, boilStep, eio, eo, la2Fonts, seg, shash} from '../../core/r2-la2-kit';

/**
 * crayon-hatch-fill — "colouring in is an action": a hand-drawn bar chart on toothy paper. Each bar's indigo
 * outline draws on, then it is coloured with back-and-forth zig-zag wax strokes that overshoot the line, row by
 * row, each pass at a slightly different pressure; the hero bar gets a lighter cross-hatch. Lines boil at 12 fps.
 */
type Props = {
  title: string;
  labels: string[];
  values: number[];
  colors: string[];
  unit: string;
  highlight: number;
  angle: number;
  gap: number;
  pressure: number;
  overshoot: number;
  cross: boolean;
  boil: boolean;
  paperColor: string;
  inkColor: string;
  stagger: number;
};

const handRect = (x0: number, y0: number, x1: number, y1: number, seed: number, j: number): BPt[] => {
  const jj = (k: number) => (shash(seed, k) - 0.5) * j;
  return [
    [x0 + jj(1), y1 + jj(2) * 0.3],
    [x0 + jj(3), y0 + jj(4)],
    [x1 + jj(5), y0 + jj(6)],
    [x1 + jj(7), y1 + jj(8) * 0.3],
  ];
};
/** outline as one open stroke that goes round and overshoots its start a little */
const outlinePath = (r: BPt[], over: number): BPt[] => {
  const [a] = r;
  const b = r[1];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [...r, a, [a[0] + (dx / L) * over, a[1] + (dy / L) * over]];
};

const CrayonHatchFill: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const st = p.boil ? boilStep(frame) : 0;
  const n = Math.max(1, Math.min(p.values.length, 8));
  const vmax = Math.max(...p.values.slice(0, n), 1);
  const x0 = w * (portrait ? 0.1 : 0.14);
  const x1 = w * (portrait ? 0.9 : 0.86);
  const base = h * (portrait ? 0.72 : 0.82);
  const top = h * (portrait ? 0.34 : 0.27);
  const slot = (x1 - x0) / n;
  const bw = slot * 0.6;
  const fid = 'chf-crayon';
  const pid = 'chf-paper';
  const textSize = Math.min(54 * u, slot * 0.32);
  // timeline (frames)
  const axisT = seg(frame, 4, 26);
  const titleT = seg(frame, 8, 36);
  const barStart = (i: number) => 22 + i * p.stagger;
  const els: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const v = p.values[i];
    const cx = x0 + slot * (i + 0.5);
    const bh = (base - top) * (v / vmax);
    const rect = handRect(cx - bw / 2, base - bh, cx + bw / 2, base, i * 7 + 3, 6 * u);
    const t0 = barStart(i);
    const lineT = eio(seg(frame, t0, t0 + 16));
    const fillT = seg(frame, t0 + 12, t0 + 12 + 26 + bh / (24 * u));
    const col = p.colors[i % p.colors.length] ?? CRAYON.yellow;
    const hero = i === p.highlight;
    els.push(
      <g key={i}>
        {fillT > 0 && (
          <CrayonFill
            poly={rect}
            color={col}
            step={st + i * 3}
            seed={i * 11 + 2}
            p={p.pressure * (hero ? 1.1 : 1)}
            ang={p.angle + (i % 2 ? 0.08 : -0.06)}
            gap={p.gap * u}
            w={p.gap * 1.05 * u}
            over={p.overshoot * u}
            draw={fillT}
            cross={p.cross && hero && fillT >= 1}
          />
        )}
        <CrayonLine pts={outlinePath(rect, 12 * u)} color={p.inkColor} step={st + i} seed={i * 5 + 1} w={7 * u} p={0.72} draw={lineT} />
      </g>,
    );
    const lt = seg(frame, t0 + 10, t0 + 30);
    const vt = seg(frame, t0 + 30, t0 + 46);
    const jit = (k: number) => (p.boil ? (shash(st * 1.7 + i, k) - 0.5) * 1.6 * u : 0);
    labels.push(
      <g key={`l${i}`}>
        <text x={cx + jit(1)} y={base + textSize * 1.35 + jit(2)} textAnchor="middle" fontFamily={la2Fonts.patrick} fontSize={textSize} fill={p.inkColor} opacity={0.88 * lt}>
          {p.labels[i] ?? ''}
        </text>
        <text
          x={cx + jit(3)}
          y={base - bh - textSize * 0.45 + jit(4) + (1 - eo(vt)) * 10 * u}
          textAnchor="middle"
          fontFamily={la2Fonts.gaegu}
          fontWeight={700}
          fontSize={textSize * (hero ? 1.25 : 1)}
          fill={hero ? CRAYON.red : p.inkColor}
          opacity={0.9 * vt}
        >
          {`${v}${p.unit}`}
        </text>
      </g>,
    );
  }
  // ground line + title
  const axis: BPt[] = [
    [x0 - slot * 0.25, base + 2 * u],
    [x1 + slot * 0.25, base - 3 * u],
  ];
  const titleSize = Math.min(86 * u, (w * 0.8) / Math.max(6, p.title.length * 0.5));
  const titleChars = [...p.title];
  const shown = titleT * (titleChars.length + 1);
  return (
    <AbsoluteFill style={{background: p.paperColor}}>
      <Svg>
        <defs>
          <CrayonFilter id={fid} scale={u} />
        </defs>
        <CrayonPaper id={pid} w={w} h={h} color={p.paperColor} scale={u} />
        <g filter={`url(#${fid})`}>
          <CrayonLine pts={axis} color={p.inkColor} step={st + 9} seed={41} w={7 * u} p={0.85} draw={eio(axisT)} />
          {els}
          {labels}
          <text x={w / 2} y={h * (portrait ? 0.17 : 0.15)} textAnchor="middle" fontFamily={la2Fonts.gaegu} fontWeight={700} fontSize={titleSize} fill={p.inkColor} opacity={0.92}>
            {titleChars.map((c, k) => (
              <tspan key={k} opacity={Math.max(0, Math.min(1, shown - k))} dy={p.boil ? (shash(st + k, 3) - (k ? shash(st + k - 1, 3) : 0.5)) * 2.4 * u : 0}>
                {c}
              </tspan>
            ))}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const crayonHatchFill = defineMotion<Props>({
  id: 'crayon-hatch-fill',
  title: 'Crayon hatch fill',
  category: 'shape',
  description:
    'A hand-drawn bar chart on toothy paper: indigo crayon outlines draw on, then each bar is coloured in with back-and-forth zig-zag wax strokes that overshoot the line row by row; the hero bar gets a cross-hatch, values are hand-lettered, lines boil at 12 fps.',
  source: ['lemo-opuscar styles/crayon-book (MIT, LemoLab) — demo/crayon.js fill(), line()'],
  useFor: 'Colouring-in as an action: kids/education charts, playful reports, filling a bar, region or silhouette by hand.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Books we read',
    labels: ['Spring', 'Summer', 'Autumn', 'Winter'],
    values: [12, 19, 15, 27],
    colors: [CRAYON.sky, CRAYON.yellow, CRAYON.orange, CRAYON.red],
    unit: '',
    highlight: 3,
    angle: 0.62,
    gap: 10.5,
    pressure: 0.66,
    overshoot: 7,
    cross: true,
    boil: true,
    paperColor: CRAYON.paper,
    inkColor: CRAYON.ink,
    stagger: 30,
  },
  propDocs: {
    title: 'hand-lettered title',
    labels: 'one label per bar',
    values: 'bar values (up to 8)',
    colors: 'crayon colour per bar (cycled)',
    unit: 'suffix after each value, e.g. "%"',
    highlight: 'index of the hero bar (red value + cross-hatch), -1 for none',
    angle: 'hatch angle in radians (0.62 = source)',
    gap: 'hatch row spacing in px@1080',
    pressure: 'crayon pressure 0..1 (light = speckled, heavy = near-solid)',
    overshoot: 'how far strokes run past the outline (px@1080)',
    cross: 'lighter cross-hatch pass on the hero bar',
    boil: 'lines re-jitter 12 times a second',
    paperColor: 'drawing paper colour',
    inkColor: 'outline / lettering crayon (never black)',
    stagger: 'frames between bars',
  },
  component: CrayonHatchFill,
  tags: ['crayon', 'hatch', 'colouring', 'zig-zag', 'wax', 'picture-book', 'kids', 'hand-drawn', 'bar-chart', 'chart', 'boil', 'paper', 'education', 'fill'],
});
