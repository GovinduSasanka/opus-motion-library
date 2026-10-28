// Adapted from lemo-opuscar/styles/hd-2d/demo/chars.js, px.js, kit.js (sprite poses, selout, light tint) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {charPal, charRows, CharStyle, Light, lightMult, PixelSprite, shadowPoints, spritePaths} from '../../core/r2-la3b-kit';
import {cl, h1, mixC} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  pixel: number;
  lightColor: string;
  ambient: string;
  floorColor: string;
  wallColor: string;
  chars: number;
  camera: number;
  walkFps: number;
  seed: number;
};

const STYLES: CharStyle[] = [
  {skin: '#F0C09A', hair: '#4A2F22', shirt: '#4F86C6', pants: '#3A3F6B', shoes: '#2B2230', accent: '#E8B34A', hat: true},
  {skin: '#C98E6A', hair: '#1F1A24', shirt: '#C9553D', pants: '#5A4A3A', shoes: '#2B2230', accent: '#F4EBD8', long: true},
  {skin: '#F6D2B0', hair: '#D9A441', shirt: '#4FA36F', pants: '#34405C', shoes: '#3A2A2A', accent: '#C9553D'},
  {skin: '#8E5B3E', hair: '#2A1C16', shirt: '#9A6BC9', pants: '#2F3550', shoes: '#241C28', accent: '#E8B34A', hat: true},
];

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const flick = (t: number, ph: number) => 1 + 0.1 * (0.5 * Math.sin(13 * t + ph) + 0.3 * Math.sin(7.1 * t + ph * 2) + 0.2 * Math.sin(23 * t + ph * 3));

