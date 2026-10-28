import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease} from '../../core/ease';
import {bgOf, onColor} from '../../core/commerce-kit';
import {fonts} from '../../core/fonts';
import {backOut, mixHex, sseg, withAlpha} from '../../core/r2-s1-kit';
import {useStage} from '../../core/stage';
import {Icon, Photo, starPath} from '../../core/travel-food-kit';
import {defineMotion} from '../../core/types';

/**
 * A hotel / stay listing card: photo with a slow push-in, name and location, stars that fill one by one, a review score that
 * counts up, amenity icons that pop in, a nightly price that counts up and a Book button.
 */
type Amenity = {icon: string; label: string};
type Props = {
  name: string;
  location: string;
  src: string;
  badge: string;
  stars: number;
  score: number;
  scoreLabel: string;
  reviews: string;
  price: number;
  currency: string;
  priceLabel: string;
  amenities: Amenity[];
  cta: string;
  background: string;
  card: string;
  ink: string;
  accent: string;
  startAt: number;
};

const HotelRatingCard: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame - p.startAt;
  const col = portrait || w / h < 1.25;
  const onAcc = onColor(p.accent);

  const cardW = col ? w * 0.88 : Math.min(w * 0.84, 1640 * u);
  const cardH = col ? h * (portrait ? 0.8 : 0.9) : h * 0.74;
  const cardX = (w - cardW) / 2;
  const cardY = (h - cardH) / 2;
  const photoW = col ? cardW : cardW * 0.46;
  const photoH = col ? cardH * (portrait ? 0.42 : 0.38) : cardH;
  const dW = col ? cardW : cardW - photoW;
  const dH = col ? cardH - photoH : cardH;
  const pad = (col ? 40 : 52) * u;
  const k = col ? (portrait ? 1.28 : 0.95) : 1.14;

  const enter = ease.out(sseg(t, 0, 24));
  const wipe = ease.inOut(sseg(t, 6, 34));
  const zoom = 1.02 + 0.1 * sseg(t, 6, 200);
  const nameIn = ease.out(sseg(t, 20, 36));
  const stars = Math.max(0, Math.min(5, p.stars));
  const amen = p.amenities.slice(0, 6);
  const scoreV = p.score * ease.out(sseg(t, 44, 72));
  const scoreIn = backOut(sseg(t, 40, 56), 2);
  const priceV = Math.round(p.price * ease.out(sseg(t, 70, 104)));
  const priceIn = ease.out(sseg(t, 66, 80));
  const ctaT = sseg(t, 100, 114);
  const ctaPop = backOut(ctaT, 2);
  const pulse = t > 118 ? (((t - 118) % 50) / 50) : 0;

  const starSize = 38 * u * k;

  return (
    <AbsoluteFill style={{background: bgOf(p.background), fontFamily: fonts.sans, color: p.ink, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: cardX,
          top: cardY + (1 - enter) * 70 * u,
          width: cardW,
          height: cardH,
          opacity: enter,
          transform: `scale(${0.96 + 0.04 * enter})`,
          borderRadius: 36 * u,
          background: p.card,
          overflow: 'hidden',
          boxShadow: `0 ${34 * u}px ${90 * u}px ${withAlpha(p.ink, 0.22)}, 0 ${6 * u}px ${16 * u}px ${withAlpha(p.ink, 0.1)}`,
          display: 'flex',
          flexDirection: col ? 'column' : 'row',
        }}
      >
        {/* photo */}
        <div style={{width: photoW, height: photoH, position: 'relative', flex: 'none', clipPath: col ? `inset(0 0 ${(1 - wipe) * 100}% 0)` : `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>
          <Photo w={photoW} h={photoH} src={p.src || undefined} kind={2} seed={0} building zoom={zoom} idKey="hrc" />
          {p.badge ? (
            <div style={{position: 'absolute', left: 26 * u, top: 26 * u, background: p.accent, color: onAcc, fontFamily: fonts.mono, fontWeight: 700, fontSize: 22 * u * k, letterSpacing: 3 * u, padding: `${9 * u}px ${20 * u}px`, borderRadius: 999, textTransform: 'uppercase', opacity: ease.out(sseg(t, 30, 44)), transform: `translateY(${(1 - ease.out(sseg(t, 30, 44))) * -14 * u}px)`}}>
              {p.badge}
            </div>
          ) : null}
        </div>

        {/* details */}
        <div style={{width: dW, height: dH, padding: `${pad * (col ? 0.85 : 1)}px ${pad}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', minWidth: 0}}>
          <div style={{opacity: nameIn, transform: `translateY(${(1 - nameIn) * 18 * u}px)`}}>
            <div style={{fontFamily: fonts.serif, fontWeight: 700, fontSize: (col ? 66 : 70) * u * k, lineHeight: 1.04}}>{p.name}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10 * u, marginTop: 12 * u, fontSize: 26 * u * k, color: withAlpha(p.ink, 0.6), fontWeight: 600}}>
              <svg width={26 * u * k} height={26 * u * k} viewBox="0 0 24 24" fill="none" stroke={p.accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                <circle cx={12} cy={9.5} r={2.6} />
              </svg>
              {p.location}
            </div>
          </div>

          {/* stars + score */}
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: (col ? 22 : 30) * u}}>
            <svg width={starSize * 5.4} height={starSize * 1.1} viewBox={`0 0 ${starSize * 5.4} ${starSize * 1.1}`} style={{overflow: 'visible', flex: 'none'}}>
              <defs>
                {[0, 1, 2, 3, 4].map((i) => {
                  const f = Math.max(0, Math.min(1, stars - i));
                  return (
                    <linearGradient key={i} id={`hrc-star-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset={f} stopColor="#F5B301" />
                      <stop offset={f} stopColor={withAlpha(p.ink, 0.15)} />
                    </linearGradient>
                  );
                })}
              </defs>
              {[0, 1, 2, 3, 4].map((i) => {
                const a = 30 + i * 5;
                const pop = backOut(sseg(t, a, a + 10), 2.6);
                const vis = sseg(t, a, a + 4);
                return (
                  <g key={i} transform={`translate(${starSize * 0.55 + i * starSize * 1.08} ${starSize * 0.57}) scale(${pop})`} opacity={vis}>
                    <path d={starPath(starSize * 0.55)} fill={`url(#hrc-star-${i})`} stroke={mixHex('#F5B301', '#000000', 0.12)} strokeWidth={0} />
                  </g>
                );
              })}
            </svg>
            <div style={{display: 'flex', alignItems: 'center', gap: 16 * u, transform: `scale(${0.7 + 0.3 * scoreIn})`, opacity: sseg(t, 40, 50), transformOrigin: 'right center'}}>
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: 800, fontSize: 26 * u * k, lineHeight: 1.1}}>{p.scoreLabel}</div>
                <div style={{fontSize: 21 * u * k, color: withAlpha(p.ink, 0.55)}}>{p.reviews}</div>
              </div>
              <div style={{background: p.ink, color: p.card, fontFamily: fonts.display, fontSize: 40 * u * k, borderRadius: `${14 * u}px ${14 * u}px ${14 * u}px 4px`, padding: `${12 * u}px ${18 * u}px`, minWidth: 92 * u * k, textAlign: 'center'}}>{scoreV.toFixed(1)}</div>
            </div>
          </div>

          {/* amenities */}
          <div style={{display: 'flex', flexWrap: 'wrap', gap: `${14 * u}px ${28 * u}px`, marginTop: (col ? 24 : 32) * u}}>
            {amen.map((a, i) => {
              const at = 52 + i * 6;
              const pop = backOut(sseg(t, at, at + 10), 2.2);
              const vis = sseg(t, at, at + 5);
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10 * u, opacity: vis, transform: `scale(${0.6 + 0.4 * pop})`, transformOrigin: 'left center'}}>
                  <div style={{width: 54 * u * k, height: 54 * u * k, borderRadius: 16 * u, background: mixHex(p.card, p.accent, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Icon name={a.icon} size={30 * u * k} color={p.accent} sw={1.9} />
                  </div>
                  <div style={{fontSize: 23 * u * k, fontWeight: 600}}>{a.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{flex: 1}} />

          {/* price + CTA */}
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `${2.5 * u}px solid ${withAlpha(p.ink, 0.1)}`, paddingTop: 22 * u, opacity: priceIn, transform: `translateY(${(1 - priceIn) * 14 * u}px)`}}>
            <div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 10 * u}}>
                <span style={{fontWeight: 800, fontSize: (col ? 76 : 84) * u * k, lineHeight: 1, fontFamily: fonts.display}}>
                  {p.currency}
                  {priceV}
                </span>
              </div>
              <div style={{fontFamily: fonts.mono, fontSize: 21 * u * k, color: withAlpha(p.ink, 0.55), letterSpacing: 2 * u, marginTop: 6 * u, textTransform: 'uppercase'}}>{p.priceLabel}</div>
            </div>
            <div style={{position: 'relative', transform: `scale(${0.6 + 0.4 * ctaPop})`, opacity: ctaT > 0 ? 1 : 0}}>
              {pulse > 0 ? <div style={{position: 'absolute', inset: -pulse * 18 * u, borderRadius: 999, border: `${3 * u}px solid ${withAlpha(p.accent, 0.5 * (1 - pulse))}`}} /> : null}
              <div style={{background: p.accent, color: onAcc, fontWeight: 800, fontSize: 30 * u * k, padding: `${20 * u}px ${44 * u * k}px`, borderRadius: 999, whiteSpace: 'nowrap', boxShadow: `0 ${10 * u}px ${24 * u}px ${withAlpha(p.accent, 0.4)}`}}>{p.cta}</div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const hotelRatingCard = defineMotion<Props>({
  id: 'hotel-rating-card',
  title: 'Hotel rating card',
  category: 'ui',
  description:
    'A stay listing card: the photo wipes in and slowly pushes in, name and location slide up, stars fill one by one, the review score counts up, amenity icons pop in, the nightly price counts up and a Book button pulses.',
  source: ['original (round 3)'],
  useFor: 'Hotel, rental and resort promos, travel-booking app demos, "top-rated stay" reels, property / venue / restaurant rating cards — set the photo, name, stars, score, price and amenities.',
  durationInFrames: 210,
  defaultProps: {
    name: 'Harbor View Hotel',
    location: 'Old Town · 4 min walk to the beach',
    src: '',
    badge: 'Top rated',
    stars: 4,
    score: 9.2,
    scoreLabel: 'Exceptional',
    reviews: '1,284 reviews',
    price: 189,
    currency: '$',
    priceLabel: 'per night',
    amenities: [
      {icon: 'wifi', label: 'Free Wi-Fi'},
      {icon: 'pool', label: 'Pool'},
      {icon: 'breakfast', label: 'Breakfast'},
      {icon: 'parking', label: 'Parking'},
      {icon: 'gym', label: 'Gym'},
    ],
    cta: 'Book now',
    background: '#E3EAF2',
    card: '#FFFFFF',
    ink: '#14233B',
    accent: '#E8553D',
    startAt: 0,
  },
  propDocs: {
    name: 'property name',
    location: 'location line',
    src: "photo (public/ path or https URL); '' draws a procedural hotel scene",
    badge: "small tag on the photo ('' for none)",
    stars: 'star class 0-5 (halves allowed, e.g. 4.5)',
    score: 'review score that counts up (e.g. 9.2)',
    scoreLabel: 'word next to the score',
    reviews: 'review count text',
    price: 'nightly price (counts up)',
    currency: 'currency symbol in front of the price',
    priceLabel: 'small caps line under the price',
    amenities: 'up to 6: {icon, label} — icon: wifi | pool | breakfast | parking | gym | spa | ac | bar | pets | beach | desk | kitchen | shuttle | coffee',
    cta: 'button text',
    background: "page colour or 'transparent'",
    card: 'card colour',
    ink: 'text colour',
    accent: 'icons, badge and button colour',
    startAt: 'frame the scene starts',
  },
  component: HotelRatingCard,
  tags: ['hotel', 'travel', 'booking', 'rating', 'stars', 'review', 'price', 'amenities', 'resort', 'stay', 'accommodation', 'listing', 'card', 'ui'],
});
