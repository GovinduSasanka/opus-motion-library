// Adapted from mg-styles-15/demos/18-hanazi/index.html (HZ, charXf, driveHZ, spring) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {loadFont as loadFredoka} from '@remotion/google-fonts/Fredoka';
import {loadFont as loadLilita} from '@remotion/google-fonts/LilitaOne';
import {clamp} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {resolveSrc} from '../../core/asset';
import {useSafeId} from '../../core/image-kit';
import {spring2, textWidth} from '../../core/r2-mg2b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

const fredoka = loadFredoka('normal', {weights: ['600', '700'], subsets: ['latin']}).fontFamily;
const lilita = loadLilita('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;
const CJK = `'Microsoft YaHei','PingFang SC','Noto Sans CJK SC','Noto Sans SC','Hiragino Sans GB',sans-serif`;

/**
 * Variety-show 花字 caption: a fat rounded word built from five stacked layers (two-step offset extrusion, coloured outer
 * stroke, thick white stroke, vertical gradient fill, top gloss) that pops in per character on a damped spring (2-frame
 * stagger, slight drop and rotation), then wiggles, bobs and breathes until it pops out. Presets: joy, shock, aside,
 * question, bye. A small aside line and sparkles can ride along. Works over a `src` photo or the demo sky.
 */
type Layers = {extrude: number; extrudeColor: string; outer: number; outerColor: string; white: number; fillStops: string[]; gloss: number};
type Preset = {layers: Layers; font: string; weight: number; skew: number; perChar?: string[]};
const PRESETS: Record<string, Preset> = {
  joy: {layers: {extrude: 16, extrudeColor: '#A3124F', outer: 12, outerColor: '#FF3D7F', white: 13, fillStops: ['#fff6a8', '#ffc42e'], gloss: 0.55}, font: 'fredoka', weight: 700, skew: 0},
  shock: {layers: {extrude: 14, extrudeColor: '#0E1440', outer: 10, outerColor: '#1A1030', white: 11, fillStops: ['#fff15a', '#ffd21a'], gloss: 0.5}, font: 'lilita', weight: 400, skew: -8},
  aside: {layers: {extrude: 0, extrudeColor: '#1E2A78', outer: 7, outerColor: '#1E2A78', white: 0, fillStops: ['#ffffff', '#ffffff'], gloss: 0}, font: 'hand', weight: 700, skew: -4},
  question: {layers: {extrude: 14, extrudeColor: '#0E1440', outer: 11, outerColor: '#1E2A78', white: 12, fillStops: ['#ffffff', '#ffe1ee'], gloss: 0.4}, font: 'fredoka', weight: 700, skew: 0, perChar: ['#FF3D7F', '#16B9F0', '#FFE14D']},
  bye: {layers: {extrude: 16, extrudeColor: '#3a0e66', outer: 12, outerColor: '#7a2bc4', white: 13, fillStops: ['#ff8ccf', '#b26bff'], gloss: 0.55}, font: 'fredoka', weight: 700, skew: 0},
};
const FAM = (k: string) => (k === 'lilita' ? lilita : k === 'hand' ? fonts.hand : fredoka);

type Props = {
  text: string;
  preset: 'joy' | 'shock' | 'aside' | 'question' | 'bye';
  aside: string;
  at: number;
  out: number;
  stagger: number;
  wiggle: number;
  bob: number;
  sparkles: boolean;
  src: string;
  background: string;
};

const Line: React.FC<{text: string; preset: Preset; fs: number; cx: number; cy: number; at: number; out: number; stagger: number; wiggle: number; bob: number; uid: string; maxW: number}> = ({
  text, preset, fs, cx, cy, at, out, stagger, wiggle, bob, uid, maxW,
}) => {
  const frame = useCurrentFrame();
  const fam = FAM(preset.font) + ',' + CJK;
  const chars = [...text];
  let size = fs;
  const widthAt = (s: number) => chars.map((c) => textWidth(c, s, fam, preset.weight) + s * 0.04);
  let adv = widthAt(size);
  const tot = adv.reduce((a, b) => a + b, 0);
  if (tot > maxW) {
    size = (size * maxW) / tot;
    adv = widthAt(size);
  }
  const total = adv.reduce((a, b) => a + b, 0);
  const k = size / 172;
  const L = preset.layers;
  const sw = 2 * (L.white + L.outer) * k;
  let x = cx - total / 2;
  const outT = (frame - out) / 5;
  const outS = frame < out ? 1 : outT >= 1 ? 0 : outT < 0.4 ? 1 + 0.12 * (outT / 0.4) : 1.12 * (1 - (outT - 0.4) / 0.6);
  if (outS <= 0.001) return null;
  return (
    <g transform={`translate(${cx},${cy}) skewX(${preset.skew}) translate(${-cx},${-cy})`}>
      {chars.map((ch, i) => {
        const cxi = x + adv[i] / 2;
        x += adv[i];
        if (ch === ' ') return null;
        const t = (frame - at - i * stagger) / 30;
        if (t <= 0) return null;
        const sp = spring2(t, 0.517, 22);
        const drop = (-70 * k) * (1 - spring2(t, 0.55, 20));
        const rot0 = (i % 2 ? 1 : -1) * (7 + (i % 3) * 2);
        const rot = rot0 * (1 - spring2(t, 0.45, 18));
        const hw = clamp((t - 0.22) / 0.35);
        const wig = hw * wiggle * Math.sin((frame / 30) * Math.PI * 2 * 1.15 + i * 0.7);
        const bb = hw * bob * k * Math.sin((frame / 30) * Math.PI * 2 * 0.9 + i * 0.5);
        const br = 1 + hw * 0.012 * Math.sin((frame / 30) * Math.PI * 2 * 0.6 + i);
        const outer = L.outerColor && preset.perChar ? preset.perChar[i % preset.perChar.length] : L.outerColor;
        const common = {fontFamily: fam, fontSize: size, fontWeight: preset.weight, textAnchor: 'middle' as const, strokeLinejoin: 'round' as const, x: 0, y: 0};
        const gid = `${uid}g${i}`;
        const glid = `${uid}l${i}`;
        return (
          <g key={i} transform={`translate(${cxi},${cy + drop + bb}) rotate(${rot + wig}) scale(${sp * outS * br})`}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={-size * 0.78} x2={0} y2={size * 0.04}>
                <stop offset="0" stopColor={L.fillStops[0]} />
                <stop offset="1" stopColor={L.fillStops[L.fillStops.length - 1]} />
              </linearGradient>
              <linearGradient id={glid} gradientUnits="userSpaceOnUse" x1={0} y1={-size * 0.78} x2={0} y2={size * 0.04}>
                <stop offset="0" stopColor="#fff" stopOpacity={L.gloss} />
                <stop offset="0.46" stopColor="#fff" stopOpacity={0} />
              </linearGradient>
            </defs>
            {L.extrude > 0 && [1, 0.5].map((q) => (
              <text key={q} {...common} y={L.extrude * k * q * 1.0} fill={L.extrudeColor} stroke={L.extrudeColor} strokeWidth={sw}>
                {ch}
              </text>
            ))}
            <text {...common} fill={outer} stroke={outer} strokeWidth={sw}>
              {ch}
            </text>
            {L.white > 0 && (
              <text {...common} fill="#fff" stroke="#fff" strokeWidth={2 * L.white * k}>
                {ch}
              </text>
            )}
            <text {...common} fill={`url(#${gid})`}>
              {ch}
            </text>
            {L.gloss > 0 && (
              <text {...common} fill={`url(#${glid})`}>
                {ch}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

const Sparkle: React.FC<{x: number; y: number; r: number; t: number; color: string}> = ({x, y, r, t, color}) => {
  if (t <= 0) return null;
  const s = spring2(t, 0.4, 26) * (0.8 + 0.2 * Math.sin(t * 14));
  const q = r * 0.16;
  return (
    <path
      transform={`translate(${x},${y}) scale(${s}) rotate(${Math.sin(t * 5) * 8})`}
      d={`M0 ${-r} Q ${q} ${-q} ${r} 0 Q ${q} ${q} 0 ${r} Q ${-q} ${q} ${-r} 0 Q ${-q} ${-q} 0 ${-r}Z`}
      fill={color}
      stroke="#1E2A78"
      strokeWidth={r * 0.1}
      strokeLinejoin="round"
    />
  );
};

const HanaziCaption: React.FC<Props> = ({text, preset, aside, at, out, stagger, wiggle, bob, sparkles, src, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const id = useSafeId('hnz');
  const P = PRESETS[preset] ?? PRESETS.joy;
  const fs = (portrait ? 210 : 340) * u;
  const ken = 1 + (frame / 150) * 0.06;
  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill style={{transform: `scale(${ken}) translate(${Math.sin(frame * 0.05) * 3 * u}px,${Math.cos(frame * 0.04) * 3 * u}px)`}}>
        {src ? (
          <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <Svg>
            <defs>
              <linearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7fd3ff" />
                <stop offset="1" stopColor="#e6f8ff" />
              </linearGradient>
            </defs>
            <rect width={w} height={h} fill={`url(#${id}sky)`} />
            <circle cx={w * 0.82} cy={h * 0.2} r={110 * u} fill="#fff6b0" />
            {[0.2, 0.55, 0.88].map((px, i) => (
              <g key={i} fill="#fff" opacity={0.9} transform={`translate(${((px * w + frame * (0.4 + i * 0.2) * u) % (w + 400 * u)) - 200 * u},${h * (0.12 + i * 0.24)})`}>
                <ellipse cx={0} cy={0} rx={150 * u} ry={46 * u} />
                <ellipse cx={-70 * u} cy={-24 * u} rx={80 * u} ry={50 * u} />
                <ellipse cx={60 * u} cy={-30 * u} rx={90 * u} ry={56 * u} />
              </g>
            ))}
            <rect x={0} y={h * 0.82} width={w} height={h * 0.18} fill="#9be37a" />
          </Svg>
        )}
      </AbsoluteFill>
      <Svg>
        <Line text={text} preset={P} fs={fs} cx={cx} cy={cy - (aside ? 30 * u : 0)} at={at} out={out} stagger={stagger} wiggle={wiggle} bob={bob} uid={id + 'm'} maxW={w * 0.88} />
        {aside && (
          <Line text={aside} preset={PRESETS.aside} fs={fs * 0.32} cx={cx} cy={cy + fs * 0.62} at={at + 26} out={out + 6} stagger={1} wiggle={wiggle} bob={bob} uid={id + 'a'} maxW={w * 0.8} />
        )}
        {sparkles && (
          <g>
            <Sparkle x={cx - w * 0.36} y={cy - fs * 0.55} r={34 * u} t={(frame - at - 22) / 30} color="#FFE14D" />
            <Sparkle x={cx + w * 0.38} y={cy - fs * 0.4} r={26 * u} t={(frame - at - 28) / 30} color="#ffffff" />
            <Sparkle x={cx + w * 0.3} y={cy + fs * 0.25} r={20 * u} t={(frame - at - 34) / 30} color="#FF9CD0" />
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const hanaziCaption = defineMotion<Props>({
  id: 'hanazi-caption',
  title: 'Hanazi caption',
  category: 'text',
  description:
    'A fat rounded variety-show caption made of five stacked layers (offset extrusion, coloured outer stroke, white stroke, gradient fill, top gloss) pops in character by character on a damped spring with a slight drop and rotation, then wiggles, bobs and breathes before popping out; a small handwritten aside and sparkles ride along.',
  source: ['mg-styles-15 demos/18-hanazi HZ, charXf, driveHZ, spring (MIT)', 'video 18-hanazi 0.2-0.5 s, 2.57 s, 6.0 s, 8.1 s, 8.9 s'],
  useFor: 'Social packaging (Douyin / Bilibili / Reels / TikTok), vlogs, interviews and reaction moments: drop emotional captions on top of footage.',
  durationInFrames: 150,
  defaultProps: {
    text: 'SO HAPPY!',
    preset: 'joy',
    aside: '(quietly) soaking up the sun...',
    at: 8,
    out: 138,
    stagger: 2,
    wiggle: 1.8,
    bob: 3,
    sparkles: true,
    src: '',
    background: '#7fd3ff',
  },
  propDocs: {
    text: 'the caption (Latin or CJK)',
    preset: 'joy | shock | aside | question | bye: colours, font and skew',
    aside: 'small handwritten line under it (empty = none)',
    at: 'frame the first character pops',
    out: 'frame the pop-out starts (0.17 s)',
    stagger: 'frames between characters',
    wiggle: 'hold wiggle in degrees (1.15 Hz)',
    bob: 'hold bob in px at 1080',
    sparkles: 'twinkling sparkles around it',
    src: 'optional photo/video frame (public/) to caption over; empty = demo sky',
    background: 'backdrop colour behind the demo sky',
  },
  component: HanaziCaption,
  tags: ['caption', 'hanazi', '花字', 'variety show', 'reaction', 'pop', 'spring', 'sticker', 'social', 'tiktok', 'reels', 'douyin', 'vlog', 'kinetic', 'rounded', 'outline', 'extrude', 'title'],
});
