import React from 'react';
import {clamp, ease, prog} from '../../core/ease';
import {BotFace, BoxBot, FxRoot, boil, isClear, useFx, portraitFit} from '../../core/fx-kit';
import {n2} from '../../core/random';
import {Svg, useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * video20 emote-icon-pop: doodle icons ~0.4 body heights above a character — red "!" with radial
 * ticks, ink "?", yellow lightbulb with glow, rising pink hearts, blue sweat drop. Pop-in is 1-2 f
 * (scale 0.85->1, no overshoot), hold 0.6-1.2 s, linear fade over 5 f (bulb ~0.3 s). Chained emotes
 * start the frame after the previous one ends. Hearts drift up 3-5 % H over 1 s, staggered
 * 0.15-0.25 s with +-10 deg tilt. video22: music-note doodles float up ~30 px while fading over 1 s.
 */
type Icon = '!' | '?' | 'bulb' | 'heart' | 'sweat' | 'note' | '!?';
type Props = {
  background: string;
  x: number;
  y: number;
  delay: number;
  icons: string[];
  hold: number;
  size: number;
  ink: string;
  red: string;
  bulb: string;
  heart: string;
  sweat: string;
  showSubject: boolean;
  seed: number;
};

const durOf = (ic: Icon, hold: number) => (ic === 'heart' || ic === 'note' ? hold + 22 : ic === 'bulb' ? 2 + hold + 9 : 2 + hold + 5);

const IconDraw: React.FC<{ic: Icon; S: number; lf: number; dur: number; hold: number; u: number; ink: string; red: string; bulb: string; heart: string; sweat: string; frame: number; id: string; H: number}> = ({ic, S, lf, dur, hold, u, ink, red, bulb, heart, sweat, frame, id, H}) => {
  const sw = 3.2 * u * (S / (190 * u));
  const fadeF = ic === 'bulb' ? 9 : 5;
  const pop = lf < 2 ? 0.85 + 0.15 * (lf / 2) : 1;
  const op = lf < 1 ? 0.5 : 1 - clamp((lf - (dur - fadeF)) / fadeF);
  // line boil: tiny re-draw jitter every 3 frames
  const b = boil(frame, 3);
  const jr = n2(id + 'r', b, 0.3) * 1.8;
  const jx = n2(id + 'x', b, 0.7) * 1.2 * u;
  const wrap = (node: React.ReactNode) => (
    <g opacity={op} transform={`translate(${jx} 0) rotate(${jr}) scale(${pop})`}>
      {node}
    </g>
  );
  switch (ic) {
    case '!':
    case '!?': {
      const top = -0.55 * S;
      const bot = 0.12 * S;
      const tick = (a: number, r0: number, r1: number, k: number) => (
        <line key={k} x1={Math.cos(a) * r0} y1={top + 0.1 * S + Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={top + 0.1 * S + Math.sin(a) * r1} stroke={ink} strokeWidth={sw * 0.8} strokeLinecap="round" />
      );
      return wrap(
        <g>
          <path d={`M${-0.15 * S} ${top} Q0 ${top - 0.05 * S} ${0.15 * S} ${top} L${0.05 * S} ${bot} Q0 ${bot + 0.03 * S} ${-0.05 * S} ${bot} Z`} fill={red} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M${-0.08 * S} ${top + 0.05 * S} L${-0.03 * S} ${bot - 0.1 * S}`} stroke="#fff" strokeWidth={sw * 0.9} strokeLinecap="round" opacity={0.45} />
          <ellipse cx={0} cy={0.29 * S} rx={0.07 * S} ry={0.065 * S} fill="none" stroke={ink} strokeWidth={sw} />
          {lf < hold * 0.6 && [tick(-Math.PI * 0.82, 0.3 * S, 0.46 * S, 1), tick(-Math.PI * 0.18, 0.3 * S, 0.46 * S, 2), tick(-Math.PI * 0.5, 0.36 * S, 0.5 * S, 3)]}
          {ic === '!?' && (
            <g transform={`translate(${0.42 * S} 0)`}>
              <path d={`M${-0.17 * S} ${-0.33 * S} C${-0.17 * S} ${-0.62 * S} ${0.22 * S} ${-0.62 * S} ${0.2 * S} ${-0.36 * S} C${0.19 * S} ${-0.16 * S} 0 ${-0.14 * S} 0 ${0.08 * S}`} fill="none" stroke={ink} strokeWidth={sw * 1.1} strokeLinecap="round" />
              <circle cx={0} cy={0.27 * S} r={0.055 * S} fill="none" stroke={ink} strokeWidth={sw} />
            </g>
          )}
        </g>,
      );
    }
    case '?':
      return wrap(
        <g>
          <path d={`M${-0.2 * S} ${-0.33 * S} C${-0.2 * S} ${-0.66 * S} ${0.26 * S} ${-0.66 * S} ${0.24 * S} ${-0.36 * S} C${0.23 * S} ${-0.14 * S} 0 ${-0.14 * S} 0 ${0.1 * S}`} fill="none" stroke={ink} strokeWidth={sw * 1.15} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={0} cy={0.29 * S} r={0.06 * S} fill="none" stroke={ink} strokeWidth={sw} />
        </g>,
      );
    case 'bulb': {
      const flick = 0.85 + 0.15 * Math.sin(frame * 1.1);
      return wrap(
        <g>
          <defs>
            <radialGradient id={`${id}-g`}>
              <stop offset="0%" stopColor="#fff3b0" stopOpacity={0.95} />
              <stop offset="55%" stopColor="#fff3b0" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#fff3b0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={0} cy={-0.22 * S} r={0.3 * S * 1.6 * flick} fill={`url(#${id}-g)`} />
          <path d={`M${-0.12 * S} ${0.05 * S} C${-0.14 * S} ${-0.05 * S} ${-0.3 * S} ${-0.1 * S} ${-0.3 * S} ${-0.28 * S} C${-0.3 * S} ${-0.5 * S} ${-0.15 * S} ${-0.6 * S} 0 ${-0.6 * S} C${0.15 * S} ${-0.6 * S} ${0.3 * S} ${-0.5 * S} ${0.3 * S} ${-0.28 * S} C${0.3 * S} ${-0.1 * S} ${0.14 * S} ${-0.05 * S} ${0.12 * S} ${0.05 * S} Z`} fill={bulb} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M${-0.06 * S} ${0.03 * S} L${-0.06 * S} ${-0.2 * S} Q0 ${-0.3 * S} ${0.06 * S} ${-0.2 * S} L${0.06 * S} ${0.03 * S}`} fill="none" stroke={ink} strokeWidth={sw * 0.6} opacity={0.7} />
          <path d={`M${-0.18 * S} ${-0.42 * S} Q${-0.2 * S} ${-0.3 * S} ${-0.12 * S} ${-0.22 * S}`} fill="none" stroke="#fff" strokeWidth={sw} strokeLinecap="round" opacity={0.7} />
          {[0.1, 0.17, 0.24].map((yy, k) => (
            <line key={k} x1={-0.11 * S + k * 0.015 * S} x2={0.11 * S - k * 0.015 * S} y1={yy * S} y2={yy * S} stroke={ink} strokeWidth={sw * 0.9} strokeLinecap="round" />
          ))}
          {[-0.8, -0.5, -0.2].map((a, k) => {
            const A = a * Math.PI;
            const r0 = 0.42 * S;
            const r1 = (0.52 + 0.04 * Math.sin(frame * 0.9 + k)) * S;
            return <line key={`r${k}`} x1={Math.cos(A) * r0} y1={-0.28 * S + Math.sin(A) * r0} x2={Math.cos(A) * r1} y2={-0.28 * S + Math.sin(A) * r1} stroke="#d9a520" strokeWidth={sw} strokeLinecap="round" />;
          })}
        </g>,
      );
    }
    case 'heart': {
      const hp = (s: number) => `M0 ${0.32 * s} C${-0.5 * s} ${-0.02 * s} ${-0.42 * s} ${-0.48 * s} ${-0.2 * s} ${-0.46 * s} C${-0.08 * s} ${-0.45 * s} 0 ${-0.36 * s} 0 ${-0.26 * s} C0 ${-0.36 * s} ${0.08 * s} ${-0.45 * s} ${0.2 * s} ${-0.46 * s} C${0.42 * s} ${-0.48 * s} ${0.5 * s} ${-0.02 * s} 0 ${0.32 * s} Z`;
      return (
        <g>
          {[0, 1, 2].map((k) => {
            const l = lf - k * 6;
            if (l < 0) return null;
            const life = dur - 12;
            const rise = prog(l, 0, life, ease.out) * 0.05 * H;
            const o = l < 1 ? 0.5 : 1 - prog(l, life * 0.55, life, ease.linear);
            const sc = (l < 2 ? 0.85 + 0.075 * l : 1) * (k === 0 ? 1 : 0.7);
            const xo = [0, -0.4, 0.42][k] * S;
            const tilt = [0, -10, 10][k];
            return (
              <g key={k} transform={`translate(${xo} ${-rise}) rotate(${tilt + Math.sin((frame + k * 9) * 0.15) * 4}) scale(${sc})`} opacity={o}>
                <path d={hp(S)} fill={heart} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
                <path d={`M${-0.24 * S} ${-0.3 * S} Q${-0.3 * S} ${-0.16 * S} ${-0.2 * S} ${-0.06 * S}`} fill="none" stroke="#fff" strokeWidth={sw} strokeLinecap="round" opacity={0.6} />
              </g>
            );
          })}
        </g>
      );
    }
    case 'note': {
      return (
        <g>
          {[0, 1, 2].map((k) => {
            const l = lf - k * 7;
            if (l < 0) return null;
            const life = dur - 14;
            const rise = prog(l, 0, life, ease.linear) * 0.06 * H;
            const o = l < 1 ? 0.5 : 1 - prog(l, life * 0.5, life, ease.linear);
            const xo = [0, 0.45, -0.42][k] * S + Math.sin((l + k * 10) * 0.2) * 0.08 * S;
            const s = k === 0 ? 1 : 0.75;
            return (
              <g key={k} transform={`translate(${xo} ${-rise}) rotate(${[-8, 10, -14][k]}) scale(${s})`} opacity={o}>
                {k === 1 ? (
                  <g>
                    <ellipse cx={-0.18 * S} cy={0.2 * S} rx={0.12 * S} ry={0.09 * S} transform={`rotate(-20 ${-0.18 * S} ${0.2 * S})`} fill={ink} />
                    <ellipse cx={0.2 * S} cy={0.12 * S} rx={0.12 * S} ry={0.09 * S} transform={`rotate(-20 ${0.2 * S} ${0.12 * S})`} fill={ink} />
                    <path d={`M${-0.08 * S} ${0.18 * S} L${-0.08 * S} ${-0.42 * S} L${0.3 * S} ${-0.5 * S} L${0.3 * S} ${0.1 * S}`} fill="none" stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
                    <path d={`M${-0.08 * S} ${-0.42 * S} L${0.3 * S} ${-0.5 * S}`} stroke={ink} strokeWidth={sw * 2.4} />
                  </g>
                ) : (
                  <g>
                    <ellipse cx={-0.06 * S} cy={0.2 * S} rx={0.13 * S} ry={0.1 * S} transform={`rotate(-20 ${-0.06 * S} ${0.2 * S})`} fill={ink} />
                    <path d={`M${0.06 * S} ${0.17 * S} L${0.06 * S} ${-0.45 * S} Q${0.14 * S} ${-0.3 * S} ${0.28 * S} ${-0.24 * S} Q${0.34 * S} ${-0.2 * S} ${0.26 * S} ${-0.08 * S}`} fill="none" stroke={ink} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      );
    }
    case 'sweat': {
      const slide = prog(lf, 0, dur, ease.in) * 0.18 * S;
      return wrap(
        <g transform={`translate(${0.55 * S} ${0.1 * S + slide})`}>
          <path d={`M0 ${-0.3 * S} C${0.06 * S} ${-0.16 * S} ${0.16 * S} ${-0.02 * S} ${0.16 * S} ${0.08 * S} C${0.16 * S} ${0.2 * S} ${0.08 * S} ${0.26 * S} 0 ${0.26 * S} C${-0.08 * S} ${0.26 * S} ${-0.16 * S} ${0.2 * S} ${-0.16 * S} ${0.08 * S} C${-0.16 * S} ${-0.02 * S} ${-0.06 * S} ${-0.16 * S} 0 ${-0.3 * S} Z`} fill={sweat} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M${-0.07 * S} ${0.02 * S} Q${-0.08 * S} ${0.12 * S} ${-0.02 * S} ${0.17 * S}`} fill="none" stroke="#fff" strokeWidth={sw} strokeLinecap="round" opacity={0.7} />
        </g>,
      );
    }
    default:
      return null;
  }
};

const faceFor = (ic: Icon | undefined): BotFace => (ic === '!' || ic === '!?' ? 'wide' : ic === '?' ? 'squint' : ic === 'sweat' ? 'worried' : ic ? 'happy' : 'neutral');

const EmotePop: React.FC<Props> = (p) => {
  const {background, x, y, delay, icons, hold, size: size0, ink, red, bulb, heart, sweat, showSubject, seed} = p;
  const {f, frame, u, h, px, py: py0} = useFx(x, y, delay);
  const clear = isClear(background);
  const {portrait: fitPortrait, h: fitH} = useStage();
  const fit = portraitFit(fitPortrait, showSubject && !clear, fitH);
  const size = size0 * fit.k;
  const py = py0 + fit.dy;
  const S = 190 * u * size;
  const list = (icons.length ? icons : ['!']) as Icon[];
  // chain schedule
  const starts: number[] = [];
  let acc = 0;
  list.forEach((ic) => {
    starts.push(acc);
    acc += durOf(ic, hold) + 1;
  });
  const activeIdx = list.findIndex((ic, i) => f >= starts[i] && f < starts[i] + durOf(ic, hold));
  const lastStarted = list.reduce((a, _, i) => (f >= starts[i] ? i : a), -1);
  const face = faceFor(activeIdx >= 0 ? list[activeIdx] : lastStarted >= 0 && f < acc ? list[lastStarted] : undefined);

  // subject: box-bot below the emote anchor
  const botS = 370 * u * size;
  const startle = list.map((ic, i) => (ic === '!' || ic === '!?' ? Math.sin(clamp((f - starts[i]) / 7) * Math.PI) : 0)).reduce((a, b) => Math.max(a, b), 0);
  const blinkF = (frame + 11) % 70;
  const blink = blinkF < 2 ? blinkF / 2 : blinkF < 3 ? 1 : blinkF < 6 ? 1 - (blinkF - 3) / 3 : 0;
  const lookSide = activeIdx >= 0 && list[activeIdx] === '?' ? 0 : Math.sin(frame * 0.03) * 0.6;

  return (
    <FxRoot background={background} paper={!clear} paperTint="#8a7350">
      <Svg>
        {showSubject && !clear && (
          <BoxBot x={px - botS * 0.16} y={py + 0.35 * S + 0.12 * botS + botS * 0.2 + botS * 0.39 + 40 * u * size - startle * 30 * u} s={botS} face={face} blink={face === 'wide' ? 0 : blink} look={lookSide} squashY={1 + startle * 0.05} frame={frame} id={`emb${seed}`} />
        )}
        {list.map((ic, i) => {
          const lf = f - starts[i];
          const dur = durOf(ic, hold);
          if (lf < 0 || lf >= dur) return null;
          return (
            <g key={i} transform={`translate(${px} ${py})`}>
              <IconDraw ic={ic} S={S} lf={lf} dur={dur} hold={hold} u={u} ink={ink} red={red} bulb={bulb} heart={heart} sweat={sweat} frame={frame} id={`em${seed}-${i}`} H={h} />
            </g>
          );
        })}
      </Svg>
    </FxRoot>
  );
};

export const emotePop = defineMotion<Props>({
  id: 'emote-pop',
  title: 'Emote pop',
  category: 'fx',
  description:
    'Doodle reaction icons (! ? lightbulb hearts sweat-drop music notes) pop in over a point in 1-2 frames, boil, bob and fade, chained one after another above a box-bot. Overlay-ready: background "transparent".',
  source: ['video20 emote-icon-pop', 'video22 cheer-bounce-emotes floating notes'],
  useFor: 'Quick reactions over any character, face or UI element: surprise, confusion, idea, love, stress, joy.',
  durationInFrames: 150,
  defaultProps: {
    background: '#E1D7C5',
    x: 0.5,
    y: 0.3,
    delay: 8,
    icons: ['!', '?', 'bulb', 'heart'],
    hold: 22,
    size: 1,
    ink: '#2e2a26',
    red: '#D2454F',
    bulb: '#F6DC72',
    heart: '#E9727C',
    sweat: '#7DB3E0',
    showSubject: true,
    seed: 2,
  },
  propDocs: {
    background: "scene paper colour; 'transparent' = overlay (no bot, no paper)",
    x: 'emote anchor x (0..1) — the point the icons pop over',
    y: 'emote anchor y (0..1)',
    delay: 'frame the first emote pops',
    icons: "sequence of icons: '!', '?', '!?', 'bulb', 'heart', 'sweat', 'note' (each starts the frame after the previous ends)",
    hold: 'frames each icon holds (0.6-1.2 s)',
    size: 'icon size multiplier',
    ink: 'ink line colour',
    red: '"!" fill colour',
    bulb: 'lightbulb fill colour',
    heart: 'heart fill colour',
    sweat: 'sweat-drop colour',
    showSubject: 'draw the reacting box-bot under the icons (scene mode only)',
    seed: 'random seed (line boil)',
  },
  component: EmotePop,
  tags: ['emote', 'reaction', 'icon', 'character', 'doodle', 'overlay', 'fx'],
});
