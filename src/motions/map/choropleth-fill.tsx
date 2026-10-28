// Choropleth built from ABSTRACT regions: a seeded hex/square tile territory (no real geography is baked in),
// so it can stand for countries, states, stores, teams, ... Name the tiles with `labels`, colour them with `values`.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {n2} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  values: number[];
  labels: string[];
  title: string;
  subtitle: string;
  legendTitle: string;
  prefix: string;
  suffix: string;
  decimals: number;
  shape: 'hex' | 'square';
  colors: string[];
  order: 'wave' | 'value' | 'index';
  showValues: boolean;
  highlight: boolean;
  seed: number;
  speed: number;
  startAt: number;
  background: string;
  empty: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const DEFAULT_VALUES = [12, 34, 58, 41, 27, 66, 83, 49, 72, 91, 38, 54, 19, 63, 77, 45, 29, 88, 52, 31, 69, 24, 57, 40];
const DEFAULT_LABELS = ['AL', 'BE', 'CA', 'DO', 'EL', 'FY', 'GO', 'HA', 'IR', 'JU', 'KE', 'LU', 'MO', 'NE', 'OR', 'PA', 'QU', 'RE', 'SA', 'TA', 'UL', 'VA', 'WE', 'XA'];

const hex = (c: string): [number, number, number] => {
  const m = c.replace('#', '');
  const s = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  return [parseInt(s.slice(0, 2), 16) || 0, parseInt(s.slice(2, 4), 16) || 0, parseInt(s.slice(4, 6), 16) || 0];
};
const rampAt = (colors: string[], t: number) => {
  const cs = colors.length ? colors : ['#222', '#fff'];
  if (cs.length === 1) return cs[0];
  const x = clamp(t) * (cs.length - 1);
  const i = Math.min(cs.length - 2, Math.floor(x));
  const a = hex(cs[i]), b = hex(cs[i + 1]);
  const f = x - i;
  return `rgb(${Math.round(lerp(a[0], b[0], f))},${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))})`;
};
const mixRgb = (c1: string, c2: string, t: number) => {
  const a = hex(c1), b = hex(c2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
};
const lum = (rgb: string) => {
  const m = rgb.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
  return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
};
const fmt = (v: number, d: number) => v.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const ChoroplethFill: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, (frame - p.startAt) * p.speed);
  const values = p.values.length ? p.values : DEFAULT_VALUES;
  const n = values.length;
  const vmin = Math.min(...values);
  const vmax = Math.max(...values);
  const norm = (v: number) => (vmax === vmin ? 0.5 : (v - vmin) / (vmax - vmin));
  const hexMode = p.shape === 'hex';

  // ---- abstract territory: carve n cells out of a blobby grid -------------------------------------
  const cells = React.useMemo(() => {
    const cols = Math.max(3, Math.ceil(Math.sqrt(n * 1.7)));
    const rows = Math.max(3, Math.ceil(n / cols * 1.5) + 1);
    const all: {c: number; r: number; x: number; y: number; score: number}[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c + (hexMode && r % 2 ? 0.5 : 0);
        const y = r * (hexMode ? 0.866 : 1);
        const dx = (x - (cols - 0.5) / 2) / (cols / 2);
        const dy = (y - ((rows - 1) * (hexMode ? 0.866 : 1)) / 2) / ((rows * (hexMode ? 0.866 : 1)) / 2);
        const score = Math.hypot(dx, dy * 1.1) + 0.55 * n2(`cf${p.seed}`, c * 0.55 + 3, r * 0.55 + 7);
        all.push({c, r, x, y, score});
      }
    }
    const pick = all.sort((a, b) => a.score - b.score).slice(0, n);
    return pick.sort((a, b) => a.r - b.r || a.c - b.c);
  }, [n, hexMode, p.seed]);

  // ---- layout ---------------------------------------------------------------------------------------
  const pad = (portrait ? 70 : 90) * u;
  const mapBox = portrait
    ? {x0: pad, y0: 400 * u, x1: w - pad, y1: h - 330 * u}
    : {x0: w * 0.4, y0: 110 * u, x1: w - pad, y1: h - 110 * u};
  const xs = cells.map((q) => q.x), ys = cells.map((q) => q.y);
  const gx0 = Math.min(...xs) - 0.5, gx1 = Math.max(...xs) + 0.5;
  const gy0 = Math.min(...ys) - (hexMode ? 0.58 : 0.5), gy1 = Math.max(...ys) + (hexMode ? 0.58 : 0.5);
  const S = Math.min((mapBox.x1 - mapBox.x0) / (gx1 - gx0), (mapBox.y1 - mapBox.y0) / (gy1 - gy0));
  const ox = (mapBox.x0 + mapBox.x1) / 2 - ((gx0 + gx1) / 2) * S;
  const oy = (mapBox.y0 + mapBox.y1) / 2 - ((gy0 + gy1) / 2) * S;
  const gap = 0.07;
  const R = hexMode ? (S / 1.7320508) * (1 - gap) : 0;

  // ---- reveal order -------------------------------------------------------------------------------
  const rank = values.map((v, i) => ({v, i})).sort((a, b) => a.v - b.v).map((q) => q.i);
  const delayOf = (i: number) => {
    if (p.order === 'index') return (i / Math.max(1, n - 1)) * 60;
    if (p.order === 'value') return (rank.indexOf(i) / Math.max(1, n - 1)) * 60;
    const q = cells[i];
    return ((q.x - gx0) / (gx1 - gx0)) * 45 + ((q.y - gy0) / (gy1 - gy0)) * 15;
  };

  const maxIdx = values.indexOf(vmax);
  const hl = p.highlight ? prog(f, 110, 130, ease.back) : 0;
  const labelAt = (i: number) => p.labels[i] ?? DEFAULT_LABELS[i] ?? '';

  const tiles = cells.map((q, i) => {
    const d = 18 + delayOf(i);
    const t = prog(f, d, d + 26, ease.back);
    const fill = prog(f, d, d + 22, ease.out);
    const cx = ox + q.x * S, cy = oy + q.y * S;
    const base = rampAt(p.colors, norm(values[i]));
    const col = mixRgb(p.empty.startsWith('#') ? p.empty : '#222222', base.startsWith('rgb') ? rgbToHex(base) : base, fill);
    const sc = 0.78 + 0.22 * clamp(t, 0, 1.2);
    const light = lum(col) > 0.58;
    const txt = light ? '#0B1220' : '#FFFFFF';
    const shown = lerp(0, values[i], fill);
    const isMax = i === maxIdx && p.highlight;
    const pop = isMax ? 1 + 0.08 * hl : 1;
    const shapeEl = hexMode ? (
      <polygon points={Array.from({length: 6}, (_, k) => {
        const a = (Math.PI / 180) * (60 * k - 30);
        return `${(R * Math.cos(a)).toFixed(1)},${(R * Math.sin(a)).toFixed(1)}`;
      }).join(' ')} fill={col} stroke={isMax ? p.accent : 'none'} strokeWidth={isMax ? 4 * u * hl : 0} strokeLinejoin="round" />
    ) : (
      <rect x={(-S * (1 - gap)) / 2} y={(-S * (1 - gap)) / 2} width={S * (1 - gap)} height={S * (1 - gap)} rx={S * 0.12} fill={col} stroke={isMax ? p.accent : 'none'} strokeWidth={isMax ? 4 * u * hl : 0} />
    );
    const fs = S * (hexMode ? 0.2 : 0.22);
    return (
      <g key={i} transform={`translate(${cx} ${cy}) scale(${sc * pop})`} opacity={clamp(t * 1.5, 0, 1)}>
        {shapeEl}
        <text y={p.showValues ? -fs * 0.15 : fs * 0.35} textAnchor="middle" fontFamily={p.fontFamily} fontWeight={700} fontSize={fs} fill={txt} opacity={0.85} letterSpacing={fs * 0.05}>
          {labelAt(i)}
        </text>
        {p.showValues ? (
          <text y={fs * 1.05} textAnchor="middle" fontFamily={p.fontFamily} fontWeight={800} fontSize={fs * 1.0} fill={txt}>
            {fmt(shown, p.decimals)}
          </text>
        ) : null}
      </g>
    );
  });

  // ---- legend ---------------------------------------------------------------------------------------
  const lgW = portrait ? w - 2 * pad : Math.min(w * 0.3, 520 * u);
  const lgX = pad;
  const lgY = portrait ? h - 190 * u : h * 0.62;
  const lgFade = prog(f, 10, 30, ease.out);
  const gradId = `cf-grad-${p.seed}`;
  const markerT = p.highlight ? norm(vmax) : 0;
  const tx = pad;
  const ty = portrait ? 190 * u : 200 * u;
  const fade = prog(f, 2, 20, ease.out);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
            {Array.from({length: 9}, (_, k) => (
              <stop key={k} offset={k / 8} stopColor={rampAt(p.colors, k / 8)} />
            ))}
          </linearGradient>
        </defs>
        <g>{tiles}</g>
        <g fontFamily={p.fontFamily} opacity={fade}>
          <text x={tx} y={ty} fontSize={(portrait ? 76 : 64) * u} fontWeight={800} fill={p.ink} letterSpacing={-1 * u}>
            {p.title}
          </text>
          <text x={tx} y={ty + 46 * u} fontSize={26 * u} fill={p.ink} opacity={0.6}>
            {p.subtitle}
          </text>
        </g>
        <g fontFamily={p.fontFamily} opacity={lgFade} transform={`translate(${lgX} ${lgY})`}>
          <text y={-22 * u} fontSize={20 * u} fontWeight={700} fill={p.ink} opacity={0.65} letterSpacing={2 * u}>
            {p.legendTitle.toUpperCase()}
          </text>
          <rect width={lgW} height={22 * u} rx={11 * u} fill={`url(#${gradId})`} />
          <text y={54 * u} fontSize={22 * u} fill={p.ink} opacity={0.75}>
            {p.prefix}{fmt(vmin, p.decimals)}{p.suffix}
          </text>
          <text x={lgW} y={54 * u} textAnchor="end" fontSize={22 * u} fill={p.ink} opacity={0.75}>
            {p.prefix}{fmt(vmax, p.decimals)}{p.suffix}
          </text>
          {p.highlight ? (
            <g transform={`translate(${markerT * lgW} ${-6 * u})`} opacity={hl}>
              <path d={`M0 ${6 * u}L${-9 * u} ${-8 * u}L${9 * u} ${-8 * u}Z`} fill={p.accent} />
              <text y={-16 * u} textAnchor="middle" fontSize={20 * u} fontWeight={800} fill={p.accent}>
                {labelAt(maxIdx)} {p.prefix}{fmt(vmax, p.decimals)}{p.suffix}
              </text>
            </g>
          ) : null}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

