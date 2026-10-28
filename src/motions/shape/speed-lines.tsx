import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {h1} from '../../core/r2-e4-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video12 radial-speed-lines + impact-frame (BONK / CRASH / ATTENTION). Manga focus lines: tapered wedges from beyond
 * the frame toward a focus point, stopping short of a clear ellipse around the subject, redrawn with a new random set
 * every render frame (on twos = boil). At `impactAt` the whole frame flips for 2 render frames to a hard two-tone
 * print (yellow / violet) with thicker lines and a giant comic label; afterwards the lines turn red and fade over
 * ~4 render frames while the inner radius grows 10 %, then calm white focus lines return.
 */
type Props = {
  background: string;
  backgroundEdge: string;
  color: string;
  afterColor: string;
  count: number;
  maxWidth: number;
  innerRadius: [number, number];
  focus: [number, number];
  reseedEvery: number;
  impactAt: number;
  impactColors: [string, string];
  label: string;
  subject: 'ball' | 'none';
  subjectColor: string;
  halftone: boolean;
  seed: number;
  mode: 'manga' | 'super' | 'carved';
  rayCount: number;
  rayColors: [string, string];
  rayTurn: number;
  footnote: string;
  emitPoint: [number, number];
  cubes: number;
  labelColor: string;
  carveInner: number;
  carveOuter: number;
  carveWidth: number;
  carveBend: number;
  revealFrames: number;
  plateColor: string;
  plateAt: number;
  withdrawAt: number;
  carveBg: string;
  carveInk: string;
};

/** full-screen "special move" cut-in: two-tone sunburst with halftone dots, sparkle spitting cubes, slammed move name */
const SuperSplash: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const m = Math.min(w, h);
  const id = `sup-${p.seed}`;
  const fx = p.focus[0] * w;
  const fy = p.focus[1] * h;
  const n = Math.max(8, Math.round(p.rayCount));
  const rot = (frame / 30) * p.rayTurn;
  const R = Math.hypot(w, h);
  const rays: string[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = ((i / n) * 360 + rot) * (Math.PI / 180);
    const a1 = (((i + 0.5) / n) * 360 + rot) * (Math.PI / 180);
    rays.push(`M${fx} ${fy}L${fx + Math.cos(a0) * R} ${fy + Math.sin(a0) * R}L${fx + Math.cos(a1) * R} ${fy + Math.sin(a1) * R}Z`);
  }
  const enter = clamp(frame / 8);
  const bob = Math.sin((frame / 30) * Math.PI * 2) * 0.015 * h;
  const sc = 0.9 + 0.1 * (1 - Math.pow(1 - clamp(frame / 9), 3));
  // sparkle + cubes
  const ex = p.emitPoint[0] * w;
  const ey = p.emitPoint[1] * h;
  const sp = clamp((frame - 6) / 10) * 0.06 * w * (1 + 0.1 * Math.sin(frame * 0.7));
  const cubes: React.ReactNode[] = [];
  for (let i = 0; i < p.cubes; i++) {
    const period = 11;
    const t0 = 16 + i * (period / Math.max(1, p.cubes / 2));
    const cyc = Math.floor(Math.max(0, frame - t0) / (period * 1.0));
    const age = frame - t0 - cyc * period;
    if (frame < t0 || age < 0 || age > 12) continue;
    const ang = h1('cb' + p.seed + i, cyc) * Math.PI * 2;
    const dist = (0.04 + 0.1 * h1('cd' + p.seed + i, cyc)) * w * (age / 12);
    const sz = (0.008 + 0.008 * h1('cs' + p.seed + i, cyc)) * w;
    cubes.push(<rect key={i} x={-sz / 2} y={-sz / 2} width={sz} height={sz} fill="#FAEB9D" opacity={1 - age / 12} transform={`translate(${ex + Math.cos(ang) * dist} ${ey + Math.sin(ang) * dist}) rotate(${age * 40 * (i % 2 ? 1 : -1)})`} />);
  }
  // move name
  const nt = clamp((frame - 10) / 5);
  const nameS = nt <= 0 ? 0 : nt < 0.7 ? 0.4 + 0.68 * (nt / 0.7) : 1.08 - 0.08 * ((nt - 0.7) / 0.3);
  const flash = clamp(1 - frame / 3);
  const fn = clamp((frame - 14) / 8);
  const labFs = Math.min(0.12 * h, (w * 0.9) / Math.max(4, p.label.length * 0.62));
  return (
    <AbsoluteFill style={{background: p.rayColors[0], overflow: 'hidden'}}>
      <Svg>
        <defs>
          <pattern id={`${id}-d`} patternUnits="userSpaceOnUse" width={0.012 * w} height={0.012 * w} patternTransform="rotate(45)">
            <circle cx={0.006 * w} cy={0.006 * w} r={0.0026 * w} fill="#000" opacity={0.28} />
          </pattern>
          <clipPath id={`${id}-c`}>
            <path d={rays.join('')} />
          </clipPath>
          <radialGradient id={`${id}-g`} cx={p.focus[0]} cy={p.focus[1]} r="0.7">
            <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={p.rayColors[1]} />
        <path d={rays.join('')} fill={p.rayColors[0]} />
        <path d={rays.join('')} fill={`url(#${id}-d)`} />
        <rect width={w} height={h} fill={`url(#${id}-g)`} />
        {p.subject === 'ball' && (
          <g transform={`translate(${fx} ${fy + bob}) scale(${sc * enter})`}>
            <ellipse cx={m * 0.01} cy={m * 0.17} rx={m * 0.11} ry={m * 0.02} fill="#16081C" opacity={0.35} />
            <circle r={m * 0.13} fill={p.subjectColor} stroke="#16081C" strokeWidth={5 * u} />
            <ellipse cx={-m * 0.05} cy={-m * 0.055} rx={m * 0.03} ry={m * 0.019} transform={`rotate(-35 ${-m * 0.05} ${-m * 0.055})`} fill="#fff" />
          </g>
        )}
        {sp > 1 && (
          <g transform={`translate(${ex} ${ey})`}>
            <path d={`M0 ${-sp}L${sp * 0.22} ${-sp * 0.22}L${sp} 0L${sp * 0.22} ${sp * 0.22}L0 ${sp}L${-sp * 0.22} ${sp * 0.22}L${-sp} 0L${-sp * 0.22} ${-sp * 0.22}Z`} fill="#FAEB9D" />
          </g>
        )}
        {cubes}
      </Svg>
      {p.label && nameS > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: h * 0.1, textAlign: 'center', fontFamily: fonts.comic, fontStyle: 'italic', fontSize: labFs, lineHeight: 1, color: p.labelColor, WebkitTextStroke: `${8 * u}px #16081C`, paintOrder: 'stroke fill', transform: `rotate(-4deg) scale(${nameS})`}}>{p.label}</div>
      )}
      {p.footnote && <div style={{position: 'absolute', right: w * 0.06, bottom: h * 0.05, fontFamily: fonts.mono, fontStyle: 'italic', fontSize: h * 0.015 * 1.6, color: p.labelColor, opacity: fn}}>{p.footnote}</div>}
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
    </AbsoluteFill>
  );
};

