import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {CartIcon, CheckMark, Thumb, bgOf, fitFs, money, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Add-to-cart: a store header with a cart icon, a product card; the button is pressed, a copy of the product thumbnail
 * flies in an arc into the cart, the cart wiggles and its badge count bumps (+1 floats up). Repeat with `adds`.
 */
type Props = {
  storeName: string;
  productName: string;
  price: number;
  currency: string;
  buttonLabel: string;
  addedLabel: string;
  cartLabel: string;
  startCount: number;
  adds: number;
  gap: number;
  src: string;
  productKind: number;
  productColor: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  startAt: number;
};

const FLY = 30;
const PRESS0 = 34;

const AddToCartFly: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const adds = Math.max(0, Math.round(p.adds));

  const headerH = (portrait ? 150 : 118) * u;
  const cartS = 58 * u;
  const margin = (portrait ? 56 : 84) * u;
  const cartX = w - margin - cartS / 2;
  const cartY = headerH / 2;

  const cw = portrait ? w * 0.78 : Math.min((h - headerH) * 0.6, w * 0.3);
  const ch = cw * 1.42;
  const cardX = (w - cw) / 2;
  const cardY = headerH + (h - headerH - ch) / 2;
  const pad = cw * 0.05;
  const thumb = cw - pad * 2;
  const thumbCx = cardX + pad + thumb / 2;
  const thumbCy = cardY + pad + thumb / 2;
  const enter = ease.out(sseg(t, 0, 22));

  const presses = Array.from({length: adds}, (_, i) => PRESS0 + i * p.gap);
  const lands = presses.map((x) => x + 3 + FLY);
  const landed = lands.filter((l) => t >= l).length;
  const lastLand = lands.filter((l) => t >= l).pop();
  const dt = lastLand === undefined ? -1 : t - lastLand;
  const bump = dt >= 0 && dt < 40 ? Math.exp(-dt * 0.2) * Math.cos(dt * 0.55) : 0;
  const wiggle = dt >= 0 && dt < 40 ? 16 * Math.exp(-dt * 0.17) * Math.sin(dt * 0.85) : 0;
  const count = Math.round(p.startCount) + landed;
  const appear = p.startCount > 0 ? 1 : lands.length ? backOut(sseg(t - lands[0], 0, 10)) : 0;
  const bscale = count > 0 ? Math.max(0.001, appear) * (1 + 0.5 * bump) : 0.001;

  // button state
  const pressNow = presses.reduce((s, x) => {
    const d = t - x;
    return d >= 0 && d <= 10 ? Math.max(s, Math.sin((Math.PI * d) / 10)) : s;
  }, 0);
  const ripple = presses.reduce((s, x) => {
    const d = t - x;
    return d >= 0 && d <= 18 ? d / 18 : s;
  }, -1);
  const added = adds > 0 && t >= PRESS0 + 6;

  const btnH = cw * 0.15;
  const btnBg = added ? mixHex(p.accent, p.card, 0.84) : p.accent;
  const btnFg = added ? p.accent : onColor(p.accent);
  const accentSoft = withAlpha(p.accent, 0.12);

  // flight clones
  const clones = presses.map((x, i) => {
    const f = prog(t, x + 3, x + 3 + FLY, ease.inOut);
    if (t < x + 3 || t > x + 3 + FLY + 1) return null;
    const x0 = thumbCx;
    const y0 = thumbCy;
    const cx1 = lerp(x0, cartX, 0.1);
    const cy1 = cartY + 70 * u;
    const bx = (1 - f) * (1 - f) * x0 + 2 * (1 - f) * f * cx1 + f * f * cartX;
    const by = (1 - f) * (1 - f) * y0 + 2 * (1 - f) * f * cy1 + f * f * cartY;
    const sc = lerp(1, (cartS * 0.62) / thumb, 1 - (1 - f) * (1 - f));
    const op = 1 - prog(f, 0.82, 1, ease.in);
    return {i, bx, by, sc, op, rot: 18 * f};
  });

  const plusT = lastLand === undefined ? -1 : dt;

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink}}>
      {/* header */}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: headerH, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${margin}px`, boxSizing: 'border-box', borderBottom: `${2 * u}px solid ${withAlpha(p.ink, 0.08)}`}}>
        <div style={{fontFamily: fonts.display, fontSize: 40 * u, letterSpacing: 1 * u}}>{p.storeName}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16 * u}}>
          <div style={{fontSize: 26 * u, fontWeight: 600, opacity: 0.6}}>{p.cartLabel}</div>
          <div style={{position: 'relative', width: cartS, height: cartS, transform: `rotate(${wiggle}deg) scale(${1 + 0.06 * Math.max(0, bump)})`}}>
            <CartIcon size={cartS} color={p.ink} sw={1.9} />
            <div
              style={{
                position: 'absolute',
                right: -cartS * 0.22,
                top: -cartS * 0.22,
                minWidth: cartS * 0.5,
                height: cartS * 0.5,
                padding: `0 ${cartS * 0.1}px`,
                boxSizing: 'border-box',
                borderRadius: cartS,
                background: p.accent,
                color: onColor(p.accent),
                fontWeight: 800,
                fontSize: cartS * 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${bscale})`,
                boxShadow: `0 0 0 ${3 * u}px ${bgOf(p.background) ?? p.card}`,
              }}
            >
              {count}
            </div>
          </div>
        </div>
      </div>

      {/* product card */}
      <div
        style={{
          position: 'absolute',
          left: cardX,
          top: cardY + (1 - enter) * 40 * u,
          width: cw,
          height: ch,
          opacity: enter,
          borderRadius: cw * 0.06,
          background: p.card,
          boxShadow: `0 ${cw * 0.04}px ${cw * 0.12}px ${withAlpha(p.ink, 0.16)}`,
          boxSizing: 'border-box',
        }}
      >
        <div style={{position: 'absolute', left: pad, top: pad, transform: `scale(${1 - 0.025 * pressNow})`}}>
          <Thumb w={thumb} radius={cw * 0.04} kind={p.productKind} color={p.productColor} src={p.src || undefined} />
        </div>
        <div style={{position: 'absolute', left: pad, top: pad + thumb + cw * 0.04, width: thumb, fontSize: fitFs(p.productName, thumb, cw * 0.068, 0.55), fontWeight: 800, whiteSpace: 'nowrap'}}>{p.productName}</div>
        <div style={{position: 'absolute', left: pad, top: pad + thumb + cw * 0.04 + cw * 0.09, fontFamily: fonts.grotesk, fontWeight: 700, fontSize: cw * 0.08, color: p.accent}}>{money(p.price, p.currency)}</div>
        <div
          style={{
            position: 'absolute',
            left: pad,
            top: ch - pad - btnH,
            width: thumb,
            height: btnH,
            borderRadius: btnH * 0.34,
            background: btnBg,
            color: btnFg,
            fontWeight: 800,
            fontSize: btnH * 0.36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: btnH * 0.16,
            overflow: 'hidden',
            transform: `scale(${1 - 0.06 * pressNow})`,
          }}
        >
          {ripple >= 0 ? <div style={{position: 'absolute', left: '50%', top: '50%', width: thumb * ripple * 1.3, height: thumb * ripple * 1.3, marginLeft: -(thumb * ripple * 1.3) / 2, marginTop: -(thumb * ripple * 1.3) / 2, borderRadius: '50%', background: withAlpha(btnFg, 0.22 * (1 - ripple))}} /> : null}
          {added ? <CheckMark size={btnH * 0.42} color={btnFg} p={prog(t, PRESS0 + 6, PRESS0 + 16)} sw={3.2} /> : null}
          <span style={{position: 'relative'}}>{added ? p.addedLabel : p.buttonLabel}</span>
        </div>
      </div>

      {/* flying thumbnails */}
      {clones.map((c) =>
        c ? (
          <div key={c.i} style={{position: 'absolute', left: c.bx - thumb / 2, top: c.by - thumb / 2, opacity: c.op, transform: `scale(${c.sc}) rotate(${c.rot}deg)`, filter: `drop-shadow(0 ${14 * u}px ${18 * u}px ${withAlpha(p.ink, 0.28)})`}}>
            <Thumb w={thumb} radius={cw * 0.04} kind={p.productKind} color={p.productColor} src={p.src || undefined} />
          </div>
        ) : null,
      )}

      {/* +1 */}
      {plusT >= 0 && plusT < 26 ? (
        <div style={{position: 'absolute', left: cartX - cartS * 0.2, top: cartY + cartS * 0.5 + plusT * 1.5 * u, fontWeight: 800, fontSize: 30 * u, color: p.accent, opacity: 1 - sseg(plusT, 6, 26), padding: `${4 * u}px ${12 * u}px`, borderRadius: 99, background: accentSoft}}>+1</div>
      ) : null}
    </AbsoluteFill>
  );
};

