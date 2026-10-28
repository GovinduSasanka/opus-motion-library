import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {backOut, easeOut3, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A thermal receipt printer: paper feeds up out of a slot one line at a time (line-feed steps), listing items, subtotal,
 * tax and total, then footer and barcode. Totals are computed from `items` ({name, price, qty?}).
 */
type Item = {name: string; price: number; qty?: number};
type Props = {
  storeName: string;
  address: string;
  items: Item[];
  currency: string;
  taxRate: number;
  taxLabel: string;
  totalLabel: string;
  footer: string;
  background: string;
  paper: string;
  ink: string;
  accent: string;
  printer: string;
  lineFrames: number;
  startAt: number;
  subtotalLabel?: string;
  printingLabel?: string;
};

type Line = {kind: 'title' | 'text' | 'sep' | 'item' | 'sum' | 'total' | 'bar' | 'gap'; l?: string; r?: string; h: number};

const ReceiptPrint: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('rcp');
  const items = (p.items || []).slice(0, 14);
  const money = (v: number) => `${p.currency}${v.toFixed(2)}`;
  const sub = items.reduce((a, it) => a + it.price * (it.qty ?? 1), 0);
  const tax = sub * p.taxRate;
  const total = sub + tax;

  // layout in local paper units (design width PW)
  const PW = 560;
  const fs = 25;
  const lh = 36;
  const pad = 34;
  const maxChars = Math.floor((PW - 2 * pad) / (fs * 0.6));
  const sep = '-'.repeat(maxChars);
  const lines: Line[] = [
    {kind: 'title', l: p.storeName, h: 56},
    {kind: 'text', l: p.address, h: lh},
    {kind: 'gap', h: 10},
    {kind: 'sep', l: sep, h: lh},
    ...items.map((it): Line => {
      const q = (it.qty ?? 1) > 1 ? `${it.qty}x ` : '';
      const price = money(it.price * (it.qty ?? 1));
      const room = maxChars - price.length - 1 - q.length;
      return {kind: 'item', l: q + it.name.slice(0, Math.max(3, room)), r: price, h: lh};
    }),
    {kind: 'sep', l: sep, h: lh},
    {kind: 'sum', l: p.subtotalLabel ?? 'SUBTOTAL', r: money(sub), h: lh},
    {kind: 'sum', l: p.taxLabel, r: money(tax), h: lh},
    {kind: 'gap', h: 6},
    {kind: 'total', l: p.totalLabel, r: money(total), h: 52},
    {kind: 'sep', l: sep, h: lh},
    {kind: 'text', l: p.footer, h: lh},
    {kind: 'gap', h: 8},
    {kind: 'bar', h: 84},
    {kind: 'gap', h: 24},
  ];
  const ys: number[] = [0];
  lines.forEach((ln) => ys.push(ys[ys.length - 1] + ln.h));
  const H = ys[ys.length - 1];

  // scale so the paper fits above the printer
  const slotY = h * (portrait ? 0.86 : 0.88);
  const pw = portrait ? w * 0.74 : Math.min(w * 0.3, 540 * u);
  const avail = slotY - h * 0.06;
  const sc = Math.min(pw / PW, avail / H);
  const cx = w / 2;

  // printed length: step per line with a quick ease
  const per = Math.max(2, p.lineFrames);
  const f = Math.max(0, frame - p.startAt);
  const k = Math.min(lines.length, Math.floor(f / per));
  const fr = f - k * per;
  const L = k >= lines.length ? H : ys[k] + (ys[k + 1] - ys[k]) * easeOut3(sseg(fr, 0, Math.min(per * 0.7, 6)));
  const totalIdx = lines.findIndex((l) => l.kind === 'total');
  const totalPrinted = L >= ys[totalIdx + 1] - 1;
  const shake = k < lines.length ? Math.sin(frame * 2.6) * 0.8 * u : 0;
  const enter = easeOut3(sseg(frame, 0, 18));
  const paperBg = p.paper;
  const zig = (x0: number, x1: number, y: number) => {
    let d = `M${x0} ${y + 10}`;
    const n = 22;
    for (let i = 0; i < n; i++) d += `L${x0 + ((i + 0.5) * (x1 - x0)) / n} ${y}L${x0 + ((i + 1) * (x1 - x0)) / n} ${y + 10}`;
    return d;
  };

  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? undefined : p.background}}>
      <Svg>
        <defs>
          <clipPath id={`${uid}-c`}>
            <rect x={0} y={0} width={w} height={slotY} />
          </clipPath>
          <linearGradient id={`${uid}-pr`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(p.printer, '#ffffff', 0.12)} />
            <stop offset="1" stopColor={mixHex(p.printer, '#000000', 0.35)} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${uid}-c)`} transform={`translate(${shake} 0)`}>
          {/* paper: content point at paper-y yy sits at slotY - (L - yy)*sc */}
          <g transform={`translate(${cx - (PW * sc) / 2} ${slotY - L * sc}) scale(${sc})`}>
            <path d={`${zig(0, PW, 0)}L${PW} ${H}L0 ${H}Z`} fill={paperBg} />
            <rect x={0} y={10} width={PW} height={H} fill={paperBg} />
            <rect x={0} y={10} width={14} height={H} fill="#000" opacity={0.04} />
            <g transform="translate(0 10)">
              {lines.map((ln, i) => {
                const y = ys[i];
                const base = y + ln.h * 0.7;
                if (ln.kind === 'gap') return null;
                if (ln.kind === 'title')
                  return (
                    <text key={i} x={PW / 2} y={y + 40} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={36} letterSpacing={3} fill={p.ink}>
                      {ln.l}
                    </text>
                  );
                if (ln.kind === 'bar') {
                  const bars: React.ReactNode[] = [];
                  let x = pad + 40;
                  let sd = 7;
                  while (x < PW - pad - 40) {
                    sd = (sd * 48271) % 2147483647;
                    const bwid = 2 + (sd % 4);
                    bars.push(<rect key={x} x={x} y={y + 6} width={bwid} height={ln.h - 12} fill={p.ink} />);
                    x += bwid + 2 + ((sd >> 3) % 4);
                  }
                  return <g key={i}>{bars}</g>;
                }
                if (ln.kind === 'text' || ln.kind === 'sep')
                  return (
                    <text key={i} x={PW / 2} y={base} textAnchor="middle" fontFamily={fonts.mono} fontSize={ln.kind === 'sep' ? fs : fs * 0.92} fill={ln.kind === 'sep' ? withAlpha(p.ink, 0.55) : p.ink}>
                      {ln.l}
                    </text>
                  );
                const big = ln.kind === 'total';
                const size = big ? 38 : fs;
                return (
                  <g key={i}>
                    {big ? <rect x={pad - 10} y={y + 2} width={PW - 2 * pad + 20} height={ln.h - 4} fill={p.ink} opacity={0.08 + 0.1 * (totalPrinted ? 1 : 0)} /> : null}
                    <text x={pad} y={big ? y + 38 : base} fontFamily={fonts.mono} fontWeight={big ? 700 : 400} fontSize={size} fill={p.ink}>
                      {ln.l}
                    </text>
                    <text x={PW - pad} y={big ? y + 38 : base} textAnchor="end" fontFamily={fonts.mono} fontWeight={big ? 700 : 400} fontSize={size} fill={big ? p.accent : p.ink}>
                      {ln.r}
                    </text>
                  </g>
                );
              })}
              {totalPrinted ? (
                <rect x={pad - 10} y={ys[totalIdx] + lines[totalIdx].h - 4} width={(PW - 2 * pad + 20) * backOut(sseg(f - totalIdx * per, per, per + 14))} height={4} fill={p.accent} />
              ) : null}
            </g>
          </g>
        </g>
        {/* printer body */}
        <g opacity={enter} transform={`translate(0 ${(1 - enter) * 40 * u})`}>
          <rect x={cx - pw * 0.78} y={slotY - 6 * u} width={pw * 1.56} height={h - slotY + 6 * u + 80 * u} rx={26 * u} fill={`url(#${uid}-pr)`} />
          <rect x={cx - pw * 0.6} y={slotY - 12 * u} width={pw * 1.2} height={16 * u} rx={8 * u} fill="#000" opacity={0.85} />
          <circle cx={cx + pw * 0.62} cy={slotY + 38 * u} r={9 * u} fill={k < lines.length && f > 0 ? p.accent : '#5A5F6B'} opacity={k < lines.length && f > 0 ? 0.6 + 0.4 * Math.sin(frame * 0.5) : 1} />
          <rect x={cx - pw * 0.6} y={slotY + 28 * u} width={pw * 0.3} height={20 * u} rx={5 * u} fill="#000" opacity={0.28} />
          <text x={cx - pw * 0.58} y={slotY + 44 * u} fontFamily={fonts.mono} fontSize={14 * u} fill="#fff" opacity={0.55} letterSpacing={2 * u}>
            {p.printingLabel}
          </text>
          <rect x={cx - pw * 0.78} y={slotY + 4 * u} width={pw * 1.56} height={3 * u} fill="#fff" opacity={0.18} />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const receiptPrint = defineMotion<Props>({
  id: 'receipt-print',
  title: 'Receipt print',
  category: 'document',
  description:
    'A thermal receipt printer feeds paper up out of its slot one line-feed at a time: store header, itemised lines, computed subtotal / tax / total (highlighted), footer and a barcode.',
  source: ['original (round 3)'],
  useFor: 'Order confirmations, expense / cost breakdowns, "the bill came to" beats, pricing explainers, shopping and fintech promos.',
  durationInFrames: 240,
  defaultProps: {
    storeName: 'CORNER CAFE',
    address: '12 Main Street',
    items: [
      {name: 'Flat white', price: 4.5, qty: 2},
      {name: 'Almond croissant', price: 3.8},
      {name: 'Cold brew', price: 4.2},
      {name: 'Avocado toast', price: 9.5},
    ],
    currency: '$',
    taxRate: 0.08,
    taxLabel: 'TAX 8%',
    totalLabel: 'TOTAL',
    footer: 'THANK YOU!',
    background: '#E7E2D8',
    paper: '#FBFAF4',
    ink: '#24232B',
    accent: '#E8412A',
    printer: '#3A3D4A',
    lineFrames: 8,
    startAt: 18,
    subtotalLabel: 'SUBTOTAL',
    printingLabel: 'PRINTING',
  },
  propDocs: {
    storeName: 'header line (shop / company)',
    address: 'line under the header',
    items: 'array of {name, price, qty?}; subtotal, tax and total are computed',
    currency: 'currency symbol / prefix',
    taxRate: 'tax fraction (0.08 = 8%, 0 for none)',
    taxLabel: 'label of the tax line',
    totalLabel: 'label of the total line',
    footer: 'line under the total',
    background: "backdrop colour or 'transparent'",
    paper: 'paper colour',
    ink: 'print colour',
    accent: 'total amount / underline / status light colour',
    printer: 'printer body colour',
    lineFrames: 'frames per printed line (lower = faster)',
    startAt: 'frame printing starts',
    subtotalLabel: 'label of the subtotal line',
    printingLabel: 'small status text on the printer body',
  },
  component: ReceiptPrint,
  tags: ['receipt', 'invoice', 'bill', 'order', 'printer', 'ecommerce', 'checkout', 'expenses', 'total', 'document', 'thermal'],
});
