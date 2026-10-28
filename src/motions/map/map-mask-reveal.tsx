// Adapted from lemo-opuscar/styles/caption-news/demo/main.js shotMap() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp} from '../../core/ease';
import {Plate, PlatePaletteName, useSafeId} from '../../core/image-kit';
import {n2, rng} from '../../core/random';
import {eo3, eio3, lf, mixC, seg} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Caption-news map shot: a choropleth of a (fictional, procedural) country fills in west → east; one region
 * is outlined in the accent with a leader label and held; the camera pushes into it, then a photo of the
 * place grows out of the region's own outline until it fills the frame.
 */
type Props = {
  regions: number;
  regionIndex: number;
  label: string;
  value: string;
  src: string;
  seed: number;
  palette: PlatePaletteName;
  low: string;
  high: string;
  accent: string;
  background: string;
  pushAt: number;
  maskAt: number;
  title: string;
};

type Region = {d: string; cx: number; cy: number; v: number; col: number; area: number};

/** jittered-grid "states" clipped to a noisy coastline (shared vertices → no gaps) */
const buildMap = (seed: number, cols: number, rows: number): Region[] => {
  const r = rng(seed);
  const V: [number, number][][] = [];
  for (let j = 0; j <= rows; j++) {
    V.push([]);
    for (let i = 0; i <= cols; i++) {
      const edge = i === 0 || j === 0 || i === cols || j === rows;
      V[j].push([i / cols + (edge ? 0 : (r() - 0.5) * 0.55 / cols), j / rows + (edge ? 0 : (r() - 0.5) * 0.55 / rows)]);
    }
  }
  const inside = (x: number, y: number) => {
    const dx = (x - 0.5) / 0.5;
    const dy = (y - 0.5) / 0.5;
    const a = Math.atan2(dy, dx);
    const rad = 0.92 + 0.12 * n2('coast' + seed, Math.cos(a) * 1.3, Math.sin(a) * 1.3);
    return dx * dx * 0.85 + dy * dy * 1.1 < rad * rad;
  };
  const out: Region[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const q = [V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]];
      const cx = q.reduce((a, b) => a + b[0], 0) / 4;
      const cy = q.reduce((a, b) => a + b[1], 0) / 4;
      if (!inside(cx, cy)) continue;
      // wobble each edge with noise keyed on its midpoint (shared edges match)
      const pts: [number, number][] = [];
      for (let e = 0; e < 4; e++) {
        const A = q[e];
        const B = q[(e + 1) % 4];
        pts.push(A);
        for (let s = 1; s < 4; s++) {
          const t = s / 4;
          const mx = A[0] + (B[0] - A[0]) * t;
          const my = A[1] + (B[1] - A[1]) * t;
          const key = Math.round((mx + my * 7.13) * 4000);
          const off = n2('edge' + seed, key * 0.01, 0) * 0.012;
          const nx = -(B[1] - A[1]);
          const ny = B[0] - A[0];
          const nl = Math.hypot(nx, ny) || 1;
          const sgn = A[0] + A[1] < B[0] + B[1] ? 1 : -1; // orientation-independent
          pts.push([mx + (nx / nl) * off * sgn, my + (ny / nl) * off * sgn]);
        }
      }
      out.push({d: 'M' + pts.map(([x, y]) => `${x.toFixed(4)} ${y.toFixed(4)}`).join(' L') + ' Z', cx, cy, v: 0.15 + 0.85 * ((n2('val' + seed, cx * 3, cy * 3) + 1) / 2), col: i, area: 1});
    }
  return out;
};

