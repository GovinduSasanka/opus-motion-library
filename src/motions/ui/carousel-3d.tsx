import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {FilmGrain, useStage, Vignette} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {mixHex5, rgba5} from '../../core/r2-pr5-kit';

/**
 * 3D carousel: cards (your images, or procedural poster cards) sit on a ring and turn past the camera over a
 * glossy floor with mirrored reflections. A motion-blurred whip (expo in/out, directional blur driven by the angular
 * velocity) lands the chosen hero card face-on, which then pushes forward while the others dim.
 * CSS 3D transforms (preserve-3d) + SVG directional blur — deterministic, no WebGL.
 */

type Item = {src?: string; title?: string; subtitle?: string; color?: string};

type Props = {
  items: Item[];
  heroIndex: number;
  whipAt: number;
  whipFrames: number;
  radius: number;
  idleSpeed: number;
  cardAspect: number;
  reflection: boolean;
  motionBlur: number;
  background: string;
  floor: string;
  accent: string;
  ink: string;
  title: string;
};

const PALS = [
  ['#3B4CFF', '#9B5CFF'],
  ['#FF5C8A', '#FFB36B'],
  ['#14B8A6', '#7DD3FC'],
  ['#F59E0B', '#EF4444'],
  ['#6366F1', '#22D3EE'],
  ['#10B981', '#A3E635'],
];

const Face: React.FC<{item: Item; i: number; cw: number; ch: number; u: number}> = ({item, i, cw, ch, u}) => {
  const pal = item.color ? [item.color, mixHex5(item.color, '#000000', 0.45)] : PALS[i % PALS.length];
  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: 22 * u, overflow: 'hidden', background: `linear-gradient(150deg, ${pal[0]}, ${pal[1]})`, boxShadow: `inset 0 0 0 ${2 * u}px rgba(255,255,255,0.18)`}}>
      {item.src ? (
        <Img src={resolveSrc(item.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      ) : (
        <>
          <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            <circle cx={70} cy={34} r={22} fill="#fff" opacity={0.18} />
            <circle cx={70} cy={34} r={10} fill="#fff" opacity={0.28} />
            <path d={`M0 ${96 - (i % 3) * 6} L28 ${62 + (i % 2) * 6} L50 ${84} L74 ${54 + (i % 3) * 4} L100 ${88} V130 H0 Z`} fill="#000" opacity={0.2} />
            <path d={`M0 112 L34 88 L58 104 L100 78 V130 H0 Z`} fill="#000" opacity={0.22} />
          </svg>
        </>
      )}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 32%, rgba(0,0,0,0.5) 100%)'}} />
      {(item.title || !item.src) && (
        <div style={{position: 'absolute', left: 22 * u, right: 22 * u, bottom: 22 * u, color: '#fff'}}>
          <div style={{fontFamily: fonts.mono, fontSize: 13 * u, letterSpacing: 3 * u, opacity: 0.7}}>{String(i + 1).padStart(2, '0')}</div>
          <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: Math.min(cw * 0.12, 40 * u), lineHeight: 1.05, marginTop: 4 * u, letterSpacing: -0.5 * u}}>{item.title ?? ''}</div>
          {item.subtitle ? <div style={{fontFamily: fonts.sans, fontSize: 15 * u, opacity: 0.75, marginTop: 6 * u}}>{item.subtitle}</div> : null}
        </div>
      )}
    </div>
  );
};

