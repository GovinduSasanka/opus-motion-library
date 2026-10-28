import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {Silhouette, avatarColor, backOut, bgCss, bodyFont, easeIO, easeOut3, headFont, initials, mixHex, sseg, withAlpha} from '../../core/r3-game-kit';
import {Svg, Vignette, useStage} from '../../core/stage';
import {estWidth} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * Player / character / athlete profile card: avatar panel, name, handle, role and team chips, an overall-rating hex badge
 * and segmented stat bars that fill and count up one after another. Slides in, shines once, then holds with the bars alive.
 * Side-by-side at 16:9, stacked at 9:16. Works for esports rosters, fantasy picks, hero select, team intros and "player of the match" cards.
 */
type Stat = {label: string; value: number; max?: number; suffix?: string};
type Props = {
  name: string;
  handle: string;
  role: string;
  team: string;
  src: string;
  stats: Stat[];
  overall: number | string;
  badgeLabel: string;
  background: string;
  surface: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const DEFAULT_STATS: Stat[] = [
  {label: 'Aim', value: 92},
  {label: 'Reaction', value: 88},
  {label: 'Teamplay', value: 76},
  {label: 'Game sense', value: 84},
  {label: 'Clutch', value: 69},
];

const PlayerStatCard: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const stats = (P.stats && P.stats.length ? P.stats : DEFAULT_STATS).slice(0, 6).map((s) => ({...s, max: s.max && s.max > 0 ? s.max : 100, value: Number(s.value) || 0}));
  const auto = Math.round(stats.reduce((a, s) => a + Math.min(1, s.value / s.max), 0) / stats.length * 100);
  const overall = typeof P.overall === 'number' && P.overall > 0 ? Math.round(P.overall) : Number(P.overall) > 0 ? Math.round(Number(P.overall)) : auto;
  const tint = avatarColor(P.name || 'x');

  // geometry
  const CW = portrait ? w * 0.9 : Math.min(w * 0.88, 1560 * u);
  const CH = portrait ? Math.min(h * 0.84, 1560 * u) : Math.min(h * 0.74, 720 * u);
  const left = (w - CW) / 2;
  const top = (h - CH) / 2;
  const avW = portrait ? CW : CW * 0.38;
  const avH = portrait ? CH * 0.36 : CH;
  const pad = (portrait ? 44 : 52) * u;
  const infoW = portrait ? CW - pad * 2 : CW - avW - pad * 1.6 - 40 * u;
  const skew = portrait ? 0 : 70 * u;

  const enter = easeOut3(sseg(frame, 0, 30));
  const exit = sseg(frame, T - 22, T);
  const cardAlpha = Math.min(enter, 1 - exit);
  const reveal = easeIO(sseg(frame, 8, 40));
  const shine = sseg(frame, 44, 88);
  const kb = 1 + 0.05 * sseg(frame, 0, T);

  // name fitting
  const nameStr = (P.name || '').toUpperCase();
  let nameFs = (portrait ? 84 : 78) * u;
  const nameNeed = estWidth(nameStr, nameFs, 'display');
  if (nameNeed > infoW) nameFs = (nameFs * infoW) / nameNeed;

  const rowH = portrait ? 82 * u : Math.min(62 * u, (CH - 300 * u) / stats.length);
  const badge = (portrait ? 170 : 150) * u;
  const bp = backOut(sseg(frame, 30, 54), 2);
  const oCount = Math.round(overall * easeOut3(sseg(frame, 34, 90)));

  const chip = (txt: string, filled: boolean, key: string) =>
    txt ? (
      <div
        key={key}
        style={{
          fontFamily: body,
          fontWeight: 700,
          fontSize: 22 * u,
          letterSpacing: 3 * u,
          textTransform: 'uppercase',
          padding: `${7 * u}px ${16 * u}px`,
          background: filled ? P.accent : 'transparent',
          color: filled ? mixHex(P.background === 'transparent' ? '#0A0E1C' : P.background, '#000000', 0.3) : withAlpha(P.ink, 0.85),
          border: filled ? undefined : `${2 * u}px solid ${withAlpha(P.ink, 0.3)}`,
          borderRadius: 6 * u,
          whiteSpace: 'nowrap',
        }}
      >
        {txt}
      </div>
    ) : null;

  const statRows = stats.map((s, i) => {
    const a = 26 + i * 8;
    const fill = easeOut3(sseg(frame, a + 10, a + 56));
    const ap = easeOut3(sseg(frame, a, a + 16));
    const frac = Math.min(1, s.value / s.max) * fill;
    const num = Math.round(s.value * fill);
    return (
      <div key={i} style={{height: rowH, display: 'flex', alignItems: 'center', gap: 18 * u, opacity: ap, transform: `translateX(${(1 - ap) * 40 * u}px)`}}>
        <div style={{width: (portrait ? 220 : 190) * u, fontFamily: body, fontWeight: 700, fontSize: (portrait ? 30 : 26) * u, letterSpacing: 2 * u, textTransform: 'uppercase', color: withAlpha(P.ink, 0.72), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{s.label}</div>
        <div style={{flex: 1, height: rowH * 0.36, position: 'relative', background: withAlpha(P.ink, 0.09), borderRadius: 4 * u, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${frac * 100}%`, background: `linear-gradient(90deg, ${P.accent2}, ${P.accent})`}} />
          <div style={{position: 'absolute', left: `calc(${frac * 100}% - ${5 * u}px)`, top: 0, bottom: 0, width: 5 * u, background: '#fff', opacity: fill > 0 && fill < 1 ? 0.9 : 0}} />
          <div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(90deg, transparent 0, transparent calc(5% - ${3 * u}px), ${P.surface} calc(5% - ${3 * u}px), ${P.surface} 5%)`}} />
        </div>
        <div style={{width: (portrait ? 110 : 96) * u, textAlign: 'right', fontFamily: head, fontSize: (portrait ? 44 : 38) * u, color: P.ink, fontVariantNumeric: 'tabular-nums'}}>
          {num}
          {s.suffix ? <span style={{fontSize: 22 * u, marginLeft: 3 * u, color: withAlpha(P.ink, 0.6)}}>{s.suffix}</span> : null}
        </div>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 65% 60% at 28% 40%, ${withAlpha(P.accent2, 0.22)}, transparent 70%), radial-gradient(ellipse 50% 50% at 85% 75%, ${withAlpha(P.accent, 0.12)}, transparent 70%)`}} />
          <Svg>
            {Array.from({length: 9}).map((_, i) => {
              const x = ((i * 260 * u + frame * 1.2) % (w + 600 * u)) - 300 * u;
              return <line key={i} x1={x} y1={h} x2={x + h * 0.5} y2={0} stroke={withAlpha(P.ink, 0.035)} strokeWidth={30 * u} />;
            })}
          </Svg>
          <Vignette strength={0.5} />
        </>
      )}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: CW,
          height: CH,
          opacity: cardAlpha,
          transform: `translateY(${(1 - enter) * 70 * u + exit * 30 * u}px) scale(${0.94 + 0.06 * enter})`,
          filter: `drop-shadow(0 ${24 * u}px ${44 * u}px rgba(0,0,0,0.5))`,
        }}
      >
        <div style={{position: 'absolute', inset: 0, background: P.surface, borderRadius: 18 * u, overflow: 'hidden', border: `${2 * u}px solid ${withAlpha(P.ink, 0.12)}`}}>
          {/* avatar panel */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: avW,
              height: avH,
              overflow: 'hidden',
              clipPath: portrait ? `inset(0 0 ${(1 - reveal) * 100}% 0)` : `polygon(0 0,${avW}px 0,${avW - skew}px ${avH}px,0 ${avH}px)`,
            }}
          >
            <div style={{position: 'absolute', inset: 0, transform: `scale(${kb})`, transformOrigin: '50% 30%', opacity: reveal}}>
              {P.src ? <Img src={resolveSrc(P.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <Silhouette width={avW} height={avH} color={tint} seed={P.name} />}
            </div>
            <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${portrait ? 180 : 100}deg, transparent 55%, ${withAlpha(P.surface, 0.9)})`}} />
            {!P.src && (
              <div style={{position: 'absolute', left: pad * 0.8, bottom: pad * 0.7, fontFamily: head, fontSize: (portrait ? 150 : 140) * u, lineHeight: 1, color: withAlpha('#ffffff', 0.16)}}>{initials(P.name)}</div>
            )}
            <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-30 + shine * 160}%`, width: '22%', background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.28), transparent)', transform: 'skewX(-18deg)'}} />
          </div>
          {!portrait && (
            <svg width={avW + 10 * u} height={avH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <line x1={avW} y1={0} x2={avW - skew} y2={avH} stroke={P.accent} strokeWidth={5 * u} opacity={reveal} />
            </svg>
          )}

          {/* info */}
          <div style={{position: 'absolute', left: portrait ? pad : avW + pad * 0.6, top: portrait ? avH + 28 * u : pad * 0.85, width: infoW, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', gap: 12 * u, marginBottom: 14 * u, opacity: easeOut3(sseg(frame, 14, 34)), flexWrap: 'wrap'}}>
              {chip(P.role, true, 'r')}
              {chip(P.team, false, 't')}
            </div>
            <div style={{fontFamily: head, fontSize: nameFs, lineHeight: 1.02, color: P.ink, whiteSpace: 'nowrap', letterSpacing: nameFs * 0.015, clipPath: `inset(0 ${(1 - easeOut3(sseg(frame, 10, 40))) * 100}% 0 0)`}}>{nameStr}</div>
            <div style={{fontFamily: body, fontWeight: 600, fontSize: (portrait ? 32 : 28) * u, color: P.accent, marginTop: 6 * u, marginBottom: (portrait ? 22 : 16) * u, opacity: easeOut3(sseg(frame, 18, 38)), letterSpacing: 2 * u}}>{P.handle}</div>
            <div style={{height: 3 * u, background: withAlpha(P.ink, 0.14), marginBottom: 6 * u, width: `${easeOut3(sseg(frame, 18, 46)) * 100}%`}} />
            {statRows}
          </div>

          {/* overall badge */}
          <div style={{position: 'absolute', right: pad * 0.7, top: portrait ? avH - badge * 0.62 : pad * 0.6, width: badge, height: badge, transform: `scale(${0.3 + 0.7 * bp})`, opacity: Math.min(1, bp * 1.6)}}>
            <div style={{position: 'absolute', inset: 0, background: P.accent, clipPath: 'polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)'}} />
            <div style={{position: 'absolute', inset: badge * 0.05, background: `linear-gradient(160deg, ${mixHex(P.surface, P.accent2, 0.35)}, ${mixHex(P.surface, '#000000', 0.4)})`, clipPath: 'polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{fontFamily: head, fontSize: badge * 0.42, lineHeight: 1, color: P.ink, fontVariantNumeric: 'tabular-nums'}}>{oCount}</div>
              <div style={{fontFamily: body, fontWeight: 700, fontSize: badge * 0.14, letterSpacing: badge * 0.03, color: P.accent, marginTop: badge * 0.03}}>{P.badgeLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const playerStatCard = defineMotion<Props>({
  id: 'player-stat-card',
  title: 'Player stat card',
  category: 'game',
  description: 'Profile card with an avatar panel, name, handle, role and team chips, an overall-rating hex badge and segmented stat bars that fill and count up in turn. Side-by-side in landscape, stacked in portrait.',
  source: ['original'],
  useFor: 'Esports roster and player-of-the-match cards, character or hero select, fantasy picks, athlete or team-member intros, product-spec "stat" cards. Set `src` to the avatar and `stats` to your own labelled numbers.',
  durationInFrames: 240,
  defaultProps: {
    name: 'Alex Mercer',
    handle: '@nightfall',
    role: 'Entry',
    team: 'Team Nova',
    src: '',
    stats: DEFAULT_STATS,
    overall: 'auto',
    badgeLabel: 'OVR',
    background: '#090C1A',
    surface: '#131A33',
    ink: '#F3F6FF',
    accent: '#35E0A1',
    accent2: '#2F7BFF',
    fontFamily: 'auto',
  },
  propDocs: {
    name: 'player name (large)',
    handle: 'handle / tagline under the name',
    role: 'filled chip (role, class, position)',
    team: 'outlined chip (team, guild, club)',
    src: 'avatar image (public/ path or URL); empty = neutral silhouette with initials',
    stats: 'array of {label, value, max?, suffix?} (up to 6); bars fill to value / max (max defaults to 100)',
    overall: 'number for the badge, or "auto" to average the stats',
    badgeLabel: 'tiny label in the badge (OVR, LVL, RTG)',
    background: 'frame colour, or "transparent" to overlay content',
    surface: 'card colour',
    ink: 'text colour',
    accent: 'highlight colour (chips, badge, bar end)',
    accent2: 'second colour (bar start, glow)',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: PlayerStatCard,
  tags: ['esports', 'player', 'stats', 'profile', 'card', 'character', 'roster', 'rating', 'leaderboard', 'game', 'gaming', 'athlete', 'bars', 'hero', 'intro'],
});