const MapMask: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('mapmask');
  const cols = Math.max(4, Math.round(Math.sqrt(p.regions * 1.5)));
  const rows = Math.max(3, Math.round(p.regions / cols));
  const regs = useMemo(() => buildMap(p.seed, cols, rows), [p.seed, cols, rows]);
  const sel = regs[Math.min(regs.length - 1, Math.max(0, p.regionIndex < 0 ? Math.floor(regs.length * 0.55) : p.regionIndex))];
  // map box (map units 0..1 → px)
  const M = portrait ? w * 0.92 : Math.min(w * 0.62, h * 1.25);
  const MH = M * 0.62;
  const mx = (w - M) / 2;
  const my = (h - MH) / 2 + (portrait ? -h * 0.04 : h * 0.03);
  const sx = (x: number) => mx + x * M;
  const sy = (y: number) => my + y * MH;
  // fill ticks west → east
  const fillK = (c: number) => eo3(seg(frame, 6 + c * 2.4, 14 + c * 2.4));
  const outline = eo3(seg(frame, 6 + cols * 2.4, 22 + cols * 2.4));
  // camera push into the region (1.3 s)
  const push = eio3(seg(frame, p.pushAt, p.pushAt + 39));
  const scx = sx(sel.cx);
  const scy = sy(sel.cy);
  const Zend = Math.min(w, h) / ((M / cols) * 1.6);
  const Z = lerp(1, Zend, push);
  const cam = `translate(${lerp(w / 2, w / 2, push)} ${lerp(h / 2, h / 2, push)}) scale(${Z}) translate(${-lerp(w / 2, scx, push)} ${-lerp(h / 2, scy, push)})`;
  // photo grows out of the outline (0.6 s, ease-in)
  const mk = ease.in(seg(frame, p.maskAt, p.maskAt + 18));
  const coverK = (1.8 * Math.hypot(w, h)) / ((Z * M) / cols);
  const clipS = Z * lerp(1, coverK, mk);
  const rsx = w / 2 + (scx - lerp(w / 2, scx, push)) * Z;
  const rsy = h / 2 + (scy - lerp(h / 2, scy, push)) * Z;
  const clipT = `translate(${rsx} ${rsy}) scale(${clipS * M} ${clipS * MH}) translate(${-sel.cx} ${-sel.cy})`;
  const labelIn = eo3(seg(frame, 14 + cols * 2.4, 28 + cols * 2.4)) * (1 - seg(frame, p.pushAt, p.pushAt + 12));
  const titleIn = eo3(seg(frame, 2, 16)) * (1 - seg(frame, p.pushAt, p.pushAt + 10));
  const capIn = eo3(seg(frame, p.maskAt + 20, p.maskAt + 32));

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <clipPath id={`${id}-clip`}>
            <path d={sel.d} transform={clipT} />
          </clipPath>
        </defs>
        <g transform={cam}>
          <g transform={`translate(${mx} ${my}) scale(${M} ${MH})`}>
            {regs.map((r2, i) => (
              <path key={i} d={r2.d} fill={mixC(p.background, mixC(p.low, p.high, r2.v), fillK(r2.col))} stroke={p.background} strokeWidth={1.6 / M} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={sel.d} fill="none" stroke={p.accent} strokeWidth={4 * u} vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={`${outline} 2`} />
          </g>
          {labelIn > 0 && (
            <g opacity={labelIn}>
              <line x1={scx} y1={scy} x2={scx + 120 * u} y2={scy - 120 * u} stroke="#F7F5EF" strokeWidth={2 * u} />
              <circle cx={scx} cy={scy} r={6 * u} fill={p.accent} />
              <text x={scx + 130 * u} y={scy - 130 * u} fontFamily={lf.sans} fontWeight={800} fontSize={44 * u} fill="#F7F5EF">
                {p.label}
              </text>
              <text x={scx + 130 * u} y={scy - 84 * u} fontFamily={lf.sans} fontWeight={600} fontSize={30 * u} fill={p.accent}>
                {p.value}
              </text>
            </g>
          )}
        </g>
        {titleIn > 0 && (
          <text x={w * 0.0625} y={(portrait ? 180 : 110) * u} fontFamily={lf.sans} fontWeight={800} fontSize={(portrait ? 58 : 54) * u} fill="#F7F5EF" opacity={titleIn}>
            {p.title}
          </text>
        )}
      </Svg>
      {mk > 0 && (
        <AbsoluteFill style={{clipPath: `url(#${id}-clip)`}}>
          <Plate src={p.src || undefined} seed={p.seed + 2} palette={p.palette} />
        </AbsoluteFill>
      )}
      {mk > 0 && (
        <Svg>
          <path d={sel.d} transform={clipT} fill="none" stroke={p.accent} strokeWidth={4 * u} vectorEffect="non-scaling-stroke" opacity={1 - clamp(mk * 1.2)} />
        </Svg>
      )}
      {capIn > 0 && (
        <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(14,14,12,0) 55%, rgba(14,14,12,${0.84 * capIn}) 100%)`}}>
          <div style={{position: 'absolute', left: w * 0.0625, bottom: h * 0.09, fontFamily: lf.sans, fontWeight: 800, fontSize: (portrait ? 72 : 80) * u, color: '#F7F5EF', opacity: capIn}}>
            {p.label}
            <div style={{fontSize: (portrait ? 34 : 32) * u, fontWeight: 600, color: p.accent, marginTop: 8 * u}}>{p.value}</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const mapMaskReveal = defineMotion<Props>({
  id: 'map-mask-reveal',
  title: 'Map mask reveal',
  category: 'map',
  description:
    'A choropleth map fills in west to east; one region is outlined in the accent with a leader label, the camera pushes into it, then a photo of the place grows out of the region\'s own outline until it fills the frame.',
  source: ['lemo-opuscar styles/caption-news demo/main.js shotMap(); tools/map_prep.py (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §8 map-mask-reveal'],
  useFor: 'Location stories, store / branch reveals, travel and real-estate videos, regional news.',
  durationInFrames: 165,
  defaultProps: {
    regions: 40,
    regionIndex: -1,
    label: 'Northwind County',
    value: '+18 % new homes',
    src: '',
    seed: 4,
    palette: 'dusk',
    low: '#3a3a34',
    high: '#FFC21A',
    accent: '#FF4A3D',
    background: '#0E0E0C',
    pushAt: 70,
    maskAt: 112,
    title: 'Where the homes went up',
  },
  propDocs: {
    regions: 'approximate number of procedural regions',
    regionIndex: 'index of the highlighted region (-1 = an inland default)',
    label: 'region name (leader label and final caption)',
    value: 'figure under the name',
    src: 'public/ photo of the place (empty = procedural plate)',
    seed: 'map shape + values seed',
    palette: 'procedural photo palette',
    low: 'choropleth low colour',
    high: 'choropleth high colour',
    accent: 'region outline colour',
    background: 'sea / background colour',
    pushAt: 'frame the camera push starts (1.3 s)',
    maskAt: 'frame the photo starts growing out of the outline',
    title: 'headline over the map',
  },
  component: MapMask,
  tags: ['map', 'choropleth', 'region', 'location', 'mask', 'reveal', 'photo', 'push in', 'news', 'travel', 'real estate', 'geography', 'transition'],
});
