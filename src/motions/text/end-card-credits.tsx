import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, eoc, fitSize, tfonts} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * End card over a drifting shot (video8 end-card-stats-stagger, video17/23 end titles). A bottom
 * scrim fades in (0.7 s, ease-in-out), then headline, two mono stat lines and a credit fade up with a
 * blur-in, 0.55 s / 1.2 s / 2.0 s after the headline; the last 11 frames fade to black.
 */

type Props = {
  title: string;
  headline: string;
  lines: string[];
  credit: string;
  startFrame: number;
  offsets: number[];
  scrimStrength: number;
  headlineY: number;
  fadeToBlack: boolean;
  backdrop: BackdropKind;
  src: string;
};

const Item: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const frame = useCurrentFrame();
  const {u} = useStage();
  const t = eoc((frame - at) / 9);
  return (
    <div style={{opacity: t, transform: `translateY(${(1 - t) * 10 * u}px)`, filter: t < 1 ? `blur(${(1 - t) * 6 * u}px)` : undefined, ...style}}>
      {children}
    </div>
  );
};

const EndCardCredits: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const scrim = ease.inOut(clamp((frame - 2) / 21));
  const fade = p.fadeToBlack ? ease.in(clamp((frame - (D - 11)) / 11)) : 0;
  const s = p.startFrame;
  const off = (i: number, d: number) => s + Math.round((p.offsets[i] ?? d) * 30);
  const maxW = w * (portrait ? 0.86 : 0.7);
  const titleFs = fitSize(p.title, 110 * u, maxW, 'serif', 0.5);
  const headFs = portrait ? 62 * u : 58 * u;
  return (
    <AbsoluteFill style={{background: p.backdrop === 'none' && !p.src ? 'transparent' : '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${1.04 + frame * 0.0003}) translateX(${-frame * 0.15 * u}px)`}}>
        <Backdrop kind={p.backdrop} src={p.src || undefined} drift={1.2} />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: scrim * p.scrimStrength, background: 'linear-gradient(180deg, rgba(10,12,18,0) 42%, rgba(10,12,18,0.82) 100%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: h * (portrait ? p.headlineY - 0.06 : p.headlineY), display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: '#fff', transform: 'translateY(-50%)'}}>
        {p.title && (
          <Item at={s - 18} style={{fontFamily: fonts.serif, fontWeight: 500, fontSize: titleFs, letterSpacing: '0.5em', paddingLeft: '0.5em', marginBottom: 30 * u, textShadow: `0 ${3 * u}px ${18 * u}px rgba(0,0,0,.5)`}}>
            {p.title}
          </Item>
        )}
        <Item at={s} style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: headFs, maxWidth: maxW, lineHeight: 1.2, textShadow: `0 ${2 * u}px ${12 * u}px rgba(0,0,0,.45)`}}>
          {p.headline}
        </Item>
        {p.lines.map((l, i) => (
          <Item
            key={i}
            at={off(i, i === 0 ? 0.55 : 1.2)}
            style={{fontFamily: tfonts.mono, fontSize: 24 * u, letterSpacing: '0.02em', color: i === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)', marginTop: (i === 0 ? 28 : 12) * u, maxWidth: maxW, lineHeight: 1.45}}
          >
            {l}
          </Item>
        ))}
        {p.credit && (
          <Item at={off(p.lines.length, 2.0)} style={{fontFamily: fonts.sans, fontWeight: 600, fontSize: 30 * u, marginTop: 30 * u}}>
            {p.credit}
          </Item>
        )}
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};

export const endCardCredits = defineMotion<Props>({
  id: 'end-card-credits',
  title: 'End card credits',
  category: 'text',
  description: 'Bottom scrim fades in over a drifting landscape; headline, mono stat lines and a credit stagger in with a blur fade-up, then fade to black.',
  source: ['video8 0:38.5-0:43', 'video17 0:38.7-0:42.8', 'video23 1:31'],
  useFor: 'Closing cards, "how it was made" stats, credits and calls to action over the last shot.',
  durationInFrames: 165,
  defaultProps: {
    title: '',
    headline: 'every pixel you just saw is math.',
    lines: ['0 images · 0 footage · 0 video models · 0 audio samples', 'terrain · erosion · light · sky · clouds · lens · music — 1,135 lines of code'],
    credit: 'written by Claude',
    startFrame: 18,
    offsets: [0.55, 1.2, 2.0],
    scrimStrength: 1,
    headlineY: 0.72,
    fadeToBlack: true,
    backdrop: 'peaks',
    src: '',
  },
  propDocs: {
    title: 'optional wide-tracked serif title shown above the headline ("" = none)',
    headline: 'main end-card sentence',
    lines: 'mono stat lines (first at 85 % white, the rest 55 %)',
    credit: 'bold credit line',
    startFrame: 'frame the headline fades in',
    offsets: 'seconds after the headline for each stat line and the credit (video8: 0.55, 1.2, 2.0)',
    scrimStrength: 'bottom gradient scrim opacity',
    headlineY: 'vertical centre of the text block as a fraction of height',
    fadeToBlack: 'fade to black over the last 11 frames',
    backdrop: 'peaks (sunrise over mountains) | dunes | dusk | ocean | … scene behind',
    src: 'optional public/ image or still of your last shot',
  },
  component: EndCardCredits,
  tags: ['endcard', 'credits', 'stats', 'outro'],
});
