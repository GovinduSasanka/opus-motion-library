// Adapted from lemo-opuscar/styles/cel-anime-80s/demo/cel.js cel() / crescent() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {CelShape} from '../../core/r2-la1-kit';
import {mixHex, s1f, sseg, easeOut3, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Instant 80s-anime cel look for any closed SVG shape: flat fill, a hard shadow crescent on the far side, a hard
 * highlight crescent toward the light, a saturated neon rim and a coloured (never black) outline. Crescents are the
 * shape minus a translated copy of itself, so no boolean ops are needed. The demo builds three shapes up step by step
 * (fill, shadow, highlight, rim, line) and then swings the light around, re-cutting the crescents on twos.
 */
type Props = {
  colors: string[];
  rim: string;
  light: number;
  swing: number;
  shadeOff: number;
  hiOff: number;
  rimOff: number;
  lineW: number;
  closeUp: boolean;
  labels: boolean;
  background: string;
  bottom: string;
};

const roundedPoly = (pts: [number, number][]) => {
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = mid(pts[(i + n - 1) % n], p);
    const b = mid(p, pts[(i + 1) % n]);
    d += (i === 0 ? `M${a[0].toFixed(2)} ${a[1].toFixed(2)}` : `L${a[0].toFixed(2)} ${a[1].toFixed(2)}`) + `Q${p[0].toFixed(2)} ${p[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  }
  return d + 'Z';
};
const STAR = roundedPoly(Array.from({length: 10}, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  const r = i % 2 ? 50 : 104;
  return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
}));
const BEAN = roundedPoly(Array.from({length: 14}, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  const r = 88 + 16 * Math.sin(a * 2 + 0.8) + 10 * Math.cos(a * 3);
  return [Math.cos(a) * r * 1.08, Math.sin(a) * r * 0.9] as [number, number];
}));
const ORB = 'M-92 0A92 92 0 1 0 92 0A92 92 0 1 0 -92 0Z';
const SHAPES = [ORB, STAR, BEAN];
const NAMES = ['FILL', 'SHADOW', 'HIGHLIGHT', 'RIM', 'LINE'];

const CelShadeCrescent: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('celc');
  const size = portrait ? Math.min(w * 0.58, h * 0.2) : Math.min(w * 0.28, h * 0.56);
  const sc = size / 200;
  const pos: [number, number][] = portrait
    ? [[w / 2, h * 0.22], [w / 2, h * 0.47], [w / 2, h * 0.72]]
    : [[w * 0.2, h * 0.46], [w * 0.5, h * 0.46], [w * 0.8, h * 0.46]];
  // light: re-cut on twos once the build is finished
  const fl = Math.floor(frame / 2) * 2;
  const ang = ((p.light + p.swing * Math.sin(Math.max(0, fl - 92) * 0.045)) * Math.PI) / 180;
  const light: [number, number] = [Math.cos(ang), Math.sin(ang)];
  const lineK = p.closeUp ? 0.55 : 1;
  const step = frame < 20 ? 0 : frame < 40 ? 1 : frame < 54 ? 2 : frame < 66 ? 3 : 4;
  const ox = w * 0.5;
  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.background} />
            <stop offset="1" stopColor={mixHex(p.background, '#3A2F4D', 0.8)} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}-bg)`} />
        {SHAPES.map((d, i) => {
          const t0 = i * 7;
          const enter = easeOut3(sseg(frame, t0, t0 + 14));
          const sh = easeOut3(sseg(frame, 20 + t0, 38 + t0));
          const hi = easeOut3(sseg(frame, 40 + t0, 52 + t0));
          const rim = easeOut3(sseg(frame, 54 + t0, 64 + t0));
          const ln = easeOut3(sseg(frame, 66 + t0, 76 + t0));
          const fill = p.colors[i % p.colors.length];
          const bob = Math.sin(frame * 0.045 + i * 1.6) * 5 * u * clamp(sseg(frame, 76, 100));
          return (
            <g key={i} transform={`translate(${pos[i][0]} ${pos[i][1] + bob}) scale(${sc * (0.6 + 0.4 * enter)})`} opacity={enter}>
              <CelShape
                id={`${uid}-s${i}`}
                d={d}
                fill={fill}
                shade={mixHex(fill, '#2a1840', 0.42)}
                hi={mixHex(fill, '#ffffff', 0.5)}
                rim={p.rim}
                line={mixHex(fill, '#1a0c24', 0.66)}
                light={light}
                shadeOff={p.shadeOff * sh}
                hiOff={p.hiOff * hi}
                rimOff={p.rimOff * rim}
                lineW={p.lineW * lineK * ln}
              />
            </g>
          );
        })}
        {/* light-source marker */}
        {frame > 90 && (
          <g opacity={clamp(sseg(frame, 90, 104))} transform={`translate(${ox} ${portrait ? h * 0.09 : h * 0.14})`}>
            <circle r={26 * u} fill="none" stroke={withAlpha('#FFF0A0', 0.45)} strokeWidth={2 * u} />
            <circle cx={light[0] * 26 * u} cy={light[1] * 26 * u} r={8 * u} fill="#FFF0A0" />
            <circle cx={light[0] * 26 * u} cy={light[1] * 26 * u} r={14 * u} fill="none" stroke="#FFF0A0" strokeWidth={1.5 * u} opacity={0.6} />
          </g>
        )}
        {p.labels && (
          <g transform={`translate(${w / 2} ${h - (portrait ? 0.07 : 0.1) * h})`}>
            {NAMES.map((n, i) => {
              const gap = Math.min(w * 0.17, 190 * u);
              const x = (i - 2) * gap;
              const on = frame >= 20 + (i === 0 ? -20 : 0) && step >= i;
              const cur = step === i;
              return (
                <g key={n} transform={`translate(${x} 0)`} opacity={on || frame >= 76 ? 1 : 0.25}>
                  <rect x={-gap * 0.44} y={-18 * u} width={gap * 0.88} height={36 * u} rx={18 * u} fill={cur ? '#FFF0A0' : 'rgba(255,255,255,0.08)'} />
                  <text textAnchor="middle" y={7 * u} fontFamily={s1f.barlow} fontWeight={600} fontSize={Math.min(22 * u, gap * 0.16)} letterSpacing={2 * u} fill={cur ? '#1a1020' : '#d8cfe8'}>
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {p.bottom && (
          <text x={w / 2} y={h * (portrait ? 0.955 : 0.965)} textAnchor="middle" fontFamily={s1f.barlow} fontWeight={600} fontSize={Math.min(22 * u, w * 0.04)} letterSpacing={4 * u} fill="#8F7FB0">
            {p.bottom}
          </text>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const celShadeCrescent = defineMotion<Props>({
  id: 'cel-shade-crescent',
  title: 'Cel shade crescent',
  category: 'shape',
  description:
    'Flat shapes become 80s anime cels: a hard shadow crescent, a hard highlight crescent, a saturated neon rim and a coloured outline are built up step by step, then the light swings round and the crescents re-cut.',
  source: ['lemo-opuscar styles/cel-anime-80s/demo/cel.js (MIT, LemoLab)'],
  useFor:
    'Show or demo the cel-shading primitive; copy the CelShape recipe (clipPath + shape-minus-translated-copy) to give any flat character or prop an anime look with one prop.',
  durationInFrames: 150,
  defaultProps: {
    colors: ['#2F6FE2', '#FF6B6B', '#8D5BFF'],
    rim: '#FF3FA4',
    light: 233,
    swing: 70,
    shadeOff: 14,
    hiOff: 6,
    rimOff: 4.5,
    lineW: 3.4,
    closeUp: false,
    labels: true,
    background: '#130D1F',
    bottom: 'FLAT FILL + SHADOW + HIGHLIGHT + RIM + COLOURED LINE',
  },
  propDocs: {
    colors: 'fill colours of the three demo shapes (shade/highlight/line are derived from each fill)',
    rim: 'saturated rim-light colour on the shadow edge',
    light: 'light direction in degrees (0 = from the right, 90 = from below, 233 = upper-left)',
    swing: 'degrees the light swings back and forth after the build',
    shadeOff: 'shadow crescent offset in shape units (shape is about 200 wide)',
    hiOff: 'highlight crescent offset',
    rimOff: 'rim offset',
    lineW: 'outline width',
    closeUp: 'true = outline x0.55 as for extreme close-ups',
    labels: 'show the five step chips',
    background: 'backdrop colour',
    bottom: 'caption line at the bottom (empty = none)',
  },
  component: CelShadeCrescent,
  tags: ['cel', 'anime', '80s', 'shading', 'crescent', 'rim light', 'outline', 'toon', 'shape', 'flat', 'neon', 'character look', 'utility'],
});
