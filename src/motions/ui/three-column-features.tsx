import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgOf} from '../../core/r3-social';
import {ClipImage, Icon, ICON_NAMES, backOut, famOf, fitLine, iconFor, mixHex, slideFont, solidBg, withAlpha, wrapFit} from '../../core/r3-slide-kit';

/**
 * Keynote feature columns: a headline over three (or 2-4) cards, each with a drawing line icon (or your own image), a heading
 * and a short text. Landscape/square lay the cards out as columns; portrait stacks them as rows.
 */
type Col = {icon?: string; heading: string; text?: string; src?: string};
type Props = {
  title: string;
  subtitle: string;
  columns: Col[];
  cardStyle: 'cards' | 'open';
  background: string;
  cardColor: string;
  ink: string;
  accent: string;
  fontFamily: string;
  stagger: number;
  startAt: number;
};

const DEFAULT_COLS: Col[] = [
  {icon: 'bolt', heading: 'Fast by default', text: 'Pages and reports load in milliseconds, so nobody waits on the tool.'},
  {icon: 'shield', heading: 'Secure and private', text: 'Your data stays encrypted and under your control, always.'},
  {icon: 'users', heading: 'Built for teams', text: 'Share, comment and decide together without leaving the page.'},
];

const ThreeColumnFeatures: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = slideFont(p.fontFamily, 'grotesk');
  const sans = famOf('sans');
  const cols = (Array.isArray(p.columns) && p.columns.length ? p.columns : DEFAULT_COLS).slice(0, 4);
  const n = cols.length;
  const bg = solidBg(p.background, '#ffffff');
  const card = p.cardColor === 'auto' ? mixHex(bg, p.ink, 0.07) : p.cardColor;
  const open = p.cardStyle === 'open';
  const m = (portrait ? 64 : 110) * u;
  const gap = (portrait ? 26 : 34) * u;

  const titleIn = prog(f, 0, 24, ease.out);
  const titleSize = fitLine(p.title, font, (portrait ? 84 : 84) * u, w - 2 * m);
  const subSize = fitLine(p.subtitle, 'sans', 34 * u, w - 2 * m);
  const titleY = (portrait ? 170 : 148) * u;
  const gridTop = titleY + (p.subtitle ? subSize * 1.7 : 0) + (portrait ? 90 : 84) * u;
  const gridBottom = h - (portrait ? 80 : 90) * u;
  const gridH = gridBottom - gridTop;
  const gridW = w - 2 * m;

  const st = Math.max(1, p.stagger);
  const cw = portrait ? gridW : (gridW - gap * (n - 1)) / n;
  const dL = Math.min(150 * u, cw * 0.42);
  const needed = cols.map((c) => {
    const head = fitLine(c.heading, 'sans', 44 * u, cw - 60 * u);
    const tb = wrapFit(c.text || '', 'sans', 30 * u, cw - 72 * u, 330 * u, 1.38, 18 * u);
    return 60 * u + dL + 60 * u + head * 0.2 + 56 * u + Math.max(0, tb.lines.length - 1) * tb.lineH + tb.size + 54 * u;
  });
  const chh = portrait ? Math.min((gridH - gap * (n - 1)) / n, 300 * u) : Math.min(gridH, Math.max(380 * u, ...needed));
  const gridUsed = portrait ? chh * n + gap * (n - 1) : chh;
  const offY = Math.max(0, (gridH - gridUsed) / 2) * (portrait ? 0.6 : open ? 0.95 : 0.5);

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        <g opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * 24 * u})`}>
          <text x={w / 2} y={titleY} textAnchor="middle" fontFamily={famOf(font)} fontWeight={700} fontSize={titleSize} fill={p.ink}>
            {p.title}
          </text>
          {p.subtitle && (
            <text x={w / 2} y={titleY + subSize * 1.7} textAnchor="middle" fontFamily={sans} fontWeight={400} fontSize={subSize} fill={withAlpha(p.ink, 0.6)}>
              {p.subtitle}
            </text>
          )}
          <rect x={w / 2 - 50 * u * titleIn} y={titleY + (p.subtitle ? subSize * 1.7 + 30 * u : 36 * u)} width={100 * u * titleIn} height={7 * u} rx={3.5 * u} fill={p.accent} />
        </g>

        {cols.map((c, i) => {
          const s0 = 16 + i * st * 3;
          const a = prog(f, s0, s0 + 22, ease.out);
          const pop = backOut(prog(f, s0, s0 + 24, ease.linear), 1.3);
          const draw = prog(f, s0 + 10, s0 + 44, ease.out);
          const x = portrait ? m : m + i * (cw + gap);
          const y = gridTop + offY + (portrait ? i * (chh + gap) : 0);
          const icon = iconFor(c.icon, i);
          const tint = mixHex(bg, p.accent, 0.2);
          if (!portrait) {
            const d = Math.min(150 * u, cw * 0.42);
            const icx = x + cw / 2;
            const icy = y + 60 * u + d / 2;
            const head = fitLine(c.heading, 'sans', 44 * u, cw - 60 * u);
            const hy = icy + d / 2 + 60 * u + head * 0.2;
            const tb = wrapFit(c.text || '', 'sans', 30 * u, cw - 72 * u, 330 * u, 1.38, 18 * u);
            return (
              <g key={i} opacity={a} transform={`translate(0 ${(1 - pop) * 60 * u})`}>
                {!open && <rect x={x} y={y + 8 * u} width={cw} height={chh} rx={32 * u} fill="#000" opacity={0.1} />}
                {!open && <rect x={x} y={y} width={cw} height={chh} rx={32 * u} fill={card} stroke={withAlpha(p.ink, 0.08)} strokeWidth={2 * u} />}
                {open && i > 0 && <line x1={x - gap / 2} x2={x - gap / 2} y1={y + 30 * u} y2={y + chh - 30 * u} stroke={withAlpha(p.ink, 0.14)} strokeWidth={2 * u} />}
                <circle cx={icx} cy={icy} r={d / 2} fill={tint} />
                <circle cx={icx} cy={icy} r={d / 2 + 9 * u} fill="none" stroke={p.accent} strokeWidth={3 * u} opacity={0.35 * draw} />
                {c.src ? <ClipImage id={`three-column-features-${i}`} src={c.src} x={icx - d * 0.34} y={icy - d * 0.34} w={d * 0.68} h={d * 0.68} fit="meet" /> : <Icon name={icon} cx={icx} cy={icy} size={d * 0.52} color={p.accent} sw={1.8} draw={draw} />}
                <text x={icx} y={hy} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={head} fill={p.ink}>
                  {c.heading}
                </text>
                {tb.lines.map((ln, j) => (
                  <text key={j} x={icx} y={hy + 56 * u + j * tb.lineH} textAnchor="middle" fontFamily={sans} fontWeight={400} fontSize={tb.size} fill={withAlpha(p.ink, 0.72)}>
                    {ln}
                  </text>
                ))}
              </g>
            );
          }
          // portrait: row layout
          const d = Math.min(150 * u, chh * 0.56);
          const icx = x + 44 * u + d / 2;
          const icy = y + chh / 2;
          const tx = icx + d / 2 + 40 * u;
          const head = fitLine(c.heading, 'sans', 42 * u, x + cw - 40 * u - tx);
          const tb = wrapFit(c.text || '', 'sans', 30 * u, x + cw - 40 * u - tx, chh - 2 * 34 * u - head * 1.4, 1.34, 18 * u);
          const blockH = head * 1.4 + tb.lines.length * tb.lineH;
          const by = y + (chh - blockH) / 2;
          return (
            <g key={i} opacity={a} transform={`translate(${(1 - pop) * 80 * u} 0)`}>
              {!open && <rect x={x} y={y + 8 * u} width={cw} height={chh} rx={30 * u} fill="#000" opacity={0.1} />}
              {!open && <rect x={x} y={y} width={cw} height={chh} rx={30 * u} fill={card} stroke={withAlpha(p.ink, 0.08)} strokeWidth={2 * u} />}
              {open && i > 0 && <line x1={x} x2={x + cw} y1={y - gap / 2} y2={y - gap / 2} stroke={withAlpha(p.ink, 0.14)} strokeWidth={2 * u} />}
              <circle cx={icx} cy={icy} r={d / 2} fill={tint} />
              {c.src ? <ClipImage id={`three-column-features-${i}`} src={c.src} x={icx - d * 0.34} y={icy - d * 0.34} w={d * 0.68} h={d * 0.68} fit="meet" /> : <Icon name={icon} cx={icx} cy={icy} size={d * 0.52} color={p.accent} sw={1.8} draw={draw} />}
              <text x={tx} y={by + head * 0.95} fontFamily={sans} fontWeight={800} fontSize={head} fill={p.ink}>
                {c.heading}
              </text>
              {tb.lines.map((ln, j) => (
                <text key={j} x={tx} y={by + head * 1.4 + (j + 0.8) * tb.lineH} fontFamily={sans} fontWeight={400} fontSize={tb.size} fill={withAlpha(p.ink, 0.72)}>
                  {ln}
                </text>
              ))}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const threeColumnFeatures = defineMotion<Props>({
  id: 'three-column-features',
  title: 'Three-column features',
  category: 'ui',
  description: 'Keynote feature slide: a headline over three cards (2-4 supported), each with a line icon that draws on (or your own image), a heading and a short text; columns in landscape, stacked rows in portrait.',
  source: ['original (round 3, presentation slides)'],
  useFor: 'Feature and benefit slides, "why us" and pillars of a plan, product overviews, service lists and three-point summaries for decks, promos and landing pages.',
  durationInFrames: 180,
  defaultProps: {
    title: 'Why teams choose us',
    subtitle: 'Three reasons it sticks',
    columns: DEFAULT_COLS,
    cardStyle: 'cards',
    background: '#0F1A2A',
    cardColor: 'auto',
    ink: '#F1F5FB',
    accent: '#5EC8FF',
    fontFamily: 'grotesk',
    stagger: 4,
    startAt: 0,
  },
  propDocs: {
    title: 'headline above the columns',
    subtitle: 'line under the headline (empty to hide)',
    columns: `array of {icon?, heading, text?, src?} — 2 to 4 entries; icon is one of ${ICON_NAMES.join(' | ')}; src overrides the icon with your own image`,
    cardStyle: 'cards (filled cards) | open (no card, thin dividers)',
    background: 'frame colour, or "transparent" to overlay content',
    cardColor: 'card fill, or "auto" (tinted from the background)',
    ink: 'text colour',
    accent: 'icon and underline colour',
    fontFamily: 'headline font: sans | serif | display | grotesk | rounded | instrument | mono',
    stagger: 'beat spacing between columns (frames x 3)',
    startAt: 'frame the slide begins',
  },
  component: ThreeColumnFeatures,
  tags: ['slide', 'keynote', 'presentation', 'features', 'benefits', 'columns', 'icons', 'three-column', 'pillars', 'services', 'cards', 'deck', 'overlay'],
});
