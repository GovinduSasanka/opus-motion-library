import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, estWidth} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Comic SFX starburst (video12 BONK!/POP!/BEEP! BEEP!, video14 comic-impact-burst, video17 impact-frame).
 * A 2–3 frame monochrome impact frame with radial speed lines, then a jagged halftone starburst springs
 * in (0 → 1.15 → 1, −8° → 0), wobbles, the italic outlined lettering boils on threes, a ground
 * shockwave ring expands (rx 0 → 450, ry = 0.18 rx, 0.6 s) and speed lines whip in from the frame edges.
 */

type Palette = 'pink' | 'yellow' | 'white' | 'cyan' | 'green';
type Burst = {text: string; at: number; x: number; y: number; palette?: Palette; rotate?: number; size?: number; impact?: boolean; life?: number};
type Props = {
  bursts: Burst[];
  points: number;
  speedLines: boolean;
  shockwave: boolean;
  wobble: number;
  outline: string;
  backdrop: BackdropKind;
  src: string;
  seed: number;
};

const PAL: Record<Palette, {fill: string; dots: string; top: string; bottom: string; offset: string}> = {
  pink: {fill: '#ff3f8e', dots: '#ffc83d', top: '#fffbe6', bottom: '#ffe08a', offset: '#36e0ff'},
  yellow: {fill: '#ffd93a', dots: '#ff8a1a', top: '#ffffff', bottom: '#ffe9b8', offset: '#ff4f9a'},
  white: {fill: '#fffaf3', dots: '#ff5fa2', top: '#ffd54a', bottom: '#ff7a1a', offset: '#36e0ff'},
  cyan: {fill: '#55d6ff', dots: '#e9fbff', top: '#fff7cf', bottom: '#ffc93a', offset: '#ff4f9a'},
  green: {fill: '#41e09f', dots: '#d6ff7a', top: '#fff7cf', bottom: '#ffc93a', offset: '#ff4f9a'},
};

