import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {rng, range} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {GrassField, GrassRow, Moon, Stars, goldenRows, makeRidge, mix, ridgePath, tealRows} from '../../core/world-kit';

type Props = {
  mode: 'rise' | 'set';
  background: string;
  sunCore: string;
  sunRim: string;
  rayColor: string;
  rayCount: number;
  rayLength: number;
  sunScale: number;
  riseStart: number;
  riseFrames: number;
  grass: boolean;
  golden: boolean;
  moon: boolean;
  bands: string[];
  duskBands: string[];
  land: string[];
  grain: number;
  seed: string;
  /** round-2: print-style sky ('thinning' stripes, no wobble) + concentric sun rings (set mode) */
  bandStyle: 'wobble' | 'thinning';
  sunRings: number;
  stripes: number;
};

const quadOut = Easing.out(Easing.quad);

/** ---------------- sunrise (video15 sunrise-disc-rise) */
const Rise: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, portrait, durationInFrames} = useStage();
  const id = `sun-rise-set-${p.seed}`;
  const R = 0.433 * Math.min(w, h) * p.sunScale * (portrait ? 1.05 : 1);
  const finalY = portrait ? h * 0.56 : h * 0.43;
  const t = prog(frame, p.riseStart, p.riseStart + p.riseFrames, quadOut);
  const sy = interpolate(t, [0, 1], [h + R, finalY]);
  const rayStart = p.riseStart + p.riseFrames * 0.7;
  const r = rng(`${p.seed}-rays`);
  const rays = Array.from({length: p.rayCount}, (_, i) => ({
    a: (i / p.rayCount) * 360 + range(r, -1.5, 1.5),
    len: p.rayLength * range(r, 0.85, 1.15),
    base: range(r, 11, 14),
    ph: r() * 6.28,
  }));
  const spin = Math.max(0, frame - rayStart) * 0.06;
  const k = portrait ? 1.6 : 1;
  const rows: GrassRow[] = [tealRows(k)[0], ...(p.golden ? goldenRows(k, Math.round(p.riseStart + p.riseFrames * 1.05)) : []), tealRows(k)[1], tealRows(k)[2]];
  const moonT = t;
  const push = 1 + 0.05 * prog(frame, p.riseStart + p.riseFrames, durationInFrames, ease.sine);
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg style={{transform: `scale(${push})`, transformOrigin: `${cx}px ${finalY}px`}}>
        <defs>
          <radialGradient id={`${id}-sun`} cx="50%" cy="40%" r="62%">
            <stop offset="0%" stopColor={p.sunCore} />
            <stop offset="100%" stopColor={p.sunRim} />
          </radialGradient>
          <radialGradient id={`${id}-glow`}>
            <stop offset="55%" stopColor={p.sunRim} stopOpacity={0.28} />
            <stop offset="100%" stopColor={p.sunRim} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}-ray`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={p.rayColor} />
            <stop offset="100%" stopColor={mix(p.rayColor, p.background, 0.75)} />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <circle cx={cx} cy={sy} r={R} />
          </clipPath>
          <filter id={`${id}-speck`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.75} numOctaves={1} seed={7} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.1  0 0 0 0 0.06  9 0 0 0 -5.6" />
          </filter>
        </defs>
        <Stars w={w} h={h} u={u} frame={frame} count={110} seed={`${p.seed}-st`} opacity={1 - 0.6 * t} maxY={0.8} />
        {p.moon && <Moon id={`${id}-moon`} x={w * (portrait ? 0.74 : 0.7)} y={h * (portrait ? 0.14 : 0.2) + 40 * u * moonT} r={32 * u} opacity={1 - moonT} />}
        <circle cx={cx} cy={sy} r={R * 1.35} fill={`url(#${id}-glow)`} opacity={t} />
        {/* spike-ray corona */}
        <g transform={`translate(${cx},${sy}) rotate(${spin})`}>
          {rays.map((ray, i) => {
            // clockwise wave from 12 o'clock
            const st = rayStart + (i / p.rayCount) * 9;
            const g = ease.out(clamp((frame - st) / 8));
            if (g <= 0) return null;
            const L = ray.len * u * g * (1 + 0.08 * Math.sin(frame * 0.12 + ray.ph));
            const b = ray.base * u;
            return (
              <g key={i} transform={`rotate(${ray.a}) translate(0,${-(R + 4 * u)})`}>
                <polygon points={`${-b / 2},0 ${b / 2},0 0,${-L}`} fill={`url(#${id}-ray)`} />
              </g>
            );
          })}
        </g>
        <circle cx={cx} cy={sy} r={R} fill={`url(#${id}-sun)`} />
        <g clipPath={`url(#${id}-clip)`} opacity={0.6}>
          <rect x={cx - R} y={sy - R} width={R * 2} height={R * 2} filter={`url(#${id}-speck)`} />
        </g>
        {p.grass && (
          <GrassField id={`${id}-grass`} rows={rows} baseY={h + 10 * u} x0={-40 * u} x1={w + 40 * u} u={u} w={w} frame={frame} seed={`${p.seed}-g`} swayAmp={2} gust={5} growAt={-1} />
        )}
      </Svg>
      {p.grain > 0 && <FilmGrain opacity={p.grain} />}
    </AbsoluteFill>
  );
};

