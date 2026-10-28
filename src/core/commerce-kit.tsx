import React from 'react';
import {Img, staticFile} from 'remotion';
import {hexRgb, mixHex} from './r2-s1-kit';

/** Shared building blocks for the e-commerce / retail / delivery motions (procedural product art, cart + check icons). */

export const resolveSrc = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s));
export const bgOf = (b: string) => (b === 'transparent' ? undefined : b);
export const money = (v: number, currency: string, dec = 2) => `${currency}${v.toFixed(dec)}`;
export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
/** readable text colour on a filled background */
export const onColor = (hex: string, dark = '#14161C', light = '#FFFFFF') => {
  const [r, g, b] = hexRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? dark : light;
};
/** font size that keeps `text` within `maxW` (approximate average glyph width factor) */
export const fitFs = (text: string, maxW: number, fs: number, k = 0.56) => Math.min(fs, maxW / Math.max(1, text.length * k));

/** default product tint palette (used when a product gives no colour) */
export const ART_COLORS = ['#E07A5F', '#3D85C6', '#81B29A', '#F2CC8F', '#9B7EDE', '#2F4858', '#E9A23B', '#C0626F'];

/**
 * Procedural product drawing in a 100x100 viewBox. kinds: 0 tote bag, 1 mug, 2 headphones, 3 box, 4 bottle,
 * 5 watch, 6 lamp, 7 t-shirt.
 */
