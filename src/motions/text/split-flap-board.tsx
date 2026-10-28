import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, prog} from '../../core/ease';
import {useStage} from '../../core/stage';
import {Bg, h01, hexA} from '../../core/kinetic-type-kit';
import {tfonts, TFont} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Split-flap board (Solari): a grid of mechanical flap cells that clatter through the alphabet to show each
 * message in turn. Every cell has its own two-half flap — the upper half folds down, the lower half of the new
 * character falls into place — and cells start a few frames apart (left to right, with a little jitter), so a
 * message ripples across the board. Messages are plain strings (\n = new row), auto-wrapped to the board width.
 */

type Props = {
  messages: string[];
  title: string;
  accentRows: number[];
  alphabet: string;
  columns: number;
  flipFrames: number;
  maxFlips: number;
  colStagger: number;
  rowStagger: number;
  jitter: number;
  startAt: number;
  hold: number;
  uppercase: boolean;
  font: TFont;
  weight: number;
  background: string;
  cellBg: string;
  ink: string;
  accent: string;
};

const wrapTo = (msg: string, cols: number): string[] => {
  const out: string[] = [];
  for (const para of msg.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = '';
    const push = () => {
      out.push(line);
      line = '';
    };
    for (let wd of words) {
      while (wd.length > cols) {
        if (line) push();
        out.push(wd.slice(0, cols));
        wd = wd.slice(cols);
      }
      if (!line) line = wd;
      else if (line.length + 1 + wd.length <= cols) line += ` ${wd}`;
      else {
        push();
        line = wd;
      }
    }
    if (line) push();
  }
  return out;
};

