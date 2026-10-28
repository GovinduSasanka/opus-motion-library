import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {DemoScreen, DemoTone, DEMO, useExit, useNorm, wrapLines} from '../../core/r3-annot-kit';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tutorial overlay: a tooltip bubble (title, wrapped text, optional "2 / 3" counter) with a pointer that touches a target
 * point of the footage, and a pulsing beacon on the target. It pops out of the pointer tip. In `sequence` mode one tip
 * at a time replaces the previous; in `stack` mode they all stay. Transparent by default; points are 0-1 fractions.
 */
type Tip = {
  x: number;
  y: number;
  title?: string;
  text: string;
  /** where the bubble sits relative to the target (default auto) */
  side?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  at?: number;
};
type Props = {
  tips: Tip[];
  mode: 'sequence' | 'stack';
  theme: 'dark' | 'light' | 'accent';
  accent: string;
  beacon: boolean;
  showCounter: boolean;
  maxWidth: number;
  fontSize: number;
  fontFamily: string;
  hold: number;
  startAt: number;
  speed: number;
  exitAt: number;
  demoBackground: boolean;
  demoTone: DemoTone;
};

const THEMES = {
  dark: {bg: '#161A23', ink: '#FFFFFF', sub: 'rgba(255,255,255,0.72)'},
  light: {bg: '#FFFFFF', ink: '#14171F', sub: 'rgba(20,23,31,0.68)'},
  accent: {bg: '', ink: '#FFFFFF', sub: 'rgba(255,255,255,0.85)'},
};

