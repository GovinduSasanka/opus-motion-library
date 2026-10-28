import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ease, prog} from '../../core/ease';
import {rng} from '../../core/random';
import {ActionTicks, Cobbles, Shrub, CreatorArm, GouacheFinish, SB, SideHouse, StoryTown, Workshop, useX4Id, windowPath, workshopGeo, x14Fonts} from '../../core/r2-x14-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * x4 window-glow-sequence (7.5–10.5 s): a still storybook workshop "powers up" — its arched windows turn
 * golden one after another (≈ 0.2 s stagger, 0.15 s fade, one flicker), a soft bloom spills onto the
 * brickwork, action ticks flicker over the roof hopper, the tower cog speeds up and puffs of smoke rise,
 * while the giant creator hand that dropped the idea in withdraws. Procedural gouache street by default;
 * pass `src` + normalised `windows` to light the windows of any building picture.
 */

type Win = {x: number; y: number; w: number; h: number; shape?: 'arch' | 'round' | 'rect'};
type Props = {
  background: string;
  src: string;
  windows: Win[];
  order: 'ltr' | 'rtl' | 'random' | 'center-out';
  startAt: number;
  stagger: number;
  fadeFrames: number;
  flicker: number;
  glowColor: string;
  hand: boolean;
  ticks: boolean;
  tickAt: number[];
  sign: string;
  smoke: boolean;
  push: number;
  seed: number;
};

const WindowGlowSequence: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const id = useX4Id('wglow');
  const lw = Math.max(1.2, 2 * u);
  const s = Math.min((w * 0.92) / 1050, (h * 0.7) / 820);
  const baseY = portrait ? h * 0.62 : h * 0.8;
  const bx = portrait ? w * 0.5 : w * 0.53;
  const horizon = baseY - (portrait ? 0.07 : 0.15) * h;
  const geo = workshopGeo(bx, baseY, s);
  const scene = p.background === 'scene' && !p.src;
  const custom = p.windows.length > 0 || !!p.src;
  const wins: Win[] = custom ? p.windows.map((v) => ({x: v.x * w, y: v.y * h, w: v.w * w, h: v.h * h, shape: v.shape ?? 'arch'})) : geo.windows;
  const n = wins.length;

  // order of lighting
  const idx = Array.from({length: n}, (_, i) => i);
  let ord = idx;
  if (p.order === 'rtl') ord = idx.slice().reverse();
  else if (p.order === 'random') {
    const r = rng(p.seed);
    ord = idx.map((i) => ({i, k: r()})).sort((a, b) => a.k - b.k).map((o) => o.i);
  } else if (p.order === 'center-out') ord = idx.slice().sort((a, b) => Math.abs(wins[a].x + wins[a].w / 2 - w / 2) - Math.abs(wins[b].x + wins[b].w / 2 - w / 2));
  const onAt = new Array(n).fill(0);
  ord.forEach((wi, k) => (onAt[wi] = p.startAt + k * p.stagger));
  const glow = idx.map((i) => {
    let g = prog(frame, onAt[i], onAt[i] + p.fadeFrames, ease.out);
    const fl = onAt[i] + p.fadeFrames + 4;
    if (i === p.flicker && frame >= fl && frame < fl + 3) g *= frame === fl + 1 ? 0.15 : 0.35;
    return g;
  });
  const lastOn = Math.max(...onAt) + p.fadeFrames;
  const breathe = prog(frame, lastOn, lastOn + 20, ease.sine);
  const gearAngle = 0.4 * frame + 1.8 * Math.max(0, frame - (p.startAt + 10)) + 0.012 * Math.max(0, frame - (p.startAt + 10)) ** 2;
  const smoke = p.smoke ? prog(frame, p.startAt + 12, p.startAt + 50, ease.sine) : 0;
  const zoom = 1 + p.push * prog(frame, 0, D, ease.sine);

  // giant hand: hovers top-left over the hopper, then withdraws
  const hx = geo.hopper.x - 0.06 * w;
  const hy = Math.max(0.1 * h, geo.hopper.y - 0.2 * h);
  const out = prog(frame, 64, 100, ease.in);
  const hand = {x: hx - 0.12 * w * out + Math.sin(frame * 0.08) * 3 * u, y: hy - 0.45 * h * out + Math.sin(frame * 0.11) * 4 * u};
  const tick = p.tickAt.length >= 2 ? {x: p.tickAt[0] * w, y: p.tickAt[1] * h} : {x: geo.hopper.x, y: geo.hopper.y - 14 * s};
  const tickOn = p.ticks && frame >= 6 && frame < lastOn + 6 && (frame - 6) % 12 < 8;

  return (
    <AbsoluteFill style={{background: p.background === 'transparent' ? 'transparent' : p.background === 'scene' ? SB.skyLow : p.background}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${(bx / w) * 100}% ${(baseY / h) * 70}%`}}>
        {p.src ? <Img src={resolveSrc(p.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
        <Svg>
          {scene && (
            <g>
              <StoryTown w={w} h={h} horizon={horizon} s={s} frame={frame} seed={p.seed} />
              <Cobbles w={w} h={h} top={horizon + 0.03 * h} s={s * 1.1} seed={p.seed + 1} />
              <Workshop x={bx} y={baseY} s={s} frame={frame} lw={lw} glow={glow} sign={p.sign} signFont={x14Fonts.softSerif} gearAngle={gearAngle} smoke={smoke} glowColor={p.glowColor} breathe={breathe} />
              <Shrub x={geo.left - 20 * s} y={baseY + 6 * s} s={s * 0.9} seed={p.seed} frame={frame} />
              <Shrub x={geo.right + 30 * s} y={baseY + 10 * s} s={s * 0.8} seed={p.seed + 1} frame={frame} />
              {portrait && <Shrub x={w * 0.1} y={h * 0.93} s={s * 1.7} seed={p.seed + 2} planter frame={frame} lw={lw} />}
              {portrait && <Shrub x={w * 0.88} y={h * 0.97} s={s * 2} seed={p.seed + 3} planter frame={frame} lw={lw} />}
              {!portrait && <SideHouse side="left" w={w} h={h} ground={baseY + 0.05 * h} s={s * 1.15} lw={lw} frame={frame} />}
              {!portrait && <SideHouse side="right" w={w} h={h} ground={baseY + 0.08 * h} s={s * 1.1} lw={lw} frame={frame} lamp={false} />}
            </g>
          )}
          {!scene && (
            <g>
              <defs>
                <radialGradient id={`${id}lit`} cx="50%" cy="60%" r="65%">
                  <stop offset="0" stopColor={SB.glowCore} />
                  <stop offset="1" stopColor={SB.glowEdge} />
                </radialGradient>
                <filter id={`${id}b`} x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation={12 * u} />
                </filter>
              </defs>
              {wins.map((v, i) => (
                <path key={i} d={windowPath(v.x, v.y, v.w, v.h, v.shape ?? 'arch')} fill={`url(#${id}lit)`} opacity={glow[i] * 0.92} style={{mixBlendMode: 'screen'}} />
              ))}
              <g filter={`url(#${id}b)`} style={{mixBlendMode: 'screen'}}>
                {wins.map((v, i) => (
                  <path key={i} d={windowPath(v.x - 6 * u, v.y - 6 * u, v.w + 12 * u, v.h + 12 * u, v.shape ?? 'arch')} fill={p.glowColor} opacity={glow[i] * 0.55 * (1 + breathe * 0.06 * Math.sin(frame * 0.13 + i * 1.7))} />
                ))}
              </g>
            </g>
          )}
          {tickOn && <ActionTicks frame={frame} x={tick.x} y={tick.y} size={70 * s * 1.3} dir={-90} spread={90} count={4} seed={p.seed} width={lw * 1.3} every={3} />}
        </Svg>
      </AbsoluteFill>
      {p.hand && out < 1 && (
        <Svg>
          <CreatorArm px={hand.x} py={hand.y} ax={hand.x - 0.3 * w} ay={-0.3 * h} size={230 * u} pose={1} lw={lw * 1.1} />
        </Svg>
      )}
      {p.background !== 'transparent' && <GouacheFinish w={w} h={h} seed={p.seed} vignette={0.12} />}
    </AbsoluteFill>
  );
};