const starPts = (cx: number, cy: number, rx: number, ry: number, n: number, seed: string) => {
  const r = rng(seed);
  const pts: [number, number][] = [];
  const spikes = new Set([Math.floor(r() * n), Math.floor(r() * n), Math.floor(r() * n)]);
  for (let i = 0; i < n * 2; i++) {
    const a = ((i + r() * 0.35) / (n * 2)) * Math.PI * 2;
    const outer = i % 2 === 0;
    let k = outer ? 0.92 + r() * 0.22 : 0.6 + r() * 0.1;
    if (outer && spikes.has(i / 2)) k = 1.32 + r() * 0.15;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
};

const OneBurst: React.FC<{b: Burst; i: number; p: Props; D: number}> = ({b, i, p, D}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const pal = PAL[b.palette ?? 'pink'];
  const lf = frame - b.at;
  if (lf < 0) return null;
  const fs = 150 * u * (b.size ?? 1);
  const tw = estWidth(b.text, fs, 'comic') * 1.02;
  const rx = tw * 0.5 + fs * 0.85;
  const ry = fs * 1.05;
  const cx = clamp(b.x * w, rx * 1.3, w - rx * 1.3);
  const cy = clamp(b.y * h, ry * 1.2, h - ry * 1.2);
  const life = b.life ?? D - 8 - b.at;
  const s = spring({frame: lf, fps, config: {damping: 9, stiffness: 190, mass: 0.6}});
  const exit = ease.in(clamp((lf - life) / 6));
  const wob = 1 + p.wobble * Math.sin(lf * 0.9) * Math.exp(-lf / 22) + p.wobble * 0.25 * Math.sin(lf * 0.45);
  const scale = s * wob * (1 - exit);
  const rot = (b.rotate ?? -6) - 8 * (1 - Math.min(1, s)) + exit * 12;
  if (scale <= 0.001) return null;
  // boil on threes
  const step = Math.floor(lf / 3);
  const br = rng(`boil${i}-${step}`);
  const bx = (br() - 0.5) * 3 * u;
  const by = (br() - 0.5) * 3 * u;
  const id = `cb${i}`;
  const dot = 11 * u;
  const pts = starPts(0, 0, rx, ry, p.points, `${p.seed}-${i}`);
  const spikes = scatterSpikes(`${p.seed}sp${i}`, rx, ry);
  // shockwave
  const sw = clamp(lf / 18);
  return (
    <g>
      {p.shockwave && sw < 1 && (
        <ellipse cx={cx} cy={cy + ry * 0.95} rx={450 * u * (b.size ?? 1) * ease.out(sw)} ry={450 * u * (b.size ?? 1) * ease.out(sw) * 0.18} fill="none" stroke={pal.fill} strokeWidth={7 * u * (1 - sw) + 1 * u} opacity={1 - sw} />
      )}
      <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${scale})`}>
        <defs>
          <pattern id={`${id}-dots`} width={dot} height={dot} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx={dot / 2} cy={dot / 2} r={dot * 0.26} fill={pal.dots} />
          </pattern>
          <pattern id={`${id}-tdots`} width={dot * 0.7} height={dot * 0.7} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx={dot * 0.35} cy={dot * 0.35} r={dot * 0.13} fill="#ff8a1a" />
          </pattern>
          <linearGradient id={`${id}-tg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.15" stopColor={pal.top} />
            <stop offset="0.95" stopColor={pal.bottom} />
          </linearGradient>
        </defs>
        {/* spikes that shoot past the burst */}
        {spikes.map((sp, k) => (
          <polygon key={k} points={sp.pts} fill={k % 3 === 0 ? '#ffffff' : p.outline} opacity={0.95} />
        ))}
        <polygon points={pts} fill={p.outline} transform={`translate(${12 * u} ${14 * u})`} opacity={0.85} />
        <polygon points={pts} fill={pal.fill} stroke={p.outline} strokeWidth={7 * u} strokeLinejoin="miter" />
        <polygon points={pts} fill={`url(#${id}-dots)`} opacity={0.85} transform="scale(0.94)" />
        <g transform={`translate(${bx} ${by}) skewX(-9)`} fontFamily={fonts.comic} fontSize={fs} textAnchor="middle">
          <text x={7 * u} y={fs * 0.36 + 9 * u} textLength={tw} lengthAdjust="spacingAndGlyphs" fill={p.outline} stroke={p.outline} strokeWidth={fs * 0.16} strokeLinejoin="round">
            {b.text}
          </text>
          <text x={-5 * u} y={fs * 0.36 - 4 * u} textLength={tw} lengthAdjust="spacingAndGlyphs" fill={pal.offset} stroke={pal.offset} strokeWidth={fs * 0.13} strokeLinejoin="round">
            {b.text}
          </text>
          <text x={0} y={fs * 0.36} textLength={tw} lengthAdjust="spacingAndGlyphs" fill={`url(#${id}-tg)`} stroke={p.outline} strokeWidth={fs * 0.075} strokeLinejoin="round" paintOrder="stroke">
            {b.text}
          </text>
          <text x={0} y={fs * 0.36} textLength={tw} lengthAdjust="spacingAndGlyphs" fill={`url(#${id}-tdots)`} opacity={0.55}>
            {b.text}
          </text>
        </g>
      </g>
    </g>
  );
};

