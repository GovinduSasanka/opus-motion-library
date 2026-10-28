import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {Cassette, GouacheFinish, SB, SunShafts, useX4Id} from '../../core/r2-x14-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * x4 tv-wall-switch-on (24.1–29.9 s): a cosy wooden shelf wall holding five retro CRT TVs (3 above, 2 below)
 * with dark screens. They switch on one at a time (measured 0.15 / 0.48 / 0.73 / 1.08 / 1.31 s) with a quick
 * CRT warm-up — a bright line, a one-frame grey-white flash with a slight bulge, the picture fading up from
 * 60 % — and each plays its own looping clip behind scanlines, an inner vignette and a warm cast. Later one
 * screen cuts to a new clip. Screens show `images` when given, else procedural looping mini-scenes.
 */

type SceneKind = 'sunset' | 'flower' | 'lake' | 'puppy' | 'sea' | 'balloon';
type Props = {
  images: string[];
  scenes: SceneKind[];
  onTimes: number[];
  cutAt: number;
  cutScreen: number;
  cutScene: SceneKind;
  scanlines: number;
  wall: string;
  cabinet: string;
  push: number;
  seed: number;
  shelfColor?: string;
  deskColor?: string;
  deskShade?: string;
  ledColor?: string;
  plantColor?: string;
  spineColors?: string[];
};

