import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {onTwos} from '../../core/ease';
import {n2} from '../../core/random';
import {FilmGrain, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {FilterDefs, Plate, PlatePaletteName, hexRgb, mixRgb, usePlatePixels, useSafeId} from '../../core/image-kit';
import {buildCutout, plateKick} from '../../core/r2-up-kit';

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
  registrationKick?: number;
  kickFrames?: number[];
  registrationDrift?: number;
  driftRange?: number[];
  tint?: string;
  spotInks?: string[];
  offsetShadow?: number;
  shadowInk?: string;
  shadowAngle?: number;
  cutout?: boolean;
  rim?: number;
  facets?: number;
  rimColor?: string;
  cutoutBg?: string;
};

/** paper rim + faceted scissor outline, then the image (clipped to a hand-cut ellipse when it is opaque) */
const CutoutLayer: React.FC<{p: Props; W: number; H: number; u: number}> = ({p, W, H, u}) => {
  const px = usePlatePixels({src: p.src, seed: p.seed, palette: p.palette}, 240);
  const cut = React.useMemo(() => {
    if (!px) return null;
    const cells = (px.w / (W / 1.5)) * u;
    return buildCutout(px, (p.rim ?? 14) * cells, (p.facets ?? 5) * cells, p.seed);
  }, [px, p.rim, p.facets, p.seed, u, W]);
  const path = (poly: [number, number][]) => poly.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * W).toFixed(1)} ${(y * H).toFixed(1)}`).join(' ') + 'Z';
  const clip = cut?.inner ? `polygon(${cut.inner.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(',')})` : undefined;
  return (
    <>
      {cut && (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <path d={path(cut.outer)} transform={`translate(${5 * u} ${7 * u})`} fill="#000" opacity={0.3} />
          <path d={path(cut.outer)} fill={p.rimColor ?? '#f6f1e4'} />
        </svg>
      )}
      <Plate src={p.src} seed={p.seed} palette={p.palette} width={W} height={H} style={clip ? {clipPath: clip} : undefined} />
    </>
  );
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
  const kick = plateKick(frame, fps, u, {
    amp: p.registrationKick ?? 0,
    frames: p.kickFrames ?? [30, 75, 120],
    drift: p.registrationDrift ?? 0,
    driftRange: [p.driftRange?.[0] ?? 30, p.driftRange?.[1] ?? 110],
    seed: p.seed,
  });
  // spot-ink / paper-tint tone map (replaces the posterised colour when set)
  const spot = (p.spotInks ?? []).filter(Boolean);
  const tone = (() => {
    if (!spot.length && !p.tint) return null;
    const paper = hexRgb(p.tint || '#f3ecd8');
    const cols = spot.length ? [...spot.map((c) => hexRgb(c)), paper] : Array.from({length: levels}, (_, i) => mixRgb(hexRgb('#16081C'), paper, i / (levels - 1)));
    const t = (ch: number) => cols.map((c) => (c[ch] / 255).toFixed(3)).join(' ');
    return [t(0), t(1), t(2)];
  })();
  const sh = p.offsetShadow ?? 0;
  const sAng = ((p.shadowAngle ?? 45) * Math.PI) / 180;
  const la = (-p.dotAngle * Math.PI) / 180;
  const svx = Math.cos(sAng) * sh * u;
  const svy = Math.sin(sAng) * sh * u;
  const sdx = svx * Math.cos(la) - svy * Math.sin(la);
  const sdy = svx * Math.sin(la) + svy * Math.cos(la);
  const shRgb = hexRgb(p.shadowInk ?? '#2b49c4');
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
          {tone ? (
            <>
              <feColorMatrix in="SourceGraphic" type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" result="lumT" />
              <feComponentTransfer in="lumT" result="post">
                <feFuncR type="discrete" tableValues={tone[0]} />
                <feFuncG type="discrete" tableValues={tone[1]} />
                <feFuncB type="discrete" tableValues={tone[2]} />
              </feComponentTransfer>
            </>
          ) : (
            <>
              <feColorMatrix in="SourceGraphic" type="saturate" values="1.25" result="sat" />
              <feComponentTransfer in="sat" result="post">
                <feFuncR type="discrete" tableValues={post} />
                <feFuncG type="discrete" tableValues={post} />
                <feFuncB type="discrete" tableValues={post} />
              </feComponentTransfer>
            </>
          )}
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
          {/* offset spot-ink shadow: outlines + deep shadows re-printed in a second ink, shifted, multiplied */}
          {sh > 0 && (
            <>
              <feComponentTransfer in="lum0" result="deepM">
                <feFuncR type="discrete" tableValues="1 1 1 0 0 0 0 0 0 0" />
                <feFuncG type="discrete" tableValues="1 1 1 0 0 0 0 0 0 0" />
                <feFuncB type="discrete" tableValues="1 1 1 0 0 0 0 0 0 0" />
              </feComponentTransfer>
              <feComposite in="edge" in2="deepM" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="shSrc" />
              <feOffset in="shSrc" dx={sdx + (kick ? kick.g[0] : 0)} dy={sdy + (kick ? kick.g[1] : 0)} result="shOff" />
              <feComponentTransfer in="shOff" result="shKeep">
                <feFuncR type="linear" slope={-(1 - shRgb[0] / 255)} intercept="1" />
                <feFuncG type="linear" slope={-(1 - shRgb[1] / 255)} intercept="1" />
                <feFuncB type="linear" slope={-(1 - shRgb[2] / 255)} intercept="1" />
              </feComponentTransfer>
              <feComposite in="inked" in2="shKeep" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="inkedS" />
            </>
          )}
          {/* misregistration: R one way, B the other */}
          <feColorMatrix in={sh > 0 ? 'inkedS' : 'inked'} type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="rC" />
          <feOffset in="rC" dx={mr + (kick ? kick.r[0] : 0)} dy={-mr * 0.4 + (kick ? kick.r[1] : 0)} result="rO" />
          <feColorMatrix in={sh > 0 ? 'inkedS' : 'inked'} type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result={kick ? 'gC0' : 'gC'} />
          {kick && <feOffset in="gC0" dx={kick.g[0]} dy={kick.g[1]} result="gC" />}
          <feColorMatrix in={sh > 0 ? 'inkedS' : 'inked'} type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="bC" />
          <feOffset in="bC" dx={-mr + (kick ? kick.b[0] : 0)} dy={mr * 0.4 + (kick ? kick.b[1] : 0)} result="bO" />
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
          background: p.cutout ? p.cutoutBg ?? '#f2c230' : '#000',
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', left: (RW - w) / 2, top: (RH - h) / 2, width: w, height: h, transform: `rotate(${-p.dotAngle}deg)`}}>
          <div style={{position: 'absolute', left: -w * 0.25, top: -h * 0.25, width: w * 1.5, height: h * 1.5, transform: `translate(${panX}px, 0px) scale(${zoom / 1.5})`, transformOrigin: '50% 50%'}}>
            {p.cutout ? <CutoutLayer p={p} W={w * 1.5} H={h * 1.5} u={u} /> : <Plate src={p.src} seed={p.seed} palette={p.palette} width={w * 1.5} height={h * 1.5} />}
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
    registrationKick: 0,
    kickFrames: [30, 75, 120],
    registrationDrift: 0,
    driftRange: [30, 110],
    tint: '',
    spotInks: [],
    offsetShadow: 0,
    shadowInk: '#2b49c4',
    shadowAngle: 45,
    cutout: false,
    rim: 14,
    facets: 5,
    rimColor: '#f6f1e4',
    cutoutBg: '#f2c230',
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
    registrationKick: 'opt-in: colour plates jolt apart and ring back into register on each kick frame; amplitude in px (8-14 typical, 0 = off)',
    kickFrames: 'frames the registration kicks land on (e.g. on the beats)',
    registrationDrift: 'opt-in: plates slowly drift apart up to N px (about 25) over driftRange, then snap back with a click (0 = off)',
    driftRange: '[from, to] frames of the drift; the snap lands on `to`',
    tint: 'opt-in mono mode: paper tint colour (e.g. #efe3c2); picture becomes ink-to-paper tones under the halftone dots (empty = full colour)',
    spotInks: 'opt-in flat spot inks, dark to light (e.g. ["#1b2a6b","#e8452c"]); picture split into flat bands of these inks plus the paper tint',
    offsetShadow: 'opt-in misregistered offset shadow: outlines and deep shadows re-printed in shadowInk, shifted N px, multiplied (0 = off)',
    shadowInk: 'colour of the offset shadow ink',
    shadowAngle: 'direction of the offset shadow in degrees (0 = right, 90 = down)',
    cutout: 'opt-in scissor cut-out: a transparent-PNG src gets a faceted paper rim + drop shadow on a flat background; opaque images are cut to a hand-cut ellipse',
    rim: 'cut-out rim width in px at 1080p',
    facets: 'cut-out polygon tolerance in px (higher = fewer, more angular scissor facets)',
    rimColor: 'cut-out rim paper colour',
    cutoutBg: 'flat background colour behind the cut-out',
  },
  component: ComicHalftone,
  tags: ['image', 'comic', 'halftone', 'pop-art', 'toon', 'outline', 'on-twos', 'post', 'registration-kick', 'misregistration', 'spot-ink', 'offset-shadow', 'cutout', 'scissor', 'dossier', 'riso', 'beat-sync'],
});
