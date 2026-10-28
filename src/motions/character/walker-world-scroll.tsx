import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {CHIBI_SKINS, Chibi, ChibiPose, chibiWalk, mixHex} from '../../core/character-kit';
import {fonts} from '../../core/fonts';
import {fbm, n2, rng} from '../../core/random';
import {FilmGrain, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video14 "Walk Through Art History": a chibi explorer pinned at 37.5 % W walks in place while a strip of
 * era panels scrolls past with eased stop-and-go (decel ≈0.75 s ease-out, hold, accel ≈0.4 s ease-in).
 * Eras are joined by decorated torn seams; as a seam crosses the hero he is drawn twice, clipped at the seam
 * (old style left, new style right), a confetti burst in the new palette fires and the era badge crossfades.
 */
type EraStyle = 'cave' | 'egypt' | 'greek' | 'ink' | 'pixel' | 'vaporwave';
type Era = {style: EraStyle; label: string; year: string};
type Props = {
  eras: Era[];
  speed: number;
  stopFrames: number;
  eraWidth: number;
  stopAt: number;
  heroX: number;
  gags: boolean;
  badge: boolean;
  confettiCount: number;
  grain: boolean;
};

type Ctx = {x0: number; W: number; w: number; h: number; by: number; u: number; frame: number; i: number; pl: number; pr: number};
type Pt = [number, number];

const PALETTE: Record<EraStyle, string[]> = {
  cave: ['#C8402A', '#895839', '#DABB97', '#F0B860', '#342013'],
  egypt: ['#B8452F', '#2F5D87', '#3F8A5A', '#E2B33C', '#463C55'],
  greek: ['#1B100A', '#DB6930', '#F3C39A', '#1B100A'],
  ink: ['#1A1714', '#B8322A', '#827867', '#1A1714'],
  pixel: ['#3FB27F', '#F8B800', '#E83A3A', '#2C6BE0', '#FFFFFF'],
  vaporwave: ['#FF3DF0', '#01CDFE', '#FFFB96', '#B967FF', '#FF71CE'],
};

// ------------------------------------------------------------------ seams
const seamShape = (style: EraStyle, y: number, u: number, seed: number) => {
  const s = `seam${seed}`;
  switch (style) {
    case 'egypt':
      return Math.sin((2 * Math.PI * y) / (180 * u) + seed) * 25 * u + n2(s, y * 0.01 / u, 0) * 6 * u;
    case 'greek': {
      const t = (y / (36 * u)) % 1;
      return (t < 0.5 ? t : 1 - t) * 28 * u + fbm(s, y * 0.004 / u, 0, 2) * 18 * u;
    }
    case 'pixel':
      return Math.round((fbm(s, Math.floor(y / (24 * u)) * 0.15, 0, 2) * 34 * u) / (12 * u)) * 12 * u;
    case 'vaporwave':
      return Math.sin(y / (90 * u) + seed) * 10 * u;
    case 'ink':
      return fbm(s, y * 0.006 / u, 0, 3) * 28 * u + n2(s + 'h', y * 0.08 / u, 0) * 9 * u;
    default:
      return fbm(s, y * 0.006 / u, 0, 3) * 25 * u + n2(s + 'h', y * 0.06 / u, 0) * 6 * u;
  }
};
const seamPoints = (style: EraStyle, worldX: number, offset: number, h: number, u: number, seed: number): Pt[] => {
  const step = style === 'pixel' ? 24 * u : 6 * u;
  const pts: Pt[] = [];
  for (let y = -20 * u; y <= h + 20 * u; y += step) {
    const x = worldX - offset + seamShape(style, y, u, seed);
    if (style === 'pixel' && pts.length) pts.push([x, pts[pts.length - 1][1] + 0.001]);
    pts.push([x, y]);
  }
  return pts;
};
const ptsD = (pts: Pt[]) => 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ');

const SeamDeco: React.FC<{style: EraStyle; pts: Pt[]; u: number; i: number}> = ({style, pts, u, i}) => {
  const d = ptsD(pts);
  const shadow = <path d={d} fill="none" stroke="#000" strokeWidth={10 * u} opacity={0.15} transform={`translate(${5 * u},0)`} filter={`url(#wws-sblur)`} />;
  switch (style) {
    case 'egypt':
      return (
        <g>
          {shadow}
          <path d={d} fill="none" stroke="#463C55" strokeWidth={24 * u} />
          {PALETTE.egypt.slice(0, 4).map((c, k) => (
            <path key={k} d={d} fill="none" stroke={c} strokeWidth={18 * u} strokeDasharray={`${11 * u} ${33 * u}`} strokeDashoffset={-k * 11 * u} />
          ))}
        </g>
      );
    case 'greek':
      return (
        <g>
          {shadow}
          <path d={d} fill="none" stroke="#1B100A" strokeWidth={14 * u} strokeLinejoin="miter" />
        </g>
      );
    case 'ink':
      return (
        <g>
          {shadow}
          <path d={d} fill="none" stroke="#F4EEDF" strokeWidth={14 * u} filter="url(#wws-fiber)" />
          <path d={d} fill="none" stroke="#CDBEA1" strokeWidth={2 * u} transform={`translate(${-6 * u},0)`} opacity={0.8} />
        </g>
      );
    case 'pixel':
      return (
        <g>
          <path d={d} fill="none" stroke="#0B0822" strokeWidth={14 * u} />
          <path d={d} fill="none" stroke="#3FB27F" strokeWidth={6 * u} />
        </g>
      );
    case 'vaporwave':
      return (
        <g>
          <path d={d} fill="none" stroke="#FF3DF0" strokeWidth={14 * u} filter="url(#wws-glow)" />
          <path d={d} fill="none" stroke="#FFC6FA" strokeWidth={4 * u} />
        </g>
      );
    default:
      return (
        <g>
          {shadow}
          <path d={d} fill="none" stroke="#5A3A22" strokeWidth={8 * u} filter="url(#wws-fiber)" />
        </g>
      );
  }

};

// ------------------------------------------------------------------ era panels
const handPath = (s: number) => {
  // palm + 4 fingers + thumb, pointing up, centred at palm
  const f = (x: number, len: number, a: number) => {
    const rad = (a * Math.PI) / 180;
    const x1 = x + Math.sin(rad) * len;
    const y1 = -18 * s - Math.cos(rad) * len;
    return `M ${x} ${-14 * s} L ${x1} ${y1}`;
  };
  return [f(-11 * s, 30 * s, -10), f(-3.5 * s, 37 * s, -3), f(4 * s, 35 * s, 4), f(11 * s, 27 * s, 12), `M ${-16 * s} ${0} L ${-34 * s} ${-14 * s}`].join(' ');
};

const CavePanel: React.FC<Ctx> = ({x0, W, h, by, u, frame, i, pl, pr}) => {
  const r = rng(100 + i);
  const animals = [
    {x: 0.18, y: 0.36, s: 1.05, c: '#6E4128', k: 'bison'},
    {x: 0.62, y: 0.3, s: 0.85, c: '#7A4A2C', k: 'bison'},
    {x: 0.4, y: 0.47, s: 0.6, c: '#B9834B', k: 'horse'},
    {x: 0.86, y: 0.5, s: 0.55, c: '#C89058', k: 'horse'},
  ];
  const hands = [0.08, 0.33, 0.55, 0.78].map((f, k) => ({x: x0 + f * W, y: by - (0.16 + 0.05 * (k % 2)) * by}));
  return (
    <g>
      <defs>
        <linearGradient id={`wws-cave${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A57E" />
          <stop offset="55%" stopColor="#DABB97" />
          <stop offset="100%" stopColor="#A87A52" />
        </linearGradient>
        <filter id={`wws-cavetex${i}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.012 / u} numOctaves={4} seed={i + 2} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 1.4 -0.55" />
        </filter>
        <filter id={`wws-rough${i}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.05 / u} numOctaves={2} seed={i} />
          <feDisplacementMap in="SourceGraphic" scale={7 * u} />
        </filter>
        <linearGradient id={`wws-cavefloor${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A2E1A" />
          <stop offset="100%" stopColor="#24150B" />
        </linearGradient>
      </defs>
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={by} fill={`url(#wws-cave${i})`} />
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={by} filter={`url(#wws-cavetex${i})`} opacity={0.55} />
      {Array.from({length: 7}, (_, k) => {
        let x = x0 + r() * W;
        let y = r() * by * 0.5;
        let d = `M ${x} ${y}`;
        for (let j = 0; j < 6; j++) {
          x += (r() - 0.5) * 80 * u;
          y += (20 + r() * 50) * u;
          d += ` L ${x} ${y}`;
        }
        return <path key={k} d={d} fill="none" stroke="#5A3E28" strokeWidth={1.4 * u} opacity={0.45} />;
      })}
      <g filter={`url(#wws-rough${i})`}>
        {animals.map((a, k) => {
          const s = a.s * u * 1.15;
          const ax = x0 + a.x * W;
          const ay = by * a.y;
          return a.k === 'bison' ? (
            <g key={k} transform={`translate(${ax},${ay}) scale(${s})`} opacity={0.88}>
              {[-60, -30, 40, 66].map((lx, j) => (
                <line key={j} x1={lx} y1={-6} x2={lx + (j % 2 ? 4 : -4)} y2={42} stroke="#3A2214" strokeWidth={9} strokeLinecap="round" />
              ))}
              <path d="M -90 -10 C -100 -50 -70 -95 -20 -90 C 10 -110 60 -100 80 -70 C 100 -50 100 -20 85 -5 C 70 5 -70 5 -90 -10 Z" fill={a.c} stroke="#3A2214" strokeWidth={4} />
              <ellipse cx={96} cy={-38} rx={22} ry={26} fill={mixHex(a.c, '#000', 0.25)} stroke="#3A2214" strokeWidth={4} />
              <path d="M 92 -62 C 100 -88 124 -88 120 -70 M 104 -60 C 116 -80 136 -76 130 -60" fill="none" stroke="#3A2214" strokeWidth={4} strokeLinecap="round" />
              <path d="M -92 -30 C -110 -20 -112 0 -104 12" fill="none" stroke="#3A2214" strokeWidth={4} />
              {[0, 1, 2, 3, 4].map((j) => (
                <circle key={j} cx={-40 + j * 22} cy={-40 - (j % 2) * 14} r={3.5} fill="#2A180C" />
              ))}
              <circle cx={104} cy={-42} r={3} fill="#F2E2C8" />
            </g>
          ) : (
            <g key={k} transform={`translate(${ax},${ay}) scale(${s})`} opacity={0.88}>
              {[-50, -32, 30, 46].map((lx, j) => (
                <line key={j} x1={lx} y1={-8} x2={lx + (j % 2 ? 6 : -6)} y2={36} stroke="#5A3418" strokeWidth={5} strokeLinecap="round" />
              ))}
              <path d="M -70 -20 C -70 -45 50 -50 60 -30 C 65 -15 55 -5 40 -5 L -55 -5 C -68 -5 -72 -12 -70 -20 Z" fill={a.c} stroke="#5A3418" strokeWidth={3} />
              <path d="M 45 -35 C 60 -60 80 -75 100 -70 C 108 -66 104 -55 95 -55 C 85 -55 75 -45 62 -22 Z" fill={a.c} stroke="#5A3418" strokeWidth={3} />
              <path d="M 52 -48 C 64 -66 78 -76 92 -76" fill="none" stroke="#3A2214" strokeWidth={6} />
              <path d="M -70 -25 C -86 -20 -92 0 -88 10" fill="none" stroke="#5A3418" strokeWidth={4} />
            </g>
          );
        })}
      </g>
      {hands.map((p, k) => {
        const rr = rng(i * 31 + k);
        const dots = Array.from({length: 110}, () => {
          const a = rr() * Math.PI * 2;
          const rad = Math.sqrt(-2 * Math.log(Math.max(1e-4, rr()))) * 26 * u;
          return [p.x + Math.cos(a) * rad, p.y - 12 * u + Math.sin(a) * rad * 1.2, (1 + rr() * 3) * u] as [number, number, number];
        });
        return (
          <g key={k}>
            {dots.map(([x, y, rad], j) => (
              <circle key={j} cx={x} cy={y} r={rad} fill="#C8402A" opacity={0.75} />
            ))}
            <g transform={`translate(${p.x},${p.y}) rotate(${(k % 2 ? 1 : -1) * 12})`}>
              <ellipse cx={0} cy={0} rx={17 * u} ry={20 * u} fill="#D9B48C" />
              <path d={handPath(u)} stroke="#D9B48C" strokeWidth={8.5 * u} strokeLinecap="round" fill="none" />
            </g>
          </g>
        );
      })}
      {Array.from({length: 22}, (_, k) => (
        <circle key={`d${k}`} cx={x0 + W * 0.12 + k * 14 * u} cy={by * 0.82 - Math.sin(k * 0.4) * 6 * u} r={3.2 * u} fill="#B8382A" opacity={0.8} />
      ))}
      <rect x={x0 - pl} y={by} width={W + pl + pr} height={h - by} fill={`url(#wws-cavefloor${i})`} />
      {Array.from({length: 26}, (_, k) => (
        <ellipse key={`p${k}`} cx={x0 + r() * W} cy={by + (0.08 + r() * 0.85) * (h - by)} rx={(8 + r() * 22) * u} ry={(3 + r() * 6) * u} fill="#6A4428" opacity={0.6} />
      ))}
      {Array.from({length: 18}, (_, k) => {
        const rr = rng(k * 7 + i);
        const x = x0 + rr() * W + Math.sin(frame / 15 + k) * 8 * u;
        const y = by - ((rr() * by * 0.9 + frame * (0.4 + rr() * 0.4) * u) % (by * 0.9));
        return <circle key={`e${k}`} cx={x} cy={y} r={(2 + rr() * 2.5) * u} fill="#FFB65A" opacity={0.4 + 0.5 * Math.abs(Math.sin(frame / 9 + k))} filter="url(#wws-glow)" />;
      })}
    </g>
  );
};

const Goose: React.FC<{x: number; y: number; s: number; flip?: number}> = ({x, y, s, flip = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s * flip},${s})`}>
    <line x1={-4} y1={10} x2={-6} y2={30} stroke="#463C55" strokeWidth={2.5} />
    <line x1={6} y1={10} x2={8} y2={30} stroke="#463C55" strokeWidth={2.5} />
    <path d="M -30 -4 C -26 -16 10 -18 22 -6 C 26 4 14 14 -4 14 C -20 14 -32 8 -40 -2 Z" fill="#EFE6CF" stroke="#463C55" strokeWidth={2.5} />
    <path d="M 18 -8 C 30 -22 24 -40 34 -46" fill="none" stroke="#463C55" strokeWidth={6} strokeLinecap="round" />
    <path d="M 18 -8 C 30 -22 24 -40 34 -46" fill="none" stroke="#EFE6CF" strokeWidth={2.5} strokeLinecap="round" />
    <ellipse cx={37} cy={-46} rx={7} ry={5} fill="#EFE6CF" stroke="#463C55" strokeWidth={2.5} />
    <path d="M 43 -46 L 52 -43 L 43 -42" fill="#D98B3C" stroke="#463C55" strokeWidth={1.5} />
    <path d="M -10 -6 C 0 -2 10 -2 16 -6" fill="none" stroke="#7A8E6A" strokeWidth={2} />
  </g>
);

const EgyptPanel: React.FC<Ctx> = ({x0, W, h, by, u, frame, i, pl, pr}) => {
  const ink = '#463C55';
  const cols = PALETTE.egypt.slice(0, 4);
  const tileW = 16 * u;
  const n = Math.ceil((W + pl + pr) / tileW);
  const fr = by * 0.05;
  const reg = by * 0.56;
  const nile = by + (h - by) * 0.18;
  return (
    <g>
      <defs>
        <pattern id={`wws-nile${i}`} patternUnits="userSpaceOnUse" width={28 * u} height={16 * u}>
          <rect width={28 * u} height={16 * u} fill="#2F5D87" />
          <path d={`M 0 ${10 * u} L ${7 * u} ${4 * u} L ${14 * u} ${10 * u} L ${21 * u} ${4 * u} L ${28 * u} ${10 * u}`} fill="none" stroke="#1E3F66" strokeWidth={2 * u} />
        </pattern>
      </defs>
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={h} fill="#D8C499" />
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={by} fill="#E6D6AE" opacity={0.5} />
      {/* top frieze */}
      <rect x={x0 - pl} y={fr - 6 * u} width={W + pl + pr} height={by * 0.07 + 12 * u} fill={ink} />
      {Array.from({length: n}, (_, k) => (
        <rect key={k} x={x0 - pl + k * tileW + 2 * u} y={fr} width={tileW - 4 * u} height={by * 0.07} rx={5 * u} fill={cols[k % 4]} />
      ))}
      {/* register band */}
      {[0, 1, 2].map((k) => (
        <rect key={k} x={x0 - pl} y={reg + k * 6 * u} width={W + pl + pr} height={5 * u} fill={[cols[0], cols[3], cols[1]][k]} />
      ))}
      {[0, 1, 2].map((k) => (
        <rect key={`b${k}`} x={x0 - pl} y={by - 4 * u + k * 6 * u} width={W + pl + pr} height={5 * u} fill={[cols[1], cols[3], cols[0]][k]} />
      ))}
      {/* winged sun */}
      <g transform={`translate(${x0 + W * 0.66},${by * 0.2})`}>
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M ${-150 * u} ${(4 + k * 9) * u} Q 0 ${(-30 + k * 9) * u} ${150 * u} ${(4 + k * 9) * u}`} fill="none" stroke={[cols[1], cols[2], cols[0]][k]} strokeWidth={8 * u} />
        ))}
        <circle cx={0} cy={-6 * u} r={26 * u} fill="#C8402A" stroke={ink} strokeWidth={3 * u} />
      </g>
      {/* hieroglyph column */}
      <g transform={`translate(${x0 + W * 0.08},${by * 0.16})`}>
        <rect x={-22 * u} y={0} width={44 * u} height={reg - by * 0.2} rx={20 * u} fill="none" stroke={ink} strokeWidth={3 * u} />
        {Array.from({length: 6}, (_, k) => {
          const yy = (28 + k * ((reg - by * 0.2 - 50 * u) / 6 / u)) * u;
          const t = k % 4;
          return t === 0 ? (
            <circle key={k} cx={0} cy={yy} r={8 * u} fill="none" stroke={ink} strokeWidth={3 * u} />
          ) : t === 1 ? (
            <path key={k} d={`M ${-12 * u} ${yy} q ${4 * u} ${-6 * u} ${8 * u} 0 t ${8 * u} 0 t ${8 * u} 0`} fill="none" stroke={cols[1]} strokeWidth={3 * u} />
          ) : t === 2 ? (
            <path key={k} d={`M 0 ${yy - 10 * u} v ${20 * u} M ${-8 * u} ${yy - 2 * u} h ${16 * u}`} stroke={cols[0]} strokeWidth={3 * u} />
          ) : (
            <rect key={k} x={-8 * u} y={yy - 6 * u} width={16 * u} height={12 * u} fill={cols[2]} />
          );
        })}
      </g>
      {[0.32, 0.42, 0.52].map((f, k) => (
        <Goose key={k} x={x0 + W * f} y={reg - 32 * u} s={1.1 * u} flip={1} />
      ))}
      {/* jars + offering table in the lower register */}
      {[0.28, 0.34].map((f, k) => (
        <g key={k} transform={`translate(${x0 + W * f},${by - 8 * u}) scale(${1.15 * u})`}>
          <path d="M -10 -110 L 10 -110 L 8 -100 C 30 -86 28 -24 6 0 L -6 0 C -28 -24 -30 -86 -8 -100 Z" fill="#D98B6A" stroke={ink} strokeWidth={2.5} />
          <line x1={-20} y1={-80} x2={20} y2={-80} stroke={cols[2]} strokeWidth={4} />
          <line x1={-19} y1={-70} x2={19} y2={-70} stroke={cols[1]} strokeWidth={4} />
        </g>
      ))}
      <g transform={`translate(${x0 + W * 0.62},${by - 8 * u}) scale(${1.1 * u})`}>
        <path d="M -40 -70 L 40 -70 M 0 -70 L 0 0 M -18 0 L 18 0" stroke="#C9A43C" strokeWidth={6} />
        {[-24, -8, 8, 24].map((x, k) => (
          <ellipse key={k} cx={x} cy={-80} rx={10} ry={8} fill={['#D98B3C', '#C8402A', '#E2B33C', '#7A8E6A'][k]} stroke={ink} strokeWidth={2} />
        ))}
      </g>
      {/* papyrus */}
      {Array.from({length: 7}, (_, k) => {
        const px = x0 + W * (0.82 + k * 0.022);
        const sway = Math.sin(frame / 20 + k) * 3 * u;
        const top = reg - (60 + (k % 3) * 30) * u;
        return (
          <g key={k}>
            <line x1={px} y1={reg} x2={px + sway} y2={top} stroke="#3F8A5A" strokeWidth={3 * u} />
            <path d={`M ${px + sway} ${top} l ${-14 * u} ${-18 * u} h ${28 * u} Z`} fill="#3F8A5A" />
          </g>
        );
      })}
      {/* Nile */}
      <rect x={x0 - pl} y={nile} width={W + pl + pr} height={h - nile} fill={`url(#wws-nile${i})`} />
      {[0.2, 0.5, 0.78].map((f, k) => {
        const fx = x0 + W * f + Math.sin(frame / 25 + k) * 20 * u;
        const fy = nile + (h - nile) * (0.3 + 0.2 * k);
        return <ellipse key={k} cx={fx} cy={fy} rx={18 * u} ry={7 * u} fill={['#D98B3C', '#9DB4C8', '#E2B33C'][k]} stroke={ink} strokeWidth={2 * u} />;
      })}
    </g>
  );
};

