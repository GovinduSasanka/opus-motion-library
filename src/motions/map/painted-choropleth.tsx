// Technique after lemo-opuscar styles/watercolor demo/main.js map section (MSTOP, mapTau) (MIT, LemoLab) — see THIRD_PARTY_NOTICES.md.
// Own SVG implementation: IDW field on a grid, quantised bands, goo-filter wash edges (3-pass paint look).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog, tween} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {n2} from '../../core/random';
import {PaperTexture, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Station = {x: number; y: number; value: number};
type Props = {
  title: string;
  subtitle: string;
  unit: string;
  bands: number[];
  colors: string[];
  stations: Station[];
  timeKeys: number[][];
  yearFrom: number;
  yearTo: number;
  yearUnit: string;
  finalLabel: string;
  reveal: 'radial' | 'coast';
  passes: number;
  background: string;
  ink: string;
  seed: number;
};

const GW = 64;
const GH = 46;
const MW = 1000;
const MH = 700;

const DEFAULT_STATIONS: Station[] = [
  {x: 220, y: 210, value: 300},
  {x: 380, y: 160, value: 650},
  {x: 560, y: 190, value: 1150},
  {x: 760, y: 240, value: 2000},
  {x: 830, y: 400, value: 3200},
  {x: 700, y: 520, value: 4000},
  {x: 520, y: 470, value: 1500},
  {x: 330, y: 480, value: 700},
  {x: 190, y: 400, value: 240},
  {x: 480, y: 330, value: 900},
  {x: 640, y: 340, value: 1700},
  {x: 360, y: 330, value: 420},
];

const PaintedChoropleth: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const sd = `pc${p.seed}`;
  const stations = p.stations.length ? p.stations : DEFAULT_STATIONS;

  // ---- layout -----------------------------------------------------------------------------------
  const mapW = portrait ? w - 80 * u : w * 0.6;
  const mapH = portrait ? h * 0.46 : h - 120 * u;
  const S = Math.min(mapW / MW, mapH / MH);
  const mx = portrait ? (w - MW * S) / 2 : 60 * u + (mapW - MW * S) / 2;
  const my = portrait ? 150 * u : (h - MH * S) / 2;

  // ---- coast polygon ------------------------------------------------------------------------------
  const coast = React.useMemo(() => {
    const pts: [number, number][] = [];
    const N = 90;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const ex = Math.cos(a);
      const ey = Math.sin(a);
      const r = 1 + 0.2 * n2(sd, ex * 1.6 + 4, ey * 1.6 + 4) + 0.08 * n2(sd, ex * 4 + 9, ey * 4 + 9);
      pts.push([500 + 380 * ex * r, 350 + 260 * ey * r]);
    }
    return 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L') + 'Z';
  }, [sd]);
  const coastSmooth = coast;

  // ---- time morph ---------------------------------------------------------------------------------
  const keys = p.timeKeys.length ? p.timeKeys : [[0, 1]];
  const tau = keys.length > 1 ? tween(frame, [keys[0][0], keys[keys.length - 1][0]], [0, 1], (t) => t) : 1;
  let tauV = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (frame >= keys[i][0]) tauV = keys[i][1];
    else if (frame > keys[i - 1][0]) tauV = keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * ease.inOut((frame - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
    if (frame <= keys[i][0]) break;
  }
  void tau;
  const yearP = keys.length > 1 ? Math.min(1, Math.max(0, (tauV - keys[0][1]) / (keys[keys.length - 1][1] - keys[0][1] || 1))) : 1;
  const yearNow = Math.round(p.yearFrom + (p.yearTo - p.yearFrom) * yearP);
  const label = yearP >= 0.999 && p.finalLabel ? p.finalLabel : `${yearNow} ${p.yearUnit}`;

  // ---- field + band grid --------------------------------------------------------------------------
  const K = p.bands.length;
  const cellW = MW / GW;
  const cellH = MH / GH;
  const bandGrid: number[] = new Array(GW * GH);
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const x = (i + 0.5) * cellW;
      const y = (j + 0.5) * cellH;
      let sw = 0;
      let sv = 0;
      for (const st of stations) {
        const d2 = (x - st.x) * (x - st.x) + (y - st.y) * (y - st.y) + 400;
        const wgt = 1 / (d2 * d2);
        sw += wgt;
        sv += wgt * Math.log(Math.max(1, st.value));
      }
      const v = Math.exp(sv / sw) * tauV * (1 + 0.12 * n2(sd, x * 0.01, y * 0.01 + frame * 0.002));
      let b = 0;
      for (let k = 0; k < K; k++) if (v >= p.bands[k]) b = k + 1;
      bandGrid[j * GW + i] = b;
    }
  }
  const bandRects = (k: number) => {
    const out: React.ReactNode[] = [];
    for (let j = 0; j < GH; j++) {
      let run = -1;
      for (let i = 0; i <= GW; i++) {
        const on = i < GW && bandGrid[j * GW + i] >= k;
        if (on && run < 0) run = i;
        if (!on && run >= 0) {
          out.push(<rect key={`${j}-${run}`} x={run * cellW - 1} y={j * cellH - 1} width={(i - run) * cellW + 2} height={cellH + 2} />);
          run = -1;
        }
      }
    }
    return out;
  };

  // ---- reveal -----------------------------------------------------------------------------------------
  const coastP = prog(frame, 6, 50, ease.inOut);
  const fillP = p.reveal === 'radial' ? prog(frame, 40, 100, ease.inOut) : prog(frame, 44, 96, ease.sine);
  const revealR = fillP * 700;

  const passes = Math.max(1, Math.min(3, p.passes));
  const offs: [number, number][] = [
    [0, 0],
    [3, -2],
    [-2, 3],
  ];
  const textX = portrait ? w / 2 : w * 0.68 + 20 * u;
  const textW = portrait ? w - 120 * u : w * 0.3;
  const legTop = portrait ? my + MH * S + 400 * u : h * 0.5;
  const titleIn = prog(frame, 10, 34, ease.out);
  const legendIn = prog(frame, 70, 100, ease.out);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <PaperTexture opacity={0.4} tint="#8a7350" />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          {Array.from({length: passes}, (_, pi) => (
            <filter key={pi} id={`pc-f${pi}`} x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation={6} result="b" />
              <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -7" result="g" />
              <feTurbulence type="fractalNoise" baseFrequency={0.018 + pi * 0.006} numOctaves={2} seed={p.seed + pi * 7} result="t" />
              <feDisplacementMap in="g" in2="t" scale={16} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          ))}
          <filter id="pc-edge" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={0.03} numOctaves={2} seed={p.seed + 3} result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale={7} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <clipPath id="pc-land">
            <path d={coastSmooth} />
          </clipPath>
          <clipPath id="pc-reveal">
            <circle cx={500} cy={350} r={revealR} />
          </clipPath>
        </defs>
        <g transform={`translate(${mx} ${my}) scale(${S})`}>
          {/* coastal halo + land base */}
          <path d={coastSmooth} fill="none" stroke="#9fb6c4" strokeOpacity={0.22 * coastP} strokeWidth={46} strokeLinejoin="round" filter="url(#pc-edge)" />
          <path d={coastSmooth} fill="#EADFC8" fillOpacity={Math.min(1, coastP * 1.4)} filter="url(#pc-edge)" />
          <g clipPath="url(#pc-land)">
            <g clipPath="url(#pc-reveal)">
              {Array.from({length: passes}, (_, pi) => (
                <g key={pi} transform={`translate(${offs[pi][0]} ${offs[pi][1]})`} opacity={passes === 1 ? 0.95 : pi === 0 ? 0.8 : 0.45}>
                  {p.bands.map((_, k) => (
                    <g key={k} fill={p.colors[k % p.colors.length]} filter={`url(#pc-f${pi})`}>
                      {bandRects(k + 1)}
                    </g>
                  ))}
                </g>
              ))}
            </g>
          </g>
          {/* brushed coastline */}
          <path d={coastSmooth} pathLength={1000} fill="none" stroke={p.ink} strokeOpacity={0.75} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${1000 * coastP} 1100`} filter="url(#pc-edge)" />
          <path d={coastSmooth} pathLength={1000} fill="none" stroke={p.ink} strokeOpacity={0.3} strokeWidth={2} strokeDasharray="30 9 80 14 50 7" strokeDashoffset={-40} transform="translate(2 3)" opacity={coastP} />
        </g>
      </svg>
      <div style={{position: 'absolute', left: portrait ? textX - textW / 2 : w * 0.66, top: portrait ? my + MH * S + 20 * u : h * 0.12, width: textW, textAlign: portrait ? 'center' : 'left', color: p.ink, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20 * u}px)`}}>
        <div style={{fontFamily: fonts.serif, fontWeight: 700, fontSize: 56 * u, lineHeight: 1.05}}>{p.title}</div>
        <div style={{fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 28 * u, opacity: 0.7, marginTop: 8 * u}}>{p.subtitle}</div>
        <div style={{fontFamily: fonts.serif, fontWeight: 500, fontSize: (portrait ? 130 : 150) * u, lineHeight: 1, marginTop: 28 * u, color: '#7a4a2a', whiteSpace: 'nowrap'}}>{label}</div>
      </div>
      <div style={{position: 'absolute', left: portrait ? textX - textW / 2 : w * 0.66, top: legTop, width: textW, opacity: legendIn, color: p.ink, display: 'grid', gridTemplateColumns: portrait ? 'repeat(3, auto)' : '1fr', justifyContent: portrait ? 'center' : 'start', gap: `${8 * u}px ${28 * u}px`}}>
        {p.bands.map((b, k) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 12 * u, fontFamily: fonts.mono, fontSize: 20 * u}}>
            <span style={{width: 34 * u, height: 18 * u, background: p.colors[k % p.colors.length], display: 'inline-block', borderRadius: 3 * u}} />
            <span>
              {b}+ {p.unit}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const paintedChoropleth = defineMotion<Props>({
  id: 'painted-choropleth',
  title: 'Painted choropleth map',
  category: 'map',
  description:
    'A painted island map: the coastline is brushed in, then regions fill with quantised watercolour bands (wobbly wash edges, three-pass look) driven by station data; the field can morph through time (e.g. 50 Ma to today) with a radial fill reveal, a huge serif year label and a band legend.',
  source: ['lemo-opuscar styles/watercolor demo/main.js map section (MIT, LemoLab) — own SVG build, procedural island'],
  useFor: 'Climate / data stories in a warm editorial look; election or survey maps for softer brands; "how X spread" maps. Pass your own `stations` and bands.',
  durationInFrames: 270,
  defaultProps: {
    title: 'Annual rainfall',
    subtitle: 'a painted field map',
    unit: 'mm',
    bands: [150, 300, 650, 1150, 2000, 4000],
    colors: ['#CF7C4F', '#CDA35F', '#B3B07A', '#7F9A6C', '#46705A', '#2F5A45'],
    stations: [],
    timeKeys: [
      [90, 0.25],
      [225, 1],
    ],
    yearFrom: 50,
    yearTo: 0,
    yearUnit: 'Ma',
    finalLabel: 'Today',
    reveal: 'radial',
    passes: 2,
    background: '#F3EDE0',
    ink: '#3A3226',
    seed: 11,
  },
  propDocs: {
    title: 'title text',
    subtitle: 'italic line under the title',
    unit: 'unit appended to legend values',
    bands: 'ascending thresholds; band k starts at bands[k]',
    colors: 'band colours (same length as bands)',
    stations: '[{x (0-1000), y (0-700), value}] data points; empty = built-in demo field',
    timeKeys: '[[frame, multiplier]] the field is scaled by this multiplier over time',
    yearFrom: 'label number at the first time key',
    yearTo: 'label number at the last time key',
    yearUnit: 'label unit (e.g. Ma, AD, years)',
    finalLabel: 'label shown once the morph ends ("" = keep number)',
    reveal: "'radial' fill reveal or 'coast'",
    passes: 'wash passes 1-3 (more = softer, slower)',
    background: 'paper colour',
    ink: 'ink colour',
    seed: 'island + wash seed',
  },
  component: PaintedChoropleth,
  tags: ['map', 'choropleth', 'watercolor', 'data', 'climate', 'rainfall', 'timelapse', 'painted', 'bands', 'legend', 'island'],
});
