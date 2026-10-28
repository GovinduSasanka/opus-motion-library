import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {avatarColor, bgCss, bodyFont, easeIO, easeOut3, headFont, mixHex, sseg, withAlpha, backOut} from '../../core/r3-game-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tournament bracket that plays itself: every entrant sits in the first round, then round by round the winner of each match
 * lights up, its connector line draws on in the accent colour, the winner's name slides into the next round and the loser
 * dims, until the champion card lands. Data-driven: give `teams` (entrants) and `results` (which side won each match).
 * Left-to-right at 16:9, top-to-bottom at 9:16.
 */
type Props = {
  title: string;
  teams: string[];
  results: number[][];
  roundNames: string[];
  championLabel: string;
  background: string;
  surface: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const BYE = 'BYE';

const BracketAdvance: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);

  // ---- data: pad entrants to a power of two (byes advance automatically) and derive every match
  const raw = (P.teams && P.teams.length >= 2 ? P.teams : ['A', 'B']).slice(0, 16).map((s) => String(s));
  let N = 2;
  while (N < raw.length) N *= 2;
  const teams = [...raw, ...Array.from({length: N - raw.length}, () => BYE)];
  const R = Math.log2(N); // number of match rounds
  type Match = {a: string; b: string; win: 0 | 1};
  const rounds: Match[][] = [];
  let entrants = teams;
  for (let r = 0; r < R; r++) {
    const ms: Match[] = [];
    const next: string[] = [];
    for (let m = 0; m < entrants.length / 2; m++) {
      const a = entrants[2 * m];
      const b = entrants[2 * m + 1];
      let win: 0 | 1 = ((P.results?.[r]?.[m] ?? 0) === 1 ? 1 : 0) as 0 | 1;
      if (a === BYE && b !== BYE) win = 1;
      else if (b === BYE && a !== BYE) win = 0;
      ms.push({a, b, win});
      next.push(win === 0 ? a : b);
    }
    rounds.push(ms);
    entrants = next;
  }
  const champion = entrants[0];
  const autoNames = (r: number) => {
    const left = R - r;
    return left === 1 ? 'FINAL' : left === 2 ? 'SEMIFINALS' : left === 3 ? 'QUARTERFINALS' : left === 4 ? 'ROUND OF 16' : `ROUND ${r + 1}`;
  };
  const roundName = (r: number) => (P.roundNames?.[r] ? P.roundNames[r] : autoNames(r));

  // ---- layout (abstract: `along` = direction rounds flow, `across` = spread of matches)
  const M0 = N / 2;
  const C = R + 1; // columns incl. champion
  const margin = (portrait ? 54 : 90) * u;
  const topSpace = (portrait ? 330 : 210) * u;
  const botSpace = (portrait ? 120 : 70) * u;
  const availAlong = portrait ? h - topSpace - botSpace : w - margin * 2;
  const availAcross = portrait ? w - margin * 2 : h - topSpace - botSpace;
  const alongStart = portrait ? topSpace : margin;
  const acrossStart = portrait ? margin : topSpace;
  const slot = availAcross / M0;
  const cell = availAlong / C;
  const bw = portrait ? Math.min(slot * 0.9, 330 * u) : Math.min(cell * 0.74, 360 * u);
  const bh = portrait ? Math.min(cell * 0.56, 124 * u) : Math.min(slot * 0.86, 116 * u);
  const halfAlong = portrait ? bh / 2 : bw / 2;
  const alongOf = (r: number) => alongStart + (r + 0.5) * cell;
  const acrossOf = (r: number, m: number) => acrossStart + (m + 0.5) * Math.pow(2, r) * slot;
  const pt = (al: number, ac: number): [number, number] => (portrait ? [ac, al] : [al, ac]);

  // ---- timeline
  const t0 = 58;
  const tail = 64;
  const roundDur = (T - t0 - tail) / R;
  const revealAt = (r: number, m: number) => t0 + r * roundDur + m * Math.min(8, roundDur * 0.12);
  const winAt = (r: number, m: number) => revealAt(r, m) + 4; // winner highlight
  const lineAt = (r: number, m: number) => revealAt(r, m) + 8;
  const fillAt = (r: number, m: number) => revealAt(r, m) + 22; // winner name arrives in the next round

  const lineBase = withAlpha(P.ink, 0.2);
  const rowH = bh / 2;
  const fs = Math.min(rowH * 0.5, portrait ? 34 * u : 30 * u);

  // ---- connectors
  const lines: React.ReactNode[] = [];
  for (let r = 0; r < R; r++) {
    for (let m = 0; m < rounds[r].length; m++) {
      const [sx, sy] = pt(alongOf(r) + halfAlong, acrossOf(r, m));
      const nextAc = r === R - 1 ? acrossOf(r, m) : acrossOf(r + 1, Math.floor(m / 2));
      const midAl = (alongOf(r) + halfAlong + alongOf(r + 1) - halfAlong) / 2;
      const [mx1, my1] = pt(midAl, acrossOf(r, m));
      const [mx2, my2] = pt(midAl, nextAc);
      const [ex, ey] = pt(alongOf(r + 1) - halfAlong, nextAc);
      const d = `M${sx} ${sy} L${mx1} ${my1} L${mx2} ${my2} L${ex} ${ey}`;
      const p = easeIO(sseg(frame, lineAt(r, m), lineAt(r, m) + 20));
      const appear = sseg(frame, 6 + m * 2, 30 + m * 2);
      lines.push(
        <g key={`l${r}-${m}`}>
          <path d={d} fill="none" stroke={lineBase} strokeWidth={3 * u} strokeLinejoin="round" strokeLinecap="round" opacity={r === 0 ? appear : 1} />
          {p > 0 && (
            <>
              <path d={d} fill="none" stroke={withAlpha(P.accent, 0.22)} strokeWidth={13 * u} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
              <path d={d} fill="none" stroke={P.accent} strokeWidth={4.5 * u} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            </>
          )}
        </g>,
      );
    }
  }

  // ---- match boxes
  const slotRow = (name: string, shownAt: number, state: 'tbd' | 'live' | 'won' | 'lost', ti: number, last: boolean) => {
    const shown = name === BYE ? 1 : easeOut3(sseg(frame, shownAt, shownAt + 14));
    const label = state === 'tbd' ? '' : name;
    const col = name === BYE ? '#556' : avatarColor(name, ti);
    const won = state === 'won';
    return (
      <div
        style={{
          height: rowH,
          display: 'flex',
          alignItems: 'center',
          gap: rowH * 0.22,
          padding: `0 ${rowH * 0.3}px`,
          borderBottom: last ? undefined : `${1.5 * u}px solid ${withAlpha(P.ink, 0.1)}`,
          background: won ? withAlpha(P.accent, 0.18) : undefined,
          opacity: state === 'lost' ? 0.42 : 1,
          position: 'relative',
        }}
      >
        <div style={{width: rowH * 0.2, height: rowH * 0.5, borderRadius: 3 * u, background: state === 'tbd' ? withAlpha(P.ink, 0.18) : won ? P.accent : col, opacity: shown}} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: body,
            fontWeight: 700,
            fontSize: fs,
            color: won ? P.ink : withAlpha(P.ink, 0.9),
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textTransform: 'uppercase',
            letterSpacing: fs * 0.04,
            opacity: shown,
            transform: `translateX(${(1 - shown) * -14 * u}px)`,
          }}
        >
          {state === 'tbd' ? <span style={{opacity: 0.4}}>TBD</span> : label}
        </div>
        {won && <div style={{width: rowH * 0.28, height: rowH * 0.28, background: P.accent, clipPath: 'polygon(0 50%,40% 100%,100% 0,85% 0,40% 70%,15% 40%)', transform: 'scale(1.1)'}} />}
      </div>
    );
  };

  const boxes: React.ReactNode[] = [];
  for (let r = 0; r < R; r++) {
    for (let m = 0; m < rounds[r].length; m++) {
      const mt = rounds[r][m];
      const [cx, cy] = pt(alongOf(r), acrossOf(r, m));
      const decided = frame >= winAt(r, m);
      // when each slot is filled: round 0 at the intro, later rounds when the feeder match advanced its winner
      const fillA = r === 0 ? 4 + m * 2 : fillAt(r - 1, 2 * m);
      const fillB = r === 0 ? 6 + m * 2 : fillAt(r - 1, 2 * m + 1);
      const knownA = r === 0 || frame >= fillA;
      const knownB = r === 0 || frame >= fillB;
      const stA = !knownA ? 'tbd' : decided ? (mt.win === 0 ? 'won' : 'lost') : 'live';
      const stB = !knownB ? 'tbd' : decided ? (mt.win === 1 ? 'won' : 'lost') : 'live';
      const enterAt = r === 0 ? 2 + m * 2 : 10 + r * 6;
      const e = easeOut3(sseg(frame, enterAt, enterAt + 22));
      const glow = decided ? 1 - sseg(frame, winAt(r, m), winAt(r, m) + 26) : 0;
      boxes.push(
        <div
          key={`b${r}-${m}`}
          style={{
            position: 'absolute',
            left: cx - bw / 2,
            top: cy - bh / 2,
            width: bw,
            height: bh,
            borderRadius: 10 * u,
            background: P.surface,
            border: `${2 * u}px solid ${decided ? withAlpha(P.accent, 0.8) : withAlpha(P.ink, 0.16)}`,
            boxShadow: `0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.35), 0 0 ${40 * u * glow}px ${withAlpha(P.accent, 0.6 * glow)}`,
            overflow: 'hidden',
            opacity: e,
            transform: `translateY(${(1 - e) * 18 * u}px) scale(${0.96 + 0.04 * e})`,
          }}
        >
          {slotRow(mt.a, fillA, stA, 2 * m, false)}
          {slotRow(mt.b, fillB, stB, 2 * m + 1, true)}
        </div>,
      );
    }
  }

  // ---- champion card
  const [chx, chy] = pt(alongOf(R), acrossOf(R - 1, 0));
  const champAt = winAt(R - 1, 0) + 24;
  const cp = backOut(sseg(frame, champAt, champAt + 22), 1.9);
  const cGlow = 0.55 + 0.45 * Math.sin((frame - champAt) * 0.18);
  const cw = portrait ? Math.min(bw * 1.3, w - margin * 2) : Math.min(cell * 0.82, 400 * u);
  const ch = portrait ? Math.min(cell * 0.75, 190 * u) : 150 * u;
  const cfs = Math.min(ch * 0.26, cw / (Math.max(6, champion.length) * 0.78));

  // title + round labels
  const titleP = easeOut3(sseg(frame, 0, 24));
  const labels: React.ReactNode[] = [];
  for (let r = 0; r <= R; r++) {
    const [lx, ly] = pt(alongOf(r), r === R ? acrossOf(R - 1, 0) : acrossStart);
    const isC = r === R;
    const txt = isC ? P.championLabel : roundName(r);
    const decidedP = r < R ? easeOut3(sseg(frame, revealAt(r, 0) - 6, revealAt(r, 0) + 8)) : cp;
    const lit = isC ? cp : decidedP;
    const top = portrait ? ly - bh / 2 - 34 * u : (isC ? chy - ch / 2 - 40 * u : acrossStart - 46 * u);
    const left = portrait ? margin : lx - (isC ? cw : bw) / 2;
    labels.push(
      <div
        key={`n${r}`}
        style={{
          position: 'absolute',
          left,
          top: portrait && isC ? chy - ch / 2 - 40 * u : top,
          width: portrait ? undefined : isC ? cw : bw,
          fontFamily: body,
          fontWeight: 700,
          fontSize: (portrait ? 22 : 20) * u,
          letterSpacing: 5 * u,
          color: mixHex(P.ink, P.accent, lit * 0.9),
          opacity: 0.5 + 0.5 * lit,
          textAlign: portrait ? 'left' : 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {txt}
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${withAlpha(P.accent, 0.1)}, transparent 70%)`}} />
          <Svg>
            {Array.from({length: Math.ceil(w / (80 * u))}).map((_, i) => (
              <line key={i} x1={i * 80 * u} y1={0} x2={i * 80 * u} y2={h} stroke={withAlpha(P.ink, 0.03)} strokeWidth={1.5 * u} />
            ))}
            {Array.from({length: Math.ceil(h / (80 * u))}).map((_, i) => (
              <line key={i} x1={0} y1={i * 80 * u} x2={w} y2={i * 80 * u} stroke={withAlpha(P.ink, 0.03)} strokeWidth={1.5 * u} />
            ))}
          </Svg>
          <Vignette strength={0.45} />
        </>
      )}
      <div
        style={{
          position: 'absolute',
          left: margin,
          top: (portrait ? 120 : 62) * u,
          fontFamily: head,
          fontSize: (portrait ? 64 : 62) * u,
          lineHeight: 1,
          color: P.ink,
          letterSpacing: 2 * u,
          textTransform: 'uppercase',
          opacity: titleP,
          transform: `translateX(${(1 - titleP) * -40 * u}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 22 * u,
        }}
      >
        <div style={{width: 10 * u, height: (portrait ? 64 : 62) * u, background: P.accent}} />
        {P.title}
      </div>
      <Svg>{lines}</Svg>
      {labels}
      {boxes}
      {cp > 0 && (
        <div
          style={{
            position: 'absolute',
            left: chx - cw / 2,
            top: chy - ch / 2,
            width: cw,
            height: ch,
            borderRadius: 14 * u,
            background: `linear-gradient(160deg, ${mixHex(P.accent, '#ffffff', 0.15)}, ${mixHex(P.accent, '#000000', 0.35)})`,
            boxShadow: `0 0 ${(40 + 40 * cGlow) * u}px ${withAlpha(P.accent, 0.55)}, 0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.4)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: ch * 0.06,
            transform: `scale(${0.4 + 0.6 * cp})`,
            opacity: Math.min(1, cp * 2),
            overflow: 'hidden',
          }}
        >
          <svg width={ch * 0.3} height={ch * 0.3} viewBox="-1 -1 2 2">
            <path d="M0 -0.95 L0.28 -0.3 L0.95 -0.25 L0.45 0.2 L0.6 0.9 L0 0.52 L-0.6 0.9 L-0.45 0.2 L-0.95 -0.25 L-0.28 -0.3Z" fill={P.background === 'transparent' ? '#10131f' : P.background} />
          </svg>
          <div style={{fontFamily: head, fontSize: cfs, color: P.background === 'transparent' ? '#10131f' : P.background, textTransform: 'uppercase', letterSpacing: cfs * 0.03, whiteSpace: 'nowrap', lineHeight: 1}}>{champion}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const bracketAdvance = defineMotion<Props>({
  id: 'bracket-advance',
  title: 'Bracket advance',
  category: 'game',
  description: 'Single-elimination tournament bracket from your entrants and results: winners light up, connector lines draw on in the accent colour, names advance round by round, losers dim, and a champion card lands. Left-to-right in landscape, top-to-bottom in portrait.',
  source: ['original'],
  useFor: 'Esports and sports tournament announcements, playoff recaps, "road to the final" posts, quiz or pitch-competition brackets. Give `teams` (2-16) and `results` (0 = upper side won, 1 = lower side won per match, per round).',
  durationInFrames: 330,
  defaultProps: {
    title: 'Playoff Bracket',
    teams: ['Nova', 'Vortex', 'Ember', 'Glacier', 'Titan', 'Raven', 'Apex', 'Zenith'],
    results: [[0, 1, 0, 0], [0, 1], [0]],
    roundNames: [],
    championLabel: 'Champion',
    background: '#0A0F1E',
    surface: '#141B33',
    ink: '#F3F6FF',
    accent: '#35E0A1',
    fontFamily: 'auto',
  },
  propDocs: {
    title: 'heading',
    teams: 'entrants in bracket order (2-16; padded to a power of two with byes)',
    results: 'per round, per match: 0 = the upper entrant won, 1 = the lower one (ignored where a bye decides)',
    roundNames: 'column labels, first round first; empty = automatic (Quarterfinals, Semifinals, Final...)',
    championLabel: 'label above the champion card',
    background: 'frame colour, or "transparent" to overlay content',
    surface: 'match box colour',
    ink: 'text colour',
    accent: 'winner path / highlight colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: BracketAdvance,
  tags: ['esports', 'tournament', 'bracket', 'playoff', 'knockout', 'elimination', 'champion', 'game', 'gaming', 'sports', 'versus', 'teams', 'schedule', 'diagram'],
});
