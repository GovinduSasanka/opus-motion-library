import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {bgOf} from '../../core/r3-social';
import {sh} from '../../core/r2-s1-kit';
import {ClipImage, asObjs, backOut, famOf, fitLine, mixHex, slideFont, solidBg, withAlpha} from '../../core/r3-slide-kit';
import {estWidth, type TFont} from '../../core/text-kit';

/**
 * Keynote "trusted by" logo wall: a headline over a grid of client tiles. Each tile holds a logo image (src) or an invented
 * wordmark with a small geometric mark; tiles pop in as a ripple / sequence / shuffle, then an accent highlight roams the wall.
 */
type Logo = {name: string; src?: string};
type Props = {
  title: string;
  logos: (Logo | string)[];
  columns: number;
  tileStyle: 'outline' | 'filled' | 'none';
  monochrome: boolean;
  order: 'ripple' | 'sequence' | 'shuffle';
  background: string;
  cardColor: string;
  ink: string;
  accent: string;
  fontFamily: string;
  stagger: number;
  startAt: number;
};

const DEFAULT_LOGOS: Logo[] = ['Northfold', 'Brightloop', 'Cobaltly', 'Orbito', 'Pinegrove Co', 'Quantis', 'Redmeadow', 'Solvane', 'Tidewell', 'Umbrix', 'Vantora', 'Zephyra'].map((name) => ({name}));

const WORD_FONTS: {f: TFont; wt: number; caps: boolean; track: number}[] = [
  {f: 'grotesk', wt: 700, caps: false, track: -0.02},
  {f: 'serif', wt: 700, caps: false, track: 0},
  {f: 'sans', wt: 800, caps: true, track: 0.12},
  {f: 'display', wt: 400, caps: false, track: 0},
  {f: 'rounded', wt: 700, caps: false, track: 0},
  {f: 'instrument', wt: 400, caps: false, track: 0},
];

const Mark: React.FC<{kind: number; x: number; y: number; s: number; color: string}> = ({kind, x, y, s, color}) => {
  const r = s / 2;
  switch (kind % 6) {
    case 0:
      return <circle cx={x} cy={y} r={r} fill={color} />;
    case 1:
      return <rect x={x - r} y={y - r} width={s} height={s} rx={s * 0.22} fill={color} />;
    case 2:
      return <path d={`M${x} ${y - r} L${x + r} ${y + r * 0.8} L${x - r} ${y + r * 0.8} Z`} fill={color} />;
    case 3:
      return <path d={`M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z`} fill={color} />;
    case 4:
      return (
        <g fill="none" stroke={color} strokeWidth={s * 0.2}>
          <circle cx={x} cy={y} r={r * 0.82} />
        </g>
      );
    default:
      return (
        <g fill={color}>
          <rect x={x - r} y={y - r} width={r * 0.9} height={s} />
          <rect x={x + r * 0.1} y={y - r} width={r * 0.9} height={r * 1.3} />
        </g>
      );
  }
};

