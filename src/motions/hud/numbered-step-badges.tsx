import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Chip, DemoScreen, DemoTone, DEMO, Pt, quadPts, smoothD, useExit, useNorm} from '../../core/r3-annot-kit';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tutorial overlay: numbered badges (1, 2, 3 ...) pop onto points of the footage one after another with a pulse ring,
 * a dotted path draws from each badge to the next and a short caption chip rides beside it. Transparent by default;
 * points are 0-1 fractions of the frame.
 */
type Step = {
  x: number;
  y: number;
  /** caption beside the badge (optional) */
  label?: string;
  /** override the number / text inside the badge */
  n?: string | number;
  /** caption side: 'auto' | 'left' | 'right' | 'top' | 'bottom' */
  side?: 'auto' | 'left' | 'right' | 'top' | 'bottom';
  at?: number;
};
type Props = {
  steps: Step[];
  badgeStyle: 'circle' | 'pin' | 'square';
  size: number;
  connect: boolean;
  accent: string;
  badgeInk: string;
  labelBg: string;
  labelInk: string;
  fontFamily: string;
  firstNumber: number;
  startAt: number;
  stagger: number;
  speed: number;
  exitAt: number;
  demoBackground: boolean;
  demoTone: DemoTone;
};

const NumberedStepBadges: React.FC<Props> = ({steps, badgeStyle, size, connect, accent, badgeInk, labelBg, labelInk, fontFamily, firstNumber, startAt, stagger, speed, exitAt, demoBackground, demoTone}) => {
  const frame = useCurrentFrame();
  const {w, h, u, px} = useNorm();
  const out = useExit(frame, exitAt);
  const sp = Math.max(0.2, speed);
  const R = (size / 2) * u;
  const atOf = (i: number) => steps[i].at ?? startAt + i * stagger;
  const pinLift = badgeStyle === 'pin' ? R * 1.75 : 0;
  const centre = (i: number): Pt => {
    const p = px(steps[i].x, steps[i].y);
    return [p[0], p[1] - pinLift];
  };

  return (
    <AbsoluteFill>
      <DemoScreen show={demoBackground} tone={demoTone} />
      <Svg>
        <defs>
          <filter id="nsb-shadow" x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy={4 * u} stdDeviation={5 * u} floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>
        {/* dotted path between consecutive badges */}
        {connect &&
          steps.map((_, i) => {
            if (i === 0) return null;
            const a = centre(i - 1);
            const b = centre(i);
            const f = (frame - atOf(i)) * sp;
            const t = prog(f, -14, 4, ease.inOut);
            if (t <= 0.001) return null;
            const dx = b[0] - a[0];
            const dy = b[1] - a[1];
            const L = Math.hypot(dx, dy) || 1;
            const ux = dx / L;
            const uy = dy / L;
            const A: Pt = [a[0] + ux * (R + 8 * u), a[1] + uy * (R + 8 * u)];
            const B: Pt = [b[0] - ux * (R + 8 * u), b[1] - uy * (R + 8 * u)];
            const bow = (i % 2 ? -0.12 : 0.12) * L;
            const mid: Pt = [(A[0] + B[0]) / 2 - uy * bow, (A[1] + B[1]) / 2 + ux * bow];
            const d = smoothD(quadPts(A, mid, B, 18));
            return (
              <g key={`c${i}`} opacity={out}>
                <mask id={`nsb-m${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
                  <path d={d} fill="none" stroke="#fff" strokeWidth={30 * u} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t)} />
                </mask>
                <g mask={`url(#nsb-m${i})`}>
                  <path d={d} fill="none" stroke="rgba(6,8,14,0.45)" strokeWidth={8 * u} strokeLinecap="round" strokeDasharray={`0.1 ${14 * u}`} />
                  <path d={d} fill="none" stroke={accent} strokeWidth={4.5 * u} strokeLinecap="round" strokeDasharray={`0.1 ${14 * u}`} />
                </g>
              </g>
            );
          })}
        {steps.map((s, i) => {
          const f = (frame - atOf(i)) * sp;
          if (f < 0) return null;
          const [cx, cy] = centre(i);
          const pp = px(s.x, s.y);
          const tp = clamp(ease.back(clamp(f / 10)) , 0, 1.4);
          const ring = prog(f, 4, 22, ease.out);
          const num = s.n ?? firstNumber + i;
          const fsN = R * 1.05;
          const side = s.side && s.side !== 'auto' ? s.side : s.x > 0.68 ? 'left' : 'right';
          const fsL = Math.max(22, size * 0.46) * u;
          const lw = (s.label ?? '').length * fsL * 0.58 + fsL * 1.4;
          let lx = cx;
          let ly = cy;
          let anchor: 'start' | 'middle' | 'end' = 'start';
          if (side === 'right') {
            lx = cx + R + 14 * u;
          } else if (side === 'left') {
            lx = cx - R - 14 * u;
            anchor = 'end';
          } else if (side === 'top') {
            ly = cy - R - 30 * u - (badgeStyle === 'pin' ? 0 : 0);
            anchor = 'middle';
          } else {
            ly = cy + R + 34 * u;
            anchor = 'middle';
          }
          void lw;
          const tl = prog(f, 8, 20, ease.back);
          return (
            <g key={i} opacity={out}>
              {/* pulse ring */}
              <circle cx={pp[0]} cy={pp[1]} r={R * (0.8 + ring * 1.2)} fill="none" stroke={accent} strokeWidth={4 * u * (1 - ring)} opacity={(1 - ring) * 0.9} />
              <g transform={`translate(${pp[0]} ${pp[1]}) scale(${tp}) translate(${-pp[0]} ${-pp[1]})`} filter="url(#nsb-shadow)">
                {badgeStyle === 'pin' && (() => {
                  const c0: [number, number] = [pp[0], pp[1] - R * 1.75];
                  const tx = R * 0.809;
                  const ty = R * 0.588;
                  return <path d={`M${pp[0]} ${pp[1]} L${c0[0] - tx} ${c0[1] + ty} A${R} ${R} 0 1 1 ${c0[0] + tx} ${c0[1] + ty} Z`} fill={accent} stroke="#fff" strokeWidth={3.5 * u} strokeLinejoin="round" />;
                })()}
                {badgeStyle === 'circle' && <circle cx={cx} cy={cy} r={R} fill={accent} stroke="#fff" strokeWidth={4 * u} />}
                {badgeStyle === 'square' && <rect x={cx - R} y={cy - R} width={R * 2} height={R * 2} rx={R * 0.34} fill={accent} stroke="#fff" strokeWidth={4 * u} />}
                <text x={cx} y={cy + fsN * 0.36} textAnchor="middle" fill={badgeInk} fontFamily={fontFamily} fontWeight={800} fontSize={fsN}>
                  {String(num)}
                </text>
              </g>
              {s.label && (
                <Chip x={lx} y={ly} text={s.label} fs={fsL} bg={labelBg} ink={labelInk} font={fontFamily} anchor={anchor} scale={tl} opacity={clamp(tl)} />
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const numberedStepBadges = defineMotion<Props>({
  id: 'numbered-step-badges',
  title: 'Numbered step badges',
  category: 'hud',
  description:
    'Tutorial overlay on a transparent background: numbered badges (1, 2, 3 ...) pop onto points of the footage one after another with a pulse ring and a caption chip, linked by a dotted path that draws on between them. Circle, map-pin or rounded-square badges.',
  source: ['screen-recording tutorial annotation'],
  useFor: 'Number the steps of a how-to on top of a screen recording or screenshot ("1 pick a file, 2 choose a format, 3 export"): pass `steps` with x/y points and your own captions.',
  durationInFrames: 180,
  defaultProps: {
    steps: [
      {x: DEMO.search.x + 0.04, y: DEMO.search.y + DEMO.search.h / 2, label: 'Search for a file'},
      {x: 0.55, y: 0.3, label: 'Pick a chart', side: 'left'},
      {x: DEMO.stat2.x + 0.06, y: DEMO.stat2.y + 0.09, label: 'Check the totals'},
      {x: DEMO.save.x + DEMO.save.w / 2, y: DEMO.save.y + DEMO.save.h / 2, label: 'Save it'},
    ],
    badgeStyle: 'circle',
    size: 64,
    connect: true,
    accent: '#2F6BFF',
    badgeInk: '#FFFFFF',
    labelBg: '#12151C',
    labelInk: '#FFFFFF',
    fontFamily: fonts.sans,
    firstNumber: 1,
    startAt: 8,
    stagger: 36,
    speed: 1,
    exitAt: 0,
    demoBackground: false,
    demoTone: 'light',
  },
  propDocs: {
    steps: 'array of {x, y (0-1 point), label?, n? (badge text), side?: auto|left|right|top|bottom, at?}',
    badgeStyle: 'circle | pin | square',
    size: 'badge diameter in u',
    connect: 'draw a dotted path between consecutive badges',
    accent: 'badge fill and path colour',
    badgeInk: 'number colour',
    labelBg: 'caption chip fill',
    labelInk: 'caption chip text colour',
    fontFamily: 'CSS font-family for numbers and captions',
    firstNumber: 'number of the first badge',
    startAt: 'frame of the first badge',
    stagger: 'frames between badges',
    speed: 'animation speed multiplier',
    exitAt: 'frame everything fades at (0 = just before the end)',
    demoBackground: 'true paints a neutral mock screen behind (previews); false = transparent overlay',
    demoTone: 'light | dark mock screen',
  },
  component: NumberedStepBadges,
  tags: ['steps', 'numbered', 'badges', 'step by step', 'how-to', 'annotation', 'tutorial', 'screen recording', 'overlay', 'markers', 'sequence'],
});
