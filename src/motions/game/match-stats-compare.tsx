import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Crest, bgCss, bodyFont, clampN, easeIO, easeOut3, fitFont, headFont, mixHex, num, sseg, withAlpha, isDark} from '../../core/r3-sports-kit';
import {Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Head-to-head team stats: two crests and names over a stack of comparison rows. Each row has a centred label, the two values
 * counting up at the sides and a bar that opens from the middle and settles on the split (share of the pair, or mirrored against
 * the larger value). The side that leads a row is lit in its team colour, the other dims. Optional score in the middle.
 */
type Stat = {label: string; a: number; b: number; suffix?: string; decimals?: number; lowerBetter?: boolean};
type Props = {
  title: string;
  subtitle: string;
  teamA: string;
  teamB: string;
  tagA: string;
  tagB: string;
  logoA: string;
  logoB: string;
  colorA: string;
  colorB: string;
  scoreA: number | string;
  scoreB: number | string;
  stats: Stat[];
  barMode: string;
  background: string;
  surface: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const DEFAULT_STATS: Stat[] = [
  {label: 'Possession', a: 58, b: 42, suffix: '%'},
  {label: 'Shots', a: 14, b: 9},
  {label: 'Shots on target', a: 6, b: 4},
  {label: 'Corners', a: 7, b: 3},
  {label: 'Passes', a: 512, b: 388},
  {label: 'Fouls', a: 9, b: 12, lowerBetter: true},
];

const MatchStatsCompare: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const stats = (Array.isArray(P.stats) && P.stats.length ? P.stats : DEFAULT_STATS).slice(0, 8).map((s) => ({
    label: String(s.label ?? ''),
    a: Math.max(0, num(s.a, 0)),
    b: Math.max(0, num(s.b, 0)),
    suffix: s.suffix ?? '',
    dec: clampN(Math.round(num(s.decimals, 0)), 0, 2),
    lowerBetter: !!s.lowerBetter,
  }));
  const n = stats.length;
  const hasScore = String(P.scoreA ?? '') !== '' && String(P.scoreB ?? '') !== '';
  const mirror = P.barMode === 'mirror';

  const W = portrait ? w * 0.92 : Math.min(w * 0.88, 1360 * u);
  const left = (w - W) / 2;
  const headH = (portrait ? 170 : 150) * u + (portrait ? 190 : 130) * u;
  const topY = (portrait ? 150 : 56) * u;
  const availH = h - topY - headH - 70 * u;
  const rowH = Math.min((portrait ? 190 : 112) * u, availH / n);
  const rowsTop = topY + headH + Math.max(0, (availH - rowH * n) / 2);
  const valW = clampN(W * 0.14, 90 * u, 190 * u);
  const barX = left + valW + 14 * u;
  const BW = W - 2 * (valW + 14 * u);
  const mid = barX + BW / 2;

  const hdr = easeOut3(sseg(frame, 0, 26));
  const crest = (portrait ? 170 : 150) * u;
  const nameW = portrait ? crest * 1.5 : (W - crest * 2) * 0.34;
  const nameFsA = fitFont((P.teamA || P.tagA || '').toUpperCase(), 46 * u, nameW, 'display');
  const nameFsB = fitFont((P.teamB || P.tagB || '').toUpperCase(), 46 * u, nameW, 'display');
  const nameFs = Math.min(nameFsA, nameFsB);

  const scoreP = easeOut3(sseg(frame, 18, 44));
  const t0 = 40;
  const gapF = Math.min(14, Math.max(6, (T - t0 - 70) / n / 1.5));

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 70% at 0% 40%, ${withAlpha(P.colorA, 0.26)}, transparent 70%), radial-gradient(ellipse 55% 70% at 100% 40%, ${withAlpha(P.colorB, 0.26)}, transparent 70%)`}} />
          {isDark(P.background) && <Vignette strength={0.45} />}
        </>
      )}
      {/* title */}
      <div style={{position: 'absolute', left: 0, right: 0, top: topY - 6 * u, textAlign: 'center', opacity: hdr}}>
        <div style={{fontFamily: body, fontWeight: 700, fontSize: 24 * u, letterSpacing: 9 * u, color: P.accent, textTransform: 'uppercase'}}>{P.subtitle}</div>
      </div>
      {/* teams */}
      <div style={{position: 'absolute', left, top: topY + 40 * u, width: W, height: crest + (portrait ? 80 * u : 0), display: 'flex', alignItems: portrait ? 'flex-start' : 'center', justifyContent: 'space-between'}}>
        {[0, 1].map((side) => {
          const name = side === 0 ? P.teamA : P.teamB;
          const tag = side === 0 ? P.tagA : P.tagB;
          const col = side === 0 ? P.colorA : P.colorB;
          const logo = side === 0 ? P.logoA : P.logoB;
          const e = easeOut3(sseg(frame, 4 + side * 6, 32 + side * 6));
          return (
            <div key={side} style={{display: 'flex', flexDirection: portrait ? 'column' : side === 0 ? 'row' : 'row-reverse', alignItems: 'center', gap: (portrait ? 12 : 22) * u, opacity: e, transform: `translateX(${(side === 0 ? -1 : 1) * (1 - e) * 120 * u}px)`}}>
              <Crest size={crest} label={tag || name} color={col} src={logo} shape="shield" font={head} />
              <div style={{fontFamily: head, fontSize: nameFs, color: P.ink, textTransform: 'uppercase', lineHeight: 1.05, textAlign: portrait ? 'center' : side === 0 ? 'left' : 'right', maxWidth: portrait ? crest * 1.6 : (W - crest * 2) * 0.36, whiteSpace: portrait ? 'nowrap' : 'normal'}}>{name}</div>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: crest, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: scoreP, transform: `scale(${0.7 + 0.3 * scoreP})`}}>
          {hasScore ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 26 * u, fontFamily: head, fontSize: (portrait ? 140 : 130) * u, lineHeight: 1, color: P.ink, fontVariantNumeric: 'tabular-nums'}}>
              <span>{P.scoreA}</span>
              <span style={{fontSize: 56 * u, color: withAlpha(P.ink, 0.5)}}>–</span>
              <span>{P.scoreB}</span>
            </div>
          ) : (
            <div style={{fontFamily: head, fontSize: 96 * u, color: P.accent, lineHeight: 1}}>VS</div>
          )}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: topY + 40 * u + crest + (portrait ? 100 : 22) * u, textAlign: 'center', fontFamily: body, fontWeight: 700, fontSize: 28 * u, letterSpacing: 8 * u, color: withAlpha(P.ink, 0.75), textTransform: 'uppercase', opacity: scoreP}}>{P.title}</div>

      {/* rows */}
      {stats.map((s, i) => {
        const a0 = t0 + i * gapF;
        const enter = easeOut3(sseg(frame, a0, a0 + 18));
        const grow = easeIO(sseg(frame, a0 + 4, a0 + 40));
        const cnt = easeOut3(sseg(frame, a0 + 4, a0 + 44));
        const y = rowsTop + i * rowH;
        const tot = s.a + s.b;
        const shareA = tot > 0 ? s.a / tot : 0.5;
        const mx = Math.max(s.a, s.b, 1e-9);
        const aLead = s.lowerBetter ? s.a < s.b : s.a > s.b;
        const bLead = s.lowerBetter ? s.b < s.a : s.b > s.a;
        const tie = s.a === s.b;
        const bh = rowH * 0.2;
        const gap = 5 * u;
        let wa: number;
        let wb: number;
        if (mirror) {
          wa = ((s.a / mx) * (BW / 2 - gap)) * grow;
          wb = ((s.b / mx) * (BW / 2 - gap)) * grow;
        } else {
          const shA = 0.5 + (shareA - 0.5) * grow;
          wa = Math.max(0, (BW - gap) * shA);
          wb = Math.max(0, (BW - gap) * (1 - shA));
        }
        const fmt = (v: number) => (v * cnt).toFixed(s.dec) + s.suffix;
        const vFs = Math.min(rowH * 0.46, 56 * u);
        const labFs = Math.min(rowH * 0.2, 25 * u);
        return (
          <div key={i} style={{position: 'absolute', left, top: y, width: W, height: rowH, opacity: enter, transform: `translateY(${(1 - enter) * 24 * u}px)`}}>
            <div style={{position: 'absolute', left: -14 * u, right: -14 * u, top: 3 * u, bottom: 3 * u, borderRadius: rowH * 0.14, background: withAlpha(P.surface, 0.6)}} />
            {/* label */}
            <div style={{position: 'absolute', left: barX - left, width: BW, top: rowH * 0.06, textAlign: 'center', fontFamily: body, fontWeight: 700, fontSize: labFs, letterSpacing: labFs * 0.28, textTransform: 'uppercase', color: withAlpha(P.ink, 0.75)}}>{s.label}</div>
            {/* values */}
            <div style={{position: 'absolute', left: 0, width: valW, top: rowH * 0.22, height: rowH * 0.6, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', fontFamily: head, fontSize: vFs, color: aLead || tie ? P.ink : withAlpha(P.ink, 0.55), fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{fmt(s.a)}</div>
            <div style={{position: 'absolute', right: 0, width: valW, top: rowH * 0.22, height: rowH * 0.6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: head, fontSize: vFs, color: bLead || tie ? P.ink : withAlpha(P.ink, 0.55), fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{fmt(s.b)}</div>
            {/* bar track */}
            <div style={{position: 'absolute', left: barX - left, top: rowH * 0.42, width: BW, height: bh, borderRadius: bh / 2, background: withAlpha(P.ink, 0.08)}} />
            <div style={{position: 'absolute', left: mirror ? mid - left - wa - gap / 2 : barX - left, top: rowH * 0.42, width: wa, height: bh, borderRadius: bh / 2, background: `linear-gradient(90deg, ${mixHex(P.colorA, '#000000', 0.25)}, ${P.colorA})`, opacity: aLead || tie ? 1 : 0.5, boxShadow: aLead ? `0 0 ${bh * 1.4}px ${withAlpha(P.colorA, 0.55)}` : 'none'}} />
            <div style={{position: 'absolute', left: mirror ? mid - left + gap / 2 : barX - left + BW - wb, top: rowH * 0.42, width: wb, height: bh, borderRadius: bh / 2, background: `linear-gradient(270deg, ${mixHex(P.colorB, '#000000', 0.25)}, ${P.colorB})`, opacity: bLead || tie ? 1 : 0.5, boxShadow: bLead ? `0 0 ${bh * 1.4}px ${withAlpha(P.colorB, 0.55)}` : 'none'}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const matchStatsCompare = defineMotion<Props>({
  id: 'match-stats-compare',
  title: 'Match stats comparison',
  category: 'game',
  description: 'Two team crests and names over a stack of comparison rows: each stat has a centred label, two values that count up and a bar that opens from the middle to the split (share or mirrored); the leading side lights up in its colour, the other dims; optional score in the middle.',
  source: ['original'],
  useFor: 'Post-match and half-time stats (possession, shots, corners), head-to-head previews, player-vs-player or product-vs-product comparisons. Give the two team names, colours (and logos) and the stats as {label, a, b}.',
  durationInFrames: 240,
  defaultProps: {
    title: 'Match stats',
    subtitle: 'Full time',
    teamA: 'Northgate',
    teamB: 'Harbor City',
    tagA: 'NGT',
    tagB: 'HBC',
    logoA: '',
    logoB: '',
    colorA: '#2F6BFF',
    colorB: '#FF4D5E',
    scoreA: 2,
    scoreB: 1,
    stats: DEFAULT_STATS,
    barMode: 'split',
    background: '#0A0F1E',
    surface: '#161E33',
    ink: '#FFFFFF',
    accent: '#FFC933',
    fontFamily: 'auto',
  },
  propDocs: {
    title: 'label under the crests',
    subtitle: 'small line at the top (e.g. Full time, Half time)',
    teamA: 'left team name',
    teamB: 'right team name',
    tagA: 'left short tag (logo fallback)',
    tagB: 'right short tag',
    logoA: 'left logo image (public/ path or URL); empty = coloured tag badge',
    logoB: 'right logo image; empty = coloured tag badge',
    colorA: 'left team colour',
    colorB: 'right team colour',
    scoreA: 'left score; set either score to "" to show VS instead',
    scoreB: 'right score',
    stats: 'array of {label, a, b, suffix?, decimals?, lowerBetter?} (8 max); lowerBetter lights the side with the smaller value (e.g. fouls)',
    barMode: 'split = one bar split by share of the pair | mirror = both bars measured against the larger value',
    background: 'frame colour, or "transparent" to overlay footage',
    surface: 'row panel colour',
    ink: 'text colour',
    accent: 'subtitle colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: MatchStatsCompare,
  tags: ['stats', 'comparison', 'versus', 'head to head', 'possession', 'shots', 'match', 'teams', 'football', 'soccer', 'basketball', 'sports', 'bars', 'compare', 'half time', 'full time'],
});
