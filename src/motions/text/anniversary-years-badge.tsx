import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {useSafeId} from '../../core/image-kit';
import {regular, poly} from '../../core/shapes';
import {Confetti, EventStage, Glow, Laurel, backOut, fitFont, mixHex, sparkPath, starPath, withAlpha} from '../../core/r3-events-kit';
import {wrapText} from '../../core/r3-social';
import {defineMotion} from '../../core/types';

/**
 * A milestone seal pops in over a slow sunburst, its ribbons drop, laurel branches draw around it, the year count climbs to N and
 * lands with a shine and sparkle burst, then the headline and a thank-you line write on. For anniversaries and "N years" moments.
 */
type Props = {
  years: number;
  eyebrow: string;
  unit: string;
  headline: string;
  caption: string;
  laurel: boolean;
  ribbons: boolean;
  countUp: boolean;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  seed: number;
  startAt: number;
};

const AnniversaryYearsBadge: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const uid = useSafeId('ayb');
  const f = Math.max(0, frame - p.startAt);
  const bg = p.background === 'transparent' ? '#14213D' : p.background;
  const years = Math.max(0, Math.round(p.years));
  const R0 = rng(p.seed * 29 + 7);
  const glints = Array.from({length: 8}, () => ({a: R0() * 6.28, d: 0.9 + R0() * 0.5, ph: R0() * 60}));

  return (
    <EventStage background={p.background}>
      {(L) => {
        const {W, H, kind} = L;
        const wide = kind === 'wide';
        const Rb = kind === 'tall' ? 250 : kind === 'square' ? 190 : 225;
        const cx = wide ? W * 0.29 : W / 2;
        const cy = wide ? H * 0.47 : kind === 'tall' ? H * 0.37 : H * 0.36;
        const tx = wide ? W * 0.72 : W / 2;
        const maxW = wide ? 600 : W * 0.86;

        const pop = backOut(prog(f, 0, 30, ease.linear), 1.9);
        const spin = (1 - ease.out(prog(f, 0, 34, ease.linear))) * -70;
        const rayOp = ease.out(prog(f, 8, 40, ease.linear));
        const ribbonT = ease.out(prog(f, 24, 54, ease.linear));
        const laurelT = prog(f, 34, 96, ease.inOut);

        // count
        const countT = p.countUp ? prog(f, 44, 98, ease.inOut) : 1;
        const shown = Math.round(years * countT);
        const landed = f >= (p.countUp ? 98 : 44);
        const landK = landed ? f - (p.countUp ? 98 : 44) : -1;
        const pulse = landK >= 0 && landK < 22 ? 1 + 0.14 * Math.sin((landK / 22) * Math.PI) : 1;
        const numStr = String(shown);
        const numFs = fitFont(String(years), kind === 'wide' ? 250 : 230, Rb * 1.25, 0.72);
        const shine = prog(f, 104, 140, ease.inOut);

        // seal geometry
        const scallop = poly(regular(0, 0, Rb, 30, -Math.PI / 2, Rb * 0.945)).replace(/ /g, 'L');
        const rIn = Rb * 0.8;
        const arcTop = `M${-rIn * 0.84} 0A${rIn * 0.84} ${rIn * 0.84} 0 0 1 ${rIn * 0.84} 0`;
        const arcId = `${uid}-arc`;
        const eyebrowFs = fitFont(p.eyebrow.toUpperCase(), 30, Rb * 1.6, 0.9) * 1;

        const rise = (a: number, b = a + 22) => ease.out(prog(f, a, b, ease.linear));
        const hlFs = wide ? 100 : kind === 'tall' ? 96 : 84;
        const hlLines = wrapText(p.headline, hlFs, maxW, 'display', 3);
        const hlSz = Math.min(hlFs, ...hlLines.map((ln) => fitFont(ln, hlFs, maxW, 0.66)));
        const hlY0 = wide ? H * 0.42 - ((hlLines.length - 1) * hlSz * 1.1) / 2 : kind === 'tall' ? cy + Rb + 270 : cy + Rb + 205;
        const capY = hlY0 + (hlLines.length - 1) * hlSz * 1.1 + (wide ? 92 : 92);

        const gold = mixHex(p.accent, '#ffffff', 0.35);
        const goldD = mixHex(p.accent, '#000000', 0.3);
        const ribL = mixHex(p.accent2, '#000000', 0.15);
        const ribD = mixHex(p.accent2, '#000000', 0.38);

        const ribbon = (side: 1 | -1) => {
          const Lr = Rb * 0.95;
          const wd = Rb * 0.5;
          return (
            <g transform={`translate(${cx + side * Rb * 0.18} ${cy + Rb * 0.5 - (1 - ribbonT) * Lr * 0.95}) rotate(${-side * 15}) translate(${-wd / 2} 0)`}>
              <path d={`M0 0H${wd}V${Lr}L${wd / 2} ${Lr - wd * 0.34}L0 ${Lr}Z`} fill={side > 0 ? ribL : ribD} />
              <path d={`M${wd * 0.12} 0V${Lr - wd * 0.17}M${wd * 0.88} 0V${Lr - wd * 0.17}`} stroke={p.accent} strokeWidth={4} opacity={0.8} />
              <path d={`M0 0H${wd}V${Lr * 0.12}H0Z`} fill="#000" opacity={0.18} />
            </g>
          );
        };

        return (
          <g>
            <Glow id={`${uid}-halo`} x={cx} y={cy} r={Rb * 2.4} color={p.accent} opacity={0.3 * rayOp} />
            {/* sunburst */}
            <g transform={`translate(${cx} ${cy}) rotate(${f * 0.18})`} opacity={rayOp * 0.11}>
              {Array.from({length: 24}, (_, i) => {
                const a0 = (i / 24) * Math.PI * 2;
                const a1 = a0 + (Math.PI * 2) / 60;
                const r = Rb * 3.2;
                return <path key={i} d={`M0 0L${Math.cos(a0) * r} ${Math.sin(a0) * r}L${Math.cos(a1) * r} ${Math.sin(a1) * r}Z`} fill={p.accent} />;
              })}
            </g>

            {p.ribbons && (
              <g>
                {ribbon(-1)}
                {ribbon(1)}
              </g>
            )}
            {p.laurel && <Laurel cx={cx} cy={cy} R={Rb * 1.22} t={laurelT} color={p.accent} n={11} leaf={Rb * 0.2} sw={3.4} />}
            {p.laurel && <Laurel cx={cx} cy={cy} R={Rb * 1.22} t={laurelT} color={p.accent} mirror n={11} leaf={Rb * 0.2} sw={3.4} />}

            {/* seal */}
            <g transform={`translate(${cx} ${cy}) rotate(${spin}) scale(${pop * pulse})`}>
              <defs>
                <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={gold} />
                  <stop offset="0.5" stopColor={p.accent} />
                  <stop offset="1" stopColor={goldD} />
                </linearGradient>
                <clipPath id={`${uid}-clip`}>
                  <path d={`M${scallop}Z`} />
                </clipPath>
                <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity={0} />
                  <stop offset="0.5" stopColor="#fff" stopOpacity={0.7} />
                  <stop offset="1" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={`M${scallop}Z`} fill="#000" opacity={0.3} transform="translate(0 10)" />
              <path d={`M${scallop}Z`} fill={`url(#${uid}-gold)`} stroke={goldD} strokeWidth={4} strokeLinejoin="round" />
              <circle r={Rb * 0.88} fill="none" stroke={goldD} strokeWidth={3} opacity={0.6} />
              <circle r={rIn} fill={mixHex(bg, '#000000', 0.2)} stroke={gold} strokeWidth={6} />
              <circle r={rIn * 0.93} fill="none" stroke={p.accent} strokeWidth={1.8} strokeDasharray="2 9" strokeLinecap="round" opacity={0.8} />

              {/* ring text along the top arc */}
              <g transform={`translate(0 ${-rIn * 0.02})`}>
                <path id={arcId} d={`M${-rIn * 0.74} ${-rIn * 0.06}A${rIn * 0.75} ${rIn * 0.75} 0 0 1 ${rIn * 0.74} ${-rIn * 0.06}`} fill="none" />
                <text fontFamily={fonts.sans} fontWeight={800} fontSize={eyebrowFs * 0.72} letterSpacing={eyebrowFs * 0.2} fill={p.accent} textAnchor="middle" opacity={rise(26)}>
                  <textPath href={`#${arcId}`} startOffset="50%">
                    {p.eyebrow.toUpperCase()}
                  </textPath>
                </text>
              </g>
              {void arcTop}

              {/* number + unit */}
              <text x={5} y={numFs * 0.33 + 5 - rIn * 0.12} textAnchor="middle" fontFamily={fonts.display} fontSize={numFs} fill="#000" opacity={0.35}>
                {numStr}
              </text>
              <text x={0} y={numFs * 0.33 - rIn * 0.12} textAnchor="middle" fontFamily={fonts.display} fontSize={numFs} fill={p.ink}>
                {numStr}
              </text>
              <text x={0} y={rIn * 0.7} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={fitFont(p.unit.toUpperCase(), 40, rIn * 1.2, 0.9)} letterSpacing={11} fill={p.accent}>
                {p.unit.toUpperCase()}
              </text>
              {[-1, 0, 1].map((i) => (
                <path key={i} d={starPath(i * rIn * 0.24, rIn * 0.86, (i === 0 ? 15 : 11) * rise(30 + (i + 1) * 5, 50 + (i + 1) * 5))} fill={p.accent} />
              ))}

              {/* shine sweep */}
              <g clipPath={`url(#${uid}-clip)`} opacity={shine > 0 && shine < 1 ? 0.9 : 0}>
                <g transform={`translate(${(shine - 0.5) * Rb * 4.4} 0) skewX(-18)`}>
                  <rect x={-Rb * 0.2} y={-Rb * 1.2} width={Rb * 0.4} height={Rb * 2.4} fill={`url(#${uid}-shine)`} />
                </g>
              </g>
            </g>

            {/* landing burst */}
            {landK >= 0 && landK < 36 && (
              <circle cx={cx} cy={cy} r={Rb * (1 + landK * 0.035)} fill="none" stroke={p.accent} strokeWidth={10 * (1 - landK / 36)} opacity={1 - landK / 36} />
            )}
            {landK >= 0 &&
              glints.map((g, i) => {
                const ph0 = ((landK - g.ph * 0.2) % 50) / 50;
                if (ph0 < 0) return null;
                return <path key={i} d={sparkPath(cx + Math.cos(g.a) * Rb * g.d * 1.25, cy + Math.sin(g.a) * Rb * g.d * 1.25, 24 * Math.sin(clamp(ph0) * Math.PI))} fill={gold} />;
              })}
            <Confetti x={cx} y={cy} t={landK} seed={p.seed + 4} colors={[p.accent, gold, p.accent2, p.ink]} n={50} power={17} spread={Math.PI * 2} dir={0} gravity={0.4} life={90} size={0.9} />

            {/* headline + caption */}
            {hlLines.map((ln, i) => {
              const k = rise(96 + i * 8);
              return (
                <text key={i} x={tx} y={hlY0 + i * hlSz * 1.1 + (1 - k) * 28} textAnchor="middle" fontFamily={fonts.display} fontSize={hlSz} fill={i === hlLines.length - 1 && hlLines.length > 1 ? p.accent : p.ink} opacity={k}>
                  {ln.toUpperCase()}
                </text>
              );
            })}
            <path d={`M${tx - 60} ${capY - 52}H${tx + 60}`} stroke={p.accent} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - rise(118, 140)} />
            <text x={tx} y={capY} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={fitFont(p.caption, wide ? 44 : 38, maxW, 0.52)} fill={p.ink} opacity={0.85 * rise(120)}>
              {p.caption}
            </text>
            {void withAlpha}
          </g>
        );
      }}
    </EventStage>
  );
};