/** ---------------- sunset (video1 sun-set-descent) */
const SetScene: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D, portrait} = useStage();
  const id = `sun-rise-set-${p.seed}`;
  const horizon = h * (portrait ? 0.56 : 0.6);
  const dusk = prog(frame, 0, D, ease.sine);
  const nb = p.bands.length;
  const bandCol = (i: number) => mix(p.bands[i], p.duskBands[i % p.duskBands.length], dusk);
  // stepped bands: thinner near the horizon
  const edges = Array.from({length: nb + 1}, (_, i) => horizon * (1 - Math.pow(1 - i / nb, 1.25)));
  const wob = (i: number) => makeRidge(`${p.seed}-band${i}`, w * 1.5, [2, 3, 5, 9], 0.6);
  const sr = Math.min(w, h) * 0.045 * p.sunScale;
  const sunX = w * (portrait ? 0.66 : 0.68);
  // sinks ~0.5 diameter per second
  const sunY = interpolate(frame, [0, D], [horizon - sr * 3.6, horizon + sr * 1.4]);
  const near = clamp(1 - (horizon - sunY) / (sr * 3));
  const sunCol = mix('#fff3d6', '#e8a54a', ease.inOut(near));
  const rot = (frame / 30) * 10;
  const r = rng(`${p.seed}-clouds`);
  const clouds = Array.from({length: 9}, () => ({x: r() * w * 1.3, y: range(r, 0.12, 0.85) * horizon, l: range(r, 0.08, 0.26) * w, th: range(r, 2, 5) * u, sp: range(r, 0.2, 0.6)}));
  const far = makeRidge(`${p.seed}-far`, w * 2, [2, 3, 5, 8, 13], 0.55);
  const mid = makeRidge(`${p.seed}-mid`, w * 2, [1, 3, 4, 7], 0.6);
  const landA = mix(p.land[0], '#3a2f48', dusk * 0.8);
  const landB = mix(p.land[1], '#2c2438', dusk * 0.8);
  const landC = mix(p.land[2] ?? p.land[1], '#1f1a29', dusk * 0.8);
  const river = mix('#e9b08f', '#9c5f7a', dusk);
  const tr = rng(`${p.seed}-trees`);
  const trees = Array.from({length: 14}, () => ({x: tr() * w, s: range(tr, 0.6, 1.2)}));
  const lights = Array.from({length: 26}, () => ({x: range(tr, 0.05, 0.6) * w, y: range(tr, 0.006, 0.03), d: tr()}));
  const starIn = prog(frame, D * 0.7, D * 0.7 + 8, ease.back);
  // river: perspective band winding from the horizon to the bottom
  const riverPts = (side: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const s = i / 24;
      const y = horizon + 4 * u + s * (h - horizon);
      const xc = w * (0.42 + 0.16 * Math.sin(s * 4.2 + 0.6) * (0.3 + s));
      const half = (6 + s * s * 260) * u * 0.5;
      pts.push([xc + side * half, y]);
    }
    return pts;
  };
  const L = riverPts(-1);
  const Rr = riverPts(1).reverse();
  const riverD = 'M' + [...L, ...Rr].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
  return (
    <AbsoluteFill style={{background: bandCol(0)}}>
      <Svg>
        <defs>
          <clipPath id={`${id}-above`}>
            <rect x={0} y={0} width={w} height={horizon} />
          </clipPath>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0%" stopColor={sunCol} stopOpacity={0.55} />
            <stop offset="100%" stopColor={sunCol} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* stepped sky bands with soft wobbly tops */}
        {p.bandStyle === 'thinning' &&
          Array.from({length: nb}, (_, i) => {
            if (i === 0) return null;
            const yTop = edges[i];
            const yBot = i + 1 < nb ? edges[i + 1] : horizon;
            const zone = Math.max(0, (yBot - yTop) * 0.55);
            const n = Math.max(1, Math.round(p.stripes));
            return (
              <g key={`t${i}`}>
                <rect x={0} y={yTop} width={w} height={horizon + 2 - yTop} fill={bandCol(i)} />
                {Array.from({length: n}, (_, k) => {
                  const th = (zone / n) * (1 - (k + 0.5) / n) * 0.95 + 1.2 * u;
                  return <rect key={k} x={0} y={yTop + (zone * k) / n} width={w} height={th} fill={bandCol(i - 1)} />;
                })}
              </g>
            );
          })}
        {p.bandStyle !== 'thinning' && Array.from({length: nb}, (_, i) => {
          if (i === 0) return null;
          const f = wob(i);
          const y0 = edges[i];
          return <path key={i} d={ridgePath((x) => f(x + frame * u * 0.6 * (i % 2 ? 1 : -1)), -10, w + 10, y0, 0.012 * h, horizon + 2, 12)} fill={bandCol(i)} />;
        })}
        <Stars w={w} h={h} u={u} frame={frame} count={50} seed={`${p.seed}-st`} opacity={prog(frame, D * 0.55, D, ease.sine) * 0.8} maxY={0.35} />
        {/* thin cream streak clouds */}
        {clouds.map((c, i) => {
          const x = ((c.x - frame * c.sp * u) % (w * 1.3)) - w * 0.15;
          return <line key={i} x1={x} y1={c.y} x2={x + c.l} y2={c.y} stroke={mix('#f5edda', '#c78a9a', dusk)} strokeWidth={c.th} strokeLinecap="round" opacity={0.55} />;
        })}
        {/* sun + rotating dashed rays, clipped by the horizon */}
        <g clipPath={`url(#${id}-above)`}>
          <circle cx={sunX} cy={sunY} r={sr * 4} fill={`url(#${id}-halo)`} />
          <g transform={`translate(${sunX},${sunY}) rotate(${rot})`} opacity={0.6 * (1 - near * 0.7)}>
            {Array.from({length: Math.max(1, p.rayCount)}, (_, i) => {
              const a = (i / p.rayCount) * Math.PI * 2;
              const l0 = sr * 1.35;
              const l1 = sr * (1.6 + (i % 3) * 0.35) * (p.rayLength / 65);
              return <line key={i} x1={Math.cos(a) * l0} y1={Math.sin(a) * l0} x2={Math.cos(a) * l1} y2={Math.sin(a) * l1} stroke={sunCol} strokeWidth={2 * u} strokeLinecap="round" />;
            })}
          </g>
          {Array.from({length: Math.max(0, Math.round(p.sunRings))}, (_, i) => (
            <circle key={`ring${i}`} cx={sunX} cy={sunY} r={sr * (1.5 + i * 0.5)} fill="none" stroke={sunCol} strokeWidth={Math.max(1.5, 2.4 * u)} opacity={0.65 - i * 0.15} />
          ))}
          <circle cx={sunX} cy={sunY} r={sr} fill={sunCol} />
        </g>
        {/* tiny 4-point star near top centre */}
        {starIn > 0 && <Sparkle x={w * 0.5} y={h * 0.08} size={9 * u * starIn * (1 + 0.15 * Math.sin(frame * 0.4))} color="#fdf3db" />}
        {/* land */}
        <path d={ridgePath(far, -10, w + 10, horizon + 2 * u, 0.018 * h, h, 10)} fill={landA} />
        {lights.map((l, i) => {
          const on = clamp((dusk - 0.35 - l.d * 0.4) * 8);
          return on > 0 ? <rect key={i} x={l.x} y={horizon + l.y * h} width={3 * u} height={3 * u} fill="#ffd27a" opacity={on} /> : null;
        })}
        <path d={ridgePath(mid, -10, w + 10, horizon + 0.07 * h, 0.02 * h, h, 10)} fill={landB} />
        {trees.map((t, i) => {
          const y = horizon + 0.07 * h - 0.02 * h * mid(t.x) + 2 * u;
          return <ellipse key={i} cx={t.x} cy={y - 12 * u * t.s} rx={14 * u * t.s} ry={16 * u * t.s} fill={landC} />;
        })}
        <path d={riverD} fill={river} />
        <path d={riverD} fill="none" stroke={landC} strokeWidth={2 * u} opacity={0.5} />
        {/* foreground reeds */}
        <path d={ridgePath(makeRidge(`${p.seed}-fg`, w, [2, 5, 9], 0.6), -10, w + 10, h - 0.06 * h, 0.02 * h, h + 4, 10)} fill={landC} />
        {Array.from({length: 46}, (_, i) => {
          const rr = rng(`${p.seed}-reed${i}`);
          const x = rr() * w;
          const hh = range(rr, 0.04, 0.12) * h;
          const sway = Math.sin(frame * 0.05 + i) * 4 * u;
          return <path key={i} d={`M${x} ${h}Q${x + sway * 0.5} ${h - hh * 0.5} ${x + sway} ${h - hh}`} stroke={landC} strokeWidth={1.6 * u} fill="none" />;
        })}
      </Svg>
      {p.grain > 0 && <FilmGrain opacity={p.grain} />}
    </AbsoluteFill>
  );
};

