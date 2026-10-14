import React from 'react';
import {clamp, ease, prog} from '../../core/ease';
import {BoxBot, FxRoot, boil, boltPoints, doodleBlob, doodleLoop, isClear, polyline, sparkle4Path, star5Path, useFx, portraitFit} from '../../core/fx-kit';
import {n2, rng, range} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video20 tool-tap-repair + sparkle-burst: 5-9 four-point stars (longer vertical arm) in green/blue/
 * gold/red scatter within ~1.2 body widths, scale 0->1 in 3 f, twinkle x0.7-1 at 8 Hz, fade over
 * 0.4-0.7 s, stagger 0-0.2 s; 4-6 ink impact ticks flash for 3 f at the contact point.
 * video22 capture-scuffle-sparkles: a jittering doodle dust cloud (+-6 px, +-10 deg at ~12 Hz) while
 * 4-6 gold 5-point stars (#E0B84A) burst outward at 200-350 px/s, scale 0->1->0 with spin.
 * video22 cheer-bounce-emotes: gold stars twinkle around a bouncing character (0.8<->1.1 at 2 Hz).
 */
type Variant = 'repair' | 'scuffle' | 'cheer';
type Props = {
  background: string;
  x: number;
  y: number;
  delay: number;
  variant: Variant;
  count: number;
  radius: number;
  colors: string[];
  starColor: string;
  size: number;
  life: number;
  ticks: boolean;
  taps: number;
  tapEvery: number;
  scuffleFrames: number;
  ink: string;
  showSubject: boolean;
  seed: number;
};

const INKW = 2.4;

/** filled 4-point sparkle with a thin ink outline */
const Spark4: React.FC<{x: number; y: number; r: number; color: string; ink: string; u: number; rot?: number; scale: number; opacity: number}> = ({x, y, r, color, ink, u, rot = 0, scale, opacity}) =>
  scale <= 0.001 || opacity <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      <path d={sparkle4Path(r, 1.45, 0.13)} fill={color} stroke={ink} strokeWidth={1.4 * u} strokeLinejoin="round" />
    </g>
  );

const Star5: React.FC<{x: number; y: number; r: number; color: string; ink: string; u: number; rot: number; scale: number; opacity: number}> = ({x, y, r, color, ink, u, rot, scale, opacity}) =>
  scale <= 0.001 || opacity <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      <path d={star5Path(r, 0.48)} fill={color} stroke={ink} strokeWidth={2 * u} strokeLinejoin="round" />
      <path d={star5Path(r * 0.42, 0.48)} fill="#fff6c8" opacity={0.55} transform={`translate(${-r * 0.12} ${-r * 0.12})`} />
    </g>
  );

/** v20 doodle hammer, pivoting about the grip end. Angle 0 = head face resting on (0,0). */
const Hammer: React.FC<{px: number; py: number; u: number; s: number; angle: number; ink: string; frame: number}> = ({px, py, u, s, angle, ink, frame}) => {
  const L = 400 * u * s;
  const hw = 78 * u * s;
  const hh = 150 * u * s;
  const sw = INKW * u;
  const j = (k: number) => n2('ham', k, boil(frame, 3)) * 1.2 * u;
  return (
    <g transform={`translate(${px + L} ${py - hh / 2}) rotate(${angle})`}>
      {/* handle */}
      <rect x={-L + hw * 0.4} y={-15 * u * s} width={L - hw * 0.4} height={30 * u * s} rx={15 * u * s} fill="#b9bcc0" stroke={ink} strokeWidth={sw} />
      <rect x={-L * 0.42} y={-21 * u * s} width={L * 0.48} height={42 * u * s} rx={21 * u * s} fill="#c9545a" stroke={ink} strokeWidth={sw} />
      {Array.from({length: 7}, (_, i) => (
        <line key={i} x1={-L * 0.4 + i * L * 0.065} y1={-19 * u * s} x2={-L * 0.4 + i * L * 0.065 + 14 * u} y2={19 * u * s} stroke="#8f2f36" strokeWidth={1.2 * u} opacity={0.6} />
      ))}
      {/* head */}
      <g transform={`translate(${-L} 0)`}>
        <rect x={-hw / 2 + j(1)} y={-hh / 2 + j(2)} width={hw} height={hh} rx={8 * u * s} fill="#5f6368" stroke={ink} strokeWidth={sw} />
        {Array.from({length: 7}, (_, i) => (
          <line key={i} x1={-hw / 2 + 6 * u} y1={-hh / 2 + 16 * u + i * 18 * u * s} x2={hw / 2 - 6 * u} y2={-hh / 2 + 4 * u + i * 18 * u * s} stroke="#2e3134" strokeWidth={1.3 * u} opacity={0.55} />
        ))}
        <rect x={-hw / 2 - 4 * u * s} y={hh / 2 - 24 * u * s} width={hw + 8 * u * s} height={24 * u * s} rx={4 * u * s} fill="#73777c" stroke={ink} strokeWidth={sw} />
      </g>
    </g>
  );
};

