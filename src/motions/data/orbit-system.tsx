import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {keplerXY, mixHex, hexA, useUid, fitSize} from '../../core/r2-pr4-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Orbit system: a star and bodies on dashed elliptical orbits at Kepler-ish speeds (period ~ a^1.5, solved from the
 * mean anomaly so they speed up near periapsis), name labels with live orbit counters, an elapsed-years readout, then
 * a smooth zoom from the whole system into one body with a spec card. Schematic radial scale (compressed).
 */
type Body = {name: string; a: number; e: number; period?: number; r: number; color: string; ring?: boolean; moon?: boolean};
type Props = {
  title: string;
  subtitle: string;
  starName: string;
  bodies: Body[];
  background: string;
  starColor: string;
  inkColor: string;
  accent: string;
  timeScale: number;
  tilt: number;
  focus: string;
  focusAt: number;
  focusFrames: number;
  unit: string;
  labels: boolean;
  counter: boolean;
  stars: number;
  seed: number;
  elapsedLabel: string;
  focusLabels: string[];
  distanceUnit: string;
};

const BODIES: Body[] = [
  {name: 'Ember', a: 0.7, e: 0.12, r: 7, color: '#d9a066'},
  {name: 'Verdi', a: 1.3, e: 0.05, r: 11, color: '#58b88a'},
  {name: 'Azur', a: 2.1, e: 0.09, r: 12, color: '#4f8fe8', moon: true},
  {name: 'Rust', a: 3.1, e: 0.17, r: 9, color: '#d9603f'},
  {name: 'Titan', a: 4.6, e: 0.07, r: 21, color: '#e7c58a', ring: true},
];

