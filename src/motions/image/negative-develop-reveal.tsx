// Adapted from lemo-opuscar/styles/archive-lighttable/demo/film.js negative() + develop front (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {Plate, PlatePaletteName, useSafeId} from '../../core/image-kit';
import {LightTable, eio3, lf, seg, toRgb} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A photograph lies on a backlit light table as a warm amber glass negative
 * (T = 0.035 + 0.9·(1 − L)^1.25, tinted 0.98/0.93/0.84). A circular develop front with a thin orange edge
 * spreads from one point and turns it positive (silver-gelatin greys, or colour).
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  origin: number[];
  developAt: number;
  developFrames: number;
  mode: 'fullframe' | 'lens';
  mono: boolean;
  tint: string;
  edgeColor: string;
  label: string;
  table: string;
  desk: string;
};

const NegativeDevelop: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('negdev');
  // plate box
  const bw = portrait ? w * 0.86 : Math.min(w * 0.74, h * 1.2);
  const bh = portrait ? Math.min(h * 0.62, bw * 1.25) : h * 0.72;
  const bx = (w - bw) / 2;
  const by = (h - bh) / 2 - (portrait ? h * 0.02 : h * 0.02);
  // camera: settle then slow push
  const Z = lerp(1.05, 1, prog(frame, 0, 30, ease.out)) * lerp(1, 1.045, prog(frame, p.developAt, p.developAt + 120, ease.sine));
  const ox = bx + bw * p.origin[0];
  const oy = by + bh * p.origin[1];
  const far = Math.max(Math.hypot(ox - bx, oy - by), Math.hypot(ox - bx - bw, oy - by), Math.hypot(ox - bx, oy - by - bh), Math.hypot(ox - bx - bw, oy - by - bh));
  const lensR = Math.min(bw, bh) * 0.32;
  const Rmax = p.mode === 'lens' ? lensR : far * 1.18;
  const dev = eio3(seg(frame, p.developAt, p.developAt + p.developFrames));
  const R = Rmax * dev;
  const feather = 0.14 * Math.max(R, 1);
  const [tr, tg, tb] = toRgb(p.tint).map((v) => v / 255);
  const [er, eg, eb] = toRgb(p.edgeColor);
  const ping = clamp((frame - (p.developAt - 14)) / 14);
  const lensIn = prog(frame, p.developAt - 16, p.developAt - 4, ease.out);
  const labelIn = prog(frame, p.developAt + p.developFrames + 6, p.developAt + p.developFrames + 22, ease.out);
  const mask = `radial-gradient(circle at ${ox - bx}px ${oy - by}px, #000 ${Math.max(0, R - feather)}px, transparent ${Math.max(0.5, R)}px)`;
  const edgeW = Math.max(2, 0.022 * Rmax);

  return (
    <AbsoluteFill style={{background: p.desk}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={`${id}-neg`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="-0.2126 -0.7152 -0.0722 0 1  -0.2126 -0.7152 -0.0722 0 1  -0.2126 -0.7152 -0.0722 0 1  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="gamma" amplitude={0.9 * tr} exponent={1.25} offset={0.035} />
            <feFuncG type="gamma" amplitude={0.9 * tg} exponent={1.25} offset={0.033} />
            <feFuncB type="gamma" amplitude={0.9 * tb} exponent={1.25} offset={0.03} />
          </feComponentTransfer>
        </filter>
        <filter id={`${id}-pos`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.043 0.12 0.36 0.66 0.88 0.988" />
            <feFuncG type="table" tableValues="0.04 0.115 0.35 0.65 0.87 0.98" />
            <feFuncB type="table" tableValues="0.035 0.105 0.33 0.62 0.85 0.96" />
          </feComponentTransfer>
        </filter>
      </svg>
      <AbsoluteFill style={{transform: `scale(${Z})`, transformOrigin: `${ox}px ${oy}px`}}>
        <Svg>
          <LightTable id={id} w={w} h={h} u={u} table={p.table} desk={p.desk} />
          {/* shadow-free glass edge: slightly larger clear glass with a bevel */}
          <rect x={bx - 26 * u} y={by - 26 * u} width={bw + 52 * u} height={bh + 52 * u} fill="#e9eef1" stroke="#b9c2c8" strokeWidth={1.5 * u} />
          <rect x={bx - 26 * u} y={by - 26 * u} width={bw + 52 * u} height={bh + 52 * u} fill="none" stroke="#ffffff" strokeOpacity={0.8} strokeWidth={4 * u} transform={`translate(${-2 * u} ${-2 * u})`} />
        </Svg>
        {/* negative */}
        <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, overflow: 'hidden', filter: `url(#${id}-neg)`}}>
          <Plate src={p.src || undefined} seed={p.seed} palette={p.palette} width={bw} height={bh} />
        </div>
        {/* positive, revealed by the develop front */}
        <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, overflow: 'hidden', WebkitMaskImage: mask, maskImage: mask, filter: p.mono ? `url(#${id}-pos)` : 'contrast(1.04) saturate(0.95)'}}>
          <Plate src={p.src || undefined} seed={p.seed} palette={p.palette} width={bw} height={bh} />
        </div>
        <Svg>
          <defs>
            <filter id={`${id}-eb`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={edgeW * 0.9} />
            </filter>
            <clipPath id={`${id}-pc`}>
              <rect x={bx} y={by} width={bw} height={bh} />
            </clipPath>
          </defs>
          {/* warm Gaussian ring riding the front */}
          {dev > 0 && dev < 1 && (
            <g clipPath={`url(#${id}-pc)`} style={{mixBlendMode: 'screen'}}>
              <circle cx={ox} cy={oy} r={R - feather * 0.35} fill="none" stroke={`rgb(${er},${eg},${eb})`} strokeOpacity={0.85} strokeWidth={edgeW * 2.2} filter={`url(#${id}-eb)`} />
              <circle cx={ox} cy={oy} r={R - feather * 0.35} fill="none" stroke="#fff3e6" strokeOpacity={0.5} strokeWidth={edgeW * 0.35} />
            </g>
          )}
          {/* origin ping before the front starts */}
          {ping > 0 && ping < 1 && <circle cx={ox} cy={oy} r={(8 + 40 * ping) * u} fill="none" stroke={p.edgeColor} strokeWidth={3 * u} opacity={1 - ping} />}
          {/* emulsion margin + chipped corner */}
          <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke="#1e1d1a" strokeOpacity={0.55} strokeWidth={5 * u} />
          <path d={`M${bx + bw - 70 * u} ${by - 1} L${bx + bw + 1} ${by - 1} L${bx + bw + 1} ${by + 46 * u} Z`} fill={p.table} />
          {p.mode === 'lens' && lensIn > 0 && (
            <g opacity={lensIn} transform={`translate(${ox} ${oy}) scale(${lerp(1.35, 1, lensIn)}) translate(${-ox} ${-oy})`}>
              <circle cx={ox} cy={oy} r={lensR * 1.03} fill="none" stroke="#0b0c0d" strokeWidth={lensR * 0.065} />
              <circle cx={ox} cy={oy} r={lensR * 1.3} fill="none" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={lensR * 0.04} />
            </g>
          )}
          {p.label && (
            <g opacity={labelIn} transform={`translate(0 ${(1 - labelIn) * 10 * u})`}>
              <rect x={bx} y={by + bh + 44 * u} width={7 * u} height={34 * u} fill={p.edgeColor} />
              <text x={bx + 22 * u} y={by + bh + 72 * u} fontFamily={lf.plex} fontSize={28 * u} fill="#15171A" letterSpacing={2 * u}>
                {p.label}
              </text>
            </g>
          )}
        </Svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const negativeDevelopReveal = defineMotion<Props>({
  id: 'negative-develop-reveal',
  title: 'Negative develop reveal',
  category: 'image',
  description:
    'A photo lies on a backlit light table as a warm amber glass negative; a circular develop front with a thin orange edge spreads from one point and turns it into a silver-gelatin (or colour) positive.',
  source: ['lemo-opuscar styles/archive-lighttable demo/film.js negative() + lens develop front (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §1 negative-develop-reveal'],
  useFor: 'Before/after reveals: archive photos, "the real picture" moments, X-ray → product, a teaser image coming into view.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 4,
    palette: 'dusk',
    origin: [0.62, 0.42],
    developAt: 34,
    developFrames: 30,
    mode: 'fullframe',
    mono: true,
    tint: '#FAEDD6',
    edgeColor: '#FF9E5C',
    label: 'PLATE 07 · GLASS NEGATIVE',
    table: '#F7F9FB',
    desk: '#0E0F11',
  },
  propDocs: {
    src: 'public/ image to develop (empty = procedural city plate)',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette (dusk / night / dawn)',
    origin: '[x, y] 0..1 inside the photo where the develop front starts',
    developAt: 'frame the front starts',
    developFrames: 'front duration (24 = the source 0.8 s)',
    mode: 'fullframe = the whole plate develops; lens = only a loupe-sized disc develops',
    mono: 'true = silver-gelatin greys (archive), false = keep the colour of the photo',
    tint: 'negative glass tint (multiplier colour; default ≈ 0.98/0.93/0.84)',
    edgeColor: 'colour of the warm ring riding the front',
    label: 'mono caption under the plate (empty = none)',
    table: 'light-table colour',
    desk: 'desk colour',
  },
  component: NegativeDevelop,
  tags: ['negative', 'develop', 'reveal', 'before after', 'archive', 'photo', 'glass plate', 'light table', 'darkroom', 'invert', 'film', 'evidence', 'history', 'documentary', 'transition'],
});
