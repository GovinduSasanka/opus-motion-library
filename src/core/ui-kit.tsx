import React from 'react';
import {Easing, Img} from 'remotion';
import {clamp} from './ease';
import {rng} from './random';
import {resolveSrc} from './image-kit';

/**
 * ui-kit — shared helpers for the data/ and ui/ families (split-compare, browser-mockup, card-fan,
 * thumbnail-mosaic, panel-triptych, beat-montage, perspective-grid, live-chart, science-reticle, chat-bubbles).
 *
 *  - MiniScene: a seeded little landscape illustration drawn as a nested <svg> (clips itself), used as the
 *    procedural stand-in wherever a motion could show a picture (thumbnails, cards, montage shots).
 *  - Pic: HTML layer that shows a public/ image (cover) or a MiniScene.
 *  - FlatIcon: small flat-colour icons (alarm, train, toast, flask, ...) for bubbles, cards and HUDs.
 *  - Cursor: arrow / hand cursor sprites.
 *  - easing / typing helpers.
 */

// ------------------------------------------------------------------------------------------------ easing
/** cubic-bezier easing (CSS semantics) */
export const bez = (x1: number, y1: number, x2: number, y2: number) => Easing.bezier(x1, y1, x2, y2);
/** easeInBack with overshoot s (0 -> small dip -> 1) */
export const inBack = (t: number, s = 1.70158) => {
  const k = clamp(t);
  return (s + 1) * k * k * k - s * k * k;
};
/** easeOutBack with overshoot s */
export const outBack = (t: number, s = 1.70158) => {
  const k = clamp(t) - 1;
  return 1 + (s + 1) * k * k * k + s * k * k;
};
export const outCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const inOutQuad = (t: number) => {
  const k = clamp(t);
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
};
export const inOutCubic = (t: number) => {
  const k = clamp(t);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
export const inExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * clamp(t) - 10));
export const inQuad = (t: number) => clamp(t) * clamp(t);
/** local 0..1 progress (linear) */
export const lin = (frame: number, a: number, b: number) => clamp((frame - a) / Math.max(1e-6, b - a));

/** number of characters visible when typing `cpf` chars per frame from `start` */
export const typedCount = (frame: number, start: number, cpf: number) => (frame < start ? 0 : Math.floor((frame - start) * cpf) + 1);

/** cursor blink (on/off) at hz while idle */
export const blinkOn = (frame: number, hz = 4) => Math.floor((frame * hz * 2) / 30) % 2 === 0;

