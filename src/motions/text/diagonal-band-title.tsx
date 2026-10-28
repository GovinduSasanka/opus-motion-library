// Adapted from lemo-opuscar/styles/kino-montage (STYLE.md §6 title package; slam / slant / print grade) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {ArchiveKind, ArchivePhoto, cl, eo3, h1, KINO, lerp, lf, PaperFibre, PrintGradeDef, seg, slamShake} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  number: string;
  unit: string;
  line: string;
  subline: string;
  tag: string;
  src: string;
  footage: ArchiveKind;
  axisDeg: number;
  bpm: number;
  red: string;
  ink: string;
  paper: string;
};

const DiagonalBandTitle: React.FC<Props> = ({number, unit, line, subline, tag, src, footage, axisDeg, bpm, red, ink, paper}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const beat = (60 / bpm) * 30;
  const eighth = beat / 2;
  const a = (axisDeg * Math.PI) / 180;
  const T = 112 * u;
  const tA = Math.tan(a);

  // ---- layout
  const P = portrait ? {px: 0.5 * w, py: 0.76 * h} : {px: 0.5 * w, py: 0.72 * h};
  const yTop = (x: number) => P.py + tA * (x - P.px) - T / 2 / Math.cos(a);
  const win = portrait ? {x0: 0.07 * w, x1: 0.93 * w, top: 0.3 * h} : {x0: 0.53 * w, x1: 0.93 * w, top: 0.06 * h};
  const numSize = portrait ? Math.min(0.17 * h, (0.62 * w) / Math.max(1.2, number.length * 0.52)) : Math.min(0.3 * h, (0.4 * w) / Math.max(1.2, number.length * 0.52));
  const numX = 0.055 * w;
  const numY = portrait ? 0.05 * h : 0.07 * h;

  // ---- timing (one grid: 120 BPM)
  const tWin = 4;
  const tBand = 4 + beat * 0.75;
  const tDigit0 = tBand + eighth;
  const digits = [...number];
  const tUnit = tDigit0 + digits.length * eighth;
  const tLine = tUnit + eighth;
  const tSub = tLine + eighth;

  // shakes: every slam adds a decaying kick
  const kicks = [slamShake(frame, tWin + 3, 10 * u, 1), slamShake(frame, tBand + 3, 16 * u, 2), ...digits.map((_, i) => slamShake(frame, tDigit0 + i * eighth + 1, 5 * u, 3 + i))];
  const sx = kicks.reduce((s, k) => s + k[0], 0);
  const sy = kicks.reduce((s, k) => s + k[1], 0);
  const push = 1 + 0.03 * (frame / D);

  // window slams down from above, then slow push inside; film flicker ±2.5 %
  const wIn = eo3(seg(frame, tWin, tWin + 4));
  const winDy = (1 - wIn) * -h * 0.9;
  const flick = (h1(frame, 9) - 0.5) * 0.05;
  const gap = 10 * u;
  const poly = [
    [win.x0, win.top],
    [win.x1, win.top],
    [win.x1, yTop(win.x1) - gap],
    [win.x0, yTop(win.x0) - gap],
  ];
  const winW = win.x1 - win.x0;
  const winH = yTop(win.x0) - win.top;
  const bandOff = lerp(-2.4 * w, 0, eo3(seg(frame, tBand, tBand + 4)));
  const lineIn = eo3(seg(frame, tLine, tLine + 6));
  const bandLocalX = (0.06 * w - P.px) / Math.cos(a);
  const bandFs = T * 0.38;
  const subIn = eo3(seg(frame, tSub, tSub + 5));
  const tagIn = seg(frame, tWin + 10, tWin + 12);
  const tagFs = 17 * u;

  return (
    <AbsoluteFill style={{background: paper, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${push})`, transformOrigin: '30% 40%'}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <PrintGradeDef id="dbt-grade" ink={ink} paper={paper} flicker={flick} />
            <clipPath id="dbt-win">
              <polygon points={poly.map((p) => p.join(',')).join(' ')} />
            </clipPath>
          </defs>
          {/* footage window */}
          <g transform={`translate(0 ${winDy})`}>
            <g clipPath="url(#dbt-win)">
              <g filter="url(#dbt-grade)">
                <g transform={`translate(${win.x0 + winW / 2} ${win.top + winH / 2}) scale(${1.04 + 0.08 * (frame / D)}) translate(${-winW / 2} ${-winH / 2})`}>
                  {src ? (
                    <image href={resolveSrc(src)} width={winW} height={winH} preserveAspectRatio="xMidYMid slice" />
                  ) : (
                    <ArchivePhoto kind={footage} w={winW} h={winH} id="dbt-ph" t={frame / 30} seed={3} />
                  )}
                </g>
              </g>
            </g>
            <polygon points={poly.map((p) => p.join(',')).join(' ')} fill="none" stroke={ink} strokeWidth={9 * u} strokeLinejoin="miter" />
          </g>
          {/* the red girder band */}
          <g transform={`translate(${P.px} ${P.py}) rotate(${axisDeg}) translate(${bandOff} 0)`}>
            <rect x={-3.2 * w} y={-T / 2} width={4.1 * w} height={T} fill={red} />
            <g opacity={lineIn} transform={`translate(${(1 - lineIn) * -60 * u} 0)`}>
              <text x={bandLocalX} y={bandFs * 0.36} fontFamily={lf.oswald} fontWeight={600} fontSize={bandFs} fill={paper} letterSpacing={3 * u}>
                {line.toUpperCase()}
              </text>
            </g>
          </g>
        </svg>
        {/* footage tag */}
        <div
          style={{
            position: 'absolute',
            right: w - win.x1,
            top: win.top + winDy - tagFs * 2.1,
            background: ink,
            color: paper,
            fontFamily: lf.spaceMono,
            fontWeight: 700,
            fontSize: tagFs,
            padding: `${6 * u}px ${10 * u}px`,
            letterSpacing: 1.5 * u,
            opacity: tagIn,
            whiteSpace: 'nowrap',
          }}
        >
          {tag.toUpperCase()}
        </div>
        {/* huge number, one digit per eighth */}
        <div style={{position: 'absolute', left: numX, top: numY, display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap'}}>
          {digits.map((d, i) => {
            const lt = frame - (tDigit0 + i * eighth);
            if (lt < 0) return <span key={i} style={{fontFamily: lf.oswald, fontWeight: 700, fontSize: numSize, lineHeight: 0.9, opacity: 0}}>{d}</span>;
            const s = lt < 1 ? 1.45 : lt < 2 ? 1.1 : lt < 3 ? 0.97 : 1;
            return (
              <span key={i} style={{display: 'inline-block', fontFamily: lf.oswald, fontWeight: 700, fontSize: numSize, lineHeight: 0.9, color: ink, transform: `scale(${s})`, transformOrigin: '50% 80%', opacity: cl(lt / 1.5 + 0.3)}}>
                {d}
              </span>
            );
          })}
          <span
            style={{
              fontFamily: lf.oswald,
              fontWeight: 700,
              fontSize: numSize * 0.36,
              color: red,
              marginLeft: numSize * 0.08,
              opacity: frame >= tUnit ? 1 : 0,
              display: 'inline-block',
              transform: `translateY(${frame >= tUnit ? (1 - eo3(seg(frame, tUnit, tUnit + 4))) * -30 * u : 0}px)`,
            }}
          >
            {unit.toUpperCase()}
          </span>
        </div>
        {/* ink tab subline */}
        <div style={{position: 'absolute', left: numX, top: numY + numSize * 0.98, opacity: subIn, transform: `translateX(${(1 - subIn) * -40 * u}px)`}}>
          <span style={{display: 'inline-block', background: ink, color: paper, fontFamily: lf.oswald, fontWeight: 600, fontSize: (portrait ? 40 : 44) * u, padding: `${4 * u}px ${16 * u}px`, letterSpacing: 2 * u, whiteSpace: 'nowrap'}}>
            {subline.toUpperCase()}
          </span>
        </div>
      </AbsoluteFill>
      <PaperFibre w={w} h={h} id="dbt-fibre" opacity={0.5} />
    </AbsoluteFill>
  );
};

export const diagonalBandTitle = defineMotion<Props>({
  id: 'diagonal-band-title',
  title: 'Diagonal band title',
  category: 'text',
  description:
    'Constructivist title package on warm paper: an archive-footage window slams down, a red girder band slams in along a −18° axis with a decaying shake, a huge Oswald number stamps digit by digit (one per eighth note) with its unit in red, and a caps line rides on the band; everything printed in one ink, one red.',
  source: ['lemo-opuscar styles/kino-montage (MIT, LemoLab) — STYLE.md §6 title package, poster.jpg, index.html slam/slant'],
  useFor: 'Bold documentary, anniversary and report openers; launch numbers with real photos (pass src).',
  durationInFrames: 150,
  defaultProps: {
    number: '410',
    unit: 'days',
    line: 'Northwind Tower · built floor by floor',
    subline: 'Opened ahead of schedule',
    tag: 'Film · Northwind archive · 1931',
    src: '',
    footage: 'tower',
    axisDeg: -18,
    bpm: 120,
    red: KINO.red,
    ink: KINO.ink,
    paper: KINO.paper,
  },
  propDocs: {
    number: 'the huge number (stamped digit by digit)',
    unit: 'unit word in red beside it',
    line: 'caps line riding on the red band',
    subline: 'ink-tab line under the number',
    tag: 'Space Mono source tag on the footage window',
    src: 'optional photo/still in public/ for the footage window (print-graded to ink/paper)',
    footage: "procedural archive scene when no src: 'tower' | 'girder' | 'crowd' | 'street' | 'works'",
    axisDeg: 'band axis in degrees (−15 to −30)',
    bpm: 'beat grid: digits land on eighth notes',
    red: 'the one red',
    ink: 'ink colour',
    paper: 'paper colour',
  },
  component: DiagonalBandTitle,
  tags: ['title', 'constructivist', 'kino', 'documentary', 'red band', 'diagonal', 'slam', 'number', 'stat', 'archive', 'print', 'two-tone', 'paper', 'editorial', 'anniversary', 'bold'],
});
