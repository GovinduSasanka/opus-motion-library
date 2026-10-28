// "Pip": an original capsule-robot mascot (face plate, antenna bulb, two-segment arms) used by the round-3
// mascot motions. Deterministic pure-SVG figure driven by a `PipPose`. Speech / thought bubbles + confetti live here too.
import React from 'react';
import {clamp, lerp} from './ease';
import {rng} from './random';

export type PipPose = {
  dx?: number;
  dy?: number;
  sx?: number;
  sy?: number;
  tilt?: number;
  /** [upper, lower] arm angles in degrees; 0 = hanging straight down, 90 = out sideways, 180 = straight up, beyond = inward */
  armL?: [number, number];
  armR?: [number, number];
  handL?: 'fist' | 'thumb' | 'open';
  handR?: 'fist' | 'thumb' | 'open';
  eyes?: 'open' | 'happy' | 'wink' | 'closed' | 'wide';
  lookX?: number;
  lookY?: number;
  mouth?: 'smile' | 'grin' | 'open' | 'o' | 'flat' | 'hmm';
  brow?: 0 | 1 | 2;
  blush?: number;
  bulb?: number;
  blink?: number;
};

export type PipColors = {body: string; plate: string; eye: string; accent: string; ink: string; bulb: string; cheek: string};

const hexRgb = (c: string): [number, number, number] => {
  const m = c.replace('#', '');
  const s = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  return [parseInt(s.slice(0, 2), 16) || 0, parseInt(s.slice(2, 4), 16) || 0, parseInt(s.slice(4, 6), 16) || 0];
};
/** amt > 0 lightens toward white, < 0 darkens toward black */
export const shade = (c: string, amt: number) => {
  const [r, g, b] = hexRgb(c);
  const t = amt < 0 ? 0 : 255;
  const a = Math.abs(amt);
  return `rgb(${Math.round(lerp(r, t, a))},${Math.round(lerp(g, t, a))},${Math.round(lerp(b, t, a))})`;
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
};

/** natural blink factor 0..1 (1 = closed), deterministic */
export const blinkAt = (frame: number, period = 96, offset = 40) => {
  const k = (((frame + offset) % period) + period) % period;
  return k < 6 ? Math.sin((k / 6) * Math.PI) : 0;
};

const A_UP = 64, A_LOW = 62;
const dirOf = (side: number, deg: number) => [side * Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)] as const;

type PipProps = {x: number; y: number; scale: number; pose: PipPose; colors: PipColors; shadow?: boolean; id?: string};