const SparkleBurst: React.FC<Props> = (p) => {
  const {background, x, y, delay, variant, count, radius, colors, starColor, size: size0, life, ticks, taps, tapEvery, scuffleFrames, ink, showSubject, seed} = p;
  const {f, frame, u, px, py: py0, w, h, durationInFrames} = useFx(x, y, delay);
  const clear = isClear(background);
  const {portrait: fitPortrait, h: fitH} = useStage();
  const fit = portraitFit(fitPortrait, showSubject && !clear, fitH);
  const size = size0 * fit.k;
  const py = py0 + fit.dy;
  const scene = showSubject && !clear;
  const R = radius * u * size;

  const stars = React.useMemo(() => {
    const r = rng(seed * 101 + 7);
    return Array.from({length: Math.max(1, count)}, (_, i) => {
      const a = -Math.PI / 2 + ((i + 0.5) / count - 0.5) * Math.PI * 1.5 + (r() - 0.5) * 0.5;
      return {
        a,
        d: 0.35 + 0.65 * Math.sqrt(r()),
        sz: range(r, 22, 62),
        col: colors[i % colors.length],
        dl: Math.floor(r() * 6),
        lf: range(r, 0.55, 1) * life,
        ph: r() * 6.28,
        rot: (r() - 0.5) * 20,
        sp: range(r, 200, 350),
        spin: (r() - 0.5) * 540,
      };
    });
  }, [seed, count, colors, life]);

  const out: React.ReactNode[] = [];

  // ---------- repair: tool taps + sparkle burst on the final tap ----------
  if (variant === 'repair') {
    const tapFrames = Array.from({length: Math.max(1, taps)}, (_, i) => delay - (taps - 1 - i) * tapEvery);
    // impact ticks on every tap
    const lastTap = tapFrames.filter((t) => frame >= t).pop();
    if (scene) {
      // the object being fixed: a doodle pipe whose crack closes one tap at a time
      const pw = Math.min(560 * u, w * 0.44);
      const ph = 170 * u * size;
      const done = tapFrames.filter((t) => frame >= t).length;
      const crackK = 1 - done / tapFrames.length;
      const cr = rng(seed + 55);
      const crack = boltPoints(px - 6 * u, py + 4 * u, px + 24 * u, py + ph * 0.82, cr, 3, 0.35);
      out.push(
        <g key="pipe">
          <ellipse cx={px} cy={py + ph + 34 * u} rx={pw * 1.05} ry={16 * u} fill={ink} opacity={0.1} />
          <rect x={px - pw} y={py} width={pw * 2} height={ph} fill="#a9bccb" stroke={ink} strokeWidth={INKW * u} />
          {Array.from({length: 26}, (_, i) => (
            <line key={i} x1={px - pw + (i + 0.5) * ((pw * 2) / 26)} y1={py + ph * 0.55} x2={px - pw + (i + 0.5) * ((pw * 2) / 26) - 16 * u} y2={py + ph - 3 * u} stroke="#5f7486" strokeWidth={1.3 * u} opacity={0.55} />
          ))}
          <line x1={px - pw + 8 * u} x2={px + pw - 8 * u} y1={py + ph * 0.22} y2={py + ph * 0.22} stroke="#fff" strokeWidth={5 * u} opacity={0.45} strokeLinecap="round" />
          {[-1, 1].map((sd) => (
            <rect key={sd} x={sd < 0 ? px - pw - 26 * u : px + pw - 30 * u} y={py - 16 * u} width={56 * u} height={ph + 32 * u} rx={6 * u} fill="#8ea3b4" stroke={ink} strokeWidth={INKW * u} />
          ))}
          <clipPath id={`sb-pipe-${seed}`}>
            <rect x={px - pw} y={py} width={pw * 2} height={ph} />
          </clipPath>
          {frame > delay && (
            <g clipPath={`url(#sb-pipe-${seed})`}>
              <rect x={px - pw - 200 * u + prog(frame, delay + 4, delay + 26, ease.inOut) * (pw * 2 + 400 * u)} y={py - 20 * u} width={90 * u} height={ph + 40 * u} fill="#fff" opacity={0.55} transform={`skewX(-25)`} style={{transformBox: 'fill-box', transformOrigin: 'center'}} />
            </g>
          )}
          {crackK > 0 && (
            <path d={polyline(crack)} fill="none" stroke={ink} strokeWidth={3 * u} strokeLinejoin="round" strokeDasharray={`${ph * 1.4 * crackK} ${ph * 4}`} />
          )}
          {crackK > 0 &&
            [0, 1, 2].map((k) => {
              const t = ((frame + k * 7) % 21) / 21;
              return <path key={k} d={`M${px + 10 * u} ${py - 4 * u - t * 70 * u} q ${5 * u} ${8 * u} 0 ${12 * u} q ${-5 * u} ${-4 * u} 0 ${-12 * u}`} fill="#6fa7d8" stroke={ink} strokeWidth={1.4 * u} opacity={(1 - t) * crackK} transform={`translate(${(k - 1) * 22 * u * t} 0)`} />;
            })}
        </g>,
      );
      // hammer: enters raised, taps, lifts away
      const enter = prog(frame, 0, 12, ease.out);
      const RAISE = 32;
      let ang = RAISE;
      for (const t of tapFrames) {
        if (frame >= t - 4 && frame <= t) ang = RAISE * (1 - prog(frame, t - 4, t, ease.in));
        else if (frame > t && frame < t + tapEvery - 4) ang = RAISE * prog(frame, t + 1, t + Math.max(4, tapEvery - 4), ease.out);
      }
      const leave = prog(frame, delay + 8, delay + 24, ease.inOut);
      ang = ang + 18 * leave;
      const slide = (1 - enter) * 700 * u + leave * 900 * u;
      out.push(
        <g key="ham" transform={`translate(${slide} ${-slide * 0.3})`}>
          <Hammer px={px} py={py} u={u} s={size} angle={ang} ink={ink} frame={frame} />
        </g>,
      );
    }
    if (ticks && lastTap !== undefined && frame - lastTap < 3) {
      const k = frame - lastTap;
      const r = rng(seed * 3 + lastTap);
      const n = 4 + Math.floor(r() * 3);
      out.push(
        <g key="ticks" opacity={1 - k / 3}>
          {Array.from({length: n}, (_, i) => {
            const a = Math.PI + (i / (n - 1)) * Math.PI + (r() - 0.5) * 0.3;
            const r0 = (40 + k * 12) * u * size;
            const len = range(r, 34, 64) * u * size;
            return <line key={i} x1={px + Math.cos(a) * r0} y1={py + Math.sin(a) * r0} x2={px + Math.cos(a) * (r0 + len)} y2={py + Math.sin(a) * (r0 + len)} stroke={ink} strokeWidth={4.5 * u} strokeLinecap="round" />;
          })}
        </g>,
      );
    }
    stars.forEach((s, i) => {
      const lf = f - s.dl;
      if (lf < 0 || lf > s.lf) return;
      const sc = prog(lf, 0, 3, ease.out) * (0.85 + 0.15 * Math.sin(frame * 1.67 + s.ph));
      const op = 1 - prog(lf, s.lf * 0.55, s.lf, ease.linear);
      const dd = R * s.d * (0.78 + 0.22 * prog(lf, 0, s.lf, ease.out));
      const sx = px + Math.cos(s.a) * dd;
      const sy = py - 30 * u * size + Math.sin(s.a) * dd * 0.8;
      out.push(<Spark4 key={`s${i}`} x={sx} y={sy} r={s.sz * 0.85 * u * size} color={s.col} ink={ink} u={u} rot={s.rot} scale={sc} opacity={op} />);
      if (i % 2 === 0) out.push(<circle key={`d${i}`} cx={sx + s.sz * 0.7 * u} cy={sy - s.sz * 0.6 * u} r={4 * u * size * sc} fill={s.col} opacity={op} />);
    });
  }

  // ---------- scuffle: jittering dust cloud + gold stars bursting out ----------
  if (variant === 'scuffle') {
    const on = f >= 0 && f < scuffleFrames + 6;
    const poof = prog(f, scuffleFrames, scuffleFrames + 6, ease.out);
    if (on) {
      const b = boil(frame, 2);
      const jx = Math.sin(frame * 1.3) * 6 * u;
      const rot = Math.sin(frame * 0.9) * 10;
      const inS = prog(f, 0, 4, ease.back);
      const cr = 250 * u * size;
      const blobs = [
        [0, 0, 1],
        [-0.55, 0.12, 0.62],
        [0.58, 0.08, 0.66],
        [0.05, -0.42, 0.6],
      ];
      out.push(
        <g key="cloud" transform={`translate(${px + jx} ${py}) rotate(${rot}) scale(${inS * (1 + 0.25 * poof)})`} opacity={1 - poof}>
          {blobs.map(([bx, by, br], k) => (
            <path key={k} d={doodleBlob(bx * cr, by * cr, br * cr, `cl${k}-${b}`, 7, 0.16)} fill="#f6f1e6" stroke={ink} strokeWidth={INKW * 1.2 * u} />
          ))}
          {Array.from({length: 4}, (_, k) => {
            const rr = rng(b * 13 + k);
            const ax = (rr() - 0.5) * cr * 1.2;
            const ay = (rr() - 0.5) * cr * 0.7;
            return <path key={`sw${k}`} d={doodleLoop(ax, ay, cr * 0.2, cr * 0.13, rr() * 6, rr() * 6, 5.2, `sw${b}${k}`, 0.15, 14)} fill="none" stroke={ink} strokeWidth={1.8 * u} opacity={0.8} />;
          })}
          {Array.from({length: 3}, (_, k) => {
            const rr = rng(b * 31 + k + 9);
            const a = rr() * Math.PI * 2;
            const r0 = cr * 0.95;
            return (
              <g key={`lm${k}`} transform={`translate(${Math.cos(a) * r0} ${Math.sin(a) * r0 * 0.8}) rotate(${(a * 180) / Math.PI})`}>
                <rect x={-4 * u} y={-9 * u} width={34 * u} height={18 * u} rx={9 * u} fill="#f6f1e6" stroke={ink} strokeWidth={INKW * u} />
              </g>
            );
          })}
        </g>,
      );
    }
    // aftermath: little doodle puffs drift out of the vanished cloud
    const pf = f - scuffleFrames - 2;
    if (pf >= 0 && pf < 20) {
      const pr = rng(seed * 5 + 3);
      const k = prog(pf, 0, 20, ease.out);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + pr() * 0.6;
        const d = (190 + 170 * k) * u * size;
        const rr = (58 + pr() * 34) * u * size * (1 - 0.45 * k);
        out.push(
          <path key={`pf${i}`} d={doodleLoop(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.75 - 40 * u * k, rr, rr * 0.85, pr() * 6, pr() * 6, 6.6, `pf${i}`, 0.1, 16)} fill="#f6f1e6" stroke={ink} strokeWidth={2 * u} opacity={1 - prog(pf, 8, 20, ease.in)} />,
        );
      }
    }
    // stars emitted through the scuffle window
    const r = rng(seed * 17 + 1);
    const emits = Math.max(6, Math.round(count * 1.25));
    for (let i = 0; i < emits; i++) {
      const t0 = Math.floor((i / emits) * scuffleFrames * 0.9) + Math.floor(r() * 3);
      const a = r() * Math.PI * 2;
      const sp = range(r, 200, 350) * 1.4 * u * size;
      const lf = f - t0;
      const lifeF = 20;
      const spin = (r() - 0.5) * 600;
      const sz = range(r, 32, 54) * u * size;
      if (lf < 0 || lf > lifeF) continue;
      const t = lf / 30;
      const dist = 200 * u * size + sp * t;
      const sc = lf < 4 ? prog(lf, 0, 4, ease.back) : 1 - prog(lf, lifeF * 0.55, lifeF, ease.in);
      out.push(<Star5 key={`st${i}`} x={px + Math.cos(a) * dist} y={py + Math.sin(a) * dist * 0.85 - 20 * u * t} r={sz} color={starColor} ink={ink} u={u} rot={spin * t} scale={sc} opacity={1} />);
    }
  }

  // ---------- cheer: bouncing character with twinkling gold stars ----------
  if (variant === 'cheer') {
    const bodyS = 360 * u * size;
    const hz = 3;
    const bounceT = Math.max(0, f) / 30;
    const bph = (bounceT * hz) % 1;
    const hop = f >= 0 ? Math.sin(bph * Math.PI) * 26 * u * size : 0;
    const land = f >= 0 ? Math.max(0, 1 - Math.min(bph, 1 - bph) / 0.12) : 0;
    if (scene) {
      out.push(
        <BoxBot key="bot" x={px} y={py + bodyS * 0.55 - hop} s={bodyS} face={f >= 0 ? 'happy' : 'neutral'} squashY={1 - 0.08 * land} frame={frame} id="cheerbot" />,
      );
    }
    stars.slice(0, Math.max(3, count)).forEach((s, i) => {
      const n = Math.max(3, Math.min(count, stars.length));
      const a = Math.PI + ((i + 0.5) / n) * Math.PI;
      const rr = R * (1.05 + 0.18 * ((i * 7) % 3));
      const sx = px + Math.cos(a) * rr * 1.25;
      const sy = py - (scene ? 60 * u * size : 0) + Math.sin(a) * rr * 0.75 + (scene ? 0 : R * 0.4);
      const lf = f - i * 3;
      if (lf < 0) return;
      const pop = prog(lf, 0, 5, ease.back);
      const pulse = 0.95 + 0.15 * Math.sin((frame / 30) * Math.PI * 2 * 2 + s.ph);
      const exit = 1 - prog(frame, durationInFrames - 10 + i, durationInFrames, ease.in);
      out.push(<Star5 key={`c${i}`} x={sx} y={sy} r={s.sz * 0.9 * u * size} color={starColor} ink={ink} u={u} rot={s.rot + Math.sin(frame * 0.12 + s.ph) * 8} scale={pop * pulse * exit} opacity={1} />);
      if (i % 2 === 1) {
        const tw = 0.5 + 0.5 * Math.sin(frame * 0.5 + s.ph);
        out.push(<Spark4 key={`cs${i}`} x={sx + 70 * u * size} y={sy - 55 * u * size} r={14 * u * size} color="#fff6c8" ink={ink} u={u * 0.6} scale={pop * tw * exit} opacity={1} />);
      }
    });
  }

  return (
    <FxRoot background={background} paper={!clear} paperTint="#8a7350">
      <Svg>{out}</Svg>
    </FxRoot>
  );
};

