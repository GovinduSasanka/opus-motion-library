import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {backOut, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A hanging price tag drops in on a string and swings to rest (damped pendulum); the old price is struck through,
 * the new price pops in, a discount badge stamps on. Everything is a prop: currency, both prices, labels, colours.
 */
type Props = {
  label: string;
  oldPrice: string;
  newPrice: string;
  currency: string;
  badge: string;
  tagline: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  swing: number;
  startAt: number;
};

const parse = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, ''));

const PriceTagDrop: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const cw = portrait ? Math.min(w * 0.74, 760 * u) : Math.min(h * 0.62, w * 0.3);
  const ch = cw * 1.28;
  const cx = w / 2;
  const top = Math.max(h * 0.2, (h - ch) / 2 + cw * 0.1);
  const holeY = top + cw * 0.12;
  const drop = easeOut3(sseg(t, 0, 20));
  const dropY = -(top + ch) * (1 - drop) * 1.0;
  const sw = t < 14 ? 0 : p.swing * Math.exp(-(t - 14) * 0.065) * Math.cos((t - 14) * 0.32);
  const rotate = sw;
  const strike = easeOut3(sseg(t, 40, 56));
  const newIn = backOut(sseg(t, 54, 72), 2.2);
  const badgeIn = backOut(sseg(t, 68, 84), 2.6);
  const o = parse(p.oldPrice);
  const n = parse(p.newPrice);
  const badge = p.badge || (o > 0 && n >= 0 && o > n ? `-${Math.round((1 - n / o) * 100)}%` : '');
  const money = (v: string) => `${p.currency}${v}`;
  const oldFs = cw * 0.13;
  const newFs = Math.min(cw * 0.3, (cw * 0.84) / Math.max(1, money(p.newPrice).length * 0.62));
  const oldW = money(p.oldPrice).length * oldFs * 0.6;
  const ring = mixHex(p.card, p.ink, 0.25);
  const shadow = 14 * u;
  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? undefined : p.background}}>
      <Svg>
        <g transform={`translate(0 ${dropY})`}>
          <g transform={`rotate(${rotate} ${cx} 0)`}>
            <line x1={cx} y1={-h} x2={cx} y2={holeY} stroke={p.ink} strokeWidth={4 * u} opacity={0.7} />
            <g transform={`translate(${shadow * 0.5} ${shadow})`} opacity={0.22}>
              <path d={tagPath(cx, top, cw, ch)} fill="#000" />
            </g>
            <path d={tagPath(cx, top, cw, ch)} fill={p.card} />
            <path d={tagPath(cx, top, cw, ch)} fill="none" stroke={ring} strokeWidth={3 * u} />
            <rect x={cx - cw * 0.4} y={top + ch * 0.9} width={cw * 0.42} height={cw * 0.03} rx={cw * 0.015} fill={withAlpha(p.accent, 0.5)} />
            <circle cx={cx} cy={holeY} r={cw * 0.045} fill={p.background === 'transparent' ? '#222' : p.background} stroke={ring} strokeWidth={3 * u} />
            <text x={cx} y={top + ch * 0.25} textAnchor="middle" fontFamily={fonts.display} fontSize={cw * 0.085} letterSpacing={cw * 0.012} fill={p.accent}>
              {p.label}
            </text>
            {/* old price */}
            <g transform={`translate(${cx} ${top + ch * 0.43})`} opacity={1 - 0.45 * strike}>
              <text textAnchor="middle" fontFamily={fonts.grotesk} fontWeight={700} fontSize={oldFs} fill={p.ink}>
                {money(p.oldPrice)}
              </text>
              <line x1={-oldW / 2 - 8 * u} y1={-oldFs * 0.14} x2={-oldW / 2 - 8 * u + (oldW + 16 * u) * strike} y2={-oldFs * 0.3} stroke={p.accent} strokeWidth={Math.max(5 * u, oldFs * 0.09)} strokeLinecap="round" />
            </g>
            {/* new price */}
            <g transform={`translate(${cx} ${top + ch * 0.67}) scale(${Math.max(0.001, newIn)})`} opacity={Math.min(1, newIn)}>
              <text textAnchor="middle" fontFamily={fonts.display} fontSize={newFs} fill={p.ink}>
                {money(p.newPrice)}
              </text>
            </g>
            <text x={cx} y={top + ch * 0.83} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={cw * 0.058} letterSpacing={cw * 0.006} fill={p.ink} opacity={0.75 * sseg(t, 70, 84)}>
              {p.tagline}
            </text>
            {/* badge */}
            {badge ? (
              <g transform={`translate(${cx + cw * 0.34} ${top + ch * 0.9}) rotate(-12) scale(${Math.max(0.001, badgeIn)})`} opacity={Math.min(1, badgeIn)}>
                <circle r={cw * 0.155} fill={p.accent} />
                <circle r={cw * 0.133} fill="none" stroke={p.card} strokeWidth={2.5 * u} strokeDasharray={`${5 * u} ${5 * u}`} />
                <text textAnchor="middle" y={cw * 0.04} fontFamily={fonts.display} fontSize={cw * 0.105} fill={p.card}>
                  {badge}
                </text>
              </g>
            ) : null}
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

/** tag outline: chamfered top corners, rounded bottom */
const tagPath = (cx: number, top: number, cw: number, ch: number) => {
  const x0 = cx - cw / 2;
  const x1 = cx + cw / 2;
  const c = cw * 0.2;
  const r = cw * 0.07;
  const b = top + ch;
  return `M${x0 + c} ${top}L${x1 - c} ${top}L${x1} ${top + c}L${x1} ${b - r}Q${x1} ${b} ${x1 - r} ${b}L${x0 + r} ${b}Q${x0} ${b} ${x0} ${b - r}L${x0} ${top + c}Z`;
};

export const priceTagDrop = defineMotion<Props>({
  id: 'price-tag-drop',
  title: 'Price tag drop',
  category: 'product',
  description:
    'A price tag hangs on a string, drops in and swings to rest; the old price is struck through, the new price pops in and a discount badge stamps on (auto percentage unless set).',
  source: ['original (round 3)'],
  useFor: 'Sales, launch pricing, "now only" beats, subscription price reveals — set currency, old and new price.',
  durationInFrames: 150,
  defaultProps: {
    label: 'SPECIAL OFFER',
    oldPrice: '129.00',
    newPrice: '79.00',
    currency: '$',
    badge: '',
    tagline: 'Today only',
    background: '#F4EFE6',
    card: '#FFFDF8',
    ink: '#1D1B24',
    accent: '#E8412A',
    swing: 16,
    startAt: 6,
  },
  propDocs: {
    label: 'small heading on the tag',
    oldPrice: 'original price text (struck through)',
    newPrice: 'new price text',
    currency: 'currency symbol / prefix (e.g. $, €, £, Rs.)',
    badge: 'badge text; empty = automatic -NN% from the two prices (hidden if not computable)',
    tagline: 'small line under the new price',
    background: "backdrop colour or 'transparent'",
    card: 'tag colour',
    ink: 'text and string colour',
    accent: 'label, strike, badge colour',
    swing: 'initial swing angle in degrees',
    startAt: 'frame the tag starts dropping',
  },
  component: PriceTagDrop,
  tags: ['price', 'sale', 'discount', 'offer', 'tag', 'product', 'pricing', 'strikethrough', 'ecommerce', 'overlay'],
});