// ---------------------------------------------------------------------------------------------------------
// procedural mini-clips (local box 20..210 × 20..195), all looping functions of t
// ---------------------------------------------------------------------------------------------------------
const MiniScene: React.FC<{kind: SceneKind; t: number; id: string}> = ({kind, t, id}) => {
  const ink = '#3E2A20';
  switch (kind) {
    case 'sunset':
      return (
        <g>
          <defs>
            <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E98A55" />
              <stop offset="1" stopColor="#F7D79C" />
            </linearGradient>
          </defs>
          <rect x={10} y={10} width={210} height={195} fill={`url(#${id}s)`} />
          <circle cx={115} cy={112 + Math.sin(t * 0.04) * 4} r={30} fill="#FFF0C2" opacity={0.95} />
          <circle cx={115} cy={112 + Math.sin(t * 0.04) * 4} r={44} fill="#FFF0C2" opacity={0.25} />
          <path d={`M10,140 Q60,${118 + Math.sin(t * 0.03) * 2} 120,138 T230,132 V210 H10 Z`} fill="#8EA46E" />
          <path d="M10,165 Q80,145 150,166 T230,158 V210 H10 Z" fill="#647F55" />
          {[0, 1, 2].map((i) => {
            const bx = ((t * 0.9 + i * 70) % 240) - 10;
            const by = 60 + i * 12 + Math.sin(t * 0.2 + i) * 3;
            const fl = Math.sin(t * 0.5 + i) * 4;
            return <path key={i} d={`M${bx - 7},${by - fl} Q${bx - 3},${by - 3} ${bx},${by} Q${bx + 3},${by - 3} ${bx + 7},${by - fl}`} stroke={ink} strokeWidth={1.6} fill="none" />;
          })}
        </g>
      );
    case 'flower': {
      const sw = Math.sin(t * 0.07) * 6;
      return (
        <g>
          <rect x={10} y={10} width={210} height={195} fill="#EBD9E4" />
          <circle cx={170} cy={60} r={50} fill="#F6E8EE" />
          <path d={`M115,175 Q${112 + sw * 0.5},130 ${115 + sw},92`} stroke="#5E8B55" strokeWidth={5} fill="none" />
          <ellipse cx={100 + sw * 0.4} cy={140} rx={16} ry={7} fill="#6F9A62" transform={`rotate(-30 ${100 + sw * 0.4} 140)`} />
          <g transform={`translate(${115 + sw} 92) rotate(${t * 0.6})`}>
            {Array.from({length: 7}, (_, i) => (
              <ellipse key={i} cx={0} cy={-17} rx={9} ry={16} fill="#E77E92" stroke={ink} strokeWidth={1} transform={`rotate(${(i * 360) / 7})`} />
            ))}
            <circle r={9} fill="#F2C14E" stroke={ink} strokeWidth={1} />
          </g>
          <path d="M88,172 L142,172 L136,205 L94,205 Z" fill="#C9714E" stroke={ink} strokeWidth={1.4} />
          <g transform={`translate(${115 + Math.cos(t * 0.09) * 55} ${88 + Math.sin(t * 0.18) * 30})`}>
            <ellipse rx={7} ry={5} fill="#F2C14E" stroke={ink} strokeWidth={1} />
            <path d="M-2,-5 V5 M2,-5 V5" stroke={ink} strokeWidth={1.2} />
            <ellipse cx={-2} cy={-7} rx={5} ry={3} fill="#FFFFFF" opacity={0.8} />
          </g>
        </g>
      );
    }
    case 'lake':
      return (
        <g>
          <defs>
            <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1C2E4C" />
              <stop offset="1" stopColor="#4C6E92" />
            </linearGradient>
          </defs>
          <rect x={10} y={10} width={210} height={195} fill={`url(#${id}l)`} />
          {Array.from({length: 14}, (_, i) => (
            <circle key={i} cx={20 + ((i * 53) % 190)} cy={22 + ((i * 37) % 70)} r={0.9 + (i % 3) * 0.4} fill="#F4EED8" opacity={0.5 + 0.5 * Math.sin(t * 0.15 + i)} />
          ))}
          <circle cx={62} cy={55} r={26} fill="#F3EBD0" opacity={0.18} />
          <circle cx={62} cy={55} r={14} fill="#F3EBD0" />
          <path d="M10,122 L45,92 L70,108 L105,78 L140,110 L170,94 L220,122 Z" fill="#22344A" />
          <rect x={10} y={122} width={210} height={85} fill="#2A4766" />
          {Array.from({length: 7}, (_, i) => {
            const yy = 132 + i * 9;
            const ww = 26 - i * 2 + Math.sin(t * 0.2 + i * 1.3) * 5;
            return <line key={i} x1={62 - ww / 2 + Math.sin(t * 0.13 + i) * 3} y1={yy} x2={62 + ww / 2 + Math.sin(t * 0.13 + i) * 3} y2={yy} stroke="#F3EBD0" strokeWidth={2} opacity={0.7 - i * 0.07} strokeLinecap="round" />;
          })}
          <rect x={150} y={113} width={6} height={9} fill="#F2C66E" />
        </g>
      );
    case 'puppy': {
      const blink = t % 70 > 64 ? 0.12 : 1;
      const ear = Math.sin(t * 0.12) * 8;
      const pant = 1 + 0.22 * Math.sin(t * 0.55);
      const tilt = Math.sin(t * 0.05) * 5;
      return (
        <g>
          <rect x={10} y={10} width={210} height={195} fill="#EFE2C6" />
          <circle cx={60} cy={50} r={40} fill="#F6EEDC" />
          <g transform={`rotate(${tilt} 115 130)`}>
            <ellipse cx={115} cy={200} rx={70} ry={40} fill="#E2B475" />
            <ellipse cx={58} cy={100} rx={22} ry={42} fill="#B9824A" stroke={ink} strokeWidth={1.4} transform={`rotate(${20 + ear} 70 70)`} />
            <ellipse cx={172} cy={100} rx={22} ry={42} fill="#B9824A" stroke={ink} strokeWidth={1.4} transform={`rotate(${-20 - ear} 160 70)`} />
            <ellipse cx={115} cy={118} rx={60} ry={56} fill="#E8BE82" stroke={ink} strokeWidth={1.4} />
            <ellipse cx={115} cy={146} rx={32} ry={22} fill="#F6E5C6" />
            <ellipse cx={92} cy={106} rx={7} ry={8 * blink} fill={ink} />
            <ellipse cx={138} cy={106} rx={7} ry={8 * blink} fill={ink} />
            <circle cx={94} cy={103} r={2} fill="#FFF" opacity={blink > 0.5 ? 1 : 0} />
            <circle cx={140} cy={103} r={2} fill="#FFF" opacity={blink > 0.5 ? 1 : 0} />
            <ellipse cx={115} cy={134} rx={10} ry={7} fill="#2E2420" />
            <path d="M103,148 Q115,156 127,148" stroke={ink} strokeWidth={1.6} fill="none" />
            <ellipse cx={115} cy={156 + 4 * pant} rx={9} ry={9 * pant} fill="#E77E7E" stroke={ink} strokeWidth={1.2} />
            <ellipse cx={86} cy={130} rx={8} ry={5} fill="#E9A07F" opacity={0.5} />
            <ellipse cx={144} cy={130} rx={8} ry={5} fill="#E9A07F" opacity={0.5} />
          </g>
        </g>
      );
    }
    case 'sea': {
      const rock = Math.sin(t * 0.08) * 6;
      const bob = Math.sin(t * 0.08 + 1) * 3;
      return (
        <g>
          <rect x={10} y={10} width={210} height={195} fill="#BFD9E6" />
          <circle cx={170} cy={52} r={18} fill="#FFF3CF" />
          <rect x={10} y={118} width={210} height={90} fill="#4C88A8" />
          <g transform={`translate(${100 + Math.sin(t * 0.02) * 10} ${118 + bob}) rotate(${rock})`}>
            <path d="M-34,0 L34,0 L24,14 L-24,14 Z" fill="#B85C3E" stroke={ink} strokeWidth={1.4} />
            <path d="M0,0 V-62" stroke={ink} strokeWidth={2} />
            <path d="M2,-60 L32,-6 L2,-6 Z" fill="#FBF3E2" stroke={ink} strokeWidth={1.2} />
            <path d="M-2,-50 L-26,-6 L-2,-6 Z" fill="#F2C66E" stroke={ink} strokeWidth={1.2} />
          </g>
          {Array.from({length: 6}, (_, i) => {
            const yy = 130 + i * 12;
            const off = (t * (1 + i * 0.3)) % 40;
            let d = `M${-30 + off},${yy}`;
            for (let x = -30 + off; x < 240; x += 20) d += ` q5,-4 10,0 q5,4 10,0`;
            return <path key={i} d={d} stroke="#DCEFF5" strokeWidth={1.6} fill="none" opacity={0.75 - i * 0.08} />;
          })}
          {[0, 1].map((i) => {
            const gx = ((t * 0.7 + i * 90) % 230) + 10;
            const gy = 70 + i * 16 + Math.sin(t * 0.15 + i) * 4;
            return <path key={i} d={`M${gx - 6},${gy} q3,-4 6,0 q3,-4 6,0`} stroke={ink} strokeWidth={1.3} fill="none" />;
          })}
        </g>
      );
    }
    default: {
      const rise = Math.sin(t * 0.04) * 8;
      return (
        <g>
          <defs>
            <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8DB8D8" />
              <stop offset="1" stopColor="#E4EEF0" />
            </linearGradient>
          </defs>
          <rect x={10} y={10} width={210} height={195} fill={`url(#${id}b)`} />
          {[0, 1, 2].map((i) => {
            const cx = ((t * (0.5 + i * 0.25) + i * 80) % 280) - 30;
            return <ellipse key={i} cx={cx} cy={150 + i * 16} rx={46} ry={14} fill="#FFFFFF" opacity={0.9} />;
          })}
          <g transform={`translate(115 ${88 + rise})`}>
            <path d="M-38,0 C-38,-52 38,-52 38,0 C38,22 14,34 8,46 L-8,46 C-14,34 -38,22 -38,0 Z" fill="#D2714E" stroke={ink} strokeWidth={1.4} />
            <path d="M-13,-38 C-20,-10 -16,22 -6,46 M13,-38 C20,-10 16,22 6,46" stroke="#F2C66E" strokeWidth={5} fill="none" />
            <path d="M-8,46 L-7,58 M8,46 L7,58" stroke={ink} strokeWidth={1.2} />
            <rect x={-9} y={57} width={18} height={12} fill="#B88B5D" stroke={ink} strokeWidth={1.2} />
          </g>
        </g>
      );
    }
  }
};

