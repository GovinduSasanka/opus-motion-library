// Adapted from lemo-opuscar/styles/blueprint/demo/paper.js wet branch (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {BlueprintPaper, eo3, lf, seg} from '../../core/r2-la1-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Water drops land on a cyanotype blueprint: each blooms into a deeper, more saturated blue stain with a pale
 * tide-line rim; the white line work inside goes soft; a final drop on the signature makes the ink bleed.
 */
type Props = {
  drops: {x: number; y: number; at: number; r: number}[];
  title: string;
  signature: string;
  note: string;
  lineColor: string;
  paperDark: string;
  paperLight: string;
  seed: number;
};

const CLOUD = 'M30 46 Q26 34 36 30 Q38 18 52 20 Q58 10 70 16 Q82 14 84 26 Q94 30 90 42 Q92 50 82 52 L36 52 Q28 52 30 46 Z';

const WaterBloom: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('cyanw');
  const S = Math.min(w, h * 1.3) * 0.009;
  const ox = w / 2 - 60 * S;
  const oy = h * (portrait ? 0.3 : 0.24);
  const drops = p.drops.length
    ? p.drops
    : [
        {x: 0.3, y: 0.3, at: 28, r: 120},
        {x: 0.66, y: 0.52, at: 52, r: 150},
        {x: 0.45, y: 0.72, at: 76, r: 110},
        {x: 0.74, y: 0.86, at: 104, r: 95},
      ];
  const sigX = w * 0.74;
  const sigY = h * 0.87;
  const sigDrop = drops[drops.length - 1];
  const stain = (d: {x: number; y: number; at: number; r: number}, i: number) => {
    const k = eo3(seg(frame, d.at, d.at + 18));
    return {cx: w * d.x, cy: h * d.y, R: d.r * u * (0.3 + 0.7 * k), k, i};
  };
  const sts = drops.map(stain);
  const splash = (d: {at: number}) => Math.sin(Math.PI * clamp((frame - d.at) / 8));
  const fall = (d: {x: number; at: number; y: number}) => {
    const k = seg(frame, d.at - 7, d.at);
    return k > 0 && k < 1 ? {x: w * d.x, y: h * d.y - (1 - k) * h * 0.3, k} : null;
  };
  const titleIn = prog(frame, 6, 24, ease.out);

  return (
    <AbsoluteFill style={{background: p.paperDark}}>
      <Svg>
        <defs>
          <filter id={`${id}-dis`} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency={0.006 / u} numOctaves={2} seed={p.seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={44 * u} />
          </filter>
          <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={2.6 * u} />
          </filter>
          <mask id={`${id}-wetm`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect width={w} height={h} fill="#000" />
            <g filter={`url(#${id}-dis)`}>
              {sts.map((s) => (
                <circle key={s.i} cx={s.cx} cy={s.cy} r={s.R} fill="#fff" />
              ))}
            </g>
          </mask>
          <mask id={`${id}-drym`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <rect width={w} height={h} fill="#fff" />
            <g filter={`url(#${id}-dis)`}>
              {sts.map((s) => (
                <circle key={s.i} cx={s.cx} cy={s.cy} r={s.R} fill="#000" />
              ))}
            </g>
          </mask>
          {/* the sheet's line work, referenced twice (sharp outside, soft inside the wet areas) */}
          <g id={`${id}-ink`}>
            <g transform={`translate(${ox} ${oy}) scale(${S})`} fill="none" stroke={p.lineColor} strokeWidth={2.2 / S * u * 2} strokeLinejoin="round">
              <path d={CLOUD} />
              <path d={CLOUD} transform="translate(4 -3) scale(0.98)" opacity={0.35} />
              {/* rain hatching under the cloud */}
              {Array.from({length: 9}, (_, i) => (
                <line key={i} x1={38 + i * 5} y1={56} x2={34 + i * 5} y2={72} opacity={0.8} />
              ))}
              {/* catching net */}
              <path d="M30 86 Q60 100 90 84" />
              <path d="M34 87 L36 110 M86 85 L88 110" />
              {Array.from({length: 5}, (_, i) => (
                <path key={'n' + i} d={`M${34 + i * 11} ${87 + i % 2} Q${40 + i * 11} ${96} ${45 + i * 11} ${86.5}`} opacity={0.7} />
              ))}
            </g>
            <text x={w / 2} y={oy - 40 * u} textAnchor="middle" fontFamily={lf.hand} fontWeight={700} fontSize={52 * u} fill={p.lineColor} opacity={titleIn}>
              {p.title}
            </text>
            <text x={50 * u} y={h - 60 * u} fontFamily={lf.plex} fontSize={20 * u} letterSpacing={2 * u} fill={p.lineColor} opacity={0.8}>
              {p.note}
            </text>
            <text x={sigX} y={sigY} fontFamily={lf.hand} fontSize={44 * u} fill={p.lineColor} transform={`rotate(-3 ${sigX} ${sigY})`}>
              {p.signature}
            </text>
            <line x1={sigX - 10 * u} y1={sigY + 14 * u} x2={sigX + 260 * u} y2={sigY + 14 * u} stroke={p.lineColor} strokeWidth={1.4 * u} opacity={0.6} />
          </g>
        </defs>
        <BlueprintPaper id={id} w={w} h={h} u={u} dark={p.paperDark} light={p.paperLight} seed={p.seed} />
        {/* wet stains: deeper, more saturated blue + pale tide-line rim */}
        <g filter={`url(#${id}-dis)`}>
          {sts.map((s) => (
            <g key={s.i}>
              <circle cx={s.cx} cy={s.cy} r={s.R} fill="#0E2A66" opacity={0.42 * s.k} />
              <circle cx={s.cx} cy={s.cy} r={s.R * 0.72} fill="#0A2158" opacity={0.22 * s.k} />
              <circle cx={s.cx} cy={s.cy} r={s.R} fill="none" stroke="#aec6e8" strokeWidth={4.5 * u} opacity={0.75 * s.k} filter={`url(#${id}-soft)`} />
            </g>
          ))}
        </g>
        {/* ink: sharp outside the stains, blurred + slightly bled inside */}
        <use href={`#${id}-ink`} mask={`url(#${id}-drym)`} />
        <g mask={`url(#${id}-wetm)`}>
          <use href={`#${id}-ink`} filter={`url(#${id}-soft)`} opacity={0.9} />
          <use href={`#${id}-ink`} filter={`url(#${id}-soft)`} opacity={0.4} transform={`translate(0 ${2 * u})`} />
        </g>
        {/* falling drops + splash rings */}
        {drops.map((d, i) => {
          const f = fall(d);
          const sp = splash(d);
          return (
            <g key={i}>
              {f && <ellipse cx={f.x} cy={f.y} rx={5 * u} ry={11 * u} fill="#bcd2ef" opacity={0.8} />}
              {sp > 0 && (
                <g stroke="#cfe0f5" fill="none" opacity={sp}>
                  <circle cx={w * d.x} cy={h * d.y} r={16 * u * (1.6 - sp)} strokeWidth={2.4 * u} />
                  {[-1, 1].map((s2) => (
                    <ellipse key={s2} cx={w * d.x + s2 * 20 * u * (1.4 - sp)} cy={h * d.y - 12 * u * sp} rx={3 * u} ry={6 * u} fill="#cfe0f5" stroke="none" />
                  ))}
                </g>
              )}
            </g>
          );
        })}
        {/* extra ink bleed on the signature after its drop */}
        <g mask={`url(#${id}-wetm)`}>
          <text
            x={sigX}
            y={sigY}
            fontFamily={lf.hand}
            fontSize={44 * u}
            fill={p.lineColor}
            opacity={0.35 * eo3(seg(frame, sigDrop.at + 6, sigDrop.at + 30))}
            filter={`url(#${id}-soft)`}
            transform={`rotate(-3 ${sigX} ${sigY}) translate(0 ${3 * u + 4 * u * eo3(seg(frame, sigDrop.at + 6, sigDrop.at + 40))})`}
          >
            {p.signature}
          </text>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const cyanotypeWaterBloom = defineMotion<Props>({
  id: 'cyanotype-water-bloom',
  title: 'Cyanotype water bloom',
  category: 'fx',
  description:
    'Water drops fall onto a cyanotype blueprint and bloom into deeper, more saturated blue stains with pale tide-line rims; the white line work inside each stain goes soft, and a drop on the signature makes the ink bleed.',
  source: ['lemo-opuscar styles/blueprint demo/paper.js wet branch (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §5 cyanotype-water-bloom'],
  useFor: 'Rain / flood / emotion beats on any paper-based motion; a melancholy turn in a blueprint or patent story.',
  durationInFrames: 165,
  defaultProps: {
    drops: [],
    title: 'The Cloud Catcher',
    signature: 'A. Northwind',
    note: 'FIG. 2 · WORKS BEAUTIFULLY. NO CLOUDS YET.',
    lineColor: '#E7F0F9',
    paperDark: '#18336B',
    paperLight: '#2A58A6',
    seed: 4,
  },
  propDocs: {
    drops: '[{x, y, at, r}] drop positions (0..1), landing frames and stain radii in px at 1080; empty = four default drops, the last on the signature',
    title: 'hand-lettered sheet title',
    signature: 'signature that bleeds when the last drop hits it',
    note: 'mono caption bottom-left',
    lineColor: 'line work colour',
    paperDark: 'paper dark ramp end',
    paperLight: 'paper light ramp end',
    seed: 'paper + stain displacement seed',
  },
  component: WaterBloom,
  tags: ['cyanotype', 'blueprint', 'water', 'rain', 'drops', 'stain', 'bloom', 'ink bleed', 'paper', 'wet', 'emotion', 'melancholy', 'fx', 'overlay-adjacent'],
});
