// Adapted from lemo-opuscar/styles/silent-film/demo/engine/cards.js (theatre), DEMO.md "Frame" (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Layers, LayerSpec} from '../../Layers';
import {Plate} from '../../core/image-kit';
import {resolveSrc} from '../../core/asset';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FilmDamage, eio3, flickerAt, fx, mixHex, seg, useUid, weaveAt} from '../../core/r2-lb2-kit';

/**
 * Wrapper / overlay: the picture is a 4:3 print in a rounded aperture with a soft dark rim, flanked by deep red-brown
 * velvet drapes lit by the screen's spill (modulated by the print flicker) and by footlights; curtains part at the
 * start and close at the end. Pass `layers` (any motions, rendered full-frame and clipped to the aperture), an image
 * `src`, or leave both empty for the procedural plate.
 */
type Props = {
  layers: LayerSpec[];
  src: string;
  aspect: number;
  openAt: number;
  openFrames: number;
  closeAt: number;
  closeFrames: number;
  drapeColor: string;
  footlights: boolean;
  spill: number;
  radius: number;
  grade: boolean;
  damage: number;
  seed: number;
};

const TheatreGate: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames, portrait} = useStage();
  const id = useUid('thg');
  // aperture: aspect-ratio box fitted into the frame with room for drapes
  const maxW = w * (portrait ? 0.9 : 0.8);
  const maxH = h * (portrait ? 0.9 : 0.94);
  let gw = maxW;
  let gh = gw / p.aspect;
  if (gh > maxH) {
    gh = maxH;
    gw = gh * p.aspect;
  }
  const gx = (w - gw) / 2;
  const gy = (h - gh) / 2;
  const rad = p.radius * u;
  const fl = flickerAt(frame, 0.8);
  const wv = weaveAt(frame, 0.5);
  const open = eio3(seg(frame, p.openAt, p.openAt + p.openFrames));
  const close = p.closeAt >= 0 ? eio3(seg(frame, p.closeAt, p.closeAt + p.closeFrames)) : 0;
  const curtain = open * (1 - close); // 1 = fully open
  const push = 1 + 0.05 * (frame / Math.max(1, durationInFrames));
  const dark = mixHex(p.drapeColor, '#000000', 0.55);
  const per = 54 * u;
  const spillA = p.spill * (0.55 + 0.45 * fl);

  const drapeFill = (key: string) => (
    <linearGradient id={`${id}${key}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={per} y2="0" spreadMethod="repeat">
      <stop offset="0" stopColor={dark} />
      <stop offset="0.3" stopColor={p.drapeColor} />
      <stop offset="0.5" stopColor={mixHex(p.drapeColor, '#ffffff', 0.08)} />
      <stop offset="0.75" stopColor={p.drapeColor} />
      <stop offset="1" stopColor={dark} />
    </linearGradient>
  );
  // half-curtains: slide to the sides, folds bunch up as they gather
  const halfW = w / 2 + 6 * u;
  const lx = -halfW * curtain;
  const rx = w / 2 - 6 * u + halfW * curtain;

  const content = (() => {
    if (p.layers.length > 0)
      return (
        <div style={{position: 'absolute', left: -gx, top: -gy, width: w, height: h}}>
          <Layers layers={p.layers} length={durationInFrames} />
        </div>
      );
    return <Plate src={p.src || undefined} seed={p.seed} palette="dusk" width={gw} height={gh} />;
  })();
  void resolveSrc;

  return (
    <AbsoluteFill style={{background: '#050202'}}>
      {/* the print (behind the drapes) */}
      <div
        style={{
          position: 'absolute',
          left: gx,
          top: gy,
          width: gw,
          height: gh,
          borderRadius: rad,
          overflow: 'hidden',
          background: '#000',
          filter: p.grade ? `sepia(0.55) contrast(1.1) brightness(${0.92 * fl})` : `brightness(${fl})`,
          transform: `translate(${wv.x * u}px,${wv.y * u}px)`,
        }}
      >
        <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '50% 50%'}}>{content}</div>
      </div>
      <Svg>
        <defs>
          {drapeFill('d')}
          <mask id={`${id}hole`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect width={w} height={h} fill="#fff" />
            <rect x={gx} y={gy} width={gw} height={gh} rx={rad} fill="#000" />
          </mask>
          <linearGradient id={`${id}spl`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={w} y2={0}>
            <stop offset="0" stopColor="#ffd9a0" stopOpacity={0} />
            <stop offset={Math.max(0.01, (gx - gw * 0.28) / w)} stopColor="#ffd9a0" stopOpacity={0.05} />
            <stop offset={gx / w} stopColor="#ffd9a0" stopOpacity={0.6} />
            <stop offset={(gx + gw) / w} stopColor="#ffd9a0" stopOpacity={0.6} />
            <stop offset={Math.min(0.99, (gx + gw + gw * 0.28) / w)} stopColor="#ffd9a0" stopOpacity={0.05} />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${id}spv`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={h}>
            <stop offset="0" stopColor="#ffd9a0" stopOpacity={0} />
            <stop offset={Math.max(0.01, (gy - gh * 0.2) / h)} stopColor="#ffd9a0" stopOpacity={portrait ? 0.05 : 0} />
            <stop offset={gy / h} stopColor="#ffd9a0" stopOpacity={portrait ? 0.6 : 0.3} />
            <stop offset={(gy + gh) / h} stopColor="#ffd9a0" stopOpacity={portrait ? 0.6 : 0.3} />
            <stop offset={Math.min(0.99, (gy + gh + gh * 0.2) / h)} stopColor="#ffd9a0" stopOpacity={portrait ? 0.05 : 0} />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${id}ft`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ffb25a" stopOpacity={0.5} />
            <stop offset="1" stopColor="#ffb25a" stopOpacity={0} />
          </linearGradient>
          <radialGradient id={`${id}rim`} cx="50%" cy="50%" r="72%">
            <stop offset="0.8" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.5} />
          </radialGradient>
          <filter id={`${id}sf`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={6 * u} />
          </filter>
          <linearGradient id={`${id}dk`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0.55} />
            <stop offset="0.25" stopColor="#000" stopOpacity={0} />
            <stop offset="0.75" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        {/* fixed drapes with the aperture cut out */}
        <g mask={`url(#${id}hole)`}>
          <rect width={w} height={h} fill={`url(#${id}d)`} />
          <rect width={w} height={h} fill={`url(#${id}spl)`} opacity={spillA * 0.22} style={{mixBlendMode: 'screen'}} />
          <rect width={w} height={h} fill={`url(#${id}spv)`} opacity={spillA * 0.22} style={{mixBlendMode: 'screen'}} />
          <rect width={w} height={h} fill={`url(#${id}dk)`} />
          {p.footlights && <rect x={0} y={h * 0.88} width={w} height={h * 0.12} fill={`url(#${id}ft)`} style={{mixBlendMode: 'screen'}} />}
        </g>
        {/* soft dark rim around the aperture */}
        <rect x={gx - 6 * u} y={gy - 6 * u} width={gw + 12 * u} height={gh + 12 * u} rx={rad + 6 * u} fill="none" stroke="#000" strokeWidth={14 * u} opacity={0.55} filter={`url(#${id}sf)`} />
        <rect x={gx} y={gy} width={gw} height={gh} rx={rad} fill="none" stroke="#000" strokeWidth={3 * u} opacity={0.6} />
        {p.damage > 0 && (
          <g clipPath={`url(#${id}ap)`}>
            <clipPath id={`${id}ap`}>
              <rect x={gx} y={gy} width={gw} height={gh} rx={rad} />
            </clipPath>
            <FilmDamage x={gx} y={gy} w={gw} h={gh} u={u} frame={frame} k={0.6 * p.damage} id={`${id}fd`} />
          </g>
        )}
        {/* curtains */}
        {[lx, rx].map((x, i) => (
          <g key={i} opacity={curtain >= 0.999 ? 0 : 1}>
            <g transform={`translate(${fx(x)},0)`}>
              <rect x={0} y={0} width={halfW} height={h} fill={`url(#${id}d)`} />
              <rect x={0} y={0} width={halfW} height={h} fill={`url(#${id}dk)`} />
              <rect x={i === 0 ? halfW - 5 * u : 0} y={0} width={5 * u} height={h} fill="#000" opacity={0.5} />
            </g>
          </g>
        ))}
        {/* valance */}
        <rect x={0} y={0} width={w} height={h * 0.035} fill={dark} />
        <rect x={0} y={h * 0.035} width={w} height={4 * u} fill="#000" opacity={0.5} />
      </Svg>
    </AbsoluteFill>
  );
};

export const theatreGate = defineMotion<Props>({
  id: 'theatre-gate',
  title: 'Theatre gate (framed film print)',
  category: 'fx',
  description:
    'Frames any picture or motion as a film being shown: a 4:3 print in a rounded aperture with a soft dark rim, flanked by deep red-brown velvet drapes lit by the screen spill and footlights, with curtains that part at the start and close at the end.',
  source: ['lemo-opuscar styles/silent-film demo/engine/cards.js (theatre), DEMO.md "Frame", poster.jpg (MIT, LemoLab)'],
  useFor: 'Frames any motion as "a film being shown": retro launches, the-story-so-far, nostalgia pieces; solves 4:3 content inside 16:9 frames; wraps other motions via `layers`.',
  durationInFrames: 180,
  defaultProps: {
    layers: [],
    src: '',
    aspect: 1.3333,
    openAt: 8,
    openFrames: 46,
    closeAt: 132,
    closeFrames: 44,
    drapeColor: '#3a1410',
    footlights: true,
    spill: 1,
    radius: 22,
    grade: true,
    damage: 1,
    seed: 3,
  },
  propDocs: {
    layers: 'motions to show inside the aperture [{motion, props, from, duration, ...}] (rendered full-frame and clipped)',
    src: 'image for the print (public path or URL); empty + no layers = procedural plate',
    aspect: 'aperture width/height (4/3)',
    openAt: 'frame the curtains start to part',
    openFrames: 'frames to part',
    closeAt: 'frame the curtains start to close (-1 = stay open)',
    closeFrames: 'frames to close',
    drapeColor: 'velvet colour',
    footlights: 'warm footlight glow along the bottom',
    spill: 'screen spill on the drapes (0..1.5)',
    radius: 'aperture corner radius in u',
    grade: 'sepia print grade',
    damage: 'print damage 0..1 (scratches, dust, flicker)',
    seed: 'procedural plate seed',
  },
  component: TheatreGate,
  tags: ['frame', 'wrapper', 'overlay', 'theatre', 'curtains', 'drapes', 'cinema', 'film', 'retro', 'nostalgia', '4:3', 'aperture', 'footlights', 'stage', 'story so far'],
});
