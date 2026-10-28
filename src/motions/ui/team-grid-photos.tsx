import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgOf} from '../../core/r3-social';
import {ClipImage, avatarColor, backOut, famOf, fitLine, initials, mixHex, slideFont, solidBg, withAlpha} from '../../core/r3-slide-kit';

/**
 * Keynote "meet the team" slide: a grid of person cards (photo or initials, name, role) that pop in one after another with a
 * soft accent ring. Columns reflow automatically for 16:9, square and 9:16.
 */
type Person = {name: string; role?: string; src?: string};
type Props = {
  title: string;
  subtitle: string;
  people: Person[];
  columns: number;
  shape: 'circle' | 'rounded';
  background: string;
  cardColor: string;
  ink: string;
  accent: string;
  fontFamily: string;
  stagger: number;
  startAt: number;
};

const DEFAULT_PEOPLE: Person[] = [
  {name: 'Jordan Lee', role: 'Founder & CEO'},
  {name: 'Priya Nair', role: 'Head of Design'},
  {name: 'Marco Silva', role: 'Engineering Lead'},
  {name: 'Amira Hassan', role: 'Product Manager'},
  {name: 'Tom Becker', role: 'Customer Success'},
  {name: 'Yuki Tanaka', role: 'Operations'},
];

const TeamGridPhotos: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = slideFont(p.fontFamily, 'grotesk');
  const sans = famOf('sans');
  const people = (Array.isArray(p.people) && p.people.length ? p.people : DEFAULT_PEOPLE).map((x) => (typeof x === 'string' ? {name: x as string} : x)).slice(0, 12);
  const n = people.length;
  const bg = solidBg(p.background, '#ffffff');
  const card = p.cardColor === 'auto' ? mixHex(bg, p.ink, 0.07) : p.cardColor;
  const m = (portrait ? 70 : 110) * u;

  const headH = (portrait ? 290 : 262) * u;
  const gridX = m;
  const gridW = w - 2 * m;
  const gridY = headH + (portrait ? 30 : 10) * u;
  const gridH = h - gridY - (portrait ? 80 : 70) * u;
  const gap = 28 * u;

  // choose the column count that gives the biggest cards
  let cols = Math.round(p.columns);
  if (!(cols >= 1)) {
    let best = -1;
    for (let c = 1; c <= Math.min(n, 6); c++) {
      const rows = Math.ceil(n / c);
      const cw = (gridW - gap * (c - 1)) / c;
      const chh = (gridH - gap * (rows - 1)) / rows;
      const score = Math.min(cw / 0.8, chh) - (c > 1 && n % c !== 0 ? 6 * u : 0);
      if (score > best + 1) {
        best = score;
        cols = c;
      }
    }
  }
  cols = Math.max(1, Math.min(cols, n));
  const rows = Math.ceil(n / cols);
  const cw = (gridW - gap * (cols - 1)) / cols;
  const chh = Math.min((gridH - gap * (rows - 1)) / rows, cw * 1.5);
  const gridTotalH = chh * rows + gap * (rows - 1);
  const topY = gridY + Math.max(0, (gridH - gridTotalH) / 2);

  const titleIn = prog(f, 0, 24, ease.out);
  const titleSize = fitLine(p.title, font, (portrait ? 96 : 92) * u, w - 2 * m);
  const subSize = fitLine(p.subtitle, 'sans', 34 * u, w - 2 * m);

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        <g opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * 24 * u})`}>
          <text x={w / 2} y={portrait ? 150 * u : 128 * u} textAnchor="middle" fontFamily={famOf(font)} fontWeight={700} fontSize={titleSize} fill={p.ink}>
            {p.title}
          </text>
          {p.subtitle && (
            <text x={w / 2} y={(portrait ? 150 : 128) * u + subSize * 1.7} textAnchor="middle" fontFamily={sans} fontWeight={400} fontSize={subSize} fill={withAlpha(p.ink, 0.6)}>
              {p.subtitle}
            </text>
          )}
          <rect x={w / 2 - 50 * u * titleIn} y={(portrait ? 150 : 128) * u + (p.subtitle ? subSize * 1.7 + 30 * u : 36 * u)} width={100 * u * titleIn} height={7 * u} rx={3.5 * u} fill={p.accent} />
        </g>

        {people.map((pe, i) => {
          const r = Math.floor(i / cols);
          const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
          const c = i - r * cols;
          const rowW = inRow * cw + (inRow - 1) * gap;
          const x = gridX + (gridW - rowW) / 2 + c * (cw + gap);
          const y = topY + r * (chh + gap);
          const s0 = 14 + i * Math.max(1, p.stagger);
          const pop = backOut(prog(f, s0, s0 + 22, ease.linear), 1.8);
          const fade = prog(f, s0, s0 + 12, ease.out);
          const d = Math.min(cw * 0.66, chh * 0.58);
          const acx = x + cw / 2;
          const acy = y + chh * 0.07 + d / 2 + 6 * u;
          const ringT = prog(f, s0 + 6, s0 + 30, ease.out);
          const name = pe.name || '';
          const nameSize = fitLine(name, 'sans', Math.min(40 * u, chh * 0.14), cw - 30 * u);
          const role = pe.role || '';
          const roleSize = fitLine(role, 'sans', Math.min(28 * u, chh * 0.1), cw - 30 * u);
          const circ = p.shape !== 'rounded';
          const R = d / 2 + 9 * u;
          return (
            <g key={i} opacity={fade} transform={`translate(${x + cw / 2} ${y + chh / 2}) scale(${0.7 + 0.3 * pop}) translate(${-(x + cw / 2)} ${-(y + chh / 2)})`}>
              <rect x={x} y={y + 8 * u} width={cw} height={chh} rx={30 * u} fill="#000" opacity={0.1} />
              <rect x={x} y={y} width={cw} height={chh} rx={30 * u} fill={card} stroke={withAlpha(p.ink, 0.08)} strokeWidth={2 * u} />
              {/* accent ring */}
              {circ ? (
                <circle cx={acx} cy={acy} r={R} fill="none" stroke={p.accent} strokeWidth={4 * u} strokeDasharray={R * 6.283} strokeDashoffset={(1 - ringT) * R * 6.283} transform={`rotate(-90 ${acx} ${acy})`} />
              ) : (
                <rect x={acx - R} y={acy - R} width={R * 2} height={R * 2} rx={R * 0.32} fill="none" stroke={p.accent} strokeWidth={4 * u} opacity={ringT} />
              )}
              {pe.src ? (
                <ClipImage id={`team-grid-photo-${i}`} src={pe.src} x={acx - d / 2} y={acy - d / 2} w={d} h={d} r={circ ? d / 2 : d * 0.26} circle={circ} />
              ) : (
                <g>
                  {circ ? <circle cx={acx} cy={acy} r={d / 2} fill={avatarColor(name, i)} /> : <rect x={acx - d / 2} y={acy - d / 2} width={d} height={d} rx={d * 0.26} fill={avatarColor(name, i)} />}
                  <text x={acx} y={acy + d * 0.15} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={d * 0.4} fill="#fff">
                    {initials(name)}
                  </text>
                </g>
              )}
              <text x={acx} y={acy + d / 2 + 14 * u + nameSize * 1.25} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={nameSize} fill={p.ink}>
                {name}
              </text>
              {role && (
                <text x={acx} y={acy + d / 2 + 14 * u + nameSize * 1.25 + roleSize * 1.5} textAnchor="middle" fontFamily={sans} fontWeight={400} fontSize={roleSize} fill={withAlpha(p.ink, 0.62)}>
                  {role}
                </text>
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const teamGridPhotos = defineMotion<Props>({
  id: 'team-grid-photos',
  title: 'Team grid with photos',
  category: 'ui',
  description: 'Keynote team slide: a headline over a grid of person cards (round or rounded photo, or coloured initials, plus name and role) that pop in with a drawing accent ring.',
  source: ['original (round 3, presentation slides)'],
  useFor: 'Meet-the-team and about-us slides, speaker lineups, advisor and contributor walls, org intros in pitch decks, videos and landing pages.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Meet the team',
    subtitle: 'The people behind the product',
    people: DEFAULT_PEOPLE,
    columns: 0,
    shape: 'circle',
    background: '#F3F1EC',
    cardColor: '#FFFFFF',
    ink: '#1D2230',
    accent: '#E0643C',
    fontFamily: 'grotesk',
    stagger: 6,
    startAt: 0,
  },
  propDocs: {
    title: 'headline above the grid',
    subtitle: 'line under the headline (empty to hide)',
    people: 'array of {name, role?, src?} (src = photo path/URL; initials are drawn when empty) — up to 12',
    columns: 'grid columns; 0 = automatic (best fit for the frame)',
    shape: 'photo shape: circle | rounded',
    background: 'frame colour, or "transparent" to overlay content',
    cardColor: 'card fill, or "auto" (tinted from the background)',
    ink: 'text colour',
    accent: 'ring and underline colour',
    fontFamily: 'headline font: sans | serif | display | grotesk | rounded | instrument | mono',
    stagger: 'frames between cards popping in',
    startAt: 'frame the slide begins',
  },
  component: TeamGridPhotos,
  tags: ['slide', 'keynote', 'presentation', 'team', 'people', 'grid', 'photos', 'avatars', 'about-us', 'speakers', 'staff', 'cards', 'deck'],
});
