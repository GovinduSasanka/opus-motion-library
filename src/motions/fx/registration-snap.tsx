// Adapted from lemo-opuscar/styles/silkscreen-poster (DEMO.md climb shot, STYLE.md §5/§8) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PaperTexture, Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {buildPoster, eio3, fx, gauss, h1, lerp, mixHex, POSTER_H, POSTER_LAYERS, POSTER_W, PosterInfoInk, PosterLayer, resolvePalette, seg, useUid} from '../../core/r2-lb2b-kit';

/**
 * During a crane down the print the ink layers hang loose as separate paper sheets — paper-white gaps and
 * thickness shadows between planes, parallax by depth, sideways slides — then clamp into register on one loud hit
 * (shake + flash) right before the key facts print in.
 */
type Props = {
  palette: string;
  planes: number;
  loosenFrom: number;
  snapAt: number;
  depthScale: number;
  gap: number;
  shadow: number;
  header: string;
  name: string;
  number: string;
  stats: {label: string; value: string}[];
  background: string;
  paper: string;
  seed: number;
};

const RegistrationSnap: React.FC<Props> = ({palette, planes, loosenFrom, snapAt, depthScale, gap, shadow, header, name, number, stats, background, paper, seed}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const uid = useUid('rsnap');
  const geo = React.useMemo(() => buildPoster(seed), [seed]);
  const pal = resolvePalette(palette);
  const n = Math.max(2, Math.min(POSTER_LAYERS, Math.round(planes)));
  // looseness: ramps in, then 1 -> 0 over two frames at the snap (with a tiny kickback)
  const loose = frame < snapAt - 1 ? seg(frame, loosenFrom, loosenFrom + 12) : Math.max(0, lerp(1, 0, seg(frame, snapAt - 1, snapAt + 1)));
  const kick = frame >= snapAt - 1 && frame < snapAt + 3 ? Math.sin(((frame - snapAt + 1) / 4) * Math.PI) * -0.1 : 0;
  const L = loose + kick;
  // crane
  const cp = eio3(seg(frame, 4, snapAt - 6));
  const fitFull = Math.min((h * 0.9) / POSTER_H, (w * 0.9) / POSTER_W);
  const z0 = Math.max((w * 0.92) / POSTER_W, fitFull * 1.5);
  const out = eio3(seg(frame, snapAt + 4, snapAt + 28));
  const zoom = lerp(z0, fitFull, out);
  const camY = lerp(lerp(h / 2 / z0 + 20, POSTER_H - h / 2 / z0 - 20, cp), POSTER_H / 2, out);
  const camTop = h / 2 / z0 + 20;
  const shakeK = frame >= snapAt && frame < snapAt + 3 ? 1 - (frame - snapAt) / 3 : 0;
  const sx = (h1(frame, 3) - 0.5) * 14 * u * shakeK;
  const sy = (h1(frame, 8) - 0.5) * 14 * u * shakeK;
  const flash = frame >= snapAt ? 0.55 * (1 - seg(frame, snapAt, snapAt + 7)) : 0;
  const depth = (k: number) => 1 + k * 0.62;
  const bump = gauss(cp - 0.5, 0.26);
  const prog = Array.from({length: 4 + stats.length}, (_, i) => seg(frame, snapAt + 14 + i * 4, snapAt + 19 + i * 4));
  const gapR = Math.max(0.01, gap * Math.max(0, L));
  const shR = shadow * Math.max(0, L);
  return (
    <AbsoluteFill style={{background}}>
      <PaperTexture opacity={0.18} seed={5} />
      <Svg>
        <g transform={`translate(${fx(cx + sx)},${fx(cy + sy)}) scale(${fx(zoom)}) translate(${-POSTER_W / 2},${fx(-camY)})`}>
          {Array.from({length: n}, (_, k) => {
            const d = depth(k);
            const dy = -(camY - camTop) * (d - 1) * 0.42 * depthScale * L;
            const dx = (k % 2 ? 1 : -1) * 190 * (d - 1) * 0.28 * bump * L * (portrait ? 0.7 : 1);
            const flat = L < 0.002 && shakeK === 0;
            const id = `${uid}f${k}`;
            const k2 = k;
            return (
              <g key={k} transform={`translate(${fx(dx)},${fx(dy)})`} filter={flat ? undefined : `url(#${id})`}>
                {!flat && (
                  <filter id={id} filterUnits="userSpaceOnUse" x={-500} y={-600} width={2000} height={2700}>
                    <feMorphology in="SourceAlpha" operator="dilate" radius={fx(gapR)} result="d" />
                    <feFlood floodColor={paper} result="pf" />
                    <feComposite in="pf" in2="d" operator="in" result="gapL" />
                    <feGaussianBlur in="d" stdDeviation={fx(shR * 0.5 + 0.01)} result="b" />
                    <feOffset in="b" dx={fx(shR * 0.3)} dy={fx(shR * 0.6)} result="bo" />
                    <feFlood floodColor="#000" floodOpacity={0.28 * (k2 === 0 ? 0.6 : 1)} result="sf" />
                    <feComposite in="sf" in2="bo" operator="in" result="shadowL" />
                    <feMerge>
                      <feMergeNode in="shadowL" />
                      <feMergeNode in="gapL" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                )}
                <PosterLayer k={k} geo={geo} pal={pal} paper={paper} />
              </g>
            );
          })}
          <PosterInfoInk info={{header, name, number, stats}} pal={pal} paper={paper} prog={prog} />
          {/* hairline paper border (sheet edge) */}
          <rect x={0} y={0} width={POSTER_W} height={POSTER_H} fill="none" stroke={mixHex(paper, '#000000', 0.12)} strokeWidth={2 / zoom} opacity={L < 0.01 ? 1 : 0} />
        </g>
        <rect x={0} y={0} width={w} height={h} fill="#fff" opacity={flash} />
      </Svg>
    </AbsoluteFill>
  );
};

