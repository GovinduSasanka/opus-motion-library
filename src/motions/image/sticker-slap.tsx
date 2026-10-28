// Adapted from mg-styles-15/demos/19-paperclip/index.html (slap, shadow) and tools/stickers.py (cutout) (MIT, © Vincentwei1021) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {fonts} from '../../core/fonts';
import {cl} from '../../core/r2-mg1b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Item = {kind: string; src: string; x: number; y: number; size: number; at: number; rot: number};
type Props = {
  items: Item[];
  background: string;
  title: string;
  outline: number;
  outlineColor: string;
  shadowColor: string;
  slapFrames: number;
  fromScale: number;
  fromRotate: number;
  wobble: boolean;
  jolt: number;
};

const Art: React.FC<{kind: string; src: string; size: number}> = ({kind, src, size}) => {
  const k = size / 200;
  if (src) return <image href={resolveSrc(src)} x={-size / 2} y={-size / 2} width={size} height={size} preserveAspectRatio="xMidYMid meet" />;
  return (
    <g transform={`scale(${k})`}>
      {kind === 'cup' && (
        <g>
          <ellipse cx={0} cy={84} rx={84} ry={14} fill="#E8DDCB" />
          <path d="M42 -22C98 -28 98 46 36 46L38 28C70 28 70 -2 44 -4Z" fill="#E0562F" />
          <path d="M-62 -52H58V28C58 62 36 82 0 82C-36 82 -62 62 -62 28Z" fill="#FF7A59" />
          <path d="M-62 -52H58V-30H-62Z" fill="#FFB199" />
          <path d="M-62 4H58V26H-62Z" fill="#fff" opacity={0.9} />
          <ellipse cx={-4} cy={-52} rx={62} ry={12} fill="#5B3A29" />
          <path d="M-40 -64C-52 -80 -28 -88 -40 -104M-8 -64C-20 -80 4 -88 -8 -104M24 -64C12 -80 36 -88 24 -104" stroke="#C9BFAE" strokeWidth={7} strokeLinecap="round" fill="none" />
        </g>
      )}
      {kind === 'bolt' && <path d="M14 -96L-54 14L-8 14L-26 96L58 -24L8 -24Z" fill="#FFC21A" strokeLinejoin="round" />}
      {kind === 'flower' && (
        <g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse key={i} cx={0} cy={-46} rx={26} ry={44} fill={i % 2 ? '#B84DFF' : '#D58CFF'} transform={`rotate(${i * 60})`} />
          ))}
          <circle r={26} fill="#FFD23F" />
        </g>
      )}
      {kind === 'camera' && (
        <g>
          <rect x={-88} y={-48} width={176} height={116} rx={22} fill="#3C8DFF" />
          <rect x={-56} y={-70} width={50} height={26} rx={8} fill="#2A6AC8" />
          <circle cx={0} cy={10} r={44} fill="#fff" />
          <circle cx={0} cy={10} r={30} fill="#1F2C55" />
          <circle cx={-8} cy={2} r={9} fill="#fff" opacity={0.7} />
          <circle cx={66} cy={-26} r={8} fill="#FFC21A" />
        </g>
      )}
    </g>
  );
};

