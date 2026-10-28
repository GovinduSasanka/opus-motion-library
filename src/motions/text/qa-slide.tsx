import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgOf} from '../../core/r3-social';
import {asObjs, backOut, famOf, hexLum, mixHex, slideFont, solidBg, withAlpha, wrapFit} from '../../core/r3-slide-kit';

/**
 * Keynote Q&A slide: a question appears with an accent "Q" badge, three thinking dots pulse in the answer card, then the answer
 * reveals word by word. Several question/answer pairs play one after another.
 */
type QA = {question: string; answer: string};
type Props = {
  items: (QA | string)[];
  heading: string;
  qLabel: string;
  aLabel: string;
  holdFrames: number;
  background: string;
  cardColor: string;
  ink: string;
  accent: string;
  fontFamily: string;
  startAt: number;
};

const DEFAULT_ITEMS: QA[] = [
  {question: 'How long does it take to get started?', answer: 'Most teams are up and running in under an hour. Import your data, invite your colleagues and you are done.'},
  {question: 'What happens to our data if we leave?', answer: 'You can export everything in open formats at any time, and we delete your copy within thirty days on request.'},
];

const QaSlide: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = slideFont(p.fontFamily, 'grotesk');
  const sans = famOf('sans');
  const items = asObjs<QA>(p.items, 'question', DEFAULT_ITEMS).slice(0, 8);
  const n = items.length;
  const bg = solidBg(p.background, '#ffffff');
  const card = p.cardColor === 'auto' ? mixHex(bg, p.ink, 0.08) : p.cardColor;
  const L = Math.max(90, p.holdFrames);
  const idx = Math.min(n - 1, Math.floor(f / L));
  const t = f - idx * L;
  const last = idx === n - 1;
  const it = items[idx];
  const m = (portrait ? 70 : 120) * u;

  // exit of the previous pair is handled by this pair's entrance; the pair itself leaves in its last 14 frames
  const exit = last ? 0 : prog(t, L - 14, L, ease.in);
  const slide = exit * -60 * u;
  const alpha = 1 - exit;

  const badge = (portrait ? 78 : 84) * u;
  const qX = m + badge + 34 * u;
  const qW = w - m - qX;
  const qTop = h * (portrait ? 0.15 : 0.17);
  const qBoxH = h * (portrait ? 0.27 : 0.27);
  const qBox = wrapFit(it.question, font, (portrait ? 68 : 66) * u, qW, qBoxH, 1.18, 24 * u);
  const qIn = prog(t, 0, 20, ease.out);
  const qWords = qBox.lines.map((l) => l.split(' ').filter(Boolean));
  const qN = qWords.reduce((a, b) => a + b.length, 0);

  const aTop = h * (portrait ? 0.5 : 0.56);
  const aH = h * (portrait ? 0.38 : 0.31);
  const aPad = 44 * u;
  const aX = m;
  const aW = w - 2 * m;
  const aTextX = aX + aPad + badge * 0.9 + 28 * u;
  const aBox = wrapFit(it.answer, 'sans', (portrait ? 46 : 44) * u, aX + aW - aPad - aTextX, aH - 2 * aPad, 1.34, 20 * u);
  const aCardIn = prog(t, 40, 62, ease.out);
  const aStart = 94;
  const aWords = aBox.lines.map((l) => l.split(' ').filter(Boolean));
  const aN = aWords.reduce((a, b) => a + b.length, 0);
  const aDur = Math.min(60, 14 + aN * 2.6);
  const dotsA = prog(t, 58, 70, ease.out) * (1 - prog(t, aStart - 8, aStart + 4, ease.in));
  const aTextY0 = aTop + (aH - aBox.lines.length * aBox.lineH) / 2;

  let qi = 0;
  let ai = 0;
  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        {/* heading + counter */}
        <g opacity={prog(f, 0, 20, ease.out)}>
          <text x={m} y={(portrait ? 92 : 94) * u} fontFamily={sans} fontWeight={800} fontSize={28 * u} letterSpacing={7 * u} fill={p.accent}>
            {(p.heading || '').toUpperCase()}
          </text>
          <text x={w - m} y={(portrait ? 92 : 94) * u} textAnchor="end" fontFamily={famOf('mono')} fontWeight={700} fontSize={28 * u} fill={withAlpha(p.ink, 0.5)}>
            {String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          </text>
          <line x1={m} x2={w - m} y1={(portrait ? 122 : 124) * u} y2={(portrait ? 122 : 124) * u} stroke={withAlpha(p.ink, 0.14)} strokeWidth={2 * u} />
        </g>

        <g opacity={alpha} transform={`translate(${slide} 0)`}>
          {/* question */}
          <g opacity={qIn} transform={`translate(0 ${(1 - qIn) * 34 * u})`}>
            <g transform={`translate(${m + badge / 2} ${qTop + badge / 2}) scale(${backOut(prog(t, 0, 20, ease.linear), 2)}) translate(${-(m + badge / 2)} ${-(qTop + badge / 2)})`}>
              <circle cx={m + badge / 2} cy={qTop + badge / 2} r={badge / 2} fill={p.accent} />
              <text x={m + badge / 2} y={qTop + badge / 2 + badge * 0.18} textAnchor="middle" fontFamily={famOf(font)} fontWeight={700} fontSize={badge * 0.56} fill={hexLum(p.accent) > 0.55 ? '#10131A' : '#FFFFFF'}>
                {p.qLabel}
              </text>
            </g>
            {qBox.lines.map((ln, li) => (
              <text key={li} x={qX} y={qTop + badge * 0.62 + li * qBox.lineH} fontFamily={famOf(font)} fontWeight={700} fontSize={qBox.size} fill={p.ink}>
                {qWords[li].map((wd, j) => {
                  const i = qi++;
                  const s = 6 + (i / Math.max(1, qN)) * 30;
                  return (
                    <tspan key={j} fillOpacity={prog(t, s, s + 10, ease.out)}>
                      {wd + (j < qWords[li].length - 1 ? ' ' : '')}
                    </tspan>
                  );
                })}
              </text>
            ))}
          </g>

          {/* answer card */}
          <g opacity={aCardIn} transform={`translate(0 ${(1 - aCardIn) * 40 * u})`}>
            <rect x={aX} y={aTop} width={aW} height={aH} rx={30 * u} fill={card} stroke={withAlpha(p.ink, 0.1)} strokeWidth={2 * u} />
            <rect x={aX} y={aTop + 26 * u} width={8 * u} height={aH - 52 * u} rx={4 * u} fill={p.accent} />
            <circle cx={aX + aPad + badge * 0.45} cy={aTop + aPad + badge * 0.45} r={badge * 0.45} fill="none" stroke={p.ink} strokeWidth={4 * u} opacity={0.85} />
            <text x={aX + aPad + badge * 0.45} y={aTop + aPad + badge * 0.45 + badge * 0.15} textAnchor="middle" fontFamily={famOf(font)} fontWeight={700} fontSize={badge * 0.46} fill={p.ink}>
              {p.aLabel}
            </text>
            {/* thinking dots */}
            <g opacity={dotsA}>
              {[0, 1, 2].map((d) => (
                <circle key={d} cx={aTextX + 16 * u + d * 38 * u} cy={aTop + aH / 2 - Math.max(0, Math.sin((t - d * 4) / 4.5)) * 12 * u} r={10 * u} fill={p.accent} />
              ))}
            </g>
            {aBox.lines.map((ln, li) => (
              <text key={li} x={aTextX} y={aTextY0 + li * aBox.lineH + aBox.size * 0.95} fontFamily={sans} fontWeight={500} fontSize={aBox.size} fill={p.ink}>
                {aWords[li].map((wd, j) => {
                  const i = ai++;
                  const s = aStart + (i / Math.max(1, aN)) * (aDur - 10);
                  return (
                    <tspan key={j} fillOpacity={prog(t, s, s + 10, ease.out)}>
                      {wd + (j < aWords[li].length - 1 ? ' ' : '')}
                    </tspan>
                  );
                })}
              </text>
            ))}
          </g>
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const qaSlide = defineMotion<Props>({
  id: 'qa-slide',
  title: 'Q&A slide',
  category: 'text',
  description: 'Keynote Q&A slide: a question lands beside an accent "Q" badge, three thinking dots pulse in the answer card, then the answer reveals word by word; several pairs play in turn with a counter.',
  source: ['original (round 3, presentation slides)'],
  useFor: 'FAQ and Q&A segments in decks, webinars and explainer videos, "common questions" slides, interview-style answers and objection handling beats.',
  durationInFrames: 300,
  defaultProps: {
    items: DEFAULT_ITEMS,
    heading: 'Q & A',
    qLabel: 'Q',
    aLabel: 'A',
    holdFrames: 150,
    background: '#F5F1EA',
    cardColor: '#FFFFFF',
    ink: '#1C2030',
    accent: '#3E6AE1',
    fontFamily: 'grotesk',
    startAt: 0,
  },
  propDocs: {
    items: 'array of {question, answer} — each pair plays for holdFrames (up to 8)',
    heading: 'small caption top-left (empty to hide)',
    qLabel: 'letter in the question badge',
    aLabel: 'letter in the answer badge',
    holdFrames: 'frames each question/answer pair stays on screen',
    background: 'frame colour, or "transparent" to overlay content',
    cardColor: 'answer card fill, or "auto"',
    ink: 'text colour',
    accent: 'badge, bar and dot colour',
    fontFamily: 'question font: sans | serif | display | grotesk | rounded | instrument | mono',
    startAt: 'frame the slide begins',
  },
  component: QaSlide,
  tags: ['slide', 'keynote', 'presentation', 'qa', 'q&a', 'faq', 'question', 'answer', 'reveal', 'webinar', 'interview', 'deck', 'overlay'],
});
