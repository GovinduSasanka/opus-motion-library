import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {TAU, hash01, mixHex} from './environment-kit';
import {fonts} from './fonts';
import {useStage} from './stage';

/**
 * Shared helpers for the nature / environment backdrops (round 3):
 * time-of-day palettes, loop-safe time (`useLoop`, `cyc`, `sinc`) and an optional title/subtitle block.
 *
 * Loop rule: every periodic motion uses an INTEGER number of cycles per composition length, so the last frame
 * flows into the first. `cyc(speed, mult)` quantises a free-form `speed` prop to whole cycles.
 */
export type Tod = 'dawn' | 'day' | 'dusk' | 'night';

type Preset = {top: string; mid: string; bottom: string; sun: string; ink: string; night: boolean};

export const TOD: Record<Tod, Preset> = {
  dawn: {top: '#3A3C7E', mid: '#D2708F', bottom: '#FFD0A0', sun: '#FFF0C8', ink: '#FFF7EC', night: false},
  day: {top: '#3E8EDF', mid: '#8CC8F2', bottom: '#E8F6FF', sun: '#FFFBE2', ink: '#FFFFFF', night: false},
  dusk: {top: '#29215F', mid: '#B8476F', bottom: '#FF9B5E', sun: '#FFD38C', ink: '#FFF3E6', night: false},
  night: {top: '#050A1E', mid: '#0F2048', bottom: '#27437C', sun: '#E6EEFF', ink: '#EAF2FF', night: true},
};

export type Palette = Preset & {deep: string; haze: string};

/** palette from a time-of-day preset plus optional colour overrides ('' = keep the preset) */
export const makePalette = (tod: string, over: {skyTop?: string; skyBottom?: string; accent?: string; ink?: string} = {}): Palette => {
  const base = TOD[(tod as Tod) in TOD ? (tod as Tod) : 'dusk'];
  const top = over.skyTop || base.top;
  const bottom = over.skyBottom || base.bottom;
  const mid = over.skyTop || over.skyBottom ? mixHex(top, bottom, 0.5) : base.mid;
  const sun = over.accent || base.sun;
  return {
    top,
    mid,
    bottom,
    sun,
    ink: over.ink || base.ink,
    night: base.night,
    deep: mixHex(top, '#000000', 0.55),
    haze: mixHex(bottom, mid, 0.25),
  };
};

/** whole cycles per loop for a free-form speed (0 = frozen) */
export const cyc = (speed: number, mult = 1) => (speed <= 0 ? 0 : Math.max(1, Math.round(speed * mult)));

/** loop clock: p goes 0..1 over the composition length */
export const useLoop = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useStage();
  return {frame, N: durationInFrames, p: (frame % durationInFrames) / durationInFrames};
};

/** sin with an integer number of cycles per loop and a 0..1 phase offset */
export const sinc = (c: number, p: number, ph = 0) => Math.sin(TAU * (c * p + ph));

/** loop-safe noise: samples 2D noise around a circle so it closes on itself */
export const loopRadius = (c: number, p: number) => ({x: Math.cos(TAU * c * p), y: Math.sin(TAU * c * p)});

/** a CSS font family from a font role ("serif", "display", …) or any family string */
export const resolveFont = (f: string) => ((fonts as Record<string, string>)[f] ?? (f || fonts.serif));

type TextProps = {
  title: string;
  subtitle: string;
  fontFamily: string;
  ink: string;
  position: string;
  size: number;
  shadow?: string;
};

/** optional title / subtitle over a backdrop (renders nothing when both are empty) */
export const NatureText: React.FC<TextProps> = ({title, subtitle, fontFamily, ink, position, size, shadow = 'rgba(0,0,0,0.28)'}) => {
  const {w, h, u, portrait} = useStage();
  if (!title && !subtitle) return null;
  const fs = (portrait ? 108 : 124) * u * size;
  const family = resolveFont(fontFamily);
  const justify = position === 'top' ? 'flex-start' : position === 'bottom' ? 'flex-end' : 'center';
  const pad = h * (portrait ? 0.14 : 0.1);
  return (
    <AbsoluteFill style={{justifyContent: justify, alignItems: 'center', padding: `${pad}px ${w * 0.07}px`, textAlign: 'center', pointerEvents: 'none'}}>
      {title ? (
        <div style={{fontFamily: family, fontWeight: 600, fontSize: fs, lineHeight: 1.02, color: ink, maxWidth: w * 0.86, textShadow: `0 ${4 * u}px ${28 * u}px ${shadow}`, letterSpacing: '0.01em'}}>{title}</div>
      ) : null}
      {subtitle ? (
        <div style={{fontFamily: family, fontWeight: 500, fontSize: fs * 0.26, lineHeight: 1.3, color: ink, opacity: 0.86, marginTop: fs * 0.2, maxWidth: w * 0.7, letterSpacing: '0.18em', textTransform: 'uppercase', textShadow: `0 ${2 * u}px ${14 * u}px ${shadow}`}}>{subtitle}</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** common prop docs reused by every nature backdrop */
export const NATURE_DOCS = {
  timeOfDay: '"dawn" | "day" | "dusk" | "night" – sky and light palette preset',
  skyTop: 'override the top sky colour (hex); empty = from timeOfDay',
  skyBottom: 'override the horizon sky colour (hex); empty = from timeOfDay',
  accent: 'override the sun / moon / glow colour (hex); empty = from timeOfDay',
  speed: 'animation speed; quantised to whole cycles per loop so the clip loops seamlessly (0 = frozen)',
  density: 'multiplier for how many particles / elements are drawn',
  seed: 'random seed (changes the layout, not the look)',
  title: 'optional headline over the scene (empty = none)',
  subtitle: 'optional small line under the title (empty = none)',
  fontFamily: 'font role ("serif", "display", "sans", "grotesk", "hand", "mono") or any CSS family for title / subtitle',
  ink: 'title / subtitle colour; empty = from timeOfDay',
  titlePosition: '"center" | "top" | "bottom"',
  titleSize: 'title size multiplier',
};

/** twinkling stars whose twinkle repeats a whole number of times per loop (seamless) */
export const LoopStars: React.FC<{count: number; seed: number; p: number; color?: string; area?: [number, number, number, number]; size?: [number, number]; twinkle?: number; fade?: number}> = ({
  count,
  seed,
  p,
  color = '#FDF3DB',
  area = [0, 0, 1, 1],
  size = [0.8, 2.4],
  twinkle = 0.45,
  fade = 1,
}) => {
  const {w, h, u} = useStage();
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const x = (area[0] + (area[2] - area[0]) * hash01(seed, i, 1)) * w;
    const y = (area[1] + (area[3] - area[1]) * Math.pow(hash01(seed, i, 2), 1.2)) * h;
    const r = (size[0] + (size[1] - size[0]) * Math.pow(hash01(seed, i, 3), 2.4)) * u;
    const base = 0.35 + 0.5 * hash01(seed, i, 4);
    const o = Math.max(0, Math.min(1, base + twinkle * sinc(2 + Math.floor(hash01(seed, i, 5) * 4), p, hash01(seed, i, 6)))) * fade;
    if (o < 0.03) continue;
    out.push(<circle key={i} cx={x} cy={y} r={r} fill={color} opacity={o} />);
    if (hash01(seed, i, 7) < 0.05) {
      const L = r * 6;
      out.push(<path key={`g${i}`} d={`M${x - L} ${y}L${x + L} ${y}M${x} ${y - L}L${x} ${y + L}`} stroke={color} strokeWidth={0.7 * u} strokeLinecap="round" opacity={o * 0.6} />);
    }
  }
  return <g>{out}</g>;
};