// ------------------------------------------------------------------------------------------------ colour
export const hexToRgb = (s: string): [number, number, number] => {
  let v = s.replace('#', '').trim();
  if (v.length === 3) v = v.split('').map((c) => c + c).join('');
  const n = parseInt(v.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
export const mixC = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const k = clamp(t);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

// ------------------------------------------------------------------------------------------------ images
/** image path at index i (cycled) or undefined when the list is empty */
export const imgAt = (images: string[] | undefined, i: number) => (images && images.length ? images[((i % images.length) + images.length) % images.length] : undefined);

/** the eight demo plates that ship with the library (public/demo) */
export const DEMO_IMAGES = ['demo/koi.jpg', 'demo/jellyfish.jpg', 'demo/lighthouse.jpg', 'demo/owl.jpg', 'demo/city.jpg', 'demo/desert.jpg', 'demo/lantern.jpg', 'demo/whale.jpg'];

// ------------------------------------------------------------------------------------------------ MiniScene
export type ScenePalette = {sky: [string, string, string]; sun: string; far: string; near: string; water: string; night?: boolean};

export const SCENE_PALETTES: ScenePalette[] = [
  {sky: ['#2a1b4f', '#b3496c', '#ffc978'], sun: '#fff3cf', far: '#7b4e84', near: '#2b1d45', water: '#3b2a5c'},
  {sky: ['#060b1f', '#14244a', '#2f4a7d'], sun: '#eef3ff', far: '#1d2b52', near: '#0b1229', water: '#0d1836', night: true},
  {sky: ['#5fb4e6', '#a8daf0', '#e9f6ef'], sun: '#fffbe0', far: '#7fae9a', near: '#2f6b4f', water: '#4b9fc4'},
  {sky: ['#f08a4b', '#f7c27a', '#fde6b8'], sun: '#fff6dc', far: '#d9875a', near: '#a85a34', water: '#e8a76b'},
  {sky: ['#0b3954', '#1f7a8c', '#8fd8c8'], sun: '#eafff9', far: '#176075', near: '#0a2c3d', water: '#11506a'},
  {sky: ['#41206b', '#d0559a', '#ffc0c7'], sun: '#fff0f4', far: '#9a4a9a', near: '#4a2465', water: '#6a3a85'},
  {sky: ['#20402f', '#5f8f6a', '#d7e6b5'], sun: '#fbffe6', far: '#3f6e52', near: '#1b3527', water: '#2c5a48'},
  {sky: ['#7aa7d6', '#c2dcef', '#f4f8fb'], sun: '#ffffff', far: '#9fb9d6', near: '#5a7ea8', water: '#7fa3c9'},
];

const ridge = (r: () => number, base: number, amp: number, W: number, step = 4) => {
  const f1 = 0.02 + r() * 0.03;
  const f2 = 0.06 + r() * 0.06;
  const p1 = r() * 6;
  const p2 = r() * 6;
  let d = `M0 100 L0 ${base.toFixed(1)}`;
  for (let x = 0; x <= W; x += step) {
    const y = base - amp * (0.55 + 0.3 * Math.sin(x * f1 + p1) + 0.15 * Math.sin(x * f2 + p2));
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d + ` L${W} 100 Z`;
};

/** inner content of a 160x100 scene (no outer svg) */
export const SceneContent: React.FC<{seed: number; id: string; palette?: number; time?: number}> = ({seed, id, palette, time = 0}) => {
  const r = rng(seed * 7717 + 3);
  const P = SCENE_PALETTES[(palette ?? Math.floor(r() * 997)) % SCENE_PALETTES.length];
  const motif = Math.floor(r() * 4); // 0 pines, 1 city, 2 water/island, 3 dunes
  const hz = 58 + r() * 14;
  const sx = 30 + r() * 100;
  const sy = 18 + r() * 22;
  const sr = 7 + r() * 8;
  const g = `${id}-sky`;
  const gl = `${id}-gl`;
  const stars = P.night ? Array.from({length: 26}, () => [r() * 160, r() * hz * 0.8, 0.3 + r() * 0.6] as const) : [];
  const far = ridge(r, hz, 16 + r() * 18, 160);
  const near = ridge(r, hz + 10 + r() * 10, 8 + r() * 10, 160, 5);
  const els: React.ReactNode[] = [];
  if (motif === 0) {
    // pine trees on the near ridge
    const n = 7 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const x = r() * 160;
      const hh = 10 + r() * 16;
      const y = hz + 16 + r() * 18;
      els.push(<path key={i} d={`M${x} ${y - hh} L${x + hh * 0.32} ${y} L${x - hh * 0.32} ${y} Z`} fill={P.near} />);
    }
  } else if (motif === 1) {
    let x = -2;
    let i = 0;
    while (x < 162) {
      const bw = 6 + r() * 10;
      const bh = 8 + r() * 26;
      els.push(<rect key={`b${i}`} x={x} y={hz + 14 - bh} width={bw} height={bh + 40} fill={P.near} />);
      for (let k = 0; k < 3; k++) if (r() > 0.45) els.push(<rect key={`w${i}-${k}`} x={x + 1.5 + r() * (bw - 4)} y={hz + 14 - bh + 3 + r() * (bh - 5)} width={1.6} height={2.2} fill={P.sun} opacity={0.8} />);
      x += bw + (r() < 0.3 ? 2 : 0);
      i++;
    }
  } else if (motif === 3) {
    els.push(<path key="d1" d={`M0 ${hz + 12} Q 50 ${hz - 4} 95 ${hz + 14} T 160 ${hz + 8} L160 100 L0 100 Z`} fill={P.far} opacity={0.9} />);
    els.push(<path key="d2" d={`M0 ${hz + 30} Q 70 ${hz + 8} 120 ${hz + 30} T 170 ${hz + 26} L160 100 L0 100 Z`} fill={P.near} opacity={0.85} />);
  }
  const water = motif === 2;
  return (
    <>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.sky[0]} />
          <stop offset="0.6" stopColor={P.sky[1]} />
          <stop offset="1" stopColor={P.sky[2]} />
        </linearGradient>
        <radialGradient id={gl}>
          <stop offset="0" stopColor={P.sun} stopOpacity={0.7} />
          <stop offset="1" stopColor={P.sun} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-1} y={-1} width={162} height={102} fill={`url(#${g})`} />
      {stars.map(([x, y, a], i) => (
        <circle key={i} cx={x} cy={y} r={0.5} fill="#fff" opacity={a * (0.7 + 0.3 * Math.sin(time * 0.2 + i))} />
      ))}
      <circle cx={sx} cy={sy} r={sr * 3} fill={`url(#${gl})`} />
      <circle cx={sx} cy={sy} r={sr} fill={P.sun} />
      {P.night && <circle cx={sx + sr * 0.35} cy={sy - sr * 0.2} r={sr * 0.85} fill={P.sky[0]} opacity={0.0} />}
      <path d={far} fill={P.far} />
      {water ? (
        <>
          <rect x={-1} y={hz + 6} width={162} height={60} fill={P.water} />
          <rect x={sx - sr * 0.6} y={hz + 6} width={sr * 1.2} height={40} fill={P.sun} opacity={0.25} />
          {Array.from({length: 7}, (_, i) => (
            <line key={i} x1={sx - 14 + ((i * 37) % 20) + Math.sin(time * 0.15 + i) * 2} x2={sx + 4 + ((i * 53) % 18) + Math.sin(time * 0.15 + i) * 2} y1={hz + 9 + i * 4} y2={hz + 9 + i * 4} stroke={P.sun} strokeWidth={0.7} opacity={0.6} />
          ))}
          <path d={`M${110 - (seed % 40)} ${hz + 7} q 12 -14 26 0 Z`} fill={P.near} />
        </>
      ) : (
        <path d={near} fill={P.near} />
      )}
      {els}
    </>
  );
};

