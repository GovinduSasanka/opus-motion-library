import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {FilmGrain, PaperTexture, Vignette, useStage} from '../../core/stage';
import {h1} from '../../core/r2-e4-kit';
import {defineMotion} from '../../core/types';
import {FilterDefs, GradientMapFilter, Plate, PlatePaletteName, useSafeId} from '../../core/image-kit';

/**
 * Two/three-tone recolour of a full-colour image, cross-faded in.
 *  - blue (video4 17.0 s): #1F4FA0 -> #E8EEF8, sweeps in over 4 frames.
 *  - pink-violet (video4 montage): #2A1E66 / #C04FB0 / #FFE6F4.
 *  - ink-etching (video5): #1E2A5E / #6A74A2 / #E6E9F3 + 45° / -45° cross-hatch masked by darkness.
 *  - madness (video21 15.93 s): 1-frame pale-green flash decaying ~halving every 2 f, then green ramp
 *    #030407 / #4E6A2C / #89E04D with a slow 1 s darken; optional flickering red word.
 *  - night (video16 grade-to-night): multiply #0C1A2E 0 -> 0.75, screen #2A4060 0.1, saturate 1 -> 0.7
 *    over ≈1.4 s (luma 122 -> 44).
 */
type Preset = 'blue' | 'pink-violet' | 'ink-etching' | 'madness' | 'night';

type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  preset: Preset;
  colors: string[];
  at: number;
  fade: number;
  push: number;
  hatch: number;
  word: string;
  wordColor: string;
  grain: number;
  sCurve: number;
  flicker: number;
  paperFibre: number;
  redOverlay: string;
  redAmount: number;
};

const PRESETS: Record<Preset, {colors: string[]; fade: number; contrast: number}> = {
  blue: {colors: ['#1F4FA0', '#E8EEF8'], fade: 4, contrast: 1.15},
  'pink-violet': {colors: ['#2A1E66', '#C04FB0', '#FFE6F4'], fade: 4, contrast: 1.1},
  'ink-etching': {colors: ['#1E2A5E', '#6A74A2', '#E6E9F3'], fade: 10, contrast: 1.2},
  madness: {colors: ['#030407', '#4E6A2C', '#89E04D'], fade: 1, contrast: 1.2},
  night: {colors: [], fade: 42, contrast: 1},
};

const Duotone: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps} = useStage();
  const id = useSafeId('duo');
  const pre = PRESETS[p.preset] ?? PRESETS.blue;
  const colors = p.colors.length >= 2 ? p.colors : pre.colors;
  const fadeLen = p.fade > 0 ? p.fade : pre.fade;
  const mix = p.preset === 'night' ? interpolate(frame, [p.at, p.at + fadeLen], [0, 1], {easing: ease.out, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : clamp((frame - p.at + 1) / Math.max(1, fadeLen));
  const zoom = 1 + (p.push / 100) * (frame / fps);

  const plate = (style?: React.CSSProperties) => (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '55% 50%', ...style}}>
      <Plate src={p.src} seed={p.seed} palette={p.palette} />
    </AbsoluteFill>
  );

  // madness flash: 1 frame to full, then exp decay (≈ halves every 2 f) + slow darken over 1 s
  const since = frame - p.at;
  const flash = p.preset === 'madness' && since >= 0 ? Math.exp(-since / 2.9) : 0;
  const darken = p.preset === 'madness' && since >= 0 ? interpolate(since, [5, 5 + fps], [0.15, 0.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const wordOn = p.word && p.preset === 'madness' && ((since >= 9 && since < 11) || since >= 14);

  const hatchOn = p.preset === 'ink-etching' && p.hatch > 0;
  const hs = 4 * u;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden', filter: p.flicker > 0 ? `brightness(${1 + (h1('duofl' + p.seed, frame) - 0.5) * 2 * p.flicker})` : undefined}}>
      {colors.length >= 2 && (
        <FilterDefs>
          <GradientMapFilter id={id} colors={colors} contrast={p.sCurve > 0 ? 1 + p.sCurve : pre.contrast} />
        </FilterDefs>
      )}
      {plate()}
      {p.preset === 'night' ? (
        <>
          <AbsoluteFill style={{opacity: mix}}>{plate({filter: 'saturate(0.7)'})}</AbsoluteFill>
          <AbsoluteFill style={{background: '#0C1A2E', mixBlendMode: 'multiply', opacity: 0.75 * mix}} />
          <AbsoluteFill style={{background: '#2A4060', mixBlendMode: 'screen', opacity: 0.1 * mix}} />
        </>
      ) : (
        mix > 0 && (
          <AbsoluteFill style={{opacity: mix}}>
            {plate({filter: `url(#${id})`})}
            {hatchOn && (
              // cross-hatch shown only in the darks: lighten(hatch, luminance) then multiply
              <AbsoluteFill style={{isolation: 'isolate', mixBlendMode: 'multiply', opacity: p.hatch * 2.2}}>
                <AbsoluteFill
                  style={{
                    backgroundColor: '#fff',
                    backgroundImage: `repeating-linear-gradient(45deg, #1E2A5E 0px, #1E2A5E ${0.9 * u}px, transparent ${0.9 * u}px, transparent ${hs}px), repeating-linear-gradient(-45deg, #1E2A5E 0px, #1E2A5E ${0.9 * u}px, transparent ${0.9 * u}px, transparent ${hs}px)`,
                  }}
                />
                {plate({filter: 'grayscale(1) contrast(1.4) brightness(1.15)', mixBlendMode: 'lighten'})}
              </AbsoluteFill>
            )}
          </AbsoluteFill>
        )
      )}
      {p.preset === 'madness' && (
        <>
          <AbsoluteFill style={{background: '#000', opacity: darken}} />
          <AbsoluteFill style={{background: '#B6F0BE', mixBlendMode: 'screen', opacity: flash}} />
        </>
      )}
      {wordOn && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: h * 0.17}}>
          <div style={{fontFamily: `"Yu Mincho", "MS Mincho", "Noto Serif JP", ${fonts.serif}`, fontWeight: 700, fontSize: 65 * u, color: p.wordColor, letterSpacing: 6 * u}}>{p.word}</div>
        </AbsoluteFill>
      )}
      {p.redOverlay && p.redAmount > 0 && <AbsoluteFill style={{background: p.redOverlay, mixBlendMode: 'multiply', opacity: p.redAmount * clamp(mix * 1.5)}} />}
      {p.paperFibre > 0 && (
        <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: p.paperFibre}}>
          <PaperTexture opacity={1} seed={p.seed} tint="#b09a78" scale={1.4} />
        </AbsoluteFill>
      )}
      <Vignette strength={0.3} />
      {p.grain > 0 && <FilmGrain opacity={p.grain * 2} />}
    </AbsoluteFill>
  );
};