const LogoWallGrid: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const f = Math.max(0, frame - p.startAt);
  const font = slideFont(p.fontFamily, 'grotesk');
  const logos = asObjs<Logo>(p.logos, 'name', DEFAULT_LOGOS).slice(0, 24);
  const n = logos.length;
  const bg = solidBg(p.background, '#ffffff');
  const card = p.cardColor === 'auto' ? mixHex(bg, p.ink, 0.06) : p.cardColor;
  const m = (portrait ? 70 : 110) * u;

  const headH = (portrait ? 260 : 220) * u;
  const gridW = w - 2 * m;
  const gridY = headH;
  const gridH = h - gridY - (portrait ? 90 : 80) * u;
  const gap = 24 * u;

  let cols = Math.round(p.columns);
  if (!(cols >= 1)) {
    let best = -1;
    for (let c = 1; c <= Math.min(n, 8); c++) {
      const rows = Math.ceil(n / c);
      const tw = (gridW - gap * (c - 1)) / c;
      const th = (gridH - gap * (rows - 1)) / rows;
      const score = Math.min(tw / 1.9, th) - (n % c !== 0 ? 5 * u : 0);
      if (score > best + 1) {
        best = score;
        cols = c;
      }
    }
  }
  cols = Math.max(1, Math.min(cols, n));
  const rows = Math.ceil(n / cols);
  const tw = (gridW - gap * (cols - 1)) / cols;
  const th = Math.min((gridH - gap * (rows - 1)) / rows, tw * 0.62);
  const totalH = th * rows + gap * (rows - 1);
  const topY = gridY + Math.max(0, (gridH - totalH) / 2);

  // pop order
  const delays = logos.map((_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    if (p.order === 'sequence') return i;
    if (p.order === 'shuffle') return sh(i + 3, 17, n) * n;
    return Math.hypot((c - (cols - 1) / 2) * 1.0, (r - (rows - 1) / 2) * 1.35) * 2.2;
  });
  const st = Math.max(0.5, p.stagger);
  const lastPop = 14 + Math.max(...delays) * st + 24;
  const roam = Math.floor(Math.max(0, f - lastPop - 8) / 14) % n;
  const roamOn = f > lastPop + 8;

  const titleIn = prog(f, 0, 24, ease.out);
  const titleSize = fitLine(p.title, font, (portrait ? 80 : 72) * u, w - 2 * m);

  return (
    <AbsoluteFill style={{background: bgOf(p.background)}}>
      <Svg>
        <g opacity={titleIn} transform={`translate(0 ${(1 - titleIn) * 24 * u})`}>
          <text x={w / 2} y={portrait ? 150 * u : 128 * u} textAnchor="middle" fontFamily={famOf(font)} fontWeight={700} fontSize={titleSize} fill={p.ink}>
            {p.title}
          </text>
          <rect x={w / 2 - 50 * u * titleIn} y={(portrait ? 150 : 128) * u + 40 * u} width={100 * u * titleIn} height={7 * u} rx={3.5 * u} fill={p.accent} />
        </g>

        {logos.map((lg, i) => {
          const r = Math.floor(i / cols);
          const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
          const c = i - r * cols;
          const rowW = inRow * tw + (inRow - 1) * gap;
          const x = m + (gridW - rowW) / 2 + c * (tw + gap);
          const y = topY + r * (th + gap);
          const s0 = 14 + delays[i] * st;
          const pop = backOut(prog(f, s0, s0 + 20, ease.linear), 1.7);
          const fade = prog(f, s0, s0 + 10, ease.out);
          const hot = roamOn && roam === i ? Math.sin(((f - lastPop - 8) % 14) / 14 * Math.PI) : 0;
          const name = lg.name || '';
          const wf = WORD_FONTS[i % WORD_FONTS.length];
          const label = wf.caps ? name.toUpperCase() : name;
          const markS = th * 0.3;
          const textMax = tw - 2 * 26 * u - markS - 14 * u;
          const size = fitLine(label, wf.f, Math.min(th * 0.34, 54 * u), textMax, wf.track);
          const inkC = withAlpha(p.ink, 0.85);
          const tcx = x + tw / 2;
          const tcy = y + th / 2;
          const wTxt = Math.min(textMax, estWidth(label, size, wf.f, wf.track));
          const groupW = markS + 14 * u + wTxt;
          const gx = tcx - groupW / 2;
          return (
            <g key={i} opacity={fade} transform={`translate(${tcx} ${tcy}) scale(${0.6 + 0.4 * pop}) translate(${-tcx} ${-tcy})`}>
              {p.tileStyle !== 'none' && <rect x={x} y={y} width={tw} height={th} rx={20 * u} fill={p.tileStyle === 'filled' ? card : 'none'} stroke={hot > 0 ? p.accent : withAlpha(p.ink, 0.16)} strokeWidth={(2 + 2.5 * hot) * u} />}
              {p.tileStyle === 'none' && hot > 0 && <rect x={x} y={y} width={tw} height={th} rx={20 * u} fill="none" stroke={p.accent} strokeWidth={3 * u} opacity={hot} />}
              {lg.src ? (
                <ClipImage id={`logo-wall-grid-${i}`} src={lg.src} x={x + 26 * u} y={y + 20 * u} w={tw - 52 * u} h={th - 40 * u} fit="meet" gray={p.monochrome} opacity={0.95} />
              ) : (
                <g>
                  <Mark kind={i} x={gx + markS / 2} y={tcy} s={markS} color={hot > 0.2 ? p.accent : inkC} />
                  <text x={gx + markS + 14 * u} y={tcy + size * 0.34} fontFamily={famOf(wf.f)} fontWeight={wf.wt} fontSize={size} letterSpacing={wf.track * size} fill={inkC}>
                    {label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const logoWallGrid = defineMotion<Props>({
  id: 'logo-wall-grid',
  title: 'Logo wall grid',
  category: 'ui',
  description: 'Keynote "trusted by" slide: a headline over a grid of client tiles (logo images or invented wordmarks with geometric marks) that pop in as a ripple, sequence or shuffle, then an accent highlight roams the wall.',
  source: ['original (round 3, presentation slides)'],
  useFor: 'Client / partner / customer logo walls, "as seen in" and sponsor slides, integration lists and social-proof sections of decks, sales videos and landing pages.',
  durationInFrames: 210,
  defaultProps: {
    title: 'Trusted by teams worldwide',
    logos: DEFAULT_LOGOS,
    columns: 0,
    tileStyle: 'outline',
    monochrome: false,
    order: 'ripple',
    background: '#0F1722',
    cardColor: 'auto',
    ink: '#F1F3F7',
    accent: '#6EE7B7',
    fontFamily: 'grotesk',
    stagger: 2.4,
    startAt: 0,
  },
  propDocs: {
    title: 'headline above the wall',
    logos: 'array of strings or {name, src?} — src = logo image path/URL (wordmark drawn when empty) — up to 24',
    columns: 'grid columns; 0 = automatic',
    tileStyle: 'outline | filled | none',
    monochrome: 'turn logo images greyscale (use on light backgrounds)',
    order: 'ripple (from centre) | sequence | shuffle',
    background: 'frame colour, or "transparent" to overlay content',
    cardColor: 'tile fill for tileStyle "filled", or "auto"',
    ink: 'text and tile line colour',
    accent: 'underline and roaming highlight colour',
    fontFamily: 'headline font: sans | serif | display | grotesk | rounded | instrument | mono',
    stagger: 'frames between tiles popping in',
    startAt: 'frame the slide begins',
  },
  component: LogoWallGrid,
  tags: ['slide', 'keynote', 'presentation', 'logos', 'clients', 'partners', 'trusted-by', 'sponsors', 'grid', 'social-proof', 'brands', 'deck', 'overlay'],
});
