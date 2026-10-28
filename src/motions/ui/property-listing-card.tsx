import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {fmt, resolveFont} from '../../core/r3-chart-kit';
import {isClear, mixHex} from '../../core/r3-vertical-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  src: string;
  price: number;
  pricePrefix: string;
  priceSuffix: string;
  status: string;
  title: string;
  location: string;
  beds: number;
  baths: number;
  area: number;
  areaUnit: string;
  bedsLabel: string;
  bathsLabel: string;
  tags: string[];
  favorite: boolean;
  background: string;
  cardColor: string;
  ink: string;
  accent: string;
  fontFamily: string;
  startAt: number;
  speed: number;
};

const ICONS: Record<string, React.ReactNode> = {
  bed: (
    <>
      <path d="M3 19V6M3 15h18v4M21 19v-5a3 3 0 0 0-3-3h-7v4" />
      <circle cx="7" cy="10.5" r="1.8" />
    </>
  ),
  bath: <path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2zM6 12V6.5a2.3 2.3 0 0 1 4-1.5M7 19l-1 2M17 19l1 2" />,
  area: <path d="M4 4h16v16H4zM8.5 15.5l7-7M10.5 8.5h5v5" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
};
const Ico: React.FC<{name: string; size: number; color: string; stroke?: number}> = ({name, size, color, stroke = 1.9}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block', flex: 'none'}}>
    {ICONS[name]}
  </svg>
);

/** procedural house picture used when no photo src is given */
const HouseArt: React.FC<{accent: string; id: string}> = ({accent, id}) => (
  <svg width="100%" height="100%" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" style={{display: 'block'}}>
    <defs>
      <linearGradient id={id + '-sky'} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={mixHex(accent, '#9fd0ff', 0.55)} />
        <stop offset="1" stopColor="#F6E6CF" />
      </linearGradient>
    </defs>
    <rect width="800" height="520" fill={`url(#${id}-sky)`} />
    <circle cx="640" cy="110" r="52" fill="#FFF3C4" opacity="0.95" />
    <ellipse cx="170" cy="120" rx="80" ry="22" fill="#fff" opacity="0.75" />
    <ellipse cx="225" cy="106" rx="50" ry="20" fill="#fff" opacity="0.75" />
    <rect y="390" width="800" height="130" fill="#7DB07A" />
    <rect y="390" width="800" height="14" fill="#6AA068" />
    <path d="M330 520 L372 400 L428 400 L470 520Z" fill="#E9DFD0" />
    <rect x="215" y="215" width="370" height="185" fill="#F3EBDD" />
    <rect x="215" y="388" width="370" height="12" fill="#CFC3AF" />
    <path d="M185 222 L400 108 L615 222Z" fill={mixHex(accent, '#3b2a22', 0.5)} />
    <rect x="360" y="296" width="80" height="104" rx="6" fill={accent} />
    <circle cx="428" cy="350" r="5" fill="#fff" />
    <rect x="250" y="262" width="76" height="66" rx="5" fill="#BFE0F5" stroke="#fff" strokeWidth="6" />
    <rect x="474" y="262" width="76" height="66" rx="5" fill="#BFE0F5" stroke="#fff" strokeWidth="6" />
    <path d="M288 262v66M250 295h76M512 262v66M474 295h76" stroke="#fff" strokeWidth="4" />
    <rect x="470" y="150" width="36" height="62" fill="#C9B9A2" />
    <circle cx="110" cy="360" r="52" fill="#5C9560" />
    <rect x="104" y="395" width="12" height="40" fill="#7A5A3C" />
    <circle cx="700" cy="380" r="38" fill="#69A06A" />
    <rect x="695" y="408" width="10" height="30" fill="#7A5A3C" />
  </svg>
);

