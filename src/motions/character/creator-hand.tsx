import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {ActionTicks, CreatorArm, GouacheFinish, IdeaCard, SB, SunShafts, useX4Id} from '../../core/r2-x14-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * x4 "creator hand" (0.0–4.5 s): a giant hand in a chunky red ribbed sweater reaches in from the frame edge,
 * unpins a light-bulb idea card from a corkboard, carries it on a slow soft S-curve (easeInOutSine,
 * ≈ 0.1 W/s), hovers over a closed laptop, opens its fingers over two drawings and lets the card drop onto
 * the lid. The hand and card animate on twos (12 drawings/s) like the source; the room lives on ones.
 * Procedural warm storybook desk room (corkboard of doodle notes, window, clock, lamp, mug, plant).
 */

type Props = {
  background: string;
  from: 'right' | 'left' | 'top';
  onTwos: boolean;
  sleeveColor: string;
  cuffColor: string;
  skin: string;
  cardIcon: 'bulb' | 'star' | 'heart' | 'none';
  cardColor: string;
  cardSrc: string;
  handSize: number;
  ink: string;
  seed: number;
};

type Pt = {x: number; y: number};
const quadThrough = (a: Pt, m: Pt, b: Pt, t: number): Pt => {
  const c = {x: 2 * m.x - (a.x + b.x) / 2, y: 2 * m.y - (a.y + b.y) / 2};
  const s = 1 - t;
  return {x: s * s * a.x + 2 * s * t * c.x + t * t * b.x, y: s * s * a.y + 2 * s * t * c.y + t * t * b.y};
};

const NOTE_COLORS = ['#F4E3B5', '#CFE0E6', '#F2C9B8', '#D9E6C8', '#E7D3EC', '#F6EFD9', '#F3D7A6', '#DCE3F0'];
const PIN_COLORS = ['#D2714E', '#4F8A8B', '#E0B030', '#7C6E8A', '#C9584A'];

