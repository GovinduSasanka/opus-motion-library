import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, ease, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {Chip, DemoScreen, DemoTone, DEMO, Pt, Stroke, jitter, lineD, quadPts, smoothD, textW, useExit, useNorm, tidy} from '../../core/r3-annot-kit';
import {Svg} from '../../core/stage';
import {defineMotion} from '../../core/types';

/**
 * Tutorial overlay: a hand-drawn label pops, a sketchy pen arrow (double pass, slightly wobbling) draws from it to a
 * target point on the footage, the arrow head is scribbled on and a few impact ticks flick off the tip.
 * Transparent by default: drop it on any screen recording. Positions are 0-1 fractions of the frame.
 */
type Callout = {
  /** target point (0-1) the arrow points at */
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  /** label centre (0-1); default sits up-left of the target */
  lx?: number;
  ly?: number;
  /** arrow bow, -0.5..0.5 of the length (default alternates) */
  curve?: number;
  /** per-callout arrow colour */
  color?: string;
  /** frame the callout starts at (default startAt + i * stagger) */
  at?: number;
};

type Props = {
  callouts: Callout[];
  color: string;
  labelBg: string;
  labelInk: string;
  labelStyle: 'sticker' | 'underline' | 'plain';
  fontFamily: string;
  labelSize: number;
  strokeWidth: number;
  boil: boolean;
  startAt: number;
  stagger: number;
  speed: number;
  exitAt: number;
  seed: number;
  demoBackground: boolean;
  demoTone: DemoTone;
};