const SunRiseSet: React.FC<Props> = (p) => (p.mode === 'set' ? <SetScene {...p} /> : <Rise {...p} />);

export const sunRiseSet = defineMotion<Props>({
  id: 'sun-rise-set',
  title: 'Sun rise / sun set',
  category: 'environment',
  description:
    'Sunrise: a huge orange gradient disc rises from behind teal grass with an ease-out, grows a ring of spike rays and golden leaves pop up over a starry night. Sunset mode: stepped purple-to-peach sky bands, a cream sun with rotating dashed rays sinks behind the horizon and the sky darkens to dusk.',
  source: ['video15 0:00-0:03 sunrise-disc-rise', 'video1 0:52-0:58 sun-set-descent'],
  useFor: 'Openers, "a new day" beats, endings and time-passing; a giant backlight disc behind a hero.',
  durationInFrames: 150,
  defaultProps: {
    mode: 'rise',
    background: '#0c1820',
    sunCore: '#fb8346',
    sunRim: '#f1643e',
    rayColor: '#c4573c',
    rayCount: 70,
    rayLength: 72,
    sunScale: 1,
    riseStart: 6,
    riseFrames: 45,
    grass: true,
    golden: true,
    moon: true,
    bands: ['#8d5f88', '#a76a82', '#bb727d', '#d08a80', '#dcab8c', '#f5edda'],
    duskBands: ['#423463', '#563d6e', '#6e4672', '#8a5272', '#a8636a', '#d08a6c'],
    bandStyle: 'wobble',
    sunRings: 0,
    stripes: 5,
    land: ['#65536e', '#50425e', '#3f344c'],
    grain: 0.07,
    seed: 'sun',
  },
  propDocs: {
    mode: '"rise" (video15 sunrise disc) or "set" (video1 sunset descent)',
    background: 'night sky colour (rise mode)',
    sunCore: 'sun gradient centre colour (rise)',
    sunRim: 'sun gradient rim colour (rise)',
    rayColor: 'spike ray colour (rise)',
    rayCount: 'number of rays (70 rise, try 36 for set)',
    rayLength: 'ray length in u (rise) / ray length scale (set)',
    sunScale: 'sun size multiplier',
    riseStart: 'frame the sun starts rising',
    riseFrames: 'rise duration in frames (ease-out quad)',
    grass: 'teal grass foreground (rise)',
    golden: 'golden leaves pop up after the rise',
    moon: 'crescent moon that sinks and fades as the sun rises',
    bands: 'sunset sky band colours, top to horizon (set)',
    duskBands: 'the same bands at full dusk (set)',
    bandStyle: "set mode: 'wobble' (default soft wobbly band tops) | 'thinning' (flat colour stepping into the next via thinning stripes — instant screen-print sky, no gradients)",
    sunRings: 'set mode: concentric rings around the sun disc (0 = none, 2-3 = print look)',
    stripes: "set mode, bandStyle 'thinning': stripes per band transition (5)",
    land: 'land layer colours far to near (set)',
    grain: 'film grain opacity',
    seed: 'random seed',
  },
  component: SunRiseSet,
  tags: ['sun', 'sunrise', 'sunset', 'sky', 'dusk', 'rays', 'screenprint', 'poster', 'banded-sky', 'stepped-bands', 'rings'],
});
