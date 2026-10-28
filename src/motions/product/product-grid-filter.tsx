import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp} from '../../core/ease';
import {ART_COLORS, Thumb, bgOf, fitFs, money, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A product grid with filter chips: as the active chip changes, cards that match glide to their new slots, the others
 * shrink away and new ones pop in — the grid re-flows. Products, categories, prices, images and colours are props.
 */
type Product = {name: string; price: number; category: string; color?: string; src?: string; kind?: number};
type Props = {
  filters: string[];
  products: Product[];
  sequence: number[];
  currency: string;
  countLabel: string;
  columns: number;
  hold: number;
  background: string;
  card: string;
  ink: string;
  accent: string;
  startAt: number;
};

const CHANGE0 = 30;
const XF = 22;

const ProductGridFilter: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const filters = p.filters.length ? p.filters : ['All'];
  const seq = p.sequence.length ? p.sequence.map((i) => Math.min(Math.max(0, Math.round(i)), filters.length - 1)) : [0];
  const hold = Math.max(XF + 8, p.hold);
  const prods = p.products;
  const N = prods.length;

  // which sequence step are we on?
  const k = t < CHANGE0 ? 0 : Math.min(seq.length - 1, 1 + Math.floor((t - CHANGE0) / hold));
  const lt = k === 0 ? 99 : t - (CHANGE0 + (k - 1) * hold);
  const curF = seq[k];
  const prevF = seq[Math.max(0, k - 1)];

  const matches = (pr: Product, fi: number) => fi === 0 || pr.category.toLowerCase() === filters[fi].toLowerCase();
  const slotsFor = (fi: number) => {
    let s = 0;
    return prods.map((pr) => (matches(pr, fi) ? s++ : -1));
  };
  const curSlots = slotsFor(curF);
  const prevSlots = slotsFor(prevF);
  const curCount = curSlots.filter((s) => s >= 0).length;

  // layout
  const cols = p.columns > 0 ? Math.round(p.columns) : portrait ? 3 : 4;
  const rowsAll = Math.ceil(Math.max(1, N) / cols);
  const gridW = portrait ? w * 0.9 : Math.min(w * 0.82, 1500 * u);
  const gapX = (portrait ? 22 : 26) * u;
  const cw = (gridW - gapX * (cols - 1)) / cols;
  const ch = cw * (portrait ? 1.32 : 1.14);
  const chipH = 62 * u;
  const barH = chipH + 34 * u;
  const gridH = rowsAll * ch + (rowsAll - 1) * gapX;
  const blockH = barH + gridH;
  const bx = (w - gridW) / 2;
  const by = (h - blockH) / 2;
  const slotPos = (s: number) => ({x: bx + (s % cols) * (cw + gapX), y: by + barH + Math.floor(s / cols) * (ch + gapX)});

  const enter = ease.out(sseg(t, 0, 20));
  const pad = cw * 0.06;

  // chips
  const chipFs = 25 * u;
  const chipW = (s: string) => s.length * chipFs * 0.6 + 52 * u;
  let chipX = 0;
  const chipLayout = filters.map((f) => {
    const x = chipX;
    chipX += chipW(f) + 14 * u;
    return x;
  });

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink}}>
      <div style={{position: 'absolute', left: bx, top: by + (1 - enter) * 20 * u, width: gridW, height: chipH, opacity: enter}}>
        {filters.map((f, i) => {
          const active = i === curF;
          const wasActive = i === prevF && k > 0;
          const a = active ? ease.out(sseg(lt, 0, 10)) : wasActive ? 1 - ease.out(sseg(lt, 0, 10)) : 0;
          const bump = active && k > 0 ? 1 + 0.08 * Math.sin(Math.PI * sseg(lt, 0, 14)) : 1;
          const baseActive = k === 0 && i === curF ? 1 : 0;
          const aa = Math.max(a, baseActive);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: chipLayout[i],
                top: 0,
                width: chipW(f),
                height: chipH,
                borderRadius: chipH / 2,
                boxSizing: 'border-box',
                background: mixHex(p.card, p.accent, aa),
                color: aa > 0.5 ? onColor(p.accent) : p.ink,
                border: `${2.5 * u}px solid ${mixHex(mixHex(p.card, p.ink, 0.16), p.accent, aa)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: chipFs,
                transform: `scale(${bump})`,
              }}
            >
              {f}
            </div>
          );
        })}
        <div style={{position: 'absolute', right: 0, top: 0, height: chipH, display: 'flex', alignItems: 'center', fontSize: 24 * u, fontWeight: 600, opacity: 0.55}}>{`${curCount} ${p.countLabel}`}</div>
      </div>

      {prods.map((pr, i) => {
        const cs = curSlots[i];
        const ps = prevSlots[i];
        const stag = i * 1.4;
        const pp = k === 0 ? 1 : ease.out(sseg(lt, stag, stag + XF));
        const wasVis = k === 0 ? cs >= 0 : ps >= 0;
        const isVis = cs >= 0;
        let slot: number;
        let vis: number;
        if (isVis && wasVis) {
          slot = -1;
          vis = 1;
        } else if (isVis) {
          slot = cs;
          vis = pp;
        } else {
          slot = ps;
          vis = k === 0 ? 0 : 1 - pp;
        }
        if (vis <= 0.003) return null;
        let x: number;
        let y: number;
        if (slot === -1) {
          const a = slotPos(k === 0 ? cs : ps);
          const b = slotPos(cs);
          x = lerp(a.x, b.x, pp);
          y = lerp(a.y, b.y, pp);
        } else {
          const a = slotPos(slot);
          x = a.x;
          y = a.y;
        }
        const sc = lerp(0.72, 1, ease.out(vis));
        const color = pr.color ?? ART_COLORS[i % ART_COLORS.length];
        const kind = pr.kind ?? i;
        const tw = cw - pad * 2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y + (1 - enter) * 30 * u,
              width: cw,
              height: ch,
              opacity: Math.min(vis, enter),
              transform: `scale(${sc})`,
              borderRadius: cw * 0.07,
              background: p.card,
              boxShadow: `0 ${cw * 0.03}px ${cw * 0.09}px ${withAlpha(p.ink, 0.12)}`,
              boxSizing: 'border-box',
              padding: pad,
            }}
          >
            <Thumb w={tw} h={tw * (portrait ? 0.95 : 0.78)} radius={cw * 0.045} kind={kind} color={color} src={pr.src} />
            <div style={{marginTop: cw * 0.05, fontWeight: 800, fontSize: fitFs(pr.name, tw, cw * 0.09, 0.55), whiteSpace: 'nowrap', overflow: 'hidden'}}>{pr.name}</div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: cw * 0.025}}>
              <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: cw * 0.085, color: p.accent}}>{money(pr.price, p.currency)}</div>
              <div style={{fontSize: cw * 0.058, fontWeight: 600, opacity: 0.5}}>{pr.category}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const productGridFilter = defineMotion<Props>({
  id: 'product-grid-filter',
  title: 'Product grid with filter chips (re-flow)',
  category: 'product',
  description:
    'A grid of product cards with filter chips on top; as the active chip changes the matching cards glide to new slots, the others shrink away and the count updates, then it returns to All.',
  source: ['original (round 3)'],
  useFor: 'Catalogue / store / marketplace UI demos, "shop by category" beats, filter and search feature explainers — set the products, categories, prices and images.',
  durationInFrames: 210,
  defaultProps: {
    filters: ['All', 'Bags', 'Mugs', 'Audio'],
    products: [
      {name: 'Canvas Tote', price: 24, category: 'Bags', color: '#E07A5F', kind: 0},
      {name: 'Stone Mug', price: 16, category: 'Mugs', color: '#3D85C6', kind: 1},
      {name: 'Studio Headset', price: 89, category: 'Audio', color: '#2F4858', kind: 2},
      {name: 'Daypack', price: 52, category: 'Bags', color: '#81B29A', kind: 0},
      {name: 'Enamel Mug', price: 14, category: 'Mugs', color: '#E9A23B', kind: 1},
      {name: 'Pocket Buds', price: 59, category: 'Audio', color: '#9B7EDE', kind: 2},
      {name: 'Weekender', price: 74, category: 'Bags', color: '#C0626F', kind: 0},
      {name: 'Travel Mug', price: 21, category: 'Mugs', color: '#5BA8A0', kind: 1},
    ],
    sequence: [0, 1, 2, 3, 0],
    currency: '$',
    countLabel: 'products',
    columns: 0,
    hold: 36,
    background: '#F2F0EB',
    card: '#FFFFFF',
    ink: '#1D1B24',
    accent: '#E8553A',
    startAt: 0,
  },
  propDocs: {
    filters: 'chip labels; index 0 is the "show all" chip',
    products: 'cards [{name, price, category, color?, src?, kind?}] — category matches a chip label (case-insensitive)',
    sequence: 'which chip (index) is active over time; first entry is the starting state',
    currency: 'currency prefix',
    countLabel: 'word after the result count (top right)',
    columns: 'grid columns; 0 = automatic (4 landscape / 3 portrait)',
    hold: 'frames each filter state lasts',
    background: "page colour or 'transparent'",
    card: 'card and inactive chip colour',
    ink: 'text colour',
    accent: 'price and active chip colour',
    startAt: 'frame the grid starts entering',
  },
  component: ProductGridFilter,
  tags: ['ecommerce', 'product grid', 'filter', 'chips', 'catalogue', 'store', 'shop', 'retail', 'ui', 'marketplace', 'category'],
});