const Warrior: React.FC<{x: number; y: number; s: number; flip: number; inc: string; frame: number}> = ({x, y, s, flip, inc, frame}) => {
  const b = '#1B100A';
  const bob = Math.sin(frame / 12) * 2;
  return (
    <g transform={`translate(${x},${y}) scale(${s * flip},${s})`}>
      <line x1={70} y1={-280 + bob} x2={-50} y2={10} stroke={b} strokeWidth={5} />
      <path d="M -24 -90 L -46 0 L -30 0 L -8 -84 Z M 8 -90 L 34 0 L 50 0 L 22 -90 Z" fill={b} />
      <path d="M -26 -92 L 26 -92 L 20 -170 L -16 -170 Z" fill={b} />
      <path d="M -8 -184 C -8 -214 30 -214 30 -184 L 30 -168 L -8 -168 Z" fill={b} />
      <path d="M -18 -200 C 0 -238 34 -238 50 -196" fill="none" stroke={b} strokeWidth={12} strokeLinecap="round" />
      <circle cx={-6} cy={-130} r={50} fill={b} />
      <circle cx={-6} cy={-130} r={41} fill="none" stroke={inc} strokeWidth={2.5} />
      <path d="M -6 -150 L -6 -110 M -26 -130 L 14 -130" stroke={inc} strokeWidth={2.5} />
      <path d="M -36 -40 L -40 -20 M 30 -40 L 36 -20" stroke={inc} strokeWidth={2} />
      <circle cx={18} cy={-180} r={2.5} fill={inc} />
    </g>
  );
};