const HandDrawnArrowCallout: React.FC<Props> = ({callouts, color, labelBg, labelInk, labelStyle, fontFamily, labelSize, strokeWidth, boil, startAt, stagger, speed, exitAt, seed, demoBackground, demoTone}) => {
  const frame = useCurrentFrame();
  const {w, h, u, px} = useNorm();
  const out = useExit(frame, exitAt);
  const sp = Math.max(0.2, speed);
  const bf = boil ? Math.floor(frame / 3) * 0.6 : 0;
  const fs = labelSize * u;
  const sw = strokeWidth * u;

  return (
    <AbsoluteFill>
      <DemoScreen show={demoBackground} tone={demoTone} />
      <Svg>
        {callouts.map((c, i) => {
          const at = (c.at ?? startAt + i * stagger);
          const f = (frame - at) * sp;
          if (f < 0) return null;
          const col = c.color ?? color;
          const T = px(c.x, c.y);
          // label geometry
          const lw = Math.max(textW(c.label, fs, 0.44), c.sublabel ? textW(c.sublabel, fs * 0.62, 0.44) : 0) + fs * 0.9;
          const lh = fs * (c.sublabel ? 1.75 : 1.2) + fs * 0.2;
          const lxn = c.lx ?? clamp(c.x - 0.17, 0.03, 0.97);
          const lyn = c.ly ?? clamp(c.y - 0.13, 0.04, 0.96);
          const Lc: Pt = [clamp(lxn * w, lw / 2 + 12 * u, w - lw / 2 - 12 * u), clamp(lyn * h, lh / 2 + 12 * u, h - lh / 2 - 12 * u)];
          const dx = T[0] - Lc[0];
          const dy = T[1] - Lc[1];
          const dist = Math.hypot(dx, dy) || 1;
          const ux = dx / dist;
          const uy = dy / dist;
          const hx = lw / 2;
          const hy = lh / 2;
          const exit = Math.min(hx / Math.max(Math.abs(ux), 1e-4), hy / Math.max(Math.abs(uy), 1e-4));
          const S: Pt = [Lc[0] + ux * (exit + 10 * u), Lc[1] + uy * (exit + 10 * u)];
          const E: Pt = [T[0] - ux * 16 * u, T[1] - uy * 16 * u];
          const len = Math.hypot(E[0] - S[0], E[1] - S[1]);
          const bow = (c.curve ?? (i % 2 ? -0.2 : 0.22)) * len;
          const mid: Pt = [(S[0] + E[0]) / 2 - uy * bow, (S[1] + E[1]) / 2 + ux * bow];
          const base = quadPts(S, mid, E, 26);
          const seedA = `hda${seed}-${i}`;
          const d1 = smoothD(jitter(base, seedA, 2.2 * u, bf));
          const d2 = smoothD(jitter(base, seedA + 'b', 3.4 * u, bf + 3));
          // tangent at the end for the head
          const p1 = base[base.length - 2];
          const p2 = base[base.length - 1];
          const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
          const headLen = Math.min(30 * u, len * 0.5);
          const head = (sgn: number, s: string): string => {
            const a = ang + Math.PI + sgn * 0.5;
            const q: Pt = [E[0] + Math.cos(a) * headLen, E[1] + Math.sin(a) * headLen];
            const mp: Pt = [(E[0] + q[0]) / 2 + Math.sin(a) * 2.5 * u, (E[1] + q[1]) / 2 - Math.cos(a) * 2.5 * u];
            return smoothD(jitter(quadPts(E, mp, q, 5), s, 1.3 * u, bf));
          };
          const tLabel = ease.back(prog(f, 0, 10, (x) => x));
          const tShaft = prog(f, 5, 26, ease.out);
          const tHead = prog(f, 23, 31, ease.out);
          const tTick = prog(f, 27, 38, ease.out);
          const rot = ((i * 37) % 7 - 3) * 0.9;
          const sx = 1;
          return (
            <g key={i} opacity={out}>
              {/* arrow */}
              <Stroke d={d2} color={col} width={sw * 0.55} t={tShaft} halo={0.25} opacity={0.65} />
              <Stroke d={d1} color={col} width={sw} t={tShaft} />
              <Stroke d={head(1, seedA + 'h1')} color={col} width={sw} t={tHead} />
              <Stroke d={head(-1, seedA + 'h2')} color={col} width={sw} t={tHead} />
              {/* impact ticks */}
              {[-0.9, 0, 0.9].map((o, k) => {
                const a = ang + o * 0.9;
                const r0 = 14 * u + tTick * 6 * u;
                const r1 = r0 + 14 * u * (1 - Math.abs(o) * 0.25);
                const tp: Pt = [T[0] + Math.cos(a) * r0 * 0.9, T[1] + Math.sin(a) * r0 * 0.9];
                const tq: Pt = [T[0] + Math.cos(a) * r1, T[1] + Math.sin(a) * r1];
                return <Stroke key={k} d={lineD([tp, tq])} color={col} width={sw * 0.7} t={tTick} halo={0.3} opacity={1 - Math.max(0, tTick - 0.7) * 2} />;
              })}
              {/* label */}
              <g transform={`translate(${Lc[0]} ${Lc[1]}) rotate(${rot}) scale(${Math.max(0, tLabel) * sx})`} opacity={clamp(f / 4)}>
                {labelStyle === 'sticker' && (
                  <>
                    <rect x={-hx + 5 * u} y={-hy + 6 * u} width={lw} height={lh} rx={10 * u} fill="rgba(0,0,0,0.28)" />
                    <rect x={-hx} y={-hy} width={lw} height={lh} rx={10 * u} fill={labelBg} />
                    <rect x={-hx + 4 * u} y={-hy + 4 * u} width={lw - 8 * u} height={lh - 8 * u} rx={7 * u} fill="none" stroke={labelInk} strokeOpacity={0.22} strokeWidth={1.5 * u} strokeDasharray={`${6 * u} ${5 * u}`} />
                  </>
                )}
                <text
                  x={0}
                  y={c.sublabel ? -fs * 0.1 : fs * 0.28}
                  textAnchor="middle"
                  fill={labelStyle === 'sticker' ? labelInk : labelBg}
                  stroke={labelStyle === 'sticker' ? 'none' : 'rgba(6,8,14,0.9)'}
                  strokeWidth={labelStyle === 'sticker' ? 0 : fs * 0.2}
                  paintOrder="stroke"
                  strokeLinejoin="round"
                  fontFamily={fontFamily}
                  fontWeight={700}
                  fontSize={fs}
                >
                  {c.label}
                </text>
                {c.sublabel && (
                  <text x={0} y={fs * 0.72} textAnchor="middle" fill={labelStyle === 'sticker' ? labelInk : '#fff'} fillOpacity={0.8} stroke={labelStyle === 'sticker' ? 'none' : 'rgba(6,8,14,0.9)'} strokeWidth={labelStyle === 'sticker' ? 0 : fs * 0.14} paintOrder="stroke" fontFamily={fontFamily} fontWeight={500} fontSize={fs * 0.62}>
                    {c.sublabel}
                  </text>
                )}
                {labelStyle === 'underline' && (
                  <Stroke d={smoothD(jitter([[-hx + 8 * u, hy - 2 * u], [-hx * 0.3, hy - 5 * u], [hx * 0.3, hy - 1 * u], [hx - 8 * u, hy - 4 * u]], seedA + 'u', 1.5 * u, 0)) } color={col} width={sw * 0.8} t={prog(f, 8, 20, ease.out)} />
                )}
              </g>
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

export const handDrawnArrowCallout = defineMotion<Props>({
  id: 'hand-drawn-arrow-callout',
  title: 'Hand-drawn arrow callout',
  category: 'hud',
  description:
    'Tutorial annotation overlay on a transparent background: a handwritten label pops, a sketchy double-pass pen arrow draws from it to a target point with a scribbled head and impact ticks. Several callouts run in sequence; positions are 0-1 fractions of the frame.',
  source: ['screen-recording tutorial annotation'],
  useFor: 'Point at a button, field or number in any screen recording or tutorial ("click here", "watch this"): pass `callouts` with the target x/y and your own label text.',
  durationInFrames: 180,
  defaultProps: tidy({
    callouts: [
      {x: DEMO.button.x + DEMO.button.w / 2, y: DEMO.button.y + DEMO.button.h, label: 'Click here', lx: 0.72, ly: 0.2, curve: 0.22},
      {x: 0.34, y: 0.41, label: 'Watch this bar', sublabel: 'it jumps after the update', lx: 0.2, ly: 0.64, curve: -0.2},
      {x: DEMO.save.x + 0.01, y: DEMO.save.y + DEMO.save.h / 2, label: 'Then save', lx: 0.52, ly: 0.86, curve: 0.2},
    ],
    color: '#FF4B3E',
    labelBg: '#FFE14D',
    labelInk: '#15171C',
    labelStyle: 'sticker',
    fontFamily: fonts.hand,
    labelSize: 62,
    strokeWidth: 6,
    boil: true,
    startAt: 8,
    stagger: 48,
    speed: 1,
    exitAt: 0,
    seed: 3,
    demoBackground: false,
    demoTone: 'light',
  }),
  propDocs: {
    callouts: 'array of {x, y, label, sublabel?, lx?, ly?, curve?, color?, at?}: x/y = target (0-1), lx/ly = label centre (0-1), at = start frame',
    color: 'arrow colour',
    labelBg: 'sticker fill (or text colour for plain/underline)',
    labelInk: 'sticker text colour',
    labelStyle: 'sticker | underline | plain',
    fontFamily: 'CSS font-family for labels (default handwriting)',
    labelSize: 'label font size in u',
    strokeWidth: 'pen width in u',
    boil: 'redraw the wobble on threes (hand-drawn boil)',
    startAt: 'frame of the first callout',
    stagger: 'frames between callouts',
    speed: 'animation speed multiplier',
    exitAt: 'frame everything fades at (0 = just before the end)',
    seed: 'wobble seed',
    demoBackground: 'true paints a neutral mock screen behind (previews); false = transparent overlay',
    demoTone: 'light | dark mock screen',
  },
  component: HandDrawnArrowCallout,
  tags: ['arrow', 'callout', 'annotation', 'tutorial', 'screen recording', 'hand-drawn', 'overlay', 'pointer', 'label', 'sketch'],
});