const crtPath = (x0: number, y0: number, x1: number, y1: number, r: number, b: number) => {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return `M${x0 + r},${y0} Q${mx},${y0 - b} ${x1 - r},${y0} Q${x1},${y0} ${x1},${y0 + r} Q${x1 + b},${my} ${x1},${y1 - r} Q${x1},${y1} ${x1 - r},${y1} Q${mx},${y1 + b} ${x0 + r},${y1} Q${x0},${y1} ${x0},${y1 - r} Q${x0 - b},${my} ${x0},${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;
};

/** one retro TV (local 300×215) */
const RetroTV: React.FC<{x: number; y: number; k: number; frame: number; on: number; kind: SceneKind; img: string; cutAt: number; cutKind: SceneKind | null; idx: number; cabinet: string; led: string; scan: number; lw: number}> = ({
  x,
  y,
  k,
  frame,
  on,
  kind,
  img,
  cutAt,
  cutKind,
  idx,
  cabinet,
  led,
  scan,
  lw,
}) => {
  const id = useX4Id('tv' + idx);
  const ink = SB.ink;
  const sw = lw / k;
  const d = frame - on;
  const scr = crtPath(26, 28, 202, 186, 24, 6);
  const isOn = d >= 0;
  const line = d >= 0 && d < 1.5;
  const flash = d >= 1 && d < 3 ? (d < 2 ? 0.75 : 0.4) : 0;
  const bulge = d >= 1 && d < 3 ? 1.04 : 1;
  const fadeUp = prog(d, 2, 9, ease.out);
  const picOp = d >= 2 ? 0.6 + 0.4 * fadeUp : 0;
  const lift = d >= 2 ? 0.28 * (1 - fadeUp) : 0;
  const cut = cutKind && frame >= cutAt;
  const cutFlash = cutKind && frame >= cutAt && frame < cutAt + 2 ? 0.35 : 0;
  const curKind = cut ? (cutKind as SceneKind) : kind;
  const t = Math.max(0, d) + idx * 40;
  const knob = lerp(-40, 40, prog(d, -4, 0, ease.out));
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <defs>
        <linearGradient id={`${id}cab`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cabinet} />
          <stop offset="1" stopColor="#A06A3C" />
        </linearGradient>
        <radialGradient id={`${id}vig`} cx="50%" cy="50%" r="62%">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <pattern id={`${id}scan`} patternUnits="userSpaceOnUse" width={4} height={3}>
          <rect width={4} height={1.2} fill="#000" />
        </pattern>
        <clipPath id={`${id}clip`}>
          <path d={scr} />
        </clipPath>
      </defs>
      <rect x={6} y={213} width={34} height={8} rx={2} fill="#5A3F28" />
      <rect x={260} y={213} width={34} height={8} rx={2} fill="#5A3F28" />
      <rect x={0} y={0} width={300} height={216} rx={16} fill={`url(#${id}cab)`} stroke={ink} strokeWidth={sw} />
      <rect x={7} y={7} width={286} height={202} rx={12} fill="none" stroke="#E7B985" strokeWidth={2} opacity={0.55} />
      <path d="M12,6 H288" stroke="#F0C997" strokeWidth={3} opacity={0.5} strokeLinecap="round" />
      <rect x={13} y={15} width={202} height={186} rx={24} fill="#8E8A80" stroke={ink} strokeWidth={sw} />
      <g clipPath={`url(#${id}clip)`}>
        <rect x={10} y={10} width={210} height={195} fill="#3A3C36" />
        {isOn && (
          <g transform={`translate(114 107) scale(${bulge}) translate(-114 -107)`}>
            {d >= 2 && (
              <g opacity={picOp}>
                {img ? (
                  <foreignObject x={20} y={22} width={190} height={170}>
                    <Img src={resolveSrc(img)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: `scale(${1.04 + 0.04 * clamp(t / 300)})`}} />
                  </foreignObject>
                ) : (
                  <MiniScene kind={curKind} t={t} id={`${id}m`} />
                )}
              </g>
            )}
            <rect x={10} y={10} width={210} height={195} fill="#FFFFFF" opacity={lift + cutFlash} />
            <rect x={10} y={10} width={210} height={195} fill="#E8E6DE" opacity={flash} />
            {line && <rect x={10} y={107 - 6 * (d + 0.3)} width={210} height={12 * (d + 0.3)} fill="#FFFFFF" opacity={0.9} />}
            <rect x={10} y={10} width={210} height={195} fill="#F3C98B" opacity={0.13} style={{mixBlendMode: 'multiply'}} />
            <rect x={10} y={10} width={210} height={195} fill={`url(#${id}scan)`} opacity={scan} />
            <rect x={10} y={10} width={210} height={195} fill="#FFFFFF" opacity={0.025 * (1 + Math.sin(frame * 1.7 + idx))} />
          </g>
        )}
        <rect x={10} y={10} width={210} height={195} fill={`url(#${id}vig)`} />
        <path d="M30,40 Q60,30 120,32 L40,120 Q28,80 30,40 Z" fill={`url(#${id}glass)`} />
      </g>
      <path d={scr} fill="none" stroke={ink} strokeWidth={sw} />
      {/* controls */}
      {[56, 104].map((ky, i) => (
        <g key={ky} transform={`translate(255 ${ky})`}>
          <circle r={19} fill="#6E5C48" stroke={ink} strokeWidth={sw} />
          <circle r={13} fill="#9A8A76" />
          <line x1={0} y1={0} x2={0} y2={-12} stroke={ink} strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${i === 0 ? knob : 20})`} />
        </g>
      ))}
      <rect x={228} y={134} width={54} height={62} rx={5} fill="#6E5C48" stroke={ink} strokeWidth={sw} />
      {Array.from({length: 9}, (_, i) => (
        <line key={i} x1={233} y1={140 + i * 6.3} x2={277} y2={140 + i * 6.3} stroke="#3E3226" strokeWidth={2} />
      ))}
      <circle cx={268} cy={24} r={3.2} fill={isOn ? led : '#5B4434'} />
    </g>
  );
};

/** a slightly darker tone of a hex colour (default plant leaf: #7FA45E -> #6A9150) */
const mixToward = (hex: string) => {
  if (hex.toLowerCase() === '#7fa45e') return '#6A9150';
  const n = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.85));
  return '#' + n.map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** a stack of cassettes seen spine-on */
const SpineStack: React.FC<{x: number; y: number; n: number; w: number; seed: number; lw: number; cols?: string[]}> = ({x, y, n, w, seed, lw, cols = ['#7C6E8A', '#C9584A', '#4F7F9A', '#D29A3A', '#5F8A6A', '#3F5068']}) => {
  const r = rng(seed);
  const hgt = w * 0.19;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const off = (r() - 0.5) * w * 0.08;
        const yy = y - (i + 1) * hgt;
        return (
          <g key={i}>
            <rect x={x + off} y={yy} width={w} height={hgt} rx={hgt * 0.15} fill={cols[Math.floor(r() * cols.length)]} stroke={SB.ink} strokeWidth={lw} />
            <rect x={x + off + w * 0.08} y={yy + hgt * 0.22} width={w * 0.6} height={hgt * 0.56} fill="#F3E7CF" />
            <rect x={x + off + w * 0.74} y={yy + hgt * 0.3} width={w * 0.16} height={hgt * 0.4} fill="#2E2A26" opacity={0.7} />
          </g>
        );
      })}
    </g>
  );
};

const TvWallSwitchOn: React.FC<Props> = (props) => {
  const p = {shelfColor: '#C08A55', deskColor: '#D9A46A', deskShade: '#B98451', ledColor: '#E7553E', plantColor: '#7FA45E', spineColors: ['#7C6E8A', '#C9584A', '#4F7F9A', '#D29A3A', '#5F8A6A', '#3F5068'], ...props};
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const id = useX4Id('tvwall');
  const lw = Math.max(1.2, 2 * u);
  // landscape: 3 over 2 on two shelves; tall / square frames: 2 + 2 + 1 on three shelves
  const tall = w / h < 1.3;
  const L = tall
    ? {
        W: 1000,
        H: 1194,
        shelves: [384, 774, 1164],
        panels: [414, 804],
        tvs: [
          {x: 20, y: 40},
          {x: 500, y: 40},
          {x: 20, y: 430},
          {x: 500, y: 430},
          {x: 260, y: 820},
        ],
        top: [
          {x: 90, n: 3},
          {x: 600, n: 2},
        ],
        low: [
          {x: 40, n: 6},
          {x: 770, n: 5},
        ],
        lowY: 1164,
        plant: 880,
      }
    : {
        W: 1600,
        H: 804,
        shelves: [384, 774],
        panels: [414],
        tvs: [
          {x: 40, y: 40},
          {x: 560, y: 40},
          {x: 1080, y: 40},
          {x: 290, y: 430},
          {x: 830, y: 430},
        ],
        top: [
          {x: 190, n: 3},
          {x: 1180, n: 3},
        ],
        low: [
          {x: 60, n: 7},
          {x: 1350, n: 6},
        ],
        lowY: 774,
        plant: 1440,
      };
  const S = Math.min((w * (tall ? 0.92 : 0.86)) / L.W, (h * (tall ? 0.8 : 0.78)) / (L.H + 116));
  const ox = w / 2 - (L.W / 2) * S;
  const oy = tall ? (h - (L.H + 116) * S) * 0.42 + 110 * S : h * 0.07 + 110 * S;
  const X = (v: number) => ox + v * S;
  const Y = (v: number) => oy + v * S;
  const tvK = 1.6 * S;
  const tvs = L.tvs;
  const deskTop = Y(L.H + 26);
  const zoom = 1 + p.push * prog(frame, 0, D, ease.sine);
  // lighter / darker ends of the wall gradient (exact defaults for the default wall colour)
  const isDefaultWall = p.wall.toLowerCase() === '#fdebcb';
  const shiftHex = (hex: string, t: number, to: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + to * t).toString(16).padStart(2, '0')).join('');
  const wallHi = isDefaultWall || p.wall[0] !== '#' || p.wall.length !== 7 ? '#FFF3DC' : shiftHex(p.wall, 0.45, 255);
  const wallLo = isDefaultWall || p.wall[0] !== '#' || p.wall.length !== 7 ? '#EFD0A0' : shiftHex(p.wall, 0.15, 0);
  const plantSway = Math.sin(frame * 0.05) * 2;
  return (
    <AbsoluteFill style={{background: p.wall}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 45%'}}>
        <Svg>
          <defs>
            <linearGradient id={`${id}wall`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={wallHi} />
              <stop offset="0.6" stopColor={p.wall} />
              <stop offset="1" stopColor={wallLo} />
            </linearGradient>
            <linearGradient id={`${id}desk`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.deskColor} />
              <stop offset="1" stopColor={p.deskShade} />
            </linearGradient>
            <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8DB4CF" />
              <stop offset="1" stopColor="#E3EAE2" />
            </linearGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}wall)`} />
          {/* window at the left edge, painting at the right */}
          <rect x={-10} y={-10} width={Math.max(60 * u, w * (portrait ? 0.1 : 0.065))} height={h * 0.62} fill={`url(#${id}sky)`} stroke="#C99A62" strokeWidth={14 * u} />
          <g transform={`translate(${w - Math.max(110 * u, w * 0.07)} ${h * (portrait ? 0.08 : 0.03)})`} stroke={SB.ink} strokeWidth={lw}>
            <rect x={0} y={0} width={Math.max(150 * u, w * 0.09)} height={190 * u} fill="#E3C38D" />
            <rect x={10 * u} y={10 * u} width={Math.max(150 * u, w * 0.09) - 20 * u} height={170 * u} fill="#9DC0D6" />
            <path d={`M${10 * u},${130 * u} Q${60 * u},${100 * u} ${120 * u},${125 * u} L${120 * u},${180 * u} L${10 * u},${180 * u} Z`} fill="#8FA87A" strokeWidth={lw * 0.6} />
            <rect x={40 * u} y={70 * u} width={22 * u} height={50 * u} fill="#EAD9BC" strokeWidth={lw * 0.6} />
            <path d={`M${36 * u},${70 * u} L${51 * u},${48 * u} L${66 * u},${70 * u} Z`} fill={SB.terracotta} strokeWidth={lw * 0.6} />
          </g>
          {/* shelf unit */}
          {L.panels.map((py) => (
            <g key={py}>
              <rect x={X(26)} y={Y(py)} width={(L.W - 52) * S} height={360 * S} fill="#B88B5D" opacity={0.6} />
              {Array.from({length: Math.floor((L.W - 52) / 155)}, (_, i) => (
                <line key={i} x1={X(26 + (i + 1) * 155)} y1={Y(py)} x2={X(26 + (i + 1) * 155)} y2={Y(py + 360)} stroke="#8E6440" strokeWidth={1.4 * u} opacity={0.45} />
              ))}
              <rect x={X(0)} y={Y(py)} width={26 * S} height={360 * S} fill="#A97A4B" stroke={SB.ink} strokeWidth={lw} />
              <rect x={X(L.W - 26)} y={Y(py)} width={26 * S} height={360 * S} fill="#A97A4B" stroke={SB.ink} strokeWidth={lw} />
            </g>
          ))}
          {L.shelves.map((by) => (
            <g key={by}>
              <rect x={X(0)} y={Y(by)} width={L.W * S} height={30 * S} fill={p.shelfColor} stroke={SB.ink} strokeWidth={lw} />
              <line x1={X(6)} y1={Y(by + 6)} x2={X(L.W - 6)} y2={Y(by + 6)} stroke="#E2B17A" strokeWidth={3 * S} opacity={0.6} />
            </g>
          ))}
          {/* stacks and plants */}
          {L.top.map((st, i) => (
            <SpineStack key={'t' + i} x={X(st.x)} y={Y(40)} n={st.n} w={180 * S} seed={p.seed + i} lw={lw * 0.8} cols={p.spineColors} />
          ))}
          {L.low.map((st, i) => (
            <SpineStack key={'l' + i} x={X(st.x)} y={Y(L.lowY)} n={st.n} w={190 * S} seed={p.seed + 2 + i} lw={lw * 0.8} cols={p.spineColors} />
          ))}
          <g transform={`translate(${X(L.plant)} ${Y(40)})`} stroke={SB.ink} strokeWidth={lw * 0.8}>
            {Array.from({length: 8}, (_, i) => {
              const a = -160 + i * 20 + plantSway;
              const rad = (a * Math.PI) / 180;
              const L = (60 + (i % 3) * 18) * S;
              return <ellipse key={i} cx={Math.cos(rad) * L * 0.7} cy={-70 * S + Math.sin(rad) * L * 0.7} rx={26 * S} ry={13 * S} fill={i % 2 ? p.plantColor : mixToward(p.plantColor)} transform={`rotate(${a} ${Math.cos(rad) * L * 0.7} ${-70 * S + Math.sin(rad) * L * 0.7})`} />;
            })}
            <path d={`M${-44 * S},${-76 * S} L${44 * S},${-76 * S} L${34 * S},0 L${-34 * S},0 Z`} fill={SB.terracotta} />
          </g>
          {tvs.map((tv, i) => (
            <RetroTV
              key={i}
              x={X(tv.x)}
              y={Y(tv.y)}
              k={tvK}
              frame={frame}
              on={p.onTimes[i] ?? 5 + i * 9}
              kind={p.scenes[i % Math.max(1, p.scenes.length)] ?? 'lake'}
              img={p.images[i] ?? ''}
              cutAt={p.cutAt}
              cutKind={i === p.cutScreen && !p.images[i] ? p.cutScene : null}
              idx={i}
              cabinet={p.cabinet}
              led={p.ledColor}
              scan={p.scanlines}
              lw={lw}
            />
          ))}
          {/* foreground table with loose cassettes */}
          <rect x={0} y={deskTop} width={w} height={h - deskTop + 4} fill={`url(#${id}desk)`} />
          <line x1={0} y1={deskTop} x2={w} y2={deskTop} stroke={SB.ink} strokeWidth={lw} />
          {Array.from({length: 5}, (_, i) => (
            <line key={i} x1={0} y1={deskTop + (h - deskTop) * (0.2 + i * 0.18)} x2={w} y2={deskTop + (h - deskTop) * (0.22 + i * 0.18)} stroke="#A9764A" strokeWidth={1.2 * u} opacity={0.35} />
          ))}
          <Cassette x={w * 0.08} y={deskTop + 70 * S} w={240 * S} body="#4F7F9A" rot={-8} squash={0.55} lw={lw * 0.9} />
          <Cassette x={w * 0.17} y={deskTop + 110 * S} w={260 * S} body="#C9584A" rot={6} squash={0.55} lw={lw * 0.9} />
          <Cassette x={w * 0.88} y={deskTop + 80 * S} w={250 * S} body="#7C6E8A" rot={10} squash={0.55} lw={lw * 0.9} />
          <SpineStack x={w * 0.9 - 110 * S} y={deskTop + 40 * S} n={tall ? 2 : 3} w={210 * S} seed={p.seed + 9} lw={lw * 0.8} cols={p.spineColors} />
                    {tall && <Cassette x={w * 0.55} y={deskTop + 150 * S} w={260 * S} body="#D29A3A" rot={-12} squash={0.55} lw={lw * 0.9} />}
        </Svg>
      </AbsoluteFill>
      <SunShafts w={w} h={h} frame={frame} angle={34} opacity={0.16} x0={0.02} count={3} />
      <GouacheFinish w={w} h={h} seed={p.seed} vignette={0.14} warm={0.05} />
    </AbsoluteFill>
  );
};

