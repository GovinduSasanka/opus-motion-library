import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgOf} from '../../core/r3-social';
import {ClipImage, backOut, famOf, fitLine, slideFont, withAlpha, wrapFit} from '../../core/r3-slide-kit';

/**
 * Keynote quote slide: a big accent quote mark pops in, the quote reveals (word by word, typed, or line by line), then the
 * attribution (name + role) slides in; an optional portrait photo sits beside it. Everything is a prop.
 */
type Props = {
  quote: string;
  author: string;
  role: string;
  src: string;
  reveal: 'words' | 'type' | 'fade';
  fontFamily: string;
  background: string;
  ink: string;
  accent: string;
  revealFrames: number;
  startAt: number;
};

const QuoteSlide: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = slideFont(p.fontFamily, 'serif');
  const fam = famOf(font);
  const sans = famOf('sans');
  const m = (portrait ? 84 : 130) * u;
  const hasPhoto = !!p.src;
  const mode = p.reveal === 'type' || p.reveal === 'fade' ? p.reveal : 'words';

  // text column
  const photoR = (portrait ? 150 : 170) * u;
  const x0 = !portrait && hasPhoto ? m + photoR * 2 + 90 * u : m + (portrait ? 0 : 40 * u);
  const maxW = w - m - x0;
  const baseSize = (portrait ? 64 : 72) * u;
  const boxH = h * (portrait ? (hasPhoto ? 0.3 : 0.4) : 0.46);
  const q = wrapFit(p.quote, font, baseSize, maxW, boxH, 1.28, 22 * u, font === 'serif' ? 0 : -0.01);
  const attrH = 110 * u;
  const markH = 130 * u;
  const photoBlock = portrait && hasPhoto ? photoR * 2 + 50 * u : 0;
  const total = photoBlock + markH + q.lines.length * q.lineH + 50 * u + attrH;
  const top = Math.max(m * 0.8, (h - total) / 2);
  const textTop = top + photoBlock + markH;
  const markIn = backOut(prog(f, 0, 22, ease.linear), 2.2);
  const barIn = prog(f, 4, 36, ease.expoOut);
  const photoIn = prog(f, 0, 30, ease.out);

  const rf = Math.max(20, p.revealFrames);
  const t0 = 16;
  const words = q.lines.map((l) => l.split(' ').filter(Boolean));
  const nWords = words.reduce((a, b) => a + b.length, 0);
  const nChars = q.lines.reduce((a, b) => a + b.length, 0);
  const typedChars = Math.floor(prog(f, t0, t0 + rf, ease.linear) * nChars);
  const revealEnd = t0 + rf;
  const attrIn = prog(f, revealEnd, revealEnd + 22, ease.out);

  let wi = 0;
  let ci = 0;
  const lineEls = q.lines.map((ln, li) => {
    const y = textTop + q.lineH * (li + 0.78);
    if (mode === 'fade') {
      const a = prog(f, t0 + (li / Math.max(1, q.lines.length)) * (rf - 14), t0 + (li / Math.max(1, q.lines.length)) * (rf - 14) + 18, ease.out);
      return (
        <text key={li} x={x0} y={y + (1 - a) * 22 * u} fontFamily={fam} fontWeight={font === 'serif' ? 500 : 600} fontSize={q.size} fill={p.ink} opacity={a}>
          {ln}
        </text>
      );
    }
    if (mode === 'type') {
      const start = ci;
      ci += ln.length;
      const shownN = Math.max(0, Math.min(ln.length, typedChars - start));
      const typing = typedChars < nChars && typedChars >= start && typedChars <= start + ln.length;
      return (
        <text key={li} x={x0} y={y} fontFamily={fam} fontWeight={font === 'serif' ? 500 : 600} fontSize={q.size} fill={p.ink}>
          {ln.slice(0, shownN)}
          {typing && <tspan fill={p.accent}>▌</tspan>}
        </text>
      );
    }
    return (
      <text key={li} x={x0} y={y} fontFamily={fam} fontWeight={font === 'serif' ? 500 : 600} fontSize={q.size} fill={p.ink}>
        {words[li].map((wd, j) => {
          const i = wi++;
          const s = t0 + (i / Math.max(1, nWords)) * (rf - 12);
          return (
            <tspan key={j} fillOpacity={prog(f, s, s + 12, ease.out)}>
              {wd + (j < words[li].length - 1 ? ' ' : '')}
            </tspan>
          );
        })}
      </text>
    );
  });

  const attrY = textTop + q.lines.length * q.lineH + 70 * u;
  const nameSize = fitLine(p.author, 'sans', 38 * u, maxW);
  const roleSize = fitLine(p.role, 'sans', 28 * u, maxW);
  const photoCx = portrait ? w / 2 : m + photoR;
  const photoCy = portrait ? top + photoR : h / 2;

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        {/* faint giant mark behind the slide */}
        <text x={w - m * 0.5} y={h * 0.92} textAnchor="end" fontFamily={famOf('serif')} fontWeight={700} fontSize={Math.min(w, h) * 1.1} fill={p.accent} opacity={0.06 * markIn}>
          ”
        </text>

        {hasPhoto && (
          <g opacity={photoIn} transform={`translate(${photoCx} ${photoCy}) scale(${0.92 + 0.08 * photoIn}) translate(${-photoCx} ${-photoCy})`}>
            <circle cx={photoCx} cy={photoCy} r={photoR + 12 * u} fill="none" stroke={p.accent} strokeWidth={5 * u} strokeDasharray={`${(photoR + 12 * u) * 6.283} ${(photoR + 12 * u) * 6.283}`} strokeDashoffset={(1 - photoIn) * (photoR + 12 * u) * 6.283} transform={`rotate(-90 ${photoCx} ${photoCy})`} />
            <ClipImage id="quote-slide-photo" src={p.src} x={photoCx - photoR} y={photoCy - photoR} w={photoR * 2} h={photoR * 2} circle />
          </g>
        )}

        {!portrait && <rect x={x0 - 34 * u} y={textTop - 6 * u} width={7 * u} height={(q.lines.length * q.lineH + 150 * u) * barIn} rx={3.5 * u} fill={p.accent} opacity={0.9} />}

        <g transform={`translate(${x0} ${top + photoBlock + markH * 0.9}) scale(${markIn}) translate(${-x0} ${-(top + photoBlock + markH * 0.9)})`}>
          <text x={x0 - 6 * u} y={top + photoBlock + markH * 0.9} fontFamily={famOf('serif')} fontWeight={700} fontSize={250 * u} fill={p.accent}>
            “
          </text>
        </g>

        {lineEls}

        <g opacity={attrIn} transform={`translate(0 ${(1 - attrIn) * 18 * u})`}>
          <rect x={x0} y={attrY - 12 * u} width={54 * u * attrIn} height={5 * u} rx={2.5 * u} fill={p.accent} />
          <text x={x0} y={attrY + 40 * u} fontFamily={sans} fontWeight={800} fontSize={nameSize} fill={p.ink}>
            {p.author}
          </text>
          {p.role && (
            <text x={x0} y={attrY + 40 * u + roleSize * 1.5} fontFamily={sans} fontWeight={400} fontSize={roleSize} fill={withAlpha(p.ink, 0.62)}>
              {p.role}
            </text>
          )}
        </g>
      </Svg>
    </AbsoluteFill>
  );
};