export const windowGlowSequence = defineMotion<Props>({
  id: 'window-glow-sequence',
  title: 'Window glow sequence',
  category: 'environment',
  description:
    'A storybook brick workshop powers up: its arched windows turn golden one after another with a warm bloom and one flicker, action ticks flicker over the roof hopper, the tower cog speeds up and smoke puffs rise as a giant hand withdraws.',
  source: ['video x4 0:07.5-0:10.5 (window-glow-sequence, action-ticks)'],
  useFor: '"It\'s alive / powering up / open for business" beats; light the windows of any building image (src + windows) — factories, shops, houses, city shots.',
  durationInFrames: 120,
  defaultProps: {
    background: 'scene',
    src: '',
    windows: [],
    order: 'ltr',
    startAt: 24,
    stagger: 6,
    fadeFrames: 5,
    flicker: 3,
    glowColor: '#F2C66E',
    hand: true,
    ticks: true,
    tickAt: [],
    sign: '',
    smoke: true,
    push: 0.035,
    seed: 3,
  },
  propDocs: {
    background: "'scene' = procedural gouache street + workshop, 'transparent' = glow overlay only, or a CSS colour",
    src: 'optional building picture (public/ path or URL); then list its windows in `windows`',
    windows: 'normalised frame rects [{x, y, w, h, shape: arch|round|rect}] to light; empty = the procedural workshop windows',
    order: 'lighting order: ltr | rtl | random | center-out',
    startAt: 'frame the first window lights',
    stagger: 'frames between windows (≈ 0.2 s)',
    fadeFrames: 'fade-in length per window',
    flicker: 'index of the window that flickers once after lighting (-1 = none)',
    glowColor: 'bloom colour',
    hand: 'show the giant creator hand withdrawing at the top',
    ticks: 'flicker action ticks over the hopper (or at tickAt)',
    tickAt: 'normalised [x, y] for the action ticks (empty = above the hopper)',
    sign: 'text on the blank plaque above the door (empty = blank)',
    smoke: 'tower smoke puffs after power-up',
    push: 'slow camera push-in amount over the shot',
    seed: 'town / cloud / random-order seed',
  },
  component: WindowGlowSequence,
  tags: ['windows', 'glow', 'light-up', 'power-on', 'building', 'factory', 'workshop', 'storybook', 'gouache', 'illustration', 'bloom', 'flicker', 'action-ticks', 'emanata', 'overlay', 'town', 'warm', 'x4'],
});
