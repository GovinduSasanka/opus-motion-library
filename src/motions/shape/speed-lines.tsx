import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
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
};

const SpeedLines: React.FC<Props> = ({background, backgroundEdge, color, afterColor, count, maxWidth, innerRadius, focus, reseedEvery, impactAt, impactColors, label, subject, subjectColor, halftone, seed}) => {
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
  },
  component: SpeedLines,
  tags: ['manga', 'speed-lines', 'impact', 'comic', 'emphasis', 'anime', 'on-twos'],
});
