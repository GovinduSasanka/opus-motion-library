// Adapted from mg-styles-15/demos/18-hanazi/index.html (burstD, raysD, focusD, puff, card) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {loadFont as loadLilita} from '@remotion/google-fonts/LilitaOne';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {resolveSrc} from '../../core/asset';
import {useSafeId} from '../../core/image-kit';
import {hash, mixN, spring2, textWidth} from '../../core/r2-mg2b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

const lilita = loadLilita('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;

/**
 * Reaction "freeze-frame" sticker: the subject (a transparent PNG, or a drawn peach when none is given) becomes a die-cut
 * sticker with a jagged white border and dark keyline, slammed onto spinning pink / yellow radial rays with boiling
 * shiver marks and fur-like puffs, while a yellow spiky burst (pink back-burst offset) pops a shock caption in character
 * by character; on the freeze the sticker turns into a tilted photo card on a cyan diagonal-stripe board.
 */
type Props = {
  src: string;
  caption: string;
  subcaption: string;
  rayColors: string[];
  rayCount: number;
  burstColors: string[];
  spikes: number;
  borderColor: string;
  keyline: string;
  marks: boolean;
  freezeToCard: boolean;
  freezeAt: number;
  cardTilt: number;
  boardColors: string[];
  seed: number;
};

const Peach: React.FC = () => (
  <svg viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <radialGradient id="pch" cx="38%" cy="32%" r="75%">
        <stop offset="0" stopColor="#ffd9b8" />
        <stop offset="0.6" stopColor="#ff9d8a" />
        <stop offset="1" stopColor="#f2677a" />
      </radialGradient>
    </defs>
    <path d="M200 70 C 300 40 370 130 350 240 C 335 330 270 372 200 372 C 130 372 65 330 50 240 C 30 130 100 40 200 70Z" fill="url(#pch)" stroke="#7a2438" strokeWidth="9" />
    <path d="M200 70 C 190 110 195 150 200 190" fill="none" stroke="#e8586c" strokeWidth="7" strokeLinecap="round" />
    <path d="M206 62 C 230 18 285 14 306 30 C 292 62 246 78 206 62Z" fill="#7bd45a" stroke="#2e6a2a" strokeWidth="8" strokeLinejoin="round" />
    <circle cx="140" cy="235" r="26" fill="#ff5c7a" opacity="0.55" />
    <circle cx="262" cy="235" r="26" fill="#ff5c7a" opacity="0.55" />
    <path d="M118 200 Q 140 178 162 200" fill="none" stroke="#3a1228" strokeWidth="11" strokeLinecap="round" />
    <path d="M238 200 Q 260 178 282 200" fill="none" stroke="#3a1228" strokeWidth="11" strokeLinecap="round" />
    <path d="M168 262 Q 200 296 232 262 Q 200 276 168 262Z" fill="#3a1228" stroke="#3a1228" strokeWidth="8" strokeLinejoin="round" />
  </svg>
);

const burstPath = (R: number, n: number, seed: number, spike = 0.3) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? R * (0.92 + 0.14 * hash(seed + i)) : R * (1 - spike - 0.06 * hash(seed + i + 40));
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return 'M' + pts.join(' L') + 'Z';
};

