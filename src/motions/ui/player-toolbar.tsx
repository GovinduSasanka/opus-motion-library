import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {DeskBook, GlassPanel, INK3, x14Fonts} from '../../core/r2-x14-kit';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * x3 lesson-player toolbar: a frosted pill centred at the bottom like a media / lesson player — menu, back,
 * play/pause, a serif caption narrating the current step (wraps to two lines), a pager of dots with the
 * current one as a dash, next, a divider, mute, contrast and course icons. It slides up, play toggles to
 * pause, then each step the next button blips, the dash slides to the next dot and the caption swaps with a
 * quick fade + drift. Backdrop "none" makes it a transparent caption-bar overlay.
 */

type Props = {
  steps: string[];
  numbered: boolean;
  startAt: number;
  stepFrames: number;
  width: number;
  backdrop: string;
  ink: string;
  numberColor: string;
  glassTop: string;
  glassBottom: string;
  background: string;
};

const ICONS: Record<string, React.ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  prev: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  next: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  mute: (
    <>
      <path d="M3.5 9.5h3.5l4.5-3.8v12.6L7 14.5H3.5z" />
      <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
    </>
  ),
  contrast: (
    <>
      <circle cx={12} cy={12} r={8} />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </>
  ),
  cap: (
    <>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5v4.2c3 2.4 8 2.4 11 0v-4.2M21.5 9.5v5" />
    </>
  ),
};

const Icon: React.FC<{name: string; size: number; color: string; press?: number; stroke: number}> = ({name, size, color, press = 0, stroke}) => (
  <div style={{position: 'relative', width: size * 1.6, height: size * 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: `rgba(255,255,255,${0.55 * press})`}} />
    <svg width={size} height={size} viewBox="0 0 24 24" style={{color, transform: `scale(${1 - 0.12 * press})`, overflow: 'visible'}} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  </div>
);

const PlayerToolbar: React.FC<Props> = ({steps, numbered, startAt, stepFrames, width, backdrop, ink, numberColor, glassTop, glassBottom, background}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait, durationInFrames} = useStage();
  const showBook = backdrop !== 'none';
  const zoom = 1 + 0.02 * clamp(frame / Math.max(1, durationInFrames));
  const back = showBook ? <DeskBook uid="ptb" zoom={zoom} /> : null;
  const n = Math.max(1, steps.length);
  const compact = w / u < 1400;
  const pw = Math.min(width * u, w - (portrait ? 48 : 80) * u);
  const ph = (compact ? 112 : 84) * u;
  const x = (w - pw) / 2;
  const enter = prog(frame, 0, 16, ease.out);
  const y = h - ph - (portrait ? 0.05 * h : 0.014 * h + 4 * u) + (1 - enter) * 30 * u;
  const iconS = 26 * u;
  const stroke = 1.6;

  // step index + local timing
  const raw = Math.floor((frame - startAt) / stepFrames);
  const idx = clamp(raw, 0, n - 1);
  const stepStart = startAt + idx * stepFrames;
  const local = frame - stepStart;
  const capIn = idx === 0 ? prog(frame, startAt - 2, startAt + 6, ease.out) : prog(local, 2, 9, ease.out);
  const prevOut = idx > 0 ? 1 - prog(local, 0, 3, ease.in) : 0;
  const nextPress = idx < n - 1 ? Math.max(0, 1 - Math.abs(frame - (stepStart + stepFrames - 1)) / 3) : 0;
  const playPress = Math.max(0, 1 - Math.abs(frame - 10) / 3);
  const playing = frame >= 10;
  const dots = Math.min(7, n);
  const dotPos = idx === 0 ? 0 : clamp(idx - 1 + prog(local, 0, 8, ease.inOut), 0, dots - 1);
  const dotGap = 13 * u;
  const dotD = 7 * u;
  const dashW = 24 * u;

  const caption = (i: number) => (
    <span>
      {numbered ? <span style={{color: numberColor, fontWeight: 600, marginRight: 12 * u}}>{i + 1}</span> : null}
      {steps[i]}
    </span>
  );
  const capStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    fontFamily: x14Fonts.bookSerif,
    fontSize: (compact ? 26 : 28) * u,
    lineHeight: 1.25,
    color: ink,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  return (
    <AbsoluteFill style={{background: showBook ? INK3.mat : background}}>
      {back}
      <GlassPanel
        x={x}
        y={y}
        width={pw}
        height={ph}
        radius={ph / 2}
        frost={back ?? undefined}
        blur={16}
        opacity={enter}
        top={glassTop}
        bottom={glassBottom}
      >
        <div style={{height: ph, display: 'flex', alignItems: 'center', padding: `0 ${18 * u}px`, gap: (compact ? 2 : 8) * u}}>
          <Icon name="menu" size={iconS} color={ink} stroke={stroke} />
          <Icon name="prev" size={iconS} color={ink} stroke={stroke} />
          <div style={{position: 'relative', width: iconS * 1.6, height: iconS * 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: `rgba(255,255,255,${0.55 * playPress})`}} />
            <svg width={iconS * 0.85} height={iconS * 0.85} viewBox="0 0 24 24" style={{transform: `scale(${1 - 0.15 * playPress})`}}>
              {playing ? (
                <>
                  <rect x={6} y={5} width={4} height={14} rx={1} fill={ink} />
                  <rect x={14} y={5} width={4} height={14} rx={1} fill={ink} />
                </>
              ) : (
                <path d="M7 4.5 19 12 7 19.5z" fill={ink} />
              )}
            </svg>
          </div>
          <div style={{position: 'relative', flex: 1, minWidth: 0, alignSelf: 'stretch', marginLeft: 8 * u}}>
            {idx > 0 && prevOut > 0 ? <div style={{...capStyle, opacity: prevOut, transform: `translateY(-50%) translateY(${-(1 - prevOut) * 6 * u}px)`}}>{caption(idx - 1)}</div> : null}
            <div style={{...capStyle, opacity: capIn, transform: `translateY(-50%) translateY(${(1 - capIn) * 8 * u}px)`}}>{caption(idx)}</div>
          </div>
          {dots > 1 ? (
            <div style={{position: 'relative', flex: 'none', width: (dots - 1) * dotGap + dashW, height: dotD, marginRight: 4 * u}}>
              {Array.from({length: dots}, (_, i) => (
                <div key={i} style={{position: 'absolute', left: i * dotGap + (dashW - dotD) / 2, top: 0, width: dotD, height: dotD, borderRadius: '50%', background: ink, opacity: 0.3}} />
              ))}
              <div style={{position: 'absolute', left: dotPos * dotGap, top: 0, width: dashW, height: dotD, borderRadius: dotD, background: ink, opacity: 0.85}} />
            </div>
          ) : null}
          <Icon name="next" size={iconS} color={ink} press={nextPress} stroke={stroke} />
          <div style={{width: 1.2 * u, height: ph * 0.42, background: ink, opacity: 0.25, margin: `0 ${6 * u}px`, flex: 'none'}} />
          <Icon name="mute" size={iconS} color={ink} stroke={stroke} />
          {!compact ? <Icon name="contrast" size={iconS} color={ink} stroke={stroke} /> : null}
          {!compact ? <Icon name="cap" size={iconS} color={ink} stroke={stroke} /> : null}
        </div>
      </GlassPanel>
    </AbsoluteFill>
  );
};

