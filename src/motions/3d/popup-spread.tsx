// Adapted from lemo-opuscar/styles/paper-popup/demo/sets.js (popper, updatePops, RISE/FOLD) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {PaperGrainFilter, StickerFilter, back, clamp, eio, lbf, seg} from '../../core/r2-lb1-kit';

/**
 * Pop-up book spread (CSS-3D, no WebGL): an open book lies on a walnut desk; when the spread rises, flat cut-paper
 * cards lying on the page flip up around their bottom edges with a springy overshoot — back row first, then forward —
 * each with an off-white die-cut border, a cut-out shaped contact shadow and a gentle sway; at the end they fold down
 * again in the same order. Card art is procedural (hill, pine, mushroom house, cloud, sun, sign, fence, flower, tree).
 */

type Piece = {art: string; x: number; z: number; scale: number; color?: string; label?: string};
type Props = {
  pieces: Piece[];
  spreadColor: string;
  skyColor: string;
  riseAt: number;
  stagger: number;
  foldAt: number;
  tilt: number;
  sway: number;
  ink: string;
  desk: string;
  border: number;
  background: string;
};

const INK = '#3A2A24';

/** card art in a 200×200 box, bottom-centre at (100, 200) */
const Art: React.FC<{art: string; color?: string; label?: string; ink: string}> = ({art, color, label, ink}) => {
  const sw = 6;
  switch (art) {
    case 'hill':
      return <path d="M0 200 C30 90 170 90 200 200 Z" fill={color ?? '#8FD06E'} stroke={ink} strokeWidth={sw} />;
    case 'pine':
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <rect x={90} y={160} width={20} height={40} fill="#8B5A3C" />
          <path d="M100 10 L150 80 L128 80 L165 130 L138 130 L178 175 L22 175 L62 130 L35 130 L72 80 L50 80 Z" fill={color ?? '#3F9A5C'} />
        </g>
      );
    case 'tree':
      return (
        <g stroke={ink} strokeWidth={sw}>
          <rect x={88} y={120} width={24} height={80} fill="#8B5A3C" />
          <circle cx={100} cy={80} r={68} fill={color ?? '#6FB553'} />
          <path d="M70 70 q12 -18 28 -6" fill="none" stroke="#B5E39A" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    case 'mushHouse':
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <rect x={52} y={100} width={96} height={100} rx={14} fill="#F3E3C2" />
          <path d="M84 200 v-46 a16 16 0 0 1 32 0 v46" fill="#B07040" />
          <path d="M8 112 C10 20 190 20 192 112 Z" fill={color ?? '#E8413A'} />
          <circle cx={60} cy={70} r={14} fill="#FFF5E0" strokeWidth={0} />
          <circle cx={120} cy={52} r={11} fill="#FFF5E0" strokeWidth={0} />
          <circle cx={150} cy={88} r={10} fill="#FFF5E0" strokeWidth={0} />
        </g>
      );
    case 'cloud':
      return <path d="M30 170 a34 34 0 0 1 20 -62 a46 46 0 0 1 84 -14 a36 36 0 0 1 40 76 Z" fill={color ?? '#FFFFFF'} stroke={ink} strokeWidth={sw} />;
    case 'sun':
      return (
        <g stroke={ink} strokeWidth={sw}>
          <rect x={95} y={120} width={10} height={80} fill="#B07040" />
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <path key={i} d={`M${100 + Math.cos(a) * 58} ${78 + Math.sin(a) * 58} L${100 + Math.cos(a + 0.18) * 80} ${78 + Math.sin(a + 0.18) * 80} L${100 + Math.cos(a + 0.36) * 58} ${78 + Math.sin(a + 0.36) * 58}Z`} fill="#FFB43A" strokeWidth={4} />;
          })}
          <circle cx={100} cy={78} r={56} fill={color ?? '#FFD766'} />
        </g>
      );
    case 'sign':
      return (
        <g stroke={ink} strokeWidth={sw}>
          <rect x={92} y={110} width={16} height={90} fill="#8B5A3C" />
          <rect x={10} y={50} width={180} height={76} rx={10} fill={color ?? '#F5E3B8'} />
          <text x={100} y={102} textAnchor="middle" fontFamily={lbf('fredoka')} fontWeight={700} fontSize={label && label.length > 8 ? 26 : 34} fill={ink} stroke="none">
            {label ?? 'Welcome'}
          </text>
        </g>
      );
    case 'fence':
      return (
        <g stroke={ink} strokeWidth={sw} fill={color ?? '#FFF5E0'}>
          <rect x={0} y={120} width={200} height={20} />
          <rect x={0} y={165} width={200} height={20} />
          {[10, 60, 110, 160].map((x) => (
            <path key={x} d={`M${x} 200 V100 L${x + 15} 80 L${x + 30} 100 V200 Z`} />
          ))}
        </g>
      );
    case 'flower':
    default:
      return (
        <g stroke={ink} strokeWidth={sw}>
          <path d="M100 200 V100" />
          <path d="M100 160 q-36 -6 -40 -34 q32 0 40 26" fill="#62A653" />
          {Array.from({length: 6}, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return <circle key={i} cx={100 + Math.cos(a) * 30} cy={70 + Math.sin(a) * 30} r={22} fill={color ?? '#B07FD8'} />;
          })}
          <circle cx={100} cy={70} r={18} fill="#FFD766" />
        </g>
      );
  }
};

