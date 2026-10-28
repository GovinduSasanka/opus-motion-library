import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {estWidth} from '../../core/text-kit';
import {bgOf} from '../../core/r3-social';
import {famOf, fitLine, fmtNum, slideFont, withAlpha, wrapFit} from '../../core/r3-slide-kit';

/**
 * Keynote "one big number" slide: an eyebrow tag, a huge number that counts up (with optional prefix / suffix), an accent rule that
 * draws under it, a one-sentence label and a small source line at the bottom. Everything is a prop.
 */
type Props = {
  value: number;
  decimals: number;
  prefix: string;
  suffix: string;
  thousands: boolean;
  label: string;
  eyebrow: string;
  source: string;
  background: string;
  ink: string;
  accent: string;
  fontFamily: string;
  ring: boolean;
  countFrames: number;
  startAt: number;
};

const BigStatSlide: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = slideFont(p.fontFamily, 'grotesk');
  const fam = famOf(font);
  const bodyFont = famOf('sans');
  const m = (portrait ? 84 : 130) * u;
  const maxW = w - 2 * m;

  const count = Math.max(10, p.countFrames);
  const k = prog(f, 12, 12 + count, ease.expoOut);
  const val = Number.isFinite(p.value) ? p.value : 0;
  const numStr = fmtNum(val * k, p.decimals, p.thousands);
  const finalStr = fmtNum(val, p.decimals, p.thousands);
  const AFF = 0.5;

  // size the number from its final string so the layout never jumps while counting
  const base = (portrait ? 400 : 470) * u;
  const widthAt = (s: number) => estWidth(finalStr, s, font, -0.02) + estWidth(p.prefix, s * AFF, font) + estWidth(p.suffix, s * AFF, font);
  const S = Math.min(base, base * (maxW / Math.max(1, widthAt(base))));

  const baseline = h * (portrait ? 0.47 : 0.57);
  const landed = prog(f, 12 + count, 12 + count + 14, ease.out);
  const pulse = 1 + 0.025 * Math.sin(landed * Math.PI);
  const numIn = prog(f, 4, 26, ease.out);
  const eyeIn = prog(f, 0, 18, ease.out);
  const barIn = prog(f, 20, 52, ease.expoOut);
  const labIn = prog(f, 34, 64, ease.out);
  const srcIn = prog(f, 56, 84, ease.out);
  const ringIn = prog(f, 0, 70, ease.out);

  const eyebrowSize = (portrait ? 34 : 30) * u;
  const labelBox = wrapFit(p.label, 'sans', (portrait ? 58 : 56) * u, portrait ? maxW : Math.min(maxW, 1150 * u), portrait ? 330 * u : 190 * u, 1.28);
  const barW = Math.min(maxW, Math.max(260 * u, widthAt(S) * 0.5));
  const srcSize = fitLine(p.source, 'sans', (portrait ? 28 : 26) * u, maxW);

  const ringC = {x: portrait ? w * 0.78 : w * 0.8, y: portrait ? h * 0.36 : h * 0.46};
  const ringR = (portrait ? 330 : 380) * u;

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        {p.ring && (
          <g opacity={ringIn}>
            {[1, 0.72, 0.46].map((r, i) => (
              <circle key={i} cx={ringC.x} cy={ringC.y} r={ringR * r} fill="none" stroke={p.accent} strokeWidth={(i === 0 ? 2.5 : 1.5) * u} opacity={0.14 + i * 0.05} strokeDasharray={i === 1 ? `${10 * u} ${18 * u}` : undefined} strokeDashoffset={i === 1 ? -f * 0.6 * u : 0} />
            ))}
            <circle cx={ringC.x} cy={ringC.y} r={ringR * 0.46} fill={p.accent} opacity={0.05} />
          </g>
        )}

        {p.eyebrow && (
          <g opacity={eyeIn} transform={`translate(0 ${(1 - eyeIn) * 14 * u})`}>
            <rect x={m} y={h * (portrait ? 0.2 : 0.19) - eyebrowSize * 0.55} width={46 * u * eyeIn} height={5 * u} rx={2.5 * u} fill={p.accent} />
            <text x={m + 66 * u} y={h * (portrait ? 0.2 : 0.19)} fontFamily={bodyFont} fontWeight={800} fontSize={eyebrowSize} letterSpacing={eyebrowSize * 0.22} fill={p.accent}>
              {p.eyebrow.toUpperCase()}
            </text>
          </g>
        )}

        <g opacity={numIn} transform={`translate(${m} ${baseline}) scale(${pulse}) translate(${-m} ${-baseline}) translate(0 ${(1 - numIn) * 40 * u})`}>
          <text x={m} y={baseline} fontFamily={fam} fontWeight={700} fontSize={S} letterSpacing={-0.02 * S} fill={p.ink} style={{fontVariantNumeric: 'tabular-nums'}}>
            {p.prefix && (
              <tspan fontSize={S * AFF} fill={p.accent} dy={-S * 0.2} letterSpacing={0}>
                {p.prefix}
              </tspan>
            )}
            <tspan dy={p.prefix ? S * 0.2 : 0}>{numStr}</tspan>
            {p.suffix && (
              <tspan fontSize={S * AFF} fill={p.accent} dy={-S * 0.2} letterSpacing={0}>
                {p.suffix}
              </tspan>
            )}
          </text>
        </g>

        <rect x={m} y={baseline + 40 * u} width={barW * barIn} height={9 * u} rx={4.5 * u} fill={p.accent} />

        <g opacity={labIn} transform={`translate(0 ${(1 - labIn) * 24 * u})`}>
          {labelBox.lines.map((ln, i) => (
            <text key={i} x={m} y={baseline + 140 * u + i * labelBox.lineH} fontFamily={bodyFont} fontWeight={600} fontSize={labelBox.size} fill={p.ink} opacity={0.92}>
              {ln}
            </text>
          ))}
        </g>

        {p.source && (
          <g opacity={srcIn}>
            <line x1={m} x2={m + maxW * srcIn} y1={h - m * 0.78 - srcSize * 1.7} y2={h - m * 0.78 - srcSize * 1.7} stroke={withAlpha(p.ink, 0.22)} strokeWidth={2 * u} />
            <text x={m} y={h - m * 0.78} fontFamily={bodyFont} fontWeight={400} fontSize={srcSize} fill={p.ink} opacity={0.55}>
              {p.source}
            </text>
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

export const bigStatSlide = defineMotion<Props>({
  id: 'big-stat-slide',
  title: 'Big stat slide',
  category: 'text',
  description: 'Keynote one-number slide: an eyebrow tag, a huge number counting up with accent prefix/suffix, an accent rule drawing under it, a one-line label and a source footnote.',
  source: ['original (round 3, presentation slides)'],
  useFor: 'The "one number" beat of a pitch or keynote deck, KPI reveals, annual-report highlights, data-led social posts and explainer videos that need a headline statistic with its source.',
  durationInFrames: 180,
  defaultProps: {
    value: 87,
    decimals: 0,
    prefix: '',
    suffix: '%',
    thousands: true,
    label: 'of customers say onboarding is faster than the tools they used before',
    eyebrow: 'Key result',
    source: 'Source: sample customer survey, n = 1,200 (2025)',
    background: '#10141C',
    ink: '#F4F1EA',
    accent: '#FF6A3D',
    fontFamily: 'grotesk',
    ring: true,
    countFrames: 70,
    startAt: 0,
  },
  propDocs: {
    value: 'the number to count up to',
    decimals: 'decimal places shown',
    prefix: 'small accent text before the number (e.g. "$", "+")',
    suffix: 'small accent text after the number (e.g. "%", "x", "M")',
    thousands: 'use thousands separators',
    label: 'sentence under the number (wraps, shrinks to fit)',
    eyebrow: 'small tag above the number (empty to hide)',
    source: 'footnote at the bottom (empty to hide)',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'rule, tag, prefix/suffix and ring colour',
    fontFamily: 'number font: sans | serif | display | grotesk | rounded | instrument | mono',
    ring: 'faint decorative rings behind the number',
    countFrames: 'frames the count-up takes',
    startAt: 'frame the slide begins',
  },
  component: BigStatSlide,
  tags: ['slide', 'keynote', 'presentation', 'stat', 'number', 'kpi', 'metric', 'counter', 'pitch', 'deck', 'big-number', 'overlay'],
});