export const addToCartFly = defineMotion<Props>({
  id: 'add-to-cart-fly',
  title: 'Add to cart (thumbnail flies into cart)',
  category: 'product',
  description:
    'A store header with a cart icon and a product card: the button is pressed, a copy of the product picture flies in an arc into the cart, the cart wiggles and its badge count bumps with a +1.',
  source: ['original (round 3)'],
  useFor: 'E-commerce explainers, store promos, app-store videos, "add to cart" UX demos — set the product picture, name, price, currency and labels.',
  durationInFrames: 150,
  defaultProps: {
    storeName: 'SHOPLY',
    productName: 'Canvas Tote Bag',
    price: 24,
    currency: '$',
    buttonLabel: 'Add to cart',
    addedLabel: 'Added',
    cartLabel: 'Cart',
    startCount: 0,
    adds: 2,
    gap: 40,
    src: '',
    productKind: 0,
    productColor: '#E07A5F',
    background: '#F3EFE8',
    card: '#FFFFFF',
    ink: '#1D1B24',
    accent: '#E8553A',
    startAt: 0,
  },
  propDocs: {
    storeName: 'wordmark in the header',
    productName: 'product title on the card',
    price: 'price number (no currency)',
    currency: 'currency prefix, e.g. $, €, £, Rs.',
    buttonLabel: 'button text before the press',
    addedLabel: 'button text after the press',
    cartLabel: 'small label next to the cart icon',
    startCount: 'items already in the cart (badge starts here)',
    adds: 'how many times the button is pressed (0-4)',
    gap: 'frames between presses',
    src: 'product image (public/ path or https URL); empty = procedural drawing',
    productKind: 'procedural drawing when no src: 0 bag, 1 mug, 2 headphones, 3 box, 4 bottle, 5 watch, 6 lamp, 7 t-shirt',
    productColor: 'procedural product colour',
    background: "page colour or 'transparent'",
    card: 'card colour',
    ink: 'text and icon colour',
    accent: 'price, button and badge colour',
    startAt: 'frame the card starts entering',
  },
  component: AddToCartFly,
  tags: ['ecommerce', 'cart', 'add to cart', 'shop', 'store', 'retail', 'product', 'checkout', 'ui', 'badge', 'flight'],
});
