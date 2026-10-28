// Shared helpers for the round-3 travel / food / lifestyle motions (boarding-pass-print, itinerary-route-stops,
// passport-stamps, recipe-ingredients-steps, menu-board-items, nutrition-facts-label, coffee-pour-cup, hotel-rating-card).
import React from 'react';
import {Img} from 'remotion';
import {resolveSrc} from './asset';
import {mixHex, sh, withAlpha} from './r2-s1-kit';

/** photo slot: an image (`src`) or a procedural landscape / hotel drawing (so a motion looks finished with no assets) */
export const SCENE_PALETTES: Array<[string, string, string, string]> = [
  // sky top, sky bottom, far layer, near layer
  ['#7FB2E5', '#F6D9B0', '#6F8FB8', '#2F5F6E'],
  ['#F2A66B', '#FBE3B8', '#C9806B', '#5B4B73'],
  ['#5B8DB8', '#BFE0EA', '#4F9DA6', '#25667A'],
  ['#E9B77A', '#F8E7C4', '#D99A5E', '#A9643A'],
  ['#8FC7A3', '#E3F1D2', '#4E9A6B', '#276B45'],
  ['#9A8CD0', '#F4C9D4', '#6F6BA8', '#3A3C78'],
];

export const Photo: React.FC<{
  w: number;
  h: number;
  radius?: number | string;
  src?: string;
  kind?: number;
  seed?: number;
  building?: boolean;
  zoom?: number;
  style?: React.CSSProperties;
  idKey?: string;
}> = ({w, h, radius = 0, src, kind = 0, seed = 0, building = false, zoom = 1, style, idKey = 'ph'}) => {
  const pal = SCENE_PALETTES[(kind + seed) % SCENE_PALETTES.length];
  const k = kind % 5;
  const id = `${idKey}-${kind}-${seed}`;
  const A = 100 * (w / Math.max(1, h));
  const far: string[] = [];
  const near: string[] = [];
  if (k === 0) {
    // mountains
    for (let i = 0; i < 6; i++) {
      const cx = (i / 5) * A;
      const ph = 22 + sh(i, seed, 1) * 24;
      far.push(`M${cx - 30} 100 L${cx} ${70 - ph} L${cx + 30} 100Z`);
    }
    near.push(`M0 100 L0 84 Q${A * 0.25} 70 ${A * 0.5} 82 T${A} 78 L${A} 100Z`);
  } else if (k === 1) {
    // sea + sun + waves
    near.push(`M0 100 L0 74 Q${A * 0.12} 70 ${A * 0.25} 74 T${A * 0.5} 74 T${A * 0.75} 74 T${A} 74 L${A} 100Z`);
    far.push(`M0 100 L0 66 L${A} 66 L${A} 100Z`);
  } else if (k === 2) {
    // skyline
    for (let i = 0; i < 12; i++) {
      const bw = 5 + sh(i, seed, 2) * 6;
      const bh = 16 + sh(i, seed, 3) * 34;
      const bx = (i / 11) * (A - bw);
      far.push(`M${bx} 100 L${bx} ${100 - bh} L${bx + bw} ${100 - bh} L${bx + bw} 100Z`);
    }
    near.push(`M0 100 L0 90 L${A} 90 L${A} 100Z`);
  } else if (k === 3) {
    // dunes
    far.push(`M0 100 L0 72 Q${A * 0.3} 52 ${A * 0.6} 74 T${A} 66 L${A} 100Z`);
    near.push(`M0 100 L0 88 Q${A * 0.4} 66 ${A * 0.75} 86 T${A} 80 L${A} 100Z`);
  } else {
    // forest
    for (let i = 0; i < 14; i++) {
      const tx = (i / 13) * A;
      const th = 22 + sh(i, seed, 4) * 22;
      far.push(`M${tx - 7} 100 L${tx} ${100 - th} L${tx + 7} 100Z`);
    }
    near.push(`M0 100 L0 90 Q${A * 0.5} 80 ${A} 90 L${A} 100Z`);
  }
  return (
    <div style={{width: w, height: h, borderRadius: radius, overflow: 'hidden', position: 'relative', background: pal[1], flex: 'none', ...style}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`}}>
        {src ? (
          <Img src={resolveSrc(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${A} 100`} preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0}}>
            <defs>
              <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={pal[0]} />
                <stop offset="1" stopColor={pal[1]} />
              </linearGradient>
            </defs>
            <rect width={A} height={100} fill={`url(#${id}-sky)`} />
            <circle cx={A * (0.58 + sh(seed, 5, 1) * 0.2)} cy={34 + sh(seed, 6, 1) * 6} r={9} fill="#FFF6DA" opacity={0.9} />
            {far.map((d, i) => (
              <path key={'f' + i} d={d} fill={pal[2]} opacity={k === 1 ? 0.55 : 0.85} />
            ))}
            {near.map((d, i) => (
              <path key={'n' + i} d={d} fill={pal[3]} />
            ))}
            {building ? (
              <g>
                <rect x={A * 0.34} y={34} width={A * 0.32} height={58} fill={mixHex(pal[3], '#ffffff', 0.12)} />
                <rect x={A * 0.31} y={30} width={A * 0.38} height={5} fill={mixHex(pal[3], '#000000', 0.15)} />
                {Array.from({length: 4}).map((_, r) =>
                  Array.from({length: 5}).map((__, c) => (
                    <rect key={`${r}-${c}`} x={A * 0.365 + c * (A * 0.056)} y={40 + r * 11} width={A * 0.03} height={6} fill={sh(r, c, seed) > 0.4 ? '#FFE9A8' : '#F6F1E4'} opacity={0.9} />
                  )),
                )}
              </g>
            ) : null}
          </svg>
        )}
      </div>
    </div>
  );
};