export const anniversaryYearsBadge = defineMotion<Props>({
  id: 'anniversary-years-badge',
  title: 'Anniversary years badge (ribbons & laurel)',
  category: 'text',
  description: 'A gold milestone seal pops in over a slow sunburst, ribbons drop behind it, laurel branches draw around it, the year count climbs to N and lands with a shine and sparkle burst, then a headline and thank-you line write on.',
  source: ['original (round 3, events & celebrations)'],
  useFor: 'Company and brand anniversaries, "5 years of ..." milestones, employee tenure, subscription / membership years, loyalty badges, awards and years-in-business trust marks. Set `years`, the headline and your colours.',
  durationInFrames: 240,
  defaultProps: {
    years: 5,
    eyebrow: 'Celebrating',
    unit: 'years',
    headline: 'Thank you for 5 great years',
    caption: 'Here is to many more together',
    laurel: true,
    ribbons: true,
    countUp: true,
    background: '#14213D',
    ink: '#FFFFFF',
    accent: '#F2C14E',
    accent2: '#C8372D',
    seed: 3,
    startAt: 0,
  },
  propDocs: {
    years: 'the number shown in the seal (counts up from 0)',
    eyebrow: 'text curved along the top of the seal',
    unit: 'label under the number (years, months, days...)',
    headline: 'big line beside / under the badge (wraps to three lines)',
    caption: 'smaller line under the headline',
    laurel: 'draw laurel branches around the seal',
    ribbons: 'show the two hanging ribbons',
    countUp: 'count up from 0 instead of showing the number straight away',
    background: 'frame colour (hex), or "transparent" to overlay content',
    ink: 'text colour (hex)',
    accent: 'seal, laurel and highlight colour (hex)',
    accent2: 'ribbon colour (hex)',
    seed: 'seed for the sparkles and confetti',
    startAt: 'frame the sequence begins',
  },
  component: AnniversaryYearsBadge,
  tags: ['anniversary', 'badge', 'years', 'milestone', 'seal', 'laurel', 'ribbon', 'award', 'celebration', 'tenure', 'birthday', 'company', 'event'],
});
