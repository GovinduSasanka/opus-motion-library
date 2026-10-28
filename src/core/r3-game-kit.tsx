import React from 'react';
import {Img} from 'remotion';
import {resolveSrc} from './asset';
import {fonts} from './fonts';
export {fonts};
import {mixHex, withAlpha} from './r2-s1-kit';
import {avatarColor, initials} from './r3-social';

/** Shared helpers for the gaming / esports / streaming motions (src/motions/game/*). Original shapes only, no real brands. */

export {mixHex, withAlpha, backOut, easeOut3, easeIO, sseg} from './r2-s1-kit';
export {avatarColor, initials, fmtInt} from './r3-social';

/** heavy display face; a custom `fontFamily` prop replaces both roles */
export const headFont = (f?: string) => (!f || f === 'auto' ? fonts.display : f);
export const bodyFont = (f?: string) => (!f || f === 'auto' ? fonts.grotesk : f);
export const bgCss = (background: string): string | undefined => (!background || background === 'transparent' ? undefined : background);

export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
/** 754 -> "12:34" (hours folded into minutes up to 99) */
export const mmss = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${pad2(Math.min(99, Math.floor(s / 60)))}:${pad2(s % 60)}`;
};

const CLIP: Record<string, string> = {
  shield: 'polygon(0 0,100% 0,100% 60%,50% 100%,0 60%)',
  hex: 'polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)',
  circle: 'circle(50% at 50% 50%)',
  rounded: 'inset(0 round 22%)',
  diamond: 'polygon(50% 0,100% 50%,50% 100%,0 50%)',
};
export type CrestShape = 'shield' | 'hex' | 'circle' | 'rounded' | 'diamond';

/** Team logo / avatar badge: an image (`src`) clipped to a shape, or coloured initials when there is no picture. */
export const Crest: React.FC<{
  size: number;
  label: string;
  color: string;
  src?: string;
  shape?: CrestShape;
  ink?: string;
  ring?: string;
  font?: string;
  style?: React.CSSProperties;
}> = ({size, label, color, src, shape = 'shield', ink = '#FFFFFF', ring = 'rgba(255,255,255,0.92)', font, style}) => {
  const clip = CLIP[shape] || CLIP.shield;
  const txt = (label || '').slice(0, 3).toUpperCase();
  return (
    <div style={{width: size, height: size, position: 'relative', flex: 'none', ...style}}>
      <div style={{position: 'absolute', inset: 0, background: ring, clipPath: clip}} />
      <div
        style={{
          position: 'absolute',
          inset: size * 0.055,
          clipPath: clip,
          background: `linear-gradient(160deg, ${mixHex(color, '#ffffff', 0.2)}, ${mixHex(color, '#000000', 0.4)})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {src ? (
          <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <span style={{fontFamily: font || fonts.display, fontSize: size * (txt.length > 2 ? 0.3 : 0.4), color: ink, letterSpacing: size * 0.01, lineHeight: 1, paddingTop: shape === 'shield' ? size * 0.04 : 0}}>{txt}</span>
        )}
      </div>
    </div>
  );
};

/** Neutral avatar placeholder (head and shoulders) drawn on a gradient, used when no picture is given. */
export const Silhouette: React.FC<{width: number; height: number; color: string; seed?: string}> = ({width, height, color, seed = ''}) => {
  const id = `sil-${(seed || 'x').replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{display: 'block'}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={mixHex(color, '#ffffff', 0.18)} />
          <stop offset="1" stopColor={mixHex(color, '#000000', 0.55)} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
      <circle cx="50" cy="40" r="17" fill={withAlpha(mixHex(color, '#000000', 0.7), 0.82)} />
      <path d="M12 104 C14 74 30 62 50 62 C70 62 86 74 88 104 Z" fill={withAlpha(mixHex(color, '#000000', 0.7), 0.82)} />
    </svg>
  );
};

/** slanted (parallelogram) polygon for CSS clip-path, skew in px */
export const slantClip = (w: number, h: number, skew: number, side: 'both' | 'left' | 'right' = 'both') => {
  const a = side === 'right' ? 0 : skew;
  const b = side === 'left' ? 0 : skew;
  return `polygon(${a}px 0,${w}px 0,${w - b}px ${h}px,0 ${h}px)`;
};
