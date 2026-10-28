import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp} from '../../core/ease';
import {Thumb, bgOf, fitFs, money, onColor, pad2} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Flash-deal product card: ribbon, product picture with a discount badge, struck-through old price, a live countdown
 * (digit boxes tick) and a stock bar that drains toward "almost gone" (turning red), plus a pulsing call-to-action.
 */
type Props = {
  ribbon: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  badge: string;
  timer: string;
  timerLabel: string;
  timerSpeed: number;
  stockTotal: number;
  stockStart: number;
  stockEnd: number;
  stockText: string;
  claimedText: string;
  buttonLabel: string;
  src: string;
  productKind: number;
  productColor: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  danger: string;
  startAt: number;
};

const parseTimer = (s: string) => {
  const parts = s.split(':').map((x) => parseInt(x, 10) || 0);
  while (parts.length < 3) parts.unshift(0);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

const FlashDealTimerCard: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;

  const cardW = portrait ? w * 0.88 : Math.min(w * 0.68, 1260 * u);
  const pad = 38 * u;
  const cardH = portrait ? 1330 * u : 650 * u;
  const cx0 = (w - cardW) / 2;
  const cy0 = (h - cardH) / 2;
  const enter = ease.out(sseg(t, 0, 22));
  const imgW = portrait ? cardW - pad * 2 : cardH - pad * 2;
  const imgH = portrait ? imgW * 0.68 : imgW;
  const contentW = portrait ? cardW - pad * 2 : cardW - pad * 3 - imgW;

  const pct = p.oldPrice > 0 && p.newPrice < p.oldPrice ? Math.round((1 - p.newPrice / p.oldPrice) * 100) : 0;
  const badge = p.badge || (pct > 0 ? `-${pct}%` : '');
  const badgeIn = backOut(sseg(t, 16, 32), 2.2);

  // timer
  const start = parseTimer(p.timer);
  const secs = Math.max(0, start - (t / 30) * p.timerSpeed);
  const shown = Math.ceil(secs);
  const age = Math.max(0, shown - secs);
  const tick = Math.exp(-age * 12);
  const hh = Math.floor(shown / 3600);
  const mm = Math.floor((shown % 3600) / 60);
  const ss = shown % 60;
  const box = (portrait ? 108 : 92) * u;

  // stock
  const sp = ease.inOut(sseg(t, 24, 166));
  const left = Math.max(0, Math.round(lerp(p.stockStart, p.stockEnd, sp)));
  const frac = Math.max(0, Math.min(1, lerp(p.stockStart, p.stockEnd, sp) / Math.max(1, p.stockTotal)));
  const low = sseg(1 - frac, 0.68, 0.9);
  const barCol = mixHex(p.accent, p.danger, low);
  const claimed = Math.round((1 - left / Math.max(1, p.stockTotal)) * 100);
  const stockIn = ease.out(sseg(t, 30, 46));
  const barW = contentW;
  const shine = ((t * 5) % (barW * 1.6)) - barW * 0.3;

  // CTA
  const ctaIn = ease.out(sseg(t, 44, 60));
  const pulse = 1 + 0.03 * Math.sin(Math.max(0, t - 60) * 0.22) * ctaIn;
  const glow = 0.5 + 0.5 * Math.sin(t * 0.18);

  const nameFs = fitFs(p.productName, contentW, (portrait ? 64 : 52) * u, 0.58);

  const Digit: React.FC<{v: number; k: number}> = ({v, k}) => (
    <div style={{position: 'relative', width: box, height: box * 1.08, borderRadius: box * 0.2, background: p.ink, color: onColor(p.ink), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.mono, fontWeight: 700, fontSize: box * 0.6, transform: k === 2 ? `scale(${1 + 0.07 * tick})` : undefined, boxShadow: `0 ${6 * u}px ${14 * u}px ${withAlpha(p.ink, 0.25)}`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 2 * u, background: withAlpha('#000', 0.4)}} />
      {pad2(v)}
    </div>
  );
  const colon = <div style={{fontFamily: fonts.mono, fontWeight: 700, fontSize: box * 0.5, opacity: 0.5 + 0.5 * (Math.floor(t / 15) % 2 === 0 ? 1 : 0.3)}}>:</div>;

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink}}>
      <div
        style={{
          position: 'absolute',
          left: cx0,
          top: cy0 + (1 - enter) * 40 * u,
          width: cardW,
          height: cardH,
          opacity: enter,
          borderRadius: 36 * u,
          background: p.card,
          boxShadow: `0 ${26 * u}px ${80 * u}px ${withAlpha(p.ink, 0.2)}, 0 0 0 ${(3 + glow * 2) * u}px ${withAlpha(p.accent, 0.25 + 0.2 * glow)}`,
          boxSizing: 'border-box',
          padding: pad,
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          gap: pad,
        }}
      >
        {/* picture */}
        <div style={{position: 'relative', width: imgW, height: imgH, flex: 'none'}}>
          <div style={{width: imgW, height: imgH, transform: `scale(${1 + 0.02 * ease.sine(sseg(t, 0, 170))})`, transformOrigin: 'center'}}>
            <Thumb w={imgW} h={imgH} radius={26 * u} kind={p.productKind} color={p.productColor} src={p.src || undefined} />
          </div>
          {badge ? (
            <div style={{position: 'absolute', right: -14 * u, top: -14 * u, width: 118 * u, height: 118 * u, borderRadius: '50%', background: p.accent, color: onColor(p.accent), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.display, fontSize: 36 * u, transform: `rotate(10deg) scale(${Math.max(0.001, badgeIn)})`, boxShadow: `0 ${8 * u}px ${20 * u}px ${withAlpha(p.accent, 0.45)}`}}>{badge}</div>
          ) : null}
        </div>

        {/* content */}
        <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 10 * u, padding: `${8 * u}px ${20 * u}px`, borderRadius: 99, background: withAlpha(p.accent, 0.13), color: p.accent, fontWeight: 800, fontSize: 23 * u, letterSpacing: 2 * u, textTransform: 'uppercase'}}>
              <svg width={22 * u} height={22 * u} viewBox="0 0 24 24" fill={p.accent}>
                <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
              </svg>
              {p.ribbon}
            </div>
            <div style={{fontFamily: fonts.display, fontSize: nameFs, lineHeight: 1.05, marginTop: 16 * u, whiteSpace: 'nowrap'}}>{p.productName}</div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 20 * u, marginTop: 8 * u}}>
              <div style={{fontFamily: fonts.display, fontSize: (portrait ? 92 : 78) * u, color: p.accent, lineHeight: 1.1}}>{money(p.newPrice, p.currency)}</div>
              <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 34 * u, opacity: 0.45, textDecoration: 'line-through'}}>{money(p.oldPrice, p.currency)}</div>
            </div>
          </div>

          <div>
            <div style={{fontSize: 22 * u, fontWeight: 700, opacity: 0.55, marginBottom: 10 * u, textTransform: 'uppercase', letterSpacing: 2 * u}}>{p.timerLabel}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12 * u}}>
              <Digit v={hh} k={0} />
              {colon}
              <Digit v={mm} k={1} />
              {colon}
              <Digit v={ss} k={2} />
            </div>
          </div>

          <div style={{opacity: stockIn}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 * u, fontSize: 26 * u, fontWeight: 800}}>
              <div style={{color: low > 0.4 ? barCol : p.ink}}>{p.stockText.replace('{n}', String(left))}</div>
              <div style={{fontSize: 22 * u, fontWeight: 600, opacity: 0.5}}>{p.claimedText.replace('{p}', String(claimed))}</div>
            </div>
            <div style={{position: 'relative', width: barW, height: 18 * u, borderRadius: 9 * u, background: withAlpha(p.ink, 0.1), overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: barW * frac, borderRadius: 9 * u, background: barCol, overflow: 'hidden'}}>
                <div style={{position: 'absolute', left: shine, top: 0, bottom: 0, width: barW * 0.14, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0))', transform: 'skewX(-20deg)'}} />
              </div>
            </div>
          </div>

          <div style={{height: 84 * u, borderRadius: 24 * u, background: p.accent, color: onColor(p.accent), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30 * u, opacity: ctaIn, transform: `translateY(${(1 - ctaIn) * 16 * u}px) scale(${pulse})`, boxShadow: `0 ${12 * u}px ${30 * u}px ${withAlpha(p.accent, 0.3 + 0.15 * glow)}`}}>{p.buttonLabel}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const flashDealTimerCard = defineMotion<Props>({
  id: 'flash-deal-timer-card',
  title: 'Flash deal card (countdown + draining stock bar)',
  category: 'product',
  description:
    'A product card with a FLASH DEAL ribbon, discount badge, struck-through old price, a ticking HH:MM:SS countdown and a stock bar that drains and turns red as units run out, with a pulsing call-to-action.',
  source: ['original (round 3)'],
  useFor: 'Flash sales, limited drops, black-friday countdowns, urgency / scarcity beats in store promos — set the product, prices, timer start, stock numbers and colours.',
  durationInFrames: 180,
  defaultProps: {
    ribbon: 'Flash deal',
    productName: 'Studio Headset',
    oldPrice: 149,
    newPrice: 89,
    currency: '$',
    badge: '',
    timer: '02:14:37',
    timerLabel: 'Ends in',
    timerSpeed: 6,
    stockTotal: 60,
    stockStart: 44,
    stockEnd: 7,
    stockText: 'Only {n} left',
    claimedText: '{p}% claimed',
    buttonLabel: 'Grab the deal',
    src: '',
    productKind: 2,
    productColor: '#E8553A',
    background: '#17141F',
    card: '#FFFFFF',
    ink: '#1D1B24',
    accent: '#E8553A',
    danger: '#D62839',
    startAt: 0,
  },
  propDocs: {
    ribbon: 'text in the ribbon chip',
    productName: 'product title',
    oldPrice: 'original price number (struck through)',
    newPrice: 'deal price number',
    currency: 'currency prefix',
    badge: 'discount badge text; empty = automatic -NN% from the two prices',
    timer: 'countdown start as HH:MM:SS',
    timerLabel: 'small caps line above the countdown',
    timerSpeed: 'timer seconds that pass per real second (1 = real time; higher ticks faster)',
    stockTotal: 'total stock (bar full = this many)',
    stockStart: 'units left at the start',
    stockEnd: 'units left at the end of the drain',
    stockText: 'stock sentence; {n} is replaced by the units left',
    claimedText: 'right-hand note; {p} is replaced by the % claimed',
    buttonLabel: 'call-to-action text',
    src: 'product image (public/ path or https URL); empty = procedural drawing',
    productKind: 'procedural drawing: 0 bag, 1 mug, 2 headphones, 3 box, 4 bottle, 5 watch, 6 lamp, 7 t-shirt',
    productColor: 'procedural product colour',
    background: "page colour or 'transparent'",
    card: 'card colour',
    ink: 'text colour (card text, digit boxes)',
    accent: 'price, badge, bar and button colour',
    danger: 'bar colour when stock is almost gone',
    startAt: 'frame the card starts entering',
  },
  component: FlashDealTimerCard,
  tags: ['flash sale', 'countdown', 'timer', 'stock', 'scarcity', 'deal', 'discount', 'ecommerce', 'retail', 'product', 'limited', 'urgency', 'sale'],
});
