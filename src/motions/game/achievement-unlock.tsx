import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {resolveSrc} from '../../core/asset';
import {backOut, bgCss, bodyFont, easeIO, easeOut3, headFont, mixHex, sseg, withAlpha} from '../../core/r3-game-kit';
import {heartPath, starPath, wrapText} from '../../core/r3-social';
import {Svg, Vignette, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * "Achievement unlocked" toast: a round badge pops with a drawn rim and a flash, the card unrolls from it, shows the small
 * header, the achievement title, a description and a points chip, a shine sweeps across, then it rolls back up. Several
 * achievements play one after another. Icon is a built-in glyph or your own image; corner/centre placement; overlay-ready.
 */
type Item = {title: string; description?: string; points?: number; icon?: string; iconSrc?: string; color?: string};
type Props = {
  items: Item[];
  header: string;
  pointsLabel: string;
  position: 'bottom-center' | 'bottom-left' | 'top-center' | 'top-right';
  background: string;
  surface: string;
  ink: string;
  accent: string;
  fontFamily: string;
};

const DEFAULT_ITEMS: Item[] = [
  {title: 'First Victory', description: 'Win your first ranked match', points: 50, icon: 'trophy'},
  {title: 'Sharpshooter', description: 'Land 100 precision hits in a single season', points: 100, icon: 'star'},
];

const PATHS: Record<string, string> = {
  trophy: 'M-0.55 -0.72 H0.55 V-0.1 C0.55 0.34 0.22 0.5 0 0.5 C-0.22 0.5 -0.55 0.34 -0.55 -0.1Z M-0.55 -0.52 H-0.92 C-0.92 -0.12 -0.72 0.06 -0.5 0.08 L-0.5 -0.06 C-0.62 -0.1 -0.74 -0.2 -0.74 -0.36 H-0.55Z M0.55 -0.52 H0.92 C0.92 -0.12 0.72 0.06 0.5 0.08 L0.5 -0.06 C0.62 -0.1 0.74 -0.2 0.74 -0.36 H0.55Z M-0.1 0.5 H0.1 V0.7 H0.38 V0.88 H-0.38 V0.7 H-0.1Z',
  crown: 'M-0.88 0.62 L-0.98 -0.5 L-0.42 -0.04 L0 -0.78 L0.42 -0.04 L0.98 -0.5 L0.88 0.62Z',
  bolt: 'M0.18 -0.95 L-0.58 0.12 H-0.06 L-0.22 0.95 L0.62 -0.22 H0.1Z',
  shield: 'M0 -0.92 L0.76 -0.6 V0 C0.76 0.5 0.36 0.8 0 0.96 C-0.36 0.8 -0.76 0.5 -0.76 0 V-0.6Z',
  flame: 'M0 -0.95 C0.15 -0.5 0.7 -0.25 0.7 0.3 C0.7 0.72 0.4 0.95 0 0.95 C-0.4 0.95 -0.7 0.72 -0.7 0.3 C-0.7 0 -0.5 -0.15 -0.4 -0.35 C-0.3 -0.1 -0.2 -0.1 -0.15 -0.15 C-0.15 -0.5 -0.1 -0.75 0 -0.95Z',
};

const Glyph: React.FC<{icon: string; size: number; color: string}> = ({icon, size, color}) => {
  const d = icon === 'star' ? starPath(0, 0, 0.95, 0.46) : icon === 'heart' ? heartPath(0, 0.05, 0.95) : PATHS[icon] || PATHS.trophy;
  return (
    <svg width={size} height={size} viewBox="-1 -1 2 2" style={{display: 'block', overflow: 'visible'}}>
      <path d={d} fill={color} fillRule="nonzero" stroke={color} strokeWidth={0.04} strokeLinejoin="round" />
    </svg>
  );
};

const AchievementUnlock: React.FC<Props> = (P) => {
  const frame = useCurrentFrame();
  const {w, h, u, durationInFrames: T, portrait} = useStage();
  const head = headFont(P.fontFamily);
  const body = bodyFont(P.fontFamily);
  const items = (P.items && P.items.length ? P.items : DEFAULT_ITEMS).slice(0, 5);
  const n = items.length;
  const seg = (T - 8) / n;
  const idx = Math.min(n - 1, Math.floor(Math.max(0, frame - 4) / seg));
  const it = items[idx];
  const f = frame - 4 - idx * seg; // local frame
  const col = it.color || P.accent;

  // card geometry
  const S = u * (portrait ? 1.18 : 1.05);
  const CH = 150 * S;
  const CW = portrait ? w * 0.92 : Math.min(w * 0.46, 860 * S);
  const margin = Math.max(48 * u, w * 0.035);
  const pos = P.position;
  const x = pos.endsWith('center') ? (w - CW) / 2 : pos === 'bottom-left' ? margin : w - CW - margin;
  const y = pos.startsWith('top') ? margin + (portrait ? 60 * u : 0) : h - CH - margin - (portrait ? 140 * u : 0);

  // local timing
  const enter = 14;
  const unroll = 18;
  const hold = seg - enter - unroll - 24;
  const popP = backOut(sseg(f, 0, enter), 2.2);
  const openP = easeIO(sseg(f, enter - 2, enter - 2 + unroll));
  const closeP = easeIO(sseg(f, seg - 24, seg - 8));
  const open = Math.min(openP, 1 - closeP);
  const badgeOut = 1 - easeIO(sseg(f, seg - 10, seg - 2));
  const rim = easeOut3(sseg(f, 2, enter + 8));
  const shine = sseg(f, enter + unroll, enter + unroll + 34);
  const flash = 1 - sseg(f, 3, 18);
  void hold;

  const BS = CH * 0.98;
  const collapsed = BS;
  const curW = collapsed + (CW - collapsed) * open;
  const left = x + (pos.endsWith('center') ? (CW - curW) / 2 : 0);
  const textLeft = BS + 22 * S;
  const textW = CW - textLeft - (it.points ? 130 * S : 40 * S);
  const tFs = 40 * S;
  const dFs = 25 * S;
  const dLines = it.description ? wrapText(it.description, dFs, textW, 'sans', 2) : [];
  const textA = easeOut3(sseg(f, enter + 4, enter + unroll + 4));

  return (
    <AbsoluteFill style={{background: bgCss(P.background)}}>
      {bgCss(P.background) && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 100%, ${withAlpha(col, 0.18)}, transparent 70%)`}} />
          <Svg>
            {Array.from({length: Math.ceil(w / (60 * u))}).map((_, i) =>
              Array.from({length: Math.ceil(h / (60 * u))}).map((_, j) => <circle key={`${i}-${j}`} cx={i * 60 * u + 30 * u} cy={j * 60 * u + 30 * u} r={1.6 * u} fill={withAlpha(P.ink, 0.07)} />),
            )}
          </Svg>
          <Vignette strength={0.55} />
        </>
      )}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `translateY(${(1 - Math.min(1, easeOut3(sseg(f, 0, 10)))) * (pos.startsWith('top') ? -30 : 30) * u}px)`, opacity: Math.min(1, f / 4)}}>
        {/* card body */}
        <div
          style={{
            position: 'absolute',
            left,
            top: y + (CH - BS * 0.86) / 2,
            width: curW,
            height: BS * 0.86,
            borderRadius: BS,
            background: `linear-gradient(100deg, ${mixHex(P.surface, col, 0.08)}, ${P.surface})`,
            border: `${2.5 * u}px solid ${withAlpha(col, 0.55)}`,
            boxShadow: `0 ${16 * S}px ${40 * S}px rgba(0,0,0,0.5), 0 0 ${30 * S}px ${withAlpha(col, 0.25 * open)}`,
            overflow: 'hidden',
            opacity: Math.min(1, open * 5),
          }}
        >
          <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-30 + shine * 170}%`, width: '24%', background: `linear-gradient(100deg, transparent, ${withAlpha('#ffffff', 0.2)}, transparent)`, transform: 'skewX(-20deg)'}} />
          <div style={{position: 'absolute', left: textLeft, top: 0, bottom: 0, width: textW + 130 * S, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: textA, transform: `translateX(${(1 - textA) * -30 * S}px)`, whiteSpace: 'nowrap'}}>
            <div style={{fontFamily: body, fontWeight: 700, fontSize: 19 * S, letterSpacing: 5 * S, color: col, textTransform: 'uppercase'}}>{P.header}</div>
            <div style={{fontFamily: head, fontSize: tFs, color: P.ink, lineHeight: 1.1, marginTop: 4 * S, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: textW}}>{it.title}</div>
            {dLines.map((l, i) => (
              <div key={i} style={{fontFamily: body, fontWeight: 600, fontSize: dFs, color: withAlpha(P.ink, 0.7), lineHeight: 1.25, marginTop: i === 0 ? 4 * S : 0}}>{l}</div>
            ))}
          </div>
          {it.points ? (
            <div style={{position: 'absolute', right: 28 * S, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: textA, fontFamily: head, color: col, whiteSpace: 'nowrap'}}>
              <div style={{fontSize: 46 * S, lineHeight: 1}}>+{it.points}</div>
              <div style={{fontFamily: body, fontWeight: 700, fontSize: 17 * S, letterSpacing: 4 * S, color: withAlpha(P.ink, 0.6), marginTop: 4 * S}}>{P.pointsLabel}</div>
            </div>
          ) : null}
        </div>

        {/* badge */}
        <div style={{position: 'absolute', left, top: y + (CH - BS) / 2, width: BS, height: BS, transform: `scale(${(0.2 + 0.8 * popP) * (0.9 + 0.1 * badgeOut)})`, opacity: Math.min(1, popP * 2) * badgeOut}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${mixHex(col, '#ffffff', 0.35)}, ${col} 45%, ${mixHex(col, '#000000', 0.45)})`, boxShadow: `0 ${8 * S}px ${24 * S}px rgba(0,0,0,0.5), 0 0 ${(30 + 40 * flash) * S}px ${withAlpha(col, 0.5 + 0.4 * flash)}`}} />
          <svg width={BS} height={BS} viewBox="-1 -1 2 2" style={{position: 'absolute', inset: 0}}>
            <circle r={0.9} fill="none" stroke={withAlpha('#ffffff', 0.85)} strokeWidth={0.045} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - rim} transform="rotate(-90)" />
            <circle r={0.74} fill={mixHex(P.surface, '#000000', 0.2)} opacity={0.92} />
          </svg>
          <div style={{position: 'absolute', inset: BS * 0.26, transform: `scale(${backOut(sseg(f, 6, enter + 6), 2.4)})`}}>
            {it.iconSrc ? <Img src={resolveSrc(it.iconSrc)} style={{width: '100%', height: '100%', objectFit: 'contain'}} /> : <Glyph icon={it.icon || 'trophy'} size={BS * 0.48} color={col} />}
          </div>
        </div>

        {/* spark burst when the badge lands */}
        <Svg>
          {Array.from({length: 12}).map((_, i) => {
            const t = sseg(f, 4, 26);
            if (t <= 0 || t >= 1) return null;
            const a = (i / 12) * Math.PI * 2 + 0.3;
            const bx = left + BS / 2;
            const by = y + CH / 2;
            const r0 = BS * 0.5 + easeOut3(t) * BS * 0.55;
            const r1 = r0 + BS * 0.2 * (1 - t);
            return <line key={i} x1={bx + Math.cos(a) * r0} y1={by + Math.sin(a) * r0} x2={bx + Math.cos(a) * r1} y2={by + Math.sin(a) * r1} stroke={i % 2 ? '#ffffff' : col} strokeWidth={4 * u} strokeLinecap="round" opacity={1 - t} />;
          })}
        </Svg>
      </div>
    </AbsoluteFill>
  );
};

export const achievementUnlock = defineMotion<Props>({
  id: 'achievement-unlock',
  title: 'Achievement unlock toast',
  category: 'game',
  description: 'A round badge pops with a drawn rim and spark burst, the toast unrolls from it with ACHIEVEMENT UNLOCKED, the title, a description and a points chip, a shine sweeps across, then it rolls back up; several achievements play in turn.',
  source: ['original'],
  useFor: 'Game and gamified-app reward pop-ups, trophy / badge unlocks in tutorials and courses, milestone "you earned" toasts, stream alerts. Replace the items (title, description, points, icon or your own iconSrc) and colours; use background "transparent" over gameplay.',
  durationInFrames: 240,
  defaultProps: {
    items: DEFAULT_ITEMS,
    header: 'Achievement unlocked',
    pointsLabel: 'PTS',
    position: 'bottom-center',
    background: '#0A0D1A',
    surface: '#161C34',
    ink: '#F4F6FF',
    accent: '#FFC933',
    fontFamily: 'auto',
  },
  propDocs: {
    items: 'up to 5 of {title, description?, points?, icon? (trophy|star|crown|bolt|shield|flame|heart), iconSrc? (own image), color?}',
    header: 'small label above the title',
    pointsLabel: 'unit under the points number',
    position: 'bottom-center | bottom-left | top-center | top-right',
    background: 'frame colour, or "transparent" to overlay gameplay',
    surface: 'toast card colour',
    ink: 'text colour',
    accent: 'default badge / highlight colour (an item can override with color)',
    fontFamily: 'CSS font family, or "auto"',
  },
  component: AchievementUnlock,
  tags: ['achievement', 'unlock', 'trophy', 'badge', 'toast', 'reward', 'game', 'gaming', 'notification', 'gamification', 'overlay', 'esports', 'stream', 'alert', 'milestone'],
});
