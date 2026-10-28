import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Chip, DemoScreen, DemoTone, DEMO, Pt, Stroke, fmtTime, lineD, useExit, useNorm} from '../../core/r3-annot-kit';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tutorial overlay: where and when the user clicked. Concentric rings ripple out of each click point, a dot stays
 * behind, and a small chip names the click with its timestamp (m:ss.d from the video start). Single, double and
 * right clicks have their own ripple. Transparent by default; points are 0-1 fractions of the frame.
 */
type Click = {
  x: number;
  y: number;
  /** frame of the click (default startAt + i * stagger) */
  at?: number;
  kind?: 'click' | 'double' | 'right';
  /** chip text (default "Click" / "Double click" / "Right click") */
  label?: string;
  /** timestamp text override (default derived from `at`) */
  time?: string;
};
type Props = {
  clicks: Click[];
  timestamps: boolean;
  keep: 'all' | 'last' | 'none';
  trail: boolean;
  cursor: boolean;
  size: number;
  color: string;
  accent: string;
  labelBg: string;
  labelInk: string;
  fontFamily: string;
  startAt: number;
  stagger: number;
  speed: number;
  exitAt: number;
  demoBackground: boolean;
  demoTone: DemoTone;
};

const NAMES = {click: 'Click', double: 'Double click', right: 'Right click'} as const;