const StickerCutoutBurst: React.FC<Props> = ({src, caption, subcaption, rayColors, rayCount, burstColors, spikes, borderColor, keyline, marks, freezeToCard, freezeAt, cardTilt, boardColors, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const id = useSafeId('scb');
  const S = Math.min(w * 0.66, h * 0.46);
  const sx = cx;
  const sy = cy + (portrait ? h * 0.1 : h * 0.07);
  const slam = spring2((frame - 6) / 30, 0.42, 24);
  const sScale = frame < 6 ? 0 : mixN(1.7, 1, slam);
  const frozen = freezeToCard ? frame >= freezeAt : false;
  const cardT = freezeToCard ? prog(frame, freezeAt + 8, freezeAt + 20, ease.inOut) : 0;
  const wob = frozen ? 0 : Math.sin(frame * 0.35) * 1.2;
  const boil = Math.floor(frame / 2.5);
  const R1 = 16 * u;
  const rays = Array.from({length: rayCount}, (_, i) => i);
  const Rr = Math.hypot(w, h);
  const rot = frame * 0.35;
  const burstC = {x: sx + (portrait ? S * 0.12 : S * 0.52), y: sy - (portrait ? S * 0.68 : S * 0.55)};
  const Rb = (portrait ? S * 0.42 : S * 0.4);
  const bsp = spring2((frame - 14 + 2) / 30, 0.42, 24);
  const burstOut = freezeToCard ? 1 - prog(frame, freezeAt + 4, freezeAt + 10) : 1;
  const chars = [...caption];
  const em1 = chars.reduce((a, c) => a + textWidth(c, 100, lilita) / 100 + 0.06, 0);
  const capFs = Math.min((Rb * 1.55) / Math.max(1, em1), Rb * 0.85);
  const cardS = S * 0.9;
  const cardSp = spring2((frame - freezeAt - 10) / 30, 0.5, 20);
  const stripeShift = (frame * 2.2) % (60 * u);

  const subject = src ? <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'contain'}} /> : <Peach />;
  return (
    <AbsoluteFill style={{background: boardColors[0] ?? '#16B9F0'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={id + 'f'} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            <feMorphology in="SourceAlpha" operator="dilate" radius={R1} result="d1" />
            <feTurbulence type="fractalNoise" baseFrequency={0.035} numOctaves={2} seed={seed} result="tn" />
            <feDisplacementMap in="d1" in2="tn" scale={R1 * 1.1} xChannelSelector="R" yChannelSelector="G" result="dj" />
            <feFlood floodColor={borderColor} />
            <feComposite in2="dj" operator="in" result="white" />
            <feMorphology in="dj" operator="dilate" radius={5 * u} result="d2" />
            <feFlood floodColor={keyline} />
            <feComposite in2="d2" operator="in" result="key" />
            <feDropShadow in="key" dx={0} dy={10 * u} stdDeviation={8 * u} floodColor="#000" floodOpacity={0.28} result="sh" />
            <feMerge>
              <feMergeNode in="sh" />
              <feMergeNode in="white" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <Svg>
        <defs>
          <pattern id={id + 'st'} width={60 * u} height={60 * u} patternUnits="userSpaceOnUse" patternTransform={`rotate(25) translate(${stripeShift},0)`}>
            <rect width={60 * u} height={60 * u} fill={boardColors[1] ?? '#ffffff'} />
            <rect width={30 * u} height={60 * u} fill={boardColors[0] ?? '#16B9F0'} />
          </pattern>
        </defs>
        {/* rays */}
        <g opacity={1 - cardT} transform={`translate(${sx},${sy}) rotate(${rot})`}>
          {rays.map((i) => {
            const a0 = (i / rayCount) * Math.PI * 2;
            const a1 = ((i + 1) / rayCount) * Math.PI * 2;
            return <path key={i} d={`M0 0 L${Math.cos(a0) * Rr} ${Math.sin(a0) * Rr} L${Math.cos(a1) * Rr} ${Math.sin(a1) * Rr}Z`} fill={rayColors[i % rayColors.length]} />;
          })}
        </g>
        <circle cx={sx} cy={sy} r={S * 0.7} fill="#fff" opacity={0.1 * (1 - cardT)} />
        <rect width={w} height={h} fill={`url(#${id}st)`} opacity={cardT} />
      </Svg>
      {/* sticker */}
      <div
        style={{
          position: 'absolute',
          left: sx - S / 2,
          top: sy - S / 2,
          width: S,
          height: S,
          opacity: 1 - cardT,
          transform: `rotate(${-4 + wob}deg) scale(${sScale * (1 - cardT * 0.1)})`,
          filter: `url(#${id}f)`,
        }}
      >
        {subject}
      </div>
      {/* card */}
      {cardT > 0 && (
        <div
          style={{
            position: 'absolute',
            left: sx - cardS / 2,
            top: sy - cardS / 2,
            width: cardS,
            height: cardS,
            opacity: cardT,
            background: '#fff',
            border: `${6 * u}px solid ${keyline}`,
            borderRadius: 18 * u,
            boxShadow: `0 ${18 * u}px ${30 * u}px rgba(0,0,0,0.3)`,
            padding: 22 * u,
            boxSizing: 'border-box',
            transform: `rotate(${cardTilt * cardSp}deg) scale(${mixN(0.85, 1, clamp(cardSp))})`,
          }}
        >
          <div style={{width: '100%', height: '100%', background: '#ffe9f2', borderRadius: 8 * u, overflow: 'hidden', padding: 14 * u, boxSizing: 'border-box'}}>{subject}</div>
        </div>
      )}
      <Svg>
        {/* shiver marks + puffs */}
        {marks && !cardT && frame >= 8 && (
          <g stroke={keyline} strokeWidth={7 * u} strokeLinecap="round" fill="none">
            {[-1, 1].map((sd) =>
              [0, 1, 2].map((k) => {
                const j = hash(boil * 5 + k * 3 + sd * 11 + seed);
                const a = (sd < 0 ? Math.PI : 0) + (k - 1) * 0.42;
                const r0 = S * (0.6 + 0.04 * j);
                return <path key={`${sd}${k}`} d={`M${sx + Math.cos(a) * r0} ${sy + Math.sin(a) * r0} l${Math.cos(a) * 34 * u} ${Math.sin(a) * 34 * u}`} opacity={0.85} />;
              }),
            )}
          </g>
        )}
        {!cardT && frame >= 8 &&
          [0, 1, 2, 3].map((k) => {
            const pj = clamp((frame - 8 - k * 2) / 7);
            const ps = pj < 0.6 ? mixN(0.6, 1.2, pj / 0.6) : mixN(1.2, 1, (pj - 0.6) / 0.4);
            const px = sx + (k < 2 ? -1 : 1) * S * (0.36 + 0.1 * (k % 2));
            const py = sy + S * (0.38 + 0.05 * hash(boil + k));
            return <circle key={k} cx={px} cy={py} r={26 * u * ps} fill="#fff" stroke={keyline} strokeWidth={5 * u} />;
          })}
        {/* burst */}
        {frame >= 12 && burstOut > 0.01 && (
          <g transform={`translate(${burstC.x},${burstC.y}) scale(${Math.max(0, bsp) * burstOut})`}>
            <g transform="translate(14,12) rotate(9) scale(1.04)">
              <path d={burstPath(Rb, spikes, seed + 3)} fill={burstColors[1] ?? '#FF3D7F'} stroke={keyline} strokeWidth={9 * u} strokeLinejoin="round" />
            </g>
            <path d={burstPath(Rb, spikes, seed)} fill={burstColors[0] ?? '#FFF15A'} stroke={keyline} strokeWidth={10 * u} strokeLinejoin="round" />
            {(() => {
              const widths = chars.map((c) => capFs * (textWidth(c, 100, lilita) / 100 + 0.06));
              const tot = widths.reduce((a, b) => a + b, 0);
              let x0 = -tot / 2;
              return chars.map((ch, i) => {
                const xc = x0 + widths[i] / 2;
                x0 += widths[i];
                const t = (frame - 16 - i * 2) / 30;
                if (t <= 0 || ch === ' ') return null;
                const s = spring2(t, 0.42, 24);
                return (
                  <g key={i} transform={`translate(${xc},${capFs * 0.34}) rotate(${(i % 2 ? 1 : -1) * 4 * (1 - s)}) scale(${s})`}>
                    {[
                      {stroke: keyline, sw: capFs * 0.26, fill: keyline},
                      {stroke: '#fff', sw: capFs * 0.16, fill: '#fff'},
                      {stroke: 'none', sw: 0, fill: '#E8283C'},
                    ].map((l, q) => (
                      <text key={q} x={0} y={0} textAnchor="middle" fontFamily={lilita} fontSize={capFs} fill={l.fill} stroke={l.stroke} strokeWidth={l.sw} strokeLinejoin="round">
                        {ch}
                      </text>
                    ))}
                  </g>
                );
              });
            })()}
          </g>
        )}
        {subcaption && frame >= 34 && burstOut > 0.01 && (
          <g transform={`translate(${cx},${portrait ? burstC.y - Rb * 1.1 : sy + S * 0.62 + 40 * u}) scale(${spring2((frame - 34) / 30, 0.45, 22) * burstOut})`}>
            <rect x={-S * 0.42} y={-34 * u} width={S * 0.84} height={68 * u} rx={34 * u} fill="#fff" stroke={keyline} strokeWidth={6 * u} />
            <text x={0} y={14 * u} textAnchor="middle" fontFamily={fonts.sans} fontWeight={800} fontSize={38 * u} fill={keyline}>
              {subcaption}
            </text>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const stickerCutoutBurst = defineMotion<Props>({
  id: 'sticker-cutout-burst',
  title: 'Sticker cutout burst',
  category: 'image',
  description:
    'A subject cut-out becomes a die-cut sticker with a jagged white border and dark keyline, slammed onto spinning pink and yellow radial rays with boiling shiver marks and puffs, while a yellow spiky burst with a pink back-burst pops a shock caption character by character; on the freeze it turns into a tilted photo card on a cyan stripe board.',
  source: ['mg-styles-15 demos/18-hanazi burstD, raysD, focusD, puff, card + assets/prep*.py matte (MIT)', 'video 18-hanazi 6.0-7.6 s'],
  useFor: 'Meme / reaction freeze-frame moments, product hero stickers and thumbnails in motion; give it a transparent PNG as `src`.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    caption: 'WOW!!',
    subcaption: 'is this normal?!',
    rayColors: ['#FF3D7F', '#FFE14D'],
    rayCount: 24,
    burstColors: ['#FFF15A', '#FF3D7F'],
    spikes: 14,
    borderColor: '#ffffff',
    keyline: '#1A1030',
    marks: true,
    freezeToCard: true,
    freezeAt: 84,
    cardTilt: -6,
    boardColors: ['#16B9F0', '#ffffff'],
    seed: 3,
  },
  propDocs: {
    src: 'transparent PNG cut-out (public/ path); empty = a drawn peach',
    caption: 'shock word inside the burst (short)',
    subcaption: 'small pill line (empty = none)',
    rayColors: 'alternating ray colours',
    rayCount: 'number of ray wedges',
    burstColors: '[burst fill, back-burst fill]',
    spikes: 'spikes on the burst',
    borderColor: 'sticker border colour',
    keyline: 'keyline / outline ink colour',
    marks: 'shiver marks and puffs around the sticker',
    freezeToCard: 'freeze, then turn the sticker into a photo card on a stripe board',
    freezeAt: 'frame of the freeze',
    cardTilt: 'card tilt in degrees',
    boardColors: 'stripe board colours',
    seed: 'seed for burst jitter and the sticker edge',
  },
  component: StickerCutoutBurst,
  tags: ['sticker', 'die-cut', 'cutout', 'burst', 'rays', 'reaction', 'meme', 'freeze frame', 'photo card', 'caption', 'shock', 'social', 'variety show', 'thumbnail', 'product', 'comic'],
});
