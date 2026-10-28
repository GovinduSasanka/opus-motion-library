import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ease, prog} from './ease';
import {rng} from './random';
import {Svg, useStage} from './stage';
import {backOut, bgOf, heartPath, starPath} from './r3-social';
import {mixHex, withAlpha} from './r2-s1-kit';

/**
 * Shared helpers for the round-3 events / celebration / greeting motions (birthday cake, save-the-date, ticket, new-year
 * countdown, greeting card, anniversary badge, RSVP invite, graduation toss).
 * Layout is done in a "design box" (wide 1600x900, square 1000x1000, tall 900x1600) that is scaled to fit the frame, so
 * every motion reflows for 16:9, 1:1 and 9:16 without per-motion portrait code.
 */

export {mixHex, withAlpha, backOut, bgOf, heartPath, starPath};

export type Layout = {W: number; H: number; kind: 'wide' | 'square' | 'tall'; S: number; ox: number; oy: number; w: number; h: number};

export const useLayout = (): Layout => {
  const {w, h} = useStage();
  const r = w / h;
  const kind: Layout['kind'] = r > 1.25 ? 'wide' : r < 0.8 ? 'tall' : 'square';
  const W = kind === 'wide' ? 1600 : kind === 'tall' ? 900 : 1000;
  const H = kind === 'wide' ? 900 : kind === 'tall' ? 1600 : 1000;
  const S = Math.min(w / W, h / H);
  return {W, H, kind, S, w, h, ox: (w - W * S) / 2, oy: (h - H * S) / 2};
};

/** full-frame background + an optional full-frame layer (pixel coords) + the scaled design-box group */
export const EventStage: React.FC<{background: string; pre?: (L: Layout) => React.ReactNode; children: (L: Layout) => React.ReactNode}> = ({background, pre, children}) => {
  const L = useLayout();
  return (
    <AbsoluteFill style={{background: bgOf(background)}}>
      <Svg>
        {pre ? pre(L) : null}
        <g transform={`translate(${L.ox} ${L.oy}) scale(${L.S})`}>{children(L)}</g>
      </Svg>
    </AbsoluteFill>
  );
};

/** soft radial glow */
export const Glow: React.FC<{id: string; x: number; y: number; r: number; color: string; opacity?: number}> = ({id, x, y, r, color, opacity = 1}) => (
  <g opacity={opacity}>
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor={color} stopOpacity={0.9} />
        <stop offset="0.45" stopColor={color} stopOpacity={0.3} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </g>
);

/** four-point sparkle */
export const sparkPath = (x: number, y: number, r: number, pinch = 0.2) =>
  `M${x} ${y - r}Q${x + r * pinch} ${y - r * pinch} ${x + r} ${y}Q${x + r * pinch} ${y + r * pinch} ${x} ${y + r}Q${x - r * pinch} ${y + r * pinch} ${x - r} ${y}Q${x - r * pinch} ${y - r * pinch} ${x} ${y - r}Z`;

/** a ballistic firework burst; `t` = frames since the burst, returns null outside its life */
export const Firework: React.FC<{x: number; y: number; t: number; color: string; color2?: string; seed?: number; size?: number; n?: number; life?: number; gravity?: number}> = ({
  x,
  y,
  t,
  color,
  color2,
  seed = 1,
  size = 1,
  n = 44,
  life = 64,
  gravity = 0.075,
}) => {
  if (t < 0 || t > life) return null;
  const R = rng(seed * 7919 + 11);
  const fade = 1 - prog(t, life * 0.45, life, ease.linear);
  const flash = 1 - prog(t, 0, 7, ease.out);
  const ring2 = R() > 0.5;
  const parts = Array.from({length: n}, (_, i) => {
    const inner = ring2 && i % 3 === 0;
    const a = (i / n) * Math.PI * 2 + R() * 0.3;
    const sp = (inner ? 3.4 : 5.2 + R() * 1.6) * size;
    return {a, sp, d: 0.93 + R() * 0.012, col: inner || i % 5 === 4 ? color2 || color : color, w: (2.4 + R() * 1.6) * size};
  });
  const pos = (q: {a: number; sp: number; d: number}, tt: number) => {
    const tc = Math.max(0, tt);
    const dist = (q.sp * (1 - Math.pow(q.d, tc))) / (1 - q.d);
    return [x + Math.cos(q.a) * dist * 6, y + Math.sin(q.a) * dist * 6 + gravity * tc * tc * size * 6] as const;
  };
  return (
    <g>
      {flash > 0 && <circle cx={x} cy={y} r={(30 + 110 * (1 - flash)) * size} fill={color} opacity={flash * 0.55} />}
      {parts.map((q, i) => {
        const [px, py] = pos(q, t);
        const [qx, qy] = pos(q, t - 5);
        const tw = 0.65 + 0.35 * Math.sin(t * 0.9 + i * 2.1);
        return (
          <g key={i} opacity={fade * tw}>
            <line x1={qx} y1={qy} x2={px} y2={py} stroke={q.col} strokeWidth={q.w} strokeLinecap="round" opacity={0.65} />
            <circle cx={px} cy={py} r={q.w * 0.9} fill={mixHex(q.col, '#ffffff', 0.5)} />
          </g>
        );
      })}
    </g>
  );
};

