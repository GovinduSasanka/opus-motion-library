// Adapted from lemo-opuscar/styles/archive-lighttable/demo/film.js measure() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React, {useMemo} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {resolveSrc} from '../../core/asset';
import {useSafeId} from '../../core/image-kit';
import {rng} from '../../core/random';
import {eo3, lf, seg} from '../../core/r2-la1-kit';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A measuring tape laid on the ground of a photograph in true perspective: ground row of a point D away is
 * y = horizon + K/D, the tape's length grows in log-distance D(t) = D0·(Dend/D0)^t so it advances steadily
 * on screen, ticks crowd toward the horizon by themselves, and a counter lands on the measured figure.
 */
type Props = {
  src: string;
  horizonY: number;
  vanishX: number;
  value: number;
  unit: string;
  label: string;
  tickEvery: number;
  labelEvery: number;
  startDistance: number;
  startX: number;
  endX: number;
  tapeWidth: number;
  startAt: number;
  runFrames: number;
  accent: string;
  mono: boolean;
};

const fmt = (v: number) => Math.round(v).toLocaleString('en-US');

/** procedural archive photo: overcast sky, low dunes, flat sand in perspective (silver-gelatin greys) */
const GroundPhoto: React.FC<{w: number; h: number; u: number; hy: number; id: string}> = ({w, h, u, hy, id}) => {
  const streaks = useMemo(() => {
    const r = rng(17);
    return Array.from({length: 140}, () => {
      const t = Math.pow(r(), 1.9);
      const y = hy + 4 * u + t * (h - hy);
      const len = (40 + r() * 260) * u * (0.25 + t * 1.6);
      return {x: r() * w, y, len, o: 0.05 + r() * 0.12, d: r() < 0.5};
    });
  }, [w, h, u, hy]);
  const posts = useMemo(() => {
    const r = rng(5);
    return Array.from({length: 7}, () => ({X: (r() - 0.3) * 60, D: 60 + r() * 500}));
  }, []);
  const dune = useMemo(() => {
    const r = rng(9);
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) pts.push(`${((i / 24) * w).toFixed(1)},${(hy - (6 + 18 * Math.abs(Math.sin(i * 0.7 + r() * 2))) * u).toFixed(1)}`);
    return `M0 ${hy} L${pts.join(' L')} L${w} ${hy} Z`;
  }, [w, hy, u]);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9c9b97" />
          <stop offset="1" stopColor="#d6d5d0" />
        </linearGradient>
        <linearGradient id={`${id}-gr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9b7b1" />
          <stop offset="0.35" stopColor="#a6a49e" />
          <stop offset="1" stopColor="#77756f" />
        </linearGradient>
        <filter id={`${id}-cl`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.0018 / u} ${0.006 / u}`} numOctaves={3} seed={3} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.95  0 0 0 0 0.93  0 0 0 1.3 -0.55" />
        </filter>
      </defs>
      <rect width={w} height={hy + 2} fill={`url(#${id}-sky)`} />
      <rect width={w} height={hy} filter={`url(#${id}-cl)`} opacity={0.55} />
      <path d={dune} fill="#8f8d87" />
      <rect y={hy} width={w} height={h - hy} fill={`url(#${id}-gr)`} />
      {streaks.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.len} height={Math.max(1, ((s.y - hy) / (h - hy)) * 5 * u)} fill={s.d ? '#55534e' : '#e2e0da'} opacity={s.o} />
      ))}
      {posts.map((p, i) => {
        const K = (h - hy) * 40;
        const y = hy + K / p.D;
        const x = w * 0.5 + ((p.X * K) / p.D) * 0.02;
        const ph = (2600 / p.D) * u;
        return <rect key={i} x={x} y={y - ph} width={Math.max(1.5, ph * 0.08)} height={ph} fill="#3d3c38" opacity={0.8} />;
      })}
    </g>
  );
};

