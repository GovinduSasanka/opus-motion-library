import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {CheckMark, Thumb, bgOf, money, onColor, ART_COLORS} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A checkout stepper (Cart → Shipping → Payment → Done): the progress line fills, each step shows its panel —
 * cart lines, typed shipping fields, MASKED payment placeholders, a final confirmation with a check burst.
 * Never use real card numbers: payment values are masked placeholders.
 */
type Item = {name: string; price: number; qty?: number; src?: string; color?: string; kind?: number};
type Field = {label: string; value: string};
type Props = {
  steps: string[];
  items: Item[];
  shippingFields: Field[];
  paymentFields: Field[];
  buttonLabels: string[];
  currency: string;
  cartTitle: string;
  totalLabel: string;
  doneTitle: string;
  doneText: string;
  hold: number;
  background: string;
  card: string;
  ink: string;
  accent: string;
  startAt: number;
};

const LEAD = 16;
const XF = 12;

const CheckoutSteps: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const steps = p.steps.length >= 2 ? p.steps : ['Cart', 'Done'];
  const n = steps.length;
  const hold = Math.max(24, p.hold);
  const stepStart = (i: number) => LEAD + i * hold;
  let cur = 0;
  for (let i = 0; i < n; i++) if (t >= stepStart(i)) cur = i;
  const local = (i: number) => t - stepStart(i);

  const pw = portrait ? w * 0.9 : Math.min(w * 0.58, 1060 * u);
  const panelH = (portrait ? 860 : 690) * u;
  const stepperH = 116 * u;
  const gap = 34 * u;
  const blockH = stepperH + gap + panelH;
  const top = (h - blockH) / 2;
  const left = (w - pw) / 2;
  const pad = 40 * u;
  const subtle = withAlpha(p.ink, 0.12);

  // stepper geometry
  const dot = 46 * u;
  const trackL = left + dot / 2 + (portrait ? 6 : 20) * u;
  const trackR = left + pw - dot / 2 - (portrait ? 6 : 20) * u;
  const dotX = (i: number) => lerp(trackL, trackR, i / (n - 1));
  const dotY = top + dot / 2 + 6 * u;
  const connFill = (i: number) => ease.inOut(sseg(t, stepStart(i + 1), stepStart(i + 1) + XF));
  const dotOn = (i: number) => (i === 0 ? 1 : sseg(t, stepStart(i) + 6, stepStart(i) + 14));
  const dotDone = (i: number) => (i < n - 1 ? sseg(t, stepStart(i + 1) + 8, stepStart(i + 1) + 16) : sseg(t, stepStart(i) + 18, stepStart(i) + 26));

  const items = p.items;
  const subtotal = items.reduce((s, it) => s + it.price * (it.qty ?? 1), 0);
  const typed = (txt: string, lt: number, start: number, dur: number) => {
    const k = Math.floor(txt.length * prog(lt, start, start + dur, ease.linear));
    return txt.slice(0, k);
  };

  const renderForm = (fields: Field[], lt: number, title: string, mono: boolean) => {
    const rowH = (portrait ? 128 : 112) * u;
    return (
      <div style={{position: 'absolute', left: pad, top: pad + 66 * u, right: pad}}>
        {fields.map((f, i) => {
          const st = 8 + i * 12;
          const vis = ease.out(sseg(lt, i * 4, i * 4 + 10));
          const shown = typed(f.value, lt, st + 4, 14);
          const focus = lt >= st && lt < st + 22;
          return (
            <div key={i} style={{height: rowH, opacity: vis, transform: `translateY(${(1 - vis) * 14 * u}px)`}}>
              <div style={{fontSize: 21 * u, fontWeight: 600, opacity: 0.55, marginBottom: 8 * u}}>{f.label}</div>
              <div style={{height: 58 * u, borderRadius: 14 * u, border: `${2.5 * u}px solid ${focus ? p.accent : subtle}`, background: mixHex(p.card, p.ink, 0.03), display: 'flex', alignItems: 'center', padding: `0 ${20 * u}px`, fontSize: 27 * u, fontWeight: 600, fontFamily: mono ? fonts.mono : fonts.sans, letterSpacing: mono ? 2 * u : 0, boxSizing: 'border-box'}}>
                {shown}
                {focus && Math.floor(lt / 8) % 2 === 0 ? <span style={{width: 2.5 * u, height: 32 * u, background: p.accent, marginLeft: 3 * u}} /> : null}
              </div>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, top: -66 * u, fontSize: 38 * u, fontWeight: 800}}>{title}</div>
      </div>
    );
  };

  const renderStep = (i: number) => {
    const lt = local(i);
    if (i === 0) {
      const rowH = (portrait ? 128 : 104) * u;
      return (
        <div style={{position: 'absolute', inset: 0}}>
          <div style={{position: 'absolute', left: pad, top: pad, fontSize: 38 * u, fontWeight: 800}}>{p.cartTitle}</div>
          <div style={{position: 'absolute', left: pad, right: pad, top: pad + 76 * u}}>
            {items.slice(0, 5).map((it, k) => {
              const vis = ease.out(sseg(lt, 2 + k * 5, 14 + k * 5));
              return (
                <div key={k} style={{height: rowH, display: 'flex', alignItems: 'center', gap: 22 * u, opacity: vis, transform: `translateX(${(1 - vis) * 30 * u}px)`, borderBottom: `${2 * u}px solid ${subtle}`}}>
                  <Thumb w={rowH * 0.72} radius={14 * u} kind={it.kind ?? k} color={it.color ?? ART_COLORS[k % ART_COLORS.length]} src={it.src} />
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontSize: 29 * u, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.name}</div>
                    <div style={{fontSize: 21 * u, opacity: 0.5, marginTop: 4 * u}}>{`Qty ${it.qty ?? 1}`}</div>
                  </div>
                  <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 30 * u}}>{money(it.price * (it.qty ?? 1), p.currency)}</div>
                </div>
              );
            })}
          </div>
          <div style={{position: 'absolute', left: pad, right: pad, bottom: pad + 98 * u, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: ease.out(sseg(lt, 22, 34))}}>
            <div style={{fontSize: 26 * u, fontWeight: 600, opacity: 0.6}}>{p.totalLabel}</div>
            <div style={{fontFamily: fonts.display, fontSize: 52 * u}}>{money(subtotal, p.currency)}</div>
          </div>
        </div>
      );
    }
    if (i === n - 1) {
      const ring = backOut(sseg(lt, 2, 16), 2);
      const ck = prog(lt, 10, 26);
      const rays = prog(lt, 12, 30, ease.out);
      const R = 84 * u;
      return (
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 90 * u}}>
          <div style={{position: 'relative', width: R * 2, height: R * 2, marginBottom: 34 * u}}>
            <svg width={R * 2} height={R * 2} viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              {Array.from({length: 12}, (_, k) => {
                const a = (k / 12) * Math.PI * 2;
                const r0 = R * (1.15 + 0.2 * rays);
                const r1 = R * (1.2 + 0.55 * rays);
                return <line key={k} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={k % 2 ? p.ink : p.accent} strokeWidth={5 * u} strokeLinecap="round" opacity={rays > 0 ? 1 - rays : 0} />;
              })}
              <circle r={R * Math.max(0.001, ring)} fill={p.accent} />
            </svg>
            <div style={{position: 'absolute', left: R * 0.5, top: R * 0.5}}>
              <CheckMark size={R} color={onColor(p.accent)} p={ck} sw={2.8} />
            </div>
          </div>
          <div style={{fontFamily: fonts.display, fontSize: 56 * u, opacity: ease.out(sseg(lt, 14, 26)), transform: `translateY(${(1 - ease.out(sseg(lt, 14, 26))) * 16 * u}px)`}}>{p.doneTitle}</div>
          <div style={{fontSize: 27 * u, fontWeight: 600, opacity: 0.6 * ease.out(sseg(lt, 20, 32)), marginTop: 14 * u, textAlign: 'center', maxWidth: pw - pad * 3}}>{p.doneText}</div>
        </div>
      );
    }
    const shipping = i % 2 === 1;
    return renderForm(shipping ? p.shippingFields : p.paymentFields, lt, steps[i], !shipping);
  };

  const panelFor = (i: number) => {
    const lt = local(i);
    const inn = ease.out(sseg(lt, 0, XF));
    return {opacity: inn, transform: `translateX(${(1 - inn) * 60 * u}px)`};
  };
  const prevI = cur - 1;
  const outP = prevI >= 0 ? ease.in(sseg(local(cur), 0, XF - 2)) : 1;

  // button
  const btnH = 74 * u;
  const lastStep = cur === n - 1;
  const pressI = !lastStep ? Math.max(0, hold - 12) : 0;
  const press = lastStep ? 0 : (() => {
    const d = local(cur) - pressI;
    return d >= 0 && d <= 10 ? Math.sin((Math.PI * d) / 10) : 0;
  })();
  const label = p.buttonLabels[cur] ?? 'Continue';
  const secure = cur === 2 && n >= 4;

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink}}>
      {/* stepper */}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: ease.out(sseg(t, 0, 14))}}>
        {Array.from({length: n - 1}, (_, i) => (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: dotX(i), top: dotY - 3 * u, width: dotX(i + 1) - dotX(i), height: 6 * u, borderRadius: 3 * u, background: subtle}} />
            <div style={{position: 'absolute', left: dotX(i), top: dotY - 3 * u, width: (dotX(i + 1) - dotX(i)) * connFill(i), height: 6 * u, borderRadius: 3 * u, background: p.accent}} />
          </React.Fragment>
        ))}
        {steps.map((s, i) => {
          const on = dotOn(i);
          const dn = dotDone(i);
          const bg = mixHex(mixHex(p.card, p.ink, 0.1), p.accent, on);
          const popS = 1 + 0.18 * Math.sin(Math.PI * sseg(t, stepStart(i) + 4, stepStart(i) + 14)) * (i === 0 ? 0 : 1);
          return (
            <React.Fragment key={i}>
              <div style={{position: 'absolute', left: dotX(i) - dot / 2, top: dotY - dot / 2, width: dot, height: dot, borderRadius: '50%', background: bg, color: on > 0.5 ? onColor(p.accent) : withAlpha(p.ink, 0.5), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22 * u, transform: `scale(${popS})`, boxShadow: on > 0.5 ? `0 0 0 ${7 * u}px ${withAlpha(p.accent, 0.18)}` : 'none'}}>
                {dn > 0 ? <CheckMark size={dot * 0.6} color={onColor(p.accent)} p={dn} sw={3.4} /> : i + 1}
              </div>
              <div style={{position: 'absolute', left: dotX(i) - 110 * u, width: 220 * u, textAlign: 'center', top: dotY + dot / 2 + 12 * u, fontSize: 21 * u, fontWeight: 700, opacity: lerp(0.45, 1, on)}}>{s}</div>
            </React.Fragment>
          );
        })}
      </div>

      {/* panel */}
      <div style={{position: 'absolute', left, top: top + stepperH + gap + (1 - ease.out(sseg(t, 0, 18))) * 30 * u, width: pw, height: panelH, opacity: ease.out(sseg(t, 0, 16)), borderRadius: 30 * u, background: p.card, boxShadow: `0 ${24 * u}px ${70 * u}px ${withAlpha(p.ink, 0.15)}`, overflow: 'hidden'}}>
        {prevI >= 0 && outP < 1 ? <div style={{position: 'absolute', inset: 0, opacity: 1 - outP, transform: `translateX(${-60 * u * outP}px)`}}>{renderStep(prevI)}</div> : null}
        <div style={{position: 'absolute', inset: 0, ...(prevI >= 0 ? panelFor(cur) : {})}}>{renderStep(cur)}</div>
        {!lastStep ? (
          <div style={{position: 'absolute', left: pad, right: pad, bottom: pad, height: btnH, borderRadius: btnH * 0.3, background: p.accent, color: onColor(p.accent), fontWeight: 800, fontSize: 28 * u, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 * u, transform: `scale(${1 - 0.04 * press})`}}>
            {secure ? (
              <svg width={22 * u} height={24 * u} viewBox="0 0 22 24" fill="none" stroke={onColor(p.accent)} strokeWidth={2.4} strokeLinecap="round">
                <rect x={3} y={10} width={16} height={12} rx={3} fill={onColor(p.accent)} />
                <path d="M6.5 10 V7 a4.5 4.5 0 0 1 9 0 V10" />
              </svg>
            ) : null}
            {label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const checkoutSteps = defineMotion<Props>({
  id: 'checkout-steps',
  title: 'Checkout steps (cart → shipping → payment → done)',
  category: 'ui',
  description:
    'A four-step checkout flow: the stepper line fills, the cart lines slide in, shipping fields type themselves, payment shows masked placeholder values, and the last step is a confirmation with a check burst.',
  source: ['original (round 3)'],
  useFor: 'E-commerce / SaaS checkout explainers, "buy in 4 steps" videos, store onboarding — set the step names, items, fields, currency and brand colours.',
  durationInFrames: 240,
  defaultProps: {
    steps: ['Cart', 'Shipping', 'Payment', 'Done'],
    items: [
      {name: 'Canvas Tote Bag', price: 24, qty: 1, kind: 0},
      {name: 'Ceramic Mug', price: 16, qty: 2, kind: 1},
      {name: 'Desk Lamp', price: 48, qty: 1, kind: 6},
    ],
    shippingFields: [
      {label: 'Full name', value: 'Alex Morgan'},
      {label: 'Street address', value: '12 Sample Street'},
      {label: 'City / postcode', value: 'Springfield 00000'},
    ],
    paymentFields: [
      {label: 'Card number', value: '•••• •••• •••• ••••'},
      {label: 'Expiry', value: '••/••'},
      {label: 'Security code', value: '•••'},
    ],
    buttonLabels: ['Continue to shipping', 'Continue to payment', 'Place order'],
    currency: '$',
    cartTitle: 'Your cart',
    totalLabel: 'Total',
    doneTitle: 'Order placed',
    doneText: 'A confirmation is on its way to your inbox.',
    hold: 54,
    background: '#EEF0F6',
    card: '#FFFFFF',
    ink: '#1B2233',
    accent: '#2F6BFF',
    startAt: 0,
  },
  propDocs: {
    steps: 'step names (2+). First = cart review, last = confirmation, the ones between are forms',
    items: 'cart lines [{name, price, qty?, src?, color?, kind?}] (first 5 shown; kind = procedural drawing 0-7 when no src)',
    shippingFields: 'form fields for the shipping step [{label, value}]',
    paymentFields: 'form fields for the payment step — keep these masked, never real card data',
    buttonLabels: 'primary button text per step',
    currency: 'currency prefix',
    cartTitle: 'heading of the cart step',
    totalLabel: 'label before the cart total',
    doneTitle: 'headline on the last step',
    doneText: 'sub-line on the last step',
    hold: 'frames each step stays on screen',
    background: "page colour or 'transparent'",
    card: 'panel colour',
    ink: 'text colour',
    accent: 'stepper, button and check colour',
    startAt: 'frame the flow starts',
  },
  component: CheckoutSteps,
  tags: ['checkout', 'ecommerce', 'stepper', 'payment', 'shipping', 'cart', 'form', 'ui', 'steps', 'store', 'retail', 'order'],
});
