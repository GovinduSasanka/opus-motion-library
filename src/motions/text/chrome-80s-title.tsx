// Adapted from lemo-opuscar/styles/cel-anime-80s/demo/scenes1.js titleCard() (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {lf} from '../../core/r2-la1-kit';
import {JP_STACK, mixHex, s1f, sseg, withAlpha} from '../../core/r2-s1-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * 80s anime title card: heavy italic title with a sky-to-sunset chrome gradient (white horizon line at 50 %), a thick
 * dark outline plus a neon outline glowing through, flickering on at 12 fps with a 2-frame white flash, a light bar
 * sweeping across the letters, a star glint popping on one letter, a katakana line above, a red year below, and a slow push.
 */
type Props = {
  title: string;
  subtitle: string;
  year: string;
  tagline: string;
  neon: string;
  outline: string;
  sweepAt: number;
  glintAt: number;
  flicker: boolean;
  stars: number;
  background: string;
};

const ChromeTitle: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const uid = useSafeId('c80');
  const t0 = 4;
  const words = p.title.trim().split(/\s+/);
  const lines = portrait && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [p.title.trim()];
  // Kanit 900 italic caps run about 0.68 em per glyph
  const adv = 0.6;
  const maxLine = Math.max(...lines.map((l) => [...l].length));
  const fs = Math.min(230 * u * (portrait ? 1.0 : 1.0), (w * 0.84) / (maxLine * adv));
  const k = fs / 230;
  const lh = fs * 1.02;
  const cx = w / 2;
  const blockH = lh * lines.length;
  const cy = h * (portrait ? 0.46 : 0.47);
  const top = cy - blockH / 2;
  // flicker on at 12 fps: 0, .3, .6, 1
  const fi = Math.floor((frame - t0) / 2.5);
  const fl = !p.flicker || frame - t0 >= 10 ? (frame < t0 ? 0 : 1) : [0, 0.3, 0.6, 1][clamp(fi, 0, 3)];
  const push = 1 + 0.045 * clamp(frame / Math.max(1, durationInFrames - 1));
  const flash = frame === t0 || frame === t0 + 1 ? 0.85 : 0;
  const widthOf = (l: string) => [...l].length * fs * adv;
  const sweepT = sseg(frame, p.sweepAt, p.sweepAt + 32);
  const glintT = sseg(frame, p.glintAt, p.glintAt + 15);
  const stars = React.useMemo(() => {
    const r = rng(11);
    return Array.from({length: p.stars}, () => ({x: r() * w, y: r() * h * 0.7, r: (0.8 + r() * 1.6) * u, ph: r() * 6}));
  }, [p.stars, w, h, u]);
  const glintLine = lines[0];
  const glintX = cx - widthOf(glintLine) / 2 + widthOf(glintLine) * 0.14;
  const glintY = top + lh * 0.2;
  const gs = 120 * k * Math.sin(Math.PI * glintT);

  const textProps = {
    textAnchor: 'middle' as const,
    fontFamily: lf.kanit,
    fontStyle: 'italic' as const,
    fontWeight: 900,
    fontSize: fs,
  };
  const ly = (i: number) => top + lh * i + lh * 0.82;

  return (
    <AbsoluteFill style={{background: p.background}}>
      <Svg>
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.background} />
            <stop offset="0.6" stopColor={mixHex(p.background, '#2B1D30', 0.9)} />
            <stop offset="1" stopColor="#5B2A70" />
          </linearGradient>
          <radialGradient id={`${uid}-hz`} cx="50%" cy="100%" r="70%">
            <stop offset="0" stopColor={p.neon} stopOpacity={0.5} />
            <stop offset="1" stopColor={p.neon} stopOpacity={0} />
          </radialGradient>
          {lines.map((_, i) => {
            const y0 = ly(i) - fs * 0.74;
            const y1 = ly(i) + fs * 0.02;
            return (
              <linearGradient key={i} id={`${uid}-g${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={y0} x2="0" y2={y1}>
                <stop offset="0" stopColor="#E8F6FF" />
                <stop offset="0.46" stopColor="#7FC8FF" />
                <stop offset="0.5" stopColor="#FFFFFF" />
                <stop offset="0.54" stopColor="#3A2A7A" />
                <stop offset="0.8" stopColor="#FF6AA0" />
                <stop offset="1" stopColor="#FFD08A" />
              </linearGradient>
            );
          })}
          <filter id={`${uid}-glow`} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation={22 * k} />
          </filter>
          <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={0.95} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={`${uid}-tm`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            {lines.map((l, i) => (
              <text key={i} x={cx} y={ly(i)} {...textProps} fill="#fff">
                {l}
              </text>
            ))}
          </mask>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}-sky)`} />
        <rect width={w} height={h} fill={`url(#${uid}-hz)`} />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.35 + 0.35 * Math.sin(frame * 0.1 + s.ph)} />
        ))}
        <g transform={`translate(${cx} ${cy}) scale(${push}) translate(${-cx} ${-cy})`}>
          <g opacity={fl}>
            {/* glow: blurred neon outline + fill */}
            <g filter={`url(#${uid}-glow)`} opacity={0.9}>
              {lines.map((l, i) => (
                <text key={i} x={cx} y={ly(i)} {...textProps} fill={p.neon} stroke={p.neon} strokeWidth={46 * k} strokeLinejoin="round">
                  {l}
                </text>
              ))}
            </g>
            {/* katakana line above */}
            {p.subtitle && (
              <text x={cx} y={top - 26 * u} textAnchor="middle" fontFamily={`${s1f.dela},${JP_STACK}`} fontSize={Math.min(64 * u, (w * 0.8) / Math.max(4, [...p.subtitle].length * 0.95))} fill="#CFF8FF" stroke={p.neon} strokeWidth={8 * u} paintOrder="stroke" letterSpacing={4 * u}>
                {p.subtitle}
              </text>
            )}
            {lines.map((l, i) => (
              <g key={i}>
                <text x={cx} y={ly(i)} {...textProps} fill={p.neon} stroke={p.neon} strokeWidth={46 * k} strokeLinejoin="round">
                  {l}
                </text>
                <text x={cx} y={ly(i)} {...textProps} fill={p.outline} stroke={p.outline} strokeWidth={26 * k} strokeLinejoin="round">
                  {l}
                </text>
                <text x={cx} y={ly(i)} {...textProps} fill={`url(#${uid}-g${i})`}>
                  {l}
                </text>
              </g>
            ))}
            {/* light bar sweep, masked by the letters */}
            {sweepT > 0 && sweepT < 1 && (
              <g mask={`url(#${uid}-tm)`}>
                <g transform={`translate(${-240 * u + (w + 480 * u) * sweepT} 0) skewX(-18)`}>
                  <rect x={0} y={0} width={240 * u} height={h} fill={`url(#${uid}-bar)`} />
                </g>
              </g>
            )}
            {/* star glint */}
            {glintT > 0 && glintT < 1 && (
              <g transform={`translate(${glintX} ${glintY})`}>
                <circle r={gs * 0.28} fill="#fff" opacity={0.9} />
                <path d={`M0 ${-gs}L${gs * 0.1} ${-gs * 0.1}L${gs} 0L${gs * 0.1} ${gs * 0.1}L0 ${gs}L${-gs * 0.1} ${gs * 0.1}L${-gs} 0L${-gs * 0.1} ${-gs * 0.1}Z`} fill="#fff" />
                <path d={`M${-gs * 1.7} 0H${gs * 1.7}`} stroke={withAlpha('#ffffff', 0.7)} strokeWidth={2 * u} />
              </g>
            )}
            {/* year + tagline */}
            {p.year && (
              <text x={cx} y={top + blockH + 78 * u} textAnchor="middle" fontFamily={lf.kanit} fontStyle="italic" fontWeight={900} fontSize={64 * u} letterSpacing={14 * u} fill="#FF3B4E" stroke={p.outline} strokeWidth={8 * u} paintOrder="stroke">
                {p.year}
              </text>
            )}
            {p.tagline && (
              <text x={cx} y={top + blockH + (p.year ? 134 : 80) * u} textAnchor="middle" fontFamily={s1f.barlow} fontWeight={600} fontSize={Math.min(34 * u, w * 0.045)} letterSpacing={12 * u} fill="#E8D8FF">
                {p.tagline}
              </text>
            )}
          </g>
        </g>
        {flash > 0 && <rect width={w} height={h} fill="#fff" opacity={flash} />}
        {/* faint scanline finish */}
        <rect width={w} height={h} fill="none" />
      </Svg>
    </AbsoluteFill>
  );
};

