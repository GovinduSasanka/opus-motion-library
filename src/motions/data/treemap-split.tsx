import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {Header, clip, fmt, itemColor, ramp, resolveFont, textOn, useChartBox, wrapLines} from '../../core/r3-chart-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Item = {label: string; value: number; color?: string};
type Props = {
  data: Item[];
  title: string;
  subtitle: string;
  prefix: string;
  suffix: string;
  decimals: number;
  showValue: boolean;
  showShare: boolean;
  colorMode: 'palette' | 'value';
  lowColor: string;
  highColor: string;
  gap: number;
  radius: number;
  highlight: string;
  colors: string[];
  background: string;
  ink: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const DEFAULT_DATA: Item[] = [
  {label: 'Software', value: 380},
  {label: 'Hardware', value: 240},
  {label: 'Services', value: 190},
  {label: 'Cloud', value: 150},
  {label: 'Support', value: 90},
  {label: 'Training', value: 60},
  {label: 'Licensing', value: 45},
  {label: 'Partners', value: 30},
  {label: 'Other', value: 20},
];

type R = {x: number; y: number; w: number; h: number};
type Cell = {item: Item; i: number; rect: R; row: R; share: number};

/** squarified treemap (Bruls et al.); returns cells plus the strip (row) rectangle each cell belongs to */
const squarify = (items: {item: Item; i: number; v: number}[], area: R): Cell[] => {
  const total = items.reduce((a, b) => a + b.v, 0) || 1;
  const scale = (area.w * area.h) / total;
  const out: Cell[] = [];
  let rest = items.map((it) => ({...it, a: it.v * scale}));
  let r = {...area};
  const worst = (row: {a: number}[], side: number) => {
    const s = row.reduce((a, b) => a + b.a, 0);
    const mx = Math.max(...row.map((q) => q.a));
    const mn = Math.min(...row.map((q) => q.a));
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  while (rest.length) {
    const horiz = r.w >= r.h; // lay the strip along the short side
    const side = horiz ? r.h : r.w;
    let row = [rest[0]];
    let k = 1;
    while (k < rest.length && worst([...row, rest[k]], side) <= worst(row, side)) {
      row.push(rest[k]);
      k++;
    }
    const s = row.reduce((a, b) => a + b.a, 0);
    const thick = side > 0 ? s / side : 0;
    const strip: R = horiz ? {x: r.x, y: r.y, w: thick, h: r.h} : {x: r.x, y: r.y, w: r.w, h: thick};
    let off = 0;
    row.forEach((q) => {
      const len = s > 0 ? (q.a / s) * side : 0;
      const rect: R = horiz ? {x: r.x, y: r.y + off, w: thick, h: len} : {x: r.x + off, y: r.y, w: len, h: thick};
      off += len;
      out.push({item: q.item, i: q.i, rect, row: strip, share: q.v / total});
    });
    r = horiz ? {x: r.x + thick, y: r.y, w: Math.max(0, r.w - thick), h: r.h} : {x: r.x, y: r.y + thick, w: r.w, h: Math.max(0, r.h - thick)};
    rest = rest.slice(k);
  }
  return out;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return [128, 128, 128];
  let s = m[1];
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)) as [number, number, number];
};
const mixHex = (a: string, b: string, t: number) => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};