const LitPixelSprite: React.FC<Props> = ({pixel, lightColor, ambient, floorColor, wallColor, chars, camera, walkFps, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const t = frame / 30;
  const P = Math.round(pixel * u * (portrait ? 0.9 : 1));
  const camX = Math.sin(t * 0.55) * camera * u + t * 6 * u * (camera > 0 ? 1 : 0) * 0;
  const floorTop = h * 0.5;
  const amb = rgb(ambient);

  // lights: two fixed practical lamps and a carried lantern on a smooth path
  const lamps: Light[] = [
    {x: w * (portrait ? 0.14 : 0.2) - camX, y: h * 0.7, h: 40 * P, color: lightColor, r: 380 * u, i: 1 * flick(t, 1)},
    {x: w * (portrait ? 0.9 : 0.8) - camX, y: h * 0.76, h: 38 * P, color: mixC(lightColor, '#FF7A3A', 0.35), r: 360 * u, i: 0.95 * flick(t, 4)},
    {x: w * 0.5 + Math.sin(t * 0.8) * w * 0.28 - camX * 0.5, y: h * 0.84 + Math.sin(t * 1.3) * 10 * u, h: 22 * P, color: mixC(lightColor, '#FFFFFF', 0.25), r: 260 * u, i: 0.85 * flick(t, 7)},
  ];

  // characters: walkers and one idler
  const n = Math.min(STYLES.length, Math.max(1, chars));
  const actors = Array.from({length: n}, (_, i) => {
    const st = STYLES[i];
    const idle = i === n - 1 && n > 1;
    const dir = i % 2 === 0 ? 1 : -1;
    const speed = (34 + h1(i, seed) * 14) * u;
    const range = w * 1.3;
    const x0 = h1(i, seed + 3) * range;
    const x = idle ? w * 0.34 : (((x0 + dir * speed * t) % range) + range) % range - w * 0.15;
    const y = h * (0.66 + 0.07 * i + (idle ? 0.05 : 0));
    const fx = Math.round((x - camX) / (P / 2)) * (P / 2);
    const rows = idle ? charRows(st, {idle: Math.floor(t * 1.4 * 2) % 2}) : charRows(st, {walk: Math.floor(t * walkFps) % 4});
    const mult = lightMult(fx, y - 12 * P, lamps, amb);
    const paths = spritePaths(rows, charPal(st), {mult, gain: 1.35, outline: true, flip: dir < 0 && !idle});
    return {fx, y, paths, dir};
  }).sort((a, b) => a.y - b.y);

  const shadowProf: [number, number][] = [[4 * P, 0.5], [4 * P, 15 * P], [3 * P, 16 * P], [3 * P, 21 * P], [1.2 * P, 24 * P]];

  return (
    <AbsoluteFill style={{background: wallColor, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="lps-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixC(wallColor, '#05030C', 0.55)} />
            <stop offset="1" stopColor={wallColor} />
          </linearGradient>
          <linearGradient id="lps-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixC(floorColor, '#000000', 0.25)} />
            <stop offset="1" stopColor={floorColor} />
          </linearGradient>
          <pattern id="lps-brick" width={46 * u} height={22 * u} patternUnits="userSpaceOnUse" patternTransform={`translate(${-camX * 0.6} 0)`}>
            <path d={`M0 ${21 * u}H${46 * u}M${23 * u} 0V${21 * u}`} stroke="#000" strokeOpacity="0.28" strokeWidth={2 * u} />
          </pattern>
          <pattern id="lps-tile" width={96 * u} height={48 * u} patternUnits="userSpaceOnUse" patternTransform={`translate(${-camX} 0)`}>
            <path d={`M0 0H${96 * u}M${48 * u} 0V${48 * u}`} stroke="#000" strokeOpacity="0.3" strokeWidth={2 * u} />
          </pattern>
          <filter id="lps-post" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 .22 .44 .66 .88 1" />
              <feFuncG type="discrete" tableValues="0 .22 .44 .66 .88 1" />
              <feFuncB type="discrete" tableValues="0 .22 .44 .66 .88 1" />
            </feComponentTransfer>
          </filter>
          {lamps.map((L, i) => (
            <radialGradient key={i} id={`lps-pool${i}`}>
              <stop offset="0" stopColor={L.color} stopOpacity={cl(0.62 * L.i, 0, 0.8)} />
              <stop offset="0.5" stopColor={L.color} stopOpacity={cl(0.26 * L.i, 0, 0.5)} />
              <stop offset="1" stopColor={L.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        {/* back wall, doors and floor */}
        <rect width={w} height={floorTop} fill="url(#lps-wall)" />
        <rect width={w} height={floorTop} fill="url(#lps-brick)" />
        {[0.12, 0.38, 0.64, 0.9].map((fx, i) => {
          const x = ((fx * w * 1.4 - camX * 0.6 + w * 2) % (w * 1.4)) - w * 0.1;
          return (
            <g key={i}>
              <rect x={x - 38 * u} y={floorTop - 190 * u} width={76 * u} height={150 * u} rx={38 * u} fill="#07050F" />
              <rect x={x - 38 * u} y={floorTop - 190 * u} width={76 * u} height={150 * u} rx={38 * u} fill="none" stroke={mixC(wallColor, '#000', 0.4)} strokeWidth={5 * u} />
            </g>
          );
        })}
        <rect y={floorTop} width={w} height={h - floorTop} fill="url(#lps-floor)" />
        <rect y={floorTop} width={w} height={h - floorTop} fill="url(#lps-tile)" />
        <rect y={floorTop - 8 * u} width={w} height={14 * u} fill={mixC(floorColor, '#000', 0.4)} />

        {/* light pools on wall and floor (posterised to read as pixel-era banding) */}
        <g style={{mixBlendMode: 'screen'}} filter="url(#lps-post)">
          {lamps.map((L, i) => (
            <g key={i}>
              <ellipse cx={L.x} cy={L.y} rx={L.r} ry={L.r * 0.5} fill={`url(#lps-pool${i})`} />
              <ellipse cx={L.x} cy={L.y - 120 * u} rx={L.r * 0.8} ry={L.r * 0.85} fill={`url(#lps-pool${i})`} opacity={0.55} />
            </g>
          ))}
        </g>

        {/* sheared floor shadows from the two strongest lights */}
        {actors.map((a, ai) =>
          lamps.map((L, li) => {
            const d = Math.hypot(a.fx - L.x, (a.y - L.y) * 1.4);
            const k = cl(1 - d / (L.r * 1.15)) * cl(L.i);
            if (k < 0.04) return null;
            return <polygon key={`${ai}-${li}`} points={shadowPoints({x: L.x, y: L.y, h: L.h}, {x: a.fx, y: a.y}, shadowProf, 0.55, 3 * P)} fill="#08051A" opacity={0.68 * k} />;
          }),
        )}

        {/* lamp fixtures */}
        {lamps.slice(0, 2).map((L, i) => (
          <g key={i}>
            <rect x={L.x - 4 * u} y={L.y - L.h * 0.9} width={8 * u} height={L.h * 0.9} fill="#1D1626" />
            <rect x={L.x - 13 * u} y={L.y - L.h * 0.9 - 24 * u} width={26 * u} height={26 * u} fill={mixC(L.color, '#FFFFFF', 0.3)} opacity={cl(0.7 + 0.3 * L.i)} />
            <rect x={L.x - 15 * u} y={L.y - L.h * 0.9 - 28 * u} width={30 * u} height={5 * u} fill="#1D1626" />
          </g>
        ))}
        <g>
          <rect x={lamps[2].x - 6 * u} y={lamps[2].y - lamps[2].h} width={12 * u} height={14 * u} fill={mixC(lamps[2].color, '#FFFFFF', 0.4)} />
          <rect x={lamps[2].x - 8 * u} y={lamps[2].y - lamps[2].h - 4 * u} width={16 * u} height={4 * u} fill="#1D1626" />
        </g>

        {/* sprites sorted by depth */}
        {actors.map((a, i) => (
          <PixelSprite key={i} paths={a.paths} x={a.fx} y={a.y - 24 * P} px={P} originX={7} />
        ))}

        {/* warm bloom over the lamp heads + cool vignette */}
        <g style={{mixBlendMode: 'screen'}} opacity="0.55">
          {lamps.map((L, i) => (
            <circle key={i} cx={L.x} cy={L.y - L.h * (i === 2 ? 1 : 0.9)} r={60 * u * L.i} fill={`url(#lps-pool${i})`} />
          ))}
        </g>
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(5,3,16,0.6) 100%)'}} />
    </AbsoluteFill>
  );
};

export const litPixelSprite = defineMotion<Props>({
  id: 'lit-pixel-sprite',
  title: 'Lit pixel sprites',
  category: 'game',
  description:
    'Flat low-res pixel characters with 1-px selout outlines step through 4-frame walk cycles and 2-frame idles on a dusk plaza. Two practical lamps and a drifting lantern tint their colours as they pass, posterised light pools band across the floor, and each sprite casts sheared shadows away from every nearby light while the camera drifts smoothly.',
  source: ['lemo-opuscar styles/hd-2d demo chars.js / px.js / kit.js (MIT, LemoLab)', 'lemo-styles-a hd-2d: lit-pixel-sprite'],
  useFor: 'Retro-game storytelling, pixel mascots in a lit set, HD-2D mood; pairs with pixel-dither.',
  durationInFrames: 240,
  defaultProps: {pixel: 10, lightColor: '#FFB35A', ambient: '#6A76AE', floorColor: '#3A3A5E', wallColor: '#2B2850', chars: 4, camera: 70, walkFps: 8, seed: 3},
  propDocs: {
    pixel: 'screen px per sprite pixel at 1080p (5–10)',
    lightColor: 'warm lamp colour',
    ambient: 'cool ambient light colour (the unlit tint)',
    floorColor: 'floor tile colour',
    wallColor: 'back wall colour',
    chars: 'number of characters 1–4 (the last one idles)',
    camera: 'smooth camera sway in px (0 = locked)',
    walkFps: 'walk-cycle frames per second (6–10)',
    seed: 'walker speed/phase seed',
  },
  component: LitPixelSprite,
  tags: ['pixel art', 'sprite', 'hd-2d', 'retro game', 'walk cycle', 'lantern', 'dynamic lighting', 'shadows', 'selout', 'character', 'night', 'plaza', '16-bit'],
});