/** Pip is ~340 local units tall with its feet at (0,0); `scale` = px per unit. */
export const Pip: React.FC<PipProps> = ({x, y, scale, pose, colors: C, shadow = true, id = 'pip'}) => {
  const {dx = 0, dy = 0, sx = 1, sy = 1, tilt = 0, eyes = 'open', lookX = 0, lookY = 0, mouth = 'smile', brow = 0, blush = 0.5, bulb = 0, blink = 0} = pose;
  const armL = pose.armL ?? [8, 4];
  const armR = pose.armR ?? [8, 4];
  const handL = pose.handL ?? 'fist';
  const handR = pose.handR ?? 'fist';
  const limb = shade(C.body, -0.22);
  const bodyLight = shade(C.body, 0.18);
  const lift = Math.max(0, -dy);
  const arm = (side: number, a: [number, number], hand: 'fist' | 'thumb' | 'open') => {
    const S = [side * 92, -118];
    const d1 = dirOf(side, a[0]);
    const E = [S[0] + d1[0] * A_UP, S[1] + d1[1] * A_UP];
    const d2 = dirOf(side, a[1]);
    const Hd = [E[0] + d2[0] * A_LOW, E[1] + d2[1] * A_LOW];
    return (
      <g>
        <path d={`M${S[0]} ${S[1]}L${E[0]} ${E[1]}L${Hd[0]} ${Hd[1]}`} fill="none" stroke={limb} strokeWidth={27} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={S[0]} cy={S[1]} r={17} fill={limb} />
        <circle cx={Hd[0]} cy={Hd[1]} r={hand === 'open' ? 20 : 22} fill={bodyLight} stroke={limb} strokeWidth={4} />
        {hand === 'thumb' ? (
          <g>
            <rect x={Hd[0] - 8} y={Hd[1] - 46} width={16} height={32} rx={8} fill={bodyLight} stroke={limb} strokeWidth={4} />
            <path d={`M${Hd[0] - 12} ${Hd[1] - 2}h24M${Hd[0] - 11} ${Hd[1] + 8}h22`} stroke={limb} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
          </g>
        ) : null}
        {hand === 'open' ? <circle cx={Hd[0]} cy={Hd[1]} r={8} fill={limb} opacity={0.25} /> : null}
      </g>
    );
  };
  const eye = (side: number, kind: 'open' | 'happy' | 'closed' | 'wide') => {
    const ex = side * 33 + lookX * 7;
    const ey = -184 + lookY * 6;
    if (kind === 'happy') return <path key={side} d={`M${side * 33 - 15} ${-178}Q${side * 33} ${-200} ${side * 33 + 15} ${-178}`} fill="none" stroke={C.eye} strokeWidth={8} strokeLinecap="round" />;
    if (kind === 'closed') return <path key={side} d={`M${side * 33 - 14} ${-182}h28`} stroke={C.eye} strokeWidth={8} strokeLinecap="round" />;
    const rx = kind === 'wide' ? 17 : 13.5;
    const ry = (kind === 'wide' ? 23 : 18) * (1 - 0.92 * blink);
    return (
      <g key={side}>
        <ellipse cx={ex} cy={ey} rx={rx} ry={Math.max(1.5, ry)} fill={C.eye} />
        {blink < 0.4 ? <circle cx={ex - 4} cy={ey - 6} r={4.5} fill="#fff" opacity={0.85} /> : null}
      </g>
    );
  };
  const eyeKind = (side: number) => (eyes === 'wink' ? (side > 0 ? 'happy' : 'open') : eyes);
  const mouthEl = (() => {
    const my = -150;
    switch (mouth) {
      case 'grin':
        return <path d={`M-24 ${my - 4}Q0 ${my + 30} 24 ${my - 4}Z`} fill={C.eye} />;
      case 'open':
        return <ellipse cx={0} cy={my + 2} rx={12} ry={14} fill={C.eye} />;
      case 'o':
        return <circle cx={0} cy={my + 3} r={8} fill="none" stroke={C.eye} strokeWidth={6} />;
      case 'flat':
        return <path d={`M-13 ${my + 2}h26`} stroke={C.eye} strokeWidth={6} strokeLinecap="round" />;
      case 'hmm':
        return <path d={`M-15 ${my + 3}Q-6 ${my - 4} 2 ${my + 3}T17 ${my - 1}`} fill="none" stroke={C.eye} strokeWidth={6} strokeLinecap="round" />;
      default:
        return <path d={`M-19 ${my - 3}Q0 ${my + 16} 19 ${my - 3}`} fill="none" stroke={C.eye} strokeWidth={6.5} strokeLinecap="round" />;
    }
  })();
  const glow = clamp(bulb);
  const bulbFill = mixHex('#7d8598', C.bulb, glow);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {shadow ? <ellipse cx={0} cy={2} rx={92 * (1 - 0.35 * clamp(lift / 120))} ry={14 * (1 - 0.3 * clamp(lift / 120))} fill="#000" opacity={0.28 * (1 - 0.5 * clamp(lift / 120))} /> : null}
      <g transform={`translate(${dx} ${dy}) rotate(${tilt}) scale(${sx} ${sy})`}>
        {/* feet */}
        <ellipse cx={-46} cy={-14} rx={36} ry={17} fill={shade(C.body, -0.34)} />
        <ellipse cx={46} cy={-14} rx={36} ry={17} fill={shade(C.body, -0.34)} />
        {/* antenna */}
        <path d="M0 -246V-286" stroke={shade(C.body, -0.3)} strokeWidth={8} strokeLinecap="round" />
        {glow > 0.02 ? <circle cx={0} cy={-306} r={17 + 22 * glow} fill={C.bulb} opacity={0.22 * glow} /> : null}
        <circle cx={0} cy={-306} r={17} fill={bulbFill} stroke={shade(C.body, -0.3)} strokeWidth={4} />
        {glow > 0.5
          ? Array.from({length: 8}, (_, k) => {
              const a = (k / 8) * Math.PI * 2;
              const r0 = 30, r1 = 30 + 14 * glow;
              return <path key={k} d={`M${Math.cos(a) * r0} ${-306 + Math.sin(a) * r0}L${Math.cos(a) * r1} ${-306 + Math.sin(a) * r1}`} stroke={C.bulb} strokeWidth={4} strokeLinecap="round" opacity={glow} />;
            })
          : null}
        {/* body */}
        <rect x={-100} y={-252} width={200} height={232} rx={78} fill={C.body} />
        <path d="M-100 -150a78 78 0 0 1 78 -102" fill="none" stroke={bodyLight} strokeWidth={9} strokeLinecap="round" opacity={0.55} />
        <path d={`M-84 -60Q0 -30 84 -60`} fill="none" stroke={shade(C.body, -0.18)} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
        {/* chest light */}
        <circle cx={0} cy={-78} r={15} fill={C.accent} />
        <circle cx={-4} cy={-82} r={5} fill="#fff" opacity={0.7} />
        {/* face */}
        <rect x={-74} y={-228} width={148} height={102} rx={42} fill={C.plate} />
        {eye(-1, eyeKind(-1) as 'open')}
        {eye(1, eyeKind(1) as 'open')}
        {brow === 1 ? <path d="M16 -214L50 -224" stroke={C.eye} strokeWidth={6} strokeLinecap="round" /> : null}
        {brow === 2 ? <path d={`M-48 -216Q-33 -226 -18 -216M18 -216Q33 -226 48 -216`} fill="none" stroke={C.eye} strokeWidth={6} strokeLinecap="round" /> : null}
        {blush > 0 ? (
          <g opacity={0.8 * blush}>
            <circle cx={-56} cy={-153} r={10} fill={C.cheek} />
            <circle cx={56} cy={-153} r={10} fill={C.cheek} />
          </g>
        ) : null}
        <g transform={`translate(${lookX * 4} 0)`}>{mouthEl}</g>
        {/* arms */}
        {arm(-1, armL, handL)}
        {arm(1, armR, handR)}
      </g>
    </g>
  );
};