function rgbToHex(rgb: string) {
  const m = rgb.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
  return '#' + m.slice(0, 3).map((x) => x.toString(16).padStart(2, '0')).join('');
}

export const choroplethFill = defineMotion<Props>({
  id: 'choropleth-fill',
  title: 'Choropleth fill (tile map + legend)',
  category: 'map',
  description: 'An abstract hex/square tile territory fills region by region with a colour ramp driven by values, with labels, count-ups, a gradient legend and a highest-region callout. Regions are generic tiles, not real borders.',
  source: ['original (round 3)'],
  useFor: 'Regional comparisons (sales by state, scores by team, adoption by country) when you just need the pattern, not exact geography. Name tiles with `labels`; for real borders use painted-choropleth or a map image.',
  durationInFrames: 180,
  defaultProps: {
    values: DEFAULT_VALUES,
    labels: DEFAULT_LABELS,
    title: 'By region',
    subtitle: 'Warmer means higher',
    legendTitle: 'Score',
    prefix: '',
    suffix: '',
    decimals: 0,
    shape: 'hex',
    colors: ['#1E2A4A', '#2F6DB5', '#4CC9F0', '#FFB454'],
    order: 'wave',
    showValues: true,
    highlight: true,
    seed: 4,
    speed: 1,
    startAt: 0,
    background: '#0B1220',
    empty: '#16213A',
    ink: '#E8EEF9',
    accent: '#FFFFFF',
    fontFamily: fonts.sans,
  },
  propDocs: {
    values: 'one number per region (also sets how many tiles there are)',
    labels: 'one short label per region (same order as values)',
    title: 'headline',
    subtitle: 'line under the headline',
    legendTitle: 'legend caption',
    prefix: 'text before legend/callout numbers, e.g. "$"',
    suffix: 'text after legend/callout numbers, e.g. "%"',
    decimals: 'digits after the decimal point',
    shape: '"hex" or "square" tiles',
    colors: 'colour ramp low -> high (2+ hex colours)',
    order: 'fill order: "wave" (left to right), "value" (low to high), "index"',
    showValues: 'print the value on every tile',
    highlight: 'outline + legend marker for the highest region at the end',
    seed: 'changes the territory outline',
    speed: 'timeline speed multiplier',
    startAt: 'frame to start at',
    background: 'background colour or "transparent"',
    empty: 'unfilled tile colour',
    ink: 'text colour',
    accent: 'highlight outline colour',
    fontFamily: 'CSS font-family',
  },
  component: ChoroplethFill,
  tags: ['map', 'choropleth', 'regions', 'heatmap', 'hex', 'tile map', 'legend', 'data', 'statistics', 'countries', 'states'],
});