/** woodcut carved-light burst: tapered U-gouge rays carved outward from a point, copper plate floods then withdraws */
const CarvedBurst: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const m = Math.min(w, h);
  const cx = p.focus[0] * w;
  const cy = p.focus[1] * h;
  const n = Math.max(8, Math.round(p.rayCount));
  const rays: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (h1('ca' + p.seed, i) - 0.5) * 0.12;
    const r0 = p.carveInner * m * (0.9 + 0.2 * h1('c0' + p.seed, i));
    const r1 = (p.carveOuter * m) * (0.7 + 0.5 * h1('c1' + p.seed, i));
    const delay = h1('cj' + p.seed, i) * p.revealFrames * 0.4;
    const k = clamp((frame - 4 - delay) / Math.max(1, p.revealFrames * 0.6));
    if (k <= 0) continue;
    const L = (r1 - r0) * (1 - Math.pow(1 - k, 3));
    const bend = (h1('cb' + p.seed, i) - 0.5) * p.carveBend;
    const wd = p.carveWidth * u * (0.7 + 0.6 * h1('cw' + p.seed, i));
    const S = 12;
    const pts: [number, number][] = Array.from({length: S + 1}, (_, j) => [cx + Math.cos(a + bend * (j / S) ** 2) * (r0 + L * (j / S)), cy + Math.sin(a + bend * (j / S) ** 2) * (r0 + L * (j / S))]);
    const left: string[] = [];
    const right: string[] = [];
    pts.forEach((pt, j) => {
      const t = j / S;
      const prof = Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, t * 6), 2))) * Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, (1 - t) * 2.5), 2)));
      const ang = a + bend * t * t;
      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);
      left.push(`${(pt[0] + nx * wd * prof * (0.4 + t)).toFixed(1)} ${(pt[1] + ny * wd * prof * (0.4 + t)).toFixed(1)}`);
      right.unshift(`${(pt[0] - nx * wd * prof * (0.4 + t)).toFixed(1)} ${(pt[1] - ny * wd * prof * (0.4 + t)).toFixed(1)}`);
    });
    rays.push(<path key={i} d={`M${left.join('L')}L${right.join('L')}Z`} fill="#fff" />);
  }
  const plate = p.plateColor ? clamp((frame - p.plateAt) / 14) * (p.withdrawAt >= 0 ? 1 - clamp((frame - p.withdrawAt) / 20) * 0.85 : 1) : 0;
  const id = `crv-${p.seed}`;
  return (
    <AbsoluteFill style={{background: p.carveBg, overflow: 'hidden'}}>
      <Svg>
        <defs>
          <mask id={`${id}-m`}>
            <rect width={w} height={h} fill="#000" />
            {rays}
          </mask>
        </defs>
        <g mask={`url(#${id}-m)`}>
          <rect width={w} height={h} fill={p.carveInk} />
          {plate > 0 && <rect width={w} height={h} fill={p.plateColor} opacity={plate} />}
        </g>
        <circle cx={cx} cy={cy} r={p.carveInner * m * 0.5} fill={p.plateColor || p.carveInk} opacity={0.85 * clamp((frame - 2) / 8)} />
      </Svg>
    </AbsoluteFill>
  );
};