const Half: React.FC<{ch: string; which: 'top' | 'bot'; cw: number; chH: number; bg: string; ink: string; font: string; weight: number; shade?: number; radius: number}> = ({ch, which, cw, chH, bg, ink, font, weight, shade = 0, radius}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width: cw,
      height: chH / 2,
      [which === 'top' ? 'top' : 'bottom']: 0,
      overflow: 'hidden',
      background: bg,
      borderRadius: which === 'top' ? `${radius}px ${radius}px 0 0` : `0 0 ${radius}px ${radius}px`,
      backfaceVisibility: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: which === 'top' ? 0 : -chH / 2,
        width: cw,
        height: chH,
        lineHeight: `${chH}px`,
        textAlign: 'center',
        fontFamily: font,
        fontWeight: weight,
        fontSize: chH * 0.74,
        color: ink,
        whiteSpace: 'pre',
      }}
    >
      {ch}
    </div>
    {shade > 0 ? <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${shade})`}} /> : null}
  </div>
);

const SplitFlap: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, square} = useStage();
  const msgs = (p.messages.length ? p.messages : [' ']).map((m) => (p.uppercase ? m.toUpperCase() : m));
  const alpha = [...(p.alphabet || ' ')];
  const A = alpha.length;

  // board geometry
  const cap = portrait ? 10 : square ? 14 : 20;
  const longest = Math.max(...msgs.flatMap((m) => m.split('\n').map((l) => l.length)), 1);
  const C = Math.max(3, Math.round(p.columns > 0 ? p.columns : Math.min(cap, Math.max(6, longest))));
  const wrapped = msgs.map((m) => wrapTo(m, C));
  const R = Math.max(1, ...wrapped.map((l) => l.length));
  const titleH = p.title ? 44 * u : 0;
  const gapK = 0.09;
  const availW = w * 0.9;
  const availH = h * 0.78 - titleH;
  const cellW = Math.min(150 * u, availW / (C + (C - 1) * gapK), availH / (R * 1.42 + (R - 1) * gapK * 1.0));
  const cellH = cellW * 1.42;
  const gap = cellW * gapK;
  const boardW = C * cellW + (C - 1) * gap;
  const boardH = R * cellH + (R - 1) * gap;
  const bx = (w - boardW) / 2;
  const by = (h - boardH - titleH) / 2 + titleH;
  const radius = cellW * 0.1;

  const period = p.hold + p.maxFlips * p.flipFrames + C * p.colStagger + (R - 1) * p.rowStagger;
  const f = Math.max(1, p.flipFrames);

  const charAt = (m: number, r: number, c: number) => (m < 0 ? ' ' : wrapped[m][r]?.[c] ?? ' ');

  const cellState = (r: number, c: number) => {
    let m = -1;
    for (let k = 0; k < msgs.length; k++) {
      const start = p.startAt + k * period + c * p.colStagger + r * p.rowStagger + h01(r * 37 + c, k, 5) * p.jitter;
      if (frame >= start) m = k;
    }
    if (m < 0) return {top: ' ', bot: ' ', flip: -1, from: ' ', to: ' '};
    const start = p.startAt + m * period + c * p.colStagger + r * p.rowStagger + h01(r * 37 + c, m, 5) * p.jitter;
    const to = charAt(m, r, c);
    const from = charAt(m - 1, r, c);
    if (to === from) return {top: to, bot: to, flip: -1, from, to};
    const ti = alpha.indexOf(to);
    const oi = alpha.indexOf(from);
    let seq: string[];
    if (ti < 0 || oi < 0) seq = [from, to];
    else {
      const dist = (ti - oi + A) % A;
      const k = Math.max(1, Math.min(dist, p.maxFlips));
      seq = [from];
      for (let j = 0; j < k; j++) seq.push(alpha[(ti - (k - 1) + j + A * 4) % A]);
    }
    const local = frame - start;
    const steps = seq.length - 1;
    if (local >= steps * f) return {top: to, bot: to, flip: -1, from, to};
    const s = Math.floor(local / f);
    const pp = (local % f) / f;
    return {top: seq[s + 1], bot: seq[s], flip: pp, from: seq[s], to: seq[s + 1]};
  };

  const font = tfonts[p.font];
  const enter = prog(frame, 0, 14, ease.out);

  return (
    <Bg background={p.background} glow={p.accent} glowAmount={0.06}>
      {p.title ? (
        <div
          style={{
            position: 'absolute',
            left: bx,
            top: by - titleH,
            width: boardW,
            height: titleH,
            fontFamily: tfonts.mono,
            fontSize: Math.max(14 * u, cellW * 0.2),
            letterSpacing: cellW * 0.06,
            color: p.accent,
            textTransform: 'uppercase',
            opacity: enter,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            lineHeight: `${titleH}px`,
          }}
        >
          {p.title}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: bx - cellW * 0.25, top: by - cellW * 0.25, width: boardW + cellW * 0.5, height: boardH + cellW * 0.5, borderRadius: cellW * 0.22, background: hexA('#000000', 0.35), boxShadow: `0 ${cellW * 0.2}px ${cellW * 0.6}px rgba(0,0,0,0.45)`, opacity: enter}} />
      {Array.from({length: R}).map((_, r) =>
        Array.from({length: C}).map((__, c) => {
          const st = cellState(r, c);
          const ink = p.accentRows.includes(r) ? p.accent : p.ink;
          const common = {cw: cellW, chH: cellH, bg: p.cellBg, ink, font, weight: p.weight, radius};
          const flipping = st.flip >= 0;
          const pp = st.flip;
          return (
            <div key={`${r}-${c}`} style={{position: 'absolute', left: bx + c * (cellW + gap), top: by + r * (cellH + gap), width: cellW, height: cellH, perspective: cellH * 4, opacity: enter}}>
              {/* resting halves */}
              <Half {...common} ch={st.top} which="top" shade={flipping && pp < 0.5 ? 0.25 * pp * 2 : 0} />
              <Half {...common} ch={flipping && pp >= 0.5 ? st.top : st.bot} which="bot" shade={flipping && pp < 1 ? 0.3 * (1 - pp) : 0} />
              {/* falling upper flap: old character */}
              {flipping && pp < 0.5 ? (
                <div style={{position: 'absolute', left: 0, top: 0, width: cellW, height: cellH / 2, transformOrigin: '50% 100%', transform: `rotateX(${-(pp / 0.5) * 90}deg)`, transformStyle: 'preserve-3d', zIndex: 3}}>
                  <Half {...common} ch={st.bot} which="top" shade={0.45 * (pp / 0.5)} />
                </div>
              ) : null}
              {/* arriving lower flap: new character */}
              {flipping && pp >= 0.5 ? (
                <div style={{position: 'absolute', left: 0, top: cellH / 2, width: cellW, height: cellH / 2, transformOrigin: '50% 0%', transform: `rotateX(${90 - ((pp - 0.5) / 0.5) * 90}deg)`, zIndex: 3}}>
                  <Half {...common} ch={st.top} which="bot" shade={0.4 * (1 - (pp - 0.5) / 0.5)} />
                </div>
              ) : null}
              {/* hinge line and pins */}
              <div style={{position: 'absolute', left: 0, width: cellW, top: cellH / 2 - Math.max(1, cellW * 0.012), height: Math.max(2, cellW * 0.024), background: 'rgba(0,0,0,0.85)', zIndex: 5}} />
              <div style={{position: 'absolute', left: -cellW * 0.02, top: cellH / 2 - cellW * 0.03, width: cellW * 0.05, height: cellW * 0.06, background: 'rgba(0,0,0,0.6)', zIndex: 6}} />
              <div style={{position: 'absolute', right: -cellW * 0.02, top: cellH / 2 - cellW * 0.03, width: cellW * 0.05, height: cellW * 0.06, background: 'rgba(0,0,0,0.6)', zIndex: 6}} />
            </div>
          );
        }),
      )}
    </Bg>
  );
};

export const splitFlapBoard = defineMotion<Props>({
  id: 'split-flap-board',
  title: 'Split-flap board',
  category: 'text',
  description:
    'A mechanical split-flap (Solari) departure board: a grid of two-half flap cells clatters through the alphabet, the upper flap folding down and the lower flap of the new letter dropping in, rippling across the board to spell each message in turn — auto-sized to the text, wrapped to the board width.',
  source: ['original — generic kinetic-type effect (R3)'],
  useFor: 'Announcements, schedules, countdown/updates, retro tech titles, "coming soon" reveals, scoreboards and price boards; give it messages[] with \\n for rows.',
  durationInFrames: 240,
  defaultProps: {
    messages: ['WELCOME\nTO THE SHOW\nDOORS OPEN 7PM', 'SOLD OUT\nTONIGHT\nTHANK YOU'],
    title: 'Now showing',
    accentRows: [0],
    alphabet: " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-!?'/&,",
    columns: 0,
    flipFrames: 3,
    maxFlips: 12,
    colStagger: 1.5,
    rowStagger: 5,
    jitter: 5,
    startAt: 10,
    hold: 70,
    uppercase: true,
    font: 'grotesk',
    weight: 700,
    background: '#121212',
    cellBg: '#232326',
    ink: '#F1E9D2',
    accent: '#FFB320',
  },
  propDocs: {
    messages: 'array of messages shown one after another; \\n starts a new row, long rows wrap to the board width',
    title: 'small label above the board ("" to hide)',
    accentRows: 'row numbers (0-based) drawn in the accent colour',
    alphabet: 'characters the flaps cycle through, in order',
    columns: 'board width in cells (0 = fit the longest line, capped per format)',
    flipFrames: 'frames per single flap (2 = fast clatter, 5 = lazy)',
    maxFlips: 'most flaps a cell flips before landing (long cycles are shortened to this)',
    colStagger: 'frames between neighbouring columns starting to flip',
    rowStagger: 'frames between rows',
    jitter: 'random extra start delay per cell in frames',
    startAt: 'frame the first message starts flipping',
    hold: 'frames a message stays readable before the next one flips',
    uppercase: 'upper-case all text (the default alphabet is upper-case)',
    font: 'font role for the characters',
    weight: 'font weight',
    background: 'background colour; "transparent" for an overlay',
    cellBg: 'flap colour',
    ink: 'character colour',
    accent: 'title and accent-row colour',
  },
  component: SplitFlap,
  tags: ['text', 'split-flap', 'solari', 'departure board', 'flip', 'board', 'retro', 'schedule', 'announcement', 'scoreboard', 'ticker', 'typography', 'kinetic', 'mechanical'],
});