/** confetti shower from a point (or a line); `t` frames since fired */
export const Confetti: React.FC<{x: number; y: number; t: number; colors: string[]; seed?: number; n?: number; power?: number; spread?: number; gravity?: number; size?: number; life?: number; wide?: number; dir?: number}> = ({
  x,
  y,
  t,
  colors,
  seed = 1,
  n = 70,
  power = 22,
  spread = Math.PI * 0.75,
  gravity = 0.55,
  size = 1,
  life = 110,
  wide = 0,
  dir = -Math.PI / 2,
}) => {
  if (t < 0 || t > life) return null;
  const R = rng(seed * 131 + 7);
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const a = dir + (R() - 0.5) * spread;
        const sp = power * (0.35 + R() * 0.75);
        const d = 0.92 + R() * 0.03;
        const kind = Math.floor(R() * 3);
        const col = colors[Math.floor(R() * colors.length) % colors.length];
        const s = (10 + R() * 12) * size;
        const spin = 0.12 + R() * 0.25;
        const ph = R() * 6.28;
        const x0 = x + (R() - 0.5) * wide;
        const dist = (sp * (1 - Math.pow(d, t))) / (1 - d);
        const px = x0 + Math.cos(a) * dist + Math.sin(t * 0.12 + ph) * 8;
        const py = y + Math.sin(a) * dist + gravity * t * t * 0.5 * (0.5 + 0.5 * d);
        const flip = Math.cos(t * spin + ph);
        const op = 1 - prog(t, life * 0.7, life, ease.linear);
        return (
          <g key={i} transform={`translate(${px} ${py}) rotate(${(t * spin * 40 + ph * 20) % 360}) scale(1 ${flip})`} opacity={op}>
            {kind === 0 ? <rect x={-s / 2} y={-s / 3} width={s} height={s * 0.62} fill={col} /> : kind === 1 ? <circle r={s * 0.36} fill={col} /> : <path d={`M${-s / 2} 0Q0 ${-s * 0.6} ${s / 2} 0Q0 ${s * 0.6} ${-s / 2} 0Z`} fill={col} />}
          </g>
        );
      })}
    </g>
  );
};

/** pointed leaf outline from (0,0) to (len,0) */
export const leafPath = (len: number, wid: number) => `M0 0C${len * 0.25} ${-wid} ${len * 0.75} ${-wid} ${len} 0C${len * 0.75} ${wid} ${len * 0.25} ${wid} 0 0Z`;

/** curved stem that grows (t 0..1) with alternating line-art leaves */
export const Sprig: React.FC<{x: number; y: number; rot?: number; len: number; t: number; color: string; seed?: number; bend?: number; leaves?: number; flip?: boolean; sw?: number; fill?: number}> = ({
  x,
  y,
  rot = 0,
  len,
  t,
  color,
  seed = 1,
  bend = 0.22,
  leaves = 7,
  flip = false,
  sw = 2.4,
  fill = 0.14,
}) => {
  const R = rng(seed * 53 + 3);
  const P1: [number, number] = [len * 0.5, -len * bend];
  const P2: [number, number] = [len, 0];
  const at = (s: number): [number, number, number] => {
    const px = 2 * (1 - s) * s * P1[0] + s * s * P2[0];
    const py = 2 * (1 - s) * s * P1[1] + s * s * P2[1];
    const tx = 2 * (1 - s) * P1[0] + 2 * s * (P2[0] - P1[0]);
    const ty = 2 * (1 - s) * P1[1] + 2 * s * (P2[1] - P1[1]);
    return [px, py, Math.atan2(ty, tx)];
  };
  const tg = prog(t, 0, 0.7, ease.inOut);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1 ${flip ? -1 : 1})`}>
      <path d={`M0 0Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tg} />
      {Array.from({length: leaves}, (_, i) => {
        const s = 0.16 + (i / leaves) * 0.8;
        const [px, py, ang] = at(s);
        const side = i % 2 ? 1 : -1;
        const size = len * (0.2 - 0.09 * s) * (0.85 + R() * 0.3);
        const k = backOut(prog(t, s * 0.62, s * 0.62 + 0.3, ease.linear), 1.6);
        if (k <= 0) return null;
        return (
          <g key={i} transform={`translate(${px} ${py}) rotate(${(ang * 180) / Math.PI + side * 42}) scale(${k})`}>
            <path d={leafPath(size, size * 0.38)} fill={withAlpha(color, fill)} stroke={color} strokeWidth={sw * 0.8} strokeLinejoin="round" />
            <path d={`M0 0L${size * 0.8} 0`} stroke={color} strokeWidth={sw * 0.5} opacity={0.7} />
          </g>
        );
      })}
      {/* terminal bud */}
      {t > 0.85 && (() => {
        const [px, py, ang] = at(1);
        const k = backOut(prog(t, 0.85, 1, ease.linear));
        return <g transform={`translate(${px} ${py}) rotate(${(ang * 180) / Math.PI}) scale(${k})`}><path d={leafPath(len * 0.11, len * 0.04)} fill={withAlpha(color, fill)} stroke={color} strokeWidth={sw * 0.8} /></g>;
      })()}
    </g>
  );
};