const GroundRuler: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('gruler');
  const hy = h * p.horizonY;
  const vx = w * p.vanishX;
  const D0 = p.startDistance;
  const Dend = D0 + p.value;
  // y(D0) sits near the bottom of frame
  const K = (h * 0.97 - hy) * D0;
  const fx = (K / 3.2) * (portrait ? 0.5 : 1); // lateral focal (camera height 3.2 units)
  const proj = (X: number, D: number): [number, number] => [vx + (fx * X) / D, hy + K / D];
  const run = ease.inOut(seg(frame, p.startAt, p.startAt + p.runFrames));
  const Dt = D0 * Math.pow(Dend / D0, run);
  const len = Dt - D0;
  const Xat = (D: number) => lerp(p.startX, p.endX, (D - D0) / Math.max(1e-6, p.value));
  // tape polygon sampled along D
  const N = 40;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= N; i++) {
    const D = D0 + (len * i) / N;
    const X = Xat(D);
    const [ax, ay] = proj(X - p.tapeWidth / 2, D);
    const [bx, by] = proj(X + p.tapeWidth / 2, D);
    left.push(`${ax.toFixed(1)},${ay.toFixed(1)}`);
    right.unshift(`${bx.toFixed(1)},${by.toFixed(1)}`);
  }
  const ticks: React.ReactNode[] = [];
  for (let d = p.tickEvery; d <= len + 1e-6; d += p.tickEvery) {
    const D = D0 + d;
    const X = Xat(D);
    const major = Math.abs(d / p.labelEvery - Math.round(d / p.labelEvery)) < 1e-6;
    const [ax, ay] = proj(X - p.tapeWidth * (major ? 0.9 : 0.5), D);
    const [bx, by] = proj(X + p.tapeWidth * (major ? 0.9 : 0.5), D);
    const sc = K / D / (h * 0.3);
    ticks.push(<line key={'t' + d} x1={ax} y1={ay} x2={bx} y2={by} stroke="#fff" strokeWidth={Math.max(1, (major ? 3 : 1.6) * u * clamp(sc * 3, 0.3, 1.4))} />);
    if (major) {
      const [lx, ly] = proj(X + p.tapeWidth * 1.4, D);
      const fs = clamp(34 * u * sc * 2.2, 15 * u, 34 * u);
      ticks.push(
        <text key={'l' + d} x={lx} y={ly + fs * 0.35} fontFamily={lf.plex} fontSize={fs} fill="#15171A" stroke="#f3f2ee" strokeWidth={fs * 0.18} paintOrder="stroke">
          {fmt(d)}
        </text>,
      );
    }
  }
  const [s0x, s0y] = proj(Xat(D0), D0);
  const [e0x, e0y] = proj(Xat(Dt), Dt);
  const ping = seg(frame, p.startAt - 12, p.startAt + 6);
  const done = eo3(seg(frame, p.startAt + p.runFrames, p.startAt + p.runFrames + 12));
  const intro = prog(frame, 0, 16, ease.out);
  const Z = lerp(1, 1.05, prog(frame, 0, 150, ease.sine));
  const counterIn = prog(frame, p.startAt - 6, p.startAt + 6, ease.out);
  const big = (portrait ? 150 : 128) * u;
  const tx = portrait ? 70 * u : w * 0.07;
  const ty = portrait ? h * 0.12 : h * 0.13;

  return (
    <AbsoluteFill style={{background: '#0E0F11'}}>
      <AbsoluteFill style={{transform: `scale(${Z})`, transformOrigin: `${vx}px ${hy}px`, opacity: intro, filter: p.mono && p.src ? 'grayscale(1) contrast(1.05) sepia(0.12)' : undefined}}>
        {p.src ? (
          <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <Svg>
            <GroundPhoto w={w} h={h} u={u} hy={hy} id={id} />
          </Svg>
        )}
        <Svg>
          {/* tape shadow + tape */}
          {len > 0.01 && (
            <>
              <polygon points={[...left, ...right].join(' ')} fill="#000" opacity={0.22} transform={`translate(${3 * u} ${4 * u})`} />
              <polygon points={[...left, ...right].join(' ')} fill={p.accent} opacity={0.92} />
              <polyline points={left.join(' ')} fill="none" stroke="#7a2a0c" strokeWidth={1.2 * u} opacity={0.7} />
              {ticks}
            </>
          )}
          {/* a standing figure for scale (procedural photo only) */}
          {!p.src &&
            (() => {
              const D = D0 + 16;
              const [fxp, fyp] = proj(p.startX - 3.4, D);
              const hp = (K / D) * (1.75 / 3.2);
              const lw = hp * 0.075;
              return (
                <g stroke="#2b2a27" strokeLinecap="round" fill="#2b2a27">
                  <ellipse cx={fxp + hp * 0.15} cy={fyp} rx={hp * 0.2} ry={hp * 0.025} fill="#000" stroke="none" opacity={0.25} />
                  <path d={`M${fxp - hp * 0.05} ${fyp} L${fxp - hp * 0.02} ${fyp - hp * 0.48} M${fxp + hp * 0.06} ${fyp} L${fxp + hp * 0.02} ${fyp - hp * 0.48}`} strokeWidth={lw} fill="none" />
                  <path d={`M${fxp - hp * 0.075} ${fyp - hp * 0.47} L${fxp - hp * 0.085} ${fyp - hp * 0.8} L${fxp + hp * 0.085} ${fyp - hp * 0.8} L${fxp + hp * 0.075} ${fyp - hp * 0.47} Z`} strokeWidth={lw * 0.3} />
                  <path d={`M${fxp - hp * 0.08} ${fyp - hp * 0.78} L${fxp - hp * 0.11} ${fyp - hp * 0.5} M${fxp + hp * 0.08} ${fyp - hp * 0.78} L${fxp + hp * 0.12} ${fyp - hp * 0.52}`} strokeWidth={lw * 0.8} fill="none" />
                  <circle cx={fxp} cy={fyp - hp * 0.88} r={hp * 0.065} stroke="none" />
                  <rect x={fxp - hp * 0.09} y={fyp - hp * 0.97} width={hp * 0.18} height={hp * 0.035} stroke="none" />
                </g>
              );
            })()}
          {/* start + end markers */}
          {ping > 0 && <circle cx={s0x} cy={s0y} r={(6 + 30 * ping) * u} fill="none" stroke={p.accent} strokeWidth={3 * u} opacity={1 - ping} />}
          {frame >= p.startAt - 4 && <circle cx={s0x} cy={s0y} r={7 * u} fill="#15171A" stroke="#fff" strokeWidth={2.5 * u} />}
          {done > 0 && (
            <g opacity={done}>
              <line x1={e0x} y1={e0y} x2={e0x} y2={e0y - 120 * u * done} stroke="#15171A" strokeWidth={2.5 * u} />
              <circle cx={e0x} cy={e0y} r={6 * u} fill={p.accent} stroke="#fff" strokeWidth={2 * u} />
              <circle cx={e0x} cy={e0y - 120 * u * done} r={5 * u} fill="#15171A" />
            </g>
          )}
        </Svg>
      </AbsoluteFill>
      <Svg>
        <defs>
          <radialGradient id={`${id}-v`} cx="0%" cy="0%" r="70%">
            <stop offset="0" stopColor="#0e0f11" stopOpacity={0.55} />
            <stop offset="1" stopColor="#0e0f11" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}-v)`} opacity={counterIn} />
        <g opacity={counterIn}>
          <text x={tx} y={ty} fontFamily={lf.sans} fontWeight={600} fontSize={26 * u} letterSpacing={4 * u} fill="#f1f2f3">
            {p.label}
          </text>
          <text x={tx} y={ty + big * 1.02} fontFamily={lf.plex} fontWeight={500} fontSize={big} fill="#ffffff" style={{fontVariantNumeric: 'tabular-nums'}}>
            {fmt(len)}
            <tspan fontSize={big * 0.36} dx={14 * u} fill="#d8dadc">
              {p.unit}
            </tspan>
          </text>
          <rect x={tx} y={ty + big * 1.2} width={(portrait ? 360 : 420) * u * done} height={5 * u} fill={p.accent} />
        </g>
      </Svg>
      <FilmGrain opacity={0.07} />
    </AbsoluteFill>
  );
};

export const groundPlaneRuler = defineMotion<Props>({
  id: 'ground-plane-ruler',
  title: 'Ground-plane ruler',
  category: 'data',
  description:
    'A measuring tape is laid on the ground of a photograph in true one-point perspective, its ticks crowding toward the horizon, while a big mono counter runs and lands on the measured distance.',
  source: ['lemo-opuscar styles/archive-lighttable demo/film.js measure() (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §1 ground-plane-ruler'],
  useFor: 'Distances, spans and heights on real photos — sports, architecture, travel, history ("the first flight covered 120 ft").',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    horizonY: 0.5,
    vanishX: 0.56,
    value: 260,
    unit: 'M',
    label: 'DISTANCE COVERED',
    tickEvery: 10,
    labelEvery: 50,
    startDistance: 14,
    startX: -2.2,
    endX: 9,
    tapeWidth: 0.8,
    startAt: 22,
    runFrames: 78,
    accent: '#FF5A1F',
    mono: true,
  },
  propDocs: {
    src: 'public/ photo with a visible ground plane (empty = procedural archive beach)',
    horizonY: 'horizon height as a fraction of the frame height (match your photo)',
    vanishX: 'vanishing point x as a fraction of the width',
    value: 'measured length in units (the counter lands here)',
    unit: 'unit label after the number',
    label: 'caption above the counter',
    tickEvery: 'units between minor ticks',
    labelEvery: 'units between numbered major ticks',
    startDistance: 'ground distance from the camera to the tape start (bigger = flatter perspective)',
    startX: 'lateral ground position of the tape start (units, negative = left)',
    endX: 'lateral ground position of the tape end',
    tapeWidth: 'tape width in ground units',
    startAt: 'frame the tape starts running',
    runFrames: 'frames for the tape to reach its end',
    accent: 'tape / signal colour',
    mono: 'grade a supplied photo to silver-gelatin greys',
  },
  component: GroundRuler,
  tags: ['ruler', 'measure', 'tape', 'distance', 'perspective', 'ground plane', 'counter', 'number', 'photo', 'archive', 'span', 'length', 'sports', 'architecture', 'data', 'evidence'],
});
