import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, bgCss, bodyFont, easeIO, easeOut3, fmtInt, headFont, mixHex, sseg, withAlpha} from '../../core/r3-game-kit';
import {rng} from '../../core/random';
import {Svg, Vignette, useStage} from '../../core/stage';
import {estWidth} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Multi-kill / combo banner: a slanted full-width band slams in with a camera shake, flash and speed lines, carrying a
 * multiplier badge, the tier word (DOUBLE, TRIPLE, QUAD...) and a row of pips. Each next tier hits harder and shifts colour
 * from `accent` toward `accent2`. A player line with a counting points reward sits under the band.
 * Neutral wording and original shapes: rename the tiers, suffix, player and points for any game, sport, quiz or sales streak.
 */
type Props = {
  labels: string[];
  count: number;
  suffix: string;
  startAt: number;
  player: string;
  detail: string;
  points: number;
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const KillStreakBanner: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait, cx} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const labels = (P.labels && P.labels.length ? P.labels : ['DOUBLE']).map((s) => String(s));
  const n = Math.max(1, Math.min(labels.length, Math.round(P.count) || labels.length, 6));
  const dark = P.background && P.background !== 'transparent' ? P.background : '#0A0C18';

  const seg = (T - 40) / n;
  const start = (i: number) => 10 + i * seg;
  const tierCol = (i: number) => mixHex(P.accent, P.accent2, n > 1 ? i / (n - 1) : 0);

  // current tier (the one that is slamming / holding), previous one is still sliding out for a few frames
  const cur = Math.max(0, Math.min(n - 1, Math.floor((frame - 10) / seg)));
  const globalOut = easeIO(sseg(frame, T - 18, T - 2));

  const bandY = h * (portrait ? 0.4 : 0.42);
  const bandH = (portrait ? 250 : 250) * u;

  const R = rng('kill-streak-banner');
  const streaks = Array.from({length: 26}, () => ({y: R(), l: 0.15 + R() * 0.4, s: 0.6 + R() * 1.1, d: R() * 6}));

  const renderTier = (i: number) => {
    const s0 = start(i);
    const f = frame - s0;
    if (f < -1) return null;
    const next = i < n - 1 ? start(i + 1) : Infinity;
    const outP = i < n - 1 ? easeIO(sseg(frame, next - 2, next + 8)) : 0;
    if (outP >= 1) return null;
    const col = tierCol(i);
    const power = 1 + 0.12 * i;
    const slam = sseg(f, 0, 12);
    const sc = 1 + (1 - easeOut3(slam)) * 0.9;
    const shakeAmp = (14 + 6 * i) * u * Math.max(0, 1 - sseg(f, 0, 16));
    const sx = Math.sin(f * 2.7 + i) * shakeAmp;
    const sy = Math.cos(f * 3.3 + i * 2) * shakeAmp * 0.6;
    const bandOpen = easeOut3(sseg(f, 0, 9));
    const flash = (1 - sseg(f, 0, 10)) * (0.3 + 0.1 * i);
    const label = `${(labels[i] || '').toUpperCase()} ${(P.suffix || '').toUpperCase()}`.trim();
    let fs = (portrait ? 128 : 190) * u * power;
    const maxW = (portrait ? w * 0.9 : w * 0.7) - (portrait ? 190 * u : 120 * u);
    const need = estWidth(label, fs, 'display') * 1.08;
    if (need > maxW) fs = (fs * maxW) / need;
    const pop = backOut(sseg(f, 0, 12), 2.2);
    const mult = Math.round(P.startAt) + i;
    const badge = bandH * 0.92;
    const labelX = (portrait ? 10 : 20) * u;
    const outY = -outP * 70 * u;

    return (
      <div key={i} style={{position: 'absolute', inset: 0, opacity: 1 - outP, transform: `translate(${sx}px, ${sy + outY}px)`}}>
        {/* speed streaks */}
        <Svg>
          {streaks.map((st, k) => {
            const t = sseg(f - st.d, 0, 26);
            if (t <= 0 || t >= 1) return null;
            const y = bandY - bandH * 0.7 + st.y * bandH * 2.4;
            const len = w * st.l * (1 + i * 0.25);
            const x1 = w * 1.05 - easeOut3(t) * w * 1.3;
            return <line key={k} x1={x1} y1={y} x2={x1 + len} y2={y} stroke={k % 3 === 0 ? col : '#ffffff'} strokeWidth={(3 + 5 * st.s) * u} strokeLinecap="round" opacity={0.7 * (1 - t) * (0.5 + 0.5 * st.s)} />;
          })}
        </Svg>
        {/* band */}
        <div style={{position: 'absolute', left: 0, right: 0, top: bandY - bandH / 2, height: bandH, transform: `scaleY(${0.05 + 0.95 * bandOpen})`, transformOrigin: '50% 50%'}}>
          <div style={{position: 'absolute', left: -20 * u, right: -20 * u, top: 0, bottom: 0, background: `linear-gradient(90deg, ${withAlpha(dark, 0)} 0%, ${withAlpha(dark, 0.92)} 14%, ${withAlpha(dark, 0.92)} 86%, ${withAlpha(dark, 0)} 100%)`}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 7 * u, background: `linear-gradient(90deg, transparent, ${col} 15%, ${col} 85%, transparent)`}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 7 * u, background: `linear-gradient(90deg, transparent, ${col} 15%, ${col} 85%, transparent)`}} />
          <div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(115deg, transparent 0 ${24 * u}px, ${withAlpha(col, 0.07)} ${24 * u}px ${48 * u}px)`}} />
        </div>
        {/* multiplier badge + label, skewed together */}
        <div style={{position: 'absolute', left: 0, right: 0, top: bandY - bandH / 2, height: bandH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30 * u, transform: `scale(${sc * (0.9 + 0.1 * pop)})`, opacity: Math.min(1, pop * 2)}}>
          <div style={{width: badge, height: badge, position: 'relative', flex: 'none'}}>
            <div style={{position: 'absolute', inset: 0, background: col, clipPath: 'polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)'}} />
            <div style={{position: 'absolute', inset: badge * 0.05, background: mixHex(dark, col, 0.22), clipPath: 'polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontSize: badge * 0.42, color: P.ink, lineHeight: 1}}>
              <span style={{fontSize: badge * 0.26, marginRight: badge * 0.02}}>x</span>
              {mult}
            </div>
          </div>
          <div style={{fontFamily: head, fontSize: fs, lineHeight: 1, color: P.ink, whiteSpace: 'nowrap', transform: 'skewX(-10deg)', marginLeft: labelX, letterSpacing: fs * 0.02, textShadow: `0 0 ${30 * u}px ${withAlpha(col, 0.85)}, ${5 * u}px ${6 * u}px 0 ${withAlpha(col, 0.9)}`}}>{label}</div>
        </div>
        {/* pips */}
        <div style={{position: 'absolute', left: 0, right: 0, top: bandY + bandH / 2 + 26 * u, display: 'flex', justifyContent: 'center', gap: 16 * u}}>
          {Array.from({length: n}).map((_, k) => {
            const lit = k <= i;
            const pp = lit ? backOut(sseg(f, 8 + (k === i ? 0 : -8), 22 + (k === i ? 0 : -8)), 2.6) : 0;
            const fresh = k === i ? 1 : 0;
            return (
              <div key={k} style={{width: 40 * u, height: 40 * u, transform: `rotate(45deg) scale(${lit ? 0.6 + 0.4 * pp + fresh * 0.25 * (1 - sseg(f, 10, 26)) : 0.6})`, background: lit ? col : 'transparent', border: `${3 * u}px solid ${lit ? col : withAlpha(P.ink, 0.3)}`, boxShadow: lit ? `0 0 ${22 * u}px ${withAlpha(col, 0.8)}` : undefined}} />
            );
          })}
        </div>
        {/* player line */}
        <div style={{position: 'absolute', left: 0, right: 0, top: bandY + bandH / 2 + 100 * u, display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: (portrait ? 8 : 26) * u, opacity: easeOut3(sseg(f, 8, 22)), transform: `translateY(${(1 - easeOut3(sseg(f, 8, 22))) * 20 * u}px)`}}>
          <div style={{fontFamily: head, fontSize: (portrait ? 58 : 56) * u, color: P.ink, textTransform: 'uppercase', letterSpacing: 2 * u}}>{P.player}</div>
          {P.detail ? <div style={{fontFamily: body, fontWeight: 700, fontSize: (portrait ? 30 : 30) * u, color: withAlpha(P.ink, 0.65), letterSpacing: 4 * u, textTransform: 'uppercase'}}>{P.detail}</div> : null}
          {P.points ? (
            <div style={{fontFamily: head, fontSize: (portrait ? 64 : 62) * u, color: col, fontVariantNumeric: 'tabular-nums'}}>+{fmtInt(P.points * (i + 1) * easeOut3(sseg(f, 10, 34)))}</div>
          ) : null}
        </div>
        <div style={{position: 'absolute', inset: 0, background: col, opacity: flash * 0.35, mixBlendMode: 'screen', pointerEvents: 'none'}} />
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.35, pointerEvents: 'none'}} />
      </div>
    );
  };

  const col = tierCol(cur);
  const danger = withAlpha(col, 0.35);
  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% ${(bandY / h) * 100}%, ${withAlpha(col, 0.2)}, transparent 70%)`}} />
          <Vignette strength={0.55} />
        </>
      )}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 75% at 50% 50%, transparent 55%, ${danger} 130%)`, opacity: 0.5 + 0.2 * cur}} />
      <AbsoluteFill style={{opacity: 1 - globalOut, transform: `scale(${1 + globalOut * 0.04})`}}>
        {Array.from({length: n}).map((_, i) => renderTier(i))}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: cx, top: 0}} />
    </AbsoluteFill>
  );
};

export const killStreakBanner = defineMotion<Props>({
  id: 'kill-streak-banner',
  title: 'Streak banner (double / triple / ...)',
  category: 'game',
  description: 'A slanted full-width banner slams in with shake, flash and speed lines: multiplier badge, tier word (DOUBLE, TRIPLE, QUAD...), lit pips and a counting points reward; each next tier hits harder and shifts colour.',
  source: ['original'],
  useFor: 'Multi-kill and combo callouts in gaming highlights, win streaks, quiz or sales streaks, "combo x3" moments in app demos. Rename labels, suffix, player and points; background "transparent" overlays gameplay footage.',
  durationInFrames: 240,
  defaultProps: {
    labels: ['Double', 'Triple', 'Quad', 'Mega'],
    count: 4,
    suffix: 'Streak',
    startAt: 2,
    player: 'Player One',
    detail: 'Opponent eliminated',
    points: 100,
    background: '#0A0C18',
    ink: '#FFFFFF',
    accent: '#FFB020',
    accent2: '#FF3D5A',
    fontFamily: 'auto',
  },
  propDocs: {
    labels: 'tier words in order (Double, Triple, Quad, Mega...)',
    count: 'how many tiers to play (1-6, at most the number of labels)',
    suffix: 'word after the tier (Streak, Combo, Kill, Win...)',
    startAt: 'multiplier shown on the first tier (x2 by default)',
    player: 'name on the line under the band',
    detail: 'small caption next to the name; empty hides it',
    points: 'reward per tier step (counts up, grows with each tier); 0 hides it',
    background: 'frame colour, or "transparent" to overlay gameplay',
    ink: 'text colour',
    accent: 'first tier colour',
    accent2: 'final tier colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: KillStreakBanner,
  tags: ['streak', 'combo', 'multi-kill', 'double', 'triple', 'banner', 'esports', 'game', 'gaming', 'highlight', 'killfeed', 'overlay', 'score', 'multiplier', 'callout'],
});
