import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {n2, rng} from '../../core/random';
import {FilmGrain, Svg, useStage, Vignette} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mixHex5, rgba5} from '../../core/r2-pr5-kit';

/**
 * Rocket launch: countdown on a dusk launch pad, ignition with billowing ground smoke, a bright flickering plume,
 * an ease-in ascent and a camera that tilts up to track the rocket as the sky turns from dusk to space, leaving a
 * smoke trail behind. Layered 2D SVG; all smoke/clouds/stars are seeded.
 */

type Props = {
  countdown: number;
  label: string;
  sublabel: string;
  seed: number;
  skyTop: string;
  skyHorizon: string;
  space: string;
  rocketColor: string;
  accent: string;
  flameColor: string;
  ink: string;
  smoke: number;
  shake: number;
  countdownLabel?: string;
};

const RocketLaunch: React.FC<Props> = ({countdown, label, sublabel, countdownLabel = 'T MINUS', seed, skyTop, skyHorizon, space, rocketColor, accent, flameColor, ink, smoke, shake}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const cd = Math.max(0, Math.round(countdown)) * 30;
  const tIgn = cd + 6;
  const tLift = tIgn + 28;
  const Lr = (portrait ? 0.2 : 0.3) * h; // rocket length
  const groundY0 = h * 0.84;
  const cx = w * (portrait ? 0.5 : 0.5);

  // altitude of the rocket (px above the pad): ease-in, then constant speed
  const acc = h * 0.3;
  const vmax = h * 1.05;
  const tAcc = vmax / acc; // seconds to reach vmax
  const alt = (f: number) => {
    const s = Math.max(0, (f - tLift) / 30);
    if (s <= tAcc) return 0.5 * acc * s * s;
    return 0.5 * acc * tAcc * tAcc + vmax * (s - tAcc);
  };
  const R = alt(frame);
  const camLag = Math.max(0, alt(frame - 8) - h * 0.3);
  const camY = Math.max(camLag, R - h * 0.46);
  const toY = (worldY: number, par = 1) => groundY0 - worldY + camY * par; // world y up -> screen y
  const rocketScreenY = toY(R);

  const thrust = prog(frame, tIgn, tIgn + 20, ease.out) * (1 - prog(frame, 9999, 9999));
  const vib = frame >= tIgn ? (n2(`${seed}:vib`, frame * 1.3, 0) * 3 * u * shake * Math.min(1, thrust) * (1 - clamp(R / (h * 0.25)))) : 0;

  const altNorm = clamp(camY / (h * 6));
  const top = mixHex5(skyTop, space, Math.pow(altNorm, 0.7));
  const hor = mixHex5(skyHorizon, mixHex5(skyTop, space, 0.35), Math.pow(altNorm, 0.6));
  const dayGlow = 1 - altNorm;

  // seeded scenery -------------------------------------------------------------------------------------------
  const stars = React.useMemo(() => {
    const r = rng(`${seed}:stars`);
    return Array.from({length: 110}, () => ({x: r(), y: r(), s: 0.6 + r() * 1.6, t: r() * 6}));
  }, [seed]);
  const clouds = React.useMemo(() => {
    const r = rng(`${seed}:clouds`);
    return Array.from({length: 14}, (_, i) => ({x: r(), alt: h * (0.5 + i * 0.32 + r() * 0.25), s: 0.7 + r() * 1.1, p: 0.8 + r() * 0.2}));
  }, [seed, h]);
  const pad = React.useMemo(() => {
    const r = rng(`${seed}:pad`);
    const n = Math.round(70 * smoke);
    return Array.from({length: n}, (_, i) => ({
      born: tIgn + Math.floor((i / n) * 78) + Math.floor(r() * 3),
      dir: i % 2 ? 1 : -1,
      vx: (0.7 + r() * 1.5) * (Math.round(smoke * 10) / 10 || 1),
      r0: 26 + r() * 26,
      grow: 1.6 + r() * 1.6,
      lift: 6 + r() * 20,
      warm: r(),
      ph: r() * 6,
      row: r(),
    }));
  }, [seed, tIgn, smoke]);

  const trail = React.useMemo(() => {
    const r = rng(`${seed}:trail`);
    return Array.from({length: 300}, (_, i) => ({born: tLift + 4 + i, dx: (r() - 0.5) * 30, vx: (r() - 0.5) * 16, r0: 30 + r() * 22, grow: 1 + r() * 0.8, ph: r() * 6}));
  }, [seed, tLift]);

  const flame = (len: number, wid: number, id: string) => {
    const fl = n2(`${seed}:fl`, frame * 0.9, 0);
    const fl2 = n2(`${seed}:fl2`, frame * 1.7, 3);
    const L = len * (1 + 0.1 * fl + 0.05 * fl2);
    return (
      <g>
        <ellipse cx={0} cy={L * 0.35} rx={wid * 1.9} ry={L * 0.7} fill={`url(#${id}-glow)`} opacity={0.9} />
        <path d={`M ${-wid} 0 C ${-wid * 1.15} ${L * 0.4}, ${-wid * 0.5} ${L * 0.85}, ${fl * wid * 0.3} ${L} C ${wid * 0.5} ${L * 0.85}, ${wid * 1.15} ${L * 0.4}, ${wid} 0 Z`} fill={`url(#${id}-plume)`} />
        <path d={`M ${-wid * 0.5} 0 C ${-wid * 0.55} ${L * 0.3}, ${-wid * 0.2} ${L * 0.55}, ${fl2 * wid * 0.15} ${L * 0.62} C ${wid * 0.2} ${L * 0.55}, ${wid * 0.55} ${L * 0.3}, ${wid * 0.5} 0 Z`} fill="#FFFBEA" opacity={0.95} />
      </g>
    );
  };

  // countdown number
  const cdNum = cd > 0 && frame < cd ? Math.ceil((cd - frame) / 30) : 0;
  const cdLocal = cd > 0 ? (frame % 30) / 30 : 0;
  const labelT = prog(frame, tLift + 40, tLift + 62, ease.out);

  const rw = Lr * 0.17; // rocket half... full width
  const rocketTop = -Lr;
  const showFlame = frame >= tIgn;
  const flameLen = Lr * (0.35 + 0.95 * clamp((frame - tIgn) / 40) + 0.5 * clamp(R / (h * 0.8))) * thrust;

  return (
    <AbsoluteFill style={{background: hor}}>
      <Svg>
        <defs>
          <linearGradient id="rkt-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} />
            <stop offset="1" stopColor={hor} />
          </linearGradient>
          <linearGradient id="rkt-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={mixHex5(rocketColor, '#8892B0', 0.4)} />
            <stop offset="0.4" stopColor={rocketColor} />
            <stop offset="1" stopColor={mixHex5(rocketColor, '#5A6384', 0.55)} />
          </linearGradient>
          <radialGradient id="rkt-fl-glow">
            <stop offset="0" stopColor={flameColor} stopOpacity="0.85" />
            <stop offset="1" stopColor={flameColor} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rkt-fl-plume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF3B8" />
            <stop offset="0.35" stopColor={flameColor} />
            <stop offset="1" stopColor={flameColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rkt-dusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFB36B" stopOpacity="0" />
            <stop offset="1" stopColor="#FFB36B" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="rkt-puff">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id="rkt-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={8 * u} />
          </filter>
        </defs>
        <rect width={w} height={h} fill="url(#rkt-sky)" />
        {/* sun glow at the horizon while it is still dusk */}
        <rect x={0} y={toY(0, 1) - h * 0.45} width={w} height={h * 0.45} fill="url(#rkt-dusk)" opacity={0.55 * dayGlow} />

        {/* stars fade in with altitude */}
        {stars.map((s, i) => {
          const a = clamp((altNorm - 0.12) * 2.2) * (0.5 + 0.5 * Math.sin(frame / 18 + s.t));
          return a > 0.02 ? <circle key={i} cx={s.x * w} cy={((s.y * (groundY0 + 40)) % h)} r={s.s * u} fill="#fff" opacity={a * 0.9} /> : null;
        })}

        {/* distant hills (slow parallax) */}
        <path d={`M 0 ${toY(0, 0.25)} L 0 ${toY(90 * u, 0.25)} C ${w * 0.18} ${toY(150 * u, 0.25)}, ${w * 0.32} ${toY(60 * u, 0.25)}, ${w * 0.5} ${toY(110 * u, 0.25)} S ${w * 0.82} ${toY(160 * u, 0.25)}, ${w} ${toY(80 * u, 0.25)} L ${w} ${toY(-2000, 0.25)} L 0 ${toY(-2000, 0.25)} Z`} fill={mixHex5(skyHorizon, '#1B1E3C', 0.72)} />

        {/* clouds */}
        {clouds.map((c, i) => {
          const y = toY(c.alt, c.p);
          if (y < -200 * u || y > h + 200 * u) return null;
          const x = c.x * w + Math.sin(frame / 120 + i) * 30 * u;
          const col = mixHex5('#ffffff', skyHorizon, 0.25);
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${c.s * u})`} opacity={0.55 * (1 - altNorm * 0.4)}>
              <ellipse cx={0} cy={0} rx={150} ry={34} fill={col} filter="url(#rkt-blur)" />
              <ellipse cx={-70} cy={-14} rx={80} ry={30} fill={col} filter="url(#rkt-blur)" />
              <ellipse cx={60} cy={-18} rx={90} ry={34} fill={col} filter="url(#rkt-blur)" />
            </g>
          );
        })}

        {/* ground + tower + pad */}
        {toY(0) < h + 40 ? (
          <g>
            <rect x={0} y={toY(0)} width={w} height={h * 2} fill={mixHex5('#1B1E3C', skyHorizon, 0.12)} />
            <rect x={0} y={toY(0)} width={w} height={6 * u} fill={rgba5('#fff', 0.1)} />
            {/* launch tower */}
            <g transform={`translate(${cx - Lr * 0.55} ${toY(0)})`} opacity={0.95}>
              {[...Array(9)].map((_, k) => (
                <g key={k}>
                  <rect x={-14 * u} y={-(k + 1) * Lr * 0.12} width={28 * u} height={5 * u} fill="#2B3158" />
                  <line x1={-14 * u} y1={-k * Lr * 0.12} x2={14 * u} y2={-(k + 1) * Lr * 0.12} stroke="#2B3158" strokeWidth={3 * u} />
                </g>
              ))}
              <rect x={-14 * u} y={-Lr * 1.1} width={4 * u} height={Lr * 1.1} fill="#2B3158" />
              <rect x={10 * u} y={-Lr * 1.1} width={4 * u} height={Lr * 1.1} fill="#2B3158" />
              <rect x={-14 * u} y={-Lr * 1.1} width={Lr * 0.45} height={5 * u} fill="#2B3158" />
              <circle cx={0} cy={-Lr * 1.13} r={5 * u} fill="#FF5A4E" opacity={0.6 + 0.4 * Math.sin(frame / 6)} />
            </g>
            <rect x={cx - Lr * 0.34} y={toY(0)} width={Lr * 0.68} height={14 * u} rx={3 * u} fill="#2E3560" />
            <rect x={cx - Lr * 0.22} y={toY(0) - 10 * u} width={Lr * 0.44} height={12 * u} fill="#232949" />
            {/* floodlight pool */}
            <ellipse cx={cx} cy={toY(0) + 4 * u} rx={Lr * 0.8} ry={14 * u} fill={rgba5(flameColor, 0.28 * thrust)} filter="url(#rkt-blur)" />
          </g>
        ) : null}

        {/* ground smoke (behind the rocket) */}
        {pad.map((p, i) => {
          const age = (frame - p.born) / 30;
          if (age < 0 || age > 4.2) return null;
          const sp = ease.out(clamp(age / 2.4));
          const rad = (p.r0 + age * 34 * p.grow) * u * (portrait ? 0.85 : 1);
          const x = cx + p.dir * (p.vx * 125 * sp + 18) * u * (portrait ? 0.7 : 1) + n2(`${seed}:px${i}`, age, 0) * 12 * u;
          const y = toY(0) - (rad * 0.35 + p.lift * age * u * 4 * (0.4 + p.row)) * 0.9 + 6 * u;
          const warm = clamp(1 - age / 1.3) * (0.4 + 0.5 * p.warm);
          const fade = (1 - clamp((age - 1.4) / 2.8)) * clamp(age / 0.2);
          const base = mixHex5('#E9EAF4', '#8E93AF', 0.2 + p.row * 0.4);
          return (
            <g key={i} opacity={0.82 * fade}>
              <circle cx={x} cy={y} r={rad} fill={mixHex5(base, flameColor, warm)} filter="url(#rkt-blur)" />
              <circle cx={x - rad * 0.2} cy={y - rad * 0.25} r={rad * 0.62} fill="#fff" opacity={0.3} filter="url(#rkt-blur)" />
            </g>
          );
        })}

        {/* trail smoke (world-anchored) */}
        {trail.map((t, i) => {
          const age = (frame - t.born) / 30;
          if (age < 0 || age > 3.6) return null;
          const wy = alt(t.born) ;
          const rad = (t.r0 + age * 42 * t.grow) * u;
          const x = cx + t.dx * u + t.vx * age * 14 * u;
          const y = toY(wy) + Lr * 0.04;
          const fade = (1 - clamp(age / 3.6)) * clamp(age / 0.15);
          return (
            <g key={i} opacity={0.5 * fade * (1 - altNorm * 0.5)}>
              <circle cx={x} cy={y} r={rad} fill={mixHex5('#E7E9F5', skyHorizon, 0.18)} filter="url(#rkt-blur)" />
            </g>
          );
        })}

        {/* rocket + flame */}
        <g transform={`translate(${cx + vib} ${rocketScreenY})`}>
          {showFlame ? <g transform={`translate(0 ${6 * u})`}>{flame(flameLen, rw * 0.46, 'rkt-fl')}</g> : null}
          {/* fins */}
          <path d={`M ${-rw / 2} ${-Lr * 0.22} L ${-rw * 1.15} ${Lr * 0.03} L ${-rw / 2} ${-Lr * 0.02} Z`} fill={accent} />
          <path d={`M ${rw / 2} ${-Lr * 0.22} L ${rw * 1.15} ${Lr * 0.03} L ${rw / 2} ${-Lr * 0.02} Z`} fill={mixHex5(accent, '#000', 0.25)} />
          {/* body */}
          <path d={`M ${-rw / 2} 0 L ${-rw / 2} ${rocketTop * 0.7} C ${-rw / 2} ${rocketTop * 0.9}, ${-rw * 0.2} ${rocketTop * 0.98}, 0 ${rocketTop} C ${rw * 0.2} ${rocketTop * 0.98}, ${rw / 2} ${rocketTop * 0.9}, ${rw / 2} ${rocketTop * 0.7} L ${rw / 2} 0 Z`} fill="url(#rkt-body)" />
          <path d={`M ${-rw / 2} ${rocketTop * 0.7} C ${-rw / 2} ${rocketTop * 0.9}, ${-rw * 0.2} ${rocketTop * 0.98}, 0 ${rocketTop} C ${rw * 0.2} ${rocketTop * 0.98}, ${rw / 2} ${rocketTop * 0.9}, ${rw / 2} ${rocketTop * 0.7} Z`} fill={accent} />
          <rect x={-rw / 2} y={-Lr * 0.34} width={rw} height={Lr * 0.025} fill={accent} opacity={0.9} />
          <rect x={-rw / 2} y={-Lr * 0.06} width={rw} height={Lr * 0.06} fill="#3A4168" />
          <circle cx={0} cy={-Lr * 0.58} r={rw * 0.2} fill="#18213F" stroke="#B9C2E0" strokeWidth={3 * u} />
          <circle cx={-rw * 0.06} cy={-Lr * 0.6} r={rw * 0.06} fill="#fff" opacity={0.55} />
          <rect x={-rw / 2} y={-Lr * 0.97} width={rw * 0.16} height={Lr * 0.9} fill="#fff" opacity={0.2} />
        </g>
        {/* heat glare */}
        {showFlame ? <ellipse cx={cx} cy={rocketScreenY + Lr * 0.1} rx={Lr * 1.1} ry={Lr * 0.8} fill="url(#rkt-fl-glow)" opacity={0.22 * thrust} /> : null}
      </Svg>

      {/* countdown */}
      {cdNum > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.07, textAlign: 'center', color: ink, transform: `scale(${1 + 0.28 * (1 - ease.out(cdLocal * 3 > 1 ? 1 : cdLocal * 3))})`, opacity: clamp(1 - Math.max(0, cdLocal - 0.8) * 5)}}>
          <div style={{fontFamily: fonts.display, fontSize: (portrait ? 420 : 340) * u, lineHeight: 1, letterSpacing: -6 * u, textShadow: `0 ${10 * u}px ${60 * u}px rgba(0,0,0,0.45)`}}>{cdNum}</div>
          <div style={{fontFamily: fonts.mono, fontSize: 20 * u, letterSpacing: 8 * u, opacity: 0.6}}>{countdownLabel}</div>
        </div>
      ) : null}

      {/* label */}
      <div style={{position: 'absolute', left: portrait ? 0 : w * 0.06, right: portrait ? 0 : undefined, top: h * (portrait ? 0.8 : 0.42), textAlign: portrait ? 'center' : 'left', color: ink, opacity: labelT, transform: `translateY(${(1 - labelT) * 30 * u}px)`}}>
        <div style={{fontFamily: fonts.display, fontSize: (portrait ? 128 : 112) * u, letterSpacing: 4 * u, textShadow: `0 ${6 * u}px ${40 * u}px rgba(0,0,0,0.4)`}}>{label}</div>
        <div style={{fontFamily: fonts.mono, fontSize: 24 * u, letterSpacing: 6 * u, opacity: 0.75, marginTop: 6 * u}}>{sublabel}</div>
      </div>
      <Vignette strength={0.4} />
      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};

export const rocketLaunch = defineMotion<Props>({
  id: 'rocket-launch',
  title: 'Rocket launch',
  category: 'environment',
  description:
    'Countdown on a dusk launch pad, ignition with billowing ground smoke and a flickering plume, an ease-in lift-off and a camera that tilts up to follow the rocket as the sky turns to space, leaving a smoke trail.',
  source: ['prompt-corpus: awesome-opus5-5-videos (MIT) — rocket launch metaphor cases (8), original implementation'],
  useFor: 'Launch metaphors for product releases, "we shipped" reveals, space / science education; pair with number-counter or a title for the label.',
  durationInFrames: 300,
  defaultProps: {
    countdown: 3,
    label: 'LIFTOFF',
    sublabel: 'all systems go',
    seed: 5,
    skyTop: '#2E3470',
    skyHorizon: '#F2A06B',
    space: '#04061A',
    rocketColor: '#F2F4FA',
    accent: '#E8503F',
    flameColor: '#FFA23A',
    ink: '#FFFFFF',
    smoke: 1,
    shake: 1,
    countdownLabel: 'T MINUS',
  },
  propDocs: {
    countdown: 'seconds counted down before ignition (0 = no countdown)',
    label: 'big word shown once airborne',
    sublabel: 'small mono line under the label',
    seed: 'seed for smoke, clouds and stars',
    skyTop: 'sky colour at the zenith while still on the ground',
    skyHorizon: 'sky colour at the horizon (dusk glow)',
    space: 'colour the sky fades to at altitude',
    rocketColor: 'rocket body colour',
    accent: 'nose cone / fins colour',
    flameColor: 'plume and smoke-glow colour',
    ink: 'text colour',
    smoke: 'ground smoke amount (0.3-1.5)',
    shake: 'pre-lift vibration strength (0 = steady)',
    countdownLabel: 'small mono label under the big countdown number',
  },
  component: RocketLaunch,
  tags: ['rocket', 'launch', 'liftoff', 'space', 'countdown', 'smoke', 'plume', 'product launch', 'release', 'shipped', 'sky', 'stars', 'camera tilt', 'science', 'education', 'startup'],
});
