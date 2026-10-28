// Technique after mg-styles-15/demos/03-isometric/js/title.js + title5.js (MIT, © Vincentwei1021)
// — see THIRD_PARTY_NOTICES.md. Own SVG implementation (iso-skewed text + stacked-offset extrusion).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {ISO, clamp01, inv, mg1Fonts, mixHex, E} from '../../core/r2-mg1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  text: string;
  tagline: string;
  stats: string;
  plane: 'right' | 'left';
  background: string[];
  color: string;
  sideColor: string;
  accent: string;
  depth: number;
  stagger: number;
  startAt: number;
  grid: boolean;
  ping: boolean;
};

let measureCtx: CanvasRenderingContext2D | null = null;
const measure = (s: string, font: string) => {
  if (typeof document === 'undefined') return s.length * 0.75;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  if (!measureCtx) return s.length * 0.75;
  measureCtx.font = font;
  return measureCtx.measureText(s).width;
};

const IsoGroundTitle: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const portrait = h > w;
  const text = p.text || 'NORTHWIND';
  const fam = mg1Fonts.wide;
  // plane matrix: text x -> along an iso floor axis, text y (down) -> the other floor axis
  const C = Math.cos(Math.PI / 6);
  const S = 0.5;
  const M = p.plane === 'right' ? [C, -S, C, S] : [C, S, -C, S];
  // letter metrics in a 100 px reference size
  const ref = 100;
  const font = `800 ${ref}px ${fam}`;
  const adv = [...text].map((ch) => measure(ch, font) + ref * 0.04);
  const totalRef = adv.reduce((a, b) => a + b, 0);
  // fit: horizontal extent = C * L, vertical extent = S * L + extras
  const maxW = w * (portrait ? 0.86 : 0.74);
  const maxH = h * (portrait ? 0.4 : 0.6);
  const k = Math.min(maxW / (C * totalRef + ref * 1.2), maxH / (S * totalRef + ref * 1.6));
  const size = ref * k;
  const L = totalRef * k;
  // centre of the title block on screen
  const ox = w / 2 - (M[0] * L) / 2 - (M[2] * size * 0.9) / 2;
  const oy = h / 2 - (M[1] * L) / 2 - (M[3] * size * 0.9) / 2 + (p.plane === 'right' ? 0 : -h * 0.02);
  const depth = p.depth * size * 0.012;
  const layers = Math.max(4, Math.round(p.depth));
  const stepF = Math.max(1, p.stagger);

  const letters: React.ReactNode[] = [];
  let acc = 0;
  [...text].forEach((ch, i) => {
    const x0 = acc;
    acc += adv[i] * k;
    if (ch === ' ') return;
    const t0 = p.startAt + i * stepF;
    const fall = 9;
    const lf = frame - t0;
    if (lf < 0) return;
    const q = clamp01(lf / fall);
    let lift = 0;
    let lean = 0;
    let sq = 1;
    if (lf < fall) {
      lift = 1 - q * q;
      lean = 14 * (1 - q);
    } else {
      const t2 = (lf - fall) / 30;
      lift = t2 < 0.16 ? 0.05 * 4 * (t2 / 0.16) * (1 - t2 / 0.16) : 0;
      lean = -6 * Math.exp(-t2 / 0.08) * Math.cos(t2 * 30);
      sq = 1 - 0.25 * Math.exp(-t2 / 0.05) * Math.cos(t2 * 40);
    }
    const H0 = h * 0.55;
    const op = clamp01(lf / 3);
    // base point of this letter on the plane
    const bx = x0;
    const by = size * 0.9; // baseline (text-space y)
    const sx = ox + M[0] * bx + M[2] * by;
    const sy = oy + M[1] * bx + M[3] * by;
    const plane = `matrix(${M[0]} ${M[1]} ${M[2]} ${M[3]} 0 0)`;
    const glyph = (fill: string, key: string, dy: number, stroke?: string) => (
      <text key={key} x={0} y={0} transform={`translate(0 ${dy}) ${plane}`} fontFamily={fam} fontWeight={800} fontSize={size} fill={fill} stroke={stroke} strokeWidth={stroke ? size * 0.012 : 0}>
        {ch}
      </text>
    );
    const ext = depth * sq;
    const stack: React.ReactNode[] = [];
    for (let l = 0; l < layers; l++) stack.push(glyph(mixHex(p.sideColor, p.color, (l / layers) * 0.55), 'l' + l, -(ext * l) / layers));
    stack.push(glyph(p.color, 'top', -ext, mixHex(p.color, '#ffffff', 0.25)));
    // contact shadow on the floor (soft, dark lilac 30 %)
    const shOp = 0.3 * (lf < fall ? q * q : 1);
    letters.push(
      <g key={i}>
        <g transform={`translate(${sx} ${sy})`} opacity={shOp}>
          <text x={0} y={0} transform={`translate(${size * 0.05} ${size * 0.03}) ${plane}`} fontFamily={fam} fontWeight={800} fontSize={size} fill="#4A3F94" filter="url(#mg1-igt-blur)">
            {ch}
          </text>
        </g>
        <g transform={`translate(${sx} ${sy - lift * H0}) rotate(${lean * (p.plane === 'right' ? 1 : -1)})`} opacity={op}>
          {/* rotate the plane glyph so its baseline origin stays at the letter's own base point */}
          <g transform={`translate(${-sx + sx} 0)`}>{stack}</g>
        </g>
      </g>,
    );
  });

  const lastF = p.startAt + text.length * stepF + 9;
  const tagP = clamp01(inv(lastF + 2, lastF + 14, frame));
  const statP = clamp01(inv(lastF + 8, lastF + 26, frame));
  const ruleP = E.out3(clamp01(inv(lastF - 4, lastF + 12, frame)));
  const plane = `matrix(${M[0]} ${M[1]} ${M[2]} ${M[3]} 0 0)`;
  const sub = (y: number, child: React.ReactNode) => <g transform={`translate(${ox + M[2] * y} ${oy + M[3] * y}) ${plane}`}>{child}</g>;
  const tagSize = size * 0.32;
  const statSize = size * 0.2;
  const nTag = Math.round(p.tagline.length * tagP);
  const nStat = Math.round(p.stats.length * statP);
  // floor ping (cyan ring) under the first letter, at the end
  const pingT = (frame - (lastF + 20)) / 30;
  const bg = p.background;
  const gridOp = p.grid ? 0.35 * clamp01(frame / 15) : 0;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${bg[0]} 0%, ${bg[1] ?? bg[0]} 55%, ${bg[2] ?? bg[1] ?? bg[0]} 100%)`}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="mg1-igt-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={size * 0.05} />
          </filter>
          <pattern id="mg1-igt-grid" width={64 * u} height={64 * u} patternUnits="userSpaceOnUse" patternTransform={`matrix(${C} ${-S} ${C} ${S} ${w / 2} ${h / 2})`}>
            <path d={`M0 0H${64 * u}M0 0V${64 * u}`} stroke="#ffffff" strokeWidth={1.2 * u} fill="none" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#mg1-igt-grid)" opacity={gridOp} />
        {sub(
          size * 1.12,
          <line x1={-size * 0.1} y1={0} x2={-size * 0.1 + (L + size * 0.6) * ruleP} y2={0} stroke={p.sideColor} strokeWidth={2 * u} opacity={0.75} />,
        )}
        {letters}
        {sub(
          size * 1.12 + tagSize * 1.25,
          <text x={0} y={0} fontFamily={mg1Fonts.wide} fontWeight={700} fontSize={tagSize} fill={p.sideColor} letterSpacing={tagSize * 0.04}>
            {p.tagline.slice(0, nTag)}
          </text>,
        )}
        {sub(
          size * 1.12 + tagSize * 1.25 + statSize * 1.9,
          <g>
            <circle cx={-statSize * 0.2} cy={-statSize * 0.35} r={statSize * 0.32} fill={p.accent} opacity={statP > 0 ? 1 : 0} />
            <text x={statSize * 0.5} y={0} fontFamily={fonts.mono} fontWeight={400} fontSize={statSize} fill={p.sideColor} letterSpacing={statSize * 0.3} opacity={0.85}>
              {p.stats.slice(0, nStat)}
            </text>
          </g>,
        )}
        {p.ping &&
          pingT > 0 &&
          [0, 0.35].map((d, i) => {
            const tt = pingT - d;
            if (tt < 0 || tt > 1.2) return null;
            const r = size * (0.4 + tt * 2.2);
            return sub(
              size * 0.45,
              <circle key={i} cx={size * 0.3} cy={0} r={r} fill="none" stroke={p.accent} strokeWidth={3 * u} opacity={(1 - tt / 1.2) * 0.8} />,
            );
          })}
      </svg>
    </AbsoluteFill>
  );
};

export const isoGroundTitle = defineMotion<Props>({
  id: 'iso-ground-title',
  title: 'Iso ground title',
  category: 'text',
  description:
    'A bold extruded wordmark that belongs to an isometric world: letters drop one by one onto the iso floor plane (16th-note stagger) with a contact shadow, a small bounce and a lean, a hairline rule draws under them, a tagline and a mono stats line type on flat on the plane, and a cyan floor ping closes it.',
  source: ['mg-styles-15 03-isometric 8.4-9.2 s, title.js / title5.js (MIT, Vincentwei1021) — technique after mg-styles-15'],
  useFor: 'Titles and end cards for iso dioramas, maps and product worlds; pair with iso-city-build after its pull-back.',
  durationInFrames: 120,
  defaultProps: {
    text: 'NORTHWIND',
    tagline: 'a city that grows itself',
    stats: 'CITY OS · 144 TILES · ONLINE',
    plane: 'right',
    background: ['#E6E0FB', '#CFC5F4', '#B6A8EC'],
    color: '#2C2960',
    sideColor: '#1C1946',
    accent: '#62F0F2',
    depth: 12,
    stagger: 2,
    startAt: 6,
    grid: true,
    ping: true,
  },
  propDocs: {
    text: 'the wordmark (short, caps reads best)',
    tagline: 'line set flat on the plane under the title',
    stats: 'mono stats line',
    plane: "'right' reads up-right along one iso axis, 'left' reads down-right along the other",
    background: 'background gradient stops',
    color: 'letter top colour',
    sideColor: 'extrusion / text colour',
    accent: 'dot and floor ping colour',
    depth: 'extrusion layers (thickness)',
    stagger: 'frames between letters (2 = 16ths at 120 bpm)',
    startAt: 'frame of the first letter drop',
    grid: 'faint iso floor grid',
    ping: 'cyan floor ping at the end',
  },
  component: IsoGroundTitle,
  tags: ['title', 'isometric', 'iso', 'extruded', '3d type', 'wordmark', 'drop', 'bounce', 'floor', 'plane', 'logo', 'end card', 'tagline', 'mg-styles-15', 'iso-diorama'],
});
