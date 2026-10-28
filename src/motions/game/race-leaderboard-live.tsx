import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Crest, backOut, bgCss, bodyFont, clampN, easeIO, easeOut3, fitFont, fmtTime, headFont, mixHex, num, onColor, sseg, withAlpha} from '../../core/r3-sports-kit';
import {Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Live race timing tower: a ranked list where every checkpoint (lap, split, heat) re-sorts the field — rows glide to their new
 * place, overtakers flash and get a green ▲ with the places gained, backers a red ▼, the leader shows the running time and everyone
 * else the gap behind. Works for motor racing, cycling, athletics, swimming, rowing, esports races or any "who is ahead" ranking.
 */
type Entry = {name: string; color?: string; tag?: string; laps: number[]};
type Props = {
  title: string;
  subtitle: string;
  checkpointLabel: string;
  entries: Entry[];
  showLapTimes: boolean;
  decimals: number;
  background: string;
  surface: string;
  ink: string;
  accent: string;
  up: string;
  down: string;
  fontFamily: string;
};

const PALETTE = ['#E5484D', '#2F6BFF', '#18B37E', '#F5A524', '#8E5CF0', '#19B6D6', '#EA5BA3', '#9AA5B8', '#E8590C', '#4CC38A'];
const DEFAULT_ENTRIES: Entry[] = [
  {name: 'Vega', laps: [91.2, 89.9, 89.4, 88.9, 88.6, 88.7]},
  {name: 'Rowe', laps: [90.1, 90.8, 90.2, 90.4, 90.9, 91.0]},
  {name: 'Imai', laps: [92.0, 89.4, 89.3, 89.5, 89.1, 89.2]},
  {name: 'Costa', laps: [90.6, 91.0, 90.3, 89.4, 89.9, 89.1]},
  {name: 'Dunn', laps: [91.5, 90.2, 89.8, 90.7, 90.4, 89.7]},
  {name: 'Okoro', laps: [93.0, 90.6, 90.1, 89.9, 90.8, 90.0]},
  {name: 'Lund', laps: [90.9, 91.4, 90.9, 90.5, 89.5, 90.6]},
  {name: 'Pryce', laps: [92.4, 91.1, 90.7, 90.9, 91.0, 90.4]},
];

const RaceLeaderboardLive: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const dec = clampN(Math.round(num(P.decimals, 3)), 1, 3);

  const src = Array.isArray(P.entries) && P.entries.length ? P.entries : DEFAULT_ENTRIES;
  const rows = src.slice(0, 12).map((e, i) => ({
    name: String(e.name ?? `Racer ${i + 1}`),
    tag: e.tag ?? '',
    color: e.color || PALETTE[i % PALETTE.length],
    laps: (Array.isArray(e.laps) && e.laps.length ? e.laps : [90]).slice(0, 20).map((x) => Math.max(0.001, num(x, 90))),
  }));
  const n = rows.length;
  const K = Math.max(1, Math.min(...rows.map((r) => r.laps.length)));
  const cum = rows.map((r) => {
    let s = 0;
    return r.laps.slice(0, K).map((x) => (s += x));
  });

  // state 0 = the grid (entry order), state s = after checkpoint s
  const rankAt = (s: number) => {
    const idx = rows.map((_, i) => i);
    if (s > 0) idx.sort((a, b) => cum[a][s - 1] - cum[b][s - 1] || a - b);
    const rk = new Array(n).fill(0);
    idx.forEach((i, k) => (rk[i] = k));
    return rk;
  };
  const ranks = Array.from({length: K + 1}, (_, s) => rankAt(s));
  const gapAt = (s: number, i: number) => {
    if (s === 0) return 0;
    const lead = Math.min(...cum.map((c) => c[s - 1]));
    return cum[i][s - 1] - lead;
  };
  const leadAt = (s: number) => (s === 0 ? 0 : Math.min(...cum.map((c) => c[s - 1])));

  // timeline
  const t0 = 62;
  const tail = 44;
  const D = Math.max(18, (T - t0 - tail) / K);
  const trans = Math.min(28, D * 0.7);
  const tp = (s: number) => easeIO(sseg(frame, t0 + (s - 1) * D, t0 + (s - 1) * D + trans));
  const interp = (f: (s: number) => number) => {
    let v = f(0);
    for (let s = 1; s <= K; s++) v += (f(s) - f(s - 1)) * tp(s);
    return v;
  };
  // current checkpoint (reached once its transition is half done)
  let cur = 0;
  for (let s = 1; s <= K; s++) if (tp(s) > 0.5) cur = s;

  // layout
  const W = portrait ? w * 0.92 : Math.min(w * 0.9, 1240 * u);
  const left = (w - W) / 2;
  const headH = (portrait ? 190 : 150) * u;
  const availH = h - headH - 110 * u;
  const rowH = Math.min((portrait ? 118 : 92) * u, availH / n);
  const gapY = Math.max(5 * u, rowH * 0.08);
  const stepY = rowH;
  const listH = n * stepY;
  const top = Math.max(60 * u, (h - headH - listH) / 2) + headH;
  const narrow = W < 900 * u;
  const showLap = P.showLapTimes && !narrow;
  const bodyH = rowH - gapY;

  const hdrP = easeOut3(sseg(frame, 0, 24));
  const tFs = fitFont((P.title || '').toUpperCase(), 62 * u, W * 0.62);
  const lapNow = Math.max(0, Math.min(K, cur));
  const lapChipP = backOut(sseg(frame, 10, 34));

  // render order: stable by entry, z-order by current rank (moving up on top)
  const Row = (i: number) => {
    const r = rows[i];
    const rank = interp((s) => ranks[s][i]);
    const enter = easeOut3(sseg(frame, 14 + i * 4, 38 + i * 4));
    const y = top + rank * stepY;
    const gapV = interp((s) => gapAt(s, i));
    const rounded = Math.round(rank);
    // arrow: change vs previous checkpoint, visible for a while after each transition
    let delta = 0;
    let since = 999;
    if (cur >= 1) {
      delta = ranks[cur - 1][i] - ranks[cur][i];
      since = frame - (t0 + (cur - 1) * D);
    }
    const arrowP = delta !== 0 ? sseg(frame, t0 + (cur - 1) * D + trans * 0.4, t0 + (cur - 1) * D + trans + 6) * (1 - sseg(frame, t0 + (cur - 1) * D + D * 0.9, t0 + (cur - 1) * D + D * 1.1 + 6)) : 0;
    const flash = delta > 0 ? 1 - sseg(since, trans * 0.5, trans + 26) : 0;
    const isLead = rounded === 0;
    const timeTxt = isLead && cur > 0 ? fmtTime(leadAt(cur) + 0, dec, true) : cur === 0 ? '—' : `+${gapV.toFixed(dec)}`;
    const lastLap = cur > 0 ? r.laps[cur - 1] : 0;
    const nameW = W * (narrow ? 0.4 : 0.3);
    const nameFs = fitFont(r.name.toUpperCase(), bodyH * 0.46, nameW, 'sans', 0.04);
    const posBox = bodyH * 0.9;
    const skew = bodyH * 0.22;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left,
          top: y,
          width: W,
          height: bodyH,
          opacity: enter,
          transform: `translateX(${(1 - enter) * -120 * u}px)`,
          zIndex: 100 - Math.round(rank * 10) + (flash > 0 ? 50 : 0),
        }}
      >
        <div style={{position: 'absolute', inset: 0, clipPath: `polygon(${skew}px 0,100% 0,calc(100% - ${skew}px) 100%,0 100%)`, background: mixHex(P.surface, '#ffffff', 0.04 + flash * 0.2)}} />
        <div style={{position: 'absolute', inset: 0, clipPath: `polygon(${skew}px 0,100% 0,calc(100% - ${skew}px) 100%,0 100%)`, background: `linear-gradient(90deg, ${withAlpha(r.color, 0.28 + flash * 0.4)}, transparent 45%)`}} />
        {/* position */}
        <div style={{position: 'absolute', left: 0, top: 0, width: posBox + skew, height: bodyH, clipPath: `polygon(${skew}px 0,100% 0,calc(100% - ${skew}px) 100%,0 100%)`, background: isLead ? P.accent : mixHex(P.surface, '#ffffff', 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontSize: bodyH * 0.5, color: isLead ? onColor(P.accent) : P.ink, paddingLeft: skew * 0.5}}>{rounded + 1}</div>
        {/* colour chip + tag */}
        <div style={{position: 'absolute', left: posBox + skew * 1.4, top: bodyH * 0.18, width: bodyH * 0.64, height: bodyH * 0.64, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Crest size={bodyH * 0.64} label={r.tag || r.name} color={r.color} shape="hex" font={head} />
        </div>
        <div style={{position: 'absolute', left: posBox + skew * 1.4 + bodyH * 0.84, top: 0, height: bodyH, display: 'flex', alignItems: 'center', fontFamily: body, fontWeight: 700, fontSize: nameFs, letterSpacing: nameFs * 0.04, color: P.ink, whiteSpace: 'nowrap'}}>{r.name.toUpperCase()}</div>
        {/* change arrow */}
        <div style={{position: 'absolute', left: W * (narrow ? 0.5 : 0.46), top: 0, height: bodyH, display: 'flex', alignItems: 'center', gap: bodyH * 0.08, fontFamily: body, fontWeight: 800, fontSize: bodyH * 0.36, color: delta > 0 ? P.up : P.down, opacity: arrowP, transform: `translateY(${(delta > 0 ? 1 : -1) * (1 - arrowP) * bodyH * 0.3}px)`}}>
          {delta !== 0 && (
            <>
              <svg width={bodyH * 0.3} height={bodyH * 0.3} viewBox="0 0 10 10">
                <path d={delta > 0 ? 'M5 1L9.5 9H0.5Z' : 'M5 9L9.5 1H0.5Z'} fill="currentColor" />
              </svg>
              {Math.abs(delta)}
            </>
          )}
        </div>
        {/* last lap */}
        {showLap && (
          <div style={{position: 'absolute', right: W * 0.27, top: 0, height: bodyH, display: 'flex', alignItems: 'center', fontFamily: body, fontWeight: 600, fontSize: bodyH * 0.34, color: withAlpha(P.ink, 0.62), fontVariantNumeric: 'tabular-nums'}}>{cur > 0 ? fmtTime(lastLap, 2, true) : ''}</div>
        )}
        {/* gap / time */}
        <div style={{position: 'absolute', right: skew + bodyH * 0.2, top: 0, height: bodyH, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: W * (narrow ? 0.3 : 0.24), fontFamily: body, fontWeight: 700, fontSize: bodyH * (isLead ? 0.42 : 0.4), color: isLead ? P.accent : P.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{timeTxt}</div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `linear-gradient(120deg, ${mixHex(P.background, P.accent, 0.1)}, ${P.background} 55%)`}} />
          <Vignette strength={0.4} />
        </>
      )}
      {/* header */}
      <div style={{position: 'absolute', left, top: top - headH + 6 * u, width: W, height: headH - 24 * u, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: hdrP, transform: `translateY(${(1 - hdrP) * -26 * u}px)`}}>
        <div style={{minWidth: 0}}>
          <div style={{fontFamily: body, fontWeight: 700, fontSize: 24 * u, letterSpacing: 7 * u, color: P.accent, textTransform: 'uppercase'}}>{P.subtitle}</div>
          <div style={{fontFamily: head, fontSize: tFs, color: P.ink, lineHeight: 1.05, marginTop: 6 * u, whiteSpace: 'nowrap', textTransform: 'uppercase'}}>{P.title}</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14 * u, transform: `scale(${0.6 + 0.4 * lapChipP})`, opacity: lapChipP, transformOrigin: 'right center'}}>
          <div style={{fontFamily: body, fontWeight: 700, fontSize: 24 * u, letterSpacing: 5 * u, color: withAlpha(P.ink, 0.7), textTransform: 'uppercase'}}>{P.checkpointLabel}</div>
          <div style={{fontFamily: head, fontSize: 76 * u, lineHeight: 1, color: P.ink, fontVariantNumeric: 'tabular-nums'}}>
            {lapNow}
            <span style={{fontSize: 38 * u, color: withAlpha(P.ink, 0.5)}}>/{K}</span>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left, top: top - 12 * u, width: W * hdrP, height: 4 * u, background: P.accent}} />
      {rows.map((_, i) => Row(i))}
    </AbsoluteFill>
  );
};