const TooltipPointer: React.FC<Props> = ({tips, mode, theme, accent, beacon, showCounter, maxWidth, fontSize, fontFamily, hold, startAt, speed, exitAt, demoBackground, demoTone}) => {
  const frame = useCurrentFrame();
  const {w, h, u, px} = useNorm();
  const out = useExit(frame, exitAt);
  const sp = Math.max(0.2, speed);
  const th = THEMES[theme] ?? THEMES.dark;
  const bg = theme === 'accent' ? accent : th.bg;
  const fs = fontSize * u;
  const pad = fs * 0.85;
  const tipH = 18 * u;
  const tipW = 30 * u;
  const gap = 20 * u; // distance from the target to the pointer tip
  const hd = Math.max(8, Math.round(hold / sp));
  const atOf = (i: number) => tips[i].at ?? startAt + i * hd;

  return (
    <AbsoluteFill>
      <DemoScreen show={demoBackground} tone={demoTone} />
      <Svg>
        <defs>
          <filter id="tp-shadow" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy={8 * u} stdDeviation={10 * u} floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>
        {tips.map((t, i) => {
          const at = atOf(i);
          const f = (frame - at) * sp;
          if (f < -2) return null;
          // in sequence mode a tip leaves just before the next one arrives
          const endAt = mode === 'sequence' && i < tips.length - 1 ? atOf(i + 1) : Infinity;
          const leave = mode === 'sequence' && i < tips.length - 1 ? 1 - prog(frame, endAt - 7, endAt, ease.in) : 1;
          const tIn = prog(f, 0, 12, ease.back);
          const vis = clamp(f / 3) * leave;
          if (vis <= 0.001) return null;
          const target = px(t.x, t.y);
          // layout
          const tfs = fs * 1.08;
          const titleLines = t.title ? wrapLines(t.title, maxWidth * u - pad * 2, tfs, 0.6) : [];
          const lines = wrapLines(t.text, maxWidth * u - pad * 2, fs, 0.55);
          const cnt = showCounter && mode === 'sequence' && tips.length > 1 ? `${i + 1} / ${tips.length}` : '';
          const longest = Math.max(...titleLines.map((l) => l.length * tfs * 0.6), ...lines.map((l) => l.length * fs * 0.55), cnt.length * fs * 0.5 + 60 * u);
          const bw = Math.min(maxWidth * u, longest + pad * 2);
          const lh = fs * 1.38;
          const bh = pad * 2 + titleLines.length * tfs * 1.3 + lines.length * lh + (cnt ? fs * 1.3 : 0);
          // side
          let side = t.side && t.side !== 'auto' ? t.side : target[1] < h * 0.5 ? 'bottom' : 'top';
          if (!t.side || t.side === 'auto') {
            if (side === 'bottom' && target[1] + gap + tipH + bh > h - 10 * u) side = 'top';
            if (side === 'top' && target[1] - gap - tipH - bh < 10 * u) side = 'bottom';
          }
          let bx = 0;
          let by = 0;
          let tip: [number, number] = [target[0], target[1]];
          let pointerPath = '';
          const m = 14 * u;
          if (side === 'top' || side === 'bottom') {
            bx = clamp(target[0] - bw / 2, m, w - bw - m);
            by = side === 'bottom' ? target[1] + gap + tipH : target[1] - gap - tipH - bh;
            const px0 = clamp(target[0], bx + 26 * u, bx + bw - 26 * u);
            tip = [target[0], side === 'bottom' ? target[1] + gap : target[1] - gap];
            const baseY = side === 'bottom' ? by : by + bh;
            pointerPath = `M${px0 - tipW / 2} ${baseY + (side === 'bottom' ? 0.5 : -0.5)} L${tip[0]} ${tip[1]} L${px0 + tipW / 2} ${baseY + (side === 'bottom' ? 0.5 : -0.5)} Z`;
          } else {
            by = clamp(target[1] - bh / 2, m, h - bh - m);
            bx = side === 'right' ? target[0] + gap + tipH : target[0] - gap - tipH - bw;
            const py0 = clamp(target[1], by + 26 * u, by + bh - 26 * u);
            tip = [side === 'right' ? target[0] + gap : target[0] - gap, target[1]];
            const baseX = side === 'right' ? bx : bx + bw;
            pointerPath = `M${baseX + (side === 'right' ? 0.5 : -0.5)} ${py0 - tipW / 2} L${tip[0]} ${tip[1]} L${baseX + (side === 'right' ? 0.5 : -0.5)} ${py0 + tipW / 2} Z`;
          }
          const sc = 0.55 + 0.45 * tIn;
          // beacon
          const bph = ((frame + i * 11) % 40) / 40;
          return (
            <g key={i} opacity={out * vis}>
              {beacon && (
                <g>
                  <circle cx={target[0]} cy={target[1]} r={7 * u * clamp(tIn)} fill={accent} stroke="#fff" strokeWidth={2.5 * u} />
                  <circle cx={target[0]} cy={target[1]} r={(10 + bph * 24) * u} fill="none" stroke={accent} strokeWidth={3 * u * (1 - bph)} opacity={(1 - bph) * 0.9} />
                  <circle cx={target[0]} cy={target[1]} r={(10 + ((bph + 0.5) % 1) * 24) * u} fill="none" stroke={accent} strokeWidth={3 * u * (1 - ((bph + 0.5) % 1))} opacity={(1 - ((bph + 0.5) % 1)) * 0.7} />
                </g>
              )}
              <g transform={`translate(${tip[0]} ${tip[1]}) scale(${sc}) translate(${-tip[0]} ${-tip[1]})`} opacity={clamp(tIn)}>
                <g filter="url(#tp-shadow)">
                  <rect x={bx} y={by} width={bw} height={bh} rx={16 * u} fill={bg} />
                  <path d={pointerPath} fill={bg} />
                </g>
                {titleLines.map((l, k) => (
                  <text key={`t${k}`} x={bx + pad} y={by + pad + tfs * 0.95 + k * tfs * 1.3} fill={th.ink} fontFamily={fontFamily} fontWeight={800} fontSize={tfs}>
                    {l}
                  </text>
                ))}
                {lines.map((l, k) => (
                  <text key={k} x={bx + pad} y={by + pad + titleLines.length * tfs * 1.3 + fs * 0.95 + k * lh} fill={t.title ? th.sub : th.ink} fontFamily={fontFamily} fontWeight={t.title ? 500 : 600} fontSize={fs}>
                    {l}
                  </text>
                ))}
                {cnt && (
                  <text x={bx + bw - pad} y={by + bh - pad * 0.8} textAnchor="end" fill={th.sub} fontFamily={fonts.mono} fontWeight={700} fontSize={fs * 0.72}>
                    {cnt}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const tooltipPointer = defineMotion<Props>({
  id: 'tooltip-pointer',
  title: 'Tooltip pointer',
  category: 'hud',
  description:
    'Tutorial overlay on a transparent background: a tooltip bubble with a title and wrapped text and a pointer touching a target point pops out of the pointer tip, with a pulsing beacon on the target. Tips replace each other one by one (with a "1 / 3" counter) or all stay stacked.',
  source: ['screen-recording tutorial annotation'],
  useFor: 'Explain a control in a product tour, onboarding walkthrough or screen-recording tutorial: pass `tips` with the target x/y, a title and a sentence of text.',
  durationInFrames: 240,
  defaultProps: {
    tips: [
      {x: DEMO.search.x + 0.2, y: DEMO.search.y + DEMO.search.h, title: 'Search', text: 'Find any project, file or teammate by typing a few letters.'},
      {x: 0.52, y: 0.28, title: 'Live chart', text: 'Bars update as soon as new data comes in.', side: 'right'},
      {x: DEMO.save.x + DEMO.save.w / 2, y: DEMO.save.y, title: 'Save', text: 'Your changes are stored and shared with the team.'},
    ],
    mode: 'sequence',
    theme: 'dark',
    accent: '#3D7BFF',
    beacon: true,
    showCounter: true,
    maxWidth: 440,
    fontSize: 30,
    fontFamily: fonts.sans,
    hold: 76,
    startAt: 10,
    speed: 1,
    exitAt: 0,
    demoBackground: false,
    demoTone: 'light',
  },
  propDocs: {
    tips: 'array of {x, y (0-1 target), title?, text, side?: auto|top|bottom|left|right, at?}',
    mode: 'sequence = one tip at a time | stack = all tips stay',
    theme: 'dark | light | accent bubble',
    accent: 'beacon colour (and bubble colour for the accent theme)',
    beacon: 'pulsing dot on the target',
    showCounter: 'show "1 / 3" in sequence mode',
    maxWidth: 'maximum bubble width in u',
    fontSize: 'body text size in u',
    fontFamily: 'CSS font-family for the bubble',
    hold: 'frames per tip (sequence mode, and the default spacing of `at`)',
    startAt: 'frame of the first tip',
    speed: 'animation speed multiplier',
    exitAt: 'frame everything fades at (0 = just before the end)',
    demoBackground: 'true paints a neutral mock screen behind (previews); false = transparent overlay',
    demoTone: 'light | dark mock screen',
  },
  component: TooltipPointer,
  tags: ['tooltip', 'pointer', 'bubble', 'onboarding', 'product tour', 'beacon', 'annotation', 'tutorial', 'screen recording', 'overlay', 'hint', 'walkthrough'],
});
