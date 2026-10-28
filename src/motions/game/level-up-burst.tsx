import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {backOut, bgCss, bodyFont, easeIO, easeOut3, fmtInt, headFont, mixHex, sseg, withAlpha} from '../../core/r3-game-kit';
import {rng} from '../../core/random';
import {Svg, Vignette, useStage} from '../../core/stage';
import {estWidth} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * "LEVEL UP" moment: an XP bar fills with a counting reward, hits full and overflows in a flash — rays, shockwave rings and
 * sparks burst from a hex level badge whose number ticks up, the title slams in, the bar drains back to the carry-over
 * and perk chips pop below. Everything (labels, numbers, perks, colours) is a prop.
 */
type Props = {
  title: string;
  level: number;
  xp: number;
  xpLabel: string;
  carry: number;
  perks: string[];
  background: string;
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
};

const LevelUpBurst: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait, cx, cy} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const level = Math.max(1, Math.round(P.level));
  const perks = (P.perks || []).slice(0, 3);
  const dark = P.background && P.background !== 'transparent' ? P.background : '#0A0D1A';

  const tb = Math.round(T * 0.34); // burst frame
  const fillP = easeIO(sseg(frame, 14, tb - 4));
  const after = frame >= tb;
  const burstT = frame - tb;
  const exit = sseg(frame, T - 18, T);
  const alpha = 1 - exit;

  // layout
  const k = portrait ? 1.22 : 1;
  const badgeS = 230 * u * (portrait ? 1.1 : 1);
  const by = cy - 270 * u * k + 20 * u;
  const titleY = cy - 40 * u * k + 20 * u;
  const barY = cy + 140 * u * k + 20 * u;
  const perkY = cy + 250 * u * k + 20 * u;
  const barW = portrait ? w * 0.82 : Math.min(w * 0.5, 940 * u);
  const barH = 34 * u;

  // title
  const title = (P.title || 'LEVEL UP').toUpperCase();
  let tfs = (portrait ? 150 : 170) * u;
  const need = estWidth(title, tfs, 'display');
  const maxW = portrait ? w * 0.88 : w * 0.7;
  if (need > maxW) tfs = (tfs * maxW) / need;
  const tp = backOut(sseg(frame, tb, tb + 14), 2.2);
  const tScale = after ? 0.55 + 0.45 * tp + Math.max(0, 1 - sseg(frame, tb, tb + 8)) * 0.9 : 0.4;
  const tIdle = after ? 1 + 0.015 * Math.sin(burstT * 0.12) : 1;

  // badge
  const bp = backOut(sseg(frame, tb + 2, tb + 22), 2.4);
  const shownLevel = burstT >= 8 ? level : level - 1;
  const lvlFlip = sseg(frame, tb + 6, tb + 14);

  // xp counter and bar
  const xpNow = Math.round(P.xp * (after ? 1 : fillP));
  const barFill = after ? 1 - easeIO(sseg(frame, tb + 12, tb + 46)) * (1 - Math.max(0, Math.min(1, P.carry))) : fillP;
  const barAppear = easeOut3(sseg(frame, 0, 16));
  const full = !after ? sseg(frame, tb - 14, tb - 2) : 1 - sseg(frame, tb, tb + 14);
  const labelL = after && burstT > 6 ? level : level - 1;
  const labelR = labelL + 1;

  // rays
  const rayGrow = easeOut3(sseg(frame, tb, tb + 24));
  const rayFade = 1 - 0.35 * sseg(frame, tb + 40, T - 20);
  const rot = burstT * 0.35;
  const NR = 16;
  const RL = Math.hypot(w, h) * 0.75;

  // sparks
  const R = rng('level-up-burst');
  const sparks = Array.from({length: 44}, () => ({a: R() * Math.PI * 2, v: 220 + R() * 620, l: 26 + R() * 40, s: 0.6 + R() * 1.1, c: R() < 0.55 ? 0 : R() < 0.7 ? 1 : 2}));

  const flash = after ? 1 - sseg(frame, tb, tb + 12) : 0;
  const ringP = (d: number) => sseg(frame, tb + d, tb + d + 34);

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 55% at 50% 38%, ${withAlpha(P.accent2, 0.2)}, transparent 70%)`}} />}
      <AbsoluteFill style={{opacity: alpha}}>
        <Svg>
          <defs>
            <radialGradient id="lub-ray" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor={P.accent} stopOpacity="0.85" />
              <stop offset="0.55" stopColor={P.accent} stopOpacity="0.18" />
              <stop offset="1" stopColor={P.accent} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lub-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor={P.accent} stopOpacity="0.9" />
              <stop offset="1" stopColor={P.accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          {after && (
            <g transform={`translate(${cx} ${by}) rotate(${rot})`} opacity={rayFade}>
              {Array.from({length: NR}).map((_, i) => {
                const a0 = (i / NR) * Math.PI * 2;
                const a1 = a0 + (Math.PI * 2) / NR * 0.42;
                const r = RL * rayGrow;
                return <path key={i} d={`M0 0 L${Math.cos(a0) * r} ${Math.sin(a0) * r} L${Math.cos(a1) * r} ${Math.sin(a1) * r}Z`} fill="url(#lub-ray)" transform={`scale(1)`} />;
              })}
            </g>
          )}
          {after && <circle cx={cx} cy={by} r={badgeS * (1.1 + 0.9 * easeOut3(sseg(frame, tb, tb + 40)))} fill="url(#lub-glow)" opacity={0.5 * (1 - sseg(frame, tb + 10, tb + 70))} />}
          {after &&
            [0, 8].map((d, i) => {
              const p = ringP(d);
              return p > 0 && p < 1 ? <circle key={i} cx={cx} cy={by} r={badgeS * 0.4 + p * Math.max(w, h) * 0.5} fill="none" stroke={i === 0 ? P.accent : P.accent2} strokeWidth={(14 - 11 * p) * u} opacity={1 - p} /> : null;
            })}
          {after &&
            sparks.map((s, i) => {
              const t = burstT / s.l;
              if (t < 0 || t > 1) return null;
              const e = easeOut3(t);
              const d = s.v * u * e * 0.7;
              const x = cx + Math.cos(s.a) * d;
              const y = by + Math.sin(s.a) * d + 60 * u * t * t;
              const len = 26 * u * s.s * (1 - t);
              const col = s.c === 0 ? P.accent : s.c === 1 ? P.accent2 : '#ffffff';
              return <line key={i} x1={x} y1={y} x2={x - Math.cos(s.a) * len} y2={y - Math.sin(s.a) * len} stroke={col} strokeWidth={5 * u * s.s * (1 - t * 0.6)} strokeLinecap="round" opacity={1 - t} />;
            })}
          {/* bar overflow: shockwave from the bar at the moment it fills */}
          {after && ringP(-0) > 0 && ringP(0) < 1 && (
            <rect x={cx - barW / 2 - ringP(0) * 120 * u} y={barY - barH / 2 - ringP(0) * 40 * u} width={barW + ringP(0) * 240 * u} height={barH + ringP(0) * 80 * u} rx={(barH / 2) * (1 + ringP(0))} fill="none" stroke={P.accent2} strokeWidth={6 * u * (1 - ringP(0))} opacity={0.9 * (1 - ringP(0))} />
          )}
        </Svg>

        {/* badge */}
        <div style={{position: 'absolute', left: cx - badgeS / 2, top: by - badgeS / 2, width: badgeS, height: badgeS, transform: `scale(${after ? 0.25 + 0.75 * bp : 0})`, opacity: after ? Math.min(1, bp * 2) : 0}}>
          <div style={{position: 'absolute', inset: 0, background: P.accent, clipPath: 'polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)'}} />
          <div style={{position: 'absolute', inset: badgeS * 0.045, background: `linear-gradient(160deg, ${mixHex(dark, P.accent2, 0.4)}, ${mixHex(dark, '#000000', 0.2)})`, clipPath: 'polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)'}} />
          <div style={{position: 'absolute', inset: badgeS * 0.12, border: `${3 * u}px solid ${withAlpha(P.accent, 0.5)}`, clipPath: 'polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)'}} />
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{fontFamily: body, fontWeight: 700, fontSize: badgeS * 0.12, letterSpacing: badgeS * 0.03, color: P.accent, lineHeight: 1}}>LEVEL</div>
            <div style={{fontFamily: head, fontSize: badgeS * 0.44, lineHeight: 1, color: P.ink, transform: `scale(${1 + 0.35 * Math.sin(lvlFlip * Math.PI)})`, marginTop: badgeS * 0.02}}>{shownLevel}</div>
          </div>
        </div>

        {/* title */}
        <div style={{position: 'absolute', left: 0, right: 0, top: titleY - tfs * 0.55, height: tfs * 1.1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: after ? Math.min(1, tp * 2) : 0, transform: `scale(${tScale * tIdle})`}}>
          <div style={{fontFamily: head, fontSize: tfs, lineHeight: 1, letterSpacing: tfs * 0.03, whiteSpace: 'nowrap', background: `linear-gradient(180deg, ${P.ink} 25%, ${P.accent} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 ${6 * u}px 0 ${withAlpha('#000000', 0.45)}) drop-shadow(0 0 ${28 * u}px ${withAlpha(P.accent, 0.55)})`}}>{title}</div>
        </div>

        {/* xp bar */}
        <div style={{position: 'absolute', left: cx - barW / 2, top: barY - 80 * u, width: barW, height: 160 * u, opacity: barAppear, transform: `translateY(${(1 - barAppear) * 30 * u}px)`}}>
          <div style={{position: 'absolute', left: 0, top: 22 * u, fontFamily: body, fontWeight: 700, fontSize: 26 * u, letterSpacing: 3 * u, color: withAlpha(P.ink, 0.85)}}>LV {labelL}</div>
          <div style={{position: 'absolute', right: 0, top: 22 * u, fontFamily: body, fontWeight: 700, fontSize: 26 * u, letterSpacing: 3 * u, color: withAlpha(P.ink, 0.5)}}>LV {labelR}</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 18 * u, textAlign: 'center', fontFamily: head, fontSize: 34 * u, color: P.accent, fontVariantNumeric: 'tabular-nums', letterSpacing: 2 * u, transform: `scale(${1 + 0.2 * flash})`}}>
            +{fmtInt(xpNow)} {P.xpLabel}
          </div>
          <div style={{position: 'absolute', left: 0, top: 80 * u, width: barW, height: barH, borderRadius: barH / 2, background: withAlpha(P.ink, 0.12), overflow: 'hidden', boxShadow: `0 0 ${(18 + 50 * full) * u}px ${withAlpha(P.accent2, 0.15 + 0.6 * full)}, inset 0 0 0 ${2 * u}px ${withAlpha(P.ink, 0.15)}`}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barFill * 100}%`, background: `linear-gradient(90deg, ${P.accent2}, ${mixHex(P.accent2, '#ffffff', 0.4)})`, borderRadius: barH / 2}} />
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barFill * 100}%`, background: `repeating-linear-gradient(115deg, transparent 0 ${14 * u}px, rgba(255,255,255,0.2) ${14 * u}px ${28 * u}px)`, backgroundPosition: `${frame * 1.5}px 0`}} />
            <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.8}} />
          </div>
        </div>

        {/* perks */}
        <div style={{position: 'absolute', left: 0, right: 0, top: perkY, display: 'flex', justifyContent: 'center', gap: 16 * u, flexWrap: 'wrap', padding: `0 ${40 * u}px`}}>
          {perks.map((pk, i) => {
            const p = backOut(sseg(frame, tb + 26 + i * 7, tb + 44 + i * 7), 2);
            return (
              <div key={i} style={{fontFamily: body, fontWeight: 700, fontSize: (portrait ? 28 : 26) * u, letterSpacing: 2 * u, color: P.ink, textTransform: 'uppercase', padding: `${12 * u}px ${24 * u}px`, borderRadius: 999, background: withAlpha(P.ink, 0.1), border: `${2 * u}px solid ${withAlpha(P.accent, 0.7)}`, opacity: Math.min(1, p * 2), transform: `scale(${0.5 + 0.5 * p})`, display: 'flex', alignItems: 'center', gap: 12 * u, whiteSpace: 'nowrap'}}>
                <div style={{width: 12 * u, height: 12 * u, background: P.accent, transform: 'rotate(45deg)'}} />
                {pk}
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.55, pointerEvents: 'none'}} />
      </AbsoluteFill>
      {bgCss(P.background) && <Vignette strength={0.5} />}
    </AbsoluteFill>
  );
};

export const levelUpBurst = defineMotion<Props>({
  id: 'level-up-burst',
  title: 'Level-up burst',
  category: 'game',
  description: 'An XP bar fills with a counting reward and overflows in a flash: rays, shockwave rings and sparks burst from a hex level badge whose number ticks up, LEVEL UP slams in, the bar drains to the carry-over and perk chips pop.',
  source: ['original'],
  useFor: 'Game progression and reward moments, gamified apps and courses ("you reached level 12"), streak or rank-up celebrations, creator milestone cards. Replace title, level, xp and perks; works as an overlay with background "transparent".',
  durationInFrames: 210,
  defaultProps: {
    title: 'Level Up',
    level: 12,
    xp: 1250,
    xpLabel: 'XP',
    carry: 0.32,
    perks: ['New ability unlocked', '+10 Max health'],
    background: '#0A0D1A',
    ink: '#FFFFFF',
    accent: '#FFC933',
    accent2: '#33C8FF',
    fontFamily: 'auto',
  },
  propDocs: {
    title: 'big word on the burst (LEVEL UP, RANK UP, NEW TIER...)',
    level: 'the new level shown on the badge (the old one is level - 1)',
    xp: 'xp reward counted up on the bar',
    xpLabel: 'unit after the number (XP, PTS, STARS)',
    carry: 'fraction of the bar left filled after the level-up (0-1)',
    perks: 'up to 3 chips shown under the bar',
    background: 'frame colour, or "transparent" to overlay content',
    ink: 'text colour',
    accent: 'badge / title / ray colour',
    accent2: 'xp bar colour',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: LevelUpBurst,
  tags: ['level up', 'xp', 'progress', 'reward', 'rank', 'game', 'gaming', 'esports', 'celebration', 'burst', 'rays', 'achievement', 'gamification', 'overlay'],
});
