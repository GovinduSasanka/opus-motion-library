// Adapted from lemo-opuscar/styles/papercut-red/demo/light.js (glowWindow, bloom, rays, lightMasked/addMasked) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {D4, P, clamp, eo, hash, lbf, pd, raysD, rosetteWedge, seg} from '../../core/r2-lb1-kit';

/**
 * "Holes are light": in a dark paper night scene a cut-out (rosette window flower, lantern or a word) lights from
 * behind — the paper glows deep red, every hole burns warm white, a two-level bloom and soft rays spread, and the hole
 * pattern is thrown across the ground as light, squashed into perspective. Candle flicker on ignite.
 */

type Props = {
  shape: 'rosette' | 'lantern' | 'text';
  text: string;
  lightColors: string[];
  transmission: string;
  ambient: string;
  ground: string;
  groundY: number;
  igniteAt: number;
  flicker: number;
  bloom: number;
  rays: boolean;
  project: boolean;
  background: string;
};

const BacklitCutout: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = 'backlit-cutout';
  const S = Math.min(w, h);
  const TR = S * (portrait ? 0.36 : 0.27);
  const cx = w / 2;
  const cy = h * (portrait ? 0.36 : 0.36);
  const gy = h * p.groundY;
  const ign = eo(seg(frame, p.igniteAt, p.igniteAt + 12));
  const fl = 1 + (hash(Math.floor(frame / 2), 4) - 0.5) * 2 * p.flicker * ign;
  const k = clamp(ign * fl);
  const wedge = React.useMemo(() => rosetteWedge(TR), [TR]);
  const [c0, c1, c2] = p.lightColors;
  // the piece: white = paper, holes black (mask); light group = gradient visible through holes
  const pieceMask = (mid: string) => (
    <mask id={mid} maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 3} height={h * 3}>
      <g transform={`translate(${cx} ${cy})`}>
        {p.shape === 'rosette' &&
          D4.map((tf, i) => (
            <g key={i} transform={tf}>
              <path d={pd(wedge.outline)} fill="#fff" />
              {wedge.holes.map((hd, j) => (
                <path key={j} d={hd} fill="#000" fillRule="evenodd" />
              ))}
            </g>
          ))}
        {p.shape === 'lantern' && (
          <g>
            <ellipse rx={TR * 0.78} ry={TR * 0.95} fill="#fff" />
            {Array.from({length: 7}, (_, i) => (
              <ellipse key={i} rx={TR * 0.78 * Math.abs(Math.cos((i / 7) * Math.PI))} ry={TR * 0.95} fill="none" stroke="#000" strokeWidth={6 * u} />
            ))}
            {Array.from({length: 18}, (_, i) => {
              const a = (i / 18) * Math.PI * 2;
              return <circle key={'d' + i} cx={Math.cos(a) * TR * 0.5} cy={Math.sin(a) * TR * 0.62} r={TR * 0.045} fill="#000" />;
            })}
            <path d={pd([[0, -TR * 0.3], [TR * 0.22, 0], [0, TR * 0.3], [-TR * 0.22, 0]])} fill="#000" />
          </g>
        )}
        {p.shape === 'text' && (
          <g>
            <rect x={-TR * 1.5} y={-TR * 0.55} width={TR * 3} height={TR * 1.1} rx={TR * 0.08} fill="#fff" />
            <text x={0} y={TR * 0.22} textAnchor="middle" fontFamily={lbf('fraunces')} fontWeight={800} fontSize={TR * 0.62} fill="#000" textLength={TR * 2.6} lengthAdjust="spacingAndGlyphs">
              {p.text}
            </text>
          </g>
        )}
      </g>
    </mask>
  );
  const outline = (
    <g transform={`translate(${cx} ${cy})`}>
      {p.shape === 'rosette' && D4.map((tf, i) => <path key={i} d={pd(wedge.outline)} transform={tf} />)}
      {p.shape === 'lantern' && <ellipse rx={TR * 0.78} ry={TR * 0.95} />}
      {p.shape === 'text' && <rect x={-TR * 1.5} y={-TR * 0.55} width={TR * 3} height={TR * 1.1} rx={TR * 0.08} />}
    </g>
  );
  // ground projection matrix: wide, flattened, sheared toward camera, centred under the piece on the ground line
  const proj = `translate(${cx} ${gy + TR * 0.35}) matrix(1.25 0 -0.9 0.3 0 0) translate(${-cx} ${-cy})`;
  return (
    <AbsoluteFill style={{background: p.background === 'night' ? '#0F142A' : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          {pieceMask(`${id}-m`)}
          <mask id={`${id}-holes`} maskUnits="userSpaceOnUse" x={-w} y={-h} width={w * 3} height={h * 3}>
            <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="#000" />
            <g fill="#fff">{outline}</g>
            <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="#000" mask={`url(#${id}-m)`} />
          </mask>
          <radialGradient id={`${id}-lg`} cx={cx} cy={cy} r={TR * 1.1} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={c0} />
            <stop offset="0.55" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </radialGradient>
          <radialGradient id={`${id}-pool`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFE3A6" stopOpacity={0.5} />
            <stop offset="1" stopColor="#FFE3A6" stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0F142A" />
            <stop offset="1" stopColor="#1F2A55" />
          </linearGradient>
          <filter id={`${id}-b1`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={10 * u} />
          </filter>
          <filter id={`${id}-b2`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation={40 * u} />
          </filter>
          <filter id={`${id}-b0`}>
            <feGaussianBlur stdDeviation={2 * u} />
          </filter>
          <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={2.6 * u} dy={3.6 * u} stdDeviation={5 * u} floodColor="#000" floodOpacity={0.5} />
          </filter>
        </defs>
        {p.background === 'night' && (
          <g>
            <rect width={w} height={h} fill={`url(#${id}-sky)`} />
            {Array.from({length: 40}, (_, i) => (
              <circle key={i} cx={hash(i, 1, 3) * w} cy={hash(i, 2, 3) * gy * 0.9} r={(1 + hash(i, 3, 3) * 1.5) * u} fill="#7A88BA" opacity={0.6} />
            ))}
            {/* ground with sawtooth ridge */}
            <path
              d={pd([
                [-10, h + 10],
                ...Array.from({length: 61}, (_, i) => [(i / 60) * (w + 20) - 10, gy - (i % 2 ? 14 : 0) * u] as P),
                [w + 10, h + 10],
              ])}
              fill={p.ground}
              filter={`url(#${id}-sh)`}
            />
          </g>
        )}
        {/* rays */}
        {p.rays && k > 0 && <path d={raysD(cx, cy, 18, S * 0.9, frame * 0.002, 0.35, TR * 0.6)} fill={c1} opacity={0.1 * k} filter={`url(#${id}-b1)`} />}
        {/* projected hole pattern on the ground */}
        {p.project && k > 0 && (
          <g style={{mixBlendMode: 'screen'}} opacity={0.7 * k} filter={`url(#${id}-b0)`}>
            <ellipse cx={cx} cy={gy + TR * 0.35} rx={TR * 2.2} ry={TR * 0.55} fill={`url(#${id}-pool)`} />
            <g transform={proj}>
              <rect x={cx - TR * 1.6} y={cy - TR * 1.6} width={TR * 3.2} height={TR * 3.2} fill={c1} mask={`url(#${id}-holes)`} />
            </g>
          </g>
        )}
        {/* bloom (holes only) */}
        {k > 0 && (
          <g style={{mixBlendMode: 'screen'}} opacity={p.bloom * k}>
            <rect width={w} height={h} fill={`url(#${id}-lg)`} mask={`url(#${id}-holes)`} filter={`url(#${id}-b2)`} />
            <rect width={w} height={h} fill={`url(#${id}-lg)`} mask={`url(#${id}-holes)`} filter={`url(#${id}-b1)`} />
          </g>
        )}
        {/* the piece: dark paper before ignite, glowing transmission red after */}
        <g filter={`url(#${id}-sh)`}>
          <g mask={`url(#${id}-m)`}>
            <rect width={w} height={h} fill={p.ambient} />
            <rect width={w} height={h} fill={p.transmission} opacity={k} />
            <rect width={w} height={h} fill={`url(#${id}-lg)`} opacity={0.35 * k} style={{mixBlendMode: 'multiply'}} />
          </g>
        </g>
        {/* holes burn warm white */}
        <rect width={w} height={h} fill={`url(#${id}-lg)`} mask={`url(#${id}-holes)`} opacity={0.08 + 0.92 * k} />
        {/* hanging string */}
        <line x1={cx} y1={0} x2={cx} y2={cy - TR * (p.shape === 'text' ? 0.55 : 0.95)} stroke="#0D1328" strokeWidth={3 * u} />
      </svg>
    </AbsoluteFill>
  );
};

export const backlitCutout = defineMotion<Props>({
  id: 'backlit-cutout',
  title: 'Backlit paper cut-out (holes are light)',
  category: 'fx',
  description:
    'In a dark paper night scene a hanging cut-out — a rosette window flower, a lantern or a word — lights up from behind: the paper glows deep red, every cut hole burns warm white with a two-level bloom and soft rays, and the hole pattern is projected across the ground as squashed light, with a candle flicker.',
  source: ['lemo-opuscar styles/papercut-red (MIT code, CC BY 4.0 docs, LemoLab) — demo/light.js glowWindow/bloom/rays/lightMasked'],
  useFor: 'Night reveals, "an idea shines through", lantern / Diwali / Lunar New Year moments, a word or emblem projected as light; overlay over dark scenes with background "transparent".',
  durationInFrames: 150,
  defaultProps: {
    shape: 'rosette',
    text: 'Light',
    lightColors: ['#FFF6D6', '#FFC46E', '#EC782E'],
    transmission: '#B51D18',
    ambient: '#3A1420',
    ground: '#29356E',
    groundY: 0.8,
    igniteAt: 30,
    flicker: 0.06,
    bloom: 0.55,
    rays: true,
    project: true,
    background: 'night',
  },
  propDocs: {
    shape: '"rosette" (8-fold window flower), "lantern" or "text" (word cut out of a red card)',
    text: 'the word when shape is "text"',
    lightColors: 'backlight ramp [centre, mid, edge]',
    transmission: 'paper colour when lit',
    ambient: 'paper colour before ignite',
    ground: 'ground paper colour (night background)',
    groundY: 'ground line 0..1 of the height',
    igniteAt: 'frame the light comes on',
    flicker: 'candle flicker amount',
    bloom: 'bloom strength',
    rays: 'soft light rays',
    project: 'project the hole pattern onto the ground',
    background: '"night" (indigo paper scene), any colour, or "transparent" (overlay)',
  },
  component: BacklitCutout,
  tags: ['paper cut', 'backlit', 'glow', 'light', 'lantern', 'rosette', 'night', 'bloom', 'projection', 'festival', 'diwali', 'lunar new year', 'reveal', 'overlay'],
});