const PopupSpread: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'popup-spread';
  const bw = Math.min(w * (portrait ? 0.98 : 0.84), h * 1.7);
  const bh = bw * 0.62;
  const t = frame / 30;
  const push = 1 + 0.05 * eio(seg(frame, 0, 240));
  const sorted = [...p.pieces].map((pc, i) => ({...pc, i})).sort((a, b) => a.z - b.z);
  return (
    <AbsoluteFill style={{background: p.background === 'desk' ? `radial-gradient(ellipse at 50% 30%, #C9A88A 0%, ${p.desk} 75%)` : p.background, overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <StickerFilter id={`${id}-st`} u={1} width={p.border} shadow={0} />
          <PaperGrainFilter id={`${id}-gr`} u={1} amount={0.16} />
        </defs>
      </svg>
      {/* wood grain */}
      {p.background === 'desk' &&
        Array.from({length: 14}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: `${(i / 14) * 100}%`, height: 2 * u, background: 'rgba(60,30,10,0.12)', transform: `skewY(${(i % 3) - 1}deg)`}} />
        ))}
      <AbsoluteFill style={{perspective: `${1500 * u}px`, perspectiveOrigin: '50% 20%', transform: `scale(${push})`}}>
        <div
          style={{
            position: 'absolute',
            left: (w - bw) / 2,
            top: h * (portrait ? 0.5 : 0.48) - bh / 2,
            width: bw,
            height: bh,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${p.tilt}deg)`,
          }}
        >
          {/* page stack + cover */}
          <div style={{position: 'absolute', inset: -16 * u, background: '#7A2E22', borderRadius: 14 * u, transform: `translateZ(${-14 * u}px)`, boxShadow: `0 ${40 * u}px ${60 * u}px rgba(30,15,5,0.55)`}} />
          <div style={{position: 'absolute', inset: -4 * u, background: '#EFE8DA', borderRadius: 6 * u, transform: `translateZ(${-6 * u}px)`}} />
          {/* the spread */}
          <div style={{position: 'absolute', inset: 0, borderRadius: 4 * u, overflow: 'hidden', background: `linear-gradient(180deg, ${p.skyColor} 0%, ${p.skyColor} 38%, ${p.spreadColor} 38.5%, ${p.spreadColor} 100%)`}}>
            <div style={{position: 'absolute', left: '49%', width: '2%', top: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(40,20,10,0.35) 50%, rgba(0,0,0,0) 100%)'}} />
            <div style={{position: 'absolute', left: '8%', right: '8%', top: '58%', height: '14%', borderRadius: '50%', background: '#ECD49A', opacity: 0.85}} />
          </div>
          {/* contact shadows */}
          {sorted.map((pc) => {
            const t0 = p.riseAt + pc.z * p.stagger;
            const k = clamp(back(seg(frame, t0, t0 + 16), 1.7)) * (1 - eio(seg(frame, p.foldAt + pc.z * p.stagger * 0.6, p.foldAt + pc.z * p.stagger * 0.6 + 14)));
            const cw = pc.scale * bw * 0.22;
            return (
              <div
                key={'s' + pc.i}
                style={{
                  position: 'absolute',
                  left: pc.x * bw - cw / 2,
                  top: (0.3 + pc.z * 0.62) * bh - cw * 0.18 * k,
                  width: cw,
                  height: cw * 0.22 * Math.max(0.15, k),
                  borderRadius: '50%',
                  background: 'rgba(40,25,10,0.35)',
                  filter: `blur(${6 * u}px)`,
                  transform: `translateZ(${0.5 * u}px)`,
                }}
              />
            );
          })}
          {/* cards */}
          {sorted.map((pc) => {
            const t0 = p.riseAt + pc.z * p.stagger;
            const rise = back(seg(frame, t0, t0 + 16), 1.7);
            const fold = eio(seg(frame, p.foldAt + pc.z * p.stagger * 0.6, p.foldAt + pc.z * p.stagger * 0.6 + 14));
            const k = rise * (1 - fold);
            const sway = Math.sin(1.6 * t + pc.i * 1.3) * p.sway * Math.min(1, rise) * (1 - fold);
            const cw = pc.scale * bw * 0.22;
            const angle = -90 * k + sway; // 0 = lying flat on the page, -90 = standing
            return (
              <div
                key={pc.i}
                style={{
                  position: 'absolute',
                  left: pc.x * bw - cw / 2,
                  top: (0.3 + pc.z * 0.62) * bh - cw,
                  width: cw,
                  height: cw,
                  transformOrigin: '50% 100%',
                  transform: `translateZ(${1 * u}px) rotateX(${angle}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <svg viewBox="-30 -30 260 260" width={cw * 1.3} height={cw * 1.3} style={{position: 'absolute', left: -cw * 0.15, top: -cw * 0.15, overflow: 'visible', filter: `brightness(${0.82 + 0.18 * k})`}}>
                  <g filter={`url(#${id}-st)`}>
                    <g filter={`url(#${id}-gr)`}>
                      <Art art={pc.art} color={pc.color} label={pc.label} ink={p.ink} />
                    </g>
                  </g>
                </svg>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(30,15,5,0.45) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const popupSpread = defineMotion<Props>({
  id: 'popup-spread',
  title: 'Pop-up book spread',
  category: '3d',
  description:
    'An open pop-up book on a walnut desk: flat cut-paper cards with die-cut borders flip up around their bottom edges with a springy overshoot — back row first, then forward — sway gently with soft contact shadows, and fold back down in the same order at the end. CSS-3D (no WebGL), so it is light enough for web heroes.',
  source: ['lemo-opuscar styles/paper-popup (MIT code, CC BY 4.0 docs, LemoLab) — demo/sets.js popper/updatePops, DEMO.md motion numbers'],
  useFor: "Children's stories, game trailers, feature-set 'unboxing', onboarding chapters, kids' edtech, playful website heroes.",
  durationInFrames: 240,
  defaultProps: {
    pieces: [
      {art: 'cloud', x: 0.22, z: 0.0, scale: 0.7},
      {art: 'sun', x: 0.8, z: 0.0, scale: 0.85},
      {art: 'hill', x: 0.38, z: 0.12, scale: 1.25},
      {art: 'hill', x: 0.66, z: 0.14, scale: 1.05, color: '#A9DD8C'},
      {art: 'pine', x: 0.12, z: 0.3, scale: 0.95},
      {art: 'mushHouse', x: 0.32, z: 0.42, scale: 1.05},
      {art: 'tree', x: 0.58, z: 0.4, scale: 0.85},
      {art: 'fence', x: 0.5, z: 0.62, scale: 0.75},
      {art: 'sign', x: 0.82, z: 0.6, scale: 0.75, label: 'Meadow'},
      {art: 'flower', x: 0.16, z: 0.82, scale: 0.5},
      {art: 'flower', x: 0.7, z: 0.86, scale: 0.45, color: '#F07A6A'},
    ],
    spreadColor: '#86C763',
    skyColor: '#9FD8F2',
    riseAt: 10,
    stagger: 36,
    foldAt: 200,
    tilt: 52,
    sway: 2.5,
    ink: INK,
    desk: '#5A3A22',
    border: 12,
    background: 'desk',
  },
  propDocs: {
    pieces: 'cards [{art: hill|pine|tree|mushHouse|cloud|sun|sign|fence|flower, x (0..1 across the spread), z (0 back … 1 front), scale, color?, label? (sign text)}]',
    spreadColor: 'page ground colour',
    skyColor: 'sky band at the back of the page',
    riseAt: 'frame the back row starts rising',
    stagger: 'frames of delay from back (z 0) to front (z 1)',
    foldAt: 'frame the cards start folding down (beyond duration = never)',
    tilt: 'book tilt in degrees (how far we look down onto the page)',
    sway: 'idle sway in degrees',
    ink: 'outline ink (dark brown, never black)',
    desk: 'desk wood colour',
    border: 'die-cut border width (art units)',
    background: '"desk" or any colour / "transparent"',
  },
  component: PopupSpread,
  tags: ['pop-up book', 'paper', 'storybook', 'kids', 'cards', '3d', 'css 3d', 'craft', 'sticker', 'diorama', 'unfold', 'hero', 'children'],
});
