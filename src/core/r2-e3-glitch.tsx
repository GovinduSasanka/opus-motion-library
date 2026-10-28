import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {clamp} from './ease';
import {fonts} from './fonts';
import {resolveSrc} from './asset';
import {n2} from './random';
import {useStage} from './stage';

/** glitch-image round-2 pieces (group E3): the soft 1990s camcorder-tape look and the code-fill silhouette mode. */

export type VhsOpts = {
  frame: number;
  jitter: number;
  chromaShift: number;
  edgeRing: number;
  agcNoise: number;
  dropouts: number;
  tapeFps: number;
  trackingTearAt: number[];
  aspect: '4:3' | 'full';
};

/** wraps the picture: chroma smear + shifted chroma, edge halos, wobble, head-switching band, dropouts, 4:3 pillarbox */
export const VhsWrap: React.FC<VhsOpts & {children: React.ReactNode}> = ({frame, jitter, chromaShift, edgeRing, agcNoise, dropouts, tapeFps, trackingTearAt, aspect, children}) => {
  const {w, h, u, fps} = useStage();
  const step = Math.floor((frame * Math.max(1, tapeFps)) / fps);
  const tf = Math.round((step * fps) / Math.max(1, tapeFps));
  const rr = (k: string) => random(`vhs-${step}-${k}`);
  const jx = (rr('jx') - 0.5) * 2 * jitter * u * 3;
  let tear = 0;
  for (const at of trackingTearAt) {
    const k = (frame - at) / 8;
    if (k >= 0 && k <= 1) tear = Math.max(tear, Math.sin(Math.PI * k));
  }
  const cs = chromaShift * u;
  const bandH = h * 0.06;
  const bar = aspect === '4:3' && w / h > 4 / 3 ? (w - h * (4 / 3)) / 2 : 0;
  const drops: React.ReactNode[] = [];
  const nDrop = Math.round(dropouts * 5 * (rr('nd') < 0.5 ? 1 : 0.2));
  for (let i = 0; i < nDrop; i++) {
    const y = rr(`dy${i}`) * h;
    const x = rr(`dx${i}`) * w;
    const len = (20 + rr(`dl${i}`) * 120) * u;
    drops.push(<rect key={i} x={x} y={y} width={len} height={Math.max(1.5, 2.2 * u)} fill="#fff" opacity={0.55 + 0.4 * rr(`do${i}`)} />);
  }
  const noiseRows: React.ReactNode[] = [];
  for (let i = 0; i < Math.round(26 * agcNoise); i++) {
    const y = rr(`ny${i}`) * h;
    noiseRows.push(<rect key={i} x={0} y={y} width={w} height={(0.6 + rr(`nh${i}`) * 2) * u} fill={rr(`nc${i}`) < 0.7 ? '#000' : '#fff'} opacity={0.12 + 0.18 * rr(`no${i}`)} />);
  }
  void tf;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="vhsF" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={`${0.9 * u} ${0.5 * u}`} result="soft" />
            <feColorMatrix in="soft" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={cs} dy={0} result="rS" />
            <feColorMatrix in="soft" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
            <feComposite in="rS" in2="gb" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="split" />
            <feConvolveMatrix in="SourceGraphic" order="3" kernelMatrix={`0 ${-edgeRing * 0.5} 0  ${-edgeRing * 0.5} ${1 + 2 * edgeRing} ${-edgeRing * 0.5}  0 ${-edgeRing * 0.5} 0`} preserveAlpha="true" result="sharp" />
            <feComposite in="split" in2="sharp" operator="arithmetic" k1="0" k2="0.62" k3="0.38" k4="0.045" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: 'url(#vhsF) saturate(0.88) contrast(0.92)', transform: `translateX(${jx}px)`}}>{children}</AbsoluteFill>
      {tear > 0.01 && (
        <AbsoluteFill style={{transform: `translateX(${tear * w * 0.05 * (rr('tx') - 0.3)}px)`, clipPath: `inset(${(0.35 + 0.3 * rr('ty')) * 100}% 0 ${(0.3 - 0.25 * rr('ty')) * 100}% 0)`}}>
          <AbsoluteFill style={{filter: 'url(#vhsF) saturate(0.7) brightness(1.2)'}}>{children}</AbsoluteFill>
        </AbsoluteFill>
      )}
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        {noiseRows}
        {drops}
        <rect x={0} y={h - bandH} width={w} height={bandH} fill="#000" opacity={0.28} />
        {Array.from({length: 14}, (_, i) => (
          <rect key={i} x={(rr(`hx${i}`) * 0.2) * w * (i % 2 ? 1 : -1) + (i % 2 ? 0 : 0)} y={h - bandH + (i / 14) * bandH} width={w} height={Math.max(1, 1.5 * u)} fill="#fff" opacity={0.08 + 0.1 * rr(`ho${i}`)} />
        ))}
        {bar > 0 && (
          <g>
            <rect x={0} y={0} width={bar} height={h} fill="#000" />
            <rect x={w - bar} y={0} width={bar} height={h} fill="#000" />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- silhouette */
const CODE = [
  'const brand = await load("mark");',
  'for (const p of poses) render(p);',
  'export default function Sting() {',
  'if (beat) emit(burst, seed++);',
  'fn glitch(x) => x ^ (x >> 3)',
  'return tiles.map(t => t.fill);',
  'while(live){ step(); draw(); }',
  '<svg><path d="M0 0L9 9Z"/></svg>',
];

export const SilhouetteScene: React.FC<{
  frame: number;
  src: string;
  color: string;
  textFill: string;
  bursts: number[];
  poses: {rot?: number; sx?: number; sy?: number; dx?: number}[];
  caption: string;
  seed: number;
}> = ({frame, src, color, textFill, bursts, poses, caption, seed}) => {
  const {w, h, u, fps} = useStage();
  const k = fps / 30;
  const stepF = Math.floor(frame / Math.max(1, Math.round(3.5 * k)));
  const pose = poses.length ? poses[stepF % poses.length] : {rot: ((stepF * 37) % 5) - 2, sx: 1 + (((stepF * 13) % 5) - 2) * 0.012, sy: 1 + (((stepF * 7) % 5) - 2) * 0.012, dx: (((stepF * 11) % 5) - 2) * 0.004};
  const sh = h * 0.46;
  const cx = w * (w > h ? 0.7 : 0.5);
  const cy = h * (w > h ? 0.5 : 0.42);
  const scroll = (frame * 1.4 * u) % (22 * u * 8) - 22 * u * 8;
  const col2 = '#2A2AF0';
  // generic bold emblem (a faceted arrowhead over a ring) as the default silhouette
  const emblem = (
    <g>
      <circle cx={0} cy={sh * 0.08} r={sh * 0.34} />
      <path d={`M ${-sh * 0.1} ${-sh * 0.5} L ${sh * 0.4} ${sh * 0.46} L ${sh * 0.05} ${sh * 0.32} L ${-sh * 0.36} ${sh * 0.5} Z`} />
      <rect x={-sh * 0.08} y={-sh * 0.52} width={sh * 0.16} height={sh * 0.28} rx={sh * 0.04} />
    </g>
  );
  const img = src ? resolveSrc(src) : '';
  const lines = Array.from({length: 52}, (_, i) => CODE[(i * 3 + seed) % CODE.length]);
  // tile bursts
  const tiles: React.ReactNode[] = [];
  for (const b of bursts) {
    const a = frame - b;
    if (a < 0 || a > 4 * k) continue;
    const sd = Math.floor(a / (1.5 * k));
    for (let i = 0; i < 14; i++) {
      const r = (q: string) => random(`tl${seed}-${b}-${sd}-${i}-${q}`);
      const tw = (0.03 + 0.12 * r('w')) * w;
      const th = tw * (0.25 + 0.5 * r('h'));
      const x = cx + (r('x') - 0.5) * sh * 1.7;
      const y = cy + (r('y') - 0.5) * sh * 1.3;
      const c = r('c') < 0.1 ? '#E83FD2' : r('c') < 0.18 ? '#2BE37A' : r('c') < 0.7 ? color : col2;
      tiles.push(
        <g key={`${b}-${i}`}>
          <rect x={x} y={y} width={tw} height={th} fill={c} />
          <text x={x + 4 * u} y={y + th * 0.7} fontFamily={fonts.mono} fontSize={Math.min(th * 0.6, 16 * u)} fill="#fff" opacity={0.9} style={{whiteSpace: 'pre'}}>
            {CODE[Math.floor(r('t') * CODE.length)].slice(0, Math.max(3, Math.floor(tw / (9 * u))))}
          </text>
        </g>,
      );
    }
  }
  const nCap = Math.max(0, Math.floor(((frame - 6) / fps) * 16));
  const typedCap = caption.slice(0, nCap);
  const cursor = Math.floor(frame / (fps / 4)) % 2 === 0 || nCap < caption.length;
  const rotJ = (pose.rot ?? 0) + n2('sil' + seed, frame * 0.2, 0) * 0.4;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id="silG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={col2} />
          </linearGradient>
          <mask id="silM" maskUnits="userSpaceOnUse" x={-sh} y={-sh} width={sh * 2} height={sh * 2} style={{maskType: 'alpha'}}>
            {src ? <image href={img} x={-sh / 2} y={-sh / 2} width={sh} height={sh} preserveAspectRatio="xMidYMid meet" /> : <g fill="#fff">{emblem}</g>}
          </mask>
          <clipPath id="silC">
            <rect x={-sh} y={-sh} width={sh * 2} height={sh * 2} />
          </clipPath>
        </defs>
        <g transform={`translate(${cx + (pose.dx ?? 0) * w} ${cy}) rotate(${rotJ}) scale(${pose.sx ?? 1} ${pose.sy ?? 1})`}>
          <g mask="url(#silM)">
            <rect x={-sh} y={-sh} width={sh * 2} height={sh * 2} fill="url(#silG)" />
            <g clipPath="url(#silC)">
              {lines.map((ln, i) => (
                <text key={i} x={-sh * 0.7 + ((i * 53) % 90) * u} y={-sh + i * 22 * u + scroll} fontFamily={fonts.mono} fontSize={14 * u} fill={textFill} opacity={0.5} style={{whiteSpace: 'pre'}}>
                  {ln}
                </text>
              ))}
            </g>
          </g>
        </g>
        {tiles}
        <text x={w * (w > h ? 0.12 : 0.1)} y={h * (w > h ? 0.5 : 0.82)} fontFamily={fonts.mono} fontSize={Math.min(h * 0.035, w * 0.05)} fill="#fff" letterSpacing={2 * u}>
          {typedCap}
          {cursor ? '_' : ''}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

void clamp;
