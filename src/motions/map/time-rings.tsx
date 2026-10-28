// Adapted from lemo-opuscar/styles/satellite-briefing/demo (engine.js scan fronts, overlay.js readout) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {TerrainPlate, plateSubject} from '../../core/r2-lb2a-kit';
import {back, eio3, fx, h1, lerp, lf, mixHex, seg, useUid} from '../../core/r2-lb2-kit';

/**
 * A locked top-down view of one place. Soft scan passes sweep down the frame one after another, each swapping in an
 * older/newer dated plate and leaving that date's outline as a thin white ring with a year label; the band lost
 * between two rings flashes, a light runs along the newest outline, everything outside the subject is dimmed, and an
 * amber reading rolls in the right third and lands bright.
 */
type Plate = {src?: string; date: string; outline?: number[][]};
type Reading = {label: string; from: number; to: number; unit: string; note: string; decimals?: number};
type Props = {
  plates: Plate[];
  spacing: number[];
  direction: 'forward' | 'rewind';
  reading: Reading;
  accent: string;
  ringColor: string;
  grade: boolean;
  labels: boolean;
  dim: number;
  creep: {scaleFrom: number; scaleTo: number; rotate: number};
  groundColor: string;
  subjectColor: string;
  startFrame: number;
  seed: number;
};

const FEATHER = 36;
const SCAN_FRAMES = 22;

