import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgOf} from '../../core/r3-social';
import {asObjs, famOf, fitLine, mixHex, slideFont, solidBg, withAlpha, wrapFit} from '../../core/r3-slide-kit';

/**
 * Keynote agenda slide: a big title column and a numbered list; a highlight pill glides down the list so the current item
 * is bright and the rest dim. Items are plain strings or {title, note}.
 */
type Item = {title: string; note?: string};
type Props = {
  title: string;
  eyebrow: string;
  items: (Item | string)[];
  activeIndex: number;
  holdFrames: number;
  background: string;
  ink: string;
  accent: string;
  fontFamily: string;
  startAt: number;
};

const DEFAULT_ITEMS: Item[] = [
  {title: 'Where we are today', note: 'Context and goals'},
  {title: 'What we learned', note: 'Findings from the pilot'},
  {title: 'The plan', note: 'Scope, owners, timing'},
  {title: 'Budget and resources', note: 'What it takes'},
  {title: 'Decisions and next steps', note: 'What we need from you'},
];

const AgendaListSlide: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = slideFont(p.fontFamily, 'grotesk');
  const fam = famOf(font);
  const sans = famOf('sans');
  const mono = famOf('mono');
  const items = asObjs<Item>(p.items, 'title', DEFAULT_ITEMS).slice(0, 9);
  const n = items.length;
  const bg = solidBg(p.background, '#ffffff');
  const m = (portrait ? 84 : 130) * u;

  // layout columns
  const colX = portrait ? m : w * 0.45;
  const colW = w - m - colX;
  const listTop = portrait ? h * 0.36 : m * 0.9;
  const listBottom = h - (portrait ? m : m * 0.9);
  const rowH = Math.min((portrait ? 168 : 170) * u, (listBottom - listTop) / n);
  const listH = rowH * n;
  const y0 = portrait ? listTop : (h - listH) / 2;

  // highlight position (fractional row index)
  const E = 30 + n * 4;
  const hold = Math.max(16, p.holdFrames);
  const move = Math.min(12, hold - 4);
  const ft = Math.max(0, f - E);
  const k = Math.min(n - 1, Math.floor(ft / hold));
  const within = ft - k * hold;
  const auto = k + (k < n - 1 ? ease.inOut(clamp((within - (hold - move)) / move)) : 0);
  const pos = p.activeIndex >= 0 ? Math.min(n - 1, p.activeIndex) : auto;
  const pillIn = prog(f, E - 14, E + 6, ease.out);

  // title column
  const titleSize = fitLine(p.title.toUpperCase(), font, (portrait ? 150 : 150) * u, portrait ? w - 2 * m : colX - m - 50 * u);
  const titleIn = prog(f, 0, 26, ease.out);
  const counter = `${String(Math.round(pos) + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        {/* title column */}
        <g opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * 30 * u})`}>
          {p.eyebrow && (
            <text x={m} y={portrait ? h * 0.11 : h * 0.34} fontFamily={sans} fontWeight={800} fontSize={28 * u} letterSpacing={6 * u} fill={p.accent}>
              {p.eyebrow.toUpperCase()}
            </text>
          )}
          <text x={m} y={portrait ? h * 0.11 + titleSize * 1.05 + 20 * u : h * 0.34 + titleSize * 1.1 + 12 * u} fontFamily={fam} fontWeight={700} fontSize={titleSize} letterSpacing={titleSize * 0.01} fill={p.ink}>
            {p.title.toUpperCase()}
          </text>
          <rect x={m} y={portrait ? h * 0.11 + titleSize * 1.05 + 70 * u : h * 0.34 + titleSize * 1.1 + 62 * u} width={120 * u * titleIn} height={8 * u} rx={4 * u} fill={p.accent} />
          <text x={m} y={portrait ? h * 0.11 + titleSize * 1.05 + 170 * u : h * 0.34 + titleSize * 1.1 + 170 * u} fontFamily={mono} fontWeight={700} fontSize={32 * u} fill={withAlpha(p.ink, 0.55)}>
            {counter}
          </text>
        </g>

        {/* divider (landscape) */}
        {!portrait && <line x1={colX - 60 * u} x2={colX - 60 * u} y1={y0} y2={y0 + listH * titleIn} stroke={withAlpha(p.ink, 0.16)} strokeWidth={2 * u} />}

        {/* highlight pill */}
        <g opacity={pillIn}>
          <rect x={colX - 24 * u} y={y0 + pos * rowH + 6 * u} width={colW + 48 * u} height={rowH - 12 * u} rx={22 * u} fill={mixHex(bg, p.accent, 0.12)} />
          <rect x={colX - 24 * u} y={y0 + pos * rowH + 6 * u + (rowH - 12 * u) * 0.18} width={8 * u} height={(rowH - 12 * u) * 0.64} rx={4 * u} fill={p.accent} />
        </g>

        {/* rows */}
        {items.map((it, i) => {
          const a = prog(f, 8 + i * 4, 30 + i * 4, ease.out);
          const hl = clamp(1 - Math.abs(pos - i)) * pillIn;
          const cy = y0 + i * rowH + rowH / 2;
          const tSize = Math.min(52 * u, rowH * 0.34);
          const numSize = Math.min(40 * u, rowH * 0.28);
          const tx = colX + numSize * 2.6 + 12 * u;
          const noteSize = tSize * 0.58;
          const has = !!it.note;
          const box = wrapFit(it.title, 'sans', tSize, colW - (tx - colX) - 10 * u, rowH * (has ? 0.5 : 0.8), 1.15, 20 * u);
          const lift = 14 * u * hl;
          const opacity = a * (0.4 + 0.6 * hl);
          return (
            <g key={i} opacity={opacity} transform={`translate(${(1 - a) * 50 * u + lift} 0)`}>
              <text x={colX + 6 * u} y={cy + numSize * 0.36} fontFamily={mono} fontWeight={700} fontSize={numSize} fill={mixHex(p.ink, p.accent, hl)}>
                {String(i + 1).padStart(2, '0')}
              </text>
              {box.lines.map((ln, j) => (
                <text key={j} x={tx} y={(has ? cy - rowH * 0.06 - (box.lines.length - 1) * box.lineH : cy + tSize * 0.34 - ((box.lines.length - 1) * box.lineH) / 2) + j * box.lineH} fontFamily={sans} fontWeight={hl > 0.5 ? 800 : 600} fontSize={box.size} fill={p.ink}>
                  {ln}
                </text>
              ))}
              {has && (
                <text x={tx} y={cy + rowH * 0.26} fontFamily={sans} fontWeight={400} fontSize={noteSize} fill={p.ink} opacity={0.6}>
                  {it.note}
                </text>
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const agendaListSlide = defineMotion<Props>({
  id: 'agenda-list-slide',
  title: 'Agenda list slide',
  category: 'text',
  description: 'Keynote agenda slide: big title column and a numbered list; a highlight pill glides item to item so the current topic is bright and the rest dim.',
  source: ['original (round 3, presentation slides)'],
  useFor: 'Meeting and webinar agendas, chapter lists, course outlines, table-of-contents beats and "what we will cover" slides in decks and videos.',
  durationInFrames: 240,
  defaultProps: {
    title: 'Agenda',
    eyebrow: 'Today',
    items: DEFAULT_ITEMS,
    activeIndex: -1,
    holdFrames: 36,
    background: '#101A2B',
    ink: '#F2F5FA',
    accent: '#4FD1C5',
    fontFamily: 'grotesk',
    startAt: 0,
  },
  propDocs: {
    title: 'slide title (left column / top)',
    eyebrow: 'small tag above the title (empty to hide)',
    items: 'array of strings or {title, note?} — up to 9',
    activeIndex: '-1 = highlight steps through every item; 0..n-1 = hold the highlight on that item',
    holdFrames: 'frames each item stays highlighted',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'numbers, pill and rule colour',
    fontFamily: 'title font: sans | serif | display | grotesk | rounded | instrument | mono',
    startAt: 'frame the slide begins',
  },
  component: AgendaListSlide,
  tags: ['slide', 'keynote', 'presentation', 'agenda', 'list', 'outline', 'table-of-contents', 'steps', 'numbered', 'highlight', 'deck', 'overlay'],
});
