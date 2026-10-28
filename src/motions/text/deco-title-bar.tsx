// Adapted from lemo-opuscar/styles/art-deco/demo/engine/type.js titleBar/yearBadge + deco.js sunburst/archFrame (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, lerp, prog} from '../../core/ease';
import {useSafeId} from '../../core/image-kit';
import {GLine, GOLD, GoldGradient, eio3, lf, mixC, seg} from '../../core/r2-la1-kit';
import {Sparkle} from '../../core/shapes';
import {Svg, useStage} from '../../core/stage';
import {estWidth} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Art-deco title card that unfolds from one centre point on a single vertical axis: point → hairline →
 * stepped lacquer bar with a double gold keyline opens symmetrically → title rises → wings with speed lines
 * + sparkle; behind it a stepped arch draws on over a 72-ray sunburst, a diamond year badge lands below and
 * a hot specular sheen slides across all the gold on the hit.
 */
type Props = {
  title: string;
  subtitle: string;
  badge: string;
  caption: string;
  rays: number;
  steps: number;
  accent: string;
  background: string;
  sheenAt: number;
};

const DecoTitle: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const id = useSafeId('decobar');
  const cx = w / 2;
  const cy = h * (portrait ? 0.42 : 0.4);
  const S = portrait ? u * 1.0 : u;
  // bar size from the title
  const tSize0 = (portrait ? 118 : 120) * S;
  const tw = estWidth(p.title.toUpperCase(), tSize0, 'display', 0.08) * 1.02;
  const maxBar = w * (portrait ? 0.84 : 0.56);
  const tSize = tw + 160 * S > maxBar ? (tSize0 * (maxBar - 160 * S)) / tw : tSize0;
  const barW = Math.min(maxBar, Math.max(tw * (tSize / tSize0) + 170 * S, 560 * S));
  const barH = tSize * 1.62;
  const step = 22 * S;

  // timeline
  const pt = eio3(seg(frame, 0, 8));
  const hair = eio3(seg(frame, 6, 18));
  const open = eio3(seg(frame, 16, 30));
  const rise = ease.out(seg(frame, 26, 42));
  const sub = ease.out(seg(frame, 34, 48));
  const wings = eio3(seg(frame, 40, 56));
  const arch = seg(frame, 8, 52);
  const rayIn = prog(frame, 0, 36, ease.out);
  const badgeIn = ease.back(seg(frame, 52, 66));
  const capIn = ease.out(seg(frame, 62, 78));
  const sheen = lerp(-0.2, 1.2, prog(frame, p.sheenAt, p.sheenAt + 18, ease.inOut));
  const spark = Math.sin(Math.PI * seg(frame, p.sheenAt + 10, p.sheenAt + 30));
  const Z = lerp(1, 1.035, prog(frame, 30, 180, ease.sine));

  const hw = (barW / 2) * open + (barW / 2) * 0.02;
  const hh = (barH / 2) * open;
  // stepped-end bar polygon
  const bar = (W: number, H: number) => {
    const s = Math.min(step, H * 0.5);
    return `M${cx - W + 2 * s} ${cy - H} L${cx + W - 2 * s} ${cy - H} L${cx + W - 2 * s} ${cy - H + s} L${cx + W - s} ${cy - H + s} L${cx + W - s} ${cy - H + 2 * s} L${cx + W} ${cy - H + 2 * s} L${cx + W} ${cy + H - 2 * s} L${cx + W - s} ${cy + H - 2 * s} L${cx + W - s} ${cy + H - s} L${cx + W - 2 * s} ${cy + H - s} L${cx + W - 2 * s} ${cy + H} L${cx - W + 2 * s} ${cy + H} L${cx - W + 2 * s} ${cy + H - s} L${cx - W + s} ${cy + H - s} L${cx - W + s} ${cy + H - 2 * s} L${cx - W} ${cy + H - 2 * s} L${cx - W} ${cy - H + 2 * s} L${cx - W + s} ${cy - H + 2 * s} L${cx - W + s} ${cy - H + s} L${cx - W + 2 * s} ${cy - H + s} Z`;
  };
  // stepped arch (ziggurat) frame above the bar
  const archD = (k: number) => {
    const aw = barW * (0.36 - k * 0.07);
    const top = cy - barH * 0.5 - (portrait ? 400 : 250) * S + k * 40 * S;
    const st = 30 * S;
    return `M${cx - aw} ${cy - barH * 0.55} L${cx - aw} ${top + st * 3} L${cx - aw + st} ${top + st * 3} L${cx - aw + st} ${top + st * 2} L${cx - aw + 2 * st} ${top + st * 2} L${cx - aw + 2 * st} ${top + st} L${cx - aw * 0.42} ${top + st} L${cx - aw * 0.42} ${top} L${cx + aw * 0.42} ${top} L${cx + aw * 0.42} ${top + st} L${cx + aw - 2 * st} ${top + st} L${cx + aw - 2 * st} ${top + st * 2} L${cx + aw - st} ${top + st * 2} L${cx + aw - st} ${top + st * 3} L${cx + aw} ${top + st * 3} L${cx + aw} ${cy - barH * 0.55}`;
  };
  const by = cy + barH * 0.5 + (portrait ? 250 : 175) * S;
  const bs = (portrait ? 110 : 96) * S * badgeIn;
  const half = Math.ceil(p.badge.length / 2);
  const rayOrigin = cy + barH * 0.3;

  return (
    <AbsoluteFill style={{background: p.background}}>
      <AbsoluteFill style={{transform: `scale(${Z})`, transformOrigin: `${cx}px ${cy}px`}}>
        <Svg>
          <defs>
            <radialGradient id={`${id}-bg`} cx="50%" cy={`${(cy / h) * 100}%`} r="75%">
              <stop offset="0" stopColor={mixC(p.background, '#3b2c12', 0.5)} />
              <stop offset="0.55" stopColor={mixC(p.background, '#10231f', 0.35)} />
              <stop offset="1" stopColor={p.background} />
            </radialGradient>
            <GoldGradient id={`${id}-g`} sheen={sheen} x1={0} y1={0} x2={1} y2={0.3} />
            <GoldGradient id={`${id}-gu`} sheen={sheen} units="userSpaceOnUse" x1={cx - barW * 0.7} y1={cy - barH} x2={cx + barW * 0.7} y2={cy + barH * 0.6} />
            <radialGradient id={`${id}-ray`} cx={cx} cy={rayOrigin} r={Math.hypot(w, h) * 0.6} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={GOLD.light} stopOpacity={0.3} />
              <stop offset="0.5" stopColor={GOLD.base} stopOpacity={0.1} />
              <stop offset="1" stopColor={GOLD.base} stopOpacity={0} />
            </radialGradient>
            <linearGradient id={`${id}-lac`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1a140c" />
              <stop offset="0.5" stopColor="#060504" />
              <stop offset="1" stopColor="#0f0b07" />
            </linearGradient>
            <filter id={`${id}-glow`} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation={3 * S} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={`${id}-tc`}>
              <path d={bar(hw, hh)} />
            </clipPath>
          </defs>
          <rect width={w} height={h} fill={`url(#${id}-bg)`} />
          {/* 72-ray sunburst, alternate wedges */}
          <g opacity={rayIn}>
            {Array.from({length: p.rays}, (_, i) => {
              if (i % 2) return null;
              const a0 = (i / p.rays) * Math.PI * 2 + frame * 0.0006;
              const a1 = a0 + (Math.PI * 2) / p.rays;
              const R = Math.hypot(w, h);
              return <path key={i} d={`M${cx} ${rayOrigin} L${cx + Math.cos(a0) * R} ${rayOrigin + Math.sin(a0) * R} L${cx + Math.cos(a1) * R} ${rayOrigin + Math.sin(a1) * R} Z`} fill={`url(#${id}-ray)`} />;
            })}
          </g>
          {/* stepped arch frame drawing on */}
          {Array.from({length: p.steps}, (_, k) => (
            <GLine key={k} d={archD(k)} grad={`${id}-gu`} w={(k === 0 ? 3 : 1.8) * S} draw={clamp(arch * 1.35 - k * 0.12)} />
          ))}
          {/* wings with speed lines */}
          {wings > 0 &&
            [-1, 1].map((sd) =>
              [0, 1, 2, 3].map((k) => {
                const y = cy - barH * 0.22 + k * barH * 0.15;
                const x0 = cx + sd * (barW / 2 + 22 * S);
                const len = (portrait ? 0.4 : 0.55) * (barW * (1 - k * 0.2)) * wings;
                return <GLine key={sd + '-' + k} d={`M${x0} ${y} L${x0 + sd * len} ${y}`} grad={`${id}-gu`} w={(k === 1 ? 3.2 : 1.6) * S} />;
              }),
            )}
          {/* centre point → hairline */}
          {pt > 0 && open < 1 && <circle cx={cx} cy={cy} r={6 * S * (1 - hair * 0.6)} fill={GOLD.spec} opacity={1 - open} filter={`url(#${id}-glow)`} />}
          {hair > 0 && open < 0.98 && <GLine d={`M${cx - (barW / 2) * hair} ${cy} L${cx + (barW / 2) * hair} ${cy}`} grad={`${id}-gu`} w={2.4 * S} glow={`${id}-glow`} />}
          {/* lacquer bar + double keyline */}
          {open > 0 && (
            <g>
              <path d={bar(hw, hh)} fill={`url(#${id}-lac)`} opacity={0.94} />
              <GLine d={bar(hw, hh)} grad={`${id}-gu`} w={2.6 * S} />
              {hh > 16 * S && <path d={bar(Math.max(0, hw - 10 * S), Math.max(0, hh - 10 * S))} fill="none" stroke={`url(#${id}-gu)`} strokeWidth={1.2 * S} />}
            </g>
          )}
          {/* title rises inside the bar */}
          {rise > 0 && (
            <g clipPath={`url(#${id}-tc)`}>
              <text
                x={cx}
                y={cy + tSize * 0.36 + (1 - rise) * tSize * 0.9}
                textAnchor="middle"
                fontFamily={lf.deco}
                fontSize={tSize}
                letterSpacing={tSize * 0.08}
                fill={`url(#${id}-gu)`}
                stroke={GOLD.shadow}
                strokeWidth={1 * S}
              >
                {p.title.toUpperCase()}
              </text>
            </g>
          )}
          {sub > 0 && (
            <text
              x={cx}
              y={cy + barH * 0.5 + 64 * S + (1 - sub) * 16 * S}
              textAnchor="middle"
              fontFamily={lf.josefin}
              fontWeight={600}
              fontSize={(portrait ? 36 : 32) * S}
              letterSpacing={(portrait ? 9 : 12) * S}
              fill={GOLD.light}
              opacity={sub}
            >
              {p.subtitle.toUpperCase()}
            </text>
          )}
          {/* diamond year badge with rays */}
          {badgeIn > 0.01 && (
            <g>
              {Array.from({length: 16}, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                return <line key={i} x1={cx + Math.cos(a) * bs * 0.82} y1={by + Math.sin(a) * bs * 0.82} x2={cx + Math.cos(a) * bs * (i % 2 ? 1.12 : 1.32)} y2={by + Math.sin(a) * bs * (i % 2 ? 1.12 : 1.32)} stroke={GOLD.base} strokeWidth={1.4 * S} opacity={0.8} />;
              })}
              <path d={`M${cx} ${by - bs * 0.72} L${cx + bs * 0.72} ${by} L${cx} ${by + bs * 0.72} L${cx - bs * 0.72} ${by} Z`} fill="#0a0806" stroke={`url(#${id}-g)`} strokeWidth={2.4 * S} />
              <path d={`M${cx - bs * 0.32} ${by} L${cx + bs * 0.32} ${by}`} stroke={GOLD.base} strokeWidth={1.2 * S} />
              <text x={cx} y={by - bs * 0.08} textAnchor="middle" fontFamily={lf.italiana} fontSize={bs * 0.34} fill={GOLD.light}>
                {p.badge.slice(0, half)}
              </text>
              <text x={cx} y={by + bs * 0.36} textAnchor="middle" fontFamily={lf.italiana} fontSize={bs * 0.34} fill={GOLD.light}>
                {p.badge.slice(half)}
              </text>
            </g>
          )}
          {p.caption && capIn > 0 && (
            <text x={cx} y={by + bs * 1.3 + 56 * S} textAnchor="middle" fontFamily={lf.poiret} fontSize={(portrait ? 34 : 30) * S} letterSpacing={14 * S} fill={GOLD.light} opacity={capIn}>
              {p.caption.toUpperCase()}
            </text>
          )}
          {/* burgundy accent jewels at the bar ends */}
          {open > 0.9 &&
            [-1, 1].map((sd) => <path key={sd} d={`M${cx + sd * (hw + 14 * S)} ${cy - 12 * S} L${cx + sd * (hw + 26 * S)} ${cy} L${cx + sd * (hw + 14 * S)} ${cy + 12 * S} L${cx + sd * (hw + 2 * S)} ${cy} Z`} fill={p.accent} stroke={GOLD.base} strokeWidth={1.4 * S} />)}
          {spark > 0 && <Sparkle x={cx + barW * 0.36} y={cy - barH * 0.42} size={46 * S * spark} color={GOLD.spec} rotate={frame * 2} />}
          {spark > 0 && <Sparkle x={cx - barW * 0.3} y={cy + barH * 0.4} size={30 * S * spark} color={GOLD.spec} rotate={-frame * 2} />}
        </Svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const decoTitleBar = defineMotion<Props>({
  id: 'deco-title-bar',
  title: 'Art deco title bar',
  category: 'text',
  description:
    'An art-deco title card unfolding from a centre point: hairline → stepped lacquer bar with double gold keyline → title rises in Limelight gold → wings with speed lines, over a stepped arch and a 72-ray sunburst, with a diamond year badge and a specular sheen across the gold.',
  source: ['lemo-opuscar styles/art-deco demo/engine/type.js titleBar, yearBadge; engine/deco.js goldGrad, gline, sunburst, archFrame (MIT, LemoLab)', 'analysis/sources/lemo-styles-a.md §2 deco-title-bar'],
  useFor: 'Openers and end cards for galas, launches, 1920s themes, hotel / luxury brands and New Year countdowns.',
  durationInFrames: 150,
  defaultProps: {
    title: 'Midnight',
    subtitle: 'at the Northwind Hotel',
    badge: '2026',
    caption: "New Year's Eve",
    rays: 72,
    steps: 3,
    accent: '#8E1B2E',
    background: '#0d0b09',
    sheenAt: 84,
  },
  propDocs: {
    title: 'main title (set in Limelight caps; long titles shrink to fit the bar)',
    subtitle: 'tracked caps line under the bar',
    badge: 'text in the diamond badge, split in two halves (e.g. "2026" → 20 / 26)',
    caption: 'thin tracked caps line under the badge (empty = none)',
    rays: 'sunburst ray count (alternate wedges are drawn)',
    steps: 'stepped arch frames drawn above the bar',
    accent: 'burgundy jewel accent at the bar ends',
    background: 'warm lacquer black',
    sheenAt: 'frame the specular sheen sweeps across the gold',
  },
  component: DecoTitle,
  tags: ['art deco', 'gatsby', '1920s', 'gold', 'title', 'title card', 'opener', 'end card', 'luxury', 'gala', 'hotel', 'new year', 'sunburst', 'badge', 'elegant', 'premium'],
});
