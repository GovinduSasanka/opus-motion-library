import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {CheckMark, bgOf, fitFs, money, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sh, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Order confirmation: a check burst + headline and a receipt-style card (zig-zag bottom edge) listing the items, the
 * subtotal / shipping / tax lines and a counted-up total, with a barcode and a delivery note.
 */
type Item = {name: string; price: number; qty?: number};
type Props = {
  title: string;
  subtitle: string;
  orderLabel: string;
  orderNumber: string;
  items: Item[];
  currency: string;
  shipping: number;
  tax: number;
  subtotalLabel: string;
  shippingLabel: string;
  taxLabel: string;
  totalLabel: string;
  freeLabel: string;
  deliveryNote: string;
  textColor: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  startAt: number;
};

const OrderConfirmation: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  // text that sits on the page background (left column): auto light/dark unless textColor is set
  const tc = p.textColor || (p.background === 'transparent' ? p.ink : onColor(p.background, p.ink, '#FFFFFF'));
  const items = p.items.slice(0, 5);
  const subtotal = items.reduce((s, it) => s + it.price * (it.qty ?? 1), 0);
  const total = subtotal + p.shipping + p.tax;

  // receipt geometry (px)
  const rw = portrait ? w * 0.86 : Math.min(w * 0.34, 640 * u);
  const padR = 36 * u;
  const itemH = 66 * u;
  const lineH = 46 * u;
  const headH = 104 * u;
  const totalH = 92 * u;
  const barH = 70 * u;
  const rh = headH + items.length * itemH + 30 * u + 3 * lineH + 16 * u + totalH + barH + 44 * u;
  const teeth = Math.round(rw / (20 * u));
  const tw = rw / teeth;
  const zt = 12 * u;
  const zig = `M0 0 H${rw} V${rh}` + Array.from({length: teeth}, (_, i) => `L${rw - (i + 0.5) * tw} ${rh + zt} L${rw - (i + 1) * tw} ${rh}`).join('') + 'Z';

  // placement
  const colGap = w * 0.05;
  const recX = portrait ? (w - rw) / 2 : w - w * 0.08 - rw;
  // check burst
  const R = (portrait ? 92 : 112) * u;
  const ring = backOut(sseg(t, 2, 18), 2);
  const ck = prog(t, 12, 28);
  const rays = prog(t, 14, 38, ease.out);
  const burstCx = portrait ? w / 2 : w * 0.08 + R + 4 * u;
  const burstCy = portrait ? 290 * u + R * 0.6 : h * 0.5 - 230 * u;
  const titleX = portrait ? 0 : w * 0.08;
  const titleW = portrait ? w : recX - w * 0.08 - colGap;
  const titleY = portrait ? burstCy + R + 56 * u : burstCy + R + 56 * u;
  const recY = portrait ? burstCy + R + 56 * u + 96 * u + 160 * u + 40 * u : (h - rh - zt) / 2;
  const recIn = ease.out(sseg(t, 10, 34));
  const tIn = ease.out(sseg(t, 18, 34));
  const sIn = ease.out(sseg(t, 26, 40));
  const chipIn = backOut(sseg(t, 84, 98), 1.8);
  const align = portrait ? 'center' : 'left';

  const itemStart = 30;
  const totalsStart = itemStart + items.length * 6 + 10;
  const count = ease.out(sseg(t, totalsStart + 8, totalsStart + 44));
  const dashed = (y: number) => <div style={{position: 'absolute', left: padR, right: padR, top: y, borderTop: `${2.5 * u}px dashed ${withAlpha(p.ink, 0.22)}`}} />;

  const lines: [string, string][] = [
    [p.subtotalLabel, money(subtotal, p.currency)],
    [p.shippingLabel, p.shipping > 0 ? money(p.shipping, p.currency) : p.freeLabel],
    [p.taxLabel, money(p.tax, p.currency)],
  ];
  const itemsTop = headH;
  const linesTop = itemsTop + items.length * itemH + 30 * u;
  const totalTop = linesTop + 3 * lineH + 16 * u;
  const barTop = totalTop + totalH + 12 * u;
  const bars = Array.from({length: 44}, (_, i) => ({x: i, w: 1 + Math.floor(sh(i, 5, 2) * 3), on: sh(i, 9, 2) > 0.28}));
  const barUnit = (rw - padR * 2) / bars.reduce((s, b) => s + b.w + 1, 0);

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink}}>
      {/* check burst */}
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g transform={`translate(${burstCx} ${burstCy})`}>
          {Array.from({length: 14}, (_, k) => {
            const a = (k / 14) * Math.PI * 2 + 0.1;
            const r0 = R * (1.18 + 0.22 * rays);
            const r1 = R * (1.24 + 0.62 * rays);
            return <line key={k} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={k % 2 ? p.ink : p.accent} strokeWidth={5 * u} strokeLinecap="round" opacity={rays > 0 ? 1 - rays : 0} />;
          })}
          {Array.from({length: 10}, (_, k) => {
            const a = sh(k, 3, 8) * Math.PI * 2;
            const dd = R * (1.3 + 1.1 * sh(k, 4, 8)) * rays;
            return <circle key={k} cx={Math.cos(a) * dd} cy={Math.sin(a) * dd} r={(4 + sh(k, 5, 8) * 5) * u} fill={k % 3 ? p.accent : mixHex(p.accent, p.ink, 0.5)} opacity={rays > 0 ? 1 - sseg(rays, 0.5, 1) : 0} />;
          })}
          <circle r={R * Math.max(0.001, ring)} fill={p.accent} />
          <circle r={R * Math.max(0.001, ring) * 1.14} fill="none" stroke={withAlpha(p.accent, 0.25)} strokeWidth={6 * u} />
        </g>
      </svg>
      <div style={{position: 'absolute', left: burstCx - R * 0.5, top: burstCy - R * 0.5}}>
        <CheckMark size={R} color={onColor(p.accent)} p={ck} sw={2.8} />
      </div>
      <div style={{position: 'absolute', left: titleX, top: titleY, width: titleW, textAlign: align, color: tc, opacity: tIn, transform: `translateY(${(1 - tIn) * 20 * u}px)`}}>
        <div style={{fontFamily: fonts.display, fontSize: fitFs(p.title, titleW * 0.92, (portrait ? 74 : 84) * u, 0.62), lineHeight: 1.05, padding: portrait ? `0 ${w * 0.04}px` : 0, boxSizing: 'border-box'}}>{p.title}</div>
      </div>
      <div style={{position: 'absolute', left: titleX, top: titleY + (portrait ? 96 : 108) * u, width: titleW, textAlign: align, color: tc, fontSize: (portrait ? 30 : 30) * u, fontWeight: 600, opacity: 0.62 * sIn, lineHeight: 1.35, padding: portrait ? `0 ${w * 0.08}px` : 0, boxSizing: 'border-box'}}>{p.subtitle}</div>
      {!portrait ? (
        <div style={{position: 'absolute', left: titleX, top: titleY + 230 * u, transform: `scale(${Math.max(0.001, chipIn)})`, transformOrigin: 'left center', display: 'inline-flex', alignItems: 'center', gap: 14 * u, padding: `${14 * u}px ${26 * u}px`, borderRadius: 99, background: withAlpha(p.accent, 0.18), color: tc, fontWeight: 800, fontSize: 26 * u}}>
          <span style={{width: 14 * u, height: 14 * u, borderRadius: '50%', background: p.accent}} />
          {p.deliveryNote}
        </div>
      ) : null}

      {/* receipt */}
      <div style={{position: 'absolute', left: recX, top: recY + (1 - recIn) * 90 * u, width: rw, height: rh + zt, opacity: recIn, filter: `drop-shadow(0 ${18 * u}px ${30 * u}px ${withAlpha(p.ink, 0.2)})`}}>
        <svg width={rw} height={rh + zt} style={{position: 'absolute', inset: 0}}>
          <path d={zig} fill={p.card} />
        </svg>
        <div style={{position: 'absolute', left: padR, top: 34 * u, right: padR, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{fontSize: 22 * u, fontWeight: 700, letterSpacing: 2 * u, opacity: 0.5, textTransform: 'uppercase'}}>{p.orderLabel}</div>
          <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: 30 * u}}>{p.orderNumber}</div>
        </div>
        {dashed(headH - 14 * u)}
        {items.map((it, i) => {
          const vis = ease.out(sseg(t, itemStart + i * 6, itemStart + i * 6 + 10));
          return (
            <div key={i} style={{position: 'absolute', left: padR, right: padR, top: itemsTop + i * itemH, height: itemH, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: vis, transform: `translateX(${(1 - vis) * 24 * u}px)`}}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 12 * u, minWidth: 0}}>
                <div style={{fontSize: 28 * u, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: rw * 0.52}}>{it.name}</div>
                <div style={{fontSize: 23 * u, fontWeight: 600, opacity: 0.45}}>{`×${it.qty ?? 1}`}</div>
              </div>
              <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 28 * u}}>{money(it.price * (it.qty ?? 1), p.currency)}</div>
            </div>
          );
        })}
        {dashed(linesTop - 12 * u)}
        {lines.map(([a, b], i) => {
          const vis = ease.out(sseg(t, totalsStart + i * 4, totalsStart + i * 4 + 10));
          return (
            <div key={i} style={{position: 'absolute', left: padR, right: padR, top: linesTop + i * lineH, height: lineH, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 25 * u, fontWeight: 600, opacity: vis * 0.7}}>
              <div>{a}</div>
              <div style={{fontFamily: fonts.grotesk, fontWeight: 700}}>{b}</div>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: padR, right: padR, top: totalTop, height: totalH, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `${3 * u}px solid ${p.ink}`, opacity: ease.out(sseg(t, totalsStart + 10, totalsStart + 22))}}>
          <div style={{fontSize: 28 * u, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 * u}}>{p.totalLabel}</div>
          <div style={{fontFamily: fonts.display, fontSize: 46 * u, color: p.accent}}>{money(total * count, p.currency)}</div>
        </div>
        <div style={{position: 'absolute', left: padR, top: barTop, height: barH - 20 * u, display: 'flex', alignItems: 'stretch', opacity: ease.out(sseg(t, 88, 104)) * 0.85}}>
          {bars.map((b, i) => (
            <div key={i} style={{width: b.w * barUnit, marginRight: barUnit, background: b.on ? p.ink : 'transparent'}} />
          ))}
        </div>
      </div>
      {portrait ? (
        <div style={{position: 'absolute', left: 0, width: w, top: recY + rh + zt + 50 * u, display: 'flex', justifyContent: 'center', transform: `scale(${Math.max(0.001, chipIn)})`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 14 * u, padding: `${14 * u}px ${26 * u}px`, borderRadius: 99, background: withAlpha(p.accent, 0.18), color: tc, fontWeight: 800, fontSize: 26 * u}}>
            <span style={{width: 14 * u, height: 14 * u, borderRadius: '50%', background: p.accent}} />
            {p.deliveryNote}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const orderConfirmation = defineMotion<Props>({
  id: 'order-confirmation',
  title: 'Order confirmation receipt',
  category: 'product',
  description:
    'A check burst and headline beside a receipt card with a zig-zag edge: item lines slide in, subtotal / shipping / tax appear, the total counts up, then a barcode and a delivery-note chip.',
  source: ['original (round 3)'],
  useFor: 'Checkout success beats, "thanks for your order" emails turned into video, e-commerce app explainers, receipt / invoice reveals — set the items, currency, labels and colours.',
  durationInFrames: 170,
  defaultProps: {
    title: 'Order confirmed',
    subtitle: 'Thanks for shopping with us. A receipt is on its way to your inbox.',
    orderLabel: 'Order',
    orderNumber: '#100428',
    items: [
      {name: 'Canvas Tote Bag', price: 24, qty: 1},
      {name: 'Ceramic Mug', price: 16, qty: 2},
      {name: 'Desk Lamp', price: 48, qty: 1},
    ],
    currency: '$',
    shipping: 0,
    tax: 8.32,
    subtotalLabel: 'Subtotal',
    shippingLabel: 'Shipping',
    taxLabel: 'Tax',
    totalLabel: 'Total',
    freeLabel: 'Free',
    deliveryNote: 'Estimated delivery: 3-5 days',
    textColor: '',
    background: '#EEF1F6',
    card: '#FFFFFF',
    ink: '#18202E',
    accent: '#18B26B',
    startAt: 0,
  },
  propDocs: {
    title: 'headline',
    subtitle: 'sentence under the headline',
    orderLabel: 'small caps label before the order number',
    orderNumber: 'order number text',
    items: 'receipt lines [{name, price, qty?}] (first 5 shown)',
    currency: 'currency prefix',
    shipping: 'shipping cost (0 shows the free label)',
    tax: 'tax amount',
    subtotalLabel: 'label of the subtotal line',
    shippingLabel: 'label of the shipping line',
    taxLabel: 'label of the tax line',
    totalLabel: 'label of the total line',
    freeLabel: 'text shown when shipping is 0',
    deliveryNote: 'text in the delivery chip',
    textColor: 'colour of the headline / sub-line / chip on the page background; empty = automatic light or dark from the background',
    background: "page colour or 'transparent'",
    card: 'receipt colour',
    ink: 'text colour',
    accent: 'check burst and total colour',
    startAt: 'frame the scene starts',
  },
  component: OrderConfirmation,
  tags: ['order', 'confirmation', 'receipt', 'checkout', 'ecommerce', 'success', 'thank you', 'invoice', 'retail', 'store', 'check'],
});
