// Original implementation. Idea reference only: a painted storybook theatre set described in
// analysis/sources/pdoom.md (PDoomVideo has no licence — no code or text from it is used).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {E, clamp01, hash} from '../../core/r2-music-kit';
import {HatKind, NIB_COLORS, NibFigure, nibUnit} from '../../core/r2-mascot-kit';
import {mixHex} from '../../core/character-kit';

type Props = {
  title: string;
  performer: 'nib' | 'none';
  dance: string;
  emotion: string;
  backdrop: 'sunburst' | 'none';
  colors: string[];
  curtainColor: string;
  floorColor: string;
  spots: string[];
  alarm: boolean;
  openFrames: number;
  closeFrames: number;
  bpm: number;
  offsetSec: number;
  rays: number;
  background: string;
};

const StageCurtain: React.FC<Props> = ({title, performer, dance, emotion, backdrop, colors, curtainColor, floorColor, spots, alarm, openFrames, closeFrames, bpm, offsetSec, rays, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames, portrait} = useStage();
  const t = frame / fps;
  const bp = (t - offsetSec) / (60 / bpm);
  const hit = Math.exp(-6 * (bp - Math.floor(bp)));
  const floorY = h * 0.74;
  // curtains: open at the start, close at the end (bookend)
  const open = E.inOutCubic(clamp01((frame - 4) / Math.max(1, openFrames))) * (1 - E.inOutCubic(clamp01((frame - (durationInFrames - closeFrames - 2)) / Math.max(1, closeFrames))));
  const clear = background === 'transparent';
  const [c1, c2] = [colors[0] ?? '#E8AA38', colors[1] ?? '#F3D27A'];
  const cx = w / 2;
  const cyR = floorY * 0.95;
  const R = Math.hypot(w, h);
  const rot = t * 9;
  const nR = Math.max(8, Math.round(rays));
  const curtainW = w * 0.5 + 40 * u;
  const gather = 0.16 + 0.84 * (1 - open);
  const folds = 9;
  const cDark = mixHex(curtainColor, '#1A0710', 0.45);
  const cLight = mixHex(curtainColor, '#FFD7C2', 0.25);
  const spotList = spots.length ? spots : ['#FFF2C4', '#FFE1A8'];
  const ru = nibUnit(portrait ? 0.32 : 0.38, w, h);
  const valH = h * 0.12;
  const curtain = (side: -1 | 1) => {
    const cwid = curtainW * gather;
    const x0 = side < 0 ? 0 : w - cwid;
    const pts: React.ReactNode[] = [];
    for (let i = 0; i < folds; i++) {
      const fx = x0 + (cwid / folds) * i;
      const fw = cwid / folds;
      const sway = Math.sin(t * 1.3 + i * 0.7) * 3 * u * (1 - open * 0.5);
      pts.push(
        <path
          key={i}
          d={`M${fx} 0 L${fx + fw} 0 L${fx + fw + sway} ${h * 0.98} Q${fx + fw / 2 + sway} ${h * 1.01} ${fx + sway} ${h * 0.98} Z`}
          fill={`url(#scfold)`}
        />,
      );
    }
    // tie-back sash
    const sashX = side < 0 ? x0 + cwid * 0.92 : x0 + cwid * 0.08;
    return (
      <g key={side} filter="url(#scwash)">
        {pts}
        {open > 0.3 ? <ellipse cx={sashX} cy={h * 0.55} rx={18 * u} ry={34 * u} fill={c1} stroke={cDark} strokeWidth={2 * u} opacity={clamp01((open - 0.3) * 3)} /> : null}
      </g>
    );
  };
  const tsz = Math.min(64 * u * (portrait ? 1.1 : 1), (w * 0.7) / Math.max(4, title.length * 0.62));
  return (
    <AbsoluteFill style={{background: clear ? 'transparent' : background}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="scfold" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={cDark} />
            <stop offset="0.35" stopColor={curtainColor} />
            <stop offset="0.55" stopColor={cLight} />
            <stop offset="0.8" stopColor={curtainColor} />
            <stop offset="1" stopColor={cDark} />
          </linearGradient>
          <filter id="scwash" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={0.02} numOctaves={2} seed={Math.floor(t * 12) % 7} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={6 * u} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <radialGradient id="scspot" cx="50%" cy="0%" r="100%">
            <stop offset="0" stopColor="#FFF6E0" stopOpacity={0.55} />
            <stop offset="1" stopColor="#FFF6E0" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="scfloor" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={mixHex(floorColor, '#2B1B12', 0.25)} />
            <stop offset="1" stopColor={floorColor} />
          </linearGradient>
        </defs>
        {/* backdrop: rotating two-colour sunburst */}
        {backdrop === 'sunburst' ? (
          <g filter="url(#scwash)">
            <rect width={w} height={floorY} fill={c2} />
            {Array.from({length: nR}, (_, i) => {
              if (i % 2) return null;
              const a0 = ((i / nR) * 360 + rot) * (Math.PI / 180);
              const a1 = (((i + 1) / nR) * 360 + rot) * (Math.PI / 180);
              return <path key={i} d={`M${cx} ${cyR} L${cx + Math.cos(a0) * R} ${cyR + Math.sin(a0) * R} L${cx + Math.cos(a1) * R} ${cyR + Math.sin(a1) * R} Z`} fill={c1} />;
            })}
            <circle cx={cx} cy={cyR} r={Math.min(w, h) * 0.16 * (1 + 0.04 * hit)} fill={mixHex(c2, '#FFFFFF', 0.4)} opacity={0.75} />
          </g>
        ) : null}
        {/* floor planks */}
        {backdrop === 'sunburst' ? (
          <g>
            <rect y={floorY} width={w} height={h - floorY} fill="url(#scfloor)" />
            {Array.from({length: 7}, (_, i) => {
              const y = floorY + (h - floorY) * Math.pow(i / 7, 1.6);
              return <line key={i} x1={0} x2={w} y1={y} y2={y} stroke="#2B1B12" strokeOpacity={0.35} strokeWidth={Math.max(1, 1.5 * u)} />;
            })}
            {Array.from({length: 13}, (_, i) => {
              const xb = (i / 12) * w;
              const xt = cx + (xb - cx) * 0.55;
              return <line key={'v' + i} x1={xt} x2={xb} y1={floorY} y2={h} stroke="#2B1B12" strokeOpacity={0.18} strokeWidth={Math.max(1, u)} />;
            })}
            <line x1={0} x2={w} y1={floorY} y2={floorY} stroke="#2B1B12" strokeWidth={Math.max(2, 3 * u)} />
          </g>
        ) : null}
        {/* spotlight cones, swinging slowly, pulsing on the beat */}
        {spotList.map((col, i) => {
          const n = spotList.length;
          const sx = w * (0.18 + (0.64 * i) / Math.max(1, n - 1));
          const tx = cx + Math.sin(t * 0.7 + i * 2.1) * w * 0.12;
          return (
            <g key={i} style={{mixBlendMode: 'screen'}} opacity={(0.22 + 0.12 * hit) * open}>
              <path d={`M${sx - 12 * u} ${valH * 0.6} L${sx + 12 * u} ${valH * 0.6} L${tx + 150 * u} ${floorY + 30 * u} L${tx - 150 * u} ${floorY + 30 * u} Z`} fill={col} />
              <ellipse cx={tx} cy={floorY + 26 * u} rx={160 * u} ry={26 * u} fill={col} />
            </g>
          );
        })}
        {title ? (
          <text x={cx} y={h * (portrait ? 0.3 : 0.32)} textAnchor="middle" fontFamily={fonts.comic} fontSize={tsz} fill="#2B2233" opacity={clamp01((open - 0.6) * 3)} letterSpacing={2} transform={`rotate(${-3 + Math.sin(t * 2) * 1} ${cx} ${h * 0.3})`}>
            {title}
          </text>
        ) : null}
        {/* performer */}
        {performer === 'nib' ? (
          <g opacity={clamp01(open * 2 - 0.2)}>
            <NibFigure id="scnib" x={cx} y={floorY + 40 * u} u={ru} frame={frame} fps={fps} bpm={bpm} offsetSec={offsetSec} emotion={emotion} dance={dance} seed={5} hat={'' as HatKind} colors={{body: NIB_COLORS.body}} look="ink-wash" />
          </g>
        ) : null}
        {/* alarm wash */}
        {alarm ? <rect width={w} height={h} fill="#E23E36" opacity={0.18 + 0.2 * hit} style={{mixBlendMode: 'multiply'}} /> : null}
        {/* front: curtains + valance + footlights */}
        {curtain(-1)}
        {curtain(1)}
        <g filter="url(#scwash)">
          <rect x={-10} y={-10} width={w + 20} height={valH + 10} fill={curtainColor} />
          {Array.from({length: 9}, (_, i) => {
            const sw = (w + 20) / 9;
            const x = -10 + i * sw;
            return <path key={i} d={`M${x} ${valH} Q${x + sw / 2} ${valH + 46 * u} ${x + sw} ${valH}`} fill={curtainColor} stroke={cDark} strokeWidth={2 * u} />;
          })}
          {Array.from({length: 9}, (_, i) => {
            const sw = (w + 20) / 9;
            return <circle key={'t' + i} cx={-10 + i * sw} cy={valH + 4 * u} r={9 * u} fill={c1} stroke={cDark} strokeWidth={1.5 * u} />;
          })}
        </g>
        {Array.from({length: 9}, (_, i) => {
          const x = ((i + 0.5) / 9) * w;
          return <ellipse key={'f' + i} cx={x} cy={h - 6 * u} rx={46 * u} ry={14 * u} fill="#FFE7A8" opacity={(0.35 + 0.25 * hash(i, Math.floor(t * 8))) * (0.4 + 0.6 * open)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const stageCurtain = defineMotion<Props>({
  id: 'stage-curtain',
  title: 'Painted stage + curtains',
  category: 'music',
  description:
    'A hand-painted storybook theatre: a slowly rotating two-colour sunburst backdrop, a wooden plank floor, spotlight cones swinging and pulsing on the beat, footlights, and velvet side curtains with a scalloped valance that sweep open at the start and close at the end — with Nib dancing centre stage (or empty, or as a front-only frame over your own scene).',
  source: ['idea only: PDoomVideo stage set as summarised in analysis/sources/pdoom.md (no licence — original implementation)'],
  useFor: '“And now…” announcements, show/reveal framing, open/close bookends, a recurring chorus set, kids’ and storybook videos.',
  durationInFrames: 240,
  defaultProps: {
    title: 'TONIGHT ONLY',
    performer: 'nib',
    dance: 'mix',
    emotion: 'happy',
    backdrop: 'sunburst',
    colors: ['#E8AA38', '#F3D27A'],
    curtainColor: '#B3263A',
    floorColor: '#9A6A44',
    spots: ['#FFF2C4', '#FFE1A8', '#FFF2C4'],
    alarm: false,
    openFrames: 36,
    closeFrames: 30,
    bpm: 120,
    offsetSec: 0,
    rays: 24,
    background: '#2B2233',
  },
  propDocs: {
    title: 'painted marquee line over the stage (empty = none)',
    performer: "'nib' (the library mascot dances centre stage) or 'none'",
    dance: 'Nib dance style (bounce, hop, roof, sway, spin, wave, stomp, shimmy, mix …)',
    emotion: 'Nib mood',
    backdrop: "'sunburst' (painted set + floor) or 'none' (front-only frame: curtains, valance, footlights)",
    colors: 'two sunburst colours',
    curtainColor: 'velvet colour',
    floorColor: 'stage floor colour',
    spots: 'spotlight colours (one cone each)',
    alarm: 'red alarm wash pulsing on the beat',
    openFrames: 'frames for the curtains to open',
    closeFrames: 'frames for the curtains to close at the end',
    bpm: 'beat for spot pulses and the dance',
    offsetSec: 'first beat (s)',
    rays: 'sunburst ray count',
    background: "colour behind everything, or 'transparent' with backdrop 'none' to frame another motion",
  },
  component: StageCurtain,
  tags: ['stage', 'theatre', 'curtain', 'sunburst', 'spotlight', 'show', 'announcement', 'reveal', 'storybook', 'painted', 'kids', 'bookend', 'mascot', 'nib', 'music', 'frame'],
});