const scatterSpikes = (seed: string, rx: number, ry: number) => {
  const r = rng(seed);
  return Array.from({length: 7}, () => {
    const a = r() * Math.PI * 2;
    const len = 1.35 + r() * 0.45;
    const wdt = 0.03 + r() * 0.03;
    const p0 = [Math.cos(a - wdt) * rx * 0.85, Math.sin(a - wdt) * ry * 0.85];
    const p1 = [Math.cos(a) * rx * len, Math.sin(a) * ry * len];
    const p2 = [Math.cos(a + wdt) * rx * 0.85, Math.sin(a + wdt) * ry * 0.85];
    return {pts: [p0, p1, p2].map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ')};
  });
};

/** radial speed-line wedges converging on (cx, cy) */
const SpeedLines: React.FC<{cx: number; cy: number; t: number; seed: string; color: string; count: number; inner: number}> = ({cx, cy, t, seed, color, count, inner}) => {
  const {w, h} = useStage();
  const R = Math.hypot(w, h);
  const r = rng(seed);
  return (
    <g opacity={t}>
      {Array.from({length: count}, (_, i) => {
        const a = (i / count) * Math.PI * 2 + r() * 0.12;
        const wd = 0.004 + r() * 0.014;
        const r0 = R * (inner + r() * 0.25);
        const pts = [
          [cx + Math.cos(a) * r0, cy + Math.sin(a) * r0],
          [cx + Math.cos(a - wd) * R, cy + Math.sin(a - wd) * R],
          [cx + Math.cos(a + wd) * R, cy + Math.sin(a + wd) * R],
        ];
        return <polygon key={i} points={pts.map((q) => q.join(',')).join(' ')} fill={color} />;
      })}
    </g>
  );
};

const ComicBurst: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: D} = useStage();
  // impact frame (2–3 frames before a burst flagged impact)
  const imp = p.bursts.find((b) => b.impact && frame >= b.at - 3 && frame < b.at);
  // camera shake after each burst
  let shx = 0;
  let shy = 0;
  for (const b of p.bursts) {
    const lf = frame - b.at;
    if (lf >= 0 && lf < 10) {
      const k = (10 - lf) / 10;
      shx += Math.sin(lf * 2.7 + b.at) * 9 * u * k * (b.size ?? 1);
      shy += Math.cos(lf * 3.1 + b.at) * 7 * u * k * (b.size ?? 1);
    }
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${shx}px, ${shy}px) scale(1.03)`}}>
        <Backdrop kind={p.backdrop} src={p.src || undefined} drift={0.3} />
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {p.speedLines &&
            p.bursts.map((b, i) => {
              const lf = frame - b.at;
              if (lf < 0 || lf > 18) return null;
              const t = 1 - clamp((lf - 6) / 12);
              return <SpeedLines key={i} cx={b.x * w} cy={b.y * h} t={t} seed={`sl${i}-${Math.floor(lf / 2)}`} color="#140c2e" count={46} inner={0.32} />;
            })}
          {p.bursts.map((b, i) => (
            <OneBurst key={i} b={b} i={i} p={p} D={D} />
          ))}
        </svg>
      </AbsoluteFill>
      {imp && (
        <AbsoluteFill style={{background: '#f6dc1f'}}>
          <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
            <defs>
              <pattern id="cb-imp-dots" width={8 * u} height={8 * u} patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
                <circle cx={4 * u} cy={4 * u} r={2.2 * u} fill="#1b1206" />
              </pattern>
            </defs>
            <rect width={w} height={h} fill="url(#cb-imp-dots)" opacity={0.35} />
            <SpeedLines cx={imp.x * w} cy={imp.y * h} t={1} seed={`imp${frame}`} color="#120c04" count={80} inner={0.12} />
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const comicBurst = defineMotion<Props>({
  id: 'comic-burst',
  title: 'Comic SFX burst',
  category: 'text',
  description: 'Comic onomatopoeia (BONK! POP!) in a jagged halftone starburst that springs in after an impact frame, wobbles and boils, with speed lines and a shockwave ring.',
  source: ['video12 0:07-0:66', 'video14 1:46-1:58', 'video17 0:28.15-0:28.20'],
  useFor: 'Impacts, punchlines, notifications and any "sound you can see" beat.',
  durationInFrames: 150,
  defaultProps: {
    bursts: [
      {text: 'BONK!', at: 10, x: 0.66, y: 0.34, palette: 'pink', rotate: -6, size: 1, impact: true},
      {text: 'POP!', at: 70, x: 0.3, y: 0.7, palette: 'cyan', rotate: 7, size: 0.8},
    ],
    points: 15,
    speedLines: true,
    shockwave: true,
    wobble: 0.035,
    outline: '#1b1030',
    backdrop: 'comic',
    src: '',
    seed: 3,
  },
  propDocs: {
    bursts: '[{text, at, x, y, palette?, rotate?, size?, impact?, life?}] — palette pink | yellow | white | cyan | green; impact = 3-frame yellow smash frame before it; life = frames until it pops away',
    points: 'number of star points (12–18)',
    speedLines: 'radial speed lines whip in on each burst',
    shockwave: 'ground shockwave ellipse under each burst',
    wobble: 'post-pop scale wobble amount',
    outline: 'ink colour for outlines and shadows',
    backdrop: 'comic | dusk | warm | … procedural scene behind',
    src: 'optional public/ image as the scene',
    seed: 'changes the burst shapes',
  },
  component: ComicBurst,
  tags: ['comic', 'sfx', 'burst', 'impact', 'pop-art'],
});