const Carousel3D: React.FC<Props> = ({items, heroIndex, whipAt, whipFrames, radius, idleSpeed, cardAspect, reflection, motionBlur, background, floor, accent, ink, title}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const n = Math.max(3, items.length);
  const step = (Math.PI * 2) / n;
  const hero = ((Math.round(heroIndex) % n) + n) % n;

  // card size from the frame; ring radius from the width (spec: 1.2-1.6 frame widths is the whole ring's reach; use the
  // chord needed so neighbours just clear each other, then scale by `radius`)
  const cw = (portrait ? 0.58 : 0.24) * w;
  const ch = cw / cardAspect;
  const R = Math.max(cw * 0.5 / Math.tan(step / 2) * 1.35, 0) * radius;
  const persp = (portrait ? 1.15 : 1.0) * w + R * 0.5;

  // angle timeline (rad). Cards sit at i*step; the ring rotation theta brings card k to the front when theta = -k*step.
  const idleAt = (f: number) => -idleSpeed * (f / 30);
  const settle = -hero * step;
  const startTheta = idleAt(whipAt);
  // make the whip end exactly on the hero (>= one extra turn so it reads as a whip)
  const TAU = Math.PI * 2;
  const dRaw = settle - startTheta;
  const whipDelta = (((dRaw % TAU) + TAU) % TAU) - TAU - TAU; // negative (same direction as idle), 1-2 turns
  const thetaAt = (f: number) => {
    if (f <= whipAt) return idleAt(f);
    const t = clamp((f - whipAt) / whipFrames);
    return startTheta + whipDelta * ease.expoInOut(t);
  };
  const theta = thetaAt(frame);
  const omega = Math.abs(thetaAt(frame) - thetaAt(frame - 1));
  const blurPx = clamp(omega * motionBlur * 120, 0, 60) * u; // angular speed -> horizontal blur

  const landed = prog(frame, whipAt + whipFrames - 2, whipAt + whipFrames + 22, ease.out);
  const entrance = prog(frame, 0, 26, ease.out);

  return (
    <AbsoluteFill style={{background}}>
      {/* room: spotlight + floor */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 55% at 50% ${portrait ? 40 : 46}%, ${rgba5(accent, 0.28)}, transparent 72%)`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.62, bottom: 0, background: `linear-gradient(180deg, ${rgba5(floor, 0)} 0%, ${rgba5(floor, 0.85)} 18%, ${floor} 100%)`}} />
      <div style={{position: 'absolute', left: '15%', right: '15%', top: h * 0.625, height: 2 * u, background: `linear-gradient(90deg, transparent, ${rgba5('#fff', 0.35)}, transparent)`}} />
      <div style={{position: 'absolute', left: '28%', right: '28%', top: h * 0.64, height: h * 0.2, background: `radial-gradient(ellipse at 50% 0%, ${rgba5(accent, 0.28 + 0.2 * landed)}, transparent 70%)`}} />

      {/* scene */}
      <div style={{position: 'absolute', inset: 0, perspective: persp, perspectiveOrigin: `50% ${portrait ? 40 : 44}%`, filter: blurPx > 0.6 ? 'url(#c3d-blur)' : undefined, opacity: entrance}}>
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <filter id="c3d-blur" x="-20%" y="-5%" width="140%" height="110%">
              <feGaussianBlur stdDeviation={`${blurPx} 0`} />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: w / 2,
            top: h * (portrait ? 0.4 : 0.44) - ch / 2,
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            transform: `translateZ(${-R}px) scale(${1 + (1 - entrance) * 0.4}) rotateY(${(theta * 180) / Math.PI}deg)`,
          }}
        >
          {items.slice(0, n).map((item, i) => {
            const a = i * step + theta; // angle of this card relative to the camera (0 = front)
            const front = Math.cos(a);
            const isHero = i === hero;
            const push = isHero ? landed : 0;
            const dim = isHero ? 1 : 1 - 0.38 * landed;
            const shade = 0.42 + 0.58 * ((front + 1) / 2);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: -cw / 2,
                  top: 0,
                  width: cw,
                  height: ch,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${(i * step * 180) / Math.PI}deg) translateZ(${R + push * cw * 0.16}px) scale(${1 + push * 0.04})`,
                  filter: `brightness(${(shade * dim).toFixed(3)})`,
                }}
              >
                <Face item={item} i={i} cw={cw} ch={ch} u={u} />
                {reflection ? (
                  <div style={{position: 'absolute', left: 0, top: ch + 8 * u, width: cw, height: ch, transform: 'scaleY(-1)', opacity: 0.42, WebkitMaskImage: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 55%)', maskImage: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 55%)'}}>
                    <Face item={item} i={i} cw={cw} ch={ch} u={u} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* labels */}
      <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.07, textAlign: 'center', color: ink, opacity: entrance * (1 - landed)}}>
        <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: (portrait ? 56 : 48) * u, letterSpacing: -1 * u}}>{title}</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: h * 0.04, textAlign: 'center', color: ink, opacity: landed}}>
        <div style={{fontFamily: fonts.mono, fontSize: 16 * u, letterSpacing: 4 * u, opacity: 0.6}}>FEATURED</div>
        <div style={{fontFamily: fonts.grotesk, fontWeight: 700, fontSize: 30 * u, marginTop: 4 * u}}>{items[hero]?.title ?? ''}</div>
      </div>
      <Vignette strength={0.5} />
      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};

const mk = (title: string, subtitle: string): Item => ({title, subtitle});

export const carousel3d = defineMotion<Props>({
  id: 'carousel-3d',
  title: 'Carousel 3D',
  category: 'ui',
  description:
    'Cards or clips on a 3D ring rotate past the camera over a glossy floor with mirrored reflections; a motion-blurred whip lands the hero card face-on, which pushes forward while the others dim.',
  source: ['prompt-corpus: awesome-opus5-5-videos (MIT) — 3D ring gallery cases (6), original implementation'],
  useFor: 'Portfolio reels, product galleries, template showcases, "pick from the collection" beats.',
  durationInFrames: 180,
  defaultProps: {
    items: [mk('Northwind', 'brand system'), mk('Lumen', 'mobile app'), mk('Atlas', 'dashboard'), mk('Meridian', 'campaign'), mk('Harbor', 'web store'), mk('Vela', 'identity'), mk('Orchid', 'packaging'), mk('Cobalt', 'motion')],
    heroIndex: 2,
    whipAt: 62,
    whipFrames: 20,
    radius: 1,
    idleSpeed: 0.4,
    cardAspect: 0.78,
    reflection: true,
    motionBlur: 1,
    background: '#0A0B12',
    floor: '#10121D',
    accent: '#5B7CFF',
    ink: '#FFFFFF',
    title: 'Selected work',
  },
  propDocs: {
    items: '[{src?, title?, subtitle?, color?}] cards on the ring (src = public/ image; without it a procedural poster card is drawn); 3-12 items',
    heroIndex: 'index of the card the whip lands on',
    whipAt: 'frame the whip starts',
    whipFrames: 'whip length in frames (8-24)',
    radius: 'ring radius multiplier (1 = cards just clear each other)',
    idleSpeed: 'idle turn speed in rad/s before the whip',
    cardAspect: 'card width / height',
    reflection: 'mirrored floor reflections',
    motionBlur: 'directional blur strength during the whip (0 = off)',
    background: 'background colour',
    floor: 'floor colour',
    accent: 'spotlight / floor glow colour',
    ink: 'text colour',
    title: 'title at the top',
  },
  component: Carousel3D,
  tags: ['carousel', '3d', 'ring', 'gallery', 'portfolio', 'cards', 'reflection', 'whip', 'motion blur', 'showcase', 'reel', 'template', 'product gallery', 'rotate', 'perspective', 'ui', 'cover flow'],
});
