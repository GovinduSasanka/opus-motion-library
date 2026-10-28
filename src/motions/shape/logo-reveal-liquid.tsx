import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useSafeId} from '../../core/image-kit';
import {Mark, eio, eo3, eo5, logoBox, mix, seg} from '../../core/r3-brand-kit';
import {smoothClosed} from '../../core/shapes';
import {fonts} from '../../core/fonts';
import {Svg, useStage} from '../../core/stage';
import {hash01} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Liquid logo reveal: gooey liquid in two brand colours rises from the bottom edge (wavy surface, droplets lifting off it) until
 * it floods the frame; then a wobbly hole opens in the middle, spreading outward, and the logo is revealed inside it as it grows.
 * The tagline fades in once the hole has taken the whole frame, with a ripple ring.
 */
type Props = {
  text: string;
  tagline: string;
  src: string;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  droplets: number;
  wobble: number;
  startAt: number;
  speed: number;
  fontFamily: string;
};

const blobPath = (cx: number, cy: number, R: number, f: number, seed: number, wob: number, k = 36) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2;
    const r = R * (1 + wob * (0.09 * Math.sin(a * 3 + f * 0.16 + seed) + 0.05 * Math.sin(a * 5 - f * 0.21 + seed * 2.1) + 0.03 * Math.sin(a * 8 + f * 0.3)));
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return smoothClosed(pts);
};

