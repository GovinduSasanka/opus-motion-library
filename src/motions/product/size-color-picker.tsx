import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {ease, lerp} from '../../core/ease';
import {Thumb, bgOf, money, onColor, resolveSrc} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Variant picker: colour swatches and size chips are tapped in turn; the product picture re-tints, the selected chip
 * fills, and the price rolls to the new value (size surcharges). The add button wakes up once a size is chosen.
 */
type Colour = {name: string; hex: string};
type Size = {label: string; delta?: number};
type Props = {
  productName: string;
  currency: string;
  basePrice: number;
  colors: Colour[];
  sizes: Size[];
  colorPicks: number[];
  sizePicks: number[];
  images: string[];
  productKind: number;
  colorLabel: string;
  sizeLabel: string;
  buttonLabel: string;
  selectLabel: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  startAt: number;
};

const C0 = 30;
const S0 = 52;
const STEP = 44;

const SizeColorPicker: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const colors = p.colors.length ? p.colors : [{name: 'Default', hex: '#3D85C6'}];
  const sizes = p.sizes.length ? p.sizes : [{label: 'One size'}];

  const cEv = p.colorPicks.map((idx, i) => ({at: C0 + i * STEP, idx: Math.min(colors.length - 1, Math.max(0, Math.round(idx)))}));
  const sEv = p.sizePicks.map((idx, i) => ({at: S0 + i * STEP, idx: Math.min(sizes.length - 1, Math.max(0, Math.round(idx)))}));
  const lastC = cEv.filter((e) => t >= e.at).pop();
  const prevC = cEv.filter((e) => t >= e.at).slice(-2, -1)[0];
  const lastS = sEv.filter((e) => t >= e.at).pop();
  const prevS = sEv.filter((e) => t >= e.at).slice(-2, -1)[0];
  const cSel = lastC ? lastC.idx : 0;
  const cPrev = prevC ? prevC.idx : 0;
  const cMix = lastC ? ease.inOut(sseg(t, lastC.at, lastC.at + 12)) : 1;
  const sSel = lastS ? lastS.idx : -1;
  const sPrev = prevS ? prevS.idx : -1;
  const sMix = lastS ? ease.out(sseg(t, lastS.at, lastS.at + 10)) : 1;
  const colorNow = mixHex(colors[cPrev].hex, colors[cSel].hex, cMix);
  const deltaOf = (i: number) => (i >= 0 ? sizes[i].delta ?? 0 : 0);
  const priceNow = p.basePrice + deltaOf(sSel);
  const pricePrev = p.basePrice + deltaOf(sPrev);
  const roll = lastS ? ease.out(sseg(t, lastS.at + 2, lastS.at + 14)) : 1;
  const changed = priceNow !== pricePrev;

  // layout
  const pw = portrait ? w * 0.78 : Math.min(h * 0.7, w * 0.32);
  const iw = portrait ? w * 0.86 : Math.min(w * 0.34, 640 * u);
  const gap = portrait ? 56 * u : w * 0.05;
  const infoH = (portrait ? 700 : 600) * u;
  const px = portrait ? (w - pw) / 2 : (w - (pw + gap + iw)) / 2;
  const blockH = portrait ? pw + gap + infoH : Math.max(pw, infoH);
  const py = portrait ? (h - blockH) / 2 : (h - pw) / 2;
  const ix = portrait ? (w - iw) / 2 : px + pw + gap;
  const iy = portrait ? py + pw + gap : (h - infoH) / 2;
  const enter = ease.out(sseg(t, 0, 20));
  const enter2 = ease.out(sseg(t, 6, 26));
  const popC = lastC ? 1 + 0.05 * Math.sin(Math.PI * sseg(t, lastC.at, lastC.at + 14)) : 1;

  const sw = 68 * u;
  const chipW = 92 * u;
  const chipH = 64 * u;

  const tap = (at: number, cx: number, cy: number, r: number) => {
    const d = sseg(t, at - 2, at + 14);
    if (d <= 0 || d >= 1) return null;
    return <div style={{position: 'absolute', left: cx - r * (0.6 + d), top: cy - r * (0.6 + d), width: r * 2 * (0.6 + d), height: r * 2 * (0.6 + d), borderRadius: '50%', background: withAlpha(p.accent, 0.3 * (1 - d))}} />;
  };

  const btnReady = sSel >= 0;
  const btnPulse = btnReady && lastS ? 1 + 0.035 * Math.sin(Math.max(0, t - lastS.at - 12) * 0.28) * sseg(t, lastS.at + 12, lastS.at + 20) : 1;
  const imgFor = (ci: number) => p.images[ci];
  const hasImgs = p.images.some(Boolean);

  const rowY0 = 168 * u;
  const colorY = rowY0 + 104 * u;
  const sizeY = colorY + 190 * u;
  const btnY = sizeY + 140 * u;

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink}}>
      {/* product panel */}
      <div style={{position: 'absolute', left: px, top: py + (1 - enter) * 30 * u, width: pw, height: pw, opacity: enter, borderRadius: pw * 0.06, overflow: 'hidden', boxShadow: `0 ${24 * u}px ${70 * u}px ${withAlpha(p.ink, 0.16)}`, background: p.card}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${popC})`}}>
          <Thumb w={pw} radius={0} kind={p.productKind} color={colorNow} tint={mixHex(colorNow, '#ffffff', 0.82)} />
        </div>
        {hasImgs
          ? [cPrev, cSel].map((ci, k) => {
              const s = imgFor(ci);
              if (!s) return null;
              const o = k === 0 ? (cPrev === cSel ? 1 : 1 - cMix) : cMix;
              return <Img key={k} src={resolveSrc(s)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: o}} />;
            })
          : null}
        <div style={{position: 'absolute', left: pw * 0.05, top: pw * 0.05, padding: `${8 * u}px ${18 * u}px`, borderRadius: 99, background: withAlpha(p.card, 0.85), fontWeight: 800, fontSize: 22 * u}}>{colors[cSel].name}</div>
      </div>

      {/* info */}
      <div style={{position: 'absolute', left: ix, top: iy + (1 - enter2) * 30 * u, width: iw, height: infoH, opacity: enter2}}>
        <div style={{fontFamily: fonts.display, fontSize: (portrait ? 58 : 54) * u, lineHeight: 1.05}}>{p.productName}</div>

        {/* price roll */}
        <div style={{position: 'absolute', left: 0, top: 92 * u, height: 84 * u, overflow: 'hidden', display: 'flex', alignItems: 'flex-start', gap: 20 * u}}>
          <div style={{position: 'relative', height: 84 * u, minWidth: 200 * u}}>
            {changed && roll < 1 ? (
              <div style={{position: 'absolute', left: 0, top: -roll * 84 * u, fontFamily: fonts.display, fontSize: 70 * u, color: p.accent, opacity: 1 - roll, whiteSpace: 'nowrap'}}>{money(pricePrev, p.currency)}</div>
            ) : null}
            <div style={{position: 'absolute', left: 0, top: changed && roll < 1 ? (1 - roll) * 84 * u : 0, fontFamily: fonts.display, fontSize: 70 * u, color: p.accent, opacity: changed && roll < 1 ? roll : 1, whiteSpace: 'nowrap'}}>{money(priceNow, p.currency)}</div>
          </div>
        </div>
        {deltaOf(sSel) > 0 ? (
          <div style={{position: 'absolute', left: 250 * u, top: 114 * u, padding: `${6 * u}px ${16 * u}px`, borderRadius: 99, background: withAlpha(p.accent, 0.14), color: p.accent, fontWeight: 800, fontSize: 22 * u, opacity: sMix, transform: `scale(${lerp(0.7, 1, sMix)})`}}>{`+${money(deltaOf(sSel), p.currency, deltaOf(sSel) % 1 === 0 ? 0 : 2)}`}</div>
        ) : null}

        {/* colours */}
        <div style={{position: 'absolute', left: 0, top: colorY - 42 * u, fontSize: 24 * u, fontWeight: 700}}>
          <span style={{opacity: 0.5}}>{`${p.colorLabel}: `}</span>
          {colors[cSel].name}
        </div>
        <div style={{position: 'absolute', left: 0, top: colorY, display: 'flex', gap: 22 * u}}>
          {colors.map((c, i) => {
            const on = (i === cSel ? cMix : 0) + (i === cPrev && cPrev !== cSel ? 1 - cMix : 0);
            const onAmt = i === cSel ? Math.max(cMix, lastC ? 0 : 1) : i === cPrev && lastC ? 1 - cMix : 0;
            void on;
            return (
              <div key={i} style={{position: 'relative', width: sw, height: sw}}>
                <div style={{position: 'absolute', inset: -7 * u, borderRadius: '50%', border: `${4 * u}px solid ${p.ink}`, opacity: onAmt, transform: `scale(${lerp(1.2, 1, onAmt)})`}} />
                <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: c.hex, border: `${2 * u}px solid ${withAlpha(p.ink, 0.15)}`, boxSizing: 'border-box'}} />
                {cEv.some((e) => e.idx === i) ? cEv.filter((e) => e.idx === i).map((e, k) => <React.Fragment key={k}>{tap(e.at, sw / 2, sw / 2, sw * 0.5)}</React.Fragment>) : null}
              </div>
            );
          })}
        </div>

        {/* sizes */}
        <div style={{position: 'absolute', left: 0, top: sizeY - 42 * u, fontSize: 24 * u, fontWeight: 700}}>
          <span style={{opacity: 0.5}}>{`${p.sizeLabel}: `}</span>
          {sSel >= 0 ? sizes[sSel].label : '—'}
        </div>
        <div style={{position: 'absolute', left: 0, top: sizeY, display: 'flex', gap: 16 * u}}>
          {sizes.map((s, i) => {
            const onAmt = i === sSel ? sMix : i === sPrev && sPrev !== sSel ? 1 - sMix : 0;
            return (
              <div key={i} style={{position: 'relative', width: chipW, height: chipH, borderRadius: 16 * u, boxSizing: 'border-box', border: `${2.5 * u}px solid ${mixHex(mixHex(p.card, p.ink, 0.2), p.ink, onAmt)}`, background: mixHex(p.card, p.ink, onAmt), color: onAmt > 0.5 ? onColor(p.ink) : p.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26 * u, overflow: 'visible', transform: `scale(${1 + 0.07 * Math.sin(Math.PI * (i === sSel ? sseg(t, lastS ? lastS.at : 0, (lastS ? lastS.at : 0) + 12) : 0))})`}}>
                {s.label}
                {sEv.filter((e) => e.idx === i).map((e, k) => (
                  <React.Fragment key={k}>{tap(e.at, chipW / 2, chipH / 2, chipH * 0.7)}</React.Fragment>
                ))}
              </div>
            );
          })}
        </div>

        {/* button */}
        <div style={{position: 'absolute', left: 0, top: btnY, width: iw, height: 84 * u, borderRadius: 24 * u, background: btnReady ? p.accent : mixHex(p.card, p.ink, 0.12), color: btnReady ? onColor(p.accent) : withAlpha(p.ink, 0.45), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30 * u, transform: `scale(${btnPulse})`, boxShadow: btnReady ? `0 ${12 * u}px ${30 * u}px ${withAlpha(p.accent, 0.35)}` : 'none'}}>
          {btnReady ? p.buttonLabel : p.selectLabel}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const sizeColorPicker = defineMotion<Props>({
  id: 'size-color-picker',
  title: 'Size & colour variant picker',
  category: 'product',
  description:
    'A product picture with colour swatches and size chips that are tapped in turn: the picture re-tints, the chosen chip fills, the price rolls to the new value and the add button wakes up.',
  source: ['original (round 3)'],
  useFor: 'Product-page UI demos, variant selection explainers, fashion / merch store promos — set the swatches, sizes, surcharges, price and optional per-colour images.',
  durationInFrames: 150,
  defaultProps: {
    productName: 'Everyday Tee',
    currency: '$',
    basePrice: 28,
    colors: [
      {name: 'Coral', hex: '#E07A5F'},
      {name: 'Sage', hex: '#81B29A'},
      {name: 'Ocean', hex: '#3D85C6'},
      {name: 'Ink', hex: '#2F4858'},
    ],
    sizes: [{label: 'S'}, {label: 'M'}, {label: 'L', delta: 2}, {label: 'XL', delta: 4}],
    colorPicks: [1, 3],
    sizePicks: [1, 3],
    images: [],
    productKind: 7,
    colorLabel: 'Colour',
    sizeLabel: 'Size',
    buttonLabel: 'Add to cart',
    selectLabel: 'Select a size',
    background: '#F2F0EB',
    card: '#FFFFFF',
    ink: '#1D1B24',
    accent: '#E8553A',
    startAt: 0,
  },
  propDocs: {
    productName: 'product title',
    currency: 'currency prefix',
    basePrice: 'price before size surcharges',
    colors: 'swatches [{name, hex}] (the procedural product takes the swatch colour)',
    sizes: 'size chips [{label, delta?}] — delta = price surcharge',
    colorPicks: 'swatch indexes tapped over time (one every ~1.5 s)',
    sizePicks: 'size indexes tapped over time',
    images: 'optional per-colour product images (public/ path or https URL, same order as colors); empty = procedural',
    productKind: 'procedural drawing: 0 bag, 1 mug, 2 headphones, 3 box, 4 bottle, 5 watch, 6 lamp, 7 t-shirt',
    colorLabel: 'label before the colour name',
    sizeLabel: 'label before the size',
    buttonLabel: 'button text once a size is chosen',
    selectLabel: 'button text before a size is chosen',
    background: "page colour or 'transparent'",
    card: 'panel and chip colour',
    ink: 'text colour',
    accent: 'price and button colour',
    startAt: 'frame the scene starts',
  },
  component: SizeColorPicker,
  tags: ['ecommerce', 'variant', 'size', 'color', 'swatch', 'picker', 'product page', 'price', 'fashion', 'store', 'retail', 'ui', 'configurator'],
});
