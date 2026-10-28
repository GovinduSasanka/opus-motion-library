import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {SANS, backOut, bgOf, fmtInt, mixHex, starPath, withAlpha, wrapText} from '../../core/r3-social';
import {useSafeId} from '../../core/image-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * A star-rating reveal: the stars fill one after another up to `rating` (the last one partially), the big score counts up
 * and the review count ticks; an optional breakdown card shows how the ratings are distributed (5 to 1 stars).
 */
type Props = {
  rating: number;
  maxStars: number;
  reviewCount: number;
  label: string;
  reviewsLabel: string;
  note: string;
  distribution: number[];
  showBreakdown: boolean;
  background: string;
  ink: string;
  accent: string;
  starColor: string;
  startAt: number;
};

const ReviewStarsRating: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const uid = useSafeId('rsr');
  const f = Math.max(0, frame - p.startAt);
  const bg = p.background === 'transparent' ? '#ffffff' : p.background;
  const maxS = Math.max(1, Math.min(10, Math.round(p.maxStars)));
  const rating = Math.max(0, Math.min(maxS, p.rating));
  const dist = (p.distribution && p.distribution.length ? p.distribution : [0]).slice(0, 5);
  const dSum = dist.reduce((a, b) => a + Math.max(0, b), 0) || 1;
  const showBd = p.showBreakdown && !!p.distribution?.length;

  const wide = !portrait;
  const S = wide ? Math.min(u, w / 1500) * 1.1 : u * 1.15;
  const mainCx = wide && showBd ? w * 0.34 : w / 2;
  const mainCy = h * 0.5;
  const starR = Math.min(70 * S, (wide ? (showBd ? w * 0.4 : w * 0.7) : w * 0.86) / (maxS * 2.4));
  const starGap = starR * 2.45;
  const starsW = starGap * (maxS - 1);

  const t0 = 10;
  const fillT = ease.inOut(prog(f, t0, t0 + 14 + maxS * 9, ease.linear));
  const shown = rating * fillT;
  const eNum = ease.out(prog(f, 0, 18, ease.linear));
  const cnt = Math.round(p.reviewCount * ease.out(prog(f, t0, t0 + 70, ease.linear)));
  const doneAt = t0 + 14 + maxS * 9;
  const glint = prog(f, doneAt + 6, doneAt + 34, ease.sine);

  const numFs = (wide ? 250 : 300) * S;
  const numY = portrait ? h * 0.36 : mainCy - 60 * S;
  const starsY = portrait ? h * 0.47 : mainCy + 110 * S;

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        <defs>
          {Array.from({length: maxS}, (_, k) => {
            const fillAmt = Math.max(0, Math.min(1, shown - k));
            const x = mainCx - starsW / 2 + k * starGap;
            return (
              <clipPath key={k} id={`${uid}-c${k}`}>
                <rect x={x - starR} y={starsY - starR * 1.1} width={starR * 2 * fillAmt} height={starR * 2.4} />
              </clipPath>
            );
          })}
          <clipPath id={`${uid}-g`}>
            {Array.from({length: maxS}, (_, k) => (
              <path key={k} d={starPath(mainCx - starsW / 2 + k * starGap, starsY, starR)} />
            ))}
          </clipPath>
        </defs>

        {/* label */}
        <text x={mainCx} y={numY - numFs * 0.86} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36 * S} letterSpacing={7 * S} fill={p.ink} opacity={0.55 * eNum}>
          {p.label.toUpperCase()}
        </text>

        {/* big score */}
        <g transform={`translate(${mainCx} ${numY}) scale(${0.92 + 0.08 * eNum}) translate(${-mainCx} ${-numY})`} opacity={eNum}>
          <text x={mainCx} y={numY} textAnchor="middle" fontFamily={fonts.display} fontSize={numFs} fill={p.ink}>
            {(rating * ease.out(prog(f, t0, t0 + 14 + maxS * 9, ease.linear))).toFixed(1)}
          </text>
        </g>

        {/* stars */}
        {Array.from({length: maxS}, (_, k) => {
          const x = mainCx - starsW / 2 + k * starGap;
          const reach = prog(shown, k, k + 1, ease.linear);
          const pop0 = reach > 0 && reach < 1 ? 1 + 0.18 * Math.sin(reach * Math.PI) : 1 + 0.18 * Math.max(0, Math.sin(Math.min(1, (shown - k - 1) * 2) * Math.PI)) * (shown - k < 1.5 ? 1 : 0);
          const pop = 1 + (pop0 - 1) * (1 - ease.out(prog(fillT, 0.92, 1, ease.linear)));
          const enter = backOut(prog(f, 2 + k * 2, 14 + k * 2, ease.linear), 1.6);
          return (
            <g key={k} transform={`translate(${x} ${starsY}) scale(${pop * enter}) translate(${-x} ${-starsY})`}>
              <path d={starPath(x, starsY, starR)} fill={withAlpha(p.ink, 0.1)} stroke={withAlpha(p.ink, 0.12)} strokeWidth={3 * S} strokeLinejoin="round" />
              <path d={starPath(x, starsY, starR)} fill={p.starColor} stroke={mixHex(p.starColor, '#000000', 0.2)} strokeWidth={3 * S} strokeLinejoin="round" clipPath={`url(#${uid}-c${k})`} />
            </g>
          );
        })}
        {glint > 0 && glint < 1 && (
          <g clipPath={`url(#${uid}-g)`}>
            <rect x={mainCx - starsW / 2 - starR + glint * (starsW + starR * 4) - starR * 1.6} y={starsY - starR * 1.4} width={starR * 0.7} height={starR * 2.8} fill="#fff" opacity={0.55} transform={`rotate(18 ${mainCx} ${starsY})`} />
          </g>
        )}

        {/* count + note */}
        <text x={mainCx} y={starsY + starR + 78 * S} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44 * S} fill={p.ink} opacity={ease.out(prog(f, t0 + 8, t0 + 26, ease.linear))}>
          {fmtInt(cnt)} {p.reviewsLabel}
        </text>
        {wrapText(p.note, 30 * S, wide ? (showBd ? w * 0.4 : w * 0.6) : w * 0.84, 'sans', 2).map((ln, i) => (
          <text key={i} x={mainCx} y={starsY + starR + 128 * S + i * 38 * S} textAnchor="middle" fontFamily={SANS} fontWeight={400} fontSize={30 * S} fill={p.ink} opacity={0.6 * ease.out(prog(f, t0 + 16, t0 + 34, ease.linear))}>
            {ln}
          </text>
        ))}

        {/* breakdown */}
        {showBd &&
          (() => {
            const bx = wide ? w * 0.6 : w * 0.1;
            const bw = wide ? w * 0.32 : w * 0.8;
            const by = wide ? h * 0.3 : h * 0.66;
            const rowH = (wide ? 84 : 74) * S;
            return (
              <g>
                {dist.map((v, i) => {
                  const star = maxS >= 5 ? 5 - i : dist.length - i;
                  const at = t0 + 30 + i * 8;
                  const t = ease.out(prog(f, at, at + 34, ease.linear));
                  const pct = (Math.max(0, v) / dSum) * 100;
                  const lblW = 70 * S;
                  const trackW = bw - lblW - 150 * S;
                  const y = by + i * rowH;
                  const top = i === dist.indexOf(Math.max(...dist));
                  return (
                    <g key={i} opacity={ease.out(prog(f, at - 4, at + 8, ease.linear))}>
                      <text x={bx + 34 * S} y={y + rowH * 0.36} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={32 * S} fill={p.ink}>
                        {star}
                      </text>
                      <path d={starPath(bx + 58 * S, y + rowH * 0.24, 15 * S)} fill={p.starColor} />
                      <rect x={bx + lblW} y={y + rowH * 0.1} width={trackW} height={rowH * 0.3} rx={rowH * 0.15} fill={withAlpha(p.ink, 0.1)} />
                      <rect x={bx + lblW} y={y + rowH * 0.1} width={Math.max(0, trackW * (pct / 100) * t)} height={rowH * 0.3} rx={rowH * 0.15} fill={top ? p.accent : mixHex(p.accent, bg, 0.4)} />
                      <text x={bx + bw} y={y + rowH * 0.36} textAnchor="end" fontFamily={SANS} fontWeight={600} fontSize={28 * S} fill={p.ink} opacity={0.75}>
                        {Math.round(pct * t)}%
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
      </Svg>
    </AbsoluteFill>
  );
};

export const reviewStarsRating = defineMotion<Props>({
  id: 'review-stars-rating',
  title: 'Review stars rating',
  category: 'ui',
  description: 'Stars fill one after another up to a rating (the last one partially) while a big score counts up and the review count ticks; an optional 5-to-1 star breakdown bars fill beside it, with a glint over the stars at the end.',
  source: ['original (round 3, social & marketing)'],
  useFor: 'App-store / product ratings, "rated 4.8 by customers" proof, review summaries, satisfaction scores, restaurant / course / service rating reveals and landing-page trust badges.',
  durationInFrames: 180,
  defaultProps: {
    rating: 4.8,
    maxStars: 5,
    reviewCount: 12480,
    label: 'Customer rating',
    reviewsLabel: 'reviews',
    note: 'Based on verified purchases',
    distribution: [78, 14, 5, 2, 1],
    showBreakdown: true,
    background: '#FBF6EC',
    ink: '#2A2118',
    accent: '#E9983A',
    starColor: '#F5B223',
    startAt: 0,
  },
  propDocs: {
    rating: 'the score, 0..maxStars (decimals fill the last star partially)',
    maxStars: 'number of stars (1-10)',
    reviewCount: 'review count shown under the stars (counts up)',
    label: 'small caption above the score',
    reviewsLabel: 'word after the review count',
    note: 'smaller line under the review count',
    distribution: 'share per star level, 5 stars first (up to 5 numbers, any scale)',
    showBreakdown: 'show the distribution bars',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'top breakdown bar colour',
    starColor: 'filled star colour',
    startAt: 'frame the sequence begins',
  },
  component: ReviewStarsRating,
  tags: ['social', 'reviews', 'rating', 'stars', 'score', 'trust', 'marketing', 'counter', 'feedback', 'overlay', 'proof'],
});
