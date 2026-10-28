import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Crest, backOut, bgCss, bodyFont, clampN, easeOut3, fitFont, headFont, mixHex, num, pad2, sseg, withAlpha} from '../../core/r3-sports-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Countdown to kick-off: two team crests flank (or sit above) four rolling digit tiles — days, hours, minutes, seconds — that
 * count down in real time or faster (`rate`); each tile rolls its old number up and the new one in, the seconds tile pulses on
 * every tick, stadium light beams in the two team colours sweep behind, and the match, competition and venue lines sit around it.
 * If the clock reaches zero inside the clip the tiles lock at 00 and the headline switches to `finalText`.
 */
type Props = {
  title: string;
  finalText: string;
  competition: string;
  teamA: string;
  teamB: string;
  tagA: string;
  tagB: string;
  logoA: string;
  logoB: string;
  colorA: string;
  colorB: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  rate: number;
  labels: string[];
  venue: string;
  date: string;
  background: string;
  surface: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const CountdownToKickoff: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, fps, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const wide = w / h > 1.45;
  const labels = Array.isArray(P.labels) && P.labels.length >= 4 ? P.labels : ['Days', 'Hours', 'Min', 'Sec'];
  const S0 = ((Math.max(0, num(P.days)) * 24 + Math.max(0, num(P.hours))) * 60 + Math.max(0, num(P.minutes))) * 60 + Math.max(0, num(P.seconds));
  const rate = Math.max(0, num(P.rate, 1));
  const totalAt = (f: number) => Math.max(0, S0 - (rate * Math.max(0, f - 20)) / fps);
  const parts = (f: number) => {
    const t = Math.floor(totalAt(f) + 1e-6);
    return [Math.floor(t / 86400), Math.floor((t % 86400) / 3600), Math.floor((t % 3600) / 60), t % 60];
  };
  const now = parts(frame);
  const hitZero = totalAt(frame) <= 0 && S0 > 0;
  const zeroFrame = S0 > 0 && rate > 0 ? 20 + (S0 * fps) / rate : Infinity;

  // layout
  const pad = 60 * u;
  const gap = (wide ? 26 : 16) * u;
  const crest = (wide ? 250 : portrait ? 230 : 190) * u;
  let tileW: number;
  if (wide) tileW = clampN(w * 0.095, 130 * u, 210 * u);
  else tileW = (w - pad * 2 - gap * 3) / 4;
  const tileH = tileW * 1.18;
  const rowW = tileW * 4 + gap * 3;
  const digitFs = tileW * 0.62;

  const enter = easeOut3(sseg(frame, 0, 24));
  const crestA = backOut(sseg(frame, 4, 30), 1.8);
  const crestB = backOut(sseg(frame, 10, 36), 1.8);
  const lbl = (c: string) => fitFont((c || '').toUpperCase(), 40 * u, crest * 1.8, 'display');
  const nameFs = Math.min(lbl(P.teamA), lbl(P.teamB));

  // beams
  const sw = Math.sin((frame / T) * Math.PI * 2);
  const beam = (x: number, dir: number, col: string, k: number) => (
    <polygon key={k} points={`${x - 30 * u},0 ${x + 30 * u},0 ${x + dir * w * 0.45 + sw * w * 0.04 * dir},${h} ${x + dir * w * 0.45 - dir * w * 0.3 + sw * w * 0.04 * dir},${h}`} fill={withAlpha(col, 0.16)} />
  );

  const tile = (i: number, tx: number, ty: number) => {
    const cur = now[i];
    // frames since the value last changed (up to 10)
    let since = 99;
    for (let k = 0; k < 10; k++) {
      if (parts(frame - k)[i] !== parts(frame - k - 1)[i]) {
        since = k;
        break;
      }
    }
    const prev = parts(frame - since - 1)[i];
    const roll = since < 10 ? easeOut3(since / 9) : 1;
    const tin = sseg(frame, 14 + i * 6, 38 + i * 6);
    const e = backOut(tin, 1.5);
    const pulse = i === 3 && !hitZero ? Math.max(0, 1 - since / 12) : 0;
    const digits = (n: number) => pad2(n > 99 ? 99 : n);
    const half = tileH * 0.5;
    return (
      <div key={i} style={{position: 'absolute', left: tx, top: ty, width: tileW, height: tileH + 40 * u, opacity: Math.min(1, tin * 3), transform: `translateY(${(1 - e) * 60 * u}px) scale(${0.85 + 0.15 * e + pulse * 0.04})`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: tileW, height: tileH, borderRadius: tileW * 0.1, overflow: 'hidden', background: `linear-gradient(180deg, ${mixHex(P.surface, '#ffffff', 0.1)}, ${mixHex(P.surface, '#000000', 0.25)})`, boxShadow: `0 ${10 * u}px ${28 * u}px rgba(0,0,0,0.5), 0 0 ${pulse * 36 * u}px ${withAlpha(P.accent, 0.6 * pulse)}`, border: `${2 * u}px solid ${withAlpha(P.ink, 0.12 + pulse * 0.4)}`, boxSizing: 'border-box'}}>
          {/* rolling digits */}
          <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
            {since < 10 && (
              <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: tileH, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontSize: digitFs, color: P.ink, fontVariantNumeric: 'tabular-nums', transform: `translateY(${-roll * tileH}px)`, opacity: 1 - roll}}>{digits(prev)}</div>
            )}
            <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: tileH, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontSize: digitFs, color: i === 3 ? P.accent : P.ink, fontVariantNumeric: 'tabular-nums', transform: `translateY(${since < 10 ? (1 - roll) * tileH : 0}px)`}}>{digits(cur)}</div>
          </div>
          {/* flip-card seam */}
          <div style={{position: 'absolute', left: 0, right: 0, top: half - 1.5 * u, height: 3 * u, background: 'rgba(0,0,0,0.55)'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: half, background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0))'}} />
        </div>
        <div style={{position: 'absolute', left: 0, width: tileW, top: tileH + 12 * u, textAlign: 'center', fontFamily: body, fontWeight: 700, fontSize: 24 * u, letterSpacing: 6 * u, color: withAlpha(P.ink, 0.75), textTransform: 'uppercase'}}>{labels[i]}</div>
      </div>
    );
  };

  // positions
  const tilesTop = wide ? h / 2 - tileH / 2 + 10 * u : portrait ? h * 0.5 : h * 0.5;
  const tilesLeft = (w - rowW) / 2;
  const crestY = wide ? h / 2 - crest / 2 - 20 * u : portrait ? h * 0.22 : h * 0.2;
  const crestAx = wide ? tilesLeft - crest - 110 * u : w * 0.5 - crest - 120 * u;
  const crestBx = wide ? tilesLeft + rowW + 110 * u : w * 0.5 + 120 * u;
  const titleTop = wide ? h / 2 - tileH / 2 - 120 * u : tilesTop - 120 * u;
  const finalMix = hitZero ? easeOut3(sseg(frame, zeroFrame, zeroFrame + 14)) : 0;
  const tFs = fitFont((hitZero ? P.finalText : P.title).toUpperCase(), (wide ? 64 : 58) * u, (wide ? rowW : w - pad * 2) * 0.98);

  const crestBlock = (side: 0 | 1, x: number, y: number) => {
    const name = side === 0 ? P.teamA : P.teamB;
    const tag = side === 0 ? P.tagA : P.tagB;
    const col = side === 0 ? P.colorA : P.colorB;
    const logo = side === 0 ? P.logoA : P.logoB;
    const e = side === 0 ? crestA : crestB;
    return (
      <div style={{position: 'absolute', left: x, top: y, width: crest, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 * u, opacity: Math.min(1, e), transform: `scale(${0.5 + 0.5 * e}) translateY(${Math.sin((frame + side * 20) / 22) * 5 * u}px)`}}>
        <div style={{filter: `drop-shadow(0 0 ${30 * u}px ${withAlpha(col, 0.5)})`}}>
          <Crest size={crest} label={tag || name} color={col} src={logo} shape="shield" font={head} />
        </div>
        <div style={{fontFamily: head, fontSize: nameFs, color: P.ink, textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.05, textAlign: 'center'}}>{name}</div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 70% at 15% 50%, ${withAlpha(P.colorA, 0.3)}, transparent 70%), radial-gradient(ellipse 60% 70% at 85% 50%, ${withAlpha(P.colorB, 0.3)}, transparent 70%)`}} />
          <Svg>
            {beam(w * 0.08, 1, P.colorA, 0)}
            {beam(w * 0.92, -1, P.colorB, 1)}
          </Svg>
          <Vignette strength={0.55} />
        </>
      )}
      {/* competition */}
      <div style={{position: 'absolute', left: 0, right: 0, top: (wide ? 70 : portrait ? 140 : 70) * u, textAlign: 'center', opacity: enter, transform: `translateY(${(1 - enter) * -24 * u}px)`}}>
        <div style={{fontFamily: body, fontWeight: 700, fontSize: 28 * u, letterSpacing: 12 * u, color: P.accent, textTransform: 'uppercase'}}>{P.competition}</div>
        <div style={{width: 160 * u * enter, height: 4 * u, background: P.accent, margin: `${14 * u}px auto 0`}} />
      </div>

      {crestBlock(0, crestAx, crestY)}
      {crestBlock(1, crestBx, crestY)}
      {/* vs */}
      {!wide && (
        <div style={{position: 'absolute', left: 0, right: 0, top: crestY + crest * 0.32, textAlign: 'center', fontFamily: head, fontSize: 70 * u, color: P.accent, opacity: enter}}>VS</div>
      )}

      {/* headline */}
      <div style={{position: 'absolute', left: wide ? tilesLeft : pad, width: wide ? rowW : w - pad * 2, top: titleTop, textAlign: 'center', fontFamily: head, fontSize: tFs, color: hitZero ? P.accent : P.ink, textTransform: 'uppercase', whiteSpace: 'nowrap', opacity: enter, transform: `scale(${1 + finalMix * 0.12})`, textShadow: `0 ${4 * u}px ${20 * u}px rgba(0,0,0,0.5)`}}>
        {hitZero ? P.finalText : P.title}
      </div>

      {[0, 1, 2, 3].map((i) => tile(i, tilesLeft + i * (tileW + gap), tilesTop))}

      {/* venue / date */}
      <div style={{position: 'absolute', left: 0, right: 0, top: tilesTop + tileH + 100 * u, textAlign: 'center', opacity: easeOut3(sseg(frame, 50, 80)), transform: `translateY(${(1 - easeOut3(sseg(frame, 50, 80))) * 20 * u}px)`}}>
        {P.date && <div style={{fontFamily: head, fontSize: 46 * u, color: P.ink, textTransform: 'uppercase'}}>{P.date}</div>}
        {P.venue && <div style={{fontFamily: body, fontWeight: 600, fontSize: 30 * u, letterSpacing: 6 * u, color: withAlpha(P.ink, 0.75), textTransform: 'uppercase', marginTop: 8 * u}}>{P.venue}</div>}
      </div>
    </AbsoluteFill>
  );
};

export const countdownToKickoff = defineMotion<Props>({
  id: 'countdown-to-kickoff',
  title: 'Countdown to kick-off',
  category: 'game',
  description: 'Two team crests flank four rolling countdown tiles (days, hours, minutes, seconds) that tick down with a roll and a pulse on the seconds tile, under stadium light beams in the team colours, with competition, date and venue lines; at zero the headline switches to a final message.',
  source: ['original'],
  useFor: 'Match-day teasers, "kick-off in" promos, tip-off, race-start, tournament and event countdowns. Set the starting days / hours / minutes / seconds, the two teams (names, colours, optional logos), the date and venue.',
  durationInFrames: 240,
  defaultProps: {
    title: 'Kick-off in',
    finalText: 'Kick-off!',
    competition: 'Friendly cup · Round 2',
    teamA: 'Northgate',
    teamB: 'Harbor City',
    tagA: 'NGT',
    tagB: 'HBC',
    logoA: '',
    logoB: '',
    colorA: '#2F6BFF',
    colorB: '#FF4D5E',
    days: 2,
    hours: 4,
    minutes: 36,
    seconds: 4,
    rate: 1,
    labels: ['Days', 'Hours', 'Min', 'Sec'],
    venue: 'Riverside Stadium',
    date: 'Saturday · 15:00',
    background: '#070B18',
    surface: '#18213A',
    ink: '#FFFFFF',
    accent: '#FFC933',
    fontFamily: 'auto',
  },
  propDocs: {
    title: 'headline above the tiles',
    finalText: 'headline once the clock hits zero inside the clip',
    competition: 'small line at the top (competition, round)',
    teamA: 'left / first team name',
    teamB: 'right / second team name',
    tagA: 'short tag for team A (logo fallback)',
    tagB: 'short tag for team B',
    logoA: 'team A logo image (public/ path or URL); empty = coloured tag badge',
    logoB: 'team B logo image; empty = coloured tag badge',
    colorA: 'team A colour (crest, glow, light beam)',
    colorB: 'team B colour',
    days: 'days left at the start of the clip',
    hours: 'hours left at the start',
    minutes: 'minutes left at the start',
    seconds: 'seconds left at the start',
    rate: 'clock speed: 1 = real time, 60 = a minute per second, 3600 = an hour per second',
    labels: 'four labels under the tiles (Days, Hours, Min, Sec)',
    venue: 'venue line; empty hides it',
    date: 'date / time line; empty hides it',
    background: 'frame colour, or "transparent" to overlay footage',
    surface: 'tile colour',
    ink: 'text colour',
    accent: 'seconds, competition and rule colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: CountdownToKickoff,
  tags: ['countdown', 'kickoff', 'kick-off', 'match day', 'timer', 'days hours minutes', 'tip-off', 'fixture', 'versus', 'football', 'soccer', 'basketball', 'sports', 'event', 'teaser', 'preview'],
});
