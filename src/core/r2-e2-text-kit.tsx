import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from './ease';
import {fonts} from './fonts';
import {rng} from './random';
import {Svg, useStage} from './stage';
import {back} from './r2-e2-kit';
import {TFont, estWidth, tfonts} from './text-kit';

/**
 * Round-2 group E2 text helpers: comic-burst 'telop' verdict words, typewriter-signature 'decode' scramble,
 * end-card CTA button. Pure functions of the frame.
 * Telop look adapted from lemo-opuscar styles/game-show (MIT, LemoLab) — see THIRD_PARTY_NOTICES.md.
 */

/* ------------------------------------------------------------------ comic-burst telop */

export interface TelopBurst {
  text: string;
  at: number;
  x: number;
  y: number;
  palette?: string;
  rotate?: number;
  size?: number;
  life?: number;
}

const TELOP_FILL: Record<string, string> = {pink: '#FF5FA2', yellow: '#FFD93A', white: '#FFFFFF', cyan: '#55D6FF', green: '#41E09F'};

/** star + ring + speed-line burst, t = 0..1 */
const StarRingBurst: React.FC<{cx: number; cy: number; R: number; t: number; ink: string; fill: string; seed: string; u: number}> = ({cx, cy, R, t, ink, fill, seed, u}) => {
  if (t <= 0 || t >= 1) return null;
  const e = ease.out(t);
  const star = Array.from({length: 16}, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rr = (i % 2 ? 0.55 : 1) * R * (0.4 + 0.6 * e);
    return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
  }).join(' ');
  const r = rng(seed);
  return (
    <g opacity={1 - t * t}>
      <polygon points={star} fill={fill} stroke={ink} strokeWidth={4 * u} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={R * (0.5 + 0.9 * e)} fill="none" stroke="#ffffff" strokeWidth={8 * u * (1 - t)} />
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2 + (r() - 0.5) * 0.1;
        const r0 = R * (0.9 + 0.5 * e);
        const r1 = r0 + R * 0.5 * (1 - t);
        return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={ink} strokeWidth={6 * u} strokeLinecap="round" />;
      })}
    </g>
  );
};

export const TelopMode: React.FC<{bursts: TelopBurst[]; outline: string; angle: number; strokeRatio: number; tagCorner: boolean; skewDeg: number}> = ({bursts, outline, angle, strokeRatio, tagCorner, skewDeg}) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  return (
    <Svg>
      {bursts.map((b, i) => {
        const lf = frame - b.at;
        if (lf < 0) return null;
        const life = b.life ?? 40;
        const fs = Math.min(w, h) * 0.12 * (b.size ?? 1);
        const fill = TELOP_FILL[b.palette ?? 'yellow'] ?? '#FFD93A';
        const pop = back(prog(lf, 0, 7.5, (x) => x), 1.8);
        const drift = ease.out(clamp(lf / life)) * -20 * u;
        const fade = 1 - prog(lf, life - 6, life, ease.in);
        // tag: after the hold the word shrinks into the top-left corner and stays as a small tag
        const tagT = tagCorner ? prog(lf, life, life + 10, ease.inOut) : 0;
        if (!tagCorner && lf > life) return null;
        const sx = lerp(b.x * w, w * 0.04 + (b.text.length * fs * 0.62 * 0.25) / 2, tagT);
        const sy = lerp(b.y * h + drift, h * 0.06, tagT);
        const sc = lerp(pop, 0.25, tagT);
        const op = tagCorner ? 1 : fade;
        const rot = (b.rotate ?? angle) * 1;
        return (
          <g key={i} opacity={op}>
            <StarRingBurst cx={b.x * w} cy={b.y * h} R={fs * 1.5} t={clamp(lf / 9)} ink={outline} fill={fill} seed={`telop${i}-${Math.floor(lf / 2)}`} u={u} />
            <g transform={`translate(${sx} ${sy}) rotate(${rot}) skewX(${skewDeg}) scale(${sc})`}>
              <text textAnchor="middle" y={fs * 0.35} fontFamily={fonts.display} fontSize={fs} fill={fill} stroke={outline} strokeWidth={fs * strokeRatio} strokeLinejoin="round" paintOrder="stroke" style={{paintOrder: 'stroke'}}>
                {b.text}
              </text>
            </g>
          </g>
        );
      })}
    </Svg>
  );
};

/* ------------------------------------------------------------------ typewriter decode */

export const DECODE_POOL = '[]{}|\\/#*&%@^<>!abcdefghijklmnopqrstuvwxyz0123456789';

