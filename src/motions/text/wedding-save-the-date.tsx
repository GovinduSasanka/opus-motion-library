import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {rng} from '../../core/random';
import {EventStage, Flower, Sprig, backOut, fitFont, leafPath, mixHex, sparkPath, withAlpha} from '../../core/r3-events-kit';
import {defineMotion} from '../../core/types';

/**
 * Elegant save-the-date card: a thin double frame draws on, hand-drawn floral sprigs grow from the corners and flowers bloom,
 * then the names, ampersand, a flourish divider, the date and the venue fade up one by one while a few petals drift down.
 */
type Props = {
  eyebrow: string;
  nameA: string;
  nameB: string;
  connector: string;
  date: string;
  venue: string;
  place: string;
  florals: boolean;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  seed: number;
  startAt: number;
};

const WeddingSaveTheDate: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - p.startAt);
  const rise = (a: number, b = a + 22) => ease.out(prog(f, a, b, ease.linear));

  return (
    <EventStage background={p.background}>
      {(L) => {
        const {W, H, kind} = L;
        const cxm = W / 2;
        const tall = kind === 'tall';
        const inset = 46;
        const m = 22;
        const frameT = prog(f, 0, 44, ease.inOut);
        const per = 2 * (W - inset * 2 + H - inset * 2);
        const slen = Math.min(W, H) * (tall ? 0.42 : 0.36);
        const ys = tall
          ? {eyebrow: 560, a: 730, amp: 860, b: 990, div: 1090, date: 1180, venue: 1252, place: 1304}
          : kind === 'square'
            ? {eyebrow: 300, a: 440, amp: 440, b: 440, div: 520, date: 596, venue: 656, place: 700}
            : {eyebrow: 250, a: 420, amp: 420, b: 420, div: 520, date: 625, venue: 695, place: 750};
        const maxW = tall ? W * 0.74 : W * 0.66;

        // names layout
        const nameFs = tall ? fitFont(p.nameA.length > p.nameB.length ? p.nameA : p.nameB, 150, maxW, 0.52) : fitFont(`${p.nameA}  ${p.connector}  ${p.nameB}`, 200, maxW, 0.55);
        const ampFs = nameFs * (tall ? 1.1 : 0.95);
        const wA = [...p.nameA].length * nameFs * 0.54;
        const wB = [...p.nameB].length * nameFs * 0.54;
        const wAmp = ampFs * 0.8 + 70;
        const total = wA + wAmp + wB;
        const xA = cxm - total / 2 + wA / 2;
        const xAmp = cxm - total / 2 + wA + wAmp / 2;
        const xB = cxm + total / 2 - wB / 2;

        const corner = (rotDeg: number, tx: number, ty: number, sc: number, k: number) => {
          const g = prog(f, 10 + k * 7, 70 + k * 7, ease.inOut);
          return (
            <g transform={`translate(${tx} ${ty}) rotate(${rotDeg}) scale(${sc})`} key={k}>
              <Sprig x={26} y={4} rot={0} len={slen} t={g} color={p.accent2} seed={p.seed + k} bend={0.16} leaves={8} />
              <Sprig x={4} y={26} rot={90} len={slen * 0.95} t={g} color={p.accent2} seed={p.seed + k + 9} bend={0.16} leaves={7} flip />
              <Sprig x={14} y={14} rot={45} len={slen * 0.36} t={prog(g, 0.3, 1)} color={p.accent2} seed={p.seed + k + 4} bend={0.3} leaves={4} />
              <Flower x={0} y={0} r={46} t={prog(f, 38 + k * 6, 80 + k * 6, ease.out)} color={p.accent} rot={k * 18} fillColor={p.accent} />
              <Flower x={slen * 0.34} y={slen * -0.02 - 2} r={20} t={prog(f, 52 + k * 6, 92 + k * 6, ease.out)} color={p.accent} rot={30} />
              <Flower x={-2 + 6} y={slen * 0.34} r={18} t={prog(f, 58 + k * 6, 96 + k * 6, ease.out)} color={p.accent} rot={60} />
            </g>
          );
        };

        const R = rng(p.seed * 19 + 3);
        const petals = Array.from({length: 14}, () => ({x: R(), ph: R(), sz: 12 + R() * 12, sp: 0.5 + R() * 0.6, rot: R() * 360, sw: 20 + R() * 60}));

        const eyebrowFs = Math.min(40, fitFont(p.eyebrow.toUpperCase(), 40, maxW, 0.8));
        const dateFs = fitFont(p.date, 70, maxW, 0.55);
        const venueFs = fitFont(p.venue, 48, maxW, 0.5);
        const placeFs = fitFont(p.place, 34, maxW, 0.5);
        const rectPath = (x: number, y: number, w: number, h: number, r: number) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
        void per;

        return (
          <g>
            {/* double frame */}
            <path d={rectPath(inset, inset, W - inset * 2, H - inset * 2, 6)} fill="none" stroke={p.accent} strokeWidth={2.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - frameT} />
            <path d={rectPath(inset + m, inset + m, W - (inset + m) * 2, H - (inset + m) * 2, 4)} fill="none" stroke={p.accent} strokeWidth={1.2} opacity={0.7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(f, 8, 52, ease.inOut)} />

            {p.florals && (
              <g>
                {corner(0, inset + 18, inset + 18, 1, 0)}
                {corner(90, W - inset - 18, inset + 18, 0.78, 1)}
                {corner(180, W - inset - 18, H - inset - 18, 1, 2)}
                {corner(270, inset + 18, H - inset - 18, 0.78, 3)}
              </g>
            )}

            {/* eyebrow */}
            <g opacity={rise(40)} transform={`translate(0 ${(1 - rise(40)) * 14})`}>
              <text x={cxm} y={ys.eyebrow} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={eyebrowFs} letterSpacing={eyebrowFs * 0.34} fill={p.accent}>
                {p.eyebrow.toUpperCase()}
              </text>
              <path d={`M${cxm - 60} ${ys.eyebrow + 22}H${cxm + 60}`} stroke={p.accent} strokeWidth={1.4} opacity={0.7} />
            </g>

            {/* names */}
            {tall ? (
              <g>
                <text x={cxm} y={ys.a} textAnchor="middle" fontFamily={fonts.serif} fontWeight={500} fontSize={nameFs} letterSpacing={nameFs * 0.04} fill={p.ink} opacity={rise(56)} transform={`translate(0 ${(1 - rise(56)) * 26})`}>
                  {p.nameA}
                </text>
                <text x={cxm} y={ys.amp} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={ampFs} fill={p.accent} transform={`translate(${cxm} ${ys.amp - ampFs * 0.3}) scale(${backOut(prog(f, 70, 92, ease.linear), 2)}) translate(${-cxm} ${-(ys.amp - ampFs * 0.3)})`}>
                  {p.connector}
                </text>
                <text x={cxm} y={ys.b} textAnchor="middle" fontFamily={fonts.serif} fontWeight={500} fontSize={nameFs} letterSpacing={nameFs * 0.04} fill={p.ink} opacity={rise(78)} transform={`translate(0 ${(1 - rise(78)) * 26})`}>
                  {p.nameB}
                </text>
              </g>
            ) : (
              <g>
                <text x={xA} y={ys.a + nameFs * 0.2} textAnchor="middle" fontFamily={fonts.serif} fontWeight={500} fontSize={nameFs} letterSpacing={nameFs * 0.03} fill={p.ink} opacity={rise(56)} transform={`translate(0 ${(1 - rise(56)) * 26})`}>
                  {p.nameA}
                </text>
                <text x={xAmp} y={ys.amp + nameFs * 0.28} textAnchor="middle" fontFamily={fonts.hand} fontWeight={700} fontSize={ampFs} fill={p.accent} transform={`translate(${xAmp} ${ys.amp}) scale(${backOut(prog(f, 70, 92, ease.linear), 2)}) translate(${-xAmp} ${-ys.amp})`}>
                  {p.connector}
                </text>
                <text x={xB} y={ys.b + nameFs * 0.2} textAnchor="middle" fontFamily={fonts.serif} fontWeight={500} fontSize={nameFs} letterSpacing={nameFs * 0.03} fill={p.ink} opacity={rise(78)} transform={`translate(0 ${(1 - rise(78)) * 26})`}>
                  {p.nameB}
                </text>
              </g>
            )}

            {/* flourish divider */}
            {(() => {
              const t = prog(f, 104, 132, ease.inOut);
              const y = ys.div;
              const wdt = Math.min(W * 0.34, 320);
              return (
                <g>
                  <path d={`M${cxm - 14} ${y}H${cxm - wdt}`} stroke={p.accent} strokeWidth={1.8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
                  <path d={`M${cxm + 14} ${y}H${cxm + wdt}`} stroke={p.accent} strokeWidth={1.8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
                  <path d={`M${cxm} ${y - 9}L${cxm + 9} ${y}L${cxm} ${y + 9}L${cxm - 9} ${y}Z`} fill={p.accent} transform={`translate(${cxm} ${y}) scale(${backOut(prog(f, 112, 128, ease.linear))}) translate(${-cxm} ${-y})`} />
                  {[-1, 1].map((s) => (
                    <g key={s} transform={`translate(${cxm + s * (wdt + 12)} ${y}) rotate(${s > 0 ? 0 : 180}) scale(${t})`}>
                      <path d={leafPath(26, 8)} fill={withAlpha(p.accent2, 0.2)} stroke={p.accent2} strokeWidth={1.6} />
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* date + venue */}
            <text x={cxm} y={ys.date} textAnchor="middle" fontFamily={fonts.serif} fontWeight={700} fontSize={dateFs} letterSpacing={dateFs * 0.12} fill={p.ink} opacity={rise(118)} transform={`translate(0 ${(1 - rise(118)) * 16})`}>
              {p.date.toUpperCase()}
            </text>
            <text x={cxm} y={ys.venue} textAnchor="middle" fontFamily={fonts.serif} fontWeight={500} fontSize={venueFs} letterSpacing={venueFs * 0.08} fill={mixHex(p.ink, p.accent, 0.25)} opacity={rise(134)} transform={`translate(0 ${(1 - rise(134)) * 14})`}>
              {p.venue}
            </text>
            <text x={cxm} y={ys.place} textAnchor="middle" fontFamily={fonts.sans} fontWeight={600} fontSize={placeFs} letterSpacing={placeFs * 0.22} fill={p.ink} opacity={0.65 * rise(146)}>
              {p.place.toUpperCase()}
            </text>

            {/* drifting petals + a few glints */}
            {f > 70 &&
              petals.map((q, i) => {
                const t = (((f - 70) * 0.0035 * q.sp + q.ph) % 1);
                const x = inset + 40 + q.x * (W - inset * 2 - 80) + Math.sin(t * 9 + i) * q.sw;
                const y = inset + t * (H - inset * 2);
                return (
                  <g key={i} transform={`translate(${x} ${y}) rotate(${q.rot + t * 300})`} opacity={Math.sin(t * Math.PI) * 0.55}>
                    <path d={leafPath(q.sz, q.sz * 0.5)} fill={i % 2 ? p.accent : p.accent2} opacity={0.5} />
                  </g>
                );
              })}
            {[0, 1, 2].map((i) => {
              const ph = ((f - 130 - i * 18) % 70) / 70;
              if (f < 130 || ph < 0) return null;
              const px = [cxm - 250, cxm + 270, cxm + 40][i];
              const py = [ys.date - 90, ys.venue - 40, ys.b - 150][i] + (tall ? 0 : 0);
              return <path key={i} d={sparkPath(px, py, 14 * Math.sin(ph * Math.PI))} fill={p.accent} opacity={0.9} />;
            })}
          </g>
        );
      }}
    </EventStage>
  );
};

export const weddingSaveTheDate = defineMotion<Props>({
  id: 'wedding-save-the-date',
  title: 'Wedding save the date (floral line art)',
  category: 'text',
  description: 'Elegant save-the-date card: a thin double frame draws on, line-art floral sprigs grow from the corners and bloom, then the two names, an ampersand, a flourish divider, the date and the venue fade up in turn while petals drift.',
  source: ['original (round 3, events & celebrations)'],
  useFor: 'Wedding and engagement announcements, save-the-date and invitation reels, anniversary parties, baby showers, any formal "you are invited" reveal. Replace names, date, venue, and set colours (sage + gold by default).',
  durationInFrames: 240,
  defaultProps: {
    eyebrow: 'Save the date',
    nameA: 'Emma',
    nameB: 'James',
    connector: '&',
    date: 'June 14, 2027',
    venue: 'Willow Garden Estate',
    place: 'Napa Valley, California',
    florals: true,
    background: '#F7F1E8',
    ink: '#3A3631',
    accent: '#B08D57',
    accent2: '#7F987C',
    seed: 3,
    startAt: 0,
  },
  propDocs: {
    eyebrow: 'small line above the names',
    nameA: 'first name',
    nameB: 'second name',
    connector: 'joiner between the names (& / and / +)',
    date: 'event date, shown in letter-spaced capitals',
    venue: 'venue name',
    place: 'city / region line',
    florals: 'draw the corner floral line art',
    background: 'card colour (hex), or "transparent" to overlay content',
    ink: 'text colour (hex)',
    accent: 'frame, flowers and ampersand colour (hex)',
    accent2: 'leaf / sprig colour (hex)',
    seed: 'seed for leaf sizes and drifting petals',
    startAt: 'frame the sequence begins',
  },
  component: WeddingSaveTheDate,
  tags: ['wedding', 'save-the-date', 'invitation', 'engagement', 'floral', 'elegant', 'names', 'date', 'venue', 'line-art', 'romantic', 'event'],
});