export const raceLeaderboardLive = defineMotion<Props>({
  id: 'race-leaderboard-live',
  title: 'Race leaderboard (live)',
  category: 'game',
  description: 'A slanted timing tower: the field is re-ranked at every lap / split, rows glide into place, overtakers flash with a green arrow and places gained, the leader shows the race time and the rest the gap behind, with an optional last-lap column and a lap counter.',
  source: ['original'],
  useFor: 'Race and heat coverage (motor racing, cycling, swimming, athletics, rowing, esports races), "who is ahead" timing towers, live-results recaps and standings changes. Give each competitor a name, a colour and their lap/split times in seconds.',
  durationInFrames: 270,
  defaultProps: {
    title: 'Grand Prix',
    subtitle: 'Live timing',
    checkpointLabel: 'Lap',
    entries: DEFAULT_ENTRIES.map((e, i) => ({...e, color: PALETTE[i % PALETTE.length]})),
    showLapTimes: true,
    decimals: 3,
    background: '#0A0F1C',
    surface: '#161E33',
    ink: '#FFFFFF',
    accent: '#FFC933',
    up: '#2DD4A0',
    down: '#FF5D6C',
    fontFamily: 'auto',
  },
  propDocs: {
    title: 'heading (e.g. event name)',
    subtitle: 'small line above the heading',
    checkpointLabel: 'word beside the counter (Lap, Split, Heat, Stage)',
    entries: 'array of {name, color, tag?, laps: number[]}: laps = time for each lap / split in seconds (cumulative times are worked out; the field is ranked after each checkpoint; 12 entries max, shortest laps array sets the checkpoint count)',
    showLapTimes: 'show each competitor\'s last lap time (hidden automatically on narrow frames)',
    decimals: 'decimals in gaps and times (1 to 3)',
    background: 'frame colour, or "transparent" to overlay footage',
    surface: 'row colour',
    ink: 'text colour',
    accent: 'leader / heading highlight colour',
    up: 'colour of the "places gained" arrow',
    down: 'colour of the "places lost" arrow',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: RaceLeaderboardLive,
  tags: ['race', 'leaderboard', 'timing tower', 'standings', 'ranking', 'laps', 'positions', 'overtake', 'motorsport', 'racing', 'cycling', 'swimming', 'athletics', 'sports', 'results', 'live', 'gap'],
});
