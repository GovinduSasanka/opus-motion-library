import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {ProductArt} from '../../core/product-kit';
import {backOut, easeIO, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Colourway swap: the product (a photo through a luminance tint, or the procedural speaker) cycles through a list of
 * colourways while a backdrop disc, the name and a row of swatch chips follow; the active chip grows a ring.
 */
type Colorway = {name: string; color: string};
type Props = {
  title: string;
  colorways: Colorway[];
  src: string;
  background: string;
  ink: string;
  accent: string;
  hold: number;
  swap: number;
  startAt: number;
};

const ColorwaySwap: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('cws');
  const cws = (p.colorways || []).filter((c) => c && c.color).slice(0, 8);
  const n = Math.max(1, cws.length);
  const per = p.hold + p.swap;
  const f = Math.max(0, frame - p.startAt);
  const idx = Math.min(n - 1, Math.floor(f / per));
  const within = f - idx * per;
  const sw = idx < n - 1 ? easeIO(sseg(within, p.hold, per)) : 0;
  const cur = cws[idx]?.color ?? p.accent;
  const nxt = cws[Math.min(n - 1, idx + 1)]?.color ?? cur;
  const colour = mixHex(cur, nxt, sw);
  const activeIdx = sw > 0.5 ? idx + 1 : idx;
  const name = cws[Math.min(n - 1, activeIdx)]?.name ?? '';
  const enter = easeOut3(sseg(frame, 0, 24));
  const s = portrait ? w * 0.6 : Math.min(h * 0.46, w * 0.28);
  const cx = w / 2;
  const cy = portrait ? h * 0.42 : h * 0.5;
  const bump = 1 + 0.045 * Math.sin(Math.PI * sw);
  const chipR = (portrait ? 30 : 28) * u;
  const gap = chipR * 2.9;
  const rowW = (n - 1) * gap;
  const rowY = portrait ? cy + s * 0.66 + 150 * u : h * 0.9;
  const nameFs = (portrait ? 56 : 46) * u;
  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? undefined : p.background}}>
      <Svg>
        <defs>
          <radialGradient id={`${uid}-d`} cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor={mixHex(colour, '#ffffff', 0.35)} />
            <stop offset="1" stopColor={colour} />
          </radialGradient>
        </defs>
        {p.title ? (
          <text x={cx} y={portrait ? h * 0.085 : h * 0.12} textAnchor="middle" fontFamily={fonts.grotesk} fontWeight={700} fontSize={(portrait ? 62 : 54) * u} fill={p.ink} opacity={enter}>
            {p.title}
          </text>
        ) : null}
        <circle cx={cx} cy={cy} r={s * 0.6 * enter} fill={`url(#${uid}-d)`} opacity={0.3} />
        <circle cx={cx} cy={cy} r={s * 0.6 * enter} fill="none" stroke={colour} strokeWidth={3 * u} opacity={0.7} />
        <ellipse cx={cx} cy={cy + s * 0.46} rx={s * 0.3} ry={s * 0.04} fill="#000" opacity={0.22 * enter} />
        <g transform={`translate(${cx} ${cy}) scale(${(0.9 + 0.1 * enter) * bump})`} opacity={enter}>
          <ProductArt uid={uid} s={s} body={colour} accent={mixHex(colour, '#ffffff', 0.8)} src={p.src} tint={p.src ? colour : null} />
        </g>
        <text x={cx} y={rowY - chipR - 36 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={nameFs} fill={p.ink} opacity={enter}>
          {name}
        </text>
        {cws.map((c, i) => {
          const x = cx - rowW / 2 + i * gap;
          const pop = backOut(sseg(frame, 10 + i * 4, 24 + i * 4));
          const active = i === activeIdx ? 1 : 0;
          return (
            <g key={i} transform={`translate(${x} ${rowY}) scale(${Math.max(0.001, pop) * (1 + 0.12 * active)})`}>
              <circle r={chipR + 9 * u} fill="none" stroke={p.accent} strokeWidth={3.5 * u} opacity={active} />
              <circle r={chipR} fill={c.color} stroke={withAlpha(p.ink, 0.25)} strokeWidth={2 * u} />
              <ellipse cx={-chipR * 0.3} cy={-chipR * 0.35} rx={chipR * 0.4} ry={chipR * 0.22} fill="#fff" opacity={0.28} />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const colorwaySwap = defineMotion<Props>({
  id: 'colorway-swap',
  title: 'Colourway swap',
  category: 'product',
  description:
    'A product cycles through a list of colourways: the image is recoloured (luminance tint, or the procedural speaker repaints), the backdrop disc and name follow, and a row of swatch chips highlights the active one.',
  source: ['original (round 3)'],
  useFor: 'Colour options for any product — phones, shoes, bottles, cars, apparel; pass your product image and a `colorways` list.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Pick your colour',
    colorways: [
      {name: 'Midnight', color: '#2B2E3B'},
      {name: 'Coral', color: '#FF6A55'},
      {name: 'Lagoon', color: '#2FA7A0'},
      {name: 'Sand', color: '#D9C7A3'},
    ],
    src: '',
    background: '#F3EFE7',
    ink: '#1B1B22',
    accent: '#1B1B22',
    hold: 34,
    swap: 14,
    startAt: 16,
  },
  propDocs: {
    title: 'heading at the top (empty hides it)',
    colorways: 'array of {name, color} (up to 8)',
    src: 'product image (public/ path or URL), tinted per colourway; empty draws a neutral speaker',
    background: "backdrop colour or 'transparent'",
    ink: 'text colour',
    accent: 'active-swatch ring colour',
    hold: 'frames each colourway is held',
    swap: 'frames the colour blend takes',
    startAt: 'frame the cycle starts',
  },
  component: ColorwaySwap,
  tags: ['colorway', 'colour', 'color', 'variants', 'swatch', 'product', 'options', 'recolor', 'ecommerce', 'configurator'],
});
