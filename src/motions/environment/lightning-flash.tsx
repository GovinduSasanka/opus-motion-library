import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurFilter, RainField, hash01, isTransparent, ridgePath} from '../../core/environment-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Lightning relight (video16 lightning-relight).
 * A dark rainy night exterior (house with a warm bay window, trees, hills, storm clouds) is
 * suddenly relit: a forked bolt draws on in 2 frames, the scene swaps to a flat bright "lit plate"
 * with a pink/magenta storm sky, holds `holdFrames` (2), then decays exponentially (τ = 0.1 s)
 * back to night through half-lit frames; optional double-strike 3 frames later at 0.6, and a
 * +0.15 white overlay on the strike frames. Repeats at every entry of `strikes`.
 */
type Props = {
  background: string;
  backdrop: boolean;
  strikes: number[];
  sheetFlashes: number[];
  holdFrames: number;
  decay: number;
  doubleStrike: boolean;
  rain: boolean;
  boltColor: string;
  glowColor: string;
  flashColor: string;
  shake: number;
  seed: number;
};

type Pal = {sky0: string; sky1: string; cloud: string; cloudEdge: string; hill: string; tree: string; wall: string; roof: string; trim: string; ground: string; siding: number};
const NIGHT: Pal = {sky0: '#04080F', sky1: '#1C2A3A', cloud: '#0B141E', cloudEdge: '#1A2A3C', hill: '#0B141E', tree: '#060B12', wall: '#142030', roof: '#0A121B', trim: '#18263A', ground: '#070D14', siding: 0.12};
const LIT: Pal = {sky0: '#9E6F9C', sky1: '#E7BCCB', cloud: '#7C5F8C', cloudEdge: '#C9A2C2', hill: '#4F4A6B', tree: '#2A2940', wall: '#B9BBC9', roof: '#5F5C76', trim: '#E9E8F0', ground: '#5B5773', siding: 0.35};

const Scene: React.FC<{p: Pal; id: string; seed: number; windowGlow: number; part: 'sky' | 'clouds' | 'land'}> = ({p, id, seed, windowGlow, part}) => {
  const {w, h, u, portrait} = useStage();
  const hz = h * (portrait ? 0.7 : 0.72);
  const S = Math.min(w, h);
  const hx = w * (portrait ? 0.5 : 0.62);
  const hw = S * 0.62;
  const hh = S * 0.3;
  const top = hz - hh;
  const roofH = S * 0.2;
  const winW = hw * 0.5;
  const winH = hh * 0.52;
  const winX = hx - winW / 2;
  const winY = top + hh * 0.22;
  const siding: string[] = [];
  for (let y = top + 10 * u; y < hz; y += 12 * u) siding.push(`M${hx - hw / 2} ${y.toFixed(1)}H${hx + hw / 2}`);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky0} />
          <stop offset="1" stopColor={p.sky1} />
        </linearGradient>
      </defs>
      {part === 'sky' && <rect width={w} height={h} fill={`url(#${id}-sky)`} />}
      {part === 'clouds' && (
        <g>
          <path d={scallop(seed + 5, w, h * 0.26, u)} fill={p.cloudEdge} opacity={0.5} transform={`translate(0 ${7 * u})`} />
          <path d={scallop(seed + 5, w, h * 0.26, u)} fill={p.cloud} opacity={0.85} />
          <path d={scallop(seed, w, h * 0.19, u)} fill={p.cloudEdge} transform={`translate(0 ${7 * u})`} />
          <path d={scallop(seed, w, h * 0.19, u)} fill={p.cloud} />
        </g>
      )}
      {part === 'land' && (
      <g>
      <path d={ridgePath('lfh' + seed, -10, w + 10, hz - 50 * u, 60 * u, 600 * u, h, {octaves: 2, step: 8 * u})} fill={p.hill} />
      {/* trees */}
      {Array.from({length: 9}, (_, i) => {
        const x = (i < 5 ? 0.02 + i * 0.07 : 0.82 + (i - 5) * 0.06) * w + hash01(seed, i, 1) * 30 * u;
        const r = (60 + 50 * hash01(seed, i, 2)) * u;
        const y = hz - r * 0.9;
        return (
          <g key={i} fill={p.tree}>
            <rect x={x - 5 * u} y={y} width={10 * u} height={hz - y} />
            <circle cx={x} cy={y} r={r * 0.7} />
            <circle cx={x - r * 0.45} cy={y + r * 0.25} r={r * 0.5} />
            <circle cx={x + r * 0.45} cy={y + r * 0.2} r={r * 0.55} />
            <circle cx={x + r * 0.1} cy={y - r * 0.5} r={r * 0.45} />
          </g>
        );
      })}
      <rect y={hz} width={w} height={h - hz} fill={p.ground} />
      {/* house */}
      <polygon points={`${hx - hw / 2 - 20 * u},${top} ${hx},${top - roofH} ${hx + hw / 2 + 20 * u},${top}`} fill={p.roof} />
      <rect x={hx - hw / 2} y={top} width={hw} height={hh} fill={p.wall} />
      <path d={siding.join('')} stroke={p.trim} strokeWidth={1.2 * u} opacity={p.siding} />
      <rect x={winX - 10 * u} y={winY - 10 * u} width={winW + 20 * u} height={winH + 20 * u} fill={p.trim} />
      <rect x={winX} y={winY} width={winW} height={winH} fill="#E8A040" opacity={0.75 + 0.25 * windowGlow} />
      <rect x={winX} y={winY} width={winW} height={winH} fill="url(#lf-room)" />
      <path d={`M${winX + winW / 3} ${winY}V${winY + winH}M${winX + (2 * winW) / 3} ${winY}V${winY + winH}M${winX} ${winY + winH * 0.4}H${winX + winW}`} stroke={p.trim} strokeWidth={6 * u} />
      <rect x={hx + hw * 0.3} y={hz - hh * 0.55} width={hw * 0.11} height={hh * 0.55} fill={p.roof} />
      <rect x={hx - hw / 2 - 30 * u} y={hz - 6 * u} width={hw + 60 * u} height={10 * u} fill={p.trim} opacity={0.7} />
      </g>
      )}
    </g>
  );
};