export const registrationSnap = defineMotion<Props>({
  id: 'registration-snap',
  title: 'Registration snap (loose print layers clamp)',
  category: 'fx',
  description:
    'A crane down a screen-print: the ink layers hang loose as separate paper sheets with paper-white gaps, thickness shadows and depth parallax, then clamp into perfect register on one loud hit (2-frame shake and flash) before the key facts print in.',
  source: ['lemo-opuscar styles/silkscreen-poster DEMO.md climb shot + STYLE.md §5/§8 (MIT, LemoLab)'],
  useFor: 'The "everything locks into place" beat before a date, price or launch fact; multi-plane parallax that does not look like moving mountains.',
  durationInFrames: 150,
  defaultProps: {
    palette: 'harbour',
    planes: 7,
    loosenFrom: 0,
    snapAt: 84,
    depthScale: 0.16,
    gap: 3,
    shadow: 9,
    header: 'Opening night',
    name: 'Harbour Lights',
    number: '21',
    stats: [
      {label: 'Doors', value: '19:00'},
      {label: 'Entry', value: 'Free'},
      {label: 'Pier', value: 'No. 4'},
    ],
    background: '#e9e3d6',
    paper: '#f4efe4',
    seed: 3,
  },
  propDocs: {
    palette: 'poster palette name or object',
    planes: 'how many ink layers hang loose (2-7)',
    loosenFrom: 'frame the sheets start to hang loose',
    snapAt: 'frame of the clamp hit',
    depthScale: 'parallax strength between planes',
    gap: 'paper gap between planes in poster units',
    shadow: 'thickness shadow size in poster units',
    header: 'tracked line at the top',
    name: 'info-band name',
    number: 'info-band big number',
    stats: 'info-band stat blocks printed after the snap',
    background: 'page colour',
    paper: 'paper colour',
    seed: 'landscape seed',
  },
  component: RegistrationSnap,
  tags: ['registration', 'parallax', 'layers', 'print', 'screenprint', 'lock into place', 'clamp', 'paper sheets', 'crane', 'multiplane', 'snap', 'reveal facts'],
});
