// Technique after lemo-opuscar styles/white-model (MIT, LemoLab) — see THIRD_PARTY_NOTICES.md. Own SVG implementation
// (orbit-projected massing model, per-face projector light, layered data modes: wash / grow / level / pick).
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {
  Bld,
  Rgb,
  V3,
  buildingPolys,
  clamp01,
  dot,
  groundCells,
  hexRgb,
  makeCity,
  makeProjector,
  mixRgb,
  norm,
  plinthPolys,
  rgbCss,
  sstep,
  sunVector,
} from '../../core/r2-lb3b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Layer = {mode: 'wash' | 'grow' | 'level' | 'pick'; at: number; dur?: number; select?: string; color?: string; ramp?: string[]; spread?: number};
type Readout = {from: number; to: number; name: string; figure: string; label: string};

type Props = {
  background: string[];
  plinth: string;
  water: string;
  seed: number;
  layers: Layer[];
  camera: number[][];
  lightsOutAt: number;
  strikeAt: number;
  lightsUpAt: number;
  readouts: Readout[];
  showReadout: boolean;
  zoom: number;
  bloom: number;
};

const HOUSE = sunVector((215 * Math.PI) / 180, (40 * Math.PI) / 180);
const PROJ: V3 = [-3.2, 9.5, 7.5];

const selectFn = (sel: string | undefined, all: Bld[]) => {
  const s = (sel || 'all').trim();
  const tallest = all.reduce((a, b) => (b.h > a.h ? b : a), all[0]);
  if (s === 'all') return () => true;
  if (s === 'tallest') return (b: Bld) => b.id === tallest.id;
  if (s === 'tower' || s === 'block') return (b: Bld) => b.tag === s;
  const m = /^(year|h|rank|value)\s*(<=|>=|<|>)\s*(-?[\d.]+)$/.exec(s);
  if (m) {
    const k = m[1] as 'year' | 'h' | 'rank' | 'value';
    const v = parseFloat(m[3]);
    return (b: Bld) => (m[2] === '<' ? b[k] < v : m[2] === '<=' ? b[k] <= v : m[2] === '>' ? b[k] > v : b[k] >= v);
  }
  return () => true;
};