export const ProductArt: React.FC<{kind: number; color: string; size: number}> = ({kind, color, size}) => {
  const c = color;
  const d = mixHex(color, '#000000', 0.25);
  const l = mixHex(color, '#ffffff', 0.38);
  const k = ((Math.round(kind) % 8) + 8) % 8;
  let art: React.ReactNode;
  if (k === 0) {
    art = (
      <>
        <path d="M36 36 C36 12 64 12 64 36" stroke={d} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <path d="M22 34 H78 L85 88 H15 Z" fill={c} />
        <path d="M22 34 H78 L79.2 44 H20.8 Z" fill={d} opacity={0.28} />
        <rect x={39} y={54} width={22} height={19} rx={3} fill={l} />
      </>
    );
  } else if (k === 1) {
    art = (
      <>
        <path d="M66 40 C88 36 88 70 66 68" stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />
        <rect x={20} y={28} width={48} height={54} rx={9} fill={c} />
        <ellipse cx={44} cy={28} rx={24} ry={5.5} fill={d} />
        <ellipse cx={44} cy={28} rx={20} ry={3.4} fill={mixHex(d, '#000000', 0.35)} />
        <rect x={27} y={40} width={5} height={34} rx={2.5} fill={l} opacity={0.6} />
      </>
    );
  } else if (k === 2) {
    art = (
      <>
        <path d="M25 58 C20 6 80 6 75 58" stroke={d} strokeWidth={6} fill="none" strokeLinecap="round" />
        <rect x={14} y={50} width={20} height={32} rx={9} fill={c} />
        <rect x={66} y={50} width={20} height={32} rx={9} fill={c} />
        <rect x={30} y={56} width={8} height={20} rx={4} fill={d} />
        <rect x={62} y={56} width={8} height={20} rx={4} fill={d} />
        <rect x={19} y={56} width={5} height={14} rx={2.5} fill={l} opacity={0.7} />
      </>
    );
  } else if (k === 3) {
    art = (
      <>
        <polygon points="50,16 85,35 50,54 15,35" fill={l} />
        <polygon points="15,35 50,54 50,89 15,70" fill={c} />
        <polygon points="50,54 85,35 85,70 50,89" fill={d} />
        <polygon points="43,19.5 57,19.5 78,31 64,38.5" fill="#ffffff" opacity={0.35} />
        <polygon points="50,54 57,50.3 57,85.3 50,89" fill="#ffffff" opacity={0.28} />
      </>
    );
  } else if (k === 4) {
    art = (
      <>
        <rect x={42} y={8} width={16} height={14} rx={3} fill={d} />
        <path d="M36 22 H64 Q70 22 70 30 V80 Q70 90 60 90 H40 Q30 90 30 80 V30 Q30 22 36 22 Z" fill={c} />
        <rect x={30} y={46} width={40} height={24} fill="#ffffff" opacity={0.85} />
        <rect x={36} y={53} width={28} height={4} rx={2} fill={d} opacity={0.65} />
        <rect x={36} y={61} width={18} height={3} rx={1.5} fill={d} opacity={0.4} />
        <rect x={34} y={28} width={4} height={14} rx={2} fill={l} opacity={0.6} />
      </>
    );
  } else if (k === 5) {
    art = (
      <>
        <rect x={37} y={4} width={26} height={92} rx={9} fill={d} />
        <circle cx={50} cy={50} r={27} fill={c} />
        <circle cx={50} cy={50} r={21} fill="#ffffff" opacity={0.92} />
        <line x1={50} y1={50} x2={50} y2={36} stroke={d} strokeWidth={3} strokeLinecap="round" />
        <line x1={50} y1={50} x2={60} y2={55} stroke={d} strokeWidth={3} strokeLinecap="round" />
        <circle cx={50} cy={50} r={2.5} fill={c} />
        <rect x={76} y={46} width={5} height={8} rx={2} fill={l} />
      </>
    );
  } else if (k === 6) {
    art = (
      <>
        <rect x={48} y={50} width={4} height={34} fill={d} />
        <ellipse cx={50} cy={86} rx={19} ry={5} fill={d} />
        <path d="M30 14 H70 L83 52 H17 Z" fill={c} />
        <path d="M30 14 H42 L36 52 H17 Z" fill={l} opacity={0.4} />
        <ellipse cx={50} cy={52} rx={33} ry={4} fill={d} opacity={0.5} />
        <circle cx={50} cy={58} r={4} fill="#FFE9A8" />
      </>
    );
  } else {
    art = (
      <>
        <path d="M30 17 L41 12 C45 22 55 22 59 12 L70 17 L91 33 L81 46 L70 40 L70 87 L30 87 L30 40 L19 46 L9 33 Z" fill={c} />
        <path d="M41 12 C45 22 55 22 59 12 C56 28 44 28 41 12 Z" fill={d} opacity={0.55} />
        <path d="M30 40 L19 46 L9 33 L30 17 Z" fill={d} opacity={0.12} />
        <rect x={36} y={52} width={6} height={30} rx={3} fill={l} opacity={0.35} />
      </>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block'}}>
      <ellipse cx={50} cy={92.5} rx={30} ry={3} fill="#000" opacity={0.13} />
      {art}
    </svg>
  );
};

/** square-ish product picture: an image (`src`) or the procedural drawing on a soft tint */
export const Thumb: React.FC<{w: number; h?: number; radius: number; kind: number; color: string; src?: string; tint?: string}> = ({
  w,
  h,
  radius,
  kind,
  color,
  src,
  tint,
}) => {
  const hh = h ?? w;
  const bg = tint ?? mixHex(color, '#ffffff', 0.8);
  return (
    <div style={{width: w, height: hh, borderRadius: radius, overflow: 'hidden', position: 'relative', background: `linear-gradient(160deg, ${mixHex(bg, '#ffffff', 0.35)}, ${bg})`, flex: 'none'}}>
      {src ? (
        <Img src={resolveSrc(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
      ) : (
        <div style={{position: 'absolute', left: (w - Math.min(w, hh) * 0.82) / 2, top: (hh - Math.min(w, hh) * 0.82) / 2}}>
          <ProductArt kind={kind} color={color} size={Math.min(w, hh) * 0.82} />
        </div>
      )}
    </div>
  );
};

/** shopping-cart glyph (stroke), 24-unit viewBox */
export const CartIcon: React.FC<{size: number; color: string; sw?: number}> = ({size, color, sw = 2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block', overflow: 'visible'}}>
    <path d="M2.5 3.5h2.8l2.3 11.2h10.4l2-8H6.2" />
    <circle cx={9.2} cy={19.3} r={1.5} fill={color} />
    <circle cx={16.8} cy={19.3} r={1.5} fill={color} />
  </svg>
);

/** check mark with draw-on (p 0..1) */
export const CheckMark: React.FC<{size: number; color: string; p?: number; sw?: number}> = ({size, color, p = 1, sw = 3}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block', overflow: 'visible'}}>
    <path d="M5 12.8 L10 17.5 L19 7" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
  </svg>
);