const GreekPanel: React.FC<Ctx> = ({x0, W, h, by, u, frame, i, pl, pr}) => {
  const b = '#1B100A';
  const inc = '#E8834E';
  const band = 44 * u;
  return (
    <g>
      <defs>
        <radialGradient id={`wws-vase${i}`} cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#E98A4E" />
          <stop offset="100%" stopColor="#C9592A" />
        </radialGradient>
        <pattern id={`wws-meander${i}`} patternUnits="userSpaceOnUse" width={band} height={band}>
          <rect width={band} height={band} fill={b} />
          <path d={`M ${2 * u} ${38 * u} H ${38 * u} V ${6 * u} H ${10 * u} V ${30 * u} H ${30 * u} V ${14 * u} H ${18 * u} V ${22 * u}`} fill="none" stroke="#DB6930" strokeWidth={4.5 * u} />
        </pattern>
        <pattern id={`wws-rays${i}`} patternUnits="userSpaceOnUse" width={40 * u} height={70 * u}>
          <path d={`M 0 ${70 * u} L ${20 * u} 0 L ${40 * u} ${70 * u} Z`} fill={b} />
        </pattern>
      </defs>
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={h} fill={`url(#wws-vase${i})`} />
      <rect x={x0 - pl} y={by * 0.04} width={W + pl + pr} height={band} fill={`url(#wws-meander${i})`} />
      <rect x={x0 - pl} y={by * 0.04 + band} width={W + pl + pr} height={6 * u} fill={b} />
      <Warrior x={x0 + W * 0.18} y={by} s={1.05 * u} flip={1} inc={inc} frame={frame} />
      <Warrior x={x0 + W * 0.6} y={by} s={1.05 * u} flip={-1} inc={inc} frame={frame + 20} />
      {[0.84, 0.94].map((f, k) => (
        <g key={k} transform={`translate(${x0 + W * f},${by}) scale(${1.3 * u})`}>
          <path d="M -12 -130 L 12 -130 L 10 -116 C 46 -100 44 -30 12 0 L -12 0 C -44 -30 -46 -100 -10 -116 Z" fill={b} />
          <path d="M -12 -120 C -34 -122 -36 -96 -22 -92 M 12 -120 C 34 -122 36 -96 22 -92" fill="none" stroke={b} strokeWidth={5} />
          <path d="M -30 -70 C -10 -60 10 -60 30 -70" fill="none" stroke={inc} strokeWidth={2} />
        </g>
      ))}
      <text x={x0 + W * 0.39} y={by * 0.32} fontFamily={fonts.serif} fontWeight={700} fontSize={42 * u} fill={b} letterSpacing={8 * u} textAnchor="middle">
        ΝΙΚΑ
      </text>
      <rect x={x0 - pl} y={by} width={W + pl + pr} height={14 * u} fill={b} />
      <rect x={x0 - pl} y={by + 14 * u + (h - by) * 0.35} width={W + pl + pr} height={70 * u} fill={`url(#wws-rays${i})`} />
      <rect x={x0 - pl} y={by + 14 * u + (h - by) * 0.35 + 70 * u} width={W + pl + pr} height={h} fill={b} />
    </g>
  );
};

