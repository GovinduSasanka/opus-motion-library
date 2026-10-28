import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {lighten, mix, rgbaStr, vn1} from '../../core/r2-pr3-kit';

/**
 * Fire. 'cartoon': a row of layered teardrop tongues (red / orange / yellow) licking with 6-10 Hz noise flicker and
 * 15 % height variance, ink-free flat shapes, rising sparks. 'real': the same field drawn as many soft additive
 * layers with vertical gradients, a heat glow and rising embers. 'lava': dark crust with pulsing glowing cracks and
 * gooey molten blobs that rise, merge and pop. Set overlay=true to drop it over any scene (transparent background).
 */
type Props = {
  style: 'cartoon' | 'real' | 'lava';
  intensity: number;
  position: 'bottom' | 'center';
  width: number;
  tongues: number;
  flicker: number;
  sparks: boolean;
  overlay: boolean;
  outer: string;
  mid: string;
  inner: string;
  background: string;
  seed: number;
};

const tongue = (x: number, y0: number, wd: number, ht: number, lean: number, kink: number) =>
  `M${x - wd / 2} ${y0}C${x - wd * 0.62} ${y0 - ht * 0.3},${x - wd * 0.18 + lean * 0.35 + kink} ${y0 - ht * 0.6},${x + lean} ${y0 - ht}` +
  `C${x + wd * 0.28 + lean * 0.4 - kink} ${y0 - ht * 0.58},${x + wd * 0.62} ${y0 - ht * 0.28},${x + wd / 2} ${y0}Z`;