export const quoteSlide = defineMotion<Props>({
  id: 'quote-slide',
  title: 'Quote slide',
  category: 'text',
  description: 'Keynote quote slide: giant accent quote mark pops in, the quote reveals word by word / typed / line by line, then name and role slide in beside an optional round portrait.',
  source: ['original (round 3, presentation slides)'],
  useFor: 'Testimonial and pull-quote slides, customer or founder quotes in pitch decks, interview highlights, quote cards for social and videos.',
  durationInFrames: 210,
  defaultProps: {
    quote: 'Good design is mostly about removing everything that gets in the way of the idea.',
    author: 'Alex Morgan',
    role: 'Creative Director',
    src: '',
    reveal: 'words',
    fontFamily: 'serif',
    background: '#F4EFE6',
    ink: '#1E1B16',
    accent: '#C8553D',
    revealFrames: 90,
    startAt: 0,
  },
  propDocs: {
    quote: 'the quote text (wraps and shrinks to fit; no quote marks needed)',
    author: 'name shown under the quote',
    role: 'role / company line (empty to hide)',
    src: 'optional portrait image (public/ path or URL); empty = type only',
    reveal: 'words | type | fade — how the quote appears',
    fontFamily: 'quote font: serif | sans | display | grotesk | rounded | instrument',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'quote mark, bar and rule colour',
    revealFrames: 'frames the quote takes to reveal',
    startAt: 'frame the slide begins',
  },
  component: QuoteSlide,
  tags: ['slide', 'keynote', 'presentation', 'quote', 'testimonial', 'pull-quote', 'attribution', 'portrait', 'typography', 'deck', 'overlay'],
});
