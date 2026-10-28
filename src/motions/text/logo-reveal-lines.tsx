import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fonts} from '../../core/fonts';
import {Mark, eio, eo3, eo5, logoBox, seg, withAlpha} from '../../core/r3-brand-kit';
import {useSafeId} from '../../core/image-kit';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';


/**
 * Logo reveal with sweeping lines: a stack of fine rules sweeps in from alternating sides across the whole frame, the rules
 * converge on the logo's box (the two outer ones become the top and bottom rule, the inner ones collapse into one bright
 * centre line), the logo opens out of that centre line, a sheen passes over it and the tagline tracks in.
 */
type Props = {
  text: string;
  tagline: string;
  src: string;
  lines: number;
  background: string;
  ink: string;
  accent: string;
  startAt: number;
  speed: number;
  fontFamily: string;
  exit: boolean;
};

const LogoRevealLines: React.FC<Props> = ({text, tagline, src, lines, background, ink, accent, startAt, speed, fontFamily, exit}) => {
  const frame = useCurrentFrame();
  const {w, h, u, cx, cy, portrait, durationInFrames: D} = useStage();
  const uid = useSafeId('lrl');
  const f = Math.max(0, (frame - startAt) * speed);
  const {bw, bh} = logoBox(w, h, u, portrait, 1);
  const n = Math.max(3, Math.min(24, Math.round(lines)));
  const mid = (n - 1) / 2;
  const span = h * (portrait ? 0.3 : 0.4);
  const pad = 26 * u;
  const topY = cy - bh / 2 - pad;
  const botY = cy + bh / 2 + pad;
  const half = bw / 2 + pad * 1.6;

  const sweep = (i: number) => eo5(seg(f, i * 1.6, 26 + i * 1.6));
  const conv = eio(seg(f, 34, 66));
  const open = eo5(seg(f, 56, 88));
  const sheen = seg(f, 84, 108);
  const tagT = eo3(seg(f, 88, 112));
  const outT = exit ? eio(seg(frame, D - 14, D)) : 0;

  const els: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const y0 = cy + (i - mid) * (span / Math.max(1, mid));
    const outer = i === 0 || i === n - 1;
    const yEnd = outer ? (i === 0 ? topY : botY) : cy;
    const y = y0 + (yEnd - y0) * conv;
    // full-frame width while sweeping, shrinking to the box width while converging
    const reach = (w * 0.62 + 0 * u) * (1 - conv) + half * conv;
    const sw = sweep(i);
    const x1 = cx - reach * 1;
    const x2 = cx + reach * 1;
    // sweep: the line grows from its entry side
    const gx1 = side > 0 ? x2 - (x2 - x1) * sw : x1;
    const gx2 = side > 0 ? x2 : x1 + (x2 - x1) * sw;
    const fadeInner = outer ? 1 : 1 - eio(seg(f, 54, 70));
    const thick = (outer ? 3 : i % 3 === 0 ? 2.4 : 1.4) * u;
    const col = outer || i % 3 === 0 ? accent : ink;
    const op = (outer ? 1 : 0.55 + 0.25 * ((i * 7) % 3) * 0.5) * fadeInner;
    els.push(<line key={i} x1={gx1} x2={gx2} y1={y} y2={y} stroke={col} strokeWidth={thick} strokeLinecap="round" opacity={op} />);
  }
  // bright centre line while the inner rules merge, then it becomes the "opening"
  const flash = eo3(seg(f, 50, 62)) * (1 - eo3(seg(f, 70, 92)));
  const clipTop = (1 - open) * 50;
  const scale = 1.07 - 0.07 * eo5(seg(f, 56, 104));
  const markFs = Math.min(w, h);
  void markFs;
  const tickLen = 22 * u * eo3(seg(f, 60, 80));
  const sx = cx - bw / 2 - pad * 1.6 + (bw + pad * 3.2) * sheen;
  const bg = background === 'transparent' ? undefined : background;
  return (
    <AbsoluteFill style={{background: bg, opacity: 1 - outT}}>
      <Svg>
        <defs>
          <linearGradient id={uid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={withAlpha('#ffffff', 0)} />
            <stop offset="0.5" stopColor={withAlpha('#ffffff', 0.55)} />
            <stop offset="1" stopColor={withAlpha('#ffffff', 0)} />
          </linearGradient>
        </defs>
        {els}
        <line x1={cx - half} x2={cx + half} y1={cy} y2={cy} stroke={accent} strokeWidth={3.2 * u} opacity={flash} />
        {/* corner ticks that frame the box once it is open */}
        {[-1, 1].map((sx2) =>
          [topY, botY].map((yy, k) => (
            <line key={`${sx2}${k}`} x1={cx + sx2 * half} x2={cx + sx2 * half} y1={yy} y2={yy + (k === 0 ? 1 : -1) * tickLen} stroke={accent} strokeWidth={3 * u} strokeLinecap="round" />
          )),
        )}
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: cx - bw / 2,
          top: cy - bh / 2,
          width: bw,
          height: bh,
          clipPath: `inset(${clipTop}% -2% ${clipTop}% -2%)`,
          transform: `scale(${scale})`,
          opacity: open > 0 ? 1 : 0,
        }}
      >
        <Mark src={src || undefined} text={text} bw={bw} bh={bh} color={ink} font="display" tracking={0.04} style={fontFamily ? {fontFamily} : undefined} />
      </div>
      {/* sheen band across the logo */}
      {sheen > 0 && sheen < 1 && (
        <Svg>
          <rect x={sx - 60 * u} y={topY + 4 * u} width={120 * u} height={botY - topY - 8 * u} fill={`url(#${uid})`} style={{mixBlendMode: 'overlay'}} />
        </Svg>
      )}
      {tagline && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: botY + 34 * u,
            textAlign: 'center',
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: (portrait ? 34 : 30) * u,
            color: ink,
            opacity: tagT * 0.8,
            letterSpacing: `${0.4 - 0.18 * tagT}em`,
            paddingLeft: `${0.4 - 0.18 * tagT}em`,
            textTransform: 'uppercase',
            transform: `translateY(${(1 - tagT) * 10 * u}px)`,
          }}
        >
          {tagline}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const logoRevealLines = defineMotion<Props>({
  id: 'logo-reveal-lines',
  title: 'Logo reveal: sweeping lines',
  category: 'text',
  description:
    'Fine rules sweep in from alternating sides across the frame, converge on the logo box (outer rules become top and bottom rule, the rest merge into a bright centre line), the logo opens out of that line with a sheen and the tagline tracks in.',
  source: ['original (branding pass, round 3)'],
  useFor: 'Clean logo intros and outros for a channel, product or studio; wordmark text or your own logo image.',
  durationInFrames: 120,
  defaultProps: {
    text: 'NORTHWIND',
    tagline: 'made to move',
    src: '',
    lines: 9,
    background: '#0B0D10',
    ink: '#F4F1EA',
    accent: '#FF5A36',
    startAt: 0,
    speed: 1,
    fontFamily: '',
    exit: false,
  },
  propDocs: {
    text: 'wordmark shown when no src is given (use \\n for two lines)',
    tagline: 'small tracked line under the logo ("" = none)',
    src: 'logo image (public/ path or https URL, transparent PNG/SVG best); empty = wordmark text',
    lines: 'how many sweeping rules (3-24)',
    background: 'backdrop colour, or "transparent" to sit over other footage',
    ink: 'wordmark / secondary line colour',
    accent: 'brand colour of the main rules and ticks',
    startAt: 'frame the sweep starts',
    speed: 'timing multiplier (1 = default, 1.5 = faster)',
    fontFamily: 'optional CSS font-family for the wordmark text',
    exit: 'fade everything out over the last 14 frames',
  },
  component: LogoRevealLines,
  tags: ['logo', 'logo reveal', 'intro', 'outro', 'branding', 'lines', 'sweep', 'wordmark', 'studio', 'channel', 'clean', 'brand', 'tagline', 'ident'],
});
