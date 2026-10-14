import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {onTwos} from '../../core/ease';
import {n2} from '../../core/random';
import {FilmGrain, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FilterDefs, Plate, PlatePaletteName, useSafeId} from '../../core/image-kit';

/**
 * video12 comic-halftone-postfx + render-on-twos: print-comic finish over an image.
 *  - posterised toon colour (4–5 steps per channel, +25 % saturation)
 *  - luminance-driven ink dots on a 45° screen (5 px pitch at 1080p) in the mid/shadow band
 *    (0.2 < L < 0.75; deeper shadows go solid, highlights stay flat)
 *  - ink outlines ≈3–4 px from a Laplacian edge pass (#16081C)
 *  - colour misregistration (R pushed one way, B the other, ≈3 px) + light bloom, vignette, grain
 *  - the whole thing updates every 2nd frame (15 fps comic cadence).
 * Everything happens in one SVG filter on a 45°-rotated layer, so it works on any `src`.
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  dotPitch: number;
  dotAngle: number;
  dotBand: number[];
  inkStrength: number;
  levels: number;
  outline: number;
  edgeThreshold: number;
  misregister: number;
  step: number;
  push: number;
  pan: number;
  vignette: number;
  grain: number;
};

const ComicHalftone: React.FC<Props> = (p) => {
  const raw = useCurrentFrame();
  const frame = p.step > 1 ? onTwos(raw, p.step) : raw;
  const {w, h, u, fps} = useStage();
  const id = useSafeId('comic');
  const pitch = Math.max(3, Math.round(p.dotPitch * u));
  const dot = Math.max(1, Math.round(pitch * 0.5));
  const off = Math.floor((pitch - dot) / 2);
  const [lo, hi] = [p.dotBand[0] ?? 0.2, p.dotBand[1] ?? 0.75];
  // dot coverage per luminance (21 samples): 0 outside [lo, hi], up to 0.62 near lo
  const dtab = Array.from({length: 21}, (_, i) => {
    const L = i / 20;
    if (L < lo - 0.04 || L > hi) return '0';
    const t = Math.min(1, (hi - L) / (hi - lo));
    const fadeLo = Math.min(1, Math.max(0, (L - (lo - 0.04)) / 0.08));
    return (0.62 * Math.sqrt(t) * fadeLo).toFixed(3);
  }).join(' ');
  const levels = Math.max(2, Math.round(p.levels));
  const post = Array.from({length: levels}, (_, i) => (0.04 + (0.96 * i) / (levels - 1)).toFixed(3)).join(' ');
  const mr = p.misregister * u * (0.8 + 0.4 * (0.5 + 0.5 * n2('mr' + p.seed, frame * 0.05, 0)));
  const ang = (p.dotAngle * Math.PI) / 180;
  const ca = Math.abs(Math.cos(ang));
  const sa = Math.abs(Math.sin(ang));
  // rotated layer large enough to cover the frame
  const RW = Math.ceil(w * ca + h * sa) + 8;
  const RH = Math.ceil(w * sa + h * ca) + 8;
  const t = frame / fps;
  const zoom = 1.02 + (p.push / 100) * t;
  const panX = p.pan * u * t;
  const k = 14; // threshold sharpness
  const ink = p.inkStrength;
  const ow = Math.max(0.5, p.outline * u * 0.5);
  const eth = p.edgeThreshold;

  return (
    <AbsoluteFill style={{background: '#16081C', overflow: 'hidden'}}>
      <FilterDefs>
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB" primitiveUnits="userSpaceOnUse">
          {/* toon colour */}
          <feColorMatrix in="SourceGraphic" type="saturate" values="1.25" result="sat" />
          <feComponentTransfer in="sat" result="post">
            <feFuncR type="discrete" tableValues={post} />
            <feFuncG type="discrete" tableValues={post} />
            <feFuncB type="discrete" tableValues={post} />
          </feComponentTransfer>
          {/* luminance */}
          <feColorMatrix in="SourceGraphic" type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" result="lum0" />
          <feGaussianBlur in="lum0" stdDeviation={Math.max(0.6, pitch * 0.25)} result="lum" />
          {/* halftone screen: one soft bump per cell */}
          <feFlood x={off} y={off} width={dot} height={dot} floodColor="#fff" result="d0" />
          <feComposite in="d0" in2="d0" x="0" y="0" width={pitch} height={pitch} result="cell" />
          <feTile in="cell" result="tiles" />
          <feGaussianBlur in="tiles" stdDeviation={pitch * 0.24} result="bumpA" />
          <feColorMatrix in="bumpA" type="matrix" values="0 0 0 1.25 0 0 0 0 1.25 0 0 0 0 1.25 0 0 0 0 0 1" result="bump" />
          {/* dot size in the band lo..hi: grows toward lo, none outside (flat extremes) */}
          <feComponentTransfer in="lum" result="dark">
            <feFuncR type="table" tableValues={dtab} />
            <feFuncG type="table" tableValues={dtab} />
            <feFuncB type="table" tableValues={dtab} />
          </feComponentTransfer>
          {/* dot mask M = step(bump + D - 1) */}
          <feComposite in="bump" in2="dark" operator="arithmetic" k1="0" k2={k} k3={k} k4={-k + 0.5} result="mask" />
          {/* multiply by (1 - ink * M); keeps alpha at 1 */}
          <feComponentTransfer in="mask" result="keepD">
            <feFuncR type="linear" slope={-ink} intercept="1" />
            <feFuncG type="linear" slope={-ink} intercept="1" />
            <feFuncB type="linear" slope={-ink} intercept="1" />
          </feComponentTransfer>
          <feComposite in="post" in2="keepD" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="dotted" />
          {/* ink outlines: |Laplacian| of luminance, thresholded and thickened */}
          <feGaussianBlur in="lum0" stdDeviation={0.9 * u} result="lumE" />
          <feConvolveMatrix in="lumE" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e1" />
          <feConvolveMatrix in="lumE" order="3" kernelMatrix="1 1 1 1 -8 1 1 1 1" preserveAlpha="true" result="e2" />
          <feComposite in="e1" in2="e2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="e" />
          <feComponentTransfer in="e" result="et">
            <feFuncR type="linear" slope={1 / Math.max(0.01, eth)} intercept={-0.4} />
            <feFuncG type="linear" slope={1 / Math.max(0.01, eth)} intercept={-0.4} />
            <feFuncB type="linear" slope={1 / Math.max(0.01, eth)} intercept={-0.4} />
          </feComponentTransfer>
          <feMorphology in="et" operator="dilate" radius={ow} result="edge" />
          <feComponentTransfer in="edge" result="keepE">
            <feFuncR type="linear" slope="-0.92" intercept="1" />
            <feFuncG type="linear" slope="-0.92" intercept="1" />
            <feFuncB type="linear" slope="-0.92" intercept="1" />
          </feComponentTransfer>
          <feComposite in="dotted" in2="keepE" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="inked" />
          {/* misregistration: R one way, B the other */}
          <feColorMatrix in="inked" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="rC" />
          <feOffset in="rC" dx={mr} dy={-mr * 0.4} result="rO" />
          <feColorMatrix in="inked" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="gC" />
          <feColorMatrix in="inked" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="bC" />
          <feOffset in="bC" dx={-mr} dy={mr * 0.4} result="bO" />
          <feComposite in="rO" in2="gC" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="rg" />
          <feComposite in="rg" in2="bO" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
        </filter>
      </FilterDefs>
      {/* rotated, filtered layer -> 45° dot screen */}
      <div
        style={{
          position: 'absolute',
          left: (w - RW) / 2,
          top: (h - RH) / 2,
          width: RW,
          height: RH,
          transform: `rotate(${p.dotAngle}deg)`,
          filter: `url(#${id})`,
          background: '#000',
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', left: (RW - w) / 2, top: (RH - h) / 2, width: w, height: h, transform: `rotate(${-p.dotAngle}deg)`}}>
          <div style={{position: 'absolute', left: -w * 0.25, top: -h * 0.25, width: w * 1.5, height: h * 1.5, transform: `translate(${panX}px, 0px) scale(${zoom / 1.5})`, transformOrigin: '50% 50%'}}>
            <Plate src={p.src} seed={p.seed} palette={p.palette} width={w * 1.5} height={h * 1.5} />
          </div>
        </div>
      </div>
      {/* light bloom on highlights + vignette + grain */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(22,8,28,0) 55%, rgba(22,8,28,${p.vignette}) 100%)`}} />
      {p.grain > 0 && <FilmGrain opacity={p.grain} every={p.step > 1 ? p.step : 1} />}
    </AbsoluteFill>
  );
};

export const comicHalftone = defineMotion<Props>({
  id: 'comic-halftone',
  title: 'Comic halftone post FX',
  category: 'image',
  description: 'Print-comic finish over an image: posterised toon colour, 45° halftone ink dots in the midtones and shadows, ink outlines, colour misregistration and vignette, animated on twos.',
  source: ['video12 0:00-1:10 comic-halftone-postfx', 'video12 render-on-twos'],
  useFor: 'Comic / pop-art stylisation of any still or render, playful explainers, a stylised hold before comic SFX overlays.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 1,
    palette: 'dusk',
    dotPitch: 6,
    dotAngle: 45,
    dotBand: [0.2, 0.75],
    inkStrength: 0.55,
    levels: 5,
    outline: 3.5,
    edgeThreshold: 0.14,
    misregister: 3,
    step: 2,
    push: 2.5,
    pan: -12,
    vignette: 0.35,
    grain: 0.06,
  },
  propDocs: {
    src: 'public/ image path; empty = procedural plate',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    dotPitch: 'halftone cell size in px at 1080p (5 in the source)',
    dotAngle: 'screen angle in degrees (45)',
    dotBand: '[lo, hi] luminance band that gets ink dots (0.2–0.75); outside it colours stay flat',
    inkStrength: 'how dark the dots print (0..1)',
    levels: 'posterise steps per channel',
    outline: 'ink outline width in px at 1080p (3–4)',
    edgeThreshold: 'edge sensitivity (lower = more lines)',
    misregister: 'colour misregistration offset in px',
    step: 'hold every drawing for N frames (2 = on twos, 1 = smooth)',
    push: 'slow push-in in %/s',
    pan: 'lateral drift in px/s',
    vignette: 'corner darkening',
    grain: 'grain amount',
  },
  component: ComicHalftone,
  tags: ['image', 'comic', 'halftone', 'pop-art', 'toon', 'outline', 'on-twos', 'post'],
});
