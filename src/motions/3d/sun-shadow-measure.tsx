// Technique after lemo-opuscar styles/white-model (MIT, LemoLab) — sun light + shadow trace + range line; see THIRD_PARTY_NOTICES.md.
// Own SVG implementation: NOAA-style solar position, exact prism shadows on a ground grid, measured range line.
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
  fmtClock,
  groundCells,
  hexRgb,
  inPrismShadow,
  makeCity,
  makeProjector,
  mixRgb,
  parseClock,
  plinthPolys,
  rgbCss,
  sstep,
  sunPosition,
  sunVector,
} from '../../core/r2-lb3b-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  seed: number;
  lat: number;
  lon: number;
  date: string;
  tz: number;
  timeKeys: [number, string][];
  subject: string;
  traceAt: number;
  traceFrames: number;
  pingAt: number;
  pingEvery: number;
  measure: number;
  unit: string;
  tickEvery: number;
  amber: string;
  trace: string;
  label: string;
  camera: number[][];
  zoom: number;
  background: string[];
};

const SunShadowMeasure: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const city = React.useMemo(() => makeCity(p.seed), [p.seed]);
  const subject: Bld = React.useMemo(() => {
    if (p.subject === 'tallest' || !p.subject) return city.buildings.reduce((a, b) => (b.h > a.h ? b : a), city.buildings[0]);
    return city.buildings[Math.min(city.buildings.length - 1, Math.max(0, parseInt(p.subject, 10) || 0))];
  }, [city, p.subject]);

  // ---- sun --------------------------------------------------------------------------------------
  const tk = p.timeKeys.length ? p.timeKeys : [[0, '12:00'] as [number, string]];
  const minutes = interpolate(frame, tk.map((k) => k[0]), tk.map((k) => parseClock(k[1])), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.sine});
  const lastMin = parseClock(tk[tk.length - 1][1]);
  const sp = sunPosition(p.lat, p.lon, p.date, minutes, p.tz);
  const sun = sunVector(sp.az, Math.max(sp.el, 0.05));
  const spEnd = sunPosition(p.lat, p.lon, p.date, lastMin, p.tz);
  const sunEnd = sunVector(spEnd.az, Math.max(spEnd.el, 0.05));
  const xzLen = Math.hypot(sun[0], sun[2]) || 1;
  const sdx = -sun[0] / xzLen; // shadow direction on the ground
  const sdz = -sun[2] / xzLen;
  const shadowLen = subject.h * (xzLen / Math.max(sun[1], 0.02));
  const endLen = subject.h * (Math.hypot(sunEnd[0], sunEnd[2]) / Math.max(sunEnd[1], 0.02));
  const mpu = p.measure / Math.max(endLen, 0.01); // metres per world unit so the final trace reads `measure`

  // ---- camera -----------------------------------------------------------------------------------
  const keys = p.camera;
  const kf = keys.map((k) => k[0]);
  const opt = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: ease.sine};
  const az = (interpolate(frame, kf, keys.map((k) => k[1]), opt) * Math.PI) / 180;
  const el = (interpolate(frame, kf, keys.map((k) => k[2]), opt) * Math.PI) / 180;
  const dist = interpolate(frame, kf, keys.map((k) => k[3]), opt);
  const fit = Math.min(w, h * 1.45);
  const {pos, project} = makeProjector({az, el, dist, target: [0, 0.5, 0], focal: (p.zoom * fit * dist) / 17, cx, cy: cy + h * (portrait ? 0.04 : 0.03)});

  // ---- shading ----------------------------------------------------------------------------------
  const sunWhite: Rgb = [1, 0.96, 0.88];
  const shadeBlue: Rgb = hexRgb('#1C2C66');
  const traceFill: Rgb = [0.12, 0.5, 1.0];
  const amber = hexRgb(p.amber);
  const dataGone = prog(frame, 0, 18, ease.out);
  const sunUp = clamp01(sp.el * 6);

  const shadowedBy = (x: number, y: number, z: number, skip?: Bld) => {
    for (const b of city.buildings) {
      if (b === skip || b.h <= y + 0.02) continue;
      if (Math.abs(b.x - x) > 7 || Math.abs(b.z - z) > 7) continue;
      if (inPrismShadow(b, x, y, z, sun)) return true;
    }
    return false;
  };

  const ground = groundCells(city, project, 0.47);
  const plinth = plinthPolys(city, project, pos);
  const bpolys = buildingPolys(city, project, pos);

  const traceP = prog(frame, p.traceAt, p.traceAt + p.traceFrames, ease.inOut);
  const subjCentre: V3 = [subject.x, 0, subject.z];
  const pingList = city.buildings
    .filter((b) => b.id !== subject.id && b.h < subject.h && inPrismShadow(subject, b.x, 0, b.z, sun))
    .sort((a, b) => Math.hypot(a.x - subject.x, a.z - subject.z) - Math.hypot(b.x - subject.x, b.z - subject.z));
  const pingIdx = new Map<number, number>();
  pingList.forEach((b, k) => pingIdx.set(b.id, k));

  const groundCol = (g: (typeof ground)[number]): Rgb => {
    const water = g.kind === 'water';
    const base: Rgb = water ? [0.075, 0.1, 0.14] : [0.17, 0.175, 0.19];
    let col: Rgb = base.map((v) => v * (0.8 + 0.7 * sunUp)) as Rgb;
    const x = g.c[0];
    const z = g.c[2];
    const shadow = shadowedBy(x, 0, z);
    if (shadow) col = mixRgb(col, [0.05, 0.07, 0.17], 0.55);
    if (traceP > 0 && inPrismShadow(subject, x, 0, z, sun)) {
      const d = ((x - subjCentre[0]) * sdx + (z - subjCentre[2]) * sdz) / Math.max(shadowLen, 0.01);
      const rev = sstep(traceP * 1.04, traceP * 1.04 - 0.05, d) * (traceP > 0 ? 1 : 0);
      if (rev > 0) {
        const probe = 0.3;
        const edge =
          !inPrismShadow(subject, x + probe, 0, z, sun) ||
          !inPrismShadow(subject, x - probe, 0, z, sun) ||
          !inPrismShadow(subject, x, 0, z + probe, sun) ||
          !inPrismShadow(subject, x, 0, z - probe, sun);
        const fill: Rgb = edge ? [0.62, 0.78, 1.0] : traceFill;
        col = mixRgb(col, fill, rev * (edge ? 1 : 0.92));
      }
    }
    return col;
  };

  const bldCol = (pl: (typeof bpolys)[number]): Rgb => {
    const b = pl.b as Bld;
    const ndl = dot(pl.n, sun);
    let lit = sstep(0, 0.3, ndl) * sunUp;
    if (pl.kind === 'roof' && shadowedBy(b.x, b.h, b.z, b)) lit = Math.min(lit, 0.12);
    const bright: Rgb = sunWhite.map((v) => v * (0.52 + 0.55 * Math.max(ndl, 0.2))) as Rgb;
    const dark: Rgb = [shadeBlue[0] * 0.95, shadeBlue[1] * 0.95, shadeBlue[2] * 1.0];
    let col = mixRgb(dark, bright, lit);
    // data from the previous beat (old blocks in amber) put away at the start
    if (pl.kind === 'roof' && b.year < 1925 && dataGone < 1) col = mixRgb(col, [amber[0], amber[1], amber[2]], (1 - dataGone) * 0.9);
    // roof pings inside the subject's shadow
    if (pl.kind === 'roof' && pingIdx.has(b.id) && traceP >= 1) {
      const e = (frame - (p.pingAt + (pingIdx.get(b.id) as number) * p.pingEvery)) / 30;
      if (e >= 0) {
        const g = 0.8 + 1.4 * Math.exp(-e / 0.25);
        const c: Rgb = b.year < 1925 ? amber : [0.55, 0.8, 1];
        const a = sstep(0, 0.12, e);
        col = mixRgb(col, [Math.min(1.4, c[0] * g), Math.min(1.4, c[1] * g), Math.min(1.4, c[2] * g)], a);
      }
    }
    if (b.id === subject.id && traceP > 0 && pl.kind === 'roof') col = mixRgb(col, [0.7, 0.85, 1], 0.2 * traceP);
    return col;
  };

  // ---- measure line ----------------------------------------------------------------------------
  const base2 = project([subject.x + sdx * subject.w * 0.5, 0.01, subject.z + sdz * subject.d * 0.5]);
  const tip: V3 = [subject.x + sdx * shadowLen, 0.01, subject.z + sdz * shadowLen];
  const tipS = project(tip);
  const cur: V3 = [subject.x + sdx * shadowLen * traceP, 0.01, subject.z + sdz * shadowLen * traceP];
  const curS = project(cur);
  const tickU = p.tickEvery / Math.max(mpu, 1e-6);
  const ticks: [number, number][] = [];
  for (let d = tickU; d <= shadowLen * traceP + 1e-6; d += tickU) ticks.push(project([subject.x + sdx * d, 0.01, subject.z + sdz * d]).slice(0, 2) as [number, number]);
  const counter = Math.round(shadowLen * traceP * mpu);
  const lineIn = prog(frame, p.traceAt - 4, p.traceAt + 6, ease.out);

  const clockIn = prog(frame, 4, 18, ease.out);
  const [bg0, bg1] = [p.background[0] || '#07090d', p.background[1] || '#1b1f29'];

  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 55% 50%, ${bg1} 0%, ${bg0} 80%)`}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <polygon points={plinth.top} fill="#151618" />
        {plinth.sides.map((s, i) => (
          <polygon key={`ps${i}`} points={s.pts} fill={`rgb(${Math.round(16 * s.shade)},${Math.round(17 * s.shade)},${Math.round(19 * s.shade)})`} />
        ))}
        {ground.map((g, i) => {
          const c = rgbCss(groundCol(g));
          return <polygon key={`g${i}`} points={g.pts} fill={c} stroke={c} strokeWidth={0.7} />;
        })}
        {lineIn > 0 ? (
          <g opacity={lineIn}>
            <line x1={base2[0]} y1={base2[1]} x2={curS[0]} y2={curS[1]} stroke="#ffd9a0" strokeWidth={2.2 * u} strokeLinecap="round" />
            {ticks.map((t, i) => (
              <circle key={i} cx={t[0]} cy={t[1]} r={4.5 * u} fill="#ffe9c2" />
            ))}
          </g>
        ) : null}
        {bpolys.map((pl, i) => {
          const c = rgbCss(bldCol(pl));
          return <polygon key={`b${i}`} points={pl.pts} fill={c} stroke={c} strokeWidth={0.5} strokeLinejoin="round" />;
        })}
        {lineIn > 0 && traceP > 0.02 ? (
          <g>
            <circle cx={curS[0]} cy={curS[1]} r={7 * u} fill="#ffe9c2" />
          </g>
        ) : null}
      </svg>
      {traceP > 0.02 ? (
        <div
          style={{
            position: 'absolute',
            left: Math.min(w - 260 * u, Math.max(24 * u, curS[0] + 18 * u)),
            top: Math.max(24 * u, curS[1] - 70 * u),
            fontFamily: fonts.mono,
            fontWeight: 700,
            fontSize: 54 * u,
            color: '#FFE9C2',
            background: 'rgba(10,12,18,0.72)',
            padding: `${6 * u}px ${16 * u}px`,
            borderLeft: `${3 * u}px solid #ffd9a0`,
            whiteSpace: 'nowrap',
          }}
        >
          {counter} {p.unit}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: (portrait ? 56 : 96) * u, top: (portrait ? 80 : 90) * u, opacity: clockIn, color: '#EDE7DA', fontFamily: fonts.mono}}>
        <div style={{fontSize: 18 * u, letterSpacing: 4 * u, color: '#9FB0E8'}}>{p.label.toUpperCase()}</div>
        <div style={{fontSize: 104 * u, fontWeight: 700, lineHeight: 1.05, marginTop: 8 * u}}>{fmtClock(minutes)}</div>
        <div style={{fontSize: 22 * u, color: '#8d94a6', marginTop: 4 * u}}>
          {p.date} · sun {Math.round((sp.el * 180) / Math.PI)}° up
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const sunShadowMeasure = defineMotion<Props>({
  id: 'sun-shadow-measure',
  title: 'Sun shadow measure',
  category: '3d',
  description:
    'A low winter sun swings across a white massing model while a clock readout runs; shadow sides go deep projected blue. Then one tower\'s shadow is traced as a cool fill with a bright edge while a range line with 100 m ticks grows from its base to the tip and a counter lands; the roofs inside the shadow ping on one by one.',
  source: ['lemo-opuscar styles/white-model (MIT, LemoLab) — sun light, shadow trace, range line, DEMO.md shot 9', 'own NOAA solar-position + analytic prism shadows'],
  useFor: 'Shadow-impact stories for a new building, solar-panel roof ranking, "daylight in a courtyard", sundial / education pieces, any measured "how far does it reach" beat.',
  durationInFrames: 330,
  defaultProps: {
    seed: 4,
    lat: 51.5,
    lon: -0.12,
    date: '2026-12-21',
    tz: 0,
    timeKeys: [
      [0, '10:55'],
      [175, '12:40'],
    ],
    subject: 'tallest',
    traceAt: 190,
    traceFrames: 52,
    pingAt: 252,
    pingEvery: 3,
    measure: 777,
    unit: 'm',
    tickEvery: 100,
    amber: '#ffb347',
    trace: '#1a38a6',
    label: 'Winter solstice · sun time',
    camera: [
      [0, 208, 54, 19.5],
      [330, 232, 48, 17.5],
    ],
    zoom: 0.95,
    background: ['#07090d', '#1b1f29'],
  },
  propDocs: {
    seed: 'city seed (same model as white-model-projection)',
    lat: 'latitude in degrees',
    lon: 'longitude in degrees (east positive)',
    date: 'ISO date for the sun path',
    tz: 'timezone offset in hours (clock times are local)',
    timeKeys: '[[frame, "HH:MM"]] clock keys (linear)',
    subject: "'tallest' or a building index",
    traceAt: 'frame the shadow trace begins',
    traceFrames: 'frames the trace takes',
    pingAt: 'frame the roof pings start',
    pingEvery: 'frames between pings',
    measure: 'the length printed at the end of the trace (scales the metres)',
    unit: 'unit text beside the counter',
    tickEvery: 'tick spacing on the range line, in units',
    amber: 'colour of the earlier data layer (old buildings)',
    trace: 'reserved: trace tint',
    label: 'small caption above the clock',
    camera: '[[frame, azimuthDeg, elevationDeg, distance]]',
    zoom: 'model size in frame',
    background: '[inner, outer] room colours',
  },
  component: SunShadowMeasure,
  tags: ['sun', 'shadow', 'solar', 'daylight', 'city', 'massing model', 'measure', 'range line', 'architecture', 'urban planning', 'clock', 'projection'],
});
