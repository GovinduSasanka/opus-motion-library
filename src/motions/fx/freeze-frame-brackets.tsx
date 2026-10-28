// Adapted from lemo-opuscar/styles/caption-news/demo/main.js shotFreeze() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp} from '../../core/ease';
import {Plate, PlatePaletteName} from '../../core/image-kit';
import {eo3, lf, seg} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * "Wait — look at this": the footage (a slow push with a bird crossing, or a photo) stops dead at freezeAt,
 * a white flash (0.14 s from 90 %), a small punch-in 1 → 1.12 (+0.04 creep), colour drains to 45 %, yellow
 * corner brackets close in on the subject and a timecode chip with a red pause mark appears top-right.
 */
type Props = {
  src: string;
  seed: number;
  palette: PlatePaletteName;
  freezeAt: number;
  focus: number[];
  timecode: string;
  label: string;
  accent: string;
  subject: boolean;
};

const Bird: React.FC<{x: number; y: number; s: number; flap: number}> = ({x, y, s, flap}) => {
  const a = Math.sin(flap) * 0.9;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#1c1626">
      <path d={`M0 0 Q-14 ${-14 * a - 4} -30 ${-10 * a} Q-16 ${-4 * a} 0 4 Q16 ${-4 * a} 30 ${-10 * a} Q14 ${-14 * a - 4} 0 0 Z`} />
      <ellipse cx={0} cy={2} rx={9} ry={4} />
      <path d="M8 1 L14 0 L8 4 Z" />
    </g>
  );
};

const FreezeBrackets: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, portrait} = useStage();
  const F = Math.min(frame, p.freezeAt); // time stops
  const frozen = frame >= p.freezeAt;
  const dt = (frame - p.freezeAt) / fps;
  const push = 1 + F * 0.0009;
  const punch = frozen ? lerp(1, 1.12, ease.out(clamp(dt / 0.25))) + 0.04 * clamp((dt - 0.25) / 4) : 1;
  const sat = frozen ? lerp(1, 0.45, clamp(dt / 0.3)) : 1;
  const flash = frozen ? 0.9 * Math.max(0, 1 - dt / 0.14) : 0;
  // subject: a bird crossing the sky
  const bx = w * lerp(0.08, 0.95, F / 150);
  const by = h * (0.3 + 0.04 * Math.sin(F / 14));
  const fx = p.subject && !p.src ? bx / w : p.focus[0];
  const fy = p.subject && !p.src ? by / h : p.focus[1];
  const fxPx = fx * w;
  const fyPx = fy * h;
  // brackets shrink 420×330 → 300×230 in 0.2 s
  const bk = eo3(clamp((dt - 0.05) / 0.2));
  const bw = lerp(420, 300, bk) * u * (portrait ? 0.9 : 1);
  const bh = lerp(330, 230, bk) * u * (portrait ? 0.9 : 1);
  const arm = 46 * u;
  const chip = clamp((dt - 0.2) / 0.15);
  // screen pos of the focus after punch (about the focus)
  return (
    <AbsoluteFill style={{background: '#0E0E0C'}}>
      <AbsoluteFill style={{transform: `scale(${punch})`, transformOrigin: `${fxPx}px ${fyPx}px`, filter: `saturate(${sat}) contrast(1.07)`}}>
        <AbsoluteFill style={{transform: `scale(${push})`}}>
          <Plate src={p.src || undefined} seed={p.seed} palette={p.palette} />
          {p.subject && !p.src && (
            <Svg>
              <Bird x={bx} y={by} s={2.2 * u} flap={F * 0.55} />
            </Svg>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      {frozen && (
        <Svg>
          <g stroke={p.accent} strokeWidth={6 * u} fill="none" strokeLinecap="square" opacity={clamp(dt / 0.06)}>
            {[
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ].map(([a, b], i) => {
              const x = fxPx + (a * bw) / 2;
              const y = fyPx + (b * bh) / 2;
              return <path key={i} d={`M${x} ${y - b * arm} L${x} ${y} L${x - a * arm} ${y}`} />;
            })}
          </g>
          {p.label && chip > 0 && (
            <text x={fxPx - bw / 2} y={fyPx + bh / 2 + 54 * u} fontFamily={lf.sans} fontWeight={800} fontSize={40 * u} fill="#F7F5EF" opacity={chip} stroke="#0E0E0C" strokeWidth={6 * u} paintOrder="stroke">
              {p.label}
            </text>
          )}
          {chip > 0 && (
            <g opacity={chip} transform={`translate(${w - 270 * u - 40 * u + (1 - chip) * 30 * u} ${48 * u})`}>
              <rect width={220 * u} height={44 * u} rx={4 * u} fill="rgba(0,0,0,0.7)" />
              <rect x={16 * u} y={12 * u} width={6 * u} height={20 * u} fill="#FF4A3D" />
              <rect x={27 * u} y={12 * u} width={6 * u} height={20 * u} fill="#FF4A3D" />
              <text x={48 * u} y={30 * u} fontFamily={lf.plex} fontWeight={500} fontSize={22 * u} fill="#F7F5EF">
                {p.timecode}
              </text>
            </g>
          )}
        </Svg>
      )}
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
    </AbsoluteFill>
  );
};

export const freezeFrameBrackets = defineMotion<Props>({
  id: 'freeze-frame-brackets',
  title: 'Freeze-frame brackets',
  category: 'fx',
  description:
    'The footage stops dead with a white flash, a small punch-in and colour draining to 45 %; yellow corner brackets close in on the subject and a timecode chip with a red pause mark slides in top-right.',
  source: ['lemo-opuscar styles/caption-news demo/main.js shotFreeze() (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §8 freeze-frame-brackets'],
  useFor: '"Wait — look at this" moments in reaction videos, tutorials, sports, news and explainers.',
  durationInFrames: 120,
  defaultProps: {
    src: '',
    seed: 6,
    palette: 'dusk',
    freezeAt: 46,
    focus: [0.5, 0.45],
    timecode: '00:01:32:14',
    label: 'THERE.',
    accent: '#FFD21F',
    subject: true,
  },
  propDocs: {
    src: 'public/ photo (empty = procedural footage with a crossing bird)',
    seed: 'procedural plate seed',
    palette: 'procedural plate palette',
    freezeAt: 'frame the picture freezes',
    focus: '[x, y] 0..1 bracket centre for a supplied photo (procedural footage tracks the bird)',
    timecode: 'timecode on the chip',
    label: 'bold caption under the brackets (empty = none)',
    accent: 'bracket colour',
    subject: 'draw the moving subject on procedural footage',
  },
  component: FreezeBrackets,
  tags: ['freeze frame', 'pause', 'brackets', 'focus', 'look at this', 'reaction', 'sports', 'news', 'tutorial', 'timecode', 'flash', 'punch in', 'desaturate'],
});