const ClickRippleMarkers: React.FC<Props> = ({clicks, timestamps, keep, trail, cursor, size, color, accent, labelBg, labelInk, fontFamily, startAt, stagger, speed, exitAt, demoBackground, demoTone}) => {
  const frame = useCurrentFrame();
  const {w, h, u, px, fps} = useNorm();
  const out = useExit(frame, exitAt);
  const sp = Math.max(0.2, speed);
  const R = size * u;
  const atOf = (i: number) => clicks[i].at ?? startAt + i * stagger;
  // index of the latest click that has happened
  let last = -1;
  clicks.forEach((_, i) => {
    if (frame >= atOf(i)) last = i;
  });

  return (
    <AbsoluteFill>
      <DemoScreen show={demoBackground} tone={demoTone} />
      <Svg>
        {/* trail between clicks */}
        {trail &&
          clicks.map((_, i) => {
            if (i === 0) return null;
            const a = px(clicks[i - 1].x, clicks[i - 1].y);
            const b = px(clicks[i].x, clicks[i].y);
            const t = prog(frame, atOf(i) - 22 / sp, atOf(i) - 2, ease.inOut);
            if (t <= 0.001) return null;
            const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
            return <Stroke key={`t${i}`} d={lineD([a, b])} color={color} width={3 * u} t={t} dash={`${2 * u} ${14 * u}`} opacity={out * 0.9 * (L > 10 ? 1 : 0)} halo={0.25} />;
          })}
        {clicks.map((c, i) => {
          const f = (frame - atOf(i)) * sp;
          if (f < 0) return null;
          const p = px(c.x, c.y);
          const kind = c.kind ?? 'click';
          const col = kind === 'right' ? accent : color;
          const hits = kind === 'double' ? [0, 9] : [0];
          // persistence of the dot / chip after the ripple
          const nextAt = i < clicks.length - 1 ? atOf(i + 1) : Infinity;
          const age = Math.max(0, last - i);
          const dimTo = keep === 'all' ? 0.5 : 0;
          let fade = 1;
          if (keep === 'none') fade = 1 - prog(f, 40, 56, ease.in);
          else if (i < last) fade = 1 - prog(frame, nextAt, nextAt + 12, ease.out) * (1 - dimTo);
          const dotPop = ease.back(clamp(f / 7));
          const press = 1 - 0.22 * Math.sin(clamp(f / 8) * Math.PI);
          const chipT = prog(f, 5, 16, ease.back);
          const fs = Math.max(20, size * 0.4) * u;
          const text = c.label ?? NAMES[kind];
          const stamp = c.time ?? fmtTime(atOf(i), fps);
          const right = c.x < 0.68;
          const chipX = p[0] + (right ? 1 : -1) * (R * 0.55 + 14 * u);
          const chipY = p[1] + R * 0.95 + 8 * u > h - 40 * u ? p[1] - R * 0.95 - 8 * u : p[1] + R * 0.95 + 8 * u;
          return (
            <g key={i} opacity={out * fade}>
              {hits.map((d, k) => {
                const ff = f - d;
                const t1 = prog(ff, 0, 22, ease.out);
                const t2 = prog(ff, 5, 26, ease.out);
                return (
                  <g key={k}>
                    {ff >= 0 && ff < 30 && <circle cx={p[0]} cy={p[1]} r={R * (0.25 + t1 * 0.85)} fill="none" stroke={col} strokeWidth={Math.max(0.5, 7 * u * (1 - t1))} opacity={1 - t1} />}
                    {ff >= 5 && ff < 30 && <circle cx={p[0]} cy={p[1]} r={R * (0.2 + t2 * 0.6)} fill="none" stroke={col} strokeWidth={Math.max(0.5, 4 * u * (1 - t2))} opacity={(1 - t2) * 0.8} />}
                    {ff >= 0 && ff < 8 && <circle cx={p[0]} cy={p[1]} r={R * 0.5} fill={col} opacity={0.35 * (1 - ff / 8)} />}
                  </g>
                );
              })}
              {/* the marker dot that stays */}
              <circle cx={p[0]} cy={p[1]} r={13 * u * dotPop * press} fill="rgba(6,8,14,0.45)" />
              <circle cx={p[0]} cy={p[1]} r={9 * u * dotPop * press} fill={col} stroke="#fff" strokeWidth={3 * u} />
              {kind === 'right' && <circle cx={p[0]} cy={p[1]} r={R * 0.28} fill="none" stroke={col} strokeWidth={2 * u} strokeDasharray={`${5 * u} ${5 * u}`} opacity={clamp(f / 8) * 0.9} />}
              {cursor && (
                <g transform={`translate(${p[0]} ${p[1]}) scale(${u * 1.5 * press})`} opacity={clamp(f / 4)}>
                  <path d="M0 0 L0 20 L5.2 15.3 L8.6 23 L12 21.6 L8.7 14 L15.6 13.6 Z" fill="#fff" stroke="#12151C" strokeWidth={1.6} strokeLinejoin="round" />
                </g>
              )}
              <Chip x={chipX} y={chipY} text={timestamps ? `${text}  ${stamp}` : text} fs={fs} bg={labelBg} ink={labelInk} font={fontFamily} anchor={right ? 'start' : 'end'} scale={chipT} opacity={clamp(chipT)} k={0.6} />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const clickRippleMarkers = defineMotion<Props>({
  id: 'click-ripple-markers',
  title: 'Click ripple markers',
  category: 'hud',
  description:
    'Tutorial overlay on a transparent background: concentric rings ripple out of each click point, a dot stays behind and a chip names the click (click, double click, right click) with its timestamp; earlier clicks dim and an optional dotted trail links them.',
  source: ['screen-recording tutorial annotation'],
  useFor: 'Show exactly where and when something was clicked in a screen recording, UX test replay or bug report: pass `clicks` with x/y, the frame `at` and the `kind`.',
  durationInFrames: 180,
  defaultProps: {
    clicks: [
      {x: DEMO.button.x + DEMO.button.w / 2, y: DEMO.button.y + DEMO.button.h / 2, kind: 'click', at: 16},
      {x: 0.36, y: 0.33, kind: 'double', at: 64},
      {x: DEMO.save.x + DEMO.save.w / 2, y: DEMO.save.y + DEMO.save.h / 2, kind: 'right', at: 112},
    ],
    timestamps: true,
    keep: 'all',
    trail: true,
    cursor: false,
    size: 80,
    color: '#FF3B6B',
    accent: '#1FD1A5',
    labelBg: '#12151C',
    labelInk: '#FFFFFF',
    fontFamily: fonts.sans,
    startAt: 10,
    stagger: 44,
    speed: 1,
    exitAt: 0,
    demoBackground: false,
    demoTone: 'light',
  },
  propDocs: {
    clicks: 'array of {x, y (0-1 point), at? (frame), kind?: click|double|right, label?, time?}',
    timestamps: 'append the timestamp (m:ss.d from the video start) to each chip',
    keep: 'all = earlier clicks stay dimmed | last = only the latest | none = rings only',
    trail: 'dotted trail between consecutive clicks',
    cursor: 'draw a small pointer arrow at each click',
    size: 'ripple radius in u',
    color: 'click colour',
    accent: 'right-click colour',
    labelBg: 'chip fill',
    labelInk: 'chip text colour',
    fontFamily: 'CSS font-family for chips',
    startAt: 'default frame of the first click',
    stagger: 'default frames between clicks',
    speed: 'animation speed multiplier (ripple / pop timing)',
    exitAt: 'frame everything fades at (0 = just before the end)',
    demoBackground: 'true paints a neutral mock screen behind (previews); false = transparent overlay',
    demoTone: 'light | dark mock screen',
  },
  component: ClickRippleMarkers,
  tags: ['click', 'ripple', 'marker', 'timestamp', 'tap', 'annotation', 'tutorial', 'screen recording', 'overlay', 'ux test', 'interaction'],
});