const FireFlames: React.FC<Props> = ({style, intensity, position, width, tongues, flicker, sparks, overlay, outer, mid, inner, background, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const t = frame / 30;
  const base = position === 'center' ? h * 0.7 : h * 0.94;
  const fw = w * width;
  const x0 = (w - fw) / 2;
  const Hmax = Math.min(w, h) * (style === 'lava' ? 0.0 : 0.62) * intensity * (position === 'center' ? 0.9 : 1);
  const bg = overlay ? 'transparent' : background;

  const field = useMemo(() => {
    const r = rng(seed);
    return Array.from({length: tongues}, (_, i) => {
      const k = tongues === 1 ? 0.5 : i / (tongues - 1);
      const bell = Math.sin(Math.PI * (0.12 + k * 0.76)) ** 0.8;
      return {k, bell, ph: r() * 20, hv: 0.85 + r() * 0.3, wv: 0.9 + r() * 0.3, delay: r() * 10};
    });
  }, [tongues, seed]);
  const sp = useMemo(() => {
    const r = rng(seed + 5);
    return Array.from({length: 34}, () => ({k: r(), ph: r() * 50, rate: 0.5 + r() * 0.9, sz: 0.004 + r() * 0.006, drift: r() * 2 - 1}));
  }, [seed]);

  const els: React.ReactNode[] = [];
  const uid = 'flames';
  const flickAt = (ph: number, spd = 8) => vn1(t * spd * flicker + ph, seed);
  const glowPulse = 0.85 + 0.15 * flickAt(77, 9);

  if (style !== 'lava') {
    const order = [...field].sort((a, b) => Math.abs(b.k - 0.5) - Math.abs(a.k - 0.5));
    order.forEach((f, idx) => {
      const grow = prog(frame, f.delay, f.delay + 26, ease.out);
      const ht = Hmax * (0.42 + 0.58 * f.bell) * f.hv * (1 + 0.15 * flickAt(f.ph, 7)) * grow;
      const wd = (fw / tongues) * 2.1 * f.wv * (0.8 + 0.2 * f.bell);
      const cxp = x0 + f.k * fw;
      const lean = flickAt(f.ph + 3, 6) * wd * 0.55 + (f.k - 0.5) * wd * 0.35;
      const kink = flickAt(f.ph + 9, 8.5) * wd * 0.16;
      if (style === 'cartoon') {
        els.push(
          <g key={idx}>
            <path d={tongue(cxp, base, wd, ht, lean, kink)} fill={outer} />
            <path d={tongue(cxp + lean * 0.05, base, wd * 0.7, ht * 0.72, lean * 0.8, kink * 0.8)} fill={mid} />
            <path d={tongue(cxp + lean * 0.08, base, wd * 0.42, ht * 0.44, lean * 0.6, kink * 0.5)} fill={inner} />
          </g>,
        );
      } else {
        const layers = [
          {s: 1.0, w: 1.15, c: mix(outer, '#000000', 0.25), a: 0.55},
          {s: 0.85, w: 0.95, c: outer, a: 0.7},
          {s: 0.66, w: 0.72, c: mid, a: 0.8},
          {s: 0.46, w: 0.5, c: inner, a: 0.9},
          {s: 0.26, w: 0.3, c: lighten(inner, 0.7), a: 0.9},
        ];
        els.push(
          <g key={idx}>
            {layers.map((l, li) => (
              <path key={li} d={tongue(cxp, base + 4 * u, wd * l.w, ht * l.s, lean * (1 - li * 0.1), kink * (1 - li * 0.15))} fill={`url(#${uid}-g${li})`} opacity={l.a} />
            ))}
          </g>,
        );
      }
    });
  }

  const sparkEls = sparks && style !== 'lava'
    ? sp.map((s, i) => {
        const life = ((t * s.rate * 0.7 + s.ph) % 1);
        const x = x0 + s.k * fw + flickAt(s.ph, 3) * Hmax * 0.1 + s.drift * life * Hmax * 0.18;
        const y = base - Hmax * 0.25 - life * Hmax * (0.85 + s.rate * 0.4);
        const a = Math.sin(Math.PI * Math.min(1, life * 1.1)) * intensity * 0.95 * prog(frame, 14, 34, ease.out);
        return <circle key={i} cx={x} cy={y} r={Math.max(1.2, s.sz * Math.min(w, h) * (1 - life * 0.6))} fill={life < 0.5 ? inner : mid} opacity={a} />;
      })
    : null;

  // lava
  let lava: React.ReactNode = null;
  if (style === 'lava') {
    const top = h * (position === 'center' ? 0.42 : 0.5);
    const lb = Math.min(w, h);
    const blobs = Array.from({length: 18}, (_, i) => {
      const f = field[i % field.length];
      const ph = i * 3.7 + seed;
      const x = x0 + ((i * 0.61803) % 1) * fw + vn1(t * 0.35 + ph, seed) * lb * 0.08;
      const rise = (Math.sin(t * 0.5 + ph) * 0.5 + 0.5) ** 1.4;
      const y = h - (h - top) * (0.25 + 0.65 * rise) + vn1(t * 0.5 + ph + 40, seed) * lb * 0.03;
      const r = lb * (0.045 + 0.05 * f.hv) * (0.7 + 0.5 * rise);
      return {x, y, r, rise};
    });
    const crack = (i: number) => {
      const y0 = top + ((i + 0.5) / 7) * (h - top);
      let d = '';
      for (let k = 0; k <= 16; k++) {
        const x = (k / 16) * w;
        const y = y0 + vn1(k * 0.7 + i * 5, seed + 4) * lb * 0.06 + Math.sin(k * 0.9 + i) * lb * 0.015;
        d += `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      return d;
    };
    const rise = prog(frame, 0, 30, ease.out);
    lava = (
      <g opacity={rise}>
        <rect x={0} y={top} width={w} height={h - top + 4} fill="#190B09" />
        <g filter={`url(#${uid}-goo)`}>
          <rect x={0} y={h - (h - top) * 0.42} width={w} height={(h - top) * 0.5} fill={mid} />
          {blobs.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r * rise} fill={b.rise > 0.7 ? inner : mid} />
          ))}
        </g>
        {Array.from({length: 7}, (_, i) => (
          <path key={i} d={crack(i)} fill="none" stroke={rgbaStr(mid, 0.45 + 0.35 * (0.5 + 0.5 * flickAt(i * 7, 3)))} strokeWidth={(2 + (i % 3)) * u} strokeLinecap="round" />
        ))}
        <rect x={0} y={top - 6 * u} width={w} height={h - top} fill={`url(#${uid}-lavaglow)`} opacity={0.55 * glowPulse} />
      </g>
    );
  }

  const glowTop = style === 'lava' ? h * 0.35 : base - Hmax * 1.1;
  return (
    <AbsoluteFill style={{background: bg}}>
      <Svg>
        <defs>
          {[0, 1, 2, 3, 4].map((li) => {
            const cols = [mix(outer, '#000000', 0.25), outer, mid, inner, lighten(inner, 0.7)];
            return (
              <linearGradient key={li} id={`${uid}-g${li}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={cols[li]} stopOpacity="1" />
                <stop offset="0.55" stopColor={cols[li]} stopOpacity="0.85" />
                <stop offset="1" stopColor={cols[Math.max(0, li - 1)]} stopOpacity="0" />
              </linearGradient>
            );
          })}
          <radialGradient id={`${uid}-glow`} cx="0.5" cy="1" r="0.75">
            <stop offset="0" stopColor={mid} stopOpacity="0.7" />
            <stop offset="0.5" stopColor={outer} stopOpacity="0.22" />
            <stop offset="1" stopColor={outer} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-lavaglow`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mid} stopOpacity="0.8" />
            <stop offset="1" stopColor={mid} stopOpacity="0" />
          </linearGradient>
          <filter id={`${uid}-goo`} x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={12 * u} result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" />
          </filter>
          <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={style === 'real' ? 4 * u : 0} />
          </filter>
        </defs>
        {style !== 'cartoon' && <ellipse cx={w / 2} cy={base} rx={fw * 0.72} ry={Math.max(60 * u, Hmax * 1.1)} fill={`url(#${uid}-glow)`} opacity={intensity * glowPulse * (style === 'lava' ? 0 : 1)} />}
        {style === 'cartoon' && <ellipse cx={w / 2} cy={base + 4 * u} rx={fw * 0.52} ry={26 * u} fill={rgbaStr(outer, 0.35 * glowPulse)} />}
        {style === 'lava' ? (
          <>
            <rect x={0} y={glowTop} width={w} height={h - glowTop} fill={`url(#${uid}-lavaglow)`} opacity={0.18 * glowPulse} />
            {lava}
          </>
        ) : (
          <g filter={style === 'real' ? `url(#${uid}-soft)` : undefined} style={{mixBlendMode: style === 'real' ? 'screen' : 'normal'}}>
            {els}
          </g>
        )}
        {sparkEls}
      </Svg>
    </AbsoluteFill>
  );
};

export const fireFlames = defineMotion<Props>({
  id: 'fire-flames',
  title: 'Fire flames (cartoon / real / lava)',
  category: 'fx',
  description:
    'A fire bed that licks upward with 6-10 Hz flicker and 15 % height variance: flat layered red / orange / yellow tongues (cartoon), soft additive gradient layers with heat glow and embers (real), or dark crust with pulsing glowing cracks and gooey rising lava blobs. Overlay-capable.',
  source: ['prompt-corpus research: fire-flames (20 cases, ideas only; original implementation)'],
  useFor: 'Hearths and campfire ambience, danger beats, hot deals, forge / craft stories, lava worlds; drop over a dark scene with overlay=true.',
  durationInFrames: 150,
  defaultProps: {style: 'cartoon', intensity: 1, position: 'bottom', width: 0.8, tongues: 7, flicker: 1, sparks: true, overlay: false, outer: '#E5391C', mid: '#FF8A1F', inner: '#FFD84A', background: '#150A08', seed: 3},
  propDocs: {
    style: "'cartoon' | 'real' | 'lava'",
    intensity: 'flame height / glow 0-1.5',
    position: "'bottom' (floor of the frame) | 'center' (lower middle)",
    width: 'fraction of the frame width the fire spans',
    tongues: 'number of flame tongues (lava: blob density follows it)',
    flicker: 'flicker speed multiplier (1 = about 7-8 Hz)',
    sparks: 'rising sparks / embers',
    overlay: 'true = transparent background so it can sit over any scene',
    outer: 'outer flame colour',
    mid: 'middle flame colour',
    inner: 'hot core colour',
    background: 'background colour (ignored when overlay)',
    seed: 'randomness seed',
  },
  component: FireFlames,
  tags: ['fire', 'flames', 'flame', 'campfire', 'bonfire', 'lava', 'magma', 'heat', 'hot', 'embers', 'sparks', 'overlay', 'fx', 'cartoon', 'ambience', 'danger', 'hearth', 'burn'],
});