const InkPanel: React.FC<Ctx> = ({x0, W, h, by, u, frame, i, pl, pr}) => {
  const ridge = (seed: string, base: number, height: number, peaks: number) => {
    const pts: Pt[] = [];
    const N = 60;
    const r = rng(seed);
    const cs = Array.from({length: peaks}, () => [r(), 0.5 + r() * 0.5, 0.04 + r() * 0.05] as [number, number, number]);
    for (let k = 0; k <= N; k++) {
      const f = k / N;
      let v = 0;
      cs.forEach(([c, a, wd]) => {
        v = Math.max(v, a * Math.exp(-(((f - c) / wd) ** 2) * 0.7));
      });
      v += fbm(seed, f * 8, 0, 3) * 0.06;
      pts.push([x0 - pl + f * (W + pl + pr), base - height * Math.max(0, v)]);
    }
    return `M ${x0 - pl} ${base} L ` + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ` L ${x0 + W + pr} ${base} Z`;
  };
  return (
    <g>
      <defs>
        <linearGradient id={`wws-wash${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F483F" stopOpacity={0.95} />
          <stop offset="70%" stopColor="#827867" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#827867" stopOpacity={0} />
        </linearGradient>
        <filter id={`wws-paper${i}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.6 / u} numOctaves={2} seed={i + 9} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.9 -0.35" />
        </filter>
        <filter id={`wws-bleed${i}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.03 / u} numOctaves={3} seed={i} />
          <feDisplacementMap in="SourceGraphic" scale={10 * u} />
          <feGaussianBlur stdDeviation={1.2 * u} />
        </filter>
      </defs>
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={h} fill="#E6DAC0" />
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={h} filter={`url(#wws-paper${i})`} opacity={0.5} />
      <g filter={`url(#wws-bleed${i})`}>
        <path d={ridge(`ink${i}a`, by * 0.78, by * 0.62, 4)} fill={`url(#wws-wash${i})`} opacity={0.35} />
        <path d={ridge(`ink${i}b`, by * 0.9, by * 0.5, 5)} fill={`url(#wws-wash${i})`} opacity={0.55} />
        <path d={ridge(`ink${i}c`, by * 1.02, by * 0.36, 3)} fill={`url(#wws-wash${i})`} opacity={0.8} />
      </g>
      {/* mist band drifting */}
      <rect x={x0 - pl} y={by * 0.62} width={W + pl + pr} height={by * 0.12} fill="#EFE6D2" opacity={0.55} transform={`translate(${Math.sin(frame / 40) * 20 * u},0)`} filter={`url(#wws-bleed${i})`} />
      {/* pine on a rock */}
      <g transform={`translate(${x0 + W * 0.14},${by})`}>
        <path d={`M 0 0 C ${-10 * u} ${-80 * u}, ${30 * u} ${-140 * u}, ${10 * u} ${-230 * u}`} fill="none" stroke="#2A2520" strokeWidth={9 * u} strokeLinecap="round" />
        {[
          [-30, -120],
          [30, -160],
          [-10, -210],
          [40, -220],
        ].map(([px, py], k) => (
          <ellipse key={k} cx={px * u} cy={py * u} rx={44 * u} ry={13 * u} fill="#2A2520" opacity={0.85} transform={`rotate(${k % 2 ? 8 : -8} ${px * u} ${py * u})`} />
        ))}
      </g>
      {/* calligraphy column + seal */}
      <g transform={`translate(${x0 + W * 0.8},${by * 0.14})`}>
        {Array.from({length: 7}, (_, k) => (
          <path key={k} d={`M ${-8 * u} ${k * 30 * u} q ${10 * u} ${6 * u} ${18 * u} ${2 * u} M 0 ${(k * 30 - 6) * u} v ${18 * u}`} stroke="#1A1714" strokeWidth={4 * u} strokeLinecap="round" fill="none" />
        ))}
        <rect x={-14 * u} y={230 * u} width={30 * u} height={30 * u} fill="#B8322A" />
        <path d={`M ${-6 * u} ${238 * u} h ${14 * u} M ${1 * u} ${236 * u} v ${18 * u} M ${-6 * u} ${250 * u} h ${14 * u}`} stroke="#F3E3D0" strokeWidth={2.5 * u} />
      </g>
      {[0, 1, 2].map((k) => {
        const bx = x0 + W * (0.45 + k * 0.05) + frame * 0.8 * u;
        const byy = by * (0.24 + 0.04 * k) + Math.sin(frame / 8 + k) * 4 * u;
        const flap = Math.sin(frame / 4 + k) * 5 * u;
        return <path key={k} d={`M ${bx - 10 * u} ${byy - flap} Q ${bx - 4 * u} ${byy - 2 * u} ${bx} ${byy} Q ${bx + 4 * u} ${byy - 2 * u} ${bx + 10 * u} ${byy - flap}`} fill="none" stroke="#2A2520" strokeWidth={2.5 * u} />;
      })}
      <rect x={x0 - pl} y={by} width={W + pl + pr} height={h - by} fill="#D8CAAA" opacity={0.6} />
      <path d={`M ${x0 - pl} ${by + 4 * u} C ${x0 + W * 0.3} ${by - 6 * u}, ${x0 + W * 0.6} ${by + 10 * u}, ${x0 + W + pr} ${by}`} fill="none" stroke="#3A332B" strokeWidth={5 * u} opacity={0.7} filter={`url(#wws-bleed${i})`} />
    </g>
  );
};

const PixelPanel: React.FC<Ctx> = ({x0, W, h, by, u, frame, i, pl, pr}) => {
  const g = 6 * u;
  const snap = (v: number) => Math.round(v / g) * g;
  const r = rng(300 + i);
  const blocks = [0.3, 0.36, 0.42, 0.7].map((f, k) => ({x: snap(x0 + W * f), y: snap(by - 230 * u), q: k !== 1}));
  const cell = 48 * u;
  return (
    <g>
      <defs>
        <linearGradient id={`wws-pxsky${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0822" />
          <stop offset="100%" stopColor="#351F69" />
        </linearGradient>
      </defs>
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={by} fill={`url(#wws-pxsky${i})`} />
      {Array.from({length: 46}, (_, k) => {
        const sx = snap(x0 + r() * W);
        const sy = snap(r() * by * 0.75);
        const period = 15 + Math.floor(r() * 30);
        const on = Math.floor((frame + k * 7) / period) % 3 !== 0;
        const sz = r() > 0.8 ? 2 * g : g;
        return on ? <rect key={k} x={sx} y={sy} width={sz * 0.66} height={sz * 0.66} fill={k % 5 ? '#FFFFFF' : '#FFD86A'} /> : null;
      })}
      {/* pixel moon */}
      {[
        [2, 0, 4],
        [1, 1, 6],
        [0, 2, 8],
        [0, 3, 8],
        [0, 4, 8],
        [1, 5, 6],
        [2, 6, 4],
      ].map(([dx, dy, len], k) => (
        <rect key={`m${k}`} x={snap(x0 + W * 0.62) + dx * g * 1.5} y={snap(by * 0.12) + dy * g * 1.5} width={len * g * 1.5} height={g * 1.5} fill="#F4E9B8" />
      ))}
      {/* stepped hills */}
      {Array.from({length: 9}, (_, k) => {
        const hx = snap(x0 + (k / 8) * W - 40 * u);
        const hh = snap((60 + ((k * 37) % 90)) * u);
        return (
          <g key={`h${k}`}>
            <rect x={hx} y={by - hh} width={snap(130 * u)} height={hh} fill="#2A1A57" />
            <rect x={hx + g * 3} y={by - hh - g * 3} width={snap(130 * u) - g * 6} height={g * 3} fill="#2A1A57" />
          </g>
        );
      })}
      {/* floating blocks */}
      {blocks.map((b, k) => (
        <g key={`b${k}`}>
          <rect x={b.x} y={b.y} width={cell} height={cell} fill={b.q ? '#F8B800' : '#C84C0C'} stroke="#0B0822" strokeWidth={g * 0.6} />
          {b.q ? (
            <text x={b.x + cell / 2} y={b.y + cell * 0.72} textAnchor="middle" fontFamily={fonts.mono} fontWeight={700} fontSize={cell * 0.7} fill="#8A3A00">
              ?
            </text>
          ) : (
            <path d={`M ${b.x} ${b.y + cell / 2} h ${cell} M ${b.x + cell / 2} ${b.y} v ${cell / 2} M ${b.x + cell / 4} ${b.y + cell / 2} v ${cell / 2}`} stroke="#0B0822" strokeWidth={g * 0.5} />
          )}
        </g>
      ))}
      {/* coin bob */}
      <g transform={`translate(${blocks[3].x + cell / 2},${blocks[3].y - 30 * u + Math.round(Math.sin(frame / 6) * 2) * g})`}>
        <rect x={-g * 1.5} y={-g * 2.5} width={g * 3} height={g * 5} fill="#FFD86A" stroke="#8A5A00" strokeWidth={g * 0.4} />
      </g>
      <text x={snap(x0 + W * 0.06)} y={snap(by * 0.08)} fontFamily={fonts.mono} fontWeight={700} fontSize={30 * u} fill="#FFFFFF" letterSpacing={3 * u}>
        SCORE 002000
      </text>
      <text x={snap(x0 + W * 0.36)} y={snap(by * 0.08)} fontFamily={fonts.mono} fontWeight={700} fontSize={30 * u} fill="#FFD86A" letterSpacing={3 * u}>
        ● x07
      </text>
      {/* ground */}
      <rect x={x0 - pl} y={by} width={W + pl + pr} height={h - by} fill="#3A486A" />
      <rect x={x0 - pl} y={by} width={W + pl + pr} height={g * 1.5} fill="#3FB27F" />
      {Array.from({length: Math.ceil((h - by) / cell) + 1}, (_, rr) =>
        Array.from({length: Math.ceil((W + pl + pr) / cell) + 1}, (_, c) => (
          <rect key={`${rr}-${c}`} x={x0 - pl + c * cell + (rr % 2 ? cell / 2 : 0)} y={by + g * 1.5 + rr * cell} width={cell} height={cell} fill="none" stroke="#28324D" strokeWidth={g * 0.5} />
        )),
      )}
      {/* pipe */}
      <rect x={snap(x0 + W * 0.9)} y={by - 120 * u} width={84 * u} height={120 * u} fill="#2F9A4A" stroke="#0B0822" strokeWidth={g * 0.6} />
      <rect x={snap(x0 + W * 0.9) - 10 * u} y={by - 150 * u} width={104 * u} height={40 * u} fill="#3FB27F" stroke="#0B0822" strokeWidth={g * 0.6} />
    </g>
  );
};

const VaporPanel: React.FC<Ctx> = ({x0, W, h, by, u, frame, i, pl, pr}) => {
  const hz = by - Math.min(170 * u, (h - by) * 0.6 + 60 * u);
  const vx = x0 + W * 0.5;
  const sunR = Math.min(W * 0.2, 220 * u);
  const sunY = hz - sunR * 0.35;
  return (
    <g>
      <defs>
        <linearGradient id={`wws-vsky${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#080112" />
          <stop offset="55%" stopColor="#270537" />
          <stop offset="100%" stopColor="#541957" />
        </linearGradient>
        <linearGradient id={`wws-sun${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="100%" stopColor="#FF3D7F" />
        </linearGradient>
        <linearGradient id={`wws-chrome${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E9F6FF" />
          <stop offset="48%" stopColor="#7FD1FF" />
          <stop offset="52%" stopColor="#3A1C6E" />
          <stop offset="100%" stopColor="#FF71CE" />
        </linearGradient>
        <clipPath id={`wws-sunclip${i}`}>
          <rect x={x0 - pl} y={0} width={W + pl + pr} height={hz} />
        </clipPath>
      </defs>
      <rect x={x0 - pl} y={0} width={W + pl + pr} height={h} fill={`url(#wws-vsky${i})`} />
      {Array.from({length: 30}, (_, k) => {
        const r = rng(k + 500);
        return <circle key={k} cx={x0 + r() * W} cy={r() * hz * 0.7} r={(1 + r() * 1.5) * u} fill="#FFFFFF" opacity={0.3 + 0.6 * Math.abs(Math.sin(frame / 20 + k))} />;
      })}
      <g clipPath={`url(#wws-sunclip${i})`}>
        <circle cx={vx} cy={sunY} r={sunR} fill={`url(#wws-sun${i})`} />
        {Array.from({length: 6}, (_, k) => {
          const yy = sunY + sunR * (0.1 + k * 0.15);
          return <rect key={k} x={vx - sunR} y={yy} width={sunR * 2} height={(3 + k * 2.2) * u} fill="#3A0C4A" />;
        })}
      </g>
      <text x={vx} y={by * 0.2} textAnchor="middle" fontFamily={fonts.display} fontSize={Math.min(96 * u, W * 0.09)} letterSpacing={Math.min(26 * u, W * 0.02)} fill={`url(#wws-chrome${i})`} stroke="#FF71CE" strokeWidth={1.5 * u}>
        AESTHETIC
      </text>
      <text x={x0 + W * 0.06} y={by * 0.08} fontFamily={fonts.mono} fontSize={24 * u} fill="#FFFFFF" opacity={0.85}>
        PLAY ▶ OCT. 04 2011
      </text>
      <rect x={x0 - pl} y={hz} width={W + pl + pr} height={h - hz} fill="#140022" />
      <g filter="url(#wws-glow)" opacity={0.95}>
        <line x1={x0 - pl} y1={hz} x2={x0 + W + pr} y2={hz} stroke="#FF3DF0" strokeWidth={3 * u} />
        {Array.from({length: 12}, (_, k) => {
          const q = ((k + (frame * 0.05) % 1) / 12) ** 2;
          const yy = hz + (h - hz) * q;
          return <line key={k} x1={x0 - pl} y1={yy} x2={x0 + W + pr} y2={yy} stroke="#FF3DF0" strokeWidth={(1 + 3 * q) * u} />;
        })}
        {Array.from({length: 25}, (_, k) => {
          const dx = (k - 12) * W * 0.09;
          return <line key={`v${k}`} x1={vx + dx * 0.15} y1={hz} x2={vx + dx * 2.2} y2={h} stroke="#FF3DF0" strokeWidth={2 * u} />;
        })}
      </g>
      {[0.12, 0.88].map((f, k) => {
        const px = x0 + W * f;
        return (
          <g key={k} transform={`translate(${px},${hz})`} fill="#1A0326">
            <path d={`M ${-6 * u} 0 C ${-4 * u} ${-120 * u}, ${8 * u} ${-200 * u}, ${16 * u} ${-260 * u} L ${24 * u} ${-258 * u} C ${16 * u} ${-200 * u}, ${8 * u} ${-120 * u}, ${8 * u} 0 Z`} />
            {[-1, 1].map((s) =>
              [0, 1].map((j) => <path key={`${s}${j}`} d={`M ${20 * u} ${-258 * u} Q ${s * (70 + j * 20) * u} ${(-300 + j * 40) * u} ${s * (110 + j * 30) * u} ${(-220 + j * 50) * u} Q ${s * 60 * u} ${(-262 + j * 20) * u} ${20 * u} ${-250 * u} Z`} />),
            )}
          </g>
        );
      })}
    </g>
  );
};

const PANELS: Record<EraStyle, React.FC<Ctx>> = {cave: CavePanel, egypt: EgyptPanel, greek: GreekPanel, ink: InkPanel, pixel: PixelPanel, vaporwave: VaporPanel};

// ------------------------------------------------------------------ timeline (integrated velocity)
type Timeline = {pos: number[]; stopIdx: number[]; stopLocal: number[]};
const buildTimeline = (stops: number[], v: number, hold0: number, hold: number, total: number, accel = 12, decel = 22): Timeline => {
  const pos: number[] = [];
  const stopIdx: number[] = [];
  const stopLocal: number[] = [];
  let f = 0;
  const push = (p: number, s: number, l: number) => {
    if (f <= total) {
      pos.push(p);
      stopIdx.push(s);
      stopLocal.push(l);
    }
    f++;
  };
  for (let l = 0; l < hold0; l++) push(stops[0], 0, l);
  for (let k = 1; k < stops.length; k++) {
    const D = stops[k] - stops[k - 1];
    let vv = v;
    let c = (D - (vv * (accel + decel)) / 2) / vv;
    if (c < 0) {
      vv = (2 * D) / (accel + decel);
      c = 0;
    }
    const M = accel + c + decel;
    for (let t = 0; t < M; t++) {
      let x: number;
      if (t < accel) x = (vv * t * t) / (2 * accel);
      else if (t < accel + c) x = (vv * accel) / 2 + vv * (t - accel);
      else {
        const tau = t - accel - c;
        x = (vv * accel) / 2 + vv * c + vv * (tau - (tau * tau) / (2 * decel));
      }
      push(stops[k - 1] + Math.min(D, x), -1, t);
    }
    const hl = k === stops.length - 1 ? Math.max(hold, total - f + 1) : hold;
    for (let l = 0; l < hl; l++) push(stops[k], k, l);
  }
  while (f <= total) push(stops[stops.length - 1], stops.length - 1, f);
  return {pos, stopIdx, stopLocal};
};

type GagKind = 'wave' | 'jump' | 'cheer' | 'point';
const GAGS: GagKind[] = ['wave', 'jump', 'point', 'cheer', 'jump', 'wave'];

const gagPose = (kind: GagKind, l: number, H: number): {pose: ChibiPose; lift: number; sy: number} => {
  switch (kind) {
    case 'wave':
      return {pose: {armF: 102 + 16 * Math.sin(l * 0.6), armB: -6, legF: 0, legB: 0, smile: true}, lift: 0, sy: 1};
    case 'cheer': {
      const b = Math.abs(Math.sin(l * 0.35));
      return {pose: {armF: 112 + 8 * Math.sin(l * 0.7), armB: 104 - 8 * Math.sin(l * 0.7), legF: 4, legB: -4, smile: true}, lift: b * H * 0.05, sy: 1};
    }
    case 'point':
      return {pose: {armF: 92, armB: -8, legF: 6, legB: -6, smile: true, blink: l % 40 > 30 && l % 40 < 34}, lift: 0, sy: 1};
    default: {
      // jump: 4 f crouch, 16 f air (parabola), 4 f landing squash
      if (l < 4) return {pose: {armF: -30, armB: -30, legF: 12, legB: -12}, lift: 0, sy: 1 - 0.08 * (l / 4)};
      if (l < 20) {
        const q = (l - 4) / 16;
        return {pose: {armF: 112, armB: 100, legF: 30, legB: -20, smile: true}, lift: Math.sin(Math.PI * q) * H * 0.72, sy: 1 + 0.05 * Math.sin(Math.PI * q)};
      }
      if (l < 25) return {pose: {armF: 40, armB: 30, legF: 10, legB: -10, smile: true}, lift: 0, sy: 1 - 0.1 * (1 - (l - 20) / 5)};
      return {pose: {armF: 6, armB: -6, legF: 0, legB: 0, smile: true}, lift: 0, sy: 1};
    }
  }
};

// ------------------------------------------------------------------ main
const WalkerWorldScroll: React.FC<Props> = ({eras, speed, stopFrames, eraWidth, stopAt, heroX, gags, badge, confettiCount, grain}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {w, h, u, portrait} = useStage();
  const list = eras.length ? eras : [{style: 'cave' as EraStyle, label: 'Cave painting', year: '15000 BC'}];
  const N = list.length;
  const unitW = portrait ? w * 1.35 : w;
  const W = eraWidth * unitW;
  const by = h * (portrait ? 0.66 : 0.7);
  const heroH = (portrait ? 330 : 300) * u;
  const hx = w * (heroX > 0 ? heroX : portrait ? 0.42 : 0.375);
  const v = (speed * unitW) / 30;

  const tl = React.useMemo(() => {
    const stops = [W * 0.32, ...Array.from({length: N - 1}, (_, k) => (k + 1) * W + stopAt * W)];
    return buildTimeline(stops, v, Math.round(stopFrames * 0.9), stopFrames, durationInFrames + 2);
  }, [W, N, stopAt, v, stopFrames, durationInFrames]);
  const fi = Math.min(frame, tl.pos.length - 1);
  const heroWorld = tl.pos[fi];
  const offset = heroWorld - hx;
  const vel = fi > 0 ? tl.pos[fi] - tl.pos[fi - 1] : 0;
  // seam crossing frames
  const bursts = React.useMemo(
    () =>
      Array.from({length: N - 1}, (_, k) => {
        const sx = (k + 1) * W;
        const idx = tl.pos.findIndex((p) => p >= sx);
        return idx < 0 ? 1e9 : idx;
      }),
    [tl, N, W],
  );
  const eraNow = bursts.filter((b) => b <= frame).length;

  // hero pose
  const stride = heroH * 0.95;
  const phase = heroWorld / stride;
  const amp = clamp(vel / (v * 0.6));
  const wp = chibiWalk(phase);
  let pose: ChibiPose = {legF: wp.legF * amp, legB: wp.legB * amp, armF: wp.armF * amp + 4 * (1 - amp), armB: wp.armB * amp - 4 * (1 - amp)};
  let lift = -(1 - wp.bob) * 5 * u * amp;
  let sy = 1;
  const si = tl.stopIdx[fi];
  if (si >= 0 && gags) {
    const g = gagPose(GAGS[si % GAGS.length], tl.stopLocal[fi] - 6, heroH);
    const blend = clamp((tl.stopLocal[fi] - 2) / 5);
    if (tl.stopLocal[fi] >= 6) {
      pose = g.pose;
      lift = -g.lift;
      sy = g.sy;
    } else {
      pose = {...pose, armF: (pose.armF ?? 0) * (1 - blend), armB: (pose.armB ?? 0) * (1 - blend)};
    }
  }
  if (frame % 83 > 78) pose = {...pose, blink: true};

  // visible eras
  const visible = list.map((e, k) => ({e, k})).filter(({k}) => k * W - offset < w + 80 * u && (k + 1) * W - offset > -80 * u);
  const seamPts = (k: number) => seamPoints(list[k].style, k * W, offset, h, u, k * 3 + 1);

  const clipFor = (k: number) => {
    const left: Pt[] = k === 0 ? [[-200 * u, -20 * u], [-200 * u, h + 20 * u]] : seamPts(k);
    const right: Pt[] = k === N - 1 ? [[w + 200 * u, -20 * u], [w + 200 * u, h + 20 * u]] : seamPts(k + 1);
    return [...left, ...right.slice().reverse()].map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  };

  // hero split: render once per era whose region touches the hero
  const heroEras = visible.filter(({k}) => k * W - offset - 60 * u < hx + heroH * 0.4 && (k + 1) * W - offset + 60 * u > hx - heroH * 0.4);

  // confetti (world space)
  const confetti: React.ReactNode[] = [];
  bursts.forEach((bf, k) => {
    const t = (frame - bf) / 30;
    if (t < 0 || t > 0.85) return;
    const pal = PALETTE[list[k + 1].style];
    const r = rng(k * 97 + 5);
    const ox = tl.pos[Math.min(bf, tl.pos.length - 1)];
    const oy = by - heroH * 0.5;
    for (let j = 0; j < confettiCount; j++) {
      const a = r() * Math.PI * 2;
      const rad0 = (60 + r() * 60) * u;
      const sp = (250 + r() * 250) * u;
      const life = 0.6 + r() * 0.2;
      const spin = (r() - 0.5) * 720;
      const col = pal[j % pal.length];
      if (t > life) continue;
      const x = ox + Math.cos(a) * (rad0 + sp * t) - offset;
      const y = oy + Math.sin(a) * (rad0 + sp * t) - 150 * u * t + 300 * u * t * t;
      const op = clamp((life - t) / (life * 0.5));
      confetti.push(<rect key={`${k}-${j}`} x={x - 4 * u} y={y - 10 * u} width={8 * u} height={20 * u} rx={4 * u} fill={col} opacity={op} transform={`rotate(${a * 57 + spin * t} ${x} ${y})`} />);
    }
  });

  // badge crossfade (9 f at the crossing)
  const lastB = eraNow > 0 ? bursts[eraNow - 1] : -100;
  const cf = clamp((frame - lastB) / 9);
  const prev = list[Math.max(0, eraNow - 1)];
  const cur = list[eraNow];
  const bs = portrait ? 1.45 : 1;
  const yearSize = 44 * u * bs;
  const subSize = 22 * u * bs;
  const cardW = (e: Era) => Math.max(e.year.length * yearSize * 0.62, e.label.length * subSize * 0.56) + 50 * u * bs;
  const bw = eraNow > 0 ? interpolate(cf, [0, 1], [cardW(prev), cardW(cur)], {easing: ease.inOut}) : cardW(cur);

  return (
    <AbsoluteFill style={{background: '#1A1410'}}>
      <Svg>
        <defs>
          <filter id="wws-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="wws-sblur">
            <feGaussianBlur stdDeviation={4 * u} />
          </filter>
          <filter id="wws-fiber">
            <feTurbulence type="fractalNoise" baseFrequency={0.08 / u} numOctaves={2} seed={4} />
            <feDisplacementMap in="SourceGraphic" scale={8 * u} />
          </filter>
          {visible.map(({k}) => (
            <clipPath key={k} id={`wws-clip${k}`}>
              <polygon points={clipFor(k)} />
            </clipPath>
          ))}
        </defs>
        {visible.map(({e, k}) => {
          const Panel = PANELS[e.style] ?? CavePanel;
          return (
            <g key={k} clipPath={`url(#wws-clip${k})`}>
              <Panel x0={k * W - offset} W={W} w={w} h={h} by={by} u={u} frame={frame} i={k} pl={k === 0 ? w * 2 : 60 * u} pr={k === N - 1 ? w * 2 : 60 * u} />
            </g>
          );
        })}
        {visible
          .filter(({k}) => k > 0)
          .map(({e, k}) => (
            <SeamDeco key={`s${k}`} style={e.style} pts={seamPts(k)} u={u} i={k} />
          ))}
        <ellipse cx={hx} cy={by + 4 * u} rx={heroH * 0.22 * (1 - clamp(-lift / heroH))} ry={heroH * 0.035} fill="#000" opacity={0.25} />
        {heroEras.map(({e, k}) => (
          <g key={`h${k}`} clipPath={`url(#wws-clip${k})`}>
            <Chibi id={`wws-hero${k}`} x={hx} y={by + lift} height={heroH} skin={CHIBI_SKINS[e.style] ?? CHIBI_SKINS.clean} pose={pose} sy={sy} frame={frame} />
          </g>
        ))}
        {confetti}
        {badge && (
          <g transform={`translate(${w - 30 * u - bw},${50 * u * bs})`}>
            <rect x={0} y={0} width={bw} height={112 * u * bs} rx={14 * u} fill="#F8F3EA" opacity={0.86} />
            {[
              {e: prev, o: eraNow > 0 ? 1 - cf : 0},
              {e: cur, o: eraNow > 0 ? cf : 1},
            ].map(({e, o}, j) =>
              o > 0.001 ? (
                <g key={j} opacity={o}>
                  <text x={bw - 25 * u * bs} y={56 * u * bs} textAnchor="end" fontFamily={fonts.sans} fontWeight={800} fontSize={yearSize} fill="#1F2018">
                    {e.year}
                  </text>
                  <text x={bw - 25 * u * bs} y={90 * u * bs} textAnchor="end" fontFamily={fonts.sans} fontWeight={600} fontSize={subSize} fill="#1F2018" opacity={0.75}>
                    {e.label}
                  </text>
                </g>
              ) : null,
            )}
          </g>
        )}
      </Svg>
      {grain && <FilmGrain opacity={0.07} every={3} />}
    </AbsoluteFill>
  );
};

export const walkerWorldScroll = defineMotion<Props>({
  id: 'walker-world-scroll',
  title: 'Walker world scroll (era wipe)',
  category: 'character',
  description:
    'A chibi explorer in a bucket hat walks in place at 37.5 % W while procedural era panels (cave, Egypt, Greek vase, ink wash, 8-bit, vaporwave) scroll by with eased stop-and-go; torn decorated seams restyle him as they pass, with a confetti burst and an era badge swap.',
  source: [
    'video14 pinned-walker-world-scroll, torn-seam-era-wipe, seam-split-character-restyle, style-swap-confetti-burst, era-badge-crossfade, chibi-hero-rig, gag-beat',
  ],
  useFor: 'History / timeline / evolution stories, “through the ages” montages, product version timelines, chapter travel.',
  durationInFrames: 570,
  defaultProps: {
    eras: [
      {style: 'cave', label: 'Cave painting', year: '15000 BC'},
      {style: 'egypt', label: 'Egyptian mural', year: '1350 BC'},
      {style: 'greek', label: 'Black-figure vase', year: '540 BC'},
      {style: 'ink', label: 'Song ink landscape', year: '1000'},
      {style: 'pixel', label: '8-bit arcade', year: '1985'},
      {style: 'vaporwave', label: 'Vaporwave', year: '2011'},
    ],
    speed: 0.42,
    stopFrames: 30,
    eraWidth: 0.8,
    stopAt: 0.45,
    heroX: 0,
    gags: true,
    badge: true,
    confettiCount: 36,
    grain: true,
  },
  propDocs: {
    eras: "list of {style: 'cave'|'egypt'|'greek'|'ink'|'pixel'|'vaporwave', label, year}",
    speed: 'cruise speed in frame widths per second (source ≈ 0.29)',
    stopFrames: 'hold length of each gag stop',
    eraWidth: 'width of each era panel in frame widths',
    stopAt: 'where in each era the walker stops (0..1)',
    heroX: 'hero screen x as a fraction of width (0 = auto: 0.375 landscape)',
    gags: 'play a small gag (wave / jump / point / cheer) at every stop',
    badge: 'show the year / title badge top-right',
    confettiCount: 'confetti capsules per seam crossing',
    grain: 'global speckle grain overlay',
  },
  component: WalkerWorldScroll,
  tags: ['walk', 'side-scroller', 'timeline', 'history', 'wipe', 'character'],
});