export const sparkleBurst = defineMotion<Props>({
  id: 'sparkle-burst',
  title: 'Sparkle burst',
  category: 'fx',
  description:
    'Four-point doodle sparkles burst from a contact point and twinkle out (tool-tap repair), or gold stars fly out of a jittering scuffle cloud, or twinkle around a cheering character. Overlay-ready: background "transparent".',
  source: ['video20 tool-tap-repair + sparkle-burst', 'video22 capture-scuffle-sparkles', 'video22 cheer-bounce-emotes'],
  useFor: 'Success / fixed / done accents, comic fights and replacements, celebration beats.',
  durationInFrames: 64,
  defaultProps: {
    background: '#E1D7C5',
    x: 0.5,
    y: 0.56,
    delay: 34,
    variant: 'repair',
    count: 8,
    radius: 230,
    colors: ['#5FAE6E', '#3F7FD6', '#E0B84A', '#D9534F'],
    starColor: '#E0B84A',
    size: 1,
    life: 21,
    ticks: true,
    taps: 3,
    tapEvery: 8,
    scuffleFrames: 40,
    ink: '#2e2a26',
    showSubject: true,
    seed: 4,
  },
  propDocs: {
    background: "scene paper colour; 'transparent' = overlay (no subject, no paper)",
    x: 'contact point x (0..1)',
    y: 'contact point y (0..1)',
    delay: 'repair: frame of the final tap (sparkles fire here); scuffle/cheer: start frame',
    variant: 'repair (4-point colour sparkles + impact ticks) | scuffle (dust cloud + gold stars) | cheer (twinkling gold stars around a bouncing bot)',
    count: 'number of stars (v20 5-9, v22 4-6)',
    radius: 'scatter radius in u (~1.2 body widths)',
    colors: 'sparkle colours (repair variant)',
    starColor: 'gold star colour (scuffle / cheer)',
    size: 'overall size multiplier',
    life: 'sparkle life in frames (0.4-0.7 s)',
    ticks: 'flash radial ink impact ticks for 3 frames on each tap',
    taps: 'repair scene: number of hammer taps (sparkles on the last)',
    tapEvery: 'frames between taps (0.25 s)',
    scuffleFrames: 'scuffle variant: length of the jittering cloud window',
    ink: 'outline colour',
    showSubject: 'draw the scene subject (hammer + cracked pipe / bouncing bot); ignored in overlay mode',
    seed: 'random seed',
  },
  component: SparkleBurst,
  tags: ['sparkle', 'stars', 'success', 'repair', 'fight', 'cheer', 'overlay', 'fx'],
});
