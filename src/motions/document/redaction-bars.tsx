// Adapted from lemo-opuscar/styles/halftone-dossier (STYLE.md §8 "Redaction", stamp ink filter) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, DOSSIER, eo3, h1, lerp, lf, PaperFibre, seg, slamShake, StampInkDef} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  caseNo: string;
  title: string;
  text: string;
  reveal: number[];
  printAt: number;
  printGap: number;
  liftAt: number;
  liftGap: number;
  stamp: string;
  stampAt: number;
  paper: string;
  ink: string;
  bar: string;
  highlight: string;
  stampColor: string;
};

type Tok = {text: string; red: number; line: number; col: number};

const RedactionBars: React.FC<Props> = ({caseNo, title, text, reveal, printAt, printGap, liftAt, liftGap, stamp, stampAt, paper, ink, bar, highlight, stampColor}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const mx = (portrait ? 0.08 : 0.1) * w;
  const fs = (portrait ? 40 : 42) * u;
  const cw = fs * 0.6;
  const lh = fs * 1.75;
  const perLine = Math.max(12, Math.floor((w - 2 * mx) / cw));

  // ---- tokenise: [ ... ] spans are redactions; layout in monospace cells
  const raw: {text: string; red: boolean}[] = [];
  text.split(/(\[[^\]]+\])/).forEach((part) => {
    if (!part) return;
    if (part.startsWith('[')) raw.push({text: part.slice(1, -1), red: true});
    else part.split(/\s+/).filter(Boolean).forEach((wd) => raw.push({text: wd, red: false}));
  });
  const toks: Tok[] = [];
  let line = 0;
  let col = 0;
  let ri = 0;
  for (const t of raw) {
    const len = t.text.length;
    if (col > 0 && col + 1 + len > perLine) {
      line++;
      col = 0;
    }
    if (col > 0) col++;
    toks.push({text: t.text, red: t.red ? ri++ : -1, line, col});
    col += len;
  }
  const lines = line + 1;
  const titleFs = (portrait ? 92 : 110) * u;
  const headTop = (portrait ? 0.12 : 0.1) * h;
  const bodyTop = headTop + titleFs * 1.75 + 40 * u;
  const blockH = lines * lh;
  const top = Math.max(bodyTop, Math.min(bodyTop + 40 * u, h * 0.5 - blockH / 2 + 60 * u));

  const stampT = frame - stampAt;
  const stampS = stampT < 0 ? 0 : stampT < 3 ? lerp(2.6, 1, stampT / 3) : 1 + Math.exp(-0.7 * (stampT - 3)) * Math.cos((stampT - 3) * 1.4) * 0.05;
  const [shx, shy] = slamShake(frame, stampAt + 3, 14 * u, 3);
  const prints = toks.filter((t) => t.red >= 0).map((t) => printAt + t.red * printGap);
  const kick = prints.reduce((s, p) => s + (frame >= p && frame < p + 2 ? 2 * u : 0), 0);
  const push = 1 + 0.04 * seg(frame, 0, 200);

  return (
    <AbsoluteFill style={{background: paper, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${shx}px, ${shy + kick}px) scale(${push})`}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <StampInkDef id="rb-ink" u={u} scale={3} speckle={0.6} seed={8} />
            <StampInkDef id="rb-stamp" u={u} scale={6} speckle={1} seed={2} />
          </defs>
          {/* case-file header */}
          <g opacity={eo3(seg(frame, 0, 10))}>
            <text x={mx} y={headTop} fontFamily={lf.jbm} fontWeight={600} fontSize={22 * u} fill={ink} letterSpacing={3 * u}>
              {caseNo.toUpperCase()}
            </text>
            <rect x={mx} y={headTop + 14 * u} width={w - 2 * mx} height={3 * u} fill={ink} />
            <text x={mx + 6 * u} y={headTop + 14 * u + titleFs * 1.05 + 6 * u} fontFamily={lf.oswald} fontWeight={700} fontSize={titleFs} fill={DOSSIER.pink} opacity={0.75} style={{mixBlendMode: 'multiply'}}>
              {title.toUpperCase()}
            </text>
            <text x={mx} y={headTop + 14 * u + titleFs * 1.05} fontFamily={lf.oswald} fontWeight={700} fontSize={titleFs} fill={ink}>
              {title.toUpperCase()}
            </text>
          </g>
          {/* body text */}
          {toks.map((t, i) => {
            const x = mx + t.col * cw;
            const y = top + t.line * lh;
            const lifted = t.red >= 0 && reveal.includes(t.red);
            const liftT = lifted ? liftAt + reveal.indexOf(t.red) * liftGap : Infinity;
            const hl = lifted ? eo3(seg(frame, liftT + 4, liftT + 12)) : 0;
            return (
              <g key={i}>
                {hl > 0 && <rect x={x - 4 * u} y={y - fs * 0.86} width={(t.text.length * cw + 8 * u) * hl} height={fs * 1.12} fill={highlight} opacity={0.85} style={{mixBlendMode: 'multiply'}} />}
                <text x={x} y={y} fontFamily={lf.jbm} fontSize={fs} fill={ink} opacity={eo3(seg(frame, 2 + t.line * 2, 10 + t.line * 2))}>
                  {t.text}
                </text>
              </g>
            );
          })}
          {/* bars: print on in 2–3 frames, later some lift (slide + peel, back ease) */}
          {toks.map((t, i) => {
            if (t.red < 0) return null;
            const p0 = printAt + t.red * printGap;
            const pt = frame - p0;
            if (pt < 0) return null;
            const bx = mx + t.col * cw - 8 * u;
            const by = top + t.line * lh - fs * 0.95;
            const bw = t.text.length * cw + 16 * u;
            const bh = fs * 1.3;
            const ps = pt < 1 ? 1.14 : pt < 2 ? 1.04 : 1;
            const po = pt < 1 ? 0.6 : 1;
            const ri2 = reveal.indexOf(t.red);
            const lt = ri2 >= 0 ? frame - (liftAt + ri2 * liftGap) : -1;
            const lk = lt >= 0 ? backOut(lt / 9, 1.9) : 0;
            const dy = -lk * bh * 1.6;
            const rot = lk * (h1(i, 4) > 0.5 ? 7 : -7);
            const fade = lt >= 0 ? 1 - seg(lt, 4, 10) : 1;
            return (
              <g key={'b' + i} opacity={po * fade} transform={`translate(${bx + bw / 2} ${by + bh / 2 + dy}) rotate(${rot}) scale(${ps})`}>
                <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={6 * u} fill={bar} filter="url(#rb-ink)" />
                {lt >= 0 && <rect x={-bw / 2} y={bh / 2 - 6 * u} width={bw} height={6 * u} rx={3 * u} fill="#000" opacity={0.25 * (1 - fade)} />}
              </g>
            );
          })}
          {/* stamp */}
          {stampT >= 0 && stamp && (
            <g transform={`translate(${portrait ? w * 0.5 : w * 0.72} ${portrait ? h * 0.82 : h * 0.8}) rotate(-9) scale(${stampS})`} opacity={0.92} filter="url(#rb-stamp)">
              {(() => {
                const sfs = (portrait ? 74 : 86) * u;
                const sw = stamp.length * sfs * 0.56 + 60 * u;
                return (
                  <>
                    <rect x={-sw / 2} y={-sfs * 0.85} width={sw} height={sfs * 1.5} rx={10 * u} fill="none" stroke={stampColor} strokeWidth={9 * u} />
                    <text x={0} y={sfs * 0.36} textAnchor="middle" fontFamily={lf.oswald} fontWeight={700} fontSize={sfs} fill={stampColor} letterSpacing={4 * u}>
                      {stamp.toUpperCase()}
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </AbsoluteFill>
      <PaperFibre w={w} h={h} id="rb-fibre" opacity={0.55} tint="#7a6a4a" />
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(120,100,80,0) 55%, rgba(120,100,80,0.35) 100%)'}} />
    </AbsoluteFill>
  );
};

export const redactionBars = defineMotion<Props>({
  id: 'redaction-bars',
  title: 'Redaction bars',
  category: 'document',
  description:
    'A typed case-file page on cream paper: navy ink bars print over chosen words with a 2-frame stamp kick, then lift one by one (slide-and-peel with a back ease) to reveal a yellow-highlighted word — some stay hidden — and a red DECLASSIFIED stamp slams at the end.',
  source: ['lemo-opuscar styles/halftone-dossier (MIT, LemoLab) — STYLE.md §8 Redaction, stamp ink filter'],
  useFor: 'Leaks, spoilers, surprise reveals, compliance and privacy explainers, true-crime style beats.',
  durationInFrames: 180,
  defaultProps: {
    caseNo: 'Case file 07 · Northwind',
    title: 'Courier report',
    text: 'On the night of [12 March] the courier left [Harbor Gate] with a sealed case for [Agent Lumen]. Inside were [three brass keys] and a note signed by [the director].',
    reveal: [0, 2, 3],
    printAt: 16,
    printGap: 4,
    liftAt: 62,
    liftGap: 20,
    stamp: 'Declassified',
    stampAt: 130,
    paper: DOSSIER.paper,
    ink: DOSSIER.navy,
    bar: DOSSIER.navy,
    highlight: DOSSIER.yellow,
    stampColor: DOSSIER.red,
  },
  propDocs: {
    caseNo: 'small mono line over the title',
    title: 'heading with a pink misregistered shadow',
    text: 'body text; wrap words in [square brackets] to redact them',
    reveal: 'which redactions lift (0-based, in order); the rest stay hidden',
    printAt: 'frame the first bar prints',
    printGap: 'frames between bar prints',
    liftAt: 'frame the first bar lifts',
    liftGap: 'frames between lifts',
    stamp: 'stamp word at the end ("" = none)',
    stampAt: 'frame the stamp slams',
    paper: 'paper colour',
    ink: 'text ink',
    bar: 'redaction bar colour',
    highlight: 'highlighter under revealed words',
    stampColor: 'stamp ink',
  },
  component: RedactionBars,
  tags: ['redaction', 'redacted', 'document', 'censor', 'secret', 'reveal', 'spoiler', 'case file', 'dossier', 'stamp', 'declassified', 'typewriter', 'paper', 'leak', 'privacy'],
});