export const chrome80sTitle = defineMotion<Props>({
  id: 'chrome-80s-title',
  title: 'Chrome 80s title',
  category: 'text',
  description:
    'Heavy italic title in a sky-to-sunset chrome gradient with a white horizon line, dark outline plus neon outline glowing through; flickers on, a light bar sweeps the letters, a star glint pops, katakana line above, red year below.',
  source: ['lemo-opuscar styles/cel-anime-80s/demo/scenes1.js titleCard() (MIT, LemoLab)'],
  useFor: 'Synthwave / retro / 80s anime title cards, YouTube intros and game or film trailers.',
  durationInFrames: 120,
  defaultProps: {
    title: 'MIDNIGHT RUN',
    subtitle: 'ミッドナイト・ラン',
    year: '1986',
    tagline: 'AN ORIGINAL ANIMATION',
    neon: '#FF3FA4',
    outline: '#120830',
    sweepAt: 14,
    glintAt: 33,
    flicker: true,
    stars: 60,
    background: '#130D1F',
  },
  propDocs: {
    title: 'main title (caps recommended; wraps to two lines at 9:16)',
    subtitle: 'katakana / Japanese line above (empty = none)',
    year: 'red year line below (empty = none)',
    tagline: 'small tracked caps line under the year',
    neon: 'neon outline colour',
    outline: 'dark outline colour',
    sweepAt: 'frame the light-bar sweep starts',
    glintAt: 'frame the star glint starts',
    flicker: 'flicker on at 12 fps with a 2-frame white flash',
    stars: 'number of background stars',
    background: 'night sky top colour',
  },
  component: ChromeTitle,
  tags: ['title', '80s', 'chrome', 'synthwave', 'retro', 'neon', 'outline', 'anime', 'flicker', 'glint', 'sweep', 'intro', 'trailer', 'katakana'],
});
