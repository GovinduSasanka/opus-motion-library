import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {FilmGrain, useStage, Vignette} from '../../core/stage';
import {estWidth, tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';
import {mixHex5, rgba5} from '../../core/r2-pr5-kit';

/**
 * Marquee ticker: endless horizontal bands of big text (or pill "logos") scrolling seamlessly — one band, or
 * several, optionally tilted and crossing each other. The seam is exact: every item sits in a fixed-width cell
 * (estimated text width + padding), and the band is shifted by (speed * t) mod one period. Bands wipe in staggered.
 */

type Band = {items: string[]; speed: number; direction: 1 | -1; tilt: number; bg: string; ink: string; style?: 'solid' | 'outline' | 'pill'; offsetY?: number; height?: number};

type Props = {
  bands: Band[];
  separator: 'star' | 'dot' | 'slash' | 'arrow' | 'none';
  font: TFont;
  background: string;
  grid: boolean;
  stagger: number;
};

const Sep: React.FC<{kind: Props['separator']; size: number; color: string}> = ({kind, size, color}) => {
  const s = size;
  if (kind === 'none') return null;
  return (
    <svg width={s} height={s} viewBox="-50 -50 100 100" style={{display: 'block'}}>
      {kind === 'star' ? <path d="M0 -44 C4 -14 14 -4 44 0 C14 4 4 14 0 44 C-4 14 -14 4 -44 0 C-14 -4 -4 -14 0 -44 Z" fill={color} /> : null}
      {kind === 'dot' ? <circle r={20} fill={color} /> : null}
      {kind === 'slash' ? <path d="M-14 40 L14 -40 L26 -40 L-2 40 Z" fill={color} /> : null}
      {kind === 'arrow' ? <path d="M-40 -14 H10 V-34 L44 0 L10 34 V14 H-40 Z" fill={color} /> : null}
    </svg>
  );
};

const BandRow: React.FC<{band: Band; i: number; props: Props; frame: number; w: number; h: number; u: number}> = ({band, i, props, frame, w, h, u}) => {
  const bandH = (band.height ?? 0.115) * Math.min(w, h) * (h > w ? 1.05 : 1.2);
  const fs = bandH * 0.52;
  const style = band.style ?? 'solid';
  const pad = fs * 0.55;
  const sepSize = fs * 0.8;
  const font = props.font;
  const cells = band.items.map((t) => {
    const text = style === 'outline' ? t : t;
    const tw = estWidth(text, fs, font, 0.01) * 1.06 + (style === 'pill' ? fs * 0.9 : 0);
    return {text, cw: tw + pad * 2 + (props.separator === 'none' ? 0 : sepSize)};
  });
  const period = cells.reduce((s, c) => s + c.cw, 0);
  const off = (((frame / 30) * band.speed * u * band.direction) % period + period) % period;
  const reps = Math.ceil((Math.hypot(w, h) * 1.15) / period) + 2;
  const reveal = prog(frame, i * props.stagger, i * props.stagger + 18, ease.expoOut);
  const cy = h / 2 + (band.offsetY ?? 0) * h;
  const diag = Math.hypot(w, h) * 1.2;

  return (
    <div
      style={{
        position: 'absolute',
        left: w / 2 - diag / 2,
        top: cy - bandH / 2,
        width: diag,
        height: bandH,
        transform: `rotate(${band.tilt}deg) scaleX(${0.2 + 0.8 * reveal})`,
        opacity: reveal,
        background: style === 'solid' ? band.bg : style === 'outline' ? 'transparent' : rgba5(band.bg, 0.0),
        borderTop: style === 'outline' ? `${3 * u}px solid ${band.ink}` : undefined,
        borderBottom: style === 'outline' ? `${3 * u}px solid ${band.ink}` : undefined,
        overflow: 'hidden',
        boxShadow: style === 'solid' ? `0 ${10 * u}px ${40 * u}px rgba(0,0,0,0.28)` : undefined,
      }}
    >
      <div style={{position: 'absolute', left: 0, top: 0, height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', transform: `translateX(${-off - (band.direction < 0 ? 0 : 0)}px)`}}>
        {Array.from({length: reps}).map((_, r) =>
          cells.map((c, k) => (
            <div key={`${r}-${k}`} style={{width: c.cw, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: pad * 0.0}}>
              <div style={{width: props.separator === 'none' ? pad : pad + sepSize * 0.0}} />
              <div
                style={{
                  fontFamily: tfonts[font],
                  fontSize: fs,
                  lineHeight: 1,
                  letterSpacing: fs * 0.01,
                  color: style === 'outline' ? 'transparent' : band.ink,
                  WebkitTextStroke: style === 'outline' ? `${Math.max(2, fs * 0.035)}px ${band.ink}` : undefined,
                  textTransform: 'uppercase',
                  border: style === 'pill' ? `${3 * u}px solid ${band.ink}` : undefined,
                  borderRadius: style === 'pill' ? 999 : undefined,
                  padding: style === 'pill' ? `${fs * 0.16}px ${fs * 0.45}px` : undefined,
                  background: style === 'pill' ? rgba5(band.bg, 0.95) : undefined,
                  fontWeight: 800,
                }}
              >
                {c.text}
              </div>
              <div style={{flex: 1}} />
              <Sep kind={props.separator} size={sepSize} color={style === 'solid' ? mixHex5(band.ink, band.bg, 0.0) : band.ink} />
              <div style={{width: pad}} />
            </div>
          )),
        )}
      </div>
    </div>
  );
};

export const marqueeTicker = defineMotion<Props>({
  id: 'marquee-ticker',
  title: 'Marquee ticker',
  category: 'text',
  description:
    'Endless horizontal bands of big uppercase text (solid, outline or pill-logo style) scrolling seamlessly with star/dot/arrow separators — one band, or several tilted and crossing in opposite directions — wiping in staggered.',
  source: ['prompt-corpus: awesome-opus5-5-videos (MIT) — marquee / ticker cases (5), original implementation'],
  useFor: 'Hype reels, event promos, client-logo walls (pill style), website section dividers, "now playing" bars; replace the items with your own words.',
  durationInFrames: 180,
  defaultProps: {
    bands: [
      {items: ['New drop', 'Limited run', 'Free shipping', 'Ships worldwide'], speed: 150, direction: -1, tilt: -6, bg: '#FFD23F', ink: '#14110F', style: 'solid', offsetY: -0.04},
      {items: ['Northwind', 'Lumen', 'Atlas', 'Meridian', 'Harbor'], speed: 120, direction: 1, tilt: 5, bg: '#14110F', ink: '#F6F1E7', style: 'solid', offsetY: 0.06},
      {items: ['Made for you', 'Made to move'], speed: 90, direction: -1, tilt: 5, bg: '#F6F1E7', ink: '#F6F1E7', style: 'outline', offsetY: 0.2, height: 0.1},
    ],
    separator: 'star',
    font: 'display',
    background: '#E94E2C',
    grid: true,
    stagger: 8,
  },
  propDocs: {
    bands: '[{items[], speed(px/s at 1080), direction(1 right|-1 left), tilt(deg), bg, ink, style(solid|outline|pill), offsetY(-0.5..0.5 of frame height), height?}]',
    separator: 'star | dot | slash | arrow | none — glyph between items',
    font: 'font role: display | sans | grotesk | serif | comic | rounded | instrument ...',
    background: 'colour behind the bands',
    grid: 'faint dot grid on the background',
    stagger: 'frames between each band wiping in',
  },
  component: (props: Props) => {
    const frame = useCurrentFrame();
    const {w, h, u} = useStage();
    return (
      <AbsoluteFill style={{background: props.background}}>
        {props.grid ? <AbsoluteFill style={{backgroundImage: `radial-gradient(${rgba5('#000000', 0.16)} ${2 * u}px, transparent ${2.5 * u}px)`, backgroundSize: `${44 * u}px ${44 * u}px`, opacity: 0.8}} /> : null}
        {props.bands.map((b, i) => (
          <BandRow key={i} band={b} i={i} props={props} frame={frame} w={w} h={h} u={u} />
        ))}
        <Vignette strength={0.25} />
        <FilmGrain opacity={0.05} />
      </AbsoluteFill>
    );
  },
  tags: ['marquee', 'ticker', 'ticker tape', 'scrolling text', 'banner', 'band', 'tilt', 'crossed', 'logo wall', 'divider', 'hype', 'event promo', 'typography', 'kinetic type', 'loop', 'seamless', 'website', 'logos'],
});