export const playerToolbar = defineMotion<Props>({
  id: 'player-toolbar',
  title: 'Lesson player toolbar',
  category: 'ui',
  description:
    'Frosted glass pill toolbar centred at the bottom like a lesson / media player — menu, back, play→pause, a serif step caption that swaps with a quick fade, a dot pager whose active dash slides along, next, mute, contrast and course icons — over an open textbook on a felt desk. Backdrop "none" = transparent caption-bar overlay.',
  source: ['video x3 0.0-28.3 (player-toolbar)'],
  useFor: 'Making a narrated explainer, tutorial or product walkthrough feel like a real interactive player; an on-screen caption bar with step progress.',
  durationInFrames: 240,
  defaultProps: {
    steps: [
      'Energy stores',
      'Every object here keeps its energy in a different store.',
      'Close up: a warm drink holds energy in its thermal store.',
      'Cut away: chemical energy waits inside the battery.',
      'Your turn: tap each object to light its jar.',
    ],
    numbered: true,
    startAt: 12,
    stepFrames: 45,
    width: 1110,
    backdrop: 'book',
    ink: INK3.toolbarInk,
    numberColor: INK3.pager,
    glassTop: 'rgba(226,231,225,0.84)',
    glassBottom: 'rgba(199,206,199,0.80)',
    background: 'transparent',
  },
  propDocs: {
    steps: 'caption per step (wraps to two lines); the pager shows one dot per step (max 7)',
    numbered: 'prefix each caption with its step number in the accent colour',
    startAt: 'frame the first caption appears',
    stepFrames: 'frames per step before the next caption',
    width: 'pill width in u (clamped to the frame; compact layout below 1400 u drops two icons)',
    backdrop: '"book" procedural textbook spread on a felt desk | "none" = transparent overlay (CSS backdrop blur over host content)',
    ink: 'icon and caption colour',
    numberColor: 'step number colour',
    glassTop: 'glass fill at the top (rgba)',
    glassBottom: 'glass fill at the bottom (rgba)',
    background: 'colour behind the toolbar when backdrop is "none" ("transparent" to overlay)',
  },
  component: PlayerToolbar,
  tags: ['toolbar', 'player', 'controls', 'caption', 'subtitle', 'pager', 'progress', 'glass', 'frosted', 'pill', 'lesson', 'education', 'tutorial', 'walkthrough', 'overlay', 'ui', 'media'],
});
