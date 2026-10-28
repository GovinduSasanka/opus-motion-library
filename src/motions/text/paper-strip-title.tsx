// Adapted from lemo-opuscar/styles/paper-lantern/demo/src/shots/s17_sushi.js (poem reveal), s13_note.js (reveal) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {back, brushFont, eo, fitW, lbf, seg} from '../../core/r2-lb1-kit';

/**
 * Paper-strip title: vertical columns of brush calligraphy on cut gold-paper strips grow out of their anchor edge like
 * a scroll unrolling (the strip is uncovered — glyphs never squash), one column per beat, each strip casting a soft
 * shadow; then a small red seal stamps beside the last column. Horizontal (Latin) mode uses the same unroll.
 */

type Props = {
  columns: string[];
  vertical: boolean;
  stripColor: string;
  stripColor2: string;
  inkColor: string;
  seal: string;
  sealColor: string;
  startFrame: number;
  columnFrames: number;
  stagger: number;
  size: number;
  anchor: 'top' | 'bottom' | 'left';
  backdrop: string;
  background: string;
};

const PaperStripTitle: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, cx} = useStage();
  const id = 'paper-strip-title';
  const cols = p.columns.filter(Boolean);
  const fam = /[⺀-鿿぀-ヿ]/.test(cols.join('')) ? brushFont(cols.join('') + p.seal) : lbf('cormorant');
  const transparent = p.background === 'transparent';
  const f = frame - p.startFrame;
  const n = cols.length;
  const maxChars = Math.max(1, ...cols.map((c) => [...c].length));
  const fs = p.vertical ? Math.min(p.size * u, (h * (portrait ? 0.62 : 0.72) * 0.94) / maxChars / 1.16 / 1.06, (w * 0.8) / Math.max(1, cols.length) / 1.9) : p.size * u;
  const pad = fs * 0.55;
  const gapX = fs * 1.9;
  const sealSize = fs * 0.78;
  const lastDone = (n - 1) * p.stagger + p.columnFrames;
  const sealK = back(seg(f, lastDone + 18, lastDone + 27), 1.8);
  if (p.vertical) {
    // vertical-rl: first column at the right
    const stripW = fs * 1.5;
    const totalW = n * gapX;
    const x0 = cx + totalW / 2 - gapX / 2;
    const yTop = h * 0.48 - Math.min(h * (portrait ? 0.62 : 0.72), maxChars * fs * 1.16 + pad * 2) / 2;
    const maxH = h * (portrait ? 0.62 : 0.72);
    return (
      <AbsoluteFill style={{background: transparent ? 'transparent' : `radial-gradient(ellipse at 50% 40%, #2E4478 0%, ${p.backdrop} 70%)`, overflow: 'hidden'}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id={`${id}-sh`} x="-40%" y="-20%" width="180%" height="140%">
              <feDropShadow dx={5 * u} dy={7 * u} stdDeviation={7 * u} floodColor="#120B06" floodOpacity={0.45} />
            </filter>
            <filter id={`${id}-fiber`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency={0.5 / u} numOctaves={2} seed={5} result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.18  0 0 0 0.16 0" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          {cols.map((col, i) => {
            const chars = [...col];
            const colH = Math.min(maxH, chars.length * fs * 1.16 + pad * 2);
            const cfs = (colH - pad * 2) / Math.max(1, chars.length) / 1.16;
            const k = eo(seg(f, i * p.stagger, i * p.stagger + p.columnFrames));
            if (k <= 0) return null;
            const x = x0 - i * gapX;
            const y0 = p.anchor === 'bottom' ? yTop + maxH - colH : yTop;
            const revealH = colH * k;
            const clipY = p.anchor === 'bottom' ? y0 + colH - revealH : y0;
            return (
              <g key={i}>
                <defs>
                  <clipPath id={`${id}-c${i}`}>
                    <rect x={x - stripW / 2 - 6 * u} y={clipY} width={stripW + 12 * u} height={revealH} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${id}-c${i})`}>
                  <g filter={`url(#${id}-sh)`}>
                    <rect x={x - stripW / 2} y={y0} width={stripW} height={colH} fill={i % 2 ? p.stripColor2 : p.stripColor} />
                  </g>
                  <rect x={x - stripW / 2} y={y0} width={stripW} height={colH} filter={`url(#${id}-fiber)`} />
                  {chars.map((c, j) => (
                    <text key={j} x={x} y={y0 + pad + cfs * 1.16 * j + cfs * 0.92} textAnchor="middle" fontFamily={fam} fontSize={cfs} fill={p.inkColor}>
                      {c}
                    </text>
                  ))}
                </g>
              </g>
            );
          })}
          {p.seal && sealK > 0 && (
            <g transform={`translate(${x0 - (n - 1) * gapX - stripW / 2 - sealSize * 0.85} ${yTop + Math.min(maxH, [...cols[n - 1]].length * fs * 1.16 + pad * 2) - sealSize * 0.6}) scale(${sealK})`} filter={`url(#${id}-sh)`}>
              <rect x={-sealSize / 2} y={-sealSize / 2} width={sealSize} height={sealSize} rx={sealSize * 0.12} fill={p.sealColor} />
              <text x={0} y={sealSize * 0.3} textAnchor="middle" fontFamily={fam} fontSize={sealSize * 0.72} fill="#F7EBD3">
                {p.seal}
              </text>
            </g>
          )}
        </svg>
      </AbsoluteFill>
    );
  }
  // horizontal: lines unroll from the left
  const lines = cols;
  const yMid = h * 0.5 - ((lines.length - 1) * fs * 2.1) / 2;
  return (
    <AbsoluteFill style={{background: transparent ? 'transparent' : `radial-gradient(ellipse at 50% 40%, #2E4478 0%, ${p.backdrop} 70%)`, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={`${id}-sh2`} x="-20%" y="-40%" width="140%" height="180%">
            <feDropShadow dx={5 * u} dy={7 * u} stdDeviation={7 * u} floodColor="#120B06" floodOpacity={0.45} />
          </filter>
        </defs>
        {lines.map((line, i) => {
          const lfs = fitW(line, fs, w * 0.74, 'cormorant');
          const stripH = lfs * 1.6;
          const stripWd = Math.min(w * 0.8, line.length * lfs * 0.56 + pad * 2.4);
          const k = eo(seg(f, i * p.stagger, i * p.stagger + p.columnFrames));
          if (k <= 0) return null;
          const y = yMid + i * fs * 2.1;
          const x = cx - stripWd / 2;
          return (
            <g key={i}>
              <defs>
                <clipPath id={`${id}-h${i}`}>
                  <rect x={x - 6 * u} y={y - stripH / 2} width={(stripWd + 12 * u) * k} height={stripH} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}-h${i})`}>
                <rect x={x} y={y - stripH / 2} width={stripWd} height={stripH} fill={i % 2 ? p.stripColor2 : p.stripColor} filter={`url(#${id}-sh2)`} />
                <text x={cx} y={y + lfs * 0.32} textAnchor="middle" fontFamily={fam} fontSize={lfs} fill={p.inkColor}>
                  {line}
                </text>
              </g>
            </g>
          );
        })}
        {p.seal && sealK > 0 && (
          <g transform={`translate(${cx + Math.min(w * 0.8, Math.max(...lines.map((l) => l.length)) * fs * 0.56) / 2 + sealSize} ${yMid + (lines.length - 1) * fs * 2.1 + fs}) scale(${sealK})`} filter={`url(#${id}-sh2)`}>
            <rect x={-sealSize / 2} y={-sealSize / 2} width={sealSize} height={sealSize} rx={sealSize * 0.12} fill={p.sealColor} />
            <text x={0} y={sealSize * 0.3} textAnchor="middle" fontFamily={fam} fontSize={sealSize * 0.66} fill="#F7EBD3">
              {p.seal}
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const paperStripTitle = defineMotion<Props>({
  id: 'paper-strip-title',
  title: 'Paper strip title (scroll unroll + seal)',
  category: 'text',
  description:
    'Vertical columns of brush calligraphy on cut gold-paper strips unroll from their anchor edge one per beat — the strip is uncovered, glyphs never squash — each casting a soft shadow, then a small red seal stamps beside the last column; a horizontal serif mode unrolls lines the same way.',
  source: ['lemo-opuscar styles/paper-lantern (MIT code, CC BY 4.0 docs, LemoLab) — demo/src/shots/s17 poem reveal, s13 note reveal'],
  useFor: 'East-Asian festival titles, poems, recipes, letters, wedding / anniversary cards; any "unrolling scroll" title over a dark scene.',
  durationInFrames: 150,
  defaultProps: {
    columns: ['月满人团圆', '灯下共此时'],
    vertical: true,
    stripColor: '#F1DBAC',
    stripColor2: '#F3D998',
    inkColor: '#3A2A1A',
    seal: '印',
    sealColor: '#B3302A',
    startFrame: 6,
    columnFrames: 38,
    stagger: 16,
    size: 160,
    anchor: 'top',
    backdrop: '#121a38',
    background: 'backdrop',
  },
  propDocs: {
    columns: 'vertical: one string per column (right to left); horizontal: one per line',
    vertical: 'vertical CJK columns (true) or horizontal serif lines',
    stripColor: 'paper strip colour (odd columns)',
    stripColor2: 'paper strip colour (even columns)',
    inkColor: 'calligraphy ink',
    seal: 'seal glyph ("" to hide)',
    sealColor: 'seal red',
    startFrame: 'delay before the first column',
    columnFrames: 'frames each column takes to unroll',
    stagger: 'frames between columns (or land them on spoken words)',
    size: 'glyph size in u',
    anchor: 'edge the strips grow from',
    backdrop: 'backdrop colour behind the strips',
    background: '"backdrop" or "transparent" (overlay over any scene, e.g. lightbox-stack)',
  },
  component: PaperStripTitle,
  tags: ['title', 'calligraphy', 'scroll', 'unroll', 'seal', 'chinese', 'cjk', 'festival', 'poem', 'paper', 'gold', 'vertical text', 'overlay'],
});
