import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DEFAULT_SCENE_PALETTE, Photo, SceneStill} from '../../core/cam-kit';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Whip pan: the camera snaps sideways (or up/down) from one picture to the next. The strip of pictures slides on an
 * expo in-out curve, a directional motion blur peaks mid-whip, speed streaks and a tiny flash sell it, then it settles.
 * Pictures are `images` (public/ paths or URLs); with none, procedural scenes are used.
 */
type Props = {
  images: string[];
  scenes: number;
  labels: string[];
  direction: 'left' | 'right' | 'up' | 'down';
  hold: number;
  whipFrames: number;
  startAt: number;
  maxBlur: number;
  streaks: boolean;
  flash: number;
  punch: number;
  palette: string[];
  ink: string;
  accent: string;
  fontFamily: string;
};

const WhipPan: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u} = useStage();
  const fid = useSafeId('whip');
  const n = Math.max(2, p.images.length || p.scenes);
  const seg = Math.max(2, p.hold + p.whipFrames);
  const f = Math.max(0, frame - p.startAt);
  const s = Math.floor(f / seg);
  const k = prog(f - s * seg, p.hold, p.hold + p.whipFrames, ease.expoInOut);
  const bell = Math.sin(Math.PI * clamp(k)) ** 1.4;
  const horiz = p.direction === 'left' || p.direction === 'right';
  const dim = horiz ? w : h;
  const dir = p.direction === 'left' || p.direction === 'up' ? 1 : -1; // content slides toward +x/+y for pan left/up
  const shift = k * dim * dir;
  const cur = s % n;
  const nxt = (s + 1) % n;
  const blur = p.maxBlur * u * bell;
  const scene = (i: number) =>
    p.images.length ? <Photo src={p.images[i % p.images.length]} /> : <SceneStill i={i} pal={p.palette} label={p.labels[i]} font={p.fontFamily} ink={p.ink} accent={p.accent} />;
  const lbl = (i: number) =>
    p.images.length && p.labels[i] ? (
      <div style={{position: 'absolute', left: w * 0.06, bottom: h * 0.09, color: p.ink, fontFamily: p.fontFamily, fontWeight: 800, fontSize: 64 * u, textShadow: '0 4px 30px rgba(0,0,0,.5)'}}>{p.labels[i]}</div>
    ) : null;
  const place = (rel: number): React.CSSProperties => {
    const o = rel === 0 ? shift : shift - dir * dim;
    return {position: 'absolute', inset: 0, transform: horiz ? `translate(${o}px,0)` : `translate(0,${o}px)`};
  };
  const std = horiz ? `${blur} 0` : `0 ${blur}`;
  const punch = 1 + p.punch * bell;
  const streakN = 22;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={fid} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={std} />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: blur > 0.4 ? `url(#${fid})` : undefined, transform: `scale(${punch})`}}>
        <div style={place(0)}>
          {scene(cur)}
          {lbl(cur)}
        </div>
        <div style={place(1)}>
          {scene(nxt)}
          {lbl(nxt)}
        </div>
      </AbsoluteFill>
      {p.streaks && bell > 0.05 ? (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: streakN}, (_, i) => {
            const t = (i * 0.6180339) % 1;
            const len = (0.35 + ((i * 0.37) % 0.5)) * dim;
            const pos = (((i * 0.29) % 1) * (horiz ? h : w));
            const x0 = (((t + k * 0.9 * dir * -1) % 1) + 1) % 1;
            const along = x0 * (dim + len) - len;
            return horiz ? (
              <rect key={i} x={along} y={pos} width={len} height={(1.5 + (i % 3)) * u} fill="#fff" opacity={0.28 * bell} />
            ) : (
              <rect key={i} x={pos} y={along} width={(1.5 + (i % 3)) * u} height={len} fill="#fff" opacity={0.28 * bell} />
            );
          })}
        </svg>
      ) : null}
      {p.flash > 0 ? <AbsoluteFill style={{background: p.accent, opacity: p.flash * bell ** 3}} /> : null}
    </AbsoluteFill>
  );
};

export const whipPan = defineMotion<Props>({
  id: 'whip-pan',
  title: 'Whip pan',
  category: 'camera',
  description: 'The camera whips sideways to the next picture: expo-fast slide, directional motion blur, speed streaks, a settle.',
  source: ['camera-vocabulary: whip pan / swish pan'],
  useFor: 'Energetic cuts between product shots, locations, slides or portfolio images; a swish-pan transition inside one clip; travel and event recaps.',
  durationInFrames: 150,
  defaultProps: {
    images: [],
    scenes: 3,
    labels: [],
    direction: 'left',
    hold: 34,
    whipFrames: 12,
    startAt: 0,
    maxBlur: 70,
    streaks: true,
    flash: 0.12,
    punch: 0.04,
    palette: DEFAULT_SCENE_PALETTE,
    ink: '#ffffff',
    accent: '#ffffff',
    fontFamily: fonts.grotesk,
  },
  propDocs: {
    images: 'public/ paths or URLs, shown in order and looping (empty = procedural scenes)',
    scenes: 'how many procedural scenes when images is empty',
    labels: 'optional caption per picture',
    direction: 'pan direction: left | right | up | down',
    hold: 'frames each picture holds still',
    whipFrames: 'frames the whip takes (lower = snappier)',
    startAt: 'frame the first hold begins',
    maxBlur: 'peak directional blur in u',
    streaks: 'speed streak lines during the whip',
    flash: 'accent flash strength at the peak (0 = off)',
    punch: 'extra scale at the peak of the whip',
    palette: 'colours for procedural scenes',
    ink: 'caption colour',
    accent: 'flash / subject accent colour',
    fontFamily: 'caption font',
  },
  component: WhipPan,
  tags: ['whip', 'pan', 'swish', 'camera', 'transition', 'motion blur', 'slideshow', 'cut'],
});
