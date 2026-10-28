import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {ProductArt} from '../../core/product-kit';
import {backOut, easeIO, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Unboxing: a packaging box shakes, the lid lifts and tilts away, light pours out and the product rises from the box
 * (the box front covers its lower half), then title and subtitle settle in below.
 */
type Props = {
  title: string;
  subtitle: string;
  boxLabel: string;
  src: string;
  background: string;
  ink: string;
  box: string;
  accent: string;
  productColor: string;
  startAt: number;
  speed: number;
};

const UnboxLidLift: React.FC<Props> = (p) => {
  const frame = useCurrentFrame() * p.speed;
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('ulf');
  const t = frame - p.startAt;
  const bw = portrait ? w * 0.66 : Math.min(h * 0.44, w * 0.26);
  const bh = bw * 0.5;
  const lh = bw * 0.15;
  const cx = w / 2;
  const boxTop = portrait ? h * 0.57 : h * 0.6;
  const enter = easeOut3(sseg(frame, 0, 22));
  const shake = t > 18 && t < 38 ? Math.sin(t * 2.4) * 5 * u * (1 - (t - 18) / 20) : 0;
  const lift = easeIO(sseg(t, 38, 78));
  const away = easeIO(sseg(t, 70, 104));
  const lidY = -lift * bw * 0.42 - away * bw * 0.12;
  const lidX = away * bw * (portrait ? 0.55 : 1.0);
  const lidRot = lift * -5 + away * 24;
  const rise = easeOut3(sseg(t, 52, 108));
  const ps = bw * 0.95;
  const prodY = boxTop + bh * 0.25 - rise * (ps * 0.52 + bh * 0.25) - Math.sin(t * 0.06) * 4 * u * rise;
  const glow = sseg(t, 40, 90);
  const wob = backOut(sseg(t, 92, 112), 1.8);
  const text = easeOut3(sseg(t, 100, 124));
  const text2 = easeOut3(sseg(t, 112, 136));
  const bodyTop = mixHex(p.box, '#000000', 0.12);
  const inner = mixHex(p.box, '#000000', 0.55);
  const lidFill = mixHex(p.box, '#ffffff', 0.1);
  const boxY = (1 - enter) * 60 * u;
  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? undefined : p.background}}>
      <Svg>
        <defs>
          <radialGradient id={`${uid}-gl`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={withAlpha(p.accent, 0.75)} />
            <stop offset="0.5" stopColor={withAlpha(p.accent, 0.22)} />
            <stop offset="1" stopColor={withAlpha(p.accent, 0)} />
          </radialGradient>
          <linearGradient id={`${uid}-ray`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={withAlpha('#ffffff', 0.55)} />
            <stop offset="1" stopColor={withAlpha('#ffffff', 0)} />
          </linearGradient>
          <linearGradient id={`${uid}-bf`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={mixHex(p.box, '#ffffff', 0.08)} />
            <stop offset="1" stopColor={mixHex(p.box, '#000000', 0.18)} />
          </linearGradient>
        </defs>
        <g transform={`translate(${shake} ${boxY})`} opacity={enter}>
          {/* light */}
          <ellipse cx={cx} cy={boxTop - bw * 0.3} rx={bw * 1.1} ry={bw * 0.9} fill={`url(#${uid}-gl)`} opacity={glow} />
          <g opacity={glow * 0.8}>
            {[-28, -14, 0, 14, 28].map((a, i) => (
              <polygon
                key={i}
                points={`${cx - 8 * u},${boxTop} ${cx + 8 * u},${boxTop} ${cx + Math.tan((a * Math.PI) / 180) * bw * 1.5 + 36 * u},${boxTop - bw * 1.5} ${cx + Math.tan((a * Math.PI) / 180) * bw * 1.5 - 36 * u},${boxTop - bw * 1.5}`}
                fill={`url(#${uid}-ray)`}
                opacity={0.45}
              />
            ))}
          </g>
          {/* inside of box (back wall) */}
          <polygon points={`${cx - bw / 2},${boxTop} ${cx + bw / 2},${boxTop} ${cx + bw * 0.46},${boxTop - bw * 0.08} ${cx - bw * 0.46},${boxTop - bw * 0.08}`} fill={inner} />
          {/* product */}
          <g transform={`translate(${cx} ${prodY}) rotate(${Math.sin(t * 0.04) * 2 * rise}) scale(${0.9 + 0.1 * wob})`} opacity={sseg(t, 52, 62)}>
            <ProductArt uid={uid} s={ps} body={p.productColor} accent={p.accent} src={p.src} />
          </g>
          {/* box front */}
          <rect x={cx - bw / 2} y={boxTop} width={bw} height={bh} fill={`url(#${uid}-bf)`} />
          <rect x={cx - bw / 2} y={boxTop} width={bw} height={bh * 0.07} fill={bodyTop} opacity={0.6} />
          <line x1={cx - bw / 2} y1={boxTop + bh} x2={cx + bw / 2} y2={boxTop + bh} stroke="#000" strokeOpacity={0.25} strokeWidth={3 * u} />
          <ellipse cx={cx} cy={boxTop + bh + 8 * u} rx={bw * 0.56} ry={bw * 0.05} fill="#000" opacity={0.18} />
          {p.boxLabel ? (
            <text x={cx} y={boxTop + bh * 0.62} textAnchor="middle" fontFamily={fonts.display} fontSize={bw * 0.1} letterSpacing={bw * 0.02} fill={p.accent} opacity={0.9}>
              {p.boxLabel}
            </text>
          ) : null}
          {/* lid */}
          <g transform={`translate(${lidX} ${lidY}) rotate(${lidRot} ${cx} ${boxTop})`}>
            <rect x={cx - bw * 0.525} y={boxTop - lh} width={bw * 1.05} height={lh} rx={4 * u} fill={lidFill} />
            <rect x={cx - bw * 0.525} y={boxTop - lh} width={bw * 1.05} height={lh * 0.22} fill="#fff" opacity={0.16} />
            <rect x={cx - bw * 0.525} y={boxTop - lh * 0.12} width={bw * 1.05} height={lh * 0.12} fill="#000" opacity={0.22} />
            <rect x={cx - bw * 0.12} y={boxTop - lh * 0.62} width={bw * 0.24} height={lh * 0.24} rx={lh * 0.12} fill={p.accent} />
          </g>
        </g>
        <g opacity={text} transform={`translate(0 ${(1 - text) * 24 * u})`}>
          <text x={cx} y={portrait ? h * 0.83 : h * 0.915} textAnchor="middle" fontFamily={fonts.grotesk} fontWeight={700} fontSize={(portrait ? 70 : 60) * u} fill={p.ink}>
            {p.title}
          </text>
        </g>
        <g opacity={text2} transform={`translate(0 ${(1 - text2) * 18 * u})`}>
          <text x={cx} y={(portrait ? h * 0.83 : h * 0.915) + (portrait ? 70 : 58) * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={400} fontSize={(portrait ? 36 : 30) * u} fill={withAlpha(p.ink, 0.7)}>
            {p.subtitle}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const unboxLidLift = defineMotion<Props>({
  id: 'unbox-lid-lift',
  title: 'Unbox lid lift',
  category: 'product',
  description:
    'A packaging box gives a little shake, the lid lifts, tilts and slides away, light rays and a glow pour out and the product image rises out of the box, then a title and subtitle settle in below.',
  source: ['original (round 3)'],
  useFor: 'Unboxing reveals, "what is in the box", product drop / launch teasers, gift and surprise reveals — pass your product image.',
  durationInFrames: 190,
  defaultProps: {
    title: 'Open it up',
    subtitle: 'Everything you need, right in the box',
    boxLabel: 'AURA',
    src: '',
    background: '#16182A',
    ink: '#FFFFFF',
    box: '#E9E2D2',
    accent: '#FF6A3D',
    productColor: '#4A5170',
    startAt: 10,
    speed: 1,
  },
  propDocs: {
    title: 'headline under the box',
    subtitle: 'line under the headline',
    boxLabel: 'word printed on the box front (empty hides it)',
    src: 'product image (public/ path or URL); empty draws a neutral speaker',
    background: "backdrop colour or 'transparent'",
    ink: 'text colour',
    box: 'cardboard colour',
    accent: 'light, ribbon and label colour',
    productColor: 'body colour of the procedural product',
    startAt: 'frame the shake / lift starts',
    speed: 'overall tempo multiplier',
  },
  component: UnboxLidLift,
  tags: ['unboxing', 'box', 'reveal', 'product', 'launch', 'gift', 'lid', 'packaging', 'whats in the box', 'drop'],
});