/** a MiniScene as a nested svg inside another svg (clips to its box) */
export const MiniScene: React.FC<{x: number; y: number; w: number; h: number; seed: number; id: string; palette?: number; time?: number}> = ({x, y, w, h, seed, id, palette, time}) => (
  <svg x={x} y={y} width={w} height={h} viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
    <SceneContent seed={seed} id={id} palette={palette} time={time} />
  </svg>
);

/**
 * HTML picture layer that fills its parent: public/ image (cover) or a procedural MiniScene.
 * `style` applies to the wrapper, `imgStyle` to the image / scene (transform, filter...).
 */
export const Pic: React.FC<{src?: string; seed?: number; palette?: number; id: string; style?: React.CSSProperties; imgStyle?: React.CSSProperties; position?: string; time?: number}> = ({
  src,
  seed = 1,
  palette,
  id,
  style,
  imgStyle,
  position = '50% 50%',
  time,
}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', ...style}}>
    {src ? (
      <Img src={resolveSrc(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, display: 'block', ...imgStyle}} />
    ) : (
      <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', ...imgStyle}}>
        <SceneContent seed={seed} id={id} palette={palette} time={time} />
      </svg>
    )}
  </div>
);

// ------------------------------------------------------------------------------------------------ icons
export type FlatIconKind = 'alarm' | 'train' | 'toast' | 'flask' | 'button' | 'moon' | 'sun' | 'coffee' | 'bolt' | 'heart' | 'star' | 'gear' | 'chat' | 'leaf' | 'check' | 'flame' | 'shield' | 'sword';
export const FLAT_ICONS: FlatIconKind[] = ['alarm', 'train', 'toast', 'flask', 'button', 'moon', 'sun', 'coffee', 'bolt', 'heart', 'star', 'gear', 'chat', 'leaf', 'check', 'flame', 'shield', 'sword'];

