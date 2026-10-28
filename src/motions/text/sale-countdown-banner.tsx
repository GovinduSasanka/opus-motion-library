import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {SANS, backOut, bgOf, mixHex, starPath, withAlpha, wrapText} from '../../core/r3-social';
import {useSafeId} from '../../core/image-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {estWidth} from '../../core/text-kit';

/**
 * Promo banner: a headline pill, a huge discount that slams in, a subtitle, a flip-style countdown timer (hours / minutes /
 * seconds, ticking down with a digit slide) and a pulsing call-to-action pill, over a scrolling ribbon. Landscape / square lay the
 * copy left and the timer + CTA right; portrait stacks them.
 */
type Props = {
  headline: string;
  discount: string;
  discountLabel: string;
  subtitle: string;
  timerLabel: string;
  unitLabels: string[];
  timerSeconds: number;
  tickSpeed: number;
  ctaLabel: string;
  ribbon: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  startAt: number;
};

const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

const SaleCountdownBanner: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('scb');
  const f = Math.max(0, frame - p.startAt);
  const bg = p.background === 'transparent' ? '#17132B' : p.background;
  const wide = !portrait;
  const s = wide ? Math.min(u, w / 1500) : u;

  // layout anchors (px)
  const L = wide
    ? {
        colX: w * 0.075,
        colW: w * 0.46,
        head: h * 0.2,
        discBase: h * 0.58,
        sub: h * 0.7,
        tCx: w * (w < h * 1.4 ? 0.745 : 0.77),
        tLabel: h * 0.28,
        tY: h * 0.34,
        ctaY: h * 0.72,
        ctaCx: w * (w < h * 1.4 ? 0.745 : 0.77),
        ribbonY: h * 0.9,
      }
    : {
        colX: w * 0.07,
        colW: w * 0.86,
        head: h * 0.1,
        discBase: h * 0.35,
        sub: h * 0.43,
        tCx: w / 2,
        tLabel: h * 0.525,
        tY: h * 0.55,
        ctaY: h * 0.77,
        ctaCx: w / 2,
        ribbonY: h * 0.9,
      };
  const k = wide ? s : u * 1.0;

  // --- entrance staging
  const eHead = backOut(prog(f, 4, 20, ease.linear), 1.6);
  const eDisc = prog(f, 14, 34, ease.linear);
  const discScale = 1 + (1 - backOut(eDisc, 2.2)) * 0.9;
  const eSub = ease.out(prog(f, 34, 52, ease.linear));
  const eTimer = (i: number) => backOut(prog(f, 40 + i * 6, 58 + i * 6, ease.linear), 1.6);
  const eCta = backOut(prog(f, 62, 82, ease.linear), 1.8);
  const eRibbon = ease.out(prog(f, 0, 24, ease.linear));

  // --- timer
  const rem = Math.max(0, p.timerSeconds - (f / 30) * Math.max(0, p.tickSpeed));
  const units = [
    {Q: 3600, M: 100},
    {Q: 60, M: 60},
    {Q: 1, M: 60},
  ];
  const flipDur = Math.min(8, (30 / Math.max(0.01, p.tickSpeed)) * 0.6);
  const val = (r: number, Q: number, M: number) => Math.floor(r / Q) % M;
  const unitState = units.map(({Q, M}) => {
    const q = rem / Q;
    const cur = val(rem, Q, M);
    const elapsedF = (1 - (q - Math.floor(q))) * Q * (30 / Math.max(0.01, p.tickSpeed));
    const t = rem <= 0 || f < 50 ? 1 : flipDur < 2 ? 1 : ease.out(Math.min(1, elapsedF / flipDur));
    const old = (cur + 1) % M;
    return {cur, old, t};
  });
  const urgent = rem < 600;

  // --- discount sizing (display caps are wide: widen the estimate)
  const DW = (t: string, size: number, tr = 0) => estWidth(t, size, 'display', tr) * 1.2;
  const dFs0 = (wide ? 430 : 470) * k;
  const labRatio = 0.42;
  const gapD = 0.06;
  const dFs = Math.min(dFs0, (L.colW * 0.97) / (DW(p.discount, 1) + gapD + DW(p.discountLabel, labRatio)));
  const dW = DW(p.discount, dFs);
  const labFs = dFs * labRatio;
  const fitK = 1;

  // --- headline pill
  const headFs = 40 * k;
  const headW = DW(p.headline.toUpperCase(), headFs, 0.12) + 100 * k;

  // --- CTA
  const ctaFs = 50 * k;
  const ctaW = Math.max(estWidth(p.ctaLabel, ctaFs, 'sans') * 1.18 + 210 * k, 400 * k);
  const ctaH = 118 * k;
  const pulse = 1 + 0.035 * Math.sin(Math.max(0, f - 80) * 0.2) * (f > 80 ? 1 : 0);
  const shine = ((f - 90) % 70) / 70;

  // --- timer box
  const bw = (wide ? 188 : 250) * k;
  const bh = (wide ? 200 : 250) * k;
  const gapB = 30 * k;
  const tTotal = bw * 3 + gapB * 2;

  // ribbon
  const ribbonH = 76 * k;
  const unitTxt = `${p.ribbon.toUpperCase()}   `;
  const ribbonFs = 36 * k;
  const unitW = Math.max(200, DW(unitTxt, ribbonFs, 0.1) * 1.18);
  const reps = Math.ceil((w + unitW) / unitW) + 1;
  const scroll = (f * 3.2 * k) % unitW;

  // stripe backdrop
  const stripeX = wide ? w * 0.04 : -w * 0.1;

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        <defs>
          <pattern id={`${uid}-st`} width={44 * k} height={44 * k} patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <rect width={44 * k} height={20 * k} fill={withAlpha('#ffffff', 0.04)} />
          </pattern>
          <clipPath id={`${uid}-rib`}>
            <rect x={0} y={L.ribbonY} width={w} height={ribbonH} />
          </clipPath>
          <linearGradient id={`${uid}-glow`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={p.accent} stopOpacity={0.28} />
            <stop offset="1" stopColor={p.accent2} stopOpacity={0.12} />
          </linearGradient>
        </defs>

        {/* backdrop: diagonal stripes + a soft glow block behind the discount */}
        <rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-st)`} opacity={0.9} />
        <g opacity={ease.out(prog(f, 0, 30, ease.linear))}>
          <path d={`M${stripeX} ${L.head - 90 * k} L${L.colX + L.colW + 60 * k} ${L.head - 130 * k} L${L.colX + L.colW} ${L.sub + 70 * k} L${stripeX} ${L.sub + 110 * k}Z`} fill={`url(#${uid}-glow)`} />
        </g>

        {/* headline pill */}
        <g transform={`translate(${L.colX} ${L.head}) scale(${eHead}) translate(${-L.colX} ${-L.head})`} opacity={Math.min(1, eHead * 2)}>
          <rect x={L.colX} y={L.head - headFs * 1.05} width={headW} height={headFs * 1.7} rx={headFs * 0.85} fill={p.accent2} />
          <path d={starPath(L.colX + 42 * k, L.head - headFs * 0.2, headFs * 0.42)} fill={p.ink} />
          <text x={L.colX + 74 * k} y={L.head + headFs * 0.1} fontFamily={fonts.display} fontSize={headFs} letterSpacing={headFs * 0.12} fill={p.ink}>
            {p.headline.toUpperCase()}
          </text>
        </g>

        {/* discount */}
        <g
          transform={`translate(${L.colX} ${L.discBase}) scale(${discScale * fitK}) rotate(${(1 - eDisc) * -4} 0 ${-dFs * 0.35}) translate(${-L.colX} ${-L.discBase})`}
          opacity={Math.min(1, eDisc * 3)}
        >
          <text x={L.colX + 8 * k} y={L.discBase + 10 * k} fontFamily={fonts.display} fontSize={dFs} fill={withAlpha('#000000', 0.35)}>
            {p.discount}
          </text>
          <text x={L.colX} y={L.discBase} fontFamily={fonts.display} fontSize={dFs} fill={p.accent}>
            {p.discount}
          </text>
          <text x={L.colX + dW + dFs * gapD} y={L.discBase - dFs * 0.1} fontFamily={fonts.display} fontSize={labFs} fill={p.ink}>
            {p.discountLabel}
          </text>
        </g>

        {/* subtitle */}
        {(() => {
          const sf = (wide ? 44 : 50) * k;
          const lines = wrapText(p.subtitle, sf, L.colW, 'sans', 2);
          return (
            <g opacity={eSub} transform={`translate(0 ${(1 - eSub) * 22 * k})`}>
              {lines.map((ln, i) => (
                <text key={i} x={L.colX} y={L.sub + i * sf * 1.25} fontFamily={SANS} fontWeight={600} fontSize={sf} fill={p.ink} opacity={0.88}>
                  {ln}
                </text>
              ))}
            </g>
          );
        })()}

        {/* timer */}
        <text x={L.tCx} y={L.tLabel} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36 * k} letterSpacing={6 * k} fill={p.ink} opacity={0.75 * ease.out(prog(f, 36, 52, ease.linear))}>
          {p.timerLabel.toUpperCase()}
        </text>
        {unitState.map((st, i) => {
          const x0 = L.tCx - tTotal / 2 + i * (bw + gapB);
          const y0 = L.tY;
          const e = eTimer(i);
          const urgentCol = urgent ? mixHex(p.ink, p.accent2, 0.5 + 0.5 * Math.sin(f * 0.3)) : p.ink;
          const fs = (wide ? 118 : 150) * k;
          const lab = p.unitLabels?.[i] ?? ['Hours', 'Min', 'Sec'][i];
          return (
            <g key={i} transform={`translate(${x0 + bw / 2} ${y0 + bh / 2}) scale(${e}) translate(${-(x0 + bw / 2)} ${-(y0 + bh / 2)})`} opacity={Math.min(1, e * 2)}>
              <clipPath id={`${uid}-bx${i}`}>
                <rect x={x0} y={y0} width={bw} height={bh} rx={24 * k} />
              </clipPath>
              <rect x={x0} y={y0 + 8 * k} width={bw} height={bh} rx={24 * k} fill="#000" opacity={0.35} />
              <rect x={x0} y={y0} width={bw} height={bh} rx={24 * k} fill={mixHex(bg, '#ffffff', 0.12)} stroke={withAlpha(p.ink, 0.18)} strokeWidth={2 * k} />
              <g clipPath={`url(#${uid}-bx${i})`}>
                <text x={x0 + bw / 2} y={y0 + bh * 0.5 + fs * 0.36 + (1 - st.t) * -bh * 0.5} textAnchor="middle" fontFamily={fonts.display} fontSize={fs} fill={urgentCol} opacity={st.t < 1 ? 1 - st.t : 0}>
                  {pad2(st.old)}
                </text>
                <text x={x0 + bw / 2} y={y0 + bh * 0.5 + fs * 0.36 + (1 - st.t) * bh * 0.5} textAnchor="middle" fontFamily={fonts.display} fontSize={fs} fill={urgentCol} opacity={st.t}>
                  {pad2(st.cur)}
                </text>
                <rect x={x0} y={y0} width={bw} height={bh * 0.5} fill="#fff" opacity={0.05} />
                <rect x={x0} y={y0 + bh * 0.5 - 1.5 * k} width={bw} height={3 * k} fill="#000" opacity={0.4} />
              </g>
              <text x={x0 + bw / 2} y={y0 + bh + 44 * k} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={28 * k} fill={p.ink} opacity={0.6}>
                {lab}
              </text>
              {i < 2 && (
                <g opacity={0.8}>
                  <circle cx={x0 + bw + gapB / 2} cy={y0 + bh * 0.38} r={5 * k} fill={p.ink} />
                  <circle cx={x0 + bw + gapB / 2} cy={y0 + bh * 0.62} r={5 * k} fill={p.ink} />
                </g>
              )}
            </g>
          );
        })}

        {/* call to action */}
        <g transform={`translate(${L.ctaCx} ${L.ctaY}) scale(${eCta * pulse}) translate(${-L.ctaCx} ${-L.ctaY})`} opacity={Math.min(1, eCta * 2)}>
          <clipPath id={`${uid}-cta`}>
            <rect x={L.ctaCx - ctaW / 2} y={L.ctaY - ctaH / 2} width={ctaW} height={ctaH} rx={ctaH / 2} />
          </clipPath>
          <rect x={L.ctaCx - ctaW / 2} y={L.ctaY - ctaH / 2 + 10 * k} width={ctaW} height={ctaH} rx={ctaH / 2} fill="#000" opacity={0.3} />
          <rect x={L.ctaCx - ctaW / 2} y={L.ctaY - ctaH / 2} width={ctaW} height={ctaH} rx={ctaH / 2} fill={p.accent2} />
          <g clipPath={`url(#${uid}-cta)`}>
            {f > 90 && <rect x={L.ctaCx - ctaW / 2 + shine * (ctaW + 160 * k) - 120 * k} y={L.ctaY - ctaH} width={60 * k} height={ctaH * 2} fill="#fff" opacity={0.28} transform={`rotate(20 ${L.ctaCx} ${L.ctaY})`} />}
          </g>
          <text x={L.ctaCx - 38 * k} y={L.ctaY + ctaFs * 0.34} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={ctaFs} fill={p.ink}>
            {p.ctaLabel}
          </text>
          <g transform={`translate(${L.ctaCx + ctaW / 2 - 70 * k + Math.sin(f * 0.25) * 4 * k} ${L.ctaY})`}>
            <path d={`M${-4 * k} ${-16 * k} L${16 * k} 0 L${-4 * k} ${16 * k}`} fill="none" stroke={p.ink} strokeWidth={7 * k} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${-24 * k} 0 H${14 * k}`} stroke={p.ink} strokeWidth={7 * k} strokeLinecap="round" />
          </g>
        </g>

        {/* ribbon */}
        <g opacity={eRibbon} transform={`translate(0 ${(1 - eRibbon) * ribbonH * 1.4})`}>
          <rect x={0} y={L.ribbonY} width={w} height={ribbonH} fill={p.accent} />
          <g clipPath={`url(#${uid}-rib)`}>
            {Array.from({length: reps}, (_, i) => (
              <text key={i} x={i * unitW - scroll} y={L.ribbonY + ribbonH * 0.68} fontFamily={fonts.display} fontSize={ribbonFs} letterSpacing={ribbonFs * 0.1} fill={bg}>
                {unitTxt}
              </text>
            ))}
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const saleCountdownBanner = defineMotion<Props>({
  id: 'sale-countdown-banner',
  title: 'Sale countdown banner',
  category: 'text',
  description: 'Promo banner: headline pill, a huge discount that slams in, a subtitle, a flip-style hours/min/sec countdown, a pulsing call-to-action pill and a scrolling ribbon.',
  source: ['original (round 3, social & marketing)'],
  useFor: 'Flash sales, launch / early-bird offers, Black-Friday style promos, "ends soon" ads, limited-time offers, social and e-commerce video ads.',
  durationInFrames: 210,
  defaultProps: {
    headline: 'Flash sale',
    discount: '50%',
    discountLabel: 'OFF',
    subtitle: 'Everything in the store. Today only.',
    timerLabel: 'Ends in',
    unitLabels: ['Hours', 'Min', 'Sec'],
    timerSeconds: 9254,
    tickSpeed: 1,
    ctaLabel: 'Shop now',
    ribbon: 'Limited time  •  Free shipping  •  While stock lasts  •',
    background: '#17132B',
    ink: '#FFFFFF',
    accent: '#FFC933',
    accent2: '#FF4D6D',
    startAt: 0,
  },
  propDocs: {
    headline: 'small pill above the discount',
    discount: 'the big number / text, e.g. "50%" or "$20"',
    discountLabel: 'word after the discount (OFF, SAVE, …)',
    subtitle: 'one or two lines under the discount',
    timerLabel: 'caption above the timer',
    unitLabels: 'three labels under the timer boxes (hours, minutes, seconds)',
    timerSeconds: 'timer value at the start, in seconds',
    tickSpeed: 'timer seconds that pass per video second (1 = real time)',
    ctaLabel: 'text in the call-to-action pill',
    ribbon: 'text that scrolls along the bottom ribbon',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'discount number + ribbon colour',
    accent2: 'headline pill + call-to-action colour',
    startAt: 'frame the sequence begins',
  },
  component: SaleCountdownBanner,
  tags: ['marketing', 'sale', 'discount', 'countdown', 'timer', 'offer', 'cta', 'promo', 'ad', 'ecommerce', 'banner', 'flash-sale', 'black-friday'],
});
