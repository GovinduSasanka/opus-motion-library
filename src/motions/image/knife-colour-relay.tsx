// Adapted from lemo-opuscar/styles/impasto/demo/engine/impasto.js (reveal sweep) + DEMO.md native moves (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {buildKnife, CanvasWeave, KNIFE_PAL, KnifeLayers, KnifePal} from '../../core/r2-la3b-kit';
import {eio3, lerp, seg} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  src: string;
  revealOrigin: number[];
  revealSpeed: number;
  revealAt: number;
  revDur: number;
  exceptionMask: string[];
  strokeScale: number;
  lightAngle: number;
  spec: number;
  seed: number;
  palette: Partial<KnifePal>;
  canvas: string;
};

const KnifeColourRelay: React.FC<Props> = ({src, revealOrigin, revealSpeed, revealAt, revDur, exceptionMask, strokeScale, lightAngle, spec, seed, palette, canvas}) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames} = useStage();
  const pal = {...KNIFE_PAL, ...palette};
  const strokes = React.useMemo(() => buildKnife(w, h, u, {scale: strokeScale, seed, pal}), [w, h, u, strokeScale, seed, JSON.stringify(palette)]);
  const la = (lightAngle * Math.PI) / 180 + Math.sin(frame / 70) * 0.15;
  const push = lerp(1, 1.05, eio3(seg(frame, 0, durationInFrames)));
  const ox = (revealOrigin[0] ?? 0.34) * w;
  const oy = (revealOrigin[1] ?? 0.72) * h;
  const reach = revealSpeed * u * Math.max(0, frame - revealAt);
  return (
    <AbsoluteFill style={{background: canvas, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="kcr-grey" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0.06" />
            <feColorMatrix type="matrix" values="0.92 0 0 0 0  0 0.98 0 0 0  0 0 1.07 0 0  0 0 0 1 0" />
          </filter>
          <filter id="kcr-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={16 * u} />
          </filter>
          <mask id="kcr-wave">
            <rect width={w} height={h} fill="#000" />
            <circle cx={ox} cy={oy} r={reach} fill="#fff" filter="url(#kcr-soft)" />
          </mask>
        </defs>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${push}) translate(${-w / 2} ${-h / 2})`}>
          {src ? (
            <>
              <image href={resolveSrc(src)} width={w} height={h} preserveAspectRatio="xMidYMid slice" filter="url(#kcr-grey)" />
              <g mask="url(#kcr-wave)">
                <image href={resolveSrc(src)} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
              </g>
              <KnifeLayers strokes={strokes} frame={frame} u={u} lightAngle={la} spec={spec} grey={0} appearAt={0} appearDur={20} bodies={false} />
            </>
          ) : (
            <KnifeLayers
              strokes={strokes}
              frame={frame}
              u={u}
              lightAngle={la}
              spec={spec * 1.25}
              grey={0}
              appearAt={0}
              appearDur={26}
              relay={{ox, oy, speed: revealSpeed, start: revealAt, dur: revDur, keep: exceptionMask}}
            />
          )}
        </g>
        <CanvasWeave w={w} h={h} u={u} id="kcr-weave" opacity={0.55} />
        <defs>
          <radialGradient id="kcr-vig" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#10121A" stopOpacity="0" />
            <stop offset="100%" stopColor="#10121A" stopOpacity="0.4" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill="url(#kcr-vig)" />
      </svg>
    </AbsoluteFill>
  );
};

export const knifeColourRelay = defineMotion<Props>({
  id: 'knife-colour-relay',
  title: 'Knife colour relay',
  category: 'image',
  description:
    'A cool-grey, wet-looking palette-knife painting is re-laid in colour stroke by stroke by a wave spreading from a point: each stroke sweeps from grey to colour along its own length. Strokes in exceptionMask (default: the red umbrella) stay in colour from the start, the one-colour exception. Set revealSpeed 0 for exception-only, exceptionMask [] for a pure wave.',
  source: ['lemo-opuscar styles/impasto/demo/engine/impasto.js reveal sweep (MIT, LemoLab)', 'lemo-styles-a impasto: knife-colour-relay / one-colour-exception'],
  useFor: '"The world wakes up", rebrand, recovery, season turning — a story beat; or "everything grey except this one thing".',
  durationInFrames: 180,
  defaultProps: {src: '', revealOrigin: [0.36, 0.78], revealSpeed: 19, revealAt: 56, revDur: 14, exceptionMask: ['umbrella'], strokeScale: 1, lightAngle: 225, spec: 0.22, seed: 5, palette: {}, canvas: '#CBC9C6'},
  propDocs: {
    src: 'optional image in public/ — grey copy with a colour wave (procedural landscape when empty)',
    revealOrigin: 'wave origin [x, y] as fractions of the frame',
    revealSpeed: 'wave speed in u per frame (0 = never reveal, exception only)',
    revealAt: 'frame the wave starts',
    revDur: 'frames each stroke takes to turn to colour',
    exceptionMask: 'scene groups kept in colour: umbrella, house, tree, river, sun, sky, hills, field',
    strokeScale: 'stroke size multiplier',
    lightAngle: 'raking-light direction in degrees',
    spec: 'ridge highlight strength',
    seed: 'stroke layout seed',
    palette: 'override scene colours (see knife-paint-plate)',
    canvas: 'bare canvas colour between strokes',
  },
  component: KnifeColourRelay,
  tags: ['grey to colour', 'colour wave', 'one colour exception', 'selective colour', 'oil painting', 'palette knife', 'wake up', 'recovery', 'rebrand', 'season', 'story beat', 'impasto'],
});
