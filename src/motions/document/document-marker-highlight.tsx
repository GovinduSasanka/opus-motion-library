// Adapted from lemo-opuscar/styles/kino-montage (STYLE.md §6 "Document close-up", §8.1) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {eo3, h1, KINO, lerp, lf, PaperFibre, seg, slamShake} from '../../core/r2-la3-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

type Props = {
  header: string;
  heading: string;
  date: string;
  paragraphs: string[];
  ledger: string[];
  highlight: number;
  number: string;
  unit: string;
  caption: string;
  tilt: number;
  red: string;
  ink: string;
  paper: string;
  ground: 'ink' | 'paper';
};

const wrap = (text: string, n: number) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    if ((cur + ' ' + wd).trim().length > n && cur) {
      lines.push(cur);
      cur = wd;
    } else cur = (cur + ' ' + wd).trim();
  }
  if (cur) lines.push(cur);
  return lines;
};

const DocumentMarkerHighlight: React.FC<Props> = ({header, heading, date, paragraphs, ledger, highlight, number, unit, caption, tilt, red, ink, paper, ground}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames: D} = useStage();
  const bg = ground === 'ink' ? ink : paper;
  const pageCol = ground === 'ink' ? paper : '#F6EFDF';

  // ---- layout
  const page = portrait ? {x: 0.07 * w, y: 0.045 * h, w: 0.86 * w, h: 0.6 * h} : {x: 0.07 * w, y: 0.05 * h, w: 0.45 * w, h: 0.9 * h};
  const block = portrait ? {x: 0.08 * w, y: 0.69 * h, w: 0.84 * w, h: 0.23 * h} : {x: 0.58 * w, y: 0.27 * h, w: 0.35 * w, h: 0.42 * h};
  const pad = page.w * 0.09;
  const fs = Math.max(15 * u, Math.min(25 * u, page.w / 35));
  const lh = fs * 1.62;
  const perLine = Math.floor((page.w - 2 * pad) / (fs * 0.6));

  // ---- timeline
  const tPage = 4;
  const tMark = 30;
  const tRing = 56;
  const tBlock = 80;
  const pIn = eo3(seg(frame, tPage, tPage + 6));
  const [s1x, s1y] = slamShake(frame, tPage + 6, 12 * u, 1);
  const [s2x, s2y] = slamShake(frame, tBlock + 4, 14 * u, 2);
  const push = lerp(1, 1.06, eo3(seg(frame, 10, D)));

  // ---- page text layout (page coordinates)
  let y = pad;
  const headerY = y + fs * 0.8;
  y += fs * 2.4;
  const headingFs = Math.min(page.w * 0.09, 64 * u);
  const headingY = y + headingFs * 0.85;
  const headingW = Math.min(page.w - 2 * pad, heading.length * headingFs * 0.5);
  y += headingFs * 1.25;
  const dateY = y + fs * 1.5;
  y += fs * 3.4;
  type L = {text: string; y: number; para: number};
  const lines: L[] = [];
  paragraphs.forEach((p, pi) => {
    for (const l of wrap(p, perLine)) {
      lines.push({text: l, y, para: pi});
      y += lh;
    }
    y += lh * 0.55;
  });
  const ledgerY = y + lh * 0.3;
  const marked = lines.filter((l) => l.para === highlight);
  const totalChars = marked.reduce((s, l) => s + l.text.length, 0) || 1;
  const markK = seg(frame, tMark, tMark + 18);

  // hand-drawn ellipse round the heading (1.08 turns, wobbly radius)
  const ecx = pad + headingW / 2;
  const ecy = headingY - headingFs * 0.32;
  const erx = headingW / 2 + headingFs * 0.6;
  const ery = headingFs * 0.85;
  const ell: string[] = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2 * 1.08 - 2.3;
    const wob = 1 + (h1(i * 0.3, 5) - 0.5) * 0.04 + (i / N) * 0.06;
    ell.push(`${(ecx + Math.cos(t) * erx * wob).toFixed(1)} ${(ecy + Math.sin(t) * ery * wob).toFixed(1)}`);
  }
  const ringK = eo3(seg(frame, tRing, tRing + 15));
  const ellLen = Math.PI * (erx + ery) * 1.15;

  // ---- red block slam (.14 s from 1.5×)
  const bt = frame - tBlock;
  const bScale = bt < 0 ? 0 : bt < 1 ? 1.5 : bt < 2 ? 1.18 : bt < 3 ? 0.98 : 1;
  const numFs = Math.min(block.h * (portrait ? 0.7 : 0.55), (block.w * 0.62) / Math.max(1, number.length * 0.5));

  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${s1x + s2x}px, ${s1y + s2y}px) scale(${push})`, transformOrigin: portrait ? '50% 35%' : '35% 50%'}}>
        {/* the page */}
        <div
          style={{
            position: 'absolute',
            left: page.x,
            top: page.y,
            width: page.w,
            height: page.h,
            transform: `translateY(${(1 - pIn) * -h}px) rotate(${lerp(tilt * 2.5, tilt, pIn)}deg)`,
            boxShadow: `0 ${18 * u}px ${50 * u}px rgba(0,0,0,0.45)`,
            background: pageCol,
          }}
        >
          <svg width={page.w} height={page.h} style={{position: 'absolute', inset: 0}}>
            <defs>
              <filter id="dmh-rough" x="-5%" y="-30%" width="110%" height="160%">
                <feTurbulence type="fractalNoise" baseFrequency={0.06 / u} numOctaves={3} seed={6} result="t" />
                <feDisplacementMap in="SourceGraphic" in2="t" scale={7 * u} xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            <rect x={pad} y={headerY + fs * 0.6} width={page.w - 2 * pad} height={1.5 * u} fill={ink} opacity={0.6} />
            <text x={pad} y={headerY} fontFamily={lf.spaceMono} fontWeight={700} fontSize={fs * 0.78} fill={ink} letterSpacing={1.5 * u}>
              {header.toUpperCase()}
            </text>
            <text x={pad} y={headingY} fontFamily={lf.oswald} fontWeight={700} fontSize={headingFs} fill={ink} textLength={headingW} lengthAdjust="spacingAndGlyphs">
              {heading.toUpperCase()}
            </text>
            <text x={pad} y={dateY} fontFamily={lf.spaceMono} fontSize={fs * 0.85} fill={ink} opacity={0.75}>
              {date}
            </text>
            {/* marker bars sweep in reading order, multiply over the ink */}
            <g style={{mixBlendMode: 'multiply'}} filter="url(#dmh-rough)">
              {(() => {
                let before = 0;
                return marked.map((l, i) => {
                  const a0 = before / totalChars;
                  before += l.text.length;
                  const a1 = before / totalChars;
                  const k = seg(markK, a0, a1);
                  const full = l.text.length * fs * 0.6 + fs * 0.4;
                  return k > 0 ? <rect key={i} x={pad - fs * 0.2} y={l.y - fs * 0.95} width={full * k} height={fs * 1.32} fill={red} opacity={0.88} /> : null;
                });
              })()}
            </g>
            {lines.map((l, i) => (
              <text key={i} x={pad} y={l.y} fontFamily={lf.spaceMono} fontSize={fs} fill={ink} opacity={0.92}>
                {l.text}
              </text>
            ))}
            <path d={`M${ell.join('L')}`} fill="none" stroke={red} strokeWidth={5 * u} strokeLinecap="round" strokeDasharray={ellLen} strokeDashoffset={ellLen * (1 - ringK)} filter="url(#dmh-rough)" opacity={ringK > 0 ? 0.95 : 0} />
            {/* ledger table */}
            {ledger.map((row, i) => {
              const [a, b] = row.split('|');
              const yy = ledgerY + i * lh;
              if (yy > page.h - pad) return null;
              return (
                <g key={'l' + i} opacity={0.8}>
                  <text x={pad} y={yy} fontFamily={lf.spaceMono} fontSize={fs * 0.82} fill={ink}>{a}</text>
                  <text x={page.w - pad} y={yy} textAnchor="end" fontFamily={lf.spaceMono} fontWeight={700} fontSize={fs * 0.82} fill={ink}>{b ?? ''}</text>
                  <line x1={pad} x2={page.w - pad} y1={yy + fs * 0.45} y2={yy + fs * 0.45} stroke={ink} strokeOpacity={0.25} strokeWidth={1 * u} strokeDasharray={`${2 * u} ${4 * u}`} />
                </g>
              );
            })}
            {/* page number */}
            <text x={page.w - pad} y={page.h - pad * 0.5} textAnchor="end" fontFamily={lf.spaceMono} fontSize={fs * 0.7} fill={ink} opacity={0.5}>
              — 7 —
            </text>
          </svg>
        </div>
        {/* the key number repeats huge in a red block */}
        {bt >= 0 && (
          <div
            style={{
              position: 'absolute',
              left: block.x,
              top: block.y,
              width: block.w,
              height: block.h,
              background: red,
              transform: `scale(${bScale}) rotate(${-1.5}deg)`,
              boxShadow: `${10 * u}px ${10 * u}px 0 ${ground === 'ink' ? 'rgba(0,0,0,0.5)' : ink}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: `0 ${block.w * 0.08}px`,
              boxSizing: 'border-box',
            }}
          >
            <div style={{display: 'flex', alignItems: 'baseline', gap: numFs * 0.1, whiteSpace: 'nowrap'}}>
              <span style={{fontFamily: lf.oswald, fontWeight: 700, fontSize: numFs, lineHeight: 0.92, color: paper}}>{number}</span>
              <span style={{fontFamily: lf.oswald, fontWeight: 600, fontSize: numFs * 0.28, color: ink}}>{unit.toUpperCase()}</span>
            </div>
            <div style={{fontFamily: lf.spaceMono, fontWeight: 700, fontSize: 19 * u, color: paper, letterSpacing: 1.5 * u, marginTop: 12 * u, opacity: seg(frame, tBlock + 6, tBlock + 10)}}>{caption.toUpperCase()}</div>
          </div>
        )}
      </AbsoluteFill>
      <PaperFibre w={w} h={h} id="dmh-fibre" opacity={ground === 'ink' ? 0.25 : 0.5} />
    </AbsoluteFill>
  );
};

