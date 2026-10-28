// Adapted from lemo-opuscar/styles/paper-popup/demo/paper.js (finishCut) and cutmesh.js (cut-out shadow) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FlatIcon} from '../../core/ui-kit';
import {PaperGrainFilter, StickerFilter, back, fitW, lbf, seg} from '../../core/r2-lb1-kit';

/**
 * Die-cut sticker finish: any subject (icon, word, transparent PNG) gets a thick rounded off-white border, a thin
 * grey cardboard edge peeking out below it, paper grain, and a soft cut-out-shaped shadow — instantly a paper sticker
 * / pop-up card. Stickers slap down one by one with a back-ease and sway gently. The filter works on any alpha.
 */

type Item = {kind: 'icon' | 'text' | 'src'; icon?: string; text?: string; src?: string; color?: string; x: number; y: number; size: number; rot: number; at: number};
type Props = {
  items: Item[];
  border: number;
  color: string;
  edge: string;
  shadow: number;
  ink: string;
  grain: number;
  sway: number;
  paper: string;
  background: string;
};

const StickerCutout: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'sticker-cutout';
  const transparent = p.background === 'transparent';
  const S = Math.min(w, h);
  return (
    <AbsoluteFill style={{background: transparent ? 'transparent' : p.paper, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <StickerFilter id={`${id}-f`} u={u} width={p.border} color={p.color} edge={p.edge} shadow={p.shadow} />
          <PaperGrainFilter id={`${id}-g`} u={u} amount={p.grain} />
          <pattern id={`${id}-dots`} patternUnits="userSpaceOnUse" width={36 * u} height={36 * u}>
            <circle cx={18 * u} cy={18 * u} r={2 * u} fill="#3A2A24" opacity={0.12} />
          </pattern>
        </defs>
        {!transparent && <rect width={w} height={h} fill={`url(#${id}-dots)`} />}
        {p.items.map((it, i) => {
          const k = back(seg(frame, it.at, it.at + 9), 1.9);
          if (k <= 0) return null;
          const drop = 1 + (1 - Math.min(1, seg(frame, it.at, it.at + 6))) * 0.35;
          const x = (portrait ? 0.5 + (it.x - 0.5) * 0.9 : it.x) * w;
          const y = (portrait ? 0.5 + (it.y - 0.5) * 0.8 : it.y) * h;
          const sz = it.size * S;
          const rot = it.rot + Math.sin(frame * 0.05 + i * 1.9) * p.sway;
          let art: React.ReactNode = null;
          if (it.kind === 'icon') art = <FlatIcon kind={it.icon ?? 'star'} x={0} y={0} s={sz} ink={p.ink} />;
          else if (it.kind === 'src' && it.src)
            art = (
              <foreignObject x={-sz / 2} y={-sz / 2} width={sz} height={sz}>
                <Img src={resolveSrc(it.src)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
              </foreignObject>
            );
          else {
            const txt = it.text ?? 'Hello!';
            const fs = fitW(txt, sz * 0.62, sz * 1.9, 'lilita');
            art = (
              <text x={0} y={fs * 0.35} textAnchor="middle" fontFamily={lbf('lilita')} fontSize={fs} fill={it.color ?? '#FFCF3F'} stroke={p.ink} strokeWidth={fs * 0.09} strokeLinejoin="round" style={{paintOrder: 'stroke'}}>
                {txt}
              </text>
            );
          }
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${k * drop})`}>
              <g filter={`url(#${id}-f)`}>
                <g filter={`url(#${id}-g)`}>{art}</g>
              </g>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const stickerCutout = defineMotion<Props>({
  id: 'sticker-cutout',
  title: 'Sticker cut-out (die-cut border)',
  category: 'fx',
  description:
    'Paper-sticker finish for any subject: a thick rounded off-white die-cut border, a thin grey cardboard edge peeking out below, paper grain and a soft cut-out-shaped shadow; icons, words and transparent images slap down one by one with a back-ease and sway gently.',
  source: ['lemo-opuscar styles/paper-popup (MIT code, CC BY 4.0 docs, LemoLab) — demo/paper.js finishCut, cutmesh.js'],
  useFor: 'Kids / game / social sticker moments, scrapbook explainers, craft-made icon sets; wrap a product PNG to make it a sticker.',
  durationInFrames: 120,
  defaultProps: {
    items: [
      {kind: 'icon', icon: 'heart', x: 0.25, y: 0.36, size: 0.36, rot: -8, at: 4},
      {kind: 'text', text: 'Hello!', color: '#FFCF3F', x: 0.52, y: 0.62, size: 0.3, rot: 4, at: 16},
      {kind: 'icon', icon: 'coffee', x: 0.76, y: 0.34, size: 0.34, rot: 9, at: 28},
      {kind: 'icon', icon: 'star', x: 0.2, y: 0.76, size: 0.22, rot: 14, at: 40},
      {kind: 'icon', icon: 'leaf', x: 0.83, y: 0.74, size: 0.22, rot: -12, at: 50},
    ],
    border: 14,
    color: '#FFFDF7',
    edge: '#B9AD9C',
    shadow: 0.3,
    ink: '#3A2A24',
    grain: 0.18,
    sway: 1.5,
    paper: '#E9DCC3',
    background: 'paper',
  },
  propDocs: {
    items: 'stickers [{kind: icon|text|src, icon? (FlatIcon kind: heart, star, coffee, leaf, sun, moon, bolt, gear, chat, check, flame…), text?, src?, color?, x, y (0..1), size (fraction of short side), rot (deg), at (frame)}]',
    border: 'die-cut border width in u (12–16)',
    color: 'border colour',
    edge: 'cardboard edge colour',
    shadow: 'cut-out shadow opacity',
    ink: 'outline ink for icons / text',
    grain: 'paper grain amount',
    sway: 'idle sway in degrees',
    paper: 'desk paper colour',
    background: '"paper" or "transparent" (overlay)',
  },
  component: StickerCutout,
  tags: ['sticker', 'die cut', 'paper', 'border', 'cut out', 'craft', 'kids', 'scrapbook', 'pop', 'slap', 'icons', 'overlay', 'outline'],
});