export const wrapText = (text: string, fontSize: number, maxW: number) => {
  const cw = fontSize * 0.56;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const t = cur ? cur + ' ' + wd : wd;
    if (t.length * cw > maxW && cur) {
      lines.push(cur);
      cur = wd;
    } else cur = t;
  }
  if (cur || !lines.length) lines.push(cur);
  return {lines, w: Math.min(maxW, Math.max(...lines.map((l) => l.length)) * cw)};
};

export const bubbleSize = (text: string, fontSize: number, maxW: number) => {
  const {lines, w} = wrapText(text, fontSize, maxW);
  return {bw: w + fontSize * 1.8, bh: lines.length * fontSize * 1.25 + fontSize * 1.4};
};

/** where Pip stands: landscape = left-centre, portrait = lower centre. `size` multiplies. */
export const pipLayout = (w: number, h: number, u: number, portrait: boolean, size = 1) => {
  const sc = (portrait ? Math.min((h * 0.4) / 340, (w * 0.62) / 200) : (h * 0.66) / 340) * size;
  return {x: portrait ? w / 2 : w * 0.34, y: portrait ? h * 0.8 : h * 0.86, sc, u};
};

/** Rounded speech bubble centred at (cx, cy) with a tail whose tip is at (tx, ty). `pop` 0..1 scales it from the tail tip. */
export const SpeechBubble: React.FC<{
  cx: number; cy: number; tx: number; ty: number; text: string; fontSize: number; maxW: number;
  fill: string; ink: string; stroke?: string; fontFamily: string; pop: number; shown?: number; u: number;
}> = ({cx, cy, tx, ty, text, fontSize, maxW, fill, ink, stroke, fontFamily, pop, shown = 1, u}) => {
  const {lines, w: tw} = wrapText(text, fontSize, maxW);
  const padX = fontSize * 0.9, padY = fontSize * 0.7;
  const lh = fontSize * 1.25;
  const bw = tw + padX * 2, bh = lines.length * lh + padY * 2;
  const tailX = clamp(tx - cx, -bw / 2 + 36 * u, bw / 2 - 36 * u);
  const down = ty > cy;
  const edgeY = down ? bh / 2 : -bh / 2;
  const chars = Math.ceil(text.length * shown);
  let left = chars;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${Math.max(0.001, pop)}) translate(${-tx} ${-ty})`}>
      <g transform={`translate(${cx} ${cy})`}>
        <path
          d={`M${-bw / 2 + 26 * u} ${-bh / 2}H${bw / 2 - 26 * u}Q${bw / 2} ${-bh / 2} ${bw / 2} ${-bh / 2 + 26 * u}V${bh / 2 - 26 * u}Q${bw / 2} ${bh / 2} ${bw / 2 - 26 * u} ${bh / 2}H${-bw / 2 + 26 * u}Q${-bw / 2} ${bh / 2} ${-bw / 2} ${bh / 2 - 26 * u}V${-bh / 2 + 26 * u}Q${-bw / 2} ${-bh / 2} ${-bw / 2 + 26 * u} ${-bh / 2}Z`}
          fill={fill} stroke={stroke} strokeWidth={stroke ? 3 * u : 0}
        />
        <path d={`M${tailX - 30 * u} ${edgeY}L${tx - cx} ${ty - cy}L${tailX + 30 * u} ${edgeY}Z`} fill={fill} stroke={stroke} strokeWidth={stroke ? 3 * u : 0} strokeLinejoin="round" />
        <path d={`M${tailX - 27 * u} ${edgeY + (down ? -2 : 2)}H${tailX + 27 * u}`} stroke={fill} strokeWidth={6 * u} />
        {lines.map((l, i) => {
          const part = l.slice(0, Math.max(0, left));
          left -= l.length + 1;
          return (
            <text key={i} x={0} y={-bh / 2 + padY + lh * i + fontSize * 0.88} textAnchor="middle" fontFamily={fontFamily} fontSize={fontSize} fontWeight={700} fill={ink}>
              {part}
            </text>
          );
        })}
      </g>
    </g>
  );
};

/** Deterministic confetti burst: pieces fly from (x,y), gravity pulls them down, they spin and fade out. */
export const Confetti: React.FC<{
  frame: number; start: number; x: number; y: number; count: number; colors: string[]; u: number; seed: number;
  power?: number; gravity?: number; life?: number; spread?: number; angle?: number;
}> = ({frame, start, x, y, count, colors, u, seed, power = 1, gravity = 1, life = 90, spread = 140, angle = -90}) => {
  const t = frame - start;
  if (t < 0 || t > life) return null;
  const r = rng(seed);
  const els: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const a = ((angle + (r() - 0.5) * spread) * Math.PI) / 180;
    const v = (14 + r() * 20) * power * u;
    const spin = (r() - 0.5) * 30;
    const sz = (9 + r() * 11) * u;
    const kind = Math.floor(r() * 3);
    const col = colors[Math.floor(r() * colors.length) % colors.length];
    const drag = Math.exp(-t * 0.055);
    const px = x + Math.cos(a) * v * (1 - drag) / 0.055;
    const py = y + Math.sin(a) * v * (1 - drag) / 0.055 + 0.5 * 0.55 * gravity * u * t * t;
    const wob = Math.sin(t * 0.3 + i) * 0.5 + 0.5;
    const op = clamp((life - t) / 25);
    els.push(
      <g key={i} transform={`translate(${px} ${py}) rotate(${spin * t * 0.4 + i * 37})`} opacity={op}>
        {kind === 0 ? <rect x={-sz / 2} y={(-sz * 0.3 * (0.4 + wob)) / 1} width={sz} height={sz * 0.6 * (0.4 + wob)} fill={col} /> : null}
        {kind === 1 ? <circle r={sz * 0.4} fill={col} /> : null}
        {kind === 2 ? <path d={`M0 ${-sz * 0.6}L${sz * 0.5} ${sz * 0.4}L${-sz * 0.5} ${sz * 0.4}Z`} fill={col} transform={`scale(1 ${0.5 + wob * 0.5})`} /> : null}
      </g>,
    );
  }
  return <g>{els}</g>;
};