export const documentMarkerHighlight = defineMotion<Props>({
  id: 'document-marker-highlight',
  title: 'Document marker highlight',
  category: 'document',
  description:
    'A tilted typed document slams onto an ink ground; a red highlighter bar sweeps across one exact sentence (multiply, rough edges), a hand-drawn red ellipse circles the heading, then the key number slams in huge on a red block beside the page — constructivist ink, paper and one red.',
  source: ['lemo-opuscar styles/kino-montage (MIT, LemoLab) — STYLE.md §6 document close-up, DEMO.md shot 8'],
  useFor: 'Evidence explainers, legal/finance/news videos, "the report says…" beats, investor updates. (A dark-desk yellow-highlighter take lives in doc-highlight-evidence.)',
  durationInFrames: 180,
  defaultProps: {
    header: 'Northwind Works · Report No. 7',
    heading: 'Progress report',
    date: 'Filed 12 March — Construction office',
    paragraphs: [
      'Steel for the upper floors arrived on time and crews kept to a four-and-a-half-day week through the winter.',
      'The frame rose at an average of four floors every week, a pace no tower in the city had matched before.',
      'Masonry, glass and lifts followed close behind the steel, so each floor was finished soon after it was framed.',
    ],
    ledger: ['Floors framed, week 1|4', 'Floors framed, week 2|5', 'Floors framed, week 3|4', 'Crew on site|3,400', 'Days ahead of plan|11'],
    highlight: 1,
    number: '4',
    unit: 'floors / week',
    caption: 'Average pace of the steel frame',
    tilt: -4,
    red: KINO.red,
    ink: KINO.ink,
    paper: KINO.paper,
    ground: 'ink',
  },
  propDocs: {
    header: 'small mono header line of the page',
    heading: 'page heading (gets the red ellipse)',
    date: 'mono line under the heading',
    paragraphs: 'body paragraphs (typed, wrapped automatically)',
    ledger: "table rows under the text, 'label|value'",
    highlight: 'index of the paragraph the red marker sweeps over',
    number: 'key number repeated huge on the red block',
    unit: 'unit beside the number',
    caption: 'mono caption under the number',
    tilt: 'page tilt in degrees (3–6 either way)',
    red: 'the one red',
    ink: 'ink colour',
    paper: 'paper colour',
    ground: "'ink' (dark ground) or 'paper'",
  },
  component: DocumentMarkerHighlight,
  tags: ['document', 'highlight', 'marker', 'evidence', 'report', 'circle', 'annotation', 'constructivist', 'kino', 'red', 'news', 'legal', 'finance', 'number', 'slam', 'paper'],
});
