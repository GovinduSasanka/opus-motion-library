import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useStage} from '../../core/stage';
import {defineMotion} from '../../core/types';
import {ISO, IsoPart, PART_DEFS, cl, easeInOutCubic, easeOutCubic, lin, pop, wrap, x58Fonts, type PartKind} from '../../core/r2-x58-kit';

/**
 * x8 lesson carousel: a bottom strip of cards, each with an isometric thumbnail of the part and a label like
 * "7. READ A SENSOR ›". Completed lessons get a teal circular check badge (pops 0 → 1.15 → 1 in 6 frames); the active
 * card has a teal outline and bold label (outline fades in 0.1 s); arrow buttons scroll the strip by three cards with
 * a 0.3 s easeInOutCubic slide; a cursor clicks the next card (3-frame press). A big preview of the active lesson sits above.
 */
type Item = {label: string; thumb?: string};
type Props = {
  items: Item[];
  start: number;
  activeAt: number[];
  scrollAt: number[];
  scrollBy: number;
  completed: number[];
  accent: string;
  cursor: boolean;
  background: string;
  heading: string;
  preview: boolean;
  visible: number;
};

const DEFAULT_ITEMS: Item[] = [
  {label: 'Blink an LED', thumb: 'led'},
  {label: 'Press a button', thumb: 'button'},
  {label: 'Read a sensor', thumb: 'sensor'},
  {label: 'Spin a motor', thumb: 'motor'},
  {label: 'Sweep a servo', thumb: 'servo'},
  {label: 'Switch a light', thumb: 'light'},
  {label: 'Drive a car', thumb: 'car'},
  {label: 'Build a project', thumb: 'board'},
];

/** one iso part centred in a box (cx, cy) of size bw x bh */
const Thumb: React.FC<{kind: string; cx: number; cy: number; bw: number; bh: number; frame: number; fit?: number}> = ({kind, cx, cy, bw, bh, frame, fit = 0.78}) => {
  const def = PART_DEFS[(kind as PartKind) in PART_DEFS ? (kind as PartKind) : 'board'];
  const [, , w, d, hh0] = def.fp;
  const hh = kind === 'light' ? 2.6 : hh0;
  const extentX = w + d;
  const extentY = (w + d) / 2 + hh;
  const k = Math.min((bw * fit) / extentX, (bh * fit) / extentY);
  return (
    <g transform={`translate(${cx} ${cy + hh * k * 0.5})`}>
      <IsoPart kind={(kind as PartKind) in PART_DEFS ? (kind as PartKind) : 'board'} k={k} u={k / 20} frame={frame} fp={[-w / 2, -d / 2, w, d, hh0]} sig={{led: 1, servo: 40 + 40 * Math.sin(frame * 0.1), light: 'green', fanSpeed: 0, fan: frame * 6}} />
    </g>
  );
};

