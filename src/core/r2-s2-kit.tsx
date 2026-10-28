/**
 * r2-s2-kit — shared helpers for batch S-2 (x8 iso-hardware UI chrome, toon character kit, riso plate scene).
 * Everything is a pure function of the frame: no Math.random, no timers. Original designs, neutral copy.
 */
import React from 'react';
import {ISO, cl, easeInOutCubic, easeOutBack, easeOutCubic, isoPt, lin, x58Fonts} from './r2-x58-kit';
import {n2} from './random';

// ============================================================================================================
// iso-hardware UI chrome (circuit-rebuild, auto-frame-camera, lesson-carousel)
// ============================================================================================================

/** dark top bar with a section word, a teal progress bar "n/N" and a static label on the right */
export const IsoHeader: React.FC<{w: number; h: number; u: number; title: string; index: number; total: number; right?: string; accent?: string}> = ({w, h, u, title, index, total, right, accent = ISO.teal}) => {
  const bh = Math.max(46 * u, h * 0.065);
  const fs = bh * 0.34;
  const barW = Math.min(w * 0.16, 190 * u);
  return (
    <g>
      <rect x={0} y={0} width={w} height={bh} fill={ISO.header} />
      <text x={w * 0.025} y={bh * 0.64} fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={fs * 1.15} letterSpacing={fs * 0.12} fill="#F4ECDB">
        {title.toUpperCase()}
      </text>
      <g transform={`translate(${w * 0.025 + (title.length * fs * 0.95 + fs * 2)} ${bh * 0.5})`}>
        <rect x={0} y={-fs * 0.2} width={barW} height={fs * 0.4} rx={fs * 0.2} fill="#4A4F63" />
        <rect x={0} y={-fs * 0.2} width={barW * cl(index / Math.max(1, total))} height={fs * 0.4} rx={fs * 0.2} fill={accent} />
        <text x={barW + fs * 0.7} y={fs * 0.35} fontFamily={x58Fonts.mono} fontSize={fs * 0.9} fill="#F4ECDB">
          {index}/{total}
        </text>
      </g>
      {right ? (
        <text x={w * 0.975} y={bh * 0.62} textAnchor="end" fontFamily={x58Fonts.mono} fontSize={fs * 0.9} fill="#C9B79C">
          {right}
        </text>
      ) : null}
    </g>
  );
};

/** paper info card (step number chip + title + body); `fade` 0..1 cross-fades the text */
export const IsoInfoCard: React.FC<{x: number; y: number; w: number; h: number; u: number; step: number; title: string; text: string; fade?: number; accent?: string; maxChars?: number}> = ({x, y, w, h, u, step, title, text, fade = 1, accent = ISO.teal, maxChars = 46}) => {
  const fs = Math.min(h * 0.19, 22 * u * 1.3);
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    if ((cur + ' ' + wd).trim().length > maxChars) {
      lines.push(cur);
      cur = wd;
    } else cur = (cur + ' ' + wd).trim();
  }
  if (cur) lines.push(cur);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={10 * u} fill={ISO.card} stroke={ISO.border} strokeWidth={1.5 * u} />
      <g opacity={fade}>
        <circle cx={h * 0.3} cy={h * 0.3} r={fs * 0.85} fill={accent} />
        <text x={h * 0.3} y={h * 0.3 + fs * 0.36} textAnchor="middle" fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={fs * 1.05} fill="#fff">
          {step}
        </text>
        <text x={h * 0.3 + fs * 1.5} y={h * 0.3 + fs * 0.36} fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={fs * 1.2} letterSpacing={fs * 0.06} fill={ISO.text}>
          {title.toUpperCase()}
        </text>
        {lines.slice(0, 3).map((ln, i) => (
          <text key={i} x={h * 0.3 - fs * 0.85} y={h * 0.3 + fs * 1.9 + i * fs * 1.3} fontFamily={x58Fonts.barlow} fontSize={fs * 0.95} fill={ISO.muted}>
            {ln}
          </text>
        ))}
      </g>
    </g>
  );
};

/** scale a drawn part around a base point (grow-from-tile) and fade it */
export const around = (bx: number, by: number, s: number, op: number, children: React.ReactNode) => (
  <g opacity={op} transform={`translate(${bx} ${by}) scale(${s}) translate(${-bx} ${-by})`}>
    {children}
  </g>
);

export {easeInOutCubic, easeOutBack, easeOutCubic, isoPt, lin, n2};
