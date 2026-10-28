import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, lerp, prog} from '../../core/ease';
import {CheckMark, bgOf, fitFs, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sh, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {useUid} from '../../core/r2-pr4-kit';
import {defineMotion} from '../../core/types';

/**
 * A coupon ticket with a foil-covered window: a coin scratches back and forth, flakes fly, the code is revealed with a
 * pop and confetti, then the "Copy code" button is tapped and flips to "Copied".
 */
type Props = {
  title: string;
  discountLabel: string;
  code: string;
  hint: string;
  caption: string;
  terms: string;
  copyLabel: string;
  copiedLabel: string;
  rows: number;
  background: string;
  card: string;
  ink: string;
  accent: string;
  foil: string;
  startAt: number;
  speed: number;
};

type Pt = [number, number];

const CouponScratchReveal: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useUid('csr');
  const sp = Math.max(0.3, p.speed);
  const t = (frame - p.startAt) * sp;

  const cw = portrait ? w * 0.86 : Math.min(h * 0.72, w * 0.4);
  const ch = cw * 1.1;
  const cx0 = (w - cw) / 2;
  const cy0 = (h - ch) / 2;
  const enter = ease.out(sseg(t, 0, 20));
  const pad = cw * 0.08;

  // scratch window (card-local)
  const ww = cw - pad * 2;
  const wh = cw * 0.3;
  const wy = cw * 0.47;
  const rows = Math.max(2, Math.round(p.rows));
  const rowH = wh / rows;
  const sw = rowH * 1.3;

  const zig: Pt[] = [];
  for (let r = 0; r < rows; r++) {
    const y = rowH * (r + 0.5);
    const a = -8 * u;
    const b = ww + 8 * u;
    if (r % 2 === 0) zig.push([a, y], [b, y]);
    else zig.push([b, y], [a, y]);
  }
  const cum = [0];
  for (let i = 1; i < zig.length; i++) cum.push(cum[i - 1] + Math.hypot(zig[i][0] - zig[i - 1][0], zig[i][1] - zig[i - 1][1]));
  const total = cum[cum.length - 1];
  const S0 = 26;
  const S1 = 100;
  const sprog = ease.sine(sseg(t, S0, S1));
  const d = sprog * total;
  let seg = 1;
  while (seg < cum.length - 1 && cum[seg] < d) seg++;
  const q = Math.min(1, Math.max(0, (d - cum[seg - 1]) / Math.max(1e-6, cum[seg] - cum[seg - 1])));
  const head: Pt = [lerp(zig[seg - 1][0], zig[seg][0], q), lerp(zig[seg - 1][1], zig[seg][1], q)];
  const cutPts = zig.slice(0, seg).concat([head]);
  const scratchD = sprog > 0 ? cutPts.map((s, i) => `${i ? 'L' : 'M'}${s[0].toFixed(1)} ${s[1].toFixed(1)}`).join('') : '';
  const scratching = t >= S0 && t < S1;
  const revealed = t >= S1;

  // foil texture dots
  const dots = Array.from({length: 70}, (_, i) => ({x: sh(i, 1, 9) * ww, y: sh(i, 2, 9) * wh, r: (1 + sh(i, 3, 9) * 3) * u, o: 0.1 + sh(i, 4, 9) * 0.3}));
  const foilHi = mixHex(p.foil, '#ffffff', 0.5);
  const foilLo = mixHex(p.foil, '#000000', 0.22);
  const sheen = ((t * 6) % (ww * 2.4)) - ww * 0.6;

  // flakes
  const flakes: React.ReactNode[] = [];
  if (scratching) {
    for (let i = 0; i < 14; i++) {
      const age = (t * 1 + i * 2.3) % 14;
      const ang = sh(i, Math.floor((t + i * 2.3) / 14), 5) * Math.PI * 2;
      const dist = age * 4.5 * u;
      flakes.push(<rect key={i} x={head[0] + Math.cos(ang) * dist - 3 * u} y={head[1] + Math.sin(ang) * dist + age * age * 0.22 * u - 3 * u} width={6 * u} height={6 * u} rx={1.5 * u} fill={i % 2 ? foilHi : foilLo} opacity={1 - age / 14} transform={`rotate(${age * 40 + i * 30} ${head[0] + Math.cos(ang) * dist} ${head[1] + Math.sin(ang) * dist})`} />);
    }
  }

  // reveal
  const pop = revealed ? backOut(sseg(t, S1, S1 + 14), 2.4) : 0;
  const burst = prog(t, S1, S1 + 34, ease.out);
  const confetti = revealed
    ? Array.from({length: 22}, (_, i) => {
        const a = sh(i, 1, 4) * Math.PI * 2;
        const sp2 = (0.4 + sh(i, 2, 4)) * Math.max(cw, ch) * 0.34;
        const gx = ww / 2 + Math.cos(a) * sp2 * burst;
        const gy = wh / 2 + Math.sin(a) * sp2 * burst * 0.8 + burst * burst * 40 * u;
        const col = [p.accent, p.ink, mixHex(p.accent, '#ffffff', 0.4), p.foil][i % 4];
        return <rect key={i} x={gx - 5 * u} y={gy - 8 * u} width={10 * u} height={16 * u} rx={2 * u} fill={col} opacity={1 - sseg(burst, 0.6, 1)} transform={`rotate(${a * 60 + burst * 360 * (i % 2 ? 1 : -1)} ${gx} ${gy})`} />;
      })
    : null;

  // button
  const TAP = S1 + 22;
  const tapD = t - TAP;
  const tapDip = tapD >= 0 && tapD <= 10 ? Math.sin((Math.PI * tapD) / 10) : 0;
  const copied = t >= TAP + 5;
  const btnIn = ease.out(sseg(t, S1 + 8, S1 + 20));
  const btnH = cw * 0.125;
  const btnBg = copied ? mixHex(p.card, '#18B26B', 0.16) : p.ink;
  const btnFg = copied ? '#12905A' : onColor(p.ink);

  const codeFs = fitFs(p.code, ww * 0.86, wh * 0.46, 0.66);
  const coinR = wh * 0.2;
  const codeBoxId = `${uid}-win`;

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink}}>
      <div
        style={{
          position: 'absolute',
          left: cx0,
          top: cy0 + (1 - enter) * 40 * u,
          width: cw,
          height: ch,
          opacity: enter,
          borderRadius: cw * 0.05,
          background: p.card,
          boxShadow: `0 ${cw * 0.04}px ${cw * 0.13}px ${withAlpha(p.ink, 0.2)}`,
          overflow: 'hidden',
        }}
      >
        {/* top band */}
        <div style={{position: 'absolute', left: 0, top: 0, width: cw, height: cw * 0.39, background: p.accent, color: onColor(p.accent)}}>
          <div style={{position: 'absolute', left: pad, top: cw * 0.07, fontSize: cw * 0.048, fontWeight: 800, letterSpacing: cw * 0.008, opacity: 0.85, textTransform: 'uppercase'}}>{p.title}</div>
          <div style={{position: 'absolute', left: pad, top: cw * 0.14, fontFamily: fonts.display, fontSize: fitFs(p.discountLabel, cw - pad * 2, cw * 0.15, 0.7), lineHeight: 1.05, whiteSpace: 'nowrap'}}>{p.discountLabel}</div>
        </div>
        {/* scratch window */}
        <svg width={ww} height={wh} viewBox={`0 0 ${ww} ${wh}`} style={{position: 'absolute', left: pad, top: wy, overflow: 'visible'}}>
          <defs>
            <clipPath id={codeBoxId}>
              <rect width={ww} height={wh} rx={cw * 0.03} />
            </clipPath>
            <mask id={`${uid}-m`}>
              <rect width={ww} height={wh} fill="#fff" />
              <path d={scratchD} fill="none" stroke="#000" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            </mask>
            <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={foilHi} />
              <stop offset="0.45" stopColor={p.foil} />
              <stop offset="1" stopColor={foilLo} />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${codeBoxId})`}>
            <rect width={ww} height={wh} fill={mixHex(p.card, p.accent, 0.1)} />
            <g transform={`translate(${ww / 2} ${wh / 2}) scale(${revealed ? lerp(0.8, 1, pop) : 0.96})`}>
              <text textAnchor="middle" y={codeFs * 0.34} fontFamily={fonts.mono} fontWeight={700} fontSize={codeFs} letterSpacing={codeFs * 0.08} fill={p.ink}>
                {p.code}
              </text>
            </g>
            {confetti}
            <g mask={`url(#${uid}-m)`}>
              <rect width={ww} height={wh} fill={`url(#${uid}-f)`} />
              {dots.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
              ))}
              <polygon points={`${sheen},${wh} ${sheen + ww * 0.18},${wh} ${sheen + ww * 0.18 + wh * 0.5},0 ${sheen + wh * 0.5},0`} fill="#fff" opacity={0.28} />
              <text x={ww / 2} y={wh / 2 + cw * 0.018} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={cw * 0.05} letterSpacing={cw * 0.012} fill={foilLo} opacity={0.75}>
                {p.hint}
              </text>
            </g>
          </g>
          <rect width={ww} height={wh} rx={cw * 0.03} fill="none" stroke={withAlpha(p.ink, 0.18)} strokeWidth={2.5 * u} strokeDasharray={`${10 * u} ${8 * u}`} />
          {flakes}
          {scratching || (t >= S1 && t < S1 + 12) ? (
            <g transform={`translate(${head[0] + coinR * 0.3} ${head[1] + coinR * 0.3}) rotate(${-14 + Math.sin(t * 0.9) * 6}) scale(${scratching ? 1 : 1 - sseg(t, S1, S1 + 12)})`}>
              <circle r={coinR} fill={mixHex('#E8C55A', '#ffffff', 0.12)} stroke="#B8902A" strokeWidth={coinR * 0.12} />
              <circle r={coinR * 0.68} fill="none" stroke="#B8902A" strokeWidth={coinR * 0.07} strokeDasharray={`${coinR * 0.12} ${coinR * 0.12}`} />
              <path d={`M${-coinR * 0.4} ${-coinR * 0.5} A${coinR * 0.8} ${coinR * 0.8} 0 0 1 ${coinR * 0.3} ${-coinR * 0.6}`} stroke="#fff" strokeWidth={coinR * 0.1} strokeLinecap="round" fill="none" opacity={0.7} />
            </g>
          ) : null}
        </svg>

        {/* footer */}
        <div style={{position: 'absolute', left: pad, top: wy + wh + cw * 0.045, width: ww, fontSize: cw * 0.045, fontWeight: 700}}>{p.caption}</div>
        <div style={{position: 'absolute', left: pad, top: wy + wh + cw * 0.045 + cw * 0.065, width: ww, fontSize: cw * 0.034, fontWeight: 600, opacity: 0.5}}>{p.terms}</div>
        <div
          style={{
            position: 'absolute',
            left: pad,
            bottom: cw * 0.05,
            width: ww,
            height: btnH,
            borderRadius: btnH * 0.3,
            background: btnBg,
            color: btnFg,
            opacity: btnIn,
            transform: `translateY(${(1 - btnIn) * 14 * u}px) scale(${1 - 0.05 * tapDip})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: btnH * 0.18,
            fontWeight: 800,
            fontSize: btnH * 0.38,
          }}
        >
          {copied ? <CheckMark size={btnH * 0.42} color={btnFg} p={prog(t, TAP + 5, TAP + 15)} sw={3.4} /> : null}
          {copied ? p.copiedLabel : p.copyLabel}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const couponScratchReveal = defineMotion<Props>({
  id: 'coupon-scratch-reveal',
  title: 'Coupon scratch card reveal',
  category: 'product',
  description:
    'A coupon ticket with a foil window: a coin scratches back and forth with flying flakes until the discount code is revealed with a pop and confetti, then a "Copy code" button is tapped and turns to "Copied".',
  source: ['original (round 3)'],
  useFor: 'Promo codes, giveaways, loyalty rewards, black-friday teasers, app-store discount beats — set the headline, discount, code and colours.',
  durationInFrames: 170,
  defaultProps: {
    title: 'Your reward',
    discountLabel: '20% OFF',
    code: 'SAVE20',
    hint: 'SCRATCH HERE',
    caption: 'On your next order',
    terms: 'Minimum spend applies. One use per customer.',
    copyLabel: 'Copy code',
    copiedLabel: 'Copied',
    rows: 5,
    background: '#F1ECE3',
    card: '#FFFFFF',
    ink: '#1D1B24',
    accent: '#E8553A',
    foil: '#B8BCC8',
    startAt: 0,
    speed: 1,
  },
  propDocs: {
    title: 'small caps line on the top band',
    discountLabel: 'big offer text on the top band',
    code: 'the hidden coupon code',
    hint: 'text printed on the foil',
    caption: 'line under the window',
    terms: 'fine print under the caption',
    copyLabel: 'button text before the tap',
    copiedLabel: 'button text after the tap',
    rows: 'how many scratch sweeps (2-8)',
    background: "page colour or 'transparent'",
    card: 'ticket body colour',
    ink: 'text colour',
    accent: 'top band and confetti colour',
    foil: 'scratch foil base colour',
    startAt: 'frame the ticket starts entering',
    speed: 'timing multiplier (1 = default)',
  },
  component: CouponScratchReveal,
  tags: ['coupon', 'scratch', 'promo code', 'discount', 'voucher', 'reward', 'ecommerce', 'retail', 'sale', 'reveal', 'giveaway', 'ticket'],
});