const LogoRevealLiquid: React.FC<Props> = ({text, tagline, src, background, ink, accent, accent2, droplets, wobble, startAt, speed, fontFamily}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait} = useStage();
  const uid = useSafeId('lrq');
  const f = Math.max(0, (frame - startAt) * speed);
  const {bw, bh} = logoBox(w, h, u, portrait, 0.95);
  const diag = Math.hypot(w, h);

  // liquid levels (y of surface) for the two layers
  const rise2 = eio(seg(f, 2, 52));
  const rise1 = eio(seg(f, 10, 60));
  const level = (rise: number) => h * 1.08 - (h * 1.3) * rise;
  const surface = (lvl: number, ph: number, amp: number) => {
    const A = amp * Math.sin(Math.PI * Math.min(1, Math.max(0, (lvl - -h * 0.1) / (h * 1.2)))) * 0.9 + 4 * u;
    let d = `M ${-40} ${h + 60} L ${-40} ${lvl}`;
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const x = -40 + ((w + 80) * i) / steps;
      const y = lvl + A * Math.sin(x / (w * 0.16) + ph) + A * 0.45 * Math.sin(x / (w * 0.07) - ph * 1.7);
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + ` L ${w + 40} ${h + 60} Z`;
  };
  const amp = 34 * u;
  const L1 = level(rise1);
  const L2 = level(rise2);
  const drops: React.ReactNode[] = [];
  const nd = Math.max(0, Math.min(24, Math.round(droplets)));
  for (let i = 0; i < nd; i++) {
    const x = w * (0.1 + 0.8 * hash01(i, 'lrq-x'));
    const t0 = 8 + i * (34 / Math.max(1, nd)) + hash01(i, 'lrq-t') * 6;
    const s = seg(f, t0, t0 + 26);
    if (s <= 0 || s >= 1) continue;
    const r = (14 + 22 * hash01(i, 'lrq-r')) * u * (1 - 0.35 * s);
    const baseY = (i % 2 ? L1 : L2) + 6 * u;
    const y = baseY - 4 * (portrait ? 150 : 170) * u * (0.5 + hash01(i, 'lrq-h')) * s * (1 - s);
    drops.push(<ellipse key={i} cx={x} cy={y} rx={r * (1 - 0.2 * Math.abs(1 - 2 * s))} ry={r * (1 + 0.45 * Math.abs(1 - 2 * s))} fill={i % 2 ? accent : accent2} />);
  }

  // the hole that opens in the flooded frame
  const grow = eio(seg(f, 56, 108));
  const grow2 = eio(seg(f, 62, 114));
  const R = grow * diag * 0.58;
  const R2 = grow2 * diag * 0.54;
  const wobAmt = wobble * (1 - 0.7 * seg(f, 100, 130));
  const holePath = R > 1 ? blobPath(cx, cy, R, f, 1.3, wobAmt) : '';
  const hole2Path = R2 > 1 ? blobPath(cx, cy, R2, f - 3, 4.1, wobAmt) : '';
  const clip = R2 > 1 ? blobPath(cx, cy, R2 * 0.99, f - 3, 4.1, wobAmt) : '';

  const logoT = eo5(seg(f, 70, 104));
  const tagT = eo3(seg(f, 108, 128));
  const ring = seg(f, 98, 140);
  const bg = background === 'transparent' ? null : background;
  const float = Math.sin(f * 0.05) * 3 * u * seg(f, 110, 130);

  return (
    <AbsoluteFill>
      {bg && <AbsoluteFill style={{background: bg}} />}
      <Svg>
        <defs>
          <filter id={`${uid}-goo`} x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={13 * u} result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
          </filter>
          <mask id={`${uid}-m1`} maskUnits="userSpaceOnUse" x={-50} y={-50} width={w + 100} height={h + 100}>
            <rect x={-50} y={-50} width={w + 100} height={h + 100} fill="#fff" />
            {hole2Path && <path d={hole2Path} fill="#000" />}
          </mask>
          <mask id={`${uid}-m2`} maskUnits="userSpaceOnUse" x={-50} y={-50} width={w + 100} height={h + 100}>
            <rect x={-50} y={-50} width={w + 100} height={h + 100} fill="#fff" />
            {holePath && <path d={holePath} fill="#000" />}
          </mask>
        </defs>
        <g mask={`url(#${uid}-m1)`}>
          <g filter={`url(#${uid}-goo)`}>
            <path d={surface(L2, f * 0.13, amp)} fill={accent2} />
            {drops.filter((_, i) => i % 2 === 0)}
          </g>
        </g>
        <g mask={`url(#${uid}-m2)`}>
          <g filter={`url(#${uid}-goo)`}>
            <path d={surface(L1, f * 0.15 + 2, amp * 0.85)} fill={accent} />
            {drops.filter((_, i) => i % 2 === 1)}
          </g>
        </g>
        {ring > 0 && ring < 1 && <circle cx={cx} cy={cy} r={mix(bw * 0.35, diag * 0.5, eo3(ring))} fill="none" stroke={accent} strokeWidth={4 * u * (1 - ring)} opacity={0.6 * (1 - ring)} />}
      </Svg>
      {clip && (
        <AbsoluteFill style={{clipPath: `path('${clip}')`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{opacity: logoT, transform: `translateY(${(1 - logoT) * 24 * u + float}px) scale(${mix(0.86, 1, logoT)})`, filter: logoT < 1 ? `blur(${(1 - logoT) * 6 * u}px)` : undefined}}>
            <Mark src={src || undefined} text={text} bw={bw} bh={bh} color={ink} font="display" tracking={0.04} style={fontFamily ? {fontFamily} : undefined} />
          </div>
        </AbsoluteFill>
      )}
      {tagline && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: cy + bh / 2 + 32 * u + float,
            textAlign: 'center',
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: (portrait ? 34 : 30) * u,
            letterSpacing: '0.3em',
            paddingLeft: '0.3em',
            textTransform: 'uppercase',
            color: ink,
            opacity: tagT * 0.8,
            transform: `translateY(${(1 - tagT) * 12 * u}px)`,
          }}
        >
          {tagline}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const logoRevealLiquid = defineMotion<Props>({
  id: 'logo-reveal-liquid',
  title: 'Logo reveal: liquid flood',
  category: 'shape',
  description:
    'Gooey two-colour liquid rises from the bottom edge with droplets lifting off the wavy surface until it floods the frame; a wobbly hole then opens in the middle and spreads out, revealing the logo inside it, followed by a ripple ring and the tagline.',
  source: ['original (branding pass, round 3)'],
  useFor: 'Playful or organic logo intros and outros (drinks, wellness, kids, creative studios); your logo image or a wordmark.',
  durationInFrames: 150,
  defaultProps: {
    text: 'Fluent',
    tagline: 'pour it on',
    src: '',
    background: '#FFF6EA',
    ink: '#1B1A2E',
    accent: '#3A4BFF',
    accent2: '#FF7AA8',
    droplets: 10,
    wobble: 1,
    startAt: 0,
    speed: 1,
    fontFamily: '',
  },
  propDocs: {
    text: 'wordmark shown when no src is given (use \\n for two lines)',
    tagline: 'small tracked line under the logo ("" = none)',
    src: 'logo image (public/ path or https URL); empty = wordmark text',
    background: 'colour of the revealed frame the logo sits on, or "transparent"',
    ink: 'wordmark / tagline colour (pick one that reads on `background`)',
    accent: 'front liquid colour',
    accent2: 'rear liquid colour',
    droplets: 'droplets that lift off the surface (0-24)',
    wobble: 'edge wobble of the hole (0 = perfect circle, 1 = default, 2 = very jelly)',
    startAt: 'frame the liquid starts rising',
    speed: 'timing multiplier',
    fontFamily: 'optional CSS font-family for the wordmark text',
  },
  component: LogoRevealLiquid,
  tags: ['logo', 'logo reveal', 'liquid', 'goo', 'blob', 'flood', 'wave', 'intro', 'outro', 'branding', 'playful', 'organic', 'wordmark', 'ident', 'droplets'],
});