/** tiny ink doodles for the pinned notes (local box −40..40) */
const Doodle: React.FC<{kind: number; ink: string; sw: number}> = ({kind, ink, sw}) => {
  const st = {stroke: ink, strokeWidth: sw, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  switch (kind % 9) {
    case 0:
      return <path d="M-22,10 C-30,10 -30,-2 -20,-2 C-20,-14 -2,-16 2,-6 C8,-12 22,-8 20,2 C28,2 28,10 20,10 Z" {...st} fill="#FFFFFF" />;
    case 1:
      return (
        <g>
          <circle r={12} {...st} fill="#F7D35C" />
          <path d="M0,-18 V-24 M0,18 V24 M-18,0 H-24 M18,0 H24 M-13,-13 L-17,-17 M13,13 L17,17 M13,-13 L17,-17 M-13,13 L-17,17" {...st} />
          <path d="M-4,-2 v1 M4,-2 v1 M-5,4 Q0,8 5,4" {...st} />
        </g>
      );
    case 2:
      return (
        <g>
          <circle r={12} {...st} fill="#E6A86F" />
          <ellipse rx={24} ry={7} transform="rotate(-18)" {...st} />
        </g>
      );
    case 3:
      return <path d="M-26,16 L-8,-14 L2,2 L10,-8 L26,16 Z M-12,-7 L-8,-14 L-4,-7" {...st} fill="#BFD3C4" />;
    case 4:
      return <path d="M-24,4 L22,-14 L4,18 L0,6 Z M0,6 L22,-14" {...st} fill="#FFFFFF" />;
    case 5:
      return <path d="M0,-20 L6,-6 L21,-6 L9,4 L13,19 L0,10 L-13,19 L-9,4 L-21,-6 L-6,-6 Z" {...st} fill="#F7D35C" />;
    case 6:
      return <path d="M-18,18 V-2 L0,-18 L18,-2 V18 Z M-5,18 V6 H5 V18" {...st} fill="#F2C9B8" />;
    case 7:
      return (
        <g>
          <path d="M-8,14 V-14 L14,-18 V10" {...st} />
          <circle cx={-12} cy={14} r={5} {...st} fill={ink} />
          <circle cx={10} cy={10} r={5} {...st} fill={ink} />
        </g>
      );
    default:
      return <path d="M-20,-14 H20 V14 H-20 Z M-20,4 L-6,-6 L6,6 L12,0 L20,8" {...st} fill="#DCE3F0" />;
  }
};

const CreatorHand: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const portrait = w / h < 1.3; // square frames use the tall layout too
  const id = useX4Id('chand');
  const ink = p.ink;
  const lw = Math.max(1.4, 2.2 * u);
  const tq = p.onTwos ? Math.floor(frame / 2) * 2 : frame;
  const room = p.background === 'desk';
  const flat = !room && p.background !== 'transparent';

  // ---------------- layout ----------------
  const deskTop = h * (portrait ? 0.62 : 0.69);
  const bw = Math.min(0.86 * w, 880 * u);
  const bh = bw * 0.54;
  const bx = w * 0.5 - bw / 2 + (portrait ? 0 : 0.02 * w);
  const by = portrait ? h * 0.13 : -0.03 * h;
  const winW = Math.min(0.2 * w, 330 * u);
  const winH = deskTop * 0.8;
  const lapW = Math.min(0.62 * w, 980 * u);
  const lapX = w * 0.5;
  const lapY = deskTop + (h - deskTop) * (portrait ? 0.3 : 0.42); // centre of the lid's top face
  const lapD = lapW * 0.13;
  const noteS = Math.min(bw / 5.2, 120 * u);
  const cols = 4;
  const rows = 3;
  const r = rng(p.seed);
  const notes = Array.from({length: cols * rows}, (_, i) => {
    const c = i % cols;
    const rr = Math.floor(i / cols);
    return {
      x: bx + bw * (0.14 + (c / (cols - 1)) * 0.72) + (r() - 0.5) * noteS * 0.25,
      y: by + bh * (0.2 + (rr / (rows - 1)) * 0.6) + (r() - 0.5) * noteS * 0.15,
      rot: (r() - 0.5) * 12,
      col: NOTE_COLORS[i % NOTE_COLORS.length],
      pin: PIN_COLORS[Math.floor(r() * PIN_COLORS.length)],
      kind: Math.floor(r() * 9),
    };
  });
  const slot = 7; // right column, middle row: the idea card's spot
  const mirror = p.from === 'left';
  const mx = (x: number) => (mirror ? w - x : x);
  const cardSize = Math.min(150 * u, noteS * 1.2);
  const hs = p.handSize * u;

  // ---------------- path ----------------
  const P0: Pt = {x: notes[slot].x + cardSize * 0.42, y: notes[slot].y};
  const P2: Pt = {x: lapX + cardSize * 0.42, y: lapY - lapD * 0.2 - 0.07 * h};
  const P1: Pt = {x: lerp(P0.x, P2.x, 0.5) - 0.1 * bw, y: lerp(P0.y, P2.y, 0.42)};
  const entry: Pt = p.from === 'top' ? {x: P0.x + 0.05 * w, y: -0.35 * h} : {x: P0.x + 0.5 * w, y: P0.y - 0.05 * h};

  const enter = prog(tq, 0, 14, ease.out);
  const pick = prog(tq, 16, 26, ease.out);
  const carry = prog(tq, 26, 122, ease.sine);
  const release = prog(tq, 132, 136, ease.linear);
  const exit = prog(tq, 140, 150, ease.inOut);
  let hand: Pt;
  if (tq < 16) hand = {x: lerp(entry.x, P0.x, enter), y: lerp(entry.y, P0.y, enter)};
  else if (tq < 26) hand = {x: P0.x + 0.01 * w * pick, y: P0.y + 0.03 * h * pick};
  else {
    const a = {x: P0.x + 0.01 * w, y: P0.y + 0.03 * h};
    hand = quadThrough(a, P1, P2, carry);
  }
  const bob = tq >= 122 ? Math.sin((tq - 122) * 0.25) * 0.004 * h * (1 - exit) : 0;
  hand = {x: hand.x + exit * 0.1 * w, y: hand.y + bob - exit * 0.12 * h};
  const pose = tq < 16 ? 1 - prog(tq, 8, 15, ease.linear) : release;
  const scaleUp = 1 + 0.04 * pick * (1 - carry * 0.5);

  // card state
  const held = tq < 134;
  const fallU = prog(tq, 134, 144, ease.in);
  const land = tq - 144;
  const settle = land >= 0 ? Math.sin(Math.min(1, land / 6) * Math.PI) * 0.06 * (1 - land / 8) : 0;
  const swing = held && tq >= 16 ? -4 + 7 * Math.sin(carry * Math.PI * 1.5) : notes[slot].rot;
  const heldCard: Pt = {x: hand.x - cardSize * 0.42, y: hand.y + cardSize * 0.05};
  const dropFrom: Pt = {x: P2.x - cardSize * 0.42, y: P2.y + bob + cardSize * 0.05};
  const restAt: Pt = {x: lapX, y: lapY - lapD * 0.15};
  const card: Pt = held ? (tq < 16 ? {x: notes[slot].x, y: notes[slot].y} : heldCard) : {x: lerp(dropFrom.x, restAt.x, fallU), y: lerp(dropFrom.y, restAt.y, fallU)};
  const cardRot = held ? swing : lerp(swing, 6, fallU);
  const cardSquash = held ? 1 : lerp(1, 0.5, fallU) + settle;

  const anchor: Pt = p.from === 'top' ? {x: hand.x + 0.18 * w, y: -0.6 * h} : {x: w + 320 * u, y: Math.max(-120 * u, hand.y - 0.13 * h)};

  return (
    <AbsoluteFill style={{background: room ? SB.wall : flat ? p.background : 'transparent'}}>
      <Svg>
        <defs>
          <radialGradient id={`${id}wall`} cx="38%" cy="42%" r="75%">
            <stop offset="0" stopColor="#F6E4BD" />
            <stop offset="0.6" stopColor="#EFCB95" />
            <stop offset="1" stopColor={SB.wall} />
          </radialGradient>
          <linearGradient id={`${id}desk`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E7B878" />
            <stop offset="1" stopColor="#CD9662" />
          </linearGradient>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8DB4CF" />
            <stop offset="1" stopColor="#DCE6E2" />
          </linearGradient>
          <linearGradient id={`${id}lap`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#DAD6D0" />
            <stop offset="0.55" stopColor="#C4C0BA" />
            <stop offset="1" stopColor="#B1ADA7" />
          </linearGradient>
          <filter id={`${id}cork`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.5 / u} numOctaves={2} seed={p.seed} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.28  0 0 0 0 0.14  2.4 0 0 0 -1.1" />
          </filter>
          <clipPath id={`${id}winclip`}>
            <rect x={mx(0) - (mirror ? winW : 0)} y={0} width={winW} height={winH} />
          </clipPath>
        </defs>
        {room && (
          <g>
            <rect width={w} height={h} fill={`url(#${id}wall)`} />
            {/* window with a distant town */}
            <g clipPath={`url(#${id}winclip)`}>
              <rect x={0} y={0} width={w} height={winH} fill={`url(#${id}sky)`} />
              {[0.2, 0.55].map((cx, i) => (
                <ellipse key={i} cx={mx(winW * cx + Math.sin(frame * 0.01 + i) * 4 * u)} cy={winH * (0.14 + i * 0.1)} rx={winW * 0.28} ry={winH * 0.05} fill="#F6F0E2" opacity={0.9} />
              ))}
              <path d={`M${mx(0)},${winH * 0.62} Q${mx(winW * 0.5)},${winH * 0.5} ${mx(winW)},${winH * 0.58} L${mx(winW)},${winH} L${mx(0)},${winH} Z`} fill="#AFC09C" />
              {[0.12, 0.42, 0.7].map((fx, i) => (
                <g key={i}>
                  <rect x={Math.min(mx(winW * fx), mx(winW * fx + winW * 0.22))} y={winH * (0.5 + i * 0.05)} width={winW * 0.22} height={winH * 0.2} fill="#EEDFC3" stroke={ink} strokeWidth={lw * 0.5} />
                  <path d={`M${mx(winW * fx - 4 * u)},${winH * (0.5 + i * 0.05)} L${mx(winW * (fx + 0.11))},${winH * (0.44 + i * 0.05)} L${mx(winW * (fx + 0.22) + 4 * u)},${winH * (0.5 + i * 0.05)} Z`} fill={SB.terracotta} stroke={ink} strokeWidth={lw * 0.5} />
                </g>
              ))}
            </g>
            <rect x={Math.min(mx(0), mx(winW)) - 4 * u} y={-4 * u} width={winW + 8 * u} height={winH + 8 * u} fill="none" stroke="#C99A62" strokeWidth={16 * u} />
            <path d={`M${mx(winW * 0.5)},0 V${winH}`} stroke="#C99A62" strokeWidth={10 * u} />
            <rect x={Math.min(mx(-10 * u), mx(winW + 26 * u))} y={winH} width={winW + 36 * u} height={18 * u} fill="#D3A46B" stroke={ink} strokeWidth={lw} />
            {/* corkboard */}
            <rect x={bx - 16 * u} y={by - 16 * u} width={bw + 32 * u} height={bh + 32 * u} rx={6 * u} fill="#C08A55" stroke={ink} strokeWidth={lw} />
            <rect x={bx} y={by} width={bw} height={bh} fill="#D9A473" stroke={ink} strokeWidth={lw * 0.7} />
            <rect x={bx} y={by} width={bw} height={bh} filter={`url(#${id}cork)`} opacity={0.55} />
            {notes.map((n, i) => {
              if (i === slot) {
                return <circle key={i} cx={n.x} cy={n.y - noteS * 0.42} r={6 * u} fill={n.pin} stroke={ink} strokeWidth={lw * 0.6} opacity={tq >= 16 ? 1 : 0} />;
              }
              return (
                <g key={i} transform={`translate(${n.x} ${n.y}) rotate(${n.rot})`}>
                  <rect x={-noteS / 2 + 3 * u} y={-noteS / 2 + 4 * u} width={noteS} height={noteS * 0.92} fill="#000" opacity={0.1} />
                  <rect x={-noteS / 2} y={-noteS / 2} width={noteS} height={noteS * 0.92} fill={n.col} stroke={ink} strokeWidth={lw * 0.6} />
                  <g transform={`scale(${noteS / 100})`}>
                    <Doodle kind={n.kind} ink={ink} sw={lw * 0.8 / (noteS / 100)} />
                  </g>
                  <circle cx={0} cy={-noteS * 0.42} r={6 * u} fill={n.pin} stroke={ink} strokeWidth={lw * 0.6} />
                </g>
              );
            })}
            {/* clock */}
            <g transform={`translate(${mx(w * 0.87)} ${portrait ? h * 0.05 : h * 0.07})`}>
              <circle r={74 * u} fill="#B5573A" stroke={ink} strokeWidth={lw} />
              <circle r={62 * u} fill="#F7EEDC" stroke={ink} strokeWidth={lw * 0.6} />
              {Array.from({length: 12}, (_, i) => (
                <line key={i} x1={0} y1={-54 * u} x2={0} y2={-46 * u} stroke={ink} strokeWidth={lw * 0.8} transform={`rotate(${i * 30})`} />
              ))}
              <line x1={0} y1={0} x2={0} y2={-42 * u} stroke={ink} strokeWidth={lw * 1.2} strokeLinecap="round" transform={`rotate(${40 + frame * 0.2})`} />
              <line x1={0} y1={0} x2={0} y2={-28 * u} stroke={ink} strokeWidth={lw * 1.6} strokeLinecap="round" transform="rotate(-62)" />
              <circle r={4 * u} fill={ink} />
            </g>
            {/* desk */}
            <rect x={0} y={deskTop} width={w} height={h - deskTop} fill={`url(#${id}desk)`} />
            <line x1={0} y1={deskTop} x2={w} y2={deskTop} stroke={ink} strokeWidth={lw} />
            {Array.from({length: 7}, (_, i) => (
              <path
                key={i}
                d={`M0,${deskTop + (h - deskTop) * (0.12 + i * 0.13)} Q${w * 0.4},${deskTop + (h - deskTop) * (0.1 + i * 0.13)} ${w},${deskTop + (h - deskTop) * (0.14 + i * 0.13)}`}
                stroke="#B47E4C"
                strokeWidth={1.2 * u}
                fill="none"
                opacity={0.35}
              />
            ))}
            {/* lamp (left) */}
            <g transform={`translate(${mx(w * (portrait ? 0.07 : 0.045))} ${deskTop + (h - deskTop) * 0.3})`} stroke={ink} strokeWidth={lw}>
              <ellipse cx={0} cy={0} rx={58 * u} ry={14 * u} fill="#C9584A" />
              <path d={`M0,0 L${(mirror ? -1 : 1) * 30 * u},${-200 * u} L${(mirror ? -1 : 1) * 70 * u},${-260 * u}`} fill="none" strokeWidth={8 * u} stroke="#B5573A" />
              <path d={`M${(mirror ? -1 : 1) * 20 * u},${-290 * u} L${(mirror ? -1 : 1) * 130 * u},${-250 * u} L${(mirror ? -1 : 1) * 95 * u},${-190 * u} Z`} fill="#D2714E" />
              <ellipse cx={(mirror ? -1 : 1) * 112 * u} cy={-220 * u} rx={34 * u} ry={14 * u} fill="#FFF1C6" transform={`rotate(${(mirror ? 1 : -1) * 55} ${(mirror ? -1 : 1) * 112 * u} ${-220 * u})`} />
            </g>
            {/* plant on the sill */}
            <g transform={`translate(${mx(winW * 0.82)} ${winH})`} stroke={ink} strokeWidth={lw * 0.8} opacity={portrait && by + bh > winH - 140 * u ? 0 : 1}>
              {Array.from({length: 7}, (_, i) => {
                const a = -150 + i * 20 + Math.sin(frame * 0.04 + i) * 2;
                const L = (70 + (i % 3) * 22) * u;
                const rad = (a * Math.PI) / 180;
                return <ellipse key={i} cx={Math.cos(rad) * L * 0.6} cy={-60 * u + Math.sin(rad) * L * 0.6} rx={22 * u} ry={13 * u} fill={i % 2 ? '#6F9A62' : '#5C8655'} transform={`rotate(${a} ${Math.cos(rad) * L * 0.6} ${-60 * u + Math.sin(rad) * L * 0.6})`} />;
              })}
              <path d={`M${-40 * u},${-70 * u} L${40 * u},${-70 * u} L${32 * u},0 L${-32 * u},0 Z`} fill="#EDE3D0" />
              <rect x={-38 * u} y={-34 * u} width={76 * u} height={16 * u} fill="#7FB2AE" stroke="none" />
            </g>
            {/* mug */}
            <g transform={`translate(${mx(w * (portrait ? 0.2 : 0.15))} ${deskTop + (h - deskTop) * (portrait ? 0.82 : 0.5)})`} stroke={ink} strokeWidth={lw}>
              <path d={`M${54 * u},${-90 * u} q${40 * u},${8 * u} ${30 * u},${50 * u} q${-6 * u},${18 * u} ${-30 * u},${18 * u}`} fill="none" strokeWidth={10 * u} stroke="#F3EBDD" />
              <path d={`M${-56 * u},${-120 * u} L${56 * u},${-120 * u} L${52 * u},0 Q0,${12 * u} ${-52 * u},0 Z`} fill="#F3EBDD" />
              <ellipse cx={0} cy={-120 * u} rx={56 * u} ry={14 * u} fill="#5A3A28" />
              <circle cx={0} cy={-58 * u} r={20 * u} fill="#D2714E" stroke="none" />
            </g>
            {/* pencil pot + books */}
            <g transform={`translate(${mx(w * (portrait ? 0.8 : 0.86))} ${deskTop + (h - deskTop) * (portrait ? 0.72 : 0.26)})`} stroke={ink} strokeWidth={lw}>
              {['#3F6FB5', '#E0B030', '#D2714E', '#7C6E8A', '#4F8A8B'].map((c, i) => (
                <line key={i} x1={(-30 + i * 15) * u} y1={-60 * u} x2={(-36 + i * 18) * u} y2={(-150 - (i % 2) * 22) * u} stroke={c} strokeWidth={10 * u} strokeLinecap="round" />
              ))}
              <path d={`M${-52 * u},${-90 * u} L${52 * u},${-90 * u} L${48 * u},${20 * u} L${-48 * u},${20 * u} Z`} fill="#4E9C97" />
              <ellipse cx={0} cy={-90 * u} rx={52 * u} ry={11 * u} fill="#3F7E7A" />
            </g>
            {/* closed laptop */}
            <g stroke={ink} strokeWidth={lw} strokeLinejoin="round">
              <path
                d={`M${lapX - lapW / 2},${lapY + lapD / 2} L${lapX + lapW / 2},${lapY + lapD / 2} L${lapX + lapW / 2 - 0.012 * lapW},${lapY + lapD / 2 + 0.028 * lapW} L${lapX - lapW / 2 + 0.012 * lapW},${lapY + lapD / 2 + 0.028 * lapW} Z`}
                fill="#8F8B86"
              />
              <path d={`M${lapX - lapW / 2},${lapY + lapD / 2} L${lapX - lapW * 0.465},${lapY - lapD / 2} L${lapX + lapW * 0.465},${lapY - lapD / 2} L${lapX + lapW / 2},${lapY + lapD / 2} Z`} fill={`url(#${id}lap)`} />
              <path d={`M${lapX - lapW * 0.08},${lapY + lapD / 2 + 0.006 * lapW} H${lapX + lapW * 0.08}`} strokeWidth={lw * 0.7} />
              <path d={`M${lapX - lapW * 0.4},${lapY - lapD * 0.2} L${lapX - lapW * 0.15},${lapY + lapD * 0.3}`} stroke="#FFFFFF" strokeWidth={8 * u} opacity={0.35} strokeLinecap="round" />
            </g>
            <ellipse cx={lapX} cy={lapY + lapD / 2 + 0.035 * lapW} rx={lapW * 0.5} ry={8 * u} fill={ink} opacity={0.12} />
          </g>
        )}
        {/* card (under the hand) */}
        {p.cardSrc ? (
          <g transform={`translate(${card.x} ${card.y}) rotate(${cardRot}) scale(1 ${cardSquash})`}>
            <rect x={-cardSize * 0.48} y={-cardSize * 0.52} width={cardSize * 0.96} height={cardSize * 1.04} fill={p.cardColor} stroke={ink} strokeWidth={lw} />
            <foreignObject x={-cardSize * 0.42} y={-cardSize * 0.46} width={cardSize * 0.84} height={cardSize * 0.92}>
              <Img src={resolveSrc(p.cardSrc)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
            </foreignObject>
          </g>
        ) : (
          <IdeaCard x={card.x} y={card.y} size={cardSize} rot={cardRot} squash={cardSquash} icon={p.cardIcon} color={p.cardColor} ink={ink} lw={lw} />
        )}
        {land >= 0 && land < 10 && <ActionTicks frame={tq} x={card.x} y={card.y - cardSize * 0.2} size={cardSize * 0.75} dir={-90} spread={120} count={5} seed={p.seed + 3} color={ink} width={lw * 1.2} />}
        {/* the giant hand */}
        <CreatorArm
          px={mx(hand.x)}
          py={hand.y}
          ax={mx(anchor.x)}
          ay={anchor.y}
          size={hs * scaleUp}
          pose={clamp(pose)}
          lw={lw * 1.1}
          sleeve={p.sleeveColor}
          cuff={p.cuffColor}
          skin={p.skin}
          ink={ink}
        />
      </Svg>
      {room && <SunShafts w={w} h={h} frame={frame} angle={mirror ? -30 : 30} opacity={0.2} x0={mirror ? 0.25 : 0.08} />}
      {room && <GouacheFinish w={w} h={h} seed={p.seed} />}
    </AbsoluteFill>
  );
};

export const creatorHand = defineMotion<Props>({
  id: 'creator-hand',
  title: 'Creator hand',
  category: 'character',
  description:
    'A giant storybook hand in a chunky red ribbed sweater reaches in from the edge, unpins a light-bulb idea card from a corkboard, carries it on a slow S-curve on twos and drops it onto a closed laptop in a warm gouache desk room.',
  source: ['video x4 0:00-0:04.5 (creator-hand)'],
  useFor: '"Your input enters the product" promo beat, tutorial hands, a big friendly hand acting on a small illustrated world; overlay it (background transparent) over any shot.',
  durationInFrames: 150,
  defaultProps: {
    background: 'desk',
    from: 'right',
    onTwos: true,
    sleeveColor: '#D2714E',
    cuffColor: '#C5613F',
    skin: '#E8C497',
    cardIcon: 'bulb',
    cardColor: '#FBF6EA',
    cardSrc: '',
    handSize: 250,
    ink: '#3E2A20',
    seed: 4,
  },
  propDocs: {
    background: "'desk' = procedural storybook desk room, 'transparent' = overlay (hand + card only), or any CSS colour",
    from: 'edge the arm enters from: right | left | top',
    onTwos: 'hold each hand drawing for 2 frames (hand-made 12 drawings/s feel)',
    sleeveColor: 'sweater colour',
    cuffColor: 'ribbed cuff colour',
    skin: 'skin tone',
    cardIcon: 'doodle on the carried card: bulb | star | heart | none',
    cardColor: 'card paper colour',
    cardSrc: 'optional image (public/ path or URL) printed on the card instead of the doodle',
    handSize: 'hand length in u (1u = 1 px on a 1080 short side)',
    ink: 'outline ink colour',
    seed: 'seed for the corkboard notes and textures',
  },
  component: CreatorHand,
  tags: ['hand', 'giant-hand', 'creator', 'storybook', 'gouache', 'illustration', 'idea', 'card', 'desk', 'corkboard', 'laptop', 'on-twos', 'promo', 'tutorial', 'overlay', 'sweater', 'cosy', 'x4'],
});
