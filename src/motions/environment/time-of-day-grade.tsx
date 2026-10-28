import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng, range} from '../../core/random';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {SEASON_PALETTES, SeasonParticles, seasonMix} from '../../core/r2-e2-season-kit';
import {Moon, Stars, circlesD, makeRidge, mix, ramp, ridgePath} from '../../core/world-kit';

type Stop = {t: number; skyTop: string; skyBottom: string; sun: string; grade: string};

type Props = {
  stops: Stop[];
  holdStart: number;
  holdEnd: number;
  lights: boolean;
  lightsAt: number;
  nightGrade: number;
  sun: boolean;
  moon: boolean;
  hills: string[];
  seed: string;
  /** internal: hold the time-of-day at this 0..1 value (used by the season modes) */
  fixedT?: number;
  season?: 'off' | 'cycle' | 'spring' | 'summer' | 'autumn' | 'winter';
  seasonFrames?: number;
  seasonFade?: number;
};

const TimeOfDayGrade: React.FC<Props> = ({stops, holdStart, holdEnd, lights, lightsAt, nightGrade, sun, moon, hills, seed, fixedT}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D, portrait} = useStage();
  const id = `time-of-day-grade-${seed}`;
  const st = [...stops].sort((a, b) => a.t - b.t);
  const T = fixedT !== undefined ? fixedT : prog(frame, holdStart, D - holdEnd, ease.sine);
  const ts = st.map((s) => s.t);
  const skyTop = ramp(T, ts, st.map((s) => s.skyTop));
  const skyBot = ramp(T, ts, st.map((s) => s.skyBottom));
  const sunCol = ramp(T, ts, st.map((s) => s.sun));
  const grade = ramp(T, ts, st.map((s) => s.grade));
  // darkness drives night grade, lights, stars
  const dark = clamp((T - 0.45) / 0.5);
  const hz = h * (portrait ? 0.62 : 0.6);

  // sun arc: high -> sets behind the hills at ~T 0.62
  const sx = lerp(w * 0.3, w * 0.68, clamp(T / 0.7));
  const sy = lerp(h * (portrait ? 0.2 : 0.16), hz + 0.08 * h, Math.pow(clamp(T / 0.66), 1.4));
  const sr = Math.min(w, h) * 0.06;
  const moonT = clamp((T - 0.62) / 0.38);

  const far = makeRidge(`${seed}-far`, w * 2, [2, 3, 5, 8], 0.6);
  const mid = makeRidge(`${seed}-mid`, w * 2, [1, 2, 4, 7], 0.6);
  const near = makeRidge(`${seed}-near`, w * 2, [1, 2, 3], 0.6);
  const nearY = (x: number) => hz + 0.2 * h - 0.05 * h * near(x);
  const atm = (c: string, k: number) => mix(c, skyBot, k);

  const village = useMemo(() => {
    const r = rng(`${seed}-village`);
    const n = portrait ? 5 : 7;
    return Array.from({length: n}, (_, i) => {
      const x = w * (0.18 + (i / (n - 1)) * 0.64) + range(r, -20, 20) * u;
      return {x, bw: range(r, 60, 95) * u * (portrait ? 1.5 : 1.35), bh: range(r, 50, 80) * u * (portrait ? 1.5 : 1.35), roof: r() < 0.5 ? '#b5533c' : '#8b5a4a', win: 1 + Math.floor(r() * 2), delay: r(), chimney: r() < 0.5};
    });
  }, [seed, w, u, portrait]);
  const trees = useMemo(() => {
    const r = rng(`${seed}-trees`);
    return Array.from({length: 9}, () => ({x: r() * w, s: range(r, 0.7, 1.3)}));
  }, [seed, w]);
  const clouds = useMemo(() => {
    const r = rng(`${seed}-clouds`);
    return Array.from({length: 4}, (_, i) => ({x: (i / 4) * w * 1.2 + r() * 100 * u, y: range(r, 0.1, 0.32) * h, s: range(r, 0.8, 1.3)}));
  }, [seed, w, h, u]);

  const houseY = (x: number) => nearY(x) + 6 * u;
  const winOn = (v: (typeof village)[number]) => (lights ? clamp((dark - lightsAt - v.delay * 0.25) * 12) : 0);

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBot} 100%)`}}>
      <Svg>
        <defs>
          <radialGradient id={`${id}-sunglow`}>
            <stop offset="0%" stopColor={sunCol} stopOpacity={0.7} />
            <stop offset="100%" stopColor={sunCol} stopOpacity={0} />
          </radialGradient>
          <clipPath id={`${id}-sky`}>
            <rect x={0} y={0} width={w} height={hz + 0.06 * h} />
          </clipPath>
        </defs>
        {sun && (
          <g clipPath={`url(#${id}-sky)`}>
            <circle cx={sx} cy={sy} r={sr * 4.5} fill={`url(#${id}-sunglow)`} opacity={1 - dark * 0.8} />
            <circle cx={sx} cy={sy} r={sr} fill={mix('#fffaf0', sunCol, 0.7)} />
          </g>
        )}
        {clouds.map((c, i) => {
          const x = ((c.x + frame * 0.35 * u) % (w * 1.3)) - w * 0.15;
          const cs = [0, 1, 2, 3].map((k) => ({x: x + (k - 1.5) * 40 * u * c.s, y: c.y - (k % 2) * 16 * u * c.s, r: (30 + (k % 2) * 12) * u * c.s}));
          return (
            <g key={i}>
              <path d={circlesD(cs)} fill={mix(mix('#ffffff', skyBot, 0.25), sunCol, 0.25 * clamp(T * 2))} opacity={0.9 - dark * 0.5} />
              <path d={circlesD(cs.map((q) => ({...q, y: q.y + q.r * 0.35, r: q.r * 0.8})))} fill={mix(skyTop, sunCol, 0.35)} opacity={0.35 * (1 - dark * 0.6)} />
            </g>
          );
        })}
        <path d={ridgePath(far, -10, w + 10, hz, 0.06 * h, h, 10)} fill={atm(hills[0], 0.35)} />
        <path d={ridgePath(mid, -10, w + 10, hz + 0.09 * h, 0.04 * h, h, 10)} fill={atm(hills[1], 0.15)} />
        {trees.map((t, i) => {
          const y = hz + 0.09 * h - 0.04 * h * mid(t.x) + 6 * u;
          return <ellipse key={i} cx={t.x} cy={y - 16 * u * t.s} rx={16 * u * t.s} ry={22 * u * t.s} fill={atm(hills[2], 0.1)} />;
        })}
        <path d={(() => {
          let d = `M-10 ${h + 4}`;
          for (let x = -10; x <= w + 20; x += 10) d += `L${x} ${nearY(x).toFixed(1)}`;
          return d + `L${w + 20} ${h + 4}Z`;
        })()} fill={hills[2]} />
        {/* village */}
        {village.map((v, i) => {
          const by = houseY(v.x);
          return (
            <g key={i}>
              {v.chimney && <rect x={v.x + v.bw * 0.2} y={by - v.bh - v.bw * 0.45} width={10 * u} height={v.bw * 0.3} fill="#6d4a3a" />}
              <rect x={v.x - v.bw / 2} y={by - v.bh} width={v.bw} height={v.bh + 20 * u} fill="#e8dcc8" />
              <rect x={v.x + v.bw * 0.12} y={by - v.bh} width={v.bw * 0.38} height={v.bh + 20 * u} fill="#d4c6ae" />
              <polygon points={`${v.x - v.bw * 0.6},${by - v.bh} ${v.x},${by - v.bh - v.bw * 0.45} ${v.x + v.bw * 0.6},${by - v.bh}`} fill={v.roof} />
              {Array.from({length: v.win}, (_, k) => (
                <rect key={k} x={v.x - v.bw * 0.32 + k * v.bw * 0.36} y={by - v.bh * 0.68} width={v.bw * 0.2} height={v.bh * 0.3} fill="#5a6470" />
              ))}
              <rect x={v.x + v.bw * 0.1} y={by - v.bh * 0.42} width={v.bw * 0.18} height={v.bh * 0.42 + 20 * u} fill="#7a5a44" />
            </g>
          );
        })}
      </Svg>
      {/* colour grade: keyframed multiply wash + night multiply (video13 time-of-day-grade, video16 grade-to-night, video20 scene-grade-shift) */}
      <AbsoluteFill style={{background: grade, mixBlendMode: 'multiply', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#0C1A2E', mixBlendMode: 'multiply', opacity: nightGrade * dark * 0.8, pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#2A4060', mixBlendMode: 'screen', opacity: 0.1 * dark, pointerEvents: 'none'}} />
      {/* emissive layer: stars, moon, lit windows (not affected by the grade) */}
      <Svg>
        <defs>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={8 * u} />
          </filter>
        </defs>
        <Stars w={w} h={h} u={u} frame={frame} count={110} seed={`${seed}-st`} maxY={0.55} opacity={clamp((dark - 0.35) * 2)} />
        {moon && moonT > 0 && <Moon id={`${id}-moon`} x={w * (portrait ? 0.26 : 0.22)} y={lerp(h * 0.34, h * (portrait ? 0.14 : 0.16), ease.out(moonT))} r={32 * u} opacity={ease.out(clamp(moonT * 1.6))} />}
        {village.map((v, i) => {
          const on = winOn(v);
          if (on <= 0) return null;
          const by = houseY(v.x);
          return (
            <g key={i} opacity={on}>
              {Array.from({length: v.win}, (_, k) => {
                const x = v.x - v.bw * 0.32 + k * v.bw * 0.36;
                const y = by - v.bh * 0.68;
                return (
                  <g key={k}>
                    <rect x={x - 6 * u} y={y - 6 * u} width={v.bw * 0.2 + 12 * u} height={v.bh * 0.3 + 12 * u} fill="#ffb84a" filter={`url(#${id}-glow)`} opacity={0.8} />
                    <rect x={x} y={y} width={v.bw * 0.2} height={v.bh * 0.3} fill="#ffd27a" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </Svg>
      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};

/** season modes: crossfade fixed-time village scenes per season and add falling petals / leaves / snow */
const TimeOfDayRoot: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {durationInFrames: D} = useStage();
  if (!p.season || p.season === 'off') return <TimeOfDayGrade {...p} />;
  const mix = seasonMix(frame, D, p.season, p.seasonFrames ?? 0, p.seasonFade ?? 18);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {mix.map((m) => {
        const pal = SEASON_PALETTES[m.season];
        const stops = [{t: 0, skyTop: pal.skyTop, skyBottom: pal.skyBottom, sun: pal.sun, grade: pal.grade}, {t: 1, skyTop: pal.skyTop, skyBottom: pal.skyBottom, sun: pal.sun, grade: pal.grade}];
        return (
          <AbsoluteFill key={m.season} style={{opacity: m.alpha}}>
            <TimeOfDayGrade {...p} stops={stops} hills={pal.hills} fixedT={pal.fixedT} lights={false} moon={false} nightGrade={0} seed={p.seed} />
          </AbsoluteFill>
        );
      })}
      {mix.map((m) => (
        <SeasonParticles key={m.season} season={m.season} alpha={m.alpha} seed={p.seed} />
      ))}
    </AbsoluteFill>
  );
};

export const timeOfDayGrade = defineMotion<Props>({
  id: 'time-of-day-grade',
  title: 'Time-of-day grade (day to night)',
  category: 'environment',
  description:
    'A simple procedural hillside village whose sky gradient and colour grade keyframe from day through golden hour, dusk pink and mauve to night: the sun arcs down and sets behind the hills, clouds pick up the sunset, a multiply night grade cools everything, the moon and stars come out and the house windows switch on one by one.',
  source: ['video13 time-of-day-grade', 'video16 0:44-0:46 grade-to-night', 'video20 scene-grade-shift'],
  useFor: 'Time passing, "by the end of the day", before/after moods, calm transitions between story beats.',
  durationInFrames: 240,
  defaultProps: {
    stops: [
      {t: 0, skyTop: '#7fa6d6', skyBottom: '#cfe0ec', sun: '#fff3d0', grade: '#ffffff'},
      {t: 0.3, skyTop: '#8aa3cf', skyBottom: '#f2d9b8', sun: '#ffd27a', grade: '#fff0dc'},
      {t: 0.5, skyTop: '#9a7fa8', skyBottom: '#f0a07a', sun: '#ff8a4a', grade: '#f7d3c4'},
      {t: 0.68, skyTop: '#4b3a6a', skyBottom: '#c27a7f', sun: '#e8603a', grade: '#d1a8bd'},
      {t: 0.85, skyTop: '#1c1a44', skyBottom: '#4a3a66', sun: '#c2503a', grade: '#9a90bd'},
      {t: 1, skyTop: '#0d1030', skyBottom: '#302F60', sun: '#a0402a', grade: '#8a86b8'},
    ],
    holdStart: 12,
    holdEnd: 30,
    lights: true,
    lightsAt: 0.25,
    nightGrade: 0.75,
    sun: true,
    moon: true,
    hills: ['#9db4c4', '#7fa37a', '#5f8f4f'],
    seed: 'village',
    season: 'off',
    seasonFrames: 0,
    seasonFade: 18,
  },
  propDocs: {
    stops: 'grade keyframes [{t 0..1, skyTop, skyBottom, sun, grade}] (grade = multiply wash colour)',
    holdStart: 'frames held at the first stop',
    holdEnd: 'frames held at the last stop',
    lights: 'house windows switch on as it gets dark',
    lightsAt: 'darkness (0..1) at which the first windows light',
    nightGrade: 'strength of the #0C1A2E night multiply layer (video16 uses 0.75)',
    sun: 'sun disc that sets behind the hills',
    moon: 'moon rising at night',
    hills: 'hill colours far, mid, near (before grading)',
    seed: 'random seed',
    season: "off (day to night) | cycle (spring -> summer -> autumn -> winter with petals, leaves, snow) | spring | summer | autumn | winter (one fixed season)",
    seasonFrames: 'cycle: frames per season (0 = split the duration in four; 2-4 s each is typical)',
    seasonFade: 'cycle: crossfade frames between seasons (≈30 in the source)',
  },
  component: TimeOfDayRoot,
  tags: ['time', 'day', 'night', 'grade', 'sunset', 'mood', 'village', 'season', 'seasons', 'spring', 'autumn', 'winter', 'snow', 'petals', 'leaves', 'year in review'],
});
