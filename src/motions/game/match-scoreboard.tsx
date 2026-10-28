import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Crest, bgCss, bodyFont, easeIO, easeOut3, headFont, mixHex, mmss, sseg, withAlpha} from '../../core/r3-game-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {estWidth} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Esports / sports match scoreboard: a slanted two-team bar with crests, score boxes that tick up one point at a time
 * (the number rolls and the team plate flashes), and a centre match clock that counts. Reads as a broadcast lower-third
 * or a full-screen "score so far" card; transparent background makes it an overlay for a stream or recap.
 */
type Props = {
  teamA: string;
  teamB: string;
  tagA: string;
  tagB: string;
  logoA: string;
  logoB: string;
  colorA: string;
  colorB: string;
  scoreA: number;
  scoreB: number;
  stage: string;
  subtitle: string;
  clockFrom: number;
  clockTo: number;
  position: 'center' | 'top' | 'bottom';
  background: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const MatchScoreboard: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const sA = Math.max(0, Math.round(P.scoreA));
  const sB = Math.max(0, Math.round(P.scoreB));
  const dark = '#0A0E1C';

  // score events: points arrive one at a time, the two teams alternating in proportion
  const E = Math.min(80, sA + sB);
  const t0 = 46;
  const span = Math.max(20, T - t0 - 34);
  const evA: number[] = [];
  const evB: number[] = [];
  {
    let a = 0;
    let b = 0;
    for (let i = 0; i < E; i++) {
      const f = t0 + ((i + 1) * span) / (E + 1);
      const pickA = b >= sB || (a < sA && a / Math.max(1, sA) <= b / Math.max(1, sB));
      if (pickA) {
        evA.push(f);
        a++;
      } else {
        evB.push(f);
        b++;
      }
    }
  }
  const cur = (ev: number[]) => ev.filter((f) => frame >= f).length;
  const last = (ev: number[]) => {
    const past = ev.filter((f) => frame >= f);
    return past.length ? past[past.length - 1] : -999;
  };
  const nowA = cur(evA);
  const nowB = cur(evB);

  // geometry
  const S = u * (portrait ? 1 : 1.1);
  const W = Math.min(w * 0.94, 1620 * u);
  const H = 132 * S * (portrait ? 0.9 : 1);
  const tw = W * (portrait ? 0.23 : 0.17);
  const sw = W * (portrait ? 0.1 : 0.085);
  const plate = (W - tw - sw * 2) / 2;
  const skew = H * 0.28;
  const crest = H * 0.82;
  const useTag = W < 1300 * u;
  const yTop = P.position === 'top' ? 70 * u : P.position === 'bottom' ? h - H - 120 * u : h / 2 - H / 2;
  const x0 = (w - W) / 2;

  const open = easeIO(sseg(frame, 0, 26));
  const clip = `inset(-40px ${(1 - open) * 50}% -40px ${(1 - open) * 50}%)`;
  const clockP = sseg(frame, 30, T - 30);
  const clockSec = P.clockFrom + (P.clockTo - P.clockFrom) * clockP;

  const Plate: React.FC<{side: 0 | 1}> = ({side}) => {
    const name = side === 0 ? P.teamA : P.teamB;
    const tag = side === 0 ? P.tagA : P.tagB;
    const col = side === 0 ? P.colorA : P.colorB;
    const logo = side === 0 ? P.logoA : P.logoB;
    const ev = side === 0 ? evA : evB;
    const flash = 1 - sseg(frame, last(ev), last(ev) + 16);
    const pad = H * 0.12;
    const textW = plate - crest - pad * 3 - skew * 1.3;
    const label = useTag ? tag || name.slice(0, 3) : name;
    let fs = 50 * S * (useTag ? 0.9 : 1);
    const need = estWidth(label.toUpperCase(), fs, 'display') * 1.18;
    if (need > textW) fs = (fs * textW) / need;
    const x = side === 0 ? x0 : x0 + W - plate;
    const enter = easeOut3(sseg(frame, 14, 40));
    const pop = easeOut3(sseg(frame, 18 + side * 4, 44 + side * 4));
    const cl = side === 0 ? `polygon(0 0,${plate}px 0,${plate - skew}px ${H}px,0 ${H}px)` : `polygon(${skew}px 0,${plate}px 0,${plate}px ${H}px,0 ${H}px)`;
    return (
      <div style={{position: 'absolute', left: x, top: 0, width: plate, height: H, clipPath: cl}}>
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${side === 0 ? 90 : 270}deg, ${mixHex(col, '#000000', 0.15)}, ${mixHex(col, dark, 0.7)})`}} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 45%)`}} />
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.4}} />
        <div
          style={{
            position: 'absolute',
            top: (H - crest) / 2,
            [side === 0 ? 'left' : 'right']: pad + (side === 0 ? 0 : skew * 0.2),
            transform: `scale(${0.4 + 0.6 * pop})`,
            opacity: pop,
          }}
        >
          <Crest size={crest} label={tag || name} color={col} src={logo} shape="shield" font={head} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: side === 0 ? 'flex-start' : 'flex-end',
            [side === 0 ? 'left' : 'right']: pad * 2 + crest + (side === 0 ? skew * 0.1 : skew * 0.3),
            width: textW + pad,
            fontFamily: head,
            fontSize: fs,
            color: P.ink,
            letterSpacing: fs * 0.02,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            opacity: enter,
            transform: `translateX(${(side === 0 ? -1 : 1) * (1 - enter) * 60 * S}px)`,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {label}
        </div>
      </div>
    );
  };

  const ScoreBox: React.FC<{side: 0 | 1}> = ({side}) => {
    const ev = side === 0 ? evA : evB;
    const col = side === 0 ? P.colorA : P.colorB;
    const total = side === 0 ? nowA : nowB;
    const prev = Math.max(0, total - 1);
    const lf = last(ev);
    const p = easeOut3(sseg(frame, lf, lf + 12));
    const flash = 1 - sseg(frame, lf, lf + 20);
    const x = x0 + plate + (side === 0 ? 0 : sw + tw);
    const shown = (n: number, off: number) => (
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${off}px)`}}>{n}</div>
    );
    const show = sseg(frame, 24 + side * 4, 46 + side * 4);
    return (
      <div style={{position: 'absolute', left: x, top: 0, width: sw, height: H, opacity: easeOut3(show)}}>
        <div style={{position: 'absolute', inset: 0, background: mixHex(dark, col, 0.18 + flash * 0.5), borderTop: `${4 * S}px solid ${mixHex(col, '#ffffff', 0.15 + flash * 0.5)}`}} />
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: head, fontSize: H * 0.62, color: P.ink, lineHeight: 1}}>
          {total > 0 && lf > -900 ? (
            <>
              {shown(prev, -p * H)}
              {shown(total, (1 - p) * H)}
            </>
          ) : (
            shown(0, 0)
          )}
        </div>
      </div>
    );
  };

  const timer = (
    <div style={{position: 'absolute', left: x0 + plate + sw, top: 0, width: tw, height: H, opacity: easeOut3(sseg(frame, 26, 48))}}>
      <div style={{position: 'absolute', inset: 0, background: dark}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 4 * S, background: P.accent}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 * S}}>
        <div style={{fontFamily: body, fontWeight: 700, fontSize: H * 0.4, color: P.ink, letterSpacing: H * 0.01, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{mmss(clockSec)}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8 * S}}>
          <div style={{width: 9 * S, height: 9 * S, borderRadius: '50%', background: P.accent, opacity: 0.55 + 0.45 * Math.sin(frame * 0.3)}} />
          <div style={{fontFamily: body, fontWeight: 700, fontSize: H * 0.15, color: P.accent, letterSpacing: H * 0.03}}>LIVE</div>
        </div>
      </div>
    </div>
  );

  const stageP = easeOut3(sseg(frame, 38, 62));
  const bigTagSize = Math.min(w * 0.26, h * 0.5);

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 70% at 0% 50%, ${withAlpha(P.colorA, 0.28)}, transparent 70%), radial-gradient(ellipse 60% 70% at 100% 50%, ${withAlpha(P.colorB, 0.28)}, transparent 70%)`}} />
          <Svg>
            {Array.from({length: 14}).map((_, i) => {
              const x = ((i * 191 + frame * 1.4) % (w + 400)) - 200;
              return <line key={i} x1={x} y1={0} x2={x - h * 0.45} y2={h} stroke={withAlpha(P.ink, 0.035)} strokeWidth={26 * u} />;
            })}
          </Svg>
          <div style={{position: 'absolute', left: w * 0.03, top: h * 0.5 - bigTagSize * 0.5, fontFamily: head, fontSize: bigTagSize, lineHeight: 1, color: withAlpha(P.colorA, 0.1), whiteSpace: 'nowrap'}}>{(P.tagA || P.teamA).slice(0, 3).toUpperCase()}</div>
          <div style={{position: 'absolute', right: w * 0.03, top: h * 0.5 - bigTagSize * 0.5, fontFamily: head, fontSize: bigTagSize, lineHeight: 1, color: withAlpha(P.colorB, 0.1), whiteSpace: 'nowrap'}}>{(P.tagB || P.teamB).slice(0, 3).toUpperCase()}</div>
          <Vignette strength={0.5} />
        </>
      )}
      {/* stage label above the bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: yTop - 56 * S,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18 * S,
          opacity: stageP,
          transform: `translateY(${(1 - stageP) * 16 * S}px)`,
          fontFamily: body,
          fontWeight: 700,
          fontSize: 25 * S,
          letterSpacing: 7 * S,
          color: P.ink,
          textTransform: 'uppercase',
        }}
      >
        <div style={{width: 60 * S * stageP, height: 3 * S, background: P.accent}} />
        {P.stage}
        <div style={{width: 60 * S * stageP, height: 3 * S, background: P.accent}} />
      </div>
      <div style={{position: 'absolute', left: 0, top: yTop, width: w, height: H, clipPath: clip, filter: `drop-shadow(0 ${14 * S}px ${26 * S}px rgba(0,0,0,0.5))`}}>
        <Plate side={0} />
        <Plate side={1} />
        {timer}
        <ScoreBox side={0} />
        <ScoreBox side={1} />
      </div>
      {P.subtitle && (
        <div
          style={{
            position: 'absolute',
            left: (w - tw * 1.5) / 2,
            width: tw * 1.5,
            top: yTop + H + 12 * S,
            height: 44 * S,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: P.accent,
            color: dark,
            fontFamily: body,
            fontWeight: 700,
            fontSize: 21 * S,
            letterSpacing: 4 * S,
            textTransform: 'uppercase',
            clipPath: slantPoly(tw * 1.5, 44 * S, 14 * S),
            opacity: stageP,
            transform: `translateY(${-(1 - stageP) * 20 * S}px)`,
          }}
        >
          {P.subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

const slantPoly = (w: number, h: number, s: number) => `polygon(${s}px 0,${w}px 0,${w - s}px ${h}px,0 ${h}px)`;

export const matchScoreboard = defineMotion<Props>({
  id: 'match-scoreboard',
  title: 'Match scoreboard',
  category: 'game',
  description: 'Slanted two-team scoreboard with crests, score boxes that roll up point by point with a flash, a centre match clock, a stage label and a subtitle chip.',
  source: ['original'],
  useFor: 'Esports and sports match overlays, tournament recaps, "score so far" cards and stream scenes. Give your team names, tags, logos and colours; use background "transparent" to lay it over footage.',
  durationInFrames: 240,
  defaultProps: {
    teamA: 'Team Nova',
    teamB: 'Team Vortex',
    tagA: 'NOV',
    tagB: 'VTX',
    logoA: '',
    logoB: '',
    colorA: '#2F7BFF',
    colorB: '#FF4D5E',
    scoreA: 3,
    scoreB: 2,
    stage: 'Grand Final',
    subtitle: 'Best of 5',
    clockFrom: 612,
    clockTo: 754,
    position: 'center',
    background: '#080B16',
    ink: '#FFFFFF',
    accent: '#FFC933',
    fontFamily: 'auto',
  },
  propDocs: {
    teamA: 'left team name (shown at wide frames)',
    teamB: 'right team name',
    tagA: 'left team short tag (3 letters; used in narrow frames and as the logo fallback)',
    tagB: 'right team short tag',
    logoA: 'left logo image (public/ path or URL); empty = coloured tag badge',
    logoB: 'right logo image; empty = coloured tag badge',
    colorA: 'left team colour',
    colorB: 'right team colour',
    scoreA: 'final score of the left team (points tick up one at a time)',
    scoreB: 'final score of the right team',
    stage: 'label above the bar (e.g. Grand Final, Map 2)',
    subtitle: 'chip under the clock (e.g. Best of 5); empty hides it',
    clockFrom: 'match clock at the start, in seconds (counts down if larger than clockTo)',
    clockTo: 'match clock at the end, in seconds',
    position: 'center | top | bottom',
    background: 'frame colour, or "transparent" to overlay footage',
    ink: 'text colour',
    accent: 'clock / stage highlight colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: MatchScoreboard,
  tags: ['esports', 'scoreboard', 'score', 'match', 'versus', 'teams', 'tournament', 'sports', 'game', 'gaming', 'stream', 'overlay', 'clock', 'timer', 'lower-third', 'hud'],
});
