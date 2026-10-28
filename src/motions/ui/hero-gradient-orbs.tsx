import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {mixHex} from '../../core/r2-s1-kit';
import {useSafeId} from '../../core/image-kit';
import {rng} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {TAU, bgCss, cycles, loopPhase} from '../../core/ui-loop-kit';

/**
 * Soft blurred gradient orbs drifting on closed paths behind a website hero or app screen. Each orb follows a
 * Lissajous loop with a whole number of turns per clip and breathes in size, so the last frame joins the first with
 * no jump. Give it a `palette` of brand colours, set background "transparent" to layer it over a photo, or use it as a
 * full-bleed hero/section backdrop; a static grain keeps gradients from banding.
 */
type Props = {
  palette: string[];
  count: number;
  size: number;
  drift: number;
  speed: number;
  opacity: number;
  blend: 'normal' | 'screen' | 'multiply' | 'plus-lighter';
  grain: number;
  vignette: number;
  seed: number;
  background: string;
};

const HeroGradientOrbs: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T} = useStage();
  const uid = useSafeId('hgo');
  const ph = loopPhase(frame, T);
  const n = cycles(P.speed);
  const palette = P.palette && P.palette.length ? P.palette : ['#5B6CFF'];
  const count = Math.max(1, Math.min(14, Math.round(P.count)));
  const big = Math.max(w, h);

  const orbs = React.useMemo(() => {
    const r = rng(`hgo-${P.seed}`);
    return Array.from({length: count}, (_, i) => {
      const kx = 1 + Math.floor(r() * 2); // 1 or 2 whole turns per base loop
      const ky = 1 + Math.floor(r() * 2);
      return {
        bx: 0.08 + r() * 0.84,
        by: 0.08 + r() * 0.84,
        ax: 0.12 + r() * 0.2,
        ay: 0.1 + r() * 0.22,
        px: r(),
        py: r(),
        kx: r() < 0.5 ? kx : -kx,
        ky: r() < 0.5 ? ky : -ky,
        rad: 0.15 + r() * 0.17,
        breathe: 0.08 + r() * 0.1,
        pb: r(),
        col: i % palette.length,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, P.seed, palette.length]);

  const sz = Math.max(0.2, P.size || 1);
  const dr = Math.max(0, P.drift ?? 1);
  const op = Math.min(1, Math.max(0, P.opacity));
  const blend = P.blend === 'normal' ? undefined : (P.blend as React.CSSProperties['mixBlendMode']);
  const bgc = P.background === 'transparent' ? null : P.background;

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      <Svg style={{mixBlendMode: blend}}>
        <defs>
          {palette.map((c, i) => (
            <radialGradient key={i} id={`${uid}-${i}`}>
              <stop offset="0" stopColor={c} stopOpacity={op} />
              <stop offset="0.35" stopColor={c} stopOpacity={op * 0.72} />
              <stop offset="0.7" stopColor={c} stopOpacity={op * 0.2} />
              <stop offset="1" stopColor={c} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        {orbs.map((o, i) => {
          const x = (o.bx + o.ax * dr * Math.sin(TAU * (o.kx * n * ph + o.px))) * w;
          const y = (o.by + o.ay * dr * Math.cos(TAU * (o.ky * n * ph + o.py))) * h;
          const rr = o.rad * big * sz * (1 + o.breathe * Math.sin(TAU * (n * ph + o.pb)));
          return <ellipse key={i} cx={x} cy={y} rx={rr} ry={rr * 0.92} fill={`url(#${uid}-${o.col})`} />;
        })}
      </Svg>
      {P.vignette > 0 && bgc && (
        <Svg>
          <defs>
            <radialGradient id={`${uid}-vig`} cx="50%" cy="50%" r="75%">
              <stop offset="0.55" stopColor={mixHex(bgc, '#000000', 0.6)} stopOpacity={0} />
              <stop offset="1" stopColor={mixHex(bgc, '#000000', 0.6)} stopOpacity={1} />
            </radialGradient>
          </defs>
          <rect width={w} height={h} fill={`url(#${uid}-vig)`} opacity={Math.min(1, P.vignette)} />
        </Svg>
      )}
      {P.grain > 0 && (
        <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity: Math.min(1, P.grain) * 0.35, mixBlendMode: 'overlay'}}>
          <filter id={`${uid}-gn`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.8 / Math.max(1, u)} numOctaves={2} seed={7} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={w} height={h} filter={`url(#${uid}-gn)`} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const heroGradientOrbs = defineMotion<Props>({
  id: 'hero-gradient-orbs',
  title: 'Hero gradient orbs',
  category: 'ui',
  description: 'Soft, blurred gradient orbs in your brand colours drift and breathe on closed paths — a calm, premium looping background for website heroes, sections and app screens.',
  source: ['original'],
  useFor: 'A full-bleed website hero or section backdrop behind HTML headlines, a landing-page "mesh gradient" that moves, or a soft ambient layer under UI mockups. Overlay-capable with background "transparent".',
  durationInFrames: 360,
  defaultProps: {
    palette: ['#6C7BFF', '#FF6FB1', '#44D2FF', '#FFB86B'],
    count: 6,
    size: 1,
    drift: 1,
    speed: 1,
    opacity: 0.85,
    blend: 'screen',
    grain: 0.5,
    vignette: 0.5,
    seed: 11,
    background: '#0B1020',
  },
  propDocs: {
    palette: 'orb colours (hex), used round-robin — pass your brand colours',
    count: 'number of orbs (1-14)',
    size: 'scale of the orbs (1 = about a third of the frame)',
    drift: 'how far the orbs travel (0 = still, breathing only)',
    speed: 'whole laps per 12 s loop (integer; 1 = slow and calm)',
    opacity: 'orb strength 0..1',
    blend: 'normal | screen | multiply | plus-lighter (screen on dark, multiply on light)',
    grain: 'film-grain amount 0..1 that hides colour banding',
    vignette: 'edge darkening 0..1 (ignored when transparent)',
    seed: 'changes the orb layout',
    background: 'base colour, or "transparent" to layer over other content',
  },
  component: HeroGradientOrbs,
  tags: ['hero', 'background', 'gradient', 'orbs', 'blobs', 'mesh-gradient', 'website', 'landing', 'backdrop', 'loop', 'calm', 'ambient', 'overlay', 'soft', 'ui', 'section', 'saas'],
});