/** deterministic barcode (bars as rects) inside w x h */
export const Barcode: React.FC<{w: number; h: number; color: string; seed?: number; sweep?: number; sweepColor?: string}> = ({w, h, color, seed = 1, sweep, sweepColor}) => {
  const bars: React.ReactNode[] = [];
  let x = 0;
  let i = 0;
  const unit = w / 120;
  while (x < w - unit * 2) {
    const bw = (1 + Math.floor(sh(i, seed, 9) * 3)) * unit;
    bars.push(<rect key={i} x={x} y={0} width={Math.min(bw, w - x)} height={h} fill={color} />);
    x += bw + (1 + Math.floor(sh(i, seed, 11) * 2)) * unit;
    i++;
  }
  return (
    <svg width={w} height={h} style={{display: 'block', overflow: 'visible'}}>
      {bars}
      {sweep !== undefined && sweep > 0 && sweep < 1 ? (
        <rect x={sweep * w - 2} y={-6} width={4} height={h + 12} fill={sweepColor ?? '#FF3B30'} opacity={0.85} />
      ) : null}
    </svg>
  );
};

/** 24-unit stroke icons for amenities and small lifestyle badges */
export const ICON_PATHS: Record<string, string> = {
  wifi: 'M2 9a15 15 0 0 1 20 0 M5.5 12.5a10 10 0 0 1 13 0 M9 16a5 5 0 0 1 6 0 M12 19.5h.01',
  pool: 'M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5 M7 14V6a3 3 0 0 1 6 0 M13 11H7 M17 14V6a3 3 0 0 0-3-3',
  breakfast: 'M4 10h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M17 11h1.5a2.5 2.5 0 0 1 0 5H17 M8 3c0 1.5 1 1.5 1 3 M12 3c0 1.5 1 1.5 1 3',
  parking: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M9.5 17V7.5h3.5a2.8 2.8 0 0 1 0 5.6H9.5',
  gym: 'M6.5 6.5v11 M17.5 6.5v11 M3 9v6 M21 9v6 M6.5 12h11',
  spa: 'M12 3c3 3.5 3 8 0 11-3-3-3-7.5 0-11z M4 11c4 0 6.5 2.5 8 7 M20 11c-4 0-6.5 2.5-8 7 M8 21h8',
  ac: 'M12 2v20 M3.3 7l17.4 10 M3.3 17L20.7 7 M9 3.5l3 2.5 3-2.5 M9 20.5l3-2.5 3 2.5',
  bar: 'M4 4h16l-8 9z M12 13v8 M8 21h8',
  pets: 'M7 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M10.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M13.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M12 12c-3.5 0-6 3-6 5.5 0 1.8 1.5 2.5 3 2.5 1.2 0 1.9-.5 3-.5s1.8.5 3 .5c1.5 0 3-.7 3-2.5 0-2.5-2.5-5.5-6-5.5z',
  beach: 'M3 20h18 M12 20V9 M4 11a8 8 0 0 1 16 0z',
  desk: 'M3 7h18v7H3z M8 14v5 M16 14v5',
  kitchen: 'M5 3h14v18H5z M5 9h14 M9 5.5h.01 M9 12v3',
  shuttle: 'M3 6h15l3 5v6H3z M3 11h18 M7.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M16.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  coffee: 'M4 9h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M16 10h1.5a2.5 2.5 0 0 1 0 5H16 M7 3v3 M11 3v3',
  star: 'M12 2.5l2.9 6.2 6.7.8-5 4.6 1.4 6.7L12 17.4 6 20.8l1.4-6.7-5-4.6 6.7-.8z',
};

export const Icon: React.FC<{name: string; size: number; color: string; sw?: number}> = ({name, size, color, sw = 1.8}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block', flex: 'none'}}>
    <path d={ICON_PATHS[name] ?? ICON_PATHS.star} />
  </svg>
);

/** 5-point star path centred at 0,0 with outer radius r */
export const starPath = (r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.4;
    pts.push(`${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
};

export const mmss = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export const softShadow = (ink: string, u: number, k = 1) => `0 ${24 * u * k}px ${60 * u * k}px ${withAlpha(ink, 0.16)}, 0 ${4 * u * k}px ${10 * u * k}px ${withAlpha(ink, 0.1)}`;