const LessonCarousel: React.FC<Props> = ({items, start, activeAt, scrollAt, scrollBy, completed, accent, cursor, background, heading, preview, visible}) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const n = items.length;
  const vis = Math.max(1, Math.min(n, visible > 0 ? visible : portrait ? 3 : 5));
  const gap = w * 0.012;
  const stripX = w * 0.1;
  const winW = w * 0.8;
  const cardW = (winW - (vis - 1) * gap) / vis;
  const cardH = cardW * (portrait ? 0.95 : 0.78);
  const stripY = h - cardH - h * (portrait ? 0.09 : 0.1);
  const arrowR = Math.min(w * 0.03, 30 * u);
  const maxFirst = Math.max(0, n - vis);

  // events
  type Ev = {f: number; type: 'active' | 'scroll'};
  const evs: Ev[] = [...activeAt.map((f) => ({f, type: 'active' as const})), ...scrollAt.map((f) => ({f, type: 'scroll' as const}))].sort((a, b) => a.f - b.f);
  let active = start;
  let target = 0;
  let prevTarget = 0;
  let scrollF = -999;
  const doneAt = new Map<number, number>(); // index -> frame it completed
  const activeChangeF: number[] = [-999];
  completed.forEach((c) => doneAt.set(c, -999));
  // state at the current frame
  for (const e of evs) {
    if (frame < e.f) continue;
    if (e.type === 'active') {
      doneAt.set(active, e.f);
      active = Math.min(n - 1, active + 1);
      activeChangeF.push(e.f);
    } else {
      prevTarget = target;
      target = cl(target + scrollBy, 0, maxFirst);
      scrollF = e.f;
    }
  }
  const curTargets: {f: number; x: number; y: number}[] = [];
  const cardX = (i: number, pos: number) => stripX + (i - pos) * (cardW + gap);
  // cursor script: targets depend on the strip position at the time of each event
  {
    let pos = 0;
    let act = start;
    curTargets.length = 0;
    for (const e of evs) {
      if (e.type === 'scroll') {
        curTargets.push({f: e.f, x: stripX + winW + arrowR * 1.6, y: stripY + cardH / 2});
        pos = cl(pos + scrollBy, 0, maxFirst);
      } else {
        const i = Math.min(n - 1, act + 1);
        curTargets.push({f: e.f, x: cardX(i, pos) + cardW * 0.5, y: stripY + cardH * 0.45});
        act = i;
      }
    }
  }
  const pos = prevTarget + (target - prevTarget) * easeInOutCubic(lin(frame, scrollF, scrollF + 9));
  const lastActiveF = activeChangeF[activeChangeF.length - 1];

  // cursor path
  let cx = w * 0.62;
  let cy = h * 0.5;
  let press = 1;
  if (cursor && curTargets.length) {
    let from = {x: w * 0.62, y: h * 0.42};
    for (let i = 0; i < curTargets.length; i++) {
      const ct = curTargets[i];
      const t0 = ct.f - 16;
      const t1 = ct.f - 1;
      if (frame < t0) break;
      const t = easeInOutCubic(lin(frame, t0, t1));
      cx = from.x + (ct.x - from.x) * t;
      cy = from.y + (ct.y - from.y) * t;
      if (frame >= ct.f && frame < ct.f + 3) press = 0.92;
      from = {x: ct.x, y: ct.y};
    }
    if (frame < curTargets[0].f - 16) {
      cx = from.x;
      cy = from.y;
    }
  }
  const cursorAlpha = cursor && curTargets.length ? lin(frame, curTargets[0].f - 22, curTargets[0].f - 16) : 0;

  const fs = Math.min(cardW * 0.1, 26 * u * 1.3);
  const doneCount = items.filter((_, i) => (doneAt.get(i) ?? 1e9) <= frame).length;
  const pvTop = h * 0.12;
  const pvH = stripY - pvTop - h * 0.09;
  const pvK = pvH * 0.3;
  const pvT = lin(frame, lastActiveF, lastActiveF + 8);
  const pvScale = lastActiveF < 0 ? 1 : 0.88 + 0.12 * easeOutCubic(pvT);
  const aItem = items[active];

  return (
    <AbsoluteFill style={{background}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="lc-clip">
            <rect x={stripX - 4 * u} y={stripY - 10 * u} width={winW + 8 * u} height={cardH + 20 * u} />
          </clipPath>
        </defs>
        {/* heading */}
        <text x={w * 0.05} y={h * 0.085} fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={h * (portrait ? 0.022 : 0.04)} letterSpacing={h * 0.003} fill={ISO.text}>
          {heading.toUpperCase()}
        </text>
        <g transform={`translate(${w * 0.95} ${h * 0.082})`}>
          <text textAnchor="end" fontFamily={x58Fonts.mono} fontSize={h * (portrait ? 0.015 : 0.024)} fill={ISO.muted}>
            {doneCount}/{n} COMPLETE
          </text>
        </g>
        {/* preview */}
        {preview ? (
          <g transform={`translate(${w / 2} ${pvTop + pvH / 2}) scale(${pvScale})`} opacity={cl(0.25 + pvT * 0.75 + (lastActiveF < 0 ? 1 : 0))}>
            <ellipse cx={0} cy={pvH * 0.3} rx={pvH * 0.7} ry={pvH * 0.2} fill={ISO.grid} opacity={0.7} />
            <Thumb kind={aItem?.thumb ?? 'board'} cx={0} cy={0} bw={pvH * 1.8} bh={pvH} frame={frame} fit={0.95} />
            <text x={0} y={pvH / 2 + pvK * 0.5} textAnchor="middle" fontFamily={x58Fonts.barlowSC} fontWeight={700} fontSize={pvK * 0.3} letterSpacing={pvK * 0.03} fill={ISO.text}>
              {(aItem?.label ?? '').toUpperCase()}
            </text>
          </g>
        ) : null}
        {/* strip */}
        <g clipPath="url(#lc-clip)">
          {items.map((it, i) => {
            const x = cardX(i, pos);
            if (x > stripX + winW + 10 || x + cardW < stripX - 10) return null;
            const isActive = i === active;
            const since = isActive ? lin(frame, lastActiveF, lastActiveF + 3) : 0;
            const df = doneAt.get(i);
            const isDone = df !== undefined && frame >= df;
            const badge = isDone ? pop(frame, df! + 1, 6, 1.15) : 0;
            const lines = wrap(`${i + 1}. ${it.label.toUpperCase()}`, Math.max(8, Math.floor(cardW / (fs * 0.62)) - 2)).map((l, li, arr) => (li === arr.length - 1 ? `${l} ›` : l));
            return (
              <g key={i} transform={`translate(${x} ${stripY})`}>
                <rect width={cardW} height={cardH} rx={cardW * 0.035} fill="#FBF7EC" stroke={ISO.border} strokeWidth={1.5 * u} />
                {isActive ? <rect width={cardW} height={cardH} rx={cardW * 0.035} fill="none" stroke={accent} strokeWidth={3 * u} opacity={since} /> : null}
                <Thumb kind={it.thumb ?? 'board'} cx={cardW / 2} cy={cardH * 0.4} bw={cardW} bh={cardH * 0.62} frame={frame} />
                {lines.slice(0, 2).map((ln, j) => (
                  <text key={j} x={cardW * 0.07} y={cardH * 0.78 + j * fs * 1.25 + fs * 0.4} fontFamily={x58Fonts.barlowSC} fontWeight={isActive ? 700 : 500} fontSize={fs} letterSpacing={fs * 0.05} fill={isActive ? ISO.text : ISO.muted}>
                    {ln}
                  </text>
                ))}
                {badge > 0 ? (
                  <g transform={`translate(${cardW - cardW * 0.07} ${cardW * 0.07}) scale(${badge})`}>
                    <circle r={cardW * 0.055} fill={accent} />
                    <path d={`M${-cardW * 0.026} ${cardW * 0.002} L${-cardW * 0.006} ${cardW * 0.024} L${cardW * 0.03} ${-cardW * 0.022}`} fill="none" stroke="#fff" strokeWidth={cardW * 0.016} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>
        {/* arrows */}
        {[-1, 1].map((dir) => {
          const ax = dir < 0 ? stripX - arrowR * 1.6 : stripX + winW + arrowR * 1.6;
          const can = dir < 0 ? pos > 0.01 : pos < maxFirst - 0.01;
          return (
            <g key={dir} transform={`translate(${ax} ${stripY + cardH / 2})`} opacity={can ? 1 : 0.35}>
              <circle r={arrowR} fill="#FBF7EC" stroke={ISO.border} strokeWidth={1.5 * u} />
              <path d={`M${-dir * arrowR * 0.2} ${-arrowR * 0.4} L${dir * arrowR * 0.25} 0 L${-dir * arrowR * 0.2} ${arrowR * 0.4}`} fill="none" stroke={ISO.text} strokeWidth={2.4 * u} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
        {/* cursor */}
        {cursor && cursorAlpha > 0 ? (
          <g transform={`translate(${cx} ${cy}) scale(${press * u * 1.1})`} opacity={cursorAlpha}>
            <path d="M0 0 L0 24 L6 18.5 L10.5 28 L14.5 26.2 L10 17 L18 17 Z" fill="#1C253B" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export const lessonCarousel = defineMotion<Props>({
  id: 'lesson-carousel',
  title: 'Lesson carousel',
  category: 'ui',
  description:
    'Course / playlist navigation: a bottom strip of lesson cards with isometric part thumbnails and labels like "3. READ A SENSOR ›", teal check badges popping on completed lessons, a teal outline on the active card, arrow buttons that slide the strip by three cards, and a cursor that clicks the next card. A big preview of the active lesson sits above the strip.',
  source: ['video x8 0:00.9, 0:06.7-0:07.0, 0:20.1, 0:29, 0:37.9, 0:53.7'],
  useFor: 'Course / playlist / step navigation in app promos; a chapter selector at the bottom of an explainer.',
  durationInFrames: 180,
  defaultProps: {
    items: DEFAULT_ITEMS,
    start: 1,
    activeAt: [48, 140],
    scrollAt: [94],
    scrollBy: 3,
    completed: [0],
    accent: ISO.teal,
    cursor: true,
    background: ISO.paper,
    heading: 'Basics',
    preview: true,
    visible: 0,
  },
  propDocs: {
    items: 'array of {label, thumb}; thumb = part kind: board led button sensor motor servo light car wall resistor breadboard ball',
    start: 'index of the initially active lesson',
    activeAt: 'frames at which the cursor clicks the next lesson (active moves +1, previous gets a check)',
    scrollAt: 'frames at which the cursor clicks the right arrow and the strip scrolls',
    scrollBy: 'cards per scroll',
    completed: 'indices that already carry the check badge',
    accent: 'teal accent (outline, badge)',
    cursor: 'show the cursor that clicks',
    background: 'paper colour',
    heading: 'heading word at the top left',
    preview: 'show the large preview of the active lesson above the strip',
    visible: 'cards visible in the strip (0 = auto: 5 landscape, 3 portrait)',
  },
  component: LessonCarousel,
  tags: ['carousel', 'lessons', 'course', 'playlist', 'chapters', 'cards', 'strip', 'cursor', 'click', 'check-badge', 'progress', 'isometric', 'thumbnails', 'onboarding', 'ui', 'navigation', 'tutorial'],
});