const StickerSlap: React.FC<Props> = ({items, background, title, outline, outlineColor, shadowColor, slapFrames, fromScale, fromRotate, wobble, jolt}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, cx, cy} = useStage();
  // camera jolt: sum of decaying kicks at every landing
  let jx = 0;
  let jy = 0;
  for (const it of items) {
    const t = (frame - it.at) / fps;
    if (t >= 0 && t < 0.6) {
      const e = Math.exp(-t * 14) * jolt * u;
      jy += e * Math.cos(t * Math.PI * 2 * 7);
      jx += e * 0.4 * Math.sin(t * Math.PI * 2 * 5 + it.x * 3);
    }
  }
  const titleIn = cl((frame - 4) / 16);
  const order = items.map((it, i) => ({it, i})).sort((a, b) => a.it.at - b.it.at);
  return (
    <AbsoluteFill style={{background}}>
      <Svg>
        <defs>
          <pattern id="ss-dots" width={44 * u} height={44 * u} patternUnits="userSpaceOnUse">
            <circle cx={22 * u} cy={22 * u} r={2.2 * u} fill="#000" opacity={0.07} />
          </pattern>
        </defs>
        <g transform={`translate(${jx} ${jy})`}>
          <rect x={-60} y={-60} width={w + 120} height={h + 120} fill="url(#ss-dots)" />
          <text
            x={cx}
            y={cy + 40 * u}
            textAnchor="middle"
            fontFamily={fonts.display}
            fontSize={Math.min(w * 0.115, 210 * u)}
            fill="#000"
            opacity={0.06 * titleIn}
            letterSpacing={6 * u}
          >
            {title}
          </text>
          {order.map(({it, i}) => {
            const start = it.at - slapFrames;
            if (frame < start) return null;
            const p = cl((frame - start) / slapFrames);
            const lift = 1 - p * p;
            const t = Math.max(0, (frame - it.at) / fps);
            const wob = wobble && frame >= it.at ? Math.exp(-10 * t) * Math.cos(Math.PI * 2 * 4.5 * t) : 0;
            const sc = (1 + (fromScale - 1) * lift) * (1 - 0.035 * wob);
            const rot = it.rot + fromRotate * lift * (i % 2 ? -1 : 1) - 0.8 * wob + Math.sin(frame * 0.05 + i * 2) * 0.35;
            const op = cl((frame - start) / 3);
            const blur = lift * 7;
            const sOff = 6 + 34 * lift;
            const sBlur = 10 + 34 * lift;
            const sOp = (0.5 - 0.22 * lift) * op;
            const X = cx + it.x * w;
            const Y = cy + it.y * h;
            const R = Math.max(outline, 1);
            const half = it.size / 2 + R + sBlur * 3 + sOff;
            return (
              <g key={i} transform={`translate(${X} ${Y}) rotate(${rot}) scale(${sc * u})`} opacity={op}>
                <filter id={`ss-f-${i}`} filterUnits="userSpaceOnUse" x={-half} y={-half} width={half * 2} height={half * 2} colorInterpolationFilters="sRGB">
                  <feMorphology in="SourceAlpha" operator="dilate" radius={R} result="d0" />
                  <feGaussianBlur in="d0" stdDeviation={R * 0.3} result="d1" />
                  <feComponentTransfer in="d1" result="d2">
                    <feFuncA type="linear" slope="5" intercept="-1.6" />
                  </feComponentTransfer>
                  <feFlood floodColor={outlineColor} result="fc" />
                  <feComposite in="fc" in2="d2" operator="in" result="rim" />
                  <feGaussianBlur in="d2" stdDeviation={sBlur} result="sb" />
                  <feOffset in="sb" dx={0} dy={sOff} result="so" />
                  <feFlood floodColor={shadowColor} floodOpacity={sOp} result="sc" />
                  <feComposite in="sc" in2="so" operator="in" result="sh" />
                  <feMerge result="all">
                    <feMergeNode in="sh" />
                    <feMergeNode in="rim" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                  <feGaussianBlur in="all" stdDeviation={blur} />
                </filter>
                <g filter={`url(#ss-f-${i})`}>
                  <Art kind={it.kind} src={it.src} size={it.size} />
                </g>
              </g>
            );
          })}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const stickerSlap = defineMotion<Props>({
  id: 'sticker-slap',
  title: 'Sticker slap',
  category: 'image',
  description:
    'Photo or icon cut-outs with a thick white outline drop onto the page from above the camera: large, tilted and blurred with a wide soft shadow, then land flat with a tiny squash and a two-cycle wobble while the shadow tightens on contact and the whole page jolts a few pixels.',
  source: ['mg-styles-15 demos/19-paperclip slap() / shadow(), tools/stickers.py cutout(), 06-collage rimmed() (MIT)'],
  useFor: 'The universal photo-to-sticker treatment for explainers, social posts and product callouts. Give transparent PNG cut-outs as src; overlay-capable with background transparent.',
  durationInFrames: 120,
  defaultProps: {
    items: [
      {kind: 'cup', src: '', x: 0, y: 0.02, size: 440, at: 22, rot: -3},
      {kind: 'bolt', src: '', x: -0.27, y: -0.2, size: 220, at: 40, rot: -10},
      {kind: 'flower', src: '', x: 0.27, y: 0.2, size: 240, at: 56, rot: 8},
    ],
    background: '#F3ECE0',
    title: 'FRESH DROP',
    outline: 11,
    outlineColor: '#FFFFFF',
    shadowColor: '#2A1F14',
    slapFrames: 7,
    fromScale: 1.3,
    fromRotate: 6,
    wobble: true,
    jolt: 6,
  },
  propDocs: {
    items: 'stickers[{kind: cup|bolt|flower|camera (procedural fallback), src: transparent PNG path (optional), x,y: offset from centre as fraction of width/height, size, at: landing frame, rot: resting degrees}]',
    background: "page colour ('transparent' to use as an overlay)",
    title: 'big faint word behind the stickers',
    outline: 'white outline thickness in px at 1080p (8-12)',
    outlineColor: 'outline colour',
    shadowColor: 'drop shadow colour',
    slapFrames: 'frames of the drop (0.2 s = 6-7)',
    fromScale: 'start scale (above the camera)',
    fromRotate: 'start tilt in degrees',
    wobble: 'two-cycle wobble after landing',
    jolt: 'page jolt in px at each landing (4-8)',
  },
  component: StickerSlap,
  tags: ['sticker', 'cutout', 'die-cut', 'outline', 'slap', 'drop', 'photo', 'shadow', 'wobble', 'collage', 'overlay', 'social'],
});