const PropertyListingCard: React.FC<Props> = ({src, price, pricePrefix, priceSuffix, status, title, location, beds, baths, area, areaUnit, bedsLabel, bathsLabel, tags, favorite, background, cardColor, ink, accent, fontFamily, startAt, speed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, square} = useStage();
  const font = resolveFont(fontFamily);
  const f = (frame - startAt) * speed;
  const vertical = portrait || square;
  const k = portrait ? 1.18 : 1;

  const cw = vertical ? (portrait ? w - 120 * u : Math.min(w - 140 * u, 760 * u)) : Math.min(w - 220 * u, 1380 * u);
  const ch = vertical ? Math.min(h - (portrait ? 300 : 110) * u, cw * 1.42) : Math.min(h - 200 * u, 640 * u);
  const enter = prog(f, 0, 26, ease.out);
  const imgReveal = prog(f, 6, 40, ease.inOut);
  const kb = 1.14 - 0.14 * prog(f, 0, 230 * 0.9, ease.sine);
  const priceT = prog(f, 22, 66, ease.out);
  const shine = prog(f, 70, 110, ease.inOut);
  const favT = favorite ? prog(f, 96, 108, ease.back) : 0;
  const favPulse = favorite ? 1 + 0.35 * Math.sin(clamp((f - 96) / 14) * Math.PI) : 1;
  const pop = (start: number) => ease.back(prog(f, start, start + 14, ease.linear));
  const stats = [
    {icon: 'bed', value: fmt(beds), label: bedsLabel},
    {icon: 'bath', value: fmt(baths), label: bathsLabel},
    {icon: 'area', value: fmt(area), label: areaUnit},
  ];
  const clear = isClear(background);
  const imgFlex = vertical ? '0 0 50%' : '0 0 54%';
  const pad = 34 * u * k;

  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background, alignItems: 'center', justifyContent: 'center', fontFamily: font}}>
      <div
        style={{
          width: cw,
          height: ch,
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          borderRadius: 36 * u,
          overflow: 'hidden',
          background: cardColor,
          boxShadow: `0 ${30 * u}px ${80 * u}px rgba(15,25,40,0.28), 0 ${4 * u}px ${14 * u}px rgba(15,25,40,0.12)`,
          opacity: clamp(enter * 1.6),
          transform: `translateY(${(1 - enter) * 70 * u}px) scale(${0.94 + 0.06 * enter})`,
          color: ink,
        }}
      >
        {/* photo */}
        <div style={{position: 'relative', flex: imgFlex, overflow: 'hidden', clipPath: `inset(0 0 ${(1 - imgReveal) * 100}% 0)`}}>
          <div style={{position: 'absolute', inset: 0, transform: `scale(${kb})`}}>
            {src ? <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <HouseArt accent={accent} id="plc" />}
          </div>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.22) 100%)'}} />
          <div style={{position: 'absolute', top: 0, bottom: 0, width: '34%', left: `${-40 + shine * 170}%`, background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)', transform: 'skewX(-14deg)', opacity: shine > 0 && shine < 1 ? 1 : 0}} />
          {status ? (
            <div
              style={{
                position: 'absolute',
                left: 26 * u * k,
                top: 26 * u * k,
                padding: `${10 * u * k}px ${22 * u * k}px`,
                borderRadius: 999,
                background: accent,
                color: '#fff',
                fontWeight: 800,
                fontSize: 22 * u * k,
                letterSpacing: 2.5 * u,
                transform: `translateX(${(1 - prog(f, 26, 44, ease.out)) * -60 * u}px)`,
                opacity: prog(f, 26, 40),
              }}
            >
              {status}
            </div>
          ) : null}
          <div
            style={{
              position: 'absolute',
              right: 26 * u * k,
              top: 26 * u * k,
              width: 64 * u * k,
              height: 64 * u * k,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.94)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: prog(f, 30, 44),
            }}
          >
            <svg width={34 * u * k} height={34 * u * k} viewBox="0 0 24 24" style={{transform: `scale(${favPulse})`}}>
              <path d="M12 20.5C5 15 3 11.5 3 8.7A4.7 4.7 0 0 1 12 6.8 4.7 4.7 0 0 1 21 8.7c0 2.8-2 6.3-9 11.8z" fill={favT > 0.05 ? '#E5484D' : 'none'} stroke={favT > 0.05 ? '#E5484D' : '#44505C'} strokeWidth="1.9" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {/* details */}
        <div style={{flex: 1, minWidth: 0, minHeight: 0, padding: pad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 * u}}>
          <div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 10 * u, opacity: prog(f, 18, 34), transform: `translateY(${(1 - prog(f, 18, 40)) * 22 * u}px)`}}>
              <span style={{fontSize: (vertical ? 70 : 76) * u * k, fontWeight: 800, letterSpacing: -1.5 * u, color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{fmt(price * priceT, 0, pricePrefix, priceSuffix)}</span>
            </div>
            <div style={{marginTop: 16 * u * k, fontSize: 38 * u * k, fontWeight: 700, lineHeight: 1.15, opacity: prog(f, 28, 46), transform: `translateY(${(1 - prog(f, 28, 50)) * 18 * u}px)`}}>{title}</div>
            <div style={{marginTop: 12 * u * k, display: 'flex', alignItems: 'center', gap: 10 * u, fontSize: 26 * u * k, fontWeight: 500, opacity: prog(f, 36, 54) * 0.7}}>
              <span style={{transform: `translateY(${-Math.sin(clamp((f - 40) / 16) * Math.PI) * 10 * u}px)`}}>
                <Ico name="pin" size={30 * u * k} color={accent} />
              </span>
              <span style={{lineHeight: 1.2}}>{location}</span>
            </div>
          </div>
          <div style={{display: 'flex', gap: 14 * u * k, borderTop: `${2 * u}px solid ${mixHex(ink, cardColor, 0.88)}`, borderBottom: tags.length ? 'none' : undefined, paddingTop: 20 * u * k}}>
            {stats.map((s, i) => {
              const p = pop(46 + i * 8);
              return (
                <div key={i} style={{flex: 1, display: 'flex', alignItems: 'center', gap: 12 * u * k, opacity: clamp(p * 2), transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: 'left center'}}>
                  <div style={{width: 58 * u * k, height: 58 * u * k, borderRadius: 16 * u, background: mixHex(accent, cardColor, 0.85), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                    <Ico name={s.icon} size={32 * u * k} color={accent} />
                  </div>
                  <div style={{lineHeight: 1.05, minWidth: 0}}>
                    <div style={{fontSize: 34 * u * k, fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{s.value}</div>
                    <div style={{fontSize: 20 * u * k, fontWeight: 500, opacity: 0.6, whiteSpace: 'nowrap'}}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {tags.length ? (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 10 * u * k}}>
              {tags.slice(0, 6).map((t, i) => {
                const p = pop(74 + i * 6);
                return (
                  <span key={i} style={{padding: `${8 * u * k}px ${20 * u * k}px`, borderRadius: 999, background: mixHex(ink, cardColor, 0.92), fontSize: 22 * u * k, fontWeight: 600, opacity: clamp(p * 2), transform: `scale(${0.6 + 0.4 * p})`}}>
                    {t}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const propertyListingCard = defineMotion<Props>({
  id: 'property-listing-card',
  title: 'Property listing card',
  category: 'ui',
  description:
    'A real-estate listing card rises in: the photo (or a drawn house) wipes in with a slow push-in and light sweep under a status badge and a favourite heart, then the price counts up, the title and a location pin appear, bed / bath / area icon stats pop in one by one and feature tags pop below.',
  source: ['original round-3 vertical motion'],
  useFor:
    'Real-estate, rental and hospitality listings, property-site hero animations, agent promo reels, marketplace item cards. Pass a photo src, the price, beds / baths / area, the location and feature tags; horizontal card in 16:9, vertical in 1:1 and 9:16.',
  durationInFrames: 180,
  defaultProps: {
    src: '',
    price: 485000,
    pricePrefix: '$',
    priceSuffix: '',
    status: 'FOR SALE',
    title: 'Modern family home',
    location: '24 Garden Lane, Greenfield',
    beds: 4,
    baths: 3,
    area: 2150,
    areaUnit: 'sq ft',
    bedsLabel: 'Beds',
    bathsLabel: 'Baths',
    tags: ['Garden', 'Garage', 'Pool', 'Pet friendly'],
    favorite: true,
    background: '#E7EDF3',
    cardColor: '#FFFFFF',
    ink: '#16202B',
    accent: '#2F6FED',
    fontFamily: '',
    startAt: 6,
    speed: 1,
  },
  propDocs: {
    src: 'photo path in public/ or URL (empty = a drawn house in the accent colour)',
    price: 'price number (counts up)',
    pricePrefix: 'text before the price (currency symbol)',
    priceSuffix: 'text after the price, e.g. "/mo"',
    status: 'badge over the photo (empty = none)',
    title: 'listing title',
    location: 'address / area line next to the pin',
    beds: 'number of bedrooms',
    baths: 'number of bathrooms',
    area: 'floor area number',
    areaUnit: 'unit label under the area number',
    bedsLabel: 'label under the bedroom count',
    bathsLabel: 'label under the bathroom count',
    tags: 'feature chips (up to 6)',
    favorite: 'the heart button gets tapped and fills',
    background: 'page colour, or "transparent"',
    cardColor: 'card background colour',
    ink: 'text colour',
    accent: 'price, badge, icon and drawn-house colour',
    fontFamily: 'CSS font family (empty = Space Grotesk)',
    startAt: 'frame the card starts entering',
    speed: 'animation speed multiplier',
  },
  component: PropertyListingCard,
  tags: ['real estate', 'property', 'listing', 'house', 'home', 'rental', 'for sale', 'price', 'beds', 'baths', 'location pin', 'card', 'agent', 'overlay'],
});