const MangaLines: React.FC<Props> = ({background, backgroundEdge, color, afterColor, count, maxWidth, innerRadius, focus, reseedEvery, impactAt, impactColors, label, subject, subjectColor, halftone, seed}) => {
  const raw = useCurrentFrame();
  const {w, h, u} = useStage();
  const step = Math.max(1, Math.round(reseedEvery));
  const frame = Math.floor(raw / step) * step;
  const fx = focus[0] * w;
  const fy = focus[1] * h;
  const m = Math.min(w, h);
  const rx = innerRadius[0] * m;
  const ry = innerRadius[1] * m;
  const I = impactAt;
  const impact = I >= 0 && frame >= I && frame < I + 2 * step;
  const after = I >= 0 && frame >= I + 2 * step && frame < I + 2 * step + 8 * step;
  const afterT = after ? (frame - I - 2 * step) / (8 * step) : 0;
  // phases: lines pop in, boil; impact; red fade; calm return
  const intro = prog(frame, 2, 8, ease.out);
  const calm = I >= 0 ? prog(frame, I + 2 * step + 8 * step + 4, I + 2 * step + 8 * step + 16, ease.out) : 1;
  const wind = I >= 0 ? prog(frame, 6, I, ease.in) : 0;
  let lineOpacity = intro;
  let lineColor = color;
  let n = Math.round(count);
  let grow = 1 - 0.18 * (I >= 0 && frame < I ? wind : 0);
  let wMul = 1;
  if (impact) {
    lineOpacity = 1;
    lineColor = impactColors[0];
    wMul = 1.8;
    grow = 0.85;
    n = Math.round(count * 1.2);
  } else if (after) {
    lineColor = afterColor;
    lineOpacity = 1 - afterT;
    grow = 1 + 0.1 * afterT;
  } else if (I >= 0 && frame >= I) {
    lineOpacity = 0.75 * calm;
    n = Math.round(count * 0.7);
    grow = 1.1;
  }
  const r = rng(seed * 977 + Math.floor(frame / step));
  const Rmax = Math.hypot(w, h);
  const wedges = Array.from({length: n}, (_, i) => {
    const a = ((i + r() * 0.8) / n) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const re = (rx * ry) / Math.sqrt((ry * ca) ** 2 + (rx * sa) ** 2);
    const rin = re * grow * (1 + r() * 0.3 + (r() < 0.3 ? r() * 0.5 : 0));
    const wd = (2 + r() * 16) * (maxWidth / 18) * u * wMul;
    const nx = -sa;
    const ny = ca;
    const ox = fx + ca * Rmax;
    const oy = fy + sa * Rmax;
    return `${(fx + ca * rin).toFixed(1)},${(fy + sa * rin).toFixed(1)} ${(ox + nx * wd).toFixed(1)},${(oy + ny * wd).toFixed(1)} ${(ox - nx * wd).toFixed(1)},${(oy - ny * wd).toFixed(1)}`;
  });
  // subject: toon ball that jolts on impact
  const br = m * 0.13;
  const push = I >= 0 && frame < I ? 1 + 0.22 * wind : 1;
  const jolt = push * (I >= 0 ? (impact ? 1.18 : 1 + 0.12 * Math.exp(-Math.max(0, frame - I - 2 * step) / 5) * (frame >= I ? 1 : 0)) : 1);
  const bob = Math.sin(raw * 0.25) * 3 * u * (impact ? 0 : 1);
  const shake = impact || (after && afterT < 0.4) ? (rng(frame + 3)() - 0.5) * 18 * u : 0;
  const bg = impact ? impactColors[1] : background;
  const dark = impactColors[0];
  const id = `spl-${seed}`;
  return (
    <AbsoluteFill style={{background: impact ? bg : `radial-gradient(ellipse at ${focus[0] * 100}% ${focus[1] * 100}%, ${background} 0%, ${background} 25%, ${backgroundEdge} 100%)`}}>
      <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
        <Svg>
          <defs>
            <pattern id={`${id}-dots`} patternUnits="userSpaceOnUse" width={9 * u} height={9 * u} patternTransform="rotate(45)">
              <circle cx={4.5 * u} cy={4.5 * u} r={1.9 * u} fill={impact ? dark : '#16081C'} />
            </pattern>
            <radialGradient id={`${id}-mask-g`} cx={focus[0]} cy={focus[1]} r="0.75">
              <stop offset="0.2" stopColor="#fff" stopOpacity={0.15} />
              <stop offset="1" stopColor="#fff" stopOpacity={1} />
            </radialGradient>
            <mask id={`${id}-mask`}>
              <rect width={w} height={h} fill={`url(#${id}-mask-g)`} />
            </mask>
          </defs>
          {halftone && <rect width={w} height={h} fill={`url(#${id}-dots)`} opacity={impact ? 0.45 : 0.3} mask={`url(#${id}-mask)`} />}
          {subject === 'ball' && (
            <g transform={`translate(${fx} ${fy + bob}) scale(${jolt})`}>
              {impact ? (
                <g>
                  <circle r={br} fill={dark} />
                  <circle cx={-br * 0.38} cy={-br * 0.4} r={br * 0.2} fill={impactColors[1]} />
                </g>
              ) : (
                <g>
                  <ellipse cx={br * 0.1} cy={br * 1.25} rx={br * 0.8} ry={br * 0.16} fill="#16081C" opacity={0.35} />
                  <circle r={br} fill={subjectColor} />
                  <path d={`M ${br * 0.95} ${-br * 0.3} A ${br} ${br} 0 0 1 ${-br * 0.6} ${br * 0.8} A ${br * 1.1} ${br * 1.1} 0 0 0 ${br * 0.95} ${-br * 0.3} Z`} fill="#8E2A16" opacity={0.55} />
                  <circle r={br} fill="none" stroke="#16081C" strokeWidth={5 * u} />
                  <ellipse cx={-br * 0.4} cy={-br * 0.42} rx={br * 0.22} ry={br * 0.14} transform={`rotate(-35 ${-br * 0.4} ${-br * 0.42})`} fill="#fff" />
                </g>
              )}
            </g>
          )}
          <g opacity={clamp(lineOpacity)} fill={lineColor}>
            {wedges.map((p, i) => (
              <polygon key={i} points={p} />
            ))}
          </g>
        </Svg>
        {impact && label && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: fy - m * 0.42,
              textAlign: 'center',
              fontFamily: fonts.comic,
              fontSize: m * 0.26,
              lineHeight: 1,
              color: impactColors[1],
              WebkitTextStroke: `${10 * u}px ${dark}`,
              paintOrder: 'stroke fill',
              transform: `rotate(-6deg) scale(${frame === I ? 1.08 : 1})`,
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SpeedLines: React.FC<Props> = (p) => (p.mode === 'super' ? <SuperSplash {...p} /> : p.mode === 'carved' ? <CarvedBurst {...p} /> : <MangaLines {...p} />);

export const speedLines = defineMotion<Props>({
  id: 'speed-lines',
  title: 'Manga speed lines + impact frame',
  category: 'shape',
  description: 'Manga focus lines converge on a subject over a halftone comic backdrop, re-randomised every render frame on twos; at the hit the frame flips for two render frames into a yellow / violet two-tone impact print with a giant comic word, then red lines fade out and calm lines return.',
  source: ['video12 0:07.87-0:08.27 impact-frame (BONK) + radial-speed-lines', 'video12 1:03.1 CRASH', 'video17 0:28.15 impact-frame'],
  useFor: 'Hits, reveals, sudden realisations, "ATTENTION" moments, comic or anime-styled emphasis on any subject.',
  durationInFrames: 90,
  defaultProps: {
    background: '#C4489A',
    backgroundEdge: '#3A0B5C',
    color: '#FFFFFF',
    afterColor: '#E75855',
    count: 56,
    maxWidth: 18,
    innerRadius: [0.42, 0.3],
    focus: [0.5, 0.52],
    reseedEvery: 2,
    impactAt: 40,
    impactColors: ['#120222', '#F1D741'],
    label: 'BONK!',
    subject: 'ball',
    subjectColor: '#E57016',
    halftone: true,
    seed: 2,
    mode: 'manga',
    rayCount: 32,
    rayColors: ['#E05123', '#E7AA54'],
    rayTurn: 10,
    footnote: '',
    emitPoint: [0.5, 0.18],
    cubes: 8,
    labelColor: '#FFFFFF',
    carveInner: 0.1,
    carveOuter: 0.5,
    carveWidth: 10,
    carveBend: 0.25,
    revealFrames: 18,
    plateColor: '',
    plateAt: 24,
    withdrawAt: -1,
    carveBg: '#0B0907',
    carveInk: '#F4EFE6',
  },
  propDocs: {
    background: 'backdrop centre colour',
    backgroundEdge: 'backdrop edge colour (radial)',
    color: 'line colour before the impact / in the calm return',
    afterColor: 'line colour right after the impact (fades over ~4 render frames)',
    count: 'number of lines (40-70)',
    maxWidth: 'max wedge width at the outer edge in u',
    innerRadius: 'clear ellipse [rx, ry] around the focus as fractions of the short side',
    focus: '[x, y] focus point as fractions of the frame',
    reseedEvery: 'frames per redraw (2 = on twos boil)',
    impactAt: 'frame of the 2-render-frame impact (-1 = never)',
    impactColors: 'impact two-tone [dark, light] (yellow/violet, B/W, red/maroon…)',
    label: 'giant comic word shown during the impact frame',
    subject: "'ball' (toon ball at the focus) | 'none' (lines only)",
    halftone: 'comic halftone dot screen on the backdrop',
    seed: 'line randomness',
    mode: "manga (default focus lines + impact frame) | super (full-screen special-move cut-in: two-tone sunburst, halftone, sparkle with cubes, slammed move name in `label`) | carved (woodcut gouge-ray burst from `focus` on black)",
    rayCount: 'super / carved: number of rays (super 28-36, carved ~36)',
    rayColors: 'super: [dark ray, light ray] colours (orange #E05123/#E7AA54, blue #1D6FE0/#4FC1F6)',
    rayTurn: 'super: sunburst rotation in deg/s',
    footnote: "super: tiny italic footnote under the move name (e.g. '*allegedly')",
    emitPoint: 'super: [x,y] where the sparkle bursts and spits cubes',
    cubes: 'super: number of cubes the sparkle spits',
    labelColor: 'super: move-name fill colour',
    carveInner: 'carved: inner radius as a fraction of the short side',
    carveOuter: 'carved: outer radius as a fraction of the short side',
    carveWidth: 'carved: gouge width px at 1080p',
    carveBend: 'carved: ray bend (radians over its length)',
    revealFrames: 'carved: frames the burst takes to carve out from the centre',
    plateColor: "carved: colour plate (e.g. copper #C8703A) that floods the carved white; '' = none",
    plateAt: 'carved: frame the plate starts flooding in',
    withdrawAt: 'carved: frame the plate withdraws to a single highlight (-1 = never)',
    carveBg: 'carved: block colour (black wood)',
    carveInk: 'carved: colour of the carved rays',
  },
  component: SpeedLines,
  tags: ['manga', 'speed-lines', 'impact', 'comic', 'emphasis', 'anime', 'on-twos', 'sunburst', 'super move', 'special move', 'cut-in', 'level up', 'woodcut', 'carved', 'light burst', 'rays'],
});
