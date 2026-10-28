import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {ProductArt, textW} from '../../core/product-kit';
import {backOut, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Product hero in the centre, feature labels pop out of it on leader lines (dot on the product, elbowed line, label chip).
 * Landscape: labels in two columns; portrait: labels in rows above and below. Procedural speaker when no `src`.
 */
type Props = {
  title: string;
  features: string[];
  src: string;
  background: string;
  ink: string;
  accent: string;
  productColor: string;
  startAt: number;
  stagger: number;
  speed: number;
};

const FeatureCalloutOrbit: React.FC<Props> = (p) => {
  const frame = useCurrentFrame() * p.speed;
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('fco');
  const feats = (p.features || []).slice(0, 8);
  const n = feats.length;
  const s = portrait ? w * 0.5 : Math.min(h * 0.5, w * 0.28);
  const cx = w / 2;
  const cy = portrait ? h * 0.5 : h * 0.53;
  const enter = easeOut3(sseg(frame, 0, 26));
  const bob = Math.sin(frame * 0.05) * 6 * u;
  const fs = (portrait ? 34 : 30) * u;
  const maxChip = portrait ? w * 0.44 : w * 0.21;
  const half = Math.ceil(n / 2);

  const items = feats.map((label, i) => {
    let side: number;
    let ly: number;
    if (portrait) {
      const above = i < half;
      const g = above ? half : n - half;
      const j = above ? i : i - half;
      const gap = Math.min(h * 0.11, 150 * u);
      ly = above ? cy - s * 0.5 - h * 0.05 - (g - 1 - j) * gap : cy + s * 0.5 + h * 0.05 + j * gap;
      side = (above ? g - 1 - j : j) % 2 === 0 ? 1 : -1;
    } else {
      side = i % 2 === 0 ? 1 : -1;
      const sameSide = feats.filter((_, k) => (k % 2 === 0 ? 1 : -1) === side).length;
      const k = Math.floor(i / 2);
      const ry = Math.min(h * 0.34, 330 * u);
      ly = cy + (sameSide === 1 ? 0 : (k / (sameSide - 1) - 0.5) * 2 * ry);
    }
    const fsz = Math.min(fs, (maxChip - 44 * u) / Math.max(1, textW(label, 1, 0.58)));
    const cw = textW(label, fsz, 0.58) + 44 * u;
    const chh = fsz * 1.9;
    const edgeX = cx + side * (s * 0.5 + w * 0.09);
    const chipX = portrait ? cx + side * w * 0.215 - cw / 2 : side > 0 ? edgeX : edgeX - cw;
    const attachY = Math.max(cy - s * 0.32, Math.min(cy + s * 0.32, cy + (ly - cy) * 0.4));
    const attachX = cx + side * s * 0.16 * (portrait ? 0.6 : 1);
    return {label, side, ly, fsz, cw, chh, chipX, attachX, attachY};
  });

  const chipFill = mixHex(p.background === 'transparent' ? '#ffffff' : p.background, p.ink, 0.1);

  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? undefined : p.background}}>
      <Svg>
        <defs>
          <radialGradient id={`${uid}-gl`}>
            <stop offset="0" stopColor={withAlpha(p.accent, 0.35)} />
            <stop offset="1" stopColor={withAlpha(p.accent, 0)} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={s * 0.95} fill={`url(#${uid}-gl)`} opacity={enter} />
        <g opacity={0.5 * enter}>
          <circle cx={cx} cy={cy} r={s * 0.62} fill="none" stroke={withAlpha(p.ink, 0.3)} strokeWidth={2 * u} strokeDasharray={`${6 * u} ${12 * u}`} strokeDashoffset={-frame * 0.6 * u} />
          <circle cx={cx + Math.cos(frame * 0.035) * s * 0.62} cy={cy + Math.sin(frame * 0.035) * s * 0.62} r={6 * u} fill={p.accent} />
        </g>
        <ellipse cx={cx} cy={cy + s * 0.5} rx={s * 0.3 * (1 - bob / (200 * u))} ry={s * 0.04} fill="#000" opacity={0.25 * enter} />
        <g transform={`translate(${cx} ${cy + bob}) scale(${0.85 + 0.15 * enter})`} opacity={enter}>
          <ProductArt uid={uid} s={s} body={p.productColor} accent={p.accent} src={p.src} />
        </g>
        {items.map((it, i) => {
          const t0 = p.startAt + 20 + i * p.stagger;
          const dot = backOut(sseg(frame, t0, t0 + 8));
          const line = easeOut3(sseg(frame, t0 + 4, t0 + 18));
          const chip = backOut(sseg(frame, t0 + 14, t0 + 26));
          const ex = it.side > 0 ? it.chipX : it.chipX + it.cw;
          const ey = it.ly;
          const elbowX = portrait ? it.attachX : ex - it.side * 36 * u;
          const d = `M${it.attachX} ${it.attachY + bob}L${elbowX} ${ey}L${ex} ${ey}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={p.accent} strokeWidth={2.5 * u} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} strokeLinejoin="round" />
              <circle cx={it.attachX} cy={it.attachY + bob} r={9 * u * dot} fill={p.accent} />
              <circle cx={it.attachX} cy={it.attachY + bob} r={18 * u * dot} fill="none" stroke={p.accent} strokeWidth={2 * u} opacity={0.5 * (1 - sseg(frame, t0 + 8, t0 + 30))} />
              <g transform={`translate(${it.chipX + it.cw / 2} ${it.ly}) scale(${Math.max(0.001, chip)})`} opacity={Math.min(1, chip)}>
                <rect x={-it.cw / 2} y={-it.chh / 2} width={it.cw} height={it.chh} rx={it.chh / 2} fill={chipFill} stroke={p.accent} strokeWidth={2 * u} />
                <text textAnchor="middle" y={it.fsz * 0.36} fontFamily={fonts.sans} fontWeight={600} fontSize={it.fsz} fill={p.ink}>
                  {it.label}
                </text>
              </g>
            </g>
          );
        })}
        {p.title ? (
          <text x={cx} y={portrait ? h * 0.075 : h * 0.1} textAnchor="middle" fontFamily={fonts.grotesk} fontWeight={700} fontSize={(portrait ? 64 : 58) * u} fill={p.ink} opacity={enter}>
            {p.title}
          </text>
        ) : null}
      </Svg>
    </AbsoluteFill>
  );
};

export const featureCalloutOrbit = defineMotion<Props>({
  id: 'feature-callout-orbit',
  title: 'Feature callouts around a product',
  category: 'product',
  description:
    'A product image floats in the centre with a dashed orbit ring; feature labels pop out of it one by one on elbowed leader lines (dot, line draw-on, label chip). Columns in landscape, rows in portrait.',
  source: ['original (round 3)'],
  useFor: 'Product launches, app feature tours, spec call-outs, "what is inside" reveals — pass your product image and your feature list.',
  durationInFrames: 180,
  defaultProps: {
    title: 'Meet Aura One',
    features: ['Active noise cancelling', '40-hour battery', 'Spatial audio', 'USB-C fast charge'],
    src: '',
    background: '#F2EEE6',
    ink: '#1C1B22',
    accent: '#FF5A36',
    productColor: '#2B2E3B',
    startAt: 8,
    stagger: 18,
    speed: 1,
  },
  propDocs: {
    title: 'headline at the top (empty hides it)',
    features: 'feature labels (up to 8)',
    src: 'product image (public/ path or URL); empty draws a neutral speaker',
    background: "backdrop colour or 'transparent'",
    ink: 'text / ring colour',
    accent: 'leader line, dots, orbit dot, glow',
    productColor: 'body colour of the procedural product',
    startAt: 'frame the first callout begins',
    stagger: 'frames between callouts',
    speed: 'overall tempo multiplier',
  },
  component: FeatureCalloutOrbit,
  tags: ['product', 'callout', 'feature', 'leader line', 'labels', 'annotation', 'spec', 'launch', 'overlay', 'tour'],
});