const OrbitSystem: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const PT = portrait ? 1.75 : 1;
  const uid = useUid('orb');
  const bodies = p.bodies.length ? p.bodies : BODIES;
  const aMax = Math.max(...bodies.map((b) => b.a));
  const ink = p.inkColor;
  const tilt = clamp(portrait ? Math.max(p.tilt, 0.9) : p.tilt, 0.25, 1);
  const sunR = 30 * u;

  // layout: outermost orbit (with its eccentricity) fits the frame
  const fitW = portrait ? w * 0.36 : Math.min(w * 0.42, h * 0.62 / tilt);
  const dispA = (a: number) => sunR * 1.9 + Math.pow(a / aMax, 0.62) * (fitW - sunR * 1.9);

  const years = (frame / 30) * p.timeScale;
  const info = bodies.map((b, i) => {
    const per = b.period ?? Math.pow(b.a, 1.5);
    const g = rng(p.seed * 17 + i * 5 + 3);
    const om = g() * Math.PI * 2;
    const M0 = g() * Math.PI * 2;
    return {b, per, om, M0, A: dispA(b.a)};
  });

  const pos = (i: number, yrs: number): [number, number] => {
    const o = info[i];
    const [ex, ey] = keplerXY(o.M0 + (yrs / o.per) * Math.PI * 2, o.b.e);
    const x = o.A * ex;
    const y = o.A * ey;
    const c = Math.cos(o.om);
    const s = Math.sin(o.om);
    return [x * c - y * s, (x * s + y * c) * tilt];
  };

  // focus / zoom
  const fi = Math.max(0, info.findIndex((o) => o.b.name.toLowerCase() === p.focus.toLowerCase()));
  const hasFocus = p.focusAt >= 0 && p.focus !== '';
  const zIn = hasFocus ? prog(frame, p.focusAt, p.focusAt + p.focusFrames, ease.inOut) : 0;
  const fb = info[fi];
  const targetScale = (110 * u) / (fb.b.r * u);
  const S = Math.exp(lerp(0, Math.log(Math.max(1.5, targetScale)), zIn));
  const fpos = pos(fi, years);
  const ox = lerp(0, -fpos[0], zIn);
  const oy = lerp(0, -fpos[1], zIn);
  const orbitY = portrait ? cy - h * 0.02 : cy + 6 * u;
  // screen transform
  const sx = (x: number) => cx + (x + ox) * S;
  const sy = (y: number) => orbitY + (y + oy) * S;

  const stars = React.useMemo(() => {
    const g = rng(p.seed + 99);
    return Array.from({length: p.stars}, () => ({x: g(), y: g(), r: 0.4 + g() * 1.3, t: g() * 6.28, s: 0.5 + g() * 1.5}));
  }, [p.stars, p.seed]);

  const intro = (i: number) => prog(frame, 4 + i * 6, 30 + i * 6, ease.out);
  const labelA = (i: number) => clamp(prog(frame, 26 + i * 6, 40 + i * 6) * (1 - zIn), 0, 1);

  // orbit polylines
  const orbitPath = (i: number) => {
    const o = info[i];
    const pts: string[] = [];
    const N = 96;
    for (let k = 0; k <= N; k++) {
      const E = (k / N) * Math.PI * 2; // uniform in eccentric anomaly: same curve as the trajectory
      const x = o.A * (Math.cos(E) - o.b.e);
      const y = o.A * Math.sqrt(1 - o.b.e * o.b.e) * Math.sin(E);
      const c = Math.cos(o.om);
      const s = Math.sin(o.om);
      const X = sx(x * c - y * s);
      const Y = sy((x * s + y * c) * tilt);
      pts.push(`${k ? 'L' : 'M'}${X.toFixed(1)},${Y.toFixed(1)}`);
    }
    return pts.join('');
  };

  const sunS = S;
  const starFade = 1 - zIn * 0.85;
  const draw = (i: number) => {
    const per = info[i].per;
    const [x, y] = pos(i, years);
    return {x: sx(x), y: sy(y), z: y, per};
  };
  const items = info.map((o, i) => ({...draw(i), i, o}));
  const sorted = items.slice().sort((a, b) => a.z - b.z);
  const sunLabelA = prog(frame, 14, 34) * (1 - zIn);

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <radialGradient id={uid + 'sun'}>
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.25" stopColor={mixHex(p.starColor, '#ffffff', 0.5)} />
            <stop offset="0.6" stopColor={p.starColor} />
            <stop offset="1" stopColor={mixHex(p.starColor, '#ff5a1f', 0.5)} />
          </radialGradient>
          <radialGradient id={uid + 'halo'}>
            <stop offset="0" stopColor={p.starColor} stopOpacity="0.5" />
            <stop offset="1" stopColor={p.starColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={uid + 'bg'} cx="50%" cy="50%" r="75%">
            <stop offset="0" stopColor={mixHex(p.background, '#ffffff', 0.07)} />
            <stop offset="1" stopColor={p.background} />
          </radialGradient>
          {info.map((o, i) => (
            <radialGradient key={i} id={uid + 'b' + i} cx="35%" cy="32%" r="75%">
              <stop offset="0" stopColor={mixHex(o.b.color, '#ffffff', 0.5)} />
              <stop offset="0.55" stopColor={o.b.color} />
              <stop offset="1" stopColor={mixHex(o.b.color, '#000000', 0.62)} />
            </radialGradient>
          ))}
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}bg)`} />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x * w} cy={s.y * h} r={s.r * u} fill="#fff" opacity={(0.25 + 0.45 * (0.5 + 0.5 * Math.sin(frame * 0.05 * s.s + s.t))) * (0.4 + 0.6 * starFade)} />
        ))}

        {/* orbits */}
        {info.map((o, i) => {
          const a = intro(i);
          const dim = i === fi ? 1 - zIn * 0.4 : 1 - zIn * 0.9;
          return (
            <path key={i} d={orbitPath(i)} fill="none" stroke={hexA(ink, 0.5)} strokeWidth={1.3 * u} strokeDasharray={`${7 * u} ${7 * u}`} opacity={a * dim * 0.9} strokeDashoffset={-frame * 0.4 * u} />
          );
        })}

        {/* star */}
        <g opacity={prog(frame, 0, 22, ease.out) * (1 - zIn * 0.95)}>
          <circle cx={sx(0)} cy={sy(0)} r={sunR * 2.6 * sunS} fill={`url(#${uid}halo)`} />
          <circle cx={sx(0)} cy={sy(0)} r={sunR * sunS * (1 + 0.015 * Math.sin(frame * 0.12))} fill={`url(#${uid}sun)`} />
        </g>
        {p.starName && (
          <text x={sx(0)} y={sy(0) + sunR * sunS + 26 * u} textAnchor="middle" fontFamily={fonts.mono} fontSize={14 * PT * u} letterSpacing={2 * u} fill={ink} opacity={sunLabelA * 0.8}>
            {p.starName.toUpperCase()}
          </text>
        )}

        {/* bodies, back to front */}
        {sorted.map(({x, y, i, o}) => {
          const b = o.b;
          const rr = b.r * u * S * intro(i);
          const dim = i === fi ? 1 : 1 - zIn * 0.92;
          const [mx, my] = [Math.cos(years * 9 + i) * (b.r * 2.2 + 8) * u * S, Math.sin(years * 9 + i) * (b.r * 2.2 + 8) * u * S * tilt];
          return (
            <g key={i} opacity={dim}>
              {b.ring && <ellipse cx={x} cy={y} rx={rr * 2.1} ry={rr * 0.62} fill="none" stroke={hexA(mixHex(b.color, '#ffffff', 0.3), 0.75)} strokeWidth={Math.max(1.5, rr * 0.16)} transform={`rotate(-16 ${x} ${y})`} />}
              <circle cx={x + 2 * u * S * 0.3} cy={y + rr * 0.15} r={rr * 1.04} fill="#000" opacity={0.18} />
              <circle cx={x} cy={y} r={rr} fill={`url(#${uid}b${i})`} />
              {b.ring && <path d={`M${x - rr * 2.1},${y} A${rr * 2.1},${rr * 0.62} 0 0 0 ${x + rr * 2.1},${y}`} fill="none" stroke={hexA(mixHex(b.color, '#ffffff', 0.3), 0.8)} strokeWidth={Math.max(1.5, rr * 0.16)} transform={`rotate(-16 ${x} ${y})`} />}
              {b.moon && <circle cx={x + mx} cy={y + my} r={Math.max(1.5, rr * 0.28)} fill="#e8edf5" />}
            </g>
          );
        })}

        {/* labels */}
        {p.labels &&
          items.map(({x, y, i, o}) => {
            const a = labelA(i);
            if (a <= 0.01) return null;
            const rr = o.b.r * u * S;
            const side = x > cx ? 1 : -1;
            const lx = x + side * (rr + 14 * u);
            const orbits = years / o.per;
            return (
              <g key={i} opacity={a}>
                <line x1={x + side * (rr + 3 * u)} y1={y} x2={lx - side * 4 * u} y2={y} stroke={hexA(ink, 0.5)} strokeWidth={1 * u} />
                <text x={lx} y={y - 3 * u} textAnchor={side > 0 ? 'start' : 'end'} fontFamily={fonts.sans} fontWeight={700} fontSize={19 * PT * u} fill={ink}>
                  {o.b.name}
                </text>
                <text x={lx} y={y + 17 * u} textAnchor={side > 0 ? 'start' : 'end'} fontFamily={fonts.mono} fontSize={13 * PT * u} fill={hexA(ink, 0.65)}>
                  {o.per.toFixed(2)} {p.unit} · {orbits.toFixed(1)}x
                </text>
              </g>
            );
          })}
      </Svg>

      {/* title + clock */}
      {(p.title || p.subtitle) && (
        <div style={{position: 'absolute', left: portrait ? w * 0.07 : w * 0.05, top: portrait ? h * 0.055 : h * 0.07, width: portrait ? w * 0.86 : w * 0.34, opacity: prog(frame, 6, 26) * (1 - zIn)}}>
          <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: fitSize(p.title, fonts.grotesk, (portrait ? 78 : 64) * u, (portrait ? w * 0.86 : w * 0.34), 700), color: ink, lineHeight: 1.05, letterSpacing: -1 * u}}>{p.title}</div>
          <div style={{fontFamily: fonts.mono, fontSize: (portrait ? 26 : 15) * u, letterSpacing: 2 * u, color: hexA(ink, 0.6), marginTop: 12 * u}}>{p.subtitle.toUpperCase()}</div>
        </div>
      )}
      {p.counter && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: h * 0.05, textAlign: 'center', opacity: prog(frame, 20, 40) * (1 - zIn)}}>
          <span style={{fontFamily: fonts.mono, fontSize: (portrait ? 26 : 15) * u, letterSpacing: 3 * u, color: hexA(ink, 0.55)}}>{p.elapsedLabel} </span>
          <span style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: (portrait ? 40 : 30) * u, color: ink, letterSpacing: 2 * u}}>{years.toFixed(2).padStart(5, '0')}</span>
          <span style={{fontFamily: fonts.mono, fontSize: (portrait ? 26 : 15) * u, letterSpacing: 3 * u, color: hexA(ink, 0.55)}}> {p.unit.toUpperCase()}</span>
        </div>
      )}
      {/* focus card */}
      {hasFocus && (() => {
        const a = prog(frame, p.focusAt + p.focusFrames * 0.6, p.focusAt + p.focusFrames + 14, ease.out);
        if (a <= 0.01) return null;
        const o = fb;
        const rows: [string, string][] = [
          [p.focusLabels[0], `${o.per.toFixed(2)} ${p.unit}`],
          [p.focusLabels[1], `${o.b.a.toFixed(2)} ${p.distanceUnit}`],
          [p.focusLabels[2], o.b.e.toFixed(2)],
          [p.focusLabels[3], (years / o.per).toFixed(1)],
        ];
        return (
          <div style={{position: 'absolute', left: portrait ? w * 0.08 : w * 0.64, right: portrait ? w * 0.08 : w * 0.06, top: portrait ? h * 0.7 : h * 0.3, opacity: a, transform: `translateY(${(1 - a) * 18 * u}px)`}}>
            <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 64 * u, color: ink, letterSpacing: -1 * u}}>{o.b.name}</div>
            <div style={{height: 3 * u, width: 60 * u, background: p.accent, margin: `${12 * u}px 0 ${16 * u}px`}} />
            {rows.map(([k, v]) => (
              <div key={k} style={{display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${hexA(ink, 0.18)}`, padding: `${9 * u}px 0`, fontFamily: fonts.mono, fontSize: (portrait ? 28 : 17) * u}}>
                <span style={{color: hexA(ink, 0.55), letterSpacing: 2 * u}}>{k}</span>
                <span style={{color: ink, fontWeight: 700}}>{v}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

export const orbitSystem = defineMotion<Props>({
  id: 'orbit-system',
  title: 'Orbit system',
  category: 'data',
  description:
    'A glowing star and five bodies (one ringed, one with a moon) on dashed elliptical orbits moving at Kepler-ish speeds with name labels and orbit counters and an elapsed-years readout, then a smooth zoom into one body with a spec card.',
  source: ['prompt-corpus: orbit-system (16 cases, awesome-opus5-5-videos)'],
  useFor: 'Astronomy teaching, "ecosystem" metaphors for products (a platform and its satellites), timelines of cycles, a hero background for space or science topics.',
  durationInFrames: 240,
  defaultProps: {
    title: 'A small system',
    subtitle: 'Five bodies, one star',
    starName: 'Helio',
    bodies: BODIES,
    background: '#070b1a',
    starColor: '#ffc857',
    inkColor: '#e6ecff',
    accent: '#ffc857',
    timeScale: 0.35,
    tilt: 0.52,
    focus: 'Azur',
    focusAt: 150,
    focusFrames: 46,
    unit: 'yr',
    labels: true,
    counter: true,
    stars: 90,
    seed: 5,
    elapsedLabel: 'ELAPSED',
    focusLabels: ['ORBIT', 'DISTANCE', 'ECCENTRICITY', 'ORBITS DONE'],
    distanceUnit: 'AU',
  },
  propDocs: {
    title: 'headline (top-left, hidden while zoomed)',
    subtitle: 'mono sub-line',
    starName: 'label under the star ("" for none)',
    bodies: 'bodies [{name,a (semi-major axis, AU-like),e (eccentricity),period (optional; defaults to a^1.5),r (px at 1080),color,ring?,moon?}]',
    background: 'space colour',
    starColor: 'star / sun colour',
    inkColor: 'labels, orbit lines and text',
    accent: 'spec-card rule colour',
    timeScale: 'simulated years per second of video',
    tilt: 'orbit-plane squash 0.25 (edge-on) .. 1 (top-down)',
    focus: 'body name to zoom into ("" = no zoom)',
    focusAt: 'frame the zoom starts (-1 = never)',
    focusFrames: 'zoom duration in frames',
    unit: 'period unit label',
    labels: 'show name + period + orbit counter next to each body',
    counter: 'show the elapsed-time readout',
    stars: 'background star count',
    seed: 'start angles / star field seed',
    elapsedLabel: 'label before the elapsed-time counter',
    focusLabels: 'row labels of the focus card [period, distance, eccentricity, orbits done]',
    distanceUnit: 'unit after the distance value in the focus card',
  },
  component: OrbitSystem,
  tags: ['orbit', 'planets', 'solar system', 'kepler', 'astronomy', 'space', 'ellipse', 'dashed', 'zoom', 'labels', 'counter', 'ecosystem', 'education', 'science', 'timeline', 'cycle', 'dark', 'hero background'],
});
