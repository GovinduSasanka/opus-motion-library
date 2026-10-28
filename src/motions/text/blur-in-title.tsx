import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, TFont, eic, eoc, fitSize, hash01, tfonts} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Wide-tracked title whose letters sharpen out of a blur (video23 ABYSSES card: per-letter random
 * delay ≤ 0.45 s, 0.8 s ease-out each, blur 12 → 0; video8 blur-caption-swap; video10 serif-title-fade).
 * Optional swap to a second title (video23 zone-title-blur-swap): subtitle + rule fade (8 f), letters blur
 * 0→8 px and fade together (9 f), then the new title arrives left→right at 1.35 f per letter, 10.5 f each,
 * and the rule draws on.
 */

type Card = {title: string; subtitle?: string};
type Props = {
  title: string;
  subtitle: string;
  swapTo: Card | null;
  swapAt: number;
  startFrame: number;
  stagger: 'random' | 'ltr';
  staggerFrames: number;
  letterFrames: number;
  maxBlur: number;
  font: TFont;
  weight: number;
  size: number;
  tracking: number;
  color: string;
  subtitleFont: TFont;
  subtitleItalic: boolean;
  subtitleColor: string;
  underline: boolean;
  layout: 'center' | 'lower-left' | 'upper';
  glow: number;
  backdrop: BackdropKind;
  background: string;
  src: string;
  fadeOut: boolean;
  /** round-2: gold material + a specular sheen / glint sweeping across the letters */
  material: 'plain' | 'gold';
  sheenAt: number;
  sheenFrames: number;
  glint: {t0?: number; dur?: number; angle?: number} | null;
  kicker: string;
};

const GOLD = ['#7A5516', '#B8862B', '#F3D98B', '#C9962F', '#8E6418', '#E8C46A', '#6E4B12'];

