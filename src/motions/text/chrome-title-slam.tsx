// Adapted from mg-styles-15/demos/10-synthwave/index.html (chrome title block) (MIT, © mg-styles-15 authors) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useSafeId} from '../../core/image-kit';
import {mixHex} from '../../core/r2-s1-kit';
import {hash, textWidth} from '../../core/r2-mg2b-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Extruded 80s chrome logotype that SLAMS in: it runs in from huge scale in a few frames, flashes the frame white and
 * shakes, then settles. The face is a sky-to-sunset split gradient with a bright horizon line, over a dark outline, a hot
 * neon edge, a deep-purple stacked extrusion, white/dark bevel slivers and horizon reflection lines; a diagonal glint
 * sweeps across and a four-point star pops at its end. (Complements `chrome-80s-title`, which flickers a flat chrome card.)
 */
type Props = {
  text: string;
  subtitle: string;
  skyColors: string[];
  sunColors: string[];
  rimColor: string;
  neon: string;
  extrudeColor: string;
  extrudeSteps: number;
  slamAt: number;
  flash: number;
  glintAt: number;
  starGlint: boolean;
  skew: number;
  background: string;
};

const ChromeTitleSlam: React.FC<Props> = ({text, subtitle, skyColors, sunColors, rimColor, neon, extrudeColor, extrudeSteps, slamAt, flash, glintAt, starGlint, skew, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const id = useSafeId('cts');
  const fam = fonts.display;
  const em = textWidth(text, 100, fam) / 100;
  const fs = Math.min((portrait ? 0.3 : 0.34) * h, (w * 0.84) / Math.max(1, em), 330 * u);
  const capH = fs * 0.72;
  const outline = fs * 0.05;
  const t = frame - slamAt;
  const run = prog(frame, slamAt, slamAt + 3, ease.out);
  const scale = frame < slamAt ? 8 : 1 + 6 * Math.pow(1 - run, 2);
  const impact = Math.max(0, frame - (slamAt + 3));
  const shake = impact > 0 && impact < 16 ? Math.exp(-impact * 0.3) : 0;
  const sx = shake * 16 * u * Math.sin(impact * 2.3);
  const sy = shake * 11 * u * Math.cos(impact * 2.9);
  const breathe = 1 + 0.006 * Math.sin(frame * 0.07);
  const opacity = frame < slamAt ? 0 : clamp(t / 2);
  const dx = fs * 0.0028;
  const dy = fs * 0.0092;
  const fl = frame >= slamAt + 3 ? flash * Math.exp(-(frame - slamAt - 3) * 0.43) : 0;
  const tw = em * fs;
  const gt = prog(frame, glintAt, glintAt + 18, ease.inOut);
  const gx = (gt - 0.5) * (tw * 1.5);
  const starT = clamp((frame - (glintAt + 15)) / 12);
  const starS = starGlint && frame >= glintAt + 15 ? Math.sin(starT * Math.PI) * (1 + 0.15 * Math.sin(starT * 9)) : 0;
  const stars = Array.from({length: 38}, (_, i) => ({x: hash(i * 3 + 1) * w, y: hash(i * 3 + 2) * h * 0.55, r: 0.6 + hash(i * 3 + 3) * 1.6, p: hash(i + 40) * 6}));

  const textProps = {fontFamily: fam, fontSize: fs, textAnchor: 'middle' as const, y: capH / 2, strokeLinejoin: 'round' as const};
  const Txt: React.FC<React.SVGProps<SVGTextElement>> = (p) => (
    <text x={0} {...textProps} {...p}>
      {text}
    </text>
  );
  const steps = Math.max(0, Math.round(extrudeSteps));
  const sky = skyColors.length ? skyColors : ['#4a7dff', '#9fe8ff'];
  const sun = sunColors.length ? sunColors : ['#ffe36a', '#ff3d9a'];
  const stopsSky = sky.map((c, i) => ({o: (i / Math.max(1, sky.length - 1)) * 0.494, c}));
  const stopsSun = sun.map((c, i) => ({o: 0.506 + (i / Math.max(1, sun.length - 1)) * 0.494, c}));

  return (
    <AbsoluteFill style={{background}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={id + 'bg'} cx="50%" cy="58%" r="70%">
            <stop offset="0" stopColor="#5a1480" />
            <stop offset="0.55" stopColor="#210a46" />
            <stop offset="1" stopColor="#090216" />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${id}bg)`} />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * u} fill="#fff" opacity={0.35 + 0.35 * Math.sin(frame * 0.12 + s.p)} />
        ))}
        <rect x={0} y={cy + capH * 0.9} width={w} height={2 * u} fill={neon} opacity={0.5} />
      </svg>
      <Svg>
        <defs>
          <linearGradient id={id + 'face'} gradientUnits="userSpaceOnUse" x1={0} y1={-capH / 2} x2={0} y2={capH / 2}>
            {[...stopsSky, {o: 0.494, c: '#ffffff'}, {o: 0.506, c: '#ffffff'}, ...stopsSun].map((s, i) => (
              <stop key={i} offset={s.o} stopColor={s.c} />
            ))}
          </linearGradient>
          <linearGradient id={id + 'rim'} gradientUnits="userSpaceOnUse" x1={0} y1={-capH / 2} x2={0} y2={capH / 2}>
            <stop offset={0} stopColor="#ffffff" />
            <stop offset={0.5} stopColor={rimColor} />
            <stop offset={1} stopColor="#ffffff" stopOpacity={0.8} />
          </linearGradient>
          <filter id={id + 'glow'} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation={fs * 0.05} />
          </filter>
          <clipPath id={id + 'clip'}>
            <Txt />
          </clipPath>
          <mask id={id + 'bevW'} maskUnits="userSpaceOnUse" x={-tw} y={-capH} width={tw * 2} height={capH * 2}>
            <Txt fill="#fff" />
            <Txt fill="#000" transform={`translate(${fs * 0.011},${fs * 0.016})`} />
          </mask>
          <mask id={id + 'bevD'} maskUnits="userSpaceOnUse" x={-tw} y={-capH} width={tw * 2} height={capH * 2}>
            <Txt fill="#fff" />
            <Txt fill="#000" transform={`translate(${-fs * 0.01},${-fs * 0.013})`} />
          </mask>
        </defs>
        <g opacity={opacity} transform={`translate(${cx + sx},${cy - (subtitle ? capH * 0.12 : 0) + sy}) scale(${scale * breathe}) skewX(${skew})`}>
          <Txt fill="none" stroke={neon} strokeWidth={outline * 3.2} opacity={0.85} filter={`url(#${id}glow)`} />
          {Array.from({length: steps}, (_, k) => {
            const i = steps - k;
            const c = mixHex(extrudeColor, mixHex(extrudeColor, '#000000', 0.78), i / Math.max(1, steps));
            return <Txt key={i} fill={c} stroke={c} strokeWidth={outline} transform={`translate(${i * dx},${i * dy})`} />;
          })}
          <Txt fill="none" stroke={neon} strokeWidth={outline + fs * 0.014} />
          <Txt fill="#0a0014" stroke="#0a0014" strokeWidth={outline} />
          <Txt fill={`url(#${id}face)`} />
          <Txt fill="none" stroke={`url(#${id}rim)`} strokeWidth={fs * 0.02} />
          <rect x={-tw} y={-capH} width={tw * 2} height={capH * 2} fill="#fff" opacity={0.9} mask={`url(#${id}bevW)`} />
          <rect x={-tw} y={-capH} width={tw * 2} height={capH * 2} fill="#1a0620" opacity={0.55} mask={`url(#${id}bevD)`} />
          <g clipPath={`url(#${id}clip)`}>
            {Array.from({length: 7}, (_, i) => (
              <rect key={i} x={-tw} y={capH * (0.02 + (i / 7) * 0.46) * (0.55 + 0.45 * (i / 6)) + 0.0} width={tw * 2} height={fs * 0.006 + i * 0.5} fill="#2a0840" opacity={0.28} />
            ))}
            {Array.from({length: 11}, (_, i) => {
              const k = (i - 5) / 5;
              return <line key={i} x1={k * tw * 0.7} y1={capH * 0.5} x2={k * tw * 0.06} y2={0} stroke="#2a0840" strokeWidth={fs * 0.004} opacity={0.16} />;
            })}
            <g transform={`translate(${gx},0) skewX(-22)`} opacity={gt > 0 && gt < 1 ? 1 : 0}>
              <rect x={-tw * 0.1} y={-capH} width={tw * 0.2} height={capH * 2} fill="#fff" opacity={0.42} />
              <rect x={tw * 0.075} y={-capH} width={tw * 0.05} height={capH * 2} fill="#fff" opacity={0.85} />
            </g>
          </g>
          {starS > 0.01 && (
            <g transform={`translate(${tw * 0.36},${-capH * 0.22}) scale(${starS})`}>
              <rect x={-fs * 0.6} y={-fs * 0.006} width={fs * 1.2} height={fs * 0.012} fill="#fff" opacity={0.85} />
              <path d={`M0 ${-fs * 0.2} Q ${fs * 0.03} ${-fs * 0.03} ${fs * 0.2} 0 Q ${fs * 0.03} ${fs * 0.03} 0 ${fs * 0.2} Q ${-fs * 0.03} ${fs * 0.03} ${-fs * 0.2} 0 Q ${-fs * 0.03} ${-fs * 0.03} 0 ${-fs * 0.2}Z`} fill="#fff" />
            </g>
          )}
        </g>
        {subtitle && (
          <text
            x={cx}
            y={cy + capH * 0.75 + fs * 0.2}
            textAnchor="middle"
            fontFamily={fonts.sans}
            fontWeight={800}
            fontSize={fs * 0.13}
            letterSpacing={fs * 0.045}
            fill="#ffd1f3"
            opacity={clamp((frame - slamAt - 10) / 12) * 0.9}
          >
            {subtitle}
          </text>
        )}
      </Svg>
      <AbsoluteFill style={{background: '#fff', opacity: fl, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const chromeTitleSlam = defineMotion<Props>({
  id: 'chrome-title-slam',
  title: 'Chrome title slam',
  category: 'text',
  description:
    'An extruded 80s chrome logotype slams in from huge scale, flashes the frame white and shakes: sky-to-sunset split face with a bright horizon line, dark outline, neon edge, stacked purple extrusion, bevel slivers and reflection lines; then a diagonal glint sweeps across and a four-point star pops.',
  source: ['mg-styles-15 demos/10-synthwave chrome title (MIT)', 'video 10-synthwave 4.13-5.6 s'],
  useFor: 'Retro title cards, gaming / esports intros, event posters and Y2K chrome brand moments; the extruded, slammed cousin of `chrome-80s-title`.',
  durationInFrames: 120,
  defaultProps: {
    text: 'HYPERWAVE',
    subtitle: 'WORLD TOUR 2099',
    skyColors: ['#3f6bff', '#8fdcff', '#eefaff'],
    sunColors: ['#ffe76a', '#ff9a3d', '#ff3d9a'],
    rimColor: '#ff7bdd',
    neon: '#ff49d6',
    extrudeColor: '#5c1080',
    extrudeSteps: 14,
    slamAt: 8,
    flash: 0.6,
    glintAt: 52,
    starGlint: true,
    skew: -8,
    background: '#090216',
  },
  propDocs: {
    text: 'the logotype (short, caps)',
    subtitle: 'small letter-spaced line under it (empty = none)',
    skyColors: 'face gradient stops, top to the horizon line (2-4 hex colours)',
    sunColors: 'face gradient stops, below the horizon line',
    rimColor: 'colour of the bright rim stroke',
    neon: 'neon edge + glow colour',
    extrudeColor: 'extrusion colour at the face; it darkens with depth',
    extrudeSteps: 'number of stacked extrusion copies (depth)',
    slamAt: 'frame the title starts slamming in',
    flash: 'white flash peak 0..1',
    glintAt: 'frame the diagonal glint starts (0.6 s sweep)',
    starGlint: 'pop a four-point star + streak at the end of the sweep',
    skew: 'italic skew in degrees',
    background: 'backdrop base colour',
  },
  component: ChromeTitleSlam,
  tags: ['title', 'chrome', '80s', 'synthwave', 'retro', 'slam', 'extrude', '3d text', 'neon', 'glint', 'flash', 'gaming', 'esports', 'intro', 'logo', 'y2k', 'poster'],
});