export const tvWallSwitchOn = defineMotion<Props>({
  id: 'tv-wall-switch-on',
  title: 'TV wall switch-on',
  category: 'ui',
  description:
    'A cosy wooden shelf wall of five retro CRT TVs (3 over 2) switches on one by one — bright line, grey-white flash with a slight bulge, picture fading up — each playing its own looping clip behind scanlines, vignette and a warm cast; later one screen cuts to a new clip.',
  source: ['video x4 0:24.1-0:29.9 (tv-wall-switch-on)'],
  useFor: 'Showcasing many outputs (videos, testimonials, products, social proof) in one warm composition; pass up to five `images`.',
  durationInFrames: 150,
  defaultProps: {
    images: [],
    scenes: ['sunset', 'flower', 'lake', 'puppy', 'sea'],
    onTimes: [5, 14, 22, 32, 39],
    cutAt: 84,
    cutScreen: 2,
    cutScene: 'balloon',
    scanlines: 0.08,
    wall: '#FDEBCB',
    cabinet: '#C98D58',
    push: 0.03,
    seed: 6,
    shelfColor: '#C08A55',
    deskColor: '#D9A46A',
    deskShade: '#B98451',
    ledColor: '#E7553E',
    plantColor: '#7FA45E',
    spineColors: ['#7C6E8A', '#C9584A', '#4F7F9A', '#D29A3A', '#5F8A6A', '#3F5068'],
  },
  propDocs: {
    images: 'up to 5 screen images (public/ paths or URLs), order top-left → bottom-right; empty slots use procedural clips',
    scenes: 'procedural clips per screen: sunset | flower | lake | puppy | sea | balloon',
    onTimes: 'switch-on frame per screen (measured 0.15 / 0.48 / 0.73 / 1.08 / 1.31 s)',
    cutAt: 'frame one screen cuts to a new clip',
    cutScreen: 'index of the screen that cuts (-1 = none)',
    cutScene: 'procedural clip it cuts to',
    scanlines: 'scanline opacity',
    wall: 'wall colour',
    cabinet: 'TV cabinet wood colour',
    push: 'slow camera push-in amount',
    seed: 'seed for cassette stacks',
    shelfColor: 'shelf board colour',
    deskColor: 'foreground table top colour',
    deskShade: 'foreground table colour at the bottom',
    ledColor: 'power LED colour on each TV',
    plantColor: 'plant leaf colour',
    spineColors: 'cassette spine colours (hex list, picked at random per cassette)',
  },
  component: TvWallSwitchOn,
  tags: ['tv', 'crt', 'retro', 'tv-wall', 'switch-on', 'warm-up', 'scanlines', 'showcase', 'testimonials', 'social-proof', 'gallery', 'video-wall', 'storybook', 'gouache', 'cosy', 'cassettes', 'x4'],
});