const TitleBlock: React.FC<{
  card: Card;
  p: Props;
  inStart: number;
  ltr: boolean;
  outStart: number | null;
}> = ({card, p, inStart, ltr, outStart}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const chars = [...card.title];
  const center = p.layout !== 'lower-left';
  const maxW = w * (center ? 0.86 : 0.8);
  const fs = fitSize(card.title, p.size * u, maxW, p.font, p.tracking);
  const subFs = fitSize(card.subtitle ?? '', Math.max(fs * 0.36, 26 * u), maxW, p.subtitleFont, 0.06);
  // per-letter timing
  const per = ltr ? 1.35 : 0;
  const dur = ltr ? 10.5 : p.letterFrames;
  const delays = chars.map((_, i) => (ltr ? i * per : hash01(i, card.title) * p.staggerFrames));
  const lastStart = inStart + Math.max(0, ...delays);
  const subIn = ltr ? lastStart + 3 : inStart + Math.max(0, ...delays) + dur * 0.55;
  const subDur = ltr ? 9 : 20;
  // exits
  const subOut = outStart === null ? 0 : eoc((frame - outStart) / 8);
  const letterOut = outStart === null ? 0 : eic((frame - outStart - 6) / 9);
  const subP = eoc((frame - subIn) / subDur) * (1 - subOut);
  const rule = eoc((frame - subIn) / 12) * (1 - subOut);
  // sheen sweep (gold / glint): a hot band crossing the letters left to right
  const sheenOn = p.material === 'gold' || p.glint !== null;
  const g = p.glint ?? {};
  const sT0 = g.t0 !== undefined && g.t0 >= 0 ? g.t0 : p.sheenAt >= 0 ? p.sheenAt : lastStart + dur + 6;
  const sDur = g.dur ?? p.sheenFrames;
  const sweep = -0.3 + 1.6 * clamp((frame - sT0) / Math.max(1, sDur));
  const sAngle = g.angle ?? 100;
  const n = Math.max(1, chars.length);
  const pos: React.CSSProperties =
    p.layout === 'lower-left'
      ? {left: w * 0.06, bottom: h * 0.12, alignItems: 'flex-start'}
      : p.layout === 'upper'
        ? {left: 0, right: 0, top: h * 0.16, alignItems: 'center'}
        : {left: 0, right: 0, top: h * 0.5, transform: `translateY(-50%)`, alignItems: 'center'};
  return (
    <div style={{position: 'absolute', display: 'flex', flexDirection: 'column', ...pos}}>
      {p.kicker ? (
        <div style={{fontFamily: tfonts.mono, fontSize: Math.max(14 * u, fs * 0.17), letterSpacing: '0.5em', color: p.subtitleColor, opacity: eoc((frame - inStart - 4) / 14) * (1 - subOut), marginBottom: fs * 0.4, paddingLeft: center ? '0.5em' : 0, whiteSpace: 'pre'}}>
          {p.kicker}
        </div>
      ) : null}
      <div style={{fontFamily: tfonts[p.font], fontWeight: p.weight, fontSize: fs, color: p.color, whiteSpace: 'pre', lineHeight: 1.1, paddingLeft: center ? `${p.tracking}em` : 0}}>
        {chars.map((c, i) => {
          const t = eoc((frame - inStart - delays[i]) / dur);
          const op = t * (1 - letterOut);
          const blur = p.maxBlur * u * (1 - t) + 8 * u * letterOut;
          let sheenStyle: React.CSSProperties = {};
          if (sheenOn) {
            const c = (0.5 + (sweep - (i + 0.5) / n) * n) * 100;
            const hot = `linear-gradient(${sAngle}deg, rgba(255,255,255,0) ${c - 35}%, rgba(255,255,255,0.92) ${c}%, rgba(255,255,255,0) ${c + 35}%)`;
            const base = p.material === 'gold' ? `linear-gradient(180deg, ${GOLD.join(', ')})` : `linear-gradient(${p.color}, ${p.color})`;
            sheenStyle = {backgroundImage: `${hot}, ${base}`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent'};
          }
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: `${p.tracking}em`,
                opacity: op,
                filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                textShadow: p.glow > 0 && !sheenOn ? `0 0 ${14 * u}px rgba(255,255,255,${p.glow})` : undefined,
                minWidth: c === ' ' ? '0.28em' : undefined,
                ...sheenStyle,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
      {card.subtitle ? (
        <div
          style={{
            marginTop: fs * 0.55,
            fontFamily: tfonts[p.subtitleFont],
            fontStyle: p.subtitleItalic ? 'italic' : 'normal',
            fontSize: subFs,
            color: p.subtitleColor,
            letterSpacing: '0.06em',
            opacity: subP,
            filter: `blur(${(1 - subP) * 3 * u}px)`,
            whiteSpace: 'pre',
          }}
        >
          {card.subtitle}
        </div>
      ) : null}
      {p.underline && (
        <div
          style={{
            marginTop: fs * 0.3,
            height: Math.max(1, 1.5 * u),
            width: Math.min(420 * u, maxW) * rule,
            background: `linear-gradient(90deg, ${p.subtitleColor}, transparent)`,
          }}
        />
      )}
    </div>
  );
};

const BlurInTitle: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {u, durationInFrames} = useStage();
  const swap = p.swapTo && p.swapTo.title ? p.swapTo : null;
  const swapIn = p.swapAt + 17;
  const end = durationInFrames;
  const fade = p.fadeOut ? clamp((frame - (end - 16)) / 14) : 0;
  return (
    <AbsoluteFill>
      <Backdrop kind={p.backdrop} color={p.background} src={p.src || undefined} depth={0.86} />
      <AbsoluteFill style={{opacity: 1 - fade, filter: fade > 0 ? `blur(${fade * 10 * u}px)` : undefined}}>
        {(!swap || frame < swapIn + 2) && <TitleBlock card={{title: p.title, subtitle: p.subtitle}} p={p} inStart={p.startFrame} ltr={p.stagger === 'ltr'} outStart={swap ? p.swapAt : null} />}
        {swap && frame >= swapIn && <TitleBlock card={swap} p={p} inStart={swapIn} ltr outStart={null} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const blurInTitle = defineMotion<Props>({
  id: 'blur-in-title',
  title: 'Blur-in title card',
  category: 'text',
  description: 'Wide-tracked title whose letters sharpen out of a blur with a random stagger, tagline and rule below, then blur-swap to a second title.',
  source: ['video23 1:31-1:33', 'video23 0:07.6-0:09.1', 'video8 0:00-0:40', 'video10 0:02-0:40', 'video21 0:12'],
  useFor: 'Documentary title cards, chapter/zone names, place names and calm caption swaps.',
  durationInFrames: 210,
  defaultProps: {
    title: 'ABYSSES',
    subtitle: 'less than five percent of the ocean has been explored',
    swapTo: {title: 'THE MIDNIGHT ZONE', subtitle: '1 000 m  ·  no sunlight'},
    swapAt: 118,
    startFrame: 10,
    stagger: 'random',
    staggerFrames: 14,
    letterFrames: 24,
    maxBlur: 12,
    font: 'serif',
    weight: 500,
    size: 84,
    tracking: 1.1,
    color: '#EEF0F2',
    subtitleFont: 'serif',
    subtitleItalic: true,
    subtitleColor: '#7d8b93',
    underline: false,
    layout: 'center',
    glow: 0.3,
    backdrop: 'ocean',
    background: '#020406',
    src: '',
    fadeOut: true,
    material: 'plain',
    sheenAt: -1,
    sheenFrames: 18,
    glint: null,
    kicker: '',
  },
  propDocs: {
    title: 'first title (use caps + wide tracking for the video23 look)',
    subtitle: 'tagline under the first title',
    swapTo: '{title, subtitle} to blur-swap to at swapAt, or null for a single card',
    swapAt: 'frame the first title starts blurring out',
    stagger: 'random (video23 card) | ltr (video23 zone swap)',
    staggerFrames: 'max random delay per letter (0.45 s = 14 f)',
    letterFrames: 'frames each letter takes to sharpen (0.8 s = 24 f)',
    maxBlur: 'starting blur in px',
    font: 'font role: serif | sans | grotesk | display | instrument | mono | rounded …',
    tracking: 'letter spacing in em (video23 ≈ 1.1, video21 ≈ 0.4)',
    layout: 'center | upper (video10 sky titles) | lower-left (video23 zone caption)',
    underline: 'thin rule under the subtitle that draws left→right and fades at its end',
    glow: 'soft white glow opacity behind letters',
    backdrop: 'ocean | ink | dusk | peaks | dunes | warm | none (plain background colour)',
    src: 'optional public/ image behind the title',
    fadeOut: 'blur-fade everything out over the last 16 frames',
    material: "'plain' (default) | 'gold' (7-stop banded gold gradient letters; combine with a light backdrop / ink background)",
    sheenAt: 'frame the specular band starts crossing the letters (-1 = right after the letters land)',
    sheenFrames: 'frames the band takes to cross (~0.6 s)',
    glint: "{t0?, dur?, angle?} a white diagonal glint sweeping across the (plain-colour) letters; null = off. Pair with weight 200 and tracking ~0.5 for a thin launch-film title",
    kicker: 'small tracked mono caps line above the title ("" = none)',
  },
  component: BlurInTitle,
  tags: ['title', 'blur', 'serif', 'card', 'documentary', 'gold', 'sheen', 'glint', 'luxury', 'thin', 'product-launch', 'kicker'],
});