/** simple five-petal line-art flower that blooms with t */
export const Flower: React.FC<{x: number; y: number; r: number; t: number; color: string; rot?: number; sw?: number; petals?: number; fillColor?: string}> = ({x, y, r, t, color, rot = 0, sw = 2.4, petals = 5, fillColor}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {Array.from({length: petals}, (_, i) => {
      const k = backOut(prog(t, i * 0.09, i * 0.09 + 0.5, ease.linear), 1.5);
      return (
        <g key={i} transform={`rotate(${(i / petals) * 360}) scale(${k})`}>
          <path d={`M0 0C${-r * 0.55} ${-r * 0.35} ${-r * 0.5} ${-r * 0.95} 0 ${-r}C${r * 0.5} ${-r * 0.95} ${r * 0.55} ${-r * 0.35} 0 0Z`} fill={fillColor ? withAlpha(fillColor, 0.18) : 'none'} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M0 ${-r * 0.2}L0 ${-r * 0.62}`} stroke={color} strokeWidth={sw * 0.5} opacity={0.6} />
        </g>
      );
    })}
    <circle r={r * 0.17 * backOut(prog(t, 0.4, 0.8, ease.linear))} fill="none" stroke={color} strokeWidth={sw} />
    <circle r={r * 0.06 * backOut(prog(t, 0.5, 0.9, ease.linear))} fill={color} />
  </g>
);

/** laurel branch following a circle arc; mirrored with `mirror` to make the pair */
export const Laurel: React.FC<{cx: number; cy: number; R: number; t: number; color: string; mirror?: boolean; n?: number; leaf?: number; sw?: number}> = ({cx, cy, R, t, color, mirror = false, n = 11, leaf = 44, sw = 3}) => {
  const a0 = Math.PI * 0.6;
  const a1 = Math.PI * 1.42;
  const pt = (a: number): [number, number] => [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
  const [sx, sy] = pt(a0);
  const [ex, ey] = pt(a1);
  const tg = prog(t, 0, 0.75, ease.inOut);
  return (
    <g transform={mirror ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>
      <path d={`M${sx} ${sy}A${R} ${R} 0 0 1 ${ex} ${ey}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tg} />
      {Array.from({length: n}, (_, i) => {
        const s = i / (n - 1);
        const a = a0 + (a1 - a0) * s;
        const [px, py] = pt(a);
        const tan = (a + Math.PI / 2) * (180 / Math.PI);
        const size = leaf * (1 - 0.35 * s);
        const k = backOut(prog(t, 0.06 + s * 0.62, 0.06 + s * 0.62 + 0.28, ease.linear), 1.6);
        if (k <= 0) return null;
        return [1, -1].map((side) => (
          <g key={`${i}-${side}`} transform={`translate(${px} ${py}) rotate(${tan + side * 40}) scale(${k})`}>
            <path d={leafPath(size, size * 0.36)} fill={withAlpha(color, 0.22)} stroke={color} strokeWidth={sw * 0.7} strokeLinejoin="round" />
          </g>
        ));
      })}
    </g>
  );
};

/** deterministic QR-like block pattern; rows reveal top to bottom with `t` */
export const QRPattern: React.FC<{x: number; y: number; size: number; seed?: string | number; n?: number; t?: number; color: string; paper?: string}> = ({x, y, size, seed = 1, n = 21, t = 1, color, paper}) => {
  const R = rng(typeof seed === 'string' ? seed : seed * 977 + 5);
  const cell = size / n;
  const finder = (cx0: number, cy0: number) => cx0 < 7 && cy0 < 7 ? [0, 0] : cx0 >= n - 7 && cy0 < 7 ? [n - 7, 0] : cx0 < 7 && cy0 >= n - 7 ? [0, n - 7] : null;
  const cells: React.ReactNode[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const r = R();
      const f = finder(i, j);
      let on: boolean;
      if (f) {
        const lx = i - f[0];
        const ly = j - f[1];
        const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6;
        const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        on = ring || core;
      } else if ((i === 7 && j < 8) || (j === 7 && i < 8) || (i === n - 8 && j < 8) || (j === 7 && i >= n - 8) || (i === 7 && j >= n - 8) || (j === n - 8 && i < 8)) on = false;
      else on = r > 0.52;
      if (!on) continue;
      const rowT = clamp(t * (n + 3) - j);
      if (rowT <= 0) continue;
      cells.push(<rect key={`${i}-${j}`} x={x + i * cell} y={y + j * cell} width={cell * 1.02} height={cell * 1.02} fill={color} opacity={rowT} />);
    }
  }
  return (
    <g>
      {paper && <rect x={x - cell} y={y - cell} width={size + cell * 2} height={size + cell * 2} rx={cell} fill={paper} />}
      {cells}
    </g>
  );
};

export type IconName = 'calendar' | 'clock' | 'pin' | 'hanger' | 'gift' | 'star' | 'heart' | 'ticket' | 'phone' | 'none';

/** tiny line icons on a 24 box centred at (x,y) at size `s` px */
export const EvIcon: React.FC<{name: IconName | string; x: number; y: number; s: number; color: string; sw?: number}> = ({name, x, y, s, color, sw = 1.7}) => {
  const k = s / 24;
  const p = {fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  let body: React.ReactNode = null;
  switch (name) {
    case 'calendar':
      body = (
        <g {...p}>
          <rect x={3.5} y={5} width={17} height={15} rx={2.5} />
          <path d="M3.5 10H20.5M8 3V7M16 3V7" />
          <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 17H8.01M12 17H12.01" />
        </g>
      );
      break;
    case 'clock':
      body = (
        <g {...p}>
          <circle cx={12} cy={12} r={8.5} />
          <path d="M12 7V12L15.5 14" />
        </g>
      );
      break;
    case 'pin':
      body = (
        <g {...p}>
          <path d="M12 21C12 21 5 14.5 5 9.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z" />
          <circle cx={12} cy={9.5} r={2.6} />
        </g>
      );
      break;
    case 'hanger':
      body = (
        <g {...p}>
          <path d="M12 8V6.5A2 2 0 1 1 14 8.5L12 10L3 16.5A1.4 1.4 0 0 0 3.8 19H20.2A1.4 1.4 0 0 0 21 16.5L12 10" />
        </g>
      );
      break;
    case 'gift':
      body = (
        <g {...p}>
          <rect x={3.5} y={9} width={17} height={11} rx={1.5} />
          <path d="M2.5 9H21.5V12.5H2.5ZM12 9V20" />
          <path d="M12 9C12 9 9 8.5 8 7A2 2 0 0 1 11 5.5C12 6.5 12 9 12 9ZM12 9C12 9 15 8.5 16 7A2 2 0 0 0 13 5.5C12 6.5 12 9 12 9Z" />
        </g>
      );
      break;
    case 'star':
      body = <path d={starPath(12, 12.5, 9.5)} {...p} />;
      break;
    case 'heart':
      body = <path d={heartPath(12, 11.5, 6.4)} {...p} />;
      break;
    case 'ticket':
      body = (
        <g {...p}>
          <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H19.5A1.5 1.5 0 0 1 21 8.5V10.5A1.8 1.8 0 0 0 21 14V15.5A1.5 1.5 0 0 1 19.5 17H4.5A1.5 1.5 0 0 1 3 15.5V14A1.8 1.8 0 0 0 3 10.5Z" />
          <path d="M14 7V9M14 11V13M14 15V17" />
        </g>
      );
      break;
    case 'phone':
      body = (
        <g {...p}>
          <rect x={7} y={3} width={10} height={18} rx={2.4} />
          <path d="M11 18H13" />
        </g>
      );
      break;
    default:
      body = <circle cx={12} cy={12} r={2.4} fill={color} />;
  }
  return <g transform={`translate(${x - 12 * k} ${y - 12 * k}) scale(${k})`}>{body}</g>;
};

/** mouse-pointer arrow, tip at (x,y) */
export const PointerArrow: React.FC<{x: number; y: number; s?: number; fill?: string; stroke?: string; press?: number}> = ({x, y, s = 1, fill = '#ffffff', stroke = '#1a1a1a', press = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s * (1 - 0.1 * press)})`}>
    <path d="M0 0L0 40L10 31L17 46L25 42L18 28L32 28Z" fill={fill} stroke={stroke} strokeWidth={3} strokeLinejoin="round" transform="translate(1 2)" />
  </g>
);

/** greedy single-line fit helper: width-based font size */
export const fitFont = (text: string, base: number, maxW: number, avg: number) => {
  const wd = [...text].length * avg * base;
  return wd > maxW ? (base * maxW) / wd : base;
};
