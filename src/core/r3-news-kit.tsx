import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from './ease';
import {Plate} from './image-kit';
import {FilmGrain} from './stage';

/**
 * Shared helpers for the round-3 news / documentary / journalism motions
 * (breaking-news-takeover, poll-numbers-split, document-zoom-highlight, social-post-embed, location-time-stamp,
 * interview-name-super, fact-check-meter, archive-photo-ken-burns-caption).
 */

export {lf, seg, eo3, eio3, backOut, settle, alpha, mixC} from './r2-la1-kit';
export {estWidth, fitSize, typed, cursorOn} from './text-kit';
export {wrapText, fmtInt, fmtCompact, initials, avatarColor} from './r3-social';

/** "a *b* c" -> [{t:'a ', em:false},{t:'b', em:true},{t:' c', em:false}] */
export const splitEm = (s: string): {t: string; em: boolean}[] =>
  (s || '')
    .split('*')
    .map((t, i) => ({t, em: i % 2 === 1}))
    .filter((p) => p.t.length);

/** 0 / null / '' -> false; used to treat empty strings as "off" */
export const on = (v: unknown) => v !== '' && v !== null && v !== undefined && v !== false;

/**
 * Backdrop for overlay-style motions: `transparent` (nothing), `footage` (procedural placeholder plate, slow push,
 * darkened at the bottom so lower thirds read), or any CSS colour. With `src` the plate is that image.
 */
export const NewsBackdrop: React.FC<{backdrop: string; src?: string; seed?: number; palette?: 'dusk' | 'night' | 'dawn'}> = ({backdrop, src, seed = 11, palette = 'dusk'}) => {
  const frame = useCurrentFrame();
  if (backdrop === 'transparent') return null;
  if (backdrop !== 'footage') return <AbsoluteFill style={{background: backdrop}} />;
  return (
    <AbsoluteFill style={{background: '#0E0E0C'}}>
      <AbsoluteFill style={{transform: `scale(${1 + frame * 0.00035})`, filter: 'contrast(1.06) saturate(0.9) brightness(0.92)'}}>
        <Plate src={src} seed={seed} palette={palette} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(8,9,12,0.5) 0%, rgba(8,9,12,0) 38%)'}} />
      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};

/** seconds -> "HH:MM:SS" (24 h wrap) */
export const clock = (totalSec: number, withSeconds = true) => {
  const s = ((Math.floor(totalSec) % 86400) + 86400) % 86400;
  const p = (n: number) => String(n).padStart(2, '0');
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return withSeconds ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(hh)}:${p(mm)}`;
};

/** "09:41" / "09:41:05" -> seconds since midnight (NaN-safe: bad input -> 0) */
export const parseClock = (t: string) => {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec((t || '').trim());
  if (!m) return 0;
  return clamp(+m[1], 0, 23) * 3600 + clamp(+m[2], 0, 59) * 60 + clamp(+(m[3] ?? 0), 0, 59);
};