const TimeRings: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const id = useUid('trg');
  const plates = p.direction === 'rewind' ? [...p.plates].reverse() : p.plates;
  const n = plates.length;
  // scan start frames: accelerating spacing, then braking (spacing[] in seconds)
  const starts: number[] = [];
  let acc = p.startFrame;
  for (let i = 0; i < n; i++) {
    starts.push(acc);
    acc += Math.round((p.spacing[Math.min(i, p.spacing.length - 1)] ?? 0.8) * fps);
  }
  const lastEnd = starts[n - 1] + SCAN_FRAMES;
  const scanP = (i: number) => seg(frame, starts[i], starts[i] + SCAN_FRAMES);
  const scanY = (i: number) => lerp(-FEATHER * u, h + FEATHER * u * 1.5, scanP(i));
  // outlines in frame px
  const outlines = plates.map((pl, i) => {
    if (pl.outline && pl.outline.length > 2) {
      const pts = pl.outline.map(([x, y]) => [x * w, y * h] as [number, number]);
      return {pts, d: 'M' + pts.map(([x, y]) => `${fx(x)},${fx(y)}`).join(' L') + ' Z'};
    }
    return plateSubject(w, h, i, n, p.seed);
  });
  // camera creep, accelerating then braking
  const cp = eio3(seg(frame, p.startFrame - 4, lastEnd + 9));
  const sc = lerp(p.creep.scaleFrom, p.creep.scaleTo, cp);
  const rot = p.creep.rotate * cp;
  const sw = (v: number) => (v * u) / sc;
  // which scans have started / settled
  const started = starts.filter((s) => frame >= s).length;
  const settled = starts.filter((s) => frame >= s + SCAN_FRAMES * 0.5).length;
  const newest = Math.max(0, started - 1);
  const dimRef = Math.max(0, settled - 1);
  const dimOn = seg(frame, starts[0] + 6, starts[0] + SCAN_FRAMES + 6);
  const grade = p.grade ? 'saturate(0.82) contrast(1.12) brightness(0.9)' : undefined;
  const pad = 3 * Math.max(w, h);

  // reading
  const rIn = lastEnd + 2;
  const rShow = seg(frame, rIn, rIn + 8);
  const rRoll = seg(frame, rIn + 4, rIn + 44);
  const rLand = seg(frame, rIn + 44, rIn + 50);
  const val = lerp(p.reading.from, p.reading.to, 1 - Math.pow(1 - rRoll, 2.4));
  const dec = p.reading.decimals ?? 0;
  const rx = portrait ? w * 0.5 : w * 0.7;
  const ry = portrait ? h * 0.84 : h * 0.54;
  const anchor = portrait ? 'middle' : 'start';
  const pop = 1 + 0.06 * Math.sin(Math.PI * rLand);
  const readOp = rShow * (0.55 + 0.45 * rLand);
  const num = val.toFixed(dec);

  return (
    <AbsoluteFill style={{background: '#0a0e12'}}>
      <Svg>
        <defs>
          {plates.map((_, i) => {
            const y = scanY(i);
            const a = y - FEATHER * u;
            return (
              <React.Fragment key={i}>
                <linearGradient id={`${id}g${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="1" stopColor="#000" />
                </linearGradient>
                <mask id={`${id}m${i}`} maskUnits="userSpaceOnUse" x={-pad} y={-pad} width={pad * 3} height={pad * 3}>
                  <rect x={-pad} y={-pad} width={pad * 3} height={pad + a} fill="#fff" />
                  <rect x={-pad} y={a} width={pad * 3} height={FEATHER * u * 2} fill={`url(#${id}g${i})`} />
                </mask>
                <clipPath id={`${id}c${i}`}>
                  <rect x={-pad} y={-pad} width={pad * 3} height={pad + y} />
                </clipPath>
              </React.Fragment>
            );
          })}
          <linearGradient id={`${id}sw`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.7" stopColor="#fff" stopOpacity={0.05} />
            <stop offset="1" stopColor="#fff" stopOpacity={0.14} />
          </linearGradient>
          <filter id={`${id}glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={3 * u} />
          </filter>
        </defs>
        <g transform={`translate(${fx(w / 2)},${fx(h / 2)}) rotate(${fx(rot, 2)}) scale(${fx(sc, 4)}) translate(${fx(-w / 2)},${fx(-h / 2)})`}>
          {/* dated plates, each revealed by its own soft scan */}
          <g style={{filter: grade}}>
            {plates.map((pl, i) => (
              <g key={i} mask={i === 0 ? undefined : `url(#${id}m${i})`}>
                {pl.src ? (
                  <image href={resolveSrc(pl.src)} x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <TerrainPlate w={w} h={h} u={u} k={i} n={n} seed={p.seed} id={`${id}p${i}`} tint={p.groundColor} subjectTint={p.subjectColor} />
                )}
              </g>
            ))}
          </g>
          {/* dim everything outside the newest subject */}
          <path
            d={`M${-pad},${-pad} H${pad * 2} V${pad * 2} H${-pad} Z ${outlines[dimRef].d}`}
            fill="#04070a"
            fillRule="evenodd"
            opacity={p.dim * dimOn}
          />
          {/* lost bands between consecutive rings flash for 6 frames */}
          {plates.map((_, i) => {
            if (i === 0) return null;
            const e = starts[i] + SCAN_FRAMES;
            if (frame < e - 2 || frame > e + 6) return null;
            return <path key={'lb' + i} d={`${outlines[i - 1].d} ${outlines[i].d}`} fillRule="evenodd" fill="#fff" opacity={0.25} clipPath={`url(#${id}c${i})`} />;
          })}
          {/* rings: halo + hairline, newest heavier, drawn as the scan crosses */}
          {outlines.map((o, i) => {
            if (frame < starts[i]) return null;
            const isNewest = i === newest;
            const wd = isNewest ? 2.6 : 1.2;
            return (
              <g key={'r' + i} clipPath={`url(#${id}c${i})`}>
                <path d={o.d} fill="none" stroke="#02080c" strokeOpacity={0.55} strokeWidth={sw(wd + 3)} strokeLinejoin="round" />
                <path d={o.d} fill="none" stroke={p.ringColor} strokeWidth={sw(wd)} strokeLinejoin="round" />
              </g>
            );
          })}
          {/* light running along the newest outline once its scan has passed */}
          {(() => {
            const i = newest;
            if (scanP(i) < 1) return null;
            const ph = ((frame - starts[i] - SCAN_FRAMES) * 0.018) % 1;
            const dash = '0.07 0.93';
            return (
              <g>
                <path d={outlines[i].d} pathLength={1} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={sw(9)} strokeDasharray={dash} strokeDashoffset={-ph} strokeLinecap="round" filter={`url(#${id}glow)`} />
                <path d={outlines[i].d} pathLength={1} fill="none" stroke="#fff" strokeWidth={sw(3.6)} strokeDasharray={dash} strokeDashoffset={-ph} strokeLinecap="round" />
              </g>
            );
          })()}
          {/* scan glow swaths */}
          <g style={{mixBlendMode: 'screen'}}>
            {plates.map((_, i) => {
              const pr = scanP(i);
              if (pr <= 0 || pr >= 1) return null;
              const y = scanY(i);
              const sh = 150 * u;
              return (
                <g key={'sw' + i}>
                  <rect x={-pad} y={y - sh} width={pad * 3} height={sh} fill={`url(#${id}sw)`} />
                  <rect x={-pad} y={y - 1.5 * u} width={pad * 3} height={3 * u} fill="#fff" opacity={0.28} />
                </g>
              );
            })}
          </g>
          {/* year labels */}
          {p.labels &&
            outlines.map((o, i) => {
              if (frame < starts[i]) return null;
              const top = o.pts.reduce((m, q) => (q[1] < m[1] ? q : m), o.pts[0]);
              const lx = top[0] + 10 * u / sc;
              const ly = top[1] - 6 * u / sc;
              const vis = scanY(i) > top[1] ? seg(frame, starts[i] + SCAN_FRAMES * 0.3, starts[i] + SCAN_FRAMES * 0.3 + 6) : 0;
              return (
                <text
                  key={'l' + i}
                  x={lx}
                  y={ly}
                  fontFamily={lf('plex')}
                  fontWeight={500}
                  fontSize={21 * u / sc}
                  letterSpacing={1.5 * u / sc}
                  fill="#F2F5F6"
                  stroke="#02080c"
                  strokeOpacity={0.7}
                  strokeWidth={4 * u / sc}
                  paintOrder="stroke"
                  opacity={vis}
                >
                  {plates[i].date}
                </text>
              );
            })}
        </g>
        {/* analyst reading */}
        <g opacity={readOp} transform={`translate(${fx(rx)},${fx(ry)}) scale(${fx(pop, 3)}) translate(${fx(-rx)},${fx(-ry)})`}>
          <text x={rx} y={ry - 118 * u} textAnchor={anchor} fontFamily={lf('outfit')} fontWeight={600} fontSize={24 * u} letterSpacing={7 * u} fill="#E8EEF0" stroke="#02080c" strokeOpacity={0.5} strokeWidth={5 * u} paintOrder="stroke">
            {p.reading.label.toUpperCase()}
          </text>
          <text x={rx} y={ry} textAnchor={anchor} fontFamily={lf('barlow')} fontWeight={300} fontSize={150 * u} fill={p.accent} stroke="#02080c" strokeOpacity={0.45} strokeWidth={6 * u} paintOrder="stroke">
            {num}
            <tspan fontSize={80 * u} dx={14 * u}>
              {p.reading.unit}
            </tspan>
          </text>
          <rect x={portrait ? rx - 110 * u : rx} y={ry + 22 * u} width={220 * u} height={4 * u} fill={p.accent} opacity={0.85} />
          <text x={rx} y={ry + 64 * u} textAnchor={anchor} fontFamily={lf('plex')} fontWeight={400} fontSize={21 * u} fill="#E8EEF0" opacity={0.6} stroke="#02080c" strokeOpacity={0.5} strokeWidth={4 * u} paintOrder="stroke">
            {p.reading.note}
          </text>
        </g>
      </Svg>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${mixHex('#000000', '#0a1a26', 0.2)}cc 100%)`}} />
    </AbsoluteFill>
  );
};

export const timeRings = defineMotion<Props>({
  id: 'time-rings',
  title: 'Time rings (dated scan passes)',
  category: 'map',
  description:
    'A locked top-down view where soft scan passes sweep down the frame, each swapping in an older or newer dated plate and leaving that date\'s outline as a thin white ring with a year label; the lost band flashes, a light runs the newest outline, the rest dims, and an amber reading rolls in and lands.',
  source: ['lemo-opuscar styles/satellite-briefing demo/engine.js, overlay.js, film.js, DEMO.md shot 5 (MIT / CC BY 4.0, LemoLab)'],
  useFor: 'Before/after-over-time evidence on images: glacier retreat, city sprawl, construction progress, deforestation, a product growing on a map, a photo series of a building site.',
  durationInFrames: 210,
  defaultProps: {
    plates: [{date: '1984'}, {date: '1994'}, {date: '2004'}, {date: '2014'}, {date: '2024'}],
    spacing: [1.2, 0.9, 0.7, 0.55, 0.9],
    direction: 'forward',
    reading: {label: 'Surface lost', from: 0, to: 47, unit: '%', note: 'Source: sample composite, illustrative', decimals: 0},
    accent: '#FFB020',
    ringColor: '#F2F5F6',
    grade: true,
    labels: true,
    dim: 0.4,
    creep: {scaleFrom: 1.2, scaleTo: 1.42, rotate: -5},
    groundColor: '#8f6e4c',
    subjectColor: '#c9d8de',
    startFrame: 14,
    seed: 5,
  },
  propDocs: {
    plates: '4-8 dated plates [{src?, date, outline?: [[x,y]...] in 0..1 of the frame}]; no src = procedural terrain; no outline = procedural subject outline',
    spacing: 'seconds between scan starts (accelerate then brake)',
    direction: "'forward' (as listed) or 'rewind' (reverse the list)",
    reading: 'amber reading {label, from, to, unit, note, decimals}',
    accent: 'reading colour',
    ringColor: 'outline hairline colour',
    grade: 'analyst grade on the image layer only (marks stay white)',
    labels: 'year labels on rings',
    dim: 'dimming outside the subject (0..1)',
    creep: 'camera creep {scaleFrom, scaleTo, rotate degrees}',
    groundColor: 'procedural ground colour',
    subjectColor: 'procedural subject colour',
    startFrame: 'first scan frame',
    seed: 'procedural terrain seed',
  },
  component: TimeRings,
  tags: ['time lapse', 'satellite', 'before after', 'glacier', 'sprawl', 'outline', 'scan', 'evidence', 'reading', 'map', 'rings', 'analyst', 'dated images', 'timeline'],
});
