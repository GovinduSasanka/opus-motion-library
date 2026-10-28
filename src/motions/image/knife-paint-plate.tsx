// Adapted from lemo-opuscar/styles/impasto/demo/engine/impasto.js + plate.js (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {buildKnife, CanvasWeave, KNIFE_PAL, KnifeLayers, KnifePal} from '../../core/r2-la3b-kit';
import {eio3, lerp, seg} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  src: string;
  strokeScale: number;
  lightAngle: number;
  lightElevation: number;
  spec: number;
  grey: number;
  appearAt: number;
  appearDur: number;
  seed: number;
  palette: Partial<KnifePal>;
  canvas: string;
  /** keyframes [[frame, elevation 0..1], ...] for the raking light; [] = constant lightElevation */
  lightKeys: number[][];
  /** frame of an emotional-peak raking-light dip (0 = off): elevation falls to rakingLow then settles back */
  rakingAt: number;
  rakingLow: number;
  rakingDur: number;
};

const KnifePaintPlate: React.FC<Props> = ({src, strokeScale, lightAngle, lightElevation, spec, grey, appearAt, appearDur, seed, palette, canvas, lightKeys, rakingAt, rakingLow, rakingDur}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const pal = {...KNIFE_PAL, ...palette};
  const strokes = React.useMemo(() => buildKnife(w, h, u, {scale: strokeScale, seed, pal}), [w, h, u, strokeScale, seed, JSON.stringify(palette)]);
  // raking light drifts slowly once the plate is painted; the camera pushes in a touch
  const drift = Math.sin(frame / 60) * 0.22;
  const la = (lightAngle * Math.PI) / 180 + drift;
  const push = lerp(1, 1.06, eio3(seg(frame, 0, durationInFrames)));
  let elev = lightElevation;
  if (lightKeys.length >= 2) {
    const ks = lightKeys;
    if (frame <= ks[0][0]) elev = ks[0][1];
    else if (frame >= ks[ks.length - 1][0]) elev = ks[ks.length - 1][1];
    else {
      for (let i = 0; i < ks.length - 1; i++) {
        if (frame >= ks[i][0] && frame <= ks[i + 1][0]) {
          elev = lerp(ks[i][1], ks[i + 1][1], eio3(seg(frame, ks[i][0], ks[i + 1][0])));
          break;
        }
      }
    }
  } else if (rakingAt > 0) {
    // elevation .7 -> .15 -> .6 over ~2 s: dips to a grazing angle so every ridge glints, then settles
    const dip = eio3(seg(frame, rakingAt, rakingAt + rakingDur * 0.4)) * (1 - eio3(seg(frame, rakingAt + rakingDur * 0.5, rakingAt + rakingDur)));
    elev = lerp(lightElevation, rakingLow, dip);
  }
  const grazing = lightKeys.length >= 2 || rakingAt > 0 ? 1 + 1.4 * (1 - elev / Math.max(0.01, lightElevation + 0.0001)) * 0.5 : 1;
  const ridge = spec * (0.6 + elev * 0.9) * (grazing > 1 ? Math.min(2, grazing + (lightElevation - elev) * 1.2) : 1);
  const sweep = seg(frame, appearAt, appearAt + appearDur + 12);
  return (
    <AbsoluteFill style={{background: canvas, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="kpp-paint" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={2.2 * u} result="b" />
            <feMorphology in="b" operator="dilate" radius={Math.max(1, 3 * u * strokeScale)} result="m" />
            <feTurbulence type="fractalNoise" baseFrequency={0.012 / u} numOctaves="2" seed={seed} result="n" />
            <feDisplacementMap in="m" in2="n" scale={26 * u} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComponentTransfer in="d">
              <feFuncR type="discrete" tableValues="0 .09 .18 .27 .36 .45 .55 .64 .73 .82 .91 1" />
              <feFuncG type="discrete" tableValues="0 .09 .18 .27 .36 .45 .55 .64 .73 .82 .91 1" />
              <feFuncB type="discrete" tableValues="0 .09 .18 .27 .36 .45 .55 .64 .73 .82 .91 1" />
            </feComponentTransfer>
          </filter>
          <linearGradient id="kpp-sweep" x1="0" y1="0" x2="1" y2="0.45">
            <stop offset={Math.max(0, sweep * 1.14 - 0.14)} stopColor="#fff" />
            <stop offset={Math.min(1, sweep * 1.14)} stopColor="#000" />
          </linearGradient>
          <mask id="kpp-mask">
            <rect width={w} height={h} fill="url(#kpp-sweep)" />
          </mask>
        </defs>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${push}) translate(${-w / 2} ${-h / 2})`}>
          {src ? (
            <>
              <g mask="url(#kpp-mask)">
                <image href={resolveSrc(src)} width={w} height={h} preserveAspectRatio="xMidYMid slice" filter="url(#kpp-paint)" style={grey > 0 ? {filter: `saturate(${1 - grey})`} : undefined} />
              </g>
              <KnifeLayers strokes={strokes} frame={frame} u={u} lightAngle={la} spec={ridge} grey={grey} appearAt={appearAt} appearDur={appearDur} bodies={false} />
            </>
          ) : (
            <KnifeLayers strokes={strokes} frame={frame} u={u} lightAngle={la} spec={ridge} grey={grey} appearAt={appearAt} appearDur={appearDur} />
          )}
        </g>
        <CanvasWeave w={w} h={h} u={u} id="kpp-weave" opacity={0.55} />
        <defs>
          <radialGradient id="kpp-vig" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#1A0E08" stopOpacity="0" />
            <stop offset="100%" stopColor="#1A0E08" stopOpacity="0.38" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#kpp-vig)" />
      </svg>
    </AbsoluteFill>
  );
};

export const knifePaintPlate = defineMotion<Props>({
  id: 'knife-paint-plate',
  title: 'Knife paint plate',
  category: 'image',
  description:
    'An illustration becomes a palette-knife oil painting: a slanted mosaic of flat paint planes (coarse underpainting, then detail strokes only where the picture needs it) with lit ridges from a raking light and canvas weave showing through. Strokes paint on in a diagonal sweep, each growing along its own length; the raking light drifts afterwards. Default plate is a procedural river landscape; with src the picture is knife-filtered with ridge texture.',
  source: ['lemo-opuscar styles/impasto/demo/engine/impasto.js, plate.js (MIT, LemoLab)'],
  useFor: 'Premium oil-painting look for heroes, art/culture brands and emotional ads; a paint-on reveal for any image.',
  durationInFrames: 180,
  defaultProps: {src: '', strokeScale: 1, lightAngle: 225, lightElevation: 0.5, spec: 0.22, grey: 0, appearAt: 4, appearDur: 80, seed: 5, palette: {}, canvas: '#D9CDB5', lightKeys: [], rakingAt: 0, rakingLow: 0.15, rakingDur: 60},
  propDocs: {
    src: 'optional image in public/ — knife-filtered with ridge overlay (the procedural landscape is used when empty)',
    strokeScale: 'stroke size multiplier (0.7 fine … 1.6 chunky)',
    lightAngle: 'raking-light direction in degrees (225 = from upper left)',
    lightElevation: '0..1 ridge relief strength',
    spec: 'ridge highlight strength 0.16–0.3',
    grey: '0..1 how much of the colour is replaced by cool grey',
    appearAt: 'frame the paint-on sweep starts',
    appearDur: 'frames the sweep takes to cross the plate',
    seed: 'stroke layout seed',
    palette: 'override scene colours: {skyTop, skyLow, sun, hillFar, hillNear, field, river, leaf, leafHi, wall, roof, door, umbrella …}',
    canvas: 'bare canvas colour showing between strokes',
    lightKeys: 'raking-light elevation keyframes [[frame, 0..1], ...]; a LOW elevation = grazing light = stronger ridge glints (peak beat)',
    rakingAt: 'frame of a raking-light peak: the light drops to a grazing angle so every ridge glints, then settles (0 = off)',
    rakingLow: 'elevation at the bottom of the dip (0.15)',
    rakingDur: 'frames the dip takes in total (~2 s = 60)',
  },
  component: KnifePaintPlate,
  tags: ['oil painting', 'palette knife', 'impasto', 'painterly', 'paint on', 'reveal', 'brush strokes', 'canvas', 'art', 'landscape', 'hero', 'image filter', 'raking light', 'culture', 'light-peak', 'recognition-beat'],
});