/** rank (resolution order) of every character */
export const decodeRanks = (n: number, direction: string, seed: number) => {
  const idx = Array.from({length: n}, (_, i) => i);
  let order: number[];
  if (direction === 'center-out') order = idx.slice().sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2) || a - b);
  else if (direction === 'random') {
    const r = rng(`dec${seed}`);
    order = idx.slice().sort(() => r() - 0.5);
  } else order = idx;
  const rank = new Array<number>(n);
  order.forEach((ci, k) => (rank[ci] = k));
  return rank;
};

/** glyph shown for char i at frame f: the real one if resolved, else a re-seeded pool glyph */
export const decodeGlyph = (c: string, i: number, f: number, resolvedCount: number, rank: number, reseed: number, pool: string, band = 3) => {
  if (c === ' ') return {g: c, band: false, resolved: true};
  if (rank < resolvedCount) return {g: c, band: false, resolved: true};
  const r = rng(`dg${i}-${Math.floor(f / Math.max(1, reseed))}`);
  return {g: pool[Math.floor(r() * pool.length)], band: rank < resolvedCount + band, resolved: false};
};

/* ------------------------------------------------------------------ neon script strike */

/**
 * A script neon word traced on as unlit glass with only a hot head moving along it, then the whole tube
 * strikes on with a ballast flicker envelope and settles humming. Floats over a scene (no plate) or on a wall.
 * Idea from mg-styles-15 neon-script-strike (MIT) — see THIRD_PARTY_NOTICES.md.
 */
export const NeonScript: React.FC<{
  text: string;
  color: string;
  glow: string;
  font: TFont;
  traceAt: number;
  traceFrames: number;
  envelope: number[];
  glassColor: string;
  rotation: number;
  wall: string;
  noPlate: boolean;
}> = ({text, color, glow, font, traceAt, traceFrames, envelope, glassColor, rotation, wall, noPlate}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const maxW = w * (portrait ? 0.86 : 0.7);
  let fs = 220 * u;
  const est = estWidth(text, fs, font, 0.02);
  if (est > maxW) fs = (fs * maxW) / est;
  const tw = Math.min(maxW, estWidth(text, fs, font, 0.02));
  const trace = prog(frame, traceAt, traceAt + traceFrames, (x) => x);
  const hit = traceAt + traceFrames;
  const k = frame - hit;
  let lit = 0;
  if (k >= 0) lit = k < envelope.length ? envelope[k] : 0.97 + 0.03 * Math.sin(frame * 1.7);
  const hum = k >= envelope.length ? 1 : 0;
  const pad = fs * 0.35;
  const headX = tw * trace;
  const baseStyle: React.CSSProperties = {fontFamily: tfonts[font], fontWeight: font === 'hand' ? 700 : 400, fontSize: fs, lineHeight: 1, whiteSpace: 'pre', letterSpacing: '0.02em'};
  const g = clamp(lit);
  return (
    <div style={{position: 'absolute', inset: 0, background: noPlate ? 'transparent' : wall}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)`}}>
        <div style={{position: 'relative', width: tw + pad * 2, height: fs * 1.3, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {/* unlit glass */}
          <div style={{...baseStyle, position: 'absolute', color: 'transparent', WebkitTextStroke: `${2 * u}px ${glassColor}`, opacity: 0.9}}>{text}</div>
          {/* traced tube */}
          <div style={{position: 'absolute', clipPath: `inset(-20% ${tw + pad * 2 - (pad + tw * trace)}px -20% 0)`, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{...baseStyle, color: '#FFE6F8', WebkitTextStroke: `${1.5 * u}px ${color}`, textShadow: `0 0 ${5 * u}px ${color}, 0 0 ${14 * u}px ${glow}`, opacity: k >= 0 ? 0 : 0.95}}>{text}</div>
          </div>
          {/* struck tube: three fills */}
          {k >= 0 && (
            <div style={{position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', left: 0, right: 0, top: 0, bottom: 0, opacity: g}}>
              <div style={{...baseStyle, color: '#FFE6F8', WebkitTextStroke: `${1.4 * u}px ${color}`, textShadow: `0 0 ${3 * u}px #fff, 0 0 ${8 * u}px ${color}, 0 0 ${34 * u * (0.85 + 0.15 * hum)}px ${glow}, 0 0 ${70 * u}px ${glow}`}}>{text}</div>
            </div>
          )}
          {/* hot head */}
          {trace > 0 && trace < 1 && (
            <div style={{position: 'absolute', left: pad + headX - 34 * u, top: '50%', width: 68 * u, height: 68 * u, marginTop: -34 * u, borderRadius: '50%', background: `radial-gradient(circle, #ffffff 0%, ${glow} 45%, rgba(0,0,0,0) 70%)`, opacity: 0.9}} />
          )}
        </div>
      </div>
    </div>
  );
};