export const duotone = defineMotion<Props>({
  id: 'duotone',
  title: 'Duotone recolour',
  category: 'image',
  description: 'A full-colour image cross-fades into a 2–3 colour brand ramp (blue, pink-violet, ink etching with cross-hatch, madness green flash or a day-to-night grade).',
  source: ['video4 0:17 duotone-recolor', 'video5 ink-etching-tint', 'video21 0:15.9 madness-flash-tint', 'video16 0:44.6-0:46 grade-to-night'],
  useFor: 'Brand-colour unification of mixed stills, mood switches (calm -> panic, day -> night), print-style looks.',
  durationInFrames: 120,
  defaultProps: {
    src: '',
    seed: 1,
    palette: 'dusk',
    preset: 'blue',
    colors: [],
    at: 36,
    fade: 0,
    push: 1.5,
    hatch: 0.25,
    word: '',
    wordColor: '#DA4F4D',
    grain: 0.03,
    sCurve: 0,
    flicker: 0,
    paperFibre: 0,
    redOverlay: '',
    redAmount: 0.4,
  },
  propDocs: {
    src: 'public/ image path; empty = procedural plate',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    preset: 'blue | pink-violet | ink-etching | madness | night',
    colors: 'custom ramp dark -> light (2–3 hex colours) overriding the preset',
    at: 'frame the recolour starts',
    fade: 'cross-fade length in frames (0 = preset: 4 / 4 / 10 / 1 / 42)',
    push: 'slow push-in in %/s',
    hatch: 'ink-etching: cross-hatch opacity in the darks (0.25 in the source)',
    word: 'madness: word that flickers on (+0.30 s for 2 f, off 3 f, then steady), e.g. 狂気',
    wordColor: 'madness: word colour',
    grain: 'film grain amount',
    sCurve: 'S-curve contrast strength for the ramp (0 = preset; 0.32 print grade, 0.18 documents)',
    flicker: 'archive-film brightness flicker amount (0.025 = +-2.5 %)',
    paperFibre: 'paper-fibre texture multiplied over the print 0..1 (0.5 = print grade)',
    redOverlay: 'spot-colour layer multiplied over the recolour (e.g. #D23A2A constructivist red); empty = none',
    redAmount: 'opacity of the redOverlay layer',
  },
  component: Duotone,
  tags: ['image', 'duotone', 'grade', 'recolour', 'tint', 'day-to-night', 'flash', 'print grade', 'ink on paper', 'constructivist', 'archive', 'flicker', 'paper fibre'],
});
