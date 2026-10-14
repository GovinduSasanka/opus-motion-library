import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {clamp, prog} from '../../core/ease';
import {n2} from '../../core/random';
import {FilmGrain, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {ChannelLayer, FilterDefs, Plate, PlatePaletteName, buildPlate, useSafeId} from '../../core/image-kit';

/**
 * Cinematic finishing stack (video8 film-post-stack, video16 anamorphic-flare, video21 letterbox):
 *  - grain: per-frame monochrome noise, overlay; vignette: corners ≈ −25 %
 *  - bloom: highlights above 0.8 blurred (≈2 % H) and added at 0.35
 *  - chromatic fringe: R scaled out / B scaled in about the centre (≈0.5–1 px at the edges)
 *  - anamorphic streak: 1 px core + 8 px glow, #7FA8FF @50 %, across 80 % W at the light's height,
 *    flickering with occlusion, plus 2 ghost discs mirrored through the centre
 *  - optional 2.39:1 hard letterbox, gate weave and exposure flicker.
 * overlay: true draws only grain / vignette / flare / bars on a transparent background (put it on top
 * of any other scene).
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  overlay: boolean;
  grain: number;
  vignette: number;
  bloom: number;
  threshold: number;
  fringe: number;
  flare: boolean;
  flareX: number;
  flareY: number;
  flareColor: string;
  flareLength: number;
  letterbox: 'auto' | 'on' | 'off';
  aspect: number;
  weave: number;
  push: number;
};

const FilmLook: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: D, portrait} = useStage();
  const id = useSafeId('film');
  const zoom = 1 + (p.push / 100) * (frame / fps);
  const originX = 0.6;
  const originY = 0.55;

  // light position: procedural sun (follows the push) or the given point
  let lx = p.flareX * w;
  let ly = p.flareY * h;
  if (!p.src && !p.overlay && (p.flareX < 0 || p.flareY < 0)) {
    const sc = buildPlate(w, h, {seed: p.seed, palette: p.palette, unit: u});
    lx = originX * w + (sc.sun.x - originX * w) * zoom;
    ly = originY * h + (sc.sun.y - originY * h) * zoom;
  } else {
    if (p.flareX < 0) lx = 0.62 * w;
    if (p.flareY < 0) ly = 0.45 * h;
  }

  // gate weave + exposure flicker
  const wx = (random(`wx${frame}`) - 0.5) * 2 * p.weave * u;
  const wy = (random(`wy${frame}`) - 0.5) * 2 * p.weave * u;
  const expo = 1 + (random(`ex${frame}`) - 0.5) * 0.03;

  // flare intensity: fades up, flickers with "occlusion" (two dips), noise shimmer
  const occl = 1 - 0.75 * Math.exp(-Math.pow((frame - D * 0.55) / 6, 2)) - 0.5 * Math.exp(-Math.pow((frame - D * 0.62) / 3, 2));
  const fi = prog(frame, 4, 24) * clamp(occl) * (0.85 + 0.15 * n2('fl' + p.seed, frame * 0.35, 0.2));
  const len = p.flareLength * w * 0.5;

  const boxed = p.letterbox === 'on' || (p.letterbox === 'auto' && !portrait);
  const bar = boxed ? Math.max(0, (h - w / p.aspect) / 2) : 0;

  const fr = p.fringe * u;
  const sR = 1 + fr / (w / 2);
  const sB = 1 - fr / (w / 2);
  const plate = (s: number) => (
    <AbsoluteFill style={{transform: `scale(${zoom * s})`, transformOrigin: `${originX * 100}% ${originY * 100}%`}}>
      <Plate src={p.src} seed={p.seed} palette={p.palette} />
    </AbsoluteFill>
  );
  const th = clamp(p.threshold, 0, 0.98);

  return (
    <AbsoluteFill style={{background: p.overlay ? 'transparent' : '#000', overflow: 'hidden'}}>
      {!p.overlay && (
        <>
          <FilterDefs>
            <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              {/* luminance key above the threshold keeps its colour, then blur + screen-add */}
              <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2126 0.7152 0.0722 0 0" result="la" />
              <feComponentTransfer in="la" result="key">
                <feFuncA type="linear" slope={1 / (1 - th)} intercept={-th / (1 - th)} />
              </feComponentTransfer>
              <feComposite in="SourceGraphic" in2="key" operator="in" result="hi" />
              <feGaussianBlur in="hi" stdDeviation={0.02 * h} result="hb" />
              <feComposite in="SourceGraphic" in2="hb" operator="arithmetic" k1={-p.bloom} k2={expo} k3={p.bloom} k4="0" />
            </filter>
          </FilterDefs>
          <AbsoluteFill style={{transform: `translate(${wx}px, ${wy}px) scale(1.004)`, filter: `url(#${id})`, background: '#000', isolation: 'isolate'}}>
            {p.fringe > 0 ? (
              <>
                <ChannelLayer ch="r">{plate(sR)}</ChannelLayer>
                <ChannelLayer ch="g">{plate(1)}</ChannelLayer>
                <ChannelLayer ch="b">{plate(sB)}</ChannelLayer>
              </>
            ) : (
              plate(1)
            )}
          </AbsoluteFill>
        </>
      )}
      {p.flare && fi > 0.001 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', pointerEvents: 'none'}}>
          <defs>
            <linearGradient id={`${id}s`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={p.flareColor} stopOpacity={0} />
              <stop offset="0.35" stopColor={p.flareColor} stopOpacity={0.35} />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity={0.9} />
              <stop offset="0.65" stopColor={p.flareColor} stopOpacity={0.35} />
              <stop offset="1" stopColor={p.flareColor} stopOpacity={0} />
            </linearGradient>
            <radialGradient id={`${id}c`}>
              <stop offset="0" stopColor="#ffffff" stopOpacity={0.8} />
              <stop offset="0.3" stopColor={p.flareColor} stopOpacity={0.35} />
              <stop offset="1" stopColor={p.flareColor} stopOpacity={0} />
            </radialGradient>
            <filter id={`${id}b`} x="-10%" y="-400%" width="120%" height="900%">
              <feGaussianBlur stdDeviation={4 * u} />
            </filter>
            <filter id={`${id}b2`} x="-10%" y="-400%" width="120%" height="900%">
              <feGaussianBlur stdDeviation={8 * u} />
            </filter>
          </defs>
          <g opacity={fi}>
            {/* soft 8 px glow + 1 px core streak */}
            <ellipse cx={lx} cy={ly} rx={len * 1.05} ry={34 * u} fill={`url(#${id}s)`} filter={`url(#${id}b2)`} opacity={0.22} />
            <ellipse cx={lx} cy={ly} rx={len} ry={11 * u} fill={`url(#${id}s)`} filter={`url(#${id}b2)`} opacity={1} />
            <ellipse cx={lx} cy={ly} rx={len * 0.95} ry={2.5 * u} fill={`url(#${id}s)`} filter={`url(#${id}b)`} opacity={0.9} />
            <rect x={lx - len * 0.8} y={ly - 0.6 * u} width={len * 1.6} height={1.2 * u} fill={`url(#${id}s)`} />
            <circle cx={lx} cy={ly} r={110 * u} fill={`url(#${id}c)`} opacity={0.6} />
            {/* ghosts mirrored through the centre */}
            {[0.55, 1.25].map((k, i) => {
              const gx = w / 2 - (lx - w / 2) * k;
              const gy = h / 2 - (ly - h / 2) * k;
              return <circle key={i} cx={gx} cy={gy} r={(i ? 34 : 18) * u} fill={p.flareColor} opacity={i ? 0.1 : 0.16} />;
            })}
          </g>
        </svg>
      )}
      {p.vignette > 0 && <Vignette strength={p.vignette} />}
      {p.grain > 0 && <FilmGrain opacity={p.grain} every={1} />}
      {bar > 0 && (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: w, height: Math.round(bar), background: '#000'}} />
          <div style={{position: 'absolute', left: 0, bottom: 0, width: w, height: Math.round(bar), background: '#000'}} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const filmLook = defineMotion<Props>({
  id: 'film-look',
  title: 'Film finishing stack',
  category: 'image',
  description: 'Cinematic finish over an image: bloom on highlights, radial chromatic fringe, grain, vignette, gate weave, a flickering blue anamorphic flare streak and optional 2.39:1 bars (or overlay-only mode).',
  source: ['video8 film-post-stack', 'video16 0:30.8-0:31.9 anamorphic-flare', 'video21 cinemascope-letterbox'],
  useFor: 'Making any still or scene feel shot on film; a final pass over composites; a flare accent on a light source.',
  durationInFrames: 150,
  defaultProps: {
    src: '',
    seed: 1,
    palette: 'dusk',
    overlay: false,
    grain: 0.1,
    vignette: 0.35,
    bloom: 0.35,
    threshold: 0.8,
    fringe: 1,
    flare: true,
    flareX: -1,
    flareY: -1,
    flareColor: '#7FA8FF',
    flareLength: 0.8,
    letterbox: 'auto',
    aspect: 2.39,
    weave: 0.6,
    push: 1,
  },
  propDocs: {
    src: 'public/ image path; empty = procedural plate',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette: dusk | night | dawn',
    overlay: 'true = transparent background, only grain / vignette / flare / bars (layer over another scene)',
    grain: 'grain opacity (overlay blend)',
    vignette: 'corner darkening 0..1 (≈0.25–0.35)',
    bloom: 'bloom mix over highlights (0.35)',
    threshold: 'bloom luminance threshold (0.8)',
    fringe: 'chromatic fringe at the frame edge in px at 1080p',
    flare: 'draw the anamorphic streak',
    flareX: 'light x 0..1 (-1 = the procedural sun / 0.62)',
    flareY: 'light y 0..1 (-1 = the procedural sun / 0.45)',
    flareColor: 'streak colour (#7FA8FF measured)',
    flareLength: 'streak length as a fraction of the width (0.8)',
    letterbox: 'auto (landscape only) | on | off',
    aspect: 'letterbox picture aspect (2.39)',
    weave: 'gate weave jitter in px',
    push: 'slow push-in in %/s',
  },
  component: FilmLook,
  tags: ['image', 'film', 'grain', 'bloom', 'flare', 'anamorphic', 'letterbox', 'vignette', 'overlay', 'post'],
});
