import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurFilter, TAU, areaK, hash01, isTransparent, mixHex, wrap} from '../../core/environment-kit';
import {n2} from '../../core/random';
import {Sparkle} from '../../core/shapes';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Embers (video3 ember-spark-particles, video14 ember-motes + gold-fleck-float).
 * sparks: tiny additive golden sparks (#ffd79a) with short motion trails, rising with sideways
 *   wobble, twinkling (sin(pi·age/life)·(0.6+0.4·noise)), short lifetimes, cooling to orange.
 * motes:  20-30 soft orange glowing dots (r 3-6 px, blur) rising 10-25 px/s, 8 px / 3 s sway, twinkle 0.4-1.
 * gold:   Klimt gold flecks (#e2b84a squares, circles, slivers) drifting up and spinning, with sparkle pulses.
 */
type Props = {
  mode: 'sparks' | 'motes' | 'gold';
  background: string;
  backdrop: boolean;
  color: string;
  count: number;
  speed: number;
  life: number;
  size: number;
  wind: number;
  glow: boolean;
  seed: number;
};

const DEFAULT_COLOR = {sparks: '#FFD79A', motes: '#FF9A4A', gold: '#E2B84A'};
const DEFAULT_COUNT = {sparks: 190, motes: 34, gold: 90};

const Backdrop: React.FC<{mode: Props['mode']; t: number; glow: boolean}> = ({mode, t, glow}) => {
  const {w, h, u, cx} = useStage();
  const flick = 1 + 0.06 * Math.sin(t * TAU * 7) + 0.04 * Math.sin(t * TAU * 11) + 0.05 * n2('fireflick', t * 3, 0);
  if (mode === 'gold') {
    // deep Klimt ground with faint gold spiral ornaments
    const spirals: React.ReactNode[] = [];
    const gc = Math.max(2, Math.round(w / (420 * u)));
    const gr = Math.max(2, Math.round(h / (420 * u)));
    for (let i = 0; i < gc * gr; i++) {
      const sx = ((i % gc) + 0.5 + (hash01(5, i, 1) - 0.5) * 0.5) * (w / gc);
      const sy = (Math.floor(i / gc) + 0.5 + (hash01(5, i, 2) - 0.5) * 0.5) * (h / gr);
      const R = (70 + 60 * hash01(5, i, 3)) * u;
      let d = '';
      for (let k = 0; k <= 90; k++) {
        const a = (k / 90) * TAU * 3 + hash01(5, i, 4) * TAU;
        const r = R * (1 - k / 95);
        d += `${k ? 'L' : 'M'}${(sx + Math.cos(a) * r).toFixed(1)} ${(sy + Math.sin(a) * r).toFixed(1)}`;
      }
      spirals.push(<path key={i} d={d} stroke="#C9A040" strokeWidth={5 * u} fill="none" opacity={0.09} strokeLinecap="round" />);
    }
    return (
      <g>
        <defs>
          <radialGradient id="emb-gold-bg" cx="0.5" cy="0.55" r="0.8">
            <stop offset="0" stopColor="#3A2A12" />
            <stop offset="0.6" stopColor="#1E150A" />
            <stop offset="1" stopColor="#0E0905" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#emb-gold-bg)" />
        {spirals}
      </g>
    );
  }
  const motes = mode === 'motes';
  return (
    <g>
      <defs>
        <linearGradient id="emb-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={motes ? '#0C0807' : '#070405'} />
          <stop offset="0.6" stopColor={motes ? '#1A0F0A' : '#160A06'} />
          <stop offset="1" stopColor={motes ? '#2C170C' : '#3A1606'} />
        </linearGradient>
        <radialGradient id="emb-fire" cx="0.5" cy="1" r="0.75">
          <stop offset="0" stopColor="#FFC070" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#E8641E" stopOpacity={0.5} />
          <stop offset="1" stopColor="#E0581C" stopOpacity={0} />
        </radialGradient>
              </defs>
      <rect width={w} height={h} fill="url(#emb-bg)" />
      {glow && <ellipse cx={cx} cy={h * 1.05} rx={w * 0.75 * flick} ry={h * (motes ? 0.5 : 0.62) * flick} fill="url(#emb-fire)" />}
    </g>
  );
};

const Embers: React.FC<Props> = ({mode, background, backdrop, color, count, speed, life, size, wind, glow, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const t = frame / fps;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const col = color || DEFAULT_COLOR[mode];
  const n = Math.round((count > 0 ? count : DEFAULT_COUNT[mode]) * areaK(w, h));
  const els: React.ReactNode[] = [];
  const glows: React.ReactNode[] = [];

  if (mode === 'sparks') {
    for (let i = 0; i < n; i++) {
      const L = (0.6 + 0.9 * hash01(seed, i, 1)) * life * 1.4;
      const off = hash01(seed, i, 2) * L;
      const tt = t + off;
      const c = Math.floor(tt / L);
      const age = tt - c * L;
      // emitter: wide band across the lower frame, denser toward the centre-bottom
      const ex = 0.5 + (hash01(seed, i, c, 3) + hash01(seed, i, c, 4) - 1) * 0.62;
      const ey = 1.04 - 0.85 * Math.pow(hash01(seed, i, c, 5), 1.5);
      const rise = (60 + 110 * hash01(seed, i, c, 6)) * u * speed;
      const vx = (hash01(seed, i, c, 7) - 0.5) * 40 * u + wind * 30 * u;
      const ph = hash01(seed, i, c, 8) * TAU;
      const pos = (a: number) => [ex * w + vx * a + 14 * u * Math.sin(a * 3.1 + ph) * a, ey * h - rise * a - 0.5 * 30 * u * a * a] as const;
      const [x, y] = pos(age);
      const [px, py] = pos(Math.max(0, age - 3.5 / fps));
      const env = Math.sin((Math.PI * age) / L);
      const tw = 0.6 + 0.4 * n2('spk' + seed, i * 0.37, t * 9);
      const o = env * tw;
      if (o < 0.03) continue;
      const r = (1.1 + 1.9 * Math.pow(hash01(seed, i, 9), 1.5)) * u * size;
      const heat = age / L;
      const sc = mixHex('#FFF4D8', col, Math.min(1, heat * 1.6));
      const fc = heat > 0.65 ? mixHex(sc, '#FF7A2E', (heat - 0.65) / 0.35) : sc;
      els.push(<line key={i} x1={px} y1={py} x2={x} y2={y} stroke={fc} strokeWidth={r * 1.1} strokeLinecap="round" opacity={o * 0.55} />);
      if (glow) els.push(<circle key={`h${i}`} cx={x} cy={y} r={r * 4.5} fill="url(#emb-halo)" opacity={o * 0.85} />);
      els.push(<circle key={`c${i}`} cx={x} cy={y} r={r * 1.05} fill={sc} opacity={o} />);
    }
  } else if (mode === 'motes') {
    for (let i = 0; i < n; i++) {
      const rise = (10 + 15 * hash01(seed, i, 1)) * u * speed * 1.6;
      const span = h + 60 * u;
      const y = wrap(hash01(seed, i, 2) * span - rise * t, span) - 30 * u;
      const x = hash01(seed, i, 3) * w + 8 * u * 1.5 * Math.sin((TAU * t) / 3 + hash01(seed, i, 4) * TAU) + wind * 20 * u * t;
      const r = (3 + 3 * hash01(seed, i, 5)) * u * size * 2.2;
      const o = 0.7 + 0.3 * Math.sin(t * (1.5 + 2 * hash01(seed, i, 6)) + i);
      const xx = wrap(x, w + 40 * u) - 20 * u;
      els.push(<circle key={i} cx={xx} cy={y} r={r} fill="url(#emb-mote)" opacity={Math.max(0.4, o)} />);
      if (glow) glows.push(<circle key={i} cx={xx} cy={y} r={r * 4.5} fill="url(#emb-halo)" opacity={0.55 * o} />);
    }
  } else {
    for (let i = 0; i < n; i++) {
      const rise = (14 + 30 * hash01(seed, i, 1)) * u * speed * 1.4;
      const span = h + 80 * u;
      const y = wrap(hash01(seed, i, 2) * span - rise * t, span) - 40 * u;
      const x = wrap(hash01(seed, i, 3) * w + 10 * u * Math.sin(t * 0.8 + i) + wind * 20 * u * t, w + 40 * u) - 20 * u;
      const kind = hash01(seed, i, 4);
      const s = (8 + 16 * Math.pow(hash01(seed, i, 5), 1.4)) * u * size;
      const rot = (hash01(seed, i, 6) - 0.5) * 240 * t + hash01(seed, i, 7) * 360;
      const flip = Math.cos(t * (1 + 2 * hash01(seed, i, 8)) + i);
      const shade = mixHex(col, flip > 0 ? '#FFF0B8' : '#8A6420', Math.abs(flip) * 0.45);
      const shape =
        kind < 0.45 ? (
          <rect x={-s / 2} y={-s / 2} width={s} height={s} fill={shade} />
        ) : kind < 0.75 ? (
          <circle r={s * 0.45} fill={shade} />
        ) : (
          <rect x={-s} y={-s * 0.18} width={s * 2} height={s * 0.36} fill={shade} />
        );
      els.push(
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(0.25 + 0.75 * Math.abs(flip)).toFixed(3)} 1)`} opacity={0.9}>
          {shape}
        </g>,
      );
      // sparkle pulse on a few flecks
      const sp = (t * 0.8 + hash01(seed, i, 9)) % 1;
      if (hash01(seed, i, 10) < 0.25 && sp < 0.18) {
        const k = Math.sin((sp / 0.18) * Math.PI);
        glows.push(<Sparkle key={`s${i}`} x={x} y={y} size={s * 2.4 * k} color="#FFF3C4" opacity={k} rotate={rot * 0.2} />);
      }
    }
  }

  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      {scene && (
        <Svg>
          <Backdrop mode={mode} t={t} glow={glow} />
        </Svg>
      )}
      <Svg style={{mixBlendMode: mode === 'gold' ? 'normal' : 'screen'}}>
        <defs>
          <radialGradient id="emb-mote">
            <stop offset="0" stopColor="#FFF2D0" />
            <stop offset="0.35" stopColor={col} />
            <stop offset="1" stopColor={col} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="emb-halo">
            <stop offset="0" stopColor={col} stopOpacity={0.9} />
            <stop offset="0.3" stopColor={col} stopOpacity={0.35} />
            <stop offset="1" stopColor={col} stopOpacity={0} />
          </radialGradient>
          <BlurFilter id="emb-glow" std={6 * u} />
        </defs>
        <g filter="url(#emb-glow)">{glows}</g>
        <g>{els}</g>
      </Svg>
    </AbsoluteFill>
  );
};

export const embers = defineMotion<Props>({
  id: 'embers',
  title: 'Embers & gold flecks',
  category: 'environment',
  description: 'Golden additive sparks rising and twinkling over a fire glow; "motes" = slow soft glowing ember dots, "gold" = spinning Klimt gold flecks with sparkle pulses. Overlay-capable.',
  source: ['video3 2.40-4.40', 'video14 era ambience (ember-motes, gold-fleck-float)'],
  useFor: 'Warmth, fire, magic, craft/forge or luxury beats; drop over any dark scene as an additive ambience layer.',
  durationInFrames: 180,
  defaultProps: {
    mode: 'sparks',
    background: '#070405',
    backdrop: true,
    color: '',
    count: 0,
    speed: 1,
    life: 1,
    size: 1,
    wind: 0.3,
    glow: true,
    seed: 1,
  },
  propDocs: {
    mode: '"sparks" (fast golden sparks), "motes" (slow glowing dots), "gold" (spinning gold flecks)',
    background: 'CSS background; "transparent" = overlay (particles use screen blend)',
    backdrop: 'paint the procedural dark fire-glow (or Klimt) backdrop',
    color: 'particle colour; empty = mode default (#FFD79A / #FF9A4A / #E2B84A)',
    count: 'particles per 1080p frame; 0 = mode default (140 / 34 / 70)',
    speed: 'rise speed multiplier',
    life: 'spark lifetime multiplier (sparks mode)',
    size: 'particle size multiplier',
    wind: 'sideways drift (positive = right)',
    glow: 'soft glow halos and fire glow',
    seed: 'random seed',
  },
  component: Embers,
  tags: ['particles', 'fire', 'sparks', 'gold', 'magic', 'overlay', 'ambience'],
});