const TreemapSplit: React.FC<Props> = ({
  data,
  title,
  subtitle,
  prefix,
  suffix,
  decimals,
  showValue,
  showShare,
  colorMode,
  lowColor,
  highColor,
  gap,
  radius,
  highlight,
  colors,
  background,
  ink,
  fontFamily,
  startAt,
  speed,
}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useStage();
  const box = useChartBox(title, subtitle);
  const font = resolveFont(fontFamily);

  const rows = (data || []).filter((d) => d && d.value > 0);
  const sorted = rows.map((item, i) => ({item, i, v: item.value})).sort((a, b) => b.v - a.v);
  const container: R = {x: box.x, y: box.y, w: box.w, h: box.h};
  const cells = squarify(sorted, container);
  const minV = Math.min(...rows.map((r) => r.value), 0);
  const maxV = Math.max(...rows.map((r) => r.value), 1);

  const t1 = ramp(frame, startAt, 34, speed, ease.inOut); // container splits into strips
  const t2 = ramp(frame, startAt + 22, 40, speed, ease.inOut); // strips split into cells
  const fadeIn = prog(frame, startAt - 2, startAt + 10, ease.out);
  const hl = highlight ? cells.findIndex((c) => c.item.label === highlight) : -1;
  const hlT = hl >= 0 ? prog(frame, startAt + 100 / speed, startAt + 122 / speed, ease.out) : 0;
  const g = gap * u;
  const countT = ramp(frame, startAt + 30, 50, speed, ease.out);

  const mixRect = (a: R, b: R, t: number): R => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});

  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <Header box={box} ink={ink} fontFamily={font} frame={frame} />
        {cells.map((c, k) => {
          const strip = mixRect(container, c.row, t1);
          const r = mixRect(strip, c.rect, t2);
          const col = c.item.color || (colorMode === 'value' ? mixHex(lowColor, highColor, (c.item.value - minV) / Math.max(1e-9, maxV - minV)) : itemColor(undefined, colors, c.i));
          const isHl = k === hl;
          const dim = hl >= 0 && !isHl ? 1 - 0.6 * hlT : 1;
          const ix = r.x + g / 2;
          const iy = r.y + g / 2;
          const iw = Math.max(0, r.w - g);
          const ih = Math.max(0, r.h - g);
          const rad = Math.min(radius * u, iw / 4, ih / 4);
          const fg = textOn(col);
          // text, fitted to the final cell so it never reflows during the animation
          const fw = Math.max(0, c.rect.w - g - 28 * u);
          const fh = Math.max(0, c.rect.h - g - 24 * u);
          const base = Math.min(40 * u, fw / 5.2, fh / 2.2);
          const size = Math.max(0, base);
          const lines = size >= 15 * u ? wrapLines(c.item.label, fw, size, 0.56, Math.max(1, Math.floor(fh / (size * 1.6)))) : [];
          const valStr = [showValue ? fmt(c.item.value * countT, decimals, prefix, suffix) : '', showShare ? fmt(c.share * 100, 0, '', '%') : ''].filter(Boolean).join('  ·  ');
          const showVal = !!valStr && size >= 15 * u && fh >= (lines.length + 1) * size * 1.4;
          const tt = prog(frame, startAt + 44 / speed, startAt + 64 / speed, ease.out);
          return (
            <g key={c.i} opacity={fadeIn * dim}>
              <rect x={ix} y={iy} width={iw} height={ih} rx={rad} fill={col} />
              {isHl && <rect x={ix - 3 * u * hlT} y={iy - 3 * u * hlT} width={iw + 6 * u * hlT} height={ih + 6 * u * hlT} rx={rad} fill="none" stroke={ink} strokeWidth={3 * u} strokeOpacity={hlT} />}
              {lines.length > 0 && (
                <g opacity={tt}>
                  {lines.map((l, li) => (
                    <text
                      key={li}
                      x={ix + 14 * u}
                      y={iy + 14 * u + size * 0.95 + li * size * 1.12}
                      fontFamily={font}
                      fontWeight={700}
                      fontSize={size}
                      fill={fg}
                    >
                      {clip(l, fw + 8 * u, size)}
                    </text>
                  ))}
                  {showVal && (
                    <text
                      x={ix + 14 * u}
                      y={iy + 14 * u + size * 0.95 + lines.length * size * 1.12 + size * 0.28}
                      fontFamily={font}
                      fontWeight={500}
                      fontSize={size * 0.78}
                      fill={fg}
                      fillOpacity={0.82}
                      style={{fontVariantNumeric: 'tabular-nums'}}
                    >
                      {clip(valStr, fw + 8 * u, size * 0.78, 0.58)}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const treemapSplit = defineMotion<Props>({
  id: 'treemap-split',
  title: 'Treemap split',
  category: 'data',
  description:
    'A squarified treemap: one block fills the chart area, splits into strips and then into value-sized rectangles, each labelled with its name, a count-up value and share; colour by palette or by value, with an optional highlighted tile.',
  source: ['original round-3 chart motion'],
  useFor:
    'Part-to-whole with many items: portfolio or budget breakdowns, disk usage, market caps, revenue by product, survey categories, file sizes. Pass data as [{label, value, color?}], set prefix / suffix and colours; works on a transparent background.',
  durationInFrames: 180,
  defaultProps: {
    data: DEFAULT_DATA,
    title: 'Revenue by product line',
    subtitle: 'Area shows share of total revenue',
    prefix: '$',
    suffix: 'M',
    decimals: 0,
    showValue: true,
    showShare: true,
    colorMode: 'palette',
    lowColor: '#BFD4FF',
    highColor: '#1C4FD8',
    gap: 8,
    radius: 14,
    highlight: '',
    colors: ['#2F6FED', '#FF7A45', '#16B39A', '#F2B134', '#8E5CF0', '#E5487F', '#5BC0EB', '#7A8794'],
    background: '#F5F3EE',
    ink: '#18212B',
    fontFamily: '',
    startAt: 10,
    speed: 1,
  },
  propDocs: {
    data: 'tiles [{label, value, color?}]; any count, values are relative, sorted largest first',
    title: 'headline (empty = none)',
    subtitle: 'small line under the headline (empty = none)',
    prefix: 'text before every number, e.g. "$"',
    suffix: 'text after every number, e.g. "M", " GB"',
    decimals: 'decimal places on the values',
    showValue: 'print the (counting-up) value in each tile',
    showShare: 'print the percentage share in each tile',
    colorMode: '"palette" (one colour per tile) or "value" (low-to-high gradient)',
    lowColor: 'colour of the smallest tile when colorMode is "value"',
    highColor: 'colour of the largest tile when colorMode is "value"',
    gap: 'gap between tiles in u',
    radius: 'tile corner radius in u',
    highlight: 'label of a tile to outline and spotlight at the end (empty = none)',
    colors: 'palette for tiles without their own colour',
    background: 'page colour, or "transparent" to sit over other content',
    ink: 'text colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the split starts',
    speed: 'animation speed multiplier',
  },
  component: TreemapSplit,
  tags: ['treemap', 'tiles', 'chart', 'breakdown', 'share', 'proportion', 'infographic', 'data', 'overlay', 'statistics', 'budget', 'portfolio'],
});
