// Adapted from lemo-opuscar/styles/news-package/demo/main.js (rundown) (MIT, © LemoLab) — see THIRD_PARTY_NOTICES.md
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {NEWS, NewsStudioBg, back, eo, fitW, lbf, lerp, seg} from '../../core/r2-lb1-kit';

/**
 * Bulletin rundown: a date block (huge numerals, lemon month, mono week, title + caps line) pushes up out of masks on
 * the left while 3–5 ink rows (lemon number block, title + sub, mono date) flip open one per beat with a lemon light
 * sweep; the first row gets a pulsing outline ("this one first"). Recap: a lemon tick disc pops on each row.
 */

type Row = {n?: string; title: string; sub: string; date: string};
type Props = {
  date: {big: string; month: string; week: string};
  title: string;
  subtitle: string;
  rows: Row[];
  mode: 'open' | 'recap' | 'both';
  startFrame: number;
  rowEvery: number;
  tickAt: number;
  accent: string;
  gold: string;
  ink: string;
  paper: string;
  highlightFirst: boolean;
  backdrop: 'studio' | 'none';
  background: string;
};

const RundownBoard: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const id = 'rundown-board';
  const f = frame - p.startFrame;
  const recapOnly = p.mode === 'recap';
  const rows = p.rows.slice(0, 6);
  const n = rows.length;
  const pitch = 140 * u;
  const rowH = 120 * u;
  const mX = (portrait ? 54 : 96) * u;
  const rowW = portrait ? w - 2 * mX : Math.min(1024 * u, w * 0.55);
  const rowX = portrait ? mX : w - mX - rowW;
  const listH = (n - 1) * pitch + rowH;
  const rowY0 = portrait ? h * 0.44 : h / 2 - listH / 2;
  const numW = 140 * u;
  // date block
  const dX = mX;
  const dY = portrait ? h * 0.1 : h / 2 - 250 * u;
  const dW = portrait ? w - 2 * mX : rowX - mX - 60 * u;
  const bigSize = fitW(p.date.big, 230 * u, dW, 'barlow');
  const push = (d: number) => (recapOnly ? 1 : eo(seg(f, d, d + 12)));
  const mask = (y: number, hh: number, d: number, child: React.ReactNode, key: string) => {
    const k = push(d);
    return (
      <g key={key}>
        <defs>
          <clipPath id={`${id}-${key}`}>
            <rect x={dX - 10 * u} y={y - hh} width={dW + 40 * u} height={hh * 1.3} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-${key})`}>
          <g transform={`translate(0 ${(1 - k) * hh * 1.1})`}>{child}</g>
        </g>
      </g>
    );
  };
  const lastLand = 14 + (n - 1) * p.rowEvery + 9;
  const hiK = p.highlightFirst && !recapOnly ? seg(f, lastLand + 45, lastLand + 52) : 0;
  const tickStart = recapOnly ? 15 : p.tickAt;
  const showTicks = p.mode !== 'open';
  const zoom = 1 + 0.03 * (frame / durationInFrames);
  const titleSize = fitW(p.title, 52 * u, dW, 'barlow');
  const subSize = fitW(p.subtitle.toUpperCase(), 22 * u, dW, 'barlow', 0.12);
  return (
    <AbsoluteFill style={{background: p.backdrop === 'studio' ? p.ink : p.background, overflow: 'hidden'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {p.backdrop === 'studio' && <NewsStudioBg id={id} frame={frame} w={w} h={h} u={u} ink={p.ink} accent={p.accent} paper={p.paper} />}
        <defs>
          <linearGradient id={`${id}-sw`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={p.accent} stopOpacity={0} />
            <stop offset="0.7" stopColor={p.accent} stopOpacity={0.28} />
            <stop offset="1" stopColor={p.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform={`translate(${w / 2} ${h / 2}) scale(${zoom}) translate(${-w / 2} ${-h / 2})`}>
          {/* date block */}
          {mask(
            dY + bigSize * 0.8,
            bigSize * 0.85,
            0,
            <text x={dX} y={dY + bigSize * 0.8} fontFamily={lbf('barlow')} fontWeight={800} fontSize={bigSize} fill={p.paper}>
              {p.date.big}
            </text>,
            'big',
          )}
          {mask(
            dY + bigSize * 0.8 + 66 * u,
            62 * u,
            5,
            <text x={dX} y={dY + bigSize * 0.8 + 66 * u} fontFamily={lbf('barlow')} fontWeight={800} fontSize={60 * u} letterSpacing="0.04em" fill={p.accent}>
              {p.date.month.toUpperCase()}
              <tspan dx={18 * u} fontFamily={lbf('plex')} fontWeight={500} fontSize={20 * u} fill={p.gold} letterSpacing="0.2em">
                {p.date.week.toUpperCase()}
              </tspan>
            </text>,
            'month',
          )}
          {mask(
            dY + bigSize * 0.8 + 140 * u,
            titleSize,
            9,
            <text x={dX} y={dY + bigSize * 0.8 + 140 * u} fontFamily={lbf('barlow')} fontWeight={800} fontSize={titleSize} fill={p.paper}>
              {p.title}
            </text>,
            'title',
          )}
          {mask(
            dY + bigSize * 0.8 + 178 * u,
            subSize * 1.2,
            12,
            <text x={dX} y={dY + bigSize * 0.8 + 178 * u} fontFamily={lbf('barlow')} fontWeight={600} fontSize={subSize} letterSpacing="0.12em" fill={p.paper} opacity={0.6}>
              {p.subtitle.toUpperCase()}
            </text>,
            'sub',
          )}
          {/* rows */}
          {rows.map((r, i) => {
            const a = 14 + i * p.rowEvery;
            const fk = recapOnly ? 1 : back(seg(f, a, a + 9), 2.0);
            if (fk <= 0) return null;
            const y = rowY0 + i * pitch;
            const sw = recapOnly ? 0 : seg(f, a + 10, a + 23);
            const tk = showTicks ? back(seg(f, tickStart + i * 12, tickStart + i * 12 + 7), 2.6) : 0;
            const textW = rowW - numW - 60 * u - 150 * u - (tk > 0 ? 60 * u : 0);
            const ts = fitW(r.title, 40 * u, textW, 'barlow');
            const ss = fitW(r.sub.toUpperCase(), 19 * u, textW, 'barlow', 0.1);
            const pulse = hiK > 0 && i === 0 ? hiK * (0.6 + 0.4 * Math.cos(4 * Math.PI * ((f - lastLand - 45) / 30))) : 0;
            return (
              <g key={i} transform={`translate(0 ${y + rowH / 2}) scale(1 ${fk}) translate(0 ${-(y + rowH / 2)})`}>
                <rect x={rowX} y={y} width={rowW} height={rowH} fill={NEWS.ink2} />
                <rect x={rowX} y={y} width={numW} height={rowH} fill={p.accent} />
                <text x={rowX + numW / 2} y={y + rowH * 0.68} textAnchor="middle" fontFamily={lbf('barlow')} fontWeight={800} fontSize={58 * u} fill={p.ink}>
                  {r.n ?? String(i + 1).padStart(2, '0')}
                </text>
                <text x={rowX + numW + 30 * u} y={y + rowH * 0.5} fontFamily={lbf('barlow')} fontWeight={800} fontSize={ts} fill={p.paper}>
                  {r.title}
                </text>
                <text x={rowX + numW + 30 * u} y={y + rowH * 0.78} fontFamily={lbf('barlow')} fontWeight={600} fontSize={ss} letterSpacing="0.1em" fill={p.gold}>
                  {r.sub.toUpperCase()}
                </text>
                <text x={rowX + rowW - 28 * u - (tk > 0 ? 64 * u : 0)} y={y + rowH * 0.56} textAnchor="end" fontFamily={lbf('plex')} fontWeight={500} fontSize={17 * u} letterSpacing="0.14em" fill={p.paper} opacity={0.55}>
                  {r.date.toUpperCase()}
                </text>
                {sw > 0 && sw < 1 && <rect x={lerp(rowX - 160 * u, rowX + rowW, eo(sw))} y={y} width={160 * u} height={rowH} fill={`url(#${id}-sw)`} />}
                {pulse > 0 && <rect x={rowX - 4 * u} y={y - 4 * u} width={rowW + 8 * u} height={rowH + 8 * u} fill="none" stroke={p.accent} strokeWidth={4 * u} opacity={pulse} />}
                {tk > 0 && (
                  <g transform={`translate(${rowX + rowW - 46 * u} ${y + rowH / 2}) scale(${tk})`}>
                    <circle r={30 * u} fill={p.accent} />
                    <path d={`M${-13 * u} ${1 * u}L${-4 * u} ${10 * u}L${14 * u} ${-10 * u}`} fill="none" stroke={p.ink} strokeWidth={7 * u} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const rundownBoard = defineMotion<Props>({
  id: 'rundown-board',
  title: 'Rundown board (today in this video)',
  category: 'text',
  description:
    'News rundown: a date block (huge numerals, lemon month, mono week, title) pushes up out of masks while ink story rows with lemon number blocks flip open one per beat with a light sweep; the first row pulses; in recap a lemon tick disc pops onto each row.',
  source: ['lemo-opuscar styles/news-package (MIT code, CC BY 4.0 docs, LemoLab) — demo/main.js rundown'],
  useFor: '"Today in this video" agendas, episode chapter lists, top-N intros and tick-off recaps at the end.',
  durationInFrames: 180,
  defaultProps: {
    date: {big: '12–18', month: 'March', week: 'Week 11'},
    title: 'This week',
    subtitle: 'The stories we are following',
    rows: [
      {title: 'Northwind posts record quarter', sub: 'Markets · earnings', date: 'Mon 12'},
      {title: 'Lumen opens a research lab', sub: 'Tech · hiring', date: 'Tue 13'},
      {title: 'City trials night buses', sub: 'Transport · pilot', date: 'Thu 15'},
      {title: 'Rain returns to the valley', sub: 'Weather · outlook', date: 'Sat 17'},
    ],
    mode: 'both',
    startFrame: 0,
    rowEvery: 12,
    tickAt: 120,
    accent: NEWS.accent,
    gold: NEWS.gold,
    ink: NEWS.ink,
    paper: NEWS.paper,
    highlightFirst: true,
    backdrop: 'studio',
    background: 'transparent',
  },
  propDocs: {
    date: 'date block {big numerals, month, week}',
    title: 'block title',
    subtitle: 'caps line under the title',
    rows: 'story rows [{n?, title, sub, date}] (3–6)',
    mode: '"open" (rows flip in), "recap" (rows already in, ticks pop) or "both" (open then tick off)',
    startFrame: 'delay',
    rowEvery: 'frames between row flips (one per beat)',
    tickAt: 'frame the first tick pops (mode both)',
    accent: 'lemon accent',
    gold: 'gold sub-lines',
    ink: 'ink background',
    paper: 'paper text',
    highlightFirst: 'pulse an outline on the first row',
    backdrop: '"studio" or "none" (overlay)',
    background: 'background when backdrop is "none"',
  },
  component: RundownBoard,
  tags: ['rundown', 'agenda', 'list', 'chapters', 'news', 'broadcast', 'checklist', 'recap', 'tick', 'top n', 'today in this video', 'table of contents'],
});