/** flat-colour icon centred at (x,y), size s (box side). ink = outline colour. */
export const FlatIcon: React.FC<{kind: FlatIconKind | string; x: number; y: number; s: number; ink?: string; mono?: string}> = ({kind, x, y, s, ink = '#1d1430', mono}) => {
  const k = s / 100;
  const c = (col: string) => mono ?? col;
  const sw = 5;
  const body = (() => {
    switch (kind) {
      case 'alarm':
        return (
          <>
            <circle cx={22} cy={22} r={13} fill={c('#E8523F')} stroke={ink} strokeWidth={sw} />
            <circle cx={78} cy={22} r={13} fill={c('#E8523F')} stroke={ink} strokeWidth={sw} />
            <circle cx={50} cy={55} r={36} fill={c('#E8523F')} stroke={ink} strokeWidth={sw} />
            <circle cx={50} cy={55} r={25} fill="#FFF6E8" stroke={ink} strokeWidth={3} />
            <path d="M50 55 V38 M50 55 L62 62" stroke={ink} strokeWidth={5} strokeLinecap="round" />
            <path d="M28 88 L22 96 M72 88 L78 96" stroke={ink} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      case 'train':
        return (
          <>
            <rect x={14} y={14} width={72} height={66} rx={14} fill={c('#E9E4EE')} stroke={ink} strokeWidth={sw} />
            <rect x={22} y={24} width={56} height={24} rx={5} fill={c('#3F6FD8')} stroke={ink} strokeWidth={3} />
            <rect x={14} y={54} width={72} height={8} fill={c('#E8523F')} />
            <circle cx={30} cy={68} r={5} fill="#FFE07A" stroke={ink} strokeWidth={3} />
            <circle cx={70} cy={68} r={5} fill="#FFE07A" stroke={ink} strokeWidth={3} />
            <path d="M26 82 L18 94 M74 82 L82 94" stroke={ink} strokeWidth={sw} strokeLinecap="round" />
          </>
        );
      case 'toast':
        return (
          <>
            <path d="M18 44 C8 20 30 10 50 14 C70 10 92 20 82 44 V88 H18 Z" fill={c('#E4A55B')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M28 46 C22 30 36 24 50 26 C64 24 78 30 72 46 V78 H28 Z" fill={c('#F7DDA6')} />
            <rect x={38} y={44} width={24} height={16} rx={4} fill={c('#FFE77A')} stroke={ink} strokeWidth={3} />
          </>
        );
      case 'flask':
        return (
          <>
            <path d="M38 10 H62 M42 10 V38 L16 84 C13 90 17 94 24 94 H76 C83 94 87 90 84 84 L58 38 V10" fill={c('#E9F3FF')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M28 64 H72 L82 84 C84 89 81 91 76 91 H24 C19 91 16 89 18 84 Z" fill={c('#C45CD6')} />
            <circle cx={44} cy={78} r={4} fill="#fff" opacity={0.8} />
            <circle cx={58} cy={72} r={3} fill="#fff" opacity={0.8} />
          </>
        );
      case 'button':
        return (
          <>
            <rect x={12} y={58} width={76} height={26} rx={8} fill={c('#5C5F72')} stroke={ink} strokeWidth={sw} />
            <ellipse cx={50} cy={56} rx={30} ry={14} fill={c('#B8242E')} stroke={ink} strokeWidth={sw} />
            <path d="M20 56 V44 C20 30 80 30 80 44 V56" fill={c('#E8523F')} stroke={ink} strokeWidth={sw} />
            <ellipse cx={50} cy={42} rx={30} ry={12} fill={c('#FF7A6A')} stroke={ink} strokeWidth={sw} />
          </>
        );
      case 'moon':
        return <path d="M64 10 C34 12 16 38 22 64 C28 88 58 98 80 84 C54 82 40 60 46 38 C50 24 58 16 64 10 Z" fill={c('#FFE07A')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
      case 'sun':
        return (
          <>
            {Array.from({length: 8}, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <line key={i} x1={50 + Math.cos(a) * 32} y1={50 + Math.sin(a) * 32} x2={50 + Math.cos(a) * 44} y2={50 + Math.sin(a) * 44} stroke={c('#F2A93B')} strokeWidth={7} strokeLinecap="round" />;
            })}
            <circle cx={50} cy={50} r={24} fill={c('#FFD34E')} stroke={ink} strokeWidth={sw} />
          </>
        );
      case 'coffee':
        return (
          <>
            <path d="M18 34 H72 V70 C72 84 62 92 46 92 H44 C28 92 18 84 18 70 Z" fill={c('#F4EEE6')} stroke={ink} strokeWidth={sw} />
            <path d="M72 44 C88 42 90 66 72 66" fill="none" stroke={ink} strokeWidth={sw} />
            <rect x={24} y={40} width={42} height={8} fill={c('#8A5A3B')} />
            <path d="M34 26 C30 18 40 14 36 6 M50 26 C46 18 56 14 52 6" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          </>
        );
      case 'bolt':
        return <path d="M58 6 L20 56 H46 L38 94 L80 40 H54 Z" fill={c('#FFD34E')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
      case 'heart':
        return <path d="M50 88 C20 66 8 48 12 32 C16 14 40 10 50 28 C60 10 84 14 88 32 C92 48 80 66 50 88 Z" fill={c('#E8527A')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
      case 'star':
        return <path d="M50 8 L61 36 L92 38 L68 58 L76 90 L50 72 L24 90 L32 58 L8 38 L39 36 Z" fill={c('#FFD34E')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
      case 'gear':
        return (
          <>
            {Array.from({length: 8}, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <rect key={i} x={44} y={6} width={12} height={20} rx={3} fill={c('#5FB8C8')} stroke={ink} strokeWidth={3} transform={`rotate(${(a * 180) / Math.PI} 50 50)`} />;
            })}
            <circle cx={50} cy={50} r={30} fill={c('#5FB8C8')} stroke={ink} strokeWidth={sw} />
            <circle cx={50} cy={50} r={11} fill="#F4EEE6" stroke={ink} strokeWidth={4} />
          </>
        );
      case 'chat':
        return (
          <>
            <path d="M12 20 C12 14 16 10 22 10 H78 C84 10 88 14 88 20 V60 C88 66 84 70 78 70 H40 L22 88 V70 C16 70 12 66 12 60 Z" fill={c('#7DA7F2')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <circle cx={34} cy={40} r={5} fill={ink} />
            <circle cx={50} cy={40} r={5} fill={ink} />
            <circle cx={66} cy={40} r={5} fill={ink} />
          </>
        );
      case 'leaf':
        return (
          <>
            <path d="M18 84 C14 40 44 14 88 12 C88 56 62 86 18 84 Z" fill={c('#6DBE6A')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M22 80 C40 60 56 44 76 26" stroke={ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          </>
        );
      case 'check':
        return (
          <>
            <circle cx={50} cy={50} r={40} fill={c('#5FD39A')} stroke={ink} strokeWidth={sw} />
            <path d="M30 52 L44 66 L72 36" stroke={ink} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      case 'flame':
        return (
          <>
            <path d="M50 6 C62 30 84 40 82 64 C80 84 66 94 50 94 C34 94 20 84 18 64 C16 46 32 38 36 20 C42 32 46 34 50 6 Z" fill={c('#F2783B')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M50 46 C58 58 66 64 64 76 C62 86 56 90 50 90 C44 90 36 86 36 76 C36 66 46 62 50 46 Z" fill={c('#FFD34E')} />
          </>
        );
      case 'shield':
        return (
          <>
            <path d="M50 8 L86 20 V48 C86 70 70 86 50 94 C30 86 14 70 14 48 V20 Z" fill={c('#5C7FD8')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M50 22 V80 M28 44 H72" stroke="#F4EEE6" strokeWidth={7} strokeLinecap="round" />
          </>
        );
      case 'sword':
        return (
          <>
            <path d="M82 10 L88 16 L40 66 L32 60 Z" fill={c('#DDE3EE')} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M22 54 L46 78" stroke={c('#C9A23A')} strokeWidth={10} strokeLinecap="round" />
            <path d="M30 70 L14 86" stroke={c('#7A4A2A')} strokeWidth={10} strokeLinecap="round" />
          </>
        );
      default:
        return <circle cx={50} cy={50} r={36} fill={c('#B9B2D8')} stroke={ink} strokeWidth={sw} />;
    }
  })();
  return <g transform={`translate(${x - s / 2} ${y - s / 2}) scale(${k})`}>{body}</g>;
};

// ------------------------------------------------------------------------------------------------ cursors
/** arrow cursor with its tip at (x,y); size = height in px */
export const ArrowCursor: React.FC<{x: number; y: number; size: number; fill?: string; ink?: string; press?: number}> = ({x, y, size, fill = '#ffffff', ink = '#111111', press = 0}) => {
  const k = (size / 32) * (1 - press * 0.12);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} style={{filter: `drop-shadow(0 ${2 * k}px ${3 * k}px rgba(0,0,0,0.35))`}}>
      <path d="M0 0 L0 25 L6 19.5 L10.5 29.5 L14.5 27.8 L10 18 L18 18 Z" fill={fill} stroke={ink} strokeWidth={1.6} strokeLinejoin="round" />
    </g>
  );
};

/** white-glove hand cursor (video22) with fingertip at (x,y) */
export const HandCursor: React.FC<{x: number; y: number; size: number; ink?: string}> = ({x, y, size, ink = '#1a1a1a'}) => {
  const k = size / 40;
  return (
    <g transform={`translate(${x - 9 * k} ${y}) scale(${k})`}>
      <path
        d="M9 2 C9 0 13 0 13 2 V16 C13 14 17 14 17 16 V18 C17 16 21 16 21 18 V20 C21 18 25 18 25 20 V30 C25 36 21 40 15 40 H13 C8 40 5 37 3 33 L0 26 C-1 23 2 21 4 23 L9 28 Z"
        fill="#ffffff"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </g>
  );
};