/** cloud bank with a scalloped (puffy) lower edge */
const scallop = (seed: number, w: number, y0: number, u: number) => {
  let d = `M -10 -10 L ${w + 10} -10 L ${w + 10} ${y0.toFixed(1)}`;
  let x = w + 10;
  let k = 0;
  let y = y0;
  while (x > -10) {
    const r = (45 + 60 * hash01(seed, k, 1)) * u;
    const ny = y0 + (hash01(seed, k, 2) - 0.5) * 50 * u;
    d += ` A ${r.toFixed(1)} ${(r * 0.8).toFixed(1)} 0 0 1 ${(x - 2 * r).toFixed(1)} ${ny.toFixed(1)}`;
    x -= 2 * r;
    y = ny;
    k++;
  }
  return d + ` L -10 ${y.toFixed(1)} Z`;
};

/** midpoint-displacement polyline */
const bolt = (seed: number, x0: number, y0: number, x1: number, y1: number, levels: number, disp: number) => {
  let pts: [number, number][] = [
    [x0, y0],
    [x1, y1],
  ];
  let d = disp;
  for (let l = 0; l < levels; l++) {
    const next: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = -(b[1] - a[1]) / len;
      const ny = (b[0] - a[0]) / len;
      const off = (hash01(seed, l, i, 1) - 0.5) * 2 * d * len;
      next.push(a, [(a[0] + b[0]) / 2 + nx * off, (a[1] + b[1]) / 2 + ny * off]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    d *= 0.92;
  }
  return pts;
};

const LightningFlash: React.FC<Props> = ({background, backdrop, strikes, sheetFlashes, holdFrames, decay, doubleStrike, rain, boltColor, glowColor, flashColor, shake, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const t = frame / fps;
  const overlay = isTransparent(background);
  const scene = backdrop && !overlay;
  const hz = h * (portrait ? 0.7 : 0.72);

  const env1 = (s: number) => {
    const d = frame - s;
    if (d < 0) return 0;
    if (d < holdFrames) return 1;
    return Math.exp(-(d - holdFrames) / (decay * fps));
  };
  let lit = 0;
  let strikeFrame = false;
  let active = -1;
  strikes.forEach((s, k) => {
    let e = env1(s);
    if (doubleStrike) e = Math.max(e, 0.6 * env1(s + holdFrames + 3));
    if (e > lit) {
      lit = e;
      active = k;
    }
    const d = frame - s;
    if ((d >= 0 && d < holdFrames) || (doubleStrike && d >= holdFrames + 3 && d < holdFrames * 2 + 3)) strikeFrame = true;
  });
  // distant sheet lightning: cloud-only flicker, no bolt
  let sheet = 0;
  (sheetFlashes ?? []).forEach((s) => {
    sheet = Math.max(sheet, 0.35 * env1(s), 0.25 * env1(s + 4));
  });
  const boltLit = lit;
  lit = Math.max(lit, sheet);
  if (lit < 0.004) lit = 0;

  // bolt geometry for the active strike
  let boltEl: React.ReactNode = null;
  if (active >= 0 && boltLit > 0) {
    const s = strikes[active];
    const d = frame - s;
    const bs = seed * 101 + active * 17;
    const x0 = (0.12 + 0.24 * hash01(bs, 1)) * w * (portrait ? 1.2 : 1);
    const x1 = x0 + (hash01(bs, 2) - 0.4) * 0.22 * w;
    const main = bolt(bs, x0, h * 0.2, x1, hz - 30 * u, 7, 0.2);
    const reveal = Math.min(1, (d + 1) / 2);
    const vis = d < holdFrames + 6 || (doubleStrike && d >= holdFrames + 3 && d < holdFrames + 9) ? Math.min(1, boltLit * 1.6) : 0;
    if (vis > 0.02) {
      const nShow = Math.max(2, Math.floor(main.length * reveal));
      const mainD = 'M' + main.slice(0, nShow).map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L');
      const branches: string[] = [];
      for (let b = 0; b < 4; b++) {
        const idx = Math.floor((0.15 + 0.6 * hash01(bs, b, 3)) * main.length);
        if (idx >= nShow) continue;
        const [bx, by] = main[idx];
        const dir = hash01(bs, b, 4) < 0.5 ? -1 : 1;
        const L = (0.12 + 0.18 * hash01(bs, b, 5)) * h;
        const br = bolt(bs + b * 7, bx, by, bx + dir * L * 0.7, by + L, 5, 0.25);
        branches.push('M' + br.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L'));
      }
      boltEl = (
        <g opacity={vis} strokeLinejoin="round" strokeLinecap="round" fill="none">
          <g filter="url(#lf-glow)">
            <path d={mainD} stroke={glowColor} strokeWidth={16 * u} opacity={0.7} />
            <path d={branches.join('')} stroke={glowColor} strokeWidth={8 * u} opacity={0.5} />
          </g>
          <path d={branches.join('')} stroke={boltColor} strokeWidth={1.6 * u} opacity={0.85} />
          <path d={mainD} stroke={boltColor} strokeWidth={3.4 * u} />
        </g>
      );
    }
  }
  const sh = strikeFrame ? shake * u : lit * shake * 0.4 * u;
  const sx = sh * (hash01(seed, frame, 1) - 0.5) * 2;
  const sy = sh * (hash01(seed, frame, 2) - 0.5) * 2;

  return (
    <AbsoluteFill style={{background: overlay ? 'transparent' : background}}>
      <AbsoluteFill style={{transform: `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(1.01)`}}>
        <Svg>
          <defs>
            <BlurFilter id="lf-glow" std={7 * u} />
            <linearGradient id="lf-room" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE2A8" stopOpacity={0.5} />
              <stop offset="1" stopColor="#6B3A18" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          {(['sky', 'bolt', 'clouds', 'land'] as const).map((part) =>
            part === 'bolt' ? (
              <React.Fragment key={part}>{boltEl}</React.Fragment>
            ) : scene ? (
              <g key={part}>
                <Scene p={NIGHT} id={`lfn-${part}`} seed={seed} windowGlow={0.5 + 0.5 * Math.sin(t * 3)} part={part} />
                {lit > 0 && (
                  <g opacity={lit}>
                    <Scene p={LIT} id={`lfl-${part}`} seed={seed} windowGlow={1} part={part} />
                  </g>
                )}
              </g>
            ) : null,
          )}
          {rain && <RainField t={t} w={w} h={h} u={u} seed={seed} angle={10} color={lit > 0.3 ? '#F4E6F2' : '#B8C6D6'} density={0.9} opacityScale={0.8 + 1.6 * lit} />}
        </Svg>
      </AbsoluteFill>
      {!scene && lit > 0 && <AbsoluteFill style={{background: flashColor, opacity: 0.45 * lit, mixBlendMode: 'screen'}} />}
      {strikeFrame && <AbsoluteFill style={{background: '#ffffff', opacity: 0.15 * lit}} />}
    </AbsoluteFill>
  );
};

export const lightningFlash = defineMotion<Props>({
  id: 'lightning-flash',
  title: 'Lightning flash relight',
  category: 'environment',
  description: 'A rainy night house scene is relit by lightning: a forked bolt draws on, the frame flashes to a pink storm-lit plate for 2 frames and decays back to night in ~0.3 s; repeatable, with double strikes. Overlay-capable.',
  source: ['video16 52.72-53.20, 80.72-81.10'],
  useFor: 'Drama, shock, revelation or horror punctuation; a storm establishing shot; overlay the flash + bolt on any night footage.',
  durationInFrames: 150,
  defaultProps: {
    background: '#04080F',
    backdrop: true,
    strikes: [28, 104],
    sheetFlashes: [66],
    holdFrames: 2,
    decay: 0.1,
    doubleStrike: true,
    rain: true,
    boltColor: '#FFFFFF',
    glowColor: '#C9A8FF',
    flashColor: '#E8C6E0',
    shake: 6,
    seed: 1,
  },
  propDocs: {
    background: 'CSS background; "transparent" = overlay (bolt + screen flash + rain only)',
    backdrop: 'paint the night house scene and its lit plate',
    strikes: 'frames where lightning strikes',
    sheetFlashes: 'frames of distant cloud-only flickers (no bolt, ~0.35 intensity)',
    holdFrames: 'frames the flash holds at full brightness',
    decay: 'exponential decay time constant in seconds (0.1 = source)',
    doubleStrike: 'second flash 3 frames after the hold at 0.6 intensity',
    rain: 'rain streaks (brighten during the flash)',
    boltColor: 'bolt core colour',
    glowColor: 'bolt glow colour',
    flashColor: 'overlay-mode flash tint',
    shake: 'camera jolt in px on strike frames',
    seed: 'random seed (changes bolt shapes)',
  },
  component: LightningFlash,
  tags: ['weather', 'storm', 'lightning', 'night', 'flash', 'drama', 'overlay'],
});