const WhiteModelProjection: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const city = React.useMemo(() => makeCity(p.seed), [p.seed]);
  const maxH = React.useMemo(() => Math.max(...city.buildings.map((b) => b.h)), [city]);
  const sels = React.useMemo(() => p.layers.map((l) => selectFn(l.select, city.buildings)), [p.layers, city]);

  // ---- camera ---------------------------------------------------------------------------------
  const keys = p.camera.length ? p.camera : [[0, 205, 40, 19]];
  const kf = keys.map((k) => k[0]);
  const az = (interpolate(frame, kf, keys.map((k) => k[1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.sine}) * Math.PI) / 180;
  const el = (interpolate(frame, kf, keys.map((k) => k[2]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.sine}) * Math.PI) / 180;
  const dist = interpolate(frame, kf, keys.map((k) => k[3]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.sine});
  const fit = Math.min(w, h * 1.45);
  const {pos, project} = makeProjector({
    az,
    el,
    dist,
    target: [0, 0.6, 0],
    focal: (p.zoom * fit * dist) / 17,
    cx: portrait ? cx : cx + w * 0.1,
    cy: portrait ? cy + h * 0.1 : cy + h * 0.03,
  });

  // ---- light state -----------------------------------------------------------------------------
  const houseOn = 1 - prog(frame, p.lightsOutAt, p.lightsOutAt + 5, ease.in) + prog(frame, p.lightsUpAt, p.lightsUpAt + 14, ease.out);
  const house = clamp01(houseOn);
  const ts = (frame - p.strikeAt) / 30;
  const strike = clamp01(ts / 0.12) * (ts < 0.25 ? 0.75 + 0.25 * Math.sin(90 * ts) : 1) * (frame >= p.strikeAt ? 1 : 0);
  const proj = strike * (1 - prog(frame, p.lightsUpAt, p.lightsUpAt + 14, ease.out));

  // ---- per-building additive colour from the data layers -----------------------------------------
  const lay = city.buildings.map((b): {col: Rgb; ramp: boolean; y: number} => {
    let col: Rgb = [0, 0, 0];
    let ramp = false;
    let yFront = 0;
    p.layers.forEach((l, i) => {
      const dur = l.dur ?? 60;
      const on = sels[i](b);
      const c = hexRgb(l.color || '#ffb347');
      if (l.mode === 'wash') {
        if (!on) return;
        const R = ease.out(clamp01((frame - l.at) / dur)) * 11.5;
        const r = Math.hypot(b.x, b.z);
        const a = 1 - sstep(R - 0.6, R + 0.6, r);
        const fade = 1 - prog(frame, l.at + dur + (l.spread ?? 90), l.at + dur + (l.spread ?? 90) + 25, ease.sine);
        col = col.map((v, k) => v + c[k] * a * fade) as Rgb;
      } else if (l.mode === 'grow') {
        if (!on) return;
        const e = (frame - (l.at + b.rank * (l.spread ?? 60))) / 30;
        if (e < 0) return;
        const a = sstep(0, 0.22, e);
        const flash = Math.exp(-e / 0.16) * 1.4;
        col = col.map((v, k) => v + c[k] * a + (0.6 * flash * 1 + c[k] * flash * 0.4)) as Rgb;
      } else if (l.mode === 'level') {
        const pp = clamp01((frame - l.at) / dur);
        const f = (0.5 * ease.out(pp) + 0.5 * sstep(0, 1, pp)) * (maxH + 0.4);
        yFront = f;
        ramp = true;
      } else if (l.mode === 'pick') {
        if (!on) return;
        const e = (frame - l.at) / 30;
        if (e < 0) return;
        const g = 0.8 + 1.4 * Math.exp(-e / 0.25);
        col = col.map((v, k) => v + c[k] * g) as Rgb;
      }
    });
    return {col, ramp, y: yFront};
  });

  const levelLayer = p.layers.find((l) => l.mode === 'level');
  const rampCols = (levelLayer?.ramp || ['#2a6ad8', '#31c7a8', '#f2d24b', '#ff6a3d']).map(hexRgb);
  const rampAt = (t: number): Rgb => {
    const x = clamp01(t) * (rampCols.length - 1);
    const i = Math.min(rampCols.length - 2, Math.floor(x));
    return mixRgb(rampCols[i], rampCols[i + 1], x - i);
  };

  // washes also paint a faint warm ring on the plinth so the front reads as a light sweep
  const washLayer = p.layers.find((l) => l.mode === 'wash');
  const washR = washLayer ? ease.out(clamp01((frame - washLayer.at) / (washLayer.dur ?? 60))) * 11.5 : 0;
  const washFade = washLayer ? 1 - prog(frame, washLayer.at + (washLayer.dur ?? 60) + (washLayer.spread ?? 90), washLayer.at + (washLayer.dur ?? 60) + (washLayer.spread ?? 90) + 25, ease.sine) : 0;
  const washCol = hexRgb(washLayer?.color || '#ffb347');

  // ---- polygons --------------------------------------------------------------------------------
  const ground = groundCells(city, project);
  const plinth = plinthPolys(city, project, pos);
  const bpolys = buildingPolys(city, project, pos);

  const faceL = (n: V3, c: V3) => 0.42 + 0.58 * Math.max(dot(n, norm([PROJ[0] - c[0], PROJ[1] - c[1], PROJ[2] - c[2]])), 0);
  const WHITE = 0.9;
  const shadeBuilding = (pl: (typeof bpolys)[number]): Rgb => {
    const b = pl.b as Bld;
    const base = WHITE * (0.28 + 0.8 * Math.max(dot(pl.n, HOUSE), 0));
    const baseLit = base * house + 0.018;
    const L = lay[b.id];
    let col: Rgb = [baseLit, baseLit, baseLit * 1.02];
    let add: Rgb = [L.col[0], L.col[1], L.col[2]];
    if (L.ramp) {
      const top = pl.kind === 'roof' ? b.h : pl.c[1];
      if (top <= L.y) {
        const rc = rampAt(top / maxH);
        const band = Math.exp(-Math.pow((top - L.y) / 0.12, 2)) * 0.9;
        add = [add[0] + rc[0] * 0.95 + band, add[1] + rc[1] * 0.95 + band, add[2] + rc[2] * 0.95 + band];
      }
    }
    const fl = faceL(pl.n, pl.c) * 1.35 * proj;
    col = [col[0] + add[0] * fl, col[1] + add[1] * fl, col[2] + add[2] * fl];
    return col;
  };

  const shadeGround = (g: (typeof ground)[number]): Rgb => {
    const isW = g.kind === 'water';
    const a = isW ? hexRgb(p.water) : hexRgb(p.plinth);
    const base = a.map((v) => v * (0.5 + 0.7 * house)) as Rgb;
    if (proj > 0 && washFade > 0) {
      const r = Math.hypot(g.c[0], g.c[2]);
      const s = r - washR;
      const ring = Math.exp(-(s * s) / 0.18) * 0.5 * washFade * proj * (isW ? 0.55 : 1);
      const fill = (s < 0 ? 0.07 : 0) * washFade * proj;
      return [base[0] + washCol[0] * (ring + fill), base[1] + washCol[1] * (ring + fill), base[2] + washCol[2] * (ring + fill)];
    }
    return base;
  };

  const bg0 = p.background[0] || '#080A0E';
  const bg1 = p.background[1] || '#1F2129';
  const bgMix = 0.55 + 0.45 * house;

  const readoutIdx = p.showReadout ? p.readouts.findIndex((r) => frame >= r.from && frame < r.to) : -1;
  const readout = readoutIdx >= 0 ? p.readouts[readoutIdx] : undefined;
  const figureText = readout ? readout.figure || String(city.buildings.filter(sels[Math.min(readoutIdx, sels.length - 1)] || (() => true)).length) : '';
  const ro = readout ? Math.min(prog(frame, readout.from, readout.from + 14, ease.out), 1 - prog(frame, readout.to - 10, readout.to, ease.in)) : 0;

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 58% 52%, ${p.background[2] || '#3B393F'} 0%, ${bg1} ${30 * bgMix}%, ${bg0} 78%)`}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="wmp-bloom" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={12 * u} />
          </filter>
        </defs>
        <polygon points={plinth.top} fill="#151618" />
        {plinth.sides.map((s, i) => (
          <polygon key={`ps${i}`} points={s.pts} fill={`rgb(${Math.round(16 * s.shade)},${Math.round(17 * s.shade)},${Math.round(19 * s.shade)})`} />
        ))}
        {ground.map((g, i) => {
          const c = rgbCss(shadeGround(g));
          return <polygon key={`g${i}`} points={g.pts} fill={c} stroke={c} strokeWidth={0.7} />;
        })}
        {bpolys.map((pl, i) => {
          const c = rgbCss(shadeBuilding(pl));
          return <polygon key={`b${i}`} points={pl.pts} fill={c} stroke={c} strokeWidth={0.5} strokeLinejoin="round" />;
        })}
        {p.bloom > 0 && proj > 0.02 ? (
          <g filter="url(#wmp-bloom)" style={{mixBlendMode: 'screen'}} opacity={p.bloom * proj}>
            {bpolys.map((pl, i) => {
              const L = lay[(pl.b as Bld).id];
              const lit = L.col[0] + L.col[1] + L.col[2] > 0.05 || (L.ramp && (pl.kind === 'roof' ? (pl.b as Bld).h : pl.c[1]) <= L.y);
              if (!lit) return null;
              const c = shadeBuilding(pl);
              return <polygon key={`bl${i}`} points={pl.pts} fill={rgbCss(c.map((v) => Math.max(0, v - 0.35)) as Rgb)} />;
            })}
          </g>
        ) : null}
      </svg>
      {readout ? (
        <div
          style={{
            position: 'absolute',
            left: portrait ? 64 * u : 96 * u,
            top: portrait ? 90 * u : '50%',
            transform: portrait ? undefined : 'translateY(-50%)',
            opacity: ro,
            color: '#EDE7DA',
            fontFamily: fonts.sans,
            width: portrait ? w - 128 * u : w * 0.3,
          }}
        >
          <div style={{fontFamily: fonts.mono, fontSize: 18 * u, letterSpacing: 4 * u, color: '#B7AE9C'}}>{readout.name.toUpperCase()}</div>
          <div style={{fontSize: (portrait ? 150 : 170) * u, fontWeight: 400, lineHeight: 1.02, marginTop: 14 * u, transform: `translateX(${(1 - ro) * -30 * u}px)`}}>{figureText}</div>
          <div style={{fontSize: 26 * u, color: '#B7AE9C', marginTop: 6 * u}}>{readout.label}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const whiteModelProjection = defineMotion<Props>({
  id: 'white-model-projection',
  title: 'White model projection (data as light)',
  category: '3d',
  description:
    'A white massing model of a city on a dark plinth in a dark room. House lights snap off, a projector strikes with a flicker and a warm wash spreads from its axis lighting one set of buildings amber; a second layer pops buildings on one by one with a white flash, a rising level of light colours every facade by height, and a final pick-out lights one tower alone. The model never changes, only the light.',
  source: ['lemo-opuscar styles/white-model (MIT, LemoLab) — studio.js projLight / buildCity, DEMO.md', 'own procedural city + SVG orbit renderer'],
  useFor:
    'Data-as-light hero for urban planning, real-estate portfolios ("our sites by year"), campus plans, flood/height studies, infra and B2B brands; any "data on a physical model" museum-style piece.',
  durationInFrames: 330,
  defaultProps: {
    background: ['#080A0E', '#1F2129', '#3B393F'],
    plinth: '#17181A',
    water: '#1A2129',
    seed: 4,
    layers: [
      {mode: 'wash', at: 38, dur: 70, select: 'year<1925', color: '#ffb347', spread: 40},
      {mode: 'grow', at: 125, dur: 0, select: 'year>=1925', color: '#6fb4ff', spread: 55},
      {mode: 'level', at: 205, dur: 60, select: 'all', ramp: ['#2a6ad8', '#31c7a8', '#f2d24b', '#ff6a3d']},
      {mode: 'pick', at: 285, dur: 0, select: 'tallest', color: '#fff1b5'},
    ],
    camera: [
      [0, 205, 40, 19],
      [330, 238, 34, 16.5],
    ],
    lightsOutAt: 16,
    strikeAt: 30,
    lightsUpAt: 312,
    readouts: [
      {from: 40, to: 118, name: '01 · Before 1925', figure: '', label: 'the oldest blocks, lit first'},
      {from: 128, to: 198, name: '02 · After 1925', figure: '', label: 'newer buildings, one by one'},
      {from: 208, to: 280, name: '03 · Height', figure: '', label: 'light climbs every facade'},
      {from: 288, to: 312, name: '04 · Landmark', figure: '', label: 'the tallest tower'},
    ],
    showReadout: true,
    zoom: 0.95,
    bloom: 0.55,
  },
  propDocs: {
    background: '[centre, mid, edge] room colours',
    plinth: 'plinth top colour',
    water: 'river inlay colour',
    seed: 'city seed (procedural massing model)',
    layers:
      "[{mode:'wash'|'grow'|'level'|'pick', at(frame), dur, select('all'|'tower'|'block'|'tallest'|'year<1940'|'h>1.5'|'rank<0.5'), color, ramp(level colours), spread(frames)}]",
    camera: '[[frame, azimuthDeg, elevationDeg, distance]] orbit keys',
    lightsOutAt: 'frame the house lights snap off',
    strikeAt: 'frame the projector strikes (flicker)',
    lightsUpAt: 'frame the house lights come back and the data ends',
    readouts: '[{from,to,name,figure,label}] left-third readout; empty figure = count of buildings in the matching layer (replace with your numbers)',
    showReadout: 'show the readout block',
    zoom: 'model size in frame',
    bloom: 'glow of lit buildings 0..1',
  },
  component: WhiteModelProjection,
  tags: ['city', 'projection', 'mapping', 'massing model', 'white model', 'data as light', 'urban', 'architecture', 'plinth', 'dark room', 'real estate', 'planning', 'orbit', 'height'],
});
